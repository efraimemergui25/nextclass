/**
 * OnboardingWizard — 4-step personalization setup
 * Fires once after first login (or for users without prefs).
 * Collects: role · institution · subjects/goals · budget/level
 * Saves to Firestore via AuthContext.updatePreferences
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePersonalization, ROLES, INSTITUTION_TYPES, STUDENT_COUNTS, LOCATIONS, SUBJECTS, TECH_GOALS, BUDGET_RANGES, TECH_LEVELS } from '../context/PersonalizationContext';

// ─── Shared styles ─────────────────────────────────────────────────────────────
const FONT = `Heebo, -apple-system, 'SF Pro Display', sans-serif`;

const backdrop = {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.50)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
};

const card = {
    background: '#FFFFFF',
    borderRadius: 28,
    width: '100%',
    maxWidth: 520,
    maxHeight: 'calc(100dvh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 32px 100px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
    direction: 'rtl',
    fontFamily: FONT,
    position: 'relative',
};

// ─── Chip — single or multi-select item ──────────────────────────────────────
function Chip({ label, emoji, selected, onClick, small = false }) {
    return (
        <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: small ? '8px 14px' : '11px 16px',
                borderRadius: small ? 12 : 14,
                border: selected ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                background: selected ? 'rgba(0,122,255,0.08)' : '#FAFAFA',
                color: selected ? '#007AFF' : '#3C3C43',
                fontSize: small ? 13 : 14,
                fontWeight: selected ? 700 : 500,
                cursor: 'pointer',
                fontFamily: FONT,
                transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}
        >
            {emoji && <span style={{ fontSize: small ? 14 : 16 }}>{emoji}</span>}
            {label}
            {selected && <Check size={12} strokeWidth={3} style={{ flexShrink: 0 }} />}
        </motion.button>
    );
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ total, current }) {
    return (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        width: i === current ? 20 : 7,
                        background: i < current ? '#30D158' : i === current ? '#007AFF' : '#D1D1D6',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 7, borderRadius: 99 }}
                />
            ))}
        </div>
    );
}

// ─── Section header inside a step ────────────────────────────────────────────
function SectionLabel({ children }) {
    return (
        <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, marginTop: 18 }}>
            {children}
        </p>
    );
}

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ firstName, onNext, onSkip }) {
    return (
        <div style={{ padding: '44px 32px 36px', textAlign: 'center' }}>
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.05 }}
                style={{
                    width: 80, height: 80, borderRadius: 26,
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 16px 40px rgba(0,122,255,0.35)',
                }}
            >
                <Sparkles size={36} color="#fff" strokeWidth={1.6} />
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                style={{ fontSize: 28, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.15 }}
            >
                {firstName ? `היי ${firstName}! 👋` : 'ברוך הבא! 👋'}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                style={{ fontSize: 16, color: '#6E6E73', lineHeight: 1.55, marginBottom: 28, fontWeight: 500 }}
            >
                30 שניות ו-NextClass יהיה<br />מותאם <strong style={{ color: '#1D1D1F' }}>במיוחד עבורך</strong>
            </motion.p>

            {/* Benefits */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32, textAlign: 'right' }}
            >
                {[
                    { emoji: '🎯', text: 'המלצות מוצרים מותאמות אישית' },
                    { emoji: '🤖', text: 'עוזר AI שמכיר אותך ואת המוסד' },
                    { emoji: '💰', text: 'הצעות תואמות לתקציב שלך' },
                ].map(({ emoji, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F5F5F7', borderRadius: 12 }}>
                        <span style={{ fontSize: 20 }}>{emoji}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#3C3C43' }}>{text}</span>
                    </div>
                ))}
            </motion.div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNext}
                style={{
                    width: '100%', height: 54, borderRadius: 16, border: 'none',
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                    color: '#fff', fontSize: 17, fontWeight: 800,
                    cursor: 'pointer', fontFamily: FONT,
                    boxShadow: '0 8px 24px rgba(0,122,255,0.35)',
                    letterSpacing: '-0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
            >
                בואו נתחיל
                <ChevronLeft size={18} strokeWidth={2.5} />
            </motion.button>

            <button onClick={onSkip} style={{ marginTop: 14, background: 'none', border: 'none', color: '#AEAEB2', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                דלג על ההגדרות
            </button>
        </div>
    );
}

// ─── Step 1: Role ─────────────────────────────────────────────────────────────
function StepRole({ value, onChange }) {
    return (
        <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 6 }}>מה תפקידך?</h3>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 22, fontWeight: 500 }}>נתאים את ההמלצות לתפקיד שלך</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(ROLES).map(([key, { label, emoji }]) => (
                    <motion.button
                        key={key}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onChange(key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 18px', borderRadius: 16,
                            border: value === key ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                            background: value === key ? 'rgba(0,122,255,0.07)' : '#FAFAFA',
                            cursor: 'pointer', fontFamily: FONT, textAlign: 'right', width: '100%',
                        }}
                    >
                        <span style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{emoji}</span>
                        <span style={{ fontSize: 15, fontWeight: value === key ? 700 : 500, color: value === key ? '#007AFF' : '#1D1D1F', flex: 1 }}>
                            {label}
                        </span>
                        {value === key && (
                            <div style={{ width: 22, height: 22, borderRadius: 99, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Check size={12} color="#fff" strokeWidth={3} />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// ─── Step 2: Institution ──────────────────────────────────────────────────────
function StepInstitution({ values, onChange }) {
    const set = (k) => (v) => onChange({ ...values, [k]: v });
    return (
        <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 6 }}>המוסד שלך</h3>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 22, fontWeight: 500 }}>כדי להתאים פתרונות לסוג המוסד</p>

            <SectionLabel>סוג מוסד</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {Object.entries(INSTITUTION_TYPES).map(([key, { label, emoji }]) => (
                    <Chip key={key} label={label} emoji={emoji} selected={values.institutionType === key} onClick={() => set('institutionType')(key)} />
                ))}
            </div>

            <SectionLabel>גודל המוסד</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {Object.entries(STUDENT_COUNTS).map(([key, label]) => (
                    <Chip key={key} label={label} selected={values.studentCount === key} onClick={() => set('studentCount')(key)} small />
                ))}
            </div>

            <SectionLabel>מיקום</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(LOCATIONS).map(([key, label]) => (
                    <Chip key={key} label={label} selected={values.location === key} onClick={() => set('location')(key)} small />
                ))}
            </div>
        </div>
    );
}

