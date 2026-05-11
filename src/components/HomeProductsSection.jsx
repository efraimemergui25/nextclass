import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import ProductCard from './ProductCard';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

// How many products to show per category on the homepage (not all)
const HOMEPAGE_PREVIEW = 4;

// Accent color per category (same palette as mega menu & discover page)
const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];

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
    const tabIndex = categories.indexOf(activeTab);
    const accent = CAT_ACCENTS[tabIndex >= 0 ? tabIndex % CAT_ACCENTS.length : 0];

    const visible = (productsByCat[activeTab] ?? []).slice(0, HOMEPAGE_PREVIEW);
    const total   = (productsByCat[activeTab] ?? []).length;

    // Section CMS labels
    const eyebrow = getSetting('home_products_eyebrow', 'הפתרונות שלנו');
    const title   = getSetting('home_products_title',   'הכלים שמעצבים את מחר החינוך.');
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
                        {title}
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

                {/* ── Active category label + product count ──────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Category name row */}
                        <div className="flex items-end justify-between mb-10" dir="rtl">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: accent }} />
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tight text-[#1D1D1F] leading-none">
                                        {activeTab}
                                    </h3>
                                    <p className="text-sm text-[#86868B] font-medium mt-1.5">
                                        {total} פתרונות זמינים
                                    </p>
                                </div>
                            </div>

                            <Link
                                to={`/catalog?category=${encodeURIComponent(activeTab)}`}
                                className="group flex items-center gap-2 font-bold text-[13px] transition-all"
                                style={{ color: accent }}
                            >
                                לכל {total} הפתרונות
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-110 group-hover:-translate-x-1"
                                    style={{ background: `${accent}18` }}
                                >
                                    <ChevronLeft size={14} />
                                </div>
                            </Link>
                        </div>

                        {/* Product grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                            {visible.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <ProductCard product={product} />
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
                    <Link
                        to="/discover"
                        className="px-10 py-4 rounded-full border border-[#D2D2D7] bg-white text-[#1D1D1F] font-bold text-[15px] hover:border-[#1D1D1F] hover:shadow-md transition-all duration-300"
                    >
                        {getSetting('home_products_cta2', 'גלה פתרונות לפי צורך')}
                    </Link>
                </motion.div>

            </div>
        </section>
    );
};

export default HomeProductsSection;
