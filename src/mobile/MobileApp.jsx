import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig, useScroll, useTransform } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, Heart, MoreHorizontal, ChevronRight, Search, MessageCircle, X, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductsContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import CookieConsent from '../components/CookieConsent';
import AnnouncementBar from '../components/AnnouncementBar';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { haptic } from './utils/haptic';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import UpdateBanner from './components/UpdateBanner';

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

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

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
    '/discover':   'גלו את הפתרונות',
    '/innovation': 'סיפורי הצלחה',
};

const BOTTOM_TABS = [
    { id: 'home',      path: '/',          label: 'בית',    Icon: Home },
    { id: 'catalog',   path: '/catalog',   label: 'קטלוג',  Icon: Grid3X3 },
    { id: 'cart',      path: '/cart',      label: 'עגלה',   Icon: ShoppingBag },
    { id: 'favorites', path: '/favorites', label: 'שמורים', Icon: Heart },
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
            background: c.navBg,
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            borderTop: `0.5px solid ${c.navBorder}`,
            display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
            paddingBottom: 'env(safe-area-inset-bottom, 10px)',
            fontFamily: SF,
        }}>
            {BOTTOM_TABS.map(({ id, path, label, Icon }) => {
                const isActive = id === 'home'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(path);
                const badge = id === 'cart' ? cartCount : id === 'favorites' ? wishlistCount : 0;

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
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <Icon
                                size={22}
                                style={{
                                    color: isActive ? '#007AFF' : c.text4,
                                    strokeWidth: isActive ? 2.2 : 1.8,
                                    transition: 'color 0.15s',
                                }}
                            />
                            {badge > 0 && (
                                <motion.span
                                    key={badge}
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
                                    {badge > 9 ? '9+' : badge}
                                </motion.span>
                            )}
                        </div>
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
            setTimeout(() => inputRef.current?.focus(), 80);
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
                            background: 'rgba(0,0,0,0.40)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
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
                                    <span style={{ fontSize: 30 }}>🔍</span>
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
                                                        <span style={{ fontSize: 20, opacity: 0.4 }}>🖥️</span>
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
function MobileHeader({ headerBlur, headerBg, onSearch }) {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const { cartCount }  = useCart();
    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');
    const isHome    = location.pathname === '/';
    const isProduct = location.pathname.startsWith('/catalog/');
    const title     = usePageTitle(location.pathname);

    const backdropFilterValue = headerBlur
        ? useTransform(headerBlur, v => `blur(${48 + v}px) saturate(200%)`)
        : 'blur(48px) saturate(200%)';

    return (
        <motion.header style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 200,
            height: 56,
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: c.navBg,
            backdropFilter: backdropFilterValue,
            WebkitBackdropFilter: backdropFilterValue,
            borderBottom: `0.5px solid ${c.navBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            direction: 'rtl', fontFamily: SF,
        }}>
            {!isHome && (
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => { haptic('light'); navigate(-1); }}
                    aria-label="חזרה"
                    style={{
                        position: 'absolute', right: 4,
                        display: 'flex', alignItems: 'center', gap: 2,
                        background: 'none', border: 'none',
                        color: '#007AFF', fontSize: 16, fontWeight: 500,
                        cursor: 'pointer', padding: '8px 10px',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <ChevronRight size={22} strokeWidth={2.2} />
                    {!isProduct && <span style={{ fontSize: 15 }}>חזרה</span>}
                </motion.button>
            )}

            {/* Left actions: search + cart */}
            <div style={{ position: 'absolute', left: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { haptic('select'); onSearch?.(); }}
                    aria-label="חיפוש"
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <Search size={19} color={c.text3} strokeWidth={2} />
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { haptic('select'); navigate('/cart'); }}
                    aria-label="עגלה"
                    style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'none', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        position: 'relative',
                    }}
                >
                    <ShoppingBag size={19} color={c.text3} strokeWidth={2} />
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute', top: 4, right: 4,
                            background: '#FF3B30', color: '#fff',
                            borderRadius: 99, minWidth: 14, height: 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, fontWeight: 800, border: '1.5px solid white',
                            padding: '0 2px',
                        }}>{cartCount > 9 ? '9+' : cartCount}</span>
                    )}
                </motion.button>
            </div>

            {isHome ? (
                <motion.div
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    whileTap={{ scale: 0.95 }}
                >
                    {siteLogo ? (
                        <img src={siteLogo} alt={siteName} style={{ height: 26, objectFit: 'contain' }} />
                    ) : (
                        <>
                            <svg width={22} height={22} viewBox="0 0 32 32" fill="none">
                                <circle cx={12} cy={16} r={9} stroke={c.text} strokeWidth={2} />
                                <circle cx={20} cy={16} r={9} stroke="#007AFF" strokeWidth={2} fill="#007AFF" fillOpacity={0.15} />
                            </svg>
                            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.04em', color: c.text }}>
                                {siteName}
                            </span>
                        </>
                    )}
                </motion.div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <motion.span
                        key={location.pathname}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            fontWeight: 700, fontSize: 16, color: c.text,
                            letterSpacing: '-0.02em',
                            maxWidth: '55%', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </motion.span>
                </AnimatePresence>
            )}
        </motion.header>
    );
}

// Route order for direction-aware transitions (higher index = deeper in hierarchy)
const ROUTE_ORDER = ['/', '/catalog', '/catalog/:id', '/cart', '/checkout', '/favorites', '/discover', '/innovation', '/contact', '/story', '/vod', '/magazine', '/menu', '/compare', '/privacy', '/terms'];

function getRouteIndex(pathname) {
    if (pathname.startsWith('/catalog/')) return 2;
    const i = ROUTE_ORDER.indexOf(pathname);
    return i === -1 ? 5 : i;
}

// ─── Floating WhatsApp ────────────────────────────────────────────────────────
function MobileFloatingWhatsApp() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const rawPhone = getSetting('whatsapp_number', '972585856356');
    const phone    = rawPhone.replace(/\D/g, '');
    const url      = `https://wa.me/${phone}`;

    return (
        <motion.a
            href={url} target="_blank" rel="noopener noreferrer"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 1.2 }}
            whileTap={{ scale: 0.88 }}
            aria-label="WhatsApp"
            style={{
                position: 'fixed', bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
                left: 16, zIndex: 150,
                width: 50, height: 50, borderRadius: 25,
                background: '#25D366', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
                textDecoration: 'none',
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        </motion.a>
    );
}

// ─── Floating AI Assistant ────────────────────────────────────────────────────
function MobileFloatingAI() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const [open, setOpen]   = useState(false);
    const [input, setInput] = useState('');
    const [msgs, setMsgs]   = useState([]);
    const bottomRef = useRef(null);

    const greeting  = getSetting('ai_greeting', 'שלום! אני כאן לעזור לך לבחור את הפתרון הטכנולוגי המושלם לכיתה שלך. מה תרצה לדעת?');
    const botName   = getSetting('ai_title', 'NextClass AI');
    const thinkMsg  = getSetting('ai_thinking', 'מעבד את בקשתך...');

    useEffect(() => { setMsgs([{ role: 'ai', text: greeting }]); }, [greeting]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

    const send = () => {
        if (!input.trim()) return;
        const text = input.trim();
        setInput('');
        setMsgs(p => [...p, { role: 'user', text }]);
        haptic('medium');
        setTimeout(() => setMsgs(p => [...p, { role: 'ai', text: thinkMsg }]), 900);
    };

    return (
        <>
            {/* FAB */}
            <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 1.4 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => { haptic('select'); setOpen(o => !o); }}
                aria-label="עוזר AI"
                style={{
                    position: 'fixed', bottom: 'calc(128px + env(safe-area-inset-bottom, 0px))',
                    left: 16, zIndex: 150,
                    width: 50, height: 50, borderRadius: 25,
                    background: 'linear-gradient(135deg,#007AFF,#5856D6)',
                    color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,122,255,0.45)',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    fontFamily: SF,
                }}
            >
                {open ? <X size={20} /> : <MessageCircle size={20} />}
            </motion.button>

            {/* Chat bottom sheet */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 160, backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
                            style={{
                                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 161,
                                background: c.surface, borderRadius: '20px 20px 0 0',
                                height: '65dvh', display: 'flex', flexDirection: 'column',
                                boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
                                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                                fontFamily: SF, direction: 'rtl',
                            }}
                        >
                            {/* Handle bar */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                                <div style={{ width: 36, height: 4, borderRadius: 2, background: c.divider }} />
                            </div>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 12px', borderBottom: `0.5px solid ${c.divider}` }}>
                                <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageCircle size={16} color="#fff" />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: c.text, lineHeight: 1.2 }}>{botName}</p>
                                    <p style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>● מחובר</p>
                                </div>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setOpen(false)}
                                    style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 6, WebkitTapHighlightColor: 'transparent' }}>
                                    <X size={18} color={c.text4} />
                                </motion.button>
                            </div>
                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {msgs.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
                                        <div style={{
                                            maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                            background: m.role === 'user' ? '#007AFF' : c.bg,
                                            color: m.role === 'user' ? '#fff' : c.text,
                                            fontSize: 14, lineHeight: 1.5,
                                            border: m.role !== 'user' ? `0.5px solid ${c.border}` : 'none',
                                        }}>{m.text}</div>
                                    </div>
                                ))}
                                <div ref={bottomRef} />
                            </div>
                            {/* Input */}
                            <div style={{ padding: '10px 12px 14px', display: 'flex', gap: 8, borderTop: `0.5px solid ${c.divider}` }}>
                                <input
                                    value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && send()}
                                    placeholder={getSetting('ai_placeholder', 'שאל אותי על מוצרים...')}
                                    style={{
                                        flex: 1, background: c.input, border: 'none', borderRadius: 12,
                                        padding: '11px 14px', fontSize: 14, color: c.text,
                                        outline: 'none', direction: 'rtl', fontFamily: SF,
                                    }}
                                />
                                <motion.button whileTap={{ scale: 0.88 }} onClick={send}
                                    style={{
                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                        background: input.trim() ? '#007AFF' : c.input,
                                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'background 0.18s',
                                    }}>
                                    <Send size={16} color={input.trim() ? '#fff' : c.text4} />
                                </motion.button>
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
        const color = isDark ? '#000000' : '#007AFF';
        metas.forEach(m => m.setAttribute('content', color));
    }, [isDark, c]);
    return null;
}

