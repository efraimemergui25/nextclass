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
            className="peer w-full bg-white border-2 border-transparent focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl px-5 py-4 text-[#1D1D1F] font-bold text-lg transition-all shadow-sm outline-none placeholder-transparent"
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
        className={`w-full text-right p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-5 ${isSelected
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
                        <h1 className="text-4xl md:text-6xl font-black text-[#1D1D1F] tracking-tight">
                            קופה מוסדית
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
                            {/* Section 1: Institution Details */}
                            <section>
                                <h2 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-tight">פרטי המוסד</h2>
                                <p className="text-gray-500 font-medium mb-8">פרטי בית הספר או המוסד לצורך הפקת חשבונית ומשלוח.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FloatingInput label="שם המוסד / בית ספר" id="schoolName" />
                                    <FloatingInput label="שם איש קשר" id="contactName" />
                                    <FloatingInput label="טלפון" id="phone" type="tel" />
                                    <FloatingInput label="דוא״ל" id="email" type="email" />
                                </div>
                            </section>

                            {/* Section 2: Delivery & Installation */}
                            <section>
                                <h2 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-tight">אפשרויות אספקה</h2>
                                <p className="text-gray-500 font-medium mb-8">בחרו את אופן ההובלה וההתקנה המועדף עליכם למרחבי הלמידה.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectableCard
                                        title="משלוח רגיל (חינם)"
                                        subtitle="הורדת ציוד בחצר המוסד. עד 5–7 ימי עסקים."
                                        isSelected={deliveryOption === 'free'}
                                        onClick={() => setDeliveryOption('free')}
                                        icon="🚚"
                                    />
                                    <SelectableCard
                                        title="הובלה, התקנה פיזית והדרכה (₪850)"
                                        subtitle="טכנאי מוסמך מתקין את המסכים בכיתות ומדריך את צוות ההוראה שעה."
                                        isSelected={deliveryOption === 'premium'}
                                        onClick={() => setDeliveryOption('premium')}
                                        icon="🛠️"
                                    />
                                </div>
                            </section>

                            {/* Section 3: Payment Method */}
                            <section>
                                <h2 className="text-2xl font-black text-[#1D1D1F] mb-2 tracking-tight">אמצעי תשלום מוסדי</h2>
                                <p className="text-gray-500 font-medium mb-8">איך נסגור חשבון? בחר את השיטה המתאימה לגזברות שלכם.</p>
                                <div className="grid grid-cols-1 gap-6">
                                    <SelectableCard
                                        title="הזמנת רכש (PO) ממשרד החינוך / עירייה"
                                        subtitle="שלחו מספר הזמנת רכש מאושרת לחשבות ונפיק חשבונית לתשלום מול כתב ההתחייבות."
                                        isSelected={paymentMethod === 'po'}
                                        onClick={() => setPaymentMethod('po')}
                                        icon="📋"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SelectableCard
                                            title="כרטיס אשראי מוסדי"
                                            subtitle="חיוב מיידי פשוט ומאובטח."
                                            isSelected={paymentMethod === 'credit'}
                                            onClick={() => setPaymentMethod('credit')}
                                            icon="💳"
                                        />
                                        <SelectableCard
                                            title="העברה בנקאית"
                                            subtitle="קבלו פרטי בנק להעברת הכספים ישירות."
                                            isSelected={paymentMethod === 'bank'}
                                            onClick={() => setPaymentMethod('bank')}
                                            icon="🏦"
                                        />
                                    </div>
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
                                <h3 className="text-2xl font-black text-[#1D1D1F] mb-8 tracking-tight">סיכום הזמנה מוסדית</h3>

                                {/* Items */}
                                <div className="flex flex-col gap-6 mb-8">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1D1D1F] leading-snug pr-2 text-base">{item.title}</span>
                                                <span className="text-sm font-semibold text-gray-400 mt-1 pr-2">כמות: {item.qty}</span>
                                            </div>
                                            <span className="font-black text-[#1D1D1F] whitespace-nowrap text-lg">
                                                {formatPrice(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-100 pt-6 space-y-4 text-sm font-medium">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">סה״כ רחף (לפני מע״מ)</span>
                                        <span className="font-bold text-[#1D1D1F]">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">שיטת הובלה: {deliveryOption === 'premium' ? 'התקנה פיזית' : 'רגיל'}</span>
                                        <span className="font-bold text-[#1D1D1F]">
                                            {deliveryCost === 0 ? 'חינם' : formatPrice(deliveryCost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">מע״מ כחוק (17%)</span>
                                        <span className="font-bold text-[#1D1D1F]">{formatPrice(vat)}</span>
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex justify-between items-end mb-8">
                                        <span className="text-xl font-bold text-[#1D1D1F] mb-1">סה״כ לתשלום</span>
                                        <span className="text-4xl font-black text-[#1D1D1F] tracking-tighter">{formatPrice(total)}</span>
                                    </div>

                                    <button
                                        className="w-full bg-[#007AFF] text-white py-5 rounded-2xl font-black text-xl hover:-translate-y-1 shadow-[0_10px_20px_rgba(0,122,255,0.2)] hover:shadow-[0_15px_30px_rgba(0,122,255,0.4)] transition-all duration-300 focus:outline-none"
                                    >
                                        אשר הזמנת רכש
                                    </button>

                                    <p className="text-center text-xs font-bold text-gray-400 mt-6 tracking-wide">
                                        מוכר רשמי משרד החינוך | כולל מע״מ | תמיכה 24/7
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
