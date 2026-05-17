import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ChevronDown, Check, Share2 } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function Accordion({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', background: 'none', border: 'none',
                    cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>{title}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
                    <ChevronDown size={18} color="#AEAEB2" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingBottom: 16 }}>{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MobileProduct() {
    const { id }     = useParams();
    const navigate   = useNavigate();
    const { getActiveProductById } = useProducts();
    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();

    const product   = getActiveProductById(id);
    const wishlisted = isWishlisted(id);
    const inCart    = cartItems.some(i => String(i.id) === String(id));
    const [added, setAdded] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [id]);

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>מוצר לא נמצא</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
                לקטלוג
            </button>
        </div>
    );

    const handleAdd = () => {
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const displayPrice = product.salePrice || product.price;

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: '#F2F2F7', minHeight: '100vh', paddingBottom: 96 }}>

            {/* ── Product image ──────────────────────────────────────── */}
            <div style={{
                width: '100%', height: 280, background: '#fff',
                overflow: 'hidden', position: 'relative',
            }}>
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: '#F2F2F7' }}>
                        🖥️
                    </div>
                )}

                {/* Badges overlay */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                    {product.isNew && (
                        <span style={{ background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>חדש</span>
                    )}
                    {product._isBestSeller && (
                        <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>מובחר</span>
                    )}
                </div>

                {/* Wishlist + Share */}
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => toggleWishlist(product)}
                        style={{
                            width: 36, height: 36, borderRadius: 99,
                            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Heart size={16} fill={wishlisted ? '#FF2D55' : 'none'} color={wishlisted ? '#FF2D55' : '#1D1D1F'} strokeWidth={2} />
                    </motion.button>
                </div>
            </div>

            {/* ── Info card ──────────────────────────────────────────── */}
            <div style={{ background: '#fff', margin: '0 0 12px', padding: '20px 18px' }}>
                {/* Category */}
                <span style={{
                    display: 'inline-block',
                    background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    marginBottom: 10, letterSpacing: '-0.01em',
                }}>
                    {product.category}
                </span>

                {/* Title */}
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 12 }}>
                    {product.title}
                </h1>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 16, color: '#AEAEB2', textDecoration: 'line-through', fontWeight: 500 }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Description */}
                {product.description && (
                    <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.6, fontWeight: 400 }}>
                        {product.description}
                    </p>
                )}
            </div>

            {/* ── Specs accordion ────────────────────────────────────── */}
            {product.specs?.length > 0 && (
                <div style={{ background: '#fff', margin: '0 0 12px', padding: '4px 18px' }}>
                    <Accordion title="מפרט טכני" defaultOpen={true}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {product.specs.map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    padding: '10px 0',
                                    borderBottom: i < product.specs.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                                }}>
                                    <span style={{ fontSize: 14, color: '#1D1D1F', fontWeight: 500, maxWidth: '55%', textAlign: 'left' }}>{s.value}</span>
                                    <span style={{ fontSize: 13, color: '#86868B', fontWeight: 400 }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {/* ── Features accordion ─────────────────────────────────── */}
            {product.features?.length > 0 && (
                <div style={{ background: '#fff', margin: '0 0 12px', padding: '4px 18px' }}>
                    <Accordion title="תכונות בולטות">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {product.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <Check size={11} color="#34C759" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.4 }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {/* ── Warranty accordion ─────────────────────────────────── */}
            {product.warranty && (
                <div style={{ background: '#fff', margin: '0 0 12px', padding: '4px 18px' }}>
                    <Accordion title="אחריות ותנאים">
                        <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.6 }}>{product.warranty}</p>
                    </Accordion>
                </div>
            )}

            {/* ── Sticky bottom buy bar ──────────────────────────────── */}
            <div style={{
                position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                left: 0, right: 0, zIndex: 150,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(24px)',
                borderTop: '0.5px solid rgba(0,0,0,0.1)',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                direction: 'rtl',
            }}>
                <div>
                    <div style={{ fontSize: 11, color: '#86868B', fontWeight: 500 }}>מחיר</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    style={{
                        flex: 1, height: 50, borderRadius: 16,
                        background: added ? '#34C759' : 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 16, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.25s',
                        letterSpacing: '-0.02em',
                        boxShadow: added ? '0 4px 20px rgba(52,199,89,0.35)' : '0 4px 20px rgba(0,122,255,0.35)',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {added ? (
                            <motion.span key="done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={18} strokeWidth={3} /> נוסף לעגלה!
                            </motion.span>
                        ) : (
                            <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ShoppingBag size={18} /> הוסף לעגלה
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
