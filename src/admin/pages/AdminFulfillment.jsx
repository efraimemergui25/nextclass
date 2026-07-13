/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, addDoc, deleteDoc, serverTimestamp,
    arrayUnion
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { useAdminData } from '../context/AdminDataContext';
import {
    AdminSectionHeader, AdminInput, AdminTextArea,
    AdminToggle, AdminModal, AdminKPICard, AdminEmpty
} from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { GLASS, RADIUS, TAP, hexA, DOMAIN_ACCENTS } from '../theme/tokens';
import {
    Truck, Package, Building2, Link2, Plus, Trash2, Edit2,
    Clock, CheckCircle, AlertTriangle, Send, X, Phone,
    Mail, TrendingUp, ChevronDown, ArrowRight, Factory, Box,
    Timer, MapPin, Hash, FileText, User, ShoppingCart,
    Copy, Check, Tag, ExternalLink, Star, MessageSquare,
    DollarSign, ChevronRight, ChevronLeft, Activity, Printer, Download,
    ScanLine
} from 'lucide-react';
import AdminOCR from './AdminOCR';

// ── Constants ────────────────────────────────────────────────────────────────

const FULFILLMENT_TYPES = [
    { id: 'supplier', label: 'ספק חיצוני', color: '#007AFF', Icon: Factory, desc: 'Drop-ship — מגיע ישירות מהספק' },
    { id: 'stock',    label: 'מלאי פיזי',  color: '#34C759', Icon: Box,     desc: 'מוצר זמין במחסן שלנו' },
    { id: 'preorder', label: 'הזמנה מראש', color: '#FF9500', Icon: Timer,   desc: 'זמין להזמנה — מגיע בהמשך' },
];

const STATUSES = [
    { id: 'pending',    label: 'ממתין',      color: '#FF9500', bg: 'rgba(255,149,0,0.10)',    icon: Clock },
    { id: 'forwarded',  label: 'הועבר',      color: '#007AFF', bg: 'rgba(0,122,255,0.10)',    icon: Send },
    { id: 'confirmed',  label: 'אושר',       color: '#5856D6', bg: 'rgba(88,86,214,0.10)',    icon: CheckCircle },
    { id: 'in_transit', label: 'בדרך',       color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)',   icon: Truck },
    { id: 'arrived',    label: 'הגיע',       color: '#34C759', bg: 'rgba(52,199,89,0.10)',    icon: Package },
    { id: 'shipped',    label: 'נשלח',       color: '#30D158', bg: 'rgba(48,209,88,0.10)',    icon: CheckCircle },
];

const NEXT_STATUS = {
    pending:    'forwarded',
    forwarded:  'confirmed',
    confirmed:  'in_transit',
    in_transit: 'arrived',
    arrived:    'shipped',
};

// ── Pipeline (quotes) fulfillment stages ──────────────────────────────────────
// SINGLE SOURCE OF TRUTH for order fulfillment. These Hebrew statuses live on the
// `quotes` collection and are advanced via updateQuoteStatus() from useAdminData —
// reaching 'סופק' writes the sale record + settles inventory (see AdminDataContext).
const PIPELINE_STATUS = {
    'הועבר לספק': { label: 'הועבר לספק', color: '#0891B2', bg: 'rgba(8,145,178,0.10)',  Icon: Send,        next: 'בדרך', nextLabel: 'עדכן ל: בדרך' },
    'בדרך':        { label: 'בדרך',        color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', Icon: Truck,       next: 'סופק', nextLabel: 'סמן כסופק' },
    'סופק':        { label: 'סופק',        color: '#1DB954', bg: 'rgba(29,185,84,0.10)',  Icon: CheckCircle, next: null,   nextLabel: null },
};
const PIPELINE_ORDER = ['הועבר לספק', 'בדרך', 'סופק'];

// A quote belongs in fulfillment if it's in a supplier stage OR carries a
// supplierOrder object (set by AdminOrders' SupplierTransferForm).
const isPipelineQuote = (q) =>
    PIPELINE_ORDER.includes(q?.status) ||
    (q?.supplierOrder && typeof q.supplierOrder === 'object');

// Compact "מוצר × כמות" summary for a quote's line items.
const quoteItemsLabel = (q) => {
    const items = q?.items || [];
    if (!items.length) return '—';
    const first = items[0].title || items[0].name || 'מוצר';
    const totalQty = items.reduce((s, it) => s + (Number(it.qty ?? it.quantity) || 1), 0);
    return items.length > 1 ? `${first} +${items.length - 1} · ${totalQty} יח׳` : `${first} × ${totalQty}`;
};

function PipelineStatusPill({ status }) {
    const meta = PIPELINE_STATUS[status] || PIPELINE_STATUS['הועבר לספק'];
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
            style={{ background: meta.bg, color: meta.color }}>
            <meta.Icon size={10} />
            {meta.label}
        </span>
    );
}

const TABS = [
    { id: 'dashboard', label: 'דשבורד',        Icon: TrendingUp },
    { id: 'orders',    label: 'הזמנות ספקים',  Icon: Package },
    { id: 'ocr',       label: 'סריקת מסמכים AI', Icon: ScanLine },
    { id: 'suppliers', label: 'ספקים',          Icon: Building2 },
    { id: 'mapping',   label: 'מיפוי מוצרים',   Icon: Link2 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const BROWN = DOMAIN_ACCENTS.fulfillment; // restrained brand accent — azure #007AFF (de-rainbowed)
const card = { ...GLASS.base, borderRadius: RADIUS.card };

function StatusPill({ statusId }) {
    const s = STATUSES.find(s => s.id === statusId) || STATUSES[0];
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black"
            style={{ background: s.bg, color: s.color }}>
            <s.icon size={10} />
            {s.label}
        </span>
    );
}

function FulfillmentPill({ type }) {
    const t = FULFILLMENT_TYPES.find(t => t.id === type) || FULFILLMENT_TYPES[0];
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black"
            style={{ background: `${t.color}15`, color: t.color }}>
            <t.Icon size={9} />
            {t.label}
        </span>
    );
}

