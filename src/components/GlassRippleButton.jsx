import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * GlassRippleButton — World-class CTA button with:
 * • Ripple on click (water-surface physics)
 * • Magnetic tilt on hover (visionOS spatial depth)
 * • Specular shine that follows cursor
 * • Spring-physics press response
 */
const GlassRippleButton = ({ children, onClick, className = '', ...props }) => {
 const [ripples, setRipples] = useState([]);
 const buttonRef = useRef(null);

 // Magnetic tilt (spring-damped)
 const mouseX = useMotionValue(0);
 const mouseY = useMotionValue(0);
 const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 400, damping: 30 });
 const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 400, damping: 30 });

 // Specular highlight that follows cursor
 const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, 80]), { stiffness: 300, damping: 36 });
 const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, 80]), { stiffness: 300, damping: 36 });

 // Cleanup ripples
 useEffect(() => {
 if (ripples.length === 0) return;
 const t = setTimeout(() => setRipples([]), 620);
 return () => clearTimeout(t);
 }, [ripples]);

 const handleMouseMove = useCallback((e) => {
 const el = buttonRef.current;
 if (!el) return;
 const rect = el.getBoundingClientRect();
 const x = (e.clientX - rect.left) / rect.width - 0.5;
 const y = (e.clientY - rect.top) / rect.height - 0.5;
 mouseX.set(x);
 mouseY.set(y);
 }, [mouseX, mouseY]);

 const handleMouseLeave = useCallback(() => {
 mouseX.set(0);
 mouseY.set(0);
 }, [mouseX, mouseY]);

 const handleMouseDown = useCallback((e) => {
 const button = e.currentTarget;
 const rect = button.getBoundingClientRect();
 const x = e.clientX - rect.left;
 const y = e.clientY - rect.top;
 setRipples(prev => [...prev, { id: Date.now(), x, y }]);
 }, []);

 return (
 <motion.button
 ref={buttonRef}
 style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 800 }}
 whileTap={{ scale: 0.96 }}
 onMouseMove={handleMouseMove}
 onMouseLeave={handleMouseLeave}
 onMouseDown={handleMouseDown}
 onClick={onClick}
 className={`relative overflow-hidden z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-sm transition-colors ${className}`}
 {...props}
 >
 {/* Specular shine — follows cursor for 3D glass feel */}
 <motion.div
 className="absolute inset-0 pointer-events-none rounded-full opacity-0 group-hover:opacity-100"
 style={{
 background: `radial-gradient(circle at ${shineX.get()}% ${shineY.get()}%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
 opacity: 0.6,
 }}
 />

 {/* Top inset shine bar */}
 <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

 {/* Ripple layers */}
 <AnimatePresence>
 {ripples.map((ripple) => (
 <motion.span
 key={ripple.id}
 initial={{ width: 0, height: 0, opacity: 0.5, top: ripple.y, left: ripple.x, x: '-50%', y: '-50%' }}
 animate={{ width: '340%', paddingBottom: '340%', opacity: 0, top: ripple.y, left: ripple.x, x: '-50%', y: '-50%' }}
 transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
 className="absolute bg-white/35 rounded-full pointer-events-none"
 />
 ))}
 </AnimatePresence>

 <span className="relative z-10 pointer-events-none block w-full h-full">{children}</span>
 </motion.button>
 );
};

export default GlassRippleButton;
