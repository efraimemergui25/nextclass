/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Info Tooltip — reusable dark popover ─────────────────────────────────────
export function InfoTooltip({ text }) {
    const [open, setOpen] = useState(false);
    return (
        <span className="relative inline-flex items-center" style={{ verticalAlign: 'middle' }}>
            <motion.button
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
                className="w-[15px] h-[15px] rounded-full flex items-center justify-center ml-1 shrink-0"
                style={{ background: 'rgba(0,0,0,0.08)', border: 'none', padding: 0, lineHeight: 1, cursor: 'pointer' }}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.9 }}
                aria-label="מידע נוסף"
            >
                <span style={{ fontSize: 9, fontWeight: 900, color: '#6E6E73', userSelect: 'none' }}>i</span>
            </motion.button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.93 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.93 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute z-50 bottom-full mb-2.5 right-0 pointer-events-none"
                        style={{ minWidth: 200, maxWidth: 240 }}
                    >
                        <div style={{
                            background: 'rgba(29,29,31,0.93)',
                            backdropFilter: 'blur(24px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                            borderRadius: 13,
                            padding: '9px 13px',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.30)',
                            border: '1px solid rgba(255,255,255,0.10)',
                        }}>
                            <p style={{ color: '#F5F5F7', fontSize: 11, fontWeight: 500, lineHeight: 1.55, textAlign: 'right', direction: 'rtl', margin: 0 }}>{text}</p>
                        </div>
                        {/* Arrow */}
                        <div style={{
                            position: 'absolute', bottom: -5, right: 14,
                            width: 10, height: 10,
                            background: 'rgba(29,29,31,0.93)',
                            transform: 'rotate(45deg)',
                            borderRight: '1px solid rgba(255,255,255,0.10)',
                            borderBottom: '1px solid rgba(255,255,255,0.10)',
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

// ─── Shared glass surface ─────────────────────────────────────────────────────
const glassStyle = {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.82)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
};

// ─── Common SVGs to replace Emojis ──────────────────────────────────────────
const ICONS = {
    revenue: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    orders: <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
    traffic: <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    products: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
    alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
    empty: <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />,
};

// ─── Mini Sparkline SVG ───────────────────────────────────────────────────────
function MiniSparkline({ data = [], color }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const W = 88, H = 28;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * (H - 3) - 1;
        return [x, y];
    });
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const fillPath = `${linePath} L ${W},${H} L 0,${H} Z`;
    const uid = color.replace('#', 'sg');
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible" style={{ direction: 'ltr' }}>
            <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={fillPath} fill={`url(#${uid})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Last point dot */}
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
        </svg>
    );
}

// ─── Premium KPI Card ─────────────────────────────────────────────────────────
export function AdminKPICard({ title, value, subtitle, trend, trendUp, icon, color = '#007AFF', delay = 0, onClick, sparkData, tooltip }) {

    return (
        <motion.div
            initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay, type: 'spring', stiffness: 340, damping: 28 }}
            whileHover={{ y: -4, scale: 1.018, boxShadow: `0 20px 48px ${color}22, inset 0 1px 0 rgba(255,255,255,0.9)` }}
            onClick={onClick}
            className={`relative overflow-hidden rounded-[26px] p-5 transition-shadow ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
            style={{
                background: `linear-gradient(145deg, ${color}12 0%, rgba(255,255,255,0.94) 45%, rgba(255,255,255,0.88) 100%)`,
                backdropFilter: 'blur(48px) saturate(220%)',
                WebkitBackdropFilter: 'blur(48px) saturate(220%)',
                border: `1px solid ${color}24`,
                boxShadow: `0 4px 24px ${color}12, 0 1px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(0,0,0,0.025) inset`,
            }}
        >
            {/* Top specular edge */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)' }} />
            {/* Ambient radial glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${color}18 0%, transparent 65%)` }} />

            <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                    <span className="flex items-center gap-0.5 mb-1.5">
                        <p className="text-[#86868B] text-[11px] font-bold tracking-[0.18em] uppercase">{title}</p>
                        {tooltip && <InfoTooltip text={tooltip} />}
                    </span>
                    <CountUp value={value} color={color} />
                </div>
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                    {typeof icon === 'string' && ICONS[icon] ? (
                        <svg className="w-5 h-5" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>{ICONS[icon]}</svg>
                    ) : (
                        <span className="text-lg">{icon}</span>
                    )}
                </div>
            </div>

            {/* Sparkline */}
            {sparkData && sparkData.length >= 2 && (
                <div className="mb-3 opacity-70">
                    <MiniSparkline data={sparkData} color={color} />
                </div>
            )}

            <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${color}12` }}>
                {subtitle ? (
                    <p className="text-[#86868B] text-[11px] font-medium">{subtitle}</p>
                ) : <div />}

                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${trendUp ? 'bg-[#34C759]/12 text-[#248A3D]' : 'bg-[#FF3B30]/10 text-[#D12B22]'}`}>
                        {trendUp ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" /></svg>
                        ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-7-7m7 7l7-7" /></svg>
                        )}
                        <span>{trend}%</span>
                    </div>
                )}
            </div>
        </motion.div>
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
        <p className="text-[34px] font-[800] tracking-tight leading-none text-[#1D1D1F]">
            {formatted}
        </p>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
    'ממתין':    { bg: '#FFF5E5', border: '#FFE0B2', text: '#B86A00', dot: '#FF9500' },
    'חדש':      { bg: '#FFEBEB', border: '#FFC7C7', text: '#C0392B', dot: '#FF3B30' },
    'אושר':     { bg: '#E5F0FF', border: '#B2D4FF', text: '#005EC4', dot: '#007AFF' },
    'נשלח':     { bg: '#EFEFFF', border: '#D0CFFF', text: '#4340A8', dot: '#5856D6' },
    'נמסר':     { bg: '#EBF9EE', border: '#C7EDD0', text: '#1A8C40', dot: '#34C759' },
    'בוטל':     { bg: '#FFEBEB', border: '#FFC7C7', text: '#C0392B', dot: '#FF3B30' },
    'בטיפול':   { bg: '#FFF5E5', border: '#FFE0B2', text: '#B86A00', dot: '#FF9500' },
    'נסגר':     { bg: '#EBF9EE', border: '#C7EDD0', text: '#1A8C40', dot: '#34C759' },
    'פעיל':     { bg: '#EBF9EE', border: '#C7EDD0', text: '#1A8C40', dot: '#34C759' },
    'לא פעיל':  { bg: '#F5F5F7', border: '#E5E5EA', text: '#6E6E73', dot: '#AEAEB2' },
    'תקין':     { bg: '#EBF9EE', border: '#C7EDD0', text: '#1A8C40', dot: '#34C759' },
    'נמוך':     { bg: '#FFF5E5', border: '#FFE0B2', text: '#B86A00', dot: '#FF9500' },
    'אזל':      { bg: '#FFEBEB', border: '#FFC7C7', text: '#C0392B', dot: '#FF3B30' },
};

