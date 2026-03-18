import React, { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import products from '../data/products';
import TrustBadges from '../components/TrustBadges';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import RecentlyViewedTray from '../components/RecentlyViewedTray';

// ─── Module-level constants (never re-created on render) ─────────────────────
const SCROLLYTELLING_FEATURES = [
    {
        id: 1,
        title: 'חוויית 4K קולנועית בכל כיתה',
        description: 'פאנל ה-OLED החדשני מעניק חדות בלתי מתפשרת וצבעים מדויקים, כדי שכל פרט בשיעור ייראה חי, ברור ובולט גם באור יום מלא.',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: 2,
        title: 'חיבור מיידי, ללא כבלים',
        description: 'שתף בקלות מהסמארטפון או הלפטופ ישירות למסך הגדול. טכנולוגיית ה-AirPlay וה-Miracast המובנית מאפשרת לך להתחיל ללמד בשניות.',
        image: 'https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: 3,
        title: 'אינטראקציה חכמה ואינטואיטיבית',
        description: 'ניהול אפליקציות וכלי למידה בלחיצה אחת. ממשק ה-NextTouch מותאם אישית לצרכים שלך, ומאפשר זרימה חופשית של תוכן ותקשורת.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop',
    },
    {
        id: 4,
        title: 'עוצמה שדוחפת קדימה',
        description: 'עם מעבד ה-M2 Pro העוצמתי, הכל רץ מהר וחלק — מהפעלת סרטוני VR ועד עבודה על אפליקציות כבדות במקביל. ללא השהיות, ללא פשרות.',
        image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1200&auto=format&fit=crop',
    },
];

const COLORS = [
    { id: 'space-gray', name: 'Space Gray', hex: '#3C3C3E' },
    { id: 'silver', name: 'Silver', hex: '#E3E3E5' },
];

const ACCESSORIES = [
    {
        id: 'hdmi',
        title: 'כבל HDMI פרימיים 2.1',
        description: '8K 60Hz סופר מהיר עם מגן אלקטרומגנטי',
        price: 150,
        image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=200&q=80',
        category: 'קישוריות',
    },
    {
        id: 'mount',
        title: 'מתקן תלייה מגנטי',
        description: 'התקנה בתוך דקות עם זרוע מתכוונן בשלושה צירים',
        price: 300,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
        category: 'התקנה',
    },
];

// ─── Memoised fallback component ─────────────────────────────────────────────
const ImageFallback = memo(() => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-4 rounded-[2rem]">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
    </div>
));
ImageFallback.displayName = 'ImageFallback';

