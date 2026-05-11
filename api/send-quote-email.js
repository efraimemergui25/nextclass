/**
 * Vercel Serverless Function — Resend transactional email
 * POST /api/send-quote-email
 *
 * Sends two emails when a quote is submitted:
 *  1. Confirmation to the customer (they know their request was received)
 *  2. Internal notification to the NextClass team
 *
 * Setup:
 *  1. Sign up at resend.com (free: 3,000 emails/month)
 *  2. Create an API key → add as RESEND_API_KEY in Vercel dashboard
 *  3. Verify your sending domain (or use onboarding@resend.dev for testing)
 *  4. Set NEXTCLASS_EMAIL to the team inbox (e.g. info@nextclass.co.il)
 */

const RESEND_URL = 'https://api.resend.com/emails';
const FROM = 'NextClass <onboarding@resend.dev>'; // replace with your verified domain

async function sendEmail(to, subject, html) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;
    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) console.error('[Resend]', await res.text());
}

function itemsTable(items = []) {
    if (!items.length) return '<p style="color:#6E6E73;">עגלה ריקה</p>';
    return `
    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr style="background:#F5F5F7;text-align:right;">
            <th style="padding:10px 14px;font-size:12px;color:#6E6E73;">מוצר</th>
            <th style="padding:10px 14px;font-size:12px;color:#6E6E73;">כמות</th>
            <th style="padding:10px 14px;font-size:12px;color:#6E6E73;">מחיר</th>
        </tr>
        ${items.map(i => `
        <tr style="border-top:1px solid #E5E5EA;">
            <td style="padding:10px 14px;font-size:14px;font-weight:600;color:#1D1D1F;">${i.title}</td>
            <td style="padding:10px 14px;font-size:14px;color:#6E6E73;">${i.qty ?? 1}</td>
            <td style="padding:10px 14px;font-size:14px;color:#1D1D1F;">₪${Number(i.price ?? 0).toLocaleString()}</td>
        </tr>`).join('')}
    </table>`;
}

function baseTemplate(content) {
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Heebo',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#007AFF,#5856D6);padding:32px 40px;text-align:center;">
          <span style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:14px;text-align:center;line-height:48px;font-size:24px;font-weight:900;color:#fff;">N</span>
          <div style="color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:3px;margin-top:8px;text-transform:uppercase;">NextClass</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr><td style="background:#F5F5F7;padding:24px 40px;text-align:center;color:#AEAEB2;font-size:12px;">
          NextClass — הסטנדרט הטכנולוגי של מוסדות החינוך המובילים בישראל<br/>
          <a href="https://nextclass-v4-living.vercel.app" style="color:#007AFF;text-decoration:none;">nextclass.co.il</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.RESEND_API_KEY) return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not set' });

    const { quote } = req.body ?? {};
    if (!quote) return res.status(400).json({ error: 'Missing quote' });

    const subtotalFormatted = `₪${Number(quote.subtotal ?? 0).toLocaleString()}`;

    // ── 1. Customer confirmation email ────────────────────────────────────────
    if (quote.email) {
        await sendEmail(
            quote.email,
            `הבקשה שלך התקבלה — מספר ${quote.id} | NextClass`,
            baseTemplate(`
                <h1 style="font-size:24px;font-weight:900;color:#1D1D1F;margin:0 0 8px;">שלום ${quote.contactName || ''},</h1>
                <p style="color:#6E6E73;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    קיבלנו את בקשתך להצעת מחיר עבור <strong style="color:#1D1D1F;">${quote.institution || 'המוסד שלך'}</strong>.<br/>
                    הצוות שלנו יחזור אליך תוך פחות מ-24 שעות.
                </p>
                <div style="background:#F5F5F7;border-radius:16px;padding:24px;margin-bottom:24px;">
                    <p style="font-size:12px;font-weight:700;color:#007AFF;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">פרטי הבקשה</p>
                    <p style="font-size:14px;color:#6E6E73;margin:4px 0;">מספר בקשה: <strong style="color:#1D1D1F;">${quote.id}</strong></p>
                    <p style="font-size:14px;color:#6E6E73;margin:4px 0;">תאריך: <strong style="color:#1D1D1F;">${quote.date}</strong></p>
                    <p style="font-size:14px;color:#6E6E73;margin:4px 0;">סה"כ משוער: <strong style="color:#1D1D1F;">${subtotalFormatted}</strong></p>
                </div>
                <p style="font-size:13px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">הפריטים שבחרת:</p>
                ${itemsTable(quote.items)}
                <div style="margin-top:32px;padding:20px;background:rgba(0,122,255,0.06);border-radius:16px;border:1px solid rgba(0,122,255,0.12);">
                    <p style="font-size:14px;color:#007AFF;font-weight:700;margin:0;">יש שאלות? נשמח לעזור.</p>
                    <p style="font-size:13px;color:#6E6E73;margin:6px 0 0;">📞 058-585-6356 &nbsp;|&nbsp; 💬 WhatsApp זמין</p>
                </div>
            `)
        );
    }

    // ── 2. Internal team notification ─────────────────────────────────────────
    const teamEmail = process.env.NEXTCLASS_EMAIL;
    if (teamEmail) {
        await sendEmail(
            teamEmail,
            `🔔 הצעת מחיר חדשה — ${quote.institution || 'לא ידוע'} (${quote.id})`,
            baseTemplate(`
                <h2 style="font-size:20px;font-weight:900;color:#1D1D1F;margin:0 0 4px;">הצעת מחיר חדשה התקבלה</h2>
                <p style="color:#6E6E73;font-size:14px;margin:0 0 24px;">${quote.date} · ${quote.time}</p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                    ${[
                        ['שם', quote.contactName],
                        ['תפקיד', quote.contactRole],
                        ['מוסד', quote.institution],
                        ['סוג מוסד', quote.institutionType],
                        ['טלפון', quote.phone],
                        ['מייל', quote.email],
                        ['תקציב', quote.budgetRange || 'לא צוין'],
                        ['דחיפות', quote.urgency],
                        ['סה"כ משוער', subtotalFormatted],
                    ].map(([label, val]) => `
                        <tr style="border-bottom:1px solid #F5F5F7;">
                            <td style="padding:10px 0;font-size:13px;color:#6E6E73;width:120px;">${label}</td>
                            <td style="padding:10px 0;font-size:14px;font-weight:600;color:#1D1D1F;">${val || '—'}</td>
                        </tr>`).join('')}
                </table>
                ${quote.notes ? `<p style="background:#FFF9E6;border-radius:12px;padding:16px;font-size:14px;color:#1D1D1F;margin-bottom:24px;"><strong>הערות:</strong> ${quote.notes}</p>` : ''}
                <p style="font-size:13px;font-weight:700;color:#1D1D1F;margin:0 0 8px;">פריטים בעגלה:</p>
                ${itemsTable(quote.items)}
            `)
        );
    }

    res.status(200).json({ ok: true });
}
