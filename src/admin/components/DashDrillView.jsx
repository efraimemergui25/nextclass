/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — DASHBOARD DRILL-DOWN DRAWER  ("babushka" nested detail view)
   ───────────────────────────────────────────────────────────────────────────────
   A right-anchored, RTL, liquid-glass slide-in drawer. Presentational shell only —
   the dashboard owns the data and feeds each level's body via `children`. Supports a
   nested stack: pass `canBack` + `onBack` to reveal the back arrow. The sticky footer
   renders the primary "מעבר ל…" navigation button (azure→indigo signature gradient).
   ═══════════════════════════════════════════════════════════════════════════════ */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import { GLASS, RADIUS, SHADOW, GRADIENT, hexA } from '../theme/tokens';

export default function DashDrillView({
    open, title, subtitle, icon, accent = '#007AFF',
    canBack, onBack, onClose, footer, levelKey, children,
}) {
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Esc closes, Backspace pops one level (when nested and not typing)
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose?.(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Scrim */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200]"
                        style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
                    />
                    {/* Drawer */}
                    <motion.div
                        dir="rtl"
                        role="dialog"
                        aria-modal="true"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 360, damping: 40 }}
                        className="fixed inset-y-0 right-0 z-[201] flex flex-col w-[min(560px,92vw)]"
                        style={{ ...GLASS.sheet, borderRadius: `${RADIUS.sheetLg}px 0 0 ${RADIUS.sheetLg}px`, boxShadow: `${SHADOW.xxl}, ${SHADOW.specular2}` }}
                    >
                        {/* Signature accent strip */}
                        <div className="h-[3px] shrink-0" style={{ background: GRADIENT.signature }} />

                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-4 shrink-0"
                            style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(250,250,253,0.72)' }}>
                            {canBack && (
                                <motion.button
                                    onClick={onBack}
                                    whileTap={{ scale: 0.9 }}
                                    whileHover={{ x: 2 }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                                    style={{ background: hexA(accent, 0.1), color: accent }}
                                    aria-label="חזרה שלב אחורה"
                                >
                                    <ChevronRight size={17} strokeWidth={2.5} />
                                </motion.button>
                            )}
                            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                                style={{ background: hexA(accent, 0.12), border: `1px solid ${hexA(accent, 0.22)}` }}>
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <h3 className="font-black text-[#1D1D1F] text-[15px] tracking-tight truncate">{title}</h3>
                                {subtitle && <p className="text-[11px] text-[#AEAEB2] font-medium truncate mt-0.5">{subtitle}</p>}
                            </div>
                            <motion.button
                                onClick={onClose}
                                whileTap={{ scale: 0.88 }}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.09)' }}
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#AEAEB2] hover:text-[#1D1D1F] cursor-pointer transition-colors"
                                style={{ background: 'rgba(0,0,0,0.05)' }}
                                aria-label="סגור"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </motion.button>
                        </div>

                        {/* Body — animates on level change */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={levelKey}
                                    initial={{ opacity: 0, x: 18 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -18 }}
                                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                    className="p-5"
                                >
                                    {children}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Sticky footer — primary navigation */}
                        {footer && (
                            <div className="shrink-0 p-4"
                                style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(250,250,253,0.72)' }}>
                                <motion.button
                                    onClick={footer.onClick}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] text-[13px] font-black text-white cursor-pointer"
                                    style={{ background: GRADIENT.signature, boxShadow: '0 6px 20px rgba(0,122,255,0.28)' }}
                                >
                                    <span>{footer.label}</span>
                                    <ArrowLeft size={15} strokeWidth={2.5} />
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
