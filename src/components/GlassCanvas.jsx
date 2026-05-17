import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * GlassCanvas — Living Aurora atmosphere layer.
 *
 * ARCHITECTURE NOTE:
 * The mouse-reactive glow is intentionally implemented via direct DOM style
 * manipulation (NOT Framer Motion useTransform/useSpring) to avoid triggering
 * layout recalculation on every mousemove event, which caused full-page reflow/shake.
 * We use CSS custom properties + requestAnimationFrame for butter-smooth, 
 * zero-jank tracking.
 */
export default function GlassCanvas({ mood }) {
 const glowRef = useRef(null);
 const spotRef = useRef(null);
 const rafRef = useRef(null);
 const targetRef = useRef({ x: 50, y: 50 });
 const currentRef = useRef({ x: 50, y: 50 });
 const spotRef2 = useRef({ x: 50, y: 50 });

 useEffect(() => {
 const handleMove = (e) => {
 targetRef.current = {
 x: (e.clientX / window.innerWidth) * 100,
 y: (e.clientY / window.innerHeight) * 100,
 };
 };

 const lerp = (a, b, t) => a + (b - a) * t;
 const tick = () => {
 const cur = currentRef.current;
 const tgt = targetRef.current;
 cur.x = lerp(cur.x, tgt.x, 0.055);
 cur.y = lerp(cur.y, tgt.y, 0.055);

 // Spotlight tracks faster for a tighter feel
 const sp = spotRef2.current;
 sp.x = lerp(sp.x, tgt.x, 0.18);
 sp.y = lerp(sp.y, tgt.y, 0.18);

 if (glowRef.current) {
 glowRef.current.style.transform = `translate(calc(${cur.x}vw - 50%), calc(${cur.y}vh - 50%))`;
 }
 if (spotRef.current) {
 spotRef.current.style.transform = `translate(calc(${sp.x}vw - 50%), calc(${sp.y}vh - 50%))`;
 }
 rafRef.current = requestAnimationFrame(tick);
 };

 window.addEventListener('mousemove', handleMove, { passive: true });
 rafRef.current = requestAnimationFrame(tick);

 return () => {
 window.removeEventListener('mousemove', handleMove);
 if (rafRef.current) cancelAnimationFrame(rafRef.current);
 };
 }, []);

 const primaryColor = mood?.primary ?? '#007AFF';
 const secondaryColor = mood?.secondary ?? '#5856D6';

 return (
 <div
 className="fixed inset-0 overflow-hidden pointer-events-none"
 style={{ zIndex: -10 }}
 aria-hidden="true"
 >
 {/* Base */}
 <div className="absolute inset-0 bg-[#F2F2F5]" />

 {/* Aurora Orb 1 — Primary, top-right */}
 <motion.div
 animate={{
 backgroundColor: primaryColor,
 x: [0, 55, -15, 0],
 y: [0, -35, 18, 0],
 scale: [1, 1.1, 0.95, 1],
 }}
 transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
 style={{ willChange: 'transform', filter: 'blur(110px)' }}
 className="absolute top-[-8%] right-[-4%] w-[850px] h-[850px] rounded-full opacity-[0.065]"
 />

 {/* Aurora Orb 2 — Secondary, bottom-left */}
 <motion.div
 animate={{
 backgroundColor: secondaryColor,
 x: [0, -45, 25, 0],
 y: [0, 45, -18, 0],
 scale: [1, 0.92, 1.06, 1],
 }}
 transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
 style={{ willChange: 'transform', filter: 'blur(130px)' }}
 className="absolute bottom-[-10%] left-[-5%] w-[750px] h-[750px] rounded-full opacity-[0.05]"
 />

 {/* Aurora Orb 3 — Accent, mid */}
 <motion.div
 animate={{
 x: [0, 28, -28, 0],
 y: [0, -18, 36, 0],
 scale: [1, 1.04, 0.97, 1],
 }}
 transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
 style={{ willChange: 'transform', filter: 'blur(150px)', backgroundColor: '#30D158' }}
 className="absolute top-[45%] left-[30%] w-[600px] h-[600px] rounded-full opacity-[0.03]"
 />

 {/* Aurora Orb 4 — Warm accent, lower-right */}
 <motion.div
 animate={{
 x: [0, -35, 20, 0],
 y: [0, 30, -20, 0],
 scale: [1, 1.06, 0.94, 1],
 }}
 transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 12 }}
 style={{ willChange: 'transform', filter: 'blur(120px)', backgroundColor: '#FF9500' }}
 className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full opacity-[0.028]"
 />

 <div
 ref={glowRef}
 style={{
 position: 'fixed',
 width: '700px',
 height: '700px',
 borderRadius: '50%',
 background: `radial-gradient(circle, ${primaryColor}16 0%, ${primaryColor}06 40%, transparent 65%)`,
 filter: 'blur(45px)',
 top: 0,
 left: 0,
 willChange: 'transform',
 pointerEvents: 'none',
 zIndex: -5,
 }}
 />
 {/* Tight spotlight — follows cursor precisely */}
 <div
 ref={spotRef}
 style={{
 position: 'fixed',
 width: '280px',
 height: '280px',
 borderRadius: '50%',
 background: `radial-gradient(circle, ${primaryColor}0E 0%, ${primaryColor}05 50%, transparent 70%)`,
 filter: 'blur(12px)',
 top: 0,
 left: 0,
 willChange: 'transform',
 pointerEvents: 'none',
 zIndex: -4,
 }}
 />

 {/* Dot grid */}
 <div className="absolute inset-0 opacity-20"
 style={{
 backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
 backgroundSize: '28px 28px',
 }}
 />

 {/* Subtle vignette */}
 <div
 className="absolute inset-0 pointer-events-none"
 style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(255,255,255,0.08) 100%)' }}
 />

 {/* SVG Noise grain */}
 <svg
 className="absolute inset-0 w-full h-full pointer-events-none"
 style={{ opacity: 0.03, mixBlendMode: 'overlay' }}
 >
 <filter id="nc-noise">
 <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
 </filter>
 <rect width="100%" height="100%" filter="url(#nc-noise)" />
 </svg>
 </div>
 );
}
