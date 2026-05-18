import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, X, Search, MessageCircle, Phone, Mail, Zap, GraduationCap, Video, LayoutGrid, BookOpen, ChevronLeft } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// ─── Static FAQ Data (mirrors VODCenterPage) ──────────────────────────────────

const FAQ = [
    { q: 'כמה זמן לוקחת ההתקנה?', a: 'התקנת מסך בודד לוקחת בין שעה לשלוש שעות, בהתאם לסוג ההתקנה (קיר, מעמד נייד, מסגרת). לבתי ספר עם מספר כיתות — אנו מתכננים לוח זמנים מותאם שמינימיזציה ההפרעה לשגרת הלימודים.' },
    { q: 'מה כוללת האחריות?', a: 'כל המוצרים מגיעים עם אחריות יצרן בהתאם לדגם (בדרך כלל 2-5 שנים). בנוסף, NextClass מציעה תמיכה טכנית ישירה ב-WhatsApp וטלפון לכל תקופת האחריות. החלפה תוך 30 יום לתקלות ייצור.' },
    { q: 'האם ניתן לממן דרך תקציב ממ"ד / משרד החינוך?', a: 'כן — אנו מנפיקים חשבוניות רשמיות ועובדים עם כל מסגרות הרכש הממשלתיות, כולל מכרזים ורשימות ספקים מאושרים. פנו אלינו ונסייע בתהליך הרכש.' },
    { q: 'האם יש הדרכה לצוות המורים?', a: 'בהחלט. כל רכישה כוללת הדרכה בסיסית. הדרכה מורחבת בבית הספר (מדריך אישי לצוות) זמינה כשירות נפרד. ראה את לשונית "הדרכות" לפרטים.' },
    { q: 'מה ההבדל בין המסכים השונים?', a: 'ההבדלים העיקריים הם גודל המסך (55"–98"), רזולוציה (4K), מספר נקודות מגע (10–40), ועוצמת עיבוד המעבד הפנימי. נשמח לעזור בבחירה מותאמת לצרכי הכיתה וגודל הקהל.' },
    { q: 'האם המסכים מתחברים לכל מערכות ניהול הכיתה?', a: 'כן — כל המסכים שלנו תומכים ב-AirPlay, Miracast, Google Cast ו-USB-C. תואמים ל-Google Workspace, Microsoft 365 ו-Apple Classroom.' },
    { q: 'כמה זמן ממועד ההזמנה עד האספקה?', a: 'ברוב המקרים 5–14 ימי עסקים לאחר אישור הצעת המחיר. פרויקטים גדולים (מעל 10 יחידות) מתואמים בלוח זמנים מוסכם.' },
    { q: 'מה קורה אם יש תקלה לאחר ההתקנה?', a: 'יש לנו קו תמיכה ישיר ב-WhatsApp. פניות נענות תוך שעה בשעות פעילות (א׳–ו׳, 08:00–20:00). תקלות המצריכות טכנאי — נגיע לבית הספר תוך 48 שעות.' },
];

// ─── Tabs config ──────────────────────────────────────────────────────────────

const TABS = [
    { id: 'videos',   label: 'סרטונים' },
    { id: 'help',     label: 'עזרה'     },
    { id: 'training', label: 'הדרכות'  },
    { id: 'support',  label: 'תמיכה'   },
];

// ─── FAQ accordion item ───────────────────────────────────────────────────────

