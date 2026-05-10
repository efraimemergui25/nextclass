import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { useSettings } from '../context/SettingsContext';
import { HardwareCatalog } from '../utils/mockData';

// Reusable Apple-Grade Motion Button Component
export const MotionButton = ({
    children,
    onClick,
    className = "",
    variant = "primary", // "primary", "ghost", "outline"
    ...props
}) => {

    const baseClasses = "relative inline-flex items-center justify-center font-bold rounded-full focus:outline-none transition-all duration-300";

    const variants = {
        primary: "bg-[#007AFF] text-white hover:bg-blue-600 shadow-[0_8px_25px_rgb(0_122_255/0.3)] hover:shadow-[0_12px_35px_rgb(0_122_255/0.4)]",
        ghost: "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-gray-200",
        outline: "bg-transparent text-[#007AFF] border-2 border-[#007AFF] hover:bg-blue-50"
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.button>
    );
};

const CartPage = () => {
    const { getSetting } = useSettings();
    // Simulate initial cart state with 2 items from our mock data
    const [cartItems, setCartItems] = useState([
        { ...HardwareCatalog[0], quantity: 2 },
        { ...HardwareCatalog[2], quantity: 1 }
    ]);

    const content = {
        title:        getSetting('cart_title', 'עגלת הרכש שלך'),
        emptyTitle:   getSetting('cart_empty_title', 'העגלה שלך ריקה'),
        emptyDesc:    getSetting('cart_empty_desc', 'נראה שעוד לא בחרת ציוד לפרויקט הנוכחי. הקטלוג שלנו מחכה לך.'),
        backCatalog:  getSetting('cart_back_catalog', 'חזרה לקטלוג'),
        removeAria:   getSetting('cart_remove_aria', 'הסר פריט'),
        skuLabel:     getSetting('cart_sku_label', 'מק"ט: '),
        summaryTitle: getSetting('cart_summary_title', 'סיכום הזמנה'),
        subtotalLabel: getSetting('cart_subtotal_label', 'סיכום ביניים'),
        vatLabel:     getSetting('cart_vat_label', 'מע"מ (17%)'),
        totalLabel:   getSetting('cart_total_label', 'סה"כ לתשלום'),
        taxNote:      getSetting('cart_tax_note', 'כולל מיסים, לא כולל משלוח'),
        checkoutBtn:  getSetting('cart_checkout_btn', 'המשך לקופה / הפק טופס רכש'),
        warrantyNote: getSetting('cart_warranty_note', 'אחריות מוסדית מלאה מובטחת'),
    };

    const handleQuantityChange = (id, change) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + change);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const handleRemove = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.contractPrice * item.quantity), 0);
    const vat = subtotal * 0.17; // Israeli VAT 17%
    const total = subtotal + vat;

    // Framer Motion Variants for list animations
    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 } },
        exit: { opacity: 0, x: 20, scale: 0.95, transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 } }
    };

    // Empty State Render
    if (cartItems.length === 0) {
        return (
            <PageTransition>
                <div className="min-h-[calc(100vh-73px)] bg-white flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-center max-w-md"
                    >
                        <div className="w-32 h-32 mx-auto mb-10 bg-[#F5F5F7] rounded-full flex items-center justify-center text-gray-300">
                            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#1D1D1F] mb-6 tracking-tighter">{content.emptyTitle}</h2>
                        <p className="text-gray-500 mb-12 text-xl font-normal leading-relaxed px-4">{content.emptyDesc}</p>
                        <Link to="/catalog" className="inline-block">
                            <MotionButton variant="primary" className="px-12 py-5 text-xl font-black w-full sm:w-auto">
                                {content.backCatalog}
                            </MotionButton>
                        </Link>
                    </motion.div>
                </div>
            </PageTransition>
        );
    }

    // Filled Cart Render
    return (
        <PageTransition>
            <div className="min-h-[calc(100vh-73px)] bg-white py-16 lg:py-24">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <h1 className="text-5xl lg:text-7xl font-black text-[#1D1D1F] tracking-tighter">{content.title}</h1>
                    </motion.div>

                    <div className="flex flex-col xl:flex-row gap-16 xl:gap-24 items-start">

                        {/* Main Cart Items Area (RTL Right side visually) */}
                        <div className="w-full xl:flex-1">
                            <motion.div
                                variants={listVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-12"
                            >
                                <AnimatePresence mode="popLayout">
                                    {cartItems.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            variants={itemVariants}
                                            className="group flex flex-col md:flex-row items-start py-8 bg-white border-b-0 relative" /* Removed border-b completely. Using whitespace instead */
                                        >
                                            {/* Image Thumbnail */}
                                            <div className="w-full md:w-48 aspect-square rounded-[2.5rem] bg-[#F5F5F7] overflow-hidden flex-shrink-0 mb-8 md:mb-0 ml-0 md:ml-10 relative shadow-sm">
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain p-6 mix-blend-multiply"
                                                    onError={(e) => {
                                                        if (!e.target.dataset.triedFallback) {
                                                            e.target.dataset.triedFallback = 'true';
                                                            e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 w-full pl-0 md:pl-4 flex flex-col justify-center h-full pt-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] leading-tight tracking-tighter">{item.name}</h3>
                                                     <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-2 -mt-2 bg-[#F5F5F7] hover:bg-red-50 rounded-full"
                                                        aria-label={content.removeAria}
                                                    >
                                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">{content.skuLabel}{item.sku}</p>

                                                <div className="flex items-center justify-between w-full mt-auto">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center bg-[#F5F5F7] rounded-full p-1.5 shadow-sm">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                                            onClick={() => handleQuantityChange(item.id, -1)}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-[#1D1D1F] hover:shadow-md transition-all font-bold text-lg focus:outline-none"
                                                        >
                                                            -
                                                        </motion.button>
                                                        <span className="w-12 text-center font-black text-[#1D1D1F] text-lg">{item.quantity}</span>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                                            onClick={() => handleQuantityChange(item.id, 1)}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:bg-white hover:text-[#1D1D1F] hover:shadow-md transition-all font-bold text-lg focus:outline-none"
                                                        >
                                                            +
                                                        </motion.button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-left font-black text-3xl md:text-4xl tracking-tighter text-[#1D1D1F]">
                                                        ₪{(item.contractPrice * item.quantity).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* Order Summary Panel (Sticky Left side visually) */}
                        <div className="w-full xl:w-[450px] xl:sticky xl:top-36">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                                className="bg-[#F5F5F7] rounded-[3rem] p-12 shadow-[0_40px_80px_rgb(0_0_0/0.05)]"
                            >
                                <h2 className="text-3xl font-black text-[#1D1D1F] mb-10 tracking-tighter">{content.summaryTitle}</h2>

                                <div className="space-y-6 mb-10">
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span className="text-lg">{content.subtotalLabel} ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} פריטים)</span>
                                        <span className="text-xl font-black text-[#1D1D1F] tracking-tighter">₪{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 font-normal">
                                        <span className="text-lg">{content.vatLabel}</span>
                                        <span className="text-xl font-black text-[#1D1D1F] tracking-tighter">₪{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="border-t-0 pt-6 mb-12">
                                     <div className="flex justify-between items-end">
                                        <span className="text-2xl font-black text-[#1D1D1F] tracking-tighter">{content.totalLabel}</span>
                                        <div className="text-left">
                                            <span className="block text-5xl font-black text-[#1D1D1F] tracking-tighter">₪{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className="text-sm font-bold text-gray-400 mt-2 block tracking-wide">{content.taxNote}</span>
                                        </div>
                                    </div>
                                </div>

                                 <Link to="/checkout" className="block w-full">
                                    <MotionButton variant="primary" className="w-full py-6 text-xl font-black">
                                        {content.checkoutBtn}
                                    </MotionButton>
                                </Link>

                                {/* Trust indicator */}
                                <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 font-bold">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    <span>{content.warrantyNote}</span>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CartPage;
