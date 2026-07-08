/* eslint-disable */
/**
 * /api/ocr-order.js — Gemini Vision Order OCR Engine
 * Accepts a base64 image, sends it to Gemini 1.5 Flash,
 * returns structured order data (products, quantities, prices, contact info).
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env' });
    }

    const prompt = `You are an expert OCR system for a B2B educational technology company in Israel (NextClass).
Analyze this order image/document and extract ALL order information.

Return a JSON object with these exact fields:
{
  "contactName": "string — full name of buyer/contact",
  "institution": "string — school/organization name",
  "phone": "string — phone number (Israeli format)",
  "email": "string — email address",
  "address": "string — delivery address",
  "city": "string — city",
  "zip": "string — postal code",
  "paymentMethod": "string — payment method (העברה בנקאית / כרטיס אשראי / שיק / etc)",
  "items": [
    {
      "title": "string — product name in Hebrew",
      "qty": number,
      "price": number,
      "salePrice": number
    }
  ],
  "subtotal": number,
  "notes": "string — any special instructions or notes",
  "orderDate": "string — order date if visible",
  "confidence": number (0-100, your confidence in the extraction)
}

Rules:
- Extract ALL line items with quantities and prices
- If a field is not visible, use null
- Prices should be numbers without currency symbols (₪)
- Quantities must be positive integers
- Be thorough — check headers, footers, and all text areas
- If this is a Hebrew document, extract Hebrew text accurately
- Return ONLY valid JSON, no explanation`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64,
                                }
                            },
                            { text: prompt }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    ]
                })
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('[OCR] Gemini API error:', errText);
            return res.status(502).json({ error: 'Gemini API error', details: errText });
        }

        const geminiData = await response.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON from response (Gemini sometimes wraps in markdown)
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
            });
        }

        // Normalize items array
        if (!Array.isArray(parsed.items)) parsed.items = [];
        parsed.items = parsed.items.map(item => ({
            title:     item.title     || '',
            qty:       Math.max(1, Number(item.qty) || 1),
            price:     Number(item.price)     || 0,
            salePrice: Number(item.salePrice) || Number(item.price) || 0,
        })).filter(item => item.title);

        // Auto-calculate subtotal if missing
        if (!parsed.subtotal && parsed.items.length > 0) {
            parsed.subtotal = parsed.items.reduce(
                (sum, it) => sum + (it.salePrice || it.price || 0) * it.qty, 0
            );
        }

        return res.status(200).json({ success: true, data: parsed });

    } catch (err) {
        console.error('[OCR] Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
}
