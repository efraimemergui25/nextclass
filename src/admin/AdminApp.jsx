/* eslint-disable */

import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { AdminToastProvider } from './context/AdminToastContext';

// Components
import AdminSidebar from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import AdminNotificationWatcher from './components/AdminNotificationWatcher';
import AdminLogin from './AdminLogin';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminProducts from './pages/AdminProducts';
import AdminInventory from './pages/AdminInventory';
import AdminCustomers from './pages/AdminCustomers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminMarketing from './pages/AdminMarketing';
import AdminContent from './pages/AdminContent';
import AdminSettings from './pages/AdminSettings';
import AdminQA from './pages/AdminQA';
import AdminFulfillment from './pages/AdminFulfillment';
import AdminCommunity from './pages/AdminCommunity';

// Inner shell that requires authentication
function AdminShell() {
    const { isAuthenticated, isLoading } = useAdminAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();

    if (isLoading) return <div className="min-h-screen bg-[#F5F5F7]" />;
    if (!isAuthenticated) return <AdminLogin />;

    return (
        <AdminToastProvider>
            <AdminDataProvider>
            <AdminNotificationWatcher />
            <div className="flex h-screen overflow-hidden" dir="rtl"
            style={{ background: 'linear-gradient(145deg, #EBF0FF 0%, #EEE8FF 22%, #F7E8FF 50%, #FFF0F5 75%, #FFF8EE 100%)' }}>
                {/* Ambient floating orbs — admin atmosphere */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-8%', right: '-4%', width: 600, height: 600, borderRadius: '50%', background: '#007AFF', filter: 'blur(120px)', opacity: 0.045, willChange: 'transform' }} />
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: '#5856D6', filter: 'blur(130px)', opacity: 0.04, willChange: 'transform' }} />
                    <div style={{ position: 'absolute', top: '45%', left: '35%', width: 400, height: 400, borderRadius: '50%', background: '#FF9500', filter: 'blur(150px)', opacity: 0.025 }} />
                    {/* Noise grain */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025, mixBlendMode: 'overlay' }}>
                        <filter id="admin-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                        <rect width="100%" height="100%" filter="url(#admin-noise)" />
                    </svg>
                </div>

                {/* Sidebar */}
                <div className="relative z-20">
                    <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
                    <AdminTopBar collapsed={sidebarCollapsed} />
                    <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                                className="max-w-7xl mx-auto"
                            >
                                <Routes location={location}>
                                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                    <Route path="/admin/orders" element={<AdminOrders />} />
                                    <Route path="/admin/products" element={<AdminProducts />} />
                                    <Route path="/admin/inventory" element={<AdminInventory />} />
                                    <Route path="/admin/customers" element={<AdminCustomers />} />
                                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                                    <Route path="/admin/marketing" element={<AdminMarketing />} />
                                    <Route path="/admin/content" element={<AdminContent />} />
                                    <Route path="/admin/fulfillment" element={<AdminFulfillment />} />
                                    <Route path="/admin/community" element={<AdminCommunity />} />
                                    <Route path="/admin/qa" element={<AdminQA />} />
                                    <Route path="/admin/settings" element={<AdminSettings />} />
                                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                                </Routes>
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
            </AdminDataProvider>
        </AdminToastProvider>
    );
}

// Entry point wraps everything in the Auth Provider
export default function AdminApp() {
    return (
        <AdminAuthProvider>
            <AdminShell />
        </AdminAuthProvider>
    );
}
