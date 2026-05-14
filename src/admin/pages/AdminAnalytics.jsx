/* eslint-disable */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Box } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { AdminKPICard, AdminTabs, HeatGrid, DonutChart } from '../components/AdminComponents';
import initialProducts from '../../data/products';

// ─── Glass card ───────────────────────────────────────────────────────────────
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

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, pct, color }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[#1D1D1F] font-black text-sm">{value}</span>
                <span className="text-[#6E6E73] text-xs font-medium">{label}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                />
            </div>
        </div>
    );
}

const DONUT_COLORS = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

const TABS = [
    { id: 'overview', label: 'סקירה' },
    { id: 'traffic',  label: 'תנועה' },
    { id: 'revenue',  label: 'הכנסות' },
    { id: 'products', label: 'מוצרים' },
];

const RANGES = [
    { id: '7',   label: '7 ימים' },
    { id: '14',  label: '14 ימים' },
    { id: '30',  label: '30 ימים' },
    { id: '90',  label: '3 חודשים' },
];

export default function AdminAnalytics() {
    const { analytics, orders, kpis, inventory } = useAdminData();
    const [tab, setTab] = useState('overview');
    const [range, setRange] = useState('30');

    // Filtered analytics by date range
    const rangeData = useMemo(() => {
        if (!analytics) return null;
        const days = Math.min(parseInt(range), analytics.labels.length);
        return {
            labels:  analytics.labels.slice(-days),
            visits:  analytics.visits.slice(-days),
            sales:   analytics.sales.slice(-days),
            revenue: analytics.revenue.slice(-days),
        };
    }, [analytics, range]);

    const totalVisits  = useMemo(() => analytics?.visits.reduce((a, b) => a + b, 0) || 0, [analytics]);
    const totalSales   = useMemo(() => analytics?.sales.reduce((a, b) => a + b, 0) || 0, [analytics]);
    const totalRevenue = useMemo(() => analytics?.revenue.reduce((a, b) => a + b, 0) || 0, [analytics]);
    const avgConv      = useMemo(() => totalVisits ? ((totalSales / totalVisits) * 100).toFixed(1) : '0.0', [totalVisits, totalSales]);

    // Category revenue breakdown
    const categoryRevenue = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            const cat = o.category || 'אחר';
            map[cat] = (map[cat] || 0) + (o.total || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
    }, [orders]);

    const maxCatRev = Math.max(...categoryRevenue.map(([, v]) => v), 1);

    // Weekly summary
    const weeklySummary = useMemo(() => {
        if (!analytics) return [];
        return [0, 1, 2, 3].map(i => {
            const start = Math.max(0, analytics.labels.length - 28 + i * 7);
            const slice = (arr) => arr.slice(start, start + 7).reduce((a, b) => a + b, 0);
            return {
                label: analytics.labels[start] || `שבוע ${i + 1}`,
                visits: slice(analytics.visits),
                sales:  slice(analytics.sales),
                rev:    slice(analytics.revenue),
            };
        });
    }, [analytics]);

    // Top products by sold count
    const topByCount = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            if (!map[o.productId]) {
                const inv = inventory.find(p => String(p.id) === String(o.productId));
                const backup = initialProducts.find(p => String(p.id) === String(o.productId));
                map[o.productId] = { title: o.product, image: o.productImage || inv?.image || backup?.image, count: 0, revenue: 0 };
            }
            map[o.productId].count += o.qty || 1;
            map[o.productId].revenue += o.total || 0;
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [orders, inventory]);

    const maxCount = Math.max(...topByCount.map(p => p.count), 1);

    // Donut data for categories
    const donutData = categoryRevenue.map(([label, value]) => ({ label, value }));

    return (
        <div dir="rtl" className="space-y-5">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="text-right">
                    <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">דוחות ואנליטיקה</h1>
                    <p className="text-[#86868B] text-sm mt-1 font-medium">
                        תובנות עסקיות מבוססות נתוני פעילות אמת · {new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2.5">
                    <AdminTabs tabs={TABS} active={tab} onChange={setTab} />
                    {/* Range selector */}
                    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        {RANGES.map(r => (
                            <motion.button key={r.id} onClick={() => setRange(r.id)}
                                className="relative px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap"
                                style={{ color: range === r.id ? '#1D1D1F' : '#86868B' }}>
                                {range === r.id && (
                                    <motion.div layoutId="range-pill" className="absolute inset-0 rounded-xl bg-white"
                                        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                                )}
                                <span className="relative z-10">{r.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── KPI Row (always visible) ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminKPICard title="כניסות ייחודיות" icon="traffic" value={totalVisits}
                    trend={14} trendUp color="#007AFF" delay={0} />
                <AdminKPICard title="עסקאות מוצלחות" icon="orders" value={totalSales}
                    trend={8} trendUp color="#34C759" delay={0.05} />
                <AdminKPICard title="יחס המרה" icon="traffic" value={`${avgConv}%`}
                    trend={2} trendUp color="#5856D6" delay={0.1} />
                <AdminKPICard title="הכנסות ברוטו" icon="revenue" value={`₪${kpis.totalRevenue.toLocaleString()}`}
                    trend={12} trendUp color="#FF9500" delay={0.15} />
            </div>

            <AnimatePresence mode="wait">

                {/* ── Overview Tab ─────────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <motion.div key="overview"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card title="מחזור הכנסות (30 יום)" subtitle="₪ ביחידה"
                                accent="linear-gradient(90deg,#34C759,#30D158)"
                                action={<span className="text-[#34C759] text-xs font-black">₪{totalRevenue.toLocaleString()}</span>}>
                                {totalRevenue > 0
                                    ? <HeatGrid data={rangeData?.revenue || analytics.revenue} color="#34C759" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart />}
                            </Card>
                            <Card title="תנועת מבקרים (30 יום)" subtitle="כניסות ייחודיות"
                                accent="linear-gradient(90deg,#007AFF,#5856D6)"
                                action={<span className="text-[#007AFF] text-xs font-black">{totalVisits.toLocaleString()}</span>}>
                                {totalVisits > 0
                                    ? <HeatGrid data={rangeData?.visits || analytics.visits} color="#007AFF" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart label="טרם הצטברו נתוני תנועה" />}
                            </Card>
                        </div>

                        {/* Weekly Summary */}
                        <Card title="סיכום שבועי — 4 שבועות אחרונים"
                            accent="linear-gradient(90deg,#FF9500,#5856D6)">
                            <div className="divide-y divide-black/04">
                                {weeklySummary.map((w, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="grid grid-cols-4 gap-4 py-3.5 first:pt-0 last:pb-0 text-right"
                                    >
                                        <p className="text-[#6E6E73] text-sm font-bold">{w.label}</p>
                                        <p className="text-[#1D1D1F] text-sm font-bold">{w.visits.toLocaleString()} כניסות</p>
                                        <p className="text-[#34C759] text-sm font-bold">{w.sales} מכירות</p>
                                        <p className="text-[#007AFF] text-sm font-black">₪{w.rev.toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── Traffic Tab ──────────────────────────────────────────────── */}
                {tab === 'traffic' && (
                    <motion.div key="traffic"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <Card title="כניסות ייחודיות — 30 ימים" subtitle="מקור: localStorage nextclass_visits"
                            accent="linear-gradient(90deg,#007AFF,#5856D6)"
                            action={<span className="text-[#007AFF] text-xs font-black">{totalVisits.toLocaleString()} סה״כ</span>}>
                            {totalVisits > 0 ? (
                                <HeatGrid data={rangeData?.visits || analytics.visits} color="#007AFF" labels={rangeData?.labels || analytics.labels} />
                            ) : <EmptyChart label="טרם הצטברו נתוני תנועה" />}
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card title="כניסות ב-7 ימים אחרונים" subtitle="תצוגת רשת אינטנסיביות"
                                accent="linear-gradient(90deg,#5856D6,#007AFF)">
                                {totalVisits > 0
                                    ? <HeatGrid data={(rangeData?.visits || analytics.visits).slice(-7)} color="#5856D6" labels={(rangeData?.labels || analytics.labels).slice(-7)} />
                                    : <EmptyChart />}
                            </Card>
                            <Card title="מדדי תנועה" accent="linear-gradient(90deg,#007AFF,#5856D6)">
                                <div className="space-y-4 mt-1">
                                    <StatRow label="ממוצע יומי" value={`${(totalVisits / 30).toFixed(0)} כניסות`}
                                        pct={Math.min((totalVisits / 30) / 10 * 100, 100)} color="#007AFF" />
                                    <StatRow label="שיא יומי" value={`${Math.max(...(analytics?.visits || [0]))} כניסות`}
                                        pct={100} color="#5856D6" />
                                    <StatRow label="ימים עם תנועה" value={`${(analytics?.visits || []).filter(v => v > 0).length} ימים`}
                                        pct={((analytics?.visits || []).filter(v => v > 0).length / 30) * 100} color="#34C759" />
                                    <StatRow label="יחס המרה כולל" value={`${avgConv}%`}
                                        pct={parseFloat(avgConv) * 10} color="#FF9500" />
                                </div>
                            </Card>
                        </div>
                    </motion.div>
                )}

                {/* ── Revenue Tab ──────────────────────────────────────────────── */}
                {tab === 'revenue' && (
                    <motion.div key="revenue"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <Card title="מחזור הכנסות — 30 ימים" subtitle="₪ הכנסות לפי יום"
                            accent="linear-gradient(90deg,#34C759,#30D158)"
                            action={<span className="text-[#34C759] text-xs font-black">₪{totalRevenue.toLocaleString()}</span>}>
                            {totalRevenue > 0 ? (
                                <HeatGrid data={rangeData?.revenue || analytics.revenue} color="#34C759" labels={rangeData?.labels || analytics.labels} />
                            ) : <EmptyChart label="טרם בוצעו עסקאות" />}
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card title="הכנסות לפי קטגוריה" subtitle="פיזור ההכנסות"
                                accent="linear-gradient(90deg,#FF9500,#FF3B30)">
                                {donutData.length > 0 ? (
                                    <DonutChart data={donutData} colors={DONUT_COLORS} size={120} />
                                ) : (
                                    <EmptyChart label="אין נתוני הזמנות עדיין" />
                                )}
                            </Card>

                            <Card title="מדדי הכנסות" accent="linear-gradient(90deg,#34C759,#007AFF)">
                                <div className="space-y-4 mt-1">
                                    <StatRow label="הכנסות כוללות" value={`₪${kpis.totalRevenue.toLocaleString()}`}
                                        pct={100} color="#34C759" />
                                    <StatRow label="ממוצע עסקה (AOV)" value={`₪${kpis.avgOrderValue.toLocaleString()}`}
                                        pct={Math.min(kpis.avgOrderValue / 50, 100)} color="#007AFF" />
                                    <StatRow label="החודש הנוכחי" value={`₪${kpis.thisMonthRevenue.toLocaleString()}`}
                                        pct={kpis.totalRevenue > 0 ? (kpis.thisMonthRevenue / kpis.totalRevenue) * 100 : 0} color="#5856D6" />
                                    <StatRow label="הזמנות שהושלמו" value={`${kpis.completedOrders}`}
                                        pct={kpis.totalOrders > 0 ? (kpis.completedOrders / kpis.totalOrders) * 100 : 0} color="#FF9500" />
                                </div>
                            </Card>
                        </div>

                        {/* Category breakdown bar */}
                        {categoryRevenue.length > 0 && (
                            <Card title="הכנסות מפורטות לפי קטגוריה" accent="linear-gradient(90deg,#FF9500,#FF3B30)">
                                <div className="space-y-3.5">
                                    {categoryRevenue.map(([cat, rev], i) => (
                                        <div key={cat} className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#1D1D1F] font-black text-sm">₪{rev.toLocaleString()}</span>
                                                <span className="text-[#6E6E73] text-xs font-medium">{cat}</span>
                                            </div>
                                            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(rev / maxCatRev) * 100}%` }}
                                                    transition={{ delay: i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                    className="h-full rounded-full"
                                                    style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}

                {/* ── Products Tab ─────────────────────────────────────────────── */}
                {tab === 'products' && (
                    <motion.div key="products"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Top products by order count */}
                            <Card title="מוצרים מובילים לפי כמות" subtitle="מכירות מצטברות"
                                accent="linear-gradient(90deg,#007AFF,#5856D6)">
                                {topByCount.length === 0 ? (
                                    <EmptyChart label="אין הזמנות עדיין" />
                                ) : (
                                    <div className="space-y-3">
                                        {topByCount.map((p, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <span className="text-[#AEAEB2] text-xs font-black w-4 shrink-0 text-center">{i + 1}</span>
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">
                                                    {p.image
                                                        ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                                                        : <Box size={13} className="text-[#AEAEB2]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[#1D1D1F] text-[11px] font-bold truncate text-right">{p.title}</p>
                                                    <div className="w-full h-1.5 bg-black/06 rounded-full mt-1 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(p.count / maxCount) * 100}%` }}
                                                            transition={{ delay: i * 0.07, duration: 0.7, ease: [0.22,1,0.36,1] }}
                                                            className="h-full rounded-full"
                                                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-[#6E6E73] text-[11px] font-bold shrink-0">{p.count} יח׳</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>

                            {/* Inventory status */}
                            <Card title="סטטוס קטלוג" subtitle="מוצרים לפי מצב"
                                accent="linear-gradient(90deg,#34C759,#30D158)">
                                {(() => {
                                    const active = inventory.filter(p => p.isActive !== false).length;
                                    const inactive = inventory.length - active;
                                    const lowStockCount = inventory.filter(p => p.stock <= p.threshold && p.stock > 0).length;
                                    const outOfStock = inventory.filter(p => p.stock === 0).length;

                                    const statusData = [
                                        { label: 'פעיל ובמלאי', value: active - lowStockCount - outOfStock },
                                        { label: 'מלאי נמוך', value: lowStockCount },
                                        { label: 'אזל מהמלאי', value: outOfStock },
                                        { label: 'לא פעיל', value: inactive },
                                    ].filter(d => d.value > 0);

                                    if (statusData.length === 0) return <EmptyChart label="אין מוצרים עדיין" />;

                                    return (
                                        <div className="space-y-4">
                                            <DonutChart
                                                data={statusData}
                                                colors={['#34C759', '#FF9500', '#FF3B30', '#AEAEB2']}
                                                size={120}
                                            />
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/04">
                                                <div className="text-center">
                                                    <p className="text-2xl font-black text-[#1D1D1F]">{inventory.length}</p>
                                                    <p className="text-[10px] text-[#AEAEB2] font-black tracking-widest">סה״כ מוצרים</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-black text-[#34C759]">{active}</p>
                                                    <p className="text-[10px] text-[#AEAEB2] font-black tracking-widest">מוצרים פעילים</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </Card>
                        </div>

                        {/* נפח מכירות לפי יום */}
                        <Card title="נפח עסקאות — 30 ימים" subtitle="כמות עסקאות לפי יום"
                            accent="linear-gradient(90deg,#5856D6,#007AFF)">
                            {totalSales > 0 ? (
                                <HeatGrid data={rangeData?.sales || analytics.sales} color="#5856D6" labels={rangeData?.labels || analytics.labels} />
                            ) : <EmptyChart label="טרם בוצעו עסקאות" />}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


function EmptyChart({ label = 'אין נתונים להצגה' }) {
    return (
        <div className="h-28 flex flex-col items-center justify-center gap-2 text-[#AEAEB2]">
            <BarChart2 size={24} className="opacity-40" />
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}
