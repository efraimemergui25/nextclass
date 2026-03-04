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
        closed: { x: "-100%", transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 } },
        open: { x: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.5 } }
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
                        className="fixed inset-0 bg-[#1D1D1F]/40 backdrop-blur-sm z-[60]"
                        aria-hidden="true"
                    />

                    {/* Drawer from LEFT */}
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={drawerVariants}
                        className="fixed inset-y-0 left-0 w-full md:w-[450px] bg-white shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-brand-dark">סל הרכש שלך</h2>
                            <button
                                onClick={onClose}
                                className="p-2 -m-2 text-gray-400 hover:text-brand-dark transition-colors focus:outline-none"
                                aria-label="סגור חלונית עגלה"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-brand-light flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 justify-between py-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-brand-dark text-sm md:text-base leading-tight">
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
                                            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 text-sm font-bold text-brand-dark">
                                                <motion.button whileTap={{ scale: 0.8 }} className="p-1 hover:text-brand-blue">-</motion.button>
                                                <span>{item.qty}</span>
                                                <motion.button whileTap={{ scale: 0.8 }} className="p-1 hover:text-brand-blue">+</motion.button>
                                            </div>
                                            <div className="font-bold text-brand-dark">{item.price}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-500 font-medium">סה״כ ביניים</span>
                                <span className="text-2xl font-black text-brand-dark">₪22,700</span>
                            </div>

                            <Link to="/checkout" onClick={onClose} className="w-full block">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-brand-dark text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-colors"
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
