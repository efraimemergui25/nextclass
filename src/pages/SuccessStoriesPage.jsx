import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const glassCard = {
 background: 'rgba(255,255,255,0.45)',
 backdropFilter: 'blur(48px) saturate(1.8)',
 WebkitBackdropFilter: 'blur(48px) saturate(1.8)',
 border: '1px solid rgba(255,255,255,0.6)',
 boxShadow: '0 12px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.85) inset',
};

const SuccessStoriesPage = () => {
 useEffect(() => {

 }, []);

 const testimonials = [
 {
 quote: "השימוש במסכי nextclass העלה את רמת המעורבות של התלמידים בצורה יוצאת דופן. זה פשוט עולם אחר.",
 name: "ד״ר רונית כהן",
 role: "מנהלת תיכון עירוני ה׳, תל אביב",
 avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
 },
 {
 quote: "ההתקנה הייתה מהירה, ההדרכה הייתה מקצועית, והתוצאה — מעבדת STEM שהפכה לגאווה של בית הספר.",
 name: "יוסי לוי",
 role: "סגן מנהל, בית ספר יסודי ״אופק״, חיפה",
 avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
 },
 {
 quote: "עברנו ל-nextclass אחרי שנים של ספקים מאכזבים. ההבדל מורגש בכל שיעור — גם המורים וגם הילדים מרוצים.",
 name: "מיכל ברקוביץ׳",
 role: "מנהלת רכש, רשת אורט",
 avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100"
 },
 {
 quote: "השילוט הדיגיטלי בקמפוס שלנו הפך ל-Landmark. סטודנטים ומבקרים תמיד עוצרים להסתכל.",
 name: "פרופ׳ אריאל שמיר",
 role: "דיקן הנדסה, אוניברסיטת אריאל",
 avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"
 },
 {
 quote: "מ-nextclass קיבלנו לא רק ציוד — קיבלנו שותף אמיתי. הם מבינים את השטח, מבינים את האתגרים.",
 name: "שרה אברהם",
 role: "מפקחת טכנולוגיות חינוך, משרד החינוך",
 avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100"
 },
 {
 quote: "הזמנת הרכש הייתה חלקה ומהירה. הם מכירים את הביורוקרטיה של המגזר הציבורי ויודעים לעבוד אתה.",
 name: "עומר נחום",
 role: "מנהל תפעול, עיריית באר שבע",
 avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
 }
 ];

 return (
 <PageTransition>
 <div className="min-h-screen bg-brand-light pt-32 pb-24 w-full">

 {/* Page Header */}
 <motion.div
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className="text-center max-w-3xl mx-auto mb-20 px-6"
 >
 <span className="text-[11px] font-bold text-[#007AFF] block mb-4">לקוחות מרוצים</span>
 <h1 className="text-5xl md:text-6xl font-apple-display text-[#1D1D1F] mb-4 tracking-tighter leading-[1.05]">
 תוצאות בשטח.<br />
 <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>מהלקוחות שלנו.</span>
 </h1>
 <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
 למעלה מ-500 מוסדות חינוך כבר שינו את פני הלמידה עם NextClass.
 </p>
 </motion.div>

 {/* Testimonials Grid — Liquid Glass Cards */}
 <motion.div
 initial="hidden"
 whileInView="show"
 viewport={{ once: true }}
 variants={{
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.1 } }
 }}
 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 max-w-[1400px] mx-auto px-6 md:px-12 mb-32"
 >
 {testimonials.map((t, idx) => (
 <motion.div
 key={idx}
 variants={{
 hidden: { opacity: 0, y: 30, scale: 0.95 },
 show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } }
 }}
 whileHover={{ y: -8, scale: 1.02 }}
 transition={{ type: 'spring', stiffness: 350, damping: 28 }}
 className="glass-apple p-10 rounded-[2.5rem] relative overflow-hidden group border border-white/60 shadow-xl"
 >
 {/* Ambient glow on hover */}
 <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"
 style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.06) 0%, transparent 70%)' }} />

 {/* Quote Icon */}
 <span className="text-7xl text-[#007AFF]/5 absolute top-4 right-8 font-serif leading-none select-none pointer-events-none group-hover:text-[#007AFF]/10 transition-colors">
 ״
 </span>

 {/* Quote Content */}
 <p className="text-lg text-gray-600 mb-10 leading-[1.8] relative z-10 font-medium italic">
 {t.quote}
 </p>

 {/* Author Info */}
 <div className="flex items-center gap-5 relative z-10">
 <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-4 ring-white shadow-lg">
 <img
 src={t.avatar}
 alt={t.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 if (!e.target.dataset.triedFallback) {
 e.target.dataset.triedFallback = 'true';
 e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
 }
 }}
 />
 </div>
 <div className="text-right">
 <div className="font-black text-[#1D1D1F] text-lg tracking-tight leading-tight mb-1">{t.name}</div>
 <div className="text-xs text-[#86868B] font-bold">{t.role}</div>
 </div>
 </div>
 </motion.div>
 ))}
 </motion.div>

 {/* ── World-Class Partners Section ── */}
 <div className="max-w-[1400px] mx-auto px-6 text-center border-t border-gray-100 pt-32">
 <h3 className="text-xs font-black text-gray-400 mb-16">מוסדות מובילים שבחרו בחדשנות</h3>
 <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700">
 {/* Fake partner logos placeholder using text/simple icons */}
 {['אוניברסיטת תל אביב', 'עיריית ירושלים', 'משרד החינוך', 'עמל', 'אורט', 'רמת גן'].map((partner, i) => (
 <span key={i} className="text-2xl md:text-3xl font-black tracking-tighter text-[#1D1D1F] hover:opacity-100 transition-opacity cursor-default">{partner}</span>
 ))}
 </div>
 </div>

 </div>
 </PageTransition>
 );
};

export default SuccessStoriesPage;
