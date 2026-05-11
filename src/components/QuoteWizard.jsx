import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSettings } from '../context/SettingsContext';

const IconSchool = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10V19a1 1 0 001 1h14a1 1 0 001-1v-9M4 10l8-6 8 6M4 10H2m20 0h-2M9 19v-5a1 1 0 011-1h4a1 1 0 011 1v5" />
    </svg>
);
const IconGrad = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
);
const IconAcademy = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9l9-7 9 7v12M3 21h18M9 21v-6h6v6M12 2v5" />
    </svg>
);
const IconScreen = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);
const IconLab = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v10.5a3.5 3.5 0 007 0V3M9 3h6M6.5 21h11M8 3H6m12 0h2" />
    </svg>
);
const IconSoftware = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
const IconSuccess = () => (
    <svg className="w-8 h-8 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SelectionCard = ({ title, icon, isSelected, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2.5 transition-all duration-200 w-full relative overflow-hidden ${isSelected
            ? 'bg-[#007AFF]/10 ring-2 ring-[#007AFF]/50 ring-inset shadow-sm'
            : 'bg-white shadow-sm hover:shadow-md hover:ring-1 hover:ring-[#007AFF]/30 ring-inset'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#007AFF]'}`}>
            {icon}
        </div>
        <span className={`font-bold text-[13px] ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>
            {title}
        </span>
        {isSelected && (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#007AFF] flex items-center justify-center"
            >
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </motion.div>
        )}
    </motion.button>
);

const PRICE_MATRIX = {
    elementary: { screens: '14,500', labs: '22,000', software: '7,800' },
    high:       { screens: '26,000', labs: '41,000', software: '13,500' },
    academy:    { screens: '48,000', labs: '82,000', software: '24,000' },
};

const QuoteWizard = () => {
    const { getSetting } = useSettings();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [institution, setInstitution] = useState('');
    const [need, setNeed] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [leadSaved, setLeadSaved] = useState(false);

    const content = useMemo(() => ({
        eyebrow:      getSetting('quote_eyebrow', 'כלי חינמי'),
        title:        getSetting('quote_title', 'בונים לכם הצעת מחיר בדקה'),
        desc:         getSetting('quote_desc', 'שתי שאלות בלבד — ונתאים לכם חבילה מושלמת.'),
        step1Title:   getSetting('quote_step1_title', 'מה המוסד שלכם?'),
        step2Title:   getSetting('quote_step2_title', 'מה הצורך המרכזי?'),
        thinkingMsg:  getSetting('quote_thinking_msg', 'מחשבים...'),
        successTitle: getSetting('quote_success_title', 'החבילה המומלצת עבורכם'),
        successDesc:  getSetting('quote_success_desc', 'על סמך הבחירות שלכם, הכנו הצעה ראשונית מותאמת אישית.'),
        priceLabel:   getSetting('quote_price_label', 'הצעת מחיר ראשונית'),
        priceNote:    getSetting('quote_price_note', '*לפני מע״מ, כולל התקנה והדרכה'),
    }), [getSetting]);

    const dynamicPrice = PRICE_MATRIX[institution]?.[need] || getSetting('quote_price_value', '28,500');
    const bizPhone = getSetting('biz_phone', '058-5856356');

    const saveLead = async (inst, nd) => {
        if (leadSaved) return;
        setLeadSaved(true);
        try {
            const id = `LEAD-${Date.now()}`;
            await setDoc(doc(db, 'leads', id), {
                id, institution: inst, need: nd,
                dateTs: Date.now(),
                date: new Date().toLocaleDateString('he-IL'),
                status: 'חדש', source: 'quote_wizard',
            });
        } catch {}
    };

    // Auto-advance: selecting in step 1 → moves to step 2 after short delay
    // Selecting in step 2 → triggers calculation and step 3
    const handleInstitutionSelect = (value) => {
        setInstitution(value);
        setTimeout(() => setStep(2), 280);
    };

    const handleNeedSelect = (value) => {
        setNeed(value);
        setIsCalculating(true);
        setStep(3);
        saveLead(institution, value);
        setTimeout(() => setIsCalculating(false), 1800);
    };

    const handleBack = () => {
        if (step > 1) { setStep(step - 1); setIsCalculating(false); }
    };

    const stepVariants = {
        enter:  { opacity: 0, x: 24 },
        center: { opacity: 1, x: 0 },
        exit:   { opacity: 0, x: -24 }
    };

    return (
        <section className="w-full py-16 bg-brand-surface">
            <div className="bg-brand-light p-6 md:p-10 rounded-3xl max-w-3xl mx-auto relative overflow-hidden">

                {/* Header */}
                <div className="text-center mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#007AFF] block mb-2">{content.eyebrow}</span>
                    <h2 className="text-2xl md:text-3xl font-black text-brand-dark mb-2 tracking-tighter leading-tight">
                        {content.title}
                    </h2>
                    <p className="text-sm text-[#6E6E73] font-normal">{content.desc}</p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map(s => (
                        <motion.div
                            key={s}
                            animate={{
                                width: s === step ? 24 : 8,
                                backgroundColor: s <= step ? '#007AFF' : '#E5E5EA',
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="h-2 rounded-full"
                        />
                    ))}
                </div>

                {/* Steps */}
                <div className="min-h-[180px] flex items-center justify-center">
                    <AnimatePresence mode="wait">

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.25 }}
                                className="w-full"
                            >
                                <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-4 tracking-tight">
                                    {content.step1Title}
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <SelectionCard title="יסודי"    icon={<IconSchool />}  isSelected={institution === 'elementary'} onClick={() => handleInstitutionSelect('elementary')} />
                                    <SelectionCard title="על-יסודי" icon={<IconGrad />}    isSelected={institution === 'high'}        onClick={() => handleInstitutionSelect('high')} />
                                    <SelectionCard title="אקדמיה"   icon={<IconAcademy />} isSelected={institution === 'academy'}    onClick={() => handleInstitutionSelect('academy')} />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.25 }}
                                className="w-full"
                            >
                                <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-4 tracking-tight">
                                    {content.step2Title}
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <SelectionCard title="מסכים חכמים"  icon={<IconScreen />}   isSelected={need === 'screens'}  onClick={() => handleNeedSelect('screens')} />
                                    <SelectionCard title="מעבדות STEM"  icon={<IconLab />}      isSelected={need === 'labs'}     onClick={() => handleNeedSelect('labs')} />
                                    <SelectionCard title="תוכנה ורישוי" icon={<IconSoftware />} isSelected={need === 'software'} onClick={() => handleNeedSelect('software')} />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={stepVariants}
                                initial="enter" animate="center" exit="exit"
                                transition={{ duration: 0.25 }}
                                className="w-full text-center"
                            >
                                {isCalculating ? (
                                    <div className="flex flex-col items-center gap-4 py-6">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="w-10 h-10 border-3 border-gray-200 border-t-[#007AFF] rounded-full"
                                            style={{ borderWidth: 3 }}
                                        />
                                        <p className="text-sm text-gray-400 font-medium">{content.thinkingMsg}</p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4 }}
                                        className="flex flex-col items-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.08) 100%)',
                                                border: '1.5px solid rgba(0,122,255,0.20)',
                                            }}
                                        >
                                            <IconSuccess />
                                        </motion.div>

                                        <h3 className="text-lg font-black text-brand-dark mb-1 tracking-tight">
                                            {content.successTitle}
                                        </h3>
                                        <p className="text-[13px] text-gray-400 mb-5 max-w-xs mx-auto leading-relaxed">
                                            {content.successDesc}
                                        </p>

                                        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm w-full max-w-xs mx-auto mb-5 border border-gray-100">
                                            <div className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest mb-1">{content.priceLabel}</div>
                                            <div className="text-3xl font-black text-[#1D1D1F] tracking-tighter">₪{dynamicPrice}</div>
                                            <div className="text-[11px] text-gray-400 font-medium mt-1">{content.priceNote}</div>
                                        </div>

                                        <div className="flex gap-3 w-full max-w-xs mx-auto">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                onClick={() => navigate('/checkout')}
                                                className="flex-1 bg-[#007AFF] text-white py-3 rounded-xl font-bold text-[13px] shadow-[0_6px_12px_rgb(0_122_255/0.25)] transition-all"
                                            >
                                                המשך לבקשת הצעה
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                onClick={() => window.open(`tel:${bizPhone}`)}
                                                className="flex-1 bg-white text-[#1D1D1F] py-3 rounded-xl font-bold text-[13px] border border-gray-200 hover:border-[#007AFF] transition-all"
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

                {/* Back button (steps 2–3 only) */}
                {step > 1 && (
                    <div className="flex justify-start mt-4">
                        <button
                            onClick={handleBack}
                            className="text-[12px] font-bold text-gray-400 hover:text-brand-dark transition-colors px-2 py-1"
                        >
                            ← חזור
                        </button>
                    </div>
                )}

                {step === 3 && !isCalculating && (
                    <div className="text-center mt-3">
                        <button
                            onClick={() => { setStep(1); setInstitution(''); setNeed(''); setLeadSaved(false); }}
                            className="text-[11px] text-gray-400 hover:text-[#007AFF] transition-colors font-medium"
                        >
                            חישוב מחדש
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default QuoteWizard;
