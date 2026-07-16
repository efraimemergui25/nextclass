/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, addDoc,
    serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import {
    Plus, X, Phone, Mail, MessageCircle, ExternalLink,
    FileText, Trash2, Check, Search, Building2, Package,
    Clock, CheckCircle2, ShoppingCart, RefreshCw,
    Globe, User, Hash, Truck, Box, CreditCard,
    BarChart3, ArrowUpDown, Edit2, ChevronRight, ChevronLeft, Layers, Briefcase,
    Award, TrendingUp, TrendingDown, Minus, Printer, Activity, Star, Calendar, AlertCircle,
    Zap, Rocket, Crown, ClipboardList, MessageSquare, Download, DollarSign,
} from 'lucide-react';
import {
    PALETTE, GLASS, RADIUS, SHADOW, SPRING, TAP,
    hexA, glow, accentSurface, toneColor, toneBg, toneFg,
} from '../theme/tokens';
import { AdminKPICard } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';

// ─── Suppliers domain accent (restrained brand — azure, de-rainbowed) ──────────
const GOLD      = '#007AFF';                                     // suppliers accent (azure)
const GOLD_GRAD = 'linear-gradient(135deg,#007AFF,#5AC8FA)';
const GOLD_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.14) 0%, rgba(90,200,250,0.08) 100%)';

// ─── Liquid-glass surface recipes (token-driven — one system everywhere) ───────
const G    = { ...GLASS.base,    borderRadius: RADIUS.card };    // workhorse card
const CARD = { ...GLASS.frosted, borderRadius: RADIUS.smCard };  // compact chrome card

// ─── Constants ──────────────────────────────────────────────────────────────────
const NEG_STAGES = [
    { id: 'received',    label: 'התקבלה',    color: '#007AFF', icon: Package },
    { id: 'reviewing',  label: 'בבדיקה',     color: '#FF9500', icon: Search },
    { id: 'negotiating',label: 'במשא ומתן', color: '#5AC8FA', icon: ArrowUpDown },
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
const CATEGORIES   = [
    'מסכים אינטראקטיביים והקרנה',
    'מחשוב לצוות ותלמידים',
    'אודיו ווידאו למרחבי למידה',
    'מעבדות STEM ומרחבי חדשנות',
    'תשתיות ועגלות טעינה',
];

// ─── Category color (deterministic from string) ────────────────────────────────
const CAT_PALETTE = ['#007AFF', '#5AC8FA', '#FF9500', '#FF2D55', '#34C759', '#00C7BE', '#0A84FF'];
const catColor = cat => {
    if (!cat) return '#AEAEB2';
    let h = 0; for (let i = 0; i < cat.length; i++) h = (h * 31 + cat.charCodeAt(i)) | 0;
    return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length];
};

// ─── Exchange rate cache (module-level, shared across all ProductRows) ─────────
let _fxCache = { usdToIls: null, fetchedAt: 0 };
async function fetchUsdToIls() {
    if (_fxCache.usdToIls && Date.now() - _fxCache.fetchedAt < 5 * 60 * 1000) return _fxCache.usdToIls;
    try {
        const res  = await fetch('/api/fx');
        if (!res.ok) return null;
        const data = await res.json();
        const rate = data?.usdToIls;
        if (rate && Number.isFinite(rate) && rate > 0.5) {
            _fxCache = { usdToIls: rate, fetchedAt: Date.now() };
            return rate;
        }
    } catch {}
    return null;
}

