import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StickyBuyBar = ({ isVisible, product, activeColor, formattedPrice, isInCart, handleCartToggle }) => {
 return (
 <AnimatePresence>
 {isVisible && (
 <motion.div
 initial={{ y: -100, opacity: 0, scale: 0.95 }}
 animate={{ y: 0, opacity: 1, scale: 1 }}
 exit={{ y: -100, opacity: 0, scale: 0.95 }}
 transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 0.8 }}
 className="fixed top-6 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-2xl flex items-center justify-between px-6 py-3 rounded-full bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_12px_48px_rgba(0,0,0,0.15)] transform-gpu will-change-transform"
 dir="rtl"
 >
 {/* Right side: Thumbnail + Title */}
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-white/50 border border-white/30 overflow-hidden shrink-0 hidden sm:flex items-center justify-center">
 {product?.image ? (
 <img src={product.image} alt={product.title} className="w-8 h-8 object-cover mix-blend-multiply" />
 ) : null}
 </div>
 <div className="flex flex-col">
 <h3 className="text-sm font-black text-[#1D1D1F] tracking-tighter truncate max-w-[140px] md:max-w-[200px]">
 {product?.title}
 </h3>
 <span className="text-[10px] font-bold text-gray-400">{activeColor?.name}</span>
 </div>
 </div>

 {/* Left side: Price + CTA */}
 <div className="flex items-center gap-5">
 <span className="text-lg font-black text-[#1D1D1F] tracking-tighter hidden sm:block">{formattedPrice}</span>
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleCartToggle}
 className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${isInCart
 ? 'bg-black text-white hover:bg-gray-800'
 : 'bg-[#007AFF] text-white hover:bg-blue-600 shadow-[0_8px_16px_rgb(0_122_255/0.25)]'
 }`}
 >
 {isInCart ? 'נוסף לעגלה' : 'הוסף לעגלה'}
 </motion.button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};

export default StickyBuyBar;
