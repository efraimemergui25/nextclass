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
import AIAssistantWidget from './components/AIAssistantWidget';

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
                <Route path="*" element={<LandingPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            {/* Globals: RTL setup and standard generic layout for "Apple Store" vibe */}
            <div dir="rtl" className="min-h-screen flex flex-col font-heebo text-[#1D1D1F] antialiased bg-[#F5F5F7] selection:bg-blue-100 pt-[73px]">
                <Header />
                <main className="flex-1 w-full flex flex-col relative z-0">
                    <AnimatedRoutes />
                </main>
                <Footer />
                <AIAssistantWidget />
            </div>
        </Router>
    );
}

export default App;
