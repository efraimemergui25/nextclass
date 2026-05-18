/* eslint-disable */

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, Box } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader, AdminSearchBar, AdminFilterPills, AdminButton, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';

const FILTERS = ['הכל', 'נמוך', 'אזל', 'תקין'];

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

// ─── Stock bar ────────────────────────────────────────────────────────────────
function StockBar({ stock, threshold, max, reserved = 0 }) {
    const available = Math.max(0, stock - reserved);
    const pct = Math.min((available / Math.max(max, 1)) * 100, 100);
    const color = available === 0 ? '#FF3B30' : available <= threshold ? '#FF9500' : '#34C759';
    const label = available === 0 ? 'אזל' : available <= threshold ? 'נמוך' : 'תקין';
    return (
        <div className="flex items-center gap-3 min-w-0">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}90)` }}
                />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <span className="text-[11px] font-black" style={{ color }}>
                    {available} זמין
                </span>
                {reserved > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                        style={{ background: 'rgba(255,159,10,0.12)', color: '#FF9F0A' }}>
                        {reserved} שמורות
                    </span>
                )}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                    style={{ background: `${color}12`, color }}>
                    {label}
                </span>
            </div>
        </div>
    );
}

// ─── Inline stock editor ──────────────────────────────────────────────────────
function EditStockInput({ value, onSave, onCancel }) {
    const [v, setV] = useState(String(value));
    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel} className="text-[#AEAEB2] hover:text-[#FF3B30] text-sm transition-colors">✕</button>
            <button type="button" onClick={() => onSave(Number(v))} className="text-[#34C759] hover:text-[#1A8C40] text-sm transition-colors">✓</button>
            <input type="number" value={v} onChange={e => setV(e.target.value)} autoFocus
                className="w-16 rounded-lg px-2 py-1 text-xs text-[#1D1D1F] text-center outline-none"
                style={{ border: '1px solid rgba(0,122,255,0.40)', background: 'rgba(0,122,255,0.04)' }}
            />
        </div>
    );
}

// ─── Summary card ─────────────────────────────────────────────────────────────
function StockCard({ label, value, color, Icon, tooltip }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] p-4 text-right relative overflow-hidden"
            style={{
                background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.94) 50%, rgba(255,255,255,0.88) 100%)`,
                border: `1px solid ${color}22`,
                boxShadow: `0 4px 20px ${color}10, 0 1px 0 rgba(255,255,255,0.95) inset`,
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: `${color}16`, border: `1px solid ${color}20` }}>
                    {Icon && <Icon size={16} style={{ color }} />}
                </div>
                <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: color }} />
            </div>
            <p className="text-[28px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[11px] font-bold mt-1.5 flex items-center gap-0.5">
                {label}{tooltip && <InfoTooltip text={tooltip} />}
            </p>
        </motion.div>
    );
}

