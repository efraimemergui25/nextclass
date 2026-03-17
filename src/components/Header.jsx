import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
    { label: "מסכי מגע", slug: "מסכי מגע" },
    { label: "מסכי מידע", slug: "מסכי מידע" },
    { label: "מעבדות מדעים", slug: "מעבדות מדעים" },
    { label: "ציוד קצה", slug: "ציוד קצה" },
    { label: "תוכנה", slug: "תוכנה" },
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
                transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-6xl bg-white/80 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_#00000010] rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto"
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
                <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-sm pointer-events-auto z-[120]">
                    {/* Link 1: Home */}
                    <Link
                        to="/"
                        className="text-[#1D1D1F] font-semibold hover:text-[#007AFF] transition-colors duration-300"
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
                            className={`flex items-center gap-1.5 font-semibold transition-colors duration-300 ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'
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
                                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                    className="absolute top-full mt-6 right-1/2 translate-x-1/2 w-64 bg-white/90 backdrop-blur-3xl border border-gray-100 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col gap-1 z-[9999] pointer-events-auto"
                                >
                                    {/* Triangle pointer */}
                                    <div className="absolute -top-2 right-1/2 translate-x-1/2 w-4 h-4 bg-white/90 border-t border-l border-gray-100 rotate-45 backdrop-blur-3xl pointer-events-none" />

                                    {CATEGORIES.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                                            className="text-gray-500 font-medium text-sm py-2.5 px-3 rounded-xl hover:text-[#007AFF] hover:bg-[#007AFF]/5 hover:translate-x-[-8px] transition-all duration-300 pointer-events-auto"
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
                        className="text-[#1D1D1F] font-semibold hover:text-[#007AFF] transition-colors duration-300 pointer-events-auto"
                    >
                        השוואת דגמים
                    </Link>
                </nav>

                {/* ═══════════ LEFT ZONE (RTL End) — Utilities ═══════════ */}
                <div className="flex items-center gap-4 shrink-0 flex-row-reverse">
                    {/* Reordered for RTL: Search -> Cart -> Hamburger -> Back Button */}

                    {/* Shopping Cart */}
                    <motion.button
                        onClick={() => setIsCartOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer focus:outline-none p-2 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-colors duration-300 flex items-center justify-center shrink-0 pointer-events-auto z-[120]"
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

                    {/* Hamburger Menu */}
                    <motion.button
                        onClick={() => setIsMenuOpen(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-2 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-colors duration-300 flex items-center justify-center shrink-0 pointer-events-auto z-[120]"
                        aria-label="תפריט"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                    </motion.button>

                    {/* iOS Back Button (Safety Loop) */}
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 md:w-11 md:h-11 cursor-pointer rounded-full bg-white/40 hover:bg-gray-100/80 backdrop-blur-md border border-gray-200 shadow-sm flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0 pointer-events-auto z-[120]"
                        aria-label="חזור אחורה"
                    >
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#1D1D1F] pointer-events-none" />
                    </button>
                </div>
            </motion.header>

            <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Header;
