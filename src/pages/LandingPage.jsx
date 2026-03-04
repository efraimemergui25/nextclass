import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const LandingPage = () => {
    return (
        <PageTransition>
            <div className="flex flex-col bg-[#F5F5F7] -mt-[73px]">

                {/* Hero Section */}
                <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
                    {/* Background Image & Overlay */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=2000')" }} // Darker, futuristic classroom placeholder
                    />
                    <div className="absolute inset-0 z-0 bg-black/50" /> {/* Dark tint overlay */}

                    <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 w-full flex flex-col items-center text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        >
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.05] mb-8 drop-shadow-lg">
                                הופכים כל כיתה למרחב של השראה.
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-200 font-normal leading-relaxed mb-12 max-w-3xl mx-auto drop-shadow-md">
                                טכנולוגיית קצה, מסכים אינטראקטיביים ומעבדות חכמות. הסטנדרט החדש של מוסדות החינוך המובילים בישראל.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Link to="/catalog">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        animate={{ boxShadow: ["0 8px 25px rgba(0,122,255,0.4)", "0 12px 35px rgba(0,122,255,0.6)", "0 8px 25px rgba(0,122,255,0.4)"] }}
                                        transition={{ boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
                                        className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-[#007AFF] rounded-full focus:outline-none w-full sm:w-auto"
                                    >
                                        גלה את ציוד המחר
                                    </motion.button>
                                </Link>
                                <motion.a
                                    href="#consultation"
                                    whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.1)" }}
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-transparent border-2 border-white rounded-full focus:outline-none transition-colors duration-300 w-full sm:w-auto backdrop-blur-sm"
                                >
                                    ייעוץ פדגוגי חינם
                                </motion.a>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Trust & Social Proof Strip */}
                <section className="bg-white py-12 border-b border-gray-100 relative z-10 shadow-sm">
                    <div className="max-w-[1400px] mx-auto px-6 md:px-12 text-center">
                        <motion.h3
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-sm md:text-base font-medium text-gray-400 tracking-wide mb-8"
                        >
                            נבחר על ידי למעלה מ-500 מוסדות חינוך ורשויות מקומיות:
                        </motion.h3>

                        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-80">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.05, filter: "grayscale(0%)", opacity: 1 }}
                                    className="w-24 h-12 md:w-32 md:h-16 flex items-center justify-center filter grayscale transition-all duration-300 cursor-default"
                                >
                                    {/* Placeholders for logos */}
                                    <div className="w-full h-full bg-gray-200/50 rounded-lg flex items-center justify-center text-gray-400 font-bold text-xl uppercase tracking-widest">
                                        LOGO {i}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* "Why Us" Value Proposition Grid (Law of Proximity) */}
                <section className="py-24 bg-[#F5F5F7]">
                    <div className="max-w-7xl mx-auto px-6 md:px-12">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-black text-[#1D1D1F] text-center mb-16 tracking-tight"
                        >
                            למה nextclass?
                        </motion.h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                            {/* Feature 1 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#007AFF] flex items-center justify-center mb-8">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-4">אחריות מוסדית מורחבת</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    שקט נפשי ל-3 שנים עם שירות טכנאי עד הכיתה. אנחנו דואגים להכל כדי שהמורים יוכלו להתמקד בללמד.
                                </p>
                            </motion.div>

                            {/* Feature 2 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center mb-8 border border-gray-100">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.866 8.21 8.21 0 003 2.48z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-4">ליווי והטמעה פדגוגית</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    אנחנו לא רק מספקים ציוד, אנחנו מלמדים את הצוות איך להפיק ממנו את המקסימום ולהעצים את החוויה הלימודית.
                                </p>
                            </motion.div>

                            {/* Feature 3 */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-4">תקן משרד החינוך</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    כל המוצרים שלנו עומדים בתקנים המחמירים ביותר לבטיחות ואיכות, מאושרים ומותאמים לסביבה הבית-ספרית.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

            </div>
        </PageTransition>
    );
};

export default LandingPage;
