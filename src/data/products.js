const products = [
    // Category 1: מסכים אינטראקטיביים והקרנה (10 items)
    {
        id: "display-pro-75-uhd",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע אינטראקטיבי Pro 75\" UHD 4K",
        price: 9500,
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800",
        description: "מסך אינטראקטיבי מתקדם למוסדות חינוך עם פאנל 4K UHD, מגע Zero Bonding מדויק ומערכת Android 13 מובנית.",
        specs: [
            { label: "גודל מסך", value: "75 אינץ' UHD" },
            { label: "טכנולוגיית מגע", value: "40 נקודות מגע Zero Bonding" },
            { label: "מערכת הפעלה", value: "Android 13 + OPS Slot" },
            { label: "זכוכית", value: "Anti-Glare 4mm Tempered" }
        ]
    },
    {
        id: "display-max-86-uhd",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע אינטראקטיבי Max 86\" UHD 4K",
        price: 14500,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800",
        videoUrl: "https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4",
        description: "פתרון דגל לאולמות הרצאה וספריות. שטח עבודה ענק ברזולוציית 4K עם חיישני אור סביבתי וסינון אור כחול.",
        specs: [
            { label: "גודל מסך", value: "86 אינץ' UHD" },
            { label: "בהירות", value: "450 cd/m2" },
            { label: "רמקולים", value: "2x20W + סאב מובנה" },
            { label: "מצלמה", value: "4K AI מובנית" }
        ]
    },
    {
        id: "projector-laser-5000",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מקרן לייזר מקצועי 5000 לומן למרחבי למידה",
        price: 7200,
        image: "https://images.unsplash.com/photo-1517604931442-7e0caff332bb?auto=format&fit=crop&q=80&w=800",
        description: "מקרן לייזר עוצמתי ללא צורך בהחלפת נורה. בהירות גבוהה במיוחד המאפשרת הקרנה בחדרים מוארים ללא החשכה.",
        specs: [
            { label: "טכנולוגיה", value: "Laser Phosphor" },
            { label: "עוצמת הארה", value: "5000 ANSI Lumens" },
            { label: "אורך חיי המקור", value: "עד 30,000 שעות" },
            { label: "רזולוציה", value: "WUXGA (1920x1200)" }
        ]
    },
    {
        id: "display-ultra-98-4k",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע אינטראקטיבי Ultra 98\" 4K",
        price: 28000,
        image: "https://images.unsplash.com/photo-1492690138406-80f089167f5c?auto=format&fit=crop&q=80&w=800",
        videoUrl: "https://videos.pexels.com/video-files/2278095/2278095-uhd_2560_1440_30fps.mp4",
        description: "מסך ענק לאודיטוריומים ומרכזי חדשנות. מחליף לחלוטין את הצורך במקרן עם ניגודיות עילאית ושחור מוחלט.",
        specs: [
            { label: "גודל", value: "98 אינץ'" },
            { label: "פנל", value: "IPS מסחרי (Portrait/Landscape)" },
            { label: "שעות פעילות", value: "24/7 רציף" },
            { label: "משקל", value: "88 ק\"ג" }
        ]
    },
    {
        id: "projector-short-throw",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מקרן טווח קצר (Short Throw) לקולנוע כיתתי",
        price: 4900,
        image: "https://images.unsplash.com/photo-1516321497487-e288fb19a13f?auto=format&fit=crop&q=80&w=800",
        description: "מקרן להתקנה קרובה לקיר המונע הצללה של המורה על התמונה. מושלם לשימוש עם לוחות מחיקים אינטראקטיביים.",
        specs: [
            { label: "יחס הקרנה", value: "0.49:1" },
            { label: "בהירות", value: "3500 ANSI Lumens" },
            { label: "כניסות", value: "HDMI x2, VGA, LAN" },
            { label: "רמקול", value: "10W מובנה" }
        ]
    },
    {
        id: "display-flex-65-mobile",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע נייד Flex 65\" עם עגלה מוטורית",
        price: 8900,
        image: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=800",
        description: "חוויית למידה ניידת. עגלה מוטורית שקטה המאפשרת שינוי זווית המסך למצב שולחן מגע אינטראקטיבי.",
        specs: [
            { label: "גודל", value: "65 אינץ'" },
            { label: "עגלה", value: "מוטורית עם שלט רחוק" },
            { label: "זווית הטיה", value: "0°-90° (שולחן מגע)" },
            { label: "ניידות", value: "גלגלי סיליקון שקטים עם מעצור" }
        ]
    },
    {
        id: "projector-laser-7000",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מקרן לייזר מקצועי 7000 לומן לאודיטוריום",
        price: 18500,
        image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&q=80&w=800",
        description: "פתרון עוצמתי לאולמות כנסים בבתי ספר. תומך בעדשות מתחלפות ושליטה מלאה דרך הרשת הארגונית.",
        specs: [
            { label: "עוצמה", value: "7000 ANSI Lumens" },
            { label: "אופטיקה", value: "עדשות מתחלפות (אופציונלי)" },
            { label: "קישוריות", value: "HDBaseT, SDI, 3D Sync" },
            { label: "שקט פעולה", value: "32dB (Eco Mode)" }
        ]
    },
    {
        id: "display-zero-75",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע 75\" Zero Bonding Android 13",
        price: 11200,
        image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800",
        description: "הדור הבא של מסכי המגע. טכנולוגיית Zero Bonding המבטלת את המרווח בין הזכוכית לפאנל לכתיבה טבעית.",
        specs: [
            { label: "דיוק כתיבה", value: "0.5 מ\"מ" },
            { label: "מעבד", value: "Octa-Core 8GB RAM 128GB ROM" },
            { label: "קישוריות", value: "Wi-Fi 6, Bluetooth 5.2" },
            { label: "חיישנים", value: "NFC, זיהוי אור, קרבה" }
        ]
    },
    {
        id: "projector-led-mobile",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מקרן LED נייד למסעות שטח חינוכיים",
        price: 1500,
        image: "https://images.unsplash.com/photo-1461151304267-38535e770d79?auto=format&fit=crop&q=80&w=800",
        description: "מקרן קומפקטי קל משקל עם סוללה מובנית. מתאים לפעילויות חוץ ותצוגה מהירה ללא תשתית קבועה.",
        specs: [
            { label: "משקל", value: "800 גרם" },
            { label: "סוללה", value: "עד 3 שעות הקרנה" },
            { label: "חיבור", value: "USB-C DisplayPort, HDMI" },
            { label: "פוקוס", value: "אוטומטי מהיר" }
        ]
    },
    {
        id: "display-ai-86",
        category: "מסכים אינטראקטיביים והקרנה",
        title: "מסך מגע 86\" עם מצלמת AI מובנית",
        price: 16900,
        image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
        videoUrl: "https://videos.pexels.com/video-files/3194277/3194277-uhd_2560_1440_25fps.mp4",
        description: "מסך חכם המזהה את הדובר ומבצע עקיבה אוטומטית. מושלם ללמידה היברידית והקלטת שיעורים באיכות גבוהה.",
        specs: [
            { label: "מצלמה", value: "4K AI Auto-Framing" },
            { label: "מיקרופונים", value: "8 Microphone Array" },
            { label: "ניקוי רעשים", value: "AI Noise Cancellation" },
            { label: "מערכת", value: "Android 13 Dual OS Ready" }
        ]
    },

    // Category 2: מחשוב לצוות ותלמידים (10 items)
    {
        id: "student-chromebook-rugged",
        category: "מחשוב לצוות ותלמידים",
        title: "מחשב נייד מוקשח Chromebook 11.6\" לתלמיד",
        price: 1250,
        image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800",
        description: "מחשב למידה עמיד לנפילות ונוזלים. מיועד לשימוש אינטנסיבי בסביבת כיתה עם סוללה ליום שלם.",
        specs: [
            { label: "מעבד", value: "Intel Celeron N5100" },
            { label: "זיכרון/אחסון", value: "4GB RAM / 64GB eMMC" },
            { label: "עמידות", value: "MIL-STD-810H זכוכית מחוזקת" },
            { label: "סוללה", value: "עד 12 שעות עבודה" }
        ]
    },
    {
        id: "teacher-laptop-pro",
        category: "מחשוב לצוות ותלמידים",
        title: "נייד מורה עוצמתי Core i7 16GB RAM 14\"",
        price: 4800,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800",
        description: "תחנת עבודה ניידת לצוות החינוכי. ביצועים גבוהים לניהול שיעורים, עריכת תוכן והרצת אפליקציות כבדות.",
        specs: [
            { label: "מעבד", value: "Intel Core i7-1355U" },
            { label: "מסך", value: "14\" QHD IPS Anti-Glare" },
            { label: "אבטחה", value: "טביעת אצבע ושבב TPM 2.0" },
            { label: "משקל", value: "1.3 ק\"ג" }
        ]
    },
    {
        id: "mini-pc-ops-modular",
        category: "מחשוב לצוות ותלמידים",
        title: "מחשב Mini-PC OPS למסכים אינטראקטיביים",
        price: 2500,
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
        description: "יחידת מחשוב מודולרית הנטענת בתוך המסך האינטראקטיבי. הופכת כל מסך למחשב Windows חזק ללא צורך בכבלים.",
        specs: [
            { label: "מעבד", value: "Intel Core i5-12400" },
            { label: "זיכרון", value: "8GB DDR4 (עד 32GB)" },
            { label: "אחסון", value: "256GB NVMe SSD" },
            { label: "מערכת", value: "Windows 11 Pro Education" }
        ]
    },
    {
        id: "tablet-rugged-stem",
        category: "מחשוב לצוות ותלמידים",
        title: "טאבלט למידה מוקשח 10\" עם עט סטיילוס",
        price: 1800,
        image: "https://images.unsplash.com/photo-1542744173-8e0ee268cf36?auto=format&fit=crop&q=80&w=800",
        description: "טאבלט למידה אקטיבית. כולל עט רגיש למגע ושכבת הגנה נגד חבטות. מתאים לסיורים לימודיים ושימוש בשטח.",
        specs: [
            { label: "מסך", value: "10.1\" WUXGA Touch" },
            { label: "עט", value: "Active Stylus 4096 levels" },
            { label: "מעבד", value: "Octa-Core 2.4GHz" },
            { label: "עמידות", value: "IP52 אבק והתזות מים" }
        ]
    },
    {
        id: "laptop-media-edit",
        category: "מחשוב לצוות ותלמידים",
        title: "נייד עריכה וגרפיקה לתלמידי תקשורת",
        price: 6900,
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
        description: "מחשב נייד מקצועי עם כרטיס גרפי ייעודי. מיועד למגמות סייבר, עיצוב גרפי ועריכת וידאו 4K.",
        specs: [
            { label: "כרטיס מסך", value: "NVIDIA RTX 4050 6GB" },
            { label: "מעבד", value: "Intel Core i9 Hybrid" },
            { label: "מסך", value: "15.6\" 100% sRGB Color Accurate" },
            { label: "אחסון", value: "1TB Gen4 SSD" }
        ]
    },
    {
        id: "mini-pc-zero-client",
        category: "מחשוב לצוות ותלמידים",
        title: "מחשב Mini-PC Zero Client למעבדות",
        price: 850,
        image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800",
        description: "פתרון חסכוני למעבדות מחשבים. עובד בשיטת וירטואליזציה לניהול מרכזי קל וצריכת חשמל אפסית.",
        specs: [
            { label: "מעבד", value: "ARM SoC Fanless" },
            { label: "תמיכה", value: "VMware / Citrix / RDP" },
            { label: "חיבורים", value: "DisplayPort, 4xUSB, LAN" },
            { label: "צריכה", value: "≤5W בלבד" }
        ]
    },
    {
        id: "chromebook-touch-flip",
        category: "מחשוב לצוות ותלמידים",
        title: "Chromebook Touch 2-in-1 מתהפך לתלמיד",
        price: 1550,
        image: "https://images.unsplash.com/photo-1526657782461-9fe134027df5?auto=format&fit=crop&q=80&w=800",
        description: "מחשב משולב טאבלט. מסך מגע מסתובב 360 מעלות ומצלמה כפולה (קדמית ואחורית) לתיעוד שיעורים במצב טאבלט.",
        specs: [
            { label: "מנגנון", value: "ציר 360 מעלות" },
            { label: "מסך", value: "12\" IPS Multi-Touch" },
            { label: "מצלמה", value: "World Facing Camera 8MP" },
            { label: "מעבד", value: "Kompanio 520 / 8GB RAM" }
        ]
    },
    {
        id: "workstation-it-mobile",
        category: "מחשוב לצוות ותלמידים",
        title: "תחנת עבודה ניידת לצוות IT מוסדי",
        price: 5500,
        image: "https://images.unsplash.com/photo-1525373612132-b3e2773d2013?auto=format&fit=crop&q=80&w=800",
        description: "מחשב נייד מוקשח במיוחד לצוותי תחזוקה. כולל יציאות מורשת (Serial) לניהול תשתיות וסוללה כפולה.",
        specs: [
            { label: "חיבוריות", value: "RS232, RJ45, USB-C, SIM 4G" },
            { label: "מבנה", value: "מארז מגנזיום מחוזק" },
            { label: "אבטחה", value: "Smart Card Reader + TPM" },
            { label: "עמידות", value: "נפילה מגובה 1.5 מטר" }
        ]
    },
    {
        id: "laptop-hybrid-student",
        category: "מחשוב לצוות ותלמידים",
        title: "מחשב למידה היברידי Surface style לתלמידים",
        price: 3200,
        image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800",
        description: "מחשב נייד עם מקלדת נתיקה. משלב את הקלילות של טאבלט עם הפרודוקטיביות של מחשב Windows.",
        specs: [
            { label: "מסך", value: "13\" PixelSense Touch" },
            { label: "מקלדת", value: "נתיקה עם תאורה (כלול)" },
            { label: "מעבד", value: "Intel Core i5 Evo" },
            { label: "משקל", value: "780 גרם (ללא מקלדת)" }
        ]
    },
    {
        id: "teacher-laptop-slim",
        category: "מחשוב לצוות ותלמידים",
        title: "מחשב נייד מורה דק סוללה ליום שלם",
        price: 4200,
        image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800",
        description: "האיזון המושלם בין משקל לביצועים. עוצב במיוחד למורים שעוברים בין כיתות עם צורך בסוללה חזקה ואמינה.",
        specs: [
            { label: "עובי", value: "14.9 מ\"מ" },
            { label: "מעבד", value: "AMD Ryzen 7 7000 Series" },
            { label: "סוללה", value: "עד 15 שעות (Fast Charge)" },
            { label: "מסך", value: "14\" OLED Low Blue Light" }
        ]
    },

    // Category 3: מעבדות STEM ומרחבי חדשנות (10 items)
    {
        id: "3d-printer-pro-grade",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "מדפסת תלת מימד מקצועית Pro-Grade",
        price: 12500,
        image: "https://images.unsplash.com/photo-1542031021-36ba9069d51e?auto=format&fit=crop&q=80&w=800",
        description: "מדפסת תא סגור עם פילטר פחם ודיוק מיקרוני. מתאימה להדפסה של מגוון חומרים בסביבה חינוכית בטוחה.",
        specs: [
            { label: "נפח הדפסה", value: "300x300x350 מ\"מ" },
            { label: "דיוק שכבה", value: "0.05 - 0.4 מ\"מ" },
            { label: "חומרים", value: "PLA, ABS, PETG, TPU" },
            { label: "אבטחה", value: "HEPA פילטר לסינון חלקיקים" }
        ]
    },
    {
        id: "robotics-kit-advanced",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "ערכת רובוטיקה מבוססת Arduino",
        price: 1850,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800",
        description: "ערכה מקיפה הכוללת בקרים, חיישנים ומנועים. מיועדת ללימודי תכנות, אלקטרוניקה ובקרה ברמה גבוהה.",
        specs: [
            { label: "בקר", value: "Arduino Mega / ESP32" },
            { label: "חיישנים", value: "מרחק, אור, קול, Gyro" },
            { label: "מנועים", value: "Servo x4, DC Gear x4" },
            { label: "תוכנה", value: "Arduino IDE / Scratch" }
        ]
    },
    {
        id: "smart-lab-table-power",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "שולחן למידה חכם עם נקודות חשמל",
        price: 3400,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
        description: "שולחן מעבדה מודולרי על גלגלים. כולל יחידות קישוריות פנימיות למחשבים וציוד מדידה לכל תלמיד.",
        specs: [
            { label: "חומר", value: "HPL עמיד לכימיקלים וחום" },
            { label: "שקעים", value: "4xAC, 2xUSB, 1xLAN" },
            { label: "גודל", value: "160x80 ס\"מ" },
            { label: "כיוונון", value: "גובה ידני (72-90 ס\"מ)" }
        ]
    },
    {
        id: "3d-scanner-mobile-model",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "סורק תלת מימד נייד למידול אובייקטים",
        price: 4900,
        image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=800",
        description: "סורק ידני המאפשר הכנסת חפצים פיזיים לעולם הדיגיטלי בתוך שניות. חובה למגמות עיצוב והנדסה.",
        specs: [
            { label: "טכנולוגיה", value: "Structured Light" },
            { label: "דיוק", value: "עד 0.1 מ\"מ" },
            { label: "פורמט קבצים", value: "STL, OBJ, PLY" },
            { label: "חיבור", value: "Wireless / USB 3.0" }
        ]
    },
    {
        id: "robotic-arm-6-axis-edu",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "זרוע רובוטית לימודית 6 צירים",
        price: 8200,
        image: "https://images.unsplash.com/photo-1561149831-201509bc0281?auto=format&fit=crop&q=80&w=800",
        description: "זרוע רובוטית לתעשייה 4.0 בתוך הכיתה. מאפשרת למידה של לוגיקת תפעול פס ייצור ורובוטיקה שיתופית.",
        specs: [
            { label: "עומס עבודה", value: "500 גרם" },
            { label: "טווח הגעה", value: "340 מ\"מ" },
            { label: "חזרתיות", value: "0.2 מ\"מ" },
            { label: "שפה", value: "Python, Blocky, ROS" }
        ]
    },
    {
        id: "science-sensors-lab-pkg",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "ערכת חיישני מדע (Data Loggers)",
        price: 2600,
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
        description: "מערכת מדידה חכמה למעבדות פיזיקה, כימיה וביולוגיה. תומכת בהצגת נתונים גרפיים בזמן אמת.",
        specs: [
            { label: "חיבור", value: "Bluetooth 5.0 / USB" },
            { label: "חיישנים כלולים", value: "טמפ', pH, לחץ, תאוצה, CO2" },
            { label: "אפליקציה", value: "תואמת iOS, Android, Windows, Chrome" },
            { label: "תדירות דגימה", value: "עד 100,000 דגימות לשנייה" }
        ]
    },
    {
        id: "3d-printer-industrial-size",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "מדפסת תלת מימד בנפח תעשייתי",
        price: 24000,
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80&w=800",
        description: "מדפסת ענקית להדפסת מודלים שלמים בקנה מידה 1:1. מיועדת למרחבי מייקרים אזוריים ומרכזי פסג\"ה.",
        specs: [
            { label: "נפח הדפסה", value: "600x600x600 מ\"מ" },
            { label: "ראש הדפסה", value: "Double Extruder (חומר תמיכה)" },
            { label: "טמפרטורה", value: "עד 350 מעלות בראש" },
            { label: "בקרה", value: "מצלמה מובנית לניטור מרחוק" }
        ]
    },
    {
        id: "engineering-construction-pkg",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "ערכת בנייה והנדסה STEM לתלמידים",
        price: 1100,
        image: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800",
        description: "חלקים מכניים, גלגלי שיניים ומנועים לבנייה יצירתית. שלב הראשון בהכנסת הנדסה לבתי ספר יסודיים.",
        specs: [
            { label: "מספר חלקים", value: "1000+ רכיבים" },
            { label: "תמיכה", value: "מדריכי מערכי שיעור (עברית)" },
            { label: "אחסון", value: "מגירות מיון עמידות" },
            { label: "גילאים", value: "6-12 שנים" }
        ]
    },
    {
        id: "vr-headset-classroom-set",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "משקפי מציאות מדומה (VR) ללמידה",
        price: 2200,
        image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=800",
        description: "משקפי VR עצמאיים המוטענים מראש עם סיורים וירטואליים בהיסטוריה, מדע וחלל. כולל מערכת ניהול מורה.",
        specs: [
            { label: "רזולוציה", value: "4K (2K לכל עין)" },
            { label: "שדה ראייה", value: "110 מעלות" },
            { label: "אחסון", value: "128GB מובנה" },
            { label: "ניהול כיתה", value: "סינכרון מורה ל-30 מכשירים" }
        ]
    },
    {
        id: "laser-cutter-desktop-safe",
        category: "מעבדות STEM ומרחבי חדשנות",
        title: "מכונת חיתוך לייזר שולחנית בטיחותית",
        price: 16500,
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd278e?auto=format&fit=crop&q=80&w=800",
        description: "חיתוך עץ, אקריליק ונייר בלייזר 40W. מערכת בטיחות המכבה את הלייזר עם פתיחת המכסה. כולל מסנן עשן.",
        specs: [
            { label: "שטח עבודה", value: "50x30 ס\"מ" },
            { label: "סוג לייזר", value: "CO2 40W Glass Tube" },
            { label: "בטיחות", value: "Class 1 (לסביבת ילדים)" },
            { label: "תוכנה", value: "תואמת בענן (Cloud-based)" }
        ]
    },

    // Category 4: אודיו ווידאו למרחבי למידה (10 items)
    {
        id: "ptz-camera-tracking-4k",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מצלמת PTZ עוקבת מרצה 4K",
        price: 4500,
        image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800",
        description: "מצלמת ועידה מקצועית המזהה את המורה ומבצעת עקיבת תנועה חלקה ללא צורך בצלם. חובה לכיתת למידה היברידית.",
        specs: [
            { label: "זום", value: "12x Optical Zoom" },
            { label: "רזולוציה", value: "4K UHD @ 60fps" },
            { label: "בינה מלאכותית", value: "Human Tracking + Gesture Control" },
            { label: "חיבוריות", value: "HDMI, SDI, USB-C, NDI|HX" }
        ]
    },
    {
        id: "voice-amp-teacher-wireless",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מערכת הגברת קול מורה אלחוטית",
        price: 1200,
        image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800",
        description: "מערכת מדונה אלחוטית קלה המגנה על מיתרי הקול של המורה ומבטיחה שכל תלמיד ישמע בבירור בכל פינה בכיתה.",
        specs: [
            { label: "שיטת שידור", value: "DECT 1.9GHz (ללא הפרעות)" },
            { label: "מיקרופון", value: "Necklace / Headset" },
            { label: "סוללה", value: "10 שעות עבודה (נטענת)" },
            { label: "חיבור", value: "Link to Soundbar / Ceiling SPK" }
        ]
    },
    {
        id: "soundbar-classroom-120w",
        category: "אודיו ווידאו למרחבי למידה",
        title: "סאונדבר עוצמתי 120W לכיתות חכמות",
        price: 850,
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=800",
        description: "מערכת אודיו ייעודית למסכים אינטראקטיביים. מספקת צליל עשיר וברור לסרטונים, מצגות ושמיעה של תלמידים מרחוק.",
        specs: [
            { label: "הספק", value: "120W RMS" },
            { label: "אלמנטים", value: "4x Full Range + 2x Tweeters" },
            { label: "חיבור", value: "HDMI ARC, Optical, Bluetooth" },
            { label: "התקנה", value: "תושבת קיר דקה (כלולה)" }
        ]
    },
    {
        id: "videobar-aio-conference",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מערכת ועידה (Video Bar) הכל-ב-אחד",
        price: 3200,
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
        description: "פתרון מושלם לחדרי ישיבות ומרחבי למידה קטנים. משלב מצלמת 4K, מיקרופונים חכמים ורמקולים ביחידה אחת דקה.",
        specs: [
            { label: "שדה ראייה", value: "120 מעלות (צילום פנורמי)" },
            { label: "טווח מיקרופון", value: "עד 6 מטרים" },
            { label: "בינה מלאכותית", value: "Auto-Framing + Speaker Tracking" },
            { label: "פלטפורמות", value: "MS Teams, Zoom, Meet" }
        ]
    },
    {
        id: "ceiling-array-mic-noise-cancel",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מיקרופון תקרתי (Ceiling Array)",
        price: 5800,
        image: "https://images.unsplash.com/photo-1478737270239-2fccd27fd0fc?auto=format&fit=crop&q=80&w=800",
        description: "מיקרופון המותקן בתקרה אקוסטית וקולט את כל הכיתה בצורה שקופה. טכנולוגיית Beamforming לבידוד קול הדובר.",
        specs: [
            { label: "קפסולות", value: "128 MEMS Microphones" },
            { label: "סינון רעשים", value: "Deep Learning Noise Reduction" },
            { label: "התקנה", value: "Flush mount (60x60 cell)" },
            { label: "חיבור", value: "Dante / POE+" }
        ]
    },
    {
        id: "av-control-lecturer-sys",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מערכת שליטה ובקרה (AV Control)",
        price: 2400,
        image: "https://images.unsplash.com/photo-1627393100177-b4297e79a5be?auto=format&fit=crop&q=80&w=800",
        description: "לוח מגע קטן על שולחן המורה המאפשר שליטה בהדלקת המסך, החלפת מקורות, ווליום והתאורה בכיתה.",
        specs: [
            { label: "מסך", value: "7\" IPS Touch Panel" },
            { label: "קישוריות", value: "LAN/RS232/IR" },
            { label: "ממשק", value: "עברית מלאה (Customizable)" },
            { label: "ניהול", value: "שליטה מרחוק ממשרד המנהל" }
        ]
    },
    {
        id: "visualizer-4k-doc-cam",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מצלמת מסמכים (Visualizer) 4K Ultra HD",
        price: 1850,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
        description: "הצגת ספרים, שרטוטים וניסויים בזמן אמת על המסך הגדול. תומכת בהקלטה ישירה ל-USB באיכות קולנועית.",
        specs: [
            { label: "חיישן", value: "13MP 4K Camera" },
            { label: "תדירות רענון", value: "60fps (תנועה חלקה)" },
            { label: "זום", value: "230x Total Zoom (Optical+Digital)" },
            { label: "תאורה", value: "LED מובנית מתכווננת" }
        ]
    },
    {
        id: "anc-headset-student-lab",
        category: "אודיו ווידאו למרחבי למידה",
        title: "אוזניות למידה עם מסנן רעשים (ANC)",
        price: 450,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
        description: "אוזניות מיוחדות המאפשרות ריכוז מקסימלי לתלמידים עם קשיי קשב. מסננות רעשי כיתה ומזגן בצורה אקטיבית.",
        specs: [
            { label: "סינון רעשים", value: "Active Noise Cancellation 30dB" },
            { label: "מבנה", value: "Over-ear נושם לאורך זמן" },
            { label: "הגבלת ווליום", value: "Safe Hearing 85dB" },
            { label: "מיקרופון", value: "Noise Cancelling Mic Boom" }
        ]
    },
    {
        id: "pa-portable-school-events",
        category: "אודיו ווידאו למרחבי למידה",
        title: "מערכת הגברה אלחוטית ניידת לאירועים",
        price: 3800,
        image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80&w=800",
        description: "בידורית מקצועית על גלגלים לטקסים ופעילויות ספורט. כוללת 2 מיקרופונים אלחוטיים ונגן מדיה משולב.",
        specs: [
            { label: "הספק", value: "300W Peak" },
            { label: "מיקרופונים", value: "2x UHF Wireless Handheld" },
            { label: "ניידות", value: "סוללה נטענת עד 8 שעות" },
            { label: "קישוריות", value: "BT, SD, USB, AUX, Guitar" }
        ]
    },
    {
        id: "ceiling-spk-sound-array",
        category: "אודיו ווידאו למרחבי למידה",
        title: "רמקולים תקרתיים לפיזור סאונד אחיד",
        price: 1500,
        image: "https://images.unsplash.com/photo-1558317751-bc3ed6f85f72?auto=format&fit=crop&q=80&w=800",
        description: "מערך של 4 רמקולים איכותיים להתקנה שקועה בתקרה. מבטיח עוצמת קול אחידה בכל מקום ישיבה.",
        specs: [
            { label: "כמות", value: "סט של 4 יחידות" },
            { label: "מבנה", value: "2-way 6.5\" Woofer" },
            { label: "תקן אש", value: "UL-2043 (Plenum Rated)" },
            { label: "הגברה", value: "כולל מגבר 100V קומפקטי" }
        ]
    },

    // Category 5: תשתיות ועגלות טעינה (10 items)
    {
        id: "charging-cart-36-devices",
        category: "תשתיות ועגלות טעינה",
        title: "עגלת טעינה ואחסון חכמה ל-36 כרומבוקים",
        price: 4500,
        image: "https://images.unsplash.com/photo-1522071823991-b1ae5e3a39aa?auto=format&fit=crop&q=80&w=800",
        description: "עגלת פלדה ממוגנת עם בקר טעינה חכם המאזן את העומס החשמלי. שומרת על אורך חיי הסוללה של המכשירים.",
        specs: [
            { label: "קיבולת", value: "36 מחשבים עד 15.6 אינץ'" },
            { label: "בקר טעינה", value: "Smart Power Management (Cycles)" },
            { label: "אבטחה", value: "נעילה שלוש נקודות + אוורור" },
            { label: "ניידות", value: "גלגלים תעשייתיים עם בלמים" }
        ]
    },
    {
        id: "smart-podium-21-touch",
        category: "תשתיות ועגלות טעינה",
        title: "פודיום מרצה חכם עם מסך מגע 21\"",
        price: 12800,
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800",
        description: "עמדת מרצה אינטראקטיבית. מאפשרת כתיבה ישירה על המצגת תוך כדי דיבור מול הקהל. כולל מחשב OPS פנימי.",
        specs: [
            { label: "מסך", value: "21.5\" Multi-Touch IPS" },
            { label: "כוונון גובה", value: "חשמלי 80-120 ס\"מ" },
            { label: "אינטגרציה", value: "ממתג AV מובנה (HDMI/USB)" },
            { label: "חומר", value: "עץ, אלומיניום ופלדה" }
        ]
    },
    {
        id: "charging-cart-uv-24-tab",
        category: "תשתיות ועגלות טעינה",
        title: "עגלת טעינה וחיטוי UV-C ל-24 טאבלטים",
        price: 5200,
        image: "https://images.unsplash.com/photo-1555616635-640970017d73?auto=format&fit=crop&q=80&w=800",
        description: "עגלה המשלבת טעינה מהירה עם מנורות UV-C לחיטוי חיידקים ווירוסים בין שיעור לשיעור.",
        specs: [
            { label: "חיטוי", value: "UV-C Germicidal Lamps" },
            { label: "קיבולת", value: "24 טאבלטים / iPad" },
            { label: "טעינה", value: "USB-C PD 15W לכל פורט" },
            { label: "אימות", value: "תקן בטיחות חשמל ישראלי" }
        ]
    },
    {
        id: "av-rack-secure-server",
        category: "תשתיות ועגלות טעינה",
        title: "ארון תקשורת (AV Rack) ממוגן לשרתים",
        price: 3100,
        image: "https://images.unsplash.com/photo-1558494949-ef010ccdcc32?auto=format&fit=crop&q=80&w=800",
        description: "ארון תקשורת כיתתי מעוצב ושקט. שומר על המעבדים, המבצעים והשרתים הכיתתיים מוגנים וקרירים.",
        specs: [
            { label: "גודל", value: "12U / 18U" },
            { label: "אוורור", value: "מניפות אולטרה-שקטות עם תרמוסטט" },
            { label: "דלת", value: "זכוכית מחוסמת עם מנעול" },
            { label: "תמיכה", value: "כולל PDU 8 יציאות" }
        ]
    },
    {
        id: "teacher-workstation-mobile-hyd",
        category: "תשתיות ועגלות טעינה",
        title: "עמדת עבודה ניידת למורה הידראולית",
        price: 1850,
        image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800",
        description: "שולחן מורה קטן ונייד המאפשר עמידה או ישיבה בלחיצת כפתור אחת. פתרון ארגונומי גמיש.",
        specs: [
            { label: "טווח גובה", value: "70-115 ס\"מ" },
            { label: "מנגנון", value: "בוכנה הידראולית איכותית" },
            { label: "משטח", value: "עץ לבן 80x50 ס\"מ" },
            { label: "תוספות", value: "מתקן למחשב נייד ומעצור כבלים" }
        ]
    },
    {
        id: "charging-cart-12-laptop",
        category: "תשתיות ועגלות טעינה",
        title: "עגלת טעינה ל-12 מחשבים ניידים",
        price: 2400,
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800",
        description: "גרסה קומפקטית למוסדות עם קבוצות למידה קטנות. קלה לשינוע במדרגות ומעליות צרות.",
        specs: [
            { label: "קיבולת", value: "12 מחשבים עד 17 אינץ'" },
            { label: "מבנה", value: "מתכת מגולוונת עמידה" },
            { label: "הגנה", value: "נגד נחשולי מתח וחום" },
            { label: "צבעים", value: "מגוון צבעי RAL (ירוק/כחול/כתום)" }
        ]
    },
    {
        id: "motorized-wall-mount-heavy",
        category: "תשתיות ועגלות טעינה",
        title: "תושבת קיר מוטורית למסכי ענק",
        price: 3600,
        image: "https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?auto=format&fit=crop&q=80&w=800",
        description: "מנגנון הרמה חשמלי למסכי 86\"-110\". מאפשר להתאים את גובה המסך לגיל התלמידים (יסודי/תיכון).",
        specs: [
            { label: "עומס מקסימלי", value: "160 ק\"ג" },
            { label: "מהירות הרמה", value: "20 מ\"מ לשנייה" },
            { label: "בקרה", value: "שלט קווי מובנה" },
            { label: "התקנה", value: "VESA אקספרטיבי (עד 1200x600)" }
        ]
    },
    {
        id: "cable-management-pkg-av",
        category: "תשתיות ועגלות טעינה",
        title: "מערך כבילה וניהול תקשורת",
        price: 650,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        description: "פתרון מקצועי להסתרת כבלים בכיתות חכמות. שומר על מראה נקי ומונע תקלות ניתוק בשוגג.",
        specs: [
            { label: "תכולה", value: "תעלות, תיבות חיבורים, שרוולים" },
            { label: "חיבורים", value: "ממתג Keystones (HDMI/LAN)" },
            { label: "עיצוב", value: "אלומיניום מוברש / PVC איכותי" },
            { label: "בטיחות", value: "חסין אש ומגן ילדים" }
        ]
    },
    {
        id: "mobile-stand-heavy-110",
        category: "תשתיות ועגלות טעינה",
        title: "בסיס נייד כבד למסכים עד 110\"",
        price: 2200,
        image: "https://images.unsplash.com/photo-1542744095-2ad4870fbbc3?auto=format&fit=crop&q=80&w=800",
        description: "עגלה יציבה במיוחד למסכים הגדולים ביותר בשוק. מאפשרת העברה של מסכי 98 אינץ' בין אולמות ללא חשד להתהפכות.",
        specs: [
            { label: "מבנה", value: "פלדה עבת דופן (Heavy Duty)" },
            { label: "מדפים", value: "מדף OPS ומדף מצלמה כלולים" },
            { label: "סיבוב", value: "גלגלי 4 אינץ' עם נעילה" },
            { label: "משקל עצמי", value: "32 ק\"ג" }
        ]
    },
    {
        id: "ups-institutional-guard",
        category: "תשתיות ועגלות טעינה",
        title: "יחידת UPS אל-פסק מוסדית",
        price: 1450,
        image: "https://images.unsplash.com/photo-1560177112-fbf15f070119?auto=format&fit=crop&q=80&w=800",
        description: "מגן על הציוד היקר בכיתה (מקרנים, מסכים) מפני הפסקות וקפיצות חשמל. מאפשר קירור מקרן לפני כיבוי מלא.",
        specs: [
            { label: "הספק", value: "2000VA / 1200W" },
            { label: "זמן גיבוי", value: "עד 15 דקות בעומס מלא" },
            { label: "שקעים", value: "6x IEC מוגנים" },
            { label: "ניהול", value: "חיבור USB לכיבוי אוטומטי של המחשב" }
        ]
    }
];

export default products;
