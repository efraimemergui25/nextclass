import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { Monitor, Laptop2, FlaskConical, Volume2, Wifi, Sparkles, FileText, Building2, Compass } from 'lucide-react';
import { db } from '../firebase';
import { useSettings } from '../context/SettingsContext';

// ── Institution icons ──────────────────────────────────────────────────────────
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
const IconPilot = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
);
const IconSchoolMedium = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
);
const IconDistrict = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
    </svg>
);
const IconSuccess = () => (
    <svg className="w-7 h-7 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ── Data ───────────────────────────────────────────────────────────────────────
const EQUIPMENT_OPTIONS = [
    { id: 'screens',   label: 'מסכים אינטראקטיביים', Icon: Monitor,     color: '#007AFF' },
    { id: 'computers', label: 'מחשבים לצוות ותלמידים', Icon: Laptop2,    color: '#5856D6' },
    { id: 'stem',      label: 'מעבדות STEM',           Icon: FlaskConical, color: '#FF375F' },
    { id: 'audio',     label: 'אודיו ווידאו',           Icon: Volume2,    color: '#FF9F0A' },
    { id: 'network',   label: 'תשתית ורשת',            Icon: Wifi,        color: '#34C759' },
    { id: 'all',       label: 'כל הפתרונות',           Icon: Sparkles,   color: '#BF5AF2' },
];

const BUDGET_OPTIONS = [
    { id: 'tender',    label: 'מכרז / ממשלתי', subtitle: 'תקציב מדינה או עירייה', Icon: FileText  },
    { id: 'internal',  label: 'תקציב פנימי',   subtitle: 'תקציב של המוסד עצמו',  Icon: Building2 },
    { id: 'exploring', label: 'עדיין בוחנים',  subtitle: 'שלב מחקר ובחינה',       Icon: Compass   },
];

const PRICE_MATRIX = {
    elementary: {
        pilot:    { from: '18,500', label: 'חבילת פיילוט – יסודי',  timeline: '7–10 ימי עסקים' },
        school:   { from: '72,000', label: 'חבילת בית ספר – יסודי', timeline: '3–4 שבועות' },
        district: { from: '280,000', label: 'פתרון מחוזי – יסודי',  timeline: 'לפי תכנית מפורטת' },
    },
    high: {
        pilot:    { from: '24,000',  label: 'חבילת פיילוט – תיכון',  timeline: '7–10 ימי עסקים' },
        school:   { from: '98,000',  label: 'חבילת בית ספר – תיכון', timeline: '3–4 שבועות' },
        district: { from: '390,000', label: 'פתרון מחוזי – תיכון',   timeline: 'לפי תכנית מפורטת' },
    },
    academy: {
        pilot:    { from: '35,000',  label: 'חבילת סטארטר – אקדמיה', timeline: '10–14 ימי עסקים' },
        school:   { from: '150,000', label: 'חבילת קמפוס – אקדמיה',  timeline: '4–6 שבועות' },
        district: { from: '550,000', label: 'פתרון ארגוני – אקדמיה', timeline: 'לפי תכנית מפורטת' },
    },
    other: {
        pilot:    { from: '15,000',  label: 'חבילת פיילוט – מותאמת אישית', timeline: '7–14 ימי עסקים' },
        school:   { from: '65,000',  label: 'חבילה מותאמת אישית',         timeline: 'לפי תכנית מפורטת' },
        district: { from: '250,000', label: 'פתרון מקיף – מותאם אישית',   timeline: 'לפי תכנית מפורטת' },
    },
};

const BASE_INCLUDES = {
    elementary: {
        pilot:    ['מסכים אינטראקטיביים 75" ל-1–5 כיתות', 'שירות ישיר ומקצועי לכל שלב', 'הדרכת צוות מורים מלאה', 'תמיכה טכנית 24/7'],
        school:   ['מסכים אינטראקטיביים לכל הכיתות', 'תשתית רשת בית-ספרית מהירה', 'ניהול מרכזי (MDM) לכל המכשירים', 'הדרכה שנתית + תמיכה שוטפת'],
        district: ['פריסה מלאה בכל מוסדות המחוז', 'מערכת ניהול מחוזית אחידה', 'מנהל לקוח ייעודי', 'SLA מועדף + uptime מובטח'],
    },
    high: {
        pilot:    ['מסכים אינטראקטיביים 86" ל-1–5 כיתות', 'מעבדת STEM מצוידת לפיילוט', 'הדרכת מורים ומנהלים', 'תמיכה טכנית 24/7'],
        school:   ['מסכים + מעבדות STEM לכל הכיתות', 'חדר מחשבים מודרני מצויד', 'ניהול מרכזי + רישיונות תוכנה', 'הדרכה שנתית + תמיכה שוטפת'],
        district: ['פתרון end-to-end לכל בתי הספר', 'ניהול מרכזי של כלל המוסדות', 'מנהל לקוח ייעודי + דוחות שימוש', 'SLA מועדף + uptime מובטח'],
    },
    academy: {
        pilot:    ['חדרי הוראה חכמים ל-1–5 אולמות', 'מערכת הקלטה ושידור חי', 'אינטגרציה עם מערכת הלמידה הקיימת', 'תמיכה טכנית 24/7'],
        school:   ['פתרון קמפוס מלא לכל האולמות', 'סטודיו להפקת תוכן דיגיטלי', 'מערכת ניהול תוכן ולמידה (LMS)', 'הדרכה שוטפת + תמיכה'],
        district: ['תשתית דיגיטלית ארגונית מלאה', 'אינטגרציה עם מערכות ERP/SIS', 'מנהל לקוח ייעודי', 'SLA מועדף + שירות ישיר מובטח'],
    },
    other: {
        pilot:    ['פתרון מותאם לצרכים ספציפיים', 'ייעוץ אישי ומקצועי ראשוני', 'הצעת מחיר מדויקת', 'תמיכה ישירה בכל שלב'],
        school:   ['מיפוי צרכים מלא', 'פתרון מקיף מותאם', 'ליווי אישי לאורך כל הדרך', 'תמיכה שוטפת'],
        district: ['ייעוץ ארגוני מעמיק', 'תכנון ופריסה מותאמים', 'מנהל לקוח ייעודי', 'שירות ישיר מובטח'],
    },
};

const BUDGET_NOTES = {
    tender:    'מנוסים בעבודה עם מכרזים ותקציבי מדינה — נסייע בהכנת מסמכים.',
    internal:  'נציע מסלולי תשלום גמישים המותאמים לתקציב שלכם.',
    exploring: 'נשמח לקבוע פגישת היכרות ללא התחייבות.',
};

const BENEFITS = [
    { iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", title: 'מענה תוך 24 שעות', desc: 'יועץ מומחה יחזור אליכם עם הצעה מפורטת ומדויקת' },
    { iconPath: "M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z", title: 'שירות מהיר ואישי', desc: 'מענה ישיר ומקצועי בכל שלב — ללא ביניים וללא בירוקרטיה' },
    { iconPath: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", title: 'מותאם לתקציב ציבורי', desc: 'ניסיון עם מכרזים, מימון ממשלתי ומסלולי תשלום' },
    { iconPath: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", title: '800+ מוסדות בישראל', desc: 'מבתי ספר יסודיים ועד אוניברסיטאות ומכללות' },
];

// ── Cards ──────────────────────────────────────────────────────────────────────
const SelectionCard = ({ title, subtitle, icon, isSelected, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-all duration-200 w-full relative overflow-hidden ${
            isSelected
                ? 'bg-[#007AFF]/10 ring-2 ring-[#007AFF]/50 ring-inset shadow-sm'
                : 'bg-white shadow-sm hover:shadow-md hover:ring-1 hover:ring-[#007AFF]/30 ring-inset'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#007AFF]'}`}>
            {icon}
        </div>
        <span className={`font-bold text-[13px] leading-tight ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>{title}</span>
        {subtitle && <span className="text-[11px] text-[#86868B] font-medium">{subtitle}</span>}
        {isSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#007AFF] flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </motion.div>
        )}
    </motion.button>
);

const MultiCard = ({ label, Icon, color, isSelected, onClick }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className="relative rounded-2xl p-3 flex flex-col items-center gap-2 transition-all duration-200 text-center overflow-hidden"
        style={{
            background: isSelected ? `${color}12` : 'white',
            boxShadow: isSelected ? `0 0 0 2px ${color}55` : '0 1px 4px rgba(0,0,0,0.06)',
        }}
    >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{ background: isSelected ? `${color}22` : '#F5F5F7' }}>
            <Icon size={17} style={{ color: isSelected ? color : '#86868B' }} />
        </div>
        <span className="text-[12px] font-bold leading-tight" style={{ color: isSelected ? color : '#1D1D1F' }}>
            {label}
        </span>
        {isSelected && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: color }}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </motion.div>
        )}
    </motion.button>
);

// ── Main ───────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5;

const QuoteWizard = () => {
    const { getSetting } = useSettings();
    const navigate = useNavigate();

    const [step, setStep]             = useState(1);
    const [institution, setInstitution] = useState('');
    const [equipment, setEquipment]   = useState([]);
    const [scale, setScale]           = useState('');
    const [budget, setBudget]         = useState('');
    const [contact, setContact]       = useState({ name: '', phone: '', email: '' });
    const [isCalculating, setIsCalculating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone]             = useState(false);

    const content = useMemo(() => ({
        eyebrow: getSetting('quote_eyebrow', 'כלי חינמי'),
        title:   getSetting('quote_title',   'בונים לכם הצעת מחיר בדקה'),
        desc:    getSetting('quote_desc',    'חמש שאלות — ונתאים לכם פתרון מדויק עם הצעה ראשונית.'),
    }), [getSetting]);

    const pkg          = PRICE_MATRIX[institution]?.[scale];
    const baseIncludes = BASE_INCLUDES[institution]?.[scale] || [];
    const bizPhone     = getSetting('contact_phone', '058-5856356');

    const includesList = useMemo(() => {
        const extras = [];
        if (!equipment.includes('all')) {
            if (equipment.includes('stem')      && !baseIncludes.some(i => i.includes('STEM')))    extras.push('מעבדות STEM וחדרי חדשנות מצוידים');
            if (equipment.includes('audio')     && !baseIncludes.some(i => i.includes('אודיו')))    extras.push('מערכות אודיו ווידאו לאולמות');
            if (equipment.includes('network')   && !baseIncludes.some(i => i.includes('רשת')))      extras.push('תשתית רשת מהירה + ניהול מרכזי');
            if (equipment.includes('computers') && !baseIncludes.some(i => i.includes('מחשב')))     extras.push('מחשבים לצוות ותלמידים + MDM');
        }
        const budgetNote = BUDGET_NOTES[budget];
        return [...baseIncludes, ...extras].slice(0, 5);
    }, [baseIncludes, equipment, budget]);

    const budgetNote = BUDGET_NOTES[budget] || '';

    // ── Step question text — adapts to institution ─────────────────────────────
    const scaleQuestion = institution === 'academy'
        ? 'כמה אולמות / חדרי הרצאה?'
        : 'כמה כיתות ברצונכם לצייד?';

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleInstitution = (val) => { setInstitution(val); setTimeout(() => setStep(2), 280); };

    const toggleEquipment = (id) => {
        setEquipment(prev => {
            if (id === 'all') return prev.includes('all') ? [] : ['all'];
            const without = prev.filter(e => e !== 'all');
            return without.includes(id) ? without.filter(e => e !== id) : [...without, id];
        });
    };

    const handleScale  = (val) => { setScale(val);  setTimeout(() => setStep(4), 280); };
    const handleBudget = (val) => { setBudget(val); setTimeout(() => setStep(5), 280); };

    const handleSubmit = async () => {
        if (!contact.name.trim() || !contact.phone.trim()) return;
        setSubmitting(true);
        try {
            const id = `LEAD-${Date.now()}`;
            await setDoc(doc(db, 'leads', id), {
                id, institution, equipment, scale, budget,
                name: contact.name, phone: contact.phone, email: contact.email,
                dateTs: Date.now(),
                date: new Date().toLocaleDateString('he-IL'),
                status: 'חדש', source: 'quote_wizard',
            });
        } catch {}
        setSubmitting(false);
        setIsCalculating(true);
        setDone(true);
        setTimeout(() => setIsCalculating(false), 2000);
    };

    const handleBack = () => {
        if (done) { setDone(false); setStep(5); return; }
        if (step > 1) setStep(s => s - 1);
    };

    const handleReset = () => {
        setStep(1); setInstitution(''); setEquipment([]); setScale('');
        setBudget(''); setContact({ name: '', phone: '', email: '' });
        setDone(false); setIsCalculating(false);
    };

    const stepVariants = {
        enter:  { opacity: 0, x: 20 },
        center: { opacity: 1, x: 0 },
        exit:   { opacity: 0, x: -20 },
    };
    const SPRING = { type: 'spring', stiffness: 400, damping: 30 };

    return (
        <section className="w-full py-16 bg-brand-surface px-6 md:px-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">

                    {/* ── Value props ── */}
                    <div className="w-full lg:w-1/2 text-right">
                        <span className="text-[10px] font-bold tracking-[0.22em] text-[#007AFF] block mb-3">{content.eyebrow}</span>
                        <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-4 tracking-tighter leading-tight">{content.title}</h2>
                        <p className="text-[15px] text-[#86868B] font-medium mb-10 leading-relaxed">{content.desc}</p>
                        <div className="space-y-5">
                            {BENEFITS.map((b, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={b.iconPath} />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#1D1D1F] text-[14px] mb-0.5">{b.title}</div>
                                        <div className="text-[13px] text-[#86868B] leading-relaxed">{b.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Wizard card ── */}
                    <div className="w-full lg:w-1/2 bg-[#F5F5F7] p-6 md:p-8 rounded-3xl">

                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
                                <motion.div key={s}
                                    animate={{
                                        width: s === step && !done ? 24 : 8,
                                        backgroundColor: done || s < step ? '#007AFF' : s === step ? '#007AFF' : '#E5E5EA',
                                        opacity: done || s <= step ? 1 : 0.5,
                                    }}
                                    transition={SPRING}
                                    className="h-2 rounded-full"
                                />
                            ))}
                        </div>

                        {/* Steps */}
                        <div className="min-h-[260px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">

                                {/* Step 1 — Institution */}
                                {!done && step === 1 && (
                                    <motion.div key="s1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="w-full">
                                        <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-4 tracking-tight">מה המוסד שלכם?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <SelectionCard title="יסודי"    subtitle="כיתות א'–ו'"   icon={<IconSchool />}  isSelected={institution === 'elementary'} onClick={() => handleInstitution('elementary')} />
                                            <SelectionCard title="על-יסודי" subtitle="כיתות ז'–י״ב" icon={<IconGrad />}    isSelected={institution === 'high'}        onClick={() => handleInstitution('high')} />
                                            <SelectionCard title="אקדמיה"   subtitle="מכללה / אוני'" icon={<IconAcademy />} isSelected={institution === 'academy'}    onClick={() => handleInstitution('academy')} />
                                            <SelectionCard title="אחר"      subtitle="סוג מוסד אחר"  icon={<IconAcademy />} isSelected={institution === 'other'}      onClick={() => handleInstitution('other')} />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2 — Equipment (multi-select) */}
                                {!done && step === 2 && (
                                    <motion.div key="s2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="w-full">
                                        <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-1 tracking-tight">במה תרצו לצייד?</p>
                                        <p className="text-[11px] text-[#86868B] text-center mb-4 font-medium">ניתן לבחור מספר אפשרויות</p>
                                        <div className="grid grid-cols-3 gap-2.5 mb-4">
                                            {EQUIPMENT_OPTIONS.map(({ id, label, Icon, color }) => (
                                                <MultiCard key={id} label={label} Icon={Icon} color={color}
                                                    isSelected={equipment.includes(id)} onClick={() => toggleEquipment(id)} />
                                            ))}
                                        </div>
                                        <motion.button
                                            onClick={() => equipment.length > 0 && setStep(3)}
                                            whileTap={{ scale: 0.97 }}
                                            className="w-full py-3 rounded-xl font-bold text-[14px] transition-all duration-200"
                                            style={{
                                                background: equipment.length > 0 ? '#007AFF' : '#E5E5EA',
                                                color: equipment.length > 0 ? 'white' : '#AEAEB2',
                                                boxShadow: equipment.length > 0 ? '0 6px 16px rgba(0,122,255,0.25)' : 'none',
                                                cursor: equipment.length > 0 ? 'pointer' : 'default',
                                            }}
                                        >
                                            המשך {equipment.length > 0 ? `(${equipment.length === 1 && equipment[0] === 'all' ? 'הכל' : equipment.length + ' נבחרו'})` : ''}
                                        </motion.button>
                                    </motion.div>
                                )}

                                {/* Step 3 — Scale */}
                                {!done && step === 3 && (
                                    <motion.div key="s3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="w-full">
                                        <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-4 tracking-tight">{scaleQuestion}</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <SelectionCard title="פיילוט"       subtitle="1–5 כיתות"  icon={<IconPilot />}        isSelected={scale === 'pilot'}    onClick={() => handleScale('pilot')} />
                                            <SelectionCard title="בית ספר"      subtitle="6–20 כיתות" icon={<IconSchoolMedium />} isSelected={scale === 'school'}   onClick={() => handleScale('school')} />
                                            <SelectionCard title="מחוז / ארגון" subtitle="20+ כיתות"  icon={<IconDistrict />}     isSelected={scale === 'district'} onClick={() => handleScale('district')} />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 4 — Budget */}
                                {!done && step === 4 && (
                                    <motion.div key="s4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="w-full">
                                        <p className="text-[13px] font-bold text-[#1D1D1F] text-center mb-4 tracking-tight">מה מסגרת התקציב?</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {BUDGET_OPTIONS.map(({ id, label, subtitle, Icon }) => (
                                                <SelectionCard key={id} title={label} subtitle={subtitle}
                                                    icon={<Icon className="w-6 h-6" />}
                                                    isSelected={budget === id} onClick={() => handleBudget(id)} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 5 — Contact */}
                                {!done && step === 5 && (
                                    <motion.div key="s5" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="w-full" dir="rtl">
                                        <p className="text-[13px] font-bold text-[#1D1D1F] text-right mb-4 tracking-tight">איך ניצור איתכם קשר?</p>
                                        <div className="space-y-3 mb-4">
                                            {[
                                                { key: 'name',  placeholder: 'שם מלא *',         type: 'text' },
                                                { key: 'phone', placeholder: 'טלפון / נייד *',    type: 'tel'  },
                                                { key: 'email', placeholder: 'כתובת מייל (אופציונלי)', type: 'email' },
                                            ].map(({ key, placeholder, type }) => (
                                                <input
                                                    key={key}
                                                    type={type}
                                                    placeholder={placeholder}
                                                    value={contact[key]}
                                                    onChange={e => setContact(prev => ({ ...prev, [key]: e.target.value }))}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium text-[#1D1D1F] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40 focus:border-[#007AFF]/40 transition-all"
                                                    style={{ direction: 'rtl' }}
                                                />
                                            ))}
                                        </div>
                                        <motion.button
                                            onClick={handleSubmit}
                                            whileTap={{ scale: 0.97 }}
                                            disabled={submitting || !contact.name.trim() || !contact.phone.trim()}
                                            className="w-full py-3.5 rounded-xl font-black text-[14px] text-white transition-all duration-200 flex items-center justify-center gap-2"
                                            style={{
                                                background: contact.name.trim() && contact.phone.trim() ? '#007AFF' : '#E5E5EA',
                                                color: contact.name.trim() && contact.phone.trim() ? 'white' : '#AEAEB2',
                                                boxShadow: contact.name.trim() && contact.phone.trim() ? '0 6px 16px rgba(0,122,255,0.28)' : 'none',
                                                cursor: contact.name.trim() && contact.phone.trim() ? 'pointer' : 'default',
                                            }}
                                        >
                                            {submitting ? (
                                                <>
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                                        className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                                                    שולח...
                                                </>
                                            ) : 'קבלו הצעת מחיר ראשונית'}
                                        </motion.button>
                                        <p className="text-[11px] text-[#AEAEB2] text-center mt-3 font-medium">
                                            נחזור אליכם תוך 24 שעות. ללא התחייבות.
                                        </p>
                                    </motion.div>
                                )}

                                {/* Done — Result */}
                                {done && (
                                    <motion.div key="done" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="w-full">
                                        {isCalculating ? (
                                            <div className="flex flex-col items-center gap-4 py-10">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    className="w-10 h-10 rounded-full"
                                                    style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#E5E5EA', borderTopColor: '#007AFF' }} />
                                                <p className="text-sm text-gray-400 font-medium">מחשבים את החבילה המתאימה...</p>
                                            </div>
                                        ) : (
                                            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>

                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-4 text-right">
                                                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                                                        style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.08) 100%)', border: '1.5px solid rgba(0,122,255,0.20)' }}>
                                                        <IconSuccess />
                                                    </motion.div>
                                                    <div>
                                                        <div className="font-black text-[15px] text-brand-dark tracking-tight">{pkg?.label}</div>
                                                        <div className="text-[12px] text-gray-400">מותאם לבחירות שלכם</div>
                                                    </div>
                                                </div>

                                                {/* Includes */}
                                                <div className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                                                    <div className="text-[10px] font-black text-[#86868B] tracking-widest mb-3 text-right">מה כלול בחבילה:</div>
                                                    <div className="space-y-2">
                                                        {includesList.map((item, i) => (
                                                            <div key={i} className="flex items-center gap-2.5 text-right">
                                                                <div className="w-4 h-4 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-2.5 h-2.5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </div>
                                                                <span className="text-[12px] font-medium text-[#1D1D1F]">{item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Budget note */}
                                                {budgetNote && (
                                                    <div className="bg-[#007AFF]/06 border border-[#007AFF]/15 rounded-xl px-4 py-2.5 mb-3 text-right">
                                                        <p className="text-[11px] font-medium text-[#007AFF]">{budgetNote}</p>
                                                    </div>
                                                )}

                                                {/* Price + Timeline */}
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                                        <div className="text-[9px] font-black text-[#007AFF] tracking-widest mb-1">החל מ</div>
                                                        <div className="text-xl font-black text-[#1D1D1F] tracking-tighter">₪{pkg?.from}</div>
                                                        <div className="text-[9px] text-gray-400 font-medium mt-0.5">*לפני מע״מ</div>
                                                    </div>
                                                    <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
                                                        <div className="text-[9px] font-black text-[#86868B] tracking-widest mb-1">זמן פריסה</div>
                                                        <div className="text-[13px] font-black text-[#1D1D1F] leading-tight mt-1">{pkg?.timeline}</div>
                                                    </div>
                                                </div>

                                                {/* CTAs */}
                                                <div className="flex gap-3">
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => navigate('/contact')}
                                                        className="flex-1 bg-[#007AFF] text-white py-3 rounded-xl font-bold text-[13px] shadow-[0_6px_12px_rgb(0_122_255/0.25)] transition-all cursor-pointer">
                                                        המשך לבקשת הצעה
                                                    </motion.button>
                                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                        onClick={() => window.open(`tel:${bizPhone}`)}
                                                        className="flex-1 bg-white text-[#1D1D1F] py-3 rounded-xl font-bold text-[13px] border border-gray-200 hover:border-[#007AFF] transition-all cursor-pointer">
                                                        דברו עם יועץ
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* Back + Reset */}
                        <div className="flex items-center justify-between mt-4">
                            {(step > 1 || done) ? (
                                <button onClick={handleBack}
                                    className="text-[12px] font-bold text-gray-400 hover:text-brand-dark transition-colors px-2 py-1 cursor-pointer">
                                    ← חזור
                                </button>
                            ) : <div />}
                            {done && !isCalculating && (
                                <button onClick={handleReset}
                                    className="text-[11px] text-gray-400 hover:text-[#007AFF] transition-colors font-medium cursor-pointer">
                                    חישוב מחדש
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default QuoteWizard;
