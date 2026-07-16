import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const TestimonialsSection = () => {
    const { getSetting } = useSettings();
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: '-5% 0px' });

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
                        {getSetting('tst_eyebrow', 'מה שמייחד אותנו')}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter leading-tight mb-4">
                        {getSetting('tst_header_title', 'למה בוחרים ב-NextClass')}
                    </h2>
                    <p className="text-[16px] text-[#86868B] font-medium max-w-xl mx-auto">
                        {getSetting('tst_header_desc', 'שירות ישיר, מחיר שקוף ועמידה בזמנים — בכל שלב.')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
