import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import products from '../data/products';

// Data for Scrollytelling Features (Contextual Narratives)
const SCROLLYTELLING_FEATURES = [
    {
        id: 1,
        title: "חוויית 4K קולנועית בכל כיתה",
        description: "פאנל ה-OLED החדשני מעניק חדות בלתי מתפשרת וצבעים מדויקים, כדי שכל פרט בשיעור ייראה חי, ברור ובולט גם באור יום מלא.",
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "חיבור מיידי, ללא כבלים",
        description: "שתף בקלות מהסמארטפון או הלפטופ ישירות למסך הגדול. טכנולוגיית ה-AirPlay וה-Miracast המובנית מאפשרת לך להתחיל ללמד בשניות.",
        image: "https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "אינטראקציה חכמה ואינטואיטיבית",
        description: "ניהול אפליקציות וכלי למידה בלחיצה אחת. ממשק ה-NextTouch מותאם אישית לצרכים שלך, ומאפשר זרימה חופשית של תוכן ותקשורת.",
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop"
    },
    {
        id: 4,
        title: "עוצמה שדוחפת קדימה",
        description: "עם מעבד ה-M2 Pro העוצמתי, הכל רץ מהר וחלק — מהפעלת סרטוני VR ועד עבודה על אפליקציות כבדות במקביל. ללא השהיות, ללא פשרות.",
        image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1200&auto=format&fit=crop"
    }
];

const COLORS = [
    { id: 'space-gray', name: 'Space Gray', hex: '#3C3C3E' },
    { id: 'silver', name: 'Silver', hex: '#E3E3E5' },
];

const ACCESSORIES = [
    { id: 'hdmi', title: 'כבל HDMI פרימיום 2.1', price: 150 },
    { id: 'mount', title: 'מתקן תלייה מגנטי', price: 300 },
];

const ImageFallback = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-4 rounded-[2rem]">
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-bold text-gray-300 tracking-widest uppercase">nextclass</span>
    </div>
);

