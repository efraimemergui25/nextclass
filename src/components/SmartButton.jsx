/**
 * SmartButton — Universal Apple-tier Tactile Button
 *
 * Variants:
 * primary — #007AFF fill
 * secondary — white/glass fill
 * ghost — text-only
 * danger — red fill
 *
 * Props forwarded: onClick, disabled, className, type, aria-label, children
 *
 * Provides:
 * - Physical depression (scale + brightness)
 * - Magnetic hover lift
 * - Spring physics
 * - Accessible focus ring
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 400, damping: 22 };

const VARIANT_CLASSES = {
 primary:
 'bg-[#007AFF] text-white shadow-[0_8px_24px_rgb(0_122_255/0.25)] hover:shadow-[0_12px_32px_rgb(0_122_255/0.35)]',
 secondary:
 'bg-white/70 backdrop-blur-xl border border-gray-200/70 text-[#1D1D1F] hover:bg-white hover:shadow-[0_8px_24px_rgb(0_0_0/0.08)]',
 ghost:
 'bg-transparent text-[#007AFF] hover:bg-[#007AFF]/6',
 danger:
 'bg-red-500 text-white shadow-[0_8px_24px_rgb(239_68_68/0.25)] hover:shadow-[0_12px_32px_rgb(239_68_68/0.35)]',
};

const SmartButton = ({
 variant = 'primary',
 children,
 className = '',
 disabled = false,
 onClick,
 type = 'button',
 ...rest
}) => {
 return (
 <motion.button
 type={type}
 onClick={onClick}
 disabled={disabled}
 /* ─── Magnetic hover — subtle lift + glow ─────────────────── */
 whileHover={disabled ? undefined : {
 y: -2,
 scale: 1.04,
 }}
 /* ─── Physical depression — hardware button feel ───────────── */
 whileTap={disabled ? undefined : {
 scale: 0.95,
 y: 0,
 filter: 'brightness(0.88)',
 }}
 transition={SPRING}
 className={[
 /* Base */
 'relative inline-flex items-center justify-center gap-2',
 'font-bold rounded-full',
 'px-7 py-3.5 text-sm',
 'min-h-[44px] min-w-[44px]',
 /* Transition — NOT transform (Framer owns that) */
 'transition-[box-shadow,background-color,color,opacity] duration-300',
 /* Focus ring */
 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/50 focus-visible:ring-offset-2',
 /* Disabled */
 disabled ? 'opacity-40 pointer-events-none select-none' : 'cursor-pointer',
 /* Variant */
 VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
 /* Caller overrides */
 className,
 ].join(' ')}
 {...rest}
 >
 {children}
 </motion.button>
 );
};

export default memo(SmartButton);
