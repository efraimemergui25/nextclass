/* eslint-disable */
/**
 * /api/ocr-order.js — Gemini Order-Intake OCR Engine (gemini-2.5-flash)
 * Multi-format purchase-order reader for a B2B EdTech company in Israel (NextClass).
 *
 * Accepts one of:
 *   { fileBase64, mimeType, fileName }  — image OR pdf, sent via inline_data (Gemini reads PDF natively)
 *   { text, fileName }                  — pre-extracted text (csv / docx / xlsx)
 *   { imageBase64, mimeType }           — legacy back-compat (treated as fileBase64)
 *
 * Returns structured Israeli purchase-order data (Amal / "עמל" shape and generic POs):
 *   { success, data, rawText, warnings }
 */

const toNum = (v) => {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    // strip currency symbols, thousands separators, keep digits / . / -
    const n = parseFloat(String(v).replace(/[^\d.\-]/g, ''));
    return isFinite(n) ? n : null;
};

const cleanStr = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === 'null' || s === '-') return null;
    return s;
};

// ── Groq (OpenAI-compatible) — fallback when no Gemini key. Text + vision. ──────
async function callGroqText(key, prompt, docText, fileName) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1, max_tokens: 4096,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: `===== DOCUMENT CONTENT${fileName ? ` (${fileName})` : ''} =====\n${docText}` },
            ],
        }),
    });
    if (!res.ok) throw new Error('Groq text error: ' + (await res.text()).slice(0, 300));
    const d = await res.json();
    return d?.choices?.[0]?.message?.content || '';
}
async function callGroqVision(key, prompt, base64, mime) {
    // Groq multimodal model — reads an image (photo/scan of a PO)
    for (const model of ['meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.2-90b-vision-preview']) {
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model, temperature: 0.1, max_tokens: 4096,
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        fileBase64,
        imageBase64,          // legacy
        mimeType = 'image/jpeg',
        fileName = '',
        text = '',
    } = req.body || {};

    const inlineData = fileBase64 || imageBase64;

    if (!inlineData && !cleanStr(text)) {
        return res.status(400).json({ error: 'Provide fileBase64 (image/pdf) or text (csv/docx/xlsx)' });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!geminiKey && !groqKey) {
        return res.status(500).json({ error: 'לא הוגדר ספק AI — הוסף GEMINI_API_KEY או GROQ_API_KEY לסביבה' });
    }

    const prompt = `You are an expert order-intake OCR engine for NextClass, a B2B educational-technology supplier in Israel.
You read Israeli PURCHASE ORDERS (הזמנת רכש), including government/municipal "עמל" (Amal) forms, supplier POs, quote requests, spreadsheets and CSV exports.
Extract EVERY piece of order information into a single JSON object.

Return ONLY a JSON object with these exact fields (Hebrew source labels are shown in parentheses to help you locate them):
{
  "orderNumber": "string — purchase order number (מספר הזמנה / הזמנת רכש מס')",
  "poDate": "string — date the PO was issued (תאריך הזמנה)",
  "deliveryDate": "string — requested / promised delivery date (תאריך אספקה)",
  "budgetCode": "string — budget line / section code (סעיף תקציבי / תקנה תקציבית)",
  "supplierRef": "string — supplier number in the buyer's system (מס' ספק)",
  "companyId": "string — company/tax id ח.פ. / ע.מ. / עוסק מורשה",
  "paymentTerms": "string — payment terms e.g. שוטף+30 / שוטף+80 / מזומן",
  "authorizedBy": "string — name of the approver / authorized signatory (מאשר / מורשה חתימה)",
  "currency": "string — currency code, default 'ILS' for ₪ / ש\\"ח",
  "contactName": "string — buyer / contact full name",
  "institution": "string — school / organization / municipality name (שם המוסד)",
  "phone": "string — phone number (Israeli format)",
  "email": "string — email address",
  "address": "string — delivery / billing address (כתובת)",
  "city": "string — city (עיר / יישוב)",
  "zip": "string — postal code (מיקוד)",
  "items": [
    {
      "catalogNumber": "string — product catalog / SKU number (מק\\"ט)",
      "title": "string — product / line description in Hebrew",
      "qty": number,
      "unit": "string — unit of measure (יח' / חבילה / ק\\"ג), default 'יח''",
      "price": number,
      "salePrice": number
    }
  ],
  "subtotal": number,
  "vatAmount": number,
  "totalIncVat": number,
  "notes": "string — special instructions, delivery notes, remarks",
  "confidence": number
}

Rules:
- Extract ALL line items with catalog numbers, quantities and unit prices. One object per line.
- Prices/amounts are NUMBERS only, no currency symbols, no thousands separators (e.g. 375, not "375 ₪" and not "1,250").
- Quantities are positive integers.
- Israeli VAT ("מע\\"מ") may be 17% or 18% — read the ACTUAL amount printed on the document, never assume a rate.
- If "totalIncVat" (סה\\"כ כולל מע\\"מ) is printed, capture it exactly as shown.
- If a field is not present in the document, use null (do NOT invent values).
- Read headers, footers, stamps and side boxes — Amal/עמל forms put the budget code, supplier number and approver in the margins.
- Keep all Hebrew text accurate and right-to-left correct.
- "confidence" is your 0-100 self-assessed extraction confidence.
- Return ONLY valid JSON. No markdown, no commentary.`;

    try {
        let rawText = '';

        if (geminiKey) {
            // ── Gemini path (native PDF + image vision) ──────────────────────
            const parts = inlineData
                ? [{ inline_data: { mime_type: mimeType, data: inlineData } }, { text: prompt }]
                : [{ text: prompt }, { text: `\n\n===== DOCUMENT CONTENT${fileName ? ` (${fileName})` : ''} =====\n${text}` }];
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.1, topK: 32, topP: 1, maxOutputTokens: 4096 },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                        ],
                    }),
                }
            );
            if (!response.ok) {
                const errText = await response.text();
                console.error('[OCR] Gemini API error:', errText);
                if (!groqKey) return res.status(502).json({ error: 'Gemini API error', details: errText });
            } else {
                const geminiData = await response.json();
                rawText = geminiData?.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('') || '';
            }
        }

        // ── Groq fallback (text via pdf.js-extracted content, or image vision) ─
        if (!rawText) {
            const docText = cleanStr(text);
            if (docText) {
                rawText = await callGroqText(groqKey, prompt, docText, fileName);
            } else if (inlineData && (mimeType || '').startsWith('image/')) {
                rawText = await callGroqVision(groqKey, prompt, inlineData, mimeType);
            } else {
                // PDF binary with no Gemini + no extracted text → ask client to extract text
                return res.status(200).json({
                    success: false, needsText: true,
                    warnings: ['סריקת PDF ללא מפתח Gemini דורשת חילוץ טקסט בדפדפן — נסה שוב, המערכת תחלץ אוטומטית'],
                });
            }
        }

        // Extract JSON (Gemini sometimes wraps it in a ```json fence)
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
                          rawText.match(/```\s*([\s\S]*?)\s*```/) ||
                          rawText.match(/(\{[\s\S]*\})/);
        const jsonStr = jsonMatch ? jsonMatch[1] : rawText;

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error('[OCR] JSON parse error:', parseErr, 'Raw:', rawText);
            return res.status(200).json({
                success: false,
                error: 'Could not parse Gemini response as JSON',
                rawText,
                warnings: ['הסריקה לא הניבה JSON תקין — יש להזין ידנית מהטקסט הגולמי'],
            });
        }

        // ── Normalize string fields ───────────────────────────────────────
        [
            'orderNumber', 'poDate', 'deliveryDate', 'budgetCode', 'supplierRef',
            'companyId', 'paymentTerms', 'authorizedBy', 'contactName', 'institution',
            'phone', 'email', 'address', 'city', 'zip', 'notes',
        ].forEach(k => { parsed[k] = cleanStr(parsed[k]); });
        parsed.currency = cleanStr(parsed.currency) || 'ILS';

        // ── Normalize items ───────────────────────────────────────────────
        if (!Array.isArray(parsed.items)) parsed.items = [];
        parsed.items = parsed.items.map(item => {
            const p = toNum(item.price);
            const sp = toNum(item.salePrice);
            return {
                catalogNumber: cleanStr(item.catalogNumber || item.sku || item.mikat || item.mkt) || '',
                title: cleanStr(item.title || item.description || item.name) || '',
                qty: Math.max(1, Math.round(Number(item.qty ?? item.quantity) || 1)),
                unit: cleanStr(item.unit) || 'יח׳',
                price: p != null ? p : 0,
                salePrice: sp != null ? sp : (p != null ? p : 0),
            };
        }).filter(i => i.title || i.catalogNumber);

        // ── Normalize numeric totals ──────────────────────────────────────
        parsed.subtotal = toNum(parsed.subtotal);
        parsed.vatAmount = toNum(parsed.vatAmount);
        parsed.totalIncVat = toNum(parsed.totalIncVat);
        if (parsed.subtotal == null && parsed.items.length > 0) {
            parsed.subtotal = parsed.items.reduce(
                (sum, it) => sum + (it.salePrice || it.price || 0) * it.qty, 0
            );
        }

        // ── Confidence ────────────────────────────────────────────────────
        parsed.confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)));

        // ── Warnings ──────────────────────────────────────────────────────
        const warnings = [];
        if (parsed.items.length === 0) warnings.push('לא זוהו שורות פריטים — יש להזין ידנית');
        if (parsed.confidence < 60) warnings.push('ביטחון נמוך — מומלץ לבדוק ידנית לפני אישור');
        if (parsed.totalIncVat != null && parsed.subtotal != null && parsed.vatAmount != null) {
            const diff = Math.abs((parsed.subtotal + parsed.vatAmount) - parsed.totalIncVat);
            if (diff > 1) warnings.push('סה"כ כולל מע"מ אינו תואם לסכום ביניים + מע"מ — בדוק סכומים');
        }
        if (!parsed.orderNumber) warnings.push('לא זוהה מספר הזמנה');

        return res.status(200).json({ success: true, data: parsed, rawText, warnings });

    } catch (err) {
        console.error('[OCR] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
