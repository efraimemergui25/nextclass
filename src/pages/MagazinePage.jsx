import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import PageTransition from '../components/PageTransition';
import { Sparkles, Clock, ArrowLeft } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const IMAGES = [
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
];

const articles = [
    {
        id: 1,
        category: "חדשנות פדגוגית",
        title: "איך מסכי מגע אינטראקטיביים משנים את פני הכיתה הישראלית",
        excerpt: "מחקר חדש מראה כי שילוב מסכים אינטראקטיביים בכיתות הלימוד מעלה את המעורבות התלמידים ב-40% ואת שימור החומר הנלמד ב-25%. סקירה מעמיקה על המהפכה הדיגיטלית בחינוך.",
        date: "17 מאי 2024",
        readTime: "6 דק׳",
        image: IMAGES[0],
        url: "https://www.eschoolnews.com/digital-learning/2024/05/17/interactive-whiteboard-roi-classroom-edtech/",
        source: "eSchool News",
    },
    {
        id: 2,
        category: "מעבדות STEM",
        title: "כיצד לתכנן מעבדת מדעים מוכנה לעתיד",
        excerpt: "מדריך מעשי לתכנון ועיצוב מעבדות STEM מודרניות — מהפריסה הפיזית ועד לשילוב ציוד דיגיטלי, כולל שיקולי בטיחות ותחזוקה.",
        date: "אוגוסט 2023",
        readTime: "8 דק׳",
        image: IMAGES[1],
        url: "https://www.techlearning.com/news/how-to-design-future-ready-science-labs",
        source: "Tech & Learning",
    },
    {
        id: 3,
        category: "טרנדים",
        title: "5 טרנדים שיעצבו את ה-EdTech ב-2026",
        excerpt: "EdSurge מנתחת את המגמות המרכזיות בחינוך K-12: מ-AI אישי ועד לכלים שמודדים מעורבות תלמידים — מה שמנהלי מוסדות צריכים לדעת.",
        date: "27 ינואר 2026",
        readTime: "5 דק׳",
        image: IMAGES[2],
        url: "https://www.edsurge.com/news/2026-01-27-k-12-edtech-in-2026-five-trends-shaping-the-year-ahead",
        source: "EdSurge",
    },
    {
        id: 4,
        category: "מקרי בוחן",
        title: "טכנולוגיית כיתה: הישנה, החדשה — ומה באמת עובד",
        excerpt: "מה ממשיך לעבוד ומה חדש בטכנולוגיות כיתה ב-2024? סקירת eSchool News על כלים שמורים באמת משתמשים בהם — ולמה.",
        date: "20 פברואר 2024",
        readTime: "7 דק׳",
        image: IMAGES[3],
        url: "https://www.eschoolnews.com/innovative-teaching/2024/02/20/classroom-technology-new-tried-and-true/",
        source: "eSchool News",
    },
    {
        id: 5,
        category: "תשתיות",
        title: "שילוט דיגיטלי בחינוך: הכלים שמורים צריכים",
        excerpt: "כיצד שילוט דיגיטלי משדרג תקשורת מוסדית, מפחית עומס מנהלי ומאפשר למורים לחזור להוראה — עם דוגמאות מהשטח.",
        date: "23 אוקטובר 2023",
        readTime: "4 דק׳",
        image: IMAGES[0],
        url: "https://www.eschoolnews.com/featured/2020/10/23/digital-signage-offers-teachers-the-tools-they-need-to-succeed/",
        source: "eSchool News",
    },
    {
        id: 6,
        category: "בינה מלאכותית",
        title: "AI בכיתה: למה יותר מורים בוחרים בו — וממה צריך להיזהר",
        excerpt: "EdWeek חוקרת את הגידול המהיר באימוץ AI בבתי ספר, מה מניע מורים לשלב אותו, ומהן המגבלות שחשוב להכיר לפני.",
        date: "ינואר 2026",
        readTime: "6 דק׳",
        image: IMAGES[1],
        url: "https://www.edweek.org/technology/more-teachers-are-using-ai-in-their-classrooms-heres-why/2026/01",
        source: "Education Week",
    },
];

const FALLBACK = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";

