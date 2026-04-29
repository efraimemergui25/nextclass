import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
import { CompareProvider } from './context/CompareContext';
import { CartProvider } from './context/CartContext';

// Disable browser automatic scroll restoration to prevent "jumping" during Framer Motion transitions
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="popLayout">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/story" element={<AboutPage />} />
                <Route path="/innovation" element={<SuccessStoriesPage />} />
                <Route path="/help" element={<SupportPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/vod" element={<VODCenterPage />} />
                <Route path="/magazine" element={<MagazinePage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="*" element={<LandingPage />} />
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
    
    // ─── Adaptive Atmosphere Logic ──────────────────────────────────────────
    // Determine the color mood based on the current route
    const getMood = () => {
        const path = location.pathname;
        if (path === '/') return { primary: '#007AFF', secondary: '#5856D6' }; // Home: Blue/Violet
        if (path.startsWith('/catalog/')) return { primary: '#FF9500', secondary: '#FF2D55' }; // Product: Gold/Rose
        if (path.startsWith('/catalog')) return { primary: '#34C759', secondary: '#007AFF' }; // Catalog: Green/Blue
        if (path === '/cart' || path === '/checkout') return { primary: '#FF3B30', secondary: '#FF9500' }; // Purchase: Red/Gold
        return { primary: '#007AFF', secondary: '#5856D6' };
    };

    const mood = getMood();

    return (
        <div dir="rtl" className="min-h-screen flex flex-col font-heebo text-[#1D1D1F] antialiased bg-[#F5F5F7] selection:bg-blue-100 selection:text-blue-700 pt-[73px]">

            {/* ── Global Adaptive Ambient Atmosphere ── */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                {/* Primary adaptive orb */}
                <motion.div
                    animate={{ backgroundColor: mood.primary }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.06]"
                    style={{
                        filter: 'blur(100px)',
                        animation: 'orb-drift 20s ease-in-out infinite',
                    }}
                />
                {/* Secondary adaptive orb */}
                <motion.div
                    animate={{ backgroundColor: mood.secondary }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
                    style={{
                        filter: 'blur(100px)',
                        animation: 'orb-drift 25s ease-in-out infinite reverse',
                    }}
                />
                {/* Subtle dot grid */}
                <div className="absolute inset-0 ambient-grid opacity-60" />
            </div>

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
