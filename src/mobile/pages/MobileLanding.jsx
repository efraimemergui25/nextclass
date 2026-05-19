import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowLeft, ChevronLeft, CheckCircle, Sparkles, Monitor, Laptop2, FlaskConical, Volume2, Zap, Globe, GraduationCap, Shield, BadgeDollarSign } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function BlurFade({ children, delay = 0 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-30px' });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay }}>
            {children}
        </motion.div>
    );
}

const CAT_ACCENTS = ['#007AFF','#5856D6','#007AFF','#5856D6','#007AFF','#5856D6'];
const CAT_ICONS   = [Monitor, Laptop2, FlaskConical, Volume2, Zap, Globe];

function useRecentlyViewed(allProducts) {
    return useMemo(() => {
        try {
            const ids = JSON.parse(localStorage.getItem('nc_recently_viewed') || '[]');
            return ids.map(id => allProducts.find(p => String(p.id) === String(id))).filter(Boolean);
        } catch { return []; }
    }, [allProducts]);
}

function SkeletonCard({ c }) {
    return (
        <div style={{ width: 152, flexShrink: 0, background: c.surface, borderRadius: 14, overflow: 'hidden', boxShadow: c.cardShadow }}>
            <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position' }} />
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
    const { user, firstName, shortGreeting, timeGreeting, memberTier, tierColor, tierLabel } = useAuth();
    const { colors: c }   = useTheme();
    const { featuredProduct, bestSellers, newArrivals, activeProducts } = useProducts();
    const recentlyViewed = useRecentlyViewed(activeProducts);
    const isLoading = activeProducts.length === 0;
    const categories = [...new Set(activeProducts.map(p => p.category))].filter(Boolean).slice(0, 6);

    // ── Same content keys as desktop ───────────────────────────────────────────
    const heroEyebrow  = getSetting('hero_eyebrow', 'הדור הבא של טכנולוגיה לחינוך');
    const heroTitle    = getSetting('hero_headline', 'חדשנות חסרת פשרות.');
    const heroSub      = getSetting('hero_subline', 'מקצועיות בכל מרחב למידה.');
    const heroDesc     = getSetting('hero_description', 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.');
    const heroCTA      = getSetting('hero_cta', 'גלו את הפתרונות שלנו');
    const trustPill1   = getSetting('hero_trust_pill_1', 'שירות ישיר ומהיר');
    const trustPill2   = getSetting('hero_trust_pill_2', 'ייעוץ ללא עלות');
    const trustPill3   = getSetting('hero_trust_pill_3', '+500 מוסדות חינוך');

    const vpTitle  = getSetting('vp_title', 'סטנדרט חדש של שירות למוסדות חינוך');
    const vp1Title = getSetting('vp_prop1_title', 'ייעוץ אישי ומקצועי');
    const vp1Desc  = getSetting('vp_prop1_desc', 'יועץ טכנולוגי מקצועי מלווה אתכם מהשלב הראשון');
    const vp2Title = getSetting('vp_prop2_title', 'אחריות ותמיכה מלאה');
    const vp2Desc  = getSetting('vp_prop2_desc', 'תמיכה טכנית 24/7 ואחריות מלאה על כל המוצרים');
    const vp3Title = getSetting('vp_prop3_title', 'מחירים מוסדיים');
    const vp3Desc  = getSetting('vp_prop3_desc', 'מחירים מיוחדים למוסדות חינוך עם אפשרויות מימון');

    const stat1Val   = getSetting('about_stat1_val', '1200');
    const stat1Label = getSetting('about_stat1_label', 'מוסדות חינוך');
    const stat2Val   = getSetting('about_stat2_val', '14');
    const stat2Label = getSetting('about_stat2_label', 'שנות ניסיון');
    const stat3Val   = getSetting('about_stat3_val', '98');
    const stat3Label = getSetting('about_stat3_label', '% שביעות רצון');

    const discoverEyebrow = getSetting('home_discover_eyebrow', 'מגוון פתרונות');
    const discoverTitle   = getSetting('home_discover_title', 'גלו את הפתרונות שלנו.');
    const discoverSub     = getSetting('home_discover_sub', 'מסכים אינטראקטיביים, מחשוב לחינוך, מעבדות STEM ועוד — הכל במקום אחד.');
    const productsTitle   = getSetting('home_products_title', 'פתרונות טכנולוגיים מובילים');

    const VALUE_PROPS = [
        { icon: GraduationCap,   color: '#007AFF', title: vp1Title, desc: vp1Desc },
        { icon: Shield,          color: '#007AFF', title: vp2Title, desc: vp2Desc },
        { icon: BadgeDollarSign, color: '#007AFF', title: vp3Title, desc: vp3Desc },
    ];

    const STATS = [
        [stat1Val, stat1Label],
        [stat2Val, stat2Label],
        [stat3Val, stat3Label],
    ];

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', paddingBottom: 24, background: c.bg, minHeight: '100dvh' }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* ── Personalized greeting (logged-in only) ─────────────── */}
            {user && firstName && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: '14px 16px 0', direction: 'rtl' }}
                >
                    <div style={{
                        background: `linear-gradient(135deg, ${tierColor}12, ${tierColor}06)`,
                        borderRadius: 18,
                        border: `1px solid ${tierColor}22`,
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                            background: `linear-gradient(135deg, ${tierColor}30, ${tierColor}55)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 900, color: tierColor,
                        }}>
                            {firstName[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', marginBottom: 2 }}>
                                {shortGreeting}
                            </p>
                            <p style={{ fontSize: 12, color: c.text3, fontWeight: 500 }}>
                                ברוך הבא · <span style={{ color: tierColor, fontWeight: 700 }}>{tierLabel}</span>
                            </p>
                        </div>
                        <Sparkles size={18} color={tierColor} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    </div>
                </motion.div>
            )}

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div style={{ padding: '14px 16px 0' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        borderRadius: 22, overflow: 'hidden', position: 'relative',
                        background: 'linear-gradient(145deg, #F0F6FF 0%, #EEF0FF 55%, #F5F8FF 100%)',
                        boxShadow: '0 4px 28px rgba(0,122,255,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
                        border: '1px solid rgba(0,122,255,0.10)',
                    }}
                >
                    {featuredProduct?.image && (
                        <div style={{ width: '100%', height: 200, overflow: 'hidden', position: 'relative', background: '#F8FAFF' }}>
                            <img src={featuredProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(240,246,255,0.97) 100%)' }} />
                        </div>
                    )}

                    <div style={{ padding: featuredProduct?.image ? '0 22px 24px' : '30px 22px 24px' }}>
                        <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                            {heroEyebrow}
                        </div>
                        <h1 style={{
                            fontSize: 28, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.04em', marginBottom: 6,
                            background: 'linear-gradient(135deg, #1D1D1F 25%, #007AFF 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                            {heroTitle}
                        </h1>
                        <p style={{ fontSize: 15, fontWeight: 700, color: c.text2, letterSpacing: '-0.02em', marginBottom: 6 }}>
                            {heroSub}
                        </p>
                        <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5, marginBottom: 20 }}>
                            {heroDesc}
                        </p>

                        {/* CTA button */}
                        <div style={{ marginBottom: 16 }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { haptic('light'); navigate('/discover'); }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                                    padding: '12px 20px', fontSize: 15, fontWeight: 700,
                                    cursor: 'pointer', letterSpacing: '-0.02em',
                                    WebkitTapHighlightColor: 'transparent',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                                }}
                            >
                                {heroCTA} <ArrowLeft size={16} strokeWidth={2.5} />
                            </motion.button>
                        </div>

                        {/* Trust pills */}
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                            {[trustPill1, trustPill2, trustPill3].map(pill => (
                                <div key={pill} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: 'rgba(0,122,255,0.08)', borderRadius: 99,
                                    padding: '5px 10px', border: '1px solid rgba(0,122,255,0.20)',
                                }}>
                                    <CheckCircle size={10} color="#30D158" strokeWidth={2.5} />
                                    <span style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>{pill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Stats strip ────────────────────────────────────────── */}
            <BlurFade delay={0.04}>
            <div style={{ margin: '14px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', boxShadow: `${c.cardShadow}, inset 0 1px 0 rgba(255,255,255,0.7)`, overflow: 'hidden', border: '1px solid rgba(0,122,255,0.06)' }}>
                    {STATS.map(([val, label], i) => (
                        <div key={label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '16px 8px',
                            borderRight: i < 2 ? `0.5px solid ${c.divider}` : 'none',
                        }}>
                            <span style={{ fontSize: 22, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.04em' }}>
                                {val}{label.includes('%') ? '%' : '+'}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.text3, marginTop: 2, textAlign: 'center' }}>
                                {label.replace(/ ?%/, '')}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            </BlurFade>

            {/* ── Discover banner ────────────────────────────────────── */}
            <BlurFade delay={0.06}>
            <div style={{ margin: '16px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic('light'); navigate('/discover'); }}
                    style={{
                        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                        background: c.surface,
                        padding: '20px 22px',
                        boxShadow: `${c.cardShadow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                        border: '1px solid rgba(0,122,255,0.10)',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99, marginBottom: 8 }}>
                            {discoverEyebrow}
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4, background: 'linear-gradient(135deg, #1D1D1F 20%, #007AFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{discoverTitle}</h3>
                        <p style={{ fontSize: 13, color: c.text3 }}>{discoverSub}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 14, background: '#007AFF', flexShrink: 0 }}>
                        <ArrowLeft size={20} color="#fff" strokeWidth={2.5} />
                    </div>
                </motion.div>
            </div>
            </BlurFade>

            {/* ── Recently viewed ────────────────────────────────────── */}
            {recentlyViewed.length > 0 && (
                <BlurFade delay={0.07}>
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>
                            {firstName ? `המשך מאיפה שעצרת, ${firstName}` : 'צפית לאחרונה'}
                        </h2>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                            ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {recentlyViewed.slice(0, 6).map(p => <MobileProductCard key={p.id} product={p} size="sm" />)}
                    </div>
                </section>
                </BlurFade>
            )}

            {/* ── Categories ────────────────────────────────────────── */}
            <BlurFade delay={0.09}>
            <section style={{ marginTop: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>קטגוריות</h2>
                    <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                        הכל <ChevronLeft size={13} strokeWidth={2.5} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '2px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    {isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ flexShrink: 0, width: 76, height: 90, background: c.surface, borderRadius: 16, boxShadow: c.cardShadow, overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position' }} />
                            </div>
                        ))
                        : categories.map((cat, i) => (
                            <motion.div key={cat} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, type: 'spring', stiffness: 500, damping: 30 }}>
                                <motion.button whileTap={{ scale: 0.93 }}
                                    onClick={() => { haptic('select'); navigate(`/catalog?category=${encodeURIComponent(cat)}`); }}
                                    style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: c.surface, border: 'none', borderRadius: 16, padding: '14px 14px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', boxShadow: c.cardShadow, minWidth: 76 }}>
                                    {(() => { const CatIcon = CAT_ICONS[i % CAT_ICONS.length]; const accent = CAT_ACCENTS[i % CAT_ACCENTS.length]; return (
                                    <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CatIcon size={18} color={accent} strokeWidth={1.8} />
                                    </div>
                                    ); })()}
                                    <span style={{ fontSize: 10, fontWeight: 600, color: c.text, textAlign: 'center', lineHeight: 1.25, maxWidth: 68, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {cat}
                                    </span>
                                </motion.button>
                            </motion.div>
                        ))
                    }
                </div>
            </section>
            </BlurFade>


            {/* ── New arrivals ──────────────────────────────────────── */}
            {(isLoading || newArrivals?.length > 0) && (
                <BlurFade delay={0.13}>
                <section style={{ marginTop: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>מוצרים חדשים</h2>
                        <button onClick={() => navigate('/catalog')} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, WebkitTapHighlightColor: 'transparent' }}>
                            ראה הכל <ChevronLeft size={13} strokeWidth={2.5} />
                        </button>
                    </div>
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', boxShadow: c.cardShadow }}>
                                    <div style={{ width: '100%', aspectRatio: '1', background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position' }} />
                                    <div style={{ padding: '10px 12px' }}><div style={{ height: 10, borderRadius: 5, background: c.shimmerA, marginBottom: 6 }} /><div style={{ height: 10, borderRadius: 5, background: c.shimmerA, width: '55%' }} /></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px' }}>
                            {newArrivals?.slice(0, 4).map(p => <MobileProductCard key={p.id} product={p} size="md" />)}
                        </div>
                    )}
                </section>
                </BlurFade>
            )}

            {/* ── Value props ───────────────────────────────────────── */}
            <BlurFade delay={0.15}>
            <section style={{ margin: '26px 16px 0' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em', marginBottom: 12, textAlign: 'right' }}>{vpTitle}</h2>
                <div style={{ background: c.surface, borderRadius: 20, overflow: 'hidden', boxShadow: c.cardShadow }}>
                    {VALUE_PROPS.map(({ icon: VpIcon, color, title, desc }, i) => (
                        <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderBottom: i < VALUE_PROPS.length - 1 ? `0.5px solid ${c.divider}` : 'none' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <VpIcon size={20} color={color} strokeWidth={1.8} />
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 2 }}>{title}</p>
                                <p style={{ fontSize: 12, color: c.text3, lineHeight: 1.4 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            </BlurFade>

            {/* ── Expert consultation CTA ───────────────────────────── */}
            <BlurFade delay={0.17}>
            <div style={{ margin: '18px 16px 0' }}>
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptic('light'); navigate('/contact'); }}
                    style={{ borderRadius: 20, padding: '22px 22px', cursor: 'pointer', background: c.surface, boxShadow: `${c.cardShadow}, inset 0 1px 0 rgba(255,255,255,0.7)`, border: '1px solid rgba(0,122,255,0.08)', WebkitTapHighlightColor: 'transparent' }}
                >
                    <div style={{ display: 'inline-block', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                        {getSetting('expert_cta', 'קבל ייעוץ חינמי')}
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.2, background: 'linear-gradient(135deg, #1D1D1F 20%, #007AFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        {getSetting('expert_title', 'בואו נרכיב יחד את הפתרון המושלם למוסד שלכם.')}
                    </h3>
                    <p style={{ fontSize: 13, color: c.text3, marginBottom: 18, lineHeight: 1.5 }}>
                        {getSetting('expert_desc', 'יועץ טכנולוגי מנוסה יאפיין את הצרכים שלכם ויבנה עבורכם פתרון מדויק.')}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#007AFF', padding: '11px 20px', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,122,255,0.28)' }}>
                        {getSetting('contact_form_btn', 'שלח פנייה')} <ArrowLeft size={15} />
                    </div>
                </motion.div>
            </div>
            </BlurFade>

            {/* ── Trusted institutions ────────────────────────────────── */}
            <BlurFade delay={0.19}>
            <div style={{ margin: '18px 16px 0' }}>
                <div style={{ background: c.surface, borderRadius: 18, padding: '16px 18px', boxShadow: c.cardShadow }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: c.text4, textAlign: 'center', marginBottom: 12 }}>
                        {getSetting('sp_label', 'נבחר על ידי מעל 500 מוסדות חינוך')}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {getSetting('sp_clients', 'משרד החינוך, רשת אורט, עיריית תל אביב, אוניברסיטת אריאל').split(',').slice(0, 5).map(inst => (
                            <div key={inst.trim()} style={{ fontSize: 11, fontWeight: 600, color: c.text3, background: c.bg, borderRadius: 99, padding: '5px 12px', border: `0.5px solid ${c.border}`, whiteSpace: 'nowrap' }}>
                                {inst.trim()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </BlurFade>

            {/* ── Footer ────────────────────────────────────────────── */}
            <div style={{ margin: '24px 16px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: c.text4, fontWeight: 500 }}>
                    {getSetting('footer_copyright', '© 2026 NextClass · כל הזכויות שמורות')}
                </p>
            </div>
        </div>
    );
}
