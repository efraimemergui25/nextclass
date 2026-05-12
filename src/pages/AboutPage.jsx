import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Zap, Award, Globe, ShieldCheck, ChevronDown, Compass, Users, ArrowLeft, CheckCircle, Star, Building2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ value, label, suffix = "", color = '#007AFF' }) => {
    const [count, setCount] = useState(0);
    const [triggered, setTriggered] = useState(false);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });

    useMotionValueEvent(scrollYProgress, 'change', (latest) => {
        if (latest > 0.3 && !triggered) {
            setTriggered(true);
            let start = 0;
            const duration = 1400;
            const step = 16;
            const increment = value / (duration / step);
            const timer = setInterval(() => {
                start += increment;
                if (start >= value) { setCount(value); clearInterval(timer); }
                else setCount(Math.floor(start));
            }, step);
        }
    });

    return (
        <div ref={ref} className="text-center">
            <div className="text-4xl md:text-5xl font-black tracking-tighter mb-1" style={{ color }}>
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.18em]">{label}</div>
        </div>
    );
};

// ── Timeline item ─────────────────────────────────────────────────────────────
const TimelineItem = ({ year, title, desc, color, index, isLast }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex gap-6 pb-10"
    >
        {/* Left: year pill + connector */}
        <div className="flex flex-col items-center shrink-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[11px] text-white shadow-md z-10"
                style={{ background: color }}>
                {year}
            </div>
            {!isLast && (
                <div className="w-0.5 flex-1 mt-2" style={{ background: `linear-gradient(to bottom, ${color}40, transparent)` }} />
            )}
        </div>
        {/* Right: content */}
        <div className="flex-1 text-right pb-2 pt-2.5">
            <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight mb-1.5">{title}</h3>
            <p className="text-[14px] text-[#86868B] font-medium leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

// ── Value card ────────────────────────────────────────────────────────────────
const ValueCard = ({ title, desc, icon: Icon, gradient, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="relative rounded-[2rem] p-7 text-right group overflow-hidden"
        style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
    >
        <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ml-auto shadow-sm"
                style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.14)' }}>
                <Icon size={22} className="text-[#007AFF]" />
            </div>
            <h3 className="text-[17px] font-black text-[#1D1D1F] mb-2.5 tracking-tight">{title}</h3>
            <p className="text-[14px] text-[#86868B] leading-relaxed font-medium">{desc}</p>
        </div>
    </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AboutPage = () => {
    const { getSetting } = useSettings();

    const c = useMemo(() => ({
        heroLabel:    getSetting('about_hero_label',    'הסיפור של NextClass'),
        heroTitle:    getSetting('about_hero_title',    'חינוך חכם.\nמוגדר מחדש.'),
        heroSub:      getSetting('about_hero_sub',      'אנחנו לא רק מעצבים כיתות חכמות. אנחנו בונים את התשתית שעליה יצמח דור המנהיגים הבא של ישראל.'),
        heroImg:      getSetting('about_hero_img',      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=85&w=2400'),
        storyTitle:   getSetting('about_story_title',   'הכל התחיל ב-2012.\nעם מסך אחד והרבה תסכול.'),
        storyBody:    getSetting('about_story_body',    'ישבתי בכיתה בבית ספר בדרום תל אביב וראיתי מורה מנסה להסביר מתמטיקה על לוח שחור ישן. הילדים היו אדישים. הצלחתי לראות בדיוק מה חסר — לא רק מסך, אלא חיבור אמיתי בין טכנולוגיה לחינוך. מאז, NextClass הפכה לשותפה של מעל 1,200 מוסדות חינוך ברחבי הארץ.'),
        stat1Val:     getSetting('about_stat1_val',     '1200'),
        stat1Label:   getSetting('about_stat1_label',   'מוסדות חינוך'),
        stat2Val:     getSetting('about_stat2_val',     '14'),
        stat2Label:   getSetting('about_stat2_label',   'שנות ניסיון'),
        stat3Val:     getSetting('about_stat3_val',     '98'),
        stat3Label:   getSetting('about_stat3_label',   'שביעות רצון %'),
        stat4Val:     getSetting('about_stat4_val',     '40000'),
        stat4Label:   getSetting('about_stat4_label',   'תלמידים מושפעים'),
        founderTitle: getSetting('about_founder_title', 'ההצלחה נמדדת בשטח.\nלא בברושורים.'),
        founderMsg:   getSetting('about_founder_message','כשהקמתי את NextClass, הבנתי שהמכשול הגדול ביותר בחינוך הישראלי הוא לא מחסור בטכנולוגיה — אלא מחסור באנשים שמבינים גם את הטכנולוגיה וגם את הכיתה. אנחנו שם לגשר על הפער הזה.'),
        founderName:  getSetting('about_founder_name',  'אפרים אמרגי'),
        founderRole:  getSetting('about_founder_role',  'מייסד ומנכ"ל NextClass'),
        founderImg:   getSetting('about_founder_img',   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'),
        ctaTitle:     getSetting('about_cta_title',     'בואו נצייר את המחר ביחד.'),
        ctaDesc:      getSetting('about_cta_desc',      'אנחנו מחפשים שותפים שמאמינים שחינוך הוא המשאב היקר ביותר שלנו. בואו נבנה משהו שהילדים של ישראל יזכרו.'),
        journeyHint:  getSetting('about_journey_hint',  'גלה את הסיפור שלנו'),
        eduBadge:     getSetting('about_edu_badge',     'מאושרת משרד החינוך'),
        wayTitle:     getSetting('about_way_title',     'הדרך שעשינו'),
        wayDesc:      getSetting('about_way_desc',      'עשור של פריצות דרך בחינוך הישראלי.'),
        founderLabel: getSetting('about_founder_label', 'מילה אישית מהמייסד'),
        valuesTitle:  getSetting('about_values_title',  'הערכים שמניעים אותנו'),
        valuesDesc:   getSetting('about_values_desc',   'הבסיס לכל החלטה, לכל מוצר ולכל קשר.'),
        v1Title:      getSetting('about_v1_title',      'מקצוענות ללא פשרות'),
        v1Desc:       getSetting('about_v1_desc',       'אנחנו לא מסתפקים ב"עובד". אנחנו מחפשים את השלמות בכל פיקסל ובכל שלב בשירות — מהייעוץ הראשון עד ההתקנה האחרונה.'),
        v2Title:      getSetting('about_v2_title',      'חדשנות אנושית'),
        v2Desc:       getSetting('about_v2_desc',       'הטכנולוגיה היא רק הכלי. הלב הוא המורה. אנחנו מפתחים כלים שמעצימים את היכולת האנושית — לא מחליפים אותה.'),
        v3Title:      getSetting('about_v3_title',      'שותפות אמת'),
        v3Desc:       getSetting('about_v3_desc',       'כשאתה בוחר ב-NextClass, אתה מקבל שותף לטווח ארוך. אנחנו שם בשבילך ברגעי השיא ובאתגרים — לאורך כל הדרך.'),
    }), [getSetting]);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
    const heroScale   = useTransform(smoothProgress, [0, 0.12], [1, 1.06]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
    const heroY       = useTransform(smoothProgress, [0, 0.15], [0, 40]);

    const timelineData = useMemo(() => [
        {
            year: getSetting('about_tm1_year', '2012'),
            title: getSetting('about_tm1_title', 'החלום — מסך אחד, אלף ילדים'),
            desc: getSetting('about_tm1_desc', 'בחדר קטן בתל אביב, הבנתי שהחינוך בישראל חייב מהפכה. התחלנו עם ההתקנה הראשונה שלנו בבי"ס יסודי בדרום העיר, ויצאנו עם חיוכים של ילדים שפגשו לראשונה לוח אינטראקטיבי.'),
            color: '#007AFF',
        },
        {
            year: getSetting('about_tm2_year', '2016'),
            title: getSetting('about_tm2_title', 'הצמיחה — 100 בתי ספר ומעלה'),
            desc: getSetting('about_tm2_desc', 'המסכים שלנו הפכו ללב הפועם של מאות כיתות. ראינו איך פתאום כל ילד רוצה לגעת בידע, ליצור ולשתף — ועוד יותר, ראינו מורים שמחים לבוא לעבוד.'),
            color: '#5856D6',
        },
        {
            year: getSetting('about_tm3_year', '2020'),
            title: getSetting('about_tm3_title', 'המבחן — העולם עצר, אנחנו לא'),
            desc: getSetting('about_tm3_desc', 'כשהגיע הקורונה, פיתחנו בשבועות פתרונות היברידיים שחיברו מורים ותלמידים מכל מקום בארץ. 300 בתי ספר עברו מקוונים תוך חודש — ואפס ילד נשאר מאחור.'),
            color: '#FF9500',
        },
        {
            year: getSetting('about_tm4_year', '2024'),
            title: getSetting('about_tm4_title', 'העתיד — AI בשירות המורה'),
            desc: getSetting('about_tm4_desc', 'השקנו את מערכת ה-AI הראשונה שלנו שמסייעת למורים לבנות שיעורים מותאמים אישית. היום, מעל 1,200 מוסדות ו-40,000 תלמידים לומדים עם NextClass בכל יום.'),
            color: '#34C759',
        },
    ], [getSetting]);

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#F5F5F7] w-full overflow-x-hidden" dir="rtl">

                {/* ── HERO ──────────────────────────────────────────────── */}
                <section className="relative h-screen min-h-[620px] max-h-[900px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                    {/* Parallax bg */}
                    <motion.div
                        style={{ scale: heroScale, y: heroY }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#F5F5F7] z-10" />
                        <img src={c.heroImg} className="w-full h-full object-cover" alt="" loading="eager" />
                    </motion.div>

                    <motion.div style={{ opacity: heroOpacity }} className="relative z-20 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border border-white/25"
                            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}
                        >
                            <Sparkles size={11} className="text-white/80" />
                            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-white/80">{c.heroLabel}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 28 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-[1.0] mb-6"
                        >
                            {c.heroTitle.split('\n').map((line, i) => (
                                <span key={i} className={`block ${i === 1 ? 'text-white/50' : ''}`}>{line}</span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35, duration: 0.7 }}
                            className="text-base md:text-lg text-white/65 font-medium max-w-2xl mx-auto leading-relaxed"
                        >
                            {c.heroSub}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            className="flex flex-wrap justify-center gap-3 mt-10"
                        >
                            <Link to="/catalog"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#1D1D1F] rounded-full font-black text-[13px] shadow-xl hover:scale-105 transition-transform">
                                לקטלוג המוצרים <ArrowLeft size={14} />
                            </Link>
                            <Link to="/contact"
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-black text-[13px] text-white border border-white/25 hover:bg-white/10 transition-all"
                                style={{ backdropFilter: 'blur(16px)' }}>
                                דברו איתנו
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute bottom-8 flex flex-col items-center gap-1.5 text-white/40 z-20"
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest">{c.journeyHint}</span>
                        <ChevronDown size={16} />
                    </motion.div>
                </section>

                {/* ── STATS STRIP ───────────────────────────────────────── */}
                <section className="py-16 bg-white border-b border-black/[0.04]">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            <Counter value={Number(c.stat1Val)} label={c.stat1Label} suffix="+" color="#007AFF" />
                            <Counter value={Number(c.stat2Val)} label={c.stat2Label} suffix="+" color="#5856D6" />
                            <Counter value={Number(c.stat3Val)} label={c.stat3Label} suffix="%" color="#34C759" />
                            <Counter value={Number(c.stat4Val)} label={c.stat4Label} suffix="+" color="#FF9500" />
                        </div>
                    </div>
                </section>

                {/* ── STORY ─────────────────────────────────────────────── */}
                <section className="py-20 sm:py-28 px-6 bg-white">
                    <div className="max-w-[1280px] mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                            {/* Image */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="relative group order-1"
                            >
                                <div className="absolute -inset-4 bg-gradient-to-br from-[#007AFF]/10 to-[#5856D6]/10 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative overflow-hidden rounded-[3rem] shadow-2xl aspect-[4/5]">
                                    <img
                                        src="/assets/modern_classroom_israel_1777475880301.png"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        alt="כיתה חכמה NextClass"
                                        loading="lazy"
                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>
                                {/* Floating badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 }}
                                    className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-5 py-4 shadow-xl border border-black/[0.05] hidden md:flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <CheckCircle size={18} className="text-[#007AFF]" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-[#007AFF] uppercase tracking-wider">מאושרת</p>
                                        <p className="text-[12px] font-bold text-[#1D1D1F]">{c.eduBadge}</p>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Text */}
                            <motion.div
                                initial={{ opacity: 0, x: 24 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                                className="order-2 text-right"
                            >
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                                    style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)' }}>
                                    <Heart size={12} className="text-[#007AFF] fill-[#007AFF]" />
                                    <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest">הסיפור שלנו</span>
                                </div>

                                <h2 className="text-3xl sm:text-4xl md:text-[42px] font-black text-[#1D1D1F] tracking-tighter leading-[1.08] mb-6">
                                    {c.storyTitle.split('\n').map((line, i) => (
                                        <span key={i} className={`block ${i === 1 ? 'text-[#AEAEB2]' : ''}`}>{line}</span>
                                    ))}
                                </h2>

                                <p className="text-[16px] text-[#6E6E73] font-medium leading-[1.75] mb-8">
                                    {c.storyBody}
                                </p>

                                {/* Trust signals */}
                                <div className="space-y-3">
                                    {[
                                        'התקנות מקצועיות ברחבי כל הארץ',
                                        'תמיכה טכנית מלאה 24/7',
                                        'הכשרה ופדגוגיה מותאמת לצוות',
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 12 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 + i * 0.08 }}
                                            className="flex items-center gap-3 justify-end"
                                        >
                                            <span className="text-[14px] font-medium text-[#3C3C43]">{item}</span>
                                            <div className="w-5 h-5 rounded-full bg-[#34C759]/15 flex items-center justify-center shrink-0">
                                                <CheckCircle size={12} className="text-[#34C759]" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* ── TIMELINE ──────────────────────────────────────────── */}
                <section className="py-20 sm:py-28 bg-[#F5F5F7] relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl" />
                    </div>

                    <div className="max-w-3xl mx-auto px-6 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-right mb-14"
                        >
                            <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest block mb-3">{c.wayTitle}</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tighter">{c.wayDesc}</h2>
                        </motion.div>

                        <div>
                            {timelineData.map((item, i) => (
                                <TimelineItem
                                    key={i}
                                    {...item}
                                    index={i}
                                    isLast={i === timelineData.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FOUNDER QUOTE ─────────────────────────────────────── */}
                <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
                    {/* Ambient */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />

                    <div className="max-w-[1200px] mx-auto px-6 relative">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-16 items-center">

                            {/* Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="text-right order-2 lg:order-1"
                            >
                                <div className="flex items-center justify-end gap-3 mb-6">
                                    <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-[0.25em]">{c.founderLabel}</span>
                                    <div className="w-8 h-px bg-[#007AFF]" />
                                </div>

                                {/* Giant quote mark */}
                                <div className="text-[120px] leading-none text-[#007AFF]/10 font-black select-none mb-2 text-right">"</div>

                                <h2 className="text-2xl sm:text-3xl md:text-[36px] font-black text-[#1D1D1F] tracking-tighter leading-[1.12] mb-6 -mt-10">
                                    {c.founderTitle.split('\n').map((line, i) => (
                                        <span key={i} className={`block ${i === 1 ? 'text-[#AEAEB2]' : ''}`}>{line}</span>
                                    ))}
                                </h2>

                                <p className="text-[16px] text-[#6E6E73] leading-[1.8] font-medium mb-10 max-w-xl ml-auto">
                                    {c.founderMsg}
                                </p>

                                {/* Founder identity */}
                                <div className="flex items-center justify-end gap-4">
                                    <div className="text-right">
                                        <p className="text-[17px] font-black text-[#1D1D1F] tracking-tight">{c.founderName}</p>
                                        <p className="text-[12px] text-[#86868B] font-bold uppercase tracking-widest mt-0.5">{c.founderRole}</p>
                                    </div>
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#007AFF]/15 shadow-lg shrink-0">
                                        <img
                                            src={c.founderImg}
                                            alt={c.founderName}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Founder image — large portrait */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                className="order-1 lg:order-2 relative"
                            >
                                <div className="absolute -inset-3 bg-gradient-to-br from-[#007AFF]/12 to-[#5856D6]/12 rounded-[3rem] blur-2xl" />
                                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <img
                                        src="/assets/visionary_founder_israel_1777475864564.png"
                                        className="w-full h-full object-cover"
                                        alt={c.founderName}
                                        loading="lazy"
                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#007AFF]/25 via-transparent to-transparent" />
                                    {/* Name overlay at bottom */}
                                    <div className="absolute bottom-0 inset-x-0 p-6"
                                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}>
                                        <p className="text-white font-black text-lg tracking-tight">{c.founderName}</p>
                                        <p className="text-white/65 text-[11px] font-bold uppercase tracking-widest">{c.founderRole}</p>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* ── VALUES ────────────────────────────────────────────── */}
                <section className="py-20 sm:py-28 bg-[#F5F5F7] relative">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-14"
                        >
                            <span className="text-[11px] font-black text-[#007AFF] uppercase tracking-widest block mb-3">{c.valuesTitle}</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-[#1D1D1F] tracking-tighter">{c.valuesDesc}</h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <ValueCard title={c.v1Title} desc={c.v1Desc} icon={ShieldCheck} gradient="from-blue-500/6 to-transparent"   delay={0} />
                            <ValueCard title={c.v2Title} desc={c.v2Desc} icon={Compass}     gradient="from-purple-500/6 to-transparent" delay={0.08} />
                            <ValueCard title={c.v3Title} desc={c.v3Desc} icon={Users}       gradient="from-indigo-500/6 to-transparent" delay={0.16} />
                        </div>
                    </div>
                </section>

                {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
                <section className="py-16 bg-white border-t border-black/[0.04]">
                    <div className="max-w-5xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-10"
                        >
                            <p className="text-[11px] font-black text-[#AEAEB2] uppercase tracking-widest">סומכים עלינו</p>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { quote: 'NextClass שינתה לנו את הכיתות. המורים מרגישים ביטחון עם הטכנולוגיה ותלמידים מעורבים יותר.', name: 'ד"ר שרה לוי', role: 'מנהלת ביה"ס ממ"ד, חיפה', stars: 5 },
                                { quote: 'שירות מעל ומעבר. ההתקנה נעשתה בזמן שיא, ותמיכה מיידית בכל שעה. ממליצה בחום.', name: 'יצחק בן דוד', role: 'רכזת טכנולוגיה, ת"א', stars: 5 },
                                { quote: 'קיבלנו פתרון מותאם לחלוטין לצרכי הרשות. מקצועיות יוצאת דופן מהצעה ועד הדרכה.', name: 'מיכל גרינברג', role: 'מפקחת טכנולוגיה, ירושלים', stars: 5 },
                            ].map((t, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1, duration: 0.55 }}
                                    className="rounded-[1.75rem] p-6 text-right"
                                    style={{
                                        background: 'rgba(255,255,255,0.85)',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                                    }}
                                >
                                    <div className="flex justify-end gap-0.5 mb-4">
                                        {Array.from({ length: t.stars }).map((_, s) => (
                                            <Star key={s} size={13} className="fill-[#FF9500] text-[#FF9500]" />
                                        ))}
                                    </div>
                                    <p className="text-[14px] text-[#3C3C43] leading-relaxed font-medium mb-5">"{t.quote}"</p>
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="text-right">
                                            <p className="text-[13px] font-black text-[#1D1D1F]">{t.name}</p>
                                            <p className="text-[10px] text-[#AEAEB2] font-medium">{t.role}</p>
                                        </div>
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-[12px] font-black shrink-0">
                                            {t.name[0]}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ───────────────────────────────────────────────── */}
                <section className="py-24 sm:py-32 relative overflow-hidden"
                    style={{ background: 'linear-gradient(160deg, #0A0A0A 0%, #1C1C1E 50%, #0D0D1A 100%)' }}>
                    {/* Orbs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] -mr-72 -mt-72" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/12 rounded-full blur-[140px] -ml-52 -mb-52" />
                    </div>

                    <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 mb-8"
                                style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <Sparkles size={11} className="text-blue-400" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">בואו נדבר</span>
                            </div>

                            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-[1.05] mb-5">
                                {c.ctaTitle.split('.').map((t, i) => (
                                    <span key={i} className={`block ${i === 1 ? 'text-blue-400' : ''}`}>
                                        {t}{i < c.ctaTitle.split('.').length - 1 ? '.' : ''}
                                    </span>
                                ))}
                            </h2>

                            <p className="text-[15px] text-white/50 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
                                {c.ctaDesc}
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                <Link to="/contact"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1D1D1F] rounded-full font-black text-[14px] shadow-xl hover:scale-105 transition-transform">
                                    דברו עם {c.founderName}
                                    <ArrowLeft size={15} />
                                </Link>
                                <Link to="/catalog"
                                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-white border border-white/15 hover:bg-white/8 transition-all">
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