const ProductDetailPage = () => {
    const { id } = useParams();
    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const { cartItems, addToCart, removeFromCart } = useCart();

    const [imgError, setImgError] = useState(false);
    const [activeColor, setActiveColor] = useState(COLORS[0]);
    const [selectedAccessories, setSelectedAccessories] = useState(new Set());
    const [showStickyBar, setShowStickyBar] = useState(false);

    // ─── Scroll animations (scrollytelling) ──────────────────────────────────
    const scrollytellingRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: scrollytellingRef,
        offset: ['start start', 'end end'],
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const imageOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.8, 1, 1, 0.8]);

    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, 'change', (latest) => {
        setShowStickyBar(latest > 600);
    });

    // ─── Recently Viewed tracking ─────────────────────────────────────────────
    const { recentIds, trackView } = useRecentlyViewed();

    // ─── Reset state on product ID change ────────────────────────────────────
    useEffect(() => {
        setImgError(false);
        setActiveColor(COLORS[0]);
        setSelectedAccessories(new Set());
        window.scrollTo(0, 0);
        trackView(id);
    }, [id, trackView]);

    // ─── Derived values (memoised) ────────────────────────────────────────────
    const product = useMemo(
        () => (products ?? []).find(p => p?.id === id) ?? products?.[0] ?? {},
        [id]
    );

    const currentProductId = useMemo(
        () => `${product?.id ?? 'unknown'}-${activeColor.id}`,
        [product?.id, activeColor.id]
    );

    const isInCart = useMemo(
        () => (cartItems ?? []).some(item => item?.id === currentProductId),
        [cartItems, currentProductId]
    );

    const totalPrice = useMemo(() => {
        let total = product?.price ?? 0;
        selectedAccessories.forEach(accId => {
            const acc = ACCESSORIES.find(a => a.id === accId);
            if (acc) total += acc.price;
        });
        return total;
    }, [product?.price, selectedAccessories]);

    const formattedPrice = useMemo(() => `₪${totalPrice.toLocaleString()}`, [totalPrice]);

    const isProductSelectedForCompare = useMemo(
        () => isSelected(product?.id),
        [isSelected, product?.id]
    );

    // ─── Stable handlers (useCallback — prevents re-render of motion.button) ─
    const handleImgError = useCallback((e) => {
        if (!e.target.dataset.triedFallback) {
            e.target.dataset.triedFallback = 'true';
            e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
        } else {
            setImgError(true);
        }
    }, []);

    const handleCartToggle = useCallback(() => {
        if (isInCart) {
            removeFromCart(currentProductId);
        } else {
            addToCart({
                ...product,
                id: currentProductId,
                title: `${product?.title ?? ''} (${activeColor.name})`,
                price: totalPrice,
                selectedColor: activeColor,
                accessories: Array.from(selectedAccessories)
                    .map(accId => ACCESSORIES.find(a => a.id === accId))
                    .filter(Boolean),
            });
        }
    }, [isInCart, currentProductId, product, activeColor, totalPrice, selectedAccessories, addToCart, removeFromCart]);

    const handleCompareToggle = useCallback(() => {
        if (isProductSelectedForCompare) {
            removeFromCompare(product?.id);
        } else {
            addToCompare(product);
        }
    }, [isProductSelectedForCompare, product, addToCompare, removeFromCompare]);

    const toggleAccessory = useCallback((accId) => {
        setSelectedAccessories(prev => {
            const next = new Set(prev);
            if (next.has(accId)) next.delete(accId);
            else next.add(accId);
            return next;
        });
    }, []);

    const handleColorSelect = useCallback((color) => setActiveColor(color), []);

    // Guard: products array empty or product not found
    if (!product?.id) {
        return (
            <PageTransition>
                <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
                    <p className="text-gray-400 text-xl font-medium">המוצר לא נמצא.</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            {/* ─── Sticky Mini-Bar (appears at scroll 600px) ──────────────── */}
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        className="fixed top-0 left-0 w-full z-[50] bg-white/40 backdrop-blur-3xl backdrop-saturate-[1.5] border-b border-white/60 shadow-[0_8px_32px_0_rgb(31_38_135/0.07)] py-4 px-6 md:px-12 flex justify-between items-center transition-apple-fluid will-change-transform"
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{product.category}</span>
                            <h2 className="text-sm md:text-base font-black text-[#1D1D1F] tracking-tighter truncate max-w-[150px] md:max-w-none">
                                {product.title}
                            </h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-lg md:text-xl font-black text-[#1D1D1F] tracking-tighter">{formattedPrice}</span>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCartToggle}
                                className={`relative h-[44px] min-w-[140px] px-6 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center justify-center ${isInCart
                                    ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200'
                                    : 'bg-[#007AFF] text-white shadow-lg'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {isInCart ? (
                                        <motion.div
                                            key="in-cart"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="group-hover:hidden">נוסף</span>
                                            <span className="hidden group-hover:inline">הסר</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="add"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            הוסף לעגלה
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Main Content ────────────────────────────────────────────── */}
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full overflow-x-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">

                    {/* ─── Left Column: Sticky Media Panel ─────────────────── */}
                    <div className="w-full relative lg:sticky lg:top-32 self-start will-change-transform">

                        {/* ── Ambient Aura — pulsing glow behind the image ──── */}
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 rounded-full bg-gradient-to-br from-[#007AFF] via-violet-500 to-purple-600"
                            style={{ filter: 'blur(100px)' }}
                            aria-hidden="true"
                        />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeColor.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="w-full rounded-[2rem] shadow-xl overflow-hidden ring-1 ring-black/5 transition-apple-fluid relative"
                            >
                                {product.videoUrl ? (
                                    /* ── Cinematic Video Mode (Figure-Ground) ─────── */
                                    <div className="relative w-full aspect-square md:aspect-[4/3] bg-black overflow-hidden">
                                        {/* Ground — the looping video */}
                                        <video
                                            key={product.videoUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
                                        >
                                            <source src={product.videoUrl} type="video/mp4" />
                                        </video>

                                        {/* Fallback image shown until video loads */}
                                        {!imgError && product.image && (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="absolute inset-0 w-full h-full object-cover -z-10"
                                                onError={handleImgError}
                                            />
                                        )}

                                        {/* Figure — ultra-sharp glass badge floating above */}
                                        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                                            <motion.div
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                                className="bg-white/30 backdrop-blur-md border border-white/40 rounded-2xl px-5 py-4 inline-flex flex-col gap-1 w-fit"
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{product.category}</span>
                                                <span className="text-white font-black text-lg md:text-xl tracking-tighter leading-tight line-clamp-1">{product.title}</span>
                                                <span className="text-white/90 font-black text-2xl tracking-tighter">{formattedPrice}</span>
                                            </motion.div>
                                        </div>

                                        {/* Cinematic badge */}
                                        <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">LIVE DEMO</span>
                                        </div>
                                    </div>
                                ) : imgError || !product.image ? (
                                    /* ── Fallback ──────────────────────────────────── */
                                    <div className="w-full aspect-square md:aspect-[4/3]"><ImageFallback /></div>
                                ) : (
                                    /* ── Static Image Mode ─────────────────────────── */
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full aspect-square md:aspect-[4/3] object-cover"
                                        onError={handleImgError}
                                        loading="eager"
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* ─── Right Column: Product Info ────────────────────────── */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
                        {/* Breadcrumb */}
                        <div className="text-sm font-medium text-gray-400 mb-8 flex items-center gap-2">
                            <Link to="/" className="hover:text-[#007AFF] transition-apple-fluid">ראשי</Link>
                            <span>/</span>
                            <Link to="/catalog" className="hover:text-[#007AFF] transition-apple-fluid">קטלוג</Link>
                            <span>/</span>
                            <span className="text-gray-600 line-clamp-1">{product.title}</span>
                        </div>

                        <div className="text-[#007AFF] font-bold text-xs uppercase tracking-widest mb-4">{product.category}</div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-[1.15] mb-4">{product.title}</h1>
                        <div className="text-4xl font-black tracking-tighter text-[#1D1D1F] my-6">{formattedPrice}</div>

                        {/* Color Selector */}
                        <section className="mb-12">
                            <h3 className="text-lg font-bold text-[#1D1D1F] mb-6">בחירת צבע</h3>
                            <div className="flex gap-4">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-12 h-12 rounded-full transition-apple-fluid min-w-[44px] min-h-[44px] ${activeColor.id === color.id ? 'ring-2 ring-offset-4 ring-[#007AFF] scale-110 shadow-lg' : 'hover:scale-110 opacity-80'}`}
                                        style={{ backgroundColor: color.hex }}
                                        aria-label={color.name}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Accessories — Hyper-Glass RTL Cards */}
                        <section className="mb-12">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-black text-[#1D1D1F] tracking-tight">השלם את המערכת שלך</h3>
                                <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full">אופציונלי</span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {ACCESSORIES.map((acc) => {
                                    const isSelected = selectedAccessories.has(acc.id);
                                    return (
                                        <motion.div
                                            key={acc.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleAccessory(acc.id)}
                                            role="checkbox"
                                            aria-checked={isSelected}
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && toggleAccessory(acc.id)}
                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected
                                                    ? 'bg-white/70 border-[#007AFF]/50 shadow-[0_8px_24px_rgba(0,122,255,0.12)] backdrop-blur-xl'
                                                    : 'bg-white/40 backdrop-blur-xl border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:bg-white/60 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]'
                                                }`}
                                        >
                                            {/* Image (RTL right) */}
                                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-gray-50 to-gray-200 shadow-sm">
                                                {acc.image ? (
                                                    <img
                                                        src={acc.image}
                                                        alt={acc.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text (center, flex-1) */}
                                            <div className="flex-1 min-w-0 text-right">
                                                {acc.category && (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#007AFF]">{acc.category}</span>
                                                )}
                                                <p className="text-sm font-black text-[#1D1D1F] leading-snug">{acc.title}</p>
                                                {acc.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 leading-snug line-clamp-1">{acc.description}</p>
                                                )}
                                                <p className={`text-sm font-black tracking-tighter mt-1 ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>+₪{acc.price}</p>
                                            </div>

                                            {/* CTA / Checkmark (left side) */}
                                            <div className="shrink-0">
                                                {isSelected ? (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                        className="w-9 h-9 rounded-full bg-[#007AFF] flex items-center justify-center shadow-[0_4px_12px_rgb(0_122_255/0.4)]"
                                                    >
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        whileTap={{ scale: 0.88 }}
                                                        className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-[#007AFF] hover:bg-[#007AFF]/5 flex items-center justify-center transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 text-gray-400 hover:text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* CTAs */}
                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleCartToggle}
                                className={`group relative h-[64px] w-full py-5 rounded-full text-xl shadow-lg transition-all duration-300 overflow-hidden flex items-center justify-center ${isInCart
                                    ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200'
                                    : 'bg-[#007AFF] text-white shadow-[0_12px_32px_rgb(0_122_255/0.25)]'
                                    }`}
                            >
                                <AnimatePresence mode="wait">
                                    {isInCart ? (
                                        <motion.div
                                            key="in-cart"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            className="flex items-center gap-2"
                                        >
                                            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="group-hover:hidden">נוסף לסל בהצלחה</span>
                                            <span className="hidden group-hover:inline">הסר פריט מהעגלה</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="add"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                        >
                                            {`הוסף לעגלה — ${formattedPrice}`}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            <TrustBadges />

                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-apple-fluid shadow-lg"
                                >
                                    קנה עכשיו
                                </motion.button>
                                <motion.button
                                    onClick={handleCompareToggle}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`flex-1 border-2 py-4 rounded-full font-bold flex justify-center items-center gap-3 transition-apple-fluid ${isProductSelectedForCompare ? 'bg-[#007AFF]/5 border-[#007AFF] text-[#007AFF]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                    <span>{isProductSelectedForCompare ? 'נבחר להשוואה' : 'השווה דגם'}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ─── Apple-Tier Scrollytelling Section ──────────────────────── */}
                <div ref={scrollytellingRef} className="relative min-h-[150vh] bg-[#F5F5F7] mt-40 rounded-[4rem] overflow-hidden shadow-[0_-20px_50px_rgb(0_0_0/0.02)]">
                    <div className="max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2">

                        {/* Narrative Text */}
                        <div className="order-2 md:order-1 flex flex-col items-center justify-center gap-[50vh] pt-[30vh] pb-[30vh] px-12">
                            {SCROLLYTELLING_FEATURES.map((feature) => (
                                <motion.div
                                    key={feature.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ margin: '-20%' }}
                                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                                    className="max-w-md w-full"
                                >
                                    <h2 className="text-3xl md:text-5xl font-black text-[#1D1D1F] leading-tight mb-4 tracking-tighter">
                                        {feature.title}
                                    </h2>
                                    <p className="text-xl font-normal text-[#86868B] leading-relaxed">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Sticky Visual — only this element truly needs transform-gpu + will-change */}
                        <div className="order-1 md:order-2 h-screen sticky top-24 flex items-center justify-center p-6 md:p-12 overflow-hidden">
                            <motion.div
                                style={{ scale, opacity: imageOpacity }}
                                className="relative w-full aspect-square md:aspect-[4/5] lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl will-change-transform transform-gpu bg-white"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={Math.min(
                                            Math.floor(scrollYProgress.get() * SCROLLYTELLING_FEATURES.length),
                                            SCROLLYTELLING_FEATURES.length - 1
                                        )}
                                        src={SCROLLYTELLING_FEATURES[Math.min(
                                            Math.floor(scrollYProgress.get() * SCROLLYTELLING_FEATURES.length),
                                            SCROLLYTELLING_FEATURES.length - 1
                                        )].image}
                                        alt="Feature Focus"
                                        className="w-full h-full object-cover"
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </AnimatePresence>
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[3rem] pointer-events-none" />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* ─── Technical Specs Grid ────────────────────────────────────── */}
                {(product.specs?.length ?? 0) > 0 && (
                    <div className="max-w-7xl mx-auto mt-32">
                        <h3 className="text-section mb-12 border-b border-gray-100 pb-4 inline-block">מפרט טכני מלא</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {product.specs.map((spec, idx) => (
                                <div key={idx} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-apple-fluid hover:-translate-y-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{spec?.label}</span>
                                    <span className="text-xl md:text-2xl font-black text-[#1D1D1F] block">{spec?.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Recently Viewed Tray ─────────────────────────────────── */}
            <RecentlyViewedTray recentIds={recentIds} currentId={product?.id} />

        </PageTransition>
    );
};

export default memo(ProductDetailPage);
