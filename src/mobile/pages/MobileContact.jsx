import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileContact() {
    const { getSetting } = useSettings();
    const phone   = getSetting('contact_phone', '058-5856356');
    const email   = getSetting('contact_email', 'info@nextclass.co.il');
    const address = getSetting('contact_address', 'ישראל');

    const [form,    setForm]    = useState({ name: '', phone: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [sent,    setSent]    = useState(false);
    const [fieldErr, setFieldErr] = useState('');

    const isValidPhone = (p) => /^0[2-9]\d{7,8}$/.test(p.replace(/[-\s]/g, ''));

    const handleChange = k => e => {
        setForm(f => ({ ...f, [k]: e.target.value }));
        setFieldErr('');
    };

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
                ...form,
                source: 'mobile_contact',
                status: 'חדש',
                ts: serverTimestamp(),
            });
            setSent(true);
        } catch {}
        setLoading(false);
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px',
        background: 'rgba(118,118,128,0.08)',
        border: '1px solid transparent',
        borderRadius: 12, fontSize: 16,
        color: '#1D1D1F', fontFamily: SF,
        direction: 'rtl', outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    };

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px' }}>

            {/* ── Quick actions ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                <motion.a whileTap={{ scale: 0.95 }} href={`tel:${phone}`}
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: '#fff', borderRadius: 18, padding: '18px 12px',
                        textDecoration: 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={22} color="#34C759" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>התקשר עכשיו</span>
                    <span style={{ fontSize: 12, color: '#86868B', direction: 'ltr' }}>{phone}</span>
                </motion.a>

                <motion.a whileTap={{ scale: 0.95 }}
                    href={`https://wa.me/972${phone.replace(/^0/, '').replace(/-/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: '#fff', borderRadius: 18, padding: '18px 12px',
                        textDecoration: 'none',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={22} color="#25D166" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>WhatsApp</span>
                    <span style={{ fontSize: 12, color: '#86868B' }}>הודעה מהירה</span>
                </motion.a>
            </div>

            {/* ── Contact details ───────────────────────────────────── */}
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {[
                    { Icon: Mail, label: 'אימייל', value: email, href: `mailto:${email}` },
                    { Icon: MapPin, label: 'כתובת', value: address },
                ].map(({ Icon, label, value, href }, i) => (
                    <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px',
                        borderBottom: i === 0 ? '0.5px solid rgba(0,0,0,0.07)' : 'none',
                    }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={18} color="#007AFF" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: '#86868B', fontWeight: 500, marginBottom: 2 }}>{label}</p>
                            {href ? (
                                <a href={href} style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', textDecoration: 'none' }}>{value}</a>
                            ) : (
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{value}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Contact form ──────────────────────────────────────── */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '20px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 16 }}>
                    שלח הודעה
                </h3>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Check size={26} color="#34C759" strokeWidth={2.5} />
                        </div>
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 6 }}>ההודעה נשלחה!</p>
                        <p style={{ fontSize: 14, color: '#86868B' }}>נחזור אליך בהקדם.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                            value={form.name} onChange={handleChange('name')}
                            placeholder="שם מלא *"
                            style={inputStyle}
                        />
                        <input
                            value={form.phone} onChange={handleChange('phone')}
                            placeholder="טלפון *"
                            type="tel" dir="ltr"
                            style={{ ...inputStyle, direction: 'ltr' }}
                        />
                        <textarea
                            value={form.message} onChange={handleChange('message')}
                            placeholder="הודעה..."
                            rows={4}
                            style={{ ...inputStyle, resize: 'none' }}
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
                                background: loading ? '#C7C7CC' : 'linear-gradient(135deg, #007AFF, #0063CC)',
                                color: '#fff', border: 'none',
                                fontSize: 16, fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                boxShadow: loading ? 'none' : '0 4px 20px rgba(0,122,255,0.28)',
                            }}
                        >
                            {loading ? 'שולח...' : 'שלח הודעה'}
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
}
