import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ChevronDown, Check, Send, Scale } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
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

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
            <button onClick={() => setOpen(v => !v)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0', background: 'none', border: 'none',
                cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                WebkitTapHighlightColor: 'transparent',
            }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>{title}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={17} color="#AEAEB2" />
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
function QASection({ productId }) {
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
                productId,
                author:    form.author,
                question:  form.question,
                timestamp: serverTimestamp(),
                status:    'pending',
                answers:   [],
            });
            setSent(true);
            setForm({ author: '', question: '' });
            setTimeout(() => setSent(false), 3500);
        } catch {}
        setSending(false);
    }, [form, productId]);

    const inputBase = {
        padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid rgba(0,0,0,0.08)',
        background: '#F2F2F7', fontSize: 14,
        direction: 'rtl', fontFamily: SF,
        outline: 'none', color: '#1D1D1F',
        width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    };

    return (
        <div>
            {loading ? (
                <div style={{ padding: '4px 0 12px' }}>
                    {[1, 2].map(i => <div key={i} style={{ height: 56, background: '#F2F2F7', borderRadius: 10, marginBottom: 8 }} />)}
                </div>
            ) : questions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#86868B', padding: '4px 0 12px', lineHeight: 1.5 }}>
                    אין שאלות עדיין — שאל את הראשון!
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {questions.map(q => (
                        <div key={q.id} style={{ background: '#F2F2F7', borderRadius: 12, padding: '12px 14px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', marginBottom: 3, lineHeight: 1.4 }}>{q.question}</p>
                            <p style={{ fontSize: 11, color: '#86868B', marginBottom: q.answers?.length ? 10 : 0 }}>{q.author}</p>
                            {q.answers?.map((a, i) => (
                                <div key={i} style={{ background: 'rgba(52,199,89,0.07)', border: '0.5px solid rgba(52,199,89,0.18)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                                    <p style={{ fontSize: 10, color: '#34C759', fontWeight: 800, marginBottom: 3, letterSpacing: '0.02em' }}>תשובת NextClass</p>
                                    <p style={{ fontSize: 13, color: '#1D1D1F', lineHeight: 1.5 }}>{a.text}</p>
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
                            style={{
                                width: 46, borderRadius: 10, flexShrink: 0, alignSelf: 'stretch',
                                background: (!form.author || !form.question) ? '#E5E5EA' : '#007AFF',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                WebkitTapHighlightColor: 'transparent',
                                transition: 'background 0.15s',
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

    const product    = getActiveProductById(id);
    const wishlisted = isInWishlist(id);
    const inCompare  = isSelected(id);
    const [added, setAdded] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        if (id) trackRecentlyViewed(id);
        window.scrollTo(0, 0);
    }, [id]);

    const related = activeProducts
        .filter(p => p.category === product?.category && String(p.id) !== String(id))
        .slice(0, 6);

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
        setTimeout(() => setAdded(false), 2200);
    };

    const displayPrice = product.salePrice || product.price;
    const discount = product.salePrice && product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0;

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: '#F2F2F7', minHeight: '100vh', paddingBottom: 110 }}>

            {/* ── Hero Image ─────────────────────────────────────────── */}
            <div style={{
                width: '100%', aspectRatio: '4/3',
                background: 'linear-gradient(145deg, #F8F8FA, #EFEFEF)',
                overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {product.image ? (
                    <>
                        {!imgLoaded && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'linear-gradient(90deg, #F2F2F7 25%, #E5E5EA 50%, #F2F2F7 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.4s infinite',
                            }} />
                        )}
                        <img
                            src={product.image}
                            alt={product.title}
                            onLoad={() => setImgLoaded(true)}
                            style={{
                                width: '85%', height: '85%',
                                objectFit: 'contain',
                                opacity: imgLoaded ? 1 : 0,
                                transition: 'opacity 0.3s',
                            }}
                        />
                        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                    </>
                ) : (
                    <span style={{ fontSize: 72, opacity: 0.25 }}>🖥️</span>
                )}

                {/* Badges overlay */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 5 }}>
                    {product.isNew && (
                        <span style={{ background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>חדש</span>
                    )}
                    {product._isBestSeller && (
                        <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>מובחר</span>
                    )}
                    {discount > 0 && (
                        <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>-{discount}%</span>
                    )}
                </div>

                {/* Wishlist button */}
                <motion.button
                    whileTap={{ scale: 0.78 }}
                    onClick={() => toggleWishlist(product)}
                    style={{
                        position: 'absolute', top: 12, left: 14,
                        width: 40, height: 40, borderRadius: 99,
                        background: wishlisted ? 'rgba(255,45,85,0.12)' : 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(16px)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'background 0.18s',
                    }}
                >
                    <Heart size={18} fill={wishlisted ? '#FF2D55' : 'none'} color={wishlisted ? '#FF2D55' : '#3C3C43'} strokeWidth={2} />
                </motion.button>
            </div>

            {/* ── Info Card ─────────────────────────────────────────────── */}
            <div style={{ background: '#fff', marginBottom: 10, padding: '18px 18px 20px' }}>
                {product.category && (
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        marginBottom: 10, letterSpacing: '0.02em',
                    }}>
                        {product.category}
                    </span>
                )}
                <h1 style={{ fontSize: 21, fontWeight: 900, color: '#1D1D1F', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 10 }}>
                    {product.title}
                </h1>
                {product.sku && (
                    <p style={{ fontSize: 11, color: '#AEAEB2', fontFamily: 'monospace', marginBottom: 10 }}>SKU: {product.sku}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.03em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 16, color: '#AEAEB2', textDecoration: 'line-through' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>
                {product.description && (
                    <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.65, fontWeight: 400 }}>
                        {product.description}
                    </p>
                )}
            </div>

            {/* ── Accordion Sections ────────────────────────────────────── */}
            {product.specs?.length > 0 && (
                <div style={{ background: '#fff', marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="מפרט טכני" defaultOpen>
                        {product.specs.map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                padding: '10px 0',
                                borderBottom: i < product.specs.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 14, color: '#1D1D1F', fontWeight: 500, textAlign: 'left' }}>{s.value}</span>
                                <span style={{ fontSize: 12, color: '#86868B', flexShrink: 0 }}>{s.label}</span>
                            </div>
                        ))}
                    </Accordion>
                </div>
            )}

            {product.features?.length > 0 && (
                <div style={{ background: '#fff', marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="תכונות בולטות">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {product.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <Check size={10} color="#34C759" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.45 }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {product.warranty && (
                <div style={{ background: '#fff', marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="אחריות ותנאים">
                        <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.65 }}>{product.warranty}</p>
                    </Accordion>
                </div>
            )}

            {/* ── Q&A ──────────────────────────────────────────────────── */}
            <div style={{ background: '#fff', marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="שאלות ותשובות">
                    <QASection productId={id} />
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
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>מוצרים דומים</h2>
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
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                borderTop: '0.5px solid rgba(0,0,0,0.09)',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                {/* Price */}
                <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: '#86868B', fontWeight: 500, marginBottom: 1 }}>מחיר</div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1 }}>
                        ₪{displayPrice?.toLocaleString()}
                    </div>
                </div>

                {/* Compare */}
                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => addToCompare(product)}
                    style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: inCompare ? 'rgba(88,86,214,0.10)' : 'rgba(0,0,0,0.05)',
                        border: inCompare ? '1.5px solid rgba(88,86,214,0.25)' : '1.5px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.18s',
                    }}
                >
                    <Scale size={18} color={inCompare ? '#5856D6' : '#86868B'} strokeWidth={1.8} />
                </motion.button>

                {/* Add to cart */}
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
                        boxShadow: added
                            ? '0 4px 20px rgba(52,199,89,0.35)'
                            : '0 4px 18px rgba(0,122,255,0.30)',
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
