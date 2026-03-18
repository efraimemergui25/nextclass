import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const SuccessStoriesPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const testimonials = [
        {
            quote: "השימוש במסכי nextclass העלה את רמת המעורבות של התלמידים בצורה יוצאת דופן. זה פשוט עולם אחר.",
            name: "ד״ר רונית כהן",
            role: "מנהלת תיכון עירוני ה׳, תל אביב",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
        },
        {
            quote: "ההתקנה הייתה מהירה, ההדרכה הייתה מקצועית, והתוצאה — מעבדת STEM שהפכה לגאווה של בית הספר.",
            name: "יוסי לוי",
            role: "סגן מנהל, בית ספר יסודי ״אופק״, חיפה",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
        },
        {
            quote: "עברנו ל-nextclass אחרי שנים של ספקים מאכזבים. ההבדל מורגש בכל שיעור — גם המורים וגם הילדים מרוצים.",
            name: "מיכל ברקוביץ׳",
            role: "מנהלת רכש, רשת אורט",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100"
        },
        {
            quote: "השילוט הדיגיטלי בקמפוס שלנו הפך ל-Landmark. סטודנטים ומבקרים תמיד עוצרים להסתכל.",
            name: "פרופ׳ אריאל שמיר",
            role: "דיקן הנדסה, אוניברסיטת אריאל",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
        },
        {
            quote: "מ-nextclass קיבלנו לא רק ציוד — קיבלנו שותף אמיתי. הם מבינים את השטח, מבינים את האתגרים.",
            name: "שרה אברהם",
            role: "מפקחת טכנולוגיות חינוך, משרד החינוך",
            avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100"
        },
        {
            quote: "הזמנת הרכש הייתה חלקה ומהירה. הם מכירים את הביורוקרטיה של המגזר הציבורי ויודעים לעבוד אתה.",
            name: "עומר נחום",
            role: "מנהל תפעול, עיריית באר שבע",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
        }
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-light pt-32 pb-24 w-full">

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-20 px-6"
                >
                    <h1 className="text-5xl md:text-6xl font-black text-brand-dark mb-4 tracking-tight">
                        ההצלחה שלהם, הגאווה שלנו.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed">
                        למעלה מ-500 בתי ספר כבר שינו את פני הלמידה עם nextclass.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1400px] mx-auto px-6 md:px-12"
                >
                    {testimonials.map((t, idx) => (
                        <motion.div
                            key={idx}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                            }}
                            className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 relative group"
                        >
                            {/* Quote Icon */}
                            <span className="text-6xl text-gray-100 absolute top-6 right-6 font-serif leading-none select-none pointer-events-none">
                                ״
                            </span>

                            {/* Quote Content */}
                            <p className="text-lg italic text-gray-600 mb-8 leading-relaxed relative z-10">
                                {t.quote}
                            </p>

                            {/* Author Info */}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-full bg-brand-light overflow-hidden shrink-0 ring-2 ring-gray-100">
                                    <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                        src={t.avatar}
                                        alt={t.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-brand-dark">{t.name}</div>
                                    <div className="text-sm text-gray-400">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </PageTransition>
    );
};

export default SuccessStoriesPage;
