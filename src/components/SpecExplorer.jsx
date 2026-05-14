import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultHotspots = [
    {
        id: 1, x: 22, y: 28, title: "OLED P-Matrix", description: "פאנל מקצועי עם ניגודיות אבסולוטית וצבע שחור מוחלט.", icon: (
            <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        )
    },
    {
        id: 2, x: 74, y: 43, title: "AirPlay Pro", description: "שבב רשת כפול להזרמת מדיה יציבה ללא השהיות.", icon: (
            <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
        )
    },
    {
        id: 3, x: 42, y: 78, title: "Studio Audio Array", description: "מערך רמקולים קדמי עם ביטול רעשים אקטיבי.", icon: (
            <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
        )
    }
];

const SpecExplorer = ({ imageSrc, hotspots = defaultHotspots }) => {
    const [activeSpot, setActiveSpot] = useState(null);

    return (
        <div
            className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.18)]"
            style={{
                background: 'linear-gradient(135deg, #0d0d14 0%, #111119 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            {/* Ambient glow behind image */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(0,122,255,0.08) 0%, transparent 70%)' }}
            />

            {/* Product Image — center-contained so it's always visible */}
            {imageSrc ? (
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <img
                        src={imageSrc}
                        alt="Product X-Ray View"
                        className="w-full h-full object-contain drop-shadow-2xl"
                        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }}
                    />
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-bold text-white tracking-widest">nextclass</span>
                    </div>
                </div>
            )}

            {/* Subtle vignette overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)' }}
            />

            {/* Hotspots */}
            {hotspots.map((spot) => (
                <div
                    key={spot.id}
                    className="absolute z-10"
                    style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                    onMouseEnter={() => setActiveSpot(spot.id)}
                    onMouseLeave={() => setActiveSpot(null)}
                    onClick={() => setActiveSpot(activeSpot === spot.id ? null : spot.id)}
                >
                    {/* Pulsing dot */}
                    <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                        <span className="absolute inline-flex w-full h-full rounded-full bg-[#007AFF]/40 animate-ping" />
                        <span className="relative inline-flex rounded-full w-3.5 h-3.5 bg-[#007AFF] ring-2 ring-white/30 shadow-[0_0_12px_rgba(0,122,255,0.8)] transition-transform group-hover:scale-125" />
                    </div>

                    {/* Glass Tooltip */}
                    <AnimatePresence>
                        {activeSpot === spot.id && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className={`absolute z-50 w-60 p-4 rounded-2xl pointer-events-none
                                    ${spot.x > 50 ? 'right-4' : 'left-4'}
                                    ${spot.y > 50 ? 'bottom-8' : 'top-8'}
                                `}
                                dir="rtl"
                                style={{
                                    background: 'rgba(20,20,28,0.85)',
                                    backdropFilter: 'blur(24px) saturate(1.8)',
                                    WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div
                                        className="p-1.5 rounded-lg"
                                        style={{
                                            background: 'rgba(0,122,255,0.15)',
                                            border: '1px solid rgba(0,122,255,0.2)',
                                        }}
                                    >
                                        {spot.icon}
                                    </div>
                                    <h4 className="font-black text-white text-sm tracking-tight">{spot.title}</h4>
                                </div>
                                <p className="text-gray-400 text-xs font-medium leading-relaxed">{spot.description}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Corner label */}
            <div
                className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full"
                style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <span className="text-[10px] font-bold text-white/50 tracking-widest">Interactive X-Ray</span>
            </div>
        </div>
    );
};

export default SpecExplorer;
