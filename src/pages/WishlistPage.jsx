import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const WishlistPage = () => {
    const { wishlistItems, clearWishlist, wishlistCount } = useWishlist();

    return (
        <PageTransition>
            <div className="min-h-screen pb-24 pt-12">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className="text-right">
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 mb-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                                    <Heart fill="currentColor" size={24} />
                                </div>
                                <h1 className="text-4xl font-apple-display text-[#1D1D1F] tracking-tighter">המועדפים שלי</h1>
                            </motion.div>
                            <p className="text-[#86868B] text-lg font-medium">כאן שמורים כל המוצרים שאהבת. תוכל להשוות ביניהם או להוסיף לסל בכל עת.</p>
                        </div>

                        {wishlistCount > 0 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={clearWishlist}
                                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                            >
                                <Trash2 size={16} />
                                <span>נקה את כל הרשימה</span>
                            </motion.button>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {wishlistCount === 0 ? (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mb-8 border border-gray-100">
                                    <Heart size={40} className="text-gray-200" />
                                </div>
                                <h2 className="text-2xl font-black text-[#1D1D1F] mb-4">רשימת המועדפים שלך ריקה</h2>
                                <p className="text-[#86868B] max-w-sm mb-10 leading-relaxed font-medium">
                                    עדיין לא שמרת מוצרים. זה המקום לשמור דגמים שמעניינים אותך כדי לחזור אליהם מאוחר יותר.
                                </p>
                                <Link 
                                    to="/catalog"
                                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#007AFF] text-white font-bold transition-all hover:scale-105 shadow-xl hover:shadow-blue-500/25"
                                >
                                    <ShoppingBag size={20} />
                                    <span>עבור לקטלוג המוצרים</span>
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                {wishlistItems.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Back Link */}
                    <div className="mt-24 pt-12 border-t border-gray-100 flex justify-center">
                        <Link to="/catalog" className="group flex items-center gap-3 text-[#007AFF] font-bold hover:gap-4 transition-all">
                            <span>המשך בקניות בקטלוג</span>
                            <ArrowLeft size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default WishlistPage;
