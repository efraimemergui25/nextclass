import React from 'react';
import { motion } from 'framer-motion';

const ValueProps = () => {
    const props = [
        {
            title: "אחריות מוסדית מורחבת",
            description: "שקט נפשי לשנים עם שירות טכנאי עד לכיתת הלימוד.",
            icon: (
                <svg className="w-8 h-8 md:w-10 md:h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            title: "ליווי והטמעה פדגוגית",
            description: "הדרכות לצוותי ההוראה כדי להפיק את המקסימום מהטכנולוגיה.",
            icon: (
                <svg className="w-8 h-8 md:w-10 md:h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
            )
        },
        {
            title: "מאושר משרד החינוך",
            description: "עמידה מלאה בתקנים המחמירים ביותר לבטיחות ואיכות.",
            icon: (
                <svg className="w-8 h-8 md:w-10 md:h-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <section className="bg-brand-light py-24 w-full border-t border-gray-200/50">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
                <h2 className="text-section text-center mb-20">
                    סטנדרט חדש של שירות למוסדות חינוך
                </h2>

                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.15 } }
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 text-center"
                >
                    {props.map((prop, idx) => (
                        <motion.div
                            key={idx}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                            }}
                            className="flex flex-col items-center"
                        >
                            <div className="card-premium w-full flex flex-col items-center">
                                <div className="bg-brand-light p-5 md:p-6 rounded-2xl mb-8 flex items-center justify-center">
                                    {prop.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-4 leading-tight">
                                    {prop.title}
                                </h3>
                                <p className="text-body max-w-xs px-2">
                                    {prop.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default ValueProps;
