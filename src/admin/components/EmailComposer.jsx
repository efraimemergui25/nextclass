/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   EMAIL COMPOSER — live split-pane editor (Mailchimp/Postmark-style)
   ───────────────────────────────────────────────────────────────────────────────
   NO raw HTML. The operator edits meaningful content blocks on the LEFT — subject,
   heading, message body, an optional highlighted note, and whether to show the order
   summary — and the REAL branded email renders LIVE on the RIGHT (updates on every
   keystroke). Order data (number, items, total, contact) is pulled in automatically.
   On send it hands the fully-assembled HTML back through the same human-gated path.
   ═══════════════════════════════════════════════════════════════════════════════ */
import { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Mail, X, Send, Eye, Type, MessageSquare, Sparkles, Package, Paperclip, Plus, Image as ImageIcon } from 'lucide-react';
import { BUSINESS } from '../lib/businessProfile';
import Combobox from './Combobox';

const HE = 'Heebo, sans-serif';
const SITE_URL = 'https://getnextclass.com';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Per-stage starting content (client-side — the single, consistent, editable template).
const STAGE_CONTENT = {
    confirmed:  { subject: 'ההזמנה {orderId} התקבלה ✓ — NextClass',      heading: 'ההזמנה שלך התקבלה!',   body: 'שלום {name},\nתודה שבחרת ב-NextClass. קיבלנו את הזמנתך ({orderId}) והיא כעת בטיפול. נעדכן אותך בכל שלב עד למסירה.', summary: true,  cta: '' },
    processing: { subject: 'ההזמנה {orderId} בטיפול — NextClass',         heading: 'ההזמנה שלך בטיפול',    body: 'שלום {name},\nההזמנה ({orderId}) אושרה מול הספק ומאובטחת. נעדכן אותך ברגע שהיא יוצאת לדרך.', summary: true,  cta: '' },
    in_transit: { subject: 'ההזמנה {orderId} בדרך אליך — NextClass',       heading: 'ההזמנה בדרך אליך',     body: 'שלום {name},\nההזמנה ({orderId}) יצאה למשלוח ותגיע אליך בקרוב. תודה על הסבלנות!', summary: true,  cta: '' },
    delivered:  { subject: 'ההזמנה {orderId} נמסרה — נשמח לדירוג ⭐',       heading: 'ההזמנה נמסרה. תודה!',  body: 'שלום {name},\nההזמנה ({orderId}) נמסרה בהצלחה. נשמח מאוד לשמוע איך הייתה החוויה — הדירוג שלך חשוב לנו.', summary: false, cta: 'דרגו את החוויה' },
    reminder:   { subject: 'תזכורת בנוגע להזמנה {orderId} — NextClass',    heading: 'תזכורת קטנה',          body: 'שלום {name},\nרצינו להזכיר בנוגע להזמנה ({orderId}). נשמח לעמוד לרשותך לכל שאלה.', summary: false, cta: '' },
    initial_contact: { subject: 'קיבלנו את פנייתך — NextClass',           heading: 'תודה על פנייתך!',       body: 'שלום {name},\nתודה שפנית ל-NextClass. קיבלנו את הפנייה ונחזור אליך בהקדם עם כל הפרטים.', summary: false, cta: '' },
    quote_sent: { subject: 'הצעת מחיר עבורך — NextClass',                 heading: 'הצעת המחיר שלך מוכנה', body: 'שלום {name},\nמצורפת הצעת מחיר עבור בקשתך. נשמח לענות על כל שאלה ולסייע בהמשך התהליך.', summary: true,  cta: '' },
};

const AZURE = '#007AFF';

// Per-stage visual identity for the email hero (accent + gradient badge + glyph).
export const STAGE_VISUAL = {
    confirmed:       { accent: '#34C759', hero: '✓',  heroBg: 'linear-gradient(135deg,#34C759,#28A745)' },
    processing:      { accent: '#007AFF', hero: '↻',  heroBg: 'linear-gradient(135deg,#007AFF,#5856D6)' },
    in_transit:      { accent: '#FF9500', hero: '🚚', heroBg: 'linear-gradient(135deg,#FF9500,#FF6B00)' },
    delivered:       { accent: '#34C759', hero: '★',  heroBg: 'linear-gradient(135deg,#34C759,#28A745)' },
    reminder:        { accent: '#FF9500', hero: '⏰', heroBg: 'linear-gradient(135deg,#FF9500,#FF6B00)' },
    initial_contact: { accent: '#007AFF', hero: '✓',  heroBg: 'linear-gradient(135deg,#007AFF,#5856D6)' },
    quote_sent:      { accent: '#5856D6', hero: '✦',  heroBg: 'linear-gradient(135deg,#5856D6,#007AFF)' },
};

