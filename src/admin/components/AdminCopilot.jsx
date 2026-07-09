/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS AI — ADMIN COPILOT  (floating in-workflow assistant)
   ───────────────────────────────────────────────────────────────────────────────
   A self-contained glass FAB + chat panel embedded INSIDE the admin portal.
   It guides the operator, answers questions in Hebrew, summarises the live state
   of the store, drafts emails/quotes (never sends), and navigates to the right
   screen. Grounded in REAL admin data via useAdminData() — no mock data.

   Assumes it is mounted inside the existing admin providers (React Router +
   AdminDataProvider + AdminToastProvider). Streams from POST /api/concierge
   (SSE) with a non-streaming JSON fallback.

   Mount: render <AdminCopilot/> inside <AdminDataProvider> in AdminApp.jsx.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Sparkles, X, ArrowUp, LayoutDashboard, Package, AlertTriangle,
    Mail, ScanLine, FolderLock, Compass,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import {
    buildAdminDataContext,
    buildAdminCopilotSystemPrompt,
    QUICK_ACTIONS,
    SUGGESTED_PROMPTS,
} from '../lib/adminCopilotPrompt';

/* ─── Liquid-glass constants (spec-aligned; self-contained) ──────────────────── */
const ACCENT = 'linear-gradient(135deg, #007AFF 0%, #5E5CE6 100%)';
const PANEL_GLASS = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(60px) saturate(240%)',
    WebkitBackdropFilter: 'blur(60px) saturate(240%)',
    border: '1.5px solid rgba(255,255,255,0.94)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.14), 0 0 44px rgba(94,92,230,0.14), inset 0 1.5px 0 rgba(255,255,255,1)',
};

/* ─── Icon for each quick-action route ───────────────────────────────────────── */
const ACTION_ICON = {
    '/admin/dashboard':      LayoutDashboard,
    '/admin/orders':         Package,
    '/admin/inventory':      AlertTriangle,
    '/admin/communications': Mail,
    '/admin/ocr':            ScanLine,
    '/admin/vault':          FolderLock,
};

/* ─── Rich text — **bold** + line breaks ─────────────────────────────────────── */
const RichText = memo(({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <p key={i} className="leading-[1.65]">
                        {parts.map((part, j) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j} className="font-black text-[#1D1D1F]">{part.slice(2, -2)}</strong>
                                : <span key={j}>{part}</span>
                        )}
                    </p>
                );
            })}
        </div>
    );
});

/* ─── Chat bubble ────────────────────────────────────────────────────────────── */
const Bubble = memo(({ msg, reduce }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 460, damping: 30 }}
            className={`flex items-end gap-2.5 ${isUser ? 'justify-start' : 'justify-end'}`}
        >
            {!isUser && (
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 self-start mt-0.5 shadow-md"
                    style={{ background: ACCENT }}>
                    <Sparkles size={13} className="text-white" />
                </div>
            )}
            <div className={`max-w-[85%] px-4 py-2.5 text-[13.5px] font-medium ${
                isUser
                    ? 'text-white rounded-[1.15rem] rounded-br-sm'
                    : 'text-[#1D1D1F] rounded-[1.15rem] rounded-bl-sm'
            }`}
                style={isUser
                    ? { background: ACCENT, boxShadow: '0 4px 14px rgba(0,122,255,0.28)' }
                    : { background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            >
                {isUser ? msg.text : <RichText text={msg.text} />}
            </div>
        </motion.div>
    );
});

/* ─── Typing indicator ───────────────────────────────────────────────────────── */
const TypingDots = () => (
    <div className="flex items-end gap-2.5 justify-end">
        <div className="px-4 py-3 rounded-[1.15rem] rounded-bl-sm flex gap-1.5 items-center"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#5E5CE6' }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, delay: i * 0.18, repeat: Infinity }}
                />
            ))}
        </div>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: ACCENT }}>
            <Sparkles size={13} className="text-white" />
        </div>
    </div>
);

