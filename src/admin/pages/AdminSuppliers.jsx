/* eslint-disable */
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, addDoc,
    serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import {
    Plus, X, Phone, Mail, MessageCircle, ExternalLink,
    FileText, Trash2, Check, Search, Building2, Package,
    Clock, CheckCircle2, ShoppingCart, RefreshCw,
    Globe, User, Hash, Truck, Box, CreditCard,
    BarChart3, ArrowUpDown, Edit2, ChevronRight,
    Scale, TrendingDown, Star, Layers,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const G = {
    background: 'rgba(255,255,255,0.90)',
    backdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: 20,
};
const CARD = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(0,0,0,0.05)',
    boxShadow: '0 2px 14px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: 16,
};

// ─── Constants ──────────────────────────────────────────────────────────────────
const NEG_STAGES = [
    { id: 'received',    label: 'התקבלה',    color: '#007AFF', icon: Package },
    { id: 'reviewing',  label: 'בבדיקה',     color: '#FF9500', icon: Search },
    { id: 'negotiating',label: 'במשא ומתן', color: '#5856D6', icon: ArrowUpDown },
    { id: 'agreed',     label: 'הוסכם',      color: '#34C759', icon: CheckCircle2 },
    { id: 'ordered',    label: 'הוזמן',      color: '#30D158', icon: ShoppingCart },
];

const DELIVERY_OPTS = [
    { id: 'courier',   label: 'שליח' },
    { id: 'pickup',    label: 'איסוף עצמי' },
    { id: 'dropship',  label: 'Drop-ship' },
    { id: 'freight',   label: 'משלוח מלא' },
];
const STOCK_OPTS = [
    { id: 'stock',       label: 'מלאי פיזי' },
    { id: 'dropship',    label: 'Drop-ship' },
    { id: 'preorder',    label: 'הזמנה מראש' },
    { id: 'consignment', label: 'קונסיגנציה' },
];
const PAYMENT_OPTS = ['מזומן', 'שוטף+30', 'שוטף+60', '30 ימים', '60 ימים', 'אשראי', 'העברה בנקאית'];

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = n  => n  ? `₪${Number(n).toLocaleString('he-IL')}` : '—';
const uid  = () => Math.random().toString(36).slice(2, 10);
const fmtD = ts => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

function calcTotal(products = []) {
    return products.reduce((s, p) => {
        const base = (Number(p.pricePerUnit) || 0) * (Number(p.quantity) || 1);
        return s + base * (1 - (Number(p.discount) || 0) / 100);
    }, 0);
}

// ─── SupplierAvatar ────────────────────────────────────────────────────────────
function SupplierAvatar({ domain, name, size = 48 }) {
    const [err, setErr] = useState(false);
    const initials = (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
    const COLORS = ['#007AFF', '#5856D6', '#FF9500', '#FF2D55', '#34C759'];
    const bg = COLORS[(name || '').charCodeAt(0) % COLORS.length];
    const r = Math.round(size * 0.25);

    if (domain && !err) {
        return (
            <img
                src={`https://logo.clearbit.com/${domain}`}
                alt={name}
                onError={() => setErr(true)}
                style={{ width: size, height: size, borderRadius: r, objectFit: 'contain', background: '#fff', padding: Math.round(size * 0.07), border: '1px solid rgba(0,0,0,0.07)', flexShrink: 0 }}
            />
        );
    }
    return (
        <div style={{ width: size, height: size, borderRadius: r, background: `linear-gradient(135deg,${bg},${bg}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: Math.round(size * 0.36), fontWeight: 900, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

// ─── StagePill ─────────────────────────────────────────────────────────────────
function StagePill({ stageId, sm }) {
    const s = NEG_STAGES.find(n => n.id === stageId) || NEG_STAGES[0];
    const I = s.icon;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? 4 : 5, padding: sm ? '3px 8px' : '5px 12px', borderRadius: 99, background: `${s.color}18`, color: s.color, fontSize: sm ? 10 : 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
            <I size={sm ? 9 : 10} />{s.label}
        </span>
    );
}

// ─── NegotiationPipeline ───────────────────────────────────────────────────────
function NegotiationPipeline({ status, onChange }) {
    const cur = NEG_STAGES.findIndex(s => s.id === status);
    return (
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
            {NEG_STAGES.map((s, i) => {
                const done   = i < cur;
                const active = i === cur;
                const I = s.icon;
                return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < NEG_STAGES.length - 1 ? '1 1 0' : 'none' }}>
                        <motion.button
                            onClick={() => onChange?.(s.id)}
                            whileHover={{ scale: onChange ? 1.05 : 1 }}
                            whileTap={{ scale: onChange ? 0.95 : 1 }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                padding: '6px 8px', borderRadius: 12,
                                border: active ? `2px solid ${s.color}` : `1.5px solid ${done ? s.color + '40' : 'rgba(0,0,0,0.07)'}`,
                                background: active ? `${s.color}14` : done ? `${s.color}07` : 'rgba(0,0,0,0.02)',
                                cursor: onChange ? 'pointer' : 'default', minWidth: 64, transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: active ? s.color : done ? `${s.color}28` : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {done ? <Check size={13} color={s.color} /> : <I size={13} color={active ? '#fff' : done ? s.color : '#AEAEB2'} />}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, color: active ? s.color : done ? s.color : '#AEAEB2', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </motion.button>
                        {i < NEG_STAGES.length - 1 && (
                            <div style={{ flex: 1, height: 2, background: done ? `${s.color}35` : 'rgba(0,0,0,0.05)', margin: '0 2px', minWidth: 10 }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── ContactRow ────────────────────────────────────────────────────────────────
function ContactRow({ phone, email, website }) {
    const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '972')}` : null;
    return (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {phone && <a href={`tel:${phone}`} style={ctaStyle('#007AFF')}><Phone size={12} />{phone}</a>}
            {wa    && <a href={wa} target="_blank" rel="noreferrer" style={ctaStyle('#25D366')}><MessageCircle size={12} />WhatsApp</a>}
            {email && <a href={`mailto:${email}`} style={ctaStyle('#FF2D55')}><Mail size={12} />{email}</a>}
            {website && <a href={website} target="_blank" rel="noreferrer" style={ctaStyle('#5856D6')}><Globe size={12} />אתר</a>}
        </div>
    );
}
const ctaStyle = c => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, background: `${c}10`, color: c, fontSize: 11, fontWeight: 700, textDecoration: 'none', border: `1px solid ${c}18` });

// ─── SectionLabel ──────────────────────────────────────────────────────────────
function SL({ icon, label, extra }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: '#AEAEB2', display: 'flex' }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.07em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
            {extra}
        </div>
    );
}

