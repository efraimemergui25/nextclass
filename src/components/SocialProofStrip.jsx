import React from 'react';
import { motion } from 'framer-motion';

const SocialProofStrip = () => {
    const clients = [
        { name: "משרד החינוך", width: "w-32" },
        { name: "רשת אורט", width: "w-24" },
        { name: "עיריית תל אביב", width: "w-36" },
        { name: "אוניברסיטת אריאל", width: "w-40" },
        { name: "רשת עמל", width: "w-24" }
    ];

    return (
        <section className="w-full bg-brand-light py-10 border-b border-gray-200/50 overflow-hidden">
            <div className="max-w-[1400px] mx-auto text-center px-6 md:px-12 w-full">

                <h3 className="text-center text-sm font-bold text-gray-400 tracking-widest uppercase mb-8">
                    נבחר על ידי מעל 500 מוסדות חינוך, עיריות ורשתות מובילות
                </h3>

                {/* 
                    Gestalt Law of Similarity + Continuity: 
                    Mobile: Horizontal scroll (snap). Desktop: Centered wrap. 
                */}
                <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-12 md:gap-24 opacity-60 overflow-x-auto snap-x snap-mandatory scrollbar-hide shrink-0 pb-4 md:pb-0 -mx-6 md:mx-0 px-6 md:px-0">
                    {clients.map((client, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05, opacity: 1, filter: "grayscale(0%)" }}
                            className={`${client.width} h-12 md:h-16 flex items-center justify-center filter grayscale transition-all duration-300 cursor-default shrink-0 snap-center`}
                        >
                            {/* Text acting as premium placeholder logo */}
                            <div className="w-full flex justify-center text-brand-dark font-black text-xl md:text-2xl tracking-tighter opacity-80 mix-blend-multiply whitespace-nowrap">
                                {client.name}
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default SocialProofStrip;
