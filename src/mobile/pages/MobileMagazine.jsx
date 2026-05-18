import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Clock, BookOpen, Sparkles, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const CAT_COLORS = {
    'טכנולוגיה': '#007AFF', 'חדשנות': '#BF5AF2', 'פדגוגיה': '#30D158',
    'חינוך': '#FF9F0A', 'מחקר': '#FF375F', 'עתיד': '#5AC8FA',
};
function catColor(cat) { return CAT_COLORS[cat] ?? '#5856D6'; }

function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
    return (
        <motion.div style={{
            scaleX, position: 'fixed', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #007AFF, #5856D6)',
            transformOrigin: '0%', zIndex: 9999, pointerEvents: 'none',
            boxShadow: '0 0 8px rgba(0,122,255,0.5)',
        }} />
    );
}

function ArticleDetail({ article, onBack }) {
    const { colors: c } = useTheme();
    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <ScrollProgress />
            {article.image && (
                <div style={{ width: '100%', height: 280, overflow: 'hidden', position: 'relative' }}>
                    <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 20, right: 16, left: 16 }}>
                        <span style={{ display: 'inline-block', background: catColor(article.category), color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, marginBottom: 8 }}>
                            {article.category || 'מגזין'}
                        </span>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2 }}>
                            {article.title}
                        </h1>
                    </div>
                </div>
            )}
            <div style={{ padding: '20px 16px 40px', background: c.surface }}>
                {!article.image && (
                    <>
                        <span style={{ display: 'inline-block', background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10 }}>
                            {article.category || 'מגזין'}
                        </span>
                        <h1 style={{ fontSize: 24, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 12 }}>
                            {article.title}
                        </h1>
                    </>
                )}
                <p style={{ fontSize: 13, color: c.text3, marginBottom: 20 }}>
                    {article.author} · {article.publishedAt?.toDate?.()?.toLocaleDateString('he-IL') || ''}
                </p>
                <div style={{ fontSize: 16, color: c.text, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                    {article.body}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={onBack}
                    style={{ marginTop: 28, width: '100%', height: 50, borderRadius: 14, background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <ChevronRight size={16} strokeWidth={2.5} />
                    חזרה למגזין
                </motion.button>
            </div>
        </div>
    );
}

export default function MobileMagazine() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const [articles, setArticles] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const pageTitle = getSetting('magazine_title', 'הרעיונות שמשנים חינוך.');
    const pageSub   = getSetting('magazine_subtitle', 'מאמרים, מדריכים ותובנות על עתיד הלמידה');

    useEffect(() => {
        getDocs(query(collection(db, 'magazine_articles'), where('published', '==', true), orderBy('publishedAt', 'desc')))
            .then(snap => { setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (selected) return <ArticleDetail article={selected} onBack={() => setSelected(null)} />;

    const hero = articles[0];
    const rest = articles.slice(1);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh', paddingBottom: 32 }}>
            <ScrollProgress />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

            {/* ── Header ────────────────────────────────────────────── */}
            <div style={{ padding: '16px 16px 12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                    <Sparkles size={11} strokeWidth={2.5} />
                    מגזין NextClass
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 6 }}>
                    {pageTitle}
                </h1>
                <p style={{ fontSize: 14, color: c.text3, lineHeight: 1.5 }}>{pageSub}</p>
            </div>

            {loading ? (
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 260, background: c.surface, borderRadius: 22, animation: 'pulse 1.5s ease infinite' }} />
                    {[1, 2].map(i => <div key={i} style={{ height: 100, background: c.surface, borderRadius: 18, animation: 'pulse 1.5s ease infinite' }} />)}
                </div>
            ) : articles.length === 0 ? (
                <div style={{ margin: '0 16px', background: c.surface, borderRadius: 20, padding: '32px 20px', textAlign: 'center' }}>
                    <BookOpen size={40} color={c.text4} style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>תוכן בדרך</p>
                    <p style={{ fontSize: 14, color: c.text3 }}>מאמרים חדשים יתווספו בקרוב</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* ── Hero card ──────────────────────────────────── */}
                    {hero && (
                        <motion.div whileTap={{ scale: 0.98 }} onClick={() => setSelected(hero)}
                            style={{ margin: '0 16px', borderRadius: 22, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', WebkitTapHighlightColor: 'transparent', position: 'relative', background: c.surface }}>
                            {hero.image ? (
                                <div style={{ position: 'relative', height: 260 }}>
                                    <img src={hero.image} alt={hero.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
                                    <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, padding: '20px 18px' }}>
                                        <span style={{ display: 'inline-block', background: catColor(hero.category), color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, marginBottom: 8 }}>
                                            {hero.category || 'מגזין'}
                                        </span>
                                        <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.25, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {hero.title}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={11} color="rgba(255,255,255,0.6)" />
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                                                {hero.publishedAt?.toDate?.()?.toLocaleDateString('he-IL') || ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '24px 20px' }}>
                                    <span style={{ display: 'inline-block', background: 'rgba(88,86,214,0.15)', color: '#8B7FF5', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10 }}>
                                        {hero.category || 'מגזין'}
                                    </span>
                                    <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2 }}>{hero.title}</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Rest of articles ───────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
                        {rest.map(article => (
                            <motion.div key={article.id} whileTap={{ scale: 0.98 }} onClick={() => setSelected(article)}
                                style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', boxShadow: c.cardShadow, WebkitTapHighlightColor: 'transparent', display: 'flex', gap: 0 }}>
                                {article.image && (
                                    <div style={{ width: 90, flexShrink: 0, overflow: 'hidden' }}>
                                        <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                )}
                                <div style={{ padding: '12px 14px', flex: 1, direction: 'rtl' }}>
                                    {article.category && (
                                        <span style={{ display: 'inline-block', background: `${catColor(article.category)}14`, color: catColor(article.category), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 6 }}>
                                            {article.category}
                                        </span>
                                    )}
                                    <p style={{ fontSize: 14, fontWeight: 800, color: c.text, lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {article.title}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} color={c.text4} />
                                        <span style={{ fontSize: 10, color: c.text4 }}>
                                            {article.publishedAt?.toDate?.()?.toLocaleDateString('he-IL') || ''}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
