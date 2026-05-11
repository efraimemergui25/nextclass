import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X, Check } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import Magnetic from '../components/Magnetic';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import useCartPop from '../hooks/useCartPop';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import RecentlyViewedTray from '../components/RecentlyViewedTray';
import { ShoppingCart, Scale } from 'lucide-react';

// ─── Animation variants ────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.04, delayChildren: 0.05 }
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 320, damping: 26 }
    },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

const cartBtnVariants = {
    idle: { scale: 1, backgroundColor: '#007AFF' },
    loading: { scale: 0.92, backgroundColor: '#007AFF' },
    success: { scale: 1.06, backgroundColor: '#34C759' },
};

const ImageFallback = React.memo(() => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    </div>
));

const CatalogPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const tabsRef = useRef(null);

    const { getSetting } = useSettings();
    const { activeProducts: products } = useProducts();
    const allLabel = getSetting('catalog_all_cat', 'הכל');
    const categories = useMemo(() => [allLabel, ...new Set(products.map(p => p.category))], [products, allLabel]);

    const initialCat = searchParams.get('category') ?? allLabel;
    const [selectedCategory, setSelectedCategory] = useState(
        categories.includes(initialCat) ? initialCat : allLabel
    );

    const [sortBy, setSortBy] = useState('default');
    const [priceRange, setPriceRange] = useState([0, 30000]);

    const maxPrice = useMemo(() => {
        if (!products.length) return 30000;
        const max = Math.max(...products.map(p => Number(p.price) || 0));
        return Math.ceil(max / 1000) * 1000 || 10000;
    }, [products]);

    const priceStep = useMemo(() => {
        if (maxPrice <= 2000) return 50;
        if (maxPrice <= 10000) return 200;
        if (maxPrice <= 30000) return 500;
        return 1000;
    }, [maxPrice]);

    useEffect(() => {
        setPriceRange(prev => [prev[0], Math.max(prev[1], maxPrice)]);
    }, [maxPrice]);

    // ─── Scroll restoration via sessionStorage ────────────────────────────────
    const scrollKey = 'catalog_scroll_pos';
    useEffect(() => {
        const saved = sessionStorage.getItem(scrollKey);
        if (saved) {
            requestAnimationFrame(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }));
            sessionStorage.removeItem(scrollKey);
        }
    }, []);

    useEffect(() => {
        const saveScroll = () => sessionStorage.setItem(scrollKey, String(window.scrollY));
        window.addEventListener('beforeunload', saveScroll);
        return () => window.removeEventListener('beforeunload', saveScroll);
    }, []);

    const handleProductClick = useCallback(() => {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
    }, []);

    // ─── Sync URL with category ────────────────────────────────────────────────
    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setSearchParams(cat === allLabel ? {} : { category: cat });
        setIsFilterOpen(false);
    };

    // ─── Recently Viewed ───────────────────────────────────────────────────────
    const { recentIds } = useRecentlyViewed();

    const filtered = useMemo(() => {
        let result = selectedCategory === allLabel
            ? [...products]
            : products.filter(p => p.category === selectedCategory);

        // Hide admin-deactivated products
        result = result.filter(p => p.isActive !== false);

        result = result.filter(p => {
            const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        if (sortBy === 'price-asc') result.sort((a, b) => Number(a.price) - Number(b.price));
        else if (sortBy === 'price-desc') result.sort((a, b) => Number(b.price) - Number(a.price));
        else if (sortBy === 'name') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

        return result;
    }, [products, selectedCategory, sortBy, priceRange]);

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-32 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">

                    {/* ── Page Header ───────────────────────────────────────── */}
                    <div className="mb-10 text-right">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#007AFF] font-bold text-[10px] uppercase tracking-[0.2em] mb-8 shadow-sm border border-white/50"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
                            <span>{getSetting('catalog_badge', 'הקטלוג המוסדי')}</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="text-3xl sm:text-5xl md:text-8xl font-bold text-[#1D1D1F] tracking-tighter leading-[1.05] mb-5 sm:mb-8"
                        >
                            {getSetting('catalog_title', 'הכלים שמעצבים את המחר.')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="text-xl text-[#AEAEB2] font-medium max-w-xl leading-relaxed mr-0 ml-auto"
                        >
                            {getSetting('catalog_subtitle', 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.')}
                        </motion.p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8 mb-10 sm:mb-16 relative z-50">
                        {/* Category Tabs — RIGHT SIDE (First in RTL) */}
                        <div className="relative flex-1 min-w-0 overflow-hidden">
                            <div
                                ref={tabsRef}
                                className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2"
                                style={{
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                }}
                            >
                                {categories.map(cat => {
                                    const active = selectedCategory === cat;
                                    return (
                                        <motion.button
                                            key={cat}
                                            onClick={() => handleCategorySelect(cat)}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`shrink-0 px-7 py-3 rounded-full font-bold text-[14px] transition-all duration-300 whitespace-nowrap ${
                                                active
                                                    ? 'bg-[#1D1D1F] text-white shadow-xl scale-105'
                                                    : 'bg-white/60 backdrop-blur-xl border border-white/80 text-[#86868B] hover:text-[#1D1D1F] hover:bg-white shadow-sm'
                                            }`}
                                        >
                                            {cat}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Controls — LEFT SIDE (End in RTL) */}
                        <div className="flex items-center gap-4 shrink-0">
                            {/* View Toggle — Apple Luxury Glass */}
                            <div className="flex items-center p-1.5 rounded-full bg-white/40 backdrop-blur-3xl border border-white/60 shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-full transition-all duration-500 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#007AFF] shadow-md scale-105' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                                >
                                    <LayoutGrid size={18} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-full transition-all duration-500 cursor-pointer ${viewMode === 'list' ? 'bg-white text-[#007AFF] shadow-md scale-105' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                                >
                                    <List size={18} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Filter Button — Advanced Engine Style */}
                            <Magnetic strength={0.15}>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsFilterOpen(true);
                                    }}
                                    className="group relative flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full bg-[#1D1D1F] text-white font-bold text-[13px] sm:text-[14px] shadow-2xl hover:scale-105 transition-all cursor-pointer overflow-hidden"
                                >
                                    <div className="relative flex items-center justify-center">
                                        <SlidersHorizontal size={18} strokeWidth={2.5} className="text-[#007AFF]" />
                                    </div>
                                    <span>{getSetting('catalog_filter_btn', 'סינון מתקדם')}</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-liquid-glint" />
                                </button>
                            </Magnetic>
                        </div>
                    </div>

                    {/* Hairline divider */}
                    <div className="hairline mb-10" />

                    {/* ── Product Grid / List ────────────────────────────────── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${selectedCategory}-${viewMode}-${sortBy}-${priceRange[1]}`}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8'
                                    : 'flex flex-col gap-4'
                            }
                        >
                            {filtered.map(product => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    onClick={handleProductClick}
                                >
                                    {viewMode === 'list' ? (
                                        <ListCard product={product} />
                                    ) : (
                                        <ProductCard product={product} />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* ── Smart Empty State ──────────────────────────────────── */}
                    <AnimatePresence>
                        {filtered.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-24 flex flex-col items-center gap-6"
                            >
                                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                                    style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.12)' }}>
                                    🔍
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[#1D1D1F] mb-2">{getSetting('catalog_empty_msg', 'לא נמצאו מוצרים')}</p>
                                    <p className="text-[#AEAEB2] font-medium">{getSetting('catalog_empty_hint', 'נסה קטגוריה אחרת או שנה את הפילטרים')}</p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => { setSortBy('default'); setPriceRange([0, maxPrice]); setSelectedCategory(allLabel); setSearchParams({}); }}
                                    className="px-8 py-3 rounded-full bg-[#007AFF] text-white font-bold text-sm shadow-[0_8px_20px_rgba(0,122,255,0.3)] hover:shadow-[0_12px_28px_rgba(0,122,255,0.4)] transition-all"
                                >
                                    הצג את כל המוצרים
                                </motion.button>

                                {/* 3 random product suggestions */}
                                {products.length > 0 && (
                                    <div className="w-full mt-8">
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#86868B] mb-6">אולי תאהב</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            {products.slice(0, 3).map(p => (
                                                <ProductCard key={p.id} product={p} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Recently Viewed ─────────────────────────────────────────── */}
                <RecentlyViewedTray recentIds={recentIds} />

                {/* ── Filter Drawer ──────────────────────────────────────────── */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-[#1D1D1F]/20 backdrop-blur-md z-[200]"
                            />
                            
                            {/* Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                className="fixed top-0 right-0 bottom-0 w-full md:max-w-md z-[210] flex flex-col md:rounded-l-[3.5rem] overflow-hidden p-8 md:p-12"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.90)',
                                    backdropFilter: 'blur(60px) saturate(2)',
                                    WebkitBackdropFilter: 'blur(60px) saturate(2)',
                                    borderLeft: '1px solid rgba(255, 255, 255, 0.7)',
                                    boxShadow: '-40px 0 80px rgba(0,0,0,0.15)',
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-12">
                                    <div className="text-right">
                                        <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">{getSetting('catalog_filter_btn', 'סינון מתקדם')}</h2>
                                        <p className="text-sm text-[#86868B] mt-2 font-medium">התאימו את הקטלוג לצרכים שלכם</p>
                                    </div>
                                    <Magnetic strength={0.2}>
                                        <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer shrink-0">
                                            <X size={24} strokeWidth={2.5} />
                                        </button>
                                    </Magnetic>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" dir="rtl">
                                    {/* Sort Section */}
                                    <section className="mb-14">
                                        <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-6 text-right">{getSetting('catalog_sort_label', 'מיון לפי')}</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'default', label: getSetting('catalog_sort_rel', 'רלוונטיות') },
                                                { id: 'price-asc', label: getSetting('catalog_sort_pasc', 'מחיר: מהנמוך לגבוה') },
                                                { id: 'price-desc', label: getSetting('catalog_sort_pdesc', 'מחיר: מהגבוה לנמוך') },
                                                { id: 'name', label: getSetting('catalog_sort_name', 'שם המוצר (א-ת)') },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setSortBy(opt.id)}
                                                    className={`text-right px-7 py-4 rounded-2xl text-[15px] font-bold transition-all border ${sortBy === opt.id ? 'bg-[#1D1D1F] text-white border-transparent shadow-xl' : 'bg-white/40 border-black/5 hover:border-black/20'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Price Range Section */}
                                    <section className="mb-14">
                                        <div className="flex justify-between items-center mb-6">
                                            <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em]">טווח מחירים</p>
                                            <AnimatePresence mode="wait">
                                                <motion.span
                                                    key={priceRange[1]}
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 4 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="text-base font-black text-[#1D1D1F]"
                                                >
                                                    {priceRange[1] >= maxPrice ? 'ללא הגבלה' : `עד ₪${priceRange[1].toLocaleString()}`}
                                                </motion.span>
                                            </AnimatePresence>
                                        </div>
                                        <div className="px-1">
                                            <input
                                                type="range"
                                                dir="ltr"
                                                min="0"
                                                max={maxPrice}
                                                step={priceStep}
                                                value={Math.min(priceRange[1], maxPrice)}
                                                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                                style={{
                                                    background: `linear-gradient(to right, #007AFF ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%, rgba(0,0,0,0.1) ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%)`
                                                }}
                                                className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_2px_10px_rgba(0,0,0,0.25)] [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-[#007AFF] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                                            />
                                            <div className="flex justify-between mt-3 text-[11px] font-bold text-[#AEAEB2]" dir="ltr">
                                                <span>₪0</span>
                                                <span>+₪{maxPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {priceRange[1] < maxPrice && (
                                                <motion.button
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    onClick={() => setPriceRange([0, maxPrice])}
                                                    className="mt-3 text-[11px] text-[#007AFF] font-bold hover:underline block"
                                                >
                                                    הצג את כל המחירים
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </section>

                                    {/* Categories inside drawer (for mobile/redundancy) */}
                                    <section className="mb-14">
                                        <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-6 text-right">קטגוריה</p>
                                        <div className="flex flex-wrap gap-2.5 justify-start">
                                            {categories.map(cat => (
                                                <button 
                                                    key={cat}
                                                    onClick={() => handleCategorySelect(cat)}
                                                    className={`px-5 py-2.5 rounded-full border transition-all text-xs font-bold ${selectedCategory === cat ? 'bg-[#1D1D1F] text-white border-transparent shadow-lg' : 'border-black/5 bg-white/30 text-gray-600 hover:bg-white hover:border-black/20'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-auto pt-10 flex gap-4 border-t border-black/5">
                                    <button 
                                        onClick={() => { setSortBy('default'); setPriceRange([0, maxPrice]); setSelectedCategory(allLabel); }}
                                        className="flex-1 py-5 rounded-2xl font-bold text-sm text-[#AEAEB2] hover:text-[#1D1D1F] transition-colors"
                                    >
                                        איפוס
                                    </button>
                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-[2] py-5 rounded-2xl bg-[#007AFF] text-white font-black text-[15px] shadow-[0_12px_30px_rgba(0,122,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        הצג {filtered.length} תוצאות
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

// ─── Refined List View Card — Fully Functional & Premium ───────────────────────
const ListCard = ({ product }) => {
    const { id, category, title, price, image, description, specs } = product ?? {};
    const [imgError, setImgError] = React.useState(false);

    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const { cartItems, addToCart, removeFromCart } = useCart();
    const { state: popState, trigger } = useCartPop();

    const formattedPrice = React.useMemo(() => `₪${(price ?? 0).toLocaleString()}`, [price]);
    const selected = React.useMemo(() => isSelected(id), [isSelected, id]);
    const isInCart = React.useMemo(() => (cartItems ?? []).some(item => item?.id === id), [cartItems, id]);

    const handleImgError = React.useCallback((e) => {
        if (!e.target.dataset.triedFallback) {
            e.target.dataset.triedFallback = 'true';
            e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
        } else {
            setImgError(true);
        }
    }, []);

    const handleCompareClick = React.useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (selected) removeFromCompare(id);
        else addToCompare({ id, title, price: formattedPrice, imageUrl: image, category, specs });
    }, [selected, id, title, formattedPrice, image, category, specs, addToCompare, removeFromCompare]);

    const handleCartToggle = React.useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (isInCart) removeFromCart(id);
        else trigger(() => addToCart(product))();
    }, [isInCart, id, product, addToCart, removeFromCart, trigger]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative"
        >
            <motion.div
                whileHover={{ y: -4 }}
                className="flex items-center gap-4 sm:gap-8 bg-white/60 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all overflow-hidden"
            >
                {/* Image Section */}
                <div className="relative z-10 w-20 h-20 sm:w-32 sm:h-32 shrink-0 rounded-[1.25rem] sm:rounded-[1.75rem] overflow-hidden bg-white border border-gray-100">
                    {imgError || !image ? (
                        <ImageFallback />
                    ) : (
                        <img
                            src={image}
                            alt={title}
                            onError={handleImgError}
                            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                        />
                    )}
                </div>

                {/* Content Section */}
                <div className="relative z-10 flex-1 text-right min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#007AFF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100/40">
                            {category}
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-[#1D1D1F] tracking-tight line-clamp-1 mb-1">{title}</h3>
                    <p className="text-sm text-[#86868B] line-clamp-2 leading-relaxed font-medium max-w-xl">{description}</p>
                </div>

                {/* Price & Actions Section */}
                <div className="relative z-20 shrink-0 flex items-center gap-4 sm:gap-12 pl-4 sm:pl-6 mr-2 sm:mr-4 border-r border-gray-100">
                    <div className="text-left hidden sm:block">
                        <div className="text-xl sm:text-3xl font-bold text-[#1D1D1F] tabular-nums tracking-tighter">
                            {formattedPrice}
                        </div>
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">
                            {getSetting('catalog_inst_price', 'מחיר מוסדי')}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Compare */}
                        <Magnetic strength={0.2}>
                            <motion.button
                                onClick={handleCompareClick}
                                whileTap={{ scale: 0.9 }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${selected ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-white text-[#AEAEB2] border-gray-100 hover:border-[#007AFF] hover:text-[#007AFF]'}`}
                            >
                                <Scale size={18} strokeWidth={2.5} />
                            </motion.button>
                        </Magnetic>

                        {/* Add to Cart */}
                        <Magnetic strength={0.1}>
                            <motion.button
                                onClick={handleCartToggle}
                                animate={popState === 'idle' ? undefined : cartBtnVariants[popState]}
                                whileTap={{ scale: 0.95 }}
                                className={`group/cart h-12 min-w-[100px] sm:min-w-[140px] px-4 sm:px-6 rounded-full font-bold text-[12px] sm:text-[13px] tracking-tight flex items-center justify-center gap-2 shadow-lg transition-all ${isInCart ? 'bg-[#F5F5F7] text-[#1D1D1F]' : 'bg-[#007AFF] text-white hover:shadow-xl'}`}
                            >
                                <AnimatePresence mode="wait">
                                    {isInCart ? (
                                        <motion.span key="in-cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 group-hover/cart:hidden">
                                                <Check size={16} strokeWidth={3} className="text-green-500" />
                                                <span>נוסף לעגלה</span>
                                            </div>
                                            <div className="hidden group-hover/cart:flex items-center gap-2 text-red-500">
                                                <X size={16} strokeWidth={2.5} />
                                                <span>הסר</span>
                                            </div>
                                        </motion.span>
                                    ) : (
                                        <motion.span key="add-to-cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                            {popState === 'loading' ? '...' : (
                                                <>
                                                    <ShoppingCart size={16} strokeWidth={2.5} />
                                                    הוסף לעגלה
                                                </>
                                            )}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </Magnetic>
                    </div>
                </div>

                {/* Overlaid Link for whole card navigation (except buttons) */}
                <Link to={`/catalog/${id}`} className="absolute inset-0 z-0 rounded-[2.5rem]" />
            </motion.div>
        </motion.div>
    );
};

export default CatalogPage;