function FAQItem({ item, c }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{
            background: c.surface, borderRadius: 16, overflow: 'hidden',
            boxShadow: c.cardShadow, marginBottom: 8,
        }}>
            <button
                onClick={() => setOpen(p => !p)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '16px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'right', gap: 10, fontFamily: SF,
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <span style={{ fontSize: 14, fontWeight: 700, color: c.text, flex: 1, textAlign: 'right', lineHeight: 1.35 }}>
                    {item.q}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: 'inline-flex', flexShrink: 0 }}
                >
                    <ChevronDown size={14} color={c.text3} strokeWidth={2} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="ans"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <p style={{
                            padding: '0 16px 16px', fontSize: 13, color: c.text2,
                            lineHeight: 1.7, borderTop: `1px solid ${c.border || 'rgba(0,0,0,0.06)'}`,
                            paddingTop: 12, margin: 0,
                        }}>
                            {item.a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Tab: Videos ──────────────────────────────────────────────────────────────

function VideosTab({ videos, c }) {
    const [selected, setSelected] = useState(null);

    return (
        <div>
            {/* Selected video player */}
            {selected && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{
                            fontSize: 13, fontWeight: 700, color: c.text, flex: 1, lineHeight: 1.3,
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {selected.title}
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => setSelected(null)}
                            aria-label="סגור וידאו"
                            style={{
                                width: 44, height: 44, borderRadius: 99, flexShrink: 0, marginRight: 4,
                                background: c.subtleBg, border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <X size={18} strokeWidth={2.5} color={c.text2} />
                        </motion.button>
                    </div>
                    <div style={{ background: '#000', borderRadius: 18, overflow: 'hidden', aspectRatio: '16/9' }}>
                        <iframe
                            src={selected.embedUrl || selected.url}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={selected.title}
                        />
                    </div>
                </div>
            )}

            {/* Videos list */}
            {videos === null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', display: 'flex', boxShadow: c.cardShadow }}>
                            <div style={{
                                width: 110, height: 80,
                                background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`,
                                backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position', flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, padding: '16px 14px' }}>
                                <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, marginBottom: 8 }} />
                                <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, width: '50%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div style={{ background: c.surface, borderRadius: 20, padding: '32px 20px', textAlign: 'center', boxShadow: c.cardShadow }}>
                    <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Video size={28} color="#007AFF" strokeWidth={1.5} />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>תוכן בדרך</p>
                    <p style={{ fontSize: 14, color: c.text3 }}>הדרכות וידאו יתווספו בקרוב</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {videos.map(video => (
                        <motion.div
                            key={video.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(video)}
                            style={{
                                background: c.surface, borderRadius: 18,
                                overflow: 'hidden', cursor: 'pointer',
                                display: 'flex', gap: 0,
                                boxShadow: selected?.id === video.id
                                    ? '0 0 0 2px #007AFF, 0 4px 20px rgba(0,122,255,0.15)'
                                    : c.cardShadow,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <div style={{ width: 110, height: 80, background: c.surface2, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                                {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.shimmerA}, ${c.shimmerB})` }}>
                                        <Play size={24} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.3)" />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Play size={14} color="#fff" fill="#fff" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: '12px 14px', direction: 'rtl' }}>
                                <p style={{
                                    fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 5,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {video.title}
                                </p>
                                {video.duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} color={c.text3} />
                                        <span style={{ fontSize: 11, color: c.text3 }}>{video.duration}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Tab: Help / FAQ ──────────────────────────────────────────────────────────

function HelpTab({ getSetting, c }) {
    const waNumber = getSetting('whatsapp_number', '972585856356');
    const [search, setSearch] = useState('');
    const filtered = FAQ.filter(f => !search || f.q.includes(search) || f.a.includes(search));

    return (
        <div>
            {/* Search bar */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search
                    size={16}
                    color={c.text3}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="חפשו שאלה..."
                    dir="rtl"
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        background: c.surface, borderRadius: 14,
                        border: `1px solid ${c.border || 'rgba(0,0,0,0.08)'}`,
                        padding: '12px 40px 12px 14px',
                        fontSize: 14, color: c.text, fontFamily: SF,
                        outline: 'none', boxShadow: c.cardShadow,
                    }}
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        style={{
                            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: c.text3, fontSize: 16,
                        }}
                    ><X size={14} strokeWidth={2.5} /></button>
                )}
            </div>

            {/* FAQ items */}
            {filtered.length === 0 ? (
                <p style={{ textAlign: 'center', color: c.text3, padding: '32px 0', fontSize: 14 }}>לא נמצאו תוצאות.</p>
            ) : (
                filtered.map((item, i) => <FAQItem key={i} item={item} c={c} />)
            )}

            {/* WhatsApp CTA */}
            <div style={{
                background: c.surface, borderRadius: 18, padding: '18px 16px',
                boxShadow: c.cardShadow, marginTop: 8,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end',
            }}>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>לא מצאת תשובה?</p>
                    <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.5 }}>צוות התמיכה שלנו זמין ב-WhatsApp ראשון–שישי, 08:00–20:00.</p>
                </div>
                <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 20px', background: '#25D366',
                        color: '#fff', fontWeight: 700, borderRadius: 99,
                        fontSize: 13, textDecoration: 'none',
                        fontFamily: SF, boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                    }}
                >
                    <MessageCircle size={15} />
                    פתח WhatsApp
                </a>
            </div>
        </div>
    );
}

// ─── Tab: Training ────────────────────────────────────────────────────────────

