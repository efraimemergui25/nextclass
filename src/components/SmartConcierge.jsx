import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowUp, MessageCircle, Send, Plus, Minus, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Magnetic from './Magnetic';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import Anthropic from '@anthropic-ai/sdk';

const WHATSAPP_NUMBER = '972500000000'; 
const SPRING = { type: 'spring', stiffness: 350, damping: 32 };
const BUBBLE_SPRING = { type: 'spring', stiffness: 450, damping: 30 };

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || 'sk-ant-dummy-key',
    dangerouslyAllowBrowser: true // For development only! Will move to Cloud Functions later.
});



const Bubble = memo(({ msg }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={BUBBLE_SPRING}
            className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                    <Sparkles size={14} className="text-white" />
                </div>
            )}
            <div
                className={`px-5 py-3 text-[14px] font-medium leading-[1.6] max-w-[85%] relative overflow-hidden ${isUser
                    ? 'bg-[#007AFF] text-white rounded-[1.25rem] rounded-br-none shadow-md'
                    : 'bg-white/80 backdrop-blur-xl border border-white/60 text-[#1D1D1F] rounded-[1.25rem] rounded-bl-none shadow-sm'
                    }`}
            >
                {msg.text}
            </div>
        </motion.div>
    );
});

const TypingDots = () => (
    <div className="flex items-end gap-3 justify-start">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-white" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 px-5 py-4 rounded-[1.25rem] rounded-bl-none flex gap-1.5 items-center">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
            ))}
        </div>
    </div>
);

