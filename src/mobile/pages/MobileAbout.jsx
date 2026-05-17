import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-30px' });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}>
            {children}
        </motion.div>
    );
}

export default function MobileAbout() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const navigate = useNavigate();

    const heroLabel      = getSetting('about_hero_label', 'הסיפור שלנו');
    const heroTitle      = getSetting('about_hero_title', 'הטכנולוגיה\nשחינוך ראוי לה.');
    const heroSub        = getSetting('about_hero_sub', 'מקצועי. מהיר. אישי. ישיר.');
    const storyTitle     = getSetting('about_story_title', 'הכל התחיל ב-2012.');
    const storyBody      = getSetting('about_story_body', 'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם...');
    const founderName    = getSetting('about_founder_name', 'אפרים אמרגי');
    const founderRole    = getSetting('about_founder_role', 'מייסד ומנכ"ל NextClass');
    const founderImg     = getSetting('about_founder_img', '');
    const founderTitle   = getSetting('about_founder_title', 'מקצועיות ללא פשרות.');
    const founderMessage = getSetting('about_founder_message', 'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו.');
    const founderLabel   = getSetting('about_founder_label', 'מילה אישית מהמייסד');

    const check1 = getSetting('about_check_1', 'ייעוץ מקצועי ומהיר — ללא עלות');
    const check2 = getSetting('about_check_2', 'שירות אישי וישיר, ללא ביניים');
    const check3 = getSetting('about_check_3', 'פתרונות מהדרגה הראשונה לחינוך');

    const stat1Val   = getSetting('about_stat1_val', '1200');
    const stat1Label = getSetting('about_stat1_label', 'מוסדות חינוך');
    const stat2Val   = getSetting('about_stat2_val', '14');
    const stat2Label = getSetting('about_stat2_label', 'שנות ניסיון');
    const stat3Val   = getSetting('about_stat3_val', '98');
    const stat3Label = getSetting('about_stat3_label', '% שביעות רצון');

    const v1Title = getSetting('about_v1_title', 'מחיר שקוף');
    const v1Desc  = getSetting('about_v1_desc', 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים.');
    const v2Title = getSetting('about_v2_title', 'שירות מהיר');
    const v2Desc  = getSetting('about_v2_desc', 'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות.');
    const v3Title = getSetting('about_v3_title', 'רמה מקצועית');
    const v3Desc  = getSetting('about_v3_desc', 'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה.');

    const valuesTitle = getSetting('about_values_title', 'שלושה כללים');
    const valuesDesc  = getSetting('about_values_desc', 'מה שאמרנו — עמדנו בו. תמיד.');

    const wayTitle = getSetting('about_way_title', 'הדרך שעשינו');
    const tm1Year  = getSetting('about_tm1_year', '2012'); const tm1Title = getSetting('about_tm1_title', 'ההתחלה'); const tm1Desc = getSetting('about_tm1_desc', 'הקמנו את NextClass עם חזון אחד ברור.');
    const tm2Year  = getSetting('about_tm2_year', '2016'); const tm2Title = getSetting('about_tm2_title', 'צמיחה');  const tm2Desc = getSetting('about_tm2_desc', 'הגענו ל-200 מוסדות חינוך ברחבי ישראל.');
    const tm3Year  = getSetting('about_tm3_year', '2020'); const tm3Title = getSetting('about_tm3_title', 'חדשנות'); const tm3Desc = getSetting('about_tm3_desc', 'השקנו את פלטפורמת הניהול החכמה שלנו.');
    const tm4Year  = getSetting('about_tm4_year', '2024'); const tm4Title = getSetting('about_tm4_title', 'מנהיגות');const tm4Desc = getSetting('about_tm4_desc', '1,200 מוסדות חינוך בחרו בנו.');

    const ctaTitle = getSetting('about_cta_title', 'שאלו אותנו.\nנגיע עם תשובות.');
    const ctaDesc  = getSetting('about_cta_desc', 'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.');

    const VALUES = [
        { emoji: '💰', title: v1Title, desc: v1Desc },
        { emoji: '⚡', title: v2Title, desc: v2Desc },
        { emoji: '🏆', title: v3Title, desc: v3Desc },
    ];

    const TIMELINE = [
        [tm1Year, tm1Title, tm1Desc, '#007AFF'],
        [tm2Year, tm2Title, tm2Desc, '#5856D6'],
        [tm3Year, tm3Title, tm3Desc, '#FF9500'],
        [tm4Year, tm4Title, tm4Desc, '#34C759'],
    ];

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 32, background: c.bg, minHeight: '100dvh' }}>

            {/* ── Hero ─────────────────────────────────────────────── */}
            <BlurFade delay={0}>
            <div style={{ padding: '14px 16px 0' }}>
                <div style={{
                    borderRadius: 24, overflow: 'hidden',
                    background: 'linear-gradient(145deg, #1D1D1F 0%, #2C2C2E 60%, #1a1a2e 100%)',
                    padding: '28px 22px 24px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                    position: 'relative',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,122,255,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {founderImg ? (
                        <div style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                            <img src={founderImg} alt={founderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 28, fontWeight: 900, color: '#fff' }}>
                            N
                        </div>
                    )}

                    <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.2)', color: '#64D2FF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 12, letterSpacing: '0.04em' }}>
                        {heroLabel}
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 10, whiteSpace: 'pre-line' }}>
                        {heroTitle}
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                        {heroSub}
                    </p>
                </div>
            </div>
            </BlurFade>

            {/* ── Stats ─────────────────────────────────────────────── */}
            <BlurFade delay={0.06}>
            <div style={{ margin: '14px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', boxShadow: c.cardShadow, overflow: 'hidden' }}>
                    {[[stat1Val, stat1Label], [stat2Val, stat2Label], [stat3Val, stat3Label]].map(([val, label], i) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', borderRight: i < 2 ? `0.5px solid ${c.divider}` : 'none' }}>
                            <span style={{ fontSize: 22, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.04em' }}>
                                {val}{label.includes('%') ? '%' : '+'}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.text3, marginTop: 2, textAlign: 'center' }}>
                                {label.replace(/ ?%/, '')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            </BlurFade>

            {/* ── Story ─────────────────────────────────────────────── */}
            <BlurFade delay={0.09}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: 12 }}>{storyTitle}</h2>
                    <p style={{ fontSize: 15, color: c.text2, lineHeight: 1.7 }}>{storyBody}</p>
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[check1, check2, check3].map(c2 => (
                            <div key={c2} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 20, height: 20, borderRadius: 10, background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L4 8L8.5 2.5" stroke="#34C759" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <span style={{ fontSize: 13, color: c.text2, fontWeight: 600 }}>{c2}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── Founder message ───────────────────────────────────── */}
            <BlurFade delay={0.12}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ background: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)', borderRadius: 20, padding: '22px 20px', boxShadow: '0 6px 28px rgba(0,0,0,0.18)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', marginBottom: 14 }}>
                        {founderLabel.toUpperCase()}
                    </p>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 14, whiteSpace: 'pre-line' }}>
                        {founderTitle}
                    </h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7, marginBottom: 16 }}>
                        "{founderMessage}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
                        {founderImg ? (
                            <img src={founderImg} alt={founderName} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>א</div>
                        )}
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{founderName}</p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{founderRole}</p>
                        </div>
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── Values ────────────────────────────────────────────── */}
            <BlurFade delay={0.15}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ fontSize: 13, color: c.text3 }}>{valuesDesc}</p>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>{valuesTitle}</h2>
                </div>
                <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                    {VALUES.map(({ emoji, title, desc }, i) => (
                        <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderBottom: i < VALUES.length - 1 ? `0.5px solid ${c.divider}` : 'none' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                                {emoji}
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{title}</p>
                                <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </BlurFade>

            {/* ── Timeline ──────────────────────────────────────────── */}
            <BlurFade delay={0.18}>
            <div style={{ margin: '20px 16px 0' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: 16, textAlign: 'right' }}>{wayTitle}</h2>
                <div style={{ position: 'relative', paddingRight: 20 }}>
                    {/* vertical line */}
                    <div style={{ position: 'absolute', top: 8, bottom: 8, right: 8, width: 2, background: c.divider, borderRadius: 1 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {TIMELINE.map(([year, title, desc, accent], i) => (
                            <div key={year} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: i < TIMELINE.length - 1 ? 20 : 0 }}>
                                {/* dot */}
                                <div style={{ width: 16, height: 16, borderRadius: 8, background: accent, flexShrink: 0, marginTop: 3, boxShadow: `0 0 0 3px ${accent}22`, zIndex: 1 }} />
                                <div style={{ background: c.surface, borderRadius: 16, padding: '14px 16px', flex: 1, boxShadow: c.cardShadow }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{year}</span>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{title}</span>
                                    </div>
                                    <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <BlurFade delay={0.21}>
            <div style={{ margin: '20px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic('light'); navigate('/contact'); }}
                    style={{ borderRadius: 20, padding: '24px 22px', cursor: 'pointer', background: 'linear-gradient(135deg, #007AFF, #5856D6)', boxShadow: '0 6px 28px rgba(0,122,255,0.28)', WebkitTapHighlightColor: 'transparent' }}
                >
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{ctaTitle}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18, lineHeight: 1.5 }}>{ctaDesc}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '10px 18px', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, border: '1px solid rgba(255,255,255,0.26)' }}>
                        {getSetting('contact_form_btn', 'שלח פנייה')} <ArrowLeft size={15} />
                    </div>
                </motion.div>
            </div>
            </BlurFade>
        </div>
    );
}