export function StatusBadge({ status, pulse }) {
    const s = STATUS_MAP[status] || { bg: '#F5F5F7', border: '#E5E5EA', text: '#1D1D1F', dot: '#6E6E73' };
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pulse ? 'animate-pulse' : ''}`} style={{ background: s.dot }} />
            {status}
        </span>
    );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function AdminTable({ columns, data, onRowClick, emptyMessage, emptyIcon, emptyAction }) {
    return (
        <div className="w-full overflow-x-auto rounded-[24px]" style={glassStyle}>
            <table className="w-full text-right min-w-[600px]">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th key={col.key}
                                className="px-6 py-4 text-[12px] font-bold text-[#86868B] whitespace-nowrap"
                                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <motion.tr
                            key={row.id || i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.012, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => onRowClick?.(row)}
                            whileHover={onRowClick ? { backgroundColor: 'rgba(0,122,255,0.025)' } : {}}
                            className={`transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                            style={{ borderBottom: i < data.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}
                        >
                            {columns.map(col => (
                                <td key={col.key} className="px-6 py-4 text-sm text-[#1D1D1F]">
                                    {col.render ? col.render(row[col.key], row) : (
                                        <span className="font-medium text-[14.5px]">{row[col.key]}</span>
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
                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.82)'; e.target.style.boxShadow = 'none'; }}
            />
        </div>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function AdminSectionHeader({ title, subtitle, action }) {
    return (
        <div className="flex items-end justify-between mb-8 pb-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.045)' }}>
            <div className="text-right">
                <motion.h1
                    initial={{ opacity: 0, x: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                    className="text-[32px] font-[800] text-[#1D1D1F] tracking-tight leading-none"
                >
                    {title}
                </motion.h1>
                {subtitle && (
                    <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08, duration: 0.35 }}
                        className="text-[#86868B] text-[15px] font-medium mt-2"
                    >
                        {subtitle}
                    </motion.p>
                )}
            </div>
            {action && <div className="flex gap-3 shrink-0">{action}</div>}
        </div>
    );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function AdminButton({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button' }) {
    const [ripple, setRipple] = useState(null);
    const styles = {
        primary: {
            bg: 'linear-gradient(180deg, #2A2A2C 0%, #1D1D1F 100%)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.08)',
            shadow: '0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)',
            hoverShadow: '0 6px 20px rgba(0,0,0,0.25)',
        },
        success: {
            bg: 'linear-gradient(180deg, #000 0%, #000 100%)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.08)',
            shadow: '0 2px 8px rgba(0,0,0,0.18)',
            hoverShadow: '0 6px 18px rgba(0,0,0,0.22)',
        },
        danger:  { bg: 'transparent', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.22)', shadow: 'none', hoverShadow: '0 2px 12px rgba(255,59,48,0.14)' },
        ghost:   { bg: 'transparent', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.10)', shadow: 'none', hoverShadow: 'none' },
        outline: { bg: 'transparent', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.18)', shadow: 'none', hoverShadow: 'none' },
    };
    const s = styles[variant] || styles.primary;
    const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-7 py-3 text-base' : 'px-4 py-2 text-sm';

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setTimeout(() => setRipple(null), 550);
        onClick?.();
    };

    return (
        <motion.button
            type={type}
            whileHover={{ y: -1, boxShadow: s.hoverShadow }}
            whileTap={{ scale: 0.96, y: 0 }}
            onClick={handleClick}
            disabled={disabled}
            className={`${pad} rounded-[11px] font-semibold disabled:opacity-50 whitespace-nowrap shrink-0 relative overflow-hidden`}
            style={{
                background: variant === 'primary' || variant === 'success' ? s.bg : 'transparent',
                color: s.color,
                border: s.border,
                boxShadow: s.shadow,
                transition: 'box-shadow 250ms ease',
            }}
        >
            {ripple && (
                <span
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        left: ripple.x - 40, top: ripple.y - 40,
                        width: 80, height: 80,
                        background: 'rgba(255,255,255,0.22)',
                        animation: 'ripple-out 0.55s ease-out forwards',
                    }}
                />
            )}
            <span className="relative">{children}</span>
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
    const base = "w-full rounded-[13px] px-4 text-[#1D1D1F] text-sm outline-none transition-all placeholder-[#AEAEB2]";
    const normalBorder = '1px solid rgba(0,0,0,0.09)';
    const focusBorder  = '1px solid rgba(0,122,255,0.50)';
    const inputStyle = {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)',
        border: normalBorder,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
    };

    const onFocus = e => {
        e.target.style.border = focusBorder;
        e.target.style.boxShadow = '0 0 0 3.5px rgba(0,122,255,0.10), inset 0 1px 2px rgba(0,0,0,0.03)';
        e.target.style.background = 'rgba(255,255,255,1)';
    };
    const onBlur = e => {
        e.target.style.border = normalBorder;
        e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.05)';
        e.target.style.background = 'rgba(255,255,255,0.95)';
    };

    return (
        <div>
            {label && <label className="block text-[#6E6E73] text-[10px] font-black uppercase tracking-[0.18em] mb-1.5">{label}</label>}
            {rows ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    rows={rows} dir={dir} className={`${base} py-3 resize-none`} style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur} />
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                    dir={dir} className={`${base} py-2.5`} style={inputStyle}
                    onFocus={onFocus} onBlur={onBlur} />
            )}
        </div>
    );
}

export function AdminTextArea(props) {
    return <AdminInput {...props} rows={props.rows || 4} />;
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
export function GlassPanel({ children, className = '', padding = 'p-6' }) {
    return (
        <div className={`rounded-[24px] ${padding} ${className} relative overflow-hidden`} style={{
            ...glassStyle,
            boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.92)',
        }}>
            {/* Specular top edge */}
            <div className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none"
                style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.9) 30%, rgba(255,255,255,0.9) 70%, transparent)' }} />
            {children}
        </div>
    );
}

