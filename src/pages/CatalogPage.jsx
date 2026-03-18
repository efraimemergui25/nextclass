import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import products from '../data/products';

const CatalogPage = () => {
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemObj = {
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 } }
    };

    return (
        <PageTransition>
            {/* pt-20 mobile, pt-32 desktop to clear header smoothly */}
            <div className="bg-[#F5F5F7] min-h-screen pt-16 md:pt-32 pb-24 md:pb-32 w-full overflow-x-hidden">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12 lg:px-16 w-full">

                    {/* Top Bar: Title & Filter Button */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 md:mb-24 gap-6 md:gap-8">
                        <div className="text-center md:text-right w-full md:w-auto">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1D1D1F] tracking-tighter mb-3 md:mb-2 leading-tight">
                                פתרונות למוסדות
                            </h1>
                            <p className="text-lg md:text-xl font-normal text-gray-500 leading-relaxed">ציוד קצה שנבחר בקפידה למרחבי למידה מתקדמים.</p>
                        </div>
                        {/* 44min height touch target + full width on mobile  */}
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="w-full md:w-auto flex items-center justify-center md:justify-start gap-3 px-8 py-4 min-h-[56px] bg-white text-[#1D1D1F] rounded-full transition-all duration-300 font-bold text-lg focus:outline-none shadow-sm hover:shadow-md active:scale-95"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span>סינון ומיון</span>
                        </button>
                    </div>

                    {/* The Grid: 1 Col Mobile -> 2 Col iPad -> 3 Col Desktop */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-16 xl:gap-24"
                    >
                        {products.map((product) => (
                            <Link to={`/catalog/${product.id}`} key={product.id} className="block group outline-none h-full">
                                <motion.div
                                    variants={itemObj}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                    // Massive padding on desktop to soft touch on mobile `p-8 md:p-12`
                                    className="flex flex-col bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 transition-all duration-500 hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] h-full relative overflow-hidden"
                                >
                                    {/* Image Area */}
                                    <div className="relative aspect-square mb-8 md:mb-12 flex items-center justify-center p-4">
                                        <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex flex-col flex-1 items-center text-center justify-end">
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-[#1D1D1F] mb-3 md:mb-4 leading-snug lg:leading-tight tracking-tighter">{product.title}</h3>
                                        <p className="text-sm md:text-base font-normal text-gray-500 mb-6 lg:mb-8 line-clamp-2 md:line-clamp-3 px-2 leading-relaxed">{product.description}</p>
                                        <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1D1D1F] tracking-tighter mt-auto">
                                            ₪{product.price.toLocaleString()}
                                        </p>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </motion.div>

                </div>

                {/* Filter Side-Drawer (Offcanvas) */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[70] p-0 m-0"
                            />
                            {/* Drawer: 100% width on mobile, 400px on desktop */}
                            <motion.div
                                orphans
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                className="fixed top-0 right-0 bottom-0 w-full md:max-w-md bg-white/95 backdrop-blur-3xl z-[80] shadow-2xl flex flex-col md:rounded-l-3xl overflow-hidden"
                            >
                                <div className="p-6 md:p-8 flex justify-between items-center mb-4 md:mb-8 border-b border-gray-100 md:border-none">
                                    <h2 className="text-2xl md:text-4xl font-black text-[#1D1D1F] tracking-tighter">סינון ומיון</h2>
                                    <button onClick={() => setIsFilterOpen(false)} className="p-3 -m-3 rounded-full hover:bg-[#F5F5F7] transition-colors text-[#1D1D1F]">
                                        <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-10 md:gap-16">
                                    <div>
                                        <h3 className="text-xs md:text-sm font-bold text-gray-400 tracking-widest uppercase mb-4 md:mb-6">סוג ציוד</h3>
                                        <ul className="space-y-4 md:space-y-6 text-xl md:text-2xl font-extrabold text-[#1D1D1F]">
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>מסכים אינטראקטיביים והקרנה</span></label></li>
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>מחשוב לצוות ותלמידים</span></label></li>
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>מעבדות STEM וחדשנות</span></label></li>
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>אודיו ווידאו</span></label></li>
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>תשתיות ועגלות טעינה</span></label></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-xs md:text-sm font-bold text-gray-400 tracking-widest uppercase mb-4 md:mb-6">תקנים ואישורים</h3>
                                        <ul className="space-y-4 md:space-y-6 text-xl md:text-2xl font-extrabold text-[#1D1D1F]">
                                            <li><label className="flex items-center space-x-4 md:space-x-6 space-x-reverse cursor-pointer group p-2 -m-2"><input type="checkbox" className="w-6 h-6 md:w-8 md:h-8 accent-[#007AFF] rounded bg-gray-100 border-none cursor-pointer" defaultChecked /><span>מאושר משרד החינוך</span></label></li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 mt-auto flex-shrink-0 bg-white md:bg-transparent">
                                    <button onClick={() => setIsFilterOpen(false)} className="w-full py-5 md:py-6 bg-[#007AFF] text-white rounded-full font-bold tracking-wide text-xl md:text-2xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl focus:outline-none active:scale-95">
                                        הצג תוצאות
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </PageTransition>
    );
};

export default CatalogPage;
