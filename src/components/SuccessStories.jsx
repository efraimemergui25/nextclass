import React from 'react';
import { Star, Quote } from 'lucide-react';

const STORIES = [
    {
        id: 1,
        quote: "המסכים שינו לחלוטין את צורת הלימוד בבית הספר. המורים מדווחים על זינוק בקשב התלמידים בכיתות ההיברידיות.",
        author: "מיכל אהרוני",
        role: "מנהלת תיכון הרצוג",
        rating: 5
    },
    {
        id: 2,
        quote: "האיכות העמידות יוצאת דופן. עברו שנתיים מאז ההתקנה ואנחנו באפס תקלות. שירות מדהים תמיד שזמין עבורנו.",
        author: "ירון כהן",
        role: "מנכ״ל מכללת העתיד",
        rating: 5
    },
    {
        id: 3,
        quote: "חוויית המגע חלקה כמו טאבלט. האפליקציות המובנות חוסכות למרצים שלנו שעות בהכנת מערכי שיעור מותאמים.",
        author: "ד״ר שירה לוי",
        role: "ראש מחלקת חדשנות, אוניברסיטת המרכז",
        rating: 5
    },
    {
        id: 4,
        quote: "השילוב של המסך מול מצלמות ה-Zoom בחדרי הישיבות שלנו מייצר היברידיות מושלמת. פשוט עובד בצורה מבריקה.",
        author: "עומר יצחקי",
        role: "VP Operations, TechCorp",
        rating: 5
    }
];

const SuccessStories = () => {
    // Duplicate arrays twice so it seamlessly loops via CSS layout translation
    const SCROLL_ITEMS = [...STORIES, ...STORIES, ...STORIES];

    return (
        <section className="py-16 md:py-24 lg:py-32 bg-[#F5F5F7] overflow-hidden" dir="rtl">
            <div className="text-center mb-16 md:mb-24 px-6 max-w-4xl mx-auto flex flex-col gap-4">
                <span className="text-[#007AFF] font-bold text-sm tracking-widest uppercase block">Wall of Love</span>
                <h2 className="text-4xl md:text-7xl font-black text-[#1D1D1F] tracking-tight leading-tight">הלקוחות שלנו מדברים</h2>
            </div>

            {/* Marquee Container with Gradient Mask */}
            <div
                className="relative w-full flex overflow-hidden py-4"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                }}
            >
                {/* 
                  RTL Marquee logic: RTL naturally aligns right.
                  The animation moves to positive translateX to push the container rightward 
                  revealing the duplicated right-sided items.
                */}
                <div className="flex gap-8 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap px-8 w-max">
                    {SCROLL_ITEMS.map((story, idx) => (
                        <div
                            key={`${story.id}-${idx}`}
                            className="w-[380px] md:w-[480px] flex-shrink-0 bg-white/50 backdrop-blur-2xl border border-white/80 p-10 rounded-[2.5rem] shadow-[0_12px_40px_rgb(0_0_0/0.06)] flex flex-col gap-8 cursor-default transition-all duration-500 relative group overflow-hidden"
                        >
                            <div className="absolute -top-10 -left-10 text-[#007AFF]/5 rotate-180 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                <Quote size={180} />
                            </div>

                            <div className="flex gap-1.5 text-[#F5A623] relative z-10">
                                {[...Array(story.rating)].map((_, i) => (
                                    <Star key={i} size={24} fill="currentColor" strokeWidth={0} />
                                ))}
                            </div>

                            <p className="text-2xl font-bold text-[#1D1D1F] leading-snug whitespace-normal relative z-10">
                                "{story.quote}"
                            </p>

                            <div className="mt-auto pt-8 border-t border-gray-200/60 flex items-center gap-5 whitespace-normal relative z-10">
                                <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-black text-gray-500 text-xl border border-white shadow-sm shrink-0">
                                    {story.author.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg text-[#1D1D1F] leading-tight mb-0.5">{story.author}</h4>
                                    <span className="text-sm font-semibold text-gray-500 block leading-tight">{story.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Global Keyframes Injection for Tailwind */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(33.3333%); /* Shifts exactly 1 array worth of duplicate items to right */ }
                }
                [dir="rtl"] .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
            `}} />
        </section>
    );
};

export default SuccessStories;