const ProductDetailPage = () => {
    const { id } = useParams();
    const { addToCompare, removeFromCompare, isSelected } = useCompare();
    const { addToCart } = useCart();
    const [imgError, setImgError] = useState(false);
    const [activeColor, setActiveColor] = useState(COLORS[0]);
    const [selectedAccessories, setSelectedAccessories] = useState(new Set());
    const [showStickyBar, setShowStickyBar] = useState(false);

    const scrollytellingRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: scrollytellingRef,
        offset: ["start start", "end end"]
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const imageOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.8, 1, 1, 0.8]);

    const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
        setShowStickyBar(latest > 600);
    });

    useEffect(() => {
        setImgError(false);
        setActiveColor(COLORS[0]);
        setSelectedAccessories(new Set());
        window.scrollTo(0, 0);
    }, [id]);

    const product = useMemo(() => products.find(p => p.id === id) || products[0], [id]);

    const totalPrice = useMemo(() => {
        let total = product.price;
        selectedAccessories.forEach(accId => {
            const acc = ACCESSORIES.find(a => a.id === accId);
            if (acc) total += acc.price;
        });
        return total;
    }, [product.price, selectedAccessories]);

    const formattedPrice = `₪${totalPrice.toLocaleString()}`;
    const isProductSelectedForCompare = isSelected(product.id);

    const handleAddToCart = () => {
        addToCart({
            ...product,
            id: `${product.id}-${activeColor.id}`,
            title: `${product.title} (${activeColor.name})`,
            price: totalPrice,
            selectedColor: activeColor,
            accessories: Array.from(selectedAccessories).map(accId => ACCESSORIES.find(a => a.id === accId))
        });
    };

    const toggleAccessory = (accId) => {
        setSelectedAccessories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(accId)) newSet.delete(accId);
            else newSet.add(accId);
            return newSet;
        });
    };

    return (
        <PageTransition>
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        className="fixed top-0 left-0 w-full z-[50] bg-white/40 backdrop-blur-3xl backdrop-saturate-[1.5] border-b border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] py-4 px-6 md:px-12 flex justify-between items-center transition-apple-fluid"
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
                                onClick={handleAddToCart}
                                className="bg-[#007AFF] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-apple-fluid"
                            >
                                הוסף לעגלה
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full overflow-x-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                    <div className="w-full relative lg:sticky lg:top-32 self-start transform-gpu">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeColor.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="w-full rounded-[2rem] shadow-xl overflow-hidden glass-light ring-1 ring-black/5 transition-apple-fluid"
                            >
                                {imgError || !product.image ? (
                                    <div className="w-full aspect-square md:aspect-[4/3]"><ImageFallback /></div>
                                ) : (
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full aspect-square md:aspect-[4/3] object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
                        <div className="text-sm font-medium text-gray-400 mb-8 flex items-center gap-2">
                            <Link to="/" className="hover:text-[#007AFF] transition-apple-fluid">ראשי</Link>
                            <span>/</span>
                            <Link to="/catalog" className="hover:text-[#007AFF] transition-apple-fluid">קטלוג</Link>
                            <span>/</span>
                            <span className="text-gray-600 line-clamp-1">{product.title}</span>
                        </div>

                        <div className="text-[#007AFF] font-bold text-sm uppercase tracking-widest mb-4">{product.category}</div>
                        <h1 className="text-hero mb-4">{product.title}</h1>
                        <div className="text-2xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter mb-12">{formattedPrice}</div>

                        <section className="mb-12">
                            <h3 className="text-lg font-bold text-[#1D1D1F] mb-6">בחירת צבע</h3>
                            <div className="flex gap-4">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setActiveColor(color)}
                                        className={`w-12 h-12 rounded-full transition-apple-fluid min-w-[44px] min-h-[44px] ${activeColor.id === color.id ? 'ring-2 ring-offset-4 ring-[#007AFF] scale-110 shadow-lg' : 'hover:scale-110 opacity-80'}`}
                                        style={{ backgroundColor: color.hex }}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="mb-12">
                            <h3 className="text-lg font-bold text-[#1D1D1F] mb-6">השלם את החוויה</h3>
                            <div className="space-y-4">
                                {ACCESSORIES.map((acc) => (
                                    <div
                                        key={acc.id}
                                        onClick={() => toggleAccessory(acc.id)}
                                        className={`group relative p-5 rounded-3xl border transition-apple-fluid cursor-pointer flex justify-between items-center min-h-[56px] ${selectedAccessories.has(acc.id) ? 'bg-white border-[#007AFF] shadow-md border-opacity-30' : 'bg-[#F5F5F7] border-transparent hover:bg-white hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedAccessories.has(acc.id) ? 'bg-[#007AFF] border-[#007AFF]' : 'border-gray-300'}`}>
                                                {selectedAccessories.has(acc.id) && (
                                                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></motion.svg>
                                                )}
                                            </div>
                                            <span className="font-bold text-[#1D1D1F]">{acc.title}</span>
                                        </div>
                                        <span className={`font-black tracking-tighter ${selectedAccessories.has(acc.id) ? 'text-[#007AFF]' : 'text-gray-400'}`}>+₪{acc.price}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAddToCart}
                                className="btn-primary w-full py-5 rounded-full text-xl shadow-[0_12px_32px_rgba(0,122,255,0.25)]"
                            >
                                {`הוסף לעגלה — ${formattedPrice}`}
                            </motion.button>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-black text-white py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-apple-fluid shadow-lg">קנה עכשיו</motion.button>
                                <motion.button onClick={() => isProductSelectedForCompare ? removeFromCompare(product.id) : addToCompare(product)} className={`flex-1 border-2 py-4 rounded-full font-bold flex justify-center items-center gap-3 transition-apple-fluid ${isProductSelectedForCompare ? 'bg-[#007AFF]/5 border-[#007AFF] text-[#007AFF]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                    <span>{isProductSelectedForCompare ? "נבחר להשוואה" : "השווה דגם"}</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ──── Apple-Tier Scrollytelling Section ──── */}
                <div ref={scrollytellingRef} className="relative min-h-[150vh] bg-[#F5F5F7] mt-40 rounded-[4rem] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                    <div className="max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2">

                        {/* Narrative Text (Left Side / RTL Stack) */}
                        <div className="order-2 md:order-1 flex flex-col items-center justify-center gap-[50vh] pt-[30vh] pb-[30vh] px-12">
                            {SCROLLYTELLING_FEATURES.map((feature) => (
                                <motion.div
                                    key={feature.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ margin: "-20%" }}
                                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                                    className="max-w-md w-full"
                                >
                                    <h2 className="text-4xl md:text-6xl font-black text-[#1D1D1F] leading-tight mb-8 tracking-tighter">
                                        {feature.title}
                                    </h2>
                                    <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-medium">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Sticky Visual (Right Side / RTL Focus) */}
                        <div className="order-1 md:order-2 h-screen sticky top-24 flex items-center justify-center p-6 md:p-12 overflow-hidden">
                            <motion.div
                                style={{ scale, opacity: imageOpacity }}
                                className="relative w-full aspect-square md:aspect-[4/5] lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl transform-gpu will-change-transform bg-white"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={Math.min(Math.floor(scrollYProgress.get() * SCROLLYTELLING_FEATURES.length), SCROLLYTELLING_FEATURES.length - 1)}
                                        src={SCROLLYTELLING_FEATURES[Math.min(Math.floor(scrollYProgress.get() * SCROLLYTELLING_FEATURES.length), SCROLLYTELLING_FEATURES.length - 1)].image}
                                        alt="Feature Focus"
                                        className="w-full h-full object-cover transition-apple-fluid"
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

                {product.specs && product.specs.length > 0 && (
                    <div className="max-w-7xl mx-auto mt-32">
                        <h3 className="text-section mb-12 border-b border-gray-100 pb-4 inline-block">מפרט טכני מלא</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {product.specs.map((spec, idx) => (
                                <div key={idx} className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-apple-fluid transform-gpu hover:-translate-y-1">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">{spec.label}</span>
                                    <span className="text-xl md:text-2xl font-black text-[#1D1D1F] block">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default ProductDetailPage;
