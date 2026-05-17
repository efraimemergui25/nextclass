import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home, Grid3X3, BookOpen, Video, Newspaper,
    Phone, ChevronLeft, Info, Shield, FileText,
    Moon, Sun, ShoppingCart, Heart, Lock,
    Compass, Zap, MessageCircle,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth, TIER_CONFIG } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// Nav groups — built dynamically so WhatsApp can get the phone number
function buildNavGroups(phone) {
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}`;
    return [
        {
            title: 'ניווט ראשי',
            items: [
                { Icon: Home,        label: 'דף הבית',        path: '/',          color: '#007AFF' },
                { Icon: Grid3X3,     label: 'קטלוג מוצרים',   path: '/catalog',   color: '#34C759' },
                { Icon: Compass,     label: 'גלה מוצרים',     path: '/discover',  color: '#FF9500' },
                { Icon: BookOpen,    label: 'השוואת דגמים',   path: '/compare',   color: '#5856D6' },
            ],
        },
        {
            title: 'תוכן ומידע',
            items: [
                { Icon: Video,       label: 'מרכז הדרכה',     path: '/vod',       color: '#BF5AF2' },
                { Icon: Newspaper,   label: 'מגזין',           path: '/magazine',  color: '#FF375F' },
                { Icon: Info,        label: 'הסיפור שלנו',    path: '/story',     color: '#5856D6' },
                { Icon: Zap,         label: 'חדשנות',          path: '/innovation',color: '#FF9500' },
            ],
        },
        {
            title: 'שירות לקוחות',
            items: [
                { Icon: Phone,       label: 'צור קשר',         path: '/contact',   color: '#30D158' },
                {
                    Icon: MessageCircle,
                    label: 'WhatsApp',
                    path: null,
                    external: whatsappUrl,
                    color: '#25D366',
                },
            ],
        },
        {
            title: 'משפטי',
            items: [
                { Icon: Shield,      label: 'מדיניות פרטיות', path: '/privacy',   color: '#636366' },
                { Icon: FileText,    label: 'תנאי שימוש',      path: '/terms',     color: '#636366' },
            ],
        },
    ];
}

export default function MobileMenu() {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const { user, firstName, memberTier, tierLabel, tierColor, institution, openAuthModal } = useAuth();
    const { colors: c, isDark, toggle } = useTheme();
    const { cartCount }     = useCart();
    const { wishlistCount } = useWishlist();

    // Tier progress toward next level
    const TIER_ORDER = ['free', 'member', 'premium'];
    const tierIdx = TIER_ORDER.indexOf(memberTier);
    const nextTier = TIER_ORDER[tierIdx + 1];
    const nextTierLabel = nextTier ? TIER_CONFIG[nextTier]?.label : null;
    const tierProgress = tierIdx === 0 ? 12 : tierIdx === 1 ? 55 : 100;

    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');
    const phone    = getSetting('contact_phone', '058-5856356');

    const NAV_GROUPS = buildNavGroups(phone);

    const quickActions = [
        { Icon: Home,          label: 'בית',    dest: '/',          badge: null },
        { Icon: ShoppingCart,  label: 'עגלה',   dest: '/cart',      badge: cartCount    || null },
        { Icon: Heart,         label: 'מועדפים', dest: '/favorites', badge: wishlistCount || null },
        { Icon: Lock,          label: 'אדמין',   dest: '/admin',     badge: null },
    ];

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 40px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── User profile tile ──────────────────────────────────── */}
            {user ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: c.surface, borderRadius: 20, padding: '16px 18px',
                        marginBottom: 12, boxShadow: c.cardShadow,
                        border: `1px solid ${tierColor}22`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: nextTierLabel ? 14 : 0 }}>
                        {/* Avatar */}
                        <div style={{
                            width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                            background: `linear-gradient(135deg, ${tierColor}33, ${tierColor}66)`,
                            border: `2px solid ${tierColor}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 900, color: tierColor,
                        }}>
                            {(firstName || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 16, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: 2 }}>
                                {firstName || user.email}
                            </p>
                            {institution ? (
                                <p style={{ fontSize: 12, color: c.text3, fontWeight: 500, marginBottom: 2 }}>{institution}</p>
                            ) : null}
                            <span style={{
                                display: 'inline-block', fontSize: 11, fontWeight: 700,
                                color: tierColor, background: `${tierColor}18`,
                                padding: '2px 8px', borderRadius: 99,
                            }}>
                                {tierLabel}
                            </span>
                        </div>
                    </div>
                    {/* Tier progress bar toward next level */}
                    {nextTierLabel && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 11, color: c.text3, fontWeight: 600 }}>רמה נוכחית: {tierLabel}</span>
                                <span style={{ fontSize: 11, color: tierColor, fontWeight: 700 }}>הבא: {nextTierLabel}</span>
                            </div>
                            <div style={{ height: 5, background: c.divider, borderRadius: 99, overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${tierProgress}%` }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                    style={{ height: '100%', background: `linear-gradient(90deg, ${tierColor}, ${tierColor}88)`, borderRadius: 99 }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : (
                <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptic('light'); openAuthModal(); navigate('/'); }}
                    style={{
                        width: '100%', background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                        borderRadius: 16, padding: '14px 18px', marginBottom: 12,
                        border: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        fontFamily: SF,
                    }}
                >
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>התחברות / הרשמה</span>
                    <span style={{ fontSize: 20 }}>👋</span>
                </motion.button>
            )}

            {/* ── Brand header ─────────────────────────────────────────── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: c.surface, borderRadius: 20, padding: '18px 18px',
                marginBottom: 14, boxShadow: c.cardShadow,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {siteLogo ? (
                        <img src={siteLogo} alt={siteName} style={{ height: 40, objectFit: 'contain' }} />
                    ) : (
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
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
                        width: 44, height: 44, borderRadius: 12,
                        background: isDark ? 'rgba(255,204,0,0.12)' : 'rgba(0,0,0,0.06)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    }}
                    aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
                >
                    {isDark
                        ? <Sun size={18} color="#FFCC00" strokeWidth={1.9} />
                        : <Moon size={18} color={c.text} strokeWidth={1.9} />
                    }
                </motion.button>
            </div>

            {/* ── Quick-action icon row ─────────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
                marginBottom: 20,
            }}>
                {quickActions.map(({ Icon, label, dest, badge }) => (
                    <motion.button
                        key={dest}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => { haptic('select'); navigate(dest); }}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: 6, padding: '14px 8px',
                            background: c.surface, borderRadius: 18,
                            border: 'none', cursor: 'pointer',
                            boxShadow: c.cardShadow,
                            WebkitTapHighlightColor: 'transparent',
                            position: 'relative',
                        }}
                        aria-label={label}
                    >
                        <Icon size={26} color={c.text} strokeWidth={1.7} />
                        {badge != null && badge > 0 && (
                            <span style={{
                                position: 'absolute', top: 10, right: 10,
                                minWidth: 18, height: 18, borderRadius: 99,
                                background: '#FF3B30', color: '#fff',
                                fontSize: 10, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: '0 4px',
                                lineHeight: 1,
                            }}>
                                {badge > 99 ? '99+' : badge}
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* ── Nav groups ───────────────────────────────────────────── */}
            {NAV_GROUPS.map(group => (
                <div key={group.title} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: c.text3, letterSpacing: '0.04em', marginBottom: 8, padding: '0 4px' }}>
                        {group.title}
                    </p>
                    <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                        {group.items.map(({ Icon, label, path, external, color }, i) => (
                            <motion.button
                                key={path ?? external}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    haptic('select');
                                    if (external) {
                                        window.open(external, '_blank');
                                    } else {
                                        navigate(path);
                                    }
                                }}
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
                                <div style={{
                                    width: 36, height: 36, borderRadius: 11,
                                    background: `${color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={18} color={color} strokeWidth={1.9} />
                                </div>
                                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: c.text, textAlign: 'right' }}>
                                    {label}
                                </span>
                                <ChevronLeft size={16} color={c.text4} />
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Footer ───────────────────────────────────────────────── */}
            <p style={{ textAlign: 'center', fontSize: 11, color: c.text4, fontWeight: 500, marginTop: 8 }}>
                {siteName} · © 2026 · כל הזכויות שמורות
            </p>
        </div>
    );
}
