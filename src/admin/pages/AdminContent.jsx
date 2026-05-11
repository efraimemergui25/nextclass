import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { 
    AdminSectionHeader, 
    AdminInput, 
    AdminTextArea, 
    AdminToggle, 
    AdminButton 
} from '../components/AdminComponents';
import { 
    Eye, 
    Layout, 
    Type, 
    Image as ImageIcon, 
    Search, 
    ShoppingCart, 
    Plus, 
    Trash2, 
    Save, 
    RotateCcw,
    ChevronRight,
    ArrowRightLeft
} from 'lucide-react';

const LS_KEY = 'nextclass_cms_settings';

const VISIBILITY_ITEMS = [
    { key: 'vis_hero',            label: 'באנר ראשי (Hero)',       desc: 'הצגת הכותרת והתמונה הראשית', icon: '🏠' },
    { key: 'vis_trust_bar',       label: 'שורת לוגואים (Trust)',   desc: 'הצגת לוגואים של מוסדות', icon: '🤝' },
    { key: 'vis_value_props',     label: 'יתרונות הפלטפורמה',       desc: 'קטע ה-Value Props והנתונים', icon: '⭐' },
    { key: 'vis_featured_products', label: 'מוצרים מומלצים',         desc: 'סקציית המלצות בתחתית דף הבית', icon: '✨' },
    { key: 'vis_testimonials',    label: 'עדויות לקוחות',           desc: 'סקציית חוות דעת וציטוטים', icon: '💬' },
    { key: 'vis_announcement_bar', label: 'בר הכרזות עליון',        desc: 'הסרגל שמופיע מעל ה-Header', icon: '📣' },
    { key: 'vis_about_page',      label: 'עמוד "הסיפור שלנו"',      desc: 'הפעלה/השבתה של עמוד האודות', icon: '📖' },
    { key: 'vis_vod_page',        label: 'מרכז ההדרכה (VOD)',      desc: 'הפעלה/השבתה של ספריית הסרטונים', icon: '🎬' },
    { key: 'vis_magazine',        label: 'מגזין חדשנות',           desc: 'הפעלה/השבתה של בלוג האתר', icon: '📰' },
    { key: 'vis_compare_page',    label: 'עמוד השוואת דגמים',       desc: 'הפעלה/השבתה של כלי ההשוואה', icon: '⚖️' },
    { key: 'vis_ai_assistant',    label: 'עוזר אישי (AI)',         desc: 'הפעלה/השבתה של הווידג׳ט הצף', icon: '🤖' },
];

