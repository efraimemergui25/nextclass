import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileProductCard({ product, size = 'md' }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const wishlisted = isWishlisted(product.id);
    const isSmall = size === 'sm';

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product);
    };

    return (
        <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 36 }}
            onClick={() => navigate(`/catalog/${product.id}`)}
            style={{
                background: '#fff',
                borderRadius: isSmall ? 14 : 16,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
                width: isSmall ? 148 : '100%',
                flexShrink: isSmall ? 0 : undefined,
                fontFamily: SF,
                direction: 'rtl',
            }}
        >
            {/* Badges */}
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 100 }}>
                {product.isNew && (
                    <span style={{ background: '#007AFF', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>חדש</span>
                )}
                {product._isBestSeller && (
                    <span style={{ background: '#FF9500', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>מובחר</span>
                )}
                {product.salePrice && (
                    <span style={{ background: '#FF3B30', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>מבצע</span>
                )}
            </div>

            {/* Wishlist */}
            <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                style={{
                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                    background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
                    border: 'none', borderRadius: 99,
                    width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
            >
                <Heart
                    size={13}
                    fill={wishlisted ? '#FF2D55' : 'none'}
                    color={wishlisted ? '#FF2D55' : 'rgba(60,60,67,0.55)'}
                    strokeWidth={2}
                />
            </motion.button>

            {/* Image */}
            <div style={{ width: '100%', aspectRatio: '1/1', background: 'linear-gradient(135deg,#F2F2F7,#E5E5EA)', overflow: 'hidden' }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        loading="lazy"
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🖥️</div>
                )}
            </div>

            {/* Info */}
            <div style={{ padding: isSmall ? '8px 10px 10px' : '10px 12px 12px' }}>
                <p style={{
                    fontSize: isSmall ? 12 : 13,
                    fontWeight: 600,
                    color: '#1D1D1F',
                    lineHeight: 1.35,
                    marginBottom: 5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {product.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: isSmall ? 7 : 9 }}>
                    {product.salePrice ? (
                        <>
                            <span style={{ fontSize: isSmall ? 13 : 15, fontWeight: 800, color: '#FF3B30' }}>
                                ₪{product.salePrice.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 10, color: '#AEAEB2', textDecoration: 'line-through' }}>
                                ₪{product.price?.toLocaleString()}
                            </span>
                        </>
                    ) : (
                        <span style={{ fontSize: isSmall ? 13 : 15, fontWeight: 800, color: '#1D1D1F' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleAdd}
                    style={{
                        width: '100%',
                        height: isSmall ? 30 : 34,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff',
                        border: 'none',
                        fontSize: isSmall ? 11 : 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        letterSpacing: '-0.01em',
                    }}
                >
                    <Plus size={12} strokeWidth={3} />
                    הוסף לעגלה
                </motion.button>
            </div>
        </motion.div>
    );
}
