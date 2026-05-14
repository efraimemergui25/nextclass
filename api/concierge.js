/**
 * Vercel Serverless Function — AI Concierge proxy
 * POST /api/concierge
 *
 * Uses Groq (free tier, no credit card needed) or Anthropic as fallback.
 * Set GROQ_API_KEY in Vercel → Environment Variables (free at groq.com)
 */

import { logSecurityEvent } from './_logEvent.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
        logSecurityEvent('rate_limited', { endpoint: 'concierge', ip });
        return res.status(429).json({ error: 'Too many requests' });
    }

    const body = req.body ?? {};
    const { messages, systemPrompt } = body;

    // Payload guards
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'Missing messages' });
    if (messages.length > 20) return res.status(400).json({ error: 'Too many messages' });
    if (JSON.stringify(body).length > 32_000) return res.status(413).json({ error: 'Payload too large' });

    // Sanitise: truncate each message content
    const safeMessages = messages.map(m => ({
        role: String(m.role || 'user').slice(0, 10),
        content: String(m.content || '').slice(0, 2000),
    }));

    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!groqKey && !anthropicKey) {
        return res.status(200).json({ text: 'העוזר החכם אינו מוגדר. פנו אלינו בוואטסאפ לסיוע מיידי.' });
    }

    try {
        let text;
        if (groqKey) {
            text = await callGroq(groqKey, safeMessages, String(systemPrompt || '').slice(0, 1000));
        } else {
            text = await callAnthropic(anthropicKey, safeMessages, String(systemPrompt || '').slice(0, 1000));
        }
        res.status(200).json({ text });
    } catch (err) {
        console.error('[Concierge]', err.message);
        res.status(200).json({ text: 'שגיאה זמנית. נסו שוב בעוד רגע.' });
    }
}
