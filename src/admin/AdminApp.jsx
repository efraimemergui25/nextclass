/* eslint-disable */

import React, { useState, lazy, Suspense, Component } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts (always loaded — tiny)
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider } from './context/AdminDataContext';
import { AdminToastProvider } from './context/AdminToastContext';

// Shell components (always loaded — structural)
import AdminSidebar from './components/AdminSidebar';
import AdminTopBar from './components/AdminTopBar';
import AdminLogin from './AdminLogin';
import AdminShortcutOverlay from './components/AdminShortcutOverlay';

// ─── Lazy pages — each is its own JS chunk ────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
const AdminOrders         = lazy(() => import('./pages/AdminOrders'));
const AdminProducts       = lazy(() => import('./pages/AdminProducts'));
const AdminInventory      = lazy(() => import('./pages/AdminInventory'));
const AdminCustomers      = lazy(() => import('./pages/AdminCustomers'));
const AdminAnalytics      = lazy(() => import('./pages/AdminAnalytics'));
const AdminMarketing      = lazy(() => import('./pages/AdminMarketing'));
const AdminContent        = lazy(() => import('./pages/AdminContent'));
const AdminSettings       = lazy(() => import('./pages/AdminSettings'));
const AdminQA             = lazy(() => import('./pages/AdminQA'));
const AdminFulfillment    = lazy(() => import('./pages/AdminFulfillment'));
const AdminCommunity      = lazy(() => import('./pages/AdminCommunity'));
const AdminMedia          = lazy(() => import('./pages/AdminMedia'));
const AdminIntegrations   = lazy(() => import('./pages/AdminIntegrations'));
const AdminCommunications = lazy(() => import('./pages/AdminCommunications'));
const AdminSecurity       = lazy(() => import('./pages/AdminSecurity'));
const AdminMagazine       = lazy(() => import('./pages/AdminMagazine'));
const AdminUsers          = lazy(() => import('./pages/AdminUsers'));
const AdminSuppliers      = lazy(() => import('./pages/AdminSuppliers'));
const AdminOCR            = lazy(() => import('./pages/AdminOCR'));

