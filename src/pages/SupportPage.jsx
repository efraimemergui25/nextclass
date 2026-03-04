import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-right text-xl font-bold py-6 flex justify-between items-center cursor-pointer hover:text-brand-blue transition-colors text-brand-dark focus:outline-none"
            >
                <span>{question}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-2xl text-gray-400 shrink-0 mr-4"
                >
                    +
                </motion.span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-gray-500 leading-relaxed text-lg pr-0">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SupportPage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = [
        {
            question: "איך מחברים את המסך לרשת הבית ספרית?",
            answer: "כל מסכי nextclass תומכים בחיבור Ethernet ו-WiFi. פשוט חברו כבל רשת ליציאת ה-LAN או היכנסו להגדרות WiFi מתפריט המערכת. למדריך מפורט, הורידו את מדריך ההתקנה מהאזור למטה."
        },
        {
            question: "מה כוללת האחריות המורחבת?",
            answer: "האחריות המורחבת שלנו כוללת 3 שנים של שירות באתר הלקוח, החלפת חלקים ללא עלות, וזמן תגובה של עד 24 שעות. כולל כיסוי לפגמים בייצור, כשל בפאנל ובלוח האם."
        },
        {
            question: "האם ניתן לקבל הדרכה בזום?",
            answer: "בהחלט! אנו מציעים הדרכות זום מותאמות אישית לצוותי הוראה. ניתן לתאם הדרכה ראשונית חינם בעת רכישה, ולהזמין הדרכות נוספות בכל שלב דרך עמוד ״צור קשר״."
        },
        {
            question: "האם המסכים מותאמים לתוכנת ניהול כיתה (Classroom Management)?",
            answer: "כן, המסכים שלנו תואמים לכל תוכנות ניהול הכיתה הנפוצות כמו Google Classroom, Microsoft Teams for Education, ו-Apple Classroom. בנוסף, תוכנת EduEdit Studio שלנו מציעה יכולות ניהול מובנות."
        },
        {
            question: "כיצד מתבצעת הזמנת רכש (PO) ממשרד החינוך?",
            answer: "פשוט הזמינו דרך הקטלוג שלנו ובחרו באפשרות ״הזמנת רכש (PO)״ בעמוד הקופה. שלחו את מספר ה-PO המאושר ואנו נפיק חשבונית מסודרת מול כתב ההתחייבות."
        }
    ];

    const downloads = [
        {
            title: "מדריך למשתמש (PDF)",
            description: "הוראות הפעלה מלאות למסכי Pro Series",
            icon: (
                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            )
        },
        {
            title: "דרייברים ותוכנה",
            description: "הורדת דרייברים עדכניים ותוכנת EduEdit Studio",
            icon: (
                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
            )
        }
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-surface pt-32 pb-24 w-full">

                {/* Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto text-center mb-24 px-6"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-brand-dark mb-8 tracking-tight">
                        איך נוכל לעזור לצוות שלכם היום?
                    </h1>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="חפשו במרכז העזרה..."
                            className="bg-brand-light border-none rounded-full px-8 py-5 w-full text-lg shadow-inner focus:ring-2 focus:ring-brand-blue outline-none placeholder:text-gray-400 pr-14 transition-all"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                    </div>
                </motion.div>

                {/* FAQ Accordion */}
                <div className="max-w-3xl mx-auto px-6 mb-24">
                    <h2 className="text-2xl font-black text-brand-dark mb-8">שאלות נפוצות</h2>
                    <div>
                        {faqs.map((faq, idx) => (
                            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>

                {/* Downloads Section */}
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-2xl font-black text-brand-dark mb-8">הורדות ומשאבים</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {downloads.map((dl, idx) => (
                            <motion.a
                                key={idx}
                                href="#"
                                whileHover={{ y: -4 }}
                                className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all flex items-start gap-5 group"
                            >
                                <div className="bg-brand-light p-4 rounded-2xl shrink-0 group-hover:bg-brand-blue/10 transition-colors">
                                    {dl.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark text-lg mb-1 group-hover:text-brand-blue transition-colors">{dl.title}</h3>
                                    <p className="text-sm text-gray-500">{dl.description}</p>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>

            </div>
        </PageTransition>
    );
};

export default SupportPage;
