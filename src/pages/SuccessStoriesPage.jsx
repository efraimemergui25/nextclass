import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, animate as animateMotion } from 'framer-motion';
import {
 ShieldCheck, Zap, HeartHandshake, Award, Users, Clock,
} from 'lucide-react';
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

const SuccessStoriesPage = () => {
 // Honest, backable service commitments — no fabricated scale.
 const COMMITMENTS = [
  { value: 24, suffix: 'ש׳', label: 'זמן מענה מרבי לכל פנייה' },
  { value: 100, suffix: '%', label: 'עמידה בלוחות הזמנים שהובטחו' },
  { value: 14, suffix: ' יום', label: 'החלפה ללא שאלות' },
 ];

 const PILLARS = [
  { icon: ShieldCheck, title: 'מחיר שקוף', desc: 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — ללא הפתעות וללא עלויות נסתרות.' },
  { icon: HeartHandshake, title: 'שירות ישיר', desc: 'מענה אישי ומהיר בכל ערוץ — טלפון, וואטסאפ ומייל. בלי תורים ובלי טיקטים.' },
  { icon: Clock, title: 'עמידה בזמנים', desc: 'ביום שסוכם, תמיד. אספקה והתקנה בלוח הזמנים שהובטח — ללא עיכובים.' },
  { icon: Award, title: 'איכות ללא פשרות', desc: 'ציוד מהדרגה הראשונה, נבחר בקפידה לכל מרחב למידה בכיתה.' },
  { icon: Users, title: 'ליווי מלא', desc: 'מאפיון הצרכים ועד ההתקנה האחרונה בכיתה והדרכת הצוות — שותפות בכל שלב.' },
  { icon: Zap, title: 'מחירי יבואן', desc: 'רכש ישיר ללא מתווכים — הערך המלא מגיע ישירות אליכם.' },
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
     הגישה שלנו
    </motion.span>
    <h1 className="text-5xl md:text-6xl font-apple-display text-[#1D1D1F] mb-4 tracking-tighter leading-[1.05]">
     השירות עושה את ההבדל.<br />
     <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>לא רק הציוד.</span>
    </h1>
    <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
     מודל שירות ישיר, שקוף ומהיר — שנבנה מהיסוד סביב הצרכים של מוסדות חינוך.
    </p>
   </motion.div>

   {/* ── Commitment counters ── */}
   <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="max-w-2xl mx-auto grid grid-cols-3 gap-4 px-6 mb-20"
   >
    {COMMITMENTS.map((s, i) => (
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

   {/* Commitment / value pillars grid */}
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
    {PILLARS.map((p, idx) => {
     const Icon = p.icon;
     return (
      <motion.div
       key={idx}
       variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 22 } },
       }}
       whileHover={{ y: -8, scale: 1.02 }}
       transition={{ type: 'spring', stiffness: 350, damping: 28 }}
       className="glass-apple p-10 rounded-[2.5rem] relative overflow-hidden group border border-white/60 shadow-xl text-right"
      >
       {/* Ambient glow on hover */}
       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,122,255,0.06) 0%, transparent 70%)' }} />

       <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ml-auto"
        style={{ background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.18)' }}>
        <Icon size={24} className="text-[#007AFF]" strokeWidth={1.8} />
       </div>

       <h3 className="font-black text-[#1D1D1F] text-xl tracking-tight leading-tight mb-3 relative z-10">{p.title}</h3>
       <p className="text-[15px] text-gray-600 leading-[1.8] relative z-10 font-medium">{p.desc}</p>
      </motion.div>
     );
    })}
   </motion.div>

   {/* ── Partner note ── */}
   <div className="max-w-[1400px] mx-auto px-6 text-center border-t border-gray-100 pt-20 pb-12">
    <motion.h3
     initial={{ opacity: 0 }}
     whileInView={{ opacity: 1 }}
     viewport={{ once: true }}
     className="text-xs font-black text-gray-400 mb-8"
    >
     בין השותפים שלנו
    </motion.h3>
    <motion.div
     initial={{ opacity: 0, y: 12 }}
     whileInView={{ opacity: 1, y: 0 }}
     viewport={{ once: true }}
     className="text-2xl md:text-3xl font-black tracking-tighter text-[#1D1D1F]"
    >
     עמל
    </motion.div>
   </div>

   </div>
  </PageTransition>
 );
};

export default SuccessStoriesPage;