/* ─── Navigation quick-action chip ───────────────────────────────────────────── */
const NavChip = memo(({ label, path, onGo }) => {
    const Icon = ACTION_ICON[path] || Compass;
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => onGo(path, label)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-bold cursor-pointer transition-colors"
            style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.20)', color: '#0057C4' }}
        >
            <Icon size={13} strokeWidth={2.4} />
            {label}
        </motion.button>
    );
});

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminCopilot() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useAdminToast();
    const { kpis, inventory, activityLog } = useAdminData();

    const reduce = useReducedMotion();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]); // {id, role:'user'|'ai', text}
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pendingEmailsCount, setPendingEmailsCount] = useState(0);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    /* ── Live pending-email approval count (read-only) ───────────────────────── */
    useEffect(() => {
        const qy = query(collection(db, 'pending_emails'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(
            qy,
            snap => setPendingEmailsCount(snap.docs.filter(d => d.data().status === 'pending').length),
            () => {} // silent — count simply stays 0 if unavailable
        );
        return unsub;
    }, []);

    /* ── Autoscroll + focus ──────────────────────────────────────────────────── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }, [messages, isTyping, reduce]);
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
    }, [isOpen]);

    /* ── Escape closes ───────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    /* ── Guided navigation (safe — no mutation) ──────────────────────────────── */
    const goTo = useCallback((path, label) => {
        navigate(path);
        setIsOpen(false);
        showToast(`פתחתי עבורך: ${label}`, 'info');
    }, [navigate, showToast]);

    /* ── Send → stream from /api/concierge (SSE) with JSON fallback ──────────── */
    const send = useCallback(async (text) => {
        const t = (text ?? input).trim();
        if (!t || isTyping) return;

        const outgoing = [...messages, { id: Date.now(), role: 'user', text: t }];
        setMessages(outgoing);
        setInput('');
        setIsTyping(true);

        // Fresh live context on every send — grounded in the ACTUAL current state.
        const dataContext = buildAdminDataContext({
            kpis, inventory, activityLog,
            pendingEmailsCount,
            pathname: location.pathname,
        });
        const systemPrompt = buildAdminCopilotSystemPrompt(dataContext);

        const history = outgoing
            .slice(-8)
            .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

        const streamId = Date.now() + 1;
        let acc = '';
        let started = false;

        const pushDisplay = () => {
            if (!started) {
                started = true;
                setIsTyping(false);
                setMessages(prev => [...prev, { id: streamId, role: 'ai', text: acc }]);
            } else {
                setMessages(prev => prev.map(m => (m.id === streamId ? { ...m, text: acc } : m)));
            }
        };

        const finalize = (rawText) => {
            const safe = (rawText || '').trim() || 'מצטער, לא הצלחתי לעבד את הבקשה. נסה/י שוב.';
            setMessages(prev =>
                prev.some(m => m.id === streamId)
                    ? prev.map(m => (m.id === streamId ? { ...m, text: safe } : m))
                    : [...prev, { id: streamId, role: 'ai', text: safe }]
            );
        };

        try {
            // ── Primary: SSE stream ──────────────────────────────────────────
            const res = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, systemPrompt, stream: true }),
            });
            if (!res.ok || !res.body) throw new Error('stream unavailable');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let ended = false;

            while (!ended) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let sep;
                while ((sep = buffer.indexOf('\n\n')) !== -1) {
                    const frame = buffer.slice(0, sep);
                    buffer = buffer.slice(sep + 2);
                    for (const line of frame.split('\n')) {
                        const l = line.trim();
                        if (!l.startsWith('data:')) continue; // ignore comment pings (": open")
                        const payload = l.slice(5).trim();
                        if (payload === '[DONE]') { ended = true; continue; }
                        try {
                            const obj = JSON.parse(payload);
                            if (obj.type === 'delta' && obj.text) { acc += obj.text; pushDisplay(); }
                            else if (obj.type === 'done' && obj.text) { acc = obj.text; } // authoritative
                        } catch { /* ignore partial / non-JSON frame */ }
                    }
                }
            }

            setIsTyping(false);
            finalize(acc);
        } catch {
            // ── Fallback: non-streaming JSON ─────────────────────────────────
            try {
                const res = await fetch('/api/concierge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history, systemPrompt }),
                });
                const data = await res.json();
                setIsTyping(false);
                finalize(data.text || data.response || '');
            } catch {
                setIsTyping(false);
                finalize('שגיאת רשת. נסה/י שוב בעוד רגע.');
            }
        }
    }, [input, isTyping, messages, kpis, inventory, activityLog, pendingEmailsCount, location.pathname]);

    /* ── Attention badge — count of items needing action ─────────────────────── */
    const attention =
        (Number(kpis?.newQuotes) || 0) +
        (Number(kpis?.allPendingOrders) || 0) +
        (Number(kpis?.lowStockCount) || 0) +
        (Number(pendingEmailsCount) || 0);

    const panelSpring = reduce ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 32 };

    return (
        <div
            className="fixed z-[940] flex flex-col items-start gap-4"
            style={{ bottom: '24px', insetInlineStart: '24px', fontFamily: 'Heebo, sans-serif' }}
            dir="rtl"
        >
            {/* ── Chat panel ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
                        transition={panelSpring}
                        className="flex flex-col overflow-hidden rounded-[24px] relative"
                        style={{
                            ...PANEL_GLASS,
                            width: 'min(380px, calc(100vw - 32px))',
                            height: 'min(600px, calc(100vh - 132px))',
                            transformOrigin: 'bottom left',
                        }}
                        role="dialog"
                        aria-label="NextClass AI — עוזר הניהול"
                    >
                        {/* top accent hairline */}
                        <div className="absolute top-0 inset-x-0 h-[3px] pointer-events-none" style={{ background: ACCENT }} />

                        {/* ── Header ──────────────────────────────────────────── */}
                        <div className="px-5 pt-5 pb-4 flex items-center gap-3 shrink-0"
                            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                                style={{ background: ACCENT, boxShadow: '0 8px 22px rgba(94,92,230,0.32)' }}>
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-black text-[#1D1D1F] tracking-tight leading-none">NextClass AI</h3>
                                <p className="text-[10px] font-bold mt-1" style={{ color: '#5E5CE6' }}>עוזר הניהול החכם</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0"
                                style={{ background: 'rgba(0,0,0,0.05)' }}
                                aria-label="סגור"
                            >
                                <X size={16} className="text-[#1D1D1F]" />
                            </motion.button>
                        </div>

                        {/* ── Messages ────────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 custom-scrollbar">
                            {messages.length === 0 ? (
                                /* Empty state — greeting + suggestions */
                                <div className="flex flex-col gap-4 pt-1">
                                    <div className="px-4 py-3 rounded-[1.15rem] rounded-bl-sm text-[13.5px] font-medium text-[#1D1D1F] leading-[1.6]"
                                        style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.07)' }}>
                                        שלום! אני <strong className="font-black">NextClass AI</strong>, עוזר הניהול שלך. אני יכול לסכם את מצב החנות, להסביר איך משתמשים במערכת, לנסח טיוטת מייל או הצעת מחיר, ולכוון אותך למסך הנכון. במה נתחיל?
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-[#86868B] mb-2">שאלות נפוצות</p>
                                        <div className="flex flex-col gap-2">
                                            {SUGGESTED_PROMPTS.map(p => (
                                                <motion.button
                                                    key={p}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => send(p)}
                                                    className="text-right px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold cursor-pointer transition-colors"
                                                    style={{ background: 'rgba(0,0,0,0.035)', border: '1px solid rgba(0,0,0,0.06)', color: '#1D1D1F' }}
                                                >
                                                    {p}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-[#86868B] mb-2">מעבר מהיר</p>
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_ACTIONS.map(a => (
                                                <NavChip key={a.path + a.label} label={a.label} path={a.path} onGo={goTo} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map(m => <Bubble key={m.id} msg={m} reduce={reduce} />)}
                                    {isTyping && <TypingDots />}
                                </>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* ── Quick nav row (persistent, when in conversation) ── */}
                        {messages.length > 0 && (
                            <div className="px-5 pt-2.5 pb-1 flex gap-2 overflow-x-auto custom-scrollbar shrink-0"
                                style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                {QUICK_ACTIONS.slice(0, 5).map(a => (
                                    <div key={a.path + a.label} className="shrink-0">
                                        <NavChip label={a.label} path={a.path} onGo={goTo} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Input ───────────────────────────────────────────── */}
                        <div className="p-4 pt-2.5 shrink-0">
                            <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5"
                                style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.09)' }}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !isTyping) send(); }}
                                    placeholder="שאל/י אותי כל דבר על החנות…"
                                    dir="rtl"
                                    className="flex-1 bg-transparent border-none px-3 py-2 text-[13.5px] font-medium outline-none text-[#1D1D1F] placeholder:text-[#AEAEB2]"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => send()}
                                    disabled={!input.trim() || isTyping}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-25 transition-opacity"
                                    style={{ background: ACCENT, boxShadow: '0 4px 14px rgba(0,122,255,0.3)' }}
                                    aria-label="שלח"
                                >
                                    <ArrowUp size={17} strokeWidth={3} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Floating action button (pill) ───────────────────────────────── */}
            <motion.button
                layout
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsOpen(o => !o)}
                className="relative flex items-center gap-2.5 h-14 pl-5 pr-4 rounded-full cursor-pointer overflow-hidden"
                style={{
                    background: ACCENT,
                    boxShadow: '0 14px 38px rgba(94,92,230,0.42), 0 0 0 1.5px rgba(255,255,255,0.5) inset',
                }}
                aria-label={isOpen ? 'סגור את NextClass AI' : 'פתח את NextClass AI'}
                aria-expanded={isOpen}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.span key="x"
                            initial={reduce ? false : { rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={reduce ? { opacity: 0 } : { rotate: 90, opacity: 0 }}
                            className="flex items-center">
                            <X size={22} className="text-white" strokeWidth={2.6} />
                        </motion.span>
                    ) : (
                        <motion.span key="s"
                            initial={reduce ? false : { scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                            className="flex items-center gap-2.5">
                            <Sparkles size={22} className="text-white" strokeWidth={2.4} />
                            <span className="text-[14px] font-black text-white leading-none pl-0.5">NextClass AI</span>
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* attention badge */}
                {!isOpen && attention > 0 && (
                    <motion.span
                        initial={reduce ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                        style={{ background: '#FF3B30', boxShadow: '0 3px 10px rgba(255,59,48,0.5)', border: '2px solid rgba(255,255,255,0.9)' }}
                    >
                        {attention > 99 ? '99+' : attention}
                    </motion.span>
                )}
            </motion.button>
        </div>
    );
}
