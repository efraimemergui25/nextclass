import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Search } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';
import SmartSearchModal from './SmartSearchModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { Heart } from 'lucide-react';

// Remove static helpers

const DEFAULT_NAV_ITEMS = [
    { id: 'home',     path: '/',         labelKey: 'nav_home',     defaultLabel: 'דף הבית',       visible: true },
    { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו', visible: true, isMega: true },
    { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים', visible: true },
    { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו',  visible: true },
    { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה',   visible: true },
    { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין',         visible: true },
    { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר',       visible: true },
];

const Header = () => {
    const { getSetting } = useSettings();
    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');

    const CATEGORIES = useMemo(() => {
        const raw = getSetting('catalog_categories', 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה');
        return raw.split(',').map(s => ({ label: s.trim(), slug: s.trim() }));
    }, [getSetting]);

    const navLinks = useMemo(() => {
        const saved = getSetting('nav_items', null);
        const items = Array.isArray(saved) ? saved : DEFAULT_NAV_ITEMS;
        return items
            .filter(item => item.visible !== false)
            .map(item => ({
                path: item.path,
                label: getSetting(item.labelKey, item.defaultLabel),
                isMega: item.isMega || false,
            }));
    }, [getSetting]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, centerX: 0 });

    const productsRef = useRef(null);
    const closeTimerRef = useRef(null);

    const { cartItems } = useCart();
    const { wishlistCount } = useWishlist();
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
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl bg-white/45 backdrop-blur-3xl backdrop-saturate-[1.8] border border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-full px-6 py-2 flex items-center justify-between gap-4 pointer-events-auto will-change-transform transform-gpu"
            >
                {/* ═══ RIGHT ZONE — Logo ═══ */}
                <Link to="/" className="flex items-center gap-2.5 text-[#1D1D1F] hover:opacity-80 transition-opacity duration-300 shrink-0 z-[120]">
                    {siteLogo ? (
                        <img src={siteLogo} alt={siteName} className="h-8 md:h-10 object-contain" />
                    ) : (
                        <svg className="w-7 h-7 md:w-8 md:h-8 shrink-0" viewBox="0 0 32 32" fill="none">
                            <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" />
                            <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                        </svg>
                    )}
                    <div className="text-xl md:text-2xl tracking-tighter hidden sm:block">
                        <span className="font-black">{siteName}</span>
                    </div>
                </Link>

                {/* ═══ CENTER ZONE — Navigation ═══ */}
                <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-[13px]">
                    {navLinks.map((link) => (
                        link.isMega ? (
                            <button
                                key={link.path}
                                ref={productsRef}
                                onMouseEnter={openMegaMenu}
                                onMouseLeave={scheduledClose}
                                onClick={() => { handleMegaMenuLinkClick(); navigate(link.path); }}
                                className={`flex items-center gap-1.5 font-semibold tracking-wide text-sm md:text-base transition-colors duration-300 bg-transparent border-none cursor-pointer ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'}`}
                            >
                                {link.label}
                                <svg
                                    className={`w-3.5 h-3.5 transition-transform duration-300 pointer-events-none ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        ) : (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                className="text-[#1D1D1F] font-semibold tracking-wide text-sm md:text-base hover:text-[#007AFF] transition-colors duration-300"
                            >
                                {link.label}
                            </Link>
                        )
                    ))}
                </nav>

                {/* ═══ LEFT ZONE — Utilities ═══ */}
                <div className="flex items-center gap-4 shrink-0">
                    <motion.button
                        onClick={openCart}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label={getSetting('aria_cart', 'עגלת קניות')}
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
                        aria-label={getSetting('aria_search', 'חיפוש')}
                    >
                        <Search className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" />
                    </motion.button>

                    <motion.button
                        onClick={() => navigate('/favorites')}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="relative cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#FF2D55] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label="מועדפים"
                    >
                        <Heart className="w-6 h-6 md:w-7 md:h-7 pointer-events-none" />
                        {wishlistCount > 0 && (
                            <span className="absolute top-1 right-1 bg-[#FF2D55] text-white text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                                {wishlistCount}
                            </span>
                        )}
                    </motion.button>

                    <button
                        onClick={goBack}
                        className="flex md:hidden w-10 h-10 cursor-pointer rounded-full bg-white/50 hover:bg-white backdrop-blur-xl border border-white/80 shadow-sm items-center justify-center transition-all active:scale-95 shrink-0 z-[120]"
                        aria-label={getSetting('aria_back', 'חזור')}
                    >
                        <ChevronRight className="w-5 h-5 text-[#1D1D1F] pointer-events-none" />
                    </button>

                    <motion.button
                        onClick={openMenu}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className="cursor-pointer focus:outline-none p-3 rounded-full text-[#1D1D1F] hover:bg-gray-100/50 hover:text-[#007AFF] transition-all flex items-center justify-center shrink-0 z-[120]"
                        aria-label={getSetting('aria_menu', 'תפריט')}
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
                            initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: 6, scale: 0.98, filter: 'blur(10px)' }}
                            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduledClose}
                            style={{
                                position: 'fixed',
                                top: dropdownPos.top,
                                left: dropdownPos.centerX,
                                transform: 'translateX(-50%)',
                                zIndex: 9999,
                                width: '360px',
                                background: 'rgba(255, 255, 255, 0.55)',
                                backdropFilter: 'blur(54px) saturate(2)',
                                WebkitBackdropFilter: 'blur(54px) saturate(2)',
                                border: '1px solid rgba(255, 255, 255, 0.7)',
                                boxShadow: '0 30px 70px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                                borderRadius: '2.25rem',
                                padding: '10px',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Ambient background glow inside the menu */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#007AFF]/10 blur-[60px] rounded-full pointer-events-none" />
                            
                            <div className="relative flex flex-col gap-1.5">
                                {CATEGORIES.map((cat, idx) => {
                                    const moods = [
                                        { bg: 'bg-blue-500/10', icon: 'text-blue-600', glow: 'shadow-blue-500/20' },
                                        { bg: 'bg-indigo-500/10', icon: 'text-indigo-600', glow: 'shadow-indigo-500/20' },
                                        { bg: 'bg-emerald-500/10', icon: 'text-emerald-600', glow: 'shadow-emerald-500/20' },
                                        { bg: 'bg-orange-500/10', icon: 'text-orange-600', glow: 'shadow-orange-500/20' },
                                        { bg: 'bg-sky-500/10', icon: 'text-sky-600', glow: 'shadow-sky-500/20' }
                                    ];
                                    const mood = moods[idx % moods.length];
                                    
                                    return (
                                        <Link
                                            key={cat.slug}
                                            to={`/catalog?category=${encodeURIComponent(cat.slug)}`}
                                            onClick={handleMegaMenuLinkClick}
                                            className="group relative flex items-center gap-4 p-3.5 rounded-[1.5rem] transition-all duration-300 hover:bg-white/80 hover:shadow-lg hover:shadow-black/5"
                                        >
                                            <div className={`w-11 h-11 rounded-2xl ${mood.bg} flex items-center justify-center ${mood.icon} transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:shadow-lg ${mood.glow}`}>
                                                {idx === 0 && <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                                {idx === 1 && <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                                                {idx === 2 && <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.34a2 2 0 00-1.136 1.435l-.133.665c-.066.331.02.67.236.926l.464.55c.3.358.41.85.291 1.32l-.164.653a2 2 0 001.076 2.24l.582.291a2 2 0 002.324-.316l.432-.432a2 2 0 011.831-.513l.635.159a2 2 0 002.263-1.127l.192-.48a2 2 0 00-.28-1.92l-.46-.575a2 2 0 01-.397-1.468l.112-.672a2 2 0 00-1.03-2.14l-1.01-.505a2 2 0 00-2.316.326l-.42.42a2 2 0 01-1.84.511l-.64-.16a2 2 0 00-2.28 1.138l-.18.448a2 2 0 00.286 1.933l.466.582c.21.261.291.604.22.934l-.14.657a2 2 0 001.082 2.222l.585.292a2 2 0 002.31-.322l.42-.42a2 2 0 011.841-.511l.64.16a2 2 0 002.28-1.138l.18-.448a2 2 0 00-.286-1.933l-.466-.582z" /></svg>}
                                                {idx === 3 && <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                                                {idx === 4 && <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[14px] font-bold text-[#1D1D1F] leading-tight transition-colors group-hover:text-[#007AFF]">{cat.label}</span>
                                                <span className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-tight">{getSetting('nav_mega_hint', 'לחץ לצפייה בדגמים')}</span>
                                            </div>
                                            <ChevronLeft className="w-4 h-4 mr-auto opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#007AFF]" />
                                        </Link>
                                    );
                                })}

                                <div className="mt-2 pt-2 border-t border-black/[0.03]">
                                    <Link
                                        to="/catalog"
                                        onClick={handleMegaMenuLinkClick}
                                        className="flex items-center justify-between w-full p-4 bg-[#1D1D1F] text-white rounded-[1.5rem] font-bold text-[13px] tracking-tight shadow-xl hover:bg-black transition-all group"
                                    >
                                        <span>{getSetting('nav_mega_all', 'לכל קטלוג הפתרונות')}</span>
                                        <ChevronLeft size={16} className="group-hover:translate-x-[-4px] transition-transform" />
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
