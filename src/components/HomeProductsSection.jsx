import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import ProductCard from './ProductCard';
import { ListCard } from './CatalogGrid';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

// How many products to show per category on the homepage
const HOMEPAGE_PREVIEW = 15;

// Accent color per category (same palette as mega menu & discover page)
const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];

const SORT_OPTIONS = [
    { id: 'default', labelKey: 'home_sort_rel',  defaultLabel: 'רלוונטיות' },
    { id: 'price-asc',  labelKey: 'home_sort_asc',  defaultLabel: 'מחיר: נמוך לגבוה' },
    { id: 'price-desc', labelKey: 'home_sort_desc', defaultLabel: 'מחיר: גבוה לנמוך' },
    { id: 'name',       labelKey: 'home_sort_name', defaultLabel: 'שם (א–ת)' },
];

const HomeProductsSection = () => {
    const { getSetting } = useSettings();
    const { activeProducts } = useProducts();

    // Categories from CMS
    const rawCats = getSetting(
        'catalog_categories',
        'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה'
    );
    const categories = useMemo(
        () => rawCats.split(',').map(c => c.trim()).filter(Boolean),
        [rawCats]
    );

    // Per-category products
    const productsByCat = useMemo(() => {
        const map = {};
        categories.forEach(cat => {
            map[cat] = activeProducts.filter(p => p.category === cat);
        });
        return map;
    }, [categories, activeProducts]);

    const [activeTab, setActiveTab] = useState(() => categories[0] ?? '');
    const [viewMode, setViewMode]   = useState('grid');
    const [sortBy,   setSortBy]     = useState('default');
    const [sortOpen, setSortOpen]   = useState(false);

    const tabIndex = categories.indexOf(activeTab);
    const accent = CAT_ACCENTS[tabIndex >= 0 ? tabIndex % CAT_ACCENTS.length : 0];

    const allInTab = productsByCat[activeTab] ?? [];
    const sorted = useMemo(() => {
        const arr = [...allInTab];
        if (sortBy === 'price-asc')  arr.sort((a, b) => a.price - b.price);
        if (sortBy === 'price-desc') arr.sort((a, b) => b.price - a.price);
        if (sortBy === 'name')       arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        return arr;
    }, [allInTab, sortBy]);

    const visible = sorted.slice(0, HOMEPAGE_PREVIEW);
    const total   = allInTab.length;

    const activeSortLabel = SORT_OPTIONS.find(o => o.id === sortBy);
    const sortLabel = getSetting(activeSortLabel?.labelKey ?? 'home_sort_rel', activeSortLabel?.defaultLabel ?? 'רלוונטיות');

    // Section CMS labels
    const eyebrow = getSetting('home_products_eyebrow', 'הפתרונות שלנו');
    const title   = getSetting('home_products_title',   'הכלים שמעצבים את המחר.');
    const sub     = getSetting('home_products_sub',     'בחרו קטגוריה וגלו את הפתרונות הטכנולוגיים המתאימים למוסד שלכם.');

    return (
        <section className="w-full bg-[#F5F5F7] pt-28 pb-32 overflow-hidden relative">

            {/* Ambient gradient blobs */}
            <div className="absolute top-0 right-1/3 w-[500px] h-[350px] bg-[#007AFF]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-[#BF5AF2]/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-16">

                {/* ── Section header ─────────────────────────────────────── */}
                <div className="text-center mb-16" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#007AFF] font-bold text-[10px] uppercase tracking-[0.25em] mb-7 shadow-sm border border-white/60"
                    >
                        <Sparkles size={11} strokeWidth={2.5} />
                        <span>{eyebrow}</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 22 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.08, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                        className="text-4xl sm:text-5xl md:text-[64px] font-black tracking-tight leading-[1.06] text-[#1D1D1F] mb-5"
                    >
                        {(() => {
                            const words = title.split(' ');
                            if (words.length < 2) return title;
                            const plain    = words.slice(0, -2).join(' ');
                            const accented = words.slice(-2).join(' ');
                            return (
                                <>
                                    {plain}{' '}
                                    <span
                                        className="whitespace-nowrap"
                                        style={{
                                            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        {accented}
                                    </span>
                                </>
                            );
                        })()}
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.18, duration: 0.75 }}
                        className="text-lg md:text-xl text-[#86868B] font-medium max-w-xl mx-auto leading-relaxed"
                    >
                        {sub}
                    </motion.p>
                </div>

                {/* ── Category tabs ──────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.22, duration: 0.6 }}
                    className="flex items-center justify-center flex-wrap gap-2.5 mb-14"
                    dir="rtl"
                >
                    {categories.map((cat, i) => {
                        const catAccent = CAT_ACCENTS[i % CAT_ACCENTS.length];
                        const isActive  = cat === activeTab;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className="shrink-0 px-6 py-2.5 rounded-full font-bold text-[13px] whitespace-nowrap transition-all duration-300 cursor-pointer"
                                style={isActive
                                    ? { background: catAccent, color: '#fff', boxShadow: `0 6px 20px ${catAccent}45` }
                                    : { background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }
                                }
                            >
                                {cat.split(' ')[0]}
                                {/* Show first word for compact tabs */}
                            </button>
                        );
                    })}
                </motion.div>

                {/* ── Controls: category info + view toggle + sort ───────── */}
                <div className="flex items-center justify-between gap-4 mb-8" dir="rtl">
                    {/* Left: category name */}
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1 h-7 rounded-full shrink-0" style={{ background: accent }} />
                        <div className="min-w-0">
                            <h3 className="text-xl md:text-2xl font-black tracking-tight text-[#1D1D1F] leading-none truncate">
                                {activeTab}
                            </h3>
                        </div>
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortOpen(o => !o)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E5E5EA] text-[#1D1D1F] font-bold text-[12px] hover:border-[#007AFF] transition-all cursor-pointer"
                                dir="rtl"
                            >
                                {sortLabel}
                                <svg className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <AnimatePresence>
                                {sortOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-xl border border-[#E5E5EA] overflow-hidden z-50"
                                        dir="rtl"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                                                className={`w-full text-right px-4 py-3 text-[13px] font-bold transition-colors hover:bg-[#F5F5F7] ${sortBy === opt.id ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}
                                            >
                                                {getSetting(opt.labelKey, opt.defaultLabel)}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View mode toggle */}
                        <div className="flex items-center p-1 rounded-full bg-white border border-[#E5E5EA]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-full transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                            >
                                <LayoutGrid size={15} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-full transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[#1D1D1F] text-white' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                            >
                                <List size={15} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* See all link */}
                        <Link
                            to={`/catalog?category=${encodeURIComponent(activeTab)}`}
                            className="group hidden sm:flex items-center gap-1.5 font-bold text-[12px] transition-all"
                            style={{ color: accent }}
                        >
                            ראה הכל
                            <ChevronLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* ── Product display ────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${activeTab}-${sortBy}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
                            : "flex flex-col gap-5 max-w-4xl mx-auto"
                        }>
                            {visible.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {viewMode === 'grid'
                                        ? <ProductCard product={product} />
                                        : <ListCard product={product} />
                                    }
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* ── Bottom CTAs ────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-4"
                    dir="rtl"
                >
                    <Link
                        to="/catalog"
                        className="group flex items-center gap-2.5 px-10 py-4 rounded-full bg-[#1D1D1F] text-white font-black text-[15px] hover:bg-[#007AFF] transition-all duration-300 shadow-xl hover:shadow-[0_12px_30px_rgba(0,122,255,0.35)] hover:scale-[1.02]"
                    >
                        {getSetting('home_products_cta1', 'לכל הקטלוג המלא')}
                        <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    </Link>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-concierge'))}
                        className="px-10 py-4 rounded-full border border-[#D2D2D7] bg-white text-[#1D1D1F] font-bold text-[15px] hover:border-[#1D1D1F] hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                        {getSetting('home_products_cta2', 'גלה פתרונות לפי צורך')}
                    </button>
                </motion.div>

            </div>
        </section>
    );
};

export default HomeProductsSection;
