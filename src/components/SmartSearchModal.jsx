import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import products from '../data/products';

const TRENDING_SEARCHES = ["מסכי מגע", "כרומבוק", "טאבלט", "מעבדות STEM"];

const SmartSearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            // Auto-focus input on mount
            setTimeout(() => inputRef.current?.focus(), 100);

            // Lock background scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setQuery('');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (query.trim().length > 0) {
            const filtered = products.filter(p =>
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.category.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 8); // Limit to top 8 results
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [query]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleResultClick = (id) => {
        navigate(`/catalog/${id}`);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 md:p-0">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#1D1D1F]/40 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="relative w-full max-w-2xl mt-24 bg-white/80 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 shadow-2xl rounded-3xl overflow-hidden flex flex-col transform-gpu will-change-transform"
                    >
                        {/* Search Input Area */}
                        <div className="relative flex items-center border-b border-gray-100">
                            <Search className="absolute right-6 w-6 h-6 text-[#86868B]" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="חפש מוצר, קטגוריה או פתרון..."
                                className="w-full text-xl md:text-2xl text-[#1D1D1F] placeholder-gray-400 bg-transparent pr-16 pl-6 py-6 outline-none font-medium text-right"
                                dir="rtl"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute left-6 p-2 text-gray-400 hover:text-[#1D1D1F] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Scrollable Content */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {query.trim().length === 0 ? (
                                <div className="p-8">
                                    <div className="flex items-center gap-2 text-[#86868B] mb-6 justify-end">
                                        <span className="text-sm font-bold uppercase tracking-widest">חיפושים נפוצים</span>
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-end">
                                        {TRENDING_SEARCHES.map(term => (
                                            <button
                                                key={term}
                                                onClick={() => setQuery(term)}
                                                className="px-5 py-2.5 rounded-full bg-black/5 hover:bg-black/10 text-[#1D1D1F] font-semibold text-sm transition-apple-fluid"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="p-4 flex flex-col gap-1">
                                    {results.map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleResultClick(product.id)}
                                            className="group flex items-center gap-4 p-4 hover:bg-black/5 rounded-2xl transition-apple-fluid cursor-pointer text-right"
                                            dir="rtl"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-[#F5F5F7] overflow-hidden shrink-0 border border-black/5">
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[#1D1D1F] text-base md:text-lg truncate">
                                                    {product.title}
                                                </h4>
                                                <p className="text-xs font-bold text-[#007AFF] uppercase tracking-widest mt-0.5">
                                                    {product.category}
                                                </p>
                                            </div>
                                            <div className="text-left">
                                                <span className="text-sm font-black tracking-tighter text-[#1D1D1F]">
                                                    ₪{product.price.toLocaleString()}
                                                </span>
                                                <ChevronLeft className="w-4 h-4 text-gray-300 mr-2 inline group-hover:text-[#007AFF] group-hover:translate-x-[-4px] transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-[#86868B] text-lg font-medium">לא נמצאו תוצאות עבור "{query}"</p>
                                    <p className="text-sm text-gray-400 mt-2">נסה לחפש מונח כללי יותר כמו "מסך" או "מחשב"</p>
                                </div>
                            )}
                        </div>

                        {/* Footer / Shortcuts */}
                        <div className="p-4 bg-black/5 border-t border-gray-100 flex items-center justify-between px-6">
                            <div className="flex items-center gap-4 text-[10px] font-bold text-[#86868B] uppercase tracking-widest">
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-xs">ESC</span>
                                    <span>לסגירה</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 shadow-xs">ENTER</span>
                                    <span>לבחירה</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">nextclass smart search</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SmartSearchModal;
