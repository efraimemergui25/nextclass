/* eslint-disable */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../context/AdminDataContext';
import { useToast } from '../context/AdminToastContext';
import { AdminSectionHeader, AdminSearchBar, AdminFilterPills, AdminButton } from '../components/AdminComponents';

const FILTERS = ['הכל', 'נמוך', 'אזל', 'תקין'];

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

// ─── Stock bar ────────────────────────────────────────────────────────────────
function StockBar({ stock, threshold, max }) {
    const pct = Math.min((stock / Math.max(max, 1)) * 100, 100);
    const color = stock === 0 ? '#FF3B30' : stock <= threshold ? '#FF9500' : '#34C759';
    const label = stock === 0 ? 'אזל' : stock <= threshold ? 'נמוך' : 'תקין';
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
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-black w-14 text-right" style={{ color }}>
                    {stock} יח׳
                </span>
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
function StockCard({ label, value, color, icon }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 text-right relative overflow-hidden"
            style={glass}
        >
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}30)` }} />
            <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{icon}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: `${color}12` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                </div>
            </div>
            <p className="text-2xl font-black tracking-tighter" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[11px] font-bold mt-0.5">{label}</p>
        </motion.div>
    );
}

export default function AdminInventory() {
    const { inventory, updateStock } = useAdminData();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('הכל');
    const [editingId, setEditingId] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);
    const [draftStock, setDraftStock] = useState({});

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
        if (filter === 'נמוך') list = list.filter(p => p.stock > 0 && p.stock <= p.threshold);
        if (filter === 'אזל') list = list.filter(p => p.stock === 0);
        if (filter === 'תקין') list = list.filter(p => p.stock > p.threshold);
        if (search) list = list.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            (p.category || '').includes(search)
        );
        return list.sort((a, b) => a.stock - b.stock);
    }, [inventory, search, filter]);

    const lowCount  = inventory.filter(p => p.stock <= p.threshold && p.stock > 0).length;
    const outCount  = inventory.filter(p => p.stock === 0).length;
    const okCount   = inventory.filter(p => p.stock > p.threshold).length;

    const handleSave = (id, newStock) => {
        updateStock(id, Math.max(0, newStock));
        setEditingId(null);
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
                <StockCard label="מלאי תקין" value={okCount} color="#34C759" icon="✅" />
                <StockCard label="מלאי נמוך" value={lowCount} color="#FF9500" icon="⚠️" />
                <StockCard label="אזל מהמלאי" value={outCount} color="#FF3B30" icon="🚫" />
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
                            <p key={i} className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2]">{h}</p>
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
                            className="grid grid-cols-[auto_1fr_200px_80px_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-[14px] overflow-hidden shrink-0 bg-[#F5F5F7]">
                                {product.image
                                    ? <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    : <div className="w-full h-full flex items-center justify-center text-lg opacity-40">📦</div>}
                            </div>

                            {/* Name + category */}
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate group-hover:text-[#007AFF] transition-colors">{product.title}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-0.5">
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
                            <StockBar stock={product.stock} threshold={product.threshold} max={maxStock} />

                            {/* Threshold */}
                            <p className="text-[#86868B] text-xs font-bold text-right">{product.threshold} יח׳</p>

                            {/* Edit action */}
                            {bulkMode ? (
                                <input
                                    type="number"
                                    value={draftStock[product.id] ?? product.stock}
                                    onChange={e => setDraftStock(prev => ({ ...prev, [product.id]: e.target.value }))}
                                    className="w-20 rounded-xl px-2 py-1.5 text-xs text-center text-[#1D1D1F] outline-none border border-[#007AFF]/40 bg-[#007AFF]/05 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15)] transition-all"
                                />
                            ) : editingId === product.id ? (
                                <EditStockInput
                                    value={product.stock}
                                    onSave={v => handleSave(product.id, v)}
                                    onCancel={() => setEditingId(null)}
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
                    <div className="py-20 flex flex-col items-center gap-4 text-[#AEAEB2]">
                        <span className="text-5xl">📦</span>
                        <p className="text-sm font-bold text-[#6E6E73]">אין מוצרים תואמים לחיפוש</p>
                    </div>
                )}
            </div>
        </div>
    );
}
