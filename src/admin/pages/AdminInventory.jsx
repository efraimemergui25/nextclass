/* eslint-disable */

import { useState, useMemo, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, Box, X, Check, Trash2, LayoutGrid, List, Package, Boxes, ChevronLeft, TrendingDown, Plus, Truck, RefreshCw, DollarSign, TrendingUp } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminSectionHeader, AdminSearchBar, AdminFilterPills, AdminButton, AdminKPICard, AdminEmpty, AdminTabs, InfoTooltip, AdminInput } from '../components/AdminComponents';
import { hexA, DOMAIN_ACCENTS, RADIUS, SHADOW, SPRING, GLASS, toneColor } from '../theme/tokens';
import DashDrillView from '../components/DashDrillView';
import initialProducts from '../../data/products';
import { computeMargins, marginColor, fmtILS, fmtPct } from '../lib/productFinance';

// Unified brand accent (azure) — DOMAIN_ACCENTS.inventory resolves to #007AFF
const ORANGE = DOMAIN_ACCENTS.inventory;

// Liquid-glass card surface (token-driven). Only the glass background + blur are
// applied inline so Tailwind border/hover states on each card stay intact.
const GLASS_SURFACE = {
    background: GLASS.base.background,
    backdropFilter: GLASS.base.backdropFilter,
    WebkitBackdropFilter: GLASS.base.WebkitBackdropFilter,
};

// ─── Smart Reorder Modal ──────────────────────────────────────────────────────
function SmartReorderModal({ open, product, onClose, suppliers }) {
    const recQty = product ? Math.max((product.threshold || 5) * 3, 10) : 0;
    const supplierName = suppliers?.[0]?.name || 'הספק';
    const waText = product ? encodeURIComponent(
        `שלום ${supplierName},\nאנו מעוניינים לחדש מלאי:\nמוצר: ${product.title}\nכמות: ${recQty} יחידות\nסטטוס מלאי נוכחי: ${product.stock || 0}\nנשמח לקבל אישור זמינות ומחיר.`
    ) : '';
    const emailSubject = product ? encodeURIComponent(`הזמנת מלאי — ${product.title}`) : '';
    const emailBody    = product ? encodeURIComponent(
        `שלום ${supplierName},\n\nאנו מעוניינים לחדש מלאי:\nמוצר: ${product.title}\nכמות מבוקשת: ${recQty} יחידות\n\nנשמח לקבל אישור זמינות ומחיר עדכני.\n\nבברכה,\nצוות NextClass`
    ) : '';

    return createPortal(
        <AnimatePresence>
        {open && product && (
        <motion.div
            key="reorder-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: 'min(460px, 100%)', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)', borderRadius: 24, padding: 28, direction: 'rtl',
                    fontFamily: 'Heebo, sans-serif', boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
                    border: '1px solid rgba(255,255,255,0.8)',
                }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>הזמנה חכמה</h3>
                        <p style={{ fontSize: 11, color: '#86868B', margin: '3px 0 0', fontWeight: 500 }}>{product.title}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 99, background: 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                        { label: 'מלאי נוכחי', value: product.stock || 0, color: (product.stock || 0) === 0 ? toneColor('danger') : toneColor('warning') },
                        { label: 'סף ההתרעה', value: product.threshold || 5, color: toneColor('info') },
                        { label: 'כמות מוצעת', value: recQty, color: toneColor('success') },
                    ].map(s => (
                        <div key={s.label} style={{ borderRadius: 12, padding: '10px 12px', background: `${s.color}09`, border: `1px solid ${s.color}20`, textAlign: 'right' }}>
                            <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#86868B', margin: '4px 0 0' }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: 11, color: '#6E6E73', marginBottom: 14, fontWeight: 500, lineHeight: 1.6 }}>
                    פנה לספק שלך בלחיצה אחת עם כל הפרטים מוכנים:
                </p>

                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 18px', borderRadius: 14, background: '#25D366', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: 13, fontFamily: 'Heebo, sans-serif' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        שלח ב-WhatsApp
                    </a>
                    <a href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 18px', borderRadius: 14, background: 'rgba(0,122,255,0.1)', color: '#007AFF', textDecoration: 'none', fontWeight: 800, fontSize: 13, fontFamily: 'Heebo, sans-serif', border: '1px solid rgba(0,122,255,0.2)' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
                        שלח באימייל
                    </a>
                </div>
            </motion.div>
        </motion.div>
        )}
        </AnimatePresence>,
        document.body
    );
}

