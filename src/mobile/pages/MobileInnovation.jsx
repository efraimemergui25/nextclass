import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, Quote, ArrowLeft, Award, TrendingUp, Building2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ─── Hardcoded success stories ────────────────────────────────────────────────
const STORIES = [
    {
        id: 1,
        institution: 'בית ספר גבעתיים',
        category: 'חינוך יסודי',
        quote: 'הטמענו את מערכת הלמידה האינטראקטיבית של NextClass והתוצאות היו מיידיות — רמת המעורבות של התלמידים עלתה בצורה דרמטית.',
        rating: 5,
        year: 2025,
        accent: '#007AFF',
        gradientFrom: 'rgba(0,122,255,0.12)',
        gradientTo: 'rgba(0,122,255,0.04)',
        initials: 'בג',
    },
    {
        id: 2,
        institution: 'מוסד תל אביב',
        category: 'תיכון',
        quote: 'הפתרונות של NextClass עזרו לנו לייצר סביבת למידה היברידית מושלמת. המורים עברו הכשרה תוך יום אחד וכבר מהשבוע הראשון ראינו שינוי.',
        rating: 5,
        year: 2025,
        accent: '#BF5AF2',
        gradientFrom: 'rgba(191,90,242,0.12)',
        gradientTo: 'rgba(191,90,242,0.04)',
        initials: 'מת',
    },
    {
        id: 3,
        institution: 'אוניברסיטת חיפה',
        category: 'השכלה גבוהה',
        quote: 'שדרגנו את כלל אולמות ההרצאה עם ציוד NextClass. האיכות הטכנית והשירות לאחר המכירה הם ברמה שלא מצאנו בשום מקום אחר.',
        rating: 5,
        year: 2024,
        accent: '#30D158',
        gradientFrom: 'rgba(48,209,88,0.12)',
        gradientTo: 'rgba(48,209,88,0.04)',
        initials: 'אח',
    },
    {
        id: 4,
        institution: 'בית ספר רמת גן',
        category: 'חינוך יסודי',
        quote: 'אחרי שנים של חיפוש אחר פתרון מתאים, מצאנו ב-NextClass שותף אמיתי. הילדים פשוט אוהבים את הטכנולוגיה ורוצים לבוא לבית הספר.',
        rating: 5,
        year: 2024,
        accent: '#FF9F0A',
        gradientFrom: 'rgba(255,159,10,0.12)',
        gradientTo: 'rgba(255,159,10,0.04)',
        initials: 'רג',
    },
    {
        id: 5,
        institution: 'מכללת ירושלים',
        category: 'השכלה גבוהה',
        quote: 'שיתוף הפעולה עם NextClass פתח לנו עולם חדש של חינוך טכנולוגי. הסטודנטים שלנו מוכנים טוב יותר לשוק העבודה.',
        rating: 5,
        year: 2025,
        accent: '#FF375F',
        gradientFrom: 'rgba(255,55,95,0.12)',
        gradientTo: 'rgba(255,55,95,0.04)',
        initials: 'מי',
    },
];

// STATS derived in component from getSetting

// ─── Star row ────────────────────────────────────────────────────────────────
function StarRow({ count = 5 }) {
    return (
        <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: count }).map((_, i) => (
                <Star key={i} size={13} fill="#FF9F0A" color="#FF9F0A" strokeWidth={0} />
            ))}
        </div>
    );
}

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

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ stat, c, delay }) {
    const { Icon, value, label, accent } = stat;
    return (
        <BlurFade delay={delay}>
            <div style={{
                background: c.surface,
                borderRadius: 18,
                padding: '16px 14px',
                boxShadow: c.cardShadow,
                textAlign: 'center',
                border: `0.5px solid ${c.border}`,
                flex: 1,
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${accent}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px',
                }}>
                    <Icon size={20} color={accent} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {value}
                </p>
                <p style={{ fontSize: 11, color: c.text3, fontWeight: 600, marginTop: 4 }}>{label}</p>
            </div>
        </BlurFade>
    );
}

