/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, deleteDoc, getDocs, where, Timestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import {
    Users, Mail, Trash2, Download, Search, TrendingUp,
    Calendar, Star, Zap, ChevronDown, RefreshCw, Send,
    UserCheck, UserX, Filter, CheckSquare, Square, X
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(ts) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
function daysSince(ts) {
    if (!ts) return 999;
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// ── Source badge ─────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
    const map = {
        footer_newsletter: { label: 'Newsletter', color: '#007AFF' },
        popup: { label: 'Popup', color: '#5856D6' },
        checkout: { label: 'Checkout', color: '#34C759' },
        manual: { label: 'Manual', color: '#FF9500' },
    };
    const s = map[source] || { label: source || 'אתר', color: '#86868B' };
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black"
            style={{ background: `${s.color}18`, color: s.color }}>
            {s.label}
        </span>
    );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[22px] p-5"
            style={{
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(30px) saturate(2)',
                WebkitBackdropFilter: 'blur(30px) saturate(2)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}
        >
            <div className="absolute inset-0 pointer-events-none rounded-[22px]"
                style={{ background: `radial-gradient(ellipse at top right, ${color}10, transparent 70%)` }} />
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none">{value}</p>
                </div>
            </div>
            {sub && <p className="text-[11px] font-semibold text-[#86868B] text-right">{sub}</p>}
        </motion.div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCommunity() {
    const { showToast } = useAdminToast();

    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selected, setSelected] = useState(new Set());
    const [deletingId, setDeletingId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // id or 'bulk'

    // Real-time Firebase listener
    useEffect(() => {
        const q = query(collection(db, 'newsletter_subs'), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return unsub;
    }, []);

    // Stats
    const stats = useMemo(() => {
        const total = subs.length;
        const thisWeek = subs.filter(s => daysSince(s.timestamp) <= 7).length;
        const thisMonth = subs.filter(s => daysSince(s.timestamp) <= 30).length;
        const growth = thisWeek > 0 ? `+${thisWeek} השבוע` : 'ללא הרשמות השבוע';
        return { total, thisWeek, thisMonth, growth };
    }, [subs]);

    // Filtered + sorted list
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

    // CSV export
    const exportCSV = () => {
        const rows = [
            ['Email', 'Date', 'Source'],
            ...subs.map(s => [s.email, fmtDate(s.timestamp), s.source || 'website'])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nextclass-community-${Date.now()}.csv`;
        a.click(); URL.revokeObjectURL(url);
        showToast(`יוצא ${subs.length} מנויים`, 'success');
    };

    // Delete single
    const deleteSub = async (id) => {
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, 'newsletter_subs', id));
            showToast('מנוי הוסר מהרשימה', 'success');
        } catch {
            showToast('שגיאה בהסרת המנוי', 'error');
        }
        setDeletingId(null);
        setShowDeleteConfirm(null);
    };

    // Bulk delete
    const bulkDelete = async () => {
        try {
            await Promise.all([...selected].map(id => deleteDoc(doc(db, 'newsletter_subs', id))));
            showToast(`${selected.size} מנויים הוסרו`, 'success');
            setSelected(new Set());
        } catch {
            showToast('שגיאה בהסרה קבוצתית', 'error');
        }
        setShowDeleteConfirm(null);
    };

    // Selection helpers
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

    // Recent activity (last 10)
    const recentActivity = useMemo(() => subs.slice(0, 8), [subs]);

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ניהול קהילה"
                subtitle="רשימת תפוצה, מנויי ניוזלטר וניהול קשרי לקוחות"
                action={
                    <div className="flex items-center gap-3">
                        {selected.size > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setShowDeleteConfirm('bulk')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                                style={{ background: '#FF3B30' }}
                            >
                                <Trash2 size={14} />
                                הסר {selected.size} נבחרים
                            </motion.button>
                        )}
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                            style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.20)' }}
                        >
                            <Download size={14} />
                            ייצוא CSV
                        </button>
                    </div>
                }
            />

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="סה״כ מנויים" value={stats.total} icon={Users} color="#007AFF" sub={stats.growth} />
                <StatCard label="הצטרפו השבוע" value={stats.thisWeek} icon={TrendingUp} color="#34C759" sub="7 ימים אחרונים" />
                <StatCard label="הצטרפו החודש" value={stats.thisMonth} icon={Calendar} color="#5856D6" sub="30 ימים אחרונים" />
                <StatCard label="שיעור פתיחה" value="—" icon={Star} color="#FF9500" sub="מחובר בקרוב" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Main Subscriber Table ─────────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="rounded-[24px] overflow-hidden"
                        style={{
                            background: 'rgba(255,255,255,0.88)',
                            backdropFilter: 'blur(40px) saturate(2)',
                            WebkitBackdropFilter: 'blur(40px) saturate(2)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                        }}>

                        {/* Table header */}
                        <div className="px-6 py-4 border-b border-black/06 flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="חיפוש לפי מייל..."
                                    className="w-full pr-10 pl-4 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all text-right"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="px-3 py-2.5 bg-[#F5F5F7] rounded-xl text-sm font-bold text-[#1D1D1F] focus:outline-none border-0 cursor-pointer"
                            >
                                <option value="newest">חדש ביותר</option>
                                <option value="oldest">ישן ביותר</option>
                                <option value="alpha">A–Z</option>
                            </select>
                        </div>

                        {/* Select all bar */}
                        {filtered.length > 0 && (
                            <div className="px-6 py-2.5 border-b border-black/04 flex items-center justify-between bg-[#FAFAFA]">
                                <button onClick={toggleAll} className="flex items-center gap-2 text-[11px] font-bold text-[#86868B] hover:text-[#007AFF] transition-colors">
                                    {selected.size === filtered.length ? <CheckSquare size={14} /> : <Square size={14} />}
                                    {selected.size > 0 ? `נבחרו ${selected.size}` : 'בחר הכל'}
                                </button>
                                <p className="text-[11px] text-[#AEAEB2] font-bold">{filtered.length} תוצאות</p>
                            </div>
                        )}

                        {/* Rows */}
                        <div className="divide-y divide-black/04 max-h-[520px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="py-20 text-center text-[#AEAEB2] font-bold">טוען...</div>
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Users size={40} className="mx-auto mb-4 text-[#AEAEB2]" />
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
                                        className="flex items-center gap-4 px-6 py-3.5 hover:bg-black/[0.015] transition-colors group"
                                    >
                                        <button onClick={() => toggleSelect(sub.id)} className="shrink-0">
                                            {selected.has(sub.id)
                                                ? <CheckSquare size={15} className="text-[#007AFF]" />
                                                : <Square size={15} className="text-[#AEAEB2] group-hover:text-[#007AFF] transition-colors" />
                                            }
                                        </button>

                                        {/* Avatar */}
                                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white text-sm font-black shadow-sm"
                                            style={{ background: `hsl(${(sub.email?.charCodeAt(0) || 0) * 7 % 360}, 60%, 55%)` }}>
                                            {(sub.email?.[0] || '?').toUpperCase()}
                                        </div>

                                        {/* Email + meta */}
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-sm font-bold text-[#1D1D1F] truncate">{sub.email}</p>
                                            <div className="flex items-center gap-2 justify-end mt-0.5">
                                                <span className="text-[10px] text-[#AEAEB2] font-mono">{fmtDate(sub.timestamp)}</span>
                                                <SourceBadge source={sub.source} />
                                            </div>
                                        </div>

                                        {/* Days since */}
                                        <div className="text-center shrink-0 hidden md:block">
                                            <p className="text-xs font-black text-[#1D1D1F]">{daysSince(sub.timestamp)}</p>
                                            <p className="text-[9px] font-bold text-[#AEAEB2] uppercase tracking-wide">ימים</p>
                                        </div>

                                        {/* Delete */}
                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={() => setShowDeleteConfirm(sub.id)}
                                            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FF3B30]/10"
                                            disabled={deletingId === sub.id}
                                        >
                                            {deletingId === sub.id
                                                ? <div className="w-3 h-3 border border-[#FF3B30]/40 border-t-[#FF3B30] rounded-full animate-spin" />
                                                : <Trash2 size={13} className="text-[#FF3B30]" />
                                            }
                                        </motion.button>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right column: Activity + Broadcast ───────────────────── */}
                <div className="flex flex-col gap-4">

                    {/* Recent activity */}
                    <div className="rounded-[24px] overflow-hidden"
                        style={{
                            background: 'linear-gradient(160deg, rgba(17,17,34,0.92) 0%, rgba(28,20,60,0.95) 100%)',
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                        }}>
                        <div className="px-5 py-4 border-b border-white/08 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(0,122,255,0.20)' }}>
                                <Zap size={13} className="text-[#007AFF]" />
                            </div>
                            <p className="text-white font-black text-sm">הצטרפויות אחרונות</p>
                        </div>
                        <div className="p-3 space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <p className="text-white/30 text-xs text-center py-8 font-bold">אין הצטרפויות עדיין</p>
                            ) : recentActivity.map((sub, i) => (
                                <motion.div
                                    key={sub.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/05 transition-colors"
                                >
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0"
                                        style={{ background: `hsl(${(sub.email?.charCodeAt(0) || 0) * 7 % 360}, 50%, 45%)` }}>
                                        {(sub.email?.[0] || '?').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-white text-[11px] font-bold truncate">{sub.email}</p>
                                        <p className="text-white/40 text-[9px] font-mono">
                                            {daysSince(sub.timestamp) === 0 ? 'היום' : `לפני ${daysSince(sub.timestamp)} ימים`}
                                        </p>
                                    </div>
                                    {daysSince(sub.timestamp) === 0 && (
                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#34C759]/20 text-[#34C759]">חדש</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Broadcast placeholder */}
                    <div className="rounded-[24px] p-5"
                        style={{
                            background: 'rgba(255,255,255,0.88)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                        }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(88,86,214,0.10)' }}>
                                <Send size={15} className="text-[#5856D6]" />
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-[#1D1D1F]">שליחת ניוזלטר</p>
                                <p className="text-[10px] text-[#AEAEB2]">ל-{stats.total} מנויים</p>
                            </div>
                        </div>
                        <textarea
                            rows={4}
                            placeholder="כתוב כאן את תוכן הניוזלטר שלך..."
                            className="w-full px-4 py-3 bg-[#F5F5F7] rounded-2xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 transition-all resize-none text-right mb-3"
                        />
                        <button
                            disabled
                            className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #5856D6, #007AFF)' }}
                            title="בקרוב — שליחת מיילים אמיתית"
                        >
                            <Send size={14} />
                            שלח לכולם (בקרוב)
                        </button>
                        <p className="text-[10px] text-[#AEAEB2] text-center mt-2">חיבור ל-SendGrid / Resend — בקרוב</p>
                    </div>

                    {/* Source breakdown */}
                    {subs.length > 0 && (
                        <div className="rounded-[24px] p-5"
                            style={{
                                background: 'rgba(255,255,255,0.88)',
                                border: '1px solid rgba(0,0,0,0.07)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                            }}>
                            <p className="text-sm font-black text-[#1D1D1F] text-right mb-4">מקור הרשמה</p>
                            {Object.entries(
                                subs.reduce((acc, s) => {
                                    const src = s.source || 'website';
                                    acc[src] = (acc[src] || 0) + 1;
                                    return acc;
                                }, {})
                            ).map(([src, count]) => (
                                <div key={src} className="flex items-center gap-3 mb-3 last:mb-0">
                                    <div className="flex-1 bg-[#F5F5F7] rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / subs.length) * 100}%` }}
                                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                            className="h-full rounded-full bg-[#007AFF]"
                                        />
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-[11px] font-bold text-[#1D1D1F]">{src}</span>
                                        <span className="text-[10px] text-[#AEAEB2] mr-1">({count})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete confirmation modal ──────────────────────────────────── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[28px] p-8 max-w-sm w-full mx-4 text-right shadow-2xl"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-[#FF3B30]/10 flex items-center justify-center mb-5 mr-auto ml-0">
                                <Trash2 size={24} className="text-[#FF3B30]" />
                            </div>
                            <h3 className="text-xl font-black text-[#1D1D1F] mb-2">
                                {showDeleteConfirm === 'bulk' ? `הסר ${selected.size} מנויים?` : 'הסר מנוי?'}
                            </h3>
                            <p className="text-sm text-[#6E6E73] font-medium mb-6">
                                {showDeleteConfirm === 'bulk'
                                    ? 'המנויים הנבחרים יוסרו לצמיתות מרשימת התפוצה.'
                                    : 'המנוי יוסר לצמיתות מרשימת התפוצה.'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => showDeleteConfirm === 'bulk' ? bulkDelete() : deleteSub(showDeleteConfirm)}
                                    className="flex-1 py-3 rounded-2xl text-white font-black text-sm"
                                    style={{ background: '#FF3B30' }}
                                >
                                    כן, הסר
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 py-3 rounded-2xl text-[#1D1D1F] font-black text-sm bg-[#F5F5F7]"
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
