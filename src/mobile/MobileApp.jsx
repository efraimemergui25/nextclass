import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid3X3, ShoppingBag, Heart, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductsContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import MobileLanding   from './pages/MobileLanding';
import MobileCatalog   from './pages/MobileCatalog';
import MobileProduct   from './pages/MobileProduct';
import MobileCart      from './pages/MobileCart';
import MobileCheckout  from './pages/MobileCheckout';
import MobileFavorites from './pages/MobileFavorites';
import MobileContact   from './pages/MobileContact';
import MobileAbout     from './pages/MobileAbout';
import MobileVOD       from './pages/MobileVOD';
import MobileMagazine  from './pages/MobileMagazine';
import MobileMenu      from './pages/MobileMenu';
import MobileCompare   from './pages/MobileCompare';

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

// ─── Dynamic product title resolver ───────────────────────────────────────────
function usePageTitle(pathname) {
    const { getActiveProductById } = useProducts();
    const productMatch = pathname.match(/^\/catalog\/(.+)$/);
    if (productMatch) {
        const product = getActiveProductById(productMatch[1]);
        return product?.title || 'מוצר';
    }
    return PAGE_TITLES[pathname] || '';
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function MobileBottomNav() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { cartCount }     = useCart();
    const { wishlistCount } = useWishlist();

    return (
        <nav dir="rtl" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            borderTop: '0.5px solid rgba(0,0,0,0.10)',
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
                        onClick={() => navigate(path)}
                        whileTap={{ scale: 0.80 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
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
                                    color: isActive ? '#007AFF' : 'rgba(60,60,67,0.38)',
                                    strokeWidth: isActive ? 2.2 : 1.8,
                                    transition: 'color 0.15s',
                                }}
                            />
                            {badge > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
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
                            color: isActive ? '#007AFF' : 'rgba(60,60,67,0.38)',
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

// ─── Header ───────────────────────────────────────────────────────────────────
function MobileHeader() {
    const location  = useLocation();
    const navigate  = useNavigate();
    const { getSetting } = useSettings();
    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');
    const isHome    = location.pathname === '/';
    const isProduct = location.pathname.startsWith('/catalog/');
    const title     = usePageTitle(location.pathname);

    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 200,
            height: 56,
            paddingTop: 'env(safe-area-inset-top, 0px)',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            borderBottom: '0.5px solid rgba(0,0,0,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            direction: 'rtl', fontFamily: SF,
        }}>
            {!isHome && (
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => navigate(-1)}
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
                                <circle cx={12} cy={16} r={9} stroke="#1D1D1F" strokeWidth={2} />
                                <circle cx={20} cy={16} r={9} stroke="#007AFF" strokeWidth={2} fill="#007AFF" fillOpacity={0.15} />
                            </svg>
                            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.04em', color: '#1D1D1F' }}>
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
                            fontWeight: 700, fontSize: 16, color: '#1D1D1F',
                            letterSpacing: '-0.02em',
                            maxWidth: '55%', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </motion.span>
                </AnimatePresence>
            )}
        </header>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function MobileApp() {
    const location = useLocation();
    const hideBottomNav = location.pathname === '/checkout';
    const hideHeader    = location.pathname === '/checkout';

    return (
        <div dir="rtl" style={{
            minHeight: '100dvh',
            background: '#F2F2F7',
            fontFamily: SF,
            overflowX: 'hidden',
            paddingTop: hideHeader ? 0 : 56,
            paddingBottom: hideBottomNav ? 0 : 'calc(64px + env(safe-area-inset-bottom, 0px))',
        }}>
            <MobileAnalytics />
            {!hideHeader && <MobileHeader />}

            <AnimatePresence mode="popLayout">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.20, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.08 } }}
                >
                    <Routes location={location}>
                        <Route path="/"           element={<MobileLanding />} />
                        <Route path="/catalog"    element={<MobileCatalog />} />
                        <Route path="/catalog/:id" element={<MobileProduct />} />
                        <Route path="/cart"       element={<MobileCart />} />
                        <Route path="/checkout"   element={<MobileCheckout />} />
                        <Route path="/favorites"  element={<MobileFavorites />} />
                        <Route path="/contact"    element={<MobileContact />} />
                        <Route path="/story"      element={<MobileAbout />} />
                        <Route path="/vod"        element={<MobileVOD />} />
                        <Route path="/magazine"   element={<MobileMagazine />} />
                        <Route path="/menu"       element={<MobileMenu />} />
                        <Route path="/compare"    element={<MobileCompare />} />
                        <Route path="*"           element={<MobileLanding />} />
                    </Routes>
                </motion.div>
            </AnimatePresence>

            {!hideBottomNav && <MobileBottomNav />}
        </div>
    );
}
