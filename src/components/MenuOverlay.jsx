import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// Removed readNavContent helper

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { getSetting } = useSettings();

    const navItems = useMemo(() => {
        const items = [];
        for (let i = 1; i <= 6; i++) {
            const label = getSetting(`menu_item${i}_label`, '');
            const path = getSetting(`menu_item${i}_path`, '');
            if (label && path) items.push({ name: label, path: path });
        }
        if (items.length === 0) {
            return [
                { name: "קטלוג פתרונות", path: "/catalog" },
                { name: "השוואת דגמים", path: "/compare" },
                { name: "מרכז הדרכות", path: "/vod" },
                { name: "מגזין חדשנות", path: "/magazine" },
                { name: "הסיפור שלנו", path: "/story" },
                { name: "צור קשר", path: "/contact" },
            ];
        }
        return items;
    }, [getSetting]);

    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');

    // Staggered Motion Physics (Apple Fluidity)
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                duration: 0.35,
                ease: [0.32, 0.72, 0, 1]
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.3,
                ease: [0.32, 0.72, 0, 1],
                staggerChildren: 0.04,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 36 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 350,
                damping: 25
            }
        },
        exit: {
            opacity: 0,
            y: 16,
            transition: { duration: 0.18, ease: [0.32, 0.72, 0, 1] }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    variants={containerVariants}
                    className="fixed inset-0 z-[250] flex flex-col w-full h-full bg-white/40 dark:bg-[#1D1D1F]/40 backdrop-blur-3xl backdrop-saturate-[1.8] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] pointer-events-auto"
                >
                    {/* Top Area (Close Button) */}
                    <div className="w-full p-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="p-4 hover:bg-black/5 rounded-full transition-colors cursor-pointer group"
                            aria-label="סגור תפריט"
                        >
                            <X className="w-8 h-8 text-[#1D1D1F] group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>

                    {/* Center Area (Links) */}
                    <nav className="flex-1 flex flex-col items-center justify-center gap-6 overflow-y-auto">
                        {navItems.map((item, index) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <motion.div key={index} variants={itemVariants}>
                                    <motion.div
                                        whileHover={{ y: -3, textShadow: '0px 4px 12px rgba(0, 122, 255, 0.3)' }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    >
                                        <Link
                                            to={item.path}
                                            onClick={onClose}
                                            className={`text-3xl md:text-5xl font-semibold tracking-tight transition-colors duration-300 inline-block ${isActive ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'
                                                }`}
                                            style={{ fontFamily: "'Heebo', sans-serif" }}
                                        >
                                            {item.name}
                                        </Link>
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* Bottom Area (Logo) */}
                    <motion.div
                        variants={itemVariants}
                        className="w-full pb-12 pt-6 flex justify-center shrink-0 opacity-40"
                    >
                        <div className="flex flex-col items-center gap-2">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-10 object-contain" />
                            ) : (
                                <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
                                    <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                                    <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                                </svg>
                            )}
                            <span className="text-sm font-semibold tracking-widest uppercase text-[#1D1D1F]">{siteName}</span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
