import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const glassCard = {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.75) 100%)',
    backdropFilter: 'blur(32px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(32px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.80)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.95) inset',
};

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
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center max-w-3xl mx-auto mb-20 px-6"
                >
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#007AFF] block mb-4">לקוחות מרוצים</span>
                    <h1 className="text-5xl md:text-6xl font-black text-brand-dark mb-4 tracking-tighter">
                        ההצלחה שלהם, הגאווה שלנו.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-light leading-relaxed">
                        למעלה מ-500 בתי ספר כבר שינו את פני הלמידה עם nextclass.
                    </p>
                </motion.div>

                {/* Testimonials Grid — Liquid Glass Cards */}
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.09 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto px-6 md:px-12"
                >
                    {testimonials.map((t, idx) => (
                        <motion.div
                            key={idx}
                            variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.97 },
                                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } }
                            }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                            className="p-8 rounded-3xl relative overflow-hidden group"
                            style={glassCard}
                        >
                            {/* Top inset shine */}
                            <div className="absolute top-0 left-6 right-6 h-px"
                                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />

                            {/* Ambient glow on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.04) 0%, transparent 60%)' }} />

                            {/* Quote Icon */}
                            <span className="text-7xl text-[#007AFF]/10 absolute top-4 right-6 font-serif leading-none select-none pointer-events-none">
                                ״
                            </span>

                            {/* Quote Content */}
                            <p className="text-[17px] text-gray-600 mb-8 leading-[1.75] relative z-10 font-medium">
                                {t.quote}
                            </p>

                            {/* Author Info */}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-[#007AFF]/20 shadow-sm">
                                    <img
                                        src={t.avatar}
                                        alt={t.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            if (!e.target.dataset.triedFallback) {
                                                e.target.dataset.triedFallback = 'true';
                                                e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <div className="font-black text-[#1D1D1F] tracking-tight">{t.name}</div>
                                    <div className="text-sm text-[#86868B] font-medium">{t.role}</div>
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
