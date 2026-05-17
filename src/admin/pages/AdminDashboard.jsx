/* eslint-disable */

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, animate as animateMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Wrench, Tag, Image, RefreshCw, Package, ExternalLink,
    ShoppingCart, BarChart2, Layers, AlertTriangle, Box,
    Zap, TrendingUp, Users, MessageCircle, Mail, Activity
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useSettings } from '../../context/SettingsContext';
import { AdminKPICard, StatusBadge, HeatGrid, BarChart, GoalRing, AdminModal, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1.4 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    const motionValue = useMotionValue(0);
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        if (!inView) return;
        const controls = animateMotion(motionValue, value, {
            duration,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('he-IL')),
        });
        return controls.stop;
    }, [inView, value]);

    return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ─── Activity icon per type ───────────────────────────────────────────────────
const ACTIVITY_ICONS = {
    product:   { color: '#007AFF', Icon: Box },
    order:     { color: '#34C759', Icon: ShoppingCart },
    inventory: { color: '#FF9500', Icon: BarChart2 },
    coupon:    { color: '#5856D6', Icon: Tag },
    info:      { color: '#AEAEB2', Icon: Activity },
};

// ─── Glass card wrapper ───────────────────────────────────────────────────────
function Card({ title, subtitle, accent, action, children, className = '' }) {
    return (
        <motion.div
            className={`rounded-[22px] overflow-hidden ${className}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
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
        </motion.div>
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
                        <span className="text-[11px] font-black tracking-widest text-[#1D1D1F]">Live</span>
                    </div>
                    <PeriodSelector value={period} onChange={setPeriod} />
                </div>
            </motion.div>

            {/* ── Primary KPIs ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        title: 'הכנסות', icon: 'revenue', color: '#34C759', delay: 0,
                        value: `₪${kpis.totalRevenue.toLocaleString()}`,
                        subtitle: `₪${periodRevenue.toLocaleString()} — ${period === '1' ? 'היום' : `${period} ימים`}`,
                        trend: trendRevenue.value, trendUp: trendRevenue.up,
                        sparkData: periodData?.revenue,
                        tooltip: 'סך כל ההכנסות מהזמנות שהושלמו. לחץ לפירוט לפי יום.',
                        onClick: () => setDrilldown('revenue'),
                    },
                    {
                        title: 'עסקאות', icon: 'orders', color: '#007AFF', delay: 0.05,
                        value: kpis.totalOrders,
                        subtitle: `${kpis.pendingOrders} ממתינות · ${periodSales} בתקופה`,
                        trend: trendSales.value, trendUp: trendSales.up,
                        sparkData: periodData?.sales,
                        tooltip: 'מספר הזמנות שנקלטו. כולל ממתינות, הושלמו ובוטלו. לחץ לפירוט.',
                        onClick: () => setDrilldown('orders'),
                    },
                    {
                        title: 'יחס המרה', icon: 'traffic', color: '#5856D6', delay: 0.1,
                        value: `${kpis.conversionRate}%`,
                        subtitle: 'מכניסות ייחודיות',
                        trend: trendVisits.value, trendUp: trendVisits.up,
                        sparkData: periodData?.visits,
                        tooltip: 'אחוז הגולשים שביצעו רכישה. מחושב: הזמנות ÷ כניסות ייחודיות × 100.',
                        onClick: () => setDrilldown('conversion'),
                    },
                    {
                        title: 'ממוצע עסקה', icon: 'products', color: '#FF9500', delay: 0.15,
                        value: `₪${kpis.avgOrderValue.toLocaleString()}`,
                        subtitle: `${kpis.completedOrders} הזמנות הושלמו`,
                        sparkData: periodData?.revenue,
                        tooltip: 'ממוצע ערך הזמנה: סך הכנסות ÷ מספר הזמנות שהושלמו.',
                        onClick: () => setDrilldown('avg'),
                    },
                ].map((kpi, i) => (
                    <motion.div key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 400, damping: 28 }}
                    >
                        <AdminKPICard {...kpi} />
                    </motion.div>
                ))}
            </div>

            {/* ── Secondary KPIs ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        title: 'מלאי נמוך', icon: 'alert', color: '#FF3B30', delay: 0.2,
                        value: kpis.lowStockCount,
                        subtitle: 'מוצרים תחת סף',
                        tooltip: 'מספר מוצרים שמלאיים נמוך מסף ההתרעה שהוגדר לכל מוצר.',
                    },
                    {
                        title: 'פניות חדשות', icon: 'empty', color: '#FF9500', delay: 0.25,
                        value: kpis.contactsNew,
                        subtitle: 'ממתינות לטיפול',
                        tooltip: 'פניות דרך טופס יצירת קשר שטרם טופלו ועדיין פתוחות.',
                    },
                    {
                        title: 'כניסות', icon: 'traffic', color: '#007AFF', delay: 0.3,
                        value: periodVisits,
                        subtitle: period === '1' ? 'היום' : `${period} ימים`,
                        tooltip: 'מספר כניסות לאתר בתקופה הנבחרת. מבוסס על נתוני localStorage המקומי.',
                    },
                    {
                        title: 'קטלוג פעיל', icon: 'products', color: '#5856D6', delay: 0.35,
                        value: inventory.filter(p => p.isActive !== false).length,
                        subtitle: `מתוך ${inventory.length} מוצרים`,
                        tooltip: 'מוצרים המוצגים כעת בחנות. מוצרים שהוסתרו ידנית אינם נספרים.',
                    },
                ].map((kpi, i) => (
                    <motion.div key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 400, damping: 28 }}
                    >
                        <AdminKPICard {...kpi} />
                    </motion.div>
                ))}
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
                        <HeatGrid data={periodData.visits} color="#007AFF" labels={periodData.labels} />
                    ) : (
                        <div className="h-28 flex flex-col items-center justify-center gap-2 text-[#AEAEB2]">
                            <Activity size={22} className="opacity-40" />
                            <span className="text-sm font-medium">טרם הצטברו נתוני תנועה</span>
                        </div>
                    )}
                </Card>

                {/* Top Products — 1/3 width */}
                <Card title="מוצרים מובילים" subtitle="לפי הכנסות כוללות"
                    accent="linear-gradient(90deg,#5856D6,#007AFF)">
                    <div className="space-y-3.5">
                        {topProducts.length === 0 && (
                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                <Package size={24} className="text-[#AEAEB2] opacity-50" />
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
                                        : <Box size={13} className="text-[#AEAEB2]" />}
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
                        <HeatGrid data={periodData.revenue} color="#34C759" labels={periodData.labels} />
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
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <ShoppingCart size={24} className="text-[#AEAEB2] opacity-40" />
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
                        title="מלאי נמוך"
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
                            <span className="text-[10px] font-black text-[#AEAEB2] tracking-widest">
                                {activityLog.length} רשומות
                            </span>
                        }
                    >
                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar -mr-1 pr-1">
                            {activityLog.length === 0 && (
                                <p className="text-[#AEAEB2] text-sm text-center py-4">אין פעילות עדיין</p>
                            )}
                            {activityLog.slice(0, 15).map((entry, i) => {
                                const meta = ACTIVITY_ICONS[entry.type] || ACTIVITY_ICONS.info;
                                const IconComp = meta.Icon;
                                return (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="flex items-center gap-2.5 py-1.5 border-b border-black/04 last:border-0"
                                    >
                                        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: `${meta.color}12` }}>
                                            <IconComp size={12} style={{ color: meta.color }} />
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
                            label: 'תחזוקה', icon: <Wrench className="w-5 h-5" />,
                            desc: getSetting('maintenance_mode', false) ? 'כבה מצב תחזוקה' : 'הפעל מצב תחזוקה',
                            color: getSetting('maintenance_mode', false) ? '#FF3B30' : '#5856D6',
                            active: getSetting('maintenance_mode', false),
                            onClick: () => {
                                updateGlobalSettings({ maintenance_mode: !getSetting('maintenance_mode', false) });
                                showToast(getSetting('maintenance_mode', false) ? 'מצב תחזוקה כובה' : 'מצב תחזוקה הופעל', 'info');
                            }
                        },
                        {
                            label: 'הסתר מחירים', icon: <Tag className="w-5 h-5" />,
                            desc: getSetting('show_prices', true) ? 'הסתר מחירים' : 'הצג מחירים',
                            color: '#FF9500',
                            active: !getSetting('show_prices', true),
                            onClick: () => {
                                updateGlobalSettings({ show_prices: !getSetting('show_prices', true) });
                                showToast('הגדרת מחירים עודכנה', 'success');
                            }
                        },
                        {
                            label: 'תקן תמונות', icon: <Image className="w-5 h-5" />,
                            desc: 'סנכרן תמונות מוצרים',
                            color: '#007AFF',
                            active: false,
                            onClick: async () => {
                                const count = await repairProductImages();
                                showToast(count ? `תוקנו ${count} תמונות` : 'כל התמונות תקינות', 'success');
                            }
                        },
                        {
                            label: 'סנכרן מוצרים', icon: <RefreshCw className="w-5 h-5" />,
                            desc: 'רענן נתוני קטלוג',
                            color: '#34C759',
                            active: false,
                            onClick: async () => {
                                await reseedDatabase();
                                showToast('הקטלוג סונכרן בהצלחה', 'success');
                            }
                        },
                        {
                            label: 'הזמנות', icon: <Package className="w-5 h-5" />,
                            desc: `${kpis.pendingOrders} ממתינות לטיפול`,
                            color: kpis.pendingOrders > 0 ? '#FF3B30' : '#34C759',
                            active: kpis.pendingOrders > 0,
                            href: '/admin/orders'
                        },
                        {
                            label: 'HubSpot', icon: <ExternalLink className="w-5 h-5" />,
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
                            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                style={{ background: `${action.color}18`, color: action.color }}>
                                {action.icon}
                            </div>
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

            {/* ── KPI Drilldown Modal ────────────────────────────────────────── */}
            {(() => {
                const meta = {
                    revenue:    { title: 'פירוט הכנסות', color: '#34C759', data: periodData?.revenue, labels: periodData?.labels },
                    orders:     { title: 'פירוט עסקאות', color: '#007AFF', data: periodData?.sales,   labels: periodData?.labels },
                    conversion: { title: 'פירוט תנועה',  color: '#5856D6', data: periodData?.visits,  labels: periodData?.labels },
                    avg:        { title: 'ממוצע לפי מוצר', color: '#FF9500', data: null },
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
