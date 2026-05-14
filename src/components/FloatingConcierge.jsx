import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, X } from 'lucide-react';

const WHATSAPP_NUMBER = '972585856356';
const PHONE_NUMBER = 'tel:+972585856356';

const spring = { type: 'spring', stiffness: 300, damping: 25 };

function readContent() {
    try {
        const s = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
        return {
            pillLabel: s.concierge_label || 'צריכים התייעצות?',
            header: s.concierge_header || 'דברו איתנו',
            waNumber: s.whatsapp_number || '972585856356',
            waLabel: s.whatsapp_label || 'וואטסאפ',
            waSub: s.whatsapp_sub || 'מענה מהיר עד שעה',
            phone: s.phone_number || '058-5856356',
            phoneLabel: s.phone_label || 'שיחה עם מומחה',
            phoneSub: s.phone_sub || 'זמין א׳–ה׳, 9:00–18:00',
            visWa: s.vis_whatsapp !== undefined ? s.vis_whatsapp : true,
            visPhone: s.vis_phone !== undefined ? s.vis_phone : true
        };
    } catch { return {}; }
}

const FloatingConcierge = () => {
    const [content, setContent] = useState(readContent);
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Subscribe to content changes
    useEffect(() => {
        const onStorage = (e) => { if (e.key === 'nextclass_content') setContent(readContent()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Close popover when clicking outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
    const onHoverStart = useCallback(() => { if (!isOpen) setIsHovered(true); }, [isOpen]);
    const onHoverEnd = useCallback(() => setIsHovered(false), []);

    const whatsappUrl = `https://wa.me/${content.waNumber}?text=${encodeURIComponent('שלום, אני מעוניין בהתייעצות לגבי מוצרי NextClass')}`;
    const phoneUrl = `tel:${content.phone.replace(/-/g, '')}`;

    return (
        <div ref={ref} className="fixed bottom-6 right-6 z-[250] flex flex-col items-end gap-3">

            {/* ─── Popover Menu ─────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        transition={spring}
                        className="bg-white/70 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/80 shadow-[0_10px_40px_rgb(0_0_0/0.12)] rounded-2xl p-2 flex flex-col gap-1.5 min-w-[200px]"
                    >
                        {/* Header label */}
                        <p className="text-[11px] font-bold text-[#86868B] tracking-widest px-3 pt-1.5 pb-0.5 text-right">
                            {content.header}
                        </p>

                        {/* Option 1 — Call */}
                        {content.visPhone && (
                            <a
                                href={phoneUrl}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#007AFF]/8 transition-all duration-200 group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#007AFF]/10 flex items-center justify-center shrink-0 group-hover:bg-[#007AFF]/20 transition-colors">
                                    <Phone size={17} className="text-[#007AFF]" />
                                </div>
                                <div className="text-right flex-1">
                                    <span className="block text-sm font-bold text-[#1D1D1F] leading-tight">{content.phoneLabel}</span>
                                    <span className="block text-[11px] text-[#86868B]">{content.phoneSub}</span>
                                </div>
                            </a>
                        )}

                        {/* Divider */}
                        {content.visPhone && content.visWa && <div className="mx-3 border-t border-gray-100" />}

                        {/* Option 2 — WhatsApp */}
                        {content.visWa && (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#25D366]/8 transition-all duration-200 group"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
                                    {/* WhatsApp icon via SVG */}
                                    <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-[#25D366]">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <div className="text-right flex-1">
                                    <span className="block text-sm font-bold text-[#1D1D1F] leading-tight">{content.waLabel}</span>
                                    <span className="block text-[11px] text-[#86868B]">{content.waSub}</span>
                                </div>
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Main Trigger Pill ────────────────────────────────────── */}
            <motion.button
                onHoverStart={onHoverStart}
                onHoverEnd={onHoverEnd}
                onClick={toggleOpen}
                whileTap={{ scale: 0.94 }}
                animate={{
                    width: isHovered && !isOpen ? 'auto' : '3.5rem',
                    paddingLeft: isHovered && !isOpen ? '20px' : '0px',
                    paddingRight: isHovered && !isOpen ? '20px' : '0px',
                }}
                transition={spring}
                className="h-14 rounded-full flex items-center justify-center gap-2.5 bg-white/70 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/80 shadow-[0_10px_40px_rgb(0_0_0/0.12)] cursor-pointer overflow-hidden focus:outline-none will-change-transform"
                aria-label="פתח תמיכה"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                        >
                            <X size={22} className="text-[#1D1D1F]" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="msg"
                            initial={{ opacity: 0, rotate: 90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: -90 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                        >
                            <MessageSquare size={22} className="text-[#007AFF]" />
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Hover label — hidden when closed */}
                <AnimatePresence>
                    {isHovered && !isOpen && (
                        <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={spring}
                            className="text-sm font-bold text-[#1D1D1F] whitespace-nowrap overflow-hidden"
                        >
                            {content.pillLabel}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default memo(FloatingConcierge);
