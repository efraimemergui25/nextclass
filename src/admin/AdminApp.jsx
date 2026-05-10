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
            style={{ background: 'linear-gradient(135deg, #EDF2FF 0%, #F0EAFF 28%, #FFF0F8 60%, #FFF5EE 100%)' }}>
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
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
