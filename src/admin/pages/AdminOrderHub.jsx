/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS — ORDER HUB  ("מרכז ההזמנות")
   ───────────────────────────────────────────────────────────────────────────────
   The unified, SAP/Salesforce-grade drop-ship cockpit. ONE workspace for the whole
   order→supplier→delivered flow, reading the canonical order object (the `quotes`
   collection, elevated via orderModel.js). Additive — the classic Orders / Suppliers
   / Fulfillment tabs remain untouched; this is the new elevated experience.

   • KPI band (open · awaiting-supplier · delivered-this-month · at-risk)
   • Stage filter pills + search + Kanban / List views
   • Record-360 drawer: Highlights + Path stepper + Activity Timeline + Supplier/
     Dropship panel + Items — with next-best-action buttons that advance the stage
   • "Forward to supplier" dropship modal → linked PO + gate-queued supplier email
   • Every outbound email drafts into the approval queue (never auto-sends)
   ═══════════════════════════════════════════════════════════════════════════════ */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import {
    STAGES_DROPSHIP, STAGES_SELF, SIDE_STATES, stagesFor, deriveStage, stageMeta,
    isSideState, nextAction, deriveAxes, daysInStage, isStale, orderTotal, orderTitle, orderItemsSummary,
} from '../lib/orderModel';
import {
    StatusChip, OrderStageChip, PathStepper, ActivityTimeline, Highlights, StaleBadge,
} from '../components/OrderPrimitives';

const HE = 'Heebo, sans-serif';
const glass = { background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 40px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)' };
const CANCELLED = new Set(SIDE_STATES.map(s => s.id));

