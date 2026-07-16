/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS — CANONICAL ORDER LIFECYCLE MODEL
   ───────────────────────────────────────────────────────────────────────────────
   THE single source of truth for the drop-ship order flow. Every surface — the
   Path stepper, the pipeline Kanban, the record-360 header, the worklists, the
   KPIs — reads its stages, tones, guidance and next-best-action from here.

   Design (from SAP order-to-cash + Salesforce Path research):
   • ONE canonical `overallStage` per order, derived from the record (with a
     legacy-`status` fallback so existing `quotes` docs map cleanly).
   • MULTI-AXIS status (SAP A/B/C): customer / supplier / billing tracked
     independently and rolled up.
   • Per-stage KEY FIELDS + GUIDANCE + NEXT-BEST-ACTION (Salesforce Path).
   • Two fulfilment paths: `dropship` (supplier ships to customer — the default)
     and `self` (we ship from stock).

   The underlying collection is `quotes` (the real order pipeline). We elevate it
   here without renaming the collection. Nothing in this file writes data — it is
   pure derivation, safe to import anywhere.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Drop-ship path (supplier fulfils to the customer) ──────────────────────── */
export const STAGES_DROPSHIP = [
    {
        id: 'needs_review', label: 'לבדיקה', short: 'לבדיקה', tone: 'neutral', group: 'open',
        legacy: ['לבדיקה ידנית', 'needs_review'],
        keyFields: ['contactName', 'items', 'total'],
        guidance: 'הזמנה שנקלטה ממייל/סריקה — ודא/י את הפרטים ואשר/י ליצירת הזמנה.',
        next: { id: 'promote', label: 'אשר וצור הזמנה', to: 'new' },
    },
    {
        id: 'new', label: 'נכנס', short: 'נכנס', tone: 'info', group: 'open',
        legacy: ['חדש'],
        keyFields: ['contactName', 'institution', 'items', 'total'],
        guidance: 'הזמנה חדשה. השלב הבא: לשלוח ללקוח אישור קבלה ("התקבל ובטיפול").',
        next: { id: 'ackCustomer', label: 'שלח אישור ללקוח', to: 'acked' },
    },
    {
        id: 'acked', label: 'אושר ללקוח', short: 'אושר ללקוח', tone: 'info', group: 'open',
        legacy: ['ביצירת קשר', 'הוצע מחיר', 'ממתין לאישור', 'בדיקת מלאי', 'במשא ומתן', 'נסגר'],
        keyFields: ['contactName', 'shipToAddress', 'items', 'deliveryDate'],
        guidance: 'הלקוח קיבל אישור. בחר/י איך לספק את ההזמנה:',
        next: { id: 'forwardSupplier', label: 'העבר לספק', to: 'sent_supplier' },
        // The drop-ship vs self decision, presented explicitly at the moment it matters.
        fork: [
            { id: 'forwardSupplier', label: '🚚 העבר לספק', sub: 'הספק שולח ישירות ללקוח (דרופשיפ)', mode: 'dropship', to: 'sent_supplier', tone: 'warning' },
            { id: 'goSelf', label: '📦 אספקה עצמית', sub: 'אריזה ומשלוח מהמלאי שלך', mode: 'self', to: 'packed', tone: 'info' },
        ],
    },
    {
        id: 'sent_supplier', label: 'הועבר לספק', short: 'לספק', tone: 'warning', group: 'active',
        legacy: ['הועבר לספק'],
        keyFields: ['supplierName', 'shipToAddress', 'items', 'deliveryDate'],
        guidance: 'ההזמנה הועברה לספק. ממתין לאישור הספק שקיבל ויספק.',
        next: { id: 'markConfirmed', label: 'סמן: הספק אישר', to: 'supplier_confirmed' },
    },
    {
        id: 'supplier_confirmed', label: 'אושר ע״י ספק', short: 'ספק אישר', tone: 'warning', group: 'active',
        legacy: [],
        keyFields: ['supplierName', 'deliveryDate', 'total'],
        guidance: 'הספק אישר. ממתין לאספקה בפועל ללקוח.',
        next: { id: 'markTransit', label: 'סמן: בדרך', to: 'in_transit' },
    },
    {
        id: 'in_transit', label: 'בדרך', short: 'בדרך', tone: 'warning', group: 'active',
        legacy: ['בדרך'],
        keyFields: ['supplierName', 'shipToAddress', 'deliveryDate'],
        guidance: 'המשלוח בדרך ללקוח. עדכן/י כשסופק.',
        next: { id: 'markDelivered', label: 'סמן: סופק', to: 'delivered' },
    },
    {
        id: 'delivered', label: 'סופק', short: 'סופק', tone: 'success', group: 'done',
        legacy: ['סופק'],
        keyFields: ['contactName', 'total', 'deliveryDate'],
        guidance: 'סופק ללקוח. אפשר לסגור את העסקה (וללקוח — לשלוח סקר/תודה).',
        next: { id: 'markCompleted', label: 'סגור עסקה', to: 'completed' },
    },
    {
        id: 'completed', label: 'הושלם', short: 'הושלם', tone: 'success', group: 'done',
        legacy: ['הושלם'],
        keyFields: ['contactName', 'total'],
        guidance: 'העסקה הושלמה.',
        next: null,
    },
];

