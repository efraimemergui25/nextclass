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
import AdminMedia from './pages/AdminMedia';
import AdminIntegrations from './pages/AdminIntegrations';
import AdminCommunications from './pages/AdminCommunications';
import AdminSecurity from './pages/AdminSecurity';
import AdminMagazine from './pages/AdminMagazine';
import AdminUsers from './pages/AdminUsers';

// Inner shell that requires authentication
function AdminShell() {
    const { isAuthenticated, isLoading } = useAdminAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();

    // Close mobile sidebar on route change
    React.useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

    if (isLoading) return <div className="min-h-screen bg-[#F5F5F7]" />;
    if (!isAuthenticated) return <AdminLogin />;

    return (
        <AdminToastProvider>
            <AdminDataProvider>
            <div className="flex h-screen overflow-hidden" dir="rtl"
            style={{ background: 'linear-gradient(160deg, #F0F2FA 0%, #EEEEFF 35%, #F2EEFF 65%, #F5F0FF 100%)' }}>
                {/* Ambient orbs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                    <div style={{ position: 'absolute', top: '-6%', right: '-3%', width: 560, height: 560, borderRadius: '50%', background: '#007AFF', filter: 'blur(140px)', opacity: 0.055 }} />
                    <div style={{ position: 'absolute', bottom: '-8%', left: '-4%', width: 480, height: 480, borderRadius: '50%', background: '#5856D6', filter: 'blur(150px)', opacity: 0.045 }} />
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.018, mixBlendMode: 'overlay' }}>
                        <filter id="admin-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                        <rect width="100%" height="100%" filter="url(#admin-noise)" />
                    </svg>
                </div>

                {/* Mobile overlay backdrop */}
                <AnimatePresence>
                    {mobileSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebarOpen(false)}
                            className="fixed inset-0 bg-black/50 z-[25] lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar — hidden on mobile unless open */}
                <div className="relative z-30">
                    <AdminSidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(p => !p)}
                        mobileOpen={mobileSidebarOpen}
                        onMobileClose={() => setMobileSidebarOpen(false)}
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative z-10 flex flex-col h-full overflow-hidden min-w-0">
                    <AdminTopBar
                        collapsed={sidebarCollapsed}
                        onMobileMenuToggle={() => setMobileSidebarOpen(p => !p)}
                    />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
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
                                    <Route path="/admin/users" element={<AdminUsers />} />
                                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                                    <Route path="/admin/marketing" element={<AdminMarketing />} />
                                    <Route path="/admin/integrations" element={<AdminIntegrations />} />
                                    <Route path="/admin/content" element={<AdminContent />} />
                                    <Route path="/admin/fulfillment" element={<AdminFulfillment />} />
                                    <Route path="/admin/community" element={<AdminCommunity />} />
                                    <Route path="/admin/qa" element={<AdminQA />} />
                                    <Route path="/admin/media" element={<AdminMedia />} />
                                    <Route path="/admin/communications" element={<AdminCommunications />} />
                                    <Route path="/admin/settings" element={<AdminSettings />} />
                                    <Route path="/admin/security" element={<AdminSecurity />} />
                                    <Route path="/admin/magazine" element={<AdminMagazine />} />
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
