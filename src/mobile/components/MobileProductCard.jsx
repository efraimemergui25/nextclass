import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Heart, ShoppingBag, Scale, Check, Share2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import useLongPress from '../hooks/useLongPress';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;
const GENERIC_FALLBACK = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='%23f5f5f7'/><g opacity='0.25' transform='translate(400,300)'><rect x='-44' y='-32' width='88' height='64' rx='10' stroke='%23aeaeb2' stroke-width='3.5' fill='none'/><circle cx='-14' cy='-7' r='9' stroke='%23aeaeb2' stroke-width='2.5' fill='none'/><polyline points='-30,22 -10,2 8,16 24,-4 44,22' stroke='%23aeaeb2' stroke-width='2.5' fill='none' stroke-linejoin='round' stroke-linecap='round'/></g></svg>";

// ─── Heart burst particles ────────────────────────────────────────────────────
function HeartBurst({ visible }) {
    if (!visible) return null;
    return (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, pointerEvents: 'none' }}>
            {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i / 6) * 360;
                const rad = (angle * Math.PI) / 180;
                const tx = Math.cos(rad) * 22;
                const ty = Math.sin(rad) * 22;
                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, scale: 0.6, opacity: 1 }}
                        animate={{ x: tx, y: ty, scale: 0, opacity: 0 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', width: 8, height: 8,
                            borderRadius: 99, background: '#FF2D55',
                        }}
                    />
                );
            })}
        </div>
    );
}

