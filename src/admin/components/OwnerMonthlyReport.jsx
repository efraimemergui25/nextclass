/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — OWNER MONTHLY REPORT  (🧾 דוח חודשי)
   ───────────────────────────────────────────────────────────────────────────────
   A business owner's monthly P&L / activity summary for the drop-ship reseller.
   Self-contained, print-friendly report card. RTL Hebrew, Heebo, liquid-glass.

     import OwnerMonthlyReport from '../components/OwnerMonthlyReport';
     <OwnerMonthlyReport orders={orders} supplierOrders={supplierOrders} />

   • orders          — the `quotes` collection shape (see orderModel.js).
   • supplierOrders  — the `supplier_orders` shape ({ customerOrderId, totalCost }).

   Revenue uses the ORDER's own total (orderTotal). Supplier cost is read from the
   linked supplier order when present; when it's missing we say so honestly rather
   than inventing a number. No fake data — uncomputable cells render "—".
   ═══════════════════════════════════════════════════════════════════════════════ */

import React, { useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { orderTotal, deriveStage, orderTitle } from '../lib/orderModel';
import { GLASS, toneColor } from '../theme/tokens';

const AZURE = '#007AFF';
const HEEBO = "'Heebo', system-ui, -apple-system, sans-serif";
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/* ─── money / time helpers ──────────────────────────────────────────────────── */
const ils = (n) => `₪${Math.round(Number(n) || 0).toLocaleString('he-IL')}`;
const pct = (n) => `${(Number(n) || 0).toFixed(0)}%`;

// Best-effort ms timestamp from the many shapes a Firestore field can take.
function toMs(v) {
    if (v == null) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'object') {
        if (typeof v.seconds === 'number') return v.seconds * 1000;         // Firestore Timestamp
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (v instanceof Date) return v.getTime();
    }
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
}

// The moment an order counts as "revenue this month": when it entered its
// delivered/completed stage. Fall back to dateTs only if the stage clock is absent.
function deliveredMs(o) {
    const stage = deriveStage(o);
    if (stage !== 'delivered' && stage !== 'completed') return null;
    return toMs(o.stageEnteredTs) ?? toMs(o.deliveredAt) ?? toMs(o.dateTs);
}

const sameMonth = (ms, y, m) => {
    if (ms == null) return false;
    const d = new Date(ms);
    return d.getFullYear() === y && d.getMonth() === m;
};

