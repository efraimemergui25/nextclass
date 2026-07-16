/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS — ORDER PRIMITIVES  (shared SAP/Salesforce-grade building blocks)
   ───────────────────────────────────────────────────────────────────────────────
   Reusable, presentational pieces the order cockpit + every record-360 view share.
   All read the canonical lifecycle from orderModel.js. Glass/Apple design, RTL.

     • StatusChip        — semantic status pill (tone from orderModel)
     • PathStepper       — Salesforce "Path": chevrons + per-stage key fields,
                           guidance, and the next-best-action button
     • ActivityTimeline  — reverse-chron audit feed for one order
     • SplitView         — Service-Console list-left / detail-right shell
     • Highlights        — compact key-facts header strip

   Nothing here writes data; callers pass handlers (onAdvance, onAction…).
   ═══════════════════════════════════════════════════════════════════════════════ */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { STATUS_TONES } from '../theme/tokens';
import {
    stagesFor, deriveStage, stageMeta, nextAction, isSideState, isStale, daysInStage,
    orderTotal, orderItemsSummary, FIELD_LABELS, INVENTORY_STAGES,
} from '../lib/orderModel';

const HE = 'Heebo, sans-serif';

/* ─── StatusChip ─────────────────────────────────────────────────────────────── */
export const StatusChip = memo(function StatusChip({ tone = 'neutral', label, size = 'md', dot = true }) {
    const t = STATUS_TONES[tone] || STATUS_TONES.neutral;
    const pad = size === 'sm' ? '3px 9px' : '5px 12px';
    const fs = size === 'sm' ? 10.5 : 12;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad, borderRadius: 99,
            background: t.bg, color: t.fg, fontSize: fs, fontWeight: 800, fontFamily: HE, whiteSpace: 'nowrap',
        }}>
            {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: t.dot, flexShrink: 0 }} />}
            {label}
        </span>
    );
});

/* Stage chip straight from an order (derives stage + tone). */
export const OrderStageChip = memo(function OrderStageChip({ order, size = 'md' }) {
    const meta = stageMeta(deriveStage(order));
    return <StatusChip tone={meta.tone} label={meta.label} size={size} />;
});

/* ─── PathStepper (Salesforce Path) ──────────────────────────────────────────── */
export function PathStepper({ order, onAdvance, onAction, busy }) {
    const stages = stagesFor(order);
    const currentId = deriveStage(order);
    const side = isSideState(currentId);
    const curIdx = stages.findIndex(s => s.id === currentId);
    const meta = stageMeta(currentId);
    const na = nextAction(order);
    const fork = (stages.find(s => s.id === currentId) || {}).fork; // explicit dropship-vs-self choice

    return (
        <div style={{ fontFamily: HE }}>
            {/* chevron rail */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>
                {stages.map((s, i) => {
                    const done = !side && i < curIdx;
                    const active = !side && i === curIdx;
                    const t = STATUS_TONES[s.tone] || STATUS_TONES.info;
                    const bg = active ? t.dot : done ? t.bg : 'rgba(0,0,0,0.04)';
                    const fg = active ? '#fff' : done ? t.fg : '#AEAEB2';
                    // Guard: allow clicking only past stages or the immediate next one,
                    // and never jump DIRECTLY into an inventory stage (delivered/…) —
                    // those must go through the next-action button (which queues the
                    // buyer email + runs the settle exactly once).
                    const inv = INVENTORY_STAGES.includes(s.id);
                    const clickable = onAdvance && !active && !side && (i < curIdx || i === curIdx + 1) && !inv;
                    return (
                        <button key={s.id} type="button"
                            onClick={() => clickable && onAdvance(s.id)}
                            title={inv && !active ? 'השתמש/י בכפתור הפעולה כדי לסמן שלב זה' : s.guidance}
                            style={{
                                flex: '1 0 auto', minWidth: 92, padding: '9px 12px', border: 'none', cursor: clickable ? 'pointer' : 'default',
                                borderRadius: 10, background: bg, color: fg, fontSize: 11.5, fontWeight: 800, fontFamily: HE,
                                whiteSpace: 'nowrap', transition: 'all 0.16s', position: 'relative', opacity: (!clickable && !active && !done) ? 0.55 : 1,
                                boxShadow: active ? `0 4px 14px ${t.dot}44` : 'none',
                            }}>
                            {done ? '✓ ' : ''}{s.short}
                        </button>
                    );
                })}
            </div>

            {/* side-state banner */}
            {side && (
                <div style={{ marginTop: 10 }}>
                    <StatusChip tone={meta.tone} label={`מצב: ${meta.label}`} />
                </div>
            )}

            {/* current-stage guidance + key fields + next action */}
            {!side && (
                <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.14)' }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#3A3A3C', lineHeight: 1.6 }}>{meta.guidance}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                        {(meta.keyFields || []).map(f => (
                            <div key={f} style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '4px 10px' }}>
                                <span style={{ color: '#AEAEB2', fontWeight: 800 }}>{FIELD_LABELS[f] || f}: </span>
                                {keyFieldValue(order, f)}
                            </div>
                        ))}
                    </div>
                    {/* explicit fork (drop-ship vs self) — the decision presented at the moment it matters */}
                    {fork ? (
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                            {fork.map(f => {
                                const t = STATUS_TONES[f.tone] || STATUS_TONES.info;
                                return (
                                    <motion.button key={f.id} whileTap={{ scale: 0.97 }} disabled={busy}
                                        onClick={() => onAction && onAction(f, order)}
                                        style={{
                                            flex: '1 1 160px', textAlign: 'right', padding: '12px 14px', border: `1.5px solid ${t.dot}55`, borderRadius: 13,
                                            cursor: busy ? 'wait' : 'pointer', background: t.bg, fontFamily: HE,
                                        }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 900, color: t.fg }}>{f.label}</div>
                                        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#6E6E73', marginTop: 3 }}>{f.sub}</div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    ) : na && (
                        <motion.button whileTap={{ scale: 0.97 }} disabled={busy}
                            onClick={() => (onAction ? onAction(na, order) : onAdvance && onAdvance(na.to))}
                            style={{
                                marginTop: 12, padding: '11px 20px', border: 'none', borderRadius: 12, cursor: busy ? 'wait' : 'pointer',
                                background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: HE,
                                boxShadow: '0 6px 18px rgba(0,122,255,0.32)',
                            }}>
                            {busy ? '...' : na.label} ←
                        </motion.button>
                    )}
                </div>
            )}
        </div>
    );
}

