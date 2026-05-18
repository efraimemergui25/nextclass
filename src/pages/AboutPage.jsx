import React, { useRef, useState, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ChevronDown, Compass, Users, ArrowLeft, CheckCircle, Star, Calendar, MessageSquare, Phone } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';

// ── Value card ────────────────────────────────────────────────────────────────
const ValueCard = ({ title, desc, icon: Icon, gradient, delay }) => (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
 whileHover={{ y: -5, scale: 1.015 }}
 className="relative rounded-[2rem] p-7 text-right group overflow-hidden"
 style={{
 background: 'rgba(255,255,255,0.9)',
 backdropFilter: 'blur(48px) saturate(200%)',
 WebkitBackdropFilter: 'blur(48px) saturate(200%)',
 border: '1px solid rgba(255,255,255,0.8)',
 boxShadow: '0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
 }}
 >
 <div className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
 <div className="relative z-10">
 <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ml-auto shadow-sm"
 style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.14)' }}>
 <Icon size={22} className="text-[#007AFF]" />
 </div>
 <h3 className="text-[18px] font-black text-[#1D1D1F] mb-2.5 tracking-tight">{title}</h3>
 <p className="text-[14px] text-[#86868B] leading-relaxed font-medium">{desc}</p>
 </div>
 </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
const AboutPage = () => {
 const { getSetting } = useSettings();

 const c = useMemo(() => ({
 heroLabel: getSetting('about_hero_label', ''),
 heroTitle: getSetting('about_hero_title', 'הטכנולוגיה\nשחינוך ראוי לה.'),
 heroSub: getSetting('about_hero_sub', 'מקצועי. מהיר. אישי. ישיר.\nהסטנדרט הגבוה ביותר שחינוך יכול לקבל.'),
 heroImg: getSetting('about_hero_img', '') || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=85&w=2400',
 storyBody: getSetting('about_story_body', 'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם, ציוד שמגיע שבועות מאוחר, ושירות שנגמר ברגע שהחשבונית נחתמה. החלטתי לשנות את המשוואה. NextClass הוא לא פלטפורמה ולא קטלוג — הוא מודל עסקי אחר לגמרי: שירות ישיר, אנושי ומקצועי שמוריד את כל הביניים, ומביא לחינוך הישראלי את הרמה שהוא ראוי לה.'),
 founderTitle: getSetting('about_founder_title', 'מקצועיות\nללא פשרות.'),
 founderMsg: getSetting('about_founder_message', 'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו: ישירות, מהירות, ורמה שלא מתפשרת. כל שיחה, כל הצעת מחיר, כל אספקה — כולם עוברים דרכי. לא כי אין לי ברירה. כי זו ההבטחה שלי לכל לקוח.'),
 founderName: getSetting('about_founder_name', 'אפרים אמרגי'),
 founderRole: getSetting('about_founder_role', 'מייסד, NextClass'),
 ctaTitle: getSetting('about_cta_title', 'שאלו אותנו.\nנגיע עם תשובות.'),
 ctaDesc: getSetting('about_cta_desc', 'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.'),
 journeyHint: getSetting('about_journey_hint', 'גלה את הסיפור שלנו'),
 valuesTitle: getSetting('about_values_title', 'שלושה כללים'),
 valuesDesc: getSetting('about_values_desc', 'מה שאמרנו — עמדנו בו. תמיד.'),
 v1Title: getSetting('about_v1_title', 'מחיר שקוף'),
 v1Desc: getSetting('about_v1_desc', 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — נקודה. שקיפות מלאה מהשקל הראשון ועד האחרון.'),
 v2Title: getSetting('about_v2_title', 'שירות מהיר'),
 v2Desc: getSetting('about_v2_desc', 'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות. מהירות היא לא בונוס אצלנו. היא חלק בלתי נפרד מהרמה.'),
 v3Title: getSetting('about_v3_title', 'רמה מקצועית'),
 v3Desc: getSetting('about_v3_desc', 'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה ממה שהלקוח היה מבקש — כי זה הרף שאנחנו מסרבים לרדת ממנו.'),
 }), [getSetting]);

 const containerRef = useRef(null);
 const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
 const smoothProgress = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
 const heroScale = useTransform(smoothProgress, [0, 0.12], [1, 1.06]);
 const heroOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
 const heroY = useTransform(smoothProgress, [0, 0.15], [0, 40]);

 return (
 <PageTransition>
 <div ref={containerRef} className="bg-[#F5F5F7] w-full overflow-x-hidden" dir="rtl">

 {/* ── HERO ──────────────────────────────────────────────── */}
 <section className="relative h-screen min-h-[640px] max-h-[960px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
 <motion.div
 style={{ scale: heroScale, y: heroY }}
 className="absolute inset-0 z-0"
 >
 <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-[#F5F5F7] z-10" />
 <img src={c.heroImg} className="w-full h-full object-cover" alt="" loading="eager" />
 </motion.div>

 <motion.div style={{ opacity: heroOpacity }} className="relative z-20 max-w-4xl mx-auto">
 <motion.h1
 initial={{ opacity: 0, y: 32 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
 className="text-5xl sm:text-7xl md:text-8xl font-apple-display text-white leading-[0.95] mb-7"
 style={{ letterSpacing: '-0.04em' }}
 >
 {c.heroTitle.split('\n').map((line, i) => (
 <span key={i} className={`block ${i === 1 ? 'text-white/45' : ''}`}>{line}</span>
 ))}
 </motion.h1>

 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.4, duration: 0.7 }}
 className="mb-10"
 >
 {c.heroSub.split('\n').map((line, i) => (
 <p key={i} className="text-[17px] md:text-[19px] text-white/60 font-medium leading-snug">{line}</p>
 ))}
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6 }}
 className="flex flex-wrap justify-center gap-3"
 >
 <Link to="/catalog"
 className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1D1D1F] rounded-full font-black text-[14px] shadow-2xl hover:scale-105 transition-transform">
 לקטלוג המוצרים <ArrowLeft size={15} />
 </Link>
 <Link to="/contact"
 className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-white border border-white/20 hover:bg-white/10 transition-all"
 style={{ backdropFilter: 'blur(16px)' }}>
 דברו איתנו
 </Link>
 </motion.div>
 </motion.div>

 <motion.div
 animate={{ y: [0, 8, 0] }}
 transition={{ duration: 2.5, repeat: Infinity }}
 className="absolute bottom-8 flex flex-col items-center gap-1.5 text-white/40 z-20"
 >
 <span className="text-[9px] font-black">{c.journeyHint}</span>
 <ChevronDown size={16} />
 </motion.div>
 </section>


 {/* ── STORY ─────────────────────────────────────────────── */}
 <section className="bg-white overflow-hidden">
 <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">

 {/* Text column — full bleed left */}
 <motion.div
 initial={{ opacity: 0, x: 24 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
 className="flex flex-col justify-center text-right px-8 md:px-14 lg:px-16 py-14 lg:py-20 order-2 lg:order-1"
 >
 <h2 className="font-black text-[#1D1D1F] leading-[1.05] mb-6"
 style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.03em' }}>
 {getSetting('about_story_section_title', 'הסיפור שלנו.')}
 </h2>

 <p className="text-[16px] md:text-[17px] text-[#3C3C43] font-medium leading-[1.8] mb-8">
 {c.storyBody}
 </p>

 <div className="space-y-2.5 border-t border-black/[0.06] pt-6">
 {[
 getSetting('about_check_1', 'ייעוץ מקצועי ומהיר — ללא עלות'),
 getSetting('about_check_2', 'שירות אישי וישיר, ללא ביניים'),
 getSetting('about_check_3', 'פתרונות מהדרגה הראשונה לחינוך'),
 ].map((item, i) => (
 <div key={i} className="flex items-center gap-2.5 justify-start">
 <CheckCircle size={14} className="text-[#34C759] shrink-0" />
 <span className="text-[13px] font-medium text-[#3C3C43]">{item}</span>
 </div>
 ))}
 </div>
 </motion.div>

 {/* Image column — full bleed right */}
 <motion.div
 initial={{ opacity: 0, scale: 1.03 }}
 whileInView={{ opacity: 1, scale: 1 }}
 viewport={{ once: true }}
 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 className="relative order-1 lg:order-2 min-h-[300px] lg:min-h-0"
 >
 <img
 src="/assets/modern_classroom_israel_1777475880301.png"
 className="absolute inset-0 w-full h-full object-cover"
 alt="כיתה חכמה NextClass"
 loading="lazy"
 onError={e => { e.target.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=1200'; }}
 />
 {/* Gradient fade into text col */}
 <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/0 lg:bg-gradient-to-l from-white/0 via-white/0 to-white/0" />
 </motion.div>

 </div>
 </section>

 {/* ── HOW WE WORK ───────────────────────────────────────── */}
 <section className="py-12 md:py-16 bg-[#F5F5F7]">
 <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.55 }}
 className="text-right"
 >
 <span className="text-[11px] font-black text-[#007AFF] block mb-4">הגישה שלנו</span>
 <h2 className="font-black text-[#1D1D1F] leading-[1.0] mb-5"
 style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.03em' }}>
 קודם שואלים.
 <span className="block text-[#AEAEB2]">אחר כך מציעים.</span>
 </h2>
 <p className="text-[16px] text-[#6E6E73] font-medium leading-relaxed max-w-sm mr-auto">
 הרוב מוכרים. אנחנו מקשיבים. לפני כל המלצה מגיעה שיחה אמיתית שמבינה את הצורך, את ההקשר, ואת מה שכבר קיים. רק מתוך הבנה כזו אפשר להציע משהו שבאמת עובד.
 </p>
 </motion.div>

 {/* 2×2 bullet cards */}
 <div className="grid grid-cols-2 gap-3">
 {[
 { icon: MessageSquare, text: 'מקשיבים לצורך האמיתי — לפני שמציעים פתרון' },
 { icon: Compass, text: 'ממליצים על מה שמתאים, לא על מה שהכי יקר' },
 { icon: Calendar, text: 'מגיעים ביום שסוכם — תמיד, ללא עיכובים' },
 { icon: Phone, text: 'מענה ישיר ומהיר — בלי תורים, בלי המתנה' },
 ].map(({ icon: Icon, text }, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.08, duration: 0.45 }}
 className="bg-white rounded-2xl p-5 text-right"
 style={{ border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
 >
 <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 ml-auto"
 style={{ background: 'rgba(0,122,255,0.08)' }}>
 <Icon size={16} className="text-[#007AFF]" />
 </div>
 <p className="text-[13px] font-semibold text-[#3C3C43] leading-snug">{text}</p>
 </motion.div>
 ))}
 </div>

 </div>
 </div>
 </section>

 {/* ── FOUNDER ───────────────────────────────────────────── */}
 <section className="py-12 md:py-16 bg-white border-t border-black/[0.05]">
 <div className="max-w-2xl mx-auto px-6 text-right">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.55 }}
 >
 <h2 className="font-black text-[#1D1D1F] leading-snug mb-5"
 style={{ fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.03em' }}>
 {c.founderTitle.split('\n').map((line, i) => (
 <span key={i} className={`block ${i === 1 ? 'text-[#AEAEB2]' : ''}`}>{line}</span>
 ))}
 </h2>

 <p className="text-[16px] text-[#6E6E73] leading-[1.8] font-medium mb-7">
 {c.founderMsg}
 </p>

 <div className="border-t border-black/[0.06] pt-5 flex items-center justify-start gap-3">
 <div className="text-right">
 <p className="text-[15px] font-black text-[#1D1D1F]">{c.founderName}</p>
 <p className="text-[12px] text-[#86868B] font-medium mt-0.5">{c.founderRole}</p>
 </div>
 </div>
 </motion.div>
 </div>
 </section>

 {/* ── VALUES ────────────────────────────────────────────── */}
 <section className="py-12 md:py-16 bg-[#F5F5F7] relative">
 <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 className="text-right mb-10"
 >
 <span className="text-[11px] font-black text-[#007AFF] block mb-3">{c.valuesTitle}</span>
 <h2 className="font-black text-[#1D1D1F]"
 style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.03em' }}>
 {c.valuesDesc}
 </h2>
 </motion.div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <ValueCard title={c.v1Title} desc={c.v1Desc} icon={ShieldCheck} gradient="from-blue-500/6 to-transparent" delay={0} />
 <ValueCard title={c.v2Title} desc={c.v2Desc} icon={Compass} gradient="from-purple-500/6 to-transparent" delay={0.08} />
 <ValueCard title={c.v3Title} desc={c.v3Desc} icon={Users} gradient="from-indigo-500/6 to-transparent" delay={0.16} />
 </div>
 </div>
 </section>

 {/* ── SOCIAL PROOF ──────────────────────────────────────── */}
 <section className="py-12 bg-white border-t border-black/[0.04]">
 <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="text-center mb-10"
 >
 <p className="text-[11px] font-black text-[#AEAEB2]">סומכים עלינו</p>
 </motion.div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {[
 { quote: 'ביקשנו 12 מסכים לפני ינואר. הגיעו ב-27 בדצמבר, הותקנו ב-28, ויום אחרי כל הצוות כבר ידע להשתמש. אפס בירוקרטיה.', name: 'רינת לוי', role: 'רכזת טכנולוגיה, חט"ב, רמת גן', stars: 5 },
 { quote: 'עבדנו עם ספקים אחרים. ההבדל ב-NextClass הוא שיש עם מי לדבר כשיש בעיה — לא רק לפני המכירה.', name: 'דוד אוחיון', role: 'מנהל רכש, רשות מקומית דרום', stars: 5 },
 { quote: 'ציוד בסדר גמור, אבל מה שגרם לנו לחזור זה השירות. אפרים ענה לי ב-WhatsApp בערב. זה לא מובן מאליו בכלל.', name: 'נועה שפירא', role: 'מנהלת חינוכית, מכללת עמק', stars: 5 },
 ].map((t, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1, duration: 0.55 }}
 className="rounded-[1.75rem] p-6 text-right"
 style={{
 background: 'rgba(255,255,255,0.9)',
 border: '1px solid rgba(0,0,0,0.05)',
 boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
 }}
 >
 <div className="flex justify-end gap-0.5 mb-4">
 {Array.from({ length: t.stars }).map((_, s) => (
 <Star key={s} size={13} className="fill-[#FF9500] text-[#FF9500]" />
 ))}
 </div>
 <p className="text-[14px] text-[#3C3C43] leading-relaxed font-medium mb-5">"{t.quote}"</p>
 <div className="flex items-center justify-end gap-3">
 <div className="text-right">
 <p className="text-[13px] font-black text-[#1D1D1F]">{t.name}</p>
 <p className="text-[10px] text-[#AEAEB2] font-medium">{t.role}</p>
 </div>
 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-[12px] font-black shrink-0">
 {t.name[0]}
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>

 {/* ── CTA ───────────────────────────────────────────────── */}
 <section className="py-20 md:py-28 relative overflow-hidden"
 style={{ background: 'linear-gradient(160deg, #EBF4FF 0%, #F0EEFF 50%, #EBF4FF 100%)' }}>
 <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
 >
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#007AFF]/20 mb-8"
 style={{ background: 'rgba(0,122,255,0.08)' }}>
 <Sparkles size={11} className="text-[#007AFF]" />
 <span className="text-[11px] font-black text-[#007AFF]">בואו נדבר</span>
 </div>

 <h2 className="font-black text-[#1D1D1F] leading-[1.0] mb-5"
 style={{ fontSize: 'clamp(32px, 5vw, 64px)', letterSpacing: '-0.04em' }}>
 {c.ctaTitle.split('\n').map((t, i) => (
 <span key={i} className={`block ${i === 1 ? 'text-[#007AFF]' : ''}`}>{t}</span>
 ))}
 </h2>

 <p className="text-[16px] text-[#6B6B6B] font-medium mb-10 max-w-xl mx-auto leading-relaxed">
 {c.ctaDesc}
 </p>

 <div className="flex flex-wrap justify-center gap-3">
 <Link to="/contact"
 className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-white hover:scale-105 transition-transform"
 style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.30)' }}>
 שלחו הודעה
 <ArrowLeft size={15} />
 </Link>
 <Link to="/catalog"
 className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-[14px] text-[#007AFF] border border-[#007AFF]/20 hover:bg-[#007AFF]/08 transition-all">
 צפו בקטלוג
 </Link>
 </div>
 </motion.div>
 </div>
 </section>

 </div>
 </PageTransition>
 );
};

export default AboutPage;
