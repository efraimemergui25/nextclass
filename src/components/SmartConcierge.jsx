import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Sparkles, ArrowUp, MessageCircle,
    Type, Contrast, Eye, MousePointer2, Link as LinkIcon,
    RotateCcw, Check, Accessibility, ShoppingCart, ExternalLink
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Magnetic from './Magnetic';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
const SPRING = { type: 'spring', stiffness: 350, damping: 32 };
const BUBBLE_SPRING = { type: 'spring', stiffness: 450, damping: 30 };

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

// ── Inline Product Card (rendered inside chat) ───────────────────────────────
const ProductChip = memo(({ product, onAddToCart, onNavigate }) => {
    const [added, setAdded] = useState(false);
    const price = product.salePrice ?? product.price ?? 0;
    const original = product.price ?? 0;
    const hasDiscount = product.salePrice && product.salePrice < original;

    const handleAdd = (e) => {
        e.stopPropagation();
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer group"
            style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.09)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            onClick={() => onNavigate(product.id)}
        >
            {/* Image */}
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Sparkles size={20} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-[#1D1D1F] leading-tight truncate">{product.title}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[14px] font-black text-[#007AFF]">₪{Number(price).toLocaleString()}</span>
                    {hasDiscount && (
                        <span className="text-[10px] font-bold text-[#AEAEB2] line-through">₪{Number(original).toLocaleString()}</span>
                    )}
                </div>
                {product.stock > 0 ? (
                    <span className="text-[9px] font-bold text-[#34C759]">במלאי ✓</span>
                ) : (
                    <span className="text-[9px] font-bold text-[#FF3B30]">אזל מהמלאי</span>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
                <button
                    onClick={handleAdd}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        added
                            ? 'bg-[#34C759] text-white'
                            : 'bg-[#007AFF] text-white hover:bg-blue-600'
                    }`}
                    style={{ boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}
                    title="הוסף לעגלה"
                >
                    {added ? <Check size={14} strokeWidth={3} /> : <ShoppingCart size={14} />}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNavigate(product.id); }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 hover:bg-black/10 text-[#86868B] transition-all cursor-pointer"
                    title="פרטי מוצר"
                >
                    <ExternalLink size={12} />
                </button>
            </div>
        </motion.div>
    );
});

// ── Rich text renderer (bold, line breaks) ───────────────────────────────────
function RichText({ text }) {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim() !== '');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Render **bold** markers
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                const rendered = parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-black text-[#1D1D1F]">{part.slice(2, -2)}</strong>;
                    }
                    // Bullet point
                    if (part.startsWith('• ') || part.startsWith('- ')) {
                        return <span key={j}>{part}</span>;
                    }
                    return <span key={j}>{part}</span>;
                });
                const isBullet = line.trimStart().startsWith('•') || line.trimStart().startsWith('-') || line.trimStart().startsWith('*') && !line.startsWith('**');
                return (
                    <p key={i} className={`leading-[1.65] ${isBullet ? 'flex gap-2' : ''}`}>
                        {rendered}
                    </p>
                );
            })}
        </div>
    );
}

// ── Chat bubble ──────────────────────────────────────────────────────────────
const Bubble = memo(({ msg, onAddToCart, onNavigate }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={BUBBLE_SPRING}
            className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shrink-0 shadow-lg border border-white/20 self-start mt-1">
                    <Sparkles size={14} className="text-white" />
                </div>
            )}
            <div className={`max-w-[85%] flex flex-col gap-2`}>
                <div className={`px-5 py-3 text-[14px] font-medium leading-[1.6] relative overflow-hidden ${
                    isUser
                        ? 'bg-[#007AFF] text-white rounded-[1.25rem] rounded-br-none shadow-md'
                        : 'text-[#1D1D1F] rounded-[1.25rem] rounded-bl-none'
                }`}
                style={!isUser ? { background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.10)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : {}}
                >
                    {isUser ? msg.text : <RichText text={msg.text} />}
                </div>

                {/* Inline product cards */}
                {!isUser && msg.products && msg.products.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {msg.products.map(p => (
                            <ProductChip
                                key={p.id}
                                product={p}
                                onAddToCart={onAddToCart}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                )}
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

// ── Context-aware quick replies ──────────────────────────────────────────────
function getQuickReplies(messages, settings) {
    const hasConversation = messages.length > 1;
    if (!hasConversation) {
        return [
            settings.ai_chip1 || 'הצעת מחיר',
            settings.ai_chip2 || 'מפרט טכני',
            settings.ai_chip3 || 'ייעוץ',
        ];
    }
    const lastAI = [...messages].reverse().find(m => m.role === 'ai');
    const lastText = lastAI?.text?.toLowerCase() || '';
    if (lastText.includes('מחיר') || lastText.includes('₪')) {
        return ['מה כלול במחיר?', 'אפשר הנחה?', 'הוסף לעגלה'];
    }
    if (lastText.includes('מפרט') || lastText.includes('טכנ')) {
        return ['אפשרויות שדרוג?', 'השוואה למוצרים אחרים', 'שלח הצעת מחיר'];
    }
    return ['ספר עוד', 'מה המחיר?', 'צור קשר'];
}

// ── Main component ───────────────────────────────────────────────────────────
const SmartConcierge = () => {
    const { getSetting } = useSettings();
    const whatsappNumber = getSetting('biz_whatsapp', '972585856356');
    const location = useLocation();
    const navigate = useNavigate();
    const isProductPage = location.pathname.startsWith('/catalog/');
    const { activeProducts } = useProducts();
    const { addToCart } = useCart();

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
    const [cartFeedback, setCartFeedback] = useState(null);

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

    // Open via custom event
    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('open-concierge', handler);
        return () => window.removeEventListener('open-concierge', handler);
    }, []);

    // Reset chat on route change
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

    // Add to cart handler with visual feedback
    const handleAddToCart = useCallback((product) => {
        addToCart({ ...product, qty: 1 });
        setCartFeedback(product.title);
        setTimeout(() => setCartFeedback(null), 2500);
    }, [addToCart]);

    // Navigate to product page and close
    const handleNavigate = useCallback((productId) => {
        navigate(`/catalog/${productId}`);
        setIsOpen(false);
    }, [navigate]);

    // Build compact catalog context (ID|name|category|price|stock)
    const buildCatalogContext = useCallback(() => {
        return activeProducts.slice(0, 25).map(p =>
            `${p.id}|${p.title}|${p.category}|₪${p.salePrice ?? p.price ?? 0}|${p.stock > 0 ? 'במלאי' : 'אזל'}`
        ).join('\n');
    }, [activeProducts]);

    // Parse [PRODUCTS: id1, id2] tags from AI response
    const parseProducts = useCallback((text) => {
        const match = text.match(/\[PRODUCTS:\s*([^\]]+)\]/);
        if (!match) return { cleanText: text, products: [] };
        const ids = match[1].split(',').map(s => s.trim());
        const products = ids
            .map(id => activeProducts.find(p => String(p.id) === id))
            .filter(Boolean);
        const cleanText = text.replace(/\[PRODUCTS:[^\]]+\]/g, '').trim();
        return { cleanText, products };
    }, [activeProducts]);

    const send = useCallback(async (text) => {
        const t = (text ?? input).trim();
        if (!t || isTyping) return;
        const newMessages = [...messages, { id: Date.now(), role: 'user', text: t }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);
        try {
            const catalogInfo = buildCatalogContext();
            const systemPrompt = `אתה NextClass AI — יועץ מכירות מקצועי וחם של חברת NextClass, המספקת טכנולוגיה למוסדות חינוך בישראל.

## אופן עבודה — ייעוץ בשלבים
כשלקוח מבקש מוצר או פתרון, **אל תמליץ מיד**. קודם שאל שאלה אחת ממוקדת כדי להבין את הצורך (למשל: כמות, תקציב, מטרת שימוש, סוג מוסד).
- שאל **שאלה אחת בלבד** בכל הודעה — לא יותר
- **אל תשאל את אותה שאלה פעמיים**
- לאחר 2-3 תשובות — **המלץ על מוצרים ספציפיים מהקטלוג** עם נימוק אישי ומדויק
- תשובות חייבות להיות מבוססות על הקטלוג בלבד — אל תמציא מוצרים שאינם ברשימה

## כללים
- ענה אך ורק בעברית, 2-3 משפטים, מקצועי וחם
- השתמש **bold** להדגשות חשובות
- אל תציין מספרי ID בתוך הטקסט בשום פנים
- רק לאחר הבנת הצורך — הוסף בשורה נפרדת: [PRODUCTS: id1,id2] (עד 3 מוצרים)

## קטלוג (id|שם|קטגוריה|מחיר|מלאי):
${catalogInfo}`;

            const history = newMessages
                .filter(m => m.id !== 0)
                .slice(-6)
                .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

            const res = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, systemPrompt }),
            });

            const data = await res.json();
            const rawText = data.text || 'מצטערים, לא הצלחנו לעבד את הבקשה.';
            const { cleanText, products } = parseProducts(rawText);

            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'ai',
                text: cleanText,
                products,
            }]);
        } catch (error) {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'שגיאת רשת. נסו שוב בעוד רגע.', products: [] }]);
        }
    }, [input, messages, activeProducts, isTyping, buildCatalogContext, parseProducts]);

    const quickReplies = getQuickReplies(messages, {
        ai_chip1: getSetting('ai_chip1', ''),
        ai_chip2: getSetting('ai_chip2', ''),
        ai_chip3: getSetting('ai_chip3', ''),
    });

    const openWhatsApp = () => {
        window.open(`https://wa.me/${whatsappNumber}?text=היי, אשמח להתייעץ לגבי פתרונות NextClass`, '_blank');
    };

    return (
        <div ref={rootRef} className="fixed bottom-8 right-8 z-[1000] flex flex-col items-end gap-5" dir="ltr">

            {/* ── Cart feedback toast ─────────────────────────────────────── */}
            <AnimatePresence>
                {cartFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        className="px-4 py-2.5 rounded-2xl text-[12px] font-bold text-white flex items-center gap-2"
                        style={{ background: '#34C759', boxShadow: '0 8px 24px rgba(52,199,89,0.4)' }}
                    >
                        <Check size={13} strokeWidth={3} />
                        נוסף לעגלה!
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
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
                        <div className="relative z-20 px-6 pt-6 pb-4 flex items-center gap-3 border-b"
                            style={{ background: 'rgba(255,255,255,0.95)', borderColor: 'rgba(0,0,0,0.08)' }}>
                            {/* X — right side first in DOM = visual right in RTL */}
                            <Magnetic strength={0.3}>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                >
                                    <X size={18} className="text-[#1D1D1F]" />
                                </button>
                            </Magnetic>
                            {/* Logo + text — takes remaining space, aligned right */}
                            <div className="flex items-center gap-3 flex-1 justify-end">
                                <div className="text-right">
                                    <h3 className="text-[16px] font-black text-[#1D1D1F] tracking-tight">{getSetting('ai_title', 'NextClass AI')}</h3>
                                    <p className="text-[9px] text-[#007AFF] font-black uppercase tracking-[0.2em] mt-0.5 opacity-70">{getSetting('ai_role', 'Institutional Concierge')}</p>
                                </div>
                                <div className="relative shrink-0">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center shadow-lg transform rotate-2">
                                        <Sparkles size={22} className="text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                                </div>
                            </div>
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
                                    {messages.map(msg => (
                                        <Bubble
                                            key={msg.id}
                                            msg={msg}
                                            onAddToCart={handleAddToCart}
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                    {isTyping && <TypingDots />}
                                    <div ref={bottomRef} />
                                </div>

                                {/* Quick reply chips */}
                                <div className="relative z-20 px-6 pb-2 pt-3 flex flex-wrap gap-2 justify-end border-t" style={{ background: 'rgba(255,255,255,0.98)', borderColor: 'rgba(0,0,0,0.06)' }} dir="rtl">
                                    {quickReplies.map(chip => (
                                        <button
                                            key={chip}
                                            onClick={() => send(chip)}
                                            disabled={isTyping}
                                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                                            style={{ background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.20)', color: '#007AFF' }}
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>

                                {/* Input bar */}
                                <div className="relative z-20 p-6 pt-2 border-t" style={{ background: 'rgba(255,255,255,0.98)', borderColor: 'rgba(0,0,0,0.06)' }}>
                                    <div className="relative flex items-center gap-2 rounded-2xl px-2 py-1.5" style={{ background: '#F2F3F7', border: '1px solid rgba(0,0,0,0.10)' }}>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !isTyping && send()}
                                            placeholder={getSetting('ai_placeholder', 'מה תרצו לבדוק?')}
                                            dir="rtl"
                                            className="flex-1 bg-transparent border-none px-3 py-2 text-[14px] font-medium outline-none placeholder:text-gray-400"
                                        />
                                        <Magnetic strength={0.2}>
                                            <button
                                                onClick={() => send()}
                                                disabled={!input.trim() || isTyping}
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
                                <div>
                                    <p className="text-[10px] font-black text-[#86868B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Type size={12} />
                                        גודל גופן: {a11y.fontSize}%
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateFontSize(-10)} className="flex-1 h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-base transition-colors cursor-pointer text-[#1D1D1F]">A-</button>
                                        <div className="flex-1 h-11 rounded-2xl flex items-center justify-center font-black text-[#007AFF] text-sm" style={{ background: 'rgba(0,122,255,0.08)' }}>{a11y.fontSize}%</div>
                                        <button onClick={() => updateFontSize(10)} className="flex-1 h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center font-bold text-base transition-colors cursor-pointer text-[#1D1D1F]">A+</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <A11yOption active={a11y.highContrast}   onClick={() => toggleA11y('highContrast')}   icon={<Contrast size={16} />}      label="ניגוד גבוה" />
                                    <A11yOption active={a11y.grayscale}      onClick={() => toggleA11y('grayscale')}      icon={<Eye size={16} />}           label="גווני אפור" />
                                    <A11yOption active={a11y.invert}         onClick={() => toggleA11y('invert')}         icon={<RotateCcw size={16} />}     label="היפוך צבעים" />
                                    <A11yOption active={a11y.underlineLinks} onClick={() => toggleA11y('underlineLinks')} icon={<LinkIcon size={16} />}      label="הדגשת קישורים" />
                                    <A11yOption active={a11y.readableFont}   onClick={() => toggleA11y('readableFont')}   icon={<Type size={16} />}          label="גופן קריא" />
                                    <A11yOption active={a11y.bigCursor}      onClick={() => toggleA11y('bigCursor')}      icon={<MousePointer2 size={16} />} label="סמן גדול" />
                                </div>
                                <div className="p-4 rounded-2xl" style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.12)' }}>
                                    <p className="text-[11px] text-[#007AFF] font-bold leading-relaxed">
                                        ווידג׳ט זה מנגיש את האתר בהתאם לתקן WCAG 2.1 AA ולדרישות החוק הישראלי למוסדות חינוך.
                                    </p>
                                </div>
                                <button onClick={resetA11y} className="w-full h-11 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-[#1D1D1F] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
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
                                    <h3 className="text-[20px] font-black text-[#1D1D1F] tracking-tight">{getSetting('ai_wa_label', 'מענה אנושי בוואטסאפ')}</h3>
                                    <p className="text-[13px] text-[#86868B] font-medium">{getSetting('ai_wa_status', 'יועץ טכנולוגי זמין כעת ✅')}</p>
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
                                <p className="text-[10px] text-[#AEAEB2] font-medium text-center">הלחיצה תפתח את WhatsApp עם הודעה מוכנה מראש</p>
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
                className="h-16 rounded-[2rem] bg-[#1D1D1F] shadow-[0_15px_40px_rgba(0,0,0,0.12)] flex items-center px-4 overflow-hidden relative group transition-all duration-500 cursor-pointer"
                style={{ minWidth: '4.5rem' }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] to-[#5856D6] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-3 w-full justify-center">
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X size={26} className="text-white" />
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

            {/* Accessibility CSS */}
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