// ─── Page-level skeleton ──────────────────────────────────────────────────────
function AdminPageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse" dir="rtl">
            {/* Header bar */}
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-48 rounded-2xl bg-black/06" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    <div className="h-4 w-72 rounded-xl" style={{ background: 'rgba(0,0,0,0.04)' }} />
                </div>
                <div className="h-9 w-32 rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }} />
            </div>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[0,1,2,3].map(i => (
                    <div key={i} className="rounded-[26px] p-5 h-36"
                        style={{ background: `rgba(0,0,0,${0.04 - i * 0.005})`, border: '1px solid rgba(0,0,0,0.04)' }} />
                ))}
            </div>
            {/* Content rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-[22px] h-64"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }} />
                <div className="rounded-[22px] h-64"
                    style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }} />
            </div>
            <div className="rounded-[22px] h-48"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.04)' }} />
        </div>
    );
}

// ─── Page-level error boundary — catches crashes within individual pages ──────
class AdminPageErrorBoundary extends Component {
    state = { crashed: false, error: null };

    static getDerivedStateFromError(error) {
        return { crashed: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[AdminPage]', error, info);
    }

    reset = () => this.setState({ crashed: false, error: null });

    render() {
        if (!this.state.crashed) return this.props.children;
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
                dir="rtl"
            >
                <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 shadow-lg"
                    style={{ background: 'linear-gradient(145deg, #FF3B3015 0%, #fff 60%)', border: '1px solid #FF3B3020' }}>
                    <svg className="w-7 h-7 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-[#1D1D1F] text-xl font-black tracking-tight mb-2">הדף נתקל בשגיאה</h2>
                <pre className="text-[#FF3B30] text-xs font-mono bg-[#FF3B3008] px-4 py-2 rounded-xl max-w-sm overflow-auto mb-5 text-right">
                    {this.state.error?.message}
                </pre>
                <div className="flex gap-3">
                    <button
                        onClick={this.reset}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                        style={{ background: '#007AFF', boxShadow: '0 4px 16px rgba(0,122,255,0.3)' }}
                    >
                        נסה שוב
                    </button>
                    <button
                        onClick={() => window.location.href = '/admin/dashboard'}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: 'rgba(0,0,0,0.06)', color: '#1D1D1F' }}
                    >
                        לדשבורד
                    </button>
                </div>
            </motion.div>
        );
    }
}

// ─── Inner shell — renders after auth ────────────────────────────────────────
function AdminShell() {
    const { isAuthenticated, isLoading } = useAdminAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const location = useLocation();

    React.useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #F0F2FA 0%, #EEEEFF 35%, #F2EEFF 65%, #F5F0FF 100%)' }}>
                <motion.div
                    animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-14 h-14 rounded-[18px] flex items-center justify-center shadow-xl"
                    style={{ background: '#1D1D1F' }}
                >
                    <span className="text-white text-2xl font-black">N</span>
                </motion.div>
            </div>
        );
    }

    if (!isAuthenticated) return <AdminLogin />;

    return (
        <AdminToastProvider>
            <AdminDataProvider>
                <div className="flex h-screen overflow-hidden" dir="rtl"
                    style={{ background: 'linear-gradient(160deg, #F0F2FA 0%, #EEEEFF 35%, #F2EEFF 65%, #F5F0FF 100%)' }}>

                    {/* Ambient atmosphere */}
                    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                        <div style={{ position: 'absolute', top: '-6%', right: '-3%', width: 560, height: 560, borderRadius: '50%', background: '#007AFF', filter: 'blur(140px)', opacity: 0.055 }} />
                        <div style={{ position: 'absolute', bottom: '-8%', left: '-4%', width: 480, height: 480, borderRadius: '50%', background: '#5856D6', filter: 'blur(150px)', opacity: 0.045 }} />
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.018, mixBlendMode: 'overlay' }}>
                            <filter id="admin-noise"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /></filter>
                            <rect width="100%" height="100%" filter="url(#admin-noise)" />
                        </svg>
                    </div>

                    {/* Mobile overlay */}
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

                    {/* Sidebar */}
                    <div className="relative z-30">
                        <AdminSidebar
                            collapsed={sidebarCollapsed}
                            onToggle={() => setSidebarCollapsed(p => !p)}
                            mobileOpen={mobileSidebarOpen}
                            onMobileClose={() => setMobileSidebarOpen(false)}
                        />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 relative z-10 flex flex-col h-full overflow-hidden min-w-0">
                        <AdminTopBar
                            collapsed={sidebarCollapsed}
                            onMobileMenuToggle={() => setMobileSidebarOpen(p => !p)}
                        />
                        <AdminShortcutOverlay />
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
                                    {/* Per-page error boundary + Suspense skeleton */}
                                    <AdminPageErrorBoundary key={location.pathname}>
                                        <Suspense fallback={<AdminPageSkeleton />}>
                                            <Routes location={location}>
                                                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                                                <Route path="/admin/dashboard"      element={<AdminDashboard />} />
                                                <Route path="/admin/orders"         element={<AdminOrders />} />
                                                <Route path="/admin/products"       element={<AdminProducts />} />
                                                <Route path="/admin/inventory"      element={<AdminInventory />} />
                                                <Route path="/admin/customers"      element={<AdminCustomers />} />
                                                <Route path="/admin/users"          element={<AdminUsers />} />
                                                <Route path="/admin/analytics"      element={<AdminAnalytics />} />
                                                <Route path="/admin/marketing"      element={<AdminMarketing />} />
                                                <Route path="/admin/integrations"   element={<AdminIntegrations />} />
                                                <Route path="/admin/content"        element={<AdminContent />} />
                                                <Route path="/admin/fulfillment"    element={<AdminFulfillment />} />
                                                <Route path="/admin/suppliers"      element={<AdminSuppliers />} />
                                                <Route path="/admin/community"      element={<AdminCommunity />} />
                                                <Route path="/admin/qa"             element={<AdminQA />} />
                                                <Route path="/admin/media"          element={<AdminMedia />} />
                                                <Route path="/admin/communications" element={<AdminCommunications />} />
                                                <Route path="/admin/settings"       element={<AdminSettings />} />
                                                <Route path="/admin/security"       element={<AdminSecurity />} />
                                                <Route path="/admin/magazine"       element={<AdminMagazine />} />
                                                <Route path="/admin/ocr"            element={<AdminOCR />} />
                                                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                                            </Routes>
                                        </Suspense>
                                    </AdminPageErrorBoundary>
                                </motion.div>
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </AdminDataProvider>
        </AdminToastProvider>
    );
}

// ─── Top-level admin error boundary — catches auth/provider crashes ───────────
class AdminErrorBoundary extends Component {
    state = { crashed: false, error: null };

    static getDerivedStateFromError(error) {
        return { crashed: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[AdminApp]', error, info);
    }

    render() {
        if (!this.state.crashed) return this.props.children;
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(160deg, #F0F2FA 0%, #EEEEFF 60%, #F5F0FF 100%)',
                padding: '2rem', textAlign: 'center', direction: 'rtl', fontFamily: 'Heebo, sans-serif',
            }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>N</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', marginBottom: 8, letterSpacing: '-0.02em' }}>שגיאה באיזור הניהול</h1>
                <p style={{ color: '#6E6E73', fontSize: 14, marginBottom: 20, fontWeight: 500 }}>משהו השתבש. נסה לרענן את הדף.</p>
                {this.state.error?.message && (
                    <pre style={{ color: '#FF3B30', fontSize: 11, background: 'rgba(255,59,48,0.06)', padding: '10px 18px', borderRadius: 12, maxWidth: 520, overflow: 'auto', marginBottom: 24, textAlign: 'left', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,59,48,0.12)' }}>
                        {this.state.error.message}
                    </pre>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '11px 28px', borderRadius: 14, background: '#007AFF', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, fontFamily: 'Heebo, sans-serif', boxShadow: '0 4px 20px rgba(0,122,255,0.3)' }}>
                        רענן
                    </button>
                    <button
                        onClick={() => { window.location.href = '/'; }}
                        style={{ padding: '11px 28px', borderRadius: 14, background: 'rgba(0,0,0,0.07)', color: '#1D1D1F', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'Heebo, sans-serif' }}>
                        לאתר הראשי
                    </button>
                </div>
            </div>
        );
    }
}

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function AdminApp() {
    return (
        <AdminErrorBoundary>
            <AdminAuthProvider>
                <AdminShell />
            </AdminAuthProvider>
        </AdminErrorBoundary>
    );
}