export default function AdminOrderHub() {
    const {
        quotes = [], kpis = {}, advanceOrderStage, logOrderActivity, createSupplierOrder,
        linkSupplierOrder, updateQuoteFields, createQuote, deleteQuote,
    } = useAdminData();
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();

    const [view, setView] = useState('kanban');    // kanban | list
    const [stageFilter, setStageFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [dropship, setDropship] = useState(null); // order being forwarded
    const [suppliers, setSuppliers] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [activity, setActivity] = useState([]);
    const [emailIntake, setEmailIntake] = useState(false); // paste-email modal

    /* live suppliers + supplier-orders (dropship picker + scorecard) */
    useEffect(() => {
        const u1 = onSnapshot(collection(db, 'suppliers'),
            s => setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        const u2 = onSnapshot(collection(db, 'supplier_orders'),
            s => setSupplierOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        return () => { u1(); u2(); };
    }, []);

    /* canonical order list — the quotes pipeline, minus soft-deleted */
    const orders = useMemo(() => (quotes || []).filter(o => !o.deleted), [quotes]);
    const selected = useMemo(() => orders.find(o => o.id === selectedId) || null, [orders, selectedId]);

    /* live activity timeline for the open record */
    useEffect(() => {
        if (!selectedId) { setActivity([]); return; }
        const un = onSnapshot(query(collection(db, 'quotes', String(selectedId), 'activity'), orderBy('ts', 'desc')),
            s => setActivity(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setActivity([]));
        return un;
    }, [selectedId]);

    /* KPI band */
    const stats = useMemo(() => {
        const now = new Date(); const mS = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        let open = 0, awaiting = 0, deliveredM = 0, atRisk = 0, review = 0;
        for (const o of orders) {
            const st = deriveStage(o);
            if (!CANCELLED.has(st) && st !== 'completed' && st !== 'delivered') open++;
            if (st === 'sent_supplier') awaiting++;
            if ((st === 'delivered' || st === 'completed') && (o.stageEnteredTs || o.dateTs || 0) >= mS) deliveredM++;
            if (isStale(o)) atRisk++;
            if (st === 'needs_review') review++;
        }
        return { open, awaiting, deliveredM, atRisk, review };
    }, [orders]);

    /* filtered set */
    const filtered = useMemo(() => {
        let list = orders;
        if (stageFilter !== 'all') {
            list = stageFilter === 'atrisk' ? list.filter(isStale) : list.filter(o => deriveStage(o) === stageFilter);
        }
        if (search.trim()) {
            const q = search.trim();
            list = list.filter(o => [orderTitle(o), o.institution, o.phone, o.email, o.orderNumber].some(v => (v || '').toString().includes(q)));
        }
        return [...list].sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
    }, [orders, stageFilter, search]);

    /* ── stage actions ─────────────────────────────────────────────────────── */
    const runAction = async (na, order) => {
        if (!na || !order) return;
        if (na.id === 'forwardSupplier') { setDropship(order); return; }
        setBusy(true);
        try {
            if (na.id === 'ackCustomer') {
                await queueStageEmail('initial_contact', order);
                await advanceOrderStage(order.id, 'acked');
                await logOrderActivity(order.id, { type: 'email', message: 'טיוטת אישור-קבלה ללקוח נוספה לתור האישורים' });
                showToast('טיוטת אישור ללקוח ממתינה לאישור שליחה ✓', 'success');
            } else if (na.id === 'markConfirmed') {
                await queueStageEmail('confirmed', order).catch(() => {});
                await advanceOrderStage(order.id, na.to);
                showToast('הספק אישר · טיוטת עדכון ללקוח בתור', 'success');
            } else if (na.id === 'markTransit') {
                await queueStageEmail('in_transit', order).catch(() => {});
                await advanceOrderStage(order.id, na.to);
                showToast('בדרך · טיוטת עדכון ללקוח בתור', 'success');
            } else if (na.id === 'markDelivered') {
                await queueStageEmail('delivered', order).catch(() => {});
                await advanceOrderStage(order.id, na.to);
                showToast('סומן כסופק · טיוטת עדכון ללקוח בתור', 'success');
            } else {
                await advanceOrderStage(order.id, na.to);
                showToast(`עודכן: ${stageMeta(na.to).label} ✓`, 'success');
            }
        } catch (e) { showToast('שגיאה בעדכון השלב', 'error'); }
        finally { setBusy(false); }
    };

    const jumpToStage = async (orderId, toStage) => {
        setBusy(true);
        try { await advanceOrderStage(orderId, toStage); showToast(`עודכן: ${stageMeta(toStage).label} ✓`, 'success'); }
        catch { showToast('שגיאה', 'error'); } finally { setBusy(false); }
    };

    const setMode = async (orderId, mode) => {
        try {
            await updateQuoteFields(orderId, { fulfillmentMode: mode });
            await logOrderActivity(orderId, { type: 'system', message: `שיטת אספקה שונתה ל: ${mode === 'self' ? 'אספקה עצמית' : 'דרופשיפ (ספק)'}` });
            showToast('שיטת האספקה עודכנה', 'success');
        } catch { showToast('שגיאה', 'error'); }
    };

    /* ── soft-delete (move to trash) ───────────────────────────────────────── */
    const handleDelete = async (record) => {
        if (!record?.id) return;
        const ok = await confirm({
            title: 'להעביר לפח?',
            message: `ההזמנה "${orderTitle(record)}" תועבר לפח. ניתן לשחזר אותה מאוחר יותר.`,
            confirmLabel: 'העבר לפח',
            danger: true,
        });
        if (!ok) return;
        setBusy(true);
        try {
            await deleteQuote(record.id);
            if (selectedId === record.id) setSelectedId(null);
            showToast('ההזמנה הועברה לפח', 'success');
        } catch { showToast('שגיאה במחיקת ההזמנה', 'error'); }
        finally { setBusy(false); }
    };

    /* Create an order from a pasted email/text via the OCR extractor (works now,
       no mail-routing needed). Lands as a needs_review order for confirmation. */
    const createFromEmail = async ({ text, subject }) => {
        setBusy(true);
        try {
            const res = await fetch('/api/ocr-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, fileName: subject || 'email order' }),
            });
            const json = await res.json();
            const d = json?.data || {};
            const id = await createQuote({
                contactName: d.contactName || '', institution: d.institution || '', phone: d.phone || '', email: d.email || '',
                address: d.address || '', city: d.city || '', zip: d.zip || '',
                items: d.items || [], subtotal: d.subtotal, vatAmount: d.vatAmount, totalIncVat: d.totalIncVat,
                notes: d.notes || subject || '', orderNumber: d.orderNumber || '', deliveryDate: d.deliveryDate || '',
                source: 'email', overallStage: 'needs_review', status: 'לבדיקה ידנית',
                extra: { rawEmail: text?.slice(0, 12000) || '', emailSubject: subject || '' },
            });
            await logOrderActivity(id, { type: 'email', message: 'נקלט ממייל — ממתין לבדיקה ואישור' });
            showToast('הזמנה נקלטה ממייל — בדוק/י ואשר/י', 'success');
            setEmailIntake(false);
            setStageFilter('needs_review');
            setSelectedId(id);
        } catch { showToast('שגיאה בקליטת המייל', 'error'); }
        finally { setBusy(false); }
    };

    const queueStageEmail = async (type, order) => {
        const res = await fetch('/api/send-stage-email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, quote: order }),
        });
        if (!res.ok) throw new Error('email queue failed');
    };

    /* ── forward-to-supplier (dropship) ────────────────────────────────────── */
    const confirmDropship = async ({ order, supplier, note }) => {
        setBusy(true);
        try {
            const shipAddr = order.shipTo?.address || order.address || '';
            const poId = await createSupplierOrder({
                customerName: orderTitle(order), supplierName: supplier?.name || supplier?.company || '',
                supplierId: supplier?.id || '', productTitle: orderItemsSummary(order),
                qty: (order.items || []).reduce((s, it) => s + (Number(it.qty) || 1), 0),
                totalCost: orderTotal(order), status: 'forwarded', eta: order.deliveryDate || '',
                notes: `${note || ''}${shipAddr ? ` · אספקה: ${shipAddr}` : ''}`, customerOrderId: order.id,
            });
            if (poId) await linkSupplierOrder(order.id, poId);
            // queue the supplier PO email (gate)
            if (supplier?.email) {
                await fetch('/api/send-supplier-email', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quote: order, supplier, type: 'order_confirmation', to: supplier.email }),
                }).catch(() => {});
            }
            await advanceOrderStage(order.id, 'sent_supplier', { supplierName: supplier?.name || supplier?.company || '' });
            await logOrderActivity(order.id, { type: 'supplier', message: `הועבר לספק${supplier?.name ? `: ${supplier.name}` : ''}${supplier?.email ? ' · טיוטת מייל בתור' : ''}` });
            showToast('הועבר לספק · הזמנת רכש נוצרה' + (supplier?.email ? ' · טיוטת מייל בתור אישור' : ''), 'success');
            setDropship(null);
        } catch (e) { showToast('שגיאה בהעברה לספק', 'error'); }
        finally { setBusy(false); }
    };

    return (
        <div dir="rtl" style={{ fontFamily: HE, maxWidth: 1320, margin: '0 auto' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>מרכז ההזמנות</h1>
                    <p style={{ fontSize: 13, color: '#86868B', margin: '4px 0 0', fontWeight: 600 }}>לקוח → ספק → אספקה, במקום אחד · כל מייל עובר אישור לפני שליחה</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEmailIntake(true)}
                        style={{ padding: '8px 16px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13, background: '#1D1D1F', color: '#fff' }}>
                        ＋ הזמנה ממייל
                    </motion.button>
                    {[['kanban', '▦ לוח'], ['list', '☰ רשימה'], ['insights', '📊 תובנות']].map(([v, lbl]) => (
                        <button key={v} onClick={() => setView(v)}
                            style={{ padding: '8px 16px', borderRadius: 11, border: '1.5px solid ' + (view === v ? 'transparent' : 'rgba(0,0,0,0.1)'), cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13, background: view === v ? 'linear-gradient(135deg,#007AFF,#5AC8FA)' : '#fff', color: view === v ? '#fff' : '#6E6E73' }}>
                            {lbl}
                        </button>
                    ))}
                </div>
            </div>

            {/* situation-handling strip (SAP) — surfaces what needs attention now */}
            {(stats.review > 0 || stats.atRisk > 0) && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                    {stats.review > 0 && (
                        <button onClick={() => setStageFilter('needs_review')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 14, border: '1.5px solid rgba(0,122,255,0.25)', background: 'rgba(0,122,255,0.07)', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, color: '#005EC4' }}>
                            ✉️ {stats.review} הזמנות ממתינות לבדיקה (נקלטו ממייל/סריקה) ←
                        </button>
                    )}
                    {stats.atRisk > 0 && (
                        <button onClick={() => setStageFilter('atrisk')}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 14, border: '1.5px solid rgba(255,59,48,0.25)', background: 'rgba(255,59,48,0.07)', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, color: '#C0392B' }}>
                            ⏱ {stats.atRisk} הזמנות חורגות מ-SLA — דורשות טיפול ←
                        </button>
                    )}
                </div>
            )}

            {/* KPI band */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
                <KpiTile label="הזמנות פתוחות" value={stats.open} tone="info" onClick={() => setStageFilter('all')} />
                <KpiTile label="ממתין לספק" value={stats.awaiting} tone="warning" onClick={() => setStageFilter('sent_supplier')} />
                <KpiTile label="סופק החודש" value={stats.deliveredM} tone="success" onClick={() => setStageFilter('delivered')} />
                <KpiTile label="דורש טיפול (SLA)" value={stats.atRisk} tone="danger" onClick={() => setStageFilter('atrisk')} />
            </div>

            {/* filter pills + search */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <FilterPill active={stageFilter === 'all'} onClick={() => setStageFilter('all')} label={`הכל (${orders.length})`} />
                {STAGES_DROPSHIP.filter(s => s.id !== 'needs_review').map(s => {
                    const n = orders.filter(o => deriveStage(o) === s.id).length;
                    if (!n) return null;
                    return <FilterPill key={s.id} active={stageFilter === s.id} onClick={() => setStageFilter(s.id)} label={`${s.short} (${n})`} tone={s.tone} />;
                })}
                <FilterPill active={stageFilter === 'atrisk'} onClick={() => setStageFilter('atrisk')} label={`דחוף (${stats.atRisk})`} tone="danger" />
                <div style={{ flex: 1 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לקוח / מוסד / טלפון…" dir="rtl"
                    style={{ padding: '9px 14px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: HE, fontSize: 13, fontWeight: 600, outline: 'none', minWidth: 220 }} />
            </div>

            {/* body */}
            {view === 'kanban' && <KanbanBoard orders={filtered} onOpen={setSelectedId} onAdvance={jumpToStage} />}
            {view === 'list' && <ListView orders={filtered} onOpen={setSelectedId} onAction={runAction} onDelete={handleDelete} busy={busy} />}
            {view === 'insights' && <InsightsView orders={orders} supplierOrders={supplierOrders} />}

            {orders.length === 0 && (
                <div style={{ ...glass, borderRadius: 20, padding: 48, textAlign: 'center', marginTop: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>אין הזמנות עדיין</p>
                    <p style={{ fontSize: 12.5, color: '#86868B', margin: '6px 0 0' }}>הזמנות מהאתר, מהמייל או מהסורק יופיעו כאן.</p>
                </div>
            )}

            {/* record-360 drawer */}
            <AnimatePresence>
                {selected && (
                    <RecordDrawer order={selected} activity={activity} busy={busy}
                        onClose={() => setSelectedId(null)}
                        onAction={runAction} onJump={jumpToStage} onSetMode={setMode}
                        onForward={() => setDropship(selected)} onDelete={handleDelete}
                        onAddNote={async (text) => { await logOrderActivity(selected.id, { type: 'note', message: text }); }} />
                )}
            </AnimatePresence>

            {/* dropship modal */}
            <AnimatePresence>
                {dropship && (
                    <DropshipModal order={dropship} suppliers={suppliers} busy={busy}
                        onClose={() => setDropship(null)} onConfirm={confirmDropship} />
                )}
            </AnimatePresence>

            {/* email-intake modal */}
            <AnimatePresence>
                {emailIntake && <EmailIntakeModal busy={busy} onClose={() => setEmailIntake(false)} onCreate={createFromEmail} />}
            </AnimatePresence>
        </div>
    );
}

/* ─── KPI tile ────────────────────────────────────────────────────────────────── */
function KpiTile({ label, value, tone, onClick }) {
    const c = { info: '#007AFF', warning: '#FF9500', success: '#34C759', danger: '#FF3B30' }[tone] || '#007AFF';
    return (
        <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
            style={{ ...glass, borderRadius: 18, padding: '16px 18px', textAlign: 'right', cursor: 'pointer', fontFamily: HE }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: c, lineHeight: 1 }}>{value}</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 700, color: '#6E6E73' }}>{label}</p>
        </motion.button>
    );
}

function FilterPill({ active, onClick, label, tone }) {
    const c = { warning: '#FF9500', danger: '#FF3B30', success: '#34C759', info: '#007AFF' }[tone] || '#007AFF';
    return (
        <button onClick={onClick}
            style={{ padding: '7px 14px', borderRadius: 99, border: '1.5px solid ' + (active ? 'transparent' : 'rgba(0,0,0,0.1)'), cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12, background: active ? c : '#fff', color: active ? '#fff' : '#6E6E73', whiteSpace: 'nowrap' }}>
            {label}
        </button>
    );
}

/* ─── Kanban (drag-to-advance) ───────────────────────────────────────────────── */
function KanbanBoard({ orders, onOpen, onAdvance }) {
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);
    const cols = STAGES_DROPSHIP.filter(s => s.id !== 'needs_review' || orders.some(o => deriveStage(o) === 'needs_review'));
    const drop = (stageId) => {
        setOverCol(null);
        const id = dragId; setDragId(null);
        if (id && onAdvance) onAdvance(id, stageId);
    };
    return (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
            {cols.map(s => {
                const items = orders.filter(o => deriveStage(o) === s.id);
                const tot = items.reduce((sum, o) => sum + orderTotal(o), 0);
                const c = { warning: '#FF9500', danger: '#FF3B30', success: '#34C759', info: '#007AFF', neutral: '#8E8E93' }[s.tone] || '#007AFF';
                return (
                    <div key={s.id} style={{ flex: '0 0 260px', minWidth: 260 }}
                        onDragOver={e => { if (dragId) { e.preventDefault(); setOverCol(s.id); } }}
                        onDragLeave={() => setOverCol(o => o === s.id ? null : o)}
                        onDrop={() => drop(s.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', marginBottom: 8, borderRadius: 12, background: c + '12' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: c }}>{s.short}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#86868B' }}>{items.length} · ₪{tot.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60, borderRadius: 12, padding: 2, transition: 'background 0.15s', background: overCol === s.id ? c + '10' : 'transparent', outline: overCol === s.id ? `2px dashed ${c}66` : 'none' }}>
                            {items.map(o => <KanbanCard key={o.id} order={o} onOpen={onOpen} onDragStart={() => setDragId(o.id)} onDragEnd={() => setDragId(null)} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function KanbanCard({ order, onOpen, onDragStart, onDragEnd }) {
    return (
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onOpen(order.id)}
            draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
            style={{ ...glass, borderRadius: 14, padding: 12, textAlign: 'right', cursor: 'grab', fontFamily: HE, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(order)}</p>
                <StaleBadge order={order} />
            </div>
            {order.institution && <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#86868B' }}>{order.institution}</p>}
            <p style={{ margin: '8px 0 0', fontSize: 11.5, fontWeight: 600, color: '#6E6E73' }}>{orderItemsSummary(order)}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#007AFF' }}>₪{orderTotal(order).toLocaleString()}</span>
                {order.supplierName && <span style={{ fontSize: 10, fontWeight: 700, color: '#86868B' }}>🚚 {order.supplierName}</span>}
            </div>
        </motion.button>
    );
}

/* ─── List view ──────────────────────────────────────────────────────────────── */
function ListView({ orders, onOpen, onAction, onDelete, busy }) {
    return (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden' }}>
            {orders.map((o, i) => {
                const na = nextAction(o);
                return (
                    <div key={o.id} onClick={() => onOpen(o.id)}
                        className="ohub-row"
                        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr auto auto auto auto', gap: 12, alignItems: 'center', padding: '13px 16px', cursor: 'pointer', borderTop: i ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(o)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.institution || ''} · {orderItemsSummary(o)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><OrderStageChip order={o} size="sm" /><StaleBadge order={o} /></div>
                        <span style={{ fontSize: 13.5, fontWeight: 900, color: '#007AFF', whiteSpace: 'nowrap' }}>₪{orderTotal(o).toLocaleString()}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', whiteSpace: 'nowrap' }}>{daysInStage(o)} י׳</span>
                        {na
                            ? <button disabled={busy} onClick={e => { e.stopPropagation(); onAction(na, o); }}
                                style={{ padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(0,122,255,0.1)', color: '#007AFF', fontFamily: HE, fontWeight: 800, fontSize: 11.5, whiteSpace: 'nowrap' }}>{na.label}</button>
                            : <span style={{ width: 60 }} />}
                        <button className="ohub-del" disabled={busy} title="העבר לפח" aria-label="מחק הזמנה"
                            onClick={e => { e.stopPropagation(); onDelete(o); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                            <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                    </div>
                );
            })}
            <style>{`.ohub-row .ohub-del{opacity:0;transition:opacity .15s ease}.ohub-row:hover .ohub-del{opacity:1}`}</style>
        </div>
    );
}

/* ─── Record-360 drawer ──────────────────────────────────────────────────────── */
function RecordDrawer({ order, activity, busy, onClose, onAction, onJump, onSetMode, onForward, onDelete, onAddNote }) {
    const [tab, setTab] = useState('timeline');
    const [note, setNote] = useState('');
    const axes = deriveAxes(order);
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                dir="rtl" style={{ position: 'fixed', insetInlineStart: 0, top: 0, bottom: 0, width: 'min(560px, 96vw)', background: '#F5F6F9', zIndex: 1001, display: 'flex', flexDirection: 'column', fontFamily: HE, boxShadow: '0 0 60px rgba(0,0,0,0.25)' }}>
                {/* header */}
                <div style={{ padding: '18px 20px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F' }}>{orderTitle(order)}</h2>
                            <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: '#86868B' }}>{order.institution || ''} {order.orderNumber ? `· #${order.orderNumber}` : ''}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <motion.button whileTap={{ scale: 0.94 }} disabled={busy} onClick={() => onDelete(order)}
                                title="העבר לפח" aria-label="מחק הזמנה"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 99, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.08)', color: '#FF3B30', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}>
                                <Trash2 size={15} strokeWidth={2.2} /> מחק
                            </motion.button>
                            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: 17, color: '#6E6E73' }}>✕</button>
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <Highlights fields={[
                            { label: 'סה״כ', value: `₪${orderTotal(order).toLocaleString()}`, color: '#007AFF' },
                            { label: 'לקוח', value: axes.customer === 'done' ? 'סופק' : axes.customer === 'acked' ? 'אושר' : 'התקבל' },
                            { label: 'ספק', value: { none: '—', sent: 'הועבר', confirmed: 'אישר', delivered: 'סיפק', self: 'עצמי' }[axes.supplier] },
                            { label: 'ימים בשלב', value: daysInStage(order) },
                        ]} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <PathStepper order={order} busy={busy} onAction={onAction} onAdvance={(to) => onJump(order.id, to)} />
                    </div>
                    {/* fulfilment-mode toggle (drop-ship vs self) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#AEAEB2' }}>אספקה:</span>
                        {[['dropship', '🚚 ספק (דרופשיפ)'], ['self', '📦 עצמית']].map(([m, lbl]) => {
                            const on = (order.fulfillmentMode || 'dropship') === m;
                            return (
                                <button key={m} onClick={() => !on && onSetMode(order.id, m)}
                                    style={{ padding: '5px 11px', borderRadius: 99, border: '1.5px solid ' + (on ? 'transparent' : 'rgba(0,0,0,0.1)'), cursor: on ? 'default' : 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 10.5, background: on ? '#1D1D1F' : '#fff', color: on ? '#fff' : '#86868B' }}>{lbl}</button>
                            );
                        })}
                    </div>
                </div>

                {/* tabs */}
                <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0', background: '#fff' }}>
                    {[['timeline', 'ציר זמן'], ['supplier', 'ספק'], ['items', 'פריטים'], ['customer', 'לקוח']].map(([id, lbl]) => (
                        <button key={id} onClick={() => setTab(id)}
                            style={{ padding: '8px 14px', border: 'none', borderBottom: '2.5px solid ' + (tab === id ? '#007AFF' : 'transparent'), background: 'transparent', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, color: tab === id ? '#007AFF' : '#86868B' }}>{lbl}</button>
                    ))}
                </div>

                {/* body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
                    {tab === 'timeline' && (
                        <>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                                <input value={note} onChange={e => setNote(e.target.value)} placeholder="הוסף/י הערה לציר הזמן…" dir="rtl"
                                    style={{ flex: 1, padding: '9px 12px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: HE, fontSize: 12.5, outline: 'none' }} />
                                <button disabled={!note.trim()} onClick={async () => { await onAddNote(note.trim()); setNote(''); }}
                                    style={{ padding: '9px 16px', borderRadius: 11, border: 'none', background: note.trim() ? '#1D1D1F' : 'rgba(0,0,0,0.1)', color: '#fff', cursor: note.trim() ? 'pointer' : 'default', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}>הוסף</button>
                            </div>
                            <ActivityTimeline items={activity} />
                        </>
                    )}
                    {tab === 'supplier' && (
                        <div style={{ ...glass, borderRadius: 16, padding: 18 }}>
                            {order.supplierName || order.supplierOrderId ? (
                                <>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>🚚 {order.supplierName || 'ספק מקושר'}</p>
                                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>סטטוס ספק: {{ none: 'טרם הועבר', sent: 'הועבר, ממתין לאישור', confirmed: 'אישר', delivered: 'סיפק', self: 'אספקה עצמית' }[axes.supplier]}</p>
                                    {order.deliveryDate && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>אספקה: {order.deliveryDate}</p>}
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6E6E73', fontWeight: 600 }}>טרם הועבר לספק.</p>
                                    <button onClick={onForward} style={{ padding: '11px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF9500,#FFB340)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13 }}>🚚 העבר לספק</button>
                                </>
                            )}
                        </div>
                    )}
                    {tab === 'items' && (
                        <div style={{ ...glass, borderRadius: 16, padding: 8 }}>
                            {(order.items || []).map((it, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderTop: i ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                    <div><p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#1D1D1F' }}>{it.title || it.name || 'פריט'}</p>{it.catalogNumber && <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#AEAEB2' }}>מק״ט {it.catalogNumber}</p>}</div>
                                    <div style={{ textAlign: 'left' }}><span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF' }}>×{it.qty || 1}</span><span style={{ fontSize: 11, color: '#6E6E73', marginInlineStart: 8 }}>₪{(Number(it.salePrice ?? it.price) || 0).toLocaleString()}</span></div>
                                </div>
                            ))}
                            {!(order.items || []).length && <p style={{ padding: 20, textAlign: 'center', color: '#AEAEB2', fontSize: 12 }}>אין פריטים</p>}
                        </div>
                    )}
                    {tab === 'customer' && (
                        <div style={{ ...glass, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[['לקוח', orderTitle(order)], ['מוסד', order.institution], ['טלפון', order.phone], ['מייל', order.email], ['כתובת אספקה', order.shipTo?.address || order.address], ['עיר', order.city]].map(([l, v]) => (
                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#AEAEB2' }}>{l}</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1D1D1F', textAlign: 'left' }}>{v || '—'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}

/* ─── Dropship modal ─────────────────────────────────────────────────────────── */
function DropshipModal({ order, suppliers, busy, onClose, onConfirm }) {
    const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
    const [freeName, setFreeName] = useState('');
    const [note, setNote] = useState('');
    const chosen = suppliers.find(s => s.id === supplierId);
    const supplier = chosen || (freeName ? { name: freeName } : null);
    const addr = order.shipTo?.address || order.address || '—';
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1100, backdropFilter: 'blur(3px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                dir="rtl" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(500px, 94vw)', background: '#fff', borderRadius: 24, zIndex: 1101, padding: 24, fontFamily: HE, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>🚚</span>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F' }}>העברה לספק (Dropship)</h2>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#86868B', fontWeight: 600 }}>ייווצר הזמנת רכש מקושרת + טיוטת מייל לספק (ממתינה לאישור שליחה).</p>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2' }}>ספק</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 13, fontWeight: 700, marginTop: 5, marginBottom: 12 }}>
                    <option value="">— בחר/י ספק —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name || s.company}{s.email ? ` · ${s.email}` : ''}</option>)}
                </select>
                {!supplierId && (
                    <input value={freeName} onChange={e => setFreeName(e.target.value)} placeholder="או שם ספק חופשי…" dir="rtl"
                        style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 13, fontWeight: 600, marginBottom: 12, boxSizing: 'border-box' }} />
                )}

                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,122,255,0.05)', marginBottom: 12 }}>
                    <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#3A3A3C' }}>📦 {orderItemsSummary(order)} · ₪{orderTotal(order).toLocaleString()}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11.5, fontWeight: 700, color: '#3A3A3C' }}>📍 אספקה ללקוח: {addr}</p>
                </div>

                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="הערות לספק (אספקה, דחיפות…)" dir="rtl"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 12.5, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

                <div style={{ display: 'flex', gap: 10 }}>
                    <button disabled={busy || (!supplier)} onClick={() => onConfirm({ order, supplier, note })}
                        style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', cursor: supplier && !busy ? 'pointer' : 'not-allowed', background: supplier && !busy ? 'linear-gradient(135deg,#FF9500,#FFB340)' : '#D1D1D6', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 14 }}>
                        {busy ? 'מעביר...' : '🚚 העבר לספק וצור PO'}
                    </button>
                    <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13 }}>ביטול</button>
                </div>
            </motion.div>
        </>
    );
}

/* ─── Email-intake modal (paste an order email → AI creates a review-state order) ─ */
function EmailIntakeModal({ busy, onClose, onCreate }) {
    const [subject, setSubject] = useState('');
    const [text, setText] = useState('');
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1100, backdropFilter: 'blur(3px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                dir="rtl" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(560px, 95vw)', background: '#fff', borderRadius: 24, zIndex: 1101, padding: 24, fontFamily: HE, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>✉️</span>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F' }}>הזמנה ממייל</h2>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#86868B', fontWeight: 600 }}>הדבק/י את גוף המייל — ה-AI יחלץ לקוח, פריטים, כתובת ומחירים ויצור הזמנה לבדיקה.</p>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="נושא / שם השולח (רשות)" dir="rtl"
                    style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 13, fontWeight: 600, marginBottom: 10, boxSizing: 'border-box' }} />
                <textarea value={text} onChange={e => setText(e.target.value)} rows={9} placeholder="הדבק/י כאן את תוכן המייל…" dir="rtl"
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 12.5, lineHeight: 1.7, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                    <button disabled={busy || !text.trim()} onClick={() => onCreate({ text: text.trim(), subject: subject.trim() })}
                        style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', cursor: text.trim() && !busy ? 'pointer' : 'not-allowed', background: text.trim() && !busy ? 'linear-gradient(135deg,#007AFF,#5AC8FA)' : '#D1D1D6', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 14 }}>
                        {busy ? 'מחלץ…' : '✨ חלץ וצור הזמנה'}
                    </button>
                    <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13 }}>ביטול</button>
                </div>
            </motion.div>
        </>
    );
}

