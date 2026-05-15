/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, PlayCircle, HelpCircle, GraduationCap, Headphones, ChevronLeft, Zap, BookOpen, Phone, MessageCircle, Mail, Search, Sparkles, Clock, ShoppingBag, FileText, Newspaper } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';

// ─── VOD Data ────────────────────────────────────────────────────────────────

const DEFAULT_VIDEOS = [
 { id: 1, title: 'חיבור ראשוני והגדרות רשת מתקדמות', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'התקנה', level: 'מתחיל', visible: true },
 { id: 2, title: 'עבודה עם לוח EduEdit Studio', duration: '12:15', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'פדגוגיה', level: 'בינוני', visible: true },
 { id: 3, title: 'שיתוף מסך אלחוטי מכל מכשיר', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'קישוריות', level: 'מתחיל', visible: true },
 { id: 4, title: 'ניהול כיתה חכמה בזמן אמת', duration: '8:30', thumbnail: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'ניהול', level: 'מתקדם', visible: true },
 { id: 5, title: 'שימוש ב-20 נקודות מגע בו-זמנית', duration: '2:55', thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'תכונות', level: 'בינוני', visible: true },
 { id: 6, title: 'התקנת מעמד חשמלי מתכוונן', duration: '6:10', thumbnail: 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=800', videoUrl: '', category: 'התקנה', level: 'מתחיל', visible: true },
];

function loadVideos() {
 try {
 const v = localStorage.getItem('nextclass_vod');
 if (v) { const p = JSON.parse(v); if (Array.isArray(p) && p.length > 0) return p; }
 } catch {}
 return DEFAULT_VIDEOS;
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ = [
 { q: 'כמה זמן לוקחת ההתקנה?', a: 'התקנת מסך בודד לוקחת בין שעה לשלוש שעות, בהתאם לסוג ההתקנה (קיר, מעמד נייד, מסגרת). לבתי ספר עם מספר כיתות — אנו מתכננים לוח זמנים מותאם שמינימיזציה ההפרעה לשגרת הלימודים.' },
 { q: 'מה כוללת האחריות?', a: 'כל המוצרים מגיעים עם אחריות יצרן בהתאם לדגם (בדרך כלל 2-5 שנים). בנוסף, NextClass מציעה תמיכה טכנית ישירה ב-WhatsApp וטלפון לכל תקופת האחריות. החלפה תוך 30 יום לתקלות ייצור.' },
 { q: 'האם ניתן לממן דרך תקציב ממ"ד / משרד החינוך?', a: 'כן — אנו מנפיקים חשבוניות רשמיות ועובדים עם כל מסגרות הרכש הממשלתיות, כולל מכרזים ורשימות ספקים מאושרים. פנו אלינו ונסייע בתהליך הרכש.' },
 { q: 'האם יש הדרכה לצוות המורים?', a: 'בהחלט. כל רכישה כוללת הדרכה בסיסית. הדרכה מורחבת בבית הספר (מדריך אישי לצוות) זמינה כשירות נפרד. ראה את לשונית "הדרכה" לפרטים.' },
 { q: 'מה ההבדל בין המסכים השונים?', a: 'ההבדלים העיקריים הם גודל המסך (55"–98"), רזולוציה (4K), מספר נקודות מגע (10–40), ועוצמת עיבוד המעבד הפנימי. נשמח לעזור בבחירה מותאמת לצרכי הכיתה וגודל הקהל.' },
 { q: 'האם המסכים מתחברים לכל מערכות ניהול הכיתה?', a: 'כן — כל המסכים שלנו תומכים ב-AirPlay, Miracast, Google Cast ו-USB-C. תואמים ל-Google Workspace, Microsoft 365 ו-Apple Classroom.' },
 { q: 'כמה זמן ממועד ההזמנה עד האספקה?', a: 'ברוב המקרים 5–14 ימי עסקים לאחר אישור הצעת המחיר. פרויקטים גדולים (מעל 10 יחידות) מתואמים בלוח זמנים מוסכם.' },
 { q: 'מה קורה אם יש תקלה לאחר ההתקנה?', a: 'יש לנו קו תמיכה ישיר ב-WhatsApp. פניות נענות תוך שעה בשעות פעילות (א׳–ו׳, 08:00–20:00). תקלות המצריכות טכנאי — נגיע לבית הספר תוך 48 שעות.' },
];

// ─── Sidebar quick-links (real NextClass offerings) ───────────────────────────

const SIDEBAR_LINKS = [
 {
 to: '/catalog',
 icon: ShoppingBag,
 color: 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]',
 title: 'קטלוג המוצרים',
 sub: 'מסכים חכמים · טאבלטים · מעבדות STEM',
 },
 {
 to: '/contact',
 icon: FileText,
 color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
 title: 'בקשו הצעת מחיר',
 sub: 'מענה מפורט תוך 24 שעות',
 },
 {
 to: '/magazine',
 icon: Newspaper,
 color: 'bg-gradient-to-br from-purple-500 to-pink-600',
 title: 'בלוג חדשנות פדגוגית',
 sub: 'מאמרים ומחקרים לצוות ההוראה',
 },
];

function AcademySidebar() {
 return (
 <div className="lg:col-span-4 flex flex-col gap-6 sticky top-28">
 {/* Training CTA */}
 <motion.div
 whileHover={{ y: -4 }}
 className="glass-apple p-10 bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white shadow-2xl rounded-[2.5rem] relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
 <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
 <Zap className="w-6 h-6 text-white" />
 </div>
 <h3 className="text-2xl font-apple-display tracking-tight mb-4 leading-tight text-right">
 זקוקים להדרכה<br />בבית הספר?
 </h3>
 <p className="text-white/80 font-medium mb-10 text-right leading-relaxed">
 צוות המדריכים שלנו יגיע אליכם להדרכה חיה ומותאמת אישית לצוות המורים.
 </p>
 <Link to="/contact" className="flex w-full py-4 bg-white text-[#007AFF] rounded-2xl items-center justify-center font-bold text-[15px] shadow-xl hover:shadow-2xl transition-all">
 תאמו הדרכה עכשיו
 </Link>
 </motion.div>

 {/* Real quick-action links */}
 <div className="flex flex-col gap-3">
 {SIDEBAR_LINKS.map((item) => (
 <Link key={item.to} to={item.to} className="no-underline">
 <motion.div
 whileHover={{ x: -6, backgroundColor: 'rgba(255,255,255,0.95)' }}
 className="glass-apple gestalt-card p-5 flex items-center gap-4 cursor-pointer border border-white/60 bg-white/60"
 >
 <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center text-white shadow-md shrink-0`}>
 <item.icon size={18} />
 </div>
 <div className="flex-1 text-right">
 <p className="text-[15px] font-bold text-[#1D1D1F] tracking-tight">{item.title}</p>
 <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
 </div>
 <ChevronLeft className="text-gray-300 shrink-0" size={16} />
 </motion.div>
 </Link>
 ))}
 </div>
 </div>
 );
}

// ─── Academy Card (video card) ────────────────────────────────────────────────

function AcademyCard({ video }) {
 const handlePlay = () => { if (video.videoUrl) window.open(video.videoUrl, '_blank', 'noopener,noreferrer'); };
 return (
 <motion.div
 whileHover={{ y: -10, scale: 1.01 }}
 transition={{ type: 'spring', stiffness: 380, damping: 32 }}
 className="glass-apple gestalt-card overflow-hidden group cursor-pointer border border-white/50 shadow-sm bg-white/40"
 onClick={handlePlay}
 >
 <div className="aspect-[16/10] relative overflow-hidden">
 <img
 src={video.thumbnail}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
 alt={video.title}
 loading="lazy"
 onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried = 'true'; e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop'; } }}
 />
 <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[1px]">
 <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#007AFF] shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
 <Play fill="currentColor" size={20} className="ml-1" />
 </div>
 </div>
 {video.level && (
 <div className="absolute top-4 left-4 glass-apple px-3 py-1 rounded-full text-[9px] font-black text-white bg-black/40 backdrop-blur-xl border border-white/20">
 {video.level}
 </div>
 )}
 {video.category && (
 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#007AFF] text-[9px] font-black px-2.5 py-1 rounded-full">
 {video.category}
 </div>
 )}
 </div>
 <div className="p-6 text-right">
 <h3 className="text-[18px] font-apple-display text-[#1D1D1F] mb-4 leading-tight tracking-tight">{video.title}</h3>
 <div className="flex items-center justify-end gap-4 text-[10px] font-black text-gray-400">
 <div className="flex items-center gap-1.5">
 <span>{video.duration}</span>
 <Clock size={12} />
 </div>
 </div>
 </div>
 </motion.div>
 );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ item, index }) {
 const [open, setOpen] = useState(false);
 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
 className="glass-apple gestalt-card overflow-hidden border border-white/50 bg-white/60"
 >
 <button
 onClick={() => setOpen(p => !p)}
 className="w-full flex items-center justify-between p-6 bg-transparent border-none cursor-pointer text-right gap-3"
 >
 <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="text-gray-300 text-[11px] shrink-0">▼</motion.span>
 <span className="text-[15px] font-bold text-[#1D1D1F] flex-1 text-right">{item.q}</span>
 </button>
 <AnimatePresence initial={false}>
 {open && (
 <motion.div key="ans" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
 <p className="px-6 pb-6 text-[14px] leading-[1.75] text-[#3C3C43] border-t border-white/60 pt-4">{item.a}</p>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

// ─── Tab Content ──────────────────────────────────────────────────────────────

function VideosTab({ videos, heroSearch }) {
 const [filter, setFilter] = useState('הכל');
 const cats = ['הכל', 'התקנה', 'פדגוגיה', 'ניהול', ...Array.from(new Set(videos.map(v => v.category).filter(c => c && !['התקנה', 'פדגוגיה', 'ניהול'].includes(c))))];
 const byCategory = filter === 'הכל' ? videos : videos.filter(v => v.category === filter);
 const shown = heroSearch ? byCategory.filter(v => v.title?.includes(heroSearch) || v.category?.includes(heroSearch)) : byCategory;

 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
 {/* Main */}
 <div className="lg:col-span-8 flex flex-col gap-10">
 <div className="flex flex-col md:flex-row justify-between items-end gap-6">
 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
 {cats.map(c => (
 <button
 key={c}
 onClick={() => setFilter(c)}
 className={`px-6 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${filter === c ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:text-black border border-gray-100'}`}
 >
 {c}
 </button>
 ))}
 </div>
 <div className="text-right shrink-0">
 <h2 className="text-3xl font-apple-display text-[#1D1D1F] tracking-tight">מדריכי וידאו</h2>
 <p className="text-[13px] text-gray-400 font-medium">הדרכות שלב-אחר-שלב לכל שלבי ההטמעה.</p>
 </div>
 </div>

 {shown.length === 0
 ? <div className="text-center py-20 text-gray-300 text-[15px]">{heroSearch ? `לא נמצאו סרטונים עבור "${heroSearch}"` : 'אין סרטונים להצגה כרגע.'}</div>
 : <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 {shown.map(video => <AcademyCard key={video.id} video={video} />)}
 </div>
 }

 </div>

 <AcademySidebar />
 </div>
 );
}

function HelpTab() {
 const { getSetting } = useSettings();
 const waNumber = getSetting('whatsapp_number', '972585856356');
 const [search, setSearch] = useState('');
 const filtered = FAQ.filter(f => !search || f.q.includes(search) || f.a.includes(search));

 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
 <div className="lg:col-span-8 flex flex-col gap-8">
 {/* Search */}
 <div className="relative group">
 <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
 <input
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="מה תרצו לדעת?"
 dir="rtl"
 className="w-full bg-white/80 backdrop-blur-3xl border border-white/60 rounded-full px-16 py-5 text-[16px] outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:bg-white transition-all text-right shadow-sm"
 />
 </div>

 <div className="flex flex-col gap-3">
 {filtered.length === 0
 ? <p className="text-gray-300 text-center py-14 text-[15px]">לא נמצאו תוצאות.</p>
 : filtered.map((item, i) => <FAQItem key={i} item={item} index={i} />)
 }
 </div>

 {/* WhatsApp CTA */}
 <div className="glass-apple gestalt-card p-8 border border-white/50 bg-white/60 flex items-center justify-between gap-6 flex-wrap">
 <div className="text-right">
 <p className="font-bold text-[#1D1D1F] text-[16px]">לא מצאת תשובה?</p>
 <p className="text-[13px] text-gray-400 mt-1">צוות התמיכה שלנו זמין ב-WhatsApp ראשון–שישי, 08:00–20:00.</p>
 </div>
 <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer"
 className="flex items-center gap-2 px-7 py-3.5 bg-[#25D366] text-white font-bold rounded-full text-[14px] hover:bg-[#1ebe5d] transition-colors whitespace-nowrap shadow-lg">
 <MessageCircle size={16} />
 פתח WhatsApp
 </a>
 </div>
 </div>

 <AcademySidebar />
 </div>
 );
}

function TrainingTab() {
 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
 <div className="lg:col-span-8 flex flex-col gap-8">
 <div className="text-right">
 <h2 className="text-3xl font-apple-display text-[#1D1D1F] tracking-tight mb-2">שירותי הדרכה</h2>
 <p className="text-[14px] text-gray-400">הדרכה מקצועית לכל שלב — מהתקנה ועד שליטה מלאה.</p>
 </div>

 {/* Real training services */}
 {[
 {
 icon: Zap,
 color: 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]',
 title: 'הדרכה בסיסית — כלולה בכל רכישה',
 sub: 'הדרכת הפעלה ראשונית של המסך, חיבור לרשת ותצורת הכיתה. ניתנת ביום ההתקנה על ידי הטכנאי.',
 },
 {
 icon: GraduationCap,
 color: 'bg-gradient-to-br from-purple-500 to-pink-600',
 title: 'הדרכת צוות מורחבת',
 sub: 'מדריך מוסמך מגיע לבית הספר לסדנה מעמיקה — שימוש פדגוגי, EduEdit Studio, שיתוף מסך ועבודה עם Google Workspace.',
 },
 {
 icon: Phone,
 color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
 title: 'תמיכה שוטפת לאחר ההדרכה',
 sub: 'צוות התמיכה זמין ב-WhatsApp וטלפון לכל שאלה לאחר ההדרכה. מענה תוך שעה בימים א׳–ו׳.',
 },
 ].map((s, i) => (
 <div key={i} className="glass-apple gestalt-card p-7 border border-white/50 bg-white/60 flex items-start gap-5 text-right">
 <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center text-white shadow-md shrink-0 mt-0.5`}>
 <s.icon size={20} />
 </div>
 <div>
 <p className="font-bold text-[#1D1D1F] text-[16px] mb-1">{s.title}</p>
 <p className="text-[13px] text-gray-400 leading-relaxed">{s.sub}</p>
 </div>
 </div>
 ))}

 {/* In-person training CTA */}
 <div className="glass-apple gestalt-card p-8 border border-white/50 bg-white/60 flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="text-right">
 <p className="font-bold text-[#1D1D1F] text-[16px]">הדרכה חיה בבית הספר</p>
 <p className="text-[13px] text-gray-400 mt-1">מדריך מוסמך יגיע לכם — ויתאים את ההדרכה לצוות ולציוד שלכם.</p>
 </div>
 <Link
 to="/contact"
 className="flex items-center gap-2 px-8 py-4 bg-[#007AFF] text-white font-bold rounded-2xl text-[15px] hover:bg-[#0066DD] transition-colors whitespace-nowrap shadow-lg shrink-0"
 >
 <Zap size={16} />
 תאמו הדרכה עכשיו
 </Link>
 </div>
 </div>

 <AcademySidebar />
 </div>
 );
}

function SupportTab({ phone, email, waNumber }) {
 const wa = `https://wa.me/${waNumber}`;
 const channels = [
 { icon: MessageCircle, color: '#25D366', bg: 'rgba(37,211,102,0.07)', border: 'rgba(37,211,102,0.2)', label: 'WhatsApp', sub: 'מענה תוך שעה · א׳–ו׳ 08–20', action: wa, actionLabel: 'פתח שיחה', external: true },
 { icon: Phone, color: '#007AFF', bg: 'rgba(0,122,255,0.06)', border: 'rgba(0,122,255,0.15)', label: 'טלפון', sub: `${phone} · א׳–ו׳ 09–18`, action: `tel:${phone.replace(/\D/g, '')}`, actionLabel: 'התקשר', external: false },
 { icon: Mail, color: '#5856D6', bg: 'rgba(88,86,214,0.06)', border: 'rgba(88,86,214,0.15)', label: 'דוא"ל', sub: `${email} · מענה תוך יום`, action: `mailto:${email}`, actionLabel: 'שלח מייל', external: false },
 ];

 return (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
 <div className="lg:col-span-8 flex flex-col gap-6">
 <div className="text-right mb-2">
 <h2 className="text-3xl font-apple-display text-[#1D1D1F] tracking-tight mb-2">צור קשר</h2>
 <p className="text-[14px] text-gray-400">בחר את הערוץ המועדף עליך — נשמח לעזור.</p>
 </div>

 {channels.map((ch, i) => (
 <motion.a
 key={i}
 href={ch.action}
 target={ch.external ? '_blank' : undefined}
 rel={ch.external ? 'noopener noreferrer' : undefined}
 whileHover={{ x: -6 }}
 transition={{ type: 'spring', stiffness: 380, damping: 28 }}
 className="glass-apple gestalt-card flex items-center gap-5 p-7 border border-white/50 no-underline"
 style={{ background: ch.bg, borderColor: ch.border }}
 >
 <div style={{ width: 52, height: 52, borderRadius: 16, background: ch.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <ch.icon size={22} color="#fff" />
 </div>
 <div className="flex-1 text-right">
 <p className="text-[17px] font-bold text-[#1D1D1F] mb-1">{ch.label}</p>
 <p className="text-[13px] text-gray-400">{ch.sub}</p>
 </div>
 <span className="text-[13px] font-bold whitespace-nowrap px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm" style={{ color: ch.color }}>
 {ch.actionLabel} ←
 </span>
 </motion.a>
 ))}

 <div className="glass-apple gestalt-card p-8 border border-white/50 bg-white/60">
 <p className="text-[12px] font-black text-gray-400 text-right mb-6">שעות פעילות</p>
 <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[14px] text-gray-500">
 {[['ראשון–חמישי', '08:00–20:00'], ['שישי', '08:00–14:00'], ['שבת', 'סגור'], ['WhatsApp', 'ראשון–שישי 08–20']].map(([d, h]) => (
 <div key={d} className="flex justify-between border-b border-gray-100 pb-3">
 <span className="font-bold text-[#1D1D1F]">{h}</span>
 <span>{d}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <AcademySidebar />
 </div>
 );
}

// ─── Tabs Config ──────────────────────────────────────────────────────────────

const TABS = [
 { id: 'videos', icon: PlayCircle, label: 'מדריכי וידאו' },
 { id: 'help', icon: HelpCircle, label: 'מרכז עזרה' },
 { id: 'training', icon: GraduationCap, label: 'הדרכה' },
 { id: 'support', icon: Headphones, label: 'תמיכה' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VODCenterPage() {
 const { getSetting } = useSettings();
 const phone = getSetting('contact_phone', '058-5856356');
 const email = getSetting('contact_email', 'nextclass.en@gmail.com');
 const waNumber = getSetting('whatsapp_number', '972585856356');

 const [searchParams, setSearchParams] = useSearchParams();
 const [videos, setVideos] = useState(loadVideos);
 const [heroSearch, setHeroSearch] = useState('');
 const activeTab = TABS.find(t => t.id === searchParams.get('tab'))?.id ?? 'videos';

 useEffect(() => {
 const onStorage = e => { if (e.key === 'nextclass_vod') setVideos(loadVideos()); };
 window.addEventListener('storage', onStorage);
 return () => window.removeEventListener('storage', onStorage);
 }, []);

 useEffect(() => { window.scrollTo(0, 0); }, [activeTab]);

 const setTab = (id) => setSearchParams(id === 'videos' ? {} : { tab: id }, { replace: true });
 const visible = videos.filter(v => v.visible !== false);

 return (
 <PageTransition>
 <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-20 w-full overflow-x-hidden" dir="rtl">

 {/* ── Hero ───────────────────────────────────────────────── */}
 <section className="max-w-5xl mx-auto px-6 text-center mb-16">
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5 }}
 className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] mb-10 border border-blue-100"
 >
 <Sparkles size={10} />
 <span>NextClass Academy • המרכז לחדשנות פדגוגית</span>
 </motion.div>

 <motion.h1
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1, duration: 0.6 }}
 className="text-4xl md:text-7xl font-apple-display text-[#1D1D1F] tracking-tighter mb-10 leading-[1.05] whitespace-nowrap"
 >
 עתיד הלמידה,{' '}<span className="text-[#007AFF]">עכשיו.</span>
 </motion.h1>

 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2, duration: 0.5 }}
 className="relative max-w-2xl mx-auto group"
 >
 <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
 <input
 type="text"
 value={heroSearch}
 onChange={e => {
 setHeroSearch(e.target.value);
 if (activeTab !== 'videos') setTab('videos');
 }}
 onKeyDown={e => { if (e.key === 'Enter') setTab('videos'); }}
 placeholder="חפשו סרטון לפי נושא..."
 className="w-full bg-white/80 backdrop-blur-3xl border border-white/60 rounded-full px-16 py-6 text-[17px] outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:bg-white transition-all text-right shadow-sm"
 />
 {heroSearch && (
 <button onClick={() => setHeroSearch('')} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none">×</button>
 )}
 </motion.div>
 </section>

 {/* ── Tab Bar ────────────────────────────────────────────── */}
 <div className="sticky top-[73px] z-30 bg-[#F5F5F7]/90 backdrop-blur-xl border-b border-black/[0.06] mb-12">
 <div className="max-w-[1400px] mx-auto px-6">
 <div className="flex gap-1 overflow-x-auto no-scrollbar py-3">
 {TABS.map(tab => {
 const active = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setTab(tab.id)}
 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] whitespace-nowrap transition-all ${active ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#8E8E93] hover:text-[#1D1D1F] hover:bg-white/50'}`}
 >
 <tab.icon size={15} className={active ? 'text-[#007AFF]' : ''} />
 {tab.label}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ── Content ────────────────────────────────────────────── */}
 <div className="max-w-[1400px] mx-auto px-6">
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
 >
 {activeTab === 'videos' && <VideosTab videos={visible} heroSearch={heroSearch} />}
 {activeTab === 'help' && <HelpTab />}
 {activeTab === 'training' && <TrainingTab />}
 {activeTab === 'support' && <SupportTab phone={phone} email={email} waNumber={waNumber} />}
 </motion.div>
 </AnimatePresence>
 </div>

 </div>
 </PageTransition>
 );
}
