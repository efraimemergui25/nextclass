import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const VAT = 0.17;

// ─── Undo toast — appears after swipe-to-delete ───────────────────────────────
function UndoToast({ item, onUndo }) {
    const title = item?.title || '';
    const label = title.length > 24 ? title.slice(0, 24) + '…' : title;
    return createPortal(
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            dir="rtl"
            style={{
                position: 'fixed',
                bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
                left: 16, right: 16, zIndex: 500,
                background: '#1D1D1F',
                borderRadius: 16,
                padding: '13px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 6px 28px rgba(0,0,0,0.32)',
                fontFamily: SF,
            }}
        >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.88)', flex: 1, marginLeft: 10 }}>
                "{label}" הוסר
            </span>
            <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onUndo}
                style={{
                    background: 'none', border: 'none',
                    color: '#007AFF', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', padding: '4px 0',
                    WebkitTapHighlightColor: 'transparent', flexShrink: 0,
                }}
            >
                בטל
            </motion.button>
        </motion.div>,
        document.body
    );
}

// ─── Clear cart confirmation sheet ────────────────────────────────────────────
function ClearCartSheet({ onConfirm, onCancel, c }) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onCancel}
                style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}
            >
                <motion.div
                    initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', background: c.surface, borderRadius: '24px 24px 0 0',
                        padding: '24px 20px', paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
                        fontFamily: SF, direction: 'rtl',
                    }}
                >
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: c.divider, margin: '0 auto 20px' }} />
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,59,48,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <Trash2 size={26} color="#FF3B30" strokeWidth={1.8} />
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: c.text, textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 8 }}>לנקות את העגלה?</p>
                    <p style={{ fontSize: 14, color: c.text3, textAlign: 'center', lineHeight: 1.5, marginBottom: 24 }}>כל הפריטים יוסרו מהעגלה</p>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { haptic('warning'); onConfirm(); }}
                        style={{
                            width: '100%', height: 52, borderRadius: 16, background: '#FF3B30', border: 'none',
                            color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            fontFamily: SF, marginBottom: 10, WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        נקה עגלה
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={onCancel}
                        style={{
                            width: '100%', height: 52, borderRadius: 16, background: c.subtleBg, border: 'none',
                            color: c.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                            fontFamily: SF, WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        ביטול
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Swipeable cart item ───────────────────────────────────────────────────────
function SwipeableItem({ item, onDelete, onNavigate, onIncrease, onDecrease, c, i, last }) {
    const x              = useMotionValue(0);
    const deleteOpacity  = useTransform(x, [-90, -20], [1, 0]);
    const deleteScale    = useTransform(x, [-90, -20], [1, 0.85]);
    const itemScale      = useTransform(x, [-90, 0], [0.97, 1]);
    const fired          = useRef(false);

    const handleDragEnd = (_, { offset }) => {
        if (offset.x < -72 && !fired.current) {
            fired.current = true;
            onDelete();
        } else {
            x.set(0);
        }
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Delete background */}
            <motion.div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0, width: 90,
                background: '#FF3B30',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: deleteOpacity,
            }}>
                <motion.div style={{ scale: deleteScale }}>
                    <Trash2 size={22} color="#fff" strokeWidth={2} />
                </motion.div>
            </motion.div>

            {/* Swipeable row */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -90, right: 0 }}
                dragElastic={{ left: 0.15, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x, scale: itemScale, background: c.surface }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    borderBottom: !last ? `0.5px solid ${c.divider}` : 'none',
                }}>
                    {/* Image */}
                    <div
                        onClick={() => onNavigate(`/catalog/${item.id}`)}
                        style={{
                            width: 68, height: 68, borderRadius: 13, flexShrink: 0,
                            background: `linear-gradient(145deg, ${c.shimmerA}, ${c.shimmerB})`,
                            overflow: 'hidden', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        {item.image ? (
                            <img src={item.image} alt={item.title} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: 28, opacity: 0.35 }}>🖥️</span>
                        )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: 13, fontWeight: 700, color: c.text,
                            lineHeight: 1.3, marginBottom: 3,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                            {item.title}
                        </p>
                        <p style={{ fontSize: 11, color: c.text3, marginBottom: 5 }}>
                            ₪{(item.salePrice || item.price)?.toLocaleString()} / יח׳
                        </p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: item.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.02em' }}>
                            ₪{((item.salePrice || item.price) * (item.qty || 1)).toLocaleString()}
                        </p>
                    </div>

                    {/* Qty controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: c.surface2, borderRadius: 12, overflow: 'hidden' }}>
                            <motion.button
                                whileTap={{ scale: 0.78 }}
                                onClick={() => { haptic('light'); onIncrease(item.id); }}
                                aria-label={`הגדל כמות — ${item.title}`}
                                style={{
                                    width: 44, height: 44, background: 'none', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#007AFF', WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <Plus size={15} strokeWidth={2.5} />
                            </motion.button>
                            <span style={{ fontSize: 15, fontWeight: 800, color: c.text, minWidth: 26, textAlign: 'center' }}>
                                {item.qty || 1}
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.78 }}
                                onClick={() => {
                                    haptic('light');
                                    if ((item.qty || 1) <= 1) { haptic('medium'); onDelete(); }
                                    else onDecrease(item.id);
                                }}
                                aria-label={(item.qty || 1) <= 1 ? `הסר ${item.title} מהעגלה` : `הקטן כמות — ${item.title}`}
                                style={{
                                    width: 44, height: 44, background: 'none', border: 'none',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: (item.qty || 1) <= 1 ? '#FF3B30' : '#007AFF',
                                    WebkitTapHighlightColor: 'transparent', transition: 'color 0.15s',
                                }}
                            >
                                {(item.qty || 1) <= 1
                                    ? <Trash2 size={13} strokeWidth={2} />
                                    : <Minus size={15} strokeWidth={2.5} />
                                }
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MobileCart() {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCart();
    const { firstName } = useAuth();
    const { colors: c } = useTheme();
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null); // { id, item, timer }

    useEffect(() => () => { if (pendingDelete?.timer) clearTimeout(pendingDelete.timer); }, [pendingDelete]);

    const stageDelete = useCallback((item) => {
        haptic('medium');
        if (pendingDelete) {
            clearTimeout(pendingDelete.timer);
            removeFromCart(pendingDelete.id);
        }
        const timer = setTimeout(() => {
            removeFromCart(item.id);
            setPendingDelete(null);
        }, 4000);
        setPendingDelete({ id: item.id, item, timer });
    }, [pendingDelete, removeFromCart]);

    const handleUndo = useCallback(() => {
        if (!pendingDelete) return;
        clearTimeout(pendingDelete.timer);
        haptic('success');
        setPendingDelete(null);
    }, [pendingDelete]);

    const visibleItems = cartItems.filter(item => item.id !== pendingDelete?.id);
    const subtotal  = visibleItems.reduce((sum, item) => sum + (item.salePrice || item.price) * (item.qty || 1), 0);
    const vatAmount = subtotal * VAT;
    const total     = subtotal + vatAmount;

    if (visibleItems.length === 0 && !pendingDelete) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                style={{ width: 88, height: 88, borderRadius: 28, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
            >
                <ShoppingBag size={40} color="#007AFF" strokeWidth={1.4} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.28 }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: c.text, marginBottom: 8, letterSpacing: '-0.03em' }}>העגלה ריקה</p>
                <p style={{ fontSize: 15, color: c.text3, marginBottom: 32, lineHeight: 1.55 }}>הוסף מוצרים מהקטלוג כדי להתחיל</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/catalog')} style={{
                    background: 'linear-gradient(135deg, #007AFF, #0063CC)', color: '#fff', border: 'none',
                    borderRadius: 16, padding: '15px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 6px 24px rgba(0,122,255,0.30)',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    WebkitTapHighlightColor: 'transparent',
                }}>
                    לקטלוג המוצרים <ChevronLeft size={16} />
                </motion.button>
            </motion.div>
        </div>
    );

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 24, background: c.bg, minHeight: '100dvh' }}>

            {/* ── Personalized greeting ───────────────────────────────── */}
            {firstName && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: '14px 20px 0', direction: 'rtl' }}
                >
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#007AFF', letterSpacing: '-0.01em' }}>
                        שלום {firstName}, מה אנחנו קונים היום? 🛍️
                    </p>
                </motion.div>
            )}

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 2px' }}>
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { haptic('light'); setShowClearConfirm(true); }}
                    style={{ background: 'none', border: 'none', color: '#FF3B30', fontSize: 13, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', padding: '8px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}
                >
                    נקה עגלה
                </motion.button>
                <p style={{ fontSize: 13, color: c.text3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {cartItems.length} {cartItems.length === 1 ? 'פריט' : 'פריטים'}
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        החלק למחיקה
                    </span>
                </p>
            </div>

            {/* ── Items list ─────────────────────────────────────────── */}
            <div style={{ background: c.surface, margin: '10px 16px', borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                <AnimatePresence>
                    {visibleItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                        >
                            <SwipeableItem
                                item={item}
                                i={i}
                                last={i === visibleItems.length - 1}
                                c={c}
                                onDelete={() => stageDelete(item)}
                                onNavigate={navigate}
                                onIncrease={increaseQuantity}
                                onDecrease={decreaseQuantity}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Order summary ──────────────────────────────────────── */}
            <div style={{ background: c.surface, margin: '0 16px 16px', borderRadius: 20, padding: '18px 20px', boxShadow: c.cardShadow }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: c.text, marginBottom: 14, letterSpacing: '-0.02em' }}>
                    סיכום הזמנה
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                            ₪{Math.round(subtotal).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 14, color: c.text3 }}>סכום ביניים</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                            ₪{Math.round(vatAmount).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 14, color: c.text3 }}>מע"מ (17%)</span>
                    </div>
                    <div style={{ height: '0.5px', background: c.divider, margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: c.text, letterSpacing: '-0.03em' }}>
                            ₪{Math.round(total).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>סה"כ לתשלום</span>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { haptic('medium'); navigate('/checkout'); }}
                    style={{
                        width: '100%', height: 54, borderRadius: 16, marginTop: 18,
                        background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 6px 24px rgba(0,122,255,0.30)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                >
                    לתשלום <ChevronLeft size={18} />
                </motion.button>

                <button onClick={() => navigate('/catalog')} style={{
                    width: '100%', padding: '12px', marginTop: 6,
                    background: 'none', border: 'none',
                    color: '#007AFF', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                    המשך קנייה
                </button>
            </div>

            {showClearConfirm && (
                <ClearCartSheet
                    c={c}
                    onConfirm={() => {
                        if (pendingDelete) { clearTimeout(pendingDelete.timer); setPendingDelete(null); }
                        clearCart();
                        setShowClearConfirm(false);
                    }}
                    onCancel={() => setShowClearConfirm(false)}
                />
            )}

            {/* Undo toast — shown for 4s after swipe-to-delete */}
            <AnimatePresence>
                {pendingDelete && (
                    <UndoToast key="undo" item={pendingDelete.item} onUndo={handleUndo} />
                )}
            </AnimatePresence>
        </div>
    );
}
