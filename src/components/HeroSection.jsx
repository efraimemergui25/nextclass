import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();

    const handleScrollDown = () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    };

    return (
        <section className="h-screen w-full relative flex items-center justify-center text-center overflow-hidden font-sans antialiased">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="text-hero text-white mb-6 drop-shadow-2xl">
                        חדשנות חסרת פשרות.
                        <br />
                        <span className="text-white/90 font-bold">מקצוענות בכל מרחב למידה.</span>
                    </h1>

                    <p className="text-hero-sub text-gray-300 mx-auto">
                        הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.
                    </p>

                    {/* CTA — True iOS Glassmorphism on dark cinematic background */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="mt-10 flex justify-center"
                    >
                        <motion.button
                            onClick={() => navigate('/catalog')}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="backdrop-blur-xl bg-white/10 border border-white/20 text-white font-bold tracking-wide rounded-full px-10 py-4 text-lg hover:bg-white hover:text-black transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            לכל הפתרונות
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Down Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 cursor-pointer text-white/70 hover:text-white active:scale-[0.97] transition-all duration-300"
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
