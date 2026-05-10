import React, { useEffect, useMemo, useState, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import TrustBadges from '../components/TrustBadges';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import RecentlyViewedTray from '../components/RecentlyViewedTray';
import ProductPageSidebar from '../components/ProductPageSidebar';
import Magnetic from '../components/Magnetic';
import { useSettings } from '../context/SettingsContext';

// ─── Module-level constants (never re-created on render) ─────────────────────
// Moved constants into component useMemo for dynamic control

// ─── Memoised fallback component ─────────────────────────────────────────────
const ImageFallback = memo(() => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-4 rounded-3xl md:rounded-[2rem]">
        <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs md:text-sm font-bold text-gray-400 tracking-widest uppercase">nextclass visual</span>
    </div>
));
ImageFallback.displayName = 'ImageFallback';

const DEFAULT_FAQ = [
    { q: 'מהו זמן האספקה הצפוי?',                a: 'אספקה תוך 3–7 ימי עסקים לרוב האזורים בישראל. הזמנות גדולות (מוסדי) עשויות לקחת עד 14 יום.' },
    { q: 'האם ניתן לקבל הצעת מחיר מוסדית?',      a: 'כן! מלאו את טופס יצירת הקשר או התקשרו אלינו ישירות לקבלת הצעת מחיר מותאמת לבית ספרכם.' },
    { q: 'מה כולל שירות ההתקנה?',                  a: 'שירות ההתקנה כולל: הרכבה מלאה, הגדרת רשת, הדרכת צוות ופתרון בעיות ראשוני.' },
    { q: 'האם קיימת אחריות על המוצר?',             a: 'כל המוצרים מגיעים עם אחריות יצרן של 3 שנים ותמיכה טכנית מלאה של NextClass.' },
    { q: 'כיצד ניתן לבצע תיקון או להחזיר מוצר?', a: 'ניתן לפנות לשירות הלקוחות שלנו בכל ערוץ — טלפון, וואטסאפ או דוא"ל — ונלווה אתכם בכל תהליך.' },
];

