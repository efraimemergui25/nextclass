import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PersonalizationContext = createContext(null);

// ─── Schema labels (exported for use in wizard & display) ─────────────────────
export const ROLES = {
    teacher:     { label: 'מורה',        emoji: '👩‍🏫' },
    admin:       { label: 'מנהל',        emoji: '🏫' },
    procurement: { label: 'רכז רכש',    emoji: '📋' },
    it:          { label: 'איש IT',      emoji: '💻' },
    other:       { label: 'אחר',         emoji: '👤' },
};

export const INSTITUTION_TYPES = {
    school:       { label: 'בית ספר',      emoji: '🏫' },
    kindergarten: { label: 'גן ילדים',     emoji: '🌈' },
    university:   { label: 'אוניברסיטה',   emoji: '🎓' },
    college:      { label: 'מכללה',        emoji: '📚' },
    training:     { label: 'מוסד הכשרה',   emoji: '🏛️' },
    other:        { label: 'אחר',          emoji: '🏢' },
};

export const STUDENT_COUNTS = {
    'under50':   'עד 50',
    '50-200':    '50–200',
    '200-500':   '200–500',
    '500-1000':  '500–1,000',
    'over1000':  'מעל 1,000',
};

export const LOCATIONS = {
    center:    'מרכז הארץ',
    north:     'צפון',
    south:     'דרום',
    jerusalem: 'ירושלים',
    abroad:    'חו"ל',
};

export const SUBJECTS = [
    { key: 'math',      label: 'מתמטיקה',  emoji: '🔢' },
    { key: 'science',   label: 'מדעים',    emoji: '🔬' },
    { key: 'stem',      label: 'STEM',     emoji: '🚀' },
    { key: 'computers', label: 'מחשבים',   emoji: '💻' },
    { key: 'languages', label: 'שפות',     emoji: '📖' },
    { key: 'art',       label: 'אומנות',   emoji: '🎨' },
    { key: 'sport',     label: 'ספורט',    emoji: '⚽' },
    { key: 'general',   label: 'כללי',     emoji: '🏫' },
];

export const TECH_GOALS = [
    { key: 'improve_classroom', label: 'שיפור הכיתה',    emoji: '📺' },
    { key: 'stem',              label: 'חינוך STEM',      emoji: '🧪' },
    { key: 'accessibility',     label: 'נגישות',          emoji: '♿' },
    { key: 'remote_learning',   label: 'למידה מרחוק',     emoji: '🌐' },
    { key: 'school_management', label: 'ניהול מוסדי',     emoji: '📊' },
];

export const BUDGET_RANGES = {
    'under2k':  'עד ₪2,000',
    '2k-10k':   '₪2,000–10,000',
    '10k-50k':  '₪10,000–50,000',
    'over50k':  'מעל ₪50,000',
};

export const TECH_LEVELS = {
    beginner:     { label: 'מתחיל',   desc: 'מחפש פתרון פשוט' },
    intermediate: { label: 'בינוני',  desc: 'מכיר טכנולוגיה' },
    advanced:     { label: 'מתקדם',   desc: 'מיישם עצמאי' },
};

// ─── Product relevance scoring ────────────────────────────────────────────────
function scoreProduct(product, prefs) {
    if (!prefs) return 0;
    let score = 0;
    const { subjects = [], techGoals = [], budgetRange, institutionType } = prefs;
    const cat   = (product.category || '').toLowerCase();
    const title = (product.title    || '').toLowerCase();

    // Subject / goal → category match
    if (subjects.includes('stem') || techGoals.includes('stem')) {
        if (cat.includes('stem') || title.includes('stem') || cat.includes('מדע')) score += 3;
    }
    if (subjects.includes('computers') || subjects.includes('math')) {
        if (cat.includes('מחשב') || cat.includes('tablet') || cat.includes('לוח')) score += 2;
    }
    if (techGoals.includes('improve_classroom')) {
        if (cat.includes('מסך') || cat.includes('display') || cat.includes('מקרן') || cat.includes('projector')) score += 3;
    }
    if (techGoals.includes('remote_learning')) {
        if (cat.includes('וידאו') || cat.includes('שידור') || cat.includes('web')) score += 2;
    }
    if (techGoals.includes('accessibility')) {
        if (title.includes('נגיש') || cat.includes('audio')) score += 2;
    }

    // Budget match (±1 tier also partial score)
    const price = product.salePrice ?? product.price ?? 0;
    const inRange = (lo, hi) => price >= lo && price <= hi;
    if (budgetRange === 'under2k'  && inRange(0, 2000))       score += 3;
    if (budgetRange === '2k-10k'   && inRange(2000, 10000))   score += 3;
    if (budgetRange === '10k-50k'  && inRange(10000, 50000))  score += 3;
    if (budgetRange === 'over50k'  && price >= 50000)          score += 3;

    // Institution type
    if (institutionType === 'kindergarten' && (title.includes('גן') || price < 3000)) score += 2;
    if (institutionType === 'university'   && (cat.includes('מחשב') || cat.includes('מעבדה'))) score += 2;
    if (institutionType === 'school'       && cat.includes('כיתה')) score += 2;

    // Bestsellers / featured bonus
    if (product.isFeatured) score += 1;
    if (product.isBestseller) score += 1;

    return score;
}