// ─── Form fields ───────────────────────────────────────────────────────────────
const inputCss = { padding: '8px 11px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 12, fontWeight: 600, color: '#1D1D1F', outline: 'none', textAlign: 'right', direction: 'rtl', width: '100%', boxSizing: 'border-box' };

function TF({ label, value, onChange, placeholder }) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><LBL>{label}</LBL><input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} style={inputCss} /></div>;
}
function NF({ label, value, onChange }) {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><LBL>{label}</LBL><input type="number" value={value || ''} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...inputCss, textAlign: 'center' }} /></div>;
}
function SF({ label, value, onChange, options }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <LBL>{label}</LBL>
            <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...inputCss, cursor: 'pointer' }}>
                <option value="">— בחר —</option>
                {options.map(o => <option key={o.id || o} value={o.id || o}>{o.label || o}</option>)}
            </select>
        </div>
    );
}
function LBL({ children }) {
    return <label style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.05em' }}>{children}</label>;
}

// ─── ProductLookupRow ──────────────────────────────────────────────────────────
function ProductRow({ product: p, onChange, onDelete }) {
    const [busy, setBusy] = useState(false);
    const [imgErr, setImgErr] = useState(false);

    const lookup = async () => {
        if (!p.modelNumber) return;
        setBusy(true);
        try {
            if (/^\d{8,14}$/.test(p.modelNumber.trim())) {
                const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${p.modelNumber.trim()}`);
                if (res.ok) {
                    const data = await res.json();
                    const item = data.items?.[0];
                    if (item) {
                        onChange({ ...p, name: item.title || p.name, brand: item.brand || p.brand, imageUrl: item.images?.[0] || p.imageUrl, specs: item.description || p.specs });
                        setBusy(false); return;
                    }
                }
            }
            // Fallback — open Google Shopping
            window.open(`https://www.google.com/search?q=${encodeURIComponent(p.modelNumber + ' מפרט מחיר')}&tbm=shop`, '_blank');
        } catch {}
        setBusy(false);
    };

    const subtotal = calcTotal([p]);

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            style={{ ...CARD, padding: 14, marginBottom: 10 }}>
            {/* Row 1: image + name + model + delete */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(0,0,0,0.04)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.imageUrl && !imgErr ? <img src={p.imageUrl} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Box size={20} color="#AEAEB2" />}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={p.name || ''} onChange={e => onChange({ ...p, name: e.target.value })} placeholder="שם המוצר" style={{ ...inputCss, fontSize: 13, fontWeight: 700 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input value={p.modelNumber || ''} onChange={e => onChange({ ...p, modelNumber: e.target.value })} placeholder="מס׳ דגם / ברקוד" style={{ ...inputCss, flex: 1, fontSize: 11 }} />
                        <motion.button onClick={lookup} disabled={busy || !p.modelNumber} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                            style={{ padding: '6px 10px', borderRadius: 9, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, cursor: p.modelNumber ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {busy ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}{busy ? '...' : 'חפש'}
                        </motion.button>
                    </div>
                    <input value={p.imageUrl || ''} onChange={e => onChange({ ...p, imageUrl: e.target.value })} placeholder="קישור תמונה (URL)" style={{ ...inputCss, fontSize: 10, color: '#86868B' }} />
                </div>
                <motion.button onClick={onDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{ padding: 6, borderRadius: 8, border: 'none', background: 'rgba(255,59,48,0.08)', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', alignSelf: 'flex-start' }}>
                    <Trash2 size={12} />
                </motion.button>
            </div>

            {/* Row 2: price / qty / discount / total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                {[['pricePerUnit', 'מחיר ליח׳ (₪)', 'number'], ['quantity', 'כמות', 'number'], ['discount', 'הנחה %', 'number']].map(([k, lbl, t]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <LBL>{lbl}</LBL>
                        <input type={t} value={p[k] || ''} onChange={e => onChange({ ...p, [k]: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="0"
                            style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 13, fontWeight: 700, color: '#1D1D1F', outline: 'none', textAlign: 'center' }} />
                    </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <LBL>סה"כ</LBL>
                    <div style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(0,122,255,0.07)', fontSize: 13, fontWeight: 900, color: '#007AFF', textAlign: 'center', lineHeight: '22px' }}>{fmt(subtotal)}</div>
                </div>
            </div>

            {/* Row 3: product page link */}
            <div style={{ display: 'flex', gap: 6 }}>
                <input value={p.productPageUrl || ''} onChange={e => onChange({ ...p, productPageUrl: e.target.value })} placeholder="קישור לעמוד המוצר אצל הספק"
                    style={{ ...inputCss, fontSize: 11, flex: 1 }} />
                {p.productPageUrl && (
                    <a href={p.productPageUrl} target="_blank" rel="noreferrer"
                        style={{ padding: '6px 10px', borderRadius: 9, background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <ExternalLink size={11} />פתח
                    </a>
                )}
            </div>

            {p.specs && (
                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.02)', fontSize: 11, color: '#6E6E73', lineHeight: 1.6, direction: 'rtl', textAlign: 'right' }}>{p.specs}</div>
            )}
        </motion.div>
    );
}

// ─── Docs section ──────────────────────────────────────────────────────────────
function DocsSection({ docs, onAdd, onRemove }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [url,  setUrl]  = useState('');

    const add = () => {
        if (!name.trim()) return;
        onAdd({ name: name.trim(), url: url.trim(), addedAt: Date.now() });
        setName(''); setUrl(''); setOpen(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(docs || []).map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(88,86,214,0.04)', border: '1px solid rgba(88,86,214,0.10)' }}>
                    <FileText size={13} color="#5856D6" />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1D1D1F', textAlign: 'right' }}>{d.name}</span>
                    {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ color: '#007AFF' }}><ExternalLink size={12} /></a>}
                    <button onClick={() => onRemove(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#FF3B30', padding: 3, display: 'flex' }}><X size={11} /></button>
                </div>
            ))}
            {open ? (
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(0,122,255,0.04)', border: '1px solid rgba(0,122,255,0.10)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="שם המסמך" style={{ ...inputCss }} />
                    <input value={url}  onChange={e => setUrl(e.target.value)}  placeholder="קישור PDF / Google Drive" style={{ ...inputCss, direction: 'ltr', textAlign: 'left' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={add} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#007AFF', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>הוסף</button>
                        <button onClick={() => setOpen(false)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 12 }}>ביטול</button>
                    </div>
                </div>
            ) : (
                <motion.button onClick={() => setOpen(true)} whileHover={{ scale: 1.02 }}
                    style={{ padding: 9, borderRadius: 10, border: '1.5px dashed rgba(0,122,255,0.22)', background: 'rgba(0,122,255,0.03)', color: '#007AFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={12} />הוסף מסמך
                </motion.button>
            )}
        </div>
    );
}

// ─── QuoteDrawer ───────────────────────────────────────────────────────────────
function QuoteDrawer({ quote, supplier, onClose, showToast }) {
    const [d, setD] = useState(() => JSON.parse(JSON.stringify(quote)));
    const [saving, setSaving] = useState(false);
    const [note, setNote]     = useState('');
    const [addingNote, setAN] = useState(false);
    const dirty = JSON.stringify(d) !== JSON.stringify(quote);
    const upd = (k, v) => setD(p => ({ ...p, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            const { id, createdAt, ...rest } = d;
            await updateDoc(doc(db, 'supplier_quotes', quote.id), { ...rest, updatedAt: serverTimestamp() });
            showToast('הצעה עודכנה', 'success');
        } catch { showToast('שגיאה בשמירה', 'error'); }
        setSaving(false);
    };

    const addNote = async () => {
        if (!note.trim()) return;
        setAN(true);
        const n = { text: note.trim(), ts: Date.now(), author: 'Admin' };
        try {
            await updateDoc(doc(db, 'supplier_quotes', quote.id), { notes: arrayUnion(n) });
            setD(p => ({ ...p, notes: [...(p.notes || []), n] }));
            setNote('');
        } catch { showToast('שגיאה', 'error'); }
        setAN(false);
    };

    const delQuote = async () => {
        if (!confirm('למחוק הצעה זו?')) return;
        try {
            await deleteDoc(doc(db, 'supplier_quotes', quote.id));
            onClose();
        } catch { showToast('שגיאה במחיקה', 'error'); }
    };

    const updProd = (i, u) => { const a = [...(d.products || [])]; a[i] = u; upd('products', a); };
    const remProd = i => { const a = [...(d.products || [])]; a.splice(i, 1); upd('products', a); };
    const addProd = () => upd('products', [...(d.products || []), { id: uid(), modelNumber: '', name: '', pricePerUnit: 0, quantity: 1, discount: 0 }]);

    const total = calcTotal(d.products);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { if (dirty && !confirm('יש שינויים שלא נשמרו. לסגור?')) return; onClose(); }}
                style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(3px)' }} />

            <motion.div
                initial={{ x: -440, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -440, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 330, damping: 34 }}
                style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(700px, calc(100vw - 24px))', zIndex: 49, display: 'flex', flexDirection: 'column', background: 'rgba(248,248,252,0.97)', backdropFilter: 'blur(40px) saturate(180%)', borderRight: '1px solid rgba(255,255,255,0.65)', boxShadow: '10px 0 56px rgba(0,0,0,0.13)' }}
                dir="rtl"
            >
                {/* Sticky header */}
                <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SupplierAvatar domain={supplier?.domain} name={supplier?.name} size={38} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1F' }}>{supplier?.name || 'ספק'}</div>
                        <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>הצעה #{d.quoteNumber || quote.id?.slice(-6)} · {fmtD(quote.createdAt)}</div>
                    </div>
                    <StagePill stageId={d.status} />
                    <button onClick={delQuote} title="מחק הצעה" style={{ padding: 7, borderRadius: 9, border: 'none', background: 'rgba(255,59,48,0.08)', cursor: 'pointer', color: '#FF3B30', display: 'flex' }}><Trash2 size={14} /></button>
                    <button onClick={() => { if (dirty && !confirm('יש שינויים שלא נשמרו. לסגור?')) return; onClose(); }}
                        style={{ padding: 7, borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', color: '#AEAEB2', display: 'flex' }}><X size={15} /></button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '22px 22px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>

                        {/* 1 · Pipeline */}
                        <section>
                            <SL icon={<ArrowUpDown size={12} />} label="שלב משא ומתן" />
                            <NegotiationPipeline status={d.status} onChange={v => upd('status', v)} />
                        </section>

                        {/* 2 · Products */}
                        <section>
                            <SL icon={<Package size={12} />} label={`מוצרים (${(d.products || []).length})`}
                                extra={
                                    <motion.button onClick={addProd} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 8, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                        <Plus size={11} />מוצר
                                    </motion.button>
                                } />
                            <AnimatePresence>
                                {(d.products || []).map((p, i) => (
                                    <ProductRow key={p.id || i} product={p} onChange={u => updProd(i, u)} onDelete={() => remProd(i)} />
                                ))}
                            </AnimatePresence>
                            {(d.products || []).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '18px 0', color: '#AEAEB2', fontSize: 13 }}>לחץ "+ מוצר" להוסיף</div>
                            )}
                            {(d.products || []).length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                                    <div style={{ padding: '8px 18px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(0,122,255,0.08),rgba(88,86,214,0.08))', fontSize: 15, fontWeight: 900, color: '#1D1D1F' }}>
                                        סה"כ הצעה: <span style={{ color: '#007AFF' }}>{fmt(total)}</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 3 · Terms */}
                        <section>
                            <SL icon={<CreditCard size={12} />} label="תנאי עסקה" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <SF label="שיטת אספקה"   value={d.deliveryMethod} onChange={v => upd('deliveryMethod', v)} options={DELIVERY_OPTS} />
                                <SF label="סוג מלאי"     value={d.stockType}      onChange={v => upd('stockType', v)}      options={STOCK_OPTS} />
                                <NF label="זמן אספקה (ימים)" value={d.leadTimeDays}  onChange={v => upd('leadTimeDays', v)} />
                                <NF label="אחריות (חודשים)"  value={d.warrantyMonths} onChange={v => upd('warrantyMonths', v)} />
                                <SF label="תנאי תשלום"   value={d.paymentTerms}   onChange={v => upd('paymentTerms', v)}   options={PAYMENT_OPTS.map(o => ({ id: o, label: o }))} />
                                <TF label="MOQ מינימום"  value={d.moq}            onChange={v => upd('moq', v)}            placeholder="לדוג׳ 10 יח׳" />
                            </div>
                        </section>

                        {/* 4 · Quote meta */}
                        <section>
                            <SL icon={<Hash size={12} />} label="פרטי הצעה" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <TF label="מספר הצעה"        value={d.quoteNumber} onChange={v => upd('quoteNumber', v)} placeholder="Q-2024-001" />
                                <TF label="תוקף ההצעה"       value={d.validUntil}  onChange={v => upd('validUntil', v)}  placeholder="DD/MM/YY" />
                            </div>
                        </section>

                        {/* 5 · Docs */}
                        <section>
                            <SL icon={<FileText size={12} />} label="מסמכים" />
                            <DocsSection docs={d.docs}
                                onAdd={doc => upd('docs', [...(d.docs || []), doc])}
                                onRemove={i => { const a = [...(d.docs || [])]; a.splice(i, 1); upd('docs', a); }} />
                        </section>

                        {/* 6 · Notes */}
                        <section>
                            <SL icon={<Clock size={12} />} label="הערות משא ומתן" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[...(d.notes || [])].reverse().map((n, i) => (
                                    <div key={i} style={{ ...CARD, padding: '10px 14px', display: 'flex', gap: 10 }}>
                                        <div style={{ flex: 1, fontSize: 13, color: '#1D1D1F', lineHeight: 1.55, textAlign: 'right' }}>{n.text}</div>
                                        <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600, whiteSpace: 'nowrap', marginTop: 2 }}>{new Date(n.ts).toLocaleDateString('he-IL')}</div>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addNote()}
                                        placeholder="הוסף הערה על המשא ומתן..."
                                        style={{ ...inputCss, flex: 1, padding: '10px 14px', borderRadius: 12, fontSize: 13 }} />
                                    <motion.button onClick={addNote} disabled={!note.trim() || addingNote} whileHover={{ scale: note.trim() ? 1.04 : 1 }} whileTap={{ scale: note.trim() ? 0.96 : 1 }}
                                        style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: note.trim() ? '#007AFF' : 'rgba(0,0,0,0.06)', color: note.trim() ? '#fff' : '#AEAEB2', fontSize: 13, fontWeight: 700, cursor: note.trim() ? 'pointer' : 'not-allowed' }}>
                                        {addingNote ? '...' : 'שמור'}
                                    </motion.button>
                                </div>
                            </div>
                        </section>

                        {/* 7 · Email */}
                        {supplier?.agentEmail && (
                            <section>
                                <SL icon={<Mail size={12} />} label="מיילים" />
                                <a href={`https://mail.google.com/mail/#search/${encodeURIComponent(supplier.agentEmail)}`} target="_blank" rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12, background: 'rgba(255,45,85,0.07)', color: '#FF2D55', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,45,85,0.12)' }}>
                                    <Mail size={14} />פתח שרשור מיילים עם {supplier.agentEmail}<ExternalLink size={11} />
                                </a>
                            </section>
                        )}
                    </div>
                </div>

                {/* Sticky save bar */}
                <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)' }}>
                    <motion.button onClick={save} disabled={!dirty || saving} whileHover={{ scale: dirty ? 1.02 : 1 }} whileTap={{ scale: dirty ? 0.98 : 1 }}
                        style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: dirty ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'rgba(0,0,0,0.05)', color: dirty ? '#fff' : '#AEAEB2', fontSize: 14, fontWeight: 800, cursor: dirty ? 'pointer' : 'not-allowed', boxShadow: dirty ? '0 4px 18px rgba(0,122,255,0.28)' : 'none', transition: 'all 0.2s' }}>
                        {saving ? 'שומר...' : dirty ? 'שמור שינויים' : 'אין שינויים'}
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
}

// ─── QuoteCard ─────────────────────────────────────────────────────────────────
function QuoteCard({ quote, onClick }) {
    const total = calcTotal(quote.products);
    const stage = NEG_STAGES.find(s => s.id === quote.status) || NEG_STAGES[0];
    const pct   = (NEG_STAGES.findIndex(s => s.id === quote.status) / (NEG_STAGES.length - 1)) * 100;

    return (
        <motion.div onClick={onClick} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, boxShadow: '0 14px 44px rgba(0,0,0,0.11)' }} whileTap={{ scale: 0.98 }}
            style={{ ...G, padding: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            {/* Progress strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.04)', borderRadius: '20px 20px 0 0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: `linear-gradient(90deg,${stage.color},${stage.color}88)`, borderRadius: '20px 20px 0 0' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>הצעה #{quote.quoteNumber || quote.id?.slice(-6)}</div>
                    <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, marginTop: 1 }}>
                        {fmtD(quote.createdAt)}{quote.validUntil ? ` · עד ${quote.validUntil}` : ''}
                    </div>
                </div>
                <StagePill stageId={quote.status} sm />
            </div>

            {/* Product chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {(quote.products || []).slice(0, 3).map((p, i) => (
                    <span key={i} style={{ padding: '3px 8px', borderRadius: 7, background: 'rgba(0,0,0,0.04)', fontSize: 11, fontWeight: 600, color: '#3C3C43', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name || p.modelNumber || 'מוצר'}
                    </span>
                ))}
                {(quote.products || []).length > 3 && (
                    <span style={{ padding: '3px 8px', borderRadius: 7, background: 'rgba(0,122,255,0.08)', fontSize: 11, fontWeight: 700, color: '#007AFF' }}>+{(quote.products || []).length - 3}</span>
                )}
                {(quote.products || []).length === 0 && (
                    <span style={{ fontSize: 11, color: '#AEAEB2' }}>אין מוצרים עדיין</span>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    {quote.leadTimeDays && <span style={{ fontSize: 10, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 3 }}><Truck size={9} />{quote.leadTimeDays} ימים</span>}
                    {quote.paymentTerms && <span style={{ fontSize: 10, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 3 }}><CreditCard size={9} />{quote.paymentTerms}</span>}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F' }}>{total > 0 ? fmt(total) : '—'}</div>
            </div>
            <ChevronRight size={13} style={{ position: 'absolute', top: 20, left: 18, color: '#C7C7CC' }} />
        </motion.div>
    );
}

// ─── SupplierView ──────────────────────────────────────────────────────────────
function SupplierView({ supplier, quotes, onAddQuote, onSelectQuote, onEditSupplier }) {
    const totalVal = quotes.reduce((s, q) => s + calcTotal(q.products), 0);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Hero */}
            <div style={{ ...G, padding: 24 }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                    <SupplierAvatar domain={supplier.domain} name={supplier.name} size={68} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F' }}>{supplier.name}</span>
                            <motion.button onClick={onEditSupplier} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                                style={{ padding: 5, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', color: '#AEAEB2', display: 'flex' }}>
                                <Edit2 size={12} />
                            </motion.button>
                        </div>
                        {supplier.agentName && (
                            <div style={{ fontSize: 13, color: '#6E6E73', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <User size={11} />{supplier.agentName}{supplier.agentTitle ? ` · ${supplier.agentTitle}` : ''}
                            </div>
                        )}
                        <ContactRow phone={supplier.agentPhone} email={supplier.agentEmail} website={supplier.website} />
                    </div>

                    {/* KPI strip */}
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <KPIBox label="הצעות" value={quotes.length} color="#007AFF" />
                        <KPIBox label="ערך כולל" value={fmt(totalVal)} color="#34C759" small />
                    </div>
                </div>
            </div>

            {/* Quotes header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F' }}>הצעות מחיר</span>
                <motion.button onClick={onAddQuote} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,122,255,0.26)' }}>
                    <Plus size={14} />הצעה חדשה
                </motion.button>
            </div>

            {quotes.length === 0 ? (
                <Empty icon={<Package size={30} />} text="אין הצעות עדיין" sub="לחץ על ׳הצעה חדשה׳ כדי להתחיל" />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    <AnimatePresence>
                        {quotes.map(q => <QuoteCard key={q.id} quote={q} onClick={() => onSelectQuote(q)} />)}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function KPIBox({ label, value, color, small }) {
    return (
        <div style={{ padding: '10px 16px', borderRadius: 14, background: `${color}08`, textAlign: 'center', minWidth: 72 }}>
            <div style={{ fontSize: small ? 14 : 20, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2' }}>{label}</div>
        </div>
    );
}

// ─── CompareTab ────────────────────────────────────────────────────────────────
function CompareTab({ suppliers, quotes }) {
    // Build matrix: productKey → {label, model, image, rows: {supplierId → {price, qty}[]}}
    const matrix = useMemo(() => {
        const map = {};
        quotes.forEach(q => {
            (q.products || []).forEach(p => {
                const key = (p.modelNumber || p.name || '').trim();
                if (!key) return;
                if (!map[key]) map[key] = { label: p.name || p.modelNumber, model: p.modelNumber, image: p.imageUrl, rows: {} };
                if (!map[key].rows[q.supplierId]) map[key].rows[q.supplierId] = [];
                const price = (Number(p.pricePerUnit) || 0) * (1 - (Number(p.discount) || 0) / 100);
                map[key].rows[q.supplierId].push({ price, qty: Number(p.quantity) || 1, quoteId: q.id, qNum: q.quoteNumber || q.id?.slice(-6) });
            });
        });
        return Object.values(map).filter(r => Object.keys(r.rows).length > 0);
    }, [quotes]);

    if (matrix.length === 0) return <Empty icon={<Layers size={34} />} text="אין נתונים להשוואה" sub="הוסף הצעות מחיר עם מוצרים כדי לראות השוואה" />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Supplier summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {suppliers.map(s => {
                    const sQ = quotes.filter(q => q.supplierId === s.id);
                    const wins = matrix.filter(row => {
                        const all = Object.entries(row.rows).flatMap(([sid, es]) => es.map(e => ({ sid, price: e.price })));
                        if (all.length < 2) return false;
                        const min = Math.min(...all.map(e => e.price));
                        return row.rows[s.id]?.some(e => e.price <= min + 0.01);
                    }).length;
                    const tot = sQ.reduce((sum, q) => sum + calcTotal(q.products), 0);
                    return (
                        <div key={s.id} style={{ ...CARD, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <SupplierAvatar domain={s.domain} name={s.name} size={38} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: '#AEAEB2' }}>{sQ.length} הצעות · {fmt(tot)}</div>
                                {wins > 0 && <div style={{ fontSize: 11, color: '#34C759', fontWeight: 800, marginTop: 2 }}>🏆 זול ב-{wins} מוצרים</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Price matrix table */}
            <div style={{ ...G, overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart3 size={14} color="#007AFF" />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>השוואת מחירים</span>
                    <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>· {matrix.length} מוצרים</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl', fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.015)' }}>
                                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: '#6E6E73', fontSize: 11 }}>מוצר</th>
                                {suppliers.map(s => (
                                    <th key={s.id} style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#6E6E73' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                            <SupplierAvatar domain={s.domain} name={s.name} size={18} />{s.name}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 800, fontSize: 11, color: '#34C759' }}>✓ זול ביותר</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.map((row, ri) => {
                                const allE = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id })));
                                const prices = allE.map(e => e.price).filter(x => x > 0);
                                const minP = prices.length ? Math.min(...prices) : 0;
                                const maxP = prices.length ? Math.max(...prices) : 0;
                                const bestSid = allE.find(e => e.price === minP)?.sid;
                                const bestS = suppliers.find(s => s.id === bestSid);
                                return (
                                    <tr key={row.key || ri} style={{ borderBottom: '1px solid rgba(0,0,0,0.035)', background: ri % 2 ? 'rgba(0,0,0,0.008)' : 'transparent' }}>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                {row.image && <img src={row.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: 'rgba(0,0,0,0.03)' }} onError={e => { e.target.style.display = 'none'; }} />}
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#1D1D1F' }}>{row.label}</div>
                                                    {row.model && <div style={{ fontSize: 10, color: '#AEAEB2' }}>{row.model}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        {suppliers.map(s => {
                                            const entries = row.rows[s.id] || [];
                                            if (!entries.length) return <td key={s.id} style={{ padding: '12px 16px', textAlign: 'center', color: '#D1D1D6', fontSize: 18 }}>—</td>;
                                            const best = entries.reduce((a, b) => a.price < b.price ? a : b);
                                            const isBest  = prices.length > 1 && best.price <= minP + 0.01;
                                            const isWorst = prices.length > 1 && best.price >= maxP - 0.01;
                                            const diff = minP > 0 ? ((best.price - minP) / minP * 100) : 0;
                                            return (
                                                <td key={s.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <div style={{
                                                        display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                                        padding: '6px 12px', borderRadius: 10,
                                                        background: isBest ? 'rgba(52,199,89,0.10)' : isWorst ? 'rgba(255,59,48,0.06)' : 'rgba(0,0,0,0.03)',
                                                        border: `1px solid ${isBest ? 'rgba(52,199,89,0.28)' : isWorst ? 'rgba(255,59,48,0.15)' : 'transparent'}`,
                                                    }}>
                                                        <span style={{ fontSize: 14, fontWeight: 900, color: isBest ? '#34C759' : isWorst ? '#FF3B30' : '#1D1D1F' }}>{fmt(best.price)}</span>
                                                        {diff > 0.5 && <span style={{ fontSize: 10, color: '#FF3B30', fontWeight: 800 }}>+{diff.toFixed(0)}%</span>}
                                                        <span style={{ fontSize: 10, color: '#AEAEB2' }}>#{best.qNum}</span>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {bestS ? (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                                    <SupplierAvatar domain={bestS.domain} name={bestS.name} size={20} />
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#34C759' }}>{bestS.name}</span>
                                                </div>
                                            ) : <span style={{ color: '#D1D1D6' }}>—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bar charts per product */}
            {matrix.map((row, ri) => {
                const allE = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id })));
                if (allE.length < 2) return null;
                const maxP = Math.max(...allE.map(e => e.price));
                return (
                    <div key={row.key || ri} style={{ ...CARD, padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                            {row.image && <img src={row.image} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 7, background: 'rgba(0,0,0,0.03)' }} onError={e => { e.target.style.display = 'none'; }} />}
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>{row.label}</div>
                            {row.model && <div style={{ fontSize: 11, color: '#AEAEB2' }}>{row.model}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[...allE].sort((a, b) => a.price - b.price).map((e, i) => {
                                const s = suppliers.find(x => x.id === e.sid);
                                const pct = maxP > 0 ? (e.price / maxP) * 100 : 0;
                                return (
                                    <div key={`${e.sid}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                                            <SupplierAvatar domain={s?.domain} name={s?.name || e.sid} size={16} />
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>{s?.name || e.sid}</span>
                                        </div>
                                        <div style={{ flex: 1, height: 26, background: 'rgba(0,0,0,0.04)', borderRadius: 7, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.65, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                                style={{ height: '100%', background: i === 0 ? 'linear-gradient(90deg,#34C759,#30D158)' : 'linear-gradient(90deg,#007AFF,#5856D6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, minWidth: 44 }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{fmt(e.price)}</span>
                                            </motion.div>
                                        </div>
                                        {i === 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#34C759', whiteSpace: 'nowrap' }}>✓ זול</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon, text, sub }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10 }}>
            <div style={{ color: '#D1D1D6', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#6E6E73' }}>{text}</div>
            {sub && <div style={{ fontSize: 12, color: '#AEAEB2' }}>{sub}</div>}
        </div>
    );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, extra, children }) {
    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => onClose()} style={{ position: 'fixed', inset: 0, zIndex: 58, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' }} />
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 22 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 59, width: 'min(520px,calc(100vw - 28px))', maxHeight: '92vh', overflowY: 'auto', borderRadius: 24, background: 'rgba(252,252,255,0.98)', backdropFilter: 'blur(40px) saturate(180%)', boxShadow: '0 28px 90px rgba(0,0,0,0.22)', padding: '24px 24px 28px', direction: 'rtl' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <span style={{ flex: 1, fontSize: 17, fontWeight: 900, color: '#1D1D1F' }}>{title}</span>
                    {extra}
                    <button onClick={() => onClose()} style={{ padding: 8, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', color: '#AEAEB2', display: 'flex' }}><X size={15} /></button>
                </div>
                {children}
            </motion.div>
        </>
    );
}

function MF({ label, value, onChange, placeholder }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <LBL>{label}</LBL>
            <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''}
                style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 13, color: '#1D1D1F', outline: 'none', textAlign: 'right', direction: 'rtl', width: '100%', boxSizing: 'border-box' }} />
        </div>
    );
}

// ─── AddSupplierModal ──────────────────────────────────────────────────────────
function AddSupplierModal({ onClose, onAdded }) {
    const [form, setForm] = useState({ name: '', domain: '', agentName: '', agentTitle: '', agentPhone: '', agentEmail: '', website: '' });
    const [saving, setSaving] = useState(false);
    const f = k => v => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const ref = await addDoc(collection(db, 'suppliers'), { ...form, createdAt: serverTimestamp() });
            onAdded({ id: ref.id, ...form });
            onClose();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    return (
        <Modal title="הוסף ספק חדש" onClose={onClose}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}><MF label="שם החברה *" value={form.name}       onChange={f('name')}       placeholder="טכנו רצף" /></div>
                <MF label="דומיין (לוגו אוטומטי)"  value={form.domain}      onChange={f('domain')}     placeholder="techno-retzef.co.il" />
                <MF label="אתר"                     value={form.website}     onChange={f('website')}    placeholder="https://..." />
                <MF label="שם הסוכן"                value={form.agentName}   onChange={f('agentName')}  placeholder="ישראל ישראלי" />
                <MF label="תפקיד"                   value={form.agentTitle}  onChange={f('agentTitle')} placeholder="מנהל מכירות" />
                <MF label="טלפון"                   value={form.agentPhone}  onChange={f('agentPhone')} placeholder="050-0000000" />
                <MF label="אימייל"                  value={form.agentEmail}  onChange={f('agentEmail')} placeholder="agent@company.com" />
            </div>
            {form.domain && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)' }}>
                    <SupplierAvatar domain={form.domain} name={form.name} size={40} />
                    <span style={{ fontSize: 12, color: '#6E6E73' }}>תצוגה מקדימה של הלוגו</span>
                </div>
            )}
            <motion.button onClick={save} disabled={!form.name.trim() || saving} whileHover={{ scale: form.name.trim() ? 1.02 : 1 }} whileTap={{ scale: form.name.trim() ? 0.98 : 1 }}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: form.name.trim() ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'rgba(0,0,0,0.06)', color: form.name.trim() ? '#fff' : '#AEAEB2', fontSize: 14, fontWeight: 800, cursor: form.name.trim() ? 'pointer' : 'not-allowed', boxShadow: form.name.trim() ? '0 4px 22px rgba(0,122,255,0.28)' : 'none' }}>
                {saving ? 'מוסיף...' : 'הוסף ספק'}
            </motion.button>
        </Modal>
    );
}

// ─── EditSupplierModal ─────────────────────────────────────────────────────────
function EditSupplierModal({ supplier, onClose }) {
    const [form, setForm] = useState({ name: supplier.name || '', domain: supplier.domain || '', agentName: supplier.agentName || '', agentTitle: supplier.agentTitle || '', agentPhone: supplier.agentPhone || '', agentEmail: supplier.agentEmail || '', website: supplier.website || '' });
    const [saving,   setSaving]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const f = k => v => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        setSaving(true);
        try { await updateDoc(doc(db, 'suppliers', supplier.id), form); onClose(true); }
        catch (e) { console.error(e); }
        setSaving(false);
    };
    const del = async () => {
        if (!confirm(`למחוק את הספק "${supplier.name}"?`)) return;
        setDeleting(true);
        try { await deleteDoc(doc(db, 'suppliers', supplier.id)); onClose(true); }
        catch (e) { console.error(e); }
        setDeleting(false);
    };

    return (
        <Modal title="עריכת ספק" onClose={onClose}
            extra={<button onClick={del} disabled={deleting} style={{ padding: '7px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,59,48,0.10)', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting ? '...' : 'מחק ספק'}</button>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}><MF label="שם החברה" value={form.name}       onChange={f('name')}       /></div>
                <MF label="דומיין"    value={form.domain}      onChange={f('domain')}     placeholder="company.co.il" />
                <MF label="אתר"       value={form.website}     onChange={f('website')}    placeholder="https://..." />
                <MF label="שם הסוכן" value={form.agentName}   onChange={f('agentName')}  />
                <MF label="תפקיד"    value={form.agentTitle}  onChange={f('agentTitle')} />
                <MF label="טלפון"    value={form.agentPhone}  onChange={f('agentPhone')} />
                <MF label="אימייל"   value={form.agentEmail}  onChange={f('agentEmail')} />
            </div>
            {form.domain && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)' }}>
                    <SupplierAvatar domain={form.domain} name={form.name} size={40} />
                    <span style={{ fontSize: 12, color: '#6E6E73' }}>תצוגה מקדימה של הלוגו</span>
                </div>
            )}
            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,122,255,0.28)' }}>
                {saving ? 'שומר...' : 'שמור שינויים'}
            </motion.button>
        </Modal>
    );
}

// ─── AddQuoteModal ─────────────────────────────────────────────────────────────
function AddQuoteModal({ supplier, onClose }) {
    const [saving, setSaving] = useState(false);
    const save = async () => {
        setSaving(true);
        try {
            await addDoc(collection(db, 'supplier_quotes'), {
                supplierId: supplier.id, quoteNumber: '', status: 'received',
                products: [], deliveryMethod: '', stockType: '', leadTimeDays: '',
                paymentTerms: '', warrantyMonths: '', moq: '', validUntil: '',
                notes: [], docs: [], createdAt: serverTimestamp(),
            });
            onClose();
        } catch (e) { console.error(e); }
        setSaving(false);
    };
    return (
        <Modal title={`הצעה חדשה מ-${supplier.name}`} onClose={onClose}>
            <p style={{ fontSize: 13, color: '#6E6E73', marginBottom: 20, lineHeight: 1.6, textAlign: 'right' }}>
                תיווצר הצעה ריקה — לאחר מכן תוכל להוסיף מוצרים, מחירים ופרטי עסקה.
            </p>
            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,122,255,0.28)' }}>
                {saving ? 'יוצר...' : 'צור הצעה'}
            </motion.button>
        </Modal>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSuppliers() {
    const { showToast } = useAdminToast();
    const [suppliers,    setSuppliers]    = useState([]);
    const [quotes,       setQuotes]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [activeTab,    setActiveTab]    = useState(null);
    const [selectedQ,    setSelectedQ]    = useState(null);
    const [addSupplier,  setAddSupplier]  = useState(false);
    const [addQuote,     setAddQuote]     = useState(false);
    const [editSupplier, setEditSupplier] = useState(null);

    // Live Firestore listeners
    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'suppliers'), orderBy('createdAt', 'asc')),
            snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setSuppliers(data);
                setActiveTab(t => t ?? (data[0]?.id || 'compare'));
                setLoading(false);
            },
            () => setLoading(false)
        );
        return unsub;
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'supplier_quotes'), orderBy('createdAt', 'desc')),
            snap => setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return unsub;
    }, []);

    const activeSupplier = suppliers.find(s => s.id === activeTab);
    const activeQuotes   = activeTab === 'compare' ? quotes : quotes.filter(q => q.supplierId === activeTab);
    // Always show live version of selected quote
    const liveQ = selectedQ ? (quotes.find(q => q.id === selectedQ.id) || selectedQ) : null;

    const handleSupplierAdded = s => {
        setActiveTab(s.id);
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 28, height: 28, border: '3px solid rgba(0,122,255,0.14)', borderTopColor: '#007AFF', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div dir="rtl">
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>הצעות מחיר מספקים</h1>
                    <p style={{ fontSize: 13, color: '#AEAEB2', margin: '3px 0 0', fontWeight: 600 }}>ניהול הצעות · השוואת מחירים · מעקב משא ומתן</p>
                </div>
                <motion.button onClick={() => setAddSupplier(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 18px rgba(0,122,255,0.28)' }}>
                    <Plus size={15} />ספק חדש
                </motion.button>
            </div>

            {/* Tab bar */}
            {suppliers.length > 0 && (
                <div style={{ display: 'flex', gap: 7, marginBottom: 26, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                    {suppliers.map(s => {
                        const on = activeTab === s.id;
                        const cnt = quotes.filter(q => q.supplierId === s.id).length;
                        return (
                            <motion.button key={s.id} onClick={() => setActiveTab(s.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 14, border: on ? '1.5px solid rgba(0,122,255,0.30)' : '1.5px solid rgba(0,0,0,0.06)', background: on ? 'rgba(0,122,255,0.08)' : 'rgba(255,255,255,0.82)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, backdropFilter: 'blur(20px)', boxShadow: on ? '0 2px 14px rgba(0,122,255,0.14)' : '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.15s' }}>
                                <SupplierAvatar domain={s.domain} name={s.name} size={22} />
                                <span style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? '#007AFF' : '#1D1D1F' }}>{s.name}</span>
                                {cnt > 0 && <span style={{ padding: '2px 7px', borderRadius: 7, background: on ? 'rgba(0,122,255,0.16)' : 'rgba(0,0,0,0.06)', fontSize: 11, fontWeight: 800, color: on ? '#007AFF' : '#6E6E73' }}>{cnt}</span>}
                            </motion.button>
                        );
                    })}
                    {/* Compare tab — only if ≥2 suppliers */}
                    {suppliers.length >= 2 && (
                        <motion.button onClick={() => setActiveTab('compare')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 14, border: activeTab === 'compare' ? '1.5px solid rgba(88,86,214,0.30)' : '1.5px dashed rgba(0,0,0,0.10)', background: activeTab === 'compare' ? 'rgba(88,86,214,0.08)' : 'rgba(255,255,255,0.60)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, backdropFilter: 'blur(20px)', boxShadow: activeTab === 'compare' ? '0 2px 14px rgba(88,86,214,0.14)' : 'none' }}>
                            <Layers size={14} color={activeTab === 'compare' ? '#5856D6' : '#AEAEB2'} />
                            <span style={{ fontSize: 13, fontWeight: activeTab === 'compare' ? 800 : 600, color: activeTab === 'compare' ? '#5856D6' : '#6E6E73' }}>⚖ השוואה</span>
                        </motion.button>
                    )}
                    {/* Quick-add supplier */}
                    <motion.button onClick={() => setAddSupplier(true)} whileHover={{ scale: 1.02 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 14, border: '1.5px dashed rgba(0,122,255,0.22)', background: 'rgba(0,122,255,0.03)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, color: '#007AFF', fontSize: 12, fontWeight: 700 }}>
                        <Plus size={12} />ספק
                    </motion.button>
                </div>
            )}

            {/* Main content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}>
                    {suppliers.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 18 }}>
                            <div style={{ width: 88, height: 88, borderRadius: 26, background: 'linear-gradient(135deg,rgba(0,122,255,0.10),rgba(88,86,214,0.10))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building2 size={38} color="#007AFF" />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', marginBottom: 6 }}>אין ספקים עדיין</div>
                                <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 24 }}>הוסף ספק ראשון כדי להתחיל לנהל הצעות מחיר</div>
                                <motion.button onClick={() => setAddSupplier(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    style={{ padding: '13px 28px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,122,255,0.30)' }}>
                                    <Plus size={14} style={{ display: 'inline', marginLeft: 6 }} />הוסף ספק ראשון
                                </motion.button>
                            </div>
                        </div>
                    ) : activeTab === 'compare' ? (
                        <CompareTab suppliers={suppliers} quotes={quotes} />
                    ) : activeSupplier ? (
                        <SupplierView
                            supplier={activeSupplier}
                            quotes={activeQuotes}
                            onAddQuote={() => setAddQuote(true)}
                            onSelectQuote={setSelectedQ}
                            onEditSupplier={() => setEditSupplier(activeSupplier)}
                        />
                    ) : null}
                </motion.div>
            </AnimatePresence>

            {/* Drawers & Modals */}
            <AnimatePresence>
                {addSupplier && <AddSupplierModal key="add-sup" onClose={() => setAddSupplier(false)} onAdded={handleSupplierAdded} />}
                {addQuote && activeSupplier && <AddQuoteModal key="add-q" supplier={activeSupplier} onClose={() => setAddQuote(false)} />}
                {editSupplier && <EditSupplierModal key="edit-sup" supplier={editSupplier} onClose={() => setEditSupplier(null)} />}
                {liveQ && (
                    <QuoteDrawer key={liveQ.id} quote={liveQ}
                        supplier={suppliers.find(s => s.id === liveQ.supplierId)}
                        onClose={() => setSelectedQ(null)}
                        showToast={showToast} />
                )}
            </AnimatePresence>
        </div>
    );
}
