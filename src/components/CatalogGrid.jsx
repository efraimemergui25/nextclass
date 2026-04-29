import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Filter, Sparkles } from 'lucide-react';
import ProductCard from './ProductCard';
import products from '../data/products';

const CatalogGrid = () => {
    const [selectedCategory, setSelectedCategory] = useState("הכל");

    const categories = useMemo(() => ["הכל", ...new Set(products.map(p => p.category))], []);

    const filteredProducts = useMemo(() => 
        selectedCategory === "הכל"
            ? products
            : products.filter(p => p.category === selectedCategory),
    [selectedCategory]);

    return (
        <section className="w-full max-w-[1440px] mx-auto px-6 md:px-16 py-16 bg-[#F5F5F7] min-h-screen">
            
            {/* ── Header Spotlight ── */}
            <div className="mb-14 text-center relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.2em] mb-6"
                >
                    <Sparkles size={10} className="animate-glow-pulse" />
                    <span>הקטלוג המוסדי המלא</span>
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-apple-display tracking-tighter leading-[1.0] text-[#1D1D1F] mb-4">
                    הכלים שמעצבים את המחר.
                </h2>
                <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                    פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.
                </p>
            </div>

            {/* ── Apple-Tier Filter Bar ── */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-2 glass-apple px-4 py-2 rounded-full border border-gray-200/50 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                    {categories.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`
                                    px-5 py-1.5 rounded-full font-bold text-[13px] transition-all duration-500 whitespace-nowrap
                                    ${isActive
                                        ? "bg-black text-white shadow-lg scale-105"
                                        : "text-gray-500 hover:text-[#1D1D1F] hover:bg-gray-100/50"}
                                `}
                            >
                                {category}
                            </button>
                        )
                    })}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                        <Filter size={10} />
                        <span>סינון</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#007AFF] uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 cursor-pointer">
                        <LayoutGrid size={10} />
                        <span>גריד</span>
                    </div>
                </div>
            </div>

            {/* ── Grid System ── */}
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredProducts.map((product, idx) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8, delay: idx * 0.04 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* ── Empty State ── */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Filter size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-apple-display text-[#1D1D1F] mb-2">לא מצאנו את מה שחיפשתם</h3>
                    <p className="text-lg text-gray-400 font-medium mb-8">נסו לשנות את הקטגוריה או לחפש מוצר ספציפי.</p>
                    <button 
                        onClick={() => setSelectedCategory("הכל")}
                        className="px-8 py-3 bg-[#007AFF] text-white rounded-full font-bold shadow-lg hover:shadow-blue-500/30 transition-all"
                    >
                        חזרה לכל המוצרים
                    </button>
                </div>
            )}
        </section>
    );
};

export default CatalogGrid;