/* ─── Self-fulfilment path (we ship from stock) ─────────────────────────────── */
export const STAGES_SELF = [
    STAGES_DROPSHIP[0], // needs_review
    STAGES_DROPSHIP[1], // new
    {
        // self-path 'acked' — same id, but its next routes to PACKING (not a supplier)
        id: 'acked', label: 'אושר ללקוח', short: 'אושר ללקוח', tone: 'info', group: 'open',
        legacy: [],
        keyFields: ['contactName', 'shipToAddress', 'items', 'deliveryDate'],
        guidance: 'הלקוח קיבל אישור. אספקה עצמית — השלב הבא: אריזה מהמלאי.',
        next: { id: 'markPacked', label: 'סמן: נארז', to: 'packed' },
    },
    {
        id: 'packed', label: 'נארז', short: 'נארז', tone: 'warning', group: 'active',
        legacy: ['נארז'],
        keyFields: ['contactName', 'items', 'shipToAddress'],
        guidance: 'ההזמנה נארזה מהמלאי. השלב הבא: שילוח ללקוח.',
        next: { id: 'markShipped', label: 'סמן: נשלח', to: 'shipped' },
    },
    {
        id: 'shipped', label: 'נשלח', short: 'נשלח', tone: 'warning', group: 'active',
        legacy: ['נשלח'],
        keyFields: ['contactName', 'shipToAddress', 'trackingInfo'],
        guidance: 'נשלח ללקוח. עדכן/י כשסופק.',
        next: { id: 'markDelivered', label: 'סמן: סופק', to: 'delivered' },
    },
    STAGES_DROPSHIP[6], // delivered
    STAGES_DROPSHIP[7], // completed
];

/* ─── Side states (off the main path) ───────────────────────────────────────── */
export const SIDE_STATES = [
    { id: 'cancelled', label: 'בוטל', tone: 'danger', legacy: ['בוטל'], group: 'closed' },
    { id: 'lost', label: 'אבד', tone: 'neutral', legacy: ['אבד'], group: 'closed' },
    { id: 'on_hold', label: 'בהמתנה', tone: 'neutral', legacy: ['בהמתנה', 'מושהה'], group: 'open' },
];

/* Build a fast legacy-status → canonical-stage lookup (once). */
const LEGACY_TO_STAGE = (() => {
    const m = {};
    for (const s of [...STAGES_DROPSHIP, ...STAGES_SELF, ...SIDE_STATES]) {
        (s.legacy || []).forEach(l => { m[l] = s.id; });
        m[s.id] = s.id; // canonical id maps to itself
    }
    return m;
})();

const ALL_STAGE_META = (() => {
    const m = {};
    // first-wins → the drop-ship entry owns shared ids (e.g. 'acked'); self path
    // supplies its own `next` only via stagesFor()/nextAction().
    for (const s of [...STAGES_DROPSHIP, ...STAGES_SELF, ...SIDE_STATES]) if (!m[s.id]) m[s.id] = s;
    return m;
})();

/* ─── Public derivation helpers ─────────────────────────────────────────────── */

// Which stage sequence applies to this order.
export function stagesFor(order) {
    return (order?.fulfillmentMode === 'self') ? STAGES_SELF : STAGES_DROPSHIP;
}

