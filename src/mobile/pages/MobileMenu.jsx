import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Grid3X3, BookOpen, Video, Newspaper,
    Phone, ChevronLeft, Info, Shield, FileText, Moon, Sun
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const NAV_GROUPS = [
    {
        title: 'ניווט ראשי',
        items: [
            { Icon: Home,      label: 'דף הבית',       path: '/',         color: '#007AFF' },
            { Icon: Grid3X3,   label: 'קטלוג מוצרים',  path: '/catalog',  color: '#34C759' },
            { Icon: BookOpen,  label: 'השוואת דגמים',  path: '/compare',  color: '#FF9500' },
        ],
    },
    {
        title: 'תוכן ומידע',
        items: [
            { Icon: Video,     label: 'מרכז הדרכה',    path: '/vod',      color: '#BF5AF2' },
            { Icon: Newspaper, label: 'מגזין',          path: '/magazine', color: '#FF375F' },
            { Icon: Info,      label: 'הסיפור שלנו',   path: '/story',    color: '#5856D6' },
        ],
    },
    {
        title: 'שירות',
        items: [
            { Icon: Phone,     label: 'צור קשר',        path: '/contact',  color: '#30D158' },
        ],
    },
    {
        title: 'משפטי',
        items: [
            { Icon: Shield,    label: 'מדיניות פרטיות', path: '/privacy',  color: '#636366' },
            { Icon: FileText,  label: 'תנאי שימוש',     path: '/terms',    color: '#636366' },
        ],
    },
];

export default function MobileMenu() {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const { colors: c, isDark, toggle } = useTheme();
    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');
    const phone     = getSetting('contact_phone', '058-5856356');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── Brand header ─────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: c.surface, borderRadius: 20, padding: '18px 18px', marginBottom: 20, boxShadow: c.cardShadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {siteLogo ? (
                        <img src={siteLogo} alt={siteName} style={{ height: 40, objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>N</span>
                        </div>
                    )}
                    <div>
                        <p style={{ fontSize: 17, fontWeight: 900, color: c.text, letterSpacing: '-0.04em' }}>{siteName}</p>
                        <p style={{ fontSize: 12, color: c.text3, direction: 'ltr' }}>{phone}</p>
                    </div>
                </div>

                {/* Dark mode toggle */}
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => { haptic('select'); toggle(); }}
                    style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: isDark ? 'rgba(255,204,0,0.12)' : 'rgba(0,0,0,0.06)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                    aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
                >
                    {isDark
                        ? <Sun size={18} color="#FFCC00" strokeWidth={1.9} />
                        : <Moon size={18} color="#1D1D1F" strokeWidth={1.9} />
                    }
                </motion.button>
            </div>

            {/* ── Nav groups ───────────────────────────────────────── */}
            {NAV_GROUPS.map(group => (
                <div key={group.title} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: c.text3, letterSpacing: '0.04em', marginBottom: 8, padding: '0 4px' }}>
                        {group.title}
                    </p>
                    <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                        {group.items.map(({ Icon, label, path, color }, i) => (
                            <motion.button
                                key={path}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { haptic('select'); navigate(path); }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 18px',
                                    background: 'none', border: 'none',
                                    borderBottom: i < group.items.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                    cursor: 'pointer', direction: 'rtl',
                                    WebkitTapHighlightColor: 'transparent',
                                    fontFamily: SF,
                                }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={color} strokeWidth={1.9} />
                                </div>
                                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: c.text, textAlign: 'right' }}>{label}</span>
                                <ChevronLeft size={16} color={c.text4} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}

            <p style={{ textAlign: 'center', fontSize: 11, color: c.text4, fontWeight: 500, marginTop: 8 }}>
                © 2026 NextClass · כל הזכויות שמורות
            </p>
        </div>
    );
}
