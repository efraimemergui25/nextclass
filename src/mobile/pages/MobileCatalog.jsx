import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const SORT_OPTIONS = [
    { id: 'default',    label: 'רלוונטיות' },
    { id: 'price-asc',  label: 'מחיר: נמוך לגבוה' },
    { id: 'price-desc', label: 'מחיר: גבוה לנמוך' },
    { id: 'name',       label: 'שם (א-ת)' },
];

export default function MobileCatalog() {
    const [searchParams] = useSearchParams();
    const { activeProducts } = useProducts();
    const { getSetting }     = useSettings();
    const allLabel = getSetting('catalog_all_cat', 'הכל');

    const categories = useMemo(() => [allLabel, ...new Set(activeProducts.map(p => p.category).filter(Boolean))], [activeProducts, allLabel]);
    const initCat = searchParams.get('category') ?? allLabel;

    const [search,   setSearch]   = useState('');
    const [category, setCategory] = useState(categories.includes(initCat) ? initCat : allLabel);
    const [sortBy,   setSortBy]   = useState('default');
    const [showSort, setShowSort] = useState(false);

    const filtered = useMemo(() => {
        let list = activeProducts;
        if (category !== allLabel) list = list.filter(p => p.category === category);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            );
        }
        if (sortBy === 'price-asc')  list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sortBy === 'price-desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        if (sortBy === 'name')       list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'he'));
        return list;
    }, [activeProducts, category, search, sortBy, allLabel]);

    const currentSort = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'רלוונטיות';

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100vh' }}>

            {/* ── Search bar ─────────────────────────────────────────── */}
            <div style={{ position: 'sticky', top: 56, zIndex: 100, background: 'rgba(242,242,247,0.95)', backdropFilter: 'blur(20px)', padding: '10px 16px 0' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(118,118,128,0.12)', borderRadius: 12,
                    padding: '9px 14px', marginBottom: 12,
                }}>
                    <Search size={16} color="rgba(60,60,67,0.45)" strokeWidth={2} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="חיפוש מוצרים..."
                        style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none',
                            fontSize: 16, color: '#1D1D1F', direction: 'rtl', fontFamily: SF,
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <X size={14} color="rgba(60,60,67,0.45)" />
                        </button>
                    )}
                </div>

                {/* Category chips */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 12 }}>
                    {categories.map(cat => {
                        const active = cat === category;
                        return (
                            <motion.button
                                key={cat}
                                whileTap={{ scale: 0.93 }}
                                onClick={() => setCategory(cat)}
                                style={{
                                    flexShrink: 0, padding: '7px 14px', borderRadius: 99,
                                    background: active ? '#007AFF' : 'rgba(118,118,128,0.12)',
                                    color: active ? '#fff' : '#1D1D1F',
                                    border: 'none', fontSize: 13, fontWeight: active ? 700 : 500,
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    transition: 'background 0.18s, color 0.18s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {cat}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── Sort + count bar ───────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 4px', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                    <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setShowSort(v => !v)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
                            borderRadius: 10, padding: '7px 12px',
                            fontSize: 13, fontWeight: 600, color: '#1D1D1F',
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                    >
                        <SlidersHorizontal size={13} color="#007AFF" />
                        {currentSort}
                        <ChevronDown size={12} color="#86868B" style={{ transform: showSort ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                    </motion.button>

                    <AnimatePresence>
                        {showSort && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.16 }}
                                style={{
                                    position: 'absolute', top: '110%', left: 0,
                                    background: '#fff', borderRadius: 14,
                                    boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
                                    zIndex: 200, minWidth: 180, overflow: 'hidden',
                                    border: '0.5px solid rgba(0,0,0,0.08)',
                                }}
                            >
                                {SORT_OPTIONS.map((opt, i) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                                        style={{
                                            width: '100%', padding: '13px 16px',
                                            background: opt.id === sortBy ? 'rgba(0,122,255,0.06)' : 'none',
                                            border: 'none',
                                            borderBottom: i < SORT_OPTIONS.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                                            fontSize: 14, fontWeight: opt.id === sortBy ? 700 : 400,
                                            color: opt.id === sortBy ? '#007AFF' : '#1D1D1F',
                                            cursor: 'pointer', textAlign: 'right',
                                            direction: 'rtl', fontFamily: SF,
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <span style={{ fontSize: 13, color: '#86868B', fontWeight: 500 }}>
                    {filtered.length} מוצרים
                </span>
            </div>

            {/* ── Product grid ───────────────────────────────────────── */}
            {activeProducts.length === 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px 24px' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                            <div style={{ width: '100%', aspectRatio: '1', background: 'linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                            <div style={{ padding: '12px' }}>
                                <div style={{ height: 12, borderRadius: 6, background: '#F2F2F7', marginBottom: 8 }} />
                                <div style={{ height: 12, borderRadius: 6, background: '#F2F2F7', width: '60%' }} />
                            </div>
                        </div>
                    ))}
                    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', color: '#86868B' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>לא נמצאו מוצרים</p>
                    <p style={{ fontSize: 14 }}>נסה לשנות את הקטגוריה או מונח החיפוש</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px 24px' }}>
                    {filtered.map(p => (
                        <MobileProductCard key={p.id} product={p} size="md" />
                    ))}
                </div>
            )}
        </div>
    );
}
