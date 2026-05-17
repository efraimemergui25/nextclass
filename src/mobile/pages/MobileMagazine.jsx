import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

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
            .then(snap => {
                setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (selected) return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>
            {selected.image && (
                <div style={{ width: '100%', height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 18 }}>
                    <img src={selected.image} alt={selected.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <span style={{ display: 'inline-block', background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, marginBottom: 10 }}>
                {selected.category || 'מגזין'}
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 12 }}>
                {selected.title}
            </h1>
            <p style={{ fontSize: 13, color: c.text3, marginBottom: 20 }}>
                {selected.author} · {selected.publishedAt?.toDate?.()?.toLocaleDateString('he-IL') || ''}
            </p>
            <div style={{ fontSize: 15, color: c.text2, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {selected.body}
            </div>
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(null)}
                style={{
                    marginTop: 24, width: '100%', height: 50, borderRadius: 14,
                    background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: 'none',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent', fontFamily: SF,
                }}
            >
                ← חזרה למגזין
            </motion.button>
        </div>
    );

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'inline-block', background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 10, letterSpacing: '0.04em' }}>
                    מגזין NextClass
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: c.text, letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 8 }}>
                    {pageTitle}
                </h1>
                <p style={{ fontSize: 14, color: c.text3, lineHeight: 1.5 }}>{pageSub}</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: 100, background: c.surface, borderRadius: 18, animation: 'pulse 1.5s ease infinite' }} />
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <div style={{ background: c.surface, borderRadius: 20, padding: '32px 20px', textAlign: 'center' }}>
                    <BookOpen size={40} color={c.text4} style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>תוכן בדרך</p>
                    <p style={{ fontSize: 14, color: c.text3 }}>מאמרים חדשים יתווספו בקרוב</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {articles.map((article, i) => (
                        <motion.div
                            key={article.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(article)}
                            style={{
                                background: c.surface, borderRadius: 18,
                                overflow: 'hidden', cursor: 'pointer',
                                boxShadow: c.cardShadow,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {i === 0 && article.image && (
                                <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
                                    <img src={article.image} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            <div style={{ padding: '14px 16px', direction: 'rtl' }}>
                                {article.category && (
                                    <span style={{ display: 'inline-block', background: 'rgba(88,86,214,0.08)', color: '#5856D6', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, marginBottom: 8 }}>
                                        {article.category}
                                    </span>
                                )}
                                <p style={{ fontSize: 15, fontWeight: 800, color: c.text, lineHeight: 1.3, marginBottom: 6,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {article.title}
                                </p>
                                {article.excerpt && (
                                    <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.5, marginBottom: 8,
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {article.excerpt}
                                    </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={11} color={c.text4} />
                                    <span style={{ fontSize: 11, color: c.text4 }}>
                                        {article.publishedAt?.toDate?.()?.toLocaleDateString('he-IL') || ''}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