export default function AdminInventory() {
    const { inventory, updateStock, updateProductDetails } = useAdminData();
    const { showToast } = useAdminToast();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [filter, setFilter] = useState('הכל');
    const [editingId, setEditingId] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);
    const [draftStock, setDraftStock] = useState({});

    // Update search if URL changes
    useEffect(() => {
        const query = searchParams.get('search');
        if (query) setSearch(query);
    }, [searchParams]);

    const enterBulkMode = () => {
        const draft = {};
        inventory.forEach(p => { draft[p.id] = String(p.stock); });
        setDraftStock(draft);
        setBulkMode(true);
    };

    const saveBulkMode = () => {
        Object.entries(draftStock).forEach(([id, val]) => {
            const newVal = Math.max(0, Number(val) || 0);
            const product = inventory.find(p => String(p.id) === String(id));
            if (product && newVal !== product.stock) updateStock(id, newVal);
        });
        setBulkMode(false);
        showToast('כל המלאי עודכן בהצלחה', 'success');
    };

    const maxStock = useMemo(() => Math.max(...inventory.map(p => p.stock), 1), [inventory]);

    const filtered = useMemo(() => {
        let list = [...inventory];
        if (filter === 'נמוך') list = list.filter(p => { const a = Math.max(0, (p.stock||0) - (p.reserved||0)); return a > 0 && a <= p.threshold; });
        if (filter === 'אזל') list = list.filter(p => Math.max(0, (p.stock||0) - (p.reserved||0)) === 0);
        if (filter === 'תקין') list = list.filter(p => Math.max(0, (p.stock||0) - (p.reserved||0)) > p.threshold);
        if (search) list = list.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            (p.category || '').includes(search)
        );
        return list.sort((a, b) => a.stock - b.stock);
    }, [inventory, search, filter]);

    const available = p => Math.max(0, (p.stock || 0) - (p.reserved || 0));
    const lowCount  = inventory.filter(p => available(p) > 0 && available(p) <= p.threshold).length;
    const outCount  = inventory.filter(p => available(p) === 0).length;
    const okCount   = inventory.filter(p => available(p) > p.threshold).length;

    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleSave = (id, newStock) => {
        updateStock(id, Math.max(0, newStock));
        setEditingId(null);
    };

    const handleSaveProduct = async (updates) => {
        if (!selectedProduct) return;
        await updateProductDetails(selectedProduct.id, updates);
        setSelectedProduct(null);
        showToast('פרטי המוצר עודכנו בהצלחה', 'success');
    };

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title="ניהול מלאי"
                subtitle={`${inventory.length} מוצרים · ${outCount} אזלו · ${lowCount} מלאי נמוך`}
                action={
                    bulkMode ? (
                        <div className="flex gap-2">
                            <AdminButton variant="ghost" onClick={() => setBulkMode(false)}>ביטול</AdminButton>
                            <AdminButton onClick={saveBulkMode}>שמור הכל</AdminButton>
                        </div>
                    ) : (
                        <AdminButton variant="outline" onClick={enterBulkMode}>עריכה מהירה</AdminButton>
                    )
                }
            />

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <StockCard label="מלאי תקין" value={okCount} color="#34C759" Icon={CheckCircle2}
                    tooltip="מוצרים שכמות המלאי שלהם גבוהה מסף ההתרעה." />
                <StockCard label="מלאי נמוך" value={lowCount} color="#FF9500" Icon={AlertTriangle}
                    tooltip="מוצרים שהמלאי שלהם הגיע לסף ההתרעה — כדאי לחדש." />
                <StockCard label="אזל מהמלאי" value={outCount} color="#FF3B30" Icon={XCircle}
                    tooltip="מוצרים עם 0 יחידות — לא ניתן להזמין עד לחידוש המלאי." />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש מוצר..." />
                </div>
                <AdminFilterPills options={FILTERS} active={filter} onChange={setFilter} />
            </div>

            {/* List View */}
            <div className="space-y-3 mt-4">
                {/* Header */}
                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_200px_80px_auto] gap-4 px-6 py-2 text-right">
                        {['', 'מוצר', 'מלאי', 'סף', bulkMode ? 'יחידות חדשות' : 'עדכון'].map((h, i) => (
                            <p key={i} className="text-[10px] font-black tracking-[0.18em] text-[#AEAEB2]">{h}</p>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {filtered.map((product, i) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.015, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => setSelectedProduct(product)}
                            className="grid grid-cols-[auto_1fr_200px_80px_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                        >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 bg-[#F5F5F7]">
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
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                      />
                                    : <div className="w-full h-full flex items-center justify-center opacity-30"><Box size={18} className="text-[#86868B]" /></div>}
                            </div>

                            {/* Name + category */}
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate group-hover:text-[#007AFF] transition-colors">{product.title}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                    {product.isFeatured && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-[#FF9500]/10 text-[#FF9500]">נבחרת</span>
                                    )}
                                    {product.category && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                                            style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF' }}>
                                            {product.category}
                                        </span>
                                    )}
                                    {product.sku && (
                                        <span className="text-[#AEAEB2] text-[10px] font-mono">{product.sku}</span>
                                    )}
                                </div>
                            </div>

                            {/* Stock bar */}
                            <StockBar stock={product.stock} threshold={product.threshold} max={maxStock} reserved={product.reserved || 0} />

                            {/* Threshold */}
                            <p className="text-[#86868B] text-xs font-bold text-right">{product.threshold} יח׳</p>

                            {/* Edit action */}
                            {bulkMode ? (
                                <input
                                    type="number"
                                    value={draftStock[product.id] ?? product.stock}
                                    onChange={e => { e.stopPropagation(); setDraftStock(prev => ({ ...prev, [product.id]: e.target.value })); }}
                                    onClick={e => e.stopPropagation()}
                                    className="w-20 rounded-xl px-2 py-1.5 text-xs text-center text-[#1D1D1F] outline-none border border-[#007AFF]/40 bg-[#007AFF]/05 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15)] transition-all"
                                />
                            ) : editingId === product.id ? (
                                <EditStockInput
                                    value={product.stock}
                                    onSave={v => handleSave(product.id, v)}
                                    onCancel={(e) => { e.stopPropagation(); setEditingId(null); }}
                                />
                            ) : (
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => { e.stopPropagation(); setEditingId(product.id); }}
                                    className="text-xs font-black px-4 py-2 rounded-xl transition-all bg-black/04 text-[#1D1D1F] hover:bg-[#007AFF] hover:text-white hover:shadow-lg">
                                    עדכן
                                </motion.button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-3 text-[#AEAEB2]">
                        <Box size={40} className="opacity-30" />
                        <p className="text-sm font-bold text-[#6E6E73]">אין מוצרים תואמים לחיפוש</p>
                    </div>
                )}
            </div>

            {/* Product Detail Modal — rendered via portal to escape filter stacking context */}
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
        </div>
    );
}

