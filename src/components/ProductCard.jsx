import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import useCartPop from '../hooks/useCartPop';
import { Sparkles } from 'lucide-react';

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

import Magnetic from './Magnetic';

// ─── ProductCard ──────────────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
    const {
        id = 'unknown',
        category = '',
        title = 'מוצר NextClass',
        price = 0,
        salePrice = null,
        image = '',
        description = '',
        specs,
        isNew = false,
        _isBestSeller = false,
    } = product ?? {};

    const [imgError, setImgError] = useState(false);

    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const { cartItems, addToCart, removeFromCart } = useCart();
    const { toggle: toggleWishlist, isWishlisted } = useWishlist();
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
    const springX = useSpring(mouseX, { stiffness: 200, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 200, damping: 20 });

    // Map normalised [-0.5, 0.5] → rotation degrees
    const rotateX = useTransform(springY, [-0.5, 0.5], ['7deg', '-7deg']);
    const rotateY = useTransform(springX, [-0.5, 0.5], ['-7deg', '7deg']);

    // Map normalised position → gradient position (0–100%)
    const glowX = useSpring(lightX, { stiffness: 200, damping: 20 });
    const glowY = useSpring(lightY, { stiffness: 200, damping: 20 });

    const glowBackground = useTransform(
        [glowX, glowY],
        ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`
    );

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
    const effectivePrice = salePrice ? Number(salePrice) : (price ?? 0);
    const formattedPrice = useMemo(() => `₪${effectivePrice.toLocaleString()}`, [effectivePrice]);
    const selected = useMemo(() => isSelected(id), [isSelected, id]);
    const isInCart = useMemo(() => (cartItems ?? []).some(item => item?.id === id), [cartItems, id]);
    const [siteSettings, setSiteSettings] = useState(() => {
        try {
            const s = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
            return {
                showPrices: s.show_prices !== false,
                allowOrders: s.allow_orders !== false
            };
        } catch { return { showPrices: true, allowOrders: true }; }
    });

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'nextclass_content') {
                try {
                    const s = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
                    setSiteSettings({
                        showPrices: s.show_prices !== false,
                        allowOrders: s.allow_orders !== false
                    });
                } catch {}
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const { showPrices, allowOrders } = siteSettings;

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

    const handleWishlistToggle = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(id);
    }, [id, toggleWishlist]);

    const wishlisted = useMemo(() => isWishlisted(id), [isWishlisted, id]);

    return (
        /* ── Perspective wrapper ──────────────────────────────────────────── */
        <div
            ref={cardRef}
            style={{ perspective: 1000 }}
            className="h-full touch-manipulation group"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{ rotateX, rotateY }}
                className="flex flex-col h-full glass-apple rounded-[3rem] relative transform-gpu will-change-transform shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-white/40 overflow-hidden"
            >
                <Link
                    to={`/catalog/${id}`}
                    className="flex flex-col flex-1 outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                >
                    {/* ── Image Container ─────────────────────────────────── */}
                    <div className="w-full relative aspect-[1] overflow-hidden bg-white/40">
                        {imgError || !image ? (
                            <ImageFallback />
                        ) : (
                            <motion.img
                                src={image}
                                alt={title}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                                onError={handleImgError}
                                loading="lazy"
                            />
                        )}

                        {/* Glossy Overlay Sweep */}
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"
                            style={{ skewX: -20 }}
                        />

                        {/* Category Floating Badge */}
                        {category && (
                            <div className="absolute top-6 right-6 z-10">
                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest shadow-sm">
                                    {category}
                                </div>
                            </div>
                        )}

                        {/* Wishlist Button */}
                        <motion.button
                            onClick={handleWishlistToggle}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.88 }}
                            className={`absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${wishlisted
                                ? 'bg-[#FF2D55] text-white shadow-lg shadow-[#FF2D55]/30'
                                : 'bg-white/80 backdrop-blur-md text-gray-500 hover:text-[#FF2D55] border border-white/50'
                                }`}
                        >
                            <svg className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </motion.button>
                        
                        {/* Product badges — data-driven */}
                        {(_isBestSeller || isNew) && (
                            <div className={`absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                                _isBestSeller
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}>
                                <Sparkles size={11} className="text-white" />
                                <span className="text-[10px] font-black text-white tracking-wide">
                                    {_isBestSeller ? 'נמכר ביותר 🔥' : 'חדש ✨'}
                                </span>
                            </div>
                        )}
                        
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
                    </div>

                    {/* ── Text Content ─────────────────────────────────────── */}
                    <div className="flex-1 flex flex-col text-right px-8 pt-8 pb-0">
                        <h3 className="text-xl md:text-2xl font-black text-[#1D1D1F] leading-[1.2] tracking-tight line-clamp-2 mb-3 group-hover:text-[#007AFF] transition-colors duration-300">{title}</h3>
                        {description && (
                            <p className="text-sm text-[#86868B] leading-relaxed line-clamp-3 mt-1 font-medium opacity-80">{description}</p>
                        )}

                        {/* ── Footer ───────────────────────────────────────── */}
                        <div className="mt-auto pt-6 pb-8 flex items-center justify-between gap-4">
                            <div className="shrink-0">
                                {showPrices && (salePrice ? (
                                    <div className="flex flex-col items-start gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black tracking-tighter text-[#FF3B30]">{formattedPrice}</span>
                                        </div>
                                        <span className="text-sm text-[#86868B] line-through decoration-[#FF3B30]/30 font-bold">₪{Number(price).toLocaleString()}</span>
                                    </div>
                                ) : (
                                    <span className="text-3xl font-black tracking-tighter text-[#1D1D1F]">{formattedPrice}</span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Compare */}
                                <Magnetic strength={0.15}>
                                    <motion.button
                                        onClick={handleCompareClick}
                                        whileTap={{ scale: 0.92 }}
                                        className={`p-2 min-w-[44px] min-h-[44px] rounded-full border transition-all duration-300 flex items-center justify-center ${selected
                                            ? 'bg-[#007AFF]/10 border-[#007AFF] text-[#007AFF]'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-[#007AFF]/20 hover:text-[#007AFF] hover:shadow-lg'
                                            }`}
                                        aria-label={selected ? 'נבחר להשוואה' : 'השווה'}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                        </svg>
                                    </motion.button>
                                </Magnetic>

                                {/* Cart button / Contact button */}
                                <Magnetic strength={0.1}>
                                    {allowOrders ? (
                                        isInCart ? (
                                            <motion.button
                                                onClick={handleCartToggle}
                                                whileTap={{ scale: 0.94 }}
                                                className="group/cart h-[44px] min-w-[90px] sm:min-w-[120px] px-3 sm:px-4 rounded-full font-bold text-[11px] tracking-wide bg-[#F5F5F7] text-[#1D1D1F] border border-gray-100 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <div className="flex items-center gap-1.5 group-hover/cart:hidden">
                                                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    נוסף לעגלה
                                                </div>
                                                <div className="hidden group-hover/cart:flex items-center gap-1.5 text-red-500">
                                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    הסר
                                                </div>
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={handleCartToggle}
                                                animate={popState === 'idle' ? undefined : cartBtnVariants[popState]}
                                                whileTap={popState === 'idle' ? { scale: 0.93 } : undefined}
                                                className="h-[44px] min-w-[90px] sm:min-w-[120px] px-3 sm:px-4 rounded-full font-bold text-[11px] tracking-wide text-white flex items-center justify-center gap-1.5 focus:outline-none shadow-md hover:shadow-xl transition-shadow"
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
                                        )
                                    ) : (
                                        <Link to="/contact" className="h-[44px] px-5 rounded-full bg-[#007AFF] text-white font-bold text-[11px] flex items-center gap-2 hover:bg-blue-600 transition-all shadow-md">
                                            <span>פרטים והצעה</span>
                                        </Link>
                                    )}
                                </Magnetic>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* ── Specular light reflection — follows mouse ────────── */}
                <motion.div
                    className="absolute inset-0 pointer-events-none rounded-[2.5rem]"
                    style={{ background: glowBackground }}
                />
            </motion.div>
        </div>
    );
};

export default memo(ProductCard);
