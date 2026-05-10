/* eslint-disable no-unused-vars */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const HyperGlassCard = ({ children, className = "" }) => (
    <div className={`bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 shadow-[0_20px_40px_rgb(0_0_0/0.08)] rounded-[2rem] p-8 ${className}`}>
        {children}
    </div>
);

const GlassInput = ({ label, type = "text", id, value, onChange, placeholder = "" }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-bold text-gray-500 pr-1">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-white/50 border border-white/80 focus:border-[#007AFF] focus:bg-white focus:ring-4 focus:ring-[#007AFF]/10 rounded-xl px-5 py-4 text-[#1D1D1F] transition-all outline-none placeholder-gray-400 font-medium"
            required
        />
    </div>
);

const CheckoutPage = () => {
    const { getSetting } = useSettings();
    const allowOrders = getSetting('allow_orders', true);

    const content = useMemo(() => ({
        title:        getSetting('check_title', 'סיום קנייה'),
        subtitle:     getSetting('check_subtitle', 'בוא נסיים את ההזמנה שלך ונתחיל לעבוד.'),
        shipTitle:    getSetting('check_shipping_title', 'פרטי משלוח'),
        fname:        getSetting('check_fname', 'שם פרטי'),
        lname:        getSetting('check_lname', 'שם משפחה'),
        city:         getSetting('check_city', 'עיר'),
        street:       getSetting('check_street', 'רחוב ומספר בית'),
        phone:        getSetting('check_phone_label', 'טלפון'),
        email:        getSetting('check_email_label', 'אימייל'),
        payTitle:     getSetting('check_payment_title', 'אמצעי תשלום'),
        credit:       getSetting('check_credit_card', 'אשראי'),
        ccNum:        getSetting('check_cc_num', 'מספר כרטיס'),
        ccExp:        getSetting('check_cc_exp', 'תוקף'),
        ccCvv:        getSetting('check_cc_cvv', 'CVV'),
        applePay:     getSetting('check_apple_pay', 'Double Click to Pay'),
        appleSub:     getSetting('check_apple_sub', 'המשך לתשלום מהיר ומאובטח עם Apple Pay'),
        bitPay:       getSetting('check_bit_pay', 'בקשת תשלום תישלח לאפליקציה'),
        bitSub:       getSetting('check_bit_sub', 'הזן את מספר הטלפון המזוהה עם חשבון ה-bit שלך'),
        paypalPay:    getSetting('check_paypal_pay', 'Redirecting to PayPal'),
        paypalSub:    getSetting('check_paypal_sub', 'לאחר הלחיצה על "שלם עכשיו", תועבר לאתר PayPal להשלמת הרכישה'),
        summary:      getSetting('cart_summary_title', 'סיכום הזמנה'),
        qtyLabel:     getSetting('check_qty_label', 'כמות: '),
        empty:        getSetting('check_empty', 'העגלה שלך ריקה...'),
        subtotal:     getSetting('cart_subtotal_label', 'סיכום ביניים'),
        shipping:     getSetting('check_shipping_cost', 'משלוח'),
        free:         getSetting('check_free', 'חינם'),
        total:        getSetting('cart_total_label', 'סה״כ לתשלום'),
        taxInc:       getSetting('check_tax_inc', 'כולל מע״מ'),
        payNow:       getSetting('check_pay_now', 'שלח פנייה ושלם'),
        sslNote:      getSetting('check_ssl_note', 'חיבור מאובטח בתקן SSL 256-bit'),
        disabledMsg:  getSetting('check_orders_disabled', 'קבלת הזמנות מושהית כרגע. אנא נסו שוב מאוחר יותר.'),
    }), [getSetting]);

    const subtotal = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const price = typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) : item.price;
            return acc + (price * item.qty);
        }, 0);
    }, [cartItems]);

    const total = subtotal; // Assuming shipping is free as per requirements

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        
        try {
            // Generate order ID
            const orderId = `NC-${Math.floor(10000 + Math.random() * 90000)}`;
            
            // Create a structured order matching the Admin's schema
            const newOrder = {
                id: orderId,
                date: new Date().toLocaleDateString('he-IL'),
                dateTs: Date.now(),
                customer: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                address: formData.street,
                product: cartItems.map(i => i.title).join(', '),
                productId: cartItems[0]?.id || 'unknown',
                productImage: cartItems[0]?.imageUrl || cartItems[0]?.image,
                qty: cartItems.reduce((acc, i) => acc + i.qty, 0),
                total: total,
                status: 'חדש',
                notes: `שולם באמצעות: ${paymentMethod}`,
                history: [
                    { status: 'חדש', date: new Date().toLocaleDateString('he-IL'), time: new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) }
                ],
                items: cartItems 
            };
            
            // Save order to Firebase
            await setDoc(doc(db, 'orders', orderId), newOrder);
            
            // Decrement Inventory Stock in Firebase
            for (const item of cartItems) {
                if (item.id) {
                    await updateDoc(doc(db, 'products', item.id.toString()), {
                        stock: increment(-item.qty),
                        sold: increment(item.qty)
                    });
                }
            }
        } catch (err) {
            console.error('Failed to save order to Firebase database', err);
        }

        clearCart();
        navigate('/');
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
                <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                    {/* RIGHT COLUMN: Shipping & Payment (7 cols) — order-2 on mobile */}
                    <div className="col-span-12 lg:col-span-7 space-y-8 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tighter mb-4 leading-tight">
                                {content.title}
                            </h1>
                            <p className="text-gray-500 font-medium mb-8">{content.subtitle}</p>
                        </motion.div>

                        {/* Step 1: Shipping Details */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <HyperGlassCard>
                                <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6 tracking-tight">{content.shipTitle}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <GlassInput label={content.fname} id="firstName" value={formData.firstName} onChange={handleInputChange} />
                                    <GlassInput label={content.lname} id="lastName" value={formData.lastName} onChange={handleInputChange} />
                                    <GlassInput label={content.city} id="city" value={formData.city} onChange={handleInputChange} />
                                    <GlassInput label={content.street} id="street" value={formData.street} onChange={handleInputChange} />
                                    <GlassInput label={content.phone} id="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                                    <GlassInput label={content.email} id="email" type="email" value={formData.email} onChange={handleInputChange} />
                                </div>
                            </HyperGlassCard>
                        </motion.section>

                        {/* Step 2: Payment Methods */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <HyperGlassCard>
                                <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6 tracking-tight">{content.payTitle}</h2>

                                {/* Gestalt-Synchronized Payment Badges */}
                                <div className="flex flex-wrap gap-4 mb-10">
                                    {/* Apple Pay */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('apple')}
                                        className={`bg-black text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-1 font-semibold text-xl shadow-lg transition-all min-h-[52px] active:scale-95 ${paymentMethod === 'apple'
                                            ? 'ring-4 ring-offset-2 ring-[#007AFF] scale-[1.05]'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                    >
                                        <span className="text-2xl"></span> Pay
                                    </button>

                                    {/* Bit */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('bit')}
                                        className={`bg-white border-2 border-gray-100 text-[#00B4E6] px-6 py-3 rounded-2xl flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg transition-all min-h-[52px] active:scale-95 ${paymentMethod === 'bit'
                                            ? 'ring-4 ring-offset-2 ring-[#00B4E6] scale-[1.05]'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                    >
                                        bit
                                    </button>

                                    {/* PayPal */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('paypal')}
                                        className={`bg-[#00457C] text-white px-6 py-3 rounded-2xl flex items-center justify-center font-bold italic text-xl shadow-lg transition-all min-h-[52px] active:scale-95 ${paymentMethod === 'paypal'
                                            ? 'ring-4 ring-offset-2 ring-[#00457C] scale-[1.05]'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                    >
                                        PayPal
                                    </button>

                                    {/* Credit Card */}
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('credit')}
                                        className={`bg-white border-2 border-gray-100 text-[#1D1D1F] px-6 py-3 rounded-2xl flex items-center justify-center gap-3 font-semibold text-lg shadow-lg transition-all min-h-[52px] active:scale-95 ${paymentMethod === 'credit'
                                            ? 'ring-4 ring-offset-2 ring-[#1D1D1F] scale-[1.05]'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                    >
                                        <CreditCard size={24} />
                                        <span>{content.credit}</span>
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {paymentMethod === 'credit' && (
                                        <motion.div
                                            key="credit-form"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.4, ease: "circOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="space-y-6 pt-6 border-t border-white/20">
                                                <GlassInput label={content.ccNum} id="cc_number" placeholder="0000 0000 0000 0000" />
                                                <div className="grid grid-cols-2 gap-6">
                                                    <GlassInput label={content.ccExp} id="cc_expiry" placeholder="MM/YY" />
                                                    <GlassInput label={content.ccCvv} id="cc_cvv" placeholder="123" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    {paymentMethod === 'apple' && (
                                        <motion.div
                                            key="apple-form"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="text-center py-10 border-t border-white/20"
                                        >
                                            <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl animate-bounce"></div>
                                            <h4 className="text-xl font-black text-[#1D1D1F] mb-2">{content.applePay}</h4>
                                            <p className="text-gray-400 font-medium">{content.appleSub}</p>
                                        </motion.div>
                                    )}
                                    {paymentMethod === 'bit' && (
                                        <motion.div
                                            key="bit-form"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="text-center py-10 border-t border-white/20"
                                        >
                                            <div className="w-20 h-20 bg-white border-2 border-[#00B4E6] text-[#00B4E6] rounded-3xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl">bit</div>
                                            <h4 className="text-xl font-black text-[#1D1D1F] mb-2">{content.bitPay}</h4>
                                            <p className="text-gray-400 font-medium">{content.bitSub}</p>
                                            <div className="max-w-xs mx-auto mt-6">
                                                <GlassInput label={content.phone} id="bit_phone" placeholder="050-0000000" />
                                            </div>
                                        </motion.div>
                                    )}
                                    {paymentMethod === 'paypal' && (
                                        <motion.div
                                            key="paypal-form"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="text-center py-10 border-t border-white/20"
                                        >
                                            <div className="w-20 h-20 bg-[#00457C] text-white rounded-3xl flex items-center justify-center text-2xl font-black italic mx-auto mb-6 shadow-xl">PP</div>
                                            <h4 className="text-xl font-black text-[#1D1D1F] mb-2">{content.paypalPay}</h4>
                                            <p className="text-gray-400 font-medium">{content.paypalSub}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </HyperGlassCard>
                        </motion.section>
                    </div>

                    {/* LEFT COLUMN: Order Summary (5 cols) — order-1 on mobile (shows ABOVE form) */}
                    <div className="col-span-12 lg:col-span-5 lg:sticky lg:top-32 order-1 lg:order-2">
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <HyperGlassCard className="!p-10 space-y-8">
                                <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight">{content.summary}</h3>

                                {/* Items List */}
                                <div className="space-y-6 max-h-[220px] lg:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4 items-center">
                                            <div className="w-16 h-16 rounded-xl bg-white/40 overflow-hidden border border-white/60 shadow-sm shrink-0">
                                                <img
                                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }}
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover mix-blend-multiply"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <h4 className="text-sm font-bold text-[#1D1D1F] leading-tight line-clamp-2">{item.title}</h4>
                                                <p className="text-xs font-bold text-gray-400">{content.qtyLabel}{item.qty}</p>
                                            </div>
                                            <span className="text-sm font-black text-[#1D1D1F] tracking-tighter shrink-0">
                                                ₪{(typeof item.price === 'string' ? parseInt(item.price.replace(/[^\d]/g, '')) : item.price).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}

                                    {cartItems.length === 0 && (
                                        <div className="text-center py-10">
                                            <p className="text-gray-400 font-bold italic">{content.empty}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Calculation Breakdown */}
                                <div className="pt-8 border-t border-white/20 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span>{content.subtotal}</span>
                                        <span className="text-[#1D1D1F]">₪{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                        <span>{content.shipping}</span>
                                        <span className="text-green-600 font-bold">{content.free}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-xl font-black text-[#1D1D1F]">{content.total}</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-[#1D1D1F] tracking-tighter">
                                                ₪{total.toLocaleString()}
                                            </span>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{content.taxInc}</p>
                                        </div>
                                    </div>
                                </div>

                                {!allowOrders && (
                                    <div className="mt-6 bg-[#FF3B30]/08 border border-[#FF3B30]/20 rounded-2xl px-4 py-3 text-right">
                                        <p className="text-[#FF3B30] text-sm font-bold">{content.disabledMsg}</p>
                                    </div>
                                )}
                                <motion.button
                                    type="submit"
                                    disabled={!allowOrders}
                                    whileHover={allowOrders ? { scale: 1.02 } : {}}
                                    whileTap={allowOrders ? { scale: 0.98 } : {}}
                                    className="w-full bg-[#1D1D1F] text-white py-5 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 mt-4 shadow-[0_20px_40px_rgb(29_29_31/0.2)] hover:bg-black transition-all duration-300 min-h-[56px] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <Lock className="w-5 h-5" strokeWidth={2.5} />
                                    <span>{content.payNow} ₪{total.toLocaleString()}</span>
                                </motion.button>

                                {/* Secure Payment Section */}
                                <div className="pt-6 mt-6 border-t border-white/20">
                                    <div className="flex justify-center gap-4 mb-6">
                                        <img src="/apple-pay-logo.svg" alt="Apple Pay" className="h-8 rounded-lg shadow-sm" />
                                        <img src="/bit-logo.svg" alt="Bit" className="h-8 rounded-lg shadow-sm" />
                                        <img src="/paypal-logo.svg" alt="PayPal" className="h-8 rounded-lg shadow-sm" />
                                        <img src="/credit-card-logo.svg" alt="Credit Card" className="h-8 rounded-lg shadow-sm" />
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black tracking-widest text-[#1D1D1F] opacity-40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        {content.sslNote}
                                    </div>
                                </div>
                            </HyperGlassCard>
                        </motion.section>
                    </div>
                </form>
            </div>
        </PageTransition>
    );
};

export default CheckoutPage;
