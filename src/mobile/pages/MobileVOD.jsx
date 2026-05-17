import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, X } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileVOD() {
    const { getSetting } = useSettings();
    const { colors: c }  = useTheme();
    const [videos,   setVideos]   = useState(null);
    const [selected, setSelected] = useState(null);

    const pageTitle = getSetting('vod_title', 'עתיד הלמידה, עכשיו.');
    const pageSub   = getSetting('vod_subtitle', 'הדרכות וידאו מקצועיות לשימוש מיטבי בציוד');

    useEffect(() => {
        getDocs(query(collection(db, 'vod_videos'), orderBy('order', 'asc')))
            .then(snap => setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .catch(() => setVideos([]));
    }, []);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px', background: c.bg, minHeight: '100dvh' }}>
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* ── Header card ───────────────────────────────────────── */}
            <div style={{
                borderRadius: 22, padding: '24px 20px', marginBottom: 20,
                background: 'linear-gradient(145deg, #1C1C1E 0%, #2C2C2E 100%)',
                boxShadow: '0 6px 30px rgba(0,0,0,0.18)',
            }}>
                <div style={{ display: 'inline-block', background: 'rgba(255,149,0,0.18)', color: '#FF9500', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 12, letterSpacing: '0.04em' }}>
                    מרכז הדרכה
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.2, marginBottom: 8 }}>
                    {pageTitle}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{pageSub}</p>
            </div>

            {/* ── Selected video player ─────────────────────────────── */}
            {selected && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: c.text, flex: 1, lineHeight: 1.3,
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {selected.title}
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.82 }}
                            onClick={() => setSelected(null)}
                            aria-label="סגור וידאו"
                            style={{
                                width: 30, height: 30, borderRadius: 99, flexShrink: 0, marginRight: 8,
                                background: c.subtleBg, border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <X size={14} strokeWidth={2.5} color={c.text2} />
                        </motion.button>
                    </div>
                    <div style={{ background: '#000', borderRadius: 18, overflow: 'hidden', aspectRatio: '16/9' }}>
                        <iframe
                            src={selected.embedUrl || selected.url}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={selected.title}
                        />
                    </div>
                </div>
            )}

            {/* ── Videos list ───────────────────────────────────────── */}
            {videos === null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{ background: c.surface, borderRadius: 18, overflow: 'hidden', display: 'flex', boxShadow: c.cardShadow }}>
                            <div style={{ width: 110, height: 80, background: `linear-gradient(90deg, ${c.shimmerA} 25%, ${c.shimmerB} 50%, ${c.shimmerA} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
                            <div style={{ flex: 1, padding: '16px 14px' }}>
                                <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, marginBottom: 8 }} />
                                <div style={{ height: 12, borderRadius: 6, background: c.shimmerA, width: '50%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div style={{ background: c.surface, borderRadius: 20, padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 6 }}>תוכן בדרך</p>
                    <p style={{ fontSize: 14, color: c.text3 }}>הדרכות וידאו יתווספו בקרוב</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {videos.map(video => (
                        <motion.div
                            key={video.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(video)}
                            style={{
                                background: c.surface, borderRadius: 18,
                                overflow: 'hidden', cursor: 'pointer',
                                display: 'flex', gap: 0,
                                boxShadow: selected?.id === video.id ? '0 0 0 2px #007AFF, 0 4px 20px rgba(0,122,255,0.15)' : c.cardShadow,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <div style={{ width: 110, height: 80, background: '#1C1C1E', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                                {video.thumbnail ? (
                                    <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1C1C1E, #2C2C2E)' }}>
                                        <Play size={24} color="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.3)" />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Play size={14} color="#fff" fill="#fff" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ flex: 1, padding: '12px 14px', direction: 'rtl' }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 5,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {video.title}
                                </p>
                                {video.duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} color={c.text3} />
                                        <span style={{ fontSize: 11, color: c.text3 }}>{video.duration}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
