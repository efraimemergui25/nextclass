import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
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
    // Position of the trigger button for portal placement
    const [dropdownPos, setDropdownPos] = useState({ top: 0, centerX: 0 });

    const productsRef = useRef(null);
    const closeTimerRef = useRef(null);

    const { cartItems } = useCart();
    const navigate = useNavigate();

    const cartCount = useMemo(
        () => (cartItems ?? []).reduce((acc, item) => acc + (item?.qty ?? 1), 0),
        [cartItems]
    );

    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150) setHidden(true);
        else setHidden(false);
    });

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

    useEffect(() => {
        document.body.style.overflow = (isMenuOpen || isCartOpen || isSearchOpen) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen, isCartOpen, isSearchOpen]);

    const openMenu = useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const openSearch = useCallback(() => setIsSearchOpen(true), []);
    const closeSearch = useCallback(() => setIsSearchOpen(false), []);
    const goBack = useCallback(() => navigate(-1), [navigate]);

    // ── Delayed close — allows mouse to travel to portal dropdown ──────────────
    const cancelClose = useCallback(() => {
        clearTimeout(closeTimerRef.current);
    }, []);

    const scheduledClose = useCallback(() => {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => setIsMegaMenuOpen(false), 120);
    }, []);

    const openMegaMenu = useCallback(() => {
        cancelClose();
        if (productsRef.current) {
            const rect = productsRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 12,
                centerX: rect.left + rect.width / 2,
            });
        }
        setIsMegaMenuOpen(true);
    }, [cancelClose]);

    // Close mega menu when navigating
    const handleMegaMenuLinkClick = useCallback(() => {
        clearTimeout(closeTimerRef.current);
        setIsMegaMenuOpen(false);
    }, []);

    useEffect(() => () => clearTimeout(closeTimerRef.current), []);

    return (
        <>
            <motion.header
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: '-150%', opacity: 0 },
                }}
                animate={hidden ? 'hidden' : 'visible'}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl bg-white/45 backdrop-blur-3xl backdrop-saturate-[1.8] border border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-full px-5 py-2.5 flex items-center justify-between gap-4 pointer-events-auto will-change-transform transform-gpu"
            >
                {/* ═══ RIGHT ZONE — Logo ═══ */}
                <Link to="/" className="flex items-center gap-2.5 text-[#1D1D1F] hover:opacity-80 transition-opacity duration-300 shrink-0 z-[120]">
                    <svg className="w-7 h-7 md:w-8 md:h-8 shrink-0" viewBox="0 0 32 32" fill="none">
                        <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                        <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                    </svg>
                    <div className="text-xl md:text-2xl tracking-tighter hidden sm:block">
                        <span className="font-black">next</span><span className="font-light text-[#007AFF]">class</span>
                    </div>
                </Link>

                {/* ═══ CENTER ZONE — Navigation ═══ */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-[13px]">
                    <Link to="/" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300">
                        דף הבית
                    </Link>

                    {/* Products trigger — uses ref for portal positioning */}
                    <button
                        ref={productsRef}
                        onMouseEnter={openMegaMenu}
                        onMouseLeave={scheduledClose}
                        onClick={() => { handleMegaMenuLinkClick(); navigate('/catalog'); }}
                        className={`flex items-center gap-1.5 font-semibold tracking-wide text-sm md:text-base transition-colors duration-300 bg-transparent border-none cursor-pointer ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'}`}
                    >
                        המוצרים שלנו
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-300 pointer-events-none ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <Link to="/compare" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300">
                        השוואת דגמים
                    </Link>
                    <Link to="/story" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300">
                        הסיפור שלנו
                    </Link>
                    <Link to="/contact" className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300">
                        צור קשר
                    </Link>
                </nav>

                {/* ═══ LEFT ZONE — Utilities ═══ */}
                <div className="flex items-center gap-4 shrink-0">
                    <motion.button
                        onClick={openCart}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label="עגלת קניות"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 bg-[#007AFF] text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                                {cartCount}
                            </span>
                        )}
                    </motion.button>

                    <motion.button
                        onClick={openSearch}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label="חיפוש"
                    >
                        <Search className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" />
                    </motion.button>

                    <button
                        onClick={goBack}
                        className="flex md:hidden w-10 h-10 cursor-pointer rounded-full bg-white/50 hover:bg-white backdrop-blur-xl border border-white/80 shadow-sm items-center justify-center transition-all active:scale-95 shrink-0 z-[120]"
                        aria-label="חזור"
                    >
                        <ChevronRight className="w-5 h-5 text-[#1D1D1F] pointer-events-none" />
                    </button>

                    <motion.button
                        onClick={openMenu}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label="תפריט"
                    >
                        <svg className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                        </svg>
                    </motion.button>
                </div>
            </motion.header>

            {/* ── Mega Menu — rendered via Portal to bypass header stacking context ── */}
            {createPortal(
                <AnimatePresence>
                    {isMegaMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduledClose}
                            style={{
                                position: 'fixed',
                                top: dropdownPos.top,
                                left: dropdownPos.centerX,
                                transform: 'translateX(-50%)',
                                zIndex: 9999,
                                width: '340px',
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 100%)',
                                backdropFilter: 'blur(48px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(48px) saturate(1.8)',
                                border: '1px solid rgba(255,255,255,0.80)',
                                boxShadow: '0 32px 64px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.95) inset',
                                borderRadius: '2rem',
                                padding: '16px',
                            }}
                        >
                            {/* Top inset shine */}
                            <div style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.slug}
                                        to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                                        onClick={handleMegaMenuLinkClick}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 18px',
                                            borderRadius: '16px',
                                            textDecoration: 'none',
                                            transition: 'background 200ms',
                                            color: '#1D1D1F',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.07)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <span style={{ fontSize: '15px', fontWeight: 700 }}>{cat.label}</span>
                                        <ChevronRight style={{ width: '16px', height: '16px', color: '#007AFF', flexShrink: 0 }} />
                                    </Link>
                                ))}

                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                    <Link
                                        to="/catalog"
                                        onClick={handleMegaMenuLinkClick}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            padding: '14px',
                                            background: 'linear-gradient(180deg, #1A8FFF 0%, #007AFF 100%)',
                                            color: 'white',
                                            borderRadius: '18px',
                                            fontWeight: 900,
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                            boxShadow: '0 8px 20px rgba(0,122,255,0.30)',
                                        }}
                                    >
                                        כל המוצרים
                                        <ChevronRight style={{ width: '16px', height: '16px', transform: 'rotate(180deg)' }} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <MenuOverlay isOpen={isMenuOpen} onClose={closeMenu} />
            <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
            <AnimatePresence>
                <SmartSearchModal isOpen={isSearchOpen} onClose={closeSearch} />
            </AnimatePresence>
        </>
    );
};

export default memo(Header);
