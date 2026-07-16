/* eslint-disable */

import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Box, TrendingDown, Clock, ArrowDown, TrendingUp, AlertTriangle, CheckCircle2, Zap, Target, ChevronLeft, ChevronRight, Activity, Layers, Users, Package, ShoppingCart, Percent, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { AdminKPICard, AdminTabs, HeatGrid, DonutChart, AdminModal, BarChart, InfoTooltip, AdminSkeleton } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { GLASS, RADIUS, hexA, toneColor, toneFg } from '../theme/tokens';
import initialProducts from '../../data/products';
import { computeMargins, marginColor, fmtILS, fmtPct } from '../lib/productFinance';

// ─── Babushka drill helpers (shared with the glass detail drawer) ─────────────
const computeStats = (data) => {
    if (!data || data.length === 0) return { total: 0, avg: 0, peak: 0, trend: 0, activeDays: 0 };
    const nonZero = data.filter(v => v > 0);
    const total = data.reduce((a, b) => a + b, 0);
    const avg = nonZero.length > 0 ? Math.round(total / nonZero.length) : 0;
    const peak = Math.max(...data);
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half).reduce((a, b) => a + b, 0);
    const secondHalf = data.slice(half).reduce((a, b) => a + b, 0);
    const trend = firstHalf > 0 ? Math.round((secondHalf - firstHalf) / firstHalf * 100) : (secondHalf > 0 ? 100 : 0);
    return { total, avg, peak, trend, activeDays: nonZero.length };
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

// A clickable/inert record row. Clickable rows push a deeper (babushka) level.
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

// ─── Analytics accent — unified brand azure (de-rainbowed) ────────────────────
const ACCENT = '#007AFF';

