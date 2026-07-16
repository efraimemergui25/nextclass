/* eslint-disable */
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, deleteDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminKPICard, AdminEmpty } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import {
    Users, Trash2, Download, Search, TrendingUp,
    Calendar, Star, Zap, Send,
    CheckSquare, Square, ChevronLeft, Mail, Copy, Hash, Clock
} from 'lucide-react';
import { PALETTE, GLASS, RADIUS, SHADOW, TAP, hexA, glow, toneColor, toneBg, toneFg } from '../theme/tokens';

// ─── Unified brand accent for subscriber avatars (no per-letter rainbow) ───────
const AVATAR = '#007AFF';
const AVATAR_GRAD = `linear-gradient(135deg, ${AVATAR}, #5AC8FA)`;
const AVATAR_SHADOW = '0 4px 12px rgba(0,122,255,0.28), inset 0 1px 0 rgba(255,255,255,0.45)';

// ─── Babushka drill helpers (shared visual grammar with the dashboard) ─────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => (
                <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-[14px] p-3 text-center"
                    style={{ background: `linear-gradient(150deg, ${hexA(s.color || '#007AFF', 0.11)}, ${hexA(s.color || '#007AFF', 0.05)})`, border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 10px ${hexA(s.color || '#007AFF', 0.1)}` }}>
                    <p className="font-black text-[15px] tracking-tight leading-none" style={{ background: `linear-gradient(135deg, ${s.color || '#1D1D1F'}, ${hexA(s.color || '#1D1D1F', 0.72)})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                    <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                </motion.div>
            ))}
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
    <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
        {Icon && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#F0F3F8] to-[#E6EBF3] shadow-[0_4px_16px_rgba(20,40,80,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Icon size={24} className="text-[#B4BCC9]" strokeWidth={2} />
            </div>
        )}
        <p className="text-[#9AA3B2] text-[13px] font-semibold">{text}</p>
    </div>
);

// ─── Community domain accent (restrained azure brand) ─────────────────────────
const GREEN      = '#007AFF';
const GREEN_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.16) 0%, rgba(90,200,250,0.08) 100%)';

