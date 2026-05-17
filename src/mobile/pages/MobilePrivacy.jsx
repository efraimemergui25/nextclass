import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield } from 'lucide-react';
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

function Accordion({ title, accent = '#007AFF', defaultOpen = false, c, children }) {
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

export default function MobilePrivacy() {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const { colors: c } = useTheme();
    const email       = getSetting('contact_email', 'nextclass.en@gmail.com');
    const phone       = getSetting('contact_phone', '058-5856356');
    const dpoName     = getSetting('legal_dpo_name', 'אפרים אמרגי');
    const lastUpdated = getSetting('legal_privacy_updated', '14 במאי 2026');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div style={{
                borderRadius: 22, padding: '24px 20px', marginBottom: 20,
                background: 'linear-gradient(145deg, #004ECC 0%, #5856D6 100%)',
                boxShadow: '0 6px 30px rgba(0,78,204,0.22)',
            }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, padding: '4px 12px', marginBottom: 12 }}>
                    <Shield size={12} color="#fff" strokeWidth={2.5} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>מדיניות פרטיות</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 8 }}>
                    הפרטיות שלך חשובה לנו
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 6 }}>
                    בהתאם לחוק הגנת הפרטיות הישראלי
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>עודכן: {lastUpdated}</p>
            </div>

            {/* ── Sections ─────────────────────────────────────────── */}
            <Accordion title="מי אנחנו" accent="#007AFF" defaultOpen c={c}>
                <RichText c={c} text={`NextClass היא חברה ישראלית המתמחה באספקת ציוד טכנולוגי לבתי ספר ומוסדות חינוך.\n\nאחראי הגנת המידע: ${dpoName}\nדוא"ל: ${email}\nטלפון: ${phone}`} />
            </Accordion>

            <Accordion title="מה אנו אוספים" accent="#007AFF" c={c}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        ['שם מלא', 'זיהוי ויצירת קשר'],
                        ['מספר טלפון', 'תיאום ושירות לקוחות'],
                        ['כתובת דוא"ל', 'שליחת אישורים ועדכונים'],
                        ['שם המוסד', 'התאמת הצעת מחיר'],
                        ['פריטים שנבחרו', 'עיבוד הצעת מחיר'],
                        ['כתובת IP', 'אבטחה ומניעת הונאה'],
                        ['עוגיות אנליטיקס', 'שיפור חוויית המשתמש'],
                    ].map(([type, purpose]) => (
                        <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: c.subtleBg2, borderRadius: 10 }}>
                            <span style={{ fontSize: 13, color: c.text3 }}>{purpose}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{type}</span>
                        </div>
                    ))}
                </div>
            </Accordion>

            <Accordion title="כמה זמן שומרים מידע" accent="#007AFF" c={c}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        { cat: 'פניות ויצירת קשר', period: '3 שנים', color: '#007AFF' },
                        { cat: 'הצעות מחיר', period: '5 שנים', color: '#5856D6' },
                        { cat: 'לוגים ואבטחה', period: '12 חודשים', color: '#34C759' },
                        { cat: 'עוגיות אנליטיקס', period: '13 חודשים', color: '#FF9500' },
                        { cat: 'רשימת תפוצה', period: 'עד ביטול הסכמה', color: '#FF3B30' },
                    ].map(({ cat, period, color }) => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: c.subtleBg2, borderRadius: 10, borderRight: `3px solid ${color}` }}>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.text }}>{cat}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 99 }}>{period}</span>
                        </div>
                    ))}
                </div>
            </Accordion>

            <Accordion title="עם מי חולקים מידע" accent="#007AFF" c={c}>
                <RichText c={c} text={`אנו לא מוכרים מידע אישי לצדדים שלישיים. המידע עשוי להיות משותף עם:\n\n• **Google Firebase** — אחסון נתונים מוצפן, ממוקם ב-EU\n• **Google Analytics** — אנליטיקס (רק בהסכמה)\n• **Vercel** — אחסון האתר, ממוקם בארה"ב\n\nכל השותפים מחויבים לעמוד בתקני הגנת מידע בינלאומיים.`} />
            </Accordion>

            <Accordion title="הזכויות שלך" accent="#007AFF" c={c}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                        { title: 'זכות עיון', desc: 'קבל עותק של המידע' },
                        { title: 'זכות תיקון', desc: 'תקן מידע שגוי' },
                        { title: 'זכות מחיקה', desc: 'מחיקת המידע' },
                        { title: 'התנגדות', desc: 'התנגד לשיווק' },
                        { title: 'ניידות מידע', desc: 'קבל בפורמט קריא' },
                        { title: 'הגבלת עיבוד', desc: 'הגבל שימוש במידע' },
                    ].map(({ title, desc }) => (
                        <div key={title} style={{ padding: '12px', background: c.subtleBg2, borderRadius: 10 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3 }}>{title}</p>
                            <p style={{ fontSize: 11, color: c.text3, lineHeight: 1.4 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </Accordion>

            <Accordion title="כיצד מאובטח המידע" accent="#007AFF" c={c}>
                <RichText c={c} text={`• הצפנת תעבורה מלאה (TLS 1.3 / HTTPS)\n• הצפנת מידע במנוחה (Firebase Encryption at Rest)\n• בקרת גישה מבוססת הרשאות\n• הגבלת קצב גישה ל-API\n• ניטור אבטחה רציף ותיעוד אירועים`} />
            </Accordion>

            <Accordion title="מדיניות עוגיות" accent="#007AFF" c={c}>
                <RichText c={c} text={`**עוגיות הכרחיות** — ללא צורך בהסכמה:\n• שמירת הסל ומצב הניווט\n• אבטחת המפגש\n\n**עוגיות אנליטיקס** — בהסכמה בלבד:\n• Google Analytics — ניתוח תנועה אנונימי\n• ניתן לבטל בכל עת דרך הגדרות הדפדפן`} />
            </Accordion>

            <Accordion title="פנייה בנושא פרטיות" accent="#007AFF" c={c}>
                <RichText c={c} text={`לכל פנייה בנושא מידע אישי:\n\nדוא"ל: ${email}\nטלפון: ${phone}\nזמן מענה: עד 30 יום עסקים`} />
            </Accordion>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                borderRadius: 20, padding: '22px 20px', marginTop: 8, textAlign: 'center',
                boxShadow: '0 6px 24px rgba(0,122,255,0.28)',
            }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>יש לך שאלות?</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 16, lineHeight: 1.5 }}>נשמח לענות על כל שאלה בנושא פרטיות.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href={`mailto:${email}`} style={{
                        background: '#fff', color: '#007AFF', fontWeight: 700, fontSize: 14,
                        padding: '10px 22px', borderRadius: 99, textDecoration: 'none',
                        display: 'inline-block',
                    }}>
                        שלח דוא"ל
                    </a>
                    <button onClick={() => navigate('/terms')} style={{
                        background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: 14,
                        padding: '10px 22px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                    }}>
                        תנאי שימוש
                    </button>
                </div>
            </div>
        </div>
    );
}
