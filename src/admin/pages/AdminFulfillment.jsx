/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, addDoc, deleteDoc, serverTimestamp, where
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import {
    AdminSectionHeader, AdminInput, AdminTextArea,
    AdminToggle, AdminButton, AdminModal
} from '../components/AdminComponents';
import {
    Truck, Package, Building2, Link2, Plus, Trash2, Edit2,
    Clock, CheckCircle, AlertTriangle, Send, X, Phone,
    Mail, Calendar, TrendingUp, RefreshCw, ChevronDown,
    ArrowRight, Star, Zap
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const FULFILLMENT_TYPES = [
    { id: 'supplier', label: 'ספק חיצוני', color: '#007AFF', emoji: '🏭', desc: 'Drop-ship — מגיע ישירות מהספק' },
    { id: 'stock',    label: 'מלאי פיזי',  color: '#34C759', emoji: '📦', desc: 'מוצר זמין במחסן שלנו' },
    { id: 'preorder', label: 'הזמנה מראש', color: '#FF9500', emoji: '⏳', desc: 'זמין להזמנה — מגיע בהמשך' },
];

const STATUSES = [
    { id: 'pending',    label: 'ממתין להעברה',  color: '#FF9500', bg: 'rgba(255,149,0,0.10)',    icon: Clock },
    { id: 'forwarded',  label: 'הועבר לספק',    color: '#007AFF', bg: 'rgba(0,122,255,0.10)',    icon: Send },
    { id: 'confirmed',  label: 'אושר ע"י ספק', color: '#5856D6', bg: 'rgba(88,86,214,0.10)',    icon: CheckCircle },
    { id: 'in_transit', label: 'בדרך',          color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)',   icon: Truck },
    { id: 'arrived',    label: 'הגיע למחסן',    color: '#34C759', bg: 'rgba(52,199,89,0.10)',    icon: Package },
    { id: 'shipped',    label: 'נשלח ללקוח',    color: '#30D158', bg: 'rgba(48,209,88,0.10)',    icon: CheckCircle },
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
            {t.emoji} {t.label}
        </span>
    );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({ supplierOrders, customerOrders, suppliers }) {
    const pending    = supplierOrders.filter(o => o.status === 'pending').length;
    const inTransit  = supplierOrders.filter(o => o.status === 'in_transit').length;
    const forwarded  = supplierOrders.filter(o => o.status === 'forwarded' || o.status === 'confirmed').length;
    const shipped    = supplierOrders.filter(o => o.status === 'shipped').length;

    // Customer orders that haven't been forwarded yet (no matching supplier_order)
    const forwardedOrderIds = new Set(supplierOrders.map(so => so.customerOrderId));
    const needsAction = customerOrders.filter(o =>
        o.status !== 'בוטל' && !forwardedOrderIds.has(o.id)
    );

    const kpis = [
        { label: 'ממתינות להעברה',  value: pending,    color: '#FF9500', icon: Clock,        sub: 'דורשות פעולה' },
        { label: 'בתהליך אצל ספק', value: forwarded,   color: '#007AFF', icon: Send,         sub: 'מחכות לאישור' },
        { label: 'בדרך',            value: inTransit,  color: '#FF9F0A', icon: Truck,        sub: 'בהובלה' },
        { label: 'הושלמו',          value: shipped,    color: '#34C759', icon: CheckCircle,  sub: 'כל הזמנות' },
    ];

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="p-5 rounded-[1.5rem] text-right" style={card}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                style={{ background: `${k.color}15` }}>
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
                        <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">{needsAction.length} הזמנות</span>
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
                                <div key={o.id} className="px-6 py-3 flex items-center justify-between" dir="rtl">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse" />
                                        <span className="text-[11px] text-[#86868B]">{o.date || '—'}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#1D1D1F]">{o.customer}</p>
                                        <p className="text-[11px] text-[#86868B]">{o.product} × {o.qty}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Supplier Summary */}
                <div className="rounded-[1.5rem] overflow-hidden" style={card}>
                    <div className="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">{suppliers.filter(s => s.active !== false).length} פעילים</span>
                        <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-[#007AFF]" />
                            <h3 className="text-sm font-black text-[#1D1D1F]">ספקים</h3>
                        </div>
                    </div>
                    {suppliers.length === 0 ? (
                        <div className="py-10 text-center">
                            <Building2 size={28} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-sm font-bold text-[#86868B]">לא הוגדרו ספקים עדיין</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-black/[0.04]">
                            {suppliers.slice(0, 5).map(s => {
                                const count = supplierOrders.filter(o => o.supplierId === s.id).length;
                                return (
                                    <div key={s.id} className="px-6 py-3 flex items-center justify-between" dir="rtl">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${s.active !== false ? 'bg-[#34C759]' : 'bg-gray-300'}`} />
                                            <span className="text-[11px] text-[#86868B]">{count} הזמנות</span>
                                            <span className="text-[11px] text-[#86868B]">·</span>
                                            <span className="text-[11px] text-[#86868B]">{s.leadTimeDays || '?'} ימים</span>
                                        </div>
                                        <p className="text-sm font-bold text-[#1D1D1F]">{s.name}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Supplier Orders Tab ───────────────────────────────────────────────────────

function SupplierOrdersTab({ supplierOrders, customerOrders, suppliers, showToast }) {
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const forwardedIds = new Set(supplierOrders.map(so => so.customerOrderId));
    const unforwarded = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedIds.has(o.id));

    const displayed = filterStatus === 'all'
        ? supplierOrders
        : supplierOrders.filter(o => o.status === filterStatus);

    const advanceStatus = useCallback(async (id, currentStatus) => {
        const next = NEXT_STATUS[currentStatus];
        if (!next) return;
        try {
            await updateDoc(doc(db, 'supplier_orders', id), {
                status: next,
                [`${next}At`]: serverTimestamp(),
            });
            showToast('סטטוס עודכן', 'success');
        } catch { showToast('שגיאה', 'error'); }
    }, [showToast]);

    const deleteOrder = useCallback(async (id) => {
        if (!window.confirm('למחוק הזמנת ספק זו?')) return;
        try {
            await deleteDoc(doc(db, 'supplier_orders', id));
            showToast('נמחקה', 'success');
        } catch { showToast('שגיאה', 'error'); }
    }, [showToast]);

    return (
        <div className="space-y-4">
            {/* Action bar */}
            <div className="flex items-center justify-between gap-4" dir="rtl">
                <div className="flex items-center gap-2 flex-wrap">
                    {['all', ...STATUSES.map(s => s.id)].map(sid => {
                        const s = STATUSES.find(x => x.id === sid);
                        return (
                            <button key={sid} onClick={() => setFilterStatus(sid)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${filterStatus === sid ? 'bg-[#007AFF] text-white' : 'bg-white text-[#86868B] border border-black/10 hover:border-[#007AFF]/30'}`}>
                                {s ? s.label : 'הכל'}
                            </button>
                        );
                    })}
                </div>
                {unforwarded.length > 0 && (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowForwardModal(true)}
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
                <div className="space-y-3">
                    {displayed.map(o => {
                        const nextS = NEXT_STATUS[o.status];
                        const nextLabel = STATUSES.find(s => s.id === nextS)?.label;
                        return (
                            <motion.div key={o.id} layout
                                className="rounded-[1.5rem] p-5" style={card} dir="rtl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        {nextS && (
                                            <motion.button whileTap={{ scale: 0.95 }}
                                                onClick={() => advanceStatus(o.id, o.status)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white cursor-pointer"
                                                style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)' }}>
                                                <ArrowRight size={12} />
                                                {nextLabel}
                                            </motion.button>
                                        )}
                                        <button onClick={() => deleteOrder(o.id)}
                                            className="p-2 rounded-xl hover:bg-[#FF3B30]/10 text-[#FF3B30]/40 hover:text-[#FF3B30] transition-all cursor-pointer">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1.5 flex-wrap">
                                            <StatusPill statusId={o.status} />
                                            <span className="text-[11px] text-[#AEAEB2]">
                                                {o.eta ? `ETA: ${o.eta}` : '—'}
                                            </span>
                                        </div>
                                        <p className="font-black text-[#1D1D1F] text-[15px]">
                                            {o.productTitle} × {o.qty}
                                        </p>
                                        <div className="flex items-center gap-3 justify-end mt-1">
                                            <span className="text-[11px] text-[#86868B]">לקוח: {o.customerName}</span>
                                            <span className="text-[11px] text-[#007AFF] font-bold">ספק: {o.supplierName}</span>
                                            {o.totalCost > 0 && (
                                                <span className="text-[11px] text-[#86868B]">עלות: ₪{o.totalCost}</span>
                                            )}
                                        </div>
                                        {o.notes && (
                                            <p className="text-[11px] text-[#86868B] mt-1.5 bg-gray-50 rounded-xl px-3 py-1.5">{o.notes}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Forward to Supplier Modal */}
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

function ForwardModal({ isOpen, onClose, orders, suppliers, showToast }) {
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [eta, setEta] = useState('');
    const [notes, setNotes] = useState('');
    const [cost, setCost] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedOrderId(orders[0]?.id || '');
            setSupplierId(suppliers[0]?.id || '');
            setEta('');
            setNotes('');
            setCost('');
        }
    }, [isOpen, orders, suppliers]);

    const handleSubmit = async () => {
        if (!selectedOrderId || !supplierId) { showToast('יש לבחור הזמנה וספק', 'error'); return; }
        setLoading(true);
        const order = orders.find(o => o.id === selectedOrderId);
        const supplier = suppliers.find(s => s.id === supplierId);
        try {
            await addDoc(collection(db, 'supplier_orders'), {
                customerOrderId: order.id,
                customerName: order.customer || '',
                productTitle: order.product || '',
                qty: order.qty || 1,
                supplierId,
                supplierName: supplier?.name || '',
                status: 'forwarded',
                eta,
                notes,
                totalCost: parseFloat(cost) || 0,
                sentAt: serverTimestamp(),
                createdAt: serverTimestamp(),
            });
            showToast('הועבר לספק בהצלחה', 'success');
            onClose();
        } catch { showToast('שגיאה', 'error'); }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AdminModal isOpen={isOpen} onClose={onClose} title="העברה לספק" size="md">
            <div className="space-y-5 p-6" dir="rtl">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest block">הזמנת לקוח</label>
                    <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right">
                        {orders.map(o => (
                            <option key={o.id} value={o.id}>
                                {o.customer} — {o.product} × {o.qty}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest block">ספק</label>
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
                        <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest block">עלות ספק (₪)</label>
                        <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0"
                            className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 text-right" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest block">תאריך ETA</label>
                        <input type="date" value={eta} onChange={e => setEta(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest block">הערות לספק</label>
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
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(BLANK_SUPPLIER);
    const [loading, setLoading] = useState(false);

    const openAdd = () => { setForm(BLANK_SUPPLIER); setEditId(null); setShowForm(true); };
    const openEdit = (s) => { setForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', leadTimeDays: s.leadTimeDays || 7, paymentTerms: s.paymentTerms || '', notes: s.notes || '', active: s.active !== false }); setEditId(s.id); setShowForm(true); };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast('שם ספק חובה', 'error'); return; }
        setLoading(true);
        try {
            if (editId) {
                await updateDoc(doc(db, 'suppliers', editId), { ...form });
            } else {
                await addDoc(collection(db, 'suppliers'), { ...form, createdAt: serverTimestamp() });
            }
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
                                    <div className="flex items-center gap-1.5 justify-end text-[11px] text-[#86868B]">
                                        <span>{s.phone}</span><Phone size={10} />
                                    </div>
                                )}
                                {s.email && (
                                    <div className="flex items-center gap-1.5 justify-end text-[11px] text-[#86868B]">
                                        <span className="truncate">{s.email}</span><Mail size={10} />
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 justify-end text-[11px]">
                                    <span className="font-bold text-[#007AFF]">{s.leadTimeDays || '?'} ימי אספקה</span>
                                    <Clock size={10} className="text-[#007AFF]" />
                                </div>
                                {s.paymentTerms && (
                                    <div className="text-[11px] text-[#86868B]">{s.paymentTerms}</div>
                                )}
                            </div>
                            {s.notes && (
                                <p className="text-[11px] text-[#86868B] mt-2 bg-gray-50 rounded-xl px-3 py-2">{s.notes}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AdminModal isOpen={showForm} onClose={() => setShowForm(false)} title={editId ? 'עריכת ספק' : 'הוספת ספק'} size="md">
                <div className="p-6 space-y-4" dir="rtl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <AdminInput label="שם הספק *" value={form.name} onChange={v => f('name', v)} />
                        </div>
                        <AdminInput label="איש קשר" value={form.contact} onChange={v => f('contact', v)} />
                        <AdminInput label="טלפון" value={form.phone} onChange={v => f('phone', v)} />
                        <AdminInput label="אימייל" value={form.email} onChange={v => f('email', v)} />
                        <AdminInput label="ימי אספקה ממוצעים" value={String(form.leadTimeDays)} onChange={v => f('leadTimeDays', parseInt(v) || 7)} />
                        <div className="col-span-2">
                            <AdminInput label="תנאי תשלום" value={form.paymentTerms} onChange={v => f('paymentTerms', v)} />
                        </div>
                        <div className="col-span-2">
                            <AdminTextArea label="הערות" value={form.notes} onChange={v => f('notes', v)} rows={2} />
                        </div>
                        <div className="col-span-2">
                            <AdminToggle label="ספק פעיל" value={form.active} onChange={v => f('active', v)} />
                        </div>
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
    const [edits, setEdits] = useState({});
    const [saving, setSaving] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('title'));
        return onSnapshot(q, snap => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, []);

    const setField = (productId, key, val) => {
        setEdits(p => ({ ...p, [productId]: { ...(p[productId] || {}), [key]: val } }));
    };

    const saveProduct = async (productId) => {
        const changes = edits[productId];
        if (!changes) return;
        setSaving(productId);
        try {
            await updateDoc(doc(db, 'products', productId), changes);
            showToast('מוצר עודכן', 'success');
            setEdits(p => { const n = { ...p }; delete n[productId]; return n; });
        } catch { showToast('שגיאה', 'error'); }
        setSaving(null);
    };

    const getVal = (product, key) => {
        return edits[product.id]?.[key] ?? product[key] ?? '';
    };

    return (
        <div className="space-y-3">
            <div className="p-4 rounded-2xl text-right text-[12px] font-medium text-[#007AFF]"
                style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.12)' }} dir="rtl">
                💡 מיפוי ספקים לכל מוצר — קובע מאין מגיע המוצר ומה זמן האספקה ללקוח. שינויים נשמרים מיד לכל גולש.
            </div>

            {products.length === 0 ? (
                <div className="py-16 text-center rounded-[2rem]" style={card}>
                    <Package size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-[#86868B] font-bold">טוען מוצרים...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {products.map(p => {
                        const ftId = getVal(p, 'fulfillmentType') || 'supplier';
                        const ft = FULFILLMENT_TYPES.find(t => t.id === ftId) || FULFILLMENT_TYPES[0];
                        const isDirty = !!edits[p.id];

                        return (
                            <motion.div key={p.id} layout
                                className="rounded-[1.5rem] p-4 transition-all"
                                style={{ ...card, borderColor: isDirty ? 'rgba(0,122,255,0.3)' : undefined }}>
                                <div className="flex items-center gap-4 flex-wrap" dir="rtl">
                                    {/* Product info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                        {p.image && (
                                            <img src={p.image} alt={p.title}
                                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100" />
                                        )}
                                        <div className="text-right min-w-0">
                                            <p className="text-sm font-black text-[#1D1D1F] truncate">{p.title}</p>
                                            <p className="text-[10px] text-[#86868B]">{p.category}</p>
                                        </div>
                                    </div>

                                    {/* Fulfillment Type */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {FULFILLMENT_TYPES.map(t => (
                                            <button key={t.id}
                                                onClick={() => setField(p.id, 'fulfillmentType', t.id)}
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${ftId === t.id ? 'text-white' : 'text-[#86868B] bg-gray-50 hover:bg-gray-100'}`}
                                                style={ftId === t.id ? { background: t.color } : {}}>
                                                {t.emoji} {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Supplier (only for supplier type) */}
                                    {ftId === 'supplier' && (
                                        <select
                                            value={getVal(p, 'supplierId') || ''}
                                            onChange={e => {
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

                                    {/* Lead time */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <input
                                            type="number"
                                            value={getVal(p, 'leadTimeDays') || ''}
                                            onChange={e => setField(p.id, 'leadTimeDays', parseInt(e.target.value) || 0)}
                                            placeholder="ימים"
                                            className="w-16 px-2 py-2 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[11px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                                        <span className="text-[10px] text-[#86868B] shrink-0">ימי אספקה</span>
                                    </div>

                                    {/* Cost */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <input
                                            type="number"
                                            value={getVal(p, 'supplierCost') || ''}
                                            onChange={e => setField(p.id, 'supplierCost', parseFloat(e.target.value) || 0)}
                                            placeholder="עלות ₪"
                                            className="w-20 px-2 py-2 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[11px] font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20" />
                                        <span className="text-[10px] text-[#86868B] shrink-0">₪ עלות</span>
                                    </div>

                                    {/* Save */}
                                    {isDirty && (
                                        <motion.button
                                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => saveProduct(p.id)}
                                            disabled={saving === p.id}
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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [suppliers, setSuppliers] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [customerOrders, setCustomerOrders] = useState([]);
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

    const pendingCount = supplierOrders.filter(o => o.status === 'pending').length;
    const forwardedIds = new Set(supplierOrders.map(o => o.customerOrderId));
    const needsForwarding = customerOrders.filter(o => o.status !== 'בוטל' && !forwardedIds.has(o.id)).length;

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ניהול ספקים ואספקה"
                subtitle="מודל Drop-Ship — מקבלים הזמנה, מעבירים לספק, עוקבים עד מסירה"
                action={
                    <div className="flex items-center gap-3">
                        {needsForwarding > 0 && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black"
                                style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500' }}>
                                <AlertTriangle size={14} />
                                {needsForwarding} ממתינות להעברה
                            </motion.div>
                        )}
                    </div>
                }
            />

            {/* Tab Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl w-fit"
                style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.06)' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-white text-[#1D1D1F] shadow-sm'
                                : 'text-[#86868B] hover:text-[#1D1D1F]'
                        }`}>
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

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                    {activeTab === 'dashboard' && <DashboardTab supplierOrders={supplierOrders} customerOrders={customerOrders} suppliers={suppliers} />}
                    {activeTab === 'orders'    && <SupplierOrdersTab supplierOrders={supplierOrders} customerOrders={customerOrders} suppliers={suppliers} showToast={showToast} />}
                    {activeTab === 'suppliers' && <SuppliersTab suppliers={suppliers} showToast={showToast} />}
                    {activeTab === 'mapping'   && <ProductMappingTab suppliers={suppliers} showToast={showToast} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
