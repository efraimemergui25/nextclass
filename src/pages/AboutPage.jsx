import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { Sparkles, Heart, Zap, Award, Globe, ShieldCheck, ChevronDown, Compass, Users } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const GLASS_CARD = "glass-apple gestalt-card p-10 md:p-14 flex flex-col gap-6 relative overflow-hidden group border border-white/40 shadow-2xl";

const Counter = ({ value, label, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (latest > 0.1 && latest < 0.9) {
            setCount(Math.floor(value * Math.min(1, (latest - 0.1) * 2.5)));
        }
    });

    return (
        <div ref={ref} className="text-right">
            <div className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] tracking-tighter mb-1">
                {count.toLocaleString()}{suffix}
            </div>
            <div className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.2em]">{label}</div>
        </div>
    );
};

const TimelineItem = ({ year, title, desc, icon: Icon, index }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: index * 0.1 }}
        className={`relative flex items-start gap-12 mb-24 w-full ${index % 2 === 0 ? 'flex-row' : 'md:flex-row-reverse flex-row'}`}
    >
        <div className="flex-1 hidden md:block" />
        <div className="z-10 flex items-center justify-center w-14 h-14 rounded-full glass-apple border border-white/60 shadow-xl shrink-0">
            <span className="text-sm font-black text-[#007AFF]">{year}</span>
        </div>
        <div className="flex-1 text-right">
            <h3 className="text-2xl font-apple-display text-[#1D1D1F] mb-3 tracking-tight">{title}</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">{desc}</p>
        </div>
    </motion.div>
);

