import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Grid3X3, BookOpen, Video, Newspaper,
    Phone, ChevronLeft, Info
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

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
];

export default function MobileMenu() {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');
    const phone     = getSetting('contact_phone', '058-5856356');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px' }}>

            {/* ── Brand header ─────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 20, padding: '18px 18px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                {siteLogo ? (
                    <img src={siteLogo} alt={siteName} style={{ height: 40, objectFit: 'contain' }} />
                ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>N</span>
                    </div>
                )}
                <div>
                    <p style={{ fontSize: 17, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em' }}>{siteName}</p>
                    <p style={{ fontSize: 12, color: '#86868B', direction: 'ltr' }}>{phone}</p>
                </div>
            </div>

            {/* ── Nav groups ───────────────────────────────────────── */}
            {NAV_GROUPS.map(group => (
                <div key={group.title} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#86868B', letterSpacing: '0.04em', marginBottom: 8, padding: '0 4px' }}>
                        {group.title}
                    </p>
                    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        {group.items.map(({ Icon, label, path, color }, i) => (
                            <motion.button
                                key={path}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(path)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '14px 18px',
                                    background: 'none', border: 'none',
                                    borderBottom: i < group.items.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none',
                                    cursor: 'pointer', direction: 'rtl',
                                    WebkitTapHighlightColor: 'transparent',
                                    fontFamily: SF,
                                }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={color} strokeWidth={1.9} />
                                </div>
                                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#1D1D1F', textAlign: 'right' }}>{label}</span>
                                <ChevronLeft size={16} color="#C7C7CC" />
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Footer ────────────────────────────────────────────── */}
            <p style={{ textAlign: 'center', fontSize: 11, color: '#C7C7CC', fontWeight: 500, marginTop: 8 }}>
                © 2026 NextClass · כל הזכויות שמורות
            </p>
        </div>
    );
}
