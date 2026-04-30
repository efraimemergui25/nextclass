import React from 'react';
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
import DynamicIsland from './components/DynamicIsland';
import SmartConcierge from './components/SmartConcierge';
import CompareTray from './components/CompareTray';
import GlassCanvas from './components/GlassCanvas';
import { CompareProvider } from './context/CompareContext';
import { CartProvider } from './context/CartContext';

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
            <CompareProvider>
                <Router>
                    <AppContent />
                </Router>
            </CompareProvider>
        </CartProvider>
    );
}

function AppContent() {
    const location = useLocation();

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
            {/* ── Living Aurora Atmosphere — reactive, always present ── */}
            <GlassCanvas mood={mood} />

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
