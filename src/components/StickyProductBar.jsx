import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StickyProductBar = ({ productName = "TouchBoard Pro 75\"", price = "₪9,500" }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show bar after scrolling past ~500px (past the product image hero)
            setIsVisible(window.scrollY > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                    className="fixed top-0 left-0 w-full glass-light z-40 py-3 px-6 md:px-12"
                >
                    <div className="max-w-[1400px] mx-auto flex justify-between items-center">
                        {/* Right Side (RTL Start) - Product Info */}
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-brand-dark text-sm md:text-base truncate max-w-[200px] md:max-w-none tracking-tight">
                                {productName}
                            </span>
                            <span className="font-black text-brand-blue text-sm md:text-base tracking-tighter">
                                {price}
                            </span>
                        </div>

                        {/* Left Side (RTL End) - CTA */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-brand-blue text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap"
                        >
                            הוסף להצעת מחיר
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyProductBar;
