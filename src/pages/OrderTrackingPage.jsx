/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import {
    collection, query, where, onSnapshot,
    doc, onSnapshot as docSnapshot
} from 'firebase/firestore';

const SF = `-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',Heebo,Arial,sans-serif`;

const STEPS = [
    { id: 'pending',    label: 'התקבלה',      emoji: '📬', desc: 'הזמנתך התקבלה במערכת' },
    { id: 'forwarded',  label: 'בטיפול',      emoji: '⚙️', desc: 'ההזמנה בטיפול אצלנו' },
    { id: 'in_transit', label: 'יצאה לדרך',   emoji: '📦', desc: 'ההזמנה בדרך אליך' },
    { id: 'arrived',    label: 'בדרך',         emoji: '🚚', desc: 'הסחורה בדרך לאספקה' },
    { id: 'shipped',    label: 'נמסרה',        emoji: '🏠', desc: 'ההזמנה נמסרה בהצלחה' },
];

const STATUS_TO_STEP = {
    pending:    0,
    forwarded:  1,
    confirmed:  1,
    in_transit: 2,
    arrived:    3,
    shipped:    4,
    // customer order statuses
    'ממתין':    0,
    'בטיפול':   1,
    'נשלח':     2,
    'נמסר':     4,
    'בוטל':     0,
};

export default function OrderTrackingPage() {
    const { orderId } = useParams();
    const [order,         setOrder]         = useState(null);
    const [supplierOrder, setSupplierOrder] = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);

    // Listen to customer order
    useEffect(() => {
        if (!orderId) return;
        const unsub = docSnapshot(doc(db, 'orders', orderId), snap => {
            if (snap.exists() && !snap.data().deleted) {
                setOrder({ id: snap.id, ...snap.data() });
            } else {
                setError('הזמנה לא נמצאה');
            }
            setLoading(false);
        }, () => { setError('שגיאה בטעינת ההזמנה'); setLoading(false); });
        return unsub;
    }, [orderId]);

    // Listen to supplier order
    useEffect(() => {
        if (!orderId) return;
        const q = query(collection(db, 'supplier_orders'), where('customerOrderId', '==', orderId));
        const unsub = onSnapshot(q, snap => {
            if (!snap.empty) {
                const d = snap.docs[0];
                setSupplierOrder({ id: d.id, ...d.data() });
            }
        });
        return unsub;
    }, [orderId]);

    const currentStatus = supplierOrder?.status || order?.status || 'pending';
    const currentStep   = STATUS_TO_STEP[currentStatus] ?? 0;
    const trackingNum   = supplierOrder?.trackingNumber || order?.trackingNumber;
    const eta           = supplierOrder?.eta || order?.eta;
    const productTitle  = supplierOrder?.productTitle || order?.product || order?.items?.[0]?.title || 'מוצר';
    const qty           = supplierOrder?.qty || order?.qty || 1;
    const customerName  = supplierOrder?.customerName || order?.customer || order?.name || '';

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', fontFamily: SF }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 1.5s infinite' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>N</span>
                    </div>
                    <p style={{ color: '#86868B', fontWeight: 700 }}>טוען...</p>
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', fontFamily: SF, direction: 'rtl' }}>
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', marginBottom: 8 }}>{error}</h1>
                    <p style={{ fontSize: 14, color: '#86868B' }}>מספר ההזמנה: {orderId}</p>
                </div>
            </div>
        );
    }

    return (
        <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#F0F4FF 0%,#F5F5F7 100%)', fontFamily: SF, padding: '0 0 60px' }}>

            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 16px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#AEAEB2' }}>הזמנה #{orderId?.slice(-6)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#007AFF' }}>NextClass</span>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>N</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>

                {/* Hero */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 32px rgba(0,122,255,0.10)', marginBottom: 20, textAlign: 'right', border: '1px solid rgba(0,122,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                        <div style={{ fontSize: 44 }}>{STEPS[currentStep]?.emoji}</div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#86868B', marginBottom: 3 }}>
                                {customerName ? `שלום ${customerName.split(' ')[0]},` : 'מעקב הזמנה'}
                            </p>
                            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1D1D1F', margin: 0, lineHeight: 1.2 }}>
                                {STEPS[currentStep]?.label}
                            </h1>
                            <p style={{ fontSize: 14, color: '#6E6E73', margin: '4px 0 0' }}>{STEPS[currentStep]?.desc}</p>
                        </div>
                    </div>

                    {/* 5-step progress bar */}
                    <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 8 }}>
                        {STEPS.map((step, i) => {
                            const isDone   = i < currentStep;
                            const isActive = i === currentStep;
                            return (
                                <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    {i < STEPS.length - 1 && (
                                        <div style={{ position: 'absolute', top: 14, right: '50%', left: '-50%', height: 3, background: isDone ? '#007AFF' : 'rgba(0,0,0,0.08)', zIndex: 0, transition: 'background 0.5s' }} />
                                    )}
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 99, zIndex: 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                                        background: isDone ? '#007AFF' : isActive ? '#007AFF' : '#F0F0F0',
                                        boxShadow: isActive ? '0 0 0 4px rgba(0,122,255,0.18)' : 'none',
                                        transition: 'all 0.4s',
                                    }}>
                                        {isDone ? <span style={{ color: '#fff', fontWeight: 900 }}>✓</span> : <span style={{ fontSize: 14 }}>{step.emoji}</span>}
                                    </div>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: isActive ? '#007AFF' : isDone ? '#007AFF' : '#AEAEB2', marginTop: 5, textAlign: 'center', lineHeight: 1.3 }}>{step.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Order details */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ background: '#fff', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 14, border: '1px solid rgba(0,0,0,0.06)', textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 14 }}>פרטי הזמנה</p>
                    {[
                        { label: 'מוצר',        value: productTitle },
                        { label: 'כמות',         value: String(qty) },
                        trackingNum && { label: 'מספר מעקב', value: trackingNum },
                        eta         && { label: 'צפי הגעה',  value: eta },
                    ].filter(Boolean).map((row, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F' }}>{row.value}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#AEAEB2' }}>{row.label}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Contact CTA */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    style={{ background: '#fff', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', marginBottom: 14, border: '1px solid rgba(0,122,255,0.10)', textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', marginBottom: 4 }}>שאלה על ההזמנה?</p>
                    <p style={{ fontSize: 12, color: '#86868B', marginBottom: 14 }}>הצוות שלנו זמין לכל שאלה — שלחו הודעה ישירה ונחזור אליכם תוך שעה.</p>
                    <a
                        href={`https://wa.me/972585856356?text=${encodeURIComponent(`שלום, יש לי שאלה לגבי הזמנה #${orderId}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: '#25D366', color: '#fff', borderRadius: 14, padding: '12px 20px',
                            fontWeight: 800, fontSize: 14, textDecoration: 'none',
                            boxShadow: '0 4px 16px rgba(37,211,102,0.28)',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        צור קשר בוואטסאפ
                    </a>
                </motion.div>

                {/* Branding footer */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>N</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#007AFF' }}>NextClass</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#AEAEB2' }}>טכנולוגיה לחינוך · ניהול הזמנות בזמן אמת</p>
                    <p style={{ fontSize: 11, color: '#C7C7CC', marginTop: 4 }}>עדכון חי — מתרענן אוטומטית</p>
                </motion.div>
            </div>
        </div>
    );
}