function TrainingTab({ c }) {
    const services = [
        {
            icon: Zap,
            iconBg: 'linear-gradient(135deg, #007AFF, #5856D6)',
            title: 'הדרכה בסיסית — כלולה בכל רכישה',
            sub: 'הדרכת הפעלה ראשונית של המסך, חיבור לרשת ותצורת הכיתה. ניתנת ביום ההתקנה על ידי הטכנאי.',
        },
        {
            icon: GraduationCap,
            iconBg: 'linear-gradient(135deg, #BF5AF2, #FF2D55)',
            title: 'הדרכת צוות מורחבת',
            sub: 'מדריך מוסמך מגיע לבית הספר לסדנה מעמיקה — שימוש פדגוגי, EduEdit Studio, שיתוף מסך ועבודה עם Google Workspace.',
        },
        {
            icon: Phone,
            iconBg: 'linear-gradient(135deg, #34C759, #30B0C7)',
            title: 'תמיכה שוטפת לאחר ההדרכה',
            sub: 'צוות התמיכה זמין ב-WhatsApp וטלפון לכל שאלה לאחר ההדרכה. מענה תוך שעה בימים א׳–ו׳.',
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 18, textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: c.text, letterSpacing: '-0.03em', marginBottom: 4 }}>שירותי הדרכה</p>
                <p style={{ fontSize: 13, color: c.text3 }}>הדרכה מקצועית לכל שלב — מהתקנה ועד שליטה מלאה.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {services.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            background: c.surface, borderRadius: 18, padding: '16px 16px',
                            boxShadow: c.cardShadow, display: 'flex', gap: 14, alignItems: 'flex-start',
                        }}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: s.iconBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <s.icon size={20} color="#fff" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 5, lineHeight: 1.3 }}>{s.title}</p>
                            <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.6 }}>{s.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* In-person CTA */}
            <div style={{
                background: c.surface, borderRadius: 18, padding: '18px 16px',
                boxShadow: c.cardShadow, marginTop: 12,
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end',
            }}>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>הדרכה חיה בבית הספר</p>
                    <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.5 }}>מדריך מוסמך יגיע לכם — ויתאים את ההדרכה לצוות ולציוד שלכם.</p>
                </div>
                <a
                    href="/contact"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 20px', background: '#007AFF',
                        color: '#fff', fontWeight: 700, borderRadius: 99,
                        fontSize: 13, textDecoration: 'none',
                        fontFamily: SF, boxShadow: '0 4px 16px rgba(0,122,255,0.3)',
                    }}
                >
                    <Zap size={14} />
                    תאמו הדרכה עכשיו
                </a>
            </div>
        </div>
    );
}

// ─── Tab: Support ─────────────────────────────────────────────────────────────