// ─── Story card ──────────────────────────────────────────────────────────────
function StoryCard({ story, c, delay, isDark }) {
    const { institution, category, quote, rating, year, accent, gradientFrom, gradientTo, initials } = story;
    return (
        <BlurFade delay={delay}>
            <div style={{
                borderRadius: 22,
                overflow: 'hidden',
                position: 'relative',
                background: isDark
                    ? `linear-gradient(145deg, ${gradientFrom.replace('0.12', '0.18')}, ${c.surface})`
                    : `linear-gradient(145deg, ${gradientFrom}, ${gradientTo}, ${c.surface})`,
                border: `0.5px solid ${accent}30`,
                boxShadow: isDark
                    ? `0 4px 24px rgba(0,0,0,0.28), inset 0 0.5px 0 rgba(255,255,255,0.05)`
                    : `0 2px 16px rgba(0,0,0,0.06), inset 0 0.5px 0 rgba(255,255,255,0.8)`,
                padding: '20px 18px',
                marginBottom: 0,
            }}>
                {/* Glass sheen overlay */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
                    pointerEvents: 'none',
                }} />

                {/* Quote icon */}
                <div style={{
                    position: 'absolute', top: 16, left: 16,
                    opacity: 0.12,
                }}>
                    <Quote size={48} color={accent} strokeWidth={1.5} />
                </div>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    {/* Avatar circle */}
                    <div style={{
                        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 14px ${accent}40`,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                            {initials}
                        </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 15, fontWeight: 800, color: c.text,
                            letterSpacing: '-0.02em', marginBottom: 3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {institution}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: accent,
                                background: `${accent}14`, padding: '2px 8px',
                                borderRadius: 99, letterSpacing: '0.02em',
                            }}>
                                {category}
                            </span>
                            <span style={{ fontSize: 11, color: c.text4, fontWeight: 500 }}>{year}</span>
                        </div>
                    </div>
                </div>

                {/* Stars */}
                <StarRow count={rating} />

                {/* Quote text */}
                <p style={{
                    fontSize: 14, color: c.text2, lineHeight: 1.65,
                    marginTop: 10, fontWeight: 400,
                }}>
                    {quote}
                </p>
            </div>
        </BlurFade>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MobileInnovation() {
    const navigate = useNavigate();
    const { colors: c, isDark } = useTheme();
    const { getSetting } = useSettings();

    const stat1Val   = getSetting('about_stat1_val', '1200');
    const stat1Label = getSetting('about_stat1_label', 'מוסדות חינוך');
    const stat2Val   = getSetting('about_stat3_val', '98');
    const stat2Label = getSetting('about_stat3_label', '% שביעות רצון');
    const stat3Val   = getSetting('about_stat2_val', '14');
    const stat3Label = getSetting('about_stat2_label', 'שנות ניסיון');

    const STATS = [
        { Icon: Building2,  value: stat1Val,  label: stat1Label, accent: '#007AFF' },
        { Icon: TrendingUp, value: `${stat2Val}%`, label: stat2Label, accent: '#30D158' },
        { Icon: Award,      value: stat3Val,  label: stat3Label, accent: '#FF9F0A' },
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
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 260, height: 260, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(48,209,88,0.06) 0%, transparent 65%)',
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
                            מוסדות חינוך מובילים בישראל בוחרים ב-NextClass כדי להוביל את המהפכה הטכנולוגית בכיתות.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* ── Stats row ──────────────────────────────────────────── */}
            <div style={{ padding: '20px 16px 0' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    {STATS.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} c={c} delay={0.06 + i * 0.06} />
                    ))}
                </div>
            </div>

            {/* ── Section title ──────────────────────────────────────── */}
            <BlurFade delay={0.18}>
                <div style={{ padding: '28px 16px 16px' }}>
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
                            סיפורי הצלחה
                        </h2>
                    </div>
                    <p style={{ fontSize: 13, color: c.text3, paddingRight: 14, lineHeight: 1.4 }}>
                        מה מוסדות חינוך אומרים עלינו
                    </p>
                </div>
            </BlurFade>

            {/* ── Story cards ────────────────────────────────────────── */}
            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {STORIES.map((story, i) => (
                    <StoryCard
                        key={story.id}
                        story={story}
                        c={c}
                        isDark={isDark}
                        delay={0.04 * i}
                    />
                ))}
            </div>

            {/* ── Trust strip ────────────────────────────────────────── */}
            <BlurFade delay={0.1}>
                <div style={{ margin: '24px 16px 0' }}>
                    <div style={{
                        background: c.surface, borderRadius: 20,
                        overflow: 'hidden', boxShadow: c.cardShadow,
                        border: `0.5px solid ${c.border}`,
                    }}>
                        {[
                            { label: 'ממוצע דירוג לקוחות', value: '4.9 / 5', accent: '#FF9F0A' },
                            { label: 'מוסדות מרוצים', value: `${stat1Val}+`, accent: '#30D158' },
                            { label: 'שנות פעילות', value: `${stat3Val} שנה`, accent: '#007AFF' },
                        ].map(({ label, value, accent }, i, arr) => (
                            <div
                                key={label}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '15px 18px',
                                    borderBottom: i < arr.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                }}
                            >
                                <span style={{ fontSize: 15, fontWeight: 800, color: accent, letterSpacing: '-0.02em' }}>
                                    {value}
                                </span>
                                <span style={{ fontSize: 13, color: c.text3, fontWeight: 500 }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </BlurFade>

            {/* ── CTA section ────────────────────────────────────────── */}
            <BlurFade delay={0.14}>
                <div style={{ margin: '20px 16px 0' }}>
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
                            NEXTCLASS · הצטרף אלינו
                        </p>
                        <h3 style={{
                            fontSize: 24, fontWeight: 900, color: '#fff',
                            letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 10,
                        }}>
                            רוצה להפוך לסיפור ההצלחה הבא?
                        </h3>
                        <p style={{
                            fontSize: 13, color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.55, marginBottom: 22,
                        }}>
                            צור קשר עם הצוות שלנו ונבנה יחד את הפתרון המושלם עבור המוסד שלך.
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
