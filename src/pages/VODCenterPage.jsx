import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const videos = [
    {
        title: "איך להשתמש בלוח הלבן האינטראקטיבי",
        duration: "03:45",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "חיבור מסך מגע לרשת בית ספרית",
        duration: "05:12",
        thumbnail: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "הגדרת EduEdit Studio בפעם הראשונה",
        duration: "07:30",
        thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "ניהול כיתה דיגיטלית עם Google Classroom",
        duration: "04:18",
        thumbnail: "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "שימוש ב-20 נקודות מגע בו-זמנית",
        duration: "02:55",
        thumbnail: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "התקנת מעמד חשמלי מתכוונן",
        duration: "06:10",
        thumbnail: "https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=600"
    }
];

const VideoCard = ({ video }) => (
    <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
        className="group cursor-pointer"
    >
        {/* Thumbnail with Play Overlay */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-200 mb-4">
            <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 backdrop-blur-[2px] transition-all flex items-center justify-center">
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl"
                >
                    <svg className="w-7 h-7 text-brand-dark mr-[-2px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </motion.div>
            </div>
            {/* Duration Badge */}
            <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {video.duration}
            </span>
        </div>

        {/* Info */}
        <h3 className="font-black text-brand-dark text-base md:text-lg leading-tight group-hover:text-brand-blue tracking-tighter transition-colors">
            {video.title}
        </h3>
    </motion.div>
);

const VODCenterPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-surface pt-32 pb-24 px-6 w-full">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <h1 className="text-5xl md:text-6xl font-black text-brand-dark tracking-tighter leading-[1.1] mb-4">
                        לומדים מהטובים ביותר.
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 font-normal leading-relaxed">
                        ספריית ההדרכות המלאה לצוותי ההוראה.
                    </p>
                </motion.div>

                {/* Video Grid */}
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-[1400px] mx-auto"
                >
                    {videos.map((video, idx) => (
                        <motion.div
                            key={idx}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 } }
                            }}
                        >
                            <VideoCard video={video} />
                        </motion.div>
                    ))}
                </motion.div>

            </div>
        </PageTransition>
    );
};

export default VODCenterPage;