// ─── FAQ Section ─────────────────────────────────────────────────────────────
function ProductFAQ({ getSetting }) {
    const [openIdx, setOpenIdx] = useState(null);
    // Read individual CMS keys (matching AdminContent pd_faq_section fields)
    const items = [
        { q: getSetting('pd_faq_q1', DEFAULT_FAQ[0].q), a: getSetting('pd_faq_a1', DEFAULT_FAQ[0].a) },
        { q: getSetting('pd_faq_q2', DEFAULT_FAQ[1].q), a: getSetting('pd_faq_a2', DEFAULT_FAQ[1].a) },
        { q: getSetting('pd_faq_q3', DEFAULT_FAQ[2].q), a: getSetting('pd_faq_a3', DEFAULT_FAQ[2].a) },
        { q: getSetting('pd_faq_q4', DEFAULT_FAQ[3].q), a: getSetting('pd_faq_a4', DEFAULT_FAQ[3].a) },
        { q: getSetting('pd_faq_q5', DEFAULT_FAQ[4].q), a: getSetting('pd_faq_a5', DEFAULT_FAQ[4].a) },
    ].filter(item => item.q && item.a);
    if (!items.length) return null;
    return (
        <section id="pd-faq" className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">
            <div className="text-right mb-10">
                <div className="flex items-center gap-3 justify-end mb-4">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">{getSetting('pd_faq_title', 'שאלות גולשים')}</h3>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(88,86,214,0.10)', border: '1px solid rgba(88,86,214,0.18)' }}>
                        <svg className="w-6 h-6 text-[#5856D6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                </div>
                <div className="h-1 w-12 bg-[#5856D6] rounded-full mr-0 ml-auto" />
            </div>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <motion.div key={i} className="rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                        <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                            className="w-full flex items-center justify-between gap-4 p-5 text-right cursor-pointer">
                            <motion.svg className="w-5 h-5 text-[#5856D6] shrink-0"
                                animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.25 }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </motion.svg>
                            <span className="font-black text-[#1D1D1F] text-base flex-1">{item.q}</span>
                        </button>
                        <AnimatePresence>
                            {openIdx === i && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}>
                                    <p className="px-5 pb-5 text-[#6E6E73] text-base leading-relaxed text-right">{item.a}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────
function ProductReviews({ getSetting, product }) {
    const avgRating = parseFloat(getSetting('pd_reviews_avg', '4.8'));
    const reviewCount = parseInt(getSetting('pd_reviews_count', '24'));
    const defaultReviews = [
        { name: getSetting('pd_review1_name','שרה כ.'), role: getSetting('pd_review1_role','מורה, חט"ב גבעתיים'), text: getSetting('pd_review1_text','ממש שדרגנו את הכיתה! הנוחות והמהירות מדהימים, הילדים מעורבים הרבה יותר.'), stars: 5 },
        { name: getSetting('pd_review2_name','דוד מ.'), role: getSetting('pd_review2_role','רכז טכנולוגיה, יסודי הרצליה'), text: getSetting('pd_review2_text','התמיכה של NextClass מעולה. התקנה מהירה, ממשק ידידותי, ממליץ בחום.'), stars: 5 },
        { name: getSetting('pd_review3_name','מיכל ל.'), role: getSetting('pd_review3_role','מנהלת בית ספר'), text: getSetting('pd_review3_text','השקענו בכמה מוצרים של NextClass השנה — כולם ממליצים. איכות ומחיר מעולים.'), stars: 4 },
    ];
    return (
        <section id="pd-reviews" className="max-w-[1200px] mx-auto px-6 md:px-12 mb-24">
            <div className="text-right mb-10">
                <div className="flex items-center gap-3 justify-end mb-4">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">{getSetting('pd_reviews_title', 'חוות דעת')}</h3>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(255,149,0,0.10)', border: '1px solid rgba(255,149,0,0.18)' }}>
                        <svg className="w-6 h-6 text-[#FF9500]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                    </div>
                </div>
                {/* Summary bar */}
                <div className="flex items-center gap-6 justify-end mb-8">
                    <div className="flex items-center gap-1.5">
                        {[1,2,3,4,5].map(s => (
                            <svg key={s} className="w-5 h-5" fill={s <= Math.round(avgRating) ? '#FF9500' : '#E5E5EA'} viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                            </svg>
                        ))}
                    </div>
                    <span className="text-4xl font-black text-[#1D1D1F] tracking-tighter">{avgRating}</span>
                    <span className="text-[#86868B] font-medium">{reviewCount} חוות דעת</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {defaultReviews.map((r, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22,1,0.36,1] }}
                        className="p-6 rounded-[1.75rem] text-right"
                        style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-1 mb-4 justify-end">
                            {[1,2,3,4,5].map(s => (
                                <svg key={s} className="w-4 h-4" fill={s <= r.stars ? '#FF9500' : '#E5E5EA'} viewBox="0 0 24 24">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                                </svg>
                            ))}
                        </div>
                        <p className="text-[#1D1D1F] text-sm font-medium leading-relaxed mb-5">"{r.text}"</p>
                        <div className="border-t border-gray-100 pt-4">
                            <p className="font-black text-[#1D1D1F] text-sm">{r.name}</p>
                            <p className="text-[#86868B] text-xs font-medium">{r.role}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

const ProductDetailPage = () => {
    const { id } = useParams();
    const { getSetting, isVisible } = useSettings();
    const { cartItems, addToCart, removeFromCart } = useCart();
    const { getProductById: fetchProduct } = useProducts();
    const { addToCompare, removeFromCompare, isSelected: isProductCompared } = useCompare();

    const content = useMemo(() => ({
        notFound:   getSetting('pd_not_found', 'המוצר לא נמצא.'),
        liveDemo:   getSetting('pd_live_demo', 'LIVE DEMO'),
        home:       getSetting('pd_home', 'ראשי'),
        catalog:    getSetting('pd_catalog', 'קטלוג'),
        contactForPrice: getSetting('pd_contact_for_price', 'צור קשר להצעת מחיר'),
        colorLabel: getSetting('pd_color_label', 'בחירת צבע'),
        accTitle:   getSetting('pd_acc_title', 'השלם את המערכת שלך'),
        accOptional: getSetting('pd_acc_optional', 'אופציונלי'),
        addedSuccess: getSetting('pd_added_success', 'נוסף לסל בהצלחה'),
        added:      getSetting('pd_added', 'נוסף'),
        remove:     getSetting('pd_remove', 'הסר'),
        removeFromCart: getSetting('pd_remove_from_cart', 'הסר מהעגלה'),
        addToCart:  getSetting('catalog_add_to_cart', 'הוסף לעגלה'),
        buyNow:     getSetting('pd_buy_now', 'קנה עכשיו'),
        quickInquiry: getSetting('pd_quick_inquiry', 'שלח פנייה מהירה'),
        requestQuoteInst: getSetting('pd_request_quote_inst', 'בקש הצעת מחיר מוסדית'),
        compareSelected: getSetting('pd_compare_selected', 'נבחר להשוואה'),
        compareBtn: getSetting('pd_compare_btn', 'השווה דגם'),
        specsTitle: getSetting('pd_specs_title', 'מפרט טכני'),
        specsDesc:  getSetting('pd_specs_desc', 'הפרטים המדויקים שהופכים את המערכת הזו למובילה מסוגה.'),
        moreInfo:   getSetting('pd_more_info', 'פרטים נוספים ←'),
    }), [getSetting]);

    const COLORS = useMemo(() => [
        { id: 'space-gray', name: 'Space Gray', hex: '#3C3C3E' },
        { id: 'silver', name: 'Silver', hex: '#E3E3E5' },
    ], []);

    const ACCESSORIES = useMemo(() => [
        {
            id: 'hdmi',
            title: getSetting('acc_hdmi_title', 'כבל HDMI פרימיים 2.1'),
            description: getSetting('acc_hdmi_desc', '8K 60Hz סופר מהיר עם מגן אלקטרומגנטי'),
            price: parseInt(getSetting('acc_hdmi_price', '150')),
            image: 'https://images.pexels.com/photos/4219860/pexels-photo-4219860.jpeg?auto=compress&cs=tinysrgb&w=200',
            category: 'קישוריות',
        },
        {
            id: 'mount',
            title: getSetting('acc_mount_title', 'מתקן תלייה מגנטי'),
            description: getSetting('acc_mount_desc', 'התקנה בתוך דקות עם זרוע מתכוונן בשלושה צירים'),
            price: parseInt(getSetting('acc_mount_price', '300')),
            image: 'https://images.pexels.com/photos/7214589/pexels-photo-7214589.jpeg?auto=compress&cs=tinysrgb&w=200',
            category: 'התקנה',
        },
    ], [getSetting]);

    const SCROLLYTELLING_FEATURES = useMemo(() => [
        {
            id: 1,
            title: getSetting('feat1_title', 'חוויית 4K קולנועית בכל כיתה'),
            description: getSetting('feat1_desc', 'פאנל ה-OLED החדשני מעניק חדות בלתי מתפשרת וצבעים מדויקים, כדי שכל פרט בשיעור ייראה חי, ברור ובולט גם באור יום מלא.'),
            image: getSetting('feat1_img', 'https://images.pexels.com/photos/5082567/pexels-photo-5082567.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        },
        {
            id: 2,
            title: getSetting('feat2_title', 'חיבור מיידי, ללא כבלים'),
            description: getSetting('feat2_desc', 'שתף בקלות מהסמארטפון או הלפטופ ישירות למסך הגדול. טכנולוגיית ה-AirPlay וה-Miracast המובנית מאפשרת לך להתחיל ללמד בשניות.'),
            image: getSetting('feat2_img', 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        },
        {
            id: 3,
            title: getSetting('feat3_title', 'אינטראקציה חכמה ואינטואיטיבית'),
            description: getSetting('feat3_desc', 'ניהול אפליקציות וכלי למידה בלחיצה אחת. ממשק ה-NextTouch מותאם אישית לצרכים שלך, ומאפשר זרימה חופשית של תוכן ותקשורת.'),
            image: getSetting('feat3_img', 'https://images.pexels.com/photos/4144096/pexels-photo-4144096.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        },
        {
            id: 4,
            title: getSetting('feat4_title', 'עוצמה שדוחפת קדימה'),
            description: getSetting('feat4_desc', 'עם מעבד ה-M2 Pro העוצמתי, הכל רץ מהר וחלק — מהפעלת סרטוני VR ועד עבודה על אפליקציות כבדות במקביל. ללא השהיות, ללא פשרות.'),
            image: getSetting('feat4_img', 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200'),
        },
    ], [getSetting]);

    const showPrices = isVisible('show_prices', true);
    const allowOrders = isVisible('allow_orders', true);

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

    // ─── Reactive active feature index ────────────────────────────────────────
    const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);
    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        const idx = Math.min(
            Math.floor(v * SCROLLYTELLING_FEATURES.length),
            SCROLLYTELLING_FEATURES.length - 1
        );
        setActiveFeatureIdx(idx);
    });

    // ─── Show sticky nav bar after scrolling past hero ─────────────────────
    useEffect(() => {
        const handleScroll = () => setShowStickyBar(window.scrollY > 250);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // check immediately on mount
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ─── Recently Viewed tracking ─────────────────────────────────────────────
    const { recentIds, trackView } = useRecentlyViewed();

    // ─── Reset state on product ID change ────────────────────────────────────
    useEffect(() => {
        setImgError(false);
        setActiveColor(COLORS[0]);
        setSelectedAccessories(new Set());

        trackView(id);
    }, [id, trackView]);

    // ─── Derived values (memoised) ────────────────────────────────────────────
    const product = useMemo(
        () => fetchProduct(id) ?? {},
        [id, fetchProduct]
    );

    const currentProductId = useMemo(
        () => `${product?.id ?? 'unknown'}-${activeColor.id}`,
        [product?.id, activeColor.id]
    );

    const isInCart = useMemo(() => cartItems.some(item => item.id === currentProductId), [cartItems, currentProductId]);

    const totalPrice = useMemo(() => {
        let total = product?.price ?? 0;
        selectedAccessories.forEach(accId => {
            const acc = ACCESSORIES.find(a => a.id === accId);
            if (acc) total += acc.price;
        });
        return total;
    }, [product?.price, selectedAccessories, ACCESSORIES]);

    const formattedPrice = useMemo(() => `₪${totalPrice.toLocaleString()}`, [totalPrice]);

    const isProductSelectedForCompare = useMemo(
        () => isProductCompared(product?.id),
        [isProductCompared, product?.id]
    );

    // ─── Stable handlers (useCallback — prevents re-render of motion.button) ─
    const handleImgError = useCallback((e) => {
        if (!e.target.dataset.triedFallback) {
            e.target.dataset.triedFallback = 'true';
            // Use reliable Pexels fallback instead of Unsplash
            e.target.src = 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=800';
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
    }, [isInCart, currentProductId, product, activeColor, totalPrice, selectedAccessories, addToCart, removeFromCart, ACCESSORIES]);

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
                    <p className="text-gray-400 text-xl font-medium">{content.notFound}</p>
                </div>
            </PageTransition>
        );
    }

    return (
        <>
            {/* ─── Mobile-Only Bottom CTA Bar (always visible on mobile) ──────── */}
            {createPortal(
                <AnimatePresence>
                    {showStickyBar && (
                        <motion.div
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                            className="fixed bottom-0 left-0 right-0 z-[999] md:hidden px-4 pb-5 pt-3 flex gap-3 items-center"
                            style={{
                                background: 'linear-gradient(to top, rgba(245,245,247,1) 60%, rgba(245,245,247,0))',
                            }}
                        >
                            {allowOrders ? (
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={handleCartToggle}
                                    className={`flex-1 h-[54px] rounded-full font-black text-[15px] flex items-center justify-center gap-2 transition-all ${
                                        isInCart
                                            ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200'
                                            : 'bg-[#007AFF] text-white shadow-[0_8px_24px_rgba(0,122,255,0.35)]'
                                    }`}
                                >
                                    {isInCart ? (
                                        <><svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>{content.added}</>
                                    ) : (
                                        <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>{content.addToCart}</>
                                    )}
                                </motion.button>
                            ) : null}
                            <Link to="/contact" className="shrink-0">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    className="h-[54px] px-5 rounded-full border-2 border-[#1D1D1F] text-[#1D1D1F] font-black text-[13px] flex items-center justify-center gap-2 bg-white/80 backdrop-blur-xl"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {content.quickInquiry}
                                </motion.button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ─── Desktop Sticky Mini-Bar via Portal ──────────────────────────── */}
            {createPortal(
                <AnimatePresence>
                    {showStickyBar && (
                        <motion.div
                            initial={{ y: '-100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '-100%' }}
                            transition={{ type: 'spring', stiffness: 450, damping: 30, mass: 0.8 }}
                            className="fixed top-0 left-0 w-full z-[1001] bg-white/70 backdrop-blur-3xl backdrop-saturate-[1.5] border-b border-white/60 shadow-[0_8px_32px_0_rgb(31_38_135/0.07)] py-4 px-6 md:px-12 flex justify-between items-center will-change-transform"
                        >
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{product.category}</span>
                                <h2 className="text-sm md:text-base font-black text-[#1D1D1F] tracking-tighter truncate max-w-[150px] md:max-w-none">
                                    {product.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-6">
                                {showPrices && (
                                    <span className="text-lg md:text-xl font-black text-[#1D1D1F] tracking-tighter">{formattedPrice}</span>
                                )}
                                {allowOrders ? (
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
                                            <motion.div key="in-cart" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-1.5">
                                                 <div className="flex items-center gap-1.5 group-hover:hidden">
                                                     <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                     </svg>
                                                     <span>נוסף</span>
                                                 </div>
                                                 <div className="hidden group-hover:flex items-center gap-1.5 text-red-500">
                                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                     </svg>
                                                     <span>הסר מהעגלה</span>
                                                 </div>
                                             </motion.div>
                                        ) : (
                                            <motion.span key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                                הוסף לעגלה
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                                ) : (
                                    <Link to="/contact">
                                        <button className="h-[44px] px-6 rounded-full bg-[#007AFF] text-white font-bold text-sm shadow-md">
                                            {content.requestQuote}
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <PageTransition>
                {/* ─── Product Page Sidebar Navigation ─────────────────────────── */}
                <ProductPageSidebar visible={true} />

                {/* ─── Main Content ────────────────────────────────────────────── */}
                <div id="pd-overview" className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full">
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
                                <div
                                    className="w-full rounded-[2rem] shadow-xl overflow-hidden ring-1 ring-black/5 transition-apple-fluid relative"
                                >
                                    {product.videoUrl ? (
                                        /* ── Cinematic Video Mode (Figure-Ground) ─────── */
                                        <div className="relative w-full aspect-square md:aspect-[4/3] bg-gray-900 overflow-hidden">
                                            {/* Always-visible product image (behind video) */}
                                            {!imgError && product.image && (
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    onError={handleImgError}
                                                />
                                            )}

                                            {/* Video overlaid on top — without blend mode */}
                                            <video
                                                key={product.videoUrl}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover opacity-95"
                                            >
                                                <source src={product.videoUrl} type="video/mp4" />
                                            </video>

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
                                                <span className="text-white text-[10px] font-bold uppercase tracking-wider">{content.liveDemo}</span>
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
                                </div>
                            </AnimatePresence>
                        </div>

                        {/* ─── Right Column: Product Info ────────────────────────── */}
                        <div className="flex flex-col">
                            {/* Breadcrumb */}
                            <div className="text-sm font-medium text-gray-400 mb-8 flex items-center gap-2">
                                <Link to="/" className="hover:text-[#007AFF] transition-apple-fluid">{content.home}</Link>
                                <span>/</span>
                                <Link to="/catalog" className="hover:text-[#007AFF] transition-apple-fluid">{content.catalog}</Link>
                                <span>/</span>
                                <span className="text-gray-600 line-clamp-1">{product.title}</span>
                            </div>

                            <div className="text-[#007AFF] font-bold text-xs uppercase tracking-widest mb-4">{product.category}</div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-[1.15] mb-4">{product.title}</h1>
                            {showPrices ? (
                                <div className="text-4xl font-black tracking-tighter text-[#1D1D1F] my-6">{formattedPrice}</div>
                            ) : (
                                <div className="my-6">
                                    <span className="text-xl font-bold text-[#007AFF]">{content.contactForPrice}</span>
                                </div>
                            )}

                            {/* Color Selector */}
                            <section className="mb-12">
                                <h3 className="text-lg font-bold text-[#1D1D1F] mb-6">{content.colorLabel}</h3>
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

                            {/* Accessories - Dimensions anchor for sidebar */}
                            <section id="pd-dims" className="mb-12">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-black text-[#1D1D1F] tracking-tight">{content.accTitle}</h3>
                                    <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full">{content.accOptional}</span>
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
                                {allowOrders ? (
                                    <Magnetic strength={0.2}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleCartToggle}
                                            className={`group relative h-[64px] w-full min-w-[320px] py-5 rounded-full text-xl shadow-lg transition-all duration-300 overflow-hidden flex items-center justify-center ${isInCart
                                                ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200'
                                                : 'bg-[#007AFF] text-white shadow-[0_12px_32px_rgb(0_122_255/0.25)]'
                                                }`}
                                        >
                                            {/* Animated Shine Overlay */}
                                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                                            <AnimatePresence mode="wait">
                                                {isInCart ? (
                                                    <motion.div
                                                        key="in-cart"
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -15 }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <div className="flex items-center gap-2 group-hover:hidden">
                                                         <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span>{content.addedSuccess}</span>
                                                        </div>
                                                        <div className="hidden group-hover:flex items-center gap-2 text-red-500">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        <span>{content.removeFromCart}</span>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.span
                                                        key="add"
                                                        initial={{ opacity: 0, y: 15 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -15 }}
                                                    >
                                                        {`${content.addToCart} — ${showPrices ? formattedPrice : ''}`}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </Magnetic>
                                ) : (
                                    <Link to="/contact">
                                        <button className="h-[64px] w-full py-5 rounded-full bg-[#007AFF] text-white text-xl font-bold shadow-lg hover:bg-blue-600 transition-all">
                                            {content.requestQuoteInst}
                                        </button>
                                    </Link>
                                )}

                                <TrustBadges />

                                {allowOrders && (
                                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                    <Magnetic strength={0.15}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex-1 min-w-[200px] bg-black text-white py-4 px-10 rounded-full font-bold text-lg hover:bg-gray-900 transition-apple-fluid shadow-lg relative overflow-hidden group"
                                        >
                                            {/* Shine effect for black button */}
                                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                                            {allowOrders ? content.buyNow : content.quickInquiry}
                                        </motion.button>
                                    </Magnetic>
                                    <Magnetic strength={0.15}>
                                        <motion.button
                                            onClick={handleCompareToggle}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`flex-1 min-w-[200px] border-2 py-4 px-10 rounded-full font-bold flex justify-center items-center gap-3 transition-apple-fluid ${isProductSelectedForCompare ? 'bg-[#007AFF]/5 border-[#007AFF] text-[#007AFF]' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                            </svg>
                                            <span>{isProductSelectedForCompare ? content.compareSelected : content.compareBtn}</span>
                                        </motion.button>
                                    </Magnetic>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── Apple-Tier Scrollytelling Section ──────────────────────── */}
                    {/* Note: DO NOT use overflow-hidden here, it completely breaks position: sticky! */}
                    <div id="pd-features" ref={scrollytellingRef} className="relative min-h-[100vh] bg-[#F5F5F7] mt-24 md:mt-40 rounded-3xl md:rounded-[4rem] shadow-[0_-20px_50px_rgb(0_0_0/0.02)]">
                        <div className="max-w-7xl mx-auto h-full flex flex-col md:grid md:grid-cols-2 relative">

                            {/* Sticky Visual — order 1 on mobile, 2 on desktop */}
                            <div className="order-1 md:order-2 sticky top-[100px] z-10 w-full h-[45vh] md:h-[calc(100vh-140px)] self-start flex items-center justify-center p-4 md:p-12 bg-[#F5F5F7]/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none rounded-2xl md:rounded-[3rem] transition-all">
                                <motion.div
                                    className="relative w-full aspect-video md:aspect-square lg:aspect-square rounded-2xl md:rounded-[3rem] overflow-hidden shadow-xl bg-[#EBEBEF]"
                                >
                                    <AnimatePresence>
                                        <motion.div
                                            key={activeFeatureIdx}
                                            initial={{ opacity: 0, filter: 'blur(10px)', scale: 1.05 }}
                                            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                                            exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                                            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                            className="absolute inset-0"
                                        >
                                            <img
                                                src={SCROLLYTELLING_FEATURES[activeFeatureIdx].image}
                                                alt={SCROLLYTELLING_FEATURES[activeFeatureIdx].title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Immediately replace with local robust fallback if unsplash fails
                                                    e.target.style.display = 'none';
                                                    e.target.nextElementSibling.style.display = 'flex';
                                                }}
                                            />
                                            {/* Hidden fallback container that shows if img errors */}
                                            <div style={{ display: 'none', width: '100%', height: '100%' }}>
                                                <ImageFallback />
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl md:rounded-[3rem] pointer-events-none" />
                                </motion.div>
                            </div>

                            {/* Narrative Text — order 2 on mobile, 1 on desktop */}
                            <div className="order-2 md:order-1 flex flex-col items-center justify-center gap-0 md:gap-[30vh] px-6 md:px-12 pb-[15vh] md:pb-[20vh] md:pt-[20vh] z-0">
                                {SCROLLYTELLING_FEATURES.map((feature, i) => (
                                    <motion.div
                                        key={feature.id}
                                        initial={{ opacity: 0.15, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: false, margin: '-25% 0px -25% 0px' }}
                                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                        // On mobile, space items directly. On desktop, they are spaced by gap-[30vh]
                                        className={`max-w-md w-full ${i > 0 ? 'mt-[25vh] md:mt-0' : 'mt-[5vh] md:mt-0'} py-12 md:py-0`}
                                    >
                                        <h2 className="text-2xl md:text-5xl font-black text-[#1D1D1F] leading-tight mb-4 tracking-tighter">
                                            {feature.title}
                                        </h2>
                                        <p className="text-lg md:text-xl font-normal text-[#86868B] leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                        </div>
                    </div>

                    {/* ─── Technical Specs Grid ──────────────────────────────────── */}
                    {(product.specs?.length ?? 0) > 0 && (
                        <div id="pd-specs" className="relative max-w-[1200px] mx-auto mt-16 md:mt-24 mb-24 px-6 md:px-12">
                            <div
                                className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] md:rounded-[4rem] border border-white/60 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden relative"
                            >
                                {/* Ambient subtle glow for liveliness */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#007AFF]/10 rounded-full blur-[100px] pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
                                
                                <div className="p-8 md:p-16 lg:p-24 relative z-10">
                                    <div className="text-right mb-12 md:mb-20">
                                        <h3 className="text-4xl md:text-6xl font-black tracking-tighter text-[#1D1D1F] mb-4">מפרט טכני</h3>
                                        <div className="h-1.5 w-16 bg-[#007AFF] rounded-full mb-6"></div>
                                        <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">הפרטים המדויקים שהופכים את המערכת הזו למובילה מסוגה.</p>
                                    </div>
                                    
                                    <div className="flex flex-col w-full divide-y divide-gray-200/60">
                                        {product.specs.map((spec, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: 20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true, margin: "-50px" }}
                                                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                                className="flex flex-col md:flex-row py-6 md:py-8 gap-3 md:gap-12 group hover:bg-black/[0.02] transition-colors duration-400 rounded-2xl px-6 -mx-6"
                                            >
                                                <div className="w-full md:w-1/3 text-right flex items-center">
                                                    <span className="text-sm md:text-base font-bold text-gray-500 uppercase tracking-widest">{spec?.label}</span>
                                                </div>
                                                <div className="w-full md:w-2/3 text-right flex items-center">
                                                    <span className="text-xl md:text-2xl font-black text-[#1D1D1F] tracking-tight">{spec?.value}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Warranty & Purchase Terms ──────────────────────────────── */}
                <section id="pd-warranty" className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">
                    <div className="rounded-[3rem] p-8 md:p-14 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,255,255,0.95) 60%)',
                            border: '1px solid rgba(0,122,255,0.12)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.04)',
                        }}>
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none -z-0"
                            style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.06) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
                        <div className="relative z-10 text-right">
                            <div className="flex items-center gap-3 justify-end mb-6">
                                <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">
                                    {getSetting('pd_warranty_title', 'תנאי רכישה ואחריות')}
                                </h3>
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.15)' }}>
                                    <svg className="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                            </div>
                            <div className="h-1 w-12 bg-[#007AFF] rounded-full mb-8 mr-0 ml-auto" />
                            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-3xl mr-0 ml-auto whitespace-pre-line">
                                {getSetting('pd_warranty_text', 'המוצר מגיע עם אחריות יצרן מלאה לשנה אחת. NextClass מציעה שירות תיקונים מקצועי ותמיכה טכנית לאורך כל תקופת האחריות. ניתן להארכת אחריות ל-3 שנים בתשלום נוסף. כל המוצרים עוברים בדיקת איכות קפדנית לפני המשלוח.')}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                                {[
                                    { icon: '🛡️', label: getSetting('pd_warranty_badge1', 'אחריות יצרן'), sub: getSetting('pd_warranty_badge1_sub', '12 חודשים') },
                                    { icon: '🔧', label: getSetting('pd_warranty_badge2', 'תיקון חינם'),  sub: getSetting('pd_warranty_badge2_sub', 'כולל חלפים') },
                                    { icon: '📦', label: getSetting('pd_warranty_badge3', 'החלפת מוצר'),  sub: getSetting('pd_warranty_badge3_sub', 'תוך 30 יום') },
                                ].map((b, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl"
                                        style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                                        <span className="text-2xl">{b.icon}</span>
                                        <div className="text-right">
                                            <p className="font-black text-[#1D1D1F] text-sm">{b.label}</p>
                                            <p className="text-[#86868B] text-xs font-medium">{b.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Service & Support ──────────────────────────────────────── */}
                <section id="pd-support" className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">
                    <div className="rounded-[3rem] p-8 md:p-14"
                        style={{
                            background: 'rgba(255,255,255,0.88)',
                            backdropFilter: 'blur(32px) saturate(1.8)',
                            WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
                            border: '1px solid rgba(255,255,255,0.82)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                        }}>
                        <div className="flex items-center gap-3 justify-end mb-8">
                            <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">{getSetting('pd_support_title', 'שירות ותמיכה')}</h3>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.18)' }}>
                                <svg className="w-6 h-6 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-right">
                            {[
                                { icon: '📞', href: `tel:${getSetting('contact_phone','03-9999999')}`, label: getSetting('pd_support_phone_label','תמיכה טלפונית'), value: getSetting('contact_phone','03-9999999'), color: '#007AFF' },
                                { icon: '✉️', href: `mailto:${getSetting('contact_email','info@nextclass.co.il')}`, label: getSetting('pd_support_email_label','שלח מייל'), value: getSetting('contact_email','info@nextclass.co.il'), color: '#5856D6' },
                                { icon: '💬', href: 'https://wa.me/972546398257', label: getSetting('pd_support_wa_label','וואטסאפ'), value: getSetting('pd_support_wa_value','זמינים 9:00–21:00'), color: '#25D366' },
                            ].map((item, i) => (
                                <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                                    className="group flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02]"
                                    style={{ background: `${item.color}08`, border: `1px solid ${item.color}18`, boxShadow: `0 4px 16px ${item.color}0A` }}>
                                    <span className="text-2xl">{item.icon}</span>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest mb-0.5" style={{ color: item.color }}>{item.label}</p>
                                        <p className="font-bold text-[#1D1D1F] text-sm group-hover:underline">{item.value}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FAQ — Frequently Asked Questions ───────────────────────── */}
                <ProductFAQ getSetting={getSetting} />

                {/* ─── Reviews ────────────────────────────────────────────────── */}
                <ProductReviews getSetting={getSetting} product={product} />

                {/* ─── Recently Viewed Tray ─────────────────────────────────── */}
                <RecentlyViewedTray recentIds={recentIds} currentId={product?.id} />

            </PageTransition>
        </>
    );
};

export default memo(ProductDetailPage);
