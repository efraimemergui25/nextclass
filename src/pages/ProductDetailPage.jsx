import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const ProductDetailPage = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Placeholder data representing the requested layout
    const specs = [
        { label: "רזולוציה", value: "4K UHD" },
        { label: "זכוכית", value: "מחוסמת 4mm" },
        { label: "מערכת", value: "Android 13" },
        { label: "אחריות", value: "3 שנים באתר לקוח" },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-light pt-32 pb-24 px-6 md:px-12 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-[1400px] mx-auto">

                    {/* Right Column (Visual - RTL Start) */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full relative"
                    >
                        {/* Sticky container for desktop */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm flex items-center justify-center aspect-square lg:sticky lg:top-32 group overflow-hidden">
                            <img
                                src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=1200"
                                alt="Product View"
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out"
                            />
                        </div>
                    </motion.div>

                    {/* Left Column (Info - RTL End) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col"
                    >
                        {/* Breadcrumbs */}
                        <div className="text-sm font-medium text-gray-400 mb-6 flex items-center gap-2">
                            <Link to="/" className="hover:text-brand-blue transition-colors">ראשי</Link>
                            <span>/</span>
                            <Link to="/catalog" className="hover:text-brand-blue transition-colors">מסכי מגע</Link>
                            <span>/</span>
                            <span className="text-gray-600">TouchBoard Pro 75"</span>
                        </div>

                        {/* Title & Price */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-brand-dark leading-tight mb-4 tracking-tight">
                            TouchBoard Pro 75"
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl leading-relaxed">
                            המסך האינטראקטיבי המתקדם ביותר לכיתת הלימוד. עכשיו עם מערכת הפעלה מהירה יותר, עט חכם וזכוכית אנטי-בקטריאלית.
                        </p>
                        <div className="text-3xl md:text-4xl font-bold text-brand-blue mb-12">
                            ₪9,500
                        </div>

                        {/* Specs Grid (Gestalt Proximity) */}
                        <div className="grid grid-cols-2 gap-6 mb-12">
                            {specs.map((spec, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50">
                                    <span className="block text-xs font-bold text-brand-blue uppercase tracking-widest mb-1">{spec.label}</span>
                                    <span className="block text-lg font-bold text-brand-dark">{spec.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mt-auto">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-600 hover:shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-brand-blue/30"
                            >
                                הוסף להצעת מחיר / עגלה
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, backgroundColor: "#F9FAFB" }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-white text-brand-dark border-2 border-gray-200 py-5 rounded-2xl font-bold text-lg transition-all focus:outline-none"
                            >
                                הורד מפרט טכני (PDF)
                            </motion.button>
                        </div>

                    </motion.div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ProductDetailPage;
