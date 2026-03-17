import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

// Premium Apple-style placeholder when image fails to load
const ImageFallback = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
    </div>
);

const ProductCard = ({ product }) => {
    const {
        id = "1",
        category = "מסכים ואינטראקטיב",
        title = "NextBoard Pro 86\"",
        price = 14900,
        image = ""
    } = product || {};

    const [imgError, setImgError] = useState(false);
    const formattedPrice = `₪${price.toLocaleString()}`;

    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const selected = isSelected(id);

    const handleCompareClick = (e) => {
        e.preventDefault();
        if (selected) {
            removeFromCompare(id);
        } else {
            addToCompare({ id, title, price: formattedPrice, imageUrl: image, category, specs: product?.specs });
        }
    };

    return (
        <motion.div
            className="relative group cursor-pointer bg-white rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-apple-fluid"
        >
            <Link to={`/catalog/${id}`} className="flex flex-col h-full outline-none focus:ring-2 focus:ring-[#007AFF]/30 rounded-3xl">

                {/* Image Container — STRICT aspect-[4/3] & object-cover (Law of Common Region) */}
                <div className="relative overflow-hidden rounded-t-3xl bg-[#F5F5F7]">
                    {imgError || !image ? (
                        <div className="w-full aspect-[4/3]">
                            <ImageFallback />
                        </div>
                    ) : (
                        <img
                            src={image}
                            alt={title}
                            className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-apple-fluid"
                            onError={() => setImgError(true)}
                            loading="lazy"
                        />
                    )}
                    {/* Subtle inner shadow for hardware depth */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-t-3xl pointer-events-none" />
                </div>

                {/* Typography (RTL Aligned) */}
                <div className="flex flex-col flex-grow text-right p-6 pt-5">
                    <span className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
                        {category}
                    </span>

                    {/* line-clamp-2 enforces consistent grid alignment (Law of Similarity) */}
                    <h3 className="text-xl md:text-2xl font-black text-[#1D1D1F] tracking-tighter mb-3 leading-[1.1] line-clamp-2">
                        {title}
                    </h3>

                    <div className="mt-auto pt-5 flex flex-col sm:flex-row items-end sm:items-center justify-between border-t border-gray-100 gap-4">
                        <span className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">
                            {formattedPrice}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {/* Compare Button — Glassmorphism Mini */}
                            <button
                                onClick={handleCompareClick}
                                className={`p-2.5 rounded-full border backdrop-blur-md transition-all duration-300 flex items-center justify-center active:scale-[0.95] ${selected
                                    ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF] shadow-sm'
                                    : 'glass-light border-gray-200 text-gray-400 hover:bg-gray-100/50 hover:border-gray-300 hover:text-[#1D1D1F]'
                                    }`}
                                aria-label={selected ? "נבחר להשוואה" : "השווה דגם"}
                                title={selected ? "נבחר להשוואה" : "השווה דגם"}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </button>
                            {/* CTA Pill */}
                            <div
                                className="bg-[#007AFF] text-white font-bold tracking-wide px-6 py-2.5 rounded-full hover:scale-[1.05] active:scale-[0.95] shadow-lg shadow-blue-500/20 transition-apple-fluid inline-block text-center text-sm min-h-[44px] flex items-center justify-center"
                            >
                                הוסף לעגלה
                            </div>
                        </div>
                    </div>
                </div>

            </Link>
        </motion.div>
    );
};

export default ProductCard;
