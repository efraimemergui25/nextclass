import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import useCartPop from '../hooks/useCartPop';

// ─── Cart pop animation variants ─────────────────────────────────────────────
const cartBtnVariants = {
    idle: { scale: 1, backgroundColor: '#007AFF' },
    loading: { scale: 0.92, backgroundColor: '#007AFF' },
    success: { scale: 1.06, backgroundColor: '#34C759' },
};

const SPRING_TILT = { stiffness: 300, damping: 28 };
const SPRING_ACTION = { type: 'spring', stiffness: 420, damping: 22 };

// ─── Premium image fallback ───────────────────────────────────────────────────
const ImageFallback = memo(() => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-xs font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
    </div>
));
ImageFallback.displayName = 'ImageFallback';

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
    const {
        id = 'unknown',
        category = '',
        title = 'מוצר NextClass',
        price = 0,
        image = '',
        description = '',
        specs,
    } = product ?? {};

    const [imgError, setImgError] = useState(false);

    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const { cartItems, addToCart, removeFromCart } = useCart();
    const { state: popState, trigger } = useCartPop();

    // ─── Spatial tilt motion values ───────────────────────────────────────────
    const cardRef = useRef(null);
    const isTouchDevice = useRef(false);

    // Detect touch on first interaction — disables tilt on mobile
    useEffect(() => {
        const handler = () => { isTouchDevice.current = true; };
        window.addEventListener('touchstart', handler, { once: true, passive: true });
        return () => window.removeEventListener('touchstart', handler);
    }, []);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const lightX = useMotionValue(50); // percentage for the light gradient
    const lightY = useMotionValue(50);

    // Smooth springs for the rotation — prevents jitter
    const springX = useSpring(mouseX, SPRING_TILT);
    const springY = useSpring(mouseY, SPRING_TILT);

    // Map normalised [-0.5, 0.5] → rotation degrees
    const rotateX = useTransform(springY, [-0.5, 0.5], ['7deg', '-7deg']);
    const rotateY = useTransform(springX, [-0.5, 0.5], ['-7deg', '7deg']);

    // Map normalised position → gradient position (0–100%)
    const glowX = useSpring(lightX, SPRING_TILT);
    const glowY = useSpring(lightY, SPRING_TILT);

    const handleMouseMove = useCallback((e) => {
        if (isTouchDevice.current) return; // no tilt on touch screens
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
        lightX.set(((x + 0.5) * 100));
        lightY.set(((y + 0.5) * 100));
    }, [mouseX, mouseY, lightX, lightY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0);
        mouseY.set(0);
        lightX.set(50);
        lightY.set(50);
    }, [mouseX, mouseY, lightX, lightY]);

    // ─── Derived values ───────────────────────────────────────────────────────
    const formattedPrice = useMemo(() => `₪${(price ?? 0).toLocaleString()}`, [price]);
    const selected = useMemo(() => isSelected(id), [isSelected, id]);
    const isInCart = useMemo(() => (cartItems ?? []).some(item => item?.id === id), [cartItems, id]);

    // ─── Stable handlers ──────────────────────────────────────────────────────
    const handleImgError = useCallback((e) => {
        if (!e.target.dataset.triedFallback) {
            e.target.dataset.triedFallback = 'true';
            e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
        } else {
            setImgError(true);
        }
    }, []);

    const handleCompareClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selected) removeFromCompare(id);
        else addToCompare({ id, title, price: formattedPrice, imageUrl: image, category, specs });
    }, [selected, id, title, formattedPrice, image, category, specs, addToCompare, removeFromCompare]);

    const handleCartToggle = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInCart) removeFromCart(id);
        else trigger(() => addToCart(product))();
    }, [isInCart, id, product, addToCart, removeFromCart, trigger]);

    return (
        /* ── Perspective wrapper ──────────────────────────────────────────── */
        <div
            ref={cardRef}
            style={{ perspective: 1000 }}
            className="h-full touch-manipulation"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ── 3D tiltable card ────────────────────────────────────────── */}
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                className="flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-[0_20px_40px_rgb(0_0_0/0.10)] transition-shadow duration-500 relative transform-gpu will-change-transform"
            >
                <Link
                    to={`/catalog/${id}`}
                    className="flex flex-col flex-1 outline-none focus:ring-2 focus:ring-[#007AFF]/30 rounded-3xl"
                >
                    {/* ── Image Container ─────────────────────────────────── */}
                    <div className="w-full relative aspect-[16/9] md:aspect-[4/3] overflow-hidden bg-gray-50">
                        {imgError || !image ? (
                            <ImageFallback />
                        ) : (
                            <img
                                src={image}
                                alt={title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={handleImgError}
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
                    </div>

                    {/* ── Text Content ─────────────────────────────────────── */}
                    <div className="flex-1 flex flex-col text-right px-5 pt-5 pb-0">
                        {category && (
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#007AFF] mb-2">{category}</span>
                        )}
                        <h3 className="text-base md:text-lg font-bold text-[#1D1D1F] leading-snug line-clamp-2">{title}</h3>
                        {description && (
                            <p className="text-sm text-[#86868B] leading-relaxed line-clamp-2 mt-1.5">{description}</p>
                        )}

                        {/* ── Footer ───────────────────────────────────────── */}
                        <div className="mt-4 pt-4 pb-5 border-t border-gray-100 flex items-center justify-between gap-3">
                            <span className="text-xl font-black tracking-tighter text-[#1D1D1F] shrink-0">{formattedPrice}</span>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Compare */}
                                <motion.button
                                    onClick={handleCompareClick}
                                    whileHover={{ y: -2, scale: 1.08 }}
                                    whileTap={{ scale: 0.92, filter: 'brightness(0.88)' }}
                                    transition={SPRING_ACTION}
                                    className={`p-2 min-w-[44px] min-h-[44px] rounded-full border transition-colors duration-300 flex items-center justify-center ${selected
                                        ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]'
                                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-[#1D1D1F]'
                                        }`}
                                    aria-label={selected ? 'נבחר להשוואה' : 'השווה'}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                </motion.button>

                                {/* Cart button */}
                                {isInCart ? (
                                    <motion.button
                                        onClick={handleCartToggle}
                                        whileHover={{ y: -2, scale: 1.03 }}
                                        whileTap={{ scale: 0.94, filter: 'brightness(0.88)' }}
                                        transition={SPRING_ACTION}
                                        className="h-[38px] min-w-[110px] px-4 rounded-full font-bold text-xs tracking-wide bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        נוסף לעגלה
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        onClick={handleCartToggle}
                                        animate={popState === 'idle' ? undefined : cartBtnVariants[popState]}
                                        whileHover={popState === 'idle' ? { y: -2, scale: 1.05 } : undefined}
                                        whileTap={popState === 'idle' ? { scale: 0.93, filter: 'brightness(0.88)' } : undefined}
                                        transition={SPRING_ACTION}
                                        className="h-[38px] min-w-[110px] px-4 rounded-full font-bold text-xs tracking-wide text-white overflow-hidden flex items-center justify-center gap-1.5 focus:outline-none"
                                        style={{ backgroundColor: '#007AFF' }}
                                        disabled={popState !== 'idle'}
                                    >
                                        <AnimatePresence mode="wait">
                                            {popState === 'success' ? (
                                                <motion.span
                                                    key="check"
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    נוסף!
                                                </motion.span>
                                            ) : (
                                                <motion.span
                                                    key="add"
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    {popState === 'loading' ? '...' : 'הוסף לעגלה'}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>

                {/* ── Specular light reflection — follows mouse ────────── */}
                <motion.div
                    className="absolute inset-0 pointer-events-none rounded-3xl"
                    style={{
                        background: useTransform(
                            [glowX, glowY],
                            ([x, y]) =>
                                `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.18) 0%, transparent 65%)`
                        ),
                    }}
                />
            </motion.div>
        </div>
    );
};

export default memo(ProductCard);
