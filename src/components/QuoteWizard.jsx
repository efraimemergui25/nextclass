import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SelectionCard = ({ title, icon, isSelected, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={`rounded-3xl p-6 md:p-8 text-center flex flex-col items-center gap-4 transition-all duration-300 w-full hover:scale-[1.02] active:scale-[0.98] ${isSelected
            ? 'bg-brand-blue/10 shadow-md ring-2 ring-brand-blue/50 ring-inset'
            : 'bg-white shadow-sm hover:shadow-xl'
            }`}
    >
        <span className="text-5xl">{icon}</span>
        <span className={`font-bold text-lg ${isSelected ? 'text-brand-blue' : 'text-[#1D1D1F]'}`}>
            {title}
        </span>
    </motion.button>
);

const QuoteWizard = () => {
    const [step, setStep] = useState(1);
    const [institution, setInstitution] = useState('');
    const [need, setNeed] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const totalSteps = 3;

    const handleNext = () => {
        if (step === 2) {
            setIsCalculating(true);
            setStep(3);
            // Simulate calculation
            setTimeout(() => setIsCalculating(false), 2500);
        } else if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setIsCalculating(false);
        }
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
                    <h2 className="text-section mb-4">
                        בונים לכם הצעת מחיר בדקה
                    </h2>
                    <p className="text-body font-normal">
                        ענו על שתי שאלות קצרות ונתאים לכם חבילה מושלמת.
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-200 rounded-full mb-12 overflow-hidden">
                    <motion.div
                        className="h-full bg-brand-blue rounded-full"
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>

                {/* Steps Content */}
                <div className="min-h-[280px] flex items-center justify-center">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Institution Type */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <h3 className="text-2xl font-bold text-brand-dark text-center mb-8">
                                    איזה מוסד אתם מייצגים?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <SelectionCard
                                        title="יסודי"
                                        icon="🏫"
                                        isSelected={institution === 'elementary'}
                                        onClick={() => setInstitution('elementary')}
                                    />
                                    <SelectionCard
                                        title="על-יסודי"
                                        icon="🎓"
                                        isSelected={institution === 'high'}
                                        onClick={() => setInstitution('high')}
                                    />
                                    <SelectionCard
                                        title="אקדמיה"
                                        icon="🏛️"
                                        isSelected={institution === 'academy'}
                                        onClick={() => setInstitution('academy')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Primary Need */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <h3 className="text-2xl font-bold text-brand-dark text-center mb-8">
                                    מה הצורך המרכזי?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <SelectionCard
                                        title="מסכים חכמים"
                                        icon="📺"
                                        isSelected={need === 'screens'}
                                        onClick={() => setNeed('screens')}
                                    />
                                    <SelectionCard
                                        title="מעבדות STEM"
                                        icon="🔬"
                                        isSelected={need === 'labs'}
                                        onClick={() => setNeed('labs')}
                                    />
                                    <SelectionCard
                                        title="תוכנה ורישוי"
                                        icon="💻"
                                        isSelected={need === 'software'}
                                        onClick={() => setNeed('software')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Calculation + Result */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
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
                                        <p className="text-lg text-gray-500 font-medium">
                                            מחשבים את החבילה המושלמת עבורכם...
                                        </p>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div className="text-5xl mb-4">🎉</div>
                                        <h3 className="text-2xl md:text-3xl font-black text-brand-dark mb-3">
                                            החבילה המומלצת עבורכם
                                        </h3>
                                        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                            על סמך הבחירות שלכם, הכנו הצעה ראשונית עם הציוד והתוכנה המתאימים ביותר למוסד שלכם.
                                        </p>
                                        <div className="bg-white rounded-3xl p-8 shadow-sm w-full max-w-sm mx-auto mb-8 border border-gray-50">
                                            <div className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-2">הצעת מחיר ראשונית</div>
                                            <div className="text-4xl font-black text-[#1D1D1F] tracking-tighter mb-1">₪28,500</div>
                                            <div className="text-sm text-gray-400 font-medium mt-2">*לפני מע״מ, כולל התקנה והדרכה</div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
                                            <motion.button
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => alert('הצעת המחיר נשלחה לכתובת המייל שלכם! \n\nנציג שלנו יחזור אליכם תוך 24 שעות.')}
                                                className="flex-1 bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-base shadow-[0_8px_16px_rgba(0,122,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,122,255,0.4)] transition-all duration-300"
                                            >
                                                הורד הצעת מחיר
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.03, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => window.open('tel:0546398257')}
                                                className="flex-1 bg-white text-[#1D1D1F] py-4 rounded-2xl font-bold text-base border-2 border-gray-200 hover:border-[#007AFF] hover:shadow-md active:scale-[0.97] transition-all duration-300"
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

                {/* Navigation Buttons */}
                {step < 3 && (
                    <div className="flex justify-between items-center mt-12">
                        <button
                            onClick={handleBack}
                            disabled={step === 1}
                            className={`font-bold px-6 py-3 rounded-xl transition-colors ${step === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-500 hover:text-brand-dark hover:bg-white'
                                }`}
                        >
                            ← חזור
                        </button>
                        <motion.button
                            onClick={handleNext}
                            disabled={!canProceed}
                            whileHover={canProceed ? { scale: 1.03 } : {}}
                            whileTap={canProceed ? { scale: 0.97 } : {}}
                            className={`font-bold px-8 py-3 rounded-2xl transition-all ${canProceed
                                ? 'bg-brand-blue text-white hover:bg-blue-600 shadow-sm'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            הבא →
                        </motion.button>
                    </div>
                )}

                {/* Restart (on result) */}
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
