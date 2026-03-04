import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

const articles = [
    {
        category: "פדגוגיה",
        title: "5 שיטות הוראה שמשלבות טכנולוגיה בלי לאבד את המגע האנושי",
        excerpt: "איך מורים מובילים בישראל משלבים מסכים חכמים ושיעורים פרונטליים לחוויית למידה עמוקה יותר.",
        image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800",
        date: "15 פברואר 2026"
    },
    {
        category: "טכנולוגיה",
        title: "מסכי MicroLED — האם זה הסטנדרט הבא לכיתות הלימוד?",
        excerpt: "סקירה טכנולוגית מקיפה על טכנולוגיית MicroLED ולמה היא עשויה להחליף את ה-LCD בתוך 3 שנים.",
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
        date: "8 פברואר 2026"
    },
    {
        category: "חדשנות",
        title: "כשהמעבדה נפגשת עם העולם האמיתי: STEM בשדה",
        excerpt: "פרויקט ייחודי של בתי ספר בנגב שמוציא את הלמידה מהכיתה ומשלב טכנולוגיה ניידת.",
        image: "https://images.unsplash.com/photo-1567168544230-db2832c1d398?auto=format&fit=crop&q=80&w=800",
        date: "1 פברואר 2026"
    },
    {
        category: "שוק החינוך",
        title: "תקציב טכנולוגיה 2026: מה משרד החינוך מתכנן ואיך להתכונן",
        excerpt: "ניתוח מעמיק של הקצאות התקציב הצפויות וההזדמנויות לרכש מוסדי מתוכנן.",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
        date: "25 ינואר 2026"
    }
];

const ArticleCard = ({ article }) => (
    <motion.article
        whileHover={{ y: -6 }}
        className="group cursor-pointer"
    >
        <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gray-200 mb-5">
            <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
        </div>
        <span className="text-xs font-bold text-brand-blue tracking-[0.15em] uppercase">
            {article.category}
        </span>
        <h3 className="text-xl md:text-2xl font-black text-brand-dark mt-2 mb-3 leading-tight tracking-tight group-hover:text-brand-blue transition-colors">
            {article.title}
        </h3>
        <p className="text-gray-500 leading-relaxed mb-4 line-clamp-2">
            {article.excerpt}
        </p>
        <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{article.date}</span>
            <span className="text-sm font-bold text-brand-blue group-hover:underline">
                קרא עוד ←
            </span>
        </div>
    </motion.article>
);

const MagazinePage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const featured = {
        category: "בינה מלאכותית",
        title: "כיתת העתיד: איך בינה מלאכותית משנה את תפקיד המורה?",
        excerpt: "מנהלים ואנשי חינוך ברחבי ישראל מתחילים לאמץ כלי AI שמשנים את דרך ההוראה — מהכנת שיעורים ועד הערכה אישית לכל תלמיד. סקירה מקיפה.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1400",
        date: "25 פברואר 2026"
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-light pt-32 pb-24 px-6 w-full">
                <div className="max-w-[1400px] mx-auto">

                    {/* Page Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <h1 className="text-5xl md:text-7xl font-black text-brand-dark tracking-tighter">
                            מגזין חדשנות
                        </h1>
                        <p className="text-lg text-gray-500 font-light mt-3">
                            תובנות, מגמות וכלים מעולם ה-EdTech הישראלי.
                        </p>
                    </motion.div>

                    {/* Featured Article Hero */}
                    <motion.article
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group cursor-pointer mb-20"
                    >
                        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden bg-gray-200 mb-6">
                            <img
                                src={featured.image}
                                alt={featured.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 right-0 p-8 md:p-12 max-w-3xl">
                                <span className="text-xs font-bold text-blue-300 tracking-[0.15em] uppercase mb-2 block">
                                    {featured.category}
                                </span>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-3">
                                    {featured.title}
                                </h2>
                                <p className="text-gray-300 text-base md:text-lg leading-relaxed hidden md:block">
                                    {featured.excerpt}
                                </p>
                            </div>
                        </div>
                    </motion.article>

                    {/* Article Grid */}
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16"
                    >
                        {articles.map((article, idx) => (
                            <motion.div
                                key={idx}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    show: { opacity: 1, y: 0 }
                                }}
                            >
                                <ArticleCard article={article} />
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </div>
        </PageTransition>
    );
};

export default MagazinePage;
