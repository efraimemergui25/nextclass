import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { ShoppingCart, Check } from 'lucide-react';

const SmartSearchModal = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const { cartItems, addToCart } = useCart();
    const { activeProducts: products } = useProducts();

    const searchContent = useMemo(() => ({
        placeholder: getSetting('search_placeholder', 'חפש מוצר, קטגוריה או פתרון...'),
        popularLabel: getSetting('search_popular_label', 'חיפושים נפוצים'),
        popularTerms: getSetting('search_popular_terms', 'מסכי מגע, לפטופ, עגלות טעינה').split(',').map(t => t.trim()),
        noResults: getSetting('search_no_results', 'לא נמצאו תוצאות עבור "{term}"')
    }), [getSetting]);

    // Spotlight-style Auto Focus
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm('');
        }
    }, [isOpen]);

    // Live Filtering Logic (Source of Truth: ProductsContext)
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const lowerTerm = searchTerm.toLowerCase();
        return products.filter(p =>
            p.title.toLowerCase().includes(lowerTerm) ||
            p.category.toLowerCase().includes(lowerTerm)
        );
    }, [searchTerm, products]);

    const handleResultClick = (id) => {
        navigate(`/catalog/${id}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] bg-[#1D1D1F]/40 backdrop-blur-sm flex justify-center items-start pt-[15vh] px-4 pointer-events-auto"
                    onClick={onClose}
                >
                    {/* Search Container (Gestalt & Apple Aesthetic) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="w-full max-w-2xl bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 shadow-[0_20px_50px_rgb(0_0_0/0.15)] rounded-2xl overflow-hidden flex flex-col transform-gpu will-change-transform"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input Field */}
                        <div className="relative flex items-center border-b border-gray-100/50">
                            <Search className="absolute right-6 w-7 h-7 text-gray-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchContent.placeholder}
                                className="w-full bg-transparent text-2xl text-[#1D1D1F] placeholder-gray-500 p-6 pr-16 outline-none font-medium text-right"
                                dir="rtl"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute left-6 p-2 text-gray-400 hover:text-[#1D1D1F] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Search Results UI (Law of Similarity) */}
                        <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                            {searchTerm.trim() === '' ? (
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-[#86868B] mb-5 justify-end">
                                        <span className="text-xs font-bold uppercase tracking-widest">{searchContent.popularLabel}</span>
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-wrap gap-2.5 justify-end">
                                        {searchContent.popularTerms.map(term => (
                                            <button
                                                key={term}
                                                onClick={() => setSearchTerm(term)}
                                                className="px-5 py-2 rounded-full bg-black/5 hover:bg-black/10 text-[#1D1D1F] font-semibold text-sm transition-apple-fluid"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : filteredProducts.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                    {filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleResultClick(product.id)}
                                            className="group flex items-center gap-4 p-3 hover:bg-white/80 rounded-xl transition-all cursor-pointer text-right"
                                            dir="rtl"
                                        >
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0 border border-black/5 group-hover:scale-105 transition-transform"
                                                onError={(e) => {
                                                    if (!e.target.dataset.triedFallback) {
                                                        e.target.dataset.triedFallback = 'true';
                                                        e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                                                    } else {
                                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";
                                                    }
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[#1D1D1F] text-lg line-clamp-1">
                                                    {product.title}
                                                </h4>
                                                <p className="text-xs font-bold text-[#86868B] uppercase tracking-widest">
                                                    {product.category}
                                                </p>
                                            </div>
                                            <div className="mr-auto pl-2 flex items-center gap-4">
                                                <span className="text-lg font-black tracking-tight text-[#007AFF]">
                                                    ₪{product.price.toLocaleString()}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart(product);
                                                    }}
                                                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                        cartItems.some(item => item.id === product.id)
                                                            ? 'bg-green-50 text-green-600'
                                                            : 'bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF] hover:text-white'
                                                    }`}
                                                >
                                                    {cartItems.some(item => item.id === product.id) ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} strokeWidth={2.5} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-[#86868B] text-lg font-medium">{searchContent.noResults.replace('{term}', searchTerm)}</p>
                                </div>
                            )}
                        </div>

                        {/* Micro-Interaction Footer */}
                        <div className="px-6 py-3 bg-black/5 border-t border-gray-100/50 flex justify-between items-center">
                            <div className="flex items-center gap-4 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
                                <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded bg-white shadow-sm">ESC</span> לסגירה</span>
                                <span className="flex items-center gap-1"><span className="px-1 py-0.5 rounded bg-white shadow-sm">⏎</span> לבחירה</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">spotlight search</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SmartSearchModal;
