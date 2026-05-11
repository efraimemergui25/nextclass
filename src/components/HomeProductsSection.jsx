import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft, ArrowLeft, LayoutGrid, List, ShoppingCart, Check, Zap, Star } from 'lucide-react';
import ProductCard from './ProductCard';
import { ListCard } from './CatalogGrid';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import useCartPop from '../hooks/useCartPop';

// How many products to show per category on the homepage (not all)
const HOMEPAGE_PREVIEW = 4;

// Accent color per category (same palette as mega menu & discover page)
const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];

const SORT_OPTIONS = [
    { id: 'default', labelKey: 'home_sort_rel',  defaultLabel: 'רלוונטיות' },
    { id: 'price-asc',  labelKey: 'home_sort_asc',  defaultLabel: 'מחיר: נמוך לגבוה' },
    { id: 'price-desc', labelKey: 'home_sort_desc', defaultLabel: 'מחיר: גבוה לנמוך' },
    { id: 'name',       labelKey: 'home_sort_name', defaultLabel: 'שם (א–ת)' },
];

// ── Featured Hero Card — shown above the product grid ─────────────────────────
const FeaturedHeroCard = ({ product, accent }) => {
    const { addToCart, cartItems } = useCart();
    const { state, trigger } = useCartPop();
    if (!product) return null;

    const isInCart = (cartItems ?? []).some(i => i.id === product.id);
    const effectivePrice = product.salePrice ? Number(product.salePrice) : (product.price ?? 0);
    const discountPct = product.salePrice
        ? Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100)
        : 0;

    const handleCart = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isInCart) trigger(() => addToCart(product))();
    }, [isInCart, product, addToCart, trigger]);

    return (
        <motion.div
            layout
            className="w-full mb-10 rounded-[2.5rem] overflow-hidden relative"
            style={{
                background: 'linear-gradient(135deg, #1D1D1F 0%, #2C2C2E 100%)',
                boxShadow: `0 30px 80px -10px ${accent}30, 0 0 0 1px rgba(255,255,255,0.06)`,
            }}
        >
            <div className="flex flex-col md:flex-row items-stretch min-h-[280px]" dir="rtl">
                {/* Text side */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]"
                                style={{ background: `${accent}20`, color: accent }}>
                                <Star size={9} fill="currentColor" />
                                המוצר המוביל בקטגוריה
                            </span>
                            {product.isNew && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-[#30D158]/20 text-[#30D158]">חדש</span>
                            )}
                            {discountPct > 0 && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FF375F]/20 text-[#FF375F]">{discountPct}% הנחה</span>
                            )}
                        </div>

                        <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2 block" style={{ color: accent }}>
                            {product.category?.split(' ')[0]}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug mb-3">
                            {product.title}
                        </h3>
                        <p className="text-[#86868B] text-sm leading-relaxed line-clamp-2 mb-5">
                            {product.description}
                        </p>

                        {/* Specs chips */}
                        {product.specs?.slice(0, 3).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {product.specs.slice(0, 3).map((s, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                                        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Zap size={9} style={{ color: accent }} />
                                        {s.label}: {s.value}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <motion.button
                            onClick={handleCart}
                            animate={isInCart ? { backgroundColor: '#34C759' } : state !== 'idle' ? { scale: state === 'loading' ? 0.93 : 1.04 } : undefined}
                            whileTap={!isInCart && state === 'idle' ? { scale: 0.95 } : undefined}
                            disabled={state !== 'idle' && !isInCart}
                            className="h-12 px-7 rounded-full font-black text-[13px] text-white flex items-center gap-2 shadow-xl cursor-pointer"
                            style={{ backgroundColor: isInCart ? '#34C759' : accent }}
                        >
                            {isInCart || state === 'success' ? <><Check size={15} strokeWidth={3} /> נוסף לעגלה</> : <><ShoppingCart size={14} strokeWidth={2.5} /> הוסף לעגלה</>}
                        </motion.button>
                        <Link
                            to={`/catalog/${product.id}`}
                            className="flex items-center gap-1.5 text-[13px] font-bold hover:opacity-70 transition-opacity"
                            style={{ color: accent }}
                        >
                            לפרטים המלאים
                            <ChevronLeft size={13} />
                        </Link>
                        <div className="mr-auto text-right">
                            {product.salePrice && (
                                <span className="block text-xs text-[#636366] line-through">₪{Number(product.price).toLocaleString()}</span>
                            )}
                            <span className="text-2xl font-black text-white tracking-tight">
                                ₪{effectivePrice.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Image side */}
                <div className="w-full md:w-[42%] relative overflow-hidden min-h-[200px] md:min-h-0">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}15 0%, transparent 60%)` }} />
                    <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover opacity-90"
                        style={{ mixBlendMode: 'luminosity' }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                        }}
                    />
                    {/* Gradient fade into left (text) side */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1D1D1F] via-transparent to-transparent md:block hidden" />
                </div>
            </div>
        </motion.div>
    );
};

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
                        {/* Featured hero card — first product in category */}
                        {viewMode === 'grid' && sorted[0] && (
                            <FeaturedHeroCard product={sorted[0]} accent={accent} />
                        )}

                        {/* Product grid — remaining products */}
                        <div className={viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10"
                            : "flex flex-col gap-5 max-w-4xl mx-auto"
                        }>
                            {(viewMode === 'grid' ? visible.slice(1) : visible).map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
