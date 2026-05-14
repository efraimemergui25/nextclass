/* eslint-disable */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Phone, FileText, Handshake, CheckCircle2, AlertCircle, TrendingUp, Package } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSearchBar, AdminSectionHeader, AdminButton, AdminModal, AdminFilterPills, AdminDateFilter, filterByDate, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

// ─── Orders constants ─────────────────────────────────────────────────────────
const ORDER_STATUS_COLORS = {
    'חדש': '#FF3B30', 'ממתין': '#FF9500', 'אושר': '#007AFF',
    'נשלח': '#5856D6', 'נמסר': '#34C759', 'בוטל': '#FF3B30',
};
const ORDER_STATUSES = ['הכל', 'חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר', 'בוטל'];
const ORDER_STATUS_FLOW = ['חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר'];

// ─── Quote constants ──────────────────────────────────────────────────────────
const QUOTE_STATUS_COLORS = {
    'חדש':           '#FF3B30',
    'ביצירת קשר':    '#FF9500',
    'הוצע מחיר':     '#007AFF',
    'במשא ומתן':     '#5856D6',
    'נסגר':          '#34C759',
    'אבד':           '#AEAEB2',
};
const QUOTE_STATUSES     = ['הכל', 'חדש', 'ביצירת קשר', 'הוצע מחיר', 'במשא ומתן', 'נסגר', 'אבד'];
const QUOTE_STATUS_FLOW  = ['חדש', 'ביצירת קשר', 'הוצע מחיר', 'במשא ומתן', 'נסגר'];

// ─── Mini KPI stat ────────────────────────────────────────────────────────────
function Stat({ label, value, color, Icon, tooltip }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] p-4 text-right relative overflow-hidden"
            style={{
                background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.94) 50%, rgba(255,255,255,0.88) 100%)`,
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: `1px solid ${color}22`,
                boxShadow: `0 4px 20px ${color}10, 0 1px 0 rgba(255,255,255,0.95) inset`,
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${color}16`, border: `1px solid ${color}22` }}>
                    {Icon && <Icon size={15} style={{ color }} />}
                </div>
                <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: color }} />
            </div>
            <p className="text-[26px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[10px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-0.5">
                {label}{tooltip && <InfoTooltip text={tooltip} />}
            </p>
        </motion.div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }) {
    const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}>
            {name?.[0] || '?'}
        </div>
    );
}

