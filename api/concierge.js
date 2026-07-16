/**
 * Vercel Serverless Function — AI Concierge proxy ("NextClass AI")
 * POST /api/concierge
 *
 * Uses Google Gemini (gemini-2.5-flash) via the OpenAI compatibility layer.
 * Falls back to Groq or Anthropic if configured.
 *
 * Two response modes on the SAME endpoint:
 *   • { messages, systemPrompt }                → JSON  { text, response }   (unchanged contract)
 *   • { messages, systemPrompt, stream: true }  → Server-Sent Events stream of token deltas
 *
 * SSE frames (each `data:` line is standalone JSON):
 *   data: {"type":"delta","text":"<incremental token(s)>"}   ← 0..N of these
 *   data: {"type":"done","text":"<full assembled text>"}     ← exactly one, authoritative
 *   data: [DONE]                                             ← terminator
 * Comment pings (`: open`) may appear to flush/keep-alive; clients ignore non-`data:` lines.
 */

import { logSecurityEvent } from './_logEvent.js';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-2.5-flash';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

// ── Non-streaming provider calls ─────────────────────────────────────────────
async function callGemini(apiKey, messages, systemPrompt) {
    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            max_tokens: 600,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
}

async function callGroq(apiKey, messages, systemPrompt) {
    const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            max_tokens: 400,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(apiKey, messages, systemPrompt) {
    const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: 400,
            system: systemPrompt,
            messages,
        }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? '';
}

// ── SSE helpers ──────────────────────────────────────────────────────────────
function sseWrite(res, obj) {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

/**
 * Stream Gemini's token deltas straight to the client via the OpenAI-compat
 * `stream:true` mode, forwarding each `choices[0].delta.content` as an SSE
 * `delta` frame. Returns the fully assembled text.
 *
 * Throws ONLY when the upstream fails before any delta was emitted, so the
 * caller can fall back to a non-streaming provider cleanly. A mid-stream error
 * (after tokens were already sent) resolves with whatever text was collected.
 */
async function streamGeminiToClient(apiKey, messages, systemPrompt, res) {
    const upstream = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            max_tokens: 600,
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
        }),
    });
    if (!upstream.ok || !upstream.body) {
        throw new Error(`Gemini ${upstream.status}: ${upstream.ok ? 'no body' : await upstream.text()}`);
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let nl;
            while ((nl = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, nl).trim();
                buffer = buffer.slice(nl + 1);
                if (!line.startsWith('data:')) continue; // skip comments / blank lines
                const payload = line.slice(5).trim();
                if (payload === '[DONE]') return full;
                try {
                    const json = JSON.parse(payload);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        full += delta;
                        sseWrite(res, { type: 'delta', text: delta });
                    }
                } catch {
                    /* ignore keep-alive / partial JSON chunks */
                }
            }
        }
    } catch (err) {
        if (!full) throw err; // nothing salvageable → let caller fall back
    }
    return full;
}

// Simple in-memory rate limiter (per-IP, resets on cold start)
const rateLimitMap = new Map();
function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, reset: now + 60_000 };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
    entry.count++;
    rateLimitMap.set(ip, entry);
    return entry.count > 20; // max 20 requests per minute per IP
}

const NOT_CONFIGURED = 'העוזר החכם אינו מוגדר. פנו אלינו בוואטסאפ לסיוע מיידי.';
const TEMP_ERROR = 'שגיאה זמנית. נסו שוב בעוד רגע.';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
        logSecurityEvent('rate_limited', { endpoint: 'concierge', ip });
        return res.status(429).json({ error: 'Too many requests' });
    }

    const body = req.body ?? {};
    const { messages, systemPrompt } = body;
    const wantStream = body.stream === true;

    // Payload guards
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'Missing messages' });
    if (messages.length > 20) return res.status(400).json({ error: 'Too many messages' });
    if (JSON.stringify(body).length > 32_000) return res.status(413).json({ error: 'Payload too large' });

    // Sanitise: truncate each message content
    const safeMessages = messages.map(m => ({
        role: String(m.role || 'user').slice(0, 10),
        content: String(m.content || '').slice(0, 2000),
    }));
    const sysPrompt = String(systemPrompt || '').slice(0, 6000);

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // ── Streaming path (Server-Sent Events) ──────────────────────────────────
    if (wantStream) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // disable proxy buffering so tokens flush live
        });
        res.flushHeaders?.();
        res.write(': open\n\n'); // comment ping — flushes headers, opens the stream

        let full = '';
        try {
            if (geminiKey) {
                full = await streamGeminiToClient(geminiKey, safeMessages, sysPrompt, res);
                // Gemini streamed but produced nothing usable → fall back (non-streaming)
                if (!full && (groqKey || anthropicKey)) {
                    full = groqKey
                        ? await callGroq(groqKey, safeMessages, sysPrompt)
                        : await callAnthropic(anthropicKey, safeMessages, sysPrompt);
                    if (full) sseWrite(res, { type: 'delta', text: full });
                }
            } else if (groqKey) {
                full = await callGroq(groqKey, safeMessages, sysPrompt);
                if (full) sseWrite(res, { type: 'delta', text: full });
            } else if (anthropicKey) {
                full = await callAnthropic(anthropicKey, safeMessages, sysPrompt);
                if (full) sseWrite(res, { type: 'delta', text: full });
            } else {
                full = NOT_CONFIGURED;
                sseWrite(res, { type: 'delta', text: full });
            }
        } catch (err) {
            console.error('[Concierge stream]', err.message);
            // Gemini failed before emitting anything → non-streaming fallback chain
            try {
                if (groqKey) full = await callGroq(groqKey, safeMessages, sysPrompt);
                else if (anthropicKey) full = await callAnthropic(anthropicKey, safeMessages, sysPrompt);
            } catch (err2) {
                console.error('[Concierge stream fallback]', err2.message);
            }
            if (!full) full = TEMP_ERROR;
            sseWrite(res, { type: 'delta', text: full });
        }

        sseWrite(res, { type: 'done', text: full });
        res.write('data: [DONE]\n\n');
        res.end();
        return;
    }

    // ── Non-streaming path (JSON — unchanged contract) ───────────────────────
    if (!geminiKey && !groqKey && !anthropicKey) {
        return res.status(200).json({ text: NOT_CONFIGURED, response: NOT_CONFIGURED });
    }

    try {
        let text;
        if (geminiKey) {
            text = await callGemini(geminiKey, safeMessages, sysPrompt);
        } else if (groqKey) {
            text = await callGroq(groqKey, safeMessages, sysPrompt);
        } else {
            text = await callAnthropic(anthropicKey, safeMessages, sysPrompt);
        }
        res.status(200).json({ text, response: text });
    } catch (err) {
        console.error('[Concierge]', err.message);
        res.status(200).json({ text: TEMP_ERROR, response: TEMP_ERROR });
    }
}
