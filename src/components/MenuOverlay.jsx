import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronLeft, Phone, Mail, MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// Default subtitle per nav id — overridable via CMS key `nav_[id]_sub`
const NAV_META = {
    home:     { emoji: '🏠', sub: 'חזרה לעמוד הראשי' },
    catalog:  { emoji: '🛍️', sub: 'כל הפתרונות הטכנולוגיים לחינוך' },
    compare:  { emoji: '⚖️', sub: 'השווה בין מוצרים בקלות' },
    story:    { emoji: '📖', sub: 'מי אנחנו ולמה זה חשוב' },
    vod:      { emoji: '🎬', sub: 'מדריכי וידאו ומרכז ידע חינמי' },
    magazine: { emoji: '📰', sub: 'תוכן מקצועי לאנשי חינוך' },
    contact:  { emoji: '📞', sub: 'דבר איתנו עכשיו' },
};

const SPRING = { type: 'spring', stiffness: 380, damping: 30 };

const MenuOverlay = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { getSetting } = useSettings();

    const navItems = useMemo(() => {
        const DEFAULT_ITEMS = [
            { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו', visible: true },
            { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים', visible: true },
            { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו',  visible: true },
            { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה',   visible: true },
            { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין',         visible: true },
            { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר',       visible: true },
        ];
        const saved = getSetting('nav_items', null);
        const source = Array.isArray(saved) ? saved : DEFAULT_ITEMS;
        return source
            .filter(item => item.visible !== false && item.id !== 'home')
            .map(item => ({
                id: item.id,
                name: getSetting(item.labelKey, item.defaultLabel),
                sub: getSetting(`nav_${item.id}_sub`, NAV_META[item.id]?.sub || ''),
                emoji: NAV_META[item.id]?.emoji || '→',
                path: item.path,
            }));
    }, [getSetting]);

    const siteName  = getSetting('site_name', 'NextClass');
    const siteLogo  = getSetting('site_logo_url', '');
    const phone     = getSetting('contact_phone', '03-9999999');
    const email     = getSetting('contact_email', 'info@nextclass.co.il');
    const waNumber  = getSetting('whatsapp_number', '972500000000');

    const bgStyle = {
        background: 'linear-gradient(160deg, rgba(12,14,26,0.97) 0%, rgba(18,16,40,0.98) 60%, rgba(12,20,36,0.97) 100%)',
        backdropFilter: 'blur(60px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(60px) saturate(1.6)',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 48px) 48px)' }}
                    animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 48px) 48px)' }}
                    exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 48px) 48px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={bgStyle}
                    className="fixed inset-0 z-[250] flex flex-col pointer-events-auto overflow-hidden"
                    dir="rtl"
                >
                    {/* ── Ambient glows ─────────────────────────────────────── */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.10) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(88,86,214,0.08) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

                    {/* ── Header bar ────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
                        <motion.button
                            onClick={onClose}
                            whileHover={{ scale: 1.08, rotate: 90 }}
                            whileTap={{ scale: 0.92 }}
                            transition={SPRING}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                            aria-label="סגור תפריט"
                        >
                            <X className="w-5 h-5 text-white" />
                        </motion.button>

                        <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                            {siteLogo ? (
                                <img src={siteLogo} alt={siteName} className="h-8 object-contain brightness-[10]" />
                            ) : (
                                <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
                                    <circle cx="12" cy="16" r="9" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
                                    <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.2" />
                                </svg>
                            )}
                            <span className="text-white font-black text-lg tracking-tighter">{siteName}</span>
                        </Link>
                    </div>

                    {/* ── Nav items ─────────────────────────────────────────── */}
                    <nav className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
                        {navItems.map((item, i) => {
                            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ ...SPRING, delay: 0.06 + i * 0.055 }}
                                >
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className="flex items-center gap-4 w-full p-4 rounded-2xl group transition-all duration-300"
                                        style={{
                                            background: isActive
                                                ? 'rgba(0,122,255,0.16)'
                                                : 'rgba(255,255,255,0.04)',
                                            border: isActive
                                                ? '1px solid rgba(0,122,255,0.35)'
                                                : '1px solid rgba(255,255,255,0.07)',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                    >
                                        {/* Emoji icon */}
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                            style={{
                                                background: isActive
                                                    ? 'rgba(0,122,255,0.25)'
                                                    : 'rgba(255,255,255,0.07)',
                                            }}>
                                            {item.emoji}
                                        </div>

                                        {/* Text */}
                                        <div className="flex-1 text-right">
                                            <p className={`text-lg font-black tracking-tight leading-tight ${isActive ? 'text-[#007AFF]' : 'text-white'}`}>
                                                {item.name}
                                            </p>
                                            {item.sub && (
                                                <p className="text-[12px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                                    {item.sub}
                                                </p>
                                            )}
                                        </div>

                                        <ChevronLeft size={16} className={`shrink-0 transition-all duration-300 ${isActive ? 'text-[#007AFF]' : 'text-white/20 group-hover:text-white/60 group-hover:-translate-x-1'}`} />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    {/* ── Bottom contact strip ───────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ ...SPRING, delay: 0.35 }}
                        className="shrink-0 px-6 pb-8 pt-4"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="flex items-center gap-3">
                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-black text-sm transition-all"
                                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                            >
                                <MessageCircle size={16} fill="white" strokeWidth={0} />
                                וואטסאפ
                            </a>

                            {/* Phone */}
                            <a
                                href={`tel:${phone}`}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-bold text-sm transition-all"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <Phone size={15} />
                                <span className="font-mono text-sm">{phone}</span>
                            </a>

                            {/* Mail */}
                            <a
                                href={`mailto:${email}`}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl text-white transition-all"
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                            >
                                <Mail size={16} />
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MenuOverlay;
