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
import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, FileText, Plus, Mail, Download, Settings, LayoutGrid, List, Columns3, BarChart3, ListChecks, ShoppingCart, MapPin, AlertTriangle, Truck, Clock, CircleDollarSign, Copy, CheckCircle2, Receipt, Save, Package, Search, Building2, Paperclip, X, ChevronLeft } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import OwnerMonthlyReport from '../components/OwnerMonthlyReport';
import TemplatesManager from '../components/TemplatesManager';
import RulesManager, { RuleAlerts, useRules } from '../components/RulesManager';
import OrderReviewSplit from '../components/OrderReviewSplit';
import EmailComposer from '../components/EmailComposer';
import Combobox from '../components/Combobox';
import { cityOptions } from '../lib/israelCities';
import SupplierEmailComposer from '../components/SupplierEmailComposer';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { uploadFileToFirestore } from '../utils/fileStore';
import { supplierCostForOrder, marginOf, bestCostFor, pricesForSupplier } from '../lib/supplierPricing';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import {
    STAGES_DROPSHIP, STAGES_SELF, SIDE_STATES, stagesFor, deriveStage, stageMeta,
    isSideState, nextAction, deriveAxes, daysInStage, isStale, orderTotal, orderTitle, orderItemsSummary,
    riskAssess, paymentAgingDays, paymentLabel, PAYMENT_TONES, intakeAge,
} from '../lib/orderModel';
import {
    StatusChip, OrderStageChip, PathStepper, ActivityTimeline, Highlights, StaleBadge,
} from '../components/OrderPrimitives';
import { toneColor } from '../theme/tokens';

const HE = 'Heebo, sans-serif';
const glass = { background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 40px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)' };
const CANCELLED = new Set(SIDE_STATES.map(s => s.id));

