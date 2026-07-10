/* eslint-disable */

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, Box, X, Check, Trash2, LayoutGrid, List, Package, Boxes } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminSectionHeader, AdminSearchBar, AdminFilterPills, AdminButton, AdminKPICard, AdminEmpty, AdminTabs, InfoTooltip } from '../components/AdminComponents';
import { hexA, DOMAIN_ACCENTS } from '../theme/tokens';
import initialProducts from '../../data/products';

// Unified brand accent (azure) — DOMAIN_ACCENTS.inventory resolves to #007AFF
const ORANGE = DOMAIN_ACCENTS.inventory;

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
                        { label: 'מלאי נוכחי', value: product.stock || 0, color: (product.stock || 0) === 0 ? '#FF3B30' : '#FF9500' },
                        { label: 'סף ההתרעה', value: product.threshold || 5, color: '#007AFF' },
                        { label: 'כמות מוצעת', value: recQty, color: '#34C759' },
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

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

export default function AdminInventory() {
    const { inventory, orders, updateStock, updateProductDetails, deleteProduct } = useAdminData();
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('הכל');
    const [bulkMode, setBulkMode] = useState(false);
    const [draftStock, setDraftStock] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [reorderProduct, setReorderProduct]   = useState(null);
    const [tab, setTab] = useState('all');

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

    // ── Sales velocity: units sold per day per product (last 30 days) ────────
    const salesVelocity = useMemo(() => {
        const cutoff = Date.now() - 30 * 86400000;
        const vel = {};
        orders.filter(o => (o.dateTs || 0) >= cutoff).forEach(o => {
            (o.items || []).forEach(item => {
                const id = String(item.id ?? '');
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
    const lowCount  = inventory.filter(p => available(p) > 0 && available(p) <= p.threshold).length;
    const outCount  = inventory.filter(p => available(p) === 0).length;
    const okCount   = inventory.filter(p => available(p) > p.threshold).length;

    // Below-threshold items (low + out) — drives the "order from supplier" sector
    const belowThreshold = useMemo(
        () => inventory.filter(p => available(p) <= p.threshold).sort((a, b) => available(a) - available(b)),
        [inventory]
    );

    const filtered = useMemo(() => {
        let list = [...inventory];
        if (filter === 'נמוך') list = list.filter(p => { const a = available(p); return a > 0 && a <= p.threshold; });
        if (filter === 'אזל') list = list.filter(p => available(p) === 0);
        if (filter === 'במלאי') list = list.filter(p => available(p) > p.threshold);
        if (search) list = list.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            (p.category || '').includes(search)
        );
        return list.sort((a, b) => a.stock - b.stock);
    }, [inventory, search, filter]);

    const stockMeta = (p) => {
        const avail = available(p);
        const color = avail === 0 ? '#FF3B30' : avail <= p.threshold ? '#FF9500' : '#34C759';
        const label = avail === 0 ? 'אזל' : avail <= p.threshold ? 'נמוך' : 'תקין';
        return { avail, color, label };
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
                            <AdminButton variant="outline" onClick={enterBulkMode}>עריכה מהירה</AdminButton>
                        )}
                    </div>
                ) : undefined}
            />

            {/* ── KPI band ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'סה״כ מוצרים', value: inventory.length, color: ORANGE, Icon: Boxes, sub: `${filtered.length} בתצוגה`, tooltip: 'כל המוצרים בקטלוג המלאי.' },
                    { label: 'מלאי תקין', value: okCount, color: '#34C759', Icon: CheckCircle2, sub: 'מעל סף ההתרעה', tooltip: 'מוצרים שמלאיהם מעל סף ההתרעה.' },
                    { label: 'מלאי נמוך', value: lowCount, color: '#FF9500', Icon: AlertTriangle, sub: 'כדאי לחדש', tooltip: 'מוצרים שהמלאי הגיע לסף ההתרעה — כדאי לחדש.' },
                    { label: 'אזל מהמלאי', value: outCount, color: '#FF3B30', Icon: XCircle, sub: 'לא ניתן להזמין', tooltip: 'מוצרים עם 0 יחידות — לא ניתן להזמין.' },
                ].map(({ label, value, color, Icon, sub, tooltip }, i) => (
                    <AdminKPICard key={label} title={label} value={value} subtitle={sub} tooltip={tooltip}
                        icon={<Icon size={20} color={color} />} accent={color} delay={i * 0.05} />
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
                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                                        onClick={() => setSelectedProduct(product)}
                                        className="relative bg-white rounded-[22px] overflow-hidden border border-black/05 hover:border-[#007AFF]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] transition-all duration-300 cursor-pointer group"
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
                                                style={{ background: 'rgba(255,59,48,0.82)', backdropFilter: 'blur(8px)' }}
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
                                                const chipColor = days <= 7 ? '#FF3B30' : days <= 30 ? '#FF9500' : '#34C759';
                                                return (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                                                            style={{ background: `${chipColor}14`, color: chipColor, border: `1px solid ${chipColor}25` }}>
                                                            {days <= 0 ? 'נגמר בקרוב' : `יגמר בעוד ${days} ימים`}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

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
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.12)'; e.currentTarget.style.color = '#FF3B30'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = '#86868B'; }}
                                                        >−</button>
                                                        <span className="text-[22px] font-black w-9 text-center leading-none" style={{ color }}>
                                                            {avail}
                                                        </span>
                                                        <button
                                                            onClick={e => handleQuickStock(e, product, +1)}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[16px] leading-none transition-all"
                                                            style={{ background: 'rgba(0,0,0,0.04)', color: '#86868B' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,199,89,0.12)'; e.currentTarget.style.color = '#34C759'; }}
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
                                return (
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ delay: i * 0.015, type: 'spring', stiffness: 320, damping: 28 }}
                                        onClick={() => setSelectedProduct(product)}
                                        className="flex items-center gap-4 px-5 py-3.5 rounded-[18px] bg-white border border-black/05 hover:border-[#007AFF]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group"
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
                                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                {product.isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-[#007AFF]/10 text-[#007AFF]">נבחרת</span>}
                                                {product.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black" style={{ background: hexA(ORANGE, 0.1), color: ORANGE }}>{product.category}</span>}
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
                        <AdminEmpty icon={<CheckCircle2 size={30} style={{ color: '#34C759' }} />}
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
                                className="flex items-center gap-4 px-5 py-3.5 rounded-[18px] bg-white border border-black/05 hover:border-[#007AFF]/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all"
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
                            product={selectedProduct}
                            onClose={() => setSelectedProduct(null)}
                            onSave={handleSaveProduct}
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
        </div>
    );
}

function ProductModal({ product, onClose, onSave }) {
    const [title, setTitle]           = useState(product.title);
    const [price, setPrice]           = useState(product.price);
    const [category, setCategory]     = useState(product.category);
    const [isFeatured, setIsFeatured] = useState(product.isFeatured || false);
    const [image, setImage]           = useState(product.image);
    const [stock, setStock]           = useState(product.stock ?? 0);
    const [threshold, setThreshold]   = useState(product.threshold ?? 5);

    const stockColor = stock === 0 ? '#FF3B30' : stock <= threshold ? '#FF9500' : '#34C759';
    const stockLabel = stock === 0 ? 'אזל' : stock <= threshold ? 'מלאי נמוך' : 'תקין';

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
                className="relative w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)' }}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-black/[0.06]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0">
                            <img src={image || IMG_FALLBACK} className="w-full h-full object-cover" alt=""
                                onError={e => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                        </div>
                        <div>
                            <a href={`/catalog/${product.id}`} target="_blank" rel="noopener noreferrer"
                                className="text-[17px] font-black text-[#1D1D1F] leading-tight hover:text-[#007AFF] transition-colors cursor-pointer flex items-center gap-1 group">
                                {product.title}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#007AFF] text-[12px]">↗</span>
                            </a>
                            <p className="text-[11px] text-[#AEAEB2] font-medium">SKU: {product.sku || product.id}</p>
                        </div>
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
                    <AdminButton className="flex-1" accent={ORANGE}
                        onClick={() => onSave({ title, price, category, isFeatured, image, stock: Number(stock), threshold: Number(threshold) })}>
                        שמור שינויים
                    </AdminButton>
                    <AdminButton variant="ghost" onClick={onClose}>ביטול</AdminButton>
                </div>
            </motion.div>
        </div>
    );
}

function AdminInput({ label, value, onChange, type = "text" }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-[#86868B] tracking-widest px-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-[#F5F5F7] border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
            />
        </div>
    );
}

function AdminToggle({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${value ? 'bg-[#34C759]' : 'bg-[#AEAEB2]'}`}
        >
            <motion.div
                animate={{ x: value ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    );
}
