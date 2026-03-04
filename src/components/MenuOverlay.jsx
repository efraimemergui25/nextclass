import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const MenuOverlay = ({ isOpen, onClose }) => {
    // Parent container variant for stagger effect
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2, // Wait slightly before fading in text
            }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3 }
        }
    };

    // Individual link animation
    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    variants={containerVariants}
                    className="fixed inset-0 z-[60] bg-[#1D1D1F]/95 backdrop-blur-2xl flex flex-col items-center justify-center rtl:text-right"
                >
                    {/* Top Left Close Button - Massive hit area */}
                    <div className="absolute top-6 left-6 md:top-8 md:left-8 z-[70]">
                        <button
                            onClick={onClose}
                            className="text-white hover:text-[#007AFF] transition-colors focus:outline-none p-4 -m-4"
                            aria-label="סגור תפריט"
                        >
                            <svg className="w-10 h-10 md:w-12 md:h-12 font-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <nav className="flex flex-col items-center space-y-8 md:space-y-12">
                        {[
                            { name: "קטלוג פתרונות", path: "/catalog" },
                            { name: "השוואת דגמים", path: "/compare" },
                            { name: "מרכז הדרכות", path: "/vod" },
                            { name: "מגזין חדשנות", path: "/magazine" },
                            { name: "מרחבי חדשנות", path: "/innovation" },
                            { name: "הסיפור שלנו", path: "/story" },
                            { name: "צור קשר", path: "/contact" }
                        ].map((link, idx) => (
                            <motion.div key={idx} variants={itemVariants}>
                                <Link
                                    to={link.path}
                                    onClick={onClose}
                                    className="text-5xl md:text-7xl font-bold text-white hover:text-[#007AFF] transition-colors duration-300 block py-2"
                                >
                                    {link.name}
                                </Link>
                            </motion.div>
                        ))}
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
