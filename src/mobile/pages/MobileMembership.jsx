import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { User, Percent, Crown, Zap, Headphones, Star, FileText, ChevronDown, Check } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ── Blur-fade entrance helper ─────────────────────────────────────────────────
function BlurFade({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

// ── Tier card (vertical stack) ────────────────────────────────────────────────
function TierCard({ name, discount, price, support, earlyAccess, volumeDiscount, recommended, delay }) {
  const { colors: c } = useTheme();
  return (
  <BlurFade delay={delay}>
    <div
      style={{
        background: recommended
          ? 'linear-gradient(145deg, rgba(0,122,255,0.12), rgba(0,122,255,0.05))'
          : c.surface,
        border: recommended ? '1.5px solid rgba(0,122,255,0.40)' : `1px solid ${c.border}`,
        borderRadius: 20,
        padding: '20px 18px',
        marginBottom: 12,
        direction: 'rtl',
        position: 'relative',
        boxShadow: recommended ? '0 4px 24px rgba(0,122,255,0.14)' : c.cardShadow,
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
      <span style={{
        fontFamily: SF, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        color: recommended ? '#007AFF' : c.text3,
        background: recommended ? 'rgba(0,122,255,0.10)' : c.input,
        borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginBottom: 8,
      }}>
        {name}
      </span>
      <div style={{ fontFamily: SF, fontSize: 22, fontWeight: 900, color: c.text, lineHeight: 1.2, marginBottom: 2 }}>
        {discount}
      </div>
      <div style={{ fontFamily: SF, fontSize: 13, color: c.text3, marginBottom: 14 }}>{price}</div>
      {[['תמיכה', support], ['גישה מוקדמת', earlyAccess], ['הנחות כמות', volumeDiscount]].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: SF, fontSize: 13, color: c.text3 }}>{label}</span>
          <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: c.text }}>{val}</span>
        </div>
      ))}
    </div>
  </BlurFade>
  );
}

// ── FAQ accordion item ────────────────────────────────────────────────────────
function FAQItem({ q, a, open, onToggle }) {
  const { colors: c } = useTheme();
  return (
  <div
    style={{
      border: `1px solid ${c.border}`,
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
        background: c.surface,
        border: 'none',
        direction: 'rtl',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ fontFamily: SF, fontSize: 14, fontWeight: 600, color: c.text, flex: 1, textAlign: 'right' }}>{q}</span>
      <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
        <ChevronDown size={16} color={c.text3} />
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
          <div style={{ padding: '4px 16px 16px', direction: 'rtl', background: c.bg }}>
            <p style={{ fontFamily: SF, fontSize: 13, color: c.text3, lineHeight: 1.65, textAlign: 'right', margin: 0 }}>{a}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
  );
}

// ── Tier Unlock Journey ───────────────────────────────────────────────────────
const JOURNEY_CONFIG = {
  free:    { discount: 5,  label: 'פרטי',    step: 0 },
  member:  { discount: 12, label: 'מוסדי',   step: 1 },
  premium: { discount: 18, label: 'פרימיום', step: 2 },
};

