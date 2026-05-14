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
                    <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
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
                            {s.content && <RichText text={s.content} />}

                            {s.table && (
                                <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #E5E5EA', marginTop: s.content ? 16 : 0 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                        <thead>
                                            <tr style={{ background: '#F9F9FB' }}>
                                                {['סוג מידע', 'מטרה', 'בסיס חוקי'].map(h => (
                                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#8E8E93', letterSpacing: 0.3 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {s.table.map((row, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #F2F2F7', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1D1D1F', fontSize: 14 }}>{row.type}</td>
                                                    <td style={{ padding: '12px 16px', color: '#3C3C43', fontSize: 14 }}>{row.purpose}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ display: 'inline-block', background: '#F2F2F7', color: '#3C3C43', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 50 }}>{row.legal}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {s.retention && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: s.content ? 16 : 0 }}>
                                    {s.retention.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: '#F9F9FB', border: `1px solid ${r.color}20` }}>
                                            <div style={{ width: 4, height: 40, borderRadius: 4, background: r.color, flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>{r.category}</div>
                                                <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>{r.reason}</div>
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: r.color, background: `${r.color}18`, padding: '5px 14px', borderRadius: 50, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.period}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {s.rights && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: s.content ? 16 : 0 }}>
                                    {s.rights.map((r, i) => (
                                        <div key={i} style={{ padding: '16px', borderRadius: 14, background: '#F9F9FB', border: '1px solid #E5E5EA' }}>
                                            <div style={{ fontSize: 22, marginBottom: 8 }}>{r.icon}</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>{r.title}</div>
                                            <div style={{ fontSize: 13, color: '#8E8E93', lineHeight: 1.5 }}>{r.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function PrivacyPage() {
    const { getSetting } = useSettings();
    const email       = getSetting('contact_email', 'nextclass.en@gmail.com');
    const phone       = getSetting('contact_phone', '058-5856356');
    const dpoName     = getSetting('legal_dpo_name', 'אפרים אמרגי');
    const lastUpdated = getSetting('legal_privacy_updated', '14 במאי 2026');

    const sections = [
        {
            id: 'who',
            icon: '🏢',
            title: 'מי אנחנו',
            content: `NextClass היא חברה ישראלית המתמחה באספקת ציוד טכנולוגי לבתי ספר ומוסדות חינוך. כבעלת מאגר מידע, אנו פועלת בהתאם לחוק הגנת הפרטיות, תשמ"א-1981, ותקנות הגנת הפרטיות (אבטחת מידע), תשע"ז-2017.\n\nאחראי הגנת המידע: ${dpoName}\nדוא"ל: ${email}\nטלפון: ${phone}`,
        },
        {
            id: 'collect',
            icon: '📋',
            title: 'מה אנו אוספים',
            table: [
                { type: 'שם מלא',          purpose: 'זיהוי ויצירת קשר',        legal: 'הסכמה' },
                { type: 'מספר טלפון',       purpose: 'תיאום ושירות לקוחות',     legal: 'הסכמה' },
                { type: 'כתובת דוא"ל',     purpose: 'שליחת אישורים ועדכונים',  legal: 'הסכמה' },
                { type: 'שם המוסד',        purpose: 'התאמת הצעת מחיר',          legal: 'אינטרס לגיטימי' },
                { type: 'תפקיד',           purpose: 'התאמת שירות',              legal: 'אינטרס לגיטימי' },
                { type: 'פריטים שנבחרו',   purpose: 'עיבוד הצעת מחיר',          legal: 'ביצוע חוזה' },
                { type: 'כתובת IP',        purpose: 'אבטחה ומניעת הונאה',       legal: 'אינטרס לגיטימי' },
                { type: 'עוגיות אנליטיקס', purpose: 'שיפור חוויית המשתמש',      legal: 'הסכמה' },
            ],
        },
        {
            id: 'retention',
            icon: '🗓',
            title: 'כמה זמן שומרים מידע',
            retention: [
                { category: 'פניות ויצירת קשר', period: '3 שנים',             reason: 'מענה ומעקב שירות',              color: '#007AFF' },
                { category: 'הצעות מחיר',       period: '5 שנים',             reason: 'חובה חשבונאית וחוקית',         color: '#5856D6' },
                { category: 'לוגים ואבטחה',     period: '12 חודשים',          reason: 'בטיחות וחקירת אירועים',        color: '#34C759' },
                { category: 'עוגיות אנליטיקס',  period: '13 חודשים',          reason: 'ניתוח תנועה',                  color: '#FF9500' },
                { category: 'רשימת תפוצה',      period: 'עד ביטול הסכמה',    reason: 'שיווק ועדכונים',               color: '#FF3B30' },
            ],
        },
        {
            id: 'share',
            icon: '🤝',
            title: 'עם מי חולקים מידע',
            content: `אנו לא מוכרים מידע אישי לצדדים שלישיים. המידע עשוי להיות משותף עם:\n\n• **HubSpot** — ניהול לקוחות (CRM), ממוקם בארה"ב, בתאימות ל-GDPR\n• **Resend** — שליחת מיילים עסקיים, ממוקם בארה"ב\n• **Google Firebase** — אחסון נתונים מוצפן, ממוקם ב-EU\n• **Google Analytics** — אנליטיקס (רק בהסכמה)\n• **Vercel** — אחסון האתר, ממוקם בארה"ב\n\nכל השותפים מחויבים לעמוד בתקני הגנת מידע בינלאומיים.`,
        },
        {
            id: 'rights',
            icon: '⚖️',
            title: 'הזכויות שלך',
            rights: [
                { icon: '👁', title: 'זכות עיון',         desc: 'לקבל עותק של כל המידע שאחזקים עליך' },
                { icon: '✏️', title: 'זכות תיקון',        desc: 'לבקש תיקון מידע שגוי או לא מדויק' },
                { icon: '🗑', title: 'זכות מחיקה',        desc: 'לבקש מחיקת המידע, בכפוף לחובות חוקיות' },
                { icon: '🚫', title: 'זכות התנגדות',      desc: 'להתנגד לשימוש במידע לצרכי שיווק' },
                { icon: '📦', title: 'ניידות מידע',       desc: 'לקבל את המידע בפורמט קריא מכונה' },
                { icon: '⏸', title: 'הגבלת עיבוד',       desc: 'לבקש הגבלת השימוש במידע בנסיבות מסוימות' },
            ],
        },
        {
            id: 'security',
            icon: '🔒',
            title: 'כיצד מאובטח המידע',
            content: `האתר פועל בסטנדרטים של אבטחת מידע בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), תשע"ז-2017:\n\n• הצפנת תעבורה מלאה (TLS 1.3 / HTTPS)\n• הצפנת מידע במנוחה (Firebase Encryption at Rest)\n• בקרת גישה מבוססת הרשאות (Role-Based Access Control)\n• הגבלת קצב גישה ל-API (Rate Limiting)\n• ניטור אבטחה רציף ותיעוד אירועים\n• כותרות אבטחה מחמירות (CSP, HSTS, X-Frame-Options)`,
        },
        {
            id: 'cookies',
            icon: '🍪',
            title: 'מדיניות עוגיות',
            content: `אנו משתמשים בשני סוגי עוגיות:\n\n**עוגיות הכרחיות** — ללא צורך בהסכמה:\n• שמירת הסל ומצב הניווט\n• אבטחת המפגש\n\n**עוגיות אנליטיקס** — בהסכמה בלבד:\n• Google Analytics — ניתוח תנועה אנונימי\n• ניתן לבטל בכל עת דרך הגדרות הדפדפן`,
        },
        {
            id: 'contact',
            icon: '📬',
            title: 'פנייה בנושא פרטיות',
            content: `לכל פנייה בנושא מידע אישי — מחיקה, תיקון, עיון או שאלות:\n\nדוא"ל: ${email}\nטלפון: ${phone}\nזמן מענה: עד 30 יום עסקים\n\nניתן גם לפנות ישירות לרשות להגנת הפרטיות: gov.il/he/departments/the_privacy_protection_authority`,
        },
    ];

    const [open, setOpen] = useState({ who: true });
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const toggle = (id) => setOpen(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F0F2FA 0%, #F5F0FF 100%)', paddingTop: 80 }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 0' }}>

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#007AFF12', border: '1px solid #007AFF28', borderRadius: 50, padding: '5px 14px', marginBottom: 20 }}>
                        <span style={{ fontSize: 13 }}>🔒</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#007AFF', letterSpacing: 0.2 }}>מדיניות פרטיות</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 800, color: '#1D1D1F', margin: '0 0 10px', letterSpacing: -1.2, lineHeight: 1.1 }}>
                        הפרטיות שלך{' '}
                        <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            חשובה לנו
                        </span>
                    </h1>
                    <p style={{ fontSize: 16, color: '#6C6C70', lineHeight: 1.7, margin: '0 0 6px' }}>
                        מסמך זה מסביר בשקיפות מלאה אילו נתונים אנו אוספים, כיצד הם מוגנים, ומה הזכויות שלך — בהתאם לחוק הגנת הפרטיות הישראלי.
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
                    style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', borderRadius: 24, padding: '32px 28px', textAlign: 'center', marginBottom: 72 }}
                >
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>יש לך שאלות?</div>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', margin: '0 0 20px' }}>נשמח לענות על כל שאלה בנושא פרטיות ומידע אישי.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href={`mailto:${email}`} style={{ display: 'inline-block', background: '#fff', color: '#007AFF', fontWeight: 700, fontSize: 15, padding: '11px 26px', borderRadius: 50, textDecoration: 'none' }}>
                            שלח דוא"ל
                        </a>
                        <Link to="/terms" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '11px 26px', borderRadius: 50, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.28)' }}>
                            תנאי שימוש ←
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
