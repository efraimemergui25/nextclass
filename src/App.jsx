import { useEffect, Component } from 'react';

class AppErrorBoundary extends Component {
    state = { crashed: false, error: null };
    static getDerivedStateFromError(error) { return { crashed: true, error }; }
    componentDidCatch(error, info) { console.error('[AppErrorBoundary]', error, info); }
    render() {
        if (!this.state.crashed) return this.props.children;
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>N</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1D1D1F', marginBottom: 8 }}>אירעה שגיאה</h1>
                <pre style={{ color: '#FF3B30', fontSize: 11, background: 'rgba(255,59,48,0.08)', padding: '8px 16px', borderRadius: 8, maxWidth: 600, overflow: 'auto', marginBottom: 16, textAlign: 'left', whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
                <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 12, background: '#007AFF', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>רענן</button>
            </div>
        );
    }
}
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import SuccessStoriesPage from './pages/SuccessStoriesPage';
import SupportPage from './pages/SupportPage';
import ContactPage from './pages/ContactPage';
import VODCenterPage from './pages/VODCenterPage';
import MagazinePage from './pages/MagazinePage';
import ComparePage from './pages/ComparePage';
import DiscoverPage from './pages/DiscoverPage';
import WishlistPage from './pages/WishlistPage';
import AnnouncementBar from './components/AnnouncementBar';
import DynamicIsland from './components/DynamicIsland';
import SmartConcierge from './components/SmartConcierge';
import CompareTray from './components/CompareTray';
import GlassCanvas from './components/GlassCanvas';
import PageErrorBoundary from './components/PageErrorBoundary';
import ExitIntentPopup from './components/ExitIntentPopup';
import { CompareProvider } from './context/CompareContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { WishlistProvider } from './context/WishlistContext';
import AdminApp from './admin/AdminApp';

// ─── Crisp Live Chat ─────────────────────────────────────────────────────────
// Set VITE_CRISP_ID in .env + Vercel to enable the live chat widget.
// Get your Website ID at: https://app.crisp.chat → Settings → Website Settings → Setup Instructions
function CrispChat() {
    useEffect(() => {
        const id = import.meta.env.VITE_CRISP_ID;
        if (!id || window.$crisp) return;
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = id;
        const s = document.createElement('script');
        s.src = 'https://client.crisp.chat/l.js';
        s.async = true;
        document.head.appendChild(s);
    }, []);
    return null;
}

// ─── Analytics helpers ───────────────────────────────────────────────────────
export function trackEvent(name, params = {}) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', name, params);
    }
}

function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname.startsWith('/admin')) return;

        // LocalStorage visit counter (admin heatmap)
        try {
            const today = new Date().toISOString().split('T')[0];
            const visits = JSON.parse(localStorage.getItem('nextclass_visits') || '{}');
            visits[today] = (visits[today] || 0) + 1;
            localStorage.setItem('nextclass_visits', JSON.stringify(visits));
        } catch {}

        // GA4 page_view
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'page_view', {
                page_path: location.pathname + location.search,
                page_title: document.title,
            });
        }
    }, [location]);

    return null;
}


// Preserve manual scroll restoration for smooth route transitions
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="popLayout">
            <Routes location={location} key={location.pathname}>
                <Route path="/"           element={<LandingPage />} />
                <Route path="/catalog"    element={<CatalogPage />} />
                <Route path="/catalog/:id" element={<ProductDetailPage />} />
                <Route path="/cart"       element={<CartPage />} />
                <Route path="/checkout"   element={<CheckoutPage />} />
                <Route path="/story"      element={<AboutPage />} />
                <Route path="/innovation" element={<SuccessStoriesPage />} />
                <Route path="/help"       element={<SupportPage />} />
                <Route path="/contact"    element={<ContactPage />} />
                <Route path="/vod"        element={<VODCenterPage />} />
                <Route path="/magazine"   element={<MagazinePage />} />
                <Route path="/compare"    element={<ComparePage />} />
                <Route path="/discover"   element={<DiscoverPage />} />
                <Route path="/favorites"  element={<WishlistPage />} />
                <Route path="*"           element={<LandingPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <AppErrorBoundary>
            <SettingsProvider>
                <CartProvider>
                    <ProductsProvider>
                        <WishlistProvider>
                            <CompareProvider>
                                <Router>
                                    <AppContent />
                                </Router>
                            </CompareProvider>
                        </WishlistProvider>
                    </ProductsProvider>
                </CartProvider>
            </SettingsProvider>
        </AppErrorBoundary>
    );
}

function AppContent() {
    const location = useLocation();
    const { getSetting } = useSettings();
    const maintenance = getSetting('maintenance_mode', false);

    // ─── Admin Route Isolation ────────────────────────────────────────────────
    if (location.pathname.startsWith('/admin')) {
        return <AdminApp />;
    }

    // ─── Maintenance Mode ──────────────────────────────────────────────────────
    if (maintenance) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-[#1D1D1F] flex items-center justify-center mb-8 shadow-2xl">
                    <span className="text-white text-3xl font-black">N</span>
                </div>
                <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tighter mb-4">{getSetting('maintenance_title', 'האתר בתחזוקה')}</h1>
                <p className="text-[#6E6E73] text-lg font-medium max-w-md">{getSetting('maintenance_msg', 'אנחנו משפרים את החוויה עבורכם. נחזור בקרוב.')}</p>
                <div className="mt-8 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse" />
                    <span className="text-[#AEAEB2] text-sm font-bold uppercase tracking-widest">בקרוב</span>
                </div>
            </div>
        );
    }

    // ─── Adaptive Mood — unique color personality per page ──────────────────
    const getMood = () => {
        const path = location.pathname;
        if (path === '/')                              return { primary: '#007AFF', secondary: '#5856D6' };
        if (path.startsWith('/catalog/'))              return { primary: '#FF9500', secondary: '#FF2D55' };
        if (path.startsWith('/catalog'))               return { primary: '#34C759', secondary: '#007AFF' };
        if (path === '/cart' || path === '/checkout')  return { primary: '#FF3B30', secondary: '#FF9500' };
        if (path === '/story')                         return { primary: '#5856D6', secondary: '#007AFF' };
        if (path === '/discover')                      return { primary: '#007AFF', secondary: '#30D158' };
        if (path === '/innovation')                    return { primary: '#FF9F0A', secondary: '#FF375F' };
        return { primary: '#007AFF', secondary: '#5856D6' };
    };

    const mood = getMood();

    return (
        <div
            dir="rtl"
            className="min-h-screen flex flex-col font-heebo text-[#1D1D1F] antialiased pt-[73px]"
            style={{ WebkitFontSmoothing: 'antialiased' }}
        >
            <AnalyticsTracker />
            {/* ── Living Aurora Atmosphere — reactive, always present ── */}
            <GlassCanvas mood={mood} />

            <AnnouncementBar />
            <Header />
            <main className="flex-1 w-full flex flex-col relative z-0 min-h-[60vh]">
                <PageErrorBoundary>
                    <AnimatedRoutes />
                </PageErrorBoundary>
            </main>
            <Footer />

            {/* ── Global Floating UI Layer ── */}
            <DynamicIsland />
            <SmartConcierge />
            <CompareTray />
            <ExitIntentPopup />
            <CrispChat />
        </div>
    );
}

export default App;
