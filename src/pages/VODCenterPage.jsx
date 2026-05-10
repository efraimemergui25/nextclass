import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
        if (video.videoUrl) {
            window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
            className="group cursor-pointer"
            onClick={handlePlay}
        >
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-200 mb-4">
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                        if (!e.target.dataset.triedFallback) {
                            e.target.dataset.triedFallback = 'true';
                            e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
                        }
                    }}
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 backdrop-blur-[2px] transition-all flex items-center justify-center">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl"
                    >
                        <svg className="w-7 h-7 text-[#1D1D1F] ml-[-2px]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </motion.div>
                </div>
                <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    {video.duration}
                </span>
                {video.category && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#007AFF] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {video.category}
                    </span>
                )}
            </div>
            <h3 className="font-black text-[#1D1D1F] text-base md:text-lg leading-tight group-hover:text-[#007AFF] tracking-tighter transition-colors">
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
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#1D1D1F] tracking-tighter leading-[1.1] mb-4">
                        לומדים מהטובים ביותר.
                    </h1>
                    <p className="text-lg md:text-xl text-[#6E6E73] font-normal leading-relaxed">
                        ספריית ההדרכות המלאה לצוותי ההוראה.
                    </p>
                </motion.div>

                {visible.length === 0 ? (
                    <div className="text-center py-20 text-[#AEAEB2]">אין סרטונים להצגה כרגע.</div>
                ) : (
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-[1400px] mx-auto"
                    >
                        {visible.map(video => (
                            <motion.div key={video.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 } },
                                }}
                            >
                                <VideoCard video={video} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </PageTransition>
    );
};

export default VODCenterPage;
