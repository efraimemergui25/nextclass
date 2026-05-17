import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useSettings } from '../../context/SettingsContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileVOD() {
    const { getSetting } = useSettings();
    const [videos, setVideos] = useState([]);
    const [selected, setSelected] = useState(null);

    const pageTitle = getSetting('vod_title', 'עתיד הלמידה, עכשיו.');
    const pageSub   = getSetting('vod_subtitle', 'הדרכות וידאו מקצועיות לשימוש מיטבי בציוד');

    useEffect(() => {
        getDocs(query(collection(db, 'vod_videos'), orderBy('order', 'asc')))
            .then(snap => setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .catch(() => {});
    }, []);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '16px 16px 32px' }}>

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
                <div style={{ background: '#000', borderRadius: 18, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/9' }}>
                    <iframe
                        src={selected.embedUrl || selected.url}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        title={selected.title}
                    />
                </div>
            )}

            {/* ── Videos list ───────────────────────────────────────── */}
            {videos.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 20, padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>תוכן בדרך</p>
                    <p style={{ fontSize: 14, color: '#86868B' }}>הדרכות וידאו יתווספו בקרוב</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {videos.map(video => (
                        <motion.div
                            key={video.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(video)}
                            style={{
                                background: '#fff', borderRadius: 18,
                                overflow: 'hidden', cursor: 'pointer',
                                display: 'flex', gap: 0,
                                boxShadow: selected?.id === video.id ? '0 0 0 2px #007AFF, 0 4px 20px rgba(0,122,255,0.15)' : '0 1px 4px rgba(0,0,0,0.07)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {/* Thumbnail */}
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
                            {/* Info */}
                            <div style={{ flex: 1, padding: '12px 14px', direction: 'rtl' }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3, marginBottom: 5,
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {video.title}
                                </p>
                                {video.duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} color="#86868B" />
                                        <span style={{ fontSize: 11, color: '#86868B' }}>{video.duration}</span>
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
