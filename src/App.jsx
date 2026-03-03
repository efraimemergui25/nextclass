import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import MainNavigation from './components/MainNavigation';
import InstitutionalLogin from './pages/InstitutionalLogin';
import Dashboard from './pages/Dashboard';
import CatalogPage from './pages/CatalogPage';
import SuccessPage from './pages/SuccessPage';
import ProductDetailPage from './pages/ProductDetailPage';

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<InstitutionalLogin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/:id" element={<ProductDetailPage />} />
                <Route path="/success" element={<SuccessPage />} />
                {/* Default route */}
                <Route path="/" element={<CatalogPage />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            <div className="min-h-screen flex flex-col font-sans text-[#1D1D1F] antialiased bg-[#F5F5F7]">
                {/* MainNavigation remains persistent outside the animated routes */}
                <MainNavigation />

                <main className="flex-1 w-full bg-[#F5F5F7] flex flex-col">
                    <AnimatedRoutes />
                </main>
            </div>
        </Router>
    );
}

export default App;
