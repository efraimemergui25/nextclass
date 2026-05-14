/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const STORAGE_KEY = 'nextclass_cookie_consent';

export default function CookieConsent() {
    const { getSetting } = useSettings();
    const title = getSetting('cookie_consent_title', 'אנו משתמשים בעוגיות');
    const body  = getSetting('cookie_consent_body',  'כדי לשפר את חוויית השימוש ולנתח תנועה באתר.');

    const [visible, setVisible]   = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const t = setTimeout(() => setVisible(true), 1800);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = (type) => {
        localStorage.setItem(STORAGE_KEY, type);
        setVisible(false);
        if (type === 'all') window.dispatchEvent(new CustomEvent('cookieConsent', { detail: { analytics: true } }));
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    dir="rtl"
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        width: 'min(380px, calc(100vw - 32px))',
                        background: 'rgba(255,255,255,0.94)',
                        backdropFilter: 'blur(32px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                        borderRadius: 22,
                        border: '1px solid rgba(0,0,0,0.07)',
                        boxShadow: '0 12px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.05)',
                        padding: '20px 20px 18px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
                    }}
                >
                    {/* Icon + title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"/>
                                <path d="M12 8v4l2 2"/>
                                <circle cx="19" cy="5" r="3" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4"/>
                            </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
                            <div style={{ fontSize: 13, color: '#6C6C70', lineHeight: 1.5 }}>{body}</div>
                        </div>
                    </div>

                    {/* Expandable details */}
                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                key="details"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ background: '#F9F9FB', borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#3C3C43', lineHeight: 1.65, border: '1px solid #E5E5EA' }}>
                                    <div style={{ marginBottom: 7 }}>
                                        <strong style={{ color: '#1D1D1F' }}>הכרחיות</strong> — ניווט, סל קניות, אבטחה. לא ניתן לבטל.
                                    </div>
                                    <div>
                                        <strong style={{ color: '#1D1D1F' }}>אנליטיקס</strong> — Google Analytics (אנונימי). ניתן לבטל בכל עת.
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Toggle */}
                    <button
                        onClick={() => setExpanded(p => !p)}
                        style={{ background: 'none', border: 'none', padding: '0 0 14px', fontSize: 12, color: '#007AFF', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                        {expanded ? '▲ פחות פרטים' : '▼ פרטים נוספים'}
                    </button>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => accept('all')}
                            style={{
                                flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                                color: '#fff', fontSize: 14, fontWeight: 700,
                            }}
                        >
                            אישור הכל
                        </button>
                        <button
                            onClick={() => accept('essential')}
                            style={{
                                flex: 1, padding: '11px 0', borderRadius: 12, cursor: 'pointer',
                                background: '#F2F2F7', border: '1px solid #E5E5EA',
                                color: '#3C3C43', fontSize: 14, fontWeight: 600,
                            }}
                        >
                            הכרחיות בלבד
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 10 }}>
                        <Link to="/privacy" style={{ fontSize: 12, color: '#AEAEB2', textDecoration: 'none' }} onClick={() => setVisible(false)}>
                            מדיניות פרטיות ועוגיות
                        </Link>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
