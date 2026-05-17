import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import confetti from 'canvas-confetti';

const SuccessPage = () => {
 const fired = useRef(false);

 useEffect(() => {
  if (fired.current) return;
  fired.current = true;

  // Staggered confetti bursts — Apple WWDC style
  const fire = (opts) => confetti({
   particleCount: opts.count ?? 60,
   angle: opts.angle ?? 90,
   spread: opts.spread ?? 70,
   origin: opts.origin ?? { x: 0.5, y: 0.55 },
   colors: ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF2D55', '#ffffff'],
   scalar: 0.9,
   ticks: 200,
   gravity: 1.1,
   drift: 0,
   startVelocity: opts.velocity ?? 35,
   disableForReducedMotion: true,
  });

  setTimeout(() => fire({ angle: 60,  origin: { x: 0.1, y: 0.6 }, count: 50, velocity: 42 }), 100);
  setTimeout(() => fire({ angle: 90,  origin: { x: 0.5, y: 0.5 }, count: 80, velocity: 38, spread: 90 }), 200);
  setTimeout(() => fire({ angle: 120, origin: { x: 0.9, y: 0.6 }, count: 50, velocity: 42 }), 300);
  setTimeout(() => fire({ angle: 90,  origin: { x: 0.5, y: 0.55 }, count: 40, velocity: 28, spread: 55 }), 700);
 }, []);

 return (
  <PageTransition>
   <div className="bg-[#F5F5F7] min-h-[calc(100vh-73px)] font-sans text-[#1D1D1F] antialiased flex items-center justify-center p-6" dir="rtl">
    <div className="max-w-xl w-full text-center">

     {/* Success checkmark */}
     <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
      className="relative mx-auto mb-8"
      style={{ width: 96, height: 96 }}
     >
      {/* Pulse ring */}
      <motion.div
       animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
       transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
       className="absolute inset-0 rounded-full"
       style={{ background: 'rgba(52,199,89,0.2)' }}
      />
      <div className="relative w-full h-full rounded-full flex items-center justify-center"
       style={{ background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)', boxShadow: '0 12px 40px rgba(52,199,89,0.40)' }}>
       <motion.svg
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
        className="w-12 h-12 text-white"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
       >
        <motion.path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
       </motion.svg>
      </div>
     </motion.div>

     {/* Headline */}
     <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-4xl md:text-5xl font-apple-display tracking-tighter text-[#1D1D1F] mb-3"
     >
      הפנייה התקבלה!
     </motion.h1>

     <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.42, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="text-lg text-[#6E6E73] font-medium mb-10 max-w-md mx-auto leading-relaxed"
     >
      הצוות שלנו כבר מעבד את הבקשה. נחזור אליך עם הצעה מותאמת תוך פחות מ-24 שעות.
     </motion.p>

     {/* Details card */}
     <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.55, type: 'spring', stiffness: 260, damping: 28 }}
      className="rounded-[2rem] p-8 mb-8 text-right"
      style={{
       background: 'rgba(255,255,255,0.85)',
       backdropFilter: 'blur(32px) saturate(1.8)',
       WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
       border: '1px solid rgba(255,255,255,0.75)',
       boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
      }}
     >
      {[
       { label: 'מה הלאה?', value: 'נציג יצור אתך קשר ישירות' },
       { label: 'זמן מענה', value: 'עד 24 שעות' },
       { label: 'דרך', value: 'טלפון או אימייל' },
      ].map(({ label, value }, i) => (
       <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 + i * 0.08, duration: 0.4 }}
        className={`flex items-center justify-between py-3.5 ${i < 2 ? 'border-b border-black/[0.06]' : ''}`}
       >
        <p className="text-[#86868B] text-sm font-bold">{label}</p>
        <p className="text-[#1D1D1F] font-black text-sm">{value}</p>
       </motion.div>
      ))}
     </motion.div>

     {/* Actions */}
     <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3"
     >
      <Link to="/catalog">
       <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-[15px] text-white"
        style={{
         background: '#007AFF',
         boxShadow: '0 8px 24px rgba(0,122,255,0.30)',
        }}
       >
        המשך לקטלוג
       </motion.button>
      </Link>
      <Link to="/">
       <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="w-full sm:w-auto px-10 py-4 rounded-full font-bold text-[15px] text-[#007AFF]"
        style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)' }}
       >
        לדף הבית
       </motion.button>
      </Link>
     </motion.div>
    </div>
   </div>
  </PageTransition>
 );
};

export default SuccessPage;
