import React from 'react';
import { motion } from 'framer-motion';

export const LiveFire = ({ className = "w-[1.2em] h-[1.2em]" }) => (
    <motion.div
        className={`inline-block relative ${className} transform-gpu will-change-transform opacity`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
    >
        <div className="absolute inset-0 bg-gradient-to-t from-[#007AFF] to-[#00B4E6] rounded-full blur-[3px] opacity-80" />
        <div className="absolute inset-[15%] bg-white/40 backdrop-blur-sm rounded-full border border-white/50 flex items-center justify-center overflow-hidden">
            <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-1/2 h-1/2 bg-white/90 rounded-full"
            />
        </div>
    </motion.div>
);

export const LiveRocket = ({ className = "w-[1.2em] h-[1.2em]" }) => (
    <motion.div
        className={`inline-block relative ${className} transform-gpu will-change-transform opacity`}
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
    >
        <div className="absolute inset-0 border-[1.5px] border-white/80 rounded-[30%] shadow-[0_0_12px_rgba(0,122,255,0.6)] animate-pulse" />
        <motion.div
            animate={{ rotateX: 360, rotateZ: 180 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute inset-[15%] bg-gradient-to-tr from-purple-500/60 to-blue-500/60 backdrop-blur-md rounded-[20%]"
        />
    </motion.div>
);

export const LiveIdea = ({ className = "w-[1.2em] h-[1.2em]" }) => (
    <motion.div
        className={`inline-block relative ${className} transform-gpu will-change-transform opacity`}
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
    >
        <div className="absolute inset-0 rounded-full bg-[#1D1D1F] opacity-10 blur-[2px]" />
        {[...Array(3)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute inset-0 rounded-full opacity-60 mix-blend-screen"
                style={{
                    background: `conic-gradient(from ${i * 120}deg, #F5A623, transparent 60%)`,
                    filter: 'blur(3px)'
                }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 + i, ease: "easeInOut", delay: i * 0.4 }}
            />
        ))}
        <div className="absolute inset-1/4 bg-white rounded-full shadow-[0_0_12px_#F5A623]" />
    </motion.div>
);

export const LiveDiamond = ({ className = "w-[1.2em] h-[1.2em]" }) => (
    <motion.div
        className={`inline-block relative ${className} transform-gpu will-change-transform opacity`}
        animate={{ rotateZ: 360 }}
        transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
    >
        <motion.div
            className="absolute inset-0 bg-white/40 backdrop-blur-2xl border border-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
            animate={{ rotateY: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        />
        <div
            className="absolute inset-[15%] bg-blue-400/30 mix-blend-overlay blur-[1px]"
            style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
        />
    </motion.div>
);
