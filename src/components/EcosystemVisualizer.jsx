import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

// ─── Hotspot data ─────────────────────────────────────────────────────────────
const HOTSPOTS = [
    {
        id: 'hs-1',
        x: 22,   // % from left
        y: 38,   // % from top
        tooltipSide: 'right',
        product: {
            id: 'display-max-86-uhd',
            title: 'מסך מגע Max 86" UHD 4K',
            price: 14500,
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400',
            category: 'מסכים אינטראקטיביים',
        },
    },
    {
        id: 'hs-2',
        x: 58,
        y: 55,
        tooltipSide: 'left',
        product: {
            id: 'teacher-laptop-pro',
            title: 'נייד מורה Core i7 14"',
            price: 4800,
            image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400',
            category: 'מחשוב',
        },
    },
    {
        id: 'hs-3',
        x: 78,
        y: 30,
        tooltipSide: 'left',
        product: {
            id: 'ptz-camera-tracking-4k',
            title: 'מצלמת PTZ עוקבת 4K',
            price: 4500,
            image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=400',
            category: 'וידאו',
        },
    },
];

const TOOLTIP_SPRING = { type: 'spring', stiffness: 380, damping: 26 };

// ─── Individual Hotspot + Tooltip ─────────────────────────────────────────────
const Hotspot = memo(({ spot }) => {
    const [open, setOpen] = useState(false);
    const { cartItems, addToCart, removeFromCart } = useCart();
    const { getSetting } = useSettings();

    const content = {
        added:    getSetting('eco_added', 'נוסף'),
        remove:   getSetting('eco_remove', 'הסר מהעגלה'),
        add:      getSetting('eco_add', 'הוסף'),
        moreInfo: getSetting('eco_more_info', 'פרטים נוספים ←'),
    };

    const toggle = useCallback(() => setOpen(v => !v), []);
    const close = useCallback(() => setOpen(false), []);

    const handleCartToggle = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const isInCart = cartItems.some(item => item.id === spot.product.id);
        if (isInCart) {
            removeFromCart(spot.product.id);
        } else {
            addToCart(spot.product);
        }
        // Keep tooltip open so they can see the change, or close it? 
        // Let's keep it open for feedback if removing, or close if adding (standard behavior)
        if (!isInCart) setOpen(false);
    }, [spot.product, addToCart, removeFromCart, cartItems]);

    // Tooltip anchor: right of dot if tooltipSide='right', else left
    const tooltipStyle = spot.tooltipSide === 'right'
        ? { left: '120%', top: '50%', transform: 'translateY(-50%)' }
        : { right: '120%', top: '50%', transform: 'translateY(-50%)' };

    return (
        <div
            className="absolute"
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, transform: 'translate(-50%, -50%)' }}
            onMouseLeave={close}
        >
            {/* Pulsating dot */}
            <motion.button
                onClick={toggle}
                onMouseEnter={() => setOpen(true)}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                whileTap={{ scale: 0.9 }}
                className="relative w-11 h-11 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]"
                aria-label={`הצג מידע על ${spot.product.title}`}
            >
                {/* Outer ring pulse */}
                <motion.span
                    animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-[#007AFF]/40"
                />
                {/* Inner dot */}
                <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] shadow-sm" />
            </motion.button>

            {/* Glass Tooltip */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 4 }}
                        transition={TOOLTIP_SPRING}
                        className="absolute z-20 w-48"
                        style={tooltipStyle}
                    >
                        <div className="bg-white/50 backdrop-blur-[48px] saturate-[1.8] border border-white/80 rounded-2xl shadow-[0_20px_60px_rgb(0,0,0/0.18)] overflow-hidden relative">
                            {/* Product thumbnail */}
                            <div className="w-full h-24 bg-gray-50 overflow-hidden">
                                <img
                                    src={spot.product.image}
                                    alt={spot.product.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>

                            {/* Info */}
                            <div className="p-3 text-right">
                                <span className="text-[10px] font-bold tracking-widest text-[#007AFF] block mb-0.5">
                                    {spot.product.category}
                                </span>
                                <p className="text-xs font-bold text-[#1D1D1F] leading-snug line-clamp-2 mb-2">
                                    {spot.product.title}
                                </p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-black text-[#1D1D1F] tracking-tighter">
                                        ₪{(spot.product.price ?? 0).toLocaleString()}
                                    </span>
                                    <motion.button
                                        onClick={handleCartToggle}
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.94, filter: 'brightness(0.88)' }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                                        className={`group relative text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                                            cartItems.some(item => item.id === spot.product.id)
                                            ? 'bg-gray-100 text-[#1D1D1F] hover:bg-red-50 hover:text-red-600'
                                            : 'bg-[#007AFF] text-white hover:bg-blue-600'
                                        }`}
                                    >
                                        {cartItems.some(item => item.id === spot.product.id) ? (
                                            <motion.div
                                                key="in-cart"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-1.5"
                                            >
                                                 <div className="flex items-center gap-1.5 group-hover:hidden">
                                                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span>{content.added}</span>
                                                </div>
                                                <div className="hidden group-hover:flex items-center gap-1.5 text-red-500">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <span>{content.remove}</span>
                                                </div>
                                            </motion.div>
                                        ) : content.add}
                                    </motion.button>
                                </div>
                                <Link
                                    to={`/catalog/${spot.product.id}`}
                                    className="block text-center text-[10px] text-[#86868B] hover:text-[#007AFF] mt-2 transition-colors"
                                    onClick={close}
                                >
                                    {content.moreInfo}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
Hotspot.displayName = 'Hotspot';

// ─── Main Component ───────────────────────────────────────────────────────────
const EcosystemVisualizer = () => {
    const { getSetting } = useSettings();
    
    const content = {
        title:    getSetting('eco_title', 'למידה שיוצאת מהמסגרת'),
        subtitle: getSetting('eco_desc', 'חקור את אקו-סיסטם הלמידה השלם שלנו. פתרונות שמשתלבים אחד בשני ליצירת חוויה פדגוגית חלקה.'),
        badge:    getSetting('eco_eyebrow', 'האקוסיסטם שלנו'),
        hint:     getSetting('eco_hint', 'לחץ על הנקודות הכחולות'),
        bgImage:  getSetting('eco_bg_image', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=85&w=1600')
    };

    return (
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                className="text-right mb-12"
            >
                <span className="text-[#007AFF] font-bold text-sm tracking-widest block mb-3">
                    {content.badge}
                </span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1D1D1F] mb-3">
                    {content.title}
                </h2>
                <p className="text-[#86868B] text-lg">
                    {content.subtitle}
                </p>
            </motion.div>

        {/* Image canvas with hotspots */}
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full aspect-video"
        >
            {/* Image layer — rounded + clipped independently so popups can overflow */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_24px_64px_rgb(0_0_0/0.10)]">
                {/* Background image — modern classroom/tech desk */}
                <img
                    src={content.bgImage}
                    alt="מרחב למידה חכם"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />
                {/* Subtle vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                {/* Legend badge */}
                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                    <span className="text-white text-xs font-bold">{content.hint}</span>
                </div>
            </div>

            {/* Hotspots — outside overflow-hidden so popups aren't clipped */}
            {HOTSPOTS.map(spot => (
                <Hotspot key={spot.id} spot={spot} />
            ))}
        </motion.div>
    </section>
    );
};

export default memo(EcosystemVisualizer);
