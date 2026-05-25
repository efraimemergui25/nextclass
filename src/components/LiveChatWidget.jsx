import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, arrayUnion } from 'firebase/firestore';

const SF = `-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif`;

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

const ChatBubble = ({ msg, isCustomer }) => (
    <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-2`}>
        {!isCustomer && (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0, alignSelf: 'flex-end' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>N</span>
            </div>
        )}
        <div style={{
            maxWidth: '75%',
            padding: '10px 14px',
            borderRadius: isCustomer ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isCustomer ? '#007AFF' : '#F5F5F7',
            color: isCustomer ? '#fff' : '#1D1D1F',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.4,
        }}>
            {msg.text}
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: isCustomer ? 'left' : 'right' }}>
                {msg.time}
            </div>
        </div>
    </div>
);

// Accessibility state stored at module level so it persists across re-renders
let _fontScale = 100; // percentage
let _contrast = false;

const LiveChatWidget = () => {
    const location = useLocation();
    const { getSetting } = useSettings();
    const waNumber = getSetting('whatsapp_number', '972585856356');
    const waMsg = encodeURIComponent('שלום, אני מעוניין ללמוד עוד על NextClass');

    const [open, setOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [a11yOpen, setA11yOpen] = useState(false);
    const [fontScale, setFontScaleState] = useState(_fontScale);
    const [contrast, setContrastState] = useState(_contrast);

    const [step, setStep] = useState('intro');
    const [contact, setContact] = useState({ name: '', phone: '' });
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [sending, setSending] = useState(false);
    const [unread, setUnread] = useState(0);
    const [chatDeleted, setChatDeleted] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const t = setTimeout(() => setShowTooltip(true), 5000);
        const t2 = setTimeout(() => setShowTooltip(false), 9000);
        return () => { clearTimeout(t); clearTimeout(t2); };
    }, []);

    useEffect(() => {
        if (!chatId) return;
        const unsub = onSnapshot(doc(db, 'quotes', chatId), snap => {
            if (!snap.exists() || snap.data().deleted) {
                setChatDeleted(true);
                setStep('intro');
                setChatId(null);
                setMessages([]);
                return;
            }
            const data = snap.data();
            const thread = data.thread || [];
            const formatted = thread.map(m => ({
                text: m.text || m.message,
                isCustomer: m.role === 'customer',
                time: m.ts ? new Date(m.ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '',
            }));
            setMessages(formatted);
            if (!open) {
                const adminMsgs = thread.filter(m => m.role === 'admin');
                setUnread(adminMsgs.length);
            }
        });
        return unsub;
    }, [chatId, open]);

    useEffect(() => {
        if (open) { setUnread(0); setShowTooltip(false); }
    }, [open]);

    useEffect(() => {
        if (chatDeleted) {
            const t = setTimeout(() => setChatDeleted(false), 5000);
            return () => clearTimeout(t);
        }
    }, [chatDeleted]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (location.pathname.startsWith('/admin')) return null;

    // Accessibility helpers
    const applyFontScale = (scale) => {
        _fontScale = scale;
        setFontScaleState(scale);
        document.documentElement.style.fontSize = scale + '%';
    };
    const applyContrast = (val) => {
        _contrast = val;
        setContrastState(val);
        document.body.style.filter = val ? 'contrast(1.45) saturate(0.7)' : '';
    };
    const resetA11y = () => { applyFontScale(100); applyContrast(false); };

    const startChat = async () => {
        if (!contact.name.trim() || !message.trim()) return;
        setSending(true);
        const id = `CHAT-${Date.now()}`;
        const ts = Date.now();
        const payload = {
            id,
            name: contact.name,
            phone: contact.phone,
            status: 'חדש',
            source: 'live_chat',
            dateTs: ts,
            date: new Date().toLocaleDateString('he-IL'),
            thread: [{ role: 'customer', text: message, ts, name: contact.name }],
        };
        try {
            await setDoc(doc(db, 'quotes', id), payload);
            setChatId(id);
            setMessages([{ text: message, isCustomer: true, time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }]);
            setMessage('');
            setStep('chat');
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const sendMessage = async () => {
        if (!message.trim() || !chatId) return;
        setSending(true);
        const ts = Date.now();
        try {
            await setDoc(doc(db, 'quotes', chatId), {
                thread: arrayUnion({ role: 'customer', text: message, ts, name: contact.name }),
                updatedAt: ts,
            }, { merge: true });
            setMessage('');
        } catch (e) { console.error(e); }
        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (step === 'intro') startChat(); else sendMessage();
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 89, fontFamily: SF }} dir="rtl">

            {/* Main panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 16 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        style={{
                            position: 'absolute', bottom: 72, right: 0,
                            width: 340, background: '#fff', borderRadius: 24,
                            boxShadow: '0 24px 64px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08)',
                            overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>N</span>
                                </div>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>NextClass</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', display: 'inline-block' }} />
                                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>מחכים לכם</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="סגור">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Quick actions strip */}
                        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: '#F9F9FB', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/${waNumber}?text=${waMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    background: '#fff', border: '1px solid rgba(37,211,102,0.25)',
                                    borderRadius: 12, padding: '9px 12px', textDecoration: 'none',
                                    boxShadow: '0 2px 8px rgba(37,211,102,0.10)',
                                    cursor: 'pointer',
                                }}
                                aria-label="פנה אלינו בוואטסאפ"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                                    <path d={WA_PATH} />
                                </svg>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F' }}>וואטסאפ</span>
                            </a>

                            {/* Accessibility */}
                            <button
                                onClick={() => setA11yOpen(p => !p)}
                                style={{
                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    background: a11yOpen ? '#F0F4FF' : '#fff',
                                    border: `1px solid ${a11yOpen ? 'rgba(0,122,255,0.3)' : 'rgba(0,0,0,0.08)'}`,
                                    borderRadius: 12, padding: '9px 12px', cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    transition: 'all 0.2s',
                                }}
                                aria-label="הגדרות נגישות"
                                aria-expanded={a11yOpen}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a11yOpen ? '#007AFF' : '#6E6E73'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="4" r="1" fill={a11yOpen ? '#007AFF' : '#6E6E73'} stroke="none" />
                                    <path d="M8 8l4-3 4 3M12 5v7M9 22l3-5 3 5M9 12H6l1 5M15 12h3l-1 5" />
                                </svg>
                                <span style={{ fontSize: 12, fontWeight: 700, color: a11yOpen ? '#007AFF' : '#1D1D1F' }}>נגישות</span>
                            </button>
                        </div>

                        {/* Accessibility panel */}
                        <AnimatePresence>
                            {a11yOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden', background: '#F0F4FF', borderBottom: '1px solid rgba(0,122,255,0.10)' }}
                                >
                                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {/* Font size */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F' }}>גודל טקסט</span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {[
                                                    { label: 'A-', scale: 90 },
                                                    { label: 'A', scale: 100 },
                                                    { label: 'A+', scale: 115 },
                                                ].map(({ label, scale }) => (
                                                    <button
                                                        key={scale}
                                                        onClick={() => applyFontScale(scale)}
                                                        style={{
                                                            width: 36, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                            background: fontScale === scale ? '#007AFF' : '#fff',
                                                            color: fontScale === scale ? '#fff' : '#1D1D1F',
                                                            fontWeight: 800, fontSize: label === 'A-' ? 10 : label === 'A+' ? 14 : 12,
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                            transition: 'all 0.15s',
                                                        }}
                                                        aria-label={`גודל טקסט ${label}`}
                                                    >{label}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* High contrast */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F' }}>ניגודיות גבוהה</span>
                                            <button
                                                onClick={() => applyContrast(!contrast)}
                                                style={{
                                                    width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                                                    background: contrast ? '#007AFF' : '#E5E5EA',
                                                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                                                }}
                                                aria-checked={contrast}
                                                role="switch"
                                                aria-label="ניגודיות גבוהה"
                                            >
                                                <span style={{
                                                    position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
                                                    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                                    transition: 'right 0.2s, left 0.2s',
                                                    right: contrast ? 3 : 'auto',
                                                    left: contrast ? 'auto' : 3,
                                                }} />
                                            </button>
                                        </div>

                                        {/* Reset */}
                                        {(fontScale !== 100 || contrast) && (
                                            <button
                                                onClick={resetA11y}
                                                style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#6E6E73', cursor: 'pointer' }}
                                            >
                                                אפס הגדרות נגישות
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Chat area */}
                        {step === 'intro' ? (
                            <div style={{ padding: '18px 20px 16px' }}>
                                {chatDeleted && (
                                    <div style={{ background: '#FFF3CD', border: '1px solid #FFD60A30', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>ℹ️</span>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: '#3D2E00', margin: 0 }}>השיחה הקודמת נסגרה. תוכלו לפתוח שיחה חדשה.</p>
                                    </div>
                                )}
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', marginBottom: 3 }}>שאלות? נשמח לעזור!</p>
                                <p style={{ fontSize: 12, color: '#86868B', marginBottom: 14 }}>השאירו פרטים ושאלתכם — נחזור אליכם במהירה.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <input
                                        type="text" placeholder="שם מלא *" value={contact.name}
                                        onChange={e => setContact(p => ({ ...p, name: e.target.value }))}
                                        style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: SF, direction: 'rtl', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <input
                                        type="tel" placeholder="טלפון" value={contact.phone}
                                        onChange={e => setContact(p => ({ ...p, phone: e.target.value }))}
                                        style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: SF, direction: 'rtl', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <textarea
                                        placeholder="מה השאלה שלכם? *" value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={3}
                                        style={{ border: '1px solid #E5E5EA', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: SF, direction: 'rtl', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'none' }}
                                    />
                                    <button
                                        onClick={startChat}
                                        disabled={!contact.name.trim() || !message.trim() || sending}
                                        style={{
                                            background: contact.name.trim() && message.trim() ? '#007AFF' : '#E5E5EA',
                                            color: contact.name.trim() && message.trim() ? '#fff' : '#AEAEB2',
                                            border: 'none', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: 13,
                                            cursor: contact.name.trim() && message.trim() ? 'pointer' : 'default',
                                            fontFamily: SF, transition: 'background 0.2s',
                                        }}
                                        aria-label="שלח הודעה"
                                    >
                                        {sending ? 'שולח...' : 'שלח הודעה'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ height: 240, overflowY: 'auto', padding: '16px 16px 8px' }}>
                                    <ChatBubble msg={{ text: `שלום ${contact.name}! קיבלנו את הודעתכם. נחזור אליכם בהקדם.`, isCustomer: false, time: '' }} isCustomer={false} />
                                    {messages.map((m, i) => <ChatBubble key={i} msg={m} isCustomer={m.isCustomer} />)}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div style={{ padding: '8px 12px 12px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <textarea
                                        placeholder="כתבו הודעה..." value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        style={{ flex: 1, border: '1px solid #E5E5EA', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: SF, direction: 'rtl', outline: 'none', resize: 'none' }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!message.trim() || sending}
                                        aria-label="שלח"
                                        style={{ width: 40, height: 40, borderRadius: 12, background: '#007AFF', border: 'none', cursor: message.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: message.trim() ? 1 : 0.4, flexShrink: 0 }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && !open && (
                    <motion.div
                        initial={{ opacity: 0, x: 8, scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 8, scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 480, damping: 28 }}
                        style={{
                            position: 'absolute', bottom: 72, right: 0,
                            background: 'rgba(255,255,255,0.96)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: 16, padding: '10px 16px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <motion.span
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759', display: 'inline-block', flexShrink: 0 }}
                            />
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>שאלות? נשמח לעזור!</p>
                                <p style={{ fontSize: 11, color: '#86868B' }}>צ׳אט, וואטסאפ ונגישות</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.button
                onClick={() => setOpen(p => !p)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                aria-label={open ? 'סגור עוזר אישי' : 'פתח עוזר אישי'}
                aria-expanded={open}
                style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#007AFF', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 28px rgba(0,122,255,0.40), 0 2px 8px rgba(0,122,255,0.20)',
                    position: 'relative',
                }}
            >
                <motion.span
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#007AFF', pointerEvents: 'none' }}
                    animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeOut', delay: 2 }}
                />
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </motion.svg>
                    ) : (
                        <motion.svg key="chat" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                            width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </motion.svg>
                    )}
                </AnimatePresence>
                {unread > 0 && !open && (
                    <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                        {unread}
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default LiveChatWidget;
