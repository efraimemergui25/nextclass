import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ChevronDown, Sparkles, ShieldCheck, Zap, Users,
    MessageSquare, Phone, Check, Compass, Calendar,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';

const EASE = [0.22, 1, 0.36, 1];

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 1800) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-15% 0px' });
    useEffect(() => {
        if (!inView) return;
        let frame;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const p = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * target));
            if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, target, duration]);
    return { count, ref };
}

// ─── Stat counter card ────────────────────────────────────────────────────────
function StatCard({ value, suffix = '', label, desc, delay = 0 }) {
    const { count, ref } = useCounter(value);
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: EASE }}
            className="text-center px-6 py-8 rounded-[2rem] relative overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
            }}
        >
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.06) 0%, transparent 70%)' }}
            />
            <p className="text-[48px] md:text-[56px] font-black text-[#1D1D1F] leading-none tracking-[-0.04em] mb-1"
                style={{ fontVariantNumeric: 'tabular-nums', direction: 'ltr', unicodeBidi: 'embed' }}>
                {count.toLocaleString()}{suffix}
            </p>
            <p className="text-[15px] font-black text-[#1D1D1F] mb-1.5">{label}</p>
            <p className="text-[12px] text-[#86868B] font-medium leading-snug">{desc}</p>
        </motion.div>
    );
}