// ─── Step 3: Subjects & Goals ─────────────────────────────────────────────────
function StepInterests({ values, onChange }) {
    const toggle = (field, key) => {
        const arr = values[field] || [];
        onChange({ ...values, [field]: arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key] });
    };
    return (
        <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 6 }}>מה מעניין אותך?</h3>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 22, fontWeight: 500 }}>בחר כמה שתרצה — נמיין את הקטלוג בשבילך</p>

            <SectionLabel>תחומי לימוד</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {SUBJECTS.map(({ key, label, emoji }) => (
                    <Chip key={key} label={label} emoji={emoji} selected={(values.subjects || []).includes(key)} onClick={() => toggle('subjects', key)} small />
                ))}
            </div>

            <SectionLabel>מטרות טכנולוגיות</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TECH_GOALS.map(({ key, label, emoji }) => (
                    <Chip key={key} label={label} emoji={emoji} selected={(values.techGoals || []).includes(key)} onClick={() => toggle('techGoals', key)} small />
                ))}
            </div>
        </div>
    );
}

// ─── Step 4: Budget & Tech level ──────────────────────────────────────────────
function StepBudget({ values, onChange }) {
    const set = (k) => (v) => onChange({ ...values, [k]: v });
    return (
        <div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 6 }}>עוד פרט אחד 🎯</h3>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 22, fontWeight: 500 }}>נציג מוצרים בתקציב הנכון עבורך</p>

            <SectionLabel>תקציב ממוצע לרכישה</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                {Object.entries(BUDGET_RANGES).map(([key, label]) => (
                    <motion.button
                        key={key}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => set('budgetRange')(key)}
                        style={{
                            padding: '12px 18px', borderRadius: 14, textAlign: 'right',
                            border: values.budgetRange === key ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                            background: values.budgetRange === key ? 'rgba(0,122,255,0.07)' : '#FAFAFA',
                            color: values.budgetRange === key ? '#007AFF' : '#1D1D1F',
                            fontSize: 14, fontWeight: values.budgetRange === key ? 700 : 500,
                            cursor: 'pointer', fontFamily: FONT, width: '100%',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                    >
                        {label}
                        {values.budgetRange === key && <Check size={14} strokeWidth={3} />}
                    </motion.button>
                ))}
            </div>

            <SectionLabel>רמת טכנולוגיה</SectionLabel>
            <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(TECH_LEVELS).map(([key, { label, desc }]) => (
                    <motion.button
                        key={key}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => set('techLevel')(key)}
                        style={{
                            flex: 1, padding: '12px 10px', borderRadius: 14, textAlign: 'center',
                            border: values.techLevel === key ? '2px solid #007AFF' : '1.5px solid #E5E5EA',
                            background: values.techLevel === key ? 'rgba(0,122,255,0.07)' : '#FAFAFA',
                            color: values.techLevel === key ? '#007AFF' : '#1D1D1F',
                            cursor: 'pointer', fontFamily: FONT,
                        }}
                    >
                        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>{label}</p>
                        <p style={{ fontSize: 11, color: values.techLevel === key ? '#5856D6' : '#AEAEB2', margin: 0, fontWeight: 500 }}>{desc}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

// ─── Step 5: Success ──────────────────────────────────────────────────────────
function StepSuccess({ firstName, onDone }) {
    return (
        <div style={{ padding: '52px 32px 44px', textAlign: 'center' }}>
            <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                style={{
                    width: 88, height: 88, borderRadius: 28,
                    background: 'linear-gradient(135deg, #30D158 0%, #34C759 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 16px 40px rgba(48,209,88,0.40)',
                }}
            >
                <Check size={44} color="#fff" strokeWidth={2.5} />
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', marginBottom: 10 }}
            >
                {firstName ? `מושלם, ${firstName}! 🎉` : 'הגדרה הושלמה! 🎉'}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: 15, color: '#6E6E73', lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}
            >
                NextClass כעת מותאם לחלוטין עבורך.<br />
                המוצרים, ההמלצות והעוזר החכם — הכל בשבילך.
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDone}
                style={{
                    width: '100%', height: 54, borderRadius: 16, border: 'none',
                    background: '#1D1D1F', color: '#fff', fontSize: 17, fontWeight: 800,
                    cursor: 'pointer', fontFamily: FONT, letterSpacing: '-0.02em',
                }}
            >
                צא לדרך ←
            </motion.button>
        </div>
    );
}

