import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, ChevronDown, Check, Send } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

// Track recently viewed in localStorage
function trackRecentlyViewed(id) {
    try {
        const key = 'nc_recently_viewed';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = [id, ...prev.filter(x => x !== id)].slice(0, 8);
        localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
}

function Accordion({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
            <button onClick={() => setOpen(v => !v)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 0', background: 'none', border: 'none',
                cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                WebkitTapHighlightColor: 'transparent',
            }}>
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

// Q&A Section
function QASection({ productId }) {
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [form, setForm]           = useState({ author: '', question: '' });
    const [sending, setSending]     = useState(false);
    const [sent, setSent]           = useState(false);

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
                author: form.author,
                question: form.question,
                timestamp: serverTimestamp(),
                status: 'pending',
                answers: [],
            });
            setSent(true);
            setForm({ author: '', question: '' });
            setTimeout(() => setSent(false), 3000);
        } catch {}
        setSending(false);
    }, [form, productId]);

    return (
        <div>
            {/* Questions list */}
            {loading ? (
                <div style={{ padding: '8px 0 12px', color: '#86868B', fontSize: 13 }}>טוען שאלות...</div>
            ) : questions.length === 0 ? (
                <p style={{ fontSize: 13, color: '#86868B', padding: '4px 0 12px' }}>אין שאלות עדיין — היה הראשון לשאול!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {questions.map(q => (
                        <div key={q.id} style={{ background: '#F2F2F7', borderRadius: 12, padding: '12px 14px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>{q.question}</p>
                            <p style={{ fontSize: 11, color: '#86868B', marginBottom: q.answers?.length ? 8 : 0 }}>{q.author}</p>
                            {q.answers?.map((a, i) => (
                                <div key={i} style={{ background: 'rgba(52,199,89,0.08)', border: '0.5px solid rgba(52,199,89,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                                    <p style={{ fontSize: 11, color: '#34C759', fontWeight: 700, marginBottom: 2 }}>תשובת NextClass</p>
                                    <p style={{ fontSize: 13, color: '#1D1D1F' }}>{a.text}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Ask form */}
            {sent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: '#34C759', fontSize: 14, fontWeight: 700 }}>
                    <Check size={16} strokeWidth={3} /> השאלה נשלחה — נענה בהקדם
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        placeholder="השם שלך"
                        style={{
                            padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
                            background: '#F2F2F7', fontSize: 14, direction: 'rtl', fontFamily: SF,
                            outline: 'none', color: '#1D1D1F',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                            value={form.question}
                            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                            placeholder="כתוב שאלה..."
                            rows={2}
                            style={{
                                flex: 1, padding: '11px 14px', borderRadius: 10,
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: '#F2F2F7', fontSize: 14, direction: 'rtl',
                                fontFamily: SF, resize: 'none', outline: 'none', color: '#1D1D1F',
                            }}
                        />
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            onClick={handleSubmit}
                            disabled={sending || !form.author || !form.question}
                            style={{
                                width: 44, borderRadius: 10, flexShrink: 0, alignSelf: 'stretch',
                                background: (!form.author || !form.question) ? '#E5E5EA' : '#007AFF',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                WebkitTapHighlightColor: 'transparent',
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

export default function MobileProduct() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { getActiveProductById, activeProducts } = useProducts();
    const { addToCart }                           = useCart();
    const { toggleWishlist, isInWishlist }        = useWishlist(); // ← isInWishlist (correct)

    const product  = getActiveProductById(id);
    const wishlisted = isInWishlist(id);
    const [added, setAdded] = useState(false);

    // Track recently viewed
    useEffect(() => {
        if (id) trackRecentlyViewed(id);
        window.scrollTo(0, 0);
    }, [id]);

    // Related products: same category, exclude self
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
        setTimeout(() => setAdded(false), 2000);
    };

    const displayPrice = product.salePrice || product.price;

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: '#F2F2F7', minHeight: '100vh', paddingBottom: 100 }}>

            {/* ── Product image ──────────────────────────────────────── */}
            <div style={{ width: '100%', height: 280, background: '#fff', overflow: 'hidden', position: 'relative' }}>
                {product.image ? (
                    <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: '#F2F2F7' }}>🖥️</div>
                )}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 5 }}>
                    {product.isNew && <span style={{ background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>חדש</span>}
                    {product._isBestSeller && <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>מובחר</span>}
                    {product.salePrice && <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>מבצע</span>}
                </div>
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => toggleWishlist(product)}
                    style={{
                        position: 'absolute', top: 12, left: 12,
                        width: 38, height: 38, borderRadius: 99,
                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <Heart size={17} fill={wishlisted ? '#FF2D55' : 'none'} color={wishlisted ? '#FF2D55' : '#1D1D1F'} strokeWidth={2} />
                </motion.button>
            </div>

            {/* ── Info card ──────────────────────────────────────────── */}
            <div style={{ background: '#fff', marginBottom: 12, padding: '20px 18px' }}>
                <span style={{
                    display: 'inline-block',
                    background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    marginBottom: 10,
                }}>
                    {product.category}
                </span>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 10 }}>
                    {product.title}
                </h1>
                {product.sku && (
                    <p style={{ fontSize: 11, color: '#AEAEB2', fontFamily: 'monospace', marginBottom: 10 }}>SKU: {product.sku}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 16, color: '#AEAEB2', textDecoration: 'line-through' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>
                {product.description && (
                    <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.6, fontWeight: 400 }}>{product.description}</p>
                )}
            </div>

            {/* ── Accordion sections ─────────────────────────────────── */}
            {product.specs?.length > 0 && (
                <div style={{ background: '#fff', marginBottom: 12, padding: '4px 18px' }}>
                    <Accordion title="מפרט טכני" defaultOpen>
                        {product.specs.map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between',
                                padding: '10px 0',
                                borderBottom: i < product.specs.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                            }}>
                                <span style={{ fontSize: 14, color: '#1D1D1F', fontWeight: 500 }}>{s.value}</span>
                                <span style={{ fontSize: 13, color: '#86868B' }}>{s.label}</span>
                            </div>
                        ))}
                    </Accordion>
                </div>
            )}

            {product.features?.length > 0 && (
                <div style={{ background: '#fff', marginBottom: 12, padding: '4px 18px' }}>
                    <Accordion title="תכונות בולטות">
                        {product.features.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < product.features.length - 1 ? 10 : 0 }}>
                                <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                    <Check size={11} color="#34C759" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.4 }}>{f}</span>
                            </div>
                        ))}
                    </Accordion>
                </div>
            )}

            {product.warranty && (
                <div style={{ background: '#fff', marginBottom: 12, padding: '4px 18px' }}>
                    <Accordion title="אחריות ותנאים">
                        <p style={{ fontSize: 14, color: '#3C3C43', lineHeight: 1.6 }}>{product.warranty}</p>
                    </Accordion>
                </div>
            )}

            {/* ── Q&A Section ────────────────────────────────────────── */}
            <div style={{ background: '#fff', marginBottom: 12, padding: '4px 18px' }}>
                <Accordion title="שאלות ותשובות">
                    <QASection productId={id} />
                </Accordion>
            </div>

            {/* ── Related products ───────────────────────────────────── */}
            {related.length > 0 && (
                <section style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>ראה הכל</button>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>מוצרים דומים</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {related.map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Sticky buy bar ─────────────────────────────────────── */}
            <div style={{
                position: 'fixed',
                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                left: 0, right: 0, zIndex: 150,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(24px)',
                borderTop: '0.5px solid rgba(0,0,0,0.1)',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: '#86868B', fontWeight: 500 }}>מחיר</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: product.salePrice ? '#FF3B30' : '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        ₪{displayPrice?.toLocaleString()}
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    style={{
                        flex: 1, height: 50, borderRadius: 16,
                        background: added
                            ? '#34C759'
                            : 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 16, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.25s',
                        letterSpacing: '-0.02em',
                        boxShadow: added
                            ? '0 4px 20px rgba(52,199,89,0.35)'
                            : '0 4px 20px rgba(0,122,255,0.32)',
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