const CATEGORY_COLORS = {
    'חדשנות פדגוגית': { bg: 'bg-blue-50', text: 'text-[#007AFF]', dot: 'bg-[#007AFF]' },
    'מעבדות STEM':    { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    'טרנדים':         { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
    'מקרי בוחן':      { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
    'תשתיות':         { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-500' },
    'בינה מלאכותית':  { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' },
};

function getColor(cat) {
    return CATEGORY_COLORS[cat] ?? { bg: 'bg-blue-50', text: 'text-[#007AFF]', dot: 'bg-[#007AFF]' };
}

function CategoryBadge({ cat, size = 'sm' }) {
    const c = getColor(cat);
    return (
        <span className={`inline-flex items-center gap-1.5 ${c.bg} ${c.text} font-black ${size === 'lg' ? 'text-[10px] px-3.5 py-1.5' : 'text-[9px] px-3 py-1'} rounded-full uppercase tracking-[0.18em]`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {cat}
        </span>
    );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ article }) {
    return (
        <motion.a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
            className="group block relative rounded-[2rem] overflow-hidden cursor-pointer"
            style={{ textDecoration: 'none' }}
        >
            {/* Image */}
            <div className="aspect-[21/9] w-full relative overflow-hidden">
                <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-[1.4s] ease-out"
                    onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried = 'true'; e.target.src = FALLBACK; } }}
                    loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </div>

            {/* Text overlay */}
            <div className="absolute bottom-0 right-0 left-0 p-8 md:p-12 text-right">
                <div className="flex items-center gap-3 mb-5 justify-end">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{article.source}</span>
                    <CategoryBadge cat={article.category} size="lg" />
                </div>
                <h2 className="font-apple-display text-white text-3xl md:text-5xl lg:text-6xl tracking-tighter leading-tight mb-4 max-w-3xl mr-auto">
                    {article.title}
                </h2>
                <p className="text-white/70 text-[14px] md:text-[16px] leading-relaxed max-w-2xl mr-auto mb-6 line-clamp-2">
                    {article.excerpt}
                </p>
                <div className="flex items-center gap-4 justify-end">
                    <div className="flex items-center gap-2 text-white/50 text-[12px]">
                        <Clock size={12} />
                        <span>{article.readTime}</span>
                        <span>·</span>
                        <span>{article.date}</span>
                    </div>
                    <span className="flex items-center gap-1.5 bg-white text-[#007AFF] font-bold text-[13px] px-5 py-2.5 rounded-full group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                        קרא עוד
                        <ArrowLeft size={13} />
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
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.07 }}
            whileHover={{ y: -6 }}
            className="group block bg-white rounded-[1.5rem] overflow-hidden border border-black/[0.05] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col cursor-pointer"
            style={{ textDecoration: 'none' }}
        >
            {/* Image */}
            <div className="relative overflow-hidden aspect-[16/10]">
                <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[1.2s] ease-out"
                    onError={e => { if (!e.target.dataset.tried) { e.target.dataset.tried = 'true'; e.target.src = FALLBACK; } }}
                    loading="lazy"
                />
                <div className="absolute top-4 right-4">
                    <CategoryBadge cat={article.category} />
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-grow p-6 text-right">
                <div className="flex items-center justify-end gap-2 mb-3">
                    <span className="text-[10px] font-bold text-[#AEAEB2] uppercase tracking-wider">{article.source}</span>
                </div>
                <h3 className="font-apple-display text-[#1D1D1F] text-[20px] leading-tight tracking-tight mb-3 line-clamp-2 group-hover:text-[#007AFF] transition-colors duration-300">
                    {article.title}
                </h3>
                <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-3 flex-grow mb-5">
                    {article.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1.5 text-[#007AFF] font-bold text-[12px] group-hover:gap-2.5 transition-all">
                        קרא עוד <ArrowLeft size={12} />
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-300 font-medium">
                        <Clock size={11} />
                        <span>{article.readTime}</span>
                    </div>
                </div>
            </div>
        </motion.a>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ALL_CATS = ['הכל', ...Array.from(new Set(articles.map(a => a.category)))];

const MagazinePage = () => {
    const [firestoreArticles, setFirestoreArticles] = useState(null);
    const [activeCategory, setActiveCategory] = useState('הכל');

    useEffect(() => {
        const q = query(collection(db, 'magazine_articles'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setFirestoreArticles(docs.length > 0 ? docs : null);
        }, () => setFirestoreArticles(null));
        return unsub;
    }, []);

    const displayArticles = firestoreArticles ?? articles;
    const heroArticle = displayArticles[0];
    const restArticles = displayArticles.slice(1);
    const filteredArticles = activeCategory === 'הכל'
        ? restArticles
        : restArticles.filter(a => a.category === activeCategory);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-28 overflow-x-hidden" dir="rtl">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10">

                    {/* ── Header ─────────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.25em] mb-8 border border-blue-100">
                            <Sparkles size={10} />
                            <span>NextClass Institute · מגזין חדשנות פדגוגית</span>
                        </div>

                        <h1 className="font-apple-display text-[#1D1D1F] text-5xl md:text-8xl tracking-tighter leading-[0.95] mb-6">
                            תובנות שמובילות{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>שינוי.</span>
                        </h1>

                        <p className="text-[16px] text-gray-400 font-medium max-w-xl mx-auto leading-relaxed">
                            מאמרים, מחקרים וכלים מעולם הטכנולוגיה החינוכית — נבחרו עבורכם.
                        </p>
                    </motion.div>

                    {/* ── Hero ───────────────────────────────────────────── */}
                    <div className="mb-6">
                        <HeroCard article={heroArticle} />
                    </div>

                    {/* ── Category Filter ─────────────────────────────────── */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-6 mb-4">
                        {ALL_CATS.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full font-bold text-[13px] whitespace-nowrap transition-all ${
                                    activeCategory === cat
                                        ? 'bg-[#1D1D1F] text-white shadow-lg'
                                        : 'bg-white text-gray-500 hover:text-[#1D1D1F] border border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* ── Article Grid ────────────────────────────────────── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredArticles.length === 0 ? (
                                <div className="col-span-3 text-center py-20 text-gray-300 text-[15px]">
                                    אין מאמרים בקטגוריה זו כרגע.
                                </div>
                            ) : (
                                filteredArticles.map((article, i) => (
                                    <ArticleCard key={article.id} article={article} index={i} />
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>

                </div>
            </div>
        </PageTransition>
    );
};

export default MagazinePage;
