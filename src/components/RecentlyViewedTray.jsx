import React, { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import products from '../data/products';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
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
            {/* Section Title */}
            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6 tracking-tight">
                מוצרים שראית לאחרונה
            </h2>

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
                        <Link
                            to={`/catalog/${product.id}`}
                            className="group block w-full p-4 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 hover:bg-white/70 hover:shadow-[0_8px_24px_rgb(0_0_0/0.08)] transition-all duration-300 hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                        >
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
                ))}
            </motion.div>
        </section>
    );
};

export default memo(RecentlyViewedTray);
