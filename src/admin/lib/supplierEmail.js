/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — SUPPLIER ORDER EMAIL — MODEL + PREMIUM RENDERER
   ───────────────────────────────────────────────────────────────────────────────
   The email נקסט קלאס בע״מ forwards to a supplier for a drop-ship dispatch.

   Two halves, by design:
     1. AUTO-FILL  — buildSupplierEmailModel(order, supplier) pulls every data point
        from the order (order #, model/מק״ט, order date, contact + phone + email,
        exact address, items) and seeds every SENTENCE with a sensible Hebrew default.
     2. EDITABLE   — the returned model is a flat bag of strings/arrays. The composer
        lets the operator edit ANY field or sentence; renderSupplierEmailHtml(model)
        rebuilds the premium HTML from whatever the operator left.

   Pure + dependency-light (only BUSINESS identity). No Firestore, no DOM.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { BUSINESS } from './businessProfile';

/* ─── Date → Hebrew dd/mm/yyyy ─────────────────────────────────────────────────── */
export function fmtHeDate(d) {
    if (!d && d !== 0) return '';
    let dt = d;
    if (typeof d === 'number') dt = new Date(d);
    else if (typeof d === 'string') {
        // Pass through strings that already look like a date (e.g. "12/07/2026").
        if (/\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(d)) return d;
        dt = new Date(d);
    } else if (d && typeof d.toDate === 'function') dt = d.toDate(); // Firestore Timestamp
    if (!(dt instanceof Date) || isNaN(dt.getTime())) return String(d);
    try {
        return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
    } catch {
        return dt.toLocaleDateString('he-IL');
    }
}

/* ─── The always-present "call the contact first" instruction ──────────────────── */
export const CALL_FIRST_DEFAULT =
    'נא להתקשר לאיש הקשר לפני האספקה — לתיאום מועד מדויק ואימות הכתובת.';

/* ─── Auto-fill an editable model from an order + chosen supplier ──────────────── */
export function buildSupplierEmailModel(order = {}, supplier = null, extra = {}) {
    const o = order || {};
    const contactPerson =
        supplier?.contactPerson || supplier?.agentName || supplier?.contact || '';
    const supplierName = supplier?.name || supplier?.company || o.supplierName || 'ספק';
    const contact = contactPerson || supplierName;

    const orderNumber = o.orderNumber || o.id || '';
    const orderDate = fmtHeDate(o.dateTs || o.date || o.createdAt) || fmtHeDate(Date.now());

    // Exact ship-to (drop-ship = supplier delivers DIRECTLY to the end customer).
    const shipName = o.contactName || o.customer || '';
    const shipInstitution = o.institution || '';
    const shipAddress = [o.shipTo?.address || o.address, o.city, o.zip]
        .filter(Boolean).join(', ');
    const shipPhone = o.phone || o.shipTo?.phone || '';
    const shipEmail = o.email || '';
    const shipContact = o.contactName || '';

    const items = (o.items || []).map((it) => ({
        title: it.title || it.name || 'פריט',
        catalogNumber: it.catalogNumber || it.sku || '',
        qty: Number(it.qty ?? it.quantity) || 1,
        image: it.image || '',
        category: it.category || '',
    }));

    // Any operator note captured earlier in the dropship flow seeds the special note.
    const seededNote = (extra.note || '').trim();

    return {
        subject: `הזמנת אספקה ${orderNumber} — NextClass`,

        greeting: `שלום ${contact},`,
        intro:
            'מצורפת הזמנה לביצוע. נשמח שתספקו את הפריטים המפורטים מטה באספקה ישירה ' +
            'ללקוח, לפי הכתובת ואיש הקשר המצוינים. נודה לאישור קבלת ההזמנה ולעדכון על ' +
            'מועד אספקה משוער.',

        // Meta — auto-filled, still fully editable
        orderNumber,
        orderDate,
        deliveryLabel: 'אספקה מיידית — בהקדם האפשרי 🚀',
        deliveryDate: o.deliveryDate ? fmtHeDate(o.deliveryDate) : '',

        items,

        // Exact ship-to + contact
        shipName,
        shipInstitution,
        shipContact,
        shipPhone,
        shipEmail,
        shipAddress,

        // Special-notes area — the call-first line ALWAYS shows; free note is extra
        callFirstNote: CALL_FIRST_DEFAULT,
        specialNote: seededNote,

        // The three requested status updates
        updatesTitle: 'נשמח לקבל מכם עדכון בכל שלב:',
        update1: 'מתי ההזמנה צפויה להיות מסופקת — מועד אספקה משוער.',
        update2: 'עדכון כשההזמנה יוצאת לדרך — כולל מספר מעקב אם קיים.',
        update3: 'עדכון כשההזמנה סופקה בפועל אצל הלקוח.',

        // Warm closing
        thankYou:
            'תודה רבה על שיתוף הפעולה — אנו מעריכים מאוד את העבודה המשותפת ומצפים ' +
            'להמשך דרך פורייה יחד. 🙏',

        // For queue metadata / recipient
        _orderId: o.id || o._docId || '',
        _to: supplier?.agentEmail || supplier?.email || '',
        _supplierName: supplierName,
        _recipientName: contactPerson || supplierName,
    };
}

