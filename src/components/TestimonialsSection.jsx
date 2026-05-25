import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const StarRating = ({ rating }) => (
    <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-[#FF9500]' : 'text-gray-200'}`}
                fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const TestimonialCard = ({ testimonial, delay }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-8% 0px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
            className="flex flex-col bg-white rounded-3xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
            dir="rtl"
        >
            {/* Quote mark decoration */}
            <div className="absolute top-5 left-5 text-6xl font-serif leading-none pointer-events-none select-none"
                style={{ color: `${testimonial.color}12`, fontFamily: 'Georgia, serif' }}>
                &#x201C;
            </div>

            <StarRating rating={testimonial.rating} />

            <p className="text-[#1D1D1F] text-[15px] font-medium leading-relaxed mb-6 flex-1">
                {testimonial.quote}
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[16px] shrink-0"
                    style={{ background: `linear-gradient(135deg, ${testimonial.color} 0%, ${testimonial.color}99 100%)` }}
                >
                    {testimonial.avatar}
                </div>
                <div>
                    <p className="font-bold text-[#1D1D1F] text-[13px] leading-tight">{testimonial.name}</p>
                    <p className="text-[11px] text-[#86868B] font-medium">{testimonial.role}</p>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: testimonial.color }}>{testimonial.school}</p>
                </div>
            </div>
        </motion.div>
    );
};

const TestimonialsSection = () => {
    const { getSetting } = useSettings();
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: '-5% 0px' });

    const testimonials = [
        {
            quote: getSetting('tst_1_quote', 'מאז שהתקנו את המסכים האינטראקטיביים של NextClass, רמת המעורבות של התלמידים עלתה פלאים. המורים מתלהבים, ההורים מדברים על זה — ואנחנו רואים תוצאות.'),
            name: getSetting('tst_1_name', 'רחל לוי'),
            role: getSetting('tst_1_role', 'מנהלת בית ספר יסודי'),
            school: getSetting('tst_1_school', 'בית ספר "אורות" – תל אביב'),
            rating: 5,
            avatar: getSetting('tst_1_name', 'רחל לוי').charAt(0),
            color: '#007AFF',
        },
        {
            quote: getSetting('tst_2_quote', 'ביצענו מכרז ו-NextClass לא רק ניצחו במחיר — הם ניצחו בשירות. הייתה נוכחות אישית, ליווי מקצועי, ועמידה בכל לוחות הזמנים. נדיר.'),
            name: getSetting('tst_2_name', 'מנחם כהן'),
            role: getSetting('tst_2_role', 'מנהל רכש עיריית רמת גן'),
            school: getSetting('tst_2_school', 'עיריית רמת גן'),
            rating: 5,
            avatar: getSetting('tst_2_name', 'מנחם כהן').charAt(0),
            color: '#34C759',
        },
        {
            quote: getSetting('tst_3_quote', 'הקמנו מעבדת STEM שלמה תוך שלושה שבועות. הצוות של NextClass הגיע לאתר, הדריך את המורים, ועד היום זמין לכל שאלה. שותפות אמיתית.'),
            name: getSetting('tst_3_name', 'ד"ר יוסי אברהם'),
            role: getSetting('tst_3_role', 'סמנכ"ל אקדמי'),
            school: getSetting('tst_3_school', 'מכללת צפת'),
            rating: 5,
            avatar: getSetting('tst_3_name', 'ד"ר יוסי אברהם').charAt(0),
            color: '#5856D6',
        },
        {
            quote: getSetting('tst_4_quote', 'פיתרון מקצה לקצה — ממצגת מכירות ועד ההתקנה האחרונה בכיתה. אין ספק שנמשיך לעבוד עם NextClass בכל פרויקט עתידי של הרשת.'),
            name: getSetting('tst_4_name', 'שרית מזרחי'),
            role: getSetting('tst_4_role', 'מנהלת פדגוגית'),
            school: getSetting('tst_4_school', 'רשת אורט ישראל'),
            rating: 5,
            avatar: getSetting('tst_4_name', 'שרית מזרחי').charAt(0),
            color: '#FF9500',
        },
    ];

    return (
        <section className="w-full py-20 px-6 md:px-12 bg-[#F5F5F7]" dir="rtl">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-14"
                >
                    <span className="inline-block text-[10px] font-black text-[#007AFF] tracking-widest uppercase mb-4 bg-[#007AFF]/08 px-4 py-1.5 rounded-full">
                        {getSetting('tst_eyebrow', 'לקוחות מספרים')}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter leading-tight mb-4">
                        {getSetting('tst_header_title', '800+ מוסדות חינוך בחרו בנו')}
                    </h2>
                    <p className="text-[16px] text-[#86868B] font-medium max-w-xl mx-auto">
                        {getSetting('tst_header_desc', 'מבתי ספר יסודיים ועד אוניברסיטאות — שותפות ארוכת טווח בכל שלב.')}
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {testimonials.map((t, i) => (
                        <TestimonialCard key={i} testimonial={t} delay={i * 0.08} />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        { value: getSetting('tst_stat1_val', 'ייעוץ חינם'), label: getSetting('tst_stat1_lbl', 'ללא התחייבות') },
                        { value: getSetting('tst_stat2_val', '24 שעות'), label: getSetting('tst_stat2_lbl', 'מענה להצעת מחיר') },
                        { value: getSetting('tst_stat3_val', 'איכות גבוהה'), label: getSetting('tst_stat3_lbl', 'הציוד המתקדם ביותר') },
                        { value: getSetting('tst_stat4_val', 'מחירי יבואן'), label: getSetting('tst_stat4_lbl', 'ישירות ללא מתווכים') },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 text-center border border-gray-100 shadow-sm">
                            <div className="text-xl font-black text-[#007AFF] tracking-tight mb-1 leading-tight">{stat.value}</div>
                            <div className="text-[11px] font-bold text-[#86868B]">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