// ─── Context menu ─────────────────────────────────────────────────────────────
function ContextMenu({ product, onClose }) {
    const navigate = useNavigate();
    const { addToCart }          = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToCompare }       = useCompare();
    const { colors: c }          = useTheme();
    const wishlisted = isInWishlist(product.id);

    const items = [
        {
            label: wishlisted ? 'הסר ממועדפים' : 'הוסף למועדפים',
            Icon: Heart,
            color: '#FF2D55',
            action: () => { haptic('medium'); toggleWishlist(product); onClose(); },
        },
        {
            label: 'הוסף לעגלה',
            Icon: ShoppingCart,
            color: '#007AFF',
            action: () => { haptic('medium'); addToCart(product); onClose(); },
        },
        {
            label: 'השווה',
            Icon: Scale,
            color: '#5856D6',
            action: () => { haptic('light'); addToCompare(product); onClose(); },
        },
        {
            label: 'שתף מוצר',
            Icon: Share2,
            color: '#34C759',
            action: async () => {
                haptic('light');
                onClose();
                try {
                    await navigator.share?.({
                        title: product.title,
                        url: `${window.location.origin}/catalog/${product.id}`,
                    });
                } catch {}
            },
        },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(6px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 999,
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(0px)',
                    display: 'flex', alignItems: 'flex-end',
                }}
            >
                <motion.div
                    initial={{ y: 120 }}
                    animate={{ y: 0 }}
                    exit={{ y: 120 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', background: c.surface,
                        borderRadius: '24px 24px 0 0',
                        padding: '20px 16px',
                        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
                        fontFamily: SF, direction: 'rtl',
                    }}
                >
                    {/* Product title pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
                        padding: '10px 14px', background: c.surface2, borderRadius: 14,
                    }}>
                        {product.image && (
                            <img src={product.image} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        )}
                        <p style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {product.title}
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {items.map(({ label, Icon, color, action }) => (
                            <motion.button
                                key={label}
                                whileTap={{ scale: 0.97 }}
                                onClick={action}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    padding: '15px 16px', background: 'none', border: 'none',
                                    borderRadius: 14, cursor: 'pointer', direction: 'rtl',
                                    WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                                    width: '100%',
                                }}
                            >
                                <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={color} strokeWidth={1.9} />
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{label}</span>
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            marginTop: 8, width: '100%', height: 48, borderRadius: 14,
                            background: c.subtleBg, border: 'none',
                            fontSize: 15, fontWeight: 700, color: c.text3,
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            fontFamily: SF,
                        }}
                    >
                        ביטול
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function MobileProductCard({ product, size = 'md' }) {
    const navigate = useNavigate();
    const { addToCart }                    = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToCompare, isSelected }     = useCompare();
    const { colors: c }                    = useTheme();
    const [addedToCart, setAddedToCart]    = useState(false);
    const [burst, setBurst]                = useState(false);
    const [contextMenu, setContextMenu]    = useState(false);
    const [imgLoaded, setImgLoaded]        = useState(false);
    const [imgError, setImgError]          = useState(false);
    const [displaySrc, setDisplaySrc]      = useState(() => product.image || product._seedImage || GENERIC_FALLBACK);
    const fallbackStage                    = useRef(0);

    // Reset image state whenever the primary URL changes (Firestore real-time update)
    useEffect(() => {
        const url = product.image || product._seedImage;
        if (!url) return;
        fallbackStage.current = 0;
        setDisplaySrc(url);
        setImgLoaded(false);
        setImgError(false);
    }, [product.image, product._seedImage]);

    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { once: true, margin: '-10px' });

    const wishlisted = isInWishlist(product.id);
    const inCompare  = isSelected(product.id);
    const isSmall    = size === 'sm';

    const longPressHandlers = useLongPress(() => {
        haptic('heavy');
        setContextMenu(true);
    });

    const handleAdd = (e) => {
        e.stopPropagation();
        haptic('medium');
        addToCart(product);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 1800);
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        if (!wishlisted) {
            haptic('success');
            setBurst(true);
            setTimeout(() => setBurst(false), 600);
        } else {
            haptic('light');
        }
        toggleWishlist(product);
    };

    const handleCompare = (e) => {
        e.stopPropagation();
        haptic('light');
        addToCompare(product);
    };

    const displayPrice = product.salePrice || product.price;
    const discount = product.salePrice && product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0;

    return (
        <>
            <motion.div
                ref={cardRef}
                {...longPressHandlers}
                whileTap={{ scale: 0.965 }}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={cardInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => navigate(`/catalog/${product.id}`)}
                style={{
                    background: c.surface,
                    borderRadius: isSmall ? 14 : 18,
                    overflow: 'hidden',
                    boxShadow: c.cardShadow,
                    cursor: 'pointer',
                    position: 'relative',
                    WebkitTapHighlightColor: 'transparent',
                    width: isSmall ? 152 : '100%',
                    flexShrink: isSmall ? 0 : undefined,
                    fontFamily: SF,
                    direction: 'rtl',
                }}
            >
                {/* ── Badges ─────────────────────────────────────────────── */}
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {product.isNew && (
                        <span style={{ background: '#007AFF', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>חדש</span>
                    )}
                    {product._isBestSeller && (
                        <span style={{ background: '#FF9500', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>מובחר</span>
                    )}
                    {discount > 0 && (
                        <span style={{ background: '#FF3B30', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99 }}>-{discount}%</span>
                    )}
                </div>

                {/* ── Heart burst ────────────────────────────────────────── */}
                <HeartBurst visible={burst} />

                {/* ── Wishlist button ────────────────────────────────────── */}
                <motion.button
                    whileTap={{ scale: 0.72 }}
                    onClick={handleWishlist}
                    aria-label={wishlisted ? `הסר ${product.title} מהמועדפים` : `הוסף ${product.title} למועדפים`}
                    style={{
                        position: 'absolute', top: 4, left: 4, zIndex: 2,
                        background: wishlisted ? 'rgba(255,45,85,0.12)' : c.wishlistBg,
                        backdropFilter: 'blur(12px)',
                        border: 'none', borderRadius: 99,
                        width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        transition: 'background 0.18s',
                    }}
                >
                    <Heart
                        size={18}
                        fill={wishlisted ? '#FF2D55' : 'none'}
                        color={wishlisted ? '#FF2D55' : c.text3}
                        strokeWidth={2}
                    />
                </motion.button>

                {/* ── Image (LQIP) ───────────────────────────────────────── */}
                <div style={{
                    width: '100%', aspectRatio: '1/1',
                    background: `linear-gradient(145deg, ${c.shimmerA}, ${c.shimmerB})`,
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                }}>
                    {imgError ? (
                        <span style={{ fontSize: isSmall ? 30 : 40, opacity: 0.4 }}>🖥️</span>
                    ) : (
                        <>
                            {!imgLoaded && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`,
                                    backgroundSize: '200% 100%',
                                    animation: 'shimmer 1.4s infinite',
                                }} />
                            )}
                            <motion.img
                                src={displaySrc}
                                alt={product.title}
                                referrerPolicy="no-referrer"
                                onLoad={() => setImgLoaded(true)}
                                onError={() => {
                                    const stage = fallbackStage.current;
                                    if (stage === 0 && product._seedImage && product._seedImage !== displaySrc) {
                                        fallbackStage.current = 1;
                                        setImgLoaded(false);
                                        setDisplaySrc(product._seedImage);
                                    } else if (displaySrc !== GENERIC_FALLBACK) {
                                        // Data URI fallback — guaranteed to load
                                        fallbackStage.current = 2;
                                        setImgLoaded(false);
                                        setDisplaySrc(GENERIC_FALLBACK);
                                    }
                                    // GENERIC_FALLBACK is a data URI, cannot fail
                                }}
                                initial={{ scale: 1.08, filter: 'blur(8px)', opacity: 0 }}
                                animate={imgLoaded ? { scale: 1, filter: 'blur(0px)', opacity: 1 } : {}}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    width: '90%', height: '90%', objectFit: 'contain',
                                }}
                                loading="eager"
                            />
                            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                        </>
                    )}
                </div>

                {/* ── Info ───────────────────────────────────────────────── */}
                <div style={{ padding: isSmall ? '8px 10px 10px' : '10px 12px 12px' }}>
                    {product.category && !isSmall && (
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#007AFF', marginBottom: 4, letterSpacing: '0.02em' }}>
                            {product.category}
                        </p>
                    )}
                    <p style={{
                        fontSize: isSmall ? 12 : 13,
                        fontWeight: 600, color: c.text,
                        lineHeight: 1.35, marginBottom: 6,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {product.title}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: isSmall ? 8 : 10 }}>
                        <span style={{ fontSize: isSmall ? 14 : 16, fontWeight: 800, color: product.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.02em' }}>
                            ₪{displayPrice?.toLocaleString()}
                        </span>
                        {product.salePrice && (
                            <span style={{ fontSize: 10, color: c.text4, textDecoration: 'line-through' }}>
                                ₪{product.price?.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* ── Add to cart ────────────────────────────────────── */}
                    <motion.button
                        whileTap={{ scale: 0.90 }}
                        onClick={handleAdd}
                        style={{
                            width: '100%', height: isSmall ? 36 : 40,
                            borderRadius: 10,
                            background: addedToCart
                                ? 'linear-gradient(135deg, #34C759, #28A745)'
                                : 'linear-gradient(135deg, #007AFF, #0063CC)',
                            color: '#fff', border: 'none',
                            fontSize: isSmall ? 11 : 12, fontWeight: 700,
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
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

                    {/* ── Compare (md only) ──────────────────────────────── */}
                    {!isSmall && (
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={handleCompare}
                            aria-label={inCompare ? `הסר ${product.title} מהשוואה` : `הוסף ${product.title} להשוואה`}
                            style={{
                                width: '100%', height: 36, borderRadius: 10,
                                background: inCompare ? 'rgba(88,86,214,0.10)' : c.subtleBg,
                                color: inCompare ? '#5856D6' : c.text3,
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

            {contextMenu && (
                <ContextMenu product={product} onClose={() => setContextMenu(false)} />
            )}
        </>
    );
}
