import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import products from '../data/products';

// ─── Swimlane data (memoised at module level — never changes) ────────────────
const SWIMLANES = [
    {
        id: 'top-sellers',
        label: '🔥 הנמכרים ביותר',
        sub: 'המוצרים שמוסדות החינוך בוחרים שוב ושוב',
        items: products.slice(0, 4),
    },
    {
        id: 'new-arrivals',
        label: '✨ חדש בחנות',
        sub: 'טכנולוגיה חדישה שהגיעה ממש עכשיו',
        items: products.slice(10, 14),
    },
    {
        id: 'deals',
        label: '🏷️ מבצעים מיוחדים',
        sub: 'הזדמנויות שלא כדאי לפספס',
        items: products.slice(20, 24),
    },
];

// ─── Section header animation variants ───────────────────────────────────────
const sectionVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } },
};

const cardContainerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.08 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
};

// ─── Swimlane Component ───────────────────────────────────────────────────────
const Swimlane = memo(({ lane }) => (
    <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="mb-20"
    >
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-gray-100">
            <div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[#1D1D1F]">
                    {lane.label}
                </h2>
                <p className="text-base text-[#86868B] mt-1">{lane.sub}</p>
            </div>
            <Link
                to="/catalog"
                className="shrink-0 flex items-center gap-1.5 text-[#007AFF] font-semibold text-sm hover:underline transition-opacity hover:opacity-80"
            >
                הכל
                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </Link>
        </div>

        {/* Product Grid */}
        <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            {(lane.items ?? []).map((product) => (
                <motion.div key={product?.id ?? Math.random()} variants={cardVariants}>
                    <ProductCard product={product} />
                </motion.div>
            ))}
        </motion.div>
    </motion.section>
));
Swimlane.displayName = 'Swimlane';

// ─── Page ─────────────────────────────────────────────────────────────────────
const DiscoverPage = () => {
    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-4 md:px-8">

                    {/* ─── Page Header ─────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                        className="mb-16 text-right"
                    >
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                            <Link to="/" className="hover:text-[#007AFF] transition-colors">ראשי</Link>
                            <span>/</span>
                            <span className="text-gray-600 font-medium">גלה את המוצרים שלנו</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1D1D1F] leading-[1.05] mb-4">
                            גלה את המוצרים שלנו
                        </h1>
                        <p className="text-xl text-[#86868B] max-w-2xl leading-relaxed">
                            חנות הטכנולוגיה המובילה לחינוך — ציוד פרמיום, מחירים הוגנים, ווחוויית קנייה ישראלית.
                        </p>

                        {/* Stats Strip */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.6 }}
                            className="flex flex-wrap gap-8 mt-10"
                        >
                            {[
                                { num: '50+', label: 'מוצרים בחנות' },
                                { num: '500+', label: 'מוסדות לקוחות' },
                                { num: '4.9★', label: 'דירוג לקוחות' },
                            ].map(({ num, label }) => (
                                <div key={label} className="flex flex-col">
                                    <span className="text-3xl font-black text-[#1D1D1F] tracking-tighter">{num}</span>
                                    <span className="text-sm text-[#86868B]">{label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* ─── Hero Banner ────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                        className="relative mb-20 rounded-[2.5rem] overflow-hidden bg-[#1D1D1F] min-h-[220px] flex items-center px-10 md:px-16 py-12"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1600&auto=format&fit=crop')",
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/50 to-transparent rounded-[2.5rem]" />
                        <div className="relative z-10 text-right max-w-lg">
                            <span className="text-[#007AFF] font-bold text-sm uppercase tracking-widest mb-3 block">קולקציית הדגל 2025</span>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight mb-4">
                                NextBoard Pro 86"
                            </h2>
                            <p className="text-gray-300 text-base leading-relaxed mb-6">
                                מסך OLED אינטראקטיבי עם AI מובנה ורזולוציית 4K. החוויה שמשנה את הכיתה.
                            </p>
                            <Link
                                to="/catalog"
                                className="inline-flex items-center gap-2 bg-white text-[#1D1D1F] font-bold px-7 py-3.5 rounded-full hover:bg-[#007AFF] hover:text-white transition-all duration-300 hover:shadow-xl text-sm"
                            >
                                גלה עכשיו
                                <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </motion.div>

                    {/* ─── Swimlanes ───────────────────────────────────── */}
                    {SWIMLANES.map((lane) => (
                        <Swimlane key={lane.id} lane={lane} />
                    ))}

                    {/* ─── Bottom CTA ──────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="mt-8 text-center py-16 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm"
                    >
                        <h3 className="text-3xl font-black tracking-tighter text-[#1D1D1F] mb-3">
                            לא מצאת מה שחיפשת?
                        </h3>
                        <p className="text-[#86868B] mb-8">כל הקטלוג שלנו פתוח בפניך — חפש, סנן, השווה.</p>
                        <Link
                            to="/catalog"
                            className="inline-flex items-center gap-2 bg-[#007AFF] text-white font-bold px-10 py-4 rounded-full text-base hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            לכל הקטלוג
                            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default memo(DiscoverPage);
