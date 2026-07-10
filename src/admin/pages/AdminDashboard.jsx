/* eslint-disable */

import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, animate as animateMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Wrench, Tag, Image, RefreshCw, Package, ExternalLink,
    ShoppingCart, BarChart2, Layers, AlertTriangle, Box,
    Zap, TrendingUp, Users, MessageCircle, Mail, Activity, ChevronLeft,
    Target, Sparkles, ChevronDown, ChevronUp, CheckCircle2
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useSettings } from '../../context/SettingsContext';
import { AdminKPICard, AdminTabs, StatusBadge, HeatGrid, BarChart, GoalRing, InfoTooltip } from '../components/AdminComponents';
import { PALETTE, GLASS, RADIUS, SHADOW, GRADIENT, hexA, glow } from '../theme/tokens';
import DashDrillView from '../components/DashDrillView';
import initialProducts from '../../data/products';

// ─── Stage weights for pipeline forecast ─────────────────────────────────────
const STAGE_WEIGHTS = {
    'חדש': 0.05, 'ביצירת קשר': 0.15, 'בדיקת מלאי': 0.25,
    'הוצע מחיר': 0.40, 'ממתין לאישור': 0.70,
    'הועבר לספק': 0.85, 'בדרך': 0.92,
};
const CLOSED_STAGES = new Set(['נסגר', 'סופק', 'אבד', 'בוטל']);

