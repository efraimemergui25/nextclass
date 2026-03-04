import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();

    // Subtle fade in and blur for the bright overlay
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
        }
    };

    // Stagger container for links
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    };

    // Smooth subtle slide-up for links
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const navItems = [
        { name: "קטלוג פתרונות", path: "/catalog" },
        { name: "השוואת דגמים", path: "/compare" },
        { name: "מרכז הדרכות", path: "/vod" },
        { name: "מגזין חדשנות", path: "/magazine" },
        { name: "מרחבי חדשנות", path: "/innovation" },
        { name: "הסיפור שלנו", path: "/about" },
        { name: "צור קשר", path: "/contact" }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 z-[100] bg-white/75 backdrop-blur-3xl h-screen w-full overflow-hidden flex flex-col font-sans antialiased"
                >
                    {/* Header Integration (Top Bar) */}
                    <div className="absolute top-0 left-0 w-full px-6 md:px-12 py-6 flex justify-between items-center z-10">
                        {/* Right (RTL Start) - Logo */}
                        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 group">
                            <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none">
                                <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" className="transition-all duration-300" />
                                <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                            </svg>
                            <div className="text-2xl tracking-tighter text-[#1D1D1F]">
                                <span className="font-extrabold">next</span><span className="font-light text-[#007AFF]">class</span>
                            </div>
                        </Link>

                        {/* Left (RTL End) - Close Icon */}
                        <button
                            onClick={onClose}
                            className="text-gray-800 hover:text-black hover:rotate-90 transition-all duration-300 focus:outline-none p-2 -m-2"
                            aria-label="סגור תפריט"
                        >
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* The Links (Centered Vertically and Horizontally) */}
                    <motion.nav
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col items-center justify-center h-full gap-6 md:gap-10 pt-20 pb-10 px-6"
                    >
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <motion.div key={index} variants={itemVariants} className="relative flex items-center justify-center">
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className={`text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight transition-all duration-300 hover:scale-105 ${isActive ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
