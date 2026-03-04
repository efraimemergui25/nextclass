import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { HardwareCatalog } from '../utils/mockData';
import { MotionButton } from './CartPage';
const CatalogPage = () => {
    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemObj = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] min-h-screen py-12">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-12">

                    {/* RTL: Sidebar acts visually as the right pane */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="pl-6 sticky top-32">
                            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-8">סינון קטגוריות</h2>

                            <div className="space-y-8">
                                {/* Filter Group (Law of Common Region via spacing/grouping) */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">סוג ציוד</h3>
                                    <ul className="space-y-3">
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" defaultChecked /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">מסכי מגע (2)</span></label></li>
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" defaultChecked /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">עמדות מידע (1)</span></label></li>
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" defaultChecked /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">מעבדות STEM (3)</span></label></li>
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" defaultChecked /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">תוכנה (1)</span></label></li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">תקנים ואישורים</h3>
                                    <ul className="space-y-3">
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" defaultChecked /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">מאושר משרד החינוך</span></label></li>
                                        <li><label className="flex items-center space-x-3 space-x-reverse cursor-pointer group"><input type="checkbox" className="form-checkbox h-5 w-5 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF] transition duration-150 ease-in-out" /><span className="text-gray-700 group-hover:text-[#1D1D1F] transition-colors">עמידות לתקן צבאי</span></label></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1">
                        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
                            <div>
                                <h1 className="text-4xl font-extrabold text-[#1D1D1F] tracking-tight mb-2">פתרונות טכנולוגיים לחינוך</h1>
                                <p className="text-gray-500">מציג {HardwareCatalog.length} פריטים פרימיום</p>
                            </div>
                            <div className="hidden sm:block">
                                <select className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 cursor-pointer border-none pl-8 rtl:pr-8 pr-2">
                                    <option>מיון לפי: המלצת המערכת</option>
                                    <option>מחיר: נמוך לגבוה</option>
                                    <option>מחיר: גבוה לנמוך</option>
                                    <option>הכי פופולרי</option>
                                </select>
                            </div>
                        </div>

                        {/* Product Grid (Law of Similarity & Common Region) */}
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12"
                        >
                            {HardwareCatalog.map((product) => (
                                <motion.div key={product.id} variants={itemObj} className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                                    {/* Image Area - Standardized Aspect Ratio */}
                                    <div className="relative aspect-square bg-[#F5F5F7] overflow-hidden p-6 flex flex-col items-center justify-center">
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                                            <span className={`text-xs font-bold ${product.stockStatus.includes('מלאי') ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                {product.stockStatus}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex flex-col flex-1 p-8">
                                        <p className="text-sm font-medium text-gray-400 tracking-wide uppercase mb-2">{product.sku}</p>
                                        <h3 className="text-xl md:text-2xl font-bold text-[#1D1D1F] mb-4 leading-tight">{product.name}</h3>
                                        <p className="text-base font-normal text-gray-600 leading-relaxed mb-8 flex-1 line-clamp-3">
                                            {product.description}
                                        </p>

                                        <div className="mt-auto">
                                            <div className="flex items-end justify-between mb-8">
                                                <div>
                                                    <p className="text-xs text-gray-400 line-through mb-1">₪{product.basePrice.toLocaleString()}</p>
                                                    <p className="text-2xl font-bold text-[#1D1D1F]">
                                                        ₪{product.contractPrice.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <Link to={`/catalog/${product.id}`} className="block w-full">
                                                <MotionButton variant="ghost" className="w-full py-4 text-[#007AFF] bg-blue-50/50 hover:bg-blue-50 font-bold text-base">
                                                    גלה עוד
                                                </MotionButton>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </main>

                </div>
            </div>
        </PageTransition>
    );
};

export default CatalogPage;
