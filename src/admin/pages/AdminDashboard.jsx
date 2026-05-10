/* eslint-disable */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { AdminKPICard, StatusBadge, HeatGrid, AdminModal } from '../components/AdminComponents';
import initialProducts from '../../data/products';

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

const greeting = () => {
    const h = new Date().getHours();
    if (h < 5)  return 'לילה טוב';
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    return 'ערב טוב';
};

export default function AdminDashboard() {
    const { kpis, orders, analytics, inventory, activityLog } = useAdminData();
    const [period, setPeriod] = useState('30');
    const [drilldown, setDrilldown] = useState(null); // 'revenue' | 'orders' | 'conversion' | 'avg'

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
                    trend={12} trendUp color="#34C759" delay={0}
                    sparkData={periodData?.revenue}
                    onClick={() => setDrilldown('revenue')} />
                <AdminKPICard title="עסקאות" icon="📦"
                    value={kpis.totalOrders}
                    subtitle={`${kpis.pendingOrders} ממתינות · ${periodSales} בתקופה`}
                    trend={8} trendUp color="#007AFF" delay={0.05}
                    sparkData={periodData?.sales}
                    onClick={() => setDrilldown('orders')} />
                <AdminKPICard title="יחס המרה" icon="📈"
                    value={`${kpis.conversionRate}%`}
                    subtitle="מכניסות ייחודיות"
                    trend={3} trendUp color="#5856D6" delay={0.1}
                    sparkData={periodData?.visits}
                    onClick={() => setDrilldown('conversion')} />
                <AdminKPICard title="ממוצע עסקה" icon="🎯"
                    value={`₪${kpis.avgOrderValue.toLocaleString()}`}
                    subtitle={`${kpis.completedOrders} הזמנות הושלמו`}
                    trend={5} trendUp color="#FF9500" delay={0.15}
                    sparkData={periodData?.revenue}
                    onClick={() => setDrilldown('avg')} />
            </div>

            {/* ── Secondary KPIs ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminKPICard title="מלאי נמוך" icon="⚠️" value={kpis.lowStockCount}
                    subtitle="מוצרים תחת סף" color="#FF3B30" delay={0.2} />
                <AdminKPICard title="פניות חדשות" icon="✉️" value={kpis.contactsNew}
                    subtitle="ממתינות לטיפול" color="#FF9500" delay={0.25} />
                <AdminKPICard title="כניסות" icon="👁️" value={periodVisits}
                    subtitle={period === '1' ? 'היום' : `${period} ימים`}
                    color="#007AFF" delay={0.3} />
                <AdminKPICard title="קטלוג פעיל" icon="🛍️"
                    value={inventory.filter(p => p.isActive !== false).length}
                    subtitle={`מתוך ${inventory.length} מוצרים`} color="#5856D6" delay={0.35} />
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
                                        ? <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover/row:scale-110 transition-transform duration-500" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card
                    title="מחזור הכנסות"
                    subtitle={`${period === '1' ? 'היום' : `${period} ימים`} · ₪ ביחידה`}
                    accent="linear-gradient(90deg,#34C759,#30D158)"
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

                <Card
                    title="מכירות יומיות"
                    subtitle="כמות עסקאות לפי יום"
                    accent="linear-gradient(90deg,#FF9500,#FF3B30)"
                    action={
                        <span className="text-xs font-black text-[#FF9500]">{periodSales} עסקאות</span>
                    }
                >
                    {periodData && periodData.sales.some(v => v > 0) ? (
                        <HeatGrid data={periodData.sales} color="#FF9500" labels={periodData.labels} />
                    ) : (
                        <div className="h-24 flex items-center justify-center text-[#AEAEB2] text-sm">
                            טרם בוצעו עסקאות
                        </div>
                    )}
                </Card>
            </div>

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

            {/* ── KPI Drilldown Modal ────────────────────────────────────────── */}
            {(() => {
                const meta = {
                    revenue:    { title: 'פירוט הכנסות', color: '#34C759', data: periodData?.revenue, labels: periodData?.labels, icon: '💰' },
                    orders:     { title: 'פירוט עסקאות', color: '#007AFF', data: periodData?.sales,   labels: periodData?.labels, icon: '📦' },
                    conversion: { title: 'פירוט תנועה',  color: '#5856D6', data: periodData?.visits,  labels: periodData?.labels, icon: '📈' },
                    avg:        { title: 'ממוצע לפי מוצר', color: '#FF9500', data: null, icon: '🎯' },
                };
                const m = drilldown ? meta[drilldown] : null;
                const maxBar = m?.data ? Math.max(...m.data, 1) : 1;
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
                                        <div className="flex items-end gap-1 h-36 overflow-x-auto pb-1" style={{ direction: 'ltr' }}>
                                            {m.data.map((v, i) => (
                                                <div key={i} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: Math.max(14, Math.floor(320 / m.data.length)) }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(2, (v / maxBar) * 100)}%` }}
                                                        transition={{ delay: i * 0.01, duration: 0.5, ease: [0.22,1,0.36,1] }}
                                                        className="w-full rounded-t-md"
                                                        style={{ background: v > 0 ? `linear-gradient(180deg, ${m.color} 0%, ${m.color}60 100%)` : 'rgba(0,0,0,0.06)' }}
                                                        title={`${m.labels?.[i] || i}: ${v}`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {m.labels && (
                                            <div className="flex gap-1 mt-1 overflow-x-auto" style={{ direction: 'ltr' }}>
                                                {m.labels.filter((_, i) => i % Math.ceil(m.labels.length / 8) === 0).map((l, i) => (
                                                    <span key={i} className="text-[9px] text-[#AEAEB2] font-mono shrink-0 min-w-[28px] text-center">{l}</span>
                                                ))}
                                            </div>
                                        )}
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
