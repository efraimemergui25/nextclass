/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, ExternalLink, X, Save, Loader, Newspaper, Tag, Globe } from 'lucide-react';
import { GLASS, RADIUS, SHADOW, SPRING, GRADIENT, TAP, hexA, glow } from '../theme/tokens';
import { AdminKPICard, AdminEmpty, AdminFilterPills } from '../components/AdminComponents';
import { useAdminConfirm } from '../context/AdminConfirmContext';

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
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">כותרת</label>
                    <input value={form.title} onChange={e => set('title', e.target.value)}
                        placeholder="כותרת המאמר"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">קטגוריה</label>
                    <select value={form.category} onChange={e => set('category', e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] bg-white">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">מקור</label>
                    <input value={form.source} onChange={e => set('source', e.target.value)}
                        placeholder="Edutopia / EdSurge / eSchool News..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">תאריך</label>
                    <input value={form.date} onChange={e => set('date', e.target.value)}
                        placeholder="17 מאי 2024"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div>
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">זמן קריאה</label>
                    <input value={form.readTime} onChange={e => set('readTime', e.target.value)}
                        placeholder="5 דק׳"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">תקציר</label>
                    <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
                        placeholder="2-3 משפטים המתארים את המאמר..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-right outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] resize-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">קישור לכתבה</label>
                    <input value={form.url} onChange={e => set('url', e.target.value)}
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-left outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-gray-400 tracking-wider mb-1.5">URL תמונה (Unsplash או כל כתובת)</label>
                    <input value={form.image} onChange={e => set('image', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        dir="ltr"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-left outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]" />
                </div>
            </div>

            <div className="flex gap-3 justify-start">
                <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.url}
                    className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-xl text-[13px] disabled:opacity-40 transition-all"
                    style={{ background: BRAND_GRAD, boxShadow: `0 4px 16px ${hexA(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                    שמור
                </button>
                <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-[13px] transition-all"
                    style={{ background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }}>
                    <X size={14} />ביטול
                </button>
            </div>
        </motion.div>
    );
}

export default function AdminMagazine() {
    const confirm = useAdminConfirm();
    const [articles, setArticles] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [filterCat, setFilterCat] = useState('הכל');

    useEffect(() => {
        const q = query(collection(db, 'magazine_articles'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
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
                    icon={<Newspaper size={20} color={BRAND} />} />
                <AdminKPICard title="קטגוריות" value={catCount} subtitle="בשימוש פעיל" accent={BRAND} delay={0.05}
                    icon={<Tag size={20} color={BRAND} />} />
                <AdminKPICard title="מקורות" value={srcCount} subtitle="מקורות תוכן" accent={BRAND} delay={0.1}
                    icon={<Globe size={20} color={BRAND} />} />
            </div>

            {/* Note when Firestore is empty */}
            {articles.length === 0 && (
                <div className="mb-6 p-5 rounded-2xl text-right"
                    style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.18)' }}>
                    <p className="text-[13px] font-bold text-[#007AFF] mb-1">הכתבות הסטטיות מוצגות כרגע</p>
                    <p className="text-[12px] text-[#007AFF]/70">הוסף כתבה אחת לפחות כדי שהמגזין יציג את הכתבות מה-Firestore.</p>
                </div>
            )}

            {/* Add form */}
            <AnimatePresence>
                {showAdd && <ArticleForm onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={loading} />}
            </AnimatePresence>

            {/* Category filter */}
            {articles.length > 0 && (
                <div className="mb-5 overflow-x-auto no-scrollbar pb-1">
                    <AdminFilterPills options={['הכל', ...CATEGORIES]} active={filterCat} onChange={setFilterCat} id="magazine-cat" />
                </div>
            )}

            {/* Article list */}
            <div className="flex flex-col gap-3">
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
                                    <div className="flex-1 min-w-0 text-right">
                                        <div className="flex items-center gap-2 justify-end mb-1">
                                            <span className="text-[9px] font-black text-gray-300">{article.source}</span>
                                            <span className="text-[9px] font-black text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-full">{article.category}</span>
                                        </div>
                                        <p className="text-[14px] font-bold text-[#1D1D1F] line-clamp-1">{article.title}</p>
                                        <p className="text-[12px] text-gray-400 line-clamp-1 mt-0.5">{article.excerpt}</p>
                                        <p className="text-[11px] text-gray-300 mt-1">{article.date} · {article.readTime}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: 'rgba(0,122,255,0.07)', color: '#007AFF' }}>
                                            <ExternalLink size={14} />
                                        </a>
                                        <button onClick={() => { setEditId(article.id); setShowAdd(false); }}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                            style={{ background: 'rgba(0,122,255,0.07)', color: '#007AFF' }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(article.id)} disabled={deleting === article.id}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                                            style={{ background: 'rgba(255,59,48,0.07)', color: '#FF3B30' }}>
                                            {deleting === article.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {displayed.length === 0 && (
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
        </div>
    );
}
