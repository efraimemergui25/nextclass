import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const DEFAULT_VIDEOS = [
    { id: 1, title: 'איך להשתמש בלוח הלבן האינטראקטיבי', duration: '03:45', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
    { id: 2, title: 'חיבור מסך מגע לרשת בית ספרית', duration: '05:12', thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
    { id: 3, title: 'הגדרת EduEdit Studio בפעם הראשונה', duration: '07:30', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
    { id: 4, title: 'ניהול כיתה דיגיטלית עם Google Classroom', duration: '04:18', thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
    { id: 5, title: 'שימוש ב-20 נקודות מגע בו-זמנית', duration: '02:55', thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
    { id: 6, title: 'התקנת מעמד חשמלי מתכוונן', duration: '06:10', thumbnail: 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true },
];

function loadVideos() {
    try {
        const v = localStorage.getItem('nextclass_vod');
        if (v) {
            const parsed = JSON.parse(v);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {}
    return DEFAULT_VIDEOS;
}

const VideoCard = ({ video }) => {
    const handlePlay = () => {
        if (video.videoUrl) window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="group cursor-pointer"
            onClick={handlePlay}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#E5E5EA] mb-3">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    onError={(e) => {
                        if (!e.target.dataset.tried) {
                            e.target.dataset.tried = 'true';
                            e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
                        }
                    }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-[#1D1D1F] translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* Duration badge */}
                <span className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg tracking-wide">
                    {video.duration}
                </span>

                {/* Category badge */}
                {video.category && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#007AFF] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {video.category}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-[#1D1D1F] text-[14px] leading-snug group-hover:text-[#007AFF] tracking-tight transition-colors">
                {video.title}
            </h3>
        </motion.div>
    );
};

const VODCenterPage = () => {
    const [videos, setVideos] = useState(loadVideos);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'nextclass_vod') setVideos(loadVideos());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const visible = videos.filter(v => v.visible !== false);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7]" dir="rtl">

                {/* ── Hero ──────────────────────────────────────────────── */}
                <div className="pt-28 pb-10 px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                        className="max-w-2xl mx-auto"
                    >
                        {/* Eyebrow chip */}
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF]/10 mb-6">
                            <PlayCircle size={13} className="text-[#007AFF]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#007AFF]">מרכז הדרכה</span>
                        </div>

                        <h1 className="text-[40px] sm:text-[52px] font-black text-[#1D1D1F] tracking-tighter leading-[1.08] mb-4">
                            לומדים מהטובים{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>ביותר.</span>
                        </h1>

                        <p className="text-[16px] text-[#86868B] font-medium leading-relaxed">
                            ספריית ההדרכות המלאה לצוותי ההוראה.
                            {visible.length > 0 && (
                                <span className="text-[#AEAEB2]"> · {visible.length} סרטונים</span>
                            )}
                        </p>
                    </motion.div>
                </div>

                {/* ── Divider ───────────────────────────────────────────── */}
                <div className="max-w-[1100px] mx-auto px-6">
                    <div className="h-px bg-black/[0.07] mb-10" />
                </div>

                {/* ── Grid ──────────────────────────────────────────────── */}
                <div className="max-w-[1100px] mx-auto px-6 pb-24">
                    {visible.length === 0 ? (
                        <div className="text-center py-20 text-[#AEAEB2] font-medium">אין סרטונים להצגה כרגע.</div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
                            }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
                        >
                            {visible.map(video => (
                                <motion.div key={video.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 16 },
                                        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
                                    }}
                                >
                                    <VideoCard video={video} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

            </div>
        </PageTransition>
    );
};

export default VODCenterPage;
