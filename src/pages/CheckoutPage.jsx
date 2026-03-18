import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';

const HyperGlassInput = ({ placeholder, type = "text", id }) => (
    <input
        id={id}
        type={type}
        placeholder={placeholder}
        className="w-full bg-white/50 border border-white/80 focus:border-[#007AFF] focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl px-5 py-4 text-[#1D1D1F] transition-all outline-none placeholder-gray-400"
    />
);

const PaymentButton = ({ id, current, onChange, title, icon }) => {
    const isSelected = current === id;
    return (
        <button
            onClick={() => onChange(id)}
            className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl transition-all flex-1 min-w-[100px] ${isSelected
                ? 'ring-2 ring-[#007AFF] bg-white border-transparent shadow-sm'
                : 'bg-white/40 border border-gray-200 hover:bg-white/60'
                }`}
        >
            <span className="text-3xl lg:text-4xl">{icon}</span>
            <span className={`font-bold text-sm leading-tight text-center ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>
                {title}
            </span>
        </button>
    );
};

const CheckoutPage = () => {
    const { cartItems } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('credit');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        return parseInt(priceStr.toString().replace(/[^\d]/g, ''), 10);
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const itemPrice = parsePrice(item.price || item.unitPrice || "0");
        return acc + (itemPrice * item.qty);
    }, 0);

    const deliveryCost = subtotal > 0 ? 0 : 0; // Free delivery
    const total = subtotal + deliveryCost;
    const formatPrice = (n) => `₪${n.toLocaleString('he-IL')}`;

    const GLASS_PANEL = "bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 shadow-2xl rounded-[2rem] p-8";

    return (
        <PageTransition>
            <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">

                {/* Header Top */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 pl-2">
                    <Link to="/cart" className="text-sm font-bold text-gray-500 hover:text-[#007AFF] transition-colors mb-4 inline-block">
                        ← חזור לעגלה
                    </Link>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1D1D1F] tracking-tighter">
                        תשלום מאובטח
                    </h1>
                </motion.div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* RIGHT COLUMN (Forms) */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col gap-10">

                        {/* Shipping Details */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={GLASS_PANEL}
                        >
                            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">פרטי משלוח</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <HyperGlassInput placeholder="שם פרטי" id="firstName" />
                                <HyperGlassInput placeholder="שם משפחה" id="lastName" />
                                <div className="md:col-span-2">
                                    <HyperGlassInput placeholder="עיר" id="city" />
                                </div>
                                <div className="md:col-span-2">
                                    <HyperGlassInput placeholder="רחוב ומספר בית" id="street" />
                                </div>
                                <HyperGlassInput placeholder="טלפון נייד" id="phone" type="tel" />
                                <HyperGlassInput placeholder="דוא״ל לקבלת חשבונית" id="email" type="email" />
                            </div>
                        </motion.section>

                        {/* Payment Selection */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={GLASS_PANEL}
                        >
                            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">אמצעי תשלום</h2>

                            <div className="flex flex-row justify-between lg:justify-start gap-4 mb-8">
                                <PaymentButton id="applepay" current={paymentMethod} onChange={setPaymentMethod} title="Apple Pay" icon="" />
                                <PaymentButton id="credit" current={paymentMethod} onChange={setPaymentMethod} title="כרטיס אשראי" icon="💳" />
                                <PaymentButton id="googlepay" current={paymentMethod} onChange={setPaymentMethod} title="Google Pay" icon="G" />
                            </div>

                            <AnimatePresence mode="sync">
                                {paymentMethod === 'credit' && (
                                    <motion.div
                                        key="credit-form"
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-4 border-t border-gray-200/50 pt-6">
                                            <HyperGlassInput placeholder="מספר כרטיס (0000 0000 0000 0000)" id="ccNumber" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <HyperGlassInput placeholder="תוקף (MM/YY)" id="ccExp" />
                                                <HyperGlassInput placeholder="CVV (3 ספרות בגב הכרטיס)" id="ccCvv" type="password" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.section>

                    </div>

                    {/* LEFT COLUMN (Summary) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-12 lg:col-span-5 lg:sticky lg:top-32"
                    >
                        <div className={`${GLASS_PANEL} flex flex-col`}>
                            <h3 className="text-2xl font-bold text-[#1D1D1F] mb-6">סיכום הזמנה</h3>

                            {/* Cart List */}
                            <div className="flex flex-col gap-5 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                                {cartItems.length === 0 ? (
                                    <div className="text-gray-400 text-center py-6">העגלה ריקה</div>
                                ) : (
                                    cartItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 border border-gray-100 p-1">
                                                <img src={item.imageUrl || item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }} />
                                            </div>
                                            <div className="flex flex-col flex-1 pl-2">
                                                <span className="font-bold text-[#1D1D1F] text-sm leading-tight line-clamp-2 mb-1">{item.title}</span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 font-bold">כמות: {item.qty}</span>
                                                    <span className="font-black text-[#1D1D1F]">{formatPrice(parsePrice(item.price || item.unitPrice) * item.qty)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-200/50 pt-6 space-y-4 font-medium mb-8">
                                <div className="flex justify-between text-gray-600">
                                    <span>סה״כ מוצרים</span>
                                    <span className="font-bold text-[#1D1D1F]">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>עלות משלוח</span>
                                    <span className="font-bold text-[#007AFF]">{deliveryCost === 0 ? 'חינם' : formatPrice(deliveryCost)}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-200/50 pt-6">
                                <span className="text-xl font-bold text-[#1D1D1F]">סה״כ לתשלום</span>
                                <span className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tighter">{formatPrice(total)}</span>
                            </div>

                            {/* Final CTA */}
                            <button
                                disabled={cartItems.length === 0}
                                className="w-full bg-[#1D1D1F] text-white hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-[2rem] py-5 text-lg font-bold flex items-center justify-center gap-3 mt-8 shadow-xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
                            >
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                {`שלם עכשיו ${formatPrice(total)}`}
                            </button>

                            <p className="text-center text-xs text-gray-400 mt-6 tracking-widest uppercase font-bold">
                                תשלום מאובטח בטכנולוגיית SSL
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
