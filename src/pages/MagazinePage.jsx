import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import PageTransition from '../components/PageTransition';
import { Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { STATIC_ARTICLES, IMAGES, CATEGORY_COLORS, FALLBACK } from '../utils/magazineArticles';

// ─── Scroll progress indicator ────────────────────────────────────────────────
function ScrollProgress() {
 const { scrollYProgress } = useScroll();
 const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
 return (
  <motion.div
   style={{
    scaleX,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: 'linear-gradient(90deg, #007AFF, #5856D6)',
    transformOrigin: '0%',
    zIndex: 9998,
    pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(0,122,255,0.5)',
   }}
  />
 );
}

function getColor(cat) { return CATEGORY_COLORS[cat] ?? { bg: 'bg-blue-50', text: 'text-[#007AFF]', dot: 'bg-[#007AFF]' }; }

function CategoryBadge({ cat, size = 'sm' }) {
 const c = getColor(cat);
 return (
 <span className={`inline-flex items-center gap-1.5 ${c.bg} ${c.text} font-black ${size === 'lg' ? 'text-[10px] px-3.5 py-1.5' : 'text-[9px] px-3 py-1'} rounded-full `}>
 <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
 {cat}
 </span>
 );
}

// ─── Hero Card (smaller) ──────────────────────────────────────────────────────

function HeroCard({ article }) {
 return (
 <motion.a
 href={article.url} target="_blank" rel="noopener noreferrer"
 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
 className="group block relative rounded-[1.75rem] overflow-hidden cursor-pointer"
 style={{ textDecoration: 'none' }}
 >
 <div className="aspect-[16/5] w-full relative overflow-hidden">
 <img src={article.image} alt={article.title}
 className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.4s] ease-out"
 onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried = 'true'; e.target.src = FALLBACK; } }}
 loading="lazy" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
 <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-transparent" />
 </div>
 <div className="absolute bottom-0 right-0 left-0 p-7 md:p-10 text-right">
 <div className="flex items-center gap-3 mb-4 justify-end">
 <span className="text-white/50 text-[10px] font-bold">{article.source}</span>
 <CategoryBadge cat={article.category} size="lg" />
 </div>
 <h2 className="font-apple-display text-white text-2xl md:text-4xl tracking-tighter leading-tight mb-3 max-w-2xl mr-auto">
 {article.title}
 </h2>
 <p className="text-white/65 text-[13px] md:text-[15px] leading-relaxed max-w-xl mr-auto mb-5 line-clamp-2">
 {article.excerpt}
 </p>
 <div className="flex items-center gap-4 justify-end">
 <div className="flex items-center gap-2 text-white/45 text-[11px]">
 <Clock size={11} /><span>{article.readTime}</span><span>·</span><span>{article.date}</span>
 </div>
 <span className="flex items-center gap-1.5 bg-white text-[#007AFF] font-bold text-[12px] px-4 py-2 rounded-full group-hover:bg-[#007AFF] group-hover:text-white transition-all">
 קרא עוד <ArrowLeft size={12} />
 </span>
 </div>
 </div>
 </motion.a>
 );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, index }) {
 return (
 <motion.a
 href={article.url} target="_blank" rel="noopener noreferrer"
 initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: '-40px' }}
 transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: (index % 3) * 0.07 }}
 whileHover={{ y: -6 }}
 className="group block bg-white rounded-[1.25rem] overflow-hidden border border-black/[0.05] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col cursor-pointer"
 style={{ textDecoration: 'none' }}
 >
 <div className="relative overflow-hidden aspect-[16/10]">
 <img src={article.image} alt={article.title}
 className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[1.2s] ease-out"
 onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried = 'true'; e.target.src = FALLBACK; } }}
 loading="lazy" />
 <div className="absolute top-3 right-3"><CategoryBadge cat={article.category} /></div>
 </div>
 <div className="flex flex-col flex-grow p-5 text-right">
 <p className="text-[9px] font-bold text-[#AEAEB2] mb-2">{article.source}</p>
 <h3 className="font-apple-display text-[#1D1D1F] text-[18px] leading-tight tracking-tight mb-2 line-clamp-2 group-hover:text-[#007AFF] transition-colors duration-300">
 {article.title}
 </h3>
 <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2 flex-grow mb-4">
 {article.excerpt}
 </p>
 <div className="flex items-center justify-between pt-3 border-t border-gray-100">
 <span className="flex items-center gap-1 text-[#007AFF] font-bold text-[11px]">
 קרא עוד <ArrowLeft size={11} />
 </span>
 <div className="flex items-center gap-1 text-[10px] text-gray-300">
 <Clock size={10} /><span>{article.readTime}</span>
 </div>
 </div>
 </div>
 </motion.a>
 );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const MagazinePage = () => {
 const [firestoreArticles, setFirestoreArticles] = useState([]);
 const [activeCategory, setActiveCategory] = useState('הכל');

 useEffect(() => {
 const q = query(collection(db, 'magazine_articles'), orderBy('createdAt', 'desc'));
 const unsub = onSnapshot(q, snap => {
 setFirestoreArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
 }, () => setFirestoreArticles([]));
 return unsub;
 }, []);

 const allArticles = [
 ...firestoreArticles,
 ...STATIC_ARTICLES.filter(a =>
 !firestoreArticles.some(f => f.id === a.id || f.title === a.title)
 ),
 ];

 const ALL_CATS = ['הכל', ...Array.from(new Set(allArticles.map(a => a.category)))];

 const heroArticle = allArticles[0];
 const rest = allArticles.slice(1);
 const filtered = activeCategory === 'הכל' ? rest : rest.filter(a => a.category === activeCategory);

 if (!heroArticle) return null;

 return (
 <PageTransition>
 <ScrollProgress />
 <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-28 overflow-x-hidden" dir="rtl">
 <div className="max-w-[1400px] mx-auto px-6 md:px-10">

 {/* Header */}
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] mb-7 border border-blue-100">
 <Sparkles size={10} /><span>NextClass Institute · מגזין חדשנות פדגוגית</span>
 </div>
 <h1 className="font-apple-display text-[#1D1D1F] text-4xl md:text-7xl tracking-tighter leading-[0.95] mb-5">
 הרעיונות שמשנים{' '}
 <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>חינוך.</span>
 </h1>
 <p className="text-[15px] text-gray-400 font-medium max-w-xl mx-auto">מאמרים, מחקרים וכלים מעולם הטכנולוגיה החינוכית — נבחרו עבורכם.</p>
 </motion.div>

 {/* Hero */}
 <div className="mb-5"><HeroCard article={heroArticle} /></div>

 {/* Category Filter */}
 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-5 mb-4">
 {ALL_CATS.map(cat => (
 <button key={cat} onClick={() => setActiveCategory(cat)}
 className={`px-5 py-2 rounded-full font-bold text-[12px] whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#1D1D1F] text-white shadow-lg' : 'bg-white text-gray-500 hover:text-[#1D1D1F] border border-gray-100'}`}>
 {cat}
 </button>
 ))}
 </div>

 {/* Grid */}
 <AnimatePresence mode="wait">
 <motion.div key={activeCategory}
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 {filtered.length === 0
 ? <div className="col-span-3 text-center py-20 text-gray-300 text-[15px]">אין מאמרים בקטגוריה זו.</div>
 : filtered.map((a, i) => <ArticleCard key={a.id} article={a} index={i} />)
 }
 </motion.div>
 </AnimatePresence>

 </div>
 </div>
 </PageTransition>
 );
};

export default MagazinePage;
