import { useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';
import PullToRefresh from '../components/PullToRefresh';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const COLS = 2;
const ITEM_HEIGHT = 290;

const SORT_OPTIONS = [
    { id: 'default',    label: 'רלוונטיות' },
    { id: 'price-asc',  label: 'מחיר: נמוך לגבוה' },
    { id: 'price-desc', label: 'מחיר: גבוה לנמוך' },
    { id: 'name',       label: 'שם (א-ת)' },
];

const PRICE_MIN_GLOBAL = 0;
const PRICE_MAX_GLOBAL = 100000;

export default function MobileCatalog() {
    const [searchParams] = useSearchParams();
    const { activeProducts, refetch } = useProducts();
    const { getSetting }  = useSettings();
    const { colors: c }   = useTheme();
    const allLabel = getSetting('catalog_all_cat', 'הכל');

    const categories = useMemo(() => [allLabel, ...new Set(activeProducts.map(p => p.category).filter(Boolean))], [activeProducts, allLabel]);
    const initCat = searchParams.get('category') ?? allLabel;

    const [search,      setSearch]      = useState('');
    const [category,    setCategory]    = useState(categories.includes(initCat) ? initCat : allLabel);
    const [sortBy,      setSortBy]      = useState('default');
    const [showSort,    setShowSort]    = useState(false);

    // Filter drawer state — price range slider (draft values while drawer is open)
    const [showFilter,      setShowFilter]      = useState(false);
    const [draftMin,        setDraftMin]        = useState(PRICE_MIN_GLOBAL);
    const [draftMax,        setDraftMax]        = useState(PRICE_MAX_GLOBAL);
    // Applied state (only committed when user taps Apply)
    const [appliedMin,      setAppliedMin]      = useState(PRICE_MIN_GLOBAL);
    const [appliedMax,      setAppliedMax]      = useState(PRICE_MAX_GLOBAL);

    const filterActive = appliedMin > PRICE_MIN_GLOBAL || appliedMax < PRICE_MAX_GLOBAL;
    const filterCount  = filterActive ? 1 : 0;

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
        // Price range filter
        list = list.filter(p => (p.price || 0) >= appliedMin && (p.price || 0) <= appliedMax);

        if (sortBy === 'price-asc')  list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sortBy === 'price-desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        if (sortBy === 'name')       list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'he'));
        return list;
    }, [activeProducts, category, search, sortBy, allLabel, appliedMin, appliedMax]);

    // Group into rows of 2 for virtual scrolling
    const rows = useMemo(() => {
        const result = [];
        for (let i = 0; i < filtered.length; i += COLS) {
            result.push(filtered.slice(i, i + COLS));
        }
        return result;
    }, [filtered]);

    // Virtual scrolling
    const listRef   = useRef(null);
    const [listTop, setListTop] = useState(210);

    useLayoutEffect(() => {
        if (listRef.current) {
            setListTop(listRef.current.getBoundingClientRect().top + window.scrollY);
        }
    }, [filtered.length]);

    const virtualizer = useWindowVirtualizer({
        count:         rows.length,
        estimateSize:  () => ITEM_HEIGHT,
        overscan:      4,
        scrollMargin:  listTop,
    });

    const currentSort = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'רלוונטיות';

    const handleRefresh = useCallback(async () => {
        haptic('light');
        await refetch?.();
    }, [refetch]);

    // Gesture velocity — swipe horizontally to switch category
    const handleCategorySwipe = useCallback((_, info) => {
        const { velocity, offset } = info;
        if (Math.abs(offset.x) < Math.abs(offset.y) * 1.3) return;
        const idx = categories.indexOf(category);
        if (velocity.x < -380 && idx < categories.length - 1) {
            haptic('select');
            setCategory(categories[idx + 1]);
        } else if (velocity.x > 380 && idx > 0) {
            haptic('select');
            setCategory(categories[idx - 1]);
        }
    }, [categories, category]);

    const isLoading = activeProducts.length === 0;

    // Filter drawer handlers
    const openFilter = () => {
        haptic('select');
        setDraftMin(appliedMin); // sync draft to applied when opening
        setDraftMax(appliedMax);
        setShowFilter(true);
    };
    const applyFilter = () => {
        haptic('select');
        setAppliedMin(draftMin);
        setAppliedMax(draftMax);
        setShowFilter(false);
    };
    const resetFilter = () => {
        haptic('select');
        setDraftMin(PRICE_MIN_GLOBAL);
        setDraftMax(PRICE_MAX_GLOBAL);
        setAppliedMin(PRICE_MIN_GLOBAL);
        setAppliedMax(PRICE_MAX_GLOBAL);
        setShowFilter(false);
    };

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100dvh', background: c.bg }}>

                {/* ── Search bar ─────────────────────────────────────────── */}
                <div style={{ position: 'sticky', top: 56, zIndex: 100, background: c.bg, backdropFilter: 'blur(20px)', padding: '10px 16px 0' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: c.input, borderRadius: 12,
                        padding: '9px 14px', marginBottom: 12,
                    }}>
                        <Search size={16} color={c.text4} strokeWidth={2} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="חיפוש מוצרים..."
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                fontSize: 16, color: c.text, direction: 'rtl', fontFamily: SF,
                            }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <X size={14} color={c.text4} />
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
                                    onClick={() => { haptic('select'); setCategory(cat); }}
                                    style={{
                                        flexShrink: 0, padding: '7px 14px', borderRadius: 99,
                                        background: active ? '#007AFF' : c.input,
                                        color: active ? '#fff' : c.text,
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

                {/* ── Sort + Filter + count bar ──────────────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 4px', position: 'relative', gap: 8 }}>

                    {/* Left side: Sort + Filter buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                        {/* Sort button */}
                        <div style={{ position: 'relative' }}>
                            <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setShowSort(v => !v)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: c.surface, border: `0.5px solid ${c.border}`,
                                    borderRadius: 10, padding: '7px 12px',
                                    fontSize: 13, fontWeight: 600, color: c.text,
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    boxShadow: c.cardShadow,
                                }}
                            >
                                <SlidersHorizontal size={13} color="#007AFF" />
                                {currentSort}
                                <ChevronDown size={12} color={c.text3} style={{ transform: showSort ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
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
                                            background: c.surface, borderRadius: 14,
                                            boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
                                            zIndex: 200, minWidth: 180, overflow: 'hidden',
                                            border: `0.5px solid ${c.border}`,
                                        }}
                                    >
                                        {SORT_OPTIONS.map((opt, i) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { haptic('select'); setSortBy(opt.id); setShowSort(false); }}
                                                style={{
                                                    width: '100%', padding: '13px 16px',
                                                    background: opt.id === sortBy ? 'rgba(0,122,255,0.06)' : 'none',
                                                    border: 'none',
                                                    borderBottom: i < SORT_OPTIONS.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                                    fontSize: 14, fontWeight: opt.id === sortBy ? 700 : 400,
                                                    color: opt.id === sortBy ? '#007AFF' : c.text,
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

                        {/* Filter button */}
                        <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={openFilter}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: filterActive ? 'rgba(0,122,255,0.08)' : c.surface,
                                border: filterActive ? `0.5px solid #007AFF` : `0.5px solid ${c.border}`,
                                borderRadius: 10, padding: '7px 12px',
                                fontSize: 13, fontWeight: 600,
                                color: filterActive ? '#007AFF' : c.text,
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                boxShadow: c.cardShadow, position: 'relative',
                            }}
                        >
                            <Filter size={13} color={filterActive ? '#007AFF' : c.text3} />
                            פילטר מתקדם
                            {filterCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -5, right: -5,
                                    width: 16, height: 16, borderRadius: 99,
                                    background: '#FF3B30', color: '#fff',
                                    fontSize: 10, fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {filterCount}
                                </span>
                            )}
                        </motion.button>
                    </div>

                    <span style={{ fontSize: 13, color: c.text3, fontWeight: 500, flexShrink: 0 }}>
                        {filtered.length} מוצרים
                    </span>
                </div>

                {/* ── Product grid ───────────────────────────────────────── */}
                {isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 16px 24px' }}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', boxShadow: c.cardShadow }}>
                                <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                                <div style={{ padding: '12px' }}>
                                    <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, marginBottom: 8 }} />
                                    <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, width: '60%' }} />
                                </div>
                            </div>
                        ))}
                        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: c.text3 }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>לא נמצאו מוצרים</p>
                        <p style={{ fontSize: 14 }}>נסה לשנות את הקטגוריה או מונח החיפוש</p>
                    </div>
                ) : (
                    // Virtual scrolling grid — wrapped in gesture velocity detector
                    <motion.div
                        onPanEnd={handleCategorySwipe}
                        style={{ touchAction: 'pan-y' }}
                    >
                    <div
                        ref={listRef}
                        style={{ height: virtualizer.getTotalSize(), position: 'relative', padding: '0 16px' }}
                    >
                        {virtualizer.getVirtualItems().map(vItem => (
                            <div
                                key={vItem.index}
                                data-index={vItem.index}
                                ref={virtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    transform: `translateY(${vItem.start - listTop}px)`,
                                    left: 16, right: 16,
                                    paddingBottom: 12,
                                }}
                            >
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {rows[vItem.index].map((p, i) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(vItem.index, 3) * 0.04 + i * 0.02, duration: 0.22 }}
                                        >
                                            <MobileProductCard product={p} size="md" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    </motion.div>
                )}

                {/* ── Filter drawer — backdrop + bottom sheet ─────────────── */}
                <AnimatePresence>
                    {showFilter && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                key="filter-backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                onClick={() => setShowFilter(false)}
                                style={{
                                    position: 'fixed', inset: 0,
                                    background: 'rgba(0,0,0,0.45)',
                                    zIndex: 300,
                                }}
                            />

                            {/* Drawer */}
                            <motion.div
                                key="filter-drawer"
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 320 }}
                                style={{
                                    position: 'fixed', bottom: 0, left: 0, right: 0,
                                    background: c.surface,
                                    borderRadius: '24px 24px 0 0',
                                    zIndex: 400,
                                    padding: '0 20px 40px',
                                    boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                                    fontFamily: SF,
                                    direction: 'rtl',
                                }}
                            >
                                {/* Drag handle */}
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                                    <div style={{ width: 36, height: 4, borderRadius: 99, background: c.divider }} />
                                </div>

                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 20px' }}>
                                    <p style={{ fontSize: 17, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>פילטר מתקדם</p>
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        onClick={() => setShowFilter(false)}
                                        style={{ background: c.input, border: 'none', borderRadius: 99, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={16} color={c.text3} />
                                    </motion.button>
                                </div>

                                {/* Price range section — dual range sliders */}
                                <p style={{ fontSize: 13, fontWeight: 700, color: c.text3, letterSpacing: '0.03em', marginBottom: 16 }}>טווח מחיר</p>

                                {/* Price display */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 8, marginBottom: 20, direction: 'rtl',
                                }}>
                                    <span style={{ fontSize: 17, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>
                                        ₪{draftMin.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: 14, color: c.text4, fontWeight: 500 }}>—</span>
                                    <span style={{ fontSize: 17, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>
                                        {draftMax >= PRICE_MAX_GLOBAL ? 'ללא הגבלה' : `₪${draftMax.toLocaleString()}`}
                                    </span>
                                </div>

                                {/* Min slider */}
                                <div style={{ marginBottom: 12 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: c.text4, marginBottom: 6 }}>מחיר מינימלי</p>
                                    <input
                                        type="range"
                                        min={PRICE_MIN_GLOBAL}
                                        max={PRICE_MAX_GLOBAL}
                                        step={500}
                                        value={draftMin}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setDraftMin(Math.min(val, draftMax - 500));
                                        }}
                                        style={{
                                            width: '100%', direction: 'rtl',
                                            accentColor: '#007AFF', height: 4,
                                            cursor: 'pointer',
                                        }}
                                    />
                                </div>

                                {/* Max slider */}
                                <div style={{ marginBottom: 28 }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: c.text4, marginBottom: 6 }}>מחיר מקסימלי</p>
                                    <input
                                        type="range"
                                        min={PRICE_MIN_GLOBAL}
                                        max={PRICE_MAX_GLOBAL}
                                        step={500}
                                        value={draftMax}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setDraftMax(Math.max(val, draftMin + 500));
                                        }}
                                        style={{
                                            width: '100%', direction: 'rtl',
                                            accentColor: '#007AFF', height: 4,
                                            cursor: 'pointer',
                                        }}
                                    />
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={resetFilter}
                                        style={{
                                            flex: 1, padding: '14px 0',
                                            background: c.input, border: 'none',
                                            borderRadius: 14, fontSize: 15, fontWeight: 700,
                                            color: c.text3, cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent',
                                            fontFamily: SF,
                                        }}
                                    >
                                        איפוס
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={applyFilter}
                                        style={{
                                            flex: 2, padding: '14px 0',
                                            background: '#007AFF', border: 'none',
                                            borderRadius: 14, fontSize: 15, fontWeight: 700,
                                            color: '#fff', cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent',
                                            fontFamily: SF,
                                        }}
                                    >
                                        החל פילטר
                                    </motion.button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PullToRefresh>
    );
}