// The canonical stage id for an order: explicit field → legacy status map → 'new'.
export function deriveStage(order) {
    if (!order) return 'new';
    if (order.overallStage && ALL_STAGE_META[order.overallStage]) return order.overallStage;
    const legacy = order.status && LEGACY_TO_STAGE[order.status];
    return legacy || 'new';
}

// Full metadata object for a stage id (label/tone/guidance/keyFields/next).
export function stageMeta(stageId) {
    return ALL_STAGE_META[stageId] || ALL_STAGE_META.new;
}

export function isSideState(stageId) {
    return SIDE_STATES.some(s => s.id === stageId);
}

// Multi-axis status (SAP A/B/C style), rolled up from the order. Indexes within
// the order's OWN path (drop-ship vs self) so self stages aren't mis-derived.
export function deriveAxes(order) {
    const arr = stagesFor(order);
    const stage = deriveStage(order);
    const idx = arr.findIndex(s => s.id === stage);
    const reached = (id) => {
        const at = arr.findIndex(s => s.id === id);
        return idx >= 0 && at >= 0 && idx >= at;
    };
    const customer = stage === 'new' || stage === 'needs_review' ? 'received'
        : reached('delivered') ? 'done' : 'acked';
    const supplier = order?.fulfillmentMode === 'self' ? 'self'
        : reached('delivered') ? 'delivered'
        : reached('supplier_confirmed') ? 'confirmed'
        : reached('sent_supplier') ? 'sent' : 'none';
    const billing = order?.billingStatus
        || (order?.invoicedAt ? 'invoiced' : reached('delivered') ? 'ready' : 'none');
    return { customer, supplier, billing };
}

// The next-best-action for the current stage (or null when terminal). Reads from
// the order's OWN path so a self order at 'acked' routes to packing, not a supplier.
export function nextAction(order) {
    const stage = deriveStage(order);
    if (isSideState(stage)) return null;
    const arr = stagesFor(order);
    const s = arr.find(x => x.id === stage) || stageMeta(stage);
    return s.next || null;
}

// Semantic tone key ('success'|'warning'|'danger'|'info'|'neutral') for a stage.
export function toneFor(stageId) {
    return stageMeta(stageId).tone || 'neutral';
}

// Whole-days the order has sat in its current stage (for SLA / staleness).
// Only counts when the stage clock (stageEnteredTs) exists — legacy orders that
// predate the stage system return 0 so they don't all falsely flag as at-risk.
export function daysInStage(order) {
    const ts = order?.stageEnteredTs;
    if (!ts) return 0;
    return Math.max(0, Math.floor((Date.now() - Number(ts)) / 86400000));
}

// 21-day intake-age SLA (from order intake, not the current stage):
// green ≤7 · yellow ≤14 · orange ≤21 · red >21. Used across order surfaces.
export function intakeAge(order) {
    const ts = order?.dateTs;
    if (!ts) return null;
    const days = Math.max(0, Math.floor((Date.now() - Number(ts)) / 86400000));
    const color = days <= 7 ? '#34C759' : days <= 14 ? '#FFCC00' : days <= 21 ? '#FF9500' : '#FF3B30';
    return { days, color, pct: Math.min(100, Math.round((Math.min(days, 21) / 21) * 100)), over: days > 21 };
}

// SLA thresholds (days) per stage — beyond this the card/row is flagged "at risk".
export const SLA_DAYS = { new: 1, acked: 1, sent_supplier: 3, supplier_confirmed: 5, in_transit: 7, packed: 2, shipped: 5 };
export function isStale(order) {
    const stage = deriveStage(order);
    const limit = SLA_DAYS[stage];
    return limit != null && daysInStage(order) > limit;
}

