/**
 * Vercel Serverless Function — Stage-based transactional emails
 * POST /api/send-stage-email
 * Body: { type, quote, extra? }
 *
 * types: contact | quote_sent | reminder | confirmed | in_transit | delivered
 */

import { isRateLimited } from './_rateLimit.js';
import { queuePendingEmail } from './_pendingEmail.js';

const BIZ_PHONE  = process.env.NEXTCLASS_PHONE || '058-585-6356';
const SITE_URL   = process.env.NEXTCLASS_SITE_URL || 'https://nextclass-v4-living.vercel.app';
const FONT       = "'Helvetica Neue', Helvetica, Arial, sans-serif";
// Legal business identity (single source: src/admin/lib/businessProfile.js)
const BIZ_LEGAL_NAME = 'נקסט קלאס בע״מ';
const BIZ_TAX_ID     = '510942360';
const BIZ_ADDRESS    = 'אזור התעשייה 100, רמלה';

function priceNum(p) {
    return Number(String(p ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

// ── Shared HTML primitives ─────────────────────────────────────────────────────

function emailWrapper({ preheader = '', accentColor = '#007AFF', heroIcon = '✓', heroIconBg = 'linear-gradient(135deg,#34C759,#28A745)', heroTitle, heroSub, quoteId, body, footerNote = '' }) {
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent('שלום NextClass!')}`;
    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${heroTitle}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:${FONT};-webkit-font-smoothing:antialiased;direction:rtl;">

<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;min-height:100vh;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <!-- Logo -->
  <tr><td style="padding-bottom:24px;text-align:center;">
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

  <!-- Main card -->
  <tr><td style="background:#FFFFFF;border-radius:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06),0 8px 32px rgba(0,0,0,0.07);overflow:hidden;">

    <div style="height:4px;background:linear-gradient(90deg,${accentColor} 0%,${accentColor}99 100%);border-radius:24px 24px 0 0;"></div>

    <!-- Hero -->
    <div style="background:linear-gradient(180deg,#F0F7FF 0%,#FAFCFF 100%);padding:44px 40px 36px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
        <tr>
          <td style="width:72px;height:72px;border-radius:50%;background:${heroIconBg};text-align:center;vertical-align:middle;box-shadow:0 8px 28px ${accentColor}45;">
            <span style="font-size:34px;color:#fff;line-height:72px;font-weight:900;">${heroIcon}</span>
          </td>
        </tr>
      </table>
      <div style="font-size:26px;font-weight:900;color:#1D1D1F;letter-spacing:-0.6px;margin-bottom:6px;">${heroTitle}</div>
      <div style="font-size:15px;color:#6E6E73;margin-bottom:${quoteId ? '22px' : '0'};line-height:1.6;">${heroSub}</div>
      ${quoteId ? `<div style="display:inline-block;background:#FFFFFF;border:1.5px solid ${accentColor};border-radius:50px;padding:8px 24px;">
        <span style="font-size:12px;color:#6E6E73;font-weight:600;">מספר בקשה</span>
        <span style="font-size:14px;color:${accentColor};font-weight:900;margin-right:10px;">${quoteId}</span>
      </div>` : ''}
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;">${body}</div>

    <!-- CUSTOM_NOTE_SLOT -->

    <!-- Footer -->
    <div style="background:#F5F5F7;border-top:1px solid #EBEBEB;padding:24px 40px;text-align:center;">
      <div style="font-size:13px;font-weight:600;color:#1D1D1F;margin-bottom:6px;">NextClass — הסטנדרט הטכנולוגי של חינוך ישראל</div>
      <div style="font-size:12px;color:#6E6E73;">
        <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#007AFF;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a>
        &nbsp;·&nbsp;
        <a href="${SITE_URL}" style="color:#007AFF;text-decoration:none;font-weight:600;">getnextclass.com</a>
        &nbsp;·&nbsp;
        <a href="${waLink}" style="color:#25D366;text-decoration:none;font-weight:600;">WhatsApp</a>
      </div>
      ${footerNote ? `<div style="font-size:11px;color:#AEAEB2;margin-top:10px;">${footerNote}</div>` : ''}
      <div style="font-size:10.5px;color:#B8BCC4;margin-top:12px;line-height:1.6;border-top:1px solid #EBEBEB;padding-top:12px;">
        ${BIZ_LEGAL_NAME} · ח.פ ${BIZ_TAX_ID} · ${BIZ_ADDRESS}
      </div>
    </div>

  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function itemsTable(items = []) {
    if (!items?.length) return '';
    const rows = items.map(item => {
        const qty = item.qty ?? item.quantity ?? 1;
        const price = priceNum(item.salePrice ?? item.price ?? 0);
        const lineTotal = price * qty;
        return `<tr>
          <td style="padding:0 0 12px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFCFF;border-radius:14px;overflow:hidden;border:1px solid #EEF2FF;">
              <tr>
                <td width="72" style="vertical-align:top;padding:0;">
                  ${item.image
                    ? `<img src="${item.image}" width="72" height="72" style="border-radius:14px 0 0 14px;object-fit:cover;display:block;" />`
                    : `<div style="width:72px;height:72px;border-radius:14px 0 0 14px;background:linear-gradient(135deg,#EEF2FF,#F0F7FF);text-align:center;line-height:72px;font-size:26px;">📦</div>`}
                </td>
                <td style="padding:12px 14px;vertical-align:middle;">
                  <div style="font-size:13px;font-weight:700;color:#1D1D1F;margin-bottom:4px;">${item.title || '—'}</div>
                  ${item.category ? `<div style="display:inline-block;font-size:10px;font-weight:700;color:#5856D6;background:#EEF2FF;padding:2px 8px;border-radius:50px;margin-bottom:4px;">${item.category}</div>` : ''}
                  <div style="font-size:11px;color:#AEAEB2;">×${qty} יח׳${price ? ` · ₪${price.toLocaleString()} ליח׳` : ''}</div>
                </td>
                <td style="padding:12px 14px;vertical-align:middle;text-align:left;white-space:nowrap;">
                  <div style="font-size:17px;font-weight:800;color:#1D1D1F;">₪${lineTotal.toLocaleString()}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    }).join('');
    return `<div style="margin-bottom:28px;">
      <div style="font-size:12px;font-weight:700;color:#6E6E73;margin-bottom:10px;">הפריטים שבחרת</div>
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </div>`;
}

