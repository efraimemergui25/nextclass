import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
    { label: "מסכים אינטראקטיביים והקרנה", slug: "מסכים אינטראקטיביים והקרנה" },
    { label: "מחשוב לצוות ותלמידים", slug: "מחשוב לצוות ותלמידים" },
    { label: "מעבדות STEM ומרחבי חדשנות", slug: "מעבדות STEM ומרחבי חדשנות" },
    { label: "אודיו ווידאו למרחבי למידה", slug: "אודיו ווידאו למרחבי למידה" },
    { label: "תשתיות ועגלות טעינה", slug: "תשתיות ועגלות טעינה" },
];

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

    // Dynamic Cart
    const { cartItems } = useCart();
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    // Hyper-Sensitive Scroll Logic (Smart Header)
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            // Scrolling DOWN (and past initial hero area) -> Hide
            setHidden(true);
        } else {
            // Scrolling UP (even 1px) or at top -> Show
            setHidden(false);
        }
    });

    const navigate = useNavigate();

    // Prevent scrolling when menu/cart is open
    useEffect(() => {
        if (isMenuOpen || isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isMenuOpen, isCartOpen]);

    return (
        <>
            {/* Dynamic Island — Smart Pill */}
            <motion.header
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: "-150%", opacity: 0 }
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl bg-white/40 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-full px-7 py-3 flex items-center justify-between pointer-events-auto transition-apple-fluid"
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
                <nav className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2 text-[13px] pointer-events-auto z-[120]">
                    {/* Link 1: Home */}
                    <Link
                        to="/"
                        className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300"
                    >
                        דף הבית
                    </Link>

                    {/* Link 2: Products — Hover Mega Menu */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsMegaMenuOpen(true)}
                        onMouseLeave={() => setIsMegaMenuOpen(false)}
                    >
                        <Link
                            to="/catalog"
                            className={`flex items-center gap-1.5 font-semibold tracking-wide text-sm md:text-base transition-colors duration-300 ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'
                                }`}
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
                                    className="absolute top-full mt-6 right-1/2 translate-x-1/2 w-80 bg-white/40 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col gap-1 z-[110] pointer-events-auto transform-gpu will-change-transform"
                                >
                                    {/* Triangle pointer */}
                                    <div className="absolute -top-2 right-1/2 translate-x-1/2 w-4 h-4 bg-white/40 backdrop-blur-3xl border-t border-l border-white/60 rotate-45 pointer-events-none" />

                                    {CATEGORIES.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                                            className="text-[#86868B] font-medium text-base py-2.5 px-3 rounded-xl hover:text-[#1D1D1F] hover:bg-black/5 hover:translate-x-[-8px] transition-all duration-300 pointer-events-auto"
                                        >
                                            {cat.label}
                                        </Link>
                                    ))}

                                    {/* View All CTA */}
                                    <div className="border-t border-gray-100 mt-2 pt-3">
                                        <Link
                                            to="/catalog"
                                            className="text-[#007AFF] font-bold text-sm flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-[#007AFF]/5 transition-all duration-300 pointer-events-auto"
                                        >
                                            כל המוצרים
                                            <svg className="w-4 h-4 rotate-180 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Link 3: Compare */}
                    <Link
                        to="/compare"
                        className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto"
                    >
                        השוואת דגמים
                    </Link>

                    <Link
                        to="/about"
                        className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto"
                    >
                        הסיפור שלנו
                    </Link>

                    <Link
                        to="/contact"
                        className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto"
                    >
                        צור קשר
                    </Link>
                </nav>

                {/* ═══════════ LEFT ZONE (RTL End) — Utilities ═══════════ */}
                <div className="flex items-center gap-4 shrink-0">
                    {/* Visual Order (R to L): Cart -> Back -> Hamburger */}

                    {/* 1. Shopping Cart (Rightmost of group) */}
                    <motion.button
                        onClick={() => setIsCartOpen(true)}
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

                    {/* 2. iOS Back Button (Center of group) */}
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 md:w-11 md:h-11 cursor-pointer rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0 pointer-events-auto z-[120]"
                        aria-label="חזור אחורה"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#1D1D1F] pointer-events-none" />
                    </button>

                    {/* 3. Hamburger Menu (Extreme Left of screen) */}
                    <motion.button
                        onClick={() => setIsMenuOpen(true)}
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

            <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Header;
