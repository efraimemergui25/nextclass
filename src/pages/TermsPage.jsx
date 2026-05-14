/* eslint-disable */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

function RichText({ text }) {
 return (
 <p style={{ fontSize: 15, lineHeight: 1.8, color: '#3C3C43', margin: 0 }}
 dangerouslySetInnerHTML={{
 __html: text
 .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#1D1D1F;font-weight:700">$1</strong>')
 .replace(/\n/g, '<br/>')
 }}
 />
 );
}

function Section({ s, open, onToggle, index }) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.055, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
 style={{ background: '#fff', borderRadius: 20, border: '1px solid #E5E5EA', overflow: 'hidden', marginBottom: 10 }}
 >
 <button
 onClick={onToggle}
 style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right' }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5856D6', display: 'inline-block', flexShrink: 0 }} />
 <span style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F' }}>{s.title}</span>
 </div>
 <motion.span
 animate={{ rotate: open ? 180 : 0 }}
 transition={{ duration: 0.22 }}
 style={{ fontSize: 10, color: '#AEAEB2', flexShrink: 0, marginRight: 4 }}
 >▼</motion.span>
 </button>

 <AnimatePresence initial={false}>
 {open && (
 <motion.div
 key="body"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
 style={{ overflow: 'hidden' }}
 >
 <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #F2F2F7' }}>
 <RichText text={s.content} />
 {s.link && (
 <Link to={s.link.to} style={{ display: 'inline-block', marginTop: 14, color: '#5856D6', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
 {s.link.label}
 </Link>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

export default function TermsPage() {
 const { getSetting } = useSettings();
 const email = getSetting('contact_email', 'nextclass.en@gmail.com');
 const phone = getSetting('contact_phone', '058-5856356');
 const lastUpdated = getSetting('legal_terms_updated', '14 במאי 2026');

 const sections = [
 {
 id: 'intro',
 icon: '📜',
 title: 'כללי',
 content: `ברוכים הבאים ל-NextClass. השימוש באתר getnextclass.com ("האתר") ובשירותים הניתנים על ידינו כפוף לתנאי השימוש המפורטים להלן.\n\nהגלישה באתר, מילוי טפסים ובקשת הצעות מחיר מהווים הסכמה מלאה לתנאים אלו. אם אינך מסכים — אנא הימנע משימוש באתר.\n\nNextClass שומרת לעצמה את הזכות לעדכן תנאים אלה בכל עת. שינויים מהותיים יפורסמו באתר.`,
 },
 {
 id: 'service',
 icon: '🛒',
 title: 'השירות ותהליך הרכישה',
 content: `האתר מאפשר לגורמי חינוך להגיש בקשות להצעות מחיר עבור ציוד טכנולוגי.\n\n**חשוב לדעת:**\n• הגשת הצעת מחיר אינה יוצרת חוזה מחייב\n• המחירים המוצגים הם אינדיקטיביים ועשויים להשתנות\n• הצעת מחיר סופית תישלח בנפרד לאחר בדיקת הזמינות\n• NextClass רשאית לדחות כל בקשה על פי שיקול דעתה\n\n**זכאות לשירות:**\nהשירות מיועד לגופים מוסדיים (בתי ספר, ספריות, מוסדות להשכלה גבוהה, עמותות חינוך) ואנשי מקצוע. NextClass רשאית לדרוש הוכחת זכאות.`,
 },
 {
 id: 'ip',
 icon: '©️',
 title: 'קניין רוחני',
 content: `כל התוכן באתר — כולל טקסטים, תמונות, לוגו, עיצוב, קוד תוכנה ותכני וידאו — הם רכושה הבלעדי של NextClass ומוגנים על פי דיני זכויות יוצרים.\n\n**מותר:**\n• צפייה ושימוש אישי לצורך רכישה\n• שיתוף קישורים לדפי מוצר\n\n**אסור:**\n• העתקה, שכפול או הפצה של תכנים ללא אישור בכתב\n• שימוש מסחרי בלוגו או בשם המותג\n• הנדסה לאחור של האתר או ה-API`,
 },
 {
 id: 'liability',
 icon: '⚖️',
 title: 'הגבלת אחריות',
 content: `**האתר ניתן "כמות שהוא":**\nNextClass אינה מתחייבת לזמינות רציפה ורשאית לשנות, להשעות או להפסיק כל חלק ממנו ללא הודעה מוקדמת.\n\n**הגבלת נזקים:**\nאחריות NextClass מוגבלת לסכום ששולם בפועל עבור השירות. NextClass לא תישא באחריות לנזקים עקיפים, תוצאתיים או עונשיים.\n\n**אחריות מוצרים:**\nאחריות על מוצרים פיזיים כפופה לתנאי היצרן ולחוק המכר הישראלי. NextClass מתפקדת כמתווכת ואינה יצרן.`,
 },
 {
 id: 'conduct',
 icon: '🤝',
 title: 'כללי התנהגות',
 content: `**שימוש מותר:**\nהגשת בקשות לגיטימיות להצעות מחיר לצורכי חינוך בלבד.\n\n**שימוש אסור:**\n• הגשת בקשות מזויפות או מידע כוזב\n• ניסיון לגשת לאזורים מוגבלים באתר\n• שליחת בקשות אוטומטיות (bots / scraping)\n• כל פעולה שעלולה לפגוע בתשתית האתר\n• שימוש לצרכים מסחריים ללא אישור\n\nהפרת כללים אלה עלולה לגרום לחסימה מהאתר ולנקיטת הליכים משפטיים.`,
 },
 {
 id: 'privacy_ref',
 icon: '🔒',
 title: 'פרטיות ומידע אישי',
 content: `איסוף ועיבוד מידע אישי כפופים למדיניות הפרטיות שלנו, המהווה חלק בלתי נפרד מתנאי שימוש אלה.\n\nאנא קרא את מדיניות הפרטיות לפני שימוש בשירותים הכוללים מסירת מידע אישי.`,
 link: { to: '/privacy', label: 'קרא את מדיניות הפרטיות ←' },
 },
 {
 id: 'governing',
 icon: '🏛',
 title: 'דין חל וסמכות שיפוט',
 content: `תנאים אלה כפופים לדיני מדינת ישראל. כל מחלוקת שתתעורר תובא לדיון בבתי המשפט המוסמכים בתל אביב-יפו, ישראל, כסמכות שיפוט ייחודית.\n\n**יישוב סכסוכים:**\nלפני פנייה לערכאות משפטיות, מחויבות הצדדים לנסות ולהגיע להסכמה בדרכי שלום תוך 30 יום מיום הגשת הפנייה בכתב.`,
 },
 {
 id: 'contact',
 icon: '📬',
 title: 'יצירת קשר',
 content: `לשאלות, הבהרות או פניות משפטיות:\n\nNextClass\nדוא"ל: ${email}\nטלפון: ${phone}\n\nזמן מענה: עד 5 ימי עסקים`,
 },
 ];

 const [open, setOpen] = useState({ intro: true });
 useEffect(() => { window.scrollTo(0, 0); }, []);
 const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

 return (
 <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F0F2FA 0%, #F5F0FF 100%)', paddingTop: 80 }}>
 <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 0' }}>

 {/* Hero */}
 <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#5856D612', border: '1px solid #5856D628', borderRadius: 50, padding: '5px 14px', marginBottom: 20 }}>
 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5856D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
 <span style={{ fontSize: 12, fontWeight: 700, color: '#5856D6', letterSpacing: 0.2 }}>תנאי שימוש</span>
 </div>
 <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, color: '#1D1D1F', margin: '0 0 10px', letterSpacing: -1.2, lineHeight: 1.1 }}>
 תנאי{' '}
 <span style={{ background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
 שימוש
 </span>
 </h1>
 <p style={{ fontSize: 16, color: '#6C6C70', lineHeight: 1.7, margin: '0 0 6px' }}>
 תנאים אלה מגדירים את כללי השימוש בשירותי NextClass ומגנים על שני הצדדים בעסקה.
 </p>
 <p style={{ fontSize: 12, color: '#AEAEB2', margin: '0 0 36px' }}>עודכן לאחרונה: {lastUpdated}</p>
 </motion.div>

 {/* Sections */}
 <div style={{ marginBottom: 48 }}>
 {sections.map((s, i) => (
 <Section key={s.id} s={s} open={!!open[s.id]} onToggle={() => toggle(s.id)} index={i} />
 ))}
 </div>

 {/* CTA */}
 <motion.div
 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
 style={{ background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)', borderRadius: 24, padding: '32px 28px', textAlign: 'center', marginBottom: 72 }}
 >
 <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>שאלות על התנאים?</div>
 <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', margin: '0 0 20px' }}>צוות NextClass זמין לכל הבהרה משפטית או שאלה על השירות.</p>
 <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
 <a href={`mailto:${email}`} style={{ display: 'inline-block', background: '#fff', color: '#5856D6', fontWeight: 700, fontSize: 15, padding: '11px 26px', borderRadius: 50, textDecoration: 'none' }}>
 שלח דוא"ל
 </a>
 <Link to="/privacy" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '11px 26px', borderRadius: 50, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.28)' }}>
 מדיניות פרטיות ←
 </Link>
 </div>
 </motion.div>
 </div>
 </div>
 );
}