const AboutPage = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
    const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 1.05]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);

    const timelineData = [
        { year: '2012', title: 'החלום בתל אביב', desc: 'בחדר קטן בלב תל אביב, הבנו שהחינוך בישראל חייב זינוק קדימה. התחלנו עם המסך הראשון והמון תשוקה לשנות את חוקי המשחק.', icon: Zap },
        { year: '2016', title: 'מהפכת המגע', desc: 'המסכים שלנו הפכו ללב הפועם של אלפי כיתות. ראינו איך פתאום, כל ילד רוצה לגעת בידע, ליצור ולשתף.', icon: Award },
        { year: '2020', title: 'למידה ללא גבולות', desc: 'כשהעולם עצר, אנחנו לא. פיתחנו פתרונות היברידיים שחיברו מורים ותלמידים מכל מקום, ושמרנו על להבת הסקרנות בוערת.', icon: Globe },
        { year: '2025', title: 'העתיד כבר כאן', desc: 'עם AI מובנה ומערכות חכמות, אנחנו לא רק מספקים ציוד – אנחנו מעצבים את דור המנהיגים הבא של ישראל.', icon: ShieldCheck },
    ];

    return (
        <PageTransition>
            <div ref={containerRef} className="bg-[#F5F5F7] w-full overflow-x-hidden">

                {/* ── Cinematic Hero ────────────────────────────────────── */}
                <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                    <motion.div 
                        style={{ scale: heroScale, opacity: heroOpacity }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-[#F5F5F7] z-10" />
                        <img 
                            src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=2400" 
                            className="w-full h-full object-cover"
                            alt="The Vision"
                        />
                    </motion.div>

                    <div className="relative z-20 max-w-6xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 glass-apple px-6 py-2 rounded-full mb-10 border border-white/30"
                        >
                            <Sparkles size={14} className="text-[#007AFF]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">הסיפור של NextClass</span>
                        </motion.div>
                        
                        <h1 className="text-6xl md:text-9xl font-apple-display text-white tracking-tighter leading-[0.9] mb-12">
                            חינוך חכם.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">מוגדר מחדש.</span>
                        </h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-3xl text-white/80 font-medium max-w-4xl mx-auto leading-relaxed"
                        >
                            אנחנו לא רק מעצבים כיתות חכמות. אנחנו בונים את התשתית שעליה יצמח דור המנהיגים הבא של ישראל.
                        </motion.p>
                    </div>

                    <motion.div 
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute bottom-12 text-white/40 flex flex-col items-center gap-2"
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest">המסע שלנו מתחיל כאן</span>
                        <ChevronDown size={20} />
                    </motion.div>
                </section>

                {/* ── Deep Narrative: The Human Connection ──────────────────── */}
                <section className="py-32 px-6 bg-white relative">
                    <div className="max-w-[1400px] mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="order-2 lg:order-1 text-right"
                            >
                                <div className="inline-flex p-3 rounded-2xl bg-blue-50 mb-8">
                                    <Heart size={24} className="text-[#007AFF] fill-[#007AFF]" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] mb-8 tracking-tighter leading-tight">
                                    הכל התחיל ב-2012.<br />
                                    <span className="text-gray-400">עם מסך אחד והרבה תסכול.</span>
                                </h2>
                                <div className="space-y-6 text-xl text-gray-500 font-medium leading-relaxed max-w-xl ml-auto">
                                    <p>
                                        עמדנו בכיתה ישראלית ממוצעת וראינו את הפער הבלתי נסבל: בחוץ העולם רץ קדימה עם סמארטפונים וטכנולוגיית ענן, ובפנים – לוח וגיר. הבנו שהילדים שלנו ראויים ליותר מסתם "ציוד". הם ראויים לחוויה שתאתגר אותם.
                                    </p>
                                    <p className="text-[#1D1D1F]">
                                        הקמנו את NextClass כדי לנפץ את הפרדיגמה הזו. אנחנו לא כאן כדי למכור חומרה; אנחנו כאן כדי לבנות את הכלים שיהפכו כל שיעור לשיא של היום, וכל מורה למנהיג טכנולוגי. זה לא עתידני – זה קורה עכשיו.
                                    </p>
                                </div>
                                
                                <div className="mt-16 flex flex-wrap justify-end gap-12">
                                    <Counter value={500} label="מרכזי חדשנות" suffix="+" />
                                    <Counter value={250000} label="חלומות שהתגשמו" suffix="+" />
                                    <Counter value={100} label="אחוז מחויבות" suffix="%" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="order-1 lg:order-2 relative group"
                            >
                                <div className="absolute inset-0 bg-[#007AFF] rounded-[4rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
                                <img 
                                    src="/assets/modern_classroom_israel_1777475880301.png" 
                                    className="relative z-10 w-full aspect-[4/5] object-cover rounded-[4rem] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                                    alt="Modern Classroom"
                                />
                                <div className="absolute -bottom-6 -right-6 glass-apple p-6 rounded-3xl z-20 shadow-xl border border-white/50 hidden md:block">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Sparkles size={18} className="text-white" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-[#007AFF] uppercase tracking-widest">הטכנולוגיה שלנו</p>
                                            <p className="text-sm font-bold text-[#1D1D1F]">מאושרת משרד החינוך</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* ── Vertical Timeline ─────────────────────────────── */}
                <section className="py-32 relative bg-[#F5F5F7]">
                    <div className="max-w-5xl mx-auto px-6 relative">
                        <div className="text-right mb-24">
                            <h2 className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] tracking-tighter mb-4">הדרך שעשינו</h2>
                            <p className="text-xl text-gray-400 font-medium">עשור של פריצות דרך בחינוך הישראלי.</p>
                        </div>

                        <div className="relative">
                            {timelineData.map((item, i) => (
                                <TimelineItem key={i} {...item} index={i} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Founder's Message: Heart of the Brand ──────────────────────────── */}
                <section className="py-32 bg-white relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className={GLASS_CARD}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-3 mb-8">
                                        <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.3em]">מילה אישית מהמייסד</span>
                                        <div className="w-8 h-px bg-[#007AFF]" />
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] mb-10 tracking-tighter leading-tight">
                                        "ההצלחה נמדדת בשטח.<br />לא בברושורים."
                                    </h2>
                                    <p className="text-xl text-gray-500 leading-relaxed font-medium mb-12">
                                        כשבנינו את NextClass, החלטנו להפסיק לדבר על "פוטנציאל" ולהתחיל לדבר על תוצאות. ראינו יותר מדי בתי ספר עם ציוד שצובר אבק. אנחנו כאן כדי להבטיח שכל פיקסל שאנחנו מתקינים הופך לכלי עבודה אמיתי בידיים של המורים. זה המחויבות שלי אליכם.
                                    </p>
                                    <div className="flex items-center justify-end gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-[#1D1D1F] text-lg">אמיר כהן</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">מייסד ומנכ"ל NextClass</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md">
                                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" alt="Amir Cohen" />
                                        </div>
                                    </div>
                                </div>
                                <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                                    <img 
                                        src="/assets/visionary_founder_israel_1777475864564.png" 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                        alt="Visionary Founder" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Values: The NextClass DNA ──────────────────────────── */}
                <section className="py-48 bg-[#F5F5F7] relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] tracking-tighter mb-4">הערכים שמניעים אותנו</h2>
                            <p className="text-xl text-gray-400 font-medium">הבסיס לכל החלטה, לכל מוצר ולכל קשר.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { 
                                    title: 'מקצוענות ללא פשרות', 
                                    desc: 'אנחנו לא מסתפקים ב"עובד". אנחנו מחפשים את השלמות בכל פיקסל ובכל קו קוד, כדי שהשיעור שלך יעבור ללא תקלות.', 
                                    icon: ShieldCheck,
                                    gradient: 'from-blue-500/10 to-transparent'
                                },
                                { 
                                    title: 'חדשנות אנושית', 
                                    desc: 'הטכנולוגיה היא רק הכלי. הלב הוא המורה. אנחנו מפתחים כלים שמעצימים את היכולת האנושית לחנך ולהעניק השראה.', 
                                    icon: Compass,
                                    gradient: 'from-purple-500/10 to-transparent'
                                },
                                { 
                                    title: 'שותפות אמת', 
                                    desc: 'כשאתה בוחר בנו, אתה מקבל שותף לחיים. אנחנו שם בשבילך ברגעי השיא ובאתגרים היומיומיים, עם פתרונות שבאמת עובדים.', 
                                    icon: Users,
                                    gradient: 'from-indigo-500/10 to-transparent'
                                },
                            ].map((v, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ y: -16, scale: 1.02 }}
                                    className={`glass-apple p-12 rounded-[3rem] border border-white/60 text-right shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group bg-gradient-to-br ${v.gradient}`}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#007AFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center mb-10 ml-auto transition-transform duration-500 group-hover:rotate-[10deg] group-hover:scale-110">
                                        <v.icon size={32} className="text-[#007AFF]" />
                                    </div>
                                    <h3 className="text-3xl font-apple-display text-[#1D1D1F] mb-6 tracking-tight">{v.title}</h3>
                                    <p className="text-lg text-gray-500 font-medium leading-relaxed">{v.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Final Call to Action ──────────────────────────── */}
                <section className="py-48 bg-[#1D1D1F] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] -mr-96 -mt-96" />
                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600 rounded-full blur-[150px] -ml-64 -mb-64" />
                    </div>
                    
                    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                        <h2 className="text-5xl md:text-8xl font-apple-display text-white tracking-tighter mb-10 leading-[0.95]">
                            בואו נצייר את<br />
                            <span className="text-blue-500">המחר ביחד.</span>
                        </h2>
                        <p className="text-2xl text-gray-400 font-medium mb-16 max-w-2xl mx-auto">
                            אנחנו מחפשים את השותפים שמאמינים שחינוך הוא המשאב היקר ביותר שלנו. בואו נבנה משהו בלתי נשכח.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-6">
                            <motion.a
                                href="/contact"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-16 py-6 bg-white text-[#1D1D1F] rounded-full font-black text-xl shadow-2xl hover:bg-gray-50 transition-all"
                            >
                                דברו איתנו
                            </motion.a>
                            <motion.a
                                href="/catalog"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-16 py-6 bg-white/10 text-white backdrop-blur-xl border border-white/20 rounded-full font-black text-xl hover:bg-white/20 transition-all"
                            >
                                צפו בקטלוג
                            </motion.a>
                        </div>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
};

export default AboutPage;
