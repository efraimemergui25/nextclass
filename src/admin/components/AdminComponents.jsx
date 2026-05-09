/* eslint-disable */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ─── Shared glass surface ─────────────────────────────────────────────────────
const glassStyle = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

// ─── Internal: glow overlay (needs hook context) ──────────────────────────────
function GlowOverlay({ glowX, glowY, color }) {
    const bg = useTransform(
        [glowX, glowY],
        ([x, y]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${color}22 0%, transparent 60%)`
    );
    return (
        <motion.div
            className="absolute inset-0 pointer-events-none rounded-[22px]"
            style={{ background: bg }}
        />
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function AdminKPICard({ title, value, subtitle, trend, trendUp, icon, color = '#007AFF', delay = 0, sparkline, onClick }) {
    const cardRef = useRef(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const glowX = useSpring(mouseX, { stiffness: 200, damping: 20 });
    const glowY = useSpring(mouseY, { stiffness: 200, damping: 20 });

    const handleMouseMove = useCallback((e) => {
        const r = cardRef.current?.getBoundingClientRect();
        if (!r) return;
        mouseX.set((e.clientX - r.left) / r.width);
        mouseY.set((e.clientY - r.top) / r.height);
    }, [mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    }, [mouseX, mouseY]);

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: 'spring', stiffness: 280, damping: 26 }}
            whileHover={{ y: -4 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`relative overflow-hidden rounded-[22px] p-5 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            style={glassStyle}
        >
            {/* Accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}30)` }} />

            {/* Glow follows mouse */}
            <GlowOverlay glowX={glowX} glowY={glowY} color={color} />

            <div className="relative z-10 flex flex-col h-full pt-1">
                <div className="flex items-start justify-between mb-3">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${color}12`, border: `1px solid ${color}22` }}
                    >
                        {icon}
                    </motion.div>
                    {trend !== undefined && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: delay + 0.2, type: 'spring' }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                                trendUp ? 'bg-[#34C759]/12 text-[#27A84E]' : 'bg-[#FF3B30]/12 text-[#CC2A20]'
                            }`}
                        >
                            {trendUp ? '↑' : '↓'} {trend}%
                        </motion.div>
                    )}
                </div>

                <CountUp value={value} />
                <p className="text-[#86868B] text-[10px] font-black uppercase tracking-[0.18em] mt-1">{title}</p>
                {subtitle && <p className="text-[#AEAEB2] text-[11px] mt-1.5 leading-snug">{subtitle}</p>}

                {sparkline && sparkline.length > 0 && (
                    <div className="mt-4 -mx-1 -mb-1">
                        <MiniSparklineArea data={sparkline} color={color} />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function MiniSparklineArea({ data, color }) {
    if (!data?.length) return null;
    const max = Math.max(...data, 1);
    const w = 100, h = 36;
    const PAD = 4;
    const pts = data.map((v, i, arr) => ({
        x: arr.length === 1 ? 50 : (i / (arr.length - 1)) * w,
        y: PAD + (h - PAD * 2) - (v / max) * (h - PAD * 2),
    }));

    let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i-1].x + pts[i].x) / 2;
        line += ` C ${cpx.toFixed(1)} ${pts[i-1].y.toFixed(1)} ${cpx.toFixed(1)} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    const area = `${line} L ${w} ${h} L 0 ${h} Z`;
    const uid = `sp${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 36 }}>
            <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path fill={`url(#${uid})`} d={area} />
            <path fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" d={line} />
            <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.5" fill={color} />
        </svg>
    );
}

