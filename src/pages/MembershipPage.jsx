import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Percent, Crown, Zap, Headphones, Star, FileText, ChevronDown } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useAuth, TIER_CONFIG } from '../context/AuthContext';

// ── Section entrance animation ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Step card ─────────────────────────────────────────────────────────────────
const StepCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    whileHover={{ y: -4, scale: 1.015 }}
    className="flex-1 rounded-3xl p-7 text-right"
    style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(20px)',
    }}
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 mr-auto"
      style={{ background: 'rgba(0,122,255,0.18)', border: '1px solid rgba(0,122,255,0.3)' }}
    >
      <Icon size={22} className="text-[#60A5FA]" />
    </div>
    <h3 className="text-[17px] font-bold text-white mb-2 tracking-tight">{title}</h3>
    <p className="text-[14px] text-[#98989D] leading-relaxed">{desc}</p>
  </motion.div>
);

// ── Tier card ─────────────────────────────────────────────────────────────────
const TierCard = ({ name, discount, price, support, earlyAccess, volumeDiscount, recommended, delay }) => (
  <motion.div
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    className={`flex-1 rounded-3xl p-7 text-right relative overflow-hidden ${recommended ? 'ring-2 ring-[#007AFF]' : ''}`}
    style={{
      background: recommended
        ? 'linear-gradient(145deg, rgba(0,122,255,0.2), rgba(0,122,255,0.08))'
        : 'rgba(255,255,255,0.05)',
      border: recommended ? '1px solid rgba(0,122,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
    }}
  >
    {recommended && (
      <div className="absolute top-4 left-4 bg-[#007AFF] text-white text-[11px] font-bold px-3 py-1 rounded-full">
        מומלץ
      </div>
    )}
    <p className="text-[13px] font-semibold text-[#98989D] mb-1 tracking-widest uppercase">{name}</p>
    <p className="text-[40px] font-black text-white leading-none mb-1">{discount}</p>
    <p className="text-[13px] text-[#98989D] mb-5">{price}</p>
    <div className="space-y-2.5">
      {[
        ['תמיכה', support],
        ['גישה מוקדמת', earlyAccess],
        ['הנחת כמות', volumeDiscount],
      ].map(([label, val]) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-[#98989D]">{label}</span>
          <span className="text-[13px] font-semibold text-white">{val}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// ── Benefit card ──────────────────────────────────────────────────────────────
const BenefitCard = ({ icon: Icon, title, delay }) => (
  <motion.div
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={fadeUp}
    whileHover={{ y: -3 }}
    className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center"
      style={{ background: 'rgba(0,122,255,0.15)' }}
    >
      <Icon size={20} className="text-[#60A5FA]" />
    </div>
    <p className="text-[14px] font-semibold text-white">{title}</p>
  </motion.div>
);

// ── FAQ item ──────────────────────────────────────────────────────────────────
const FAQItem = ({ q, a, open, onToggle }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{ border: '1px solid rgba(255,255,255,0.1)' }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-5 text-right"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
        <ChevronDown size={18} className="text-[#98989D]" />
      </motion.div>
      <span className="flex-1 text-[15px] font-semibold text-white">{q}</span>
    </button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="px-5 pb-5 pt-1 text-right">
            <p className="text-[14px] text-[#98989D] leading-relaxed">{a}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const MembershipPage = () => {
  const { openAuthModal, isMember } = useAuth();
  const [openFAQ, setOpenFAQ] = useState(null);

  const steps = [
    { icon: User, title: 'הרשם', desc: 'מלא שם, מוסד ותפקיד — 60 שניות' },
    { icon: Percent, title: 'קבל הנחה', desc: '5% הנחה מיידית על כל רכישה' },
    { icon: Crown, title: 'שדרג', desc: 'אמת מספר מוסד לקבלת 12% ועוד' },
  ];

  const tiers = [
    { name: 'פרטי', discount: '5%', price: 'הרשמה חינמית', support: 'בסיסית', earlyAccess: 'לא', volumeDiscount: 'לא', recommended: false },
    { name: 'מוסדי', discount: '12%', price: 'אימות מוסד', support: 'מועדפת', earlyAccess: 'כן', volumeDiscount: 'כן', recommended: true },
    { name: 'פרימיום', discount: '18%', price: 'מנוי שנתי', support: 'SLA 24 שעות', earlyAccess: 'ראשון', volumeDiscount: 'כן', recommended: false },
  ];

  const benefits = [
    { icon: Percent, title: 'הנחה אוטומטית' },
    { icon: Headphones, title: 'תמיכה ייעודית' },
    { icon: Zap, title: 'גישה מוקדמת' },
    { icon: FileText, title: 'הצעת מחיר מהירה' },
  ];

  const faqs = [
    { q: 'האם ההרשמה בחינם?', a: 'כן לחלוטין. חשבון פרטי עם 5% הנחה — ללא תשלום.' },
    { q: 'איך מקבלים הנחת מוסד?', a: 'פנה לנציג NextClass עם מספר המוסד לאימות ושדרוג אוטומטי.' },
    { q: 'האם ההנחה מצטברת עם מבצעים?', a: 'כן — הנחת חבר מועדון מצטברת עם מבצעי עונה.' },
    { q: 'מה כולל פרימיום?', a: '18% הנחה, SLA תמיכה 24 שעות, גישה מוקדמת לדגמים, מנהל חשבון ייעודי.' },
  ];

  return (
    <PageTransition>
      <div
        dir="rtl"
        className="min-h-screen text-white"
        style={{ background: 'linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)' }}
      >
        {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,122,255,0.18) 0%, transparent 70%)' }}
          />
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[rgba(0,122,255,0.12)] border border-[rgba(0,122,255,0.3)] rounded-full px-4 py-1.5 mb-6">
              <Star size={13} className="text-[#60A5FA]" />
              <span className="text-[12px] font-semibold text-[#60A5FA] tracking-wide">מועדון חברים בלעדי</span>
            </div>
            <h1 className="text-[52px] font-black tracking-tight text-white leading-[1.1] mb-4">
              מועדון NextClass
            </h1>
            <p className="text-[18px] text-[#98989D] font-medium mb-10 leading-relaxed">
              מחירים מיוחדים. גישה מוקדמת. תמיכה ייעודית.
            </p>
            {isMember ? (
              <span className="inline-flex items-center gap-2 bg-[rgba(52,199,89,0.15)] border border-[rgba(52,199,89,0.4)] text-[#34C759] font-bold px-8 py-3.5 rounded-2xl text-[16px]">
                כבר חבר ✓
              </span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={openAuthModal}
                className="bg-[#007AFF] text-white font-bold text-[16px] px-10 py-3.5 rounded-2xl shadow-lg"
                style={{ boxShadow: '0 0 32px rgba(0,122,255,0.35)' }}
              >
                הצטרף חינם
              </motion.button>
            )}
          </motion.div>
        </section>

        {/* ── 2. How it works ─────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-black text-white tracking-tight mb-2">איך זה עובד?</h2>
            <p className="text-[15px] text-[#98989D]">שלושה צעדים פשוטים להתחלה</p>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-4">
            {steps.map((s, i) => (
              <StepCard key={s.title} {...s} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* ── 3. Tier comparison ──────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-black text-white tracking-tight mb-2">השוואת רמות חברות</h2>
            <p className="text-[15px] text-[#98989D]">בחר את הרמה המתאימה לך</p>
          </motion.div>
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {tiers.map((t, i) => (
              <TierCard key={t.name} {...t} delay={i * 0.1} />
            ))}
          </div>
        </section>

        {/* ── 4. Benefits strip ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-[32px] font-black text-white tracking-tight mb-2">יתרונות החברות</h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <BenefitCard key={b.title} {...b} delay={i * 0.08} />
            ))}
          </div>
        </section>

        {/* ── 5. FAQ ──────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="text-[32px] font-black text-white tracking-tight mb-2">שאלות נפוצות</h2>
          </motion.div>
          <motion.div
            custom={0.1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="space-y-3"
          >
            {faqs.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                open={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </motion.div>
        </section>

        {/* ── 6. Final CTA ────────────────────────────────────────────────── */}
        <section className="py-24 text-center px-6">
          <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-[36px] font-black text-white tracking-tight mb-4">מוכן להצטרף?</h2>
            <p className="text-[16px] text-[#98989D] mb-8">הרשמה חינמית. הנחה מיידית. ללא התחייבות.</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAuthModal}
              className="bg-[#007AFF] text-white font-bold text-[17px] px-12 py-4 rounded-2xl"
              style={{ boxShadow: '0 0 40px rgba(0,122,255,0.4)' }}
            >
              הצטרף עכשיו
            </motion.button>
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
};

export default MembershipPage;
