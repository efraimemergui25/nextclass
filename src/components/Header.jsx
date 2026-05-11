import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Search, Monitor, Laptop2, FlaskConical, Volume2, Zap, Globe } from 'lucide-react';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';
import SmartSearchModal from './SmartSearchModal';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductsContext';
import { Heart } from 'lucide-react';

// Cycling per-category visual identity — matches HomeDiscoverSection palette
const CAT_ACCENTS = ['#007AFF', '#BF5AF2', '#30D158', '#FF9F0A', '#FF375F', '#64D2FF'];
const CAT_ICONS   = [Monitor, Laptop2, FlaskConical, Volume2, Zap, Globe];

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
    const { activeProducts } = useProducts();
    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');

    const CATEGORIES = useMemo(() => {
        const raw = getSetting('catalog_categories', 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה');
        return raw.split(',').map(s => ({ label: s.trim(), slug: s.trim() }));
    }, [getSetting]);

    // Per-category: product count + top product image for mega menu
    const categoryMeta = useMemo(() => {
        const map = {};
        CATEGORIES.forEach(({ slug }) => {
            const prods = activeProducts.filter(p => p.category === slug);
            map[slug] = {
                count: prods.length,
                topImage: prods.find(p => p.image)?.image ?? null,
            };
        });
        return map;
    }, [CATEGORIES, activeProducts]);

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
                <nav className="hidden md:flex flex-1 items-center justify-center gap-3 lg:gap-5">
                    {navLinks.map((link) => (
                        link.isMega ? (
                            <button
                                key={link.path}
                                ref={productsRef}
                                onMouseEnter={openMegaMenu}
                                onMouseLeave={scheduledClose}
                                onClick={() => { handleMegaMenuLinkClick(); navigate(link.path); }}
                                className={`flex items-center gap-1 font-semibold text-[13px] whitespace-nowrap transition-colors duration-300 bg-transparent border-none cursor-pointer ${isMegaMenuOpen ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:text-[#007AFF]'}`}
                            >
                                {link.label}
                                <svg
                                    className={`w-3 h-3 transition-transform duration-300 pointer-events-none shrink-0 ${isMegaMenuOpen ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        ) : (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="text-[#1D1D1F] font-semibold text-[13px] whitespace-nowrap hover:text-[#007AFF] transition-colors duration-300"
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

            {/* ── Mega Menu — premium dark Apple-style, rendered via Portal ── */}
            {createPortal(
                <AnimatePresence>
                    {isMegaMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.97 }}
                            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                            onMouseEnter={cancelClose}
                            onMouseLeave={scheduledClose}
                            dir="rtl"
                            style={{
                                position: 'fixed',
                                top: dropdownPos.top,
                                left: dropdownPos.centerX,
                                transform: 'translateX(-50%)',
                                zIndex: 9999,
                                width: 520,
                                background: 'rgba(13, 14, 22, 0.97)',
                                backdropFilter: 'blur(64px) saturate(1.6)',
                                WebkitBackdropFilter: 'blur(64px) saturate(1.6)',
                                border: '1px solid rgba(255,255,255,0.09)',
                                boxShadow: '0 40px 80px rgba(0,0,0,0.50), 0 0 0 1px rgba(255,255,255,0.04) inset',
                                borderRadius: '2.25rem',
                                padding: '12px',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Ambient glow blobs */}
                            <div className="absolute -top-16 right-8 w-36 h-36 bg-[#007AFF]/14 blur-[56px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-16 left-8 w-32 h-32 bg-[#BF5AF2]/10 blur-[56px] rounded-full pointer-events-none" />

                            {/* Header row */}
                            <div className="flex items-center justify-between px-4 py-2.5 mb-1">
                                <Link
                                    to="/catalog"
                                    onClick={handleMegaMenuLinkClick}
                                    className="flex items-center gap-1 text-[#007AFF] font-bold text-[11px] tracking-tight hover:opacity-75 transition-opacity"
                                >
                                    {getSetting('nav_mega_all', 'ראה הכל')}
                                    <ChevronLeft size={12} />
                                </Link>
                                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">
                                    {getSetting('nav_mega_label', 'פתרונות לחינוך')}
                                </span>
                            </div>

                            {/* Category rows */}
                            <div className="flex flex-col gap-0.5">
                                {CATEGORIES.map(({ label, slug }, idx) => {
                                    const accent   = CAT_ACCENTS[idx % CAT_ACCENTS.length];
                                    const IconComp = CAT_ICONS[idx % CAT_ICONS.length];
                                    const meta     = categoryMeta[slug] ?? { count: 0, topImage: null };

                                    return (
                                        <Link
                                            key={slug}
                                            to={`/catalog?category=${encodeURIComponent(slug)}`}
                                            onClick={handleMegaMenuLinkClick}
                                            className="group relative flex items-center gap-3.5 px-4 py-3 rounded-[1.25rem] transition-all duration-200 hover:bg-white/[0.07]"
                                            style={{ borderRight: '2.5px solid transparent' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderRightColor = accent; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderRightColor = 'transparent'; }}
                                        >
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                                                style={{ background: `${accent}1E` }}
                                            >
                                                <IconComp size={17} style={{ color: accent }} strokeWidth={1.8} />
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 text-right min-w-0">
                                                <p className="text-[13.5px] font-bold leading-snug truncate transition-colors duration-200"
                                                    style={{ color: 'rgba(255,255,255,0.88)' }}>
                                                    {label}
                                                </p>
                                                <p className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                                                    {meta.count > 0 ? `${meta.count} פתרונות` : getSetting('nav_mega_hint', 'לחץ לצפייה')}
                                                </p>
                                            </div>

                                            {/* Product thumbnail */}
                                            {meta.topImage && (
                                                <div
                                                    className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)' }}
                                                >
                                                    <img src={meta.topImage} alt="" className="w-9 h-9 object-contain" />
                                                </div>
                                            )}

                                            {/* Chevron */}
                                            <ChevronLeft
                                                size={13}
                                                className="shrink-0 opacity-0 translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200"
                                                style={{ color: accent }}
                                            />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Footer CTAs */}
                            <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <Link
                                    to="/catalog"
                                    onClick={handleMegaMenuLinkClick}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-[1.1rem] font-bold text-[13px] text-white transition-all hover:opacity-90"
                                    style={{ background: '#007AFF' }}
                                >
                                    כל הקטלוג
                                    <ChevronLeft size={13} />
                                </Link>
                                <Link
                                    to="/discover"
                                    onClick={handleMegaMenuLinkClick}
                                    className="flex-1 flex items-center justify-center py-3 rounded-[1.1rem] font-bold text-[13px] transition-all hover:bg-white/10"
                                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    {getSetting('nav_mega_discover', 'גלה פתרונות')}
                                </Link>
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
