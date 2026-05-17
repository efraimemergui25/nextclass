import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from 'react-router-dom';

// ─── Confetti particle ────────────────────────────────────────────────────────
function Confetti() {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const COLORS  = ['#007AFF','#30D158','#FF9F0A','#FF375F','#BF5AF2','#5AC8FA','#FFD60A'];
        const pieces  = Array.from({ length: 130 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height * 0.5,
            w: 7 + Math.random() * 7,
            h: 11 + Math.random() * 6,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.12,
            vy: 2.5 + Math.random() * 3,
            vx: (Math.random() - 0.5) * 2,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.save();
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.y < canvas.height ? 1 : Math.max(0, 1 - (p.y - canvas.height) / 80);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.x += p.vx; p.y += p.vy; p.angle += p.spin;
                if (p.y > canvas.height + 50) { p.y = -20; p.x = Math.random() * canvas.width; }
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        const timer = setTimeout(() => cancelAnimationFrame(raf), 4500);
        return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }} />;
}

// ─── Welcome Toast — shown after every login ──────────────────────────────────
export function WelcomeToast() {
    const { showWelcome, dismissWelcome, personalGreeting, tierLabel, tierColor } = useAuth();
    useEffect(() => {
        if (!showWelcome) return;
        const t = setTimeout(dismissWelcome, 5000);
        return () => clearTimeout(t);
    }, [showWelcome, dismissWelcome]);

    return (
        <AnimatePresence>
            {showWelcome && (
                <motion.div
                    key="welcome-toast"
                    initial={{ opacity: 0, y: -80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -60, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    style={{
                        position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 9999, minWidth: 300, maxWidth: 420,
                        background: 'rgba(29,29,31,0.96)',
                        backdropFilter: 'blur(32px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.08)',
                        direction: 'rtl', fontFamily: 'Heebo, sans-serif',
                    }}
                >
                    {/* Glowing avatar */}
                    <div style={{
                        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, ${tierColor}22, ${tierColor}44)`,
                        border: `2px solid ${tierColor}66`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Sparkles size={22} color={tierColor} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 3, lineHeight: 1.2 }}>
                            {personalGreeting}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={12} color="#30D158" strokeWidth={2.5} />
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                                התחברת בהצלחה · {tierLabel}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={dismissWelcome}
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex' }}
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── First Login Celebration — confetti + modal ───────────────────────────────
export function FirstLoginCelebration() {
    const { firstLogin, dismissFirstLogin, firstName, tierColor } = useAuth();
    return (
        <AnimatePresence>
            {firstLogin && (
                <>
                    <Confetti />
                    <motion.div
                        key="first-login-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                        onClick={dismissFirstLogin}
                    />
                    <motion.div
                        key="first-login-modal"
                        initial={{ opacity: 0, scale: 0.82, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.1 }}
                        style={{
                            position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 9999, width: 360, maxWidth: 'calc(100vw - 40px)',
                            background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                            borderRadius: 28,
                            border: '1px solid rgba(255,255,255,0.14)',
                            padding: '36px 32px 28px',
                            textAlign: 'center',
                            fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Star burst icon */}
                        <motion.div
                            animate={{ rotate: [0, 15, -10, 8, 0], scale: [1, 1.15, 1] }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            style={{ width: 80, height: 80, borderRadius: 24, background: `linear-gradient(135deg, ${tierColor}33, ${tierColor}66)`, border: `2px solid ${tierColor}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
                        >
                            <Star size={38} color={tierColor} strokeWidth={1.6} fill={tierColor} />
                        </motion.div>

                        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.2 }}>
                            ברוך הבא למשפחה{firstName ? `, ${firstName}` : ''}! 🎉
                        </h2>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 28 }}>
                            אנחנו שמחים שאתה איתנו. גלה את כל הפתרונות הטכנולוגיים שהכנו עבורך.
                        </p>

                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={dismissFirstLogin}
                            style={{
                                width: '100%', height: 52, borderRadius: 16,
                                background: `linear-gradient(135deg, ${tierColor}, ${tierColor}cc)`,
                                border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                                cursor: 'pointer', letterSpacing: '-0.02em',
                            }}
                        >
                            בואו נתחיל →
                        </motion.button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Member Bar — persistent thin bar for members ─────────────────────────────
export function MemberBar() {
    const { isMember, firstName, tierLabel, tierColor, discountPct } = useAuth();
    const { isVisible } = useSettings();
    const memberPricingOn = isVisible('vis_member_pricing', false);
    const [potentialSavings, setPotentialSavings] = useState(0);

    useEffect(() => {
        const calc = () => {
            try {
                const raw = sessionStorage.getItem('nc_savings_session');
                const prices = raw ? JSON.parse(raw) : [];
                const total = prices.reduce((s, p) => s + Number(p), 0);
                setPotentialSavings(Math.round(total * discountPct / 100));
            } catch { /* ignore */ }
        };
        calc();
        const id = setInterval(calc, 3000);
        return () => clearInterval(id);
    }, [discountPct]);

    if (!isMember || !memberPricingOn) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
                width: '100%', background: `linear-gradient(90deg, ${tierColor}18, ${tierColor}08)`,
                borderBottom: `1px solid ${tierColor}30`,
                padding: '6px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'Heebo, sans-serif', direction: 'rtl',
            }}
        >
            <CheckCircle size={13} color={tierColor} strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: tierColor }}>
                {firstName && `${firstName}, `}מחירי {tierLabel} פעילים — {discountPct}% הנחה ✓
                {potentialSavings > 0 && ` · חיסכון פוטנציאלי היום: ₪${potentialSavings.toLocaleString()}`}
            </span>
        </motion.div>
    );
}

