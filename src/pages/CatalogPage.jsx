import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X, Check, ChevronDown, Scale, ShoppingCart } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import Magnetic from '../components/Magnetic';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import useCartPop from '../hooks/useCartPop';
import useRecentlyViewed from '../hooks/useRecentlyViewed';
import RecentlyViewedTray from '../components/RecentlyViewedTray';

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
 hidden: { opacity: 0 },
 show: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: 0.04 } },
};
const itemVariants = {
 hidden: { opacity: 0, y: 14 },
 show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
 exit: { opacity: 0, scale: 0.96, transition: { duration: 0.12 } },
};

const CatalogPage = () => {
 const [searchParams, setSearchParams] = useSearchParams();
 const [viewMode, setViewMode] = useState('grid');
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [drawerOpen, setDrawerOpen] = useState(false);
 const [sortOpen, setSortOpen] = useState(false);
 const sortRef = useRef(null);

 const { getSetting } = useSettings();
 const { activeProducts: products } = useProducts();
 const { user, firstName, userDoc, personalGreeting, tierColor, tierLabel, institution } = useAuth();

 const timeGreeting = () => {
   const h = new Date().getHours();
   if (h >= 6  && h < 12) return 'בוקר טוב';
   if (h >= 12 && h < 15) return 'צהריים טובים';
   if (h >= 15 && h < 18) return 'אחר הצהריים טוב';
   if (h >= 18 && h < 22) return 'ערב טוב';
   return 'לילה טוב';
 };

 const roleSubtext = () => {
   const role = userDoc?.role;
   if (role === 'teacher')   return 'מה מחפשת הכיתה שלך היום?';
   if (role === 'principal') return 'מה המוסד צריך?';
   if (role === 'it')        return 'כל הפתרונות הטכנולוגיים במקום אחד';
   if (role === 'admin')     return 'נהל את הרכש שלך בקלות';
   return null;
 };
 const allLabel = getSetting('catalog_all_cat', 'הכל');

 const SORT_OPTIONS = useMemo(() => [
 { id: 'default', label: getSetting('catalog_sort_rel', 'רלוונטיות') },
 { id: 'price-asc', label: getSetting('catalog_sort_pasc', 'מחיר: מהנמוך לגבוה') },
 { id: 'price-desc', label: getSetting('catalog_sort_pdesc', 'מחיר: מהגבוה לנמוך') },
 { id: 'name', label: getSetting('catalog_sort_name', 'שם (א-ת)') },
 ], [getSetting]);

 const categories = useMemo(
 () => [allLabel, ...new Set(products.map(p => p.category))],
 [products, allLabel]
 );

 const initialCat = searchParams.get('category') ?? null;
 const [selectedCategory, setSelectedCategory] = useState(
 initialCat && categories.includes(initialCat)
 ? initialCat
 : categories.find(c => c !== allLabel) || allLabel
 );
 const [sortBy, setSortBy] = useState('default');
 const [priceRange, setPriceRange] = useState([0, 30000]);

 const maxPrice = useMemo(() => {
 if (!products.length) return 30000;
 const max = Math.max(...products.map(p => Number(p.price) || 0));
 return Math.ceil(max / 1000) * 1000 || 10000;
 }, [products]);

 useEffect(() => {
 setPriceRange(prev => [prev[0], Math.max(prev[1], maxPrice)]);
 }, [maxPrice]);

 // Close sort dropdown on outside click
 useEffect(() => {
 if (!sortOpen) return;
 const handle = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
 document.addEventListener('mousedown', handle);
 return () => document.removeEventListener('mousedown', handle);
 }, [sortOpen]);

 // Scroll restoration
 const scrollKey = 'catalog_scroll_pos';
 useEffect(() => {
 const saved = sessionStorage.getItem(scrollKey);
 if (saved) {
 requestAnimationFrame(() => window.scrollTo({ top: parseInt(saved), behavior: 'instant' }));
 sessionStorage.removeItem(scrollKey);
 }
 }, []);
 useEffect(() => {
 const save = () => sessionStorage.setItem(scrollKey, String(window.scrollY));
 window.addEventListener('beforeunload', save);
 return () => window.removeEventListener('beforeunload', save);
 }, []);
 const handleProductClick = useCallback(() => sessionStorage.setItem(scrollKey, String(window.scrollY)), []);

 const handleCategorySelect = (cat) => {
 setSelectedCategory(cat);
 setSearchParams(cat === allLabel ? {} : { category: cat });
 setDrawerOpen(false);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 };

 const { recentIds } = useRecentlyViewed();

 const filtered = useMemo(() => {
 let r = selectedCategory === allLabel ? [...products] : products.filter(p => p.category === selectedCategory);
 r = r.filter(p => p.isActive !== false);
 r = r.filter(p => {
 const price = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
 return price >= priceRange[0] && price <= priceRange[1];
 });
 if (sortBy === 'price-asc') r.sort((a, b) => Number(a.price) - Number(b.price));
 if (sortBy === 'price-desc') r.sort((a, b) => Number(b.price) - Number(a.price));
 if (sortBy === 'name') r.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
 return r;
 }, [products, selectedCategory, sortBy, priceRange]);

 const currentSortLabel = SORT_OPTIONS.find(o => o.id === sortBy)?.label || 'רלוונטיות';
 const hasActiveFilters = sortBy !== 'default' || priceRange[1] < maxPrice;

 return (
 <PageTransition>
 <div className="min-h-screen bg-[#F5F5F7]" dir="rtl">

 {/* ── Compact Hero ─────────────────────────────────────────── */}
 <div className="pt-28 pb-7 px-6 max-w-7xl mx-auto relative">

 {/* Ambient glow */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] pointer-events-none"
 style={{ background: 'radial-gradient(ellipse at 60% 40%, rgba(0,122,255,0.10) 0%, rgba(88,86,214,0.06) 45%, transparent 72%)', filter: 'blur(32px)' }} />


 <motion.div
 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
 className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold mb-5"
 style={{ background: 'rgba(0,122,255,0.07)', backdropFilter: 'blur(12px)', borderColor: 'rgba(0,122,255,0.18)', color: '#007AFF' }}
 >
 <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
 {getSetting('catalog_hero_eyebrow', 'הקטלוג שלנו')}
 </motion.div>

 <motion.h1
 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ease: [0.22,1,0.36,1], duration: 0.7 }}
 className="font-apple-display leading-[1.0] mb-3 relative"
 style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', letterSpacing: '-0.04em' }}
 >
 <span className="text-[#1D1D1F]">הכלים שמעצבים את </span>
 <span style={{
 background: 'linear-gradient(125deg, #007AFF 0%, #5856D6 55%, #007AFF 100%)',
 backgroundSize: '200% auto',
 WebkitBackgroundClip: 'text',
 WebkitTextFillColor: 'transparent',
 backgroundClip: 'text',
 filter: 'drop-shadow(0 0 32px rgba(0,122,255,0.22))',
 }}>המחר.</span>
 </motion.h1>

 <motion.p
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
 className="text-[16px] text-[#86868B] font-medium"
 >
 {getSetting('catalog_subtitle', 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.')}
 </motion.p>
 </div>

 {/* ── Filter Bar ──────────────────────────────────────────────── */}
 <div
 className="border-b border-black/[0.06]"
 style={{ background: 'rgba(245,245,247,0.96)' }}
 >
 <div className="max-w-7xl mx-auto px-6 flex items-center gap-3 h-[52px]">

 {/* Category pills */}
 <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => handleCategorySelect(cat)}
 className={`shrink-0 px-4 py-1.5 rounded-full font-bold text-[12px] whitespace-nowrap transition-all duration-200 ${
 selectedCategory === cat
 ? 'bg-[#1D1D1F] text-white shadow-sm'
 : 'bg-white/80 text-[#86868B] hover:text-[#1D1D1F] hover:bg-white border border-white/80'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

 {/* Sort dropdown */}
 <div ref={sortRef} className="relative shrink-0">
 <button
 onClick={() => setSortOpen(p => !p)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-white/80 text-[12px] font-bold text-[#1D1D1F] hover:bg-white transition-all whitespace-nowrap"
 >
 {currentSortLabel}
 <ChevronDown size={12} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
 </button>
 <AnimatePresence>
 {sortOpen && (
 <motion.div
 initial={{ opacity: 0, y: -6, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -4, scale: 0.96 }}
 transition={{ duration: 0.14 }}
 className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-black/06 overflow-hidden z-50"
 >
 {SORT_OPTIONS.map(opt => (
 <button
 key={opt.id}
 onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
 className={`w-full text-right px-4 py-2.5 text-[13px] font-bold transition-colors flex items-center justify-between gap-2 ${
 sortBy === opt.id ? 'text-[#007AFF] bg-[#007AFF]/06' : 'text-[#1D1D1F] hover:bg-black/04'
 }`}
 >
 {opt.label}
 {sortBy === opt.id && <Check size={12} strokeWidth={3} />}
 </button>
 ))}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* View toggle */}
 <div className="flex items-center p-1 rounded-full bg-white/80 border border-white/80 shrink-0">
 <button onClick={() => setViewMode('grid')}
 className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
 <LayoutGrid size={14} />
 </button>
 <button onClick={() => setViewMode('list')}
 className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
 <List size={14} />
 </button>
 </div>

 {/* Sidebar toggle (desktop) */}
 <button
 onClick={() => setSidebarOpen(p => !p)}
 className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all shrink-0 border ${
 sidebarOpen ? 'bg-[#1D1D1F] text-white border-transparent' : 'bg-white/80 text-[#1D1D1F] border-white/80 hover:bg-white'
 }`}
 >
 <SlidersHorizontal size={12} className={sidebarOpen ? 'text-[#007AFF]' : 'text-[#86868B]'} />
 סינון
 </button>

 {/* Mobile filter button */}
 <button
 onClick={() => setDrawerOpen(true)}
 className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-white/80 text-[12px] font-bold text-[#1D1D1F] hover:bg-white transition-all shrink-0"
 >
 <SlidersHorizontal size={12} className="text-[#007AFF]" />
 סינון
 </button>
 </div>
 </div>

 {/* ── Main: sidebar + products ──────────────────────────────── */}
 <div className="max-w-7xl mx-auto px-6 pt-6 pb-24 flex gap-6 items-start">

 {/* Desktop sidebar */}
 <AnimatePresence initial={false}>
 {sidebarOpen && (
 <motion.aside
 key="sidebar"
 initial={{ opacity: 0, width: 0, x: 20 }}
 animate={{ opacity: 1, width: 216, x: 0 }}
 exit={{ opacity: 0, width: 0, x: 20 }}
 transition={{ type: 'spring', stiffness: 360, damping: 32 }}
 className="hidden lg:block shrink-0 sticky top-[136px] self-start overflow-hidden"
 style={{ minWidth: 0 }}
 >
 <div className="w-[216px] bg-white/75 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm p-5">

 {/* Categories */}
 <p className="text-[9px] font-black text-[#AEAEB2] mb-3">קטגוריות</p>
 <div className="flex flex-col gap-0.5 mb-5">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => handleCategorySelect(cat)}
 className={`text-right px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${
 selectedCategory === cat
 ? 'bg-[#007AFF]/10 text-[#007AFF]'
 : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/04'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

 <div className="h-px bg-black/07 mb-5" />

 {/* Price range */}
 <p className="text-[9px] font-black text-[#AEAEB2] mb-1">טווח מחירים</p>
 <div className="flex justify-between mb-3">
 <span className="text-[11px] text-[#86868B]">₪0</span>
 <span className="text-[11px] font-black text-[#1D1D1F]">
 {priceRange[1] >= maxPrice ? 'ללא הגבלה' : `₪${priceRange[1].toLocaleString()}`}
 </span>
 </div>
 <input
 type="range" dir="ltr"
 min="0" max={maxPrice}
 step={maxPrice > 10000 ? 500 : 200}
 value={Math.min(priceRange[1], maxPrice)}
 onChange={e => setPriceRange([0, parseInt(e.target.value)])}
 className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#007AFF] [&::-webkit-slider-thumb]:shadow-md"
 style={{
 background: `linear-gradient(to right, #007AFF ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%, rgba(0,0,0,0.10) ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%)`
 }}
 />

 {hasActiveFilters && (
 <button
 onClick={() => { setSortBy('default'); setPriceRange([0, maxPrice]); }}
 className="w-full py-2 text-[11px] font-bold text-[#86868B] hover:text-red-500 transition-colors text-center rounded-xl hover:bg-red-50"
 >
 איפוס סינון
 </button>
 )}
 </div>
 </motion.aside>
 )}
 </AnimatePresence>

 {/* Product area */}
 <div className="flex-1 min-w-0">

 {/* Personalized greeting — glass card above products */}
 {user && firstName && (
   <motion.div
     initial={{ opacity: 0, y: -8, scale: 0.98 }}
     animate={{ opacity: 1, y: 0, scale: 1 }}
     transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
     className="mb-5"
   >
     <div
       style={{
         background: `linear-gradient(135deg, ${tierColor}10, rgba(255,255,255,0.8))`,
         border: `1px solid ${tierColor}20`,
         backdropFilter: 'blur(20px) saturate(180%)',
         WebkitBackdropFilter: 'blur(20px) saturate(180%)',
         boxShadow: `0 4px 20px rgba(0,0,0,0.05), 0 0 0 0.5px ${tierColor}12`,
       }}
       className="rounded-2xl px-5 py-3 flex items-center gap-3.5"
     >
       <div
         style={{ background: `linear-gradient(135deg, ${tierColor}28, ${tierColor}48)`, color: tierColor }}
         className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 select-none"
       >
         {firstName[0].toUpperCase()}
       </div>
       <div className="flex-1 min-w-0 text-right">
         <p className="text-[14px] font-black text-[#1D1D1F] tracking-tight leading-snug">
           {personalGreeting}
         </p>
         {(institution || roleSubtext()) && (
           <p className="text-[11px] text-[#86868B] font-medium mt-0.5">
             {institution ? `${institution} · ` : ''}<span style={{ color: tierColor }} className="font-bold">{tierLabel}</span>
             {roleSubtext() && ` · ${roleSubtext()}`}
           </p>
         )}
       </div>
     </div>
   </motion.div>
 )}

 {/* Result count */}
 <div className="flex items-center justify-between mb-5 h-7">
 <motion.p
 key={filtered.length}
 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 className="text-[13px] font-bold text-[#86868B]"
 >
 {filtered.length > 0
 ? <>{filtered.length} פתרונות{selectedCategory !== allLabel && <> — <span className="text-[#1D1D1F]">{selectedCategory}</span></>}</>
 : 'לא נמצאו תוצאות'
 }
 </motion.p>
 </div>

 {/* Grid / List */}
 <AnimatePresence mode="wait">
 <motion.div
 key={`${selectedCategory}-${viewMode}-${sortBy}-${priceRange[1]}`}
 variants={containerVariants}
 initial="hidden"
 animate="show"
 exit={{ opacity: 0, transition: { duration: 0.1 } }}
 className={viewMode === 'list' ? 'flex flex-col gap-3' : 'grid gap-4'}
 style={viewMode === 'grid' ? {
 gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
 } : undefined}
 >
 {filtered.map(product => (
 <motion.div key={product.id} variants={itemVariants} onClick={handleProductClick}>
 {viewMode === 'list' ? <ListCard product={product} /> : <ProductCard product={product} />}
 </motion.div>
 ))}
 </motion.div>
 </AnimatePresence>

 {/* Empty state */}
 <AnimatePresence>
 {filtered.length === 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
 className="text-center py-20 flex flex-col items-center gap-4"
 >
 <div className="w-14 h-14 rounded-full flex items-center justify-center"
 style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.12)' }}>
 <SlidersHorizontal size={22} className="text-[#007AFF]" />
 </div>
 <p className="text-xl font-black text-[#1D1D1F]">{getSetting('catalog_empty_msg', 'לא נמצאו מוצרים')}</p>
 <p className="text-[#AEAEB2] font-medium">{getSetting('catalog_empty_hint', 'נסה קטגוריה אחרת או שנה את הפילטרים')}</p>
 <motion.button
 whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
 onClick={() => { setSortBy('default'); setPriceRange([0, maxPrice]); setSelectedCategory(allLabel); setSearchParams({}); }}
 className="mt-2 px-7 py-2.5 rounded-full bg-[#007AFF] text-white font-bold text-[13px] shadow-[0_6px_18px_rgba(0,122,255,0.3)]"
 >
 הצג את כל המוצרים
 </motion.button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* Recently Viewed */}
 <RecentlyViewedTray recentIds={recentIds} />

 {/* Mobile filter drawer */}
 <AnimatePresence>
 {drawerOpen && (
 <>
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setDrawerOpen(false)}
 className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
 />
 <motion.div
 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
 transition={{ type: 'spring', stiffness: 380, damping: 32 }}
 className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[210] flex flex-col p-8"
 style={{
 background: 'rgba(255,255,255,0.96)',
 backdropFilter: 'blur(40px)',
 WebkitBackdropFilter: 'blur(40px)',
 borderLeft: '1px solid rgba(0,0,0,0.06)',
 boxShadow: '-20px 0 60px rgba(0,0,0,0.10)',
 }}
 >
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight">סינון מתקדם</h3>
 <button onClick={() => setDrawerOpen(false)}
 className="w-10 h-10 rounded-full bg-black/05 flex items-center justify-center">
 <X size={20} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto" dir="rtl">
 <section className="mb-8">
 <p className="text-[10px] font-black text-[#007AFF] mb-4">מיון</p>
 {SORT_OPTIONS.map(opt => (
 <button key={opt.id} onClick={() => setSortBy(opt.id)}
 className={`w-full text-right px-4 py-3 rounded-xl text-[14px] font-bold mb-2 transition-all ${sortBy === opt.id ? 'bg-[#1D1D1F] text-white' : 'bg-black/04 hover:bg-black/08 text-[#1D1D1F]'}`}>
 {opt.label}
 </button>
 ))}
 </section>

 <section className="mb-8">
 <div className="flex justify-between mb-3">
 <p className="text-[10px] font-black text-[#007AFF] ">טווח מחירים</p>
 <span className="text-[12px] font-black text-[#1D1D1F]">
 {priceRange[1] >= maxPrice ? 'ללא הגבלה' : `עד ₪${priceRange[1].toLocaleString()}`}
 </span>
 </div>
 <input type="range" dir="ltr" min="0" max={maxPrice}
 step={maxPrice > 10000 ? 500 : 200}
 value={Math.min(priceRange[1], maxPrice)}
 onChange={e => setPriceRange([0, parseInt(e.target.value)])}
 className="w-full h-2 rounded-full appearance-none cursor-pointer"
 style={{ background: `linear-gradient(to right, #007AFF ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%, rgba(0,0,0,0.10) ${Math.min(priceRange[1], maxPrice) / maxPrice * 100}%)` }}
 />
 </section>

 <section>
 <p className="text-[10px] font-black text-[#007AFF] mb-4">קטגוריה</p>
 <div className="flex flex-wrap gap-2">
 {categories.map(cat => (
 <button key={cat} onClick={() => handleCategorySelect(cat)}
 className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all ${selectedCategory === cat ? 'bg-[#1D1D1F] text-white' : 'border border-black/08 text-[#86868B] hover:border-black/20 hover:text-[#1D1D1F]'}`}>
 {cat}
 </button>
 ))}
 </div>
 </section>
 </div>

 <div className="pt-5 border-t border-black/06 flex gap-3">
 <button
 onClick={() => { setSortBy('default'); setPriceRange([0, maxPrice]); }}
 className="flex-1 py-3.5 rounded-2xl font-bold text-[14px] text-[#86868B] hover:text-[#1D1D1F] transition-colors"
 >
 איפוס
 </button>
 <button
 onClick={() => setDrawerOpen(false)}
 className="flex-[2] py-3.5 rounded-2xl bg-[#007AFF] text-white font-black text-[14px] shadow-[0_6px_16px_rgba(0,122,255,0.3)]"
 >
 הצג {filtered.length} תוצאות
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

// ── List view card ─────────────────────────────────────────────────────────────
const ListCard = ({ product }) => {
 const { id, category, title, price, image, description, specs } = product ?? {};
 const [imgError, setImgError] = React.useState(false);

 const { getSetting } = useSettings();
 const { addToCompare, removeFromCompare, isSelected } = useCompare();
 const { cartItems, addToCart, removeFromCart } = useCart();
 const { state: popState, trigger } = useCartPop();

 const formattedPrice = React.useMemo(() => `₪${(price ?? 0).toLocaleString()}`, [price]);
 const selected = React.useMemo(() => isSelected(id), [isSelected, id]);
 const isInCart = React.useMemo(() => (cartItems ?? []).some(i => i?.id === id), [cartItems, id]);

 const handleImgError = React.useCallback((e) => {
 if (!e.target.dataset.triedFallback) {
 e.target.dataset.triedFallback = 'true';
 e.target.src = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop';
 } else { setImgError(true); }
 }, []);

 const handleCompare = React.useCallback((e) => {
 e.preventDefault(); e.stopPropagation();
 if (selected) removeFromCompare(id);
 else addToCompare({ id, title, price: formattedPrice, imageUrl: image, category, specs });
 }, [selected, id, title, formattedPrice, image, category, specs, addToCompare, removeFromCompare]);

 const handleCart = React.useCallback((e) => {
 e.preventDefault(); e.stopPropagation();
 if (isInCart) removeFromCart(id);
 else trigger(() => addToCart(product))();
 }, [isInCart, id, product, addToCart, removeFromCart, trigger]);

 return (
 <motion.div whileHover={{ y: -2 }} className="group relative bg-white rounded-2xl border border-black/06 shadow-sm hover:shadow-md transition-all overflow-hidden flex items-center gap-4 p-4">
 {/* Image */}
 <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-[#F5F5F7] border border-black/04">
 {imgError || !image ? (
 <div className="w-full h-full flex items-center justify-center">
 <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 002 2v10a2 2 0 002 2z" />
 </svg>
 </div>
 ) : (
 <img src={image} alt={title} onError={handleImgError}
 className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
 )}
 </div>

 {/* Content */}
 <div className="flex-1 text-right min-w-0">
 <span className="text-[10px] font-black text-[#007AFF] block mb-1">{category}</span>
 <h3 className="text-[15px] font-black text-[#1D1D1F] tracking-tight line-clamp-1 mb-0.5">{title}</h3>
 <p className="text-[12px] text-[#86868B] line-clamp-2 leading-relaxed font-medium">{description}</p>
 </div>

 {/* Price + actions */}
 <div className="shrink-0 flex items-center gap-3 pr-2 sm:pr-4 border-r border-black/06 mr-2">
 <div className="text-right hidden sm:block">
 <div className="text-[18px] font-black text-[#1D1D1F] tracking-tighter">{formattedPrice}</div>
 <div className="text-[9px] font-black text-[#AEAEB2]">{getSetting('catalog_inst_price', 'מחיר מוסדי')}</div>
 </div>

 <motion.button onClick={handleCompare} whileTap={{ scale: 0.9 }}
 className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${selected ? 'bg-[#007AFF] text-white border-[#007AFF]' : 'bg-white text-[#AEAEB2] border-black/08 hover:border-[#007AFF] hover:text-[#007AFF]'}`}>
 <Scale size={16} strokeWidth={2.5} />
 </motion.button>

 <motion.button onClick={handleCart} whileTap={{ scale: 0.95 }}
 className={`h-10 px-4 rounded-full font-bold text-[12px] flex items-center gap-1.5 transition-all ${isInCart ? 'bg-[#F5F5F7] text-[#1D1D1F]' : 'bg-[#007AFF] text-white shadow-md'}`}>
 {isInCart ? (
 <><Check size={13} strokeWidth={3} className="text-green-500" /> נוסף</>
 ) : (
 <><ShoppingCart size={13} strokeWidth={2.5} /> הוסף</>
 )}
 </motion.button>
 </div>

 <Link to={`/catalog/${id}`} className="absolute inset-0 z-0" />
 </motion.div>
 );
};

export default CatalogPage;
