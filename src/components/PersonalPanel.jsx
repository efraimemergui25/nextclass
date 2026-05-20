import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, FileText, LogOut, Sparkles, ChevronLeft, Tag, MessageCircle, Package, ArrowRight, ShoppingBag, Pencil, Check, Building2, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, limit, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

// ─── Status maps (match actual Firestore values) ──────────────────────────────
const QUOTE_STATUS = {
    'חדש':         { bg: 'rgba(255,59,48,0.10)',   color: '#FF3B30' },
    'ביצירת קשר':  { bg: 'rgba(255,149,0,0.10)',   color: '#FF9500' },
    'הוצע מחיר':   { bg: 'rgba(0,122,255,0.10)',   color: '#007AFF' },
    'במשא ומתן':   { bg: 'rgba(88,86,214,0.10)',   color: '#5856D6' },
    'נסגר':        { bg: 'rgba(52,199,89,0.10)',   color: '#34C759' },
    'אבד':         { bg: 'rgba(174,174,178,0.10)', color: '#AEAEB2' },
};
const QUOTE_FLOW = ['חדש', 'ביצירת קשר', 'הוצע מחיר', 'במשא ומתן', 'נסגר'];

const ORDER_STATUS = {
    'חדש':   { bg: 'rgba(255,59,48,0.10)',   color: '#FF3B30' },
    'ממתין': { bg: 'rgba(255,149,0,0.10)',   color: '#FF9500' },
    'אושר':  { bg: 'rgba(0,122,255,0.10)',   color: '#007AFF' },
    'נשלח':  { bg: 'rgba(88,86,214,0.10)',   color: '#5856D6' },
    'נמסר':  { bg: 'rgba(52,199,89,0.10)',   color: '#34C759' },
    'בוטל':  { bg: 'rgba(255,59,48,0.10)',   color: '#FF3B30' },
};
const ORDER_FLOW = ['חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function relativeDate(ts) {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts : ts.toDate?.() ?? ts);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'היום';
    if (days === 1) return 'אתמול';
    if (days < 7) return `לפני ${days} ימים`;
    if (days < 30) return `לפני ${Math.floor(days / 7)} שבועות`;
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

function memberSince(ts) {
    if (!ts) return null;
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const months = Math.floor((Date.now() - d.getTime()) / 2592000000);
    if (months < 1) return 'הצטרפת לאחרונה';
    if (months < 12) return `חבר ${months} ${months === 1 ? 'חודש' : 'חודשים'}`;
    const y = Math.floor(months / 12);
    return `חבר ${y} ${y === 1 ? 'שנה' : 'שנים'}`;
}

const ROLES = [
    { value: 'teacher',     label: 'מורה' },
    { value: 'admin',       label: 'מנהל בית ספר' },
    { value: 'procurement', label: 'רכז רכש' },
    { value: 'other',       label: 'אחר' },
];
const ROLE_HE = Object.fromEntries(ROLES.map(r => [r.value, r.label]));
const TIER_ORDER  = ['free', 'member'];
const TIER_NEXT   = { free: 'member', member: null };
const TIER_LABELS = { free: 'פרטי', member: 'מוסדי' };
const TIER_COLORS = { free: '#8E8E93', member: '#007AFF' };

// ─── Detail timeline ──────────────────────────────────────────────────────────
function DetailTimeline({ status, flow, statusMap }) {
    const idx = flow.indexOf(status);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {flow.map((s, i) => {
                const done = i <= idx;
                const active = i === idx;
                const color = statusMap[s]?.color || '#007AFF';
                return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < flow.length - 1 ? 1 : 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <motion.div
                                animate={{ scale: active ? [1, 1.12, 1] : 1 }}
                                transition={{ repeat: active ? Infinity : 0, duration: 1.8 }}
                                style={{
                                    width: 26, height: 26, borderRadius: 99,
                                    background: done ? color : 'rgba(0,0,0,0.07)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: active ? `0 0 0 5px ${color}22` : 'none',
                                    flexShrink: 0,
                                }}>
                                <span style={{ fontSize: done ? 10 : 9, color: done ? '#fff' : '#C7C7CC', fontWeight: 900 }}>
                                    {done ? '✓' : i + 1}
                                </span>
                            </motion.div>
                            <p style={{ fontSize: 8, fontWeight: 800, color: done ? color : '#C7C7CC', whiteSpace: 'nowrap' }}>{s}</p>
                        </div>
                        {i < flow.length - 1 && (
                            <div style={{
                                flex: 1, height: 2, margin: '0 3px 18px',
                                background: i < idx ? (statusMap[flow[i + 1]]?.color || '#007AFF') : 'rgba(0,0,0,0.08)',
                                borderRadius: 99,
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Item row (in list) ───────────────────────────────────────────────────────
function ItemRow({ item, type, index, onClick, tierColor }) {
    const statusMap = type === 'quote' ? QUOTE_STATUS : ORDER_STATUS;
    const st = statusMap[item.status] || { bg: 'rgba(0,0,0,0.06)', color: '#8E8E93' };
    const hasMsg = item.unreadCustomer || !!item.customerMessage;

    return (
        <motion.div
            initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 14px', borderRadius: 16,
                background: '#F5F5F7', border: `1px solid ${hasMsg ? 'rgba(0,122,255,0.18)' : 'rgba(0,0,0,0.05)'}`,
                cursor: 'pointer', position: 'relative',
                boxShadow: hasMsg ? '0 0 0 3px rgba(0,122,255,0.07)' : 'none',
            }}>
            {/* Icon */}
            <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: `${st.color}14`, border: `1px solid ${st.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {type === 'quote'
                    ? <FileText size={16} color={st.color} />
                    : <ShoppingBag size={16} color={st.color} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.id}
                </p>
                <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, margin: 0 }}>
                    {relativeDate(item.dateTs)} · {item.items?.length || 0} פריטים
                </p>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                    {(item.subtotal || item.total) ? `₪${Number(item.subtotal || item.total).toLocaleString()}` : '—'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>
                    {item.status || 'חדש'}
                </span>
            </div>

            {/* Unread message badge */}
            {hasMsg && (
                <div style={{
                    position: 'absolute', top: -5, right: -5,
                    width: 18, height: 18, borderRadius: 99,
                    background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,122,255,0.4)',
                }}>
                    <MessageCircle size={9} color="#fff" />
                </div>
            )}

            <ChevronLeft size={14} color="#C7C7CC" />
        </motion.div>
    );
}

// ─── Detail view (drill-down) ─────────────────────────────────────────────────
function DetailView({ item, type, onBack }) {
    const statusMap = type === 'quote' ? QUOTE_STATUS : ORDER_STATUS;
    const flow = type === 'quote' ? QUOTE_FLOW : ORDER_FLOW;
    const st = statusMap[item.status] || { bg: 'rgba(0,0,0,0.06)', color: '#8E8E93' };
    const isTerminal = item.status === 'אבד' || item.status === 'בוטל';

    const [msgText, setMsgText]     = useState('');
    const [msgSending, setMsgSending] = useState(false);
    const threadEndRef = useRef(null);

    // Mark unread as read when customer opens
    useEffect(() => {
        if (item.unreadCustomer) {
            const col = type === 'quote' ? 'quotes' : 'orders';
            updateDoc(doc(db, col, item.id), { unreadCustomer: false }).catch(() => {});
        }
    }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll to bottom on new message
    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [item.thread?.length]);

    const handleSendMsg = async () => {
        if (!msgText.trim()) return;
        setMsgSending(true);
        try {
            const col = type === 'quote' ? 'quotes' : 'orders';
            const msg = { id: `${Date.now()}_${Math.random().toString(36).slice(2,6)}`, from: 'customer', text: msgText.trim(), tsNum: Date.now() };
            await updateDoc(doc(db, col, item.id), { thread: arrayUnion(msg), unreadAdmin: true, unreadCustomer: false });
            setMsgText('');
        } finally { setMsgSending(false); }
    };

    return (
        <motion.div
            key="detail"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-110%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: '#fff', overflowY: 'auto',
                fontFamily: 'Heebo, sans-serif', direction: 'rtl',
            }}>

            {/* Sticky nav bar */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={onBack}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: '#007AFF', fontSize: 14, fontWeight: 700, padding: 0,
                        fontFamily: 'Heebo, sans-serif',
                    }}>
                    <ArrowRight size={15} />
                    חזרה
                </motion.button>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.01em' }}>{item.id}</span>
            </div>

            <div style={{ padding: '20px 18px 48px' }}>

                {/* Header: status + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 600 }}>{relativeDate(item.dateTs)}</span>
                    <span style={{
                        fontSize: 12, fontWeight: 800, padding: '4px 13px', borderRadius: 99,
                        background: st.bg, color: st.color,
                    }}>{item.status || 'חדש'}</span>
                </div>

                {/* Timeline */}
                {!isTerminal && (
                    <div style={{
                        background: `${st.color}07`, border: `1px solid ${st.color}18`,
                        borderRadius: 18, padding: '14px 16px 10px', marginBottom: 18,
                    }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#8E8E93', letterSpacing: '0.09em', margin: '0 0 12px', textAlign: 'right' }}>מצב הבקשה</p>
                        <DetailTimeline status={item.status} flow={flow} statusMap={statusMap} />
                    </div>
                )}

                {isTerminal && (
                    <div style={{
                        background: 'rgba(174,174,178,0.08)', border: '1px solid rgba(174,174,178,0.18)',
                        borderRadius: 16, padding: '14px 16px', marginBottom: 18,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ fontSize: 22 }}>{item.status === 'בוטל' ? '❌' : '📭'}</span>
                        <p style={{ fontSize: 13, color: '#6E6E73', fontWeight: 600, margin: 0 }}>
                            {item.status === 'בוטל' ? 'ההזמנה בוטלה' : 'ההצעה לא נסגרה'}
                        </p>
                    </div>
                )}

                {/* Message from NextClass */}
                {item.customerMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,122,255,0.06), rgba(88,86,214,0.04))',
                            border: '1px solid rgba(0,122,255,0.20)',
                            borderRadius: 18, padding: '14px 16px', marginBottom: 18,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 10,
                                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <MessageCircle size={14} color="#fff" />
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', margin: 0 }}>הודעה מ-NextClass</p>
                        </div>
                        <p style={{ fontSize: 13, color: '#1D1D1F', fontWeight: 500, margin: 0, lineHeight: 1.65 }}>
                            {item.customerMessage}
                        </p>
                    </motion.div>
                )}

                {/* Items */}
                {item.items?.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#8E8E93', letterSpacing: '0.09em', margin: '0 0 10px' }}>פריטים</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {item.items.map((itm, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                                    background: '#F5F5F7', borderRadius: 14, border: '1px solid rgba(0,0,0,0.04)',
                                }}>
                                    {(itm.image || itm.imageUrl) && (
                                        <img src={itm.image || itm.imageUrl} alt={itm.title}
                                            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0, background: '#EBEBEB' }} />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {itm.title}
                                        </p>
                                        <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, margin: 0 }}>כמות: {itm.qty ?? itm.quantity ?? 1}</p>
                                    </div>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', flexShrink: 0, margin: 0 }}>
                                        ₪{((itm.salePrice ?? itm.price) * (itm.qty ?? itm.quantity ?? 1)).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px 0' }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F' }}>
                                    ₪{(item.subtotal || item.total || 0).toLocaleString()}
                                </span>
                                <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 600 }}>סה״כ</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Original order notes */}
                {item.notes && (
                    <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 18 }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', margin: '0 0 6px' }}>הערות מקוריות</p>
                        <p style={{ fontSize: 13, color: '#1D1D1F', margin: 0, lineHeight: 1.55 }}>{item.notes}</p>
                    </div>
                )}

                {/* Thread chat */}
                <div style={{ marginTop: item.notes ? 0 : 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 9, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageCircle size={13} color="#fff" />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 800, color: '#007AFF', letterSpacing: '0.09em', margin: 0, flex: 1 }}>שיחה עם NextClass</p>
                        {item.unreadCustomer && (
                            <span style={{ fontSize: 9, fontWeight: 800, background: '#007AFF', color: '#fff', padding: '2px 8px', borderRadius: 99 }}>הודעה חדשה</span>
                        )}
                    </div>

                    {/* Messages */}
                    {(() => {
                        const msgs = [...(item.thread || [])].sort((a,b) => a.tsNum - b.tsNum);
                        const legacy = [];
                        if (msgs.length === 0 && item.customerNote) legacy.push({ id: 'ln-c', from: 'customer', text: item.customerNote, tsNum: 1 });
                        if (msgs.length === 0 && item.customerMessage) legacy.push({ id: 'ln-a', from: 'admin', text: item.customerMessage, tsNum: 2 });
                        const display = msgs.length > 0 ? msgs : legacy;
                        if (display.length === 0 && isTerminal) return null;
                        if (display.length === 0) return (
                            <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', padding: '12px 0 16px' }}>שלח הודעה לצוות שלנו</p>
                        );
                        return (
                            <div style={{ maxHeight: 230, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, paddingBottom: 4 }}>
                                {display.map(m => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'customer' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '82%', padding: '9px 13px',
                                            borderRadius: m.from === 'customer' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: m.from === 'customer' ? 'linear-gradient(135deg,#007AFF,#5856D6)' : '#F0F0F5',
                                            color: m.from === 'customer' ? '#fff' : '#1D1D1F',
                                        }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                                            <p style={{ fontSize: 9, margin: '4px 0 0', opacity: 0.6 }}>
                                                {m.from === 'customer' ? 'אני' : 'NextClass'}
                                                {m.tsNum > 2 ? ` · ${new Date(m.tsNum).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </div>
                        );
                    })()}

                    {/* Input */}
                    {!isTerminal && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                            <textarea
                                value={msgText}
                                onChange={e => setMsgText(e.target.value)}
                                placeholder="כתבו הודעה לצוות שלנו..."
                                rows={2}
                                style={{
                                    flex: 1, borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)',
                                    background: '#F5F5F7', padding: '10px 12px', fontSize: 13, fontWeight: 500,
                                    color: '#1D1D1F', fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                                    resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
                                }}
                            />
                            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSendMsg} disabled={msgSending || !msgText.trim()}
                                style={{
                                    padding: '10px 16px', borderRadius: 12, border: 'none', flexShrink: 0,
                                    background: msgText.trim() ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'rgba(0,0,0,0.08)',
                                    color: msgText.trim() ? '#fff' : '#AEAEB2',
                                    fontSize: 13, fontWeight: 700, cursor: msgText.trim() ? 'pointer' : 'default',
                                    fontFamily: 'Heebo, sans-serif',
                                }}>
                                {msgSending ? '...' : 'שלח'}
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ─── Product thumb ────────────────────────────────────────────────────────────
function ProductThumb({ product, tierColor, onClick }) {
    return (
        <Link to={`/products/${product.id}`} onClick={onClick} style={{ textDecoration: 'none', flex: '0 0 auto', width: 110 }}>
            <motion.div whileHover={{ y: -2 }} style={{
                borderRadius: 16, overflow: 'hidden',
                background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)',
            }}>
                <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#EBEBEB' }}>
                    {product.image ? (
                        <img src={product.image} alt={product.title} loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tag size={22} color="#C7C7CC" />
                        </div>
                    )}
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.title}
                    </p>
                    {product.price > 0 && (
                        <p style={{ fontSize: 11, fontWeight: 800, color: tierColor, margin: '4px 0 0' }}>
                            ₪{Number(product.price).toLocaleString()}
                        </p>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, action, actionTo }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8E8E93', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {children}
            </span>
            {action && (
                <Link to={actionTo} style={{ fontSize: 12, fontWeight: 600, color: '#007AFF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {action} <ChevronLeft size={12} />
                </Link>
            )}
        </div>
    );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function PersonalPanel({ open, onClose }) {
    const { user, userDoc, firstName, tierLabel, tierColor, discountPct, isMember, memberTier, signOut, updateUserProfile } = useAuth();
    const { wishlistItems, wishlistCount } = useWishlist();
    const { activeProducts } = useProducts();
    const { isVisible } = useSettings();

    const [quotes, setQuotes]   = useState([]);
    const [orders, setOrders]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab]         = useState('quotes');
    const [detail, setDetail]   = useState(null); // { item, type }
    const [editOpen,  setEditOpen]  = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm]   = useState({ role: '', institution: '', memberTier: 'free' });

    // Real-time listeners — only while panel is open
    useEffect(() => {
        if (!open || !user?.email) return;
        setLoading(true);

        const unsubQuotes = onSnapshot(
            query(collection(db, 'quotes'), where('email', '==', user.email), limit(15)),
            snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                setQuotes(docs);
                setLoading(false);
            },
            () => { setQuotes([]); setLoading(false); }
        );

        const unsubOrders = onSnapshot(
            query(collection(db, 'orders'), where('email', '==', user.email), limit(15)),
            snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                setOrders(docs);
            },
            () => setOrders([])
        );

        return () => { unsubQuotes(); unsubOrders(); };
    }, [open, user?.email]);

    // Reset detail on close
    useEffect(() => { if (!open) { setDetail(null); setTab('quotes'); } }, [open]);

    // Sync detail item in real-time (if open)
    useEffect(() => {
        if (!detail) return;
        const updated = detail.type === 'quote'
            ? quotes.find(q => q.id === detail.item.id)
            : orders.find(o => o.id === detail.item.id);
        if (updated) setDetail(prev => ({ ...prev, item: updated }));
    }, [quotes, orders]); // eslint-disable-line react-hooks/exhaustive-deps

    const tierIdx = TIER_ORDER.indexOf(memberTier || 'free');
    const nextTier = TIER_NEXT[memberTier || 'free'];

    const recommendations = useMemo(() => {
        if (!activeProducts?.length) return [];
        const wishedIds  = new Set(wishlistItems.map(i => i.id));
        const wishedCats = new Set(wishlistItems.map(i => i.category).filter(Boolean));
        let pool = activeProducts.filter(p => !wishedIds.has(p.id));
        if (wishedCats.size) {
            const match = pool.filter(p => wishedCats.has(p.category));
            if (match.length >= 3) pool = match;
        }
        return [...pool].sort(() => Math.random() - 0.5).slice(0, 4);
    }, [activeProducts, wishlistItems, open]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSignOut = () => { onClose(); signOut(); };
    const role  = ROLE_HE[userDoc?.role] || '';
    const since = memberSince(userDoc?.createdAt);

    const openEdit = () => {
        setEditForm({ role: userDoc?.role || 'teacher', institution: userDoc?.institution || '', memberTier: memberTier || 'free' });
        setEditOpen(true);
    };
    const handleSaveProfile = async () => {
        setEditSaving(true);
        try { await updateUserProfile(editForm); } finally { setEditSaving(false); setEditOpen(false); }
    };

    const activeList  = tab === 'quotes' ? quotes : orders;
    const msgCount    = quotes.filter(q => q.customerMessage).length;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div key="pp-bd"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, zIndex: 9100,
                            background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
                    />

                    {/* Panel */}
                    <motion.div key="pp-panel"
                        initial={{ x: '110%' }} animate={{ x: 0 }} exit={{ x: '110%' }}
                        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: 'min(400px, 100vw)',
                            zIndex: 9101,
                            background: '#fff',
                            fontFamily: 'Heebo, sans-serif',
                            direction: 'rtl',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.14)',
                            overflow: 'hidden',
                        }}>
                        {/* Inner relative wrapper for absolute children */}
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>

                        {/* ── List view ─────────────────────────────────────── */}
                        <motion.div
                            animate={{ x: detail ? 60 : 0, opacity: detail ? 0 : 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                            style={{ position: 'absolute', inset: 0, overflowY: 'auto', pointerEvents: detail ? 'none' : 'auto' }}>

                            {/* Identity header */}
                            <div style={{
                                padding: '52px 24px 24px',
                                background: `linear-gradient(160deg, ${tierColor}12 0%, transparent 60%)`,
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                position: 'relative',
                            }}>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                                    style={{ position: 'absolute', top: 16, left: 16,
                                        width: 32, height: 32, borderRadius: 99,
                                        background: 'rgba(0,0,0,0.06)', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: '#6E6E73' }}>
                                    <X size={15} />
                                </motion.button>

                                <motion.div
                                    initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 0.05 }}
                                    style={{
                                        width: 72, height: 72, borderRadius: 24,
                                        background: `linear-gradient(135deg, ${tierColor}, ${tierColor}99)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 8px 24px ${tierColor}44`, marginBottom: 16,
                                    }}>
                                    <span style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>
                                        {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                                    </span>
                                </motion.div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', margin: 0 }}>
                                        {user?.displayName || firstName}
                                    </h2>
                                    <span style={{
                                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                                        background: isMember ? `${tierColor}18` : 'rgba(0,0,0,0.06)',
                                        color: isMember ? tierColor : '#8E8E93',
                                    }}>
                                        {tierLabel}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                                        {(userDoc?.institution || role) ? (
                                            <p style={{ fontSize: 13, color: '#6E6E73', fontWeight: 500, margin: 0 }}>
                                                {[userDoc?.institution, role].filter(Boolean).join(' · ')}
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: 13, color: '#AEAEB2', fontWeight: 500, margin: 0 }}>הוסף תפקיד ומוסד</p>
                                        )}
                                        {since && (
                                            <p style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Sparkles size={11} color={tierColor} /> {since}
                                            </p>
                                        )}
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        onClick={openEdit}
                                        style={{ width: 30, height: 30, borderRadius: 99, border: 'none', background: editOpen ? `${tierColor}18` : 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Pencil size={13} color={editOpen ? tierColor : '#8E8E93'} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Tier progress */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    {TIER_ORDER.map((t, i) => (
                                        <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: 99, marginBottom: 4,
                                                background: i <= tierIdx ? `linear-gradient(135deg, ${TIER_COLORS[t]}, ${TIER_COLORS[t]}88)` : '#F0F0F0',
                                                border: i === tierIdx ? `2px solid ${TIER_COLORS[t]}` : '2px solid transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: i === tierIdx ? `0 0 0 4px ${TIER_COLORS[t]}20` : 'none',
                                            }}>
                                                {i <= tierIdx && <span style={{ fontSize: 12 }}>✓</span>}
                                            </div>
                                            <span style={{ fontSize: 9, fontWeight: 800, color: i === tierIdx ? TIER_COLORS[t] : '#C7C7CC', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                {TIER_LABELS[t]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ height: 4, background: '#F0F0F0', borderRadius: 99, marginBottom: 4, overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(tierIdx / (TIER_ORDER.length - 1)) * 100}%` }}
                                        transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.2 }}
                                        style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${TIER_COLORS['free']}, ${tierColor})` }}
                                    />
                                </div>
                            </div>

                            {/* Inline edit profile */}
                            <AnimatePresence>
                            {editOpen && (
                                <motion.div
                                    key="edit-profile"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {/* Tier picker */}
                                        <div>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>סוג חשבון</p>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {TIER_ORDER.map(t => (
                                                    <motion.button key={t} whileTap={{ scale: 0.96 }}
                                                        onClick={() => setEditForm(f => ({ ...f, memberTier: t }))}
                                                        style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: `1.5px solid ${editForm.memberTier === t ? TIER_COLORS[t] : 'rgba(0,0,0,0.1)'}`, background: editForm.memberTier === t ? `${TIER_COLORS[t]}12` : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: editForm.memberTier === t ? TIER_COLORS[t] : '#8E8E93' }}>
                                                        {TIER_LABELS[t]}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Role select */}
                                        <div>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>תפקיד</p>
                                            <div style={{ position: 'relative' }}>
                                                <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontSize: 14, fontWeight: 600, color: '#1D1D1F', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', direction: 'rtl', outline: 'none' }}>
                                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                                <ChevronDown size={14} color="#8E8E93" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                        {/* Institution input */}
                                        <div>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>שם מוסד</p>
                                            <div style={{ position: 'relative' }}>
                                                <Building2 size={14} color="#AEAEB2" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                                <input value={editForm.institution} onChange={e => setEditForm(f => ({ ...f, institution: e.target.value }))}
                                                    placeholder="בית ספר / עמותה / אוניברסיטה"
                                                    style={{ width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: '#F5F5F7', fontSize: 14, fontWeight: 500, color: '#1D1D1F', outline: 'none', fontFamily: 'Heebo, sans-serif', direction: 'rtl', boxSizing: 'border-box' }} />
                                            </div>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveProfile} disabled={editSaving}
                                                style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: '#007AFF', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                {editSaving ? '...' : <><Check size={14} /> שמור</>}
                                            </motion.button>
                                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setEditOpen(false)}
                                                style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6E6E73', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                                ביטול
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>

                            {/* Quick stats */}
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 10 }}>
                                {[
                                    { icon: Heart,     label: 'מועדפים', value: wishlistCount,      to: '/wishlist' },
                                    { icon: FileText,  label: 'בקשות',   value: quotes.length || '—', to: null, badge: msgCount },
                                    { icon: Package,   label: 'הזמנות',  value: orders.length || '—', to: null },
                                ].map(({ icon: Icon, label, value, to, badge }) => {
                                    const inner = (
                                        <motion.div key={label} whileHover={{ y: -1 }} style={{
                                            flex: 1, background: '#F5F5F7', borderRadius: 16, padding: '14px 12px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                            border: '1px solid rgba(0,0,0,0.05)', cursor: to ? 'pointer' : 'default',
                                            position: 'relative',
                                        }}>
                                            <Icon size={16} color={tierColor} strokeWidth={2} />
                                            <span style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em' }}>{value}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
                                            {badge > 0 && (
                                                <div style={{
                                                    position: 'absolute', top: -4, right: -4,
                                                    width: 16, height: 16, borderRadius: 99,
                                                    background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 900 }}>{badge}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                    return to ? <Link key={label} to={to} onClick={onClose} style={{ flex: 1, textDecoration: 'none' }}>{inner}</Link> : inner;
                                })}
                            </div>

                            {/* Tabs: quotes | orders */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <div style={{
                                    display: 'flex', background: 'rgba(0,0,0,0.06)',
                                    borderRadius: 13, padding: 3, marginBottom: 16,
                                }}>
                                    {[
                                        { key: 'quotes', label: `בקשות מחיר${quotes.length ? ` (${quotes.length})` : ''}` },
                                        { key: 'orders', label: `הזמנות${orders.length ? ` (${orders.length})` : ''}` },
                                    ].map(({ key, label }) => (
                                        <motion.button key={key} onClick={() => setTab(key)}
                                            style={{
                                                flex: 1, height: 36, borderRadius: 10, border: 'none',
                                                background: tab === key ? '#fff' : 'transparent',
                                                fontFamily: 'Heebo, sans-serif',
                                                fontSize: 12, fontWeight: 800,
                                                color: tab === key ? '#1D1D1F' : '#8E8E93',
                                                cursor: 'pointer',
                                                boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                                                transition: 'all 0.2s',
                                            }}>
                                            {label}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* List */}
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {[1, 2].map(i => (
                                            <div key={i} style={{ height: 66, borderRadius: 16, background: '#F5F5F7', opacity: 0.6 }} />
                                        ))}
                                    </div>
                                ) : activeList.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '28px 0', color: '#AEAEB2' }}>
                                        <p style={{ fontSize: 32, margin: '0 0 8px' }}>{tab === 'quotes' ? '📋' : '📦'}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#6E6E73' }}>
                                            {tab === 'quotes' ? 'טרם הגשת בקשות מחיר' : 'טרם ביצעת הזמנות'}
                                        </p>
                                        <Link to="/catalog" onClick={onClose}
                                            style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
                                            גלה את הקטלוג →
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <AnimatePresence>
                                            {activeList.map((item, i) => (
                                                <ItemRow
                                                    key={item.id}
                                                    item={item}
                                                    type={tab === 'quotes' ? 'quote' : 'order'}
                                                    index={i}
                                                    onClick={() => setDetail({ item, type: tab === 'quotes' ? 'quote' : 'order' })}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Wishlist */}
                            {wishlistCount > 0 && (
                                <div style={{ padding: '28px 24px 0' }}>
                                    <SectionLabel action="הכל" actionTo="/wishlist">מועדפים שלי</SectionLabel>
                                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                                        {wishlistItems.slice(0, 4).map((p, i) => (
                                            <motion.div key={p.id} onClick={onClose}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 }}>
                                                <ProductThumb product={p} tierColor={tierColor} onClick={onClose} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div style={{ padding: '28px 24px 0' }}>
                                    <SectionLabel action="גלה עוד" actionTo="/catalog">מומלץ עבורך</SectionLabel>
                                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                                        {recommendations.map((p, i) => (
                                            <motion.div key={p.id} onClick={onClose}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 + 0.1 }}>
                                                <ProductThumb product={p} tierColor={tierColor} onClick={onClose} />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Membership upsell */}
                            {isVisible('vis_membership_upsell') && !isMember && (
                                <div style={{ padding: '28px 24px 0' }}>
                                    <Link to="/membership" onClick={onClose} style={{ textDecoration: 'none' }}>
                                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                            style={{
                                                borderRadius: 20, padding: '16px 18px',
                                                background: 'linear-gradient(125deg, #007AFF14, #5856D614)',
                                                border: '1px solid rgba(0,122,255,0.18)',
                                                display: 'flex', alignItems: 'center', gap: 14,
                                            }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 14,
                                                background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Sparkles size={20} color="#fff" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
                                                    שדרג לחבר Premium
                                                </p>
                                                <p style={{ fontSize: 12, color: '#6E6E73', fontWeight: 500, margin: 0 }}>
                                                    גישה למחירי מוסד · שירות VIP · עדיפות בטיפול
                                                </p>
                                            </div>
                                            <ChevronLeft size={16} color="#007AFF" style={{ marginRight: 'auto', flexShrink: 0 }} />
                                        </motion.div>
                                    </Link>
                                </div>
                            )}

                            {/* General contact */}
                            <div style={{ padding: '16px 24px 0' }}>
                                <Link to="/contact" onClick={onClose} style={{ textDecoration: 'none' }}>
                                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                        style={{
                                            borderRadius: 16, padding: '14px 16px',
                                            background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                        }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 11, background: '#F0F0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <MessageCircle size={16} color="#8E8E93" />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', margin: '0 0 2px' }}>פנייה כללית</p>
                                            <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, margin: 0 }}>שאלה שאינה קשורה להזמנה ספציפית</p>
                                        </div>
                                        <ChevronLeft size={14} color="#C7C7CC" style={{ flexShrink: 0 }} />
                                    </motion.div>
                                </Link>
                            </div>

                            {/* Sign out */}
                            <div style={{ padding: '28px 24px 40px', marginTop: 'auto' }}>
                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20 }}>
                                    <motion.button
                                        whileHover={{ background: 'rgba(255,69,58,0.06)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSignOut}
                                        style={{
                                            width: '100%', height: 48, borderRadius: 14,
                                            background: 'transparent', border: '1px solid rgba(255,69,58,0.18)',
                                            color: '#FF453A', fontSize: 14, fontWeight: 700,
                                            cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            transition: 'background 0.15s',
                                        }}>
                                        <LogOut size={16} />
                                        התנתק
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Detail view ────────────────────────────────────── */}
                        <AnimatePresence>
                            {detail && (
                                <DetailView
                                    item={detail.item}
                                    type={detail.type}
                                    onBack={() => setDetail(null)}
                                />
                            )}
                        </AnimatePresence>

                        </div>{/* /inner relative wrapper */}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
