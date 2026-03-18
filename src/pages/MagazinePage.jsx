import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

// Verified Unsplash URLs only — zero hallucinated IDs
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
        date: "28 פברואר 2026",
        readTime: "6 דקות קריאה",
        image: IMAGES[0],
    },
    {
        id: 2,
        category: "מעבדות מדעים",
        title: "עיצוב מעבדת פיזיקה חכמה: מדריך מקיף למנהלי מוסדות",
        excerpt: "כל מה שצריך לדעת על תכנון והקמת מעבדת פיזיקה מודרנית — משולחנות כוחות ועד מערכות איסוף נתונים דיגיטליות.",
        date: "22 פברואר 2026",
        readTime: "8 דקות קריאה",
        image: IMAGES[1],
    },
    {
        id: 3,
        category: "טרנדים",
        title: "5 טרנדים בטכנולוגיית חינוך שצריך לעקוב אחריהם ב-2026",
        excerpt: "מבינה מלאכותית בניהול שיעורים ועד מציאות מורחבת במעבדות — הטרנדים שיעצבו את החינוך הישראלי השנה.",
        date: "15 פברואר 2026",
        readTime: "5 דקות קריאה",
        image: IMAGES[2],
    },
    {
        id: 4,
        category: "מקרי בוחן",
        title: "בית הספר שעבר לדיגיטלי: סיפור ההצלחה של תיכון אורט",
        excerpt: "כיצד פריסה מוסדית של 45 מסכי מגע ומערכת EduEdit שינתה את חווית הלמידה וחסכה 30% מזמן ההכנה של המורים.",
        date: "10 פברואר 2026",
        readTime: "7 דקות קריאה",
        image: IMAGES[3],
    },
    {
        id: 5,
        category: "תשתיות",
        title: "מדריך רכש: איך בוחרים שילוט דיגיטלי לקמפוס אקדמי",
        excerpt: "השוואה מעמיקה בין פתרונות שילוט דיגיטלי למוסדות חינוך — מבהירות המסך ועד עמידות בשמש ישראלית.",
        date: "5 פברואר 2026",
        readTime: "4 דקות קריאה",
        image: IMAGES[0],
    },
    {
        id: 6,
        category: "חדשנות פדגוגית",
        title: "תוכנת ניהול כיתה: השוואת EduEdit מול המתחרים",
        excerpt: "סקירה מקצועית של פתרונות תוכנה לניהול ועריכת תכנים לימודיים עם דגש על התאמה למערכת החינוך הישראלית.",
        date: "1 פברואר 2026",
        readTime: "6 דקות קריאה",
        image: IMAGES[1],
    },
];

const MagazinePage = () => {
    const heroArticle = articles[0];
    const gridArticles = articles.slice(1);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-32 pb-24 px-6 md:px-12 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">

                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                        className="text-center mb-16 transform-gpu will-change-transform"
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#1D1D1F] tracking-tighter leading-[1.1] mb-4">
                            מגזין חדשנות
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed">
                            תובנות, מדריכים ומקרי בוחן מעולם הטכנולוגיה החינוכית.
                        </p>
                    </motion.div>

                    {/* ═══════════ HERO ARTICLE — Full Width Featured ═══════════ */}
                    <motion.article
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1], delay: 0.1 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-2xl transition-all duration-500 items-center overflow-hidden group cursor-pointer border border-gray-100/50 transform-gpu will-change-transform"
                    >
                        {/* Hero Image */}
                        <div className="overflow-hidden rounded-3xl transform-gpu">
                            <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                src={heroArticle.image}
                                alt={heroArticle.title}
                                className="w-full aspect-video lg:aspect-square object-cover rounded-3xl group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                loading="lazy"
                            />
                        </div>

                        {/* Hero Content */}
                        <div className="flex flex-col justify-center py-2 md:py-6">
                            <span className="text-[#007AFF] text-xs font-bold uppercase tracking-widest mb-4 inline-block bg-blue-50 px-3 py-1 rounded-full self-start">
                                {heroArticle.category}
                            </span>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1D1D1F] leading-tight tracking-tighter mb-4 line-clamp-3">
                                {heroArticle.title}
                            </h2>
                            <p className="text-gray-500 text-base md:text-lg font-normal leading-relaxed mb-8 line-clamp-4">
                                {heroArticle.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                                    <span>{heroArticle.date}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>{heroArticle.readTime}</span>
                                </div>
                                <motion.div
                                    whileHover={{ x: -4 }}
                                    className="text-[#007AFF] font-bold text-sm flex items-center gap-1"
                                >
                                    קרא עוד
                                    <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </motion.div>
                            </div>
                        </div>
                    </motion.article>

                    {/* ═══════════ ARTICLE GRID — Remaining Cards ═══════════ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
                        {gridArticles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: index * 0.08 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col cursor-pointer group border border-gray-100/50 transform-gpu will-change-transform"
                            >
                                {/* Card Image */}
                                <div className="overflow-hidden">
                                    <img onError={(e) => { e.target.onerror = null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E"; }}
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 ease-out will-change-transform"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                        loading="lazy"
                                    />
                                </div>

                                {/* Card Content */}
                                <div className="flex flex-col flex-grow p-6">
                                    <span className="text-[#007AFF] text-xs font-bold uppercase tracking-widest mb-4 inline-block bg-blue-50 px-3 py-1 rounded-full self-start">
                                        {article.category}
                                    </span>
                                    <h3 className="text-2xl font-black text-[#1D1D1F] leading-tight mb-3 line-clamp-2 tracking-tighter">
                                        {article.title}
                                    </h3>
                                    <p className="text-gray-500 font-normal leading-relaxed mb-6 line-clamp-3 text-sm">
                                        {article.excerpt}
                                    </p>

                                    {/* Meta Footer */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                            <span>{article.date}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span>{article.readTime}</span>
                                        </div>
                                        <motion.span
                                            whileHover={{ x: -4 }}
                                            className="text-[#007AFF] font-bold text-xs flex items-center gap-1"
                                        >
                                            קרא עוד
                                            <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </motion.span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                </div>
            </div>
        </PageTransition >
    );
};

export default MagazinePage;
