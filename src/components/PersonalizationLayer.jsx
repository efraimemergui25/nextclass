import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

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
            </span>
        </motion.div>
    );
}

// ─── Combined export — render all personalization in App ─────────────────────
export default function PersonalizationLayer() {
    return (
        <>
            <WelcomeToast />
            <FirstLoginCelebration />
        </>
    );
}
