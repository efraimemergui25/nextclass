/* eslint-disable */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, MessageCircle, Send,
    ShoppingBag, CheckCheck, Clock, Package,
} from 'lucide-react';
import { collection, query, where, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const STATUS_COLOR = {
    'חדש':      '#007AFF',
    'בטיפול':   '#FF9F0A',
    'הושלם':    '#34C759',
    'בוטל':     '#FF375F',
};

const EMOJI_OPTIONS = ['👍', '❤️', '😊', '🎉', '✅'];

// ─── AI quick-reply templates ─────────────────────────────────────────────────
const AI_TEMPLATES = {
    pricing:  ['מה המחיר הסופי?', 'האם יש הנחה לכמות?', 'מתי תגיע ההצעה המלאה?'],
    urgent:   ['אנחנו בלחץ זמן — אפשר לזרז?', 'מתי ניתן לקבל מענה?', 'נדרש לנו פתרון דחוף'],
    thanks:   ['תודה רבה! מחכים לפרטים', 'קיבלנו, תודה!', 'נהדר, נמתין'],
    delivery: ['מה זמן האספקה?', 'האם כולל התקנה?', 'מה הארוז בחבילה?'],
    general:  ['תודה, נמתין לעדכון', 'האם יש פרטים נוספים?', 'אשמח לשמוע יותר'],
};

function detectIntent(msgs) {
    const text = msgs.filter(m => m.from === 'admin').map(m => m.text).join(' ');
    if (/מחיר|תקציב|עלות|₪|הנחה/.test(text))      return 'pricing';
    if (/דחוף|מהר|זמן|urgent|שבוע/.test(text))     return 'urgent';
    if (/תודה|נעים|כיף|שמחים|ברכות/.test(text))    return 'thanks';
    if (/אספקה|משלוח|מועד|הגעה|התקנה/.test(text))  return 'delivery';
    return 'general';
}

// ─── Typing dots animation ────────────────────────────────────────────────────
const ppDotStyle = `
@keyframes ppBounceM { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
.ppDotM { width:7px;height:7px;border-radius:50%;display:inline-block;animation:ppBounceM 1.2s infinite; }
@keyframes ncPulseM { 0%{transform:scale(1);opacity:0.6} 70%,100%{transform:scale(2.4);opacity:0} }
.ncUnreadPulse { animation: ncPulseM 1.8s cubic-bezier(0,0,0.2,1) infinite; }
`;

// ─── Single message bubble (needs its own ref for long-press) ────────────────
function MessageBubble({ msg, isMe, isRead, tallied, longPressMsg, setLongPressMsg, startLongPress, handleReaction, c }) {
    const lpRef = useRef(null);
    return (
        <div style={{ marginBottom: Object.keys(tallied).length ? 18 : 10 }}>
            <div style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                <AnimatePresence>
                    {longPressMsg === msg.id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                position: 'absolute', zIndex: 10,
                                background: c.surface,
                                borderRadius: 24, padding: '8px 12px',
                                display: 'flex', gap: 10,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                            }}
                            onTouchStart={e => e.stopPropagation()}
                        >
                            {EMOJI_OPTIONS.map(em => (
                                <motion.button
                                    key={em}
                                    whileTap={{ scale: 1.4 }}
                                    onClick={() => handleReaction(msg.id, em)}
                                    style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 2, WebkitTapHighlightColor: 'transparent' }}
                                >
                                    {em}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div
                    style={{ position: 'relative', maxWidth: '78%' }}
                    onTouchStart={() => { lpRef.current = startLongPress(msg.id); }}
                    onTouchEnd={() => { if (lpRef.current) clearTimeout(lpRef.current); }}
                    onTouchMove={() => { if (lpRef.current) clearTimeout(lpRef.current); }}
                    onClick={() => { if (longPressMsg) setLongPressMsg(null); }}
                >
                    <div style={{
                        background: isMe ? 'linear-gradient(135deg,#007AFF,#5856D6)' : c.surface,
                        color: isMe ? '#fff' : c.text,
                        borderRadius: isMe ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        padding: '10px 14px',
                        fontSize: 15, lineHeight: 1.45,
                        boxShadow: isMe ? '0 3px 14px rgba(0,122,255,0.3)' : c.cardShadow,
                    }}>
                        {msg.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                        <span style={{ fontSize: 10, color: c.text4 }}>
                            {msg.tsNum ? new Date(msg.tsNum).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isRead && <CheckCheck size={12} color="#34C759" strokeWidth={2.5} />}
                    </div>
                </div>
            </div>

            {Object.keys(tallied).length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
                    {Object.entries(tallied).map(([em, cnt]) => (
                        <span key={em} style={{ fontSize: 12, background: c.surface2, borderRadius: 99, padding: '2px 7px', boxShadow: c.cardShadow }}>
                            {em}{cnt > 1 ? ` ${cnt}` : ''}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Chat detail view ─────────────────────────────────────────────────────────
function MobileDetailView({ item, col, onBack }) {
    const { colors: c } = useTheme();
    const [msgText,       setMsgText]       = useState('');
    const [sending,       setSending]       = useState(false);
    const [longPressMsg,  setLongPressMsg]  = useState(null); // msgId showing reaction picker
    const threadEndRef   = useRef(null);
    const typingTimerRef = useRef(null);

    // Mark read on open; clear typing on unmount
    useEffect(() => {
        const upd = { lastReadCustomer: Date.now() };
        if (item.unreadCustomer) upd.unreadCustomer = false;
        updateDoc(doc(db, col, item.id), upd).catch(() => {});
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            updateDoc(doc(db, col, item.id), { typingCustomer: false }).catch(() => {});
        };
    }, [item.id, col]);

    // Auto-scroll on new messages
    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [item.thread?.length]);

    const handleSend = useCallback(async () => {
        const text = msgText.trim();
        if (!text || sending) return;
        setSending(true);
        setMsgText('');
        const msg = { id: `m${Date.now()}`, from: 'customer', text, tsNum: Date.now() };
        try {
            await updateDoc(doc(db, col, item.id), {
                thread: arrayUnion(msg),
                unreadAdmin: true,
                unreadCustomer: false,
                typingCustomer: false,
            });
            haptic('light');
        } catch { haptic('error'); }
        setSending(false);
    }, [msgText, sending, col, item.id]);

    const handleTyping = useCallback(() => {
        updateDoc(doc(db, col, item.id), { typingCustomer: true }).catch(() => {});
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            updateDoc(doc(db, col, item.id), { typingCustomer: false }).catch(() => {});
        }, 2000);
    }, [col, item.id]);

    const handleReaction = useCallback((msgId, emoji) => {
        haptic('select');
        setLongPressMsg(null);
        updateDoc(doc(db, col, item.id), {
            [`reactions.${msgId}`]: arrayUnion({ from: 'customer', emoji, tsNum: Date.now() }),
        }).catch(() => {});
    }, [col, item.id]);

    const startLongPress = useCallback((msgId) => {
        const t = setTimeout(() => { haptic('select'); setLongPressMsg(msgId); }, 500);
        return t;
    }, []);

    const msgs   = [...(item.thread || [])].sort((a, b) => a.tsNum - b.tsNum);
    const rxns   = item.reactions || {};
    const lastAdminRead = item.lastReadAdmin || 0;
    const statusColor = STATUS_COLOR[item.status] || '#007AFF';

    // AI quick-reply suggestions based on last admin messages
    const suggestions = useMemo(() => AI_TEMPLATES[detectIntent(msgs)], [msgs.length]);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed', inset: 0, zIndex: 500,
                background: c.bg, fontFamily: SF, direction: 'rtl',
                display: 'flex', flexDirection: 'column',
            }}
        >
            <style>{ppDotStyle}</style>

            {/* Header */}
            <div style={{
                background: c.surface,
                borderBottom: `0.5px solid ${c.navBorder}`,
                padding: '12px 16px 12px',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => { haptic('light'); onBack(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#007AFF', display: 'flex', alignItems: 'center', gap: 2, padding: '4px 0', WebkitTapHighlightColor: 'transparent' }}
                >
                    <ChevronRight size={20} />
                    <span style={{ fontSize: 15, fontWeight: 500 }}>חזרה</span>
                </motion.button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.institution || item.customer || 'בקשה'}
                    </p>
                    <p style={{ fontSize: 11, color: c.text3 }}>{item.id}</p>
                </div>
                <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    background: `${statusColor}18`, color: statusColor,
                }}>
                    {item.status}
                </span>
            </div>

            {/* Messages scroll area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', WebkitOverflowScrolling: 'touch' }}>

                {/* Order summary card */}
                <div style={{ background: c.surface, borderRadius: 16, padding: '14px 16px', marginBottom: 16, boxShadow: c.cardShadow }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <ShoppingBag size={16} color="#007AFF" strokeWidth={1.9} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                            {(item.items || []).length} מוצרים · ₪{(item.subtotal || item.total || 0).toLocaleString()}
                        </span>
                    </div>
                    {(item.items || []).slice(0, 2).map(i => (
                        <p key={i.id} style={{ fontSize: 12, color: c.text3, marginBottom: 2 }}>
                            • {i.title} ×{i.qty || 1}
                        </p>
                    ))}
                    {(item.items || []).length > 2 && (
                        <p style={{ fontSize: 11, color: c.text4 }}>+ {(item.items || []).length - 2} נוספים</p>
                    )}
                </div>

                {/* Thread messages */}
                {msgs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <MessageCircle size={36} color={c.text4} strokeWidth={1.4} style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 14, color: c.text3, fontWeight: 600 }}>אין הודעות עדיין</p>
                        <p style={{ fontSize: 12, color: c.text4 }}>שלח הודעה לנציג שלך</p>
                    </div>
                )}

                {msgs.map((msg) => {
                    const isMe = msg.from === 'customer';
                    const msgRxns = rxns[msg.id] || [];
                    const tallied = msgRxns.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {});
                    const isRead = isMe && msg.tsNum <= lastAdminRead;
                    return (
                        <MessageBubble
                            key={msg.id || msg.tsNum}
                            msg={msg} isMe={isMe} isRead={isRead} tallied={tallied}
                            longPressMsg={longPressMsg} setLongPressMsg={setLongPressMsg}
                            startLongPress={startLongPress} handleReaction={handleReaction}
                            c={c}
                        />
                    );
                })}

                {/* Admin typing indicator */}
                {item.typingAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                        <div style={{ background: c.surface, borderRadius: '18px 18px 4px 18px', padding: '10px 16px', boxShadow: c.cardShadow, display: 'flex', gap: 4, alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} className="ppDotM" style={{ background: '#86868B', animationDelay: `${i * 0.18}s` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={threadEndRef} />
            </div>

            {/* AI suggestion chips */}
            {!msgText && suggestions && (
                <div style={{
                    background: c.surface,
                    borderTop: `0.5px solid ${c.navBorder}`,
                    display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden',
                    padding: '8px 14px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                }}>
                    {suggestions.map(s => (
                        <motion.button
                            key={s}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => { haptic('light'); setMsgText(s); }}
                            style={{
                                flexShrink: 0, height: 32, borderRadius: 16,
                                background: 'rgba(0,122,255,0.08)',
                                border: '1px solid rgba(0,122,255,0.2)',
                                color: '#007AFF', fontSize: 13, fontWeight: 600,
                                padding: '0 14px', cursor: 'pointer',
                                fontFamily: SF, whiteSpace: 'nowrap',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {s}
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div
                onClick={() => setLongPressMsg(null)}
                style={{
                    background: c.surface,
                    borderTop: `0.5px solid ${c.navBorder}`,
                    padding: '10px 14px',
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                }}
            >
                <textarea
                    value={msgText}
                    onChange={e => { setMsgText(e.target.value); if (e.target.value) handleTyping(); }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="הקלד הודעה..."
                    rows={1}
                    style={{
                        flex: 1, background: c.surface2, border: 'none', borderRadius: 20,
                        padding: '10px 14px', fontSize: 15, color: c.text,
                        fontFamily: SF, resize: 'none', outline: 'none',
                        maxHeight: 100, overflowY: 'auto', direction: 'rtl',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                />
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={handleSend}
                    disabled={!msgText.trim() || sending}
                    style={{
                        width: 40, height: 40, borderRadius: 20, border: 'none', flexShrink: 0,
                        background: msgText.trim() ? '#007AFF' : c.surface2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: msgText.trim() ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <Send size={16} color={msgText.trim() ? '#fff' : c.text4} />
                </motion.button>
            </div>
        </motion.div>
    );
}

// ─── Order row ────────────────────────────────────────────────────────────────
function OrderRow({ item, onSelect }) {
    const { colors: c } = useTheme();
    const statusColor = STATUS_COLOR[item.status] || '#007AFF';
    const lastMsg = [...(item.thread || [])].sort((a, b) => b.tsNum - a.tsNum)[0];

    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptic('select'); onSelect(item); }}
            style={{
                width: '100%', background: c.surface, borderRadius: 18,
                padding: '14px 16px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                direction: 'rtl', fontFamily: SF,
                boxShadow: c.cardShadow,
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                borderRight: item.unreadCustomer ? `3px solid #007AFF` : `3px solid transparent`,
            }}
        >
            {/* Icon */}
            <div style={{
                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                background: `${statusColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Package size={20} color={statusColor} strokeWidth={1.8} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: c.text3, fontWeight: 500, flexShrink: 0 }}>
                        {item.date || new Date(item.dateTs).toLocaleDateString('he-IL')}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.institution || item.customer || 'בקשה'}
                    </p>
                </div>
                <p style={{ fontSize: 12, color: c.text3, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastMsg ? lastMsg.text : `${(item.items || []).length} מוצרים · ₪${(item.subtotal || item.total || 0).toLocaleString()}`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: `${statusColor}15`, color: statusColor,
                    }}>
                        {item.status}
                    </span>
                    {(item.thread || []).length > 0 && (
                        <span style={{ fontSize: 10, color: c.text4, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MessageCircle size={10} />
                            {(item.thread || []).length}
                        </span>
                    )}
                </div>
            </div>

            {/* Unread badge — pulsing ring */}
            {item.unreadCustomer && (
                <div style={{ position: 'absolute', top: 14, left: 14, width: 12, height: 12 }}>
                    <div className="ncUnreadPulse" style={{
                        position: 'absolute', inset: 0, borderRadius: 99,
                        background: '#007AFF',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 99,
                        background: 'linear-gradient(135deg,#007AFF,#5856D6)',
                        boxShadow: '0 0 0 2.5px ' + c.surface,
                    }} />
                </div>
            )}
        </motion.button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MobileOrders() {
    const navigate = useNavigate();
    const { user, openAuthModal } = useAuth();
    const { colors: c } = useTheme();
    const [tab,         setTab]         = useState('quotes');   // 'quotes' | 'orders'
    const [quotes,      setQuotes]      = useState([]);
    const [orders,      setOrders]      = useState([]);
    const [selected,    setSelected]    = useState(null);
    const [selectedCol, setSelectedCol] = useState('quotes');  // locked at time of selection
    const [loading,     setLoading]     = useState(true);

    // Real-time listeners
    useEffect(() => {
        if (!user?.email) return;
        setLoading(true);

        const unsub1 = onSnapshot(
            query(collection(db, 'quotes'), where('email', '==', user.email), limit(20)),
            snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setQuotes(data.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0)));
                // Keep selected in sync
                setSelected(prev => {
                    if (!prev) return prev;
                    const fresh = data.find(q => q.id === prev.id);
                    return fresh ?? prev;
                });
                setLoading(false);
            },
            () => setLoading(false),
        );

        const unsub2 = onSnapshot(
            query(collection(db, 'orders'), where('email', '==', user.email), limit(20)),
            snap => {
                const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setOrders(data.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0)));
                setSelected(prev => {
                    if (!prev) return prev;
                    const fresh = data.find(q => q.id === prev.id);
                    return fresh ?? prev;
                });
            },
        );

        return () => { unsub1(); unsub2(); };
    }, [user?.email]);

    const list = tab === 'quotes' ? quotes : orders;
    const col  = tab === 'quotes' ? 'quotes' : 'orders';
    const unreadQuotes = quotes.filter(q => q.unreadCustomer).length;
    const unreadOrders = orders.filter(q => q.unreadCustomer).length;

    // Not logged in
    if (!user) {
        return (
            <div style={{ minHeight: '100dvh', fontFamily: SF, direction: 'rtl', background: c.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
                <MessageCircle size={52} color={c.text4} strokeWidth={1.3} style={{ marginBottom: 20 }} />
                <h2 style={{ fontSize: 22, fontWeight: 900, color: c.text, marginBottom: 10 }}>הבקשות שלי</h2>
                <p style={{ fontSize: 15, color: c.text3, lineHeight: 1.6, marginBottom: 28, maxWidth: 280 }}>
                    התחבר כדי לראות את ההצעות וההזמנות שלך ולשוחח עם הנציג שלך.
                </p>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptic('medium'); openAuthModal(); }}
                    style={{
                        height: 50, borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                        color: '#fff', fontSize: 16, fontWeight: 800,
                        padding: '0 32px', cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    התחברות / הרשמה
                </motion.button>
                <button
                    onClick={() => navigate(-1)}
                    style={{ marginTop: 16, background: 'none', border: 'none', color: c.text3, fontSize: 14, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                >
                    חזרה
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100dvh', fontFamily: SF, direction: 'rtl', background: c.bg }}>

            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: c.surface,
                borderBottom: `0.5px solid ${c.navBorder}`,
                padding: '0 16px',
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 54 }}>
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => { haptic('light'); navigate(-1); }}
                        style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent', padding: '4px 0' }}
                    >
                        <ChevronRight size={22} />
                    </motion.button>
                    <h1 style={{ flex: 1, fontSize: 17, fontWeight: 800, color: c.text, textAlign: 'right', letterSpacing: '-0.02em' }}>
                        הבקשות שלי
                    </h1>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, paddingBottom: 0 }}>
                    {[
                        { id: 'quotes', label: 'הצעות מחיר', badge: unreadQuotes },
                        { id: 'orders', label: 'הזמנות', badge: unreadOrders },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => { haptic('select'); setTab(t.id); }}
                            style={{
                                flex: 1, height: 42, background: 'none', border: 'none',
                                borderBottom: tab === t.id ? '2px solid #007AFF' : '2px solid transparent',
                                color: tab === t.id ? '#007AFF' : c.text3,
                                fontSize: 14, fontWeight: tab === t.id ? 800 : 600,
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                fontFamily: SF, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 6, transition: 'border-color 0.2s, color 0.2s',
                            }}
                        >
                            {t.label}
                            {t.badge > 0 && (
                                <span style={{
                                    background: '#007AFF', color: '#fff',
                                    fontSize: 10, fontWeight: 800,
                                    borderRadius: 99, padding: '1px 6px', lineHeight: 1.6,
                                }}>
                                    {t.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div style={{ padding: '14px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ background: c.surface, borderRadius: 18, height: 88, opacity: 0.5, boxShadow: c.cardShadow }} />
                    ))
                ) : list.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Clock size={44} color={c.text4} strokeWidth={1.3} style={{ margin: '0 auto 14px' }} />
                        <p style={{ fontSize: 16, fontWeight: 700, color: c.text3, marginBottom: 6 }}>
                            {tab === 'quotes' ? 'אין הצעות מחיר עדיין' : 'אין הזמנות עדיין'}
                        </p>
                        <p style={{ fontSize: 13, color: c.text4 }}>
                            {tab === 'quotes' ? 'הגש הצעה מחיר מהקטלוג שלנו' : 'ביצוע הזמנה יאפשר מעקב כאן'}
                        </p>
                    </div>
                ) : (
                    list.map(item => (
                        <OrderRow key={item.id} item={item} onSelect={it => { setSelected(it); setSelectedCol(col); }} />
                    ))
                )}
            </div>

            {/* Detail overlay */}
            <AnimatePresence>
                {selected && (
                    <MobileDetailView
                        key={selected.id}
                        item={selected}
                        col={selectedCol}
                        onBack={() => setSelected(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
