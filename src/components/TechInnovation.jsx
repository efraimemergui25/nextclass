import React from 'react';
import { motion } from 'framer-motion';

const TechInnovation = () => {
    return (
        <section className="py-16 md:py-24 lg:py-32 bg-[#F5F5F7] overflow-hidden" dir="rtl">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12">
                {/* Hero Typography */}
                <div className="text-center mb-16 md:mb-24 flex flex-col gap-4 max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-7xl font-black text-[#1D1D1F] tracking-tight leading-tight"
                    >
                        טכנולוגיה שמשנה את
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-purple-600"> חוקי הלמידה</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg md:text-2xl text-gray-500 font-medium leading-relaxed max-w-3xl mx-auto"
                    >
                        כל מסך נבנה בדיוק הנדסי ומכיל את השבבים, החיישנים, ומשטחי המגע המתקדמים ביותר בשוק כיום. עבודה חלקה, עמידות אינסופית.
                    </motion.p>
                </div>

                {/* The Tech Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 auto-rows-[300px] md:auto-rows-[400px]">

                    {/* Card 1: Zero Bonding (Large Span) */}
                    <div className="md:col-span-2 md:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm border border-white hover:shadow-xl transition-all duration-500 flex flex-col justify-end">
                        <div className="absolute top-0 right-0 w-full h-[60%] bg-gradient-to-b from-[#007AFF]/10 to-transparent pointer-events-none" />

                        {/* Abstract Tech Graphic for Zero Bonding */}
                        <div className="absolute top-8 left-8 flex gap-1 items-end opacity-80 group-hover:scale-105 transition-transform duration-700">
                            <motion.div
                                animate={{ height: ['4px', '60px', '4px'] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="w-1.5 bg-[#007AFF] rounded-t-full rounded-b-sm"
                            />
                            <motion.div
                                animate={{ height: ['4px', '40px', '4px'] }}
                                transition={{ repeat: Infinity, duration: 3, delay: 0.5, ease: "easeInOut" }}
                                className="w-1.5 bg-blue-400 rounded-t-full rounded-b-sm"
                            />
                            <motion.div
                                animate={{ height: ['4px', '80px', '4px'] }}
                                transition={{ repeat: Infinity, duration: 3, delay: 1, ease: "easeInOut" }}
                                className="w-1.5 bg-purple-500 rounded-t-full rounded-b-sm"
                            />
                        </div>

                        <div className="relative z-10 max-w-sm">
                            <h3 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">Zero Bonding</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                ללא פערי אוויר בין המגע למסך. חוויית כתיבה טבעית, חלקה, ומיידית ממש כמו עט על דף מסורתי. דיוק מקסימלי בכל מגע.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Durability (Shield Glass) */}
                    <div className="md:col-span-1 md:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm border border-white hover:shadow-xl transition-all duration-500 flex flex-col">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg mb-8"
                        >
                            <svg className="w-8 h-8 text-white group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </motion.div>
                        <div className="mt-auto">
                            <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-2">זכוכית מוקשחת מגינה</h3>
                            <p className="text-gray-500 font-medium text-sm leading-relaxed">
                                רמת קשיחות 9H (Anti-Glare / Anti-Friction), חסינה לשריטות ומכות פיזיות כבדות בסביבה דינמית.
                            </p>
                        </div>
                    </div>

                    {/* Card 3: 4K OLED (Left column bottom) */}
                    <div className="md:col-span-1 md:row-span-1 bg-[#1D1D1F] rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl transition-all duration-500 flex flex-col justify-end border border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,122,255,0.3),transparent_50%)]" />
                        <div className="absolute top-10 right-10">
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 font-black text-6xl tracking-tighter">4K</span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2">בהירות שלא הכרת</h3>
                            <p className="text-gray-400 font-medium text-sm leading-relaxed">
                                תצוגה צלולה תחת כל עיצוב תאורה, עם יחס ניגודיות שמאפשר קריאה מכל זווית בכיתה.
                            </p>
                        </div>
                    </div>

                    {/* Card 4: Audio Array (Wide Span Bottom) */}
                    <div className="md:col-span-2 md:row-span-1 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm border border-white hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col justify-end">
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-10 left-10 hidden md:flex gap-1.5 items-end opacity-40 group-hover:opacity-100 transition-opacity">
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: ['10px', `${Math.random() * 40 + 10}px`, '10px'] }}
                                    transition={{ repeat: Infinity, duration: Math.random() * 0.5 + 0.5, ease: "easeInOut", delay: Math.random() }}
                                    className="w-2 bg-gray-800 rounded-full"
                                />
                            ))}
                        </div>
                        <div className="relative z-10 max-w-sm">
                            <h3 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-3">מערך שמע מרחבי</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                מיקרופונים חכמים לביטול רעשים אקוסטי, ורמקולים עוצמתיים ברזולוציה גבוהה (High-Res Audio). קולו של המרצה נשמע היטב בכל נקודה בחדר.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default TechInnovation;