// ─── Onboarding Checklist — persists beyond first session ────────────────────
export function OnboardingChecklist() {
    const { user, userDoc, firstName } = useAuth();
    const { wishlistCount } = useWishlist();
    const location = useLocation();

    const storageKey    = user ? `nc_onboarding_${user.uid}` : null;
    const dismissedKey  = user ? `nc_onboarding_dismissed_${user.uid}` : null;

    const getStored = useCallback(() => {
        if (!storageKey) return { profile: false, catalog: false, favorite: false };
        try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
        catch { return {}; }
    }, [storageKey]);

    const [tasks, setTasks] = useState(() => ({
        profile: false, catalog: false, favorite: false,
        ...getStored(),
    }));
    const [dismissed,  setDismissed]  = useState(() => {
        if (!dismissedKey) return false;
        return !!localStorage.getItem(dismissedKey);
    });
    const [allDonePop, setAllDonePop] = useState(false);

    // Sync tasks with live data
    useEffect(() => {
        if (!user) return;
        const next = { ...tasks };
        next.profile  = !!(userDoc?.institution);
        next.catalog  = tasks.catalog || location.pathname === '/catalog' || location.pathname.startsWith('/catalog');
        next.favorite = (wishlistCount || 0) > 0;

        // Persist
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
        setTasks(prev => {
            const wasAllDone = prev.profile && prev.catalog && prev.favorite;
            const nowAllDone = next.profile && next.catalog && next.favorite;
            if (!wasAllDone && nowAllDone) setAllDonePop(true);
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userDoc, location.pathname, wishlistCount]);

    const dismiss = () => {
        if (dismissedKey) localStorage.setItem(dismissedKey, '1');
        setDismissed(true);
    };

    const completedCount = [tasks.profile, tasks.catalog, tasks.favorite].filter(Boolean).length;
    const allDone = completedCount === 3;

    // Auto-hide 2s after all done pop
    useEffect(() => {
        if (allDonePop) {
            const t = setTimeout(() => setDismissed(true), 2500);
            return () => clearTimeout(t);
        }
    }, [allDonePop]);

    if (!user || dismissed) return null;

    const CHECKLIST_TASKS = [
        { key: 'profile',  label: 'השלם פרופיל',       done: tasks.profile  },
        { key: 'catalog',  label: 'גלה את הקטלוג',     done: tasks.catalog  },
        { key: 'favorite', label: 'שמור מוצר ראשון',   done: tasks.favorite },
    ];

    return (
        <AnimatePresence>
            {!dismissed && (
                <motion.div
                    key="onboarding-checklist"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                    style={{
                        position: 'fixed',
                        bottom: 90,
                        right: 16,
                        zIndex: 8000,
                        width: 'min(300px, calc(100vw - 32px))',
                        background: 'rgba(29,29,31,0.96)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.10)',
                        padding: '16px 16px 14px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.38), 0 0 0 0.5px rgba(255,255,255,0.06)',
                        fontFamily: 'Heebo, sans-serif',
                        direction: 'rtl',
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 1 }}>
                                {allDonePop ? '🎉 כל המשימות הושלמו!' : `שלום${firstName ? `, ${firstName}` : ''}! התחל עם NextClass`}
                            </p>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                                {completedCount}/3 הושלמו
                            </p>
                        </div>
                        <button
                            onClick={dismiss}
                            style={{
                                background: 'rgba(255,255,255,0.08)', border: 'none',
                                borderRadius: 99, width: 24, height: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                                padding: 0, flexShrink: 0,
                            }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        height: 3, background: 'rgba(255,255,255,0.10)',
                        borderRadius: 99, marginBottom: 14, overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedCount / 3) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                            style={{
                                height: '100%', borderRadius: 99,
                                background: allDone ? '#30D158' : '#007AFF',
                            }}
                        />
                    </div>

                    {/* Task list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {CHECKLIST_TASKS.map(({ key, label, done }) => (
                            <div key={key} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                                    background: done ? '#30D158' : 'rgba(255,255,255,0.10)',
                                    border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.25s',
                                }}>
                                    {done && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                        >
                                            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                                <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </motion.div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 13, fontWeight: done ? 600 : 500,
                                    color: done ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
                                    textDecoration: done ? 'line-through' : 'none',
                                    transition: 'color 0.2s',
                                    flex: 1,
                                }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Combined export — render all personalization in App ─────────────────────
export default function PersonalizationLayer() {
    return (
        <>
            <WelcomeToast />
            <FirstLoginCelebration />
            <OnboardingChecklist />
        </>
    );
}
