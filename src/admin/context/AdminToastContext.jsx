/* eslint-disable */
import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

const ICONS = {
    success: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    info: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
};

const STYLES = {
    success: { bg: '#34C759', shadow: 'rgba(52,199,89,0.30)' },
    error:   { bg: '#FF3B30', shadow: 'rgba(255,59,48,0.30)' },
    info:    { bg: '#007AFF', shadow: 'rgba(0,122,255,0.30)' },
    warning: { bg: '#FF9500', shadow: 'rgba(255,149,0,0.30)' },
};

function ToastItem({ toast, onRemove }) {
    const s = STYLES[toast.type] || STYLES.info;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl text-white text-sm font-bold cursor-pointer select-none max-w-[320px] min-w-[200px]"
            style={{
                background: s.bg,
                boxShadow: `0 8px 32px ${s.shadow}, 0 1px 0 rgba(255,255,255,0.18) inset`,
            }}
            onClick={() => onRemove(toast.id)}
            whileTap={{ scale: 0.97 }}
        >
            <span className="shrink-0">{ICONS[toast.type]}</span>
            <span className="flex-1 leading-tight">{toast.message}</span>
            <motion.div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 opacity-60 hover:opacity-100 transition-opacity text-[10px]"
                style={{ background: 'rgba(0,0,0,0.15)' }}>
                ✕
            </motion.div>
        </motion.div>
    );
}

export function AdminToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [{ id, message, type }, ...prev.slice(0, 4)]);
        if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast container — top-left (since admin is RTL) */}
            <div className="fixed top-4 left-4 z-[999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <div key={t.id} className="pointer-events-auto">
                            <ToastItem toast={t} onRemove={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useAdminToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useAdminToast must be inside AdminToastProvider');
    return ctx;
}
