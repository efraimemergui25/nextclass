import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X, Check } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import products from '../data/products';

const categories = ['הכל', ...new Set(products.map(p => p.category))];

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

const CatalogPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const tabsRef = useRef(null);

    const initialCat = searchParams.get('category') ?? 'הכל';
    const [selectedCategory, setSelectedCategory] = useState(
        categories.includes(initialCat) ? initialCat : 'הכל'
    );

    // Sync URL with category
    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setSearchParams(cat === 'הכל' ? {} : { category: cat });
        setIsFilterOpen(false);
    };

    const filtered = useMemo(() =>
        selectedCategory === 'הכל'
            ? products
            : products.filter(p => p.category === selectedCategory),
        [selectedCategory]
    );

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-32 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">

                    {/* ── Page Header ───────────────────────────────────────── */}
                    <div className="mb-10">
                        <motion.span
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] font-black uppercase tracking-[0.35em] text-[#007AFF]/70 block mb-4"
                        >
                            כל הפתרונות
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="text-5xl md:text-7xl font-apple-display text-[#1D1D1F] tracking-tight leading-[1.05] mb-4"
                        >
                            הכלים שמעצבים<br />
                            <span className="font-light text-gray-400">את המחר.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="text-xl text-gray-400 font-medium max-w-xl leading-relaxed"
                        >
                            פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.
                        </motion.p>
                    </div>

                    {/* ── Controls Bar ──────────────────────────────────────── */}
                    <div className="flex items-center gap-3 mb-8">

                        {/* Grid / List toggle — explicit glass styles (NOT glass-apple class which has overflow:hidden) */}
                        <div
                            className="flex items-center rounded-full p-1 shrink-0"
                            style={{
                                background: 'rgba(255,255,255,0.60)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.55)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
                            }}
                        >
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="תצוגת רשת"
                                style={{ position: 'relative', zIndex: 1 }}
                                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer ${
                                    viewMode === 'grid'
                                        ? 'bg-white shadow-sm text-[#007AFF]'
                                        : 'text-gray-400 hover:text-[#1D1D1F]'
                                }`}
                            >
                                <LayoutGrid size={16} strokeWidth={2} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="תצוגת רשימה"
                                style={{ position: 'relative', zIndex: 1 }}
                                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer ${
                                    viewMode === 'list'
                                        ? 'bg-white shadow-sm text-[#007AFF]'
                                        : 'text-gray-400 hover:text-[#1D1D1F]'
                                }`}
                            >
                                <List size={16} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Filter button — same explicit glass treatment */}
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm text-gray-600 hover:text-[#1D1D1F] transition-all duration-200 shrink-0 cursor-pointer"
                            style={{
                                background: 'rgba(255,255,255,0.60)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255,255,255,0.55)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
                            }}
                        >
                            <SlidersHorizontal size={15} strokeWidth={2} />
                            <span>סינון</span>
                        </button>

                        {/* Category Tabs — horizontal scroll strip, scrollbar fully hidden */}
                        <div
                            ref={tabsRef}
                            className="flex items-center gap-2 flex-1"
                            style={{
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '0px',
                            }}
                        >
                            {categories.map(cat => {
                                const active = selectedCategory === cat;
                                return (
                                    <motion.button
                                        key={cat}
                                        onClick={() => handleCategorySelect(cat)}
                                        whileTap={{ scale: 0.95 }}
                                        className={`shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
                                            active
                                                ? 'bg-[#1D1D1F] text-white shadow-sm'
                                                : 'bg-white/70 text-gray-500 hover:bg-white hover:text-[#1D1D1F] border border-white/60'
                                        }`}
                                    >
                                        {cat}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Results count */}
                        <span className="text-sm font-medium text-gray-400 shrink-0">
                            {filtered.length} מוצרים
                        </span>
                    </div>

                    {/* Hairline divider */}
                    <div className="hairline mb-10" />

                    {/* ── Product Grid / List ────────────────────────────────── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${selectedCategory}-${viewMode}`}
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

                    {filtered.length === 0 && (
                        <div className="text-center py-32">
                            <p className="text-3xl font-bold text-gray-300 mb-3">לא נמצאו מוצרים</p>
                            <p className="text-gray-400">נסה קטגוריה אחרת</p>
                        </div>
                    )}
                </div>

                {/* ── Filter Drawer ──────────────────────────────────────────── */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70]"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                                className="fixed top-0 right-0 bottom-0 w-full md:max-w-sm z-[80] flex flex-col md:rounded-l-[2rem] overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.94)',
                                    backdropFilter: 'blur(52px) saturate(1.9)',
                                    WebkitBackdropFilter: 'blur(52px) saturate(1.9)',
                                    borderLeft: '1px solid rgba(255,255,255,0.60)',
                                    boxShadow: '-20px 0 60px rgba(0,0,0,0.10)',
                                }}
                            >
                                {/* Drawer Header */}
                                <div className="flex items-center justify-between px-8 py-6 border-b border-black/[0.05]">
                                    <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
                                        קטגוריות
                                    </h2>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-9 h-9 rounded-full bg-black/[0.05] flex items-center justify-center hover:bg-black/[0.08] transition-colors"
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Category list */}
                                <nav className="flex-1 overflow-y-auto px-4 py-4">
                                    {categories.map(cat => {
                                        const active = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => handleCategorySelect(cat)}
                                                className={`w-full flex items-center justify-between text-right px-4 py-3.5 rounded-2xl font-medium text-base transition-all duration-150 mb-1 ${
                                                    active
                                                        ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold'
                                                        : 'text-[#1D1D1F] hover:bg-black/[0.04]'
                                                }`}
                                            >
                                                <span>{cat}</span>
                                                {active && <Check size={16} className="text-[#007AFF]" />}
                                            </button>
                                        );
                                    })}
                                </nav>

                                {/* Drawer Footer */}
                                <div className="px-6 py-6 border-t border-black/[0.05]">
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full py-4 bg-[#1D1D1F] text-white rounded-full font-bold text-base tracking-tight hover:bg-[#2d2d2f] transition-colors shadow-lg"
                                    >
                                        הצג {filtered.length} מוצרים
                                    </motion.button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

// ─── List View Card ────────────────────────────────────────────────────────
const ListCard = ({ product }) => {
    const { id, category, title, price, image, description } = product ?? {};
    return (
        <motion.a
            href={`/catalog/${id}`}
            whileHover={{ x: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-6 glass-apple rounded-[1.5rem] p-4 group"
        >
            <div className="w-24 h-24 shrink-0 rounded-[1rem] overflow-hidden bg-white/50">
                {image && (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}
            </div>
            <div className="flex-1 text-right min-w-0">
                {category && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#007AFF]">
                        {category}
                    </span>
                )}
                <h3 className="text-lg font-bold text-[#1D1D1F] mt-0.5 line-clamp-1">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{description}</p>
                )}
            </div>
            <div className="shrink-0 text-left">
                <span className="text-xl font-apple-display text-[#1D1D1F]">
                    ₪{(price ?? 0).toLocaleString()}
                </span>
            </div>
        </motion.a>
    );
};

export default CatalogPage;
