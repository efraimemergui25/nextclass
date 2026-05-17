import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function RichText({ text, c }) {
    return (
        <p style={{ fontSize: 14, lineHeight: 1.75, color: c.text2, margin: 0 }}
            dangerouslySetInnerHTML={{
                __html: text
                    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${c.text};font-weight:700">$1</strong>`)
                    .replace(/\n/g, '<br/>')
            }}
        />
    );
}

function Accordion({ title, accent = '#5856D6', defaultOpen = false, c, children }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ background: c.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 10, boxShadow: c.cardShadow }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '15px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{title}</span>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} color={c.text4} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 16px 18px', borderTop: `0.5px solid ${c.divider}` }}>
                            <div style={{ paddingTop: 14 }}>{children}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MobileTerms() {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const { colors: c } = useTheme();
    const email       = getSetting('contact_email', 'nextclass.en@gmail.com');
    const phone       = getSetting('contact_phone', '058-5856356');
    const lastUpdated = getSetting('legal_terms_updated', '14 במאי 2026');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100vh' }}>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div style={{
                borderRadius: 22, padding: '24px 20px', marginBottom: 20,
                background: 'linear-gradient(145deg, #3634A3 0%, #007AFF 100%)',
                boxShadow: '0 6px 30px rgba(88,86,214,0.25)',
            }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 12px', marginBottom: 12 }}>
                    <FileText size={12} color="#fff" strokeWidth={2.5} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>תנאי שימוש</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 8 }}>
                    תנאי השימוש שלנו
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 6 }}>
                    כללי השימוש בשירותי NextClass
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>עודכן: {lastUpdated}</p>
            </div>

            {/* ── Sections ─────────────────────────────────────────── */}
            <Accordion title="כללי" accent="#5856D6" defaultOpen c={c}>
                <RichText c={c} text={`ברוכים הבאים ל-NextClass. השימוש באתר getnextclass.com ובשירותים הניתנים על ידינו כפוף לתנאי השימוש המפורטים להלן.\n\nהגלישה באתר ומילוי טפסים מהווים הסכמה מלאה לתנאים אלו.`} />
            </Accordion>

            <Accordion title="השירות ותהליך הרכישה" accent="#5856D6" c={c}>
                <RichText c={c} text={`האתר מאפשר לגורמי חינוך להגיש בקשות להצעות מחיר עבור ציוד טכנולוגי.\n\n**חשוב לדעת:**\n• הגשת הצעת מחיר אינה יוצרת חוזה מחייב\n• המחירים המוצגים הם אינדיקטיביים ועשויים להשתנות\n• הצעת מחיר סופית תישלח בנפרד לאחר בדיקת הזמינות\n\n**זכאות לשירות:**\nהשירות מיועד לגופים מוסדיים בלבד (בתי ספר, מוסדות חינוך, עמותות).`} />
            </Accordion>

            <Accordion title="קניין רוחני" accent="#5856D6" c={c}>
                <RichText c={c} text={`כל התוכן באתר — כולל טקסטים, תמונות, לוגו, עיצוב וקוד — הם רכושה הבלעדי של NextClass ומוגנים על פי דיני זכויות יוצרים.\n\n**מותר:** צפייה ושימוש אישי לצורך רכישה, שיתוף קישורים.\n\n**אסור:** העתקה, שכפול, הפצה, שימוש מסחרי ללא אישור בכתב.`} />
            </Accordion>

            <Accordion title="הגבלת אחריות" accent="#5856D6" c={c}>
                <RichText c={c} text={`האתר ניתן "כמות שהוא". NextClass אינה מתחייבת לזמינות רציפה ורשאית לשנות כל חלק ממנו ללא הודעה מוקדמת.\n\nאחריות NextClass מוגבלת לסכום ששולם בפועל עבור השירות. NextClass לא תישא באחריות לנזקים עקיפים או תוצאתיים.`} />
            </Accordion>

            <Accordion title="כללי התנהגות" accent="#5856D6" c={c}>
                <RichText c={c} text={`**שימוש מותר:**\nהגשת בקשות לגיטימיות להצעות מחיר לצורכי חינוך.\n\n**שימוש אסור:**\n• הגשת בקשות מזויפות או מידע כוזב\n• ניסיון לגשת לאזורים מוגבלים\n• שליחת בקשות אוטומטיות (bots)\n• כל פעולה שעלולה לפגוע בתשתית האתר`} />
            </Accordion>

            <Accordion title="פרטיות ומידע אישי" accent="#5856D6" c={c}>
                <RichText c={c} text={`איסוף ועיבוד מידע אישי כפופים למדיניות הפרטיות שלנו, המהווה חלק בלתי נפרד מתנאי שימוש אלה.`} />
                <button onClick={() => navigate('/privacy')} style={{
                    display: 'block', marginTop: 12, color: '#5856D6', fontWeight: 700, fontSize: 14,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    fontFamily: SF, WebkitTapHighlightColor: 'transparent', direction: 'rtl',
                }}>
                    קרא את מדיניות הפרטיות ←
                </button>
            </Accordion>

            <Accordion title="דין חל וסמכות שיפוט" accent="#5856D6" c={c}>
                <RichText c={c} text={`תנאים אלה כפופים לדיני מדינת ישראל. כל מחלוקת תובא לדיון בבתי המשפט המוסמכים בתל אביב-יפו כסמכות שיפוט ייחודית.\n\nלפני פנייה לערכאות, הצדדים מחויבים לנסות להסכים בדרכי שלום תוך 30 יום.`} />
            </Accordion>

            <Accordion title="יצירת קשר" accent="#5856D6" c={c}>
                <RichText c={c} text={`לשאלות, הבהרות או פניות משפטיות:\n\nNextClass\nדוא"ל: ${email}\nטלפון: ${phone}\nזמן מענה: עד 5 ימי עסקים`} />
            </Accordion>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #5856D6, #007AFF)',
                borderRadius: 20, padding: '22px 20px', marginTop: 8, textAlign: 'center',
                boxShadow: '0 6px 24px rgba(88,86,214,0.28)',
            }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>שאלות על התנאים?</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 16, lineHeight: 1.5 }}>צוות NextClass זמין לכל הבהרה.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href={`mailto:${email}`} style={{
                        background: '#fff', color: '#5856D6', fontWeight: 700, fontSize: 14,
                        padding: '10px 22px', borderRadius: 99, textDecoration: 'none',
                        display: 'inline-block',
                    }}>
                        שלח דוא"ל
                    </a>
                    <button onClick={() => navigate('/privacy')} style={{
                        background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 14,
                        padding: '10px 22px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                    }}>
                        מדיניות פרטיות
                    </button>
                </div>
            </div>
        </div>
    );
}
