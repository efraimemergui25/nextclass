/* eslint-disable */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../context/AdminDataContext';
import { useToast } from '../context/AdminToastContext';
import { StatusBadge, AdminSearchBar, AdminSectionHeader, AdminButton, AdminModal, AdminFilterPills, AdminDateFilter, filterByDate } from '../components/AdminComponents';

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const STATUS_COLORS = {
    'חדש': '#FF3B30', 'ממתין': '#FF9500', 'אושר': '#007AFF',
    'נשלח': '#5856D6', 'נמסר': '#34C759', 'בוטל': '#FF3B30',
};
const STATUSES = ['הכל', 'חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר', 'בוטל'];
const STATUS_FLOW = ['חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר'];

// ─── Quick dropdown ────────────────────────────────────────────────────────────
function QuickStatusDropdown({ order, onUpdate }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(o => !o)}
                className="group flex items-center gap-1">
                <StatusBadge status={order.status} />
                <motion.span animate={{ rotate: open ? 180 : 0 }}
                    className="text-[#AEAEB2] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">▾</motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute top-full mt-1 right-0 z-50 rounded-2xl overflow-hidden py-1"
                        style={{ ...glass, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', minWidth: 110 }}
                        dir="rtl"
                    >
                        {STATUSES.slice(1).map(s => (
                            <button key={s} type="button"
                                onClick={() => { onUpdate(order.id, s); setOpen(false); }}
                                className="w-full text-right px-4 py-2 text-xs font-bold transition-colors hover:bg-black/04"
                                style={{ color: s === order.status ? STATUS_COLORS[s] : '#1D1D1F' }}>
                                {s === order.status ? '✓ ' : ''}{s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Status Timeline ──────────────────────────────────────────────────────────
function StatusTimeline({ status }) {
    const idx = STATUS_FLOW.indexOf(status);
    return (
        <div className="flex items-center mt-3">
            {STATUS_FLOW.map((s, i) => {
                const done = i <= idx, active = i === idx;
                return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <motion.div
                                animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                                transition={{ repeat: active ? Infinity : 0, duration: 1.6 }}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                                style={{
                                    background: done ? STATUS_COLORS[s] : 'rgba(0,0,0,0.06)',
                                    color: done ? 'white' : '#AEAEB2',
                                    boxShadow: active ? `0 0 0 4px ${STATUS_COLORS[s]}25` : 'none',
                                }}>
                                {done ? '✓' : i + 1}
                            </motion.div>
                            <p className="text-[9px] font-black text-center whitespace-nowrap"
                                style={{ color: done ? STATUS_COLORS[s] : '#AEAEB2' }}>{s}</p>
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full"
                                style={{ background: i < idx ? STATUS_COLORS[STATUS_FLOW[i+1]] : 'rgba(0,0,0,0.08)' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Mini KPI stat ────────────────────────────────────────────────────────────
function OrderStat({ label, value, color, icon }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 text-right relative overflow-hidden"
            style={glass}
        >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}30)` }} />
            <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            </div>
            <p className="text-2xl font-black tracking-tighter" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mt-0.5">{label}</p>
        </motion.div>
    );
}

// ─── Customer Avatar ──────────────────────────────────────────────────────────
function CustomerAvatar({ name }) {
    const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}>
            {name?.[0] || '?'}
        </div>
    );
}

export default function AdminOrders() {
    const { orders, updateOrderStatus } = useAdminData();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('הכל');
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [saved, setSaved] = useState(false);

    const handleQuickStatus = (orderId, status) => {
        updateOrderStatus(orderId, status);
        showToast(`סטטוס עודכן ל"${status}"`, 'success');
    };

    const filtered = useMemo(() => {
        let list = filterByDate([...orders], 'dateTs', dateFilter).sort((a, b) => b.dateTs - a.dateTs);
        if (statusFilter !== 'הכל') list = list.filter(o => o.status === statusFilter);
        if (search) list = list.filter(o =>
            (o.customer || '').includes(search) ||
            (o.id || '').includes(search) ||
            (o.product || '').includes(search) ||
            (o.city || '').includes(search)
        );
        return list;
    }, [orders, search, statusFilter, dateFilter]);

    const totalRevenue = useMemo(() => filtered.reduce((s, o) => s + (o.total || 0), 0), [filtered]);

    const stats = useMemo(() => ({
        new: orders.filter(o => o.status === 'חדש').length,
        pending: orders.filter(o => o.status === 'ממתין').length,
        shipped: orders.filter(o => o.status === 'נשלח').length,
        delivered: orders.filter(o => o.status === 'נמסר').length,
    }), [orders]);

    const handleStatusChange = () => {
        if (!newStatus || !selectedOrder) return;
        updateOrderStatus(selectedOrder.id, newStatus);
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        setSaved(true);
        setTimeout(() => { setSaved(false); setNewStatus(''); }, 1200);
    };

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title="הזמנות"
                subtitle={`${orders.length} הזמנות · ₪${orders.reduce((s,o) => s + (o.total||0), 0).toLocaleString()} הכנסה כוללת`}
            />

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <OrderStat label="חדשות" value={stats.new} color="#FF3B30" icon="🔴" />
                <OrderStat label="ממתינות" value={stats.pending} color="#FF9500" icon="🟡" />
                <OrderStat label="נשלחו" value={stats.shipped} color="#5856D6" icon="🟣" />
                <OrderStat label="נמסרו" value={stats.delivered} color="#34C759" icon="🟢" />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי לקוח, מספר הזמנה, מוצר, עיר..." />
                </div>
                <div className="flex flex-wrap gap-3">
                    <AdminFilterPills options={STATUSES} active={statusFilter} onChange={setStatusFilter} />
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 mt-4">
                {/* Header */}
                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-2 text-right">
                        {['', 'מס׳ / תאריך', 'לקוח / מוצר', 'סה״כ', 'סטטוס', ''].map((h, i) => (
                            <p key={i} className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2]">{h}</p>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {filtered.map((order, i) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => { setSelectedOrder(order); setNewStatus(''); setSaved(false); }}
                            className="grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        >
                            {/* Avatar */}
                            <CustomerAvatar name={order.customer} />

                            {/* ID + Date */}
                            <div className="text-right">
                                <p className="text-[#007AFF] font-black text-xs group-hover:text-[#5856D6] transition-colors">{order.id}</p>
                                <p className="text-[#AEAEB2] text-[10px] mt-0.5">{order.date}</p>
                            </div>

                            {/* Customer + Product */}
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate">{order.customer}</p>
                                <p className="text-[#AEAEB2] text-[10px] truncate">{order.product} · {order.qty} יח׳</p>
                            </div>

                            {/* Total */}
                            <p className="text-[#1D1D1F] font-black text-sm">₪{(order.total || 0).toLocaleString()}</p>

                            {/* Status dropdown */}
                            <QuickStatusDropdown order={order} onUpdate={handleQuickStatus} />

                            {/* Arrow */}
                            <motion.span whileHover={{ x: -3 }} className="text-[#AEAEB2] group-hover:text-[#007AFF] text-xs font-bold shrink-0 transition-colors">←</motion.span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-4 text-[#AEAEB2]">
                        <span className="text-5xl">📭</span>
                        <p className="text-sm font-bold text-[#6E6E73]">אין הזמנות תואמות לחיפוש</p>
                    </div>
                )}
            </div>

            {/* Footer summary */}
            {filtered.length > 0 && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[#1D1D1F] font-black text-base">₪{totalRevenue.toLocaleString()}</span>
                    <span className="text-[#86868B] text-sm">{filtered.length} הזמנות מוצגות</span>
                </div>
            )}

            {/* Order Detail Modal */}
            <AdminModal
                open={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={`הזמנה ${selectedOrder?.id || ''}`}
                size="md"
            >
                {selectedOrder && (
                    <div className="space-y-5" dir="rtl">
                        {/* Timeline */}
                        {selectedOrder.status !== 'בוטל' && (
                            <div className="rounded-2xl p-4"
                                style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.10)' }}>
                                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-2 text-right">מצב הזמנה</p>
                                <StatusTimeline status={selectedOrder.status} />
                            </div>
                        )}

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['לקוח', selectedOrder.customer],
                                ['עיר', selectedOrder.city],
                                ['טלפון', selectedOrder.phone],
                                ['מייל', selectedOrder.email],
                                ['מוצר', selectedOrder.product],
                                ['כמות', selectedOrder.qty],
                                ['תאריך', selectedOrder.date],
                                ['סה״כ', `₪${(selectedOrder.total || 0).toLocaleString()}`],
                            ].map(([l, v]) => (
                                <div key={l} className="text-right p-3 rounded-xl"
                                    style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p className="text-[#AEAEB2] text-[10px] font-black uppercase tracking-widest">{l}</p>
                                    <p className="text-[#1D1D1F] font-bold text-sm mt-0.5 truncate">{v || '—'}</p>
                                </div>
                            ))}
                        </div>

                        {selectedOrder.address && (
                            <div className="rounded-xl px-4 py-3 text-right"
                                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <p className="text-[#AEAEB2] text-[10px] font-black uppercase tracking-widest mb-1">כתובת משלוח</p>
                                <p className="text-[#1D1D1F] text-sm">{selectedOrder.address}</p>
                            </div>
                        )}

                        {/* Status change */}
                        <div className="border-t border-black/06 pt-4">
                            <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-3 text-right">עדכן סטטוס</p>
                            <div className="flex flex-wrap gap-2 mb-3 justify-end">
                                {STATUSES.slice(1).map(s => (
                                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                                        className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                        style={{
                                            background: newStatus === s ? STATUS_COLORS[s] : 'rgba(0,0,0,0.06)',
                                            color: newStatus === s ? 'white' : '#6E6E73',
                                            boxShadow: newStatus === s ? `0 4px 12px ${STATUS_COLORS[s]}40` : 'none',
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <AdminButton variant="ghost" onClick={() => setSelectedOrder(null)}>סגור</AdminButton>
                                <AdminButton onClick={handleStatusChange} disabled={!newStatus}>
                                    {saved ? '✓ עודכן!' : 'עדכן סטטוס'}
                                </AdminButton>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
}
