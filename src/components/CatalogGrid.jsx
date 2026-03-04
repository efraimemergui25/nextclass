import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import products from '../data/products';

const CatalogGrid = () => {
    // 1. State Management
    const [selectedCategory, setSelectedCategory] = useState("הכל");

    // 2. Categories Array (Unique categories + "הכל")
    const categories = ["הכל", ...new Set(products.map(p => p.category))];

    // 4. Filtering Logic
    const filteredProducts = selectedCategory === "הכל"
        ? products
        : products.filter(p => p.category === selectedCategory);

    return (
        <section className="w-full max-w-[1400px] mx-auto px-6 md:px-12 py-24 bg-[#F5F5F7]">
            <div className="mb-10 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-[#1D1D1F] mb-4 tracking-tight">
                    הכלים שמעצבים את המחר
                </h2>
                <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.
                </p>
            </div>

            {/* 3. The Filter Bar (UI) */}
            <div className="flex justify-center flex-wrap gap-3 md:gap-4 mb-16">
                {categories.map((category) => {
                    const isActive = selectedCategory === category;
                    return (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                                px-6 py-2 rounded-full font-bold text-sm md:text-base transition-all duration-300 border backdrop-blur-md active:scale-[0.97]
                                ${isActive
                                    ? "bg-[#007AFF] text-white shadow-lg border-transparent scale-105"
                                    : "bg-white/50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-[#1D1D1F]"}
                            `}
                        >
                            {category}
                        </button>
                    )
                })}
            </div>

            {/* Grid System: Gestalt Proximity & Generous Whitespace */}
            {/* Animation: Apple Spring Physics for layout reflows */}
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 250, damping: 25 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            >
                <AnimatePresence mode='popLayout'>
                    {filteredProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Empty State Fallback (Just in case) */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-2xl font-bold text-gray-400">לא נמצאו מוצרים בקטגוריה זו.</p>
                </div>
            )}
        </section>
    );
};

export default CatalogGrid;
