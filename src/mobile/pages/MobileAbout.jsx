import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, BadgeDollarSign, Zap, Award, MessageCircle, Compass, Calendar, Phone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-30px' });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}>
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
    const valuesDesc  = getSetting('about_values_desc', 'לאמינות אין קיצורי דרך.');

    const wayTitle = getSetting('about_way_title', 'הדרך שעשינו');
    const tm1Year  = getSetting('about_tm1_year', '2012'); const tm1Title = getSetting('about_tm1_title', 'ההתחלה'); const tm1Desc = getSetting('about_tm1_desc', 'הקמנו את NextClass עם חזון אחד ברור.');
    const tm2Year  = getSetting('about_tm2_year', '2016'); const tm2Title = getSetting('about_tm2_title', 'צמיחה');  const tm2Desc = getSetting('about_tm2_desc', 'הגענו ל-200 מוסדות חינוך ברחבי ישראל.');
    const tm3Year  = getSetting('about_tm3_year', '2020'); const tm3Title = getSetting('about_tm3_title', 'חדשנות'); const tm3Desc = getSetting('about_tm3_desc', 'השקנו את פלטפורמת הניהול החכמה שלנו.');
    const tm4Year  = getSetting('about_tm4_year', '2024'); const tm4Title = getSetting('about_tm4_title', 'מנהיגות');const tm4Desc = getSetting('about_tm4_desc', '1,200 מוסדות חינוך בחרו בנו.');

    const ctaTitle = getSetting('about_cta_title', 'שאלו אותנו.\nנגיע עם תשובות.');
    const ctaDesc  = getSetting('about_cta_desc', 'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.');

    const VALUES = [
        { icon: BadgeDollarSign, color: '#FF9F0A', title: v1Title, desc: v1Desc },
        { icon: Zap,             color: '#007AFF', title: v2Title, desc: v2Desc },
        { icon: Award,           color: '#30D158', title: v3Title, desc: v3Desc },
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
                    background: 'linear-gradient(145deg, #F0F6FF 0%, #EEF0FF 60%, #F5F8FF 100%)',
                    padding: '28px 22px 24px',
                    boxShadow: '0 4px 20px rgba(0,122,255,0.08)',
                    border: '1px solid rgba(0,122,255,0.10)',
                    position: 'relative',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, left: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,86,214,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {founderImg ? (
                        <div style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                            <img src={founderImg} alt={founderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 28, fontWeight: 900, color: '#fff' }}>
                            N
                        </div>
                    )}

                    <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 12, letterSpacing: '0.04em', border: '1px solid rgba(0,122,255,0.18)' }}>
                        {heroLabel}
                    </div>
                    <h1 style={{
                        fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.12, marginBottom: 10, whiteSpace: 'pre-line',
                        background: 'linear-gradient(135deg, #1D1D1F 25%, #007AFF 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>
                        {heroTitle}
                    </h1>
                    <p style={{ fontSize: 14, color: c.text3, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                        {heroSub}
                    </p>
                </div>
            </div>
            </BlurFade>

            {/* ── Story ─────────────────────────────────────────────── */}
            <BlurFade delay={0.09}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em', marginBottom: 12 }}>{storyTitle}</h2>
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

            {/* ── How We Work — matches desktop "קודם שואלים" section ── */}
            <BlurFade delay={0.12}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', boxShadow: c.cardShadow }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 8, display: 'block' }}>הגישה שלנו</span>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 6 }}>
                        קודם שואלים.{' '}
                        <span style={{ color: '#AEAEB2' }}>אחר כך מציעים.</span>
                    </h2>
                    <p style={{ fontSize: 13, color: c.text2, lineHeight: 1.6, marginBottom: 16 }}>
                        הרוב מוכרים. אנחנו מקשיבים. לפני כל המלצה מגיעה שיחה אמיתית שמבינה את הצורך.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { Icon: MessageCircle, color: '#007AFF', text: 'מקשיבים לצורך האמיתי — לפני שמציעים פתרון' },
                            { Icon: Compass,       color: '#5856D6', text: 'ממליצים על מה שמתאים, לא על מה שהכי יקר' },
                            { Icon: Calendar,      color: '#FF9500', text: 'מגיעים ביום שסוכם — תמיד, ללא עיכובים' },
                            { Icon: Phone,         color: '#30D158', text: 'מענה ישיר ומהיר — בלי תורים, בלי המתנה' },
                        ].map(({ Icon, color, text }, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(0,122,255,0.05)', borderRadius: 12, border: '0.5px solid rgba(0,122,255,0.1)' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={16} color={color} strokeWidth={1.8} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: c.text2, lineHeight: 1.4 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── Founder message — light glass (matches desktop style) ── */}
            <BlurFade delay={0.15}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{
                    background: c.surface, borderRadius: 20, padding: '22px 20px',
                    boxShadow: c.cardShadow, border: `0.5px solid ${c.border}`,
                }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', letterSpacing: '0.08em', marginBottom: 14 }}>
                        {founderLabel.toUpperCase()}
                    </p>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 14, whiteSpace: 'pre-line' }}>
                        {founderTitle}
                    </h3>
                    <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.7, marginBottom: 16 }}>
                        "{founderMessage}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: `0.5px solid ${c.divider}` }}>
                        {founderImg ? (
                            <img src={founderImg} alt={founderName} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>א</div>
                        )}
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: c.text }}>{founderName}</p>
                            <p style={{ fontSize: 12, color: c.text3 }}>{founderRole}</p>
                        </div>
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── Values ────────────────────────────────────────────── */}
            <BlurFade delay={0.15}>
            <div style={{ margin: '16px 16px 0' }}>
                <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#007AFF', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>{valuesTitle}</span>
                    <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
                        {(() => {
                            const [first, ...rest] = valuesDesc.split(' ');
                            return (
                                <>
                                    <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{first}</span>
                                    {rest.length > 0 && <span style={{ color: c.text }}> {rest.join(' ')}</span>}
                                </>
                            );
                        })()}
                    </h2>
                    <div style={{ marginTop: 10, height: 3, width: 44, borderRadius: 99, background: 'linear-gradient(90deg, #007AFF, #5856D6)' }} />
                </div>
                <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                    {VALUES.map(({ icon: VIcon, color, title, desc }, i) => (
                        <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', borderBottom: i < VALUES.length - 1 ? `0.5px solid ${c.divider}` : 'none' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <VIcon size={22} color={color} strokeWidth={1.8} />
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

            {/* ── Social Proof — matches desktop testimonials section ── */}
            <BlurFade delay={0.18}>
            <div style={{ margin: '20px 16px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>לקוחות מספרים</h2>
                    <p style={{ fontSize: 12, color: c.text3, fontWeight: 600 }}>סומכים עלינו</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { quote: 'ביקשנו 12 מסכים לפני ינואר. הגיעו ב-27 בדצמבר, הותקנו ב-28, ויום אחרי כל הצוות כבר ידע להשתמש. אפס בירוקרטיה.', name: 'רינת לוי', role: 'רכזת טכנולוגיה, חט"ב, רמת גן', stars: 5 },
                        { quote: 'עבדנו עם ספקים אחרים. ב-NextClass יש עם מי לדבר כשיש בעיה — לא רק לפני המכירה.', name: 'דוד אוחיון', role: 'מנהל רכש, רשות מקומית דרום', stars: 5 },
                        { quote: 'ציוד בסדר גמור, אבל מה שגרם לנו לחזור זה השירות. אפרים ענה לי ב-WhatsApp בערב. זה לא מובן מאליו.', name: 'נועה שפירא', role: 'מנהלת חינוכית, מכללת עמק', stars: 5 },
                    ].map(({ quote, name, role, stars }, i) => (
                        <div key={i} style={{ background: c.surface, borderRadius: 18, padding: '16px 18px', boxShadow: c.cardShadow, border: `0.5px solid ${c.border}` }}>
                            <div style={{ display: 'flex', gap: 2, marginBottom: 10, justifyContent: 'flex-end' }}>
                                {Array.from({ length: stars }).map((_, s) => (
                                    <span key={s} style={{ color: '#FF9500', fontSize: 14 }}>★</span>
                                ))}
                            </div>
                            <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65, marginBottom: 14 }}>"{quote}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                    {name[0]}
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: c.text }}>{name}</p>
                                    <p style={{ fontSize: 11, color: c.text3 }}>{role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </BlurFade>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <BlurFade delay={0.24}>
            <div style={{ margin: '20px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic('light'); navigate('/contact'); }}
                    style={{ borderRadius: 20, padding: '24px 22px', cursor: 'pointer', background: c.surface, boxShadow: c.cardShadow, WebkitTapHighlightColor: 'transparent', border: `1px solid ${c.divider}` }}
                >
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', marginBottom: 10, lineHeight: 1.2, whiteSpace: 'pre-line' }}>{ctaTitle}</h3>
                    <p style={{ fontSize: 13, color: c.text3, marginBottom: 18, lineHeight: 1.5 }}>{ctaDesc}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#007AFF', padding: '10px 20px', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700 }}>
                        {getSetting('contact_form_btn', 'שלח פנייה')} <ArrowLeft size={15} />
                    </div>
                </motion.div>
            </div>
            </BlurFade>
        </div>
    );
}
