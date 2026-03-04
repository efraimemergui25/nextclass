import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ProductCard = ({
    id = "1",
    category = "מסכים ואינטראקטיב",
    title = "NextBoard Pro 86\"",
    price = "₪14,900",
    imageUrl = "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800"
}) => {
    return (
        <motion.div
            // Gestalt Law of Common Region: No borders, purely shadow and space
            className="bg-white rounded-[2rem] p-6 flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 ease-out cursor-pointer relative group"
            whileHover={{ y: -6 }}
        >
            <Link to={`/catalog/${id}`} className="flex flex-col h-full outline-none focus:ring-2 focus:ring-brand-blue/50 rounded-xl">

                {/* Edge-to-edge container inside padding */}
                <div className="aspect-video w-full bg-brand-light rounded-2xl mb-6 overflow-hidden relative">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Subtle inner shadow for hardware depth */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl pointer-events-none" />
                </div>

                {/* Typography (RTL Aligned) */}
                <div className="flex flex-col flex-grow text-right">
                    <span className="text-xs font-bold text-brand-blue tracking-[0.15em] uppercase mb-3">
                        {category}
                    </span>

                    <h3 className="text-xl md:text-2xl font-bold text-brand-dark mb-3 leading-tight">
                        {title}
                    </h3>

                    {/* Spacer pushes price to bottom */}
                    <div className="mt-auto pt-6 flex items-end justify-between">
                        <span className="text-2xl md:text-3xl font-black text-brand-dark tracking-tight">
                            {price}
                        </span>

                        {/* Action - Bottom Right (Left in RTL) */}
                        <div
                            className="bg-brand-blue/5 text-brand-blue font-bold px-5 py-2.5 rounded-xl hover:bg-brand-blue/10 transition-colors inline-block text-center text-sm md:text-base group-hover:bg-brand-blue group-hover:text-white"
                        >
                            למפרט המלא
                        </div>
                    </div>
                </div>

            </Link>
        </motion.div>
    );
};

export default ProductCard;
