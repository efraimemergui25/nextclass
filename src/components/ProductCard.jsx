import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

const ProductCard = ({ product }) => {
    const {
        id = "1",
        category = "מסכים ואינטראקטיב",
        title = "NextBoard Pro 86\"",
        price = 14900,
        image = "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800"
    } = product || {};

    const formattedPrice = `₪${price.toLocaleString()}`;

    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const selected = isSelected(id);

    const handleCompareClick = (e) => {
        e.preventDefault();
        if (selected) {
            removeFromCompare(id);
        } else {
            addToCompare({ id, title, price: formattedPrice, imageUrl: image, category });
        }
    };

    return (
        <motion.div
            className="relative group cursor-pointer bg-white rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
        >
            <Link to={`/catalog/${id}`} className="flex flex-col h-full outline-none focus:ring-2 focus:ring-[#007AFF]/30 rounded-3xl">

                {/* Image Container — STRICT aspect-[4/3] & object-cover (Law of Common Region) */}
                <div className="relative overflow-hidden rounded-t-3xl bg-[#F5F5F7]">
                    <img
                        src={image}
                        alt={title}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Subtle inner shadow for hardware depth */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-t-3xl pointer-events-none" />
                </div>

                {/* Typography (RTL Aligned) */}
                <div className="flex flex-col flex-grow text-right p-6 pt-5">
                    <span className="text-xs font-bold text-[#007AFF] tracking-widest uppercase mb-2">
                        {category}
                    </span>

                    {/* line-clamp-2 enforces consistent grid alignment (Law of Similarity) */}
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#1D1D1F] tracking-tight mb-3 leading-tight line-clamp-2">
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
                                className={`p-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-center active:scale-[0.9] ${selected
                                    ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF] shadow-sm'
                                    : 'bg-white/60 border-gray-200 text-gray-400 hover:border-[#007AFF] hover:text-[#007AFF]'
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
                                className="bg-[#007AFF]/5 text-[#007AFF] font-bold px-5 py-2.5 rounded-xl hover:bg-[#007AFF] hover:text-white active:scale-[0.97] transition-all duration-300 inline-block text-center text-sm"
                            >
                                למפרט המלא
                            </div>
                        </div>
                    </div>
                </div>

            </Link>
        </motion.div>
    );
};

export default ProductCard;
