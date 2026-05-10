import React, { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Zap, Gift, ChevronLeft } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { useSettings } from '../context/SettingsContext';

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
        className="mb-20"
    >
        <div className="flex items-end justify-between mb-12 relative">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm text-[#007AFF]">
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
Swimlane.displayName = 'Swimlane';

const DiscoverPage = () => {
    const { getSetting } = useSettings();
    const { activeProducts, bestSellers, newArrivals, dealProducts, featuredProduct } = useProducts();

    const SWIMLANES = useMemo(() => {
        const lanes = [];

        // Best sellers — sorted by real sold count
        if (bestSellers.length > 0) {
            lanes.push({
                id: 'top-sellers',
                label: getSetting('discover_best_label', 'הנמכרים ביותר'),
                badge: 'trending',
                sub: `המוצרים שמוסדות החינוך בוחרים שוב ושוב · ${bestSellers[0]?.sold || 0}+ יחידות נמכרו`,
                items: bestSellers,
                icon: <TrendingUp size={18} />,
            });
        }

        // New arrivals — real isNew === true
        const newItems = newArrivals.length >= 2 ? newArrivals : activeProducts.filter(p => !p.isFeatured).slice(10, 14);
        if (newItems.length > 0) {
            lanes.push({
                id: 'new-arrivals',
                label: getSetting('discover_new_label', 'חדש בחנות'),
                badge: 'new',
                sub: 'טכנולוגיה חדישה שהגיעה ממש עכשיו',
                items: newItems,
                icon: <Zap size={18} />,
            });
        }

        // Deals — real salePrice products
        const dealItems = dealProducts.length >= 2 ? dealProducts : activeProducts.filter(p => p.price > 1000).slice(20, 24);
        if (dealItems.length > 0) {
            lanes.push({
                id: 'deals',
                label: getSetting('discover_deals_label', 'מבצעים מיוחדים'),
                badge: 'deal',
                sub: 'הזדמנויות שלא כדאי לפספס',
                items: dealItems,
                icon: <Gift size={18} />,
            });
        }

        return lanes;
    }, [bestSellers, newArrivals, dealProducts, activeProducts, getSetting]);

    // Hero spotlight — admin-controlled featured product
    const hero = featuredProduct;

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-28 pb-24 w-full overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto px-6">

                    {/* ── Page Header ─────────────────────────────────── */}
                    <div className="max-w-2xl pt-16 mb-24 relative z-10">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] font-black uppercase tracking-[0.6em] text-[#007AFF]/60 mb-10 block"
                        >
                            NextClass Discovery
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="text-5xl md:text-[5.5rem] font-bold tracking-tight leading-[1.1] text-[#1D1D1F] whitespace-nowrap"
                        >
                            {getSetting('discover_title', 'הטכנולוגיה שמעצבת את המחר.')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 1 }}
                            className="text-lg md:text-xl text-[#86868B] font-medium leading-relaxed max-w-2xl mt-8 tracking-tight"
                        >
                            {getSetting('discover_desc', 'אוסף נבחר של הכלים המתקדמים ביותר לחינוך, מחשוב ותשתיות למידה. כל מה שצריך כדי להפוך חזון למציאות.')}
                        </motion.p>
                    </div>

                    {/* ── Hero Spotlight — admin-controlled featured product ── */}
                    {hero && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="relative mb-24 rounded-[3.5rem] overflow-hidden group shadow-2xl h-[420px]"
                        >
                            <img
                                src={hero.image}
                                className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105"
                                alt={hero.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/20 to-transparent" />

                            <div className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center p-12 md:p-16 text-right">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="glass-dark inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 self-end"
                                >
                                    <Sparkles size={12} className="text-[#007AFF]" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                        {getSetting('discover_hero_badge', 'נבחרת העונה')} · {hero.sold ? `${hero.sold}+ נמכרו` : 'טכנולוגיה מובילה'}
                                    </span>
                                </motion.div>
                                <h2 className="text-3xl md:text-5xl font-apple-display text-white tracking-tighter leading-tight mb-4">
                                    {hero.title}
                                </h2>
                                <p className="text-lg text-gray-300 font-medium mb-8 max-w-sm ml-0 mr-auto lg:mr-0 line-clamp-2">
                                    {hero.description}
                                </p>
                                <Link
                                    to={`/catalog/${hero.id}`}
                                    className="inline-flex items-center gap-3 bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-[#007AFF] hover:text-white transition-all self-end shadow-xl text-sm"
                                >
                                    <span>{getSetting('discover_hero_cta', 'גלה את המפרט')}</span>
                                    <ChevronLeft size={18} />
                                </Link>
                            </div>

                            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#007AFF]/20 rounded-full blur-[100px] animate-glow-pulse-heavy" />
                        </motion.div>
                    )}

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
                                {getSetting('discover_callout_title', 'לא מצאתם את מה שחיפשתם?')}
                            </h3>
                            <p className="text-2xl text-gray-400 font-medium mb-12 max-w-2xl mx-auto">
                                {getSetting('discover_callout_desc', 'היועצים המומחים שלנו כאן כדי לאפיין עבורכם את הפתרון המדויק למוסד שלכם.')}
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
