import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import PageTransition from '../components/PageTransition';
import { Sparkles, Clock, ArrowLeft } from 'lucide-react';

// ─── Images pool ──────────────────────────────────────────────────────────────

const IMAGES = [
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555529902-5261145633bf?q=80&w=1200&auto=format&fit=crop",
];

// ─── Articles ─────────────────────────────────────────────────────────────────

const articles = [
    // חדשנות פדגוגית
    { id: 1, category: "חדשנות פדגוגית", title: "איך להפיק את המרב מטכנולוגיית הכיתה: מדריך ה-ROI", excerpt: "מחקר מראה כי שילוב נכון של מסכים אינטראקטיביים מייצר תשואה אמיתית — במעורבות, בחיסכון זמן ובשיפור בהישגים. סקירה מקצועית עם נתוני שטח.", date: "17 מאי 2024", readTime: "6 דק׳", image: IMAGES[0], url: "https://www.eschoolnews.com/digital-learning/2024/05/17/interactive-whiteboard-roi-classroom-edtech/", source: "eSchool News" },
    { id: 2, category: "חדשנות פדגוגית", title: "למידה מבוססת פרויקטים שמערבת את כל התלמידים", excerpt: "למידה מבוססת פרויקטים מקדמת את ארבעת כישורי המאה ה-21: חשיבה ביקורתית, שיתוף פעולה, תקשורת ויצירתיות. הדגשת קול התלמיד ומרחב בחירה הופכים את החוויה למשמעותית ומניעה.", date: "26 ספטמבר 2024", readTime: "6 דק׳", image: IMAGES[4], url: "https://www.edutopia.org/article/project-based-learning-engages-all-students", source: "Edutopia" },
    { id: 3, category: "חדשנות פדגוגית", title: "שימוש בכלי AI לתמיכה בלמידה מבוססת פרויקטים", excerpt: "שילוב AI בלמידה מבוססת פרויקטים מאפשר לתלמידים גישה לכלים שמסייעים לחקור, ליצור ולשפר עבודות. המאמר מסביר כיצד להטמיע AI בצורה פדגוגית נכונה שמחזקת ולא מחליפה את חשיבת התלמיד.", date: "20 יוני 2025", readTime: "5 דק׳", image: IMAGES[1], url: "https://www.edutopia.org/article/using-ai-tools-support-pbl/", source: "Edutopia" },
    { id: 4, category: "חדשנות פדגוגית", title: "שיטות SEL לניהול כיתה אפקטיבי", excerpt: "למידה חברתית-רגשית כוללת בניית מיומנויות מעשיות כמו ניהול פרויקטים קבוצתיים, התמודדות עם לחץ ופתרון קונפליקטים. שילוב SEL בהוראה האקדמית מגביר מוטיבציה והישגים.", date: "15 אוקטובר 2024", readTime: "4 דק׳", image: IMAGES[2], url: "https://www.edutopia.org/article/sel-strategies-classroom-management/", source: "Edutopia" },
    { id: 5, category: "חדשנות פדגוגית", title: "למידה מבוססת פרויקטים: להעמיק ולא למהר", excerpt: "חדשנות אמיתית בכיתה מתרחשת כאשר תלמידים חוזרים שוב ושוב לשגרות מרכזיות, במקום לרוץ לפרויקט הבא. העיקרון: פחות הוא יותר כשמדובר בפרויקטים משמעותיים.", date: "19 נובמבר 2025", readTime: "5 דק׳", image: IMAGES[3], url: "https://www.edutopia.org/article/refining-project-based-learning-emphasizing-depth/", source: "Edutopia" },

    // מעבדות STEM
    { id: 6, category: "מעבדות STEM", title: "כיצד לתכנן מעבדת מדעים מוכנה לעתיד", excerpt: "מדריך מעשי לתכנון ועיצוב מעבדות STEM מודרניות — מהפריסה הפיזית ועד לשילוב ציוד דיגיטלי, כולל שיקולי בטיחות ותחזוקה.", date: "אוגוסט 2023", readTime: "8 דק׳", image: IMAGES[1], url: "https://www.techlearning.com/news/how-to-design-future-ready-science-labs", source: "Tech & Learning" },
    { id: 7, category: "מעבדות STEM", title: "שלוש דרכים לשלב עקרונות מייקרספייס בשיעורי STEM", excerpt: "מורי מדעים ומתמטיקה יכולים לשלב פעילויות יצירה מעשיות — חיתוך לייזר ותכנות — בשיעורים רגילים, מבלי לדרוש חדר מייקרספייס ייעודי. המורים מדווחים על עלייה ניכרת במוטיבציה.", date: "14 נובמבר 2024", readTime: "5 דק׳", image: IMAGES[5], url: "https://www.edutopia.org/article/makerspace-integration-stem-classes/", source: "Edutopia" },
    { id: 8, category: "מעבדות STEM", title: "כיצד בתי ספר יוצרים ומשתמשים במייקרספייסים", excerpt: "מחוזות ברחבי ארה\"ב בנו מרחבי יצירה מצוידים שמאפשרים לתלמידים לעצב, להמציא ולהתנסות ברובוטיקה ותכנות. השקעה בתשתיות אלו מייצרת ערך פדגוגי לטווח ארוך.", date: "מרץ 2024", readTime: "6 דק׳", image: IMAGES[6], url: "https://www.techlearning.com/resources/making-the-grade-how-schools-are-creating-and-using-makerspaces", source: "Tech & Learning" },
    { id: 9, category: "מעבדות STEM", title: "שילוב STEM מוקדם: קידוד, רובוטיקה ומדעים מגיל צעיר", excerpt: "מחקרים מראים כי חשיפה מוקדמת לקידוד ורובוטיקה מפתחת חשיבה אלגוריתמית שנשמרת לאורך שנות הלמידה. ההשקעה בגיל הרך נושאת פירות בהישגים מדעיים בחטיבה ובתיכון.", date: "אוגוסט 2024", readTime: "5 דק׳", image: IMAGES[0], url: "https://www.techlearning.com/news/how-implementing-coding-stem-and-robotics-early-can-benefit-students", source: "Tech & Learning" },
    { id: 10, category: "מעבדות STEM", title: "שילוב כישורי STEM לאורך תכנית הלימודים", excerpt: "בתי ספר משלבים STEM לא רק בשיעורי מדעים אלא גם בהיסטוריה, אמנות ושפה. שילוב רוחבי זה מכין תלמידים לעולם עבודה רב-תחומי הנדרש בשוק ה-AI.", date: "אוגוסט 2025", readTime: "4 דק׳", image: IMAGES[3], url: "https://www.edutopia.org/article/integrating-stem-skills-across-curriculum/", source: "Edutopia" },

    // טרנדים
    { id: 11, category: "טרנדים", title: "5 טרנדים שיעצבו את ה-EdTech ב-2026", excerpt: "EdSurge מנתחת את המגמות המרכזיות בחינוך K-12: מ-AI אישי ועד לכלים שמודדים מעורבות תלמידים — מה שמנהלי מוסדות צריכים לדעת.", date: "27 ינואר 2026", readTime: "5 דק׳", image: IMAGES[2], url: "https://www.edsurge.com/news/2026-01-27-k-12-edtech-in-2026-five-trends-shaping-the-year-ahead", source: "EdSurge" },
    { id: 12, category: "טרנדים", title: "המבט קדימה: טרנדים בחינוך K-12 לשנת 2026", excerpt: "ניתוח מקיף בוחן כיצד מגמות AI, ממשל נתונים ואחריות מדידה ישנו את פני ה-EdTech. המחוזות עוברים ממנטליות של רכישה לממשל מאסטרטגי של כלים קיימים.", date: "15 ינואר 2026", readTime: "6 דק׳", image: IMAGES[7], url: "https://www.edsurge.com/news/2026-01-15-peering-into-the-future-look-for-these-k-12-education-trends-in-2026", source: "EdSurge" },
    { id: 13, category: "טרנדים", title: "10 הסיפורים שקוראי K-12 לא יכלו להפסיק לקרוא ב-2024", excerpt: "מורים חיפשו בעיקר מידע על AI בכיתה, נגישות טכנולוגית לתלמידים עם מוגבלויות ותוצאות למידה מדידות. הציבור הפדגוגי מעוניין בראיות, לא בהבטחות שיווקיות.", date: "9 ינואר 2025", readTime: "5 דק׳", image: IMAGES[4], url: "https://www.edsurge.com/news/2025-01-09-here-are-the-10-stories-k-12-readers-couldn-t-put-down-in-2024", source: "EdSurge" },
    { id: 14, category: "טרנדים", title: "האם הגיע הזמן לזנוח את רעיון ה'הפרעה' ב-EdTech?", excerpt: "מסגרת ה'הפרעה טכנולוגית' בחינוך הוכיחה עצמה כבלתי מועילה. במקומה מציגים חוקרים גישה של 'שיפור מתמיד ומדיד'. המעבר מחשיבת סטארטאפ לחשיבת מוסד חינוכי הוא המפתח.", date: "12 אפריל 2024", readTime: "6 דק׳", image: IMAGES[1], url: "https://www.edsurge.com/news/2024-04-12-it-s-time-to-ditch-the-idea-of-edtech-disruption-but-what-comes-next", source: "EdSurge" },
    { id: 15, category: "טרנדים", title: "טכנולוגיית כיתה: הישנה, החדשה — ומה באמת עובד", excerpt: "מה ממשיך לעבוד ומה חדש בטכנולוגיות כיתה ב-2024? סקירה על כלים שמורים באמת משתמשים בהם — ולמה.", date: "20 פברואר 2024", readTime: "7 דק׳", image: IMAGES[3], url: "https://www.eschoolnews.com/innovative-teaching/2024/02/20/classroom-technology-new-tried-and-true/", source: "eSchool News" },

    // מקרי בוחן
    { id: 16, category: "מקרי בוחן", title: "LAUSD משיקה כלי AI מהפכני לתלמידים, הורים ומורים", excerpt: "מחוז לוס אנג'לס, השני בגודלו בארה\"ב, הפך לראשון שמיישם AI בקנה מידה מערכתי. כלי AI ייעודי עוזר לתלמידים בשיעורי בית ולמורים בתכנון שיעורים — מקרה בוחן שמחוזות רבים עוקבים אחריו.", date: "26 מרץ 2024", readTime: "5 דק׳", image: IMAGES[2], url: "https://www.eschoolnews.com/digital-learning/2024/03/26/lausd-launches-revolutionary-ai-tool/", source: "eSchool News" },
    { id: 17, category: "מקרי בוחן", title: "למידה מותאמת אישית בקנה מידה: האם ניתן לסגור פערי הישגים?", excerpt: "מחקר מקיף בוחן תוכניות למידה מותאמת אישית ב-10 מחוזות ומנסה לענות: האם הטכנולוגיה באמת סוגרת פערים? מחוזות שהשקיעו בליווי פדגוגי ראו תוצאות טובות פי שניים.", date: "28 מרץ 2022", readTime: "8 דק׳", image: IMAGES[5], url: "https://www.edsurge.com/news/2022-03-28-can-personalized-learning-be-scaled-to-ease-teacher-burdens-and-close-achievement-gaps", source: "EdSurge" },
    { id: 18, category: "מקרי בוחן", title: "בתי ספר מחזיקים מוצרי EdTech בסטנדרט גבוה יותר", excerpt: "מחוזות מוסיפים תהליכי ביקורת מחמירים לפני רכישת כלים טכנולוגיים ודורשים ראיות מחקריות. השינוי בתרבות הרכישה הוביל לחיסכון משמעותי ולתוצאות טובות יותר.", date: "5 אוגוסט 2024", readTime: "5 דק׳", image: IMAGES[0], url: "https://www.edsurge.com/news/2024-08-05-how-schools-are-holding-edtech-products-to-a-higher-standard", source: "EdSurge" },
    { id: 19, category: "מקרי בוחן", title: "חמישה דברים שצריך לדעת על תגבור לימודי אינטנסיבי", excerpt: "תגבור לימודי אינטנסיבי — שלוש פעמים בשבוע ומעלה — הוא אחד הכלים האפקטיביים ביותר לסגירת פערים לאחר הקורונה. עלות-תועלת הגישה מוצגת עם נתונים מדידים.", date: "26 פברואר 2024", readTime: "4 דק׳", image: IMAGES[6], url: "https://www.eschoolnews.com/educational-leadership/2024/02/26/5-things-to-know-about-high-dosage-tutoring/", source: "eSchool News" },
    { id: 20, category: "מקרי בוחן", title: "שילוט דיגיטלי בחינוך: הכלים שמורים צריכים", excerpt: "כיצד שילוט דיגיטלי משדרג תקשורת מוסדית, מפחית עומס מנהלי ומאפשר למורים לחזור להוראה — עם דוגמאות מהשטח.", date: "אוקטובר 2023", readTime: "4 דק׳", image: IMAGES[7], url: "https://www.eschoolnews.com/featured/2020/10/23/digital-signage-offers-teachers-the-tools-they-need-to-succeed/", source: "eSchool News" },

    // תשתיות
    { id: 21, category: "תשתיות", title: "תוכנית הטכנולוגיה הלאומית לחינוך 2024: מה שחייבים לדעת", excerpt: "משרד החינוך האמריקאי פרסם תוכנית הטכנולוגיה הלאומית הראשונה מאז 2016 הפונה לשלושה פערים: גישה, עיצוב ושימוש דיגיטלי. זהו מסמך ייחוס מרכזי לכל מנהל טכנולוגיה מחוזי.", date: "ינואר 2024", readTime: "7 דק׳", image: IMAGES[0], url: "https://www.techlearning.com/news/the-2024-national-educational-technology-plan-is-out-heres-what-you-need-to-know", source: "Tech & Learning" },
    { id: 22, category: "תשתיות", title: "גישור על הפער הדיגיטלי: מחוזות שבנו רשתות אלחוטיות עצמאיות", excerpt: "מחוזות שנאבקו עם חיבור אינטרנט לא אמין הקימו רשתות אלחוטיות משלהם. שיתוף פעולה מקומי פתר בעיות חיבור שחברות הסלולר לא יכלו לפתור — והחזיר מאות תלמידים לזרם הדיגיטלי.", date: "2024", readTime: "5 דק׳", image: IMAGES[4], url: "https://www.techlearning.com/news/overcoming-the-digital-divide-school-districts-create-their-own-wireless-networks", source: "Tech & Learning" },
    { id: 23, category: "תשתיות", title: "בניית רשתות סלולריות גמישות ומאובטחות בבתי ספר", excerpt: "עם התרחבות מכשירי 1:1, תשתית הרשת הפכה לעמוד השדרה הקריטי. המאמר מציג עקרונות ל-WLAN בית ספרי שמסוגל להתמודד עם אלפי מכשירים בו-זמנית.", date: "2024", readTime: "5 דק׳", image: IMAGES[5], url: "https://www.techlearning.com/news/building-flexible-and-secure-mobile-networks-in-schools", source: "Tech & Learning" },
    { id: 24, category: "תשתיות", title: "כיצד בתי ספר צריכים לבחון מחדש אבטחת סייבר בעידן ה-AI", excerpt: "ככל שכלי AI חודרים לסביבת הלמידה, משטח ההתקפה של בתי הספר מתרחב. 66% מהמחוזות אינם מחזיקים אפילו עובד סייבר במשרה מלאה. המאמר מציג מסגרת פרקטית להגנה.", date: "מאי 2024", readTime: "6 דק׳", image: IMAGES[2], url: "https://www.techlearning.com/news/how-schools-should-reassess-cybersecurity-due-to-ai", source: "Tech & Learning" },
    { id: 25, category: "תשתיות", title: "השקעה בתשתית הנכונה: מה מחוזות צריכים לדעת ב-2025", excerpt: "עם כניסת AI לכל כיתה, תשתית ה-IT הופכת למשאב אסטרטגי. המאמר מנחה מנהלי טכנולוגיה מחוזיים בתעדוף השקעות: רוחב פס, ענן, אבטחה ותמיכה.", date: "2025", readTime: "6 דק׳", image: IMAGES[1], url: "https://www.techlearning.com/news/the-new-role-of-the-ed-tech-director", source: "Tech & Learning" },

    // בינה מלאכותית
    { id: 26, category: "בינה מלאכותית", title: "AI בכיתה: למה יותר מורים בוחרים בו — וממה צריך להיזהר", excerpt: "EdWeek חוקרת את הגידול המהיר באימוץ AI בבתי ספר, מה מניע מורים לשלב אותו, ומהן המגבלות שחשוב להכיר לפני.", date: "ינואר 2026", readTime: "6 דק׳", image: IMAGES[1], url: "https://www.edweek.org/technology/more-teachers-are-using-ai-in-their-classrooms-heres-why/2026/01", source: "Education Week" },
    { id: 27, category: "בינה מלאכותית", title: "כיצד AI משנה את החינוך: 5 הסיפורים הגדולים של 2024", excerpt: "Education Week מסכמת את חמשת הסיפורים שסימנו מפנה: פיצוץ בשימוש תלמידי ב-AI, ראשית הסדרת מדיניות מחוזית, וצמיחת כלי זיהוי AI. 85% מהמורים השתמשו ב-AI בשנת הלימודים.", date: "דצמבר 2024", readTime: "6 דק׳", image: IMAGES[7], url: "https://www.edweek.org/technology/how-ai-is-changing-education-the-years-top-5-stories/2024/12", source: "Education Week" },
    { id: 28, category: "בינה מלאכותית", title: "'זה לא קסם': כיצד בתי ספר מלמדים אוריינות AI", excerpt: "מחוזות מפתחים תכניות ייעודיות לאוריינות AI שמסבירות לתלמידים כיצד המערכות עובדות ומה מגבלותיהן. הגישה מכינה דור מוכן לעתיד AI עם חשיבה ביקורתית.", date: "אוקטובר 2025", readTime: "5 דק׳", image: IMAGES[3], url: "https://www.edweek.org/technology/its-not-magic-how-these-schools-are-teaching-ai-literacy/2025/10", source: "Education Week" },
    { id: 29, category: "בינה מלאכותית", title: "יחידת לימוד AI בPBL לתלמידי בית ספר יסודי", excerpt: "תלמידי יסודי משתמשים ב-AI לתכנון ובניית עיר לגו: מגדירים דרישות, מייצרים עיצובים ומשפרים לפי משוב. המורות מדווחות על רמת מעורבות שלא ראו לפני כן.", date: "23 ספטמבר 2024", readTime: "4 דק׳", image: IMAGES[6], url: "https://www.edutopia.org/article/pbl-ai-elementary-students/", source: "Edutopia" },
    { id: 30, category: "בינה מלאכותית", title: "מדיניות AI בבתי ספר: המדריך המעשי למנהלים", excerpt: "עם התפשטות הכלים, מנהלים נדרשים לנסח מדיניות ברורה — מה מותר, מה אסור ואיך לאכוף. המאמר מציג מסגרת מדיניות מעשית שמחוזות מובילים כבר אימצו.", date: "2025", readTime: "5 דק׳", image: IMAGES[4], url: "https://www.edweek.org/technology/ai-policy-schools-administrators-guide/2025", source: "Education Week" },
];

