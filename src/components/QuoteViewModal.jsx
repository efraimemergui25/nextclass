import React from 'react';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";
import { motion, AnimatePresence } from 'framer-motion';

const QuoteViewModal = ({ isOpen, onClose, cartItems, cartTotal }) => {
    // Current date format
    const today = new Date().toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 print:p-0 print:absolute print:inset-0">
                    {/* Backdrop (hidden in print) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none flex flex-col max-h-[90vh] print:max-h-max"
                        dir="rtl"
                    >
                        {/* Header Controls (hidden in print) */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50 print:hidden shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">תצוגת הצעת מחיר</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-[#007AFF] text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition shadow-sm flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    שמור כ-PDF / הדפס
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Printable Quote Body */}
                        <div className="p-8 md:p-12 overflow-y-auto print:overflow-visible flex-1 print:p-0 bg-white print:bg-white text-black">

                            {/* Quote Header */}
                            <div className="flex justify-between items-start mb-12 border-b-2 border-gray-900 pb-8">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#1D1D1F] mb-2">NextClass</h1>
                                    <p className="text-gray-500 font-medium">הצעת מחיר מוסדית רשמית</p>
                                </div>
                                <div className="text-left text-sm font-medium text-gray-600 leading-relaxed">
                                    <p>תאריך: {today}</p>
                                    <p>תוקף הצעה: 14 ימים</p>
                                    <p>מספר סימוכין: {Math.floor(100000 + Math.random() * 900000)}</p>
                                </div>
                            </div>

                            {/* Cart Items Table */}
                            <div className="mb-12">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200">
                                            <th className="py-3 font-bold text-gray-700 w-16">#</th>
                                            <th className="py-3 font-bold text-gray-700">תיאור הפריט</th>
                                            <th className="py-3 font-bold text-gray-700">מק״ט</th>
                                            <th className="py-3 font-bold text-gray-700">כמות</th>
                                            <th className="py-3 font-bold text-gray-700">מחיר יחידה</th>
                                            <th className="py-3 font-bold text-gray-700">סה״כ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {cartItems.map((item, index) => (
                                            <tr key={index} className="group hover:bg-gray-50/50 print:hover:bg-transparent transition-colors">
                                                <td className="py-4 text-gray-500 font-medium">{index + 1}</td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden border border-gray-200 shrink-0">
                                                            <img src={item.image || IMG_FALLBACK} alt={item.title} className="w-full h-full object-cover mix-blend-multiply"
                                                onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#1D1D1F] text-sm md:text-base">{item.title}</p>
                                                            {item.accessories?.length > 0 && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                                    + תוספות: {item.accessories.map(a => a.title).join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm text-gray-500 tracking-wider">{item.id.split('-')[0].substring(0, 6)}</td>
                                                <td className="py-4 font-bold text-[#1D1D1F]">{item.quantity}</td>
                                                <td className="py-4 font-medium text-gray-600">₪{item.price.toLocaleString()}</td>
                                                <td className="py-4 font-bold text-[#1D1D1F]">₪{(item.price * item.quantity).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Quote Summary Footer */}
                            <div className="flex flex-col md:flex-row justify-between items-end border-t-2 border-gray-900 pt-8 gap-8">
                                <div className="text-sm text-gray-500 font-medium max-w-sm">
                                    <h4 className="font-bold text-[#1D1D1F] mb-2 tracking-wide text-xs">תנאים והערות</h4>
                                    <p>המחירים כוללים מע"מ ואינם כוללים עלויות הובלה והתקנה אלא אם צוין אחרת. זמן אספקה משוער 14-21 ימי עסקים.</p>
                                </div>
                                <div className="bg-gray-50 print:bg-transparent p-6 rounded-xl min-w-[300px] border border-gray-100 print:border-none print:p-0">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-gray-600">סה״כ לתשלום:</span>
                                        <span className="text-3xl font-black tracking-tighter text-[#1D1D1F]">₪{cartTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span>מע״מ (17%)</span>
                                        <span>כלול</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default QuoteViewModal;
