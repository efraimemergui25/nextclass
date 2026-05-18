import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform, useAnimate, useMotionValueEvent } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, Heart, MoreHorizontal, ChevronRight, Search, MessageCircle, X, Send, Phone, Bot, Accessibility, UserCircle, Menu, Monitor, Compass, BookOpen, Award, GraduationCap, Newspaper, Star, Scale, Type, Sun, PauseCircle, Square, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductsContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import CookieConsent from '../components/CookieConsent';
import AnnouncementBar from '../components/AnnouncementBar';
import MenuOverlay from '../components/MenuOverlay';
import { MemberBar } from '../components/PersonalizationLayer';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { haptic } from './utils/haptic';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import UpdateBanner from './components/UpdateBanner';
import MobileAuthSheet from './components/MobileAuthSheet';
import PersonalizationLayer from '../components/PersonalizationLayer';

const MobileLanding   = lazy(() => import('./pages/MobileLanding'));
const MobileCatalog   = lazy(() => import('./pages/MobileCatalog'));
const MobileProduct   = lazy(() => import('./pages/MobileProduct'));
const MobileCart      = lazy(() => import('./pages/MobileCart'));
const MobileCheckout  = lazy(() => import('./pages/MobileCheckout'));
const MobileFavorites = lazy(() => import('./pages/MobileFavorites'));
const MobileContact   = lazy(() => import('./pages/MobileContact'));
const MobileAbout     = lazy(() => import('./pages/MobileAbout'));
const MobileVOD       = lazy(() => import('./pages/MobileVOD'));
const MobileMagazine  = lazy(() => import('./pages/MobileMagazine'));
const MobileMenu      = lazy(() => import('./pages/MobileMenu'));
const MobileCompare      = lazy(() => import('./pages/MobileCompare'));
const MobilePrivacy      = lazy(() => import('./pages/MobilePrivacy'));
const MobileTerms        = lazy(() => import('./pages/MobileTerms'));
const MobileDiscover     = lazy(() => import('./pages/MobileDiscover'));
const MobileInnovation   = lazy(() => import('./pages/MobileInnovation'));
const MobileMembership   = lazy(() => import('./pages/MobileMembership'));

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ─── Header height constants ──────────────────────────────────────────────────
const HEADER_H     = 56;
const HEADER_TOTAL = 64; // 56px pill + 8px top offset

// ─── Pill nav links — identical to desktop pill (5 items) ────────────────────
const MOBILE_NAV_DEFS = [
    { id: 'home',    path: '/',        labelKey: 'nav_home',    defaultLabel: 'דף הבית',      settingKey: 'vis_nav_home' },
    { id: 'catalog', path: '/catalog', labelKey: 'nav_catalog', defaultLabel: 'המוצרים שלנו', settingKey: 'vis_nav_catalog' },
    { id: 'compare', path: '/compare', labelKey: 'nav_compare', defaultLabel: 'השוואת דגמים', settingKey: 'vis_nav_compare' },
    { id: 'story',   path: '/story',   labelKey: 'nav_about',   defaultLabel: 'הסיפור שלנו',  settingKey: 'vis_nav_story' },
    { id: 'contact', path: '/contact', labelKey: 'nav_contact', defaultLabel: 'צור קשר',      settingKey: 'vis_nav_contact' },
];

const PAGE_TITLES = {
    '/catalog':   'קטלוג מוצרים',
    '/cart':      'העגלה שלי',
    '/favorites': 'פריטים שמורים',
    '/contact':   'צור קשר',
    '/story':     'הסיפור שלנו',
    '/vod':       'מרכז הדרכה',
    '/magazine':  'מגזין',
    '/menu':      'תפריט',
    '/compare':   'השוואת מוצרים',
    '/checkout':  'תשלום',
    '/privacy':    'מדיניות פרטיות',
    '/terms':      'תנאי שימוש',
    '/discover':    'גלו את הפתרונות',
    '/innovation':  'חדשנות',
    '/membership':  'חבר מועדון NextClass',
};

const BOTTOM_TABS = [
    { id: 'home',      path: '/',          label: 'בית',    Icon: Home },
    { id: 'catalog',   path: '/catalog',   label: 'קטלוג',  Icon: Grid3X3 },
    { id: 'cart',      path: '/cart',      label: 'עגלה',   Icon: ShoppingBag },
    { id: 'favorites', path: '/favorites', label: 'מועדפים', Icon: Heart },
    { id: 'more',      path: '/menu',      label: 'עוד',    Icon: MoreHorizontal },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
function MobileAnalytics() {
    const location = useLocation();
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        let sid = sessionStorage.getItem('nc_sid');
        if (!sid) {
            sid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            sessionStorage.setItem('nc_sid', sid);
        }
        setDoc(doc(db, 'page_views', `${today}_${sid}`), {
            date: today, sessionId: sid, path: location.pathname,
            platform: 'mobile', ts: serverTimestamp(),
        }, { merge: true }).catch(() => {});
    }, [location]);
    return null;
}

// ─── Route effects: scroll-to-top + document.title ────────────────────────────
function RouteEffects() {
    const { pathname } = useLocation();
    const { getActiveProductById } = useProducts();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const productMatch = pathname.match(/^\/catalog\/(.+)$/);
        const pageTitle = productMatch
            ? (getActiveProductById(productMatch[1])?.title || 'מוצר')
            : (PAGE_TITLES[pathname] || '');
        document.title = pageTitle ? `${pageTitle} | NextClass` : 'NextClass';
    }, [pathname, getActiveProductById]);

    return null;
}

function usePageTitle(pathname) {
    const { getActiveProductById } = useProducts();
    const productMatch = pathname.match(/^\/catalog\/(.+)$/);
    return productMatch
        ? (getActiveProductById(productMatch[1])?.title || 'מוצר')
        : (PAGE_TITLES[pathname] || '');
}

