import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { MotionButton } from './CartPage';

const CheckoutPage = () => {
    const [step, setStep] = useState(2); // 1: Cart (skipped here), 2: Shipping, 3: Payment
    const [shippingMethod, setShippingMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('credit');

    // Mocks for summary
    const subtotal = 12500;
    const vat = subtotal * 0.17;

    const shippingCost = {
        standard: 0,
        express: 150,
        premium: 850
    }[shippingMethod];

    const total = subtotal + vat + shippingCost;

    const shippingOptions = [
        { id: 'standard', title: 'משלוח רגיל למוסד', desc: 'עד 7 ימי עסקים', price: 0 },
        { id: 'express', title: 'משלוח אקספרס', desc: 'עד 2 ימי עסקים', price: 150 },
        { id: 'premium', title: 'משלוח + התקנה והדרכת צוות', desc: 'תיאום אישי מלא מול רכז התקשוב', price: 850 }
    ];

    const paymentOptions = [
        { id: 'credit', title: 'כרטיס אשראי', icon: '💳' },
        { id: 'bit', title: 'Bit', icon: '📱' },
        { id: 'applepay', title: 'Apple Pay / Google Pay', icon: '🍎' },
        { id: 'po', title: 'הזמנת רכש מוסדית / העברה בנקאית', icon: '🏦' }
    ];

    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] min-h-[calc(100vh-73px)] py-12">
                <div className="max-w-6xl mx-auto px-6 md:px-12">

                    {/* Stepper Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold text-[#1D1D1F] tracking-tight mb-8">השלמת רכישה</h1>

                        <div className="flex items-center justify-between max-w-xl relative">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 rounded-full"></div>
                            <div
                                className="absolute top-1/2 right-0 h-1 bg-[#007AFF] -z-10 rounded-full transition-all duration-500 ease-out"
                                style={{ width: step === 2 ? '50%' : '100%' }}
                            ></div>

                            {/* Steps */}
                            {['סל קניות', 'משלוח', 'תשלום'].map((label, idx) => {
                                const stepNumber = idx + 1;
                                const isActive = step === stepNumber;
                                const isPassed = step > stepNumber;

                                return (
                                    <div key={stepNumber} className="flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${isActive || isPassed ? 'bg-[#007AFF] text-white shadow-md' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                                            {isPassed ? '✓' : stepNumber}
                                        </div>
                                        <span className={`text-sm font-medium ${isActive ? 'text-[#1D1D1F]' : 'text-gray-400'}`}>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

                        {/* Main Checkout Flow Area */}
                        <div className="flex-1 w-full bg-white rounded-3xl p-8 lg:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                            <AnimatePresence mode="wait">

                                {step === 2 && (
                                    <motion.div
                                        key="shipping"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">בחר שיטת משלוח</h2>

                                        <div className="space-y-4">
                                            {shippingOptions.map((opt) => (
                                                <label
                                                    key={opt.id}
                                                    className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${shippingMethod === opt.id ? 'border-[#007AFF] bg-blue-50/30 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                                                    onClick={() => setShippingMethod(opt.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${shippingMethod === opt.id ? 'border-[#007AFF]' : 'border-gray-300'}`}>
                                                            {shippingMethod === opt.id && <div className="w-3 h-3 bg-[#007AFF] rounded-full"></div>}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[#1D1D1F] text-lg">{opt.title}</div>
                                                            <div className="text-gray-500 text-sm mt-1">{opt.desc}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-bold text-[#1D1D1F]">
                                                        {opt.price === 0 ? 'חינם' : `₪${opt.price}`}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>

                                        <div className="mt-10 flex justify-end">
                                            <MotionButton variant="primary" className="px-12 py-4 text-lg" onClick={() => setStep(3)}>
                                                המשך לתשלום
                                            </MotionButton>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="payment"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">אמצעי תשלום</h2>
                                        <p className="text-gray-500 mb-8">כל העסקאות מאובטחות ומוצפנות.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {paymentOptions.map((opt) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center gap-3 ${paymentMethod === opt.id ? 'border-[#007AFF] bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}
                                                    onClick={() => setPaymentMethod(opt.id)}
                                                >
                                                    <span className="text-3xl">{opt.icon}</span>
                                                    <span className="font-bold text-[#1D1D1F]">{opt.title}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Dynamic Payment Details Area depending on selection */}
                                        <AnimatePresence>
                                            {paymentMethod === 'po' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-6 p-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center">
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <h3 className="text-xl font-bold text-[#1D1D1F]">מסלול רכש מוסדי (B2B)</h3>
                                                    </div>
                                                    <p className="text-base text-gray-600 mb-6 leading-relaxed">
                                                        תהליך מותאם אישית למוסדות חינוך מול נציג ייעודי. נא להפיק הזמנת רכש מול ח.פ 512345678 (nextclass בע"מ) ולהעבירה אלינו להמשך טיפול ותיאום אספקה.
                                                    </p>

                                                    <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-gray-100 mb-2">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">פרטי חשבון להעברה / ערבות</p>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-[#1D1D1F]">
                                                            <div className="flex items-center gap-6">
                                                                <div><span className="text-gray-400 text-xs block mb-1">בנק</span>בנק הפועלים (12)</div>
                                                                <div><span className="text-gray-400 text-xs block mb-1">סניף</span>345</div>
                                                                <div><span className="text-gray-400 text-xs block mb-1">חשבון</span>987654</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="mt-10 flex justify-between items-center">
                                            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-[#1D1D1F] font-medium transition-colors">
                                                חזור למשלוח
                                            </button>
                                            <MotionButton variant="primary" className="px-12 py-4 text-lg shadow-[0_8px_25px_rgba(0,122,255,0.4)]">
                                                השלם הזמנה
                                            </MotionButton>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="w-full lg:w-[400px]">
                            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                                <h2 className="text-xl font-bold text-[#1D1D1F] mb-6">סיכום הזמנה</h2>

                                {/* Mini Cart Preview */}
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                    <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden">
                                        <img src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=200" alt="Item" className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#1D1D1F] text-sm">מסך מגע אינטראקטיבי Pro 75</p>
                                        <p className="text-gray-500 text-xs">כמות: 2</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6 text-sm">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>סיכום ביניים</span>
                                        <span className="font-medium text-[#1D1D1F]">₪{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>משלוח</span>
                                        <span className="font-medium text-[#1D1D1F]">{shippingCost === 0 ? 'חינם' : `₪${shippingCost}`}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>מע"מ (17%)</span>
                                        <span className="font-medium text-[#1D1D1F]">₪{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-bold text-[#1D1D1F]">סה"כ לתשלום</span>
                                        <div className="text-left">
                                            <span className="block text-3xl font-extrabold text-[#1D1D1F]">₪{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Badges */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                רכישה מאובטחת תחת תקני PCI-DSS
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
