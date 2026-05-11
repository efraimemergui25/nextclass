import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronLeft, Phone, Mail, MessageCircle, ShoppingBag, BarChart2, BookOpen, PlayCircle, Newspaper, HeadphonesIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const NAV_META = {
    home:     { icon: null,           sub: 'חזרה לעמוד הראשי',                  color: '#6e6e73' },
    catalog:  { icon: ShoppingBag,    sub: 'כל הפתרונות הטכנולוגיים לחינוך',    color: '#007AFF' },
    compare:  { icon: BarChart2,      sub: 'השווה בין מוצרים בקלות',            color: '#5856D6' },
    story:    { icon: BookOpen,       sub: 'מי אנחנו ולמה זה חשוב',             color: '#FF9F0A' },
    vod:      { icon: PlayCircle,     sub: 'מדריכי וידאו ומרכז ידע חינמי',      color: '#FF375F' },
    magazine: { icon: Newspaper,      sub: 'תוכן מקצועי לאנשי חינוך',           color: '#34C759' },
    contact:  { icon: HeadphonesIcon, sub: 'דבר איתנו עכשיו',                   color: '#FF9F0A' },
};

// All nav destinations — always show in mobile overlay
const ALL_NAV_ITEMS = [
    { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו' },
    { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים' },
    { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו'  },
    { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה'   },
    { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין'         },
    { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר'       },
];

const SPRING = { type: 'spring', stiffness: 380, damping: 30 };

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { getSetting } = useSettings();

    const navItems = useMemo(() => ALL_NAV_ITEMS.map(item => ({
        id:    item.id,
        name:  getSetting(item.labelKey, item.defaultLabel),
        sub:   getSetting(`nav_${item.id}_sub`, NAV_META[item.id]?.sub || ''),
        icon:  NAV_META[item.id]?.icon || null,
        color: NAV_META[item.id]?.color || '#007AFF',
        path:  item.path,
    })), [getSetting]);

    const siteName = getSetting('site_name', 'NextClass');
    const siteLogo = getSetting('site_logo_url', '');
    const phone    = getSetting('contact_phone', '058-5856356');
    const email    = getSetting('contact_email', 'nextclass.en@gmail.com');
    const waNumber = getSetting('whatsapp_number', '972585856356');

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 52px) 52px)' }}
                    animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 52px) 52px)' }}
                    exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 52px) 52px)' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[250] flex flex-col pointer-events-auto overflow-hidden"
                    style={{
                        background: 'rgba(248,248,250,0.92)',
                        backdropFilter: 'blur(56px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(56px) saturate(200%)',
                    }}
                    dir="rtl"
                >
                    {/* Ambient glows */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.07) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                    <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(88,86,214,0.05) 0%, transparent 70%)', transform: 'translate(-20%,20%)' }} />

                    {/* ── Header ──────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-5 shrink-0"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>

                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.08, rotate: 90 }}
                            whileTap={{ scale: 0.92 }}
                            transition={SPRING}
                            className="w-10 h-10 rounded-2xl bg-black/[0.06] flex items-center justify-center cursor-pointer"
                            aria-label="סגור תפריט"
                        >
                            <X className="w-4 h-4 text-[#1D1D1F]" />
                        </motion.button>

                        <Link to="/" onClick={onClose} className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-7 object-contain" />
                            ) : (
                                <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                                    <circle cx="12" cy="16" r="9" stroke="#AEAEB2" strokeWidth="2" />
                                    <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.18" />
                                </svg>
                            )}
                            <span className="text-[#1D1D1F] font-black text-[17px] tracking-tighter">{siteName}</span>
                        </Link>
                    </div>

                    {/* ── Nav items ───────────────────────────────────── */}
                    <nav className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1.5">
                        {navItems.map((item, i) => {
                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 12 }}
                                    transition={{ ...SPRING, delay: 0.05 + i * 0.045 }}
                                >
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className="flex items-center gap-3.5 w-full px-4 py-3.5 rounded-2xl group transition-all duration-200"
                                        style={{
                                            background: isActive ? `${item.color}12` : 'transparent',
                                            border: isActive ? `1px solid ${item.color}28` : '1px solid transparent',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        {/* Icon pill */}
                                        {Icon && (
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: isActive ? `${item.color}18` : 'rgba(0,0,0,0.05)' }}>
                                                <Icon size={18} style={{ color: isActive ? item.color : '#86868B' }} />
                                            </div>
                                        )}

                                        {/* Text */}
                                        <div className="flex-1 text-right">
                                            <p className="text-[16px] font-black tracking-tight leading-tight"
                                                style={{ color: isActive ? item.color : '#1D1D1F' }}>
                                                {item.name}
                                            </p>
                                            {item.sub && (
                                                <p className="text-[11px] font-medium mt-0.5 text-[#86868B]">
                                                    {item.sub}
                                                </p>
                                            )}
                                        </div>

                                        <ChevronLeft size={14} className="shrink-0 transition-all duration-200"
                                            style={{ color: isActive ? item.color : '#AEAEB2' }} />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* ── Bottom contact strip ────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ ...SPRING, delay: 0.3 }}
                        className="shrink-0 px-5 pb-8 pt-4"
                        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                    >
                        <div className="flex items-center gap-2.5">
                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-black text-[13px] transition-all active:scale-[0.97]"
                                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                            >
                                <MessageCircle size={15} fill="white" strokeWidth={0} />
                                וואטסאפ
                            </a>

                            {/* Phone */}
                            <a
                                href={`tel:${phone}`}
                                className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-2xl font-bold text-[13px] text-[#1D1D1F] transition-all active:scale-[0.97]"
                                style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.07)' }}
                            >
                                <Phone size={14} className="text-[#007AFF]" />
                                <span dir="ltr" className="font-mono text-[12px]">{phone}</span>
                            </a>

                            {/* Mail */}
                            <a
                                href={`mailto:${email}`}
                                className="w-11 h-11 flex items-center justify-center rounded-2xl transition-all active:scale-[0.97]"
                                style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.07)' }}
                            >
                                <Mail size={15} className="text-[#007AFF]" />
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
