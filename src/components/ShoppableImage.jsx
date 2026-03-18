import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const hotspots = [
    {
        id: "touch-pro-75",
        x: "48%", // Position on the main screen
        y: "35%",
        title: "מסך מגע אינטראקטיבי NextBoard Pro 75\"",
        description: "הלב הפועם של הכיתה החכמה. 40 נקודות מגע וזכוכית Zero Bonding.",
        linkTo: "/catalog/touch-pro-75",
        direction: "top"
    },
    {
        id: "pc-staff-setup",
        x: "72%", // Position on the teacher's desk
        y: "65%",
        title: "עמדת מחשב מתקדמת לצוות מנהלה",
        description: "Mini-PC משולב עם מסך 24 אינץ׳ לניהול שיעורים ומערכות פדגוגיות.",
        linkTo: "/catalog/pc-staff-setup",
        direction: "bottom"
    },
    {
        id: "edu-edit-basic",
        x: "25%", // Position on a student tablet/laptop
        y: "75%",
        title: "תוכנת ניהול ועריכה EduEdit",
        description: "רישוי מוסדי חכם לניהול ועריכת תכנים עם תמיכה במאות עמדות.",
        linkTo: "/catalog/edu-edit-basic",
        direction: "top"
    }
];

const ShoppableImage = () => {
    const [activeHotspot, setActiveHotspot] = useState(null);

    return (
        <section className="w-full bg-[#1D1D1F] py-24 px-6 md:px-12 overflow-hidden">
            <div className="max-w-[1400px] mx-auto flex flex-col items-center">

                {/* Section Header */}
                <div className="text-center mb-16 max-w-3xl">
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter mb-6 leading-[1.1]">
                        למידה שיוצאת מהמסגרת
                    </h2>
                    <p className="text-xl text-gray-400 font-normal leading-relaxed">
                        חקור את אקו-סיסטם הלמידה השלם שלנו. פתרונות שמשתלבים אחד בשני ליצירת חוויה פדגוגית חלקה.
                    </p>
                </div>

                {/* The Interactive Canvas */}
                <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl bg-gray-900">
                    <img
                        src="https://images.unsplash.com/photo-1588702545911-5f940bb36109?q=80&w=2000&auto=format&fit=crop"
                        alt="Smart Classroom Environment"
                        className="w-full h-full object-cover opacity-80"
                        onMouseEnter={() => setActiveHotspot(null)} // Clear active state if mouse leaves hotspots into plain image
                        onError={(e) => {
                            if (!e.target.dataset.triedFallback) {
                                e.target.dataset.triedFallback = 'true';
                                e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                            } else {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";
                            }
                        }}
                    />

                    {/* Overlay Gradient for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Hotspots */}
                    {hotspots.map((spot) => (
                        <div
                            key={spot.id}
                            className="absolute z-10"
                            style={{ left: spot.x, top: spot.y, transform: 'translate(-50%, -50%)' }}
                            onMouseEnter={() => setActiveHotspot(spot.id)}
                            onMouseLeave={() => setActiveHotspot(null)}
                        >
                            {/* The Pulsing Dot */}
                            <div className="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
                                {/* Pulse Halo */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.6, 0, 0.6]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 bg-[#007AFF] rounded-full"
                                />
                                {/* Solid Core */}
                                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_0_8px_rgb(0_122_255/0.4)] group-hover:scale-125 transition-transform duration-300 z-10" />
                            </div>

                            {/* The Tooltip (Glassmorphism) */}
                            <AnimatePresence>
                                {activeHotspot === spot.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: spot.direction === 'top' ? 10 : -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: spot.direction === 'top' ? 10 : -10 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                        className={`absolute left-1/2 -translate-x-1/2 ${spot.direction === 'top' ? 'bottom-full mb-4' : 'top-full mt-4'} w-72 bg-white/85 backdrop-blur-3xl p-5 rounded-2xl shadow-[0_20px_40px_rgb(0_0_0/0.3)] border border-white/40 z-50 flex flex-col`}
                                    >
                                        {/* CSS Triangle Pointer */}
                                        <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white/85 backdrop-blur-3xl border-white/40 rotate-45 ${spot.direction === 'top' ? 'bottom-[-8px] border-b border-r' : 'top-[-8px] border-t border-l'}`} />

                                        <div className="relative z-10 text-right">
                                            <h4 className="font-black text-xl text-[#1D1D1F] mb-1 leading-tight tracking-tighter">
                                                {spot.title}
                                            </h4>
                                            <p className="text-sm font-medium text-gray-500 mb-4 leading-snug">
                                                {spot.description}
                                            </p>
                                            <Link to={spot.linkTo} className="block w-full">
                                                <button className="w-full bg-[#007AFF] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 active:scale-[0.97] transition-all shadow-sm">
                                                    לפרטים המלאים
                                                </button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShoppableImage;