const FILTERS = ['הכל', 'במלאי', 'נמוך', 'אזל'];
// Preferred category ordering for the grouped inventory view
const CATEGORY_ORDER = ['מסכי מחשב', 'מוצרים משלימים'];
const NO_CAT = 'ללא קטגוריה';
const catRank = (c) => { const i = CATEGORY_ORDER.indexOf(c || ''); return i === -1 ? 900 : i; };

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Babushka drill primitives (shared grammar with dashboard/vault) ──────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-[14px] p-3 text-center"
                    style={{ background: hexA(s.color || ORANGE, 0.07), border: `1px solid ${hexA(s.color || ORANGE, 0.16)}` }}>
                    <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ color: s.color || '#1D1D1F' }}>{s.value}</p>
                    <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                </motion.div>
            ))}
        </div>
    );
}
function DrillRow({ onClick, leading, title, subtitle, trailing, tone = ORANGE, delay = 0 }) {
    return (
        <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick} tabIndex={onClick ? 0 : undefined} role={onClick ? 'button' : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={onClick ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${onClick ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {onClick && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}
const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

export default function AdminInventory() {
    const { inventory, orders, updateStock, updateProductDetails, deleteProduct, addProduct, fx, syncFxRate, setFxRate } = useAdminData();
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('הכל');
    const [bulkMode, setBulkMode] = useState(false);
    const [draftStock, setDraftStock] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [creating, setCreating]               = useState(false);
    const [reorderProduct, setReorderProduct]   = useState(null);
    const [tab, setTab] = useState('all');

    // ── Babushka drill stack (KPI → product list → product detail) ──
    const [drillStack, setDrillStack] = useState([]);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);

    useEffect(() => {
        const query = searchParams.get('search');
        if (query) setSearch(query);
    }, [searchParams]);

    useEffect(() => {
        const openParam = searchParams.get('open');
        if (!openParam || !inventory.length) return;
        const decoded = decodeURIComponent(openParam).toLowerCase();
        const match = inventory.find(p =>
            p.title?.toLowerCase() === decoded || String(p.id) === openParam
        );
        if (match) setSelectedProduct(match);
    }, [searchParams, inventory]);

    const enterBulkMode = () => {
        const draft = {};
        inventory.forEach(p => { draft[p.id] = String(p.stock ?? 0); });
        setDraftStock(draft);
        setBulkMode(true);
    };

    const [bulkSaving, setBulkSaving] = useState(false);

    const saveBulkMode = async () => {
        setBulkSaving(true);
        const updates = Object.entries(draftStock)
            .map(([id, val]) => ({ id, newVal: Math.max(0, Number(val) || 0), product: inventory.find(p => String(p.id) === String(id)) }))
            .filter(({ product, newVal }) => product && newVal !== product.stock);

        const results = await Promise.all(updates.map(({ id, newVal }) => updateStock(id, newVal)));
        const failed  = results.filter(r => r === false).length;

        setBulkSaving(false);
        setBulkMode(false);

        if (failed === 0) {
            showToast(`${updates.length} מוצרים עודכנו בהצלחה`, 'success');
        } else {
            showToast(`עודכנו ${updates.length - failed} מוצרים — ${failed} נכשלו`, 'error');
        }
    };

    const handleQuickStock = (e, product, delta) => {
        e.stopPropagation();
        if (bulkMode) {
            const cur = Number(draftStock[product.id] ?? product.stock ?? 0);
            setDraftStock(prev => ({ ...prev, [product.id]: String(Math.max(0, cur + delta)) }));
        } else {
            const newStock = Math.max(0, (product.stock || 0) + delta);
            updateStock(product.id, newStock);
        }
    };

    const handleSaveProduct = async (updates) => {
        if (!selectedProduct) return;
        await updateProductDetails(selectedProduct.id, updates);
        setSelectedProduct(null);
        showToast('פרטי המוצר עודכנו בהצלחה', 'success');
    };

    const handleCreateProduct = async (fields) => {
        if (!fields.title?.trim()) return;
        await addProduct({
            title: fields.title.trim(),
            price: Number(fields.price) || 0,
            category: fields.category || '',
            isFeatured: fields.isFeatured || false,
            image: fields.image || '',
            stock: Number(fields.stock) || 0,
            threshold: Number(fields.threshold) || 5,
            supplierStocked: fields.supplierStocked || false,
            supplierInStock: fields.supplierInStock || false,
            showSupplierQty: fields.showSupplierQty || false,
            supplierStock: Number(fields.supplierStock) || 0,
            lowStockMuted: fields.lowStockMuted || false,
            supplierCost: Number(fields.supplierCost) || 0,
            supplierCostUSD: Number(fields.supplierCostUSD) || 0,
            costCurrency: fields.costCurrency || 'ILS',
            isActive: true,
        });
        setCreating(false);
        showToast('מוצר חדש נוסף בהצלחה', 'success');
    };

    // Blank product used to open ProductModal in create mode
    const BLANK_PRODUCT = { id: '', title: '', price: 0, category: '', isFeatured: false, image: '', stock: 0, threshold: 5 };

    // ── Sales velocity: units sold per day per product (last 30 days) ────────
    const salesVelocity = useMemo(() => {
        const cutoff = Date.now() - 30 * 86400000;
        const vel = {};
        orders.filter(o => (o.dateTs || 0) >= cutoff).forEach(o => {
            (o.items || []).forEach(item => {
                const id = String(item.id ?? item.catalogNumber ?? '');
                if (!id) return;
                vel[id] = (vel[id] || 0) + (item.qty || 1);
            });
        });
        return vel; // units per 30 days per product id
    }, [orders]);

    const daysToStockout = p => {
        const avail = Math.max(0, (p.stock || 0) - (p.reserved || 0));
        const vel30 = salesVelocity[String(p.id)] || 0;
        if (vel30 === 0) return null;
        return Math.floor(avail / (vel30 / 30));
    };

    const available = p => Math.max(0, (p.stock || 0) - (p.reserved || 0));
    // A product held at the supplier AND in stock there is always serviceable,
    // so it never counts as low/out. lowStockMuted silences only the "low" flag.
    const supplierCovered = p => !!(p.supplierStocked && p.supplierInStock);
    const statusKey = (p) => {
        const a = available(p);
        if (a === 0) return supplierCovered(p) ? 'supplier' : 'out';
        if (a <= (p.threshold ?? 5) && !p.lowStockMuted && !supplierCovered(p)) return 'low';
        return 'ok';
    };
    const STATUS_STYLE = {
        out:      { color: toneColor('danger'),  label: 'אזל' },
        low:      { color: toneColor('warning'), label: 'נמוך' },
        ok:       { color: toneColor('success'), label: 'תקין' },
        supplier: { color: toneColor('info'),    label: 'אצל הספק' },
    };
    const lowCount  = inventory.filter(p => statusKey(p) === 'low').length;
    const outCount  = inventory.filter(p => statusKey(p) === 'out').length;
    const okCount   = inventory.filter(p => ['ok', 'supplier'].includes(statusKey(p))).length;

    // Below-threshold items still needing a real reorder (excludes muted + supplier-covered)
    const belowThreshold = useMemo(
        () => inventory.filter(p => ['low', 'out'].includes(statusKey(p))).sort((a, b) => available(a) - available(b)),
        [inventory]
    );

    const filtered = useMemo(() => {
        let list = [...inventory];
        if (filter === 'נמוך') list = list.filter(p => statusKey(p) === 'low');
        if (filter === 'אזל') list = list.filter(p => statusKey(p) === 'out');
        if (filter === 'במלאי') list = list.filter(p => ['ok', 'supplier'].includes(statusKey(p)));
        if (search) list = list.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            (p.category || '').includes(search)
        );
        // Group by category (preferred order), then by stock within a category
        return list.sort((a, b) => {
            const ra = catRank(a.category), rb = catRank(b.category);
            if (ra !== rb) return ra - rb;
            const ca = a.category || NO_CAT, cb = b.category || NO_CAT;
            if (ca !== cb) return ca.localeCompare(cb, 'he');
            return a.stock - b.stock;
        });
    }, [inventory, search, filter]);

    // Count per category (for the group header chips)
    const catCounts = useMemo(() => {
        const m = {};
        filtered.forEach(p => { const c = p.category || NO_CAT; m[c] = (m[c] || 0) + 1; });
        return m;
    }, [filtered]);

    const stockMeta = (p) => {
        const key = statusKey(p);
        return { avail: available(p), key, ...STATUS_STYLE[key] };
    };

    return (
        <div dir="rtl" className="space-y-5">
            {/* ── Header ── */}
            <AdminSectionHeader
                title="ניהול מלאי"
                subtitle={`${inventory.length} מוצרים`}
                action={tab === 'all' ? (
                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex items-center rounded-xl overflow-hidden border border-black/08" style={{ background: 'rgba(0,0,0,0.03)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className="px-3 py-2 transition-all"
                                style={{ background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? ORANGE : '#AEAEB2', boxShadow: viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                            ><LayoutGrid size={15} /></button>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-3 py-2 transition-all"
                                style={{ background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? ORANGE : '#AEAEB2', boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
                            ><List size={15} /></button>
                        </div>

                        {bulkMode ? (
                            <div className="flex gap-2">
                                <AdminButton variant="ghost" onClick={() => setBulkMode(false)}>ביטול</AdminButton>
                                <AdminButton accent={ORANGE} onClick={saveBulkMode} disabled={bulkSaving} loading={bulkSaving}>{bulkSaving ? 'שומר...' : 'שמור הכל'}</AdminButton>
                            </div>
                        ) : (
                            <>
                                <AdminButton variant="outline" onClick={enterBulkMode}>עריכה מהירה</AdminButton>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setCreating(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-white font-black text-[13px]"
                                    style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', fontFamily: 'Heebo, sans-serif', boxShadow: '0 6px 18px rgba(0,122,255,0.32)' }}
                                >
                                    <Plus size={15} strokeWidth={2.8} />
                                    מוצר חדש
                                </motion.button>
                            </>
                        )}
                    </div>
                ) : undefined}
            />

            {/* ── KPI band ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'סה״כ מוצרים', value: inventory.length, color: ORANGE, Icon: Boxes, sub: `${filtered.length} בתצוגה`, tooltip: 'כל המוצרים בקטלוג המלאי.', scope: 'all' },
                    { label: 'מלאי תקין', value: okCount, color: toneColor('success'), Icon: CheckCircle2, sub: 'מעל סף ההתרעה', tooltip: 'מוצרים שמלאיהם מעל סף ההתרעה.', scope: 'ok' },
                    { label: 'מלאי נמוך', value: lowCount, color: toneColor('warning'), Icon: AlertTriangle, sub: 'כדאי לחדש', tooltip: 'מוצרים שהמלאי הגיע לסף ההתרעה — כדאי לחדש.', scope: 'low' },
                    { label: 'אזל מהמלאי', value: outCount, color: toneColor('danger'), Icon: XCircle, sub: 'לא ניתן להזמין', tooltip: 'מוצרים עם 0 יחידות — לא ניתן להזמין.', scope: 'out' },
                ].map(({ label, value, color, Icon, sub, tooltip, scope }, i) => (
                    <AdminKPICard key={label} title={label} value={value} subtitle={sub} tooltip={tooltip}
                        icon={<Icon size={20} color={color} />} accent={color} delay={i * 0.05}
                        onClick={value ? () => openDrill({ type: 'products', scope }) : undefined} />
                ))}
            </div>

            {/* ── In-page sectors ── */}
            <AdminTabs
                tabs={[
                    { id: 'all', label: 'כל המלאי', count: inventory.length },
                    { id: 'reorder', label: 'להזמנה מספק', count: lowCount + outCount },
                ]}
                active={tab} onChange={setTab} id="inventory-tabs"
            />

            {tab === 'all' && (<>
            {/* ── Search + Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש מוצר..." />
                </div>
                <AdminFilterPills options={FILTERS} active={filter} onChange={setFilter} />
            </div>

            {/* ── Grid View ── */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                    <motion.div key="grid"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    >
                        {filtered.length === 0 && (
                            <div className="col-span-full">
                                <AdminEmpty icon={<Box size={30} style={{ color: ORANGE }} />}
                                    title="אין מוצרים תואמים לחיפוש"
                                    subtitle="נסה לשנות את המסננים או מונח החיפוש" />
                            </div>
                        )}
                        <AnimatePresence>
                            {filtered.map((product, i) => {
                                const { avail, color, label } = stockMeta(product);
                                const stockVal = bulkMode ? (draftStock[product.id] ?? product.stock) : avail;
                                const cat = product.category || NO_CAT;
                                const showHeader = i === 0 || (filtered[i - 1].category || NO_CAT) !== cat;
                                return (
                                    <Fragment key={product.id}>
                                    {showHeader && (
                                        <div className="col-span-full flex items-center gap-2.5 mt-1 first:mt-0" dir="rtl">
                                            <h3 className="text-[14px] font-black text-[#1D1D1F]">{cat}</h3>
                                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: hexA(ORANGE, 0.10), color: ORANGE }}>{catCounts[cat]}</span>
                                            <div className="flex-1 h-px bg-black/[0.07]" />
                                        </div>
                                    )}
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                                        onClick={() => setSelectedProduct(product)}
                                        style={GLASS_SURFACE}
                                        className="relative rounded-[22px] overflow-hidden border border-black/05 hover:border-[#007AFF]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-pointer group"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
                                            {product.image
                                                ? <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    onError={(e) => {
                                                        if (!e.target.dataset.tried1) {
                                                            e.target.dataset.tried1 = 'true';
                                                            const orig = initialProducts.find(ip => String(ip.id) === String(product.id));
                                                            if (orig?.image) { e.target.src = orig.image; return; }
                                                        }
                                                        e.target.onerror = null;
                                                        e.target.src = IMG_FALLBACK;
                                                    }}
                                                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                                                  />
                                                : <div className="w-full h-full flex items-center justify-center"><Box size={28} className="text-[#AEAEB2] opacity-30" /></div>
                                            }
                                            {/* Status dot */}
                                            <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ background: color }} />
                                            {/* Category badge */}
                                            {product.category && (
                                                <div className="absolute top-2.5 right-2.5">
                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                                                        {product.category}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Delete on hover */}
                                            <button
                                                onClick={async e => {
                                                    e.stopPropagation();
                                                    if (await confirm({ message: `למחוק את "${product.title}" לצמיתות?`, danger: true })) {
                                                        deleteProduct(product.id);
                                                        showToast('המוצר נמחק', 'warning');
                                                    }
                                                }}
                                                className="absolute bottom-2.5 left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                style={{ background: hexA(toneColor('danger'), 0.82), backdropFilter: 'blur(8px)' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-3.5">
                                            <p className="font-black text-[#1D1D1F] text-[12px] leading-snug truncate text-right group-hover:text-[#007AFF] transition-colors">
                                                {product.title}
                                            </p>

                                            {/* Days-to-Stockout chip */}
                                            {(() => {
                                                const days = daysToStockout(product);
                                                if (days === null) return null;
                                                const chipColor = days <= 7 ? toneColor('danger') : days <= 30 ? toneColor('warning') : toneColor('success');
                                                return (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                            style={{ background: `${chipColor}14`, color: chipColor, border: `1px solid ${chipColor}25` }}>
                                                            {days <= 0 ? 'נגמר בקרוב' : `יגמר בעוד ${days} ימים`}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Supplier fulfilment chips */}
                                            {(product.supplierStocked || product.showSupplierQty) && (
                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                    {product.supplierStocked && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5"
                                                            style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.22)' }}
                                                            title={product.supplierInStock ? 'מוחזק אצל הספק — במלאי' : 'מוחזק אצל הספק'}>
                                                            <Truck size={8} />{product.supplierInStock ? 'אצל הספק ✓' : 'אצל הספק'}
                                                        </span>
                                                    )}
                                                    {product.showSupplierQty && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }}>
                                                            ספק: {product.supplierStock ?? 0}
                                                        </span>
                                                    )}
                                                    {product.lowStockMuted && (
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                            style={{ background: 'rgba(0,0,0,0.05)', color: '#AEAEB2' }} title="התרעת מלאי נמוך כבויה">
                                                            🔕
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stepper row */}
                                            <div className="flex items-center justify-between mt-3" onClick={e => e.stopPropagation()}>
                                                {bulkMode ? (
                                                    <input
                                                        type="number"
                                                        value={draftStock[product.id] ?? product.stock}
                                                        onChange={e => setDraftStock(prev => ({ ...prev, [product.id]: e.target.value }))}
                                                        className="w-20 text-center text-[20px] font-black rounded-xl px-2 py-1.5 outline-none transition-all"
                                                        style={{ border: `2px solid ${color}40`, background: `${color}06`, color }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={e => handleQuickStock(e, product, -1)}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[16px] leading-none transition-all"
                                                            style={{ background: 'rgba(0,0,0,0.04)', color: '#86868B' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = hexA(toneColor('danger'), 0.12); e.currentTarget.style.color = toneColor('danger'); }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#86868B'; }}
                                                        >−</button>
                                                        <span className="text-[22px] font-black w-9 text-center leading-none" style={{ color }}>
                                                            {avail}
                                                        </span>
                                                        <button
                                                            onClick={e => handleQuickStock(e, product, +1)}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[16px] leading-none transition-all"
                                                            style={{ background: 'rgba(0,0,0,0.04)', color: '#86868B' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = hexA(toneColor('success'), 0.12); e.currentTarget.style.color = toneColor('success'); }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#86868B'; }}
                                                        >+</button>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: `${color}15`, color }}>
                                                        {label}
                                                    </span>
                                                    {/* Smart Reorder button for low/out stock */}
                                                    {(label === 'נמוך' || label === 'אזל') && !bulkMode && (
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={e => { e.stopPropagation(); setReorderProduct(product); }}
                                                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black transition-all"
                                                            style={{ background: hexA(ORANGE, 0.12), color: ORANGE, border: `1px solid ${hexA(ORANGE, 0.25)}` }}
                                                            title="הזמן מספק"
                                                        >
                                                            <Package size={8} />הזמן
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                    </Fragment>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* ── List View ── */
                    <motion.div key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-2"
                    >
                        {filtered.length === 0 && (
                            <AdminEmpty icon={<Box size={30} style={{ color: ORANGE }} />}
                                title="אין מוצרים תואמים לחיפוש"
                                subtitle="נסה לשנות את המסננים או מונח החיפוש" />
                        )}
                        <AnimatePresence>
                            {filtered.map((product, i) => {
                                const { avail, color, label } = stockMeta(product);
                                const cat = product.category || NO_CAT;
                                const showHeader = i === 0 || (filtered[i - 1].category || NO_CAT) !== cat;
                                return (
                                    <Fragment key={product.id}>
                                    {showHeader && (
                                        <div className="flex items-center gap-2.5 px-1 pt-2 pb-0.5 first:pt-0" dir="rtl">
                                            <h3 className="text-[13px] font-black text-[#1D1D1F]">{cat}</h3>
                                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full" style={{ background: hexA(ORANGE, 0.10), color: ORANGE }}>{catCounts[cat]}</span>
                                            <div className="flex-1 h-px bg-black/[0.07]" />
                                        </div>
                                    )}
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ delay: i * 0.015, type: 'spring', stiffness: 320, damping: 28 }}
                                        onClick={() => setSelectedProduct(product)}
                                        style={GLASS_SURFACE}
                                        className="flex items-center gap-4 px-5 py-3.5 rounded-[18px] border border-black/05 hover:border-[#007AFF]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group"
                                    >
                                        {/* Thumb */}
                                        <div className="w-11 h-11 rounded-[13px] overflow-hidden bg-[#F5F5F7] shrink-0">
                                            {product.image
                                                ? <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                                : <div className="w-full h-full flex items-center justify-center opacity-30"><Box size={16} className="text-[#86868B]" /></div>
                                            }
                                        </div>

                                        {/* Name + category */}
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="font-bold text-[#1D1D1F] text-[13px] truncate group-hover:text-[#007AFF] transition-colors">{product.title}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-wrap">
                                                {product.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-[#007AFF]/10 text-[#007AFF]">נבחרת</span>}
                                                {product.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: hexA(ORANGE, 0.1), color: ORANGE }}>{product.category}</span>}
                                                {product.supplierStocked && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black inline-flex items-center gap-0.5" style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }} title={product.supplierInStock ? 'מוחזק אצל הספק — במלאי' : 'מוחזק אצל הספק'}><Truck size={8} />{product.supplierInStock ? 'אצל הספק ✓' : 'אצל הספק'}</span>}
                                                {product.showSupplierQty && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }}>ספק: {product.supplierStock ?? 0}</span>}
                                                {product.lowStockMuted && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: 'rgba(0,0,0,0.05)', color: '#AEAEB2' }} title="התרעת מלאי נמוך כבויה">🔕</span>}
                                            </div>
                                        </div>

                                        {/* Status dot */}
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />

                                        {/* Stepper */}
                                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                            {bulkMode ? (
                                                <input
                                                    type="number"
                                                    value={draftStock[product.id] ?? product.stock}
                                                    onChange={e => setDraftStock(prev => ({ ...prev, [product.id]: e.target.value }))}
                                                    className="w-20 text-center text-base font-black rounded-xl px-2 py-1.5 outline-none"
                                                    style={{ border: `2px solid ${color}40`, background: `${color}06`, color }}
                                                />
                                            ) : (
                                                <>
                                                    <button onClick={e => handleQuickStock(e, product, -1)}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[16px] leading-none bg-black/04 text-[#86868B] hover:bg-[#FF3B30]/12 hover:text-[#FF3B30] transition-all">−</button>
                                                    <span className="text-[18px] font-black w-8 text-center" style={{ color }}>{avail}</span>
                                                    <button onClick={e => handleQuickStock(e, product, +1)}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[16px] leading-none bg-black/04 text-[#86868B] hover:bg-[#34C759]/12 hover:text-[#34C759] transition-all">+</button>
                                                </>
                                            )}
                                        </div>

                                        {/* Status badge */}
                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0" style={{ background: `${color}15`, color }}>{label}</span>

                                        {/* Delete */}
                                        <button
                                            onClick={async e => {
                                                e.stopPropagation();
                                                if (await confirm({ message: `למחוק את "${product.title}"?`, danger: true })) {
                                                    deleteProduct(product.id);
                                                    showToast('המוצר נמחק', 'warning');
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full flex items-center justify-center text-[#AEAEB2] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-all shrink-0"
                                        ><Trash2 size={13} /></button>
                                    </motion.div>
                                    </Fragment>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
            </>)}

            {/* ── להזמנה מספק — below-threshold items + order-from-supplier ── */}
            {tab === 'reorder' && (
                <div className="space-y-2">
                    {belowThreshold.length === 0 ? (
                        <AdminEmpty icon={<CheckCircle2 size={30} style={{ color: toneColor('success') }} />}
                            title="כל המוצרים מעל סף ההתרעה"
                            subtitle="אין פריטים שדורשים חידוש מלאי כרגע" />
                    ) : belowThreshold.map((product, i) => {
                        const { avail, color, label } = stockMeta(product);
                        return (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                                style={GLASS_SURFACE}
                                className="flex items-center gap-4 px-5 py-3.5 rounded-[18px] border border-black/05 hover:border-[#007AFF]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
                            >
                                <div className="w-11 h-11 rounded-[13px] overflow-hidden bg-[#F5F5F7] shrink-0">
                                    {product.image
                                        ? <img src={product.image} alt={product.title} className="w-full h-full object-cover"
                                            onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                        : <div className="w-full h-full flex items-center justify-center opacity-30"><Box size={16} className="text-[#86868B]" /></div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="font-bold text-[#1D1D1F] text-[13px] truncate">{product.title}</p>
                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                        {product.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: hexA(ORANGE, 0.1), color: ORANGE }}>{product.category}</span>}
                                        <span className="text-[10px] text-[#86868B] font-bold">סף התרעה: {product.threshold}</span>
                                    </div>
                                </div>
                                <div className="text-center shrink-0">
                                    <p className="text-[18px] font-black leading-none" style={{ color }}>{avail}</p>
                                    <p className="text-[9px] text-[#AEAEB2] font-bold mt-0.5">במלאי</p>
                                </div>
                                <span className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0" style={{ background: `${color}15`, color }}>{label}</span>
                                <AdminButton size="sm" accent={ORANGE} onClick={() => setReorderProduct(product)}>
                                    <span className="flex items-center gap-1"><Package size={13} /> הזמן מספק</span>
                                </AdminButton>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Product Detail Modal */}
            {createPortal(
                <AnimatePresence>
                    {selectedProduct && (
                        <ProductModal
                            key={selectedProduct.id}
                            product={selectedProduct}
                            onClose={() => setSelectedProduct(null)}
                            onSave={handleSaveProduct}
                            fx={fx} onSyncFx={syncFxRate} onSetFx={setFxRate}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* New Product Modal — same ProductModal reused in create mode */}
            {createPortal(
                <AnimatePresence>
                    {creating && (
                        <ProductModal
                            key="create-product"
                            product={BLANK_PRODUCT}
                            createMode
                            onClose={() => setCreating(false)}
                            onSave={handleCreateProduct}
                            fx={fx} onSyncFx={syncFxRate} onSetFx={setFxRate}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Smart Reorder Modal — AnimatePresence lives inside createPortal */}
            <SmartReorderModal
                open={!!reorderProduct}
                product={reorderProduct}
                onClose={() => setReorderProduct(null)}
            />

            {/* ── Babushka Drill Drawer — KPI → product list → product detail ── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                const isOpen  = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!current) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const scopeMap = {
                    all: { label: 'כל המלאי', color: ORANGE, Icon: Boxes, filter: () => true },
                    ok:  { label: 'מלאי תקין', color: toneColor('success'), Icon: CheckCircle2, filter: p => ['ok', 'supplier'].includes(statusKey(p)) },
                    low: { label: 'מלאי נמוך', color: toneColor('warning'), Icon: AlertTriangle, filter: p => statusKey(p) === 'low' },
                    out: { label: 'אזל מהמלאי', color: toneColor('danger'), Icon: XCircle, filter: p => statusKey(p) === 'out' },
                };
                const prodLeading = (p) => (
                    <span className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Box size={16} className="text-[#C7C7CC]" />}
                    </span>
                );
                const stockBadge = (p) => {
                    const m = stockMeta(p);
                    return <span className="px-2 py-0.5 rounded-md text-[10px] font-black shrink-0" style={{ background: hexA(m.color, 0.14), color: m.color }}>{m.avail} · {m.label}</span>;
                };

                let title = '', subtitle = '', icon = null, accent = ORANGE, footer = null, body = null;

                if (current.type === 'products') {
                    const sc = scopeMap[current.scope] || scopeMap.all;
                    const list = inventory.filter(sc.filter);
                    accent = sc.color; icon = <sc.Icon size={17} color={sc.color} />;
                    title = sc.label; subtitle = `${list.length} מוצרים`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ', value: inventory.length, color: ORANGE },
                                { label: 'תקין', value: okCount, color: toneColor('success') },
                                { label: 'נמוך', value: lowCount, color: toneColor('warning') },
                                { label: 'אזל', value: outCount, color: toneColor('danger') },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={Package} text="אין מוצרים בקטגוריה זו" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצרים — לחץ לפרטים</p>
                                    {list.map((p, i) => (
                                        <DrillRow key={p.id} delay={i * 0.02} tone={sc.color}
                                            onClick={() => pushDrill({ type: 'product', id: p.id })}
                                            leading={prodLeading(p)} title={p.title}
                                            subtitle={p.category || 'ללא קטגוריה'} trailing={stockBadge(p)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (current.type === 'product') {
                    const p = inventory.find(x => String(x.id) === String(current.id));
                    if (!p) { title = 'מוצר'; icon = <Box size={17} color={ORANGE} />; body = <DrillEmpty icon={Box} text="המוצר אינו זמין" />; }
                    else {
                        const m = stockMeta(p);
                        const dts = daysToStockout(p);
                        accent = m.color; icon = <Box size={17} style={{ color: m.color }} />;
                        title = p.title; subtitle = p.category || 'ללא קטגוריה';
                        footer = { label: 'פתח כרטיס מוצר', onClick: () => { closeDrill(); setSelectedProduct(p); } };
                        body = (
                            <div className="space-y-5">
                                <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                                    {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-contain" /> : <Box size={40} className="text-[#C7C7CC]" />}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black" style={{ background: hexA(m.color, 0.12), color: m.color }}>{m.label}</span>
                                    <p className="text-[15px] font-black tracking-tight text-[#1D1D1F]">₪{Number(p.salePrice ?? p.price ?? 0).toLocaleString()}</p>
                                </div>
                                <DrillStat items={[
                                    { label: 'במלאי', value: p.stock ?? 0, color: ORANGE },
                                    { label: 'שמור', value: p.reserved ?? 0, color: '#5AC8FA' },
                                    { label: 'זמין', value: m.avail, color: m.color },
                                    { label: 'סף', value: p.threshold ?? 5, color: '#8E8E93' },
                                ]} />
                                {dts != null && (
                                    <div className="flex items-center gap-2 p-3 rounded-[14px]" style={{ background: hexA(dts <= 14 ? toneColor('warning') : toneColor('success'), 0.08) }}>
                                        <TrendingDown size={15} style={{ color: dts <= 14 ? toneColor('warning') : toneColor('success') }} />
                                        <span className="text-[12px] font-bold text-[#1D1D1F]">צפי אזילה בעוד ~{dts} ימים</span>
                                    </div>
                                )}
                            </div>
                        );
                    }
                }

                return (
                    <DashDrillView open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={accent}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${current.type}:${current.id ?? current.scope ?? ''}:${drillStack.length}`}>
                        {body}
                    </DashDrillView>
                );
            })()}
        </div>
    );
}

function ProductModal({ product, onClose, onSave, createMode = false, fx = {}, onSyncFx, onSetFx }) {
    const [title, setTitle]           = useState(product.title);
    const [price, setPrice]           = useState(product.price);
    const [category, setCategory]     = useState(product.category);
    const [isFeatured, setIsFeatured] = useState(product.isFeatured || false);
    const [image, setImage]           = useState(product.image);
    const [stock, setStock]           = useState(product.stock ?? 0);
    const [threshold, setThreshold]   = useState(product.threshold ?? 5);
    // Supplier fulfilment + per-product alert control
    const [supplierStocked, setSupplierStocked] = useState(product.supplierStocked || false);
    const [supplierInStock, setSupplierInStock] = useState(product.supplierInStock || false);
    const [showSupplierQty, setShowSupplierQty] = useState(product.showSupplierQty || false);
    const [supplierStock, setSupplierStock]     = useState(product.supplierStock ?? 0);
    const [lowStockMuted, setLowStockMuted]     = useState(product.lowStockMuted || false);
    // Financial — cost (ILS/USD) + live margin (sell price = `price` above)
    const [supplierCost, setSupplierCost]       = useState(product.supplierCost ?? '');
    const [supplierCostUSD, setSupplierCostUSD] = useState(product.supplierCostUSD ?? '');
    const [costCurrency, setCostCurrency]       = useState(product.costCurrency || 'ILS');
    const [modalTab, setModalTab]               = useState('general');
    const fxRate = Number(fx.usdIls) || 3.7;
    const fin = computeMargins({ price: Number(price) || 0, supplierCost: Number(supplierCost) || 0, supplierCostUSD: Number(supplierCostUSD) || 0, costCurrency }, fxRate);

    const covered = supplierStocked && supplierInStock;
    const mStatus = stock === 0 ? (covered ? 'supplier' : 'out')
        : (stock <= threshold && !lowStockMuted && !covered ? 'low' : 'ok');
    const stockColor = { out: toneColor('danger'), low: toneColor('warning'), ok: toneColor('success'), supplier: toneColor('info') }[mStatus];
    const stockLabel = { out: 'אזל', low: 'מלאי נמוך', ok: 'תקין', supplier: 'אצל הספק' }[mStatus];
    const canSave    = !createMode || title.trim().length > 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 16 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="relative w-full max-w-lg overflow-hidden"
                style={{ ...GLASS.sheet, borderRadius: RADIUS.sheet }}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-black/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">
                            {createMode && !image
                                ? <Plus size={18} className="text-[#AEAEB2]" strokeWidth={2.5} />
                                : <img src={image || IMG_FALLBACK} className="w-full h-full object-cover" alt=""
                                    onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />}
                        </div>
                        {createMode ? (
                            <div>
                                <p className="text-[17px] font-black text-[#1D1D1F] leading-tight">מוצר חדש</p>
                                <p className="text-[11px] text-[#AEAEB2] font-medium">מלא את הפרטים ולחץ צור מוצר</p>
                            </div>
                        ) : (
                            <div>
                                <a href={`/catalog/${product.id}`} target="_blank" rel="noopener noreferrer"
                                    className="text-[17px] font-black text-[#1D1D1F] leading-tight hover:text-[#007AFF] transition-colors cursor-pointer flex items-center gap-1 group">
                                    {product.title}
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#007AFF] text-[12px]">↗</span>
                                </a>
                                <p className="text-[11px] text-[#AEAEB2] font-medium">SKU: {product.sku || product.id}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B] hover:bg-[#E5E5EA] transition-colors">
                        <X size={14} />
                    </button>
                </div>

                <div className="px-7 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Stock — neutral panel; color lives only in the semantic status badge */}
                    <div className="rounded-2xl p-4 border border-black/[0.06] bg-[#F5F5F7]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-widest text-[#86868B]">ניהול מלאי</span>
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ background: `${stockColor}15`, color: stockColor }}>{stockLabel}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">כמות במלאי</label>
                                <input type="number" min="0" value={stock}
                                    onChange={e => setStock(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-white rounded-xl px-4 py-3 text-[22px] font-black text-[#1D1D1F] text-center outline-none focus:ring-2 transition-all"
                                    style={{ border: `2px solid ${stockColor}40` }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">סף התרעה (נמוך)</label>
                                <input type="number" min="0" value={threshold}
                                    onChange={e => setThreshold(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-white rounded-xl px-4 py-3 text-[22px] font-black text-[#1D1D1F] text-center outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all border-2 border-black/10"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-[#AEAEB2] font-medium mt-2 text-right">כשהמלאי יורד מתחת לסף — המוצר מסומן כ"נמוך" בכל המערכת</p>
                    </div>

                    {/* Supplier fulfilment + alert control */}
                    <div className="rounded-2xl border border-black/[0.06] bg-[#F5F5F7] overflow-hidden">
                        <p className="text-[11px] font-black tracking-widest text-[#86868B] px-4 pt-3.5 pb-1 text-right">אספקה מהספק והתרעות</p>
                        <div className="divide-y divide-black/[0.06]">
                            <ToggleRow value={supplierStocked} onChange={setSupplierStocked} accent="#007AFF"
                                title="מוחזק אצל הספק" subtitle="אספקה ישירה (דרופשיפ) — לא מוחזק במלאי שלנו" />

                            {supplierStocked && (
                                <ToggleRow value={supplierInStock} onChange={setSupplierInStock} accent="#007AFF"
                                    title="במלאי אצל הספק" subtitle={'זמין להזמנה מיידית — לא ייחשב כ"אזל"'} />
                            )}

                            <ToggleRow value={showSupplierQty} onChange={setShowSupplierQty} accent="#007AFF"
                                title="הצג כמות אצל הספק" subtitle="הכמות תוצג על כרטיס המוצר" />

                            {showSupplierQty && (
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <input type="number" min="0" value={supplierStock}
                                            onChange={e => setSupplierStock(Math.max(0, Number(e.target.value)))}
                                            className="w-24 bg-white rounded-xl px-3 py-2.5 text-[17px] font-black text-[#1D1D1F] text-center outline-none border-2 border-black/10 focus:border-[#007AFF]/40 transition-all" />
                                        <label className="text-[12px] font-bold text-[#6E6E73] flex-1 text-right">כמות זמינה אצל הספק</label>
                                    </div>
                                </div>
                            )}

                            <ToggleRow value={lowStockMuted} onChange={setLowStockMuted} accent="#FF9500"
                                title="כבה התרעת מלאי נמוך" subtitle={'המוצר לא יסומן כ"נמוך" ולא ייכלל בהתרעות'} />
                        </div>
                    </div>

                    {/* ── Financial tab — cost / sell / margin (single source of truth) ── */}
                    <div className="rounded-2xl border border-black/[0.06] overflow-hidden" style={{ background: 'linear-gradient(160deg,rgba(52,199,89,0.05),rgba(0,122,255,0.04))' }}>
                        <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
                            <span className="text-[11px] font-black tracking-widest text-[#86868B] flex items-center gap-1.5"><TrendingUp size={13} className="text-[#34C759]" />פיננסי — עלות, מחיר ורווחיות</span>
                        </div>
                        <div className="px-4 pb-4 pt-1 space-y-3">
                            {/* cost currency + inputs */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">עלות מהספק</label>
                                    <div className="flex items-stretch gap-1.5">
                                        <div className="flex rounded-xl overflow-hidden border border-black/10 shrink-0" dir="ltr">
                                            {['ILS', 'USD'].map(cur => (
                                                <button key={cur} type="button" onClick={() => setCostCurrency(cur)}
                                                    className="px-2.5 text-[13px] font-black transition-colors"
                                                    style={{ background: costCurrency === cur ? '#007AFF' : '#fff', color: costCurrency === cur ? '#fff' : '#86868B' }}>
                                                    {cur === 'ILS' ? '₪' : '$'}
                                                </button>
                                            ))}
                                        </div>
                                        {costCurrency === 'ILS' ? (
                                            <input type="number" min="0" value={supplierCost} onChange={e => setSupplierCost(e.target.value)} placeholder="0"
                                                className="w-full bg-white rounded-xl px-3 py-2.5 text-[15px] font-black text-[#1D1D1F] text-center outline-none border border-black/10 focus:border-[#007AFF]/40 transition-all" />
                                        ) : (
                                            <input type="number" min="0" value={supplierCostUSD} onChange={e => setSupplierCostUSD(e.target.value)} placeholder="0"
                                                className="w-full bg-white rounded-xl px-3 py-2.5 text-[15px] font-black text-[#1D1D1F] text-center outline-none border border-black/10 focus:border-[#007AFF]/40 transition-all" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">מחיר מכירה ללקוח (₪)</label>
                                    <input type="number" min="0" value={price} onChange={e => setPrice(Number(e.target.value))} placeholder="0"
                                        className="w-full bg-white rounded-xl px-3 py-2.5 text-[15px] font-black text-[#007AFF] text-center outline-none border border-black/10 focus:border-[#007AFF]/40 transition-all" />
                                </div>
                            </div>

                            {/* FX rate row — manual edit + optional auto-sync (USD cost) */}
                            {costCurrency === 'USD' && (
                                <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 bg-white/70 border border-black/[0.06] flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => onSyncFx && onSyncFx().catch(() => {})} disabled={fx.syncing}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-colors"
                                            style={{ background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>
                                            <RefreshCw size={12} className={fx.syncing ? 'animate-spin' : ''} />{fx.syncing ? 'מסנכרן…' : 'סנכרן'}
                                        </button>
                                        <div className="flex items-center gap-1" dir="ltr">
                                            <span className="text-[11px] font-bold text-[#86868B]">1$ = ₪</span>
                                            <input key={fxRate} type="number" step="0.01" min="0" defaultValue={fxRate}
                                                onBlur={e => { const v = parseFloat(e.target.value); if (v > 0 && onSetFx) onSetFx(v); }}
                                                className="w-16 px-2 py-1 rounded-lg border border-black/10 text-[12px] font-black text-center text-[#1D1D1F] outline-none focus:border-[#007AFF]/40" />
                                        </div>
                                    </div>
                                    <span className="text-[12px] font-bold text-[#6E6E73]">≈ {fmtILS(fin.cost)}</span>
                                </div>
                            )}

                            {/* Live profitability metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'רווח ליחידה', value: fin.hasData ? fmtILS(fin.profit) : '—', color: fin.hasData ? (fin.profit >= 0 ? '#34C759' : '#FF3B30') : '#AEAEB2' },
                                    { label: 'אחוז רווחיות', value: fin.marginPct != null ? fmtPct(fin.marginPct) : '—', color: marginColor(fin.marginPct), headline: true },
                                    { label: 'תמחור (Markup)', value: fin.markupPct != null ? fmtPct(fin.markupPct) : '—', color: '#6E6E73' },
                                ].map((m, i) => (
                                    <div key={i} className="rounded-xl p-2.5 text-center bg-white/80" style={{ border: m.headline ? `1.5px solid ${m.color}55` : '1px solid rgba(0,0,0,0.05)' }}>
                                        <p className="font-black leading-none tabular-nums" style={{ fontSize: m.headline ? 18 : 15, color: m.color }}>{m.value}</p>
                                        <p className="text-[9.5px] font-bold text-[#AEAEB2] mt-1.5">{m.label}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-[#AEAEB2] font-medium text-right">"אחוז רווחיות" = הרווח מתוך מחיר המכירה. הנתונים מסתנכרנים אוטומטית לכל מסכי הרכש, המלאי והאנליטיקס.</p>
                        </div>
                    </div>

                    {/* Product details */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-[#AEAEB2] tracking-widest">פרטי מוצר</p>
                        <AdminInput label="שם המוצר" value={title} onChange={setTitle} />
                        <div className="grid grid-cols-2 gap-3">
                            <AdminInput label="קטגוריה" value={category} onChange={setCategory} />
                            <AdminInput label="מחיר (₪)" type="number" value={price} onChange={v => setPrice(Number(v))} />
                        </div>
                    </div>

                    <AdminInput label="כתובת תמונה" value={image} onChange={setImage} />

                    <div className="flex items-center justify-between p-3.5 bg-[#F5F5F7] rounded-2xl">
                        <AdminToggle value={isFeatured} onChange={setIsFeatured} />
                        <div className="text-right">
                            <p className="text-[13px] font-black text-[#1D1D1F]">נבחרת העונה</p>
                            <p className="text-[11px] text-[#AEAEB2] font-medium">מוצג בעמוד הראשי</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-black/[0.06] flex gap-3">
                    <AdminButton className="flex-1" accent={ORANGE} disabled={!canSave}
                        onClick={() => onSave({ title, price, category, isFeatured, image, stock: Number(stock), threshold: Number(threshold), supplierStocked, supplierInStock, showSupplierQty, supplierStock: Number(supplierStock) || 0, lowStockMuted, supplierCost: Number(supplierCost) || 0, supplierCostUSD: Number(supplierCostUSD) || 0, costCurrency })}>
                        {createMode ? 'צור מוצר' : 'שמור שינויים'}
                    </AdminButton>
                    <AdminButton variant="ghost" onClick={onClose}>ביטול</AdminButton>
                </div>
            </motion.div>
        </div>
    );
}

// Uniform RTL settings row — label block on the right, toggle pinned left, so
// a stack of these lines up perfectly regardless of subtitle length.
function ToggleRow({ title, subtitle, value, onChange, accent = '#34C759' }) {
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3">
            <AdminToggle value={value} onChange={onChange} accent={accent} />
            <div className="text-right flex-1 min-w-0">
                <p className="text-[13px] font-black text-[#1D1D1F] leading-tight">{title}</p>
                {subtitle && <p className="text-[11px] text-[#AEAEB2] font-medium leading-snug mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

function AdminToggle({ value, onChange, accent = '#34C759' }) {
    // dir="ltr" + absolute knob → position is direction-independent, so the knob
    // never detaches from the track inside an RTL parent.
    return (
        <button
            type="button"
            dir="ltr"
            onClick={() => onChange(!value)}
            style={{ background: value ? accent : '#D1D1D6' }}
            className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
        >
            <motion.span
                animate={{ x: value ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    );
}
