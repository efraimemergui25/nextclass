/* eslint-disable */
/**
 * /api/extract-product.js — AI Product Catalog Extractor (Gemini 2.5 Flash + Groq fallback)
 *
 * Turns a product image OR a product-page URL into structured, catalog-ready data
 * for NextClass. Accepts one of:
 *   { imageBase64, mimeType }  — an uploaded/pasted product photo (vision)
 *   { imageUrl }               — a URL to a product image (fetched → vision)
 *   { pageUrl }                — a product page URL (HTML fetched → text → LLM)
 *   { text }                   — raw product text (spec sheet paste)
 *
 * Returns { success, data, warnings } with catalog fields for verification.
 */

const KNOWN_CATEGORIES = ['מסכי מחשב', 'מוצרים משלימים'];

const toNum = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const n = parseFloat(String(v).replace(/[^\d.\-]/g, ''));
    return isFinite(n) ? n : null;
};
const cleanStr = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s === '-') return null;
    return s;
};

// Very small HTML → text + a couple of useful meta hints (og:image, title).
function htmlToParts(html) {
    const ogImg = (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i))?.[1] || '';
    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i))?.[1] || '';
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 18000);
    return { ogImg, title, text };
}

async function callGroqText(key, prompt, docText) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', temperature: 0.15, max_tokens: 2048,
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: docText }],
        }),
    });
    if (!res.ok) throw new Error('Groq text error');
    const d = await res.json();
    return d?.choices?.[0]?.message?.content || '';
}
async function callGroqVision(key, prompt, base64, mime) {
    for (const model of ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-90b-vision-preview']) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model, temperature: 0.15, max_tokens: 2048,
                    messages: [{ role: 'user', content: [
                        { type: 'text', text: prompt + '\n\nReturn ONLY the JSON object.' },
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
                    ] }],
                }),
            });
            if (res.ok) { const d = await res.json(); return d?.choices?.[0]?.message?.content || ''; }
        } catch {}
    }
    throw new Error('Groq vision unavailable');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let { imageBase64, mimeType = 'image/jpeg', imageUrl = '', pageUrl = '', text = '' } = req.body || {};
    imageUrl = cleanStr(imageUrl); pageUrl = cleanStr(pageUrl); text = cleanStr(text) || '';
    let inlineData = imageBase64 || null;
    let pageImageHint = '';

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!geminiKey && !groqKey) {
        return res.status(500).json({ error: 'לא הוגדר ספק AI — הוסף GEMINI_API_KEY או GROQ_API_KEY' });
    }

    try {
        // Resolve a plain URL: image → base64 vision; page → text.
        const looksImage = (u) => /\.(jpe?g|png|webp|gif|bmp|avif)(\?|$)/i.test(u);
        if (!inlineData && imageUrl) {
            const r = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            if (r.ok) {
                const ct = r.headers.get('content-type') || '';
                const buf = Buffer.from(await r.arrayBuffer());
                inlineData = buf.toString('base64');
                mimeType = ct.startsWith('image/') ? ct : 'image/jpeg';
            }
        }
        if (!inlineData && !text && pageUrl) {
            const r = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await r.text();
            if (looksImage(pageUrl)) {
                // page URL was actually an image
                const buf = Buffer.from(html); // unlikely; fallthrough
            }
            const parts = htmlToParts(html);
            pageImageHint = parts.ogImg || '';
            text = `PAGE TITLE: ${parts.title}\nSOURCE URL: ${pageUrl}\nOG_IMAGE: ${parts.ogImg}\n\n${parts.text}`;
        }

        if (!inlineData && !cleanStr(text)) {
            return res.status(400).json({ error: 'ספק תמונה או קישור למוצר' });
        }

        const prompt = `You are an expert product-catalog extraction engine for NextClass, a premium B2B educational-technology supplier in Israel.
From the given product IMAGE or product PAGE, extract clean, catalog-ready data as a single JSON object.

Return ONLY this JSON:
{
  "title": "string — concise Hebrew product title, marketing-ready (include brand + model + key spec)",
  "brand": "string — manufacturer brand (e.g. ASUS, HP, Dell)",
  "model": "string — model number / name",
  "category": "string — MUST be exactly one of: ${KNOWN_CATEGORIES.map(c => `'${c}'`).join(', ')} — choose the best fit",
  "sku": "string — SKU / catalog number if visible, else null",
  "price": number — sale price in ILS if shown (numbers only, no symbols), else null,
  "description": "string — 2-4 sentence Hebrew marketing description",
  "specs": [ { "label": "string — Hebrew spec label", "value": "string — the value" } ],
  "imageUrl": "string — best direct product image URL if present in the page, else null",
  "confidence": number
}

Rules:
- Output Hebrew for title, description and spec labels. Keep model numbers/units in Latin where natural.
- "category" MUST be one of the allowed values exactly.
- Prices are NUMBERS only (e.g. 460, not "₪460").
- Extract 4-10 meaningful technical specs when available (panel, size, resolution, refresh, ports, connectivity, weight…).
- If a field is unknown, use null (never invent).
- "confidence" is your 0-100 self-assessed extraction confidence.
- Return ONLY valid JSON, no markdown, no commentary.`;

        let rawText = '';
        if (geminiKey) {
            const parts = inlineData
                ? [{ inline_data: { mime_type: mimeType, data: inlineData } }, { text: prompt }]
                : [{ text: prompt }, { text: `\n\n===== PRODUCT CONTENT =====\n${text}` }];
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.15, topK: 32, topP: 1, maxOutputTokens: 2048 },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                        ],
                    }),
                }
            );
            if (response.ok) {
                const d = await response.json();
                rawText = d?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
            } else if (!groqKey) {
                return res.status(502).json({ error: 'Gemini API error', details: (await response.text()).slice(0, 300) });
            }
        }
        if (!rawText) {
            if (cleanStr(text)) rawText = await callGroqText(groqKey, prompt, text);
            else if (inlineData) rawText = await callGroqVision(groqKey, prompt, inlineData, mimeType);
        }

        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/) || rawText.match(/(\{[\s\S]*\})/);
        let parsed;
        try { parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawText); }
        catch (e) {
            return res.status(200).json({ success: false, error: 'parse', rawText, warnings: ['החילוץ לא הניב JSON תקין — נסה שוב או הזן ידנית'] });
        }

        ['title', 'brand', 'model', 'sku', 'description', 'imageUrl'].forEach(k => { parsed[k] = cleanStr(parsed[k]); });
        parsed.price = toNum(parsed.price);
        parsed.category = KNOWN_CATEGORIES.includes(parsed.category) ? parsed.category : (KNOWN_CATEGORIES[0]);
        if (!Array.isArray(parsed.specs)) parsed.specs = [];
        parsed.specs = parsed.specs
            .map(s => ({ label: cleanStr(s.label || s.name), value: cleanStr(s.value) }))
            .filter(s => s.label && s.value)
            .slice(0, 12);
        if (!parsed.imageUrl) parsed.imageUrl = cleanStr(imageUrl) || pageImageHint || null;
        parsed.confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)));

        const warnings = [];
        if (!parsed.title) warnings.push('לא זוהתה כותרת מוצר — יש להזין ידנית');
        if (parsed.price == null) warnings.push('לא זוהה מחיר — הזן מחיר מכירה');
        if (parsed.confidence < 60) warnings.push('ביטחון נמוך — בדוק את הפרטים לפני הוספה');

        return res.status(200).json({ success: true, data: parsed, rawText, warnings });
    } catch (err) {
        console.error('[extract-product] error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