// Assemble the real, premium, RTL branded email — logo · gradient hero badge with glow ·
// order-ID pill · content · highlighted note · item cards · CTA · rich footer. Matches and
// elevates the transactional style of Stripe / Linear / Resend receipts.
export function buildEmailHtml({ order = {}, heading, body, note, showSummary, cta, accent = AZURE, heroIcon = '✓', heroBg = 'linear-gradient(135deg,#007AFF,#5856D6)', items: itemsIn, image }) {
    const items = Array.isArray(itemsIn) ? itemsIn : (Array.isArray(order.items) ? order.items : []);
    const money = (n) => `₪${(Number(n) || 0).toLocaleString()}`;
    const total = items.reduce((s, it) => s + (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1), 0)
        || Number(order.totalIncVat) || Number(order.subtotal) || 0;
    const orderId = order.orderNumber || order.id || '';
    const name = order.contactName || '';

    const bodyHtml = String(body || '').split('\n').map(p => p.trim())
        .map(p => p ? `<p style="margin:0 0 15px;font-size:15px;line-height:1.8;color:#3A3A3C;">${esc(p)}</p>` : '').join('');

    const noteHtml = note && note.trim()
        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr><td style="background:${accent}0D;border-right:3px solid ${accent};border-radius:0 14px 14px 0;padding:16px 18px;font-size:14px;line-height:1.7;color:#1D1D1F;">${esc(note).replace(/\n/g, '<br/>')}</td></tr></table>` : '';

    const imageHtml = image ? `<img src="${image}" alt="" style="width:100%;max-width:100%;border-radius:16px;margin:0 0 22px;display:block;" />` : '';

    const itemCards = items.map(it => {
        const line = (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1);
        const img = it.image
            ? `<img src="${esc(it.image)}" width="60" height="60" style="border-radius:12px 0 0 12px;object-fit:cover;display:block;" />`
            : `<div style="width:60px;height:60px;border-radius:12px 0 0 12px;background:linear-gradient(135deg,#EEF2FF,#F0F7FF);"></div>`;
        return `<tr><td style="padding:0 0 10px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFCFF;border-radius:14px;overflow:hidden;border:1px solid #EEF2FF;"><tr>
            <td width="60" style="vertical-align:middle;padding:0;">${img}</td>
            <td style="padding:10px 14px;vertical-align:middle;">
              <div style="font-size:13px;font-weight:700;color:#1D1D1F;">${esc(it.title || it.name || 'פריט')}</div>
              <div style="font-size:11px;color:#8A94A6;margin-top:2px;">כמות ${Number(it.qty) || 1}</div>
            </td>
            <td style="padding:10px 16px;vertical-align:middle;text-align:left;white-space:nowrap;"><span style="font-size:14px;font-weight:800;color:#1D1D1F;">${money(line)}</span></td>
          </tr></table></td></tr>`;
    }).join('');

    const summaryHtml = (showSummary && items.length) ? `
      <div style="font-size:11px;font-weight:800;color:#8A94A6;letter-spacing:.05em;margin:8px 0 12px;">סיכום הזמנה</div>
      <table width="100%" cellpadding="0" cellspacing="0">${itemCards}</table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;"><tr>
        <td style="padding:14px 4px 0;border-top:2px solid #EEF2FF;font-size:15px;font-weight:900;color:#1D1D1F;">סה"כ</td>
        <td style="padding:14px 4px 0;border-top:2px solid #EEF2FF;text-align:left;"><span style="font-size:19px;font-weight:900;color:${accent};">${money(total)}</span></td>
      </tr></table>` : '';

    const ctaHtml = (cta && cta.trim()) ? `
      <div style="text-align:center;margin:8px 0 24px;">
        <a href="${esc(SITE_URL)}" style="display:inline-block;background:${heroBg};color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:15px 42px;border-radius:50px;box-shadow:0 8px 24px ${accent}45;">${esc(cta)}</a>
      </div>` : '';

    return `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:'Heebo','Helvetica Neue',Arial,sans-serif;direction:rtl;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;"><tr><td align="center" style="padding:40px 16px;">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <!-- logo -->
    <tr><td style="padding-bottom:22px;text-align:center;"><table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="width:36px;height:36px;background:linear-gradient(135deg,#007AFF,#5856D6);border-radius:10px;text-align:center;vertical-align:middle;"><span style="font-size:18px;font-weight:900;color:#fff;line-height:36px;">N</span></td>
      <td style="padding-right:10px;vertical-align:middle;"><span style="font-size:17px;font-weight:800;color:#1D1D1F;letter-spacing:-.3px;">NextClass</span></td>
    </tr></table></td></tr>
    <!-- card -->
    <tr><td style="background:#fff;border-radius:24px;box-shadow:0 1px 4px rgba(0,0,0,0.05),0 12px 40px rgba(20,40,80,0.09);overflow:hidden;">
      <div style="height:4px;background:linear-gradient(90deg,${accent},${accent}99);"></div>
      <!-- hero -->
      <div style="background:linear-gradient(180deg,#F0F7FF 0%,#FAFCFF 100%);padding:42px 40px 34px;text-align:center;">
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr><td style="width:72px;height:72px;border-radius:50%;background:${heroBg};text-align:center;vertical-align:middle;box-shadow:0 8px 28px ${accent}45;"><span style="font-size:32px;color:#fff;line-height:72px;font-weight:900;">${heroIcon}</span></td></tr></table>
        <div style="font-size:25px;font-weight:900;color:#1D1D1F;letter-spacing:-.6px;margin-bottom:${orderId ? '18px' : '0'};">${esc(heading)}</div>
        ${orderId ? `<div style="display:inline-block;background:#fff;border:1.5px solid ${accent};border-radius:50px;padding:7px 22px;"><span style="font-size:12px;color:#6E6E73;font-weight:600;">מספר הזמנה</span><span style="font-size:14px;color:${accent};font-weight:900;margin-right:9px;">${esc(orderId)}</span></div>` : ''}
      </div>
      <!-- body -->
      <div style="padding:32px 40px 8px;">
        ${bodyHtml}
        ${imageHtml}
        ${noteHtml}
        ${summaryHtml}
        ${ctaHtml}
      </div>
      <!-- footer — "contact us" (no site link) -->
      <div style="background:#FAFBFD;border-top:1px solid #EEF1F6;padding:28px 40px;text-align:center;">
        <div style="font-size:15px;font-weight:800;color:#1D1D1F;margin-bottom:3px;">נשמח לעמוד לרשותך</div>
        <div style="font-size:12.5px;color:#8A94A6;margin-bottom:16px;">צוות NextClass כאן לכל שאלה</div>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;"><tr>
          <td style="padding:0 5px;"><a href="tel:${esc((BUSINESS?.phone || '').replace(/\D/g, ''))}" style="display:inline-block;padding:9px 18px;background:#fff;border:1px solid #E8EBF0;border-radius:50px;font-size:12.5px;font-weight:700;color:#1D1D1F;text-decoration:none;">📞 ${esc(BUSINESS?.phone || '')}</a></td>
          <td style="padding:0 5px;"><a href="mailto:${esc(BUSINESS?.email || '')}" style="display:inline-block;padding:9px 18px;background:#fff;border:1px solid #E8EBF0;border-radius:50px;font-size:12.5px;font-weight:700;color:#1D1D1F;text-decoration:none;">✉️ שלחו מייל</a></td>
        </tr></table>
        <div style="font-size:12px;color:#6E6E73;">📍 ${esc(BUSINESS?.address || '')}</div>
        <div style="font-size:10.5px;color:#B8BCC4;margin-top:14px;line-height:1.6;border-top:1px solid #EEF1F6;padding-top:12px;">${esc(BUSINESS?.legalName || 'נקסט קלאס בע"מ')} · ח.פ ${esc(BUSINESS?.taxId || '')}</div>
      </div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: HE, outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 800, color: '#86868B', letterSpacing: '.03em', margin: '0 0 6px' };

