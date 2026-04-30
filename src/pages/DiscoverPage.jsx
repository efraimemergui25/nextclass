import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Zap, Gift, ChevronLeft } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import products from '../data/products';

// ─── Swimlane data ────────────────
const SWIMLANES = [
    {
        id: 'top-sellers',
        label: 'הנמכרים ביותר',
        badge: 'trending',
        sub: 'המוצרים שמוסדות החינוך בוחרים שוב ושוב',
        items: products.slice(0, 4),
        icon: <TrendingUp size={18} />
    },
    {
        id: 'new-arrivals',
        label: 'חדש בחנות',
        badge: 'new',
        sub: 'טכנולוגיה חדישה שהגיעה ממש עכשיו',
        items: products.slice(10, 14),
        icon: <Zap size={18} />
    },
    {
        id: 'deals',
        label: 'מבצעים מיוחדים',
        badge: 'deal',
        sub: 'הזדמנויות שלא כדאי לפספס',
        items: products.slice(20, 24),
        icon: <Gift size={18} />
    },
];

const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const Swimlane = memo(({ lane }) => (
    <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="mb-32"
    >
        <div className="flex items-end justify-between mb-12 relative">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm text-[#007AFF]`}>
                    {lane.icon}
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-4xl font-apple-display text-[#1D1D1F] tracking-tighter">
                            {lane.label}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                            lane.badge === 'trending' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                            lane.badge === 'new' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            'bg-gradient-to-r from-green-500 to-emerald-500'
                        }`}>
                            {lane.badge === 'trending' ? 'Trending' : lane.badge === 'new' ? 'New' : 'Special'}
                        </span>
                    </div>
                    <p className="text-lg text-[#86868B] font-medium">{lane.sub}</p>
                </div>
            </div>
            <Link
                to="/catalog"
                className="group flex items-center gap-2 text-[#007AFF] font-bold text-sm hover:opacity-80 transition-all"
            >
                צפה בהכל
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                    <ChevronLeft size={16} />
                </div>
            </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {lane.items.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    </motion.section>
));

const DiscoverPage = () => {
    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-40 pb-32 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-6">

                    {/* ── Page Header ─────────────────────────────────── */}
                    <div className="max-w-2xl pt-24 mb-64 relative z-10">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] font-black uppercase tracking-[0.6em] text-[#007AFF]/60 mb-20 block"
                        >
                            NextClass Discovery
                        </motion.span>
                        <div className="space-y-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="text-6xl md:text-8xl font-apple-display text-[#1D1D1F] tracking-tight leading-none"
                            >
                                הטכנולוגיה
                            </motion.h1>
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                                className="text-6xl md:text-8xl font-light text-gray-300 tracking-tight leading-none"
                            >
                                שמעצבת
                            </motion.h1>
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                className="text-6xl md:text-8xl font-apple-display text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#5856D6] tracking-tight leading-none"
                            >
                                את המחר.
                            </motion.h1>
                        </div>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="text-xl md:text-2xl text-gray-400 font-medium leading-[1.8] max-w-lg mt-24"
                        >
                            אוסף נבחר של הכלים המתקדמים ביותר לחינוך, מחשוב ותשתיות למידה. כל מה שצריך כדי להפוך חזון למציאות.
                        </motion.p>
                    </div>

                    {/* ── Hero Spotlight ────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="relative mb-32 rounded-[4rem] overflow-hidden group shadow-2xl h-[500px]"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1600&auto=format&fit=crop" 
                            className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                            alt="NextBoard Pro"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/20 to-transparent" />
                        
                        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-16 md:p-24 text-right">
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="glass-dark inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 self-end"
                            >
                                <Sparkles size={14} className="text-[#007AFF]" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">נבחרת העונה 2025</span>
                            </motion.div>
                            <h2 className="text-4xl md:text-6xl font-apple-display text-white tracking-tighter leading-tight mb-6">
                                NextBoard Pro 86"<br />
                                <span className="text-[#007AFF]">אינטליגנציה בחינוך.</span>
                            </h2>
                            <p className="text-xl text-gray-300 font-medium mb-10 max-w-md ml-0 mr-auto lg:mr-0">
                                מסך ה-OLED הראשון עם עיבוד AI מובנה לניתוח למידה אקטיבית בזמן אמת.
                            </p>
                            <Link
                                to="/catalog/nextboard-pro-86"
                                className="inline-flex items-center gap-3 bg-white text-black font-bold px-10 py-5 rounded-full hover:bg-[#007AFF] hover:text-white transition-all self-end shadow-xl"
                            >
                                <span>גלה את המפרט</span>
                                <ChevronLeft size={20} />
                            </Link>
                        </div>

                        {/* Ambient Glow */}
                        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#007AFF]/20 rounded-full blur-[100px] animate-glow-pulse-heavy" />
                    </motion.div>

                    {/* ── Swimlanes ───────────────────────────────────── */}
                    {SWIMLANES.map((lane) => (
                        <Swimlane key={lane.id} lane={lane} />
                    ))}

                    {/* ── Final Callout ──────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-apple gestalt-card p-20 text-center relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-6xl font-apple-display text-[#1D1D1F] tracking-tighter mb-6">
                                לא מצאתם את מה שחיפשתם?
                            </h3>
                            <p className="text-2xl text-gray-400 font-medium mb-12 max-w-2xl mx-auto">
                                היועצים המומחים שלנו כאן כדי לאפיין עבורכם את הפתרון המדויק למוסד שלכם.
                            </p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Link
                                    to="/catalog"
                                    className="px-12 py-5 bg-black text-white rounded-full font-bold text-xl shadow-xl hover:scale-105 transition-transform"
                                >
                                    לכל הקטלוג
                                </Link>
                                <Link
                                    to="/contact"
                                    className="px-12 py-5 bg-white border border-gray-200 text-[#1D1D1F] rounded-full font-bold text-xl shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    דברו עם מומחה
                                </Link>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/5 blur-3xl rounded-full" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#AF52DE]/5 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default memo(DiscoverPage);
