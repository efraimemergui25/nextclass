/* eslint-disable */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';

// Time-of-day border glow color
function useTimeColor() {
    const [color, setColor] = useState('');
    useEffect(() => {
        const update = () => {
            const h = new Date().getHours();
            if (h >= 5  && h < 9)  setColor('rgba(255,149,0,0.35)');   // dawn
            else if (h >= 9  && h < 17) setColor('rgba(0,122,255,0.30)');  // day
            else if (h >= 17 && h < 20) setColor('rgba(255,59,48,0.30)');  // sunset
            else setColor('rgba(88,86,214,0.35)');                          // night
        };
        update();
        const t = setInterval(update, 60000);
        return () => clearInterval(t);
    }, []);
    return color;
}

// SVG icon set
const ICONS = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
    orders:    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    products:  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    inventory: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    customers: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    analytics: <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
    marketing: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
    content:   <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    qa:        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    settings:  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
    fulfillment: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />,
    community:   <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    media:       <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    communications: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />,
    integrations: <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
    security:  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    magazine:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />,
    logout:    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
};

function NavIcon({ d }) {
    return (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            {d}
        </svg>
    );
}

const NAV = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'סקירה כללית',   badge: null },
    { path: '/admin/orders',    icon: 'orders',    label: 'הזמנות',         badge: 'pending' },
    { path: '/admin/products',  icon: 'products',  label: 'מוצרים',         badge: null },
    { path: '/admin/inventory', icon: 'inventory', label: 'מלאי',           badge: 'lowStock' },
    { path: '/admin/customers',       icon: 'customers',       label: 'לקוחות',         badge: 'newContacts' },
    { path: '/admin/communications',  icon: 'communications',  label: 'תקשורת',          badge: null },
    { path: '/admin/analytics', icon: 'analytics', label: 'אנליטיקס',       badge: null },
    { path: '/admin/marketing',    icon: 'marketing',    label: 'שיווק וקופונים',  badge: null },
    { path: '/admin/fulfillment',  icon: 'fulfillment',  label: 'רכש וספקים',      badge: null },
    { path: '/admin/community',    icon: 'community',    label: 'קהילה',            badge: null },
    { path: '/admin/integrations',  icon: 'integrations',  label: 'אינטגרציות',      badge: null },
    { path: '/admin/magazine',     icon: 'magazine',     label: 'מגזין',            badge: null },
    { path: '/admin/content',      icon: 'content',      label: 'תוכן האתר',       badge: null },
    { path: '/admin/media',        icon: 'media',        label: 'מדיה',             badge: null },
    { path: '/admin/qa',           icon: 'qa',           label: 'שאלות גולשים',    badge: null },
    { path: '/admin/security',     icon: 'security',     label: 'אבטחה',           badge: null },
    { path: '/admin/settings',     icon: 'settings',     label: 'הגדרות',          badge: null },
];

