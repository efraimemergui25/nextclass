/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function OfflineBanner() {
    const [offline, setOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const goOffline = () => setOffline(true);
        const goOnline  = () => setOffline(false);
        window.addEventListener('offline', goOffline);
        window.addEventListener('online',  goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online',  goOnline);
        };
    }, []);

    return (
        <AnimatePresence>
            {offline && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    style={{
                        position: 'fixed',
                        top: `calc(56px + env(safe-area-inset-top, 0px))`,
                        left: 12, right: 12, zIndex: 500,
                        background: 'rgba(255,59,48,0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderRadius: 12,
                        padding: '10px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: SF, direction: 'rtl',
                        boxShadow: '0 4px 20px rgba(255,59,48,0.4)',
                    }}
                >
                    <WifiOff size={16} color="#fff" strokeWidth={2.2} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1 }}>
                        אין חיבור לאינטרנט
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                        מציג תוכן שמור
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
