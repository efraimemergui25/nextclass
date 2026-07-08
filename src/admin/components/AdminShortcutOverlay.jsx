/* eslint-disable */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Keyboard, X } from 'lucide-react';

const GLOBAL_SHORTCUTS = [
    { keys: ['?'],          desc: 'פתח מדריך קיצורי מקשים' },
    { keys: ['Esc'],        desc: 'סגור מודאל / פאנל פתוח' },
    { keys: ['⌘', 'K'],    desc: 'חיפוש מהיר (Command Palette)' },
    { keys: ['⌘', '/'],    desc: 'מיקוד בחיפוש' },
];

const PAGE_SHORTCUTS = {
    '/admin/dashboard':   [
        { keys: ['P'],  desc: 'פתח בחירת תקופה' },
        { keys: ['R'],  desc: 'רענן נתונים' },
    ],
    '/admin/orders': [
        { keys: ['N'],       desc: 'הצעה חדשה' },
        { keys: ['K'],       desc: 'עבור לתצוגת קנבן' },
        { keys: ['L'],       desc: 'עבור לתצוגת רשימה' },
        { keys: ['F'],       desc: 'פתח סינון' },
        { keys: ['E'],       desc: 'ייצא לExcel' },
    ],
    '/admin/inventory': [
        { keys: ['B'],       desc: 'מצב עריכה מהירה (Bulk)' },
        { keys: ['G'],       desc: 'תצוגת גריד' },
        { keys: ['L'],       desc: 'תצוגת רשימה' },
        { keys: ['/'],       desc: 'חיפוש מוצר' },
    ],
    '/admin/analytics': [
        { keys: ['1'],       desc: 'טאב סקירה כללית' },
        { keys: ['2'],       desc: 'טאב תנועה' },
        { keys: ['3'],       desc: 'טאב הכנסות' },
        { keys: ['4'],       desc: 'טאב מוצרים' },
        { keys: ['5'],       desc: 'טאב פאנל' },
        { keys: ['←','→'],   desc: 'ניווט בין שבועות / חודשים' },
    ],
    '/admin/users': [
        { keys: ['/'],       desc: 'חיפוש משתמש' },
        { keys: ['E'],       desc: 'ייצא CSV' },
    ],
    '/admin/fulfillment': [
        { keys: ['D'],       desc: 'טאב לוח בקרה' },
        { keys: ['S'],       desc: 'טאב הזמנות ספקים' },
    ],
};

// Key chip
function Key({ children }) {
    return (
        <kbd style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 22, height: 22, padding: '0 6px',
            background: 'rgba(0,0,0,0.07)', borderRadius: 6,
            fontSize: 11, fontWeight: 800, color: '#1D1D1F',
            border: '1px solid rgba(0,0,0,0.10)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 0,
        }}>
            {children}
        </kbd>
    );
}

export default function AdminShortcutOverlay() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handler = (e) => {
            // Don't trigger when typing in inputs/textareas
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                setOpen(p => !p);
            }
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const pageKey = Object.keys(PAGE_SHORTCUTS).find(k => location.pathname.startsWith(k)) || null;
    const pageShortcuts = pageKey ? PAGE_SHORTCUTS[pageKey] : [];

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: 'min(520px, 100%)', maxHeight: '80vh', overflowY: 'auto',
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(24px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                            borderRadius: 28, padding: 28,
                            fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.7) inset',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Keyboard size={18} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>קיצורי מקשים</h2>
                                    <p style={{ fontSize: 11, color: '#86868B', margin: 0, fontWeight: 500 }}>לחץ <kbd style={{ fontSize: 10, background: 'rgba(0,0,0,0.07)', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>?</kbd> שוב לסגירה</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)}
                                style={{ width: 30, height: 30, borderRadius: 99, background: 'rgba(0,0,0,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73' }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Global shortcuts */}
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>גלובלי</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {GLOBAL_SHORTCUTS.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: '#3D3D3D', margin: 0 }}>{s.desc}</p>
                                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                            {s.keys.map((k, j) => (
                                                <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                    {j > 0 && <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600 }}>+</span>}
                                                    <Key>{k}</Key>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Page-specific shortcuts */}
                        {pageShortcuts.length > 0 && (
                            <div>
                                <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 16 }} />
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                                    דף זה — {pageKey?.split('/admin/')[1]}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {pageShortcuts.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: '#3D3D3D', margin: 0 }}>{s.desc}</p>
                                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                {s.keys.map((k, j) => (
                                                    <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        {j > 0 && <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600 }}>+</span>}
                                                        <Key>{k}</Key>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer hint */}
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'center' }}>
                            <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500 }}>
                                לחץ <Key>?</Key> בכל עמוד לפתיחת מדריך זה
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