export default function EmailComposer({ order = {}, type = 'confirmed', onClose, onSend, catalog = [] }) {
    const productOptions = (catalog || []).map(p => ({ label: p.title || '', price: Number(p.price) || 0, image: p.image || '', sub: p.sku || p.model || '' })).filter(o => o.label);
    const def = STAGE_CONTENT[type] || STAGE_CONTENT.confirmed;
    const vis = STAGE_VISUAL[type] || STAGE_VISUAL.confirmed;
    const name = (order.contactName || '').split(' ')[0] || 'לקוח יקר';
    const orderId = order.orderNumber || order.id || '';
    const fill = (s) => String(s || '').replace(/{name}/g, name).replace(/{orderId}/g, orderId);

    const [subject, setSubject] = useState(fill(def.subject));
    const [heading, setHeading] = useState(fill(def.heading));
    const [body, setBody] = useState(fill(def.body));
    const [note, setNote] = useState('');
    const [cta, setCta] = useState(def.cta || '');
    const [showSummary, setShowSummary] = useState(!!def.summary);
    const [items, setItems] = useState(() => (order.items || []).map(it => ({ title: it.title || it.name || '', qty: Number(it.qty) || 1, salePrice: Number(it.salePrice ?? it.price) || 0, image: it.image || '' })));
    const [attachments, setAttachments] = useState([]);   // { filename, content, mime, isImage, dataUrl }
    const [sending, setSending] = useState(false);
    const fileRef = useRef(null);

    const image = attachments.find(a => a.isImage)?.dataUrl || '';   // first image → inline banner

    const html = useMemo(() => buildEmailHtml({ order, heading, body, note, showSummary, cta, items, image, accent: vis.accent, heroIcon: vis.hero, heroBg: vis.heroBg }), [order, heading, body, note, showSummary, cta, items, image, vis]);

    const setItem = (i, k, v) => setItems(list => list.map((x, j) => j === i ? { ...x, [k]: v } : x));
    const addItem = () => setItems(list => [...list, { title: '', qty: 1, salePrice: 0, image: '' }]);
    const rmItem = (i) => setItems(list => list.filter((_, j) => j !== i));

    const onFiles = (files) => {
        Array.from(files || []).forEach(f => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = String(reader.result || '');
                setAttachments(a => [...a, { filename: f.name, content: dataUrl.split(',')[1] || '', mime: f.type, isImage: (f.type || '').startsWith('image/'), dataUrl }]);
            };
            reader.readAsDataURL(f);
        });
    };
    const rmAttach = (i) => setAttachments(a => a.filter((_, j) => j !== i));

    const send = async () => {
        if (!order.email || sending) return;
        setSending(true);
        try { await onSend(subject, html, attachments.map(a => ({ filename: a.filename, content: a.content }))); } finally { setSending(false); }
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()} dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ width: '100%', maxWidth: 1080, height: 'min(88vh, 780px)', background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.35)', fontFamily: HE }}>
                {/* header */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'linear-gradient(135deg,#F0F7FF,#FAFCFF)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,122,255,0.3)' }}><Mail size={16} color="#fff" strokeWidth={2.4} /></span>
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#1D1D1F' }}>עורך המייל</p>
                            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color: '#86868B' }}>{order.email ? `אל ${order.email}` : 'אין כתובת מייל ללקוח'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} color="#6E6E73" strokeWidth={2.4} /></button>
                </div>

                {/* split body */}
                <div className="ec-split" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(300px, 42%) 1fr' }}>
                    {/* LEFT — editor */}
                    <div style={{ overflowY: 'auto', padding: 20, borderInlineEnd: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 16, background: '#FBFCFE' }}>
                        <div>
                            <label style={labelStyle}><Type size={12} strokeWidth={2.4} /> נושא</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} dir="rtl" style={{ ...fieldStyle, fontWeight: 700, color: AZURE }} />
                        </div>
                        <div>
                            <label style={labelStyle}><Sparkles size={12} strokeWidth={2.4} /> כותרת</label>
                            <input value={heading} onChange={e => setHeading(e.target.value)} dir="rtl" style={fieldStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}><MessageSquare size={12} strokeWidth={2.4} /> גוף ההודעה</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} dir="rtl" rows={6}
                                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 120 }} />
                            <p style={{ margin: '5px 2px 0', fontSize: 9.5, color: '#AEAEB2', fontWeight: 600 }}>שורה ריקה = פסקה חדשה. הנתונים ({name} · {orderId}) נמשכים אוטומטית.</p>
                        </div>
                        <div>
                            <label style={labelStyle}>💬 הערה מודגשת (אופציונלי)</label>
                            <textarea value={note} onChange={e => setNote(e.target.value)} dir="rtl" rows={2} placeholder="טקסט שיופיע בתיבה כחולה מודגשת…"
                                style={{ ...fieldStyle, resize: 'vertical', background: '#F5F5F7' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>כפתור פעולה (אופציונלי)</label>
                            <input value={cta} onChange={e => setCta(e.target.value)} dir="rtl" placeholder="למשל: דרגו את החוויה" style={fieldStyle} />
                        </div>
                        <button onClick={() => setShowSummary(v => !v)}
                            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 12, border: `1.5px solid ${showSummary ? 'rgba(0,122,255,0.3)' : 'rgba(0,0,0,0.1)'}`, background: showSummary ? 'rgba(0,122,255,0.06)' : '#fff', cursor: 'pointer', fontFamily: HE, textAlign: 'right' }}>
                            <span style={{ width: 30, height: 30, borderRadius: 8, background: showSummary ? 'rgba(0,122,255,0.12)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={15} color={showSummary ? AZURE : '#AEAEB2'} strokeWidth={2.3} /></span>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#1D1D1F' }}>הצג סיכום הזמנה</p>
                                <p style={{ margin: '1px 0 0', fontSize: 10, fontWeight: 600, color: '#86868B' }}>טבלת פריטים + סה"כ מתוך ההזמנה</p>
                            </div>
                            <span style={{ width: 40, height: 23, borderRadius: 99, background: showSummary ? AZURE : 'rgba(0,0,0,0.12)', position: 'relative', flexShrink: 0, transition: 'background .18s' }}>
                                <span style={{ position: 'absolute', top: 2.5, insetInlineStart: showSummary ? 20 : 2.5, width: 18, height: 18, borderRadius: 99, background: '#fff', transition: 'inset-inline-start .18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </span>
                        </button>

                        {/* editable items (when summary shown) */}
                        {showSummary && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <label style={labelStyle}><Package size={12} strokeWidth={2.4} /> פריטים בסיכום (שם · כמות · מחיר)</label>
                                {items.map((it, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 42px 60px 24px', gap: 5, alignItems: 'center' }}>
                                        <Combobox value={it.title} options={productOptions} placeholder="בחר/י מהמלאי או הקלד/י"
                                            onChange={v => setItem(i, 'title', v)}
                                            onPick={o => { setItem(i, 'title', o.label); if (o.price) setItem(i, 'salePrice', o.price); }} />
                                        <input type="number" value={it.qty} onChange={e => setItem(i, 'qty', Number(e.target.value))} title="כמות" style={{ ...fieldStyle, padding: '7px 3px', fontSize: 12, textAlign: 'center' }} />
                                        <input type="number" value={it.salePrice} onChange={e => setItem(i, 'salePrice', Number(e.target.value))} title="מחיר" style={{ ...fieldStyle, padding: '7px 5px', fontSize: 12, textAlign: 'center', color: AZURE, fontWeight: 700 }} />
                                        <button onClick={() => rmItem(i)} title="הסר" style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', cursor: 'pointer', fontWeight: 900 }}>×</button>
                                    </div>
                                ))}
                                <button onClick={addItem} style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(0,122,255,0.1)', color: AZURE, cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 11.5 }}>+ הוסף פריט</button>
                            </div>
                        )}

                        {/* attachments — image (shown inline) or file */}
                        <div>
                            <label style={labelStyle}><Paperclip size={12} strokeWidth={2.4} /> צירוף תמונה / קובץ</label>
                            <input ref={fileRef} type="file" multiple onChange={e => { onFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
                            <button onClick={() => fileRef.current && fileRef.current.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '11px', borderRadius: 12, border: '1.5px dashed rgba(0,122,255,0.35)', background: 'rgba(0,122,255,0.04)', color: AZURE, cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}>
                                <Plus size={15} strokeWidth={2.5} /> העלה תמונה או קובץ
                            </button>
                            {attachments.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                    {attachments.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
                                            {a.isImage ? <ImageIcon size={14} color={AZURE} /> : <Paperclip size={14} color="#86868B" />}
                                            <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</span>
                                            {a.isImage && <span style={{ fontSize: 9, fontWeight: 800, color: AZURE, background: 'rgba(0,122,255,0.1)', padding: '1px 6px', borderRadius: 99, flexShrink: 0 }}>מוצג במייל</span>}
                                            <button onClick={() => rmAttach(i)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', cursor: 'pointer', fontWeight: 900, flexShrink: 0 }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT — live preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#EEF1F6' }}>
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Eye size={13} color="#8A94A6" strokeWidth={2.4} />
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#8A94A6', letterSpacing: '.04em' }}>תצוגה חיה — מתעדכן בזמן אמת</span>
                        </div>
                        <iframe title="live-email" srcDoc={html} style={{ flex: 1, width: '100%', border: 'none', background: '#EEF1F6' }} sandbox="allow-same-origin" />
                    </div>
                </div>

                {/* footer */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, fontWeight: 800, color: '#1D1D1F', cursor: 'pointer', fontFamily: HE }}>ביטול</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={send} disabled={sending || !order.email}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 24px', borderRadius: 12, border: 'none', background: (sending || !order.email) ? 'rgba(0,122,255,0.5)' : 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: (sending || !order.email) ? 'not-allowed' : 'pointer', fontFamily: HE, boxShadow: '0 6px 18px rgba(0,122,255,0.32)' }}>
                        <Send size={15} strokeWidth={2.4} /> {sending ? 'שולח…' : 'שלח מייל'}
                    </motion.button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
