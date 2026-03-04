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
            className="peer w-full bg-white border-2 border-gray-200 rounded-2xl px-5 pt-6 pb-2 text-brand-dark font-medium text-base outline-none focus:border-brand-blue transition-colors placeholder-transparent"
        />
        <label
            htmlFor={id}
            className="absolute right-5 top-2 text-xs font-bold text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-brand-blue"
        >
            {label}
        </label>
    </div>
);

const SelectableCard = ({ title, subtitle, isSelected, onClick, icon }) => (
    <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={`w-full text-right p-5 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${isSelected
                ? 'border-brand-blue bg-brand-blue/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
    >
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-brand-blue' : 'border-gray-300'
            }`}>
            {isSelected && <div className="w-3 h-3 bg-brand-blue rounded-full" />}
        </div>
        <div className="flex flex-col flex-1">
            <span className="font-bold text-brand-dark text-base">{title}</span>
            {subtitle && <span className="text-sm text-gray-500 mt-0.5">{subtitle}</span>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
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
            <div className="min-h-screen bg-brand-light pt-32 pb-24 px-6 md:px-12 w-full">
                <div className="max-w-[1400px] mx-auto">

                    {/* Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <Link to="/" className="text-sm text-gray-400 hover:text-brand-blue transition-colors mb-4 inline-block">
                            ← חזור לאתר
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight">
                            קופה מוסדית
                        </h1>
                    </motion.div>

                    {/* 2-Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

                        {/* RIGHT COLUMN (RTL Start) - Form (Takes 3 of 5 cols) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-3 flex flex-col gap-16"
                        >
                            {/* Section 1: Institution Details */}
                            <section>
                                <h2 className="text-2xl font-black text-brand-dark mb-2">פרטי המוסד</h2>
                                <p className="text-gray-500 mb-8">פרטי בית הספר או המוסד לצורך הפקת חשבונית.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FloatingInput label="שם המוסד / בית ספר" id="schoolName" />
                                    <FloatingInput label="שם איש קשר" id="contactName" />
                                    <FloatingInput label="טלפון" id="phone" type="tel" />
                                    <FloatingInput label="דוא״ל" id="email" type="email" />
                                </div>
                            </section>

                            {/* Section 2: Delivery & Installation */}
                            <section>
                                <h2 className="text-2xl font-black text-brand-dark mb-2">אפשרויות אספקה</h2>
                                <p className="text-gray-500 mb-8">בחרו את אופן ההובלה וההתקנה המועדף עליכם.</p>
                                <div className="flex flex-col gap-4">
                                    <SelectableCard
                                        title="משלוח רגיל (חינם)"
                                        subtitle="אספקה תוך 5–7 ימי עסקים עד לכתובת המוסד."
                                        isSelected={deliveryOption === 'free'}
                                        onClick={() => setDeliveryOption('free')}
                                        icon="📦"
                                    />
                                    <SelectableCard
                                        title="הובלה, התקנה פיזית והדרכת צוות (₪850)"
                                        subtitle="טכנאי מוסמך מתקין באתר עם הדרכה של שעה לצוות ההוראה."
                                        isSelected={deliveryOption === 'premium'}
                                        onClick={() => setDeliveryOption('premium')}
                                        icon="🔧"
                                    />
                                </div>
                            </section>

                            {/* Section 3: Payment Method */}
                            <section>
                                <h2 className="text-2xl font-black text-brand-dark mb-2">אמצעי תשלום</h2>
                                <p className="text-gray-500 mb-8">בחרו את שיטת התשלום המועדפת.</p>
                                <div className="flex flex-col gap-4">
                                    <SelectableCard
                                        title="כרטיס אשראי מוסדי"
                                        subtitle="חיוב מיידי בכרטיס האשראי של המוסד."
                                        isSelected={paymentMethod === 'credit'}
                                        onClick={() => setPaymentMethod('credit')}
                                        icon="💳"
                                    />
                                    <SelectableCard
                                        title="העברה בנקאית"
                                        subtitle="קבלת פרטי חשבון בנק להעברה ישירה."
                                        isSelected={paymentMethod === 'bank'}
                                        onClick={() => setPaymentMethod('bank')}
                                        icon="🏦"
                                    />
                                    <SelectableCard
                                        title="הזמנת רכש (PO) ממשרד החינוך / עירייה"
                                        subtitle="שלחו מספר הזמנת רכש מאושרת ונפיק חשבונית מול כתב ההתחייבות."
                                        isSelected={paymentMethod === 'po'}
                                        onClick={() => setPaymentMethod('po')}
                                        icon="📋"
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
                            <div className="bg-white rounded-3xl p-8 shadow-sm lg:sticky lg:top-32">
                                <h3 className="text-xl font-black text-brand-dark mb-8">סיכום הזמנה</h3>

                                {/* Items */}
                                <div className="flex flex-col gap-6 mb-8">
                                    {orderItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-brand-dark">{item.title}</span>
                                                <span className="text-gray-400 mt-1">כמות: {item.qty}</span>
                                            </div>
                                            <span className="font-bold text-brand-dark whitespace-nowrap mr-4">
                                                {formatPrice(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-100 pt-6 space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">סה״כ ביניים</span>
                                        <span className="font-bold text-brand-dark">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">אספקה</span>
                                        <span className="font-bold text-brand-dark">
                                            {deliveryCost === 0 ? 'חינם' : formatPrice(deliveryCost)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">מע״מ (17%)</span>
                                        <span className="font-bold text-brand-dark">{formatPrice(vat)}</span>
                                    </div>
                                </div>

                                {/* Grand Total */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <div className="flex justify-between items-center mb-8">
                                        <span className="text-lg font-bold text-brand-dark">סה״כ לתשלום</span>
                                        <span className="text-3xl font-black text-brand-dark">{formatPrice(total)}</span>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-600 hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-blue/30"
                                    >
                                        אשר הזמנת רכש
                                    </motion.button>

                                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                                        בלחיצה על ״אשר הזמנת רכש״ אתה מאשר את
                                        <Link to="/terms" className="text-brand-blue hover:underline mx-1">תנאי השימוש</Link>
                                        ו<Link to="/privacy" className="text-brand-blue hover:underline mx-1">מדיניות הפרטיות</Link>.
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
