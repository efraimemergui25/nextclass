import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, Sparkles, CheckCircle2, ShieldCheck, Heart, User, Zap, Award, HeartHandshake } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Controlled floating label input
const FloatingInput = ({ label, id, type = 'text', isTextArea = false, value, onChange }) => {
 const [focused, setFocused] = useState(false);
 const isFloating = focused || (value && value.length > 0);

 return (
 <div className="relative w-full mb-6">
 <motion.label
 htmlFor={id}
 initial={false}
 animate={{
 y: isFloating ? -24 : 0,
 x: isFloating ? 4 : 0,
 scale: isFloating ? 0.8 : 1,
 color: focused ? '#007AFF' : '#86868B'
 }}
 className="absolute right-4 top-4 font-bold pointer-events-none transition-colors origin-right z-10"
 >
 {label}
 </motion.label>
 {isTextArea ? (
 <textarea
 id={id}
 value={value}
 onChange={e => onChange(e.target.value)}
 onFocus={() => setFocused(true)}
 onBlur={() => setFocused(false)}
 maxLength={1000}
 className="w-full bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-[2rem] p-4 pt-6 min-h-[140px] outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:border-[#007AFF]/30 transition-all text-right font-medium text-[#1D1D1F] resize-none"
 />
 ) : (
 <input
 id={id}
 type={type}
 value={value}
 onChange={e => onChange(e.target.value)}
 onFocus={() => setFocused(true)}
 onBlur={() => setFocused(false)}
 maxLength={type === 'email' ? 254 : 120}
 className="w-full bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-full p-4 pt-6 outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:border-[#007AFF]/30 transition-all text-right font-medium text-[#1D1D1F]"
 />
 )}
 </div>
 );
};

// Removed readContactContent helper

