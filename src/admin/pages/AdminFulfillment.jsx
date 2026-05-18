/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, addDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import {
    AdminSectionHeader, AdminInput, AdminTextArea,
    AdminToggle, AdminModal
} from '../components/AdminComponents';
import {
    Truck, Package, Building2, Link2, Plus, Trash2, Edit2,
    Clock, CheckCircle, AlertTriangle, Send, X, Phone,
    Mail, TrendingUp, ChevronDown, ArrowRight, Factory, Box,
    Timer, MapPin, Hash, FileText, User, ShoppingCart,
    Copy, Check, Tag, ExternalLink
} from 'lucide-react';

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

const TABS = [
    { id: 'dashboard', label: 'דשבורד',        Icon: TrendingUp },
    { id: 'orders',    label: 'הזמנות ספקים',  Icon: Package },
    { id: 'suppliers', label: 'ספקים',          Icon: Building2 },
    { id: 'mapping',   label: 'מיפוי מוצרים',   Icon: Link2 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const card = { background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' };

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
            {action && <div className="shrink-0">{action}</div>}
            <span className="text-sm text-[#1D1D1F] font-medium flex-1 text-right break-all">{value}</span>
            <span className="text-[10px] font-black text-[#AEAEB2] tracking-wider shrink-0 w-24 text-left">{label}</span>
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

function OrderDetailDrawer({ order, customerOrders, suppliers, onClose, showToast }) {
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [copied, setCopied] = useState(null);

    const customerOrder = customerOrders.find(o => o.id === order.customerOrderId) || {};
    const supplier = suppliers.find(s => s.id === order.supplierId);

    const f = (key, val) => setEdits(p => ({ ...p, [key]: val }));
    const get = (key) => (key in edits) ? edits[key] : (order[key] ?? '');
    const isDirty = Object.keys(edits).length > 0;

    const currentStatusIdx = STATUSES.findIndex(s => s.id === order.status);
    const nextStatusId = NEXT_STATUS[order.status];
    const nextStatusObj = STATUSES.find(s => s.id === nextStatusId);

    const handleSave = async () => {
        if (!isDirty) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'supplier_orders', order.id), edits);
            showToast('עודכן בהצלחה', 'success');
            setEdits({});
        } catch { showToast('שגיאה בשמירה', 'error'); }
        setSaving(false);
    };

    const handleAdvance = async () => {
        if (!nextStatusId) return;
        setAdvancing(true);
        try {
            await updateDoc(doc(db, 'supplier_orders', order.id), {
                status: nextStatusId,
                [`${nextStatusId}At`]: serverTimestamp(),
            });
            showToast(`סטטוס עודכן ל: ${nextStatusObj?.label}`, 'success');
        } catch { showToast('שגיאה', 'error'); }
        setAdvancing(false);
    };

    const copyText = (text, key) => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(key);
        setTimeout(() => setCopied(null), 1600);
    };

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
                style={{ width: 500, maxWidth: '100vw', background: '#FAFAFA', boxShadow: '6px 0 48px rgba(0,0,0,0.16)' }}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-black/[0.06] bg-white shrink-0">
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
                    <div className="rounded-2xl p-4 bg-white border border-black/[0.06]">
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
                            <div className="mt-4 py-2 rounded-xl text-[12px] font-bold text-[#34C759] text-center"
                                style={{ background: 'rgba(52,199,89,0.08)' }}>
                                ✓ הזמנה הושלמה
                            </div>
                        )}
                    </div>

                    {/* Customer Details */}
                    <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06]">
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
                    <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06]">
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
                        <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06]">
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
                    <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06]">
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
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-2xl overflow-hidden bg-white border border-black/[0.06]">
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
                            className="shrink-0 p-4 border-t border-black/[0.06] bg-white flex gap-3">
                            <button onClick={() => setEdits({})}
                                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-gray-50 transition-all cursor-pointer">
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

