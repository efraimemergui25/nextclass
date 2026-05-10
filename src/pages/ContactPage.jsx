import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, Sparkles, CheckCircle2, ShieldCheck, Heart, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const GLASS_CARD = "glass-apple gestalt-card p-10 flex flex-col gap-6 relative overflow-hidden group border border-white/40 shadow-sm transition-apple-fluid";

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
                    className="w-full bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-full p-4 pt-6 outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:border-[#007AFF]/30 transition-all text-right font-medium text-[#1D1D1F]"
                />
            )}
        </div>
    );
};

function readContactContent() {
    try {
        const s = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
        return {
            title:    s.contact_page_title    || 'דברו איתנו',
            subtitle: s.contact_page_subtitle || 'אנחנו כאן בשבילכם — מהייעוץ הראשון ועד אחרי ההתקנה.',
            phone:    s.contact_phone         || '03-9999999',
            email:    s.contact_email         || 'info@nextclass.co.il',
            address:  s.contact_address       || 'תל אביב, ישראל',
            hours:    s.contact_hours         || 'ראשון–חמישי 08:00–18:00',
            formNote: s.contact_form_note     || 'נחזור אליכם תוך יום עסקים.',
        };
    } catch { return {}; }
}

const ContactPage = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentTime, setCurrentTime] = useState('');
    const [contactContent, setContactContent] = useState(readContactContent);

    useEffect(() => {
        const onStorage = (e) => { if (e.key === 'nextclass_content') setContactContent(readContactContent()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Controlled form state
    const [formData, setFormData] = useState({
        name: '',
        inst: '',
        email: '',
        phone: '',
        msg: '',
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Build contact record matching AdminDataContext schema
        const contact = {
            id: `CNT-${Date.now()}`,
            name: formData.name.trim() || 'לא ידוע',
            subject: formData.inst.trim() ? `${formData.inst.trim()} — פנייה חדשה` : 'פנייה מהאתר',
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            message: formData.msg.trim(),
            status: 'חדש',
            date: new Date().toLocaleDateString('he-IL'),
            dateTs: Date.now(),
        };

        try {
            const existing = JSON.parse(localStorage.getItem('nextclass_contacts') || '[]');
            localStorage.setItem('nextclass_contacts', JSON.stringify([contact, ...existing]));
        } catch {
            // Fail silently — form UX shouldn't break
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
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.25em] mb-10 border border-blue-100"
                    >
                        <Clock size={10} className="animate-spin-slow" />
                        <span>זמן נוכחי במטה בתל אביב: {currentTime}</span>
                    </motion.div>

                    <h1 className="text-3xl sm:text-5xl md:text-8xl font-apple-display text-[#1D1D1F] tracking-tighter mb-4 sm:mb-6 leading-[0.95]">
                        הכיתה שלכם מחכה.<br />
                        <span className="text-[#007AFF]">בואו נתחיל.</span>
                    </h1>
                    <p className="text-base sm:text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        {contactContent.subtitle}
                    </p>
                </section>

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">

                        {/* ── Left Side: Connection Hub ────── */}
                        <div className="lg:col-span-5 flex flex-col gap-8">

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
                                        <div className="flex items-center gap-2 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            זמינים ב-WhatsApp
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-3xl font-apple-display text-[#1D1D1F] mb-4">ייעוץ אישי ומיידי</h3>
                                <p className="text-gray-500 text-lg font-medium mb-10 leading-relaxed">נציג מקצועי מחכה לכם עכשיו כדי לאפיין את הפתרון המדויק למוסד שלכם.</p>
                                <motion.a
                                    href="https://wa.me/972500000000"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-flex w-full py-4 sm:py-5 bg-[#25D366] text-white rounded-full items-center justify-center font-bold text-base sm:text-xl shadow-lg hover:bg-[#128C7E] transition-all"
                                >
                                    התחל שיחה עכשיו
                                </motion.a>
                            </motion.div>

                            {/* Human Touch: The Support Team */}
                            <div className="glass-apple gestalt-card p-5 sm:p-10 bg-white/40 border border-white/60">
                                <div className="flex items-center gap-4 mb-8 text-right">
                                    <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                                        <Heart size={20} className="fill-[#007AFF]" />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#1D1D1F]">אנחנו כאן בשבילך</h4>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: 'טלפון', val: contactContent.phone, icon: <Phone size={16} /> },
                                        { label: 'מייל', val: contactContent.email, icon: <Mail size={16} /> },
                                        { label: 'כתובת', val: contactContent.address, icon: <MapPin size={16} /> },
                                        ...(contactContent.hours ? [{ label: 'שעות פעילות', val: contactContent.hours, icon: <Clock size={16} /> }] : []),
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-5 group cursor-pointer">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-[#007AFF] shadow-sm transition-all">
                                                {item.icon}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-lg font-bold text-[#1D1D1F]">{item.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Right Side: Interactive Hub Form ────── */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-apple gestalt-card p-5 sm:p-10 md:p-16 relative bg-white/95 shadow-2xl border border-white/80"
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
                                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-apple-display text-[#1D1D1F] mb-3 sm:mb-4 tracking-tighter">בואו נצא לדרך.</h2>
                                            <p className="text-base sm:text-xl text-gray-500 font-medium mb-6 sm:mb-12">השאירו פרטים ונחזור אליכם עם חבילה מותאמת אישית.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FloatingInput label="שם מלא" id="name" value={formData.name} onChange={setField('name')} />
                                                <FloatingInput label="מוסד / חברה" id="inst" value={formData.inst} onChange={setField('inst')} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FloatingInput label="אימייל מוסדי" id="email" type="email" value={formData.email} onChange={setField('email')} />
                                                <FloatingInput label="טלפון" id="phone" type="tel" value={formData.phone} onChange={setField('phone')} />
                                            </div>
                                            <FloatingInput label="איך נוכל לעזור?" id="msg" isTextArea value={formData.msg} onChange={setField('msg')} />

                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.01, y: -2 }}
                                                whileTap={{ scale: 0.99 }}
                                                className="w-full py-5 bg-black text-white rounded-full font-bold text-xl flex items-center justify-center gap-4 shadow-xl hover:bg-[#1D1D1F] transition-all mt-6"
                                            >
                                                <span>שלח פנייה</span>
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
                                            <h2 className="text-4xl font-apple-display text-[#1D1D1F] tracking-tighter">הפנייה התקבלה</h2>
                                            <p className="text-xl text-gray-500 font-medium max-w-md">הצוות שלנו כבר מעבד את הבקשה שלך. נחזור אליך תוך פחות מ-24 שעות.</p>
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
                        </div>
                    </div>
                </div>

                {/* ── Trust Section ────── */}
                <section className="mt-16 sm:mt-24 md:mt-32 max-w-4xl mx-auto px-4 sm:px-6 text-center">
                    <div className="inline-flex p-4 rounded-3xl bg-white shadow-sm border border-gray-100 mb-10">
                        <ShieldCheck size={32} className="text-[#007AFF]" />
                    </div>
                    <h2 className="text-3xl font-apple-display text-[#1D1D1F] mb-6 tracking-tighter">שותפות ארוכת טווח</h2>
                    <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed">
                        אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך – מאפיון הצרכים ועד לשירות טכני מלא בכיתה.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'ייעוץ טכנולוגי חינם', icon: <Sparkles size={18} /> },
                            { label: 'ליווי פדגוגי מלא', icon: <User size={18} /> },
                            { label: 'אחריות מוסדית מורחבת', icon: <ShieldCheck size={18} /> }
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