function CountUp({ value }) {
    const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value);
    useEffect(() => {
        const raw = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
        if (isNaN(raw)) { setDisplay(value); return; }
        const duration = 900;
        const start = Date.now();
        const timer = setInterval(() => {
            const p = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(eased * raw));
            if (p === 1) clearInterval(timer);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);

    const formatted = typeof value === 'string' && value.startsWith('₪')
        ? `₪${Number(display).toLocaleString()}`
        : typeof value === 'string' && value.endsWith('%')
        ? `${display}%`
        : typeof display === 'number'
        ? display.toLocaleString()
        : display;

    return (
        <p className="text-[30px] font-black tracking-tighter leading-none mt-1 text-[#1D1D1F]">
            {formatted}
        </p>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
    'ממתין':    { bg: 'rgba(255,149,0,0.10)',   text: '#B86A00', dot: '#FF9500' },
    'חדש':      { bg: 'rgba(255,59,48,0.10)',   text: '#C0392B', dot: '#FF3B30' },
    'אושר':     { bg: 'rgba(0,122,255,0.10)',   text: '#005EC4', dot: '#007AFF' },
    'נשלח':     { bg: 'rgba(88,86,214,0.10)',   text: '#4340A8', dot: '#5856D6' },
    'נמסר':     { bg: 'rgba(52,199,89,0.10)',   text: '#1A8C40', dot: '#34C759' },
    'בוטל':     { bg: 'rgba(255,59,48,0.10)',   text: '#C0392B', dot: '#FF3B30' },
    'בטיפול':   { bg: 'rgba(255,149,0,0.10)',   text: '#B86A00', dot: '#FF9500' },
    'נסגר':     { bg: 'rgba(52,199,89,0.10)',   text: '#1A8C40', dot: '#34C759' },
    'פעיל':     { bg: 'rgba(52,199,89,0.10)',   text: '#1A8C40', dot: '#34C759' },
    'לא פעיל':  { bg: 'rgba(134,134,139,0.10)', text: '#6E6E73', dot: '#AEAEB2' },
    'תקין':     { bg: 'rgba(52,199,89,0.10)',   text: '#1A8C40', dot: '#34C759' },
    'נמוך':     { bg: 'rgba(255,149,0,0.10)',   text: '#B86A00', dot: '#FF9500' },
    'אזל':      { bg: 'rgba(255,59,48,0.10)',   text: '#C0392B', dot: '#FF3B30' },
};

export function StatusBadge({ status, pulse }) {
    const s = STATUS_MAP[status] || { bg: 'rgba(0,0,0,0.06)', text: '#1D1D1F', dot: '#6E6E73' };
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
            style={{ background: s.bg, color: s.text }}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`} style={{ background: s.dot }} />
            {status}
        </span>
    );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function AdminTable({ columns, data, onRowClick, emptyMessage, emptyIcon, emptyAction }) {
    return (
        <div className="w-full overflow-x-auto rounded-[22px] overflow-hidden" style={glassStyle}>
            <table className="w-full text-right min-w-[600px]">
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        {columns.map(col => (
                            <th key={col.key}
                                className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#AEAEB2] whitespace-nowrap"
                                style={{ background: 'rgba(248,248,250,0.80)' }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <motion.tr
                            key={row.id || i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025, type: 'spring', stiffness: 300, damping: 26 }}
                            onClick={() => onRowClick?.(row)}
                            className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-[#007AFF]/03' : ''}`}
                            style={{ borderBottom: i < data.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}
                        >
                            {columns.map(col => (
                                <td key={col.key} className="px-5 py-3.5 text-sm">
                                    {col.render ? col.render(row[col.key], row) : (
                                        <span className="text-[#1D1D1F] font-medium">{row[col.key]}</span>
                                    )}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && (
                <AdminEmpty icon={emptyIcon} title={emptyMessage || 'אין נתונים להצגה'} action={emptyAction} />
            )}
        </div>
    );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
export function AdminSearchBar({ value, onChange, placeholder }) {
    return (
        <div className="relative">
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AEAEB2] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text" value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder || 'חיפוש...'} dir="rtl"
                className="w-full rounded-xl pr-10 pl-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all"
                style={{ ...glassStyle, boxShadow: 'none' }}
                onFocus={e => { e.target.style.border = '1px solid rgba(0,122,255,0.50)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.08)'; }}
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.75)'; e.target.style.boxShadow = 'none'; }}
            />
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function AdminSectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-start justify-between mb-7">
            <div className="text-right">
                <motion.h1 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-black text-[#1D1D1F] tracking-tighter">{title}</motion.h1>
                {subtitle && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-[#6E6E73] text-sm mt-1">{subtitle}</motion.p>
                )}
            </div>
            {action && <div className="flex gap-2.5 shrink-0">{action}</div>}
        </div>
    );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function AdminButton({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button' }) {
    const [popped, setPopped] = useState(false);
    const styles = {
        primary: { bg: 'linear-gradient(135deg, #007AFF, #5856D6)', color: 'white', border: 'none', shadow: '0 4px 14px rgba(0,122,255,0.30)' },
        success: { bg: 'linear-gradient(135deg, #34C759, #30D158)', color: 'white', border: 'none', shadow: '0 4px 14px rgba(52,199,89,0.30)' },
        danger:  { bg: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.20)', shadow: 'none' },
        ghost:   { bg: 'rgba(255,255,255,0.70)', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.10)', shadow: 'none' },
        outline: { bg: 'transparent', color: '#007AFF', border: '1px solid rgba(0,122,255,0.40)', shadow: 'none' },
    };
    const s = styles[variant] || styles.primary;
    const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-7 py-3.5 text-base' : 'px-4 py-2.5 text-sm';

    return (
        <motion.button
            type={type}
            animate={popped ? { scale: [1, 0.92, 1.06, 1] } : {}}
            transition={{ duration: 0.28 }}
            whileHover={{ opacity: 0.88 }}
            onClick={() => { setPopped(true); setTimeout(() => setPopped(false), 300); onClick?.(); }}
            disabled={disabled}
            className={`${pad} rounded-xl font-bold disabled:opacity-35 whitespace-nowrap shrink-0`}
            style={{ background: s.bg, color: s.color, border: s.border, boxShadow: s.shadow }}
        >
            {children}
        </motion.button>
    );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
export function AdminModal({ open, onClose, title, children, size = 'md' }) {
    const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200]"
                        style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 24 }}
                        transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                        className={`fixed inset-x-4 top-1/2 -translate-y-1/2 ${widths[size]} mx-auto z-[201] rounded-[28px] overflow-hidden`}
                        style={{
                            background: 'rgba(255,255,255,0.97)',
                            backdropFilter: 'blur(48px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
                            border: '1px solid rgba(255,255,255,0.85)',
                            boxShadow: '0 48px 120px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-black/05"
                            style={{ background: 'rgba(250,250,252,0.85)' }}>
                            <motion.button onClick={onClose} whileTap={{ scale: 0.88 }}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-black/06 transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                            <h3 className="font-black text-[#1D1D1F] text-base">{title}</h3>
                        </div>
                        <div className="p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function AdminInput({ label, value, onChange, type = 'text', placeholder, dir = 'rtl', rows }) {
    const base = "w-full rounded-xl px-4 text-[#1D1D1F] text-sm outline-none transition-all placeholder-[#AEAEB2]";
    const normalBorder = '1px solid rgba(0,0,0,0.10)';
    const focusBorder  = '1px solid rgba(0,122,255,0.55)';
    const inputStyle = { background: 'rgba(255,255,255,0.9)', border: normalBorder };

    return (
        <div>
            {label && <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">{label}</label>}
            {rows ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    rows={rows} dir={dir} className={`${base} py-3 resize-none`} style={inputStyle}
                    onFocus={e => { e.target.style.border = focusBorder; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.08)'; }}
                    onBlur={e => { e.target.style.border = normalBorder; e.target.style.boxShadow = 'none'; }} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    dir={dir} className={`${base} py-2.5`} style={inputStyle}
                    onFocus={e => { e.target.style.border = focusBorder; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.08)'; }}
                    onBlur={e => { e.target.style.border = normalBorder; e.target.style.boxShadow = 'none'; }} />
            )}
        </div>
    );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────
export function AdminFilterPills({ options, active, onChange }) {
    return (
        <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(0,0,0,0.06)' }}>
            {options.map(opt => (
                <motion.button key={opt} type="button" onClick={() => onChange(opt)}
                    className="relative px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap"
                    style={{ color: active === opt ? '#1D1D1F' : '#86868B' }}>
                    {active === opt && (
                        <motion.div layoutId="filter-pill" className="absolute inset-0 rounded-xl bg-white"
                            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                    )}
                    <span className="relative z-10">{opt}</span>
                </motion.button>
            ))}
        </div>
    );
}

// ─── Date Filter ──────────────────────────────────────────────────────────────
export function AdminDateFilter({ value, onChange }) {
    const options = [
        { id: 'all', label: 'כל הזמן' },
        { id: 'today', label: 'היום' },
        { id: 'week', label: 'שבוע אחרון' },
        { id: 'month', label: 'חודש אחרון' },
        { id: 'year', label: 'שנה אחרונה' },
    ];
    
    return (
        <div className="flex gap-1 p-1 rounded-2xl w-fit overflow-x-auto custom-scrollbar" style={{ background: 'rgba(0,0,0,0.06)' }}>
            {options.map(o => (
                <motion.button key={o.id} onClick={() => onChange(o.id)}
                    className="relative px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0"
                    style={{ color: value === o.id ? '#1D1D1F' : '#86868B' }}>
                    {value === o.id && (
                        <motion.div layoutId="date-filter-pill" className="absolute inset-0 rounded-xl bg-white"
                            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                    )}
                    <span className="relative z-10">{o.label}</span>
                </motion.button>
            ))}
        </div>
    );
}

export function filterByDate(items, dateField, period) {
    if (period === 'all') return items;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const week = today - 7 * 24 * 60 * 60 * 1000;
    const month = today - 30 * 24 * 60 * 60 * 1000;
    const year = today - 365 * 24 * 60 * 60 * 1000;

    return items.filter(item => {
        const ts = item[dateField];
        if (!ts) return false;
        if (period === 'today') return ts >= today;
        if (period === 'week') return ts >= week;
        if (period === 'month') return ts >= month;
        if (period === 'year') return ts >= year;
        return true;
    });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
export function AdminTabs({ tabs, active, onChange }) {
    return (
        <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(0,0,0,0.06)' }}>
            {tabs.map(t => (
                <motion.button key={t.id} onClick={() => onChange(t.id)}
                    className="relative px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap"
                    style={{ color: active === t.id ? '#1D1D1F' : '#86868B' }}>
                    {active === t.id && (
                        <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-white"
                            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.10)' }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }} />
                    )}
                    <span className="relative z-10">{t.label}</span>
                    {t.count !== undefined && (
                        <span className="relative z-10 mr-1 opacity-50">({t.count})</span>
                    )}
                </motion.button>
            ))}
        </div>
    );
}

// ─── Glass Panel ──────────────────────────────────────────────────────────────
export function GlassPanel({ children, className = '', padding = 'p-6', accent }) {
    return (
        <div className={`rounded-[22px] ${padding} ${className} relative overflow-hidden`} style={glassStyle}>
            {accent && (
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[22px]"
                    style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            )}
            {children}
        </div>
    );
}

// ─── Area Chart (smooth curves + grid) ───────────────────────────────────────
export function AreaChart({ data, color, height = 90 }) {
    if (!data?.length) return null;
    const max = Math.max(...data, 1);
    const w = 100, h = height;
    const PT = 8, PB = 4;
    const chartH = h - PT - PB;

    const pts = data.map((v, i, arr) => ({
        x: arr.length === 1 ? 50 : (i / (arr.length - 1)) * w,
        y: PT + chartH - (v / max) * chartH,
    }));

    let line = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
        const cpx = (pts[i-1].x + pts[i].x) / 2;
        line += ` C ${cpx.toFixed(1)} ${pts[i-1].y.toFixed(1)} ${cpx.toFixed(1)} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    const area = `${line} L ${w} ${h - PB} L 0 ${h - PB} Z`;
    const uid = `ac${color.replace('#', '')}`;

    // 4 horizontal grid levels
    const grids = [0.25, 0.5, 0.75, 1].map(p => PT + chartH * (1 - p));

    return (
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
            <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.20" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.00" />
                </linearGradient>
            </defs>
            {grids.map((y, i) => (
                <line key={i} x1="0" y1={y.toFixed(1)} x2={w} y2={y.toFixed(1)}
                    stroke="rgba(0,0,0,0.05)" strokeWidth="0.6" />
            ))}
            <path fill={`url(#${uid})`} d={area} />
            <path fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={line} />
            {pts.length > 0 && (
                <>
                    <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3" fill="white" stroke={color} strokeWidth="2" />
                    <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="1.5" fill={color} />
                </>
            )}
        </svg>
    );
}

// ─── Bar Chart (rounded tops) ─────────────────────────────────────────────────
export function BarChart({ data, color, labels, height = 80 }) {
    const max = Math.max(...data, 1);
    return (
        <div className="relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0 pt-0">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-full border-t border-black/04" />
                ))}
            </div>
            <div className="flex items-end gap-px relative z-10" style={{ height }}>
                {data.map((v, i) => (
                    <motion.div
                        key={i}
                        className="flex-1 min-h-[3px] relative group cursor-default"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.015, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            height: `${Math.max((v / max) * 100, 2)}%`,
                            background: `linear-gradient(180deg, ${color}, ${color}55)`,
                            borderRadius: '3px 3px 1px 1px',
                            transformOrigin: 'bottom',
                        }}
                        title={labels ? `${labels[i]}: ${v}` : `${v}`}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[3px]" />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
export function DonutChart({ data, colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'], size = 130 }) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = 38, cx = 50, cy = 50;
    const C = 2 * Math.PI * r;

    let cum = 0;
    const segments = data.map((d, i) => {
        const pct = d.value / total;
        const seg = { ...d, pct, dash: pct * C, gap: C - pct * C, offset: -cum * C, color: colors[i % colors.length] };
        cum += pct;
        return seg;
    });

    return (
        <div className="flex items-center gap-5">
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: size, height: size, flexShrink: 0 }}
            >
                <svg viewBox="0 0 100 100" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="16" />
                    {/* Segments */}
                    {segments.map((seg, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={seg.color} strokeWidth="16"
                            strokeDasharray={`${seg.dash} ${seg.gap}`}
                            strokeDashoffset={seg.offset}
                        />
                    ))}
                    {/* Center */}
                    <circle cx={cx} cy={cy} r="26" fill="rgba(255,255,255,0.95)" />
                </svg>
            </motion.div>
            <div className="space-y-2 flex-1 min-w-0">
                {segments.map((seg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 + 0.2 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                        <span className="text-[#1D1D1F] text-xs font-semibold flex-1 line-clamp-1 text-right">{seg.label}</span>
                        <span className="text-[#86868B] text-[11px] font-bold shrink-0">{(seg.pct * 100).toFixed(0)}%</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function AdminToggle({ label, sub, value, onChange }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onChange(!value)}
                className="w-11 h-6 rounded-full transition-colors relative shrink-0"
                style={{ background: value ? '#34C759' : 'rgba(0,0,0,0.14)' }}>
                <motion.div animate={{ x: value ? 22 : 3 }} transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
            </motion.button>
            <div className="text-right flex-1 mr-4">
                <p className="text-[#1D1D1F] text-sm font-bold leading-tight">{label}</p>
                {sub && <p className="text-[#AEAEB2] text-xs mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function AdminEmpty({ icon, title, subtitle, action }) {
    const icons = {
        orders:    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        products:  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
        customers: <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
        search:    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5"
                style={{ background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.12)' }}
            >
                {typeof icon === 'string' && icons[icon] ? (
                    <svg className="w-7 h-7 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {icons[icon]}
                    </svg>
                ) : <span className="text-3xl">{icon || '📭'}</span>}
            </motion.div>
            <p className="text-[#1D1D1F] font-black text-base mb-1">{title || 'אין נתונים'}</p>
            {subtitle && <p className="text-[#AEAEB2] text-sm">{subtitle}</p>}
            {action && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={action.onClick}
                    className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', boxShadow: '0 4px 14px rgba(0,122,255,0.28)' }}>
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
export function AdminFAB({ actions = [] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {open && actions.map((a, i) => (
                    <motion.button key={a.label}
                        initial={{ opacity: 0, scale: 0.7, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7, y: 10 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 26 }}
                        onClick={() => { a.onClick(); setOpen(false); }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-white whitespace-nowrap shadow-xl"
                        style={{ background: a.color || 'linear-gradient(135deg,#007AFF,#5856D6)' }}>
                        <span>{a.icon}</span>{a.label}
                    </motion.button>
                ))}
            </AnimatePresence>
            <motion.button whileTap={{ scale: 0.92 }} animate={{ rotate: open ? 45 : 0 }}
                onClick={() => setOpen(o => !o)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-light"
                style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 8px 32px rgba(0,122,255,0.40)' }}>
                +
            </motion.button>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function AdminSkeleton({ rows = 5 }) {
    return (
        <div className="rounded-[22px] overflow-hidden" style={glassStyle}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-black/04 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-black/05 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-black/05 rounded-full animate-pulse" style={{ width: `${55 + (i * 13) % 35}%` }} />
                        <div className="h-2.5 bg-black/05 rounded-full animate-pulse" style={{ width: `${30 + (i * 7) % 25}%` }} />
                    </div>
                    <div className="w-16 h-6 bg-black/05 rounded-full animate-pulse shrink-0" />
                    <div className="w-20 h-6 bg-black/05 rounded-full animate-pulse shrink-0" />
                </div>
            ))}
        </div>
    );
}
