import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] }
        }
    };

    // Routes mapped to ACTUAL existing routes in App.jsx
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
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[150] glass-light h-screen w-full overflow-hidden flex flex-col transition-apple-fluid"
                >
                    {/* ─── Top Bar ─── */}
                    <div className="w-full px-6 md:px-12 py-5 flex justify-between items-center shrink-0 border-b border-black/5">
                        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 active:scale-[0.97] transition-transform">
                            <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" fill="none">
                                <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                                <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                            </svg>
                            <div className="text-xl tracking-tighter text-[#1D1D1F]">
                                <span className="font-black">next</span><span className="font-light text-[#007AFF]">class</span>
                            </div>
                        </Link>

                        <motion.button
                            onClick={onClose}
                            whileHover={{ rotate: 90, scale: 1.1 }}
                            whileTap={{ scale: 0.85 }}
                            className="w-11 h-11 rounded-full bg-black/5 flex items-center justify-center text-gray-500 hover:text-[#1D1D1F] hover:bg-black/10 transition-apple-fluid"
                            aria-label="סגור תפריט"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* ─── Navigation Links ─── */}
                    <motion.nav
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 flex flex-col items-start justify-center px-10 md:px-20 lg:px-32 gap-1"
                    >
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="w-full"
                                >
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className={`block w-full py-3 md:py-4 text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight transition-all duration-300 active:scale-[0.98] transform-gpu ${isActive
                                            ? 'text-[#007AFF]'
                                            : 'text-[#1D1D1F] hover:text-[#007AFF] hover:-translate-x-3'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                    {/* Subtle separator line */}
                                    {index < navItems.length - 1 && (
                                        <div className="h-px bg-black/5 w-full" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.nav>

                    {/* ─── Bottom CTA Bar ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="w-full px-10 md:px-20 lg:px-32 pb-10 pt-4 shrink-0"
                    >
                        <Link to="/catalog" onClick={onClose} className="block">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full md:w-auto md:inline-flex backdrop-blur-xl bg-[#007AFF] text-white px-10 py-4 rounded-2xl font-bold text-base text-center shadow-[0_8px_24px_rgba(0,122,255,0.25)] hover:shadow-[0_12px_32px_rgba(0,122,255,0.4)] transition-all duration-300"
                            >
                                גלה את כל הפתרונות
                            </motion.div>
                        </Link>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
