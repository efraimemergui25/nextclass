import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const AboutPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const values = [
        {
            title: "חדשנות",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            title: "אמינות",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            title: "פדגוגיה",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
            )
        },
        {
            title: "שותפות",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            )
        }
    ];

    return (
        <PageTransition>
            <div className="bg-brand-surface w-full overflow-x-hidden">

                {/* Hero - Manifesto */}
                <section className="py-32 md:py-40 px-6 md:px-12 max-w-5xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-brand-dark leading-tight tracking-tighter"
                    >
                        אנחנו לא רק מוכרים טכנולוגיה. אנחנו מעצבים את עתיד החינוך בישראל.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-xl md:text-3xl text-gray-500 font-normal mt-12 leading-relaxed max-w-4xl mx-auto"
                    >
                        מתחילים מהבנת האתגר של המורה בכיתה, ובונים משם פתרון שלם — חומרה, תוכנה, הדרכה ותמיכה.
                    </motion.p>
                </section>

                {/* Story Section */}
                <section className="bg-brand-light py-24 md:py-32 w-full">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">

                            {/* Right (Visual - RTL Start) */}
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <div className="rounded-3xl shadow-2xl overflow-hidden aspect-[4/3]">
                                    <img onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }} onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                        src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&q=80&w=1200"
                                        alt="Modern Learning Lab"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </motion.div>

                            {/* Left (Text - RTL End) */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="flex flex-col"
                            >
                                <span className="text-brand-blue font-bold text-sm tracking-[0.2em] uppercase mb-4">
                                    החזון שלנו
                                </span>
                                <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-dark mb-6 leading-tight tracking-tighter">
                                    להביא את הסטנדרט של הייטק לתוך כיתות הלימוד.
                                </h3>
                                <p className="text-lg md:text-xl text-gray-500 font-normal leading-loose">
                                    הקמנו את nextclass מתוך הבנה שהפער הטכנולוגי בחינוך הוא האתגר הגדול של דורנו. אנחנו כאן כדי לגשר עליו עם הכלים המתקדמים בעולם, בליווי צמוד ומקצועי שמתאים לשטח הישראלי.
                                </p>
                                <p className="text-lg md:text-xl text-gray-500 font-normal leading-loose mt-6">
                                    הצוות שלנו מורכב ממהנדסים, פדגוגים ואנשי שטח שחיים ונושמים חינוך טכנולוגי. כל מוצר שאנו מציעים עבר בדיקות קפדניות ומותאם לסביבת הלמידה הישראלית.
                                </p>
                            </motion.div>

                        </div>
                    </div>
                </section>

                {/* Values Grid */}
                <section className="py-24 md:py-32 bg-brand-surface w-full">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16"
                        >
                            {values.map((value, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className="flex flex-col items-center text-center"
                                >
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-light rounded-2xl flex items-center justify-center text-brand-blue mb-5 shadow-sm">
                                        {value.icon}
                                    </div>
                                    <h4 className="text-xl md:text-2xl font-black text-brand-dark tracking-tight">
                                        {value.title}
                                    </h4>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

            </div>
        </PageTransition>
    );
};

export default AboutPage;
