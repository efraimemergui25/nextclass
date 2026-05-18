import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Shared glass style ───────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.04)',
};

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

// ─── Welcome Toast — tier-specific, context-aware ─────────────────────────────
export function WelcomeToast() {
    const { showWelcome, dismissWelcome, personalGreeting, tierLabel, tierColor, memberTier } = useAuth();
    const { wishlistCount } = useWishlist();

    const isPremium = memberTier === 'premium';
    const isMember  = memberTier === 'member';

    const subtitle = useMemo(() => {
        if (isPremium) return `פרימיום פעיל — מחירים מיוחדים + שירות VIP ✦`;
        if (isMember)  return wishlistCount > 0 ? `מחיר מוסדי פעיל · ${wishlistCount} מוצרים מחכים לך` : 'מחיר מוסדי פעיל — גישה למחירי מוסד';
        return wishlistCount > 0 ? `${wishlistCount} מוצרים שמרת מחכים לך` : 'גלה מאות פתרונות טכנולוגיים לחינוך';
    }, [isPremium, isMember, wishlistCount]);

    useEffect(() => {
        if (!showWelcome) return;
        const t = setTimeout(dismissWelcome, 6000);
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
                        zIndex: 9999, minWidth: 320, maxWidth: 460,
                        ...glass,
                        borderRadius: 20, padding: '16px 20px',
                        display: 'flex', alignItems: 'center', gap: 14,
                        direction: 'rtl', fontFamily: 'Heebo, sans-serif',
                        ...(isPremium && { border: `1.5px solid ${tierColor}50`, boxShadow: `0 8px 40px ${tierColor}25, 0 0 0 0.5px rgba(0,0,0,0.04)` }),
                    }}
                >
                    <motion.div
                        animate={isPremium ? { scale: [1, 1.08, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                        style={{
                            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                            background: `${tierColor}14`, border: `1.5px solid ${tierColor}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Sparkles size={22} color={tierColor} strokeWidth={1.8} />
                    </motion.div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 4, lineHeight: 1.2 }}>
                            {personalGreeting}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle size={11} color={memberTier !== 'free' ? tierColor : '#30D158'} strokeWidth={2.5} />
                            <p style={{ fontSize: 12, fontWeight: 600, color: memberTier !== 'free' ? tierColor : '#86868B', margin: 0 }}>
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={dismissWelcome}
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#AEAEB2', flexShrink: 0, display: 'flex' }}>
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── First Login Celebration — light glass modal + confetti ──────────────────
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
                        style={{ position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
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
                            ...glass,
                            borderRadius: 28,
                            padding: '36px 32px 28px',
                            textAlign: 'center',
                            fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                        }}
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -10, 8, 0], scale: [1, 1.15, 1] }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            style={{ width: 80, height: 80, borderRadius: 24, background: `${tierColor}12`, border: `1.5px solid ${tierColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
                        >
                            <Star size={38} color={tierColor} strokeWidth={1.6} fill={`${tierColor}44`} />
                        </motion.div>

                        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.2 }}>
                            ברוך הבא למשפחה{firstName ? `, ${firstName}` : ''}! 🎉
                        </h2>
                        <p style={{ fontSize: 14, color: '#86868B', lineHeight: 1.6, marginBottom: 28 }}>
                            אנחנו שמחים שאתה איתנו. גלה את כל הפתרונות הטכנולוגיים שהכנו עבורך.
                        </p>

                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={dismissFirstLogin}
                            style={{
                                width: '100%', height: 52, borderRadius: 16,
                                background: tierColor,
                                border: 'none', color: '#fff', fontSize: 16, fontWeight: 800,
                                cursor: 'pointer', letterSpacing: '-0.02em',
                                fontFamily: 'Heebo, sans-serif',
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

// ─── Member Bar — light frosted strip ────────────────────────────────────────
export function MemberBar() {
    const { isMember, firstName, tierLabel, tierColor } = useAuth();
    const { isVisible } = useSettings();
    const memberPricingOn = isVisible('vis_member_pricing', false);

    if (!isMember || !memberPricingOn) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                width: '100%',
                background: `${tierColor}0D`,
                borderBottom: `1px solid ${tierColor}22`,
                padding: '6px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'Heebo, sans-serif', direction: 'rtl',
            }}
        >
            <CheckCircle size={13} color={tierColor} strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: tierColor }}>
                {firstName && `${firstName}, `}מחירי {tierLabel} פעילים ✓
            </span>
        </motion.div>
    );
}

// ─── Onboarding Checklist — light glass card ─────────────────────────────────
export function OnboardingChecklist() {
    const { user, userDoc, firstName } = useAuth();
    const { wishlistCount } = useWishlist();
    const location = useLocation();

    const storageKey   = user ? `nc_onboarding_${user.uid}` : null;
    const dismissedKey = user ? `nc_onboarding_dismissed_${user.uid}` : null;

    const getStored = useCallback(() => {
        if (!storageKey) return {};
        try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
        catch { return {}; }
    }, [storageKey]);

    const [tasks, setTasks] = useState(() => ({
        profile: false, catalog: false, favorite: false,
        ...getStored(),
    }));
    const [dismissed, setDismissed] = useState(() => {
        if (!dismissedKey) return false;
        return !!localStorage.getItem(dismissedKey);
    });
    const [allDonePop, setAllDonePop] = useState(false);

    useEffect(() => {
        if (!user) return;
        const next = { ...tasks };
        next.profile  = !!(userDoc?.institution);
        next.catalog  = tasks.catalog || location.pathname.startsWith('/catalog');
        next.favorite = (wishlistCount || 0) > 0;
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
        setTasks(prev => {
            const wasAllDone = prev.profile && prev.catalog && prev.favorite;
            const nowAllDone = next.profile && next.catalog && next.favorite;
            if (!wasAllDone && nowAllDone) setAllDonePop(true);
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userDoc, location.pathname, wishlistCount]);

    useEffect(() => {
        if (allDonePop) {
            const t = setTimeout(() => setDismissed(true), 2500);
            return () => clearTimeout(t);
        }
    }, [allDonePop]);

    const dismiss = () => {
        if (dismissedKey) localStorage.setItem(dismissedKey, '1');
        setDismissed(true);
    };

    if (!user || dismissed) return null;

    const completedCount = [tasks.profile, tasks.catalog, tasks.favorite].filter(Boolean).length;
    const allDone = completedCount === 3;

    const CHECKLIST_TASKS = [
        { key: 'profile',  label: 'השלם פרופיל',     done: tasks.profile  },
        { key: 'catalog',  label: 'גלה את הקטלוג',   done: tasks.catalog  },
        { key: 'favorite', label: 'שמור מוצר ראשון', done: tasks.favorite },
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
                        bottom: 90, right: 16,
                        zIndex: 8000,
                        width: 'min(300px, calc(100vw - 32px))',
                        ...glass,
                        borderRadius: 20,
                        padding: '16px 16px 14px',
                        fontFamily: 'Heebo, sans-serif',
                        direction: 'rtl',
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: 1 }}>
                                {allDonePop ? '🎉 כל המשימות הושלמו!' : `שלום${firstName ? `, ${firstName}` : ''}! התחל עם NextClass`}
                            </p>
                            <p style={{ fontSize: 11, color: '#86868B', fontWeight: 500 }}>
                                {completedCount}/3 הושלמו
                            </p>
                        </div>
                        <button
                            onClick={dismiss}
                            style={{
                                background: 'rgba(0,0,0,0.06)', border: 'none',
                                borderRadius: 99, width: 24, height: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#AEAEB2', padding: 0, flexShrink: 0,
                            }}
                        >
                            <X size={13} />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedCount / 3) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                            style={{ height: '100%', borderRadius: 99, background: allDone ? '#30D158' : '#007AFF' }}
                        />
                    </div>

                    {/* Task list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {CHECKLIST_TASKS.map(({ key, label, done }) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: 99, flexShrink: 0,
                                    background: done ? '#30D158' : 'transparent',
                                    border: done ? 'none' : '1.5px solid #D1D1D6',
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
                                    fontSize: 13, fontWeight: done ? 500 : 600,
                                    color: done ? '#AEAEB2' : '#1D1D1F',
                                    textDecoration: done ? 'line-through' : 'none',
                                    transition: 'color 0.2s', flex: 1,
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

// ─── Anniversary Toast — shown once per year on membership anniversary ────────
export function AnniversaryToast() {
    const { user, userDoc, firstName, tierColor } = useAuth();
    const [show, setShow] = useState(false);
    const [years, setYears] = useState(0);

    useEffect(() => {
        if (!userDoc?.createdAt || !user?.uid) return;
        const created = userDoc.createdAt.toDate ? userDoc.createdAt.toDate() : new Date(userDoc.createdAt);
        const today   = new Date();
        const yearsElapsed = today.getFullYear() - created.getFullYear();
        const sameDay = created.getDate() === today.getDate() && created.getMonth() === today.getMonth();
        if (sameDay && yearsElapsed >= 1) {
            const key = `nc_anniversary_${user.uid}_${today.getFullYear()}`;
            if (!localStorage.getItem(key)) {
                setYears(yearsElapsed);
                setTimeout(() => setShow(true), 3500);
                localStorage.setItem(key, '1');
            }
        }
    }, [userDoc, user]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div key="anniversary"
                    initial={{ opacity: 0, y: 80, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    style={{
                        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                        zIndex: 9998, minWidth: 320, maxWidth: 460,
                        ...glass, borderRadius: 20, padding: '18px 22px',
                        display: 'flex', alignItems: 'center', gap: 16,
                        direction: 'rtl', fontFamily: 'Heebo, sans-serif',
                        border: `1.5px solid ${tierColor}40`,
                    }}>
                    <motion.span
                        animate={{ rotate: [0, -10, 10, -6, 0] }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                        style={{ fontSize: 34, flexShrink: 0 }}>🎂</motion.span>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1F', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
                            יום הולדת לחברות, {firstName}! 🎉
                        </p>
                        <p style={{ fontSize: 12, color: '#6E6E73', fontWeight: 600, margin: 0 }}>
                            {years === 1 ? 'שנה שלמה' : `${years} שנים`} ב-NextClass — תודה שאתה איתנו
                        </p>
                    </div>
                    <button onClick={() => setShow(false)}
                        style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: '#AEAEB2', flexShrink: 0, display: 'flex' }}>
                        <X size={15} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Quote Status Watcher — real-time push to user when admin updates ──────────
export function QuoteStatusWatcher() {
    const { user } = useAuth();
    const [notif, setNotif] = useState(null);

    const STATUS_CONFIG = {
        'ביצירת קשר': { msg: 'אנחנו בתהליך יצירת קשר בנוגע לבקשתך', color: '#FF9500', icon: '📞' },
        'הוצע מחיר':  { msg: 'הצעת מחיר נשלחה — בדוק את תיבת המייל', color: '#5856D6', icon: '📋' },
        'במשא ומתן':  { msg: 'בקשתך בשלב משא ומתן פעיל',              color: '#007AFF', icon: '🤝' },
        'נסגר':       { msg: 'עסקה נסגרה בהצלחה!',                     color: '#30D158', icon: '✅' },
        'אבד':        { msg: 'בקשת המחיר לא הצליחה להתקדם',            color: '#AEAEB2', icon: '❌' },
    };

    useEffect(() => {
        if (!user?.email) return;
        const known = new Map();
        let initialized = false;

        const q = query(collection(db, 'quotes'), where('email', '==', user.email));
        const unsub = onSnapshot(q, snap => {
            if (!initialized) {
                snap.docs.forEach(d => known.set(d.id, d.data().status));
                initialized = true;
                return;
            }
            snap.docChanges().forEach(change => {
                if (change.type === 'modified') {
                    const data = change.doc.data();
                    const prev = known.get(change.doc.id);
                    if (prev && prev !== data.status && STATUS_CONFIG[data.status]) {
                        setNotif({ id: change.doc.id, status: data.status });
                        setTimeout(() => setNotif(null), 6000);
                    }
                    known.set(change.doc.id, data.status);
                } else if (change.type === 'added') {
                    known.set(change.doc.id, change.doc.data().status);
                }
            });
        });
        return unsub;
    }, [user?.email]);

    if (!notif) return null;
    const cfg = STATUS_CONFIG[notif.status];

    return (
        <AnimatePresence>
            <motion.div key="quote-notif"
                initial={{ opacity: 0, x: 120 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 120 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                style={{
                    position: 'fixed', bottom: 28, left: 20,
                    zIndex: 9998, maxWidth: 320,
                    ...glass, borderRadius: 18, padding: '14px 18px',
                    borderRight: `4px solid ${cfg.color}`,
                    fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8E8E93', margin: '0 0 4px' }}>
                    {cfg.icon} עדכון בקשת מחיר · {notif.id}
                </p>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>{cfg.msg}</p>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Default export — render all personalization layers ───────────────────────
export default function PersonalizationLayer() {
    return (
        <>
            <QuoteStatusWatcher />
        </>
    );
}
