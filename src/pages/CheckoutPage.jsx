/* eslint-disable */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import PageTransition from '../components/PageTransition';
import { trackEvent } from '../App';
import {
    ArrowLeft, ArrowRight, CheckCircle, Building2, Phone, MessageSquare,
    Sparkles, ShoppingBag, Trash2,
    MessageCircle, Mail, PhoneCall, Send, Star, Zap
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: 'המוסד שלך', icon: Building2 },
    { id: 2, label: 'יצירת קשר', icon: Phone },
    { id: 3, label: 'פרטים', icon: MessageSquare },
];

const ROLES = ['מנהל/ת', 'סגן/ית מנהל', 'מורה', 'IT / מחשוב', 'רכש / גזברות', 'אחר'];
const INSTITUTION_TYPES = ['יסודי', 'חטיבת ביניים', 'תיכון', 'אוניברסיטה / מכללה', 'עירייה / מוניציפלי', 'גן ילדים', 'אחר'];
const BUDGET_RANGES = ['עד ₪10,000', '₪10,000–50,000', '₪50,000–150,000', '₪150,000+', 'לא רלוונטי כרגע'];
const URGENCY_OPTS = [
    { id: 'flexible', label: 'גמיש', sub: 'ללא לחץ זמן', icon: '😊' },
    { id: 'month',    label: 'תוך חודש', sub: 'תכנון שנת לימודים', icon: '📅' },
    { id: 'urgent',   label: 'דחוף', sub: 'צריך בשבוע הקרוב', icon: '⚡' },
];
const CONTACT_PREFS = [
    { id: 'whatsapp', label: 'וואטסאפ', Icon: MessageCircle, color: '#25D366' },
    { id: 'phone',    label: 'שיחה',    Icon: PhoneCall,      color: '#007AFF' },
    { id: 'email',    label: 'מייל',    Icon: Mail,           color: '#5856D6' },
];
const BEST_TIMES = [
    { id: 'morning',   label: 'בוקר', sub: '08:00–12:00' },
    { id: 'afternoon', label: 'צהריים', sub: '12:00–16:00' },
    { id: 'evening',   label: 'אחה"צ', sub: '16:00–20:00' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Chip({ label, sub, icon, active, onClick, color }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex-1 min-w-[100px] flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center"
            style={{
                borderColor: active ? (color || '#007AFF') : '#E5E5EA',
                background:  active ? `${color || '#007AFF'}12` : '#FAFAFA',
            }}
        >
            {icon && <span className="text-xl">{icon}</span>}
            <span className="text-[12px] font-black text-[#1D1D1F]">{label}</span>
            {sub && <span className="text-[10px] text-[#86868B] font-medium">{sub}</span>}
        </button>
    );
}

function FormField({ label, type = 'text', value, onChange, placeholder, dir = 'rtl', required }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">{label}{required && <span className="text-[#FF375F] ml-1">*</span>}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                dir={dir}
                className="w-full h-12 px-4 rounded-2xl border-2 border-[#E5E5EA] bg-white text-[#1D1D1F] font-medium text-sm outline-none transition-all focus:border-[#007AFF] focus:shadow-[0_0_0_4px_rgba(0,122,255,0.12)]"
            />
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
    const { cartItems, clearCart, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();
    const { getSetting, isVisible } = useSettings();
    const allowPayments = isVisible('allow_payments', false);

    const [step, setStep]         = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quoteId, setQuoteId]   = useState('');
    const [errors, setErrors]     = useState({});

    const [form, setForm] = useState({
        // Step 1
        contactName: '',
        contactRole: '',
        institution: '',
        institutionType: '',
        // Step 2
        phone: '',
        email: '',
        preferredContact: 'whatsapp',
        bestTime: 'morning',
        // Step 3
        budgetRange: '',
        urgency: 'flexible',
        notes: '',
    });

    const set = useCallback((key) => (val) => setForm(p => ({ ...p, [key]: val })), []);

    const subtotal = useMemo(() =>
        (cartItems ?? []).reduce((sum, item) => {
            const raw = item.salePrice ?? item.price;
            const p = Number(String(raw).replace(/[^0-9.]/g, ''));
            return sum + (p || 0) * (item.qty ?? 1);
        }, 0),
    [cartItems]);

    const validate = useCallback(() => {
        const e = {};
        if (step === 1) {
            if (!form.contactName.trim()) e.contactName = 'שדה חובה';
            if (!form.institution.trim()) e.institution = 'שדה חובה';
            if (!form.contactRole) e.contactRole = 'בחר תפקיד';
            if (!form.institutionType) e.institutionType = 'בחר סוג מוסד';
        }
        if (step === 2) {
            if (!form.phone.trim()) e.phone = 'שדה חובה';
            if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'מייל לא תקין';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }, [step, form]);

    const next = useCallback(() => {
        if (!validate()) return;
        setStep(s => Math.min(s + 1, 3));
    }, [validate]);

    const back = useCallback(() => {
        setErrors({});
        setStep(s => Math.max(s - 1, 1));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const id = `Q-${Date.now().toString(36).toUpperCase().slice(-6)}`;
            const now = new Date();
            const quote = {
                id,
                type: 'quote',
                dateTs: now.getTime(),
                date: now.toLocaleDateString('he-IL'),
                time: now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                // Contact
                contactName:      form.contactName,
                contactRole:      form.contactRole,
                institution:      form.institution,
                institutionType:  form.institutionType,
                email:            form.email,
                phone:            form.phone,
                preferredContact: form.preferredContact,
                bestTime:         form.bestTime,
                // Extra
                budgetRange:      form.budgetRange,
                urgency:          form.urgency,
                notes:            form.notes,
                // Cart
                items: (cartItems ?? []).map(i => ({
                    id: i.id, title: i.title, price: i.price, image: i.image || i.imageUrl || '',
                    category: i.category, qty: i.qty ?? 1,
                })),
                subtotal,
                // Admin fields
                status: 'חדש',
                adminNotes: [],
                history: [{ status: 'חדש', date: now.toLocaleDateString('he-IL'), time: now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }],
            };
            await setDoc(doc(db, 'quotes', id), quote);
            trackEvent('quote_submitted', { value: subtotal, items: quote.items.length, institution_type: form.institutionType });
            setQuoteId(id);
            clearCart();
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }, [form, cartItems, subtotal, clearCart, validate]);

    const waMsg = encodeURIComponent(`שלום! שלחתי הצעה ${quoteId} דרך האתר. אשמח לתיאום 🙏`);
    const waUrl = `https://wa.me/${getSetting('whatsapp_number', '972585856356')}?text=${waMsg}`;

    // Empty cart guard
    if (!submitted && (!cartItems || cartItems.length === 0)) {
        return (
            <PageTransition>
                <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-[#F5F5F7] px-6" dir="rtl">
                    <ShoppingBag size={64} className="text-[#C7C7CC]" strokeWidth={1} />
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-[#1D1D1F] mb-2">העגלה ריקה</h2>
                        <p className="text-[#86868B] font-medium">הוסף מוצרים לעגלה לפני שמגישים הצעה.</p>
                    </div>
                    <Link to="/catalog" className="px-8 py-4 bg-[#007AFF] text-white font-black rounded-full text-sm shadow-xl">
                        לקטלוג המוצרים
                    </Link>
                </div>
            </PageTransition>
        );
    }

    // ── Success screen ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <PageTransition>
                <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-6 py-16" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-lg w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center"
                    >
                        {/* Check animation */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 500, damping: 25 }}
                            className="w-24 h-24 bg-gradient-to-br from-[#34C759] to-[#30D158] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"
                        >
                            <CheckCircle size={44} className="text-white" strokeWidth={2.5} />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F5F5F7] rounded-full text-[11px] font-black text-[#86868B] uppercase tracking-widest mb-4">
                                מזהה הצעה: {quoteId}
                            </div>
                            <h2 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">
                                הצעתך התקבלה! 🎉
                            </h2>
                            <p className="text-[#86868B] text-base font-medium leading-relaxed mb-8">
                                נציג NextClass יחזור אליך {form.bestTime === 'morning' ? 'בשעות הבוקר' : form.bestTime === 'afternoon' ? 'בשעות הצהריים' : 'אחרי הצהריים'} דרך {form.preferredContact === 'whatsapp' ? 'וואטסאפ' : form.preferredContact === 'phone' ? 'שיחה טלפונית' : 'מייל'}.<br />
                                <strong className="text-[#1D1D1F]">זמן מענה: עד 4 שעות בימי עסקים.</strong>
                            </p>

                            {/* Next steps */}
                            <div className="text-right space-y-3 mb-8 bg-[#F5F5F7] rounded-2xl p-5">
                                {[
                                    { n: '1', t: 'קיבלנו את פרטי הצעתך', s: 'מעובדת כרגע על ידי הצוות שלנו' },
                                    { n: '2', t: 'ניצור איתך קשר', s: `דרך ${form.preferredContact === 'whatsapp' ? 'וואטסאפ' : form.preferredContact === 'phone' ? 'טלפון' : 'מייל'}` },
                                    { n: '3', t: 'נציג מומחה יתאים לך הצעה', s: 'מותאמת אישית לתקציב ולצרכים שלך' },
                                ].map(s => (
                                    <div key={s.n} className="flex items-center gap-4">
                                        <div className="w-7 h-7 rounded-full bg-[#007AFF] text-white font-black text-xs flex items-center justify-center shrink-0">{s.n}</div>
                                        <div>
                                            <p className="font-black text-[13px] text-[#1D1D1F]">{s.t}</p>
                                            <p className="text-[11px] text-[#86868B]">{s.s}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-white text-sm shadow-xl"
                                    style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}>
                                    <MessageCircle size={18} />
                                    דברו איתנו עכשיו בוואטסאפ
                                </a>
                                <Link to="/catalog"
                                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors">
                                    <ArrowRight size={15} />
                                    המשך לגלות מוצרים
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </PageTransition>
        );
    }

    // ── Main checkout layout ──────────────────────────────────────────────────
    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-16" dir="rtl">
                <div className="max-w-6xl mx-auto px-4 md:px-8">

                    {/* Page header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-[11px] font-black text-[#007AFF] uppercase tracking-widest mb-4 shadow-sm">
                            <Sparkles size={10} strokeWidth={3} />
                            {allowPayments ? 'צ׳ק-אאוט ותשלום' : 'בניית הצעת מחיר'}
                        </div>
                        <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tight mb-2">
                            {allowPayments ? 'השלמת הרכישה' : 'נבנה את הפתרון המושלם עבורך'}
                        </h1>
                        <p className="text-[#86868B] font-medium">
                            {allowPayments
                                ? 'מלא את הפרטים לאישור ההזמנה ולמעבר לתשלום.'
                                : 'מלא את הפרטים ונציג שלנו יחזור עם הצעה מותאמת אישית.'}
                        </p>
                    </div>

                    {/* Main 2-col grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

                        {/* ── Left: Form area ──────────────────────────────── */}
                        <div>
                            {/* Step progress */}
                            <div className="flex items-center gap-0 mb-8 bg-white rounded-2xl p-4 shadow-sm">
                                {STEPS.map((s, i) => {
                                    const Icon = s.icon;
                                    const done  = step > s.id;
                                    const active = step === s.id;
                                    return (
                                        <div key={s.id} className="flex-1 flex items-center">
                                            <div className="flex items-center gap-2.5 flex-1">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                                                    done   ? 'bg-[#34C759] text-white' :
                                                    active ? 'bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.4)]' :
                                                             'bg-[#F5F5F7] text-[#C7C7CC]'
                                                }`}>
                                                    {done ? <CheckCircle size={16} strokeWidth={3} /> : <Icon size={16} strokeWidth={2.5} />}
                                                </div>
                                                <span className={`text-[12px] font-black hidden sm:block ${active ? 'text-[#007AFF]' : done ? 'text-[#34C759]' : 'text-[#C7C7CC]'}`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-500 ${step > s.id ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Step form card */}
                            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1"
                                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                                            className="p-8 md:p-10"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-10 h-10 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center">
                                                    <Building2 size={20} className="text-[#007AFF]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-[#1D1D1F]">המוסד שלך</h2>
                                                    <p className="text-[12px] text-[#86868B]">ספר לנו על המוסד ועל תפקידך</p>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <FormField label="שם מלא" value={form.contactName} onChange={set('contactName')} placeholder="ישראל ישראלי" required />
                                                {errors.contactName && <p className="text-[11px] text-[#FF375F] -mt-3 font-bold">{errors.contactName}</p>}

                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-2">תפקיד <span className="text-[#FF375F]">*</span></label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ROLES.map(r => (
                                                            <button key={r} type="button" onClick={() => set('contactRole')(r)}
                                                                className={`px-4 py-2 rounded-full text-[12px] font-bold border-2 transition-all cursor-pointer ${form.contactRole === r ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:border-[#007AFF]/30'}`}>
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {errors.contactRole && <p className="text-[11px] text-[#FF375F] mt-1 font-bold">{errors.contactRole}</p>}
                                                </div>

                                                <FormField label="שם המוסד" value={form.institution} onChange={set('institution')} placeholder="בית ספר / עירייה / מכללה..." required />
                                                {errors.institution && <p className="text-[11px] text-[#FF375F] -mt-3 font-bold">{errors.institution}</p>}

                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-2">סוג מוסד <span className="text-[#FF375F]">*</span></label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {INSTITUTION_TYPES.map(t => (
                                                            <button key={t} type="button" onClick={() => set('institutionType')(t)}
                                                                className={`px-4 py-2 rounded-full text-[12px] font-bold border-2 transition-all cursor-pointer ${form.institutionType === t ? 'bg-[#5856D6] border-[#5856D6] text-white' : 'bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:border-[#5856D6]/30'}`}>
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {errors.institutionType && <p className="text-[11px] text-[#FF375F] mt-1 font-bold">{errors.institutionType}</p>}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="step2"
                                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                                            className="p-8 md:p-10"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-10 h-10 bg-[#BF5AF2]/10 rounded-2xl flex items-center justify-center">
                                                    <Phone size={20} className="text-[#BF5AF2]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-[#1D1D1F]">יצירת קשר</h2>
                                                    <p className="text-[12px] text-[#86868B]">איך הכי נוח לך שנחזור אליך?</p>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <FormField label="טלפון" type="tel" value={form.phone} onChange={set('phone')} placeholder="050-0000000" dir="ltr" required />
                                                        {errors.phone && <p className="text-[11px] text-[#FF375F] mt-1 font-bold">{errors.phone}</p>}
                                                    </div>
                                                    <div>
                                                        <FormField label="מייל" type="email" value={form.email} onChange={set('email')} placeholder="name@school.ac.il" dir="ltr" required />
                                                        {errors.email && <p className="text-[11px] text-[#FF375F] mt-1 font-bold">{errors.email}</p>}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-3">אמצעי קשר מועדף</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {CONTACT_PREFS.map(cp => {
                                                            const Icon = cp.Icon;
                                                            const active = form.preferredContact === cp.id;
                                                            return (
                                                                <button key={cp.id} type="button" onClick={() => set('preferredContact')(cp.id)}
                                                                    className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all cursor-pointer"
                                                                    style={{ borderColor: active ? cp.color : '#E5E5EA', background: active ? `${cp.color}10` : '#FAFAFA' }}>
                                                                    <Icon size={22} style={{ color: active ? cp.color : '#86868B' }} />
                                                                    <span className="text-[12px] font-black" style={{ color: active ? cp.color : '#86868B' }}>{cp.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-3">שעת יצירת קשר מועדפת</label>
                                                    <div className="flex gap-3">
                                                        {BEST_TIMES.map(bt => (
                                                            <Chip key={bt.id} label={bt.label} sub={bt.sub}
                                                                active={form.bestTime === bt.id}
                                                                onClick={() => set('bestTime')(bt.id)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div key="step3"
                                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                                            className="p-8 md:p-10"
                                        >
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="w-10 h-10 bg-[#FF9F0A]/10 rounded-2xl flex items-center justify-center">
                                                    <Sparkles size={20} className="text-[#FF9F0A]" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-[#1D1D1F]">ספר לנו עוד (אופציונלי)</h2>
                                                    <p className="text-[12px] text-[#86868B]">ייעוץ מותאם ממש עבורך — ניתן לדלג</p>
                                                </div>
                                            </div>

                                            <div className="space-y-5">
                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-3">טווח תקציב משוער</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {BUDGET_RANGES.map(b => (
                                                            <button key={b} type="button" onClick={() => set('budgetRange')(form.budgetRange === b ? '' : b)}
                                                                className={`px-4 py-2 rounded-full text-[12px] font-bold border-2 transition-all cursor-pointer ${form.budgetRange === b ? 'bg-[#FF9F0A] border-[#FF9F0A] text-white' : 'bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:border-[#FF9F0A]/30'}`}>
                                                                {b}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest block mb-3">דחיפות הרכישה</label>
                                                    <div className="flex gap-3">
                                                        {URGENCY_OPTS.map(u => (
                                                            <Chip key={u.id} label={u.label} sub={u.sub} icon={u.icon}
                                                                color={u.id === 'urgent' ? '#FF375F' : u.id === 'month' ? '#FF9F0A' : '#34C759'}
                                                                active={form.urgency === u.id}
                                                                onClick={() => set('urgency')(u.id)} />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">הערות / דרישות מיוחדות</label>
                                                    <textarea
                                                        value={form.notes}
                                                        onChange={e => set('notes')(e.target.value)}
                                                        placeholder="ספר לנו על הצרכים המיוחדים שלך, מגבלות התקנה, כמויות גדולות במיוחד וכו׳..."
                                                        rows={4}
                                                        className="w-full px-4 py-3 rounded-2xl border-2 border-[#E5E5EA] bg-white text-[#1D1D1F] font-medium text-sm outline-none transition-all focus:border-[#007AFF] focus:shadow-[0_0_0_4px_rgba(0,122,255,0.12)] resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Step nav buttons */}
                                <div className="px-8 md:px-10 pb-8 flex items-center justify-between gap-4 border-t border-[#F5F5F7] pt-6">
                                    {step > 1 ? (
                                        <button type="button" onClick={back}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors cursor-pointer">
                                            <ArrowRight size={15} />
                                            חזרה
                                        </button>
                                    ) : (
                                        <Link to="/catalog"
                                            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
                                            <ArrowRight size={15} />
                                            חזור לקטלוג
                                        </Link>
                                    )}

                                    {step < 3 ? (
                                        <button type="button" onClick={next}
                                            className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm text-white bg-[#007AFF] hover:bg-blue-600 transition-colors shadow-xl cursor-pointer">
                                            המשך
                                            <ArrowLeft size={15} />
                                        </button>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex items-center gap-2 px-8 py-3 rounded-full font-black text-sm text-white shadow-xl cursor-pointer"
                                            style={{ background: submitting ? '#C7C7CC' : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' }}
                                        >
                                            {submitting ? 'שולח...' : allowPayments ? 'אשר הזמנה ועבור לתשלום' : 'שלח הצעת מחיר'}
                                            <Send size={14} />
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Right: Sticky cart summary ────────────────────── */}
                        <div className="lg:sticky lg:top-28">
                            <div className="rounded-[2rem] overflow-hidden shadow-xl"
                                style={{ background: 'linear-gradient(160deg, #1C1C1E 0%, #2C2C2E 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>

                                {/* Header */}
                                <div className="px-6 pt-6 pb-4 border-b border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-black text-[#636366] uppercase tracking-widest">סל הקניות שלך</span>
                                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#007AFF]/20 text-[#007AFF]">
                                            {(cartItems ?? []).reduce((s, i) => s + (i.qty ?? 1), 0)} פריטים
                                        </span>
                                    </div>
                                    <p className="text-white font-black text-lg">הצעת המחיר שלך</p>
                                </div>

                                {/* Items */}
                                <div className="px-4 py-4 space-y-3 max-h-72 overflow-y-auto">
                                    {(cartItems ?? []).map(item => (
                                        <motion.div key={item.id} layout
                                            className="flex items-center gap-3 p-3 rounded-2xl"
                                            style={{ background: 'rgba(255,255,255,0.05)' }}>
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                                                <img src={item.image || item.imageUrl} alt={item.title}
                                                    className="w-full h-full object-cover"
                                                    onError={e => { e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=200'; }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-[12px] line-clamp-1">{item.title}</p>
                                                <p className="text-[#636366] text-[10px] font-medium">₪{Number(item.price).toLocaleString()} × {item.qty ?? 1}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => decreaseQuantity(item.id)} className="w-6 h-6 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center hover:bg-white/20 cursor-pointer">−</button>
                                                <span className="text-white font-black text-[12px] w-5 text-center">{item.qty ?? 1}</span>
                                                <button onClick={() => increaseQuantity(item.id)} className="w-6 h-6 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center hover:bg-white/20 cursor-pointer">+</button>
                                                <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 cursor-pointer mr-1">
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Total + info */}
                                <div className="px-6 py-5 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[#636366] text-sm font-bold">סה"כ משוער</span>
                                        <span className="text-white font-black text-2xl tracking-tight">₪{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {[
                                            { icon: Star, text: 'מחיר סופי לפי הצעה מותאמת', color: '#FF9F0A' },
                                            { icon: Zap, text: 'מענה מנציג תוך 4 שעות', color: '#34C759' },
                                            { icon: CheckCircle, text: 'ייעוץ חינמי ללא התחייבות', color: '#007AFF' },
                                        ].map(({ icon: Icon, text, color }) => (
                                            <div key={text} className="flex items-center gap-2.5">
                                                <Icon size={13} style={{ color }} strokeWidth={2.5} />
                                                <span className="text-[11px] font-bold text-[#86868B]">{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