function DashboardTab({ supplierOrders, customerOrders, suppliers, onSelectOrder, onForwardOrder }) {
    const pending   = supplierOrders.filter(o => o.status === 'pending').length;
    const inTransit = supplierOrders.filter(o => o.status === 'in_transit').length;
    const forwarded = supplierOrders.filter(o => o.status === 'forwarded' || o.status === 'confirmed').length;
    const shipped   = supplierOrders.filter(o => o.status === 'shipped').length;

    const forwardedOrderIds = new Set(supplierOrders.map(so => so.customerOrderId));
    const needsAction = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedOrderIds.has(o.id));

    const kpis = [
        { label: 'ממתינות להעברה',  value: pending,   color: '#FF9500', icon: Clock,       sub: 'דורשות פעולה' },
        { label: 'בתהליך אצל ספק', value: forwarded,  color: '#007AFF', icon: Send,        sub: 'מחכות לאישור' },
        { label: 'בדרך',            value: inTransit, color: '#FF9F0A', icon: Truck,       sub: 'בהובלה' },
        { label: 'הושלמו',          value: shipped,   color: '#34C759', icon: CheckCircle, sub: 'כל הזמנות' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="p-5 rounded-[1.5rem] text-right" style={card}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                                <k.icon size={18} style={{ color: k.color }} />
                            </div>
                            <span className="text-3xl font-black text-[#1D1D1F]">{k.value}</span>
                        </div>
                        <p className="text-sm font-bold text-[#1D1D1F]">{k.label}</p>
                        <p className="text-[11px] text-[#86868B] mt-0.5">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Needs Action */}
                <div className="rounded-[1.5rem] overflow-hidden" style={card}>
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#86868B] tracking-widest">{needsAction.length} הזמנות</span>
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#FF9500]" />
                            <h3 className="text-sm font-black text-[#1D1D1F]">דורש העברה לספק</h3>
                        </div>
                    </div>
                    {needsAction.length === 0 ? (
                        <div className="py-10 text-center">
                            <CheckCircle size={28} className="mx-auto text-[#34C759] mb-2" />
                            <p className="text-sm font-bold text-[#86868B]">כל ההזמנות טופלו ✓</p>
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
                        <span className="text-[10px] font-black text-[#86868B] tracking-widest">{supplierOrders.length} סה״כ</span>
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
        </div>
    );
}

// ── Supplier Orders Tab ───────────────────────────────────────────────────────

function SupplierOrdersTab({ supplierOrders, customerOrders, suppliers, showToast, selectedOrder, onSelectOrder }) {
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
        if (!window.confirm('למחוק הזמנת ספק זו?')) return;
        try {
            await deleteDoc(doc(db, 'supplier_orders', id));
            showToast('נמחקה', 'success');
        } catch { showToast('שגיאה', 'error'); }
    }, [showToast]);

    return (
        <div className="space-y-4">
            {/* Action bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap" dir="rtl">
                <div className="flex items-center gap-2 flex-wrap">
                    {['all', ...STATUSES.map(s => s.id)].map(sid => {
                        const s = STATUSES.find(x => x.id === sid);
                        const count = sid === 'all' ? supplierOrders.length : supplierOrders.filter(o => o.status === sid).length;
                        return (
                            <button key={sid} onClick={() => setFilterStatus(sid)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${filterStatus === sid ? 'text-white' : 'bg-white text-[#86868B] border border-black/10 hover:border-[#007AFF]/30'}`}
                                style={filterStatus === sid ? { background: s ? s.color : '#007AFF' } : {}}>
                                {s ? s.label : 'הכל'}
                                {count > 0 && <span className="opacity-70">{count}</span>}
                            </button>
                        );
                    })}
                </div>
                {unforwarded.length > 0 && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowForwardModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black text-white cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#FF9500,#FF6B00)', boxShadow: '0 4px 16px rgba(255,149,0,0.3)' }}>
                        <Send size={14} />
                        העבר לספק ({unforwarded.length})
                    </motion.button>
                )}
            </div>

            {/* List */}
            {displayed.length === 0 ? (
                <div className="py-16 text-center rounded-[2rem]" style={card}>
                    <Package size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[#86868B] font-bold">אין הזמנות בסטטוס זה</p>
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
                                                style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)' }}>
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
                                            <span className="text-[11px] text-[#86868B]">👤 {o.customerName}</span>
                                            <span className="text-[11px] font-bold" style={{ color: '#5856D6' }}>🏭 {o.supplierName || '—'}</span>
                                            {o.totalCost > 0 && <span className="text-[11px] text-[#86868B]">₪{o.totalCost}</span>}
                                            {o.eta && <span className="text-[11px] text-[#86868B]">📅 {o.eta}</span>}
                                        </div>
                                        {o.trackingNumber && (
                                            <p className="text-[10px] text-[#007AFF] font-bold mt-1.5 flex items-center gap-1 justify-end">
                                                <Hash size={9} />
                                                {o.trackingNumber}
                                            </p>
                                        )}
                                        {o.notes && (
                                            <p className="text-[11px] text-[#86868B] mt-1.5 bg-gray-50 rounded-xl px-3 py-1.5 text-right">{o.notes}</p>
                                        )}
                                        <p className="text-[10px] text-[#007AFF]/50 mt-2 text-left">← לחץ לפרטים מלאים</p>
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

    useEffect(() => {
        if (isOpen) {
            setSelectedOrderId(preselectedOrder?.id || orders[0]?.id || '');
            setSupplierId(suppliers[0]?.id || '');
            setEta(''); setNotes(''); setCost('');
        }
    }, [isOpen, orders, suppliers, preselectedOrder]);

    const handleSubmit = async () => {
        if (!selectedOrderId || !supplierId) { showToast('יש לבחור הזמנה וספק', 'error'); return; }
        setLoading(true);
        const order    = orders.find(o => o.id === selectedOrderId);
        const supplier = suppliers.find(s => s.id === supplierId);
        try {
            await addDoc(collection(db, 'supplier_orders'), {
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
            });
            showToast('הועבר לספק בהצלחה', 'success');
            onClose();
        } catch { showToast('שגיאה', 'error'); }
        setLoading(false);
    };

    return (
        <AdminModal open={isOpen} onClose={onClose} title="העברה לספק" size="md">
            <div className="space-y-5 p-6" dir="rtl">
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
                    <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-gray-50 transition-all cursor-pointer">
                        ביטול
                    </button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
                        <Send size={15} />
                        {loading ? 'שולח...' : 'שלח לספק'}
                    </motion.button>
                </div>
            </div>
        </AdminModal>
    );
}

// ── Suppliers Tab ─────────────────────────────────────────────────────────────

const BLANK_SUPPLIER = { name: '', contact: '', phone: '', email: '', leadTimeDays: 7, paymentTerms: 'שוטף + 30', notes: '', active: true };

function SuppliersTab({ suppliers, showToast }) {
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
        if (!window.confirm('למחוק ספק זה?')) return;
        try { await deleteDoc(doc(db, 'suppliers', id)); showToast('ספק נמחק', 'success'); }
        catch { showToast('שגיאה', 'error'); }
    };

    const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="space-y-4">
            <div className="flex justify-end" dir="rtl">
                <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
                    <Plus size={15} />
                    הוסף ספק
                </motion.button>
            </div>

            {suppliers.length === 0 ? (
                <div className="py-16 text-center rounded-[2rem]" style={card}>
                    <Building2 size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[#86868B] font-bold">לא הוגדרו ספקים עדיין</p>
                    <p className="text-[11px] text-gray-400 mt-1">הוסף ספק ראשון כדי להתחיל</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map(s => (
                        <motion.div key={s.id} layout className="p-5 rounded-[1.5rem] text-right" style={card}>
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
                            {s.notes && <p className="text-[11px] text-[#86868B] mt-2 bg-gray-50 rounded-xl px-3 py-2">{s.notes}</p>}
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
                        <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-[#86868B] hover:bg-gray-50 transition-all cursor-pointer">
                            ביטול
                        </button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={loading}
                            className="flex-1 py-3 rounded-2xl text-sm font-black text-white cursor-pointer"
                            style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)', boxShadow: '0 4px 16px rgba(0,122,255,0.2)' }}>
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
        });
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
                                        {p.image && <img src={p.image} alt={p.title} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />}
                                        <div className="text-right min-w-0">
                                            <p className="text-sm font-black text-[#1D1D1F] truncate">{p.title}</p>
                                            <p className="text-[10px] text-[#86868B]">{p.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {FULFILLMENT_TYPES.map(t => (
                                            <button key={t.id} onClick={() => setField(p.id, 'fulfillmentType', t.id)}
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${ftId === t.id ? 'text-white' : 'text-[#86868B] bg-gray-50 hover:bg-gray-100'}`}
                                                style={ftId === t.id ? { background: t.color } : {}}>
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
                                            {saving === p.id ? '...' : '✓ שמור'}
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

    useEffect(() => {
        const u1 = onSnapshot(query(collection(db, 'suppliers'), orderBy('name')), snap => {
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const u2 = onSnapshot(query(collection(db, 'supplier_orders'), orderBy('createdAt', 'desc')), snap => {
            setSupplierOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const u3 = onSnapshot(query(collection(db, 'orders'), orderBy('dateTs', 'desc')), snap => {
            setCustomerOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
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
            <div className="flex items-center gap-2 p-1.5 rounded-2xl w-fit"
                style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.06)' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white text-[#1D1D1F] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
                        <tab.Icon size={14} />
                        {tab.label}
                        {tab.id === 'orders' && pendingCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[#FF9500] text-white text-[9px] font-black flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
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
                        />
                    )}
                    {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} showToast={showToast} />}
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
