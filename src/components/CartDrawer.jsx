import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

    // Calculate total price accurately. Assuming `price` or `unitPrice` strings exist or we parse them. 
    // To be robust, we'll strip non-digits if necessary, though best practice is to store raw numbers in Context.
    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        return parseInt(priceStr.toString().replace(/[^\d]/g, ''), 10);
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const itemPrice = parsePrice(item.price || item.unitPrice || "0");
        return acc + (itemPrice * item.qty);
    }, 0);

    // Slide-in from LEFT Animation (RTL opposite side)
    const drawerVariants = {
        closed: { x: "-100%", transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } },
        open: { x: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }
    };

    const overlayVariants = {
        closed: { opacity: 0, transition: { duration: 0.3 } },
        open: { opacity: 1, transition: { duration: 0.3 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={overlayVariants}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140]"
                        aria-hidden="true"
                    />

                    {/* Drawer from LEFT */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-white/50 backdrop-blur-3xl backdrop-saturate-[1.5] border-l border-white/50 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[150] flex flex-col transition-apple-fluid"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tighter text-[#1D1D1F]">סל הקניות שלך</h2>
                            <button
                                onClick={onClose}
                                className="p-3 -m-3 text-gray-400 hover:text-[#1D1D1F] hover:rotate-90 active:scale-[0.9] transition-apple-fluid focus:outline-none flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                                aria-label="סגור חלונית עגלה"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                                        className="flex gap-4 bg-[#F5F5F7] rounded-2xl p-4 mb-4"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                            <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }} src={item.imageUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex flex-col flex-1 justify-between py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-base font-bold text-[#1D1D1F] leading-tight line-clamp-2">
                                                    {item.title || item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                                    aria-label="Remove item"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-end mt-2">
                                                {/* Qty Toggle */}
                                                <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-lg px-2 text-sm font-bold text-[#1D1D1F]">
                                                    <motion.button
                                                        onClick={() => decreaseQuantity(item.id)}
                                                        whileTap={{ scale: 0.8 }}
                                                        className="p-1 hover:text-[#007AFF] cursor-pointer"
                                                    >
                                                        -
                                                    </motion.button>
                                                    <span>{item.qty}</span>
                                                    <motion.button
                                                        onClick={() => increaseQuantity(item.id)}
                                                        whileTap={{ scale: 0.8 }}
                                                        className="p-3 hover:text-[#007AFF] cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                    >
                                                        +
                                                    </motion.button>
                                                </div>
                                                <div className="font-black tracking-tighter text-[#1D1D1F] text-xl">{item.price}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t border-white/50 glass-light">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500 font-medium tracking-wide">סה״כ ביניים</span>
                                <span className="text-2xl font-black tracking-tighter text-[#1D1D1F]">₪{subtotal.toLocaleString()}</span>
                            </div>

                            <Link to="/checkout" onClick={onClose} className="w-full block">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-semibold tracking-wide text-base hover:bg-blue-600 shadow-[0_8px_20px_rgba(0,122,255,0.2)] transition-all"
                                >
                                    מעבר לתשלום מאובטח
                                </motion.button>
                            </Link>

                            {/* B2C Trust Badges */}
                            <div className="flex items-center justify-center gap-4 mt-6 opacity-30 grayscale">
                                <svg className="w-8 h-8" viewBox="0 0 38 24" fill="none">
                                    <rect width="38" height="24" rx="4" fill="#1D1D1F" />
                                    <path d="M14 12V10H16V12H14ZM18 12V10H20V12H18ZM14 16V14H20V16H14Z" fill="white" />
                                </svg>
                                <svg className="w-8 h-8" viewBox="0 0 38 24" fill="none">
                                    <rect width="38" height="24" rx="4" fill="#007AFF" />
                                    <circle cx="14" cy="12" r="5" fill="white" fillOpacity="0.8" />
                                    <circle cx="24" cy="12" r="5" fill="white" fillOpacity="0.8" />
                                </svg>
                                <svg className="w-8 h-8" viewBox="0 0 38 24" fill="none">
                                    <rect width="38" height="24" rx="4" fill="#1D1D1F" />
                                    <text x="50%" y="65%" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Pay</text>
                                </svg>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
