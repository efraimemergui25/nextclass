import React, { useEffect, useState } from 'react';
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
import AnnouncementBar from './components/AnnouncementBar';
import DynamicIsland from './components/DynamicIsland';
import SmartConcierge from './components/SmartConcierge';
import CompareTray from './components/CompareTray';
import GlassCanvas from './components/GlassCanvas';
import { CompareProvider } from './context/CompareContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import AdminApp from './admin/AdminApp';

// ─── Analytics Tracker ──────────────────────────────────────────────────────
function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        // Don't track admin pages
        if (location.pathname.startsWith('/admin')) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const savedVisits = localStorage.getItem('nextclass_visits');
            const visits = savedVisits ? JSON.parse(savedVisits) : {};
            
            visits[today] = (visits[today] || 0) + 1;
            localStorage.setItem('nextclass_visits', JSON.stringify(visits));
        } catch (e) {
            console.error('Analytics tracking failed', e);
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
                <Route path="*"           element={<LandingPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <CartProvider>
            <ProductsProvider>
                <CompareProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </CompareProvider>
            </ProductsProvider>
        </CartProvider>
    );
}

function AppContent() {
    const location = useLocation();
    const [maintenance, setMaintenance] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nextclass_content') || '{}').maintenance_mode === true; } catch { return false; }
    });

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'nextclass_content') {
                try { setMaintenance(JSON.parse(localStorage.getItem('nextclass_content') || '{}').maintenance_mode === true); } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

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
                <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tighter mb-4">האתר בתחזוקה</h1>
                <p className="text-[#6E6E73] text-lg font-medium max-w-md">אנחנו משפרים את החוויה עבורכם. נחזור בקרוב.</p>
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
                <AnimatedRoutes />
            </main>
            <Footer />

            {/* ── Global Floating UI Layer ── */}
            <DynamicIsland />
            <SmartConcierge />
            <CompareTray />
        </div>
    );
}

export default App;