/* ─── UI atoms ──────────────────────────────────────────────────────────────── */
function Kpi({ label, value, sub, tone, big }) {
    const c = tone || '#1D1D1F';
    return (
        <div style={{
            ...GLASS.base, borderRadius: 20, padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
        }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#86868B' }}>{label}</span>
            <span style={{
                fontSize: big ? 30 : 24, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', wordBreak: 'break-word',
                background: `linear-gradient(135deg, ${c}, ${c}c4)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
                {value}
            </span>
            {sub != null && <span style={{ fontSize: 12, fontWeight: 600, color: '#AEAEB2' }}>{sub}</span>}
        </div>
    );
}

/* ─── component ─────────────────────────────────────────────────────────────── */
export default function OwnerMonthlyReport({ orders = [], supplierOrders = [] }) {
    const now = new Date();
    const [nowMs] = useState(() => Date.now()); // stable "now" for overdue/pipeline math
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()); // 0-11

    // Fast cost lookup: customerOrderId -> summed totalCost across its supplier POs.
    const costByOrder = useMemo(() => {
        const m = new Map();
        for (const so of supplierOrders || []) {
            const key = so?.customerOrderId;
            if (!key) continue;
            const c = Number(so.totalCost) || 0;
            m.set(String(key), (m.get(String(key)) || 0) + c);
        }
        return m;
    }, [supplierOrders]);

    const R = useMemo(() => {
        // ── this month's delivered orders (revenue recognised) ──
        const delivered = (orders || []).filter(o => sameMonth(deliveredMs(o), year, month));
        const revenue = delivered.reduce((s, o) => s + orderTotal(o), 0);

        // supplier cost — only counts orders we actually have a linked cost for
        let cost = 0, withCost = 0;
        for (const o of delivered) {
            const c = costByOrder.get(String(o.id));
            if (c != null && c > 0) { cost += c; withCost++; }
        }
        const costComplete = delivered.length === 0 || withCost === delivered.length;
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : null;

        // ── new orders created this month (by dateTs / stageEnteredTs fallback) ──
        const newThisMonth = (orders || []).filter(o => {
            const ms = toMs(o.dateTs) ?? toMs(o.createdAt);
            return sameMonth(ms, year, month);
        });

        const avg = delivered.length ? revenue / delivered.length : null;

        // ── open pipeline value (not yet delivered, not a side/closed state) ──
        const openValue = (orders || []).reduce((s, o) => {
            const st = deriveStage(o);
            const open = !['delivered', 'completed', 'cancelled', 'lost'].includes(st);
            return open ? s + orderTotal(o) : s;
        }, 0);

        // ── top product (by qty across delivered items) ──
        const prodQty = new Map();
        for (const o of delivered) {
            for (const it of (o.items || [])) {
                const key = it.catalogNumber || it.title || '—';
                const cur = prodQty.get(key) || { key, title: it.title || it.catalogNumber || '—', qty: 0 };
                cur.qty += Number(it.qty) || 1;
                prodQty.set(key, cur);
            }
        }
        const topProduct = [...prodQty.values()].sort((a, b) => b.qty - a.qty)[0] || null;

        // ── top institution (by revenue) ──
        const instRev = new Map();
        for (const o of delivered) {
            const key = o.institution || o.contactName || orderTitle(o);
            instRev.set(key, (instRev.get(key) || 0) + orderTotal(o));
        }
        const topInstitution = [...instRev.entries()].sort((a, b) => b[1] - a[1])[0] || null;

        // ── outstanding (unpaid) — only BILLABLE (delivered/completed) orders, net of amounts paid ──
        let outstanding = 0, overdue = 0;
        for (const o of (orders || [])) {
            const st = deriveStage(o);
            if (!['delivered', 'completed'].includes(st)) continue;   // not yet billable
            if (o.paymentStatus === 'paid') continue;
            const owed = Math.max(0, orderTotal(o) - (Number(o.amountPaid) || 0));
            if (owed <= 0) continue;
            outstanding += owed;
            const due = toMs(o.paymentDueTs);
            if (due != null && due < nowMs) overdue++;
        }

        // ── 6-month revenue trend (ending on selected month) ──
        const trend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(year, month - i, 1);
            const y = d.getFullYear(), m = d.getMonth();
            const rev = (orders || []).reduce((s, o) => sameMonth(deliveredMs(o), y, m) ? s + orderTotal(o) : s, 0);
            trend.push({ y, m, label: MONTHS_HE[m].slice(0, 3), rev, current: m === month && y === year });
        }
        const trendMax = Math.max(1, ...trend.map(t => t.rev));

        return {
            revenue, cost, profit, margin, costComplete, withCost,
            deliveredCount: delivered.length, newCount: newThisMonth.length,
            avg, openValue, topProduct, topInstitution, outstanding, overdue,
            trend, trendMax, empty: delivered.length === 0 && newThisMonth.length === 0,
        };
    }, [orders, month, year, costByOrder, nowMs]);

    const step = (delta) => {
        const d = new Date(year, month + delta, 1);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
    };
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

    const arrowBtn = {
        width: 34, height: 34, borderRadius: 12, border: '1px solid rgba(255,255,255,0.9)',
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(14px) saturate(180%)', WebkitBackdropFilter: 'blur(14px) saturate(180%)',
        color: '#1D1D1F', fontSize: 16, fontWeight: 700,
        cursor: 'pointer', display: 'grid', placeItems: 'center', lineHeight: 1,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 3px 10px rgba(20,40,80,0.06)',
    };
    const btnSpring = { type: 'spring', stiffness: 400, damping: 26 };

    return (
        <div dir="rtl" style={{ fontFamily: HEEBO, color: '#1D1D1F', maxWidth: 980, margin: '0 auto' }}>
            {/* print rules — hide chrome, flatten glass so it prints clean */}
            <style>{`
                @media print {
                    .omr-noprint { display: none !important; }
                    .omr-card { box-shadow: none !important; border: 1px solid #E5E5EA !important; background: #fff !important; backdrop-filter: none !important; }
                }
            `}</style>

            {/* header + month picker */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>🧾 דוח חודשי</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '4px 0 0', fontWeight: 600 }}>
                        {MONTHS_HE[month]} {year}{isCurrentMonth ? ' · החודש הנוכחי' : ''}
                    </p>
                </div>
                <div className="omr-noprint" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Motion.button onClick={() => step(-1)} style={arrowBtn} aria-label="חודש קודם"
                        whileHover={{ y: -1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 20px rgba(20,40,80,0.12)' }}
                        whileTap={{ scale: 0.92 }} transition={btnSpring}>
                        <ChevronRight size={18} strokeWidth={2.6} />
                    </Motion.button>
                    <div style={{ minWidth: 138, textAlign: 'center', fontSize: 14, fontWeight: 700, padding: '7px 12px', borderRadius: 10, background: 'rgba(0,122,255,0.08)', color: AZURE }}>
                        {MONTHS_HE[month]} {year}
                    </div>
                    <Motion.button onClick={() => step(1)} disabled={isCurrentMonth} style={{ ...arrowBtn, opacity: isCurrentMonth ? 0.4 : 1, cursor: isCurrentMonth ? 'default' : 'pointer' }} aria-label="חודש הבא"
                        whileHover={isCurrentMonth ? undefined : { y: -1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 20px rgba(20,40,80,0.12)' }}
                        whileTap={isCurrentMonth ? undefined : { scale: 0.92 }} transition={btnSpring}>
                        <ChevronLeft size={18} strokeWidth={2.6} />
                    </Motion.button>
                    {!isCurrentMonth && (
                        <Motion.button onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}
                            style={{ ...arrowBtn, width: 'auto', padding: '0 12px', fontSize: 12.5, color: AZURE, borderColor: 'rgba(0,122,255,0.25)' }}
                            whileHover={{ y: -1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 8px 20px rgba(0,122,255,0.18)' }}
                            whileTap={{ scale: 0.94 }} transition={btnSpring}>
                            היום
                        </Motion.button>
                    )}
                </div>
            </div>

            {R.empty && (
                <div className="omr-card" style={{ ...GLASS.base, borderRadius: 20, padding: '40px 24px', textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>אין פעילות ב{MONTHS_HE[month]} {year}</p>
                    <p style={{ fontSize: 13, color: '#86868B', margin: '4px 0 0' }}>לא נרשמו הזמנות חדשות או אספקות בחודש זה.</p>
                </div>
            )}

            {/* headline KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }} className="omr-grid">
                <Kpi big label="הכנסות החודש" value={ils(R.revenue)} tone={AZURE}
                    sub={`${R.deliveredCount} הזמנות סופקו`} />
                <Kpi big label="רווח מוערך" value={ils(R.profit)}
                    tone={R.profit >= 0 ? toneColor('success') : toneColor('danger')}
                    sub={R.margin == null ? '—' : `מרווח ${pct(R.margin)}${!R.costComplete ? ' · עלות ספק לא מלאה' : ''}`} />
                <Kpi label="עלות ספק" value={R.costComplete ? ils(R.cost) : `${ils(R.cost)}*`}
                    sub={R.costComplete ? 'מכל הספקים המקושרים' : `רק ${R.withCost}/${R.deliveredCount} עם עלות מקושרת`} />
                <Kpi label="פייפליין פתוח" value={ils(R.openValue)} sub="הזמנות שטרם סופקו" />
            </div>

            {/* activity row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
                <Kpi label="הזמנות חדשות" value={R.newCount || 0} sub="נפתחו החודש" />
                <Kpi label="הזמנות סופקו" value={R.deliveredCount || 0} sub="הוכרו כהכנסה" />
                <Kpi label="ערך הזמנה ממוצע" value={R.avg == null ? '—' : ils(R.avg)} sub={R.avg == null ? 'אין אספקות' : 'לפי אספקות החודש'} />
                <Kpi label="חוב פתוח (כולל)" value={ils(R.outstanding)} tone={R.outstanding > 0 ? toneColor('warning') : undefined}
                    sub={R.overdue > 0 ? `${R.overdue} באיחור` : 'כל הפתוח, כל החודשים'} />
            </div>

            {/* highlights: top product + top institution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div className="omr-card" style={{ ...GLASS.base, borderRadius: 20, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#86868B', marginBottom: 6 }}>🏆 מוצר מוביל החודש</div>
                    {R.topProduct ? (
                        <>
                            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>{R.topProduct.title}</div>
                            <div style={{ fontSize: 13, color: '#86868B', fontWeight: 600, marginTop: 2 }}>{R.topProduct.qty} יחידות סופקו</div>
                        </>
                    ) : <div style={{ fontSize: 14, color: '#AEAEB2', fontWeight: 600 }}>— אין אספקות החודש</div>}
                </div>
                <div className="omr-card" style={{ ...GLASS.base, borderRadius: 20, padding: '18px 20px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#86868B', marginBottom: 6 }}>🏛️ מוסד מוביל (לפי הכנסה)</div>
                    {R.topInstitution ? (
                        <>
                            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em' }}>{R.topInstitution[0]}</div>
                            <div style={{ fontSize: 13, color: '#86868B', fontWeight: 600, marginTop: 2 }}>{ils(R.topInstitution[1])} הכנסות</div>
                        </>
                    ) : <div style={{ fontSize: 14, color: '#AEAEB2', fontWeight: 600 }}>— אין אספקות החודש</div>}
                </div>
            </div>

            {/* 6-month revenue trend */}
            <div className="omr-card" style={{ ...GLASS.base, borderRadius: 20, padding: '20px 22px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800 }}>מגמת הכנסות · 6 חודשים</div>
                    <div style={{ fontSize: 12, color: '#86868B', fontWeight: 600 }}>לפי אספקות</div>
                </div>
                {R.trendMax <= 1 ? (
                    <div style={{ fontSize: 13.5, color: '#AEAEB2', fontWeight: 600, padding: '12px 0' }}>— אין הכנסות בששת החודשים האחרונים</div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
                        {R.trend.map((t, i) => {
                            const h = Math.max(2, (t.rev / R.trendMax) * 118);
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: t.current ? AZURE : '#86868B', whiteSpace: 'nowrap' }}>
                                        {t.rev > 0 ? (t.rev >= 1000 ? `₪${(t.rev / 1000).toFixed(0)}k` : ils(t.rev)) : '—'}
                                    </div>
                                    <div title={ils(t.rev)} style={{
                                        width: '100%', maxWidth: 46, height: h, borderRadius: '8px 8px 4px 4px',
                                        background: t.current ? 'linear-gradient(180deg, #007AFF 0%, #5AC8FA 100%)' : 'rgba(0,122,255,0.18)',
                                        transition: 'height .3s ease',
                                    }} />
                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: t.current ? '#1D1D1F' : '#AEAEB2' }}>{t.label}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* honesty footnote */}
            {!R.costComplete && R.deliveredCount > 0 && (
                <p style={{ fontSize: 12, color: '#B86A00', fontWeight: 600, margin: '0 0 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>*</span>
                    <span>עלות הספק חלקית — רק {R.withCost} מתוך {R.deliveredCount} ההזמנות שסופקו מקושרות להזמנת ספק עם עלות. הרווח בפועל עשוי להיות נמוך יותר.</span>
                </p>
            )}
            <p className="omr-noprint" style={{ fontSize: 11.5, color: '#AEAEB2', fontWeight: 600, margin: '8px 0 0', textAlign: 'center' }}>
                דוח זה מחושב מנתוני ההזמנות החיים · ניתן להדפיס (Ctrl/⌘+P)
            </p>
        </div>
    );
}
