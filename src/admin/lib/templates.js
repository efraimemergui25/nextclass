/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — COMMUNICATION TEMPLATES (email / WhatsApp) — PURE HELPERS
   ───────────────────────────────────────────────────────────────────────────────
   The operator (נקסט קלאס בע״מ, a drop-ship reseller) sends the customer stage
   messages — order confirmation, shipping, delivered, invoice, payment reminder —
   and messages to suppliers. This module lets those messages be authored as
   REUSABLE Hebrew templates with {{merge_fields}} instead of being hardcoded.

   Pure, dependency-light (imports only orderModel helpers). Safe to import
   anywhere — nothing here touches Firestore or the DOM.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { orderTotal, orderItemsSummary } from './orderModel';
import { BUSINESS } from './businessProfile';

/* ─── The message KINDS a template can serve (per lifecycle stage / recipient) ─── */
export const STAGE_KINDS = [
    { id: 'confirmed', label: 'אישור הזמנה' },
    { id: 'shipping', label: 'בדרך/מעקב' },
    { id: 'delivered', label: 'סופק' },
    { id: 'invoice', label: 'חשבונית' },
    { id: 'reminder', label: 'תזכורת תשלום' },
    { id: 'supplier', label: 'הודעה לספק' },
    { id: 'review', label: 'בקשת חוות דעת' },
];

export const KIND_LABEL = STAGE_KINDS.reduce((m, k) => { m[k.id] = k.label; return m; }, {});

/* ─── Communication channels ──────────────────────────────────────────────────── */
export const CHANNELS = [
    { id: 'email', label: 'אימייל' },
    { id: 'whatsapp', label: 'וואטסאפ' },
];

/* ─── Available merge tokens (Hebrew labels for the palette) ───────────────────── */
export const MERGE_FIELDS = [
    { token: '{{customer}}', label: 'שם הלקוח' },
    { token: '{{institution}}', label: 'מוסד' },
    { token: '{{orderNumber}}', label: 'מספר הזמנה' },
    { token: '{{items}}', label: 'סיכום פריטים' },
    { token: '{{total}}', label: 'סכום לתשלום' },
    { token: '{{deliveryDate}}', label: 'תאריך אספקה' },
    { token: '{{shipTo}}', label: 'כתובת אספקה' },
    { token: '{{supplier}}', label: 'שם הספק' },
    { token: '{{trackingNumber}}', label: 'מספר מעקב' },
    { token: '{{sellerName}}', label: 'שם העסק (שלנו)' },
];

/* ─── Money / date formatting ─────────────────────────────────────────────────── */
function fmtMoney(n) {
    const v = Number(n) || 0;
    try {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency', currency: 'ILS', maximumFractionDigits: 0,
        }).format(v);
    } catch {
        return `₪${v.toLocaleString('he-IL')}`;
    }
}

function fmtDate(d) {
    if (!d) return '';
    let dt = d;
    if (typeof d === 'number') dt = new Date(d);
    else if (typeof d === 'string') dt = new Date(d);
    else if (d && typeof d.toDate === 'function') dt = d.toDate(); // Firestore Timestamp
    if (!(dt instanceof Date) || isNaN(dt.getTime())) return String(d);
    try {
        return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt);
    } catch {
        return dt.toLocaleDateString('he-IL');
    }
}

/* ─── Resolve every token's value from an order object ────────────────────────── */
export function tokenValues(order) {
    const o = order || {};
    const address = o.shipTo?.address || o.shipToAddress || o.address || '';
    const tracking = o.trackingInfo?.number || o.trackingNumber || '';
    return {
        '{{customer}}': o.contactName || o.customer || '',
        '{{institution}}': o.institution || '',
        '{{orderNumber}}': o.orderNumber || o.id || '',
        '{{items}}': orderItemsSummary(o),
        '{{total}}': fmtMoney(orderTotal(o)),
        '{{deliveryDate}}': fmtDate(o.deliveryDate),
        '{{shipTo}}': address,
        '{{supplier}}': o.supplierName || o.supplier || '',
        '{{trackingNumber}}': tracking,
        '{{sellerName}}': BUSINESS.legalName,
    };
}

/* ─── Apply a template's tokens against an order → resolved string ─────────────── */
export function applyTemplate(text, order) {
    if (!text) return '';
    const values = tokenValues(order);
    // Replace every {{ token }} — tolerant of inner whitespace — with its value
    // (unknown tokens are left intact so the operator can spot a typo).
    return String(text).replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, name) => {
        const key = `{{${name}}}`;
        return key in values ? values[key] : match;
    });
}

/* ─── A representative sample order for live previews ──────────────────────────── */
export const SAMPLE_ORDER = {
    id: 'NC-1042',
    orderNumber: 'NC-1042',
    contactName: 'רות לוי',
    institution: 'בית ספר אורנים',
    items: [
        { title: 'מקרן אפסון EB-982W', qty: 3 },
        { title: 'מסך הקרנה 100"', qty: 1 },
    ],
    totalIncVat: 8940,
    deliveryDate: Date.now() + 3 * 86400000,
    shipTo: { address: 'רחוב הזיתים 12, חיפה' },
    supplierName: 'טכנו-אור בע״מ',
    trackingInfo: { number: 'IL938271654' },
};

export default {
    MERGE_FIELDS,
    STAGE_KINDS,
    KIND_LABEL,
    CHANNELS,
    tokenValues,
    applyTemplate,
    SAMPLE_ORDER,
};
