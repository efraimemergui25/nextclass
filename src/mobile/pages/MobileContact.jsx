import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Check, Clock, Zap, Award, HeartHandshake, ShieldCheck, Sparkles, User, ChevronLeft } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

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

const TOPICS = ['מסכים אינטראקטיביים', 'מחשבים לכיתה', 'ציוד חינוכי', 'פתרון לבית ספר שלם', 'ייעוץ ראשוני', 'מכרז ממשלתי', 'אחר'];
const INST_SIZES = ['1–5 כיתות', '6–15 כיתות', '15+ כיתות', 'אחר'];

export default function MobileContact() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const phone     = getSetting('contact_phone', '058-5856356');
    const email     = getSetting('contact_email', 'info@nextclass.co.il');
    const address   = getSetting('contact_address', 'ישראל');
    const hours     = getSetting('contact_hours', 'ראשון–חמישי 08:00–18:00');
    const whatsapp  = getSetting('whatsapp_number', `972${phone.replace(/^0/, '').replace(/-/g, '')}`);
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const update = () => setCurrentTime(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
        update();
        const t = setInterval(update, 60000);
        return () => clearInterval(t);
    }, []);

    const [form,     setForm]     = useState({ name: '', inst: '', email: '', phone: '', message: '' });
    const [topics,   setTopics]   = useState([]);
    const [instSize, setInstSize] = useState('');
    const [consent,  setConsent]  = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [sent,     setSent]     = useState(false);
    const [fieldErr, setFieldErr] = useState('');
    const [focus,    setFocus]    = useState({ name: false, inst: false, email: false, phone: false, message: false });

    const toggleTopic = t => setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

    const handleChange = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setFieldErr(''); };
    const handleFocus  = k => () => setFocus(f => ({ ...f, [k]: true }));
    const handleBlur   = k => () => setFocus(f => ({ ...f, [k]: false }));

    const handleSubmit = async () => {
        if (!form.name.trim() || form.name.trim().length < 2) { setFieldErr('נא להזין שם מלא'); return; }
        if (!consent) { setFieldErr('יש לאשר את מדיניות הפרטיות ותנאי השימוש'); return; }
        setLoading(true);
        const id = `CNT-${Date.now()}`;
        try {
            await setDoc(doc(db, 'contacts', id), {
                id, name: form.name.trim(), subject: form.inst.trim() ? `${form.inst.trim()} — פנייה` : 'פנייה ממובייל',
                email: form.email.trim(), phone: form.phone.trim(), message: form.message.trim(),
                topics, instSize, status: 'חדש', source: 'mobile_contact',
                date: new Date().toLocaleDateString('he-IL'), dateTs: Date.now(),
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
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 40px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── Current time chip ─────────────────────────────────── */}
            {currentTime && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,122,255,0.08)', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 16, letterSpacing: '0.03em' }}>
                    <Clock size={11} strokeWidth={2.5} />
                    זמן נוכחי במטה: {currentTime}
                </div>
            )}

            {/* ── Quick actions ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <motion.a whileTap={{ scale: 0.95 }} href={`tel:${phone}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: c.surface, borderRadius: 18, padding: '18px 12px', textDecoration: 'none', boxShadow: c.cardShadow }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={22} color="#34C759" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>התקשר עכשיו</span>
                    <span style={{ fontSize: 12, color: c.text3, direction: 'ltr' }}>{phone}</span>
                </motion.a>

                <motion.a whileTap={{ scale: 0.95 }} href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: c.surface, borderRadius: 18, padding: '18px 12px', textDecoration: 'none', boxShadow: c.cardShadow }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={22} color="#25D166" strokeWidth={1.8} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>WhatsApp</span>
                    <span style={{ fontSize: 12, color: c.text3 }}>הודעה מהירה</span>
                </motion.a>
            </div>

            {/* ── Personal Concierge Card ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', marginBottom: 16, boxShadow: c.cardShadow, border: `1px solid rgba(37,211,102,0.12)` }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={24} color="#25D166" strokeWidth={1.8} />
                    </div>
                    <div>
                        <p style={{ fontSize: 16, fontWeight: 900, color: c.text, letterSpacing: '-0.03em', marginBottom: 2 }}>
                            {getSetting('concierge_name', 'יועץ אישי ל-NextClass')}
                        </p>
                        <p style={{ fontSize: 12, color: c.text3, fontWeight: 500 }}>
                            {getSetting('concierge_role', 'מומחה טכנולוגיה לחינוך · מענה מיידי')}
                        </p>
                    </div>
                </div>
                <p style={{ fontSize: 13, color: c.text2, lineHeight: 1.6, marginBottom: 16 }}>
                    {getSetting('concierge_desc', 'שלחו הודעה ישירה בוואטסאפ ונציג מקצועי יחזור אליכם במהירות עם פתרון מותאם אישית.')}
                </p>
                <motion.a
                    whileTap={{ scale: 0.97 }}
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(getSetting('concierge_wa_text', 'שלום, אני מעוניין/ת בייעוץ לגבי פתרונות טכנולוגיים לחינוך'))}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: '#25D166', color: '#fff', borderRadius: 14, padding: '13px 20px',
                        textDecoration: 'none', fontSize: 15, fontWeight: 700,
                        boxShadow: '0 4px 16px rgba(37,211,102,0.30)',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <MessageCircle size={18} strokeWidth={2} />
                    {getSetting('concierge_wa_label', 'שלח הודעת WhatsApp')}
                </motion.a>
            </motion.div>

            {/* ── Contact details + hours ───────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', marginBottom: 16, boxShadow: c.cardShadow }}>
                {[
                    { Icon: Mail,    label: 'אימייל',        value: email,  href: `mailto:${email}` },
                    { Icon: MapPin,  label: 'כתובת',         value: address },
                    { Icon: Clock,   label: 'שעות פעילות',  value: hours },
                ].map(({ Icon, label, value, href }, i, arr) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? `0.5px solid ${c.divider}` : 'none' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={17} color="#007AFF" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: c.text3, fontWeight: 500, marginBottom: 2 }}>{label}</p>
                            {href ? <a href={href} style={{ fontSize: 14, fontWeight: 600, color: '#007AFF', textDecoration: 'none' }}>{value}</a>
                                  : <p style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{value}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Map deep link (iOS/Android native maps) ──────────── */}
            <motion.a
                whileTap={{ scale: 0.98 }}
                href={`https://maps.apple.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: c.surface, borderRadius: 18, padding: '16px 18px',
                    marginBottom: 16, boxShadow: c.cardShadow,
                    textDecoration: 'none', WebkitTapHighlightColor: 'transparent',
                    border: `1px solid ${c.border}`,
                }}
            >
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={20} color="#007AFF" strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 2 }}>{address}</p>
                    <p style={{ fontSize: 12, color: '#007AFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>פתח במפות <ChevronLeft size={12} strokeWidth={2.5} /></p>
                </div>
            </motion.a>

            {/* ── Promise strip ─────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                    { icon: <Zap size={15} />, title: getSetting('contact_trust_1_title', 'מענה תוך 24שע'), sub: getSetting('contact_trust_1_sub', 'נציג מחכה לכם') },
                    { icon: <HeartHandshake size={15} />, title: getSetting('contact_trust_2_title', 'ייעוץ ללא עלות'), sub: getSetting('contact_trust_2_sub', 'אפיון אישי') },
                    { icon: <Award size={15} />, title: `+${getSetting('about_stat1_val', '800')} מוסדות`, sub: getSetting('contact_trust_3_sub', 'בוטחים בנו') },
                ].map((item, i) => (
                    <div key={i} style={{ background: c.surface, borderRadius: 14, padding: '12px 10px', boxShadow: c.cardShadow, textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', margin: '0 auto 8px' }}>
                            {item.icon}
                        </div>
                        <p style={{ fontSize: 11, fontWeight: 800, color: c.text, lineHeight: 1.3, marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontSize: 10, color: c.text3 }}>{item.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Contact form ──────────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow, marginBottom: 16 }}>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.04em', marginBottom: 4 }}>
                    {getSetting('contact_form_title', 'בואו נצא לדרך.')}
                </h3>
                <p style={{ fontSize: 13, color: c.text3, marginBottom: 18 }}>
                    {getSetting('contact_form_desc', 'השאירו פרטים ונחזור עם חבילה מותאמת אישית.')}
                </p>

                {sent ? (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} style={{ textAlign: 'center', padding: '24px 0' }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.1 }}
                            style={{ width: 64, height: 64, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <Check size={30} color="#34C759" strokeWidth={2.5} />
                        </motion.div>
                        <p style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 6, letterSpacing: '-0.03em' }}>
                            {getSetting('contact_success_title', 'הפנייה התקבלה')}
                        </p>
                        <p style={{ fontSize: 14, color: c.text3, marginBottom: 16 }}>
                            {getSetting('contact_success_msg', 'נחזור אליך תוך פחות מ-24 שעות.')}
                        </p>
                        <button onClick={() => setSent(false)} style={{ color: '#007AFF', fontWeight: 700, background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: SF }}>
                            שלח הודעה נוספת
                        </button>
                    </motion.div>
                ) : (
                    <motion.div animate={fieldErr ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { x: 0 }} transition={{ duration: 0.4 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <FloatingInput value={form.name}    onChange={handleChange('name')}    label="שם מלא *"      c={c} focused={focus.name}    onFocus={handleFocus('name')}    onBlur={handleBlur('name')} />
                        <FloatingInput value={form.inst}    onChange={handleChange('inst')}    label="מוסד / חברה"   c={c} focused={focus.inst}    onFocus={handleFocus('inst')}    onBlur={handleBlur('inst')} />
                        <FloatingInput value={form.email}   onChange={handleChange('email')}   label="אימייל"        type="email" inputDir="ltr" c={c} focused={focus.email}   onFocus={handleFocus('email')}   onBlur={handleBlur('email')} />
                        <FloatingInput value={form.phone}   onChange={handleChange('phone')}   label="טלפון *"       type="tel"   inputDir="ltr" c={c} focused={focus.phone}   onFocus={handleFocus('phone')}   onBlur={handleBlur('phone')} />

                        {/* Topic pills */}
                        <div style={{ background: c.bg, borderRadius: 14, padding: '12px 14px' }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: c.text3, letterSpacing: '0.06em', marginBottom: 10 }}>מה מעניין אותך?</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                {TOPICS.map(topic => {
                                    const active = topics.includes(topic);
                                    return (
                                        <motion.button key={topic} whileTap={{ scale: 0.93 }} onClick={() => { haptic('select'); toggleTopic(topic); }}
                                            style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: SF, cursor: 'pointer', border: 'none', WebkitTapHighlightColor: 'transparent',
                                                background: active ? 'linear-gradient(135deg, #007AFF, #5856D6)' : c.surface,
                                                color: active ? '#fff' : c.text3,
                                                boxShadow: active ? '0 3px 10px rgba(0,122,255,0.3)' : 'none',
                                            }}>
                                            {topic}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Institution size */}
                        <div style={{ background: c.bg, borderRadius: 14, padding: '12px 14px' }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: c.text3, letterSpacing: '0.06em', marginBottom: 10 }}>גודל המוסד</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 7 }}>
                                {INST_SIZES.map(size => {
                                    const active = instSize === size;
                                    return (
                                        <motion.button key={size} whileTap={{ scale: 0.93 }} onClick={() => { haptic('select'); setInstSize(s => s === size ? '' : size); }}
                                            style={{ padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, fontFamily: SF, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                                background: active ? 'rgba(0,122,255,0.08)' : c.surface, color: active ? '#007AFF' : c.text3,
                                                border: `1.5px solid ${active ? 'rgba(0,122,255,0.3)' : 'transparent'}`,
                                            }}>
                                            {size}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        <FloatingInput value={form.message} onChange={handleChange('message')} label={getSetting('contact_label_msg', 'איך נוכל לעזור?')} multiline rows={4} c={c} focused={focus.message} onFocus={handleFocus('message')} onBlur={handleBlur('message')} />

                        {/* Consent checkbox */}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: c.bg, borderRadius: 12, border: `1px solid ${c.divider}`, cursor: 'pointer' }}>
                            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                                style={{ width: 18, height: 18, accentColor: '#007AFF', flexShrink: 0, marginTop: 2, cursor: 'pointer' }} />
                            <span style={{ fontSize: 12, color: c.text2, lineHeight: 1.6 }}>
                                קראתי ואני מסכים/ה ל
                                <a href="/privacy" style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none' }}> מדיניות הפרטיות </a>
                                ול<a href="/terms" style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none' }}> תנאי השימוש </a>
                                של NextClass.
                            </span>
                        </label>

                        {fieldErr && (
                            <div style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, padding: '10px 14px', color: '#FF3B30', fontSize: 13, fontWeight: 600 }}>
                                {fieldErr}
                            </div>
                        )}
                        <motion.button whileTap={consent ? { scale: 0.97 } : {}} onClick={consent ? handleSubmit : undefined} disabled={loading || !consent}
                            style={{
                                width: '100%', height: 52, borderRadius: 14,
                                background: !consent ? c.surface2 : loading ? c.surface2 : '#000',
                                color: loading || !consent ? c.text4 : '#fff', border: 'none',
                                fontSize: 16, fontWeight: 700, cursor: consent && !loading ? 'pointer' : 'not-allowed',
                                WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                            {loading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)', borderTop: '2.5px solid #fff', borderRadius: '50%' }} />
                            ) : getSetting('contact_form_btn', 'שלח פנייה')}
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* ── Trust section ─────────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={18} color="#007AFF" strokeWidth={1.8} />
                    </div>
                    <div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.02em' }}>{getSetting('contact_trust_title', 'שותפות ארוכת טווח')}</p>
                    </div>
                </div>
                <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.6, marginBottom: 16 }}>
                    {getSetting('contact_trust_desc', 'אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך – מאפיון הצרכים ועד לשירות טכני מלא בכיתה.')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        { icon: <Sparkles size={15} />, label: 'ייעוץ טכנולוגי חינם' },
                        { icon: <User size={15} />, label: 'ליווי פדגוגי מלא' },
                        { icon: <ShieldCheck size={15} />, label: 'שירות אישי ומקצועי' },
                    ].map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.bg, borderRadius: 12, padding: '10px 14px' }}>
                            <div style={{ color: '#007AFF' }}>{v.icon}</div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{v.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