// ─── Animated tab icon with spring bounce on count increase ──────────────────
function AnimatedTabIcon({ Icon, isActive, count, color }) {
    const [scope, animate] = useAnimate();
    const prevCountRef = useRef(count);

    useEffect(() => {
        if (count > prevCountRef.current) {
            animate(scope.current, { scale: [1, 1.4, 0.9, 1] }, {
                type: 'spring', stiffness: 600, damping: 18, duration: 0.45,
            });
        }
        prevCountRef.current = count;
    }, [count, animate, scope]);

    return (
        <div ref={scope} style={{ position: 'relative', zIndex: 1, display: 'inline-flex' }}>
            <Icon
                size={22}
                style={{
                    color: isActive ? '#007AFF' : color,
                    strokeWidth: isActive ? 2.2 : 1.8,
                    transition: 'color 0.15s',
                }}
            />
            {count > 0 && (
                <motion.span
                    key={count}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                    style={{
                        position: 'absolute', top: -5, right: -8,
                        background: '#FF3B30', color: '#fff',
                        borderRadius: 99, minWidth: 17, height: 17,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800,
                        border: '1.5px solid white',
                        padding: '0 3px',
                    }}
                >
                    {count > 9 ? '9+' : count}
                </motion.span>
            )}
        </div>
    );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function MobileBottomNav() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { cartCount }     = useCart();
    const { wishlistCount } = useWishlist();
    const { colors: c }     = useTheme();

    return (
        <nav dir="rtl" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: c.surface,
            borderTop: `0.5px solid ${c.navBorder}`,
            display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
            paddingBottom: 'env(safe-area-inset-bottom, 10px)',
            fontFamily: SF,
        }}>
            {BOTTOM_TABS.map(({ id, path, label, Icon }) => {
                const primaryPaths = ['/', '/catalog', '/cart', '/favorites'];
                const onPrimaryPath = primaryPaths.some(p =>
                    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
                );
                const isActive = id === 'home'
                    ? location.pathname === '/'
                    : id === 'more'
                    ? location.pathname.startsWith('/menu') || !onPrimaryPath
                    : location.pathname.startsWith(path);
                const badge = id === 'cart' ? cartCount : id === 'favorites' ? wishlistCount : 0;
                const usesAnimatedIcon = id === 'cart' || id === 'favorites';

                return (
                    <motion.button
                        key={id}
                        onClick={() => {
                            haptic('select');
                            navigate(path);
                        }}
                        whileTap={{ scale: 0.80 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            flex: 1,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'flex-end',
                            paddingTop: 10, paddingBottom: 6,
                            gap: 3, background: 'none', border: 'none',
                            cursor: 'pointer', position: 'relative',
                            WebkitTapHighlightColor: 'transparent',
                            minHeight: 52,
                        }}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="tab-pill"
                                style={{
                                    position: 'absolute', top: 5,
                                    width: 48, height: 30, borderRadius: 15,
                                    background: 'rgba(0,122,255,0.10)',
                                }}
                                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                            />
                        )}
                        {usesAnimatedIcon ? (
                            <AnimatedTabIcon
                                Icon={Icon}
                                isActive={isActive}
                                count={badge}
                                color={c.text4}
                            />
                        ) : (
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <Icon
                                    size={22}
                                    style={{
                                        color: isActive ? '#007AFF' : c.text4,
                                        strokeWidth: isActive ? 2.2 : 1.8,
                                        transition: 'color 0.15s',
                                    }}
                                />
                            </div>
                        )}
                        <span style={{
                            fontSize: 10, fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#007AFF' : c.text4,
                            transition: 'color 0.15s', zIndex: 1,
                        }}>
                            {label}
                        </span>
                    </motion.button>
                );
            })}
        </nav>
    );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────
