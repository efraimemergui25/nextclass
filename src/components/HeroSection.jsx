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
                <div className="flex flex-col items-center mb-16">
                    <motion.h1 
                        className="text-white text-6xl md:text-8xl font-apple-display tracking-tight leading-tight mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        חדשנות חסרת פשרות.
                    </motion.h1>
                    <motion.h2
                        className="text-white/60 text-3xl md:text-5xl font-light tracking-tight leading-tight"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        מקצוענות בכל מרחב למידה.
                    </motion.h2>
                </div>

                {/* Subtitle */}
                <motion.p
                    className="text-lg md:text-xl text-gray-400 font-medium leading-loose mx-auto max-w-2xl mb-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
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
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
