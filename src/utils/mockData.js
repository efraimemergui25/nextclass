export const HardwareCatalog = [
    {
        id: 1,
        sku: "EDU-T75",
        name: "מסך מגע אינטראקטיבי Pro 75",
        description: "הלב הפועם של הכיתה החכמה. חוויית למידה שנוגעת בכל תלמיד.",
        category: "מסכי מגע",
        basePrice: 12000,
        contractPrice: 9500,
        stockStatus: "במלאי",
        imageUrl: "/path/to/pro-75-uhd-4k-image.png",
        specs: { size: "75 inch", resolution: "4K UHD", touch: "20-point multi-touch" }
    },
    {
        id: 2,
        sku: "CAM-S86",
        name: "עמדת מידע קמפוס 86",
        description: "לוח מודעות דיגיטלי ענק שמשדר חדשנות מיד כשנכנסים בשערי בית הספר.",
        category: "עמדות מידע",
        basePrice: 15000,
        contractPrice: 13200,
        stockStatus: "במלאי",
        imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800",
        specs: { size: "86 inch", brightness: "500 nits", operation: "24/7" }
    },
    {
        id: 3,
        sku: "SW-EDU-01",
        name: "EduEdit Studio",
        description: "תוכנת עריכה קומפקטית וקלה ללמידה. כי יצירתיות היא מיומנות העתיד.",
        category: "תוכנה",
        basePrice: 500,
        contractPrice: 150,
        stockStatus: "זמין דיגיטלית",
        imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800",
        specs: { platform: "Windows/Mac", license: "Perpetual Academic", type: "Video & Media Editing" }
    },
    {
        id: 4,
        sku: "MON-27E",
        name: "Vision Monitor 27",
        description: "תצוגה חדה לשעות של תכנות, מחקר ויצירה במעבדות המחשבים.",
        category: "מעבדות STEM",
        basePrice: 1200,
        contractPrice: 850,
        stockStatus: "מלאי מלא",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800",
        specs: { size: "27 inch", resolution: "QHD 1440p", panel: "IPS" }
    },
    {
        id: 5,
        sku: "LAB-CH01",
        name: "שולחן מעבדה מודולרי",
        description: "עמדת חקר חכמה, עמידה לחומרים, המקום בו מדענים צעירים נולדים.",
        category: "מעבדות STEM",
        basePrice: 4500,
        contractPrice: 3800,
        stockStatus: "במלאי",
        imageUrl: "https://images.unsplash.com/photo-1581093588401-fbb62a04f120?auto=format&fit=crop&q=80&w=800",
        specs: { surface: "Chemical-resistant epoxy", dimensions: "120x60x85 cm", features: "Gas & Electrical outlets" }
    },
    {
        id: 6,
        sku: "PHY-F01",
        name: "שולחן כוחות וקטורי",
        description: "להבין פיזיקה דרך הידיים. ציוד מעבדה מתקדם ללימוד מכניקה חווייתי.",
        category: "מעבדות STEM",
        basePrice: 800,
        contractPrice: 650,
        stockStatus: "במלאי יבואן",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=800",
        specs: { material: "Aluminum", accuracy: "0.1 degree", setup: "4x weight sets" }
    }
];

export const UserProfile = {
    institution: "בית ספר חלל, תל אביב",
    contractId: "EDU-2026-A"
};
