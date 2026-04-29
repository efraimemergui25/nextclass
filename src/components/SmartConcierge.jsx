/**
 * SmartConcierge — visionOS Hyper-Glass Chat Interface
 */
import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '972500000000';
const SPRING = { type: 'spring', stiffness: 320, damping: 26 };
const BUBBLE_SPRING = { type: 'spring', stiffness: 380, damping: 26 };

const AI_MAP = {
    מחיר: 'המחירים מותאמים למוסדות חינוך. אשמח לשלוח לך הצעת מחיר מדויקת — באיזה ציוד מדובר?',
    מסך: 'יש לנו מסכים אינטראקטיביים מ-65" עד 98" עם Android 13 מובנה. איזה גודל מתאים לכיתות שלכם?',
    מחשב: 'אנחנו מציעים Chromebook לתלמידים ועד תחנות עבודה למורים. כמה יחידות דרושות?',
    רובוט: 'ערכות הרובוטיקה שלנו מבוססות Arduino ומתאימות לגילאים 10+. האם מדובר במעבדת STEM חדשה?',
    אחריות: 'כל הציוד מגיע עם אחריות יבואן מלאה + חוזי שירות עם תגובה תוך 4 שעות.',
    default: 'תודה! הצוות שלנו ממתין גם בוואטסאפ לכל שאלה 👇',
};

const getReply = (text) => {
    const lower = text.toLowerCase();
    for (const [k, v] of Object.entries(AI_MAP)) {
        if (k !== 'default' && lower.includes(k)) return v;
    }
    return AI_MAP.default;
};

const Bubble = memo(({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={BUBBLE_SPRING}
            className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles size={12} className="text-white" />
                </div>
            )}
            <div
                className={`px-4 py-3 text-sm font-medium leading-relaxed max-w-[80%] shadow-sm ${isUser
                    ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm'
                    : 'bg-white/90 backdrop-blur-md border border-white/60 text-[#1D1D1F] rounded-2xl rounded-bl-sm'
                    }`}
            >
                {msg.text}
            </div>
        </motion.div>
    );
});

const TypingDots = () => (
    <div className="flex items-end gap-2 justify-start">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shrink-0">
            <Sparkles size={12} className="text-white" />
        </div>
        <div className="bg-white/90 backdrop-blur-md border border-white/60 px-5 py-3.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.65, delay: i * 0.14, repeat: Infinity }}
                />
            ))}
        </div>
    </div>
);

const SmartConcierge = () => {
    const location = useLocation();
    const isProductPage = location.pathname.startsWith('/catalog/');
    const isCartPage = location.pathname === '/cart';

    const getInitialMessage = () => {
        if (isProductPage) return 'שלום! אני רואה שאתה מתעניין בדגם הזה. יש משהו ספציפי לגבי המפרט שתרצה לדעת?';
        if (isCartPage) return 'כמעט שם! האם תרצה עזרה עם אפשרויות המשלוח או ההתקנה במוסד שלך?';
        return 'שלום! אני העוזר החכם של NextClass. איך אוכל לעזור לך היום?';
    };

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 0, role: 'ai', text: getInitialMessage() }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const rootRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) setMessages([{ id: 0, role: 'ai', text: getInitialMessage() }]);
    }, [location.pathname, isOpen]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 320); }, [isOpen]);

    const send = useCallback((text) => {
        const t = (text ?? input).trim();
        if (!t) return;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: t }]);
        setInput('');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: getReply(t) }]);
        }, 1200);
    }, [input]);

    return (
        <div ref={rootRef} className="fixed bottom-8 right-8 z-[260] flex flex-col items-end gap-3">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={SPRING}
                        className="w-[360px] h-[580px] bg-white/70 backdrop-blur-[50px] backdrop-saturate-[2] border border-white/60 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/40">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-violet-500 flex items-center justify-center shadow-lg">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-[#1D1D1F] leading-none">העוזר החכם</p>
                                    <p className="text-[10px] text-green-500 font-black mt-1 uppercase tracking-widest flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        מחובר
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-black/5 transition-colors">
                                <X size={18} className="text-[#1D1D1F]" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 no-scrollbar" dir="rtl">
                            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                            {isTyping && <TypingDots />}
                            <div ref={bottomRef} />
                        </div>

                        <div className="p-5 bg-white/60 border-t border-gray-100 flex items-center gap-2">
                            <motion.button
                                onClick={() => send()}
                                whileTap={{ scale: 0.9 }}
                                disabled={!input.trim()}
                                className="w-12 h-12 bg-black disabled:opacity-20 text-white rounded-full flex items-center justify-center shadow-xl shrink-0"
                            >
                                <ArrowUp size={20} />
                            </motion.button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && send()}
                                placeholder="כתבו הודעה..."
                                dir="rtl"
                                className="flex-1 bg-white border border-gray-100 rounded-full px-5 py-4 text-sm outline-none focus:ring-[4px] focus:ring-[#007AFF]/5 transition-all"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 rounded-full bg-black text-white shadow-2xl flex items-center px-4 overflow-hidden relative group"
                style={{ minWidth: '4rem' }}
            >
                <div className="absolute inset-0 bg-[#007AFF] opacity-0 group-hover:opacity-10 transition-opacity" />
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {isOpen ? <X key="x" size={24} /> : <Sparkles key="s" size={24} className="animate-glow-pulse" />}
                    </AnimatePresence>
                    <AnimatePresence>
                        {isHovered && !isOpen && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="text-sm font-black whitespace-nowrap"
                            >
                                זקוקים לעזרה?
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </div>
    );
};

export default memo(SmartConcierge);
