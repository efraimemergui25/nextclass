/**
 * SmartConcierge — visionOS Hyper-Glass Chat Interface
 *
 * 3-zone Flexbox layout:
 *  ┌─ Header (logo + wa escalation + close) ─┐
 *  ├─ Messages (flex-1, overflow-y-auto) ─────┤
 *  ├─ Prompt chips (scroll-x) ────────────────┤
 *  └─ Input footer (sticky) ─────────────────┘
 */
import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowUp } from 'lucide-react';

const WHATSAPP_NUMBER = '972500000000'; // ← replace with real number
const PHONE_NUMBER = 'tel:+972500000000';

const SPRING = { type: 'spring', stiffness: 320, damping: 26 };
const BUBBLE_SPRING = { type: 'spring', stiffness: 380, damping: 26 };

// ─── Keyword AI brain ─────────────────────────────────────────────────────────
const AI_MAP = {
    מחיר: 'המחירים מותאמים למוסדות חינוך. אשמח לשלוח לך הצעת מחיר מדויקת — באיזה ציוד מדובר?',
    מסך: 'יש לנו מסכים אינטראקטיביים מ-65" עד 98" עם Android 13 מובנה. איזה גודל מתאים לכיתות שלכם?',
    מחשב: 'אנחנו מציעים Chromebook לתלמידים ועד תחנות עבודה למורים. כמה יחידות דרושות?',
    רובוט: 'ערכות הרובוטיקה שלנו מבוססות Arduino ומתאימות לגילאים 10+. האם מדובר במעבדת STEM חדשה?',
    אחריות: 'כל הציוד מגיע עם אחריות יבואן מלאה + חוזי שירות עם תגובה תוך 4 שעות.',
    הצעה: 'בשמחה! לאיזה סוג מוסד? (בי"ס יסודי / תיכון / מכללה) וכמה כיתות?',
    ייעוץ: 'כמובן! ספרו לי על הצרכים שלכם — מה מחפשים לשדרג במרחב הלמידה?',
    default: 'תודה! הצוות שלנו ממתין גם בוואטסאפ לכל שאלה 👇',
};

const getReply = (text) => {
    const lower = text.toLowerCase();
    for (const [k, v] of Object.entries(AI_MAP)) {
        if (k !== 'default' && lower.includes(k)) return v;
    }
    return AI_MAP.default;
};

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
const WaIcon = ({ size = 14 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className="fill-[#25D366] shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// ─── iMessage-style bubble ────────────────────────────────────────────────────
const Bubble = memo(({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={BUBBLE_SPRING}
            className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {/* AI avatar */}
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={11} className="text-white" />
                </div>
            )}

            <div
                className={`px-4 py-3 text-sm leading-relaxed max-w-[80%] shadow-sm ${isUser
                    ? 'bg-gradient-to-r from-[#007AFF] to-[#0056B3] text-white rounded-2xl rounded-br-sm'
                    : 'bg-white/80 backdrop-blur-sm border border-white/60 text-[#1D1D1F] rounded-2xl rounded-bl-sm'
                    }`}
            >
                {msg.text}
            </div>
        </motion.div>
    );
});
Bubble.displayName = 'Bubble';

// ─── Typing dots ──────────────────────────────────────────────────────────────
const TypingDots = () => (
    <div className="flex items-end gap-2 justify-start">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shrink-0">
            <Sparkles size={11} className="text-white" />
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 px-5 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.65, delay: i * 0.14, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    </div>
);

// ─── Prompt chips ─────────────────────────────────────────────────────────────
const PROMPTS = [
    { label: 'מחירים ומבצעים', icon: '₪' },
    { label: 'ייעוץ מסכים', icon: '▢' },
    { label: 'הצעת מחיר מוסדית', icon: '≡' },
    { label: 'אחריות ושירות', icon: '◇' },
    { label: 'מחשבים לתלמידים', icon: '□' },
    { label: 'רובוטיקה STEM', icon: '△' },
];

