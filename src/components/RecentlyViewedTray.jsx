import React, { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import products from '../data/products';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 28 } },
};

const glassCard = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 100%)',
    backdropFilter: 'blur(32px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.95) inset',
};

const RecentlyViewedTray = ({ recentIds = [], currentId }) => {
    // Resolve IDs → full product objects, exclude current product
    const recentProducts = useMemo(
        () =>
            (recentIds ?? [])
                .filter(id => id !== currentId)
                .map(id => products.find(p => p.id === id))
                .filter(Boolean),
        [recentIds, currentId]
    );

    if (recentProducts.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-6 md:px-12 mt-24 mb-8">
            <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#007AFF] block mb-1">ההיסטוריה שלך</span>
                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tighter">מוצרים שראית לאחרונה</h2>
            </div>

            {/* Horizontal scroll on mobile, grid on md+ */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="flex gap-4 overflow-x-auto pb-2 md:overflow-visible md:grid md:grid-cols-4 scrollbar-hide"
            >
                {recentProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        variants={cardVariants}
                        className="shrink-0 w-56 md:w-full"
                    >
                        <motion.div whileHover={{ y: -5, scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }}>
                            <Link
                                to={`/catalog/${product.id}`}
                                className="group block w-full p-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#007AFF]/30 relative overflow-hidden"
                                style={glassCard}
                            >
                                {/* Top inset shine */}
                                <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
                                {/* Thumbnail */}
                                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F5F5F7] mb-3">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                if (!e.target.dataset.triedFallback) {
                                                    e.target.dataset.triedFallback = 'true';
                                                    e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=400&auto=format&fit=crop';
                                                } else {
                                                    e.target.style.display = 'none';
                                                }
                                            }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
                                        </div>
                                    )}
                                </div>

                                {/* Text */}
                                <div className="text-right">
                                    {product.category && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#007AFF] mb-1 block">
                                            {product.category}
                                        </span>
                                    )}
                                    <p className="text-sm font-bold text-[#1D1D1F] line-clamp-1 leading-snug">
                                        {product.title}
                                    </p>
                                    <p className="text-sm font-black text-[#1D1D1F] tracking-tighter mt-1">
                                        ₪{(product.price ?? 0).toLocaleString()}
                                    </p>
                                </div>
                            </Link>
                        </motion.div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
};

export default memo(RecentlyViewedTray);
