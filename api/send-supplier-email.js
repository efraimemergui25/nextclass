/**
 * Vercel Serverless Function — Supplier order email
 * POST /api/send-supplier-email
 * Body: { quote, supplier, preview? }
 */

import { isRateLimited } from './_rateLimit.js';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM_NAME  = 'NextClass';
const FROM_ADDR  = process.env.RESEND_FROM || 'onboarding@resend.dev';
const FROM       = `${FROM_NAME} <${FROM_ADDR}>`;
const BIZ_PHONE  = process.env.NEXTCLASS_PHONE || '058-585-6356';
const BIZ_EMAIL  = 'nextclass.en@gmail.com';
const SITE_URL   = process.env.NEXTCLASS_SITE_URL || 'https://nextclass-v4-living.vercel.app';
const FONT       = "'Helvetica Neue', Helvetica, Arial, sans-serif";

async function sendEmail(to, subject, html) {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[Resend] RESEND_API_KEY not set'); return; }
    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(JSON.stringify(data));
    return data;
}

function priceNum(p) {
    return Number(String(p ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

function divider() {
    return `<div style="height:1px;background:#F0F4FF;margin:0 0 28px;"></div>`;
}

function buildSupplierOrderEmail(quote, supplier) {
    const supplierName = supplier?.name || quote.supplierOrder?.supplierName || 'ספק';
    const contactPerson = supplier?.contactPerson || supplier?.agentName || supplier?.contact || '';
    const greeting = contactPerson ? `שלום ${contactPerson},` : `שלום ${supplierName},`;
    const so = quote.supplierOrder || {};
    const sd = quote.shippingDetails || {};
    const subtotal = priceNum(quote.subtotal);

    // Items rows — quantities only, no prices shown to supplier
    const itemRows = (quote.items || []).map(item => {
        const qty = item.qty ?? item.quantity ?? 1;
        return `<tr>
          <td style="padding:0 0 10px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFF;border-radius:12px;overflow:hidden;border:1px solid #E8EEFF;">
              <tr>
                <td width="60" style="vertical-align:top;padding:0;">
                  ${item.image
                    ? `<img src="${item.image}" width="60" height="60" style="border-radius:12px 0 0 12px;object-fit:cover;display:block;" />`
                    : `<div style="width:60px;height:60px;border-radius:12px 0 0 12px;background:linear-gradient(135deg,#E8EEFF,#EEF2FF);text-align:center;line-height:60px;font-size:22px;">📦</div>`}
                </td>
                <td style="padding:10px 12px;vertical-align:middle;">
                  <div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:3px;">${item.title || '—'}</div>
                  ${item.sku ? `<div style="font-size:10px;color:#AEAEB2;font-weight:600;">SKU: ${item.sku}</div>` : ''}
                  ${item.category ? `<div style="display:inline-block;font-size:10px;font-weight:700;color:#0891B2;background:#E0F7FF;padding:2px 7px;border-radius:50px;margin-top:2px;">${item.category}</div>` : ''}
                </td>
                <td style="padding:10px 14px;vertical-align:middle;text-align:left;white-space:nowrap;">
                  <div style="font-size:11px;font-weight:700;color:#6E6E73;margin-bottom:2px;">כמות נדרשת</div>
                  <div style="font-size:22px;font-weight:900;color:#0891B2;">×${qty}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }).join('');

    const itemsSection = quote.items?.length ? `
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:800;color:#6E6E73;margin-bottom:10px;letter-spacing:0.05em;">פירוט הפריטים הנדרשים</div>
        <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
      </div>` : '';

    const totalSection = '';

    const deliverySection = (so.estimatedDelivery || so.notes) ? `
      <div style="padding:16px 18px;background:#FAFCFF;border-radius:14px;border:1px solid #E8EEFF;margin-bottom:28px;">
        <div style="font-size:11px;font-weight:800;color:#6E6E73;margin-bottom:12px;letter-spacing:0.05em;">📅 לוח זמנים</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${so.estimatedDelivery ? `<tr><td style="padding:3px 0;"><span style="font-size:11px;color:#6E6E73;font-weight:600;">אספקה נדרשת עד: </span><span style="font-size:12px;font-weight:800;color:#FF9500;">${so.estimatedDelivery}</span></td></tr>` : ''}
          ${so.notes ? `<tr><td style="padding:8px 0 0;font-size:12px;color:#6E6E73;font-style:italic;">${so.notes}</td></tr>` : ''}
        </table>
      </div>` : '';

    const customerSection = '';

    const replySection = `
      <div style="border-right:4px solid #0891B2;background:#F0FBFF;border-radius:0 12px 12px 0;padding:18px 20px;margin-bottom:0;">
        <div style="font-size:13px;font-weight:800;color:#1D1D1F;margin-bottom:10px;">📩 נשמח לקבל בחזרה:</div>
        <div style="margin-bottom:6px;display:flex;align-items:flex-start;gap:8px;">
          <span style="color:#0891B2;font-weight:900;flex-shrink:0;">1.</span>
          <span style="font-size:13px;color:#3D3D3D;line-height:1.6;"><strong>הצעת מחיר</strong> לפריטים הנ"ל — לפי היחידה ולפי הכמות</span>
        </div>
        <div style="margin-bottom:14px;display:flex;align-items:flex-start;gap:8px;">
          <span style="color:#0891B2;font-weight:900;flex-shrink:0;">2.</span>
          <span style="font-size:13px;color:#3D3D3D;line-height:1.6;"><strong>זמן אספקה</strong> צפוי${so.estimatedDelivery ? ` — נדרש עד: <strong style="color:#FF9500;">${so.estimatedDelivery}</strong>` : ''}</span>
        </div>
        <div style="font-size:12px;color:#6E6E73;border-top:1px solid rgba(8,145,178,0.1);padding-top:10px;">לכל שאלה: <strong>${BIZ_PHONE}</strong> · <a href="mailto:${BIZ_EMAIL}" style="color:#0891B2;text-decoration:none;font-weight:700;">${BIZ_EMAIL}</a></div>
      </div>`;

    const body = `
      <p style="margin:0 0 24px;font-size:15px;color:#1D1D1F;line-height:1.75;">${greeting}<br/><br/>
        אנו מעוניינים לרכוש את הפריטים הבאים ונשמח לקבל ממכם הצעת מחיר.<br/>
        אנא ציינו מחיר ליחידה, מחיר לכמות הנדרשת, וזמן אספקה צפוי.
      </p>
      ${divider()}
      ${itemsSection}
      ${totalSection}
      ${deliverySection}
      ${customerSection}
      ${divider()}
      ${replySection}
    `;

    const preheader = `בקשת הצעת מחיר ${quote.id} מ-NextClass — ${(quote.items || []).length} פריטים`;

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>הזמנה ${quote.id} — NextClass</title></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo + "Official Order" Banner -->
  <tr><td style="padding-bottom:20px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="width:36px;height:36px;background:linear-gradient(135deg,#007AFF,#5856D6);border-radius:10px;text-align:center;vertical-align:middle;">
          <span style="font-size:18px;font-weight:900;color:#fff;line-height:36px;">N</span>
        </td>
        <td style="padding-right:10px;vertical-align:middle;">
          <span style="font-size:17px;font-weight:800;color:#1D1D1F;letter-spacing:-0.3px;">NextClass</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Official badge -->
  <tr><td style="padding-bottom:16px;text-align:center;">
    <div style="display:inline-block;background:#0891B2;color:#fff;font-size:10px;font-weight:800;padding:5px 16px;border-radius:50px;letter-spacing:0.1em;">
      💬 בקשת הצעת מחיר
    </div>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#FFFFFF;border-radius:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.07);overflow:hidden;">

    <div style="height:4px;background:linear-gradient(90deg,#0891B2 0%,#0E7490 100%);border-radius:24px 24px 0 0;"></div>

    <!-- Hero -->
    <div style="background:linear-gradient(180deg,#E0F7FF 0%,#F0FBFF 50%,#FAFEFF 100%);padding:36px 40px 30px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
        <tr>
          <td style="width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#0891B2,#0E7490);text-align:center;vertical-align:middle;box-shadow:0 8px 28px rgba(8,145,178,0.35);">
            <span style="font-size:30px;color:#fff;line-height:68px;font-weight:900;">📦</span>
          </td>
        </tr>
      </table>
      <div style="font-size:24px;font-weight:900;color:#1D1D1F;letter-spacing:-0.5px;margin-bottom:5px;">בקשת הצעת מחיר — NextClass</div>
      <div style="font-size:14px;color:#6E6E73;line-height:1.5;">נשמח לקבל הצעת מחיר וזמן אספקה</div>
      <!-- Order ID pill -->
      <div style="margin-top:18px;display:inline-block;background:#FFFFFF;border:1.5px solid #0891B2;border-radius:50px;padding:8px 24px;">
        <span style="font-size:12px;color:#6E6E73;font-weight:600;">מספר הזמנה</span>
        <span style="font-size:14px;color:#0891B2;font-weight:900;margin-right:10px;">${quote.id}</span>
      </div>
      ${so.orderNumber ? `<div style="margin-top:8px;display:inline-block;background:#F0F4FF;border:1px solid rgba(8,145,178,0.2);border-radius:50px;padding:5px 18px;">
        <span style="font-size:11px;color:#6E6E73;font-weight:600;">מספר הזמנה שלכם</span>
        <span style="font-size:12px;color:#0891B2;font-weight:800;margin-right:8px;">${so.orderNumber}</span>
      </div>` : ''}
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">${body}</div>

    <!-- Footer -->
    <div style="background:#F0F4FF;border-top:1px solid #E8EEFF;padding:22px 40px;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:5px;">NextClass — ציוד טכנולוגי לחינוך ישראל</div>
      <div style="font-size:12px;color:#6E6E73;">
        <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#0891B2;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a>
        &nbsp;·&nbsp;
        <a href="mailto:${BIZ_EMAIL}" style="color:#0891B2;text-decoration:none;font-weight:600;">${BIZ_EMAIL}</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:#0891B2;text-decoration:none;font-weight:600;">getnextclass.com</a>
      </div>
      <div style="font-size:11px;color:#AEAEB2;margin-top:8px;">מייל זה נשלח אוטומטית ממערכת NextClass · אנא ענו למייל לאישור</div>
    </div>

  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 20, windowMs: 60_000 })) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    const { quote, supplier, to, preview } = req.body ?? {};
    if (!quote) return res.status(400).json({ error: 'quote required' });

    try {
        const html    = buildSupplierOrderEmail(quote, supplier);
        const subject = `בקשת הצעת מחיר ${quote.id} — NextClass`;

        if (preview === true) {
            return res.status(200).json({ html, subject, preview: true });
        }

        const recipient = to || supplier?.agentEmail || supplier?.email || quote.supplierOrder?.supplierEmail;
        if (!recipient) return res.status(400).json({ error: 'No recipient email for supplier' });

        if (!process.env.RESEND_API_KEY) {
            console.warn('[send-supplier-email] RESEND_API_KEY not set');
            return res.status(200).json({ skipped: true });
        }

        const data = await sendEmail(recipient, subject, html);
        return res.status(200).json({ ok: true, id: data?.id });
    } catch (err) {
        console.error('[send-supplier-email]', err);
        return res.status(500).json({ error: String(err) });
    }
}