// ─── Calendar Month Grid — one Gregorian month at a time, with nav ───────────
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function HeatGrid({ data = [], color, labels = [] }) {
    const rr = parseInt(color.slice(1, 3), 16);
    const gg = parseInt(color.slice(3, 5), 16);
    const bb = parseInt(color.slice(5, 7), 16);
    const rgb = `${rr},${gg},${bb}`;
    const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

    // Parse labels ("11/4") → group by calendar month
    const monthGroups = useMemo(() => {
        if (!labels.length) return [];
        const groups = [];
        let cur = null;
        let year = new Date().getFullYear();
        let prevMonth = null;
        labels.forEach((lbl, idx) => {
            const parts = lbl.split('/');
            if (parts.length < 2) return;
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            if (prevMonth !== null && month < prevMonth) year++;
            const key = `${month}/${year}`;
            if (!cur || cur.key !== key) {
                cur = { key, month, year, entries: [] };
                groups.push(cur);
            }
            cur.entries.push({ day, value: data[idx] || 0 });
            prevMonth = month;
        });
        return groups;
    }, [labels, data]);

    const [monthIdx, setMonthIdx] = useState(() => Math.max(0, monthGroups.length - 1));
    useEffect(() => { setMonthIdx(Math.max(0, monthGroups.length - 1)); }, [monthGroups.length]);

    if (!monthGroups.length || !data?.length) return null;

    const group = monthGroups[Math.min(monthIdx, monthGroups.length - 1)];
    if (!group) return null;
    const { month, year, entries } = group;

    const dayMap = {};
    entries.forEach(e => { dayMap[e.day] = e.value; });
    const maxDay = Math.max(...entries.map(e => e.day));
    const max = Math.max(...entries.map(e => e.value), 1);
    const total = entries.reduce((s, e) => s + e.value, 0);
    const peakEntry = entries.reduce((b, e) => e.value > b.value ? e : b, entries[0]);

    // All days 1..maxDay
    const allDays = Array.from({ length: maxDay }, (_, i) => ({ day: i + 1, value: dayMap[i + 1] || 0 }));
    const rows = [];
    for (let i = 0; i < allDays.length; i += 7) rows.push(allDays.slice(i, i + 7));

    return (
        <div style={{ direction: 'ltr' }}>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setMonthIdx(i => Math.max(0, i - 1))}
                        disabled={monthIdx === 0}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 hover:opacity-70"
                        style={{ background: `rgba(${rgb},0.10)`, color }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-[13px] font-black text-[#1D1D1F] min-w-[130px] text-center">
                        {EN_MONTHS[month - 1]} {year}
                    </span>
                    <button
                        onClick={() => setMonthIdx(i => Math.min(monthGroups.length - 1, i + 1))}
                        disabled={monthIdx === monthGroups.length - 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25 hover:opacity-70"
                        style={{ background: `rgba(${rgb},0.10)`, color }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                {total > 0 && (
                    <div className="text-right">
                        <span className="text-[12px] font-black" style={{ color }}>{fmt(total)}</span>
                        <span className="text-[11px] text-[#86868B] ml-1">total</span>
                        {peakEntry && peakEntry.value > 0 && (
                            <span className="text-[10px] text-[#AEAEB2] ml-2">· peak <span className="font-bold" style={{ color: `rgba(${rgb},0.75)` }}>{fmt(peakEntry.value)}</span> on {month}/{peakEntry.day}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Day-of-week header */}
            <div className="flex gap-1 mb-1">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                    <div key={d} className="flex-1 text-center text-[8px] font-bold text-[#AEAEB2] uppercase tracking-wider py-1">{d}</div>
                ))}
            </div>

            {/* Calendar rows */}
            {rows.map((row, ri) => (
                <div key={ri} className="flex gap-1 mb-1">
                    {row.map(({ day, value }) => {
                        const pct = value / max;
                        const fmtVal = fmt(value);
                        const charLen = fmtVal.length;
                        const fsByPct = 11 + pct * 15;
                        const fsByLen = charLen <= 2 ? 24 : charLen <= 3 ? 18 : charLen <= 4 ? 15 : 12;
                        const fontSize = value === 0 ? 0 : Math.round(Math.min(fsByPct, fsByLen));
                        const bgAlpha = value === 0 ? 0.025 : 0.06 + pct * 0.11;
                        const textAlpha = value === 0 ? 0 : 0.62 + pct * 0.35;
                        const isPeak = peakEntry && day === peakEntry.day && value > 0;
                        return (
                            <div key={day}
                                className="flex-1 relative flex flex-col items-center justify-center rounded-xl cursor-default group overflow-hidden"
                                style={{ height: 66, background: `rgba(${rgb},${bgAlpha})` }}
                                title={`${day}/${month}/${year}: ${fmtVal}`}
                            >
                                {/* Day number */}
                                <span className="text-[9px] font-bold leading-none mb-1 tabular-nums"
                                    style={{ color: value > 0 ? `rgba(${rgb},0.70)` : '#8E8E93' }}>
                                    {day}
                                </span>

                                {/* Value */}
                                {value === 0 ? (
                                    <span style={{ fontSize: 11, color: '#C7C7CC', fontWeight: 500 }}>—</span>
                                ) : (
                                    <span className="font-black leading-none tabular-nums text-center w-full px-0.5 truncate"
                                        style={{
                                            fontSize,
                                            color: `rgba(${rgb},${textAlpha})`,
                                            filter: isPeak ? `drop-shadow(0 0 6px rgba(${rgb},0.40))` : 'none',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {fmtVal}
                                    </span>
                                )}

                                {/* Bottom accent */}
                                {value > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0"
                                        style={{ height: Math.round(2 + pct * 3), background: `rgba(${rgb},${0.28 + pct * 0.52})` }} />
                                )}

                                {/* Tooltip */}
                                <div className="absolute -top-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap">
                                    <div className="bg-[#1D1D1F] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow-2xl">
                                        <span className="opacity-50 ml-1">{day}/{month}</span>
                                        <span style={{ color }}>{fmtVal}</span>
                                    </div>
                                    <div className="w-2 h-2 bg-[#1D1D1F] rotate-45 mx-auto -mt-1" />
                                </div>
                            </div>
                        );
                    })}
                    {row.length < 7 && Array.from({ length: 7 - row.length }).map((_, pi) => (
                        <div key={`p${pi}`} className="flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ─── Area Chart — premium with Y-axis labels + X-axis dates ──────────────────
export function AreaChart({ data = [], color, height = 120, labels = [], formatY, compact = false }) {
    if (!data?.length) return null;
    const max = Math.max(...data, 1);
    const nonZero = data.filter(v => v > 0);
    const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;

    const svgH = compact ? height : height - 20;
    const PT = 6, PB = 4;
    const chartH = svgH - PT - PB;
    const uid = `area_${color.replace('#', '')}_${data.length}`;

    const pts = data.map((v, i, a) => ({
        x: a.length === 1 ? 50 : (i / (a.length - 1)) * 100,
        y: PT + chartH - (v / max) * chartH,
    }));

    let pathD = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        pathD += ` C ${mx.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${mx.toFixed(1)},${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
    }
    const areaD = `${pathD} L 100,${svgH - PB} L 0,${svgH - PB} Z`;

    const gridPcts = [0.25, 0.5, 0.75, 1];
    const gridLines = gridPcts.map(p => ({ y: PT + chartH * (1 - p), val: Math.round(p * max) }));

    const fmt = v => formatY ? formatY(v) : v >= 10000 ? `${(v / 1000).toFixed(0)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));

    // X-axis: show ~5 evenly spaced
    const xStep = Math.max(1, Math.floor((data.length - 1) / 4));
    const xIdxs = [];
    for (let i = 0; i < data.length; i += xStep) xIdxs.push(i);
    if (xIdxs[xIdxs.length - 1] !== data.length - 1) xIdxs.push(data.length - 1);

    return (
        <div style={{ direction: 'ltr' }}>
            <div className="flex items-stretch">
                {/* Chart */}
                <div className="flex-1 relative min-w-0">
                    <svg viewBox={`0 0 100 ${svgH}`} preserveAspectRatio="none" className="w-full block" style={{ height: svgH }}>
                        <defs>
                            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                                <stop offset="60%" stopColor={color} stopOpacity="0.06" />
                                <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </linearGradient>
                            <filter id={`gw_${uid}`} x="-5%" y="-40%" width="110%" height="180%">
                                <feGaussianBlur stdDeviation="1.0" result="b" />
                                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        {/* Grid lines */}
                        {gridLines.map((g, i) => (
                            <line key={i} x1="0" y1={g.y.toFixed(1)} x2="100" y2={g.y.toFixed(1)}
                                stroke={i === 3 ? `${color}20` : 'rgba(0,0,0,0.05)'}
                                strokeWidth={i === 3 ? '0.7' : '0.5'}
                                strokeDasharray={i === 3 ? '0' : '2,3'} />
                        ))}
                        {/* Average dashed */}
                        {avg > 0 && (
                            <line x1="0" x2="100"
                                y1={(PT + chartH - (avg / max) * chartH).toFixed(1)}
                                y2={(PT + chartH - (avg / max) * chartH).toFixed(1)}
                                stroke={`${color}30`} strokeWidth="0.6" strokeDasharray="3,2" />
                        )}
                        {/* Area fill */}
                        <path fill={`url(#${uid})`} d={areaD} />
                        {/* Glow */}
                        <path fill="none" stroke={`${color}50`} strokeWidth="3.5" strokeLinecap="round" d={pathD} filter={`url(#gw_${uid})`} />
                        {/* Line */}
                        <path fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" d={pathD} />
                        {/* Endpoint */}
                        {pts.length > 0 && <>
                            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={color} opacity="0.15" />
                            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2" fill="white" stroke={color} strokeWidth="1.5" />
                        </>}
                    </svg>
                    {/* X-axis labels */}
                    {!compact && labels.length > 0 && (
                        <div className="relative mt-1.5" style={{ height: 14 }}>
                            {xIdxs.map(i => (
                                <span key={i} className="absolute text-[9px] font-medium"
                                    style={{
                                        left: `${(i / (data.length - 1)) * 100}%`,
                                        transform: 'translateX(-50%)',
                                        color: 'rgba(0,0,0,0.32)',
                                        top: 0, whiteSpace: 'nowrap',
                                    }}>
                                    {labels[i]}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between items-end pl-2 shrink-0"
                    style={{ width: 38, height: svgH, paddingTop: PT - 3, paddingBottom: PB }}>
                    {[...gridLines].reverse().map((g, i) => (
                        <span key={i} className="text-[9px] font-mono leading-none"
                            style={{ color: `${color}75` }}>
                            {fmt(g.val)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Bar Chart — premium with Y-axis + X-axis labels ─────────────────────────
export function BarChart({ data = [], color, labels = [], height = 80 }) {
    const max = Math.max(...data, 1);
    const gridPcts = [0.25, 0.5, 0.75, 1];

    const xStep = Math.max(1, Math.floor((data.length - 1) / 6));
    const xIdxs = [];
    for (let i = 0; i < data.length; i += xStep) xIdxs.push(i);
    if (xIdxs[xIdxs.length - 1] !== data.length - 1) xIdxs.push(data.length - 1);

    const fmt = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

    return (
        <div style={{ direction: 'ltr' }}>
            <div className="flex items-stretch">
                {/* Bars area */}
                <div className="flex-1 min-w-0">
                    <div className="relative" style={{ height }}>
                        {/* Grid lines */}
                        {gridPcts.map((p, i) => (
                            <div key={i} className="absolute w-full pointer-events-none"
                                style={{
                                    bottom: `${p * 100}%`,
                                    borderTop: `${i === 3 ? '0.7px solid' : '0.5px dashed'} ${i === 3 ? `${color}18` : 'rgba(0,0,0,0.06)'}`,
                                }} />
                        ))}
                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end" style={{ gap: '1.5px' }}>
                            {data.map((v, i) => (
                                <motion.div key={i} className="flex-1 relative group cursor-default"
                                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                                    transition={{ delay: i * 0.012, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        height: `${Math.max((v / max) * 100, 1.5)}%`,
                                        background: `linear-gradient(180deg, ${color}EE, ${color}77)`,
                                        borderRadius: '3px 3px 1px 1px',
                                        transformOrigin: 'bottom',
                                        filter: v > 0 ? `drop-shadow(0 0 3px ${color}35)` : 'none',
                                    }}
                                    title={labels[i] ? `${labels[i]}: ${v}` : String(v)}
                                >
                                    <div className="absolute inset-0 bg-white/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    {/* X labels */}
                    {labels.length > 0 && (
                        <div className="relative mt-1.5" style={{ height: 14 }}>
                            {xIdxs.map(i => (
                                <span key={i} className="absolute text-[9px] font-medium"
                                    style={{
                                        left: `${(i / Math.max(data.length - 1, 1)) * 100}%`,
                                        transform: 'translateX(-50%)',
                                        color: 'rgba(0,0,0,0.32)',
                                        top: 0, whiteSpace: 'nowrap',
                                    }}>
                                    {labels[i]}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {/* Y-axis */}
                <div className="flex flex-col-reverse justify-between items-end pl-2 shrink-0"
                    style={{ width: 38, height, paddingTop: 2, paddingBottom: 2 }}>
                    {gridPcts.map((p, i) => (
                        <span key={i} className="text-[9px] font-mono leading-none"
                            style={{ color: `${color}75` }}>
                            {fmt(Math.round(p * max))}
                        </span>
                    ))}
                </div>
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

// ─── Goal Ring — circular progress for monthly targets ───────────────────────
export function GoalRing({ value = 0, target = 1, color = '#34C759', label, subtitle, size = 100 }) {
    const pct = Math.min(value / Math.max(target, 1), 1);
    const r = 38, cx = 50, cy = 50, C = 2 * Math.PI * r;
    const fmt = v => v >= 1000 ? `₪${(v / 1000).toFixed(0)}k` : `₪${v}`;

    return (
        <div className="flex items-center gap-4">
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ width: size, height: size, transform: 'rotate(-90deg)' }}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="13" />
                    <motion.circle
                        cx={cx} cy={cy} r={r} fill="none"
                        stroke={color} strokeWidth="13" strokeLinecap="round"
                        strokeDasharray={C}
                        initial={{ strokeDashoffset: C }}
                        animate={{ strokeDashoffset: C * (1 - pct) }}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F', lineHeight: 1 }}>
                        {Math.round(pct * 100)}%
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#AEAEB2', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        יעד
                    </span>
                </div>
            </div>
            <div className="text-right flex-1 min-w-0">
                <p className="font-black text-[#1D1D1F] text-sm leading-tight">{label}</p>
                {subtitle && <p className="text-[#86868B] text-[11px] mt-0.5">{subtitle}</p>}
                <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black" style={{ color }}>{fmt(value)}</span>
                        <span className="text-[10px] text-[#AEAEB2]">מתוך {fmt(target)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(pct * 100)}%` }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function AdminToggle({ label, sub, value, onChange }) {
    return (
        <div className="flex items-center justify-between py-0.5">
            <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => onChange(!value)}
                className="w-12 h-6.5 rounded-full relative shrink-0 focus:outline-none"
                style={{
                    width: 46, height: 26,
                    background: value
                        ? 'linear-gradient(135deg, #30D158 0%, #34C759 100%)'
                        : 'rgba(0,0,0,0.13)',
                    boxShadow: value
                        ? '0 2px 8px rgba(52,199,89,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
                        : 'inset 0 1px 3px rgba(0,0,0,0.12)',
                    transition: 'background 250ms ease, box-shadow 250ms ease',
                }}
            >
                <motion.div
                    animate={{ x: value ? 22 : 3 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                    className="absolute top-[3px] left-0 w-5 h-5 rounded-full"
                    style={{
                        background: 'white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(0,0,0,0.08)',
                    }}
                />
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
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#F5F5F7] text-[#86868B]">
                {typeof icon === 'string' && ICONS[icon] ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{ICONS[icon]}</svg>
                ) : (
                    <span className="text-3xl">{icon || <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{ICONS.empty}</svg>}</span>
                )}
            </div>
            <p className="text-[#1D1D1F] font-bold text-lg mb-1.5">{title || 'אין נתונים להצגה'}</p>
            {subtitle && <p className="text-[#86868B] text-sm max-w-sm">{subtitle}</p>}
            {action && (
                <div className="mt-6">
                    <AdminButton onClick={action.onClick}>{action.label}</AdminButton>
                </div>
            )}
        </motion.div>
    );
}

// ─── FAB ─────────────────────────────────────────────────────────────────────
export function AdminFAB({ actions = [] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="fixed bottom-8 left-8 z-[100] flex flex-col items-end gap-3">
            <AnimatePresence>
                {open && actions.map((a, i) => (
                    <motion.button key={a.label}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        onClick={() => { a.onClick(); setOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm font-semibold text-[#1D1D1F] whitespace-nowrap shadow-xl bg-white border border-black/05 hover:bg-[#F5F5F7] transition-colors"
                        >
                        {typeof a.icon === 'string' && ICONS[a.icon] ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{ICONS[a.icon]}</svg>
                        ) : <span>{a.icon}</span>}
                        {a.label}
                    </motion.button>
                ))}
            </AnimatePresence>
            <motion.button whileTap={{ scale: 0.95 }} animate={{ rotate: open ? 45 : 0 }}
                onClick={() => setOpen(o => !o)}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-light bg-[#1D1D1F] shadow-2xl hover:bg-black transition-colors"
                >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
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
