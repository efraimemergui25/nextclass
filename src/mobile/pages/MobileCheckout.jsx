import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
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
function OrderSuccess({ onHome }) {
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

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', fontFamily: SF, direction: 'rtl',
            background: c.bg, textAlign: 'center',
        }}>
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                style={{
                    width: 90, height: 90, borderRadius: 99,
                    background: 'linear-gradient(135deg, #34C759, #28A745)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24, boxShadow: '0 8px 32px rgba(52,199,89,0.35)',
                }}
            >
                <Check size={44} color="#fff" strokeWidth={3} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{ width: '100%', maxWidth: 360 }}
            >
                <h1 style={{ fontSize: 26, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', marginBottom: 10 }}>
                    ההזמנה נשלחה!
                </h1>
                <p style={{ fontSize: 15, color: c.text3, lineHeight: 1.6, marginBottom: 8 }}>
                    תודה רבה — קיבלנו את הבקשה שלך
                </p>
                <p style={{ fontSize: 14, color: c.text3, lineHeight: 1.6, marginBottom: 32 }}>
                    נחזור אליך תוך 24 שעות עם הצעת מחיר מותאמת
                </p>

                <div style={{ background: c.surface, borderRadius: 18, padding: '16px 20px', marginBottom: 28, boxShadow: c.cardShadow, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShoppingBag size={18} color="#34C759" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: c.text }}>הצוות שלנו קיבל את הפנייה</p>
                            <p style={{ fontSize: 12, color: c.text3 }}>זמן תגובה ממוצע: עד 24 שעות</p>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={onHome}
                    style={{
                        width: '100%', height: 54, borderRadius: 16,
                        background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 6px 24px rgba(0,122,255,0.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                >
                    חזרה לדף הבית
                    <ChevronLeft size={18} />
                </motion.button>
            </motion.div>
        </div>
    );
}

export default function MobileCheckout() {
    const navigate = useNavigate();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { colors: c } = useTheme();
    const [step,    setStep]    = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState(false);
    const [form,    setForm]    = useState({
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
                dateTs: Date.now(), ts: serverTimestamp(),
            });
            clearCart();
            setSuccess(true);
        } catch {
            haptic('error');
            setError('שגיאה בשליחת ההזמנה. אנא נסה שנית.');
        }
        setLoading(false);
    };

    if (success) return <OrderSuccess onHome={() => navigate('/')} />;

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
