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
import { CompareProvider } from './context/CompareContext';
import { CartProvider } from './context/CartContext';

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
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
                    <div dir="rtl" className="min-h-screen flex flex-col font-heebo text-[#1D1D1F] antialiased bg-[#F5F5F7] selection:bg-blue-100 selection:text-blue-700 pt-[73px] overflow-x-hidden">

                        {/* ── Global Ambient Atmosphere ── */}
                        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                            {/* Blue accent orb — top right */}
                            <div
                                className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.07]"
                                style={{
                                    background: 'radial-gradient(circle, #007AFF 0%, transparent 70%)',
                                    filter: 'blur(80px)',
                                    animation: 'orb-drift 18s ease-in-out infinite',
                                }}
                            />
                            {/* Violet orb — bottom left */}
                            <div
                                className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.05]"
                                style={{
                                    background: 'radial-gradient(circle, #5856D6 0%, transparent 70%)',
                                    filter: 'blur(80px)',
                                    animation: 'orb-drift 24s ease-in-out infinite reverse',
                                }}
                            />
                            {/* Subtle dot grid */}
                            <div className="absolute inset-0 ambient-grid opacity-60" />
                        </div>

                        <Header />
                        <main className="flex-1 w-full flex flex-col relative z-0">
                            <AnimatedRoutes />
                        </main>
                        <Footer />
                        <DynamicIsland />
                        <SmartConcierge />
                        <CompareTray />
                    </div>
                </Router>
            </CompareProvider>
        </CartProvider>

    );
}

export default App;
