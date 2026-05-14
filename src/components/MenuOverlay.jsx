import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const ALL_NAV_ITEMS = [
    { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו' },
    { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים' },
    { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו'  },
    { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה'   },
    { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין'         },
    { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר'       },
];

const SPRING      = { type: 'spring', stiffness: 240, damping: 32, mass: 1.2 };
const SPRING_FAST = { type: 'spring', stiffness: 440, damping: 32, mass: 0.5 };
const SPRING_ITEM = { type: 'spring', stiffness: 350, damping: 26, mass: 0.8 };

const SF = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif`;

const MenuOverlay = ({ isOpen, onClose }) => {
    const { getSetting } = useSettings();
    const [hoveredId, setHoveredId] = useState(null);

    const navItems = useMemo(() => ALL_NAV_ITEMS.map(item => ({
        id:   item.id,
        name: getSetting(item.labelKey, item.defaultLabel),
        path: item.path,
    })), [getSetting]);

    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');
    const phone    = getSetting('contact_phone', '058-5856356');
    const anyHovered = hoveredId !== null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[250] flex flex-col"
                    dir="rtl"
                    style={{
                        background: 'rgba(244,244,248,0.92)',
                        backdropFilter: 'blur(160px) saturate(280%) brightness(1.07)',
                        WebkitBackdropFilter: 'blur(160px) saturate(280%) brightness(1.07)',
                        fontFamily: SF,
                    }}
                >
                    {/* ── Glass layers ── */}
                    <div className="absolute inset-x-0 top-0 h-[1px] pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 80%, transparent 100%)' }} />
                    <div className="absolute pointer-events-none" style={{
                        top: '-50%', right: '-18%', width: 1000, height: 1000, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,122,255,0.05) 0%, rgba(0,122,255,0.015) 42%, transparent 68%)',
                    }} />
                    <div className="absolute pointer-events-none" style={{
                        bottom: '-35%', left: '-18%', width: 850, height: 850, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(88,86,214,0.042) 0%, transparent 62%)',
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse 88% 70% at 50% 46%, rgba(255,255,255,0.62) 0%, transparent 100%)',
                    }} />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.02, mixBlendMode: 'overlay' }}>
                        <filter id="nc-grain">
                            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
                            <feColorMatrix type="saturate" values="0" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#nc-grain)" />
                    </svg>

                    {/* ── Top bar ── */}
                    <div className="relative z-10 flex items-center justify-between px-8 sm:px-12 pt-8 shrink-0">
                        <motion.button
                            onClick={onClose}
                            initial={{ opacity: 0, rotate: -90, scale: 0.45 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.45, transition: { duration: 0.16 } }}
                            whileHover={{ scale: 1.12, rotate: 90 }}
                            whileTap={{ scale: 0.84 }}
                            transition={{ ...SPRING_FAST, delay: 0.05 }}
                            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                            style={{
                                background: 'rgba(255,255,255,0.85)',
                                border: '1px solid rgba(0,0,0,0.075)',
                                boxShadow: '0 2px 18px rgba(0,0,0,0.065), inset 0 1px 0 rgba(255,255,255,1)',
                                backdropFilter: 'blur(28px)',
                                WebkitBackdropFilter: 'blur(28px)',
                            }}
                            aria-label="סגור"
                        >
                            <X className="w-[14px] h-[14px]" style={{ color: '#1D1D1F', strokeWidth: 2.6 }} />
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 18, transition: { duration: 0.16 } }}
                            transition={{ ...SPRING, delay: 0.07 }}
                        >
                            <Link to="/" onClick={onClose}
                                className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-40"
                            >
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-7 object-contain" />
                                ) : (
                                    <>
                                        <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                                            <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="1.8" />
                                            <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="1.8" fill="#007AFF" fillOpacity="0.13" />
                                        </svg>
                                        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.04em', color: '#1D1D1F' }}>
                                            {siteName}
                                        </span>
                                    </>
                                )}
                            </Link>
                        </motion.div>
                    </div>

                    {/* ── Nav items ── */}
                    <nav className="relative z-10 flex-1 flex flex-col items-center justify-center"
                        style={{ gap: 'clamp(2px, 0.6vh, 6px)' }}>
                        {navItems.map((item, i) => {
                            const isHovered = hoveredId === item.id;
                            const isDimmed  = anyHovered && !isHovered;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 48, filter: 'blur(16px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{
                                        opacity: 0,
                                        y: 26,
                                        filter: 'blur(8px)',
                                        transition: {
                                            duration: 0.26,
                                            delay: (navItems.length - 1 - i) * 0.03,
                                            ease: [0.55, 0, 1, 0.45],
                                        },
                                    }}
                                    transition={{ ...SPRING, delay: 0.08 + i * 0.075 }}
                                    className="w-full text-center relative"
                                    onHoverStart={() => setHoveredId(item.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                >
                                    {/* Per-item ambient glow */}
                                    <motion.div
                                        className="absolute inset-0 pointer-events-none"
                                        animate={{ opacity: isHovered ? 1 : 0 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        style={{
                                            background: 'radial-gradient(ellipse 70% 100% at 50% 50%, rgba(0,122,255,0.07) 0%, transparent 72%)',
                                            filter: 'blur(2px)',
                                        }}
                                    />

                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className="block select-none relative"
                                        style={{
                                            padding: 'clamp(6px, 1.1vh, 14px) 3rem',
                                            WebkitTapHighlightColor: 'transparent',
                                        }}
                                    >
                                        <motion.span
                                            animate={{
                                                opacity: isDimmed ? 0.12 : 1,
                                                y: isHovered ? -4 : 0,
                                                scale: isHovered ? 1.025 : 1,
                                            }}
                                            transition={SPRING_ITEM}
                                            className="block leading-[1]"
                                            style={{
                                                fontWeight: 700,
                                                letterSpacing: isHovered ? '-0.02em' : '-0.035em',
                                                fontSize: 'clamp(1.85rem, 4.8vw, 3.35rem)',
                                                fontStyle: isHovered ? 'italic' : 'normal',
                                                color: isHovered ? '#007AFF' : 'rgba(0,0,0,0.82)',
                                                transition: 'color 0.22s ease, font-style 0s, letter-spacing 0.22s ease',
                                                WebkitFontSmoothing: 'antialiased',
                                                MozOsxFontSmoothing: 'grayscale',
                                                textRendering: 'optimizeLegibility',
                                                willChange: 'transform, opacity',
                                            }}
                                        >
                                            {item.name}
                                        </motion.span>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* ── Footer ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.52, duration: 0.45 }}
                        className="relative z-10 shrink-0 flex items-center justify-center"
                        style={{
                            paddingBottom: 'clamp(24px, 4vh, 44px)',
                            paddingTop: '14px',
                            gap: '10px',
                        }}
                    >
                        <span style={{
                            fontSize: '11px', fontWeight: 500,
                            color: 'rgba(0,0,0,0.22)', letterSpacing: '0.04em',
                            fontFamily: SF, direction: 'ltr',
                        }}>
                            {phone}
                        </span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(0,0,0,0.18)', display: 'inline-block', flexShrink: 0 }} />
                        <span style={{
                            fontSize: '10.5px', fontWeight: 800,
                            color: 'rgba(0,0,0,0.18)', letterSpacing: '0.18em',
                            fontFamily: SF,
                        }}>
                            NEXTCLASS
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
