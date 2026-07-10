/* eslint-disable */
/**
 * AdminConfirm — a promise-based glass confirmation dialog that replaces the jarring
 * native window.confirm()/alert() across the admin.
 *
 *   const confirm = useAdminConfirm();
 *   if (await confirm({ title, message, confirmLabel, danger })) { ...do it... }
 *
 * Also exposes alert-style: await confirm({ message, alert: true }) → single OK button.
 */
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import { GLASS, RADIUS, SHADOW, SPRING, hexA } from '../theme/tokens';

const AdminConfirmContext = createContext(() => Promise.resolve(true));

function ConfirmDialog({ opts, onResolve }) {
    const {
        title = opts.danger ? 'לאשר את הפעולה?' : 'אישור',
        message = '',
        confirmLabel = opts.danger ? 'כן, בצע' : 'אישור',
        cancelLabel = 'ביטול',
        danger = false,
        alert = false,
    } = opts;
    const accent = danger ? '#FF3B30' : '#007AFF';
    const Icon = danger ? AlertTriangle : Info;

    return (
        <motion.div
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            dir="rtl"
            style={{ fontFamily: 'Heebo, sans-serif' }}
        >
            <motion.div
                className="absolute inset-0"
                style={{ background: 'rgba(20,22,40,0.32)', backdropFilter: 'blur(6px)' }}
                onClick={() => onResolve(false)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
                className="relative w-full max-w-[420px] overflow-hidden"
                style={{ ...GLASS.elevated, borderRadius: RADIUS.panel, boxShadow: `${SHADOW['2xl']}, ${SHADOW.specular}` }}
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={SPRING.snappy}
            >
                <button onClick={() => onResolve(false)}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <X size={15} className="text-[#86868B]" />
                </button>
                <div className="p-7 pt-8 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                        style={{ background: hexA(accent, 0.12), border: `1px solid ${hexA(accent, 0.20)}` }}>
                        <Icon size={26} style={{ color: accent }} strokeWidth={2} />
                    </div>
                    <h3 className="text-[19px] font-black text-[#1D1D1F] tracking-tight mb-2">{title}</h3>
                    {message && <p className="text-[14px] text-[#6E6E73] leading-relaxed whitespace-pre-line">{message}</p>}
                </div>
                <div className="px-7 pb-7 flex gap-3" style={{ flexDirection: alert ? 'column' : 'row' }}>
                    {!alert && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onResolve(false)}
                            className="flex-1 h-12 rounded-full font-bold text-[14px] text-[#1D1D1F] transition-colors"
                            style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
                            {cancelLabel}
                        </motion.button>
                    )}
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => onResolve(true)}
                        className="flex-1 h-12 rounded-full font-black text-[14px] text-white"
                        style={{ background: danger ? 'linear-gradient(135deg,#FF453A,#FF3B30)' : 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: `0 8px 22px ${hexA(accent, 0.38)}` }}>
                        {alert ? 'הבנתי' : confirmLabel}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function AdminConfirmProvider({ children }) {
    const [state, setState] = useState(null); // { opts, resolve }

    const confirm = useCallback((opts) => {
        const normalized = typeof opts === 'string' ? { message: opts } : (opts || {});
        return new Promise((resolve) => setState({ opts: normalized, resolve }));
    }, []);

    const resolve = (result) => {
        state?.resolve(result);
        setState(null);
    };

    return (
        <AdminConfirmContext.Provider value={confirm}>
            {children}
            <AnimatePresence>
                {state && <ConfirmDialog key="admin-confirm" opts={state.opts} onResolve={resolve} />}
            </AnimatePresence>
        </AdminConfirmContext.Provider>
    );
}

export const useAdminConfirm = () => useContext(AdminConfirmContext);
