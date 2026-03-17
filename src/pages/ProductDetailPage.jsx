import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import StickyProductBar from '../components/StickyProductBar';
import { useCompare } from '../context/CompareContext';
import products from '../data/products';

// Premium Apple-style placeholder when image fails to load
const ImageFallback = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-4 rounded-3xl">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
    </div>
);

const ProductDetailPage = () => {
    const { id } = useParams();
    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const [imgError, setImgError] = useState(false);

    // Reset imgError when navigating to a different product
    useEffect(() => {
        setImgError(false);
        window.scrollTo(0, 0);
    }, [id]);

    // Find product or fallback to the first one for preview purposes
    const product = useMemo(() => {
        const found = products.find(p => p.id === id);
        return found || products[0];
    }, [id]);

    const isProductSelected = isSelected(product.id);
    const formattedPrice = `₪${product.price.toLocaleString()}`;

    return (
        <PageTransition>
            <StickyProductBar productName={product.title} price={formattedPrice} />

            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full overflow-x-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">

                    {/* Right Column (Visual - RTL Start - Sticky) */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 250, damping: 25 }}
                        className="w-full relative lg:sticky lg:top-32 self-start"
                    >
                        <motion.div
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                            className="w-full rounded-3xl shadow-xl overflow-hidden bg-[#F5F5F7]"
                        >
                            {imgError || !product.image ? (
                                <div className="w-full aspect-square md:aspect-[4/3]">
                                    <ImageFallback />
                                </div>
                            ) : (
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full aspect-square md:aspect-[4/3] object-cover rounded-3xl"
                                    onError={() => setImgError(true)}
                                    loading="lazy"
                                />
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Left Column (Info - RTL End) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 250, damping: 25, delay: 0.1 }}
                        className="flex flex-col"
                    >
                        {/* Breadcrumbs */}
                        <div className="text-sm font-medium text-gray-400 mb-8 flex items-center gap-2">
                            <Link to="/" className="hover:text-[#007AFF] active:scale-[0.97] transition-all">ראשי</Link>
                            <span>/</span>
                            <Link to="/catalog" className="hover:text-[#007AFF] active:scale-[0.97] transition-all">קטלוג</Link>
                            <span>/</span>
                            <span className="text-gray-600 line-clamp-1">{product.title}</span>
                        </div>

                        {/* Badge */}
                        <div className="text-[#007AFF] font-bold text-sm uppercase tracking-widest mb-4">
                            {product.category}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] leading-tight mb-4 tracking-tight">
                            {product.title}
                        </h1>

                        {/* Price */}
                        <div className="text-2xl md:text-3xl font-bold text-gray-500 mb-8 flex items-end gap-2">
                            {formattedPrice}
                            <span className="text-sm font-medium text-gray-400 mb-1">+ מע״מ</span>
                        </div>

                        {/* Description */}
                        <div className="text-base md:text-lg text-gray-600 leading-relaxed mb-12 whitespace-pre-line">
                            {product.description}
                        </div>

                        {/* Specs Section — Full Technical Breakdown */}
                        {product.specs && product.specs.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-8 border-b border-gray-100 pb-4 inline-block">
                                    מפרט טכני מלא
                                </h3>

                                {/* 3-Column Glassmorphism Tiles (Law of Proximity & Similarity) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {product.specs.map((spec, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white/60 backdrop-blur-xl p-5 md:p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-[0_15px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center"
                                        >
                                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{spec.label}</span>
                                            <span className="text-lg md:text-xl font-black text-[#1D1D1F] leading-tight block">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mt-auto">
                            {/* Primary CTA — Magnetic Shadow Physics */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full bg-[#007AFF] text-white py-5 rounded-full font-bold text-xl shadow-[0_8px_20px_rgba(0,122,255,0.2)] hover:shadow-[0_12px_30px_rgba(0,122,255,0.4)] transition-all duration-300 focus:outline-none"
                            >
                                הוסף להצעת רכש
                            </motion.button>

                            {/* Secondary Actions Row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        if (isProductSelected) {
                                            removeFromCompare(product.id);
                                        } else {
                                            addToCompare({
                                                id: product.id,
                                                title: product.title,
                                                price: formattedPrice,
                                                imageUrl: product.image,
                                                category: product.category,
                                                specs: product.specs
                                            });
                                        }
                                    }}
                                    className={`flex-1 w-full border-2 py-4 rounded-full font-bold text-base md:text-lg hover:shadow-sm transition-all duration-300 focus:outline-none flex justify-center items-center gap-3 ${isProductSelected
                                        ? 'bg-[#007AFF]/5 border-[#007AFF] text-[#007AFF]'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                    <span>{isProductSelected ? "נבחר להשוואה" : "השווה דגם"}</span>
                                </motion.button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ProductDetailPage;
