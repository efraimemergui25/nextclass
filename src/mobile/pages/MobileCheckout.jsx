import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const VAT = 0.17;
const STEPS = ['פרטי מוסד', 'פרטי קשר', 'אישור'];

const input = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(118,118,128,0.08)',
    border: '1.5px solid transparent', borderRadius: 12,
    fontSize: 16, color: '#1D1D1F', fontFamily: SF,
    direction: 'rtl', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
};

// ─── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ onHome }) {
    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '32px 24px', fontFamily: SF, direction: 'rtl',
            background: '#F2F2F7', textAlign: 'center',
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
            >
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', marginBottom: 10 }}>
                    ההזמנה נשלחה!
                </h1>
                <p style={{ fontSize: 15, color: '#86868B', lineHeight: 1.6, marginBottom: 8 }}>
                    תודה רבה — קיבלנו את הבקשה שלך
                </p>
                <p style={{ fontSize: 14, color: '#86868B', lineHeight: 1.6, marginBottom: 32 }}>
                    נחזור אליך תוך 24 שעות עם הצעת מחיר מותאמת
                </p>

                <div style={{ background: '#fff', borderRadius: 18, padding: '16px 20px', marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShoppingBag size={18} color="#34C759" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F' }}>הצוות שלנו קיבל את הפנייה</p>
                            <p style={{ fontSize: 12, color: '#86868B' }}>זמן תגובה ממוצע: עד 24 שעות</p>
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
    const [step,    setStep]    = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState(false);
    const [form,    setForm]    = useState({
        institution: '', city: '', contactName: '', phone: '', email: '', notes: '',
    });

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const total = Math.round(cartTotal * (1 + VAT));

    const canNext = () => {
        if (step === 0) return form.institution.trim() && form.city.trim();
        if (step === 1) return form.contactName.trim() && form.phone.trim();
        return true;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await addDoc(collection(db, 'orders'), {
                ...form,
                customer: form.contactName,
                items: cartItems.map(i => ({
                    id: i.id,
                    title: i.title,
                    qty: i.qty || 1,
                    price: i.salePrice || i.price,
                })),
                total,
                status: 'חדש',
                source: 'mobile',
                dateTs: Date.now(),
                ts: serverTimestamp(),
            });
            clearCart();
            setSuccess(true);
        } catch {
            setError('שגיאה בשליחת ההזמנה. אנא נסה שנית.');
        }
        setLoading(false);
    };

    if (success) return <OrderSuccess onHome={() => navigate('/')} />;

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', minHeight: '100dvh', background: '#F2F2F7' }}>

            {/* Fixed header — standalone (MobileHeader is hidden for /checkout) */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderBottom: '0.5px solid rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 56, paddingTop: 'env(safe-area-inset-top, 0px)',
            }}>
                {step > 0 && (
                    <motion.button whileTap={{ scale: 0.88 }} onClick={() => setStep(s => s - 1)}
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
                <span style={{ fontWeight: 700, fontSize: 16, color: '#1D1D1F' }}>{STEPS[step]}</span>
            </div>

            <div style={{ paddingTop: 68, padding: '68px 16px 40px' }}>

                {/* Step indicators */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <motion.div
                                animate={{
                                    background: i < step ? '#34C759' : i === step ? '#007AFF' : '#E5E5EA',
                                    boxShadow: i === step ? '0 2px 12px rgba(0,122,255,0.35)' : 'none',
                                }}
                                transition={{ duration: 0.25 }}
                                style={{ width: 30, height: 30, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {i < step
                                    ? <Check size={14} color="#fff" strokeWidth={3} />
                                    : <span style={{ fontSize: 13, fontWeight: 800, color: i === step ? '#fff' : '#AEAEB2' }}>{i + 1}</span>
                                }
                            </motion.div>
                            {i < STEPS.length - 1 && (
                                <motion.div
                                    animate={{ background: i < step ? '#34C759' : '#E5E5EA' }}
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
                        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

                            {step === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 4 }}>פרטי המוסד</h3>
                                    <input value={form.institution} onChange={set('institution')} placeholder="שם המוסד / הארגון *" style={input} />
                                    <input value={form.city} onChange={set('city')} placeholder="עיר *" style={input} />
                                    <textarea value={form.notes} onChange={set('notes')} placeholder="הערות נוספות..." rows={3} style={{ ...input, resize: 'none' }} />
                                </div>
                            )}

                            {step === 1 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 4 }}>פרטי איש קשר</h3>
                                    <input value={form.contactName} onChange={set('contactName')} placeholder="שם מלא *" style={input} />
                                    <input value={form.phone} onChange={set('phone')} placeholder="טלפון *" type="tel" dir="ltr" style={{ ...input, direction: 'ltr' }} />
                                    <input value={form.email} onChange={set('email')} placeholder="אימייל (אופציונלי)" type="email" dir="ltr" style={{ ...input, direction: 'ltr' }} />
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 16 }}>סיכום הזמנה</h3>
                                    {cartItems.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.07)', gap: 12 }}>
                                            <span style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', flexShrink: 0 }}>
                                                ₪{((item.salePrice || item.price) * (item.qty || 1)).toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: 14, color: '#3C3C43', textAlign: 'right', lineHeight: 1.35 }}>
                                                {item.title} ×{item.qty || 1}
                                            </span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' }}>
                                        <span style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                                            ₪{total.toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#86868B' }}>סה"כ כולל מע"מ</span>
                                    </div>

                                    <div style={{ marginTop: 14, padding: '14px 16px', background: '#F2F2F7', borderRadius: 14 }}>
                                        <p style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.7 }}>
                                            <strong style={{ color: '#1D1D1F', fontWeight: 700 }}>{form.institution}</strong> · {form.city}<br />
                                            {form.contactName} · <span dir="ltr">{form.phone}</span>
                                            {form.email ? <><br /><span dir="ltr">{form.email}</span></> : ''}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 12, color: '#FF3B30', fontSize: 14, fontWeight: 600, textAlign: 'center' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        {step < 2 ? (
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => canNext() && setStep(s => s + 1)}
                                style={{
                                    width: '100%', height: 54, borderRadius: 16,
                                    background: !canNext() ? '#C7C7CC' : 'linear-gradient(135deg, #007AFF, #0063CC)',
                                    color: '#fff', border: 'none',
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
                                    background: loading ? '#C7C7CC' : 'linear-gradient(135deg, #34C759, #28A745)',
                                    color: '#fff', border: 'none',
                                    fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    boxShadow: loading ? 'none' : '0 6px 24px rgba(52,199,89,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {loading ? (
                                    'שולח הזמנה...'
                                ) : (
                                    <><Check size={18} strokeWidth={3} /> שלח הזמנה</>
                                )}
                            </motion.button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
