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

const SPRING      = { type: 'spring', stiffness: 260, damping: 34, mass: 1.1 };
const SPRING_FAST = { type: 'spring', stiffness: 460, damping: 34, mass: 0.55 };

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
    const anyHovered = hoveredId !== null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[250] flex flex-col"
                    dir="rtl"
                    style={{
                        background: 'rgba(246,246,250,0.9)',
                        backdropFilter: 'blur(140px) saturate(260%) brightness(1.06)',
                        WebkitBackdropFilter: 'blur(140px) saturate(260%) brightness(1.06)',
                        fontFamily: SF,
                    }}
                >
                    {/* ── Glass depth layers ── */}
                    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 25%, rgba(255,255,255,1) 75%, transparent 100%)' }} />
                    <div className="absolute inset-x-0 bottom-0 h-px pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.6) 70%, transparent 100%)' }} />

                    {/* Ambient glows */}
                    <div className="absolute pointer-events-none" style={{
                        top: '-35%', right: '-12%', width: 900, height: 900, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,122,255,0.055) 0%, rgba(0,122,255,0.018) 40%, transparent 68%)',
                    }} />
                    <div className="absolute pointer-events-none" style={{
                        bottom: '-28%', left: '-12%', width: 750, height: 750, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(88,86,214,0.048) 0%, transparent 62%)',
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(ellipse 85% 65% at 50% 48%, rgba(255,255,255,0.55) 0%, transparent 100%)',
                    }} />

                    {/* Grain texture */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.022, mixBlendMode: 'overlay' }}>
                        <filter id="nc-grain">
                            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
                            <feColorMatrix type="saturate" values="0" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#nc-grain)" />
                    </svg>

                    {/* ── Top bar ── */}
                    <div className="relative z-10 flex items-center justify-between px-7 sm:px-10 pt-7 shrink-0">
                        {/* Close button */}
                        <motion.button
                            onClick={onClose}
                            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.5, transition: { duration: 0.18 } }}
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.86 }}
                            transition={{ ...SPRING_FAST, delay: 0.06 }}
                            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                            style={{
                                background: 'rgba(255,255,255,0.82)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 2px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,1)',
                                backdropFilter: 'blur(24px)',
                                WebkitBackdropFilter: 'blur(24px)',
                            }}
                            aria-label="סגור"
                        >
                            <X className="w-[15px] h-[15px]" style={{ color: '#1D1D1F', strokeWidth: 2.5 }} />
                        </motion.button>

                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 16, transition: { duration: 0.18 } }}
                            transition={{ ...SPRING, delay: 0.08 }}
                        >
                            <Link to="/" onClick={onClose}
                                className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-45"
                            >
                                {siteLogo ? (
                                    <img src={siteLogo} alt={siteName} className="h-8 object-contain" />
                                ) : (
                                    <>
                                        <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                                            <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="1.8" />
                                            <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="1.8" fill="#007AFF" fillOpacity="0.13" />
                                        </svg>
                                        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.04em', color: '#1D1D1F' }}>
                                            {siteName}
                                        </span>
                                    </>
                                )}
                            </Link>
                        </motion.div>
                    </div>

                    {/* ── Nav items ── */}
                    <nav className="relative z-10 flex-1 flex flex-col items-center justify-center gap-0 pb-4">
                        {navItems.map((item, i) => {
                            const isHovered = hoveredId === item.id;
                            const isDimmed  = anyHovered && !isHovered;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 44, filter: 'blur(14px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{
                                        opacity: 0,
                                        y: 22,
                                        filter: 'blur(7px)',
                                        transition: {
                                            duration: 0.24,
                                            delay: (navItems.length - 1 - i) * 0.028,
                                            ease: [0.55, 0, 1, 0.45],
                                        },
                                    }}
                                    transition={{ ...SPRING, delay: 0.1 + i * 0.072 }}
                                    className="relative w-full text-center"
                                    onHoverStart={() => setHoveredId(item.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                >
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className="group block px-10 sm:px-16 py-1 sm:py-1.5 select-none"
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        {/* Index number */}
                                        <motion.span
                                            animate={{ opacity: isHovered ? 0.45 : 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="absolute right-8 sm:right-16 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums"
                                            style={{ color: '#1D1D1F', letterSpacing: '0.04em' }}
                                        >
                                            {String(i + 1).padStart(2, '0')}
                                        </motion.span>

                                        <motion.span
                                            animate={{
                                                opacity: isDimmed ? 0.14 : 1,
                                                y: isHovered ? -3 : 0,
                                            }}
                                            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                                            className="block leading-none"
                                            style={{
                                                fontWeight: 650,
                                                letterSpacing: '-0.042em',
                                                fontSize: 'clamp(2rem, 5.6vw, 3.8rem)',
                                                color: isHovered ? '#1D1D1F' : 'rgba(0,0,0,0.52)',
                                                transition: 'color 0.28s ease',
                                                willChange: 'transform, opacity',
                                            }}
                                        >
                                            {item.name}
                                        </motion.span>

                                        {/* Hover underline */}
                                        <motion.span
                                            animate={{
                                                scaleX: isHovered ? 1 : 0,
                                                opacity: isHovered ? 1 : 0,
                                            }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-12 rounded-full origin-center"
                                            style={{ background: 'rgba(0,0,0,0.18)' }}
                                        />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
