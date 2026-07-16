import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Monitor, Headset, ShieldCheck, Handshake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ─── BlurFade wrapper ────────────────────────────────────────────────────────
function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-24px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

// ─── Feature card (honest value — no fabricated metrics) ─────────────────────
function FeatureCard({ Icon, title, desc, accent, c, delay }) {
    return (
        <BlurFade delay={delay}>
            <div style={{
                background: c.surface,
                borderRadius: 18,
                padding: '18px 16px',
                boxShadow: c.cardShadow,
                border: `0.5px solid ${c.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
            }}>
                <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: `${accent}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={22} color={accent} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', marginBottom: 4 }}>
                        {title}
                    </p>
                    <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5 }}>{desc}</p>
                </div>
            </div>
        </BlurFade>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MobileInnovation() {
    const navigate = useNavigate();
    const { colors: c, isDark } = useTheme();
    const { getSetting } = useSettings();

    const partner = getSetting('partner_name', 'עמל');

    const FEATURES = [
        { Icon: Monitor,     accent: '#007AFF', title: 'מסכים אינטראקטיביים', desc: 'טכנולוגיית תצוגה מתקדמת שהופכת כל שיעור לחוויה משתפת ומדויקת.' },
        { Icon: Headset,     accent: '#30D158', title: 'ייעוץ ושירות ישיר',   desc: 'ליווי מקצועי מהאפיון ועד ההתקנה — בלי מתווכים, בלי המתנה.' },
        { Icon: ShieldCheck, accent: '#FF9F0A', title: 'איכות ללא פשרות',      desc: 'ציוד שנבחר בקפידה, עם אחריות ותמיכה מלאה לאורך כל הדרך.' },
    ];

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100dvh', background: c.bg, paddingBottom: 40 }}>

            {/* ── Hero section ───────────────────────────────────────── */}
            <div style={{ padding: '14px 16px 0' }}>
                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        borderRadius: 24, overflow: 'hidden',
                        background: isDark
                            ? 'linear-gradient(145deg, #0a1628 0%, #0d2347 45%, #0f3460 100%)'
                            : 'linear-gradient(145deg, #007AFF 0%, #5856D6 60%, #BF5AF2 100%)',
                        padding: '28px 22px 26px',
                        position: 'relative',
                        boxShadow: isDark
                            ? '0 8px 40px rgba(0,0,0,0.24)'
                            : '0 8px 40px rgba(0,122,255,0.30)',
                    }}
                >
                    {/* Background glows */}
                    <div style={{
                        position: 'absolute', top: -50, right: -50,
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,122,255,0.30) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -60, left: -30,
                        width: 180, height: 180, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(191,90,242,0.22) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Label pill */}
                    <div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(0,122,255,0.18)', color: '#64D2FF',
                            fontSize: 11, fontWeight: 700, padding: '4px 12px',
                            borderRadius: 99, marginBottom: 14, letterSpacing: '0.05em',
                        }}>
                            <Award size={11} strokeWidth={2.5} />
                            NEXTCLASS · חדשנות בחינוך
                        </div>
                        <h1 style={{
                            fontSize: 30, fontWeight: 900, color: '#fff',
                            letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: 12,
                        }}>
                            חדשנות בחינוך
                        </h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55, marginBottom: 0 }}>
                            טכנולוגיה מהדרגה הראשונה לכיתה — עם ליווי מקצועי, שירות ישיר ואיכות שלא מתפשרת.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ── Partnership highlight (real: עמל) ──────────────────── */}
            <BlurFade delay={0.08}>
                <div style={{ padding: '18px 16px 0' }}>
                    <div style={{
                        background: c.surface, borderRadius: 20,
                        padding: '18px 18px', boxShadow: c.cardShadow,
                        border: `0.5px solid ${c.border}`,
                        display: 'flex', alignItems: 'center', gap: 14,
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 14px rgba(0,122,255,0.30)',
                        }}>
                            <Handshake size={24} color="#fff" strokeWidth={1.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 3 }}>
                                שותפות
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                                גאים לשתף פעולה עם רשת {partner}
                            </p>
                        </div>
                    </div>
                </div>
            </BlurFade>

            {/* ── Section title ──────────────────────────────────────── */}
            <BlurFade delay={0.12}>
                <div style={{ padding: '26px 16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 4, height: 22, borderRadius: 99,
                            background: 'linear-gradient(180deg, #007AFF, #BF5AF2)',
                            flexShrink: 0,
                        }} />
                        <h2 style={{
                            fontSize: 22, fontWeight: 900, color: '#007AFF',
                            letterSpacing: '-0.04em',
                        }}>
                            מה מייחד אותנו
                        </h2>
                    </div>
                    <p style={{ fontSize: 13, color: c.text3, paddingRight: 14, lineHeight: 1.4 }}>
                        הסטנדרט שאנחנו מציבים לכל כיתה
                    </p>
                </div>
            </BlurFade>

            {/* ── Feature cards ──────────────────────────────────────── */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FEATURES.map((f, i) => (
                    <FeatureCard key={f.title} {...f} c={c} delay={0.04 * i} />
                ))}
            </div>

            {/* ── CTA section ────────────────────────────────────────── */}
            <BlurFade delay={0.14}>
                <div style={{ margin: '24px 16px 0' }}>
                    <div style={{
                        borderRadius: 22, overflow: 'hidden',
                        position: 'relative',
                        background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 60%, #30D158 130%)',
                        padding: '26px 22px',
                        boxShadow: '0 8px 36px rgba(88,86,214,0.3)',
                    }}>
                        {/* Glass shimmer line */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                            background: 'rgba(255,255,255,0.28)',
                            pointerEvents: 'none',
                        }} />
                        {/* Glow orb */}
                        <div style={{
                            position: 'absolute', bottom: -40, left: -30,
                            width: 160, height: 160, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        <p style={{
                            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                            letterSpacing: '0.08em', marginBottom: 8,
                        }}>
                            NEXTCLASS · הצטרפו אלינו
                        </p>
                        <h3 style={{
                            fontSize: 24, fontWeight: 900, color: '#fff',
                            letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 10,
                        }}>
                            רוצים להביא את הטכנולוגיה הזו לכיתה שלכם?
                        </h3>
                        <p style={{
                            fontSize: 13, color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.55, marginBottom: 22,
                        }}>
                            צרו קשר עם הצוות שלנו ונבנה יחד את הפתרון המושלם עבור המוסד שלכם.
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <motion.button
                                whileTap={{ scale: 0.93 }}
                                onClick={() => { haptic('medium'); navigate('/contact'); }}
                                style={{
                                    flex: 1, height: 50, borderRadius: 14,
                                    background: '#fff', color: '#007AFF',
                                    border: 'none', fontSize: 15, fontWeight: 800,
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    fontFamily: SF, letterSpacing: '-0.02em',
                                }}
                            >
                                צור קשר עכשיו
                                <ArrowLeft size={15} strokeWidth={2.5} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.93 }}
                                onClick={() => { haptic('light'); navigate('/catalog'); }}
                                style={{
                                    height: 50, paddingInline: 18, borderRadius: 14,
                                    background: 'rgba(255,255,255,0.14)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.24)',
                                    fontSize: 14, fontWeight: 700,
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    fontFamily: SF, letterSpacing: '-0.02em',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                הקטלוג
                            </motion.button>
                        </div>
                    </div>
                </div>
            </BlurFade>

            {/* ── Mini footer ────────────────────────────────────────── */}
            <div style={{ marginTop: 24, textAlign: 'center', padding: '0 16px' }}>
                <p style={{ fontSize: 11, color: c.text4, fontWeight: 500 }}>
                    © 2026 NextClass · כל הזכויות שמורות
                </p>
            </div>
        </div>
    );
}
