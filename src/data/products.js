/**
 * NextClass — Real Product Catalog (seed / offline fallback)
 *
 * This file holds NextClass's real products: three computer monitors + three
 * complementary keyboard/mouse accessories (offered as add-ons on monitor pages).
 * The live Firestore `products` collection is the source of truth for price/image/stock;
 * this array is the offline fallback + first-run seed. Specs below are verified against
 * the official ASUS / HP product pages (July 2026). Any spec that could not be verified
 * against a manufacturer source is intentionally omitted rather than invented.
 *
 * Product model fields: id, brand, model, category, title, price, sku, stock, threshold,
 * image, description, specs[{label,value}], dimensions[{label,value}].
 */

const defaultProducts = [
    {
        id: "asus-vz24ehf",
        brand: "ASUS",
        model: "VZ24EHF",
        sku: "NC-ASUS-VZ24EHF",
        category: "מסכי מחשב",
        title: "מסך מחשב ASUS VZ24EHF 23.8\" Full HD IPS 100Hz",
        price: 305,
        stock: 24,
        threshold: 5,
        image: "https://dlcdnwebimgs.asus.com/gain/c4173a00-c786-43cf-91fc-8e342ece9394/w692",
        description: "מסך IPS בגודל 23.8 אינץ' ברזולוציית Full HD עם קצב רענון 100Hz וטכנולוגיית Adaptive-Sync. מסגרת דקה במיוחד, סינון אור כחול ותצוגה נטולת הבהובים לנוחות צפייה לאורך זמן.",
        specs: [
            { label: "טכנולוגיית פאנל", value: "IPS" },
            { label: "גודל תצוגה", value: "23.8 אינץ' (16:9)" },
            { label: "רזולוציה", value: "Full HD 1920×1080" },
            { label: "קצב רענון", value: "100Hz" },
            { label: "זמן תגובה", value: "1ms MPRT" },
            { label: "בהירות", value: "250 cd/m²" },
            { label: "יחס ניגודיות", value: "1300:1" },
            { label: "זווית צפייה", value: "178°/178°" },
            { label: "סנכרון תמונה", value: "Adaptive-Sync" },
            { label: "חיבורים", value: "HDMI 1.4" },
            { label: "תושבת VESA", value: "75×75 מ\"מ" }
        ],
        dimensions: [
            { label: "רוחב", value: "540 מ\"מ" },
            { label: "גובה (עם מעמד)", value: "394 מ\"מ" },
            { label: "עומק (עם מעמד)", value: "210 מ\"מ" },
            { label: "עובי (ללא מעמד)", value: "39 מ\"מ" },
            { label: "משקל", value: "2.85 ק\"ג" }
        ]
    },
    {
        id: "hp-524pn",
        brand: "HP",
        model: "Series 5 Pro 524pn",
        sku: "NC-HP-524PN",
        category: "מסכי מחשב",
        title: "מסך מחשב HP Series 5 Pro 524pn 24\" WUXGA IPS",
        price: 460,
        stock: 18,
        threshold: 5,
        image: "https://c1.neweggimages.com/ProductImage/AR0TD2507150OX0PG60.jpg",
        description: "מסך IPS מקצועי בגודל 24 אינץ' ביחס 16:10 וברזולוציית WUXGA ‏(1920×1200) המספק שטח עבודה אנכי גדול יותר. כיסוי 100% sRGB, מעמד ארגונומי מלא (גובה, הטיה, סיבוב וסבסוב) ורכזת USB מובנית.",
        specs: [
            { label: "טכנולוגיית פאנל", value: "IPS" },
            { label: "גודל תצוגה", value: "24 אינץ' (16:10)" },
            { label: "רזולוציה", value: "WUXGA 1920×1200" },
            { label: "קצב רענון", value: "100Hz" },
            { label: "זמן תגובה", value: "5ms GtG" },
            { label: "בהירות", value: "350 cd/m²" },
            { label: "יחס ניגודיות", value: "1500:1" },
            { label: "מרחב צבע", value: "100% sRGB" },
            { label: "זווית צפייה", value: "178°/178°" },
            { label: "חיבורים", value: "HDMI 1.4, DisplayPort 1.2, ‏4×USB-A, ‏USB-B" },
            { label: "ארגונומיה", value: "גובה 150 מ\"מ, הטיה, סיבוב וסבסוב" },
            { label: "תושבת VESA", value: "100×100 מ\"מ" }
        ],
        dimensions: [
            { label: "רוחב", value: "533 מ\"מ" },
            { label: "גובה (עם מעמד)", value: "518 מ\"מ" },
            { label: "עומק (עם מעמד)", value: "190 מ\"מ" },
            { label: "טווח כוונון גובה", value: "150 מ\"מ" },
            { label: "משקל (עם מעמד)", value: "5.1 ק\"ג" }
        ]
    },
    {
        id: "asus-va279qg-j",
        brand: "ASUS",
        model: "VA279QG-J",
        sku: "NC-ASUS-VA279QGJ",
        category: "מסכי מחשב",
        title: "מסך מחשב ASUS VA279QG-J 27\" Full HD IPS 120Hz",
        price: 375,
        stock: 27,
        threshold: 5,
        image: "https://dlcdnwebimgs.asus.com/gain/9c0312c7-452f-4b7e-88ca-22df8be0fc2a/w692",
        description: "מסך IPS בגודל 27 אינץ' ברזולוציית Full HD עם קצב רענון 120Hz וטכנולוגיית Adaptive-Sync לתמונה חלקה. כולל רמקולים מובנים, מגוון חיבורים (DisplayPort, ‏HDMI, ‏VGA) וטכנולוגיות שמירה על העיניים.",
        specs: [
            { label: "טכנולוגיית פאנל", value: "IPS" },
            { label: "גודל תצוגה", value: "27 אינץ' (16:9)" },
            { label: "רזולוציה", value: "Full HD 1920×1080" },
            { label: "קצב רענון", value: "120Hz" },
            { label: "זמן תגובה", value: "1ms MPRT" },
            { label: "בהירות", value: "300 cd/m²" },
            { label: "יחס ניגודיות", value: "1500:1 (עד 3000:1)" },
            { label: "זווית צפייה", value: "178°/178°" },
            { label: "סנכרון תמונה", value: "Adaptive-Sync" },
            { label: "רמקולים", value: "2×2W מובנים" },
            { label: "חיבורים", value: "DisplayPort 1.2, ‏HDMI 1.4, ‏VGA" },
            { label: "תושבת VESA", value: "100×100 מ\"מ" }
        ],
        dimensions: [
            { label: "רוחב", value: "613 מ\"מ" },
            { label: "גובה (עם מעמד)", value: "447 מ\"מ" },
            { label: "עומק (עם מעמד)", value: "194 מ\"מ" },
            { label: "עובי (ללא מעמד)", value: "50 מ\"מ" },
            { label: "משקל", value: "3.77 ק\"ג" }
        ]
    },
    // ─── Complementary accessories (offered on the monitor product pages). Data
    //     extracted verbatim from c-data.co.il. Retail price is owner-set (B2B
    //     wholesale price is login-gated), so priceOnRequest until priced in admin.
    {
        id: "asus-cw101", brand: "ASUS", model: "CW101", sku: "CW101 KEYBOARD+MOUSE/BK/IL/104",
        category: "מוצרים משלימים", complementary: true, priceOnRequest: true,
        title: "סט מקלדת ועכבר אלחוטי ASUS CW101 — דק ושקט, HEB/EN",
        price: 0, stock: 0, threshold: 5,
        image: "https://cdata.b-cdn.net/images/thumbs/0024204_asus-cw101-wireless-keyboard-mouse-set-slim-silent-design-enheb-24gh-1000dpi-blackcopilot_600.jpeg",
        description: "סט מקלדת ועכבר אלחוטי מבית ASUS בעיצוב דק ושקט. חיבור אלחוטי RF בתדר 2.4GHz בטווח עד 10 מטר, פריסת מקשים עברית/אנגלית, עכבר ברזולוציית 1000dpi ותאימות ל-Windows 8 ומעלה. צבע שחור.",
        specs: [
            { label: "סוג", value: "סט מקלדת ועכבר אלחוטי" },
            { label: "ממשק", value: "Wireless RF 2.4GHz" },
            { label: "טווח", value: "עד 10 מטר" },
            { label: "רזולוציית עכבר", value: "1000dpi" },
            { label: "פריסת מקשים", value: "עברית / אנגלית" },
            { label: "עיצוב", value: "דק ושקט (Slim & Silent)" },
            { label: "תאימות", value: "Windows 8 / 10 / 11 ומעלה" },
            { label: "צבע", value: "שחור" },
            { label: "מק\"ט", value: "CW101 KEYBOARD+MOUSE/BK/IL/104" }
        ]
    },
    {
        id: "hp-235", brand: "HP", model: "235", sku: "1Y4D0UT#ABT",
        category: "מוצרים משלימים", complementary: true, priceOnRequest: true,
        title: "סט מקלדת ועכבר אלחוטי HP 235 — 2.4GHz",
        price: 0, stock: 0, threshold: 5,
        image: "https://cdata.b-cdn.net/images/thumbs/0019664_hp-235-wireless-mouse-and-keyboard-combo_600.jpeg",
        description: "סט מקלדת ועכבר אלחוטי מבית HP. חיבור אלחוטי בתדר 2.4GHz בטווח עד 10 מטר, בעיצוב נקי וצבע שחור. מתאים לעבודה משרדית יומיומית.",
        specs: [
            { label: "סוג", value: "סט מקלדת ועכבר אלחוטי" },
            { label: "תדר", value: "2.4GHz" },
            { label: "טווח", value: "עד 10 מטר" },
            { label: "צבע", value: "שחור" },
            { label: "מק\"ט", value: "1Y4D0UT#ABT" }
        ]
    },
    {
        id: "asus-cw100", brand: "ASUS", model: "CW100", sku: "ACCY CW100",
        category: "מוצרים משלימים", complementary: true, priceOnRequest: true,
        title: "סט מקלדת ועכבר אלחוטי ASUS CW100 — HEB/ENG",
        price: 0, stock: 0, threshold: 5,
        image: "https://cdata.b-cdn.net/images/thumbs/0016694_cw100-keyboardmousebk-hebeng-wireless_600.jpeg",
        description: "סט מקלדת ועכבר אלחוטי מבית ASUS. חיבור אלחוטי בתדר 2.4GHz בטווח עד 10 מטר, פריסת מקשים עברית/אנגלית ותאימות ל-Windows 8 ומעלה. צבע שחור.",
        specs: [
            { label: "סוג", value: "סט מקלדת ועכבר אלחוטי" },
            { label: "ממשק", value: "Wireless RF 2.4GHz" },
            { label: "טווח", value: "עד 10 מטר" },
            { label: "פריסת מקשים", value: "עברית / אנגלית" },
            { label: "תאימות", value: "Windows 8 / 10 ומעלה" },
            { label: "מידות מקלדת", value: "445×133×26.8 מ\"מ" },
            { label: "מידות עכבר", value: "112.5×60×36.7 מ\"מ" },
            { label: "צבע", value: "שחור" },
            { label: "מק\"ט", value: "ACCY CW100" }
        ]
    }
];

export default defaultProducts;