// ─── Pull-to-refresh ──────────────────────────────────────────────────────────
function PullToRefresh({ scrollRef }) {
    const [pullY, setPullY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(null);
    const THRESHOLD = 64;

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onStart = (e) => {
            if (el.scrollTop === 0) startY.current = e.touches[0].clientY;
        };
        const onMove = (e) => {
            if (startY.current === null) return;
            const delta = e.touches[0].clientY - startY.current;
            if (delta > 0 && el.scrollTop === 0) {
                e.preventDefault();
                setPullY(Math.min(delta * 0.45, THRESHOLD + 16));
            }
        };
        const onEnd = () => {
            if (pullY >= THRESHOLD && !refreshing) {
                setRefreshing(true);
                haptic('medium');
                setTimeout(() => window.location.reload(), 600);
            } else {
                setPullY(0);
            }
            startY.current = null;
        };

        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd);
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
        };
    }, [pullY, refreshing, scrollRef]);

    if (pullY <= 0 && !refreshing) return null;

    const progress = Math.min(pullY / THRESHOLD, 1);

    return (
        <motion.div
            animate={{ y: refreshing ? THRESHOLD : pullY, opacity: refreshing ? 1 : progress }}
            transition={refreshing ? { type: 'spring', stiffness: 300, damping: 28 } : { duration: 0 }}
            style={{
                position: 'absolute', top: 56, left: 0, right: 0, zIndex: 190,
                display: 'flex', justifyContent: 'center', pointerEvents: 'none',
            }}
        >
            <motion.div
                animate={refreshing ? { rotate: 360 } : { rotate: progress * 270 }}
                transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0 }}
                style={{
                    width: 32, height: 32, borderRadius: 99,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <circle cx={8} cy={8} r={6} stroke="#007AFF" strokeWidth={2} strokeDasharray="37.7" strokeDashoffset={37.7 * (1 - (refreshing ? 0.75 : progress))} strokeLinecap="round" style={{ transformOrigin: '8px 8px', transform: 'rotate(-90deg)' }} />
                </svg>
            </motion.div>
        </motion.div>
    );
}

