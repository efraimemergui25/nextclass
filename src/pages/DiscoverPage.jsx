import { useMemo, useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ChevronDown, ArrowLeft, TrendingUp, Zap, Gift } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

// ── Per-category accent colors (cycling) ──────────────────────────────────────
const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];

// ── How many products to show before "see all" expand ─────────────────────────
const PREVIEW_COUNT = 4;

// ─────────────────────────────────────────────────────────────────────────────
const CategorySection = memo(({ cat, products, accent, sectionRef }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? products : products.slice(0, PREVIEW_COUNT);
    const hasMore = products.length > PREVIEW_COUNT;

    return (
        <section ref={sectionRef} className="mb-24 scroll-mt-36">

            {/* Section header */}
            <div className="flex items-end justify-between mb-10" dir="rtl">
                <div>
                    <div
                        className="inline-block w-1 h-8 rounded-full mb-3"
                        style={{ background: accent }}
                    />
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#1D1D1F] leading-none">
                        {cat}
                    </h2>
                    <p className="text-sm text-[#86868B] font-medium mt-2">
                        {products.length} פתרונות זמינים
                    </p>
                </div>

                <Link
                    to={`/catalog?category=${encodeURIComponent(cat)}`}
                    className="group flex items-center gap-2 font-bold text-sm transition-all"
                    style={{ color: accent }}
                >
                    לכל הקטגוריה
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-x-1"
                        style={{ background: `${accent}18` }}
                    >
                        <ChevronLeft size={15} />
                    </div>
                </Link>
            </div>

            {/* Product grid */}
            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
                <AnimatePresence>
                    {visible.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            layout
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Expand / collapse */}
            {hasMore && (
                <div className="flex justify-center mt-10">
                    <motion.button
                        onClick={() => setExpanded(prev => !prev)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-[14px] border transition-all"
                        style={{
                            borderColor: `${accent}40`,
                            color: accent,
                            background: `${accent}08`,
                        }}
                        dir="rtl"
                    >
                        {expanded
                            ? 'הצג פחות'
                            : `הצג את כל ${products.length} הפתרונות`}
                        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown size={16} />
                        </motion.div>
                    </motion.button>
                </div>
            )}
        </section>
    );
});
CategorySection.displayName = 'CategorySection';

// ─────────────────────────────────────────────────────────────────────────────
const DiscoverPage = () => {
    const { getSetting } = useSettings();
    const { activeProducts, featuredProduct, bestSellers, newArrivals, dealProducts } = useProducts();

    // Derive categories from active products (ordered by which has most)
    const rawCats = getSetting(
        'catalog_categories',
        'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה'
    );
    const cmsCategories = useMemo(
        () => rawCats.split(',').map(c => c.trim()).filter(Boolean),
        [rawCats]
    );

    // Products grouped per category, only non-empty categories
    const categoryData = useMemo(() => {
        return cmsCategories
            .map((cat, i) => ({
                cat,
                products: activeProducts.filter(p => p.category === cat),
                accent: CAT_ACCENTS[i % CAT_ACCENTS.length],
            }))
            .filter(({ products }) => products.length > 0);
    }, [cmsCategories, activeProducts]);

    // Swimlane spotlights (best sellers, new, deals)
    const swimlanes = useMemo(() => {
        const lanes = [];
        if (bestSellers.length >= 2) lanes.push({ id: 'top', label: getSetting('discover_best_label', 'הנמכרים ביותר'), icon: <TrendingUp size={14} />, badge: 'trending', items: bestSellers });
        const newItems = newArrivals.length >= 2 ? newArrivals : activeProducts.filter(p => !p.isFeatured).slice(8, 12);
        if (newItems.length >= 2) lanes.push({ id: 'new', label: getSetting('discover_new_label', 'חדש בחנות'), icon: <Zap size={14} />, badge: 'new', items: newItems });
        const dealItems = dealProducts.length >= 2 ? dealProducts : activeProducts.filter(p => p.price > 1000).slice(16, 20);
        if (dealItems.length >= 2) lanes.push({ id: 'deals', label: getSetting('discover_deals_label', 'מבצעים מיוחדים'), icon: <Gift size={14} />, badge: 'deal', items: dealItems });
        return lanes;
    }, [bestSellers, newArrivals, dealProducts, activeProducts, getSetting]);

    // Sticky category tabs state
    const [activeTab, setActiveTab] = useState(categoryData[0]?.cat ?? null);
    const sectionRefs = useRef({});
    const tabsRef = useRef(null);

    // Observe which category section is in view → sync sticky tab
    useEffect(() => {
        if (!categoryData.length) return;
        const observers = [];
        categoryData.forEach(({ cat }) => {
            const el = sectionRefs.current[cat];
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveTab(cat); },
                { rootMargin: '-20% 0px -55% 0px', threshold: 0 }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [categoryData]);

    const scrollToCategory = (cat) => {
        const el = sectionRefs.current[cat];
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
        setActiveTab(cat);
    };

    const hero = featuredProduct;

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-32 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-6 md:px-16">

                    {/* ── Page header ────────────────────────────────────── */}
                    <div className="pt-16 mb-20 relative" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-white shadow-sm border border-white/60"
                        >
                            <Sparkles size={11} className="text-[#007AFF]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">
                                {getSetting('discover_eyebrow', 'מרכז הגילוי')}
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-5xl md:text-[72px] font-black tracking-tight leading-[1.05] text-[#1D1D1F] max-w-3xl"
                        >
                            {getSetting('discover_title', 'הטכנולוגיה שמעצבת את המחר.')}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.9 }}
                            className="text-lg md:text-xl text-[#6E6E73] font-medium leading-relaxed max-w-2xl mt-6"
                        >
                            {getSetting('discover_desc', 'אוסף נבחר של הכלים המתקדמים ביותר לחינוך, מחשוב ותשתיות למידה — כל מה שצריך כדי להפוך חזון למציאות.')}
                        </motion.p>

                        {/* Ambient glows */}
                        <div className="absolute top-8 left-0 w-[400px] h-[300px] bg-[#007AFF]/7 blur-[100px] rounded-full pointer-events-none -z-10" />
                        <div className="absolute top-16 right-0 w-[300px] h-[200px] bg-[#BF5AF2]/6 blur-[80px] rounded-full pointer-events-none -z-10" />
                    </div>

                    {/* ── Featured hero product ───────────────────────────── */}
                    {hero && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                            className="relative mb-20 rounded-[3rem] overflow-hidden group shadow-2xl"
                            style={{ height: 420 }}
                        >
                            <img
                                src={hero.image}
                                alt={hero.title}
                                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-[1.04]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/30 to-transparent" />

                            <div className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-10 md:p-16 text-right" dir="rtl">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 self-end w-fit"
                                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                    <Sparkles size={11} className="text-[#007AFF]" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                        {getSetting('discover_hero_badge', 'נבחרת העונה')}
                                        {hero.sold ? ` · ${hero.sold}+ נמכרו` : ''}
                                    </span>
                                </div>

                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-4">
                                    {hero.title}
                                </h2>
                                <p className="text-base text-gray-300 font-medium mb-8 max-w-sm line-clamp-2">
                                    {hero.description}
                                </p>
                                <Link
                                    to={`/catalog/${hero.id}`}
                                    className="inline-flex items-center gap-3 bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-[#007AFF] hover:text-white transition-all self-end shadow-xl text-sm"
                                >
                                    <span>{getSetting('discover_hero_cta', 'גלה את המפרט')}</span>
                                    <ChevronLeft size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Swimlane spotlights (best sellers, new, deals) ─── */}
                    {swimlanes.length > 0 && (
                        <div className="mb-24" dir="rtl">
                            <div className="flex items-center gap-3 mb-10">
                                {swimlanes.map(lane => (
                                    <span
                                        key={lane.id}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-md ${
                                            lane.badge === 'trending' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                            lane.badge === 'new'      ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                                                        'bg-gradient-to-r from-green-500 to-emerald-500'
                                        }`}
                                    >
                                        {lane.icon}
                                        {lane.label}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {swimlanes[0]?.items.slice(0, 4).map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05, duration: 0.55 }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Sticky category tabs ────────────────────────────── */}
                    {categoryData.length > 1 && (
                        <div
                            ref={tabsRef}
                            className="sticky top-[64px] z-40 mb-16 -mx-6 md:-mx-16 px-6 md:px-16 py-4"
                            style={{
                                background: 'rgba(245,245,247,0.88)',
                                backdropFilter: 'blur(24px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                            }}
                        >
                            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5" dir="rtl">
                                {categoryData.map(({ cat, accent }) => {
                                    const isActive = activeTab === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => scrollToCategory(cat)}
                                            className="shrink-0 px-5 py-2.5 rounded-full font-bold text-[13px] whitespace-nowrap transition-all duration-300 cursor-pointer"
                                            style={isActive
                                                ? { background: accent, color: '#fff', boxShadow: `0 4px 14px ${accent}40` }
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

                    {/* ── Category sections ──────────────────────────────── */}
                    {categoryData.map(({ cat, products, accent }) => (
                        <CategorySection
                            key={cat}
                            cat={cat}
                            products={products}
                            accent={accent}
                            sectionRef={el => { sectionRefs.current[cat] = el; }}
                        />
                    ))}

                    {/* ── Bottom callout ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-[3rem] overflow-hidden relative"
                        style={{
                            background: 'linear-gradient(145deg, #0D1425 0%, #1A2B4A 100%)',
                            padding: '80px 60px',
                        }}
                    >
                        {/* Glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#BF5AF2]/15 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10 text-center" dir="rtl">
                            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">
                                {getSetting('discover_callout_title', 'לא מצאתם את מה שחיפשתם?')}
                            </h3>
                            <p className="text-xl text-white/60 font-medium mb-12 max-w-xl mx-auto leading-relaxed">
                                {getSetting('discover_callout_desc', 'היועצים המומחים שלנו כאן כדי לאפיין עבורכם את הפתרון המדויק למוסד שלכם.')}
                            </p>
                            <div className="flex flex-wrap justify-center gap-5">
                                <Link
                                    to="/catalog"
                                    className="flex items-center gap-2 px-10 py-4 bg-white text-[#1D1D1F] rounded-full font-black text-[15px] hover:bg-[#007AFF] hover:text-white transition-all shadow-xl hover:shadow-[0_12px_30px_rgba(0,122,255,0.4)] hover:scale-105"
                                >
                                    לכל הקטלוג
                                    <ArrowLeft size={16} />
                                </Link>
                                <Link
                                    to="/contact"
                                    className="px-10 py-4 rounded-full border border-white/20 text-white font-bold text-[15px] hover:bg-white/10 transition-all"
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
