import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSettings } from '../context/SettingsContext';

const DEFAULT_A11Y = { fontSize: 0, highContrast: false, reduceMotion: false, highlightLinks: false, grayscale: false };
const FONT_SIZES = [100, 112, 126, 140]; // percentages

const A11Y_CSS = `
.a11y-high-contrast { filter: contrast(1.6) saturate(1.1) !important; }
.a11y-reduce-motion *, .a11y-reduce-motion *::before, .a11y-reduce-motion *::after {
    animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important;
}
.a11y-highlight-links a {
    text-decoration: underline !important; text-underline-offset: 3px;
    text-decoration-color: #007AFF !important; text-decoration-thickness: 2px !important;
    background: rgba(0,122,255,0.07) !important; border-radius: 3px; padding: 0 2px;
}
.a11y-grayscale { filter: grayscale(100%) !important; }
`;

export default function AccessibilityWidget() {
    const { getSetting, isVisible } = useSettings();
    const enabled = isVisible('vis_accessibility_widget', true);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    const [a11y, setA11y] = useState(() => {
        try { return { ...DEFAULT_A11Y, ...JSON.parse(localStorage.getItem('nc_a11y') || '{}') }; }
        catch { return DEFAULT_A11Y; }
    });

    // Inject CSS once
    useEffect(() => {
        const el = document.createElement('style');
        el.id = 'nc-a11y-styles';
        el.textContent = A11Y_CSS;
        document.head.appendChild(el);
        return () => el.remove();
    }, []);

    // Persist settings
    useEffect(() => {
        localStorage.setItem('nc_a11y', JSON.stringify(a11y));
    }, [a11y]);

    // Apply font size
    useEffect(() => {
        const pct = FONT_SIZES[Math.max(0, Math.min(3, a11y.fontSize + 1))];
        document.documentElement.style.fontSize = `${pct}%`;
        return () => { document.documentElement.style.fontSize = ''; };
    }, [a11y.fontSize]);

    // Apply class toggles
    useEffect(() => {
        const html = document.documentElement;
        html.classList.toggle('a11y-high-contrast', !!a11y.highContrast);
        html.classList.toggle('a11y-reduce-motion', !!a11y.reduceMotion);
        html.classList.toggle('a11y-highlight-links', !!a11y.highlightLinks);
        html.classList.toggle('a11y-grayscale', !!a11y.grayscale);
    }, [a11y.highContrast, a11y.reduceMotion, a11y.highlightLinks, a11y.grayscale]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const update = useCallback((key, value) => setA11y(prev => ({ ...prev, [key]: value })), []);
    const reset = useCallback(() => {
        setA11y(DEFAULT_A11Y);
        document.documentElement.style.fontSize = '';
    }, []);

    const hasAnyActive = a11y.fontSize !== 0 || a11y.highContrast || a11y.reduceMotion || a11y.highlightLinks || a11y.grayscale;

    if (!enabled) return null;

    const title = getSetting('a11y_widget_title', 'נגישות');

    const ToggleRow = ({ label, active, onClick }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between gap-3 py-3 px-4 rounded-2xl transition-all text-right cursor-pointer hover:bg-black/[0.03]"
        >
            <span className="text-[13px] font-bold text-[#1D1D1F]">{label}</span>
            <div className={`relative w-10 h-6 rounded-full transition-all duration-300 shrink-0 ${active ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${active ? 'right-1' : 'left-1'}`} />
            </div>
        </button>
    );

    return createPortal(
        <div ref={panelRef} className="fixed bottom-6 left-6 z-[200] flex flex-col items-start gap-3">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="rounded-[2rem] overflow-hidden w-[272px]"
                        style={{
                            background: 'rgba(255,255,255,0.96)',
                            backdropFilter: 'blur(48px) saturate(2)',
                            WebkitBackdropFilter: 'blur(48px) saturate(2)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 pt-5 pb-3 border-b border-black/[0.05]">
                            <p className="text-[15px] font-black text-[#1D1D1F] text-right">{title}</p>
                            <p className="text-[11px] text-[#AEAEB2] font-medium text-right mt-0.5">
                                {getSetting('a11y_widget_subtitle', 'התאם את חוויית הגלישה שלך')}
                            </p>
                        </div>

                        {/* Font Size */}
                        <div className="px-4 py-3 border-b border-black/[0.05]">
                            <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest mb-3 text-right">
                                {getSetting('a11y_font_label', 'גודל טקסט')}
                            </p>
                            <div className="flex items-center gap-2 justify-center">
                                <button
                                    onClick={() => update('fontSize', Math.max(-1, a11y.fontSize - 1))}
                                    disabled={a11y.fontSize <= -1}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[18px] font-black text-[#1D1D1F] disabled:opacity-30 hover:bg-gray-50 transition-all cursor-pointer"
                                >A−</button>
                                <div className="flex-1 flex items-center gap-1 justify-center">
                                    {[-1, 0, 1, 2].map(v => (
                                        <button key={v} onClick={() => update('fontSize', v)}
                                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${a11y.fontSize === v ? 'bg-[#007AFF] scale-125' : 'bg-[#E5E5EA]'}`} />
                                    ))}
                                </div>
                                <button
                                    onClick={() => update('fontSize', Math.min(2, a11y.fontSize + 1))}
                                    disabled={a11y.fontSize >= 2}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[18px] font-black text-[#1D1D1F] disabled:opacity-30 hover:bg-gray-50 transition-all cursor-pointer"
                                >A+</button>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="px-2 py-2">
                            <ToggleRow label={getSetting('a11y_contrast_label', 'ניגוד גבוה')} active={a11y.highContrast} onClick={() => update('highContrast', !a11y.highContrast)} />
                            <ToggleRow label={getSetting('a11y_motion_label', 'ביטול אנימציות')} active={a11y.reduceMotion} onClick={() => update('reduceMotion', !a11y.reduceMotion)} />
                            <ToggleRow label={getSetting('a11y_links_label', 'הדגשת קישורים')} active={a11y.highlightLinks} onClick={() => update('highlightLinks', !a11y.highlightLinks)} />
                            <ToggleRow label={getSetting('a11y_grayscale_label', 'גווני אפור')} active={a11y.grayscale} onClick={() => update('grayscale', !a11y.grayscale)} />
                        </div>

                        {/* Reset */}
                        {hasAnyActive && (
                            <div className="px-4 pb-4 pt-1">
                                <button onClick={reset}
                                    className="w-full py-2.5 rounded-full border border-[#FF3B30]/30 text-[#FF3B30] text-[12px] font-bold hover:bg-[#FF3B30]/5 transition-all cursor-pointer">
                                    {getSetting('a11y_reset_label', 'איפוס הגדרות נגישות')}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            <motion.button
                onClick={() => setOpen(p => !p)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                aria-label={title}
                className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer focus:outline-none"
                style={{
                    background: open ? '#1D1D1F' : 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.10)',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                }}
            >
                {/* Active indicator dot */}
                {hasAnyActive && !open && (
                    <span className="absolute top-1 right-1 w-3 h-3 bg-[#34C759] rounded-full border-2 border-white" />
                )}
                <svg className={`w-6 h-6 transition-colors duration-200 ${open ? 'text-white' : 'text-[#1D1D1F]'}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    <circle cx="12" cy="12" r="9" strokeDasharray="3 2" strokeWidth={1} opacity={0.3} />
                </svg>
            </motion.button>
        </div>,
        document.body
    );
}
