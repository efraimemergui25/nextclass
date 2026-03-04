import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { HardwareCatalog } from '../utils/mockData';
import { MotionButton } from './CartPage';

const ProductDetail = () => {
    const { id } = useParams();
    const product = HardwareCatalog.find(p => p.id === parseInt(id)) || HardwareCatalog[0];

    // Mock Dynamic Stats
    const productStats = [
        { label: "עוצמת עיבוד / ביצועים", value: 95 },
        { label: "עמידות חומרים (תקן צבאי/חינוכי)", value: 88 },
        { label: "קלות התקנה ותפעול", value: 92 }
    ];

    // Mock Hotspots for generic images
    const hotspots = [
        { id: 1, x: "30%", y: "40%", title: "זכוכית מחוסמת 4 מ\"מ", desc: "עמידה במיוחד נגד שברים ושריטות בסביבה אינטנסיבית." },
        { id: 2, x: "70%", y: "60%", title: "חיבורי Type-C קדמיים", desc: "גישה נוחה ומהירה למורים להטענה ותצוגה במקביל." }
    ];

    const [activeHotspot, setActiveHotspot] = React.useState(null);

    return (
        <PageTransition>
            <div className="bg-white min-h-[calc(100vh-73px)] py-12 lg:py-24">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12">

                    {/* Breadcrumbs */}
                    <nav className="mb-12 text-sm z-10 relative">
                        <ol className="flex items-center space-x-2 space-x-reverse text-gray-500">
                            <li><Link to="/" className="hover:text-[#007AFF] transition-colors">ראשי</Link></li>
                            <li><span className="mx-2">/</span></li>
                            <li><Link to="/catalog" className="hover:text-[#007AFF] transition-colors">קטלוג מוצרים</Link></li>
                            <li><span className="mx-2">/</span></li>
                            <li><span className="text-[#1D1D1F] font-medium">{product.name}</span></li>
                        </ol>
                    </nav>

                    {/* Split View */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 relative">

                        {/* Visually Right (since RTL) - Content Area */}
                        <div className="flex flex-col justify-center order-2 lg:order-1 z-10">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            >
                                <span className="inline-flex items-center space-x-2 space-x-reverse px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold tracking-wide mb-6">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>מאושר משרד החינוך</span>
                                </span>

                                <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1D1D1F] tracking-tight leading-tight mb-4">
                                    {product.name}
                                </h1>

                                <p className="text-xl text-gray-500 font-light leading-relaxed mb-10 max-w-lg">
                                    {product.description}
                                </p>

                                {/* Interactive Data Visualization: Animated Stat Bars */}
                                <div className="mb-10 space-y-6">
                                    {productStats.map((stat, idx) => (
                                        <div key={idx} className="w-full max-w-md">
                                            <div className="flex justify-between mb-2 text-sm font-semibold">
                                                <span className="text-gray-600">{stat.label}</span>
                                                <span className="text-[#1D1D1F]">{stat.value}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${stat.value}%` }}
                                                    viewport={{ once: true, margin: "-50px" }}
                                                    transition={{ duration: 1.2, delay: 0.2 + (idx * 0.2), ease: [0.16, 1, 0.3, 1] }}
                                                    className="h-full bg-gradient-to-l from-[#007AFF] to-blue-400 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pricing */}
                                <div className="mb-12">
                                    <div className="flex items-end gap-4 mb-2">
                                        <span className="text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
                                            ₪{product.contractPrice.toLocaleString()}
                                        </span>
                                        <span className="text-lg text-gray-400 line-through mb-1">
                                            ₪{product.basePrice.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-[#007AFF]">מחיר מיוחד למוסדות לימוד</p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                                    <MotionButton variant="primary" className="flex-1 px-8 py-4 text-lg">
                                        הוסף לעגלה
                                    </MotionButton>
                                    <MotionButton variant="ghost" className="flex-1 px-8 py-4 text-lg">
                                        מפרט טכני מלא
                                    </MotionButton>
                                </div>

                                {/* Gestalt Common Region: Specs Grid */}
                                <div className="bg-[#F5F5F7] rounded-3xl p-8 border border-gray-100/50">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">מפרט טכני תמציתי</h3>
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                        {Object.entries(product.specs).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-sm font-medium text-gray-500 capitalize mb-1">{key}</p>
                                                <p className="font-semibold text-[#1D1D1F]">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Visually Left (since RTL) - Image Area with Hotspots */}
                        <div className="flex items-center justify-center order-1 lg:order-2 z-0 relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-[#F5F5F7] rounded-[2rem] overflow-hidden group shadow-2xl shadow-gray-200/50"
                            >
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                {/* Subtle internal shadow */}
                                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.05)] pointer-events-none" />

                                {/* Interactive Hotspots */}
                                {hotspots.map((spot) => (
                                    <div
                                        key={spot.id}
                                        className="absolute z-20 group/hotspot"
                                        style={{ top: spot.y, left: spot.x }}
                                        onMouseEnter={() => setActiveHotspot(spot.id)}
                                        onMouseLeave={() => setActiveHotspot(null)}
                                    >
                                        {/* Pulsing Dot */}
                                        <div className="relative w-8 h-8 flex items-center justify-center cursor-pointer">
                                            <motion.div
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 bg-white rounded-full"
                                            />
                                            <div className="relative w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center border border-gray-100 text-[#007AFF] font-bold text-lg leading-none pt-0.5">
                                                +
                                            </div>
                                        </div>

                                        {/* Tooltip */}
                                        <AnimatePresence>
                                            {activeHotspot === spot.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.15 } }}
                                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                    className="absolute top-10 right-1/2 translate-x-1/2 w-56 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-30 transform-gpu cursor-default"
                                                >
                                                    <h4 className="text-[#1D1D1F] font-bold text-sm mb-1">{spot.title}</h4>
                                                    <p className="text-gray-500 text-xs leading-relaxed">{spot.desc}</p>

                                                    {/* Triangle pointer visually connecting tooltip to dot */}
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/95 drop-shadow-sm"></div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}

                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ProductDetail;
