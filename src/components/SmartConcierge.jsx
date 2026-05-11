import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, ArrowUp, MessageCircle,
    Type, Contrast, Eye, MousePointer2, Link as LinkIcon,
    RotateCcw, Check, Accessibility
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Magnetic from './Magnetic';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';
import Anthropic from '@anthropic-ai/sdk';

const WHATSAPP_NUMBER = '972500000000';
const SPRING = { type: 'spring', stiffness: 350, damping: 32 };
const BUBBLE_SPRING = { type: 'spring', stiffness: 450, damping: 30 };

const anthropic = new Anthropic({
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || 'sk-ant-dummy-key',
    dangerouslyAllowBrowser: true
});

// ── Accessibility helpers ────────────────────────────────────────────────────
const DEFAULT_A11Y = {
    fontSize: 100,
    highContrast: false,
    grayscale: false,
    invert: false,
    underlineLinks: false,
    readableFont: false,
    bigCursor: false,
};

function applyA11yToDOM(s) {
    const root = document.documentElement;
    root.style.fontSize = `${(s.fontSize / 100) * 16}px`;
    let filter = '';
    if (s.grayscale) filter += 'grayscale(100%) ';
    if (s.invert) filter += 'invert(100%) ';
    root.style.filter = filter.trim();
    root.classList.toggle('high-contrast', !!s.highContrast);
    root.classList.toggle('underline-links', !!s.underlineLinks);
    root.classList.toggle('readable-font', !!s.readableFont);
    root.classList.toggle('big-cursor', !!s.bigCursor);
}

