import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { Sparkles, Heart, Zap, Award, Globe, ShieldCheck, ChevronDown, Compass, Users } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ value, label, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1 && latest < 0.9) {
            setCount(Math.floor(value * Math.min(1, (latest - 0.1) * 2.5)));
        }
    });

    return (
        <div ref={ref} className="text-right">
            <div className="text-3xl md:text-4xl font-apple-display text-[#1D1D1F] tracking-tighter mb-0.5">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.2em]">{label}</div>
        </div>
    );
};

// ── Timeline item ─────────────────────────────────────────────────────────────
const TimelineItem = ({ year, title, desc, icon: Icon, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: index * 0.08 }}
        className={`relative flex items-start gap-6 md:gap-10 mb-10 w-full ${index % 2 === 0 ? 'flex-row' : 'md:flex-row-reverse flex-row'}`}
    >
        <div className="flex-1 hidden md:block" />
        <div className="z-10 flex items-center justify-center w-10 h-10 rounded-full glass-apple border border-white/60 shadow-md shrink-0">
            <span className="text-[11px] font-black text-[#007AFF]">{year}</span>
        </div>
        <div className="flex-1 text-right">
            <h3 className="text-base md:text-lg font-black text-[#1D1D1F] mb-1.5 tracking-tight">{title}</h3>
            <p className="text-sm text-[#86868B] font-medium leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AboutPage = () => {
    const { getSetting } = useSettings();

    const aboutContent = useMemo(() => ({
        heroLabel:    getSetting('about_hero_label',    'הסיפור של NextClass'),
        heroTitle:    getSetting('about_hero_title',    'חינוך חכם. מוגדר מחדש.'),
        heroSub:      getSetting('about_hero_sub',      'אנחנו לא רק מעצבים כיתות חכמות. אנחנו בונים את התשתית שעליה יצמח דור המנהיגים הבא של ישראל.'),
        heroImg:      getSetting('about_hero_img',      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2400'),
        storyTitle:   getSetting('about_story_title',   'הכל התחיל ב-2012. עם מסך אחד והרבה תסכול.'),
        storyBody:    getSetting('about_story_body',    'NextClass מתמחה בפתרונות טכנולוגיים מובילים למוסדות חינוך ברחבי ישראל. אנחנו מאמינים שטכנולוגיה נכונה מעצימה מורים ומסייעת לכל תלמיד להגיע לפוטנציאל המלא שלו.'),
        stat1Val:     getSetting('about_stat1_val',     '1200'),
        stat1Label:   getSetting('about_stat1_label',   'מוסדות חינוך'),
        stat2Val:     getSetting('about_stat2_val',     '14'),
        stat2Label:   getSetting('about_stat2_label',   'שנות ניסיון'),
        stat3Val:     getSetting('about_stat3_val',     '98'),
        stat3Label:   getSetting('about_stat3_label',   '% שביעות רצון'),
        founderTitle: getSetting('about_founder_title', 'ההצלחה נמדדת בשטח. לא בברושורים.'),
        founderMsg:   getSetting('about_founder_message','כשבנינו את NextClass, החלטנו להפסיק לדבר על "פוטנציאל" ולהתחיל לדבר על תוצאות.'),
        founderName:  getSetting('about_founder_name',  'אמיר כהן'),
        founderRole:  getSetting('about_founder_role',  'מייסד ומנכ"ל NextClass'),
        founderImg:   getSetting('about_founder_img',   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'),
        ctaTitle:     getSetting('about_cta_title',     'בואו נצייר את המחר ביחד.'),
        ctaDesc:      getSetting('about_cta_desc',      'אנחנו מחפשים את השותפים שמאמינים שחינוך הוא המשאב היקר ביותר שלנו. בואו נבנה משהו בלתי נשכח.'),
        journeyHint:  getSetting('about_journey_hint',  'המסע שלנו מתחיל כאן'),
        eduBadge:     getSetting('about_edu_badge',     'מאושרת משרד החינוך'),
        wayTitle:     getSetting('about_way_title',     'הדרך שעשינו'),
        wayDesc:      getSetting('about_way_desc',      'עשור של פריצות דרך בחינוך הישראלי.'),
        founderLabel: getSetting('about_founder_label', 'מילה אישית מהמייסד'),
        valuesTitle:  getSetting('about_values_title',  'הערכים שמניעים אותנו'),
        valuesDesc:   getSetting('about_values_desc',   'הבסיס לכל החלטה, לכל מוצר ולכל קשר.'),
        v1Title:      getSetting('about_v1_title',      'מקצוענות ללא פשרות'),
        v1Desc:       getSetting('about_v1_desc',       'אנחנו לא מסתפקים ב"עובד". אנחנו מחפשים את השלמות בכל פיקסל ובכל קו קוד.'),
        v2Title:      getSetting('about_v2_title',      'חדשנות אנושית'),
        v2Desc:       getSetting('about_v2_desc',       'הטכנולוגיה היא רק הכלי. הלב הוא המורה. אנחנו מפתחים כלים שמעצימים את היכולת האנושית.'),
        v3Title:      getSetting('about_v3_title',      'שותפות אמת'),
        v3Desc:       getSetting('about_v3_desc',       'כשאתה בוחר בנו, אתה מקבל שותף לחיים. אנחנו שם בשבילך ברגעי השיא ובאתגרים.'),
    }), [getSetting]);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
    const heroScale   = useTransform(smoothProgress, [0, 0.15], [1, 1.04]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);

    const timelineData = useMemo(() => [
        { year: getSetting('about_tm1_year', '2012'), title: getSetting('about_tm1_title', 'החלום בתל אביב'),      desc: getSetting('about_tm1_desc', 'בחדר קטן בלב תל אביב, הבנו שהחינוך בישראל חייב זינוק קדימה. התחלנו עם המסך הראשון והמון תשוקה לשנות את חוקי המשחק.'), icon: Zap },
        { year: getSetting('about_tm2_year', '2016'), title: getSetting('about_tm2_title', 'מהפכת המגע'),          desc: getSetting('about_tm2_desc', 'המסכים שלנו הפכו ללב הפועם של אלפי כיתות. ראינו איך פתאום, כל ילד רוצה לגעת בידע, ליצור ולשתף.'), icon: Award },
        { year: getSetting('about_tm3_year', '2020'), title: getSetting('about_tm3_title', 'למידה ללא גבולות'),    desc: getSetting('about_tm3_desc', 'כשהעולם עצר, אנחנו לא. פיתחנו פתרונות היברידיים שחיברו מורים ותלמידים מכל מקום, ושמרנו על להבת הסקרנות בוערת.'), icon: Globe },
        { year: getSetting('about_tm4_year', '2025'), title: getSetting('about_tm4_title', 'העתיד כבר כאן'),       desc: getSetting('about_tm4_desc', 'עם AI מובנה ומערכות חכמות, אנחנו לא רק מספקים ציוד – אנחנו מעצבים את דור המנהיגים הבא של ישראל.'), icon: ShieldCheck },
    ], [getSetting]);

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#F5F5F7] w-full overflow-x-hidden">

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative h-[80vh] min-h-[520px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                    <motion.div
                        style={{ scale: heroScale, opacity: heroOpacity }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-[#F5F5F7] z-10" />
                        <img src={aboutContent.heroImg} className="w-full h-full object-cover" alt="" loading="lazy" />
                    </motion.div>

                    <div className="relative z-20 max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 glass-apple px-5 py-1.5 rounded-full mb-7 border border-white/30"
                        >
                            <Sparkles size={12} className="text-[#007AFF]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{aboutContent.heroLabel}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="text-3xl sm:text-5xl md:text-[64px] font-apple-display text-white tracking-tighter leading-[1.0] mb-5"
                        >
                            {aboutContent.heroTitle.split('.').map((t, i) => (
                                <span key={i}>{t}{i === 0 && aboutContent.heroTitle.includes('.') && <br />}</span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-base md:text-lg text-white/75 font-medium max-w-2xl mx-auto leading-relaxed"
                        >
                            {aboutContent.heroSub}
                        </motion.p>
                    </div>

                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute bottom-10 text-white/40 flex flex-col items-center gap-1.5"
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest">{aboutContent.journeyHint}</span>
                        <ChevronDown size={16} />
                    </motion.div>
                </section>

                {/* ── Story ────────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 px-6 bg-white relative">
                    <div className="max-w-[1300px] mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="order-2 lg:order-1 text-right"
                            >
                                <div className="inline-flex p-2.5 rounded-xl bg-blue-50 mb-6">
                                    <Heart size={18} className="text-[#007AFF] fill-[#007AFF]" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-apple-display text-[#1D1D1F] mb-5 tracking-tighter leading-tight">
                                    {aboutContent.storyTitle.split('.').map((t, i) => (
                                        <span key={i} className={i % 2 !== 0 ? "text-[#AEAEB2]" : ""}>
                                            {t}{i === 0 && aboutContent.storyTitle.includes('.') && <br />}
                                        </span>
                                    ))}
                                </h2>
                                <p className="text-[15px] text-[#86868B] font-medium leading-relaxed max-w-lg ml-auto">
                                    {aboutContent.storyBody}
                                </p>

                                <div className="mt-10 flex flex-wrap justify-end gap-8">
                                    <Counter value={Number(aboutContent.stat1Val)} label={aboutContent.stat1Label} suffix="+" />
                                    <Counter value={Number(aboutContent.stat2Val)} label={aboutContent.stat2Label} suffix="+" />
                                    <Counter value={Number(aboutContent.stat3Val)} label={aboutContent.stat3Label} suffix="%" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.97 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="order-1 lg:order-2 relative group"
                            >
                                <div className="absolute inset-0 bg-[#007AFF] rounded-[3rem] blur-3xl opacity-8 group-hover:opacity-15 transition-opacity" />
                                <img
                                    src="/assets/modern_classroom_israel_1777475880301.png"
                                    className="relative z-10 w-full aspect-[4/5] object-cover rounded-[3rem] shadow-xl transition-transform duration-700 group-hover:scale-[1.02]"
                                    alt="Modern Classroom" loading="lazy"
                                />
                                <div className="absolute -bottom-5 -right-5 glass-apple px-5 py-4 rounded-2xl z-20 shadow-lg border border-white/50 hidden md:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-[#007AFF] uppercase tracking-widest">הטכנולוגיה שלנו</p>
                                            <p className="text-xs font-bold text-[#1D1D1F]">{aboutContent.eduBadge}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* ── Timeline ─────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 relative bg-[#F5F5F7]">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-right mb-12" dir="rtl">
                            <h2 className="text-2xl sm:text-3xl font-apple-display text-[#1D1D1F] tracking-tighter mb-2">{aboutContent.wayTitle}</h2>
                            <p className="text-[15px] text-[#AEAEB2] font-medium">{aboutContent.wayDesc}</p>
                        </div>
                        <div className="relative">
                            {timelineData.map((item, i) => (
                                <TimelineItem key={i} {...item} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Founder ──────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="glass-apple p-6 sm:p-10 rounded-[2rem] border border-white/40 shadow-lg relative overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-3 mb-5">
                                        <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em]">{aboutContent.founderLabel}</span>
                                        <div className="w-6 h-px bg-[#007AFF]" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-apple-display text-[#1D1D1F] mb-5 tracking-tighter leading-tight">
                                        {aboutContent.founderTitle.split('.').map((t, i) => (
                                            <span key={i} className={i % 2 !== 0 ? "text-[#AEAEB2]" : ""}>
                                                {t}{i === 0 && aboutContent.founderTitle.includes('.') && <br />}
                                            </span>
                                        ))}
                                    </h2>
                                    <p className="text-[15px] text-[#86868B] leading-relaxed font-medium mb-8">
                                        {aboutContent.founderMsg}
                                    </p>
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="text-right">
                                            <p className="font-bold text-[#1D1D1F] text-sm">{aboutContent.founderName}</p>
                                            <p className="text-[10px] text-[#AEAEB2] font-bold uppercase tracking-widest mt-0.5">{aboutContent.founderRole}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md shrink-0">
                                            <img src={aboutContent.founderImg} alt={aboutContent.founderName} className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-xl">
                                    <img
                                        src="/assets/visionary_founder_israel_1777475864564.png"
                                        className="w-full h-full object-cover"
                                        alt="Founder" loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/15 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Values ───────────────────────────────────────────── */}
                <section className="py-16 sm:py-20 bg-[#F5F5F7] relative">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-10 sm:mb-14" dir="rtl">
                            <h2 className="text-2xl sm:text-3xl font-apple-display text-[#1D1D1F] tracking-tighter mb-2">{aboutContent.valuesTitle}</h2>
                            <p className="text-[15px] text-[#AEAEB2] font-medium">{aboutContent.valuesDesc}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {[
                                { title: aboutContent.v1Title, desc: aboutContent.v1Desc, icon: ShieldCheck, gradient: 'from-blue-500/8 to-transparent' },
                                { title: aboutContent.v2Title, desc: aboutContent.v2Desc, icon: Compass,     gradient: 'from-purple-500/8 to-transparent' },
                                { title: aboutContent.v3Title, desc: aboutContent.v3Desc, icon: Users,       gradient: 'from-indigo-500/8 to-transparent' },
                            ].map((v, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                                    className={`glass-apple p-6 sm:p-8 rounded-[1.75rem] border border-white/60 text-right shadow-sm relative overflow-hidden group bg-gradient-to-br ${v.gradient}`}
                                >
                                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#007AFF]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-11 h-11 rounded-[0.85rem] bg-white shadow-md flex items-center justify-center mb-5 ml-auto transition-transform duration-400 group-hover:scale-110">
                                        <v.icon size={20} className="text-[#007AFF]" />
                                    </div>
                                    <h3 className="text-base font-black text-[#1D1D1F] mb-2.5 tracking-tight">{v.title}</h3>
                                    <p className="text-sm text-[#86868B] font-medium leading-relaxed">{v.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────────────────────── */}
                <section className="py-16 sm:py-24 bg-[#1D1D1F] relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/18 rounded-full blur-[120px] -mr-60 -mt-60" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/14 rounded-full blur-[120px] -ml-40 -mb-40" />
                    </div>

                    <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="text-2xl sm:text-4xl md:text-5xl font-apple-display text-white tracking-tighter mb-4 leading-[1.05]"
                        >
                            {aboutContent.ctaTitle.split('.').map((t, i) => (
                                <span key={i} className={i % 2 !== 0 ? "text-blue-400" : ""}>
                                    {t}{i === 0 && aboutContent.ctaTitle.includes('.') && <br />}
                                </span>
                            ))}
                        </motion.h2>
                        <p className="text-[15px] text-white/55 font-medium mb-8 max-w-xl mx-auto leading-relaxed">
                            {aboutContent.ctaDesc}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3">
                            <motion.a
                                href="/contact"
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-3.5 bg-white text-[#1D1D1F] rounded-full font-black text-[13px] shadow-md hover:bg-gray-50 transition-all"
                            >
                                {getSetting('nav_contact', 'דברו איתנו')}
                            </motion.a>
                            <motion.a
                                href="/catalog"
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                className="px-8 py-3.5 bg-white/10 text-white backdrop-blur-xl border border-white/15 rounded-full font-black text-[13px] hover:bg-white/18 transition-all"
                            >
                                {getSetting('nav_catalog', 'צפו בקטלוג')}
                            </motion.a>
                        </div>
                    </div>
                </section>

            </div>
        </PageTransition>
    );
};

export default AboutPage;
