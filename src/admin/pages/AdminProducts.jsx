/* eslint-disable */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import initialProducts from '../../data/products';
import { AdminSearchBar, AdminSectionHeader, AdminButton, AdminModal, AdminInput, AdminFilterPills, AdminToggle, StatusBadge } from '../components/AdminComponents';

const CATEGORIES = ['הכל', 'מסכים אינטראקטיביים והקרנה', 'מחשוב וטאבלטים', 'תשתיות רשת ואודיו-ויזואל', 'מעבדות STEM וחינוך STEAM', 'ריהוט חינוכי ואחסון', 'בטיחות ומעקב'];

const EMPTY_FORM = { title: '', price: '', salePrice: '', sku: '', category: CATEGORIES[1], image: '', description: '', specs: [], isActive: true, isNew: false, isFeatured: false };

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

const STATUS_FILTERS = ['הכל', 'פעיל', 'לא פעיל'];

function ActiveBadge({ isActive }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
            style={{
                background: isActive !== false ? 'rgba(52,199,89,0.12)' : 'rgba(174,174,178,0.15)',
                color: isActive !== false ? '#1A8C40' : '#AEAEB2',
            }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isActive !== false ? '#34C759' : '#AEAEB2' }} />
            {isActive !== false ? 'פעיל' : 'לא פעיל'}
        </span>
    );
}

function SaleBadge({ salePrice }) {
    if (!salePrice) return null;
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-[#FF3B30]/12 text-[#FF3B30]">
            מבצע
        </span>
    );
}

