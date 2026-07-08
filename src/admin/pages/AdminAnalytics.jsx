/* eslint-disable */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Box, TrendingDown, Clock, ArrowDown, TrendingUp, AlertTriangle, CheckCircle2, Zap, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { AdminKPICard, AdminTabs, HeatGrid, DonutChart, AdminModal, BarChart, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';

// ─── Glass card ───────────────────────────────────────────────────────────────
function Card({ title, subtitle, accent, action, children, className = '', titleTooltip }) {
    return (
        <div className={`rounded-[22px] overflow-hidden ${className}`}
            style={{
                background: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
        >
            {accent && <div className="h-[3px]" style={{ background: accent }} />}
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
    { id: 'funnel',   label: 'משפך' },
];

const RANGES = [
    { id: '7',   label: '7 ימים' },
    { id: '14',  label: '14 ימים' },
    { id: '30',  label: '30 ימים' },
    { id: '90',  label: '3 חודשים' },
];

export default function AdminAnalytics() {
    const { analytics, orders, kpis, inventory, quotes } = useAdminData();
    const navigate = useNavigate();
    const [tab,         setTab]         = useState('overview');
    const [range,       setRange]       = useState('30');
    const [drillKpi,    setDrillKpi]    = useState(null);
    const [funnelStage, setFunnelStage] = useState(null);
    const [monthPage,   setMonthPage]   = useState(0);
    const [weekPage,    setWeekPage]    = useState(0);

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

    // Week-over-week trends (last 7 days vs previous 7 days)
    const weekTrend = useMemo(() => {
        const calc = (arr) => {
            if (!arr || arr.length < 14) return null;
            const recent = arr.slice(-7).reduce((a, b) => a + b, 0);
            const prior  = arr.slice(-14, -7).reduce((a, b) => a + b, 0);
            if (prior === 0) return recent > 0 ? 100 : null;
            return Math.round((recent - prior) / prior * 100);
        };
        return {
            visits:  calc(analytics?.visits),
            sales:   calc(analytics?.sales),
            revenue: calc(analytics?.revenue),
        };
    }, [analytics]);

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

    // Weekly summary — paginated (4 weeks per page)
    const weeklySummary = useMemo(() => {
        if (!analytics) return { data: [], hasOlder: false, hasNewer: false };
        const totalDays  = analytics.labels.length;
        const totalWeeks = Math.max(Math.floor(totalDays / 7), 1);
        // weekPage 0 = most recent 4 weeks; page 1 = prior 4 weeks, etc.
        const data = [0, 1, 2, 3].map(i => {
            const weekIdx = weekPage * 4 + (3 - i); // 3→0 = newest→oldest within page
            const end   = Math.max(0, totalDays - weekIdx * 7);
            const start = Math.max(0, end - 7);
            if (start >= end) return null;
            const slice = (arr) => arr.slice(start, end).reduce((a, b) => a + b, 0);
            const label = analytics.labels[start];
            const d = label ? new Date(label) : null;
            const MONTHS = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
            return {
                label: d && !isNaN(d) ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : `שבוע ${weekIdx + 1}`,
                visits: slice(analytics.visits),
                sales:  slice(analytics.sales),
                rev:    slice(analytics.revenue),
            };
        }).filter(Boolean).reverse();
        return {
            data,
            hasOlder: (weekPage + 1) * 4 < totalWeeks,
            hasNewer: weekPage > 0,
        };
    }, [analytics, weekPage]);

    // Top products by sold count
    const topByCount = useMemo(() => {
        const map = {};
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                const pid = String(item.id ?? '');
                if (!pid) return;
                if (!map[pid]) {
                    const inv = inventory.find(p => String(p.id) === pid);
                    const backup = initialProducts.find(p => String(p.id) === pid);
                    map[pid] = {
                        productId: pid,
                        title: item.title || inv?.title || inv?.name || backup?.title || backup?.name || pid,
                        image: item.image || inv?.image || backup?.image,
                        count: 0,
                        revenue: 0,
                    };
                }
                map[pid].count += item.qty || 1;
                map[pid].revenue += (item.price || 0) * (item.qty || 1);
            });
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [orders, inventory]);

    const maxCount = Math.max(...topByCount.map(p => p.count), 1);

    // Donut data for categories
    const donutData = categoryRevenue.map(([label, value]) => ({ label, value }));

    // Closed deals analytics
    const closedDeals = useMemo(() => {
        const CLOSED = ['נסגר', 'סופק'];
        return quotes
            .filter(q => CLOSED.includes(q.status))
            .map(q => {
                const pd = q.pricingData;
                const rev = Number(q.subtotal) || 0;
                const hist = q.history || [];
                const closeEntry = [...hist].reverse().find(h => CLOSED.includes(h.status));
                const closedAt = closeEntry?.ts ? new Date(closeEntry.ts) : (q.updatedAt?.toDate ? q.updatedAt.toDate() : null);
                return {
                    id: q.id,
                    contactName: q.contactName || '—',
                    institution: q.institution || '—',
                    status: q.status,
                    items: q.items || [],
                    revenue: rev,
                    netProfit: pd?.netProfit ?? null,
                    profitPct: pd?.profitPct ?? null,
                    closedAt,
                    hasProfit: pd?.netProfit != null,
                };
            })
            .sort((a, b) => (b.closedAt?.getTime() || 0) - (a.closedAt?.getTime() || 0));
    }, [quotes]);

    const closedStats = useMemo(() => {
        const total = closedDeals.length;
        const totalRev = closedDeals.reduce((s, d) => s + d.revenue, 0);
        const avgDeal = total > 0 ? Math.round(totalRev / total) : 0;
        const withProfit = closedDeals.filter(d => d.hasProfit);
        const avgProfit = withProfit.length > 0
            ? Math.round(withProfit.reduce((s, d) => s + d.profitPct, 0) / withProfit.length * 10) / 10
            : null;
        return { total, totalRev, avgDeal, avgProfit };
    }, [closedDeals]);

    // Pipeline health analytics
    const pipelineStats = useMemo(() => {
        const OPEN_STAGES = ['חדש', 'ביצירת קשר', 'בדיקת מלאי', 'הוצע מחיר', 'ממתין לאישור', 'הועבר לספק', 'בדרך'];
        const CLOSED_STAGES = ['נסגר', 'סופק'];
        const LOST_STAGES = ['אבד', 'בוטל'];
        const now = Date.now();

        const openQuotes = quotes.filter(q => OPEN_STAGES.includes(q.status));
        const closedQuotes = quotes.filter(q => CLOSED_STAGES.includes(q.status));
        const lostQuotes = quotes.filter(q => LOST_STAGES.includes(q.status));
        const totalFinalized = closedQuotes.length + lostQuotes.length;

        const pipelineValue = openQuotes.reduce((s, q) => s + (Number(q.subtotal) || 0), 0);
        const winRate = totalFinalized > 0 ? Math.round(closedQuotes.length / totalFinalized * 100) : null;

        // Avg deal cycle days (creation → close)
        const cycleDays = closedQuotes.map(q => {
            const hist = q.history || [];
            const closeEntry = [...hist].reverse().find(h => CLOSED_STAGES.includes(h.status));
            if (!closeEntry?.ts || !q.dateTs) return null;
            return (closeEntry.ts - q.dateTs) / 86400000;
        }).filter(d => d !== null && d >= 0);
        const avgCycle = cycleDays.length > 0 ? Math.round(cycleDays.reduce((a, b) => a + b) / cycleDays.length) : null;

        // Stale: last activity > 7 days in open stages
        const staleQuotes = openQuotes.filter(q => {
            const last = [...(q.history || [])].reverse()[0]?.ts || q.dateTs;
            return last && (now - last) > 7 * 86400000;
        });
        const staleValue = staleQuotes.reduce((s, q) => s + (Number(q.subtotal) || 0), 0);

        // At risk: > 21 days old, still in early stages
        const atRisk = openQuotes.filter(q => q.dateTs && (now - q.dateTs) > 21 * 86400000);
        const atRiskValue = atRisk.reduce((s, q) => s + (Number(q.subtotal) || 0), 0);

        // Pending approval
        const pendingApproval = quotes.filter(q => q.status === 'ממתין לאישור');

        // Pipeline by stage with ₪ value
        const stageValues = {};
        OPEN_STAGES.forEach(s => { stageValues[s] = { count: 0, value: 0 }; });
        openQuotes.forEach(q => {
            if (stageValues[q.status]) {
                stageValues[q.status].count++;
                stageValues[q.status].value += Number(q.subtotal) || 0;
            }
        });

        return { openCount: openQuotes.length, pipelineValue, winRate, avgCycle, staleQuotes, staleValue, atRisk, atRiskValue, pendingApproval, stageValues };
    }, [quotes]);

    // Actionable items derived from pipeline
    const actionItems = useMemo(() => {
        const now = Date.now();
        const items = [];

        // Pending approval > 2 days
        pipelineStats.pendingApproval
            .filter(q => { const last = [...(q.history || [])].reverse()[0]?.ts || q.dateTs; return last && (now - last) > 2 * 86400000; })
            .slice(0, 3)
            .forEach(q => {
                const days = Math.round((now - ([...(q.history || [])].reverse()[0]?.ts || q.dateTs)) / 86400000);
                items.push({ type: 'pending', icon: '✍️', color: '#5856D6', text: `ממתין לאישור: ${q.contactName || q.institution || q.id}`, sub: `₪${(Number(q.subtotal) || 0).toLocaleString()} · ${days} ימים`, quoteId: q.id });
            });

        // Stale > 10 days
        pipelineStats.staleQuotes
            .filter(q => { const last = [...(q.history || [])].reverse()[0]?.ts || q.dateTs; return last && (now - last) > 10 * 86400000; })
            .slice(0, 3)
            .forEach(q => {
                const last = [...(q.history || [])].reverse()[0]?.ts || q.dateTs;
                const days = Math.round((now - last) / 86400000);
                items.push({ type: 'stale', icon: '⏰', color: '#FF9500', text: `הצעה ללא מענה: ${q.contactName || q.institution || q.id}`, sub: `₪${(Number(q.subtotal) || 0).toLocaleString()} · ${days} ימים`, quoteId: q.id });
            });

        // Recent wins (last 7 days)
        closedDeals
            .filter(d => d.closedAt && (now - d.closedAt.getTime()) < 7 * 86400000)
            .slice(0, 2)
            .forEach(d => items.push({ type: 'win', icon: '🎉', color: '#34C759', text: `עסקה נסגרה: ${d.contactName}`, sub: `₪${d.revenue.toLocaleString()} · ${d.institution}`, quoteId: d.id }));

        return items;
    }, [pipelineStats, closedDeals]);

    // Conversion funnel data from quotes pipeline
    const funnelData = useMemo(() => {
        const STAGES = [
            { key: 'חדש',            label: 'ליד נכנס',         color: '#007AFF' },
            { key: 'ביצירת קשר',    label: 'יצירת קשר',        color: '#5856D6' },
            { key: 'בדיקת מלאי',    label: 'בדיקת מלאי',       color: '#AF52DE' },
            { key: 'הוצע מחיר',     label: 'הצעת מחיר נשלחה',  color: '#FF9500' },
            { key: 'ממתין לאישור',   label: 'ממתין לאישור',     color: '#FF6B00' },
            { key: 'נסגר',          label: 'עסקה נסגרה',        color: '#34C759' },
            { key: 'סופק',          label: 'סופק ללקוח',        color: '#30D158' },
        ];

        const CLOSED_STAGES = ['נסגר', 'סופק'];
        const LOST_STAGES = ['אבד', 'בוטל'];

        // Count quotes that ever reached each stage (cumulative from entry)
        const stageCounts = {};
        const avgTimeInStage = {};
        const stageOrder = STAGES.map(s => s.key);

        STAGES.forEach(s => { stageCounts[s.key] = 0; avgTimeInStage[s.key] = []; });

        quotes.forEach(q => {
            const hist = q.history || [];
            const statusSet = new Set([q.status, ...hist.map(h => h.status)]);

            // For each stage the quote passed through
            STAGES.forEach(s => {
                if (statusSet.has(s.key)) stageCounts[s.key]++;
            });

            // Compute time between consecutive history entries
            for (let i = 1; i < hist.length; i++) {
                const prev = hist[i - 1];
                const curr = hist[i];
                if (!prev.ts || !curr.ts) continue;
                const stageKey = prev.status;
                if (stageCounts[stageKey] !== undefined) {
                    avgTimeInStage[stageKey] = avgTimeInStage[stageKey] || [];
                    avgTimeInStage[stageKey].push((curr.ts - prev.ts) / (1000 * 60 * 60 * 24));
                }
            }
        });

        const totalEntered = stageCounts['חדש'] || quotes.length;

        return STAGES.map((s, i) => {
            const count = stageCounts[s.key] || 0;
            const prevCount = i === 0 ? totalEntered : (stageCounts[STAGES[i - 1].key] || 1);
            const dropPct = prevCount > 0 && i > 0 ? Math.round((1 - count / prevCount) * 100) : 0;
            const times = avgTimeInStage[s.key] || [];
            const avgDays = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
            const widthPct = totalEntered > 0 ? Math.round((count / totalEntered) * 100) : 0;
            return { ...s, count, dropPct, avgDays, widthPct };
        });
    }, [quotes]);

    // Top customers by revenue (from closed quotes)
    const topCustomers = useMemo(() => {
        const map = {};
        closedDeals.forEach(d => {
            const key = d.contactName || d.institution || d.id;
            if (!map[key]) map[key] = { name: d.contactName, institution: d.institution, email: '', revenue: 0, count: 0, quoteId: d.id };
            map[key].revenue += d.revenue;
            map[key].count++;
            if (!map[key].email) map[key].quoteId = d.id;
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    }, [closedDeals]);

    // Dead products: active inventory never sold — checks both orders AND closed quotes
    const deadProducts = useMemo(() => {
        const soldIds    = new Set();
        const soldTitles = new Set();
        // From direct orders (items array)
        orders.forEach(o => {
            (o.items || []).forEach(item => {
                if (item.id != null) soldIds.add(String(item.id));
                if (item.title)      soldTitles.add(String(item.title).toLowerCase().trim());
            });
            // backward-compat: old-style top-level fields
            if (o.productId != null) soldIds.add(String(o.productId));
            if (o.product)           soldTitles.add(String(o.product).toLowerCase().trim());
        });
        // From closed quotes (items array)
        const CLOSED = ['נסגר', 'סופק'];
        quotes.filter(q => CLOSED.includes(q.status)).forEach(q => {
            (q.items || []).forEach(it => {
                if (it.id != null) soldIds.add(String(it.id));
                if (it.title)      soldTitles.add(String(it.title).toLowerCase().trim());
            });
        });
        return inventory.filter(p => {
            if (p.isActive === false) return false;
            const pid   = String(p.id);
            const title = String(p.title || p.name || '').toLowerCase().trim();
            return !soldIds.has(pid) && !soldTitles.has(title);
        });
    }, [orders, inventory, quotes]);

    // Product table: merge count + revenue
    const productTable = useMemo(() =>
        topByCount.map(p => ({ ...p, revenuePerUnit: p.count > 0 ? Math.round(p.revenue / p.count) : 0 }))
    , [topByCount]);

    // Monthly revenue breakdown — paginated
    const monthlyRevenue = useMemo(() => {
        if (!analytics) return { data: [], hasOlder: false, hasNewer: false, totalMonths: 0 };
        const months = {};
        (analytics.labels || []).forEach((label, i) => {
            const d = new Date(label);
            if (isNaN(d)) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months[key] = (months[key] || 0) + (analytics.revenue[i] || 0);
        });
        // Also include current calendar month even if zero
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!(currentKey in months)) months[currentKey] = 0;

        const MONTHS = ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
        const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
        const total = sorted.length;
        const PAGE = 5;
        const end   = Math.max(0, total - monthPage * PAGE);
        const start = Math.max(0, end - PAGE);
        const slice = sorted.slice(start, end);
        return {
            data: slice.map(([k, v]) => {
                const [yr, m] = k.split('-');
                return { label: `${MONTHS[parseInt(m) - 1]} ${yr}`, short: MONTHS[parseInt(m) - 1], value: v };
            }),
            hasOlder:    start > 0,
            hasNewer:    end < total,
            totalMonths: total,
        };
    }, [analytics, monthPage]);

    // Stage quotes map (for funnel drilldown)
    const stageQuotesMap = useMemo(() => {
        const map = {};
        quotes.forEach(q => { if (!map[q.status]) map[q.status] = []; map[q.status].push(q); });
        return map;
    }, [quotes]);

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
                                style={{ color: range === r.id ? '#007AFF' : '#86868B' }}>
                                {range === r.id && (
                                    <motion.div layoutId="range-pill" className="absolute inset-0 rounded-xl"
                                        style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.08) 100%)', border: '1px solid rgba(0,122,255,0.22)', boxShadow: '0 2px 8px rgba(0,122,255,0.15)' }}
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
                    trend={weekTrend.visits !== null ? Math.abs(weekTrend.visits) : undefined}
                    trendUp={weekTrend.visits === null || weekTrend.visits >= 0}
                    color="#007AFF" delay={0} onClick={() => setDrillKpi('visits')}
                    tooltip={{ text: 'סך כל הביקורים הייחודיים באתר. session חדש = כניסה חדשה. השוואה: 7 ימים אחרונים לעומת 7 לפניהם.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }} />
                <AdminKPICard title="עסקאות מוצלחות" icon="orders" value={totalSales}
                    trend={weekTrend.sales !== null ? Math.abs(weekTrend.sales) : undefined}
                    trendUp={weekTrend.sales === null || weekTrend.sales >= 0}
                    color="#34C759" delay={0.05} onClick={() => setDrillKpi('sales')}
                    tooltip={{ text: 'כמות ה-sessions שהסתיימו ברכישה. מחושב מנתוני analytics.sales ב-Firestore.', source: 'Firestore · analytics · sales[]', link: '/admin/orders', linkLabel: 'ניהול הזמנות' }} />
                <AdminKPICard title="יחס המרה" icon="traffic" value={`${avgConv}%`}
                    color="#5856D6" delay={0.1} onClick={() => setDrillKpi('conversion')}
                    tooltip={{ text: 'אחוז הגולשים שהפכו ללקוחות. מחושב: עסקאות ÷ כניסות × 100. ממוצע כל-הזמן.', source: 'analytics.sales ÷ analytics.visits × 100', link: '/admin/analytics', linkLabel: 'ניתוח משפך' }} />
                <AdminKPICard title="הכנסות ברוטו" icon="revenue" value={`₪${kpis.totalRevenue.toLocaleString()}`}
                    trend={weekTrend.revenue !== null ? Math.abs(weekTrend.revenue) : undefined}
                    trendUp={weekTrend.revenue === null || weekTrend.revenue >= 0}
                    color="#FF9500" delay={0.15} onClick={() => setDrillKpi('revenue')}
                    tooltip={{ text: 'סך כל ההכנסות הגולמיות מהזמנות שנסגרו. לפני ניכוי עמלות ועלויות ספק.', source: 'Firestore · orders · total (סכום כולל)', link: '/admin/orders', linkLabel: 'ראה הזמנות' }} />
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
                        {/* ── Action Items Panel ─── */}
                        <Card
                            accent={actionItems.length > 0 ? 'linear-gradient(90deg,#FF9500,#FF3B30)' : 'linear-gradient(90deg,#34C759,#30D158)'}
                            title="פריטי פעולה"
                            titleTooltip={{ text: 'פריטים שדורשים טיפול: הצעות ממתינות לאישור > 2 ימים, הצעות תקועות > 10 ימים, ועסקאות שנסגרו ב-7 הימים האחרונים.', source: 'Firestore · quotes · status + history[last].ts', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}
                            subtitle={actionItems.length > 0 ? `${actionItems.length} פריטים דורשים תשומת לב` : 'הכל תקין — אין פעולות נדרשות'}
                            action={
                                <span className="text-[11px] font-black rounded-full px-2.5 py-0.5 text-white"
                                    style={{ background: actionItems.length > 0 ? '#FF3B30' : '#34C759' }}>
                                    {actionItems.length}
                                </span>
                            }
                        >
                            {actionItems.length === 0 ? (
                                <div className="flex items-center gap-3 py-3">
                                    <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: 'rgba(52,199,89,0.1)' }}>
                                        <CheckCircle2 size={18} className="text-[#34C759]" />
                                    </div>
                                    <div>
                                        <p className="text-[#34C759] font-black text-[13px]">הכל תחת שליטה</p>
                                        <p className="text-[#AEAEB2] text-[11px]">אין הצעות תקועות, אין ממתינות לאישור</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2.5 mt-1">
                                    {actionItems.map((item, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 rounded-[14px] p-3 cursor-pointer group"
                                            style={{ background: item.type === 'win' ? 'rgba(52,199,89,0.06)' : item.type === 'pending' ? 'rgba(88,86,214,0.06)' : 'rgba(255,149,0,0.06)', border: `1px solid ${item.color}18` }}
                                            onClick={() => navigate(`/admin/orders?quoteId=${item.quoteId}`)}
                                        >
                                            <span className="text-[18px] shrink-0">{item.icon}</span>
                                            <div className="flex-1 min-w-0 text-right">
                                                <p className="text-[12px] font-black truncate" style={{ color: '#1D1D1F' }}>{item.text}</p>
                                                <p className="text-[10px] font-semibold" style={{ color: item.color }}>{item.sub}</p>
                                            </div>
                                            <ChevronLeft size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: item.color }} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* ── Pipeline Health Strip ─── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { key: 'pipeline', label: 'שווי Pipeline', value: `₪${pipelineStats.pipelineValue.toLocaleString()}`, color: '#007AFF', icon: <Target size={14} />, sub: `${pipelineStats.openCount} הצעות פתוחות`, tooltip: { text: 'סך שווי כל ההצעות הפתוחות (לא נסגרו/בוטלו). זה הכסף הפוטנציאלי שיכול להיסגר.', source: 'Firestore · quotes (סטטוסים פתוחים) · subtotal', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                { key: 'winrate',  label: 'שיעור סגירה', value: pipelineStats.winRate !== null ? `${pipelineStats.winRate}%` : '—', color: '#34C759', icon: <TrendingUp size={14} />, sub: `${closedStats.total} נסגרו`, tooltip: { text: 'אחוז ההצעות שהתסיימו בעסקה. מחושב: נסגרו ÷ (נסגרו + אבדו/בוטלו) × 100.', source: 'Firestore · quotes (נסגר+סופק vs אבד+בוטל)', link: '/admin/analytics', linkLabel: 'ניתוח משפך' } },
                                { key: 'cycle',    label: 'זמן ממוצע לסגירה', value: pipelineStats.avgCycle !== null ? `${pipelineStats.avgCycle} יום` : '—', color: '#5856D6', icon: <Clock size={14} />, sub: 'מליד לעסקה', tooltip: { text: 'ממוצע ימים מיצירת ההצעה ועד שנסגרה. מחושב מה-history timestamps של כל הצעה.', source: 'Firestore · quotes · history[].ts (ראשון → סגירה)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                { key: 'risk',     label: 'ב-Risk', value: `₪${pipelineStats.atRiskValue.toLocaleString()}`, color: pipelineStats.atRisk.length > 0 ? '#FF3B30' : '#34C759', icon: <AlertTriangle size={14} />, sub: `${pipelineStats.atRisk.length} הצעות מעל 21 יום`, tooltip: { text: 'שווי הצעות פתוחות שנוצרו לפני יותר מ-21 יום ועדיין לא נסגרו. סיכון גבוה לאובדן.', source: 'Firestore · quotes (פתוחות, dateTs > 21 ימים)', link: '/admin/orders', linkLabel: 'בדוק הצעות' } },
                            ].map((kpi, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="rounded-[16px] p-4 text-right cursor-pointer group"
                                    style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${kpi.color}22`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s' }}
                                    whileHover={{ y: -2, boxShadow: `0 6px 20px ${kpi.color}22` }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setDrillKpi(kpi.key)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${kpi.color}15`, color: kpi.color }}><ChevronLeft size={12} /></div>
                                        <span className="flex items-center gap-0.5"><p className="text-[11px] text-[#AEAEB2] font-semibold">{kpi.label}</p><InfoTooltip text={kpi.tooltip.text} source={kpi.tooltip.source} link={kpi.tooltip.link} linkLabel={kpi.tooltip.linkLabel} /></span>
                                    </div>
                                    <p className="font-black text-[20px] leading-none mb-1" style={{ color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
                                    <p className="text-[10px] text-[#AEAEB2] font-semibold">{kpi.sub}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── Revenue + Traffic Grids ─── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card title="מחזור הכנסות" subtitle={`${range} ימים אחרונים`}
                                accent="linear-gradient(90deg,#34C759,#30D158)"
                                titleTooltip={{ text: 'הכנסות כספיות לפי יום. כל תא = יום אחד. עוצמת הצבע = גובה ההכנסה.', source: 'Firestore · analytics · revenue[]', link: '/admin/orders', linkLabel: 'ראה הזמנות' }}
                                action={<span className="text-[#34C759] text-xs font-black">₪{totalRevenue.toLocaleString()}</span>}>
                                {totalRevenue > 0
                                    ? <HeatGrid data={rangeData?.revenue || analytics.revenue} color="#34C759" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart />}
                            </Card>
                            <Card title="תנועת מבקרים" subtitle={`${range} ימים אחרונים`}
                                accent="linear-gradient(90deg,#007AFF,#5856D6)"
                                titleTooltip={{ text: 'כניסות ייחודיות לאתר לפי יום. session חדש = כניסה חדשה.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}
                                action={<span className="text-[#007AFF] text-xs font-black">{totalVisits.toLocaleString()}</span>}>
                                {totalVisits > 0
                                    ? <HeatGrid data={rangeData?.visits || analytics.visits} color="#007AFF" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart label="טרם הצטברו נתוני תנועה" />}
                            </Card>
                        </div>

                        {/* ── Pipeline Waterfall ─── */}
                        <Card title="ערך Pipeline לפי שלב" subtitle="כמה כסף יושב בכל שלב · לייב"
                            accent="linear-gradient(90deg,#007AFF,#5856D6)"
                            titleTooltip={{ text: 'פיזור שווי ההצעות הפתוחות לפי שלב במשפך. עוזר לזהות איפה הכסף תקוע.', source: 'Firestore · quotes (פתוחות) · status + subtotal', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}>
                            {pipelineStats.openCount === 0 ? (
                                <EmptyChart label="אין הצעות פתוחות כרגע" />
                            ) : (
                                <div className="space-y-2.5 mt-1">
                                    {[
                                        { key: 'חדש', label: 'ליד חדש', color: '#FF3B30' },
                                        { key: 'ביצירת קשר', label: 'ביצירת קשר', color: '#FF9500' },
                                        { key: 'בדיקת מלאי', label: 'בדיקת מלאי', color: '#AF52DE' },
                                        { key: 'הוצע מחיר', label: 'הצעה נשלחה', color: '#007AFF' },
                                        { key: 'ממתין לאישור', label: 'ממתין לאישור', color: '#5856D6' },
                                        { key: 'הועבר לספק', label: 'הועבר לספק', color: '#0891B2' },
                                        { key: 'בדרך', label: 'בדרך', color: '#7C3AED' },
                                    ].map((stage, i) => {
                                        const sv = pipelineStats.stageValues[stage.key] || { count: 0, value: 0 };
                                        if (sv.count === 0) return null;
                                        const pct = pipelineStats.pipelineValue > 0 ? (sv.value / pipelineStats.pipelineValue) * 100 : 0;
                                        return (
                                            <motion.div key={stage.key}
                                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => navigate('/admin/orders')}
                                            >
                                                <div className="w-24 text-right shrink-0">
                                                    <p className="text-[11px] font-black text-[#1D1D1F] truncate">{stage.label}</p>
                                                    <p className="text-[9px] text-[#AEAEB2] font-semibold">{sv.count} הצעות</p>
                                                </div>
                                                <div className="flex-1 h-8 rounded-[8px] overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                    <motion.div
                                                        className="absolute right-0 top-0 h-full rounded-[8px]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(pct, sv.count > 0 ? 5 : 0)}%` }}
                                                        transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                        style={{ background: `linear-gradient(90deg, ${stage.color}25, ${stage.color}90)` }}
                                                    />
                                                </div>
                                                <div className="w-20 text-left shrink-0">
                                                    <p className="text-[11px] font-black" style={{ color: stage.color }}>₪{sv.value.toLocaleString()}</p>
                                                    <p className="text-[9px] text-[#AEAEB2] font-semibold">{Math.round(pct)}%</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* Weekly Summary */}
                        <Card title="סיכום שבועי"
                            subtitle={weekPage === 0 ? '4 שבועות אחרונים' : `${weekPage * 4 + 1}–${(weekPage + 1) * 4} שבועות אחורה`}
                            accent="linear-gradient(90deg,#FF9500,#5856D6)"
                            titleTooltip={{ text: 'כניסות, מכירות והכנסות לכל שבוע. נחלק לפי שבוע קלנדרי.', source: 'Firestore · analytics · visits[] + sales[] + revenue[]', link: '/admin/analytics', linkLabel: 'דוח אנליטיקה' }}
                            action={
                                <div className="flex items-center gap-1">
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setWeekPage(p => p + 1)} disabled={!weeklySummary.hasOlder}
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                        style={{ background: weeklySummary.hasOlder ? 'rgba(255,149,0,0.12)' : 'rgba(0,0,0,0.04)', color: weeklySummary.hasOlder ? '#FF9500' : '#C7C7CC', cursor: weeklySummary.hasOlder ? 'pointer' : 'default' }}>
                                        <ChevronRight size={13} />
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => setWeekPage(p => Math.max(0, p - 1))} disabled={!weeklySummary.hasNewer}
                                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                        style={{ background: weeklySummary.hasNewer ? 'rgba(255,149,0,0.12)' : 'rgba(0,0,0,0.04)', color: weeklySummary.hasNewer ? '#FF9500' : '#C7C7CC', cursor: weeklySummary.hasNewer ? 'pointer' : 'default' }}>
                                        <ChevronLeft size={13} />
                                    </motion.button>
                                </div>
                            }>
                            <div className="divide-y divide-black/04">
                                {weeklySummary.data.map((w, i) => (
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
                        <Card title="כניסות ייחודיות — 30 ימים" subtitle="מבוסס על sessions ייחודיים · Firestore"
                            accent="linear-gradient(90deg,#007AFF,#5856D6)"
                            titleTooltip={{ text: 'כניסות ייחודיות = session חדש שנפתח באתר. נרשם ב-Firestore בכל פעם שגולש פותח את האתר.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}
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
                            <Card title="מדדי תנועה" accent="linear-gradient(90deg,#007AFF,#5856D6)"
                                titleTooltip={{ text: 'מדדי תנועה מסכמים: ממוצע יומי, שיא, ימים פעילים ויחס המרה — כולם מחושבים ממאגר analytics ב-Firestore.', source: 'Firestore · analytics · visits[] + sales[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}>
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
                    <motion.div key="revenue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                        {/* ── KPI strip ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: 'הכנסות כוללות', value: `₪${kpis.totalRevenue.toLocaleString()}`, color: '#34C759', sub: `${closedStats.total} עסקאות`, tooltip: { text: 'סך כל ההכנסות הגולמיות מכלל הזמנות שנסגרו. לפני ניכויים.', source: 'Firestore · orders · total (מצטבר)', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { label: 'החודש הנוכחי', value: `₪${kpis.thisMonthRevenue.toLocaleString()}`, color: '#007AFF', sub: kpis.totalRevenue > 0 ? `${Math.round(kpis.thisMonthRevenue / kpis.totalRevenue * 100)}% מהסה"כ` : '—', tooltip: { text: 'הכנסות שנרשמו מתחילת החודש הנוכחי בלבד.', source: 'Firestore · kpis · thisMonthRevenue', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { label: 'ממוצע לעסקה (AOV)', value: `₪${kpis.avgOrderValue.toLocaleString()}`, color: '#5856D6', sub: 'ממוצע כל הזמנה', tooltip: { text: 'Average Order Value — כמה שווה כל עסקה בממוצע. מחושב: הכנסות ÷ מספר הזמנות.', source: 'Firestore · orders · total ÷ count', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { label: 'רווח ממוצע', value: closedStats.avgProfit !== null ? `${closedStats.avgProfit}%` : '—', color: closedStats.avgProfit >= 20 ? '#34C759' : '#FF9500', sub: 'מהגזמאות עם נתוני עלות', tooltip: { text: 'ממוצע שיעור הרווח (%) מהצעות שנסגרו ושיש להן נתוני עלות ספק ב-ProfitCalculator.', source: 'Firestore · quotes · pricingData.profitPct', link: '/admin/orders', linkLabel: 'ראה הצעות' } },
                            ].map((k, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="rounded-[18px] p-4 text-right" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                                    <span className="flex items-center justify-end gap-0.5 mb-1"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{k.label}</p><InfoTooltip text={k.tooltip.text} source={k.tooltip.source} link={k.tooltip.link} linkLabel={k.tooltip.linkLabel} /></span>
                                    <p className="font-black text-[22px] leading-none tracking-tight" style={{ color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                                    <p className="text-[10px] text-[#C7C7CC] font-medium mt-1.5">{k.sub}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* ── Revenue chart ── */}
                        <Card accent="linear-gradient(90deg,#34C759,#007AFF)"
                            title="מחזור הכנסות"
                            subtitle={`${range} ימים אחרונים`}
                            titleTooltip={{ text: 'גרף עמודות של הכנסות יומיות בטווח הזמן הנבחר. כל עמודה = יום אחד.', source: 'Firestore · analytics · revenue[]', link: '/admin/orders', linkLabel: 'ראה הזמנות' }}
                            action={<span className="text-[#34C759] text-xs font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{totalRevenue.toLocaleString()}</span>}>
                            {totalRevenue > 0
                                ? <BarChart data={rangeData?.revenue || analytics.revenue} color="#34C759" labels={rangeData?.labels || analytics.labels} height={160} />
                                : <EmptyChart label="טרם בוצעו עסקאות" />}
                        </Card>

                        {/* ── Monthly trend + Top Customers ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Monthly breakdown */}
                            <Card title="מגמה חודשית" subtitle="הכנסות לפי חודש" accent="linear-gradient(90deg,#5856D6,#007AFF)"
                                titleTooltip={{ text: 'הכנסות מצטברות לפי חודש קלנדרי. מחושב מה-labels של analytics ב-Firestore.', source: 'Firestore · analytics · labels[] + revenue[]', link: '/admin/analytics', linkLabel: 'דוח הכנסות' }}
                                action={
                                    <div className="flex items-center gap-1">
                                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setMonthPage(p => p + 1)} disabled={!monthlyRevenue.hasOlder}
                                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                            style={{ background: monthlyRevenue.hasOlder ? 'rgba(88,86,214,0.12)' : 'rgba(0,0,0,0.04)', color: monthlyRevenue.hasOlder ? '#5856D6' : '#C7C7CC', cursor: monthlyRevenue.hasOlder ? 'pointer' : 'default' }}>
                                            <ChevronRight size={13} />
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setMonthPage(p => Math.max(0, p - 1))} disabled={!monthlyRevenue.hasNewer}
                                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                            style={{ background: monthlyRevenue.hasNewer ? 'rgba(88,86,214,0.12)' : 'rgba(0,0,0,0.04)', color: monthlyRevenue.hasNewer ? '#5856D6' : '#C7C7CC', cursor: monthlyRevenue.hasNewer ? 'pointer' : 'default' }}>
                                            <ChevronLeft size={13} />
                                        </motion.button>
                                    </div>
                                }>
                                {monthlyRevenue.data.length === 0 ? <EmptyChart /> : (
                                    <div className="space-y-2.5 mt-1">
                                        {monthlyRevenue.data.map((m, i) => {
                                            const maxM = Math.max(...monthlyRevenue.data.map(x => x.value), 1);
                                            const pct = (m.value / maxM) * 100;
                                            const isLatest = monthPage === 0 && i === monthlyRevenue.data.length - 1;
                                            return (
                                                <div key={m.label} className="flex items-center gap-3">
                                                    <span className="text-[11px] font-black text-[#86868B] w-14 shrink-0 text-right">{m.short}</span>
                                                    <div className="flex-1 h-7 rounded-[8px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                        <motion.div className="h-full rounded-[8px] flex items-center justify-end pr-2.5"
                                                            initial={{ width: 0 }} animate={{ width: `${Math.max(pct, m.value > 0 ? 8 : 0)}%` }}
                                                            transition={{ delay: i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{ background: isLatest ? '#007AFF' : 'rgba(88,86,214,0.5)' }}>
                                                            {pct >= 18 && <span className="text-white text-[10px] font-black">₪{(m.value / 1000).toFixed(0)}k</span>}
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-[11px] font-black text-[#1D1D1F] w-20 text-left shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{m.value.toLocaleString()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>

                            {/* Top customers */}
                            <Card title="לקוחות מובילים" subtitle="לפי הכנסות כוללות" accent="linear-gradient(90deg,#FF9500,#FF3B30)"
                                titleTooltip={{ text: 'לקוחות שייצרו את ההכנסה הגבוהה ביותר — מחושב מהצעות שנסגרו. לחץ על לקוח לפתיחת ההצעה.', source: 'Firestore · quotes (נסגר+סופק) · contactName + subtotal', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}>
                                {topCustomers.length === 0 ? <EmptyChart label="אין עסקאות סגורות עדיין" /> : (
                                    <div className="divide-y divide-black/04 -mx-1">
                                        {topCustomers.map((c, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                className="flex items-center gap-3 py-2.5 px-1 cursor-pointer group rounded-[10px] hover:bg-black/02 transition-colors"
                                                onClick={() => navigate(`/admin/orders?quoteId=${c.quoteId}`)}>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
                                                    style={{ background: ['#007AFF','#5856D6','#34C759','#FF9500','#FF3B30','#AF52DE'][i] }}>
                                                    {(c.name || c.institution || '?')[0]}
                                                </div>
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-[12px] font-black text-[#1D1D1F] truncate">{c.name || c.institution}</p>
                                                    {c.institution && c.name && <p className="text-[10px] text-[#AEAEB2] truncate">{c.institution}</p>}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[12px] font-black text-[#1D1D1F]" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{c.revenue.toLocaleString()}</p>
                                                    <p className="text-[9px] text-[#AEAEB2]">{c.count} עסקאות</p>
                                                </div>
                                                <ChevronLeft size={12} className="opacity-0 group-hover:opacity-60 transition-opacity text-[#AEAEB2] shrink-0" />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* ── Category breakdown ── */}
                        {categoryRevenue.length > 0 && (
                            <Card title="הכנסות לפי קטגוריה" subtitle="פיזור כספי לפי תחום" accent="linear-gradient(90deg,#FF9500,#5856D6)"
                                titleTooltip={{ text: 'פיזור ההכנסות לפי קטגוריית מוצר. שדה category של כל הזמנה ב-Firestore.', source: 'Firestore · orders · category + total', link: '/admin/orders', linkLabel: 'ניהול הזמנות' }}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3 mt-1">
                                    {categoryRevenue.map(([cat, rev], i) => {
                                        const pct = Math.round((rev / (kpis.totalRevenue || 1)) * 100);
                                        return (
                                            <div key={cat} className="space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-black" style={{ color: DONUT_COLORS[i % DONUT_COLORS.length], fontVariantNumeric: 'tabular-nums' }}>₪{rev.toLocaleString()}</span>
                                                        <span className="text-[9px] font-bold text-[#AEAEB2] px-1.5 py-0.5 rounded-full" style={{ background: `${DONUT_COLORS[i % DONUT_COLORS.length]}15` }}>{pct}%</span>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-[#6E6E73]">{cat}</span>
                                                </div>
                                                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                    <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                                                        animate={{ width: `${(rev / maxCatRev) * 100}%` }}
                                                        transition={{ delay: i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                        style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {/* ── Profit Margin Trend ── */}
                        {(() => {
                            const withMargin = closedDeals
                                .filter(d => d.hasProfit && d.closedAt)
                                .sort((a, b) => (a.closedAt?.getTime() || 0) - (b.closedAt?.getTime() || 0))
                                .slice(-12);
                            if (withMargin.length < 2) return null;
                            const labels = withMargin.map(d => `${d.closedAt.getDate()}/${d.closedAt.getMonth() + 1}`);
                            const margins = withMargin.map(d => Math.round(d.profitPct));
                            const avgMargin = Math.round(margins.reduce((a, b) => a + b, 0) / margins.length);
                            const maxM = Math.max(...margins, 1);
                            return (
                                <Card title="מגמת רווחיות" subtitle="% רווח נטו לפי עסקאות סגורות עם נתוני מחיר"
                                    accent="linear-gradient(90deg,#AF52DE,#5856D6)"
                                    action={<span className="text-[11px] font-black px-2.5 py-0.5 rounded-full" style={{ background: avgMargin >= 20 ? 'rgba(52,199,89,0.14)' : 'rgba(255,149,0,0.14)', color: avgMargin >= 20 ? '#34C759' : '#FF9500' }}>ממוצע {avgMargin}%</span>}
                                >
                                    <div className="relative h-[90px] mt-2">
                                        {/* Target line at 20% */}
                                        <div className="absolute w-full border-t border-dashed"
                                            style={{ top: `${100 - (20 / maxM) * 100}%`, borderColor: 'rgba(52,199,89,0.3)' }}>
                                            <span className="absolute left-0 -top-3 text-[8px] font-bold text-[#34C759] opacity-60">יעד 20%</span>
                                        </div>
                                        {/* Bars */}
                                        <div className="absolute inset-0 flex items-end gap-1 px-1">
                                            {margins.map((m, i) => {
                                                const color = m >= 25 ? '#34C759' : m >= 15 ? '#007AFF' : m >= 0 ? '#FF9500' : '#FF3B30';
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                                        <span className="text-[7px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>{m}%</span>
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${Math.max(4, (m / maxM) * 76)}px` }}
                                                            transition={{ delay: i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                            className="w-full rounded-t-[3px]"
                                                            style={{ background: color, minHeight: 4 }}
                                                            title={`${labels[i]}: ${m}%`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-black/05">
                                        {[['#34C759','≥25%','מצוין'],['#007AFF','15–25%','טוב'],['#FF9500','0–15%','נמוך'],['#FF3B30','<0%','הפסד']].map(([c, r, l]) => (
                                            <span key={l} className="flex items-center gap-1 text-[9px] font-bold" style={{ color: '#86868B' }}>
                                                <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                                                {r} {l}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            );
                        })()}

                        {/* ── Closed Deals — table style ── */}
                        <Card title="עסקאות שנסגרו"
                            subtitle={closedStats.total > 0 ? `${closedStats.total} עסקאות · ₪${closedStats.totalRev.toLocaleString()} · AOV ₪${closedStats.avgDeal.toLocaleString()}` : 'עדיין אין עסקאות סגורות'}
                            accent="linear-gradient(90deg,#34C759,#30D158)"
                            titleTooltip={{ text: 'הצעות שהגיעו לסטטוס "נסגר" או "סופק". כולל נתוני רווח אם הוזנו ב-ProfitCalculator.', source: 'Firestore · quotes (status: נסגר, סופק) · pricingData', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}
                            action={<span className="text-[11px] font-black text-white rounded-full px-2.5 py-0.5" style={{ background: closedDeals.length > 0 ? '#34C759' : '#AEAEB2' }}>{closedDeals.length}</span>}>
                            {closedDeals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] flex items-center justify-center"><CheckCircle2 size={22} className="text-[#AEAEB2]" /></div>
                                    <p className="text-[#AEAEB2] text-sm font-semibold">עדיין אין עסקאות שנסגרו</p>
                                </div>
                            ) : (
                                <div className="-mx-1 mt-1">
                                    {/* Table header */}
                                    <div className="grid gap-2 px-2 pb-2 border-b border-black/05" style={{ gridTemplateColumns: '1fr 1fr 80px 70px 60px 16px' }}>
                                        {['לקוח','מוסד','₪ ערך','רווח','תאריך',''].map((h, i) => (
                                            <p key={i} className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest text-right">{h}</p>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-black/04">
                                        {closedDeals.map((deal, i) => (
                                            <motion.div key={deal.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                                className="grid items-center gap-2 px-2 py-3 cursor-pointer group hover:bg-black/02 rounded-[10px] transition-colors"
                                                style={{ gridTemplateColumns: '1fr 1fr 80px 70px 60px 16px' }}
                                                onClick={() => navigate(`/admin/orders?quoteId=${deal.id}`)}>
                                                <p className="text-[12px] font-bold text-[#1D1D1F] truncate text-right">{deal.contactName || '—'}</p>
                                                <p className="text-[11px] text-[#6E6E73] truncate text-right">{deal.institution || '—'}</p>
                                                <p className="text-[12px] font-black text-[#1D1D1F] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{deal.revenue.toLocaleString()}</p>
                                                <div className="text-right">
                                                    {deal.hasProfit ? (
                                                        <span className="text-[11px] font-black rounded-full px-1.5 py-0.5"
                                                            style={{ color: deal.profitPct >= 0 ? '#34C759' : '#FF3B30', background: deal.profitPct >= 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)' }}>
                                                            {deal.profitPct >= 0 ? '+' : ''}{deal.profitPct}%
                                                        </span>
                                                    ) : <span className="text-[10px] text-[#C7C7CC]">—</span>}
                                                </div>
                                                <p className="text-[10px] text-[#AEAEB2] font-medium text-right">
                                                    {deal.closedAt ? `${deal.closedAt.getDate()}/${deal.closedAt.getMonth() + 1}` : '—'}
                                                </p>
                                                <ChevronLeft size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {/* ── Products Tab ─────────────────────────────────────────────── */}
                {tab === 'products' && (
                    <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                        {/* ── Catalog health strip ── */}
                        {(() => {
                            const active = inventory.filter(p => p.isActive !== false).length;
                            const inactive = inventory.length - active;
                            const lowStockCount = inventory.filter(p => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= Number(p.stockThreshold ?? p.minStock ?? 3)).length;
                            const outOfStock = inventory.filter(p => Number(p.stock ?? 0) === 0 && p.isActive !== false).length;
                            const neverSold = deadProducts.length; // full unsliced list
                            return (
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                    {[
                                        { label: 'סה"כ מוצרים', value: inventory.length, color: '#1D1D1F', route: '/admin/inventory', tooltip: { text: 'כלל המוצרים במאגר — פעילים ולא פעילים יחד.', source: 'Firestore · inventory (כולל isActive=false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { label: 'פעילים', value: active, color: '#34C759', route: '/admin/inventory', tooltip: { text: 'מוצרים המוצגים כעת בחנות לגולשים. מוצרים שהוסתרו ידנית לא נספרים.', source: 'Firestore · inventory (isActive !== false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { label: 'מלאי נמוך', value: lowStockCount, color: '#FF9500', route: '/admin/inventory', tooltip: { text: 'מוצרים עם מלאי גדול מ-0 אבל נמוך מהסף שהוגדר (stockThreshold). דורשים הזמנה מהספק.', source: 'Firestore · inventory (0 < stock ≤ stockThreshold)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { label: 'אזל מהמלאי', value: outOfStock, color: '#FF3B30', route: '/admin/inventory', tooltip: { text: 'מוצרים פעילים שמלאיהם = 0. גולשים רואים אותם אבל לא יכולים לרכוש.', source: 'Firestore · inventory (stock === 0, isActive !== false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { label: 'ללא מכירות', value: neverSold, color: '#86868B', route: '/admin/inventory', tooltip: { text: 'מוצרים פעילים שלא נמכרו אף פעם — אין להם שום הזמנה בכל הזמן.', source: 'inventory (פעילים) MINUS orders · productId', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                    ].map((k, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="rounded-[18px] p-3 text-right cursor-pointer group"
                                            style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${i > 0 ? k.color + '22' : 'rgba(0,0,0,0.06)'}`, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                                            onClick={() => navigate(k.route)}>
                                            <span className="flex items-center justify-end gap-0.5 mb-1"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{k.label}</p><InfoTooltip text={k.tooltip.text} source={k.tooltip.source} link={k.tooltip.link} linkLabel={k.tooltip.linkLabel} /></span>
                                            <p className="font-black text-[22px] leading-none" style={{ color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* ── Product leaderboard ── */}
                        <Card title="טבלת ביצועי מוצרים" subtitle="לפי הכנסות — לחץ לפתיחה במלאי" accent="linear-gradient(90deg,#007AFF,#5856D6)"
                            titleTooltip={{ text: 'דירוג מוצרים לפי הכנסה כוללת. עמודת "אחמ׳" = AOV של המוצר הספציפי (הכנסות ÷ יחידות).', source: 'Firestore · orders · productId + total + qty', link: '/admin/inventory', linkLabel: 'ניהול מוצרים' }}>
                            {productTable.length === 0 ? <EmptyChart label="אין הזמנות עדיין" /> : (
                                <div className="-mx-1 mt-1">
                                    <div className="grid gap-2 px-2 pb-2 border-b border-black/05" style={{ gridTemplateColumns: '24px 32px 1fr 60px 80px 70px 16px' }}>
                                        {['#','','מוצר','יח׳','הכנסות','אחמ׳',''].map((h, i) => (
                                            <p key={i} className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest text-right">{h}</p>
                                        ))}
                                    </div>
                                    <div className="divide-y divide-black/03">
                                        {productTable.map((p, i) => (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                className="grid items-center gap-2 px-2 py-2.5 cursor-pointer group hover:bg-black/02 rounded-[10px] transition-colors"
                                                style={{ gridTemplateColumns: '24px 32px 1fr 60px 80px 70px 16px' }}
                                                onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(p.productId || p.title)}`)}>
                                                <span className="text-[10px] font-black text-[#AEAEB2] text-center">{i + 1}</span>
                                                <div className="w-8 h-8 rounded-[9px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#F5F5F7' }}>
                                                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : <Box size={13} className="text-[#AEAEB2]" />}
                                                </div>
                                                <p className="text-[11px] font-bold text-[#1D1D1F] truncate text-right">{p.title}</p>
                                                <p className="text-[11px] font-black text-[#6E6E73] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.count}</p>
                                                <p className="text-[11px] font-black text-[#1D1D1F] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{p.revenue.toLocaleString()}</p>
                                                <p className="text-[10px] text-[#AEAEB2] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{p.revenuePerUnit.toLocaleString()}</p>
                                                <ChevronLeft size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* ── Dead stock + Sales calendar ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Dead stock */}
                            <Card title="מוצרים ללא מכירות" subtitle="בקטלוג אבל אפס הזמנות" accent="linear-gradient(90deg,#86868B,#AEAEB2)"
                                titleTooltip={{ text: 'מוצרים פעילים שאין להם שום הזמנה — מת-stock. שקול להפחית מחיר, לפרסם, או להסיר מהקטלוג.', source: 'inventory (isActive) MINUS orders · productId (כל הזמן)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' }}>
                                {deadProducts.length === 0 ? (
                                    <div className="flex items-center gap-2 py-4">
                                        <CheckCircle2 size={16} className="text-[#34C759] shrink-0" />
                                        <p className="text-[#34C759] text-sm font-bold">כל המוצרים הפעילים נמכרו</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 mt-1">
                                        {deadProducts.slice(0, 6).map((p, i) => (
                                            <motion.div key={p.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                                className="flex items-center gap-2.5 p-2 rounded-[10px] cursor-pointer hover:bg-black/02 transition-colors group"
                                                onClick={() => navigate(`/admin/inventory?search=${encodeURIComponent(p.title || p.name || '')}`)}>
                                                <div className="w-7 h-7 rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#F5F5F7' }}>
                                                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} /> : <Box size={11} className="text-[#AEAEB2]" />}
                                                </div>
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{p.title || p.name || p.id}</p>
                                                    <p className="text-[9px] text-[#AEAEB2]">{p.category || 'ללא קטגוריה'} · מלאי: {p.stock ?? '—'}</p>
                                                </div>
                                                <ChevronLeft size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2] shrink-0" />
                                            </motion.div>
                                        ))}
                                        {deadProducts.length > 6 && (
                                            <p className="text-[10px] text-[#AEAEB2] text-center pt-1 font-semibold cursor-pointer hover:text-[#007AFF] transition-colors" onClick={() => navigate('/admin/inventory')}>
                                                + {deadProducts.length - 6} מוצרים נוספים →
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card>

                            {/* Sales volume heatgrid */}
                            <Card title="נפח עסקאות" subtitle={`${range} ימים אחרונים`} accent="linear-gradient(90deg,#5856D6,#007AFF)">
                                {totalSales > 0
                                    ? <HeatGrid data={rangeData?.sales || analytics.sales} color="#5856D6" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart label="טרם בוצעו עסקאות" />}
                            </Card>
                        </div>
                    </motion.div>
                )}
                {/* ── Funnel Tab ───────────────────────────────────────────────── */}
                {tab === 'funnel' && (
                    <motion.div key="funnel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                        {/* ── KPI strip ── */}
                        {(() => {
                            const closed = (funnelData.find(s => s.key === 'נסגר')?.count || 0) + (funnelData.find(s => s.key === 'סופק')?.count || 0);
                            const total = funnelData[0]?.count || 0;
                            const active = quotes.filter(q => !['נסגר','סופק','אבד','בוטל'].includes(q.status)).length;
                            const lost = quotes.filter(q => ['אבד','בוטל'].includes(q.status)).length;
                            return (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { label: 'סה"כ לידים', value: total, color: '#007AFF', tooltip: { text: 'כמות הצעות המחיר שנוצרו בסיסטם. כל הצעה = ליד אחד שנכנס למשפך.', source: 'Firestore · quotes (כל הסטטוסים)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                        { label: 'עסקאות נסגרו', value: closed, color: '#34C759', tooltip: { text: 'הצעות שהגיעו לסטטוס "נסגר" או "סופק". אלה ההכנסות בפועל.', source: 'Firestore · quotes (status: נסגר, סופק)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                        { label: 'יחס המרה', value: `${total > 0 ? Math.round(closed / total * 100) : 0}%`, color: '#5856D6', tooltip: { text: 'אחוז הלידים שהתסיימו בעסקה. מחושב: נסגרו ÷ סה"כ לידים × 100.', source: 'quotes (נסגר+סופק) ÷ quotes (הכל) × 100', link: '/admin/analytics', linkLabel: 'ניתוח משפך' } },
                                        { label: 'ממתינות · אבדו', value: `${active} · ${lost}`, color: '#FF9500', tooltip: { text: 'ממתינות = הצעות פתוחות עדיין. אבדו = הצעות שבוטלו או סומנו כ"אבד". שתיהן בנפרד.', source: 'Firestore · quotes · status (פתוחות vs אבד+בוטל)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                    ].map((s, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="rounded-[18px] p-4 text-right" style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${s.color}22`, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                                            <span className="flex items-center justify-end gap-0.5 mb-1"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{s.label}</p><InfoTooltip text={s.tooltip.text} source={s.tooltip.source} link={s.tooltip.link} linkLabel={s.tooltip.linkLabel} /></span>
                                            <p className="font-black text-[22px] leading-none tracking-tight" style={{ color: s.color, fontVariantNumeric: 'tabular-nums' }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* ── Main Funnel — table style with drilldown ── */}
                        <Card title="משפך המרה" subtitle="כל שלב · לחץ לפירוט הצעות · לייב" accent="linear-gradient(90deg,#007AFF,#34C759)"
                            titleTooltip={{ text: 'תצוגת מעבר לכל שלב במשפך המכירות. לחץ על שלב לראות את ההצעות הספציפיות. "זמן" = ממוצע ימים בשלב זה.', source: 'Firestore · quotes · status + history[].ts', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}>
                            {quotes.length === 0 ? <EmptyChart label="אין הצעות מחיר עדיין" /> : (
                                <div className="-mx-1 mt-1">
                                    <div className="grid gap-2 px-2 pb-2 border-b border-black/05" style={{ gridTemplateColumns: '120px 1fr 70px 50px 50px' }}>
                                        {['שלב','','הצעות','₪ ערך','זמן'].map((h, i) => (
                                            <p key={i} className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest text-right">{h}</p>
                                        ))}
                                    </div>
                                    {funnelData.map((stage, i) => {
                                        const stageVal = (stageQuotesMap[stage.key] || []).reduce((s, q) => s + (Number(q.subtotal) || 0), 0);
                                        const isActive = funnelStage === stage.key;
                                        const stageList = stageQuotesMap[stage.key] || [];
                                        return (
                                            <div key={stage.key}>
                                                {i > 0 && stage.dropPct > 0 && (
                                                    <div className="flex items-center gap-1 px-3 py-0.5" style={{ borderLeft: `2px solid ${stage.dropPct >= 40 ? '#FF3B30' : '#FF9500'}22` }}>
                                                        <ArrowDown size={9} style={{ color: stage.dropPct >= 40 ? '#FF3B30' : '#FF9500' }} />
                                                        <span className="text-[9px] font-black" style={{ color: stage.dropPct >= 40 ? '#FF3B30' : '#FF9500' }}>-{stage.dropPct}% נשירה</span>
                                                    </div>
                                                )}
                                                <motion.div
                                                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                                    className="grid items-center gap-2 px-2 py-2.5 cursor-pointer group rounded-[10px] hover:bg-black/02 transition-colors"
                                                    style={{ gridTemplateColumns: '120px 1fr 70px 50px 50px', background: isActive ? `${stage.color}08` : undefined }}
                                                    onClick={() => setFunnelStage(isActive ? null : stage.key)}>
                                                    <div className="flex items-center gap-2 text-right">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stage.color }} />
                                                        <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{stage.label}</p>
                                                    </div>
                                                    <div className="h-6 rounded-[6px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                        <motion.div className="h-full rounded-[6px]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.max(stage.widthPct, stage.count > 0 ? 4 : 0)}%` }}
                                                            transition={{ delay: i * 0.07 + 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{ background: stage.color, opacity: 0.75 }} />
                                                    </div>
                                                    <p className="text-[11px] font-black text-right" style={{ color: stage.color, fontVariantNumeric: 'tabular-nums' }}>{stage.count}</p>
                                                    <p className="text-[10px] font-bold text-[#6E6E73] text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{stageVal > 0 ? `₪${(stageVal / 1000).toFixed(0)}k` : '—'}</p>
                                                    <p className="text-[10px] text-[#AEAEB2] text-right">{stage.avgDays !== null ? `${stage.avgDays}י` : '—'}</p>
                                                </motion.div>
                                                {/* Stage drilldown */}
                                                <AnimatePresence>
                                                    {isActive && stageList.length > 0 && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden mx-2 mb-1 rounded-[12px]" style={{ background: `${stage.color}06`, border: `1px solid ${stage.color}18` }}>
                                                            {stageList.slice(0, 5).map((q, qi) => (
                                                                <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: qi * 0.03 }}
                                                                    className="flex items-center gap-3 px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-black/02 transition-colors group"
                                                                    style={{ borderColor: `${stage.color}12` }}
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders?quoteId=${q.id}`); }}>
                                                                    <div className="flex-1 min-w-0 text-right">
                                                                        <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{q.contactName || q.institution || q.id}</p>
                                                                        <p className="text-[9px] text-[#AEAEB2]">{q.institution && q.contactName ? q.institution : ''}</p>
                                                                    </div>
                                                                    <p className="text-[11px] font-black shrink-0" style={{ color: stage.color, fontVariantNumeric: 'tabular-nums' }}>₪{(Number(q.subtotal) || 0).toLocaleString()}</p>
                                                                    <ChevronLeft size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2] shrink-0" />
                                                                </motion.div>
                                                            ))}
                                                            {stageList.length > 5 && <p className="text-[10px] text-[#AEAEB2] text-center py-1.5 font-semibold">+{stageList.length - 5} נוספות</p>}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* ── Bottleneck + Revenue at risk ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Bottleneck */}
                            <Card title="ניתוח צווארי בקבוק" subtitle="שלבים עם שיעור נשירה גבוה" accent="linear-gradient(90deg,#FF3B30,#FF9500)"
                                titleTooltip={{ text: 'שלבים שבהם אחוז הנשירה ≥ 20%. נשירה = הצעות שלא עברו לשלב הבא. ≥ 50% = קריטי.', source: 'funnelData · dropPct (מחושב מ-history)', link: '/admin/analytics', linkLabel: 'ניתוח משפך' }}>
                                {(() => {
                                    const bns = funnelData.filter(s => s.dropPct >= 20).sort((a, b) => b.dropPct - a.dropPct).slice(0, 4);
                                    if (bns.length === 0) return (
                                        <div className="flex items-center gap-2 py-4"><CheckCircle2 size={14} className="text-[#34C759]" /><p className="text-[#34C759] text-sm font-bold">אין צווארי בקבוק</p></div>
                                    );
                                    return (
                                        <div className="space-y-3 mt-1">
                                            {bns.map((s, i) => (
                                                <motion.div key={s.key} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                                    className="space-y-1.5">
                                                    <div className="flex justify-between">
                                                        <span className="text-[12px] font-black" style={{ color: s.dropPct >= 50 ? '#FF3B30' : '#FF9500' }}>-{s.dropPct}%</span>
                                                        <span className="text-[11px] font-semibold text-[#1D1D1F]">{s.label}</span>
                                                    </div>
                                                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(s.dropPct, 100)}%` }}
                                                            transition={{ delay: i * 0.08 + 0.3, duration: 0.7 }}
                                                            style={{ background: s.dropPct >= 50 ? '#FF3B30' : '#FF9500' }} />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </Card>

                            {/* Revenue at risk */}
                            <Card title="הכנסה בסיכון" subtitle="הצעות ללא פעילות > 7 ימים" accent="linear-gradient(90deg,#FF9500,#FF3B30)"
                                titleTooltip={{ text: 'הצעות פתוחות שלא היה בהן אף שינוי סטטוס יותר מ-7 ימים. הסיכון: הלקוח מתקרר ועלול לאבד עניין.', source: 'Firestore · quotes · history[last].ts vs Date.now() > 7 ימים', link: '/admin/orders', linkLabel: 'בדוק הצעות' }}>
                                {pipelineStats.staleQuotes.length === 0 ? (
                                    <div className="flex items-center gap-2 py-4"><CheckCircle2 size={14} className="text-[#34C759]" /><p className="text-[#34C759] text-sm font-bold">אין הצעות תקועות</p></div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-baseline mb-3 pb-2 border-b border-black/05">
                                            <p className="text-[20px] font-black text-[#FF3B30]" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{pipelineStats.staleValue.toLocaleString()}</p>
                                            <p className="text-[11px] text-[#AEAEB2]">{pipelineStats.staleQuotes.length} הצעות תקועות</p>
                                        </div>
                                        {pipelineStats.staleQuotes.slice(0, 5).map((q, i) => {
                                            const last = [...(q.history || [])].reverse()[0]?.ts || q.dateTs;
                                            const days = last ? Math.round((Date.now() - last) / 86400000) : '—';
                                            return (
                                                <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                                    className="flex items-center gap-2 py-1.5 cursor-pointer group hover:bg-black/02 rounded-[8px] px-1 transition-colors"
                                                    onClick={() => navigate(`/admin/orders?quoteId=${q.id}`)}>
                                                    <span className="text-[10px] font-black shrink-0 w-8 text-right" style={{ color: Number(days) > 14 ? '#FF3B30' : '#FF9500', fontVariantNumeric: 'tabular-nums' }}>{days}י</span>
                                                    <div className="flex-1 min-w-0 text-right">
                                                        <p className="text-[11px] font-bold text-[#1D1D1F] truncate">{q.contactName || q.institution || q.id}</p>
                                                        <p className="text-[9px] text-[#AEAEB2]">{q.status}</p>
                                                    </div>
                                                    <p className="text-[11px] font-black text-[#1D1D1F] shrink-0" style={{ fontVariantNumeric: 'tabular-nums' }}>₪{(Number(q.subtotal) || 0).toLocaleString()}</p>
                                                    <ChevronLeft size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2] shrink-0" />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>

            {/* ── KPI Drilldown Modal ──────────────────────────────────────────── */}
            {(() => {
                const kpiMeta = {
                    visits:     { title: 'כניסות ייחודיות',    color: '#007AFF', route: '/admin/analytics', routeLabel: 'דוח תנועה מלא', tabKey: 'traffic' },
                    sales:      { title: 'עסקאות מוצלחות',     color: '#34C759', route: '/admin/analytics', routeLabel: 'דוח מכירות',     tabKey: 'funnel' },
                    conversion: { title: 'יחס המרה',            color: '#5856D6', route: '/admin/analytics', routeLabel: 'משפך המרה',       tabKey: 'funnel' },
                    revenue:    { title: 'הכנסות ברוטו',        color: '#FF9500', route: '/admin/analytics', routeLabel: 'דוח הכנסות',      tabKey: 'revenue' },
                    pipeline:   { title: 'שווי Pipeline',       color: '#007AFF', route: '/admin/orders',    routeLabel: 'ניהול הזמנות',    tabKey: null },
                    winrate:    { title: 'שיעור סגירה',          color: '#34C759', route: '/admin/analytics', routeLabel: 'משפך המרה',       tabKey: 'funnel' },
                    cycle:      { title: 'זמן ממוצע לסגירה',    color: '#5856D6', route: '/admin/orders',    routeLabel: 'ניהול הזמנות',    tabKey: null },
                    risk:       { title: 'הצעות ב-Risk',         color: '#FF3B30', route: '/admin/orders',    routeLabel: 'ניהול הזמנות',    tabKey: null },
                };
                const m = drillKpi ? kpiMeta[drillKpi] : null;
                if (!m) return null;

                const statCard = (label, value, color) => (
                    <div className="rounded-[14px] p-3 text-center" style={{ background: `${color || m.color}0C`, border: `1px solid ${color || m.color}20` }}>
                        <p className="font-black text-[15px]" style={{ color: color || m.color }}>{value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-0.5">{label}</p>
                    </div>
                );

                const visitArr = analytics?.visits || [];
                const salesArr = analytics?.sales || [];
                const revArr   = analytics?.revenue || [];
                const labArr   = analytics?.labels || [];

                const computeTrend = (arr) => {
                    const h = Math.floor(arr.length / 2);
                    const f = arr.slice(0, h).reduce((a, b) => a + b, 0);
                    const s = arr.slice(h).reduce((a, b) => a + b, 0);
                    return f > 0 ? Math.round((s - f) / f * 100) : (s > 0 ? 100 : 0);
                };

                let content = null;
                if (drillKpi === 'visits') {
                    const total = visitArr.reduce((a, b) => a + b, 0);
                    const nonZ  = visitArr.filter(v => v > 0);
                    const avg   = nonZ.length ? Math.round(total / nonZ.length) : 0;
                    const peak  = Math.max(...visitArr, 0);
                    const trend = computeTrend(visitArr);
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-4 gap-3">{statCard('סה״כ', total.toLocaleString())}{statCard('ממוצע יומי', avg)}{statCard('שיא', peak)}{statCard('מגמה', `${trend >= 0 ? '+' : ''}${trend}%`, trend >= 0 ? '#34C759' : '#FF3B30')}</div>
                            {total > 0 && <div><p className="text-[#86868B] text-[11px] font-bold mb-2">30 ימים אחרונים</p><BarChart data={visitArr.slice(-30)} color={m.color} labels={labArr.slice(-30)} height={130} /></div>}
                        </div>
                    );
                } else if (drillKpi === 'sales') {
                    const total = salesArr.reduce((a, b) => a + b, 0);
                    const nonZ  = salesArr.filter(v => v > 0);
                    const avg   = nonZ.length ? Math.round(total / nonZ.length) : 0;
                    const peak  = Math.max(...salesArr, 0);
                    const trend = computeTrend(salesArr);
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-4 gap-3">{statCard('עסקאות', total)}{statCard('ממוצע', avg)}{statCard('שיא', peak)}{statCard('מגמה', `${trend >= 0 ? '+' : ''}${trend}%`, trend >= 0 ? '#34C759' : '#FF3B30')}</div>
                            {total > 0 && <div><p className="text-[#86868B] text-[11px] font-bold mb-2">30 ימים אחרונים</p><BarChart data={salesArr.slice(-30)} color={m.color} labels={labArr.slice(-30)} height={130} /></div>}
                        </div>
                    );
                } else if (drillKpi === 'conversion') {
                    const topFunnel = funnelData.slice(0, 5);
                    const topCount  = topFunnel[0]?.count || 1;
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-3 gap-3">{statCard('יחס המרה', `${avgConv}%`)}{statCard('כניסות', visitArr.reduce((a, b) => a + b, 0))}{statCard('רכישות', salesArr.reduce((a, b) => a + b, 0))}</div>
                            <div className="space-y-2.5 mt-1">
                                {topFunnel.map((s, i) => (
                                    <div key={s.key} className="flex items-center gap-3">
                                        <div className="w-24 text-right shrink-0"><p className="text-[11px] font-black text-[#1D1D1F] truncate">{s.label}</p><p className="text-[9px] text-[#AEAEB2]">{s.count}</p></div>
                                        <div className="flex-1 h-7 rounded-[7px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                            <motion.div className="h-full rounded-[7px]" initial={{ width: 0 }} animate={{ width: `${(s.count / topCount) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ background: s.color }} />
                                        </div>
                                        {s.dropPct > 0 && i > 0 && <span className="text-[10px] font-bold text-[#FF3B30] shrink-0 w-10 text-left">-{s.dropPct}%</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                } else if (drillKpi === 'revenue') {
                    const total = revArr.reduce((a, b) => a + b, 0);
                    const nonZ  = revArr.filter(v => v > 0);
                    const avg   = nonZ.length ? Math.round(total / nonZ.length) : 0;
                    const peak  = Math.max(...revArr, 0);
                    const trend = computeTrend(revArr);
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-4 gap-3">{statCard('סה״כ', `₪${total.toLocaleString()}`)}{statCard('ממוצע', `₪${avg.toLocaleString()}`)}{statCard('שיא', `₪${peak.toLocaleString()}`)}{statCard('מגמה', `${trend >= 0 ? '+' : ''}${trend}%`, trend >= 0 ? '#34C759' : '#FF3B30')}</div>
                            {total > 0 && <div><p className="text-[#86868B] text-[11px] font-bold mb-2">30 ימים אחרונים</p><BarChart data={revArr.slice(-30)} color={m.color} labels={labArr.slice(-30)} height={130} /></div>}
                            {topByCount.length > 0 && (
                                <div><p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2">מוצרים מובילים</p>
                                <div className="space-y-2">{topByCount.slice(0, 4).map((p, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#AEAEB2] w-4 text-center font-black">{i + 1}</span>
                                        <div className="flex-1"><div className="flex justify-between mb-1"><span className="text-[11px] font-black" style={{ color: m.color }}>₪{p.revenue.toLocaleString()}</span><span className="text-[11px] text-[#1D1D1F] truncate max-w-[130px]">{p.title}</span></div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}><motion.div initial={{ width: 0 }} animate={{ width: `${(p.revenue / (topByCount[0]?.revenue || 1)) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.6 }} className="h-full rounded-full" style={{ background: m.color }} /></div></div>
                                    </div>
                                ))}</div></div>
                            )}
                        </div>
                    );
                } else if (drillKpi === 'pipeline') {
                    const stages = Object.entries(pipelineStats.stageValues).filter(([, v]) => v.count > 0);
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-3 gap-3">{statCard('שווי', `₪${pipelineStats.pipelineValue.toLocaleString()}`)}{statCard('הצעות פתוחות', pipelineStats.openCount)}{statCard('שלבים פעילים', stages.length)}</div>
                            {stages.length > 0 && <div className="space-y-2">{stages.map(([stageName, sv], i) => {
                                const pct = pipelineStats.pipelineValue > 0 ? (sv.value / pipelineStats.pipelineValue) * 100 : 0;
                                return (
                                    <div key={stageName} className="flex items-center gap-3">
                                        <div className="w-24 text-right shrink-0"><p className="text-[11px] font-black text-[#1D1D1F] truncate">{stageName}</p><p className="text-[9px] text-[#AEAEB2]">{sv.count} הצעות</p></div>
                                        <div className="flex-1 h-7 rounded-[7px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}><motion.div className="h-full rounded-[7px]" initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 5)}%` }} transition={{ delay: i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ background: m.color }} /></div>
                                        <span className="text-[11px] font-black shrink-0 w-20 text-left" style={{ color: m.color }}>₪{sv.value.toLocaleString()}</span>
                                    </div>
                                );
                            })}</div>}
                        </div>
                    );
                } else if (drillKpi === 'winrate') {
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-3 gap-3">{statCard('שיעור סגירה', pipelineStats.winRate !== null ? `${pipelineStats.winRate}%` : '—')}{statCard('עסקאות סגורות', closedStats.total)}{statCard('ממוצע לעסקה', `₪${closedStats.avgDeal.toLocaleString()}`)}</div>
                            {closedDeals.length > 0 && (
                                <div><p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2">עסקאות אחרונות</p>
                                <div className="space-y-2">{closedDeals.slice(0, 5).map((d, i) => (
                                    <motion.div key={d.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between rounded-[12px] p-3 cursor-pointer"
                                        style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}
                                        onClick={() => { navigate(`/admin/orders?quoteId=${d.id}`); setDrillKpi(null); }}>
                                        <span className="text-[12px] font-black" style={{ color: '#34C759' }}>₪{d.revenue.toLocaleString()}</span>
                                        <div className="text-right"><p className="text-[12px] font-bold text-[#1D1D1F]">{d.contactName}</p><p className="text-[10px] text-[#AEAEB2]">{d.institution}</p></div>
                                    </motion.div>
                                ))}</div></div>
                            )}
                        </div>
                    );
                } else if (drillKpi === 'cycle') {
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-3 gap-3">{statCard('ממוצע ימים', pipelineStats.avgCycle ?? '—')}{statCard('עסקאות שנמדדו', closedStats.total)}{statCard('% רווח ממוצע', closedStats.avgProfit !== null ? `${closedStats.avgProfit}%` : '—')}</div>
                            {closedDeals.length > 0 && (
                                <div><p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2">עסקאות אחרונות</p>
                                <div className="space-y-2">{closedDeals.slice(0, 5).map((d, i) => (
                                    <motion.div key={d.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between rounded-[12px] p-3 cursor-pointer"
                                        style={{ background: 'rgba(88,86,214,0.06)', border: '1px solid rgba(88,86,214,0.15)' }}
                                        onClick={() => { navigate(`/admin/orders?quoteId=${d.id}`); setDrillKpi(null); }}>
                                        <span className="text-[12px] font-black" style={{ color: '#5856D6' }}>{d.closedAt ? `${Math.round((Date.now() - d.closedAt.getTime()) / 86400000)} ימים` : '—'}</span>
                                        <div className="text-right"><p className="text-[12px] font-bold text-[#1D1D1F]">{d.contactName}</p><p className="text-[10px] text-[#AEAEB2]">₪{d.revenue.toLocaleString()}</p></div>
                                    </motion.div>
                                ))}</div></div>
                            )}
                        </div>
                    );
                } else if (drillKpi === 'risk') {
                    content = (
                        <div className="space-y-4" dir="rtl">
                            <div className="grid grid-cols-3 gap-3">{statCard('סכום בסיכון', `₪${pipelineStats.atRiskValue.toLocaleString()}`, '#FF3B30')}{statCard('הצעות', pipelineStats.atRisk.length, '#FF3B30')}{statCard('ממתינות לאישור', pipelineStats.pendingApproval.length)}</div>
                            {pipelineStats.atRisk.length === 0 ? (
                                <div className="text-center py-6 text-[#34C759] font-bold text-sm">אין הצעות בסיכון 🎉</div>
                            ) : (
                                <div><p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2">הצעות מעל 21 יום</p>
                                <div className="space-y-2">{pipelineStats.atRisk.slice(0, 6).map((q, i) => {
                                    const days = Math.round((Date.now() - q.dateTs) / 86400000);
                                    return (
                                        <motion.div key={q.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            className="flex items-center justify-between rounded-[12px] p-3 cursor-pointer group"
                                            style={{ background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.15)' }}
                                            onClick={() => { navigate(`/admin/orders?quoteId=${q.id}`); setDrillKpi(null); }}>
                                            <span className="text-[11px] font-black text-[#FF3B30]">{days} ימים</span>
                                            <div className="flex-1 mx-3 text-right"><p className="text-[12px] font-bold text-[#1D1D1F] truncate">{q.contactName || q.institution || q.id}</p><p className="text-[10px] text-[#AEAEB2]">{q.status} · ₪{(Number(q.subtotal) || 0).toLocaleString()}</p></div>
                                            <ChevronLeft size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#FF3B30]" />
                                        </motion.div>
                                    );
                                })}</div></div>
                            )}
                        </div>
                    );
                }

                return (
                    <AdminModal open={!!drillKpi} onClose={() => setDrillKpi(null)} title={m.title} size="lg">
                        <div className="space-y-5">
                            {content}
                            <div className="flex items-center justify-between pt-1 border-t border-black/06">
                                <span className="text-[10px] text-[#AEAEB2] font-medium">לחץ לצלילה עמוקה →</span>
                                <motion.button
                                    whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                                    onClick={() => {
                                        if (m.tabKey) setTab(m.tabKey);
                                        navigate(m.route);
                                        setDrillKpi(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[12px] font-black"
                                    style={{ background: `${m.color}14`, color: m.color, border: `1px solid ${m.color}28` }}
                                >
                                    <span>{m.routeLabel}</span>
                                    <ChevronLeft size={14} />
                                </motion.button>
                            </div>
                        </div>
                    </AdminModal>
                );
            })()}
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
