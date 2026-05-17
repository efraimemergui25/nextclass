import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Scale, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileProductCard({ product, size = 'md' }) {
    const navigate = useNavigate();
    const { addToCart }                          = useCart();
    const { toggleWishlist, isInWishlist }       = useWishlist();
    const { addToCompare, isSelected }           = useCompare();
    const [addedToCart, setAddedToCart]          = useState(false);

    const wishlisted = isInWishlist(product.id);
    const inCompare  = isSelected(product.id);
    const isSmall    = size === 'sm';

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1800);
    };
    const handleWishlist = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
    };
    const handleCompare = (e) => {
        e.stopPropagation();
        addToCompare(product);
    };

    const displayPrice = product.salePrice || product.price;
    const discount = product.salePrice && product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0;

    return (
        <motion.div
            whileTap={{ scale: 0.965 }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            onClick={() => navigate(`/catalog/${product.id}`)}
            style={{
                background: '#fff',
                borderRadius: isSmall ? 14 : 18,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
                width: isSmall ? 152 : '100%',
                flexShrink: isSmall ? 0 : undefined,
                fontFamily: SF,
                direction: 'rtl',
            }}
        >
            {/* ── Badges ───────────────────────────────────────────────── */}
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {product.isNew && (
                    <span style={{ background: '#007AFF', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.02em' }}>חדש</span>
                )}
                {product._isBestSeller && (
                    <span style={{ background: '#FF9500', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>מובחר</span>
                )}
                {discount > 0 && (
                    <span style={{ background: '#FF3B30', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>-{discount}%</span>
                )}
            </div>

            {/* ── Wishlist button ───────────────────────────────────────── */}
            <motion.button
                whileTap={{ scale: 0.72 }}
                onClick={handleWishlist}
                style={{
                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                    background: wishlisted ? 'rgba(255,45,85,0.12)' : 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(12px)',
                    border: 'none', borderRadius: 99,
                    width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                    transition: 'background 0.18s',
                }}
            >
                <Heart
                    size={14}
                    fill={wishlisted ? '#FF2D55' : 'none'}
                    color={wishlisted ? '#FF2D55' : 'rgba(60,60,67,0.50)'}
                    strokeWidth={2}
                />
            </motion.button>

            {/* ── Image ────────────────────────────────────────────────── */}
            <div style={{
                width: '100%', aspectRatio: '1/1',
                background: 'linear-gradient(145deg, #F8F8FA, #EFEFEF)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                        loading="lazy"
                    />
                ) : (
                    <span style={{ fontSize: isSmall ? 30 : 40, opacity: 0.4 }}>🖥️</span>
                )}
            </div>

            {/* ── Info ─────────────────────────────────────────────────── */}
            <div style={{ padding: isSmall ? '8px 10px 10px' : '10px 12px 12px' }}>
                {product.category && !isSmall && (
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#007AFF', marginBottom: 4, letterSpacing: '0.02em' }}>
                        {product.category}
                    </p>
                )}
                <p style={{
                    fontSize: isSmall ? 12 : 13,
                    fontWeight: 600, color: '#1D1D1F',
                    lineHeight: 1.35, marginBottom: 6,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {product.title}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: isSmall ? 8 : 10 }}>
                    <span style={{ fontSize: isSmall ? 14 : 16, fontWeight: 800, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 10, color: '#AEAEB2', textDecoration: 'line-through' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* ── Add to cart button ──────────────────────────────── */}
                <motion.button
                    whileTap={{ scale: 0.90 }}
                    onClick={handleAdd}
                    style={{
                        width: '100%', height: isSmall ? 32 : 36,
                        borderRadius: 10,
                        background: addedToCart
                            ? 'linear-gradient(135deg, #34C759, #28A745)'
                            : 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: isSmall ? 11 : 12, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        letterSpacing: '-0.01em',
                        marginBottom: isSmall ? 0 : 6,
                        transition: 'background 0.2s',
                        boxShadow: addedToCart ? '0 2px 10px rgba(52,199,89,0.3)' : '0 2px 8px rgba(0,122,255,0.22)',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {addedToCart ? (
                            <motion.span key="done" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={11} strokeWidth={3} /> נוסף!
                            </motion.span>
                        ) : (
                            <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ShoppingBag size={11} strokeWidth={2} />
                                הוסף לעגלה
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>

                {/* ── Compare button (md only) ────────────────────────── */}
                {!isSmall && (
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={handleCompare}
                        style={{
                            width: '100%', height: 28, borderRadius: 8,
                            background: inCompare ? 'rgba(88,86,214,0.10)' : 'rgba(0,0,0,0.04)',
                            color: inCompare ? '#5856D6' : '#86868B',
                            border: inCompare ? '1px solid rgba(88,86,214,0.2)' : '1px solid transparent',
                            fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            transition: 'all 0.18s',
                        }}
                    >
                        <Scale size={11} strokeWidth={2} />
                        {inCompare ? '✓ בהשוואה' : 'השווה'}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
}