function ProductCard({ product, onEdit }) {
    const stockStatus = product.stock === 0 ? 'אזל' : product.stock <= product.threshold ? 'נמוך' : 'תקין';
    const isInactive = product.isActive === false;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
            className="bg-white rounded-[20px] overflow-hidden cursor-pointer group relative"
            style={{
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                opacity: isInactive ? 0.65 : 1,
            }}
            onClick={() => onEdit(product)}
        >
            <div className="relative h-40 bg-[#F5F5F7] overflow-hidden">
                {product.image ? (
                    <img src={product.image} alt={product.title}
                        onError={(e) => {
                            if (!e.target.dataset.tried1) {
                                e.target.dataset.tried1 = 'true';
                                const orig = initialProducts.find(ip => String(ip.id) === String(product.id));
                                if (orig?.image) { e.target.src = orig.image; return; }
                            }
                            e.target.onerror = null;
                            e.target.src = IMG_FALLBACK;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🛍️</div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                    <StatusBadge status={stockStatus} />
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                    <ActiveBadge isActive={product.isActive} />
                    <SaleBadge salePrice={product.salePrice} />
                </div>
                {isInactive && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מושבת</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-center text-xs font-black text-[#007AFF]">
                        לחץ לעריכה
                    </div>
                </div>
            </div>
            <div className="p-4">
                <p className="text-[#AEAEB2] text-[9px] font-black uppercase tracking-widest mb-1">{product.category}</p>
                <h3 className="text-[#1D1D1F] font-black text-sm leading-tight line-clamp-2 mb-3">{product.title}</h3>
                <div className="flex items-center justify-between">
                    <div>
                        {product.salePrice ? (
                            <div className="flex flex-col items-start">
                                <span className="text-[#FF3B30] font-black text-base">₪{Number(product.salePrice).toLocaleString()}</span>
                                <span className="text-[#AEAEB2] text-xs line-through">₪{Number(product.price).toLocaleString()}</span>
                            </div>
                        ) : (
                            <span className="text-[#007AFF] font-black text-base">₪{Number(product.price).toLocaleString()}</span>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[#AEAEB2] text-[10px]">מלאי</p>
                        <p className={`font-black text-sm ${product.stock === 0 ? 'text-[#FF3B30]' : product.stock <= product.threshold ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
                            {product.stock} יח׳
                        </p>
                    </div>
                </div>
                {product.sku && <p className="text-[#AEAEB2] text-[9px] mt-1">{product.sku}</p>}
            </div>
        </motion.div>
    );
}

function ProductRow({ product, onEdit }) {
    const stockStatus = product.stock === 0 ? 'אזל' : product.stock <= product.threshold ? 'נמוך' : 'תקין';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={() => onEdit(product)}
            className="flex items-center gap-4 px-6 py-4 rounded-[20px] bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] cursor-pointer transition-all group"
            style={{ opacity: product.isActive === false ? 0.6 : 1, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
            <div className="w-14 h-14 rounded-[14px] overflow-hidden bg-[#F5F5F7] shrink-0">
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
                    : <div className="w-full h-full flex items-center justify-center text-xl opacity-20">🛍️</div>}
            </div>
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[#1D1D1F] font-bold text-sm line-clamp-1 group-hover:text-[#007AFF] transition-colors">{product.title}</p>
                <p className="text-[#AEAEB2] text-xs mt-0.5">{product.category} {product.sku ? `· ${product.sku}` : ''}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 items-center">
                <ActiveBadge isActive={product.isActive} />
                <StatusBadge status={stockStatus} />
            </div>
            <p className={`text-sm font-black w-16 text-center shrink-0 ${product.stock === 0 ? 'text-[#FF3B30]' : product.stock <= product.threshold ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
                {product.stock} יח׳
            </p>
            <div className="w-28 text-left shrink-0">
                {product.salePrice ? (
                    <div>
                        <p className="text-[#FF3B30] font-black text-sm">₪{Number(product.salePrice).toLocaleString()}</p>
                        <p className="text-[#AEAEB2] text-[10px] line-through mt-0.5">₪{Number(product.price).toLocaleString()}</p>
                    </div>
                ) : (
                    <p className="text-[#1D1D1F] font-black text-sm">₪{Number(product.price).toLocaleString()}</p>
                )}
            </div>
            <span className="text-[#AEAEB2] group-hover:text-[#007AFF] text-xs font-bold transition-colors shrink-0">←</span>
        </motion.div>
    );
}

function SpecRow({ spec, onChange, onRemove }) {
    return (
        <div className="flex gap-2 items-center">
            <button type="button" onClick={onRemove}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors shrink-0 text-xs">✕</button>
            <input value={spec.value} onChange={e => onChange({ ...spec, value: e.target.value })}
                placeholder="ערך" dir="rtl"
                className="flex-1 bg-white border border-black/10 rounded-lg px-3 py-1.5 text-[#1D1D1F] text-xs outline-none focus:border-[#007AFF]/50" />
            <input value={spec.label} onChange={e => onChange({ ...spec, label: e.target.value })}
                placeholder="תווית" dir="rtl"
                className="flex-1 bg-white border border-black/10 rounded-lg px-3 py-1.5 text-[#1D1D1F] text-xs outline-none focus:border-[#007AFF]/50" />
        </div>
    );
}

export default function AdminProducts() {
    const { products, updateProductDetails, addProduct, deleteProduct } = useAdminData();
    const { showToast } = useAdminToast();
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('הכל');
    const [statusFilter, setStatusFilter] = useState('הכל');
    const [viewMode, setViewMode] = useState('grid');
    const [editingProduct, setEditingProduct] = useState(null);
    const [isNew, setIsNew] = useState(false);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [saved, setSaved] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleEditClick = (product) => {
        setIsNew(false);
        setEditingProduct(product);
        setEditForm({
            title: product.title || '',
            price: product.price || '',
            salePrice: product.salePrice || '',
            sku: product.sku || '',
            category: product.category || '',
            image: product.image || '',
            description: product.description || '',
            stock: product.stock ?? '',
            threshold: product.threshold ?? 5,
            specs: product.specs ? [...product.specs] : [],
            isActive: product.isActive !== false,
            isNew: product.isNew === true,
            isFeatured: product.isFeatured === true,
        });
        setSaved(false);
        setConfirmDelete(false);
    };

    const handleNewProduct = () => {
        setIsNew(true);
        setEditingProduct({});
        setEditForm({ ...EMPTY_FORM, specs: [] });
        setSaved(false);
        setConfirmDelete(false);
    };

    const handleSave = () => {
        if (!editForm.title || !editForm.price) return;
        const payload = {
            ...editForm,
            price: Number(editForm.price) || 0,
            salePrice: editForm.salePrice ? Number(editForm.salePrice) : null,
            stock: Number(editForm.stock) || 0,
            threshold: Number(editForm.threshold) || 5,
        };
        if (isNew) {
            addProduct(payload);
            showToast('מוצר חדש נוסף בהצלחה', 'success');
        } else {
            updateProductDetails(editingProduct.id, payload);
            showToast('המוצר עודכן בהצלחה', 'success');
        }
        setSaved(true);
        setTimeout(() => { setEditingProduct(null); setSaved(false); }, 600);
    };

    const handleDelete = () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        deleteProduct(editingProduct.id);
        showToast('המוצר נמחק', 'warning');
        setEditingProduct(null);
        setConfirmDelete(false);
    };

    const handleToggleActive = () => {
        const next = editForm.isActive === false ? true : false;
        setEditForm(f => ({ ...f, isActive: next }));
        if (!isNew) {
            updateProductDetails(editingProduct.id, { isActive: next });
            showToast(next ? 'המוצר הופעל' : 'המוצר הושבת', next ? 'success' : 'info');
        }
    };

    const setField = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
    const addSpec = () => setEditForm(f => ({ ...f, specs: [...(f.specs || []), { label: '', value: '' }] }));
    const updateSpec = (i, s) => setEditForm(f => ({ ...f, specs: f.specs.map((x, j) => j === i ? s : x) }));
    const removeSpec = (i) => setEditForm(f => ({ ...f, specs: f.specs.filter((_, j) => j !== i) }));

    const categories = useMemo(() => ['הכל', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);

    const filtered = useMemo(() => {
        let list = [...products];
        if (catFilter !== 'הכל') list = list.filter(p => p.category === catFilter);
        if (statusFilter === 'פעיל') list = list.filter(p => p.isActive !== false);
        if (statusFilter === 'לא פעיל') list = list.filter(p => p.isActive === false);
        if (search) list = list.filter(p =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.includes(search) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
        );
        return list;
    }, [products, search, catFilter, statusFilter]);

    const activeCount = products.filter(p => p.isActive !== false).length;
    const saleCount = products.filter(p => p.salePrice).length;

    return (
        <div dir="rtl">
            <AdminSectionHeader
                title="מוצרים"
                subtitle={`${filtered.length} מוצרים · ${activeCount} פעילים · ${saleCount} במבצע`}
                action={
                    <div className="flex gap-2">
                        <div className="flex bg-black/05 rounded-xl p-1 gap-1">
                            {[['grid','☰ גריד'],['list','≡ רשימה']].map(([m,l]) => (
                                <button key={m} type="button" onClick={() => setViewMode(m)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${viewMode === m ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#6E6E73]'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <AdminButton onClick={handleNewProduct}>+ מוצר חדש</AdminButton>
                    </div>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש מוצר, SKU..." />
                </div>
                <AdminFilterPills options={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
                <div className="overflow-x-auto">
                    <AdminFilterPills options={categories} active={catFilter} onChange={setCatFilter} />
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {filtered.map(p => (
                            <ProductCard key={p.id} product={p} onEdit={handleEditClick} />
                        ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center text-[#AEAEB2] text-sm">אין מוצרים תואמים</div>
                    )}
                </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-3 mt-4">
                    {filtered.length > 0 && (
                        <div className="hidden lg:flex items-center gap-4 px-6 py-2">
                            <div className="w-14 shrink-0" />
                            <p className="flex-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2] text-right">מוצר</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2] shrink-0">סטטוס</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2] w-16 text-center shrink-0">מלאי</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#AEAEB2] w-28 text-left shrink-0">מחיר</p>
                            <div className="w-4 shrink-0" />
                        </div>
                    )}
                    <AnimatePresence>
                        {filtered.map(p => (
                            <ProductRow key={p.id} product={p} onEdit={handleEditClick} />
                        ))}
                    </AnimatePresence>
                    {filtered.length === 0 && (
                        <div className="py-20 flex flex-col items-center gap-4 text-[#AEAEB2]">
                            <span className="text-5xl">🛍️</span>
                            <p className="text-sm font-bold text-[#6E6E73]">אין מוצרים תואמים לחיפוש</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit / New Product Modal */}
            <AdminModal
                open={!!editingProduct}
                onClose={() => { setEditingProduct(null); setConfirmDelete(false); }}
                title={isNew ? 'מוצר חדש' : 'עריכת מוצר'}
                size="lg"
            >
                <div className="space-y-5" dir="rtl">
                    {/* Status toggle row */}
                    <div className="flex items-center justify-between bg-[#F5F5F7] rounded-2xl px-4 py-3">
                        <button type="button" onClick={handleToggleActive}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                            style={{
                                background: editForm.isActive !== false ? 'rgba(52,199,89,0.12)' : 'rgba(174,174,178,0.15)',
                                color: editForm.isActive !== false ? '#1A8C40' : '#6E6E73',
                            }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: editForm.isActive !== false ? '#34C759' : '#AEAEB2' }} />
                            {editForm.isActive !== false ? 'מוצר פעיל — לחץ להשבית' : 'מוצר מושבת — לחץ להפעיל'}
                        </button>
                        <div className="flex gap-1">
                            <ActiveBadge isActive={editForm.isActive} />
                            {editForm.salePrice && <SaleBadge salePrice={editForm.salePrice} />}
                        </div>
                    </div>

                    <AdminInput label="שם המוצר" value={editForm.title} onChange={v => setField('title', v)} placeholder="כותרת מוצר..." />

                    <div className="grid grid-cols-3 gap-3">
                        <AdminInput label="מחיר רגיל (₪)" type="number" value={String(editForm.price)} onChange={v => setField('price', v)} placeholder="0" />
                        <AdminInput label="מחיר מבצע (₪)" type="number" value={String(editForm.salePrice || '')} onChange={v => setField('salePrice', v)} placeholder="ריק = ללא מבצע" />
                        <div>
                            <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">SKU</label>
                            <div className="flex gap-1">
                                <input value={editForm.sku || ''} onChange={e => setField('sku', e.target.value)} dir="ltr"
                                    placeholder="SKU-001"
                                    className="flex-1 bg-white border border-black/12 rounded-xl px-3 py-2.5 text-[#1D1D1F] text-sm outline-none focus:border-[#007AFF]/60"
                                />
                                <button type="button" title="צור SKU אוטומטי"
                                    onClick={() => {
                                        const catCode = (editForm.category || 'GEN').split(/[\s-]/)[0].slice(0, 3).toUpperCase();
                                        const titleCode = (editForm.title || 'PROD').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3);
                                        const rand = Math.floor(Math.random() * 900 + 100);
                                        setField('sku', `${catCode}-${titleCode}-${rand}`);
                                    }}
                                    className="px-2.5 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#007AFF]/10 text-[#007AFF] text-xs font-black transition-colors shrink-0">
                                    ✦
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">קטגוריה</label>
                        <select value={editForm.category} onChange={e => setField('category', e.target.value)} dir="rtl"
                            className="w-full bg-white border border-black/12 rounded-xl px-4 py-2.5 text-[#1D1D1F] text-sm outline-none focus:border-[#007AFF]/60">
                            {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <AdminInput label="מלאי (יח׳)" type="number" value={String(editForm.stock ?? '')} onChange={v => setField('stock', v)} placeholder="0" />
                        <AdminInput label="סף מלאי נמוך" type="number" value={String(editForm.threshold ?? 5)} onChange={v => setField('threshold', v)} placeholder="5" />
                    </div>

                    <AdminInput label="כתובת תמונה (URL)" value={editForm.image} onChange={v => setField('image', v)} placeholder="https://..." dir="ltr" />
                    {editForm.image && (
                        <div className="w-full h-40 rounded-xl overflow-hidden bg-[#F5F5F7]">
                            <img
                                src={editForm.image}
                                alt="תצוגה מקדימה"
                                onError={(e) => {
                                    if (!e.target.dataset.tried1) {
                                        e.target.dataset.tried1 = 'true';
                                        const orig = initialProducts.find(ip => String(ip.id) === String(editingProduct?.id));
                                        if (orig?.image) { e.target.src = orig.image; return; }
                                    }
                                    e.target.onerror = null;
                                    e.target.src = IMG_FALLBACK;
                                }}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <AdminInput label="תיאור מוצר" value={editForm.description} onChange={v => setField('description', v)} rows={3} placeholder="תאר את המוצר..." />

                    {/* Storefront badges */}
                    <div className="bg-[#F5F5F7] rounded-2xl p-4 space-y-3">
                        <p className="text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em] text-right">תגיות חלון ראווה</p>
                        <AdminToggle
                            label="מוצר חדש ✨"
                            sub="מציג badge 'חדש' בקטלוג ובדף גילוי"
                            value={editForm.isNew}
                            onChange={v => setField('isNew', v)}
                        />
                        <AdminToggle
                            label="מוצר מוצג (Featured) 🌟"
                            sub="מופיע ב-Hero Spotlight בדף גילוי — רק מוצר אחד"
                            value={editForm.isFeatured}
                            onChange={v => setField('isFeatured', v)}
                        />
                    </div>

                    {/* Specs */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={addSpec}
                                className="text-[#007AFF] text-xs font-bold hover:underline">+ הוסף מפרט</button>
                            <label className="text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em]">מפרט טכני</label>
                        </div>
                        <div className="space-y-2">
                            {(editForm.specs || []).map((s, i) => (
                                <SpecRow key={i} spec={s} onChange={v => updateSpec(i, v)} onRemove={() => removeSpec(i)} />
                            ))}
                            {(!editForm.specs || editForm.specs.length === 0) && (
                                <p className="text-[#AEAEB2] text-xs text-center py-2">לחץ + כדי להוסיף מפרטים</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2 items-center">
                        {!isNew && (
                            <button type="button" onClick={handleDelete}
                                className="px-3 py-2 rounded-xl text-xs font-black transition-all"
                                style={{
                                    background: confirmDelete ? '#FF3B30' : 'rgba(255,59,48,0.08)',
                                    color: confirmDelete ? 'white' : '#FF3B30',
                                }}>
                                {confirmDelete ? '⚠ אשר מחיקה' : 'מחק'}
                            </button>
                        )}
                        <div className="flex-1" />
                        <AdminButton variant="ghost" onClick={() => { setEditingProduct(null); setConfirmDelete(false); }}>ביטול</AdminButton>
                        <AdminButton onClick={handleSave}>
                            {saved ? '✓ נשמר!' : isNew ? 'הוסף מוצר' : 'שמור שינויים'}
                        </AdminButton>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}
