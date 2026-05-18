import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, FileText, LogOut, Sparkles, ChevronLeft, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useProducts } from '../context/ProductsContext';

// ── helpers ──────────────────────────────────────────────────────────────────
const STATUS = {
    'חדש':    { bg: 'rgba(255,159,10,0.12)', color: '#FF9F0A', dot: '#FF9F0A' },
    'בטיפול': { bg: 'rgba(0,122,255,0.12)',  color: '#007AFF', dot: '#007AFF' },
    'הושלם':  { bg: 'rgba(48,209,88,0.12)',  color: '#30D158', dot: '#30D158' },
    'בוטל':   { bg: 'rgba(255,69,58,0.12)',  color: '#FF453A', dot: '#FF453A' },
};

function relativeDate(ts) {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? ts : ts.toDate?.() ?? ts);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'היום';
    if (days === 1) return 'אתמול';
    if (days < 7)  return `לפני ${days} ימים`;
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

const ROLE_HE = { teacher: 'מורה', principal: 'מנהל', it: 'רכז טכנולוגיה', admin: 'מנהל מוסד', other: 'אחר' };

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ children, action, actionTo }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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

// ── Product thumb ─────────────────────────────────────────────────────────────
function ProductThumb({ product, tierColor }) {
    return (
        <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', flex: '0 0 auto', width: 110 }}>
            <motion.div whileHover={{ y: -2 }} style={{
                borderRadius: 16, overflow: 'hidden',
                background: '#F5F5F7',
                border: '1px solid rgba(0,0,0,0.06)',
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
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.title}
                    </p>
                    {product.price > 0 && (
                        <p style={{ fontSize: 11, fontWeight: 800, color: tierColor, marginTop: 4 }}>
                            ₪{Number(product.price).toLocaleString()}
                        </p>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}

// ── Main panel ────────────────────────────────────────────────────────────────
const TIER_ORDER  = ['free', 'member', 'premium'];
const TIER_NEXT   = { free: 'member', member: 'premium', premium: null };
const TIER_LABELS = { free: 'פרטי', member: 'מוסדי', premium: 'פרימיום' };
const TIER_COLORS = { free: '#8E8E93', member: '#007AFF', premium: '#FF9F0A' };
const TIER_DISC   = { free: 5, member: 12, premium: 18 };

export default function PersonalPanel({ open, onClose }) {
    const { user, userDoc, firstName, tierLabel, tierColor, discountPct, isMember, memberTier, signOut } = useAuth();
    const { wishlistItems, wishlistCount } = useWishlist();
    const { activeProducts } = useProducts();
    const [quotes, setQuotes] = useState([]);
    const [loadingQuotes, setLoadingQuotes] = useState(false);

    useEffect(() => {
        if (!open || !user?.email) return;
        setLoadingQuotes(true);
        getDocs(query(collection(db, 'quotes'), where('email', '==', user.email), limit(5)))
            .then(snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                setQuotes(docs.slice(0, 3));
            })
            .catch(() => setQuotes([]))
            .finally(() => setLoadingQuotes(false));
    }, [open, user?.email]);

    // Total ₪ saved from closed deals
    const totalSaved = useMemo(() => {
        return quotes
            .filter(q => q.inventorySettled === 'closed')
            .reduce((sum, q) => sum + Math.round((q.subtotal || 0) * discountPct / 100), 0);
    }, [quotes, discountPct]);

    // Tier progress
    const tierIdx  = TIER_ORDER.indexOf(memberTier || 'free');
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
    const role = ROLE_HE[userDoc?.role] || '';
    const since = memberSince(userDoc?.createdAt);

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
                            overflowY: 'auto',
                            fontFamily: 'Heebo, sans-serif',
                            direction: 'rtl',
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.14)',
                        }}
                    >
                        {/* ── Identity header ────────────────────────────── */}
                        <div style={{
                            padding: '52px 24px 28px',
                            background: `linear-gradient(160deg, ${tierColor}12 0%, transparent 60%)`,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            position: 'relative',
                        }}>
                            {/* Close */}
                            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                                style={{ position: 'absolute', top: 16, left: 16,
                                    width: 32, height: 32, borderRadius: 99,
                                    background: 'rgba(0,0,0,0.06)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#6E6E73' }}>
                                <X size={15} />
                            </motion.button>

                            {/* Avatar */}
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 26, delay: 0.05 }}
                                style={{
                                    width: 72, height: 72, borderRadius: 24,
                                    background: `linear-gradient(135deg, ${tierColor}, ${tierColor}99)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 8px 24px ${tierColor}44`,
                                    marginBottom: 16,
                                }}
                            >
                                <span style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>
                                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                                </span>
                            </motion.div>

                            {/* Name + tier */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.04em', margin: 0 }}>
                                    {user?.displayName || firstName}
                                </h2>
                                <span style={{
                                    fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                                    background: isMember ? `${tierColor}18` : 'rgba(0,0,0,0.06)',
                                    color: isMember ? tierColor : '#8E8E93',
                                    letterSpacing: '0.02em',
                                }}>
                                    {tierLabel}
                                </span>
                            </div>

                            {/* Sub info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {(userDoc?.institution || role) && (
                                    <p style={{ fontSize: 13, color: '#6E6E73', fontWeight: 500, margin: 0 }}>
                                        {[userDoc?.institution, role].filter(Boolean).join(' · ')}
                                    </p>
                                )}
                                {since && (
                                    <p style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Sparkles size={11} color={tierColor} /> {since}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Tier progress bar ───────────────────────────── */}
                        <div style={{ padding: '16px 24px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                {TIER_ORDER.map((t, i) => (
                                    <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-end' : i === 2 ? 'flex-start' : 'center', flex: 1 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 99, marginBottom: 4,
                                            background: i <= tierIdx ? `linear-gradient(135deg, ${TIER_COLORS[t]}, ${TIER_COLORS[t]}88)` : '#F0F0F0',
                                            border: i === tierIdx ? `2px solid ${TIER_COLORS[t]}` : '2px solid transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: i === tierIdx ? `0 0 0 4px ${TIER_COLORS[t]}20` : 'none',
                                            transition: 'all 0.3s',
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
                            {nextTier && (
                                <p style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600, margin: '4px 0 0', textAlign: 'center' }}>
                                    הדרגה הבאה: {TIER_LABELS[nextTier]}
                                </p>
                            )}
                        </div>

                        {/* ── Quick stats ─────────────────────────────────── */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 10 }}>
                            {[
                                { icon: Heart, label: 'מועדפים', value: wishlistCount, to: '/wishlist' },
                                { icon: FileText, label: 'בקשות', value: quotes.length || '—', to: null },
                                { icon: Tag, label: 'מחירים', value: isMember ? 'VIP' : 'רגיל', to: '/membership' },
                            ].map(({ icon: Icon, label, value, to }) => {
                                const inner = (
                                    <motion.div key={label} whileHover={{ y: -1 }} style={{
                                        flex: 1, background: '#F5F5F7',
                                        borderRadius: 16, padding: '14px 12px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        cursor: to ? 'pointer' : 'default',
                                    }}>
                                        <Icon size={16} color={tierColor} strokeWidth={2} />
                                        <span style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em' }}>{value}</span>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
                                    </motion.div>
                                );
                                return to ? <Link key={label} to={to} onClick={onClose} style={{ flex: 1, textDecoration: 'none' }}>{inner}</Link> : inner;
                            })}
                        </div>

                        {/* ── Quotes ──────────────────────────────────────── */}
                        <div style={{ padding: '24px 24px 0' }}>
                            <SectionLabel>בקשות מחיר</SectionLabel>
                            {loadingQuotes ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[1, 2].map(i => (
                                        <div key={i} style={{ height: 60, borderRadius: 14, background: '#F5F5F7', animation: 'pulse 1.4s ease-in-out infinite' }} />
                                    ))}
                                </div>
                            ) : quotes.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: '#AEAEB2', fontSize: 13, fontWeight: 500 }}>
                                    טרם הגשת בקשות מחיר
                                    <br />
                                    <Link to="/catalog" onClick={onClose}
                                        style={{ color: '#007AFF', fontWeight: 700, textDecoration: 'none', fontSize: 13, display: 'inline-block', marginTop: 6 }}>
                                        גלה את הקטלוג →
                                    </Link>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {quotes.map((q, i) => {
                                        const st = STATUS[q.status] || { bg: 'rgba(0,0,0,0.06)', color: '#8E8E93' };
                                        return (
                                            <motion.div key={q.id}
                                                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '12px 14px', borderRadius: 14,
                                                    background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.05)',
                                                }}>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: '0 0 2px' }}>
                                                        {q.id}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, margin: 0 }}>
                                                        {relativeDate(q.dateTs)} · {q.items?.length || 0} פריטים
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
                                                        {q.subtotal ? `₪${Number(q.subtotal).toLocaleString()}` : '—'}
                                                    </span>
                                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>
                                                        {q.status || 'חדש'}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── Wishlist ─────────────────────────────────────── */}
                        {wishlistCount > 0 && (
                            <div style={{ padding: '28px 24px 0' }}>
                                <SectionLabel action="הכל" actionTo="/wishlist">מועדפים שלי</SectionLabel>
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
                                    scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {wishlistItems.slice(0, 4).map((p, i) => (
                                        <motion.div key={p.id} onClick={onClose}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.07 }}>
                                            <ProductThumb product={p} tierColor={tierColor} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Recommendations ──────────────────────────────── */}
                        {recommendations.length > 0 && (
                            <div style={{ padding: '28px 24px 0' }}>
                                <SectionLabel action="גלה עוד" actionTo="/catalog">מומלץ עבורך</SectionLabel>
                                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
                                    scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    {recommendations.map((p, i) => (
                                        <motion.div key={p.id} onClick={onClose}
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.07 + 0.1 }}>
                                            <ProductThumb product={p} tierColor={tierColor} />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Membership upsell ────────────────────────────── */}
                        {!isMember && (
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

                        {/* ── Sign out ─────────────────────────────────────── */}
                        <div style={{ padding: '28px 24px 40px', marginTop: 'auto' }}>
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20 }}>
                                <motion.button
                                    whileHover={{ background: 'rgba(255,69,58,0.06)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSignOut}
                                    style={{
                                        width: '100%', height: 48, borderRadius: 14,
                                        background: 'transparent',
                                        border: '1px solid rgba(255,69,58,0.18)',
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
                </>
            )}
        </AnimatePresence>
    );
}
