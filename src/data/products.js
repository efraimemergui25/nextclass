const products = [
    {
        id: "touch-pro-65",
        category: "מסכי מגע",
        title: "מסך מגע אינטראקטיבי NextBoard Pro 65\"",
        price: 7200,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        description: "מסך כיתתי סטנדרטי התואם למרחבי למידה ממוצעים. מאפשר חוויית כתיבה טבעית וכולל מערכת הפעלה פנימית לניהול תוכן ושיעורים אינטראקטיביים.",
        specs: [
            {
                label: "גודל מסך",
                value: "65 אינץ׳"
            },
            {
                label: "רזולוציה",
                value: "4K UHD (3840x2160)"
            },
            {
                label: "נקודות מגע",
                value: "20 נקודות בו זמנית"
            },
            {
                label: "מערכת הפעלה",
                value: "Android 11 משולבת"
            },
            {
                label: "בהירות",
                value: "350 cd/m²"
            },
            {
                label: "יציאות",
                value: "USB-C, HDMI x3, Touch USB"
            },
            {
                label: "זכוכית",
                value: "Anti-Glare 4mm Tempered"
            },
            {
                label: "צריכת חשמל",
                value: "≤180W (מצב רגיל)"
            },
            {
                label: "אחריות",
                value: "3 שנים כולל פאנל"
            }
        ]
    },
    {
        id: "touch-pro-75",
        category: "מסכי מגע",
        title: "מסך מגע אינטראקטיבי NextBoard Pro 75\"",
        price: 9500,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
        description: "הסטנדרט המועדף לתיכונים וחטיבות ביניים. מסך 75 אינץ׳ עוצמתי עם זכוכית אנטי-גלאר המבטיחה צפייה חדה מכל פינה בכיתה.",
        specs: [
            {
                label: "גודל מסך",
                value: "75 אינץ׳"
            },
            {
                label: "רזולוציה",
                value: "4K UHD + סינון כחול רפואי"
            },
            {
                label: "נקודות מגע",
                value: "40 נקודות (Zero Bonding)"
            },
            {
                label: "מערכת הפעלה",
                value: "Android 13 + PC Module (אופציונלי)"
            },
            {
                label: "זכוכית",
                value: "מחוסמת 4mm 8H נגד שריטות"
            },
            {
                label: "בהירות",
                value: "450 cd/m²"
            },
            {
                label: "רמקולים",
                value: "2x15W סטריאו מובנים"
            },
            {
                label: "יציאות",
                value: "USB-C PD, HDMI 2.0 x3, RS232"
            },
            {
                label: "משקל",
                value: "42 ק״ג (ללא מתקן)"
            },
            {
                label: "אחריות",
                value: "5 שנים כולל אפס פיקסלים מתים"
            }
        ]
    },
    {
        id: "touch-pro-86",
        category: "מסכי מגע",
        title: "מסך מגע אינטראקטיבי NextBoard Max 86\"",
        price: 14500,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        description: "מפלצת ביצועים לאולמות הרצאה וספריות. ה-86 אינץ׳ מספק שטח עבודה כפול לתצוגה מפוצלת של חזווית מורה ותלמידים במקביל.",
        specs: [
            {
                label: "גודל מסך",
                value: "86 אינץ׳"
            },
            {
                label: "רזולוציה",
                value: "4K@60Hz"
            },
            {
                label: "מערך מיקרופונים",
                value: "8 המזהים מגע עד 8 מטרים"
            },
            {
                label: "מצלמה",
                value: "4K AI מובנית לתצוגה היברידית"
            },
            {
                label: "רמקולים",
                value: "מערך סטריאו 2x20W + סאב 15W"
            },
            {
                label: "בהירות",
                value: "500 cd/m²"
            },
            {
                label: "מערכת הפעלה",
                value: "Android 13 + OPS Windows"
            },
            {
                label: "זכוכית",
                value: "Anti-Glare AG+AF ציפוי כפול"
            },
            {
                label: "זוויות צפייה",
                value: "178° אופקי ואנכי"
            },
            {
                label: "אחריות",
                value: "5 שנים + שירות באתר הלקוח"
            }
        ]
    },
    {
        id: "touch-ent-98",
        category: "מסכי מגע",
        title: "מסך מגע Enterprise Infinity 98\"",
        price: 28000,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
        description: "פתרון דגל למרחבי למידה המוניים ואודיטוריומים. מחליף לחלוטין את הצורך במקרן עם בהירות פסיכית ושחור מוחלט.",
        specs: [
            {
                label: "גודל מסך",
                value: "98 אינץ׳"
            },
            {
                label: "פנל",
                value: "QLED מסחרי בהיר במיוחד"
            },
            {
                label: "בהירות",
                value: "650 cd/m²"
            },
            {
                label: "זוויות צפייה",
                value: "178 מעלות אופטיות"
            },
            {
                label: "שעות פעילות",
                value: "50,000 שעות רציפות"
            },
            {
                label: "תקשורת",
                value: "Wi-Fi 6 ו-Bluetooth 5.2"
            },
            {
                label: "רזולוציה",
                value: "4K UHD בפנל 98 אינץ׳"
            },
            {
                label: "נקודות מגע",
                value: "40 נקודות IR Sensing"
            },
            {
                label: "משקל כולל",
                value: "88 ק״ג + מתקן קיר VESA"
            },
            {
                label: "אחריות",
                value: "5 שנים פרימיום On-Site"
            }
        ]
    },
    {
        id: "touch-flex-65",
        category: "מסכי מגע",
        title: "מסך טאקטי Flex נייד 65\"",
        price: 8900,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        description: "חווייה ניידת לחלוטין. מגיע עם עגלה מוטורית שקטה המאפשרת העברה חלקה ממרחב למרחב, כולל מנגנון שינוי זווית לשולחן אינטראקטיבי.",
        specs: [
            {
                label: "גודל מסך",
                value: "65 אינץ׳ נייד"
            },
            {
                label: "עגלה",
                value: "מוטורית עם שלט רחוק"
            },
            {
                label: "סוללה",
                value: "עד 4 שעות רצופות (אופציונלי)"
            },
            {
                label: "חיישנים",
                value: "זיהוי אור סביבתי וקרבה"
            },
            {
                label: "משקל נטו",
                value: "35 ק״ג (המסך בלבד)"
            },
            {
                label: "רזולוציה",
                value: "4K UHD"
            },
            {
                label: "שינוי זווית",
                value: "0°-90° מוטורי (שולחן אינטראקטיבי)"
            },
            {
                label: "יציאות",
                value: "HDMI x2, USB 3.0 x4, LAN"
            },
            {
                label: "אחריות",
                value: "3 שנים מסך + שנה עגלה"
            }
        ]
    },
    {
        id: "touch-glass-75",
        category: "מסכי מגע",
        title: "EduTouch Glass קיבולטיבי 75\"",
        price: 11200,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
        description: "מסך פרימיום נטול מסגרת עם טכנולוגיית מגע PCAP (כמו בסמארטפון). עיצוב מינימליסטי וזיהוי מגע כירורגי ללוחות שרטוט ומגמות אדריכלות.",
        specs: [
            {
                label: "גודל מסך",
                value: "75 אינץ׳"
            },
            {
                label: "טכנולוגיית מגע",
                value: "PCAP קיבולטיבי ללא הדרגה"
            },
            {
                label: "עיצוב",
                value: "Zero-Bezel זכוכית מקצה-לקצה"
            },
            {
                label: "עטים",
                value: "זיהוי עוצמת לחיצה דינמי"
            },
            {
                label: "התקנה",
                value: "מתקן קיר VESA דק במיוחד"
            },
            {
                label: "בהירות",
                value: "400 cd/m²"
            },
            {
                label: "רזולוציה",
                value: "4K UHD IPS"
            },
            {
                label: "עובי מארז",
                value: "28 מ״מ בלבד (Ultra Slim)"
            },
            {
                label: "יציאות",
                value: "USB-C x2, HDMI 2.1, DisplayPort"
            },
            {
                label: "אחריות",
                value: "3 שנים כולל זכוכית"
            }
        ]
    },
    {
        id: "touch-dual-86",
        category: "מסכי מגע",
        title: "NextBoard Dual OS 86\"",
        price: 15900,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        description: "מגיע מצויד בשבב מחשוב כפול המריץ גם Android וגם Windows 11 Pro באופן מובנה מודולרי. מאפשר מעבר חלק בלחיצת כפתור.",
        specs: [
            {
                label: "גודל מסך",
                value: "86 אינץ׳"
            },
            {
                label: "מחשב פנימי",
                value: "OPS i7, 16GB RAM, 512GB SSD"
            },
            {
                label: "רישוי תוכנה",
                value: "כלול Windows 11 Enterprise"
            },
            {
                label: "אבטחה",
                value: "שבב TPM 2.0 מובנה"
            },
            {
                label: "אוטומציה",
                value: "הדלקה/כיבוי חכם דרך חיישן PIR"
            },
            {
                label: "בהירות",
                value: "450 cd/m²"
            },
            {
                label: "מערכת הפעלה",
                value: "Dual-OS: Android 13 + Windows 11"
            },
            {
                label: "רמקולים",
                value: "2x20W סטריאו מקדמיים"
            },
            {
                label: "ממדים",
                value: "1960x1170x85 מ״מ"
            },
            {
                label: "אחריות",
                value: "5 שנים מסך + 3 שנים OPS"
            }
        ]
    },
    {
        id: "touch-eco-65",
        category: "מסכי מגע",
        title: "מסך מגע Eco Lite 65\"",
        price: 5900,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
        description: "הפתרון הידידותי ביותר לתקציב לפרוייקטים המוניים בבתי ספר יסודיים. שומר על איכות צפייה מעולה במארז חסכוני באנרגיה.",
        specs: [
            {
                label: "גודל מסך",
                value: "65 אינץ׳"
            },
            {
                label: "צריכת חשמל",
                value: "Eco Mode כ-140W בלבד"
            },
            {
                label: "מגע",
                value: "10 נקודות בסיסיות"
            },
            {
                label: "מערכת הפעלה",
                value: "Linux בסיסית ודפדפן מובנה"
            },
            {
                label: "אחריות",
                value: "הרחבה עד 5 שנים אופציונלי"
            },
            {
                label: "בהירות",
                value: "300 cd/m²"
            },
            {
                label: "יציאות",
                value: "HDMI x2, USB 2.0 x2, AV"
            },
            {
                label: "משקל",
                value: "28 ק״ג"
            },
            {
                label: "רזולוציה",
                value: "4K UHD"
            }
        ]
    },
    {
        id: "touch-lab-55",
        category: "מסכי מגע",
        title: "מסך מגע עמיד לתנאי מעבדה 55\"",
        price: 8400,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        description: "מסך מחופה בציפוי תעשייתי דוחה קורוזיה ושמנים. למעבדות מדעים, סדנאות, ומרכזי רובוטיקה הדורשים עמידות של ציוד קצה מכני.",
        specs: [
            {
                label: "גודל מסך",
                value: "55 אינץ׳ תעשייתי"
            },
            {
                label: "תקן אטימות",
                value: "IP54 (אבק והתזות)"
            },
            {
                label: "כיול צבע",
                value: "100% sRGB למודלים תלת מימדיים"
            },
            {
                label: "זכוכית",
                value: "מחוסמת ברמת חסינות כלי עבודה"
            },
            {
                label: "תפעול",
                value: "מזהה מגע גם עם כפפות מעבדה"
            },
            {
                label: "בהירות",
                value: "500 cd/m²"
            },
            {
                label: "טווח טמפרטורה",
                value: "0°C עד 50°C פעולה רציפה"
            },
            {
                label: "ציפוי",
                value: "נגד קורוזיה תעשייתי"
            },
            {
                label: "אחריות",
                value: "3 שנים + ביטוח נזקי מעבדה"
            }
        ]
    },
    {
        id: "touch-ultra-75",
        category: "מסכי מגע",
        title: "NextBoard Ultra 8K 75\"",
        price: 22000,
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop",
        description: "העתיד של המסכים האינטראקטיביים. רזולוציית 8K מטיחה פרטים בלתי נתפסים גם בעמידה אפסית מהמסך. מושלם ללימודי גיאומטריה ומחקר רפואי.",
        specs: [
            {
                label: "גודל מסך",
                value: "75 אינץ׳ 8K"
            },
            {
                label: "רזולוציה עילאית",
                value: "8K (7680x4320)"
            },
            {
                label: "דיוק עט",
                value: "0.5 מ״מ עם דיו וירטואלי מידיי"
            },
            {
                label: "מערך מצלמות",
                value: "שתי מצלמות צד לכיוון קהל רחב"
            },
            {
                label: "התאמה",
                value: "מושלם לצילומי סטודיו ולסמינרים"
            },
            {
                label: "בהירות",
                value: "600 cd/m²"
            },
            {
                label: "מעבד גרפי",
                value: "GPU ייעודי לעיבוד 8K בזמן אמת"
            },
            {
                label: "רמקולים",
                value: "מערך Harman 4x15W"
            },
            {
                label: "יציאות",
                value: "HDMI 2.1 x2, DP 1.4, USB-C PD 65W"
            },
            {
                label: "אחריות",
                value: "5 שנים פרימיום אולטרה"
            }
        ]
    },
    {
        id: "info-kiosk-55",
        category: "מסכי מידע",
        title: "עמדת מידע קיוסק 55\"",
        price: 5500,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        description: "קיוסק מידע אנכי בעיצוב מודרני ממתכת. מתאים לכניסות בתי ספר וספריות להצגת אקטואליה, מערכת שעות והודעות מנהל בזמן אמת.",
        specs: [
            {
                label: "גודל",
                value: "55 אינץ׳ אנכי"
            },
            {
                label: "בהירות",
                value: "450 nits"
            },
            {
                label: "מערכת",
                value: "נגן Signage משולב ענן"
            },
            {
                label: "בנייה",
                value: "מתכת מקשה אחת, עיצוב דק"
            },
            {
                label: "פריסה",
                value: "תומך תצוגה אנכית דינמית"
            },
            {
                label: "פעילות",
                value: "16/7 רציפה"
            },
            {
                label: "תקשורת",
                value: "Wi-Fi + LAN + 4G (אופציונלי)"
            },
            {
                label: "ממדים",
                value: "600x1800x120 מ״מ"
            },
            {
                label: "משקל",
                value: "45 ק״ג כולל בסיס"
            }
        ]
    },
    {
        id: "info-wall-65",
        category: "מסכי מידע",
        title: "מסך מידע מוסדי Wall 65\"",
        price: 4900,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
        description: "מסך שילוט קונבנציונלי למסדרונות הרחבים. עובד 18/7 עם ניהול תכנים מרחוק וכיבוי אוטומטי בלילה לחסכון.",
        specs: [
            {
                label: "גודל",
                value: "65 אינץ׳ אופקי"
            },
            {
                label: "פעילות",
                value: "תקן 18/7 למניעת התחממות"
            },
            {
                label: "פאנל",
                value: "IPS לחידוד צבע וזווית חופשית"
            },
            {
                label: "אביזרי תלייה",
                value: "כולל מתקן צמוד קיר"
            },
            {
                label: "תקשורת",
                value: "תמיכה בחיבור LAN יציב"
            },
            {
                label: "בהירות",
                value: "500 nits"
            },
            {
                label: "מערכת ניהול",
                value: "CMS ענן עם אפליקציית ניהול"
            },
            {
                label: "צריכת חשמל",
                value: "≤120W (מצב טיפוסי)"
            },
            {
                label: "אחריות",
                value: "3 שנים כולל פאנל"
            }
        ]
    },
    {
        id: "info-pro-75",
        category: "מסכי מידע",
        title: "InfoDisplay Pro קמפוס 75\"",
        price: 8500,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        description: "מסך מידע גדול במיוחד לרחבות איסוף וקפטריות עמוסות. בהירות רדיקלית המבטיחה משיכת תשומת לב גם באור שמש טבעי.",
        specs: [
            {
                label: "גודל",
                value: "75 אינץ׳"
            },
            {
                label: "בהירות",
                value: "700 nits לשטחים פתוחים למחצה"
            },
            {
                label: "תמיכה",
                value: "נגן HTML5 ו-H.265 לוידאו"
            },
            {
                label: "הגנה",
                value: "ציפוי הרד-קוט (Hard-Coating)"
            },
            {
                label: "אחריות",
                value: "3 שנים לשירות ברוב שעות היום"
            },
            {
                label: "פאנל",
                value: "VA מסחרי עם ניגודיות 5000:1"
            },
            {
                label: "פעילות",
                value: "24/7 רציפה ללא כיבוי"
            },
            {
                label: "תקשורת",
                value: "LAN + Wi-Fi + RS232"
            },
            {
                label: "משקל",
                value: "38 ק״ג"
            }
        ]
    },
    {
        id: "info-outdoor-55",
        category: "מסכי מידע",
        title: "שילוט חוץ עמיד IP65 בגודל 55\"",
        price: 18000,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
        description: "מסך שילוט דיגיטלי להתקנה בחצרות בית הספר. אטום לחלוטין למים, אבק וחבטות קלות, ובנוי לעמוד החל משמש ישראלית יוקדת ועד סופות חורף.",
        specs: [
            {
                label: "גודל",
                value: "55 אינץ׳ חוצות"
            },
            {
                label: "הגנה מטאורולוגית",
                value: "IP65 מוחלט ממים ואבק"
            },
            {
                label: "הגנה אקלימית",
                value: "בקר טמפרטורה (חימום וקירור)"
            },
            {
                label: "בהירות שמש",
                value: "2500 nits - נראה באור ישיר"
            },
            {
                label: "ונדליזם",
                value: "זכוכית IK10 עמידה לניפוץ"
            },
            {
                label: "טווח טמפרטורה",
                value: "-30°C עד +55°C"
            },
            {
                label: "ציפוי",
                value: "אנטי-רפלקטיבי לשמש ישירה"
            },
            {
                label: "תקשורת",
                value: "4G + Wi-Fi + LAN מוגן מים"
            },
            {
                label: "אחריות",
                value: "5 שנים כולל אלמנטים חיצוניים"
            }
        ]
    },
    {
        id: "info-outdoor-65",
        category: "מסכי מידע",
        title: "שילוט חוץ רחב IP65 בגודל 65\"",
        price: 24500,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        description: "שער הכניסה המודרני למוסד החינוכי. 65 אינץ' של שקיפות ובהירות בתנאי חוץ קיצוניים, מושלם לשילוט חוצות או שלטי הכוונה אדריכליים בכניסה.",
        specs: [
            {
                label: "גודל",
                value: "65 אינץ׳ חוצות"
            },
            {
                label: "אטינות מלאה",
                value: "מערכת אוורור סגורה נגד לחות"
            },
            {
                label: "בהירות מסנוורת",
                value: "3000 nits High Brightness"
            },
            {
                label: "ניהול מרוחק",
                value: "דיווחי תקלה ואבחון אוטומטי"
            },
            {
                label: "ספק כוח",
                value: "מוגן מתקלות מתח ציבוריות"
            },
            {
                label: "טווח טמפרטורה",
                value: "-30°C עד +60°C"
            },
            {
                label: "חומר מארז",
                value: "אלומיניום תעופתי מצופה"
            },
            {
                label: "זכוכית",
                value: "IK10 + AR ציפוי אנטי-רפלקטיבי"
            },
            {
                label: "אחריות",
                value: "5 שנים כולל תחזוקה מונעת"
            }
        ]
    },
    {
        id: "info-wayfind-43",
        category: "מסכי מידע",
        title: "קיוסק הכוונה (Wayfinding) מגע 43\"",
        price: 6400,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
        description: "עמדת הכוונה אלגנטית לספריות ולמרכזי פסג״ה. כוללת מסך מגע לחיפוש כיתות, חוגים, וניווט אקטיבי של מבקרים ושחקני קמפוס חדשים.",
        specs: [
            {
                label: "גודל",
                value: "43 אינץ׳ מגע"
            },
            {
                label: "מגע",
                value: "10 נקודות לממשק קל"
            },
            {
                label: "זווית קיוסק",
                value: "משופע 30° לנוחות הקלדה"
            },
            {
                label: "עיצוב",
                value: "מותאם לכיסאות גלגלים (נגישות)"
            },
            {
                label: "שבב הרצה",
                value: "מעבד Intel לפלטפורמת מפות"
            },
            {
                label: "בהירות",
                value: "350 nits"
            },
            {
                label: "חומר מארז",
                value: "פלדה מצופה RAL לפי בחירת מוסד"
            },
            {
                label: "תקשורת",
                value: "Wi-Fi + LAN"
            },
            {
                label: "אחריות",
                value: "3 שנים"
            }
        ]
    },
    {
        id: "info-menu-49",
        category: "מסכי מידע",
        title: "מסך פנורמי אופקי לקפיטריה 49\"",
        price: 4100,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        description: "בנוי לניצול מרבית לשטחי תצוגה בתקרות נמוכות או דלפקי קפיטריה. מחליף לחלוטין לוחות מחיקים ומציע עדכון יומי מרחוק של התפריט המוסדי.",
        specs: [
            {
                label: "גודל",
                value: "49 אינץ׳ אופקי"
            },
            {
                label: "אחסון ותפעול",
                value: "זיכרון פנימי שומר תוכן בהפסקת חשמל"
            },
            {
                label: "שוליים",
                value: "צרים (Symmetrical Narrow Bezel)"
            },
            {
                label: "התקנה רציפה",
                value: "Daisy-Chain לשרשור מספר מסכים"
            },
            {
                label: "לוחות זמנים",
                value: "תפריט בוקר/צהריים משתנה אוטומטית"
            },
            {
                label: "בהירות",
                value: "500 nits"
            },
            {
                label: "פאנל",
                value: "IPS מסחרי 16/7"
            },
            {
                label: "צריכת חשמל",
                value: "≤80W"
            },
            {
                label: "אחריות",
                value: "3 שנים"
            }
        ]
    },
    {
        id: "info-stretch-86",
        category: "מסכי מידע",
        title: "InfoBar UltraStretch 86\"",
        price: 15400,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
        description: "פס מידע פוטנציאלי לכל רוחב הכיתה או המסדרון באספקט מיוחד של 58:9. משמש כסטריפ הודעות דינמי מעל דלתות ולמעברי מעבדות.",
        specs: [
            {
                label: "גודל",
                value: "86 אינץ׳ UltraStretch"
            },
            {
                label: "פרופורציות",
                value: "58:9 (מסך רחב וצר קיצוני)"
            },
            {
                label: "מחלקת יוקרה",
                value: "מעוצב כשלט הייטק מרהיב"
            },
            {
                label: "פעילות",
                value: "PBP לחלוקה ל-4 מסכים נפרדים"
            },
            {
                label: "משקל",
                value: "עדין וקל להתקנה מורכבת"
            },
            {
                label: "בהירות",
                value: "700 nits"
            },
            {
                label: "רזולוציה",
                value: "3840x600"
            },
            {
                label: "התקנת קיר/תקרה",
                value: "כולל מתקן ייעודי למעברים"
            },
            {
                label: "אחריות",
                value: "3 שנים"
            }
        ]
    },
    {
        id: "info-videowall-55",
        category: "מסכי מידע",
        title: "מודול VideoWall ללא מסגרת 55\"",
        price: 11000,
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
        description: "פאנל בודד להרכבת קירות וידאו מפלצתיים במבואה הראשית. השוליים הדקיקים שלו (0.88מ״מ) מאפשרים חיבור הדוק ללא הפרעות ויזואליות בין הפאנלים.",
        specs: [
            {
                label: "גודל מודול",
                value: "55 אינץ׳ ללא מסגרת"
            },
            {
                label: "עובי חיבור",
                value: "0.88mm Bezel-to-Bezel"
            },
            {
                label: "גיוון קיר",
                value: "תמיכה במערך של עד 10x10 פאנלים"
            },
            {
                label: "כיול מתקדם",
                value: "כיול חומרתי (Hardware Calibration)"
            },
            {
                label: "אמינות תעשייתית",
                value: "ספק עבודה בכשל מחסן"
            },
            {
                label: "בהירות",
                value: "500 nits (700 nits High-Bright)"
            },
            {
                label: "פעילות",
                value: "24/7 רציפה"
            },
            {
                label: "תקשורת",
                value: "RS232, RJ45, IR Input"
            },
            {
                label: "אחריות",
                value: "3 שנים כולל כיול שנתי"
            }
        ]
    },
    {
        id: "info-pro-86",
        category: "מסכי מידע",
        title: "InfoDisplay Pro קופה/קמפוס 86\"",
        price: 12500,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800&auto=format&fit=crop",
        description: "הענק המשרמן, המאגד את מיטב התכונות בלוח ענק של 86 אינץ'. מיועד לאזורי קבלה של הנהלות מחוז ועיריות.",
        specs: [
            {
                label: "גודל",
                value: "86 אינץ׳"
            },
            {
                label: "עוצמת תאורה",
                value: "500 nits מאוזן לעיני הנכנסים"
            },
            {
                label: "קירור פסיבי",
                value: "ללא מאווררים וללא רעש סביבתי"
            },
            {
                label: "חיסכון",
                value: "לוח הפעלה לניהול תקציב חשמל"
            },
            {
                label: "הצפנה",
                value: "תקשורת CMS מוצפנת ומאובטחת"
            },
            {
                label: "פאנל",
                value: "IPS Direct-Lit מסחרי"
            },
            {
                label: "פעילות",
                value: "18/7 רציפה"
            },
            {
                label: "ממדים",
                value: "1930x1090x89 מ״מ"
            },
            {
                label: "אחריות",
                value: "3 שנים On-Site"
            }
        ]
    },
    {
        id: "science-force-table",
        category: "מעבדות מדעים",
        title: "שולחן כוחות פיזיקלי מתקדם לשני תלמידים",
        price: 4500,
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop",
        description: "ציוד חובה קלאסי להמחשת וקטורים והרכבת כוחות בפיזיקה מכנית. מבנה פליז ואלומיניום כבד ליציבות מעולה בזמן ניסויים.",
        specs: [
            {
                label: "קוטר שולחן בדיקה",
                value: "40 ס״מ מחולק ל-360°"
            },
            {
                label: "חוגות כיוונון",
                value: "4 חוגות איזון מסיביות"
            },
            {
                label: "משקולות",
                value: "כולל סט מדורג 50g-500g"
            },
            {
                label: "תאימות בגרות",
                value: "מאושר לפיקוח בניסויי חובה"
            },
            {
                label: "חומר גלם",
                value: "פליז ואלומיניום יצוק"
            },
            {
                label: "ממדים שולחן",
                value: "60x60x30 ס״מ"
            },
            {
                label: "תקן בטיחות",
                value: "CE + תקן ישראלי ת.י 900"
            },
            {
                label: "כבלי כיוונון",
                value: "ניילון קלוע עמיד בשחיקה"
            },
            {
                label: "אחריות",
                value: "5 שנים ציוד מכני"
            }
        ]
    },
    {
        id: "science-chem-table-teacher",
        category: "מעבדות מדעים",
        title: "שולחן כימיה עמיד לחומצות (עמדת מורה)",
        price: 8900,
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
        description: "עמדת המורה המרכזית בחדר הכימיה. משטח עבודה כהה ועמיד במיוחד נגד כתמים ושיתוך מחומצות מרוכזות. בטיחות קודמת לכל.",
        specs: [
            {
                label: "משטח עליון",
                value: "HPL Laboratory Grade A"
            },
            {
                label: "כיור",
                value: "כיור אפוקסי עגול ליציקת חומרים"
            },
            {
                label: "תשתיות",
                value: "2 ברזי גז עטופים בכיסוי מוגן"
            },
            {
                label: "מיגון פנימי",
                value: "ארונית מנעול כפול נסתרת"
            },
            {
                label: "ממדי שולחן",
                value: "180x80x90 ס״מ"
            },
            {
                label: "עמידות חומצה",
                value: "EN 13501-1 Class A"
            },
            {
                label: "מערכת חשמל",
                value: "שקעים מוגנים IP44 משולבים"
            },
            {
                label: "ברזי מים",
                value: "קר וחם + מערבל אנטי-ונדליזם"
            },
            {
                label: "אחריות",
                value: "10 שנים מבנה + 5 שנים משטח"
            }
        ]
    },
    {
        id: "science-chem-table-student",
        category: "מעבדות מדעים",
        title: "שולחן מעבדת כימיה (עמדת תלמיד זוגית)",
        price: 3200,
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
        description: "עמדת עבודה לזוג תלמידים. מתוכננת לשהות של שיעור כפול (90 דק'), עם הכנה למוטות תמיכה ותפסנים למבחנות וכלים.",
        specs: [
            {
                label: "מושבים",
                value: "מותאם לגובה שרפרף מעבדה"
            },
            {
                label: "חריצים למוטות",
                value: "2 פתחי יסוד יצוקים עם סגירה"
            },
            {
                label: "צבעוניות שולחן",
                value: "אפור ניטרלי לזיהוי תגובות צבע"
            },
            {
                label: "ניקיון",
                value: "ללא חיבורי מתכת עליונים לחלודה"
            },
            {
                label: "ממדים",
                value: "120x60x78 ס״מ"
            },
            {
                label: "כושר נשיאה",
                value: "עד 100 ק״ג סטטי"
            },
            {
                label: "משטח",
                value: "Trespa TopLab עמיד לכימיקלים"
            },
            {
                label: "רגליים",
                value: "פלדת צינור 40x40 מ״מ מגולוון"
            },
            {
                label: "אחריות",
                value: "7 שנים מבנה"
            }
        ]
    },
    {
        id: "science-fume-hood",
        category: "מעבדות מדעים",
        title: "מנדף כימי שולחני נייד (Fume Hood)",
        price: 6600,
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop",
        description: "מנדף עצמאי השומר באדיקות על בטיחות נשימה בעת ערבוב חומרים נדיפים. קל יחסית וניתן להזזה בניהול אב הבית מכיתה לכיתה.",
        specs: [
            {
                label: "סינון",
                value: "מסנני HEPA + Carbon"
            },
            {
                label: "בקרת זרימה",
                value: "התראה קולית בזילוג אוויר"
            },
            {
                label: "חזית קדמית",
                value: "זכוכית אקרילית אנטי-סטאטית"
            },
            {
                label: "משקל מינימלי",
                value: "22 ק״ג בלבד לניוד נוח"
            },
            {
                label: "ממדי פנים",
                value: "80x50x60 ס״מ (ר/ע/ג)"
            },
            {
                label: "ספיקת אוויר",
                value: "0.5 מ/ש' מהירות פנים"
            },
            {
                label: "רמת רעש",
                value: "≤45 dB(A)"
            },
            {
                label: "תאורה פנימית",
                value: "LED 10W אנטי התפוצצות"
            },
            {
                label: "אחריות",
                value: "3 שנים + מסנן חלופי שנתי"
            }
        ]
    },
    {
        id: "science-lab-cart",
        category: "מעבדות מדעים",
        title: "עגלת מעבדה ביולוגיה רב-שימושית",
        price: 2400,
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
        description: "עגלת אל-חלד קלאסית בבתי חולים ובמעבדות ברמה התיכונית. מאפשרת העברת סטים של מיקרוסקופים או נוזלים בצורה בטוחה בין מסדרונות.",
        specs: [
            {
                label: "חומר גלם",
                value: "נירוסטה רפואית 304"
            },
            {
                label: "גלגלים",
                value: "סיליקון שקטים עם 4 בלמים"
            },
            {
                label: "הגנת קצוות",
                value: "פגושי גומי למניעת נזק"
            },
            {
                label: "כושר נשיאה",
                value: "עד 150 ק״ג דינאמית"
            },
            {
                label: "מספר מדפים",
                value: "3 מדפים מתכווננים בגובה"
            },
            {
                label: "ממדים",
                value: "80x50x90 ס״מ"
            },
            {
                label: "רמת היגיינה",
                value: "מתאים לחדרים נקיים"
            },
            {
                label: "ידיות",
                value: "ארגונומיות מצופות גומי"
            },
            {
                label: "אחריות",
                value: "חיי אדם (Lifetime)"
            }
        ]
    },
    {
        id: "science-optics-table",
        category: "מעבדות מדעים",
        title: "שולחן אופטיקה עם מסילת לייזר ויצירה",
        price: 5200,
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
        description: "מערכת ציוד הכרחית לחקר גלים, שבירת אור, ועדשות. המסילה מקובעת כך שהלייזר יישאר יציב גם בעת כיוונון מראות ועדשות מרכזיות.",
        specs: [
            {
                label: "מסילה מרכזית",
                value: "אלומיניום 120 ס״מ"
            },
            {
                label: "בסיסים ממוגנטים",
                value: "5 רגליות הזזה לרכיבים"
            },
            {
                label: "דיודת אופטיקה",
                value: "מקור אור ירוק ואדום תקני"
            },
            {
                label: "שעות השלמה",
                value: "נדרש לניסויי חובה 5 יח׳"
            },
            {
                label: "רכיבים כלולים",
                value: "עדשות, מראות, פריזמה"
            },
            {
                label: "מפתח חזירת",
                value: "סרגל דיפרקציה 600 קו/מ״מ"
            },
            {
                label: "דיוק מסילה",
                value: "±0.1 מ״מ על פני 120 ס״מ"
            },
            {
                label: "תקן בטיחות",
                value: "לייזר Class 2 (בטוח לעיניים)"
            },
            {
                label: "אחריות",
                value: "5 שנים רכיבים אופטיים"
            }
        ]
    },
    {
        id: "science-kinematic-table",
        category: "מעבדות מדעים",
        title: "מערכת הדגמה קינמטית על שולחן אוויר",
        price: 9800,
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop",
        description: "המחשה מהפנטת לתנועה ללא חיכוך, התנגשויות אלסטיות, ושימור תנע. מנוע האוויר השקט דוחס שכבת אוויר אחידה מתחת לדיסקיות.",
        specs: [
            {
                label: "משטח פניאומטי",
                value: "זכוכית אפויה מעל משטח נקבובי"
            },
            {
                label: "מפוח אוויר",
                value: "קומפרסור מובנה פנימי שקט"
            },
            {
                label: "מצלמת עקיבה",
                value: "חיבור מצלמה עילי + איסוף PC"
            },
            {
                label: "דיסקיות",
                value: "6 קדקודים בצבעים ומשקלים שונים"
            },
            {
                label: "ממדי משטח",
                value: "60x90 ס״מ"
            },
            {
                label: "רמת רעש",
                value: "≤40 dB(A)"
            },
            {
                label: "תוכנת ניתוח",
                value: "כלולה Logger Pro Compatible"
            },
            {
                label: "ספיקת אוויר",
                value: "30 ליטר/דקה"
            },
            {
                label: "אחריות",
                value: "3 שנים + כיול שנתי"
            }
        ]
    },
    {
        id: "science-digital-microscope",
        category: "מעבדות מדעים",
        title: "סטריאו-מיקרוסקופ דיגיטלי FHD",
        price: 3800,
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
        description: "קפיצת מדרגה בלימודי הביולוגיה. במקום שתלמידים יציצו אחד-אחד, המיקרוסקופ משדר את הדגימה אל מסך המגע הכיתתי או טאבלטים מקומיים.",
        specs: [
            {
                label: "חיישן ראייה",
                value: "12MP SONY IMX"
            },
            {
                label: "הגדלה אופטית",
                value: "x40 עד x1000 רציפה"
            },
            {
                label: "תאורה פנימית",
                value: "LED עילי ותחתון"
            },
            {
                label: "קישוריות תצוגה",
                value: "USB-C מלא או אלחוטי"
            },
            {
                label: "רזולוציית וידאו",
                value: "Full HD 1080p@30fps"
            },
            {
                label: "עדשה אובייקטיבית",
                value: "4x, 10x, 40x, 100x (Oil)"
            },
            {
                label: "שלב מכני",
                value: "דו-צירי עם קליפסים"
            },
            {
                label: "תוכנת צפייה",
                value: "כלולה לקיחת מידות ותיוג"
            },
            {
                label: "אחריות",
                value: "3 שנים אופטיקה + 2 שנים אלקטרוניקה"
            }
        ]
    },
    {
        id: "science-ergonomic-table",
        category: "מעבדות מדעים",
        title: "שולחן מעבדה הנדסי ארגונומי (חשמלי)",
        price: 4300,
        image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop",
        description: "מיועד במיוחד לעבודות הדורשות ריכוז מוטורי כגון הלחמת מעגלים בפיזיקה שימושית או מודל עיצוב מוצר. גובהו מתכוונן כדי לאפשר עמידה וישיבה.",
        specs: [
            {
                label: "טווח כיוונון",
                value: "70-120 ס״מ חשמלי"
            },
            {
                label: "כוח מנועים",
                value: "זוג מנועים, עומס 100 ק״ג"
            },
            {
                label: "משטח עבודה",
                value: "Plywood מצופה נגד הלחמה"
            },
            {
                label: "מניעת התנגשות",
                value: "חיישן ג׳יירו מובנה"
            },
            {
                label: "ממדי משטח",
                value: "150x75 ס״מ"
            },
            {
                label: "מהירות הרמה",
                value: "38 מ״מ לשנייה"
            },
            {
                label: "רמת רעש",
                value: "≤50 dB(A)"
            },
            {
                label: "כבילה",
                value: "תעלת כבלים מובנית"
            },
            {
                label: "אחריות",
                value: "5 שנים כולל מנועים"
            }
        ]
    },
    {
        id: "science-safety-cabinet",
        category: "מעבדות מדעים",
        title: "ארון בטיחותי לאחסון כימיקלים",
        price: 7400,
        image: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=800&auto=format&fit=crop",
        description: "חיוני לאחסון חומרים דליקים וריאגנטים מסוכנים. קירות פלדה כפולים לאחסנה מווסתת למקרי תקריות אש או נזילות סמויות במעבדה.",
        specs: [
            {
                label: "חומר מבנה",
                value: "פלדה כפולה עם בידוד אוויר"
            },
            {
                label: "מדפים",
                value: "פוליפרופילן נגד קורוזיה"
            },
            {
                label: "מנעולים",
                value: "מנגנון מרכזי 3 בריחים"
            },
            {
                label: "פתחי אוורור",
                value: "הכנה לפליטה למערכת מרכזית"
            },
            {
                label: "נפח אחסון",
                value: "250 ליטר"
            },
            {
                label: "תקן בטיחות",
                value: "EN 14470-1 (30 דקות אש)"
            },
            {
                label: "ממדים חיצוניים",
                value: "120x60x195 ס״מ"
            },
            {
                label: "תיוג",
                value: "סמלי סכנה מודבקים מראש"
            },
            {
                label: "אחריות",
                value: "10 שנים מבנה"
            }
        ]
    },
    {
        id: "pc-staff-setup",
        category: "ציוד קצה",
        title: "עמדת מחשב מתקדמת לצוות מנהלה",
        price: 3400,
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
        description: "מחשב Mini-PC משולב עם מסך 24 אינץ' שמבטיח עבודה חלקה במסמכים כבדים ובמערכות פדגוגיות. אפס כבלים מפוזרים ולוק הייטקיסטי.",
        specs: [
            {
                label: "מעבד",
                value: "Intel Core i5 (דור 12)"
            },
            {
                label: "זיכרון פנימי",
                value: "16GB LPDDR4X"
            },
            {
                label: "אחסון מטמון",
                value: "512GB SSD NVMe"
            },
            {
                label: "אביזרים כלולים",
                value: "מקלדת עברית ועכבר אלחוטיים"
            },
            {
                label: "מסך כלול",
                value: "24 אינץ׳ IPS Full HD"
            },
            {
                label: "מערכת הפעלה",
                value: "Windows 11 Pro"
            },
            {
                label: "תקשורת",
                value: "Wi-Fi 6 + Bluetooth 5.2 + LAN"
            },
            {
                label: "רמת רעש",
                value: "≤25 dB(A) (שקט במיוחד)"
            },
            {
                label: "אחריות",
                value: "3 שנים On-Site"
            }
        ]
    },
    {
        id: "pc-teacher-ergo",
        category: "ציוד קצה",
        title: "עמדת כתיבה למורה (Podium)",
        price: 4100,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
        description: "דוכן מרצה חכם המרכז בתוכו את כל שליטת הכיתה. ללא צורך בהפניית גב לכיתה תוך שמירה על קשר עין עם התלמידים למניעת הפרעות.",
        specs: [
            {
                label: "מסך מובנה",
                value: "מגע אופקי 21.5 אינץ׳"
            },
            {
                label: "זווית קריאה",
                value: "מתכוונן לקו ראייה טבעי"
            },
            {
                label: "מיתוג חומרה",
                value: "כפתורי שליטה למקרן/מסך"
            },
            {
                label: "כבילה נסתרת",
                value: "חיווט דרך עמוד יחיד"
            },
            {
                label: "מחשב משולב",
                value: "Intel i5, 8GB RAM, 256GB SSD"
            },
            {
                label: "חומר מארז",
                value: "פלדה מצופה בתקן RAL"
            },
            {
                label: "ממדים",
                value: "60x55x120 ס״מ"
            },
            {
                label: "כושר נשיאה",
                value: "עד 30 ק״ג על המשטח"
            },
            {
                label: "אחריות",
                value: "5 שנים מבנה + 3 שנים אלקטרוניקה"
            }
        ]
    },
    {
        id: "pc-monitor-4k-27",
        category: "ציוד קצה",
        title: "תצוגת מורה מתקדמת 27\" 4K",
        price: 2100,
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
        description: "למורות ולרכזים הדורשים סביבת עבודה נרחבת לבניית מערכי שיעור, גיליונות נתונים ובדיקת מבחנים מרושתים בלי להעמיס על העיניים.",
        specs: [
            {
                label: "פאנל מסך",
                value: "27 אינץ׳ IPS 4K (10Bit)"
            },
            {
                label: "הגנת עיניים",
                value: "TÜV Rheinland סינון אור כחול"
            },
            {
                label: "חיבור קדמי",
                value: "USB-C העברת נתונים + טעינה 65W"
            },
            {
                label: "רגלית אקטיבית",
                value: "סיבוב אופקי ואנכי (Pivot)"
            },
            {
                label: "בהירות",
                value: "350 cd/m²"
            },
            {
                label: "זמן תגובה",
                value: "5ms GtG"
            },
            {
                label: "יציאות",
                value: "HDMI 2.0 x2, DP 1.4, USB Hub"
            },
            {
                label: "ניגודיות",
                value: "1300:1 סטטי"
            },
            {
                label: "אחריות",
                value: "3 שנים כולל פיקסלים מתים"
            }
        ]
    },
    {
        id: "pc-aio-24",
        category: "ציוד קצה",
        title: "מחשב All-in-One 24\"",
        price: 3600,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
        description: "מערכת מושלמת למזכירויות ועמדות מידע בספריות. ללא מארז נפרד - גם המחשב תפור מאחורי המסך, חוסך מקום, שקט ובטוח מתקלות משיכת חוטים.",
        specs: [
            {
                label: "תצורה",
                value: "מחשב ומסך ביחידה אחת (AIO)"
            },
            {
                label: "מצלמת רשת",
                value: "קופצת מכנית Pop-up לפרטיות"
            },
            {
                label: "רמקולים",
                value: "סטריאו מקדמיים 2x5W"
            },
            {
                label: "עיצוב ויזואלי",
                value: "כסוף מט עמיד לשריטות"
            },
            {
                label: "מעבד",
                value: "Intel Core i5 (דור 13)"
            },
            {
                label: "זיכרון",
                value: "8GB DDR4 (ניתן לשדרוג ל-32GB)"
            },
            {
                label: "אחסון",
                value: "256GB SSD NVMe"
            },
            {
                label: "מסך",
                value: "24 אינץ׳ Full HD IPS Anti-Glare"
            },
            {
                label: "אחריות",
                value: "3 שנים On-Site"
            }
        ]
    },
    {
        id: "pc-aio-27-touch",
        category: "ציוד קצה",
        title: "מחשב מגע למנהלים AIO 27\"",
        price: 5200,
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
        description: "סביבת פרימיום נציגה שמשנה לחלוטין את עיצוב חדר המנהל. משמשת לפגישות מצומצמות ולהצגת נתונים בדרך אלגנטית ומגע אינטואיטיבי אנושי.",
        specs: [
            {
                label: "נקודות מגע",
                value: "10 Points Capacitive"
            },
            {
                label: "עיבוד קצה",
                value: "Intel i7 vPro לניהול מרוחק"
            },
            {
                label: "שטח אחסון",
                value: "1TB NVMe"
            },
            {
                label: "קישוריות",
                value: "Wi-Fi 6E + LAN כפול לגיבוי"
            },
            {
                label: "מסך",
                value: "27 אינץ׳ QHD מגע"
            },
            {
                label: "זיכרון",
                value: "16GB DDR5"
            },
            {
                label: "מצלמה",
                value: "5MP עם Windows Hello IR"
            },
            {
                label: "ספק כוח",
                value: "פנימי 180W (ללא בריק חיצוני)"
            },
            {
                label: "אחריות",
                value: "5 שנים פרימיום"
            }
        ]
    },
    {
        id: "pc-charging-cart",
        category: "ציוד קצה",
        title: "עגלת טעינה ניידת ל-36 טאבלטים/מחשבים",
        price: 4900,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
        description: "מתחם נייד ונעול השולח מכשורי 1:1 נטענים לכל כיתה. מספק מעגל טעינה חכם המונע נפילות מתח כשיש שלושים מכשירים מחוברים לשקע רגיל.",
        specs: [
            {
                label: "חלוקת תאים",
                value: "36 תאים מצופים סיליקון"
            },
            {
                label: "טעינה חכמה",
                value: "Power Cycle Manager"
            },
            {
                label: "אוורור וקירור",
                value: "מאווררים תרמיים שקטים"
            },
            {
                label: "הגנה אקוטית",
                value: "דלת פלדה + מנעול 3-כיוונים"
            },
            {
                label: "תאימות מכשירים",
                value: "לפטופים עד 15.6 אינץ׳ + טאבלטים"
            },
            {
                label: "ממדים",
                value: "120x60x100 ס״מ"
            },
            {
                label: "גלגלים",
                value: "4 גלגלים תעשייתיים עם בלמים"
            },
            {
                label: "ספק כוח",
                value: "שקע בודד 220V (מותאם ישראלי)"
            },
            {
                label: "אחריות",
                value: "5 שנים מבנה + 2 שנים חשמל"
            }
        ]
    },
    {
        id: "pc-dual-arm",
        category: "ציוד קצה",
        title: "זרוע ארגונומית כפולה לשני מסכים",
        price: 850,
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
        description: "לניהול שורת נתונים בשקיפות, הזרוע ממקמת שני צגים בצורה צפה. מרחב שולחן מרווח ובריאות הצוואר תודות לכיוון נטול המאמץ (בוכנת גז).",
        specs: [
            {
                label: "טכנולוגיית תנועה",
                value: "בוכנות גז מתכווננות למשקל"
            },
            {
                label: "גבולות המסך",
                value: "עד 32 אינץ׳ ו-9 ק״ג למסך"
            },
            {
                label: "ניתוב חיווט",
                value: "תעלות נסתרות אסתטיות"
            },
            {
                label: "בסיס צמוד",
                value: "תפס שולחן או Grommet"
            },
            {
                label: "זוויות סיבוב",
                value: "360° סיבוב + ±35° הטיה"
            },
            {
                label: "חומר גלם",
                value: "אלומיניום מעוצב מט"
            },
            {
                label: "VESA",
                value: "75x75 / 100x100 מ״מ"
            },
            {
                label: "משקל הזרוע",
                value: "5.5 ק״ג"
            },
            {
                label: "אחריות",
                value: "10 שנים מכנית"
            }
        ]
    },
    {
        id: "pc-docking-station",
        category: "ציוד קצה",
        title: "עמדת מעגן Docking Station כפולה",
        price: 750,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
        description: "לצוותים המתניידים עם לפטופ. קליק אחד של כבל USB-C פשוט, והלפטופ נטען, ומתחבר מיד לשני מסכים, רשת חוטית, והתקני פלייבק וקול בחדר המורים.",
        specs: [
            {
                label: "חיבור עליון",
                value: "USB-C נתונים + טעינה 100W"
            },
            {
                label: "תצוגת פיצול",
                value: "HDMI 2.0 x2 (תוכן 4K)"
            },
            {
                label: "רשת ואבטחה",
                value: "Ethernet + USB אבטחה"
            },
            {
                label: "התאמה לשטח",
                value: "אלומיניום קומפקטי קריר"
            },
            {
                label: "יציאות USB",
                value: "USB-A 3.0 x3 + USB-C x1"
            },
            {
                label: "חריץ אבטחה",
                value: "Kensington Lock"
            },
            {
                label: "תואם מערכות",
                value: "Windows, macOS, ChromeOS"
            },
            {
                label: "ממדים",
                value: "17x8x2.5 ס״מ"
            },
            {
                label: "אחריות",
                value: "3 שנים"
            }
        ]
    },
    {
        id: "pc-classroom-audio",
        category: "ציוד קצה",
        title: "רמקולי עוצמה אקוסטיים לכיתה",
        price: 1100,
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop",
        description: "ערכת הגברה קיר מינימליסטית עם בלוטות'. עוקפת בקלות את הרעש החיצוני ומשליכה צליל חד לאחרון התלמידים בכיתה בשיעורי האזנה לשפות ומוזיקה.",
        specs: [
            {
                label: "עוצמת שמע",
                value: "60W RMS לזוג אקטיבי-פסיבי"
            },
            {
                label: "קישוריות",
                value: "Bluetooth 5.0 + RCA + AUX"
            },
            {
                label: "פיזור אקוסטי",
                value: "טוויטר משי להאזנת דיבור חדה"
            },
            {
                label: "הרכבה",
                value: "זרועות קיר מתכווננות כלולות"
            },
            {
                label: "טווח תדרים",
                value: "55Hz - 20kHz"
            },
            {
                label: "יחס אות/רעש",
                value: ">85 dB"
            },
            {
                label: "ממדים לרמקול",
                value: "18x15x28 ס״מ"
            },
            {
                label: "כבל רמקול",
                value: "5 מטר כלול"
            },
            {
                label: "אחריות",
                value: "2 שנים"
            }
        ]
    },
    {
        id: "pc-ptz-camera",
        category: "ציוד קצה",
        title: "מצלמת עקיבה בהוראה היברידית",
        price: 3500,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop",
        description: "מצלמה חכמה שנעה באופן אוטומטי בעקבות המרצה בכלל המרחב. תלמידים מרחוק מקבלים שיעור טלוויזיוני מושקע במקום מסך מצלמת רשת קפוא ומשעמם.",
        specs: [
            {
                label: "עקיבת AI",
                value: "זיהוי צללית ותנועת ראש רציף"
            },
            {
                label: "זום אופטי",
                value: "12X ללא ירידת איכות"
            },
            {
                label: "מנועים שקטים",
                value: "PTZ חלק, לא נשמע במיקרופון"
            },
            {
                label: "ממשקים",
                value: "USB Plug-and-Play ישיר"
            },
            {
                label: "רזולוציית וידאו",
                value: "4K@30fps / 1080p@60fps"
            },
            {
                label: "שדה ראייה",
                value: "72° זווית רחבה"
            },
            {
                label: "מיקרופון",
                value: "מערך 2 מיקרופונים כיווניים"
            },
            {
                label: "תואם פלטפורמות",
                value: "Zoom, Teams, Meet, Webex"
            },
            {
                label: "אחריות",
                value: "3 שנים"
            }
        ]
    },
    {
        id: "edu-edit-basic",
        category: "תוכנה",
        title: "תוכנת ניהול ועריכה EduEdit",
        price: 450,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
        description: "הפתרון המוכח לניהול ולעריכת תכנים במוסדות חינוך ובמגמות יצירתיות. הרישוי מתאים להתקנה הפצה מוסדית ונועד לתמוך במאות עמדות מחשבים עם מינימום עומס על ה-IT.",
        specs: [
            {
                label: "רישוי",
                value: "שנתי למשתמש מוסדי יחיד"
            },
            {
                label: "תמיכה בעמדות",
                value: "עד 5,000 מכשירים במקביל"
            },
            {
                label: "ענן",
                value: "100GB אחסון לכל תלמיד"
            },
            {
                label: "אביזרים",
                value: "אפליקציה למורה ולתלמיד כלולה"
            },
            {
                label: "עריכת וידאו",
                value: "חיתוך בסיסי + מסננים + כתוביות"
            },
            {
                label: "פורמטים",
                value: "MP4, MOV, AVI, MP3, WAV"
            },
            {
                label: "תמיכה טכנית",
                value: "צ׳אט + אימייל בימי עסקים"
            },
            {
                label: "שפות ממשק",
                value: "עברית, ערבית, אנגלית"
            },
            {
                label: "אחריות",
                value: "עדכוני אבטחה לכל חיי הרישוי"
            }
        ]
    },
    {
        id: "cms-campus-signage",
        category: "תוכנה",
        title: "מערכת CMS לניהול מסכי מידע בראיית קמפוס",
        price: 1200,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        description: "מערכת שליטה עילאית (Content Management System) המאפשרת למזכירות ולרכבת התיכון לשלוח הודעות מתפרצות ומערכות שעות לכל תצוגת הקמפוס מיידית בגרירה פשוטה (Drag & Drop).",
        specs: [
            {
                label: "ניהול מרוחק",
                value: "ממשק ענן דפדפני"
            },
            {
                label: "חלוקה אזורית",
                value: "קיבוץ מסכים ע״פ אשכולות"
            },
            {
                label: "הודעות חירום",
                value: "השתלטות בכפתור אדום בודד"
            },
            {
                label: "דוחות שימוש",
                value: "ניטור זמני פעולה וסטטוס תקלות"
            },
            {
                label: "תבניות מוכנות",
                value: "50+ תבניות עברית/ערבית"
            },
            {
                label: "מדיה נתמכת",
                value: "תמונות, וידאו, HTML5, RSS"
            },
            {
                label: "מספר מסכים",
                value: "עד 200 מסכים ברישוי בודד"
            },
            {
                label: "אבטחה",
                value: "HTTPS + אימות דו-שלבי"
            },
            {
                label: "אחריות",
                value: "שנה + חידוש שנתי"
            }
        ]
    },
    {
        id: "edu-edit-pro-100",
        category: "תוכנה",
        title: "EduEdit Pro (רישוי שכבתי ל-100 משתמשים)",
        price: 38000,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
        description: "גרסת הפרו למגלי וידאו ועיצוב. מונעת מכוח AI המייעל רינדור טקסט ומודלים, בחבילה המיועדת להקצות הרשאות לשכבה מלאה (עד 100 לייסנסים גלובלים).",
        specs: [
            {
                label: "סוג רישיון",
                value: "ארגוני Float (מתנייד)"
            },
            {
                label: "תכונות פרו",
                value: "Color Grading ו-4K חלקה"
            },
            {
                label: "שיתופיות",
                value: "Version Control לסטודנטים"
            },
            {
                label: "תמיכה",
                value: "מוקד ייעודי לטכנאי המגמה"
            },
            {
                label: "עיבוד GPU",
                value: "NVIDIA CUDA / Intel QuickSync"
            },
            {
                label: "ייצוא",
                value: "4K H.265 + ProRes + Subtitle SRT"
            },
            {
                label: "אפקטים",
                value: "400+ מעברים ואפקטים מובנים"
            },
            {
                label: "גיבוי פרויקטים",
                value: "ענן 5TB משותף למגמה"
            },
            {
                label: "אחריות",
                value: "SLA 24 שעות לתקלות קריטיות"
            }
        ]
    },
    {
        id: "class-control-suite",
        category: "תוכנה",
        title: "מערכת השתלטות וניהול כיתה ClassControl",
        price: 850,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        description: "העיניים והידיים של המורה. התוכנה מאפשרת לחסום גלישה חופשית, לנעול מסכי תלמידים להקשבה מרוכזת, ולשדר את מסך המורה או תלמיד נבחר לכולם.",
        specs: [
            {
                label: "השתלטות",
                value: "נעילת עכבר/מקלדת/מסך בלחצן"
            },
            {
                label: "לכידת מסכים",
                value: "צפייה בכל המחברות בבת אחת"
            },
            {
                label: "הגבלת רשת",
                value: "רשימות שחורות/לבנות לאתרים"
            },
            {
                label: "הפצה מהירה",
                value: "שליפת קובץ למטלת כיתה"
            },
            {
                label: "הקלטת מסך",
                value: "הקלטת שיעור אוטומטית עם שמע"
            },
            {
                label: "סקרים ומבחנים",
                value: "כלי סקר מהיר בזמן אמת"
            },
            {
                label: "תואם מערכות",
                value: "Windows 10/11, ChromeOS"
            },
            {
                label: "מספר תלמידים",
                value: "עד 60 סטודנטים בכיתה"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי + עדכונים"
            }
        ]
    },
    {
        id: "vr-chem-bio",
        category: "תוכנה",
        title: "סימולציית מעבדה וירטואלית (ChemBio VR)",
        price: 1550,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
        description: "תחליף בטוח וזול לניסויים מסוכנים. התוכנה מספקת פיזיקה כימית אמיתית לחומרים בווירטואליה, ומאפשרת ביצוע תגובות מורכבות ללא צורך באוורור ומיגון קורוזיבי.",
        specs: [
            {
                label: "תאימות חומרה",
                value: "Oculus Quest, HTC Vive, PC VR"
            },
            {
                label: "רזולוציה עוקבת",
                value: "60FPS מינימום"
            },
            {
                label: "בנק ניסויים",
                value: "400+ ריאקציות כימיות"
            },
            {
                label: "אשפי מדידה",
                value: "הפקת טבלאות נתונים תוך-כדי"
            },
            {
                label: "מצב 2D",
                value: "עובד גם ללא משקפי VR (מסך)"
            },
            {
                label: "שפות",
                value: "עברית, ערבית, אנגלית"
            },
            {
                label: "דוחות תלמיד",
                value: "ציון אוטומטי + דו״ח מורה"
            },
            {
                label: "עדכוני תוכן",
                value: "ניסויים חדשים כל רבעון"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי מתחדש"
            }
        ]
    },
    {
        id: "time-sync-scheduler",
        category: "תוכנה",
        title: "מערכת בניית מערכת שעות חכמה TimeSync",
        price: 2200,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        description: "הקץ לשיבוצים ידניים מסורבלים ולחפיפות הרסניות. אלגוריתם שמתעדף תנאי העסקה, אולמות מצומצמים ומגבלות מורים עד לייצור מערכת מושלמת (ללא התנגשויות).",
        specs: [
            {
                label: "מנוע שיבוץ",
                value: "AI מבוסס Constraint Programming"
            },
            {
                label: "יצוא פורמטים",
                value: "הדפסה אישית + Google Calendar"
            },
            {
                label: "דוחות פיקוח",
                value: "ריכוז משמרות מול משרד החינוך"
            },
            {
                label: "טיפול מילוי מקום",
                value: "הצעה אוטומטית למורים קיימים"
            },
            {
                label: "ייבוא נתונים",
                value: "Excel, CSV, ממשק API פתוח"
            },
            {
                label: "מספר מורים",
                value: "ללא הגבלה"
            },
            {
                label: "התראות",
                value: "SMS + אימייל + Push למורים"
            },
            {
                label: "גיבוי",
                value: "ענן אוטומטי יומי"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי + הדרכה חד-פעמית"
            }
        ]
    },
    {
        id: "nextclass-suite",
        category: "תוכנה",
        title: "רישוי קמפוס כולל - NextClass Suite",
        price: 12500,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
        description: "The Ultimate Bundle. רישוי קמפוסי גלובלי המכסה את כלל האפליקציות של NextClass ללא צורך בספירת ראשונים. גישה חופשית לעדכונים אבטחה וכלי ניהול פלייטים.",
        specs: [
            {
                label: "היקף שימוש",
                value: "Unlimited בקמפוס הפיזי"
            },
            {
                label: "כלולים מרכזיים",
                value: "EduEdit, ClassControl, CMS, TimeSync"
            },
            {
                label: "תמיכה שנתית",
                value: "SLA שעה + מנהל לקוח אישי"
            },
            {
                label: "הרשאות",
                value: "SSO מאובטח (SAML 2.0 / AD)"
            },
            {
                label: "עדכונים",
                value: "גרסאות Major כלולות לצמיתות"
            },
            {
                label: "הדרכה",
                value: "3 ימי הדרכה באתר כלולים"
            },
            {
                label: "SLA תקלות",
                value: "Critical: שעה, High: 4 שעות"
            },
            {
                label: "גיבוי",
                value: "ענן מוצפן + גיבוי מקומי"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי כולל הכל"
            }
        ]
    },
    {
        id: "lib-management",
        category: "תוכנה",
        title: "מודול ניהול ספריה ואיתור פריטים",
        price: 1100,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        description: "הספריה עוברת דיגיטציה. מערכת אינוונטר מבוססת ברקוד או RFID שמסייעת לספרנית לאתר ספרים אבודים ולהזכיר לתלמידים דרך הנייד על תאריכי החזרה.",
        specs: [
            {
                label: "איתור מלאי",
                value: "סריקת ברקודי ISBN בינלאומיים"
            },
            {
                label: "התרעות SMS",
                value: "דיוור השאלה/קנס להורים"
            },
            {
                label: "המלצות",
                value: "אלגוריתם מידע רלוונטי לחומרי לימוד"
            },
            {
                label: "גיבוי",
                value: "היסטוריית עסקאות 12 שנים"
            },
            {
                label: "תמיכת RFID",
                value: "קורא RFID לספרים (אופציונלי)"
            },
            {
                label: "פורטל תלמיד",
                value: "ממשק אינטרנטי לבדיקת זמינות"
            },
            {
                label: "ייצוא דוחות",
                value: "Excel + PDF לדיווח שנתי"
            },
            {
                label: "מספר פריטים",
                value: "ללא הגבלת כמות בקטלוג"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי + תמיכה טלפונית"
            }
        ]
    },
    {
        id: "it-helpdesk",
        category: "תוכנה",
        title: "מערכת מעקב פניות וציוד מחשוב (IT Helpdesk)",
        price: 2900,
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
        description: "כלי העבודה החשוב ביותר לצוות ה-IT הבית-ספרי ולרכז התקשוב. מערכת טיקטים שבה מורים פותחים תקלה ויודעים במדויק מתי היא תיפתר, תוך תעדוף משברים בכיתה על פני בעיות פקידותיות.",
        specs: [
            {
                label: "פתיחת קריאה",
                value: "קיוסק דפדפן + סריקת QR"
            },
            {
                label: "ניתוב חכם",
                value: "שיוך תקלה לפי סוג לצוות הנכון"
            },
            {
                label: "מאגר ציוד",
                value: "Tracking סריאלי לאחריות מסכים"
            },
            {
                label: "סטטיסטיקה",
                value: "Dashboard מדדי MTBF"
            },
            {
                label: "בסיס ידע",
                value: "Wiki פנימי לפתרונות חוזרים"
            },
            {
                label: "SLA מותאם",
                value: "הגדרת זמני פתרון לפי חומרה"
            },
            {
                label: "אינטגרציות",
                value: "Google Workspace, Microsoft 365"
            },
            {
                label: "מספר טכנאים",
                value: "ללא הגבלה"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי + עדכונים"
            }
        ]
    },
    {
        id: "edu-cad-3d",
        category: "תוכנה",
        title: "רישוי תוכנת שרטוט הנדסי 3D לתלמידים (EduCAD)",
        price: 3300,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop",
        description: "מנוע השרטוט שמכניס תלמידי תיכון לתעשיית האדריכלות ושחזור פני השטח. פלדלת אינטואיטיבית לבניית מודלים מוכרים, החל מסרטוט טכני יבש ועד להדפסת מודלים בתלת מימד למדפסות הקמפוס.",
        specs: [
            {
                label: "תקני תעשייה",
                value: "תואם קריאת קבצי DWG"
            },
            {
                label: "הדפסת תלת מימד",
                value: "מנתח Slicer מובנה"
            },
            {
                label: "עבודות בנייה",
                value: "סימולאטור מתח כבידה למבנים"
            },
            {
                label: "ממשק עברי",
                value: "לוקאליישן מלא + קיצורי דרך"
            },
            {
                label: "רינדור",
                value: "מנוע PBR בזמן אמת"
            },
            {
                label: "ייצוא",
                value: "STL, OBJ, STEP, DWG, PDF"
            },
            {
                label: "תואם מדפסות",
                value: "Creality, Prusa, Bambu Lab"
            },
            {
                label: "שיתוף פרויקטים",
                value: "ענן משותף לצוותי תלמידים"
            },
            {
                label: "אחריות",
                value: "רישוי שנתי ל-30 עמדות"
            }
        ]
    }
];

export default products;
