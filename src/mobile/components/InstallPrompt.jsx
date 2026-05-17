/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function InstallPrompt() {
    const { colors: c } = useTheme();
    const [prompt, setPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Don't show if already installed or previously dismissed
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (localStorage.getItem('nc_install_dismissed')) return;

        const handler = (e) => {
            e.preventDefault();
            setPrompt(e);
            // Show after a short delay so it doesn't feel aggressive
            setTimeout(() => setVisible(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!prompt) return;
        prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === 'accepted') {
            setVisible(false);
        }
        setPrompt(null);
    };

    const handleDismiss = () => {
        setVisible(false);
        setDismissed(true);
        localStorage.setItem('nc_install_dismissed', '1');
    };

    if (!visible || dismissed) return null;

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
                        bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`,
                        left: 16, right: 16, zIndex: 250,
                        background: c.surface,
                        borderRadius: 20,
                        padding: '16px 18px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                        border: `1px solid ${c.divider}`,
                        display: 'flex', alignItems: 'center', gap: 14,
                        fontFamily: SF, direction: 'rtl',
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
                            <circle cx={12} cy={16} r={9} stroke="white" strokeWidth={2} />
                            <circle cx={20} cy={16} r={9} stroke="white" strokeWidth={2} fill="white" fillOpacity={0.2} />
                        </svg>
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: c.text, marginBottom: 2 }}>
                            הוסף לשורת הבית
                        </p>
                        <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.4 }}>
                            גישה מהירה ל-NextClass
                        </p>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={handleDismiss}
                            style={{
                                padding: '8px 12px', borderRadius: 10,
                                background: c.surface2, border: 'none',
                                fontSize: 13, fontWeight: 600, color: c.text2,
                                cursor: 'pointer', fontFamily: SF,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            לא עכשיו
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={handleInstall}
                            style={{
                                padding: '8px 14px', borderRadius: 10,
                                background: '#007AFF', border: 'none',
                                fontSize: 13, fontWeight: 700, color: '#fff',
                                cursor: 'pointer', fontFamily: SF,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            הוסף
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
