/**
 * Vercel Serverless Function — AI Concierge proxy
 * POST /api/concierge
 *
 * Uses Groq (free tier, no credit card needed) or Anthropic as fallback.
 * Set GROQ_API_KEY in Vercel → Environment Variables (free at groq.com)
 */

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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { messages, systemPrompt } = req.body ?? {};
    if (!messages?.length) return res.status(400).json({ error: 'Missing messages' });

    const groqKey = process.env.GROQ_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!groqKey && !anthropicKey) {
        return res.status(200).json({ text: 'העוזר החכם אינו מוגדר. פנו אלינו בוואטסאפ לסיוע מיידי.' });
    }

    try {
        let text;
        if (groqKey) {
            text = await callGroq(groqKey, messages, systemPrompt || '');
        } else {
            text = await callAnthropic(anthropicKey, messages, systemPrompt || '');
        }
        res.status(200).json({ text });
    } catch (err) {
        console.error('[Concierge]', err.message);
        res.status(200).json({ text: 'שגיאה זמנית. נסו שוב בעוד רגע.' });
    }
}
