import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';

const CleanInput = ({ label, id, type = "text", placeholder = "" }) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={id} className="text-sm font-bold text-[#1D1D1F] pr-1">{label}</label>
        <input
            id={id}
            type={type}
            placeholder={placeholder}
            className="bg-[#F5F5F7] border border-transparent focus:border-[#007AFF] focus:bg-white rounded-xl p-4 w-full outline-none transition-all text-[#1D1D1F] font-medium placeholder-gray-400"
        />
    </div>
);

const PaymentOption = ({ id, current, onChange, title, icon, children }) => {
    const isSelected = current === id;
    return (
        <div className={`border-2 rounded-2xl overflow-hidden transition-apple-fluid ${isSelected ? 'border-[#007AFF] bg-white shadow-sm' : 'border-gray-100 bg-[#F5F5F7] hover:border-gray-200 cursor-pointer'}`}>
            <div className="flex items-center gap-4 p-5 cursor-pointer select-none" onClick={() => onChange(id)}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={`font-bold text-lg ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>{title}</span>
                {icon && <span className="mr-auto text-2xl">{icon}</span>}
            </div>
            <AnimatePresence>
                {isSelected && children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 border-t border-gray-100/50">
                            <div className="pt-4">{children}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
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

    const deliveryCost = subtotal > 0 ? 0 : 0; // Free delivery assumption
    const total = subtotal + deliveryCost;
    const formatPrice = (n) => `₪${n.toLocaleString('he-IL')}`;

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 w-full">
                {/* Gestalt Container Layout */}
                <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4 lg:mt-12">

                    {/* Header spanning exactly the layout */}
                    <div className="lg:col-span-12 mb-4">
                        <Link to="/cart" className="text-sm font-bold text-gray-400 hover:text-[#007AFF] transition-colors mb-4 inline-block">
                            ← חזור לעגלה
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tighter leading-tight">
                            תשלום מאובטח
                        </h1>
                    </div>

                    {/* RIGHT COLUMN (RTL Start) - Form Collection */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-7 flex flex-col gap-12"
                    >
                        {/* Step 1: Shipping Details */}
                        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-[#1D1D1F] mb-6 tracking-tighter">1. פרטי משלוח</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <CleanInput label="שם מלא" id="contactName" placeholder="ישראל ישראלי" />
                                </div>
                                <CleanInput label="דוא״ל לקבלת קבלה" id="email" type="email" placeholder="email@example.com" />
                                <CleanInput label="טלפון ליצירת קשר" id="phone" type="tel" placeholder="050-0000000" />
                                <CleanInput label="עיר" id="city" placeholder="תל אביב" />
                                <CleanInput label="רחוב" id="street" placeholder="אבן גבירול" />
                                <CleanInput label="מספר דירה / כניסה" id="apartment" placeholder="דירה 4, כניסה ב׳" />
                            </div>
                        </section>

                        {/* Step 2: Payment Methods */}
                        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-[#1D1D1F] mb-6 tracking-tighter flex items-center justify-between">
                                <span>2. אמצעי תשלום</span>
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </h2>
                            <div className="flex flex-col gap-4">
                                {/* Credit Card */}
                                <PaymentOption id="credit" current={paymentMethod} onChange={setPaymentMethod} title="כרטיס אשראי" icon="💳">
                                    <div className="flex flex-col gap-4">
                                        <div className="relative">
                                            <CleanInput label="מספר כרטיס" id="cc-number" type="text" placeholder="0000 0000 0000 0000" />
                                            <div className="absolute left-4 top-[38px] flex gap-1 opacity-50 pointer-events-none">
                                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4A2 2 0 002 6v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H4v-4h16v4zm0-8H4V6h16v4z" /></svg>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <CleanInput label="תוקף (MM/YY)" id="cc-exp" placeholder="12/26" />
                                            <CleanInput label="קוד אבטחה (CVV)" id="cc-cvv" type="password" placeholder="123" />
                                        </div>
                                    </div>
                                </PaymentOption>

                                {/* Apple Pay */}
                                <PaymentOption id="applepay" current={paymentMethod} onChange={setPaymentMethod} title="Apple Pay" icon="">
                                    <div className="flex justify-center p-4">
                                        <button className="w-full max-w-sm bg-black text-white rounded-xl py-4 flex items-center justify-center hover:bg-gray-900 transition-colors">
                                            <svg className="w-16 h-8" viewBox="0 0 100 40" fill="white">
                                                <path d="M38.5 24.1c0-5.4 4.4-8 4.6-8.1-2.5-3.6-6.4-4.1-7.8-4.2-3.3-.3-6.5 2-8.2 2-1.7 0-4.3-1.9-7-1.9-3.6 0-6.9 2.1-8.7 5.3-3.7 6.4-.9 15.9 2.7 21 1.7 2.5 3.8 5.3 6.5 5.2 2.6-.1 3.6-1.7 6.8-1.7 3.1 0 4.1 1.7 6.8 1.6 2.8-.1 4.6-2.6 6.3-5 2-2.9 2.8-5.8 2.8-5.9-.1-.1-4.8-1.8-4.8-8.3zm-3.6-11c1.5-1.8 2.5-4.3 2.2-6.8-2.1.1-4.8 1.4-6.3 3.3-1.4 1.6-2.6 4.2-2.2 6.6 2.4.2 4.9-1.3 6.3-3.1z" />
                                                <text x="45" y="28" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="24" fontWeight="600">Pay</text>
                                            </svg>
                                        </button>
                                    </div>
                                </PaymentOption>

                                {/* Bank Transfer */}
                                <PaymentOption id="bank" current={paymentMethod} onChange={setPaymentMethod} title="העברה בנקאית" icon="🏦">
                                    <div className="bg-[#F5F5F7] p-5 rounded-xl border border-gray-200">
                                        <p className="text-[#1D1D1F] text-sm mb-4 font-normal">
                                            נא לבצע העברה לחשבון הבא. ההזמנה תטופל מיד לאחר אישור ההעברה במערכת.
                                        </p>
                                        <div className="flex flex-col gap-2 text-sm font-bold text-[#1D1D1F]">
                                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                                <span className="text-gray-500">שם מוטב</span>
                                                <span>נקסטקלאס בע״מ</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                                <span className="text-gray-500">בנק</span>
                                                <span>הפועלים (12)</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                                <span className="text-gray-500">סניף</span>
                                                <span>123</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">מספר חשבון</span>
                                                <span>123456</span>
                                            </div>
                                        </div>
                                    </div>
                                </PaymentOption>
                            </div>
                        </section>
                    </motion.div>

                    {/* LEFT COLUMN (RTL End) - Sticky Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-5"
                    >
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl lg:sticky lg:top-32 border border-gray-100 flex flex-col h-[calc(100vh-160px)] max-h-[800px]">
                            <h3 className="text-2xl font-black text-[#1D1D1F] mb-6 tracking-tighter">סיכום הזמנה</h3>

                            {/* Cart Items Scrollable Area */}
                            <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-6">
                                {cartItems.length === 0 ? (
                                    <div className="text-center text-gray-400 py-10">
                                        <span className="block text-4xl mb-2">🛒</span>
                                        העגלה שלך ריקה
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-5">
                                        {cartItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 rounded-xl bg-[#F5F5F7]">
                                                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-gray-100 p-1">
                                                    <img src={item.imageUrl || item.image} alt={item.title} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }} />
                                                </div>
                                                <div className="flex flex-col flex-1 justify-center">
                                                    <span className="font-bold text-[#1D1D1F] leading-tight text-sm line-clamp-2 pr-1">{item.title}</span>
                                                    <div className="flex justify-between items-end mt-2">
                                                        <span className="text-xs font-bold text-gray-500 pr-1">כמות: {item.qty}</span>
                                                        <span className="font-black text-[#1D1D1F] text-sm tracking-tighter">{formatPrice(parsePrice(item.price || item.unitPrice) * item.qty)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Totals Section */}
                            <div className="border-t border-gray-100 pt-6 mt-auto">
                                <div className="space-y-4 text-sm font-medium mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">סה״כ מוצרים</span>
                                        <span className="font-bold text-[#1D1D1F]">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">עלות משלוח</span>
                                        <span className="font-bold text-[#007AFF]">
                                            {deliveryCost === 0 ? 'חינם' : formatPrice(deliveryCost)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-xl font-bold text-[#1D1D1F]">סה״כ לתשלום</span>
                                    <span className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tighter">{formatPrice(total)}</span>
                                </div>

                                <button
                                    onClick={() => alert("Redirecting to secure payment gateway...")}
                                    disabled={cartItems.length === 0}
                                    className="bg-[#1D1D1F] text-white hover:bg-black w-full rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-2 transition-apple-fluid active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    בצע תשלום מאובטח
                                </button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
