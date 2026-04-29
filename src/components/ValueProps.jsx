import React from 'react';
import { motion } from 'framer-motion';

const ValueProps = () => {
    const props = [
        {
            title: "אחריות מוסדית מורחבת",
            description: "שקט נפשי לשנים עם שירות טכנאי עד לכיתת הלימוד.",
            gradient: "from-blue-500 to-blue-600",
            glow: "rgba(0,122,255,0.15)",
            icon: (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            title: "ליווי והטמעה פדגוגית",
            description: "הדרכות לצוותי ההוראה כדי להפיק את המקסימום מהטכנולוגיה.",
            gradient: "from-violet-500 to-purple-600",
            glow: "rgba(139,92,246,0.15)",
            icon: (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
            )
        },
        {
            title: "מאושר משרד החינוך",
            description: "עמידה מלאה בתקנים המחמירים ביותר לבטיחות ואיכות.",
            gradient: "from-emerald-500 to-teal-500",
            glow: "rgba(16,185,129,0.15)",
            icon: (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 36, scale: 0.97 },
        show: {
            opacity: 1, y: 0, scale: 1,
            transition: { type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }
        }
    };

    return (
        <section className="bg-brand-light py-16 w-full border-t border-gray-200/50 relative overflow-hidden">
            {/* Ambient background orbs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-30 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full relative z-10">
                {/* Section label */}
                <div className="text-center mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#007AFF]">המסגרת שלנו</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-apple-display font-bold tracking-tighter leading-[1.0] text-[#1D1D1F] text-center mb-10">
                    סטנדרט חדש של שירות למוסדות חינוך
                </h2>

                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
                >
                    {props.map((prop, idx) => (
                        <motion.div
                            key={idx}
                            variants={cardVariants}
                            whileHover={{ y: -8, scale: 1.01, transition: { type: 'spring', stiffness: 400, damping: 24 } }}
                            className="relative group cursor-default"
                        >
                            {/* Card */}
                            <div className="relative rounded-[2rem] p-8 h-full overflow-hidden"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)',
                                    backdropFilter: 'blur(48px) saturate(1.6)',
                                    WebkitBackdropFilter: 'blur(48px) saturate(1.6)',
                                    border: '1px solid rgba(255,255,255,0.80)',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.05), 0 1px 0 rgba(255,255,255,0.95) inset',
                                }}
                            >
                                {/* Ambient glow — expands on hover */}
                                <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-80 opacity-0"
                                    style={{ background: `radial-gradient(circle, ${prop.glow} 0%, transparent 70%)` }} />

                                {/* Top inset shine */}
                                <div className="absolute top-0 left-6 right-6 h-px"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />

                                {/* Icon with gradient badge */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.gradient} flex items-center justify-center mb-6 shadow-lg`}
                                    style={{ boxShadow: `0 8px 20px ${prop.glow}, 0 1px 0 rgba(255,255,255,0.3) inset` }}>
                                    {prop.icon}
                                </div>

                                <h3 className="text-xl font-black tracking-tighter text-[#1D1D1F] mb-3 leading-tight">
                                    {prop.title}
                                </h3>
                                <p className="text-gray-500 font-normal leading-relaxed text-sm md:text-base">
                                    {prop.description}
                                </p>

                                {/* Bottom subtle accent line */}
                                <div className={`absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-gradient-to-r ${prop.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default ValueProps;
