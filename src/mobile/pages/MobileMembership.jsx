import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { User, Percent, Crown, Zap, Headphones, Star, FileText, ChevronDown } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../../context/AuthContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ── Blur-fade entrance helper ─────────────────────────────────────────────────
function BlurFade({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Tier badge pill ───────────────────────────────────────────────────────────
const TierBadge = ({ label, recommended }) => (
  <span
    style={{
      fontFamily: SF,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.06em',
      color: recommended ? '#fff' : '#98989D',
      background: recommended ? '#007AFF' : 'rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '3px 10px',
      display: 'inline-block',
      marginBottom: 8,
    }}
  >
    {label}
  </span>
);

// ── Tier card (vertical stack) ────────────────────────────────────────────────
const TierCard = ({ name, discount, price, support, earlyAccess, volumeDiscount, recommended, delay }) => (
  <BlurFade delay={delay}>
    <div
      style={{
        background: recommended
          ? 'linear-gradient(145deg, rgba(0,122,255,0.22), rgba(0,122,255,0.1))'
          : 'rgba(255,255,255,0.06)',
        border: recommended ? '1.5px solid rgba(0,122,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '20px 18px',
        marginBottom: 12,
        direction: 'rtl',
        position: 'relative',
      }}
    >
      {recommended && (
        <span
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            fontFamily: SF,
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            background: '#007AFF',
            borderRadius: 20,
            padding: '2px 10px',
          }}
        >
          מומלץ
        </span>
      )}
      <TierBadge label={name} recommended={recommended} />
      <div style={{ fontFamily: SF, fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 2 }}>
        {discount}
      </div>
      <div style={{ fontFamily: SF, fontSize: 13, color: '#98989D', marginBottom: 14 }}>{price}</div>
      {[['תמיכה', support], ['גישה מוקדמת', earlyAccess], ['הנחת כמות', volumeDiscount]].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: SF, fontSize: 13, color: '#98989D' }}>{label}</span>
          <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: '#fff' }}>{val}</span>
        </div>
      ))}
    </div>
  </BlurFade>
);

// ── FAQ accordion item ────────────────────────────────────────────────────────
const FAQItem = ({ q, a, open, onToggle }) => (
  <div
    style={{
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 10,
    }}
  >
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { haptic('light'); onToggle(); }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        direction: 'rtl',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 600, color: '#fff', flex: 1, textAlign: 'right' }}>{q}</span>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
        <ChevronDown size={16} color="#98989D" />
      </motion.div>
    </motion.button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ padding: '4px 16px 16px', direction: 'rtl' }}>
            <p style={{ fontFamily: SF, fontSize: 13, color: '#98989D', lineHeight: 1.65, textAlign: 'right', margin: 0 }}>{a}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function MobileMembership() {
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1D1D1F 0%, #2C2C2E 100%)', direction: 'rtl' }}>

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #1D1D1F, #2C2C2E)',
          padding: '48px 20px 36px',
          borderRadius: '0 0 28px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,122,255,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <BlurFade delay={0}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: 20, padding: '5px 12px', marginBottom: 16 }}>
            <Star size={12} color="#60A5FA" />
            <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '0.05em' }}>מועדון חברים בלעדי</span>
          </div>
          <h1 style={{ fontFamily: SF, fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 10px' }}>
            מועדון NextClass
          </h1>
          <p style={{ fontFamily: SF, fontSize: 15, color: '#98989D', fontWeight: 500, margin: '0 0 28px', lineHeight: 1.6 }}>
            מחירים מיוחדים. גישה מוקדמת. תמיכה ייעודית.
          </p>
          {isMember ? (
            <span style={{ fontFamily: SF, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(52,199,89,0.15)', border: '1px solid rgba(52,199,89,0.4)', color: '#34C759', fontWeight: 700, fontSize: 15, padding: '10px 24px', borderRadius: 16 }}>
              כבר חבר ✓
            </span>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptic('medium'); openAuthModal(); }}
              style={{
                fontFamily: SF,
                background: '#007AFF',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                padding: '13px 36px',
                borderRadius: 18,
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 0 28px rgba(0,122,255,0.4)',
              }}
            >
              הצטרף חינם
            </motion.button>
          )}
        </BlurFade>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* ── 2. How it works (horizontal scroll) ──────────────────────── */}
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'right' }}>איך זה עובד?</p>
          </BlurFade>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <BlurFade key={s.title} delay={i * 0.08}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: 160,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 18,
                      padding: '18px 14px',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,122,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginRight: 'auto' }}>
                      <Icon size={18} color="#60A5FA" />
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{s.title}</p>
                    <p style={{ fontFamily: SF, fontSize: 12, color: '#98989D', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* ── 3. Tiers (vertical stack) ────────────────────────────────── */}
        <div style={{ marginTop: 28 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'right' }}>רמות חברות</p>
          </BlurFade>
          {tiers.map((t, i) => (
            <TierCard key={t.name} {...t} delay={i * 0.08} />
          ))}
        </div>

        {/* ── 4. Benefits 2x2 grid ─────────────────────────────────────── */}
        <div style={{ marginTop: 28 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'right' }}>יתרונות החברות</p>
          </BlurFade>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <BlurFade key={b.title} delay={i * 0.07}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16,
                      padding: '18px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,122,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#60A5FA" />
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{b.title}</p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* ── 5. FAQ ───────────────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 16px', textAlign: 'right' }}>שאלות נפוצות</p>
          </BlurFade>
          {faqs.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              open={openFAQ === i}
              onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
            />
          ))}
        </div>

        {/* ── 6. Bottom CTA ────────────────────────────────────────────── */}
        <div style={{ marginTop: 36, marginBottom: 48, textAlign: 'center' }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>מוכן להצטרף?</p>
            <p style={{ fontFamily: SF, fontSize: 14, color: '#98989D', margin: '0 0 20px' }}>הרשמה חינמית. הנחה מיידית. ללא התחייבות.</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptic('medium'); openAuthModal(); }}
              style={{
                fontFamily: SF,
                background: '#007AFF',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                padding: '14px 0',
                width: '100%',
                borderRadius: 18,
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 0 32px rgba(0,122,255,0.35)',
              }}
            >
              הצטרף עכשיו
            </motion.button>
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