/* ─── HTML-escape (operator text is user-controlled) + newline → <br> ──────────── */
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function escMultiline(s) {
    return esc(s).replace(/\n/g, '<br/>');
}

/* ─── Render the editable model → premium RTL HTML email ───────────────────────── */
export function renderSupplierEmailHtml(model = {}) {
    const m = model || {};
    const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
    const CYAN = '#0891B2';
    const biz = BUSINESS;
    const bizPhone = biz.phone || '058-585-6356';
    const bizEmail = biz.email || 'nextclass.en@gmail.com';
    const bizLegal = `${biz.legalName} · ח.פ ${biz.taxId} · ${biz.address}`;

    const divider = `<div style="height:1px;background:#F0F4FF;margin:0 0 28px;"></div>`;

    /* Items — quantity + model/מק״ט only, NO prices exposed to the supplier */
    const itemRows = (m.items || []).map((item) => {
        const qty = Number(item.qty) || 1;
        const img = item.image
            ? `<img src="${esc(item.image)}" width="60" height="60" style="border-radius:12px 0 0 12px;object-fit:cover;display:block;" />`
            : `<div style="width:60px;height:60px;border-radius:12px 0 0 12px;background:linear-gradient(135deg,#E8EEFF,#EEF2FF);text-align:center;line-height:60px;font-size:22px;">📦</div>`;
        return `<tr>
          <td style="padding:0 0 10px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFF;border-radius:12px;overflow:hidden;border:1px solid #E8EEFF;">
              <tr>
                <td width="60" style="vertical-align:top;padding:0;">${img}</td>
                <td style="padding:10px 12px;vertical-align:middle;">
                  <div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:3px;">${esc(item.title || '—')}</div>
                  ${item.catalogNumber ? `<div style="font-size:11px;color:#0891B2;font-weight:700;">דגם / מק״ט: ${esc(item.catalogNumber)}</div>` : ''}
                  ${item.category ? `<div style="display:inline-block;font-size:10px;font-weight:700;color:#0891B2;background:#E0F7FF;padding:2px 7px;border-radius:50px;margin-top:3px;">${esc(item.category)}</div>` : ''}
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

    const itemsSection = (m.items || []).length ? `
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:800;color:#6E6E73;margin-bottom:10px;letter-spacing:0.05em;">פירוט הפריטים הנדרשים</div>
        <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
      </div>` : '';

    /* Order meta card — number + date + delivery */
    const metaRow = (label, value, accent) => value ? `
      <tr>
        <td style="padding:5px 0;font-size:11px;color:#6E6E73;font-weight:600;white-space:nowrap;">${esc(label)}</td>
        <td style="padding:5px 0;font-size:13px;color:${accent || '#1D1D1F'};font-weight:800;text-align:left;">${esc(value)}</td>
      </tr>` : '';
    const metaSection = `
      <div style="padding:16px 18px;background:#FAFCFF;border-radius:14px;border:1px solid #E8EEFF;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${metaRow('מספר הזמנה', m.orderNumber, '#0891B2')}
          ${metaRow('תאריך הזמנה', m.orderDate)}
          ${metaRow('אספקה', m.deliveryLabel, '#FF9500')}
          ${metaRow('נדרש עד', m.deliveryDate, '#FF9500')}
        </table>
      </div>`;

    /* Ship-to (exact address + full contact) */
    const shipLine = [m.shipName, m.shipInstitution].filter(Boolean).join(' · ');
    const shipToSection = (m.shipName || m.shipAddress || m.shipPhone) ? `
      <div style="padding:16px 18px;background:#F0FBFF;border-radius:14px;border:1px solid #CDEFFB;margin-bottom:28px;">
        <div style="font-size:11px;font-weight:800;color:#0891B2;margin-bottom:12px;letter-spacing:0.05em;">📍 כתובת אספקה ואיש קשר · אספקה ישירה ללקוח</div>
        ${shipLine ? `<div style="font-size:14px;font-weight:800;color:#1D1D1F;">${esc(shipLine)}</div>` : ''}
        ${m.shipAddress ? `<div style="font-size:13px;color:#3D3D3D;margin-top:4px;">🏠 ${esc(m.shipAddress)}</div>` : ''}
        ${m.shipContact && m.shipContact !== m.shipName ? `<div style="font-size:13px;color:#3D3D3D;margin-top:4px;">👤 איש קשר: ${esc(m.shipContact)}</div>` : ''}
        ${m.shipPhone ? `<div style="font-size:13px;color:#0891B2;margin-top:4px;font-weight:700;">📞 ${esc(m.shipPhone)}</div>` : ''}
        ${m.shipEmail ? `<div style="font-size:13px;color:#0891B2;margin-top:4px;font-weight:700;">✉️ ${esc(m.shipEmail)}</div>` : ''}
      </div>` : '';

    /* Special notes — call-first line ALWAYS shows; free note is additional */
    const specialSection = (m.callFirstNote || m.specialNote) ? `
      <div style="margin-bottom:28px;padding:16px 20px;background:linear-gradient(135deg,#FFF8F0,#FFFAF5);border-right:4px solid #FF9500;border-radius:0 14px 14px 0;">
        <div style="font-size:11px;font-weight:800;color:#FF9500;margin-bottom:8px;letter-spacing:0.05em;">⚠️ לתשומת לבכם</div>
        ${m.callFirstNote ? `<div style="font-size:13.5px;font-weight:800;color:#B86A00;line-height:1.65;">${escMultiline(m.callFirstNote)}</div>` : ''}
        ${m.specialNote ? `<div style="font-size:13px;color:#3D3D3D;line-height:1.65;margin-top:${m.callFirstNote ? '8px' : '0'};white-space:pre-line;">${escMultiline(m.specialNote)}</div>` : ''}
      </div>` : '';

    /* Requested status updates (three) */
    const updateItem = (n, text) => text ? `
        <div style="margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;">
          <span style="background:#0891B2;color:#fff;font-size:10px;font-weight:900;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${n}</span>
          <span style="font-size:13px;color:#3D3D3D;line-height:1.6;">${escMultiline(text)}</span>
        </div>` : '';
    const updatesSection = (m.update1 || m.update2 || m.update3) ? `
      <div style="border-right:4px solid #0891B2;background:#F0FBFF;border-radius:0 12px 12px 0;padding:18px 20px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:800;color:#1D1D1F;margin-bottom:12px;">📩 ${esc(m.updatesTitle || 'נשמח לקבל מכם עדכון בכל שלב:')}</div>
        ${updateItem(1, m.update1)}
        ${updateItem(2, m.update2)}
        ${updateItem(3, m.update3)}
        <div style="font-size:12px;color:#6E6E73;border-top:1px solid rgba(8,145,178,0.12);padding-top:10px;margin-top:6px;">לכל שאלה: <strong>${esc(bizPhone)}</strong> · <a href="mailto:${esc(bizEmail)}" style="color:#0891B2;text-decoration:none;font-weight:700;">${esc(bizEmail)}</a></div>
      </div>` : '';

    /* Warm thank-you */
    const thankSection = m.thankYou ? `
      <div style="padding:18px 20px;background:linear-gradient(135deg,#EAF9EF,#F5FCF7);border-radius:14px;border:1px solid rgba(52,199,89,0.22);text-align:center;margin-bottom:4px;">
        <div style="font-size:14px;font-weight:700;color:#1A8C40;line-height:1.7;">${escMultiline(m.thankYou)}</div>
      </div>` : '';

    const body = `
      <p style="margin:0 0 22px;font-size:15px;color:#1D1D1F;line-height:1.75;">${escMultiline(m.greeting)}</p>
      <p style="margin:0 0 24px;font-size:14.5px;color:#3D3D3D;line-height:1.75;">${escMultiline(m.intro)}</p>
      ${divider}
      ${metaSection}
      ${itemsSection}
      ${shipToSection}
      ${specialSection}
      ${updatesSection}
      ${thankSection}
    `;

    const preheader = `הזמנת אספקה ${esc(m.orderNumber)} מ-NextClass — ${(m.items || []).length} פריטים · נא לאשר מועד אספקה`;

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>הזמנה ${esc(m.orderNumber)} — NextClass</title></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo -->
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

  <!-- Badge -->
  <tr><td style="padding-bottom:16px;text-align:center;">
    <div style="display:inline-block;background:${CYAN};color:#fff;font-size:10px;font-weight:800;padding:5px 16px;border-radius:50px;letter-spacing:0.1em;">
      📦 הזמנה לביצוע
    </div>
  </td></tr>

  <!-- Card -->
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
      <div style="font-size:24px;font-weight:900;color:#1D1D1F;letter-spacing:-0.5px;margin-bottom:5px;">הזמנת אספקה — NextClass</div>
      <div style="font-size:14px;color:#6E6E73;line-height:1.5;">נא לספק בהקדם ולאשר מועד אספקה משוער</div>
      <div style="margin-top:18px;display:inline-block;background:#FFFFFF;border:1.5px solid #0891B2;border-radius:50px;padding:8px 24px;">
        <span style="font-size:12px;color:#6E6E73;font-weight:600;">מספר הזמנה</span>
        <span style="font-size:14px;color:#0891B2;font-weight:900;margin-right:10px;">${esc(m.orderNumber)}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">${body}</div>

    <!-- Footer -->
    <div style="background:#F0F4FF;border-top:1px solid #E8EEFF;padding:22px 40px;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:5px;">NextClass — ציוד טכנולוגי לחינוך ישראל</div>
      <div style="font-size:12px;color:#6E6E73;">
        <a href="tel:${esc(bizPhone.replace(/\D/g, ''))}" style="color:#0891B2;text-decoration:none;font-weight:600;">${esc(bizPhone)}</a>
        &nbsp;·&nbsp;
        <a href="mailto:${esc(bizEmail)}" style="color:#0891B2;text-decoration:none;font-weight:600;">${esc(bizEmail)}</a>
      </div>
      <div style="font-size:10.5px;color:#B8BCC4;margin-top:10px;border-top:1px solid #E8EEFF;padding-top:10px;">${esc(bizLegal)}</div>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export default { fmtHeDate, buildSupplierEmailModel, renderSupplierEmailHtml, CALL_FIRST_DEFAULT };
