import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const VAT = 0.17;
const STEPS = ['פרטי מוסד', 'פרטי קשר', 'אישור'];

// ─── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ onHome, onOrders, firstName, items, total }) {
    const { colors: c } = useTheme();

    useEffect(() => {
        haptic('success');
        const fire = (particleRatio, opts) => confetti({
            ...opts,
            origin: { y: 0.35 },
            particleCount: Math.floor(120 * particleRatio),
            colors: ['#007AFF', '#34C759', '#FF9F0A', '#FF375F', '#5856D6', '#ffffff'],
        });
        const t1 = setTimeout(() => {
            fire(0.35, { spread: 60, startVelocity: 45 });
            fire(0.25, { spread: 90 });
            fire(0.20, { spread: 120, decay: 0.91, scalar: 0.8 });
        }, 150);
        return () => clearTimeout(t1);
    }, []);

    const steps = [
        { n: '1', color: '#007AFF', t: 'הבקשה נקלטה', s: 'הפרטים עברו לנציג הייעודי' },
        { n: '2', color: '#5856D6', t: 'ניצור איתך קשר', s: 'תוך 4 שעות בימי עסקים' },
        { n: '3', color: '#34C759', t: 'הצעת מחיר אישית', s: 'מותאמת לצרכי המוסד שלך' },
    ];

    return (
        <div style={{
            minHeight: '100dvh', overflowY: 'auto',
            padding: '40px 20px 40px', fontFamily: SF, direction: 'rtl',
            background: c.bg, textAlign: 'center',
        }}>
            {/* Pulse + checkmark */}
            <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 28px' }}>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.7 }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0] }}
                    transition={{ delay: 0.4, duration: 1.2, repeat: 1 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 99, background: 'rgba(52,199,89,0.2)' }}
                />
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 }}
                    style={{
                        width: 96, height: 96, borderRadius: 99,
                        background: 'linear-gradient(135deg, #34C759, #28A745)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 40px rgba(52,199,89,0.4)',
                        position: 'absolute', inset: 0,
                    }}
                >
                    <Check size={48} color="#fff" strokeWidth={2.8} />
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ width: '100%', maxWidth: 380, margin: '0 auto' }}
            >
                <h1 style={{ fontSize: 28, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', marginBottom: 6, lineHeight: 1.2 }}>
                    {firstName ? `תודה, ${firstName}!` : 'תודה!'}<br />
                    <span style={{ color: '#34C759' }}>הבקשה שלך בדרך.</span>
                </h1>
                <p style={{ fontSize: 14, color: c.text3, lineHeight: 1.65, marginBottom: 24 }}>
                    נציג NextClass יחזור אליך תוך 4 שעות בימי עסקים עם הצעה מותאמת אישית.
                </p>

                {/* Items summary */}
                {(items || []).length > 0 && (
                    <div style={{ background: c.surface, borderRadius: 18, padding: '14px 16px', marginBottom: 18, boxShadow: c.cardShadow, textAlign: 'right' }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: c.text3, marginBottom: 10, letterSpacing: '0.03em' }}>
                            הפריטים שבחרת
                        </p>
                        {(items || []).slice(0, 3).map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.surface2, flexShrink: 0, overflow: 'hidden' }}>
                                    {item.image && <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: c.text3, flexShrink: 0 }}>×{item.qty || 1}</span>
                            </div>
                        ))}
                        {(items || []).length > 3 && (
                            <p style={{ fontSize: 11, color: c.text4, textAlign: 'center' }}>+ {items.length - 3} נוספים</p>
                        )}
                        <div style={{ borderTop: `0.5px solid ${c.divider}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: c.text }}>₪{(total || 0).toLocaleString()}</span>
                            <span style={{ fontSize: 12, color: c.text3 }}>סה"כ משוער</span>
                        </div>
                    </div>
                )}

                {/* Steps timeline */}
                <div style={{ background: c.surface, borderRadius: 18, padding: '16px 18px', marginBottom: 24, boxShadow: c.cardShadow, textAlign: 'right' }}>
                    {steps.map((s, i) => (
                        <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: i < steps.length - 1 ? 14 : 0, borderBottom: i < steps.length - 1 ? `0.5px solid ${c.divider}` : 'none', marginBottom: i < steps.length - 1 ? 14 : 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 99, background: s.color, color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${s.color}55` }}>
                                {s.n}
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 800, color: c.text, marginBottom: 2 }}>{s.t}</p>
                                <p style={{ fontSize: 12, color: c.text3 }}>{s.s}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onOrders}
                    style={{
                        width: '100%', height: 54, borderRadius: 16, border: 'none',
                        background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                        color: '#fff', fontSize: 16, fontWeight: 800,
                        letterSpacing: '-0.02em', cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 6px 24px rgba(0,122,255,0.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        marginBottom: 12,
                    }}
                >
                    הבקשות שלי
                    <ChevronLeft size={18} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={onHome}
                    style={{
                        width: '100%', height: 50, borderRadius: 16, border: 'none',
                        background: c.surface, color: c.text3,
                        fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        boxShadow: c.cardShadow,
                    }}
                >
                    חזרה לדף הבית
                </motion.button>
            </motion.div>
        </div>
    );
}

