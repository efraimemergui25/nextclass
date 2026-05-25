/* eslint-disable */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InboxIcon, Trash2, Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { StatusBadge, AdminSectionHeader, AdminSearchBar, AdminButton, AdminModal, AdminInput, AdminTabs, AdminDateFilter, filterByDate } from '../components/AdminComponents';

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.78)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const CONTACT_STATUSES = ['חדש', 'בטיפול', 'נסגר'];

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 9 }) {
    const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-black text-white shrink-0`}
            style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', width: size * 4, height: size * 4 }}>
            {name?.[0] || '?'}
        </div>
    );
}

// ─── Summary stat ──────────────────────────────────────────────────────────────
function StatPill({ label, value, color, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
            whileHover={{ y: -2, boxShadow: `0 12px 32px ${color}18` }}
            className="rounded-2xl p-4 text-right relative overflow-hidden"
            style={{ background: `${color}12`, border: `1px solid ${color}22`, boxShadow: `0 4px 20px ${color}10, 0 1px 0 rgba(255,255,255,0.95) inset` }}
        >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}30)` }} />
            <p className="text-2xl font-black tracking-tighter pt-1" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[11px] font-bold mt-0.5">{label}</p>
        </motion.div>
    );
}

function CustomerDetailModal({ customer, onClose, navigate }) {
    if (!customer) return null;
    const phone = customer.phone?.replace(/\D/g, '');
    const waLink = phone ? `https://wa.me/972${phone.replace(/^0/, '')}` : null;
    return (
        <AdminModal open={!!customer} onClose={onClose} title={customer.name} size="md">
            <div className="space-y-5" dir="rtl">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        ['מייל', customer.email],
                        ['טלפון', customer.phone],
                        ['עיר', customer.city],
                        ['הזמנות', customer.orders.length],
                        ['סה״כ רכישות', `₪${customer.total.toLocaleString()}`],
                    ].map(([label, val]) => val ? (
                        <div key={label} className="rounded-xl p-3 text-right" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <p className="text-[#AEAEB2] text-[10px] font-black tracking-widest">{label}</p>
                            <p className="text-[#1D1D1F] font-bold text-sm mt-0.5">{val}</p>
                        </div>
                    ) : null)}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    {waLink && (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white"
                            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 6px 20px rgba(37,211,102,0.3)' }}>
                            WhatsApp
                        </a>
                    )}
                    {customer.phone && (
                        <a href={`tel:${customer.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white"
                            style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 6px 20px rgba(0,122,255,0.25)' }}>
                            התקשר
                        </a>
                    )}
                </div>

                {/* Order history */}
                <div>
                    <p className="text-[#86868B] text-[10px] font-black tracking-widest mb-3 text-right">היסטוריית הזמנות</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {customer.orders.map(order => (
                            <div key={order.id}
                                className="flex items-center justify-between p-3 rounded-xl text-right cursor-pointer transition-all"
                                style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
                                onClick={() => navigate && navigate(`/admin/orders?orderId=${order.id}`)}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,122,255,0.18)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}>
                                <div>
                                    <p className="text-[#007AFF] font-bold text-sm hover:underline cursor-pointer"
                                        onClick={e => { e.stopPropagation(); navigate && navigate(`/admin/inventory?open=${encodeURIComponent(order.product)}`); }}>
                                        {order.product}
                                    </p>
                                    <p className="text-[#AEAEB2] text-xs">{order.date} · {order.qty} יח׳</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm text-[#1D1D1F]">₪{(order.total || 0).toLocaleString()}</p>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminModal>
    );
}

export default function AdminCustomers() {
    const { contacts, orders, updateContactStatus, deleteContact, restoreContact, hardDeleteContact, deletedItems } = useAdminData();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState('contacts');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [reply, setReply] = useState('');
    const [replyDone, setReplyDone] = useState(false);

    const customers = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            if (!map[o.customer]) map[o.customer] = {
                name: o.customer, email: o.email, phone: o.phone, city: o.city, orders: [], total: 0
            };
            map[o.customer].orders.push(o);
            map[o.customer].total += o.total || 0;
        });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [orders]);

    // Auto-search/open from URL param
    useEffect(() => {
        const q = searchParams.get('search') || searchParams.get('customerName');
        if (q) { setSearch(q); setTab('customers'); }
    }, [searchParams]);

    const filteredContacts = useMemo(() => {
        let list = filterByDate([...contacts], 'dateTs', dateFilter).sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
        if (search) list = list.filter(c =>
            (c.name || '').includes(search) ||
            (c.subject || '').includes(search) ||
            (c.email || '').includes(search)
        );
        return list;
    }, [contacts, search, dateFilter]);

    const filteredCustomers = useMemo(() => {
        let list = [...customers];
        if (search) list = list.filter(c =>
            (c.name || '').includes(search) ||
            (c.email || '').includes(search) ||
            (c.city || '').includes(search)
        );
        return list;
    }, [customers, search]);

    const handleStatusChange = (id, status) => {
        updateContactStatus(id, status);
        if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    };

    const loadNotes = (id) => {
        try { return JSON.parse(localStorage.getItem(`nextclass_notes_${id}`) || '[]'); } catch { return []; }
    };

    const handleReply = () => {
        if (!reply.trim()) return;
        handleStatusChange(selected.id, 'בטיפול');
        const note = {
            text: reply.trim(),
            date: new Date().toLocaleDateString('he-IL'),
            time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        };
        localStorage.setItem(`nextclass_notes_${selected.id}`, JSON.stringify([note, ...loadNotes(selected.id)]));
        setReplyDone(true);
        setTimeout(() => { setReplyDone(false); setReply(''); }, 1200);
    };

    const trashCount = (deletedItems?.contacts?.length || 0);
    const tabs = [
        { id: 'contacts', label: 'פניות', count: contacts.filter(c => c.status === 'חדש').length },
        { id: 'customers', label: 'לקוחות', count: customers.length },
        { id: 'trash', label: 'סל מחזור', count: trashCount },
    ];

    const newContacts = contacts.filter(c => c.status === 'חדש').length;
    const totalRevenue = customers.reduce((s, c) => s + c.total, 0);

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title="לקוחות ופניות"
                subtitle={`${customers.length} לקוחות · ${newContacts} פניות חדשות`}
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatPill label="לקוחות" value={customers.length} color="#007AFF" index={0} />
                <StatPill label="פניות חדשות" value={newContacts} color="#FF3B30" index={1} />
                <StatPill label="הכנסה כוללת" value={`₪${totalRevenue.toLocaleString()}`} color="#34C759" index={2} />
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center">
                <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
                <div className="flex-1 w-full xl:max-w-md">
                    <AdminSearchBar
                        value={search} onChange={setSearch}
                        placeholder={tab === 'contacts' ? 'חיפוש פניות...' : 'חיפוש לקוח...'}
                    />
                </div>
                {tab === 'contacts' && (
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                )}
            </div>

            {/* Contacts Tab */}
            {tab === 'contacts' && (
                <div className="space-y-3 mt-4">
                    {filteredContacts.length > 0 && (
                        <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-2 text-right">
                            {['סטטוס', 'שם / מייל', 'נושא', 'תאריך', ''].map((h, i) => (
                                <p key={i} className="text-[10px] font-black tracking-tight text-[#AEAEB2]">{h}</p>
                            ))}
                        </div>
                    )}
                    <AnimatePresence>
                        {filteredContacts.map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ delay: i * 0.015, type: 'spring', stiffness: 320, damping: 28 }}
                                onClick={() => { setSelected(c); setReply(''); setReplyDone(false); }}
                                className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                            >
                                <StatusBadge status={c.status} pulse={c.status === 'חדש'} />
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="text-right min-w-0">
                                        <p className="text-[#1D1D1F] font-bold text-sm group-hover:text-[#007AFF] transition-colors">{c.name}</p>
                                        <p className="text-[#AEAEB2] text-xs truncate mt-0.5">{c.email}</p>
                                    </div>
                                    <Avatar name={c.name} size={10} />
                                </div>
                                <p className="text-[#6E6E73] text-sm line-clamp-1 text-right">{c.subject}</p>
                                <p className="text-[#AEAEB2] text-xs whitespace-nowrap">{c.date || '—'}</p>
                                <motion.span whileHover={{ x: -3 }} className="text-[#AEAEB2] group-hover:text-[#007AFF] text-xs font-bold transition-colors" style={{ fontFamily: 'system-ui', lineHeight: 1 }}>›</motion.span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredContacts.length === 0 && (
                        <div className="py-20 flex flex-col items-center gap-3 text-[#AEAEB2]">
                            <InboxIcon size={40} className="opacity-30" />
                            <p className="text-sm font-bold text-[#6E6E73]">אין פניות תואמות לחיפוש</p>
                        </div>
                    )}
                </div>
            )}

            {/* Customers Tab */}
            {tab === 'customers' && (
                <div className="space-y-3 mt-4">
                    {filteredCustomers.length > 0 && (
                        <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-6 py-2 text-right" dir="rtl">
                            {['', 'לקוח', 'מייל / טלפון', 'עיר', 'הזמנות', 'סה״כ'].map((h, i) => (
                                <p key={i} className="text-[10px] font-black tracking-tight text-[#AEAEB2]">{h}</p>
                            ))}
                        </div>
                    )}
                    <AnimatePresence>
                        {filteredCustomers.map((c, i) => (
                            <motion.div
                                key={c.name}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ delay: i * 0.015, type: 'spring', stiffness: 320, damping: 28 }}
                                onClick={() => setSelectedCustomer(c)}
                                className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group" dir="rtl"
                            >
                                <Avatar name={c.name} size={11} />
                                <p className="text-[#1D1D1F] font-bold text-sm text-right truncate group-hover:text-[#007AFF] transition-colors">{c.name}</p>
                                <div className="text-right">
                                    <p className="text-[#6E6E73] text-xs truncate">{c.email || '—'}</p>
                                    <p className="text-[#AEAEB2] text-[10px] mt-0.5">{c.phone || '—'}</p>
                                </div>
                                <p className="text-[#6E6E73] text-sm font-medium">{c.city || '—'}</p>
                                <span className="text-xs font-black px-3 py-1.5 rounded-full"
                                    style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF' }}>
                                    {c.orders.length}
                                </span>
                                <p className="text-[#1D1D1F] font-black text-sm">₪{c.total.toLocaleString()}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredCustomers.length === 0 && (
                        <div className="py-20 flex flex-col items-center gap-4 text-[#AEAEB2]">
                            <svg className="w-12 h-12 text-[#C7C7CC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <p className="text-sm font-bold text-[#6E6E73]">אין לקוחות תואמים לחיפוש</p>
                        </div>
                    )}
                </div>
            )}

            {/* Contact Modal */}
            <AdminModal open={!!selected} onClose={() => setSelected(null)} title="פרטי פנייה" size="md">
                {selected && (
                    <div className="space-y-4" dir="rtl">
                        <div className="flex items-center gap-4 justify-between">
                            <StatusBadge status={selected.status} />
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-[#1D1D1F] font-black text-base">{selected.name}</p>
                                    <p className="text-[#86868B] text-xs">{selected.email}</p>
                                </div>
                                <Avatar name={selected.name} size={10} />
                            </div>
                        </div>

                        <div className="rounded-2xl p-4 text-right"
                            style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.10)' }}>
                            <p className="text-[#86868B] text-[10px] font-black tracking-tight mb-1">נושא</p>
                            <p className="text-[#1D1D1F] font-bold text-sm">{selected.subject}</p>
                        </div>

                        {selected.message && (
                            <div className="rounded-2xl p-4 text-right"
                                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <p className="text-[#AEAEB2] text-[10px] font-black tracking-tight mb-2">הודעה</p>
                                <p className="text-[#1D1D1F] text-sm leading-relaxed whitespace-pre-line">{selected.message}</p>
                            </div>
                        )}

                        {/* Quick contact actions */}
                        {(selected.phone || selected.email) && (
                            <div className="flex gap-2">
                                {selected.phone && (
                                    <a href={`https://wa.me/972${selected.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(`שלום ${selected.name}, קיבלנו את פנייתך ונשמח לעזור.`)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] text-white transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 12px rgba(37,211,102,0.28)', textDecoration: 'none' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                        WhatsApp
                                    </a>
                                )}
                                {selected.email && (
                                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`מענה לפנייתך — ${selected.subject || 'NextClass'}`)}&body=${encodeURIComponent(`שלום ${selected.name},\n\nתודה על פנייתך.\n`)}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] text-white transition-all hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 4px 12px rgba(0,122,255,0.28)', textDecoration: 'none' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                        מייל
                                    </a>
                                )}
                                {selected.phone && (
                                    <a href={`tel:${selected.phone}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] transition-all hover:opacity-90"
                                        style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.25)', color: '#34C759', textDecoration: 'none' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        חייג
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 justify-end items-center">
                            <p className="text-[#86868B] text-[10px] font-black tracking-tight">עדכן סטטוס:</p>
                            {CONTACT_STATUSES.map(s => (
                                <motion.button key={s} type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStatusChange(selected.id, s)}
                                    className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                    style={{
                                        background: selected.status === s ? '#007AFF' : 'rgba(0,0,0,0.06)',
                                        color: selected.status === s ? 'white' : '#6E6E73',
                                        boxShadow: selected.status === s ? '0 4px 12px rgba(0,122,255,0.30)' : 'none',
                                    }}>
                                    {s}
                                </motion.button>
                            ))}
                        </div>

                        {(() => {
                            const notes = loadNotes(selected.id);
                            if (!notes.length) return null;
                            return (
                                <div className="rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar"
                                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <p className="text-[#AEAEB2] text-[10px] font-black tracking-tight mb-2 text-right">היסטוריית הערות</p>
                                    {notes.map((n, i) => (
                                        <div key={i} className="rounded-xl px-3 py-2.5 text-right"
                                            style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.72)' }}>
                                            <p className="text-[#1D1D1F] text-xs leading-relaxed">{n.text}</p>
                                            <p className="text-[#AEAEB2] text-[10px] mt-1">{n.date} · {n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        <AdminInput label="הוסף הערה פנימית" value={reply} onChange={setReply} rows={3} placeholder="כתוב הערה..." />

                        <div className="flex gap-2 justify-between">
                            <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => { if (window.confirm('להעביר פנייה זו לסל המחזור?')) { deleteContact(selected.id); setSelected(null); } }}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.06)', color: '#FF3B30', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                <Trash2 size={13} />מחק
                            </motion.button>
                            <div className="flex gap-2">
                                <AdminButton variant="ghost" onClick={() => setSelected(null)}>סגור</AdminButton>
                                <AdminButton onClick={handleReply} disabled={!reply.trim()}>
                                    {replyDone ? <span className="flex items-center gap-1"><Check size={13} /> נשמר!</span> : 'שמור תגובה'}
                                </AdminButton>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>

            <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} navigate={navigate} />

            {/* Trash Tab */}
            {tab === 'trash' && (
                <div className="space-y-3 mt-4" dir="rtl">
                    {(deletedItems?.contacts || []).length === 0 ? (
                        <div className="text-center py-16 text-[#AEAEB2] text-sm font-semibold">סל המחזור ריק</div>
                    ) : (deletedItems?.contacts || []).map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>{c.name || '—'}</div>
                                <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>{c.email} · {c.subject}</div>
                                <div style={{ fontSize: 10, color: '#D1D1D6', marginTop: 2 }}>נמחק {c.deletedAt ? new Date(c.deletedAt).toLocaleDateString('he-IL') : '—'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={async () => { await restoreContact(c.id); }}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(52,199,89,0.1)', color: '#34C759', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                    שחזר
                                </button>
                                <button onClick={async () => { if (window.confirm('למחוק לצמיתות? לא ניתן לשחזר.')) await hardDeleteContact(c.id); }}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,59,48,0.08)', color: '#FF3B30', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                    מחק לצמיתות
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