// ─── Manifesto word-reveal ─────────────────────────────────────────────────────
function ManifestoReveal({ text, className = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-15% 0px' });
    const words = text.split(' ');
    return (
        <div ref={ref} className={`flex flex-wrap justify-center gap-x-[0.4em] gap-y-[0.1em] ${className}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 28, filter: 'blur(4px)' }}
                    animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
                    className="inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </div>
    );
}

// ─── Horizontal marquee ────────────────────────────────────────────────────────
function Marquee({ items, speed = 40, reverse = false }) {
    const dir = reverse ? 1 : -1;
    return (
        <div className="overflow-hidden select-none">
            <motion.div
                animate={{ x: [`${dir > 0 ? '-50%' : '0%'}`, `${dir > 0 ? '0%' : '-50%'}`] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
                className="inline-flex gap-10 whitespace-nowrap"
            >
                {[0, 1].map(n => (
                    <span key={n} className="inline-flex gap-10">
                        {items.map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-3 text-white/30 text-[13px] font-black tracking-widest uppercase">
                                <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                                {item}
                            </span>
                        ))}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}

// ─── Section reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, distance = 24, className = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-10% 0px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: distance }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: EASE }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ─── Approach card ─────────────────────────────────────────────────────────────
function ApproachCard({ icon: Icon, title, desc, delay = 0 }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay, ease: EASE }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative rounded-[1.75rem] p-6 text-right cursor-default overflow-hidden"
            style={{
                background: hovered ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                border: hovered ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.08)',
                transition: 'background 0.25s, border-color 0.25s',
            }}
        >
            <div
                className="absolute inset-0 opacity-0 transition-opacity duration-400"
                style={{
                    background: 'radial-gradient(circle at 80% 20%, rgba(0,122,255,0.12) 0%, transparent 60%)',
                    opacity: hovered ? 1 : 0,
                }}
            />
            <div className="relative z-10">
                <motion.div
                    animate={{ scale: hovered ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 ml-auto"
                    style={{ background: 'rgba(0,122,255,0.16)', border: '1px solid rgba(0,122,255,0.25)' }}
                >
                    <Icon size={18} className="text-[#007AFF]" />
                </motion.div>
                <p className="text-[15px] font-black text-white mb-1.5 leading-snug">{title}</p>
                <p className="text-[13px] text-white/50 font-medium leading-relaxed">{desc}</p>
            </div>
        </motion.div>
    );
}

// ─── Value pillar card ─────────────────────────────────────────────────────────
function PillarCard({ icon: Icon, title, desc, tag, accent, delay = 0 }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay, ease: EASE }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative rounded-[2rem] p-8 text-right overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.9)',
                border: `1px solid ${hovered ? accent + '40' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: hovered ? `0 20px 60px ${accent}18` : '0 4px 24px rgba(0,0,0,0.04)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
        >
            <div
                className="absolute inset-0 rounded-[2rem] transition-opacity duration-500"
                style={{
                    background: `radial-gradient(circle at 90% 10%, ${accent}10 0%, transparent 60%)`,
                    opacity: hovered ? 1 : 0,
                }}
            />
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                    <span
                        className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full"
                        style={{ background: `${accent}14`, color: accent }}
                    >
                        {tag}
                    </span>
                    <motion.div
                        animate={{ scale: hovered ? 1.08 : 1, rotate: hovered ? -5 : 0 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${accent}12`, border: `1px solid ${accent}22` }}
                    >
                        <Icon size={22} style={{ color: accent }} strokeWidth={1.8} />
                    </motion.div>
                </div>
                <h3 className="text-[22px] font-black text-[#1D1D1F] mb-2.5 leading-tight tracking-[-0.03em]">{title}</h3>
                <p className="text-[14px] text-[#86868B] leading-relaxed font-medium">{desc}</p>
            </div>
        </motion.div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const AboutPage = () => {
    const { getSetting } = useSettings();

    const c = useMemo(() => ({
        heroTitle:    getSetting('about_hero_title',   'הטכנולוגיה\nשחינוך ראוי לה.'),
        heroSub:      getSetting('about_hero_sub',     'מקצועי. מהיר. אישי. ישיר.'),
        heroImg:      getSetting('about_hero_img',     '') || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=85&w=2400',
        storyBody:    getSetting('about_story_body',   'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם, ציוד שמגיע שבועות מאוחר, ושירות שנגמר ברגע שהחשבונית נחתמה. החלטתי לשנות את המשוואה. NextClass הוא לא פלטפורמה ולא קטלוג — הוא מודל עסקי אחר לגמרי: שירות ישיר, אנושי ומקצועי שמוריד את כל הביניים, ומביא לחינוך הישראלי את הרמה שהוא ראוי לה.'),
        founderMsg:   getSetting('about_founder_message', 'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו: ישירות, מהירות, ורמה שלא מתפשרת. כל שיחה, כל הצעת מחיר, כל אספקה — כולם עוברים דרכי.'),
        founderName:  getSetting('about_founder_name',   'אפרים אמרגי'),
        founderRole:  getSetting('about_founder_role',   'מייסד, NextClass'),
        v1Title:      getSetting('about_v1_title', 'מחיר שקוף'),
        v1Desc:       getSetting('about_v1_desc',  'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — נקודה. שקיפות מלאה מהשקל הראשון ועד האחרון.'),
        v2Title:      getSetting('about_v2_title', 'מהירות בלתי מתפשרת'),
        v2Desc:       getSetting('about_v2_desc',  'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות. מהירות היא לא בונוס. היא חלק בלתי נפרד מהרמה.'),
        v3Title:      getSetting('about_v3_title', 'מקצועיות בכל פרט'),
        v3Desc:       getSetting('about_v3_desc',  'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה ממה שהלקוח היה מבקש — כי זה הרף שאנחנו מסרבים לרדת ממנו.'),
        ctaTitle:     getSetting('about_cta_title', 'שאלו אותנו.\nנגיע עם תשובות.'),
        ctaDesc:      getSetting('about_cta_desc',  'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.'),
    }), [getSetting]);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
    const heroScale   = useTransform(useSpring(scrollYProgress, { stiffness: 70, damping: 25 }), [0, 0.12], [1, 1.08]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.09], [1, 0]);
    const heroY       = useTransform(scrollYProgress, [0, 0.12], [0, 60]);

    const MARQUEE_ITEMS = [
        'אנחנו לא ספק', 'אנחנו שינוי', 'חינוך ישראלי', 'הדרגה שראויה', 'מהירות ומקצועיות',
        'שקיפות מלאה', 'שירות ישיר', 'ללא ביניים', 'כל כיתה חשובה', 'NextClass',
    ];

    const APPROACH_CARDS = [
        { icon: MessageSquare, title: 'קודם שומעים', desc: 'לפני כל המלצה — שיחה אמיתית שמבינה את הצורך, ההקשר, ומה שכבר קיים.', delay: 0 },
        { icon: Compass,       title: 'ממליצים נכון', desc: 'מציעים את מה שמתאים — לא את מה שהכי יקר. פתרון שעובד, לא ציוד שמרשים.', delay: 0.07 },
        { icon: Calendar,      title: 'מגיעים בזמן',  desc: 'ביום שסוכם — תמיד, ללא עיכובים. אם אמרנו יום ג׳ — ביום ג׳ אנחנו שם.', delay: 0.14 },
        { icon: Phone,         title: 'עונים מיד',    desc: 'מענה ישיר ומהיר — בלי תורים, בלי המתנה. שיחה, הודעה — ניתן תשובה.', delay: 0.21 },
    ];

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#F5F5F7] w-full overflow-x-hidden" dir="rtl">

                {/* ══════════════════════════════════════════════
                    1. HERO — CINEMATIC FULL SCREEN
                ══════════════════════════════════════════════ */}
                <section className="relative h-screen min-h-[640px] max-h-[1000px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                    <motion.div style={{ scale: heroScale, y: heroY }} className="absolute inset-0 z-0">
                        <div className="absolute inset-0 z-10"
                            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.55) 50%, #0A0A0A 100%)' }} />
                        <img
                            src={c.heroImg}
                            className="w-full h-full object-cover"
                            alt=""
                            loading="eager"
                        />
                    </motion.div>

                    {/* Floating stat badges */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {[
                            { label: 'שירות ישיר ואישי',   top: '22%', right: '8%',  delay: 0.9  },
                            { label: 'מחיר שקוף',           top: '32%', left: '7%',   delay: 1.05 },
                            { label: 'עמידה בלוחות זמנים',  bottom: '30%', right: '9%', delay: 1.2 },
                        ].map(({ label, top, right, left, bottom, delay }) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, scale: 0.7, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay, duration: 0.6, ease: EASE }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-black text-white"
                                style={{
                                    position: 'absolute', top, right, left, bottom,
                                    background: 'rgba(255,255,255,0.10)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                                {label}
                            </motion.div>
                        ))}
                    </div>

                    {/* Hero text */}
                    <motion.div style={{ opacity: heroOpacity }} className="relative z-30 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.7 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                            style={{ background: 'rgba(0,122,255,0.18)', border: '1px solid rgba(0,122,255,0.35)' }}
                        >
                            <Sparkles size={11} className="text-[#007AFF]" />
                            <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase">הסיפור שלנו</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.9, ease: EASE }}
                            className="text-[clamp(54px,10vw,110px)] font-black text-white leading-[0.92] mb-7"
                            style={{ letterSpacing: '-0.05em', fontFamily: `-apple-system, 'SF Pro Display', Heebo, sans-serif` }}
                        >
                            {c.heroTitle.split('\n').map((line, i) => (
                                <span key={i} className={`block ${i === 1 ? 'text-white/40' : ''}`}>{line}</span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.7 }}
                            className="text-[18px] md:text-[21px] text-white/55 font-medium mb-10 tracking-[-0.01em]"
                        >
                            {c.heroSub}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            className="flex flex-wrap justify-center gap-3"
                        >
                            <Link to="/catalog"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-[#1D1D1F] hover:scale-105 transition-transform"
                                style={{ background: '#FFFFFF', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
                                לקטלוג המוצרים <ArrowLeft size={14} />
                            </Link>
                            <Link to="/contact"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-white transition-all hover:bg-white/15"
                                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.20)' }}>
                                דברו איתנו
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Scroll hint */}
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                        className="absolute bottom-8 flex flex-col items-center gap-2 text-white/30 z-30"
                    >
                        <span className="text-[9px] font-black tracking-widest uppercase">גלה את הסיפור</span>
                        <ChevronDown size={15} />
                    </motion.div>
                </section>


                {/* ══════════════════════════════════════════════
                    2. MARQUEE TICKER — pitch-black strip
                ══════════════════════════════════════════════ */}
                <div className="bg-[#0A0A0A] py-4 overflow-hidden border-y border-white/[0.04]">
                    <Marquee items={MARQUEE_ITEMS} speed={45} />
                </div>


                {/* ══════════════════════════════════════════════
                    3. BIG STATEMENT — dark manifesto
                ══════════════════════════════════════════════ */}
                <section className="bg-[#0A0A0A] py-28 md:py-36 px-6 overflow-hidden">
                    <div className="max-w-4xl mx-auto text-center">
                        <Reveal delay={0}>
                            <p className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase mb-10">
                                המניפסט שלנו
                            </p>
                        </Reveal>
                        <ManifestoReveal
                            text="אנחנו מאמינים שכל ילד ראוי לכיתה שמעוררת השראה. שכל מורה ראויה לכלים שמאפשרים לה לשנות חיים. ושחינוך ישראלי לא צריך להתפשר על הרמה הגבוהה ביותר."
                            className="text-[clamp(24px,4.5vw,48px)] font-black text-white leading-[1.25] tracking-[-0.03em]"
                        />
                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
                            className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-16 origin-center"
                        />
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    4. IMPACT NUMBERS — animated counters
                ══════════════════════════════════════════════ */}
                <section className="bg-[#F5F5F7] py-20 md:py-28 px-6">
                    <div className="max-w-[1100px] mx-auto">
                        <Reveal className="text-center mb-14">
                            <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase block mb-4">
                                ההתחייבות שלנו
                            </span>
                            <h2 className="text-[clamp(32px,5vw,56px)] font-black text-[#1D1D1F] tracking-[-0.04em] leading-tight">
                                סטנדרט שאפשר למדוד.
                            </h2>
                        </Reveal>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard value={24}  suffix="ש׳"   label="זמן מענה מרבי"     desc="לכל פנייה, כל ימות השבוע"    delay={0}    />
                            <StatCard value={100} suffix="%"    label="עמידה בלוחות זמנים" desc="ביום שסוכם — תמיד"          delay={0.08} />
                            <StatCard value={14}  suffix=" יום" label="החלפה ללא שאלות"   desc="מדיניות החזרה פשוטה ומהירה"  delay={0.16} />
                            <StatCard value={0}   suffix=" ₪"   label="עלות ייעוץ ראשוני" desc="אפיון מקצועי, ללא התחייבות"  delay={0.24} />
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    5. THE STORY — split layout with timeline
                ══════════════════════════════════════════════ */}
                <section className="bg-white overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[580px]">

                        {/* Image col */}
                        <motion.div
                            initial={{ opacity: 0, scale: 1.04 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: EASE }}
                            className="relative order-1 lg:order-2 min-h-[320px] lg:min-h-0"
                        >
                            <img
                                src="/assets/modern_classroom_israel_1777475880301.png"
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="כיתה חכמה NextClass"
                                loading="lazy"
                                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1200'; }}
                            />
                            <div className="absolute inset-0 lg:bg-gradient-to-l from-transparent via-transparent to-white/0" />

                            {/* Floating quote card over image */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, y: 20 }}
                                whileInView={{ opacity: 1, x: 0, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.65, ease: EASE }}
                                className="absolute bottom-8 right-6 max-w-[240px] p-5 rounded-2xl"
                                style={{
                                    background: 'rgba(255,255,255,0.90)',
                                    backdropFilter: 'blur(24px)',
                                    border: '1px solid rgba(255,255,255,0.7)',
                                    boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                                }}
                                dir="rtl"
                            >
                                <p className="text-[13px] font-black text-[#1D1D1F] leading-snug mb-2">
                                    "השינוי מתחיל כשמישהו מחליט לעשות אחרת."
                                </p>
                                <p className="text-[10px] text-[#86868B] font-bold">{c.founderName} · מייסד NextClass</p>
                            </motion.div>
                        </motion.div>

                        {/* Text col */}
                        <motion.div
                            initial={{ opacity: 0, x: 28 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: EASE }}
                            className="flex flex-col justify-center text-right px-8 md:px-14 lg:px-16 py-16 lg:py-24 order-2 lg:order-1"
                        >
                            <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase block mb-5">הסיפור שלנו</span>

                            <h2 className="text-[clamp(30px,4vw,46px)] font-black text-[#1D1D1F] leading-[1.08] mb-6 tracking-[-0.04em]">
                                ראינו את הבעיה.
                                <span className="block text-[#AEAEB2]">בחרנו לפתור אותה.</span>
                            </h2>

                            <p className="text-[16px] md:text-[17px] text-[#3C3C43] font-medium leading-[1.82] mb-8">
                                {c.storyBody}
                            </p>

                            {/* Founding principles */}
                            <div className="space-y-3 border-t border-black/[0.06] pt-7">
                                {[
                                    { tag: 'ישיר', text: 'מודל שירות ישיר — בלי מתווכים, בלי ביניים. מי שמוכר הוא מי שמלווה.' },
                                    { tag: 'שקוף', text: 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים, מהשקל הראשון.' },
                                    { tag: 'מהיר', text: 'מענה תוך שעות ועמידה בלוחות הזמנים שהובטחו — בכל פרויקט.' },
                                ].map(({ tag, text }) => (
                                    <div key={tag} className="flex items-start gap-4">
                                        <span className="text-[11px] font-black text-[#007AFF] pt-0.5 w-10 shrink-0">{tag}</span>
                                        <span className="text-[13px] font-medium text-[#6E6E73] leading-snug">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    6. HOW WE WORK — dark section, approach cards
                ══════════════════════════════════════════════ */}
                <section className="bg-[#0F0F11] py-20 md:py-28 px-6">
                    <div className="max-w-[1100px] mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center mb-14">
                            <Reveal>
                                <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase block mb-5">הגישה שלנו</span>
                                <h2 className="text-[clamp(30px,4.5vw,54px)] font-black text-white leading-[1.0] tracking-[-0.04em]">
                                    קודם שואלים.
                                    <span className="block text-white/30">אחר כך מציעים.</span>
                                </h2>
                            </Reveal>
                            <Reveal delay={0.1}>
                                <p className="text-[16px] text-white/45 font-medium leading-relaxed">
                                    הרוב מוכרים. אנחנו מקשיבים. לפני כל המלצה מגיעה שיחה אמיתית שמבינה את הצורך, ההקשר, ומה שכבר קיים. רק מתוך הבנה כזו אפשר להציע משהו שבאמת עובד.
                                </p>
                            </Reveal>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {APPROACH_CARDS.map((card) => (
                                <ApproachCard key={card.title} {...card} />
                            ))}
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    7. THREE VALUE PILLARS — large bento cards
                ══════════════════════════════════════════════ */}
                <section className="bg-[#F5F5F7] py-20 md:py-28 px-6">
                    <div className="max-w-[1100px] mx-auto">
                        <Reveal className="text-right mb-12">
                            <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase block mb-5">שלושת הכללים</span>
                            <h2 className="text-[clamp(32px,5vw,60px)] font-black text-[#1D1D1F] leading-[1.0] tracking-[-0.04em]">
                                לאמינות אין
                                <span className="block" style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    קיצורי דרך.
                                </span>
                            </h2>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <PillarCard icon={ShieldCheck} title={c.v1Title} desc={c.v1Desc} tag="שקיפות" accent="#007AFF" delay={0} />
                            <PillarCard icon={Zap}         title={c.v2Title} desc={c.v2Desc} tag="מהירות"  accent="#5856D6" delay={0.08} />
                            <PillarCard icon={Users}       title={c.v3Title} desc={c.v3Desc} tag="מקצועיות" accent="#30D158" delay={0.16} />
                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    8. FOUNDER — intimate, personal, dark
                ══════════════════════════════════════════════ */}
                <section className="bg-[#0A0A0A] py-20 md:py-28 px-6 overflow-hidden relative">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06] pointer-events-none"
                        style={{ background: 'radial-gradient(circle, #007AFF 0%, transparent 70%)' }} />

                    <div className="max-w-[1100px] mx-auto relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                            {/* Image */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: EASE }}
                                className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden order-2 lg:order-1 max-w-[400px] mx-auto lg:mx-0"
                            >
                                <img
                                    src="/assets/visionary_founder_israel_1777475864564.png"
                                    className="w-full h-full object-cover"
                                    alt={c.founderName}
                                    loading="lazy"
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'; }}
                                />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.7) 0%, transparent 60%)' }} />
                                {/* Name overlay */}
                                <div className="absolute bottom-6 right-6 text-right">
                                    <p className="text-[16px] font-black text-white">{c.founderName}</p>
                                    <p className="text-[12px] text-white/55 font-medium">{c.founderRole}</p>
                                </div>
                            </motion.div>

                            {/* Text */}
                            <div className="text-right order-1 lg:order-2">
                                <Reveal>
                                    <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase block mb-5">מהמייסד ישירות אליך</span>
                                    <h2 className="text-[clamp(28px,3.8vw,46px)] font-black text-white leading-[1.08] mb-6 tracking-[-0.04em]">
                                        מקצועיות
                                        <span className="block text-white/30">ללא פשרות.</span>
                                    </h2>
                                    <p className="text-[16px] text-white/55 leading-[1.85] font-medium mb-8">
                                        {c.founderMsg}
                                    </p>

                                    {/* Commitments list */}
                                    <div className="space-y-3 mb-8">
                                        {[
                                            'כל שיחה עוברת דרכי אישית',
                                            'כל הצעת מחיר — מדויקת ועומדת בה',
                                            'כל אספקה — ביום שסוכם, ללא עיכוב',
                                        ].map(item => (
                                            <div key={item} className="flex items-center gap-3 justify-end">
                                                <span className="text-[14px] font-medium text-white/70">{item}</span>
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                                    style={{ background: 'rgba(48,209,88,0.15)', border: '1px solid rgba(48,209,88,0.3)' }}>
                                                    <Check size={11} className="text-[#30D158]" strokeWidth={3} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <a
                                        href={`https://wa.me/${getSetting('whatsapp_number','972585856356')}?text=היי אפרים, אשמח להתייעץ לגבי NextClass`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-[14px] transition-all hover:scale-[1.03]"
                                        style={{
                                            background: 'rgba(37,211,102,0.12)',
                                            border: '1px solid rgba(37,211,102,0.25)',
                                            color: '#25D366',
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        דברו עם אפרים ישירות
                                    </a>
                                </Reveal>
                            </div>

                        </div>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    9. TRUTH STATEMENT — massive typography
                ══════════════════════════════════════════════ */}
                <section className="bg-[#050505] py-28 md:py-40 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse at 50% 100%, rgba(0,122,255,0.08) 0%, transparent 60%)',
                    }} />
                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <ManifestoReveal
                            text="כל כיתה שמשתנה — משנה ילד. כל ילד שמשתנה — משנה עולם."
                            className="text-[clamp(30px,6vw,72px)] font-black text-white leading-[1.12] tracking-[-0.05em]"
                        />
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="text-[15px] text-white/25 font-medium mt-8"
                        >
                            — NextClass, {c.founderName}
                        </motion.p>
                    </div>
                </section>


                {/* ══════════════════════════════════════════════
                    10. CTA — gradient, invitation
                ══════════════════════════════════════════════ */}
                <section className="py-24 md:py-32 px-6 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #EBF4FF 0%, #F0EEFF 50%, #EBF6FF 100%)' }}>
                    {/* Decorative orbs */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.18) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-20 pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(88,86,214,0.22) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

                    <div className="relative z-10 max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: EASE }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                                style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.18)' }}>
                                <Sparkles size={11} className="text-[#007AFF]" />
                                <span className="text-[11px] font-black text-[#007AFF] tracking-widest uppercase">בואו נדבר</span>
                            </div>

                            <h2 className="text-[clamp(32px,5.5vw,68px)] font-black text-[#1D1D1F] leading-[0.96] mb-5 tracking-[-0.05em]">
                                {c.ctaTitle.split('\n').map((t, i) => (
                                    <span key={i} className={`block ${i === 1 ? 'text-[#007AFF]' : ''}`}>{t}</span>
                                ))}
                            </h2>

                            <p className="text-[17px] text-[#6B6B6B] font-medium mb-10 max-w-xl mx-auto leading-relaxed">
                                {c.ctaDesc}
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                <Link to="/contact"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[15px] text-white hover:scale-105 transition-transform"
                                    style={{ background: '#007AFF', boxShadow: '0 10px 32px rgba(0,122,255,0.32)' }}>
                                    שלחו הודעה
                                    <ArrowLeft size={15} />
                                </Link>
                                <Link to="/catalog"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[15px] text-[#007AFF] transition-all hover:bg-[#007AFF]/10"
                                    style={{ border: '1.5px solid rgba(0,122,255,0.22)' }}>
                                    צפו בקטלוג
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

            </div>
        </PageTransition>
    );
};

export default AboutPage;
