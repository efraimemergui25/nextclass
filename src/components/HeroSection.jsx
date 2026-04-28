import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();

    const handleScrollDown = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    // Staggered word reveal for headline
    const titleWords = ['חדשנות', 'חסרת', 'פשרות.'];
    const subWords = ['מקצוענות', 'בכל', 'מרחב', 'למידה.'];

    return (
        <section className="h-screen w-full relative flex items-center justify-center text-center overflow-hidden font-sans antialiased">

            {/* Background — parallax-ready, subtle scale-in */}
            <motion.div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                initial={{ scale: 1.08 }}
                animate={{ scale: 1.0 }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
            />

            {/* Multi-layer gradient overlay — deep cinema feel */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            {/* Vignette edges */}
            <div className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

            {/* Ambient blue glow from below — visionOS inspired */}
            <div className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(0,122,255,0.08) 0%, transparent 100%)',
                    filter: 'blur(40px)',
                }} />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6">

                {/* Eyebrow label */}
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-white/60 mb-6"
                >
                    הדור הבא של טכנולוגיה לחינוך
                </motion.span>

                {/* Staggered headline */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-3">
                    {titleWords.map((word, i) => (
                        <motion.span
                            key={word}
                            className="text-hero text-white drop-shadow-2xl"
                            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </div>

                {/* Second headline line */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-8">
                    {subWords.map((word, i) => (
                        <motion.span
                            key={word}
                            className="text-hero text-white/80 font-bold drop-shadow-2xl"
                            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8, delay: 0.45 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </div>

                {/* Subtitle */}
                <motion.p
                    className="text-hero-sub text-gray-300 mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                    הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.
                </motion.p>

                {/* CTA Row — Single button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-10 flex justify-center"
                >
                    {/* Primary CTA */}
                    <motion.button
                        onClick={() => navigate('/discover')}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                        className="relative overflow-hidden font-bold tracking-wide rounded-full px-12 py-4 text-lg text-white hover:text-[#1D1D1F] hover:bg-white transition-all duration-500"
                        style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
                            backdropFilter: 'blur(24px) saturate(1.5)',
                            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                            border: '1px solid rgba(255,255,255,0.30)',
                            boxShadow: '0 1px 0 rgba(255,255,255,0.20) inset, 0 8px 32px rgba(0,0,0,0.22), 0 0 60px rgba(255,255,255,0.06)',
                        }}
                    >
                        <span className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                        גלו את הפתרונות שלנו
                    </motion.button>
                </motion.div>
            </div>

            {/* Scroll Down Indicator */}
            <motion.button
                className="absolute bottom-10 left-1/2 text-white/50 hover:text-white transition-colors duration-300 focus:outline-none"
                style={{ translateX: '-50%' }}
                onClick={handleScrollDown}
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                aria-label="גלול מטה"
            >
                {/* Animated ring */}
                <div className="relative flex flex-col items-center gap-2">
                    <div className="w-6 h-9 rounded-full border-2 border-current flex items-start justify-center pt-1.5">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-current"
                            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                        />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">גלול</span>
                </div>
            </motion.button>
        </section>
    );
};

export default HeroSection;
