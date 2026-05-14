/**
 * DynamicIsland.jsx — Commerce Dynamic Island
 *
 * Subscribes to CartContext.islandProduct.
 * Idle: invisible pill at top-center.
 * Active: expands to 320×64px glass pill showing thumbnail + "נוסף לעגלה" + ✓
 * Auto-dismisses after 3 seconds.
 */
import React, { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';

const SPRING = { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 };

const DynamicIsland = () => {
 const { islandProduct, clearIsland } = useCart();
 const timerRef = useRef(null);

 // Auto-dismiss after 3 s whenever a product appears
 useEffect(() => {
 if (!islandProduct) return;
 clearTimeout(timerRef.current);
 timerRef.current = setTimeout(() => clearIsland(), 3000);
 return () => clearTimeout(timerRef.current);
 }, [islandProduct, clearIsland]);

 return (
 <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] pointer-events-none flex justify-center">
 <AnimatePresence>
 {islandProduct ? (
 /* ── Expanded active state ─────────────────────────── */
 <motion.div
 key="active"
 layout
 initial={{ width: 128, height: 32, borderRadius: 999, opacity: 0, y: -12 }}
 animate={{ width: 320, height: 64, borderRadius: 32, opacity: 1, y: 0 }}
 exit={{ width: 128, height: 32, borderRadius: 999, opacity: 0, y: -8 }}
 transition={SPRING}
 className="bg-[#1D1D1F] shadow-[0_8px_32px_rgb(0_0_0/0.35)] overflow-hidden flex items-center gap-3 px-4 pointer-events-auto transform-gpu will-change-transform"
 style={{ minWidth: 128 }}
 >
 {/* Thumbnail */}
 <motion.div
 initial={{ scale: 0.6, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.12, ...SPRING }}
 className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 shrink-0"
 >
 {islandProduct.image ? (
 <img
 src={islandProduct.image}
 alt={islandProduct.title}
 className="w-full h-full object-cover"
 onError={(e) => { e.target.style.display = 'none'; }}
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18" />
 </svg>
 </div>
 )}
 </motion.div>

 {/* Text */}
 <motion.div
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.15, type: 'spring', stiffness: 380, damping: 26 }}
 className="flex-1 min-w-0 text-right"
 >
 <p className="text-white font-bold text-sm leading-tight line-clamp-1">
 {islandProduct.title}
 </p>
 <p className="text-[#86868B] text-xs mt-0.5">נוסף לעגלה</p>
 </motion.div>

 {/* Checkmark */}
 <motion.div
 initial={{ scale: 0, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 16 }}
 className="w-8 h-8 rounded-full bg-[#34C759] flex items-center justify-center shrink-0"
 >
 <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </motion.div>
 </motion.div>
 ) : (
 /* ── Idle state — invisible pill ───────────────────── */
 <motion.div
 key="idle"
 initial={{ opacity: 0 }}
 animate={{ opacity: 0 }}
 className="w-32 h-8 bg-black rounded-full pointer-events-none"
 />
 )}
 </AnimatePresence>
 </div>
 );
};

export default memo(DynamicIsland);