// Force a fresh fetch (bypasses the 5-min cache) — used by the manual FX button.
async function refreshUsdToIls() {
    try {
        const res = await fetch('/api/fx', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        const rate = data?.usdToIls;
        if (rate && Number.isFinite(rate) && rate > 0.5) {
            _fxCache = { usdToIls: rate, fetchedAt: Date.now() };
            return rate;
        }
    } catch {}
    return null;
}

// ─── FX rate pill — shows the live USD→ILS rate + one-tap refresh ──────────────
function FxRateButton({ rate, onRefresh, size = 'md' }) {
    const [loading, setLoading] = useState(false);
    const [ok, setOk] = useState(false);
    const pad = size === 'sm' ? '5px 9px' : '7px 12px';
    const fs  = size === 'sm' ? 11 : 12;
    const dot = size === 'sm' ? 17 : 20;
    const refresh = async (e) => {
        e?.stopPropagation?.(); e?.preventDefault?.();
        if (loading) return;
        setLoading(true);
        const r = await refreshUsdToIls();
        setLoading(false);
        if (r) { onRefresh?.(r); setOk(true); setTimeout(() => setOk(false), 1600); }
    };
    return (
        <button type="button" onClick={refresh} disabled={loading}
            title="עדכון שער דולר-שקל לפי השער הנוכחי"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 7, padding: pad, borderRadius: 999,
                border: `1px solid ${ok ? 'rgba(52,199,89,0.4)' : 'rgba(0,122,255,0.22)'}`,
                background: ok ? 'rgba(52,199,89,0.10)' : 'linear-gradient(135deg, rgba(0,122,255,0.10), rgba(90,200,250,0.08))',
                color: ok ? '#1A8C40' : '#007AFF', fontSize: fs, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)', transition: 'all 0.18s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!loading && !ok) e.currentTarget.style.filter = 'brightness(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}>
            <span style={{ width: dot, height: dot, borderRadius: 999, background: ok ? '#34C759' : 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                {loading ? <RefreshCw size={11} className="animate-spin" /> : ok ? <Check size={12} /> : <DollarSign size={12} />}
            </span>
            <span>{ok ? 'עודכן' : loading ? 'מעדכן…' : 'שער דולר'}</span>
            <span style={{ fontWeight: 900 }}>{rate ? `₪${Number(rate).toFixed(2)}` : '—'}</span>
            {!loading && !ok && <RefreshCw size={12} style={{ opacity: 0.55 }} />}
        </button>
    );
}

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
function SupplierAvatar({ domain, name, size = 48, color, logoUrl }) {
    const [err, setErr] = useState(false);
    const initials = (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
    const FALLBACK_COLORS = ['#007AFF', '#5AC8FA', '#FF9500', '#FF2D55', '#34C759'];
    const bg = color || FALLBACK_COLORS[(name || '').charCodeAt(0) % FALLBACK_COLORS.length];
    const r = Math.round(size * 0.25);
    const cleanDomain = (domain || '').replace(/https?:\/\//,'').replace(/^www\./,'').split('/')[0].split('?')[0].trim();
    // Direct logo URL takes priority over Clearbit
    const imgSrc = logoUrl || (cleanDomain ? `https://logo.clearbit.com/${cleanDomain}` : null);

    if (imgSrc && !err) {
        return (
            <img
                src={imgSrc}
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

// ─── ColorPicker ───────────────────────────────────────────────────────────────
const SUPPLIER_PRESET_COLORS = ['#007AFF','#5AC8FA','#FF9500','#FF2D55','#34C759','#FF3B30','#FF6B35','#0A84FF','#00BCD4','#795548'];
function ColorPicker({ value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73' }}>צבע ספק</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                {SUPPLIER_PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => onChange(c)}
                        title={c}
                        style={{
                            width: 26, height: 26, borderRadius: 8, background: c, border: 'none',
                            cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'transform 0.12s',
                            outline: value === c ? `3px solid ${c}` : 'none',
                            outlineOffset: 2,
                            transform: value === c ? 'scale(1.18)' : 'scale(1)',
                            boxShadow: value === c ? `0 2px 8px ${c}55` : '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                ))}
                <input type="color" value={value || '#007AFF'} onChange={e => onChange(e.target.value)}
                    title="צבע מותאם אישית"
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', padding: 0, cursor: 'pointer', background: 'none', flexShrink: 0 }} />
            </div>
            {value && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: value }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#AEAEB2', fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
                </div>
            )}
        </div>
    );
}

// ─── StagePill ─────────────────────────────────────────────────────────────────
function StagePill({ stageId, sm }) {
    const s = NEG_STAGES.find(n => n.id === stageId) || NEG_STAGES[0];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: sm ? 4 : 5,
            padding: sm ? '3px 9px' : '5px 13px', borderRadius: 99,
            background: `${s.color}0D`,
            color: s.color,
            fontSize: sm ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap',
            border: `1px solid ${s.color}22`,
            letterSpacing: '-0.1px',
        }}>
            <span style={{ width: sm ? 5 : 6, height: sm ? 5 : 6, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
            {s.label}
        </span>
    );
}

// ─── NegotiationPipeline ───────────────────────────────────────────────────────
function NegotiationPipeline({ status, onChange }) {
    const cur = NEG_STAGES.findIndex(s => s.id === status);
    return (
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: 4, gap: 0 }}>
            {NEG_STAGES.map((s, i) => {
                const done   = i < cur;
                const active = i === cur;
                return (
                    <React.Fragment key={s.id}>
                        <motion.button
                            onClick={() => onChange?.(s.id)}
                            whileHover={{ scale: onChange ? 1.04 : 1 }}
                            whileTap={{ scale: onChange ? 0.96 : 1 }}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                                padding: '8px 10px', borderRadius: 12, border: 'none',
                                background: active ? `${s.color}0D` : 'transparent',
                                cursor: onChange ? 'pointer' : 'default', minWidth: 60,
                                transition: 'all 0.18s ease', flexShrink: 0,
                            }}
                        >
                            {/* Step indicator */}
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: active ? s.color : done ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)',
                                border: active ? `2px solid ${s.color}` : done ? '2px solid rgba(0,0,0,0.10)' : '2px solid rgba(0,0,0,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.18s ease', boxShadow: active ? `0 2px 10px ${s.color}30` : 'none',
                            }}>
                                {done
                                    ? <Check size={12} color="#6E6E73" strokeWidth={2.5} />
                                    : <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : 'rgba(0,0,0,0.18)', display: 'inline-block' }} />
                                }
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: active ? 700 : 500,
                                color: active ? s.color : done ? '#6E6E73' : '#AEAEB2',
                                whiteSpace: 'nowrap', letterSpacing: '-0.1px',
                                transition: 'color 0.18s ease',
                            }}>{s.label}</span>
                        </motion.button>
                        {i < NEG_STAGES.length - 1 && (
                            <div style={{
                                flex: 1, height: 1.5, minWidth: 8,
                                background: done ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)',
                                borderRadius: 2, margin: '0 0 16px',
                                transition: 'background 0.18s ease',
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── ContactRow ────────────────────────────────────────────────────────────────
function ContactRow({ phone, email, website }) {
    const wa = phone ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '972')}` : null;
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {phone && (
                <a href={`tel:${phone}`} style={ctaStyle}>
                    <Phone size={11} color="#6E6E73" /><span>{phone}</span>
                </a>
            )}
            {wa && (
                <a href={wa} target="_blank" rel="noreferrer" style={ctaStyle}>
                    <MessageCircle size={11} color="#25D366" /><span>WhatsApp</span>
                </a>
            )}
            {email && (
                <a href={`mailto:${email}`} style={ctaStyle}>
                    <Mail size={11} color="#6E6E73" /><span>{email}</span>
                </a>
            )}
            {website && (
                <a href={website} target="_blank" rel="noreferrer" style={ctaStyle}>
                    <Globe size={11} color="#6E6E73" /><span>אתר</span>
                </a>
            )}
        </div>
    );
}
const ctaStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 9,
    background: 'rgba(0,0,0,0.04)', color: '#3C3C43',
    fontSize: 11, fontWeight: 600, textDecoration: 'none',
    border: '1px solid rgba(0,0,0,0.07)',
    transition: 'background 0.15s',
};

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
function SFX({ label, value, onChange, options }) {
    const knownIds = [...options.map(o => o.id || o), 'tbd', ''];
    const [otherMode, setOtherMode] = React.useState(() => Boolean(value && !knownIds.includes(value)));
    const handleSel = e => {
        if (e.target.value === '__other__') { setOtherMode(true); onChange(''); }
        else { setOtherMode(false); onChange(e.target.value); }
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <LBL>{label}</LBL>
            {!otherMode ? (
                <select value={value || ''} onChange={handleSel} style={{ ...inputCss, cursor: 'pointer' }}>
                    <option value="">— בחר —</option>
                    {options.map(o => <option key={o.id || o} value={o.id || o}>{o.label || o}</option>)}
                    <option disabled style={{ color: '#D1D1D6' }}>──────────</option>
                    <option value="tbd">יקבע בעתיד</option>
                    <option value="__other__">אחר...</option>
                </select>
            ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                    <input value={value || ''} onChange={e => onChange(e.target.value)}
                        placeholder="הכנס ערך מותאם..." autoFocus
                        style={{ ...inputCss, flex: 1 }} />
                    <button onClick={() => { setOtherMode(false); onChange(''); }}
                        style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', color: '#6E6E73', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                        <X size={11} />
                    </button>
                </div>
            )}
        </div>
    );
}
function LBL({ children }) {
    return <label style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.05em' }}>{children}</label>;
}

// ─── ProductLookupRow ──────────────────────────────────────────────────────────
function ProductRow({ product: p, onChange, onDelete, quoteStatus, onPublish, onGoToProducts, allCategories, fxRate }) {
    const [busy,       setBusy]      = useState(false);
    const [imgErr,     setImgErr]    = useState(false);
    const [usdRate,    setUsdRate]   = useState(fxRate || _fxCache.usdToIls);
    // Sync with the editor-level FX rate (updated by the manual "שער דולר" button)
    useEffect(() => { if (fxRate) setUsdRate(fxRate); }, [fxRate]);
    const [catInput,   setCatInput]  = useState(false);
    const [catVal,     setCatVal]    = useState('');
    const [showTiers,  setShowTiers] = useState((p.tiers || []).length > 0);
    const isUsd = p.currency === 'USD';

    const addTier = () => {
        const tiers = [...(p.tiers || [])];
        const lastQty = tiers.length > 0 ? Math.max(...tiers.map(t => Number(t.minQty) || 0)) : (Number(p.quantity) || 1);
        tiers.push({ minQty: lastQty + 10, pricePerUnit: effectivePrice });
        onChange({ ...p, tiers });
    };
    const updTier = (i, key, val) => {
        const tiers = [...(p.tiers || [])];
        tiers[i] = { ...tiers[i], [key]: val === '' ? '' : Number(val) };
        onChange({ ...p, tiers });
    };
    const remTier = i => {
        const tiers = [...(p.tiers || [])];
        tiers.splice(i, 1);
        onChange({ ...p, tiers });
    };

    useEffect(() => {
        if (!isUsd) return;
        fetchUsdToIls().then(r => {
            if (!r) return;
            setUsdRate(r);
            // If user already entered a USD price, recalculate ILS immediately
            const usd = parseFloat(p.priceInUsd) || 0;
            if (usd > 0) onChange({ ...p, pricePerUnit: Math.round(usd * r * 100) / 100 });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUsd]);

    const toggleCurrency = () => {
        if (isUsd) {
            onChange({ ...p, currency: 'ILS', priceInUsd: '' });
        } else {
            fetchUsdToIls().then(r => { if (r) setUsdRate(r); });
            onChange({ ...p, currency: 'USD', priceInUsd: p.pricePerUnit && usdRate ? (p.pricePerUnit / usdRate).toFixed(2) : '' });
        }
    };

    const handleUsdPrice = val => {
        const usd = parseFloat(val) || 0;
        onChange({ ...p, priceInUsd: val, pricePerUnit: usdRate ? Math.round(usd * usdRate * 100) / 100 : 0 });
    };

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

    const effectivePrice = (isUsd && usdRate && parseFloat(p.priceInUsd) > 0)
        ? Math.round(parseFloat(p.priceInUsd) * usdRate * 100) / 100
        : Number(p.pricePerUnit) || 0;
    const qty = Number(p.quantity) || 1;
    const applicableTierPrice = (() => {
        const tiers = p.tiers || [];
        if (!tiers.length) return effectivePrice;
        const sorted = [...tiers].filter(t => Number(t.minQty) <= qty).sort((a, b) => Number(b.minQty) - Number(a.minQty));
        return sorted.length > 0 ? Number(sorted[0].pricePerUnit) || effectivePrice : effectivePrice;
    })();
    const subtotal = applicableTierPrice * qty * (1 - (Number(p.discount) || 0) / 100);

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            style={{ ...CARD, padding: 16, marginBottom: 10 }}>
            {/* Row 1: image + name + model + delete */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 54, height: 54, borderRadius: 12, background: 'rgba(0,0,0,0.03)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                    {p.imageUrl && !imgErr ? <img src={p.imageUrl} alt="" onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Box size={18} color="#C7C7CC" />}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input value={p.name || ''} onChange={e => onChange({ ...p, name: e.target.value })} placeholder="שם המוצר" style={{ ...inputCss, fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px' }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input value={p.modelNumber || ''} onChange={e => onChange({ ...p, modelNumber: e.target.value })} placeholder="מס׳ דגם / ברקוד" style={{ ...inputCss, flex: 1, fontSize: 11 }} />
                        <motion.button onClick={lookup} disabled={busy || !p.modelNumber} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            style={{ padding: '6px 10px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.03)', color: '#6E6E73', fontSize: 11, fontWeight: 600, cursor: p.modelNumber ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {busy ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}{busy ? '...' : 'חפש'}
                        </motion.button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input value={p.brand || ''} onChange={e => onChange({ ...p, brand: e.target.value })} placeholder="מותג" style={{ ...inputCss, fontSize: 11, flex: '0 0 38%' }} />
                        <input value={p.imageUrl || ''} onChange={e => onChange({ ...p, imageUrl: e.target.value })} placeholder="קישור תמונה (URL)" style={{ ...inputCss, fontSize: 10, color: '#86868B', flex: 1 }} />
                    </div>
                </div>
                <motion.button onClick={onDelete} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    style={{ padding: 7, borderRadius: 9, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.03)', color: '#C7C7CC', cursor: 'pointer', display: 'flex', alignItems: 'center', alignSelf: 'flex-start', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.07)'; e.currentTarget.style.color = '#FF3B30'; e.currentTarget.style.borderColor = 'rgba(255,59,48,0.14)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = '#C7C7CC'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                    <Trash2 size={12} />
                </motion.button>
            </div>

            {/* Category chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                {p.category ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', color: '#6E6E73', fontSize: 10, fontWeight: 600, border: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap' }}>
                        {p.category}
                        <button onClick={() => onChange({ ...p, category: '' })} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#AEAEB2', padding: '0 0 0 2px', lineHeight: 1, fontSize: 12 }}>×</button>
                    </span>
                ) : catInput ? (
                    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input
                            autoFocus
                            value={catVal}
                            onChange={e => setCatVal(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && catVal.trim()) { onChange({ ...p, category: catVal.trim() }); setCatVal(''); setCatInput(false); }
                                if (e.key === 'Escape') { setCatInput(false); setCatVal(''); }
                            }}
                            onBlur={() => { setTimeout(() => { if (catVal.trim()) onChange({ ...p, category: catVal.trim() }); setCatVal(''); setCatInput(false); }, 150); }}
                            placeholder="שם קטגוריה..."
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(0,122,255,0.30)', fontSize: 10, outline: 'none', width: 140, background: '#fff', direction: 'rtl', color: '#1D1D1F', boxShadow: '0 0 0 3px rgba(0,122,255,0.08)' }}
                        />
                        {(allCategories || []).filter(c => !catVal || c.includes(catVal)).length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95)', minWidth: 140, marginTop: 2, overflow: 'hidden' }}>
                                {(allCategories || []).filter(c => !catVal || c.includes(catVal)).map(c => (
                                    <div key={c}
                                        onMouseDown={() => { onChange({ ...p, category: c }); setCatVal(''); setCatInput(false); }}
                                        style={{ padding: '7px 12px', fontSize: 11, fontWeight: 600, color: '#1D1D1F', cursor: 'pointer', direction: 'rtl', transition: 'background 0.1s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        {c}
                                    </div>
                                ))}
                                {catVal.trim() && !(allCategories || []).includes(catVal.trim()) && (
                                    <div
                                        onMouseDown={() => { onChange({ ...p, category: catVal.trim() }); setCatVal(''); setCatInput(false); }}
                                        style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#007AFF', cursor: 'pointer', direction: 'rtl', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,122,255,0.03)', display: 'flex', alignItems: 'center', gap: 5 }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,122,255,0.03)'}>
                                        <Plus size={10} />הוסף "{catVal.trim()}"
                                    </div>
                                )}
                            </div>
                        )}
                        {catVal.trim() && !(allCategories || []).filter(c => c.includes(catVal)).length && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 20, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.95)', minWidth: 140, marginTop: 2, overflow: 'hidden' }}>
                                <div
                                    onMouseDown={() => { onChange({ ...p, category: catVal.trim() }); setCatVal(''); setCatInput(false); }}
                                    style={{ padding: '7px 12px', fontSize: 11, fontWeight: 700, color: '#007AFF', cursor: 'pointer', direction: 'rtl', display: 'flex', alignItems: 'center', gap: 5 }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.06)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <Plus size={10} />הוסף "{catVal.trim()}"
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={() => setCatInput(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', borderRadius: 8, border: '1px dashed rgba(0,0,0,0.12)', background: 'none', cursor: 'pointer', color: '#C7C7CC', fontSize: 10, fontWeight: 600 }}>
                        <Plus size={8} />קטגוריה
                    </button>
                )}
            </div>

            {/* Row 2: price / qty / discount / total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 10, alignItems: 'end' }}>
                {/* Price cell with currency toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <LBL>{isUsd ? 'מחיר ליח׳ ($)' : 'מחיר ליח׳ (₪)'}</LBL>
                        <button onClick={toggleCurrency} title="החלף מטבע"
                            style={{ padding: '1px 6px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: '#6E6E73', lineHeight: 1.5 }}>
                            {isUsd ? '$' : '₪'}
                        </button>
                    </div>
                    {isUsd ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <input type="number" value={p.priceInUsd || ''} onChange={e => handleUsdPrice(e.target.value)} placeholder="0"
                                style={{ padding: '7px 8px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', fontSize: 14, fontWeight: 800, color: '#1D1D1F', outline: 'none', textAlign: 'center', letterSpacing: '-0.3px' }} />
                            {usdRate && p.priceInUsd ? (
                                <div style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600, textAlign: 'center' }}>
                                    ≈ {fmt(p.pricePerUnit)} · ₪{usdRate.toFixed(2)}
                                </div>
                            ) : !usdRate ? (
                                <div style={{ fontSize: 9, color: '#AEAEB2', textAlign: 'center' }}>טוען שער...</div>
                            ) : null}
                        </div>
                    ) : (
                        <input type="number" value={p.pricePerUnit || ''} onChange={e => onChange({ ...p, pricePerUnit: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="0"
                            style={{ padding: '7px 8px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', fontSize: 14, fontWeight: 800, color: '#1D1D1F', outline: 'none', textAlign: 'center', letterSpacing: '-0.3px' }} />
                    )}
                </div>
                {/* Qty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <LBL>כמות מינ׳</LBL>
                    <input type="number" value={p.quantity || ''} placeholder="1"
                        onChange={e => onChange({ ...p, quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                        style={{ padding: '7px 8px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', fontSize: 14, fontWeight: 800, color: '#1D1D1F', outline: 'none', textAlign: 'center', letterSpacing: '-0.3px' }} />
                </div>
                {/* Discount */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <LBL>הנחה %</LBL>
                    <input type="number" value={p.discount || ''} onChange={e => onChange({ ...p, discount: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="0"
                        style={{ padding: '7px 8px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', fontSize: 14, fontWeight: 800, color: '#1D1D1F', outline: 'none', textAlign: 'center', letterSpacing: '-0.3px' }} />
                </div>
                {/* Total */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <LBL>סה"כ</LBL>
                    <div style={{ padding: '7px 12px', borderRadius: 9, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', fontSize: 14, fontWeight: 900, color: '#1D1D1F', textAlign: 'center', lineHeight: '22px', whiteSpace: 'nowrap', letterSpacing: '-0.4px' }}>
                        {subtotal > 0 ? fmt(subtotal) : '—'}
                    </div>
                </div>
            </div>

            {/* Pricing tiers */}
            <div style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                        onClick={() => setShowTiers(t => !t)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: `1px solid ${(p.tiers || []).length > 0 ? 'rgba(90,200,250,0.25)' : 'rgba(0,0,0,0.10)'}`, background: (p.tiers || []).length > 0 ? 'rgba(90,200,250,0.06)' : 'rgba(0,0,0,0.02)', cursor: 'pointer', color: (p.tiers || []).length > 0 ? '#5AC8FA' : '#8E8E93', fontSize: 10, fontWeight: 700 }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v3H1V2zm0 4.5h10v3H1v-3zm0 4.5h6v3H1v-3z"/></svg>
                        מדרגות מחיר{(p.tiers || []).length > 0 ? ` (${p.tiers.length})` : ''}
                        <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" style={{ transform: showTiers ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M8 10L2 4h12L8 10z"/></svg>
                    </button>
                    {showTiers && (
                        <button onClick={addTier}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(0,122,255,0.20)', background: 'rgba(0,122,255,0.06)', cursor: 'pointer', color: '#007AFF', fontSize: 10, fontWeight: 700 }}>
                            <Plus size={9} />הוסף מדרגה
                        </button>
                    )}
                </div>
                {showTiers && (
                    <div style={{ marginTop: 8, borderRadius: 10, border: '1px solid rgba(90,200,250,0.12)', overflow: 'hidden', background: 'rgba(90,200,250,0.02)' }}>
                        {/* header */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0, background: 'rgba(90,200,250,0.06)', borderBottom: '1px solid rgba(90,200,250,0.10)', padding: '5px 10px', direction: 'rtl' }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#5AC8FA', textAlign: 'right' }}>כמות מינ׳</span>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#5AC8FA', textAlign: 'right' }}>מחיר ליח׳ (₪)</span>
                            <span style={{ width: 22 }} />
                        </div>
                        {/* base tier */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0, padding: '6px 10px', borderBottom: (p.tiers || []).length > 0 ? '1px solid rgba(0,0,0,0.05)' : 'none', direction: 'rtl', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#6E6E73', fontWeight: 600 }}>ברירת מחדל</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F' }}>{effectivePrice > 0 ? fmt(effectivePrice) : '—'}</span>
                            <span style={{ width: 22 }} />
                        </div>
                        {(p.tiers || []).sort((a, b) => Number(a.minQty) - Number(b.minQty)).map((tier, ti) => {
                            const isActive = qty >= Number(tier.minQty) && (ti === (p.tiers || []).length - 1 || qty < Number((p.tiers || [])[ti + 1]?.minQty));
                            return (
                                <div key={ti} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, padding: '6px 10px', borderBottom: ti < (p.tiers || []).length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', direction: 'rtl', alignItems: 'center', background: isActive ? 'rgba(52,199,89,0.05)' : 'transparent' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />}
                                        <input
                                            type="number" value={tier.minQty ?? ''} min="1"
                                            onChange={e => updTier(ti, 'minQty', e.target.value)}
                                            style={{ width: '100%', padding: '4px 7px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', fontSize: 12, fontWeight: 700, outline: 'none', textAlign: 'center', color: '#1D1D1F' }}
                                            placeholder="כמות" />
                                    </div>
                                    <input
                                        type="number" value={tier.pricePerUnit ?? ''} min="0" step="0.01"
                                        onChange={e => updTier(ti, 'pricePerUnit', e.target.value)}
                                        style={{ width: '100%', padding: '4px 7px', borderRadius: 7, border: `1px solid ${isActive ? 'rgba(52,199,89,0.30)' : 'rgba(0,0,0,0.10)'}`, background: isActive ? 'rgba(52,199,89,0.06)' : '#fff', fontSize: 12, fontWeight: 800, outline: 'none', textAlign: 'center', color: isActive ? '#34C759' : '#1D1D1F' }}
                                        placeholder="מחיר ₪" />
                                    <button onClick={() => remTier(ti)}
                                        style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid rgba(255,59,48,0.15)', background: 'rgba(255,59,48,0.05)', cursor: 'pointer', color: '#FF3B30', flexShrink: 0 }}>
                                        <X size={9} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Row 3: product page link */}
            <div style={{ display: 'flex', gap: 6 }}>
                <input value={p.productPageUrl || ''} onChange={e => onChange({ ...p, productPageUrl: e.target.value })} placeholder="קישור לעמוד המוצר אצל הספק"
                    style={{ ...inputCss, fontSize: 11, flex: 1 }} />
                {p.productPageUrl && (
                    <a href={p.productPageUrl} target="_blank" rel="noreferrer"
                        style={{ padding: '6px 10px', borderRadius: 9, background: 'rgba(90,200,250,0.08)', color: '#5AC8FA', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <ExternalLink size={11} />פתח
                    </a>
                )}
            </div>

            {p.specs && (
                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.02)', fontSize: 11, color: '#6E6E73', lineHeight: 1.6, direction: 'rtl', textAlign: 'right' }}>{p.specs}</div>
            )}

            {/* Row 4: product note */}
            <div style={{ marginTop: 8 }}>
                <textarea
                    value={p.note || ''}
                    onChange={e => onChange({ ...p, note: e.target.value })}
                    placeholder="הערה למוצר זה (אופציונלי)..."
                    rows={p.note ? 2 : 1}
                    style={{ ...inputCss, resize: 'none', fontSize: 11, color: '#6E6E73', lineHeight: 1.55, fontFamily: 'inherit', padding: '7px 10px', borderRadius: 9 }}
                />
            </div>

            {/* ── Publish to store strip ───────────────────────────────────────── */}
            {(quoteStatus === 'agreed' || quoteStatus === 'ordered') && (
                <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid rgba(0,0,0,0.045)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    {p.publishedProductId ? (
                        <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(52,199,89,0.08)', color: '#34C759', fontSize: 11, fontWeight: 700, border: '1px solid rgba(52,199,89,0.18)' }}>
                                <Check size={10} />פורסם לאתר
                            </span>
                            <button onClick={onGoToProducts}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.03)', color: '#6E6E73', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                <ExternalLink size={10} />מוצרים
                            </button>
                        </>
                    ) : (
                        <motion.button onClick={() => onPublish?.(p)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.28)' }}>
                            <Globe size={11} />פרסם לאתר
                        </motion.button>
                    )}
                </div>
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
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(90,200,250,0.04)', border: '1px solid rgba(90,200,250,0.10)' }}>
                    <FileText size={13} color="#5AC8FA" />
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

// ─── PublishProductModal ───────────────────────────────────────────────────────
function PublishProductModal({ product: p, quoteId, addProduct, onClose, onPublished, showToast }) {
    const costPrice = (Number(p.pricePerUnit) || 0) * (1 - (Number(p.discount) || 0) / 100);
    const [markup, setMarkup] = useState(1.35);
    const [form, setForm] = useState({
        title:       p.name        || '',
        brand:       p.brand       || '',
        category:    CATEGORIES[0],
        description: p.specs       || '',
        image:       p.imageUrl    || '',
        retailPrice: Math.round(costPrice * 1.35) || '',
        salePrice:   '',
        stock:       Number(p.quantity) || 1,
        isActive:    true,
        isFeatured:  false,
    });
    const [publishing, setPublishing] = useState(false);
    const [done,       setDone]       = useState(null);
    const [busy,       setBusy]       = useState(false);
    const f = k => v => setForm(prev => ({ ...prev, [k]: v }));

    const handleMarkup = v => {
        setMarkup(v);
        setForm(prev => ({ ...prev, retailPrice: Math.round(costPrice * v) }));
    };

    const refetch = async () => {
        if (!p.modelNumber) return;
        setBusy(true);
        try {
            if (/^\d{8,14}$/.test(p.modelNumber.trim())) {
                const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${p.modelNumber.trim()}`);
                if (res.ok) {
                    const data = await res.json();
                    const item = data.items?.[0];
                    if (item) {
                        setForm(prev => ({ ...prev, title: item.title || prev.title, brand: item.brand || prev.brand, description: item.description || prev.description, image: item.images?.[0] || prev.image }));
                        setBusy(false); return;
                    }
                }
            }
            window.open(`https://www.google.com/search?q=${encodeURIComponent((p.modelNumber || '') + ' ' + (p.name || '') + ' מפרט')}&tbm=shop`, '_blank');
        } catch {}
        setBusy(false);
    };

    const publish = async () => {
        if (!form.title.trim()) return;
        setPublishing(true);
        try {
            const newId = await addProduct({
                title:          form.title.trim(),
                brand:          form.brand || '',
                category:       form.category,
                description:    form.description || '',
                image:          form.image || '',
                price:          Number(form.retailPrice) || 0,
                ...(form.salePrice ? { salePrice: Number(form.salePrice) } : {}),
                stock:          Number(form.stock) || 0,
                isActive:       form.isActive,
                isFeatured:     form.isFeatured,
                costPrice:      costPrice,
                modelNumber:    p.modelNumber || '',
                supplierQuoteId: quoteId,
            });
            setDone({ id: newId, title: form.title });
            await onPublished(p, newId);
        } catch (e) {
            console.error(e);
            showToast('שגיאה בפרסום', 'error');
        }
        setPublishing(false);
    };

    if (done) {
        return (
            <Modal title="מוצר פורסם בהצלחה!" onClose={onClose}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <CheckCircle2 size={36} color="#34C759" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1D1D1F', marginBottom: 6 }}>{done.title}</div>
                    <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 24 }}>פורסם לחנות ונוסף למלאי</div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <a href="/admin/products"  style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(0,122,255,0.08)',  color: '#007AFF',  fontWeight: 700, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><Package size={14} />מוצרים</a>
                        <a href="/admin/inventory" style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(52,199,89,0.08)', color: '#34C759', fontWeight: 700, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}><Layers size={14} />מלאי</a>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal title={`פרסום לחנות — ${p.name || p.modelNumber || 'מוצר'}`} onClose={onClose}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Cost strip + markup slider */}
                <div style={{ padding: '12px 14px', borderRadius: 13, background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.14)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <LBL>עלות מספק</LBL>
                        <span style={{ fontSize: 17, fontWeight: 900, color: '#FF9500' }}>{fmt(costPrice)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <LBL>מכפיל רווח · +{((markup - 1) * 100).toFixed(0)}%</LBL>
                        <input type="range" min="1.0" max="3.0" step="0.05" value={markup}
                            onChange={e => handleMarkup(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#007AFF', direction: 'ltr' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#AEAEB2' }}>
                            <span>x1.0</span><span style={{ fontWeight: 800, color: '#007AFF' }}>x{markup.toFixed(2)}</span><span>x3.0</span>
                        </div>
                    </div>
                </div>

                {/* Name + refetch */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}><MF label="שם המוצר באתר *" value={form.title} onChange={f('title')} placeholder="השם שיופיע ללקוחות" /></div>
                    {p.modelNumber && (
                        <motion.button onClick={refetch} disabled={busy} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                            style={{ padding: '9px 13px', borderRadius: 10, border: '1px solid rgba(90,200,250,0.18)', background: 'linear-gradient(135deg,rgba(90,200,250,0.10),rgba(90,200,250,0.07))', color: '#5AC8FA', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            {busy ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}{busy ? '...' : 'משוך נתונים'}
                        </motion.button>
                    )}
                </div>

                {/* Brand + Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <MF label="מותג" value={form.brand} onChange={f('brand')} placeholder="Dell, LG, Epson..." />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <LBL>קטגוריה</LBL>
                        <select value={form.category} onChange={e => f('category')(e.target.value)}
                            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 12, color: '#1D1D1F', outline: 'none', direction: 'rtl', width: '100%', cursor: 'pointer' }}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <LBL>תיאור</LBL>
                    <textarea value={form.description} onChange={e => f('description')(e.target.value)} rows={3}
                        placeholder="תיאור שיופיע בדף המוצר..."
                        style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 12, color: '#1D1D1F', outline: 'none', textAlign: 'right', direction: 'rtl', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, width: '100%', boxSizing: 'border-box' }} />
                </div>

                {/* Image */}
                <MF label="תמונה ראשית (URL)" value={form.image} onChange={f('image')} placeholder="https://..." />
                {form.image && <img src={form.image} alt="" style={{ height: 72, borderRadius: 10, objectFit: 'contain', background: 'rgba(0,0,0,0.03)', padding: 8, alignSelf: 'flex-start' }} onError={e => { e.target.style.display = 'none'; }} />}

                {/* Prices + Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <LBL>מחיר מכירה (₪)</LBL>
                        <input type="number" value={form.retailPrice} onChange={e => setForm(pr => ({ ...pr, retailPrice: e.target.value }))}
                            style={{ padding: '9px 8px', borderRadius: 10, border: '1.5px solid rgba(0,122,255,0.25)', background: 'rgba(0,122,255,0.04)', fontSize: 16, fontWeight: 900, color: '#007AFF', outline: 'none', textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <LBL>מחיר מבצע (₪)</LBL>
                        <input type="number" value={form.salePrice} onChange={e => f('salePrice')(e.target.value)} placeholder="ללא"
                            style={{ padding: '9px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,45,85,0.03)', fontSize: 13, fontWeight: 700, color: '#FF2D55', outline: 'none', textAlign: 'center' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <LBL>מלאי ראשוני</LBL>
                        <input type="number" value={form.stock} onChange={e => f('stock')(Number(e.target.value))}
                            style={{ padding: '9px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)', fontSize: 13, fontWeight: 700, color: '#1D1D1F', outline: 'none', textAlign: 'center' }} />
                    </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['isActive', 'פעיל באתר', '#34C759'], ['isFeatured', 'מוצר מומלץ', '#FF9500']].map(([k, lbl, c]) => (
                        <button key={k} onClick={() => f(k)(!form[k])}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${form[k] ? c + '40' : 'rgba(0,0,0,0.08)'}`, background: form[k] ? `${c}0E` : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: form[k] ? c : '#AEAEB2', transition: 'all 0.15s' }}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${form[k] ? c : '#D1D1D6'}`, background: form[k] ? c : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {form[k] && <Check size={9} color="#fff" />}
                            </div>
                            {lbl}
                        </button>
                    ))}
                </div>

                {/* Publish CTA */}
                <motion.button onClick={publish} disabled={!form.title.trim() || publishing}
                    whileHover={{ scale: form.title.trim() ? 1.02 : 1 }} whileTap={{ scale: form.title.trim() ? 0.98 : 1 }}
                    style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: form.title.trim() ? 'linear-gradient(135deg,#34C759,#30D158)' : 'rgba(0,0,0,0.05)', color: form.title.trim() ? '#fff' : '#AEAEB2', fontSize: 14, fontWeight: 800, cursor: form.title.trim() ? 'pointer' : 'not-allowed', boxShadow: form.title.trim() ? '0 4px 22px rgba(52,199,89,0.30)' : 'none', marginTop: 4 }}>
                    {publishing ? 'מפרסם...' : <><Rocket size={14} style={{ display: 'inline', marginLeft: 6 }} />פרסם לחנות{form.retailPrice ? ` — ${fmt(Number(form.retailPrice))}` : ''}</>}
                </motion.button>
            </div>
        </Modal>
    );
}

// ─── QuoteDrawer ───────────────────────────────────────────────────────────────
function QuoteDrawer({ quote, supplier, onClose, showToast, allCategories, focusProductKey }) {
    const { addProduct } = useAdminData();
    const confirm = useAdminConfirm();
    const navigate = useNavigate();
    const [d, setD] = useState(() => JSON.parse(JSON.stringify(quote)));
    const [saving, setSaving]   = useState(false);
    const [note, setNote]       = useState('');
    const [addingNote, setAN]   = useState(false);
    const [publishModal, setPublishModal] = useState(null); // product being published
    const [catFilter, setCatFilter] = useState('');
    const [editorFx, setEditorFx] = useState(_fxCache.usdToIls);
    useEffect(() => { fetchUsdToIls().then(r => { if (r) setEditorFx(r); }); }, []);
    const [highlightKey, setHighlightKey] = useState(focusProductKey || null);
    const focusRefs = React.useRef({});
    const baselineRef = React.useRef(JSON.stringify(quote));
    const dirty = JSON.stringify(d) !== baselineRef.current;

    useEffect(() => {
        if (!focusProductKey) return;
        setCatFilter('');
        const scroll = setTimeout(() => {
            const el = focusRefs.current[focusProductKey];
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 280);
        const clear = setTimeout(() => setHighlightKey(null), 2800);
        return () => { clearTimeout(scroll); clearTimeout(clear); };
    }, [focusProductKey]);

    const drawerCats = useMemo(() => {
        const cats = new Set();
        (d.products || []).forEach(p => { if (p.category) cats.add(p.category); });
        return [...cats];
    }, [d.products]);
    const upd = (k, v) => setD(p => ({ ...p, [k]: v }));

    const handlePublished = async (product, newProductId) => {
        const updatedProds = (d.products || []).map(p =>
            (p.id || p.name) === (product.id || product.name) ? { ...p, publishedProductId: newProductId } : p
        );
        upd('products', updatedProds);
        try {
            await updateDoc(doc(db, 'supplier_quotes', quote.id), { products: updatedProds, updatedAt: serverTimestamp() });
            showToast('מוצר פורסם לחנות!', 'success');
        } catch { showToast('פורסם, אך שמירה ב-Firestore נכשלה', 'warning'); }
        // NOTE: intentionally NOT closing the modal here — success screen stays
        // visible so user can navigate to Products / Inventory. Closes via its own X button.
    };

    const save = async () => {
        setSaving(true);
        try {
            const { id, createdAt, ...rest } = d;
            await updateDoc(doc(db, 'supplier_quotes', quote.id), { ...rest, updatedAt: serverTimestamp() });
            baselineRef.current = JSON.stringify(d); // reset dirty tracking after save
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
        if (!await confirm({ message: 'למחוק הצעה זו?', danger: true })) return;
        try {
            await deleteDoc(doc(db, 'supplier_quotes', quote.id));
            onClose();
        } catch { showToast('שגיאה במחיקה', 'error'); }
    };

    const exportPDF = () => {
        const stage = NEG_STAGES.find(s => s.id === d.status)?.label || d.status;
        const rows = (d.products || []).map(p => {
            const net = (Number(p.pricePerUnit) || 0) * (1 - (Number(p.discount) || 0) / 100);
            return `<tr>
                <td>${p.name || '—'}</td><td>${p.modelNumber || '—'}</td><td>${p.brand || '—'}</td>
                <td style="text-align:center">${p.quantity || 1}</td>
                <td style="text-align:center">₪${Number(p.pricePerUnit || 0).toLocaleString()}</td>
                <td style="text-align:center">${p.discount || 0}%</td>
                <td style="text-align:center;font-weight:700">₪${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
            </tr>`;
        }).join('');
        const w = window.open('', '_blank', 'width=900,height=700');
        w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
        <title>הצעה #${d.quoteNumber || d.id?.slice(-6)} — ${supplier?.name}</title>
        <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, Arial, sans-serif; margin: 40px; color: #1D1D1F; font-size: 13px; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #007AFF; padding-bottom:16px; margin-bottom:24px; }
            .logo-box { font-size:28px; font-weight:900; color:#007AFF; }
            .meta { font-size:12px; color:#6E6E73; line-height:1.7; text-align:left; }
            h2 { font-size:16px; font-weight:800; margin:0 0 6px; }
            .badge { display:inline-block; padding:3px 10px; border-radius:6px; background:#007AFF20; color:#007AFF; font-size:11px; font-weight:700; }
            table { width:100%; border-collapse:collapse; margin-top:16px; }
            th { padding:9px 12px; background:#F5F5F7; font-size:11px; font-weight:800; color:#6E6E73; border-bottom:1px solid #E5E5EA; }
            td { padding:9px 12px; border-bottom:1px solid #F2F2F7; }
            .total-row { font-size:16px; font-weight:900; text-align:left; margin-top:16px; color:#007AFF; }
            .terms { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:24px; padding-top:16px; border-top:1px solid #E5E5EA; }
            .term-box { padding:10px 14px; border-radius:10px; background:#F5F5F7; }
            .term-label { font-size:10px; font-weight:700; color:#AEAEB2; margin-bottom:3px; }
            .term-val { font-size:13px; font-weight:700; }
            .notes-section { margin-top:24px; }
            .note { padding:8px 12px; border-radius:8px; background:#F5F5F7; margin-bottom:6px; font-size:12px; line-height:1.6; }
            .footer { margin-top:32px; font-size:10px; color:#AEAEB2; border-top:1px solid #E5E5EA; padding-top:12px; text-align:left; }
            @media print { body { margin:20px; } }
        </style></head><body>
        <div class="header">
            <div>
                <div class="logo-box">${supplier?.name || 'ספק'}</div>
                <div style="font-size:12px;color:#6E6E73;margin-top:4px">${supplier?.domain || ''}</div>
                <div style="margin-top:8px"><span class="badge">${stage}</span></div>
            </div>
            <div class="meta">
                <div><strong>הצעה מספר:</strong> #${d.quoteNumber || d.id?.slice(-6)}</div>
                <div><strong>תאריך:</strong> ${new Date().toLocaleDateString('he-IL')}</div>
                ${d.validUntil ? `<div><strong>תוקף:</strong> ${d.validUntil}</div>` : ''}
                ${supplier?.agentName ? `<div><strong>סוכן:</strong> ${supplier.agentName}${supplier.agentTitle ? ' · ' + supplier.agentTitle : ''}</div>` : ''}
                ${supplier?.agentPhone ? `<div><strong>טל׳:</strong> ${supplier.agentPhone}</div>` : ''}
                ${supplier?.agentEmail ? `<div><strong>מייל:</strong> ${supplier.agentEmail}</div>` : ''}
            </div>
        </div>
        <h2>מוצרים</h2>
        <table>
            <thead><tr><th>שם מוצר</th><th>דגם</th><th>מותג</th><th>כמות</th><th>מחיר ליח׳</th><th>הנחה</th><th>סה"כ</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="total-row">סה"כ הצעה: ₪${calcTotal(d.products || []).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        <div class="terms">
            ${d.deliveryMethod ? `<div class="term-box"><div class="term-label">אספקה</div><div class="term-val">${d.deliveryMethod}</div></div>` : ''}
            ${d.stockType ? `<div class="term-box"><div class="term-label">מלאי</div><div class="term-val">${d.stockType}</div></div>` : ''}
            ${d.leadTimeDays ? `<div class="term-box"><div class="term-label">זמן אספקה</div><div class="term-val">${d.leadTimeDays} ימים</div></div>` : ''}
            ${d.paymentTerms ? `<div class="term-box"><div class="term-label">תשלום</div><div class="term-val">${d.paymentTerms}</div></div>` : ''}
            ${d.warrantyMonths ? `<div class="term-box"><div class="term-label">אחריות</div><div class="term-val">${d.warrantyMonths} חודשים</div></div>` : ''}
            ${d.moq ? `<div class="term-box"><div class="term-label">MOQ</div><div class="term-val">${d.moq}</div></div>` : ''}
        </div>
        ${(d.notes || []).length > 0 ? `<div class="notes-section"><h2 style="font-size:14px">הערות</h2>${[...(d.notes || [])].reverse().map(n => `<div class="note">${n.text} <span style="color:#AEAEB2;font-size:10px">· ${new Date(n.ts).toLocaleDateString('he-IL')}</span></div>`).join('')}</div>` : ''}
        <div class="footer">הופק מ-NextClass Admin · ${new Date().toLocaleString('he-IL')}</div>
        <script>window.onload = () => window.print();</script>
        </body></html>`);
        w.document.close();
    };

    const updProd = (i, u) => { const a = [...(d.products || [])]; a[i] = u; upd('products', a); };
    const remProd = i => { const a = [...(d.products || [])]; a.splice(i, 1); upd('products', a); };
    const addProd = () => upd('products', [...(d.products || []), { id: uid(), modelNumber: '', name: '', pricePerUnit: 0, quantity: 1, discount: 0, category: catFilter || '' }]);

    const total = calcTotal(d.products);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={async () => { if (dirty && !await confirm({ message: 'יש שינויים שלא נשמרו. לסגור?', danger: true })) return; onClose(); }}
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
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SupplierAvatar domain={supplier?.domain} name={supplier?.name} color={supplier?.color} logoUrl={supplier?.logoUrl} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.3px' }}>{supplier?.name || 'ספק'}</div>
                        <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, marginTop: 1 }}>
                            הצעה #{d.quoteNumber || quote.id?.slice(-6)} · {fmtD(quote.createdAt)}
                        </div>
                    </div>
                    <StagePill stageId={d.status} />
                    <button onClick={exportPDF} title="ייצוא PDF"
                        style={{ padding: 7, borderRadius: 9, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', color: '#6E6E73', display: 'flex', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}>
                        <Printer size={14} />
                    </button>
                    <button onClick={delQuote} title="מחק הצעה"
                        style={{ padding: 7, borderRadius: 9, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', color: '#C7C7CC', display: 'flex', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.07)'; e.currentTarget.style.color = '#FF3B30'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = '#C7C7CC'; }}>
                        <Trash2 size={14} />
                    </button>
                    <button onClick={async () => { if (dirty && !await confirm({ message: 'יש שינויים שלא נשמרו. לסגור?', danger: true })) return; onClose(); }}
                        style={{ padding: 7, borderRadius: 9, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.03)', cursor: 'pointer', color: '#AEAEB2', display: 'flex', transition: 'all 0.15s' }}>
                        <X size={15} />
                    </button>
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FxRateButton rate={editorFx} onRefresh={setEditorFx} size="sm" />
                                        <motion.button onClick={addProd} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 8, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                            <Plus size={11} />מוצר
                                        </motion.button>
                                    </div>
                                } />

                            {/* Category filter chips */}
                            {drawerCats.length > 0 && (
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                    {['', ...drawerCats].map(cat => {
                                        const active = catFilter === cat;
                                        return (
                                            <button key={cat || '__all__'}
                                                onClick={() => setCatFilter(f => (cat === '' || f === cat) ? '' : cat)}
                                                style={{
                                                    padding: '5px 13px', borderRadius: 99,
                                                    border: active ? '1px solid rgba(0,122,255,0.30)' : '1px solid rgba(0,0,0,0.08)',
                                                    background: active
                                                        ? 'linear-gradient(135deg,rgba(0,122,255,0.11),rgba(90,200,250,0.09))'
                                                        : 'rgba(255,255,255,0.70)',
                                                    backdropFilter: 'blur(12px)',
                                                    WebkitBackdropFilter: 'blur(12px)',
                                                    boxShadow: active
                                                        ? '0 2px 8px rgba(0,122,255,0.13), inset 0 1px 0 rgba(255,255,255,0.85)'
                                                        : '0 1px 4px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                                                    color: active ? '#007AFF' : '#6E6E73',
                                                    fontSize: 10, fontWeight: active ? 700 : 600,
                                                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
                                                }}
                                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                                                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.70)'; }}>
                                                {cat || 'הכל'}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <AnimatePresence>
                                {(d.products || [])
                                    .map((p, i) => ({ p, i }))
                                    .filter(({ p }) => !catFilter || p.category === catFilter)
                                    .map(({ p, i }) => {
                                        const pKey = (p.modelNumber || p.name || '').trim();
                                        const isHighlighted = pKey && pKey === highlightKey;
                                        return (
                                            <div key={p.id || i}
                                                ref={el => { if (pKey) focusRefs.current[pKey] = el; }}
                                                style={{ borderRadius: 12, transition: 'background 0.5s', background: isHighlighted ? 'rgba(52,199,89,0.10)' : 'transparent', boxShadow: isHighlighted ? '0 0 0 2px rgba(52,199,89,0.35)' : 'none' }}>
                                                <ProductRow product={p} onChange={u => updProd(i, u)} onDelete={() => remProd(i)}
                                                    quoteStatus={d.status} onPublish={setPublishModal} onGoToProducts={() => navigate('/admin/products')}
                                                    allCategories={allCategories} fxRate={editorFx} />
                                            </div>
                                        );
                                    })}
                            </AnimatePresence>
                            {(d.products || []).length === 0 && (
                                <div style={{ textAlign: 'center', padding: '18px 0', color: '#AEAEB2', fontSize: 13 }}>לחץ "+ מוצר" להוסיף</div>
                            )}
                            {(d.products || []).length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                                    <div style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#AEAEB2' }}>סה"כ הצעה</span>
                                        <span style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.5px' }}>{fmt(total)}</span>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* 3 · Terms */}
                        <section>
                            <SL icon={<CreditCard size={12} />} label="תנאי עסקה" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <SFX label="שיטת אספקה"   value={d.deliveryMethod} onChange={v => upd('deliveryMethod', v)} options={DELIVERY_OPTS} />
                                <SFX label="סוג מלאי"     value={d.stockType}      onChange={v => upd('stockType', v)}      options={STOCK_OPTS} />
                                <NF label="זמן אספקה (ימים)" value={d.leadTimeDays}  onChange={v => upd('leadTimeDays', v)} />
                                <NF label="אחריות (חודשים)"  value={d.warrantyMonths} onChange={v => upd('warrantyMonths', v)} />
                                <SFX label="תנאי תשלום"   value={d.paymentTerms}   onChange={v => upd('paymentTerms', v)}   options={PAYMENT_OPTS.map(o => ({ id: o, label: o }))} />
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
                                        <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600, whiteSpace: 'nowrap', marginTop: 2 }}>{new Date(n.ts).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}</div>
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

                        {/* 7 · Activity Timeline */}
                        {(() => {
                            const events = [];
                            const createdTs = quote.createdAt?.seconds ? quote.createdAt.seconds * 1000 : null;
                            if (createdTs) events.push({ ts: createdTs, icon: <ClipboardList size={8} />, label: 'הצעה נוצרה', color: '#007AFF', sub: fmtD(quote.createdAt) });
                            (quote.notes || []).forEach(n => events.push({ ts: n.ts, icon: <MessageSquare size={8} />, label: n.text, color: '#5AC8FA', sub: new Date(n.ts).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }));
                            const pubProds = (quote.products || []).filter(p => p.publishedProductId);
                            pubProds.forEach(p => events.push({ ts: 0, icon: <Rocket size={8} />, label: `"${p.name || p.modelNumber}" פורסם לאתר`, color: '#34C759', sub: 'פורסם' }));
                            if (quote.status && quote.status !== 'received') {
                                const stg = NEG_STAGES.find(s => s.id === quote.status);
                                events.push({ ts: quote.updatedAt?.seconds ? quote.updatedAt.seconds * 1000 : 1, icon: <Zap size={8} />, label: `סטטוס עודכן: ${stg?.label || quote.status}`, color: stg?.color || '#FF9500', sub: fmtD(quote.updatedAt) });
                            }
                            const sorted = [...events].sort((a, b) => b.ts - a.ts);
                            if (sorted.length === 0) return null;
                            return (
                                <section>
                                    <SL icon={<Activity size={12} />} label="ציר פעילות" />
                                    <div style={{ position: 'relative', paddingRight: 20 }}>
                                        <div style={{ position: 'absolute', right: 7, top: 4, bottom: 4, width: 1.5, background: 'rgba(0,0,0,0.07)', borderRadius: 2 }} />
                                        {sorted.map((e, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < sorted.length - 1 ? 14 : 0, position: 'relative' }}>
                                                <div style={{ position: 'absolute', right: -13, top: 2, width: 14, height: 14, borderRadius: '50%', background: `${e.color}18`, border: `2px solid ${e.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, zIndex: 1 }}>{e.icon}</div>
                                                <div style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.4 }}>{e.label}</div>
                                                    {e.sub && <div style={{ fontSize: 10, color: '#AEAEB2', marginTop: 2 }}>{e.sub}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })()}

                        {/* 8 · Email */}
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
                        style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: dirty ? 'linear-gradient(135deg,#007AFF,#5AC8FA)' : 'rgba(0,0,0,0.05)', color: dirty ? '#fff' : '#AEAEB2', fontSize: 14, fontWeight: 800, cursor: dirty ? 'pointer' : 'not-allowed', boxShadow: dirty ? '0 4px 18px rgba(0,122,255,0.28)' : 'none', transition: 'all 0.2s' }}>
                        {saving ? 'שומר...' : dirty ? 'שמור שינויים' : 'אין שינויים'}
                    </motion.button>
                </div>
            </motion.div>

            {/* Publish modal — layered on top of the drawer */}
            <AnimatePresence>
                {publishModal && (
                    <PublishProductModal
                        key="pub-modal"
                        product={publishModal}
                        quoteId={quote.id}
                        addProduct={addProduct}
                        onClose={() => setPublishModal(null)}
                        onPublished={handlePublished}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ─── QuoteCard ─────────────────────────────────────────────────────────────────
function QuoteCard({ quote, onClick }) {
    const total          = calcTotal(quote.products);
    const stage          = NEG_STAGES.find(s => s.id === quote.status) || NEG_STAGES[0];
    const pct            = (NEG_STAGES.findIndex(s => s.id === quote.status) / (NEG_STAGES.length - 1)) * 100;
    const totalProds     = (quote.products || []).length;
    const publishedCount = (quote.products || []).filter(p => p.publishedProductId).length;
    const readyToPublish = (quote.status === 'agreed' || quote.status === 'ordered') && totalProds > 0;

    // Compute expiry urgency
    let expiryDays = null;
    if (quote.validUntil) {
        let d;
        if (/^\d{4}-\d{2}-\d{2}$/.test(quote.validUntil)) d = new Date(quote.validUntil);
        else if (/^\d{2}\/\d{2}\/\d{4}$/.test(quote.validUntil)) {
            const [dd, mm, yyyy] = quote.validUntil.split('/');
            d = new Date(`${yyyy}-${mm}-${dd}`);
        }
        if (d && !isNaN(d)) expiryDays = Math.ceil((d - Date.now()) / 86400000);
    }
    const expiryBadge = expiryDays !== null
        ? expiryDays < 0  ? { label: 'פג תוקף!', color: '#FF3B30', bg: 'rgba(255,59,48,0.10)' }
        : expiryDays <= 3 ? { label: `${expiryDays}ד׳ לפקיעה!`, color: '#FF3B30', bg: 'rgba(255,59,48,0.09)' }
        : expiryDays <= 7 ? { label: `${expiryDays}ד׳ לפקיעה`, color: '#FF9500', bg: 'rgba(255,149,0,0.09)' }
        : expiryDays <= 14 ? { label: `${expiryDays}ד׳ נותרו`, color: '#FFCC02', bg: 'rgba(255,204,2,0.10)' }
        : null
        : null;

    return (
        <motion.div onClick={onClick} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.09), 0 2px 12px rgba(0,0,0,0.05)' }} whileTap={{ scale: 0.985 }}
            style={{ ...G, padding: '18px 20px', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>

            {/* Ultra-thin progress strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.04)', borderRadius: '20px 20px 0 0' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: stage.color, borderRadius: '20px 20px 0 0', opacity: 0.6 }} />
            </div>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.3px' }}>
                        הצעה #{quote.quoteNumber || quote.id?.slice(-6)}
                    </div>
                    <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, marginTop: 2 }}>
                        {fmtD(quote.createdAt)}{quote.validUntil ? ` · עד ${quote.validUntil}` : ''}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <StagePill stageId={quote.status} sm />
                    {expiryBadge && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: expiryBadge.color, background: expiryBadge.bg, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${expiryBadge.color}20` }}>
                            <AlertCircle size={8} />{expiryBadge.label}
                        </span>
                    )}
                </div>
            </div>

            {/* Product chips — subtle, monochromatic */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {(quote.products || []).slice(0, 3).map((p, i) => (
                    <span key={i} style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', fontSize: 11, fontWeight: 500, color: '#6E6E73', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name || p.modelNumber || 'מוצר'}
                    </span>
                ))}
                {(quote.products || []).length > 3 && (
                    <span style={{ padding: '3px 9px', borderRadius: 8, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', fontSize: 11, fontWeight: 600, color: '#8E8E93' }}>+{(quote.products || []).length - 3}</span>
                )}
                {(quote.products || []).length === 0 && (
                    <span style={{ fontSize: 11, color: '#C7C7CC', fontStyle: 'italic' }}>אין מוצרים עדיין</span>
                )}
            </div>

            {/* Footer row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {quote.leadTimeDays && (
                        <span style={{ fontSize: 10, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
                            <Truck size={9} />{quote.leadTimeDays} ימ׳
                        </span>
                    )}
                    {quote.paymentTerms && (
                        <span style={{ fontSize: 10, color: '#AEAEB2', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
                            <CreditCard size={9} />{quote.paymentTerms}
                        </span>
                    )}
                    {readyToPublish && (
                        <span style={{ fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, color: publishedCount === totalProds ? '#34C759' : '#8E8E93' }}>
                            <Globe size={9} />
                            {publishedCount === totalProds ? `${totalProds} פורסמו` : `${publishedCount}/${totalProds}`}
                        </span>
                    )}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.5px' }}>
                    {total > 0 ? fmt(total) : '—'}
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight size={12} style={{ position: 'absolute', top: '50%', left: 18, transform: 'translateY(-50%)', color: '#D1D1D6' }} />
        </motion.div>
    );
}

// ─── Supplier Scorecard ────────────────────────────────────────────────────────
function SupplierScorecard({ quotes }) {
    const closed      = quotes.filter(q => q.status === 'agreed' || q.status === 'ordered').length;
    const totalValue  = quotes.reduce((s, q) => s + calcTotal(q.products || []), 0);
    const published   = quotes.flatMap(q => q.products || []).filter(p => p.publishedProductId).length;
    const closeRate   = quotes.length > 0 ? closed / quotes.length : 0;
    const avgLead     = quotes.filter(q => Number(q.leadTimeDays) > 0).reduce((s, q, _, a) => s + Number(q.leadTimeDays) / a.length, 0);

    const score = Math.min(100, Math.round(
        Math.min(quotes.length / 5, 1) * 20 +
        closeRate * 35 +
        Math.min(totalValue / 50000, 1) * 25 +
        Math.min(published / 5, 1) * 20
    ));

    const scoreColor = score >= 70 ? '#34C759' : score >= 40 ? '#FF9500' : '#8E8E93';
    const scoreLabel = score >= 70 ? 'ספק מצוין' : score >= 40 ? 'ספק טוב' : 'ספק חדש';
    const circ = 2 * Math.PI * 22;

    return (
        <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 16, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Score ring */}
            <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
                <svg width="54" height="54" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                    <circle cx="27" cy="27" r="20" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="4" />
                    <circle cx="27" cy="27" r="20" fill="none" stroke="#1D1D1F" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={2 * Math.PI * 20 * (1 - score / 100)}
                        strokeOpacity="0.7"
                        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#1D1D1F' }}>{score}</div>
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73', marginBottom: 8, letterSpacing: '-0.1px' }}>{scoreLabel}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                        { icon: CheckCircle2, label: `${closed} נסגרו`, sub: `${Math.round(closeRate * 100)}% אחוז סגירה`, color: '#34C759' },
                        { icon: Globe,        label: `${published} פורסמו`, sub: 'מוצרים לאתר',  color: '#007AFF' },
                        { icon: CreditCard,   label: fmt(totalValue),        sub: 'ערך כולל',      color: '#5AC8FA' },
                        avgLead > 0 ? { icon: Clock, label: `${Math.round(avgLead)} ימים`, sub: 'זמן אספקה ממוצע', color: '#FF9500' } : null,
                    ].filter(Boolean).map((kpi, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <kpi.icon size={11} color="#8E8E93" />
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.2px' }}>{kpi.label}</div>
                                <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 500 }}>{kpi.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── SupplierView ──────────────────────────────────────────────────────────────
function SupplierView({ supplier, quotes, onAddQuote, onSelectQuote, onEditSupplier }) {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const totalVal = quotes.reduce((s, q) => s + calcTotal(q.products), 0);
    const [quotesView, setQuotesView] = useState('grid'); // 'grid' | 'kanban'
    const [selected, setSelected] = useState(new Set()); // Set of quote IDs
    const [bulkStatus, setBulkStatus] = useState('');

    const sendRFQ = () => {
        const products = quotes.flatMap(q => q.products || []).filter((p, i, a) => p.name && a.findIndex(x => x.name === p.name) === i).slice(0, 8);
        const prodList = products.length > 0
            ? products.map(p => `• ${p.name}${p.modelNumber ? ` (${p.modelNumber})` : ''}`).join('\n')
            : '• [פרט כאן את המוצרים המבוקשים]';
        const msg = `שלום${supplier.agentName ? ` ${supplier.agentName}` : ''},\n\nאנחנו מ-NextClass – מפיצי ציוד חינוכי.\n\nאשמח לקבל הצעת מחיר עבור:\n${prodList}\n\nנא לכלול: מחיר ליחידה, כמות מינימלית, זמן אספקה ותנאי תשלום.\n\nתודה רבה! 🙏\nNextClass`;
        const phone = (supplier.agentPhone || '').replace(/\D/g,'').replace(/^0/,'972');
        if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        else if (supplier.agentEmail) window.open(`mailto:${supplier.agentEmail}?subject=${encodeURIComponent('בקשת הצעת מחיר – NextClass')}&body=${encodeURIComponent(msg)}`, '_blank');
        else showToast('אין פרטי קשר לספק זה', 'error');
    };

    const applyBulkStatus = async () => {
        if (!bulkStatus || selected.size === 0) return;
        for (const qId of selected) {
            try { await updateDoc(doc(db, 'supplier_quotes', qId), { status: bulkStatus, updatedAt: serverTimestamp() }); } catch {}
        }
        setSelected(new Set());
        setBulkStatus('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Hero */}
            <div style={{ ...G, padding: 24 }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                    <SupplierAvatar domain={supplier.domain} name={supplier.name} color={supplier.color} logoUrl={supplier.logoUrl} size={68} />
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

                    {/* Quote count chip */}
                    <div style={{ flexShrink: 0 }}>
                        <KPIBox label="הצעות" value={quotes.length} color={GOLD} />
                    </div>
                </div>
                <SupplierScorecard quotes={quotes} />
            </div>

            {/* Quotes header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px' }}>הצעות מחיר</span>
                <div style={{ display: 'flex', gap: 7 }}>
                    <motion.button onClick={sendRFQ} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.03)', color: '#6E6E73', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <MessageCircle size={13} />בקש הצעה
                    </motion.button>
                    <motion.button onClick={onAddQuote} whileHover={{ y: -2, boxShadow: `0 8px 24px ${hexA(GOLD, 0.5)}` }} whileTap={TAP}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: RADIUS.button, border: '1px solid rgba(255,255,255,0.25)', background: GOLD_GRAD, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 16px ${hexA(GOLD, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                        <Plus size={13} />הצעה חדשה
                    </motion.button>
                </div>
            </div>

            {/* View toggle */}
            {quotes.length > 0 && (
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => selected.size > 0 ? setSelected(new Set()) : setSelected(new Set(quotes.map(q => q.id)))}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.07)', background: selected.size > 0 ? 'rgba(255,59,48,0.06)' : 'transparent', color: selected.size > 0 ? '#FF3B30' : '#8E8E93', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {selected.size > 0 ? <><X size={9} />בטל</> : 'בחר'}
                    </button>
                    <div style={{ display: 'flex', gap: 2, padding: '3px', background: 'rgba(0,0,0,0.05)', borderRadius: 9, border: '1px solid rgba(0,0,0,0.05)' }}>
                        {[{ id: 'grid', label: 'רשימה' }, { id: 'kanban', label: 'סטטוס' }].map(v => (
                            <button key={v.id} onClick={() => setQuotesView(v.id)}
                                style={{ padding: '4px 11px', borderRadius: 7, border: quotesView === v.id ? `1px solid ${hexA(GOLD, 0.3)}` : '1px solid transparent', background: quotesView === v.id ? GOLD_SOFT : 'transparent', color: quotesView === v.id ? '#005EC4' : '#8E8E93', fontSize: 11, fontWeight: quotesView === v.id ? 800 : 600, cursor: 'pointer', transition: 'all 0.15s', boxShadow: quotesView === v.id ? `0 2px 8px ${hexA(GOLD, 0.15)}` : 'none' }}>
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {quotes.length === 0 ? (
                <Empty icon={<Package size={30} />} text="אין הצעות עדיין" sub="לחץ על ׳הצעה חדשה׳ כדי להתחיל" />
            ) : quotesView === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    <AnimatePresence>
                        {quotes.map(q => (
                            <div key={q.id} style={{ position: 'relative' }}>
                                {selected.size > 0 && (
                                    <button onClick={e => { e.stopPropagation(); setSelected(s => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; }); }}
                                        style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected.has(q.id) ? GOLD : 'rgba(0,0,0,0.2)'}`, background: selected.has(q.id) ? GOLD : 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {selected.has(q.id) && <Check size={11} color="#fff" />}
                                    </button>
                                )}
                                <QuoteCard quote={q} onClick={() => selected.size > 0 ? setSelected(s => { const n = new Set(s); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; }) : onSelectQuote(q)} />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                /* Kanban board */
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                    {NEG_STAGES.map(stage => {
                        const stageQuotes = quotes.filter(q => (q.status || 'received') === stage.id);
                        return (
                            <div key={stage.id} style={{ flex: '0 0 210px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {/* Column header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 10, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, flexShrink: 0, opacity: 0.8 }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#3C3C43', flex: 1, letterSpacing: '-0.1px' }}>{stage.label}</span>
                                    {stageQuotes.length > 0 && (
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 5 }}>{stageQuotes.length}</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {stageQuotes.map(q => (
                                        <motion.div key={q.id} onClick={() => onSelectQuote(q)}
                                            whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }} whileTap={{ scale: 0.98 }}
                                            style={{ ...CARD, padding: '12px 13px', cursor: 'pointer' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', marginBottom: 4, letterSpacing: '-0.2px' }}>#{q.quoteNumber || q.id?.slice(-6)}</div>
                                            <div style={{ fontSize: 10, color: '#AEAEB2', marginBottom: 5, fontWeight: 500 }}>{(q.products || []).length} מוצרים</div>
                                            {calcTotal(q.products) > 0 && (
                                                <div style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.3px' }}>{fmt(calcTotal(q.products))}</div>
                                            )}
                                            {q.validUntil && <div style={{ fontSize: 9, color: '#C7C7CC', marginTop: 4, fontWeight: 500 }}>עד {q.validUntil}</div>}
                                        </motion.div>
                                    ))}
                                    {stageQuotes.length === 0 && (
                                        <div style={{ padding: '16px 0', textAlign: 'center', color: '#D1D1D6', fontSize: 11 }}>ריק</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Floating bulk action bar */}
            <AnimatePresence>
                {selected.size > 0 && (
                    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                        style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: 'rgba(29,29,31,0.95)', backdropFilter: 'blur(30px)', borderRadius: 18, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.12)', minWidth: 340 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{selected.size} נבחרו</span>
                        <button onClick={() => setSelected(new Set())} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>בטל</button>
                        <div style={{ flex: 1 }} />
                        <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                            style={{ padding: '7px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', direction: 'rtl' }}>
                            <option value="">שנה סטטוס...</option>
                            {NEG_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <motion.button onClick={applyBulkStatus} disabled={!bulkStatus} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            style={{ padding: '8px 16px', borderRadius: 11, border: 'none', background: bulkStatus ? GOLD_GRAD : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, fontWeight: 800, cursor: bulkStatus ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Check size={12} />החל
                        </motion.button>
                        <motion.button onClick={async () => {
                            if (!await confirm({ message: `למחוק ${selected.size} הצעות?`, danger: true })) return;
                            for (const qId of selected) { try { await deleteDoc(doc(db, 'supplier_quotes', qId)); } catch {} }
                            setSelected(new Set());
                        }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            style={{ padding: '8px 14px', borderRadius: 11, border: 'none', background: 'rgba(255,59,48,0.22)', color: '#FF3B30', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Trash2 size={12} />מחק
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KPIBox({ label, value, color = GOLD, small }) {
    return (
        <div style={{ ...GLASS.base, borderRadius: RADIUS.smCard, padding: '12px 18px', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: small ? 16 : 26, fontWeight: 900, letterSpacing: '-0.6px', lineHeight: 1, background: `linear-gradient(135deg, ${color}, ${color}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#86868B', marginTop: 3 }}>{label}</div>
        </div>
    );
}

// ─── CompareTab ────────────────────────────────────────────────────────────────
function CompareTab({ suppliers, quotes, onSelectSupplier, onSelectQuote }) {
    const [search,    setSearch]    = useState('');
    const [sortBy,    setSortBy]    = useState('name');
    const [sortDir,   setSortDir]   = useState('asc');
    const [catFilter, setCatFilter] = useState('');
    const [viewMode,  setViewMode]  = useState('table'); // 'table' | 'cards' | 'bar'
    const [usdRate,   setUsdRate]   = useState(_fxCache.usdToIls);

    useEffect(() => { fetchUsdToIls().then(r => { if (r) setUsdRate(r); }); }, []);

    // Build matrix: productKey → {label, model, image, rows: {supplierId → [{price, qty, qNum}]}}
    const matrix = useMemo(() => {
        const map = {};
        quotes.forEach(q => {
            (q.products || []).forEach(p => {
                const key = (p.modelNumber || p.name || '').trim();
                if (!key) return;
                if (!map[key]) map[key] = { label: p.name || p.modelNumber, model: p.modelNumber, image: p.imageUrl, category: p.category || '', rows: {} };
                if (!map[key].rows[q.supplierId]) map[key].rows[q.supplierId] = [];
                // USD products always reflect the LIVE rate (so the "שער דולר" refresh re-converts them);
                // ILS / fixed-price products keep their stored price.
                let unitPrice;
                if (p.currency === 'USD' && p.priceInUsd && usdRate) {
                    unitPrice = Math.round(parseFloat(p.priceInUsd) * usdRate * 100) / 100;
                } else {
                    unitPrice = Number(p.pricePerUnit) || 0;
                }
                const price = unitPrice * (1 - (Number(p.discount) || 0) / 100);
                map[key].rows[q.supplierId].push({ price, qty: Number(p.quantity) || 1, qNum: q.quoteNumber || q.id?.slice(-6), quoteId: q.id, productKey: key });
            });
        });
        return Object.values(map).filter(r => Object.keys(r.rows).length > 0);
    }, [quotes, usdRate]);

    // Win counts per supplier across all products
    const winCounts = useMemo(() => {
        const w = {};
        suppliers.forEach(s => { w[s.id] = 0; });
        matrix.forEach(row => {
            const all = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ sid: s.id, price: e.price })));
            const withPrice = all.filter(e => e.price > 0);
            if (withPrice.length < 2) return;
            const min = Math.min(...withPrice.map(e => e.price));
            withPrice.filter(e => e.price <= min + 0.01).forEach(e => { if (w[e.sid] !== undefined) w[e.sid]++; });
        });
        return w;
    }, [matrix, suppliers]);

    // Total per supplier (sum of cheapest entry per product)
    const supTotals = useMemo(() => {
        const t = {};
        suppliers.forEach(s => {
            t[s.id] = matrix.reduce((sum, row) => {
                const entries = row.rows[s.id] || [];
                if (!entries.length) return sum;
                return sum + Math.min(...entries.map(e => e.price));
            }, 0);
        });
        return t;
    }, [matrix, suppliers]);

    const bestTotalId = useMemo(() =>
        suppliers.reduce((best, s) => {
            if (!supTotals[s.id]) return best;
            if (!best || supTotals[s.id] < supTotals[best]) return s.id;
            return best;
        }, null)
    , [supTotals, suppliers]);

    const savingsData = useMemo(() => {
        if (matrix.length === 0 || suppliers.length < 2) return null;
        let bestSum = 0, worstSum = 0;
        matrix.forEach(row => {
            const prices = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => e.price)).filter(p => p > 0);
            if (prices.length >= 2) { bestSum += Math.min(...prices); worstSum += Math.max(...prices); }
        });
        const savings = worstSum - bestSum;
        return savings > 0 ? { savings, bestSum, worstSum } : null;
    }, [matrix, suppliers]);

    const availCats = useMemo(() => {
        const s = new Set(matrix.map(r => r.category).filter(Boolean));
        return [...s].sort((a, b) => a.localeCompare(b, 'he'));
    }, [matrix]);

    // Filter + sort
    const displayRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = matrix.filter(r => {
            if (catFilter && r.category !== catFilter) return false;
            if (!q) return true;
            return (r.label || '').toLowerCase().includes(q) || (r.model || '').toLowerCase().includes(q);
        });
        return [...filtered].sort((a, b) => {
            if (sortBy === 'name') {
                const cmp = (a.label || '').localeCompare(b.label || '', 'he');
                return sortDir === 'asc' ? cmp : -cmp;
            }
            const ap = (a.rows[sortBy] || []).reduce((mn, e) => Math.min(mn, e.price), Infinity);
            const bp = (b.rows[sortBy] || []).reduce((mn, e) => Math.min(mn, e.price), Infinity);
            const aVal = isFinite(ap) ? ap : (sortDir === 'asc' ? Infinity : -Infinity);
            const bVal = isFinite(bp) ? bp : (sortDir === 'asc' ? Infinity : -Infinity);
            return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [matrix, search, sortBy, sortDir, catFilter]);

    // Global cheapest price per category across all displayed products
    const categoryMinPrice = useMemo(() => {
        const map = {};
        displayRows.forEach(row => {
            const cat = row.category || '';
            const prices = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => e.price)).filter(x => x > 0);
            const rowMin = prices.length ? Math.min(...prices) : Infinity;
            if (rowMin < (map[cat] ?? Infinity)) map[cat] = rowMin;
        });
        return map;
    }, [displayRows, suppliers]);

    const openQuote = (quoteId, productKey) => {
        const q = quotes.find(x => x.id === quoteId);
        if (q && onSelectSupplier && onSelectQuote) { onSelectSupplier(q.supplierId); onSelectQuote(q, productKey); }
    };

    const toggleSort = col => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('asc'); }
    };

    if (matrix.length === 0) return <Empty icon={<Layers size={34} />} text="אין נתונים להשוואה" sub="הוסף הצעות מחיר עם מוצרים כדי לראות השוואה" />;

    const PROD_COL = 230;
    const SUP_COL  = 170;
    const WIN_COL  = 130;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── Supplier scorecards ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(suppliers.length, 4)}, 1fr)`, gap: 10 }}>
                {suppliers.map(s => {
                    const sQ       = quotes.filter(q => q.supplierId === s.id);
                    const isBest   = s.id === bestTotalId && supTotals[s.id] > 0;
                    const wins     = winCounts[s.id] || 0;
                    const coverage = matrix.filter(row => (row.rows[s.id] || []).length > 0).length;
                    return (
                        <div key={s.id} style={{
                            ...CARD, padding: '14px 16px', position: 'relative', overflow: 'hidden',
                        }}>
                            {isBest && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#34C759', borderRadius: '16px 16px 0 0', opacity: 0.7 }} />}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: isBest ? 4 : 0 }}>
                                <SupplierAvatar domain={s.domain} name={s.name} color={s.color} logoUrl={s.logoUrl} size={36} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.2px' }}>{s.name}</span>
                                        {isBest && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#34C759', background: 'rgba(52,199,89,0.09)', padding: '2px 7px', borderRadius: 5, border: '1px solid rgba(52,199,89,0.18)' }}>
                                                הכי זול
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#AEAEB2', marginTop: 2, fontWeight: 500 }}>{sQ.length} הצעות · {coverage} מוצרים</div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginTop: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 16, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.4px' }}>{fmt(supTotals[s.id])}</span>
                                        {wins > 0 && (
                                            <span style={{ fontSize: 10, color: '#8E8E93', fontWeight: 600 }}>{wins} זכ׳</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Savings banner ──────────────────────────────────────── */}
            {savingsData && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...CARD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(140deg, #34C7592b, #34C75912)', border: '1px solid #34C75926', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px #34C75922', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrendingUp size={16} color="#34C759" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', marginBottom: 2, letterSpacing: '-0.2px' }}>חיסכון פוטנציאלי בבחירה חכמה</div>
                        <div style={{ fontSize: 11, color: '#6E6E73', fontWeight: 500 }}>
                            בחר הספק הזול לכל מוצר וחסוך <span style={{ fontWeight: 700, color: '#34C759' }}>{fmt(savingsData.savings)}</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #34C759, #34C759c4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(savingsData.savings)}</div>
                        <div style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600 }}>חיסכון</div>
                    </div>
                </motion.div>
            )}

            {/* ── FX rate + View mode toggle ──────────────────────── */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <FxRateButton rate={usdRate} onRefresh={setUsdRate} />
                <div style={{ display: 'flex', gap: 2, padding: '3px', background: 'rgba(0,0,0,0.05)', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
                    {[
                        { id: 'table', label: 'טבלה' },
                        { id: 'cards', label: 'כרטיסים' },
                        { id: 'bar',   label: 'פסים' },
                        { id: 'chart', label: 'גרף' },
                    ].map(v => (
                        <button key={v.id} onClick={() => setViewMode(v.id)} style={{
                            padding: '5px 12px', borderRadius: 8,
                            border: viewMode === v.id ? '1px solid rgba(0,122,255,0.22)' : '1px solid transparent',
                            background: viewMode === v.id ? 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(90,200,250,0.08) 100%)' : 'transparent',
                            color: viewMode === v.id ? '#007AFF' : '#6E6E73',
                            fontSize: 11, fontWeight: viewMode === v.id ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: viewMode === v.id ? '0 2px 8px rgba(0,122,255,0.13)' : 'none',
                        }}>
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Category filter chips ───────────────────────────── */}
            {availCats.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['', ...availCats].map(cat => {
                        const active = catFilter === cat;
                        return (
                            <button key={cat || '__all__'}
                                onClick={() => setCatFilter(c => (cat === '' || c === cat) ? '' : cat)}
                                style={{
                                    padding: '6px 14px', borderRadius: 99,
                                    border: active ? '1px solid rgba(0,122,255,0.30)' : '1px solid rgba(255,255,255,0.65)',
                                    background: active
                                        ? 'linear-gradient(135deg,rgba(0,122,255,0.12),rgba(90,200,250,0.10))'
                                        : 'rgba(255,255,255,0.62)',
                                    backdropFilter: 'blur(14px)',
                                    WebkitBackdropFilter: 'blur(14px)',
                                    boxShadow: active
                                        ? '0 2px 10px rgba(0,122,255,0.14), inset 0 1px 0 rgba(255,255,255,0.9)'
                                        : '0 1px 5px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                                    color: active ? '#007AFF' : '#6E6E73',
                                    fontSize: 11, fontWeight: active ? 700 : 600,
                                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.18s',
                                }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.95)'; }}}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.62)'; e.currentTarget.style.boxShadow = '0 1px 5px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)'; }}}>
                                {cat || 'הכל'}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Search bar ──────────────────────────────────────── */}
            <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', pointerEvents: 'none' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`חיפוש בין ${matrix.length} מוצרים...`}
                    style={{ ...inputCss, paddingRight: 36, paddingLeft: search ? 34 : 14, borderRadius: 12, padding: '10px 36px 10px 14px', fontSize: 13 }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#AEAEB2', padding: 2, display: 'flex' }}>
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* ── Main comparison table ────────────────────────────── */}
            {viewMode === 'table' && <div style={{ ...G, overflow: 'hidden', padding: 0 }}>
                <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
                    <table style={{
                        borderCollapse: 'separate', borderSpacing: 0,
                        direction: 'rtl',
                        minWidth: PROD_COL + suppliers.length * SUP_COL + WIN_COL,
                        width: '100%',
                        tableLayout: 'fixed',
                    }}>
                        <colgroup>
                            <col style={{ width: PROD_COL }} />
                            {suppliers.map(s => <col key={s.id} style={{ width: SUP_COL }} />)}
                            <col style={{ width: WIN_COL }} />
                        </colgroup>
                        <thead>
                            <tr>
                                {/* Product col header */}
                                <th onClick={() => toggleSort('name')} style={{
                                    padding: '12px 16px', textAlign: 'right', cursor: 'pointer', userSelect: 'none',
                                    position: 'sticky', right: 0, zIndex: 4,
                                    background: 'rgba(248,248,252,0.98)', backdropFilter: 'blur(20px)',
                                    borderBottom: '2px solid rgba(0,0,0,0.07)',
                                    borderLeft: '1px solid rgba(0,0,0,0.06)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 800, color: '#6E6E73', letterSpacing: '0.05em' }}>מוצר</span>
                                        <span style={{ fontSize: 11, color: '#C7C7CC', fontWeight: 600 }}>({displayRows.length})</span>
                                        <span style={{ fontSize: 12, color: sortBy === 'name' ? '#007AFF' : '#D1D1D6', marginRight: 'auto' }}>
                                            {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                                        </span>
                                    </div>
                                </th>
                                {/* Supplier col headers */}
                                {suppliers.map(s => (
                                    <th key={s.id} onClick={() => toggleSort(s.id)} style={{
                                        padding: '10px 12px', textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                                        position: 'sticky', top: 0, zIndex: 3,
                                        background: 'rgba(248,248,252,0.98)', backdropFilter: 'blur(20px)',
                                        borderBottom: '2px solid rgba(0,0,0,0.07)',
                                        borderRight: '1px solid rgba(0,0,0,0.05)',
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                            <div onClick={e => { e.stopPropagation(); onSelectSupplier?.(s.id); }}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: onSelectSupplier ? 'pointer' : 'default', padding: '3px 6px', borderRadius: 10, transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.07)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <SupplierAvatar domain={s.domain} name={s.name} color={s.color} logoUrl={s.logoUrl} size={28} />
                                                <span style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: SUP_COL - 36 }}>{s.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                                {winCounts[s.id] > 0 && (
                                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.10)', padding: '1px 5px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                                        <Crown size={8} /> {winCounts[s.id]}
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 11, color: sortBy === s.id ? '#007AFF' : '#D1D1D6' }}>
                                                    {sortBy === s.id ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                                                </span>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                                {/* Winner col header */}
                                <th style={{
                                    padding: '10px 12px', textAlign: 'center',
                                    position: 'sticky', top: 0, zIndex: 3,
                                    background: 'rgba(248,248,252,0.98)', backdropFilter: 'blur(20px)',
                                    borderBottom: '2px solid rgba(0,0,0,0.07)',
                                    borderRight: '1px solid rgba(0,0,0,0.05)',
                                }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#34C759', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Crown size={11} /> זול ביותר</span>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {displayRows.map((row, ri) => {
                                const allE        = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id })));
                                const prices      = allE.map(e => e.price).filter(x => x > 0);
                                const minP        = prices.length ? Math.min(...prices) : 0;
                                const maxP        = prices.length ? Math.max(...prices) : 0;
                                const hasMultiple = prices.length >= 2 && maxP > minP;
                                const bestSid     = prices.length > 0 ? allE.find(e => e.price > 0 && e.price <= minP + 0.01)?.sid : null;
                                const bestSup     = suppliers.find(s => s.id === bestSid);
                                const savings     = hasMultiple ? maxP - minP : 0;
                                const rowBg       = ri % 2 ? 'rgba(0,0,0,0.009)' : 'transparent';
                                const stickyBg    = ri % 2 ? 'rgb(247,247,249)' : 'rgb(255,255,255)';

                                return (
                                    <tr key={row.model || row.label || ri} style={{ background: rowBg }}>
                                        {/* Product cell — sticky */}
                                        <td style={{
                                            padding: '10px 14px', position: 'sticky', right: 0, zIndex: 2,
                                            background: stickyBg,
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            borderLeft: '1px solid rgba(0,0,0,0.05)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 9,
                                                cursor: bestSid && onSelectSupplier ? 'pointer' : 'default', borderRadius: 10, transition: 'background 0.15s' }}
                                                onClick={() => bestSid && onSelectSupplier?.(bestSid)}
                                                onMouseEnter={e => { if (bestSid) e.currentTarget.style.background = 'rgba(0,122,255,0.05)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                {row.image ? (
                                                    <img src={row.image} alt="" style={{ width: 34, height: 34, objectFit: 'contain', borderRadius: 8, background: 'rgba(0,0,0,0.03)', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                                                ) : (
                                                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0,0,0,0.04)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Package size={15} color="#AEAEB2" />
                                                    </div>
                                                )}
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: PROD_COL - 70 }}>{row.label}</div>
                                                    {row.model && <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600, marginTop: 1 }}>{row.model}</div>}
                                                    {row.category && <span style={{ display: 'inline-block', marginTop: 3, padding: '1px 6px', borderRadius: 5, background: 'rgba(0,0,0,0.05)', color: '#6E6E73', fontSize: 9, fontWeight: 600, border: '1px solid rgba(0,0,0,0.07)' }}>{row.category}</span>}
                                                    {prices.length > 0 && <div style={{ fontSize: 10, color: '#8E8E93', marginTop: 2 }}>
                                                        {prices.length} הצעות · מינ׳ {fmt(minP)}
                                                    </div>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Supplier price cells */}
                                        {suppliers.map(s => {
                                            const entries = row.rows[s.id] || [];
                                            if (!entries.length) return (
                                                <td key={s.id} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                                    <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.08)' }}>—</span>
                                                </td>
                                            );
                                            const best    = entries.reduce((a, b) => a.price < b.price ? a : b);
                                            const catMin  = categoryMinPrice[row.category || ''] ?? Infinity;
                                            const isBest  = isFinite(catMin) && best.price <= catMin + 0.01;
                                            const isWorst = hasMultiple && best.price >= maxP - 0.01;
                                            const diffPct = minP > 0 && !isBest ? ((best.price - minP) / minP * 100) : 0;
                                            return (
                                                <td key={s.id} style={{ padding: '8px 10px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                                    <div onClick={() => openQuote(best.quoteId, best.productKey)} style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                                        padding: '8px 10px', borderRadius: 11, cursor: 'pointer',
                                                        background: isBest ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.02)',
                                                        border: `1px solid ${isBest ? 'rgba(52,199,89,0.20)' : 'rgba(0,0,0,0.06)'}`,
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = isBest ? 'rgba(52,199,89,0.09)' : 'rgba(0,0,0,0.04)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = isBest ? 'rgba(52,199,89,0.06)' : 'rgba(0,0,0,0.02)'}>
                                                        {isBest && <span style={{ fontSize: 9, fontWeight: 800, color: '#34C759', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 2 }}><Crown size={8} /> הכי זול</span>}
                                                        <span style={{ fontSize: 16, fontWeight: 900, color: isBest ? '#34C759' : '#1D1D1F', lineHeight: 1.15, letterSpacing: '-0.4px' }}>{fmt(best.price)}</span>
                                                        {diffPct > 0.5 && <span style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600 }}>+{diffPct.toFixed(0)}%</span>}
                                                        <span style={{ fontSize: 9, color: '#C7C7CC', fontWeight: 500 }}>מינ׳ {best.qty} · #{best.qNum}</span>
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Winner cell */}
                                        <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)', borderRight: '1px solid rgba(0,0,0,0.04)' }}>
                                            {bestSup ? (
                                                <div onClick={() => onSelectSupplier?.(bestSup.id)}
                                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 8px', borderRadius: 10, transition: 'background 0.15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,199,89,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <SupplierAvatar domain={bestSup.domain} name={bestSup.name} color={bestSup.color} logoUrl={bestSup.logoUrl} size={24} />
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#34C759' }}>{bestSup.name}</span>
                                                    {savings > 1 ? <span style={{ fontSize: 9, color: '#AEAEB2' }}>חוסך {fmt(savings)}</span> : !hasMultiple && <span style={{ fontSize: 9, color: '#AEAEB2' }}>ספק יחיד</span>}
                                                </div>
                                            ) : <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.10)' }}>—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        {/* Totals footer */}
                        <tfoot>
                            <tr style={{ background: 'rgba(0,0,0,0.018)' }}>
                                <td style={{
                                    padding: '12px 14px', position: 'sticky', right: 0, zIndex: 2,
                                    background: 'rgb(244,244,246)',
                                    borderTop: '2px solid rgba(0,0,0,0.08)',
                                    borderLeft: '1px solid rgba(0,0,0,0.05)',
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#6E6E73', letterSpacing: '0.04em' }}>סה"כ</span>
                                    <div style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>לפי הצעה הזולה לכל מוצר</div>
                                </td>
                                {suppliers.map(s => {
                                    const isBestTotal = s.id === bestTotalId && supTotals[s.id] > 0;
                                    return (
                                        <td key={s.id} style={{ padding: '12px 10px', textAlign: 'center', borderTop: '2px solid rgba(0,0,0,0.08)', borderRight: '1px solid rgba(0,0,0,0.05)' }}>
                                            {supTotals[s.id] > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                    <span style={{ fontSize: 16, fontWeight: 900, color: isBestTotal ? '#34C759' : '#1D1D1F' }}>{fmt(supTotals[s.id])}</span>
                                                    {isBestTotal && <span style={{ fontSize: 9, fontWeight: 800, color: '#34C759', background: 'rgba(52,199,89,0.11)', padding: '1px 5px', borderRadius: 4 }}>הכי זול</span>}
                                                </div>
                                            ) : <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.15)' }}>—</span>}
                                        </td>
                                    );
                                })}
                                <td style={{ borderTop: '2px solid rgba(0,0,0,0.08)' }} />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>}

            {/* ── Cards view ──────────────────────────────────────── */}
            {viewMode === 'cards' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {displayRows.map((row, ri) => {
                        const allE   = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id })));
                        const prices = allE.map(e => e.price).filter(x => x > 0);
                        const minP   = prices.length ? Math.min(...prices) : 0;
                        const maxP   = prices.length ? Math.max(...prices) : 0;
                        return (
                            <div key={ri} style={{ ...G, padding: '14px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    {row.image ? <img src={row.image} alt="" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 9, background: 'rgba(0,0,0,0.03)', padding: 4, border: '1px solid rgba(0,0,0,0.05)' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={16} color="#C7C7CC" /></div>}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.3px' }}>{row.label}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                            {row.model && <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 500 }}>{row.model}</span>}
                                            {row.category && <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.05)', color: '#6E6E73', border: '1px solid rgba(0,0,0,0.07)' }}>{row.category}</span>}
                                        </div>
                                    </div>
                                    {minP > 0 && (
                                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                            <div style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 500, marginBottom: 2 }}>מינ׳</div>
                                            <div style={{ fontSize: 16, fontWeight: 900, color: '#34C759', letterSpacing: '-0.4px' }}>{fmt(minP)}</div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {suppliers.map(s => {
                                        const entries = row.rows[s.id] || [];
                                        if (!entries.length) return null;
                                        const best   = entries.reduce((a, b) => a.price < b.price ? a : b);
                                        const catMin = categoryMinPrice[row.category || ''] ?? Infinity;
                                        const isBest = isFinite(catMin) && best.price <= catMin + 0.01;
                                        const diffPct = minP > 0 && !isBest ? ((best.price - minP) / minP * 100) : 0;
                                        return (
                                            <div key={s.id} onClick={() => openQuote(best.quoteId, best.productKey)}
                                                style={{ flex: '1 1 140px', padding: '10px 13px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: `1px solid ${isBest ? 'rgba(52,199,89,0.22)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', flexDirection: 'column', gap: 5, cursor: 'pointer', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => { e.stopPropagation(); onSelectSupplier?.(s.id); }}>
                                                    <SupplierAvatar domain={s.domain} name={s.name} color={s.color} logoUrl={s.logoUrl} size={20} />
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#1D1D1F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                                                    {isBest && <span style={{ fontSize: 9, fontWeight: 700, color: '#34C759' }}>✓</span>}
                                                </div>
                                                <div style={{ fontSize: 17, fontWeight: 900, color: isBest ? '#34C759' : '#1D1D1F', letterSpacing: '-0.4px' }}>{fmt(best.price)}</div>
                                                {diffPct > 0.5 && <span style={{ fontSize: 9, color: '#8E8E93', fontWeight: 600 }}>+{diffPct.toFixed(0)}%</span>}
                                                <span style={{ fontSize: 9, color: '#C7C7CC', fontWeight: 500 }}>מינ׳ {best.qty} יח׳ · #{best.qNum}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Bar chart view ─────────────────────────────────── */}
            {viewMode === 'bar' && (
                <div style={{ ...G, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {displayRows.map((row, ri) => {
                        const allE   = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id, sup: s })));
                        const prices = allE.map(e => e.price).filter(x => x > 0);
                        if (!prices.length) return null;
                        const maxP = Math.max(...prices);
                        const minP = Math.min(...prices);
                        return (
                            <div key={ri}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', flex: 1 }}>{row.label}</div>
                                    {row.category && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.05)', color: '#6E6E73', border: '1px solid rgba(0,0,0,0.07)' }}>{row.category}</span>}
                                    <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500 }}>פער: {fmt(maxP - minP)}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {suppliers.map(s => {
                                        const entries = row.rows[s.id] || [];
                                        if (!entries.length) return (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}><SupplierAvatar domain={s.domain} name={s.name} color={s.color} logoUrl={s.logoUrl} size={18} /><span style={{ fontSize: 11, color: '#D1D1D6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span></div>
                                                <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', paddingRight: 8 }}><span style={{ fontSize: 10, color: '#D1D1D6' }}>—</span></div>
                                            </div>
                                        );
                                        const best   = entries.reduce((a, b) => a.price < b.price ? a : b);
                                        const catMin = categoryMinPrice[row.category || ''] ?? Infinity;
                                        const isBest = isFinite(catMin) && best.price <= catMin + 0.01;
                                        const pct    = maxP > 0 ? (best.price / maxP) * 100 : 100;
                                        return (
                                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div onClick={() => onSelectSupplier?.(s.id)} style={{ width: 80, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, cursor: 'pointer' }}><SupplierAvatar domain={s.domain} name={s.name} color={s.color} logoUrl={s.logoUrl} size={18} /><span style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textUnderlineOffset: 2 }}>{s.name}</span></div>
                                                <div onClick={() => openQuote(best.quoteId, best.productKey)} style={{ flex: 1, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22,1,0.36,1] }}
                                                        style={{ height: '100%', borderRadius: 7, background: isBest ? '#34C759' : 'rgba(0,0,0,0.15)', opacity: isBest ? 0.8 : 0.55 }} />
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingRight: 10 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 800, color: isBest ? '#fff' : '#3C3C43', letterSpacing: '-0.3px' }}>{fmt(best.price)}</span>
                                                    </div>
                                                </div>
                                                {isBest && <span style={{ fontSize: 9, fontWeight: 700, color: '#34C759', whiteSpace: 'nowrap' }}>זול</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                {ri < displayRows.length - 1 && <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', marginTop: 14 }} />}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Chart view — premium grouped bar chart ───────────── */}
            {viewMode === 'chart' && (() => {
                const COLORS  = ['#007AFF','#FF9500','#34C759','#FF3B30','#5AC8FA','#FF2D55'];
                const LIGHTS  = ['#4FC3F7','#FFD54F','#69F0AE','#FF8A65','#CE93D8','#F48FB1'];
                const supColor = (s, i) => s.color || COLORS[i % 6];
                const supLight = (s, i) => s.color ? s.color + 'BB' : LIGHTS[i % 6];

                const BAR_W   = 28;
                const BAR_GAP = 6;
                const GRP_GAP = 38;
                const CH      = 240;   // chart height
                const TP      = 46;    // top padding (room for price labels + crown)
                const BP      = 78;    // bottom padding (X labels)
                const YW      = 70;    // Y axis width
                const PR      = 24;    // right padding

                const groupW = suppliers.length * BAR_W + Math.max(0, suppliers.length - 1) * BAR_GAP;
                const slotW  = groupW + GRP_GAP;
                const svgW   = Math.max(YW + GRP_GAP / 2 + displayRows.length * slotW + PR, 500);
                const svgH   = TP + CH + BP;
                const yBase  = TP + CH;

                const allPrices = displayRows.flatMap(row =>
                    suppliers.flatMap(s => (row.rows[s.id] || []).map(e => e.price)).filter(p => p > 0)
                );
                if (!allPrices.length) return null;

                const maxP    = Math.max(...allPrices);
                const step    = maxP > 50000 ? 10000 : maxP > 10000 ? 5000 : maxP > 2000 ? 1000 : 500;
                const yMax    = Math.ceil(maxP / step) * step * 1.15;
                const yScale  = p => TP + (1 - p / yMax) * CH;
                const TICKS   = 4;
                const yTicks  = Array.from({ length: TICKS + 1 }, (_, i) => Math.round(yMax * i / TICKS / step) * step);
                const fmtTick = t => t === 0 ? '₪0' : t >= 10000 ? `₪${(t/1000).toFixed(0)}k` : t >= 1000 ? `₪${(t/1000).toFixed(1)}k` : `₪${t}`;

                return (
                    <div style={{
                        background: 'linear-gradient(160deg,rgba(255,255,255,0.97) 0%,rgba(248,249,255,0.97) 100%)',
                        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.80)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.98)',
                        borderRadius: 22, overflow: 'hidden',
                    }}>
                        {/* ── Card header ── */}
                        <div style={{ padding: '20px 22px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.4px' }}>השוואת מחירי ספקים</div>
                                <div style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, marginTop: 3 }}>
                                    {displayRows.length} מוצרים · {suppliers.length} ספקים{savingsData ? ` · חיסכון פוטנציאלי ${fmt(savingsData.savings)}` : ''}
                                </div>
                            </div>
                            {/* Supplier legend pills */}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                                {suppliers.map((s, i) => {
                                    const c = supColor(s, i);
                                    return (
                                        <div key={s.id} onClick={() => onSelectSupplier?.(s.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: `${c}0D`, border: `1.5px solid ${c}28`, cursor: onSelectSupplier ? 'pointer' : 'default', transition: 'all 0.15s', userSelect: 'none' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = `${c}1C`; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 12px ${c}22`; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = `${c}0D`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                                            <div style={{ width: 9, height: 9, borderRadius: 3, background: c, flexShrink: 0 }} />
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F' }}>{s.name}</span>
                                            {winCounts[s.id] > 0 && <span style={{ fontSize: 9, color: c, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 2 }}>· {winCounts[s.id]}<Check size={8} /></span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── SVG chart ── */}
                        <div style={{ overflowX: 'auto', overflowY: 'visible', padding: '8px 0 0' }}>
                            <svg width={svgW} height={svgH} style={{ display: 'block', direction: 'ltr', overflow: 'visible' }}>
                                <defs>
                                    {suppliers.map((s, i) => (
                                        <linearGradient key={`ng${i}`} id={`ng${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={supLight(s, i)} stopOpacity="0.9" />
                                            <stop offset="100%" stopColor={supColor(s, i)} stopOpacity="0.75" />
                                        </linearGradient>
                                    ))}
                                    <linearGradient id="bestGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#69F0AE" stopOpacity="1" />
                                        <stop offset="100%" stopColor="#1DB954" stopOpacity="1" />
                                    </linearGradient>
                                </defs>

                                {/* Chart area background */}
                                <rect x={YW} y={TP} width={svgW - YW - PR} height={CH} rx={10}
                                    fill="rgba(0,0,0,0.015)" />

                                {/* Gridlines + Y labels */}
                                {yTicks.map((tick, i) => {
                                    const y = yScale(tick);
                                    const isBase = i === 0;
                                    return (
                                        <g key={i}>
                                            <line x1={YW} y1={y} x2={svgW - PR} y2={y}
                                                stroke={isBase ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)'}
                                                strokeWidth={isBase ? 1.5 : 1}
                                                strokeDasharray={isBase ? 'none' : '5,7'}
                                            />
                                            <text x={YW - 10} y={y + 4} textAnchor="end"
                                                fontSize={10} fontWeight={600} fill="#AEAEB2"
                                                fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif">
                                                {fmtTick(tick)}
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Y axis vertical line */}
                                <line x1={YW} y1={TP - 4} x2={YW} y2={yBase}
                                    stroke="rgba(0,0,0,0.10)" strokeWidth={1.5} />

                                {/* Product groups */}
                                {displayRows.map((row, gi) => {
                                    const groupX = YW + GRP_GAP / 2 + gi * slotW;
                                    const midX   = groupX + groupW / 2;
                                    const allE   = suppliers.flatMap(s => (row.rows[s.id] || []).map(e => ({ ...e, sid: s.id })));
                                    const prices = allE.map(e => e.price).filter(p => p > 0);
                                    const minP   = prices.length ? Math.min(...prices) : 0;
                                    const lbl    = (row.label || row.model || '').substring(0, 20);

                                    return (
                                        <g key={row.model || row.label || gi}>
                                            {/* Alternating group column */}
                                            {gi % 2 === 0 && (
                                                <rect x={groupX - GRP_GAP * 0.3} y={TP} width={groupW + GRP_GAP * 0.6} height={CH}
                                                    fill="rgba(0,0,0,0.016)" rx={8} />
                                            )}

                                            {/* Bars */}
                                            {suppliers.map((s, si) => {
                                                const entries = row.rows[s.id] || [];
                                                if (!entries.length) return null;
                                                const best    = entries.reduce((a, b) => a.price < b.price ? a : b);
                                                const catMin  = categoryMinPrice[row.category || ''] ?? Infinity;
                                                const isBest  = isFinite(catMin) && best.price <= catMin + 0.01;
                                                const multi   = allPrices.length >= 2;
                                                const barH    = Math.max(6, (best.price / yMax) * CH);
                                                const barX    = groupX + si * (BAR_W + BAR_GAP);
                                                const barY    = yBase - barH;
                                                const c       = supColor(s, si);
                                                const barFill = `url(#ng${si})`;
                                                const labelC  = isBest ? '#34C759' : `${c}AA`;
                                                const priceLabel = best.price >= 10000
                                                    ? `${(best.price/1000).toFixed(0)}k`
                                                    : best.price >= 1000
                                                        ? `${(best.price/1000).toFixed(1)}k`
                                                        : `${Math.round(best.price)}`;

                                                return (
                                                    <g key={s.id} style={{ cursor: 'pointer' }} onClick={() => openQuote(best.quoteId, best.productKey)}>
                                                        {/* Main bar */}
                                                        <rect x={barX} y={barY} width={BAR_W} height={barH} rx={7} ry={7}
                                                            fill={barFill}
                                                            stroke="none"
                                                            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08) saturate(1.12)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                                                        />
                                                        {/* Inner shine stripe */}
                                                        {barH > 14 && (
                                                            <rect x={barX + 5} y={barY + 5} width={BAR_W - 10} height={Math.min(12, barH - 10)} rx={4}
                                                                fill="rgba(255,255,255,0.28)" style={{ pointerEvents: 'none' }} />
                                                        )}
                                                        {/* Crown for cheapest */}
                                                        {isBest && (
                                                            <text x={barX + BAR_W / 2} y={barY - 8}
                                                                textAnchor="middle" fontSize={12} fontWeight="900"
                                                                fill="#FF9500"
                                                                fontFamily="-apple-system,sans-serif"
                                                                style={{ pointerEvents: 'none' }}>★</text>
                                                        )}
                                                        {/* Price label above bar */}
                                                        <text
                                                            x={barX + BAR_W / 2}
                                                            y={barY - (isBest ? 26 : 7)}
                                                            textAnchor="middle"
                                                            fontSize={isBest ? 11 : 10}
                                                            fontWeight={isBest ? 800 : 600}
                                                            fill={labelC}
                                                            fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif"
                                                            style={{ pointerEvents: 'none' }}>
                                                            {priceLabel}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* X label (rotated) */}
                                            <text x={midX} y={yBase + 12} textAnchor="end"
                                                fontSize={10} fontWeight={600} fill="#3C3C43"
                                                fontFamily="-apple-system,'Helvetica Neue',Arial,sans-serif"
                                                transform={`rotate(-40 ${midX} ${yBase + 12})`}>
                                                {lbl}
                                            </text>
                                            {row.category && (
                                                <text x={midX} y={yBase + 24} textAnchor="end"
                                                    fontSize={8.5} fontWeight={500} fill="#AEAEB2"
                                                    fontFamily="-apple-system,sans-serif"
                                                    transform={`rotate(-40 ${midX} ${yBase + 24})`}>
                                                    {row.category}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* ── Footer ── */}
                        <div style={{ padding: '6px 22px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: '#C7C7CC', fontWeight: 500, letterSpacing: '-0.1px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Crown size={9} /> הכי זול בהשוואה מרובת ספקים &nbsp;·&nbsp; לחיצה על עמודה פותחת את ההצעה
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* ── Price history sparklines ─────────────────────────── */}
            {(() => {
                const histMap = {};
                quotes.forEach(q => {
                    const ts = q.createdAt?.seconds ? q.createdAt.seconds * 1000 : null;
                    if (!ts) return;
                    (q.products || []).forEach(p => {
                        const key = (p.modelNumber || p.name || '').trim();
                        if (!key) return;
                        const price = (Number(p.pricePerUnit) || 0) * (1 - (Number(p.discount) || 0) / 100);
                        if (!price) return;
                        if (!histMap[key]) histMap[key] = { label: p.name || key, points: [] };
                        histMap[key].points.push({ ts, price, supplier: suppliers.find(s => s.id === q.supplierId)?.name || '?', qNum: q.quoteNumber || q.id?.slice(-6) });
                    });
                });
                const hRows = Object.values(histMap).filter(r => r.points.length >= 2).map(r => ({ ...r, points: [...r.points].sort((a, b) => a.ts - b.ts) }));
                if (hRows.length === 0) return null;
                const W = 300, H = 72, PAD = 10;
                return (
                    <div style={{ ...G, padding: '18px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <TrendingUp size={14} color="#5AC8FA" />
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>היסטוריית מחירים</span>
                            <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>· מוצרים עם מספר הצעות</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
                            {hRows.map((row, ri) => {
                                const pts = row.points.map(p => p.price);
                                const minP = Math.min(...pts), maxP = Math.max(...pts);
                                const range = maxP - minP || 1;
                                const xs = row.points.map((_, i) => PAD + (i / Math.max(row.points.length - 1, 1)) * (W - PAD * 2));
                                const ys = row.points.map(p => PAD + (1 - (p.price - minP) / range) * (H - PAD * 2));
                                const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
                                const trend = pts[pts.length - 1] - pts[0];
                                const tColor = trend < 0 ? '#34C759' : trend > 0 ? '#FF3B30' : '#8E8E93';
                                return (
                                    <div key={ri} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(90,200,250,0.03)', border: '1px solid rgba(90,200,250,0.10)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.label}</div>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: tColor, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span style={{ width: 18, height: 18, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${tColor}2b, ${tColor}12)`, border: `1px solid ${tColor}26`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px ${tColor}22` }}>
                                                    {trend < 0 ? <TrendingDown size={11} /> : trend > 0 ? <TrendingUp size={11} /> : <Minus size={11} />}
                                                </span>
                                                {trend !== 0 ? fmt(Math.abs(trend)) : 'יציב'}
                                            </span>
                                        </div>
                                        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
                                            <defs>
                                                <linearGradient id={`cgrad${ri}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#5AC8FA" stopOpacity="0.16" />
                                                    <stop offset="100%" stopColor="#5AC8FA" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <polygon points={`${xs[0]},${H} ${polyline} ${xs[xs.length-1]},${H}`} fill={`url(#cgrad${ri})`} />
                                            <polyline points={polyline} fill="none" stroke="#5AC8FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            {row.points.map((pt, i) => (
                                                <g key={i}>
                                                    <circle cx={xs[i]} cy={ys[i]} r="4" fill="#fff" stroke="#5AC8FA" strokeWidth="2" />
                                                    <text x={xs[i]} y={ys[i] - 8} textAnchor="middle" fontSize="9" fill="#5AC8FA" fontWeight="700">{fmt(pt.price)}</text>
                                                    <text x={xs[i]} y={H + 13} textAnchor="middle" fontSize="8" fill="#AEAEB2">{pt.supplier}</text>
                                                </g>
                                            ))}
                                        </svg>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}

// ─── ContactCard ───────────────────────────────────────────────────────────────
const ACCENT_PALETTE = ['#007AFF','#5AC8FA','#FF9500','#FF2D55','#34C759','#00C7BE','#0A84FF'];
function accentFor(name) {
    let h = 0; for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return ACCENT_PALETTE[Math.abs(h) % ACCENT_PALETTE.length];
}

function ContactCard({ contact: c, onSelectSupplier }) {
    const accent   = accentFor(c.name);
    const wa       = c.agentPhone ? `https://wa.me/${c.agentPhone.replace(/\D/g,'').replace(/^0/,'972')}` : null;
    const domain   = (c.domain || '').replace(/https?:\/\//,'').replace(/\/$/,'');
    const closedRate = c.sQ.length ? Math.round((c.closed / c.sQ.length) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -5, boxShadow: `0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px ${accent}22` }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
                borderRadius: 24, overflow: 'hidden',
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(44px) saturate(200%)',
                border: '1px solid rgba(255,255,255,0.80)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.3s, transform 0.3s',
            }}>

            {/* Accent strip */}
            <div style={{ height: 4, background: `linear-gradient(90deg,${accent},${accent}77)`, flexShrink: 0 }} />

            {/* Hero — centered */}
            <div style={{ padding: '22px 20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: `linear-gradient(160deg,${accent}0A 0%,transparent 60%)` }}>
                <div style={{ position: 'relative' }}>
                    <SupplierAvatar domain={c.domain} name={c.name} color={c.color} logoUrl={c.logoUrl} size={64} />
                    {c.sQ.length > 0 && (
                        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: 7, background: accent, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: '#fff' }}>{c.sQ.length}</span>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.3px', lineHeight: 1.2 }}>{c.name}</div>
                </div>

                {/* Agent pill */}
                {(c.agentName || c.agentTitle) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg,${accent}20,${accent}0D)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={15} color={accent} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {c.agentName  && <div style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.agentName}</div>}
                            {c.agentTitle && <div style={{ fontSize: 10, color: '#6E6E73', fontWeight: 600, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.agentTitle}</div>}
                        </div>
                    </div>
                )}
            </div>

            {/* Contact actions */}
            <div style={{ padding: '2px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {c.agentPhone && (
                    <div style={{ display: 'flex', gap: 7 }}>
                        <a href={`tel:${c.agentPhone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 13, background: `${accent}0C`, color: accent, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: `1px solid ${accent}1E`, direction: 'ltr', overflow: 'hidden' }}>
                            <Phone size={13} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.agentPhone}</span>
                        </a>
                        {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 13, background: 'rgba(37,211,102,0.10)', color: '#25D366', textDecoration: 'none', border: '1px solid rgba(37,211,102,0.22)' }}>
                                <MessageCircle size={16} />
                            </a>
                        )}
                    </div>
                )}
                {c.agentEmail && (
                    <a href={`mailto:${c.agentEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 13, background: 'rgba(255,45,85,0.06)', color: '#FF2D55', textDecoration: 'none', fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,45,85,0.14)', overflow: 'hidden' }}>
                        <Mail size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>{c.agentEmail}</span>
                    </a>
                )}
                {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 13, background: 'rgba(90,200,250,0.06)', color: '#5AC8FA', textDecoration: 'none', fontSize: 12, fontWeight: 700, border: '1px solid rgba(90,200,250,0.14)', overflow: 'hidden' }}>
                        <Globe size={13} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr' }}>{domain || c.website}</span>
                    </a>
                )}
                {!c.agentPhone && !c.agentEmail && !c.website && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#C7C7CC', fontSize: 13 }}>אין פרטי קשר</div>
                )}
            </div>

            {/* Stats + CTA footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.012)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    {c.total > 0 && (
                        <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{fmt(c.total)}</span>
                    )}
                    {c.closed > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#34C759', fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(52,199,89,0.09)' }}>
                            <Check size={9} />{c.closed} נסגרו
                        </span>
                    )}
                    {c.lastQ && <span style={{ fontSize: 9, color: '#C7C7CC', fontWeight: 600 }}>{fmtD(c.lastQ.createdAt)}</span>}
                </div>
                <motion.button onClick={() => onSelectSupplier(c.id)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 11, border: 'none', background: `${accent}12`, color: accent, fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    הצעות <ChevronRight size={11} />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── ContactsTab ────────────────────────────────────────────────────────────────
function ContactsTab({ suppliers, quotes, onSelectSupplier }) {
    const [search, setSearch] = useState('');

    const contacts = useMemo(() =>
        suppliers.map(s => {
            const sQ     = quotes.filter(q => q.supplierId === s.id);
            const total  = sQ.reduce((sum, q) => sum + calcTotal(q.products || []), 0);
            const closed = sQ.filter(q => q.status === 'agreed' || q.status === 'ordered').length;
            return { ...s, sQ, total, closed, lastQ: sQ[0] };
        })
    , [suppliers, quotes]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return contacts;
        return contacts.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.agentName || '').toLowerCase().includes(q) ||
            (c.agentEmail || '').toLowerCase().includes(q) ||
            (c.agentPhone || '').includes(q)
        );
    }, [contacts, search]);

    const totalValue  = contacts.reduce((s, c) => s + c.total, 0);
    const withContact = contacts.filter(c => c.agentName || c.agentPhone || c.agentEmail).length;

    if (contacts.length === 0) return <Empty icon={<User size={34} />} text="אין אנשי קשר" sub="הוסף ספקים עם פרטי איש קשר" />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header KPIs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.5px' }}>אנשי קשר</div>
                    <div style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 600, marginTop: 2 }}>כל נציגי הספקים במקום אחד</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.66))', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(20,40,80,0.06), inset 0 1px 0 rgba(255,255,255,1)', textAlign: 'center', minWidth: 66 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', background: `linear-gradient(135deg, ${GOLD}, ${GOLD}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{contacts.length}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#AEAEB2' }}>ספקים</div>
                    </div>
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.66))', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(20,40,80,0.06), inset 0 1px 0 rgba(255,255,255,1)', textAlign: 'center', minWidth: 66 }}>
                        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px', background: `linear-gradient(135deg, ${GOLD}, ${GOLD}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{withContact}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: '#AEAEB2' }}>עם קשר</div>
                    </div>
                    {totalValue > 0 && (
                        <div style={{ padding: '10px 16px', borderRadius: 12, background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.66))', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(20,40,80,0.06), inset 0 1px 0 rgba(255,255,255,1)', textAlign: 'center', minWidth: 80 }}>
                            <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1.4, letterSpacing: '-0.4px', background: 'linear-gradient(135deg, #34C759, #34C759c4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{fmt(totalValue)}</div>
                            <div style={{ fontSize: 10, fontWeight: 500, color: '#AEAEB2' }}>סה"כ ערך</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', pointerEvents: 'none' }} />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="חפש לפי שם, נציג, מייל, טלפון..."
                    style={{ ...inputCss, paddingRight: 38, borderRadius: 13, padding: '11px 38px 11px 14px', fontSize: 13 }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#AEAEB2', padding: 2, display: 'flex' }}>
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                <AnimatePresence>
                    {filtered.map(c => <ContactCard key={c.id} contact={c} onSelectSupplier={onSelectSupplier} />)}
                </AnimatePresence>
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#AEAEB2', fontSize: 14 }}>אין תוצאות לחיפוש "{search}"</div>
            )}
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
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onClose()}
            style={{ position: 'fixed', inset: 0, zIndex: 58, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}
        >
            <motion.div
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.93, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93, y: 18 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ zIndex: 59, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, background: 'rgba(252,252,255,0.98)', backdropFilter: 'blur(40px) saturate(180%)', boxShadow: '0 28px 90px rgba(0,0,0,0.22)', padding: '24px 24px 28px', direction: 'rtl' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                    <span style={{ flex: 1, fontSize: 17, fontWeight: 900, color: '#1D1D1F' }}>{title}</span>
                    {extra}
                    <button onClick={() => onClose()} style={{ padding: 8, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', color: '#AEAEB2', display: 'flex' }}><X size={15} /></button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );
}

function MF({ label, value, onChange, placeholder }) {
    const [focused, setFocused] = React.useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73', letterSpacing: 0.2 }}>{label}</label>
            <input
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || ''}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    padding: '10px 13px', borderRadius: 11,
                    border: focused ? '1.5px solid #007AFF' : '1.5px solid rgba(0,0,0,0.09)',
                    background: focused ? 'rgba(0,122,255,0.03)' : 'rgba(255,255,255,0.8)',
                    fontSize: 13, color: '#1D1D1F', outline: 'none',
                    textAlign: 'right', direction: 'rtl', width: '100%',
                    boxSizing: 'border-box', transition: 'border 0.15s, box-shadow 0.15s',
                    boxShadow: focused ? '0 0 0 3px rgba(0,122,255,0.09)' : '0 1px 2px rgba(0,0,0,0.04)',
                }}
            />
        </div>
    );
}

// ─── AddSupplierModal ──────────────────────────────────────────────────────────
function AddSupplierModal({ onClose, onAdded }) {
    const { showToast } = useAdminToast();
    const [form, setForm] = useState({ name: '', domain: '', logoUrl: '', agentName: '', agentTitle: '', agentPhone: '', agentEmail: '', website: '', color: '' });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const f = k => v => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.name.trim()) { setErr('שם החברה הוא שדה חובה'); return; }
        setErr('');
        setSaving(true);
        try {
            const ref = await addDoc(collection(db, 'suppliers'), { ...form, createdAt: serverTimestamp() });
            showToast(`ספק "${form.name}" נוסף בהצלחה`, 'success');
            onAdded({ id: ref.id, ...form });
            onClose();
        } catch (e) {
            console.error(e);
            setErr('שמירה נכשלה — בדוק חיבור לאינטרנט ונסה שוב');
            showToast('שגיאה בשמירת הספק', 'error');
        }
        setSaving(false);
    };

    const ready = form.name.trim();

    return (
        <Modal title="הוסף ספק חדש" onClose={onClose}>
            {/* Company details */}
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: 0.8, marginBottom: 11 }}>פרטי החברה</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <MF label="שם החברה *"              value={form.name}    onChange={f('name')}    placeholder="טכנו רצף" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <MF label="דומיין (לוגו אוטומטי)" value={form.domain}   onChange={f('domain')}   placeholder="techno-retzef.co.il" />
                        <MF label="אתר"                    value={form.website}  onChange={f('website')}  placeholder="https://..." />
                    </div>
                    <MF label="קישור לוגו (אופציונלי)" value={form.logoUrl} onChange={f('logoUrl')} placeholder="https://company.com/logo.png" />
                </div>
            </div>

            {/* Logo preview — only when domain is typed */}
            {(form.domain || form.logoUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', marginBottom: 18 }}>
                    <SupplierAvatar domain={form.domain} name={form.name} color={form.color} logoUrl={form.logoUrl} size={38} />
                    <span style={{ fontSize: 12, color: '#6E6E73' }}>תצוגה מקדימה של הלוגו</span>
                </div>
            )}

            {/* Color picker */}
            <div style={{ marginBottom: 20 }}>
                <ColorPicker value={form.color} onChange={f('color')} />
            </div>

            {/* Contact details */}
            <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: 0.8, marginBottom: 11 }}>איש קשר</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <MF label="שם מלא"  value={form.agentName}  onChange={f('agentName')}  placeholder="ישראל ישראלי" />
                    <MF label="תפקיד"   value={form.agentTitle} onChange={f('agentTitle')} placeholder="מנהל מכירות" />
                    <MF label="טלפון"   value={form.agentPhone} onChange={f('agentPhone')} placeholder="050-0000000" />
                    <MF label="אימייל"  value={form.agentEmail} onChange={f('agentEmail')} placeholder="agent@company.com" />
                </div>
            </div>

            {err && (
                <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', color: '#FF3B30', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>
                    {err}
                </div>
            )}

            <motion.button
                onClick={save}
                disabled={saving}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                style={{
                    width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#007AFF,#5AC8FA)',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(0,122,255,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s ease',
                }}>
                {saving ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />מוסיף...</>
                ) : (
                    <><Plus size={15} />הוסף ספק</>
                )}
            </motion.button>
        </Modal>
    );
}

// ─── EditSupplierModal ─────────────────────────────────────────────────────────
function EditSupplierModal({ supplier, onClose }) {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const [form, setForm] = useState({ name: supplier.name || '', domain: supplier.domain || '', logoUrl: supplier.logoUrl || '', agentName: supplier.agentName || '', agentTitle: supplier.agentTitle || '', agentPhone: supplier.agentPhone || '', agentEmail: supplier.agentEmail || '', website: supplier.website || '', color: supplier.color || '' });
    const [saving,   setSaving]   = useState(false);
    const [deleting, setDeleting] = useState(false);
    const f = k => v => setForm(p => ({ ...p, [k]: v }));

    const save = async () => {
        if (!form.name.trim()) { showToast('שם החברה הוא שדה חובה', 'error'); return; }
        setSaving(true);
        try {
            await updateDoc(doc(db, 'suppliers', supplier.id), form);
            showToast('הספק עודכן בהצלחה', 'success');
            onClose(true);
        } catch (e) {
            console.error(e);
            showToast('שגיאה בשמירה — נסה שוב', 'error');
        }
        setSaving(false);
    };
    const del = async () => {
        if (!await confirm({ message: `למחוק את הספק "${supplier.name}"?`, danger: true })) return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, 'suppliers', supplier.id));
            showToast(`ספק "${supplier.name}" נמחק`, 'success');
            onClose(true);
        } catch (e) {
            console.error(e);
            showToast('שגיאה במחיקה — נסה שוב', 'error');
        }
        setDeleting(false);
    };

    return (
        <Modal title="עריכת ספק" onClose={onClose}
            extra={<button onClick={del} disabled={deleting} style={{ padding: '7px 12px', borderRadius: 9, border: 'none', background: 'rgba(255,59,48,0.10)', color: '#FF3B30', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting ? '...' : 'מחק ספק'}</button>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}><MF label="שם החברה" value={form.name}       onChange={f('name')}       /></div>
                <MF label="דומיין"    value={form.domain}      onChange={f('domain')}     placeholder="company.co.il" />
                <MF label="אתר"       value={form.website}     onChange={f('website')}    placeholder="https://..." />
                <div style={{ gridColumn: '1 / -1' }}><MF label="קישור לוגו (אופציונלי)" value={form.logoUrl} onChange={f('logoUrl')} placeholder="https://company.com/logo.png" /></div>
                <MF label="שם הסוכן" value={form.agentName}   onChange={f('agentName')}  />
                <MF label="תפקיד"    value={form.agentTitle}  onChange={f('agentTitle')} />
                <MF label="טלפון"    value={form.agentPhone}  onChange={f('agentPhone')} />
                <MF label="אימייל"   value={form.agentEmail}  onChange={f('agentEmail')} />
            </div>
            {(form.domain || form.logoUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.03)' }}>
                    <SupplierAvatar domain={form.domain} name={form.name} color={form.color} logoUrl={form.logoUrl} size={40} />
                    <span style={{ fontSize: 12, color: '#6E6E73' }}>תצוגה מקדימה של הלוגו</span>
                </div>
            )}
            <div style={{ marginBottom: 20 }}>
                <ColorPicker value={form.color} onChange={f('color')} />
            </div>
            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,122,255,0.28)' }}>
                {saving ? 'שומר...' : 'שמור שינויים'}
            </motion.button>
        </Modal>
    );
}

// ─── AddQuoteModal ─────────────────────────────────────────────────────────────
function AddQuoteModal({ supplier, onClose, onCreated }) {
    const { showToast } = useAdminToast();
    const [saving, setSaving] = useState(false);
    const save = async () => {
        setSaving(true);
        try {
            const ref = await addDoc(collection(db, 'supplier_quotes'), {
                supplierId: supplier.id, quoteNumber: '', status: 'received',
                products: [], deliveryMethod: '', stockType: '', leadTimeDays: '',
                paymentTerms: '', warrantyMonths: '', moq: '', validUntil: '',
                notes: [], docs: [], createdAt: serverTimestamp(),
            });
            showToast('הצעה חדשה נוצרה', 'success');
            onCreated?.(ref.id);
            onClose();
        } catch (e) {
            console.error(e);
            showToast('שגיאה ביצירת הצעה — נסה שוב', 'error');
        }
        setSaving(false);
    };
    return (
        <Modal title={`הצעה חדשה מ-${supplier.name}`} onClose={onClose}>
            <p style={{ fontSize: 13, color: '#6E6E73', marginBottom: 20, lineHeight: 1.6, textAlign: 'right' }}>
                תיווצר הצעה ריקה — לאחר מכן תוכל להוסיף מוצרים, מחירים ופרטי עסקה.
            </p>
            <motion.button onClick={save} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 22px rgba(0,122,255,0.28)' }}>
                {saving ? 'יוצר...' : 'צור הצעה'}
            </motion.button>
        </Modal>
    );
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
function exportQuotesXLSX(suppliers, quotes) {
    Promise.all([import('xlsx-js-style'), fetchUsdToIls()]).then(([mod, fxRate]) => {
        const XS = mod.default || mod;

        // Resolve correct ILS unit price for a product (handles USD products)
        const getILSPrice = p => {
            let price = Number(p.pricePerUnit) || 0;
            if (!price && p.currency === 'USD' && p.priceInUsd && fxRate) {
                price = Math.round(parseFloat(p.priceInUsd) * fxRate * 100) / 100;
            }
            return price;
        };
        // Tier-aware price: pick the best applicable tier given quantity
        const getTierAwarePrice = p => {
            const base = getILSPrice(p);
            const tiers = p.tiers || [];
            if (!tiers.length) return base;
            const qty = Number(p.quantity) || 1;
            const applicable = [...tiers].filter(t => Number(t.minQty) <= qty).sort((a, b) => Number(b.minQty) - Number(a.minQty));
            return applicable.length > 0 ? (Number(applicable[0].pricePerUnit) || base) : base;
        };
        // Format tiers for display in Excel
        const formatTiers = p => {
            const tiers = p.tiers || [];
            if (!tiers.length) return '—';
            return tiers.sort((a, b) => Number(a.minQty) - Number(b.minQty))
                .map(t => `מ-${t.minQty} יח׳: ₪${Number(t.pricePerUnit).toFixed(2)}`)
                .join('  |  ');
        };
        // Unit price after discount (what you actually pay per unit, in ILS), tier-aware
        const unitNet = p => getTierAwarePrice(p) * (1 - (Number(p.discount) || 0) / 100);
        // Line total (unit price × qty × discount)
        const lineTotal = p => unitNet(p) * (Number(p.quantity) || 1);
        // Quote total
        const quoteTotal = prods => (prods || []).reduce((s, p) => s + lineTotal(p), 0);

        // ── Design tokens ─────────────────────────────────────────────────────
        const C = {
            // Primary
            navy:       '1E3A5F',   // title rows bg
            blue:       '2563EB',   // section headers bg
            accentBg:   'DBEAFE',   // column header bg
            accentFg:   '1E3A5F',   // column header text
            // Status
            greenTxt:   '065F46', greenBg:  'D1FAE5',
            redTxt:     '991B1B', redBg:    'FEE2E2',
            amberTxt:   '92400E', amberBg:  'FEF3C7',
            // Data rows
            rowA:       'FFFFFF', rowB: 'F8FAFC',
            // Totals
            totBg:      '1E3A5F', totFg: 'FFFFFF',
            // Dividers
            divBg:      'F1F5F9',
            // Typography
            dark:       '1E293B', mid: '64748B', light: 'CBD5E1',
            // Supplier accent (per-supplier tint, fallback)
            supBg:      'EFF6FF', supFg: '1E3A5F',
        };

        const THIN_BORDER = (rgb = 'E2E8F0') => ({ style: 'thin', color: { rgb } });
        const CELL_BORDER = {
            bottom: THIN_BORDER(),
            top:    THIN_BORDER(),
            left:   THIN_BORDER(),
            right:  THIN_BORDER(),
        };

        const STAGE_LABEL = {};
        const STAGE_COLOR = {};
        NEG_STAGES.forEach(s => { STAGE_LABEL[s.id] = s.label; STAGE_COLOR[s.id] = s.color.replace('#',''); });

        const DEL_LABEL   = {};
        DELIVERY_OPTS.forEach(o => { DEL_LABEL[o.id] = o.label; });

        const STOCK_LABEL = {};
        STOCK_OPTS.forEach(o => { STOCK_LABEL[o.id] = o.label; });

        const now = new Date();
        const todayStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

        const fmtDate = ts => {
            if (!ts) return '';
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            if (isNaN(d)) return '';
            return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        };

        const fmtNum = n => Number(n).toLocaleString('he-IL', { maximumFractionDigits: 2 });

        // Strip '#' from hex colors coming from catColor()
        const hex = c => (c || '').replace('#', '');

        // ── Cell constructors ─────────────────────────────────────────────────
        const sc = (v, s = {}) => ({
            v: v ?? '',
            t: typeof v === 'number' ? 'n' : 's',
            s: { font: { name: 'Calibri', sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: CELL_BORDER, ...s },
        });
        const nc = (v, s = {}) => ({
            v: Number(v) || 0,
            t: 'n',
            s: { font: { name: 'Calibri', sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: CELL_BORDER, ...s },
        });
        const lc = (v, url, s = {}) => ({
            v: v ?? '',
            t: 's',
            l: { Target: url },
            s: { font: { name: 'Calibri', sz: 10 }, alignment: { horizontal: 'right', vertical: 'center' }, border: CELL_BORDER, ...s },
        });

        // ── Style factories ───────────────────────────────────────────────────

        // Title bar cell (navy bg, white, 13pt bold, right-aligned)
        const titleSt = (extra = {}) => ({
            font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: C.navy }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { bottom: THIN_BORDER('2563EB') },
            ...extra,
        });

        // Section header (blue bg, white, 11pt bold)
        const secHdrSt = (extra = {}) => ({
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: C.blue }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { bottom: THIN_BORDER() },
            ...extra,
        });

        // Column header (accent blue bg, navy text, 10pt bold)
        const colHdrSt = (extra = {}) => ({
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: C.accentFg } },
            fill: { fgColor: { rgb: C.accentBg }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center', wrapText: false },
            border: { bottom: THIN_BORDER('93C5FD'), top: THIN_BORDER('93C5FD'), left: THIN_BORDER('93C5FD'), right: THIN_BORDER('93C5FD') },
            ...extra,
        });

        // Data row cell (alternating, right-aligned)
        const dataSt = (even, extra = {}) => ({
            font: { name: 'Calibri', sz: 10 },
            fill: { fgColor: { rgb: even ? C.rowA : C.rowB }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: CELL_BORDER,
            ...extra,
        });

        // Numeric data cell (center-aligned)
        const numSt = (even, extra = {}) => ({
            ...dataSt(even),
            alignment: { horizontal: 'center', vertical: 'center' },
            ...extra,
        });

        // Grand / sub total row
        const totSt = (extra = {}) => ({
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: C.totFg } },
            fill: { fgColor: { rgb: C.totBg }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { top: THIN_BORDER('93C5FD'), bottom: THIN_BORDER('93C5FD'), left: THIN_BORDER(), right: THIN_BORDER() },
            ...extra,
        });

        // Full-width section divider (light gray bg)
        const divSt = (extra = {}) => ({
            font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: C.dark } },
            fill: { fgColor: { rgb: C.divBg }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { bottom: THIN_BORDER('CBD5E1') },
            ...extra,
        });

        // Supplier name divider (uses supplier color tint)
        const supDivSt = (supColorHex, extra = {}) => ({
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: supColorHex || C.navy } },
            fill: { fgColor: { rgb: 'EFF6FF' }, patternType: 'solid' },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: { bottom: THIN_BORDER('BFDBFE'), top: THIN_BORDER('BFDBFE'), left: THIN_BORDER('BFDBFE'), right: THIN_BORDER('BFDBFE') },
            ...extra,
        });

        // KPI chip style
        const kpiSt = (bgRgb, fgRgb, extra = {}) => ({
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: fgRgb } },
            fill: { fgColor: { rgb: bgRgb }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { top: THIN_BORDER(), bottom: THIN_BORDER(), left: THIN_BORDER(), right: THIN_BORDER() },
            ...extra,
        });

        // Green (cheapest) highlight
        const greenSt = (even, extra = {}) => ({
            ...numSt(even),
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: C.greenTxt } },
            fill: { fgColor: { rgb: C.greenBg }, patternType: 'solid' },
            ...extra,
        });

        // Red (most expensive) highlight
        const redSt = (even, extra = {}) => ({
            ...numSt(even),
            font: { name: 'Calibri', sz: 10, color: { rgb: C.redTxt } },
            fill: { fgColor: { rgb: C.redBg }, patternType: 'solid' },
            ...extra,
        });

        // ── Worksheet helpers ─────────────────────────────────────────────────

        // Set a single cell and keep !ref updated
        const setCell = (ws, r, c, cellObj) => {
            const addr = XS.utils.encode_cell({ r, c });
            ws[addr] = cellObj;
            const ref = ws['!ref'];
            const rng = ref ? XS.utils.decode_range(ref) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
            rng.e.r = Math.max(rng.e.r, r);
            rng.e.c = Math.max(rng.e.c, c);
            ws['!ref'] = XS.utils.encode_range(rng);
        };

        const putRow = (ws, ri, cells, ncols) => {
            cells.forEach((cell, ci) => { if (cell != null) setCell(ws, ri, ci, cell); });
            // Ensure ref covers full width even for sparse rows
            if (ncols) setCell(ws, ri, ncols - 1, ws[XS.utils.encode_cell({ r: ri, c: ncols - 1 })] || sc(''));
        };

        const makeWS = widths => ({
            '!ref': 'A1:A1',
            '!cols': widths.map(w => ({ wch: w })),
            '!rows': [],
            '!merges': [],
        });

        const setRowHeight = (ws, ri, hpt) => {
            while (ws['!rows'].length <= ri) ws['!rows'].push({});
            ws['!rows'][ri] = { hpt };
        };

        const merge = (ws, r1, c1, r2, c2) => {
            ws['!merges'].push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        };

        // Fill a merged range with copies of the same cell object
        const fillMerge = (ws, r1, c1, r2, c2, cellObj) => {
            setCell(ws, r1, c1, cellObj);
            merge(ws, r1, c1, r2, c2);
            // Fill remaining cells in merge with blank so xlsx-js-style renders correctly
            for (let r = r1; r <= r2; r++) {
                for (let c = c1; c <= c2; c++) {
                    if (r === r1 && c === c1) continue;
                    setCell(ws, r, c, sc(''));
                }
            }
        };

        const emptyRow = (ws, ri, ncols, bgRgb = C.rowA) => {
            const blankSt = { font: { name: 'Calibri', sz: 6 }, fill: { fgColor: { rgb: bgRgb }, patternType: 'solid' }, alignment: {}, border: {} };
            for (let c = 0; c < ncols; c++) setCell(ws, ri, c, { v: '', t: 's', s: blankSt });
        };

        // ── Pre-compute grand totals ───────────────────────────────────────────
        const grandTotal = quotes.reduce((s, q) => s + quoteTotal(q.products), 0);
        const totalProducts = quotes.reduce((s, q) => s + (q.products || []).length, 0);
        const sortedSuppliers = [...suppliers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 1 — "📋 סקירה" Dashboard
        // ════════════════════════════════════════════════════════════════════════
        // Columns: ספק | מס׳ הצעה | שלב | מוצרים | ערך ₪ | שיטת הספקה | MOQ | תנאי תשלום | תוקף עד | תאריך
        //          22    14          14    10        14      15            8     16            12        13
        const WS1_COLS = [22, 14, 14, 10, 14, 15, 8, 16, 12, 13];
        const WS1_NC   = WS1_COLS.length;
        const ws1      = makeWS(WS1_COLS);
        const HDRS1    = ['ספק','מס׳ הצעה','שלב','מוצרים','ערך ₪','שיטת הספקה','MOQ','תנאי תשלום','תוקף עד','תאריך'];

        // Row 0: Title (merged full width, navy)
        fillMerge(ws1, 0, 0, 0, WS1_NC - 1, {
            v: `הצעות מחיר מספקים — NextClass    |    ${todayStr}`,
            t: 's',
            s: titleSt(),
        });
        setRowHeight(ws1, 0, 36);

        // Row 1: Spacer (navy bg)
        emptyRow(ws1, 1, WS1_NC, C.navy);
        setRowHeight(ws1, 1, 8);

        // Row 2: KPI chips (4 KPIs × 2-3 cols each across 10 cols)
        // Layout: cols 0-2 | 3-5 | 6-7 | 8-9
        const KPIs = [
            { label: `${suppliers.length} ספקים`,   bg: '1E3A5F', fg: 'FFFFFF', c1: 0, c2: 2 },
            { label: `${quotes.length} הצעות`,       bg: '2563EB', fg: 'FFFFFF', c1: 3, c2: 5 },
            { label: `₪${fmtNum(grandTotal)} ערך כולל`, bg: '065F46', fg: 'FFFFFF', c1: 6, c2: 7 },
            { label: `${totalProducts} מוצרים`,     bg: '0A84FF', fg: 'FFFFFF', c1: 8, c2: 9 },
        ];
        KPIs.forEach(kpi => {
            fillMerge(ws1, 2, kpi.c1, 2, kpi.c2, { v: kpi.label, t: 's', s: kpiSt(kpi.bg, kpi.fg) });
        });
        setRowHeight(ws1, 2, 28);

        // Row 3: spacer
        emptyRow(ws1, 3, WS1_NC, C.divBg);
        setRowHeight(ws1, 3, 8);

        // Row 4: Column headers
        HDRS1.forEach((h, ci) => setCell(ws1, 4, ci, { v: h, t: 's', s: colHdrSt() }));
        setRowHeight(ws1, 4, 22);

        // Rows 5+: Quote rows grouped by supplier
        let r1 = 5;

        sortedSuppliers.forEach(sup => {
            const supQuotes = quotes.filter(q => q.supplierId === sup.id);
            if (!supQuotes.length) return;

            const supTotal = supQuotes.reduce((s, q) => s + quoteTotal(q.products), 0);
            const supColor = hex(sup.color) || C.navy;

            // Supplier divider row (full-width, tinted)
            const supDivLabel = `${sup.name}   —   ${supQuotes.length} הצעות   |   ₪${fmtNum(supTotal)}`;
            fillMerge(ws1, r1, 0, r1, WS1_NC - 1, { v: supDivLabel, t: 's', s: supDivSt(supColor) });
            setRowHeight(ws1, r1, 18);
            r1++;

            supQuotes.forEach((q, qi) => {
                const even = qi % 2 === 0;
                const stageLabel = STAGE_LABEL[q.status] || q.status || '—';
                const stageColor = STAGE_COLOR[q.status] || C.blue;
                const qTotal     = quoteTotal(q.products);
                const numProds   = (q.products || []).length;
                const delivLabel = DEL_LABEL[q.deliveryMethod] || q.deliveryMethod || '—';

                // Stage pill style
                const stageCellSt = {
                    ...dataSt(even),
                    font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: stageColor } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                };

                const row1Cells = [
                    { v: sup.name || '—',             t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: supColor } } } },
                    { v: q.quoteNumber || q.id?.slice(-6) || '—', t: 's', s: dataSt(even) },
                    { v: stageLabel,                  t: 's', s: stageCellSt },
                    { v: numProds,                    t: 'n', s: numSt(even) },
                    { v: qTotal,                      t: 'n', s: { ...numSt(even), font: { name: 'Calibri', sz: 10, bold: true } } },
                    { v: delivLabel,                  t: 's', s: dataSt(even) },
                    { v: Number(q.moq) || 0,          t: 'n', s: numSt(even) },
                    { v: q.paymentTerms || '—',       t: 's', s: dataSt(even) },
                    { v: q.validUntil || '—',         t: 's', s: dataSt(even) },
                    { v: fmtDate(q.createdAt),        t: 's', s: dataSt(even) },
                ];
                putRow(ws1, r1, row1Cells, WS1_NC);
                setRowHeight(ws1, r1, 18);
                r1++;
            });
        });

        // Grand total row
        const totRow = Array(WS1_NC).fill(null).map((_, ci) => ({ v: '', t: 's', s: totSt() }));
        totRow[0] = { v: 'סה״כ כולל', t: 's', s: totSt() };
        totRow[4] = { v: grandTotal, t: 'n', s: totSt({ alignment: { horizontal: 'center', vertical: 'center' } }) };
        putRow(ws1, r1, totRow, WS1_NC);
        setRowHeight(ws1, r1, 22);

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 2 — "🔍 השוואה" Price Comparison Matrix
        // ════════════════════════════════════════════════════════════════════════
        // Gather all unique products (by lowercase name), sorted by category then name
        const productMap = new Map(); // key: lowerName -> { name, modelNumber, category, pricesBySup: Map<supId, {price, qty}> }
        quotes.forEach(q => {
            (q.products || []).forEach(p => {
                const key = (p.name || '').toLowerCase().trim();
                if (!key) return;
                if (!productMap.has(key)) {
                    productMap.set(key, {
                        name: p.name,
                        modelNumber: p.modelNumber || '',
                        category: p.category || 'ללא קטגוריה',
                        pricesBySup: new Map(),
                    });
                }
                const entry = productMap.get(key);
                // Store cheapest price per supplier
                const existing = entry.pricesBySup.get(q.supplierId);
                const price = unitNet(p); // ILS unit price after discount
                const qty   = Number(p.quantity) || 1;
                if (!existing || price < existing.price) {
                    entry.pricesBySup.set(q.supplierId, { price, qty });
                }
                // Update category / model if more complete
                if (!entry.category || entry.category === 'ללא קטגוריה') entry.category = p.category || 'ללא קטגוריה';
                if (!entry.modelNumber && p.modelNumber) entry.modelNumber = p.modelNumber;
            });
        });

        // Suppliers that appear in at least one quote
        const activeSups = sortedSuppliers.filter(s => quotes.some(q => q.supplierId === s.id));
        const WS2_FIXED  = 3; // category | product name | model
        const WS2_NC     = WS2_FIXED + activeSups.length;
        const WS2_COLS   = [20, 28, 16, ...activeSups.map(() => 14)];
        const ws2        = makeWS(WS2_COLS);

        // Row 0: Title
        fillMerge(ws2, 0, 0, 0, WS2_NC - 1, {
            v: `השוואת מחירים לפי מוצר — NextClass    |    ${todayStr}`,
            t: 's', s: titleSt(),
        });
        setRowHeight(ws2, 0, 36);

        // Row 1: spacer
        emptyRow(ws2, 1, WS2_NC, C.navy);
        setRowHeight(ws2, 1, 8);

        // Row 2: Column headers
        const matrixHdrs = ['קטגוריה', 'שם מוצר', 'מק"ט', ...activeSups.map(s => s.name)];
        matrixHdrs.forEach((h, ci) => {
            const isSup = ci >= WS2_FIXED;
            const supColor = isSup ? hex(activeSups[ci - WS2_FIXED].color) : null;
            setCell(ws2, 2, ci, {
                v: h, t: 's',
                s: colHdrSt(isSup && supColor ? { font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: supColor || C.accentFg } } } : {}),
            });
        });
        setRowHeight(ws2, 2, 22);

        // Group products by category
        const catGroups = new Map();
        for (const [, prod] of productMap) {
            const cat = prod.category;
            if (!catGroups.has(cat)) catGroups.set(cat, []);
            catGroups.get(cat).push(prod);
        }
        // Sort categories, then products within
        const sortedCats = [...catGroups.keys()].sort((a, b) => a.localeCompare(b, 'he'));

        let r2 = 3;
        sortedCats.forEach(cat => {
            const prods = catGroups.get(cat).sort((a, b) => a.name.localeCompare(b.name, 'he'));

            // Category divider row
            const catColor2 = hex(catColor(cat));
            const catDivSt = {
                font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: catColor2 || C.navy } },
                fill: { fgColor: { rgb: 'F0F9FF' }, patternType: 'solid' },
                alignment: { horizontal: 'right', vertical: 'center' },
                border: { bottom: THIN_BORDER('BAE6FD'), top: THIN_BORDER('BAE6FD'), left: THIN_BORDER('BAE6FD'), right: THIN_BORDER('BAE6FD') },
            };
            fillMerge(ws2, r2, 0, r2, WS2_NC - 1, { v: cat, t: 's', s: catDivSt });
            setRowHeight(ws2, r2, 18);
            r2++;

            prods.forEach((prod, pi) => {
                const even = pi % 2 === 0;

                // Collect non-null prices for this product row to find min/max
                const prices = activeSups.map(s => {
                    const entry = prod.pricesBySup.get(s.id);
                    return entry ? entry.price : null;
                });
                const nonNull = prices.filter(p => p !== null && p > 0);
                const minP = nonNull.length ? Math.min(...nonNull) : null;
                const maxP = nonNull.length ? Math.max(...nonNull) : null;
                const hasMultiple = nonNull.length > 1;

                setCell(ws2, r2, 0, { v: prod.category, t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 9, color: { rgb: catColor2 || C.mid } } } });
                setCell(ws2, r2, 1, { v: prod.name, t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 10, bold: true } } });
                setCell(ws2, r2, 2, { v: prod.modelNumber || '—', t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 9, color: { rgb: C.mid } } } });

                activeSups.forEach((sup, si) => {
                    const ci = WS2_FIXED + si;
                    const entry = prod.pricesBySup.get(sup.id);
                    if (!entry || !entry.price) {
                        setCell(ws2, r2, ci, { v: '—', t: 's', s: { ...numSt(even), font: { name: 'Calibri', sz: 10, color: { rgb: C.light } } } });
                    } else {
                        const p = entry.price;
                        const isMin = hasMultiple && p === minP;
                        const isMax = hasMultiple && p === maxP;
                        const priceSt = isMin ? greenSt(even) : isMax ? redSt(even) : numSt(even);
                        const label = entry.qty > 1 ? `${fmtNum(p)} (×${entry.qty})` : fmtNum(p);
                        setCell(ws2, r2, ci, { v: label, t: 's', s: priceSt });
                    }
                });

                setRowHeight(ws2, r2, 18);
                r2++;
            });

            // Category subtotal row
            const catTotSt = {
                font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: C.totFg } },
                fill: { fgColor: { rgb: C.navy }, patternType: 'solid' },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: CELL_BORDER,
            };
            for (let ci = 0; ci < WS2_NC; ci++) {
                if (ci === 0) {
                    setCell(ws2, r2, ci, { v: `סה״כ — ${cat}`, t: 's', s: { ...catTotSt, alignment: { horizontal: 'right', vertical: 'center' } } });
                } else if (ci >= WS2_FIXED) {
                    const supId = activeSups[ci - WS2_FIXED]?.id;
                    const catTotal = prods.reduce((sum, prod) => {
                        const entry = prod.pricesBySup.get(supId);
                        return sum + (entry ? entry.price * entry.qty : 0);
                    }, 0);
                    setCell(ws2, r2, ci, { v: catTotal > 0 ? `₪${fmtNum(catTotal)}` : '—', t: 's', s: catTotSt });
                } else {
                    setCell(ws2, r2, ci, { v: '', t: 's', s: catTotSt });
                }
            }
            setRowHeight(ws2, r2, 16);
            r2++;

            // Blank spacer after category
            emptyRow(ws2, r2, WS2_NC, C.divBg);
            setRowHeight(ws2, r2, 6);
            r2++;
        });

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 3 — "📦 מוצרים" Product Catalog
        // ════════════════════════════════════════════════════════════════════════
        // קטגוריה | שם מוצר | מק"ט | ספק | שלב | כמות | מחיר ליח׳ ₪ | הנחה % | עלות ₪ | פורסם | מדרגות מחיר
        //   22       30        18    20    13     8     13             9       13       10       40
        const WS3_COLS = [22, 30, 18, 20, 13, 8, 13, 9, 13, 10, 40];
        const WS3_NC   = WS3_COLS.length;
        const ws3      = makeWS(WS3_COLS);
        const HDRS3    = ['קטגוריה','שם מוצר','מק"ט','ספק','שלב','כמות','מחיר ליח׳ ₪','הנחה %','עלות ₪','פורסם','מדרגות מחיר'];

        // Title
        fillMerge(ws3, 0, 0, 0, WS3_NC - 1, {
            v: `קטלוג מוצרים — NextClass    |    ${todayStr}`,
            t: 's', s: titleSt(),
        });
        setRowHeight(ws3, 0, 36);

        // Spacer
        emptyRow(ws3, 1, WS3_NC, C.navy);
        setRowHeight(ws3, 1, 8);

        // Column headers
        HDRS3.forEach((h, ci) => setCell(ws3, 2, ci, { v: h, t: 's', s: colHdrSt() }));
        setRowHeight(ws3, 2, 22);

        // Build flat list of products, sorted by category then name
        const allProducts = [];
        quotes.forEach(q => {
            const sup = suppliers.find(s => s.id === q.supplierId);
            (q.products || []).forEach(p => {
                allProducts.push({ p, q, sup });
            });
        });
        allProducts.sort((a, b) => {
            const catCmp = (a.p.category || 'ללא').localeCompare(b.p.category || 'ללא', 'he');
            if (catCmp !== 0) return catCmp;
            return (a.p.name || '').localeCompare(b.p.name || '', 'he');
        });

        let r3 = 3;
        let lastCat3 = null;
        let rowInCat  = 0;
        let catGrandTotal = 0;
        const grandTotal3 = allProducts.reduce((s, { p }) => s + lineTotal(p), 0);

        // Helper: emit category subtotal + divider
        const emitCatSubtotal3 = (catName, total) => {
            const st = { font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: C.totFg } }, fill: { fgColor: { rgb: '334155' }, patternType: 'solid' }, alignment: { horizontal: 'right', vertical: 'center' }, border: CELL_BORDER };
            for (let ci = 0; ci < WS3_NC; ci++) {
                if (ci === 0) setCell(ws3, r3, ci, { v: `סה״כ — ${catName}`, t: 's', s: st });
                else if (ci === 8) setCell(ws3, r3, ci, { v: total, t: 'n', s: { ...st, alignment: { horizontal: 'center', vertical: 'center' } } });
                else setCell(ws3, r3, ci, { v: '', t: 's', s: st });
            }
            setRowHeight(ws3, r3, 16);
            r3++;
        };

        allProducts.forEach(({ p, q, sup }) => {
            const cat = p.category || 'ללא קטגוריה';
            const lt = lineTotal(p); // use ILS-corrected line total

            if (cat !== lastCat3) {
                // Close previous category
                if (lastCat3 !== null) {
                    emitCatSubtotal3(lastCat3, catGrandTotal);
                    emptyRow(ws3, r3, WS3_NC, C.divBg);
                    setRowHeight(ws3, r3, 6);
                    r3++;
                }
                // Category divider
                const cColor = hex(catColor(cat));
                const cdSt = {
                    font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: cColor || C.navy } },
                    fill: { fgColor: { rgb: 'F8FAFC' }, patternType: 'solid' },
                    alignment: { horizontal: 'right', vertical: 'center' },
                    border: { bottom: THIN_BORDER('CBD5E1'), top: THIN_BORDER('CBD5E1'), left: THIN_BORDER('CBD5E1'), right: THIN_BORDER('CBD5E1') },
                };
                fillMerge(ws3, r3, 0, r3, WS3_NC - 1, { v: cat, t: 's', s: cdSt });
                setRowHeight(ws3, r3, 18);
                r3++;
                lastCat3 = cat;
                rowInCat = 0;
                catGrandTotal = 0;
            }

            const even = rowInCat % 2 === 0;
            const stageLabel = STAGE_LABEL[q.status] || q.status || '—';
            const stageColor = STAGE_COLOR[q.status] || C.blue;
            const stageSt3 = { ...dataSt(even), font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: stageColor } }, alignment: { horizontal: 'center', vertical: 'center' } };
            const publishedSt = { ...numSt(even), font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: p.publishedProductId ? C.greenTxt : C.light } } };

            const tiersSt = { ...dataSt(even), font: { name: 'Calibri', sz: 9, color: { rgb: (p.tiers || []).length > 0 ? '5AC8FA' : C.light } }, alignment: { horizontal: 'right', vertical: 'center', wrapText: false } };
            const prodRow = [
                { v: cat, t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 9, color: { rgb: hex(catColor(cat)) || C.mid } } } },
                { v: p.name || '—', t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 10, bold: true } } },
                { v: p.modelNumber || '—', t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 9, color: { rgb: C.mid } } } },
                { v: sup?.name || '—', t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 10, color: { rgb: hex(sup?.color) || C.blue } } } },
                { v: stageLabel, t: 's', s: stageSt3 },
                { v: Number(p.quantity) || 1, t: 'n', s: numSt(even) },
                { v: getTierAwarePrice(p), t: 'n', s: numSt(even) },
                { v: Number(p.discount) || 0, t: 'n', s: numSt(even) },
                { v: lt, t: 'n', s: { ...numSt(even), font: { name: 'Calibri', sz: 10, bold: true } } },
                { v: p.publishedProductId ? 'פורסם' : '—', t: 's', s: publishedSt },
                { v: formatTiers(p), t: 's', s: tiersSt },
            ];
            putRow(ws3, r3, prodRow, WS3_NC);
            setRowHeight(ws3, r3, 18);
            r3++;
            rowInCat++;
            catGrandTotal += lt;
        });

        // Close last category
        if (lastCat3 !== null) {
            emitCatSubtotal3(lastCat3, catGrandTotal);
        }

        // Grand total
        const gt3St = totSt({ alignment: { horizontal: 'center', vertical: 'center' } });
        const gt3Row = Array(WS3_NC).fill(null).map((_, ci) => ({ v: '', t: 's', s: totSt() }));
        gt3Row[0] = { v: 'סה״כ כולל', t: 's', s: totSt() };
        gt3Row[8] = { v: grandTotal3, t: 'n', s: gt3St };
        putRow(ws3, r3, gt3Row, WS3_NC);
        setRowHeight(ws3, r3, 22);

        // ════════════════════════════════════════════════════════════════════════
        // SHEET 4 — "🏭 ספקים" Vendor Directory
        // ════════════════════════════════════════════════════════════════════════
        // שם ספק | שם סוכן | טלפון | אימייל | אתר | מינימום הזמנה ₪ | תנאי תשלום | ימי אספקה | הצעות פעילות | ערך כולל ₪
        //  24      18        18      26       22     15                 16           12          13             14
        const WS4_COLS = [24, 18, 18, 26, 22, 15, 16, 12, 13, 14];
        const WS4_NC   = WS4_COLS.length;
        const ws4      = makeWS(WS4_COLS);
        const HDRS4    = ['שם ספק','שם סוכן','טלפון','אימייל','אתר','מינימום הזמנה ₪','תנאי תשלום','ימי אספקה','הצעות פעילות','ערך כולל ₪'];

        // Title
        fillMerge(ws4, 0, 0, 0, WS4_NC - 1, {
            v: `ספריית ספקים — NextClass    |    ${suppliers.length} ספקים    |    ${todayStr}`,
            t: 's', s: titleSt(),
        });
        setRowHeight(ws4, 0, 36);

        // Spacer
        emptyRow(ws4, 1, WS4_NC, C.navy);
        setRowHeight(ws4, 1, 8);

        // Column headers
        HDRS4.forEach((h, ci) => setCell(ws4, 2, ci, { v: h, t: 's', s: colHdrSt() }));
        setRowHeight(ws4, 2, 22);

        let r4 = 3;
        let grandTotal4 = 0;

        sortedSuppliers.forEach((sup, si) => {
            const supQuotes  = quotes.filter(q => q.supplierId === sup.id);
            const totalVal   = supQuotes.reduce((s, q) => s + quoteTotal(q.products), 0);
            const activeCount = supQuotes.length;
            const even = si % 2 === 0;
            const supColor4 = hex(sup.color) || C.blue;
            grandTotal4 += totalVal;

            // Phone with WhatsApp hyperlink
            const rawPhone = (sup.agentPhone || sup.phone || '').replace(/\D/g, '').replace(/^0/, '');
            const phonecell = rawPhone
                ? lc(
                    sup.agentPhone || sup.phone,
                    `https://wa.me/972${rawPhone}`,
                    { ...dataSt(even), font: { name: 'Calibri', sz: 10, color: { rgb: '16A34A' }, underline: true } },
                )
                : { v: '—', t: 's', s: dataSt(even) };

            // Email hyperlink
            const emailAddr = sup.agentEmail || sup.email || '';
            const emailcell = emailAddr
                ? lc(
                    emailAddr,
                    `mailto:${emailAddr}`,
                    { ...dataSt(even), font: { name: 'Calibri', sz: 10, color: { rgb: C.blue }, underline: true } },
                )
                : { v: '—', t: 's', s: dataSt(even) };

            // Website hyperlink
            const domainRaw = (sup.domain || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
            const domainFull = domainRaw ? `https://${domainRaw}` : '';
            const webcell = domainRaw
                ? lc(
                    domainRaw,
                    domainFull,
                    { ...dataSt(even), font: { name: 'Calibri', sz: 10, color: { rgb: '0A84FF' }, underline: true } },
                )
                : { v: '—', t: 's', s: dataSt(even) };

            const supRow = [
                { v: sup.name || '—', t: 's', s: { ...dataSt(even), font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: supColor4 } } } },
                { v: sup.agentName || sup.contact || '—', t: 's', s: dataSt(even) },
                phonecell,
                emailcell,
                webcell,
                { v: Number(sup.minOrder) || 0, t: 'n', s: numSt(even) },
                { v: sup.paymentTerms || '—', t: 's', s: dataSt(even) },
                { v: sup.leadTimeDays ? `${sup.leadTimeDays}` : '—', t: 's', s: numSt(even) },
                { v: activeCount, t: 'n', s: numSt(even) },
                { v: totalVal, t: 'n', s: { ...numSt(even), font: { name: 'Calibri', sz: 10, bold: true } } },
            ];
            putRow(ws4, r4, supRow, WS4_NC);
            setRowHeight(ws4, r4, 20);
            r4++;
        });

        // Grand total row
        const gt4Row = Array(WS4_NC).fill(null).map((_, ci) => ({ v: '', t: 's', s: totSt() }));
        gt4Row[0] = { v: 'סה״כ כולל', t: 's', s: totSt() };
        gt4Row[8] = { v: quotes.length, t: 'n', s: totSt({ alignment: { horizontal: 'center', vertical: 'center' } }) };
        gt4Row[9] = { v: grandTotal4, t: 'n', s: totSt({ alignment: { horizontal: 'center', vertical: 'center' } }) };
        putRow(ws4, r4, gt4Row, WS4_NC);
        setRowHeight(ws4, r4, 22);

        // ── Assemble & write workbook ─────────────────────────────────────────
        const wb = XS.utils.book_new();
        XS.utils.book_append_sheet(wb, ws1, 'סקירה');
        XS.utils.book_append_sheet(wb, ws2, 'השוואה');
        XS.utils.book_append_sheet(wb, ws3, 'מוצרים');
        XS.utils.book_append_sheet(wb, ws4, 'ספקים');

        XS.writeFile(wb, `NextClass-הצעות-ספקים-${now.toISOString().slice(0, 10)}.xlsx`);
    });
}

