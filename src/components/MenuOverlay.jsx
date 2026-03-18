import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();

    // Staggered Motion Physics (Apple Fluidity)
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1]
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1],
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 200
            }
        },
        exit: {
            opacity: 0,
            y: 20,
            transition: { duration: 0.2 }
        }
    };

    const navItems = [
        { name: "קטלוג פתרונות", path: "/catalog" },
        { name: "השוואת דגמים", path: "/compare" },
        { name: "מרכז הדרכות", path: "/vod" },
        { name: "מגזין חדשנות", path: "/magazine" },
        { name: "מרחבי חדשנות", path: "/innovation" },
        { name: "הסיפור שלנו", path: "/story" },
        { name: "צור קשר", path: "/contact" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    variants={containerVariants}
                    className="fixed inset-0 z-[200] w-full h-full bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.5] flex flex-col items-center justify-center pointer-events-auto"
                >
                    {/* Sleek Close Button (Top-Left for RTL context priority) */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 left-8 p-4 hover:bg-black/5 rounded-full transition-colors cursor-pointer group"
                        aria-label="סגור תפריט"
                    >
                        <X className="w-8 h-8 text-[#1D1D1F] group-hover:rotate-90 transition-transform duration-500" />
                    </button>

                    {/* Navigation Stack (Gestalt Proximity) */}
                    <nav className="flex flex-col items-center justify-center gap-6 md:gap-10">
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <motion.div key={index} variants={itemVariants}>
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className={`text-4xl md:text-6xl font-bold tracking-tighter transition-all duration-400 ease-out inline-block transform-gpu ${isActive
                                                ? 'text-[#007AFF]'
                                                : 'text-[#1D1D1F] hover:text-[#007AFF] hover:-translate-x-4'
                                            }`}
                                        style={{ fontFamily: "'Heebo', sans-serif" }}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* Branding / Footer info (Optional but adds polish) */}
                    <motion.div
                        variants={itemVariants}
                        className="absolute bottom-12 flex flex-col items-center gap-2 opacity-20"
                    >
                        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                            <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                            <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                        </svg>
                        <span className="text-xs font-black tracking-widest uppercase">NextClass visionOS</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