const FIELD_SECTIONS = [
    {
        id: 'branding',
        label: 'זהות ומיתוג',
        icon: '🎨',
        accent: '#5856D6',
        fields: [
            { key: 'site_name',         label: 'שם האתר',             type: 'text',     default: 'NextClass' },
            { key: 'site_logo_url',     label: 'לוגו (URL)',          type: 'text',     default: '' },
            { key: 'site_tagline',      label: 'סלוגן ראשי (Footer)',  type: 'textarea', default: 'אנחנו מעצבים את הכלים שמעצימים את דור המחר. חדשנות, איכות וחזון בכל כיתה.' },
            { key: 'announcement_text',  label: 'בר הכרזות',           type: 'text',     default: '' },
            { key: 'allow_orders',       label: 'אפשר הזמנות באתר',      type: 'boolean',  default: true },
            { key: 'maintenance_mode',   label: 'מצב תחזוקה',           type: 'boolean',  default: false },
            { key: 'maintenance_title',  label: 'כותרת תחזוקה',         type: 'text',     default: 'האתר בתחזוקה' },
            { key: 'maintenance_msg',    label: 'הודעת תחזוקה',         type: 'textarea', default: 'אנחנו משפרים את החוויה עבורכם. נחזור בקרוב.' },
        ],
    },
    {
        id: 'header',
        label: 'ניווט (Header)',
        icon: '🧭',
        accent: '#007AFF',
        fields: [
            { key: 'nav_home',          label: 'בית',                 type: 'text',     default: 'דף הבית' },
            { key: 'nav_catalog',       label: 'קטלוג',               type: 'text',     default: 'המוצרים שלנו' },
            { key: 'nav_compare',       label: 'השוואה',              type: 'text',     default: 'השוואת דגמים' },
            { key: 'nav_about',         label: 'סיפורנו',             type: 'text',     default: 'הסיפור שלנו' },
            { key: 'nav_vod',           label: 'הדרכה',               type: 'text',     default: 'מרכז הדרכה' },
            { key: 'nav_magazine',      label: 'מגזין',               type: 'text',     default: 'מגזין' },
            { key: 'nav_contact',       label: 'קשר',                 type: 'text',     default: 'צור קשר' },
            { key: 'nav_mega_hint',     label: 'רמז מגה-מניו',         type: 'text',     default: 'לחץ לצפייה בדגמים' },
            { key: 'nav_mega_all',      label: 'כפתור "כל הקטלוג"',    type: 'text',     default: 'לכל קטלוג הפתרונות' },
            { key: 'aria_cart',         label: 'עגלה (Aria)',          type: 'text',     default: 'עגלת קניות' },
            { key: 'aria_search',       label: 'חיפוש (Aria)',         type: 'text',     default: 'חיפוש' },
            { key: 'aria_menu',         label: 'תפריט (Aria)',         type: 'text',     default: 'תפריט' },
            { key: 'aria_back',         label: 'חזור (Aria)',          type: 'text',     default: 'חזור' },
        ],
    },
    {
        id: 'hero',
        label: 'עמוד בית — Hero',
        icon: '🏠',
        accent: '#007AFF',
        fields: [
            { key: 'hero_eyebrow',      label: 'תווית עליונה',         type: 'text',     default: 'הדור הבא של טכנולוגיה לחינוך' },
            { key: 'hero_headline',     label: 'כותרת ראשית',         type: 'text',     default: 'חדשנות חסרת פשרות.' },
            { key: 'hero_subline',      label: 'כותרת משנה',          type: 'text',     default: 'מקצוענות בכל מרחב למידה.' },
            { key: 'hero_description',  label: 'תיאור',               type: 'textarea', default: 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.' },
            { key: 'hero_cta',          label: 'כפתור פעולה',         type: 'text',     default: 'גלו את הפתרונות שלנו' },
            { key: 'hero_bg_image',     label: 'תמונת רקע (URL)',      type: 'text',     default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80' },
        ],
    },
    {
        id: 'homepage_sections',
        label: 'עמוד בית — סקציות',
        icon: '🧱',
        accent: '#FF9500',
        fields: [
            { key: 'sp_label',          label: 'כותרת מוסדות',         type: 'text',     default: 'נבחר על ידי מעל 500 מוסדות חינוך ועיריות מובילות' },
            { key: 'sp_clients',        label: 'רשימת מוסדות (פסיק)',  type: 'textarea', default: 'משרד החינוך, רשת אורט, עיריית תל אביב, אוניברסיטת אריאל, רשת עמל' },
            { key: 'vp_title',          label: 'כותרת יתרונות',        type: 'text',     default: 'סטנדרט חדש של שירות למוסדות חינוך' },
            { key: 'eco_title',         label: 'כותרת אקוסיסטם',       type: 'text',     default: 'למידה שיוצאת מהמסגרת' },
            { key: 'eco_desc',          label: 'תיאור אקוסיסטם',       type: 'textarea', default: 'חקור את אקו-סיסטם הלמידה השלם שלנו. פתרונות שמשתלבים אחד בשני ליצירת חוויה פדגוגית חלקה.' },
            { key: 'eco_eyebrow',       label: 'תווית עליונה',         type: 'text',     default: 'האקוסיסטם שלנו' },
            { key: 'eco_hint',          label: 'הערת לחיצה',           type: 'text',     default: 'לחץ על הנקודות הכחולות' },
            { key: 'eco_bg_image',      label: 'תמונת רקע (URL)',      type: 'text',     default: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=85&w=1600' },
            { key: 'eco_added',         label: 'תווית "נוסף"',          type: 'text',     default: 'נוסף' },
            { key: 'eco_remove',        label: 'תווית "הסר"',           type: 'text',     default: 'הסר מהעגלה' },
            { key: 'eco_add',           label: 'תווית "הוסף"',          type: 'text',     default: 'הוסף' },
            { key: 'eco_more_info',     label: 'לינק "פרטים נוספים"',    type: 'text',     default: 'פרטים נוספים ←' },
            { key: 'qw_title',          label: 'כותרת אשף הצעות',       type: 'text',     default: 'בונים לכם הצעת מחיר בדקה' },
            { key: 'qw_desc',           label: 'תיאור אשף הצעות',       type: 'textarea', default: 'ענו על שתי שאלות קצרות ונתאים לכם חבילה מושלמת.' },
            { key: 'expert_title',      label: 'כותרת ייעוץ מומחה',     type: 'text',     default: 'בואו נרכיב יחד את הפתרון המושלם למוסד שלכם.' },
        ],
    },
    {
        id: 'catalog_full',
        label: 'קטלוג וסינון',
        icon: '🛍️',
        accent: '#5856D6',
        fields: [
            { key: 'catalog_title',     label: 'כותרת הקטלוג',        type: 'text',     default: 'הכלים שמעצבים את המחר.' },
            { key: 'catalog_subtitle',  label: 'תיאור הקטלוג',        type: 'textarea', default: 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.' },
            { key: 'catalog_filter_btn', label: 'כפתור סינון',         type: 'text',     default: 'סינון מתקדם' },
            { key: 'catalog_filter_sub', label: 'תיאור חלונית סינון',   type: 'text',     default: 'התאימו את הקטלוג לצרכים שלכם' },
            { key: 'catalog_sort_label', label: 'תווית מיון',          type: 'text',     default: 'מיון לפי' },
            { key: 'catalog_sort_rel',   label: 'מיון: רלוונטיות',      type: 'text',     default: 'רלוונטיות' },
            { key: 'catalog_sort_pasc',  label: 'מיון: מחיר (נמוך-גבוה)', type: 'text',     default: 'מחיר: מהנמוך לגבוה' },
            { key: 'catalog_sort_pdesc', label: 'מיון: מחיר (גבוה-נמוך)', type: 'text',     default: 'מחיר: מהגבוה לנמוך' },
            { key: 'catalog_sort_name',  label: 'מיון: שם (א-ת)',       type: 'text',     default: 'שם המוצר (א-ת)' },
            { key: 'catalog_price_label', label: 'תווית טווח מחירים',    type: 'text',     default: 'טווח מחיר (₪)' },
            { key: 'catalog_empty_msg', label: 'הודעת אין תוצאות',      type: 'text',     default: 'לא נמצאו מוצרים' },
            { key: 'catalog_empty_hint', label: 'רמז "נסה שנית"',        type: 'text',     default: 'נסה קטגוריה אחרת' },
            { key: 'catalog_all_cat',    label: 'שם קטגוריית "הכל"',     type: 'text',     default: 'הכל' },
            { key: 'catalog_search_hint', label: 'רמז חיפוש',          type: 'text',     default: 'חפש בין מאות פתרונות...' },
            { key: 'catalog_inst_price', label: 'תווית מחיר מוסדי',      type: 'text',     default: 'מחיר מוסדי' },
            { key: 'catalog_categories', label: 'קטגוריות (פסיק)',      type: 'textarea', default: 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה' },
        ],
    },
    {
        id: 'product_detail',
        label: 'דף מוצר',
        icon: '📦',
        accent: '#FF9500',
        fields: [
            { key: 'pd_home',           label: 'לחם פירורים: בית',      type: 'text',     default: 'ראשי' },
            { key: 'pd_catalog',        label: 'לחם פירורים: קטלוג',    type: 'text',     default: 'קטלוג' },
            { key: 'pd_buy_now',        label: 'כפתור קנה עכשיו',       type: 'text',     default: 'קנה עכשיו' },
            { key: 'pd_add_cart',       label: 'כפתור הוסף לסל',        type: 'text',     default: 'הוסף לעגלה' },
            { key: 'pd_request_quote',  label: 'כפתור הצעת מחיר',       type: 'text',     default: 'שלח פנייה וקבל הצעה' },
            { key: 'pd_request_quote_inst', label: 'הצעת מחיר מוסדית',  type: 'text',     default: 'בקש הצעת מחיר מוסדית' },
            { key: 'pd_quick_inquiry',  label: 'כפתור פנייה מהירה',     type: 'text',     default: 'שלח פנייה מהירה' },
            { key: 'pd_specs_title',    label: 'כותרת מפרט',           type: 'text',     default: 'מפרט טכני' },
            { key: 'pd_specs_desc',     label: 'תיאור מפרט',           type: 'textarea', default: 'הפרטים המדויקים שהופכים את המערכת הזו למובילה מסוגה.' },
            { key: 'pd_acc_title',      label: 'כותרת אביזרים',         type: 'text',     default: 'השלם את המערכת שלך' },
            { key: 'pd_acc_optional',   label: 'תווית אופציונלי',       type: 'text',     default: 'אופציונלי' },
            { key: 'pd_success_msg',    label: 'הודעת הוספה לסל',       type: 'text',     default: 'נוסף לסל בהצלחה' },
            { key: 'pd_added',          label: 'תווית "נוסף"',          type: 'text',     default: 'נוסף' },
            { key: 'pd_remove',         label: 'תווית "הסר"',           type: 'text',     default: 'הסר' },
            { key: 'pd_remove_from_cart', label: 'הודעת הסרה מהסל',     type: 'text',     default: 'הסר מהעגלה' },
            { key: 'pd_not_found',      label: 'הודעת מוצר לא נמצא',    type: 'text',     default: 'המוצר לא נמצא.' },
            { key: 'pd_contact_for_price', label: 'צור קשר למחיר',      type: 'text',     default: 'צור קשר להצעת מחיר' },
            { key: 'pd_color_label',    label: 'בחירת צבע',            type: 'text',     default: 'בחירת צבע' },
            { key: 'pd_compare_btn',    label: 'כפתור השוואה',         type: 'text',     default: 'השווה דגם' },
            { key: 'pd_compare_selected', label: 'נבחר להשוואה',        type: 'text',     default: 'נבחר להשוואה' },
        ],
    },
    {
        id: 'sidebar_sections',
        label: 'סרגל ניווט מוצר',
        icon: '📋',
        accent: '#5856D6',
        fields: [
            { key: 'sidebar_label_features', label: 'תווית: תכונות בולטות',      type: 'text', default: 'תכונות בולטות' },
            { key: 'sidebar_label_dims',     label: 'תווית: מידות המוצר',         type: 'text', default: 'מידות המוצר' },
            { key: 'sidebar_label_specs',    label: 'תווית: מפרט טכני',           type: 'text', default: 'מפרט טכני' },
            { key: 'sidebar_label_warranty', label: 'תווית: תנאי רכישה ואחריות',  type: 'text', default: 'תנאי רכישה ואחריות' },
            { key: 'sidebar_label_support',  label: 'תווית: שירות ותמיכה',         type: 'text', default: 'שירות ותמיכה' },
            { key: 'sidebar_label_faq',      label: 'תווית: שאלות נפוצות',        type: 'text', default: 'שאלות נפוצות' },
            { key: 'sidebar_label_reviews',  label: 'תווית: חוות דעת',            type: 'text', default: 'חוות דעת' },
        ],
    },
    {
        id: 'pd_warranty_section',
        label: 'אחריות ורכישה (מוצר)',
        icon: '🛡️',
        accent: '#007AFF',
        fields: [
            { key: 'pd_warranty_title',      label: 'כותרת קטע אחריות',      type: 'text',     default: 'תנאי רכישה ואחריות' },
            { key: 'pd_warranty_text',       label: 'טקסט תנאים',             type: 'textarea', default: 'המוצר מגיע עם אחריות יצרן מלאה לשנה אחת. NextClass מציעה שירות תיקונים מקצועי ותמיכה טכנית לאורך כל תקופת האחריות. ניתן להארכת אחריות ל-3 שנים בתשלום נוסף. כל המוצרים עוברים בדיקת איכות קפדנית לפני המשלוח.' },
            { key: 'pd_warranty_badge1',     label: 'תג 1: כותרת',            type: 'text',     default: 'אחריות יצרן' },
            { key: 'pd_warranty_badge1_sub', label: 'תג 1: פרט',              type: 'text',     default: '12 חודשים' },
            { key: 'pd_warranty_badge2',     label: 'תג 2: כותרת',            type: 'text',     default: 'תיקון חינם' },
            { key: 'pd_warranty_badge2_sub', label: 'תג 2: פרט',              type: 'text',     default: 'כולל חלפים' },
            { key: 'pd_warranty_badge3',     label: 'תג 3: כותרת',            type: 'text',     default: 'החלפת מוצר' },
            { key: 'pd_warranty_badge3_sub', label: 'תג 3: פרט',              type: 'text',     default: 'תוך 30 יום' },
        ],
    },
    {
        id: 'pd_support_section',
        label: 'שירות ותמיכה (מוצר)',
        icon: '🎧',
        accent: '#34C759',
        fields: [
            { key: 'pd_support_title',       label: 'כותרת קטע תמיכה',       type: 'text', default: 'שירות ותמיכה' },
            { key: 'pd_support_phone_label', label: 'תווית כפתור טלפון',      type: 'text', default: 'תמיכה טלפונית' },
            { key: 'pd_support_email_label', label: 'תווית כפתור מייל',       type: 'text', default: 'שלח מייל' },
            { key: 'pd_support_wa_label',    label: 'תווית כפתור וואטסאפ',    type: 'text', default: 'וואטסאפ' },
            { key: 'pd_support_wa_value',    label: 'שעות זמינות וואטסאפ',    type: 'text', default: 'זמינים 9:00–21:00' },
        ],
    },
    {
        id: 'pd_faq_section',
        label: 'שאלות נפוצות (מוצר)',
        icon: '❓',
        accent: '#5856D6',
        fields: [
            { key: 'pd_faq_title', label: 'כותרת קטע שאלות',  type: 'text',     default: 'שאלות נפוצות' },
            { key: 'pd_faq_q1',   label: 'שאלה 1',            type: 'text',     default: 'מהו זמן האספקה הצפוי?' },
            { key: 'pd_faq_a1',   label: 'תשובה 1',           type: 'textarea', default: 'אספקה תוך 3–7 ימי עסקים לרוב האזורים בישראל. הזמנות גדולות (מוסדי) עשויות לקחת עד 14 יום.' },
            { key: 'pd_faq_q2',   label: 'שאלה 2',            type: 'text',     default: 'האם ניתן לקבל הצעת מחיר מוסדית?' },
            { key: 'pd_faq_a2',   label: 'תשובה 2',           type: 'textarea', default: 'כן! מלאו את טופס יצירת הקשר או התקשרו אלינו ישירות לקבלת הצעת מחיר מותאמת לבית ספרכם.' },
            { key: 'pd_faq_q3',   label: 'שאלה 3',            type: 'text',     default: 'מה כולל שירות ההתקנה?' },
            { key: 'pd_faq_a3',   label: 'תשובה 3',           type: 'textarea', default: 'שירות ההתקנה כולל: הרכבה מלאה, הגדרת רשת, הדרכת צוות ופתרון בעיות ראשוני.' },
            { key: 'pd_faq_q4',   label: 'שאלה 4 (אופציונלי)', type: 'text',     default: '' },
            { key: 'pd_faq_a4',   label: 'תשובה 4 (אופציונלי)', type: 'textarea', default: '' },
            { key: 'pd_faq_q5',   label: 'שאלה 5 (אופציונלי)', type: 'text',     default: '' },
            { key: 'pd_faq_a5',   label: 'תשובה 5 (אופציונלי)', type: 'textarea', default: '' },
        ],
    },
    {
        id: 'pd_reviews_section',
        label: 'ביקורות לקוחות (מוצר)',
        icon: '⭐',
        accent: '#FF9500',
        fields: [
            { key: 'pd_reviews_title', label: 'כותרת קטע ביקורות',   type: 'text', default: 'חוות דעת' },
            { key: 'pd_reviews_avg',   label: 'ממוצע דירוג (1–5)',    type: 'text', default: '4.8' },
            { key: 'pd_reviews_count', label: 'מספר ביקורות',         type: 'text', default: '24' },
            { key: 'pd_review1_name',  label: 'ביקורת 1 — שם',        type: 'text',     default: 'שרה כ.' },
            { key: 'pd_review1_role',  label: 'ביקורת 1 — תפקיד',     type: 'text',     default: 'מורה, חט"ב גבעתיים' },
            { key: 'pd_review1_stars', label: 'ביקורת 1 — כוכבים (1-5)', type: 'text',  default: '5' },
            { key: 'pd_review1_text',  label: 'ביקורת 1 — טקסט',      type: 'textarea', default: 'ממש שדרגנו את הכיתה! הנוחות והמהירות מדהימים, הילדים מעורבים הרבה יותר.' },
            { key: 'pd_review2_name',  label: 'ביקורת 2 — שם',        type: 'text',     default: 'דוד מ.' },
            { key: 'pd_review2_role',  label: 'ביקורת 2 — תפקיד',     type: 'text',     default: 'רכז טכנולוגיה, יסודי הרצליה' },
            { key: 'pd_review2_stars', label: 'ביקורת 2 — כוכבים (1-5)', type: 'text',  default: '5' },
            { key: 'pd_review2_text',  label: 'ביקורת 2 — טקסט',      type: 'textarea', default: 'התמיכה של NextClass מעולה. התקנה מהירה, ממשק ידידותי, ממליץ בחום.' },
            { key: 'pd_review3_name',  label: 'ביקורת 3 — שם',        type: 'text',     default: 'מיכל ל.' },
            { key: 'pd_review3_role',  label: 'ביקורת 3 — תפקיד',     type: 'text',     default: 'מנהלת בית ספר' },
            { key: 'pd_review3_stars', label: 'ביקורת 3 — כוכבים (1-5)', type: 'text',  default: '4' },
            { key: 'pd_review3_text',  label: 'ביקורת 3 — טקסט',      type: 'textarea', default: 'השקענו בכמה מוצרים של NextClass השנה — כולם ממליצים. איכות ומחיר מעולים.' },
        ],
    },
    {
        id: 'cart_checkout',
        label: 'עגלה וקופה',
        icon: '🛒',
        accent: '#FF3B30',
        fields: [
            { key: 'cart_title',        label: 'כותרת העגלה',           type: 'text',     default: 'עגלת הרכש שלך' },
            { key: 'cart_empty_title',  label: 'עגלה ריקה',             type: 'text',     default: 'העגלה שלך ריקה' },
            { key: 'cart_summary_title', label: 'כותרת סיכום',          type: 'text',     default: 'סיכום הזמנה' },
            { key: 'cart_subtotal_label', label: 'סיכום ביניים',        type: 'text',     default: 'סיכום ביניים' },
            { key: 'cart_total_label',  label: 'סה״כ לתשלום',           type: 'text',     default: 'סה״כ לתשלום' },
            { key: 'cart_checkout_btn', label: 'כפתור לקופה',           type: 'text',     default: 'המשך לקופה' },
            { key: 'check_title',       label: 'כותרת קופה',            type: 'text',     default: 'סיום קנייה' },
            { key: 'check_subtitle',    label: 'תיאור קופה',            type: 'text',     default: 'בוא נסיים את ההזמנה שלך ונתחיל לעבוד.' },
            { key: 'check_shipping_title', label: 'כותרת פרטי משלוח',    type: 'text',     default: 'פרטי משלוח' },
            { key: 'check_pay_now',     label: 'כפתור שלם עכשיו',       type: 'text',     default: 'שלח פנייה ושלם' },
            { key: 'check_fname',       label: 'שדה שם פרטי',           type: 'text',     default: 'שם פרטי' },
            { key: 'check_lname',       label: 'שדה שם משפחה',          type: 'text',     default: 'שם משפחה' },
            { key: 'check_city',        label: 'שדה עיר',               type: 'text',     default: 'עיר' },
            { key: 'check_street',      label: 'שדה רחוב',              type: 'text',     default: 'רחוב ומספר בית' },
            { key: 'check_phone_label',  label: 'שדה טלפון',             type: 'text',     default: 'טלפון' },
            { key: 'check_email_label',  label: 'שדה אימייל',            type: 'text',     default: 'אימייל' },
            { key: 'check_payment_title', label: 'כותרת אמצעי תשלום',    type: 'text',     default: 'אמצעי תשלום' },
            { key: 'check_credit_card',  label: 'כפתור אשראי',           type: 'text',     default: 'אשראי' },
            { key: 'check_cc_num',      label: 'שדה מספר כרטיס',        type: 'text',     default: 'מספר כרטיס' },
            { key: 'check_cc_exp',      label: 'שדה תוקף אשראי',        type: 'text',     default: 'תוקף' },
            { key: 'check_cc_cvv',      label: 'שדה CVV',               type: 'text',     default: 'CVV' },
        ],
    },
    {
        id: 'ai_assistant',
        label: 'העוזר החכם (AI)',
        icon: '🤖',
        accent: '#007AFF',
        fields: [
            { key: 'ai_fab_label',      label: 'תווית כפתור צף',       type: 'text',     default: 'העוזר החכם' },
            { key: 'ai_title',          label: 'כותרת חלון',          type: 'text',     default: 'NextClass AI' },
            { key: 'ai_role',           label: 'תפקיד העוזר',          type: 'text',     default: 'Institutional Concierge' },
            { key: 'ai_greeting_home',  label: 'הודעת פתיחה (בית)',     type: 'textarea', default: 'שלום! אני הקונסיירז׳ של NextClass. איך אוכל לעזור לכם היום?' },
            { key: 'ai_greeting_pd',    label: 'הודעת פתיחה (מוצר)',    type: 'textarea', default: 'שלום! האם תרצו לקבל מפרט טכני מלא או הצעת מחיר למוסד שלכם?' },
            { key: 'ai_placeholder',    label: 'טקסט בשורת הקלדה',     type: 'text',     default: 'מה תרצו לבדוק?' },
            { key: 'ai_wa_label',       label: 'מענה אנושי (כותרת)',    type: 'text',     default: 'מענה אנושי בוואטסאפ' },
            { key: 'ai_wa_status',      label: 'סטטוס וואטסאפ',        type: 'text',     default: 'יועץ טכנולוגי זמין כעת ✅' },
            { key: 'ai_chip1',          label: 'צ׳יפ מהיר 1',          type: 'text',     default: 'הצעת מחיר' },
            { key: 'ai_chip2',          label: 'צ׳יפ מהיר 2',          type: 'text',     default: 'מפרט טכני' },
            { key: 'ai_chip3',          label: 'צ׳יפ מהיר 3',          type: 'text',     default: 'ייעוץ' },
        ],
    },
    {
        id: 'contact_page',
        label: 'צור קשר',
        icon: '📞',
        accent: '#34C759',
        fields: [
            { key: 'contact_hero_title', label: 'כותרת ראשית',        type: 'text',     default: 'הכיתה שלכם מחכה. בואו נתחיל.' },
            { key: 'contact_hero_subtitle', label: 'תיאור עליון',      type: 'textarea', default: 'אנחנו כאן בשבילכם — מהייעוץ הראשון ועד אחרי ההתקנה.' },
            { key: 'contact_concierge_title', label: 'כותרת ייעוץ אישי', type: 'text',     default: 'ייעוץ אישי ומיידי' },
            { key: 'contact_concierge_desc', label: 'תיאור ייעוץ אישי',  type: 'textarea', default: 'נציג מקצועי מחכה לכם עכשיו כדי לאפיין את הפתרון המדויק למוסד שלכם.' },
            { key: 'contact_form_title', label: 'כותרת טופס',          type: 'text',     default: 'בואו נצא לדרך.' },
            { key: 'contact_form_btn',   label: 'כפתור שליחה',         type: 'text',     default: 'שלח פנייה' },
            { key: 'contact_success_title', label: 'כותרת הצלחה',      type: 'text',     default: 'הפנייה התקבלה' },
            { key: 'contact_success_msg', label: 'הודעת הצלחה',        type: 'textarea', default: 'הצוות שלנו כבר מעבד את הבקשה שלך. נחזור אליך תוך פחות מ-24 שעות.' },
            { key: 'contact_label_name', label: 'תווית: שם',           type: 'text',     default: 'שם מלא' },
            { key: 'contact_label_inst', label: 'תווית: מוסד',         type: 'text',     default: 'מוסד / חברה' },
            { key: 'contact_label_msg',  label: 'תווית: הודעה',        type: 'text',     default: 'איך נוכל לעזור?' },
            { key: 'contact_trust_title', label: 'כותרת שותפות',       type: 'text',     default: 'שותפות ארוכת טווח' },
            { key: 'contact_trust_desc', label: 'תיאור שותפות',        type: 'textarea', default: 'אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך.' },
            { key: 'contact_phone',      label: 'טלפון',               type: 'text',     default: '03-9999999' },
            { key: 'contact_email',      label: 'מייל',                type: 'text',     default: 'info@nextclass.co.il' },
            { key: 'contact_address',    label: 'כתובת',               type: 'text',     default: 'תל אביב, ישראל' },
            { key: 'contact_hours',      label: 'שעות פעילות',         type: 'text',     default: 'ראשון–חמישי 08:00–18:00' },
            { key: 'contact_wa_label',   label: 'תווית וואטסאפ',       type: 'text',     default: 'זמינים ב-WhatsApp' },
            { key: 'contact_wa_btn',     label: 'כפתור וואטסאפ',       type: 'text',     default: 'התחל שיחה עכשיו' },
            { key: 'contact_time_hint',  label: 'הערת זמן נוכחי',       type: 'text',     default: 'זמן נוכחי במטה בתל אביב: ' },
        ],
    },
    {
        id: 'about_page',
        label: 'אודות',
        icon: '📖',
        accent: '#AF52DE',
        fields: [
            { key: 'about_hero_label',   label: 'תווית עליונה',        type: 'text',     default: 'הסיפור של NextClass' },
            { key: 'about_hero_title',   label: 'כותרת ראשית',        type: 'text',     default: 'חינוך חכם. מוגדר מחדש.' },
            { key: 'about_hero_sub',     label: 'תיאור גיבור',         type: 'textarea', default: 'אנחנו לא רק מעצבים כיתות חכמות. אנחנו בונים את התשתית שעליה יצמח דור המנהיגים הבא של ישראל.' },
            { key: 'about_story_title',  label: 'כותרת הסיפור',        type: 'text',     default: 'הכל התחיל ב-2012. עם מסך אחד והרבה תסכול.' },
            { key: 'about_story_body',   label: 'גוף הסיפור',          type: 'textarea', default: 'NextClass מתמחה בפתרונות טכנולוגיים מובילים למוסדות חינוך ברחבי ישראל. אנחנו מאמינים שטכנולוגיה נכונה מעצימה מורים ומסייעת לכל תלמיד להגיע לפוטנציאל המלא שלו.' },
            { key: 'about_stat1_val',    label: 'נתון 1: ערך',         type: 'text',     default: '1200' },
            { key: 'about_stat1_label',  label: 'נתון 1: תווית',        type: 'text',     default: 'מוסדות חינוך' },
            { key: 'about_stat2_val',    label: 'נתון 2: ערך',         type: 'text',     default: '14' },
            { key: 'about_stat2_label',  label: 'נתון 2: תווית',        type: 'text',     default: 'שנות ניסיון' },
            { key: 'about_stat3_val',    label: 'נתון 3: ערך',         type: 'text',     default: '98' },
            { key: 'about_stat3_label',  label: 'נתון 3: תווית',        type: 'text',     default: '% שביעות רצון' },
            { key: 'about_founder_title', label: 'כותרת המייסד',        type: 'text',     default: 'ההצלחה נמדדת בשטח. לא בברושורים.' },
            { key: 'about_founder_message', label: 'הודעת המייסד',      type: 'textarea', default: 'כשבנינו את NextClass, החלטנו להפסיק לדבר על "פוטנציאל" ולהתחיל לדבר על תוצאות.' },
            { key: 'about_founder_name', label: 'שם המייסד',           type: 'text',     default: 'אמיר כהן' },
            { key: 'about_founder_role', label: 'תפקיד המייסד',         type: 'text',     default: 'מייסד ומנכ"ל NextClass' },
            { key: 'about_cta_title',    label: 'כותרת CTA',           type: 'text',     default: 'בואו נצייר את המחר ביחד.' },
            { key: 'about_cta_desc',     label: 'תיאור CTA',           type: 'textarea', default: 'אנחנו מחפשים את השותפים שמאמינים שחינוך הוא המשאב היקר ביותר שלנו. בואו נבנה משהו בלתי נשכח.' },
            { key: 'about_v1_title',     label: 'ערך 1: כותרת',        type: 'text',     default: 'מקצוענות ללא פשרות' },
            { key: 'about_v1_desc',      label: 'ערך 1: תיאור',        type: 'textarea', default: 'אנחנו לא מסתפקים ב"עובד". אנחנו מחפשים את השלמות בכל פיקסל ובכל קו קוד.' },
            { key: 'about_v2_title',     label: 'ערך 2: כותרת',        type: 'text',     default: 'חדשנות אנושית' },
            { key: 'about_v2_desc',      label: 'ערך 2: תיאור',        type: 'textarea', default: 'הטכנולוגיה היא רק הכלי. הלב הוא המורה. אנחנו מפתחים כלים שמעצימים את היכולת האנושית.' },
            { key: 'about_v3_title',     label: 'ערך 3: כותרת',        type: 'text',     default: 'שותפות אמת' },
            { key: 'about_v3_desc',      label: 'ערך 3: תיאור',        type: 'textarea', default: 'כשאתה בוחר בנו, אתה מקבל שותף לחיים. אנחנו שם בשבילך ברגעי השיא ובאתגרים.' },
            { key: 'about_journey_hint', label: 'רמז תחילת מסע',       type: 'text',     default: 'המסע שלנו מתחיל כאן' },
            { key: 'about_edu_badge',    label: 'תג משרד החינוך',      type: 'text',     default: 'מאושרת משרד החינוך' },
            { key: 'about_way_title',    label: 'כותרת "הדרך שעשינו"',  type: 'text',     default: 'הדרך שעשינו' },
            { key: 'about_way_desc',     label: 'תיאור "הדרך שעשינו"',  type: 'text',     default: 'עשור של פריצות דרך בחינוך הישראלי.' },
            { key: 'about_founder_label', label: 'תווית מסר מייסד',     type: 'text',     default: 'מילה אישית מהמייסד' },
            { key: 'about_values_title', label: 'כותרת ערכים',         type: 'text',     default: 'הערכים שמניעים אותנו' },
            { key: 'about_values_desc',  label: 'תיאור ערכים',          type: 'text',     default: 'הבסיס לכל החלטה, לכל מוצר ולכל קשר.' },
        ],
    },
    {
        id: 'footer_config',
        label: 'פוטר (Footer)',
        icon: '🦶',
        accent: '#8E8E93',
        fields: [
            { key: 'footer_copyright',  label: 'זכויות יוצרים',        type: 'text',     default: '© 2026 NextClass. כל הזכויות שמורות.' },
            { key: 'footer_love_msg',   label: 'הודעת סיום',           type: 'text',     default: 'נבנה באהבה לחינוך' },
            { key: 'footer_col1_title', label: 'כותרת עמודה 1',        type: 'text',     default: 'פתרונות' },
            { key: 'footer_col1_items', label: 'פריטי עמודה 1 (פסיק)',  type: 'textarea', default: 'מסכים חכמים, מחשוב וטאבלטים, מעבדות STEM, תשתיות למידה' },
            { key: 'footer_col2_title', label: 'כותרת עמודה 2',        type: 'text',     default: 'האקדמיה' },
            { key: 'footer_col2_items', label: 'פריטי עמודה 2 (פסיק)',  type: 'textarea', default: 'מרכז עזרה, מדריכי וידאו, בלוג חדשנות, תמיכה טכנית' },
            { key: 'footer_col3_title', label: 'כותרת עמודה 3',        type: 'text',     default: 'קשר' },
            { key: 'footer_privacy',    label: 'לינק פרטיות',          type: 'text',     default: 'Privacy' },
            { key: 'footer_terms',      label: 'לינק תנאים',           type: 'text',     default: 'Terms' },
            { key: 'footer_location',   label: 'תווית מיקום/שפה',      type: 'text',     default: 'ISRAEL | HEBREW' },
        ],
    },
];

const ALL_SECTIONS = [
    { id: 'visibility', label: 'נראות רכיבים', icon: '👁️', accent: '#FF2D55', type: 'visibility' },
    { id: 'menu_reorder', label: 'סידור תפריט', icon: '↔️', accent: '#007AFF', type: 'menu_reorder' },
    ...FIELD_SECTIONS,
    { id: 'videos', label: 'ספריית VOD', icon: '🎬', accent: '#FF3B30', type: 'videos' },
];

// ── Shared UI Components ───────────────────────────────────────────────────

const AdminInputItem = ({ label, value, onChange, placeholder = "" }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right block">{label}</label>
        <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-[15px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all"
        />
    </div>
);

const AdminTextAreaItem = ({ label, value, onChange, rows = 3 }) => (
    <div className="space-y-2">
        <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right block">{label}</label>
        <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full px-5 py-4 bg-[#F5F5F7] border border-gray-100 rounded-2xl text-[15px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all resize-none"
        />
    </div>
);

const DEFAULT_NAV_ITEMS = [
    { id: 'home',     path: '/',         labelKey: 'nav_home',     defaultLabel: 'דף הבית',       visible: true },
    { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו', visible: true, isMega: true },
    { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים', visible: true },
    { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו',  visible: true },
    { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה',   visible: true },
    { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין',         visible: true },
    { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר',       visible: true },
];

const NAV_ICONS = { home: '🏠', catalog: '🛍️', compare: '⚖️', story: '📖', vod: '🎬', magazine: '📰', contact: '📞' };

const NavMenuManager = ({ showToast }) => {
    const { getSetting, updateGlobalSettings } = useSettings();

    const [items, setItems] = useState(() => {
        const saved = getSetting('nav_items', null);
        return Array.isArray(saved) ? saved : DEFAULT_NAV_ITEMS;
    });
    const itemsRef = React.useRef(items);

    useEffect(() => {
        const fromFirestore = getSetting('nav_items', null);
        if (Array.isArray(fromFirestore)) {
            setItems(fromFirestore);
            itemsRef.current = fromFirestore;
        }
    }, [getSetting]);

    const persist = async (newItems) => {
        try {
            await updateGlobalSettings({ nav_items: newItems });
            showToast('תפריט הניווט עודכן', 'success');
        } catch {
            showToast('שגיאה בשמירת התפריט', 'error');
        }
    };

    const handleReorder = (newItems) => {
        setItems(newItems);
        itemsRef.current = newItems;
    };

    const handleDragEnd = () => persist(itemsRef.current);

    const toggleVisibility = async (id) => {
        const newItems = items.map(item => item.id === id ? { ...item, visible: !item.visible } : item);
        setItems(newItems);
        itemsRef.current = newItems;
        await persist(newItems);
    };

    const handleReset = async () => {
        const reset = DEFAULT_NAV_ITEMS.map(d => ({ ...d, visible: true }));
        setItems(reset);
        itemsRef.current = reset;
        await persist(reset);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleReset} className="text-[11px] text-[#AEAEB2] hover:text-[#007AFF] transition-colors font-bold">
                    איפוס לברירת מחדל
                </button>
                <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right">
                    גרור לשינוי סדר • מתג להסתרה / הצגה
                </p>
            </div>
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item) => (
                    <Reorder.Item
                        key={item.id}
                        value={item}
                        onDragEnd={handleDragEnd}
                        style={{ opacity: item.visible === false ? 0.45 : 1, listStyle: 'none' }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing group hover:border-[#007AFF]/30 transition-colors select-none"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#AEAEB2" className="shrink-0 group-hover:fill-[#007AFF] transition-colors">
                            <rect x="3" y="3.5" width="10" height="1.5" rx="0.75" />
                            <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" />
                            <rect x="3" y="11" width="10" height="1.5" rx="0.75" />
                        </svg>
                        <span className="text-xl shrink-0">{NAV_ICONS[item.id] || '🔗'}</span>
                        <div className="flex-1 text-right">
                            <p className="text-sm font-bold text-[#1D1D1F]">{item.defaultLabel}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.path}</p>
                        </div>
                        <AdminToggle
                            value={item.visible !== false}
                            onChange={() => toggleVisibility(item.id)}
                        />
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
};

const FieldInput = ({ field, value, onChange }) => {
    if (field.type === 'textarea') {
        return <AdminTextArea label={field.label} value={value} onChange={onChange} rows={3} />;
    }
    if (field.type === 'boolean') {
        return <AdminToggle label={field.label} value={value} onChange={onChange} />;
    }
    return <AdminInput label={field.label} value={value} onChange={onChange} />;
};

const VisibilitySection = ({ content, onChange }) => (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {VISIBILITY_ITEMS.map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div className="text-right">
                        <p className="text-sm font-bold text-[#1D1D1F]">{item.label}</p>
                        <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                </div>
                <AdminToggle
                    value={content[item.key] !== undefined ? content[item.key] : true}
                    onChange={v => onChange(item.key, v)}
                />
            </div>
        ))}
    </div>
);

const VideosSection = ({ showToast }) => {
    const INITIAL_VIDEOS = [
        { id: 1, title: 'הדרכת מסכי CleverTouch', category: 'מסכים אינטראקטיביים', duration: '12:45', visible: true, thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=300' },
        { id: 2, title: 'הקמת מעבדת STEM מאפס', category: 'מעבדות', duration: '24:20', visible: true, thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=300' },
    ];
    const [videos, setVideos] = useState(INITIAL_VIDEOS);
    const toggleVideo = (id) => {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, visible: !v.visible } : v));
        showToast('סטטוס סרטון עודכן', 'success');
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
                {videos.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <img src={v.thumbnail} className="w-16 h-10 object-cover rounded-lg" alt="" />
                            <div className="text-right">
                                <p className="text-sm font-bold">{v.title}</p>
                                <p className="text-[10px] text-gray-400">{v.category} • {v.duration}</p>
                            </div>
                        </div>
                        <AdminToggle value={v.visible} onChange={() => toggleVideo(v.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function AdminContent({ showToast }) {
    const [activeSection, setActiveSection] = useState('visibility');
    const [content, setContent] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    const card = {
        boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.1)',
    };

    const { updateGlobalSettings } = useSettings();

    useEffect(() => {
        // We now rely on SettingsContext's settings for the initial state
        // but we keep a local copy for editing until "Save" is clicked.
        try {
            const savedData = localStorage.getItem(LS_KEY);
            if (savedData) setContent(JSON.parse(savedData));
            else {
                // Seed with defaults
                const defaults = {};
                FIELD_SECTIONS.forEach(s => s.fields.forEach(f => { defaults[f.key] = f.default; }));
                setContent(defaults);
            }
        } catch {}
    }, []);

    const handleChange = (key, value) => {
        setContent(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            // 1. Update Firestore (Global sync)
            await updateGlobalSettings(content);
            
            // 2. Update localStorage (Local sync/fallback)
            localStorage.setItem(LS_KEY, JSON.stringify(content));
            window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(content) }));
            
            setSaved(true);
            setHasChanges(false);
            showToast('כל השינויים נשמרו בסנכרון ענן מלא', 'success');
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            showToast('שגיאה בסנכרון הנתונים', 'error');
        }
    };

    const handleReset = (section) => {
        const updates = {};
        section.fields.forEach(f => { updates[f.key] = f.default; });
        setContent(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
        setSaved(false);
    };

    const currentDef = ALL_SECTIONS.find(s => s.id === activeSection);

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ניהול תוכן האתר"
                subtitle="כאן ניתן לערוך טקסטים, להציג או להסתיר רכיבים באתר ללא צורך בקוד"
                action={
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-[#FF9500] text-xs font-bold">
                                יש שינויים שטרם נשמרו
                            </motion.span>
                        )}
                        <AdminButton onClick={handleSave}>
                            {saved ? 'נשמר בהצלחה!' : 'שמור שינויים'}
                        </AdminButton>
                    </div>
                }
            />

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <div className="w-52 shrink-0">
                    <div className="bg-white rounded-[20px] overflow-hidden" style={card}>
                        {ALL_SECTIONS.map(s => (
                            <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-right transition-all border-b border-black/04 last:border-0"
                                style={{
                                    background: activeSection === s.id ? `${s.accent}10` : 'transparent',
                                    borderRight: activeSection === s.id ? `3px solid ${s.accent}` : '3px solid transparent',
                                }}>
                                <span className="text-base">{s.icon}</span>
                                <span className="text-sm font-bold flex-1 text-right"
                                    style={{ color: activeSection === s.id ? s.accent : '#6E6E73' }}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 bg-white rounded-[20px] overflow-hidden" style={card}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeSection === 'visibility' && (
                                <VisibilitySection content={content} onChange={handleChange} />
                            )}
                            {activeSection === 'menu_reorder' && (
                                <NavMenuManager showToast={showToast} />
                            )}
                            {activeSection === 'videos' && (
                                <VideosSection showToast={showToast} />
                            )}
                            {currentDef && currentDef.fields && (
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="text-right">
                                            <h3 className="text-xl font-black text-[#1D1D1F]">{currentDef.label}</h3>
                                            <p className="text-[#AEAEB2] text-xs mt-1">ערוך את שדות הטקסט והגדרות התוכן עבור {currentDef.label}</p>
                                        </div>
                                        <AdminButton variant="outline" size="sm" onClick={() => handleReset(currentDef)}>איפוס לברירת מחדל</AdminButton>
                                    </div>
                                    <div className="space-y-6">
                                        {currentDef.fields.map(field => (
                                            <FieldInput
                                                key={field.key}
                                                field={field}
                                                value={content[field.key] !== undefined ? content[field.key] : field.default}
                                                onChange={v => handleChange(field.key, v)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
