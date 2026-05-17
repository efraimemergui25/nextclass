import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const VAT = 0.17;

export default function MobileCart() {
    const navigate = useNavigate();
    // CartContext uses `qty` (not `quantity`)
    const { cartItems, cartTotal, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

    if (cartItems.length === 0) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag size={36} color="#007AFF" strokeWidth={1.6} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', marginBottom: 8, letterSpacing: '-0.03em' }}>העגלה ריקה</p>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 28 }}>הוסף מוצרים מהקטלוג כדי להתחיל</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#007AFF', color: '#fff', border: 'none',
                borderRadius: 14, padding: '14px 28px',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
            }}>
                לקטלוג המוצרים
            </button>
        </div>
    );

    const subtotal  = cartTotal;
    const vatAmount = subtotal * VAT;
    const total     = subtotal + vatAmount;

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 24 }}>

            {/* ── Items list ─────────────────────────────────────────── */}
            <div style={{ background: '#fff', margin: '12px 16px', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <AnimatePresence>
                    {cartItems.map((item, i) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            transition={{ duration: 0.22 }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '14px 16px',
                                borderBottom: i < cartItems.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none',
                            }}>
                                {/* Image */}
                                <div style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#F2F2F7', cursor: 'pointer' }}
                                    onClick={() => navigate(`/catalog/${item.id}`)}>
                                    {item.image && (
                                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: 13, fontWeight: 700, color: '#1D1D1F',
                                        lineHeight: 1.3, marginBottom: 4,
                                        display: '-webkit-box', WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {item.title}
                                    </p>
                                    <p style={{ fontSize: 11, color: '#86868B', marginBottom: 6 }}>
                                        ₪{(item.salePrice || item.price)?.toLocaleString()} / יח׳
                                    </p>
                                    <p style={{ fontSize: 16, fontWeight: 800, color: '#1D1D1F' }}>
                                        ₪{((item.salePrice || item.price) * (item.qty || 1)).toLocaleString()}
                                    </p>
                                </div>

                                {/* Qty controls — 44px touch targets */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: '#F2F2F7', borderRadius: 12, overflow: 'hidden' }}>
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => increaseQuantity(item.id)}
                                            style={{
                                                width: 44, height: 36,
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#007AFF', WebkitTapHighlightColor: 'transparent',
                                            }}
                                        >
                                            <Plus size={15} strokeWidth={2.5} />
                                        </motion.button>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', minWidth: 24, textAlign: 'center' }}>
                                            {item.qty || 1}
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => {
                                                if ((item.qty || 1) <= 1) removeFromCart(item.id);
                                                else decreaseQuantity(item.id);
                                            }}
                                            style={{
                                                width: 44, height: 36,
                                                background: 'none', border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: (item.qty || 1) <= 1 ? '#FF3B30' : '#007AFF',
                                                WebkitTapHighlightColor: 'transparent',
                                                transition: 'color 0.15s',
                                            }}
                                        >
                                            {(item.qty || 1) <= 1
                                                ? <Trash2 size={13} strokeWidth={2} />
                                                : <Minus size={15} strokeWidth={2.5} />
                                            }
                                        </motion.button>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => removeFromCart(item.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', color: '#FF3B30', fontSize: 11, fontWeight: 600, WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        הסר
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* ── Order summary ──────────────────────────────────────── */}
            <div style={{ background: '#fff', margin: '0 16px 16px', borderRadius: 20, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 16, letterSpacing: '-0.02em' }}>
                    סיכום הזמנה
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>
                            ₪{Math.round(subtotal).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 14, color: '#86868B' }}>סכום ביניים</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>
                            ₪{Math.round(vatAmount).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 14, color: '#86868B' }}>מע"מ (17%)</span>
                    </div>
                    <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.1)', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em' }}>
                            ₪{Math.round(total).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>סה"כ לתשלום</span>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/checkout')}
                    style={{
                        width: '100%', height: 54, borderRadius: 16, marginTop: 18,
                        background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 6px 24px rgba(0,122,255,0.32)',
                    }}
                >
                    לתשלום
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
        </div>
    );
}