function ProductModal({ product, onClose, onSave }) {
    const [title, setTitle]         = useState(product.title);
    const [price, setPrice]         = useState(product.price);
    const [category, setCategory]   = useState(product.category);
    const [isFeatured, setIsFeatured] = useState(product.isFeatured || false);
    const [image, setImage]         = useState(product.image);
    const [stock, setStock]         = useState(product.stock ?? 0);
    const [threshold, setThreshold] = useState(product.threshold ?? 5);

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
                className="relative w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden"
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
                            <h3 className="text-[17px] font-black text-[#1D1D1F] leading-tight">{product.title}</h3>
                            <p className="text-[11px] text-[#AEAEB2] font-medium">{product.sku || product.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B] hover:bg-[#E5E5EA] transition-colors text-sm">
                        ✕
                    </button>
                </div>

                <div className="px-7 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* ── מלאי — הכי חשוב, ראשון ── */}
                    <div className="rounded-2xl p-4 border-2 border-[#007AFF]/20 bg-[#007AFF]/04">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-widest text-[#007AFF]">ניהול מלאי</span>
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-full"
                                style={{ background: `${stockColor}15`, color: stockColor }}>
                                {stockLabel}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">כמות במלאי</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={e => setStock(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-white rounded-xl px-4 py-3 text-[22px] font-black text-[#1D1D1F] text-center outline-none focus:ring-2 transition-all"
                                    style={{ border: `2px solid ${stockColor}40`, focusRingColor: stockColor }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">סף התראה (נמוך)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={threshold}
                                    onChange={e => setThreshold(Math.max(0, Number(e.target.value)))}
                                    className="w-full bg-white rounded-xl px-4 py-3 text-[22px] font-black text-[#FF9500] text-center outline-none focus:ring-2 focus:ring-[#FF9500]/30 transition-all border-2 border-[#FF9500]/20"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-[#AEAEB2] font-medium mt-2 text-right">
                            כשהמלאי יורד מתחת לסף — המוצר מסומן כ"נמוך" בכל המערכת
                        </p>
                    </div>

                    {/* ── פרטי מוצר ── */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-[#AEAEB2] tracking-widest">פרטי מוצר</p>
                        <AdminInput label="שם המוצר" value={title} onChange={setTitle} />
                        <div className="grid grid-cols-2 gap-3">
                            <AdminInput label="קטגוריה" value={category} onChange={setCategory} />
                            <AdminInput label="מחיר (₪)" type="number" value={price} onChange={v => setPrice(Number(v))} />
                        </div>
                    </div>

                    {/* ── תמונה ── */}
                    <AdminInput label="כתובת תמונה" value={image} onChange={setImage} />

                    {/* ── Best Seller ── */}
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
                    <AdminButton className="flex-1" onClick={() => onSave({ title, price, category, isFeatured, image, stock: Number(stock), threshold: Number(threshold) })}>
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
