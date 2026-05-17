import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, ChevronLeft, Star, Truck, Headphones } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function FadeSection({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-40px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

const CAT_ACCENTS = ['#007AFF','#BF5AF2','#30D158','#FF9F0A','#FF375F','#5AC8FA'];
const CAT_EMOJIS  = ['🖥️','💻','🔬','🔊','⚡','🌐'];

const VALUE_PROPS = [
    { Icon: Star,       title: 'איכות מובחרת',  desc: 'מוצרים מהספקים המובילים בעולם' },
    { Icon: Truck,      title: 'אספקה מהירה',   desc: 'התקנה מקצועית עד אליכם' },
    { Icon: Headphones, title: 'ליווי מתמיד',   desc: 'שירות מלא לאחר הרכישה' },
];

function useRecentlyViewed(allProducts) {
    return useMemo(() => {
        try {
            const ids = JSON.parse(localStorage.getItem('nc_recently_viewed') || '[]');
            return ids.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean);
        } catch { return []; }
    }, [allProducts]);
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ c }) {
    return (
        <div style={{ width: 152, flexShrink: 0, background: c.surface, borderRadius: 14, overflow: 'hidden', boxShadow: c.cardShadow }}>
            <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            <div style={{ padding: '8px 10px' }}>
                <div style={{ height: 10, borderRadius: 5, background: c.shimmerA, marginBottom: 6 }} />
                <div style={{ height: 10, borderRadius: 5, background: c.shimmerA, width: '60%' }} />
            </div>
        </div>
    );
}

