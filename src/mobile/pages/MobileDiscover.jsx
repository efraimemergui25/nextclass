import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronLeft } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';
import PullToRefresh from '../components/PullToRefresh';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#5AC8FA', '#FF6B35', '#34C759'];
const CAT_EMOJIS  = ['🖥️', '💻', '🔬', '🔊', '⚡', '🌐', '📚', '🎓'];

// ─── BlurFade animation wrapper ───────────────────────────────────────────────
function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-20px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 18, filter: 'blur(5px)', scale: 0.98 }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

// ─── Category section with 2-column grid ─────────────────────────────────────
function CategorySection({ category, products, accent, emoji, navigate }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });

    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 32 }}
        >
            {/* Section header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', marginBottom: 14,
            }}>
                <button
                    onClick={() => { haptic('light'); navigate(`/catalog?category=${encodeURIComponent(category)}`); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        background: 'none', border: 'none',
                        color: accent, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        fontFamily: SF,
                    }}
                >
                    ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2 style={{
                        fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                        background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        {category}
                    </h2>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${accent}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                    }}>
                        {emoji}
                    </div>
                </div>
            </div>

            {/* 2-column product grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 12, padding: '0 16px',
            }}>
                {products.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                        transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <MobileProductCard product={p} size="md" />
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

// ─── Skeleton grid for loading state ─────────────────────────────────────────
function SkeletonGrid({ c }) {
    return (
        <div style={{ padding: '0 16px' }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            {/* fake section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0' }}>
                <div style={{ width: 60, height: 14, borderRadius: 7, background: c.shimmerA }} />
                <div style={{ width: 100, height: 22, borderRadius: 8, background: c.shimmerA }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', boxShadow: c.cardShadow }}>
                        <div style={{
                            width: '100%', aspectRatio: '1',
                            background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`,
                            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
                        }} />
                        <div style={{ padding: '12px' }}>
                            <div style={{ height: 11, borderRadius: 6, background: c.shimmerA, marginBottom: 8, width: '80%' }} />
                            <div style={{ height: 11, borderRadius: 6, background: c.shimmerA, width: '50%', marginBottom: 10 }} />
                            <div style={{ height: 36, borderRadius: 10, background: c.shimmerA }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ c, navigate }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center', padding: '72px 32px', color: c.text3 }}
        >
            <div style={{
                width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
                background: 'rgba(0,122,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Compass size={36} color="#007AFF" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 8, letterSpacing: '-0.03em' }}>
                אין מוצרים להצגה
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>
                הקטלוג יתעדכן בקרוב עם פתרונות חינוכיים מתקדמים.
            </p>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptic('light'); navigate('/catalog'); }}
                style={{
                    background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                    color: '#fff', border: 'none', borderRadius: 14,
                    padding: '13px 28px', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    fontFamily: SF, boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
                }}
            >
                חזור לקטלוג
            </motion.button>
        </motion.div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MobileDiscover() {
    const navigate = useNavigate();
    const { activeProducts, refetch } = useProducts();
    const { colors: c } = useTheme();

    const ALL = 'הכל';

    // Derive ordered category list
    const categories = useMemo(
        () => [ALL, ...new Set(activeProducts.map(p => p.category).filter(Boolean))],
        [activeProducts]
    );

    const [activeCategory, setActiveCategory] = useState(ALL);

    // Products grouped by category (filtered by active tab)
    const groupedCategories = useMemo(() => {
        const cats = activeCategory === ALL
            ? categories.filter(c => c !== ALL)
            : [activeCategory];

        return cats.map(cat => ({
            cat,
            products: activeProducts.filter(p => p.category === cat),
        })).filter(g => g.products.length > 0);
    }, [activeProducts, categories, activeCategory]);

    const isLoading = activeProducts.length === 0;

    const handleRefresh = useCallback(async () => {
        haptic('light');
        await refetch?.();
    }, [refetch]);

    const tabsRef = useRef(null);

    const handleTabSelect = useCallback((cat) => {
        haptic('select');
        setActiveCategory(cat);
        // Scroll the tab strip to show the selected tab
        if (tabsRef.current) {
            const btn = tabsRef.current.querySelector(`[data-cat="${CSS.escape(cat)}"]`);
            btn?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }, []);

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100dvh', background: c.bg }}>
                <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

                {/* ── Sticky header ──────────────────────────────────────── */}
                <div style={{
                    position: 'sticky', top: 56, zIndex: 100,
                    background: c.bg,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: `0.5px solid ${c.divider}`,
                }}>
                    {/* Title + subtitle */}
                    <div style={{ padding: '14px 16px 0' }}>
                        <BlurFade delay={0}>
                            <div>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                                    fontSize: 11, fontWeight: 700, padding: '4px 10px',
                                    borderRadius: 99, marginBottom: 8, letterSpacing: '0.04em',
                                }}>
                                    <Compass size={11} strokeWidth={2.5} />
                                    NEXTCLASS · גלייה
                                </div>
                                <h1 style={{
                                    fontSize: 26, fontWeight: 900, color: c.text,
                                    letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 4,
                                }}>
                                    גלו את הפתרונות שלנו
                                </h1>
                                <p style={{ fontSize: 13, color: c.text3, marginBottom: 14, lineHeight: 1.4 }}>
                                    טכנולוגיה חינוכית מתקדמת, מסודרת לפי תחום
                                </p>
                            </div>
                        </BlurFade>
                    </div>

                    {/* Category tab strip */}
                    <div
                        ref={tabsRef}
                        style={{
                            display: 'flex', gap: 8,
                            overflowX: 'auto', scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            padding: '0 16px 12px',
                        }}
                    >
                        {categories.map((cat, i) => {
                            const active = cat === activeCategory;
                            const accent = cat === ALL ? '#007AFF' : CAT_ACCENTS[(i - 1) % CAT_ACCENTS.length];
                            return (
                                <motion.button
                                    key={cat}
                                    data-cat={cat}
                                    whileTap={{ scale: 0.91 }}
                                    onClick={() => handleTabSelect(cat)}
                                    style={{
                                        flexShrink: 0,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '7px 14px', borderRadius: 99,
                                        background: active ? accent : c.input,
                                        color: active ? '#fff' : c.text,
                                        border: 'none',
                                        fontSize: 13, fontWeight: active ? 700 : 500,
                                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                        transition: 'background 0.18s, color 0.18s',
                                        whiteSpace: 'nowrap', fontFamily: SF,
                                        boxShadow: active ? `0 3px 12px ${accent}40` : 'none',
                                    }}
                                >
                                    {cat !== ALL && (
                                        <span style={{ fontSize: 12 }}>
                                            {CAT_EMOJIS[(i - 1) % CAT_EMOJIS.length]}
                                        </span>
                                    )}
                                    {cat}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Content ───────────────────────────────────────────── */}
                <div style={{ paddingTop: 20, paddingBottom: 40 }}>
                    {isLoading ? (
                        <>
                            <SkeletonGrid c={c} />
                            <SkeletonGrid c={c} />
                        </>
                    ) : groupedCategories.length === 0 ? (
                        <EmptyState c={c} navigate={navigate} />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeCategory}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {groupedCategories.map(({ cat, products }, sectionIdx) => {
                                    const catRealIdx = categories.indexOf(cat);
                                    const accent = CAT_ACCENTS[(catRealIdx - 1) % CAT_ACCENTS.length];
                                    const emoji  = CAT_EMOJIS[(catRealIdx - 1) % CAT_EMOJIS.length];
                                    return (
                                        <CategorySection
                                            key={cat}
                                            category={cat}
                                            products={products}
                                            accent={accent}
                                            emoji={emoji}
                                            navigate={navigate}
                                        />
                                    );
                                })}

                                {/* Bottom CTA */}
                                <div style={{ padding: '0 16px', marginTop: 8 }}>
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { haptic('light'); navigate('/catalog'); }}
                                        style={{
                                            borderRadius: 20, padding: '22px 22px',
                                            cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #1D1D1F 0%, #2C2C2E 100%)',
                                            boxShadow: '0 6px 28px rgba(0,0,0,0.22)',
                                            WebkitTapHighlightColor: 'transparent',
                                            position: 'relative', overflow: 'hidden',
                                        }}
                                    >
                                        {/* Accent glow */}
                                        <div style={{
                                            position: 'absolute', top: -40, right: -40,
                                            width: 180, height: 180, borderRadius: '50%',
                                            background: 'radial-gradient(circle, rgba(0,122,255,0.22) 0%, transparent 70%)',
                                            pointerEvents: 'none',
                                        }} />
                                        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginBottom: 8 }}>
                                            NEXTCLASS · כל הפתרונות
                                        </p>
                                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 6, lineHeight: 1.2 }}>
                                            רוצה לראות את כל הקטלוג?
                                        </h3>
                                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
                                            מאות פתרונות טכנולוגיים למוסדות חינוך
                                        </p>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            background: 'rgba(0,122,255,0.9)', padding: '10px 18px',
                                            borderRadius: 12, color: '#fff',
                                            fontSize: 14, fontWeight: 700,
                                        }}>
                                            לקטלוג המלא
                                            <ChevronLeft size={14} strokeWidth={2.5} />
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </PullToRefresh>
    );
}