export default function MobileCheckout() {
    const navigate = useNavigate();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { colors: c } = useTheme();
    const { user, openAuthModal, firstName } = useAuth();
    const [step,           setStep]           = useState(0);
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState('');
    const [success,        setSuccess]        = useState(false);
    const [submittedItems, setSubmittedItems] = useState([]);
    const [form,           setForm]           = useState({
        institution: '', city: '', contactName: '', phone: '', email: '', notes: '',
    });

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const total = Math.round(cartTotal * (1 + VAT));

    const isValidPhone = (p) => /^0[2-9]\d{7,8}$/.test(p.replace(/[-\s]/g, ''));
    const isValidEmail = (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const canNext = () => {
        if (step === 0) return form.institution.trim().length >= 2 && form.city.trim().length >= 2;
        if (step === 1) return form.contactName.trim().length >= 2 && isValidPhone(form.phone) && isValidEmail(form.email);
        return true;
    };

    const fieldError = () => {
        if (step === 1 && form.phone && !isValidPhone(form.phone)) return 'מספר טלפון לא תקין (לדוגמה: 050-1234567)';
        if (step === 1 && form.email && !isValidEmail(form.email)) return 'כתובת אימייל לא תקינה';
        return '';
    };

    const handleNext = () => {
        if (!canNext()) return;
        haptic('light');
        setStep(s => s + 1);
    };

    const handleBack = () => {
        haptic('light');
        setStep(s => s - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await addDoc(collection(db, 'orders'), {
                ...form,
                customer: form.contactName,
                items: cartItems.map(i => ({
                    id: i.id, title: i.title,
                    qty: i.qty || 1, price: i.salePrice || i.price,
                })),
                total, status: 'חדש', source: 'mobile',
                userId: user?.uid || null,
                userEmail: user?.email || form.email,
                dateTs: Date.now(), ts: serverTimestamp(),
            });
            setSubmittedItems([...cartItems]);
            clearCart();
            setSuccess(true);
        } catch {
            haptic('error');
            setError('שגיאה בשליחת ההזמנה. אנא נסה שנית.');
        }
        setLoading(false);
    };

    if (!user) {
        const benefits = [
            { icon: '⚡', title: 'מענה מהיר', desc: 'נציג מוקצה לך, מגיב תוך שעות' },
            { icon: '📊', title: 'מעקב סטטוס', desc: 'ראה איפה ההצעה שלך בכל רגע' },
            { icon: '💬', title: 'צ׳אט ישיר', desc: 'תקשורת ישירה עם הנציג שלך' },
            { icon: '🎯', title: 'הצעות מותאמות', desc: 'מחירים מותאמים למוסד שלך' },
        ];
        return (
            <div style={{ minHeight: '100dvh', fontFamily: SF, direction: 'rtl', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ width: '100%', maxWidth: 400, background: c.surface, borderRadius: 32, padding: '36px 28px', textAlign: 'center', boxShadow: c.cardShadow }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                            width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 28px rgba(0,122,255,0.35)',
                        }}
                    >
                        <Lock size={34} color="#fff" />
                    </motion.div>

                    <h2 style={{ fontSize: 24, fontWeight: 900, color: c.text, letterSpacing: '-0.03em', marginBottom: 10 }}>
                        שנייה לפני שממשיכים
                    </h2>
                    <p style={{ fontSize: 15, color: c.text3, lineHeight: 1.6, marginBottom: 24 }}>
                        כדי לשלוח הצעת מחיר צריך חשבון —<br />
                        <strong style={{ color: c.text }}>לוקח שנייה, בחינם לחלוטין</strong>
                    </p>

                    <div style={{ background: c.surface2, borderRadius: 18, padding: '16px 18px', marginBottom: 24, textAlign: 'right' }}>
                        {benefits.map((b, i) => (
                            <motion.div
                                key={b.title}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: i < benefits.length - 1 ? `0.5px solid ${c.divider}` : 'none' }}
                            >
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{b.icon}</span>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: c.text, marginBottom: 1 }}>{b.title}</p>
                                    <p style={{ fontSize: 12, color: c.text3 }}>{b.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { haptic('medium'); openAuthModal(); }}
                        style={{
                            width: '100%', height: 54, borderRadius: 16, border: 'none',
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            color: '#fff', fontSize: 17, fontWeight: 800,
                            letterSpacing: '-0.02em', cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            boxShadow: '0 6px 24px rgba(0,122,255,0.32)', marginBottom: 14,
                        }}
                    >
                        הרשמה / התחברות
                    </motion.button>

                    <button
                        onClick={() => { haptic('light'); navigate(-1); }}
                        style={{ background: 'none', border: 'none', color: c.text3, fontSize: 14, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                    >
                        חזרה
                    </button>
                </motion.div>
            </div>
        );
    }

    if (success) return (
        <OrderSuccess
            onHome={() => navigate('/')}
            onOrders={() => navigate('/orders')}
            firstName={firstName}
            items={submittedItems}
            total={total}
        />
    );

    const input = {
        width: '100%', padding: '14px 16px',
        background: c.input,
        border: '1.5px solid transparent', borderRadius: 12,
        fontSize: 16, color: c.text, fontFamily: SF,
        direction: 'rtl', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    };

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100dvh', background: c.bg }}>

            {/* Fixed header */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
                background: c.surface,
                borderBottom: `0.5px solid ${c.navBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 56, paddingTop: 'env(safe-area-inset-top, 0px)',
            }}>
                {step > 0 && (
                    <motion.button whileTap={{ scale: 0.88 }} onClick={handleBack}
                        style={{
                            position: 'absolute', right: 4,
                            background: 'none', border: 'none', color: '#007AFF',
                            fontSize: 15, fontWeight: 500, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 2,
                            padding: '8px 10px', WebkitTapHighlightColor: 'transparent',
                        }}>
                        <ChevronRight size={20} /> חזרה
                    </motion.button>
                )}
                <span style={{ fontWeight: 700, fontSize: 16, color: c.text }}>{STEPS[step]}</span>
            </div>

            <div style={{ paddingTop: 68, padding: '68px 16px 40px' }}>

                {/* Step indicators */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <motion.div
                                animate={{
                                    background: i < step ? '#34C759' : i === step ? '#007AFF' : c.surface2,
                                    boxShadow: i === step ? '0 2px 12px rgba(0,122,255,0.35)' : 'none',
                                }}
                                transition={{ duration: 0.25 }}
                                style={{ width: 30, height: 30, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {i < step
                                    ? <Check size={14} color="#fff" strokeWidth={3} />
                                    : <span style={{ fontSize: 13, fontWeight: 800, color: i === step ? '#fff' : c.text4 }}>{i + 1}</span>
                                }
                            </motion.div>
                            {i < STEPS.length - 1 && (
                                <motion.div
                                    animate={{ background: i < step ? '#34C759' : c.surface2 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ width: 28, height: 2, borderRadius: 99 }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', marginBottom: 14, boxShadow: c.cardShadow }}>

                            {step === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: c.text, marginBottom: 4 }}>פרטי המוסד</h3>
                                    <input value={form.institution} onChange={set('institution')} placeholder="שם המוסד / הארגון *" style={input} />
                                    <input value={form.city} onChange={set('city')} placeholder="עיר *" style={input} />
                                    <textarea value={form.notes} onChange={set('notes')} placeholder="הערות נוספות..." rows={3} style={{ ...input, resize: 'none' }} />
                                </div>
                            )}

                            {step === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: c.text, marginBottom: 4 }}>פרטי איש קשר</h3>
                                    <input value={form.contactName} onChange={set('contactName')} placeholder="שם מלא *" style={input} />
                                    <input value={form.phone} onChange={set('phone')} placeholder="טלפון *" type="tel" dir="ltr" style={{ ...input, direction: 'ltr' }} />
                                    <input value={form.email} onChange={set('email')} placeholder="אימייל (אופציונלי)" type="email" dir="ltr" style={{ ...input, direction: 'ltr' }} />
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: c.text, marginBottom: 16 }}>סיכום הזמנה</h3>
                                    {cartItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: `0.5px solid ${c.divider}`, gap: 12 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: c.text, flexShrink: 0 }}>
                                                ₪{((item.salePrice || item.price) * (item.qty || 1)).toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: 14, color: c.text2, textAlign: 'right', lineHeight: 1.35 }}>
                                                {item.title} ×{item.qty || 1}
                                            </span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' }}>
                                        <span style={{ fontSize: 22, fontWeight: 900, color: c.text, letterSpacing: '-0.02em' }}>
                                            ₪{total.toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: c.text3 }}>סה"כ כולל מע"מ</span>
                                    </div>
                                    <div style={{ marginTop: 14, padding: '14px 16px', background: c.surface2, borderRadius: 14 }}>
                                        <p style={{ fontSize: 13, color: c.text2, lineHeight: 1.7 }}>
                                            <strong style={{ color: c.text, fontWeight: 700 }}>{form.institution}</strong> · {form.city}<br />
                                            {form.contactName} · <span dir="ltr">{form.phone}</span>
                                            {form.email ? <><br /><span dir="ltr">{form.email}</span></> : ''}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(error || fieldError()) && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, color: '#FF3B30', fontSize: 13, fontWeight: 600, textAlign: 'center' }}
                            >
                                {error || fieldError()}
                            </motion.div>
                        )}

                        {step < 2 ? (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleNext}
                                style={{
                                    width: '100%', height: 54, borderRadius: 16,
                                    background: !canNext() ? c.surface2 : 'linear-gradient(135deg, #007AFF, #0063CC)',
                                    color: !canNext() ? c.text4 : '#fff', border: 'none',
                                    fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                                    cursor: !canNext() ? 'not-allowed' : 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    boxShadow: canNext() ? '0 4px 20px rgba(0,122,255,0.28)' : 'none',
                                    transition: 'background 0.2s, box-shadow 0.2s',
                                }}
                            >
                                הבא <ChevronLeft size={18} />
                            </motion.button>
                        ) : (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    width: '100%', height: 54, borderRadius: 16,
                                    background: loading ? c.surface2 : 'linear-gradient(135deg, #34C759, #28A745)',
                                    color: loading ? c.text4 : '#fff', border: 'none',
                                    fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    boxShadow: loading ? 'none' : '0 6px 24px rgba(52,199,89,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {loading ? 'שולח הזמנה...' : <><Check size={18} strokeWidth={3} /> שלח הזמנה</>}
                            </motion.button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