export default function MobileLanding() {
    const navigate = useNavigate();
    const { getSetting }  = useSettings();
    const { colors: c }   = useTheme();
    const { featuredProduct, bestSellers, newArrivals, activeProducts } = useProducts();
    const recentlyViewed = useRecentlyViewed(activeProducts);
    const isLoading = activeProducts.length === 0;

    const categories = [...new Set(activeProducts.map(p => p.category))].filter(Boolean).slice(0, 6);

    const heroTitle = getSetting('hero_headline', 'חינוך מתקדם, ממש עכשיו.');
    const heroSub   = getSetting('hero_subline', 'הפתרונות הטכנולוגיים המתקדמים ביותר למוסדות חינוך.');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 24, background: c.bg, minHeight: '100vh' }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div style={{ padding: '14px 16px 0' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => navigate('/catalog')}
                    style={{
                        borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
                        position: 'relative',
                        background: 'linear-gradient(145deg, #0a1628 0%, #0d2347 45%, #0f3460 100%)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,122,255,0.28) 0%, transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(88,86,214,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    {featuredProduct?.image && (
                        <div style={{ width: '100%', height: 190, overflow: 'hidden', position: 'relative' }}>
                            <img src={featuredProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transform: 'scale(1.04)' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(10,22,40,0.98) 100%)' }} />
                        </div>
                    )}

                    <div style={{ padding: featuredProduct?.image ? '0 22px 22px' : '30px 22px 22px' }}>
                        <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.2)', color: '#64D2FF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                            NextClass · ציוד חינוכי מקצועי
                        </div>
                        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: 10 }}>
                            {heroTitle}
                        </h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 20 }}>
                            {heroSub}
                        </p>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => { haptic('light'); navigate('/catalog'); }} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                            padding: '12px 20px', fontSize: 15, fontWeight: 700,
                            cursor: 'pointer', letterSpacing: '-0.02em',
                            WebkitTapHighlightColor: 'transparent',
                            boxShadow: '0 4px 20px rgba(0,122,255,0.4)',
                        }}>
                            גלה את הקטלוג
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* ── Recently viewed ────────────────────────────────────── */}
            {recentlyViewed.length > 0 && (
                <FadeSection delay={0.05}>
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                            ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                        </button>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>צפית לאחרונה</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {recentlyViewed.slice(0, 6).map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
                </FadeSection>
            )}

            {/* ── Categories ────────────────────────────────────────── */}
            <FadeSection delay={0.08}>
            <section style={{ marginTop: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                    <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                        הכל <ChevronLeft size={13} strokeWidth={2.5} />
                    </button>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>קטגוריות</h2>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ flexShrink: 0, width: 76, height: 90, background: c.surface, borderRadius: 16, boxShadow: c.cardShadow, overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                            </div>
                        ))
                    ) : categories.map((cat, i) => (
                        <motion.button key={cat} whileTap={{ scale: 0.93 }}
                            onClick={() => { haptic('select'); navigate(`/catalog?category=${encodeURIComponent(cat)}`); }}
                            style={{
                                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                background: c.surface, border: 'none', borderRadius: 16, padding: '14px 14px',
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                boxShadow: c.cardShadow, minWidth: 76,
                            }}>
                            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${CAT_ACCENTS[i % CAT_ACCENTS.length]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {CAT_EMOJIS[i % CAT_EMOJIS.length]}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.text, textAlign: 'center', lineHeight: 1.25, maxWidth: 68, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {cat}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </section>
            </FadeSection>

            {/* ── Best sellers ──────────────────────────────────────── */}
            <FadeSection delay={0.1}>
            <section style={{ marginTop: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                    <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                        ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                    </button>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>המוצרים המובחרים</h2>
                </div>
                <div style={{ display: 'flex', gap: 12, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} c={c} />)
                    ) : (
                        bestSellers?.slice(0, 8).map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))
                    )}
                </div>
            </section>
            </FadeSection>

            {/* ── New arrivals ──────────────────────────────────────── */}
            {(isLoading || newArrivals?.length > 0) && (
                <FadeSection delay={0.12}>
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                            ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                        </button>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.03em' }}>מוצרים חדשים</h2>
                    </div>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', boxShadow: c.cardShadow }}>
                                    <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                                    <div style={{ padding: '10px 12px' }}>
                                        <div style={{ height: 10, borderRadius: 5, background: c.shimmerA, marginBottom: 6 }} />
                                        <div style={{ height: 10, borderRadius: 5, background: c.shimmerA, width: '55%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                            {newArrivals?.slice(0, 4).map(p => (
                                <MobileProductCard key={p.id} product={p} size="md" />
                            ))}
                        </div>
                    )}
                </section>
                </FadeSection>
            )}

            {/* ── Value props ───────────────────────────────────────── */}
            <FadeSection delay={0.14}>
            <section style={{ margin: '26px 16px 0', background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                {VALUE_PROPS.map(({ Icon, title, desc }, i) => (
                    <div key={title} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px',
                        borderBottom: i < VALUE_PROPS.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                    }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} color="#007AFF" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 2 }}>{title}</p>
                            <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.4 }}>{desc}</p>
                        </div>
                    </div>
                ))}
            </section>
            </FadeSection>

            {/* ── Quote CTA ─────────────────────────────────────────── */}
            <FadeSection delay={0.16}>
            <div style={{ margin: '18px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic('light'); navigate('/contact'); }}
                    style={{
                        borderRadius: 20, padding: '22px 22px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)',
                        boxShadow: '0 6px 28px rgba(88,86,214,0.28)',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', marginBottom: 8 }}>NEXTCLASS · לימוד מתקדם</p>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.2 }}>מחפש הצעת מחיר?</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18 }}>נחזור אליך תוך 24 שעות עם פתרון מותאם.</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '10px 18px', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, border: '1px solid rgba(255,255,255,0.26)' }}>
                        שלח בקשה <ArrowLeft size={15} />
                    </div>
                </motion.div>
            </div>
            </FadeSection>

            {/* ── Mini footer ───────────────────────────────────────── */}
            <div style={{ margin: '24px 16px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: c.text4, fontWeight: 500 }}>© 2026 NextClass · כל הזכויות שמורות</p>
            </div>
        </div>
    );
}
