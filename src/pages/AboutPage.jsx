import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const GLASS = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.70) 100%)',
    backdropFilter: 'blur(40px) saturate(1.7)',
    WebkitBackdropFilter: 'blur(40px) saturate(1.7)',
    border: '1px solid rgba(255,255,255,0.82)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.95) inset',
};

const values = [
    {
        title: 'חדשנות', subtitle: 'פתרונות עתידיים היום',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )
    },
    {
        title: 'אמינות', subtitle: 'הגנה מלאה לאורך זמן',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    },
    {
        title: 'פדגוגיה', subtitle: 'מעוצב לחוויית הלמידה',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
        )
    },
    {
        title: 'שותפות', subtitle: 'ליווי אישי לאורך הדרך',
        icon: (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
        )
    },
];

const stats = [
    { number: '500+', label: 'מוסדות חינוך' },
    { number: '12K+', label: 'כיתות חכמות' },
    { number: '98%', label: 'שביעות רצון' },
    { number: '10+', label: 'שנות ניסיון' },
];

const AboutPage = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] w-full overflow-x-hidden">

                {/* ── Hero Manifesto ──────────────────────────────────────────── */}
                <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6 pt-40 pb-24 overflow-hidden">
                    {/* Ambient orbs */}
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }} />
                    <div className="absolute bottom-0 left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(88,86,214,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#007AFF] mb-6 block"
                    >
                        הסיפור שלנו
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-[#1D1D1F] leading-[1.05] tracking-tighter max-w-5xl mx-auto mb-8"
                    >
                        אנחנו לא רק<br />
                        <span className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' }}>
                            מוכרים טכנולוגיה.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl text-gray-500 font-normal max-w-3xl mx-auto leading-relaxed"
                    >
                        אנחנו מעצבים את עתיד החינוך — חומרה, תוכנה, הדרכה ותמיכה. מהבנת האתגר של המורה בכיתה, ועד לפתרון שלם.
                    </motion.p>

                    {/* Stats strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto w-full"
                    >
                        {stats.map((s, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center justify-center py-6 px-4 rounded-3xl relative overflow-hidden"
                                style={GLASS}
                            >
                                <div className="absolute top-0 left-4 right-4 h-px"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
                                <span className="text-3xl md:text-4xl font-black text-[#007AFF] tracking-tighter">{s.number}</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </section>

                {/* ── Vision Section ──────────────────────────────────────────── */}
                <section className="py-24 md:py-32 w-full">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                            {/* Image */}
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="relative"
                            >
                                <div className="rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl relative">
                                    <img
                                        src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=1200"
                                        alt="Modern Learning Lab"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            if (!e.target.dataset.triedFallback) {
                                                e.target.dataset.triedFallback = 'true';
                                                e.target.src = "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&q=80&w=1200";
                                            }
                                        }}
                                    />
                                    {/* Overlay badge */}
                                    <div className="absolute bottom-5 right-5 px-5 py-3 rounded-2xl flex items-center gap-2"
                                        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.9)' }}>
                                        <svg className="w-4 h-4 text-[#007AFF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="text-[#1D1D1F] font-black text-sm">מעבדת חדשנות פעילה</span>
                                    </div>
                                </div>
                                {/* Ambient glow */}
                                <div className="absolute inset-0 -z-10 rounded-[2.5rem]"
                                    style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,122,255,0.12) 0%, transparent 70%)', filter: 'blur(40px)', transform: 'scale(1.1)' }} />
                            </motion.div>

                            {/* Text */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.15 }}
                            >
                                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#007AFF] block mb-4">החזון שלנו</span>
                                <h2 className="text-3xl md:text-5xl font-black text-[#1D1D1F] mb-6 leading-tight tracking-tighter">
                                    להביא את הסטנדרט<br />של הייטק לתוך<br />כיתות הלימוד.
                                </h2>
                                {[
                                    'הקמנו את nextclass מתוך הבנה שהפער הטכנולוגי בחינוך הוא האתגר הגדול של דורנו. אנחנו כאן כדי לגשר עליו עם הכלים המתקדמים בעולם, בליווי צמוד ומקצועי.',
                                    'הצוות שלנו מורכב ממהנדסים, פדגוגים ואנשי שטח שחיים ונושמים חינוך טכנולוגי. כל מוצר עבר בדיקות קפדניות ומותאם לסביבה הישראלית.',
                                ].map((text, i) => (
                                    <p key={i} className="text-lg text-gray-500 leading-relaxed mb-5">{text}</p>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ── Values Grid ─────────────────────────────────────────────── */}
                <section className="py-24 bg-white/60 w-full">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                        <div className="text-center mb-16">
                            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#007AFF] block mb-3">מה מניע אותנו</span>
                            <h2 className="text-3xl md:text-5xl font-black text-[#1D1D1F] tracking-tighter">ארבעה עקרונות. מוצר אחד.</h2>
                        </div>

                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {values.map((v, i) => (
                                <motion.div
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 24, scale: 0.97 },
                                        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
                                    }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                                    className="p-8 rounded-[2rem] flex flex-col gap-5 relative overflow-hidden group"
                                    style={GLASS}
                                >
                                    <div className="absolute top-0 left-6 right-6 h-px"
                                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)' }} />
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-[2rem]"
                                        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.05) 0%, transparent 60%)' }} />

                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#007AFF] relative z-10"
                                        style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.08) 100%)' }}>
                                        {v.icon}
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black text-[#1D1D1F] tracking-tight mb-1">{v.title}</h3>
                                        <p className="text-sm font-medium text-gray-500">{v.subtitle}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── Team Callout ─────────────────────────────────────────────── */}
                <section className="py-24 px-6 md:px-12 text-center">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="p-12 md:p-16 rounded-[3rem] relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, #007AFF 0%, #5856D6 100%)',
                                boxShadow: '0 40px 80px rgba(0,122,255,0.25)',
                            }}
                        >
                            <div className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
                            <div className="absolute top-0 left-12 right-12 h-px"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }} />

                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 relative z-10">
                                מחפשים שותף אמיתי לדרך?
                            </h2>
                            <p className="text-lg text-white/80 mb-8 relative z-10 max-w-xl mx-auto">
                                נשמח להכיר את המוסד שלכם ולהציג פתרון מותאם אישית.
                            </p>
                            <motion.a
                                href="/contact"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-black text-[#007AFF] text-lg relative z-10"
                                style={{
                                    background: 'white',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                }}
                            >
                                בואו נדבר
                            </motion.a>
                        </motion.div>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
};

export default AboutPage;
