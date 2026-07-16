/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, orderBy, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ExternalLink, X, Save, Loader, Newspaper, Tag, Globe, ChevronLeft, Calendar, Clock } from 'lucide-react';
import { GLASS, RADIUS, SHADOW, SPRING, GRADIENT, TAP, hexA, glow } from '../theme/tokens';
import { AdminKPICard, AdminEmpty, AdminFilterPills, AdminSkeleton } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { useAdminToast } from '../context/AdminToastContext';

// ─── Babushka drill helpers ────────────────────────────────────────────────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => (
                <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-[14px] p-3 text-center"
                    style={{ background: `linear-gradient(150deg, ${hexA(s.color || '#007AFF', 0.11)}, ${hexA(s.color || '#007AFF', 0.03)})`, border: `1px solid ${hexA(s.color || '#007AFF', 0.18)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 10px ${hexA(s.color || '#007AFF', 0.10)}` }}>
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

// ─── Unified brand accent (restrained azure — no per-domain rainbow) ───────────
const BRAND      = '#007AFF';
const BRAND_GRAD = GRADIENT.signature;
const BRAND_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.18) 0%, rgba(0,122,255,0.08) 100%)';
const glass    = { ...GLASS.base };

// Neutral placeholder when an article image URL fails to load
const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='56' viewBox='0 0 80 56'%3E%3Crect width='80' height='56' fill='%23EEF0F3'/%3E%3C/svg%3E";

const CATEGORIES = ['חדשנות פדגוגית', 'מעבדות STEM', 'טרנדים', 'מקרי בוחן', 'תשתיות', 'בינה מלאכותית'];
const EMPTY = { title: '', category: 'חדשנות פדגוגית', excerpt: '', date: '', readTime: '', image: '', url: '', source: '' };

