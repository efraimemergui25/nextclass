import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const FloatingInput = ({ label, type = "text", id }) => (
    <div className="relative w-full">
        <input
            type={type}
            id={id}
            placeholder=" "
            className="peer w-full bg-white border-2 border-transparent focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl px-5 py-4 text-[#1D1D1F] font-bold text-lg transition-apple-fluid shadow-sm outline-none placeholder-transparent"
        />
        <label
            htmlFor={id}
            className="absolute right-5 top-2 text-xs font-bold text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-lg peer-placeholder-shown:font-medium peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-[#007AFF]"
        >
            {label}
        </label>
    </div>
);

const SelectableCard = ({ title, subtitle, isSelected, onClick, icon }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full text-right p-6 rounded-3xl border-2 transition-apple-fluid flex items-center gap-5 ${isSelected
            ? 'border-[#007AFF] bg-blue-50/50 shadow-md'
            : 'border-transparent bg-white shadow-sm hover:border-gray-200'
            }`}
    >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#007AFF] bg-[#007AFF]' : 'border-gray-300'
            }`}>
            {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <div className="flex flex-col flex-1">
            <span className={`font-black text-lg ${isSelected ? 'text-[#007AFF]' : 'text-[#1D1D1F]'}`}>{title}</span>
            {subtitle && <span className="text-sm font-medium text-gray-500 mt-1">{subtitle}</span>}
        </div>
        {icon && <span className="text-3xl opacity-80">{icon}</span>}
    </motion.button>
);

const CheckoutPage = () => {
    const [deliveryOption, setDeliveryOption] = useState('free');
    const [paymentMethod, setPaymentMethod] = useState('po');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Dummy cart items
    const orderItems = [
        { title: "מסך מגע אינטראקטיבי Pro 75\"", qty: 2, price: 19000 },
        { title: "לוח חכם סטנדרטי 65\"", qty: 1, price: 3700 },
    ];

    const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
    const deliveryCost = deliveryOption === 'premium' ? 850 : 0;
    const beforeVat = subtotal + deliveryCost;
    const vat = Math.round(beforeVat * 0.17);
    const total = beforeVat + vat;

    const formatPrice = (n) => `₪${n.toLocaleString('he-IL')}`;

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full">
                <div className="max-w-[1400px] mx-auto">

                    {/* Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <Link to="/" className="text-sm font-bold text-gray-400 hover:text-[#007AFF] transition-colors mb-4 inline-block">
                            ← חזור לאתר
                        </Link>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1D1D1F] tracking-tighter leading-[1.1]">
                            קופה
                        </h1>
                    </motion.div>

                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20">

                        {/* RIGHT COLUMN (RTL Start) - Form (Takes 3 of 5 cols) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-3 flex flex-col gap-16"
                        >
                            {/* Section 1: Shipping Details */}
                            <section>
                                <h2 className="text-2xl md:text-3xl font-black text-[#1D1D1F] mb-1 tracking-tighter">פרטי משלוח</h2>
                                <p className="text-gray-500 font-normal leading-relaxed mb-8">לאן נשלח את המוצרים החדשים שלך?</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FloatingInput label="שם מלא" id="contactName" />
                                    <FloatingInput label="כתובת למשלוח" id="address" />
                                    <FloatingInput label="עיר" id="city" />
                                    <FloatingInput label="טלפון ליצירת קשר" id="phone" type="tel" />
                                    <div className="md:col-span-2">
                                        <FloatingInput label="דוא״ל (לקבלת חשבונית)" id="email" type="email" />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Delivery Speed */}
                            <section>
                                <h2 className="text-2xl md:text-3xl font-black text-[#1D1D1F] mb-1 tracking-tighter">שיטת משלוח</h2>
                                <p className="text-gray-500 font-normal leading-relaxed mb-8">בחר את מהירות המשלוח המועדפת עליך.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectableCard
                                        title="משלוח עד הבית (חינם)"
                                        subtitle="עד 5 ימי עסקים לכל חלקי הארץ."
                                        isSelected={deliveryOption === 'free'}
                                        onClick={() => setDeliveryOption('free')}
                                        icon="🏠"
                                    />
                                    <SelectableCard
                                        title="משלוח מהיר מהיום למחר (₪850)"
                                        subtitle="הזמן עכשיו וקבל את המוצר מחר בבוקר."
                                        isSelected={deliveryOption === 'premium'}
                                        onClick={() => setDeliveryOption('premium')}
                                        icon="🚀"
                                    />
                                </div>
                            </section>

                            {/* Section 3: Payment Method */}
                            <section>
                                <h2 className="text-2xl md:text-3xl font-black text-[#1D1D1F] mb-1 tracking-tighter">פרטי תשלום</h2>
                                <p className="text-gray-500 font-normal leading-relaxed mb-8">התשלום מאובטח ומוצפן בתקן המחמיר ביותר.</p>
                                <div className="grid grid-cols-1 gap-6">
                                    <SelectableCard
                                        title="כרטיס אשראי / Digital Wallet"
                                        subtitle="תשלום בטוח ב-Visa, Mastercard, Apple Pay"
                                        isSelected={paymentMethod === 'credit'}
                                        onClick={() => setPaymentMethod('credit')}
                                        icon="💳"
                                    />
                                    <SelectableCard
                                        title="PayPal"
                                        subtitle="שימוש בחשבון ה-PayPal שלך."
                                        isSelected={paymentMethod === 'bank'}
                                        onClick={() => setPaymentMethod('bank')}
                                        icon="🅿️"
                                    />
                                </div>
                            </section>
                        </motion.div>

                        {/* LEFT COLUMN (RTL End) - Order Summary (Takes 2 of 5 cols) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="lg:col-span-2"
                        >
                            <div className="bg-white rounded-3xl p-8 shadow-sm lg:sticky lg:top-32 border border-gray-100">
                                <h3 className="text-2xl font-black text-[#1D1D1F] mb-8 tracking-tight">סיכום הזמנה</h3>

                                {/* Items */}
                                <div className="flex flex-col gap-6 mb-8">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#1D1D1F] leading-snug pr-2 text-base tracking-tighter">{item.title}</span>
                                                <span className="text-sm font-bold text-gray-400 mt-1 pr-2">כמות: {item.qty}</span>
                                            </div>
                                            <span className="font-black text-[#1D1D1F] whitespace-nowrap text-lg tracking-tighter">
                                                {formatPrice(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-100 pt-6 space-y-4 text-sm font-medium">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">סה״כ ביניים</span>
                                        <span className="font-bold text-[#1D1D1F]">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">משלוח</span>
                                        <span className="font-bold text-[#1D1D1F]">
                                            {deliveryCost === 0 ? 'חינם' : formatPrice(deliveryCost)}
                                        </span>
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="text-xl font-bold text-[#1D1D1F] mb-1">סה״כ לתשלום</span>
                                        <span className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tighter">{formatPrice(total)}</span>
                                    </div>

                                    <button
                                        className="w-full bg-[#007AFF] text-white py-5 rounded-2xl font-bold tracking-wide text-xl hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,122,255,0.2)] hover:shadow-[0_15px_30px_rgba(0,122,255,0.4)] transition-apple-fluid focus:outline-none min-h-[56px]"
                                    >
                                        בצע תשלום מאובטח
                                    </button>

                                    <p className="text-center text-xs font-bold text-gray-400 mt-6 tracking-widest uppercase">
                                        תשלום מאובטח SSL | כולל מע״מ | משלוח חינם
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