/* ─── Insights (ops cockpit) — funnel · cycle time · on-time % · supplier scorecard ─ */
function InsightsView({ orders, supplierOrders }) {
    const m = useMemo(() => {
        const active = orders.filter(o => !CANCELLED.has(deriveStage(o)));
        // funnel — count per canonical stage
        const funnel = STAGES_DROPSHIP.filter(s => s.id !== 'needs_review').map(s => ({
            id: s.id, label: s.short, tone: s.tone,
            n: orders.filter(o => deriveStage(o) === s.id).length,
        }));
        const maxN = Math.max(1, ...funnel.map(f => f.n));
        // cycle time + on-time (delivered/completed orders)
        const done = orders.filter(o => ['delivered', 'completed'].includes(deriveStage(o)));
        const cycleDays = [];
        let onTime = 0, dated = 0;
        for (const o of done) {
            const start = o.dateTs, end = o.stageEnteredTs || o.dateTs;
            if (start && end && end >= start) cycleDays.push((end - start) / 86400000);
            const dd = Date.parse((o.deliveryDate || '').replace(/\./g, '/'));
            if (!isNaN(dd)) { dated++; if ((o.stageEnteredTs || 0) <= dd + 86400000) onTime++; }
        }
        const avgCycle = cycleDays.length ? (cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : 0;
        const onTimePct = dated ? Math.round((onTime / dated) * 100) : null;
        const fillPct = active.length + done.length ? Math.round((done.length / (active.length + done.length)) * 100) : 0;
        // supplier scorecard
        const bySup = {};
        for (const po of supplierOrders) {
            const k = po.supplierName || 'ללא ספק';
            if (!bySup[k]) bySup[k] = { name: k, total: 0, delivered: 0, cost: 0 };
            bySup[k].total++;
            bySup[k].cost += Number(po.totalCost) || 0;
            if (['shipped', 'arrived', 'delivered', 'confirmed'].includes(po.status)) bySup[k].delivered++;
        }
        const scorecard = Object.values(bySup).sort((a, b) => b.total - a.total);
        return { funnel, maxN, avgCycle, onTimePct, fillPct, done: done.length, scorecard };
    }, [orders, supplierOrders]);

    const card = { background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', borderRadius: 20, padding: 20 };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: HE }}>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <MiniKpi label="זמן מחזור ממוצע" value={`${m.avgCycle.toFixed(1)} י׳`} color="#007AFF" sub="מקבלה עד אספקה" />
                <MiniKpi label="אספקה בזמן" value={m.onTimePct == null ? '—' : `${m.onTimePct}%`} color={m.onTimePct == null ? '#8E8E93' : m.onTimePct >= 80 ? '#34C759' : '#FF9500'} sub="מול תאריך יעד" />
                <MiniKpi label="שיעור השלמה" value={`${m.fillPct}%`} color="#5856D6" sub="הזמנות שסופקו" />
                <MiniKpi label="סופקו (סה״כ)" value={m.done} color="#34C759" sub="הזמנות שהושלמו" />
            </div>

            {/* funnel */}
            <div style={card}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 900, color: '#1D1D1F' }}>📉 משפך שלבים</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.funnel.map(f => {
                        const c = { warning: '#FF9500', danger: '#FF3B30', success: '#34C759', info: '#007AFF', neutral: '#8E8E93' }[f.tone] || '#007AFF';
                        return (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 84, fontSize: 11.5, fontWeight: 800, color: '#6E6E73', textAlign: 'left' }}>{f.label}</span>
                                <div style={{ flex: 1, height: 22, borderRadius: 8, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                                    <div style={{ width: `${(f.n / m.maxN) * 100}%`, height: '100%', background: c, borderRadius: 8, minWidth: f.n ? 22 : 0, transition: 'width 0.4s' }} />
                                </div>
                                <span style={{ width: 30, fontSize: 12.5, fontWeight: 900, color: c, textAlign: 'right' }}>{f.n}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* supplier scorecard */}
            <div style={card}>
                <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 900, color: '#1D1D1F' }}>🚚 ביצועי ספקים</p>
                {m.scorecard.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 1fr', gap: 8, padding: '0 8px 6px', fontSize: 10, fontWeight: 800, color: '#AEAEB2' }}>
                            <span>ספק</span><span>הזמנות</span><span>סופקו</span><span>שווי</span>
                        </div>
                        {m.scorecard.map((s, i) => {
                            const pct = s.total ? Math.round((s.delivered / s.total) * 100) : 0;
                            return (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.9fr 1fr', gap: 8, alignItems: 'center', padding: '9px 8px', borderRadius: 10, background: 'rgba(0,0,0,0.02)' }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6E6E73' }}>{s.total}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: pct >= 80 ? '#34C759' : pct >= 50 ? '#FF9500' : '#FF3B30' }}>{pct}%</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF' }}>₪{s.cost.toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : <p style={{ margin: 0, padding: 16, textAlign: 'center', color: '#AEAEB2', fontSize: 12 }}>עדיין אין הזמנות ספק. השתמש/י ב"העבר לספק" כדי לבנות היסטוריית ביצועים.</p>}
            </div>
        </div>
    );
}

function MiniKpi({ label, value, color, sub }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', borderRadius: 18, padding: '16px 18px', textAlign: 'right', fontFamily: HE }}>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
            <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>{label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: '#AEAEB2' }}>{sub}</p>
        </div>
    );
}
