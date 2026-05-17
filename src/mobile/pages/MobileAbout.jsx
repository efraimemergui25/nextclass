import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const VALUES = [
    { emoji: '🎯', title: 'מקצועיות', desc: 'ידע עמוק בצרכי מוסדות החינוך' },
    { emoji: '🤝', title: 'שותפות', desc: 'ליווי מלא לאורך כל הדרך' },
    { emoji: '💡', title: 'חדשנות', desc: 'הפתרונות הטכנולוגיים המתקדמים ביותר' },
];

export default function MobileAbout() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const navigate = useNavigate();

    const founderName = getSetting('about_founder_name', 'מייסד NextClass');
    const storyTitle  = getSetting('about_story_title', 'הסיפור שלנו');
    const storyBody   = getSetting('about_story_body', 'NextClass נולד מתוך הבנה עמוקה של צרכי מוסדות החינוך בישראל.');
    const founderImg  = getSetting('about_founder_img', '');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100vh' }}>

            {/* ── Hero ─────────────────────────────────────────────── */}
            <div style={{
                borderRadius: 22, overflow: 'hidden',
                background: 'linear-gradient(145deg, #1D1D1F 0%, #2C2C2E 100%)',
                padding: '28px 22px', marginBottom: 16,
                boxShadow: '0 6px 30px rgba(0,0,0,0.18)',
            }}>
                {founderImg && (
                    <div style={{ width: 72, height: 72, borderRadius: 22, overflow: 'hidden', marginBottom: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                        <img src={founderImg} alt={founderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 12, letterSpacing: '0.04em' }}>
                    NEXTCLASS
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 10 }}>
                    {storyTitle}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    {founderName} · מייסד
                </p>
            </div>

            {/* ── Story text ────────────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, padding: '20px 18px', marginBottom: 16, boxShadow: c.cardShadow }}>
                <p style={{ fontSize: 15, color: c.text2, lineHeight: 1.7 }}>
                    {storyBody}
                </p>
            </div>

            {/* ── Values ────────────────────────────────────────────── */}
            <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', marginBottom: 16, boxShadow: c.cardShadow }}>
                <div style={{ padding: '16px 18px 8px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>הערכים שלנו</h2>
                </div>
                {VALUES.map(({ emoji, title, desc }) => (
                    <div key={title} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 18px',
                        borderTop: `0.5px solid ${c.divider}`,
                    }}>
                        <div style={{ width: 44, height: 44, borderRadius: 13, background: c.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            {emoji}
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 2 }}>{title}</p>
                            <p style={{ fontSize: 13, color: c.text3 }}>{desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { haptic('light'); navigate('/contact'); }}
                style={{
                    width: '100%', height: 52, borderRadius: 16,
                    background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                    color: '#fff', border: 'none',
                    fontSize: 16, fontWeight: 700,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
                    letterSpacing: '-0.02em',
                }}
            >
                צור קשר עם הצוות
            </motion.button>
        </div>
    );
}