const A11yOption = memo(({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
            active
                ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/60 border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-white'
        }`}
    >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
            {active ? <Check size={14} /> : icon}
        </div>
        <span className="text-[10px] font-black tracking-tight leading-tight text-center">{label}</span>
    </button>
));

// ── Chat sub-components ──────────────────────────────────────────────────────
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
            <div className={`px-5 py-3 text-[14px] font-medium leading-[1.6] max-w-[85%] relative overflow-hidden ${
                isUser
                    ? 'bg-[#007AFF] text-white rounded-[1.25rem] rounded-br-none shadow-md'
                    : 'text-[#1D1D1F] rounded-[1.25rem] rounded-bl-none'
            }`}
            style={!isUser ? { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : {}}
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
        <div className="px-5 py-4 rounded-[1.25rem] rounded-bl-none flex gap-1.5 items-center" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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

// ── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
    { id: 'chat',          label: 'צ׳אט',    Icon: Sparkles },
    { id: 'accessibility', label: 'נגישות',  Icon: Accessibility },
    { id: 'whatsapp',      label: 'וואטסאפ', Icon: MessageCircle },
];

// ── Main component ───────────────────────────────────────────────────────────
const SmartConcierge = () => {
    const { getSetting } = useSettings();
    const location = useLocation();
    const isProductPage = location.pathname.startsWith('/catalog/');
    const { activeProducts } = useProducts();

    const getInitialMessage = useCallback(() => {
        if (isProductPage) return getSetting('ai_greeting_pd', 'שלום! האם תרצו לקבל מפרט טכני מלא או הצעת מחיר למוסד שלכם?');
        return getSetting('ai_greeting_home', 'שלום! אני הקונסיירז׳ של NextClass. איך אוכל לעזור לכם היום?');
    }, [isProductPage, getSetting]);

    // Chat state
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    const [messages, setMessages] = useState([{ id: 0, role: 'ai', text: getInitialMessage() }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const rootRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Accessibility state
    const [a11y, setA11y] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nextclass_accessibility') || 'null') || DEFAULT_A11Y; }
        catch { return DEFAULT_A11Y; }
    });

    useEffect(() => {
        localStorage.setItem('nextclass_accessibility', JSON.stringify(a11y));
        applyA11yToDOM(a11y);
    }, [a11y]);

    const toggleA11y = useCallback((key) => setA11y(p => ({ ...p, [key]: !p[key] })), []);
    const updateFontSize = useCallback((delta) => setA11y(p => ({ ...p, fontSize: Math.min(Math.max(p.fontSize + delta, 80), 150) })), []);
    const resetA11y = useCallback(() => setA11y(DEFAULT_A11Y), []);

    // Chat effects
    useEffect(() => {
        if (!isOpen) {
            setMessages([{ id: 0, role: 'ai', text: getInitialMessage() }]);
            setActiveTab('chat');
        }
    }, [location.pathname, isOpen]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
    useEffect(() => {
        if (isOpen && activeTab === 'chat') setTimeout(() => inputRef.current?.focus(), 400);
    }, [isOpen, activeTab]);

    const send = useCallback(async (text) => {
        const t = (text ?? input).trim();
        if (!t) return;
        const newMessages = [...messages, { id: Date.now(), role: 'user', text: t }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        try {
            if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
                setTimeout(() => {
                    setIsTyping(false);
                    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'סליחה, אני לא מחובר לענן כרגע. יש להזין מפתח API של Claude למערכת.' }]);
                }, 1000);
                return;
            }
            const catalogInfo = activeProducts.map(p =>
                `- ${p.title} (${p.category}): ₪${p.price}. במלאי: ${p.stock > 0 ? 'כן' : 'לא'}. תיאור: ${p.description}`
            ).join('\n');
            const systemPrompt = `You are the official Smart Concierge for "NextClass", a premium Israeli B2B company selling tech equipment to educational institutions.
Respond in friendly, professional, sales-oriented Hebrew. Keep answers relatively brief.
Here is the live catalog data you should refer to:
${catalogInfo}`;
            const history = newMessages
                .filter(m => m.id !== 0)
                .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
            const response = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 300,
                system: systemPrompt,
                messages: history,
            });
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: response.content[0].text }]);
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `שגיאת שרת: ${error.message || JSON.stringify(error)}` }]);
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
                        className="w-[380px] h-[620px] flex flex-col overflow-hidden rounded-[2.5rem] relative"
                        style={{
                            background: 'rgba(248,249,252,0.98)',
                            backdropFilter: 'blur(60px) saturate(1.8)',
                            WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
                            border: '1px solid rgba(0,0,0,0.10)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
                        }}
                    >
                        {/* ── Panel Header ──────────────────────────────────── */}
                        <div className="relative z-20 px-8 pt-7 pb-4 flex items-center justify-between border-b"
                            style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.08)' }}>
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
                                    className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X size={18} className="text-[#1D1D1F]" />
                                </button>
                            </Magnetic>
                        </div>

                        {/* ── Tab Bar ───────────────────────────────────────── */}
                        <div className="px-6 py-3 border-b" style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.07)' }}>
                            <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                {TABS.map(({ id, label, Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                                            activeTab === id
                                                ? 'bg-white text-[#1D1D1F] shadow-sm'
                                                : 'text-[#86868B] hover:text-[#1D1D1F]'
                                        }`}
                                    >
                                        <Icon size={13} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── CHAT TAB ──────────────────────────────────────── */}
                        {activeTab === 'chat' && (
                            <>
                                <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 custom-scrollbar" style={{ background: '#F2F3F7' }} dir="rtl">
                                    {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
                                    {isTyping && <TypingDots />}
                                    <div ref={bottomRef} />
                                </div>

                                <div className="relative z-20 px-6 pb-2 pt-3 flex flex-wrap gap-2 justify-end border-t" style={{ background: 'rgba(255,255,255,0.98)', borderColor: 'rgba(0,0,0,0.06)' }} dir="rtl">
                                    {[
                                        getSetting('ai_chip1', 'הצעת מחיר'),
                                        getSetting('ai_chip2', 'מפרט טכני'),
                                        getSetting('ai_chip3', 'ייעוץ'),
                                    ].map(chip => (
                                        <button
                                            key={chip}
                                            onClick={() => send(chip)}
                                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer"
                                            style={{ background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.20)', color: '#007AFF' }}
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative z-20 p-6 pt-2 border-t" style={{ background: 'rgba(255,255,255,0.98)', borderColor: 'rgba(0,0,0,0.06)' }}>
                                    <div className="relative flex items-center gap-2 rounded-2xl px-2 py-1.5" style={{ background: '#F2F3F7', border: '1px solid rgba(0,0,0,0.10)' }}>
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
                                                className="w-10 h-10 bg-[#1D1D1F] disabled:opacity-20 text-white rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer"
                                            >
                                                <ArrowUp size={18} strokeWidth={3} />
                                            </button>
                                        </Magnetic>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── ACCESSIBILITY TAB ─────────────────────────────── */}
                        {activeTab === 'accessibility' && (
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar" style={{ background: '#F2F3F7' }} dir="rtl">
                                {/* Font size */}
                                <div>
                                    <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Type size={12} />
                                        גודל גופן: {a11y.fontSize}%
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateFontSize(-10)}
                                            className="flex-1 h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-base transition-colors cursor-pointer text-[#1D1D1F]"
                                        >
                                            A-
                                        </button>
                                        <div className="flex-1 h-11 rounded-2xl flex items-center justify-center font-black text-[#007AFF] text-sm" style={{ background: 'rgba(0,122,255,0.08)' }}>
                                            {a11y.fontSize}%
                                        </div>
                                        <button
                                            onClick={() => updateFontSize(10)}
                                            className="flex-1 h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-base transition-colors cursor-pointer text-[#1D1D1F]"
                                        >
                                            A+
                                        </button>
                                    </div>
                                </div>

                                {/* Options grid */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <A11yOption active={a11y.highContrast}   onClick={() => toggleA11y('highContrast')}   icon={<Contrast size={16} />}      label="ניגוד גבוה" />
                                    <A11yOption active={a11y.grayscale}      onClick={() => toggleA11y('grayscale')}      icon={<Eye size={16} />}           label="גווני אפור" />
                                    <A11yOption active={a11y.invert}         onClick={() => toggleA11y('invert')}         icon={<RotateCcw size={16} />}     label="היפוך צבעים" />
                                    <A11yOption active={a11y.underlineLinks} onClick={() => toggleA11y('underlineLinks')} icon={<LinkIcon size={16} />}      label="הדגשת קישורים" />
                                    <A11yOption active={a11y.readableFont}   onClick={() => toggleA11y('readableFont')}   icon={<Type size={16} />}          label="גופן קריא" />
                                    <A11yOption active={a11y.bigCursor}      onClick={() => toggleA11y('bigCursor')}      icon={<MousePointer2 size={16} />} label="סמן גדול" />
                                </div>

                                {/* WCAG note */}
                                <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.12)' }}>
                                    <p className="text-[11px] text-[#007AFF] font-bold leading-relaxed">
                                        ווידג׳ט זה מנגיש את האתר בהתאם לתקן WCAG 2.1 AA ולדרישות החוק הישראלי למוסדות חינוך.
                                    </p>
                                </div>

                                {/* Reset */}
                                <button
                                    onClick={resetA11y}
                                    className="w-full h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-[#1D1D1F] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RotateCcw size={14} />
                                    איפוס הגדרות נגישות
                                </button>
                            </div>
                        )}

                        {/* ── WHATSAPP TAB ──────────────────────────────────── */}
                        {activeTab === 'whatsapp' && (
                            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5" dir="rtl">
                                <div className="w-20 h-20 rounded-3xl bg-[#25D366] flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 20px 50px rgba(37,211,102,0.35)' }}>
                                    <MessageCircle size={40} fill="white" strokeWidth={0} className="text-white" />
                                </div>

                                <div className="text-center space-y-2">
                                    <h3 className="text-[20px] font-black text-[#1D1D1F] tracking-tight">
                                        {getSetting('ai_wa_label', 'מענה אנושי בוואטסאפ')}
                                    </h3>
                                    <p className="text-[13px] text-[#86868B] font-medium">
                                        {getSetting('ai_wa_status', 'יועץ טכנולוגי זמין כעת ✅')}
                                    </p>
                                </div>

                                <div className="text-center w-full px-4 py-4 rounded-3xl" style={{ background: 'rgba(37,211,102,0.07)', border: '1px solid rgba(37,211,102,0.18)' }}>
                                    <p className="text-[11px] font-bold text-[#1D1D1F]/50 mb-1">שעות זמינות</p>
                                    <p className="text-[14px] font-black text-[#1D1D1F]">ראשון–שישי | 08:00–21:00</p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={openWhatsApp}
                                    className="w-full py-4 rounded-2xl font-black text-white text-[16px] flex items-center justify-center gap-3 cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 12px 35px rgba(37,211,102,0.35)' }}
                                >
                                    <MessageCircle size={22} fill="white" strokeWidth={0} />
                                    התחל שיחה בוואטסאפ
                                </motion.button>

                                <p className="text-[10px] text-[#AEAEB2] font-medium text-center">
                                    הלחיצה תפתח את WhatsApp עם הודעה מוכנה מראש
                                </p>
                            </div>
                        )}

                        {/* Subtle top accent line */}
                        <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-[2.5rem] pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, #007AFF, #5856D6)' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Trigger Button ────────────────────────────────────────────── */}
            <motion.button
                layout
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-16 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.12)] flex items-center px-4 overflow-hidden relative group transition-all duration-500 cursor-pointer ${isOpen ? 'bg-white' : 'bg-[#1D1D1F]'}`}
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
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-end pr-1">
                                        <span className="text-[12px] font-black text-white leading-none">{getSetting('ai_fab_label', 'העוזר החכם')}</span>
                                        <span className="text-[8px] font-bold text-white/50 uppercase tracking-[0.1em] mt-1">Chat Support</span>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.button>

            {/* Accessibility CSS — applied globally via document.documentElement classes */}
            <style>{`
                .high-contrast { background-color: #000 !important; color: #fff !important; }
                .high-contrast * { border-color: #fff !important; color: #fff !important; }
                .underline-links a { text-decoration: underline !important; }
                .readable-font * { font-family: Arial, sans-serif !important; }
                .big-cursor * { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3C/svg%3E"), auto !important; }
            `}</style>
        </div>
    );
};

export default memo(SmartConcierge);