function SupportTab({ getSetting, c }) {
    const phone    = getSetting('contact_phone',    '058-5856356');
    const email    = getSetting('contact_email',    'nextclass.en@gmail.com');
    const waNumber = getSetting('whatsapp_number',  '972585856356');

    const channels = [
        {
            Icon: MessageCircle,
            color: '#25D366',
            bgTint: 'rgba(37,211,102,0.07)',
            label: 'WhatsApp',
            sub: "מענה תוך שעה · א׳–ו׳ 08–20",
            href: `https://wa.me/${waNumber}`,
            actionLabel: 'פתח שיחה',
            external: true,
        },
        {
            Icon: Phone,
            color: '#007AFF',
            bgTint: 'rgba(0,122,255,0.06)',
            label: 'טלפון',
            sub: `${phone} · א׳–ו׳ 09–18`,
            href: `tel:${phone.replace(/\D/g, '')}`,
            actionLabel: 'התקשר',
            external: false,
        },
        {
            Icon: Mail,
            color: '#5856D6',
            bgTint: 'rgba(88,86,214,0.06)',
            label: 'דוא"ל',
            sub: `${email} · מענה תוך יום`,
            href: `mailto:${email}`,
            actionLabel: 'שלח מייל',
            external: false,
        },
    ];

    const hours = [
        ['ראשון–חמישי', '08:00–20:00'],
        ['שישי',        '08:00–14:00'],
        ['שבת',         'סגור'],
        ['WhatsApp',    'ראשון–שישי 08–20'],
    ];

    return (
        <div>
            <div style={{ marginBottom: 18, textAlign: 'right' }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: c.text, letterSpacing: '-0.03em', marginBottom: 4 }}>צור קשר</p>
                <p style={{ fontSize: 13, color: c.text3 }}>בחר את הערוץ המועדף עליך — נשמח לעזור.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {channels.map((ch, i) => (
                    <motion.a
                        key={i}
                        href={ch.href}
                        target={ch.external ? '_blank' : undefined}
                        rel={ch.external ? 'noopener noreferrer' : undefined}
                        whileTap={{ scale: 0.97 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            background: ch.bgTint, borderRadius: 18,
                            padding: '14px 16px',
                            boxShadow: c.cardShadow,
                            border: `1px solid ${ch.color}22`,
                            textDecoration: 'none',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <div style={{
                            width: 46, height: 46, borderRadius: 14,
                            background: ch.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <ch.Icon size={20} color="#fff" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 3 }}>{ch.label}</p>
                            <p style={{ fontSize: 12, color: c.text3 }}>{ch.sub}</p>
                        </div>
                        <span style={{
                            fontSize: 12, fontWeight: 700, color: ch.color,
                            background: 'rgba(255,255,255,0.85)', borderRadius: 99,
                            padding: '6px 12px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                            {ch.actionLabel} <ChevronLeft size={12} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </span>
                    </motion.a>
                ))}
            </div>

            {/* Operating hours */}
            <div style={{
                background: c.surface, borderRadius: 18, padding: '18px 16px',
                boxShadow: c.cardShadow, marginTop: 12,
            }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: c.text3, textAlign: 'right', marginBottom: 14, letterSpacing: '0.04em' }}>
                    שעות פעילות
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hours.map(([day, time]) => (
                        <div
                            key={day}
                            style={{
                                display: 'flex', justifyContent: 'space-between',
                                borderBottom: `1px solid ${c.border || 'rgba(0,0,0,0.06)'}`,
                                paddingBottom: 10, fontSize: 13,
                            }}
                        >
                            <span style={{ fontWeight: 700, color: c.text }}>{time}</span>
                            <span style={{ color: c.text3 }}>{day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MobileVOD() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const navigate = useNavigate();
    const [videos,   setVideos]   = useState(null);
    const [activeTab, setActiveTab] = useState('videos');

    const pageTitle = getSetting('vod_title',    'עתיד הלמידה, עכשיו.');
    const pageSub   = getSetting('vod_subtitle', 'הדרכות וידאו מקצועיות לשימוש מיטבי בציוד');

    useEffect(() => {
        getDocs(query(collection(db, 'vod_videos'), orderBy('order', 'asc')))
            .then(snap => setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .catch(() => setVideos([]));
    }, []);

    // Scroll to top on tab change
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [activeTab]);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* ── Header card ───────────────────────────────────────── */}
            <div style={{ padding: '16px 16px 0' }}>
                <div style={{
                    borderRadius: 22, padding: '22px 20px', marginBottom: 0,
                    background: c.surface,
                    boxShadow: c.cardShadow,
                }}>
                    <div style={{
                        display: 'inline-block', background: 'rgba(0,122,255,0.10)',
                        color: '#007AFF', fontSize: 11, fontWeight: 700,
                        padding: '4px 12px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em',
                    }}>
                        מרכז הדרכה
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 6 }}>
                        {pageTitle}
                    </h1>
                    <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5 }}>{pageSub}</p>
                </div>
            </div>

            {/* ── Quick links ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 16px 0' }}>
                {[
                    { label: getSetting('nav_catalog', 'קטלוג'), Icon: LayoutGrid, color: '#007AFF', path: '/catalog' },
                    { label: getSetting('nav_magazine', 'מגזין'), Icon: BookOpen,   color: '#5856D6', path: '/magazine' },
                    { label: 'ייעוץ חינמי', Icon: MessageCircle, color: '#25D166', path: '/contact' },
                ].map(({ label, Icon, color, path }) => (
                    <motion.button
                        key={path}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => navigate(path)}
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            background: c.surface, border: 'none', borderRadius: 14,
                            padding: '10px 6px', fontSize: 12, fontWeight: 700, color: c.text,
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            boxShadow: c.cardShadow, fontFamily: SF,
                        }}
                    >
                        <Icon size={14} color={color} strokeWidth={2} />
                        {label}
                    </motion.button>
                ))}
            </div>

            {/* ── Tab bar ───────────────────────────────────────────── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: c.bg,
                paddingTop: 12, paddingBottom: 4,
            }}>
                <div style={{
                    display: 'flex', gap: 6, overflowX: 'auto',
                    padding: '0 16px 10px',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: 99,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: SF,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.18s',
                                    background: active ? '#007AFF' : c.surface,
                                    color: active ? '#fff' : c.text2,
                                    boxShadow: active ? '0 4px 14px rgba(0,122,255,0.28)' : c.cardShadow,
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Tab content ───────────────────────────────────────── */}
            <div style={{ padding: '4px 16px 40px' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {activeTab === 'videos'   && <VideosTab   videos={videos} c={c} />}
                        {activeTab === 'help'     && <HelpTab     getSetting={getSetting} c={c} />}
                        {activeTab === 'training' && <TrainingTab c={c} />}
                        {activeTab === 'support'  && <SupportTab  getSetting={getSetting} c={c} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