const FALLBACK = "https://images.unsplash.com/photo-1618477388954-7852f32655ec?q=80&w=800&auto=format&fit=crop";

const CATEGORY_COLORS = {
    'חדשנות פדגוגית': { bg: 'bg-blue-50',    text: 'text-[#007AFF]',   dot: 'bg-[#007AFF]' },
    'מעבדות STEM':    { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    'טרנדים':         { bg: 'bg-purple-50',  text: 'text-purple-600',  dot: 'bg-purple-500' },
    'מקרי בוחן':      { bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-500' },
    'תשתיות':         { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-500' },
    'בינה מלאכותית':  { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-500' },
};
function getColor(cat) { return CATEGORY_COLORS[cat] ?? { bg: 'bg-blue-50', text: 'text-[#007AFF]', dot: 'bg-[#007AFF]' }; }

function CategoryBadge({ cat, size = 'sm' }) {
    const c = getColor(cat);
    return (
        <span className={`inline-flex items-center gap-1.5 ${c.bg} ${c.text} font-black ${size === 'lg' ? 'text-[10px] px-3.5 py-1.5' : 'text-[9px] px-3 py-1'} rounded-full uppercase tracking-[0.18em]`}>
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
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{article.source}</span>
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
                <p className="text-[9px] font-bold text-[#AEAEB2] uppercase tracking-wider mb-2">{article.source}</p>
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
    const rest = displayArticles.slice(1);
    const filtered = activeCategory === 'הכל' ? rest : rest.filter(a => a.category === activeCategory);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-28 overflow-x-hidden" dir="rtl">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10">

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.25em] mb-7 border border-blue-100">
                            <Sparkles size={10} /><span>NextClass Institute · מגזין חדשנות פדגוגית</span>
                        </div>
                        <h1 className="font-apple-display text-[#1D1D1F] text-4xl md:text-7xl tracking-tighter leading-[0.95] mb-5">
                            תובנות שמובילות{' '}
                            <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>שינוי.</span>
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
