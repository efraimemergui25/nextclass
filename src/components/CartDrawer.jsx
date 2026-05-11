import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CreditCard } from 'lucide-react';

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
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-white/50 backdrop-blur-3xl backdrop-saturate-[1.5] border-l border-white/50 shadow-[-20px_0_50px_rgb(0_0_0/0.1)] z-[150] flex flex-col transform-gpu will-change-transform"
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
                                        className="flex gap-4 bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-2xl p-4 mb-4"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                            <img
                                                onError={(e) => {
                                                    if (!e.target.dataset.triedFallback) {
                                                        e.target.dataset.triedFallback = 'true';
                                                        e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";
                                                    } else {
                                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";
                                                    }
                                                }}
                                                src={item.image || item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover mix-blend-multiply"
                                            />
                                        </div>

                                        {/* Info */}
                                        <div className="flex flex-col flex-1 justify-between py-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-base font-bold text-[#1D1D1F] leading-tight line-clamp-2">
                                                    {item.title || item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-90 transition-all cursor-pointer rounded-full hover:bg-red-50 -mr-2"
                                                    aria-label="הסר פריט"
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
                                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-[#007AFF] cursor-pointer text-lg font-bold"
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
                                    className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold tracking-wide text-base hover:bg-blue-600 shadow-[0_8px_24px_rgb(0_122_255/0.3)] hover:shadow-[0_12px_32px_rgb(0_122_255/0.4)] transition-all min-h-[52px]"
                                >
                                    מעבר לתשלום מאובטח
                                </motion.button>
                            </Link>

                            {/* CSS-Based Payment Badges (Crash-Proof) */}
                            <div className="mt-8">
                                <p className="text-center text-[10px] font-bold text-[#1D1D1F]/40 mb-4 tracking-widest uppercase">
                                    תשלום מאובטח באמצעות:
                                </p>
                                <div className="flex flex-wrap justify-center gap-3 opacity-70 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    {/* Apple Pay */}
                                    <div className="bg-black text-white px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 font-semibold text-sm shadow-sm">
                                        <span className="text-lg"></span> Pay
                                    </div>

                                    {/* Bit */}
                                    <div className="bg-white border border-gray-100 text-[#00B4E6] px-3 py-1.5 rounded-xl flex items-center justify-center font-black text-lg tracking-tighter shadow-sm">
                                        bit
                                    </div>

                                    {/* PayPal */}
                                    <div className="bg-[#00457C] text-white px-3 py-1.5 rounded-xl flex items-center justify-center font-bold italic text-sm shadow-sm">
                                        PayPal
                                    </div>

                                    {/* Credit Card */}
                                    <div className="bg-white border border-gray-100 text-[#1D1D1F] px-3 py-1.5 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-sm shadow-sm">
                                        <CreditCard size={14} />
                                        <span>אשראי</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
