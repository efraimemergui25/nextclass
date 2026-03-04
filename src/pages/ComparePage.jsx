import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const products = [
    {
        name: 'TouchBoard Pro 75"',
        image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=400",
        screenSize: '75"',
        resolution: "4K UHD",
        touch: "20 נקודות IR",
        os: "Android 13",
        glass: "מחוסמת 4mm",
        brightness: "450 nits",
        warranty: "3 שנים",
        speakers: "✓",
        wifi: "✓",
        price: "₪9,500"
    },
    {
        name: 'TouchBoard Lite 65"',
        image: "https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=400",
        screenSize: '65"',
        resolution: "4K UHD",
        touch: "10 נקודות IR",
        os: "Android 12",
        glass: "מחוסמת 3mm",
        brightness: "350 nits",
        warranty: "2 שנים",
        speakers: "✓",
        wifi: "✓",
        price: "₪6,200"
    },
    {
        name: 'CampusSign 86"',
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=400",
        screenSize: '86"',
        resolution: "4K UHD",
        touch: "ללא מגע",
        os: "CMS ייעודי",
        glass: "מחוסמת 5mm",
        brightness: "700 nits",
        warranty: "3 שנים",
        speakers: "—",
        wifi: "✓",
        price: "₪13,200"
    }
];

const specs = [
    { key: "screenSize", label: "גודל מסך" },
    { key: "resolution", label: "רזולוציה" },
    { key: "touch", label: "טכנולוגיית מגע" },
    { key: "os", label: "מערכת הפעלה" },
    { key: "glass", label: "זכוכית" },
    { key: "brightness", label: "בהירות" },
    { key: "warranty", label: "אחריות" },
    { key: "speakers", label: "רמקולים מובנים" },
    { key: "wifi", label: "WiFi" },
    { key: "price", label: "מחיר מוסדי" },
];

const ComparePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-white pt-32 pb-24 px-6 w-full">
                <div className="max-w-[1200px] mx-auto">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-brand-dark tracking-tight mb-4">
                            מצאו את המסך המושלם לכיתה שלכם.
                        </h1>
                        <p className="text-lg text-gray-500 font-light">
                            השוואה מפורטת בין הדגמים המובילים שלנו.
                        </p>
                    </motion.div>

                    {/* Comparison Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="overflow-x-auto pb-4 -mx-6 px-6"
                    >
                        <div className="min-w-[700px]">

                            {/* Product Headers Row */}
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {/* Empty top-left cell */}
                                <div />
                                {products.map((product, idx) => (
                                    <div key={idx} className="text-center">
                                        <div className="w-full aspect-square bg-brand-light rounded-2xl p-4 flex items-center justify-center mb-4 overflow-hidden">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                        </div>
                                        <h3 className="font-black text-brand-dark text-base md:text-lg">
                                            {product.name}
                                        </h3>
                                    </div>
                                ))}
                            </div>

                            {/* Spec Rows */}
                            {specs.map((spec, rowIdx) => (
                                <div
                                    key={spec.key}
                                    className={`grid grid-cols-4 gap-4 py-4 px-4 rounded-xl ${rowIdx % 2 === 0 ? 'bg-gray-50/80' : 'bg-white'
                                        }`}
                                >
                                    {/* Spec Label */}
                                    <div className="flex items-center">
                                        <span className="font-bold text-brand-dark text-sm">
                                            {spec.label}
                                        </span>
                                    </div>
                                    {/* Product Values */}
                                    {products.map((product, colIdx) => {
                                        const value = product[spec.key];
                                        const isCheck = value === "✓";
                                        const isDash = value === "—";
                                        const isPrice = spec.key === "price";

                                        return (
                                            <div key={colIdx} className="flex items-center justify-center text-center">
                                                {isCheck ? (
                                                    <span className="text-brand-blue font-black text-xl">✓</span>
                                                ) : isDash ? (
                                                    <span className="text-gray-300 text-lg">—</span>
                                                ) : isPrice ? (
                                                    <span className="font-black text-brand-dark text-lg">{value}</span>
                                                ) : (
                                                    <span className="text-gray-600 text-sm font-medium">{value}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* CTA Row */}
                            <div className="grid grid-cols-4 gap-4 mt-8">
                                <div />
                                {products.map((_, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors"
                                    >
                                        הוסף להצעת מחיר
                                    </motion.button>
                                ))}
                            </div>

                        </div>
                    </motion.div>

                </div>
            </div>
        </PageTransition>
    );
};

export default ComparePage;
