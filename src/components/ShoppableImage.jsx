import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import useCartPop from '../hooks/useCartPop';
import { ShoppingCart, ArrowLeft, Check } from 'lucide-react';

// Maps hotspot IDs to real product IDs from the catalog
const HOTSPOT_PRODUCT_MAP = {
    "touch-pro-75":   "display-pro-75-uhd",
    "pc-staff-setup": "laptop-teacher-i7",
    "edu-edit-basic": "stem-kit-basic",
};

const RAW_HOTSPOTS = [
    { id: "touch-pro-75",   x: "48%", y: "35%", direction: "top" },
    { id: "pc-staff-setup", x: "72%", y: "65%", direction: "top" },
    { id: "edu-edit-basic", x: "25%", y: "75%", direction: "top" },
];

// Animated add-to-cart button inside the popup
function PopupCartBtn({ product }) {
    const { addToCart, cartItems } = useCart();
    const { state, trigger } = useCartPop();
    const isInCart = (cartItems ?? []).some(i => i.id === product?.id);

    if (!product) return null;

    const handleAdd = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isInCart) trigger(() => addToCart(product))();
    }, [isInCart, product, addToCart, trigger]);

    return (
        <motion.button
            onClick={handleAdd}
            animate={isInCart ? { backgroundColor: '#34C759' } : state !== 'idle' ? { scale: state === 'loading' ? 0.92 : 1.04 } : undefined}
            whileTap={!isInCart && state === 'idle' ? { scale: 0.93 } : undefined}
            disabled={state !== 'idle' && !isInCart}
            className="h-10 px-5 rounded-full font-bold text-[12px] tracking-wide text-white flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            style={{ backgroundColor: isInCart ? '#34C759' : '#007AFF' }}
        >
            {isInCart ? (
                <><Check size={14} strokeWidth={3} /> נוסף</>
            ) : state === 'success' ? (
                <><Check size={14} strokeWidth={3} /> נוסף!</>
            ) : (
                <><ShoppingCart size={13} strokeWidth={2.5} /> הוסף</>
            )}
        </motion.button>
    );
}

const ShoppableImage = () => {
    const { getSetting } = useSettings();
    const { activeProducts } = useProducts();
    const [activeHotspot, setActiveHotspot] = useState(null);

    const content = {
        title:    getSetting('shop_title', 'לחץ על נקודה לגלות מוצר'),
        subtitle: getSetting('shop_desc', 'כל פתרון במרחב הלמידה שלך — ניתן לרכישה מיידית.'),
        eyebrow:  getSetting('shop_eyebrow', 'האקוסיסטם שלנו'),
        bgImage:  getSetting('shop_bg_image', 'https://images.unsplash.com/photo-1588702545911-5f940bb36109?q=80&w=2000&auto=format&fit=crop'),
    };

    // Enrich hotspots with product data
    const hotspots = RAW_HOTSPOTS.map(spot => {
        const productId = HOTSPOT_PRODUCT_MAP[spot.id];
        const product = activeProducts.find(p => p.id === productId) || activeProducts[0];
        return { ...spot, product };
    });

    return (
        <section className="w-full bg-[#F5F5F7] py-10 sm:py-14 px-6 md:px-12">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                {/* Section Header */}
                <div className="text-right mb-8 max-w-3xl w-full" dir="rtl">
                    <span className="text-[#007AFF] font-bold text-sm tracking-widest block mb-3">
                        {content.eyebrow}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter mb-3 leading-[1.1]">
                        {content.title}
                    </h2>
                    <p className="text-[15px] text-[#86868B] font-medium leading-relaxed">
                        {content.subtitle}
                    </p>
                </div>

                {/* Interactive Canvas */}
                <div className="relative w-full aspect-video">
                    {/* Image layer — rounded + clipped independently so popups can overflow */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_24px_64px_rgb(0_0_0/0.10)] bg-gray-900">
                        <img
                            src={content.bgImage}
                            alt="Smart Classroom Environment"
                            className="w-full h-full object-cover opacity-80"
                            onError={(e) => {
                                if (!e.target.dataset.triedFallback) {
                                    e.target.dataset.triedFallback = 'true';
                                    e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                                }
                            }}
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Hotspots — outside overflow-hidden so popups aren't clipped */}
                    {hotspots.map((spot) => (
                        <div
                            key={spot.id}
                            className="absolute z-10"
                            style={{ left: spot.x, top: spot.y, transform: 'translate(-50%, -50%)' }}
                            onMouseEnter={() => setActiveHotspot(spot.id)}
                            onMouseLeave={() => setActiveHotspot(null)}
                        >
                            {/* Pulsing Dot */}
                            <div className="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-[#007AFF] rounded-full"
                                />
                                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_0_8px_rgb(0_122_255/0.4)] group-hover:scale-125 transition-transform duration-300 z-10" />
                            </div>

                            {/* Dark glass popup card */}
                            <AnimatePresence>
                                {activeHotspot === spot.id && spot.product && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92, y: spot.direction === 'top' ? 12 : -12 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: spot.direction === 'top' ? 12 : -12 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.7 }}
                                        className={`absolute left-1/2 -translate-x-1/2 ${spot.direction === 'top' ? 'bottom-full mb-5' : 'top-full mt-5'} w-[240px] z-50 overflow-hidden`}
                                        style={{
                                            borderRadius: 20,
                                            background: 'rgba(28, 28, 30, 0.92)',
                                            backdropFilter: 'blur(28px) saturate(1.8)',
                                            WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            boxShadow: '0 24px 60px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.06) inset',
                                        }}
                                    >
                                        {/* CSS Triangle pointer */}
                                        <div
                                            className={`absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 ${spot.direction === 'top' ? 'bottom-[-7px] border-b border-r' : 'top-[-7px] border-t border-l'}`}
                                            style={{
                                                background: 'rgba(28,28,30,0.92)',
                                                borderColor: 'rgba(255,255,255,0.12)',
                                            }}
                                        />

                                        {/* Product Image */}
                                        <div className="w-full aspect-[4/3] overflow-hidden bg-[#111]">
                                            <img
                                                src={spot.product.image}
                                                alt={spot.product.title}
                                                className="w-full h-full object-cover opacity-90"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=400&auto=format&fit=crop";
                                                }}
                                            />
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 text-right" dir="rtl">
                                            {spot.product.category && (
                                                <span className="text-[10px] font-black text-[#007AFF] block mb-1">
                                                    {spot.product.category.split(' ')[0]}
                                                </span>
                                            )}
                                            <h4 className="font-black text-[14px] text-white leading-snug tracking-tight mb-3 line-clamp-2">
                                                {spot.product.title}
                                            </h4>

                                            {/* Price + Add row */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <PopupCartBtn product={spot.product} />
                                                <span className="font-black text-white text-[15px] tracking-tight">
                                                    ₪{(spot.product.salePrice ?? spot.product.price)?.toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Details link */}
                                            <Link
                                                to={`/catalog/${spot.product.id}`}
                                                className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#636366] hover:text-[#007AFF] transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ArrowLeft size={11} />
                                                פרטים נוספים
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShoppableImage;
