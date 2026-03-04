import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = () => {
    const handleScrollDown = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    };

    return (
        <section className="h-screen w-full relative flex items-center justify-center text-center overflow-hidden">
            {/* Background Image (Abstract/Tech/Clean Classroom) */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
            />

            {/* Critical CRO Overlay: Readability to Brand Flow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-brand-light" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 mt-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight drop-shadow-lg leading-tight mb-6">
                        הופכים כל כיתה <br className="md:hidden" />למרחב של השראה.
                    </h1>

                    <p className="mt-6 text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
                        טכנולוגיית קצה למוסדות החינוך המובילים בישראל.
                    </p>

                    {/* Gestalt Proximity: Highly Refined Primary Action */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mt-10 flex justify-center"
                    >
                        <motion.button
                            onClick={handleScrollDown}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-brand-blue text-white rounded-full px-10 py-4 font-bold text-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            לכל הפתרונות
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Down Indicator (Gestalt Continuity) */}
            {/* Absolute positioning using standard Tailwind, animated with Framer Motion y-axis bounce */}
            <motion.div
                className="absolute bottom-10 left-1/2 cursor-pointer text-white/70 hover:text-white transition-colors"
                style={{ translateX: "-50%" }}
                onClick={handleScrollDown}
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                aria-label="גלול מטה"
            >
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </motion.div>
        </section>
    );
};

export default HeroSection;
