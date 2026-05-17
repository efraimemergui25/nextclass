import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, animate as animateMotion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '', duration = 1.4 }) {
 const ref = useRef(null);
 const inView = useInView(ref, { once: true });
 const motionValue = useMotionValue(0);
 const [display, setDisplay] = useState('0');
 useEffect(() => {
  if (!inView) return;
  const controls = animateMotion(motionValue, value, {
   duration,
   ease: [0.22, 1, 0.36, 1],
   onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('he-IL')),
  });
  return controls.stop;
 }, [inView, value, duration, motionValue]);
 return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ count = 5 }) {
 return (
  <div className="flex items-center gap-0.5 mb-5">
   {Array.from({ length: count }).map((_, i) => (
    <motion.svg
     key={i}
     initial={{ opacity: 0, scale: 0 }}
     whileInView={{ opacity: 1, scale: 1 }}
     viewport={{ once: true }}
     transition={{ delay: i * 0.06, type: 'spring', stiffness: 400, damping: 18 }}
     className="w-4 h-4 text-[#FF9500]"
     fill="currentColor"
     viewBox="0 0 24 24"
    >
     <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
    </motion.svg>
   ))}
  </div>
 );
}

// ─── Scrolling marquee ────────────────────────────────────────────────────────
function Marquee({ items }) {
 const doubled = [...items, ...items];
 return (
  <div className="overflow-hidden relative">
   <style>{`
    @keyframes marquee-rtl { 0% { transform: translateX(0); } 100% { transform: translateX(50%); } }
   `}</style>
   <div
    className="flex gap-16 md:gap-24 items-center whitespace-nowrap"
    style={{ animation: 'marquee-rtl 28s linear infinite', willChange: 'transform' }}
   >
    {doubled.map((partner, i) => (
     <span
      key={i}
      className="text-xl md:text-2xl font-black tracking-tighter text-[#1D1D1F] shrink-0 transition-opacity duration-300 hover:opacity-100 cursor-default"
      style={{ opacity: 0.35 }}
     >
      {partner}
     </span>
    ))}
   </div>
  </div>
 );
}