function ctaButton(label, href, color = '#007AFF', shadowColor) {
    return `<div style="text-align:center;margin-bottom:12px;">
      <a href="${href}" style="display:inline-block;background:${color};color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:800;padding:16px 44px;border-radius:50px;box-shadow:0 4px 16px ${shadowColor || color}55;">
        ${label}
      </a>
    </div>`;
}

function divider() {
    return `<div style="height:1px;background:#F5F5F7;margin:0 0 28px;"></div>`;
}

// ── Email type builders ────────────────────────────────────────────────────────

// Sent automatically on form submission — admin does NOT resend this
function buildContactEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! בקשה מספר ${quote.id} — אשמח לתיאום`)}`;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        קיבלנו את פנייתך עבור <strong>${quote.institution || 'המוסד שלך'}</strong>.<br/>
        נציג מקצועי ייצור איתך קשר תוך שעות ספורות.
      </p>
      ${divider()}
      <div style="margin-bottom:28px;">
        <div style="font-size:12px;font-weight:700;color:#6E6E73;margin-bottom:16px;">מה קורה עכשיו</div>
        ${[
            ['#007AFF','1','הבקשה נקלטה','הפרטים שלך אצל נציג מקצועי'],
            ['#5856D6','2','נציור איתך קשר','תוך שעות ספורות דרך הערוץ המועדף'],
            ['#34C759','3','הצעת מחיר אישית','מחיר מותאם לצרכי המוסד'],
        ].map(([c,n,t,d]) => `
        <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
          <div style="width:28px;height:28px;border-radius:50%;background:${c};color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;flex-shrink:0;margin-left:14px;">${n}</div>
          <div style="padding-top:3px;">
            <div style="font-size:14px;font-weight:700;color:#1D1D1F;">${t}</div>
            <div style="font-size:13px;color:#6E6E73;margin-top:2px;">${d}</div>
          </div>
        </div>`).join('')}
      </div>
      ${itemsTable(quote.items)}
      ${ctaButton('שאלה? שלחו לנו הודעה', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
    `;

    return emailWrapper({
        preheader: `${firstName}, קיבלנו את בקשתך — נחזור אליך בהקדם`,
        accentColor: '#007AFF',
        heroIcon: '👋',
        heroIconBg: 'linear-gradient(135deg,#007AFF,#5856D6)',
        heroTitle: `קיבלנו את בקשתך!`,
        heroSub: 'נציג יצור איתך קשר תוך שעות ספורות',
        quoteId: quote.id,
        body,
        footerNote: `קיבלת מייל זה כי פנית ל-NextClass · ${quote.date || ''}`,
    });
}

function buildQuoteSentEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const subtotal = priceNum(quote.subtotal);
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! לגבי הצעת המחיר ${quote.id} — מאשר`)}`;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        הכנו עבורך הצעת מחיר מפורטת עבור <strong>${quote.institution || 'המוסד שלך'}</strong>.<br/>
        עברנו על כל הפריטים שביקשת ומצאנו עבורך את המחיר הטוב ביותר.
      </p>
      ${divider()}
      ${itemsTable(quote.items)}
      ${subtotal > 0 ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:linear-gradient(135deg,#F0F7FF,#F5F0FF);border-radius:18px;margin-bottom:28px;border:1.5px solid rgba(88,86,214,0.15);">
        <div>
          <div style="font-size:12px;font-weight:700;color:#5856D6;margin-bottom:3px;">סה״כ הצעה סופית</div>
          <div style="font-size:11px;color:#AEAEB2;">כולל מע"מ · בתוקף ל-7 ימים</div>
        </div>
        <div style="font-size:32px;font-weight:900;color:#5856D6;letter-spacing:-1px;">₪${subtotal.toLocaleString()}</div>
      </div>` : ''}
      <div style="border-right:4px solid #34C759;background:#F0FBF4;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:28px;">
        <div style="font-size:13px;font-weight:800;color:#1D1D1F;margin-bottom:4px;">כיצד לאשר?</div>
        <div style="font-size:13px;color:#3D3D3D;line-height:1.6;">שלחו "אישור" בוואטסאפ, ענו למייל זה, או התקשרו ל-${BIZ_PHONE} — ונתחיל מיד.</div>
      </div>
      ${ctaButton('✅ אישור הצעה בוואטסאפ', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <div style="text-align:center;margin-top:10px;">
        <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="display:inline-block;background:#F5F5F7;color:#1D1D1F;text-decoration:none;font-size:13px;font-weight:700;padding:11px 30px;border-radius:50px;border:1.5px solid #EBEBEB;">📞 ${BIZ_PHONE}</a>
      </div>
    `;

    return emailWrapper({
        preheader: `${firstName}, הצעת המחיר מוכנה — ₪${subtotal.toLocaleString()} · ממתינה לאישורך`,
        accentColor: '#5856D6',
        heroIcon: '💰',
        heroIconBg: 'linear-gradient(135deg,#5856D6,#007AFF)',
        heroTitle: 'הצעת המחיר מוכנה!',
        heroSub: `הצעה אישית עבור ${quote.institution || 'המוסד שלך'}`,
        quoteId: quote.id,
        body,
        footerNote: `ההצעה בתוקף ל-7 ימים · ${quote.date || ''}`,
    });
}

// Short & urgent — no items table, just price + deadline + single CTA
function buildReminderEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const subtotal = priceNum(quote.subtotal);
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! לגבי הצעת מחיר ${quote.id} — מאשר`)}`;
    const daysLeft = quote.quoteSentAt
        ? Math.max(0, 7 - Math.floor((Date.now() - quote.quoteSentAt) / 86400000))
        : null;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName}, תזכורת קצרה —<br/>
        הצעת המחיר עבור <strong>${quote.institution || 'המוסד שלך'}</strong> עדיין פתוחה.
      </p>
      <div style="padding:24px 28px;background:linear-gradient(135deg,#FFF8EE,#FFFDF7);border-radius:20px;border:2px solid rgba(255,149,0,0.3);margin-bottom:28px;text-align:center;">
        ${subtotal > 0 ? `<div style="font-size:36px;font-weight:900;color:#1D1D1F;letter-spacing:-1px;margin-bottom:6px;">₪${subtotal.toLocaleString()}</div>` : ''}
        <div style="font-size:13px;color:#6E6E73;">${(quote.items || []).length} פריטים עבור ${quote.institution || ''}</div>
        ${daysLeft !== null ? `<div style="margin-top:12px;display:inline-block;background:${daysLeft <= 2 ? '#FF3B30' : '#FF9500'};color:#fff;font-size:12px;font-weight:800;padding:6px 18px;border-radius:50px;">
          ${daysLeft === 0 ? '⚠️ ההצעה פגה היום!' : daysLeft === 1 ? '⚠️ נותר יום אחד בלבד' : `⏰ נותרו ${daysLeft} ימים`}
        </div>` : ''}
      </div>
      ${ctaButton('✅ אישור ההצעה עכשיו', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <p style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:16px;">יש שאלות? נשמח לעזור — <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#007AFF;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a><br/>אם ההצעה לא רלוונטית — אין צורך לענות.</p>
    `;

    return emailWrapper({
        preheader: `${firstName}, הצעת המחיר ${quote.id} ${daysLeft === 0 ? 'פגה היום' : daysLeft === 1 ? 'פגה מחר' : `בתוקף עוד ${daysLeft} ימים`}`,
        accentColor: '#FF9500',
        heroIcon: '⏰',
        heroIconBg: 'linear-gradient(135deg,#FF9500,#FF6B00)',
        heroTitle: 'תזכורת: יש הצעה פתוחה',
        heroSub: 'אישור מהיר — ונתחיל מיד',
        quoteId: quote.id,
        body,
    });
}

