/* eslint-disable */

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useSettings } from '../../context/SettingsContext';
import { AdminKPICard, StatusBadge, AreaChart, BarChart, GoalRing, AdminModal, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Activity icon per type ───────────────────────────────────────────────────
const ACTIVITY_META = {
    product:   { color: '#007AFF', bg: 'rgba(0,122,255,0.10)',   icon: '📦' },
    order:     { color: '#34C759', bg: 'rgba(52,199,89,0.10)',   icon: '🛒' },
    inventory: { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',   icon: '📊' },
    coupon:    { color: '#5856D6', bg: 'rgba(88,86,214,0.10)',   icon: '🏷️' },
    info:      { color: '#AEAEB2', bg: 'rgba(174,174,178,0.10)', icon: 'ℹ️' },
};

// ─── Glass card wrapper ───────────────────────────────────────────────────────
function Card({ title, subtitle, accent, action, children, className = '' }) {
    return (
        <div className={`rounded-[22px] overflow-hidden ${className}`}
            style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(28px) saturate(200%)',
                WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
        >
            {accent && <div className="h-[3px]" style={{ background: accent }} />}
            <div className="p-5">
                {(title || action) && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-right">
                            <h3 className="font-black text-[#1D1D1F] text-[15px] tracking-tight">{title}</h3>
                            {subtitle && <p className="text-[#AEAEB2] text-[11px] mt-0.5">{subtitle}</p>}
                        </div>
                        {action}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

// ─── Period Selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
    const opts = [
        { v: '1',  label: 'היום' },
        { v: '7',  label: '7 ימים' },
        { v: '30', label: '30 ימים' },
    ];
    return (
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
            {opts.map(o => (
                <motion.button key={o.v} onClick={() => onChange(o.v)}
                    className="relative px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap"
                    style={{ color: value === o.v ? '#1D1D1F' : '#86868B' }}>
                    {value === o.v && (
                        <motion.div layoutId="period-pill" className="absolute inset-0 rounded-xl bg-white"
                            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                    )}
                    <span className="relative z-10">{o.label}</span>
                </motion.button>
            ))}
        </div>
    );
}

// ─── Analytics / external platform links ─────────────────────────────────────
const ANALYTICS_LINKS = [
    {
        label: 'Vercel Analytics',
        desc: 'תנועה, דפים, מדינות',
        icon: '▲',
        iconBg: 'linear-gradient(135deg,#000,#333)',
        color: '#1D1D1F',
        href: 'https://vercel.com/efraimmacs-projects/nextclass/analytics',
    },
    {
        label: 'Speed Insights',
        desc: 'LCP, CLS, FID, TTFB',
        icon: '⚡',
        iconBg: 'linear-gradient(135deg,#FF9500,#FF6B00)',
        color: '#FF9500',
        href: 'https://vercel.com/efraimmacs-projects/nextclass/speed-insights',
    },
    {
        label: 'Google Analytics',
        desc: 'קהלים, קמפיינים, המרות',
        icon: '📊',
        iconBg: 'linear-gradient(135deg,#34C759,#248A3D)',
        color: '#34C759',
        href: 'https://analytics.google.com',
    },
    {
        label: 'HubSpot CRM',
        desc: 'לידים, עסקאות, פייפליין',
        icon: '🏆',
        iconBg: 'linear-gradient(135deg,#FF7A59,#FF5C35)',
        color: '#FF7A59',
        href: 'https://app-eu1.hubspot.com',
    },
    {
        label: 'Crisp Inbox',
        desc: 'שיחות לייב עם לקוחות',
        icon: '💬',
        iconBg: 'linear-gradient(135deg,#1972F5,#0055D4)',
        color: '#1972F5',
        href: 'https://app.crisp.chat',
    },
    {
        label: 'Resend',
        desc: 'מיילים שנשלחו, לוגים',
        icon: '📧',
        iconBg: 'linear-gradient(135deg,#007AFF,#0055D4)',
        color: '#007AFF',
        href: 'https://resend.com/emails',
    },
];

function AnalyticsLinks() {
    return (
        <Card
            title="מרכז אנליטיקס ופלטפורמות"
            subtitle="גישה מהירה לכל הדשבורדים החיצוניים"
            accent="linear-gradient(90deg,#007AFF,#34C759,#FF9500)"
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ANALYTICS_LINKS.map((link, i) => (
                    <motion.a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -3, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex flex-col items-center gap-2.5 p-3 rounded-2xl text-center group"
                        style={{
                            background: 'rgba(0,0,0,0.025)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            textDecoration: 'none',
                            transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px ${link.color}25`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] shadow-sm"
                            style={{ background: link.iconBg }}>
                            <span style={link.icon === '▲' ? { color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'system-ui' } : {}}>
                                {link.icon}
                            </span>
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-[#1D1D1F] leading-tight">{link.label}</p>
                            <p className="text-[9px] text-[#AEAEB2] mt-0.5 leading-snug">{link.desc}</p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: link.color, background: `${link.color}15` }}>
                            פתח ←
                        </span>
                    </motion.a>
                ))}
            </div>
        </Card>
    );
}

// ─── Services config ─────────────────────────────────────────────────────────
const SERVICES = [
    { key: 'groq',    label: 'AI Concierge',     icon: '🤖', color: '#5856D6', desc: 'עוזר חכם + המלצות מוצר',   href: 'https://console.groq.com' },
    { key: 'resend',  label: 'Resend Email',      icon: '📧', color: '#007AFF', desc: 'מיילי אישור אוטומטיים',    href: 'https://resend.com/emails' },
    { key: 'hubspot', label: 'HubSpot CRM',       icon: '🏆', color: '#FF7A59', desc: 'ניהול לידים ועסקאות',      href: 'https://app-eu1.hubspot.com' },
    { key: 'ga',      label: 'Google Analytics',  icon: '📊', color: '#34C759', desc: 'מעקב תנועה ואירועים',      href: 'https://analytics.google.com' },
    { key: 'crisp',   label: 'Crisp Chat',        icon: '💬', color: '#1972F5', desc: 'צ׳אט אנושי בזמן אמת',     href: 'https://app.crisp.chat' },
];

// ─── CRM data hook ────────────────────────────────────────────────────────────
function useCRMStats() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('/api/hubspot-stats')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);
    return { data, loading };
}

// ─── Services Status Card ─────────────────────────────────────────────────────
function ServicesStatus({ crmData }) {
    const statuses = {
        groq:    { active: true },
        resend:  { active: true },
        hubspot: { active: !!(crmData?.configured && !crmData?.error) },
        ga:      { active: !!(import.meta.env.VITE_GA_ID?.startsWith('G-')) },
        crisp:   { active: !!(import.meta.env.VITE_CRISP_ID) },
    };

    return (
        <Card title="סטטוס שירותים" subtitle="אינטגרציות מחוברות — לחץ לפתיחה" accent="linear-gradient(90deg,#007AFF,#5856D6)">
            <div className="grid grid-cols-5 gap-3">
                {SERVICES.map(s => {
                    const active = statuses[s.key]?.active;
                    return (
                        <motion.a
                            key={s.key}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -3, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center cursor-pointer"
                            style={{
                                background: active ? `${s.color}10` : 'rgba(0,0,0,0.03)',
                                border: `1px solid ${active ? s.color + '30' : 'rgba(0,0,0,0.06)'}`,
                                textDecoration: 'none',
                                transition: 'box-shadow 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}25`}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <div className="relative">
                                <span className="text-2xl">{s.icon}</span>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${active ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#1D1D1F] leading-tight">{s.label}</p>
                                <p className="text-[9px] text-[#AEAEB2] mt-0.5">{s.desc}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${active ? 'text-[#34C759] bg-[#34C759]/10' : 'text-[#AEAEB2] bg-black/05'}`}>
                                {active ? '● פעיל' : '○ לא מחובר'}
                            </span>
                        </motion.a>
                    );
                })}
            </div>
        </Card>
    );
}

// ─── CRM Pipeline Card ────────────────────────────────────────────────────────
function CRMPipeline({ data, loading }) {
    if (loading) return (
        <Card title="CRM Pipeline" subtitle="HubSpot" accent="linear-gradient(90deg,#FF7A59,#FF9500)">
            <div className="flex items-center justify-center h-32 gap-2">
                {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-[#FF7A59]"
                        animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }}
                        transition={{ duration: 1, delay: i*0.2, repeat: Infinity }} />
                ))}
            </div>
        </Card>
    );

    if (!data?.configured) return (
        <Card title="CRM Pipeline" subtitle="HubSpot לא מחובר" accent="linear-gradient(90deg,#FF7A59,#FF9500)">
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-[#AEAEB2]">
                <span className="text-3xl">🏆</span>
                <p className="text-sm font-medium">HUBSPOT_API_KEY לא מוגדר</p>
            </div>
        </Card>
    );

    const contacts = data.contacts;
    const deals = data.deals;

    return (
        <Card title="CRM Pipeline" subtitle={`HubSpot · ${contacts?.total || 0} לידים · ${deals?.total || 0} עסקאות`}
            accent="linear-gradient(90deg,#FF7A59,#FF9500)"
            action={
                <a href="https://app-eu1.hubspot.com" target="_blank" rel="noopener noreferrer"
                    className="text-[#FF7A59] text-xs font-bold hover:underline">
                    HubSpot ←
                </a>
            }
        >
            <div className="space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'סה״כ לידים', value: contacts?.total || 0, color: '#FF7A59', icon: '👥',
                          tip: 'מספר כל אנשי הקשר שנוצרו ב-HubSpot CRM. כל ליד שמילא טופס או נוסף ידנית נספר כאן.' },
                        { label: 'עסקאות פתוחות', value: deals?.open || 0, color: '#FF9500', icon: '🤝',
                          tip: 'עסקאות שסטטוסן אינו "סגור-זכה" ואינו "סגור-הפסד". כלומר — עסקאות פעילות שעדיין בטיפול.' },
                        { label: 'שווי פייפליין', value: `₪${(deals?.pipelineValue || 0).toLocaleString()}`, color: '#34C759', icon: '💰',
                          tip: 'סכום כולל של כל העסקאות הפתוחות. מייצג את הפוטנציאל העסקי הכולל שטרם נסגר.' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.07 }}
                            className="p-3 rounded-2xl text-center"
                            style={{ background: `${stat.color}10`, border: `1px solid ${stat.color}20` }}>
                            <p className="text-lg mb-1">{stat.icon}</p>
                            <p className="font-black text-[15px] text-[#1D1D1F]">{stat.value}</p>
                            <p className="text-[9px] text-[#AEAEB2] font-bold mt-0.5 flex items-center justify-center gap-0.5">
                                {stat.label}<InfoTooltip text={stat.tip} />
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Recent contacts */}
                {contacts?.recent?.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-2">לידים אחרונים</p>
                        <div className="space-y-1.5">
                            {contacts.recent.slice(0, 4).map((c, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex items-center gap-2.5 py-1.5 border-b border-black/04 last:border-0">
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#FF7A59,#FF9500)' }}>
                                        {(c.name || c.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{c.name || 'ללא שם'}</p>
                                        <p className="text-[9px] text-[#AEAEB2] truncate">{c.company || c.email || '—'}</p>
                                    </div>
                                    <span className="w-2 h-2 rounded-full bg-[#34C759] shrink-0" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent deals */}
                {deals?.recent?.length > 0 && (
                    <div>
                        <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-2">עסקאות אחרונות</p>
                        <div className="space-y-1.5">
                            {deals.recent.slice(0, 3).map((d, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.05 }}
                                    className="flex items-center justify-between py-1.5 border-b border-black/04 last:border-0">
                                    <span className="text-[11px] font-black text-[#FF9500]">₪{d.amount.toLocaleString()}</span>
                                    <span className="text-[11px] text-[#1D1D1F] font-medium text-right flex-1 mx-2 truncate">{d.name}</span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] shrink-0">פתוח</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

const greeting = () => {
    const h = new Date().getHours();
    if (h < 5)  return 'לילה טוב';
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    return 'ערב טוב';
};

// Compute real trend: second half vs first half of the period
const computeTrend = (data) => {
    if (!data || data.length < 4) return { value: 0, up: true };
    const half = Math.floor(data.length / 2);
    const first  = data.slice(0, half).reduce((a, b) => a + b, 0);
    const second = data.slice(half).reduce((a, b) => a + b, 0);
    if (first === 0) return { value: second > 0 ? 100 : 0, up: true };
    const pct = Math.round(((second - first) / first) * 100);
    return { value: Math.min(Math.abs(pct), 999), up: pct >= 0 };
};

export default function AdminDashboard() {
    const { kpis, orders, analytics, inventory, activityLog, repairProductImages, reseedDatabase } = useAdminData();
    const { showToast } = useAdminToast();
    const { getSetting, updateGlobalSettings } = useSettings();
    const [period, setPeriod] = useState('30');
    const [drilldown, setDrilldown] = useState(null);
    const { data: crmData, loading: crmLoading } = useCRMStats();

    // Slice analytics by selected period
    const periodData = useMemo(() => {
        if (!analytics) return null;
        const days = parseInt(period);
        return {
            labels:  analytics.labels.slice(-days),
            visits:  analytics.visits.slice(-days),
            sales:   analytics.sales.slice(-days),
            revenue: analytics.revenue.slice(-days),
        };
    }, [analytics, period]);

    const periodVisits  = useMemo(() => periodData?.visits.reduce((a, b) => a + b, 0) || 0, [periodData]);
    const periodSales   = useMemo(() => periodData?.sales.reduce((a, b) => a + b, 0) || 0, [periodData]);
    const periodRevenue = useMemo(() => periodData?.revenue.reduce((a, b) => a + b, 0) || 0, [periodData]);

    // Real trends computed from data
    const trendRevenue = useMemo(() => computeTrend(periodData?.revenue), [periodData]);
    const trendSales   = useMemo(() => computeTrend(periodData?.sales),   [periodData]);
    const trendVisits  = useMemo(() => computeTrend(periodData?.visits),  [periodData]);

    // Monthly goal: target = 1.5× last-month slice, min ₪5000
    const monthlyGoal = useMemo(() => {
        if (!analytics) return { current: 0, target: 5000 };
        const dayOfMonth = new Date().getDate();
        const lastMonthRevenue = analytics.revenue
            .slice(0, Math.max(0, analytics.revenue.length - dayOfMonth))
            .reduce((a, b) => a + b, 0);
        const target = Math.max(Math.round(lastMonthRevenue * 1.5), 5000);
        return { current: kpis.thisMonthRevenue || 0, target };
    }, [analytics, kpis]);

    const recentOrders = useMemo(() =>
        [...orders].sort((a, b) => b.dateTs - a.dateTs).slice(0, 7),
        [orders]
    );

    const topProducts = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            const pid = o.productId;
            if (!pid) return;
            if (!map[pid]) {
                const inv = inventory.find(p => String(p.id) === String(pid));
                const backup = initialProducts.find(p => String(p.id) === String(pid));
                map[pid] = { id: pid, title: o.product, image: o.productImage || inv?.image || backup?.image, revenue: 0, count: 0 };
            }
            map[pid].revenue += o.total;
            map[pid].count += o.qty || 1;
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [orders, inventory]);

    const lowStock = inventory.filter(p => p.stock <= p.threshold).slice(0, 6);

    const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-5" dir="rtl">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-right">
                    <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">{greeting()}, הנהלת NextClass</h1>
                    <p className="text-[#86868B] text-sm mt-1 font-medium">{dateStr} · נתוני אמת מתעדכנים בזמן-אמת</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live dot — enhanced with badge-pulse */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full relative"
                        style={{ background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)' }}>
                        <span className="relative flex items-center justify-center w-2 h-2">
                            <span className="absolute inset-0 rounded-full bg-[#34C759] animate-ping opacity-60" />
                            <span className="relative w-2 h-2 rounded-full bg-[#34C759] animate-pulse-dot" />
                        </span>
                        <span className="text-[11px] font-black tracking-widest text-[#1D1D1F] uppercase">Live</span>
                    </div>
                    <PeriodSelector value={period} onChange={setPeriod} />
                </div>
            </motion.div>

            {/* ── Primary KPIs ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminKPICard title="הכנסות" icon="💰"
                    value={`₪${kpis.totalRevenue.toLocaleString()}`}
                    subtitle={`₪${periodRevenue.toLocaleString()} — ${period === '1' ? 'היום' : `${period} ימים`}`}
                    trend={trendRevenue.value} trendUp={trendRevenue.up} color="#34C759" delay={0}
                    sparkData={periodData?.revenue}
                    tooltip="סך כל ההכנסות מהזמנות שהושלמו. לחץ לפירוט לפי יום."
                    onClick={() => setDrilldown('revenue')} />
                <AdminKPICard title="עסקאות" icon="📦"
                    value={kpis.totalOrders}
                    subtitle={`${kpis.pendingOrders} ממתינות · ${periodSales} בתקופה`}
                    trend={trendSales.value} trendUp={trendSales.up} color="#007AFF" delay={0.05}
                    sparkData={periodData?.sales}
                    tooltip="מספר הזמנות שנקלטו. כולל ממתינות, הושלמו ובוטלו. לחץ לפירוט."
                    onClick={() => setDrilldown('orders')} />
                <AdminKPICard title="יחס המרה" icon="📈"
                    value={`${kpis.conversionRate}%`}
                    subtitle="מכניסות ייחודיות"
                    trend={trendVisits.value} trendUp={trendVisits.up} color="#5856D6" delay={0.1}
                    sparkData={periodData?.visits}
                    tooltip="אחוז הגולשים שביצעו רכישה. מחושב: הזמנות ÷ כניסות ייחודיות × 100."
                    onClick={() => setDrilldown('conversion')} />
                <AdminKPICard title="ממוצע עסקה" icon="🎯"
                    value={`₪${kpis.avgOrderValue.toLocaleString()}`}
                    subtitle={`${kpis.completedOrders} הזמנות הושלמו`}
                    color="#FF9500" delay={0.15}
                    sparkData={periodData?.revenue}
                    tooltip="ממוצע ערך הזמנה: סך הכנסות ÷ מספר הזמנות שהושלמו."
                    onClick={() => setDrilldown('avg')} />
            </div>

            {/* ── Secondary KPIs ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminKPICard title="מלאי נמוך" icon="⚠️" value={kpis.lowStockCount}
                    subtitle="מוצרים תחת סף" color="#FF3B30" delay={0.2}
                    tooltip="מספר מוצרים שמלאיים נמוך מסף ההתרעה שהוגדר לכל מוצר." />
                <AdminKPICard title="פניות חדשות" icon="✉️" value={kpis.contactsNew}
                    subtitle="ממתינות לטיפול" color="#FF9500" delay={0.25}
                    tooltip="פניות דרך טופס יצירת קשר שטרם טופלו ועדיין פתוחות." />
                <AdminKPICard title="כניסות" icon="👁️" value={periodVisits}
                    subtitle={period === '1' ? 'היום' : `${period} ימים`}
                    color="#007AFF" delay={0.3}
                    tooltip="מספר כניסות לאתר בתקופה הנבחרת. מבוסס על נתוני localStorage המקומי." />
                <AdminKPICard title="קטלוג פעיל" icon="🛍️"
                    value={inventory.filter(p => p.isActive !== false).length}
                    subtitle={`מתוך ${inventory.length} מוצרים`} color="#5856D6" delay={0.35}
                    tooltip="מוצרים המוצגים כעת בחנות. מוצרים שהוסתרו ידנית אינם נספרים." />
            </div>

            {/* ── Charts Row ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Traffic Chart — 2/3 width */}
                <Card
                    title="תנועה לאתר"
                    subtitle={period === '1' ? 'היום' : `${period} ימים אחרונים`}
                    accent="linear-gradient(90deg,#007AFF,#5856D6)"
                    className="lg:col-span-2"
                    action={
                        <span className="text-[#007AFF] text-xs font-black">
                            {periodVisits.toLocaleString()} כניסות
                        </span>
                    }
                >
                    {periodData && periodData.visits.some(v => v > 0) ? (
                        <AreaChart data={periodData.visits} color="#007AFF" labels={periodData.labels} height={110} />
                    ) : (
                        <div className="h-28 flex flex-col items-center justify-center gap-2 text-[#AEAEB2]">
                            <span className="text-2xl">👁️</span>
                            <span className="text-sm font-medium">טרם הצטברו נתוני תנועה</span>
                        </div>
                    )}
                </Card>

                {/* Top Products — 1/3 width */}
                <Card title="מוצרים מובילים" subtitle="לפי הכנסות כוללות"
                    accent="linear-gradient(90deg,#5856D6,#007AFF)">
                    <div className="space-y-3.5">
                        {topProducts.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-[#AEAEB2] text-sm">אין הזמנות עדיין</p>
                            </div>
                        )}
                        {topProducts.map((p, i) => (
                            <Link key={i} to={`/admin/inventory?search=${encodeURIComponent(p.title)}`} className="flex items-center gap-3 group/row transition-all hover:translate-x-[-4px]">
                                <span className="text-[#AEAEB2] text-xs font-black w-4 shrink-0 text-center">{i + 1}</span>
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">
                                    {p.image
                                        ? <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover/row:scale-110 transition-transform duration-500"
                                            onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                        : <span className="text-[10px]">📦</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#1D1D1F] text-[11px] font-bold line-clamp-1 text-right group-hover/row:text-[#007AFF] transition-colors">{p.title}</p>
                                    <div className="w-full h-1.5 bg-[#F5F5F7] rounded-full mt-1.5 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(p.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}
                                            transition={{ delay: i * 0.08, duration: 0.8, ease: [0.22,1,0.36,1] }}
                                            className="h-full rounded-full"
                                            style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6)' }}
                                        />
                                    </div>
                                </div>
                                <span className="text-[#6E6E73] text-[11px] font-bold shrink-0">₪{p.revenue.toLocaleString()}</span>
                            </Link>
                        ))}
                    </div>
                </Card>
            </div>

            {/* ── Revenue + Daily Sales Row ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card
                    title="מחזור הכנסות"
                    subtitle={`${period === '1' ? 'היום' : `${period} ימים`} · ₪ ביחידה`}
                    accent="linear-gradient(90deg,#34C759,#30D158)"
                    className="lg:col-span-2"
                    action={
                        <span className="text-xs font-black text-[#34C759]">
                            ₪{periodRevenue.toLocaleString()}
                        </span>
                    }
                >
                    {periodData && periodData.revenue.some(v => v > 0) ? (
                        <AreaChart data={periodData.revenue} color="#34C759" labels={periodData.labels} height={100}
                            formatY={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                    ) : (
                        <div className="h-24 flex items-center justify-center text-[#AEAEB2] text-sm">
                            טרם בוצעו עסקאות
                        </div>
                    )}
                </Card>

                {/* Monthly Goal Ring */}
                <Card title="יעד חודשי" subtitle="הכנסות החודש vs. יעד" accent="linear-gradient(90deg,#34C759,#007AFF)">
                    <GoalRing
                        value={monthlyGoal.current}
                        target={monthlyGoal.target}
                        color="#34C759"
                        label="הכנסות החודש"
                        subtitle={`יעד אוטומטי: ×1.5 מהחודש הקודם`}
                        size={100}
                    />
                </Card>
            </div>

            {/* ── Daily Sales Bar Chart ──────────────────────────────────────── */}
            <Card
                title="מכירות יומיות"
                subtitle="כמות עסקאות לפי יום"
                accent="linear-gradient(90deg,#FF9500,#FF3B30)"
                action={<span className="text-xs font-black text-[#FF9500]">{periodSales} עסקאות</span>}
            >
                {periodData && periodData.sales.some(v => v > 0) ? (
                    <BarChart data={periodData.sales} color="#FF9500" labels={periodData.labels} height={80} />
                ) : (
                    <div className="h-20 flex items-center justify-center text-[#AEAEB2] text-sm">
                        טרם בוצעו עסקאות
                    </div>
                )}
            </Card>

            {/* ── Bottom Row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Recent Orders */}
                <Card
                    title="הזמנות אחרונות"
                    accent="linear-gradient(90deg,#34C759,#30D158)"
                    className="lg:col-span-2"
                    action={
                        <Link to="/admin/orders" className="text-[#007AFF] text-xs font-bold hover:underline">
                            צפה בכולן ←
                        </Link>
                    }
                >
                    <div className="space-y-0.5">
                        {recentOrders.length === 0 && (
                            <div className="py-10 text-center">
                                <p className="text-3xl mb-2">📭</p>
                                <p className="text-[#AEAEB2] text-sm">אין הזמנות עדיין</p>
                            </div>
                        )}
                        {recentOrders.map((order, i) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center gap-3 py-2.5 border-b border-black/04 last:border-0"
                            >
                                <StatusBadge status={order.status} />
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[#1D1D1F] text-[12px] font-bold truncate">{order.customer}</p>
                                    <p className="text-[#AEAEB2] text-[10px] truncate">{order.product}</p>
                                </div>
                                <div className="shrink-0 text-left">
                                    <p className="text-[#1D1D1F] font-black text-sm">₪{order.total.toLocaleString()}</p>
                                    <p className="text-[#AEAEB2] text-[9px] font-mono">{order.id}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>

                {/* Right column — Low Stock + Activity */}
                <div className="space-y-5">
                    {/* Low Stock */}
                    <Card
                        title="⚠️ מלאי נמוך"
                        accent="linear-gradient(90deg,#FF3B30,#FF9500)"
                        action={
                            <Link to="/admin/inventory" className="text-[#007AFF] text-xs font-bold hover:underline">
                                ניהול ←
                            </Link>
                        }
                    >
                        {lowStock.length === 0 ? (
                            <div className="flex items-center gap-2 py-2">
                                <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                                <p className="text-[#34C759] text-sm font-bold">כל המלאי תקין</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lowStock.map(p => (
                                    <div key={p.id} className="flex items-center justify-between">
                                        <span className={`font-black text-[12px] shrink-0 ${p.stock === 0 ? 'text-[#FF3B30]' : 'text-[#FF9500]'}`}>
                                            {p.stock === 0 ? 'אזל' : `${p.stock} יח׳`}
                                        </span>
                                        <span className="text-[#6E6E73] text-[11px] font-medium truncate flex-1 text-right mr-3 ml-2">
                                            {p.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Activity Feed */}
                    <Card
                        title="יומן פעילות"
                        accent="linear-gradient(90deg,#5856D6,#007AFF)"
                        action={
                            <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">
                                {activityLog.length} רשומות
                            </span>
                        }
                    >
                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar -mr-1 pr-1">
                            {activityLog.length === 0 && (
                                <p className="text-[#AEAEB2] text-sm text-center py-4">אין פעילות עדיין</p>
                            )}
                            {activityLog.slice(0, 15).map((entry, i) => {
                                const meta = ACTIVITY_META[entry.type] || ACTIVITY_META.info;
                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="flex items-center gap-2.5 py-1.5 border-b border-black/04 last:border-0"
                                    >
                                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] shrink-0"
                                            style={{ background: meta.bg }}>
                                            {meta.icon}
                                        </span>
                                        <span className="text-[#1D1D1F] text-[11px] flex-1 text-right leading-snug">{entry.message}</span>
                                        <span className="text-[#AEAEB2] text-[10px] shrink-0 font-mono">{entry.date || '—'}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <Card title="פעולות מהירות" subtitle="ניהול האתר בלחיצה אחת" accent="linear-gradient(90deg,#5856D6,#007AFF)">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        {
                            label: 'תחזוקה', icon: '🔧',
                            desc: getSetting('maintenance_mode', false) ? 'כבה מצב תחזוקה' : 'הפעל מצב תחזוקה',
                            color: getSetting('maintenance_mode', false) ? '#FF3B30' : '#5856D6',
                            active: getSetting('maintenance_mode', false),
                            onClick: () => {
                                updateGlobalSettings({ maintenance_mode: !getSetting('maintenance_mode', false) });
                                showToast(getSetting('maintenance_mode', false) ? 'מצב תחזוקה כובה' : 'מצב תחזוקה הופעל', 'info');
                            }
                        },
                        {
                            label: 'הסתר מחירים', icon: '🏷️',
                            desc: getSetting('show_prices', true) ? 'הסתר מחירים' : 'הצג מחירים',
                            color: '#FF9500',
                            active: !getSetting('show_prices', true),
                            onClick: () => {
                                updateGlobalSettings({ show_prices: !getSetting('show_prices', true) });
                                showToast('הגדרת מחירים עודכנה', 'success');
                            }
                        },
                        {
                            label: 'תקן תמונות', icon: '🖼️',
                            desc: 'סנכרן תמונות מוצרים',
                            color: '#007AFF',
                            active: false,
                            onClick: async () => {
                                const count = await repairProductImages();
                                showToast(count ? `תוקנו ${count} תמונות` : 'כל התמונות תקינות', 'success');
                            }
                        },
                        {
                            label: 'סנכרן מוצרים', icon: '🔄',
                            desc: 'רענן נתוני קטלוג',
                            color: '#34C759',
                            active: false,
                            onClick: async () => {
                                await reseedDatabase();
                                showToast('הקטלוג סונכרן בהצלחה', 'success');
                            }
                        },
                        {
                            label: 'הזמנות', icon: '📦',
                            desc: `${kpis.pendingOrders} ממתינות לטיפול`,
                            color: kpis.pendingOrders > 0 ? '#FF3B30' : '#34C759',
                            active: kpis.pendingOrders > 0,
                            href: '/admin/orders'
                        },
                        {
                            label: 'HubSpot', icon: '🏆',
                            desc: 'פתח CRM חיצוני',
                            color: '#FF7A59',
                            active: false,
                            href: 'https://app-eu1.hubspot.com',
                            external: true
                        },
                    ].map((action, i) => (
                        <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -3, scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={action.onClick || (action.href ? () => {
                                if (action.external) window.open(action.href, '_blank');
                                else window.location.href = action.href;
                            } : undefined)}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center cursor-pointer"
                            style={{
                                background: action.active ? `${action.color}12` : 'rgba(0,0,0,0.025)',
                                border: `1px solid ${action.active ? action.color + '30' : 'rgba(0,0,0,0.07)'}`,
                            }}
                        >
                            <span className="text-2xl">{action.icon}</span>
                            <div>
                                <p className="text-[11px] font-black text-[#1D1D1F] leading-tight">{action.label}</p>
                                <p className="text-[9px] text-[#AEAEB2] mt-0.5 leading-snug">{action.desc}</p>
                            </div>
                            {action.active && (
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: action.color }} />
                            )}
                        </motion.button>
                    ))}
                </div>
            </Card>

            {/* ── Analytics Links ────────────────────────────────────────────── */}
            <AnalyticsLinks />

            {/* ── Services + CRM Row ────────────────────────────────────────── */}
            <ServicesStatus crmData={crmData} />
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-5">
                <CRMPipeline data={crmData} loading={crmLoading} />
            </div>

            {/* ── KPI Drilldown Modal ────────────────────────────────────────── */}
            {(() => {
                const meta = {
                    revenue:    { title: 'פירוט הכנסות', color: '#34C759', data: periodData?.revenue, labels: periodData?.labels, icon: '💰' },
                    orders:     { title: 'פירוט עסקאות', color: '#007AFF', data: periodData?.sales,   labels: periodData?.labels, icon: '📦' },
                    conversion: { title: 'פירוט תנועה',  color: '#5856D6', data: periodData?.visits,  labels: periodData?.labels, icon: '📈' },
                    avg:        { title: 'ממוצע לפי מוצר', color: '#FF9500', data: null, icon: '🎯' },
                };
                const m = drilldown ? meta[drilldown] : null;
                return (
                    <AdminModal open={!!drilldown} onClose={() => setDrilldown(null)} title={m?.title || ''} size="lg">
                        {m && (
                            <div className="space-y-5" dir="rtl">
                                {drilldown === 'avg' ? (
                                    <div className="space-y-3">
                                        {topProducts.length === 0 && <p className="text-[#AEAEB2] text-sm text-center py-8">אין נתונים להצגה</p>}
                                        {topProducts.map((p, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-[#AEAEB2] text-xs w-5 text-center font-black">{i + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-[11px] font-bold text-[#1D1D1F]">{p.title}</span>
                                                        <span className="text-[11px] font-black" style={{ color: m.color }}>₪{p.revenue.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(p.revenue / (topProducts[0]?.revenue || 1)) * 100}%` }}
                                                            transition={{ delay: i * 0.06, duration: 0.7, ease: [0.22,1,0.36,1] }}
                                                            className="h-full rounded-full"
                                                            style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}80)` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : m.data ? (
                                    <div>
                                        <p className="text-[#86868B] text-[11px] font-bold mb-4">
                                            {period === '1' ? 'היום' : `${period} ימים אחרונים`} · {m.icon} סה״כ: <span className="font-black text-[#1D1D1F]">{m.data.reduce((a,b) => a+b, 0).toLocaleString()}</span>
                                        </p>
                                        <BarChart data={m.data} color={m.color} labels={m.labels || []} height={140} />
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </AdminModal>
                );
            })()}
        </div>
    );
}