// ─── SmartConcierge ───────────────────────────────────────────────────────────
const SmartConcierge = () => {
    const INIT = { id: 0, role: 'ai', text: 'שלום! אני העוזר החכם של NextClass. איך אוכל לעזור לך היום?' };

    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([INIT]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const rootRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Click-outside close
    useEffect(() => {
        if (!isOpen) return;
        const fn = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    // Focus input on open
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 320); }, [isOpen]);

    const toggle = useCallback(() => setIsOpen(v => !v), []);
    const hoverIn = useCallback(() => { if (!isOpen) setIsHovered(true); }, [isOpen]);
    const hoverOut = useCallback(() => setIsHovered(false), []);

    const send = useCallback((text) => {
        const t = (text ?? input).trim();
        if (!t) return;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: t }]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: getReply(t) }]);
        }, 1100);
    }, [input]);

    const handleKey = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    }, [send]);

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('שלום, אני מעוניין בהתייעצות לגבי מוצרי NextClass')}`;

    return (
        <div ref={rootRef} className="fixed bottom-6 right-6 z-[260] flex flex-col items-end gap-3">

            {/* ═══════════════════ CHAT MODAL ═══════════════════════════════ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.94 }}
                        whileHover={{ y: -2, boxShadow: '0_28px_70px_rgba(0,0,0,0.16)' }}
                        transition={SPRING}
                        className="w-[360px] h-[560px] bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.8] border border-gray-200/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col"
                    >
                        {/* ── Zone 1: Header ──────────────────────────────── */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/40 bg-white/60 backdrop-blur-md shrink-0">
                            {/* NextClass identity (RTL right) */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shadow-md">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-[#1D1D1F] leading-none">העוזר החכם</p>
                                    <p className="text-[10px] text-[#34C759] font-bold flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse block" />
                                        מחובר עכשיו
                                    </p>
                                </div>
                            </div>

                            {/* Right controls (RTL left side) */}
                            <div className="flex items-center gap-2">
                                {/* WhatsApp escalation */}
                                <motion.a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] px-3 py-1.5 rounded-full font-bold transition-colors text-xs"
                                >
                                    <WaIcon size={12} />
                                    נציג
                                </motion.a>

                                {/* Close */}
                                <motion.button
                                    onClick={toggle}
                                    whileTap={{ scale: 0.90 }}
                                    className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                                    aria-label="סגור"
                                >
                                    <X size={14} className="text-[#1D1D1F]" />
                                </motion.button>
                            </div>
                        </div>

                        {/* ── Zone 2: Message History ──────────────────────── */}
                        <div
                            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-transparent"
                            dir="rtl"
                            style={{ scrollbarWidth: 'none' }}
                        >
                            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                            {isTyping && <TypingDots />}
                            <div ref={bottomRef} />
                        </div>

                        {/* ── Zone 2b: Prompt Chips (scroll-x) ────────────── */}
                        <div
                            className="flex overflow-x-auto gap-2 pb-2.5 pt-1 px-4 shrink-0 snap-x"
                            dir="rtl"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {PROMPTS.map(({ label, icon }) => (
                                <motion.button
                                    key={label}
                                    onClick={() => send(label)}
                                    whileTap={{ scale: 0.97 }}
                                    className="whitespace-nowrap bg-white/80 hover:bg-white border border-gray-200/70 hover:border-[#007AFF]/20 text-[#1D1D1F] text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all duration-200 snap-center flex items-center gap-1.5 shrink-0 shadow-sm"
                                >
                                    <span>{icon}</span>
                                    {label}
                                </motion.button>
                            ))}
                        </div>

                        {/* ── Zone 3: Sticky Input Area ────────────────────── */}
                        <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-200/40 flex items-center gap-2 shrink-0">
                            <motion.button
                                onClick={() => send()}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                                disabled={!input.trim()}
                                className="w-10 h-10 bg-[#007AFF] disabled:opacity-35 disabled:pointer-events-none text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgb(0_122_255/0.35)] hover:shadow-[0_6px_20px_rgb(0_122_255/0.45)] transition-shadow shrink-0"
                                aria-label="שלח"
                            >
                                <ArrowUp size={17} />
                            </motion.button>

                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="כתוב הודעה..."
                                dir="rtl"
                                className="flex-1 bg-white/80 border border-gray-200/80 focus:border-[#007AFF]/40 focus:ring-2 focus:ring-[#007AFF]/15 text-[#1D1D1F] px-4 py-3 rounded-full text-sm outline-none transition-all shadow-sm placeholder-gray-400"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════ TRIGGER BUTTON ══════════════════════════ */}
            {/* Two-layer: outer motion.div owns the width/shape, inner button owns tap */}
            <motion.div
                layout
                onHoverStart={hoverIn}
                onHoverEnd={hoverOut}
                transition={{ layout: { type: 'spring', stiffness: 420, damping: 32 } }}
                className="h-16 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 shadow-[0_10px_40px_rgb(0_122_255/0.4)] flex items-center overflow-hidden cursor-pointer will-change-transform"
                style={{
                    minWidth: '4rem',
                    paddingLeft: isHovered && !isOpen ? '20px' : '16px',
                    paddingRight: isHovered && !isOpen ? '20px' : '16px',
                }}
            >
                <motion.button
                    onClick={toggle}
                    whileTap={{ scale: 0.9, filter: 'brightness(0.88)' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    aria-label="יועץ חכם"
                    aria-expanded={isOpen}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.span key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.16 }} className="shrink-0">
                                <X size={22} className="text-white" />
                            </motion.span>
                        ) : (
                            <motion.span key="spark" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.16 }} className="shrink-0">
                                <Sparkles size={24} className="text-white" />
                            </motion.span>
                        )}
                    </AnimatePresence>

                    {/* Hover label — AnimatePresence mounts it, layout makes the div grow */}
                    <AnimatePresence>
                        {isHovered && !isOpen && (
                            <motion.span
                                key="label"
                                initial={{ opacity: 0, maxWidth: 0 }}
                                animate={{ opacity: 1, maxWidth: 180 }}
                                exit={{ opacity: 0, maxWidth: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className="text-sm font-bold text-white whitespace-nowrap overflow-hidden"
                            >
                                צריכים התייעצות?
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default memo(SmartConcierge);
