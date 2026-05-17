import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, Star, Truck, Headphones } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const CAT_ACCENTS = ['#007AFF','#BF5AF2','#30D158','#FF9F0A','#FF375F','#5AC8FA'];
const CAT_EMOJIS  = ['🖥️','💻','🔬','🔊','⚡','🌐'];

const VALUE_PROPS = [
    { Icon: Star,       title: 'איכות מובחרת',  desc: 'מוצרים מהספקים המובילים בעולם' },
    { Icon: Truck,      title: 'אספקה מהירה',   desc: 'התקנה מקצועית עד אליכם' },
    { Icon: Headphones, title: 'ליווי מתמיד',   desc: 'שירות מלא לאחר הרכישה' },
];

// Recently viewed from localStorage
function useRecentlyViewed(allProducts) {
    return useMemo(() => {
        try {
            const ids = JSON.parse(localStorage.getItem('nc_recently_viewed') || '[]');
            return ids.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean);
        } catch { return []; }
    }, [allProducts]);
}

export default function MobileLanding() {
    const navigate = useNavigate();
    const { getSetting }  = useSettings();
    const { featuredProduct, bestSellers, newArrivals, activeProducts } = useProducts();
    const recentlyViewed = useRecentlyViewed(activeProducts);

    const categories = [...new Set(activeProducts.map(p => p.category))].filter(Boolean).slice(0, 6);

    const heroTitle = getSetting('hero_title', 'חינוך מתקדם, ממש עכשיו.');
    const heroSub   = getSetting('hero_subtitle', 'הפתרונות הטכנולוגיים המתקדמים ביותר למוסדות חינוך.');

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 24 }}>

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
                    {/* Glows */}
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
                        <motion.button whileTap={{ scale: 0.95 }} style={{
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
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            ראה הכל <ChevronLeft size={13} />
                        </button>
                        <h2 style={{ fontSize: 19, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>צפית לאחרונה</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {recentlyViewed.slice(0, 6).map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Categories ────────────────────────────────────────── */}
            {categories.length > 0 && (
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            הכל <ChevronLeft size={13} />
                        </button>
                        <h2 style={{ fontSize: 19, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>קטגוריות</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {categories.map((cat, i) => (
                            <motion.button key={cat} whileTap={{ scale: 0.93 }}
                                onClick={() => navigate(`/catalog?category=${encodeURIComponent(cat)}`)}
                                style={{
                                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    background: '#fff', border: 'none', borderRadius: 16, padding: '14px 14px',
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)', minWidth: 76,
                                }}>
                                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${CAT_ACCENTS[i % CAT_ACCENTS.length]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                    {CAT_EMOJIS[i % CAT_EMOJIS.length]}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#1D1D1F', textAlign: 'center', lineHeight: 1.25, maxWidth: 68, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {cat}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Best sellers ──────────────────────────────────────── */}
            {bestSellers?.length > 0 && (
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            ראה הכל <ChevronLeft size={13} />
                        </button>
                        <h2 style={{ fontSize: 19, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>המוצרים המובחרים</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {bestSellers.slice(0, 8).map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── New arrivals ──────────────────────────────────────── */}
            {newArrivals?.length > 0 && (
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            ראה הכל <ChevronLeft size={13} />
                        </button>
                        <h2 style={{ fontSize: 19, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em' }}>מוצרים חדשים</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                        {newArrivals.slice(0, 4).map(p => (
                            <MobileProductCard key={p.id} product={p} size="md" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Value props ───────────────────────────────────────── */}
            <section style={{ margin: '26px 16px 0', background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {VALUE_PROPS.map(({ Icon, title, desc }, i) => (
                    <div key={title} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '16px 18px',
                        borderBottom: i < VALUE_PROPS.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                    }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} color="#007AFF" strokeWidth={1.8} />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', marginBottom: 2 }}>{title}</p>
                            <p style={{ fontSize: 12, color: '#86868B', lineHeight: 1.4 }}>{desc}</p>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Quote CTA ─────────────────────────────────────────── */}
            <div style={{ margin: '18px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/contact')}
                    style={{
                        borderRadius: 20, padding: '22px 22px', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)',
                        boxShadow: '0 6px 28px rgba(88,86,214,0.28)',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', marginBottom: 8 }}>L NEXTCLASS</p>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.2 }}>מחפש הצעת מחיר?</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 18 }}>נחזור אליך תוך 24 שעות עם פתרון מותאם.</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)', padding: '10px 18px', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, border: '1px solid rgba(255,255,255,0.26)' }}>
                        שלח בקשה <ArrowLeft size={15} />
                    </div>
                </motion.div>
            </div>

            {/* ── Mini footer ───────────────────────────────────────── */}
            <div style={{ margin: '24px 16px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#C7C7CC', fontWeight: 500 }}>© 2026 NextClass · כל הזכויות שמורות</p>
            </div>
        </div>
    );
}