const SmartConcierge = () => {
    const { getSetting } = useSettings();
    const location = useLocation();
    const isProductPage = location.pathname.startsWith('/catalog/');
    
    const { activeProducts } = useProducts();

    const getInitialMessage = () => {
        if (isProductPage) return getSetting('ai_greeting_pd', 'שלום! האם תרצו לקבל מפרט טכני מלא או הצעת מחיר למוסד שלכם?');
        return getSetting('ai_greeting_home', 'שלום! אני הקונסיירז׳ של NextClass. איך אוכל לעזור לכם היום?');
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
    }, [location.pathname, isOpen, getSetting]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
    useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 400); }, [isOpen]);

    const send = useCallback(async (text) => {
        const t = (text ?? input).trim();
        if (!t) return;
        
        const newMessages = [...messages, { id: Date.now(), role: 'user', text: t }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        
        try {
            // Check if API key exists
            if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
                setTimeout(() => {
                    setIsTyping(false);
                    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'סליחה, אני לא מחובר לענן כרגע. יש להזין מפתח API של Claude למערכת.' }]);
                }, 1000);
                return;
            }

            // Prepare catalog context for Claude
            const catalogInfo = activeProducts.map(p => `- ${p.title} (${p.category}): ₪${p.price}. במלאי: ${p.stock > 0 ? 'כן' : 'לא'}. תיאור: ${p.description}`).join('\n');
            const systemPrompt = `You are the official Smart Concierge for "NextClass", a premium Israeli B2B company selling tech equipment to educational institutions. 
Respond in friendly, professional, sales-oriented Hebrew. Keep answers relatively brief.
Here is the live catalog data you should refer to:
${catalogInfo}`;

            // Format history for Anthropic API
            const history = newMessages
                .filter(m => m.id !== 0) // exclude initial hardcoded msg to save context length if needed, or include it
                .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

            const response = await anthropic.messages.create({
                model: "claude-sonnet-4-6",
                max_tokens: 300,
                system: systemPrompt,
                messages: history
            });

            const replyText = response.content[0].text;
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: replyText }]);
        } catch (error) {
            console.error('Claude API Error Details:', error);
            const errorMessage = error.message || JSON.stringify(error);
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `שגיאת שרת: ${errorMessage}` }]);
        }
    }, [input, messages, activeProducts]);

    const openWhatsApp = () => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=היי, אשמח להתייעץ לגבי פתרונות NextClass`, '_blank');
    };

    return (
        <div ref={rootRef} className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-5">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(20px)' }}
                        transition={SPRING}
                        className="w-[380px] h-[620px] flex flex-col overflow-hidden glass-apple rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-white/60 relative"
                    >
                        {/* Header Section — Refined & Correctly Padded */}
                        <div className="relative z-20 px-8 pt-8 pb-6 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/40">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg transform rotate-2">
                                        <Sparkles size={22} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-[16px] font-black text-[#1D1D1F] tracking-tight">{getSetting('ai_title', 'NextClass AI')}</h3>
                                    <p className="text-[9px] text-[#007AFF] font-black uppercase tracking-[0.2em] mt-0.5 opacity-70">{getSetting('ai_role', 'Institutional Concierge')}</p>
                                </div>
                            </div>
                            <Magnetic strength={0.3}>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all"
                                >
                                    <X size={18} className="text-[#1D1D1F]" />
                                </button>
                            </Magnetic>
                        </div>

                        {/* Chat History Area */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 custom-scrollbar bg-gradient-to-b from-transparent to-white/20" dir="rtl">
                            {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                            {isTyping && <TypingDots />}
                            <div ref={bottomRef} />
                        </div>

                        {/* WhatsApp Bridge — Simplified & More Elegant */}
                        <div className="relative z-20 px-6 py-4">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={openWhatsApp}
                                className="w-full group flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-white/60 hover:bg-white transition-all border border-white/80 shadow-sm backdrop-blur-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-md">
                                        <MessageCircle size={20} fill="white" strokeWidth={1} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-bold text-[#1D1D1F]">{getSetting('ai_wa_label', 'מענה אנושי בוואטסאפ')}</p>
                                        <p className="text-[10px] text-gray-500">{getSetting('ai_wa_status', 'יועץ טכנולוגי זמין כעת ✅')}</p>
                                    </div>
                                </div>
                                <ArrowUp className="rotate-90 text-[#007AFF] opacity-40 group-hover:opacity-100 transition-opacity" size={16} />
                            </motion.button>
                        </div>

                        {/* Quick Action Chips — More Minimal */}
                        <div className="relative z-20 px-6 pb-2 flex flex-wrap gap-2 justify-end" dir="rtl">
                            {[
                                getSetting('ai_chip1', 'הצעת מחיר'),
                                getSetting('ai_chip2', 'מפרט טכני'),
                                getSetting('ai_chip3', 'ייעוץ')
                            ].map(chip => (
                                <button 
                                    key={chip}
                                    onClick={() => send(chip)}
                                    className="px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/80 border border-white/60 text-[11px] font-bold text-[#1D1D1F] transition-all"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Input Footer — Refined Proportions */}
                        <div className="relative z-20 p-6 pt-2 bg-white/60 backdrop-blur-2xl border-t border-white/40">
                            <div className="relative flex items-center gap-2 bg-[#F5F5F7] rounded-2xl px-2 py-1.5 border border-white shadow-inner">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && send()}
                                    placeholder={getSetting('ai_placeholder', 'מה תרצו לבדוק?')}
                                    dir="rtl"
                                    className="flex-1 bg-transparent border-none px-3 py-2 text-[14px] font-medium outline-none placeholder:text-gray-400"
                                />
                                <Magnetic strength={0.2}>
                                    <button
                                        onClick={() => send()}
                                        disabled={!input.trim()}
                                        className="w-10 h-10 bg-[#1D1D1F] disabled:opacity-20 text-white rounded-xl flex items-center justify-center shadow-lg transition-all"
                                    >
                                        <ArrowUp size={18} strokeWidth={3} />
                                    </button>
                                </Magnetic>
                            </div>
                        </div>

                        {/* Animated Glow in background */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#007AFF]/5 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5856D6]/5 blur-3xl pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Trigger Button — Refined */}
            <motion.button
                layout
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-16 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.12)] flex items-center px-4 overflow-hidden relative group transition-all duration-500 ${isOpen ? 'bg-white' : 'bg-[#1D1D1F]'}`}
                style={{ minWidth: '4.5rem' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] to-[#5856D6] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-3 w-full justify-center">
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X size={26} className="text-[#1D1D1F]" />
                            </motion.div>
                        ) : (
                            <motion.div key="s" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="flex items-center gap-3">
                                <Sparkles size={24} className="text-white group-hover:scale-110 transition-transform duration-500" />
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex flex-col items-end pr-1"
                                    >
                                        <span className="text-[12px] font-black text-white leading-none">{getSetting('ai_fab_label', 'העוזר החכם')}</span>
                                        <span className="text-[8px] font-bold text-white/50 uppercase tracking-[0.1em] mt-1">Chat Support</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>
        </div>
    );
};

export default memo(SmartConcierge);
