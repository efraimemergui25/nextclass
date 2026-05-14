import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';

const ComparePage = () => {
 const { selectedForCompare, removeFromCompare, clearCompare } = useCompare();
 const { cartItems, addToCart, removeFromCart } = useCart();

 useEffect(() => {

 }, []);

 // Build a unified spec label list from ALL selected products' specs arrays
 const allSpecLabels = useMemo(() => {
 if (!selectedForCompare.length) return [];
 const labelSet = new Set();
 selectedForCompare.forEach(product => {
 const specs = product.specs || [];
 specs.forEach(spec => labelSet.add(spec.label));
 });
 return Array.from(labelSet);
 }, [selectedForCompare]);

 // Helper: find a spec value for a product by label
 const getSpecValue = (product, label) => {
 const specs = product.specs || [];
 const found = specs.find(s => s.label === label);
 return found ? found.value : null;
 };

 const handleCartToggle = (product) => {
 const isInCart = cartItems.some(item => item.id === product.id);
 if (isInCart) {
 removeFromCart(product.id);
 } else {
 // Re-normalize product for cart (the compare product might be simplified)
 addToCart({
 ...product,
 image: product.imageUrl || product.image,
 // Ensure price is a number if it came as a formatted string in CompareContext
 price: typeof product.price === 'string' ? parseInt(product.price.replace(/[^\d]/g, '')) : product.price
 });
 }
 };

 return (
 <PageTransition>
 <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 w-full overflow-x-hidden">
 <div className="max-w-[1400px] mx-auto">

 <AnimatePresence mode="wait">
 {selectedForCompare.length === 0 ? (
 /* --- EMPTY STATE --- */
 <motion.div
 key="empty-state"
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
 className="flex flex-col items-center justify-center text-center min-h-[50vh]"
 >
 <svg className="w-24 h-24 text-gray-200 mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
 </svg>
 <h1 className="text-3xl md:text-4xl font-apple-display text-[#1D1D1F] tracking-tighter mb-4 leading-tight">
 לא נבחרו מוצרים להשוואה
 </h1>
 <Link to="/catalog" className="text-[#007AFF] text-lg font-medium hover:text-blue-600 active:scale-[0.97] transition-all border-b-2 border-transparent hover:border-blue-600 pb-1">
 חזרה לקטלוג המוצרים
 </Link>
 </motion.div>
 ) : (
 /* --- DYNAMIC COMPARISON GRID --- */
 <motion.div
 key="grid-state"
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 30 }}
 transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
 className="flex flex-col w-full"
 >
 {/* Header */}
 <div className="text-center mb-16 relative">
 <h1 className="text-4xl md:text-5xl lg:text-7xl font-apple-display text-[#1D1D1F] tracking-tighter mb-4 leading-[1.1]">
 השוואת{' '}
 <span style={{
 background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
 WebkitBackgroundClip: 'text',
 WebkitTextFillColor: 'transparent',
 backgroundClip: 'text',
 }}>דגמים</span>
 </h1>
 <p className="text-base md:text-lg text-gray-500 font-normal leading-relaxed">
 סוקרים {selectedForCompare.length} מוצרים נבחרים.
 </p>

 <button
 onClick={clearCompare}
 className="absolute top-0 right-0 md:right-12 mt-4 text-sm font-bold text-red-500 hover:text-red-600 active:scale-[0.97] transition-all"
 >
 נקה השוואה
 </button>
 </div>

 <div className="overflow-x-auto pb-12" style={{ WebkitOverflowScrolling: 'touch' }}>
 <div className="min-w-[700px] w-full">

 {/* STICKY HEADER ROW: Product Cards */}
 <div
 className="grid border-b-2 border-[#1D1D1F]/10 sticky top-[73px] z-40 bg-[#F5F5F7]/95 backdrop-blur-3xl pt-8 pb-6"
 style={{ gridTemplateColumns: `180px repeat(${selectedForCompare.length}, minmax(220px, 1fr))` }}
 >
 <div className="flex bg-transparent"></div>
 {selectedForCompare.map((product) => (
 <div key={product.id} className="text-center px-4 relative group flex flex-col items-center">
 <button
 onClick={() => removeFromCompare(product.id)}
 className="absolute top-2 right-4 w-8 h-8 bg-white text-gray-500 rounded-full flex items-center justify-center shadow-md hover:text-red-500 hover:scale-110 active:scale-[0.9] transition-all z-10"
 aria-label="הסר מההשוואה"
 >
 &times;
 </button>
 <div className="w-full aspect-[4/3] bg-white rounded-2xl mb-4 p-3 shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
 <img onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop"; }}
 src={product.imageUrl || product.image}
 alt={product.title} loading="lazy"
 className="max-h-full max-w-full object-contain"
 />
 </div>
 <h3 className="font-black text-[#1D1D1F] text-base md:text-lg lg:text-xl leading-tight mb-1 line-clamp-2 tracking-tighter">
 {product.title}
 </h3>
 <div className="text-[#007AFF] font-black text-xl lg:text-2xl tracking-tighter mb-4">
 {product.price}
 </div>

 <Link to={`/catalog/${product.id}`} className="w-full">
 <motion.div
 whileHover={{ scale: 1.02, y: -1 }}
 whileTap={{ scale: 0.97 }}
 transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
 className="w-full bg-[#1D1D1F]/5 text-[#1D1D1F] py-3 rounded-xl font-bold text-xs hover:bg-[#1D1D1F] hover:text-white transition-all text-center mb-2"
 >
 למפרט המלא
 </motion.div>
 </Link>
 </div>
 ))}
 </div>

 {/* SPEC ROWS — Dynamically built from products' specs arrays */}
 <div className="flex flex-col mt-4">
 {/* Category Row (always first) */}
 <div
 className="grid border-b border-gray-100 py-5 hover:bg-white/50 transition-colors"
 style={{ gridTemplateColumns: `180px repeat(${selectedForCompare.length}, minmax(220px, 1fr))` }}
 >
 <div className="flex items-center pr-4">
 <span className="text-xs font-bold text-gray-400">קטגוריה</span>
 </div>
 {selectedForCompare.map((product) => (
 <div key={product.id} className="flex items-center justify-center text-center px-4">
 <span className="text-[#007AFF] font-bold text-sm">{product.category}</span>
 </div>
 ))}
 </div>

 {/* Dynamic Spec Rows */}
 {allSpecLabels.map((label) => (
 <div
 key={label}
 className="grid border-b border-gray-100 py-5 hover:bg-white/50 transition-colors"
 style={{ gridTemplateColumns: `180px repeat(${selectedForCompare.length}, minmax(220px, 1fr))` }}
 >
 <div className="flex items-center pr-4">
 <span className="text-xs font-bold text-gray-400">{label}</span>
 </div>
 {selectedForCompare.map((product) => {
 const value = getSpecValue(product, label);
 return (
 <div key={product.id} className="flex items-center justify-center text-center px-4">
 {value ? (
 <span className="text-[#1D1D1F] font-black text-base leading-tight">{value}</span>
 ) : (
 <span className="text-gray-300 text-lg">—</span>
 )}
 </div>
 );
 })}
 </div>
 ))}

 {/* ACTION ROW (Smart Cart Toggle) */}
 <div
 className="grid py-12"
 style={{ gridTemplateColumns: `180px repeat(${selectedForCompare.length}, minmax(220px, 1fr))` }}
 >
 <div className="flex items-center pr-4">
 <span className="text-xs font-bold text-[#007AFF]">רכישה מהירה</span>
 </div>
 {selectedForCompare.map((product) => {
 const isInCart = cartItems.some(item => item.id === product.id);
 return (
 <div key={product.id} className="flex items-center justify-center px-4">
 <motion.button
 onClick={() => handleCartToggle(product)}
 whileHover={{ scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 className={`group relative h-[48px] w-full max-w-[180px] rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center justify-center ${isInCart
 ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-gray-200 hover:text-red-500 hover:border-red-200'
 : 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/20'
 }`}
 >
 <AnimatePresence mode="wait">
 {isInCart ? (
 <motion.div
 key="in-cart"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="flex items-center gap-1.5"
 >
 <div className="flex items-center gap-1.5 group-hover:hidden">
 <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 <span>נוסף</span>
 </div>
 <div className="hidden group-hover:flex items-center gap-1.5 text-red-500">
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 <span>הסר מהעגלה</span>
 </div>
 </motion.div>
 ) : (
 <motion.span
 key="add"
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 >
 הוסף לסל
 </motion.span>
 )}
 </AnimatePresence>
 </motion.button>
 </div>
 );
 })}
 </div>
 </div>

 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 </div>
 </PageTransition>
 );
};

export default ComparePage;
