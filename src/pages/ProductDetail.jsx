import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { HardwareCatalog } from '../utils/mockData';
import { MotionButton } from './CartPage';

const ProductDetail = () => {
    const { id } = useParams();
    const product = HardwareCatalog.find(p => p.id === parseInt(id)) || HardwareCatalog[0];

    const productStats = [
        { label: "עוצמת עיבוד / ביצועים", value: 95 },
        { label: "עמידות חומרים", value: 88 },
        { label: "קלות פעול", value: 92 }
    ];

    const hotspots = [
        { id: 1, x: "30%", y: "40%", title: "זכוכית מחוסמת 4 מ\"מ", desc: "עמידה במיוחד נגד שברים ושריטות בסביבה אינטנסיבית." },
        { id: 2, x: "70%", y: "60%", title: "חיבורי Type-C קדמיים", desc: "גישה נוחה ומהירה למורים להטענה ותצוגה במקביל." }
    ];

    const [activeHotspot, setActiveHotspot] = React.useState(null);

    return (
        <PageTransition>
            <div className="bg-white min-h-[calc(100vh-73px)] py-8 md:py-16 xl:py-24">
                <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-12 xl:px-24">

                    {/* Breadcrumbs - Overflow hidden on mobile if too long */}
                    <nav className="mb-8 md:mb-16 text-xs md:text-sm z-10 relative overflow-x-auto whitespace-nowrap hide-scrollbar pb-2">
                        <ol className="flex items-center space-x-2 space-x-reverse text-gray-500 font-bold tracking-wide">
                            <li><Link to="/" className="hover:text-[#007AFF] transition-colors py-1">ראשי</Link></li>
                            <li><span className="mx-1 md:mx-2 font-normal">/</span></li>
                            <li><Link to="/catalog" className="hover:text-[#007AFF] transition-colors py-1">קטלוג</Link></li>
                            <li><span className="mx-1 md:mx-2 font-normal">/</span></li>
                            <li><span className="text-[#1D1D1F] truncate max-w-[150px] md:max-w-none inline-block align-bottom">{product.name}</span></li>
                        </ol>
                    </nav>

                    {/* Split View: Stacks on mobile/iPad portrait, side-by-side on lg+ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-32 relative">

                        {/* Text Content (Normally Right via RTL, but visually top on mobile) */}
                        <div className="flex flex-col justify-center order-2 lg:order-1 z-10">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <span className="inline-flex items-center justify-center space-x-2 md:space-x-3 space-x-reverse px-4 md:px-5 py-2 rounded-full bg-emerald-50 max-w-max mb-6 md:mb-8">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-emerald-700 text-xs md:text-sm font-extrabold tracking-widest uppercase">מאושר משרד החינוך</span>
                                </span>

                                {/* Fluid typography: Text scales immensely */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1D1D1F] tracking-tight leading-[1.15] lg:leading-[1.1] mb-4 md:mb-6">
                                    {product.name}
                                </h1>

                                <p className="text-lg md:text-xl lg:text-2xl text-gray-500 font-light leading-relaxed mb-10 md:mb-12 max-w-xl">
                                    {product.description}
                                </p>

                                {/* Animated Stat Bars */}
                                <div className="mb-12 md:mb-16 flex flex-col gap-4 md:gap-6">
                                    {productStats.map((stat, idx) => (
                                        <div key={idx} className="w-full max-w-md">
                                            <div className="flex justify-between mb-2 md:mb-3 text-xs md:text-sm font-bold tracking-wide">
                                                <span className="text-gray-500">{stat.label}</span>
                                                <span className="text-[#1D1D1F]">{stat.value}%</span>
                                            </div>
                                            <div className="h-2.5 md:h-3 w-full bg-[#F5F5F7] rounded-full overflow-hidden relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${stat.value}%` }}
                                                    viewport={{ once: true, margin: "-50px" }}
                                                    transition={{ duration: 1.2, delay: 0.2 + (idx * 0.2), ease: [0.16, 1, 0.3, 1] }}
                                                    className="absolute inset-y-0 right-0 bg-[#007AFF] rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Clean Data separation no borders */}
                                <div className="bg-[#F5F5F7] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 mb-10">
                                    <h3 className="text-xs md:text-sm font-black text-[#1D1D1F] uppercase tracking-[0.1em] md:tracking-[0.2em] mb-6 md:mb-10">מפרט טכני תמציתי</h3>
                                    <div className="grid grid-cols-2 gap-y-6 md:gap-y-10 gap-x-6 md:gap-x-12">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-xs md:text-sm font-bold text-gray-400 uppercase md:tracking-widest mb-1 md:mb-2">{key}</p>
                                                <p className="text-lg md:text-xl font-black text-[#1D1D1F] leading-snug break-words">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </motion.div>
                        </div>

                        {/* Image Area with Hotspots (Visually Top on Mobile) */}
                        <div className="flex flex-col items-center justify-start order-1 lg:order-2 z-0 relative w-full mb-6 lg:mb-0">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full aspect-square bg-[#F5F5F7] rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.05)] md:shadow-[0_40px_80px_rgba(0,0,0,0.05)]"
                            >
                                <img onError={(e) => { e.target.onerror = null; e.target.src="https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }} onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply p-8 md:p-12 transition-transform duration-[1.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                                />

                                {/* Interactive Hotspots - hidden on extremely tight mobile heights but scale otherwise */}
                                {hotspots.map((spot) => (
                                    <div
                                        key={spot.id}
                                        className="absolute z-20 group/hotspot"
                                        style={{ top: spot.y, left: spot.x }}
                                        onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)} // Touch friendly toggle
                                        onMouseEnter={() => setActiveHotspot(spot.id)}
                                        onMouseLeave={() => setActiveHotspot(null)}
                                    >
                                        <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer">
                                            <motion.div
                                                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 bg-white rounded-full shadow-sm"
                                            />
                                            <div className="relative w-6 h-6 md:w-7 md:h-7 bg-white/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#1D1D1F] font-black text-lg md:text-xl leading-none pt-0.5 pointer-events-none">
                                                +
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {activeHotspot === spot.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
                                                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                                    className="absolute top-12 md:top-14 right-1/2 translate-x-1/2 w-48 md:w-64 bg-white/90 backdrop-blur-2xl p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] z-30 transform-gpu cursor-default"
                                                >
                                                    <h4 className="text-[#1D1D1F] font-black text-sm md:text-lg mb-1 md:mb-2 leading-tight">{spot.title}</h4>
                                                    <p className="text-gray-500 font-medium text-xs md:text-sm leading-relaxed">{spot.desc}</p>
                                                    <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] md:border-l-[10px] border-r-[8px] md:border-r-[10px] border-b-[10px] md:border-b-[12px] border-transparent border-b-white/90 drop-shadow-sm"></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                    </div>
                </div>

                {/* Sticky Mobile/Desktop Action Bar for PDP */}
                {/* On mobile: Sticky bottom fixed. On Desktop: relative within flow */}
                <div className="fixed sm:relative bottom-0 sm:bottom-auto left-0 right-0 sm:mt-16 sm:max-w-[1500px] sm:mx-auto sm:px-6 md:px-12 xl:px-24 z-[55] sm:z-10">
                    <div className="bg-white/90 sm:bg-transparent backdrop-blur-2xl sm:backdrop-blur-none border-t border-gray-100 sm:border-none p-4 sm:p-0 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 sm:gap-12 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.05)] sm:shadow-none">

                        {/* Price summary hidden on extreme mobile height, visible normally */}
                        <div className="hidden sm:block text-right w-full sm:w-auto">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">מחיר מוסדי בלעדי</span>
                            <span className="text-4xl md:text-6xl font-black tracking-tighter text-[#1D1D1F]">
                                ₪{product.contractPrice.toLocaleString()}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row gap-3 sm:gap-6 w-full sm:w-auto">
                            <MotionButton variant="ghost" className="flex-1 sm:flex-none sm:w-48 px-2 sm:px-8 py-4 sm:py-6 text-sm sm:text-xl font-bold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-gray-200 rounded-[1.5rem] sm:rounded-full whitespace-nowrap">
                                מפרט חלופה
                            </MotionButton>
                            <MotionButton variant="primary" className="flex-[2] sm:flex-none sm:w-80 px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-xl font-black rounded-[1.5rem] sm:rounded-full shadow-[0_10px_30px_rgba(0,122,255,0.3)] hover:shadow-[0_15px_40px_rgba(0,122,255,0.4)]">
                                <span className="hidden sm:inline">הוסף למרחב הלמידה</span>
                                <span className="sm:hidden">הוסף ₪{product.contractPrice.toLocaleString()}</span>
                            </MotionButton>
                        </div>
                    </div>
                </div>
                {/* Visual padding to account for fixed bottom bar on mobile */}
                <div className="h-24 sm:h-0 w-full block"></div>

            </div>
        </PageTransition>
    );
};

export default ProductDetail;
