import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPin, MessageSquare, Clock, Send, Sparkles, CheckCircle2, ShieldCheck, Heart, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const GLASS_CARD = "glass-apple gestalt-card p-10 flex flex-col gap-6 relative overflow-hidden group border border-white/40 shadow-sm transition-apple-fluid";

const FloatingInput = ({ label, id, type = 'text', isTextArea = false }) => {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState('');
    const isFloating = focused || value.length > 0;

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
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-[2rem] p-4 pt-6 min-h-[140px] outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:border-[#007AFF]/30 transition-all text-right font-medium text-[#1D1D1F] resize-none"
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="w-full bg-white/40 backdrop-blur-xl border border-gray-200/50 rounded-full p-4 pt-6 outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:border-[#007AFF]/30 transition-all text-right font-medium text-[#1D1D1F]"
                />
            )}
        </div>
    );
};

const ContactPage = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

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
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 8000);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-20 w-full overflow-x-hidden">
                
                {/* ── Cinematic Hero ────────────────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.25em] mb-10 border border-blue-100"
                    >
                        <Clock size={10} className="animate-spin-slow" />
                        <span>זמן נוכחי במטה בתל אביב: {currentTime}</span>
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-8xl font-apple-display text-[#1D1D1F] tracking-tighter mb-6 leading-[0.95]">
                        הכיתה שלכם מחכה.<br />
                        <span className="text-[#007AFF]">בואו נתחיל.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        אנחנו כאן כדי להבטיח שהמעבר לטכנולוגיה חכמה יהיה פשוט, אנושי ומרגש. הצטרפו למוסדות המובילים בישראל.
                    </p>
                </section>

                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        
                        {/* ── Left Side: Connection Hub ────── */}
                        <div className="lg:col-span-5 flex flex-col gap-8">
                            
                            {/* Personal Concierge Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-apple gestalt-card p-12 bg-white/80 border border-white/60 shadow-xl overflow-hidden relative"
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
                                    className="inline-flex w-full py-5 bg-[#25D366] text-white rounded-full items-center justify-center font-bold text-xl shadow-lg hover:bg-[#128C7E] transition-all"
                                >
                                    התחל שיחה עכשיו
                                </motion.a>
                            </motion.div>

                            {/* Human Touch: The Support Team */}
                            <div className="glass-apple gestalt-card p-10 bg-white/40 border border-white/60">
                                <div className="flex items-center gap-4 mb-8 text-right">
                                    <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
                                        <Heart size={20} className="fill-[#007AFF]" />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#1D1D1F]">אנחנו כאן בשבילך</h4>
                                </div>
                                <div className="space-y-6">
                                    {[
                                        { label: 'מוקד מכירות', val: '03-555-1234', icon: <Phone size={16} /> },
                                        { label: 'תמיכה טכנית', val: 'concierge@nextclass.co.il', icon: <Mail size={16} /> },
                                        { label: 'מטה החברה', val: 'מגדלי עזריאלי, תל אביב', icon: <MapPin size={16} /> }
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
                                className="glass-apple gestalt-card p-12 md:p-16 relative bg-white/95 shadow-2xl border border-white/80"
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
                                            <h2 className="text-4xl md:text-5xl font-apple-display text-[#1D1D1F] mb-4 tracking-tighter">בואו נצא לדרך.</h2>
                                            <p className="text-xl text-gray-500 font-medium mb-12">השאירו פרטים ונחזור אליכם עם חבילה מותאמת אישית.</p>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FloatingInput label="שם מלא" id="name" />
                                                <FloatingInput label="מוסד / חברה" id="inst" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FloatingInput label="אימייל מוסדי" id="email" type="email" />
                                                <FloatingInput label="טלפון" id="phone" type="tel" />
                                            </div>
                                            <FloatingInput label="איך נוכל לעזור?" id="msg" isTextArea />

                                            <motion.button
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
                <section className="mt-32 max-w-4xl mx-auto px-6 text-center">
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
