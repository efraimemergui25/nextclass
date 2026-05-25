import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';

const SF = `-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',Heebo,Arial,sans-serif`;

const STATUS_CONFIG = {
    'ממתין':   { color: '#FF9500', bg: '#FF950015', label: 'ממתין לאישור' },
    'בטיפול':  { color: '#007AFF', bg: '#007AFF15', label: 'בטיפול' },
    'נשלח':    { color: '#5856D6', bg: '#5856D615', label: 'נשלח' },
    'בדרך':    { color: '#5856D6', bg: '#5856D615', label: 'בדרך' },
    'נמסר':    { color: '#34C759', bg: '#34C75915', label: 'נמסר' },
    'בוטל':    { color: '#FF3B30', bg: '#FF3B3015', label: 'בוטל' },
    default:   { color: '#86868B', bg: '#86868B15', label: 'לא ידוע' },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

const OrderCard = ({ order }) => {
    const statusCfg = getStatusConfig(order.status);
    const date = order.date || (order.dateTs ? new Date(order.dateTs).toLocaleDateString('he-IL') : '');
    const product = order.product || order.items?.[0]?.title || 'מוצר';
    const total = order.total ? `₪${Number(order.total).toLocaleString()}` : '';
    const whatsappMsg = encodeURIComponent(`שלום, יש לי שאלה לגבי הזמנה #${order.id}`);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            dir="rtl"
        >
            <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <p className="font-bold text-[#1D1D1F] text-[15px] leading-snug mb-1">{product}</p>
                        <p className="text-[11px] text-[#86868B] font-medium">הזמנה #{order.id?.slice(-8)}</p>
                    </div>
                    <span className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black"
                        style={{ color: statusCfg.color, background: statusCfg.bg }}>
                        {statusCfg.label}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                    {date && (
                        <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                            <p className="text-[9px] font-black text-[#AEAEB2] mb-1">תאריך</p>
                            <p className="text-[12px] font-bold text-[#1D1D1F]">{date}</p>
                        </div>
                    )}
                    {order.qty && (
                        <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                            <p className="text-[9px] font-black text-[#AEAEB2] mb-1">כמות</p>
                            <p className="text-[12px] font-bold text-[#1D1D1F]">{order.qty}</p>
                        </div>
                    )}
                    {total && (
                        <div className="bg-[#F5F5F7] rounded-xl p-3 text-center">
                            <p className="text-[9px] font-black text-[#AEAEB2] mb-1">סכום</p>
                            <p className="text-[12px] font-bold text-[#1D1D1F]">{total}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Link
                        to={`/track/${order.id}`}
                        className="flex-1 py-2.5 rounded-xl text-center text-[12px] font-bold text-white"
                        style={{ background: '#007AFF' }}
                    >
                        עקוב אחר ההזמנה
                    </Link>
                    <a
                        href={`https://wa.me/972585856356?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold border border-gray-200 text-[#1D1D1F] hover:border-[#25D366] hover:text-[#25D366] transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        צור קשר
                    </a>
                </div>
            </div>
        </motion.div>
    );
};

export default function MyOrdersPage() {
    const { user, userDoc } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lookupEmail, setLookupEmail] = useState('');
    const [lookupDone, setLookupDone] = useState(false);
    const [lookupError, setLookupError] = useState('');

    const fetchOrders = async (email) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'orders'),
                where('email', '==', email),
            );
            const snap = await getDocs(q);
            const result = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(o => !o.deleted);
            result.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
            setOrders(result);
        } catch (e) {
            console.error(e);
            setOrders([]);
        }
        setLoading(false);
        setLookupDone(true);
    };

    // Auto-fetch if logged in
    useEffect(() => {
        if (user?.email) {
            fetchOrders(user.email);
        } else {
            setLoading(false);
        }
    }, [user?.email]);

    const handleLookup = (e) => {
        e.preventDefault();
        if (!lookupEmail.trim()) { setLookupError('אנא הזינו כתובת מייל'); return; }
        setLookupError('');
        fetchOrders(lookupEmail.trim().toLowerCase());
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-20 pb-20" dir="rtl" style={{ fontFamily: SF }}>
                <div className="max-w-3xl mx-auto px-4 sm:px-6">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <span className="inline-block text-[10px] font-black text-[#007AFF] bg-[#007AFF]/08 px-3 py-1 rounded-full mb-3">ניהול הזמנות</span>
                        <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter">
                            {user ? `שלום ${userDoc?.firstName || user.displayName?.split(' ')[0] || ''}` : 'ההזמנות שלי'}
                        </h1>
                        <p className="text-[#86868B] text-[14px] font-medium mt-1">עקבו אחרי כל הזמנותיכם במקום אחד</p>
                    </motion.div>

                    {/* Email lookup (non-logged-in users) */}
                    {!user && !lookupDone && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-6">
                            <h2 className="font-black text-[18px] text-[#1D1D1F] mb-2">מצאו את ההזמנות שלכם</h2>
                            <p className="text-[#86868B] text-[13px] mb-6">הזינו את כתובת המייל ששימשה בהזמנה</p>
                            <form onSubmit={handleLookup} className="flex gap-3">
                                <input
                                    type="email"
                                    placeholder="כתובת מייל *"
                                    value={lookupEmail}
                                    onChange={e => setLookupEmail(e.target.value)}
                                    className="flex-1 bg-[#F5F5F7] rounded-2xl px-4 py-3 text-[14px] font-medium text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#007AFF]/30 border border-transparent focus:border-[#007AFF]/20 transition-all"
                                    style={{ direction: 'ltr', textAlign: 'left' }}
                                />
                                <button type="submit" className="px-5 py-3 rounded-2xl bg-[#007AFF] text-white font-bold text-[13px] whitespace-nowrap">
                                    חפש
                                </button>
                            </form>
                            {lookupError && <p className="text-[#FF3B30] text-[12px] font-medium mt-2">{lookupError}</p>}
                            <p className="text-[11px] text-[#AEAEB2] mt-4">
                                יש לכם חשבון?{' '}
                                <button onClick={() => navigate('/login')} className="text-[#007AFF] font-bold">התחברו</button>
                                {' '}לצפות בכל ההיסטוריה.
                            </p>
                        </motion.div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                className="w-8 h-8 rounded-full"
                                style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#E5E5EA', borderTopColor: '#007AFF' }}
                            />
                        </div>
                    )}

                    {/* Orders list */}
                    {!loading && lookupDone && (
                        <>
                            {orders.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                                    <div className="text-5xl mb-4">📦</div>
                                    <h3 className="font-black text-[18px] text-[#1D1D1F] mb-2">לא נמצאו הזמנות</h3>
                                    <p className="text-[#86868B] text-[13px] mb-6">
                                        {user ? 'עדיין אין הזמנות בחשבון שלכם.' : 'לא נמצאו הזמנות לכתובת המייל הזאת.'}
                                    </p>
                                    <Link to="/catalog"
                                        className="inline-block px-6 py-3 rounded-2xl bg-[#007AFF] text-white font-bold text-[13px]">
                                        לקטלוג המוצרים
                                    </Link>
                                </motion.div>
                            ) : (
                                <div>
                                    <p className="text-[11px] font-bold text-[#AEAEB2] mb-4">
                                        נמצאו {orders.length} הזמנות
                                    </p>
                                    <div className="flex flex-col gap-4">
                                        {orders.map(order => <OrderCard key={order.id} order={order} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Not logged in, no lookup yet */}
                    {!user && !loading && !lookupDone && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mt-4">
                            <h3 className="font-black text-[16px] text-[#1D1D1F] mb-2">כניסה מהירה לחשבון</h3>
                            <p className="text-[#86868B] text-[13px] mb-4">כניסה לחשבון מאפשרת צפייה בכל ההזמנות והיסטוריית הרכישות.</p>
                            <button onClick={() => navigate('/login')}
                                className="w-full py-3 rounded-2xl bg-[#1D1D1F] text-white font-bold text-[13px]">
                                כניסה / הרשמה
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </PageTransition>
    );
}
