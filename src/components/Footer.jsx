import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Mail, Phone, MapPin, Sparkles, Send, CheckCircle2, ArrowLeft } from 'lucide-react';

const Footer = () => {
 const navigate = useNavigate();
 const { getSetting } = useSettings();
 const logoClickRef = useRef({ count: 0, timer: null });

 const content = useMemo(() => ({
 siteName: getSetting('site_name', 'NextClass'),
 phone: getSetting('contact_phone', '058-5856356'),
 email: getSetting('contact_email', 'nextclass.en@gmail.com'),
 address: getSetting('contact_address', 'בראלי 10, תל אביב'),
 copyright: getSetting('footer_copyright', '© 2026 NextClass. כל הזכויות שמורות.'),
 tagline: getSetting('footer_tagline', 'ציוד חינוך ממחסן ישיר. שירות אמיתי. מחיר שקוף.'),
 loveMsg: getSetting('footer_love_msg', 'נבנה באהבה לחינוך'),
 col1: getSetting('footer_col1_title', 'פתרונות'),
 col1Items: getSetting('footer_col1_items', 'מסכים חכמים, מחשוב וטאבלטים, מעבדות STEM, תשתיות למידה').split(',').map(s => s.trim()),
 col2: getSetting('footer_col2_title', 'האקדמיה'),
 col2Items: getSetting('footer_col2_items', 'מרכז עזרה, מדריכי וידאו, בלוג חדשנות, תמיכה טכנית').split(',').map(s => s.trim()),
 col3: getSetting('footer_col3_title', 'קשר'),
 privacy: getSetting('footer_privacy', 'פרטיות'),
 terms: getSetting('footer_terms', 'תנאי שימוש'),
 location: getSetting('footer_location', 'ISRAEL | HEBREW'),
 }), [getSetting]);

 const [email, setEmail] = useState('');
 const [status, setStatus] = useState('idle');

 const handleSubscribe = async (e) => {
 e.preventDefault();
 if (!email || !email.includes('@')) { setStatus('error'); return; }
 setStatus('loading');
 try {
 await addDoc(collection(db, 'newsletter_subs'), {
 email: email.trim().toLowerCase(),
 timestamp: serverTimestamp(),
 source: 'footer_newsletter'
 });
 setStatus('success');
 setEmail('');
 setTimeout(() => setStatus('idle'), 5000);
 } catch {
 setStatus('error');
 setTimeout(() => setStatus('idle'), 3000);
 }
 };

 const handleLogoClick = useCallback((e) => {
 e.preventDefault();
 logoClickRef.current.count += 1;
 clearTimeout(logoClickRef.current.timer);
 logoClickRef.current.timer = setTimeout(() => {
 if (logoClickRef.current.count === 1) navigate('/');
 logoClickRef.current.count = 0;
 }, 500);
 if (logoClickRef.current.count >= 3) {
 clearTimeout(logoClickRef.current.timer);
 logoClickRef.current.count = 0;
 navigate('/admin');
 }
 }, [navigate]);

 return (
 <footer className="w-full mt-auto overflow-hidden" dir="rtl">

 {/* ── Main footer body ─────────────────────────────────────── */}
 <div className="relative bg-[#F5F5F7] pt-14 pb-10 overflow-hidden"
 style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>

 {/* Ambient glows */}
 <div className="absolute top-0 right-0 w-[420px] h-[300px] bg-[#007AFF]/6 rounded-full blur-[110px] -mr-32 -mt-32 pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-[320px] h-[260px] bg-[#5856D6]/5 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />

 <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-10">

 {/* ── Brand column ─────────────────────────────── */}
 <div className="lg:col-span-4 flex flex-col gap-5">
 {/* Logo */}
 <Link to="/" onClick={handleLogoClick}
 className="text-xl font-black tracking-tighter text-[#1D1D1F] hover:opacity-70 transition-opacity w-fit">
 {content.siteName}
 </Link>

 {/* Tagline */}
 <p className="text-[14px] text-[#86868B] font-medium leading-relaxed max-w-[260px]">
 {content.tagline}
 </p>

 {/* Love badge */}
 <div className="flex items-center gap-2 w-fit">
 <Sparkles size={12} className="text-[#007AFF]" />
 <span className="text-[10px] font-black text-[#AEAEB2]">{content.loveMsg}</span>
 </div>

 {/* Newsletter */}
 <div className="mt-2">
 <p className="text-[10px] font-black text-[#1D1D1F] mb-3">
 בואו נישאר מחוברים
 </p>
 <form onSubmit={handleSubscribe} className="relative">
 <input
 type="email"
 value={email}
 onChange={e => setEmail(e.target.value)}
 placeholder="כתובת אימייל..."
 disabled={status === 'loading' || status === 'success'}
 className="w-full h-11 bg-white rounded-xl pr-4 pl-12 text-[13px] font-medium border border-black/[0.08] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] disabled:opacity-50 placeholder:text-[#AEAEB2]"
 />
 <button
 type="submit"
 disabled={status === 'loading' || status === 'success'}
 className="absolute left-1.5 top-1.5 bottom-1.5 w-8 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center transition-all hover:bg-[#007AFF] active:scale-95 disabled:bg-[#AEAEB2]"
 >
 <AnimatePresence mode="wait">
 {status === 'success' ? (
 <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
 <CheckCircle2 size={14} />
 </motion.div>
 ) : status === 'loading' ? (
 <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <motion.div key="send" initial={{ x: 4, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
 <Send size={13} className="-rotate-45" />
 </motion.div>
 )}
 </AnimatePresence>
 </button>
 </form>
 <AnimatePresence>
 {status === 'success' && (
 <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
 className="mt-2 text-[11px] font-bold text-[#34C759]">
 נרשמת בהצלחה!
 </motion.p>
 )}
 {status === 'error' && (
 <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
 className="mt-2 text-[11px] font-bold text-[#FF3B30]">
 בדוק את האימייל ונסה שוב.
 </motion.p>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* ── Link columns ─────────────────────────────── */}
 <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">

 {/* Col 1 */}
 <div>
 <h4 className="text-[10px] font-black text-[#1D1D1F] mb-5">{content.col1}</h4>
 <nav className="flex flex-col gap-3">
 {content.col1Items.map(item => (
 <Link key={item} to="/catalog"
 className="text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors w-fit">
 {item}
 </Link>
 ))}
 </nav>
 </div>

 {/* Col 2 */}
 <div>
 <h4 className="text-[10px] font-black text-[#1D1D1F] mb-5">{content.col2}</h4>
 <nav className="flex flex-col gap-3">
 <Link to="/vod?tab=help" className="text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors w-fit">מרכז עזרה</Link>
 <Link to="/vod" className="text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors w-fit">מדריכי וידאו</Link>
 <Link to="/magazine" className="text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors w-fit">בלוג חדשנות</Link>
 <Link to="/vod?tab=support" className="text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors w-fit">תמיכה טכנית</Link>
 </nav>
 </div>

 {/* Col 3 — Contact, RTL-correct */}
 <div>
 <h4 className="text-[10px] font-black text-[#1D1D1F] mb-5">{content.col3}</h4>
 <div className="flex flex-col gap-4">
 <a href={`tel:${content.phone}`}
 className="group flex items-center justify-end gap-2 text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors">
 <span dir="ltr">{content.phone}</span>
 <div className="w-6 h-6 rounded-lg bg-[#007AFF]/8 flex items-center justify-center group-hover:bg-[#007AFF]/15 transition-colors shrink-0">
 <Phone size={11} className="text-[#007AFF]" />
 </div>
 </a>
 <a href={`mailto:${content.email}`}
 className="group flex items-center justify-end gap-2 text-[13px] text-[#86868B] font-medium hover:text-[#007AFF] transition-colors">
 <span dir="ltr">{content.email}</span>
 <div className="w-6 h-6 rounded-lg bg-[#007AFF]/8 flex items-center justify-center group-hover:bg-[#007AFF]/15 transition-colors shrink-0">
 <Mail size={11} className="text-[#007AFF]" />
 </div>
 </a>
 <div className="flex items-center justify-end gap-2 text-[13px] text-[#86868B] font-medium">
 <span>{content.address}</span>
 <div className="w-6 h-6 rounded-lg bg-[#007AFF]/8 flex items-center justify-center shrink-0">
 <MapPin size={11} className="text-[#007AFF]" />
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>

 {/* ── Divider ──────────────────────────────────────── */}
 <div className="h-px bg-black/[0.07] mb-6" />

 {/* ── Mid bar — links + locale ──────────────────────── */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="flex items-center gap-5">
 <Link to="/privacy" className="text-[11px] text-[#AEAEB2] font-medium hover:text-[#007AFF] transition-colors">{content.privacy}</Link>
 <Link to="/terms" className="text-[11px] text-[#AEAEB2] font-medium hover:text-[#007AFF] transition-colors">{content.terms}</Link>
 <Link to="/contact" className="text-[11px] text-[#AEAEB2] font-medium hover:text-[#007AFF] transition-colors">צור קשר</Link>
 </div>
 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-black/[0.06] shadow-sm">
 <Globe size={10} className="text-[#007AFF]" />
 <span className="text-[9px] font-black text-[#86868B]">{content.location}</span>
 </div>
 </div>
 </div>
 </div>

 {/* ── Dark bottom strip ────────────────────────────────────── */}
 <div className="bg-[#1D1D1F] px-6 md:px-12 py-4">
 <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
 <span className="text-[11px] text-white/35 font-medium ">{content.copyright}</span>
 <div className="flex items-center gap-1.5 text-white/25">
 <Sparkles size={9} />
 <span className="text-[10px] font-black">{content.loveMsg}</span>
 </div>
 </div>
 </div>

 </footer>
 );
};

export default Footer;
