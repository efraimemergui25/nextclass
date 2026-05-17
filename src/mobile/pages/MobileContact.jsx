import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function FloatingInput({ value, onChange, label, type = 'text', inputDir = 'rtl', multiline = false, rows = 4, c, focused, onFocus, onBlur }) {
    const float = focused || value.length > 0;
    return (
        <div style={{ position: 'relative', paddingTop: 8 }}>
            <motion.label
                animate={{ y: float ? -22 : 4, scale: float ? 0.78 : 1, color: focused ? '#007AFF' : c.text3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                style={{
                    position: 'absolute', right: 16, top: 14,
                    transformOrigin: 'right center',
                    fontSize: 15, fontWeight: 500, pointerEvents: 'none', zIndex: 2,
                    background: float ? c.surface : 'transparent', padding: float ? '0 4px' : 0,
                    borderRadius: 4, display: 'block',
                }}
            >
                {label}
            </motion.label>
            {multiline ? (
                <textarea value={value} onChange={onChange} rows={rows} onFocus={onFocus} onBlur={onBlur}
                    style={{ width: '100%', paddingTop: 22, paddingBottom: 12, paddingRight: 16, paddingLeft: 16,
                        background: c.input, border: `1.5px solid ${focused ? '#007AFF' : 'transparent'}`,
                        borderRadius: 12, fontSize: 16, color: c.text, fontFamily: SF,
                        direction: 'rtl', outline: 'none', boxSizing: 'border-box',
                        resize: 'none', transition: 'border-color 0.2s', }}
                />
            ) : (
                <input value={value} onChange={onChange} type={type} dir={inputDir} onFocus={onFocus} onBlur={onBlur}
                    style={{ width: '100%', paddingTop: 22, paddingBottom: 12, paddingRight: 16, paddingLeft: 16,
                        background: c.input, border: `1.5px solid ${focused ? '#007AFF' : 'transparent'}`,
                        borderRadius: 12, fontSize: 16, color: c.text, fontFamily: SF,
                        direction: inputDir, outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s', }}
                />
            )}
        </div>
    );
}

export default function MobileContact() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const phone   = getSetting('contact_phone', '058-5856356');
    const email   = getSetting('contact_email', 'info@nextclass.co.il');
    const address = getSetting('contact_address', 'ישראל');

    const [form,    setForm]    = useState({ name: '', phone: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [sent,    setSent]    = useState(false);
    const [fieldErr, setFieldErr] = useState('');
    const [focus, setFocus] = useState({ name: false, phone: false, message: false });

    const isValidPhone = (p) => /^0[2-9]\d{7,8}$/.test(p.replace(/[-\s]/g, ''));

    const handleChange = k => e => {
        setForm(f => ({ ...f, [k]: e.target.value }));
        setFieldErr('');
    };

    const handleFocus = k => () => setFocus(f => ({ ...f, [k]: true }));
    const handleBlur  = k => () => setFocus(f => ({ ...f, [k]: false }));

    const handleSubmit = async () => {
        if (!form.name.trim() || form.name.trim().length < 2) {
            setFieldErr('נא להזין שם מלא');
            return;
        }
        if (!isValidPhone(form.phone)) {
            setFieldErr('מספר טלפון לא תקין (לדוגמה: 050-1234567)');
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'contacts'), {
                ...form, source: 'mobile_contact', status: 'חדש', ts: serverTimestamp(),
            });
            haptic('success');
            setSent(true);
        } catch {
            haptic('error');
            setFieldErr('שליחת ההודעה נכשלה. אנא נסה שנית.');
        }
        setLoading(false);
    };

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── Quick actions ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <motion.a whileTap={{ scale: 0.95 }} href={`tel:${phone}`}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: c.surface, borderRadius: 18, padding: '18px 12px',
                        textDecoration: 'none', boxShadow: c.cardShadow,
                    }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={22} color="#34C759" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>התקשר עכשיו</span>
                    <span style={{ fontSize: 12, color: c.text3, direction: 'ltr' }}>{phone}</span>
                </motion.a>

                <motion.a whileTap={{ scale: 0.95 }}
                    href={`https://wa.me/972${phone.replace(/^0/, '').replace(/-/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: c.surface, borderRadius: 18, padding: '18px 12px',
                        textDecoration: 'none', boxShadow: c.cardShadow,
                    }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={22} color="#25D166" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>WhatsApp</span>
                    <span style={{ fontSize: 12, color: c.text3 }}>הודעה מהירה</span>
                </motion.a>
            </div>

            {/* ── Contact details ───────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: c.cardShadow }}>
                {[
                    { Icon: Mail, label: 'אימייל', value: email, href: `mailto:${email}` },
                    { Icon: MapPin, label: 'כתובת', value: address },
                ].map(({ Icon, label, value, href }, i) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px',
                        borderBottom: i === 0 ? `0.5px solid ${c.divider}` : 'none',
                    }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={18} color="#007AFF" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: c.text3, fontWeight: 500, marginBottom: 2 }}>{label}</p>
                            {href ? (
                                <a href={href} style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', textDecoration: 'none' }}>{value}</a>
                            ) : (
                                <p style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{value}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Contact form ──────────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: 16 }}>
                    שלח הודעה
                </h3>

                {sent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                        style={{ textAlign: 'center', padding: '24px 0' }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
                            style={{ width: 64, height: 64, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}
                        >
                            <Check size={30} color="#34C759" strokeWidth={2.5} />
                        </motion.div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 6, letterSpacing: '-0.03em' }}>ההודעה נשלחה!</p>
                        <p style={{ fontSize: 14, color: c.text3 }}>נחזור אליך בהקדם.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        animate={fieldErr ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                        <FloatingInput
                            value={form.name}
                            onChange={handleChange('name')}
                            label="שם מלא *"
                            c={c}
                            focused={focus.name}
                            onFocus={handleFocus('name')}
                            onBlur={handleBlur('name')}
                        />
                        <FloatingInput
                            value={form.phone}
                            onChange={handleChange('phone')}
                            label="טלפון *"
                            type="tel"
                            inputDir="ltr"
                            c={c}
                            focused={focus.phone}
                            onFocus={handleFocus('phone')}
                            onBlur={handleBlur('phone')}
                        />
                        <FloatingInput
                            value={form.message}
                            onChange={handleChange('message')}
                            label="הודעה..."
                            multiline
                            rows={4}
                            c={c}
                            focused={focus.message}
                            onFocus={handleFocus('message')}
                            onBlur={handleBlur('message')}
                        />
                        {fieldErr && (
                            <div style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FF3B30', fontSize: 13, fontWeight: 600 }}>
                                {fieldErr}
                            </div>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                width: '100%', height: 52, borderRadius: 14,
                                background: loading ? c.surface2 : 'linear-gradient(135deg, #007AFF, #0063CC)',
                                color: loading ? c.text4 : '#fff', border: 'none',
                                fontSize: 16, fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,122,255,0.28)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%', margin: '0 auto' }}
                                />
                            ) : 'שלח הודעה'}
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
