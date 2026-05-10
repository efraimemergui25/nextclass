/* eslint-disable */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminSectionHeader, AdminButton, AdminInput, AdminToggle, AdminTextArea } from '../components/AdminComponents';

const LS_KEY = 'nextclass_content';

// ── Mock data for parts that aren't purely text ──────────────────────────────
const INITIAL_VIDEOS = [
    { id: 1, title: 'מדריך למורה: הפעלת המעבדה בפעם הראשונה', duration: '03:45', thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'הדרכה' },
    { id: 2, title: 'חיבור מסך מגע לרשת בית ספרית', duration: '05:12', thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'רשת' },
    { id: 3, title: 'הגדרת EduEdit Studio בפעם הראשונה', duration: '07:30', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'תוכנה' },
    { id: 4, title: 'ניהול כיתה דיגיטלית עם Google Classroom', duration: '04:18', thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'תוכנה' },
    { id: 5, title: 'שימוש ב-20 נקודות מגע בו-זמנית', duration: '02:55', thumbnail: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'מסכים' },
    { id: 6, title: 'התקנת מעמד חשמלי מתכוונן', duration: '06:10', thumbnail: 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&q=80&w=600', videoUrl: '', visible: true, category: 'ריהוט' },
];

const VISIBILITY_ITEMS = [
    { key: 'vis_hero',            label: 'סקציית Hero (עמוד בית)',   desc: 'הכותרת הראשית עם האנימציה והCTA', icon: '🏠' },
    { key: 'vis_social_proof',    label: 'רצועת מוסדות',            desc: 'סרגל לוגואים של מוסדות שותפים', icon: '🏫' },
    { key: 'vis_catalog',         label: 'גריד מוצרים',             desc: 'רשת המוצרים בדף הבית', icon: '🛍️' },
    { key: 'vis_ecosystem',       label: 'ויז׳ואל אקוסיסטם',        desc: 'תרשים המערכת האינטראקטיבי', icon: '🌐' },
    { key: 'vis_shoppable',       label: 'תמונה אינטראקטיבית',      desc: 'תמונה קניה עם נקודות מוצר', icon: '🖼️' },
    { key: 'vis_quote_wizard',    label: 'אשף הצעת מחיר',           desc: 'כלי בניית הצעת המחיר המובנה', icon: '📋' },
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
            { key: 'announcement_text',  label: 'בר הכרזות',           type: 'text',     default: 'משלוחים חינם לכל רחבי הארץ' },
            { key: 'allow_orders',       label: 'אפשר הזמנות באתר',      type: 'boolean',  default: true },
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
        label: 'קטלוג וחיפוש',
        icon: '🛍️',
        accent: '#5856D6',
        fields: [
            { key: 'catalog_title',     label: 'כותרת הקטלוג',        type: 'text',     default: 'הכלים שמעצבים את המחר.' },
            { key: 'catalog_subtitle',  label: 'תיאור הקטלוג',        type: 'textarea', default: 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.' },
            { key: 'catalog_badge',     label: 'תווית עליונה',         type: 'text',     default: 'הקטלוג המוסדי' },
            { key: 'catalog_filter_btn', label: 'כפתור סינון',         type: 'text',     default: 'סינון מתקדם' },
            { key: 'catalog_sort_label', label: 'תווית מיון',          type: 'text',     default: 'מיון לפי' },
            { key: 'catalog_empty_msg', label: 'הודעת אין תוצאות',      type: 'text',     default: 'לא נמצאו מוצרים' },
            { key: 'catalog_empty_hint', label: 'רמז "נסה שנית"',        type: 'text',     default: 'נסה קטגוריה אחרת' },
            { key: 'catalog_all_cat',    label: 'שם קטגוריית "הכל"',     type: 'text',     default: 'הכל' },
            { key: 'catalog_search_hint', label: 'רמז חיפוש',          type: 'text',     default: 'חפש בין מאות פתרונות...' },
            { key: 'catalog_categories', label: 'קטגוריות (פסיק)',      type: 'textarea', default: 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה' },
            { key: 'catalog_tags',      label: 'תגיות (פסיק)',          type: 'textarea', default: 'תומך AI, מוקשח (Rugged), 4K UHD, אלחוטי, חיסכון בחשמל, Android 13, חינוך STEM' },
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
            { key: 'pd_specs_title',    label: 'כותרת מפרט',           type: 'text',     default: 'מפרט טכני' },
            { key: 'pd_acc_title',      label: 'כותרת אביזרים',         type: 'text',     default: 'השלם את המערכת שלך' },
            { key: 'pd_success_msg',    label: 'הודעת הוספה לסל',       type: 'text',     default: 'נוסף לסל בהצלחה' },
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
            { key: 'check_pay_now',     label: 'כפתור שלם עכשיו',       type: 'text',     default: 'שלח פנייה ושלם' },
            { key: 'check_fname',       label: 'שדה שם פרטי',           type: 'text',     default: 'שם פרטי' },
            { key: 'check_lname',       label: 'שדה שם משפחה',          type: 'text',     default: 'שם משפחה' },
            { key: 'check_city',        label: 'שדה עיר',               type: 'text',     default: 'עיר' },
            { key: 'check_street',      label: 'שדה רחוב',              type: 'text',     default: 'רחוב ומספר בית' },
            { key: 'check_phone_label',  label: 'שדה טלפון',             type: 'text',     default: 'טלפון' },
            { key: 'check_email_label',  label: 'שדה אימייל',            type: 'text',     default: 'אימייל' },
        ],
    },
    {
        id: 'ai_assistant',
        label: 'עוזר אישי (AI)',
        icon: '🤖',
        accent: '#007AFF',
        fields: [
            { key: 'ai_fab_label',      label: 'תווית כפתור צף',       type: 'text',     default: 'AI Assistant' },
            { key: 'ai_title',          label: 'כותרת חלון',          type: 'text',     default: 'NextClass Assistant' },
            { key: 'ai_role',           label: 'תפקיד העוזר',          type: 'text',     default: 'היועץ הטכנולוגי שלך' },
            { key: 'ai_greeting',       label: 'הודעת פתיחה',          type: 'textarea', default: 'שלום! אני כאן כדי לעזור לך לאפיין את הכיתה החכמה המושלמת. מה תרצה לדעת?' },
            { key: 'ai_placeholder',    label: 'טקסט בשורת הקלדה',     type: 'text',     default: 'שאל אותי על מסכי מגע, מעבדות או תשתיות...' },
            { key: 'ai_thinking',       label: 'הודעת "חושב"',         type: 'text',     default: 'מעבד את הבקשה שלך...' },
            { key: 'ai_suggestion_1',   label: 'הצעה 1',              type: 'text',     default: 'איך לבחור מסך מגע?' },
            { key: 'ai_suggestion_2',   label: 'הצעה 2',              type: 'text',     default: 'תמליץ לי על מחשב מורה' },
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
        id: 'footer_full',
        label: 'פוטר (Footer)',
        icon: '📄',
        accent: '#5856D6',
        fields: [
            { key: 'footer_col1_title', label: 'כותרת עמודה 1',        type: 'text',     default: 'פתרונות' },
            { key: 'footer_col1_items', label: 'פריטים עמודה 1 (פסיק)', type: 'textarea', default: 'מסכים חכמים, מחשוב וטאבלטים, מעבדות STEM, תשתיות למידה' },
            { key: 'footer_col2_title', label: 'כותרת עמודה 2',        type: 'text',     default: 'האקדמיה' },
            { key: 'footer_col2_items', label: 'פריטים עמודה 2 (פסיק)', type: 'textarea', default: 'מרכז עזרה, מדריכי וידאו, בלוג חדשנות, תמיכה טכנית' },
            { key: 'footer_col3_title', label: 'כותרת עמודה 3',        type: 'text',     default: 'קשר' },
            { key: 'footer_copyright',  label: 'זכויות יוצרים',         type: 'text',     default: '© 2026 NextClass. כל הזכויות שמורות.' },
            { key: 'footer_love_msg',   label: 'הצהרת "נבנה באהבה"',    type: 'text',     default: 'נבנה באהבה לחינוך' },
            { key: 'footer_privacy',    label: 'לינק פרטיות',           type: 'text',     default: 'Privacy' },
            { key: 'footer_terms',      label: 'לינק תנאי שימוש',        type: 'text',     default: 'Terms' },
            { key: 'footer_location',   label: 'מיקום ושפה',            type: 'text',     default: 'ISRAEL | HEBREW' },
        ],
    },
];

const ALL_SECTIONS = [
    { id: 'visibility', label: 'נראות רכיבים', icon: '👁️', accent: '#FF2D55', type: 'visibility' },
    { id: 'menu_reorder', label: 'סידור תפריט', icon: '↔️', accent: '#007AFF', type: 'menu_reorder' },
    ...FIELD_SECTIONS,
    { id: 'videos', label: 'ספריית VOD', icon: '🎬', accent: '#FF3B30', type: 'videos' },
];

const MenuReorderSection = ({ content, onChange }) => {
    const items = useMemo(() => {
        const list = [];
        for (let i = 1; i <= 6; i++) {
            list.push({
                id: i,
                label: content[`menu_item${i}_label`] || `פריט ${i}`,
                path: content[`menu_item${i}_path`] || '/',
            });
        }
        return list;
    }, [content]);

    const move = (from, to) => {
        const newList = [...items];
        const [moved] = newList.splice(from, 1);
        newList.splice(to, 0, moved);
        
        const updates = {};
        newList.forEach((item, idx) => {
            updates[`menu_item${idx + 1}_label`] = item.label;
            updates[`menu_item${idx + 1}_path`] = item.path;
        });
        
        Object.entries(updates).forEach(([k, v]) => onChange(k, v));
    };

    return (
        <div className="p-6 space-y-4">
            <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right mb-4">
                גררו פריטים כדי לשנות את סדר הניווט באתר
            </p>
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        layout
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-move group hover:border-[#007AFF]/30 transition-colors"
                    >
                        <div className="flex flex-col gap-1 text-[#AEAEB2] group-hover:text-[#007AFF] transition-colors">
                            <button onClick={() => idx > 0 && move(idx, idx - 1)} className="hover:scale-125 transition-transform">▲</button>
                            <button onClick={() => idx < items.length - 1 && move(idx, idx + 1)} className="hover:scale-125 transition-transform">▼</button>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-sm font-bold text-[#1D1D1F]">{item.label}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.path}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#AEAEB2]">
                            {idx + 1}
                        </div>
                    </motion.div>
                ))}
            </div>
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

    useEffect(() => {
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

    const handleSave = () => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(content));
            window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(content) }));
            setSaved(true);
            setHasChanges(false);
            showToast('כל השינויים נשמרו בהצלחה', 'success');
            setTimeout(() => setSaved(false), 2000);
        } catch {}
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
                                <MenuReorderSection content={content} onChange={handleChange} />
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