function MobileSearchOverlay({ open, onClose }) {
    const navigate = useNavigate();
    const { colors: c } = useTheme();
    const { activeProducts } = useProducts();
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Auto-focus when opened
    useEffect(() => {
        if (open) {
            setQuery('');
            const t = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
    }, [open]);

    // ESC key closes overlay
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const filtered = query.trim()
        ? activeProducts.filter(p => {
            const q = query.trim().toLowerCase();
            return (
                p.title?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q)
            );
        }).slice(0, 20)
        : [];

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 298,
                            background: 'rgba(0,0,0,0.50)',
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
                        exit={{ y: -10, opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 0.8, 1] } }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0,
                            zIndex: 300,
                            background: c.surface,
                            borderRadius: '0 0 24px 24px',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                            paddingBottom: 12,
                            fontFamily: SF,
                            direction: 'rtl',
                            maxHeight: '80dvh',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Search bar row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '0 12px 12px',
                            borderBottom: `0.5px solid ${c.divider}`,
                        }}>
                            <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                                background: c.input, borderRadius: 12,
                                padding: '10px 12px',
                            }}>
                                <Search size={16} color={c.text4} strokeWidth={2} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="חפש מוצרים..."
                                    style={{
                                        flex: 1, background: 'none', border: 'none',
                                        outline: 'none', fontSize: 15, color: c.text,
                                        fontFamily: SF, direction: 'rtl',
                                    }}
                                />
                                {query.length > 0 && (
                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => setQuery('')}
                                        style={{
                                            background: c.text4, border: 'none', borderRadius: 99,
                                            width: 16, height: 16, padding: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', flexShrink: 0,
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        <X size={10} color="#fff" strokeWidth={2.5} />
                                    </motion.button>
                                )}
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={onClose}
                                style={{
                                    background: 'none', border: 'none',
                                    fontSize: 15, fontWeight: 600, color: '#007AFF',
                                    cursor: 'pointer', padding: '4px 2px',
                                    WebkitTapHighlightColor: 'transparent',
                                    fontFamily: SF, flexShrink: 0,
                                }}
                            >
                                ביטול
                            </motion.button>
                        </div>

                        {/* Results */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {!query.trim() ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '32px 16px',
                                    color: c.text4, fontSize: 14, fontWeight: 500,
                                }}>
                                    הקלד לחיפוש...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '32px 16px', gap: 8,
                                }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(142,142,147,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Search size={24} color="#8E8E93" strokeWidth={1.8} />
                                    </div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: c.text3, margin: 0 }}>לא נמצאו מוצרים</p>
                                    <p style={{ fontSize: 12, color: c.text4, margin: 0 }}>נסה מילת חיפוש אחרת</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {filtered.map((product, i) => {
                                        const displayPrice = product.salePrice || product.price;
                                        return (
                                            <motion.button
                                                key={product.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03, duration: 0.15 }}
                                                whileTap={{ scale: 0.98, background: c.input }}
                                                onClick={() => {
                                                    haptic('select');
                                                    navigate(`/catalog/${product.id}`);
                                                    onClose();
                                                }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    padding: '10px 14px',
                                                    background: 'none', border: 'none',
                                                    borderBottom: `0.5px solid ${c.divider}`,
                                                    cursor: 'pointer', direction: 'rtl',
                                                    WebkitTapHighlightColor: 'transparent',
                                                    fontFamily: SF, width: '100%',
                                                    textAlign: 'right',
                                                }}
                                            >
                                                {/* Thumbnail */}
                                                <div style={{
                                                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                                                    background: c.bg, overflow: 'hidden',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: `0.5px solid ${c.border}`,
                                                }}>
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.title}
                                                            style={{ width: '88%', height: '88%', objectFit: 'contain' }}
                                                        />
                                                    ) : (
                                                        <Monitor size={18} color="#8E8E93" strokeWidth={1.5} style={{ opacity: 0.5 }} />
                                                    )}
                                                </div>

                                                {/* Text */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {product.category && (
                                                        <p style={{ fontSize: 10, fontWeight: 600, color: '#007AFF', margin: '0 0 2px' }}>
                                                            {product.category}
                                                        </p>
                                                    )}
                                                    <p style={{
                                                        fontSize: 13, fontWeight: 600, color: c.text,
                                                        margin: '0 0 3px', lineHeight: 1.3,
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    }}>
                                                        {product.title}
                                                    </p>
                                                    {displayPrice && (
                                                        <p style={{ fontSize: 13, fontWeight: 800, color: product.salePrice ? '#FF3B30' : c.text, margin: 0 }}>
                                                            ₪{displayPrice.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>

                                                <ChevronRight size={16} color={c.text4} strokeWidth={2} style={{ flexShrink: 0, transform: 'rotate(180deg)' }} />
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function MobileHeader({ onSearch, onMenu }) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { getSetting } = useSettings();
    const { colors: c, isDark } = useTheme();
    const { cartCount }  = useCart();
    const { user, tierColor, openAuthModal } = useAuth();
    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');

    const [hidden,  setHidden]  = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, 'change', (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 80) setHidden(true);
        else setHidden(false);
        setScrolled(latest > 40);
    });

    const navLinks = MOBILE_NAV_DEFS
        .filter(n => getSetting(n.settingKey, true) !== false)
        .map(n => ({ ...n, label: getSetting(n.labelKey, n.defaultLabel) }));

    const activeNav = navLinks.find(({ id, path }) =>
        id === 'home' ? location.pathname === '/' : location.pathname.startsWith(path)
    );

    const pillStyle = {
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: 12, right: 12, zIndex: 200,
        background: scrolled
            ? (isDark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.88)')
            : (isDark ? 'rgba(28,28,30,0.55)' : 'rgba(255,255,255,0.55)'),
        backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'blur(10px) saturate(1.5)',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'blur(10px) saturate(1.5)',
        borderRadius: 28,
        border: scrolled
            ? `1px solid ${isDark ? 'rgba(70,70,80,0.55)' : 'rgba(200,200,210,0.55)'}`
            : `1px solid ${isDark ? 'rgba(70,70,80,0.30)' : 'rgba(210,210,220,0.35)'}`,
        boxShadow: scrolled
            ? '0 20px 60px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.14)'
            : '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.10)',
        direction: 'rtl', fontFamily: SF,
        display: 'flex', alignItems: 'center',
        height: HEADER_H, padding: '0 6px',
        willChange: 'transform',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
    };

    return (
        <>
            <motion.header
                variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: '-150%', opacity: 0 } }}
                animate={hidden ? 'hidden' : 'visible'}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                style={pillStyle}
            >
                {/* RIGHT: Logo */}
                <motion.div whileTap={{ scale: 0.95 }} onClick={() => { haptic('select'); navigate('/'); setNavOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}>
                    {siteLogo ? (
                        <img src={siteLogo} alt={siteName} style={{ height: 24, objectFit: 'contain' }} />
                    ) : (
                        <>
                            <svg width={20} height={20} viewBox="0 0 32 32" fill="none">
                                <circle cx={12} cy={16} r={9} stroke={c.text} strokeWidth={2} />
                                <circle cx={20} cy={16} r={9} stroke="#007AFF" strokeWidth={2} fill="#007AFF" fillOpacity={0.15} />
                            </svg>
                            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.04em', color: c.text, whiteSpace: 'nowrap' }}>
                                {siteName}
                            </span>
                        </>
                    )}
                </motion.div>

                {/* CENTER: "אפשרויות" dropdown trigger */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.button
                        whileTap={{ scale: 0.91 }}
                        onClick={() => { haptic('select'); setNavOpen(o => !o); }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 13px', borderRadius: 99,
                            background: navOpen ? 'rgba(0,122,255,0.12)' : 'rgba(0,0,0,0.04)',
                            border: navOpen ? '1px solid rgba(0,122,255,0.28)' : '1px solid transparent',
                            color: navOpen ? '#007AFF' : c.text,
                            fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: SF,
                            WebkitTapHighlightColor: 'transparent',
                            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {activeNav ? activeNav.label : 'אפשרויות'}
                        <motion.svg
                            width={10} height={10} viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth={2.5}
                            animate={{ rotate: navOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <path d="M19 9l-7 7-7-7" />
                        </motion.svg>
                    </motion.button>
                </div>

                {/* LEFT: Action icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => { haptic('select'); navigate('/cart'); setNavOpen(false); }}
                        aria-label="עגלה"
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', position: 'relative' }}>
                        <ShoppingBag size={18} color={c.text3} strokeWidth={1.8} />
                        {cartCount > 0 && (
                            <motion.span key={cartCount} initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                                style={{ position: 'absolute', top: 3, right: 3, background: '#007AFF', color: '#fff', borderRadius: 99, minWidth: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, border: '1.5px solid white', padding: '0 2px' }}>
                                {cartCount > 9 ? '9+' : cartCount}
                            </motion.span>
                        )}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => { haptic('select'); onSearch?.(); setNavOpen(false); }}
                        aria-label="חיפוש"
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                        <Search size={18} color={c.text3} strokeWidth={2} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => { haptic('select'); navigate('/favorites'); setNavOpen(false); }}
                        aria-label="מועדפים"
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                        <Heart size={18} color={c.text3} strokeWidth={1.8} />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => { haptic('select'); openAuthModal(); setNavOpen(false); }}
                        aria-label={user ? 'פרופיל' : 'כניסה'}
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                        {user ? (
                            <div style={{ width: 22, height: 22, borderRadius: 99, background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                            </div>
                        ) : (
                            <UserCircle size={18} color={c.text3} strokeWidth={1.8} />
                        )}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => { haptic('select'); onMenu?.(); setNavOpen(false); }}
                        aria-label="תפריט"
                        style={{ width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                        <Menu size={18} color={c.text3} strokeWidth={2} />
                    </motion.button>
                </div>
            </motion.header>

            {/* Nav dropdown — appears just below the pill */}
            <AnimatePresence>
                {navOpen && (
                    <>
                        <motion.div
                            key="nav-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => setNavOpen(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 198 }}
                        />
                        <motion.div
                            key="nav-dropdown"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                            style={{
                                position: 'fixed',
                                top: 'calc(env(safe-area-inset-top, 0px) + 72px)',
                                left: 12, right: 12,
                                zIndex: 199,
                                background: isDark ? 'rgba(28,28,30,0.97)' : 'rgba(255,255,255,0.97)',
                                backdropFilter: 'blur(20px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                                borderRadius: 22,
                                border: isDark ? '1px solid rgba(70,70,80,0.55)' : '1px solid rgba(200,200,210,0.55)',
                                boxShadow: '0 12px 48px rgba(0,0,0,0.16)',
                                padding: '6px',
                                direction: 'rtl', fontFamily: SF,
                            }}
                        >
                            {navLinks.map(({ id, path, label }) => {
                                const isActive = id === 'home'
                                    ? location.pathname === '/'
                                    : location.pathname === path || location.pathname.startsWith(path + '/');
                                return (
                                    <motion.button
                                        key={path}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => { haptic('select'); navigate(path); setNavOpen(false); }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '13px 16px', borderRadius: 16,
                                            background: isActive ? 'rgba(0,122,255,0.10)' : 'transparent',
                                            border: 'none', cursor: 'pointer',
                                            color: isActive ? '#007AFF' : c.text,
                                            fontSize: 15, fontWeight: isActive ? 700 : 500,
                                            WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                                            textAlign: 'right',
                                        }}
                                    >
                                        <span>{label}</span>
                                        {isActive && (
                                            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#007AFF', flexShrink: 0 }} />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Route order for direction-aware transitions (higher index = deeper in hierarchy)
const ROUTE_ORDER = ['/', '/catalog', '/catalog/:id', '/cart', '/checkout', '/favorites', '/discover', '/innovation', '/contact', '/story', '/vod', '/magazine', '/menu', '/compare', '/privacy', '/terms', '/membership'];

function getRouteIndex(pathname) {
    if (pathname.startsWith('/catalog/')) return 2;
    const i = ROUTE_ORDER.indexOf(pathname);
    return i === -1 ? 5 : i;
}

// ─── Mobile Menu Overlay (3-bar hamburger) ───────────────────────────────────
const MENU_LINKS = [
    { path: '/',          label: 'דף הבית',        Icon: Home },
    { path: '/catalog',   label: 'קטלוג מוצרים',   Icon: Monitor },
    { path: '/discover',  label: 'גלה פתרונות',    Icon: Compass },
    { path: '/story',     label: 'הסיפור שלנו',    Icon: BookOpen },
    { path: '/innovation',label: 'חדשנות',          Icon: Zap },
    { path: '/vod',       label: 'מרכז הדרכה',     Icon: GraduationCap },
    { path: '/magazine',  label: 'מגזין',           Icon: Newspaper },
    { path: '/contact',   label: 'צור קשר',         Icon: MessageCircle },
    { path: '/membership',label: 'מועדון NextClass', Icon: Star },
    { path: '/compare',   label: 'השוואת מוצרים',  Icon: Scale },
];

function MobileMenuOverlay({ open, onClose }) {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { colors: c } = useTheme();
    const { getSetting } = useSettings();
    const { user, tierLabel, tierColor, openAuthModal } = useAuth();
    const siteName = getSetting('site_name', 'NextClass');
    const phone    = getSetting('contact_phone', '058-5856356');

    const go = (path) => {
        haptic('select');
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        key="overlay-bg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.22 } }}
                        exit={{ opacity: 0, transition: { duration: 0.18 } }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.55)' }}
                    />
                    <motion.div
                        key="overlay-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0, transition: { duration: 0.26, ease: [0.32, 0.72, 0, 1] } }}
                        exit={{ x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 0.8, 1] } }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: '82vw', maxWidth: 340, zIndex: 491,
                            background: c.surface,
                            boxShadow: '-20px 0 80px rgba(0,0,0,0.22)',
                            display: 'flex', flexDirection: 'column',
                            direction: 'rtl', fontFamily: SF,
                            paddingTop: 'env(safe-area-inset-top, 16px)',
                            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => { haptic('light'); onClose(); }}
                                style={{ width: 36, height: 36, borderRadius: 99, background: c.input, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                            >
                                <X size={16} color={c.text3} strokeWidth={2.5} />
                            </motion.button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>N</span>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: 17, color: c.text, letterSpacing: '-0.03em' }}>{siteName}</span>
                            </div>
                        </div>

                        {/* User tile */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { openAuthModal(); onClose(); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                margin: '0 12px 8px', padding: '14px',
                                background: user ? `${tierColor}14` : c.input,
                                borderRadius: 18, border: 'none', cursor: 'pointer',
                                direction: 'rtl', WebkitTapHighlightColor: 'transparent',
                                textAlign: 'right',
                            }}
                        >
                            {user ? (
                                <div style={{ width: 44, height: 44, borderRadius: 99, background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                                </div>
                            ) : (
                                <div style={{ width: 44, height: 44, borderRadius: 99, background: c.shimmerA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <UserCircle size={24} color={c.text4} />
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user ? (user.displayName || user.email) : 'כניסה / הרשמה'}
                                </p>
                                <p style={{ fontSize: 12, color: user ? tierColor : c.text3, margin: '2px 0 0', fontWeight: user ? 700 : 400 }}>
                                    {user ? `דרג ${tierLabel}` : 'לחברי מועדון — הנחות בלעדיות'}
                                </p>
                            </div>
                            <ChevronRight size={16} color={c.text4} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
                        </motion.button>

                        {/* Nav links */}
                        <div style={{ flex: 1, padding: '4px 12px' }}>
                            {MENU_LINKS.map(({ path, label, Icon }, i) => {
                                const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                                return (
                                    <motion.button
                                        key={path}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => go(path)}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.02, duration: 0.16 } }}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 14, border: 'none',
                                            background: isActive ? 'rgba(0,122,255,0.08)' : 'transparent',
                                            cursor: 'pointer', textAlign: 'right', direction: 'rtl',
                                            WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                                            marginBottom: 2,
                                        }}
                                    >
                                        <div style={{ width: 32, height: 32, borderRadius: 9, background: isActive ? 'rgba(0,122,255,0.12)' : c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} color={isActive ? '#007AFF' : c.text3} strokeWidth={1.8} />
                                        </div>
                                        <span style={{ fontSize: 16, fontWeight: isActive ? 700 : 500, color: isActive ? '#007AFF' : c.text, flex: 1 }}>{label}</span>
                                        {isActive && <span style={{ width: 6, height: 6, borderRadius: 99, background: '#007AFF', flexShrink: 0 }} />}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer quick actions */}
                        <div style={{ padding: '12px 12px 8px', borderTop: `0.5px solid ${c.divider}` }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <motion.a
                                    whileTap={{ scale: 0.93 }}
                                    href={`tel:${phone}`}
                                    style={{ flex: 1, height: 48, borderRadius: 14, background: 'rgba(52,199,89,0.10)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', textDecoration: 'none', color: '#34C759', fontWeight: 700, fontSize: 14, fontFamily: SF }}
                                >
                                    <Phone size={17} color="#34C759" />
                                    חייג
                                </motion.a>
                                <motion.button
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => go('/favorites')}
                                    style={{ flex: 1, height: 48, borderRadius: 14, background: 'rgba(255,45,85,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: '#FF2D55', fontWeight: 700, fontSize: 14, fontFamily: SF, WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <Heart size={17} color="#FF2D55" />
                                    מועדפים
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Unified Smart Concierge (AI + WhatsApp + Phone + Accessibility) ─────────
function MobileSmartConcierge() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const { firstName, timeGreeting } = useAuth();
    const { activeProducts } = useProducts();
    const [open, setOpen]     = useState(false);
    const [tab, setTab]       = useState('ai'); // 'ai' | 'wa' | 'phone' | 'a11y'
    const [input, setInput]   = useState('');
    const [msgs, setMsgs]     = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [a11y, setA11y]   = useState(() => {
        try { return JSON.parse(localStorage.getItem('nc_a11y') || '{}'); } catch { return {}; }
    });
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    const rawPhone  = getSetting('whatsapp_number', '972585856356');
    const phone     = rawPhone.replace(/\D/g, '');
    const callPhone = getSetting('contact_phone', '058-5856356');
    const baseGreeting = getSetting('ai_greeting', 'שלום! אני כאן לעזור לך לבחור את הפתרון הטכנולוגי המושלם לכיתה שלך.');
    const greeting  = firstName
        ? `היי ${firstName}! ${timeGreeting.word}. ${baseGreeting}`
        : baseGreeting;
    const botName   = getSetting('ai_title', 'NextClass AI');
    const botRole   = getSetting('ai_role', 'Institutional Concierge');
    const thinkMsg  = getSetting('ai_thinking', 'מעבד את בקשתך...');
    const chip1     = getSetting('ai_chip1', 'הצעת מחיר');
    const chip2     = getSetting('ai_chip2', 'מפרט טכני');
    const chip3     = getSetting('ai_chip3', 'ייעוץ');
    const waLabel   = getSetting('ai_wa_label', 'מענה אנושי בוואטסאפ');
    const waStatus  = getSetting('ai_wa_status', 'יועץ טכנולוגי זמין כעת');
    const conciergeLabel = getSetting('concierge_label', 'צריכים התייעצות?');

    useEffect(() => { setMsgs([{ role: 'ai', text: greeting }]); }, [greeting]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, isTyping, open]);

    // Focus input when AI tab is open
    useEffect(() => {
        if (open && tab === 'ai') {
            const t = setTimeout(() => inputRef.current?.focus(), 300);
            return () => clearTimeout(t);
        }
    }, [open, tab]);

    const applyA11y = (updates) => {
        const next = { ...a11y, ...updates };
        setA11y(next);
        localStorage.setItem('nc_a11y', JSON.stringify(next));
        const root = document.documentElement;
        root.style.fontSize = next.fontSize ? '118%' : '';
        root.style.filter   = next.contrast ? 'contrast(1.5) brightness(0.92)' : next.grayscale ? 'grayscale(1)' : '';
        if (next.motion) root.style.setProperty('--motion-duration', '0ms');
        else root.style.removeProperty('--motion-duration');
    };

    const send = async (text) => {
        const t = (text ?? input).trim();
        if (!t || isTyping) return;
        const newMsgs = [...msgs, { role: 'user', text: t }];
        setMsgs(newMsgs);
        setInput('');
        setIsTyping(true);
        haptic('medium');
        try {
            const catalogInfo = activeProducts.slice(0, 25).map(p =>
                `${p.id}|${p.title}|${p.category}|₪${p.salePrice ?? p.price ?? 0}|${p.stock > 0 ? 'במלאי' : 'אזל'}`
            ).join('\n');
            const systemPrompt = `אתה NextClass AI — יועץ מכירות מקצועי וחם של חברת NextClass, המספקת טכנולוגיה למוסדות חינוך בישראל.\n\n## אופן עבודה\nשאל שאלה אחת ממוקדת לפני המלצה. לאחר 2-3 תשובות המלץ על מוצרים ספציפיים מהקטלוג.\n\n## כללים\n- ענה בעברית בלבד, 2-3 משפטים\n- אל תציין מספרי ID בתוך הטקסט\n- לאחר הבנת הצורך הוסף בשורה נפרדת: [PRODUCTS: id1,id2]\n\n## קטלוג:\n${catalogInfo}`;
            const history = newMsgs.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
            const res = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, systemPrompt }),
            });
            const data = await res.json();
            const rawText = data.text || 'מצטערים, לא הצלחנו לעבד את הבקשה.';
            const match = rawText.match(/\[PRODUCTS:\s*([^\]]+)\]/);
            const cleanText = rawText.replace(/\[PRODUCTS:[^\]]+\]/g, '').trim();
            setIsTyping(false);
            setMsgs(p => [...p, { role: 'ai', text: cleanText }]);
        } catch {
            setIsTyping(false);
            setMsgs(p => [...p, { role: 'ai', text: 'שגיאת רשת. נסו שוב בעוד רגע.' }]);
        }
    };

    const TABS = [
        { id: 'ai',    label: 'AI', icon: <Bot size={16} /> },
        { id: 'wa',    label: 'WhatsApp', icon: <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
        { id: 'phone', label: 'טלפון', icon: <Phone size={16} /> },
        { id: 'a11y',  label: 'נגישות', icon: <Accessibility size={16} /> },
    ];

    const tabAccent = { ai: '#007AFF', wa: '#25D366', phone: '#34C759', a11y: '#5856D6' };

    return (
        <>
            {/* FAB */}
            <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 1.2 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => { haptic('select'); setOpen(o => !o); }}
                aria-label={conciergeLabel}
                style={{
                    position: 'fixed', bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))',
                    right: 16, zIndex: 150,
                    width: 52, height: 52, borderRadius: 26,
                    background: open ? '#1D1D1F' : 'linear-gradient(135deg, #007AFF, #5856D6)',
                    color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: open ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,122,255,0.5)',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    transition: 'background 0.22s, box-shadow 0.22s',
                    fontFamily: SF,
                }}
            >
                <AnimatePresence mode="popLayout">
                    <motion.div key={open ? 'x' : 'chat'}
                        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.18 }}>
                        {open ? <X size={22} /> : <MessageCircle size={22} />}
                    </motion.div>
                </AnimatePresence>
            </motion.button>

            {/* Bottom sheet */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.50)', zIndex: 160 }}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                            style={{
                                position: 'fixed',
                                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                                left: 0, right: 0, zIndex: 161,
                                background: c.surface, borderRadius: '24px 24px 0 0',
                                height: '72dvh', display: 'flex', flexDirection: 'column',
                                boxShadow: '0 -8px 48px rgba(0,0,0,0.2)',
                                fontFamily: SF, direction: 'rtl',
                            }}
                        >
                            {/* Handle */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                                <div style={{ width: 36, height: 4, borderRadius: 2, background: c.divider }} />
                            </div>

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px' }}>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setOpen(false)}
                                    style={{ background: c.bg, border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                                    <X size={16} color={c.text4} />
                                </motion.button>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{getSetting('concierge_header', 'דברו איתנו')}</p>
                                    <p style={{ fontSize: 11, color: c.text4 }}>{conciergeLabel}</p>
                                </div>
                                <div style={{ width: 32 }} />
                            </div>

                            {/* Tab bar */}
                            <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px' }}>
                                {TABS.map(t => (
                                    <motion.button key={t.id} whileTap={{ scale: 0.93 }}
                                        onClick={() => { haptic('select'); setTab(t.id); }}
                                        style={{
                                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            padding: '9px 6px', borderRadius: 14, border: 'none', cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent', transition: 'background 0.18s',
                                            background: tab === t.id ? `${tabAccent[t.id]}15` : c.bg,
                                            color: tab === t.id ? tabAccent[t.id] : c.text4,
                                        }}>
                                        {t.icon}
                                        <span style={{ fontSize: 9, fontWeight: 700 }}>{t.label}</span>
                                        {tab === t.id && <motion.div layoutId="tab-underline" style={{ width: 16, height: 2, borderRadius: 1, background: tabAccent[t.id] }} />}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Tab content */}
                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                <AnimatePresence mode="wait">
                                    <motion.div key={tab}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.16 }}
                                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                    >
                                        {/* ── AI Tab ── */}
                                        {tab === 'ai' && (
                                            <>
                                                <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `0.5px solid ${c.divider}` }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Bot size={18} color="#fff" />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{botName}</p>
                                                        <p style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>● {botRole}</p>
                                                    </div>
                                                </div>
                                                {/* Quick chips */}
                                                <div style={{ display: 'flex', gap: 6, padding: '10px 14px 0', flexWrap: 'wrap' }}>
                                                    {[chip1, chip2, chip3].map(chip => (
                                                        <motion.button key={chip} whileTap={{ scale: 0.92 }}
                                                            onClick={() => send(chip)}
                                                            style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.15)', borderRadius: 99, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                                                            {chip}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    {msgs.map((m, i) => (
                                                        <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
                                                            <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px', background: m.role === 'user' ? '#007AFF' : c.bg, color: m.role === 'user' ? '#fff' : c.text, fontSize: 14, lineHeight: 1.5, border: m.role !== 'user' ? `0.5px solid ${c.border}` : 'none' }}>
                                                                {m.text}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {isTyping && (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 4px 18px', background: c.bg, border: `0.5px solid ${c.border}`, display: 'flex', gap: 4, alignItems: 'center' }}>
                                                                {[0,1,2].map(i => (
                                                                    <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                                                                        style={{ width: 6, height: 6, borderRadius: 3, background: c.text4 }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div ref={bottomRef} />
                                                </div>
                                                <div style={{ padding: '10px 12px 12px', display: 'flex', gap: 8, borderTop: `0.5px solid ${c.divider}` }}>
                                                    <input
                                                        ref={inputRef}
                                                        value={input}
                                                        onChange={e => setInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && !isTyping && send(input)}
                                                        placeholder={getSetting('ai_placeholder', 'שאל אותי על מוצרים...')}
                                                        inputMode="text"
                                                        autoComplete="off"
                                                        autoCorrect="off"
                                                        disabled={isTyping}
                                                        style={{ flex: 1, background: c.input, border: 'none', borderRadius: 12, padding: '11px 14px', fontSize: 16, color: c.text, outline: 'none', direction: 'rtl', fontFamily: SF, WebkitUserSelect: 'text', userSelect: 'text' }}
                                                    />
                                                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => send(input)}
                                                        disabled={isTyping || !input.trim()}
                                                        style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: input.trim() && !isTyping ? '#007AFF' : c.input, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'background 0.18s' }}>
                                                        <Send size={16} color={input.trim() && !isTyping ? '#fff' : c.text4} />
                                                    </motion.button>
                                                </div>
                                            </>
                                        )}

                                        {/* ── WhatsApp Tab ── */}
                                        {tab === 'wa' && (
                                            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                <div style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', borderRadius: 20, padding: '24px 20px', textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                                        <svg width={32} height={32} viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                    </div>
                                                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{waLabel}</h3>
                                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 18 }}>{waStatus}</p>
                                                    <motion.a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" whileTap={{ scale: 0.96 }}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
                                                        {getSetting('contact_wa_btn', 'התחל שיחה עכשיו')}
                                                    </motion.a>
                                                </div>
                                                <div style={{ background: c.surface, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: c.cardShadow }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#34C759', flexShrink: 0 }} />
                                                    <p style={{ fontSize: 13, color: c.text2, fontWeight: 600 }}>{getSetting('phone_sub', "זמין א'–ה', 9:00–18:00")}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Phone Tab ── */}
                                        {tab === 'phone' && (
                                            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                <div style={{ background: 'linear-gradient(135deg, #34C759, #30B052)', borderRadius: 20, padding: '24px 20px', textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                                        <Phone size={32} color="white" />
                                                    </div>
                                                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{getSetting('phone_label', 'שיחה עם מומחה')}</h3>
                                                    <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 18 }}>{callPhone}</p>
                                                    <motion.a href={`tel:${callPhone.replace(/\D/g,'')}`} whileTap={{ scale: 0.96 }}
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
                                                        <Phone size={16} /> התקשר עכשיו
                                                    </motion.a>
                                                </div>
                                                <div style={{ background: c.surface, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: c.cardShadow }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 4, background: '#34C759', flexShrink: 0 }} />
                                                    <p style={{ fontSize: 13, color: c.text2, fontWeight: 600 }}>{getSetting('pd_support_wa_value', 'זמינים 9:00–21:00')}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Accessibility Tab ── */}
                                        {tab === 'a11y' && (
                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', boxShadow: c.cardShadow }}>
                                                    <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${c.divider}` }}>
                                                        <p style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{getSetting('a11y_widget_title', 'מרכז נגישות')}</p>
                                                        <p style={{ fontSize: 12, color: c.text3 }}>{getSetting('a11y_widget_subtitle', 'התאם את חוויית הגלישה שלך')}</p>
                                                    </div>
                                                    {[
                                                        { key: 'fontSize',  label: getSetting('a11y_font_label', 'גודל גופן גדול'), Icon: Type },
                                                        { key: 'contrast',  label: getSetting('a11y_contrast_label', 'ניגוד גבוה'),      Icon: Sun },
                                                        { key: 'motion',    label: getSetting('a11y_motion_label', 'ביטול אנימציות'),   Icon: PauseCircle },
                                                        { key: 'grayscale', label: getSetting('a11y_grayscale_label', 'גווני אפור'),     Icon: Square },
                                                    ].map(({ key, label, Icon }) => (
                                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `0.5px solid ${c.divider}` }}>
                                                            <motion.button whileTap={{ scale: 0.92 }}
                                                                onClick={() => applyA11y({ [key]: !a11y[key] })}
                                                                style={{
                                                                    width: 46, height: 26, borderRadius: 13,
                                                                    background: a11y[key] ? '#5856D6' : c.bg,
                                                                    border: `1.5px solid ${a11y[key] ? '#5856D6' : c.border}`,
                                                                    position: 'relative', cursor: 'pointer',
                                                                    transition: 'background 0.2s, border-color 0.2s',
                                                                    WebkitTapHighlightColor: 'transparent',
                                                                }}>
                                                                <motion.div
                                                                    animate={{ x: a11y[key] ? 20 : 2 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                                                    style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
                                                                />
                                                            </motion.button>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{label}</span>
                                                                <div style={{ width: 28, height: 28, borderRadius: 8, background: a11y[key] ? 'rgba(88,86,214,0.12)' : c.input, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <Icon size={14} color={a11y[key] ? '#5856D6' : c.text3} strokeWidth={1.8} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => applyA11y({ fontSize: false, contrast: false, motion: false, grayscale: false })}
                                                        style={{ width: '100%', padding: '14px', background: 'none', border: 'none', color: '#FF3B30', fontSize: 13, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                                                        {getSetting('a11y_reset_label', 'איפוס הגדרות נגישות')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Theme color meta updater ─────────────────────────────────────────────────
function ThemeColorSync() {
    const { colors: c, isDark } = useTheme();
    useEffect(() => {
        const metas = document.querySelectorAll('meta[name="theme-color"]');
        const color = isDark ? '#000000' : '#ffffff';
        metas.forEach(m => m.setAttribute('content', color));
    }, [isDark, c]);
    return null;
}

// ─── Pull-to-refresh ──────────────────────────────────────────────────────────
function PullToRefresh({ scrollRef }) {
    // Keep visual state separate from gesture tracking refs
    const [visual, setVisual] = useState({ pullY: 0, refreshing: false });
    const startY      = useRef(null);
    const pullYRef    = useRef(0);
    const refreshing  = useRef(false);
    const rafRef      = useRef(null);
    const THRESHOLD   = 72;

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onStart = (e) => {
            // Use window.scrollY — the div itself doesn't scroll, the window does
            if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
        };
        const onMove = (e) => {
            if (startY.current === null || refreshing.current) return;
            // Cancel pull if user has scrolled away from top
            if (window.scrollY > 2) { startY.current = null; pullYRef.current = 0; return; }
            const delta = e.touches[0].clientY - startY.current;
            if (delta > 0) {
                e.preventDefault();
                const next = Math.min(delta * 0.4, THRESHOLD + 20);
                pullYRef.current = next;
                // Throttle setState to animation frames — never on every pixel
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(() => {
                    setVisual({ pullY: next, refreshing: false });
                });
            }
        };
        const onEnd = () => {
            if (pullYRef.current >= THRESHOLD && !refreshing.current) {
                refreshing.current = true;
                setVisual({ pullY: THRESHOLD, refreshing: true });
                haptic('medium');
                setTimeout(() => window.location.reload(), 800);
            } else {
                pullYRef.current = 0;
                setVisual({ pullY: 0, refreshing: false });
            }
            startY.current = null;
        };
        const onCancel = () => {
            startY.current = null;
            pullYRef.current = 0;
            if (!refreshing.current) setVisual({ pullY: 0, refreshing: false });
        };

        el.addEventListener('touchstart',  onStart,  { passive: true });
        el.addEventListener('touchmove',   onMove,   { passive: false });
        el.addEventListener('touchend',    onEnd,    { passive: true });
        el.addEventListener('touchcancel', onCancel, { passive: true });
        return () => {
            el.removeEventListener('touchstart',  onStart);
            el.removeEventListener('touchmove',   onMove);
            el.removeEventListener('touchend',    onEnd);
            el.removeEventListener('touchcancel', onCancel);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [scrollRef]); // ← attached once, never re-attached on state changes

    const { pullY, refreshing: isRefreshing } = visual;
    if (pullY <= 0 && !isRefreshing) return null;

    const progress = Math.min(pullY / THRESHOLD, 1);

    return (
        <motion.div
            animate={{ y: isRefreshing ? THRESHOLD : pullY, opacity: isRefreshing ? 1 : progress }}
            transition={isRefreshing ? { type: 'spring', stiffness: 300, damping: 28 } : { duration: 0 }}
            style={{
                position: 'absolute', top: HEADER_TOTAL, left: 0, right: 0, zIndex: 190,
                display: 'flex', justifyContent: 'center', pointerEvents: 'none',
            }}
        >
            <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: progress * 270 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
                style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: '#fff',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <circle cx={8} cy={8} r={6} stroke="#007AFF" strokeWidth={2} strokeDasharray="37.7" strokeDashoffset={37.7 * (1 - (isRefreshing ? 0.75 : progress))} strokeLinecap="round" style={{ transformOrigin: '8px 8px', transform: 'rotate(-90deg)' }} />
                </svg>
            </motion.div>
        </motion.div>
    );
}

// Tab paths in order for swipe navigation (RTL: swipe right = prev, swipe left = next)
const SWIPE_TAB_PATHS = ['/', '/catalog', '/discover', '/cart', '/favorites'];

// ─── Inner app (needs ThemeProvider in scope) ─────────────────────────────────
function MobileAppInner() {
    const location = useLocation();
    const navigate  = useNavigate();
    const { colors: c } = useTheme();
    const hideBottomNav = location.pathname === '/checkout';
    const hideHeader    = location.pathname === '/checkout';
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen,   setMenuOpen]   = useState(false);
    const prevPathRef   = useRef(location.pathname);
    const currentIdx    = getRouteIndex(location.pathname);
    const prevIdx       = getRouteIndex(prevPathRef.current);
    const direction     = currentIdx >= prevIdx ? 1 : -1;

    const scrollRef = useRef(null);

    useEffect(() => { prevPathRef.current = location.pathname; }, [location.pathname]);

    // ─── Swipe between tabs ───────────────────────────────────────────────────
    // Use a ref for pathname so the listener is attached only once (navigate is stable)
    const pathnameRef   = useRef(location.pathname);
    const touchStartRef = useRef(null);
    useEffect(() => { pathnameRef.current = location.pathname; }, [location.pathname]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onTouchStart = (e) => {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const onTouchEnd = (e) => {
            if (!touchStartRef.current) return;
            const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
            const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
            touchStartRef.current = null;

            if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
                const currentTabIdx = SWIPE_TAB_PATHS.indexOf(pathnameRef.current);
                if (currentTabIdx === -1) return;
                // RTL: swipe right (dx > 0) = go to previous tab, swipe left (dx < 0) = next tab
                if (dx > 0 && currentTabIdx > 0) {
                    haptic('select');
                    navigate(SWIPE_TAB_PATHS[currentTabIdx - 1]);
                } else if (dx < 0 && currentTabIdx < SWIPE_TAB_PATHS.length - 1) {
                    haptic('select');
                    navigate(SWIPE_TAB_PATHS[currentTabIdx + 1]);
                }
            }
        };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchend',   onTouchEnd,   { passive: true });
        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchend',   onTouchEnd);
        };
    }, [navigate]); // ← navigate is stable, listener attached once

    const slideVariants = {
        initial: (dir) => ({ x: dir > 0 ? '30%' : '-30%', opacity: 0 }),
        animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 } },
        exit: (dir) => ({ x: dir > 0 ? '-12%' : '12%', opacity: 0, transition: { duration: 0.14, ease: [0.32, 0, 0.67, 0] } }),
    };

    return (
        <div ref={scrollRef} dir="rtl" style={{
            minHeight: '100dvh',
            background: c.bg,
            fontFamily: SF,
            overflowX: 'hidden',
            paddingTop: hideHeader ? 0 : `calc(${HEADER_TOTAL}px + 16px)`,
            paddingBottom: hideBottomNav ? 0 : 'calc(64px + env(safe-area-inset-bottom, 0px))',
            colorScheme: 'auto',
            position: 'relative',
        }}>
            <ThemeColorSync />
            <MobileAnalytics />
            <RouteEffects />
            {!hideHeader && <MobileHeader onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} />}
            {!hideHeader && <PullToRefresh scrollRef={scrollRef} />}
            {!hideHeader && (
                <div style={{ position: 'sticky', top: HEADER_TOTAL, zIndex: 199 }}>
                    <AnnouncementBar />
                    <MemberBar />
                </div>
            )}
            <OfflineBanner />

            <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                    key={location.pathname}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    style={{ willChange: 'transform' }}
                >
                    <Suspense fallback={
                        <div style={{ minHeight: '60vh', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                                style={{ width: 28, height: 28, borderRadius: 99, border: `3px solid ${c.divider}`, borderTopColor: '#007AFF' }}
                            />
                        </div>
                    }>
                        <Routes location={location}>
                            <Route path="/"            element={<MobileLanding />} />
                            <Route path="/catalog"     element={<MobileCatalog />} />
                            <Route path="/catalog/:id" element={<MobileProduct />} />
                            <Route path="/cart"        element={<MobileCart />} />
                            <Route path="/checkout"    element={<MobileCheckout />} />
                            <Route path="/favorites"   element={<MobileFavorites />} />
                            <Route path="/contact"     element={<MobileContact />} />
                            <Route path="/story"       element={<MobileAbout />} />
                            <Route path="/vod"         element={<MobileVOD />} />
                            <Route path="/magazine"    element={<MobileMagazine />} />
                            <Route path="/menu"        element={<MobileMenu />} />
                            <Route path="/compare"     element={<MobileCompare />} />
                            <Route path="/privacy"     element={<MobilePrivacy />} />
                            <Route path="/terms"       element={<MobileTerms />} />
                            <Route path="/discover"    element={<MobileDiscover />} />
                            <Route path="/innovation"  element={<MobileInnovation />} />
                            <Route path="/membership"  element={<MobileMembership />} />
                            <Route path="*"            element={<MobileLanding />} />
                        </Routes>
                    </Suspense>
                </motion.div>
            </AnimatePresence>

            {!hideBottomNav && <MobileBottomNav />}
            <MobileSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
            <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
            <MobileSmartConcierge />
            <MobileAuthSheet />
            <PersonalizationLayer />
            <CookieConsent />
            <InstallPrompt />
            <UpdateBanner />
        </div>
    );
}

// ─── Global focus rings (keyboard navigation) ─────────────────────────────────
const FOCUS_STYLES = `
*:focus { outline: none; }
*:focus-visible {
    outline: 2px solid #007AFF;
    outline-offset: 2px;
    border-radius: 6px;
}
`;

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function MobileApp() {
    return (
        <ThemeProvider>
            <MotionConfig reducedMotion="user">
                <style>{FOCUS_STYLES}</style>
                <MobileAppInner />
            </MotionConfig>
        </ThemeProvider>
    );
}