const ContactPage = () => {
 const { getSetting } = useSettings();
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [currentTime, setCurrentTime] = useState('');

 const contactContent = useMemo(() => ({
 title: getSetting('contact_hero_title', 'הכיתה שלכם מחכה. בואו נתחיל.'),
 subtitle: getSetting('contact_hero_subtitle', 'אנחנו כאן בשבילכם — שירות ישיר, מהיר ומקצועי מהרגע הראשון.'),
 conciergeTitle: getSetting('contact_concierge_title', 'ייעוץ אישי ומיידי'),
 conciergeDesc: getSetting('contact_concierge_desc', 'נציג מקצועי מחכה לכם עכשיו כדי לאפיין את הפתרון המדויק למוסד שלכם.'),
 formTitle: getSetting('contact_form_title', 'בואו נצא לדרך.'),
 formDesc: getSetting('contact_form_desc', 'השאירו פרטים ונחזור אליכם עם חבילה מותאמת אישית.'),
 trustTitle: getSetting('contact_trust_title', 'שותפות ארוכת טווח'),
 trustDesc: getSetting('contact_trust_desc', 'אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך – מאפיון הצרכים ועד לשירות טכני מלא בכיתה.'),
 phone: getSetting('contact_phone', '058-5856356'),
 email: getSetting('contact_email', 'nextclass.en@gmail.com'),
 address: getSetting('contact_address', 'בראלי 10, תל אביב'),
 hours: getSetting('contact_hours', 'ראשון–חמישי 08:00–18:00'),
 whatsapp: getSetting('whatsapp_number', '972585856356'),
 waLabel: getSetting('contact_wa_label', 'זמינים ב-WhatsApp'),
 waBtn: getSetting('contact_wa_btn', 'התחל שיחה עכשיו'),
 timeHint: getSetting('contact_time_hint', 'זמן נוכחי במטה בתל אביב: '),
 labelName: getSetting('contact_label_name', 'שם מלא'),
 labelInst: getSetting('contact_label_inst', 'מוסד / חברה'),
 labelMsg: getSetting('contact_label_msg', 'איך נוכל לעזור?'),
 successTitle: getSetting('contact_success_title', 'הפנייה התקבלה'),
 successMsg: getSetting('contact_success_msg', 'הצוות שלנו כבר מעבד את הבקשה שלך. נחזור אליך תוך פחות מ-24 שעות.'),
 formBtn: getSetting('contact_form_btn', 'שלח פנייה'),
 }), [getSetting]);

 // Controlled form state
 const [formData, setFormData] = useState({
 name: '',
 inst: '',
 email: '',
 phone: '',
 msg: '',
 });
 const [selectedTopics, setSelectedTopics] = useState([]);
 const [instSize, setInstSize] = useState('');
 const [submitError, setSubmitError] = useState('');
 const [consentGiven, setConsentGiven] = useState(false);

 const toggleTopic = (topic) =>
 setSelectedTopics(prev =>
 prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
 );

 const setField = (key) => (val) => setFormData(prev => ({ ...prev, [key]: val }));

 useEffect(() => {
 const update = () => {
 const now = new Date();
 setCurrentTime(now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
 };
 update();
 const timer = setInterval(update, 60000);
 return () => clearInterval(timer);
 }, []);

 const handleSubmit = async (e) => {
 e.preventDefault();

 const id = `CNT-${Date.now()}`;
 const contact = {
 id,
 name: formData.name.trim() || 'לא ידוע',
 subject: formData.inst.trim() ? `${formData.inst.trim()} — פנייה חדשה` : 'פנייה מהאתר',
 email: formData.email.trim(),
 phone: formData.phone.trim(),
 message: formData.msg.trim(),
 topics: selectedTopics,
 instSize,
 status: 'חדש',
 date: new Date().toLocaleDateString('he-IL'),
 dateTs: Date.now(),
 };

 setSubmitError('');
 try {
 await setDoc(doc(db, 'contacts', id), contact);
 } catch {
 // Firestore unavailable — store locally as fallback
 let savedLocally = false;
 try {
 const existing = JSON.parse(localStorage.getItem('nextclass_contacts') || '[]');
 localStorage.setItem('nextclass_contacts', JSON.stringify([contact, ...existing]));
 savedLocally = true;
 } catch {}
 if (!savedLocally) {
 setSubmitError('הייתה בעיה בשליחת הפנייה. אנא נסו שוב או פנו אלינו בטלפון.');
 return;
 }
 }

 setIsSubmitted(true);
 setFormData({ name: '', inst: '', email: '', phone: '', msg: '' });
 setTimeout(() => setIsSubmitted(false), 8000);
 };

 return (
 <PageTransition>
 <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-20 w-full overflow-x-hidden">

 {/* ── Cinematic Hero ────────────────────────────────────── */}
 <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center mb-12 sm:mb-24">
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] mb-10 border border-blue-100"
 >
 <Clock size={10} className="animate-spin-slow" />
 <span>{contactContent.timeHint}{currentTime}</span>
 </motion.div>

 <h1 className="font-apple-display text-[#1D1D1F] mb-4 sm:mb-6 leading-[0.95]"
 style={{ fontSize: 'clamp(32px, 7vw, 96px)', letterSpacing: '-0.04em' }}>
 {contactContent.title.split('.').map((t,i) => (
 <span key={i} style={i % 2 !== 0 ? { background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : {}}>
 {t}{i === 0 && <br />}
 </span>
 ))}
 </h1>
 <p className="text-base sm:text-xl md:text-2xl text-[#AEAEB2] font-medium max-w-2xl mx-auto leading-relaxed">
 {contactContent.subtitle}
 </p>
 </section>

 <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-stretch">

 {/* ── Left Side: Connection Hub ────── */}
 <div className="lg:col-span-5 flex flex-col gap-8 self-stretch">

 {/* Personal Concierge Card */}
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="glass-apple gestalt-card p-6 sm:p-12 bg-white/80 border border-white/60 shadow-xl overflow-hidden relative"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
 <div className="flex items-center justify-between mb-10">
 <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
 <MessageSquare size={32} />
 </div>
 <div className="text-left">
 <div className="flex items-center gap-2 text-[9px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full">
 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
 {contactContent.waLabel}
 </div>
 </div>
 </div>
 <h3 className="text-3xl font-apple-display text-[#1D1D1F] mb-4">{contactContent.conciergeTitle}</h3>
 <p className="text-[#86868B] text-lg font-medium mb-10 leading-relaxed">{contactContent.conciergeDesc}</p>
 <motion.a
 href={`https://wa.me/${contactContent.whatsapp}`}
 whileHover={{ scale: 1.02, y: -2 }}
 whileTap={{ scale: 0.98 }}
 className="inline-flex w-full py-4 sm:py-5 bg-[#25D366] text-white rounded-full items-center justify-center font-bold text-base sm:text-xl shadow-lg hover:bg-[#128C7E] transition-all"
 >
 {contactContent.waBtn}
 </motion.a>
 </motion.div>

 {/* Human Touch: The Support Team */}
 <div className="glass-apple gestalt-card p-5 sm:p-10 bg-white/40 border border-white/60 flex flex-col flex-1">
 <div className="flex items-center gap-4 mb-8 text-right">
 <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
 <Heart size={20} className="fill-[#007AFF]" />
 </div>
 <h4 className="text-xl font-bold text-[#1D1D1F]">{getSetting('contact_support_label', 'אנחנו כאן בשבילך')}</h4>
 </div>
 <div className="space-y-6">
 {[
 { label: 'טלפון', val: contactContent.phone, icon: <Phone size={16} />, href: `tel:${contactContent.phone}` },
 { label: 'מייל', val: contactContent.email, icon: <Mail size={16} />, href: `mailto:${contactContent.email}` },
 { label: 'כתובת', val: contactContent.address, icon: <MapPin size={16} />, href: `https://maps.google.com/?q=${encodeURIComponent(contactContent.address)}` },
 ...(contactContent.hours ? [{ label: 'שעות פעילות', val: contactContent.hours, icon: <Clock size={16} /> }] : []),
 ].map((item, i) => (
 <a key={i} href={item.href || '#'} target={item.href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
 className="flex items-center gap-5 group cursor-pointer no-underline">
 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#AEAEB2] group-hover:text-[#007AFF] shadow-sm transition-all">
 {item.icon}
 </div>
 <div className="text-right">
 <p className="text-[10px] font-black text-[#AEAEB2]">{item.label}</p>
 <p className="text-lg font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">{item.val}</p>
 </div>
 </a>
 ))}
 </div>

 {/* Google Maps embed */}
 <div className="mt-8 rounded-2xl overflow-hidden shadow-sm border border-[#E5E5EA] flex-1 min-h-[220px]">
 <iframe
 title="מיקום NextClass"
 width="100%"
 height="100%"
 style={{ border: 0, minHeight: 220, display: 'block' }}
 loading="lazy"
 allowFullScreen
 referrerPolicy="no-referrer-when-downgrade"
 src={`https://www.google.com/maps?q=${encodeURIComponent(contactContent.address)}&output=embed`}
 />
 </div>
 </div>
 </div>

 {/* ── Right Side: Interactive Hub Form ────── */}
 <div className="lg:col-span-7 flex flex-col">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 className="glass-apple gestalt-card p-5 sm:p-10 md:p-16 relative bg-white/95 shadow-2xl border border-white/80 flex-1"
 >
 <AnimatePresence mode="wait">
 {!isSubmitted ? (
 <motion.form
 key="form"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 onSubmit={handleSubmit}
 className="relative z-10 text-right"
 >
 <h2 className="text-2xl sm:text-4xl md:text-5xl font-apple-display text-[#1D1D1F] mb-3 sm:mb-4 tracking-tighter">{contactContent.formTitle}</h2>
 <p className="text-base sm:text-xl text-[#86868B] font-medium mb-6 sm:mb-12">{contactContent.formDesc}</p>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <FloatingInput label={contactContent.labelName} id="name" value={formData.name} onChange={setField('name')} />
 <FloatingInput label={contactContent.labelInst} id="inst" value={formData.inst} onChange={setField('inst')} />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <FloatingInput label="אימייל מוסדי" id="email" type="email" value={formData.email} onChange={setField('email')} />
 <FloatingInput label="טלפון" id="phone" type="tel" value={formData.phone} onChange={setField('phone')} />
 </div>
 {/* ── Topic pills ── */}
 <div className="mb-5 p-5 rounded-2xl" style={{ background: 'rgba(248,248,250,0.7)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 2px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
 <p className="text-[10px] font-black text-[#AEAEB2] text-right mb-3">מה מעניין אותך?</p>
 <div className="flex flex-wrap gap-2" dir="rtl">
 {['מסכים אינטראקטיביים', 'מחשבים לכיתה', 'ציוד חינוכי', 'פתרון לבית ספר שלם', 'ייעוץ ראשוני', 'מכרז ממשלתי', 'אחר'].map(topic => (
 <button
 type="button"
 key={topic}
 onClick={() => toggleTopic(topic)}
 className="px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-200"
 style={selectedTopics.includes(topic) ? {
 background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
 color: 'white',
 border: '1px solid transparent',
 boxShadow: '0 4px 14px rgba(0,122,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
 } : {
 background: 'rgba(255,255,255,0.82)',
 backdropFilter: 'blur(12px)',
 color: '#6E6E73',
 border: '1px solid rgba(0,0,0,0.07)',
 boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
 }}
 >
 {topic}
 </button>
 ))}
 </div>
 </div>

 {/* ── Institution size ── */}
 <div className="mb-6 p-5 rounded-2xl" style={{ background: 'rgba(248,248,250,0.7)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 2px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
 <p className="text-[10px] font-black text-[#AEAEB2] text-right mb-3">גודל המוסד</p>
 <div className="grid grid-cols-4 gap-2" dir="rtl">
 {['1–5 כיתות', '6–15 כיתות', '15+ כיתות', 'אחר'].map(size => (
 <button
 type="button"
 key={size}
 onClick={() => setInstSize(size === instSize ? '' : size)}
 className="py-3 rounded-xl text-[12px] font-bold transition-all duration-200"
 style={instSize === size ? {
 background: 'rgba(0,122,255,0.08)',
 color: '#007AFF',
 border: '1.5px solid rgba(0,122,255,0.30)',
 boxShadow: '0 4px 12px rgba(0,122,255,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
 } : {
 background: 'rgba(255,255,255,0.82)',
 backdropFilter: 'blur(12px)',
 color: '#6E6E73',
 border: '1px solid rgba(0,0,0,0.07)',
 boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
 }}
 >
 {size}
 </button>
 ))}
 </div>
 </div>

 <FloatingInput label={contactContent.labelMsg} id="msg" isTextArea value={formData.msg} onChange={setField('msg')} />

 {/* Consent checkbox */}
 <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: '#F9F9FB', borderRadius: 14, border: '1px solid #E5E5EA', cursor: 'pointer', marginTop: 8 }}>
 <input
 type="checkbox"
 checked={consentGiven}
 onChange={e => setConsentGiven(e.target.checked)}
 style={{ width: 18, height: 18, accentColor: '#007AFF', flexShrink: 0, marginTop: 2, cursor: 'pointer' }}
 />
 <span style={{ fontSize: 13, color: '#3C3C43', lineHeight: 1.6 }}>
 קראתי ואני מסכים/ה ל
 <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none' }}> מדיניות הפרטיות </a>
 ול
 <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none' }}> תנאי השימוש </a>
 של NextClass, ולאיסוף המידע לצורך מענה לפנייתי.
 </span>
 </label>

 {submitError && (
 <p className="text-sm font-bold text-red-500 text-center bg-red-50 rounded-2xl px-4 py-3 border border-red-100">{submitError}</p>
 )}
 <motion.button
 type="submit"
 disabled={!consentGiven}
 whileHover={consentGiven ? { scale: 1.01, y: -2 } : {}}
 whileTap={consentGiven ? { scale: 0.99 } : {}}
 className="w-full py-5 rounded-full font-bold text-xl flex items-center justify-center gap-4 shadow-xl transition-all mt-4"
 style={{ background: consentGiven ? '#000' : '#C7C7CC', color: '#fff', cursor: consentGiven ? 'pointer' : 'not-allowed' }}
 >
 <span>{contactContent.formBtn}</span>
 <Send size={20} />
 </motion.button>
 </motion.form>
 ) : (
 <motion.div
 key="success"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="py-24 text-center flex flex-col items-center gap-8"
 >
 <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-2">
 <CheckCircle2 size={56} className="animate-glow-pulse" />
 </div>
 <h2 className="text-4xl font-apple-display text-[#1D1D1F] tracking-tighter">{contactContent.successTitle}</h2>
 <p className="text-xl text-[#86868B] font-medium max-w-md">{contactContent.successMsg}</p>
 <button
 type="button"
 onClick={() => setIsSubmitted(false)}
 className="text-[#007AFF] font-bold hover:underline"
 >
 שלח הודעה נוספת
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 {/* ── Promise strip — pushed to bottom to align with map ── */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 28 }}
 className="grid grid-cols-3 gap-3 mt-auto pt-6"
 >
 {[
 { icon: <Zap size={18} />, title: 'מענה תוך 24 שעות', sub: 'נציג מחכה לכם' },
 { icon: <HeartHandshake size={18} />, title: 'ייעוץ ללא עלות', sub: 'אפיון מותאם אישית' },
 { icon: <Award size={18} />, title: '+800 מוסדות', sub: 'בוטחים בנו כבר היום' },
 ].map((item, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: 0.18 + i * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
 className="bg-white/70 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-sm text-right flex flex-col gap-2"
 >
 <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF] self-end">
 {item.icon}
 </div>
 <p className="text-[13px] font-black text-[#1D1D1F] leading-snug">{item.title}</p>
 <p className="text-[11px] text-[#AEAEB2] font-medium">{item.sub}</p>
 </motion.div>
 ))}
 </motion.div>
 </div>
 </div>
 </div>

 {/* ── Trust Section ────── */}
 <section className="mt-12 sm:mt-16 max-w-4xl mx-auto px-4 sm:px-6 text-center">
 <div className="inline-flex p-4 rounded-3xl bg-white shadow-sm border border-gray-100 mb-10">
 <ShieldCheck size={32} className="text-[#007AFF]" />
 </div>
 <h2 className="text-3xl font-apple-display text-[#1D1D1F] mb-6 tracking-tighter">{contactContent.trustTitle}</h2>
 <p className="text-xl text-[#AEAEB2] font-medium mb-12 leading-relaxed">
 {contactContent.trustDesc}
 </p>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {[
 { label: 'ייעוץ טכנולוגי חינם', icon: <Sparkles size={18} /> },
 { label: 'ליווי פדגוגי מלא', icon: <User size={18} /> },
 { label: 'שירות אישי ומקצועי', icon: <ShieldCheck size={18} /> }
 ].map((v, i) => (
 <div key={i} className="flex items-center justify-center gap-3 text-[#1D1D1F] font-bold bg-white/60 py-4 rounded-2xl border border-white shadow-sm">
 <span className="text-[#007AFF]">{v.icon}</span>
 <span>{v.label}</span>
 </div>
 ))}
 </div>
 </section>
 </div>
 </PageTransition>
 );
};

export default ContactPage;