// Tailored risk assessment for a drop-ship reseller: surfaces the concrete
// reasons an order needs attention now (stuck at supplier, SLA breach, overdue
// payment, missing contact info). Returns { level: 'high'|'med'|'none', reasons[] }.
export function riskAssess(order) {
    if (!order) return { level: 'none', reasons: [] };
    const stage = deriveStage(order);
    if (isSideState(stage) || stage === 'completed') return { level: 'none', reasons: [] };
    const reasons = [];
    const d = daysInStage(order);
    if (stage === 'sent_supplier' && d > SLA_DAYS.sent_supplier) reasons.push({ t: 'high', text: `תקוע אצל הספק ${d} ימים` });
    else if (isStale(order)) reasons.push({ t: 'high', text: `חורג מ‑SLA (${d} ימים בשלב)` });
    if (stage === 'delivered' || stage === 'completed') { /* delivered → payment risk handled below */ }
    // payment overdue (due date passed and not marked paid — undefined status = not paid)
    if (order.paymentStatus !== 'paid' && order.paymentDueTs && order.paymentDueTs < Date.now()) {
        const od = Math.floor((Date.now() - order.paymentDueTs) / 86400000);
        reasons.push({ t: 'high', text: `תשלום באיחור ${od} ימים` });
    }
    // can't communicate
    if (!order.email && !order.phone) reasons.push({ t: 'med', text: 'אין מייל/טלפון ליצירת קשר' });
    // acked but not forwarded for a while
    if (stage === 'acked' && d > 2) reasons.push({ t: 'med', text: 'אושר ללקוח אך לא הועבר לספק' });
    const level = reasons.some(r => r.t === 'high') ? 'high' : reasons.length ? 'med' : 'none';
    return { level, reasons };
}

/* ─── Payment / aging helpers ────────────────────────────────────────────────── */
export function paymentAgingDays(order) {
    if (!order?.paymentDueTs) return null;
    return Math.floor((Date.now() - order.paymentDueTs) / 86400000); // + = overdue
}
export const PAYMENT_TONES = { paid: 'success', partial: 'warning', unpaid: 'danger', none: 'neutral' };
export function paymentLabel(order) {
    const s = order?.paymentStatus || 'none';
    return { paid: 'שולם', partial: 'שולם חלקית', unpaid: 'ממתין לתשלום', none: '—' }[s] || '—';
}

/* ─── Money / identity helpers (consistent everywhere) ──────────────────────── */
export function orderTotal(order) {
    if (!order) return 0;
    if (order.totalIncVat != null) return Number(order.totalIncVat) || 0;
    if (order.total != null) return Number(order.total) || 0;
    if (order.subtotal != null) return Number(order.subtotal) || 0;
    return (order.items || []).reduce((s, it) => s + (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1), 0);
}
export function orderTitle(order) {
    return order?.contactName || order?.customer || order?.institution || order?.orderNumber || order?.id || 'הזמנה';
}
export function orderItemsSummary(order) {
    const items = order?.items || [];
    if (!items.length) return '—';
    const first = items[0];
    const name = first.title || first.name || 'פריט';
    return items.length === 1 ? `${name} ×${first.qty || 1}` : `${name} +${items.length - 1}`;
}

/* Representative legacy `status` for a canonical stage (null = leave status as-is,
   only set overallStage). Keeps the old status vocabulary in sync for back-compat. */
export const STAGE_TO_LEGACY = {
    needs_review: 'לבדיקה ידנית', new: 'חדש', acked: null, sent_supplier: 'הועבר לספק',
    // 'completed' is null — inventory was already settled at 'delivered'; advancing
    // to completed must NOT re-run updateQuoteStatus('סופק') (avoids re-writing the
    // sale record + duplicate revenue activity).
    supplier_confirmed: null, in_transit: 'בדרך', delivered: 'סופק', completed: null,
    packed: null, shipped: 'נשלח', cancelled: 'בוטל', lost: 'אבד', on_hold: 'בהמתנה',
};
// Stages whose legacy transition must run the inventory/sales side-effects in
// updateQuoteStatus (stock settle, synthetic sale, reservation release).
export const INVENTORY_STAGES = ['delivered', 'cancelled', 'lost'];

/* Field labels shared by the Path key-fields + record header. */
export const FIELD_LABELS = {
    contactName: 'לקוח', institution: 'מוסד', phone: 'טלפון', email: 'מייל',
    shipToAddress: 'כתובת אספקה', items: 'פריטים', total: 'סה״כ', deliveryDate: 'תאריך אספקה',
    supplierName: 'ספק', trackingInfo: 'מעקב', orderNumber: 'מס׳ הזמנה',
};

export default {
    STAGES_DROPSHIP, STAGES_SELF, SIDE_STATES, stagesFor, deriveStage, stageMeta,
    isSideState, deriveAxes, nextAction, toneFor, daysInStage, isStale, SLA_DAYS,
    riskAssess, paymentAgingDays, paymentLabel, PAYMENT_TONES,
    orderTotal, orderTitle, orderItemsSummary, FIELD_LABELS,
};
