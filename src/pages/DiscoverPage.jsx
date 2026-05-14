import { useMemo, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronDown, ArrowLeft, TrendingUp, Zap, Gift } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];
const PREVIEW_COUNT = 4;

const CategorySection = memo(({ cat, products, accent, sectionRef }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? products : products.slice(0, PREVIEW_COUNT);
    const hasMore = products.length > PREVIEW_COUNT;

    return (
        <section ref={sectionRef} className="mb-14 scroll-mt-28">
            <div className="flex items-end justify-between mb-6" dir="rtl">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#1D1D1F] leading-none">
                        {cat}
                    </h2>
                    <p className="text-xs text-[#86868B] font-medium mt-1.5">
                        {products.length} פתרונות זמינים
                    </p>
                </div>
                <Link
                    to={`/catalog?category=${encodeURIComponent(cat)}`}
                    className="group flex items-center gap-2 font-bold text-sm transition-all"
                    style={{ color: accent }}
                >
                    לכל הקטגוריה
                    <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-x-1"
                        style={{ background: `${accent}18` }}>
                        <ChevronLeft size={13} />
                    </div>
                </Link>
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <AnimatePresence>
                    {visible.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            layout
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {hasMore && (
                <div className="flex justify-center mt-8">
                    <motion.button
                        onClick={() => setExpanded(prev => !prev)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[13px] border transition-all"
                        style={{ borderColor: `${accent}40`, color: accent, background: `${accent}08` }}
                        dir="rtl"
                    >
                        {expanded ? 'הצג פחות' : `הצג את כל ${products.length} הפתרונות`}
                        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown size={15} />
                        </motion.div>
                    </motion.button>
                </div>
            )}
        </section>
    );
});
CategorySection.displayName = 'CategorySection';

// ── Swimlane stacked section ──────────────────────────────────────────────────
const LANE_STYLES = {
    trending: { from: '#FF375F', to: '#FF9F0A' },
    new:      { from: '#007AFF', to: '#5856D6' },
    deal:     { from: '#34C759', to: '#30B950' },
};

function SwimlaneSection({ lane }) {
    const style = LANE_STYLES[lane.badge] ?? LANE_STYLES.new;
    return (
        <section className="mb-14" dir="rtl">
            <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
                    >
                        <span className="text-white [&>svg]:w-4 [&>svg]:h-4">{lane.icon}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#1D1D1F] leading-none">
                            {lane.label}
                        </h2>
                        <p className="text-xs text-[#86868B] font-medium mt-1">
                            {lane.items.length} מוצרים
                        </p>
                    </div>
                </div>
                <Link
                    to="/catalog"
                    className="group flex items-center gap-2 font-bold text-sm transition-all"
                    style={{ color: style.from }}
                >
                    לכל הקטלוג
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-x-1"
                        style={{ background: `${style.from}18` }}
                    >
                        <ChevronLeft size={13} />
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {lane.items.slice(0, 4).map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.045, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const DiscoverPage = () => {
    const { getSetting } = useSettings();
    const { activeProducts, featuredProduct, bestSellers, newArrivals, dealProducts } = useProducts();

    const rawCats = getSetting(
        'catalog_categories',
        'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה'
    );
    const cmsCategories = useMemo(
        () => rawCats.split(',').map(c => c.trim()).filter(Boolean),
        [rawCats]
    );

    const categoryData = useMemo(() => {
        return cmsCategories
            .map((cat, i) => ({
                cat,
                products: activeProducts.filter(p => p.category === cat),
                accent: CAT_ACCENTS[i % CAT_ACCENTS.length],
            }))
            .filter(({ products }) => products.length > 0);
    }, [cmsCategories, activeProducts]);

    const swimlanes = useMemo(() => {
        const lanes = [];
        if (bestSellers.length >= 2) lanes.push({ id: 'top', label: getSetting('discover_best_label', 'הנמכרים ביותר'), icon: <TrendingUp size={13} />, badge: 'trending', items: bestSellers });
        const newItems = newArrivals.length >= 2 ? newArrivals : activeProducts.filter(p => !p.isFeatured).slice(8, 12);
        if (newItems.length >= 2) lanes.push({ id: 'new', label: getSetting('discover_new_label', 'חדש בחנות'), icon: <Zap size={13} />, badge: 'new', items: newItems });
        const dealItems = dealProducts.length >= 2 ? dealProducts : activeProducts.filter(p => p.price > 1000).slice(16, 20);
        if (dealItems.length >= 2) lanes.push({ id: 'deals', label: getSetting('discover_deals_label', 'מבצעים מיוחדים'), icon: <Gift size={13} />, badge: 'deal', items: dealItems });
        return lanes;
    }, [bestSellers, newArrivals, dealProducts, activeProducts, getSetting]);

    const [activeTab, setActiveTab] = useState(categoryData[0]?.cat ?? null);

    const hero = featuredProduct;

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-24 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-6 md:px-16">

                    {/* ── Page header ────────────────────────────────────── */}
                    <div className="pt-6 mb-10 relative" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 bg-white shadow-sm border border-white/60"
                        >
                            <Sparkles size={11} className="text-[#007AFF]" />
                            <span className="text-[10px] font-black tracking-[0.4em] text-[#007AFF]">
                                {getSetting('discover_eyebrow', 'מרכז הגילוי')}
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="font-black leading-[1.0] text-[#1D1D1F]"
                            style={{ fontSize: 'clamp(36px, 6vw, 80px)', letterSpacing: '-0.04em' }}
                        >
                            {(() => {
                                const t = getSetting('discover_title', 'הטכנולוגיה שמעצבת את המחר.');
                                const words = t.split(' ');
                                if (words.length < 2) return t;
                                const plain    = words.slice(0, -2).join(' ');
                                const accented = words.slice(-2).join(' ');
                                return (
                                    <>
                                        {plain}{' '}
                                        <span className="whitespace-nowrap" style={{
                                            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}>
                                            {accented}
                                        </span>
                                    </>
                                );
                            })()}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.7 }}
                            className="text-base md:text-lg text-[#6E6E73] font-medium leading-relaxed max-w-2xl mt-4"
                        >
                            {getSetting('discover_desc', 'אוסף נבחר של הכלים המתקדמים ביותר לחינוך, מחשוב ותשתיות למידה.')}
                        </motion.p>

                        <div className="absolute top-8 left-0 w-[360px] h-[240px] bg-[#007AFF]/7 blur-[100px] rounded-full pointer-events-none -z-10" />
                        <div className="absolute top-16 right-0 w-[260px] h-[180px] bg-[#BF5AF2]/6 blur-[80px] rounded-full pointer-events-none -z-10" />
                    </div>

                    {/* ── Featured hero product ───────────────────────────── */}
                    {hero && (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                            className="relative mb-10 rounded-[2rem] overflow-hidden group shadow-xl"
                            style={{ height: 300 }}
                        >
                            <img
                                src={hero.image}
                                alt={hero.title}
                                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/25 to-transparent" />

                            <div className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 text-right" dir="rtl">
                                <div
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 self-start w-fit"
                                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}
                                >
                                    <Sparkles size={10} className="text-[#64D2FF]" />
                                    <span className="text-[9px] font-black text-white tracking-widest">
                                        {getSetting('discover_hero_badge', 'נבחרת העונה')}
                                        {hero.sold ? ` · ${hero.sold}+ נמכרו` : ''}
                                    </span>
                                </div>

                                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight mb-3">
                                    {hero.title}
                                </h2>
                                <p className="text-sm text-gray-300 font-medium mb-5 max-w-xs line-clamp-2">
                                    {hero.description}
                                </p>

                                {/* Two CTAs */}
                                <div className="flex items-center gap-3 self-start flex-wrap">
                                    <Link
                                        to={`/catalog/${hero.id}`}
                                        className="inline-flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded-full hover:bg-[#007AFF] hover:text-white transition-all shadow-lg text-[13px]"
                                    >
                                        {getSetting('discover_hero_cta', 'גלה את המפרט')}
                                        <ChevronLeft size={14} />
                                    </Link>
                                    <Link
                                        to="/catalog"
                                        className="inline-flex items-center gap-2 text-white font-bold px-6 py-2.5 rounded-full text-[13px] transition-all"
                                        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}
                                    >
                                        לכל הקטלוג
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Swimlane sections (best sellers / new / deals) ── */}
                    {swimlanes.map(lane => (
                        <SwimlaneSection key={lane.id} lane={lane} />
                    ))}

                    {/* ── Sticky category tabs ────────────────────────────── */}
                    {categoryData.length > 1 && (
                        <div
                            className="sticky top-[64px] z-40 mb-10 -mx-6 md:-mx-16 px-6 md:px-16 py-3"
                            style={{
                                background: 'rgba(245,245,247,0.90)',
                                backdropFilter: 'blur(24px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" dir="rtl">
                                {categoryData.map(({ cat, accent }) => {
                                    const isActive = activeTab === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveTab(cat)}
                                            className="shrink-0 px-4 py-2 rounded-full font-bold text-[12px] whitespace-nowrap transition-all duration-300 cursor-pointer"
                                            style={isActive
                                                ? { background: accent, color: '#fff', boxShadow: `0 3px 12px ${accent}40` }
                                                : { background: 'rgba(0,0,0,0.04)', color: '#6E6E73' }
                                            }
                                        >
                                            {cat.split(' ')[0]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Category section — filtered by active tab ──────── */}
                    <AnimatePresence mode="wait">
                        {categoryData
                            .filter(({ cat }) => cat === activeTab)
                            .map(({ cat, products, accent }) => (
                                <motion.div
                                    key={cat}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <CategorySection
                                        cat={cat}
                                        products={products}
                                        accent={accent}
                                        sectionRef={() => {}}
                                    />
                                </motion.div>
                            ))
                        }
                    </AnimatePresence>

                    {/* ── Bottom callout ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-[2.5rem] overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(145deg, #0D1425 0%, #1A2B4A 100%)',
                            padding: '56px 48px',
                        }}
                    >
                        <div className="absolute top-0 right-0 w-56 h-56 bg-[#007AFF]/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#BF5AF2]/15 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10 text-center" dir="rtl">
                            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">
                                {getSetting('discover_callout_title', 'לא מצאתם את מה שחיפשתם?')}
                            </h3>
                            <p className="text-base text-white/60 font-medium mb-8 max-w-xl mx-auto leading-relaxed">
                                {getSetting('discover_callout_desc', 'היועצים המומחים שלנו כאן כדי לאפיין עבורכם את הפתרון המדויק.')}
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    to="/catalog"
                                    className="flex items-center gap-2 px-8 py-3.5 bg-white text-[#1D1D1F] rounded-full font-black text-[14px] hover:bg-[#007AFF] hover:text-white transition-all shadow-xl hover:shadow-[0_12px_30px_rgba(0,122,255,0.4)] hover:scale-105"
                                >
                                    לכל הקטלוג
                                    <ArrowLeft size={15} />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="px-8 py-3.5 rounded-full border border-white/20 text-white font-bold text-[14px] hover:bg-white/10 transition-all"
                                >
                                    דברו עם מומחה
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </PageTransition>
    );
};

export default memo(DiscoverPage);
