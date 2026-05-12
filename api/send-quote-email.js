/**
 * Vercel Serverless Function — Resend transactional email
 * POST /api/send-quote-email
 */

const RESEND_URL  = 'https://api.resend.com/emails';
const FROM_NAME   = 'NextClass';
const FROM_ADDR   = process.env.RESEND_FROM || 'onboarding@resend.dev';
const FROM        = `${FROM_NAME} <${FROM_ADDR}>`;
const BIZ_PHONE   = process.env.NEXTCLASS_PHONE || '058-585-6356';
const SITE_URL    = process.env.NEXTCLASS_SITE_URL || 'https://nextclass-v4-living.vercel.app';
const ADMIN_URL   = `${SITE_URL}/admin`;
const FONT        = "'Helvetica Neue', Helvetica, Arial, sans-serif";

async function sendEmail(to, subject, html, replyTo) {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.warn('[Resend] RESEND_API_KEY not set'); return; }
    const body = { from: FROM, to: [to], subject, html };
    if (replyTo) body.reply_to = replyTo;
    const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(JSON.stringify(data));
    console.log('[Resend] Sent to:', to, '| id:', data.id);
}

function priceNum(p) {
    return Number(String(p ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

const urgencyMap = {
    urgent:   { label: 'דחוף — השבוע',  color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444', badge: '⚡ דחוף' },
    month:    { label: 'תוך חודש',       color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B', badge: '📅 חודש' },
    flexible: { label: 'גמיש',            color: '#059669', bg: '#ECFDF5', dot: '#10B981', badge: '✓ גמיש'  },
};

const contactPrefMap = {
    whatsapp: 'וואטסאפ',
    phone:    'שיחה טלפונית',
    email:    'מייל',
};

const bestTimeMap = {
    morning:   'בוקר (08:00–12:00)',
    afternoon: 'צהריים (12:00–16:00)',
    evening:   'אחה"צ (16:00–20:00)',
};

// ═══════════════════════════════════════════════════════════════
//  CUSTOMER EMAIL  —  Premium confirmation (Stripe/Apple style)
// ═══════════════════════════════════════════════════════════════

function customerEmailHtml(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || '';
    const urg       = urgencyMap[quote.urgency] || urgencyMap.flexible;
    const subtotal  = priceNum(quote.subtotal);
    const waLink    = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! שלחתי בקשה מספר ${quote.id} ואשמח לתיאום 🙏`)}`;

    const itemRows = (quote.items || []).map(item => {
        const lineTotal = priceNum(item.price ?? 0) * (item.qty ?? 1);
        return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #F3F4F6;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="52" style="vertical-align:middle;padding-left:0;">
                  ${item.image
                    ? `<img src="${item.image}" width="48" height="48" style="border-radius:10px;object-fit:cover;display:block;border:1px solid #E5E7EB;" />`
                    : `<div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,#E0E7FF,#EDE9FE);"></div>`}
                </td>
                <td style="padding-right:14px;vertical-align:middle;">
                  <div style="font-size:14px;font-weight:600;color:#111827;line-height:1.4;">${item.title || '—'}</div>
                  ${item.category ? `<div style="font-size:12px;color:#9CA3AF;margin-top:2px;">${item.category}</div>` : ''}
                </td>
                <td style="vertical-align:middle;white-space:nowrap;text-align:left;">
                  <div style="font-size:12px;color:#9CA3AF;text-align:center;">× ${item.qty ?? 1}</div>
                  <div style="font-size:14px;font-weight:700;color:#111827;text-align:center;margin-top:2px;">₪${lineTotal.toLocaleString()}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>הבקשה שלך התקבלה</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo bar -->
  <tr><td style="padding-bottom:28px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:8px;">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:8px;display:inline-block;vertical-align:middle;line-height:32px;text-align:center;font-size:16px;font-weight:900;color:#fff;">N</div>
      <span style="font-size:16px;font-weight:800;color:#111827;vertical-align:middle;margin-right:6px;">NextClass</span>
    </div>
  </td></tr>

  <!-- Hero card -->
  <tr><td style="background:#FFFFFF;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04);overflow:hidden;">

    <!-- Green success strip -->
    <div style="background:linear-gradient(135deg,#1D4ED8 0%,#4F46E5 50%,#7C3AED 100%);padding:40px 40px 36px;text-align:center;">
      <!-- Check circle -->
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 20px;border:2px solid rgba(255,255,255,0.3);line-height:64px;font-size:28px;text-align:center;">✓</div>
      <div style="font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;margin-bottom:8px;">הבקשה התקבלה בהצלחה!</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.75);margin-bottom:20px;">הצוות שלנו כבר בעניין ויצור איתך קשר בהקדם</div>
      <!-- Order ID pill -->
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:50px;padding:8px 24px;">
        <span style="font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;font-weight:600;text-transform:uppercase;">מספר בקשה</span>
        <span style="font-size:14px;color:#FFFFFF;font-weight:800;margin-right:8px;">${quote.id}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">

      <!-- Greeting -->
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;">
        שלום ${firstName},<br/>
        קיבלנו את הבקשה שלך עבור <strong style="color:#111827;">${quote.institution || 'המוסד שלך'}</strong>.<br/>
        נציג מטעמנו יצור איתך קשר ${quote.urgency === 'urgent' ? '<strong style="color:#DC2626;">תוך שעות ספורות</strong>' : 'תוך יום עסקים אחד'} דרך ${contactPrefMap[quote.preferredContact] || quote.preferredContact || 'הערוץ המועדף עליך'}.
      </p>

      <!-- Divider -->
      <div style="height:1px;background:#F3F4F6;margin-bottom:28px;"></div>

      <!-- Steps -->
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">מה קורה עכשיו</div>
        ${[
            ['#2563EB', '1', 'הבקשה נקלטה במערכת', 'הפרטים שלך עברו לנציג המתאים ביותר'],
            ['#7C3AED', '2', 'ניצור איתך קשר', `דרך ${contactPrefMap[quote.preferredContact] || quote.preferredContact || '—'} ${bestTimeMap[quote.bestTime] ? '· ' + bestTimeMap[quote.bestTime] : ''}`],
            ['#059669', '3', 'הצעת מחיר אישית', 'נשלח לך מחיר מפורט ומותאם לצרכי המוסד'],
        ].map(([color, n, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:0;margin-bottom:16px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;flex-shrink:0;margin-left:14px;">${n}</div>
          <div style="padding-top:3px;">
            <div style="font-size:14px;font-weight:700;color:#111827;">${title}</div>
            <div style="font-size:13px;color:#6B7280;margin-top:2px;">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <!-- Items -->
      ${(quote.items || []).length > 0 ? `
      <div style="margin-bottom:28px;">
        <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">הפריטים שבחרת</div>
        <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        <!-- Total row -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 0;border-top:2px solid #111827;margin-top:4px;">
          <span style="font-size:13px;font-weight:600;color:#6B7280;">סה״כ משוער</span>
          <span style="font-size:20px;font-weight:800;color:#111827;">₪${subtotal.toLocaleString()}</span>
        </div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:4px;text-align:left;">* המחיר הסופי ייקבע בהצעה המותאמת אישית</div>
      </div>` : ''}

      <!-- Urgency badge -->
      <div style="background:${urg.bg};border-radius:12px;padding:14px 18px;margin-bottom:28px;display:flex;align-items:center;gap:12px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${urg.dot};flex-shrink:0;"></div>
        <div>
          <span style="font-size:13px;font-weight:700;color:${urg.color};">דחיפות: ${urg.label}</span>
          <span style="font-size:12px;color:#9CA3AF;margin-right:10px;">— נתחשב בכך במענה</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${waLink}" style="display:inline-block;background:#25D366;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:50px;letter-spacing:-0.2px;">
          💬 &nbsp;דברו איתנו בוואטסאפ
        </a>
      </div>
      <div style="text-align:center;font-size:12px;color:#9CA3AF;margin-top:10px;">זמינים ב-WhatsApp ראשון–שישי, 08:00–20:00</div>

    </div>

    <!-- Footer strip -->
    <div style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:24px 40px;text-align:center;">
      <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">NextClass — הסטנדרט הטכנולוגי של חינוך ישראל</div>
      <div style="font-size:12px;color:#9CA3AF;">
        <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#2563EB;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:#2563EB;text-decoration:none;font-weight:600;">getnextclass.com</a>
      </div>
      <div style="font-size:11px;color:#D1D5DB;margin-top:12px;">קיבלת מייל זה כי שלחת בקשת הצעת מחיר דרך האתר שלנו · ${quote.date}</div>
    </div>

  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN EMAIL  —  Rich lead card (Linear/Stripe dashboard style)
// ═══════════════════════════════════════════════════════════════

function teamEmailHtml(quote) {
    const urg        = urgencyMap[quote.urgency] || urgencyMap.flexible;
    const subtotal   = priceNum(quote.subtotal);
    const pref       = contactPrefMap[quote.preferredContact] || quote.preferredContact || '—';
    const bestTime   = bestTimeMap[quote.bestTime] || quote.bestTime || '—';
    const clientWa   = `https://wa.me/972${(quote.phone||'').replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום ${quote.contactName}! כאן אפרים מ-NextClass 👋 ראיתי את הבקשה שלך (${quote.id}) — מתי נוח לדבר?`)}`;
    const itemCount  = (quote.items || []).length;
    const initials   = (quote.contactName || '?').split(' ').map(w => w[0]).slice(0,2).join('');

    const metaChips = [
        [urg.color, urg.bg, urg.badge],
        ['#374151', '#F3F4F6', `${itemCount} פריטים`],
        ['#374151', '#F3F4F6', `₪${subtotal.toLocaleString()}`],
        ['#374151', '#F3F4F6', quote.institutionType || '—'],
    ].map(([color, bg, label]) =>
        `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;margin-left:6px;margin-bottom:6px;border:1px solid ${bg === '#F3F4F6' ? '#E5E7EB' : 'transparent'};">${label}</span>`
    ).join('');

    const itemRows = (quote.items || []).map(item => {
        const lineTotal = priceNum(item.price ?? 0) * (item.qty ?? 1);
        return `
        <tr style="border-bottom:1px solid #F3F4F6;">
          <td style="padding:12px 16px;vertical-align:middle;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${item.image
                ? `<img src="${item.image}" width="40" height="40" style="border-radius:8px;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0;" />`
                : `<div style="width:40px;height:40px;border-radius:8px;background:#F3F4F6;flex-shrink:0;"></div>`}
              <div>
                <div style="font-size:13px;font-weight:600;color:#111827;">${item.title || '—'}</div>
                ${item.category ? `<div style="font-size:11px;color:#9CA3AF;margin-top:1px;">${item.category}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6B7280;white-space:nowrap;">× ${item.qty ?? 1}</td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6B7280;white-space:nowrap;">₪${priceNum(item.price??0).toLocaleString()}</td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;font-weight:700;color:#111827;white-space:nowrap;">₪${lineTotal.toLocaleString()}</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ליד חדש — ${quote.id}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;min-height:100vh;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Top bar -->
  <tr><td style="padding-bottom:20px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="display:inline-flex;align-items:center;gap:6px;">
          <div style="width:28px;height:28px;background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:7px;display:inline-block;vertical-align:middle;line-height:28px;text-align:center;font-size:14px;font-weight:900;color:#fff;">N</div>
          <span style="font-size:14px;font-weight:800;color:#111827;vertical-align:middle;margin-right:6px;">NextClass</span>
          <span style="font-size:13px;color:#9CA3AF;vertical-align:middle;">· ניהול הזמנות</span>
        </div>
      </td>
      <td style="text-align:left;">
        <span style="font-size:12px;color:#9CA3AF;">${quote.date} · ${quote.time}</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Alert header -->
  <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 32px;">
    <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">🔔 הזמנה חדשה התקבלה</div>
    <div style="font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;margin-bottom:6px;">${quote.contactName || 'ליד חדש'}</div>
    <div style="font-size:14px;color:#9CA3AF;margin-bottom:16px;">${quote.contactRole ? quote.contactRole + ' · ' : ''}${quote.institution || '—'}</div>
    <div style="margin-bottom:0;">${metaChips}</div>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#FFFFFF;border-radius:0 0 16px 16px;padding:0;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">

    <!-- Quick actions -->
    <div style="background:#F9FAFB;border-bottom:1px solid #F3F4F6;padding:20px 32px;">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px;">פעולות מהירות</div>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-left:10px;">
          <a href="${clientWa}" style="display:inline-flex;align-items:center;gap:7px;background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:50px;font-size:13px;font-weight:700;">
            💬 WhatsApp
          </a>
        </td>
        <td style="padding-left:10px;">
          <a href="tel:${(quote.phone||'').replace(/\D/g,'')}" style="display:inline-flex;align-items:center;gap:7px;background:#2563EB;color:#fff;text-decoration:none;padding:10px 18px;border-radius:50px;font-size:13px;font-weight:700;">
            📞 התקשר
          </a>
        </td>
        <td>
          <a href="mailto:${quote.email}" style="display:inline-flex;align-items:center;gap:7px;background:#FFFFFF;color:#374151;text-decoration:none;padding:10px 18px;border-radius:50px;font-size:13px;font-weight:700;border:1px solid #E5E7EB;">
            ✉️ מייל
          </a>
        </td>
      </tr></table>
    </div>

    <!-- Contact details -->
    <div style="padding:24px 32px;border-bottom:1px solid #F3F4F6;">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">פרטי התקשרות</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:14px;width:50%;vertical-align:top;">
            <div style="font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:3px;">טלפון</div>
            <div style="font-size:15px;font-weight:700;color:#111827;">${quote.phone || '—'}</div>
          </td>
          <td style="padding-bottom:14px;width:50%;vertical-align:top;">
            <div style="font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:3px;">מייל</div>
            <div style="font-size:14px;font-weight:600;color:#2563EB;">${quote.email || '—'}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:14px;vertical-align:top;">
            <div style="font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:3px;">אמצעי קשר מועדף</div>
            <div style="font-size:14px;font-weight:600;color:#111827;">${pref}</div>
          </td>
          <td style="padding-bottom:14px;vertical-align:top;">
            <div style="font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:3px;">שעה מועדפת</div>
            <div style="font-size:14px;font-weight:600;color:#111827;">${bestTime}</div>
          </td>
        </tr>
        ${quote.budgetRange ? `
        <tr>
          <td colspan="2" style="vertical-align:top;">
            <div style="font-size:11px;color:#9CA3AF;font-weight:600;margin-bottom:3px;">טווח תקציב</div>
            <div style="font-size:14px;font-weight:700;color:#D97706;">${quote.budgetRange}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Notes -->
    ${quote.notes ? `
    <div style="padding:20px 32px;border-bottom:1px solid #F3F4F6;background:#FFFBEB;">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">📝 הערות הלקוח</div>
      <div style="font-size:14px;color:#374151;line-height:1.75;border-right:3px solid #F59E0B;padding-right:14px;">${quote.notes}</div>
    </div>` : ''}

    <!-- Items table -->
    ${itemCount > 0 ? `
    <div style="padding:24px 32px 0;border-bottom:1px solid #F3F4F6;">
      <div style="font-size:11px;font-weight:700;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">🛒 פריטים (${itemCount})</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9CA3AF;font-weight:700;letter-spacing:1px;">מוצר</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9CA3AF;font-weight:700;letter-spacing:1px;">כמות</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9CA3AF;font-weight:700;letter-spacing:1px;">מחיר יח׳</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#9CA3AF;font-weight:700;letter-spacing:1px;">סה״כ</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>` : ''}

    <!-- Total + Admin CTA -->
    <div style="padding:24px 32px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:12px;color:#9CA3AF;font-weight:600;margin-bottom:2px;">סה״כ משוער</div>
            <div style="font-size:28px;font-weight:800;color:#111827;letter-spacing:-1px;">₪${subtotal.toLocaleString()}</div>
          </td>
          <td style="text-align:left;vertical-align:middle;">
            <a href="${ADMIN_URL}" style="display:inline-block;background:#111827;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;padding:12px 24px;border-radius:50px;">
              פתח בניהול →
            </a>
          </td>
        </tr>
      </table>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:20px;text-align:center;">
    <div style="font-size:12px;color:#9CA3AF;line-height:1.8;">
      NextClass · <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#6B7280;text-decoration:none;">${BIZ_PHONE}</a>
      &nbsp;·&nbsp; <a href="${SITE_URL}" style="color:#6B7280;text-decoration:none;">getnextclass.com</a>
    </div>
    <div style="font-size:11px;color:#D1D5DB;margin-top:6px;">הודעה פנימית · NextClass Admin System</div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.RESEND_API_KEY) {
        console.warn('[send-quote-email] RESEND_API_KEY not set');
        return res.status(200).json({ skipped: true, reason: 'RESEND_API_KEY not set' });
    }

    const { quote } = req.body ?? {};
    if (!quote?.id) return res.status(400).json({ error: 'Missing quote' });

    const errors = [];

    // 1. Customer confirmation
    if (quote.email) {
        try {
            await sendEmail(
                quote.email,
                `✅ הבקשה שלך התקבלה — ${quote.id} | NextClass`,
                customerEmailHtml(quote),
                `nextclass.en@gmail.com`
            );
        } catch (e) { errors.push({ to: 'customer', error: e.message }); }
    }

    // 2. Internal team notification
    const teamEmail = process.env.NEXTCLASS_EMAIL;
    if (teamEmail) {
        try {
            await sendEmail(
                teamEmail,
                `🔔 הזמנה חדשה — ${quote.contactName} · ${quote.institution} · ${quote.id}`,
                teamEmailHtml(quote),
                quote.email
            );
        } catch (e) { errors.push({ to: 'team', error: e.message }); }
    }

    res.status(200).json({ ok: true, errors: errors.length ? errors : undefined });
}
