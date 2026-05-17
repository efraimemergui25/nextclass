/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function UpdateBanner() {
    const [waiting, setWaiting] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;
        const checkForUpdate = () => {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (!reg) return;
                if (reg.waiting) { setWaiting(reg.waiting); setVisible(true); return; }
                reg.addEventListener('updatefound', () => {
                    const installing = reg.installing;
                    installing?.addEventListener('statechange', () => {
                        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                            setWaiting(installing);
                            setVisible(true);
                        }
                    });
                });
            });
        };
        checkForUpdate();
    }, []);

    const handleUpdate = () => {
        if (!waiting) return;
        waiting.postMessage({ type: 'SKIP_WAITING' });
        setVisible(false);
        window.location.reload();
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    style={{
                        position: 'fixed',
                        bottom: `calc(90px + env(safe-area-inset-bottom, 0px))`,
                        left: 16, right: 16, zIndex: 250,
                        background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                        borderRadius: 18,
                        padding: '14px 18px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        fontFamily: SF, direction: 'rtl',
                        boxShadow: '0 8px 32px rgba(0,122,255,0.35)',
                    }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
                            עדכון זמין
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                            גרסה חדשה של האפליקציה מוכנה
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setVisible(false)}
                            style={{
                                padding: '8px 12px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.2)', border: 'none',
                                fontSize: 13, fontWeight: 600, color: '#fff',
                                cursor: 'pointer', fontFamily: SF,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            אחר כך
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={handleUpdate}
                            style={{
                                padding: '8px 16px', borderRadius: 10,
                                background: '#fff', border: 'none',
                                fontSize: 13, fontWeight: 800, color: '#007AFF',
                                cursor: 'pointer', fontFamily: SF,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            עדכן
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