// Sent after customer verbally approves — confirms we got the approval and wraps up details
function buildConfirmedEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const subtotal = priceNum(quote.subtotal);
    const sd = quote.shippingDetails || {};

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        ההזמנה שלך לטובת <strong>${quote.institution || 'המוסד שלך'}</strong> <strong>אושרה רשמית</strong>.<br/>
        זהו האישור הכתוב שלך — שמרו לעיון עתידי.
      </p>
      ${divider()}
      ${subtotal > 0 ? `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;background:linear-gradient(135deg,#F0FBF4,#FAFFF7);border-radius:18px;margin-bottom:24px;border:1.5px solid rgba(52,199,89,0.25);">
        <div>
          <div style="font-size:12px;font-weight:700;color:#34C759;margin-bottom:3px;">סכום הזמנה מאושר</div>
          <div style="font-size:11px;color:#AEAEB2;">${(quote.items||[]).length} פריטים · ${quote.institution || ''}</div>
        </div>
        <div style="font-size:32px;font-weight:900;color:#34C759;letter-spacing:-1px;">₪${subtotal.toLocaleString()}</div>
      </div>` : ''}
      ${sd.address ? `
      <div style="padding:16px 20px;background:#FAFCFF;border-radius:16px;border:1px solid #EEF2FF;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#6E6E73;margin-bottom:10px;">📍 כתובת למשלוח</div>
        <div style="font-size:14px;font-weight:700;color:#1D1D1F;">${sd.deliveryName || quote.contactName}</div>
        <div style="font-size:13px;color:#6E6E73;margin-top:3px;">${sd.address}${sd.city ? `, ${sd.city}` : ''}${sd.zip ? ` ${sd.zip}` : ''}</div>
        ${sd.deliveryPhone ? `<div style="font-size:13px;color:#007AFF;margin-top:3px;font-weight:600;">${sd.deliveryPhone}</div>` : ''}
      </div>` : ''}
      <div style="background:#F0F7FF;border-radius:16px;padding:18px 20px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:800;color:#007AFF;margin-bottom:10px;">⚙️ מה קורה עכשיו</div>
        <div style="font-size:13px;color:#3D3D3D;line-height:1.7;">הצוות שלנו בטיפול מלא בהזמנה ומכין את המשלוח עבורך. תקבל עדכון נוסף ברגע שהמשלוח יוצא לדרך עם מספר מעקב.</div>
      </div>
      <div style="border-right:4px solid #34C759;background:#F0FBF4;border-radius:0 12px 12px 0;padding:14px 18px;">
        <div style="font-size:13px;color:#3D3D3D;line-height:1.65;">שאלות? — <strong>${BIZ_PHONE}</strong> · <strong>nextclass.en@gmail.com</strong></div>
      </div>
    `;

    return emailWrapper({
        preheader: `${firstName}, ההזמנה ${quote.id} אושרה רשמית — שמרו את האישור הזה`,
        accentColor: '#34C759',
        heroIcon: '✅',
        heroIconBg: 'linear-gradient(135deg,#34C759,#28A745)',
        heroTitle: 'ההזמנה אושרה רשמית',
        heroSub: 'זהו האישור הכתוב שלך — תקבל עדכון משלוח בקרוב',
        quoteId: quote.id,
        body,
        footerNote: `תאריך אישור: ${new Date().toLocaleDateString('he-IL')}`,
    });
}

function buildInTransitEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const ti = quote.trackingInfo || {};
    const sd = quote.shippingDetails || {};
    const so = quote.supplierOrder || {};
    const deliveryDate = ti.estimatedDelivery || so.estimatedDelivery || '';
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! לגבי הזמנה ${quote.id} — שאלה על המשלוח`)}`;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.8;">
        שלום ${firstName},<br/>
        מעולה — ההזמנה שלך יצאה לדרך ובדרך אליך! 🎉<br/>
        ${deliveryDate ? `הגעה משוערת: <strong>${deliveryDate}</strong>` : 'נעדכן אותך עם תאריך מדויק בהקדם.'}
      </p>
      ${divider()}

      <!-- Tracking card -->
      <div style="text-align:center;padding:28px 24px;background:linear-gradient(135deg,#F5F0FF,#EEF2FF);border-radius:22px;margin-bottom:24px;border:1.5px solid rgba(124,58,237,0.18);">
        <div style="font-size:30px;margin-bottom:12px;">🚚</div>
        ${ti.trackingNumber ? `
          <div style="font-size:11px;font-weight:800;color:#7C3AED;letter-spacing:0.08em;margin-bottom:8px;">מספר מעקב</div>
          <div style="font-size:28px;font-weight:900;color:#1D1D1F;letter-spacing:3px;margin-bottom:10px;">${ti.trackingNumber}</div>
          ${ti.carrier ? `<div style="display:inline-block;background:rgba(124,58,237,0.08);color:#7C3AED;font-size:12px;font-weight:700;padding:4px 14px;border-radius:50px;margin-bottom:8px;">${ti.carrier}</div>` : ''}
        ` : `<div style="font-size:15px;font-weight:800;color:#1D1D1F;margin-bottom:8px;">המשלוח יצא לדרך!</div>`}
        ${deliveryDate ? `<div style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5856D6);color:#fff;font-size:13px;font-weight:800;padding:8px 22px;border-radius:50px;">📅 הגעה: ${deliveryDate}</div>` : ''}
      </div>

      <!-- Order number + courier note -->
      <div style="padding:16px 20px;background:#FAF9FF;border-radius:16px;border:1px solid rgba(124,58,237,0.12);margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:5px 0;">
              <span style="font-size:11px;color:#86868B;font-weight:600;">מספר הזמנה: </span>
              <span style="font-size:12px;font-weight:800;color:#7C3AED;">${quote.id}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0 0;">
              <div style="font-size:13px;color:#3D3D3D;line-height:1.65;">📞 <strong>השליח יצור איתך קשר</strong> לתיאום שעת המסירה — אנא שמור על הטלפון פנוי.</div>
            </td>
          </tr>
        </table>
      </div>

      ${sd.address ? `
      <div style="padding:16px 20px;background:#FAFCFF;border-radius:16px;border:1px solid #EEF2FF;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:800;color:#7C3AED;margin-bottom:10px;">📍 כתובת יעד</div>
        <div style="font-size:14px;font-weight:700;color:#1D1D1F;">${sd.deliveryName || firstName}</div>
        <div style="font-size:13px;color:#6E6E73;margin-top:3px;">${sd.address}${sd.city ? `, ${sd.city}` : ''}${sd.zip ? ` ${sd.zip}` : ''}</div>
        ${sd.deliveryPhone ? `<div style="font-size:13px;color:#7C3AED;font-weight:600;margin-top:3px;">${sd.deliveryPhone}</div>` : ''}
      </div>` : ''}

      ${ctaButton('💬 שאלה על המשלוח?', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <p style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:14px;">או התקשרו: <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#7C3AED;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a></p>
    `;

    return emailWrapper({
        preheader: `${firstName}, ההזמנה ${quote.id} בדרך אליך! 🚚${ti.trackingNumber ? ` מעקב: ${ti.trackingNumber}` : ''}${ti.estimatedDelivery ? ` · הגעה: ${ti.estimatedDelivery}` : ''}`,
        accentColor: '#7C3AED',
        heroIcon: '🚚',
        heroIconBg: 'linear-gradient(135deg,#7C3AED,#5856D6)',
        heroTitle: 'בדרך אליך!',
        heroSub: ti.estimatedDelivery ? `הגעה משוערת: ${ti.estimatedDelivery}` : 'המשלוח יצא — נעדכן עם פרטי מעקב',
        quoteId: quote.id,
        body,
    });
}

// One rating criterion row: 5 stars, each links to WhatsApp pre-filled with the score.
function ratingRow(label, emoji, quoteId) {
    const digits = BIZ_PHONE.replace(/\D/g, '').replace(/^0/, '');
    const stars = [1, 2, 3, 4, 5].map(n => {
        const wa = `https://wa.me/972${digits}?text=${encodeURIComponent(`דירוג ${label}: ${n}/5 · הזמנה ${quoteId}`)}`;
        return `<a href="${wa}" style="text-decoration:none;font-size:24px;line-height:1;color:#FFB800;margin:0 1px;">★</a>`;
    }).join('');
    return `<tr>
      <td style="padding:10px 0;font-size:14px;font-weight:700;color:#1D1D1F;white-space:nowrap;">${emoji} ${label}</td>
      <td style="padding:10px 0;text-align:left;">${stars}</td>
    </tr>`;
}

function buildDeliveredEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום NextClass! לגבי הזמנה ${quote.id}`)}`;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        ההזמנה שלך עבור <strong>${quote.institution || 'המוסד'}</strong> נמסרה בהצלחה — תודה רבה שבחרת ב-NextClass! 🙏<br/>
        נשמח לעמוד לרשותך גם בעתיד לכל צורך.
      </p>
      ${divider()}

      <!-- Rating card -->
      <div style="padding:24px 24px 14px;background:linear-gradient(135deg,#FFFBF0,#FFF8E8);border-radius:20px;margin-bottom:24px;border:1.5px solid rgba(255,184,0,0.28);">
        <div style="text-align:center;margin-bottom:6px;">
          <div style="font-size:32px;margin-bottom:6px;">⭐</div>
          <div style="font-size:16px;font-weight:900;color:#1D1D1F;">איך היה השירות שלנו?</div>
          <div style="font-size:12.5px;color:#8A6D1F;margin-top:4px;">הדירוג שלך עוזר לנו להשתפר — לחיצה על כוכב שולחת אלינו את הציון</div>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${ratingRow('המוצר', '🖥️', quote.id)}
          ${ratingRow('השירות', '🤝', quote.id)}
          ${ratingRow('המשלוח', '🚚', quote.id)}
        </table>
      </div>

      <!-- Invoice note -->
      <div style="border-right:4px solid #007AFF;background:#F0F7FF;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:24px;">
        <div style="font-size:14px;font-weight:800;color:#007AFF;margin-bottom:4px;">🧾 חשבונית מס</div>
        <div style="font-size:13px;color:#3D3D3D;line-height:1.65;">חשבונית המס להזמנה ${quote.id} מצורפת/זמינה עבורך. לכל שאלה בנושא — נשמח לעזור.</div>
      </div>

      ${ctaButton('💬 דברו איתנו', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <p style="text-align:center;font-size:13px;color:#AEAEB2;margin-top:14px;">נשמח לראות אתכם בפרויקט הבא! 💙</p>
    `;

    return emailWrapper({
        preheader: `${firstName}, ההזמנה ${quote.id} נמסרה — נשמח לדירוג ומצורפת חשבונית`,
        accentColor: '#FFB800',
        heroIcon: '🎉',
        heroIconBg: 'linear-gradient(135deg,#FFB800,#FF9500)',
        heroTitle: 'תודה שבחרת ב-NextClass!',
        heroSub: 'ההזמנה נמסרה בהצלחה — נשמח לשמוע איך היה',
        quoteId: quote.id,
        body,
        footerNote: `תאריך מסירה: ${new Date().toLocaleDateString('he-IL')}`,
    });
}

// Sent while actively working on finding the best price — tells customer WHAT we're checking
function buildInitialContactEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! בקשה מספר ${quote.id} — יש לי תוספת/שינוי`)}`;
    const itemCount = (quote.items || []).length;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        רכז ההזמנות שלנו עבר על הבקשה שלך ומשיג כעת מחירים מספקינו עבור <strong>${itemCount} פריט${itemCount !== 1 ? 'ים' : ''}</strong>.<br/>
        צפי לקבלת הצעת מחיר: <strong>1–2 ימי עסקים</strong>.
      </p>
      ${divider()}
      <div style="margin-bottom:28px;">
        <div style="font-size:12px;font-weight:700;color:#6E6E73;margin-bottom:12px;">הפריטים שאנחנו בודקים עבורך</div>
        ${(quote.items || []).map(item => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F5F5F7;">
          <div style="width:8px;height:8px;border-radius:50%;background:#FF9500;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;color:#1D1D1F;">${item.title || '—'}</div>
            <div style="font-size:11px;color:#AEAEB2;">×${item.qty ?? item.quantity ?? 1} יח׳${item.category ? ` · ${item.category}` : ''}</div>
          </div>
          <div style="font-size:11px;font-weight:800;color:#FF9500;">בבדיקה...</div>
        </div>`).join('')}
      </div>
      <div style="padding:14px 18px;background:#FFFBF0;border-right:4px solid #FF9500;border-radius:0 12px 12px 0;margin-bottom:28px;">
        <div style="font-size:13px;color:#3D3D3D;line-height:1.65;">יש שינויים לבקשה? עכשיו הזמן לעדכן אותנו — לפני שסוגרים מחיר עם הספק.</div>
      </div>
      ${ctaButton('💬 עדכון לבקשה? כתבו לנו', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
    `;

    return emailWrapper({
        preheader: `${firstName}, הצוות שלנו משיג מחירים עבורך — צפי: 1–2 ימי עסקים`,
        accentColor: '#FF9500',
        heroIcon: '🔍',
        heroIconBg: 'linear-gradient(135deg,#FF9500,#F59E0B)',
        heroTitle: 'בשלב השגת המחירים',
        heroSub: `בודקים ${itemCount} פריטים אצל הספקים — נחזור בקרוב`,
        quoteId: quote.id,
        body,
        footerNote: `${quote.date || ''}`,
    });
}

// Sent after customer verbally confirmed — asks for final shipping details
function buildPendingApprovalEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const sd = quote.shippingDetails || {};
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! לגבי הזמנה ${quote.id} — פרטי משלוח:`)}`;

    const body = `
      <p style="margin:0 0 24px;font-size:16px;color:#1D1D1F;line-height:1.75;">
        שלום ${firstName},<br/>
        אישרת — תודה! 🎉<br/>
        כדי לסגור את ההזמנה, נצטרך ממך <strong>פרטי משלוח</strong> למוסד.
      </p>
      ${divider()}
      <div style="padding:20px 24px;background:#F0F7FF;border-radius:18px;margin-bottom:28px;border:1.5px solid rgba(0,122,255,0.15);">
        <div style="font-size:12px;font-weight:800;color:#007AFF;margin-bottom:14px;">📋 הפרטים הנדרשים</div>
        ${[
            ['שם מלא למשלוח', sd.deliveryName || ''],
            ['כתובת מדויקת', sd.address ? `${sd.address}${sd.city ? `, ${sd.city}` : ''}` : ''],
            ['מיקוד', sd.zip || ''],
            ['טלפון ליצירת קשר', sd.deliveryPhone || ''],
        ].map(([label, val]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <span style="font-size:12px;font-weight:700;color:#6E6E73;">${label}</span>
          <span style="font-size:13px;font-weight:700;color:${val ? '#1D1D1F' : '#FF9500'};">${val || '⚠️ חסר'}</span>
        </div>`).join('')}
      </div>
      ${ctaButton('📲 שלחו פרטי משלוח בוואטסאפ', waLink, 'linear-gradient(135deg,#007AFF,#5856D6)', 'rgba(0,122,255,0.35)')}
      <p style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:14px;">ניתן גם לענות ישירות למייל זה עם הפרטים.</p>
    `;

    return emailWrapper({
        preheader: `${firstName}, אישרת! נצטרך פרטי משלוח כדי לסגור`,
        accentColor: '#007AFF',
        heroIcon: '📋',
        heroIconBg: 'linear-gradient(135deg,#007AFF,#5856D6)',
        heroTitle: 'אישרת — נהדר!',
        heroSub: 'נצטרך ממך פרטי משלוח כדי לסגור את ההזמנה',
        quoteId: quote.id,
        body,
        footerNote: `${quote.date || ''}`,
    });
}

// Sent after order confirmed internally — reassuring update, no supplier details exposed
function buildProcessingEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const so = quote.supplierOrder || {};
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום! לגבי הזמנה ${quote.id} — יש לי שאלה`)}`;

    const body = `
      <p style="margin:0 0 28px;font-size:16px;color:#1D1D1F;line-height:1.8;">
        שלום ${firstName},<br/>
        ההזמנה שלך בטיפול מלא — הצוות שלנו עובד על כך ומעדכן אותך בהקדם.<br/>
        ${so.estimatedDelivery ? `<strong>תאריך אספקה משוער: ${so.estimatedDelivery}</strong>` : 'נעדכן אותך עם פרטי אספקה ברגע שיהיו זמינים.'}
      </p>
      ${divider()}

      <!-- Progress steps -->
      <div style="margin-bottom:32px;">
        ${[
            ['#34C759', '✓', 'הזמנה התקבלה', 'הבקשה שלך אושרה ועוברת לטיפול', true],
            ['#0891B2', '⚙️', 'בטיפול פעיל', 'הצוות שלנו מטפל בהזמנה ומתאם אספקה', true],
            ['#AEAEB2', '🚚', 'משלוח', 'תקבל מספר מעקב ברגע שיצא', false],
            ['#AEAEB2', '🎉', 'אספקה', so.estimatedDelivery ? so.estimatedDelivery : 'בקרוב', false],
        ].map(([color, icon, title, desc, done]) => `
        <div style="display:flex;align-items:flex-start;margin-bottom:16px;gap:0;">
          <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;margin-left:14px;">
            <div style="width:36px;height:36px;border-radius:50%;background:${done ? color : '#F5F5F7'};border:2px solid ${done ? color : '#E0E0E0'};display:flex;align-items:center;justify-content:center;font-size:${done ? 16 : 14}px;font-weight:900;color:${done ? '#fff' : '#AEAEB2'};">${icon}</div>
          </div>
          <div style="padding-top:6px;">
            <div style="font-size:14px;font-weight:${done ? '800' : '600'};color:${done ? '#1D1D1F' : '#AEAEB2'};">${title}</div>
            <div style="font-size:12px;color:${done ? '#6E6E73' : '#C7C7CC'};margin-top:2px;">${desc}</div>
          </div>
        </div>`).join('')}
      </div>

      ${so.estimatedDelivery ? `
      <div style="text-align:center;padding:18px 24px;background:linear-gradient(135deg,#F0F7FF,#F5F0FF);border-radius:18px;margin-bottom:28px;border:1.5px solid rgba(88,86,214,0.15);">
        <div style="font-size:11px;font-weight:700;color:#6E6E73;margin-bottom:6px;">📅 צפי אספקה</div>
        <div style="font-size:22px;font-weight:900;color:#5856D6;">${so.estimatedDelivery}</div>
      </div>` : ''}

      ${ctaButton('💬 שאלה? נשמח לעזור', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <p style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:14px;">או התקשרו: <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#0891B2;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a></p>
    `;

    return emailWrapper({
        preheader: `${firstName}, ההזמנה שלך בטיפול פעיל${so.estimatedDelivery ? ` — אספקה: ${so.estimatedDelivery}` : ' — נעדכן בהקדם'}`,
        accentColor: '#0891B2',
        heroIcon: '⚙️',
        heroIconBg: 'linear-gradient(135deg,#0891B2,#5856D6)',
        heroTitle: 'ההזמנה בטיפול!',
        heroSub: 'הצוות שלנו על זה — נעדכן אותך בכל שלב',
        quoteId: quote.id,
        body,
        footerNote: `${quote.date || ''}`,
    });
}

function buildCancelledEmail(quote) {
    const firstName = (quote.contactName || '').split(' ')[0] || 'לקוח יקר';
    const waLink = `https://wa.me/972${BIZ_PHONE.replace(/\D/g,'').replace(/^0/,'')}?text=${encodeURIComponent(`שלום NextClass, אשמח לשמוע על אפשרויות לעתיד`)}`;

    const body = `
      <p style="margin:0 0 28px;font-size:16px;color:#1D1D1F;line-height:1.8;">
        שלום ${firstName},<br/>
        רצינו לעדכן אותך שהבקשה שלך עבור <strong>${quote.institution || 'המוסד שלך'}</strong> בוטלה בהתאם לפנייתך.<br/>
        מקווים שנוכל לשרת אותך שוב בהזדמנות הבאה!
      </p>
      ${divider()}
      <div style="text-align:center;padding:28px 24px;background:linear-gradient(135deg,#F5F5F7,#FAFAFA);border-radius:22px;margin-bottom:28px;border:1px solid #EBEBEB;">
        <div style="font-size:36px;margin-bottom:12px;">🤝</div>
        <div style="font-size:16px;font-weight:800;color:#1D1D1F;margin-bottom:6px;">תמיד נשמח לעזור</div>
        <div style="font-size:13px;color:#6E6E73;line-height:1.65;max-width:360px;margin:0 auto;">כשתצטרכו ציוד טכנולוגי לחינוך — NextClass כאן עבורכם.<br/>ניתן לפנות בכל עת ונשמח לתת מענה מהיר.</div>
      </div>
      <div style="padding:18px 20px;background:#F0F7FF;border-radius:16px;margin-bottom:28px;border:1px solid rgba(0,122,255,0.1);">
        <div style="font-size:12px;font-weight:800;color:#007AFF;margin-bottom:10px;">💡 מה אנחנו מציעים</div>
        ${['ציוד STEM ורובוטיקה', 'מחשבים וטאבלטים לחינוך', 'תשתיות טכנולוגיות לכיתות', 'שירות והתקנה מקצועיים'].map(item =>
          `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:#3D3D3D;">
            <span style="color:#34C759;font-weight:900;">✓</span>${item}
          </div>`).join('')}
      </div>
      ${ctaButton('💬 נדבר בעתיד?', waLink, 'linear-gradient(135deg,#25D366,#128C7E)', 'rgba(37,211,102,0.35)')}
      <p style="text-align:center;font-size:12px;color:#AEAEB2;margin-top:14px;">או התקשרו: <a href="tel:${BIZ_PHONE.replace(/\D/g,'')}" style="color:#007AFF;text-decoration:none;font-weight:600;">${BIZ_PHONE}</a></p>
    `;

    return emailWrapper({
        preheader: `${firstName}, הבקשה בוטלה — נשמח לשרת אותך שוב בעתיד`,
        accentColor: '#AEAEB2',
        heroIcon: '🤝',
        heroIconBg: 'linear-gradient(135deg,#6E6E73,#AEAEB2)',
        heroTitle: 'עד הפעם הבאה!',
        heroSub: 'הבקשה בוטלה — נשמח לראות אותך שוב',
        quoteId: quote.id,
        body,
        footerNote: `${quote.date || ''}`,
    });
}

const TYPE_CONFIG = {
    contact:          { build: buildContactEmail,          subject: q => `קיבלנו את פנייתך — ${q.id} · NextClass` },
    initial_contact:  { build: buildInitialContactEmail,   subject: q => `אנחנו בעניין — בודקים הצעות עבורך · ${q.id}` },
    quote_sent:       { build: buildQuoteSentEmail,        subject: q => `הצעת מחיר ${q.id} מוכנה עבורך — NextClass` },
    reminder:         { build: buildReminderEmail,         subject: q => `תזכורת: הצעת מחיר ${q.id} ממתינה לאישור` },
    pending_approval: { build: buildPendingApprovalEmail,  subject: q => `ממתינים לאישורך — הצעה ${q.id} · NextClass` },
    confirmed:        { build: buildConfirmedEmail,        subject: q => `ההזמנה ${q.id} אושרה! ✅ — NextClass` },
    processing:       { build: buildProcessingEmail,       subject: q => `ההזמנה ${q.id} בטיפול — בקרוב אצלך ✓ — NextClass` },
    in_transit:       { build: buildInTransitEmail,        subject: q => `ההזמנה ${q.id} בדרך אליך 🚚 — NextClass` },
    delivered:        { build: buildDeliveredEmail,        subject: q => `תודה! ההזמנה ${q.id} נמסרה — נשמח לדירוג ⭐ — NextClass` },
    cancelled:        { build: buildCancelledEmail,        subject: q => `עדכון לגבי בקשה ${q.id} — NextClass` },
};

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 20, windowMs: 60_000 })) {
        return res.status(429).json({ error: 'Too many requests' });
    }

    const { type, quote, to, preview, customHtml, customSubject, customNote } = req.body ?? {};

    if (!type || !TYPE_CONFIG[type]) {
        return res.status(400).json({ error: `Unknown type: ${type}` });
    }
    if (!quote) return res.status(400).json({ error: 'quote required' });

    try {
        const cfg  = TYPE_CONFIG[type];
        let html = customHtml || cfg.build(quote);
        const subj = customSubject || cfg.subject(quote);

        if (customNote && html.includes('<!-- CUSTOM_NOTE_SLOT -->')) {
            const noteBlock = `<div style="margin:0 40px 28px;padding:16px 20px;background:#FFFBF0;border-right:4px solid #FF9500;border-radius:0 12px 12px 0;">
              <div style="font-size:11px;font-weight:800;color:#FF9500;margin-bottom:6px;">✏️ הערה אישית מהצוות</div>
              <div style="font-size:14px;color:#3D3D3D;line-height:1.7;white-space:pre-wrap;">${customNote.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
            </div>`;
            html = html.replace('<!-- CUSTOM_NOTE_SLOT -->', noteBlock);
        } else {
            html = html.replace('<!-- CUSTOM_NOTE_SLOT -->', '');
        }

        // Preview mode — return HTML without sending
        if (preview === true) {
            return res.status(200).json({ html, subject: subj, preview: true });
        }

        const recipient = to || quote?.email;
        if (!recipient) return res.status(400).json({ error: 'No recipient email' });

        // Never auto-send. Queue for manual admin approve-AND-edit in AdminCommunications.
        const recipientName = quote?.contactName || quote?.institution || '';
        const leadId = quote?.id || quote?._docId || '';
        await queuePendingEmail({
            to: recipient,
            subject: subj,
            html,
            recipientName,
            kind: 'customer',
            refId: leadId,
            refType: 'quote',
            source: `stage:${type}`,
        });
        return res.status(200).json({ ok: true, queued: true });
    } catch (err) {
        console.error('[send-stage-email]', err);
        return res.status(500).json({ error: String(err) });
    }
}
