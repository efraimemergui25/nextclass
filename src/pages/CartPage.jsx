import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { HardwareCatalog } from '../utils/mockData';

// Reusable Apple-Grade Motion Button Component
export const MotionButton = ({
    children,
    onClick,
    className = "",
    variant = "primary", // "primary", "ghost", "outline"
    ...props
}) => {

    const baseClasses = "relative inline-flex items-center justify-center font-semibold rounded-2xl focus:outline-none transition-colors duration-300";

    const variants = {
        primary: "bg-[#007AFF] text-white hover:bg-blue-600 shadow-[0_4px_14px_rgba(0,122,255,0.2)]",
        ghost: "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-gray-200",
        outline: "bg-transparent text-[#007AFF] border-2 border-[#007AFF] hover:bg-blue-50"
    };

    return (
        <motion.button
            whileHover={{
                scale: 1.02,
                boxShadow: variant === 'primary' ? "0 8px 25px rgba(0,122,255,0.35)" : undefined
            }}
            whileTap={{
                scale: 0.96,
                boxShadow: variant === 'primary' ? "0 2px 8px rgba(0,122,255,0.15)" : undefined
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </motion.button>
    );
};

const CartPage = () => {
    // Simulate initial cart state with 2 items from our mock data
    const [cartItems, setCartItems] = useState([
        { ...HardwareCatalog[0], quantity: 2 },
        { ...HardwareCatalog[2], quantity: 1 }
    ]);

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
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } },
        exit: { opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }
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
                        <div className="w-32 h-32 mx-auto mb-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-[#1D1D1F] mb-4 tracking-tight">העגלה שלך ריקה</h2>
                        <p className="text-gray-500 mb-10 text-lg">נראה שעוד לא בחרת ציוד לפרויקט הנוכחי. הקטלוג שלנו מחכה לך.</p>
                        <Link to="/catalog" className="inline-block">
                            <MotionButton variant="primary" className="px-10 py-4 text-lg w-full sm:w-auto">
                                חזרה לקטלוג
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
            <div className="min-h-[calc(100vh-73px)] bg-white py-12 lg:py-20">
                <div className="max-w-6xl mx-auto px-6 md:px-12">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 border-b border-gray-100 pb-6"
                    >
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1D1D1F] tracking-tight">עגלת הרכש שלך</h1>
                    </motion.div>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                        {/* Main Cart Items Area (RTL Right side visually) */}
                        <div className="w-full lg:flex-1">
                            <motion.div
                                variants={listVariants}
                                initial="hidden"
                                animate="show"
                                className="space-y-8"
                            >
                                <AnimatePresence mode="popLayout">
                                    {cartItems.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            variants={itemVariants}
                                            className="group flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-gray-100 last:border-0 relative"
                                        >
                                            {/* Image Thumbnail */}
                                            <div className="w-full sm:w-32 aspect-square rounded-2xl bg-[#F5F5F7] overflow-hidden flex-shrink-0 mb-4 sm:mb-0 ml-0 sm:ml-6 relative">
                                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 w-full pl-0 sm:pl-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="text-xl font-bold text-[#1D1D1F]">{item.name}</h3>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        aria-label="הסר פריט"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">מק"ט: {item.sku}</p>

                                                <div className="flex items-center justify-between w-full">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center bg-[#F5F5F7] rounded-lg p-1">
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                            onClick={() => handleQuantityChange(item.id, -1)}
                                                            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                                        </motion.button>
                                                        <span className="w-10 text-center font-medium text-[#1D1D1F]">{item.quantity}</span>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                                            onClick={() => handleQuantityChange(item.id, 1)}
                                                            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-white hover:text-[#1D1D1F] hover:shadow-sm transition-all"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        </motion.button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-left font-bold text-xl text-[#1D1D1F]">
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
                        <div className="w-full lg:w-[380px] lg:sticky lg:top-32 xl:top-40">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="bg-[#F5F5F7] rounded-3xl p-8"
                            >
                                <h2 className="text-xl font-bold text-[#1D1D1F] mb-6">סיכום הזמנה</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>סיכום ביניים ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} פריטים)</span>
                                        <span className="font-medium text-[#1D1D1F]">₪{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>מע"מ (17%)</span>
                                        <span className="font-medium text-[#1D1D1F]">₪{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6 mb-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-[#1D1D1F]">סה"כ לתשלום</span>
                                        <div className="text-left">
                                            <span className="block text-3xl font-extrabold text-[#1D1D1F]">₪{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            <span className="text-xs text-gray-400">כולל מיסים, לא כולל משלוח</span>
                                        </div>
                                    </div>
                                </div>

                                <Link to="/checkout" className="block w-full">
                                    <MotionButton variant="primary" className="w-full py-4 text-lg">
                                        המשך לקופה / הפק טופס רכש
                                    </MotionButton>
                                </Link>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CartPage;