// ─── TOTAL STEPS (not counting welcome & success) ────────────────────────────
const DATA_STEPS = 4; // role · institution · interests · budget
const TOTAL_STEPS = DATA_STEPS; // for progress dots (0-based data steps)

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
    const { firstName, updatePreferences } = useAuth();
    const { showOnboarding, dismissOnboarding, completeOnboarding } = usePersonalization();

    const [phase, setPhase]   = useState('welcome'); // welcome · step · success
    const [step, setStep]     = useState(0);         // 0-3 for the 4 data steps
    const [saving, setSaving] = useState(false);
    const [dir, setDir]       = useState(1);         // 1=forward, -1=backward

    // Accumulated form data
    const [form, setForm] = useState({
        role: '',
        institutionType: '', studentCount: '', location: '',
        subjects: [], techGoals: [],
        budgetRange: '', techLevel: '',
    });

    const canAdvance = useCallback(() => {
        if (step === 0) return !!form.role;
        if (step === 1) return !!form.institutionType;
        if (step === 2) return (form.subjects.length + form.techGoals.length) > 0;
        if (step === 3) return !!form.budgetRange && !!form.techLevel;
        return true;
    }, [step, form]);

    const handleNext = useCallback(async () => {
        if (step < DATA_STEPS - 1) {
            setDir(1);
            setStep(s => s + 1);
        } else {
            // Last step → save
            setSaving(true);
            try {
                await updatePreferences(form);
                setPhase('success');
            } catch (err) {
                console.error('[Onboarding] save error', err);
            } finally {
                setSaving(false);
            }
        }
    }, [step, form, updatePreferences]);

    const handleBack = useCallback(() => {
        if (step === 0) { setPhase('welcome'); return; }
        setDir(-1);
        setStep(s => s - 1);
    }, [step]);

    if (!showOnboarding) return null;

    const variants = {
        enter: (d) => ({ opacity: 0, x: d > 0 ? 48 : -48 }),
        center: { opacity: 1, x: 0 },
        exit:   (d) => ({ opacity: 0, x: d > 0 ? -48 : 48 }),
    };

    return (
        <motion.div
            key="onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={backdrop}
        >
            <motion.div
                key="onboarding-card"
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 24 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={card}
            >
                {/* ── Welcome phase ──────────────────────────────────────── */}
                {phase === 'welcome' && (
                    <StepWelcome
                        firstName={firstName}
                        onNext={() => { setDir(1); setPhase('step'); }}
                        onSkip={dismissOnboarding}
                    />
                )}

                {/* ── Success phase ──────────────────────────────────────── */}
                {phase === 'success' && (
                    <StepSuccess firstName={firstName} onDone={completeOnboarding} />
                )}

                {/* ── Data-step phase ────────────────────────────────────── */}
                {phase === 'step' && (
                    <div style={{ padding: '28px 28px 32px' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <ProgressDots total={TOTAL_STEPS} current={step} />
                            <button
                                onClick={dismissOnboarding}
                                style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 99, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#AEAEB2', flexShrink: 0 }}
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Animated step content */}
                        <div style={{ minHeight: 340, position: 'relative', overflow: 'hidden' }}>
                            <AnimatePresence custom={dir} mode="wait">
                                <motion.div
                                    key={step}
                                    custom={dir}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                                >
                                    {step === 0 && <StepRole value={form.role} onChange={(v) => setForm(f => ({ ...f, role: v }))} />}
                                    {step === 1 && <StepInstitution values={form} onChange={(v) => setForm(f => ({ ...f, ...v }))} />}
                                    {step === 2 && <StepInterests values={form} onChange={(v) => setForm(f => ({ ...f, ...v }))} />}
                                    {step === 3 && <StepBudget values={form} onChange={(v) => setForm(f => ({ ...f, ...v }))} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    height: 50, paddingInline: 18, borderRadius: 14,
                                    background: '#F2F2F7', border: 'none', color: '#3C3C43',
                                    cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 15,
                                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                                }}
                            >
                                <ChevronRight size={16} strokeWidth={2.5} />
                                חזור
                            </button>

                            <motion.button
                                whileHover={canAdvance() ? { scale: 1.02 } : {}}
                                whileTap={canAdvance() ? { scale: 0.97 } : {}}
                                onClick={canAdvance() ? handleNext : undefined}
                                disabled={!canAdvance() || saving}
                                style={{
                                    flex: 1, height: 50, borderRadius: 14, border: 'none',
                                    background: canAdvance()
                                        ? 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)'
                                        : '#E5E5EA',
                                    color: canAdvance() ? '#fff' : '#AEAEB2',
                                    fontSize: 16, fontWeight: 800, cursor: canAdvance() ? 'pointer' : 'not-allowed',
                                    fontFamily: FONT, letterSpacing: '-0.01em',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: canAdvance() ? '0 6px 20px rgba(0,122,255,0.30)' : 'none',
                                    transition: 'background 0.15s, box-shadow 0.15s',
                                }}
                            >
                                {saving ? (
                                    <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                ) : step < DATA_STEPS - 1 ? (
                                    <>המשך <ChevronLeft size={16} strokeWidth={2.5} /></>
                                ) : (
                                    <>סיים וצא לדרך ✓</>
                                )}
                            </motion.button>
                        </div>

                        {/* Skip link */}
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <button onClick={dismissOnboarding} style={{ background: 'none', border: 'none', color: '#AEAEB2', fontSize: 12, cursor: 'pointer', fontFamily: FONT, fontWeight: 500 }}>
                                דלג — אוכל להגדיר אחר כך
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </motion.div>
    );
}
