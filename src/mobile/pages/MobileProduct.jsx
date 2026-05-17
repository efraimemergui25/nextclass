import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ShoppingBag, ChevronDown, Check, Send, Scale, Share2 } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function trackRecentlyViewed(id) {
    try {
        const key  = 'nc_recently_viewed';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const next = [id, ...prev.filter(x => x !== id)].slice(0, 8);
        localStorage.setItem(key, JSON.stringify(next));
    } catch {}
}

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images, alt }) {
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded]   = useState({});
    const dragX = useMotionValue(0);
    const count = images.length;

    const goTo = (i) => setCurrent(Math.max(0, Math.min(count - 1, i)));

    const handleDragEnd = (_, { offset, velocity }) => {
        if (offset.x < -40 || velocity.x < -200) goTo(current + 1);
        else if (offset.x > 40 || velocity.x > 200) goTo(current - 1);
        dragX.set(0);
    };

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: 'linear-gradient(145deg, #F8F8FA, #EFEFEF)' }}>
            <motion.div
                drag={count > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                style={{ x: dragX, display: 'flex', width: `${count * 100}%` }}
                animate={{ x: `-${(current / count) * 100}%` }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
                {images.map((src, i) => (
                    <div key={i} style={{
                        width: `${100 / count}%`, flexShrink: 0,
                        aspectRatio: '4/3', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {!loaded[i] && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.4s infinite',
                            }} />
                        )}
                        <img
                            src={src}
                            alt={`${alt} ${i + 1}`}
                            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
                            style={{
                                width: '85%', height: '85%', objectFit: 'contain',
                                opacity: loaded[i] ? 1 : 0, transition: 'opacity 0.3s',
                                userSelect: 'none', WebkitUserSelect: 'none',
                            }}
                            draggable={false}
                        />
                    </div>
                ))}
            </motion.div>

            {/* Dots */}
            {count > 1 && (
                <div style={{
                    position: 'absolute', bottom: 10, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: 5, pointerEvents: 'none',
                }}>
                    {images.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ width: i === current ? 18 : 6, background: i === current ? '#007AFF' : 'rgba(0,0,0,0.25)' }}
                            style={{ height: 6, borderRadius: 99 }}
                        />
                    ))}
                </div>
            )}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
    );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false, c }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: `0.5px solid ${c.divider}` }}>
            <button onClick={() => setOpen(v => !v)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0', background: 'none', border: 'none',
                cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                WebkitTapHighlightColor: 'transparent',
            }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{title}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={17} color={c.text4} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingBottom: 16 }}>{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Q&A Section ──────────────────────────────────────────────────────────────
function QASection({ productId, c }) {
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [form,      setForm]      = useState({ author: '', question: '' });
    const [sending,   setSending]   = useState(false);
    const [sent,      setSent]      = useState(false);

    useEffect(() => {
        getDocs(query(
            collection(db, 'product_questions'),
            where('productId', '==', productId),
            orderBy('timestamp', 'desc')
        )).then(snap => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [productId]);

    const handleSubmit = useCallback(async () => {
        if (!form.author.trim() || !form.question.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'product_questions'), {
                productId, author: form.author, question: form.question,
                timestamp: serverTimestamp(), status: 'pending', answers: [],
            });
            haptic('success');
            setSent(true);
            setForm({ author: '', question: '' });
            setTimeout(() => setSent(false), 3500);
        } catch {}
        setSending(false);
    }, [form, productId]);

    const inputBase = {
        padding: '11px 14px', borderRadius: 10,
        border: `1.5px solid ${c.divider}`,
        background: c.input, fontSize: 14,
        direction: 'rtl', fontFamily: SF, outline: 'none', color: c.text,
        width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
    };

    return (
        <div>
            {loading ? (
                <div style={{ padding: '4px 0 12px' }}>
                    {[1, 2].map(i => <div key={i} style={{ height: 56, background: c.surface2, borderRadius: 10, marginBottom: 8 }} />)}
                </div>
            ) : questions.length === 0 ? (
                <p style={{ fontSize: 13, color: c.text3, padding: '4px 0 12px', lineHeight: 1.5 }}>
                    אין שאלות עדיין — שאל את הראשון!
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {questions.map(q => (
                        <div key={q.id} style={{ background: c.surface2, borderRadius: 12, padding: '12px 14px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3, lineHeight: 1.4 }}>{q.question}</p>
                            <p style={{ fontSize: 11, color: c.text3, marginBottom: q.answers?.length ? 10 : 0 }}>{q.author}</p>
                            {q.answers?.map((a, i) => (
                                <div key={i} style={{ background: 'rgba(52,199,89,0.07)', border: '0.5px solid rgba(52,199,89,0.18)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                                    <p style={{ fontSize: 10, color: '#34C759', fontWeight: 800, marginBottom: 3 }}>תשובת NextClass</p>
                                    <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5 }}>{a.text}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {sent ? (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(52,199,89,0.08)', borderRadius: 10, color: '#34C759', fontSize: 14, fontWeight: 700 }}
                >
                    <Check size={15} strokeWidth={3} /> השאלה נשלחה — נענה בהקדם
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        placeholder="השם שלך"
                        style={inputBase}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                            value={form.question}
                            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                            placeholder="כתוב שאלה..."
                            rows={2}
                            style={{ ...inputBase, flex: 1, resize: 'none' }}
                        />
                        <motion.button
                            whileTap={{ scale: 0.86 }}
                            onClick={handleSubmit}
                            disabled={sending || !form.author || !form.question}
                            aria-label="שלח שאלה"
                            style={{
                                width: 46, borderRadius: 10, flexShrink: 0, alignSelf: 'stretch',
                                background: (!form.author || !form.question) ? c.surface2 : '#007AFF',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                WebkitTapHighlightColor: 'transparent', transition: 'background 0.15s',
                            }}
                        >
                            <Send size={16} />
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MobileProduct() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { getActiveProductById, activeProducts } = useProducts();
    const { addToCart }                            = useCart();
    const { toggleWishlist, isInWishlist }         = useWishlist();
    const { addToCompare, isSelected }             = useCompare();
    const { colors: c }                            = useTheme();

    const product    = getActiveProductById(id);
    const wishlisted = isInWishlist(id);
    const inCompare  = isSelected(id);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        if (id) trackRecentlyViewed(id);
        window.scrollTo(0, 0);
    }, [id]);

    const related = activeProducts
        .filter(p => p.category === product?.category && String(p.id) !== String(id))
        .slice(0, 6);

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100vh' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 8 }}>מוצר לא נמצא</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
                לקטלוג
            </button>
        </div>
    );

    const handleAdd = () => {
        haptic('success');
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2200);
    };

    const handleWishlist = () => {
        haptic(wishlisted ? 'light' : 'medium');
        toggleWishlist(product);
    };

    const handleCompare = () => {
        haptic('light');
        addToCompare(product);
    };

    const handleShare = async () => {
        haptic('light');
        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.title,
                    text: `${product.title} — ₪${displayPrice?.toLocaleString()} | NextClass`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch {}
    };

    const displayPrice = product.salePrice || product.price;
    const discount = product.salePrice && product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0;

    const images = product.images?.length ? product.images : (product.image ? [product.image] : []);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100vh', paddingBottom: 110 }}>

            {/* ── Hero Image / Carousel ──────────────────────────────── */}
            <div style={{ position: 'relative' }}>
                {images.length > 0 ? (
                    <ImageCarousel images={images} alt={product.title} />
                ) : (
                    <div style={{ width: '100%', aspectRatio: '4/3', background: `linear-gradient(145deg, ${c.shimmerA}, ${c.shimmerB})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 72, opacity: 0.25 }}>🖥️</span>
                    </div>
                )}

                {/* Badges overlay */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 5 }}>
                    {product.isNew && <span style={{ background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>חדש</span>}
                    {product._isBestSeller && <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>מובחר</span>}
                    {discount > 0 && <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>-{discount}%</span>}
                </div>

                {/* Action buttons (share + wishlist) */}
                <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 8 }}>
                    <motion.button
                        whileTap={{ scale: 0.78 }}
                        onClick={handleShare}
                        aria-label="שתף מוצר"
                        style={{
                            width: 40, height: 40, borderRadius: 99,
                            background: c.wishlistBg,
                            backdropFilter: 'blur(16px)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Share2 size={16} color={c.text2} strokeWidth={2} />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.78 }}
                        onClick={handleWishlist}
                        aria-label={wishlisted ? `הסר ${product.title} מהמועדפים` : `הוסף ${product.title} למועדפים`}
                        style={{
                            width: 40, height: 40, borderRadius: 99,
                            background: wishlisted ? 'rgba(255,45,85,0.12)' : c.wishlistBg,
                            backdropFilter: 'blur(16px)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                            WebkitTapHighlightColor: 'transparent', transition: 'background 0.18s',
                        }}
                    >
                        <Heart size={18} fill={wishlisted ? '#FF2D55' : 'none'} color={wishlisted ? '#FF2D55' : c.text2} strokeWidth={2} />
                    </motion.button>
                </div>
            </div>

            {/* ── Info Card ─────────────────────────────────────────────── */}
            <div style={{ background: c.surface, marginBottom: 10, padding: '18px 18px 20px' }}>
                {product.category && (
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        marginBottom: 10,
                    }}>
                        {product.category}
                    </span>
                )}
                <h1 style={{ fontSize: 21, fontWeight: 900, color: c.text, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 10 }}>
                    {product.title}
                </h1>
                {product.sku && (
                    <p style={{ fontSize: 11, color: c.text4, fontFamily: 'monospace', marginBottom: 10 }}>SKU: {product.sku}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: product.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.03em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 16, color: c.text4, textDecoration: 'line-through' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>
                {product.description && (
                    <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65 }}>
                        {product.description}
                    </p>
                )}
            </div>

            {/* ── Accordion Sections ────────────────────────────────────── */}
            {product.specs?.length > 0 && (
                <div style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="מפרט טכני" defaultOpen c={c}>
                        {product.specs.map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                padding: '10px 0',
                                borderBottom: i < product.specs.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 14, color: c.text, fontWeight: 500, textAlign: 'left' }}>{s.value}</span>
                                <span style={{ fontSize: 12, color: c.text3, flexShrink: 0 }}>{s.label}</span>
                            </div>
                        ))}
                    </Accordion>
                </div>
            )}

            {product.features?.length > 0 && (
                <div style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="תכונות בולטות" c={c}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {product.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <Check size={10} color="#34C759" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 14, color: c.text2, lineHeight: 1.45 }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {product.warranty && (
                <div style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="אחריות ותנאים" c={c}>
                        <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65 }}>{product.warranty}</p>
                    </Accordion>
                </div>
            )}

            {/* ── Q&A ──────────────────────────────────────────────────── */}
            <div style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="שאלות ותשובות" c={c}>
                    <QASection productId={id} c={c} />
                </Accordion>
            </div>

            {/* ── Related Products ─────────────────────────────────────── */}
            {related.length > 0 && (
                <section style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate(`/catalog?category=${encodeURIComponent(product.category)}`)}
                            style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            ראה הכל
                        </button>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>מוצרים דומים</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {related.map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Sticky Buy Bar ────────────────────────────────────────── */}
            <div style={{
                position: 'fixed',
                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                left: 0, right: 0, zIndex: 150,
                background: c.navBg,
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderTop: `0.5px solid ${c.border}`,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: c.text3, fontWeight: 500, marginBottom: 1 }}>מחיר</div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: product.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        ₪{displayPrice?.toLocaleString()}
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={handleCompare}
                    aria-label={inCompare ? `הסר ${product.title} מהשוואה` : `הוסף ${product.title} להשוואה`}
                    style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: inCompare ? 'rgba(88,86,214,0.10)' : c.subtleBg,
                        border: inCompare ? '1.5px solid rgba(88,86,214,0.25)' : '1.5px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'all 0.18s',
                    }}
                >
                    <Scale size={18} color={inCompare ? '#5856D6' : c.text3} strokeWidth={1.8} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    style={{
                        flex: 1, height: 48, borderRadius: 14,
                        background: added
                            ? 'linear-gradient(135deg, #34C759, #28A745)'
                            : 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 16, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        letterSpacing: '-0.02em',
                        boxShadow: added ? '0 4px 20px rgba(52,199,89,0.35)' : '0 4px 18px rgba(0,122,255,0.30)',
                        transition: 'background 0.22s, box-shadow 0.22s',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {added ? (
                            <motion.span key="done" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={17} strokeWidth={3} /> נוסף לעגלה!
                            </motion.span>
                        ) : (
                            <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ShoppingBag size={17} strokeWidth={2} /> הוסף לעגלה
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
