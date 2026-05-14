import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
 { id: 'overview', label: 'סקירה' },
 { id: 'accessories', label: 'אביזרים' },
 { id: 'specs', label: 'מפרט טכני' }
];

const ProductSubNav = ({ isVisible, product, formattedPrice, handleCartToggle, isInCart }) => {
 const [activeSection, setActiveSection] = useState('overview');

 useEffect(() => {
 const handleScroll = () => {
 const sections = NAV_LINKS.map(link => document.getElementById(link.id)).filter(Boolean);
 let current = 'overview';

 for (const section of sections) {
 const rect = section.getBoundingClientRect();
 // If section top is above the offset (e.g. 150px representing the nav height + padding)
 if (rect.top <= 160) {
 current = section.id;
 }
 }
 setActiveSection(current);
 };

 window.addEventListener('scroll', handleScroll, { passive: true });
 handleScroll(); // init checking
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 const scrollToSection = (id) => {
 const element = document.getElementById(id);
 if (element) {
 const y = element.getBoundingClientRect().top + window.scrollY - 80; // offset strictly for the 60px nav
 window.scrollTo({ top: y, behavior: 'smooth' });
 }
 };

 return (
 <AnimatePresence>
 {isVisible && (
 <motion.div
 initial={{ y: '-100%' }}
 animate={{ y: 0 }}
 exit={{ y: '-100%' }}
 transition={{ type: 'spring', stiffness: 450, damping: 30, mass: 0.8 }}
 className="fixed top-0 inset-x-0 z-[1001] bg-white/70 backdrop-blur-3xl backdrop-saturate-[1.5] border-b border-gray-200/50 py-3 px-6 transition-apple-fluid shadow-sm transform-gpu will-change-transform"
 dir="rtl"
 >
 <div className="max-w-7xl mx-auto flex justify-between items-center">
 {/* Right Side: Title */}
 <div className="flex-1 flex justify-start">
 <h2 className="text-sm md:text-lg font-black tracking-tight text-[#1D1D1F] line-clamp-1">{product?.title}</h2>
 </div>

 {/* Center: Anchor Links */}
 <nav className="hidden md:flex justify-center items-center gap-8 flex-1">
 {NAV_LINKS.map((link) => (
 <button
 key={link.id}
 onClick={() => scrollToSection(link.id)}
 className={`relative text-xs hover:bg-transparent md:text-sm font-bold transition-colors duration-300 ${activeSection === link.id ? 'text-[#1D1D1F]' : 'text-gray-400 hover:text-[#1D1D1F]'
 }`}
 >
 {link.label}
 {activeSection === link.id && (
 <motion.div
 layoutId="activeSubNav"
 className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-[#1D1D1F]"
 />
 )}
 </button>
 ))}
 </nav>

 {/* Left Side: Actions */}
 <div className="flex-1 flex justify-end items-center gap-4">
 <span className="text-sm font-black hidden lg:block tracking-tighter">{formattedPrice}</span>
 <motion.button
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 onClick={handleCartToggle}
 className={`text-[11px] md:text-sm font-bold px-4 py-1.5 md:py-2 rounded-full transition-all shadow-md ${isInCart
 ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200'
 : 'bg-[#007AFF] text-white hover:bg-blue-600 shadow-[0_8px_16px_rgb(0_122_255/0.25)]'
 }`}
 >
 {isInCart ? 'נוסף מסל' : 'הוסף לעגלה'}
 </motion.button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};

export default ProductSubNav;
