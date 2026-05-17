import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Removed DEFAULTS and readContent helper

const HeroSection = () => {
 const navigate = useNavigate();
 const { getSetting } = useSettings();
 
 const content = useMemo(() => ({
 hero_eyebrow: getSetting('hero_eyebrow', 'הדור הבא של טכנולוגיה לחינוך'),
 hero_headline: getSetting('hero_headline', 'חדשנות חסרת פשרות.'),
 hero_subline: getSetting('hero_subline', 'מקצוענות בכל מרחב למידה.'),
 hero_description: getSetting('hero_description', 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.'),
 hero_cta: getSetting('hero_cta', 'גלו את הפתרונות שלנו'),
 hero_bg_image: getSetting('hero_bg_image', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'),
 trust_1: getSetting('hero_trust_pill_1', 'שירות ישיר ומהיר'),
 trust_2: getSetting('hero_trust_pill_2', 'ייעוץ ללא עלות'),
 trust_3: getSetting('hero_trust_pill_3', '+500 מוסדות חינוך'),
 }), [getSetting]);

 const sectionRef = useRef(null);
 const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
 const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
 const bgBlur = useTransform(scrollYProgress, [0, 0.7], ['blur(0px)', 'blur(18px)']);

 const handleScrollDown = () => {
 window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
 };

 // Split by spaces for stagger animation
 const titleWords = content.hero_headline.split(' ');
 const subWords = content.hero_subline.split(' ');

 return (
 <section ref={sectionRef} className="h-screen w-full relative flex items-center justify-center text-center overflow-hidden font-sans antialiased pb-20">

 {/* Background — parallax while scrolling + scale-in on mount */}
 <motion.div
 className="absolute inset-0 bg-cover bg-center bg-no-repeat"
 initial={{ scale: 1.08 }}
 animate={{ scale: 1.0 }}
 style={{ backgroundImage: `url('${content.hero_bg_image}')`, y: bgY, scale: 1.15, filter: bgBlur }}
 transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
 />

 {/* Multi-layer gradient overlay — deep cinema feel */}
 <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
 {/* Vignette edges */}
 <div className="absolute inset-0"
 style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

 {/* Ambient blue glow from below — visionOS inspired */}
 <div className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none"
 style={{
 background: 'linear-gradient(to top, rgba(0,122,255,0.08) 0%, transparent 100%)',
 filter: 'blur(40px)',
 }} />

 {/* Content Container */}
 <div className="relative z-10 max-w-7xl mx-auto px-6">

 {/* Eyebrow label */}
 <motion.span
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
 className="inline-block text-[11px] font-bold text-white/60 mb-6"
 >
 {content.hero_eyebrow}
 </motion.span>

 {/* Staggered headline */}
 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-2">
 {titleWords.map((word, i) => (
 <motion.span
 key={word}
 className="text-hero text-white drop-shadow-2xl"
 initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
 transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
 >
 {word}
 </motion.span>
 ))}
 </div>

 {/* Second headline line */}
 <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-8">
 {subWords.map((word, i) => (
 <motion.span
 key={word}
 className="text-hero text-white/80 font-bold drop-shadow-2xl"
 initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
 transition={{ duration: 0.8, delay: 0.45 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
 >
 {word}
 </motion.span>
 ))}
 </div>

 {/* Subtitle */}
 <motion.p
 className="text-hero-sub text-gray-300 mx-auto"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.85, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 >
 {content.hero_description}
 </motion.p>

 {/* Trust micro-pills */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 1.0, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6"
 >
 {[content.trust_1, content.trust_2, content.trust_3].map((t, i) => (
 <motion.span
  key={i}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 1.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
  className="flex items-center gap-1.5 text-[11px] font-bold text-white/50"
 >
  <motion.span
   className="text-[#007AFF]"
   animate={{ scale: [1, 1.3, 1] }}
   transition={{ delay: 1.5 + i * 0.2, duration: 0.35, type: 'spring', stiffness: 500 }}
  >✓</motion.span>
  {t}
 </motion.span>
 ))}
 </motion.div>

 {/* CTA Row — Single button */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 1.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 className="mt-8 sm:mt-10 flex justify-center px-6 sm:px-0"
 >
 <motion.button
 onClick={() => navigate('/discover')}
 whileHover={{ scale: 1.05, y: -2 }}
 whileTap={{ scale: 0.95 }}
 transition={{ type: 'spring', stiffness: 380, damping: 26 }}
 className="relative overflow-hidden font-bold rounded-full px-8 sm:px-12 py-4 text-base sm:text-lg text-white hover:text-[#1D1D1F] hover:bg-white transition-all duration-500 w-full sm:w-auto"
 style={{
 background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
 backdropFilter: 'blur(24px) saturate(1.5)',
 WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
 border: '1px solid rgba(255,255,255,0.30)',
 boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 32px rgba(0,0,0,0.22), 0 0 60px rgba(255,255,255,0.06)',
 }}
 >
 <span className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
 {/* Shimmer sweep on hover */}
 <motion.span
  className="absolute inset-0 pointer-events-none rounded-full"
  initial={{ x: '-100%', opacity: 0 }}
  animate={{ x: ['−100%', '200%'], opacity: [0, 0.15, 0] }}
  transition={{ delay: 1.8, duration: 1.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
 />
 {content.hero_cta}
 </motion.button>
 </motion.div>
 </div>

 {/* Scroll Down Indicator */}
 <motion.button
 className="absolute bottom-10 left-1/2 text-white/50 hover:text-white transition-colors duration-300 focus:outline-none"
 style={{ translateX: '-50%' }}
 onClick={handleScrollDown}
 animate={{ y: [0, 8, 0] }}
 transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
 aria-label="גלול מטה"
 >
 <div className="relative flex flex-col items-center gap-2">
 <div className="w-6 h-9 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
 <motion.div
 className="w-1.5 h-1.5 rounded-full bg-current"
 animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
 transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
 />
 </div>
 <span className="text-[10px] font-bold opacity-60">גלול</span>
 </div>
 </motion.button>
 </section>
 );
};

export default HeroSection;
