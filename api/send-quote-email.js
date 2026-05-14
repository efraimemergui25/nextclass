/**
 * Vercel Serverless Function — Resend transactional email
 * POST /api/send-quote-email
 */

import { isRateLimited } from './_rateLimit.js';
import { logSecurityEvent } from './_logEvent.js';

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
    urgent:   { label: 'דחוף — השבוע',  color: '#FF3B30', bg: '#FFF2F0', dot: '#FF3B30', badge: 'דחוף' },
    month:    { label: 'תוך חודש',       color: '#FF9500', bg: '#FFF8EE', dot: '#FF9500', badge: 'תוך חודש' },
    flexible: { label: 'גמיש',            color: '#34C759', bg: '#F0FBF4', dot: '#34C759', badge: 'גמיש'  },
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
    const waLink    = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! שלחתי בקשה מספר ${quote.id} ואשמח לתיאום`)}`;

    const itemRows = (quote.items || []).map(item => {
        const lineTotal = priceNum(item.price ?? 0) * (item.qty ?? 1);
        return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #F5F5F7;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="52" style="vertical-align:middle;padding-left:0;">
                  ${item.image
                    ? `<img src="${item.image}" width="48" height="48" style="border-radius:10px;object-fit:cover;display:block;border:1px solid #E5E7EB;" />`
                    : `<div style="width:48px;height:48px;border-radius:10px;background:#F0F7FF;"></div>`}
                </td>
                <td style="padding-right:14px;vertical-align:middle;">
                  <div style="font-size:14px;font-weight:600;color:#1D1D1F;line-height:1.4;">${item.title || '—'}</div>
                  ${item.category ? `<div style="font-size:12px;color:#AEAEB2;margin-top:2px;">${item.category}</div>` : ''}
                </td>
                <td style="vertical-align:middle;white-space:nowrap;text-align:left;">
                  <div style="font-size:12px;color:#AEAEB2;text-align:center;">x ${item.qty ?? 1}</div>
                  <div style="font-size:14px;font-weight:700;color:#1D1D1F;text-align:center;margin-top:2px;">&#8362;${lineTotal.toLocaleString()}</div>
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
<body style="margin:0;padding:0;background:#F5F5F7;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo bar -->
  <tr><td style="padding-bottom:28px;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:8px;">
      <div style="width:32px;height:32px;background:#007AFF;border-radius:50%;display:inline-block;vertical-align:middle;line-height:32px;text-align:center;font-size:16px;font-weight:900;color:#fff;">N</div>
      <span style="font-size:16px;font-weight:800;color:#1D1D1F;vertical-align:middle;margin-right:6px;">NextClass</span>
    </div>
  </td></tr>

  <!-- Main card -->
  <tr><td style="background:#FFFFFF;border-radius:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06),0 6px 24px rgba(0,0,0,0.05);overflow:hidden;">

    <!-- Top accent bar -->
    <div style="height:3px;background:#007AFF;border-radius:24px 24px 0 0;"></div>

    <!-- Hero confirmation area -->
    <div style="background:#F0F7FF;padding:40px 40px 36px;text-align:center;">
      <!-- Success ring with check -->
      <div style="width:36px;height:36px;border-radius:50%;border:2px solid #34C759;margin:0 auto 20px;line-height:32px;font-size:18px;text-align:center;color:#34C759;">&#10003;</div>
      <div style="font-size:24px;font-weight:800;color:#1D1D1F;letter-spacing:-0.5px;margin-bottom:8px;">הבקשה התקבלה</div>
      <div style="font-size:14px;color:#6E6E73;margin-bottom:20px;">הצוות שלנו כבר בעניין ויצור איתך קשר בהקדם</div>
      <!-- Order ID pill -->
      <div style="display:inline-block;background:#FFFFFF;border:1px solid #007AFF;border-radius:50px;padding:8px 24px;">
        <span style="font-size:12px;color:#6E6E73;font-weight:600;">מספר בקשה</span>
        <span style="font-size:14px;color:#007AFF;font-weight:800;margin-right:8px;">${quote.id}</span>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">

      <!-- Greeting -->
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.7;">
        שלום ${firstName},<br/>
        קיבלנו את הבקשה שלך עבור <strong style="color:#1D1D1F;">${quote.institution || 'המוסד שלך'}</strong>.<br/>
        נציג מטעמנו יצור איתך קשר ${quote.urgency === 'urgent' ? '<strong style="color:#FF3B30;">תוך שעות ספורות</strong>' : 'תוך יום עסקים אחד'} דרך ${contactPrefMap[quote.preferredContact] || quote.preferredContact || 'הערוץ המועדף עליך'}.
      </p>

      <!-- Divider -->
      <div style="height:1px;background:#F5F5F7;margin-bottom:28px;"></div>

      <!-- Steps -->
      <div style="margin-bottom:28px;">
        <div style="font-size:12px;font-weight:600;color:#6E6E73;margin-bottom:16px;">מה קורה עכשיו</div>
        ${[
            ['#007AFF', '1', 'הבקשה נקלטה במערכת', 'הפרטים שלך עברו לנציג המתאים ביותר'],
            ['#5856D6', '2', 'ניצור איתך קשר', `דרך ${contactPrefMap[quote.preferredContact] || quote.preferredContact || '—'} ${bestTimeMap[quote.bestTime] ? '· ' + bestTimeMap[quote.bestTime] : ''}`],
            ['#34C759', '3', 'הצעת מחיר אישית', 'נשלח לך מחיר מפורט ומותאם לצרכי המוסד'],
        ].map(([color, n, title, desc]) => `
        <div style="display:flex;align-items:flex-start;gap:0;margin-bottom:16px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;flex-shrink:0;margin-left:14px;">${n}</div>
          <div style="padding-top:3px;">
            <div style="font-size:14px;font-weight:700;color:#1D1D1F;">${title}</div>
            <div style="font-size:13px;color:#6E6E73;margin-top:2px;">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      <!-- Items -->
      ${(quote.items || []).length > 0 ? `
      <div style="margin-bottom:28px;">
        <div style="font-size:12px;font-weight:600;color:#6E6E73;margin-bottom:4px;">הפריטים שבחרת</div>
        <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
        <!-- Total row -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0 0;border-top:2px solid #F5F5F7;margin-top:4px;">
          <span style="font-size:13px;font-weight:600;color:#6E6E73;">סה״כ משוער</span>
          <span style="font-size:20px;font-weight:800;color:#1D1D1F;">&#8362;${subtotal.toLocaleString()}</span>
        </div>
        <div style="font-size:11px;color:#AEAEB2;margin-top:4px;text-align:left;">* המחיר הסופי ייקבע בהצעה המותאמת אישית</div>
      </div>` : ''}

      <!-- Urgency badge -->
      <div style="border-right:4px solid ${urg.color};background:${urg.bg};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:700;color:${urg.color};">דחיפות: ${urg.label}</div>
        <div style="font-size:12px;color:#AEAEB2;margin-top:2px;">נתחשב בכך במענה</div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${waLink}" style="display:inline-block;background:#007AFF;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:50px;">
          שלחו לנו הודעה בוואטסאפ
        </a>
      </div>
      <div style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:10px;">זמינים ב-WhatsApp ראשון–שישי, 08:00–20:00</div>

    </div>

    <!-- Footer strip -->
    <div style="background:#F5F5F7;border-top:1px solid #F5F5F7;padding:24px 40px;text-align:center;">
      <div style="font-size:13px;font-weight:600;color:#1D1D1F;margin-bottom:6px;">NextClass — הסטנדרט הטכנולוגי של חינוך ישראל</div>
      <div style="font-size:12px;color:#6E6E73;">
        <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#007AFF;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:#007AFF;text-decoration:none;font-weight:600;">getnextclass.com</a>
      </div>
      <div style="font-size:11px;color:#AEAEB2;margin-top:12px;">קיבלת מייל זה כי שלחת בקשת הצעת מחיר דרך האתר שלנו · ${quote.date}</div>
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
    const clientWa   = `https://wa.me/972${(quote.phone||'').replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום ${quote.contactName}! כאן אפרים מ-NextClass. ראיתי את הבקשה שלך (${quote.id}) — מתי נוח לדבר?`)}`;
    const itemCount  = (quote.items || []).length;

    const metaChips = [
        [urg.color, urg.bg, urg.badge],
        ['#1D1D1F', '#F5F5F7', `${itemCount} פריטים`],
        ['#1D1D1F', '#F5F5F7', `&#8362;${subtotal.toLocaleString()}`],
        ['#1D1D1F', '#F5F5F7', quote.institutionType || '—'],
    ].map(([color, bg, label]) =>
        `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;padding:4px 12px;border-radius:50px;margin-left:6px;margin-bottom:6px;border:1px solid ${bg === '#F5F5F7' ? '#E5E7EB' : 'transparent'};">${label}</span>`
    ).join('');

    const itemRows = (quote.items || []).map((item, i) => {
        const lineTotal = priceNum(item.price ?? 0) * (item.qty ?? 1);
        const rowBg = i % 2 === 1 ? 'background:#FAFAFA;' : '';
        return `
        <tr style="border-bottom:1px solid #F5F5F7;${rowBg}">
          <td style="padding:12px 16px;vertical-align:middle;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${item.image
                ? `<img src="${item.image}" width="40" height="40" style="border-radius:8px;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0;" />`
                : `<div style="width:40px;height:40px;border-radius:8px;background:#F5F5F7;flex-shrink:0;"></div>`}
              <div>
                <div style="font-size:13px;font-weight:600;color:#1D1D1F;">${item.title || '—'}</div>
                ${item.category ? `<div style="font-size:11px;color:#AEAEB2;margin-top:1px;">${item.category}</div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6E6E73;white-space:nowrap;">x ${item.qty ?? 1}</td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6E6E73;white-space:nowrap;">&#8362;${priceNum(item.price??0).toLocaleString()}</td>
          <td style="padding:12px 16px;text-align:center;font-size:13px;font-weight:700;color:#1D1D1F;white-space:nowrap;">&#8362;${lineTotal.toLocaleString()}</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>הזמנה חדשה — ${quote.id}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;min-height:100vh;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- Main card -->
  <tr><td style="background:#FFFFFF;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);overflow:hidden;">

    <!-- Top accent bar -->
    <div style="height:3px;background:#007AFF;border-radius:16px 16px 0 0;"></div>

    <!-- Card header: logo + date -->
    <div style="padding:20px 32px 16px;background:#FFFFFF;border-bottom:1px solid #F5F5F7;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <div style="display:inline-flex;align-items:center;gap:6px;">
            <div style="width:28px;height:28px;background:#007AFF;border-radius:50%;display:inline-block;vertical-align:middle;line-height:28px;text-align:center;font-size:14px;font-weight:900;color:#fff;">N</div>
            <span style="font-size:14px;font-weight:800;color:#1D1D1F;vertical-align:middle;margin-right:6px;">NextClass</span>
          </div>
        </td>
        <td style="text-align:left;">
          <span style="font-size:12px;color:#6E6E73;">${quote.date} · ${quote.time}</span>
        </td>
      </tr></table>
    </div>

    <!-- Lead summary: light blue tinted section -->
    <div style="background:#F0F7FF;padding:24px 32px 20px;">
      <div style="font-size:11px;font-weight:600;color:#007AFF;margin-bottom:10px;">הזמנה חדשה</div>
      <div style="font-size:22px;font-weight:800;color:#1D1D1F;letter-spacing:-0.5px;margin-bottom:4px;">${quote.contactName || 'ליד חדש'}</div>
      <div style="font-size:14px;color:#6E6E73;margin-bottom:16px;">${quote.contactRole ? quote.contactRole + ' · ' : ''}${quote.institution || '—'}</div>
      <div style="margin-bottom:0;">${metaChips}</div>
    </div>

    <!-- Quick actions -->
    <div style="background:#FFFFFF;border-bottom:1px solid #F5F5F7;padding:20px 32px;">
      <div style="font-size:11px;font-weight:600;color:#AEAEB2;margin-bottom:14px;">פעולות מהירות</div>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-left:10px;">
          <a href="${clientWa}" style="display:inline-block;background:#34C759;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;">
            שלחו וואטסאפ
          </a>
        </td>
        <td style="padding-left:10px;">
          <a href="tel:${(quote.phone||'').replace(/\D/g,'')}" style="display:inline-block;background:#007AFF;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;">
            התקשרו
          </a>
        </td>
        <td>
          <a href="mailto:${quote.email}" style="display:inline-block;background:#FFFFFF;color:#1D1D1F;text-decoration:none;padding:10px 20px;border-radius:50px;font-size:13px;font-weight:700;border:1px solid #1D1D1F;">
            שלחו מייל
          </a>
        </td>
      </tr></table>
    </div>

    <!-- Contact details -->
    <div style="padding:24px 32px;border-bottom:1px solid #F5F5F7;">
      <div style="font-size:11px;font-weight:600;color:#AEAEB2;margin-bottom:16px;">פרטי התקשרות</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom:14px;width:50%;vertical-align:top;">
            <div style="font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:3px;">טלפון</div>
            <div style="font-size:15px;font-weight:700;color:#1D1D1F;">${quote.phone || '—'}</div>
          </td>
          <td style="padding-bottom:14px;width:50%;vertical-align:top;">
            <div style="font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:3px;">מייל</div>
            <div style="font-size:14px;font-weight:600;color:#007AFF;">${quote.email || '—'}</div>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:14px;vertical-align:top;">
            <div style="font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:3px;">אמצעי קשר מועדף</div>
            <div style="font-size:14px;font-weight:600;color:#1D1D1F;">${pref}</div>
          </td>
          <td style="padding-bottom:14px;vertical-align:top;">
            <div style="font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:3px;">שעה מועדפת</div>
            <div style="font-size:14px;font-weight:600;color:#1D1D1F;">${bestTime}</div>
          </td>
        </tr>
        ${quote.budgetRange ? `
        <tr>
          <td colspan="2" style="vertical-align:top;">
            <div style="font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:3px;">טווח תקציב</div>
            <div style="font-size:14px;font-weight:700;color:#FF9500;">${quote.budgetRange}</div>
          </td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Notes -->
    ${quote.notes ? `
    <div style="padding:20px 32px;border-bottom:1px solid #F5F5F7;background:#FFF9F0;border-right:4px solid #FF9500;">
      <div style="font-size:11px;font-weight:600;color:#AEAEB2;margin-bottom:10px;">הערות הלקוח</div>
      <div style="font-size:14px;color:#1D1D1F;line-height:1.75;">${quote.notes}</div>
    </div>` : ''}

    <!-- Items table -->
    ${itemCount > 0 ? `
    <div style="padding:24px 32px 0;border-bottom:1px solid #F5F5F7;">
      <div style="font-size:11px;font-weight:600;color:#AEAEB2;margin-bottom:16px;">פריטים (${itemCount})</div>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr style="background:#F5F5F7;">
          <th style="padding:10px 16px;text-align:right;font-size:11px;color:#AEAEB2;font-weight:700;">מוצר</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#AEAEB2;font-weight:700;">כמות</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#AEAEB2;font-weight:700;">מחיר יח׳</th>
          <th style="padding:10px 16px;text-align:center;font-size:11px;color:#AEAEB2;font-weight:700;">סה״כ</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>` : ''}

    <!-- Total + Admin CTA -->
    <div style="padding:24px 32px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:12px;color:#AEAEB2;font-weight:600;margin-bottom:2px;">סה״כ משוער</div>
            <div style="font-size:28px;font-weight:800;color:#1D1D1F;letter-spacing:-1px;">&#8362;${subtotal.toLocaleString()}</div>
          </td>
          <td style="text-align:left;vertical-align:middle;">
            <a href="${ADMIN_URL}" style="display:inline-block;background:#007AFF;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;padding:12px 24px;border-radius:50px;">
              פתח בניהול
            </a>
          </td>
        </tr>
      </table>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:20px;text-align:center;">
    <div style="font-size:12px;color:#AEAEB2;line-height:1.8;">
      NextClass · <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#6E6E73;text-decoration:none;">${BIZ_PHONE}</a>
      &nbsp;·&nbsp; <a href="${SITE_URL}" style="color:#6E6E73;text-decoration:none;">getnextclass.com</a>
    </div>
    <div style="font-size:11px;color:#AEAEB2;margin-top:6px;">הודעה פנימית · NextClass Admin System</div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 5, windowMs: 60_000 })) {
        logSecurityEvent('rate_limited', { endpoint: 'send-quote-email', ip });
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (JSON.stringify(req.body ?? {}).length > 32_000) {
        logSecurityEvent('payload_too_large', { endpoint: 'send-quote-email', ip });
        return res.status(413).json({ error: 'Payload too large' });
    }

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
                `הבקשה שלך התקבלה — ${quote.id} | NextClass`,
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
                `הזמנה חדשה — ${quote.contactName} · ${quote.institution} · ${quote.id}`,
                teamEmailHtml(quote),
                quote.email
            );
        } catch (e) { errors.push({ to: 'team', error: e.message }); }
    }

    res.status(200).json({ ok: true, errors: errors.length ? errors : undefined });
}