function keyFieldValue(order, f) {
    if (!order) return '—';
    switch (f) {
        case 'items': return orderItemsSummary(order);
        case 'total': return `₪${orderTotal(order).toLocaleString()}`;
        case 'shipToAddress': return order.shipTo?.address || order.address || '—';
        case 'trackingInfo': return order.trackingInfo?.number || order.trackingInfo?.courier || '—';
        default: return order[f] || '—';
    }
}

/* ─── ActivityTimeline ───────────────────────────────────────────────────────── */
const ACT_ICON = { stage: '🔀', email: '✉️', note: '📝', supplier: '🚚', doc: '📄', system: '⚙️' };
export function ActivityTimeline({ items = [], empty = 'אין פעילות עדיין' }) {
    if (!items.length) {
        return <div style={{ padding: 28, textAlign: 'center', color: '#AEAEB2', fontSize: 12, fontWeight: 700, fontFamily: HE }}>{empty}</div>;
    }
    return (
        <div style={{ fontFamily: HE, position: 'relative' }}>
            <div style={{ position: 'absolute', insetInlineStart: 15, top: 6, bottom: 6, width: 2, background: 'rgba(0,0,0,0.06)' }} />
            {items.map((a, i) => (
                <div key={a.id || i} style={{ display: 'flex', gap: 12, position: 'relative', padding: '8px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', zIndex: 1 }}>
                        {ACT_ICON[a.type] || '•'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.5 }}>{a.message}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10.5, fontWeight: 600, color: '#AEAEB2' }}>{fmtTs(a.ts || a.at)}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function fmtTs(ts) {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(Number(ts) || ts);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('he-IL') + ' · ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
}

/* ─── Highlights header strip ────────────────────────────────────────────────── */
export function Highlights({ fields = [] }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontFamily: HE }}>
            {fields.map((f, i) => (
                <div key={i} style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 9.5, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em' }}>{f.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 14.5, fontWeight: 800, color: f.color || '#1D1D1F' }}>{f.value ?? '—'}</p>
                </div>
            ))}
        </div>
    );
}

/* ─── SplitView (list-left / detail-right) ───────────────────────────────────── */
export function SplitView({ list, detail, listWidth = 340, empty = 'בחר/י פריט מהרשימה' }) {
    return (
        <div className="nc-splitview" style={{ display: 'grid', gridTemplateColumns: `minmax(240px, ${listWidth}px) 1fr`, gap: 16, alignItems: 'start', fontFamily: HE }}>
            <div style={{ position: 'sticky', top: 8, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>{list}</div>
            <div>{detail || <div style={{ padding: 60, textAlign: 'center', color: '#AEAEB2', fontSize: 13, fontWeight: 700 }}>{empty}</div>}</div>
        </div>
    );
}

/* ─── StaleBadge (SLA / age-in-stage) ────────────────────────────────────────── */
export const StaleBadge = memo(function StaleBadge({ order }) {
    if (!isStale(order)) return null;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: 'rgba(255,59,48,0.12)', color: '#C0392B', fontSize: 10, fontWeight: 800, fontFamily: HE }}>
            ⏱ {daysInStage(order)} ימים
        </span>
    );
});

export default {
    StatusChip, OrderStageChip, PathStepper, ActivityTimeline, Highlights, SplitView, StaleBadge,
};