// ─── Main ──────────────────────────────────────────────────────────────────────
// ─── Babushka drill primitives (shared visual grammar with the dashboard) ─────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#1D1D1F';
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-[14px] p-3 text-center"
                        style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                        <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ color: c }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}

const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

export default function AdminSuppliers({ embedded = false }) {
    const { showToast } = useAdminToast();
    const [suppliers,    setSuppliers]    = useState([]);
    const [quotes,       setQuotes]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [search,       setSearch]       = useState('');
    const [activeTab,    setActiveTab]    = useState(null);
    const [selectedQ,    setSelectedQ]    = useState(null);
    const [focusProductKey, setFocusProductKey] = useState(null);
    const [addSupplier,  setAddSupplier]  = useState(false);
    const [addQuote,     setAddQuote]     = useState(false);
    const [editSupplier, setEditSupplier] = useState(null);
    const [pendingOpenId, setPendingOpenId] = useState(null);

    // ── Babushka drill stack (KPI → breakdown → supplier/quote detail) ──
    const [drillStack, setDrillStack] = useState([]);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const openQuoteDrawer = (q) => { closeDrill(); setActiveTab(q.supplierId); setTimeout(() => setSelectedQ(q), 60); };

    // Auto-open drawer when a freshly-created quote arrives via Firestore snapshot
    useEffect(() => {
        if (!pendingOpenId) return;
        const q = quotes.find(q => q.id === pendingOpenId);
        if (q) { setSelectedQ(q); setPendingOpenId(null); }
    }, [quotes, pendingOpenId]);

    // Live Firestore listeners
    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'suppliers'), orderBy('createdAt', 'asc')),
            snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setSuppliers(data);
                setActiveTab(t => {
                    if (t === null) return data[0]?.id || 'compare';
                    if (t !== 'compare' && !data.find(s => s.id === t)) return data[0]?.id || 'compare';
                    return t;
                });
                setError(null);
                setLoading(false);
            },
            (err) => { console.error('suppliers listener', err); setError('שגיאה בטעינת ספקים'); setLoading(false); showToast('שגיאה בטעינת ספקים', 'error'); }
        );
        return unsub;
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'supplier_quotes'), orderBy('createdAt', 'desc')),
            snap => setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            (err) => { console.error('supplier_quotes listener', err); setError('שגיאה בטעינת הצעות מחיר'); showToast('שגיאה בטעינת הצעות מחיר', 'error'); }
        );
        return unsub;
    }, []);

    const activeSupplier = suppliers.find(s => s.id === activeTab);
    const activeQuotes   = activeTab === 'compare' ? quotes : quotes.filter(q => q.supplierId === activeTab);
    const liveQ          = selectedQ ? (quotes.find(q => q.id === selectedQ.id) || selectedQ) : null;

    const allProductCategories = useMemo(() => {
        const s = new Set();
        quotes.forEach(q => (q.products || []).forEach(p => { if (p.category) s.add(p.category); }));
        return [...s].sort((a, b) => a.localeCompare(b, 'he'));
    }, [quotes]);

    // ─── KPI band derivations (suppliers · active RFQs · pending quotes · value) ──
    const kpis = useMemo(() => {
        const stageOf       = q => q.status || 'received';
        const activeRFQs    = quotes.filter(q => ['received', 'reviewing', 'negotiating'].includes(stageOf(q))).length;
        const pendingQuotes = quotes.filter(q => stageOf(q) === 'received').length;
        const totalValue    = quotes.reduce((s, q) => s + calcTotal(q.products || []), 0);
        return { suppliers: suppliers.length, activeRFQs, pendingQuotes, totalValue };
    }, [suppliers, quotes]);

    // ─── Search filters the supplier segment pills (Heaven organizing mechanism) ──
    const filteredSuppliers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return suppliers;
        return suppliers.filter(s =>
            (s.name || '').toLowerCase().includes(term) ||
            (s.agentName || '').toLowerCase().includes(term) ||
            (s.domain || '').toLowerCase().includes(term)
        );
    }, [suppliers, search]);

    const handleSupplierAdded = s => {
        setActiveTab(s.id);
    };

    return (
        <div dir="rtl">
            {/* Page header — icon+title hidden when embedded inside the Fulfillment tab
                 (that page owns the chrome); action buttons are kept either way. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
                {!embedded && (
                    <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: GOLD_SOFT, border: `1px solid ${hexA(GOLD, 0.22)}`, boxShadow: SHADOW.specular }}>
                        <Briefcase size={22} color={GOLD} />
                    </div>
                )}
                {!embedded && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>הצעות מחיר מספקים</h1>
                        <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>ניהול הצעות · השוואת מחירים · מעקב משא ומתן</p>
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                    {quotes.length > 0 && (
                        <motion.button
                            onClick={() => { exportQuotesXLSX(suppliers, quotes); showToast('מייצא קובץ Excel...', 'info'); }}
                            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(52,199,89,0.28)' }} whileTap={TAP}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: RADIUS.button, border: '1.5px solid rgba(52,199,89,0.35)', background: 'rgba(52,199,89,0.08)', color: '#248A3D', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                            <Download size={15} />ייצוא Excel
                        </motion.button>
                    )}
                    <motion.button onClick={() => setAddSupplier(true)} whileHover={{ y: -2, boxShadow: `0 8px 26px ${hexA(GOLD, 0.5)}` }} whileTap={TAP}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: RADIUS.button, border: '1px solid rgba(255,255,255,0.25)', background: GOLD_GRAD, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 18px ${hexA(GOLD, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                        <Plus size={15} />ספק חדש
                    </motion.button>
                </div>
            </div>

            {/* KPI band — suppliers · active RFQs · pending quotes · total value */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 22 }}>
                <AdminKPICard title="ספקים" value={kpis.suppliers} subtitle="ספקים במערכת" accent={GOLD} delay={0}
                    icon={<Briefcase size={20} color={GOLD} />} loading={loading} error={error && !suppliers.length ? error : undefined}
                    onClick={suppliers.length ? () => openDrill({ type: 'suppliers' }) : undefined} />
                <AdminKPICard title="הצעות פעילות" value={kpis.activeRFQs} subtitle="במשא ומתן" accent={PALETTE.azure} delay={0.05}
                    icon={<ClipboardList size={20} color={PALETTE.azure} />} loading={loading} error={error && !suppliers.length ? error : undefined}
                    onClick={() => openDrill({ type: 'quotes', scope: 'active' })} />
                <AdminKPICard title="ממתינות לבדיקה" value={kpis.pendingQuotes} subtitle="הצעות חדשות" accent={PALETTE.orange} delay={0.1}
                    icon={<Clock size={20} color={PALETTE.orange} />} loading={loading} error={error && !suppliers.length ? error : undefined}
                    onClick={() => openDrill({ type: 'quotes', scope: 'pending' })} />
                <AdminKPICard title="ערך כולל" value={fmt(kpis.totalValue)} subtitle="סך כל ההצעות" accent={PALETTE.green} delay={0.15}
                    icon={<CreditCard size={20} color={PALETTE.green} />} loading={loading} error={error && !suppliers.length ? error : undefined}
                    onClick={quotes.length ? () => openDrill({ type: 'value' }) : undefined} />
            </div>

            {/* Segment pills + search — Heaven organizing mechanism */}
            {suppliers.length > 0 && (
                <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {/* Search + quick-add row */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
                            <Search size={15} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', pointerEvents: 'none' }} />
                            <input
                                value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="חיפוש ספק, נציג או דומיין..." dir="rtl"
                                style={{ ...GLASS.frosted, width: '100%', borderRadius: RADIUS.input, padding: '9px 38px 9px 14px', fontSize: 13, fontWeight: 600, color: '#1D1D1F', outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s, box-shadow 0.15s' }}
                                onFocus={e => { e.target.style.border = `1.5px solid ${hexA(GOLD, 0.5)}`; e.target.style.boxShadow = `0 0 0 4px ${hexA(GOLD, 0.12)}`; }}
                                onBlur={e => { e.target.style.border = GLASS.frosted.border; e.target.style.boxShadow = GLASS.frosted.boxShadow; }}
                            />
                            {search && (
                                <button onClick={() => setSearch('')} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73' }}>
                                    <X size={11} />
                                </button>
                            )}
                        </div>
                        <div style={{ flex: 1 }} />
                        <motion.button onClick={() => setAddSupplier(true)} whileHover={{ y: -1 }} whileTap={TAP}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: RADIUS.button, border: `1px solid ${hexA(GOLD, 0.28)}`, background: hexA(GOLD, 0.08), cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, color: '#005EC4', fontSize: 12.5, fontWeight: 700 }}>
                            <Plus size={13} />ספק מהיר
                        </motion.button>
                    </div>

                    {/* Segment pill rail */}
                    <div style={{ ...GLASS.frosted, display: 'flex', gap: 4, padding: '6px 7px', borderRadius: RADIUS.md, overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'center' }}>
                        {filteredSuppliers.map(s => {
                            const on = activeTab === s.id;
                            const cnt = quotes.filter(q => q.supplierId === s.id).length;
                            return (
                                <motion.button key={s.id} onClick={() => setActiveTab(s.id)}
                                    whileHover={{ scale: on ? 1 : 1.02 }} whileTap={TAP}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 11, border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {on && <motion.div layoutId="sup-seg" transition={SPRING.pill}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 11, background: GOLD_SOFT, border: `1px solid ${hexA(GOLD, 0.3)}`, boxShadow: `0 2px 10px ${hexA(GOLD, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.75)` }} />}
                                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <SupplierAvatar domain={s.domain} name={s.name} size={20} color={s.color} logoUrl={s.logoUrl} />
                                        <span style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? '#005EC4' : '#6E6E73', letterSpacing: '-0.2px' }}>{s.name}</span>
                                        {cnt > 0 && (
                                            <span style={{ padding: '1px 6px', borderRadius: 6, background: on ? hexA(GOLD, 0.18) : 'rgba(0,0,0,0.05)', fontSize: 10, fontWeight: 800, color: on ? '#005EC4' : '#8E8E93' }}>
                                                {cnt}
                                            </span>
                                        )}
                                    </span>
                                </motion.button>
                            );
                        })}

                        {filteredSuppliers.length === 0 && search && (
                            <span style={{ padding: '7px 12px', fontSize: 12.5, fontWeight: 600, color: '#AEAEB2', whiteSpace: 'nowrap' }}>לא נמצאו ספקים תואמים</span>
                        )}

                        {/* Divider */}
                        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.09)', flexShrink: 0, margin: '0 3px' }} />

                        {/* Compare segment — only if ≥2 suppliers */}
                        {suppliers.length >= 2 && (() => {
                            const on = activeTab === 'compare';
                            return (
                                <motion.button onClick={() => setActiveTab('compare')} whileHover={{ scale: on ? 1 : 1.02 }} whileTap={TAP}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 11, border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {on && <motion.div layoutId="sup-seg" transition={SPRING.pill}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 11, background: GOLD_SOFT, border: `1px solid ${hexA(GOLD, 0.3)}`, boxShadow: `0 2px 10px ${hexA(GOLD, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.75)` }} />}
                                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Layers size={13} color={on ? GOLD : '#8E8E93'} />
                                        <span style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? '#005EC4' : '#6E6E73', letterSpacing: '-0.2px' }}>השוואה</span>
                                    </span>
                                </motion.button>
                            );
                        })()}

                        {/* Contacts segment */}
                        {(() => {
                            const on = activeTab === 'contacts';
                            return (
                                <motion.button onClick={() => setActiveTab('contacts')} whileHover={{ scale: on ? 1 : 1.02 }} whileTap={TAP}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 11, border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {on && <motion.div layoutId="sup-seg" transition={SPRING.pill}
                                        style={{ position: 'absolute', inset: 0, borderRadius: 11, background: GOLD_SOFT, border: `1px solid ${hexA(GOLD, 0.3)}`, boxShadow: `0 2px 10px ${hexA(GOLD, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.75)` }} />}
                                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={13} color={on ? GOLD : '#8E8E93'} />
                                        <span style={{ fontSize: 13, fontWeight: on ? 800 : 600, color: on ? '#005EC4' : '#6E6E73', letterSpacing: '-0.2px' }}>קשרים</span>
                                    </span>
                                </motion.button>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Main content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ ...G, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '80px 20px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 30, height: 30, border: `3px solid ${hexA(GOLD, 0.16)}`, borderTopColor: GOLD, borderRadius: '50%' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#86868B' }}>טוען ספקים והצעות מחיר...</span>
                    </motion.div>
                ) : error && suppliers.length === 0 ? (
                    <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ ...G, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 20px', textAlign: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: RADIUS.md, background: 'rgba(255,59,48,0.10)', border: '1px solid rgba(255,59,48,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertCircle size={28} color="#FF3B30" />
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F' }}>{error}</div>
                        <div style={{ fontSize: 13, color: '#AEAEB2' }}>בדוק את החיבור ונסה לרענן את הדף</div>
                    </motion.div>
                ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }}>
                    {suppliers.length === 0 ? (
                        <div style={{ ...G, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 18 }}>
                            <div style={{ width: 88, height: 88, borderRadius: RADIUS.hero, background: GOLD_SOFT, border: `1px solid ${hexA(GOLD, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW.specular }}>
                                <Briefcase size={38} color={GOLD} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', marginBottom: 6 }}>אין ספקים עדיין</div>
                                <div style={{ fontSize: 13, color: '#AEAEB2', marginBottom: 24 }}>הוסף ספק ראשון כדי להתחיל לנהל הצעות מחיר</div>
                                <motion.button onClick={() => setAddSupplier(true)} whileHover={{ y: -2, boxShadow: `0 8px 28px ${hexA(GOLD, 0.5)}` }} whileTap={TAP}
                                    style={{ padding: '13px 28px', borderRadius: RADIUS.button, border: '1px solid rgba(255,255,255,0.25)', background: GOLD_GRAD, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 22px ${hexA(GOLD, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                                    <Plus size={14} style={{ display: 'inline', marginLeft: 6 }} />הוסף ספק ראשון
                                </motion.button>
                            </div>
                        </div>
                    ) : activeTab === 'contacts' ? (
                        <ContactsTab suppliers={suppliers} quotes={quotes} onSelectSupplier={id => setActiveTab(id)} />
                    ) : activeTab === 'compare' ? (
                        <CompareTab suppliers={suppliers} quotes={quotes}
                            onSelectSupplier={id => setActiveTab(id)}
                            onSelectQuote={(q, productKey) => { setActiveTab(q.supplierId); setFocusProductKey(productKey || null); setTimeout(() => setSelectedQ(q), 80); }} />
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
                )}
            </AnimatePresence>

            {/* Drawers & Modals */}
            <AnimatePresence>
                {addSupplier && <AddSupplierModal key="add-sup" onClose={() => setAddSupplier(false)} onAdded={handleSupplierAdded} />}
                {addQuote && activeSupplier && <AddQuoteModal key="add-q" supplier={activeSupplier} onClose={() => setAddQuote(false)} onCreated={id => setPendingOpenId(id)} />}
                {editSupplier && <EditSupplierModal key="edit-sup" supplier={editSupplier} onClose={() => setEditSupplier(null)} />}
                {liveQ && (
                    <QuoteDrawer key={liveQ.id} quote={liveQ}
                        supplier={suppliers.find(s => s.id === liveQ.supplierId)}
                        onClose={() => { setSelectedQ(null); setFocusProductKey(null); }}
                        showToast={showToast}
                        allCategories={allProductCategories}
                        focusProductKey={focusProductKey} />
                )}
            </AnimatePresence>

            {/* ── Babushka Drill Drawer — KPI → breakdown → supplier/quote detail ── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                const isOpen  = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!current) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const stageOf   = (q) => NEG_STAGES.find(s => s.id === (q.status || 'received')) || NEG_STAGES[0];
                const supName   = (id) => suppliers.find(s => s.id === id)?.name || 'ספק לא ידוע';
                const StatusChip = ({ q }) => {
                    const st = stageOf(q);
                    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black shrink-0" style={{ background: hexA(st.color, 0.12), color: st.color }}><st.icon size={9} />{st.label}</span>;
                };
                const QuoteList = ({ list }) => (
                    list.length === 0 ? <DrillEmpty icon={ClipboardList} text="אין הצעות מחיר להצגה" /> : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">הצעות מחיר — לחץ לפרטים</p>
                            {list.slice(0, 40).map((q, i) => (
                                <DrillRow key={q.id} delay={i * 0.02} tone={stageOf(q).color}
                                    onClick={() => pushDrill({ type: 'quote', id: q.id })}
                                    leading={<StatusChip q={q} />}
                                    title={supName(q.supplierId)}
                                    subtitle={`${(q.products || []).length} מוצרים · ${fmtD(q.createdAt)}`}
                                    trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{fmt(calcTotal(q.products || []))}</span>}
                                />
                            ))}
                        </div>
                    )
                );
                const SupplierList = ({ withValue }) => {
                    const rows = suppliers.map(s => {
                        const qs = quotes.filter(q => q.supplierId === s.id);
                        return { s, count: qs.length, total: qs.reduce((sum, q) => sum + calcTotal(q.products || []), 0) };
                    }).sort((a, b) => withValue ? b.total - a.total : b.count - a.count);
                    return rows.length === 0 ? <DrillEmpty icon={Briefcase} text="אין ספקים במערכת" /> : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">ספקים — לחץ לצלילה</p>
                            {rows.map(({ s, count, total }, i) => (
                                <DrillRow key={s.id} delay={i * 0.02} tone={s.color || GOLD}
                                    onClick={() => pushDrill({ type: 'supplier', id: s.id })}
                                    leading={<SupplierAvatar domain={s.domain} name={s.name} size={30} color={s.color} logoUrl={s.logoUrl} />}
                                    title={s.name}
                                    subtitle={`${count} הצעות${s.agentName ? ` · ${s.agentName}` : ''}`}
                                    trailing={<span className="text-[12px] font-black shrink-0" style={{ color: withValue ? PALETTE.green : '#1D1D1F' }}>{withValue ? fmt(total) : count}</span>}
                                />
                            ))}
                        </div>
                    );
                };

                let title = '', subtitle = '', icon = null, accent = GOLD, footer = null, body = null;

                if (current.type === 'suppliers') {
                    accent = GOLD; icon = <Briefcase size={17} color={GOLD} />;
                    title = 'ספקים'; subtitle = `${kpis.suppliers} ספקים במערכת`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ספקים', value: kpis.suppliers, color: GOLD },
                                { label: 'הצעות פעילות', value: kpis.activeRFQs, color: PALETTE.azure },
                                { label: 'ממתינות', value: kpis.pendingQuotes, color: PALETTE.orange },
                                { label: 'ערך כולל', value: fmt(kpis.totalValue), color: PALETTE.green },
                            ]} />
                            <SupplierList withValue={false} />
                        </div>
                    );
                } else if (current.type === 'value') {
                    accent = PALETTE.green; icon = <CreditCard size={17} color={PALETTE.green} />;
                    title = 'ערך כולל'; subtitle = `${fmt(kpis.totalValue)} · ${quotes.length} הצעות`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ערך כולל', value: fmt(kpis.totalValue), color: PALETTE.green },
                                { label: 'הצעות', value: quotes.length, color: PALETTE.azure },
                                { label: 'ספקים', value: kpis.suppliers, color: GOLD },
                            ]} />
                            <SupplierList withValue={true} />
                        </div>
                    );
                } else if (current.type === 'quotes') {
                    const isPending = current.scope === 'pending';
                    const list = isPending
                        ? quotes.filter(q => (q.status || 'received') === 'received')
                        : quotes.filter(q => ['received', 'reviewing', 'negotiating'].includes(q.status || 'received'));
                    accent = isPending ? PALETTE.orange : PALETTE.azure;
                    icon = isPending ? <Clock size={17} color={PALETTE.orange} /> : <ClipboardList size={17} color={PALETTE.azure} />;
                    title = isPending ? 'ממתינות לבדיקה' : 'הצעות פעילות';
                    subtitle = `${list.length} הצעות · ${fmt(list.reduce((s, q) => s + calcTotal(q.products || []), 0))}`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הצעות', value: list.length, color: accent },
                                { label: 'ערך', value: fmt(list.reduce((s, q) => s + calcTotal(q.products || []), 0)), color: PALETTE.green },
                                { label: 'ספקים', value: new Set(list.map(q => q.supplierId)).size, color: GOLD },
                            ]} />
                            <QuoteList list={list} />
                        </div>
                    );
                } else if (current.type === 'supplier') {
                    const s = suppliers.find(x => x.id === current.id);
                    const list = quotes.filter(q => q.supplierId === current.id);
                    const total = list.reduce((sum, q) => sum + calcTotal(q.products || []), 0);
                    accent = s?.color || GOLD;
                    icon = s ? <SupplierAvatar domain={s.domain} name={s.name} size={26} color={s.color} logoUrl={s.logoUrl} /> : <Briefcase size={17} color={GOLD} />;
                    title = s?.name || 'ספק'; subtitle = `${list.length} הצעות · ${fmt(total)}`;
                    footer = { label: 'מעבר לספק', onClick: () => { closeDrill(); setActiveTab(current.id); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'הצעות', value: list.length, color: accent },
                                { label: 'ערך כולל', value: fmt(total), color: PALETTE.green },
                                { label: 'איש קשר', value: s?.agentName || '—', color: '#5AC8FA' },
                            ]} />
                            <QuoteList list={list} />
                        </div>
                    );
                } else if (current.type === 'quote') {
                    const q = quotes.find(x => x.id === current.id);
                    if (!q) {
                        title = 'הצעת מחיר'; icon = <ClipboardList size={17} color={GOLD} />;
                        body = <DrillEmpty icon={ClipboardList} text="ההצעה נמחקה או אינה זמינה" />;
                    } else {
                        const st = stageOf(q); const total = calcTotal(q.products || []);
                        accent = st.color; icon = <st.icon size={17} color={st.color} />;
                        title = supName(q.supplierId); subtitle = `${st.label} · ${fmtD(q.createdAt)}`;
                        footer = { label: 'פתח הצעת מחיר', onClick: () => openQuoteDrawer(q) };
                        body = (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <StatusChip q={q} />
                                    <p className="text-[20px] font-black tracking-tight text-[#1D1D1F]">{fmt(total)}</p>
                                </div>
                                <DrillStat items={[
                                    { label: 'מוצרים', value: (q.products || []).length, color: PALETTE.azure },
                                    { label: 'ערך', value: fmt(total), color: PALETTE.green },
                                    { label: 'מס׳ הצעה', value: q.quoteNumber || '—', color: '#5AC8FA' },
                                ]} />
                                {(q.products || []).length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">מוצרים בהצעה</p>
                                        {(q.products || []).slice(0, 30).map((p, i) => {
                                            const line = (Number(p.pricePerUnit) || 0) * (Number(p.quantity) || 1) * (1 - (Number(p.discount) || 0) / 100);
                                            return (
                                                <DrillRow key={i} delay={i * 0.02}
                                                    leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(catColor(p.category), 0.12) }}><Box size={13} style={{ color: catColor(p.category) }} /></span>}
                                                    title={p.name || p.title || `מוצר ${i + 1}`}
                                                    subtitle={`${p.quantity || 1} × ${fmt(Number(p.pricePerUnit) || 0)}${p.discount ? ` · ${p.discount}%-` : ''}`}
                                                    trailing={<span className="text-[12px] font-black text-[#1D1D1F] shrink-0">{fmt(line)}</span>}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : <DrillEmpty icon={Box} text="אין מוצרים בהצעה זו" />}
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
