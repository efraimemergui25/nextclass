import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import products from '../data/products';
import ProductCard from './ProductCard';

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
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
        <section className="max-w-[1400px] mx-auto px-6 md:px-12 mt-24 mb-16">
            <div className="mb-10 text-right">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#007AFF] block mb-2">ההיסטוריה שלך</span>
                <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">מוצרים שראית לאחרונה</h2>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
                {recentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </motion.div>
        </section>
    );
};

export default memo(RecentlyViewedTray);