export default function AdminOrderHub() {
    const {
        quotes = [], kpis = {}, advanceOrderStage, logOrderActivity, createSupplierOrder,
        linkSupplierOrder, updateQuoteFields, createQuote, deleteQuote,
        sendThreadMessage, markAdminThreadRead, clearReminder, updatePayment,
        deletedItems = {}, restoreQuote, hardDeleteQuote, inventory = [],
        orders: ecomAll = [], updateOrderStatus, deleteOrder, restoreOrder, hardDeleteOrder,
        updateProductDetails,
    } = useAdminData();
    // Trash = deleted B2B quotes + deleted storefront orders, tagged so restore/purge
    // hit the right collection.
    const trashedOrders = useMemo(() => [
        ...(deletedItems.quotes || []).map(o => ({ ...o, _kind: 'quote' })),
        ...(deletedItems.orders || []).map(o => ({ ...o, _kind: 'order' })),
    ].sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0)), [deletedItems.quotes, deletedItems.orders]);
    // Live storefront (e-commerce) orders — separate collection/model from the B2B
    // quotes pipeline. Excludes synthetic quote-sale records (source==='quote').
    const ecomOrders = useMemo(() => (ecomAll || []).filter(o => o.source !== 'quote'), [ecomAll]);
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();

    const [view, setView] = useState('kanban');    // kanban | list
    const [stageFilter, setStageFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [reviewId, setReviewId] = useState(null);   // order open in the full-screen document⟷data review
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    // Deep-links from Dashboard / TopBar / OCR (?quoteId, ?search) — legacy
    // /admin/orders links now land here on the unified cockpit.
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const qid = searchParams.get('quoteId');
        const s = searchParams.get('search');
        if (qid) setSelectedId(qid);
        if (s) setSearch(s);
    }, [searchParams]);
    const [busy, setBusy] = useState(false);
    const [dropship, setDropship] = useState(null); // order being forwarded
    const [supplierEmail, setSupplierEmail] = useState(null); // { order, supplier, note } — compose supplier email
    const [suppliers, setSuppliers] = useState([]);
    const [supplierOrders, setSupplierOrders] = useState([]);
    const [prices, setPrices] = useState([]);        // supplier price book
    const [activity, setActivity] = useState([]);
    const [emailIntake, setEmailIntake] = useState(false); // paste-email modal
    const [emailModal, setEmailModal] = useState(null); // legacy preview modal (unused since the live composer)
    const [composer, setComposer] = useState(null);     // { type, order, afterSend } — live split-pane email editor
    const [sel, setSel] = useState(() => new Set()); // list bulk-selection
    const [cmdk, setCmdk] = useState(false); // command palette
    const [templatesOpen, setTemplatesOpen] = useState(false); // templates library
    const [inst360, setInst360] = useState(null); // institution 360 modal (institution/name string)
    const [rulesOpen, setRulesOpen] = useState(false); // automation rules manager
    const { rules } = useRules(); // active automation rules

    /* Cmd+K / Ctrl+K → command palette */
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdk(v => !v); }
            else if (e.key === 'Escape') setCmdk(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    const inFlight = useRef(false); // synchronous double-submit lock (state disables lag a render)
    const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const clearSel = () => setSel(new Set());

    /* live suppliers + supplier-orders (dropship picker + scorecard) */
    useEffect(() => {
        const u1 = onSnapshot(collection(db, 'suppliers'),
            s => setSuppliers(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        const u2 = onSnapshot(collection(db, 'supplier_orders'),
            s => setSupplierOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        const u3 = onSnapshot(collection(db, 'supplier_prices'),
            s => setPrices(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        return () => { u1(); u2(); u3(); };
    }, []);

    /* canonical order list — the quotes pipeline, minus soft-deleted */
    const orders = useMemo(() => (quotes || []).filter(o => !o.deleted), [quotes]);
    // Known ship-to directory (institutions/addresses/contacts from order history) — powers
    // the comboboxes in the supplier-forward composer and elsewhere.
    const directory = useMemo(() => {
        const seen = new Set(), out = [];
        (quotes || []).forEach(q => {
            const address = q.shipTo?.address || q.address || '';
            const key = `${(q.institution || q.contactName || '').trim()}|${address.trim()}`;
            if (key === '|' || seen.has(key)) return;
            seen.add(key);
            out.push({ institution: q.institution || '', contactName: q.contactName || '', address, city: q.city || '', phone: q.phone || '', email: q.email || '' });
        });
        return out;
    }, [quotes]);
    const selected = useMemo(() => orders.find(o => o.id === selectedId) || null, [orders, selectedId]);
    const reviewOrder = useMemo(() => orders.find(o => o.id === reviewId) || null, [orders, reviewId]);

    // Customer lifetime value for the open record (matches other orders by phone/email/name)
    const custStats = useMemo(() => {
        if (!selected) return null;
        const digits = (p) => (p || '').toString().replace(/\D/g, '');
        const ph = digits(selected.phone), em = (selected.email || '').toLowerCase(), nm = (selected.contactName || '').trim();
        const mine = orders.filter(o =>
            (ph && ph.length >= 7 && digits(o.phone) === ph) ||
            (em && (o.email || '').toLowerCase() === em) ||
            (nm && (o.contactName || '').trim() === nm));
        const total = mine.reduce((s, o) => s + orderTotal(o), 0);
        // product-interest frequency — which products this customer asks for most, aggregated across all their orders
        const freqMap = {};
        mine.forEach(o => (o.items || []).forEach(it => {
            const k = (it.title || it.name || it.catalogNumber || '').toString().trim();
            if (k) freqMap[k] = (freqMap[k] || 0) + (Number(it.qty) || 1);
        }));
        const productFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
        // days since this customer's first order
        const firstTs = mine.reduce((min, o) => Math.min(min, o.dateTs || Date.now()), Date.now());
        const daysSinceFirst = Math.max(0, Math.floor((Date.now() - firstTs) / 86400000));
        return { count: mine.length, total, avg: mine.length ? Math.round(total / mine.length) : 0, productFreq, daysSinceFirst };
    }, [selected, orders]);

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

    /* daily briefing — "what needs you today" for a solo operator */
    const briefing = useMemo(() => {
        const overduePay = orders.filter(o => o.paymentStatus !== 'paid' && o.paymentDueTs && o.paymentDueTs < Date.now());
        const stuckSupplier = orders.filter(o => deriveStage(o) === 'sent_supplier' && isStale(o));
        const unanswered = orders.filter(o => ['needs_review', 'new'].includes(deriveStage(o)));
        const highRisk = orders.filter(o => riskAssess(o).level === 'high');
        // Duplicate detection: institutions with ≥2 open orders (consider merging).
        const openO = orders.filter(o => !isSideState(deriveStage(o)) && !['delivered', 'completed'].includes(deriveStage(o)));
        const byInst = {};
        openO.forEach(o => { const k = (o.institution || '').trim(); if (k) (byInst[k] = byInst[k] || []).push(o); });
        const dups = Object.entries(byInst).filter(([, a]) => a.length >= 2).map(([inst, a]) => ({ inst, n: a.length }));
        const newEcom = ecomOrders.filter(o => (o.status || 'חדש') === 'חדש');
        return {
            overduePay, stuckSupplier, unanswered, highRisk, dups, newEcom,
            dueRem: kpis.dueReminders || [],
            overdueTotal: overduePay.reduce((s, o) => s + orderTotal(o), 0),
            clear: !overduePay.length && !stuckSupplier.length && !unanswered.length && !dups.length && !newEcom.length && !(kpis.dueReminders || []).length,
        };
    }, [orders, ecomOrders, kpis.dueReminders]);

    /* filtered set */
    const filtered = useMemo(() => {
        let list = orders;
        if (stageFilter !== 'all') {
            list = stageFilter === 'atrisk' ? list.filter(o => isStale(o) || riskAssess(o).level === 'high')
                : stageFilter === 'unpaid' ? list.filter(o => o.paymentStatus !== 'paid' && o.paymentDueTs && o.paymentDueTs < Date.now())
                : list.filter(o => deriveStage(o) === stageFilter);
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
        if (inFlight.current) return;                 // hard-lock against double-click
        inFlight.current = true;
        setBusy(true);
        try {
            if (na.id === 'goSelf') {
                // chose self-fulfilment at the fork → switch mode + move to packing
                await updateQuoteFields(order.id, { fulfillmentMode: 'self' });
                await advanceOrderStage(order.id, 'packed');
                await logOrderActivity(order.id, { type: 'system', message: 'נבחרה אספקה עצמית — לאריזה מהמלאי' });
                showToast('אספקה עצמית · עבר לאריזה', 'success');
            } else if (na.id === 'ackCustomer') {
                // First customer touch = a WARM order-received confirmation (we are the
                // vendor; the price is already known) — never a price-sourcing email.
                await openEmail('confirmed', order, async () => { await advanceOrderStage(order.id, 'acked'); });
            } else if (na.id === 'markConfirmed') {
                // Supplier confirmed → tell the customer we've secured it and it's in handling.
                await openEmail('processing', order, async () => { await advanceOrderStage(order.id, na.to); });
            } else if (na.id === 'markTransit') {
                await openEmail('in_transit', order, async () => { await advanceOrderStage(order.id, na.to); });
            } else if (na.id === 'markDelivered') {
                await openEmail('delivered', order, async () => { await advanceOrderStage(order.id, na.to); });
            } else if (na.id === 'markShipped') {
                // Self-fulfilment shipped → tell the buyer it's on the way (same email as dropship in_transit).
                await openEmail('in_transit', order, async () => { await advanceOrderStage(order.id, na.to); });
            } else {
                await advanceOrderStage(order.id, na.to);
                showToast(`עודכן: ${stageMeta(na.to).label} ✓`, 'success');
            }
        } catch (e) { showToast('שגיאה בעדכון השלב', 'error'); }
        finally { setBusy(false); inFlight.current = false; }
    };

    const jumpToStage = async (orderId, toStage) => {
        // inventory-affecting transitions settle stock + book revenue → confirm first
        if (['delivered', 'completed', 'cancelled', 'lost'].includes(toStage)) {
            const ok = await confirm({ title: `לסמן "${stageMeta(toStage).label}"?`, message: 'פעולה זו מעדכנת מלאי ורושמת את העסקה. להמשיך?', confirmLabel: 'כן', danger: toStage === 'cancelled' || toStage === 'lost' });
            if (!ok) return;
        }
        setBusy(true);
        try { await advanceOrderStage(orderId, toStage); showToast(`עודכן: ${stageMeta(toStage).label} ✓`, 'success'); }
        catch { showToast('שגיאה', 'error'); } finally { setBusy(false); }
    };

    /* Manual new order → creates a blank draft and opens it for editing */
    const createBlank = async () => {
        if (inFlight.current) return; inFlight.current = true; setBusy(true);
        try {
            const id = await createQuote({ source: 'manual', overallStage: 'new', status: 'חדש', contactName: '', items: [] });
            setSelectedId(id);
            showToast('הזמנה חדשה נוצרה — מלא/י את הפרטים', 'success');
        } catch { showToast('שגיאה ביצירת הזמנה', 'error'); }
        finally { setBusy(false); inFlight.current = false; }
    };

    /* CSV export of the current filtered view */
    const exportCsv = () => {
        const head = ['לקוח', 'מוסד', 'טלפון', 'מייל', 'שלב', 'פריטים', 'סה"כ', 'תאריך'];
        const rows = [head, ...filtered.map(o => [
            orderTitle(o), o.institution || '', o.phone || '', o.email || '',
            stageMeta(deriveStage(o)).label, orderItemsSummary(o), orderTotal(o), o.date || '',
        ])];
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `orders-${filtered.length}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    /* Save edited fields (customer / items) from the record drawer */
    const saveFields = async (orderId, fields) => {
        try {
            if (fields.items) {
                const subtotal = fields.items.reduce((s, it) => s + (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1), 0);
                await updateQuoteFields(orderId, { ...fields, subtotal });
            } else {
                await updateQuoteFields(orderId, fields);
            }
            showToast('נשמר ✓', 'success');
        } catch { showToast('שגיאה בשמירה', 'error'); }
    };

    /* Approve a needs_review draft: promote it into the live pipeline */
    const approveReview = async (order) => {
        try {
            await updateQuoteFields(order.id, { overallStage: 'new', status: 'חדש', unreadAdmin: false, reviewedTs: Date.now() });
            await logOrderActivity(order.id, { type: 'status', message: 'ההזמנה נבדקה ואושרה מתוך המסמך — נכנסה לפייפליין' });
            showToast('ההזמנה אושרה ונכנסה לפייפליין ✓', 'success');
        } catch { showToast('שגיאה באישור ההזמנה', 'error'); }
    };

    /* Promote a storefront/mobile e-commerce order into the canonical pipeline, so it can
       use the full machinery (stages, dropship-to-supplier, margin, SLA). Deterministic id
       + a promotedToQuoteId link on the ecom order prevent double-promotion. */
    const promoteEcom = async (o) => {
        if (o.promotedToQuoteId) { setView('kanban'); setSelectedId(o.promotedToQuoteId); return; }
        try {
            const qid = `STORE-${o.id}`;
            const items = (o.items || []).map(it => ({
                catalogNumber: it.catalogNumber || it.sku || it.id || '', title: it.title || it.name || '',
                qty: Number(it.qty) || 1, salePrice: Number(it.salePrice ?? it.price) || 0, price: Number(it.price ?? it.salePrice) || 0,
            }));
            await createQuote({
                id: qid, contactName: o.customer || o.contactName || '', institution: o.institution || '',
                phone: o.phone || '', email: o.email || '', address: o.address || '', city: o.city || '',
                items, subtotal: orderTotal(o), status: 'חדש', source: o.source || 'store',
                extra: { fromEcomOrderId: String(o.id), overallStage: 'new' },
            });
            await setDoc(doc(db, 'orders', String(o.id)), { promotedToQuoteId: qid }, { merge: true });
            showToast('ההזמנה הועברה לפייפליין המלא ✓', 'success');
            setView('kanban'); setSelectedId(qid);
        } catch { showToast('שגיאה בהעברה לפייפליין', 'error'); }
    };

    const setMode = async (orderId, mode) => {
        try {
            // updateQuoteFields already audit-logs the fulfillmentMode change — no second log
            await updateQuoteFields(orderId, { fulfillmentMode: mode });
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

    /* ── bulk (mass) actions on the list selection ─────────────────────────── */
    const bulkMarkDelivered = async () => {
        const ids = [...sel];
        setBusy(true);
        for (const id of ids) { try { await advanceOrderStage(id, 'delivered'); } catch { /* skip */ } }
        setBusy(false); clearSel();
        showToast(`${ids.length} הזמנות סומנו כסופקו ✓`, 'success');
    };
    const bulkDelete = async () => {
        const ids = [...sel];
        const ok = await confirm({ title: 'להעביר לפח?', message: `${ids.length} הזמנות יועברו לפח (ניתן לשחזר).`, danger: true, confirmLabel: 'העבר לפח' });
        if (!ok) return;
        setBusy(true);
        for (const id of ids) { try { await deleteQuote(id); } catch { /* skip */ } }
        setBusy(false); clearSel();
        showToast(`${ids.length} הזמנות הועברו לפח`, 'success');
    };

    /* Create an order from a pasted email/text via the OCR extractor (works now,
       no mail-routing needed). Lands as a needs_review order for confirmation. */
    const createFromEmail = async ({ text, subject, fileBase64, mimeType, fileName, attachment }) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        try {
            const body = { fileName: fileName || subject || 'email order' };
            if (text) body.text = text;
            if (fileBase64) { body.fileBase64 = fileBase64; body.mimeType = mimeType; }
            const res = await fetch('/api/ocr-order', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            const d = json?.data || {};

            // Persist the attached document so the review pane can show it side-by-side
            // with the extracted fields (billing-free Firestore chunks → order_documents/<id>).
            let documentId = null;
            if (attachment) {
                try {
                    documentId = await uploadFileToFirestore(db, 'order_documents', attachment, {
                        name: attachment.name, type: attachment.type || mimeType || 'application/octet-stream',
                    });
                } catch { documentId = null; }
            }
            // duplicate detection + known-institution recognition
            const dg = (p) => (p || '').toString().replace(/\D/g, '');
            const ph = dg(d.phone), em = (d.email || '').toLowerCase(), inst = (d.institution || d.contactName || '').trim();
            const known = orders.find(o => (ph.length >= 7 && dg(o.phone) === ph) || (em && (o.email || '').toLowerCase() === em) || (inst && (o.institution || '').trim() === inst));
            const dupVal = Number(d.totalIncVat ?? d.subtotal) || 0;
            const recentDup = orders.find(o => (Date.now() - (o.dateTs || 0) < 14 * 86400000) && inst && (o.institution || '').trim() === inst && dupVal > 0 && Math.abs(orderTotal(o) - dupVal) < 1);
            const id = await createQuote({
                contactName: d.contactName || '', institution: d.institution || '', phone: d.phone || '', email: d.email || '',
                address: d.address || '', city: d.city || '', zip: d.zip || '',
                items: d.items || [], subtotal: d.subtotal, vatAmount: d.vatAmount, totalIncVat: d.totalIncVat,
                notes: d.notes || subject || '', orderNumber: d.orderNumber || '', deliveryDate: d.deliveryDate || '',
                source: 'email', overallStage: 'needs_review', status: 'לבדיקה ידנית',
                extra: {
                    rawEmail: text?.slice(0, 12000) || '', emailSubject: subject || '',
                    ...(attachment ? {
                        attachmentName: attachment.name,
                        documentId: documentId || null,
                        documentType: attachment.type || mimeType || 'application/pdf',
                        documentName: attachment.name,
                        documentStoreFailed: !documentId,   // had a file but storage failed → pane shows a notice
                    } : {}),
                    ...(known ? { knownCustomer: true } : {}),
                },
            });
            await logOrderActivity(id, { type: 'email', message: 'נקלט ממייל — ממתין לבדיקה ואישור' + (known ? ` · מוסד מוכר (${orderTitle(known)})` : '') });
            if (recentDup) showToast(`⚠ ייתכן כפילות — הזמנה דומה מ"${orderTitle(recentDup)}" נקלטה לאחרונה. בדוק/י.`, 'warning');
            else if (known) showToast(`הזמנה נקלטה · מוסד מוכר עם היסטוריה — בדוק/י ואשר/י`, 'success');
            else showToast('הזמנה נקלטה ממייל — בדוק/י ואשר/י', 'success');
            setEmailIntake(false);
            setStageFilter('needs_review');
            setSelectedId(id);
        } catch { showToast('שגיאה בקליטת המייל', 'error'); }
        finally { setBusy(false); inFlight.current = false; }
    };


    /* ── In-flow email: preview → edit → send (the human review IS the gate) ── */
    // Open the LIVE split-pane composer (no server round-trip — HTML is built client-side
    // and updates in real time as the operator edits).
    const openEmail = (type, order, afterSend = null) => {
        setComposer({ type, order: order || selected, afterSend });
    };

    // Dispatch the composed email (human clicked Send in the composer = the approval gate).
    const sendComposedEmail = async (subject, html, attachments) => {
        const c = composer; if (!c) return;
        const to = c.order?.email;
        if (!to) { showToast('אין כתובת מייל ללקוח', 'error'); return; }
        try {
            const res = await fetch('/api/dispatch-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, html, ...(attachments && attachments.length ? { attachments } : {}) }),
            });
            const out = await res.json().catch(() => ({}));
            if (!res.ok || out.sent === false) { showToast('שליחת המייל נכשלה — בדוק/י תצורת שליחה', 'error'); return; }
            await logOrderActivity(c.order.id, { type: 'email', message: `מייל נשלח ללקוח: ${subject}` });
            try { await addDoc(collection(db, 'pending_emails'), { to, subject, html, status: 'sent', sentAt: Date.now(), createdAt: serverTimestamp(), source: 'order-hub', orderId: c.order.id }); } catch { /* best-effort */ }
            showToast('המייל נשלח ללקוח ✓', 'success');
            const after = c.afterSend;
            setComposer(null);
            if (after) await after();
        } catch { showToast('שגיאה בשליחת המייל', 'error'); }
    };
    const doSendEmail = async (customNote, customSubject, customHtml) => {
        const em = emailModal; if (!em) return;
        setEmailModal(m => m && { ...m, sending: true });
        try {
            let finalHtml, finalSubject;
            if (customHtml) {
                // operator fully edited the email body → send it verbatim (no re-render)
                finalHtml = customHtml;
                finalSubject = customSubject || em.subject;
            } else {
                // render the FINAL html (with the note/subject edits applied)
                const pv = await fetch('/api/send-stage-email', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: em.type, quote: em.order, customNote, customSubject, preview: true }),
                });
                const fin = await pv.json();
                finalHtml = fin.html || em.html;
                finalSubject = customSubject || fin.subject || em.subject;
            }
            const to = em.order.email;
            if (!to) { showToast('אין כתובת מייל ללקוח — הוסף/י ושמור/י', 'error'); setEmailModal(m => m && { ...m, sending: false }); return; }
            // dispatch (human already previewed + edited = approved)
            const res = await fetch('/api/dispatch-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject: finalSubject, html: finalHtml }),
            });
            const out = await res.json().catch(() => ({}));
            if (!res.ok || out.sent === false) {
                // send did not actually happen → do NOT advance the stage or log "sent"
                showToast('שליחת המייל נכשלה — בדוק/י תצורת שליחה', 'error');
                setEmailModal(m => m && { ...m, sending: false });
                return;
            }
            await logOrderActivity(em.order.id, { type: 'email', message: `מייל נשלח ללקוח: ${finalSubject}` });
            // record in the unified email history (so every send is visible in תקשורת, not just this modal)
            try { await addDoc(collection(db, 'pending_emails'), { to, subject: finalSubject, html: finalHtml, status: 'sent', sentAt: Date.now(), createdAt: serverTimestamp(), source: 'order-hub', orderId: em.order.id }); } catch { /* logging is best-effort */ }
            showToast('המייל נשלח ללקוח ✓', 'success');
            if (em.afterSend) await em.afterSend();
            setEmailModal(null);
        } catch {
            showToast('שגיאה בשליחת המייל', 'error');
            setEmailModal(m => m && { ...m, sending: false });
        }
    };

    /* ── forward-to-supplier (dropship) ────────────────────────────────────── */
    const confirmDropship = async ({ order, supplier, note, supplierCost, itemCosts, savePrices }) => {
        if (inFlight.current) return;              // prevent duplicate POs on double-click
        inFlight.current = true;
        setBusy(true);
        try {
            // tiered approval — governance guard on thin/negative margin (only when cost is KNOWN)
            const rev = orderTotal(order);
            const cost = Number(supplierCost) || 0;   // 0 = cost unknown (operator didn't enter it)
            if (cost > 0) {
                const marginPct = rev > 0 ? Math.round(((rev - cost) / rev) * 100) : 100;
                if (marginPct < 10) {
                    const ok = await confirm({ title: '⚠ רווח נמוך', message: `הרווח בעסקה ${marginPct}% בלבד (מכירה ₪${rev.toLocaleString()} · עלות ספק ₪${cost.toLocaleString()}). להעביר לספק בכל זאת?`, danger: true, confirmLabel: 'כן, העבר' });
                    if (!ok) { setBusy(false); inFlight.current = false; return; }
                }
            }
            const shipAddr = order.shipTo?.address || order.address || '';
            const poId = await createSupplierOrder({
                customerName: orderTitle(order), supplierName: supplier?.name || supplier?.company || '',
                supplierId: supplier?.id || '', productTitle: orderItemsSummary(order),
                qty: (order.items || []).reduce((s, it) => s + (Number(it.qty) || 1), 0),
                totalCost: cost > 0 ? cost : null, status: 'forwarded', eta: order.deliveryDate || '',
                notes: `${note || ''}${shipAddr ? ` · אספקה: ${shipAddr}` : ''}`, customerOrderId: order.id,
            });
            if (poId) await linkSupplierOrder(order.id, poId);
            // Learn the product → default-supplier (+ cost) mapping from this forward, so next
            // time the supplier is pre-selected and the cost pre-filled — the mapping/pricing
            // sync builds itself from real usage instead of manual re-entry each time.
            if (supplier?.id && updateProductDetails && Array.isArray(itemCosts)) {
                itemCosts.forEach(ic => {
                    const key = String(ic.catalogNumber || '').trim(); if (!key) return;
                    const prod = inventory.find(p => String(p.sku || p.catalogNumber || p.id || '').trim() === key);
                    if (prod?.id) {
                        const upd = { defaultSupplierId: supplier.id };
                        if (Number(ic.cost) > 0) upd.supplierCost = Number(ic.cost);
                        updateProductDetails(prod.id, upd);
                    }
                });
            }
            // Save agreed per-item costs to the price book for next time (opt-in)
            if (savePrices && supplier?.id && Array.isArray(itemCosts)) {
                await Promise.all(itemCosts.filter(ic => Number(ic.cost) > 0).map(ic =>
                    addDoc(collection(db, 'supplier_prices'), {
                        supplierId: supplier.id, supplierName: supplier.name || supplier.company || '',
                        catalogNumber: ic.catalogNumber || '', productTitle: ic.title || '',
                        cost: Number(ic.cost) || 0, currency: 'ILS', createdAt: serverTimestamp(),
                    }).catch(() => {})
                ));
            }
            // Persist supplier cost + margin ON the order so profitability is visible everywhere
            // (order record, hub list, KPIs) — not only reconstructable in the monthly report.
            const marginProfit = cost > 0 ? (rev - cost) : null;
            const marginPct = cost > 0 && rev > 0 ? Math.round(((rev - cost) / rev) * 100) : null;
            await advanceOrderStage(order.id, 'sent_supplier', {
                supplierName: supplier?.name || supplier?.company || '',
                supplierId: supplier?.id || '',
                supplierCost: cost > 0 ? cost : null,
                marginProfit, marginPct,
            });
            await logOrderActivity(order.id, { type: 'supplier', message: `הועבר לספק${supplier?.name ? `: ${supplier.name}` : ''}${supplier?.email ? ' · עורך מייל לספק' : ''}` });
            setDropship(null);
            // Open the supplier-email composer (auto-filled, fully editable) — the
            // operator reviews/edits every field before it's queued to the gate.
            if (supplier?.email) {
                setSupplierEmail({ order, supplier, note });
                showToast('הועבר לספק · ערוך/י את המייל לספק', 'success');
            } else {
                showToast('הועבר לספק · הזמנת רכש נוצרה (אין מייל לספק)', 'success');
            }
        } catch (e) { showToast('שגיאה בהעברה לספק', 'error'); }
        finally { setBusy(false); inFlight.current = false; }
    };

    /* ── queue the composed supplier email (approval gate, never auto-sends) ──── */
    const queueSupplierEmail = async ({ html, subject, to, model }) => {
        if (busy) return;
        setBusy(true);
        try {
            const order = supplierEmail?.order || {};
            const supplier = supplierEmail?.supplier || null;
            const res = await fetch('/api/send-supplier-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quote: { id: order.id, orderNumber: order.orderNumber || order.id },
                    supplier, to, subject, html, type: 'order_confirmation',
                }),
            });
            if (!res.ok) throw new Error('queue failed');
            await logOrderActivity(order.id, { type: 'supplier', message: `מייל לספק נשמר בתור אישור → ${to}` });
            showToast('המייל לספק נשמר בתור — אשר/י ושלח/י ב"תקשורת"', 'success');
            setSupplierEmail(null);
        } catch (e) {
            showToast('שמירת המייל לספק נכשלה', 'error');
        } finally { setBusy(false); }
    };

    return (
        <div dir="rtl" style={{ fontFamily: HE, maxWidth: 1320, margin: '0 auto' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>מרכז ההזמנות</h1>
                    <p style={{ fontSize: 13, color: '#86868B', margin: '4px 0 0', fontWeight: 600 }}>לקוח → ספק → אספקה, במקום אחד · כל מייל עובר אישור לפני שליחה</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* view switcher — one unified segmented control (iOS/Fiori-style) */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 12, background: '#EAECF1' }}>
                        {[
                            { v: 'work', label: 'הצעד הבא', Icon: ListChecks },
                            { v: 'kanban', label: 'לוח', Icon: LayoutGrid },
                            { v: 'list', label: 'רשימה', Icon: List },
                            { v: 'split', label: 'מפוצל', Icon: Columns3 },
                            { v: 'insights', label: 'תובנות', Icon: BarChart3 },
                            { v: 'store', label: 'אתר', Icon: ShoppingCart, count: ecomOrders.length },
                            { v: 'trash', label: 'סל', Icon: Trash2, count: trashedOrders.length },
                        ].map(({ v, label, Icon, count }) => {
                            const on = view === v;
                            return (
                                <button key={v} onClick={() => setView(v)} title={label}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap', background: on ? '#fff' : 'transparent', color: on ? '#007AFF' : '#6E6E73', boxShadow: on ? '0 1px 4px rgba(20,40,80,0.16)' : 'none', transition: 'background .15s, color .15s' }}>
                                    <Icon size={15} strokeWidth={2.3} />
                                    {label}
                                    {count > 0 && <span style={{ fontSize: 10, fontWeight: 900, padding: '1px 6px', borderRadius: 99, background: on ? 'rgba(0,122,255,0.12)' : 'rgba(0,0,0,0.08)', color: on ? '#007AFF' : '#8A94A6' }}>{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* secondary tools — grouped icon cluster */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 12, background: '#EAECF1' }}>
                        {[
                            { title: 'ייצא CSV', Icon: Download, onClick: exportCsv },
                            { title: 'ספריית תבניות מייל/וואטסאפ', Icon: FileText, onClick: () => setTemplatesOpen(true) },
                            { title: 'חוקי אוטומציה — התראות מותאמות', Icon: Settings, onClick: () => setRulesOpen(true) },
                        ].map(({ title, Icon, onClick }) => (
                            <motion.button key={title} whileTap={{ scale: 0.92 }} onClick={onClick} title={title} aria-label={title}
                                style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6E6E73' }}>
                                <Icon size={16} strokeWidth={2.2} />
                            </motion.button>
                        ))}
                    </div>

                    {/* primary CTAs */}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setEmailIntake(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13, background: '#fff', color: '#1D1D1F' }}>
                        <Mail size={15} strokeWidth={2.3} /> ממייל
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={createBlank} disabled={busy}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 17px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', boxShadow: '0 6px 16px rgba(0,122,255,0.28)' }}>
                        <Plus size={16} strokeWidth={2.6} /> הזמנה חדשה
                    </motion.button>
                </div>
            </div>

            {/* ── Daily Briefing — "what needs you today" ─────────────────────── */}
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 20, marginBottom: 16,
                background: 'linear-gradient(150deg, rgba(255,255,255,0.88), rgba(255,255,255,0.6))',
                backdropFilter: 'blur(30px) saturate(1.8)', WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
                border: '1px solid rgba(255,255,255,0.9)',
                boxShadow: `0 20px 60px rgba(20,40,80,0.10), 0 4px 14px ${briefing.clear ? '#34C759' : '#FF9500'}1f, inset 0 1.5px 0 rgba(255,255,255,1)` }}>
                {/* soft tone glows for glass depth */}
                <div aria-hidden style={{ position: 'absolute', top: -70, insetInlineStart: -50, width: 260, height: 260, borderRadius: '50%', pointerEvents: 'none',
                    background: `radial-gradient(circle, ${briefing.clear ? '#34C759' : '#FF9500'}26, transparent 68%)` }} />
                <div aria-hidden style={{ position: 'absolute', bottom: -90, insetInlineEnd: -60, width: 220, height: 220, borderRadius: '50%', pointerEvents: 'none',
                    background: `radial-gradient(circle, ${briefing.clear ? '#5AC8FA' : '#007AFF'}12, transparent 70%)` }} />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: briefing.clear ? 0 : 16 }}>
                    <span style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, ${briefing.clear ? '#34C759' : '#FF9500'}, ${briefing.clear ? '#2AA84B' : '#FFB340'})`,
                        boxShadow: `0 8px 20px ${briefing.clear ? '#34C759' : '#FF9500'}4d, inset 0 1px 0 rgba(255,255,255,0.45)` }}>
                        {briefing.clear ? <CheckCircle2 size={19} color="#fff" strokeWidth={2.5} /> : <ListChecks size={19} color="#fff" strokeWidth={2.5} />}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 15.5, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.01em' }}>הבריפינג היומי שלך</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: briefing.clear ? '#1A8C40' : '#86868B' }}>
                            {briefing.clear ? 'הכל תחת שליטה — אין משימות דחופות' : 'מה שדורש את תשומת לבך היום'}
                        </p>
                    </div>
                    {!briefing.clear && (() => {
                        const groups = [briefing.unanswered, briefing.stuckSupplier, briefing.overduePay, briefing.dups, briefing.newEcom, briefing.dueRem, briefing.highRisk].filter(a => a?.length > 0).length;
                        return (
                            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99,
                                background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.28)', fontSize: 11.5, fontWeight: 900, color: '#B25E00' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9500' }} />
                                {groups} {groups === 1 ? 'נושא' : 'נושאים'}
                            </span>
                        );
                    })()}
                </div>
                {!briefing.clear && (
                    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 11 }}>
                        {briefing.unanswered.length > 0 && (
                            <BriefItem Icon={Mail} tone="info" n={briefing.unanswered.length} text="הזמנות/הצעות לטיפול" onClick={() => setStageFilter('needs_review')} />
                        )}
                        {briefing.stuckSupplier.length > 0 && (
                            <BriefItem Icon={Truck} tone="warning" n={briefing.stuckSupplier.length} text="תקוע אצל הספק — לנדנד" onClick={() => setStageFilter('sent_supplier')} />
                        )}
                        {briefing.overduePay.length > 0 && (
                            <BriefItem Icon={CircleDollarSign} tone="danger" n={briefing.overduePay.length} text={`תשלומים באיחור · ₪${briefing.overdueTotal.toLocaleString()}`} onClick={() => setStageFilter('unpaid')} />
                        )}
                        {briefing.dups.length > 0 && (
                            <BriefItem Icon={Copy} tone="warning" n={briefing.dups.length} text="מוסדות עם כמה הזמנות פתוחות — שקול איחוד" onClick={() => { setView('list'); setSearch(briefing.dups[0]?.inst || ''); }} />
                        )}
                        {briefing.newEcom.length > 0 && (
                            <BriefItem Icon={ShoppingCart} tone="danger" n={briefing.newEcom.length} text="הזמנות חדשות מהחנות המקוונת — לטיפול" onClick={() => setView('store')} />
                        )}
                        {briefing.dueRem.length > 0 && (
                            <BriefItem Icon={Clock} tone="warning" n={briefing.dueRem.length} text="תזכורות שהגיע זמנן" onClick={() => briefing.dueRem[0]?.quoteId && setSelectedId(briefing.dueRem[0].quoteId)} />
                        )}
                        {briefing.highRisk.length > 0 && (
                            <BriefItem Icon={AlertTriangle} tone="danger" n={briefing.highRisk.length} text="הזמנות בסיכון גבוה" onClick={() => setStageFilter('atrisk')} />
                        )}
                    </div>
                )}
            </div>

            {/* live automation-rule alerts (client-side, no auto-send) */}
            {rules?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <RuleAlerts rules={rules} orders={orders} onOpenOrder={setSelectedId} />
                </div>
            )}

            {/* KPI band */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
                <KpiTile label="הזמנות פתוחות" value={stats.open} tone="info" onClick={() => setStageFilter('all')} />
                <KpiTile label="ממתין לספק" value={stats.awaiting} tone="warning" onClick={() => setStageFilter('sent_supplier')} />
                <KpiTile label="סופק החודש" value={stats.deliveredM} tone="success" onClick={() => setStageFilter('delivered')} />
                <KpiTile label={`רווח גולמי${kpis.marginPct ? ` · ${kpis.marginPct}%` : ''}`} value={`₪${(kpis.grossMargin || 0).toLocaleString()}`} tone="success" onClick={() => setStageFilter('all')} />
                <KpiTile label="דורש טיפול (SLA)" value={stats.atRisk} tone="danger" onClick={() => setStageFilter('atrisk')} />
            </div>

            {/* global activity feed — cross-order status/history changes (collapsible) */}
            <GlobalActivityFeed orders={orders} onOpen={setSelectedId} />

            {/* filter pills + search */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <FilterPill active={stageFilter === 'all'} onClick={() => setStageFilter('all')} label={`הכל (${orders.length})`} />
                {(() => {
                    // drop-ship stages + any self/side stage that has orders (nothing hidden)
                    const seen = new Set();
                    const list = [...STAGES_DROPSHIP, ...STAGES_SELF, ...SIDE_STATES].filter(s => s.id !== 'needs_review' && !seen.has(s.id) && seen.add(s.id));
                    return list.map(s => {
                        const n = orders.filter(o => deriveStage(o) === s.id).length;
                        if (!n) return null;
                        return <FilterPill key={s.id} active={stageFilter === s.id} onClick={() => setStageFilter(s.id)} label={`${s.short || s.label || s.id} (${n})`} tone={s.tone} />;
                    });
                })()}
                <FilterPill active={stageFilter === 'atrisk'} onClick={() => setStageFilter('atrisk')} label={`דחוף (${stats.atRisk})`} tone="danger" />
                {briefing.overduePay.length > 0 && <FilterPill active={stageFilter === 'unpaid'} onClick={() => setStageFilter('unpaid')} label={`לא שולם (${briefing.overduePay.length})`} tone="danger" />}
                <div style={{ flex: 1 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לקוח / מוסד / טלפון…" dir="rtl"
                    style={{ padding: '9px 14px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: HE, fontSize: 13, fontWeight: 600, outline: 'none', minWidth: 220 }} />
            </div>

            {/* body */}
            {view === 'work' && <WorkView orders={filtered} onOpen={setSelectedId} onAction={runAction} busy={busy} />}
            {view === 'split' && (
                <div className="nc-splitview" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 16, alignItems: 'start' }}>
                    <div style={{ position: 'sticky', top: 8, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', ...glass, borderRadius: 16, padding: 6 }}>
                        {filtered.map(o => (
                            <button key={o.id} onClick={() => setSelectedId(o.id)}
                                style={{ display: 'block', width: '100%', textAlign: 'right', padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: HE, background: selectedId === o.id ? 'rgba(0,122,255,0.08)' : 'transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(o)}</span>
                                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#007AFF' }}>₪{orderTotal(o).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}><OrderStageChip order={o} size="sm" /><RiskBadge order={o} /></div>
                            </button>
                        ))}
                        {!filtered.length && <p style={{ padding: 20, textAlign: 'center', color: '#AEAEB2', fontSize: 12 }}>אין הזמנות</p>}
                    </div>
                    <div>
                        {selected ? <InlineRecord order={selected} activity={activity} busy={busy} onAction={runAction} onJump={jumpToStage} onForward={() => setDropship(selected)} onFull={() => setView('list')} />
                            : <div style={{ ...glass, borderRadius: 18, padding: 60, textAlign: 'center', color: '#AEAEB2', fontSize: 13, fontWeight: 700, fontFamily: HE }}>בחר/י הזמנה מהרשימה</div>}
                    </div>
                </div>
            )}
            {view === 'kanban' && <KanbanBoard orders={filtered} onOpen={setSelectedId} onAdvance={jumpToStage} />}
            {view === 'list' && <ListView orders={filtered} onOpen={setSelectedId} onAction={runAction} onDelete={handleDelete} busy={busy} sel={sel} onToggleSel={toggleSel} />}
            {view === 'insights' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <OwnerMonthlyReport orders={orders} supplierOrders={supplierOrders} />
                    <InsightsView orders={orders} supplierOrders={supplierOrders} />
                </div>
            )}
            {view === 'store' && (
                <EcomOrdersView orders={ecomOrders} busy={busy} onPromote={promoteEcom}
                    onStatus={async (o, s) => { await updateOrderStatus(o.id, s); showToast(`הזמנת אתר → ${s}`, 'success'); }}
                    onInvoice={(o) => setInvoiceOrder({ ...o, _kind: 'order' })}
                    onDelete={async (o) => { if (await confirm({ message: `להעביר הזמנת אתר של ${o.customer || o.contactName || ''} לפח?`, danger: true })) { await deleteOrder(o.id); showToast('הועבר לפח', 'success'); } }} />
            )}
            {view === 'trash' && (
                <TrashView items={trashedOrders} busy={busy}
                    onRestore={async (o) => { await (o._kind === 'order' ? restoreOrder(o.id) : restoreQuote(o.id)); showToast('ההזמנה שוחזרה', 'success'); }}
                    onPurge={async (o) => { if (await confirm({ message: `למחוק לצמיתות את "${orderTitle(o)}"? פעולה בלתי הפיכה.`, danger: true })) { await (o._kind === 'order' ? hardDeleteOrder(o.id) : hardDeleteQuote(o.id)); showToast('נמחק לצמיתות', 'warning'); } }} />
            )}

            {/* bulk-action bar (mass actions on list selection) */}
            <AnimatePresence>
                {view === 'list' && sel.size > 0 && (
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                        style={{ position: 'fixed', bottom: 20, insetInlineStart: '50%', transform: 'translateX(-50%)', zIndex: 900, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: 18, background: 'rgba(29,29,31,0.96)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 50px rgba(0,0,0,0.3)', fontFamily: HE }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{sel.size} נבחרו</span>
                        <button disabled={busy} onClick={bulkMarkDelivered} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(52,199,89,0.9)', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>✓ סמן סופק</button>
                        <button disabled={busy} onClick={bulkDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,0.9)', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 12 }}><Trash2 size={14} strokeWidth={2.4} /> לפח</button>
                        <button onClick={clearSel} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: HE, fontWeight: 700, fontSize: 12 }}>נקה</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {orders.length === 0 && (
                <div style={{ ...glass, borderRadius: 20, padding: 48, textAlign: 'center', marginTop: 12 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>אין הזמנות עדיין</p>
                    <p style={{ fontSize: 12.5, color: '#86868B', margin: '6px 0 0' }}>הזמנות מהאתר, מהמייל או מהסורק יופיעו כאן.</p>
                </div>
            )}

            {/* record-360 drawer */}
            <AnimatePresence>
                {selected && view !== 'split' && (
                    <RecordDrawer order={selected} activity={activity} busy={busy} catalog={inventory} directory={directory}
                        onClose={() => setSelectedId(null)}
                        onAction={runAction} onJump={jumpToStage} onSetMode={setMode} onSave={saveFields}
                        onReview={() => setReviewId(selected.id)}
                        onEmail={(type) => openEmail(type, selected)}
                        onForward={() => setDropship(selected)} onDelete={handleDelete} custStats={custStats}
                        onUpdatePayment={(p) => updatePayment(selected.id, p)}
                        onInst360={() => setInst360(selected.institution || selected.contactName || '')}
                        onSendChat={async (text) => { await sendThreadMessage(selected.id, text); }}
                        onReadChat={() => markAdminThreadRead(selected.id)}
                        onSetReminder={async (ts, note) => { await updateQuoteFields(selected.id, { reminderAt: ts, reminderNote: note, reminderCleared: false }); showToast('תזכורת נקבעה ⏰', 'success'); }}
                        onClearReminder={async () => { await clearReminder(selected.id); showToast('תזכורת בוטלה', 'info'); }}
                        onInvoice={setInvoiceOrder}
                        onAddNote={async (text) => { await logOrderActivity(selected.id, { type: 'note', message: text }); }} />
                )}
            </AnimatePresence>

            {/* full-screen document ⟷ data review (incoming-order intake) */}
            <AnimatePresence>
                {reviewOrder && (
                    <OrderReviewSplit order={reviewOrder} catalog={inventory} directory={directory} onClose={() => setReviewId(null)}
                        onSave={saveFields} onApprove={approveReview} />
                )}
            </AnimatePresence>

            {/* invoice generator */}
            <AnimatePresence>
                {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
            </AnimatePresence>

            {/* dropship modal */}
            <AnimatePresence>
                {dropship && (
                    <DropshipModal order={dropship} suppliers={suppliers} prices={prices} busy={busy} catalog={inventory}
                        onClose={() => setDropship(null)} onConfirm={confirmDropship} />
                )}
            </AnimatePresence>

            {/* supplier-email composer — auto-filled from the order, fully editable */}
            <AnimatePresence>
                {supplierEmail && (
                    <SupplierEmailComposer
                        order={supplierEmail.order} supplier={supplierEmail.supplier} note={supplierEmail.note}
                        catalog={inventory} directory={directory}
                        busy={busy} onClose={() => setSupplierEmail(null)} onQueue={queueSupplierEmail} />
                )}
            </AnimatePresence>

            {/* email-intake modal */}
            <AnimatePresence>
                {emailIntake && <EmailIntakeModal busy={busy} onClose={() => setEmailIntake(false)} onCreate={createFromEmail} />}
            </AnimatePresence>

            {/* institution 360 */}
            <AnimatePresence>
                {inst360 != null && (
                    <Institution360 name={inst360} orders={orders}
                        onClose={() => setInst360(null)}
                        onOpen={(id) => { setInst360(null); setSelectedId(id); }} />
                )}
            </AnimatePresence>

            {/* templates library (full-screen overlay) */}
            <AnimatePresence>
                {templatesOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#F5F6F9', overflowY: 'auto' }} dir="rtl">
                        <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(20px)' }}>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1D1D1F', fontFamily: HE, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={19} color="#007AFF" strokeWidth={2.3} /> ספריית תבניות</h2>
                            <button onClick={() => setTemplatesOpen(false)} style={{ width: 34, height: 34, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 17, color: '#6E6E73' }}>✕</button>
                        </div>
                        <div style={{ padding: 20 }}><TemplatesManager /></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* automation rules manager (full-screen overlay) */}
            <AnimatePresence>
                {rulesOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#F5F6F9', overflowY: 'auto' }} dir="rtl">
                        <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(0,0,0,0.08)', backdropFilter: 'blur(20px)' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1D1D1F', fontFamily: HE, display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={19} color="#007AFF" strokeWidth={2.3} /> חוקי אוטומציה</h2>
                                <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: '#86868B', fontFamily: HE }}>הגדר חוקים → התראות מותאמות במרכז ההזמנות (ללא שליחה אוטומטית)</p>
                            </div>
                            <button onClick={() => setRulesOpen(false)} style={{ width: 34, height: 34, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 17, color: '#6E6E73' }}>✕</button>
                        </div>
                        <div style={{ padding: 20 }}><RulesManager /></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cmd+K command palette */}
            <AnimatePresence>
                {cmdk && (
                    <CommandPalette orders={orders} onClose={() => setCmdk(false)}
                        onOpenOrder={(id) => { setCmdk(false); setSelectedId(id); }}
                        actions={[
                            { label: 'הזמנה חדשה', run: () => { setCmdk(false); createBlank(); } },
                            { label: 'הזמנה ממייל', run: () => { setCmdk(false); setEmailIntake(true); } },
                            { label: 'תצוגת לוח', run: () => { setCmdk(false); setView('kanban'); } },
                            { label: 'תצוגת רשימה', run: () => { setCmdk(false); setView('list'); } },
                            { label: 'תובנות', run: () => { setCmdk(false); setView('insights'); } },
                            { label: 'הצג דחוף', run: () => { setCmdk(false); setStageFilter('atrisk'); } },
                            { label: 'הצג לא‑שולם', run: () => { setCmdk(false); setStageFilter('unpaid'); } },
                        ]} />
                )}
            </AnimatePresence>

            {/* LIVE split-pane email composer */}
            <AnimatePresence>
                {composer && (
                    <EmailComposer order={composer.order} type={composer.type} catalog={inventory}
                        onClose={() => setComposer(null)} onSend={sendComposedEmail} />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── KPI tile ────────────────────────────────────────────────────────────────── */
function BriefItem({ Icon, tone, n, text, onClick }) {
    const c = toneColor(tone);
    return (
        <motion.button onClick={onClick}
            whileHover={{ y: -3, boxShadow: `0 16px 36px ${c}2e, inset 0 1px 0 rgba(255,255,255,1)` }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.9)',
                background: 'linear-gradient(150deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75))',
                backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                cursor: 'pointer', fontFamily: HE, textAlign: 'right', width: '100%',
                boxShadow: '0 6px 22px rgba(20,40,80,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
            <span style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(140deg, ${c}2b, ${c}12)`, border: `1px solid ${c}26`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${c}22` }}>
                {Icon && <Icon size={17} color={c} strokeWidth={2.4} />}
            </span>
            <p style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 12.5, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: c, fontWeight: 900, fontSize: 15 }}>{n}</span> {text}
            </p>
            <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c + '14', color: c }}>
                <ChevronLeft size={15} strokeWidth={2.8} />
            </span>
        </motion.button>
    );
}

function RiskBadge({ order }) {
    const r = riskAssess(order);
    if (r.level === 'none') return null;
    const c = toneColor(r.level === 'high' ? 'danger' : 'warning');
    return (
        <span title={r.reasons.map(x => x.text).join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: c + '18', color: c, fontSize: 9.5, fontWeight: 800, fontFamily: HE, whiteSpace: 'nowrap' }}>
            {r.level === 'high' ? <AlertTriangle size={9} strokeWidth={2.6} /> : '•'} {r.reasons[0]?.text}
        </span>
    );
}

function KpiTile({ label, value, tone, onClick }) {
    const c = toneColor(tone);
    return (
        <motion.button onClick={onClick}
            whileHover={{ y: -3, boxShadow: `0 16px 40px ${c}26, inset 0 1px 0 rgba(255,255,255,1)` }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '16px 18px', textAlign: 'right', cursor: 'pointer', fontFamily: HE, display: 'block', width: '100%',
                border: '1px solid rgba(255,255,255,0.9)',
                background: 'linear-gradient(150deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72))',
                backdropFilter: 'blur(24px) saturate(1.7)', WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
                boxShadow: '0 8px 30px rgba(20,40,80,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
            <div aria-hidden style={{ position: 'absolute', top: -40, insetInlineStart: -30, width: 120, height: 120, borderRadius: '50%', pointerEvents: 'none', background: `radial-gradient(circle, ${c}1f, transparent 70%)` }} />
            <p style={{ position: 'relative', margin: 0, fontSize: 27, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em',
                background: `linear-gradient(135deg, ${c}, ${c}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, margin: '8px 0 0' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 0 3px ${c}22`, flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6E6E73', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
            </div>
        </motion.button>
    );
}

function FilterPill({ active, onClick, label, tone }) {
    const c = toneColor(tone);
    return (
        <motion.button onClick={onClick} whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{ padding: '7px 15px', borderRadius: 99, cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap',
                border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.9)'}`,
                background: active ? `linear-gradient(135deg, ${c}, ${c}db)` : 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.65))',
                backdropFilter: active ? 'none' : 'blur(16px) saturate(1.6)', WebkitBackdropFilter: active ? 'none' : 'blur(16px) saturate(1.6)',
                color: active ? '#fff' : '#6E6E73',
                boxShadow: active ? `0 6px 16px ${c}44, inset 0 1px 0 rgba(255,255,255,0.35)` : '0 2px 8px rgba(20,40,80,0.05), inset 0 1px 0 rgba(255,255,255,1)' }}>
            {label}
        </motion.button>
    );
}

/* ─── Kanban (drag-to-advance) ───────────────────────────────────────────────── */
function KanbanBoard({ orders, onOpen, onAdvance }) {
    const [dragId, setDragId] = useState(null);
    const [overCol, setOverCol] = useState(null);
    // Base = drop-ship path; also surface any self-fulfil / side-state column that
    // actually holds orders, so nothing ever vanishes from the board.
    const cols = (() => {
        const base = STAGES_DROPSHIP.filter(s => s.id !== 'needs_review' || orders.some(o => deriveStage(o) === 'needs_review'));
        const have = new Set(base.map(s => s.id));
        const extra = [...STAGES_SELF, ...SIDE_STATES]
            .filter(s => !have.has(s.id) && orders.some(o => deriveStage(o) === s.id));
        // de-dupe extras (STAGES_SELF shares objects with dropship for common stages)
        const seen = new Set(); const uniqExtra = extra.filter(s => !seen.has(s.id) && seen.add(s.id));
        return [...base, ...uniqExtra];
    })();
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
                const c = toneColor(s.tone);
                return (
                    <div key={s.id} style={{ flex: '0 0 260px', minWidth: 260 }}
                        onDragOver={e => { if (dragId) { e.preventDefault(); setOverCol(s.id); } }}
                        onDragLeave={() => setOverCol(o => o === s.id ? null : o)}
                        onDrop={() => drop(s.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', marginBottom: 8, borderRadius: 12, background: c + '12' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: c }}>{s.short || s.label || s.id}</span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: items.length ? c : '#C7C7CC', background: '#fff', borderRadius: 99, padding: '2px 8px' }}>
                                {items.length === 0 ? '0' : `${items.length}${tot > 0 ? ` · ₪${tot.toLocaleString()}` : ''}`}
                            </span>
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
        <motion.button onClick={() => onOpen(order.id)}
            draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
            whileHover={{ y: -3, boxShadow: '0 16px 36px rgba(0,122,255,0.16), inset 0 1px 0 rgba(255,255,255,1)' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 13, textAlign: 'right', cursor: 'grab', fontFamily: HE, width: '100%',
                border: '1px solid rgba(255,255,255,0.9)',
                background: 'linear-gradient(150deg, rgba(255,255,255,0.95), rgba(255,255,255,0.74))',
                backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
                boxShadow: '0 6px 22px rgba(20,40,80,0.07), inset 0 1px 0 rgba(255,255,255,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(order)}</p>
                <StaleBadge order={order} />
            </div>
            <div style={{ marginTop: 3 }}><RiskBadge order={order} /></div>
            {order.institution && <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#86868B' }}>{order.institution}</p>}
            <p style={{ margin: '8px 0 0', fontSize: 11.5, fontWeight: 600, color: '#6E6E73' }}>{orderItemsSummary(order)}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: '-0.01em', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>₪{orderTotal(order).toLocaleString()}</span>
                {order.supplierName && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#86868B' }}><Truck size={11} strokeWidth={2.2} /> {order.supplierName}</span>}
            </div>
        </motion.button>
    );
}

/* ─── List view ──────────────────────────────────────────────────────────────── */
function ListView({ orders, onOpen, onAction, onDelete, busy, sel, onToggleSel }) {
    const GRID = 'auto minmax(0,1.4fr) 1fr auto auto auto auto';
    return (
        <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" dir="rtl" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            {/* Column header */}
            <div className="hidden lg:grid bg-gradient-to-l from-black/[0.02] to-transparent" style={{ gridTemplateColumns: GRID, gap: 12, alignItems: 'center', padding: '12px 16px' }}>
                {['', 'הזמנה', 'שלב', 'סכום', 'ימים', 'פעולה', ''].map((h, i) => (
                    <p key={i} className="text-[10px] font-black tracking-[0.14em] text-[#AEAEB2] uppercase" style={{ margin: 0 }}>{h}</p>
                ))}
            </div>
            {orders.map((o, i) => {
                const na = nextAction(o);
                const checked = sel?.has(o.id);
                return (
                    <div key={o.id} onClick={() => onOpen(o.id)}
                        className="group relative border-t border-black/[0.05] transition-colors hover:bg-[#007AFF]/[0.035]"
                        style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12, alignItems: 'center', padding: '14px 16px', cursor: 'pointer', background: checked ? 'rgba(0,122,255,0.05)' : undefined }}>
                        {/* hover accent rail (right edge in RTL) */}
                        <span className="absolute right-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <input type="checkbox" checked={!!checked} onClick={e => e.stopPropagation()} onChange={() => onToggleSel && onToggleSel(o.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        <div style={{ minWidth: 0 }}>
                            <p className="group-hover:text-[#007AFF] transition-colors" style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(o)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.institution || ''} · {orderItemsSummary(o)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><OrderStageChip order={o} size="sm" /><StaleBadge order={o} /></div>
                        <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 900, color: '#007AFF', whiteSpace: 'nowrap' }}>₪{orderTotal(o).toLocaleString()}</span>
                        {(() => {
                            const a = intakeAge(o);
                            return a
                                ? <span className="tabular-nums" title={`נקלט לפני ${a.days} ימים · בשלב הנוכחי ${daysInStage(o)} ימים`} style={{ fontSize: 11.5, fontWeight: 800, color: a.color, whiteSpace: 'nowrap' }}>{a.over ? '⚠️ ' : ''}{a.days}/21 י׳</span>
                                : <span className="tabular-nums" style={{ fontSize: 11.5, fontWeight: 700, color: '#AEAEB2', whiteSpace: 'nowrap' }}>{daysInStage(o)} י׳</span>;
                        })()}
                        {na
                            ? <button disabled={busy} onClick={e => { e.stopPropagation(); onAction(na, o); }}
                                style={{ padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(0,122,255,0.1)', color: '#007AFF', fontFamily: HE, fontWeight: 800, fontSize: 11.5, whiteSpace: 'nowrap' }}>{na.label}</button>
                            : <span style={{ width: 60 }} />}
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity" disabled={busy} title="העבר לפח" aria-label="מחק הזמנה"
                            onClick={e => { e.stopPropagation(); onDelete(o); }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                            <Trash2 size={15} strokeWidth={2.2} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// Trash / recycle bin — restore or permanently purge soft-deleted orders.
function TrashView({ items, busy, onRestore, onPurge }) {
    if (!items.length) {
        return (
            <div style={{ ...glass, borderRadius: 20, padding: 48, textAlign: 'center' }} dir="rtl">
                <div style={{ fontSize: 34, marginBottom: 8 }}>🗑</div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>סל המחזור ריק</p>
                <p style={{ fontSize: 12.5, color: '#86868B', margin: '6px 0 0' }}>הזמנות שנמחקות יופיעו כאן וניתן לשחזר אותן.</p>
            </div>
        );
    }
    return (
        <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" dir="rtl" style={{ backdropFilter: 'blur(20px)' }}>
            <div style={{ padding: '12px 18px', background: 'rgba(255,59,48,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#B42318' }}>סל מחזור · {items.length} הזמנות — ניתן לשחזר או למחוק לצמיתות</p>
            </div>
            {items.map(o => (
                <div key={o.id} className="border-t border-black/[0.05]" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) auto auto auto', gap: 12, alignItems: 'center', padding: '13px 18px' }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(o)}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#86868B' }}>{o.institution || ''} · {orderItemsSummary(o)}</p>
                    </div>
                    <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 900, color: '#6E6E73' }}>₪{orderTotal(o).toLocaleString()}</span>
                    <button disabled={busy} onClick={() => onRestore(o)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(52,199,89,0.28)', background: 'rgba(52,199,89,0.08)', color: '#1E8E3E', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>↩ שחזר</button>
                    <button disabled={busy} onClick={() => onPurge(o)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,59,48,0.22)', background: 'rgba(255,59,48,0.06)', color: '#FF3B30', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>
                        <Trash2 size={13} /> מחק לצמיתות</button>
                </div>
            ))}
        </div>
    );
}

// Storefront (e-commerce) orders — the live `orders` collection, managed with its
// own simple status flow (kept separate from the B2B quotes stage machinery).
const ECOM_STATUSES = ['חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר', 'בוטל'];
const ECOM_STATUS_TONE = { 'חדש': '#FF3B30', 'ממתין': '#FF9500', 'אושר': '#007AFF', 'נשלח': '#5AC8FA', 'נמסר': '#34C759', 'בוטל': '#8E8E93' };
function EcomOrdersView({ orders, busy, onStatus, onInvoice, onDelete, onPromote }) {
    if (!orders.length) {
        return (
            <div style={{ ...glass, borderRadius: 20, padding: 48, textAlign: 'center' }} dir="rtl">
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><ShoppingCart size={26} color="#007AFF" strokeWidth={2} /></div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>אין הזמנות אתר עדיין</p>
                <p style={{ fontSize: 12.5, color: '#86868B', margin: '6px 0 0' }}>הזמנות שמתקבלות מהחנות המקוונת יופיעו כאן.</p>
            </div>
        );
    }
    const sorted = [...orders].sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
    return (
        <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" dir="rtl" style={{ backdropFilter: 'blur(20px)' }}>
            <div style={{ padding: '12px 18px', background: 'linear-gradient(to left, rgba(0,122,255,0.04), transparent)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 7 }}><ShoppingCart size={15} color="#007AFF" strokeWidth={2.3} /> הזמנות מהחנות המקוונת · {orders.length}</p>
            </div>
            {sorted.map(o => {
                const a = intakeAge(o);
                return (
                    <div key={o.id} className="group relative border-t border-black/[0.05] transition-colors hover:bg-[#007AFF]/[0.035]"
                        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) 150px auto auto auto', gap: 12, alignItems: 'center', padding: '13px 18px' }}>
                        <span className="absolute right-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer || o.contactName || 'לקוח'}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderItemsSummary(o)}{o.city ? ` · ${o.city}` : ''}</p>
                        </div>
                        <select value={o.status || 'חדש'} disabled={busy} onChange={e => onStatus(o, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: 9, border: `1.5px solid ${ECOM_STATUS_TONE[o.status] || '#ccc'}55`, background: `${ECOM_STATUS_TONE[o.status] || '#8E8E93'}12`, color: ECOM_STATUS_TONE[o.status] || '#1D1D1F', fontFamily: HE, fontWeight: 800, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                            {ECOM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="tabular-nums" style={{ fontSize: 14, fontWeight: 900, color: '#007AFF', whiteSpace: 'nowrap' }}>₪{orderTotal(o).toLocaleString()}</span>
                        {a
                            ? <span className="tabular-nums" title={`נקלט לפני ${a.days} ימים`} style={{ fontSize: 11, fontWeight: 800, color: a.color, whiteSpace: 'nowrap' }}>{o.date || `${a.days} י׳`}</span>
                            : <span style={{ fontSize: 11, color: '#AEAEB2' }}>{o.date || ''}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => onPromote && onPromote(o)} title={o.promotedToQuoteId ? 'כבר בפייפליין — פתח' : 'העבר לפייפליין המלא (שלבים · ספק · מרווח)'}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(88,86,214,0.22)', background: 'rgba(88,86,214,0.08)', color: '#5856D6', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 11.5, whiteSpace: 'nowrap' }}>
                                {o.promotedToQuoteId ? 'בפייפליין ✓' : 'לפייפליין'}
                            </button>
                            <button onClick={() => onInvoice(o)} title="חשבונית"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(0,122,255,0.2)', background: 'rgba(0,122,255,0.08)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 11.5 }}><FileText size={13} /></button>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity" disabled={busy} title="העבר לפח" onClick={() => onDelete(o)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}><Trash2 size={14} /></button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Record-360 drawer ──────────────────────────────────────────────────────── */
const EMAIL_TYPES = [['initial_contact', 'אישור קבלה'], ['quote_sent', 'הצעת מחיר'], ['confirmed', 'אישור הזמנה'], ['in_transit', 'בדרך אליך'], ['delivered', 'סופק'], ['reminder', 'תזכורת']];

// Per-stage customer email templates (Salesforce Activity>Email pattern) — each is
// send-on-demand: opens preview→edit→send. `recFor` = the next-action id it matches,
// so the right one is highlighted "מומלץ עכשיו" for the order's current stage.
const STAGE_EMAILS = [
    { type: 'confirmed',  label: 'אישור קבלת הזמנה', desc: 'ללקוח — קיבלנו וההזמנה בטיפול',  Icon: CheckCircle2, tone: 'info',    recFor: 'ackCustomer' },
    { type: 'processing', label: 'ההזמנה בטיפול',     desc: 'הספק אישר — מאובטח ובקרוב אצלך', Icon: Clock,        tone: 'info',    recFor: 'markConfirmed' },
    { type: 'in_transit', label: 'בדרך אליך',         desc: 'ההזמנה יצאה למשלוח',             Icon: Truck,        tone: 'warning', recFor: 'markTransit' },
    { type: 'delivered',  label: 'סופק + בקשת דירוג', desc: 'ההזמנה נמסרה — תודה ובקשת דירוג', Icon: Package,      tone: 'success', recFor: 'markDelivered' },
    { type: 'reminder',   label: 'תזכורת / מעקב',     desc: 'תזכורת עדינה ללקוח',             Icon: Clock,        tone: 'warning', recFor: null },
];
function RecordDrawer({ order, activity, busy, onClose, onAction, onJump, onSetMode, onSave, onReview, onEmail, onForward, onDelete, onInvoice, onSendChat, onReadChat, onSetReminder, onClearReminder, onUpdatePayment, onInst360, custStats, onAddNote, catalog = [], directory = [] }) {
    const canReview = order.source === 'email' || !!order.documentId || deriveStage(order) === 'needs_review';
    const [pick, setPick] = useState('');
    const pickResults = pick.trim().length >= 2
        ? catalog.filter(p => (p.title || '').toLowerCase().includes(pick.toLowerCase()) || (p.sku || '').toLowerCase().includes(pick.toLowerCase()) || (p.model || '').toLowerCase().includes(pick.toLowerCase())).slice(0, 6)
        : [];
    const [tab, setTab] = useState('timeline');
    const [note, setNote] = useState('');
    const [chat, setChat] = useState('');
    const [rem, setRem] = useState('');
    useEffect(() => { if (tab === 'chat' && order.unreadAdmin) onReadChat && onReadChat(); }, [tab, order.unreadAdmin]); // eslint-disable-line
    const axes = deriveAxes(order);
    const na = nextAction(order);                                   // for "recommended email now"
    const emailHistory = (activity || []).filter(a => a.type === 'email');
    // editable buffers for customer + items (SF-style inline record editing)
    const [cust, setCust] = useState(null);
    const [items, setItems] = useState(null);
    useEffect(() => { setCust(null); setItems(null); }, [order.id]);
    const c = cust || { contactName: order.contactName || '', institution: order.institution || '', phone: order.phone || '', email: order.email || '', address: order.shipTo?.address || order.address || '', city: order.city || '' };
    const its = items || (order.items || []).map(it => ({ catalogNumber: it.catalogNumber || '', title: it.title || it.name || '', qty: Number(it.qty) || 1, salePrice: Number(it.salePrice ?? it.price) || 0 }));
    const setC = (k, v) => setCust({ ...c, [k]: v });
    // Combobox pools for the customer editor (known values from order history + cities).
    const _uniqBy = (arr, key) => { const s = new Set(); return (arr || []).filter(x => { const kk = (x[key] || '').trim(); if (!kk || s.has(kk)) return false; s.add(kk); return true; }); };
    const custCombos = {
        institution: _uniqBy(directory, 'institution').map(d => ({ label: d.institution, sub: d.city || d.address, _e: d })),
        address: _uniqBy(directory, 'address').map(d => ({ label: d.address, sub: d.institution, _e: d })),
        contactName: _uniqBy(directory, 'contactName').map(d => ({ label: d.contactName, sub: d.institution, _e: d })),
        city: cityOptions,
    };
    const fillFromDir = (d) => d && setCust({ ...c, contactName: d.contactName || c.contactName, institution: d.institution || c.institution, address: d.address || c.address, city: d.city || c.city, phone: d.phone || c.phone, email: d.email || c.email });
    const setIt = (i, k, v) => setItems(its.map((x, j) => j === i ? { ...x, [k]: v } : x));
    const addIt = () => setItems([...its, { catalogNumber: '', title: '', qty: 1, salePrice: 0 }]);
    const rmIt = (i) => setItems(its.filter((_, j) => j !== i));
    const saveCust = () => onSave && onSave(order.id, { contactName: c.contactName, institution: c.institution, phone: c.phone, email: c.email, address: c.address, city: c.city });
    const saveItems = () => onSave && onSave(order.id, { items: its });
    const inp = { width: '100%', padding: '9px 11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: HE, fontSize: 12.5, fontWeight: 600, outline: 'none', boxSizing: 'border-box' };
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 4000, backdropFilter: 'blur(2px)' }} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                dir="rtl" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 'min(560px, 96vw)', background: '#F5F6F9', zIndex: 4001, display: 'flex', flexDirection: 'column', fontFamily: HE, boxShadow: '0 0 60px rgba(0,0,0,0.25)' }}>
                {/* header */}
                <div style={{ padding: '18px 20px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(order)}</h2>
                            <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.institution || ''} {order.orderNumber ? `· #${order.orderNumber}` : ''}</p>
                        </div>
                        {/* compact icon cluster — no labels, never wraps */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <motion.button whileTap={{ scale: 0.92 }} onClick={() => onInvoice && onInvoice(order)} title="הפק חשבונית מס" aria-label="חשבונית"
                                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,122,255,0.18)', background: 'rgba(0,122,255,0.07)', color: '#007AFF', cursor: 'pointer' }}>
                                <FileText size={16} strokeWidth={2.2} />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.92 }} disabled={busy} onClick={() => onDelete(order)} title="העבר לפח" aria-label="מחק הזמנה"
                                style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,59,48,0.16)', background: 'rgba(255,59,48,0.07)', color: '#FF3B30', cursor: 'pointer' }}>
                                <Trash2 size={16} strokeWidth={2.2} />
                            </motion.button>
                            <button onClick={onClose} title="סגור" aria-label="סגור" style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', fontSize: 16, color: '#6E6E73', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                    </div>
                    {/* primary review CTA — full width, prominent, only for incoming/reviewable orders */}
                    {canReview && (
                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onReview && onReview()}
                            style={{ width: '100%', marginTop: 14, height: 44, borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 900, fontSize: 14, boxShadow: '0 8px 22px rgba(0,122,255,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Search size={16} strokeWidth={2.6} /> בדיקת מסמך המקור מול הנתונים
                        </motion.button>
                    )}
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
                        {[['dropship', 'ספק (דרופשיפ)', Truck], ['self', 'עצמית', Package]].map(([m, lbl, Ic]) => {
                            const on = (order.fulfillmentMode || 'dropship') === m;
                            return (
                                <button key={m} onClick={() => !on && onSetMode(order.id, m)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, border: '1.5px solid ' + (on ? 'transparent' : 'rgba(0,0,0,0.1)'), cursor: on ? 'default' : 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 10.5, background: on ? '#1D1D1F' : '#fff', color: on ? '#fff' : '#86868B' }}><Ic size={13} strokeWidth={2.3} /> {lbl}</button>
                            );
                        })}
                    </div>
                </div>

                {/* tabs */}
                <div style={{ display: 'flex', gap: 4, padding: '10px 16px 0', background: '#fff' }}>
                    {[['timeline', 'ציר זמן'], ['emails', 'מיילים'], ['chat', 'צ׳אט לקוח'], ['supplier', 'ספק'], ['items', 'פריטים'], ['versions', 'גרסאות'], ['customer', 'לקוח']].map(([id, lbl]) => (
                        <button key={id} onClick={() => setTab(id)}
                            style={{ position: 'relative', padding: '8px 14px', border: 'none', borderBottom: '2.5px solid ' + (tab === id ? '#007AFF' : 'transparent'), background: 'transparent', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, color: tab === id ? '#007AFF' : '#86868B' }}>
                            {lbl}
                            {id === 'chat' && order.unreadAdmin && <span style={{ position: 'absolute', top: 4, insetInlineStart: 4, width: 7, height: 7, borderRadius: 99, background: '#FF3B30' }} />}
                        </button>
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
                    {tab === 'chat' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                                {(order.thread || []).length === 0 && <p style={{ textAlign: 'center', color: '#AEAEB2', fontSize: 12, fontWeight: 700, padding: 20 }}>אין הודעות עם הלקוח עדיין</p>}
                                {(order.thread || []).map((m, i) => {
                                    const mine = m.from === 'admin';
                                    return (
                                        <div key={m.id || i} style={{ alignSelf: mine ? 'flex-start' : 'flex-end', maxWidth: '82%', padding: '9px 13px', borderRadius: 14, background: mine ? 'linear-gradient(135deg,#007AFF,#5AC8FA)' : '#fff', color: mine ? '#fff' : '#1D1D1F', border: mine ? 'none' : '1px solid rgba(0,0,0,0.08)', fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
                                            {m.text}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input value={chat} onChange={e => setChat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && chat.trim()) { onSendChat(chat.trim()); setChat(''); } }} placeholder="כתוב/י ללקוח…" dir="rtl"
                                    style={{ flex: 1, padding: '9px 12px', borderRadius: 11, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', fontFamily: HE, fontSize: 12.5, outline: 'none' }} />
                                <button disabled={!chat.trim()} onClick={() => { onSendChat(chat.trim()); setChat(''); }}
                                    style={{ padding: '9px 16px', borderRadius: 11, border: 'none', background: chat.trim() ? '#007AFF' : 'rgba(0,0,0,0.1)', color: '#fff', cursor: chat.trim() ? 'pointer' : 'default', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}>שלח</button>
                            </div>
                        </div>
                    )}
                    {tab === 'emails' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {!order.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 12, background: '#fff', border: '1px solid rgba(255,149,0,0.28)' }}>
                                    <AlertTriangle size={15} color="#FF9500" strokeWidth={2.3} />
                                    <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#B25E00' }}>אין כתובת מייל ללקוח — הוסף/י בטאב "לקוח" כדי לשלוח.</p>
                                </div>
                            )}
                            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
                                <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 900, color: '#1D1D1F' }}>טמפלייטים לפי שלב</p>
                                <p style={{ margin: '0 0 12px', fontSize: 10.5, fontWeight: 600, color: '#AEAEB2' }}>לחיצה פותחת תצוגה מקדימה → עריכה מלאה → אישור. שום מייל לא נשלח אוטומטית.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {STAGE_EMAILS.map(t => {
                                        const c = toneColor(t.tone);
                                        const rec = na?.id && na.id === t.recFor;
                                        return (
                                            <button key={t.type} onClick={() => onEmail(t.type)} disabled={!order.email}
                                                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 13, border: rec ? `1.5px solid ${c}55` : '1px solid rgba(0,0,0,0.06)', background: '#fff', cursor: order.email ? 'pointer' : 'not-allowed', opacity: order.email ? 1 : 0.55, fontFamily: HE, textAlign: 'right', width: '100%', boxShadow: rec ? `0 4px 16px ${c}18` : '0 2px 10px rgba(20,40,80,0.04)' }}>
                                                <span style={{ width: 34, height: 34, borderRadius: 10, background: c + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><t.Icon size={16} color={c} strokeWidth={2.3} /></span>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#1D1D1F' }}>{t.label}{rec && <span style={{ fontSize: 9, fontWeight: 900, color: c, background: c + '18', padding: '1px 6px', borderRadius: 99, marginInlineStart: 6 }}>מומלץ עכשיו</span>}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 10.5, fontWeight: 600, color: '#86868B' }}>{t.desc}</p>
                                                </div>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: c, fontWeight: 800, fontSize: 11.5, flexShrink: 0 }}><Mail size={13} strokeWidth={2.3} /> שלח</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={onForward} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', marginTop: 8, padding: '10px', borderRadius: 12, border: '1.5px dashed rgba(255,149,0,0.4)', background: 'rgba(255,149,0,0.05)', color: '#B86A00', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>
                                    <Truck size={14} strokeWidth={2.3} /> מייל לספק (העברת ההזמנה)
                                </button>
                            </div>
                            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
                                <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 900, color: '#1D1D1F' }}>היסטוריית מיילים ({emailHistory.length})</p>
                                {emailHistory.length ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        {emailHistory.map((e, i) => (
                                            <div key={e.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', borderRadius: 11, background: 'rgba(0,0,0,0.02)' }}>
                                                <Mail size={13} color="#007AFF" strokeWidth={2.2} style={{ marginTop: 2, flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.4 }}>{e.message}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: '#AEAEB2' }}>{new Date(e.ts || Date.now()).toLocaleString('he-IL')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: '#AEAEB2', textAlign: 'center', padding: 14 }}>עדיין לא נשלחו מיילים להזמנה זו</p>}
                            </div>
                        </div>
                    )}
                    {tab === 'supplier' && (
                        <div style={{ ...glass, borderRadius: 16, padding: 18 }}>
                            {order.supplierName || order.supplierOrderId ? (
                                <>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 6 }}><Truck size={15} color="#FF9500" strokeWidth={2.3} /> {order.supplierName || 'ספק מקושר'}</p>
                                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>סטטוס ספק: {{ none: 'טרם הועבר', sent: 'הועבר, ממתין לאישור', confirmed: 'אישר', delivered: 'סיפק', self: 'אספקה עצמית' }[axes.supplier]}</p>
                                    {order.deliveryDate && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6E6E73', fontWeight: 600 }}>אספקה: {order.deliveryDate}</p>}
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#6E6E73', fontWeight: 600 }}>טרם הועבר לספק.</p>
                                    <button onClick={onForward} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF9500,#FFB340)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13 }}><Truck size={16} strokeWidth={2.3} /> העבר לספק</button>
                                </>
                            )}
                        </div>
                    )}
                    {tab === 'items' && (
                        <div style={{ ...glass, borderRadius: 16, padding: 12 }}>
                            {/* Catalog picker — search real products instead of retyping */}
                            <div style={{ position: 'relative', marginBottom: 10 }}>
                                <input value={pick} onChange={e => setPick(e.target.value)} placeholder="🔎 חפש מוצר מהקטלוג להוספה…" dir="rtl"
                                    style={{ ...inp, padding: '8px 11px', background: '#F5F5F7' }} />
                                {pickResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 10, marginTop: 4, background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(20,40,80,0.18)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                        {pickResults.map(p => (
                                            <button key={p.id} onClick={() => { setItems([...its, { catalogNumber: p.sku || p.id || '', title: p.title || '', qty: 1, salePrice: Number(p.price) || 0, image: p.image || '', category: p.category || '' }]); setPick(''); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff', cursor: 'pointer', textAlign: 'right', fontFamily: HE }}>
                                                {p.image ? <img src={p.image} alt="" onError={e => { e.target.style.display = 'none'; }} style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F0F3F8', flexShrink: 0 }} />}
                                                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: '#007AFF' }}>₪{(Number(p.price) || 0).toLocaleString()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {its.map((it, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 74px 52px 84px 28px', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                                    <Combobox value={it.title} options={(catalog || []).map(p => ({ label: p.title || '', price: Number(p.price) || 0, image: p.image || '', sub: p.sku || p.model || '' })).filter(o => o.label)} placeholder="בחר/י מהמלאי או הקלד/י"
                                        onChange={v => setIt(i, 'title', v)}
                                        onPick={o => { setIt(i, 'title', o.label); if (o.price) setIt(i, 'salePrice', o.price); if (o.sub) setIt(i, 'catalogNumber', o.sub); }} />
                                    <input value={it.catalogNumber} onChange={e => setIt(i, 'catalogNumber', e.target.value)} placeholder='מק"ט' dir="rtl" style={{ ...inp, padding: '7px 8px', fontSize: 11 }} />
                                    <input type="number" value={it.qty} onChange={e => setIt(i, 'qty', Number(e.target.value))} style={{ ...inp, padding: '7px 6px', textAlign: 'center' }} />
                                    <input type="number" value={it.salePrice} onChange={e => setIt(i, 'salePrice', Number(e.target.value))} placeholder="₪" style={{ ...inp, padding: '7px 8px', textAlign: 'center', color: '#007AFF' }} />
                                    <button onClick={() => rmIt(i)} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', cursor: 'pointer', fontWeight: 900 }}>×</button>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                <button onClick={addIt} style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'rgba(0,122,255,0.1)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 11.5 }}>+ הוסף פריט</button>
                                <span style={{ fontSize: 13, fontWeight: 900, color: '#1D1D1F' }}>₪{its.reduce((s, x) => s + (Number(x.salePrice) || 0) * (Number(x.qty) || 1), 0).toLocaleString()}</span>
                            </div>
                            {items != null && (
                                <button onClick={saveItems} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 10, padding: '10px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}><Save size={14} strokeWidth={2.4} /> שמור פריטים</button>
                            )}
                        </div>
                    )}
                    {tab === 'versions' && (
                        <VersionsPanel order={order} onSave={onSave} />
                    )}
                    {tab === 'customer' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* LTV — customer lifetime value (click → institution 360) */}
                            {custStats && custStats.count > 0 && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                        {[['הזמנות', custStats.count, '#5856D6'], ['שווי כולל', `₪${custStats.total.toLocaleString()}`, '#007AFF'], ['ממוצע', `₪${custStats.avg.toLocaleString()}`, '#34C759']].map(([l, v, col]) => (
                                            <div key={l} style={{ ...glass, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                                                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: col }}>{v}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: '#86868B' }}>{l}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={onInst360} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', marginTop: 8, padding: '8px', borderRadius: 10, border: '1.5px solid rgba(0,122,255,0.2)', background: 'rgba(0,122,255,0.05)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12 }}><BarChart3 size={14} strokeWidth={2.4} /> כל ההזמנות של המוסד</button>
                                    {/* days since first order + product-interest frequency (read-only analytics) */}
                                    <div style={{ ...glass, borderRadius: 14, padding: 14, marginTop: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: custStats.productFreq?.length ? 12 : 0 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2' }}>לקוח כבר</span>
                                            <span style={{ fontSize: 12.5, fontWeight: 900, color: '#FF9500' }}>{custStats.daysSinceFirst} ימים</span>
                                        </div>
                                        {custStats.productFreq?.length > 0 && (
                                            <>
                                                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em' }}>עניין במוצרים (הכי מבוקש)</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {custStats.productFreq.map(([name, qty], idx) => {
                                                        const maxQty = custStats.productFreq[0][1] || 1;
                                                        const pct = Math.round((qty / maxQty) * 100);
                                                        const barColor = ['#007AFF', '#5AC8FA', '#FF9500', '#34C759', '#5856D6'][idx] || '#007AFF';
                                                        return (
                                                            <div key={name}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '78%' }}>{name}</span>
                                                                    <span style={{ fontSize: 10, fontWeight: 800, color: barColor }}>×{qty}</span>
                                                                </div>
                                                                <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.05)' }}>
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                                                                        style={{ height: '100%', borderRadius: 99, background: barColor }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* send email to customer (preview → edit → send) */}
                            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
                                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={12} strokeWidth={2.3} /> שלח מייל ללקוח</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {EMAIL_TYPES.map(([t, lbl]) => (
                                        <button key={t} onClick={() => onEmail && onEmail(t)}
                                            style={{ padding: '6px 11px', borderRadius: 9, border: '1.5px solid rgba(0,122,255,0.2)', background: 'rgba(0,122,255,0.06)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 11.5 }}>{lbl}</button>
                                    ))}
                                </div>
                                {!order.email && <p style={{ margin: '8px 0 0', fontSize: 10.5, color: '#FF9500', fontWeight: 700 }}>⚠ אין כתובת מייל — הוסף/י בפרטי הלקוח למטה</p>}
                                {order.phone && (() => {
                                    const intl = order.phone.toString().replace(/\D/g, '').replace(/^0/, '972');
                                    const msg = encodeURIComponent(`שלום ${orderTitle(order)},\nבנוגע להזמנה${order.orderNumber ? ` ${order.orderNumber}` : ''}: ${orderItemsSummary(order)} · סה"כ ₪${orderTotal(order).toLocaleString()}.\nבברכה, נקסט קלאס`);
                                    return (
                                        <a href={`https://wa.me/${intl}?text=${msg}`} target="_blank" rel="noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 9, padding: '7px 14px', borderRadius: 10, background: '#25D366', color: '#fff', textDecoration: 'none', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>
                                            💬 וואטסאפ ללקוח
                                        </a>
                                    );
                                })()}
                            </div>
                            {/* reminder */}
                            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
                                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} strokeWidth={2.3} /> תזכורת</p>
                                {order.reminderAt && !order.reminderCleared ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B86A00' }}>{new Date(order.reminderAt).toLocaleDateString('he-IL')} {order.reminderNote ? `· ${order.reminderNote}` : ''}</span>
                                        <button onClick={onClearReminder} style={{ padding: '5px 10px', borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.05)', color: '#86868B', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 11 }}>בטל</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type="date" value={rem} onChange={e => setRem(e.target.value)} style={{ ...inp, flex: 1 }} />
                                        <button disabled={!rem} onClick={() => { onSetReminder(new Date(rem).getTime(), ''); setRem(''); }}
                                            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: rem ? '#FF9500' : 'rgba(0,0,0,0.1)', color: '#fff', cursor: rem ? 'pointer' : 'default', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>קבע</button>
                                    </div>
                                )}
                            </div>
                            {/* payment tracking + invoice */}
                            <div style={{ ...glass, borderRadius: 16, padding: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 5 }}><CircleDollarSign size={12} strokeWidth={2.3} /> תשלום</p>
                                    {(() => { const a = paymentAgingDays(order); const paid = order.paymentStatus === 'paid';
                                        return <span style={{ fontSize: 11, fontWeight: 800, color: toneColor(paid ? 'success' : a > 0 ? 'danger' : 'neutral') }}>{paymentLabel(order)}{!paid && a > 0 ? ` · באיחור ${a} ימים` : ''}</span>; })()}
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {[['unpaid', 'ממתין'], ['partial', 'חלקי'], ['paid', 'שולם']].map(([s, l]) => {
                                        const on = (order.paymentStatus || 'unpaid') === s;
                                        return <button key={s} onClick={() => onUpdatePayment({ paymentStatus: s })}
                                            style={{ padding: '6px 12px', borderRadius: 9, border: '1.5px solid ' + (on ? 'transparent' : 'rgba(0,0,0,0.1)'), cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 11.5, background: on ? toneColor(PAYMENT_TONES[s]) : '#fff', color: on ? '#fff' : '#6E6E73' }}>{l}</button>;
                                    })}
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2' }}>תאריך יעד:</span>
                                    <input type="date" value={order.paymentDueTs ? new Date(order.paymentDueTs).toISOString().slice(0, 10) : ''}
                                        onChange={e => onUpdatePayment({ paymentDueTs: e.target.value ? new Date(e.target.value).getTime() : null })}
                                        style={{ ...inp, flex: 1 }} />
                                </div>
                                <div style={{ marginTop: 10 }}>
                                    <button onClick={() => onInvoice && onInvoice(order)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px', borderRadius: 11, border: '1.5px solid rgba(0,122,255,0.25)', background: 'rgba(0,122,255,0.06)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}>
                                        <Receipt size={14} strokeWidth={2.3} /> הפק חשבונית מס
                                    </button>
                                </div>
                            </div>
                            {/* customer details (editable) */}
                            <div style={{ ...glass, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {[['contactName', 'שם לקוח'], ['institution', 'מוסד'], ['phone', 'טלפון'], ['email', 'מייל'], ['address', 'כתובת אספקה'], ['city', 'עיר']].map(([k, l]) => (
                                    <div key={k}>
                                        <label style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2' }}>{l}</label>
                                        {custCombos[k]
                                            ? <div style={{ marginTop: 3 }}><Combobox value={c[k]} options={custCombos[k]} placeholder="בחר/י או הקלד/י"
                                                onChange={v => setC(k, v)} onPick={o => o._e ? fillFromDir(o._e) : setC(k, o.label)} inputStyle={{ background: '#fff', padding: '9px 30px 9px 11px', fontSize: 12.5 }} /></div>
                                            : <input value={c[k]} onChange={e => setC(k, e.target.value)} dir="rtl" style={{ ...inp, marginTop: 3 }} />}
                                    </div>
                                ))}
                                {cust != null && (
                                    <button onClick={saveCust} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, padding: '10px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}><Save size={14} strokeWidth={2.4} /> שמור פרטי לקוח</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
}

/* ─── Quote Versions panel — price-history diff between saved snapshots ───────── */
function VersionsPanel({ order, onSave }) {
    const versions = Array.isArray(order.versions) ? order.versions : [];
    const [openIdx, setOpenIdx] = useState(null);
    const [saving, setSaving] = useState(false);
    const itemsOf = (v) => v.items || [];
    const subOf = (v) => Number(v.subtotal) || itemsOf(v).reduce((s, it) => s + (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1), 0);
    const tsLabel = (ts) => ts ? new Date(ts).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
    // the live order appended as the last (current) snapshot for diffing
    const current = { ts: Date.now(), items: order.items || [], subtotal: orderTotal(order), _current: true };
    const all = [...versions, current];
    const keyOf = (it) => (it.catalogNumber || it.title || it.name || '').toString().trim();
    const diffBetween = (prev, cur) => {
        const changes = [];
        const pMap = {}; itemsOf(prev).forEach(it => { const k = keyOf(it); if (k) pMap[k] = it; });
        const cMap = {}; itemsOf(cur).forEach(it => { const k = keyOf(it); if (k) cMap[k] = it; });
        Object.keys(cMap).forEach(k => {
            const ci = cMap[k], pi = pMap[k];
            if (!pi) { changes.push({ type: 'added', item: ci }); return; }
            const cq = Number(ci.qty) || 1, pq = Number(pi.qty) || 1;
            const cp = Number(ci.salePrice ?? ci.price) || 0, pp = Number(pi.salePrice ?? pi.price) || 0;
            if (cq !== pq || cp !== pp) changes.push({ type: 'changed', item: ci, prev: pi });
        });
        Object.keys(pMap).forEach(k => { if (!cMap[k]) changes.push({ type: 'removed', item: pMap[k] }); });
        return changes;
    };
    const saveNow = async () => {
        if (saving) return;
        setSaving(true);
        const snap = { ts: Date.now(), items: (order.items || []).map(it => ({ ...it })), subtotal: orderTotal(order) };
        try { await onSave(order.id, { versions: [...versions, snap] }); } finally { setSaving(false); }
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em' }}>{versions.length} גרסאות שמורות</p>
                <button disabled={saving} onClick={saveNow}
                    style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid rgba(0,122,255,0.2)', background: saving ? 'rgba(0,0,0,0.05)' : 'rgba(0,122,255,0.06)', color: '#007AFF', cursor: saving ? 'default' : 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12 }}>
                    {saving ? 'שומר…' : '＋ שמור גרסה עכשיו'}
                </button>
            </div>
            {versions.length === 0 ? (
                <div style={{ ...glass, borderRadius: 16, padding: 22, textAlign: 'center' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>אין גרסאות שמורות עדיין</p>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#86868B', fontWeight: 600 }}>שמור/י גרסה כדי לעקוב אחר שינויי מחיר ופריטים לאורך זמן.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {all.map((v, i) => {
                        const isCurrent = i === all.length - 1;
                        const prevV = i > 0 ? all[i - 1] : null;
                        const changes = prevV ? diffBetween(prevV, v) : [];
                        const deltaPrice = prevV ? subOf(v) - subOf(prevV) : 0;
                        return (
                            <div key={i} style={{ ...glass, borderRadius: 14, overflow: 'hidden', border: isCurrent ? '1.5px solid rgba(0,122,255,0.3)' : '1px solid rgba(0,0,0,0.07)', background: isCurrent ? 'rgba(0,122,255,0.04)' : 'rgba(255,255,255,0.9)' }}>
                                <div onClick={() => changes.length && setOpenIdx(openIdx === i ? null : i)}
                                    style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: changes.length ? 'pointer' : 'default' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {deltaPrice !== 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: deltaPrice > 0 ? '#34C759' : '#FF3B30', background: deltaPrice > 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', padding: '2px 8px', borderRadius: 99 }}>
                                                {deltaPrice > 0 ? '+' : ''}₪{deltaPrice.toLocaleString()}
                                            </span>
                                        )}
                                        {changes.length > 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.1)', padding: '2px 8px', borderRadius: 99 }}>{changes.length} שינויים {openIdx === i ? '▲' : '▼'}</span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: isCurrent ? '#007AFF' : '#1D1D1F' }}>{isCurrent ? 'גרסה נוכחית' : `גרסה ${i + 1}`}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#AEAEB2' }}>{isCurrent ? 'נוכחי' : tsLabel(v.ts)} · ₪{subOf(v).toLocaleString()}</p>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {openIdx === i && changes.length > 0 && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                {changes.map((d, di) => (
                                                    <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, background: d.type === 'added' ? 'rgba(52,199,89,0.07)' : d.type === 'removed' ? 'rgba(255,59,48,0.07)' : 'rgba(255,149,0,0.07)' }}>
                                                        <span style={{ fontSize: 13 }}>{d.type === 'added' ? '✚' : d.type === 'removed' ? '✕' : '↻'}</span>
                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.item.title || d.item.name || d.item.catalogNumber || 'פריט'}</p>
                                                            {d.type === 'changed' && (
                                                                <p style={{ margin: '2px 0 0', fontSize: 10, color: '#86868B' }}>
                                                                    כמות: {Number(d.prev.qty) || 1}→{Number(d.item.qty) || 1} · מחיר: ₪{(Number(d.prev.salePrice ?? d.prev.price) || 0).toLocaleString()}→₪{(Number(d.item.salePrice ?? d.item.price) || 0).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Global activity feed — cross-order status/history changes (collapsible) ─── */
function GlobalActivityFeed({ orders, onOpen }) {
    const [open, setOpen] = useState(false);
    const events = useMemo(() => {
        const items = [];
        (orders || []).forEach(o => {
            (o.history || []).forEach(h => {
                if (h && h.ts) items.push({ ts: h.ts, id: o.id, contact: orderTitle(o), text: h.status || h.action || h.message || 'עודכן' });
            });
        });
        return items.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 20);
    }, [orders]);
    const fmtTime = (ts) => {
        const d = Math.floor((Date.now() - ts) / 60000);
        if (d < 1) return 'עכשיו';
        if (d < 60) return `לפני ${d} דק׳`;
        if (d < 1440) return `לפני ${Math.floor(d / 60)} ש׳`;
        return `לפני ${Math.floor(d / 1440)} י׳`;
    };
    if (!events.length) return null;
    return (
        <div style={{ ...glass, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
            <button onClick={() => setOpen(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: HE }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 800, color: '#1D1D1F' }}>
                    <span style={{ position: 'relative', display: 'flex', width: 7, height: 7, flexShrink: 0 }}>
                        <motion.span animate={{ scale: [1, 2.1], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            style={{ position: 'absolute', inset: 0, borderRadius: 99, background: '#34C759' }} />
                        <span style={{ position: 'relative', width: 7, height: 7, borderRadius: 99, background: '#34C759' }} />
                    </span>
                    פעילות אחרונה
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#8A94A6', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 99 }}>{events.length}</span>
                </span>
                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73', flexShrink: 0 }}>
                    <ChevronLeft size={14} strokeWidth={2.6} style={{ transform: 'rotate(-90deg)' }} />
                </motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                            {events.map((ev, i) => (
                                <button key={i} onClick={() => onOpen(ev.id)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: 'none', borderBottom: i < events.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'right', fontFamily: HE }} dir="rtl">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.contact} → {ev.text}</p>
                                        <p style={{ margin: '1px 0 0', fontSize: 10, color: '#86868B' }}>{ev.id}</p>
                                    </div>
                                    <span style={{ fontSize: 9.5, color: '#AEAEB2', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{fmtTime(ev.ts)}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Dropship modal ─────────────────────────────────────────────────────────── */
function DropshipModal({ order, suppliers, prices = [], busy, onClose, onConfirm, catalog = [] }) {
    // Pre-select the supplier learned from a previous forward of this product (mapping sync).
    const mappedSupplierId = (order.items || []).reduce((acc, it) => {
        if (acc) return acc;
        const key = String(it.catalogNumber || '').trim();
        const prod = key && catalog.find(p => String(p.sku || p.catalogNumber || p.id || '').trim() === key);
        return (prod && prod.defaultSupplierId) || '';
    }, '');
    const [supplierId, setSupplierId] = useState(mappedSupplierId || suppliers[0]?.id || '');
    const [freeName, setFreeName] = useState('');
    const [note, setNote] = useState('');
    const [savePrices, setSavePrices] = useState(false);
    const [itemCosts, setItemCosts] = useState(() => (order.items || []).map(it => ({ catalogNumber: it.catalogNumber || '', title: it.title || it.name || 'פריט', qty: Number(it.qty) || 1, cost: 0 })));
    const chosen = suppliers.find(s => s.id === supplierId);
    const supplier = chosen || (freeName ? { name: freeName } : null);
    const addr = order.shipTo?.address || order.address || '—';

    // Auto-fill agreed costs from the price book when the supplier changes.
    useEffect(() => {
        const sp = pricesForSupplier(prices, supplierId);
        setItemCosts((order.items || []).map(it => ({
            catalogNumber: it.catalogNumber || '', title: it.title || it.name || 'פריט', qty: Number(it.qty) || 1,
            cost: bestCostFor(it, sp, catalog) || 0,   // price book → product cost fallback
        })));
    }, [supplierId]); // eslint-disable-line

    const setCost = (i, v) => setItemCosts(cs => cs.map((c, j) => j === i ? { ...c, cost: Number(v) || 0 } : c));
    const supplierCost = itemCosts.reduce((s, c) => s + (Number(c.cost) || 0) * (Number(c.qty) || 1), 0);
    const rev = orderTotal(order);
    const { profit, pct } = marginOf(rev, supplierCost);
    const hasBookHit = supplierId && supplierCostForOrder(order, pricesForSupplier(prices, supplierId), catalog).matched > 0;

    return createPortal(
        <div dir="rtl" onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                dir="rtl" style={{ width: 'min(520px, 95vw)', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 24, padding: 24, fontFamily: HE, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Truck size={24} color="#FF9500" strokeWidth={2.2} />
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F' }}>העברה לספק (Dropship)</h2>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#86868B', fontWeight: 600 }}>ייווצר הזמנת רכש מקושרת + טיוטת מייל לספק (ממתינה לאישור שליחה).</p>

                <label style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2' }}>ספק</label>
                <div style={{ marginTop: 5, marginBottom: 12 }}>
                    <Combobox value={chosen ? (chosen.name || chosen.company || '') : freeName}
                        options={suppliers.map(s => ({ label: s.name || s.company || '', sub: s.email || '', id: s.id }))}
                        placeholder="בחר/י ספק או הקלד/י שם חדש"
                        onChange={v => { setFreeName(v); setSupplierId(''); }}
                        onPick={o => { setSupplierId(o.id); setFreeName(''); }}
                        inputStyle={{ padding: '11px 32px 11px 12px', fontSize: 13, background: '#F5F5F7' }} />
                </div>

                {/* per-item supplier cost (price book) */}
                <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2' }}>עלות לספק (פריט)</span>
                        {hasBookHit && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#34C759' }}>✓ מולא ממחירון מוסכם</span>}
                    </div>
                    {itemCosts.map((c, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 46px 84px', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textAlign: 'center' }}>×{c.qty}</span>
                            <input type="number" value={c.cost || ''} onChange={e => setCost(i, e.target.value)} placeholder="עלות ₪"
                                style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 12, fontWeight: 700, textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                        </div>
                    ))}
                </div>

                {/* margin summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[['מכירה', rev, '#007AFF'], ['עלות ספק', supplierCost, '#FF9500'], [`רווח (${pct}%)`, profit, profit >= 0 ? '#34C759' : '#FF3B30']].map(([l, v, c]) => (
                        <div key={l} style={{ padding: '8px 10px', borderRadius: 10, background: c + '10', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: c }}>₪{Number(v).toLocaleString()}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 9.5, fontWeight: 700, color: '#86868B' }}>{l}</p>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 12, background: '#F6F8FB', border: '1px solid rgba(0,0,0,0.05)', marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={15} color="#007AFF" strokeWidth={2.3} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 9.5, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.04em' }}>אספקה ללקוח</p>
                        <p style={{ margin: '1px 0 0', fontSize: 12, fontWeight: 700, color: '#1D1D1F' }}>{addr}</p>
                    </div>
                </div>

                {/* missing-info guard — don't forward Amal an incomplete order */}
                {(() => {
                    const miss = [];
                    if (!(order.shipTo?.address || order.address)) miss.push('כתובת אספקה');
                    if (!order.contactName && !order.institution) miss.push('שם לקוח/מוסד');
                    if (!order.phone && !order.email) miss.push('טלפון/מייל ליצירת קשר');
                    if (!(order.items || []).length) miss.push('פריטים');
                    if (!miss.length) return null;
                    return (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px', borderRadius: 12, background: '#fff', border: '1px solid rgba(255,149,0,0.28)', boxShadow: '0 4px 16px rgba(255,149,0,0.08)', marginBottom: 12 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,149,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={15} color="#FF9500" strokeWidth={2.3} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>חסר לפני העברה לספק: {miss.join(' · ')}</p>
                                <p style={{ margin: '3px 0 0', fontSize: 10.5, fontWeight: 600, color: '#86868B' }}>השלם/י בטאב "לקוח" כדי לא לשלוח לעמל הזמנה חלקית.</p>
                            </div>
                        </div>
                    );
                })()}

                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="הערות לספק (אספקה, דחיפות…)" dir="rtl"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 12.5, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

                {supplierId && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6E6E73' }}>
                        <input type="checkbox" checked={savePrices} onChange={e => setSavePrices(e.target.checked)} style={{ width: 16, height: 16 }} />
                        שמור מחירים למחירון הספק (מילוי אוטומטי בפעם הבאה)
                    </label>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                    <button disabled={busy || (!supplier)} onClick={() => onConfirm({ order, supplier, note, supplierCost, itemCosts, savePrices })}
                        style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', cursor: supplier && !busy ? 'pointer' : 'not-allowed', background: supplier && !busy ? 'linear-gradient(135deg,#FF9500,#FFB340)' : '#D1D1D6', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 14 }}>
                        {busy ? 'מעביר...' : <><Truck size={15} strokeWidth={2.3} /> העבר לספק וצור PO</>}
                    </button>
                    <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13 }}>ביטול</button>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}

/* ─── Email-intake modal (paste an order email → AI creates a review-state order) ─ */
function EmailIntakeModal({ busy, onClose, onCreate }) {
    const [subject, setSubject] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState(null); // { name, base64, mime }
    const [fileErr, setFileErr] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);

    const pickFile = (f) => {
        if (!f) return;
        setFileErr('');
        const mime = f.type || '';
        const ok = mime.startsWith('image/') || mime === 'application/pdf';
        if (!ok) { setFileErr('ניתן לצרף תמונה או PDF בלבד'); return; }
        if (f.size > 12 * 1024 * 1024) { setFileErr('הקובץ גדול מדי (עד 12MB)'); return; }
        const reader = new FileReader();
        reader.onload = e => setFile({ name: f.name, base64: String(e.target.result).split(',')[1], mime, raw: f });
        reader.readAsDataURL(f);
    };

    const canSubmit = !busy && (text.trim() || file);

    return createPortal(
        <div dir="rtl" onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                dir="rtl" style={{ width: 'min(560px, 95vw)', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 24, padding: 24, fontFamily: HE, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Mail size={24} color="#007AFF" strokeWidth={2.2} />
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F' }}>הזמנה ממייל</h2>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#86868B', fontWeight: 600 }}>הדבק/י את גוף המייל — ה-AI יחלץ לקוח, פריטים, כתובת ומחירים ויצור הזמנה לבדיקה.</p>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="נושא / שם השולח (רשות)" dir="rtl"
                    style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 13, fontWeight: 600, marginBottom: 10, boxSizing: 'border-box' }} />
                <textarea value={text} onChange={e => setText(e.target.value)} rows={7} placeholder="הדבק/י כאן את תוכן המייל…" dir="rtl"
                    style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontFamily: HE, fontSize: 12.5, lineHeight: 1.7, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />

                {/* Attach a document — scan/photo/PDF of an order. The AI reads it natively. */}
                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                    onChange={e => { pickFile(e.target.files[0]); e.target.value = ''; }} />
                {!file ? (
                    <button type="button" onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
                        onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                        onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: dragOver ? '18px 12px' : '11px 12px', borderRadius: 12, border: `1.5px dashed ${dragOver ? 'rgba(0,122,255,0.7)' : 'rgba(0,122,255,0.35)'}`, background: dragOver ? 'rgba(0,122,255,0.1)' : 'rgba(0,122,255,0.04)', color: '#007AFF', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5, marginBottom: 6, transition: 'all 0.15s ease', boxSizing: 'border-box' }}>
                        <Paperclip size={15} strokeWidth={2.3} /> {dragOver ? 'שחרר/י כאן להעלאה' : 'צרף/י או גרור/י מסמך (תמונה / PDF)'}
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', marginBottom: 6 }}>
                        <FileText size={16} color="#007AFF" strokeWidth={2.2} />
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} title="הסר קובץ"
                            style={{ display: 'flex', border: 'none', background: 'transparent', color: '#86868B', cursor: 'pointer', padding: 2 }}>
                            <X size={15} strokeWidth={2.4} />
                        </button>
                    </div>
                )}
                {fileErr && <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#FF3B30' }}>{fileErr}</p>}
                <div style={{ marginBottom: 16 }} />

                <div style={{ display: 'flex', gap: 10 }}>
                    <button disabled={!canSubmit} onClick={() => onCreate({ text: text.trim(), subject: subject.trim(), fileBase64: file?.base64, mimeType: file?.mime, fileName: file?.name, attachment: file?.raw })}
                        style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed', background: canSubmit ? 'linear-gradient(135deg,#007AFF,#5AC8FA)' : '#D1D1D6', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 14 }}>
                        {busy ? 'מחלץ…' : '✨ חלץ וצור הזמנה'}
                    </button>
                    <button onClick={onClose} style={{ padding: '13px 20px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13 }}>ביטול</button>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
}

/* ─── Insights (ops cockpit) — funnel · cycle time · on-time % · supplier scorecard ─ */
function InsightsView({ orders, supplierOrders }) {
    const m = useMemo(() => {
        const active = orders.filter(o => !CANCELLED.has(deriveStage(o)));
        // funnel — count per canonical stage; include any self-path stage that has orders
        const seenF = new Set();
        const funnel = [...STAGES_DROPSHIP, ...STAGES_SELF]
            .filter(s => s.id !== 'needs_review' && !seenF.has(s.id) && seenF.add(s.id))
            .map(s => ({ id: s.id, label: s.short, tone: s.tone, n: orders.filter(o => deriveStage(o) === s.id).length }))
            .filter(f => f.n > 0 || ['new', 'acked', 'sent_supplier', 'delivered'].includes(f.id));
        const maxN = Math.max(1, ...funnel.map(f => f.n));
        // Parse an Israeli d.m.y / d/m/y date string → ms (or NaN).
        const parseHeDate = (s) => {
            const mm = String(s || '').match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
            if (!mm) return NaN;
            let [, d, mo, y] = mm; y = y.length === 2 ? '20' + y : y;
            const t = new Date(Number(y), Number(mo) - 1, Number(d)).getTime();
            return isNaN(t) ? NaN : t;
        };
        // cycle time + on-time (delivered/completed orders)
        const done = orders.filter(o => ['delivered', 'completed'].includes(deriveStage(o)));
        const cycleDays = [];
        let onTime = 0, dated = 0;
        for (const o of done) {
            // only count cycle when the stage clock exists and differs from creation
            const start = o.dateTs, end = o.stageEnteredTs;
            if (start && end && end > start) cycleDays.push((end - start) / 86400000);
            const dd = parseHeDate(o.deliveryDate);
            if (!isNaN(dd)) { dated++; if ((o.stageEnteredTs || o.dateTs || 0) <= dd + 86400000) onTime++; }
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: HE }}>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                <MiniKpi label="זמן מחזור ממוצע" value={`${m.avgCycle.toFixed(1)} י׳`} color="#007AFF" sub="מקבלה עד אספקה" />
                <MiniKpi label="אספקה בזמן" value={m.onTimePct == null ? '—' : `${m.onTimePct}%`} color={m.onTimePct == null ? '#8E8E93' : m.onTimePct >= 80 ? '#34C759' : '#FF9500'} sub="מול תאריך יעד" />
                <MiniKpi label="שיעור השלמה" value={`${m.fillPct}%`} color="#5856D6" sub="הזמנות שסופקו" />
                <MiniKpi label="סופקו (סה״כ)" value={m.done} color="#34C759" sub="הזמנות שהושלמו" />
            </div>

            {/* funnel + supplier scorecard — side by side on wide screens */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16, alignItems: 'start' }}>
            {/* funnel */}
            <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,122,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={16} color="#007AFF" strokeWidth={2.3} /></span>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: '#1D1D1F' }}>משפך שלבים</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.funnel.map(f => {
                        const c = toneColor(f.tone);
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
            <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,149,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Truck size={16} color="#FF9500" strokeWidth={2.3} /></span>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: '#1D1D1F' }}>ביצועי ספקים</p>
                </div>
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
            </div>{/* /funnel+scorecard grid */}
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

/* ─── Email preview / edit / send modal (in-flow; human review = the gate) ────── */
function EmailPreviewModal({ order, html, subject, loading, sending, onClose, onSend, onSkip }) {
    const [editSubject, setEditSubject] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [noteOpen, setNoteOpen] = useState(false);
    useEffect(() => { if (subject) setEditSubject(subject); }, [subject]);
    const [editMode, setEditMode] = useState(false);
    const [draftHtml, setDraftHtml] = useState('');
    useEffect(() => { setDraftHtml(html || ''); }, [html]);
    const hasNote = customNote.trim().length > 0;
    const subjectChanged = editSubject !== subject;
    const htmlChanged = draftHtml !== html;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }} onClick={e => e.target === e.currentTarget && onClose()} dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ width: '100%', maxWidth: 660, background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', fontFamily: HE }}>
                {/* header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(135deg,#F0F7FF,#FAFCFF)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={15} color="#007AFF" strokeWidth={2.3} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>{editMode ? 'עריכת גוף המייל' : 'תצוגה מקדימה של המייל'}</span>
                            {(hasNote || subjectChanged || htmlChanged) && <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.1)', padding: '2px 8px', borderRadius: 99 }}>מותאם אישית</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => setEditMode(v => !v)} disabled={loading}
                                style={{ border: '1.5px solid rgba(0,122,255,0.25)', background: editMode ? '#007AFF' : 'rgba(0,122,255,0.08)', color: editMode ? '#fff' : '#007AFF', borderRadius: 99, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 800, fontFamily: HE }}>
                                {editMode ? 'תצוגה מקדימה' : 'ערוך גוף מלא'}
                            </button>
                            <button onClick={onClose} style={{ border: 'none', background: 'rgba(0,0,0,0.07)', borderRadius: 99, width: 28, height: 28, fontSize: 13, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#86868B', whiteSpace: 'nowrap' }}>נושא:</span>
                        <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                            style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#007AFF', background: 'transparent', border: 'none', outline: 'none', fontFamily: HE, direction: 'rtl' }} />
                    </div>
                    {order?.email && <p style={{ fontSize: 10, color: '#AEAEB2', margin: '2px 0 0', fontWeight: 600 }}>אל: {order.email}</p>}
                </div>
                {/* preview */}
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340, flexDirection: 'column', gap: 14, background: '#F5F5F7' }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #007AFF', borderTopColor: 'transparent' }} />
                            <p style={{ fontSize: 12, color: '#86868B', fontWeight: 600, margin: 0 }}>טוען תצוגה מקדימה...</p>
                        </div>
                    ) : editMode ? (
                        <textarea value={draftHtml} onChange={e => setDraftHtml(e.target.value)} dir="ltr" spellCheck={false}
                            style={{ width: '100%', height: 420, border: 'none', padding: 14, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, lineHeight: 1.6, color: '#1D1D1F', background: '#FBFBFD', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    ) : (
                        <iframe srcDoc={draftHtml} style={{ width: '100%', height: 420, border: 'none', display: 'block', background: '#F5F5F7' }} sandbox="allow-same-origin" title="Email preview" />
                    )}
                </div>
                {/* personal note */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: noteOpen ? '#FFFBF0' : '#FAFAFA' }}>
                    <button onClick={() => setNoteOpen(v => !v)} style={{ width: '100%', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: HE, textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: hasNote ? '#FF9500' : '#86868B' }}>✏️ הוסף הערה אישית ללקוח</span>
                        {hasNote && <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.12)', padding: '1px 7px', borderRadius: 99 }}>נוסף</span>}
                        <span style={{ marginInlineStart: 'auto', fontSize: 11, color: '#AEAEB2', transform: noteOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                    </button>
                    {noteOpen && (
                        <div style={{ padding: '0 18px 14px' }}>
                            <textarea value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="כתבו כאן הערה שתופיע במייל בתיבה מודגשת, לפני החתימה..."
                                style={{ width: '100%', minHeight: 76, border: '1.5px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontFamily: HE, direction: 'rtl', background: '#fff', color: '#1D1D1F', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
                        </div>
                    )}
                </div>
                {/* actions */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', background: '#fff', flexWrap: 'wrap' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, fontWeight: 800, color: '#1D1D1F', cursor: 'pointer', fontFamily: HE }}>ביטול</button>
                    {onSkip && <button onClick={onSkip} disabled={sending} style={{ padding: '9px 16px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 12.5, fontWeight: 800, color: '#86868B', cursor: 'pointer', fontFamily: HE }}>עדכן שלב בלי מייל</button>}
                    <motion.button whileTap={{ scale: 0.97 }} disabled={loading || sending}
                        onClick={() => onSend(hasNote ? customNote : null, subjectChanged ? editSubject : null, htmlChanged ? draftHtml : null)}
                        style={{ padding: '9px 24px', borderRadius: 12, border: 'none', background: loading || sending ? '#AEAEB2' : 'linear-gradient(135deg,#007AFF,#5AC8FA)', fontSize: 13, fontWeight: 800, color: '#fff', cursor: loading || sending ? 'not-allowed' : 'pointer', fontFamily: HE, boxShadow: loading || sending ? 'none' : '0 4px 14px rgba(0,122,255,0.35)' }}>
                        {sending ? 'שולח...' : hasNote ? 'שלח עם הערה' : 'שלח מייל'}
                    </motion.button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

/* ─── Command palette (Cmd+K) — search orders + quick actions ─────────────────── */
function CommandPalette({ orders, actions, onOpenOrder, onClose }) {
    const [q, setQ] = useState('');
    const ql = q.trim();
    const acts = ql ? actions.filter(a => a.label.includes(ql)) : actions;
    const hits = ql ? orders.filter(o => [orderTitle(o), o.institution, o.orderNumber, o.phone, o.email].some(v => (v || '').toString().includes(ql))).slice(0, 8) : [];
    return createPortal(
        <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh' }} dir="rtl">
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                style={{ width: 'min(560px, 94vw)', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', fontFamily: HE }}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש הזמנה / מוסד / פקודה…" dir="rtl"
                    style={{ width: '100%', padding: '16px 18px', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', fontSize: 15, fontWeight: 600, fontFamily: HE, outline: 'none', boxSizing: 'border-box', color: '#1D1D1F' }} />
                <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: 8 }}>
                    {acts.length > 0 && <p style={{ margin: '6px 10px', fontSize: 10, fontWeight: 800, color: '#AEAEB2' }}>פעולות</p>}
                    {acts.map((a, i) => (
                        <button key={i} onClick={a.run} style={{ width: '100%', textAlign: 'right', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 10, cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13.5, color: '#1D1D1F' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{a.label}</button>
                    ))}
                    {hits.length > 0 && <p style={{ margin: '10px 10px 4px', fontSize: 10, fontWeight: 800, color: '#AEAEB2' }}>הזמנות</p>}
                    {hits.map(o => (
                        <button key={o.id} onClick={() => onOpenOrder(o.id)} style={{ width: '100%', textAlign: 'right', padding: '10px 12px', border: 'none', background: 'transparent', borderRadius: 10, cursor: 'pointer', fontFamily: HE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#1D1D1F' }}>{orderTitle(o)}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#007AFF' }}>₪{orderTotal(o).toLocaleString()}</span>
                        </button>
                    ))}
                    {ql && !acts.length && !hits.length && <p style={{ padding: 20, textAlign: 'center', color: '#AEAEB2', fontSize: 12.5 }}>אין תוצאות</p>}
                </div>
                <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: 10.5, color: '#AEAEB2', fontWeight: 600 }}>⌘K / Ctrl+K לפתיחה · Esc לסגירה</div>
            </motion.div>
        </div>,
        document.body
    );
}

/* ─── "My Work" — the next-action center (do the next thing, ranked by urgency) ── */
function WorkView({ orders, onOpen, onAction, busy }) {
    const open = orders.filter(o => { const s = deriveStage(o); return !CANCELLED.has(s) && s !== 'completed'; });
    const rank = (o) => { const l = riskAssess(o).level; return l === 'high' ? 2 : l === 'med' ? 1 : 0; };
    const ranked = [...open].sort((a, b) => (rank(b) - rank(a)) || (daysInStage(b) - daysInStage(a)));
    if (!ranked.length) return (
        <div style={{ ...glass, borderRadius: 20, padding: 48, textAlign: 'center', fontFamily: HE }}>
            <CheckCircle2 size={32} color="#34C759" strokeWidth={2.2} />
            <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: '8px 0 0' }}>אין משימות פתוחות — הכל מטופל!</p>
        </div>
    );
    return (
        <div style={{ ...glass, borderRadius: 18, overflow: 'hidden', fontFamily: HE }}>
            {ranked.map((o, i) => {
                const na = nextAction(o); const meta = stageMeta(deriveStage(o));
                return (
                    <div key={o.id} onClick={() => onOpen(o.id)}
                        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto auto', gap: 12, alignItems: 'center', padding: '13px 16px', cursor: 'pointer', borderTop: i ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderTitle(o)}</p>
                                <RiskBadge order={o} />
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.institution || ''} · {orderItemsSummary(o)}</p>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: toneColor(meta.tone) }}>{meta.label} · {daysInStage(o)} י׳</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: '#007AFF', whiteSpace: 'nowrap' }}>₪{orderTotal(o).toLocaleString()}</span>
                        {na ? (
                            <button disabled={busy} onClick={e => { e.stopPropagation(); onAction(na, o); }}
                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap' }}>{na.label} ←</button>
                        ) : <span style={{ width: 60 }} />}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Institution 360 — every order/quote for one institution, at a glance ────── */
function Institution360({ name, orders, onClose, onOpen }) {
    const nm = (name || '').trim();
    const list = orders.filter(o => (o.institution || '').trim() === nm || (o.contactName || '').trim() === nm)
        .sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
    const total = list.reduce((s, o) => s + orderTotal(o), 0);
    // debt = billable (delivered/completed) orders not fully paid, net of amounts paid
    const unpaid = list.filter(o => ['delivered', 'completed'].includes(deriveStage(o)) && o.paymentStatus !== 'paid')
        .reduce((s, o) => s + Math.max(0, orderTotal(o) - (Number(o.amountPaid) || 0)), 0);
    return createPortal(
        <div onClick={e => e.target === e.currentTarget && onClose()} dir="rtl" style={{ position: 'fixed', inset: 0, zIndex: 3500, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                style={{ width: 'min(600px,95vw)', maxHeight: '88vh', overflowY: 'auto', background: '#fff', borderRadius: 22, padding: 22, fontFamily: HE, boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={19} color="#007AFF" strokeWidth={2.3} /> {nm || 'מוסד'}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#86868B' }}>{list.length} הזמנות · שווי כולל ₪{total.toLocaleString()}{unpaid > 0 ? ` · חוב פתוח ₪${unpaid.toLocaleString()}` : ''}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 16, color: '#6E6E73' }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {list.map(o => (
                        <button key={o.id} onClick={() => onOpen(o.id)} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center', padding: '11px 13px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: '#fff', cursor: 'pointer', fontFamily: HE, textAlign: 'right' }}>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderItemsSummary(o)}</p>
                                <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#AEAEB2' }}>{o.date || ''} {o.orderNumber ? `· #${o.orderNumber}` : ''}</p>
                            </div>
                            <OrderStageChip order={o} size="sm" />
                            <span style={{ fontSize: 12.5, fontWeight: 900, color: '#007AFF' }}>₪{orderTotal(o).toLocaleString()}</span>
                        </button>
                    ))}
                    {!list.length && <p style={{ padding: 20, textAlign: 'center', color: '#AEAEB2', fontSize: 12.5 }}>אין הזמנות</p>}
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

/* ─── Inline record panel (Service-Console split view) ───────────────────────── */
function InlineRecord({ order, activity, busy, onAction, onJump, onForward, onFull }) {
    const axes = deriveAxes(order);
    return (
        <div style={{ ...glass, borderRadius: 20, padding: 20, fontFamily: HE }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1D1D1F' }}>{orderTitle(order)}</h2>
                    <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 600, color: '#86868B' }}>{order.institution || ''} {order.orderNumber ? `· #${order.orderNumber}` : ''}</p>
                </div>
                <button onClick={onFull} style={{ padding: '6px 12px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 11.5 }}>פתח מלא ↗</button>
            </div>
            <div style={{ marginBottom: 14 }}>
                <Highlights fields={[
                    { label: 'סה״כ', value: `₪${orderTotal(order).toLocaleString()}`, color: '#007AFF' },
                    { label: 'לקוח', value: axes.customer === 'done' ? 'סופק' : axes.customer === 'acked' ? 'אושר' : 'התקבל' },
                    { label: 'ספק', value: { none: '—', sent: 'הועבר', confirmed: 'אישר', delivered: 'סיפק', self: 'עצמי' }[axes.supplier] },
                    { label: 'ימים בשלב', value: daysInStage(order) },
                ]} />
            </div>
            <PathStepper order={order} busy={busy} onAction={onAction} onAdvance={(to) => onJump(order.id, to)} />
            {!(order.supplierName || order.supplierOrderId) && !isSideState(deriveStage(order)) && (
                <button onClick={onForward} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#FF9500,#FFB340)', color: '#fff', cursor: 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 12.5 }}><Truck size={15} strokeWidth={2.3} /> העבר לספק</button>
            )}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#AEAEB2' }}>ציר זמן</p>
                <div style={{ maxHeight: 260, overflowY: 'auto' }}><ActivityTimeline items={activity} /></div>
            </div>
        </div>
    );
}
