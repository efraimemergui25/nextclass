import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';

const FloatingInput = ({ label, type = "text", id, placeholder }) => (
    <div className="relative w-full">
        <input
            type={type}
            id={id}
            placeholder={placeholder || " "}
            className="peer w-full bg-[#F5F5F7] border border-transparent focus:border-[#007AFF] focus:bg-white rounded-xl px-5 py-4 text-[#1D1D1F] font-semibold text-lg transition-apple-fluid shadow-sm outline-none"
        />
        <label
            htmlFor={id}
            className="absolute right-5 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-medium peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-[#007AFF] pointer-events-none"
        >
            {label}
        </label>
    </div>
);

const PaymentMethodCard = ({ id, title, icon, isSelected, onClick, children }) => (
    <div className="flex flex-col gap-4">
        <button
            onClick={() => onClick(id)}
            className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-apple-fluid transform-gpu ${isSelected
                    ? 'border-[#007AFF] bg-white shadow-lg shadow-blue-500/5'
                    : 'border-transparent bg-[#F5F5F7] hover:bg-white hover:border-gray-200'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <span className={`font-bold text-lg ${isSelected ? 'text-[#1D1D1F]' : 'text-gray-500'}`}>{title}</span>
            </div>
            <div className="text-2xl grayscale brightness-125 group-hover:grayscale-0 transition-apple-fluid">{icon}</div>
        </button>

        <AnimatePresence>
            {isSelected && children && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-inner mt-1">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { cartItems } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('credit');

    useEffect(() => {
        window.scrollTo(0, 0);
        if (cartItems.length === 0) {
            // Optional: navigate back if cart is empty
            // navigate('/catalog');
        }
    }, [cartItems, navigate]);

    const subtotal = cartItems.reduce((acc, item) => {
        const price = typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) || 0 : item.price;
        return acc + (price * (item.qty || 1));
    }, 0);

    const shipping = 0; // Free shipping
    const total = subtotal + shipping;

    const parsePrice = (price) => {
        const num = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) || 0 : price;
        return `₪${num.toLocaleString()}`;
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-24 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">

                    {/* Header Section */}
                    <div className="mb-12 flex flex-col items-center text-center">
                        <Link to="/" className="text-sm font-bold text-gray-400 hover:text-[#007AFF] transition-apple-fluid mb-4">חזרה לחנות</Link>
                        <h1 className="text-4xl md:text-5xl font-black text-[#1D1D1F] tracking-tighter">קופה ותשלום</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                        {/* RIGHT COLUMN: Forms (col-span-12 on mobile, col-span-7 on desktop) */}
                        <div className="lg:col-span-7 flex flex-col gap-10">

                            {/* Shipping Information */}
                            <section className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-[#007AFF]/10 rounded-full flex items-center justify-center text-[#007AFF]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">פרטי משלוח</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <FloatingInput label="שם מלא" id="full-name" />
                                    </div>
                                    <FloatingInput label="דוא״ל" id="email" type="email" />
                                    <FloatingInput label="טלפון" id="phone" type="tel" />
                                    <FloatingInput label="עיר" id="city" />
                                    <FloatingInput label="רחוב" id="street" />
                                    <div className="md:col-span-2">
                                        <FloatingInput label="דירה / קומה / הערות" id="apartment" />
                                    </div>
                                </div>
                            </section>

                            {/* Payment Method */}
                            <section className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 bg-[#007AFF]/10 rounded-full flex items-center justify-center text-[#007AFF]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight">אמצעי תשלום</h2>
                                </div>

                                <div className="space-y-4">
                                    <PaymentMethodCard
                                        id="credit"
                                        title="כרטיס אשראי"
                                        icon="💳"
                                        isSelected={paymentMethod === 'credit'}
                                        onClick={setPaymentMethod}
                                    >
                                        <div className="space-y-4">
                                            <FloatingInput label="מספר כרטיס" id="card-num" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FloatingInput label="תוקף (MM/YY)" id="expiry" />
                                                <FloatingInput label="CVV" id="cvv" />
                                            </div>
                                        </div>
                                    </PaymentMethodCard>

                                    <PaymentMethodCard
                                        id="apple"
                                        title="Apple Pay"
                                        icon=" Pay"
                                        isSelected={paymentMethod === 'apple'}
                                        onClick={setPaymentMethod}
                                    >
                                        <button className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all font-bold">
                                            <span>Pay with</span>
                                            <span className="text-xl"> Pay</span>
                                        </button>
                                    </PaymentMethodCard>

                                    <PaymentMethodCard
                                        id="bank"
                                        title="העברה בנקאית"
                                        icon="🏦"
                                        isSelected={paymentMethod === 'bank'}
                                        onClick={setPaymentMethod}
                                    >
                                        <div className="bg-[#F5F5F7] p-4 rounded-xl text-sm leading-relaxed text-[#1D1D1F]">
                                            <p className="font-bold mb-2">פרטי בנק להעברה:</p>
                                            <p>בנק הפועלים (12)</p>
                                            <p>סניף: 600</p>
                                            <p>חשבון: 123456</p>
                                            <p className="mt-2 text-gray-500 italic">שים לב: ההזמנה תטופל לאחר קבלת האישור מהבנק.</p>
                                        </div>
                                    </PaymentMethodCard>
                                </div>
                            </section>
                        </div>

                        {/* LEFT COLUMN: Summary (Sticky Sidebar) */}
                        <div className="lg:col-span-5 lg:sticky lg:top-32">
                            <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl overflow-hidden relative">
                                <h3 className="text-2xl font-black text-[#1D1D1F] mb-8 tracking-tight">סיכום הזמנה</h3>

                                <div className="max-h-[300px] overflow-y-auto mb-8 pr-2 space-y-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4 items-start">
                                            <div className="w-16 h-16 bg-[#F5F5F7] rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                                <img onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }} src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <span className="font-bold text-[#1D1D1F] leading-tight line-clamp-2">{item.title}</span>
                                                <span className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">כמות: {item.qty}</span>
                                            </div>
                                            <span className="font-black text-[#1D1D1F] whitespace-nowrap">{parsePrice(item.price)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-100 pt-6 space-y-4">
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>סה״כ ביניים</span>
                                        <span>₪{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500 font-medium">
                                        <span>משלוח</span>
                                        <span className="text-green-500 font-bold">חינם</span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-6 mt-2 flex justify-between items-end">
                                        <span className="text-xl font-bold text-[#1D1D1F]">סה״כ לתשלום</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-4xl font-black text-[#007AFF] tracking-tighter">₪{total.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">כולל מע״מ</span>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#1D1D1F] text-white py-5 rounded-2xl font-bold text-lg mt-10 hover:bg-black shadow-2xl shadow-black/10 flex items-center justify-center gap-3 transition-apple-fluid"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>בצע תשלום מאובטח</span>
                                </motion.button>

                                <div className="mt-8 flex justify-center items-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-apple-fluid">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                    <span className="text-xs font-black tracking-tighter"> Pay</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