export default function AdminSidebar({ collapsed, onToggle }) {
    const { logout } = useAdminAuth();
    const { kpis } = useAdminData();
    const navigate = useNavigate();
    const glowColor = useTimeColor();

    const getBadge = (key) => {
        if (!key) return null;
        const v = key === 'pending' ? kpis.pendingOrders
            : key === 'lowStock' ? kpis.lowStockCount
            : key === 'newContacts' ? kpis.contactsNew
            : null;
        return v > 0 ? v : null;
    };

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 232 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="h-full flex flex-col shrink-0 relative"
            style={{
                background: 'rgba(248,248,252,0.88)',
                backdropFilter: 'blur(64px) saturate(240%)',
                WebkitBackdropFilter: 'blur(64px) saturate(240%)',
                borderLeft: `1px solid ${glowColor || 'rgba(0,0,0,0.07)'}`,
                boxShadow: '4px 0 32px rgba(0,0,0,0.05), inset -1px 0 0 rgba(255,255,255,0.85)',
                transition: 'border-color 2s ease',
            }}
        >
            {/* Brand header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-black/06">
                <motion.div
                    whileHover={{ scale: 1.08, rotate: -5 }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 4px 12px rgba(0,122,255,0.30)' }}
                >
                    <span className="text-white text-xs font-black">N</span>
                </motion.div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                            className="overflow-hidden leading-tight flex-1">
                            <p className="text-[#1D1D1F] font-black text-sm tracking-tighter">NextClass</p>
                            <p className="text-[#86868B] text-[10px] font-bold uppercase tracking-widest">Admin</p>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button whileTap={{ scale: 0.88 }} onClick={onToggle}
                    className="mr-auto w-6 h-6 rounded-lg flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/06 transition-all shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {collapsed
                            ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            : <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />}
                    </svg>
                </motion.button>
            </div>

            {/* Revenue quick-stat */}
            <AnimatePresence>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mx-3 my-2 px-3 py-2.5 rounded-2xl"
                            style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(88,86,214,0.06))', border: '1px solid rgba(0,122,255,0.12)' }}>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#AEAEB2] mb-1">הכנסות ברוטו</p>
                            <p className="text-[#007AFF] font-black text-base tracking-tighter leading-none">
                                ₪{(kpis.totalRevenue || 0).toLocaleString()}
                            </p>
                            <p className="text-[#AEAEB2] text-[10px] mt-0.5">{kpis.completedOrders || 0} עסקאות הושלמו</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Nav */}
            <nav className="flex-1 p-2 overflow-y-auto space-y-0.5 custom-scrollbar">
                {NAV.map((item) => {
                    const b = getBadge(item.badge);
                    return (
                        <NavLink key={item.path} to={item.path}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all relative group"
                        >
                            {({ isActive }) => (
                                <>
                                                    {/* Active background */}
                                    {isActive && (
                                        <motion.div layoutId="nav-active"
                                            className="absolute inset-0 rounded-xl"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.07) 100%)',
                                                border: '1px solid rgba(0,122,255,0.18)',
                                                boxShadow: '0 2px 12px rgba(0,122,255,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    {!isActive && (
                                        <motion.div
                                            className="absolute inset-0 rounded-xl"
                                            initial={{ opacity: 0 }}
                                            whileHover={{ opacity: 1 }}
                                            style={{ background: 'rgba(0,0,0,0.035)' }}
                                        />
                                    )}
                                    <div className={`relative z-10 shrink-0 ${isActive ? 'text-[#007AFF]' : 'text-[#6E6E73]'}`}>
                                        <NavIcon d={ICONS[item.icon]} />
                                    </div>
                                    <AnimatePresence>
                                        {!collapsed && (
                                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className={`text-[13px] whitespace-nowrap overflow-hidden leading-none relative z-10 flex-1 ${isActive ? 'font-black text-[#007AFF]' : 'font-medium text-[#6E6E73]'}`}>
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                    {b && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className={`${collapsed ? 'absolute top-1 right-1' : 'ml-auto'} relative z-10 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-[#FF3B30] text-white shadow-sm`}>
                                            {b > 9 ? '9+' : b}
                                        </motion.span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-2 border-t border-black/06 space-y-1">
                {/* Back to main site */}
                <a
                    href="/"
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#007AFF] hover:bg-[#007AFF]/06 transition-all group"
                    title="חזרה לאתר הראשי"
                >
                    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-[13px] font-bold whitespace-nowrap">
                                לאתר הראשי
                            </motion.span>
                        )}
                    </AnimatePresence>
                </a>

                <motion.button whileTap={{ scale: 0.94 }} onClick={() => { logout(); navigate('/admin'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/06 transition-all group">
                    <NavIcon d={ICONS.logout} />
                    {!collapsed && <span className="text-[13px] font-semibold">יציאה</span>}
                </motion.button>
            </div>
        </motion.aside>
    );
}
