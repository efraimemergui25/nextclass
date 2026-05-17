import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Don't show on admin, checkout, or if dismissed recently
const DISMISS_KEY = 'nc_exit_intent_dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24h

function isDismissedRecently() {
    try {
        const ts = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
        return Date.now() - ts < DISMISS_DURATION_MS;
    } catch { return false; }
}

export default function ExitIntentSheet() {
    const [visible, setVisible]   = useState(false);
    const [fired, setFired]       = useState(false);
    const location   = useLocation();
    const navigate   = useNavigate();
    const { user, firstName, openAuthModal } = useAuth();
    const inactivityTimer = useRef(null);

    const skip = location.pathname.startsWith('/admin') ||
                 location.pathname.startsWith('/checkout') ||
                 isDismissedRecently();

    const show = useCallback(() => {
        if (fired || skip || user) return; // don't show to logged-in users
        setVisible(true);
        setFired(true);
    }, [fired, skip, user]);

    const dismiss = useCallback(() => {
        setVisible(false);
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    }, []);

    // ── Desktop: mouse leave toward top of viewport ─────────────────────────
    useEffect(() => {
        if (skip || fired || user) return;
        const handler = (e) => {
            if (e.clientY < 10) show();
        };
        document.addEventListener('mouseleave', handler);
        return () => document.removeEventListener('mouseleave', handler);
    }, [show, skip, fired, user]);

    // ── Mobile: inactivity for 35s on engagement pages ──────────────────────
    useEffect(() => {
        if (skip || fired || user) return;
        const isEngagementPage = ['/catalog', '/discover', '/', '/favorites'].some(p =>
            location.pathname === p || location.pathname.startsWith(p + '/')
        );
        if (!isEngagementPage) return;

        const reset = () => {
            clearTimeout(inactivityTimer.current);
            inactivityTimer.current = setTimeout(show, 35000);
        };
        reset();
        window.addEventListener('touchstart', reset, { passive: true });
        window.addEventListener('scroll', reset, { passive: true });
        return () => {
            clearTimeout(inactivityTimer.current);
            window.removeEventListener('touchstart', reset);
            window.removeEventListener('scroll', reset);
        };
    }, [show, skip, fired, user, location.pathname]);

    const handleJoin = () => {
        dismiss();
        openAuthModal();
    };

    const handleExplore = () => {
        dismiss();
        navigate('/catalog');
    };

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="exit-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={dismiss}
                        style={{ position: 'fixed', inset: 0, zIndex: 9990, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    />

                    {/* Sheet */}
                    <motion.div
                        key="exit-sheet"
                        initial={{ y: 80, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 60, opacity: 0, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            zIndex: 9991,
                            background: 'linear-gradient(160deg, #0a1628, #0d2347 50%, #0f3460)',
                            borderRadius: '28px 28px 0 0',
                            padding: '28px 24px',
                            paddingBottom: 'max(32px, env(safe-area-inset-bottom, 24px))',
                            fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                            boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
                        }}
                    >
                        {/* Grab handle */}
                        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />

                        {/* Dismiss button */}
                        <button onClick={dismiss} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                            <X size={16} />
                        </button>

                        {/* Icon */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,122,255,0.2)', border: '1.5px solid rgba(0,122,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
                        >
                            <Sparkles size={28} color="#64D2FF" strokeWidth={1.6} />
                        </motion.div>

                        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center', letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.25 }}>
                            לפני שאתה הולך... 👋
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
                            הצטרף לקהילת מוסדות החינוך של NextClass וקבל גישה למחירים בלעדיים, ייעוץ מקצועי, ועוד.
                        </p>

                        {/* Trust pills */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                            {['✓ ללא עלות', '✓ ללא התחייבות', '✓ +500 מוסדות'].map(pill => (
                                <span key={pill} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 99 }}>
                                    {pill}
                                </span>
                            ))}
                        </div>

                        {/* CTAs */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleJoin}
                            style={{ width: '100%', height: 52, borderRadius: 16, background: '#007AFF', border: 'none', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 10, fontFamily: 'Heebo, sans-serif', letterSpacing: '-0.02em' }}
                        >
                            הצטרף בחינם
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleExplore}
                            style={{ width: '100%', height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Heebo, sans-serif' }}
                        >
                            המשך לגלות <ArrowLeft size={14} />
                        </motion.button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
