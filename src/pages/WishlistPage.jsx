import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

const WishlistPage = () => {
    const { wishlist } = useWishlist();
    const { activeProducts } = useProducts();
    const { getSetting } = useSettings();

    const wishlistProducts = useMemo(
        () => activeProducts.filter(p => wishlist.includes(p.id)),
        [activeProducts, wishlist]
    );

    return (
        <PageTransition>
            <div className="min-h-screen pt-28 pb-32 px-6 md:px-12">
                <div className="max-w-[1400px] mx-auto">

                    {/* ── Header ── */}
                    <div className="text-right mb-14">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#FF2D55] font-bold text-[10px] uppercase tracking-[0.2em] mb-6 shadow-sm border border-white/50"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{getSetting('wishlist_badge', 'המוצרים שלי')}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="text-4xl md:text-7xl font-black text-[#1D1D1F] tracking-tighter leading-tight mb-3"
                        >
                            {getSetting('wishlist_title', 'המוצרים שאהבתי')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
                            className="text-[#86868B] text-lg font-medium"
                        >
                            {wishlistProducts.length} {getSetting('wishlist_count_label', 'פריטים שמורים')}
                        </motion.p>
                    </div>

                    {/* ── Empty State ── */}
                    {wishlistProducts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center justify-center py-32 gap-7 text-center"
                        >
                            <div className="w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-sm"
                                style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <svg className="w-14 h-14 text-[#AEAEB2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-black text-[#1D1D1F] mb-2">
                                    {getSetting('wishlist_empty_title', 'הרשימה שלך ריקה')}
                                </p>
                                <p className="text-[#86868B] font-medium max-w-xs mx-auto leading-relaxed">
                                    {getSetting('wishlist_empty_desc', 'לחץ על הלב על כרטיס המוצר כדי לשמור אותו כאן')}
                                </p>
                            </div>
                            <Link to="/catalog">
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    className="px-8 py-4 rounded-full bg-[#007AFF] text-white font-bold text-[15px] shadow-lg shadow-[#007AFF]/25"
                                >
                                    {getSetting('wishlist_browse_btn', 'עיין בקטלוג')}
                                </motion.button>
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence>
                                {wishlistProducts.map((product, i) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.04, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
};

export default WishlistPage;