// ─── Inner app (needs ThemeProvider in scope) ─────────────────────────────────
function MobileAppInner() {
    const location = useLocation();
    const { colors: c } = useTheme();
    const hideBottomNav = location.pathname === '/checkout';
    const hideHeader    = location.pathname === '/checkout';
    const [searchOpen, setSearchOpen] = useState(false);
    const prevPathRef   = useRef(location.pathname);
    const currentIdx    = getRouteIndex(location.pathname);
    const prevIdx       = getRouteIndex(prevPathRef.current);
    const direction     = currentIdx >= prevIdx ? 1 : -1;

    const scrollRef = useRef(null);
    const { scrollY } = useScroll({ container: scrollRef });
    const headerBlur = useTransform(scrollY, [0, 80], [0, 8]);
    const headerBg   = useTransform(scrollY, [0, 80], ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.12)']);

    useEffect(() => { prevPathRef.current = location.pathname; }, [location.pathname]);

    const slideVariants = {
        initial: (dir) => ({ x: dir > 0 ? '30%' : '-30%', opacity: 0 }),
        animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 340, damping: 36, mass: 0.8 } },
        exit: (dir) => ({ x: dir > 0 ? '-20%' : '20%', opacity: 0, filter: 'blur(4px)', transition: { duration: 0.16, ease: [0.32, 0, 0.67, 0] } }),
    };

    return (
        <div ref={scrollRef} dir="rtl" style={{
            minHeight: '100dvh',
            background: c.bg,
            fontFamily: SF,
            overflowX: 'hidden',
            paddingTop: hideHeader ? 0 : 56,
            paddingBottom: hideBottomNav ? 0 : 'calc(64px + env(safe-area-inset-bottom, 0px))',
            colorScheme: 'auto',
            position: 'relative',
        }}>
            <ThemeColorSync />
            <MobileAnalytics />
            <RouteEffects />
            {!hideHeader && <MobileHeader headerBlur={headerBlur} headerBg={headerBg} onSearch={() => setSearchOpen(true)} />}
            {!hideHeader && <PullToRefresh scrollRef={scrollRef} />}
            {!hideHeader && (
                <div style={{ position: 'sticky', top: 56, zIndex: 199 }}>
                    <AnnouncementBar />
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
                    style={{ willChange: 'transform, opacity' }}
                >
                    <Suspense fallback={<div style={{ minHeight: '60vh', background: c.bg }} />}>
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
                            <Route path="*"            element={<MobileLanding />} />
                        </Routes>
                    </Suspense>
                </motion.div>
            </AnimatePresence>

            {!hideBottomNav && <MobileBottomNav />}
            <MobileSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
            <MobileFloatingWhatsApp />
            <MobileFloatingAI />
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