// ─── Glass card ───────────────────────────────────────────────────────────────
function Card({ title, subtitle, accent, action, children, className = '', titleTooltip }) {
    return (
        <div className={`rounded-[22px] overflow-hidden ${className}`}
            style={{ ...GLASS.base, borderRadius: RADIUS.cardLg }}
        >
            {/* Restrained: decorative colored top-accent bar removed — white glass only */}
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
function StatRow({ label, value, pct, color, onClick }) {
    const clickable = !!onClick;
    return (
        <div className={`space-y-1.5 rounded-[10px] -mx-2 px-2 py-1 transition-colors ${clickable ? 'cursor-pointer hover:bg-black/03 group' : ''}`}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}>
            <div className="flex justify-between items-center">
                <span className="text-[#1D1D1F] font-black text-sm flex items-center gap-1">{value}{clickable && <ChevronLeft size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" />}</span>
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

const DONUT_COLORS = ['#007AFF', '#5AC8FA', '#34C759', '#FF9500', '#FF3B30', '#0A84FF'];

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
    const { analytics, orders, kpis, inventory, quotes, loading, fx } = useAdminData();
    const fxRate = Number(fx?.usdIls) || 3.7;

    // Per-product profitability from the configured cost + sell price (synced live
    // from the product doc). Lets you compare margin across the catalog.
    const profitability = useMemo(() => {
        return (inventory || [])
            .map(p => ({ p, fin: computeMargins(p, fxRate) }))
            .filter(x => x.fin.hasData)
            .sort((a, b) => (b.fin.marginPct ?? -999) - (a.fin.marginPct ?? -999));
    }, [inventory, fxRate]);
    const avgMargin = useMemo(() => {
        if (!profitability.length) return null;
        return profitability.reduce((s, x) => s + (x.fin.marginPct || 0), 0) / profitability.length;
    }, [profitability]);
    const navigate = useNavigate();
    // Loading proxy: analytics is null until the first Firestore snapshot resolves,
    // so empty charts never masquerade as "no data".
    const dataLoading = loading || analytics == null;
    const [tab,         setTab]         = useState('overview');
    const [range,       setRange]       = useState('30');
    const [monthPage,   setMonthPage]   = useState(0);
    const [weekPage,    setWeekPage]    = useState(0);

    // ── Babushka drill stack — each entry is one nested detail level ──────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null); // retains last level through the exit animation
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };

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
        const CLOSED = ['נסגר', 'סופק'];
        // Sold units come from e-commerce orders AND closed pipeline quotes (B2B).
        const sources = [
            ...orders.map(o => o.items || []),
            ...quotes.filter(q => CLOSED.includes(q.status)).map(q => q.items || []),
        ];
        sources.forEach(items => {
            items.forEach(item => {
                const pid = String(item.id ?? item.catalogNumber ?? '');
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
                map[pid].revenue += (Number(item.salePrice ?? item.price) || 0) * (item.qty || 1);
            });
        });
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [orders, quotes, inventory]);

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
                items.push({ type: 'pending', icon: '✍️', color: '#5AC8FA', text: `ממתין לאישור: ${q.contactName || q.institution || q.id}`, sub: `₪${(Number(q.subtotal) || 0).toLocaleString()} · ${days} ימים`, quoteId: q.id });
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
            { key: 'ביצירת קשר',    label: 'יצירת קשר',        color: '#5AC8FA' },
            { key: 'בדיקת מלאי',    label: 'בדיקת מלאי',       color: '#0A84FF' },
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

    // ── Drill resolution helpers (real data only) ─────────────────────────────
    const productSalesMap = useMemo(() => {
        const m = {};
        topByCount.forEach(p => { m[String(p.productId)] = { revenue: p.revenue, count: p.count }; });
        return m;
    }, [topByCount]);
    const findProduct = (id) =>
        inventory.find(p => String(p.id) === String(id)) ||
        initialProducts.find(p => String(p.id) === String(id)) || null;

    const catalogLists = useMemo(() => {
        const th = (p) => Number(p.stockThreshold ?? p.minStock ?? 3);
        return {
            all:    inventory,
            active: inventory.filter(p => p.isActive !== false),
            low:    inventory.filter(p => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= th(p)),
            out:    inventory.filter(p => Number(p.stock ?? 0) === 0 && p.isActive !== false),
            dead:   deadProducts,
        };
    }, [inventory, deadProducts]);

    const ordersByCategory = useMemo(() => {
        const m = {};
        orders.forEach(o => { const c = o.category || 'אחר'; (m[c] = m[c] || []).push(o); });
        return m;
    }, [orders]);

    const visitArr = analytics?.visits || [];
    const salesArr = analytics?.sales || [];
    const revArr   = analytics?.revenue || [];
    const labArr   = analytics?.labels || [];

    return (
        <div dir="rtl" className="space-y-5">

            {/* ── Header — emerald accent icon box + gradient ink title ── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                    <div style={{ width: 46, height: 46, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(ACCENT, 0.12), border: `1px solid ${hexA(ACCENT, 0.20)}` }}>
                        <BarChart2 size={22} color={ACCENT} />
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-black tracking-tighter"
                            style={{ background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>דוחות ואנליטיקה</h1>
                        <p className="text-[#86868B] text-sm mt-1 font-medium">
                            תובנות עסקיות מבוססות נתוני פעילות אמת · {new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2.5">
                    <AdminTabs tabs={TABS} active={tab} onChange={setTab} />
                    {/* Range selector — emerald page accent */}
                    <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        {RANGES.map(r => (
                            <motion.button key={r.id} onClick={() => setRange(r.id)} whileTap={{ scale: 0.96 }}
                                className="relative px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap"
                                style={{ color: range === r.id ? toneFg('info') : '#86868B' }}>
                                {range === r.id && (
                                    <motion.div layoutId="range-pill" className="absolute inset-0 rounded-xl"
                                        style={{ background: `linear-gradient(135deg, ${hexA(ACCENT, 0.16)} 0%, ${hexA(ACCENT, 0.08)} 100%)`, border: `1px solid ${hexA(ACCENT, 0.28)}`, boxShadow: `0 2px 8px ${hexA(ACCENT, 0.18)}` }}
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
                <AdminKPICard title="כניסות ייחודיות" icon="traffic" value={totalVisits} loading={dataLoading}
                    trend={weekTrend.visits !== null ? Math.abs(weekTrend.visits) : undefined}
                    trendUp={weekTrend.visits === null || weekTrend.visits >= 0}
                    color="#007AFF" delay={0} onClick={() => openDrill({ type: 'visits' })}
                    tooltip={{ text: 'סך כל הביקורים הייחודיים באתר. session חדש = כניסה חדשה. השוואה: 7 ימים אחרונים לעומת 7 לפניהם.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }} />
                <AdminKPICard title="עסקאות מוצלחות" icon="orders" value={totalSales} loading={dataLoading}
                    trend={weekTrend.sales !== null ? Math.abs(weekTrend.sales) : undefined}
                    trendUp={weekTrend.sales === null || weekTrend.sales >= 0}
                    color="#34C759" delay={0.05} onClick={() => openDrill({ type: 'sales' })}
                    tooltip={{ text: 'כמות ה-sessions שהסתיימו ברכישה. מחושב מנתוני analytics.sales ב-Firestore.', source: 'Firestore · analytics · sales[]', link: '/admin/orders', linkLabel: 'ניהול הזמנות' }} />
                <AdminKPICard title="יחס המרה" icon="traffic" value={`${avgConv}%`} loading={dataLoading}
                    color="#5AC8FA" delay={0.1} onClick={() => openDrill({ type: 'conversion' })}
                    tooltip={{ text: 'אחוז הגולשים שהפכו ללקוחות. מחושב: עסקאות ÷ כניסות × 100. ממוצע כל-הזמן.', source: 'analytics.sales ÷ analytics.visits × 100', link: '/admin/analytics', linkLabel: 'ניתוח משפך' }} />
                <AdminKPICard title="הכנסות ברוטו" icon="revenue" value={`₪${kpis.totalRevenue.toLocaleString()}`} loading={dataLoading}
                    trend={weekTrend.revenue !== null ? Math.abs(weekTrend.revenue) : undefined}
                    trendUp={weekTrend.revenue === null || weekTrend.revenue >= 0}
                    color="#FF9500" delay={0.15} onClick={() => openDrill({ type: 'revenue' })}
                    tooltip={{ text: 'סך כל ההכנסות הגולמיות מהזמנות שנסגרו. לפני ניכוי עמלות ועלויות ספק.', source: 'Firestore · orders · total (סכום כולל)', link: '/admin/orders', linkLabel: 'ראה הזמנות' }} />
            </div>

            {dataLoading ? (
                <div className="space-y-5">
                    <AdminSkeleton rows={6} />
                </div>
            ) : (
            <AnimatePresence mode="wait">

                {/* ── Overview Tab ─────────────────────────────────────────────── */}
                {tab === 'overview' && (
                    <motion.div key="overview"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-5"
                    >
                        {/* ── Product profitability — compare margin across the catalog ── */}
                        <div style={{ ...GLASS.base, borderRadius: RADIUS.card }} className="overflow-hidden" dir="rtl">
                            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/[0.05]">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: hexA('#34C759', 0.12) }}><Percent size={17} style={{ color: '#34C759' }} /></div>
                                    <div className="text-right">
                                        <p className="text-[15px] font-black text-[#1D1D1F]">רווחיות מוצרים</p>
                                        <p className="text-[11px] text-[#86868B] font-medium">אחוז רווחיות לכל מוצר — עלות מול מחיר מכירה</p>
                                    </div>
                                </div>
                                {avgMargin != null && (
                                    <div className="text-center px-4 py-2 rounded-2xl" style={{ background: hexA(marginColor(avgMargin), 0.10) }}>
                                        <p className="text-[20px] font-black leading-none tabular-nums" style={{ color: marginColor(avgMargin) }}>{fmtPct(avgMargin)}</p>
                                        <p className="text-[9px] font-bold text-[#AEAEB2] mt-1">רווחיות ממוצעת</p>
                                    </div>
                                )}
                            </div>
                            {profitability.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-[#AEAEB2] text-[13px] font-medium">הזן עלות ומחיר מכירה למוצרים (במלאי או במיפוי) כדי לראות רווחיות</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/[0.04]">
                                    {/* header */}
                                    <div className="hidden sm:grid grid-cols-[1.8fr_90px_90px_1.4fr] gap-4 px-5 py-2 bg-black/[0.015]">
                                        {['מוצר', 'עלות', 'מכירה', 'רווחיות'].map((h, i) => <p key={i} className="text-[10px] font-black tracking-wider text-[#AEAEB2] uppercase">{h}</p>)}
                                    </div>
                                    {profitability.slice(0, 12).map(({ p, fin }, i) => {
                                        const col = marginColor(fin.marginPct);
                                        const barPct = Math.max(2, Math.min(100, fin.marginPct || 0));
                                        return (
                                            <motion.div key={p.id} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                                                onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(p.title || p.id)}`)}
                                                className="grid grid-cols-[1.8fr_90px_90px_1.4fr] gap-4 px-5 py-3 items-center cursor-pointer hover:bg-[#007AFF]/[0.03] transition-colors group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {p.image
                                                        ? <img src={p.image} alt="" onError={e => { e.target.style.display = 'none'; }} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-black/[0.06]" />
                                                        : <div className="w-9 h-9 rounded-lg bg-[#F5F5F7] flex items-center justify-center shrink-0"><Box size={14} className="text-[#C7C7CC]" /></div>}
                                                    <p className="text-[13px] font-bold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">{p.title}</p>
                                                </div>
                                                <p className="text-[12.5px] font-bold text-[#6E6E73] tabular-nums">{fmtILS(fin.cost)}</p>
                                                <p className="text-[12.5px] font-black text-[#007AFF] tabular-nums">{fmtILS(fin.sell)}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-black/[0.06] overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: col }} />
                                                    </div>
                                                    <span className="text-[13px] font-black tabular-nums w-12 text-left" style={{ color: col }}>{fmtPct(fin.marginPct)}</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── Action Items Panel ─── */}
                        <Card
                            accent={actionItems.length > 0 ? 'linear-gradient(90deg,#FF9500,#FF3B30)' : 'linear-gradient(90deg,#34C759,#30D158)'}
                            title="פריטי פעולה"
                            titleTooltip={{ text: 'פריטים שדורשים טיפול: הצעות ממתינות לאישור > 2 ימים, הצעות תקועות > 10 ימים, ועסקאות שנסגרו ב-7 הימים האחרונים.', source: 'Firestore · quotes · status + history[last].ts', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}
                            subtitle={actionItems.length > 0 ? `${actionItems.length} פריטים דורשים תשומת לב` : 'הכל תקין — אין פעולות נדרשות'}
                            action={
                                <span className="text-[11px] font-black rounded-full px-2.5 py-0.5 text-white"
                                    style={{ background: actionItems.length > 0 ? toneColor('danger') : toneColor('success') }}>
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
                                            style={{ background: item.type === 'win' ? 'rgba(52,199,89,0.06)' : item.type === 'pending' ? 'rgba(90,200,250,0.06)' : 'rgba(255,149,0,0.06)', border: `1px solid ${item.color}18` }}
                                            onClick={() => openDrill({ type: 'quote', id: item.quoteId })}
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
                                { key: 'cycle',    label: 'זמן ממוצע לסגירה', value: pipelineStats.avgCycle !== null ? `${pipelineStats.avgCycle} יום` : '—', color: '#5AC8FA', icon: <Clock size={14} />, sub: 'מליד לעסקה', tooltip: { text: 'ממוצע ימים מיצירת ההצעה ועד שנסגרה. מחושב מה-history timestamps של כל הצעה.', source: 'Firestore · quotes · history[].ts (ראשון → סגירה)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                { key: 'risk',     label: 'ב-Risk', value: `₪${pipelineStats.atRiskValue.toLocaleString()}`, color: pipelineStats.atRisk.length > 0 ? toneColor('danger') : toneColor('success'), icon: <AlertTriangle size={14} />, sub: `${pipelineStats.atRisk.length} הצעות מעל 21 יום`, tooltip: { text: 'שווי הצעות פתוחות שנוצרו לפני יותר מ-21 יום ועדיין לא נסגרו. סיכון גבוה לאובדן.', source: 'Firestore · quotes (פתוחות, dateTs > 21 ימים)', link: '/admin/orders', linkLabel: 'בדוק הצעות' } },
                            ].map((kpi, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="rounded-[16px] p-4 text-right cursor-pointer group"
                                    style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s' }}
                                    whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => openDrill({ type: kpi.key })}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${kpi.color}15`, color: kpi.color }}><ChevronLeft size={12} /></div>
                                        <span className="flex items-center gap-0.5"><p className="text-[11px] text-[#AEAEB2] font-semibold">{kpi.label}</p><InfoTooltip text={kpi.tooltip.text} source={kpi.tooltip.source} link={kpi.tooltip.link} linkLabel={kpi.tooltip.linkLabel} /></span>
                                    </div>
                                    <p className="font-black text-[20px] leading-none mb-1" style={{ color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
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
                                accent="linear-gradient(90deg,#007AFF,#5AC8FA)"
                                titleTooltip={{ text: 'כניסות ייחודיות לאתר לפי יום. session חדש = כניסה חדשה.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}
                                action={<span className="text-[#007AFF] text-xs font-black">{totalVisits.toLocaleString()}</span>}>
                                {totalVisits > 0
                                    ? <HeatGrid data={rangeData?.visits || analytics.visits} color="#007AFF" labels={rangeData?.labels || analytics.labels} />
                                    : <EmptyChart label="טרם הצטברו נתוני תנועה" />}
                            </Card>
                        </div>

                        {/* ── Pipeline Waterfall ─── */}
                        <Card title="ערך Pipeline לפי שלב" subtitle="כמה כסף יושב בכל שלב · לייב"
                            accent="linear-gradient(90deg,#007AFF,#5AC8FA)"
                            titleTooltip={{ text: 'פיזור שווי ההצעות הפתוחות לפי שלב במשפך. עוזר לזהות איפה הכסף תקוע.', source: 'Firestore · quotes (פתוחות) · status + subtotal', link: '/admin/orders', linkLabel: 'ניהול הצעות' }}>
                            {pipelineStats.openCount === 0 ? (
                                <EmptyChart label="אין הצעות פתוחות כרגע" />
                            ) : (
                                <div className="space-y-2.5 mt-1">
                                    {[
                                        { key: 'חדש', label: 'ליד חדש', color: '#FF3B30' },
                                        { key: 'ביצירת קשר', label: 'ביצירת קשר', color: '#FF9500' },
                                        { key: 'בדיקת מלאי', label: 'בדיקת מלאי', color: '#0A84FF' },
                                        { key: 'הוצע מחיר', label: 'הצעה נשלחה', color: '#007AFF' },
                                        { key: 'ממתין לאישור', label: 'ממתין לאישור', color: '#5AC8FA' },
                                        { key: 'הועבר לספק', label: 'הועבר לספק', color: '#0891B2' },
                                        { key: 'בדרך', label: 'בדרך', color: '#0A84FF' },
                                    ].map((stage, i) => {
                                        const sv = pipelineStats.stageValues[stage.key] || { count: 0, value: 0 };
                                        if (sv.count === 0) return null;
                                        const pct = pipelineStats.pipelineValue > 0 ? (sv.value / pipelineStats.pipelineValue) * 100 : 0;
                                        return (
                                            <motion.div key={stage.key}
                                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => openDrill({ type: 'stage', stage: stage.key })}
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
                            accent="linear-gradient(90deg,#FF9500,#5AC8FA)"
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
                                        className="grid grid-cols-4 gap-4 py-3.5 first:pt-0 last:pb-0 text-right cursor-pointer group rounded-[10px] hover:bg-black/02 transition-colors -mx-1 px-1"
                                        onClick={() => openDrill({ type: 'week', week: w })}
                                        role="button" tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'week', week: w }); } }}
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
                            accent="linear-gradient(90deg,#007AFF,#5AC8FA)"
                            titleTooltip={{ text: 'כניסות ייחודיות = session חדש שנפתח באתר. נרשם ב-Firestore בכל פעם שגולש פותח את האתר.', source: 'Firestore · analytics · visits[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}
                            action={<span className="text-[#007AFF] text-xs font-black">{totalVisits.toLocaleString()} סה״כ</span>}>
                            {totalVisits > 0 ? (
                                <HeatGrid data={rangeData?.visits || analytics.visits} color="#007AFF" labels={rangeData?.labels || analytics.labels} />
                            ) : <EmptyChart label="טרם הצטברו נתוני תנועה" />}
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card title="כניסות ב-7 ימים אחרונים" subtitle="תצוגת רשת אינטנסיביות"
                                accent="linear-gradient(90deg,#5AC8FA,#007AFF)">
                                {totalVisits > 0
                                    ? <HeatGrid data={(rangeData?.visits || analytics.visits).slice(-7)} color="#5AC8FA" labels={(rangeData?.labels || analytics.labels).slice(-7)} />
                                    : <EmptyChart />}
                            </Card>
                            <Card title="מדדי תנועה" accent="linear-gradient(90deg,#007AFF,#5AC8FA)"
                                titleTooltip={{ text: 'מדדי תנועה מסכמים: ממוצע יומי, שיא, ימים פעילים ויחס המרה — כולם מחושבים ממאגר analytics ב-Firestore.', source: 'Firestore · analytics · visits[] + sales[]', link: '/admin/analytics', linkLabel: 'דוח תנועה' }}>
                                <div className="space-y-4 mt-1">
                                    <StatRow label="ממוצע יומי" value={`${(totalVisits / 30).toFixed(0)} כניסות`}
                                        pct={Math.min((totalVisits / 30) / 10 * 100, 100)} color="#007AFF" onClick={() => openDrill({ type: 'visits' })} />
                                    <StatRow label="שיא יומי" value={`${Math.max(...(analytics?.visits || [0]))} כניסות`}
                                        pct={100} color="#5AC8FA" onClick={() => openDrill({ type: 'visits' })} />
                                    <StatRow label="ימים עם תנועה" value={`${(analytics?.visits || []).filter(v => v > 0).length} ימים`}
                                        pct={((analytics?.visits || []).filter(v => v > 0).length / 30) * 100} color="#34C759" onClick={() => openDrill({ type: 'visits' })} />
                                    <StatRow label="יחס המרה כולל" value={`${avgConv}%`}
                                        pct={parseFloat(avgConv) * 10} color="#FF9500" onClick={() => openDrill({ type: 'conversion' })} />
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
                                { dk: 'revenue', label: 'הכנסות כוללות', value: `₪${kpis.totalRevenue.toLocaleString()}`, color: '#34C759', sub: `${closedStats.total} עסקאות`, tooltip: { text: 'סך כל ההכנסות הגולמיות מכלל הזמנות שנסגרו. לפני ניכויים.', source: 'Firestore · orders · total (מצטבר)', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { dk: 'revenue', label: 'החודש הנוכחי', value: `₪${kpis.thisMonthRevenue.toLocaleString()}`, color: '#007AFF', sub: kpis.totalRevenue > 0 ? `${Math.round(kpis.thisMonthRevenue / kpis.totalRevenue * 100)}% מהסה"כ` : '—', tooltip: { text: 'הכנסות שנרשמו מתחילת החודש הנוכחי בלבד.', source: 'Firestore · kpis · thisMonthRevenue', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { dk: 'winrate', label: 'ממוצע לעסקה (AOV)', value: `₪${kpis.avgOrderValue.toLocaleString()}`, color: '#5AC8FA', sub: 'ממוצע כל הזמנה', tooltip: { text: 'Average Order Value — כמה שווה כל עסקה בממוצע. מחושב: הכנסות ÷ מספר הזמנות.', source: 'Firestore · orders · total ÷ count', link: '/admin/orders', linkLabel: 'ראה הזמנות' } },
                                { dk: 'cycle', label: 'רווח ממוצע', value: closedStats.avgProfit !== null ? `${closedStats.avgProfit}%` : '—', color: closedStats.avgProfit >= 20 ? '#34C759' : '#FF9500', sub: 'מהגזמאות עם נתוני עלות', tooltip: { text: 'ממוצע שיעור הרווח (%) מהצעות שנסגרו ושיש להן נתוני עלות ספק ב-ProfitCalculator.', source: 'Firestore · quotes · pricingData.profitPct', link: '/admin/orders', linkLabel: 'ראה הצעות' } },
                            ].map((k, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.97 }}
                                    onClick={() => openDrill({ type: k.dk })}
                                    className="rounded-[18px] p-4 text-right cursor-pointer group" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                                    <span className="flex items-center justify-between mb-1"><ChevronLeft size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" /><span className="flex items-center gap-0.5"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{k.label}</p><InfoTooltip text={k.tooltip.text} source={k.tooltip.source} link={k.tooltip.link} linkLabel={k.tooltip.linkLabel} /></span></span>
                                    <p className="font-black text-[22px] leading-none tracking-tight" style={{ color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
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
                            <Card title="מגמה חודשית" subtitle="הכנסות לפי חודש" accent="linear-gradient(90deg,#5AC8FA,#007AFF)"
                                titleTooltip={{ text: 'הכנסות מצטברות לפי חודש קלנדרי. מחושב מה-labels של analytics ב-Firestore.', source: 'Firestore · analytics · labels[] + revenue[]', link: '/admin/analytics', linkLabel: 'דוח הכנסות' }}
                                action={
                                    <div className="flex items-center gap-1">
                                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setMonthPage(p => p + 1)} disabled={!monthlyRevenue.hasOlder}
                                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                            style={{ background: monthlyRevenue.hasOlder ? 'rgba(90,200,250,0.12)' : 'rgba(0,0,0,0.04)', color: monthlyRevenue.hasOlder ? '#5AC8FA' : '#C7C7CC', cursor: monthlyRevenue.hasOlder ? 'pointer' : 'default' }}>
                                            <ChevronRight size={13} />
                                        </motion.button>
                                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setMonthPage(p => Math.max(0, p - 1))} disabled={!monthlyRevenue.hasNewer}
                                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                                            style={{ background: monthlyRevenue.hasNewer ? 'rgba(90,200,250,0.12)' : 'rgba(0,0,0,0.04)', color: monthlyRevenue.hasNewer ? '#5AC8FA' : '#C7C7CC', cursor: monthlyRevenue.hasNewer ? 'pointer' : 'default' }}>
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
                                                <div key={m.label} className="flex items-center gap-3 cursor-pointer group rounded-[8px] -mx-1 px-1 hover:bg-black/02 transition-colors"
                                                    onClick={() => openDrill({ type: 'month', month: m })}
                                                    role="button" tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'month', month: m }); } }}>
                                                    <span className="text-[11px] font-black text-[#86868B] w-14 shrink-0 text-right">{m.short}</span>
                                                    <div className="flex-1 h-7 rounded-[8px] overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                                        <motion.div className="h-full rounded-[8px] flex items-center justify-end pr-2.5"
                                                            initial={{ width: 0 }} animate={{ width: `${Math.max(pct, m.value > 0 ? 8 : 0)}%` }}
                                                            transition={{ delay: i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                            style={{ background: isLatest ? '#007AFF' : 'rgba(90,200,250,0.5)' }}>
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
                                                onClick={() => openDrill({ type: 'quote', id: c.quoteId })}>
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black text-white"
                                                    style={{ background: ['#007AFF','#5AC8FA','#34C759','#FF9500','#FF3B30','#0A84FF'][i] }}>
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
                            <Card title="הכנסות לפי קטגוריה" subtitle="פיזור כספי לפי תחום" accent="linear-gradient(90deg,#FF9500,#5AC8FA)"
                                titleTooltip={{ text: 'פיזור ההכנסות לפי קטגוריית מוצר. שדה category של כל הזמנה ב-Firestore.', source: 'Firestore · orders · category + total', link: '/admin/orders', linkLabel: 'ניהול הזמנות' }}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3 mt-1">
                                    {categoryRevenue.map(([cat, rev], i) => {
                                        const pct = Math.round((rev / (kpis.totalRevenue || 1)) * 100);
                                        return (
                                            <div key={cat} className="space-y-1.5 cursor-pointer group rounded-[8px] -mx-1 px-1 py-0.5 hover:bg-black/02 transition-colors"
                                                onClick={() => openDrill({ type: 'category', cat, rev })}
                                                role="button" tabIndex={0}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'category', cat, rev }); } }}>
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
                                    accent="linear-gradient(90deg,#0A84FF,#5AC8FA)"
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
                                                onClick={() => openDrill({ type: 'quote', id: deal.id })}>
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
                                        { kind: 'all', label: 'סה"כ מוצרים', value: inventory.length, color: '#1D1D1F', tooltip: { text: 'כלל המוצרים במאגר — פעילים ולא פעילים יחד.', source: 'Firestore · inventory (כולל isActive=false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { kind: 'active', label: 'פעילים', value: active, color: '#34C759', tooltip: { text: 'מוצרים המוצגים כעת בחנות לגולשים. מוצרים שהוסתרו ידנית לא נספרים.', source: 'Firestore · inventory (isActive !== false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { kind: 'low', label: 'מלאי נמוך', value: lowStockCount, color: '#FF9500', tooltip: { text: 'מוצרים עם מלאי גדול מ-0 אבל נמוך מהסף שהוגדר (stockThreshold). דורשים הזמנה מהספק.', source: 'Firestore · inventory (0 < stock ≤ stockThreshold)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { kind: 'out', label: 'אזל מהמלאי', value: outOfStock, color: '#FF3B30', tooltip: { text: 'מוצרים פעילים שמלאיהם = 0. גולשים רואים אותם אבל לא יכולים לרכוש.', source: 'Firestore · inventory (stock === 0, isActive !== false)', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                        { kind: 'dead', label: 'ללא מכירות', value: neverSold, color: '#86868B', tooltip: { text: 'מוצרים פעילים שלא נמכרו אף פעם — אין להם שום הזמנה בכל הזמן.', source: 'inventory (פעילים) MINUS orders · productId', link: '/admin/inventory', linkLabel: 'ניהול מלאי' } },
                                    ].map((k, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.97 }}
                                            className="rounded-[18px] p-3 text-right cursor-pointer group"
                                            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                                            onClick={() => openDrill({ type: 'catalog', kind: k.kind, label: k.label, color: k.color })}>
                                            <span className="flex items-center justify-between mb-1"><ChevronLeft size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" /><span className="flex items-center gap-0.5"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{k.label}</p><InfoTooltip text={k.tooltip.text} source={k.tooltip.source} link={k.tooltip.link} linkLabel={k.tooltip.linkLabel} /></span></span>
                                            <p className="font-black text-[22px] leading-none" style={{ color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* ── Product leaderboard ── */}
                        <Card title="טבלת ביצועי מוצרים" subtitle="לפי הכנסות — לחץ לפתיחה במלאי" accent="linear-gradient(90deg,#007AFF,#5AC8FA)"
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
                                                onClick={() => openDrill({ type: 'product', id: p.productId, fallback: { title: p.title, image: p.image } })}>
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
                                                onClick={() => openDrill({ type: 'product', id: p.id, fallback: { title: p.title || p.name, image: p.image } })}>
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
                            <Card title="נפח עסקאות" subtitle={`${range} ימים אחרונים`} accent="linear-gradient(90deg,#5AC8FA,#007AFF)">
                                {totalSales > 0
                                    ? <HeatGrid data={rangeData?.sales || analytics.sales} color="#5AC8FA" labels={rangeData?.labels || analytics.labels} />
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
                                        { dk: 'leads', label: 'סה"כ לידים', value: total, color: '#007AFF', tooltip: { text: 'כמות הצעות המחיר שנוצרו בסיסטם. כל הצעה = ליד אחד שנכנס למשפך.', source: 'Firestore · quotes (כל הסטטוסים)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                        { dk: 'closedList', label: 'עסקאות נסגרו', value: closed, color: '#34C759', tooltip: { text: 'הצעות שהגיעו לסטטוס "נסגר" או "סופק". אלה ההכנסות בפועל.', source: 'Firestore · quotes (status: נסגר, סופק)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                        { dk: 'conversion', label: 'יחס המרה', value: `${total > 0 ? Math.round(closed / total * 100) : 0}%`, color: '#5AC8FA', tooltip: { text: 'אחוז הלידים שהתסיימו בעסקה. מחושב: נסגרו ÷ סה"כ לידים × 100.', source: 'quotes (נסגר+סופק) ÷ quotes (הכל) × 100', link: '/admin/analytics', linkLabel: 'ניתוח משפך' } },
                                        { dk: 'risk', label: 'ממתינות · אבדו', value: `${active} · ${lost}`, color: '#FF9500', tooltip: { text: 'ממתינות = הצעות פתוחות עדיין. אבדו = הצעות שבוטלו או סומנו כ"אבד". שתיהן בנפרד.', source: 'Firestore · quotes · status (פתוחות vs אבד+בוטל)', link: '/admin/orders', linkLabel: 'ניהול הצעות' } },
                                    ].map((s, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.97 }}
                                            onClick={() => openDrill({ type: s.dk })}
                                            className="rounded-[18px] p-4 text-right cursor-pointer group" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                                            <span className="flex items-center justify-between mb-1"><ChevronLeft size={12} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" /><span className="flex items-center gap-0.5"><p className="text-[10px] font-semibold text-[#AEAEB2] tracking-wide">{s.label}</p><InfoTooltip text={s.tooltip.text} source={s.tooltip.source} link={s.tooltip.link} linkLabel={s.tooltip.linkLabel} /></span></span>
                                            <p className="font-black text-[22px] leading-none tracking-tight" style={{ color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
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
                                                    style={{ gridTemplateColumns: '120px 1fr 70px 50px 50px' }}
                                                    onClick={() => openDrill({ type: 'stage', stage: stage.key })}>
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
                                                    className="space-y-1.5 cursor-pointer group rounded-[8px] -mx-1 px-1 py-0.5 hover:bg-black/02 transition-colors"
                                                    onClick={() => openDrill({ type: 'stage', stage: s.key })}
                                                    role="button" tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'stage', stage: s.key }); } }}>
                                                    <div className="flex justify-between">
                                                        <span className="text-[12px] font-black" style={{ color: s.dropPct >= 50 ? '#FF3B30' : '#FF9500' }}>-{s.dropPct}%</span>
                                                        <span className="text-[11px] font-semibold text-[#1D1D1F] flex items-center gap-1"><ChevronLeft size={11} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" />{s.label}</span>
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
                                                    onClick={() => openDrill({ type: 'quote', id: q.id })}>
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
            )}

            {/* ── Babushka Drill Drawer — nested glass detail view ─────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;

                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const dateShort = (ts) => ts ? new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : '—';
                const qVal = (q) => Number(q?.subtotal) || 0;
                const goFunnel = () => { setTab('funnel'); closeDrill(); };
                const goRevenueTab = () => { setTab('revenue'); closeDrill(); };
                const goTrafficTab = () => { setTab('traffic'); closeDrill(); };

                let title = '', subtitle = '', icon = null, accent = '#007AFF', footer = null, body = null;

                if (shown.type === 'visits' || shown.type === 'traffic') {
                    const s = computeStats(visitArr);
                    title = 'כניסות ייחודיות'; subtitle = 'תנועה לאתר · Firestore'; accent = '#007AFF';
                    icon = <Activity size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לדוח תנועה', onClick: goTrafficTab };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ', value: s.total.toLocaleString(), color: '#007AFF' },
                                { label: 'ממוצע יומי', value: s.avg.toLocaleString() },
                                { label: 'שיא', value: s.peak.toLocaleString() },
                                { label: 'מגמה', value: `${s.trend >= 0 ? '+' : ''}${s.trend}%`, color: s.trend >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {s.total > 0
                                ? <div><p className="text-[11px] font-bold text-[#86868B] mb-3">30 ימים אחרונים</p><BarChart data={visitArr.slice(-30)} color="#007AFF" labels={labArr.slice(-30)} height={140} /></div>
                                : <DrillEmpty icon={Activity} text="טרם הצטברו נתוני תנועה" />}
                        </div>
                    );
                } else if (shown.type === 'sales') {
                    const s = computeStats(salesArr);
                    title = 'עסקאות מוצלחות'; subtitle = 'מכירות יומיות · Firestore'; accent = '#34C759';
                    icon = <BarChart2 size={17} color="#34C759" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'עסקאות', value: s.total.toLocaleString(), color: '#34C759' },
                                { label: 'ממוצע יומי', value: s.avg.toLocaleString() },
                                { label: 'שיא', value: s.peak.toLocaleString() },
                                { label: 'מגמה', value: `${s.trend >= 0 ? '+' : ''}${s.trend}%`, color: s.trend >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {s.total > 0
                                ? <div><p className="text-[11px] font-bold text-[#86868B] mb-3">30 ימים אחרונים</p><BarChart data={salesArr.slice(-30)} color="#34C759" labels={labArr.slice(-30)} height={140} /></div>
                                : <DrillEmpty icon={BarChart2} text="טרם בוצעו עסקאות" />}
                            {topByCount.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצרים מובילים — לחץ לצלילה</p>
                                    {topByCount.slice(0, 5).map((p, i) => (
                                        <DrillRow key={p.productId || i} delay={i * 0.04} tone="#34C759"
                                            onClick={() => pushDrill({ type: 'product', id: p.productId, fallback: { title: p.title, image: p.image } })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={p.title} subtitle={`${p.count} יח׳ נמכרו`}
                                            trailing={<span className="text-[12px] font-black text-[#34C759] shrink-0">₪{p.revenue.toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'conversion') {
                    const topFunnel = funnelData.slice(0, 6);
                    title = 'יחס המרה'; subtitle = 'משפך המכירות · לחץ שלב לצלילה'; accent = '#5AC8FA';
                    icon = <TrendingUp size={17} color="#5AC8FA" />;
                    footer = { label: 'מעבר למשפך המרה', onClick: goFunnel };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'יחס המרה', value: `${avgConv}%`, color: '#5AC8FA' },
                                { label: 'כניסות', value: totalVisits.toLocaleString(), color: '#007AFF' },
                                { label: 'רכישות', value: totalSales.toLocaleString(), color: '#34C759' },
                            ]} />
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">שלבי המשפך — לחץ לצלילה</p>
                                {topFunnel.map((st, i) => (
                                    <DrillRow key={st.key} delay={i * 0.04} tone={st.color}
                                        onClick={() => pushDrill({ type: 'stage', stage: st.key })}
                                        leading={<span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: st.color }} />}
                                        title={st.label}
                                        subtitle={st.dropPct > 0 && i > 0 ? `-${st.dropPct}% נשירה` : (st.avgDays !== null ? `${st.avgDays} ימים בשלב` : ' ')}
                                        trailing={<span className="text-[12px] font-black shrink-0" style={{ color: st.color }}>{st.count}</span>} />
                                ))}
                            </div>
                        </div>
                    );
                } else if (shown.type === 'revenue') {
                    const s = computeStats(revArr);
                    title = 'הכנסות ברוטו'; subtitle = 'מחזור הכנסות · Firestore'; accent = '#FF9500';
                    icon = <TrendingUp size={17} color="#FF9500" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ', value: `₪${s.total.toLocaleString()}`, color: '#FF9500' },
                                { label: 'ממוצע יומי', value: `₪${s.avg.toLocaleString()}` },
                                { label: 'שיא יומי', value: `₪${s.peak.toLocaleString()}` },
                                { label: 'מגמה', value: `${s.trend >= 0 ? '+' : ''}${s.trend}%`, color: s.trend >= 0 ? '#34C759' : '#FF3B30' },
                            ]} />
                            {s.total > 0
                                ? <div><p className="text-[11px] font-bold text-[#86868B] mb-3">30 ימים אחרונים</p><BarChart data={revArr.slice(-30)} color="#FF9500" labels={labArr.slice(-30)} height={140} /></div>
                                : <DrillEmpty icon={TrendingUp} text="טרם נרשמו הכנסות" />}
                            {topByCount.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פירוט לפי מוצר — לחץ לצלילה</p>
                                    {topByCount.slice(0, 5).map((p, i) => (
                                        <DrillRow key={p.productId || i} delay={i * 0.04} tone="#FF9500"
                                            onClick={() => pushDrill({ type: 'product', id: p.productId, fallback: { title: p.title, image: p.image } })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={p.title} subtitle={`${p.count} יח׳ נמכרו`}
                                            trailing={<span className="text-[12px] font-black text-[#FF9500] shrink-0">₪{p.revenue.toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'pipeline') {
                    const stages = Object.entries(pipelineStats.stageValues).filter(([, v]) => v.count > 0);
                    title = 'שווי Pipeline'; subtitle = `${pipelineStats.openCount} הצעות פתוחות`; accent = '#007AFF';
                    icon = <Target size={17} color="#007AFF" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'שווי', value: `₪${pipelineStats.pipelineValue.toLocaleString()}`, color: '#007AFF' },
                                { label: 'הצעות פתוחות', value: pipelineStats.openCount, color: '#5AC8FA' },
                                { label: 'שלבים פעילים', value: stages.length, color: '#34C759' },
                            ]} />
                            {stages.length === 0 ? <DrillEmpty icon={Target} text="אין הצעות פתוחות בצינור" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">שלבים — לחץ לצלילה</p>
                                    {stages.map(([stageName, sv], i) => (
                                        <DrillRow key={stageName} delay={i * 0.04} tone="#007AFF"
                                            onClick={() => pushDrill({ type: 'stage', stage: stageName })}
                                            leading={<span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 text-[12px] font-black" style={{ background: hexA('#007AFF', 0.12), color: '#007AFF' }}>{sv.count}</span>}
                                            title={stageName} subtitle={`${sv.count} הצעות`}
                                            trailing={<span className="text-[12px] font-black text-[#007AFF] shrink-0">₪{sv.value.toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'winrate') {
                    title = 'שיעור סגירה'; subtitle = `${closedStats.total} עסקאות נסגרו`; accent = '#34C759';
                    icon = <TrendingUp size={17} color="#34C759" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'שיעור סגירה', value: pipelineStats.winRate !== null ? `${pipelineStats.winRate}%` : '—', color: '#34C759' },
                                { label: 'עסקאות סגורות', value: closedStats.total, color: '#007AFF' },
                                { label: 'ממוצע לעסקה', value: `₪${closedStats.avgDeal.toLocaleString()}`, color: '#5AC8FA' },
                            ]} />
                            {closedDeals.length === 0 ? <DrillEmpty icon={CheckCircle2} text="אין עסקאות סגורות עדיין" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">עסקאות אחרונות — לחץ לפרטים</p>
                                    {closedDeals.slice(0, 6).map((d, i) => (
                                        <DrillRow key={d.id} delay={i * 0.04} tone="#34C759"
                                            onClick={() => pushDrill({ type: 'quote', id: d.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#34C759', 0.1) }}><Users size={13} color="#34C759" /></span>}
                                            title={d.contactName || d.institution || d.id} subtitle={d.institution || '—'}
                                            trailing={<span className="text-[12px] font-black text-[#34C759] shrink-0">₪{d.revenue.toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'cycle') {
                    title = 'זמן ממוצע לסגירה'; subtitle = 'מליד לעסקה'; accent = '#5AC8FA';
                    icon = <Clock size={17} color="#5AC8FA" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ממוצע ימים', value: pipelineStats.avgCycle ?? '—', color: '#5AC8FA' },
                                { label: 'עסקאות שנמדדו', value: closedStats.total, color: '#007AFF' },
                                { label: '% רווח ממוצע', value: closedStats.avgProfit !== null ? `${closedStats.avgProfit}%` : '—', color: '#34C759' },
                            ]} />
                            {closedDeals.length === 0 ? <DrillEmpty icon={Clock} text="אין עסקאות סגורות עדיין" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">עסקאות אחרונות — לחץ לפרטים</p>
                                    {closedDeals.slice(0, 6).map((d, i) => (
                                        <DrillRow key={d.id} delay={i * 0.04} tone="#5AC8FA"
                                            onClick={() => pushDrill({ type: 'quote', id: d.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#5AC8FA', 0.1) }}><Clock size={13} color="#5AC8FA" /></span>}
                                            title={d.contactName || d.institution || d.id}
                                            subtitle={d.closedAt ? `נסגר לפני ${Math.round((Date.now() - d.closedAt.getTime()) / 86400000)} ימים` : '—'}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{d.revenue.toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'risk') {
                    title = 'הכנסה בסיכון'; subtitle = `${pipelineStats.atRisk.length} הצעות מעל 21 יום`; accent = '#FF3B30';
                    icon = <AlertTriangle size={17} color="#FF3B30" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סכום בסיכון', value: `₪${pipelineStats.atRiskValue.toLocaleString()}`, color: '#FF3B30' },
                                { label: 'הצעות', value: pipelineStats.atRisk.length, color: '#FF9500' },
                                { label: 'ממתינות לאישור', value: pipelineStats.pendingApproval.length, color: '#5AC8FA' },
                            ]} />
                            {pipelineStats.atRisk.length === 0 ? <DrillEmpty icon={CheckCircle2} text="אין הצעות בסיכון 🎉" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הצעות מעל 21 יום — לחץ לפרטים</p>
                                    {pipelineStats.atRisk.slice(0, 8).map((q, i) => {
                                        const days = Math.round((Date.now() - q.dateTs) / 86400000);
                                        return (
                                            <DrillRow key={q.id} delay={i * 0.04} tone="#FF3B30"
                                                onClick={() => pushDrill({ type: 'quote', id: q.id })}
                                                leading={<span className="text-[11px] font-black shrink-0 w-9 text-center" style={{ color: '#FF3B30' }}>{days}י</span>}
                                                title={q.contactName || q.institution || q.id} subtitle={q.status}
                                                trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{qVal(q).toLocaleString()}</span>} />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'stage') {
                    const list = stageQuotesMap[shown.stage] || [];
                    const stageTotal = list.reduce((s, q) => s + qVal(q), 0);
                    const meta = funnelData.find(f => f.key === shown.stage);
                    title = meta?.label || shown.stage; subtitle = `${list.length} הצעות בשלב`; accent = meta?.color || '#007AFF';
                    icon = <Layers size={17} color={meta?.color || '#007AFF'} />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הצעות', value: list.length, color: accent },
                                { label: 'שווי כולל', value: `₪${Math.round(stageTotal).toLocaleString()}`, color: '#34C759' },
                                { label: 'זמן ממוצע', value: meta?.avgDays !== null && meta?.avgDays !== undefined ? `${meta.avgDays}י` : '—', color: '#5AC8FA' },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={Layers} text="אין הצעות בשלב זה" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הצעות — לחץ לפרטים</p>
                                    {list.map((q, i) => (
                                        <DrillRow key={q.id} delay={i * 0.03} tone={accent}
                                            onClick={() => pushDrill({ type: 'quote', id: q.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(accent, 0.1) }}><Users size={13} color={accent} /></span>}
                                            title={q.contactName || q.institution || q.id} subtitle={q.institution || dateShort(q.dateTs)}
                                            trailing={<span className="text-[12px] font-black shrink-0" style={{ color: accent }}>₪{qVal(q).toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'leads' || shown.type === 'closedList') {
                    const isClosed = shown.type === 'closedList';
                    const list = isClosed
                        ? closedDeals
                        : [...quotes].sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                    const totalVal = list.reduce((s, q) => s + (isClosed ? q.revenue : qVal(q)), 0);
                    title = isClosed ? 'עסקאות שנסגרו' : 'כל הלידים'; subtitle = `${list.length} הצעות`; accent = isClosed ? '#34C759' : '#007AFF';
                    icon = <Layers size={17} color={accent} />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הצעות', value: list.length, color: accent },
                                { label: 'שווי כולל', value: `₪${Math.round(totalVal).toLocaleString()}`, color: '#34C759' },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={Layers} text="אין הצעות להצגה" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">רשימה — לחץ לפרטים</p>
                                    {list.slice(0, 20).map((q, i) => (
                                        <DrillRow key={q.id} delay={i * 0.02} tone={accent}
                                            onClick={() => pushDrill({ type: 'quote', id: q.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(accent, 0.1) }}><Users size={13} color={accent} /></span>}
                                            title={q.contactName || q.institution || q.id} subtitle={q.status || q.institution || dateShort(q.dateTs)}
                                            trailing={<span className="text-[12px] font-black shrink-0" style={{ color: accent }}>₪{(isClosed ? q.revenue : qVal(q)).toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'quote') {
                    const q = quotes.find(x => String(x.id) === String(shown.id));
                    title = q ? (q.contactName || q.institution || 'הצעה') : 'הצעה';
                    subtitle = q ? `${q.status || ''} · ₪${qVal(q).toLocaleString()}` : String(shown.id);
                    accent = '#5AC8FA'; icon = <Layers size={17} color="#5AC8FA" />;
                    footer = { label: 'פתח בניהול הזמנות', onClick: () => drillTo(`/admin/orders?quoteId=${shown.id}`) };
                    body = q ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black rounded-full px-2.5 py-1" style={{ background: hexA('#5AC8FA', 0.1), color: '#5AC8FA' }}>{q.status || '—'}</span>
                                <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">₪{qVal(q).toLocaleString()}</p>
                            </div>
                            <DrillStat items={[
                                { label: 'מוסד', value: q.institution || '—', color: '#5AC8FA' },
                                { label: 'פריטים', value: (q.items || []).length, color: '#007AFF' },
                                { label: 'תאריך', value: dateShort(q.dateTs) },
                            ]} />
                            {(q.items || []).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פריטי ההצעה — לחץ למוצר</p>
                                    {q.items.map((it, i) => {
                                        const pid = it.id || it.catalogNumber;
                                        return (
                                            <DrillRow key={i} delay={i * 0.03}
                                                onClick={pid ? () => pushDrill({ type: 'product', id: pid, fallback: { title: it.title || it.name, image: it.image } }) : undefined}
                                                leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                                title={it.title || it.name || `פריט ${i + 1}`}
                                                subtitle={`${it.qty || it.quantity || 1} × ₪${(Number(it.salePrice || it.price) || 0).toLocaleString()}`}
                                                trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{((Number(it.salePrice || it.price) || 0) * (Number(it.qty || it.quantity) || 1)).toLocaleString()}</span>} />
                                        );
                                    })}
                                </div>
                            ) : <DrillEmpty icon={Layers} text="אין פריטים מפורטים בהצעה" />}
                        </div>
                    ) : <DrillEmpty icon={Layers} text="ההצעה לא נמצאה" />;
                } else if (shown.type === 'order') {
                    const o = orders.find(x => String(x.id) === String(shown.id));
                    const units = o ? ((o.items || []).reduce((s, it) => s + (Number(it.qty) || 1), 0) || (o.items || []).length) : 0;
                    title = o ? (o.customer || 'הזמנה') : 'הזמנה';
                    subtitle = o ? `#${o.id} · ${dateShort(o.dateTs)}` : String(shown.id);
                    accent = '#007AFF'; icon = <ShoppingCart size={17} color="#007AFF" />;
                    footer = { label: 'פתח בניהול הזמנות', onClick: () => drillTo(`/admin/orders?orderId=${shown.id}`) };
                    body = o ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black rounded-full px-2.5 py-1" style={{ background: hexA('#007AFF', 0.1), color: '#007AFF' }}>{o.status || '—'}</span>
                                <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">₪{(o.total || 0).toLocaleString()}</p>
                            </div>
                            <DrillStat items={[
                                { label: 'פריטים', value: units, color: '#007AFF' },
                                { label: 'סכום', value: `₪${(o.total || 0).toLocaleString()}`, color: '#34C759' },
                                { label: 'תאריך', value: dateShort(o.dateTs) },
                            ]} />
                            {(o.items || []).length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">פריטים בהזמנה — לחץ למוצר</p>
                                    {o.items.map((it, i) => (
                                        <DrillRow key={i} delay={i * 0.03}
                                            onClick={it.id ? () => pushDrill({ type: 'product', id: it.id, fallback: { title: it.title, image: it.image } }) : undefined}
                                            leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{it.image ? <img src={it.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                            title={it.title || it.name || `פריט ${i + 1}`}
                                            subtitle={`${it.qty || 1} × ₪${(Number(it.price) || 0).toLocaleString()}`}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{((Number(it.price) || 0) * (Number(it.qty) || 1)).toLocaleString()}</span>} />
                                    ))}
                                </div>
                            ) : <DrillEmpty icon={Package} text="אין פריטים מפורטים בהזמנה" />}
                        </div>
                    ) : <DrillEmpty icon={ShoppingCart} text="ההזמנה לא נמצאה" />;
                } else if (shown.type === 'product') {
                    const prod = findProduct(shown.id);
                    const sales = productSalesMap[String(shown.id)] || { revenue: 0, count: 0 };
                    const pTitle = prod?.title || prod?.name || shown.fallback?.title || 'מוצר';
                    const pImage = prod?.image || shown.fallback?.image;
                    const stock = prod ? Number(prod.stock ?? prod.quantity ?? 0) : null;
                    const threshold = prod ? Number(prod.stockThreshold ?? prod.minStock ?? 3) : null;
                    title = pTitle; subtitle = prod?.category || 'מוצר'; accent = '#007AFF';
                    icon = <Box size={17} color="#007AFF" />;
                    footer = { label: 'פתח בניהול מלאי', onClick: () => drillTo(`/admin/inventory?open=${encodeURIComponent(shown.id ?? pTitle)}`) };
                    body = (
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                                    {pImage ? <img src={pImage} alt={pTitle} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Box size={26} className="text-[#AEAEB2]" />}
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
                                ...(stock != null ? [{ label: 'במלאי', value: `${stock}${threshold != null ? `/${threshold}` : ''}`, color: stock <= (threshold ?? 0) ? toneColor('danger') : toneColor('success') }] : []),
                            ]} />
                            {!prod && (
                                <div className="rounded-[14px] p-4 text-right text-[12px] text-[#86868B]" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                    המוצר לא נמצא בקטלוג הנוכחי — הנתונים מבוססים על היסטוריית ההזמנות.
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'catalog') {
                    const list = catalogLists[shown.kind] || [];
                    title = shown.label || 'מוצרים'; subtitle = `${list.length} מוצרים`; accent = shown.color || '#007AFF';
                    icon = <Package size={17} color={accent} />;
                    footer = { label: 'מעבר לניהול מלאי', onClick: () => drillTo('/admin/inventory') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: shown.label || 'מוצרים', value: list.length, color: accent },
                                { label: 'סה״כ בקטלוג', value: inventory.length, color: '#8E8E93' },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={CheckCircle2} text="אין מוצרים בקטגוריה זו 🎉" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצרים — לחץ לצלילה</p>
                                    {list.slice(0, 20).map((p, i) => {
                                        const sales = productSalesMap[String(p.id)] || { revenue: 0, count: 0 };
                                        return (
                                            <DrillRow key={p.id || i} delay={i * 0.02} tone={accent}
                                                onClick={() => pushDrill({ type: 'product', id: p.id, fallback: { title: p.title || p.name, image: p.image } })}
                                                leading={<div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">{p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} /> : <Box size={13} className="text-[#AEAEB2]" />}</div>}
                                                title={p.title || p.name || p.id}
                                                subtitle={`${p.category || 'ללא קטגוריה'} · מלאי: ${p.stock ?? '—'}`}
                                                trailing={sales.count > 0 ? <span className="text-[11px] font-black text-[#34C759] shrink-0">₪{sales.revenue.toLocaleString()}</span> : undefined} />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'category') {
                    const cat = shown.cat;
                    const list = ordersByCategory[cat] || [];
                    const pct = kpis.totalRevenue > 0 ? Math.round((shown.rev / kpis.totalRevenue) * 100) : 0;
                    title = cat; subtitle = 'הכנסות לפי קטגוריה'; accent = '#FF9500';
                    icon = <Percent size={17} color="#FF9500" />;
                    footer = { label: 'מעבר לניהול הזמנות', onClick: () => drillTo('/admin/orders') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הכנסות', value: `₪${(shown.rev || 0).toLocaleString()}`, color: '#FF9500' },
                                { label: 'הזמנות', value: list.length, color: '#007AFF' },
                                { label: 'מסך הכנסות', value: `${pct}%`, color: '#5AC8FA' },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={ShoppingCart} text="אין הזמנות בקטגוריה זו" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הזמנות — לחץ לפרטים</p>
                                    {list.slice(0, 12).map((o, i) => (
                                        <DrillRow key={o.id || i} delay={i * 0.03} tone="#FF9500"
                                            onClick={() => pushDrill({ type: 'order', id: o.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#FF9500', 0.1) }}><ShoppingCart size={13} color="#FF9500" /></span>}
                                            title={o.customer || `הזמנה #${o.id}`} subtitle={dateShort(o.dateTs)}
                                            trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">₪{(o.total || 0).toLocaleString()}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'month') {
                    const mo = shown.month || {};
                    title = mo.label || 'חודש'; subtitle = 'הכנסות חודשיות'; accent = '#5AC8FA';
                    icon = <BarChart2 size={17} color="#5AC8FA" />;
                    footer = { label: 'מעבר לדוח הכנסות', onClick: goRevenueTab };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הכנסות בחודש', value: `₪${(mo.value || 0).toLocaleString()}`, color: '#5AC8FA' },
                                { label: 'מסך שנתי', value: kpis.totalRevenue > 0 ? `${Math.round((mo.value || 0) / kpis.totalRevenue * 100)}%` : '—', color: '#007AFF' },
                            ]} />
                            <div className="rounded-[14px] p-4 text-right text-[12px] text-[#86868B]" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                נתוני ההכנסה מחושבים מרשומות analytics.revenue ב-Firestore עבור {mo.label}.
                            </div>
                        </div>
                    );
                } else if (shown.type === 'week') {
                    const w = shown.week || {};
                    title = w.label || 'שבוע'; subtitle = 'סיכום שבועי'; accent = '#FF9500';
                    icon = <BarChart2 size={17} color="#FF9500" />;
                    footer = { label: 'מעבר לדוח אנליטיקה', onClick: () => drillTo('/admin/analytics') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'כניסות', value: (w.visits || 0).toLocaleString(), color: '#007AFF' },
                                { label: 'מכירות', value: (w.sales || 0).toLocaleString(), color: '#34C759' },
                                { label: 'הכנסות', value: `₪${(w.rev || 0).toLocaleString()}`, color: '#FF9500' },
                            ]} />
                            <div className="rounded-[14px] p-4 text-right text-[12px] text-[#86868B]" style={{ background: 'rgba(0,0,0,0.03)' }}>
                                נתוני השבוע ({w.label}) מחושבים מרשומות analytics ב-Firestore.
                            </div>
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
                        levelKey={`${shown.type}:${shown.id ?? shown.stage ?? shown.kind ?? shown.cat ?? shown.month?.label ?? shown.week?.label ?? ''}:${drillStack.length}`}
                    >
                        {body}
                    </DashDrillView>
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