// ─── Daily Briefing Card ──────────────────────────────────────────────────────
function DailyBriefing({ kpis, pipelineForecast, liveVisitors, navigate }) {
    const [open, setOpen] = useState(true);

    const items = useMemo(() => {
        const list = [];
        if (kpis.allPendingOrders > 0)
            list.push({ color: '#FF3B30', label: `${kpis.allPendingOrders} הזמנות ממתינות לאישור`, link: '/admin/orders' });
        if (kpis.dueReminders?.length > 0)
            list.push({ color: '#FF9500', label: `${kpis.dueReminders.length} תזכורות שפג תוקפן`, link: '/admin/orders' });
        if (kpis.lowStockCount > 0)
            list.push({ color: '#FF9500', label: `${kpis.lowStockCount} מוצרים במלאי נמוך`, link: '/admin/inventory' });
        if (kpis.contactsNew > 0)
            list.push({ color: '#007AFF', label: `${kpis.contactsNew} פניות חדשות מחכות לטיפול`, link: '/admin/communications' });
        if (kpis.stalledLeads > 0)
            list.push({ color: '#FF9500', label: `${kpis.stalledLeads} עסקאות מעוכבות בצינור`, link: '/admin/orders' });
        return list;
    }, [kpis]);

    const allGood = items.length === 0;
    const briefTone = allGood ? '#34C759' : '#007AFF';

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="overflow-hidden"
            style={{ ...GLASS.base, borderRadius: RADIUS.cardLg }}
        >
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: hexA(briefTone, 0.12), border: `1px solid ${hexA(briefTone, 0.22)}` }}
                        >
                            {allGood
                                ? <CheckCircle2 size={15} style={{ color: briefTone }} />
                                : <Sparkles size={15} style={{ color: briefTone }} />}
                        </div>
                        <span className="text-[13px] font-black text-[#1D1D1F] tracking-tight">
                            {allGood ? 'הכל תקין — עסק מעולה!' : `${items.length} פעולות מחכות לך`}
                        </span>
                        {liveVisitors > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                                style={{ background: 'rgba(52,199,89,0.12)', color: '#1A8C40', border: '1px solid rgba(52,199,89,0.22)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                                {liveVisitors} גולשים עכשיו
                            </span>
                        )}
                    </div>
                    <button onClick={() => setOpen(p => !p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }}>
                        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>

                <AnimatePresence>
                    {open && (
                        <motion.div
                            key="briefing-content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden' }}
                        >
                            {allGood ? (
                                <div className="flex items-center gap-2 py-2">
                                    <CheckCircle2 size={14} className="text-[#34C759]" />
                                    <span className="text-[12px] font-medium text-[#6E6E73]">אין פעולות דחופות. הצינור נקי.</span>
                                    {pipelineForecast.count > 0 && (
                                        <span className="text-[12px] font-bold text-[#007AFF]">
                                            צפי: ₪{Math.round(pipelineForecast.weighted).toLocaleString()} מ-{pipelineForecast.count} עסקאות פתוחות
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                                    {items.map((item, i) => (
                                        <motion.button
                                            key={i}
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => navigate(item.link)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-right cursor-pointer w-full transition-all active:scale-98"
                                            style={{ background: `${item.color}0a`, border: `1px solid ${item.color}20` }}
                                            whileHover={{ y: -1, boxShadow: `0 4px 12px ${item.color}18` }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                            <span className="text-[11px] font-bold truncate" style={{ color: item.color }}>{item.label}</span>
                                        </motion.button>
                                    ))}
                                    {pipelineForecast.weighted > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, x: 8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: items.length * 0.05 }}
                                            onClick={() => navigate('/admin/orders')}
                                            className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-right cursor-pointer w-full"
                                            style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.18)' }}
                                            whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(52,199,89,0.14)' }}
                                        >
                                            <Target size={12} className="text-[#34C759] flex-shrink-0" />
                                            <span className="text-[11px] font-bold text-[#1A8C40]">
                                                צפי 30י׳: ₪{Math.round(pipelineForecast.weighted).toLocaleString()}
                                            </span>
                                        </motion.button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Revenue Forecast Widget ──────────────────────────────────────────────────
function RevenueForecastWidget({ forecast, onOpen, onStage }) {
    if (forecast.count === 0) return null;
    const maxVal = Math.max(...forecast.byStage.map(s => s.value), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, delay: 0.1 }}
            className="overflow-hidden cursor-pointer"
            style={{ ...GLASS.base, borderRadius: RADIUS.cardLg }}
            onClick={() => onOpen?.()}
            whileHover={{ y: -3, boxShadow: SHADOW.lg }}
        >
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                            style={{ background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.22)' }}>
                            <Target size={15} className="text-[#34C759]" />
                        </div>
                        <div>
                            <p className="text-[13px] font-black text-[#1D1D1F] tracking-tight">תחזית צינור</p>
                            <p className="text-[10px] font-medium text-[#AEAEB2]">{forecast.count} עסקאות פתוחות</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[22px] font-black tracking-tighter text-[#1D1D1F] leading-none">
                            ₪{Math.round(forecast.weighted).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-[#AEAEB2] mt-0.5">צפי משוקלל</p>
                    </div>
                </div>

                {/* Stage bars */}
                <div className="space-y-1.5">
                    {forecast.byStage.slice(0, 5).map(s => (
                        <div key={s.stage}
                            onClick={(e) => { e.stopPropagation(); onStage?.(s.stage); }}
                            tabIndex={0} role="button"
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onStage?.(s.stage); } }}
                            className="flex items-center gap-2 cursor-pointer rounded-lg px-1 -mx-1 py-0.5 hover:bg-[#007AFF]/06 transition-colors focus:outline-none">
                            <span className="text-[9px] font-bold text-[#6E6E73] w-24 text-right truncate flex-shrink-0">{s.stage}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(s.value / maxVal) * 100}%` }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    className="h-full rounded-full"
                                    style={{ background: hexA('#007AFF', 0.35 + s.weight * 0.5) }}
                                />
                            </div>
                            <span className="text-[9px] font-black text-[#1D1D1F] w-16 text-left">
                                ₪{s.value.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-[#AEAEB2] w-8">
                                {Math.round(s.weight * 100)}%
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t border-black/05 flex items-center justify-between">
                    <span className="text-[10px] text-[#AEAEB2]">
                        צינור כולל: ₪{forecast.totalPipeline.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-black text-[#34C759]">
                        יחס: {forecast.totalPipeline > 0 ? Math.round(forecast.weighted / forecast.totalPipeline * 100) : 0}%
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

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
function Card({ title, subtitle, accent, action, children, className = '', titleTooltip }) {
    return (
        <motion.div
            className={`rounded-[22px] overflow-hidden ${className}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            style={{ ...GLASS.base, borderRadius: RADIUS.cardLg }}
        >
            <div className="p-5">
                {(title || action) && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-right">
                            <span className="flex items-center gap-0.5">
                                <h3 className="font-black text-[#1D1D1F] text-[15px] tracking-tight">{title}</h3>
                                {titleTooltip && (() => { const t = typeof titleTooltip === 'object' ? titleTooltip : { text: titleTooltip }; return <InfoTooltip text={t.text} source={t.source} link={t.link} linkLabel={t.linkLabel} />; })()}
                            </span>
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

// ─── In-tab loading placeholder ───────────────────────────────────────────────
function DashLoading({ label = 'טוען נתונים…', height = 'h-28' }) {
    return (
        <div className={`${height} flex flex-col items-center justify-center gap-2 text-[#AEAEB2]`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 rounded-full"
                style={{ border: '2px solid rgba(0,122,255,0.22)', borderTopColor: '#007AFF' }}
            />
            <span className="text-xs font-medium">{label}</span>
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
                    style={{ color: value === o.v ? '#007AFF' : '#86868B' }}>
                    {value === o.v && (
                        <motion.div layoutId="period-pill" className="absolute inset-0 rounded-xl"
                            style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.22)', boxShadow: '0 2px 8px rgba(0,122,255,0.12)' }}
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

// ─── Drill helpers (shared by the babushka detail drawer) ─────────────────────
const computeStats = (data) => {
    if (!data || data.length === 0) return null;
    const nonZero = data.filter(v => v > 0);
    const total = data.reduce((a, b) => a + b, 0);
    const avg = nonZero.length > 0 ? Math.round(total / nonZero.length) : 0;
    const peak = Math.max(...data);
    const peakIdx = data.lastIndexOf(peak);
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half).reduce((a, b) => a + b, 0);
    const secondHalf = data.slice(half).reduce((a, b) => a + b, 0);
    const trend = firstHalf > 0 ? Math.round((secondHalf - firstHalf) / firstHalf * 100) : (secondHalf > 0 ? 100 : 0);
    return { total, avg, peak, peakIdx, trend, activeDays: nonZero.length };
};

// A tidy stat grid used across every drill level.
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#1D1D1F';
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-[14px] p-3 text-center"
                        style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                        <p className="font-black text-[16px] tracking-tight leading-none" style={{ color: c }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

// A clickable/inert record row inside a drill level. Clickable rows push a deeper level.
function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}

const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

export default function AdminDashboard() {
    const { kpis, orders, quotes, analytics, inventory, activityLog, repairProductImages, reseedDatabase, clearReminder } = useAdminData();
    const { showToast } = useAdminToast();
    const { getSetting, updateGlobalSettings } = useSettings();
    const navigate = useNavigate();
    const [period, setPeriod] = useState('30');
    const [dashTab, setDashTab] = useState('today');

    // ── Babushka drill stack — each entry is one nested detail level ──────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null); // retains last level so the drawer content persists through its exit animation
    const openDrill  = (level) => setDrillStack([level]);          // fresh root level
    const pushDrill  = (level) => setDrillStack(s => [...s, level]); // deeper level
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };  // footer navigation

    // Loading proxy: analytics is null until the first Firestore snapshot resolves
    const dataLoading = analytics == null;

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

    // Daily conversion rate series: orders/visits per day (0–100 scale)
    const conversionSpark = useMemo(() => {
        if (!periodData) return [];
        return periodData.visits.map((v, i) => {
            const s = periodData.sales[i] || 0;
            return v > 0 ? parseFloat(((s / v) * 100).toFixed(2)) : 0;
        });
    }, [periodData]);

    // Daily average order value series: revenue/sales per day
    const avgOrderSpark = useMemo(() => {
        if (!periodData) return [];
        return periodData.revenue.map((rev, i) => {
            const cnt = periodData.sales[i] || 0;
            return cnt > 0 ? Math.round(rev / cnt) : 0;
        });
    }, [periodData]);

    // Real trends computed from data
    const trendRevenue = useMemo(() => computeTrend(periodData?.revenue),    [periodData]);
    const trendSales   = useMemo(() => computeTrend(periodData?.sales),      [periodData]);
    const trendVisits  = useMemo(() => computeTrend(conversionSpark),        [conversionSpark]);

    // Monthly goal — reads from settings if set, else auto-calculates 1.5× last month
    const monthlyGoal = useMemo(() => {
        const current = kpis.thisMonthRevenue || 0;
        const manualTarget = getSetting('monthly_revenue_target', 0);
        if (manualTarget > 0) return { current, target: manualTarget, isManual: true };
        if (!analytics) return { current, target: 5000, isManual: false };
        const dayOfMonth = new Date().getDate();
        const lastMonthRevenue = analytics.revenue
            .slice(0, Math.max(0, analytics.revenue.length - dayOfMonth))
            .reduce((a, b) => a + b, 0);
        const target = Math.max(Math.round(lastMonthRevenue * 1.5), 5000);
        return { current, target, isManual: false };
    }, [analytics, kpis, getSetting]);

    const recentOrders = useMemo(() =>
        [...orders].sort((a, b) => b.dateTs - a.dateTs).slice(0, 7),
        [orders]
    );

    const topProducts = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const pid = String(item.id ?? '');
                if (!pid) return;
                if (!map[pid]) {
                    const inv = inventory.find(p => String(p.id) === pid);
                    const backup = initialProducts.find(p => String(p.id) === pid);
                    map[pid] = {
                        id: pid,
                        title: item.title || inv?.title || inv?.name || backup?.title || backup?.name || pid,
                        image: item.image || inv?.image || backup?.image,
                        revenue: 0,
                        count: 0,
                    };
                }
                map[pid].revenue += (item.price || 0) * (item.qty || 1);
                map[pid].count += item.qty || 1;
            });
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [orders, inventory]);

    const lowStock = inventory.filter(p => p.stock <= p.threshold).slice(0, 6);

    // ── Derived datasets feeding the drill drawer (real data only) ────────────
    // Per-product sales aggregated from all orders → { pid: { revenue, count } }
    const productSalesMap = useMemo(() => {
        const map = {};
        orders.forEach(o => (o.items || []).forEach(item => {
            const pid = String(item.id ?? '');
            if (!pid) return;
            if (!map[pid]) map[pid] = { revenue: 0, count: 0 };
            map[pid].revenue += (Number(item.price) || 0) * (Number(item.qty) || 1);
            map[pid].count += Number(item.qty) || 1;
        }));
        return map;
    }, [orders]);

    const findProduct = (id) => {
        const pid = String(id);
        return inventory.find(p => String(p.id) === pid) || initialProducts.find(p => String(p.id) === pid) || null;
    };

    // Every product below its own alert threshold, worst first.
    const lowStockItems = useMemo(() => inventory.filter(p => {
        const stock = Number(p.stock ?? p.quantity ?? 0);
        const threshold = Number(p.stockThreshold ?? p.minStock ?? p.threshold ?? 3);
        return stock <= threshold;
    }).sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0)), [inventory]);

    // Orders still awaiting approval/handling, newest first.
    const pendingOrdersList = useMemo(() =>
        orders.filter(o => o.status === 'ממתין' || o.status === 'חדש').sort((a, b) => b.dateTs - a.dateTs),
        [orders]
    );

    // Open quotes for a given pipeline stage.
    const quotesInStage = (stage) =>
        quotes.filter(q => q.status === stage && !CLOSED_STAGES.has(q.status)).sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));

    const orderDateStr = (ts) => ts ? new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const quoteVal = (q) => Number(q.subtotal) || (q.items || []).reduce((s, it) =>
        s + (Number(it.salePrice || it.price) || 0) * (Number(it.qty || it.quantity) || 1), 0);

    // ── Live visitors (last 5 min from Firestore page_views) ─────────────────
    const [liveVisitors, setLiveVisitors] = useState(0);
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, 'page_views'), where('date', '==', today));
        const unsub = onSnapshot(q, snap => {
            const fiveMinAgo = Date.now() - 5 * 60 * 1000;
            const active = new Set(
                snap.docs
                    .filter(d => {
                        const ts = d.data().ts;
                        const ms = ts?.toMillis ? ts.toMillis() : (ts?.seconds ? ts.seconds * 1000 : 0);
                        return ms > fiveMinAgo;
                    })
                    .map(d => d.data().sessionId).filter(Boolean)
            );
            setLiveVisitors(active.size);
        }, () => setLiveVisitors(0));
        return unsub;
    }, []);

    // ── Pipeline Revenue Forecast (stage-weighted) ────────────────────────────
    const pipelineForecast = useMemo(() => {
        const open = quotes.filter(q => q.status && !CLOSED_STAGES.has(q.status));
        const getVal = q => Number(q.subtotal) || (q.items || []).reduce((s, it) =>
            s + (Number(it.salePrice || it.price) || 0) * (Number(it.qty || it.quantity) || 1), 0);
        const weighted = open.reduce((s, q) => s + getVal(q) * (STAGE_WEIGHTS[q.status] || 0.1), 0);
        const total    = open.reduce((s, q) => s + getVal(q), 0);
        const byStage  = Object.entries(STAGE_WEIGHTS).map(([stage, weight]) => {
            const sq = open.filter(q => q.status === stage);
            const val = sq.reduce((s, q) => s + getVal(q), 0);
            return { stage, weight, count: sq.length, value: val, expected: val * weight };
        }).filter(s => s.count > 0);
        return { weighted, totalPipeline: total, byStage, count: open.length };
    }, [quotes]);

    const dateStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-5" dir="rtl">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                    <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(PALETTE.azure, 0.12), border: `1px solid ${hexA(PALETTE.azure, 0.22)}`, boxShadow: `${SHADOW.sm}, ${SHADOW.specular}` }}>
                        <Activity size={22} color={PALETTE.azure} />
                    </div>
                    <div className="text-right">
                        <h1 className="text-xl sm:text-3xl font-black tracking-tighter"
                            style={{ background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{greeting()}, הנהלת NextClass</h1>
                        <p className="text-[#86868B] text-xs sm:text-sm mt-1 font-medium">{dateStr} · נתוני אמת</p>
                    </div>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    {/* Live dot */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full relative"
                        style={{ background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.28)', boxShadow: '0 2px 8px rgba(52,199,89,0.15)' }}>
                        <span className="relative flex items-center justify-center w-2 h-2">
                            <span className="absolute inset-0 rounded-full bg-[#34C759] animate-ping opacity-60" />
                            <span className="relative w-2 h-2 rounded-full bg-[#34C759]" />
                        </span>
                        <span className="text-[11px] font-black tracking-widest text-[#1D1D1F]">Live</span>
                    </div>
                    <PeriodSelector value={period} onChange={setPeriod} />
                </div>
            </motion.div>

            {/* ── Daily Briefing ───────────────────────────────────────────── */}
            <DailyBriefing kpis={kpis} pipelineForecast={pipelineForecast} liveVisitors={liveVisitors} navigate={navigate} />

            {/* ── Due Reminders Priority Card ──────────────────────────────── */}
            {kpis.dueReminders?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="overflow-hidden"
                    style={{ ...GLASS.base, borderRadius: RADIUS.card }}
                >
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.22)' }}>
                                    <AlertTriangle size={15} className="text-[#FF3B30]" />
                                </div>
                                <span className="text-[10px] font-black text-[#FF3B30] uppercase tracking-widest">
                                    {kpis.dueReminders.length} תזכורות לטיפול
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inset-0 rounded-full bg-[#FF3B30] opacity-60" />
                                    <span className="relative w-2 h-2 rounded-full bg-[#FF3B30]" />
                                </span>
                                <span className="text-[10px] font-black text-[#FF3B30]">דחוף</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {kpis.dueReminders.slice(0, 4).map((r, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="flex-1 min-w-0 text-right">
                                        <p
                                            className="text-[12px] font-bold truncate cursor-pointer hover:underline"
                                            style={{ color: '#007AFF' }}
                                            onClick={() => navigate(`/admin/orders?quoteId=${r.quoteId}`)}
                                        >
                                            {r.quote?.contactName || r.quote?.institution || r.quoteId}
                                        </p>
                                        <p className="text-[#FF3B30] text-[10px] font-medium truncate">{r.note || 'מעקב נדרש'}</p>
                                    </div>
                                    <span className="text-[#FF9500] text-[10px] font-black shrink-0">
                                        {new Date(r.dueAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => clearReminder(r.quoteId)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                        style={{ background: 'rgba(52,199,89,0.15)', color: '#34C759' }}
                                        title="סמן כטופל"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                        {kpis.dueReminders.length > 4 && (
                            <button onClick={() => navigate('/admin/orders')} className="mt-3 text-[11px] font-black text-[#FF9500] hover:underline">
                                + עוד {kpis.dueReminders.length - 4} תזכורות →
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── KPI band — 4 headline metrics only (no card sprawl) ───────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    {
                        title: 'מחזור הכנסות', icon: 'revenue', color: '#34C759', delay: 0,
                        value: `₪${kpis.totalRevenue.toLocaleString()}`,
                        subtitle: `₪${periodRevenue.toLocaleString()} — ${period === '1' ? 'היום' : `${period} ימים`}`,
                        trend: trendRevenue.value, trendUp: trendRevenue.up,
                        sparkData: periodData && periodData.revenue.length >= 2 ? periodData.revenue : (analytics?.revenue?.slice(-7) || []),
                        tooltip: { text: 'סך כל ההכנסות מהזמנות שנסגרו. מצטבר מכלל הזמנות שהושלמו.', source: 'Firestore · orders · total', link: '/admin/orders', linkLabel: 'ראה הזמנות' },
                        onClick: () => openDrill({ type: 'revenue' }),
                    },
                    {
                        title: 'הזמנות ממתינות', icon: 'orders', color: '#FF9500', delay: 0.05,
                        value: kpis.allPendingOrders,
                        subtitle: 'ממתינות לאישור',
                        tooltip: { text: 'הזמנות שטרם אושרו או טופלו — דורשות תשומת לב.', source: 'Firestore · orders (status: ממתין/חדש)', link: '/admin/orders', linkLabel: 'ניהול הזמנות' },
                        onClick: () => openDrill({ type: 'pending' }),
                    },
                    {
                        title: 'שווי Pipeline', icon: 'traffic', color: '#007AFF', delay: 0.1,
                        value: `₪${Math.round(pipelineForecast.totalPipeline).toLocaleString()}`,
                        subtitle: `${pipelineForecast.count} עסקאות פתוחות`,
                        tooltip: { text: 'סך שווי כל ההצעות הפתוחות בצינור המכירות (לפני שקלול הסתברות).', source: 'Firestore · quotes (פתוחות) · subtotal', link: '/admin/orders', linkLabel: 'ניהול הצעות' },
                        onClick: () => openDrill({ type: 'pipeline' }),
                    },
                    {
                        title: 'מלאי נמוך', icon: 'alert', color: '#FF3B30', delay: 0.15,
                        value: kpis.lowStockCount,
                        subtitle: 'מוצרים תחת סף',
                        tooltip: { text: 'מוצרים שמלאיהם נמוך מסף ההתרעה שהוגדר לכל מוצר בנפרד.', source: 'Firestore · inventory · stock ≤ threshold', link: '/admin/inventory', linkLabel: 'ניהול מלאי' },
                        onClick: () => openDrill({ type: 'lowStock' }),
                    },
                ].map((kpi) => (
                    <AdminKPICard key={kpi.title} {...kpi} loading={dataLoading} />
                ))}
            </div>

            {/* ── In-page tabs — curated to kill the endless scroll ─────────── */}
            <div className="flex justify-center sm:justify-start">
                <AdminTabs
                    id="dashboard-tab-pill"
                    tabs={[{ id: 'today', label: 'היום' }, { id: 'trends', label: 'מגמות' }]}
                    active={dashTab}
                    onChange={setDashTab}
                />
            </div>

            <AnimatePresence mode="wait">
                {dashTab === 'today' && (
                    <motion.div key="today"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            {/* Recent Orders */}
                            <Card
                                title="הזמנות אחרונות"
                                accent="linear-gradient(90deg,#007AFF,#5E5CE6)"
                                className="lg:col-span-2"
                                action={
                                    <Link to="/admin/orders" className="text-[#007AFF] text-xs font-bold hover:underline flex items-center gap-0.5">
                                        צפה בכולן <ChevronLeft size={12} strokeWidth={2.5} />
                                    </Link>
                                }
                            >
                                {dataLoading ? (
                                    <DashLoading height="h-40" />
                                ) : recentOrders.length === 0 ? (
                                    <div className="py-10 text-center flex flex-col items-center gap-2">
                                        <ShoppingCart size={24} className="text-[#AEAEB2] opacity-40" />
                                        <p className="text-[#AEAEB2] text-sm">אין הזמנות עדיין</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {recentOrders.map((order, i) => (
                                            <motion.div
                                                key={order.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                onClick={() => openDrill({ type: 'order', id: order.id })}
                                                tabIndex={0}
                                                role="button"
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'order', id: order.id }); } }}
                                                className="flex items-center gap-3 py-2.5 border-b border-black/04 last:border-0 cursor-pointer hover:bg-[#007AFF]/04 rounded-xl px-2 -mx-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                            >
                                                <StatusBadge status={order.status} />
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-[#007AFF] text-[12px] font-bold truncate hover:underline"
                                                        onClick={e => { e.stopPropagation(); navigate(`/admin/customers?search=${encodeURIComponent(order.customer)}`); }}>
                                                        {order.customer}
                                                    </p>
                                                    <p className="text-[#AEAEB2] text-[10px] truncate hover:text-[#007AFF] transition-colors cursor-pointer"
                                                        onClick={e => { e.stopPropagation(); navigate(`/admin/inventory?open=${encodeURIComponent(order.product)}`); }}>
                                                        {order.product}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-[#1D1D1F] font-black text-sm">₪{order.total.toLocaleString()}</p>
                                                    <p className="text-[#AEAEB2] text-[9px] font-mono">{order.id}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Right column — Monthly Goal Ring + Activity Feed */}
                            <div className="space-y-5">
                                {/* Monthly Goal Ring */}
                                <Card title="יעד הכנסות חודשי" subtitle="הכנסות החודש vs. יעד" accent="linear-gradient(90deg,#007AFF,#5E5CE6)"
                                    titleTooltip={{ text: 'יעד חודשי ניתן לקביעה בהגדרות. אם לא הוגדר — מחושב אוטומטית ×1.5 מחודש קודם.', source: 'Firestore · cms_settings · monthly_revenue_target', link: '/admin/settings', linkLabel: 'הגדר יעד' }}>
                                    {dataLoading ? (
                                        <DashLoading height="h-40" label="טוען יעד…" />
                                    ) : (
                                        <>
                                            <div
                                                onClick={() => openDrill({ type: 'goal' })}
                                                tabIndex={0} role="button"
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'goal' }); } }}
                                                className="cursor-pointer rounded-2xl -m-1 p-1 transition-colors hover:bg-black/03 focus:outline-none"
                                            >
                                                <GoalRing
                                                    value={monthlyGoal.current}
                                                    target={monthlyGoal.target}
                                                    color="#34C759"
                                                    label="הכנסות החודש"
                                                    subtitle={monthlyGoal.isManual ? `יעד ידני: ₪${monthlyGoal.target.toLocaleString()}` : `אוטומטי: ×1.5 מהחודש הקודם`}
                                                    size={100}
                                                />
                                            </div>
                                            {!monthlyGoal.isManual && (
                                                <button
                                                    onClick={() => navigate('/admin/settings')}
                                                    className="mt-3 w-full text-center text-[10px] font-bold text-[#007AFF] hover:underline"
                                                >
                                                    הגדר יעד ידני בהגדרות
                                                </button>
                                            )}
                                        </>
                                    )}
                                </Card>

                                {/* Activity Feed */}
                                <Card
                                    title="יומן פעילות"
                                    accent="linear-gradient(90deg,#5E5CE6,#007AFF)"
                                    action={
                                        <span className="text-[10px] font-black text-[#AEAEB2] tracking-widest">
                                            {activityLog.length} רשומות
                                        </span>
                                    }
                                >
                                    {dataLoading ? (
                                        <DashLoading height="h-40" label="טוען פעילות…" />
                                    ) : activityLog.length === 0 ? (
                                        <p className="text-[#AEAEB2] text-sm text-center py-4">אין פעילות עדיין</p>
                                    ) : (
                                        <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar -mr-1 pr-1">
                                            {activityLog.slice(0, 15).map((entry, i) => {
                                                const meta = ACTIVITY_ICONS[entry.type] || ACTIVITY_ICONS.info;
                                                const IconComp = meta.Icon;
                                                return (
                                                    <motion.div
                                                        key={entry.id}
                                                        initial={{ opacity: 0, x: 8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.02 }}
                                                        onClick={() => openDrill({ type: 'activity', entry })}
                                                        tabIndex={0} role="button"
                                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'activity', entry }); } }}
                                                        className="flex items-center gap-2.5 py-1.5 border-b border-black/04 last:border-0 cursor-pointer hover:bg-black/03 rounded-lg px-1.5 -mx-1.5 transition-colors focus:outline-none"
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
                                    )}
                                </Card>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Card title="פעולות מהירות" subtitle="ניהול האתר בלחיצה אחת" accent="linear-gradient(90deg,#5E5CE6,#007AFF)">
                            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                                {[
                                    {
                                        label: 'תחזוקה', icon: <Wrench className="w-5 h-5" />,
                                        desc: getSetting('maintenance_mode', false) ? 'כבה מצב תחזוקה' : 'הפעל מצב תחזוקה',
                                        color: getSetting('maintenance_mode', false) ? '#FF3B30' : '#007AFF',
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
                                            background: action.active ? `${action.color}14` : 'rgba(255,255,255,0.72)',
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)',
                                            border: `1px solid ${action.active ? action.color + '35' : 'rgba(255,255,255,0.7)'}`,
                                            boxShadow: action.active ? `0 4px 16px ${action.color}20` : '0 2px 8px rgba(0,0,0,0.05)',
                                        }}
                                    >
                                        <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                                            style={{ background: `${action.color}18`, color: action.color }}>
                                            {action.icon}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-[#1D1D1F] leading-tight">{action.label}</p>
                                            <p className="hidden sm:block text-[9px] text-[#AEAEB2] mt-0.5 leading-snug">{action.desc}</p>
                                        </div>
                                        {action.active && (
                                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: action.color }} />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {dashTab === 'trends' && (
                    <motion.div key="trends"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-5"
                    >
                        {/* Traffic + Top Products */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            {/* Traffic Chart — 2/3 width */}
                            <Card
                                title="תנועה לאתר"
                                subtitle={period === '1' ? 'היום' : `${period} ימים אחרונים`}
                                accent="linear-gradient(90deg,#007AFF,#5E5CE6)"
                                className="lg:col-span-2"
                                titleTooltip={{ text: 'מפת חום של כניסות ייחודיות לאתר לפי יום. כל תא = יום אחד. עוצמת הצבע = כמות הכניסות.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}
                                action={
                                    <span className="text-[#007AFF] text-xs font-black">
                                        {periodVisits.toLocaleString()} כניסות
                                    </span>
                                }
                            >
                                <div
                                    onClick={() => openDrill({ type: 'traffic' })}
                                    tabIndex={0} role="button"
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'traffic' }); } }}
                                    className="cursor-pointer rounded-2xl transition-colors hover:bg-[#007AFF]/03 focus:outline-none"
                                >
                                    {dataLoading ? (
                                        <DashLoading />
                                    ) : periodData && periodData.visits.some(v => v > 0) ? (
                                        <HeatGrid data={periodData.visits} color="#007AFF" labels={periodData.labels} />
                                    ) : (
                                        <div className="h-28 flex flex-col items-center justify-center gap-2 text-[#AEAEB2]">
                                            <Activity size={22} className="opacity-40" />
                                            <span className="text-sm font-medium">טרם הצטברו נתוני תנועה</span>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Top Products — 1/3 width */}
                            <Card title="מוצרים מובילים" subtitle="לפי הכנסות כוללות"
                                accent="linear-gradient(90deg,#5E5CE6,#007AFF)"
                                titleTooltip={{ text: 'המוצרים שייצרו את ההכנסה הגבוהה ביותר. מחושב ממסד ההזמנות.', source: 'Firestore · orders · productId + total', link: '/admin/inventory', linkLabel: 'ניהול מוצרים' }}>
                                {dataLoading ? (
                                    <DashLoading label="טוען מוצרים…" />
                                ) : topProducts.length === 0 ? (
                                    <div className="py-8 text-center flex flex-col items-center gap-2">
                                        <Package size={24} className="text-[#AEAEB2] opacity-50" />
                                        <p className="text-[#AEAEB2] text-sm">אין הזמנות עדיין</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {topProducts.map((p, i) => (
                                            <div key={i}
                                                onClick={() => openDrill({ type: 'product', id: p.id, fallback: { title: p.title, image: p.image } })}
                                                tabIndex={0} role="button"
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'product', id: p.id, fallback: { title: p.title, image: p.image } }); } }}
                                                className="flex items-center gap-3 group/row transition-all hover:translate-x-[-4px] cursor-pointer focus:outline-none">
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
                                                            style={{ background: '#007AFF' }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-[#6E6E73] text-[11px] font-bold shrink-0">₪{p.revenue.toLocaleString()}</span>
                                                <ChevronLeft size={13} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* Revenue Heat + Daily Sales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            <Card
                                title="מחזור הכנסות"
                                subtitle={`${period === '1' ? 'היום' : `${period} ימים`} · ₪ ביחידה`}
                                accent="linear-gradient(90deg,#34C759,#30D158)"
                                className="lg:col-span-2"
                                titleTooltip={{ text: 'הכנסות כספיות לפי יום. כל תא מייצג יום אחד — עוצמת הצבע = סכום ההכנסות באותו יום.', source: 'Firestore · analytics · revenue[]', link: '/admin/orders', linkLabel: 'ראה הזמנות' }}
                                action={
                                    <span className="text-xs font-black text-[#34C759]">
                                        ₪{periodRevenue.toLocaleString()}
                                    </span>
                                }
                            >
                                <div
                                    onClick={() => openDrill({ type: 'revenue' })}
                                    tabIndex={0} role="button"
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'revenue' }); } }}
                                    className="cursor-pointer rounded-2xl transition-colors hover:bg-[#34C759]/03 focus:outline-none"
                                >
                                    {dataLoading ? (
                                        <DashLoading label="טוען הכנסות…" />
                                    ) : periodData && periodData.revenue.some(v => v > 0) ? (
                                        <HeatGrid data={periodData.revenue} color="#34C759" labels={periodData.labels} />
                                    ) : (
                                        <div className="h-24 flex items-center justify-center text-[#AEAEB2] text-sm">
                                            טרם בוצעו עסקאות
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Daily Sales Bar Chart */}
                            <Card
                                title="מכירות יומיות"
                                subtitle="כמות עסקאות לפי יום"
                                accent="linear-gradient(90deg,#007AFF,#5E5CE6)"
                                titleTooltip={{ text: 'כמות העסקאות שנסגרו בכל יום. כל עמודה = יום אחד. מקור: נתוני analytics מ-Firestore.', source: 'Firestore · analytics · sales[]', link: '/admin/orders', linkLabel: 'ניהול הזמנות' }}
                                action={<span className="text-xs font-black text-[#007AFF]">{periodSales} עסקאות</span>}
                            >
                                <div
                                    onClick={() => openDrill({ type: 'sales' })}
                                    tabIndex={0} role="button"
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'sales' }); } }}
                                    className="cursor-pointer rounded-2xl transition-colors hover:bg-[#007AFF]/03 focus:outline-none"
                                >
                                    {dataLoading ? (
                                        <DashLoading height="h-20" label="טוען מכירות…" />
                                    ) : periodData && periodData.sales.some(v => v > 0) ? (
                                        <BarChart data={periodData.sales} color="#007AFF" labels={periodData.labels} height={80} />
                                    ) : (
                                        <div className="h-20 flex items-center justify-center text-[#AEAEB2] text-sm">
                                            טרם בוצעו עסקאות
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Pipeline Forecast */}
                        {pipelineForecast.count > 0 && (
                            <RevenueForecastWidget
                                forecast={pipelineForecast}
                                onOpen={() => openDrill({ type: 'pipeline' })}
                                onStage={(stage) => openDrill({ type: 'stage', stage })}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


            {/* ── Babushka Drill Drawer — nested glass detail view ───────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                const periodLabel = period === '1' ? 'היום' : `${period} ימים אחרונים`;

                if (!shown) {
                    return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;
                }

                let title = '', subtitle = '', icon = null, accent = '#007AFF', footer = null, body = null;

                if (shown.type === 'revenue') {
                    const stats = computeStats(periodData?.revenue);
                    const hasData = periodData?.revenue?.some(v => v > 0);
                    title = 'פירוט הכנסות'; subtitle = `${periodLabel} · מצטבר`; accent = '#34C759';
                    icon = <TrendingUp size={17} color="#34C759" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ בתקופה', value: `₪${(stats?.total || 0).toLocaleString()}`, color: '#34C759' },
                                { label: 'ממוצע יומי', value: `₪${(stats?.avg || 0).toLocaleString()}` },
                                { label: 'שיא יומי', value: `₪${(stats?.peak || 0).toLocaleString()}` },
                                { label: 'מגמה', value: `${(stats?.trend || 0) >= 0 ? '+' : ''}${stats?.trend || 0}%`, color: (stats?.trend || 0) >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {hasData ? (
                                <div>
                                    <p className="text-[11px] font-bold text-[#86868B] mb-3">{periodLabel}</p>
                                    <BarChart data={periodData.revenue} color="#34C759" labels={periodData.labels || []} height={140} />
                                </div>
                            ) : <DrillEmpty icon={TrendingUp} text="טרם נרשמו הכנסות בתקופה זו" />}
                            {topProducts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פירוט לפי מוצר — לחץ לצלילה</p>
                                    {topProducts.map((p, i) => (
                                        <DrillRow key={p.id || i} delay={i * 0.04} tone="#34C759"
                                            onClick={() => pushDrill({ type: 'product', id: p.id, fallback: { title: p.title, image: p.image } })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={p.title}
                                            subtitle={`${p.count} יח׳ נמכרו`}
                                            trailing={<span className="text-[12px] font-black text-[#34C759] shrink-0">₪{p.revenue.toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'pending') {
                    title = 'הזמנות ממתינות'; subtitle = `${pendingOrdersList.length} ממתינות לאישור`; accent = '#FF9500';
                    icon = <ShoppingCart size={17} color="#FF9500" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ממתינות', value: pendingOrdersList.length, color: '#FF9500' },
                                { label: 'סה״כ הזמנות', value: kpis.totalOrders, color: '#007AFF' },
                                { label: 'הכנסות', value: `₪${kpis.totalRevenue.toLocaleString()}`, color: '#34C759' },
                            ]} />
                            {pendingOrdersList.length === 0 ? (
                                <DrillEmpty icon={CheckCircle2} text="אין הזמנות ממתינות — הכל טופל 🎉" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">רשימת הזמנות — לחץ לפרטים</p>
                                    {pendingOrdersList.slice(0, 12).map((o, i) => (
                                        <DrillRow key={o.id} delay={i * 0.03} tone="#FF9500"
                                            onClick={() => pushDrill({ type: 'order', id: o.id })}
                                            leading={<StatusBadge status={o.status} />}
                                            title={o.customer || 'לקוח'}
                                            subtitle={o.product || `${(o.items || []).length} פריטים · ${orderDateStr(o.dateTs)}`}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{(o.total || 0).toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'pipeline') {
                    title = 'שווי Pipeline'; subtitle = `${pipelineForecast.count} עסקאות פתוחות`; accent = '#007AFF';
                    icon = <Target size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לניהול הצעות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'שווי צינור', value: `₪${Math.round(pipelineForecast.totalPipeline).toLocaleString()}`, color: '#007AFF' },
                                { label: 'צפי משוקלל', value: `₪${Math.round(pipelineForecast.weighted).toLocaleString()}`, color: '#34C759' },
                                { label: 'עסקאות', value: pipelineForecast.count, color: '#5856D6' },
                            ]} />
                            {pipelineForecast.byStage.length === 0 ? (
                                <DrillEmpty icon={Target} text="אין עסקאות פתוחות בצינור" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">שלבי צינור — לחץ לצלילה</p>
                                    {pipelineForecast.byStage.map((s, i) => (
                                        <DrillRow key={s.stage} delay={i * 0.04} tone="#007AFF"
                                            onClick={() => pushDrill({ type: 'stage', stage: s.stage })}
                                            leading={<span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-[12px] font-black" style={{ background: hexA('#007AFF', 0.12), color: '#007AFF' }}>{s.count}</span>}
                                            title={s.stage}
                                            subtitle={`${Math.round(s.weight * 100)}% הסתברות · צפי ₪${Math.round(s.expected).toLocaleString()}`}
                                            trailing={<span className="text-[12px] font-black text-[#007AFF] shrink-0">₪{s.value.toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'lowStock') {
                    const zeroCount = lowStockItems.filter(p => Number(p.stock ?? 0) === 0).length;
                    title = 'מלאי נמוך'; subtitle = `${lowStockItems.length} מוצרים תחת סף`; accent = '#FF3B30';
                    icon = <AlertTriangle size={17} color="#FF3B30" />;
                    footer = { label: 'מעבר לניהול מלאי', onClick: () => drillTo('/admin/inventory') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'תחת סף', value: lowStockItems.length, color: '#FF3B30' },
                                { label: 'אזל מהמלאי', value: zeroCount, color: '#FF3B30' },
                                { label: 'סה״כ מוצרים', value: inventory.length, color: '#8E8E93' },
                            ]} />
                            {lowStockItems.length === 0 ? (
                                <DrillEmpty icon={CheckCircle2} text="כל המוצרים במלאי תקין 🎉" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">רשימת מוצרים — לחץ לפרטים</p>
                                    {lowStockItems.slice(0, 12).map((p, i) => {
                                        const stock = Number(p.stock ?? 0);
                                        const threshold = Number(p.stockThreshold ?? p.minStock ?? p.threshold ?? 3);
                                        return (
                                            <DrillRow key={p.id || i} delay={i * 0.03} tone="#FF3B30"
                                                onClick={() => pushDrill({ type: 'product', id: p.id, fallback: { title: p.title || p.name, image: p.image } })}
                                                leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                                title={p.title || p.name || p.id}
                                                subtitle={`מלאי ${stock} · סף התראה ${threshold}`}
                                                trailing={<span className="text-[11px] font-black shrink-0" style={{ color: stock === 0 ? '#FF3B30' : '#FF9500' }}>{stock}/{threshold}</span>}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'order') {
                    const o = orders.find(x => String(x.id) === String(shown.id));
                    const units = o ? ((o.items || []).reduce((s, it) => s + (Number(it.qty) || 1), 0) || (o.items || []).length) : 0;
                    title = o ? (o.customer || 'הזמנה') : 'הזמנה';
                    subtitle = o ? `#${o.id} · ${orderDateStr(o.dateTs)}` : String(shown.id);
                    accent = '#007AFF'; icon = <ShoppingCart size={17} color="#007AFF" />;
                    footer = { label: 'פתח בניהול הזמנות', onClick: () => drillTo(`/admin/orders?orderId=${shown.id}`) };
                    body = o ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <StatusBadge status={o.status} />
                                <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">₪{(o.total || 0).toLocaleString()}</p>
                            </div>
                            <DrillStat items={[
                                { label: 'פריטים', value: units, color: '#007AFF' },
                                { label: 'סכום', value: `₪${(o.total || 0).toLocaleString()}`, color: '#34C759' },
                                { label: 'תאריך', value: o.dateTs ? new Date(o.dateTs).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '—' },
                            ]} />
                            {(o.items || []).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פריטים בהזמנה — לחץ למוצר</p>
                                    {o.items.map((it, i) => (
                                        <DrillRow key={i} delay={i * 0.03}
                                            onClick={it.id ? () => pushDrill({ type: 'product', id: it.id, fallback: { title: it.title, image: it.image } }) : undefined}
                                            leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                            title={it.title || it.name || `פריט ${i + 1}`}
                                            subtitle={`${it.qty || 1} × ₪${(Number(it.price) || 0).toLocaleString()}`}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{((Number(it.price) || 0) * (Number(it.qty) || 1)).toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            ) : <DrillEmpty icon={Package} text="אין פריטים מפורטים בהזמנה זו" />}
                        </div>
                    ) : <DrillEmpty icon={ShoppingCart} text="ההזמנה לא נמצאה" />;
                } else if (shown.type === 'quote') {
                    const q = quotes.find(x => String(x.id) === String(shown.id));
                    title = q ? (q.contactName || q.institution || 'הצעה') : 'הצעה';
                    subtitle = q ? `${q.status || ''} · ₪${Math.round(quoteVal(q)).toLocaleString()}` : String(shown.id);
                    accent = '#5856D6'; icon = <Layers size={17} color="#5856D6" />;
                    footer = { label: 'פתח בניהול הצעות', onClick: () => drillTo(`/admin/orders?quoteId=${shown.id}`) };
                    body = q ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <StatusBadge status={q.status} />
                                <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">₪{Math.round(quoteVal(q)).toLocaleString()}</p>
                            </div>
                            <DrillStat items={[
                                { label: 'מוסד', value: q.institution || '—', color: '#5856D6' },
                                { label: 'פריטים', value: (q.items || []).length, color: '#007AFF' },
                                { label: 'תאריך', value: q.dateTs ? new Date(q.dateTs).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '—' },
                            ]} />
                            {(q.items || []).length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פריטי ההצעה</p>
                                    {q.items.map((it, i) => {
                                        const pid = it.id || it.catalogNumber;
                                        return (
                                            <DrillRow key={i} delay={i * 0.03}
                                                onClick={pid ? () => pushDrill({ type: 'product', id: pid, fallback: { title: it.title || it.name, image: it.image } }) : undefined}
                                                title={it.title || it.name || `פריט ${i + 1}`}
                                                subtitle={`${it.qty || it.quantity || 1} × ₪${(Number(it.salePrice || it.price) || 0).toLocaleString()}`}
                                                trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{((Number(it.salePrice || it.price) || 0) * (Number(it.qty || it.quantity) || 1)).toLocaleString()}</span>}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : <DrillEmpty icon={Layers} text="ההצעה לא נמצאה" />;
                } else if (shown.type === 'stage') {
                    const list = quotesInStage(shown.stage);
                    const stageTotal = list.reduce((s, q) => s + quoteVal(q), 0);
                    title = shown.stage; subtitle = `${list.length} עסקאות בשלב`; accent = '#007AFF';
                    icon = <Layers size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לניהול הצעות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'עסקאות', value: list.length, color: '#007AFF' },
                                { label: 'שווי כולל', value: `₪${Math.round(stageTotal).toLocaleString()}`, color: '#34C759' },
                                { label: 'הסתברות', value: `${Math.round((STAGE_WEIGHTS[shown.stage] || 0.1) * 100)}%`, color: '#5856D6' },
                            ]} />
                            {list.length === 0 ? (
                                <DrillEmpty icon={Layers} text="אין עסקאות בשלב זה" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">עסקאות בשלב — לחץ לפרטים</p>
                                    {list.map((q, i) => (
                                        <DrillRow key={q.id} delay={i * 0.03} tone="#5856D6"
                                            onClick={() => pushDrill({ type: 'quote', id: q.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#5856D6', 0.1) }}><Users size={13} color="#5856D6" /></span>}
                                            title={q.contactName || q.institution || q.id}
                                            subtitle={q.institution || orderDateStr(q.dateTs)}
                                            trailing={<span className="text-[12px] font-black text-[#007AFF] shrink-0">₪{Math.round(quoteVal(q)).toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'product') {
                    const prod = findProduct(shown.id);
                    const sales = productSalesMap[String(shown.id)] || { revenue: 0, count: 0 };
                    const pTitle = prod?.title || prod?.name || shown.fallback?.title || 'מוצר';
                    const pImage = prod?.image || shown.fallback?.image;
                    const stock = prod ? Number(prod.stock ?? prod.quantity ?? 0) : null;
                    const threshold = prod ? Number(prod.stockThreshold ?? prod.minStock ?? prod.threshold ?? 3) : null;
                    title = pTitle; subtitle = prod?.category || 'מוצר'; accent = '#007AFF';
                    icon = <Box size={17} color="#007AFF" />;
                    footer = { label: 'פתח מוצר', onClick: () => drillTo('/admin/products') };
                    body = (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                                    {pImage ? <img src={pImage} alt={pTitle} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} /> : <Box size={26} className="text-[#AEAEB2]" />}
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[15px] font-black text-[#1D1D1F] leading-tight">{pTitle}</p>
                                    {prod?.price != null && <p className="text-[13px] font-bold text-[#34C759] mt-1">₪{Number(prod.price).toLocaleString()}</p>}
                                    {prod?.category && <p className="text-[11px] text-[#AEAEB2] mt-0.5">{prod.category}</p>}
                                </div>
                            </div>
                            <DrillStat items={[
                                { label: 'הכנסות', value: `₪${sales.revenue.toLocaleString()}`, color: '#34C759' },
                                { label: 'יח׳ נמכרו', value: sales.count, color: '#007AFF' },
                                ...(stock != null ? [{ label: 'במלאי', value: `${stock}${threshold != null ? `/${threshold}` : ''}`, color: stock <= (threshold ?? 0) ? '#FF3B30' : '#34C759' }] : []),
                            ]} />
                            {!prod && (
                                <div className="rounded-[14px] p-4 text-right text-[12px] text-[#86868B]" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                    המוצר לא נמצא בקטלוג הנוכחי — ייתכן שהוסר. הנתונים מבוססים על היסטוריית ההזמנות.
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'activity') {
                    const e = shown.entry || {};
                    const map = ACTIVITY_ICONS[e.type] || ACTIVITY_ICONS.info;
                    const IconC = map.Icon;
                    const routeByType = { order: '/admin/orders', product: '/admin/products', inventory: '/admin/inventory', coupon: '/admin/marketing', info: '/admin/analytics' };
                    const labelByType = { order: 'מעבר לניהול הזמנות', product: 'מעבר לניהול מוצרים', inventory: 'מעבר לניהול מלאי', coupon: 'מעבר לשיווק', info: 'מעבר לאנליטיקס' };
                    title = 'רשומת פעילות'; subtitle = e.date || '—'; accent = map.color;
                    icon = <IconC size={17} color={map.color} />;
                    footer = { label: labelByType[e.type] || 'מעבר לאנליטיקס', onClick: () => drillTo(routeByType[e.type] || '/admin/analytics') };
                    body = (
                        <div className="space-y-4">
                            <div className="rounded-[16px] p-4 text-right flex items-start gap-3" style={{ background: hexA(map.color, 0.06), border: `1px solid ${hexA(map.color, 0.16)}` }}>
                                <span className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: hexA(map.color, 0.14) }}><IconC size={16} color={map.color} /></span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-[#1D1D1F] leading-snug">{e.message || '—'}</p>
                                    <p className="text-[11px] text-[#AEAEB2] mt-1.5">{e.date || '—'} · {e.type || 'info'}</p>
                                </div>
                            </div>
                        </div>
                    );
                } else if (shown.type === 'traffic') {
                    const stats = computeStats(periodData?.visits);
                    const hasData = periodData?.visits?.some(v => v > 0);
                    title = 'תנועה לאתר'; subtitle = periodLabel; accent = '#007AFF';
                    icon = <Activity size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לאנליטיקס', onClick: () => drillTo('/admin/analytics') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'כניסות', value: (stats?.total || 0).toLocaleString(), color: '#007AFF' },
                                { label: 'ממוצע יומי', value: (stats?.avg || 0).toLocaleString() },
                                { label: 'שיא', value: (stats?.peak || 0).toLocaleString() },
                                { label: 'מגמה', value: `${(stats?.trend || 0) >= 0 ? '+' : ''}${stats?.trend || 0}%`, color: (stats?.trend || 0) >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {hasData ? (
                                <div>
                                    <p className="text-[11px] font-bold text-[#86868B] mb-3">{periodLabel}</p>
                                    <BarChart data={periodData.visits} color="#007AFF" labels={periodData.labels || []} height={140} />
                                </div>
                            ) : <DrillEmpty icon={Activity} text="טרם הצטברו נתוני תנועה" />}
                        </div>
                    );
                } else if (shown.type === 'sales') {
                    const stats = computeStats(periodData?.sales);
                    const hasData = periodData?.sales?.some(v => v > 0);
                    title = 'מכירות יומיות'; subtitle = periodLabel; accent = '#007AFF';
                    icon = <BarChart2 size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'עסקאות', value: (stats?.total || 0).toLocaleString(), color: '#007AFF' },
                                { label: 'ממוצע יומי', value: (stats?.avg || 0).toLocaleString() },
                                { label: 'שיא יומי', value: (stats?.peak || 0).toLocaleString() },
                                { label: 'מגמה', value: `${(stats?.trend || 0) >= 0 ? '+' : ''}${stats?.trend || 0}%`, color: (stats?.trend || 0) >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {hasData ? (
                                <div>
                                    <p className="text-[11px] font-bold text-[#86868B] mb-3">{periodLabel}</p>
                                    <BarChart data={periodData.sales} color="#007AFF" labels={periodData.labels || []} height={140} />
                                </div>
                            ) : <DrillEmpty icon={BarChart2} text="טרם בוצעו עסקאות בתקופה זו" />}
                            {topProducts.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצרים מובילים — לחץ לצלילה</p>
                                    {topProducts.slice(0, 4).map((p, i) => (
                                        <DrillRow key={p.id || i} delay={i * 0.04}
                                            onClick={() => pushDrill({ type: 'product', id: p.id, fallback: { title: p.title, image: p.image } })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={p.title}
                                            subtitle={`${p.count} יח׳`}
                                            trailing={<span className="text-[12px] font-black text-[#007AFF] shrink-0">₪{p.revenue.toLocaleString()}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'goal') {
                    const remaining = Math.max(monthlyGoal.target - monthlyGoal.current, 0);
                    const pct = monthlyGoal.target > 0 ? Math.min(Math.round(monthlyGoal.current / monthlyGoal.target * 100), 999) : 0;
                    title = 'יעד הכנסות חודשי'; subtitle = monthlyGoal.isManual ? 'יעד ידני' : 'יעד אוטומטי ×1.5'; accent = '#34C759';
                    icon = <Target size={17} color="#34C759" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <div className="flex justify-center">
                                <GoalRing value={monthlyGoal.current} target={monthlyGoal.target} color="#34C759" label="החודש" subtitle={`${pct}% מהיעד`} size={120} />
                            </div>
                            <DrillStat items={[
                                { label: 'הכנסות החודש', value: `₪${monthlyGoal.current.toLocaleString()}`, color: '#34C759' },
                                { label: 'יעד', value: `₪${monthlyGoal.target.toLocaleString()}`, color: '#007AFF' },
                                { label: 'נותר ליעד', value: `₪${remaining.toLocaleString()}`, color: remaining > 0 ? '#FF9500' : '#34C759' },
                            ]} />
                            <DrillRow tone="#34C759"
                                onClick={() => pushDrill({ type: 'revenue' })}
                                leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#34C759', 0.12) }}><TrendingUp size={14} color="#34C759" /></span>}
                                title="פירוט הכנסות מלא"
                                subtitle="צלול לפי יום ומוצר"
                            />
                        </div>
                    );
                } else {
                    title = 'פרטים'; icon = <Activity size={17} color="#007AFF" />;
                    body = <DrillEmpty icon={Activity} text="אין נתונים להצגה" />;
                }

                return (
                    <DashDrillView
                        open={isOpen}
                        title={title}
                        subtitle={subtitle}
                        icon={icon}
                        accent={accent}
                        canBack={canBack}
                        onBack={popDrill}
                        onClose={closeDrill}
                        footer={footer}
                        levelKey={`${shown.type}:${shown.id ?? shown.stage ?? shown.entry?.id ?? ''}:${drillStack.length}`}
                    >
                        {body}
                    </DashDrillView>
                );
            })()}
        </div>
    );
}
