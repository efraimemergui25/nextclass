import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const SocialProofStrip = () => {
    const { getSetting } = useSettings();
    
    const title = getSetting('sp_label', 'נבחר על ידי מעל 500 מוסדות חינוך ועיריות מובילות');
    const clientsRaw = getSetting('sp_clients', 'משרד החינוך, רשת אורט, עיריית תל אביב, אוניברסיטת אריאל, רשת עמל');
    
    const clients = useMemo(() => {
        return (clientsRaw || '').split(',').map(name => ({ name: name.trim(), width: "w-fit" }));
    }, [clientsRaw]);

    return (
        <section className="w-full bg-[#F5F5F7]/50 py-8 border-b border-gray-200/30 overflow-hidden">
            <div className="max-w-[1400px] mx-auto text-center px-6 md:px-12 w-full">

                <h3 className="text-center text-[10px] font-bold text-[#AEAEB2] tracking-[0.25em] mb-6 opacity-60">
                    {title}
                </h3>

                <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-8 md:gap-14 opacity-40 overflow-x-auto snap-x snap-mandatory scrollbar-hide shrink-0 pb-2 md:pb-0 -mx-6 md:mx-0 px-6 md:px-0">
                    {clients.map((client, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05, opacity: 0.8, filter: "grayscale(0%)" }}
                            className={`${client.width} h-10 flex items-center justify-center filter grayscale transition-all duration-500 cursor-default shrink-0 snap-center`}
                        >
                            <div className="text-[#1D1D1F] font-apple-display font-bold text-lg md:text-xl tracking-tight whitespace-nowrap">
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
