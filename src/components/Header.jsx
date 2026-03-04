import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const location = useLocation();

    // Determine if we should start transparent (typically only on Home page with Hero)
    const isHomePage = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        // Ensure initial state is correct, especially when navigating between pages
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const handleMouseEnter = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        setIsMegaMenuOpen(true);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setIsMegaMenuOpen(false);
        }, 150);
        setHoverTimeout(timeout);
    };

    // Categories for Mega Menu
    const categories = [
        { title: "מסכים ומרחבי למידה", desc: "לוחות חכמים אינטראקטיביים ותצוגות קצה", path: "/catalog?cat=screens" },
        { title: "מעבדות STEM", desc: "ציוד פיזיקה, כימיה ושולחנות עבודה מתקדמים", path: "/catalog?cat=stem" },
        { title: "שילוט קמפוס", desc: "עמדות מידע דיגיטליות לכניסות ומסדרונות", path: "/catalog?cat=signage" },
        { title: "תוכנה ורישוי", desc: "פלטפורמות עריכה ויצירה לסטודנטים", path: "/catalog?cat=software" },
    ];

    // Styling logic based on state
    const isSolid = !isHomePage || isScrolled || isMegaMenuOpen;

    // Header Background classes
    const headerBgClasses = isSolid
        ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm"
        : "bg-transparent border-b border-transparent";

    // Text color classes
    const textColor = isSolid ? "text-[#1D1D1F]" : "text-white";
    const logoColor = isSolid ? "text-[#1D1D1F]" : "text-white";
    const hoverColor = isSolid ? "hover:text-[#007AFF]" : "hover:text-gray-200";

    return (
        <header className="fixed top-0 left-0 right-0 z-[60] font-sans antialiased transition-all duration-500">
            {/* Main Header Bar */}
            <div className={`relative z-20 h-[73px] flex items-center justify-between px-6 md:px-12 transition-all duration-500 ${headerBgClasses}`}>

                {/* Right side (RTL Start) - Logo */}
                <Link
                    to="/"
                    className="text-2xl tracking-tight focus:outline-none rounded flex-shrink-0"
                    aria-label="nextclass home"
                >
                    <span className={`font-bold transition-colors duration-500 ${logoColor}`}>next</span>
                    <span className={`font-light transition-colors duration-500 ${logoColor}`}>class</span>
                </Link>

                {/* Center - Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8 space-x-reverse h-full">
                    <div
                        className="h-full flex items-center relative"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link
                            to="/catalog"
                            className={`text-[15px] font-medium transition-colors duration-500 py-2 flex items-center gap-1.5 ${textColor} ${hoverColor}`}
                        >
                            <span>קטלוג הפתרונות</span>
                            <svg className={`w-4 h-4 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Link>
                    </div>
                    <Link to="/innovation" className={`text-[15px] font-medium transition-colors duration-500 ${textColor} ${hoverColor}`}>מרחבי חדשנות</Link>
                    <Link to="/story" className={`text-[15px] font-medium transition-colors duration-500 ${textColor} ${hoverColor}`}>הסיפור שלנו</Link>
                    <Link to="/success" className={`text-[15px] font-medium transition-colors duration-500 ${textColor} ${hoverColor}`}>הצלחות בשטח</Link>
                    <Link to="/contact" className={`text-[15px] font-medium transition-colors duration-500 ${textColor} ${hoverColor}`}>דברו איתנו</Link>
                </nav>

                {/* Left side (RTL End) - Cart & Actions */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button aria-label="חיפוש" className={`transition-colors duration-500 focus:outline-none p-2 rounded-full ${isSolid ? 'hover:bg-gray-50' : 'hover:bg-white/10'} ${textColor} ${hoverColor}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </button>
                    <Link to="/cart" aria-label="עגלת קניות" className={`transition-colors duration-500 focus:outline-none p-2 rounded-full ${isSolid ? 'hover:bg-gray-50' : 'hover:bg-white/10'} ${textColor} ${hoverColor} relative`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Mega Menu Dropdown */}
            <AnimatePresence>
                {isMegaMenuOpen && (
                    <motion.div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(10px)", transition: { duration: 0.2 } }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-[73px] left-0 right-0 z-10 bg-white/95 backdrop-blur-2xl border-b border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
                    >
                        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                                {categories.map((cat, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + (idx * 0.05), duration: 0.5, ease: "easeOut" }}
                                    >
                                        <Link
                                            to={cat.path}
                                            className="block group p-6 -m-6 rounded-3xl hover:bg-[#F5F5F7] transition-all duration-300"
                                            onClick={() => setIsMegaMenuOpen(false)}
                                        >
                                            <h3 className="text-xl font-bold text-[#1D1D1F] mb-2 group-hover:text-[#007AFF] transition-colors">{cat.title}</h3>
                                            <p className="text-base text-gray-500 leading-relaxed font-normal">{cat.desc}</p>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Overlay when Mega Menu is open */}
            <AnimatePresence>
                {isMegaMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        className="fixed inset-0 top-[73px] bg-black/10 z-0 pointer-events-none backdrop-blur-sm transition-all h-[100vh]"
                    />
                )}
            </AnimatePresence>

        </header>
    );
};

export default Header;
