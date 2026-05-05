import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal, X, Sparkles, Check, ShoppingCart, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import products from '../data/products';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import useCartPop from '../hooks/useCartPop';
import Magnetic from './Magnetic';

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

const CatalogGrid = () => {
    const [selectedCategory, setSelectedCategory] = useState("הכל");
    const [viewMode, setViewMode] = useState('grid');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [priceRange, setPriceRange] = useState([0, 30000]);

    const categories = useMemo(() => ["הכל", ...new Set(products.map(p => p.category))], []);

    const filteredProducts = useMemo(() => {
        let result = [...products];
        if (selectedCategory !== "הכל") {
            result = result.filter(p => p.category === selectedCategory);
        }
        result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
        
        if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
        else if (sortBy === 'name') result.sort((a, b) => a.title.localeCompare(b.title));
        
        return result;
    }, [selectedCategory, sortBy, priceRange]);

    return (
        <section className="w-full max-w-[1440px] mx-auto px-6 md:px-24 pt-20 pb-32 bg-[#F5F5F7] relative z-10">
            
            {/* ── Header Spotlight ── */}
            <div className="mb-20 text-center relative">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#007AFF] font-bold text-[10px] uppercase tracking-[0.2em] mb-8 shadow-sm border border-white/50"
                >
                    <Sparkles size={11} strokeWidth={2.5} />
                    <span>הקטלוג המוסדי</span>
                </motion.div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-[#1D1D1F] mb-8 whitespace-nowrap">
                    הכלים שמעצבים <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#5856D6]">את המחר.</span>
                </h2>
                <p className="text-lg md:text-xl text-[#86868B] font-medium max-w-2xl mx-auto leading-relaxed">
                    מצוינות טכנולוגית המותאמת אישית למוסדות חינוך, <br className="hidden md:block" />
                    בממשק חכם המעניק לכם חופש ליצור וללמד.
                </p>
            </div>

            {/* ── Controls Bar — Absolute Priority Interaction ── */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-20 relative z-50">
                
                {/* Categories Strip — scroll container with absolute overlay fades */}
                <div className="relative flex-1 min-w-0 overflow-hidden">
                    {/* Right fade overlay */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F5F5F7] to-transparent z-10 pointer-events-none" />
                    {/* Left fade overlay */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F5F5F7] to-transparent z-10 pointer-events-none" />

                    <div
                        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                        {/* Left safe-area spacer */}
                        <div className="shrink-0 w-8" />
                        {categories.map((category) => {
                            const isActive = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`
                                        shrink-0 px-7 py-3 rounded-full font-bold text-[14px]
                                        transition-all duration-300 whitespace-nowrap cursor-pointer relative overflow-hidden
                                        ${isActive
                                            ? 'bg-[#1D1D1F] text-white shadow-xl'
                                            : 'bg-white/60 backdrop-blur-xl border border-white/80 text-[#86868B] hover:text-[#1D1D1F] hover:bg-white'}
                                    `}
                                >
                                    {category}
                                </button>
                            );
                        })}
                        {/* Right safe-area spacer */}
                        <div className="shrink-0 w-20" />
                    </div>
                </div>

                {/* View Mode & Filter Toggles — Apple Luxury Glass */}
                <div className="flex items-center gap-4 shrink-0 pointer-events-auto">
                    {/* View Toggle */}
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

                    {/* Filter Button — Advanced Engine */}
                    <Magnetic strength={0.15}>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsFilterOpen(true);
                            }}
                            className="group relative flex items-center gap-3 px-8 py-4 rounded-full bg-[#1D1D1F] text-white font-bold text-[14px] shadow-2xl hover:scale-105 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="relative flex items-center justify-center">
                                <SlidersHorizontal size={18} strokeWidth={2.5} className="text-[#007AFF]" />
                                {(sortBy !== 'default' || priceRange[1] < 30000) && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#007AFF] rounded-full ring-2 ring-black animate-pulse" />
                                )}
                            </div>
                            <span>סינון מתקדם</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-liquid-glint" />
                        </button>
                    </Magnetic>
                </div>
            </div>

            {/* ── Product Display ── */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={`${selectedCategory}-${viewMode}-${sortBy}-${priceRange[1]}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className={
                        viewMode === 'grid'
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16"
                            : "flex flex-col gap-6 max-w-5xl mx-auto"
                    }
                >
                    {filteredProducts.map((product) => (
                        <div key={product.id}>
                            {viewMode === 'grid' ? (
                                <ProductCard product={product} />
                            ) : (
                                <ListCard product={product} />
                            )}
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* ── Filter Drawer — TOP LEVEL Z-INDEX ── */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 320, damping: 35 }}
                            className="fixed top-0 right-0 bottom-0 w-full md:max-w-md z-[1001] flex flex-col overflow-hidden"
                            style={{
                                background: 'rgba(255, 255, 255, 0.72)',
                                backdropFilter: 'blur(64px) saturate(2.1)',
                                WebkitBackdropFilter: 'blur(64px) saturate(2.1)',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                                boxShadow: '-20px 0 80px rgba(0,0,0,0.1)'
                            }}
                        >
                            {/* Inner Shine */}
                            <div className="absolute inset-0 pointer-events-none border-l border-white/80 z-10" />
                            
                            <div className="relative z-20 p-12 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex flex-col text-right w-full">
                                        <h3 className="text-4xl font-black tracking-tight text-[#1D1D1F]">סינון מתקדם</h3>
                                        <p className="text-sm text-gray-500 mt-2">התאימו את הקטלוג לצרכים שלכם</p>
                                    </div>
                                    <Magnetic strength={0.2}>
                                        <button onClick={() => setIsFilterOpen(false)} className="w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer shrink-0">
                                            <X size={24} strokeWidth={2} />
                                        </button>
                                    </Magnetic>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" dir="rtl">
                                    {/* Sort Section */}
                                    <section className="mb-14">
                                        <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-6">מיון לפי</p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'default', label: 'רלוונטיות' },
                                                { id: 'price-asc', label: 'מחיר: מהנמוך לגבוה' },
                                                { id: 'price-desc', label: 'מחיר: מהגבוה לנמוך' },
                                                { id: 'name', label: 'שם המוצר (א-ת)' },
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
                                            <span className="text-base font-black text-[#1D1D1F]">עד ₪{priceRange[1].toLocaleString()}</span>
                                        </div>
                                        <div className="px-2">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="30000" 
                                                step="500"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                                className="w-full h-2.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
                                            />
                                            <div className="flex justify-between mt-4 text-[11px] font-black text-gray-400">
                                                <span>₪0</span>
                                                <span>₪30,000+</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Special Filters */}
                                    <section className="mb-14">
                                        <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em] mb-6">מאפיינים מיוחדים</p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {['תומך AI', 'מוקשח (Rugged)', '4K UHD', 'אלחוטי', 'חיסכון בחשמל', 'Android 13', 'חינוך STEM'].map(tag => (
                                                <button key={tag} className="px-5 py-2.5 rounded-full border border-black/5 bg-white/30 text-xs font-bold text-gray-600 hover:bg-white hover:border-black/20 transition-all">
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-auto pt-10 flex gap-4 border-t border-black/5">
                                    <button 
                                        onClick={() => { setSortBy('default'); setPriceRange([0, 30000]); setSelectedCategory('הכל'); }}
                                        className="flex-1 py-5 rounded-2xl font-bold text-sm text-gray-400 hover:text-[#1D1D1F] transition-colors"
                                    >
                                        איפוס
                                    </button>
                                    <button 
                                        onClick={() => setIsFilterOpen(false)}
                                        className="flex-[2] py-5 rounded-2xl bg-[#007AFF] text-white font-black text-[15px] shadow-[0_12px_30px_rgba(0,122,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        הצג תוצאות
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Empty State ── */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-40 bg-white/50 backdrop-blur-sm rounded-[4rem] border border-dashed border-gray-200">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <SlidersHorizontal size={36} className="text-gray-300" />
                    </div>
                    <h3 className="text-3xl font-bold text-[#1D1D1F] mb-3">לא נמצאו מוצרים</h3>
                    <p className="text-gray-400 text-lg">נסה קטגוריה אחרת או אפס את המסננים</p>
                </div>
            )}
        </section>
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
                className="flex items-center gap-8 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-5 border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-2xl transition-all overflow-hidden"
            >
                {/* Image Section */}
                <div className="relative z-10 w-32 h-32 shrink-0 rounded-[1.75rem] overflow-hidden bg-white border border-gray-100">
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
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-medium max-w-xl">{description}</p>
                </div>

                {/* Price & Actions Section */}
                <div className="relative z-20 shrink-0 flex items-center gap-12 pl-6 mr-4 border-r border-gray-100">
                    <div className="text-left">
                        <div className="text-3xl font-bold text-[#1D1D1F] tabular-nums tracking-tighter">
                            {formattedPrice}
                        </div>
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">
                            מחיר מוסדי
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Compare */}
                        <Magnetic strength={0.2}>
                            <motion.button
                                onClick={handleCompareClick}
                                whileTap={{ scale: 0.9 }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${selected ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-white text-gray-400 border-gray-100 hover:border-[#007AFF] hover:text-[#007AFF]'}`}
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
                                className={`h-12 min-w-[140px] px-6 rounded-full font-bold text-[13px] tracking-tight flex items-center justify-center gap-2 shadow-lg transition-all ${isInCart ? 'bg-[#F5F5F7] text-[#1D1D1F]' : 'bg-[#007AFF] text-white hover:shadow-xl'}`}
                            >
                                <AnimatePresence mode="wait">
                                    {isInCart ? (
                                        <motion.span key="in-cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                                            <Check size={16} strokeWidth={3} className="text-green-500 group-hover:hidden" />
                                            <span className="group-hover:hidden">נוסף לעגלה</span>
                                            <X size={16} strokeWidth={2.5} className="hidden group-hover:block text-red-500" />
                                            <span className="hidden group-hover:block text-red-500">הסר</span>
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

export default CatalogGrid;
