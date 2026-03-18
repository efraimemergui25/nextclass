import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';
import SmartSearchModal from './SmartSearchModal';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
    { label: 'מסכים אינטראקטיביים והקרנה', slug: 'מסכים אינטראקטיביים והקרנה' },
    { label: 'מחשוב לצוות ותלמידים', slug: 'מחשוב לצוות ותלמידים' },
    { label: 'מעבדות STEM ומרחבי חדשנות', slug: 'מעבדות STEM ומרחבי חדשנות' },
    { label: 'אודיו ווידאו למרחבי למידה', slug: 'אודיו ווידאו למרחבי למידה' },
    { label: 'תשתיות ועגלות טעינה', slug: 'תשתיות ועגלות טעינה' },
];

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [hidden, setHidden] = useState(false);

    const { cartItems } = useCart();
    const navigate = useNavigate();

    // ─── Derived values ──────────────────────────────────────────────────────
    const cartCount = useMemo(
        () => (cartItems ?? []).reduce((acc, item) => acc + (item?.qty ?? 1), 0),
        [cartItems]
    );

    // ─── Scroll hide/show logic ───────────────────────────────────────────────
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    // ─── Keyboard shortcut (Spotlight-style ⌘K) ──────────────────────────────
    const handleKeyDown = useCallback((e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(prev => !prev);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ─── Body scroll lock ─────────────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = (isMenuOpen || isCartOpen || isSearchOpen) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen, isCartOpen, isSearchOpen]);

    // ─── Stable handlers ──────────────────────────────────────────────────────
    const openMenu = useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const openSearch = useCallback(() => setIsSearchOpen(true), []);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const openMegaMenu = useCallback(() => setIsMegaMenuOpen(true), []);
    const closeMegaMenu = useCallback(() => setIsMegaMenuOpen(false), []);
    const goBack = useCallback(() => navigate(-1), [navigate]);

    return (
        <>
            {/* Dynamic Island — Smart Pill */}
            <motion.header
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: '-150%', opacity: 0 },
                }}
                animate={hidden ? 'hidden' : 'visible'}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl bg-white/45 backdrop-blur-3xl backdrop-saturate-[1.8] border border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-full px-5 py-2.5 flex items-center justify-between gap-4 pointer-events-auto will-change-transform transform-gpu"
            >
                {/* ═══════════ RIGHT ZONE (RTL Anchor) — Logo ═══════════ */}
                <Link to="/" className="flex items-center gap-2.5 text-[#1D1D1F] hover:opacity-80 transition-opacity duration-300 shrink-0 pointer-events-auto z-[120]">
                    <svg className="w-7 h-7 md:w-8 md:h-8 shrink-0" viewBox="0 0 32 32" fill="none">
                        <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                        <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                    </svg>
                    <div className="text-xl md:text-2xl tracking-tighter hidden sm:block">
                        <span className="font-black">next</span><span className="font-light text-[#007AFF]">class</span>
                    </div>
                </Link>

                {/* ═══════════ CENTER ZONE — Core Navigation (Desktop) ═══════════ */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-[13px] pointer-events-auto overflow-hidden px-4">
                    <Link to="/" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300">
                        דף הבית
                    </Link>

                    {/* Products — Hover Mega Menu */}
                    <div className="relative" onMouseEnter={openMegaMenu} onMouseLeave={closeMegaMenu}>
                        <Link
                            to="/catalog"
                            className={`flex items-center gap-1.5 font-semibold tracking-wide text-sm md:text-base transition-colors duration-300 ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'}`}
                        >
                            המוצרים שלנו
                            <svg
                                className={`w-3.5 h-3.5 transition-transform duration-300 pointer-events-none ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </Link>

                        {/* Mega Menu Dropdown */}
                        <AnimatePresence>
                            {isMegaMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                    className="absolute top-full mt-6 right-1/2 translate-x-1/2 w-[340px] bg-white/90 backdrop-blur-3xl backdrop-saturate-[1.8] border border-gray-200/70 rounded-[2rem] p-4 shadow-[0_30px_60px_rgb(0_0_0/0.16)] z-[110] pointer-events-auto will-change-transform overflow-hidden"
                                >
                                    <div className="flex flex-col gap-1">
                                        {CATEGORIES.map((cat) => (
                                            <Link
                                                key={cat.slug}
                                                to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                                                className="relative px-5 py-3.5 group cursor-pointer transition-apple-fluid"
                                            >
                                                {/* Hover Highlight */}
                                                <motion.div
                                                    layoutId="menu-highlight"
                                                    className="absolute inset-0 bg-[#007AFF]/10 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                />
                                                <motion.div
                                                    whileHover={{ x: 8 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                                    className="relative z-10 flex justify-between items-center"
                                                >
                                                    <span className="text-[#1D1D1F] text-[15px] font-bold tracking-tight">{cat.label}</span>
                                                    <ChevronRight className="w-4 h-4 text-[#007AFF] opacity-0 group-hover:opacity-100 transition-apple-fluid translate-x-1 group-hover:translate-x-0" />
                                                </motion.div>
                                            </Link>
                                        ))}

                                        {/* Bottom Action: View All */}
                                        <div className="mt-4 pt-4 border-t border-white/20">
                                            <Link
                                                to="/catalog"
                                                className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-black text-sm tracking-tight flex items-center justify-center gap-2 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all"
                                            >
                                                כל המוצרים
                                                <ChevronRight className="w-4 h-4 rotate-180" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <Link to="/compare" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto">
                        השוואת דגמים
                    </Link>
                    <Link to="/about" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto">
                        הסיפור שלנו
                    </Link>
                    <Link to="/contact" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto">
                        צור קשר
                    </Link>
                </nav>

                {/* ═══════════ LEFT ZONE (RTL End) — Utilities ═══════════ */}
                <div className="flex items-center gap-4 shrink-0">
                    {/* 1. Shopping Cart */}
                    <motion.button
                        onClick={openCart}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-apple-fluid flex items-center justify-center shrink-0 pointer-events-auto z-[120]"
                        aria-label="עגלת קניות"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 bg-[#007AFF] text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-sm pointer-events-none tracking-wide">
                                {cartCount}
                            </span>
                        )}
                    </motion.button>

                    {/* 2. Smart Search */}
                    <motion.button
                        onClick={openSearch}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-apple-fluid flex items-center justify-center shrink-0 pointer-events-auto z-[120]"
                        aria-label="חיפוש"
                    >
                        <Search className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" />
                    </motion.button>

                    {/* 3. iOS Back Button — mobile only */}
                    <button
                        onClick={goBack}
                        className="flex md:hidden w-10 h-10 cursor-pointer rounded-full bg-white/50 hover:bg-white backdrop-blur-xl border border-white/80 shadow-[0_4px_12px_rgb(0_0_0/0.08)] items-center justify-center transition-all duration-300 active:scale-95 shrink-0 pointer-events-auto z-[120]"
                        aria-label="חזור אחורה"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#1D1D1F] pointer-events-none" />
                    </button>

                    {/* 4. Hamburger Menu */}
                    <motion.button
                        onClick={openMenu}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-apple-fluid flex items-center justify-center shrink-0 pointer-events-auto z-[120]"
                        aria-label="תפריט"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                    </motion.button>
                </div>
            </motion.header>

            <MenuOverlay isOpen={isMenuOpen} onClose={closeMenu} />
            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
            <AnimatePresence>
                <SmartSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
            </AnimatePresence>
        </>
    );
};

export default memo(Header);
