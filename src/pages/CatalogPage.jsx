import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import products from '../data/products';

const categories = ['הכל', ...new Set(products.map(p => p.category))];

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
};

const CatalogPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Support category pre-selection from ?category= query param (used by mega-menu)
    const initialCat = searchParams.get('category') ?? 'הכל';
    const [selectedCategory, setSelectedCategory] = useState(
        categories.includes(initialCat) ? initialCat : 'הכל'
    );

    useEffect(() => { }, []);

    // Keep URL in sync
    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        if (cat === 'הכל') {
            setSearchParams({});
        } else {
            setSearchParams({ category: cat });
        }
    };

    const filtered = useMemo(() =>
        selectedCategory === 'הכל'
            ? products
            : products.filter(p => p.category === selectedCategory),
        [selectedCategory]
    );

    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] min-h-screen pt-28 md:pt-36 pb-24 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#007AFF] block mb-2">כל הפתרונות</span>
                            <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tighter leading-tight">
                                פתרונות למוסדות
                            </h1>
                            <p className="text-lg text-gray-500 mt-2 font-medium">ציוד קצה שנבחר בקפידה למרחבי למידה מתקדמים.</p>
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2.5 px-6 py-3 rounded-full font-bold text-sm text-[#1D1D1F] bg-white/70 backdrop-blur-xl border border-white/70 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            סינון ומיון
                        </button>
                    </div>

                    {/* ── Category Tabs ── */}
                    <div className="flex flex-wrap gap-2.5 mb-12">
                        {categories.map(cat => {
                            const active = selectedCategory === cat;
                            return (
                                <motion.button
                                    key={cat}
                                    onClick={() => handleCategorySelect(cat)}
                                    whileTap={{ scale: 0.96 }}
                                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border backdrop-blur-md ${active
                                        ? 'bg-[#007AFF] text-white border-transparent shadow-md shadow-[#007AFF]/20 scale-105'
                                        : 'bg-white/60 text-gray-500 border-white/60 hover:bg-white hover:text-[#1D1D1F]'
                                        }`}
                                >
                                    {cat}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* ── Product Grid using unified ProductCard ── */}
                    <motion.div
                        key={selectedCategory}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12"
                    >
                        <AnimatePresence mode="popLayout">
                            {filtered.map(product => (
                                <motion.div
                                    key={product.id}
                                    variants={itemVariants}
                                    layout
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {filtered.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-2xl font-bold text-gray-400">לא נמצאו מוצרים בקטגוריה זו.</p>
                        </div>
                    )}
                </div>

                {/* ── Filter Side-Drawer ── */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[70]"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="fixed top-0 right-0 bottom-0 w-full md:max-w-md z-[80] shadow-2xl flex flex-col md:rounded-l-3xl overflow-hidden"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.92) 100%)',
                                    backdropFilter: 'blur(48px) saturate(1.8)',
                                    WebkitBackdropFilter: 'blur(48px) saturate(1.8)',
                                    border: '1px solid rgba(255,255,255,0.70)',
                                }}
                            >
                                <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-100">
                                    <h2 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">סינון לפי קטגוריה</h2>
                                    <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-[#F5F5F7] transition-colors">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <nav className="p-6 md:p-8 flex-1 overflow-y-auto flex flex-col gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { handleCategorySelect(cat); setIsFilterOpen(false); }}
                                            className={`text-right px-5 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${selectedCategory === cat
                                                ? 'bg-[#007AFF]/10 text-[#007AFF]'
                                                : 'text-[#1D1D1F] hover:bg-gray-50'
                                                }`}
                                        >
                                            {cat}
                                            {selectedCategory === cat && <span className="float-left text-[#007AFF]">✓</span>}
                                        </button>
                                    ))}
                                </nav>

                                <div className="p-6 md:p-8 border-t border-gray-100">
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="w-full py-4 bg-[#007AFF] text-white rounded-full font-black text-lg tracking-tight hover:bg-blue-600 transition-all shadow-lg active:scale-98"
                                    >
                                        הצג {filtered.length} מוצרים
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

export default CatalogPage;
