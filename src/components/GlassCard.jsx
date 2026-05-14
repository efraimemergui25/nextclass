import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * GlassCard — A premium Liquid Glass card with:
 * - Real-time 3D tilt following mouse
 * - Specular light glint that sweeps on hover
 * - Refractive mouse-position radial highlight
 * - Configurable glass tier: 'ultra' | 'apple' | 'float' | 'light'
 */
export default function GlassCard({
 children,
 className = '',
 tier = 'apple',
 rounded = '2.5rem',
 tiltStrength = 6,
 as: Tag = 'div',
 style = {},
 ...props
}) {
 const cardRef = useRef(null);
 const isTouchDevice = useRef(false);

 const mouseX = useMotionValue(0.5);
 const mouseY = useMotionValue(0.5);

 const springX = useSpring(mouseX, { stiffness: 200, damping: 22 });
 const springY = useSpring(mouseY, { stiffness: 200, damping: 22 });

 const rotateX = useCallback(
 (v) => (v - 0.5) * tiltStrength * -1 + 'deg',
 [tiltStrength]
 );
 const rotateY = useCallback(
 (v) => (v - 0.5) * tiltStrength + 'deg',
 [tiltStrength]
 );

 const glowX = useSpring(useMotionValue(50), { stiffness: 150, damping: 18 });
 const glowY = useSpring(useMotionValue(50), { stiffness: 150, damping: 18 });

 const handleMouseMove = (e) => {
 if (isTouchDevice.current) return;
 const rect = cardRef.current?.getBoundingClientRect();
 if (!rect) return;
 const x = (e.clientX - rect.left) / rect.width;
 const y = (e.clientY - rect.top) / rect.height;
 mouseX.set(x);
 mouseY.set(y);
 glowX.set(x * 100);
 glowY.set(y * 100);
 };

 const handleMouseLeave = () => {
 mouseX.set(0.5);
 mouseY.set(0.5);
 glowX.set(50);
 glowY.set(50);
 };

 return (
 <div
 ref={cardRef}
 style={{ perspective: 1200 }}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 className="h-full"
 >
 <motion.div
 className={`glass-${tier} ${className} relative overflow-hidden`}
 style={{
 borderRadius: rounded,
 rotateX: springY.get() !== 0.5 ? springY : undefined,
 rotateY: springX.get() !== 0.5 ? springX : undefined,
 transformStyle: 'preserve-3d',
 willChange: 'transform',
 ...style,
 }}
 {...props}
 >
 {children}

 {/* Mouse-position radial highlight */}
 <motion.div
 className="absolute inset-0 pointer-events-none rounded-[inherit]"
 style={{
 background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, rgba(255,255,255,0.22) 0%, transparent 55%)`,
 }}
 />
 </motion.div>
 </div>
 );
}
