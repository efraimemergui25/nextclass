/* eslint-disable */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InboxIcon, Trash2, Check, Users, ShoppingCart, TrendingUp, ChevronLeft, Box, MapPin, Package, Plus, Pencil } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { useAdminToast } from '../context/AdminToastContext';
import { StatusBadge, AdminSearchBar, AdminButton, AdminModal, AdminInput, AdminTabs, AdminDateFilter, filterByDate, AdminKPICard, AdminEmpty, AdminSkeleton } from '../components/AdminComponents';
import { PALETTE, GLASS, RADIUS, hexA, toneColor, toneBg, toneFg } from '../theme/tokens';
import DashDrillView from '../components/DashDrillView';

// ─── Customers accent — unified brand azure (de-rainbowed) ────────────────────
const ACCENT = '#007AFF';

// ─── Liquid-glass surface (token-driven — one system everywhere) ──────────────
const glass = { ...GLASS.base };

const CONTACT_STATUSES = ['חדש', 'בטיפול', 'נסגר'];

// ─── Avatar ────────────────────────────────────────────────────────────────────
// De-rainbowed — every avatar uses the single brand azure→indigo gradient.
function Avatar({ name, size = 9 }) {
    return (
        <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-black text-white shrink-0`}
            style={{ background: 'linear-gradient(135deg, #007AFF, #5AC8FA)', width: size * 4, height: size * 4 }}>
            {name?.[0] || '?'}
        </div>
    );
}

// ─── Babushka drill primitives (shared visual grammar with the dashboard) ─────
// A tidy stat grid used across every drill level.
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

// A clickable/inert record row inside a drill level. Clickable rows push a deeper level.
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

const custDateStr = (o) => o?.date || (o?.dateTs ? new Date(o.dateTs).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function AdminCustomers() {
    const { contacts, orders, quotes, updateContactStatus, upsertContact, deleteContact, restoreContact, hardDeleteContact, deletedItems, loading } = useAdminData();
    const confirm = useAdminConfirm();
    const { showToast } = useAdminToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState('customers');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [replyDone, setReplyDone] = useState(false);

    // ── Manual add / edit contact form (null = closed) ────────────────────────
    const [contactForm, setContactForm] = useState(null);
    const [savingContact, setSavingContact] = useState(false);
    const EMPTY_CONTACT = { name: '', institution: '', phone: '', email: '', city: '', address: '', subject: '', status: 'חדש' };
    const openNewContact = () => setContactForm({ ...EMPTY_CONTACT });
    const openEditContact = (c) => setContactForm({
        id: c.id, name: c.name || '', institution: c.institution || '', phone: c.phone || '',
        email: c.email || '', city: c.city || '', address: c.address || '', subject: c.subject || '', status: c.status || 'חדש',
    });
    const setCF = (k, v) => setContactForm(f => ({ ...f, [k]: v }));
    const saveContactForm = async () => {
        if (!contactForm) return;
        if (!contactForm.name && !contactForm.phone && !contactForm.email) {
            return; // need at least one identifier
        }
        setSavingContact(true);
        try {
            const isEdit = !!contactForm.id;
            const id = await upsertContact({ ...contactForm, source: isEdit ? undefined : 'manual', extra: { subject: contactForm.subject || '' } });
            setContactForm(null);
            if (contactForm.id && selected?.id === contactForm.id) {
                setSelected(prev => ({ ...prev, ...contactForm }));
            }
            showToast(isEdit ? 'פרטי הלקוח עודכנו ✓' : 'לקוח חדש נוסף ✓', 'success');
            return id;
        } catch (err) {
            console.error('[saveContactForm]', err);
            showToast('שגיאה בשמירת הלקוח', 'error');
        } finally { setSavingContact(false); }
    };
    const deleteContactRow = async (c, e) => {
        e?.stopPropagation();
        if (await confirm({ message: `להעביר את "${c.name || 'הפנייה'}" לסל המחזור?`, danger: true })) {
            deleteContact(c.id);
            if (selected?.id === c.id) setSelected(null);
        }
    };

    // ── Babushka drill stack — each entry is one nested detail level ──────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null); // retains last level through the exit animation
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };

    // Unified customer directory — merges storefront orders, the quotes/orders
    // pipeline (where OCR + AI-created orders land) and standalone contacts, so
    // every buyer or lead surfaces here, keyed by phone→email→name to de-dupe.
    const customers = useMemo(() => {
        const map = {};
        const digits = (p) => (p || '').toString().replace(/\D/g, '');
        const keyOf = (name, email, phone) => {
            const ph = digits(phone);
            if (ph.length >= 7) return 'p:' + ph;
            if (email) return 'e:' + email.toString().trim().toLowerCase();
            const n = (name || '').toString().trim();
            return n ? 'n:' + n : '';
        };
        const ensure = (name, email, phone, city) => {
            const k = keyOf(name, email, phone);
            if (!k) return null;
            if (!map[k]) map[k] = { name: name || email || phone || 'לקוח', email: email || '', phone: phone || '', city: city || '', orders: [], total: 0 };
            const m = map[k];
            if (!m.email && email) m.email = email;
            if (!m.phone && phone) m.phone = phone;
            if (!m.city && city) m.city = city;
            if ((!m.name || m.name === 'לקוח') && name) m.name = name;
            return m;
        };
        orders.forEach(o => {
            const m = ensure(o.customer, o.email, o.phone, o.city);
            if (m) { m.orders.push(o); m.total += o.total || 0; }
        });
        (quotes || []).forEach(q => {
            const m = ensure(q.contactName || q.customer, q.email, q.phone, q.city);
            if (m) { m.orders.push(q); m.total += q.total || q.subtotal || 0; }
        });
        (contacts || []).forEach(c => { ensure(c.name, c.email, c.phone, c.city); });
        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [orders, quotes, contacts]);

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
        { id: 'customers', label: 'לקוחות', count: customers.length },
        { id: 'contacts', label: 'פניות', count: contacts.length },
        { id: 'trash', label: 'סל מחזור', count: trashCount },
    ];

    const newContacts = contacts.filter(c => c.status === 'חדש').length;
    const totalRevenue = customers.reduce((s, c) => s + c.total, 0);

    return (
        <div dir="rtl" className="space-y-5">
            {/* ── Header — azure icon circle (only color) + ink title, no glow ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(ACCENT, 0.12), border: `1px solid ${hexA(ACCENT, 0.20)}` }}>
                    <Users size={22} color={ACCENT} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>לקוחות ופניות</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>{customers.length} לקוחות · {newContacts} פניות חדשות</p>
                </div>
            </div>

            {/* ── KPI band — teal primary + semantic accents ── */}
            <div className="grid grid-cols-3 gap-4">
                <AdminKPICard title="לקוחות" value={customers.length} subtitle="לקוחות פעילים" accent={ACCENT} delay={0}
                    icon={<Users size={20} color={ACCENT} />} onClick={() => openDrill({ type: 'customersKpi' })} />
                <AdminKPICard title="פניות חדשות" value={newContacts} subtitle="ממתינות לטיפול" accent={PALETTE.red} delay={0.05}
                    icon={<InboxIcon size={20} color={PALETTE.red} />} onClick={() => openDrill({ type: 'contactsKpi' })} />
                <AdminKPICard title="הכנסה כוללת" value={`₪${totalRevenue.toLocaleString()}`} subtitle="מכלל הלקוחות" accent={PALETTE.green} delay={0.1}
                    icon="revenue" onClick={() => openDrill({ type: 'revenueKpi' })} />
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
                {tab !== 'trash' && (
                    <motion.button whileTap={{ scale: 0.96 }} onClick={openNewContact}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,122,255,0.30)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Plus size={16} strokeWidth={2.6} /> {tab === 'customers' ? 'לקוח חדש' : 'פנייה חדשה'}
                    </motion.button>
                )}
            </div>

            {/* Contacts Tab */}
            {tab === 'contacts' && (
                <div className="mt-4">
                    {loading ? <AdminSkeleton rows={6} /> : filteredContacts.length === 0 ? (
                        <div style={{ ...glass, borderRadius: RADIUS.card, overflow: 'hidden' }}>
                            <AdminEmpty icon="empty"
                                title={contacts.length === 0 ? 'אין פניות עדיין' : 'אין פניות תואמות'}
                                subtitle={contacts.length === 0 ? 'פניות חדשות מטופס יצירת הקשר יופיעו כאן אוטומטית' : 'נסה לשנות את החיפוש או את סינון התאריך'} />
                        </div>
                    ) : (
                        <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                            {/* Column header */}
                            <div className="hidden lg:grid grid-cols-[minmax(220px,1.9fr)_120px_minmax(0,1.5fr)_150px] gap-5 px-6 py-3 bg-gradient-to-l from-black/[0.02] to-transparent">
                                {['לקוח', 'סטטוס', 'נושא הפנייה', 'תאריך'].map((h, i) => (
                                    <p key={i} className="text-[10px] font-black tracking-[0.14em] text-[#AEAEB2] uppercase">{h}</p>
                                ))}
                            </div>
                            <AnimatePresence initial={false}>
                                {filteredContacts.map((c, i) => (
                                    <motion.div
                                        key={c.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: i * 0.012, duration: 0.2 }}
                                        onClick={() => { setSelected(c); setReply(''); setReplyDone(false); }}
                                        tabIndex={0} role="button"
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(c); setReply(''); setReplyDone(false); } }}
                                        className="relative grid grid-cols-[minmax(220px,1.9fr)_120px_minmax(0,1.5fr)_150px] gap-5 px-6 py-3.5 items-center cursor-pointer border-t border-black/[0.05] transition-colors hover:bg-[#007AFF]/[0.035] focus:outline-none focus-visible:bg-[#007AFF]/[0.05] group"
                                    >
                                        {/* hover accent rail (right edge in RTL) */}
                                        <span className="absolute right-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Identity */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <Avatar name={c.name} size={11} />
                                                {c.status === 'חדש' && <span className="absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full bg-[#FF3B30] border-2 border-white" />}
                                            </div>
                                            <div className="text-right min-w-0">
                                                <p className="text-[#1D1D1F] font-bold text-[14px] truncate leading-tight group-hover:text-[#007AFF] transition-colors">{c.name || '—'}</p>
                                                <p dir="ltr" className="text-[#8E8E93] text-[12px] truncate text-right mt-0.5">{c.email || '—'}</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="min-w-0"><StatusBadge status={c.status} pulse={c.status === 'חדש'} /></div>

                                        {/* Subject */}
                                        <div className="min-w-0 text-right hidden lg:block">
                                            {c.subject
                                                ? <p className="text-[#3A3A3C] text-[13px] line-clamp-1">{c.subject}</p>
                                                : <span className="text-[#C7C7CC] text-[12px]">— ללא נושא —</span>}
                                        </div>

                                        {/* Date + hover actions */}
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-[#AEAEB2] text-[12px] whitespace-nowrap tabular-nums group-hover:opacity-0 transition-opacity duration-150">{custDateStr(c)}</span>
                                            <div className="absolute left-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                                <button title="עריכה" onClick={(e) => { e.stopPropagation(); openEditContact(c); }}
                                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors"
                                                    style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button title="מחק" onClick={(e) => deleteContactRow(c, e)}
                                                    className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors"
                                                    style={{ background: toneBg('danger'), color: toneColor('danger') }}>
                                                    <Trash2 size={14} />
                                                </button>
                                                <ChevronLeft size={16} className="text-[#C7C7CC]" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}

            {/* Customers Tab */}
            {tab === 'customers' && (
                <div className="mt-4">
                    {loading ? <AdminSkeleton rows={6} /> : filteredCustomers.length === 0 ? (
                        <div style={{ ...glass, borderRadius: RADIUS.card, overflow: 'hidden' }}>
                            <AdminEmpty icon="empty"
                                title={customers.length === 0 ? 'אין לקוחות עדיין' : 'אין לקוחות תואמים'}
                                subtitle={customers.length === 0 ? 'לקוחות ייווצרו אוטומטית מהזמנות שנקלטות במערכת' : 'נסה לשנות את מונחי החיפוש'} />
                        </div>
                    ) : (
                        <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" dir="rtl" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                            {/* Column header */}
                            <div className="hidden lg:grid grid-cols-[minmax(220px,1.8fr)_minmax(0,1.4fr)_110px_90px_120px] gap-5 px-6 py-3 bg-gradient-to-l from-black/[0.02] to-transparent">
                                {['לקוח', 'מייל / טלפון', 'עיר', 'הזמנות', 'סה״כ'].map((h, i) => (
                                    <p key={i} className={`text-[10px] font-black tracking-[0.14em] text-[#AEAEB2] uppercase ${i >= 3 ? 'text-left' : ''}`}>{h}</p>
                                ))}
                            </div>
                            <AnimatePresence initial={false}>
                                {filteredCustomers.map((c, i) => (
                                    <motion.div
                                        key={c.phone || c.email || c.name || i}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: i * 0.012, duration: 0.2 }}
                                        onClick={() => openDrill({ type: 'customer', name: c.name })}
                                        tabIndex={0} role="button"
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'customer', name: c.name }); } }}
                                        className="relative grid grid-cols-[minmax(220px,1.8fr)_minmax(0,1.4fr)_110px_90px_120px] gap-5 px-6 py-3.5 items-center cursor-pointer border-t border-black/[0.05] transition-colors hover:bg-[#007AFF]/[0.035] focus:outline-none focus-visible:bg-[#007AFF]/[0.05] group"
                                    >
                                        <span className="absolute right-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        {/* Identity */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar name={c.name} size={11} />
                                            <p className="text-[#1D1D1F] font-bold text-[14px] truncate group-hover:text-[#007AFF] transition-colors">{c.name}</p>
                                        </div>

                                        {/* Email / phone */}
                                        <div className="text-right min-w-0">
                                            <p dir="ltr" className="text-[#6E6E73] text-[12.5px] truncate text-right">{c.email || '—'}</p>
                                            <p dir="ltr" className="text-[#AEAEB2] text-[11px] mt-0.5 truncate text-right">{c.phone || '—'}</p>
                                        </div>

                                        {/* City */}
                                        <p className="text-[#6E6E73] text-[13px] font-medium truncate">{c.city || '—'}</p>

                                        {/* Orders count */}
                                        <div>
                                            <span className="inline-flex items-center gap-1 text-[12px] font-black px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF' }}>
                                                <Package size={11} />{c.orders.length}
                                            </span>
                                        </div>

                                        {/* Total */}
                                        <p className="text-[#1D1D1F] font-black text-[14px] text-left tabular-nums">₪{c.total.toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
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
                                        style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', boxShadow: '0 4px 12px rgba(0,122,255,0.28)', textDecoration: 'none' }}>
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
                            <div className="flex gap-2">
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={async () => { if (await confirm({ message: 'להעביר פנייה זו לסל המחזור?', danger: true })) { deleteContact(selected.id); setSelected(null); } }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 12, border: `1px solid ${hexA(toneColor('danger'), 0.18)}`, background: toneBg('danger'), color: toneColor('danger'), cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                    <Trash2 size={13} />מחק
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => openEditContact(selected)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(0,122,255,0.20)', background: 'rgba(0,122,255,0.07)', color: '#007AFF', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                    <Pencil size={13} />ערוך פרטים
                                </motion.button>
                            </div>
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

            {/* ── Add / Edit contact modal ─────────────────────────────────── */}
            <AdminModal open={!!contactForm} onClose={() => setContactForm(null)} title={contactForm?.id ? 'עריכת פרטי לקוח' : 'לקוח / פנייה חדשה'} size="md">
                {contactForm && (
                    <div className="space-y-4" dir="rtl">
                        <div className="grid grid-cols-2 gap-3">
                            <AdminInput label="שם מלא" value={contactForm.name} onChange={v => setCF('name', v)} placeholder="שם הלקוח" />
                            <AdminInput label="מוסד / חברה" value={contactForm.institution} onChange={v => setCF('institution', v)} placeholder="שם המוסד" />
                            <AdminInput label="טלפון" value={contactForm.phone} onChange={v => setCF('phone', v)} placeholder="050-0000000" />
                            <AdminInput label="מייל" value={contactForm.email} onChange={v => setCF('email', v)} placeholder="name@example.com" />
                            <AdminInput label="עיר" value={contactForm.city} onChange={v => setCF('city', v)} placeholder="עיר" />
                            <AdminInput label="כתובת" value={contactForm.address} onChange={v => setCF('address', v)} placeholder="רחוב ומספר" />
                        </div>
                        <AdminInput label="נושא / הערה" value={contactForm.subject} onChange={v => setCF('subject', v)} placeholder="נושא הפנייה או הערה" />

                        <div className="flex flex-wrap gap-2 justify-end items-center">
                            <p className="text-[#86868B] text-[10px] font-black tracking-tight">סטטוס:</p>
                            {CONTACT_STATUSES.map(s => (
                                <motion.button key={s} type="button" whileTap={{ scale: 0.95 }} onClick={() => setCF('status', s)}
                                    className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                    style={{ background: contactForm.status === s ? '#007AFF' : 'rgba(0,0,0,0.06)', color: contactForm.status === s ? 'white' : '#6E6E73', boxShadow: contactForm.status === s ? '0 4px 12px rgba(0,122,255,0.30)' : 'none' }}>
                                    {s}
                                </motion.button>
                            ))}
                        </div>

                        <p className="text-[#AEAEB2] text-[11px] text-right">יש למלא לפחות שם, טלפון או מייל.</p>

                        <div className="flex gap-2 justify-end">
                            <AdminButton variant="ghost" onClick={() => setContactForm(null)}>ביטול</AdminButton>
                            <AdminButton onClick={saveContactForm} disabled={savingContact || (!contactForm.name && !contactForm.phone && !contactForm.email)}>
                                {savingContact ? 'שומר...' : contactForm.id ? 'שמור שינויים' : 'צור לקוח'}
                            </AdminButton>
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* ── Babushka Drill Drawer — nested glass detail view ───────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;

                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const custByRevenue = [...customers].sort((a, b) => b.total - a.total);
                const avgOrders = customers.length ? Math.round(customers.reduce((s, c) => s + c.orders.length, 0) / customers.length) : 0;

                let title = '', subtitle = '', icon = null, accent = '#007AFF', footer = null, body = null;

                if (shown.type === 'customersKpi') {
                    title = 'לקוחות'; subtitle = `${customers.length} לקוחות פעילים`; accent = ACCENT;
                    icon = <Users size={17} color={ACCENT} />;
                    footer = { label: 'הצג רשימת לקוחות', onClick: () => { setTab('customers'); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'לקוחות', value: customers.length, color: ACCENT },
                                { label: 'הזמנות בממוצע', value: avgOrders, color: '#5AC8FA' },
                                { label: 'הכנסה כוללת', value: `₪${totalRevenue.toLocaleString()}`, color: '#34C759' },
                            ]} />
                            {customers.length === 0 ? (
                                <DrillEmpty icon={Users} text="אין לקוחות עדיין — ייווצרו אוטומטית מהזמנות" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מובילים לפי רכישות — לחץ לצלילה</p>
                                    {custByRevenue.slice(0, 12).map((c, i) => (
                                        <DrillRow key={c.phone || c.email || c.name || i} delay={i * 0.03} tone={ACCENT}
                                            onClick={() => pushDrill({ type: 'customer', name: c.name })}
                                            leading={<div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-black shrink-0" style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)' }}>{c.name?.[0] || '?'}</div>}
                                            title={c.name}
                                            subtitle={`${c.orders.length} הזמנות · ${c.city || '—'}`}
                                            trailing={<span className="text-[12px] font-black text-[#34C759] shrink-0">₪{c.total.toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'contactsKpi') {
                    const byNew = contacts.filter(c => c.status === 'חדש');
                    const byWork = contacts.filter(c => c.status === 'בטיפול').length;
                    const byClosed = contacts.filter(c => c.status === 'נסגר').length;
                    const list = [...contacts].sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                    title = 'פניות'; subtitle = `${newContacts} חדשות מתוך ${contacts.length}`; accent = PALETTE.red;
                    icon = <InboxIcon size={17} color={PALETTE.red} />;
                    footer = { label: 'הצג רשימת פניות', onClick: () => { setTab('contacts'); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'חדשות', value: byNew.length, color: PALETTE.red },
                                { label: 'בטיפול', value: byWork, color: '#007AFF' },
                                { label: 'נסגרו', value: byClosed, color: '#34C759' },
                            ]} />
                            {contacts.length === 0 ? (
                                <DrillEmpty icon={InboxIcon} text="אין פניות עדיין" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פניות אחרונות — לחץ לפרטים</p>
                                    {list.slice(0, 12).map((c, i) => (
                                        <DrillRow key={c.id} delay={i * 0.03} tone={PALETTE.red}
                                            onClick={() => pushDrill({ type: 'contact', id: c.id })}
                                            leading={<StatusBadge status={c.status} pulse={c.status === 'חדש'} />}
                                            title={c.name || '—'}
                                            subtitle={c.subject || c.email || '—'}
                                            trailing={<span className="text-[10px] text-[#AEAEB2] shrink-0 whitespace-nowrap">{c.date || '—'}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'revenueKpi') {
                    const avgPer = customers.length ? Math.round(totalRevenue / customers.length) : 0;
                    title = 'הכנסה כוללת'; subtitle = 'מכלל הלקוחות'; accent = '#34C759';
                    icon = <TrendingUp size={17} color="#34C759" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הכנסה כוללת', value: `₪${totalRevenue.toLocaleString()}`, color: '#34C759' },
                                { label: 'לקוחות', value: customers.length, color: ACCENT },
                                { label: 'ממוצע ללקוח', value: `₪${avgPer.toLocaleString()}`, color: '#5AC8FA' },
                            ]} />
                            {custByRevenue.length === 0 ? (
                                <DrillEmpty icon={TrendingUp} text="טרם נרשמו הכנסות" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">תרומה לפי לקוח — לחץ לצלילה</p>
                                    {custByRevenue.slice(0, 12).map((c, i) => (
                                        <DrillRow key={c.phone || c.email || c.name || i} delay={i * 0.03} tone="#34C759"
                                            onClick={() => pushDrill({ type: 'customer', name: c.name })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={c.name}
                                            subtitle={`${c.orders.length} הזמנות`}
                                            trailing={<span className="text-[12px] font-black text-[#34C759] shrink-0">₪{c.total.toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'customer') {
                    const c = customers.find(x => x.name === shown.name);
                    title = c ? c.name : 'לקוח'; accent = ACCENT;
                    subtitle = c ? `${c.orders.length} הזמנות · ₪${c.total.toLocaleString()}` : shown.name;
                    icon = <Users size={17} color={ACCENT} />;
                    const firstOrderId = c?.orders?.[0]?.id;
                    footer = { label: 'פתח בהזמנות', onClick: () => drillTo(firstOrderId ? `/admin/orders?orderId=${firstOrderId}` : '/admin/orders') };
                    const phone = c?.phone?.replace(/\D/g, '');
                    const waLink = phone ? `https://wa.me/972${phone.replace(/^0/, '')}` : null;
                    body = c ? (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הזמנות', value: c.orders.length, color: ACCENT },
                                { label: 'סה״כ רכישות', value: `₪${c.total.toLocaleString()}`, color: '#34C759' },
                                { label: 'הזמנה ממוצעת', value: `₪${(c.orders.length ? Math.round(c.total / c.orders.length) : 0).toLocaleString()}`, color: '#5AC8FA' },
                            ]} />
                            <div className="space-y-2">
                                {c.email && <DrillRow leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(ACCENT, 0.1) }}><InboxIcon size={13} color={ACCENT} /></span>} title={c.email} subtitle="מייל" />}
                                {c.phone && <DrillRow leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#34C759', 0.1) }}><ShoppingCart size={13} color="#34C759" /></span>} title={c.phone} subtitle="טלפון" />}
                                {c.city && <DrillRow leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#FF9500', 0.1) }}><MapPin size={13} color="#FF9500" /></span>} title={c.city} subtitle="עיר" />}
                            </div>
                            {(waLink || c.phone) && (
                                <div className="flex gap-2">
                                    {waLink && (
                                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] text-white"
                                            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 12px rgba(37,211,102,0.28)' }}>WhatsApp</a>
                                    )}
                                    {c.phone && (
                                        <a href={`tel:${c.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-black text-[12px] text-white"
                                            style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', boxShadow: '0 4px 12px rgba(0,122,255,0.25)' }}>התקשר</a>
                                    )}
                                </div>
                            )}
                            {c.orders.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">היסטוריית הזמנות — לחץ לפרטים</p>
                                    {c.orders.map((o, i) => (
                                        <DrillRow key={o.id || i} delay={i * 0.03}
                                            onClick={() => pushDrill({ type: 'order', id: o.id })}
                                            leading={<StatusBadge status={o.status} />}
                                            title={o.product || `הזמנה ${o.id || ''}`}
                                            subtitle={`${custDateStr(o)} · ${o.qty || 1} יח׳`}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{(o.total || 0).toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            ) : <DrillEmpty icon={ShoppingCart} text="אין הזמנות ללקוח זה" />}
                        </div>
                    ) : <DrillEmpty icon={Users} text="הלקוח לא נמצא" />;
                } else if (shown.type === 'contact') {
                    const c = contacts.find(x => x.id === shown.id);
                    const notes = c ? loadNotes(c.id) : [];
                    title = c ? (c.name || 'פנייה') : 'פנייה'; subtitle = c?.email || ''; accent = PALETTE.red;
                    icon = <InboxIcon size={17} color={PALETTE.red} />;
                    footer = c ? { label: 'פתח לטיפול', onClick: () => { closeDrill(); setSelected(c); setReply(''); setReplyDone(false); } } : null;
                    body = c ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <StatusBadge status={c.status} pulse={c.status === 'חדש'} />
                                <span className="text-[11px] text-[#AEAEB2] font-medium">{c.date || '—'}</span>
                            </div>
                            {c.subject && (
                                <div className="rounded-[14px] p-4 text-right" style={{ background: hexA(ACCENT, 0.05), border: `1px solid ${hexA(ACCENT, 0.1)}` }}>
                                    <p className="text-[#86868B] text-[10px] font-black tracking-tight mb-1">נושא</p>
                                    <p className="text-[#1D1D1F] font-bold text-sm">{c.subject}</p>
                                </div>
                            )}
                            {c.message && (
                                <div className="rounded-[14px] p-4 text-right" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <p className="text-[#AEAEB2] text-[10px] font-black tracking-tight mb-2">הודעה</p>
                                    <p className="text-[#1D1D1F] text-sm leading-relaxed whitespace-pre-line">{c.message}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                {c.email && <DrillRow leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(ACCENT, 0.1) }}><InboxIcon size={13} color={ACCENT} /></span>} title={c.email} subtitle="מייל" />}
                                {c.phone && <DrillRow leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#34C759', 0.1) }}><ShoppingCart size={13} color="#34C759" /></span>} title={c.phone} subtitle="טלפון" />}
                            </div>
                            {notes.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">היסטוריית הערות</p>
                                    {notes.map((n, i) => (
                                        <div key={i} className="rounded-[12px] px-3 py-2.5 text-right" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <p className="text-[#1D1D1F] text-xs leading-relaxed">{n.text}</p>
                                            <p className="text-[#AEAEB2] text-[10px] mt-1">{n.date} · {n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : <DrillEmpty icon={InboxIcon} text="הפנייה לא נמצאה" />;
                } else if (shown.type === 'order') {
                    const o = orders.find(x => String(x.id) === String(shown.id));
                    const items = o?.items || [];
                    const units = o ? (items.reduce((s, it) => s + (Number(it.qty) || 1), 0) || o.qty || items.length) : 0;
                    title = o ? (o.customer || o.product || 'הזמנה') : 'הזמנה';
                    subtitle = o ? `#${o.id} · ${custDateStr(o)}` : String(shown.id); accent = ACCENT;
                    icon = <ShoppingCart size={17} color={ACCENT} />;
                    footer = { label: 'פתח בהזמנות', onClick: () => drillTo(`/admin/orders?orderId=${shown.id}`) };
                    body = o ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <StatusBadge status={o.status} />
                                <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">₪{(o.total || 0).toLocaleString()}</p>
                            </div>
                            <DrillStat items={[
                                { label: 'פריטים', value: units, color: ACCENT },
                                { label: 'סכום', value: `₪${(o.total || 0).toLocaleString()}`, color: '#34C759' },
                                { label: 'תאריך', value: o.dateTs ? new Date(o.dateTs).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : (o.date || '—') },
                            ]} />
                            {items.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פריטים בהזמנה — לחץ למוצר</p>
                                    {items.map((it, i) => (
                                        <DrillRow key={i} delay={i * 0.03}
                                            onClick={() => pushDrill({ type: 'orderItem', name: it.title || it.name, image: it.image, qty: it.qty, price: it.price })}
                                            leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                            title={it.title || it.name || `פריט ${i + 1}`}
                                            subtitle={`${it.qty || 1} × ₪${(Number(it.price) || 0).toLocaleString()}`}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{((Number(it.price) || 0) * (Number(it.qty) || 1)).toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            ) : o.product ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצר — לחץ למלאי</p>
                                    <DrillRow
                                        onClick={() => pushDrill({ type: 'orderItem', name: o.product, qty: o.qty, price: o.total })}
                                        leading={<div className="w-8 h-8 rounded-lg bg-[#F5F5F7] shrink-0 flex items-center justify-center"><Box size={13} className="text-[#AEAEB2]" /></div>}
                                        title={o.product}
                                        subtitle={`${o.qty || 1} יח׳`}
                                        trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{(o.total || 0).toLocaleString()}</span>}
                                    />
                                </div>
                            ) : <DrillEmpty icon={Package} text="אין פריטים מפורטים בהזמנה זו" />}
                        </div>
                    ) : <DrillEmpty icon={ShoppingCart} text="ההזמנה לא נמצאה" />;
                } else if (shown.type === 'orderItem') {
                    title = shown.name || 'מוצר'; subtitle = 'פריט בהזמנה'; accent = ACCENT;
                    icon = <Box size={17} color={ACCENT} />;
                    footer = { label: 'פתח במלאי', onClick: () => drillTo(`/admin/inventory?open=${encodeURIComponent(shown.name || '')}`) };
                    body = (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                                    {shown.image ? <img src={shown.image} alt={shown.name} className="w-full h-full object-cover" /> : <Box size={26} className="text-[#AEAEB2]" />}
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[15px] font-black text-[#1D1D1F] leading-tight">{shown.name || 'מוצר'}</p>
                                    {shown.price != null && <p className="text-[13px] font-bold text-[#34C759] mt-1">₪{(Number(shown.price) || 0).toLocaleString()}</p>}
                                </div>
                            </div>
                            <DrillStat items={[
                                { label: 'כמות', value: shown.qty || 1, color: ACCENT },
                                { label: 'מחיר', value: `₪${(Number(shown.price) || 0).toLocaleString()}`, color: '#34C759' },
                            ]} />
                            <div className="rounded-[14px] p-4 text-right text-[12px] text-[#86868B]" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                לפרטי מלאי, מחיר עדכני ותמונה — פתח את המוצר בניהול המלאי.
                            </div>
                        </div>
                    );
                } else {
                    title = 'פרטים'; icon = <Users size={17} color={ACCENT} />;
                    body = <DrillEmpty icon={Users} text="אין נתונים להצגה" />;
                }

                return (
                    <DashDrillView
                        open={isOpen}
                        title={title}
                        subtitle={subtitle}
                        icon={icon}
                        accent={accent}
                        canBack={canBack}
                        onBack={popDrill}
                        onClose={closeDrill}
                        footer={footer}
                        levelKey={`${shown.type}:${shown.name ?? shown.id ?? ''}:${drillStack.length}`}
                    >
                        {body}
                    </DashDrillView>
                );
            })()}

            {/* Trash Tab */}
            {tab === 'trash' && (
                <div className="space-y-3 mt-4" dir="rtl">
                    {(deletedItems?.contacts || []).length === 0 ? (
                        <div style={{ ...glass, borderRadius: RADIUS.card, overflow: 'hidden' }}>
                            <AdminEmpty icon="empty" title="סל המחזור ריק" subtitle="פניות שנמחקו יופיעו כאן וניתן יהיה לשחזר אותן" />
                        </div>
                    ) : (deletedItems?.contacts || []).map(c => (
                        <div key={c.id} style={{ ...GLASS.base, borderRadius: RADIUS.card, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>{c.name || '—'}</div>
                                <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>{c.email} · {c.subject}</div>
                                <div style={{ fontSize: 10, color: '#D1D1D6', marginTop: 2 }}>נמחק {c.deletedAt ? new Date(c.deletedAt).toLocaleDateString('he-IL') : '—'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={async () => { await restoreContact(c.id); }}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: toneBg('success'), color: toneColor('success'), fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                                    שחזר
                                </button>
                                <button onClick={async () => { if (await confirm({ message: 'למחוק לצמיתות? לא ניתן לשחזר.', danger: true })) await hardDeleteContact(c.id); }}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: toneBg('danger'), color: toneColor('danger'), fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
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