// ─── Status flow timeline ─────────────────────────────────────────────────────
function StatusTimeline({ status, flow, colors }) {
    const idx = flow.indexOf(status);
    return (
        <div className="flex items-center mt-3">
            {flow.map((s, i) => {
                const done = i <= idx, active = i === idx;
                return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <motion.div
                                animate={{ scale: active ? [1, 1.15, 1] : 1 }}
                                transition={{ repeat: active ? Infinity : 0, duration: 1.6 }}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black"
                                style={{
                                    background: done ? (colors[s] || '#007AFF') : 'rgba(0,0,0,0.06)',
                                    color: done ? 'white' : '#AEAEB2',
                                    boxShadow: active ? `0 0 0 4px ${(colors[s] || '#007AFF')}25` : 'none',
                                }}>
                                {done ? '✓' : i + 1}
                            </motion.div>
                            <p className="text-[9px] font-black text-center whitespace-nowrap"
                                style={{ color: done ? (colors[s] || '#007AFF') : '#AEAEB2' }}>{s}</p>
                        </div>
                        {i < flow.length - 1 && (
                            <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full"
                                style={{ background: i < idx ? (colors[flow[i + 1]] || '#007AFF') : 'rgba(0,0,0,0.08)' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Quick status dropdown ────────────────────────────────────────────────────
function QuickDropdown({ item, statuses, colors, onUpdate }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const color = colors[item.status] || '#AEAEB2';
    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(o => !o)}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black"
                style={{ background: `${color}18`, color }}>
                {item.status}
                <motion.span animate={{ rotate: open ? 180 : 0 }} className="opacity-60 text-[9px]">▾</motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute top-full mt-1 right-0 z-50 rounded-2xl overflow-hidden py-1"
                        style={{ ...glass, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', minWidth: 130 }}
                        dir="rtl"
                    >
                        {statuses.slice(1).map(s => (
                            <button key={s} type="button"
                                onClick={() => { onUpdate(item.id, s); setOpen(false); }}
                                className="w-full text-right px-4 py-2 text-xs font-bold transition-colors hover:bg-black/04"
                                style={{ color: s === item.status ? (colors[s] || '#007AFF') : '#1D1D1F' }}>
                                {s === item.status ? '✓ ' : ''}{s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// QUOTES PIPELINE
// ════════════════════════════════════════════════════════════════════════════
function QuotesPipeline() {
    const { quotes, updateQuoteStatus, addQuoteNote } = useAdminData();
    const { showToast } = useAdminToast();

    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('הכל');
    const [dateFilter, setDateFilter]   = useState('all');
    const [selected, setSelected]       = useState(null);
    const [newStatus, setNewStatus]     = useState('');
    const [noteText, setNoteText]       = useState('');
    const [saved, setSaved]             = useState(false);

    const handleQuickStatus = (id, status) => {
        updateQuoteStatus(id, status);
        showToast(`הצעה עודכנה ל"${status}"`, 'success');
    };

    const handleStatusSave = () => {
        if (!newStatus || !selected) return;
        updateQuoteStatus(selected.id, newStatus);
        setSelected(prev => ({ ...prev, status: newStatus }));
        setSaved(true);
        setTimeout(() => { setSaved(false); setNewStatus(''); }, 1200);
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !selected) return;
        await addQuoteNote(selected.id, noteText.trim());
        setNoteText('');
        showToast('הערה נשמרה', 'success');
    };

    const filtered = useMemo(() => {
        let list = filterByDate([...quotes], 'dateTs', dateFilter);
        if (statusFilter !== 'הכל') list = list.filter(q => q.status === statusFilter);
        if (search) list = list.filter(q =>
            (q.contactName || '').includes(search) ||
            (q.institution || '').includes(search) ||
            (q.email || '').includes(search) ||
            (q.id || '').includes(search) ||
            (q.phone || '').includes(search)
        );
        return list;
    }, [quotes, search, statusFilter, dateFilter]);

    const stats = useMemo(() => ({
        new:         quotes.filter(q => q.status === 'חדש').length,
        contacting:  quotes.filter(q => q.status === 'ביצירת קשר').length,
        quoted:      quotes.filter(q => q.status === 'הוצע מחיר').length,
        negotiating: quotes.filter(q => q.status === 'במשא ומתן').length,
        closed:      quotes.filter(q => q.status === 'נסגר').length,
    }), [quotes]);

    const totalValue = useMemo(() => filtered.reduce((s, q) => s + (q.subtotal || 0), 0), [filtered]);

    return (
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Stat label="חדשות" value={stats.new} color="#FF3B30" Icon={Bell}
                    tooltip="בקשות הצעת מחיר שנקלטו ועדיין לא טופלו." />
                <Stat label="יצירת קשר" value={stats.contacting} color="#FF9500" Icon={Phone}
                    tooltip="הצעות שנוצר עמן קשר ראשוני — ממתינות לפגישה או פרטים נוספים." />
                <Stat label="הוצע מחיר" value={stats.quoted} color="#007AFF" Icon={FileText}
                    tooltip="הצעות שנשלחה להן הצעת מחיר רשמית — ממתינות לתגובת הלקוח." />
                <Stat label="משא ומתן" value={stats.negotiating} color="#5856D6" Icon={TrendingUp}
                    tooltip="הצעות בשלב הסכמה על תנאים — הסיכוי הגבוה ביותר לסגירה." />
                <Stat label="נסגרו" value={stats.closed} color="#34C759" Icon={CheckCircle2}
                    tooltip="עסקאות שנסגרו בהצלחה — הלקוח אישר ורכש." />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי שם, מוסד, מייל, מספר..." />
                </div>
                <div className="flex flex-wrap gap-3">
                    <AdminFilterPills options={QUOTE_STATUSES} active={statusFilter} onChange={setStatusFilter} />
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 mt-4">
                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-2 text-right">
                        {['', 'מספר / תאריך', 'פרטי קשר', 'שווי הצעה', 'סטטוס', ''].map((h, i) => (
                            <p key={i} className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2]">{h}</p>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {filtered.map((quote, i) => (
                        <motion.div
                            key={quote.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => { setSelected(quote); setNewStatus(''); setSaved(false); setNoteText(''); }}
                            className="grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        >
                            <Avatar name={quote.contactName} />
                            <div className="text-right">
                                <p className="text-[#007AFF] font-black text-xs group-hover:text-[#5856D6] transition-colors">{quote.id}</p>
                                <p className="text-[#AEAEB2] text-[10px] mt-0.5">{quote.date}</p>
                            </div>
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate">{quote.contactName}</p>
                                <p className="text-[#AEAEB2] text-[10px] truncate">{quote.institution} · {quote.contactRole}</p>
                            </div>
                            <p className="text-[#1D1D1F] font-black text-sm">
                                {quote.subtotal ? `₪${quote.subtotal.toLocaleString()}` : '—'}
                            </p>
                            <QuickDropdown item={quote} statuses={QUOTE_STATUSES} colors={QUOTE_STATUS_COLORS} onUpdate={handleQuickStatus} />
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                {quote.phone && (
                                    <a
                                        href={`https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 2px 8px rgba(37,211,102,0.35)' }}
                                    >
                                        WhatsApp
                                    </a>
                                )}
                                {quote.status !== 'נסגר' && (
                                    <motion.button whileTap={{ scale: 0.88 }}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(quote.id, 'נסגר'); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#34C759,#30D158)', boxShadow: '0 2px 8px rgba(52,199,89,0.35)' }}>
                                        נסגר
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-3 text-[#AEAEB2]">
                        <FileText size={40} className="opacity-30" />
                        <p className="text-sm font-bold text-[#6E6E73]">אין בקשות הצעות מחיר תואמות</p>
                    </div>
                )}
            </div>

            {filtered.length > 0 && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[#1D1D1F] font-black text-base">₪{totalValue.toLocaleString()}</span>
                    <span className="text-[#86868B] text-sm">{filtered.length} הצעות מוצגות</span>
                </div>
            )}

            {/* Quote Detail Modal */}
            <AdminModal open={!!selected} onClose={() => setSelected(null)} title={`הצעת מחיר ${selected?.id || ''}`} size="md">
                {selected && (
                    <div className="space-y-5" dir="rtl">
                        {/* Pipeline progress */}
                        {selected.status !== 'אבד' && (
                            <div className="rounded-2xl p-4"
                                style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.10)' }}>
                                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-2 text-right">מצב ההצעה</p>
                                <StatusTimeline status={selected.status} flow={QUOTE_STATUS_FLOW} colors={QUOTE_STATUS_COLORS} />
                            </div>
                        )}

                        {/* Contact details */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['שם איש קשר', selected.contactName],
                                ['תפקיד', selected.contactRole],
                                ['מוסד', selected.institution],
                                ['סוג מוסד', selected.institutionType],
                                ['טלפון', selected.phone],
                                ['מייל', selected.email],
                                ['אמצעי קשר מועדף', selected.preferredContact],
                                ['זמן מועדף לשיחה', selected.bestTime],
                                ['טווח תקציב', selected.budgetRange],
                                ['דחיפות', selected.urgency],
                            ].map(([l, v]) => v ? (
                                <div key={l} className="text-right p-3 rounded-xl"
                                    style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p className="text-[#AEAEB2] text-[10px] font-black uppercase tracking-widest">{l}</p>
                                    <p className="text-[#1D1D1F] font-bold text-sm mt-0.5 truncate">{v}</p>
                                </div>
                            ) : null)}
                        </div>

                        {/* WhatsApp CTA */}
                        {selected.phone && (
                            <a href={`https://wa.me/972${selected.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(`שלום ${selected.contactName}, קיבלנו את בקשת הצעת המחיר שלך (${selected.id}). אנחנו רוצים לסייע לך.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-black text-sm text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}>
                                פתח WhatsApp עם {selected.contactName}
                            </a>
                        )}

                        {/* Cart items */}
                        {selected.items?.length > 0 && (
                            <div>
                                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-3 text-right">פריטים בהצעה</p>
                                <div className="space-y-2">
                                    {selected.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl text-right"
                                            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <img src={item.image || item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-[#F5F5F7] shrink-0"
                                                onError={(e) => {
                                                    if (!e.target.dataset.tried1) {
                                                        e.target.dataset.tried1 = 'true';
                                                        const orig = initialProducts.find(ip => String(ip.id) === String(item.id));
                                                        if (orig?.image) { e.target.src = orig.image; return; }
                                                    }
                                                    e.target.onerror = null;
                                                    e.target.src = IMG_FALLBACK;
                                                }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[#1D1D1F] font-bold text-sm truncate">{item.title}</p>
                                                <p className="text-[#86868B] text-xs">כמות: {item.qty ?? item.quantity ?? 1} · ₪{(item.salePrice ?? item.price)?.toLocaleString()}</p>
                                            </div>
                                            <p className="font-black text-sm shrink-0">₪{((item.salePrice ?? item.price) * (item.qty ?? item.quantity ?? 1)).toLocaleString()}</p>
                                        </div>
                                    ))}
                                    <div className="flex justify-between px-3 pt-2">
                                        <span className="text-[#86868B] text-sm">סה״כ הצעה</span>
                                        <span className="font-black text-[#1D1D1F]">₪{(selected.subtotal || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {selected.notes && (
                            <div className="rounded-xl px-4 py-3 text-right"
                                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <p className="text-[#AEAEB2] text-[10px] font-black uppercase tracking-widest mb-1">הערות לקוח</p>
                                <p className="text-[#1D1D1F] text-sm">{selected.notes}</p>
                            </div>
                        )}

                        {/* Admin notes */}
                        {selected.adminNotes?.length > 0 && (
                            <div>
                                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-2 text-right">הערות פנימיות</p>
                                <div className="space-y-2">
                                    {selected.adminNotes.map((n, i) => (
                                        <div key={i} className="p-3 rounded-xl text-right"
                                            style={{ background: 'rgba(88,86,214,0.05)', border: '1px solid rgba(88,86,214,0.12)' }}>
                                            <p className="text-[#5856D6] text-[10px] font-black mb-1">{n.date}</p>
                                            <p className="text-[#1D1D1F] text-sm">{n.note}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add admin note */}
                        <div className="border-t border-black/06 pt-4 space-y-2">
                            <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest text-right">הוסף הערה פנימית</p>
                            <div className="flex gap-2">
                                <input
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    placeholder="הערה..."
                                    dir="rtl"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-right outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                />
                                <AdminButton onClick={handleAddNote} disabled={!noteText.trim()}>שמור</AdminButton>
                            </div>
                        </div>

                        {/* Status change */}
                        <div className="border-t border-black/06 pt-4">
                            <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-3 text-right">עדכן סטטוס</p>
                            <div className="flex flex-wrap gap-2 mb-3 justify-end">
                                {QUOTE_STATUSES.slice(1).map(s => (
                                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                                        className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                        style={{
                                            background: newStatus === s ? (QUOTE_STATUS_COLORS[s] || '#007AFF') : 'rgba(0,0,0,0.06)',
                                            color: newStatus === s ? 'white' : '#6E6E73',
                                            boxShadow: newStatus === s ? `0 4px 12px ${(QUOTE_STATUS_COLORS[s] || '#007AFF')}40` : 'none',
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <AdminButton variant="ghost" onClick={() => setSelected(null)}>סגור</AdminButton>
                                <AdminButton onClick={handleStatusSave} disabled={!newStatus}>
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

// ════════════════════════════════════════════════════════════════════════════
// ORDERS (legacy / future paid orders)
// ════════════════════════════════════════════════════════════════════════════
function OrdersList() {
    const { orders, updateOrderStatus, inventory } = useAdminData();
    const { showToast } = useAdminToast();

    const savedFilters = (() => { try { return JSON.parse(sessionStorage.getItem('admin_orders_filters') || '{}'); } catch { return {}; } })();
    const [search, setSearch]             = useState(savedFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || 'הכל');
    const [dateFilter, setDateFilter]     = useState(savedFilters.dateFilter || 'all');
    const [selected, setSelected]         = useState(null);
    const [newStatus, setNewStatus]       = useState('');
    const [saved, setSaved]               = useState(false);

    useEffect(() => {
        sessionStorage.setItem('admin_orders_filters', JSON.stringify({ search, statusFilter, dateFilter }));
    }, [search, statusFilter, dateFilter]);

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
        new:       orders.filter(o => o.status === 'חדש').length,
        pending:   orders.filter(o => o.status === 'ממתין').length,
        shipped:   orders.filter(o => o.status === 'נשלח').length,
        delivered: orders.filter(o => o.status === 'נמסר').length,
    }), [orders]);

    const handleStatusChange = () => {
        if (!newStatus || !selected) return;
        updateOrderStatus(selected.id, newStatus);
        setSelected(prev => ({ ...prev, status: newStatus }));
        setSaved(true);
        setTimeout(() => { setSaved(false); setNewStatus(''); }, 1200);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="חדשות" value={stats.new} color="#FF3B30" Icon={AlertCircle}
                    tooltip="הזמנות חדשות שנקלטו ועדיין לא טופלו." />
                <Stat label="ממתינות" value={stats.pending} color="#FF9500" Icon={Bell}
                    tooltip="הזמנות באישור — ממתינות לאישור פנימי לפני שילוח." />
                <Stat label="נשלחו" value={stats.shipped} color="#5856D6" Icon={Package}
                    tooltip="הזמנות שיצאו לשילוח — בדרך ללקוח." />
                <Stat label="נמסרו" value={stats.delivered} color="#34C759" Icon={CheckCircle2}
                    tooltip="הזמנות שנמסרו בהצלחה ללקוח." />
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי לקוח, מספר הזמנה, מוצר, עיר..." />
                </div>
                <div className="flex flex-wrap gap-3">
                    <AdminFilterPills options={ORDER_STATUSES} active={statusFilter} onChange={setStatusFilter} />
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>

            <div className="space-y-3 mt-4">
                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_2fr_1fr_auto_auto_auto] gap-4 px-6 py-2 text-right">
                        {['', 'מס׳ / תאריך', 'לקוח / מוצר', 'סה״כ', 'סטטוס', '', ''].map((h, i) => (
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
                            onClick={() => { setSelected(order); setNewStatus(''); setSaved(false); }}
                            className="grid grid-cols-[auto_1fr_2fr_1fr_auto_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        >
                            <Avatar name={order.customer} />
                            <div className="text-right">
                                <p className="text-[#007AFF] font-black text-xs group-hover:text-[#5856D6] transition-colors">{order.id}</p>
                                <p className="text-[#AEAEB2] text-[10px] mt-0.5">{order.date}</p>
                            </div>
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate">{order.customer}</p>
                                <p className="text-[#AEAEB2] text-[10px] truncate">{order.product} · {order.qty} יח׳</p>
                            </div>
                            <p className="text-[#1D1D1F] font-black text-sm">₪{(order.total || 0).toLocaleString()}</p>
                            <QuickDropdown item={order} statuses={ORDER_STATUSES} colors={ORDER_STATUS_COLORS} onUpdate={handleQuickStatus} />
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                {order.status !== 'אושר' && order.status !== 'נמסר' && order.status !== 'בוטל' && (
                                    <motion.button whileTap={{ scale: 0.88 }}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, 'אושר'); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#34C759,#30D158)', boxShadow: '0 2px 8px rgba(52,199,89,0.35)' }}>
                                        אשר
                                    </motion.button>
                                )}
                                {order.status !== 'בוטל' && (
                                    <motion.button whileTap={{ scale: 0.88 }}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, 'בוטל'); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#FF3B30,#FF453A)', boxShadow: '0 2px 8px rgba(255,59,48,0.30)' }}>
                                        בטל
                                    </motion.button>
                                )}
                            </div>
                            <motion.span whileHover={{ x: -3 }} className="text-[#AEAEB2] group-hover:text-[#007AFF] text-xs font-bold shrink-0 transition-colors">←</motion.span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-3 text-[#AEAEB2]">
                        <Package size={40} className="opacity-30" />
                        <p className="text-sm font-bold text-[#6E6E73]">אין הזמנות תואמות לחיפוש</p>
                    </div>
                )}
            </div>

            {filtered.length > 0 && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[#1D1D1F] font-black text-base">₪{totalRevenue.toLocaleString()}</span>
                    <span className="text-[#86868B] text-sm">{filtered.length} הזמנות מוצגות</span>
                </div>
            )}

            <AdminModal open={!!selected} onClose={() => setSelected(null)} title={`הזמנה ${selected?.id || ''}`} size="md">
                {selected && (
                    <div className="space-y-5" dir="rtl">
                        {selected.status !== 'בוטל' && (
                            <div className="rounded-2xl p-4"
                                style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.10)' }}>
                                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-2 text-right">מצב הזמנה</p>
                                <StatusTimeline status={selected.status} flow={ORDER_STATUS_FLOW} colors={ORDER_STATUS_COLORS} />
                            </div>
                        )}
                        <div className="flex gap-4">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 border border-black/04 flex items-center justify-center">
                                {(() => {
                                    const inv = inventory.find(p => String(p.id) === String(selected.productId));
                                    const backup = initialProducts.find(p => String(p.id) === String(selected.productId));
                                    const img = selected.productImage || inv?.image || backup?.image;
                                    return img ? <img src={img} alt={selected.product} className="w-full h-full object-cover" /> : <Box size={32} className="text-[#AEAEB2] opacity-40" />;
                                })()}
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                {[
                                    ['לקוח', selected.customer], ['עיר', selected.city],
                                    ['טלפון', selected.phone], ['מייל', selected.email],
                                    ['מוצר', selected.product], ['כמות', selected.qty],
                                    ['תאריך', selected.date], ['סה״כ', `₪${(selected.total || 0).toLocaleString()}`],
                                ].map(([l, v]) => (
                                    <div key={l} className="text-right p-3 rounded-xl"
                                        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <p className="text-[#AEAEB2] text-[10px] font-black uppercase tracking-widest">{l}</p>
                                        <p className="text-[#1D1D1F] font-bold text-sm mt-0.5 truncate">{v || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-black/06 pt-4">
                            <p className="text-[#86868B] text-[10px] font-black uppercase tracking-widest mb-3 text-right">עדכן סטטוס</p>
                            <div className="flex flex-wrap gap-2 mb-3 justify-end">
                                {ORDER_STATUSES.slice(1).map(s => (
                                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                                        className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                        style={{
                                            background: newStatus === s ? ORDER_STATUS_COLORS[s] : 'rgba(0,0,0,0.06)',
                                            color: newStatus === s ? 'white' : '#6E6E73',
                                            boxShadow: newStatus === s ? `0 4px 12px ${ORDER_STATUS_COLORS[s]}40` : 'none',
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <AdminButton variant="ghost" onClick={() => setSelected(null)}>סגור</AdminButton>
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

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — tab toggle between quotes and orders
// ════════════════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'quotes', label: 'הצעות מחיר', Icon: FileText },
    { id: 'orders', label: 'הזמנות',     Icon: Package },
];

export default function AdminOrders() {
    const { quotes, orders } = useAdminData();
    const [tab, setTab] = useState('quotes');

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title={tab === 'quotes' ? 'הצעות מחיר' : 'הזמנות'}
                subtitle={tab === 'quotes'
                    ? `${quotes.length} בקשות · ${quotes.filter(q => q.status === 'חדש').length} חדשות`
                    : `${orders.length} הזמנות · ₪${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()} הכנסה כוללת`}
            />

            {/* Tab toggle */}
            <div className="flex p-1 rounded-2xl gap-1 w-fit" style={glass}>
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 cursor-pointer"
                        style={tab === t.id
                            ? { background: '#007AFF', color: 'white', boxShadow: '0 4px 14px rgba(0,122,255,0.35)' }
                            : { color: '#86868B' }}>
                        <t.Icon size={14} />
                        {t.label}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                            style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)' }}>
                            {t.id === 'quotes' ? quotes.length : orders.length}
                        </span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}>
                    {tab === 'quotes' ? <QuotesPipeline /> : <OrdersList />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
