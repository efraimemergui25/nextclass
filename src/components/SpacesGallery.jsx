import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPACES = [
    {
        id: 'classroom',
        label: 'הכיתה ההיברידית',
        image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000&auto=format&fit=crop', // High quality classroom
        hotspots: [
            {
                id: 'h1', x: '45%', y: '30%',
                product: 'מסך אינטראקטיבי 75"',
                price: '₪7,900',
                thumbnail: 'https://images.unsplash.com/photo-1626218174358-7769486c4b79?q=80&w=200&auto=format&fit=crop'
            },
            {
                id: 'h2', x: '70%', y: '65%',
                product: 'עגלה ניידת מתכווננת',
                price: '₪1,200',
                thumbnail: 'https://images.unsplash.com/photo-1544414167-106e5797d84b?q=80&w=200&auto=format&fit=crop'
            }
        ]
    },
    {
        id: 'boardroom',
        label: 'חדר ישיבות מנהלים',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop', // High quality boardroom
        hotspots: [
            {
                id: 'h3', x: '50%', y: '40%',
                product: 'מסך פרימיום 86"',
                price: '₪12,500',
                thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=200&auto=format&fit=crop'
            },
            {
                id: 'h4', x: '45%', y: '15%',
                product: 'מצלמת PTZ עוקבת מרצה',
                price: '₪2,800',
                thumbnail: 'https://images.unsplash.com/photo-1616423641403-f8819d9b8fc6?q=80&w=200&auto=format&fit=crop'
            }
        ]
    },
    {
        id: 'stem',
        label: 'מעבדת STEM',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop', // STEM Lab
        hotspots: [
            {
                id: 'h5', x: '60%', y: '35%',
                product: 'מסך מולטי-טאצ\' מוקשח 65"',
                price: '₪5,500',
                thumbnail: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?q=80&w=200&auto=format&fit=crop'
            }
        ]
    }
];

const SpacesGallery = () => {
    const [activeSpaceId, setActiveSpaceId] = useState(SPACES[0].id);
    const [hoveredHotspot, setHoveredHotspot] = useState(null);

    const activeSpace = SPACES.find(s => s.id === activeSpaceId);

    return (
        <div className="bg-white">
            {/* ─── Relevance Bridge (Gestalt Continuity) ─── */}
            <div className="max-w-[1400px] mx-auto py-16 md:py-24 lg:py-32 px-6 text-center flex flex-col gap-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1D1D1F] tracking-tight leading-tight"
                >
                    מסכים אינטראקטיביים שנוצרו עבור המרחבים שלכם.
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-2xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed"
                >
                    בואו לגלות איך אנחנו משנים את חווית הלמידה והעבודה.
                </motion.p>
            </div>

            <section className="relative w-full min-h-[80vh] md:min-h-screen bg-black overflow-hidden group" dir="rtl">

                {/* Immersive Background Image with Crossfade */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSpace.id}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.8, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 z-10 pointer-events-none" />
                        <img
                            src={activeSpace.image}
                            alt={activeSpace.label}
                            className="w-full h-full object-cover object-center"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Sticky Glass Pill-Menu for Navigation */}
                <div className="absolute top-8 inset-x-0 z-50 flex justify-center px-4">
                    <div className="bg-white/10 backdrop-blur-[48px] saturate-[1.8] border border-white/30 p-2 rounded-full flex gap-2 shadow-[0_20px_60px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/10">
                        {SPACES.map(space => (
                            <button
                                key={space.id}
                                onClick={() => setActiveSpaceId(space.id)}
                                className={`relative px-6 py-2 rounded-full text-sm font-bold transition-colors z-10 ${activeSpaceId === space.id ? 'text-[#1D1D1F]' : 'text-white hover:text-white/80'}`}
                            >
                                {activeSpaceId === space.id && (
                                    <motion.div
                                        layoutId="activeSpacePill"
                                        className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {space.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hero Text */}
                <div className="absolute inset-x-0 bottom-12 z-40 text-center px-6 pointer-events-none">
                    <motion.h2
                        key={`title-${activeSpace.id}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl"
                    >
                        {activeSpace.label}
                    </motion.h2>
                    <p className="text-white/80 text-lg md:text-xl font-medium mt-4 max-w-2xl mx-auto drop-shadow-md">
                        גלה כיצד הטכנולוגיה שלנו משתלבת בסביבת העבודה שלך. לחץ על הנקודות המוארות כדי לחקור מוצרים.
                    </p>
                </div>

                {/* Interactive Hotspots */}
                <div className="absolute inset-0 z-30 max-w-7xl mx-auto">
                    <AnimatePresence mode="popLayout">
                        {activeSpace.hotspots.map((hotspot) => (
                            <motion.div
                                key={hotspot.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: 'spring', delay: 0.5 }}
                                className="absolute z-40"
                                style={{ top: hotspot.y, right: hotspot.x }}
                                onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                                onMouseLeave={() => setHoveredHotspot(null)}
                            >
                                {/* Pulsing Dot - Refined with Glass Ring and Blue Core */}
                                <div className="relative w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/30 cursor-pointer flex items-center justify-center shadow-[0_0_20px_rgba(0,122,255,0.3)] group/dot">
                                    <div className="w-3 h-3 bg-[#007AFF] rounded-full shadow-[0_0_12px_#007AFF] z-10" />
                                    <div className="absolute inset-0 rounded-full border border-[#007AFF]/50 animate-ping opacity-75" />
                                    <div className="absolute inset-[-4px] rounded-full bg-[#007AFF]/10 opacity-0 group-hover/dot:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Hover Reveal Card */}
                                <AnimatePresence>
                                    {hoveredHotspot === hotspot.id && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            className="absolute top-12 -right-[110px] md:right-auto md:-left-[120px] w-[320px] bg-white/40 dark:bg-[#1D1D1F]/40 backdrop-blur-[48px] saturate-[1.8] py-5 px-5 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.25)] border border-white/60 flex flex-row-reverse gap-4 z-50 pointer-events-auto items-center ring-1 ring-inset ring-white/40"
                                        >
                                            {/* Product Thumbnail (Right Side) */}
                                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/40 bg-white/20 backdrop-blur-lg">
                                                <img src={hotspot.thumbnail} alt={hotspot.product} className="w-full h-full object-cover mix-blend-multiply" loading="lazy" />
                                            </div>

                                            {/* Content Area (Center/Left) */}
                                            <div className="flex-1 text-right flex flex-col gap-2">
                                                <h4 className="font-black text-[#1D1D1F] text-sm leading-tight line-clamp-2">{hotspot.product}</h4>
                                                <div className="flex items-center justify-between gap-2 mt-auto">
                                                    <span className="font-black text-[#1D1D1F]/80 text-[13px] tracking-tighter truncate">{hotspot.price}</span>
                                                    <button className="bg-[#007AFF] hover:bg-blue-600 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all shadow-md active:scale-95 shrink-0">
                                                        הוסף לעגלה
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

            </section>
        </div>
    );
};

export default SpacesGallery;