function TierJourney() {
  const { memberTier, tierColor } = useAuth();
  const { colors: c } = useTheme();
  const cfg = JOURNEY_CONFIG[memberTier] ?? JOURNEY_CONFIG.free;
  const currentStep = cfg.step;

  const steps = [
    { label: 'פרטי',    tier: 'free' },
    { label: 'מוסדי',   tier: 'member' },
    { label: 'פרימיום', tier: 'premium' },
  ];

  const nextTierKey = memberTier === 'free' ? 'member' : memberTier === 'member' ? 'premium' : null;
  const nextTierCfg = nextTierKey ? JOURNEY_CONFIG[nextTierKey] : null;
  const diff = nextTierCfg ? nextTierCfg.discount - cfg.discount : 0;

  return (
    <BlurFade delay={0}>
      <div style={{
        margin: '24px 16px 0',
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: '20px 16px 18px',
        direction: 'rtl',
        boxShadow: c.cardShadow,
      }}>
        <p style={{ fontFamily: SF, fontSize: 16, fontWeight: 800, color: c.text, margin: '0 0 18px', textAlign: 'right' }}>
          מסע השדרוג שלך
        </p>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {steps.map((s, i) => {
            const done    = i < currentStep;
            const current = i === currentStep;
            const future  = i > currentStep;
            return (
              <React.Fragment key={s.tier}>
                {/* Connector line */}
                {i > 0 && (
                  <div style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: i <= currentStep ? tierColor : c.divider,
                    transition: 'background 0.4s',
                    margin: '0 4px',
                  }} />
                )}
                {/* Circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <motion.div
                    animate={current ? { scale: 1.06 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 38, height: 38, borderRadius: 99,
                      background: done ? tierColor : current ? tierColor : 'transparent',
                      border: future ? `2px solid ${c.divider}` : `2px solid ${tierColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? `0 0 14px ${tierColor}66` : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <Check size={14} color="#fff" strokeWidth={3} />
                    ) : (
                      <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 800,
                        color: future ? c.text4 : '#fff' }}>
                        {i + 1}
                      </span>
                    )}
                  </motion.div>
                  <span style={{ fontFamily: SF, fontSize: 11, fontWeight: current ? 800 : 500,
                    color: current ? tierColor : future ? c.text4 : c.text3,
                    whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Status text */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 900, color: c.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            אתה ב{cfg.label}
          </p>
          {nextTierCfg ? (
            <p style={{ fontFamily: SF, fontSize: 13, color: c.text3, margin: 0 }}>
              שדרג ל{nextTierCfg.label} לקבלת הנחות גדולות יותר
            </p>
          ) : (
            <p style={{ fontFamily: SF, fontSize: 13, color: tierColor, fontWeight: 700, margin: 0 }}>
              הגעת לרמה הגבוהה ביותר ✓
            </p>
          )}
        </div>
      </div>
    </BlurFade>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MobileMembership() {
  const { openAuthModal, isMember } = useAuth();
  const { colors: c } = useTheme();
  const [openFAQ, setOpenFAQ] = useState(null);

  const steps = [
    { icon: User, title: 'הרשם', desc: 'מלא שם, מוסד ותפקיד — 60 שניות' },
    { icon: Percent, title: 'קבל הנחה', desc: 'הנחה מיידית על כל רכישה' },
    { icon: Crown, title: 'שדרג', desc: 'אמת מספר מוסד לקבלת הנחות מוסדיות' },
  ];

  const tiers = [
    { name: 'פרטי', discount: 'הנחה מיידית', price: 'הרשמה חינמית', support: 'בסיסית', earlyAccess: 'לא', volumeDiscount: 'לא', recommended: false },
    { name: 'מוסדי', discount: 'הנחה מוסדית', price: 'אימות מוסד', support: 'מועדפת', earlyAccess: 'כן', volumeDiscount: 'כן', recommended: true },
    { name: 'פרימיום', discount: 'תנאים בלעדיים', price: 'מנוי שנתי', support: 'SLA 24 שעות', earlyAccess: 'ראשון', volumeDiscount: 'כן', recommended: false },
  ];

  const benefits = [
    { icon: Percent, title: 'הנחה אוטומטית' },
    { icon: Headphones, title: 'תמיכה ייעודית' },
    { icon: Zap, title: 'גישה מוקדמת' },
    { icon: FileText, title: 'הצעת מחיר מהירה' },
  ];

  const faqs = [
    { q: 'האם ההרשמה בחינם?', a: 'כן לחלוטין. חשבון פרטי עם הנחה מיידית — ללא תשלום.' },
    { q: 'איך מקבלים הנחת מוסד?', a: 'פנה לנציג NextClass עם מספר המוסד לאימות ושדרוג אוטומטי.' },
    { q: 'האם ההנחה מצטברת עם מבצעים?', a: 'כן — הנחת חבר מועדון מצטברת עם מבצעי עונה.' },
    { q: 'מה כולל פרימיום?', a: 'הנחה מקסימלית, SLA תמיכה 24 שעות, גישה מוקדמת לדגמים, מנהל חשבון ייעודי.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: c.bg, direction: 'rtl' }}>

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(145deg, #007AFF, #5856D6)',
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

      {/* ── Tier Unlock Journey ──────────────────────────────────────── */}
      <TierJourney />

      <div style={{ padding: '0 16px' }}>

        {/* ── 2. How it works (horizontal scroll) ──────────────────────── */}
        <div style={{ marginTop: 32, marginBottom: 8 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 16px', textAlign: 'right' }}>איך זה עובד?</p>
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
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 18,
                      padding: '18px 14px',
                      textAlign: 'right',
                      boxShadow: c.cardShadow,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginRight: 'auto' }}>
                      <Icon size={18} color="#007AFF" />
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 14, fontWeight: 700, color: c.text, margin: '0 0 4px' }}>{s.title}</p>
                    <p style={{ fontFamily: SF, fontSize: 12, color: c.text3, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* ── 3. Tiers (vertical stack) ────────────────────────────────── */}
        <div style={{ marginTop: 28 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 16px', textAlign: 'right' }}>רמות חברות</p>
          </BlurFade>
          {tiers.map((t, i) => (
            <TierCard key={t.name} {...t} delay={i * 0.08} />
          ))}
        </div>

        {/* ── 4. Benefits 2x2 grid ─────────────────────────────────────── */}
        <div style={{ marginTop: 28 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 16px', textAlign: 'right' }}>יתרונות החברות</p>
          </BlurFade>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <BlurFade key={b.title} delay={i * 0.07}>
                  <div
                    style={{
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 16,
                      padding: '18px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: c.cardShadow,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#007AFF" />
                    </div>
                    <p style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: c.text, margin: 0 }}>{b.title}</p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* ── 5. FAQ ───────────────────────────────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          <BlurFade delay={0}>
            <p style={{ fontFamily: SF, fontSize: 20, fontWeight: 800, color: c.text, margin: '0 0 16px', textAlign: 'right' }}>שאלות נפוצות</p>
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
            <p style={{ fontFamily: SF, fontSize: 22, fontWeight: 900, color: c.text, margin: '0 0 6px' }}>מוכן להצטרף?</p>
            <p style={{ fontFamily: SF, fontSize: 14, color: c.text3, margin: '0 0 20px' }}>הרשמה חינמית. הנחות מיוחדות. ללא התחייבות.</p>
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