// ─── Build AI context string for concierge ────────────────────────────────────
export function buildAiContext(prefs, firstName) {
    if (!prefs?.onboardingCompleted) return null;
    const lines = [];
    if (firstName)              lines.push(`שם: ${firstName}`);
    if (prefs.role)             lines.push(`תפקיד: ${ROLES[prefs.role]?.label || prefs.role}`);
    if (prefs.institutionType) {
        let inst = INSTITUTION_TYPES[prefs.institutionType]?.label || prefs.institutionType;
        if (prefs.studentCount) inst += ` (${STUDENT_COUNTS[prefs.studentCount] || prefs.studentCount} תלמידים)`;
        if (prefs.location)     inst += `, ${LOCATIONS[prefs.location] || prefs.location}`;
        lines.push(`מוסד: ${inst}`);
    }
    if (prefs.subjects?.length) {
        const lbls = SUBJECTS.filter(s => prefs.subjects.includes(s.key)).map(s => s.label);
        lines.push(`תחומים: ${lbls.join(', ')}`);
    }
    if (prefs.techGoals?.length) {
        const lbls = TECH_GOALS.filter(g => prefs.techGoals.includes(g.key)).map(g => g.label);
        lines.push(`מטרות: ${lbls.join(', ')}`);
    }
    if (prefs.budgetRange) lines.push(`תקציב: ${BUDGET_RANGES[prefs.budgetRange] || prefs.budgetRange}`);
    if (prefs.techLevel)   lines.push(`רמת טכנולוגיה: ${TECH_LEVELS[prefs.techLevel]?.label || prefs.techLevel}`);
    return lines.join('\n');
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PersonalizationProvider({ children }) {
    const { user, userDoc, firstLogin, dismissFirstLogin } = useAuth();
    const [showOnboarding, setShowOnboarding] = useState(false);

    const preferences    = userDoc?.preferences || null;
    const isOnboardingDone = !!(preferences?.onboardingCompleted);

    // Trigger onboarding for new users or users without preferences
    useEffect(() => {
        if (!user) { setShowOnboarding(false); return; }
        if (!userDoc) return; // wait for Firestore doc to load
        if (isOnboardingDone) return;
        // First login fires immediately (after a brief settle delay),
        // returning users without prefs fire after a slightly longer delay
        const delay = firstLogin ? 900 : 1800;
        const t = setTimeout(() => setShowOnboarding(true), delay);
        return () => clearTimeout(t);
    }, [user, userDoc, firstLogin, isOnboardingDone]);

    const dismissOnboarding = useCallback(() => {
        setShowOnboarding(false);
        dismissFirstLogin?.();
    }, [dismissFirstLogin]);

    const completeOnboarding = useCallback(() => {
        // Preferences are saved by OnboardingWizard via AuthContext.updatePreferences.
        // Here we just close the modal and dismiss the first-login state.
        setShowOnboarding(false);
        dismissFirstLogin?.();
    }, [dismissFirstLogin]);

    // AI context string — passed to SmartConcierge system prompt
    const aiContext = useMemo(() => {
        const firstName = userDoc?.displayName?.split(/\s+/)[0] || '';
        return buildAiContext(preferences, firstName);
    }, [preferences, userDoc?.displayName]);

    // Rank products by relevance to this user's profile
    const getPersonalizedProducts = useCallback((products) => {
        if (!preferences?.onboardingCompleted || !products?.length) return products;
        return [...products]
            .map(p => ({ ...p, _score: scoreProduct(p, preferences) }))
            .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
    }, [preferences]);

    // One-line context badge: "מורה | בית ספר"
    const greetingContext = useMemo(() => {
        if (!preferences?.onboardingCompleted) return null;
        const role = ROLES[preferences.role]?.label;
        const inst = INSTITUTION_TYPES[preferences.institutionType]?.label;
        return [role, inst].filter(Boolean).join(' · ');
    }, [preferences]);

    return (
        <PersonalizationContext.Provider value={{
            preferences,
            isOnboardingDone,
            showOnboarding,
            setShowOnboarding,
            dismissOnboarding,
            completeOnboarding,
            aiContext,
            getPersonalizedProducts,
            greetingContext,
        }}>
            {children}
        </PersonalizationContext.Provider>
    );
}

export const usePersonalization = () => useContext(PersonalizationContext);
