import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        return parseInt(priceStr.toString().replace(/[^\d]/g, ''), 10);
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const itemPrice = parsePrice(item.price || item.unitPrice || "0");
        return acc + (itemPrice * item.qty);
    }, 0);

    const drawerTransition = { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140]"
                        aria-hidden="true"
                    />

                    {/* Drawer — slides in from left edge (RTL) */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={drawerTransition}
                        className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-white/85 backdrop-blur-3xl backdrop-saturate-[1.8] border-r border-black/[0.06] shadow-[20px_0_50px_rgb(0_0_0/0.1)] z-[150] flex flex-col transform-gpu will-change-transform"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-black/[0.06] flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tighter text-[#1D1D1F]">סל הקניות שלך</h2>
                            <button
                                onClick={onClose}
                                className="p-3 -m-3 text-[#AEAEB2] hover:text-[#1D1D1F] hover:rotate-90 active:scale-[0.9] transition-all focus:outline-none flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                                aria-label="סגור חלונית עגלה"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Items List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence>
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                        className="flex gap-4 bg-white/70 border border-black/[0.05] shadow-sm rounded-2xl p-4 mb-3"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0 overflow-hidden">
                                            <img
                                                onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Crect width='100%25' height='100%25' fill='%23F5F5F7'/%3E%3C/svg%3E"; }}
                                                src={item.image || item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex flex-col flex-1 justify-between py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-[14px] font-bold text-[#1D1D1F] leading-tight line-clamp-2">
                                                    {item.title || item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#AEAEB2] hover:text-[#FF3B30] active:scale-90 transition-all cursor-pointer rounded-full hover:bg-red-50 -mr-2"
                                                    aria-label="הסר פריט"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                {/* Qty Toggle */}
                                                <div className="flex items-center bg-[#F5F5F7] rounded-lg text-[13px] font-bold text-[#1D1D1F]">
                                                    <motion.button
                                                        onClick={() => decreaseQuantity(item.id)}
                                                        whileTap={{ scale: 0.8 }}
                                                        className="w-9 h-9 flex items-center justify-center hover:text-[#007AFF] cursor-pointer text-lg"
                                                    >
                                                        -
                                                    </motion.button>
                                                    <span className="w-6 text-center">{item.qty}</span>
                                                    <motion.button
                                                        onClick={() => increaseQuantity(item.id)}
                                                        whileTap={{ scale: 0.8 }}
                                                        className="w-9 h-9 flex items-center justify-center hover:text-[#007AFF] cursor-pointer"
                                                    >
                                                        +
                                                    </motion.button>
                                                </div>
                                                <div className="font-black tracking-tighter text-[#1D1D1F] text-lg">{item.price}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t border-black/[0.06] bg-white/60">
                            <div className="flex justify-between items-center mb-5">
                                <span className="text-[#86868B] font-medium text-[14px]">סה״כ ביניים</span>
                                <span className="text-2xl font-black tracking-tighter text-[#1D1D1F]">
                                    &#8362;{subtotal.toLocaleString()}
                                </span>
                            </div>

                            <Link to="/checkout" onClick={onClose} className="w-full block">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-[15px] shadow-[0_8px_24px_rgb(0_122_255/0.3)] hover:shadow-[0_12px_32px_rgb(0_122_255/0.4)] transition-all min-h-[52px]"
                                >
                                    המשך לקופה
                                </motion.button>
                            </Link>
                            <p className="mt-3 text-center text-[11px] text-[#AEAEB2] font-medium">
                                נחזור אליך עם הצעת מחיר בהקדם
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