function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysSince(ts) {
    if (!ts) return 999;
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function SourceBadge({ source }) {
    const map = {
        footer_newsletter: { label: 'Newsletter', color: '#007AFF' },
        popup:    { label: 'Popup',    color: '#5AC8FA' },
        checkout: { label: 'Checkout', color: '#34C759' },
        manual:   { label: 'Manual',   color: '#FF9500' },
    };
    const s = map[source] || { label: source || 'אתר', color: '#86868B' };
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}0e)`, color: s.color, border: `1px solid ${s.color}2e`, boxShadow: `inset 0 1px 0 ${s.color}22` }}>
            {s.label}
        </span>
    );
}

export default function AdminCommunity() {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();

    // ── Babushka drill stack ──────────────────────────────────────────────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);

    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selected, setSelected] = useState(new Set());
    const [deletingId, setDeletingId] = useState(null);
    const [addEmail, setAddEmail] = useState('');
    const [addingEmail, setAddingEmail] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'newsletter_subs'), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadError(false);
            setLoading(false);
        }, (err) => {
            console.error('Newsletter subscribers load failed:', err);
            setLoadError(true);
            setLoading(false);
            showToast('שגיאה בטעינת רשימת התפוצה', 'error');
        });
        return unsub;
    }, []);

    const stats = useMemo(() => {
        const total = subs.length;
        const thisWeek = subs.filter(s => daysSince(s.timestamp) <= 7).length;
        const thisMonth = subs.filter(s => daysSince(s.timestamp) <= 30).length;
        const growth = thisWeek > 0 ? `+${thisWeek} השבוע` : 'ללא הרשמות השבוע';
        return { total, thisWeek, thisMonth, growth };
    }, [subs]);

    const filtered = useMemo(() => {
        let list = subs;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => s.email?.toLowerCase().includes(q));
        }
        if (sortBy === 'oldest') list = [...list].reverse();
        if (sortBy === 'alpha') list = [...list].sort((a, b) => a.email?.localeCompare(b.email));
        return list;
    }, [subs, search, sortBy]);

    const exportCSV = () => {
        const rows = [['Email', 'Date', 'Source'], ...subs.map(s => [s.email, fmtDate(s.timestamp), s.source || 'website'])];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nextclass-community-${Date.now()}.csv`;
        a.click(); URL.revokeObjectURL(url);
        showToast(`יוצא ${subs.length} מנויים`, 'success');
    };

    const deleteSub = async (id) => {
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, 'newsletter_subs', id));
            showToast('מנוי הוסר מהרשימה', 'success');
        } catch { showToast('שגיאה בהסרת המנוי', 'error'); }
        setDeletingId(null);
    };

    const confirmDeleteSub = async (id) => {
        if (await confirm({ title: 'הסר מנוי?', message: 'המנוי יוסר לצמיתות מרשימת התפוצה.', confirmLabel: 'כן, הסר', danger: true })) {
            deleteSub(id);
        }
    };

    const bulkDelete = async () => {
        try {
            await Promise.all([...selected].map(id => deleteDoc(doc(db, 'newsletter_subs', id))));
            showToast(`${selected.size} מנויים הוסרו`, 'success');
            setSelected(new Set());
        } catch { showToast('שגיאה בהסרה קבוצתית', 'error'); }
    };

    const confirmBulkDelete = async () => {
        if (await confirm({ title: `הסר ${selected.size} מנויים?`, message: 'המנויים הנבחרים יוסרו לצמיתות.', confirmLabel: 'כן, הסר', danger: true })) {
            bulkDelete();
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };
    const toggleAll = () => {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(s => s.id)));
    };

    const addManualSub = async (e) => {
        e.preventDefault();
        const email = addEmail.trim().toLowerCase();
        if (!email || !email.includes('@')) return;
        if (subs.some(s => s.email === email)) {
            showToast('כתובת זו כבר קיימת ברשימה', 'error');
            return;
        }
        setAddingEmail(true);
        try {
            await addDoc(collection(db, 'newsletter_subs'), { email, source: 'manual', timestamp: serverTimestamp() });
            setAddEmail('');
            showToast('מנוי נוסף בהצלחה', 'success');
        } catch { showToast('שגיאה בהוספת המנוי', 'error'); }
        setAddingEmail(false);
    };

    const recentActivity = useMemo(() => subs.slice(0, 8), [subs]);

    const sourceCounts = useMemo(() =>
        Object.entries(subs.reduce((acc, s) => {
            const src = s.source || 'website';
            acc[src] = (acc[src] || 0) + 1;
            return acc;
        }, {})).sort((a, b) => b[1] - a[1])
    , [subs]);

    const sourceColors = {
        footer_newsletter: '#007AFF',
        popup: '#5AC8FA',
        checkout: '#34C759',
        manual: '#FF9500',
        website: '#86868B',
    };

    const panelStyle = { ...GLASS.base };

    return (
        <div dir="rtl" className="space-y-5">
            {/* Page header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(GREEN, 0.10), border: `1px solid ${hexA(GREEN, 0.18)}`, boxShadow: SHADOW.specular }}>
                    <Users size={22} color={GREEN} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ניהול קהילה</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>רשימת תפוצה ומנויי ניוזלטר</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {selected.size > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -2, boxShadow: `0 10px 26px ${hexA(toneColor('danger'), 0.4)}` }}
                            whileTap={TAP}
                            onClick={confirmBulkDelete}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${toneColor('danger')}, ${hexA(toneColor('danger'), 0.82)})`, boxShadow: `0 6px 16px ${hexA(toneColor('danger'), 0.34)}, inset 0 1px 0 rgba(255,255,255,0.35)` }}
                        >
                            <Trash2 size={13} />
                            הסר {selected.size}
                        </motion.button>
                    )}
                    <motion.button
                        onClick={exportCSV}
                        whileHover={{ y: -2, boxShadow: `0 8px 24px ${hexA(GREEN, 0.28)}` }} whileTap={TAP}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: hexA(GREEN, 0.1), color: '#005EC4', border: `1px solid ${hexA(GREEN, 0.28)}` }}
                    >
                        <Download size={13} />
                        ייצוא CSV
                    </motion.button>
                </div>
            </div>

            {/* KPI band — total · this week · this month · open rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                <AdminKPICard title="סך מנויים" value={stats.total} subtitle={stats.growth} accent={GREEN} delay={0}
                    icon={<Users size={20} color={GREEN} />} loading={loading} onClick={() => openDrill({ type: 'kpi-total' })} />
                <AdminKPICard title="הצטרפו השבוע" value={stats.thisWeek} subtitle="7 ימים אחרונים" accent={PALETTE.blue} delay={0.05}
                    icon={<TrendingUp size={20} color={PALETTE.blue} />} loading={loading} onClick={() => openDrill({ type: 'kpi-week' })} />
                <AdminKPICard title="הצטרפו החודש" value={stats.thisMonth} subtitle="30 ימים אחרונים" accent={PALETTE.indigo} delay={0.1}
                    icon={<Calendar size={20} color={PALETTE.indigo} />} loading={loading} onClick={() => openDrill({ type: 'kpi-month' })} />
                <AdminKPICard title="שיעור פתיחה" value="—" subtitle="מדד דיוור" accent={PALETTE.graphite} delay={0.15}
                    icon={<Star size={20} color={PALETTE.graphite} />} onClick={() => openDrill({ type: 'kpi-open' })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Subscriber table */}
                <div className="lg:col-span-2">
                    <div className="rounded-[22px] overflow-hidden" style={panelStyle}>

                        {/* Toolbar */}
                        <div className="px-5 py-3.5 border-b border-black/[0.05] flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="חיפוש לפי מייל..."
                                    className="w-full pr-9 pl-4 py-2 bg-[#F5F5F7] rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all text-right"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="px-3 py-2 bg-[#F5F5F7] rounded-xl text-[12px] font-bold text-[#1D1D1F] focus:outline-none border-0 cursor-pointer"
                            >
                                <option value="newest">חדש ביותר</option>
                                <option value="oldest">ישן ביותר</option>
                                <option value="alpha">A–Z</option>
                            </select>
                        </div>

                        {/* Select-all bar */}
                        {filtered.length > 0 && (
                            <div className="px-5 py-2 border-b border-black/[0.04] flex items-center justify-between bg-black/[0.012]">
                                <button onClick={toggleAll} className="flex items-center gap-2 text-[11px] font-bold text-[#86868B] hover:text-[#007AFF] transition-colors">
                                    {selected.size === filtered.length ? <CheckSquare size={13} /> : <Square size={13} />}
                                    {selected.size > 0 ? `נבחרו ${selected.size}` : 'בחר הכל'}
                                </button>
                                <p className="text-[11px] text-[#AEAEB2] font-bold">{filtered.length} תוצאות</p>
                            </div>
                        )}

                        {/* Rows */}
                        <div className="divide-y divide-black/[0.035] max-h-[540px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-16 text-center text-[#AEAEB2] text-sm font-bold">טוען...</div>
                            ) : loadError ? (
                                <AdminEmpty
                                    icon="empty"
                                    title="שגיאה בטעינת רשימת התפוצה"
                                    subtitle="לא ניתן לטעון את המנויים כרגע. רענן את הדף ונסה שוב."
                                />
                            ) : filtered.length === 0 ? (
                                <AdminEmpty
                                    icon="empty"
                                    title={search ? 'לא נמצאו תוצאות' : 'אין מנויים עדיין'}
                                    subtitle={search ? 'נסה חיפוש אחר' : 'הרשמות ניוזלטר יופיעו כאן אוטומטית'}
                                />
                            ) : (
                                filtered.map((sub) => (
                                    <motion.div
                                        key={sub.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3.5 px-5 py-3 hover:bg-black/[0.018] transition-colors group"
                                    >
                                        <button onClick={() => toggleSelect(sub.id)} className="shrink-0">
                                            {selected.has(sub.id)
                                                ? <CheckSquare size={14} className="text-[#007AFF]" />
                                                : <Square size={14} className="text-[#C7C7CC] group-hover:text-[#007AFF] transition-colors" />
                                            }
                                        </button>

                                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-white text-[11px] font-black shadow-sm"
                                            style={{ background: AVATAR_GRAD, boxShadow: AVATAR_SHADOW }}>
                                            {(sub.email?.[0] || '?').toUpperCase()}
                                        </div>

                                        <div role="button" tabIndex={0}
                                            onClick={() => openDrill({ type: 'subscriber', sub })}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'subscriber', sub }); } }}
                                            className="flex-1 min-w-0 text-right cursor-pointer focus:outline-none">
                                            <p className="text-[13px] font-bold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">{sub.email}</p>
                                            <div className="flex items-center gap-2 justify-end mt-0.5">
                                                <span className="text-[10px] text-[#AEAEB2] font-medium">{fmtDate(sub.timestamp)}</span>
                                                <SourceBadge source={sub.source} />
                                            </div>
                                        </div>

                                        <div className="text-center shrink-0 hidden md:block w-10">
                                            <p className="text-[12px] font-black leading-none" style={{ background: `linear-gradient(135deg, ${GREEN}, #5AC8FA)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{daysSince(sub.timestamp)}</p>
                                            <p className="text-[9px] font-bold text-[#AEAEB2] tracking-wide">ימים</p>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={() => confirmDeleteSub(sub.id)}
                                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF3B30]/10"
                                            disabled={deletingId === sub.id}
                                        >
                                            {deletingId === sub.id
                                                ? <div className="w-3 h-3 border border-[#FF3B30]/40 border-t-[#FF3B30] rounded-full animate-spin" />
                                                : <Trash2 size={12} className="text-[#FF3B30]" />
                                            }
                                        </motion.button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Unified right panel */}
                <div className="lg:col-span-1 flex flex-col gap-4">

                    {/* Add subscriber card */}
                    <div className="rounded-[22px] p-5" style={panelStyle}>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'linear-gradient(140deg, rgba(0,122,255,0.20), rgba(90,200,250,0.10))', border: '1px solid rgba(0,122,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 3px 10px rgba(0,122,255,0.14)' }}>
                                <Users size={12} className="text-[#007AFF]" />
                            </div>
                            <p className="text-[13px] font-black text-[#1D1D1F] tracking-tight">הוסף מנוי ידנית</p>
                        </div>
                        <form onSubmit={addManualSub} className="flex gap-2">
                            <button
                                type="submit"
                                disabled={addingEmail || !addEmail.includes('@')}
                                className="shrink-0 h-9 px-4 rounded-xl text-[12px] font-black text-white transition-all disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, #007AFF, #5AC8FA)' }}
                            >
                                {addingEmail ? '...' : 'הוסף'}
                            </button>
                            <input
                                type="email"
                                value={addEmail}
                                onChange={e => setAddEmail(e.target.value)}
                                placeholder="email@example.com"
                                dir="ltr"
                                className="flex-1 h-9 px-3 bg-[#F5F5F7] rounded-xl text-[12px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all text-left"
                            />
                        </form>
                    </div>

                    {/* Recent activity + source breakdown card */}
                    <div className="rounded-[22px] overflow-hidden flex-1" style={panelStyle}>

                        {/* Section: Recent activity */}
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(140deg, rgba(0,122,255,0.18), rgba(90,200,250,0.08))', border: '1px solid rgba(0,122,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(0,122,255,0.12)' }}>
                                    <Zap size={12} className="text-[#007AFF]" />
                                </div>
                                <p className="text-[13px] font-black text-[#1D1D1F] tracking-tight">הצטרפויות אחרונות</p>
                            </div>

                            <div className="space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar -mx-1 px-1">
                                {recentActivity.length === 0 ? (
                                    <div className="py-5 text-center">
                                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 bg-gradient-to-br from-[#F4F7FB] to-[#E7ECF4] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(20,40,80,0.05)]">
                                            <Users size={16} className="text-[#AEAEB2]" />
                                        </div>
                                        <p className="text-[11px] text-[#AEAEB2] font-bold">אין הצטרפויות עדיין</p>
                                        <p className="text-[10px] text-[#C7C7CC] mt-0.5">הוסף מנוי ידנית למעלה</p>
                                    </div>
                                ) : recentActivity.map((sub, i) => (
                                    <motion.div
                                        key={sub.id}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.035 }}
                                        role="button" tabIndex={0}
                                        onClick={() => openDrill({ type: 'subscriber', sub })}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'subscriber', sub }); } }}
                                        className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-black/[0.025] transition-colors cursor-pointer focus:outline-none"
                                    >
                                        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-white text-[10px] font-black shrink-0"
                                            style={{ background: AVATAR_GRAD, boxShadow: AVATAR_SHADOW }}>
                                            {(sub.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{sub.email}</p>
                                            <p className="text-[9px] text-[#AEAEB2] font-medium">
                                                {daysSince(sub.timestamp) === 0 ? 'היום' : `לפני ${daysSince(sub.timestamp)} ימים`}
                                            </p>
                                        </div>
                                        {daysSince(sub.timestamp) === 0 && (
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0"
                                                style={{ background: toneBg('success'), color: toneColor('success'), border: `1px solid ${hexA(toneColor('success'), 0.25)}` }}>
                                                חדש
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 my-3 border-t border-black/[0.055]" />

                        {/* Section: Source breakdown */}
                        <div className="px-5 pb-4">
                            <p className="text-[12px] font-black text-[#1D1D1F] mb-3 tracking-tight">מקור הרשמה</p>
                            {sourceCounts.length > 0 ? (
                                <div className="space-y-2.5">
                                    {sourceCounts.map(([src, count]) => {
                                        const color = sourceColors[src] || '#86868B';
                                        const pct = Math.round((count / subs.length) * 100);
                                        return (
                                            <div key={src}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-[#AEAEB2] font-bold">{count} מנויים</span>
                                                    <div className="flex items-center gap-1.5 text-right">
                                                        <span className="text-[11px] font-bold text-[#1D1D1F]">{src}</span>
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                            style={{ background: `${color}12`, color }}>
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F2F2F7', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                        className="h-full rounded-full"
                                                        style={{ background: `linear-gradient(90deg, ${color}, ${hexA(color, 0.72)})`, boxShadow: `0 1px 4px ${hexA(color, 0.4)}` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mx-auto mb-2">
                                        <Hash size={16} className="text-[#AEAEB2]" />
                                    </div>
                                    <p className="text-[11px] text-[#AEAEB2] font-bold">אין נתוני מקור עדיין</p>
                                    <p className="text-[10px] text-[#C7C7CC] mt-0.5">פילוח לפי מקור יופיע עם ההרשמות הראשונות</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Babushka Drill Drawer — nested glass detail ─────────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const subRow = (s, i) => (
                    <DrillRow key={s.id} delay={i * 0.03}
                        onClick={() => pushDrill({ type: 'subscriber', sub: s })}
                        leading={<div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white text-[11px] font-black shrink-0"
                            style={{ background: AVATAR_GRAD, boxShadow: AVATAR_SHADOW }}>{(s.email?.[0] || '?').toUpperCase()}</div>}
                        title={s.email}
                        subtitle={`${fmtDate(s.timestamp)} · לפני ${daysSince(s.timestamp)} ימים`}
                        trailing={<SourceBadge source={s.source} />}
                    />
                );
                const subList = (arr) => arr.length === 0
                    ? <DrillEmpty icon={Users} text="אין מנויים להצגה" />
                    : <div className="space-y-2">{arr.map(subRow)}</div>;

                let title = '', subtitle = '', icon = null, footer = null, body = null;

                if (shown.type === 'kpi-total') {
                    title = 'סך מנויים'; subtitle = `${stats.total} מנויים ברשימת התפוצה`;
                    icon = <Users size={17} color={GREEN} />;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סך הכל', value: stats.total, color: GREEN },
                                { label: 'השבוע', value: stats.thisWeek, color: PALETTE.blue },
                                { label: 'החודש', value: stats.thisMonth, color: PALETTE.indigo },
                            ]} />
                            {sourceCounts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מקורות הרשמה — לחץ לצלילה</p>
                                    {sourceCounts.map(([src, count], i) => {
                                        const color = sourceColors[src] || '#86868B';
                                        return (
                                            <DrillRow key={src} delay={i * 0.04} tone={color}
                                                onClick={() => pushDrill({ type: 'source', src })}
                                                leading={<div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                                                    style={{ background: hexA(color, 0.14) }}><Hash size={13} style={{ color }} /></div>}
                                                title={src}
                                                subtitle={`${subs.length ? Math.round(count / subs.length * 100) : 0}% מהרשימה`}
                                                trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{count}</span>}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">כל המנויים</p>
                                {subList(subs)}
                            </div>
                        </div>
                    );
                } else if (shown.type === 'kpi-week') {
                    const arr = subs.filter(s => daysSince(s.timestamp) <= 7);
                    title = 'הצטרפו השבוע'; subtitle = `${arr.length} מנויים · 7 ימים אחרונים`;
                    icon = <TrendingUp size={17} color={PALETTE.blue} />;
                    body = <div className="space-y-2">{subList(arr)}</div>;
                } else if (shown.type === 'kpi-month') {
                    const arr = subs.filter(s => daysSince(s.timestamp) <= 30);
                    title = 'הצטרפו החודש'; subtitle = `${arr.length} מנויים · 30 ימים אחרונים`;
                    icon = <Calendar size={17} color={PALETTE.indigo} />;
                    body = <div className="space-y-2">{subList(arr)}</div>;
                } else if (shown.type === 'kpi-open') {
                    title = 'שיעור פתיחה'; subtitle = 'מדד דיוור';
                    icon = <Star size={17} color={PALETTE.graphite} />;
                    body = <DrillEmpty icon={Star} text="שיעור הפתיחה יתווסף עם חיבור מערכת הדיוור (SendGrid / Resend)" />;
                } else if (shown.type === 'source') {
                    const arr = subs.filter(s => (s.source || 'website') === shown.src);
                    const color = sourceColors[shown.src] || '#86868B';
                    title = shown.src; subtitle = `${arr.length} מנויים ממקור זה`;
                    icon = <Hash size={17} color={color} />;
                    body = <div className="space-y-2">{subList(arr)}</div>;
                } else if (shown.type === 'subscriber') {
                    const s = shown.sub;
                    title = s.email; subtitle = 'פרטי מנוי'; icon = <Mail size={17} color={GREEN} />;
                    body = (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[20px] font-black shrink-0"
                                    style={{ background: AVATAR_GRAD, boxShadow: AVATAR_SHADOW }}>{(s.email?.[0] || '?').toUpperCase()}</div>
                                <div className="min-w-0 text-right flex-1">
                                    <p className="text-[15px] font-black text-[#1D1D1F] truncate" dir="ltr">{s.email}</p>
                                    <div className="mt-1"><SourceBadge source={s.source} /></div>
                                </div>
                            </div>
                            <DrillStat items={[
                                { label: 'ימים ברשימה', value: daysSince(s.timestamp), color: GREEN },
                                { label: 'תאריך הצטרפות', value: fmtDate(s.timestamp) },
                            ]} />
                            <div className="space-y-2">
                                <button onClick={() => navigator.clipboard.writeText(s.email).then(() => showToast('המייל הועתק', 'success'))}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer transition-colors"
                                    style={{ background: hexA(GREEN, 0.1), color: '#005EC4', border: `1px solid ${hexA(GREEN, 0.24)}` }}>
                                    <Copy size={14} /> העתק כתובת מייל
                                </button>
                                <button onClick={() => { closeDrill(); confirmDeleteSub(s.id); }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer transition-colors"
                                    style={{ background: toneBg('danger'), color: toneColor('danger'), border: `1px solid ${hexA(toneColor('danger'), 0.22)}` }}>
                                    <Trash2 size={14} /> הסר מהרשימה
                                </button>
                            </div>
                        </div>
                    );
                }

                return (
                    <DashDrillView
                        open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={GREEN}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${shown.type}:${shown.sub?.id ?? shown.src ?? ''}:${drillStack.length}`}
                    >{body}</DashDrillView>
                );
            })()}
        </div>
    );
}