const SuccessStoriesPage = () => {
 const testimonials = [
  {
   quote: 'השימוש במסכי nextclass העלה את רמת המעורבות של התלמידים בצורה יוצאת דופן. זה פשוט עולם אחר.',
   name: 'ד״ר רונית כהן',
   role: 'מנהלת תיכון עירוני ה׳, תל אביב',
   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
   stars: 5,
  },
  {
   quote: 'ההתקנה הייתה מהירה, ההדרכה הייתה מקצועית, והתוצאה — מעבדת STEM שהפכה לגאווה של בית הספר.',
   name: 'יוסי לוי',
   role: 'סגן מנהל, בית ספר יסודי ״אופק״, חיפה',
   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
   stars: 5,
  },
  {
   quote: 'עברנו ל-nextclass אחרי שנים של ספקים מאכזבים. ההבדל מורגש בכל שיעור — גם המורים וגם הילדים מרוצים.',
   name: 'מיכל ברקוביץ׳',
   role: 'מנהלת רכש, רשת אורט',
   avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
   stars: 5,
  },
  {
   quote: 'השילוט הדיגיטלי בקמפוס שלנו הפך ל-Landmark. סטודנטים ומבקרים תמיד עוצרים להסתכל.',
   name: 'פרופ׳ אריאל שמיר',
   role: 'דיקן הנדסה, אוניברסיטת אריאל',
   avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
   stars: 5,
  },
  {
   quote: 'מ-nextclass קיבלנו לא רק ציוד — קיבלנו שותף אמיתי. הם מבינים את השטח, מבינים את האתגרים.',
   name: 'שרה אברהם',
   role: 'מפקחת טכנולוגיות חינוך, משרד החינוך',
   avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100',
   stars: 4,
  },
  {
   quote: 'הזמנת הרכש הייתה חלקה ומהירה. הם מכירים את הביורוקרטיה של המגזר הציבורי ויודעים לעבוד אתה.',
   name: 'עומר נחום',
   role: 'מנהל תפעול, עיריית באר שבע',
   avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
   stars: 5,
  },
 ];

 const partners = ['אוניברסיטת תל אביב', 'עיריית ירושלים', 'משרד החינוך', 'עמל', 'אורט', 'רמת גן', 'מכון ויצמן', 'אפקה'];

 const STATS = [
  { value: 500, suffix: '+', label: 'מוסדות חינוך' },
  { value: 98, suffix: '%', label: 'שביעות רצון' },
  { value: 12, suffix: '+', label: 'שנות ניסיון' },
 ];

 return (
  <PageTransition>
   <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 w-full overflow-x-hidden">

   {/* Page Header */}
   <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="text-center max-w-3xl mx-auto mb-14 px-6"
   >
    <motion.span
     initial={{ opacity: 0, scale: 0.9 }}
     animate={{ opacity: 1, scale: 1 }}
     transition={{ delay: 0.1, duration: 0.5 }}
     className="inline-flex items-center gap-2 text-[11px] font-bold text-[#007AFF] bg-[#007AFF]/08 px-4 py-1.5 rounded-full border border-[#007AFF]/15 mb-6"
    >
     <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
     לקוחות מרוצים
    </motion.span>
    <h1 className="text-5xl md:text-6xl font-apple-display text-[#1D1D1F] mb-4 tracking-tighter leading-[1.05]">
     תוצאות בשטח.<br />
     <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>מהלקוחות שלנו.</span>
    </h1>
    <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
     למעלה מ-500 מוסדות חינוך כבר שינו את פני הלמידה עם NextClass.
    </p>
   </motion.div>

   {/* ── Stat counters ── */}
   <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="max-w-2xl mx-auto grid grid-cols-3 gap-4 px-6 mb-20"
   >
    {STATS.map((s, i) => (
     <motion.div
      key={i}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-6 px-4 rounded-[2rem] relative overflow-hidden"
      style={{
       background: 'rgba(255,255,255,0.72)',
       backdropFilter: 'blur(32px) saturate(1.8)',
       WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
       border: '1px solid rgba(255,255,255,0.75)',
       boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      }}
     >
      <div
       className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[2rem]"
       style={{ background: 'linear-gradient(90deg, #007AFF, #5856D6)' }}
      />
      <p className="text-4xl font-black tracking-tighter text-[#1D1D1F] leading-none mb-1">
       <AnimatedNumber value={s.value} suffix={s.suffix} duration={1.2 + i * 0.15} />
      </p>
      <p className="text-[11px] font-bold text-[#86868B]">{s.label}</p>
     </motion.div>
    ))}
   </motion.div>

   {/* Testimonials Grid */}
   <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true }}
    variants={{
     hidden: { opacity: 0 },
     show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    }}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 max-w-[1400px] mx-auto px-6 md:px-12 mb-32"
   >
    {testimonials.map((t, idx) => (
     <motion.div
      key={idx}
      variants={{
       hidden: { opacity: 0, y: 30, scale: 0.95 },
       show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } },
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="glass-apple p-10 rounded-[2.5rem] relative overflow-hidden group border border-white/60 shadow-xl"
     >
      {/* Ambient glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"
       style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.06) 0%, transparent 70%)' }} />

      {/* Quote icon */}
      <span className="text-7xl text-[#007AFF]/5 absolute top-4 right-8 font-serif leading-none select-none pointer-events-none group-hover:text-[#007AFF]/10 transition-colors">
       ״
      </span>

      {/* Stars */}
      <Stars count={t.stars} />

      {/* Quote content */}
      <p className="text-lg text-gray-600 mb-10 leading-[1.8] relative z-10 font-medium italic">
       {t.quote}
      </p>

      {/* Author */}
      <div className="flex items-center gap-5 relative z-10">
       <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-4 ring-white shadow-lg">
        <img
         src={t.avatar}
         alt={t.name}
         className="w-full h-full object-cover"
         onError={(e) => {
          if (!e.target.dataset.triedFallback) {
           e.target.dataset.triedFallback = 'true';
           e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
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

   {/* ── Scrolling partner marquee ── */}
   <div className="max-w-[1400px] mx-auto px-6 text-center border-t border-gray-100 pt-20 pb-12 overflow-hidden">
    <motion.h3
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     viewport={{ once: true }}
     className="text-xs font-black text-gray-400 mb-12"
    >
     מוסדות מובילים שבחרו בחדשנות
    </motion.h3>
    <Marquee items={partners} />
   </div>

   </div>
  </PageTransition>
 );
};

export default SuccessStoriesPage;
