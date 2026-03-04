import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const hotspots = [
    {
        id: 1,
        top: "20%",
        right: "25%",
        title: "זכוכית מחוסמת 4mm",
        description: "עמידה בפני שריטות וחיידקים. בטוחה לשימוש בכיתות ילדים."
    },
    {
        id: 2,
        top: "50%",
        right: "70%",
        title: "20 נקודות מגע",
        description: "תמיכה בכתיבה רב-משתמשית — עד 20 תלמידים בו-זמנית."
    },
    {
        id: 3,
        top: "78%",
        right: "50%",
        title: "מעמד אלומיניום מתכוונן",
        description: "גובה מתכוונן חשמלית מ-70 ס״מ עד 190 ס״מ, מותאם נגישות."
    },
    {
        id: 4,
        top: "15%",
        right: "80%",
        title: 'רזולוציית 4K UHD',
        description: "תצוגה חדה במיוחד, 3840×2160 פיקסלים, בהירות 450 nits."
    }
];

const Hotspot = ({ spot }) => {
    const [isActive, setIsActive] = useState(false);

    return (
        <div
            className="absolute z-10"
            style={{ top: spot.top, right: spot.right }}
            onMouseEnter={() => setIsActive(true)}
            onMouseLeave={() => setIsActive(false)}
            onClick={() => setIsActive(!isActive)}
        >
            {/* Pulsing Dot */}
            <motion.div className="relative w-6 h-6 cursor-pointer">
                {/* Radar pulse */}
                <motion.span
                    className="absolute inset-0 rounded-full bg-brand-blue"
                    animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                />
                {/* Core dot */}
                <span className="absolute inset-0 bg-brand-blue rounded-full shadow-[0_0_15px_rgba(0,122,255,0.5)] ring-2 ring-white" />
            </motion.div>

            {/* Tooltip Card */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-8 right-0 bg-brand-dark/95 backdrop-blur-md text-white p-4 rounded-2xl w-52 z-20 shadow-2xl pointer-events-none"
                    >
                        <h4 className="font-bold text-sm mb-1">{spot.title}</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">{spot.description}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ProductHotspots = ({ imageUrl = "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=1200" }) => {
    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-brand-light">
            <img
                src={imageUrl}
                alt="Product Interactive View"
                className="w-full rounded-3xl object-cover"
            />
            {/* Hotspot Dots */}
            {hotspots.map((spot) => (
                <Hotspot key={spot.id} spot={spot} />
            ))}
        </div>
    );
};

export default ProductHotspots;
