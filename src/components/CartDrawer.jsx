import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose }) => {
    // Dummy Data for the Cart Items
    const cartItems = [
        {
            id: "1",
            title: "מסך מגע אינטראקטיבי Pro 75\"",
            qty: 2,
            price: "₪19,000",
            unitPrice: "₪9,500",
            imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=200"
        },
        {
            id: "2",
            title: "לוח חכם סטנדרטי 65\"",
            qty: 1,
            price: "₪3,700",
            unitPrice: "₪3,700",
            imageUrl: "https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=200"
        }
    ];

    // Slide-in from LEFT Animation (RTL opposite side)
    const drawerVariants = {
        closed: { x: "-100%", transition: { type: "spring", stiffness: 250, damping: 25 } },
        open: { x: 0, transition: { type: "spring", stiffness: 250, damping: 25 } }
    };

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 }
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
                        aria-hidden="true"
                    />

                    {/* Drawer from LEFT */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={drawerVariants}
                        className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-white/85 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[80] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100/50 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-[#1D1D1F]">סל הרכש שלך</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-400 hover:text-[#1D1D1F] hover:rotate-90 active:scale-[0.9] transition-all duration-300 focus:outline-none"
                                aria-label="סגור חלונית עגלה"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Items List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 bg-[#F5F5F7] rounded-2xl p-4 mb-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 justify-between py-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-[#1D1D1F] text-sm md:text-base leading-tight">
                                                {item.title}
                                            </h3>
                                            <button className="text-gray-400 hover:text-red-500 transition-colors">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-end mt-2">
                                            {/* Qty Toggle */}
                                            <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-lg px-2 text-sm font-bold text-[#1D1D1F]">
                                                <motion.button whileTap={{ scale: 0.8 }} className="p-1 hover:text-[#007AFF]">-</motion.button>
                                                <span>{item.qty}</span>
                                                <motion.button whileTap={{ scale: 0.8 }} className="p-1 hover:text-[#007AFF]">+</motion.button>
                                            </div>
                                            <div className="font-black text-[#1D1D1F] text-lg">{item.price}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t border-white/50 bg-white/50 backdrop-blur-md">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500 font-medium">סה״כ ביניים</span>
                                <span className="text-3xl font-black text-[#1D1D1F]">₪22,700</span>
                            </div>

                            <Link to="/checkout" onClick={onClose} className="w-full block">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-black text-xl hover:bg-blue-600 shadow-[0_8px_20px_rgba(0,122,255,0.2)] transition-all"
                                >
                                    מעבר לקופה מוסדית
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
