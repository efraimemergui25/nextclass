/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, deleteDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import {
    Users, Trash2, Download, Search, TrendingUp,
    Calendar, Star, Zap, Send,
    CheckSquare, Square
} from 'lucide-react';

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
        popup:    { label: 'Popup',    color: '#5856D6' },
        checkout: { label: 'Checkout', color: '#34C759' },
        manual:   { label: 'Manual',   color: '#FF9500' },
    };
    const s = map[source] || { label: source || 'אתר', color: '#86868B' };
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}22` }}>
            {s.label}
        </span>
    );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[20px] p-5"
            style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: `0 4px 24px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.9) inset`,
            }}
        >
            <div className="absolute inset-0 pointer-events-none rounded-[20px]"
                style={{ background: `radial-gradient(ellipse at top right, ${color}0D, transparent 65%)` }} />
            <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#86868B] tracking-widest mb-1">{label}</p>
                    <p className="text-[28px] font-black text-[#1D1D1F] tracking-tighter leading-none">{value}</p>
                </div>
            </div>
            {sub && <p className="text-[10px] font-semibold text-[#AEAEB2] text-right mt-2.5">{sub}</p>}
        </motion.div>
    );
}

export default function AdminCommunity() {
    const { showToast } = useAdminToast();

    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selected, setSelected] = useState(new Set());
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [addEmail, setAddEmail] = useState('');
    const [addingEmail, setAddingEmail] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'newsletter_subs'), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
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
        setShowDeleteConfirm(null);
    };

    const bulkDelete = async () => {
        try {
            await Promise.all([...selected].map(id => deleteDoc(doc(db, 'newsletter_subs', id))));
            showToast(`${selected.size} מנויים הוסרו`, 'success');
            setSelected(new Set());
        } catch { showToast('שגיאה בהסרה קבוצתית', 'error'); }
        setShowDeleteConfirm(null);
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
        popup: '#5856D6',
        checkout: '#34C759',
        manual: '#FF9500',
        website: '#86868B',
    };

    const panelStyle = {
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.9) inset',
    };

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title="ניהול קהילה"
                subtitle="רשימת תפוצה ומנויי ניוזלטר"
                action={
                    <div className="flex items-center gap-2.5">
                        {selected.size > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setShowDeleteConfirm('bulk')}
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white"
                                style={{ background: '#FF3B30' }}
                            >
                                <Trash2 size={13} />
                                הסר {selected.size}
                            </motion.button>
                        )}
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all"
                            style={{ background: 'rgba(0,122,255,0.09)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.18)' }}
                        >
                            <Download size={13} />
                            ייצוא CSV
                        </button>
                    </div>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="סה״כ מנויים"    value={stats.total}     icon={Users}       color="#007AFF" sub={stats.growth} />
                <StatCard label="הצטרפו השבוע"   value={stats.thisWeek}  icon={TrendingUp}  color="#34C759" sub="7 ימים אחרונים" />
                <StatCard label="הצטרפו החודש"   value={stats.thisMonth} icon={Calendar}    color="#5856D6" sub="30 ימים אחרונים" />
                <StatCard label="שיעור פתיחה"    value="—"               icon={Star}        color="#86868B" sub="בקרוב" />
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
                            ) : filtered.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Users size={36} className="mx-auto mb-3 text-[#AEAEB2]" />
                                    <p className="text-[#AEAEB2] font-bold text-sm">{search ? 'לא נמצאו תוצאות' : 'אין מנויים עדיין'}</p>
                                    <p className="text-[#AEAEB2] text-xs mt-1">הרשמות ניוזלטר יופיעו כאן</p>
                                </div>
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
                                            style={{ background: `hsl(${(sub.email?.charCodeAt(0) || 0) * 7 % 360}, 55%, 52%)` }}>
                                            {(sub.email?.[0] || '?').toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{sub.email}</p>
                                            <div className="flex items-center gap-2 justify-end mt-0.5">
                                                <span className="text-[10px] text-[#AEAEB2] font-medium">{fmtDate(sub.timestamp)}</span>
                                                <SourceBadge source={sub.source} />
                                            </div>
                                        </div>

                                        <div className="text-center shrink-0 hidden md:block w-10">
                                            <p className="text-[12px] font-black text-[#3C3C43]">{daysSince(sub.timestamp)}</p>
                                            <p className="text-[9px] font-bold text-[#AEAEB2] tracking-wide">ימים</p>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={() => setShowDeleteConfirm(sub.id)}
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
                                style={{ background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.20)' }}>
                                <Users size={12} className="text-[#34C759]" />
                            </div>
                            <p className="text-[13px] font-black text-[#1D1D1F] tracking-tight">הוסף מנוי ידנית</p>
                        </div>
                        <form onSubmit={addManualSub} className="flex gap-2">
                            <button
                                type="submit"
                                disabled={addingEmail || !addEmail.includes('@')}
                                className="shrink-0 h-9 px-4 rounded-xl text-[12px] font-black text-white transition-all disabled:opacity-40"
                                style={{ background: 'linear-gradient(135deg, #34C759, #30B851)' }}
                            >
                                {addingEmail ? '...' : 'הוסף'}
                            </button>
                            <input
                                type="email"
                                value={addEmail}
                                onChange={e => setAddEmail(e.target.value)}
                                placeholder="email@example.com"
                                dir="ltr"
                                className="flex-1 h-9 px-3 bg-[#F5F5F7] rounded-xl text-[12px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#34C759]/20 transition-all text-left"
                            />
                        </form>
                    </div>

                    {/* Recent activity + source breakdown card */}
                    <div className="rounded-[22px] overflow-hidden flex-1" style={panelStyle}>

                        {/* Section: Recent activity */}
                        <div className="px-5 pt-4 pb-2">
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.16)' }}>
                                    <Zap size={12} className="text-[#007AFF]" />
                                </div>
                                <p className="text-[13px] font-black text-[#1D1D1F] tracking-tight">הצטרפויות אחרונות</p>
                            </div>

                            <div className="space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar -mx-1 px-1">
                                {recentActivity.length === 0 ? (
                                    <div className="py-5 text-center">
                                        <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center mx-auto mb-2">
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
                                        className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-black/[0.025] transition-colors"
                                    >
                                        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center text-white text-[10px] font-black shrink-0"
                                            style={{ background: `hsl(${(sub.email?.charCodeAt(0) || 0) * 7 % 360}, 55%, 52%)` }}>
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
                                                style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759', border: '1px solid rgba(52,199,89,0.25)' }}>
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
                                                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                        className="h-full rounded-full"
                                                        style={{ background: color }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {['Newsletter', 'Popup', 'Manual'].map((label, i) => (
                                        <div key={label}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] text-[#D1D1D6] font-bold">0 מנויים</span>
                                                <span className="text-[11px] font-bold text-[#C7C7CC]">{label}</span>
                                            </div>
                                            <div className="h-1.5 bg-[#F2F2F7] rounded-full" />
                                        </div>
                                    ))}
                                    <p className="text-[10px] text-[#AEAEB2] text-center pt-1">ייאספו נתונים עם הרשמות ראשונות</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Newsletter compose card */}
                    <div className="rounded-[22px] p-5" style={panelStyle}>
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'rgba(88,86,214,0.10)', border: '1px solid rgba(88,86,214,0.16)' }}>
                                <Send size={12} className="text-[#5856D6]" />
                            </div>
                            <div className="text-right flex-1">
                                <p className="text-[12px] font-black text-[#1D1D1F]">שליחת ניוזלטר</p>
                                <p className="text-[10px] text-[#AEAEB2]">ל-{stats.total} מנויים</p>
                            </div>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="כתוב כאן את תוכן הניוזלטר שלך..."
                            className="w-full px-3.5 py-2.5 bg-[#F5F5F7] rounded-xl text-[12px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 transition-all resize-none text-right mb-2.5"
                        />
                        <button
                            disabled
                            className="w-full py-2.5 rounded-xl text-[12px] font-black text-white flex items-center justify-center gap-1.5 opacity-45 cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #5856D6, #007AFF)' }}
                        >
                            <Send size={12} />
                            שלח לכולם (בקרוב)
                        </button>
                        <p className="text-[9px] text-[#AEAEB2] text-center mt-1.5">חיבור ל-SendGrid / Resend — בקרוב</p>
                    </div>
                </div>
            </div>

            {/* Delete confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="rounded-[26px] p-7 max-w-sm w-full mx-4 text-right"
                            style={{
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(40px)',
                                WebkitBackdropFilter: 'blur(40px)',
                                boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                                border: '1px solid rgba(255,255,255,0.8)',
                            }}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center mb-4 mr-auto ml-0">
                                <Trash2 size={20} className="text-[#FF3B30]" />
                            </div>
                            <h3 className="text-lg font-black text-[#1D1D1F] mb-1.5">
                                {showDeleteConfirm === 'bulk' ? `הסר ${selected.size} מנויים?` : 'הסר מנוי?'}
                            </h3>
                            <p className="text-[13px] text-[#6E6E73] font-medium mb-5">
                                {showDeleteConfirm === 'bulk'
                                    ? 'המנויים הנבחרים יוסרו לצמיתות.'
                                    : 'המנוי יוסר לצמיתות מרשימת התפוצה.'}
                            </p>
                            <div className="flex gap-2.5">
                                <button
                                    onClick={() => showDeleteConfirm === 'bulk' ? bulkDelete() : deleteSub(showDeleteConfirm)}
                                    className="flex-1 py-2.5 rounded-2xl text-white font-black text-[13px]"
                                    style={{ background: '#FF3B30' }}
                                >
                                    כן, הסר
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-2.5 rounded-2xl text-[#1D1D1F] font-black text-[13px] bg-[#F5F5F7]"
                                >
                                    ביטול
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
