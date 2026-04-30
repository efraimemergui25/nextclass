import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * GlassCanvas — An Aurora atmosphere layer that renders:
 *  1. A living, organic noise field (WebGL-style via Canvas2D)
 *  2. 3 large soft aurora orbs that drift and breathe
 *  3. Mouse-reactive subtle glow that follows cursor
 *
 * This creates the "alive" sensation of Apple visionOS spatial interfaces.
 */
export default function GlassCanvas({ mood }) {
    const canvasRef = useRef(null);
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);

    const springX = useSpring(mouseX, { stiffness: 30, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 30, damping: 20 });

    // Track mouse for reactive glow
    useEffect(() => {
        const handleMove = (e) => {
            mouseX.set(e.clientX / window.innerWidth);
            mouseY.set(e.clientY / window.innerHeight);
        };
        window.addEventListener('mousemove', handleMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Base atmosphere */}
            <div className="absolute inset-0 bg-[#F2F2F5]" />

            {/* Aurora Orb 1 — Primary brand color, top-right */}
            <motion.div
                animate={{
                    backgroundColor: mood?.primary ?? '#007AFF',
                    x: [0, 60, -20, 0],
                    y: [0, -40, 20, 0],
                    scale: [1, 1.12, 0.94, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="aurora-orb absolute top-[-8%] right-[-4%] w-[900px] h-[900px] opacity-[0.07]"
            />

            {/* Aurora Orb 2 — Secondary color, bottom-left */}
            <motion.div
                animate={{
                    backgroundColor: mood?.secondary ?? '#5856D6',
                    x: [0, -50, 30, 0],
                    y: [0, 50, -20, 0],
                    scale: [1, 0.90, 1.08, 1],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
                className="aurora-orb-alt absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] opacity-[0.055]"
            />

            {/* Aurora Orb 3 — Accent, center */}
            <motion.div
                animate={{
                    x: [0, 30, -30, 0],
                    y: [0, -20, 40, 0],
                    scale: [1, 1.05, 0.97, 1],
                }}
                transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
                className="aurora-orb absolute top-[40%] left-[35%] w-[600px] h-[600px] opacity-[0.04]"
                style={{ backgroundColor: '#34C759' }}
            />

            {/* Mouse-reactive soft glow */}
            <motion.div
                className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{
                    x: useTransform(springX, [0, 1], ['-20%', '90%']),
                    y: useTransform(springY, [0, 1], ['-20%', '90%']),
                    background: `radial-gradient(circle, ${mood?.primary ?? '#007AFF'}18 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Ambient dot grid */}
            <div className="absolute inset-0 ambient-grid opacity-25" />

            {/* Top-to-bottom subtle vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.12] pointer-events-none" />

            {/* SVG Noise grain for tactile material feel */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay pointer-events-none">
                <filter id="noise-filter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.65"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noise-filter)" />
            </svg>
        </div>
    );
}