function DetailRow({ label, value, action }) {
    if (!value || value === '—') return null;
    return (
        <div className="flex items-center gap-3 py-2 border-b border-black/[0.04] last:border-0">
            <span className="text-[10px] font-black text-[#AEAEB2] tracking-wider shrink-0 w-24 text-right">{label}</span>
            <span className="text-sm text-[#1D1D1F] font-medium flex-1 text-right break-all">{value}</span>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

function EditableField({ label, value, onChange, placeholder, type = 'text' }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#86868B] tracking-widest block">{label}</label>
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right transition-all" />
        </div>
    );
}

// ── Order Detail Drawer ───────────────────────────────────────────────────────

// ── Generate PO PDF ───────────────────────────────────────────────────────────
function generatePO(order, customerOrder, supplier) {
    const today = new Date().toLocaleDateString('he-IL');
    const subTotal = parseFloat(order.totalCost) || 0;
    const vat = (subTotal * 0.17).toFixed(2);
    const grand = (subTotal * 1.17).toFixed(2);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>הזמנת רכש — ${order.id}</title><style>
        *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,Heebo,Arial,sans-serif;color:#1D1D1F;background:#fff;padding:40px;direction:rtl;text-align:right}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #007AFF}
        .logo{font-size:28px;font-weight:900;color:#007AFF}.po-num{font-size:13px;color:#86868B;margin-top:4px}
        .section{margin-bottom:20px}.section-title{font-size:10px;font-weight:800;color:#86868B;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .info-block{background:#F5F5F7;border-radius:12px;padding:14px}
        .info-label{font-size:11px;color:#AEAEB2;font-weight:600;margin-bottom:2px}.info-value{font-size:14px;font-weight:700;color:#1D1D1F}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th{background:#007AFF;color:#fff;padding:10px 14px;font-size:12px;font-weight:800;text-align:right}
        td{padding:10px 14px;font-size:13px;border-bottom:1px solid #F0F0F0;text-align:right}
        tr:nth-child(even) td{background:#F9F9FB}
        .totals{margin-top:16px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
        .total-row{display:flex;gap:20px;font-size:13px}.total-label{color:#86868B;width:120px}.total-val{font-weight:700}
        .grand{font-size:16px;font-weight:900;color:#007AFF;border-top:2px solid #007AFF;padding-top:8px;margin-top:4px}
        .footer{margin-top:32px;padding-top:16px;border-top:1px solid #E5E5EA;font-size:11px;color:#AEAEB2;text-align:center}
        @media print{body{padding:20px}.footer{position:fixed;bottom:0;left:0;right:0}}
    </style></head><body>
    <div class="header">
        <div>
            <div class="logo">NextClass</div>
            <div class="po-num">הזמנת רכש מס׳ ${order.id}</div>
            <div class="po-num">תאריך: ${today}</div>
        </div>
        <div style="text-align:right">
            <div class="info-label">מס׳ ע.מ. רוכש</div>
            <div class="info-value">514XXXXXX (NextClass)</div>
        </div>
    </div>
    <div class="grid2">
        <div class="info-block">
            <div class="section-title">פרטי ספק</div>
            <div class="info-label">שם</div><div class="info-value">${supplier?.name || '—'}</div>
            <div style="margin-top:8px"><div class="info-label">איש קשר</div><div class="info-value">${supplier?.contact || '—'}</div></div>
            <div style="margin-top:8px"><div class="info-label">מס׳ ע.מ. ספק</div><div class="info-value">${supplier?.vatNumber || '—'}</div></div>
            <div style="margin-top:8px"><div class="info-label">טלפון</div><div class="info-value">${supplier?.phone || '—'}</div></div>
        </div>
        <div class="info-block">
            <div class="section-title">כתובת משלוח</div>
            <div class="info-value">${customerOrder?.address || customerOrder?.shippingAddress || '—'}</div>
            <div style="margin-top:8px"><div class="info-label">לקוח</div><div class="info-value">${order.customerName || '—'}</div></div>
            <div style="margin-top:8px"><div class="info-label">ETA</div><div class="info-value">${order.eta || '—'}</div></div>
            <div style="margin-top:8px"><div class="info-label">תנאי תשלום</div><div class="info-value">${supplier?.paymentTerms || '—'}</div></div>
        </div>
    </div>
    <table>
        <thead><tr><th>סה״כ</th><th>מחיר יחידה</th><th>כמות</th><th>תיאור מוצר</th></tr></thead>
        <tbody>
            <tr><td>₪${subTotal.toFixed(2)}</td><td>₪${(order.qty ? (subTotal / order.qty).toFixed(2) : subTotal.toFixed(2))}</td><td>${order.qty || 1}</td><td>${order.productTitle || '—'}</td></tr>
        </tbody>
    </table>
    <div class="totals">
        <div class="total-row"><span class="total-label">סכום לפני מע״מ</span><span class="total-val">₪${subTotal.toFixed(2)}</span></div>
        <div class="total-row"><span class="total-label">מע״מ 17%</span><span class="total-val">₪${vat}</span></div>
        <div class="total-row grand"><span class="total-label">סה״כ לתשלום</span><span class="total-val">₪${grand}</span></div>
    </div>
    ${order.notes ? `<div class="info-block" style="margin-top:20px"><div class="section-title">הערות</div><div class="info-value">${order.notes}</div></div>` : ''}
    <div class="footer">NextClass · הזמנת רכש זו הופקה אוטומטית · ${today}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
    </body></html>`);
    win.document.close();
}

function OrderDetailDrawer({ order, customerOrders, suppliers, onClose, showToast }) {
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [copied, setCopied] = useState(null);
    // #4 Checklist
    const [checklistOpen, setChecklistOpen] = useState(false);
    const [checklist, setChecklist] = useState(order.checklistStatus || {});
    // #8 Supplier rating
    const [ratingOpen, setRatingOpen] = useState(false);
    const [ratings, setRatings] = useState({ timing: 3, accuracy: 3, communication: 3, pricing: 3 });
    const [ratingSaved, setRatingSaved] = useState(false);
    // #9 Timeline
    const [timelineOpen, setTimelineOpen] = useState(false);

    const customerOrder = customerOrders.find(o => o.id === order.customerOrderId) || {};
    const supplier = suppliers.find(s => s.id === order.supplierId);

    const f = (key, val) => setEdits(p => ({ ...p, [key]: val }));
    const get = (key) => (key in edits) ? edits[key] : (order[key] ?? '');
    const isDirty = Object.keys(edits).length > 0;

    const currentStatusIdx = STATUSES.findIndex(s => s.id === order.status);
    const nextStatusId = NEXT_STATUS[order.status];
    const nextStatusObj = STATUSES.find(s => s.id === nextStatusId);

    // #5 Profit margin
    const revenue = parseFloat(customerOrder.total) || 0;
    const cost     = parseFloat(order.totalCost) || 0;
    const profit   = revenue - cost;
    const margin   = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : null;

    const handleSave = async () => {
        if (!isDirty) return;
        setSaving(true);
        try {
            const updates = { ...edits };
            // #9 Timeline: add status-change event if status is in edits
            if (edits.status) {
                updates.timeline = arrayUnion({ action: `סטטוס שונה ל: ${edits.status}`, timestamp: Date.now(), by: 'admin' });
            }
            await updateDoc(doc(db, 'supplier_orders', order.id), updates);
            showToast('עודכן בהצלחה', 'success');
            setEdits({});
        } catch { showToast('שגיאה בשמירה', 'error'); }
        setSaving(false);
    };

    const handleAdvance = async () => {
        if (!nextStatusId) return;
        setAdvancing(true);
        try {
            const updateData = {
                status: nextStatusId,
                [`${nextStatusId}At`]: serverTimestamp(),
                // #9 Timeline
                timeline: arrayUnion({ action: `סטטוס שונה ל: ${nextStatusObj?.label}`, timestamp: Date.now(), by: 'admin' }),
            };
            await updateDoc(doc(db, 'supplier_orders', order.id), updateData);

            // #7 Status cascade: if advancing to 'shipped', update customer order too
            if (nextStatusId === 'shipped' && order.customerOrderId) {
                try {
                    await updateDoc(doc(db, 'orders', order.customerOrderId), {
                        status: 'נשלח',
                        shippedAt: serverTimestamp(),
                        trackingNumber: order.trackingNumber || '',
                    });
                    showToast('סטטוס עודכן ל: נשלח — הלקוח עודכן אוטומטית', 'success');
                } catch {
                    showToast(`סטטוס עודכן ל: ${nextStatusObj?.label}`, 'success');
                }
            } else {
                showToast(`סטטוס עודכן ל: ${nextStatusObj?.label}`, 'success');
            }
        } catch { showToast('שגיאה', 'error'); }
        setAdvancing(false);
    };

    // #4 Checklist toggle — saves to Firestore immediately
    const CHECKLIST_STEPS = [
        { key: 'po_sent',       label: 'PO נשלח לספק' },
        { key: 'confirmed',     label: 'אישור התקבל מהספק' },
        { key: 'invoice',       label: 'חשבונית התקבלה' },
        { key: 'inspected',     label: 'סחורה נבדקה ואושרה' },
        { key: 'packed',        label: 'ארוז ומוכן למשלוח' },
        { key: 'customer_notified', label: 'לקוח עודכן' },
    ];
    const checklistDone = CHECKLIST_STEPS.filter(s => checklist[s.key]).length;

    const toggleChecklistItem = async (key) => {
        const newVal = !checklist[key];
        const updated = { ...checklist, [key]: newVal };
        setChecklist(updated);
        try {
            await updateDoc(doc(db, 'supplier_orders', order.id), { checklistStatus: updated });
        } catch {}
    };

    // #8 Supplier rating submit
    const submitRating = async () => {
        if (!supplier) return;
        const avg = ((ratings.timing + ratings.accuracy + ratings.communication + ratings.pricing) / 4).toFixed(1);
        try {
            await updateDoc(doc(db, 'suppliers', order.supplierId), {
                ratings: arrayUnion({
                    orderId: order.id,
                    date: new Date().toISOString(),
                    scores: { ...ratings },
                    avg: parseFloat(avg),
                }),
            });
            setRatingSaved(true);
            showToast('דירוג נשמר בהצלחה', 'success');
        } catch { showToast('שגיאה בשמירת דירוג', 'error'); }
    };

    const copyText = (text, key) => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(key);
        setTimeout(() => setCopied(null), 1600);
    };

    // #3 Customer WhatsApp buttons
    const customerPhone = customerOrder.phone;
    const customerFirstName = (order.customerName || '').split(' ')[0] || 'לקוח';
    const buildWaLink = (text) => {
        if (!customerPhone) return '#';
        const num = customerPhone.replace(/\D/g, '').replace(/^0/, '');
        return `https://wa.me/972${num}?text=${encodeURIComponent(text)}`;
    };
    const waShortcuts = [
        {
            label: 'הזמנה התקבלה',
            icon: CheckCircle,
            text: `שלום ${customerFirstName}, הזמנתך מנקסטקלאס התקבלה ועוברת לטיפול! ניצור איתך קשר בקרוב.`,
            color: '#34C759',
        },
        {
            label: 'יצאה לדרך',
            icon: Truck,
            text: `שלום ${customerFirstName}, הזמנתך יצאה לדרך! צפי הגעה: ${order.eta || '—'}. מספר מעקב: ${order.trackingNumber || '—'}`,
            color: '#007AFF',
        },
        {
            label: 'נמסרה',
            icon: Package,
            text: `שלום ${customerFirstName}, הזמנתך נמסרה! תודה שבחרת בנקסטקלאס.`,
            color: '#5856D6',
        },
    ];

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[45]"
                style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }}
            />

            {/* Drawer — slides from LEFT (content side in RTL with right sidebar) */}
            <motion.div
                initial={{ x: '-100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                className="fixed top-0 left-0 bottom-0 z-[46] flex flex-col"
                style={{ width: 500, maxWidth: '100vw', background: 'rgba(248,248,250,0.96)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', boxShadow: '6px 0 48px rgba(0,0,0,0.16)' }}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-black/[0.06] shrink-0" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)' }}>
                    <button onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-all cursor-pointer shrink-0">
                        <X size={18} className="text-[#86868B]" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <StatusPill statusId={order.status} />
                            {order.eta && (
                                <span className="text-[10px] font-bold text-[#86868B]">ETA: {order.eta}</span>
                            )}
                        </div>
                        <p className="font-black text-[#1D1D1F] text-[15px] truncate">{order.customerName}</p>
                        <p className="text-[11px] text-[#86868B] truncate">{order.productTitle} × {order.qty}</p>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                    {/* Status Timeline */}
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest mb-4">מסלול ההזמנה</p>
                        <div className="flex items-start gap-0">
                            {STATUSES.map((s, i) => {
                                const isActive  = s.id === order.status;
                                const isPast    = currentStatusIdx > i;
                                const dotColor  = isActive ? s.color : isPast ? s.color : '#E5E5EA';
                                const lineColor = isPast ? (STATUSES[i + 1]?.color || '#E5E5EA') : '#E5E5EA';
                                return (
                                    <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5 relative">
                                        {/* Connector line */}
                                        {i < STATUSES.length - 1 && (
                                            <div className="absolute top-3 right-1/2 left-0 h-0.5 -translate-y-1/2"
                                                style={{ background: lineColor, left: 'calc(50% + 10px)', right: 'calc(50% - 12px)' }}
                                            />
                                        )}
                                        {/* Dot */}
                                        <div className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                                            style={{
                                                background: isActive ? s.color : isPast ? `${s.color}22` : '#F2F2F7',
                                                border: `2px solid ${dotColor}`,
                                                boxShadow: isActive ? `0 0 0 3px ${s.color}22` : 'none',
                                            }}>
                                            <s.icon size={11} style={{ color: isActive ? '#fff' : isPast ? s.color : '#C7C7CC' }} />
                                        </div>
                                        <p className="text-[8.5px] font-bold text-center leading-tight px-0.5"
                                            style={{ color: isActive ? s.color : isPast ? '#86868B' : '#C7C7CC' }}>
                                            {s.label}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Advance button */}
                        {nextStatusId && (
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdvance}
                                disabled={advancing}
                                className="w-full mt-4 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer transition-opacity"
                                style={{ background: `linear-gradient(135deg, ${nextStatusObj?.color}, ${nextStatusObj?.color}BB)`, opacity: advancing ? 0.7 : 1 }}>
                                <ArrowRight size={14} />
                                {advancing ? 'מעדכן...' : `קדם ל: ${nextStatusObj?.label}`}
                            </motion.button>
                        )}
                        {!nextStatusId && (
                            <div className="mt-4 py-2 rounded-xl text-[12px] font-bold text-[#34C759] text-center flex items-center justify-center gap-2"
                                style={{ background: 'rgba(52,199,89,0.08)' }}>
                                <CheckCircle size={14} style={{ color: '#34C759' }} />
                                הזמנה הושלמה
                            </div>
                        )}
                    </div>

                    {/* Customer Details */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                            <p className="text-[12px] font-black text-[#1D1D1F]">פרטי לקוח</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,122,255,0.10)' }}>
                                <User size={13} style={{ color: '#007AFF' }} />
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <DetailRow label="שם מלא" value={order.customerName} />
                            <DetailRow label="טלפון" value={customerOrder.phone}
                                action={customerOrder.phone && (
                                    <a href={`tel:${customerOrder.phone}`}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                        style={{ background: 'rgba(52,199,89,0.10)', color: '#34C759' }}>
                                        <Phone size={10} /> התקשר
                                    </a>
                                )} />
                            <DetailRow label="אימייל" value={customerOrder.email}
                                action={customerOrder.email && (
                                    <a href={`mailto:${customerOrder.email}`}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                        style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>
                                        <Mail size={10} /> שלח
                                    </a>
                                )} />
                            <DetailRow label="כתובת" value={customerOrder.address || customerOrder.shippingAddress}
                                action={(customerOrder.address || customerOrder.shippingAddress) && (
                                    <button
                                        onClick={() => copyText(customerOrder.address || customerOrder.shippingAddress, 'addr')}
                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                        style={{ background: 'rgba(142,142,147,0.12)', color: '#86868B' }}>
                                        {copied === 'addr' ? <><Check size={10} /> הועתק</> : <><Copy size={10} /> העתק</>}
                                    </button>
                                )} />
                            <DetailRow label="עיר" value={customerOrder.city} />
                            <DetailRow label="תאריך הזמנה" value={customerOrder.date || order.sentAt?.toDate?.().toLocaleDateString('he-IL')} />
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                            <p className="text-[12px] font-black text-[#1D1D1F]">פרטי הזמנה</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,149,0,0.10)' }}>
                                <ShoppingCart size={13} style={{ color: '#FF9500' }} />
                            </div>
                        </div>
                        <div className="px-4 py-2">
                            <DetailRow label="מוצר" value={order.productTitle} />
                            <DetailRow label="כמות" value={String(order.qty || 1)} />
                            <DetailRow label="עלות ספק" value={order.totalCost > 0 ? `₪${order.totalCost}` : null} />
                            {customerOrder.total && <DetailRow label="מחיר ללקוח" value={`₪${customerOrder.total}`} />}
                            {customerOrder.total && order.totalCost > 0 && (
                                <DetailRow label="מרווח גולמי"
                                    value={`₪${(parseFloat(customerOrder.total) - parseFloat(order.totalCost)).toFixed(0)}`} />
                            )}
                        </div>
                    </div>

                    {/* Supplier */}
                    {supplier && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                            <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                                <p className="text-[12px] font-black text-[#1D1D1F]">{supplier.name}</p>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(88,86,214,0.10)' }}>
                                    <Building2 size={13} style={{ color: '#5856D6' }} />
                                </div>
                            </div>
                            <div className="px-4 py-2">
                                <DetailRow label="איש קשר" value={supplier.contact} />
                                <DetailRow label="טלפון" value={supplier.phone}
                                    action={supplier.phone && (
                                        <a href={`tel:${supplier.phone}`}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                            style={{ background: 'rgba(52,199,89,0.10)', color: '#34C759' }}>
                                            <Phone size={10} /> התקשר
                                        </a>
                                    )} />
                                <DetailRow label="אימייל" value={supplier.email}
                                    action={supplier.email && (
                                        <a href={`mailto:${supplier.email}`}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                                            style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>
                                            <Mail size={10} /> שלח
                                        </a>
                                    )} />
                                <DetailRow label="ימי אספקה" value={supplier.leadTimeDays ? `${supplier.leadTimeDays} ימים` : null} />
                                <DetailRow label="תנאי תשלום" value={supplier.paymentTerms} />
                            </div>
                        </div>
                    )}

                    {/* Tracking & Fulfillment — editable */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                            <p className="text-[12px] font-black text-[#1D1D1F]">מעקב ואספקה</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,159,10,0.10)' }}>
                                <Truck size={13} style={{ color: '#FF9F0A' }} />
                            </div>
                        </div>
                        <div className="p-4 space-y-3">
                            <EditableField
                                label="מס׳ הזמנה אצל ספק (אסמכתא)"
                                value={get('supplierRef')}
                                onChange={v => f('supplierRef', v)}
                                placeholder="REF-12345" />
                            <EditableField
                                label="מספר מעקב משלוח"
                                value={get('trackingNumber')}
                                onChange={v => f('trackingNumber', v)}
                                placeholder="מספר מעקב / AWB / שובר" />
                            <div className="grid grid-cols-2 gap-3">
                                <EditableField
                                    label="תאריך ETA"
                                    value={get('eta')}
                                    onChange={v => f('eta', v)}
                                    type="date" />
                                <EditableField
                                    label="עלות ספק (₪)"
                                    value={get('totalCost') === 0 ? '' : get('totalCost')}
                                    onChange={v => f('totalCost', parseFloat(v) || 0)}
                                    placeholder="0"
                                    type="number" />
                            </div>

                            {/* #3 Customer WhatsApp shortcuts */}
                            {customerPhone && (
                                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 8, textAlign: 'right' }}>עדכון לקוח מהיר</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                                        {waShortcuts.map((ws, i) => (
                                            <a key={i} href={buildWaLink(ws.text)} target="_blank" rel="noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: `${ws.color}12`, color: ws.color, border: `1px solid ${ws.color}30`, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                                                <ws.icon size={11} />
                                                {ws.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* #5 Profit Margin */}
                    {revenue > 0 && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                            <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                                <p className="text-[12px] font-black text-[#1D1D1F]">רווחיות</p>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,199,89,0.10)' }}>
                                    <TrendingUp size={13} style={{ color: '#34C759' }} />
                                </div>
                            </div>
                            <div className="p-4">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        { label: 'הכנסה', value: `₪${revenue.toFixed(0)}`, color: '#007AFF' },
                                        { label: 'עלות ספק', value: cost > 0 ? `₪${cost.toFixed(0)}` : '—', color: '#FF9500' },
                                        { label: 'רווח גולמי', value: cost > 0 ? `₪${profit.toFixed(0)}` : '—', color: profit >= 0 ? '#34C759' : '#FF3B30' },
                                        { label: 'מרווח', value: margin !== null && cost > 0 ? `${margin}%` : '—', color: parseFloat(margin) >= 20 ? '#34C759' : parseFloat(margin) >= 0 ? '#FF9500' : '#FF3B30' },
                                    ].map((m, i) => (
                                        <div key={i} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 12, padding: '10px 12px', textAlign: 'right', border: `1px solid ${m.color}18` }}>
                                            <p style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2', marginBottom: 3 }}>{m.label}</p>
                                            <p style={{ fontSize: 16, fontWeight: 900, color: m.color }}>{m.value}</p>
                                        </div>
                                    ))}
                                </div>
                                {margin !== null && cost > 0 && (
                                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 99, background: parseFloat(margin) >= 20 ? 'rgba(52,199,89,0.12)' : parseFloat(margin) >= 0 ? 'rgba(255,149,0,0.12)' : 'rgba(255,59,48,0.12)', color: parseFloat(margin) >= 20 ? '#34C759' : parseFloat(margin) >= 0 ? '#FF9500' : '#FF3B30' }}>
                                            מרווח {margin}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* #4 Fulfillment Checklist */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <button onClick={() => setChecklistOpen(v => !v)} className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#007AFF]/[0.04] transition-all">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B' }}>{checklistDone}/6 שלבים</span>
                                <div style={{ width: 60, height: 4, borderRadius: 99, background: '#F0F0F0', overflow: 'hidden' }}>
                                    <div style={{ width: `${(checklistDone / 6) * 100}%`, height: '100%', background: checklistDone === 6 ? '#34C759' : '#007AFF', borderRadius: 99, transition: 'width 0.3s' }} />
                                </div>
                                <ChevronDown size={13} className="text-[#AEAEB2]" style={{ transform: checklistOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>צ׳קליסט מילוי הזמנה</p>
                                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,122,255,0.10)' }}>
                                    <CheckCircle size={13} style={{ color: '#007AFF' }} />
                                </div>
                            </div>
                        </button>
                        <AnimatePresence>
                            {checklistOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                    <div className="px-4 pb-4 space-y-2">
                                        {CHECKLIST_STEPS.map((step, i) => (
                                            <button key={step.key} onClick={() => toggleChecklistItem(step.key)}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: checklist[step.key] ? 'rgba(52,199,89,0.07)' : 'rgba(0,0,0,0.02)', border: `1px solid ${checklist[step.key] ? 'rgba(52,199,89,0.2)' : 'rgba(0,0,0,0.06)'}`, cursor: 'pointer', textAlign: 'right', transition: 'all 0.15s' }}>
                                                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checklist[step.key] ? '#34C759' : '#C7C7CC'}`, background: checklist[step.key] ? '#34C759' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                                    {checklist[step.key] && <Check size={11} color="#fff" />}
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: checklist[step.key] ? '#34C759' : '#1D1D1F', textDecoration: checklist[step.key] ? 'line-through' : 'none', flex: 1 }}>{step.label}</span>
                                                <span style={{ fontSize: 10, color: '#AEAEB2' }}>{i + 1}/6</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* #7 Shipped cascade notification (when status is shipped) */}
                    {order.status === 'shipped' && order.customerOrderId && customerPhone && (
                        <div style={{ background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <a href={buildWaLink(`שלום ${customerFirstName}, הזמנתך יצאה לדרך! צפי הגעה: ${order.eta || '—'}. מספר מעקב: ${order.trackingNumber || '—'}`)} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: 'rgba(37,211,102,0.15)', color: '#1DA851', fontSize: 12, fontWeight: 800, textDecoration: 'none', border: '1px solid rgba(37,211,102,0.3)', cursor: 'pointer', flexShrink: 0 }}>
                                <MessageSquare size={12} />
                                שלח ללקוח WhatsApp
                            </a>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#30D158', textAlign: 'right' }}>הזמנה סומנה כנשלחה — עדכן את הלקוח</p>
                        </div>
                    )}

                    {/* #8 Supplier Rating */}
                    {(order.status === 'shipped' || order.status === 'arrived') && supplier && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                            <button onClick={() => setRatingOpen(v => !v)} className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#007AFF]/[0.04] transition-all">
                                <ChevronDown size={13} className="text-[#AEAEB2]" style={{ transform: ratingOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>דרג את הספק</p>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,149,0,0.10)' }}>
                                        <Star size={13} style={{ color: '#FF9500' }} />
                                    </div>
                                </div>
                            </button>
                            <AnimatePresence>
                                {ratingOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                        <div className="px-4 pb-4 space-y-3">
                                            {[
                                                { key: 'timing',        label: 'עמידה בזמנים',   Icon: Clock },
                                                { key: 'accuracy',      label: 'דיוק ההזמנה',    Icon: Package },
                                                { key: 'communication', label: 'תקשורת',          Icon: MessageSquare },
                                                { key: 'pricing',       label: 'יציבות מחירים',  Icon: DollarSign },
                                            ].map(({ key, label, Icon }) => (
                                                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        {[1,2,3,4,5].map(n => (
                                                            <button key={n} onClick={() => setRatings(r => ({ ...r, [key]: n }))}
                                                                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: n <= ratings[key] ? '#FF9500' : 'rgba(0,0,0,0.06)', transition: 'all 0.12s' }}>
                                                                <Star size={14} style={{ color: n <= ratings[key] ? '#fff' : '#C7C7CC' }} fill={n <= ratings[key] ? '#fff' : 'none'} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 5 }}><Icon size={13} style={{ color: '#86868B', flexShrink: 0 }} />{label}</span>
                                                </div>
                                            ))}
                                            {!ratingSaved ? (
                                                <button onClick={submitRating}
                                                    style={{ width: '100%', padding: '10px', borderRadius: 14, background: 'linear-gradient(135deg,#FF9500,#FF6B00)', color: '#fff', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                                                    שמור דירוג
                                                </button>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '10px', fontSize: 13, fontWeight: 700, color: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Check size={14} style={{ color: '#34C759' }} />דירוג נשמר — תודה!</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* #9 Activity Timeline */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <button onClick={() => setTimelineOpen(v => !v)} className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#007AFF]/[0.04] transition-all">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B' }}>{(order.timeline || []).length} אירועים</span>
                                <ChevronDown size={13} className="text-[#AEAEB2]" style={{ transform: timelineOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>היסטוריית פעולות</p>
                                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(88,86,214,0.10)' }}>
                                    <Activity size={13} style={{ color: '#5856D6' }} />
                                </div>
                            </div>
                        </button>
                        <AnimatePresence>
                            {timelineOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                    <div className="px-4 pb-4">
                                        {(!order.timeline || order.timeline.length === 0) ? (
                                            <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', padding: '12px 0' }}>אין אירועים עדיין</p>
                                        ) : (
                                            <div style={{ position: 'relative', paddingRight: 16 }}>
                                                <div style={{ position: 'absolute', right: 7, top: 0, bottom: 0, width: 2, background: 'rgba(88,86,214,0.12)', borderRadius: 99 }} />
                                                {[...order.timeline].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((evt, i) => (
                                                    <div key={i} style={{ position: 'relative', paddingBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                        <div style={{ position: 'absolute', right: -9, top: 4, width: 10, height: 10, borderRadius: 99, background: '#5856D6', border: '2px solid #fff', flexShrink: 0 }} />
                                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>{evt.action}</p>
                                                            <p style={{ fontSize: 10, color: '#AEAEB2', marginTop: 2 }}>
                                                                {evt.timestamp ? new Date(evt.timestamp).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''} · {evt.by || 'admin'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Download PO button */}
                    <button onClick={() => generatePO(order, customerOrder, supplier)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 16, background: 'rgba(0,122,255,0.07)', color: '#007AFF', fontSize: 13, fontWeight: 800, border: '1px solid rgba(0,122,255,0.15)', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <Printer size={15} />
                        הורד / הדפס PO
                    </button>

                    {/* Notes */}
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                        <div className="px-4 py-3 border-b border-black/[0.04] flex items-center justify-end gap-2">
                            <p className="text-[12px] font-black text-[#1D1D1F]">הערות</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(142,142,147,0.12)' }}>
                                <FileText size={13} className="text-[#86868B]" />
                            </div>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={get('notes')}
                                onChange={e => f('notes', e.target.value)}
                                placeholder="הוראות מיוחדות, הערות ספק, תיאום עם לקוח..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none text-right transition-all" />
                        </div>
                    </div>

                    {/* Spacer so save bar doesn't cover content */}
                    <div className="h-2" />
                </div>

                {/* Sticky save bar — only when dirty */}
                <AnimatePresence>
                    {isDirty && (
                        <motion.div
                            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
                            className="shrink-0 p-4 border-t border-black/[0.06] flex gap-3" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}>
                            <button onClick={() => setEdits({})}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-[#007AFF]/[0.04] transition-all cursor-pointer">
                                בטל
                            </button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                                className="flex-2 px-8 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg,#34C759,#2DB84B)', boxShadow: '0 4px 16px rgba(52,199,89,0.28)', opacity: saving ? 0.7 : 1 }}>
                                <Check size={15} />
                                {saving ? 'שומר...' : 'שמור שינויים'}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

// ─── Babushka drill primitives (shared visual grammar with the dashboard) ─────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#1D1D1F';
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-[14px] p-3 text-center"
                        style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                        <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ color: c }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}

const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

function DashboardTab({ supplierOrders, customerOrders, suppliers, onSelectOrder, onForwardOrder, pipelineQuotes = [], onGoToPipeline }) {
    const pending   = supplierOrders.filter(o => o.status === 'pending').length;
    const inTransit = supplierOrders.filter(o => o.status === 'in_transit').length;
    const forwarded = supplierOrders.filter(o => o.status === 'forwarded' || o.status === 'confirmed').length;
    const shipped   = supplierOrders.filter(o => o.status === 'shipped').length;

    const forwardedOrderIds = new Set(supplierOrders.map(so => so.customerOrderId));
    const needsAction = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedOrderIds.has(o.id));

    const kpis = [
        { label: 'ממתינות להעברה',  value: pending,   color: '#FF9500', icon: Clock,       sub: 'דורשות פעולה', scope: 'pending' },
        { label: 'בתהליך אצל ספק', value: forwarded,  color: '#007AFF', icon: Send,        sub: 'מחכות לאישור', scope: 'forwarded' },
        { label: 'בדרך',            value: inTransit, color: '#FF9F0A', icon: Truck,       sub: 'בהובלה',       scope: 'in_transit' },
        { label: 'הושלמו',          value: shipped,   color: '#34C759', icon: CheckCircle, sub: 'כל ההזמנות',   scope: 'shipped' },
    ];

    // ── Babushka drill stack (KPI / summary → breakdown → order detail) ──
    const [drillStack, setDrillStack] = useState([]);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {kpis.map((k, i) => (
                    <AdminKPICard key={k.label} title={k.label} value={k.value} subtitle={k.sub}
                        icon={<k.icon size={20} color={k.color} />} accent={k.color} delay={i * 0.05}
                        onClick={() => openDrill({ type: 'status', scope: k.scope })} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Needs Action */}
                <div className="rounded-[1.5rem] overflow-hidden" style={card}>
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                        <button type="button" onClick={() => openDrill({ type: 'needsAction' })}
                            className="text-[10px] font-black text-[#86868B] hover:text-[#FF9500] tracking-widest inline-flex items-center gap-1 cursor-pointer transition-colors">
                            {needsAction.length} הזמנות<ChevronLeft size={12} />
                        </button>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#FF9500]" />
                            <h3 className="text-sm font-black text-[#1D1D1F]">דורש העברה לספק</h3>
                        </div>
                    </div>
                    {needsAction.length === 0 ? (
                        <div className="py-10 text-center">
                            <CheckCircle size={28} className="mx-auto text-[#34C759] mb-2" />
                            <p className="text-sm font-bold text-[#86868B] flex items-center justify-center gap-1"><Check size={13} className="text-[#34C759]" />כל ההזמנות טופלו</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/[0.04]">
                            {needsAction.slice(0, 5).map(o => (
                                <motion.div key={o.id} whileHover={{ background: 'rgba(255,149,0,0.04)' }}
                                    onClick={() => onForwardOrder(o)}
                                    className="px-6 py-3.5 flex items-center justify-between cursor-pointer transition-all" dir="rtl">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: 'rgba(255,149,0,0.12)' }}>
                                            <Send size={12} style={{ color: '#FF9500' }} />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-[#AEAEB2] block">{o.date || '—'}</span>
                                            <span className="text-[10px] font-bold text-[#FF9500]">לחץ להעברה לספק</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#1D1D1F]">{o.customer}</p>
                                        <p className="text-[11px] text-[#86868B]">{o.product} × {o.qty}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Supplier Orders */}
                <div className="rounded-[1.5rem] overflow-hidden" style={card}>
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                        <button type="button" onClick={() => openDrill({ type: 'allOrders' })}
                            className="text-[10px] font-black text-[#86868B] hover:text-[#007AFF] tracking-widest inline-flex items-center gap-1 cursor-pointer transition-colors">
                            {supplierOrders.length} סה״כ<ChevronLeft size={12} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Truck size={14} className="text-[#007AFF]" />
                            <h3 className="text-sm font-black text-[#1D1D1F]">הזמנות אחרונות</h3>
                        </div>
                    </div>
                    {supplierOrders.length === 0 ? (
                        <div className="py-10 text-center">
                            <Package size={28} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-sm font-bold text-[#86868B]">אין הזמנות עדיין</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/[0.04]">
                            {supplierOrders.slice(0, 5).map(o => (
                                <motion.div key={o.id} whileHover={{ background: 'rgba(0,122,255,0.03)' }}
                                    onClick={() => onSelectOrder(o)}
                                    className="px-6 py-3.5 flex items-center justify-between cursor-pointer transition-all group" dir="rtl">
                                    <div className="flex items-center gap-2">
                                        <StatusPill statusId={o.status} />
                                        <span className="text-[10px] text-[#AEAEB2] group-hover:text-[#007AFF] transition-colors">פתח ›</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#1D1D1F]">{o.customerName}</p>
                                        <p className="text-[11px] text-[#86868B]">{o.productTitle} × {o.qty}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Babushka Drill Drawer — KPI / summary → breakdown → detail ── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                const isOpen  = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!current) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const dstr = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '';
                const money = (n) => `₪${(Number(n) || 0).toLocaleString('he-IL')}`;
                const statusMeta = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];
                const supOrderList = (list) => (
                    list.length === 0 ? <DrillEmpty icon={Package} text="אין הזמנות ספקים להצגה" /> : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הזמנות ספקים — לחץ לפרטים</p>
                            {list.slice(0, 40).map((o, i) => (
                                <DrillRow key={o.id} delay={i * 0.02} tone={statusMeta(o.status).color}
                                    onClick={() => pushDrill({ type: 'order', id: o.id })}
                                    leading={<StatusPill statusId={o.status} />}
                                    title={o.customerName || 'לקוח'}
                                    subtitle={`${o.productTitle || 'מוצר'} × ${o.qty || 1}${o.supplierName ? ` · ${o.supplierName}` : ''}`}
                                    trailing={o.totalCost ? <span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{money(o.totalCost)}</span> : undefined}
                                />
                            ))}
                        </div>
                    )
                );

                let title = '', subtitle = '', icon = null, accent = BROWN, footer = null, body = null;

                if (current.type === 'status') {
                    const meta = kpis.find(k => k.scope === current.scope) || kpis[0];
                    const list = current.scope === 'forwarded'
                        ? supplierOrders.filter(o => o.status === 'forwarded' || o.status === 'confirmed')
                        : supplierOrders.filter(o => o.status === current.scope);
                    accent = meta.color; icon = <meta.icon size={17} color={meta.color} />;
                    title = meta.label; subtitle = `${list.length} הזמנות ספקים`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ממתינות', value: pending, color: '#FF9500' },
                                { label: 'אצל ספק', value: forwarded, color: '#007AFF' },
                                { label: 'בדרך', value: inTransit, color: '#FF9F0A' },
                                { label: 'הושלמו', value: shipped, color: '#34C759' },
                            ]} />
                            {supOrderList(list)}
                        </div>
                    );
                } else if (current.type === 'allOrders') {
                    accent = BROWN; icon = <Package size={17} color={BROWN} />;
                    title = 'כל ההזמנות'; subtitle = `${supplierOrders.length} ידניות · ${pipelineQuotes.length} מהצינור`;
                    const openTotal = supplierOrders.reduce((s, o) => s + (Number(o.totalCost) || 0), 0);
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הזמנות ידניות', value: supplierOrders.length, color: BROWN },
                                { label: 'מהצינור', value: pipelineQuotes.length, color: '#0891B2' },
                                { label: 'ערך כולל', value: money(openTotal), color: '#34C759' },
                            ]} />
                            {supOrderList(supplierOrders)}
                            {pipelineQuotes.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הזמנות מהצינור — לחץ לפרטים</p>
                                    {pipelineQuotes.slice(0, 40).map((q, i) => (
                                        <DrillRow key={q.id} delay={i * 0.02} tone="#0891B2"
                                            onClick={() => pushDrill({ type: 'pipeQuote', id: q.id })}
                                            leading={<PipelineStatusPill status={q.status} />}
                                            title={q.customer || q.contactName || q.institution || 'לקוח'}
                                            subtitle={quoteItemsLabel(q)}
                                            trailing={q.total ? <span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{money(q.total)}</span> : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (current.type === 'needsAction') {
                    accent = '#FF9500'; icon = <AlertTriangle size={17} color="#FF9500" />;
                    title = 'דורש העברה לספק'; subtitle = `${needsAction.length} הזמנות ממתינות`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ממתינות', value: needsAction.length, color: '#FF9500' },
                                { label: 'הועברו', value: supplierOrders.length, color: '#007AFF' },
                                { label: 'הושלמו', value: shipped, color: '#34C759' },
                            ]} />
                            {needsAction.length === 0 ? <DrillEmpty icon={CheckCircle} text="כל ההזמנות טופלו 🎉" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הזמנות לקוח — לחץ להעברה</p>
                                    {needsAction.slice(0, 40).map((o, i) => (
                                        <DrillRow key={o.id} delay={i * 0.02} tone="#FF9500"
                                            onClick={() => pushDrill({ type: 'custOrder', id: o.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,149,0,0.12)' }}><Send size={13} color="#FF9500" /></span>}
                                            title={o.customer || 'לקוח'}
                                            subtitle={`${o.product || 'מוצר'} × ${o.qty || 1} · ${o.date || '—'}`}
                                            trailing={o.total ? <span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{money(o.total)}</span> : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (current.type === 'order') {
                    const o = supplierOrders.find(x => x.id === current.id);
                    if (!o) {
                        title = 'הזמנת ספק'; icon = <Package size={17} color={BROWN} />;
                        body = <DrillEmpty icon={Package} text="ההזמנה נמחקה או אינה זמינה" />;
                    } else {
                        const meta = statusMeta(o.status);
                        accent = meta.color; icon = <meta.icon size={17} color={meta.color} />;
                        title = o.customerName || 'הזמנת ספק'; subtitle = `${o.supplierName || 'ספק'} · ${dstr(o.createdAt) || '—'}`;
                        footer = { label: 'פתח הזמנה מלאה', onClick: () => { closeDrill(); onSelectOrder(o); } };
                        body = (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <StatusPill statusId={o.status} />
                                    {o.totalCost ? <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">{money(o.totalCost)}</p> : null}
                                </div>
                                <DrillStat items={[
                                    { label: 'מוצר', value: o.productTitle || '—', color: BROWN },
                                    { label: 'כמות', value: o.qty || 1, color: '#007AFF' },
                                    { label: 'ETA', value: o.eta || '—', color: '#5856D6' },
                                ]} />
                            </div>
                        );
                    }
                } else if (current.type === 'custOrder') {
                    const o = customerOrders.find(x => x.id === current.id);
                    if (!o) {
                        title = 'הזמנת לקוח'; icon = <ShoppingCart size={17} color="#FF9500" />;
                        body = <DrillEmpty icon={ShoppingCart} text="ההזמנה נמחקה או אינה זמינה" />;
                    } else {
                        accent = '#FF9500'; icon = <ShoppingCart size={17} color="#FF9500" />;
                        title = o.customer || 'הזמנת לקוח'; subtitle = o.date || '—';
                        footer = { label: 'העבר לספק', onClick: () => { closeDrill(); onForwardOrder(o); } };
                        body = (
                            <div className="space-y-5">
                                <DrillStat items={[
                                    { label: 'מוצר', value: o.product || '—', color: '#FF9500' },
                                    { label: 'כמות', value: o.qty || 1, color: '#007AFF' },
                                    { label: 'סכום', value: o.total ? money(o.total) : '—', color: '#34C759' },
                                ]} />
                            </div>
                        );
                    }
                } else if (current.type === 'pipeQuote') {
                    const q = pipelineQuotes.find(x => x.id === current.id);
                    if (!q) {
                        title = 'הזמנה מהצינור'; icon = <Link2 size={17} color="#0891B2" />;
                        body = <DrillEmpty icon={Link2} text="ההזמנה נמחקה או אינה זמינה" />;
                    } else {
                        accent = '#0891B2'; icon = <Link2 size={17} color="#0891B2" />;
                        title = q.customer || q.contactName || q.institution || 'הזמנה מהצינור'; subtitle = quoteItemsLabel(q);
                        footer = onGoToPipeline ? { label: 'מעבר להזמנות ספקים', onClick: () => { closeDrill(); onGoToPipeline(); } } : null;
                        body = (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <PipelineStatusPill status={q.status} />
                                    {q.total ? <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">{money(q.total)}</p> : null}
                                </div>
                                <DrillStat items={[
                                    { label: 'פריטים', value: (q.items || []).length, color: '#0891B2' },
                                    { label: 'סטטוס', value: (PIPELINE_STATUS[q.status] || {}).label || q.status || '—', color: '#7C3AED' },
                                    { label: 'סכום', value: q.total ? money(q.total) : '—', color: '#34C759' },
                                ]} />
                            </div>
                        );
                    }
                }

                return (
                    <DashDrillView open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={accent}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${current.type}:${current.id ?? current.scope ?? ''}:${drillStack.length}`}>
                        {body}
                    </DashDrillView>
                );
            })()}
        </div>
    );
}

// ── Supplier Orders Tab ───────────────────────────────────────────────────────

async function exportSupplierOrdersXLSX(supplierOrders, suppliers) {
    const XLSX = await import('xlsx'); // dynamic — keeps ~900KB out of the eager bundle
    const STATUS_HE = {
        pending: 'ממתין', forwarded: 'הועבר', confirmed: 'אושר',
        in_transit: 'בדרך', arrived: 'הגיע', shipped: 'נשלח',
    };
    const OPEN_STATUSES = new Set(['pending','forwarded','confirmed','in_transit']);
    const fmtDate = ts => {
        if (!ts) return '';
        const d = ts?.toDate ? ts.toDate() : new Date(typeof ts === 'number' ? ts : ts);
        return isNaN(d) ? '' : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };
    const n = v => ({ v: Number(v) || 0, t: 'n' });
    const str = v => ({ v: String(v ?? ''), t: 's' });
    const lnk = (text, url) => ({ v: String(text ?? ''), t: 's', l: { Target: url } });
    const SITE = 'https://getnextclass.com';
    const now = new Date();
    const dateStr = fmtDate(now.getTime());

    // helper: build a worksheet from a 2-D array (each cell may be a cell-object or plain value)
    const buildSheet = (data, colWidths) => {
        const normalized = data.map(row =>
            row.map(c => (c && typeof c === 'object' && 'v' in c) ? c : str(c ?? ''))
        );
        const ws = XLSX.utils.aoa_to_sheet(normalized);
        // re-apply link cells (aoa_to_sheet strips them)
        data.forEach((row, ri) => row.forEach((c, ci) => {
            if (c && typeof c === 'object' && c.l) {
                ws[XLSX.utils.encode_cell({ r: ri, c: ci })] = { ...c };
            }
        }));
        if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));
        return ws;
    };

    // ── Pre-compute per-supplier stats ──────────────────────────────────────
    const supStats = {};
    supplierOrders.forEach(o => {
        const key = o.supplierId || o.supplierName || '—';
        if (!supStats[key]) supStats[key] = { count: 0, total: 0, open: 0, name: o.supplierName || key };
        supStats[key].count++;
        supStats[key].total += Number(o.totalCost) || 0;
        if (OPEN_STATUSES.has(o.status)) supStats[key].open += Number(o.totalCost) || 0;
    });
    const grandTotal  = supplierOrders.reduce((s, o) => s + (Number(o.totalCost)||0), 0);
    const openTotal   = supplierOrders.filter(o => OPEN_STATUSES.has(o.status)).reduce((s,o) => s+(Number(o.totalCost)||0), 0);

    const wb = XLSX.utils.book_new();

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 1 — מעקב הזמנות (Master Tracker)
    // ════════════════════════════════════════════════════════════════════════
    const masterRows = [
        [`הזמנות ספקים — NextClass | ייצוא: ${dateStr} | ${supplierOrders.length} הזמנות | סה״כ: ₪${grandTotal.toLocaleString()}`],
        [],
        // Column headers
        ['PO מס׳','תאריך הזמנה','שם ספק','מוצר','קישור לקטלוג','שם לקוח','כמות','מחיר ליח׳ ₪','עלות כוללת ₪','מינימום ספק ₪','עמידה במינימום','סטטוס','ETA','מס׳ הפניה','תנאי תשלום','הערות'],
    ];

    const sortedOrders = [...supplierOrders].sort((a,b) =>
        (a.supplierName||'').localeCompare(b.supplierName||'')
    );

    let prevSupplier = null;
    sortedOrders.forEach(o => {
        const sup = suppliers.find(s => s.id === o.supplierId || s.name === o.supplierName);
        const minOrder = Number(sup?.minOrder) || 0;
        const cost = Number(o.totalCost) || 0;
        const unitPrice = o.qty ? cost / o.qty : cost;
        const meetsMin = minOrder > 0 ? (cost >= minOrder ? 'כן ✓' : `לא — חסר ₪${(minOrder - cost).toLocaleString()}`) : '—';

        // Supplier divider
        if (o.supplierName !== prevSupplier) {
            masterRows.push([`▶ ספק: ${o.supplierName || '—'}`]);
            prevSupplier = o.supplierName;
        }

        masterRows.push([
            str(o.id),
            str(fmtDate(o.createdAt)),
            str(o.supplierName || '—'),
            str(o.productTitle || '—'),
            lnk('פתח', `${SITE}/catalog/${o.customerOrderId||''}`),
            str(o.customerName || '—'),
            n(o.qty),
            n(unitPrice.toFixed(2)),
            n(cost),
            n(minOrder),
            str(meetsMin),
            str(STATUS_HE[o.status] || o.status || '—'),
            str(o.eta || '—'),
            str(o.supplierRef || '—'),
            str(sup?.paymentTerms || '—'),
            str(o.notes || ''),
        ]);
    });

    masterRows.push([]);
    masterRows.push(['', '', '', '', '', '', '', 'סה״כ פתוח ₪', n(openTotal), '', '', '', '', '', '', '']);
    masterRows.push(['', '', '', '', '', '', '', 'סה״כ כולל ₪', n(grandTotal), '', '', '', '', '', '', '']);

    const wsMaster = buildSheet(masterRows, [22,13,18,30,10,16,7,13,13,14,20,10,12,14,14,28]);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'מעקב הזמנות');

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 2 — ספקים (Vendor Database)
    // ════════════════════════════════════════════════════════════════════════
    const vendorRows = [
        [`בסיס ספקים — NextClass | ${suppliers.length} ספקים`],
        [],
        ['שם ספק','איש קשר','טלפון (WhatsApp)','אימייל','מ.ע.מ (ע.מ.)','מינימום הזמנה ₪','ימי אספקה','תנאי תשלום','מס׳ הזמנות','סה״כ הוזמן ₪','פתוח ₪'],
    ];
    suppliers.forEach(sup => {
        const stats = supStats[sup.id] || { count: 0, total: 0, open: 0 };
        vendorRows.push([
            str(sup.name || '—'),
            str(sup.contact || '—'),
            sup.phone ? lnk(sup.phone, `https://wa.me/972${sup.phone.replace(/\D/g,'').replace(/^0/,'')}`) : str('—'),
            sup.email ? lnk(sup.email, `mailto:${sup.email}`) : str('—'),
            str(sup.vatNumber || '—'),
            n(sup.minOrder ?? 0),
            str(sup.leadTimeDays ? `${sup.leadTimeDays} ימים` : '—'),
            str(sup.paymentTerms || '—'),
            n(stats.count),
            n(stats.total),
            n(stats.open),
        ]);
    });
    const wsVendors = buildSheet(vendorRows, [22,18,18,26,14,16,13,16,13,14,14]);
    XLSX.utils.book_append_sheet(wb, wsVendors, 'ספקים');

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 3 — סיכום (KPI Dashboard)
    // ════════════════════════════════════════════════════════════════════════
    const byStatus = {};
    STATUSES.forEach(s => { byStatus[s.id] = { count: 0, total: 0 }; });
    supplierOrders.forEach(o => {
        if (byStatus[o.status]) {
            byStatus[o.status].count++;
            byStatus[o.status].total += Number(o.totalCost) || 0;
        }
    });
    const belowMin = supplierOrders.filter(o => {
        const sup = suppliers.find(s => s.id === o.supplierId || s.name === o.supplierName);
        const min = Number(sup?.minOrder) || 0;
        return min > 0 && (Number(o.totalCost)||0) < min;
    });

    const kpiRows = [
        [`סיכום וKPIs — NextClass | ${dateStr}`],
        [],
        ['📊 מדדים כלליים', ''],
        ['סה״כ הזמנות', n(supplierOrders.length)],
        ['סה״כ עלות כוללת ₪', n(grandTotal)],
        ['עלות פתוחה (ממתין/בדרך) ₪', n(openTotal)],
        ['הזמנות מתחת למינימום ₪', n(belowMin.length)],
        [],
        ['📦 לפי סטטוס', 'מספר הזמנות', 'סה״כ ₪'],
        ...STATUSES.map(s => [str(s.label), n(byStatus[s.id]?.count||0), n(byStatus[s.id]?.total||0)]),
        [],
        ['🏭 לפי ספק', 'הזמנות', 'סה״כ ₪', 'פתוח ₪', 'מינימום ₪'],
        ...Object.entries(supStats).map(([, stat]) => {
            const sup = suppliers.find(s => s.name === stat.name);
            return [str(stat.name), n(stat.count), n(stat.total), n(stat.open), n(sup?.minOrder||0)];
        }),
        [],
        ['⚠️ הזמנות מתחת למינימום', 'ספק', 'מוצר', 'עלות ₪', 'מינימום ₪', 'חסר ₪'],
        ...belowMin.map(o => {
            const sup = suppliers.find(s => s.id === o.supplierId || s.name === o.supplierName);
            const min = Number(sup?.minOrder)||0;
            return [str(o.id), str(o.supplierName), str(o.productTitle), n(Number(o.totalCost)||0), n(min), n(min-(Number(o.totalCost)||0))];
        }),
    ];
    const wsKPI = buildSheet(kpiRows, [30,18,16,16,16,16]);
    XLSX.utils.book_append_sheet(wb, wsKPI, 'סיכום KPIs');

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 4 — לפי ספקים (Grouped view)
    // ════════════════════════════════════════════════════════════════════════
    const groupedRows = [`מבט לפי ספקים — NextClass | ${dateStr}`, []];
    const grouped = {};
    sortedOrders.forEach(o => {
        const k = o.supplierName || '—';
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(o);
    });
    Object.entries(grouped).forEach(([supplierName, orders]) => {
        const sup = suppliers.find(s => s.id === orders[0]?.supplierId || s.name === supplierName);
        const supTotal = orders.reduce((s,o) => s+(Number(o.totalCost)||0), 0);
        const minOrder = Number(sup?.minOrder)||0;

        groupedRows.push([`🏭 ${supplierName}`, '', '', '', '', '', '', '', '', '']);
        groupedRows.push([
            `איש קשר: ${sup?.contact||'—'}`,`טלפון: ${sup?.phone||'—'}`,
            `אימייל: ${sup?.email||'—'}`,`מינימום: ₪${minOrder||'—'}`,
            `תנאי: ${sup?.paymentTerms||'—'}`,`אספקה: ${sup?.leadTimeDays||'—'} ימים`,
            '','','','',
        ]);
        groupedRows.push(['PO מס׳','מוצר','לקוח','כמות','עלות ₪','עמידה מינימום','סטטוס','ETA','מס׳ הפניה','הערות']);

        orders.forEach(o => {
            const cost = Number(o.totalCost)||0;
            const meetsMin = minOrder > 0 ? (cost >= minOrder ? 'כן ✓' : `לא (-₪${(minOrder-cost).toLocaleString()})`) : '—';
            groupedRows.push([
                str(o.id), str(o.productTitle||'—'), str(o.customerName||'—'),
                n(o.qty), n(cost), str(meetsMin),
                str(STATUS_HE[o.status]||o.status||'—'),
                str(o.eta||'—'), str(o.supplierRef||'—'), str(o.notes||''),
            ]);
        });
        groupedRows.push(['','','','',`סה״כ ${supplierName}`, n(supTotal),'','','','']);
        groupedRows.push([]);
    });

    const wsGrouped = buildSheet(groupedRows.map(r => Array.isArray(r) ? r : [str(r)]),
        [22,28,16,7,13,20,10,12,14,26]);
    XLSX.utils.book_append_sheet(wb, wsGrouped, 'לפי ספקים');

    XLSX.writeFile(wb, `NextClass-הצעות-ספקים-${now.toISOString().slice(0,10)}.xlsx`);
}

// ── Pipeline Orders View (quotes → single source of truth) ────────────────────

function PipelineOrdersView({ quotes, updateQuoteStatus, showToast }) {
    const [advancingId, setAdvancingId] = useState(null);
    const [filter, setFilter] = useState('all');

    const counts = {
        all: quotes.length,
        'הועבר לספק': quotes.filter(q => q.status === 'הועבר לספק').length,
        'בדרך':        quotes.filter(q => q.status === 'בדרך').length,
        'סופק':        quotes.filter(q => q.status === 'סופק').length,
    };

    const displayed = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);

    const advance = async (quote) => {
        const meta = PIPELINE_STATUS[quote.status];
        if (!meta?.next) return;
        setAdvancingId(quote.id);
        try {
            // updateQuoteStatus is the ONE call that reaches 'סופק' → writes the sale
            // record + settles inventory. Never bypass it with a parallel flag.
            await updateQuoteStatus(quote.id, meta.next);
            showToast(
                meta.next === 'סופק'
                    ? 'סומן כסופק — מכירה ומלאי עודכנו אוטומטית'
                    : `סטטוס עודכן ל: ${meta.next}`,
                'success'
            );
        } catch {
            showToast('שגיאה בעדכון סטטוס', 'error');
        }
        setAdvancingId(null);
    };

    return (
        <div className="space-y-4">
            {/* Info banner — explains the bridge */}
            <div className="p-4 rounded-2xl text-right text-[12px] font-medium text-[#0891B2]"
                style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.14)' }} dir="rtl">
                הזמנות אלו מגיעות ישירות מצינור הצעות המחיר (הזמנות שהועברו לספק). קידום הסטטוס כאן מתעדכן חזרה בצינור — סימון "סופק" רושם את המכירה ומעדכן מלאי אוטומטית.
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-2 flex-wrap" dir="rtl">
                {['all', ...PIPELINE_ORDER].map(sid => {
                    const meta = PIPELINE_STATUS[sid];
                    const active = filter === sid;
                    return (
                        <button key={sid} onClick={() => setFilter(sid)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${active ? 'text-white' : 'text-[#86868B] border border-black/10 hover:border-[#0891B2]/30'}`}
                            style={active ? { background: meta ? meta.color : '#0891B2' } : { background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                            {meta ? meta.label : 'הכל'}
                            {counts[sid] > 0 && <span className="opacity-70">{counts[sid]}</span>}
                        </button>
                    );
                })}
            </div>

            {displayed.length === 0 ? (
                <div className="rounded-[24px] overflow-hidden" style={card}>
                    <AdminEmpty icon={<Package size={30} style={{ color: BROWN }} />}
                        title="אין הזמנות מהצינור בסטטוס זה"
                        subtitle="הזמנות שיועברו לספק ממסך ההזמנות/הצעות המחיר יופיעו כאן עם מעקב עד למסירה" />
                </div>
            ) : (
                <div className="space-y-2">
                    {displayed.map(q => {
                        const meta = PIPELINE_STATUS[q.status] || PIPELINE_STATUS['הועבר לספק'];
                        const so = q.supplierOrder || {};
                        const supplierName = so.supplierName || '—';
                        const tracking = q.trackingInfo?.trackingNumber || so.orderNumber || '';
                        const isAdvancing = advancingId === q.id;
                        return (
                            <motion.div key={q.id} layout
                                whileHover={{ y: -1, boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
                                className="rounded-[1.5rem] p-5 transition-all"
                                style={card} dir="rtl">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Actions column */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <PipelineStatusPill status={q.status} />
                                        {meta.next ? (
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => advance(q)} disabled={isAdvancing}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white cursor-pointer whitespace-nowrap transition-opacity"
                                                style={{ background: `linear-gradient(135deg, ${PIPELINE_STATUS[meta.next].color}, ${PIPELINE_STATUS[meta.next].color}BB)`, opacity: isAdvancing ? 0.7 : 1 }}>
                                                <ArrowRight size={11} />
                                                {isAdvancing ? 'מעדכן...' : meta.nextLabel}
                                            </motion.button>
                                        ) : (
                                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black"
                                                style={{ background: 'rgba(29,185,84,0.10)', color: '#1DB954' }}>
                                                <CheckCircle size={11} />
                                                הושלם
                                            </span>
                                        )}
                                    </div>

                                    {/* Info column */}
                                    <div className="flex-1 text-right min-w-0">
                                        <p className="font-black text-[#1D1D1F] text-[15px] mb-1">{q.institution || q.contactName || '—'}</p>
                                        <div className="flex items-center gap-3 justify-end flex-wrap">
                                            {q.contactName && q.institution && (
                                                <span className="text-[11px] text-[#86868B] flex items-center gap-1"><User size={10} />{q.contactName}</span>
                                            )}
                                            <span className="text-[11px] text-[#86868B] flex items-center gap-1"><ShoppingCart size={10} />{quoteItemsLabel(q)}</span>
                                            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: '#0891B2' }}><Factory size={10} />{supplierName}</span>
                                        </div>
                                        {tracking && (
                                            <p className="text-[10px] text-[#0891B2] font-bold mt-1.5 flex items-center gap-1 justify-end">
                                                <Hash size={9} />
                                                {tracking}
                                            </p>
                                        )}
                                        {so.estimatedDelivery && (
                                            <p className="text-[11px] text-[#86868B] mt-1 flex items-center gap-1 justify-end"><Clock size={10} />אספקה: {so.estimatedDelivery}</p>
                                        )}
                                        {so.notes && (
                                            <p className="text-[11px] text-[#86868B] mt-1.5 rounded-xl px-3 py-1.5 text-right" style={{ background: 'rgba(0,0,0,0.03)' }}>{so.notes}</p>
                                        )}
                                        <p className="text-[10px] text-[#0891B2]/60 mt-2 text-right flex items-center gap-1 justify-end">
                                            <Link2 size={9} />
                                            מקושר להצעת מחיר {q.id}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function SupplierOrdersTab({ supplierOrders, customerOrders, suppliers, showToast, selectedOrder, onSelectOrder, pipelineQuotes, updateQuoteStatus }) {
    const confirm = useAdminConfirm();
    const [view, setView] = useState('pipeline'); // 'pipeline' (quotes) | 'manual' (supplier_orders)
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForwardModal, setShowForwardModal] = useState(false);

    const forwardedIds = new Set(supplierOrders.map(so => so.customerOrderId));
    const unforwarded  = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedIds.has(o.id));

    const displayed = filterStatus === 'all'
        ? supplierOrders
        : supplierOrders.filter(o => o.status === filterStatus);

    const setStatus = useCallback(async (id, status, e) => {
        e?.stopPropagation();
        try {
            await updateDoc(doc(db, 'supplier_orders', id), { status, [`${status}At`]: serverTimestamp() });
            showToast('סטטוס עודכן', 'success');
        } catch { showToast('שגיאה', 'error'); }
    }, [showToast]);

    const deleteOrder = useCallback(async (id, e) => {
        e?.stopPropagation();
        if (!await confirm({ message: 'למחוק הזמנת ספק זו?', danger: true })) return;
        try {
            await deleteDoc(doc(db, 'supplier_orders', id));
            showToast('נמחקה', 'success');
        } catch { showToast('שגיאה', 'error'); }
    }, [showToast, confirm]);

    return (
        <div className="space-y-4">
            {/* Source toggle — pipeline (quotes, single source of truth) vs manual supplier_orders */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl w-fit" style={{ ...GLASS.frosted, borderRadius: RADIUS.panel }} dir="rtl">
                {[
                    { id: 'pipeline', label: 'הזמנות מהצינור', Icon: Link2, count: pipelineQuotes.length, color: '#0891B2' },
                    { id: 'manual',   label: 'הזמנות ידניות',  Icon: Package, count: supplierOrders.length, color: BROWN },
                ].map(t => {
                    const active = view === t.id;
                    return (
                        <motion.button key={t.id} onClick={() => setView(t.id)} whileTap={TAP}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-colors cursor-pointer"
                            style={active
                                ? { color: t.color, background: hexA(t.color, 0.12), border: `1px solid ${hexA(t.color, 0.24)}`, boxShadow: `0 2px 10px ${hexA(t.color, 0.2)}` }
                                : { color: '#86868B', border: '1px solid transparent' }}>
                            <t.Icon size={14} />
                            {t.label}
                            {t.count > 0 && (
                                <span className="min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                                    style={{ background: active ? t.color : '#AEAEB2' }}>
                                    {t.count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {view === 'pipeline' && (
                <PipelineOrdersView quotes={pipelineQuotes} updateQuoteStatus={updateQuoteStatus} showToast={showToast} />
            )}

            {view === 'manual' && (<>
            {/* Action bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap" dir="rtl">
                <div className="flex items-center gap-2 flex-wrap">
                    {['all', ...STATUSES.map(s => s.id)].map(sid => {
                        const s = STATUSES.find(x => x.id === sid);
                        const count = sid === 'all' ? supplierOrders.length : supplierOrders.filter(o => o.status === sid).length;
                        return (
                            <button key={sid} onClick={() => setFilterStatus(sid)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${filterStatus === sid ? 'text-white' : 'text-[#86868B] border border-black/10 hover:border-[#007AFF]/30'}`}
                                style={filterStatus === sid ? { background: s ? s.color : '#007AFF' } : { background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                                {s ? s.label : 'הכל'}
                                {count > 0 && <span className="opacity-70">{count}</span>}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => { exportSupplierOrdersXLSX(supplierOrders, suppliers); showToast('קובץ Excel הורד בהצלחה', 'success'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold cursor-pointer transition-all"
                        style={{ background: 'rgba(52,199,89,0.10)', color: '#34C759', border: '1px solid rgba(52,199,89,0.25)' }}
                        title="ייצוא לאקסל (CSV)">
                        <Download size={14} />
                        ייצוא Excel
                    </motion.button>
                    {unforwarded.length > 0 && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForwardModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black text-white cursor-pointer"
                            style={{ background: 'linear-gradient(135deg,#FF9500,#FF6B00)', boxShadow: '0 4px 16px rgba(255,149,0,0.3)' }}>
                            <Send size={14} />
                            העבר לספק ({unforwarded.length})
                        </motion.button>
                    )}
                </div>
            </div>

            {/* List */}
            {displayed.length === 0 ? (
                <div className="rounded-[24px] overflow-hidden" style={card}>
                    <AdminEmpty icon={<Package size={30} style={{ color: BROWN }} />}
                        title="אין הזמנות בסטטוס זה"
                        subtitle="הזמנות ספקים שתעביר יופיעו כאן עם מעקב מלא עד למסירה" />
                </div>
            ) : (
                <div className="space-y-2">
                    {displayed.map(o => {
                        const currentStatus = STATUSES.find(s => s.id === o.status) || STATUSES[0];
                        const nextId = NEXT_STATUS[o.status];
                        const nextLabel = STATUSES.find(s => s.id === nextId)?.label;
                        const isSelected = selectedOrder?.id === o.id;

                        return (
                            <motion.div key={o.id} layout
                                onClick={() => onSelectOrder(o)}
                                whileHover={{ y: -1, boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
                                className="rounded-[1.5rem] p-5 cursor-pointer transition-all"
                                style={{ ...card, border: isSelected ? '1.5px solid rgba(0,122,255,0.35)' : card.border }}
                                dir="rtl">
                                <div className="flex items-start justify-between gap-4">
                                    {/* Actions column */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <select value={o.status} onChange={e => setStatus(o.id, e.target.value, e)}
                                                className="appearance-none pr-3 pl-7 py-1.5 rounded-xl text-[11px] font-black cursor-pointer focus:outline-none border-0"
                                                style={{ background: currentStatus.bg, color: currentStatus.color }}>
                                                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                            </select>
                                            <ChevronDown size={10} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: currentStatus.color }} />
                                        </div>
                                        {nextId && (
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={e => { e.stopPropagation(); setStatus(o.id, nextId, e); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white cursor-pointer whitespace-nowrap"
                                                style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>
                                                <ArrowRight size={11} />
                                                {nextLabel}
                                            </motion.button>
                                        )}
                                        <button onClick={e => deleteOrder(o.id, e)}
                                            className="p-1.5 rounded-xl hover:bg-[#FF3B30]/10 text-[#FF3B30]/30 hover:text-[#FF3B30] transition-all cursor-pointer">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    {/* Info column */}
                                    <div className="flex-1 text-right min-w-0">
                                        <p className="font-black text-[#1D1D1F] text-[15px] mb-1">{o.productTitle} × {o.qty}</p>
                                        <div className="flex items-center gap-3 justify-end flex-wrap">
                                            <span className="text-[11px] text-[#86868B] flex items-center gap-1"><User size={10} />{o.customerName}</span>
                                            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: '#5856D6' }}><Factory size={10} />{o.supplierName || '—'}</span>
                                            {o.totalCost > 0 && <span className="text-[11px] text-[#86868B] flex items-center gap-1"><DollarSign size={10} />₪{o.totalCost}</span>}
                                            {o.eta && <span className="text-[11px] text-[#86868B] flex items-center gap-1"><Clock size={10} />{o.eta}</span>}
                                        </div>
                                        {o.trackingNumber && (
                                            <p className="text-[10px] text-[#007AFF] font-bold mt-1.5 flex items-center gap-1 justify-end">
                                                <Hash size={9} />
                                                {o.trackingNumber}
                                            </p>
                                        )}
                                        {o.notes && (
                                            <p className="text-[11px] text-[#86868B] mt-1.5 rounded-xl px-3 py-1.5 text-right" style={{ background: 'rgba(0,0,0,0.03)' }}>{o.notes}</p>
                                        )}
                                        <p className="text-[10px] text-[#007AFF]/50 mt-2 text-right">לחץ לפרטים מלאים ←</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <ForwardModal
                isOpen={showForwardModal}
                onClose={() => setShowForwardModal(false)}
                orders={unforwarded}
                suppliers={suppliers}
                showToast={showToast}
            />
            </>)}
        </div>
    );
}

// ── Forward Modal ─────────────────────────────────────────────────────────────

function ForwardModal({ isOpen, onClose, orders, suppliers, showToast, preselectedOrder }) {
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [supplierId, setSupplierId]   = useState('');
    const [eta, setEta]                 = useState('');
    const [notes, setNotes]             = useState('');
    const [cost, setCost]               = useState('');
    const [loading, setLoading]         = useState(false);
    // #1 Success state with notification buttons
    const [successData, setSuccessData] = useState(null); // { order, supplier, docId }

    useEffect(() => {
        if (isOpen) {
            setSelectedOrderId(preselectedOrder?.id || orders[0]?.id || '');
            setSupplierId(suppliers[0]?.id || '');
            setEta(''); setNotes(''); setCost('');
            setSuccessData(null);
        }
    }, [isOpen, orders, suppliers, preselectedOrder]);

    const handleSubmit = async () => {
        if (!selectedOrderId || !supplierId) { showToast('יש לבחור הזמנה וספק', 'error'); return; }
        setLoading(true);
        const order    = orders.find(o => o.id === selectedOrderId);
        const supplier = suppliers.find(s => s.id === supplierId);
        try {
            const docRef = await addDoc(collection(db, 'supplier_orders'), {
                customerOrderId: order.id,
                customerName:    order.customer || '',
                productTitle:    order.product  || '',
                qty:             order.qty  || 1,
                supplierId,
                supplierName:    supplier?.name || '',
                status:          'forwarded',
                eta, notes,
                totalCost:       parseFloat(cost) || 0,
                sentAt:          serverTimestamp(),
                createdAt:       serverTimestamp(),
                // #9 Timeline: first event
                timeline: [{ action: 'הזמנה נוצרה', timestamp: Date.now(), by: 'admin' }],
            });
            setSuccessData({ order, supplier, docId: docRef.id });
            showToast('הועבר לספק בהצלחה', 'success');
        } catch { showToast('שגיאה', 'error'); }
        setLoading(false);
    };

    // #1 Build WA/email notification content
    const buildSupplierWa = (sd) => {
        if (!sd?.supplier?.phone) return null;
        const { order, supplier } = sd;
        const supplierPhone = (supplier.phone || '').replace(/\D/g,'').replace(/^0/,'');
        const waText = `הזמנת רכש — NextClass\n\nשלום ${supplier.name},\n\nמצורפת הזמנת רכש:\nמוצר: ${order.product}\nכמות: ${order.qty}\nעלות מוסכמת: ₪${cost}\nETA: ${eta || '—'}\n\nנא לאשר קבלת ההזמנה.`;
        return `https://wa.me/972${supplierPhone}?text=${encodeURIComponent(waText)}`;
    };

    const buildSupplierEmail = (sd) => {
        if (!sd?.supplier?.email || !sd?.order) return null;
        const { order, supplier, docId } = sd;
        const emailBody = `שלום ${supplier.name},\n\nמצורפת הזמנת רכש מ-NextClass:\n\nמוצר: ${order.product}\nכמות: ${order.qty}\nעלות מוסכמת: ₪${cost}\nETA: ${eta || '—'}\n\nהערות: ${notes || '—'}\n\nנא לאשר קבלת ההזמנה.\n\nבברכה,\nNextClass`;
        return `mailto:${supplier.email}?subject=${encodeURIComponent(`הזמנת רכש - ${docId || order.id}`)}&body=${encodeURIComponent(emailBody)}`;
    };

    return (
        <AdminModal open={isOpen} onClose={() => { setSuccessData(null); onClose(); }} title="העברה לספק" size="md">
            <div className="space-y-5 p-6" dir="rtl">
                {successData ? (
                    /* #1 Success state */
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 20, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CheckCircle size={28} style={{ color: '#34C759' }} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1F', marginBottom: 6 }}>הועבר לספק בהצלחה!</h3>
                        <p style={{ fontSize: 13, color: '#86868B', marginBottom: 24 }}>עכשיו שלח עדכון מהיר לספק:</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* WhatsApp supplier button */}
                            {buildSupplierWa(successData) && (
                                <a href={buildSupplierWa(successData)} target="_blank" rel="noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 20px', borderRadius: 16, background: 'linear-gradient(135deg,#25D366,#1DA851)', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
                                    <MessageSquare size={17} />
                                    שלח WhatsApp לספק
                                </a>
                            )}
                            {/* Email supplier button */}
                            {buildSupplierEmail(successData) && (
                                <a href={buildSupplierEmail(successData)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 20px', borderRadius: 16, background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 14, fontWeight: 800, textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
                                    <Mail size={17} />
                                    שלח מייל לספק
                                </a>
                            )}
                            {/* #2 Generate PO button */}
                            <button onClick={() => {
                                const fakeOrder = { ...successData.order, id: successData.docId, productTitle: successData.order.product, totalCost: parseFloat(cost) || 0, eta, notes, qty: successData.order.qty };
                                generatePO(fakeOrder, {}, successData.supplier);
                            }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 20px', borderRadius: 16, background: 'rgba(0,122,255,0.07)', color: '#007AFF', fontSize: 14, fontWeight: 800, border: '1px solid rgba(0,122,255,0.18)', cursor: 'pointer' }}>
                                <Printer size={17} />
                                הפק הזמנת רכש (PO)
                            </button>
                        </div>

                        <button onClick={() => { setSuccessData(null); onClose(); }}
                            style={{ marginTop: 18, display: 'block', width: '100%', padding: '11px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.10)', background: 'transparent', color: '#86868B', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            סגור
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[#86868B] tracking-widest block">הזמנת לקוח</label>
                            <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
                                className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right">
                                {orders.map(o => (
                                    <option key={o.id} value={o.id}>{o.customer} — {o.product} × {o.qty}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[#86868B] tracking-widest block">ספק</label>
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                                className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right">
                                <option value="">בחר ספק...</option>
                                {suppliers.filter(s => s.active !== false).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.leadTimeDays || '?'} ימים)</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[#86868B] tracking-widest block">עלות ספק (₪)</label>
                                <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
                                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-[#86868B] tracking-widest block">תאריך ETA</label>
                                <input type="date" value={eta} onChange={e => setEta(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[#86868B] tracking-widest block">הערות לספק</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="כתובת משלוח, דגם ספציפי, הוראות מיוחדות..."
                                rows={3}
                                className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 resize-none text-right" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-[#007AFF]/[0.04] transition-all cursor-pointer">
                                ביטול
                            </button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
                                className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
                                <Send size={15} />
                                {loading ? 'שולח...' : 'שלח לספק'}
                            </motion.button>
                        </div>
                    </>
                )}
            </div>
        </AdminModal>
    );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────

const BLANK_SUPPLIER = { name: '', contact: '', phone: '', email: '', leadTimeDays: 7, paymentTerms: 'שוטף + 30', notes: '', active: true };

function calcReliability(supplierId, supplierName, supplierOrders) {
    const myOrders = supplierOrders.filter(o =>
        o.supplierId === supplierId || o.supplierName === supplierName
    );
    if (myOrders.length === 0) return null;

    const completed  = myOrders.filter(o => ['arrived','shipped'].includes(o.status));
    const fulfillRate = completed.length > 0 ? Math.round(completed.length / myOrders.length * 100) : 0;

    // On-time rate: only calculable when actualDelivery + eta are both set
    const withDeliveryData = completed.filter(o => o.eta && o.actualDelivery);
    const onTime = withDeliveryData.filter(o => new Date(o.actualDelivery) <= new Date(o.eta));
    const onTimeRate = withDeliveryData.length > 0
        ? Math.round(onTime.length / withDeliveryData.length * 100)
        : null; // unknown — don't penalise or inflate

    // Score: if we have on-time data use weighted; otherwise fulfillment-only
    const score = onTimeRate !== null
        ? Math.round(fulfillRate * 0.6 + onTimeRate * 0.4)
        : fulfillRate;

    // Need at least 2 orders for a meaningful score
    if (myOrders.length < 2) return null;

    const color = score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF3B30';
    const label = score >= 80 ? 'אמין' : score >= 60 ? 'ממוצע' : 'בעייתי';
    return { score, color, label, fulfillRate, onTimeRate, total: myOrders.length };
}

function SuppliersTab({ suppliers, supplierOrders = [], showToast }) {
    const confirm = useAdminConfirm();
    const [showForm, setShowForm] = useState(false);
    const [editId,   setEditId]   = useState(null);
    const [form,     setForm]     = useState(BLANK_SUPPLIER);
    const [loading,  setLoading]  = useState(false);

    const openAdd  = () => { setForm(BLANK_SUPPLIER); setEditId(null); setShowForm(true); };
    const openEdit = (s) => {
        setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '',
            leadTimeDays: s.leadTimeDays || 7, paymentTerms: s.paymentTerms || '', notes: s.notes || '', active: s.active !== false });
        setEditId(s.id); setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast('שם ספק חובה', 'error'); return; }
        setLoading(true);
        try {
            if (editId) { await updateDoc(doc(db, 'suppliers', editId), { ...form }); }
            else { await addDoc(collection(db, 'suppliers'), { ...form, createdAt: serverTimestamp() }); }
            showToast(editId ? 'ספק עודכן' : 'ספק נוסף', 'success');
            setShowForm(false);
        } catch { showToast('שגיאה בשמירה', 'error'); }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!await confirm({ message: 'למחוק ספק זה?', danger: true })) return;
        try { await deleteDoc(doc(db, 'suppliers', id)); showToast('ספק נמחק', 'success'); }
        catch { showToast('שגיאה', 'error'); }
    };

    const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="space-y-4">
            <div className="flex justify-end" dir="rtl">
                <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
                    <Plus size={15} />
                    הוסף ספק
                </motion.button>
            </div>

            {suppliers.length === 0 ? (
                <div className="rounded-[24px] overflow-hidden" style={card}>
                    <AdminEmpty icon={<Building2 size={30} style={{ color: BROWN }} />}
                        title="לא הוגדרו ספקים עדיין"
                        subtitle="הוסף ספק ראשון כדי להתחיל להעביר הזמנות ולעקוב אחר אמינות"
                        action={{ label: 'הוסף ספק', onClick: openAdd }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map(s => (
                        <motion.div key={s.id} layout className="p-5 rounded-[1.5rem] text-right" style={card}>
                            {/* Reliability score badge */}
                            {(() => {
                                const rel = calcReliability(s.id, s.name, supplierOrders);
                                if (!rel) return null;
                                return (
                                    <div className="flex items-center justify-end gap-1.5 mb-2">
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#86868B' }}>{rel.total} הזמנות</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: `${rel.color}12`, border: `1px solid ${rel.color}28` }}>
                                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={rel.color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            <span style={{ fontSize: 10, fontWeight: 900, color: rel.color }}>{rel.score} — {rel.label}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(s)}
                                        className="p-2 rounded-xl hover:bg-[#007AFF]/10 text-[#007AFF]/40 hover:text-[#007AFF] transition-all cursor-pointer">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)}
                                        className="p-2 rounded-xl hover:bg-[#FF3B30]/10 text-[#FF3B30]/40 hover:text-[#FF3B30] transition-all cursor-pointer">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 justify-end mb-1">
                                        <span className={`w-2 h-2 rounded-full ${s.active !== false ? 'bg-[#34C759]' : 'bg-gray-300'}`} />
                                        <h4 className="font-black text-[#1D1D1F] text-base">{s.name}</h4>
                                    </div>
                                    {s.contact && <p className="text-[12px] text-[#86868B]">{s.contact}</p>}
                                </div>
                            </div>
                            {/* #8 Average rating display */}
                            {(s.ratings || []).length > 0 && (() => {
                                const avgAll = (s.ratings || []).map(r => r.avg || 0);
                                const avg    = avgAll.length ? (avgAll.reduce((a, b) => a + b, 0) / avgAll.length).toFixed(1) : null;
                                return avg ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B' }}>{s.ratings.length} דירוגים</span>
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            {[1,2,3,4,5].map(n => (
                                                <Star key={n} size={12} style={{ color: n <= Math.round(parseFloat(avg)) ? '#FF9500' : '#E5E5EA' }} fill={n <= Math.round(parseFloat(avg)) ? '#FF9500' : 'none'} />
                                            ))}
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: '#FF9500' }}>{avg}</span>
                                    </div>
                                ) : null;
                            })()}
                            <div className="grid grid-cols-2 gap-2 text-right">
                                {s.phone && (
                                    <a href={`tel:${s.phone}`} className="flex items-center gap-1.5 justify-end text-[11px] text-[#34C759] hover:underline">
                                        <span>{s.phone}</span><Phone size={10} />
                                    </a>
                                )}
                                {s.email && (
                                    <a href={`mailto:${s.email}`} className="flex items-center gap-1.5 justify-end text-[11px] text-[#007AFF] hover:underline">
                                        <span className="truncate">{s.email}</span><Mail size={10} />
                                    </a>
                                )}
                                <div className="flex items-center gap-1.5 justify-end text-[11px]">
                                    <span className="font-bold text-[#007AFF]">{s.leadTimeDays || '?'} ימי אספקה</span>
                                    <Clock size={10} className="text-[#007AFF]" />
                                </div>
                                {s.paymentTerms && <div className="text-[11px] text-[#86868B]">{s.paymentTerms}</div>}
                            </div>
                            {s.notes && <p className="text-[11px] text-[#86868B] mt-2 rounded-xl px-3 py-2" style={{ background: 'rgba(0,0,0,0.03)' }}>{s.notes}</p>}
                        </motion.div>
                    ))}
                </div>
            )}

            <AdminModal open={showForm} onClose={() => setShowForm(false)} title={editId ? 'עריכת ספק' : 'הוספת ספק'} size="md">
                <div className="p-6 space-y-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><AdminInput label="שם הספק *" value={form.name} onChange={v => f('name', v)} /></div>
                        <AdminInput label="איש קשר" value={form.contact} onChange={v => f('contact', v)} />
                        <AdminInput label="טלפון" value={form.phone} onChange={v => f('phone', v)} />
                        <AdminInput label="אימייל" value={form.email} onChange={v => f('email', v)} />
                        <AdminInput label="ימי אספקה ממוצעים" value={String(form.leadTimeDays)} onChange={v => f('leadTimeDays', parseInt(v) || 7)} />
                        <div className="col-span-2"><AdminInput label="תנאי תשלום" value={form.paymentTerms} onChange={v => f('paymentTerms', v)} /></div>
                        <div className="col-span-2"><AdminTextArea label="הערות" value={form.notes} onChange={v => f('notes', v)} rows={2} /></div>
                        <div className="col-span-2"><AdminToggle label="ספק פעיל" value={form.active} onChange={v => f('active', v)} /></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-[#007AFF]/[0.04] transition-all cursor-pointer">
                            ביטול
                        </button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={loading}
                            className="flex-1 py-3 rounded-2xl text-sm font-black text-white cursor-pointer"
                            style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 4px 16px rgba(0,122,255,0.2)' }}>
                            {loading ? 'שומר...' : editId ? 'עדכן ספק' : 'הוסף ספק'}
                        </motion.button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}

// ── Product Mapping Tab ───────────────────────────────────────────────────────

function ProductMappingTab({ suppliers, showToast }) {
    const [products, setProducts] = useState([]);
    const [edits,    setEdits]    = useState({});
    const [saving,   setSaving]   = useState(null);

    useEffect(() => {
        return onSnapshot(query(collection(db, 'products'), orderBy('title')), snap => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); setProducts([]); showToast('שגיאה בטעינת מוצרים', 'error'); });
    }, []);

    const setField  = (pid, key, val) => setEdits(p => ({ ...p, [pid]: { ...(p[pid] || {}), [key]: val } }));
    const getVal    = (p, key) => edits[p.id]?.[key] ?? p[key] ?? '';

    const saveProduct = async (pid) => {
        const changes = edits[pid];
        if (!changes) return;
        setSaving(pid);
        try {
            await updateDoc(doc(db, 'products', pid), changes);
            showToast('מוצר עודכן', 'success');
            setEdits(p => { const n = { ...p }; delete n[pid]; return n; });
        } catch { showToast('שגיאה', 'error'); }
        setSaving(null);
    };

    return (
        <div className="space-y-3">
            <div className="p-4 rounded-2xl text-right text-[12px] font-medium text-[#007AFF]"
                style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.12)' }} dir="rtl">
                מיפוי ספקים לכל מוצר — קובע מאין מגיע המוצר ומה זמן האספקה ללקוח.
            </div>
            {products.length === 0 ? (
                <div className="py-16 text-center rounded-[2rem]" style={card}>
                    <Package size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[#86868B] font-bold">טוען מוצרים...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map(p => {
                        const ftId    = getVal(p, 'fulfillmentType') || 'supplier';
                        const ft      = FULFILLMENT_TYPES.find(t => t.id === ftId) || FULFILLMENT_TYPES[0];
                        const isDirty = !!edits[p.id];
                        return (
                            <motion.div key={p.id} layout
                                className="rounded-[1.5rem] p-4 transition-all"
                                style={{ ...card, borderColor: isDirty ? 'rgba(0,122,255,0.3)' : undefined }}>
                                <div className="flex items-center gap-4 flex-wrap" dir="rtl">
                                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                        {p.image && <img src={p.image} alt={p.title} onError={e => { e.target.style.display = 'none'; }} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />}
                                        <div className="text-right min-w-0">
                                            <p className="text-sm font-black text-[#1D1D1F] truncate">{p.title}</p>
                                            <p className="text-[10px] text-[#86868B]">{p.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {FULFILLMENT_TYPES.map(t => (
                                            <button key={t.id} onClick={() => setField(p.id, 'fulfillmentType', t.id)}
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${ftId === t.id ? 'text-white' : 'text-[#86868B] hover:bg-[#007AFF]/[0.06]'}`}
                                                style={ftId === t.id ? { background: t.color } : { background: 'rgba(0,0,0,0.03)' }}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    {ftId === 'supplier' && (
                                        <select value={getVal(p, 'supplierId') || ''} onChange={e => {
                                            const s = suppliers.find(s => s.id === e.target.value);
                                            setField(p.id, 'supplierId', e.target.value);
                                            if (s) setField(p.id, 'supplierName', s.name);
                                        }}
                                            className="px-3 py-2 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right">
                                            <option value="">בחר ספק...</option>
                                            {suppliers.filter(s => s.active !== false).map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <input type="number" value={getVal(p, 'leadTimeDays') || ''} onChange={e => setField(p.id, 'leadTimeDays', parseInt(e.target.value) || 0)}
                                            placeholder="ימים" className="w-16 px-2 py-2 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[11px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                                        <span className="text-[10px] text-[#86868B] shrink-0">ימים</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <input type="number" value={getVal(p, 'supplierCost') || ''} onChange={e => setField(p.id, 'supplierCost', parseFloat(e.target.value) || 0)}
                                            placeholder="עלות ₪" className="w-20 px-2 py-2 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[11px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                                        <span className="text-[10px] text-[#86868B] shrink-0">₪</span>
                                    </div>
                                    {isDirty && (
                                        <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            whileTap={{ scale: 0.97 }} onClick={() => saveProduct(p.id)} disabled={saving === p.id}
                                            className="px-3 py-2 rounded-xl text-[11px] font-black text-white cursor-pointer shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#34C759,#2DB84B)' }}>
                                            {saving === p.id ? '...' : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} />שמור</span>}
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminFulfillment() {
    const [activeTab,      setActiveTab]      = useState('dashboard');
    const [suppliers,      setSuppliers]      = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [selectedOrder,  setSelectedOrder]  = useState(null);
    const [forwardOrder,   setForwardOrder]   = useState(null); // customer order pending forward
    const { showToast } = useAdminToast();
    // Quotes pipeline = SINGLE source of truth for fulfillment (bridge for H4).
    const { quotes, updateQuoteStatus } = useAdminData();
    const pipelineQuotes = quotes.filter(isPipelineQuote);
    const pipelineActive = pipelineQuotes.filter(q => q.status === 'הועבר לספק' || q.status === 'בדרך').length;

    useEffect(() => {
        const u1 = onSnapshot(query(collection(db, 'suppliers'), orderBy('name')), snap => {
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); setSuppliers([]); showToast('שגיאה בטעינת ספקים', 'error'); });
        const u2 = onSnapshot(query(collection(db, 'supplier_orders'), orderBy('createdAt', 'desc')), snap => {
            setSupplierOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); setSupplierOrders([]); showToast('שגיאה בטעינת הזמנות ספקים', 'error'); });
        const u3 = onSnapshot(query(collection(db, 'orders'), orderBy('dateTs', 'desc')), snap => {
            setCustomerOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, err => { console.error(err); setCustomerOrders([]); showToast('שגיאה בטעינת הזמנות', 'error'); });
        return () => { u1(); u2(); u3(); };
    }, []);

    const pendingCount   = supplierOrders.filter(o => o.status === 'pending').length;
    const forwardedIds   = new Set(supplierOrders.map(o => o.customerOrderId));
    const needsForwarding = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedIds.has(o.id)).length;

    // When a customer order is clicked in dashboard → open forward modal pre-filled
    const handleForwardOrder = (customerOrder) => {
        setForwardOrder(customerOrder);
    };

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ניהול ספקים ואספקה"
                subtitle="מודל Drop-Ship — מקבלים הזמנה, מעבירים לספק, עוקבים עד מסירה"
                action={
                    needsForwarding > 0 ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black"
                            style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500' }}>
                            <AlertTriangle size={14} />
                            {needsForwarding} ממתינות להעברה
                        </motion.div>
                    ) : null
                }
            />

            {/* Tab Bar */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl w-fit" style={{ ...GLASS.frosted, borderRadius: RADIUS.panel }}>
                {TABS.map(tab => {
                    const active = activeTab === tab.id;
                    return (
                        <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)} whileTap={TAP}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-colors cursor-pointer"
                            style={active
                                ? { color: BROWN, background: hexA(BROWN, 0.12), border: `1px solid ${hexA(BROWN, 0.24)}`, boxShadow: `0 2px 10px ${hexA(BROWN, 0.2)}` }
                                : { color: '#86868B', border: '1px solid transparent' }}>
                            <tab.Icon size={14} />
                            {tab.label}
                            {tab.id === 'orders' && (pendingCount + pipelineActive) > 0 && (
                                <span className="min-w-4 h-4 px-1 rounded-full bg-[#FF9500] text-white text-[9px] font-black flex items-center justify-center">
                                    {pendingCount + pipelineActive}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    {activeTab === 'dashboard' && (
                        <DashboardTab
                            supplierOrders={supplierOrders}
                            customerOrders={customerOrders}
                            suppliers={suppliers}
                            onSelectOrder={setSelectedOrder}
                            onForwardOrder={handleForwardOrder}
                            pipelineQuotes={pipelineQuotes}
                            onGoToPipeline={() => setActiveTab('orders')}
                        />
                    )}
                    {activeTab === 'orders' && (
                        <SupplierOrdersTab
                            supplierOrders={supplierOrders}
                            customerOrders={customerOrders}
                            suppliers={suppliers}
                            showToast={showToast}
                            selectedOrder={selectedOrder}
                            onSelectOrder={setSelectedOrder}
                            pipelineQuotes={pipelineQuotes}
                            updateQuoteStatus={updateQuoteStatus}
                        />
                    )}
                    {activeTab === 'ocr'       && <AdminOCR embedded />}
                    {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} supplierOrders={supplierOrders} showToast={showToast} />}
                    {activeTab === 'mapping'   && <ProductMappingTab suppliers={suppliers} showToast={showToast} />}
                </motion.div>
            </AnimatePresence>

            {/* Order Detail Drawer (global — accessible from any tab) */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailDrawer
                        key={selectedOrder.id}
                        order={selectedOrder}
                        customerOrders={customerOrders}
                        suppliers={suppliers}
                        onClose={() => setSelectedOrder(null)}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>

            {/* Forward Modal — triggered from dashboard */}
            {forwardOrder && (
                <ForwardModal
                    isOpen={!!forwardOrder}
                    onClose={() => setForwardOrder(null)}
                    orders={customerOrders.filter(o => {
                        const ids = new Set(supplierOrders.map(so => so.customerOrderId));
                        return o.status !== 'בוטל' && !ids.has(o.id);
                    })}
                    suppliers={suppliers}
                    showToast={showToast}
                    preselectedOrder={forwardOrder}
                />
            )}
        </div>
    );
}
