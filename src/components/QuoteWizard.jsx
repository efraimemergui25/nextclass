import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

// ─── SVG Icons replacing emojis ────────────────────────────────────────────────
const IconSchool = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10V19a1 1 0 001 1h14a1 1 0 001-1v-9M4 10l8-6 8 6M4 10H2m20 0h-2M9 19v-5a1 1 0 011-1h4a1 1 0 011 1v5" />
    </svg>
);
const IconGrad = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
);
const IconAcademy = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9l9-7 9 7v12M3 21h18M9 21v-6h6v6M12 2v5" />
    </svg>
);
const IconScreen = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const IconLab = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v10.5a3.5 3.5 0 007 0V3M9 3h6M6.5 21h11M8 3H6m12 0h2" />
    </svg>
);
const IconSoftware = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
const IconSuccess = () => (
    <svg className="w-10 h-10 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ─── SelectionCard with SVG icon ───────────────────────────────────────────────
const SelectionCard = ({ title, icon, isSelected, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={`rounded-3xl p-6 md:p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden ${isSelected
            ? 'bg-brand-blue/10 shadow-md ring-2 ring-brand-blue/50 ring-inset'
            : 'bg-white shadow-sm hover:shadow-xl'
            }`}
    >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#007AFF]'}`}>
            {icon}
        </div>
        <span className={`font-bold text-lg ${isSelected ? 'text-brand-blue' : 'text-[#1D1D1F]'}`}>
            {title}
        </span>
    </motion.button>
);

const QuoteWizard = () => {
    const { getSetting } = useSettings();
    const [step, setStep] = useState(1);
    const [institution, setInstitution] = useState('');
    const [need, setNeed] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const totalSteps = 3;

    const content = useMemo(() => ({
        eyebrow: getSetting('quote_eyebrow', 'כלי חינמי'),
        title:   getSetting('quote_title', 'בונים לכם הצעת מחיר בדקה'),
        desc:    getSetting('quote_desc', 'ענו על שתי שאלות קצרות ונתאים לכם חבילה מושלמת.'),
        step1Title: getSetting('quote_step1_title', 'איזה מוסד אתם מייצגים?'),
        step2Title: getSetting('quote_step2_title', 'מה הצורך המרכזי?'),
        thinkingMsg: getSetting('quote_thinking_msg', 'מחשבים את החבילה המושלמת עבורכם...'),
        successTitle: getSetting('quote_success_title', 'החבילה המומלצת עבורכם'),
        successDesc: getSetting('quote_success_desc', 'על סמך הבחירות שלכם, הכנו הצעה ראשונית עם הציוד והתוכנה המתאימים ביותר למוסד שלכם.'),
        priceLabel: getSetting('quote_price_label', 'הצעת מחיר ראשונית'),
        priceValue: getSetting('quote_price_value', '28,500'),
        priceNote: getSetting('quote_price_note', '*לפני מע״מ, כולל התקנה והדרכה'),
    }), [getSetting]);

    const handleNext = () => {
        if (step === 2) {
            setIsCalculating(true);
            setStep(3);
            setTimeout(() => setIsCalculating(false), 2500);
        } else if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) { setStep(step - 1); setIsCalculating(false); }
    };

    const canProceed = (step === 1 && institution) || (step === 2 && need);

    const stepVariants = {
        enter: { opacity: 0, x: 30 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -30 }
    };

    return (
        <section className="w-full py-24 bg-brand-surface">
            <div className="bg-brand-light p-8 md:p-16 lg:p-20 rounded-3xl max-w-4xl mx-auto relative overflow-hidden">

                {/* Section Title */}
                <div className="text-center mb-12">
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#007AFF] block mb-3">{content.eyebrow}</span>
                    <h2 className="text-4xl md:text-5xl font-black text-brand-dark mb-4 tracking-tighter leading-[1.1]">
                        {content.title}
                    </h2>
                    <p className="text-body font-normal">
                        {content.desc}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-200 rounded-full mb-12 overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-blue rounded-full"
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                    />
                </div>

                {/* Steps Content */}
                <div className="min-h-[280px] flex items-center justify-center">
                    <AnimatePresence mode="wait">

                        {/* Step 1 */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <h3 className="text-2xl md:text-3xl font-black text-brand-dark text-center mb-8 tracking-tighter">
                                    {content.step1Title}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <SelectionCard title="יסודי" icon={<IconSchool />} isSelected={institution === 'elementary'} onClick={() => setInstitution('elementary')} />
                                    <SelectionCard title="על-יסודי" icon={<IconGrad />} isSelected={institution === 'high'} onClick={() => setInstitution('high')} />
                                    <SelectionCard title="אקדמיה" icon={<IconAcademy />} isSelected={institution === 'academy'} onClick={() => setInstitution('academy')} />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2 */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <h3 className="text-2xl md:text-3xl font-black text-brand-dark text-center mb-8 tracking-tighter">
                                    {content.step2Title}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <SelectionCard title="מסכים חכמים" icon={<IconScreen />} isSelected={need === 'screens'} onClick={() => setNeed('screens')} />
                                    <SelectionCard title="מעבדות STEM" icon={<IconLab />} isSelected={need === 'labs'} onClick={() => setNeed('labs')} />
                                    <SelectionCard title="תוכנה ורישוי" icon={<IconSoftware />} isSelected={need === 'software'} onClick={() => setNeed('software')} />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3 */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full text-center"
                            >
                                {isCalculating ? (
                                    <div className="flex flex-col items-center gap-6 py-8">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                            className="w-14 h-14 border-4 border-gray-200 border-t-brand-blue rounded-full"
                                        />
                                        <p className="text-lg text-gray-500 font-medium">{content.thinkingMsg}</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex flex-col items-center"
                                    >
                                        {/* Premium success indicator — replaces 🎉 emoji */}
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.08) 100%)',
                                                border: '1.5px solid rgba(0,122,255,0.20)',
                                            }}
                                        >
                                            <IconSuccess />
                                        </motion.div>

                                        <h3 className="text-2xl md:text-3xl font-black text-brand-dark mb-3">
                                            {content.successTitle}
                                        </h3>
                                        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                            {content.successDesc}
                                        </p>
                                        <div className="bg-white rounded-3xl p-8 shadow-sm w-full max-w-sm mx-auto mb-8 border border-gray-50">
                                            <div className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-2">{content.priceLabel}</div>
                                            <div className="text-4xl font-black text-[#1D1D1F] tracking-tighter mb-1">₪{content.priceValue}</div>
                                            <div className="text-sm text-gray-400 font-medium mt-2">{content.priceNote}</div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
                                            <motion.button
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => alert('הצעת המחיר נשלחה לכתובת המייל שלכם!\n\nנציג שלנו יחזור אליכם תוך 24 שעות.')}
                                                className="flex-1 bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-base shadow-[0_8px_16px_rgb(0_122_255/0.2)] hover:shadow-[0_12px_24px_rgb(0_122_255/0.4)] transition-all duration-300"
                                            >
                                                הורד הצעת מחיר
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => window.open('tel:0546398257')}
                                                className="flex-1 bg-white text-[#1D1D1F] py-4 rounded-2xl font-bold text-base border-2 border-gray-200 hover:border-[#007AFF] hover:shadow-md transition-all duration-300"
                                            >
                                                דברו עם יועץ
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Navigation */}
                {step < 3 && (
                    <div className="flex justify-between items-center mt-12">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`font-bold px-6 py-3 rounded-xl transition-colors ${step === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-brand-dark hover:bg-white'}`}
                        >
                            ← חזור
                        </button>
                        <motion.button
                            onClick={handleNext}
                            disabled={!canProceed}
                            whileHover={canProceed ? { scale: 1.03 } : {}}
                            whileTap={canProceed ? { scale: 0.97 } : {}}
                            className={`font-bold px-8 py-3 rounded-2xl transition-all ${canProceed ? 'bg-brand-blue text-white hover:bg-blue-600 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            הבא →
                        </motion.button>
                    </div>
                )}

                {step === 3 && !isCalculating && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => { setStep(1); setInstitution(''); setNeed(''); }}
                            className="text-sm text-gray-400 hover:text-brand-blue transition-colors font-medium"
                        >
                            רוצים לחשב מחדש? התחילו שוב
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default QuoteWizard;
