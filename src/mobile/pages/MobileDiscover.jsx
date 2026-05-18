import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronLeft, TrendingUp, Zap, Gift, Monitor, Laptop2, FlaskConical, Volume2, Globe, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';
import PullToRefresh from '../components/PullToRefresh';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const CAT_ACCENTS = ['#007AFF', '#5856D6', '#007AFF', '#5856D6', '#007AFF', '#5856D6', '#007AFF', '#5856D6'];
const CAT_ICONS   = [Monitor, Laptop2, FlaskConical, Volume2, Zap, Globe, BookOpen, GraduationCap];

// ─── BlurFade animation wrapper ───────────────────────────────────────────────
function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-20px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

// ─── Category section with 2-column grid ─────────────────────────────────────
function CategorySection({ category, products, accent, CatIcon, navigate }) {
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {CatIcon && (
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CatIcon size={16} color={accent} strokeWidth={1.8} />
                    </div>
                    )}
                    <h2 style={{
                        fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em',
                        color: accent,
                    }}>
                        {category}
                    </h2>
                </div>
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
                            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position',
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

// ─── Horizontal swimlane ─────────────────────────────────────────────────────
const LANE_DEFS = [
    { key: 'trending', label: 'טרנדינג', icon: <TrendingUp size={14} />, from: '#FF375F', to: '#FF9F0A', filter: p => p._isBestSeller },
    { key: 'new',      label: 'חדשים',   icon: <Zap size={14} />,        from: '#007AFF', to: '#5856D6', filter: p => p.isNew },
    { key: 'deal',     label: 'מבצעים',  icon: <Gift size={14} />,       from: '#34C759', to: '#30B950', filter: p => !!p.salePrice },
];

function Swimlane({ products, lane, navigate, c }) {
    const items = products.filter(lane.filter).slice(0, 6);
    if (items.length === 0) return null;
    const grad = `linear-gradient(135deg, ${lane.from}, ${lane.to})`;
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        {lane.icon}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: lane.from }}>
                        {lane.label}
                    </h3>
                </div>
                <button onClick={() => { haptic('light'); navigate('/catalog'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: lane.from, fontSize: 12, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', fontFamily: SF }}>
                    ראה הכל <ChevronLeft size={12} strokeWidth={2.5} />
                </button>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '0 16px 4px' }}>
                {items.map(p => (
                    <motion.div key={p.id} whileTap={{ scale: 0.95 }} onClick={() => { haptic('light'); navigate(`/catalog/${p.id}`); }}
                        style={{ flexShrink: 0, width: 130, background: c.surface, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: c.cardShadow, WebkitTapHighlightColor: 'transparent' }}>
                        <div style={{ width: '100%', height: 100, overflow: 'hidden', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(p.image || p._seedImage) ? (
                                <img src={p.image || p._seedImage} alt={p.title} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                            ) : null}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.title}
                            </p>
                            {(p.salePrice || p.price) && (
                                <p style={{ fontSize: 12, fontWeight: 800, color: lane.from }}>
                                    ₪{Number(p.salePrice || p.price).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MobileDiscover() {
    const navigate = useNavigate();
    const { activeProducts, featuredProduct, refetch } = useProducts();
    const { colors: c } = useTheme();
    const { getSetting } = useSettings();

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
                    position: 'sticky', top: 96, zIndex: 100,
                    background: c.bg,
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
                                    {cat !== ALL && (() => { const TIcon = CAT_ICONS[(i - 1) % CAT_ICONS.length]; return <TIcon size={12} strokeWidth={2} />; })()}
                                    {cat}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Featured hero product ─────────────────────────────── */}
                {featuredProduct && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{ padding: '16px 16px 0' }}
                    >
                        <div
                            onClick={() => { haptic('light'); navigate(`/catalog/${featuredProduct.id}`); }}
                            style={{
                                borderRadius: 22, overflow: 'hidden', position: 'relative',
                                height: 220, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {featuredProduct.image && (
                                <img
                                    src={featuredProduct.image}
                                    alt={featuredProduct.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            )}
                            {/* Dark gradient overlay left side */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(to left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.30) 55%, transparent 100%)',
                            }} />
                            {/* Text overlay */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                padding: '20px 18px', direction: 'rtl',
                            }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)',
                                    borderRadius: 99, padding: '3px 10px', marginBottom: 8, alignSelf: 'flex-start',
                                }}>
                                    <Sparkles size={9} color="#64D2FF" />
                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>
                                        {getSetting('discover_hero_badge', 'נבחרת העונה')}
                                    </span>
                                </div>
                                <h2 style={{
                                    fontSize: 20, fontWeight: 900, color: '#fff',
                                    letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 10,
                                    maxWidth: '70%',
                                }}>
                                    {featuredProduct.title}
                                </h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: '#fff', color: '#1D1D1F',
                                        padding: '8px 16px', borderRadius: 99,
                                        fontSize: 12, fontWeight: 700,
                                    }}>
                                        {getSetting('discover_hero_cta', 'גלה את המפרט')} <ChevronLeft size={12} strokeWidth={2.5} />
                                    </div>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                                        color: '#fff', padding: '8px 16px', borderRadius: 99,
                                        fontSize: 12, fontWeight: 700,
                                    }}
                                        onClick={(e) => { e.stopPropagation(); haptic('light'); navigate('/catalog'); }}
                                    >
                                        לכל הקטלוג
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

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
                                {/* Swimlanes — only show on "הכל" tab */}
                                {activeCategory === ALL && LANE_DEFS.map(lane => (
                                    <Swimlane key={lane.key} products={activeProducts} lane={lane} navigate={navigate} c={c} />
                                ))}

                                {groupedCategories.map(({ cat, products }, sectionIdx) => {
                                    const catRealIdx = categories.indexOf(cat);
                                    const accent  = CAT_ACCENTS[(catRealIdx - 1) % CAT_ACCENTS.length];
                                    const CatIcon = CAT_ICONS[(catRealIdx - 1) % CAT_ICONS.length];
                                    return (
                                        <CategorySection
                                            key={cat}
                                            category={cat}
                                            products={products}
                                            accent={accent}
                                            CatIcon={CatIcon}
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
                                            background: c.surface,
                                            boxShadow: c.cardShadow,
                                            border: `1px solid ${c.border}`,
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                                            NEXTCLASS · כל הפתרונות
                                        </div>
                                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.04em', marginBottom: 6, lineHeight: 1.2 }}>
                                            רוצה לראות את כל הקטלוג?
                                        </h3>
                                        <p style={{ fontSize: 13, color: c.text3, marginBottom: 18, lineHeight: 1.5 }}>
                                            מאות פתרונות טכנולוגיים למוסדות חינוך
                                        </p>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 6,
                                            background: '#007AFF', padding: '10px 18px',
                                            borderRadius: 12, color: '#fff',
                                            fontSize: 14, fontWeight: 700,
                                            boxShadow: '0 4px 16px rgba(0,122,255,0.35)',
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