function ArticleForm({ initial, onSave, onCancel, loading }) {
    const [form, setForm] = useState(initial ?? EMPTY);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6 mb-6" dir="rtl"
            style={{ ...glass, borderRadius: RADIUS.card }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">כותרת</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="כותרת המאמר"
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">קטגוריה</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">מקור</label>
                    <input value={form.source} onChange={e => set('source', e.target.value)}
                        placeholder="Edutopia / EdSurge / eSchool News..."
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">תאריך</label>
                    <input value={form.date} onChange={e => set('date', e.target.value)}
                        placeholder="17 מאי 2024"
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">זמן קריאה</label>
                    <input value={form.readTime} onChange={e => set('readTime', e.target.value)}
                        placeholder="5 דק׳"
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">תקציר</label>
                    <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                        placeholder="2-3 משפטים המתארים את המאמר..."
                        rows={3}
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] resize-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">קישור לכתבה</label>
                    <input value={form.url} onChange={e => set('url', e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-left outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-[#6E6E73] tracking-wider mb-1.5">URL תמונה (Unsplash או כל כתובת)</label>
                    <input value={form.image} onChange={e => set('image', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        dir="ltr"
                        className="w-full border border-[rgba(0,0,0,0.10)] bg-white/70 rounded-xl px-4 py-2.5 text-[14px] text-left outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
            </div>

            <div className="flex gap-3 justify-start">
                <motion.button onClick={() => onSave(form)} disabled={loading || !form.title || !form.url}
                    whileHover={{ y: -2, boxShadow: `0 8px 24px ${hexA(BRAND, 0.42)}, inset 0 1px 0 rgba(255,255,255,0.3)` }} whileTap={TAP} transition={SPRING.snappy}
                    className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-[13px] disabled:opacity-40 transition-all"
                    style={{ background: BRAND_GRAD, boxShadow: `0 4px 16px ${hexA(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    שמור
                </motion.button>
                <motion.button onClick={onCancel} whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                    className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-[13px] transition-all"
                    style={{ ...GLASS.frosted, borderRadius: 12, color: '#6E6E73' }}>
                    <X size={14} />ביטול
                </motion.button>
            </div>
        </motion.div>
    );
}

export default function AdminMagazine() {
    const confirm = useAdminConfirm();
    const { showToast } = useAdminToast();
    const [articles, setArticles] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [filterCat, setFilterCat] = useState('הכל');

    // ── Babushka drill stack ──────────────────────────────────────────────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);

    useEffect(() => {
        const q = query(collection(db, 'magazine_articles'), orderBy('createdAt', 'desc'));
        return onSnapshot(
            q,
            snap => { setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setListLoading(false); },
            err => {
                console.warn('[Magazine] Firestore listener error:', err?.message);
                showToast('שגיאה בטעינת הכתבות מהשרת', 'error');
                setListLoading(false);
            }
        );
    }, []);

    const handleAdd = async (form) => {
        setLoading(true);
        try {
            await addDoc(collection(db, 'magazine_articles'), { ...form, createdAt: serverTimestamp() });
            setShowAdd(false);
        } finally { setLoading(false); }
    };

    const handleEdit = async (form) => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'magazine_articles', editId), form);
            setEditId(null);
        } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!await confirm({ message: 'למחוק את הכתבה?', danger: true })) return;
        setDeleting(id);
        try { await deleteDoc(doc(db, 'magazine_articles', id)); }
        finally { setDeleting(null); }
    };

    const displayed = filterCat === 'הכל' ? articles : articles.filter(a => a.category === filterCat);
    const editArticle = articles.find(a => a.id === editId);
    const catCount = new Set(articles.map(a => a.category).filter(Boolean)).size;
    const srcCount = new Set(articles.map(a => a.source).filter(Boolean)).size;

    const byCategory = Object.entries(articles.reduce((acc, a) => {
        const k = a.category || 'ללא קטגוריה'; acc[k] = (acc[k] || 0) + 1; return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const bySource = Object.entries(articles.reduce((acc, a) => {
        const k = a.source || 'ללא מקור'; acc[k] = (acc[k] || 0) + 1; return acc;
    }, {})).sort((a, b) => b[1] - a[1]);

    const startEdit = (id) => { closeDrill(); setEditId(id); setShowAdd(false); };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto" dir="rtl">
            {/* Header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(BRAND, 0.10), border: `1px solid ${hexA(BRAND, 0.18)}`, boxShadow: SHADOW.specular }}>
                    <Newspaper size={22} color={BRAND} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>מגזין חדשנות</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>{articles.length} כתבות ב-Firestore</p>
                </div>
                <motion.button onClick={() => { setShowAdd(true); setEditId(null); }} whileHover={{ y: -2, boxShadow: `0 8px 26px ${hexA(BRAND, 0.45)}` }} whileTap={TAP}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: RADIUS.button, border: '1px solid rgba(255,255,255,0.25)', background: BRAND_GRAD, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 18px ${hexA(BRAND, 0.36)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    <Plus size={15} />הוסף כתבה
                </motion.button>
            </div>

            {/* KPI band — articles · categories · sources */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
                <AdminKPICard title="כתבות" value={articles.length} subtitle="ב-Firestore" accent={BRAND} delay={0}
                    icon={<Newspaper size={20} color={BRAND} />} onClick={() => openDrill({ type: 'kpi-total' })} />
                <AdminKPICard title="קטגוריות" value={catCount} subtitle="בשימוש פעיל" accent={BRAND} delay={0.05}
                    icon={<Tag size={20} color={BRAND} />} onClick={() => openDrill({ type: 'kpi-cats' })} />
                <AdminKPICard title="מקורות" value={srcCount} subtitle="מקורות תוכן" accent={BRAND} delay={0.1}
                    icon={<Globe size={20} color={BRAND} />} onClick={() => openDrill({ type: 'kpi-sources' })} />
            </div>

            {/* Note when Firestore is empty */}
            {!listLoading && articles.length === 0 && (
                <div className="mb-6 flex items-center gap-4 p-4 text-right"
                    style={{ ...glass, borderRadius: RADIUS.card }}>
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 42, height: 42, borderRadius: 13, background: BRAND_GRAD, boxShadow: `0 8px 20px ${hexA(BRAND, 0.30)}, inset 0 1px 0 rgba(255,255,255,0.45)` }}>
                        <Newspaper size={20} color="#fff" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-bold text-[#1D1D1F] mb-0.5">הכתבות הסטטיות מוצגות כרגע</p>
                        <p className="text-[12px] font-medium text-[#86868B]">הוסף כתבה אחת לפחות כדי שהמגזין יציג את הכתבות מה-Firestore.</p>
                    </div>
                </div>
            )}

            {/* Add form */}
            <AnimatePresence>
                {showAdd && <ArticleForm onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={loading} />}
            </AnimatePresence>

            {/* Category filter */}
            {!listLoading && articles.length > 0 && (
                <div className="mb-5 overflow-x-auto no-scrollbar pb-1">
                    <AdminFilterPills options={['הכל', ...CATEGORIES]} active={filterCat} onChange={setFilterCat} id="magazine-cat" />
                </div>
            )}

            {/* Article list */}
            <div className="flex flex-col gap-3">
                {listLoading && <AdminSkeleton rows={4} />}
                <AnimatePresence>
                    {displayed.map(article => (
                        <motion.div key={article.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            whileHover={editId === article.id ? undefined : { y: -2 }}
                            transition={SPRING.soft}
                            className="overflow-hidden"
                            style={{ ...glass, borderRadius: RADIUS.card }}>
                            {editId === article.id ? (
                                <div className="p-4">
                                    <ArticleForm initial={editArticle} onSave={handleEdit} onCancel={() => setEditId(null)} loading={loading} />
                                </div>
                            ) : (
                                <div className="flex items-start gap-4 p-4">
                                    {article.image && (
                                        <img src={article.image} alt="" className="w-20 h-14 object-cover rounded-xl shrink-0"
                                            onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                    )}
                                    <div role="button" tabIndex={0}
                                        onClick={() => openDrill({ type: 'article', id: article.id })}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'article', id: article.id }); } }}
                                        className="flex-1 min-w-0 text-right cursor-pointer focus:outline-none">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <span className="text-[9px] font-black text-[#C7C7CC]">{article.source}</span>
                                            <span className="text-[9px] font-black text-[#007AFF] bg-[rgba(0,122,255,0.10)] px-2 py-0.5 rounded-full">{article.category}</span>
                                        </div>
                                        <p className="text-[14px] font-bold text-[#1D1D1F] line-clamp-1 hover:text-[#007AFF] transition-colors">{article.title}</p>
                                        <p className="text-[12px] text-[#86868B] line-clamp-1 mt-0.5">{article.excerpt}</p>
                                        <p className="text-[11px] text-[#AEAEB2] mt-1">{article.date} · {article.readTime}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <motion.a href={article.url} target="_blank" rel="noopener noreferrer"
                                            whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: `linear-gradient(140deg, ${hexA(BRAND, 0.18)}, ${hexA(BRAND, 0.07)})`, border: `1px solid ${hexA(BRAND, 0.16)}`, color: '#007AFF', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${hexA(BRAND, 0.13)}` }}>
                                            <ExternalLink size={14} />
                                        </motion.a>
                                        <motion.button onClick={() => { setEditId(article.id); setShowAdd(false); }}
                                            whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: `linear-gradient(140deg, ${hexA(BRAND, 0.18)}, ${hexA(BRAND, 0.07)})`, border: `1px solid ${hexA(BRAND, 0.16)}`, color: '#007AFF', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${hexA(BRAND, 0.13)}` }}>
                                            <Edit2 size={14} />
                                        </motion.button>
                                        <motion.button onClick={() => handleDelete(article.id)} disabled={deleting === article.id}
                                            whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                                            style={{ background: 'linear-gradient(140deg, rgba(255,59,48,0.18), rgba(255,59,48,0.07))', border: '1px solid rgba(255,59,48,0.16)', color: '#FF3B30', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(255,59,48,0.13)' }}>
                                            {deleting === article.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!listLoading && displayed.length === 0 && (
                    <div className="overflow-hidden" style={{ ...glass, borderRadius: RADIUS.card }}>
                        <AdminEmpty
                            icon="empty"
                            title={articles.length === 0 ? 'אין כתבות ב-Firestore' : 'אין כתבות בקטגוריה זו'}
                            subtitle={articles.length === 0 ? 'הוסף כתבה ראשונה כדי שהמגזין יוצג מתוך Firestore' : 'בחר קטגוריה אחרת או הוסף כתבה חדשה'}
                            action={articles.length === 0 ? { label: 'הוסף כתבה', onClick: () => { setShowAdd(true); setEditId(null); } } : undefined}
                        />
                    </div>
                )}
            </div>

            {/* ── Babushka Drill Drawer — nested glass detail ─────────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const artRow = (a, i) => (
                    <DrillRow key={a.id} delay={i * 0.03}
                        onClick={() => pushDrill({ type: 'article', id: a.id })}
                        leading={<div className="w-11 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0">
                            <img src={a.image || IMG_FALLBACK} alt="" className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} /></div>}
                        title={a.title}
                        subtitle={`${a.category || '—'}${a.source ? ' · ' + a.source : ''}`}
                    />
                );
                const artList = (arr) => arr.length === 0
                    ? <DrillEmpty icon={Newspaper} text="אין כתבות להצגה" />
                    : <div className="space-y-2">{arr.map(artRow)}</div>;

                let title = '', subtitle = '', icon = null, footer = null, body = null;

                if (shown.type === 'kpi-total') {
                    title = 'כתבות'; subtitle = `${articles.length} כתבות ב-Firestore`;
                    icon = <Newspaper size={17} color={BRAND} />;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'כתבות', value: articles.length, color: BRAND },
                                { label: 'קטגוריות', value: catCount },
                                { label: 'מקורות', value: srcCount },
                            ]} />
                            {artList(articles)}
                        </div>
                    );
                } else if (shown.type === 'kpi-cats') {
                    title = 'קטגוריות'; subtitle = `${catCount} קטגוריות בשימוש`;
                    icon = <Tag size={17} color={BRAND} />;
                    body = byCategory.length === 0
                        ? <DrillEmpty icon={Tag} text="אין קטגוריות עדיין" />
                        : (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">לחץ לצלילה לכתבות</p>
                                {byCategory.map(([cat, count], i) => (
                                    <DrillRow key={cat} delay={i * 0.04}
                                        onClick={() => pushDrill({ type: 'cat', cat })}
                                        leading={<div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: hexA(BRAND, 0.12) }}><Tag size={13} style={{ color: BRAND }} /></div>}
                                        title={cat}
                                        subtitle={`${count} כתבות`}
                                        trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{count}</span>}
                                    />
                                ))}
                            </div>
                        );
                } else if (shown.type === 'kpi-sources') {
                    title = 'מקורות'; subtitle = `${srcCount} מקורות תוכן`;
                    icon = <Globe size={17} color={BRAND} />;
                    body = bySource.length === 0
                        ? <DrillEmpty icon={Globe} text="אין מקורות עדיין" />
                        : (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">לחץ לצלילה לכתבות</p>
                                {bySource.map(([src, count], i) => (
                                    <DrillRow key={src} delay={i * 0.04}
                                        onClick={() => pushDrill({ type: 'src', src })}
                                        leading={<div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: hexA(BRAND, 0.12) }}><Globe size={13} style={{ color: BRAND }} /></div>}
                                        title={src}
                                        subtitle={`${count} כתבות`}
                                        trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{count}</span>}
                                    />
                                ))}
                            </div>
                        );
                } else if (shown.type === 'cat') {
                    const arr = articles.filter(a => (a.category || 'ללא קטגוריה') === shown.cat);
                    title = shown.cat; subtitle = `${arr.length} כתבות בקטגוריה`;
                    icon = <Tag size={17} color={BRAND} />;
                    body = artList(arr);
                } else if (shown.type === 'src') {
                    const arr = articles.filter(a => (a.source || 'ללא מקור') === shown.src);
                    title = shown.src; subtitle = `${arr.length} כתבות ממקור זה`;
                    icon = <Globe size={17} color={BRAND} />;
                    body = artList(arr);
                } else if (shown.type === 'article') {
                    const a = articles.find(x => x.id === shown.id);
                    if (!a) {
                        title = 'כתבה'; icon = <Newspaper size={17} color={BRAND} />;
                        body = <DrillEmpty icon={Newspaper} text="הכתבה נמחקה או אינה זמינה" />;
                    } else {
                        title = a.title; subtitle = 'פרטי כתבה'; icon = <Newspaper size={17} color={BRAND} />;
                        if (a.url) footer = { label: 'פתח כתבה מקורית', onClick: () => window.open(a.url, '_blank', 'noopener') };
                        body = (
                            <div className="space-y-5">
                                {a.image && (
                                    <div className="rounded-[16px] overflow-hidden bg-[#F5F5F7] aspect-video">
                                        <img src={a.image} alt={a.title} className="w-full h-full object-cover"
                                            onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    <span className="text-[10px] font-black text-[#007AFF] bg-[rgba(0,122,255,0.10)] px-2 py-0.5 rounded-full">{a.category}</span>
                                    {a.source && <span className="text-[11px] font-bold text-[#86868B] flex items-center gap-1"><Globe size={11} />{a.source}</span>}
                                </div>
                                <div className="p-4 rounded-[16px] text-right" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p className="font-black text-[#1D1D1F] text-[16px] leading-snug mb-1.5">{a.title}</p>
                                    {a.excerpt && <p className="text-[13px] text-[#6E6E73] font-medium leading-relaxed">{a.excerpt}</p>}
                                </div>
                                <DrillStat items={[
                                    { label: 'תאריך', value: a.date || '—' },
                                    { label: 'זמן קריאה', value: a.readTime || '—' },
                                ]} />
                                {a.url && (
                                    <div className="p-3 rounded-[14px] text-right" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-1">קישור</p>
                                        <p className="text-[11px] font-mono text-[#3C3C43] break-all" dir="ltr">{a.url}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <motion.button onClick={() => startEdit(a.id)}
                                        whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer"
                                        style={{ background: `linear-gradient(140deg, ${hexA(BRAND, 0.14)}, ${hexA(BRAND, 0.05)})`, color: '#005EC4', border: `1px solid ${hexA(BRAND, 0.24)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${hexA(BRAND, 0.12)}` }}>
                                        <Edit2 size={14} /> ערוך כתבה
                                    </motion.button>
                                    <motion.button onClick={() => { handleDelete(a.id); closeDrill(); }}
                                        whileHover={{ y: -2 }} whileTap={TAP} transition={SPRING.snappy}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer"
                                        style={{ background: 'linear-gradient(140deg, rgba(255,59,48,0.13), rgba(255,59,48,0.05))', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(255,59,48,0.12)' }}>
                                        <Trash2 size={14} /> מחק
                                    </motion.button>
                                </div>
                            </div>
                        );
                    }
                }

                return (
                    <DashDrillView
                        open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={BRAND}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${shown.type}:${shown.id ?? shown.cat ?? shown.src ?? ''}:${drillStack.length}`}
                    >{body}</DashDrillView>
                );
            })()}
        </div>
    );
}
