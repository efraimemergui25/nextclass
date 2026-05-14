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
    Eye, Layout, Type, Image as ImageIcon, Search,
    ShoppingCart, Plus, Trash2, Save, RotateCcw,
    ChevronDown, ArrowRightLeft, ChevronRight, ExternalLink, Edit2, X
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';

const LS_KEY = 'nextclass_cms_settings';

const CARD_STYLE = { boxShadow: '0 8px 30px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.1)' };

// ─── Visibility Items ─────────────────────────────────────────────────────────
const VISIBILITY_ITEMS = [
    { key: 'vis_hero',              label: 'באנר ראשי (Hero)',       desc: 'הצגת הכותרת והתמונה הראשית', icon: '🏠' },
    { key: 'vis_trust_bar',         label: 'שורת לוגואים (Trust)',   desc: 'הצגת לוגואים של מוסדות', icon: '🤝' },
    { key: 'vis_value_props',       label: 'יתרונות הפלטפורמה',      desc: 'קטע ה-Value Props והנתונים', icon: '⭐' },
    { key: 'vis_featured_products', label: 'מוצרים מומלצים',         desc: 'סקציית המלצות בתחתית דף הבית', icon: '✨' },
    { key: 'vis_testimonials',      label: 'עדויות לקוחות',          desc: 'סקציית חוות דעת וציטוטים', icon: '💬' },
    { key: 'vis_announcement_bar',  label: 'בר הכרזות עליון',        desc: 'הסרגל שמופיע מעל ה-Header', icon: '📣' },
    { key: 'vis_about_page',        label: 'עמוד "הסיפור שלנו"',     desc: 'הפעלה/השבתה של עמוד האודות', icon: '📖' },
    { key: 'vis_vod_page',          label: 'מרכז ההדרכה (VOD)',      desc: 'הפעלה/השבתה של ספריית הסרטונים', icon: '🎬' },
    { key: 'vis_magazine',          label: 'מגזין חדשנות',           desc: 'הפעלה/השבתה של בלוג האתר', icon: '📰' },
    { key: 'vis_compare_page',      label: 'עמוד השוואת דגמים',      desc: 'הפעלה/השבתה של כלי ההשוואה', icon: '⚖️' },
    { key: 'vis_ai_assistant',      label: 'עוזר אישי (AI)',         desc: 'הפעלה/השבתה של הווידג׳ט הצף', icon: '🤖' },
    { key: 'vis_accessibility_widget', label: 'ווידג׳ט נגישות',     desc: 'כפתור נגישות צף בפינת המסך', icon: '♿' },
    { key: 'vis_product_qa',        label: 'שאלות גולשים (מוצר)',    desc: 'מדור ש&א בכל דף מוצר', icon: '❓' },
    { key: 'sidebar_visible',       label: 'תפריט צד (Product Page)', desc: 'הניווט הצף בדפי המוצר', icon: '📌' },
    { key: 'allow_payments',        label: 'תשלום מקוון (Checkout)', desc: 'הפעלת שלב תשלום מקוון בצ׳ק-אאוט', icon: '💳' },
    { key: 'show_prices',           label: 'הצגת מחירים',           desc: 'הסתרת/הצגת מחירים בכל האתר', icon: '💰' },
];

// ─── Field Sections ───────────────────────────────────────────────────────────
const FIELD_SECTIONS = [
    {
        id: 'branding',
        label: 'זהות ומיתוג',
        icon: '🎨',
        accent: '#5856D6',
        fields: [
            { key: 'site_name',          label: 'שם האתר',              type: 'text',     default: 'NextClass' },
            { key: 'site_logo_url',      label: 'לוגו (URL)',            type: 'image',    default: '' },
            { key: 'site_tagline',       label: 'סלוגן ראשי (Footer)',   type: 'textarea', default: 'אנחנו מעצבים את הכלים שמעצימים את דור המחר.' },
            { key: 'announcement_text',  label: 'בר הכרזות',            type: 'text',     default: '' },
            { key: 'announcement_color', label: 'צבע בר הכרזות (hex)',  type: 'text',     default: '#1D1D1F' },
            { key: 'allow_orders',       label: 'אפשר בניית עגלה ושליחת בקשות', type: 'boolean', default: true },
            { key: 'allow_payments',     label: 'אפשר תשלום מקוון',     type: 'boolean',  default: false },
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
            { key: 'nav_home',           label: 'בית — תווית',          type: 'text', default: 'דף הבית' },
            { key: 'nav_catalog',        label: 'קטלוג — תווית',        type: 'text', default: 'המוצרים שלנו' },
            { key: 'nav_catalog_sub',    label: 'קטלוג — תיאור (נייד)', type: 'text', default: 'כל הפתרונות הטכנולוגיים לחינוך' },
            { key: 'nav_compare',        label: 'השוואה — תווית',       type: 'text', default: 'השוואת דגמים' },
            { key: 'nav_compare_sub',    label: 'השוואה — תיאור (נייד)',type: 'text', default: 'השווה בין מוצרים בקלות' },
            { key: 'nav_about',          label: 'סיפורנו — תווית',      type: 'text', default: 'הסיפור שלנו' },
            { key: 'nav_story_sub',      label: 'סיפורנו — תיאור (נייד)',type: 'text', default: 'מי אנחנו ולמה זה חשוב' },
            { key: 'nav_vod',            label: 'הדרכה — תווית',        type: 'text', default: 'מרכז הדרכה' },
            { key: 'nav_vod_sub',        label: 'הדרכה — תיאור (נייד)', type: 'text', default: 'מדריכי וידאו ומרכז ידע חינמי' },
            { key: 'nav_magazine',       label: 'מגזין — תווית',        type: 'text', default: 'מגזין' },
            { key: 'nav_magazine_sub',   label: 'מגזין — תיאור (נייד)', type: 'text', default: 'תוכן מקצועי לאנשי חינוך' },
            { key: 'nav_contact',        label: 'קשר — תווית',          type: 'text', default: 'צור קשר' },
            { key: 'nav_contact_sub',    label: 'קשר — תיאור (נייד)',   type: 'text', default: 'דבר איתנו עכשיו' },
            { key: 'nav_mega_hint',      label: 'רמז מגה-מניו',         type: 'text', default: 'לחץ לצפייה בדגמים' },
            { key: 'nav_mega_all',       label: 'כפתור "כל הקטלוג"',    type: 'text', default: 'לכל קטלוג הפתרונות' },
            { key: 'nav_mega_label',     label: 'תווית מגה-מניו',       type: 'text', default: 'פתרונות מובילים' },
        ],
    },
    {
        id: 'hero',
        label: 'עמוד בית — Hero',
        icon: '🏠',
        accent: '#007AFF',
        fields: [
            { key: 'hero_eyebrow',     label: 'תווית עליונה',   type: 'text',     default: 'הדור הבא של טכנולוגיה לחינוך' },
            { key: 'hero_headline',    label: 'כותרת ראשית',    type: 'text',     default: 'חדשנות חסרת פשרות.' },
            { key: 'hero_subline',     label: 'כותרת משנה',     type: 'text',     default: 'מקצוענות בכל מרחב למידה.' },
            { key: 'hero_description', label: 'תיאור',          type: 'textarea', default: 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.' },
            { key: 'hero_cta',         label: 'כפתור פעולה',   type: 'text',     default: 'גלו את הפתרונות שלנו' },
            { key: 'hero_bg_image',    label: 'תמונת רקע (URL)',type: 'image',    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80' },
            { key: 'hero_trust_pill_1',label: 'פיל אמון 1',    type: 'text',     default: 'שירות ישיר ומהיר' },
            { key: 'hero_trust_pill_2',label: 'פיל אמון 2',    type: 'text',     default: 'ייעוץ ללא עלות' },
            { key: 'hero_trust_pill_3',label: 'פיל אמון 3',    type: 'text',     default: '+500 מוסדות חינוך' },
        ],
    },
    {
        id: 'trust_badges',
        label: 'תגי אמון (דף מוצר)',
        icon: '🏅',
        accent: '#34C759',
        fields: [
            { key: 'trust_badge_1_title', label: 'תג 1: כותרת',  type: 'text', default: 'שירות ישיר ומהיר' },
            { key: 'trust_badge_1_desc',  label: 'תג 1: תיאור',  type: 'text', default: 'מענה אישי בכל שלב' },
            { key: 'trust_badge_2_title', label: 'תג 2: כותרת',  type: 'text', default: 'החלפה תוך 14 יום' },
            { key: 'trust_badge_2_desc',  label: 'תג 2: תיאור',  type: 'text', default: 'ללא שאלות' },
            { key: 'trust_badge_3_title', label: 'תג 3: כותרת',  type: 'text', default: 'מחיר שקוף' },
            { key: 'trust_badge_3_desc',  label: 'תג 3: תיאור',  type: 'text', default: 'מה שהוצע — מה שמשלמים' },
        ],
    },
    {
        id: 'homepage_sections',
        label: 'אקוסיסטם ואמון',
        icon: '🧱',
        accent: '#FF9500',
        fields: [
            { key: 'sp_label',       label: 'כותרת מוסדות',         type: 'text',     default: 'נבחר על ידי מעל 500 מוסדות חינוך ועיריות מובילות' },
            { key: 'sp_clients',     label: 'רשימת מוסדות (פסיק)',  type: 'textarea', default: 'משרד החינוך, רשת אורט, עיריית תל אביב, אוניברסיטת אריאל, רשת עמל' },
            { key: 'eco_title',      label: 'כותרת אקוסיסטם',       type: 'text',     default: 'למידה שיוצאת מהמסגרת' },
            { key: 'eco_desc',       label: 'תיאור אקוסיסטם',       type: 'textarea', default: 'חקור את אקו-סיסטם הלמידה השלם שלנו. פתרונות שמשתלבים אחד בשני ליצירת חוויה פדגוגית חלקה.' },
            { key: 'eco_eyebrow',    label: 'תווית עליונה',         type: 'text',     default: 'האקוסיסטם שלנו' },
            { key: 'eco_hint',       label: 'הערת לחיצה',           type: 'text',     default: 'לחץ על הנקודות הכחולות' },
            { key: 'eco_bg_image',   label: 'תמונת רקע אקוסיסטם',  type: 'image',    default: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=85&w=1600' },
            { key: 'eco_added',      label: 'תווית "נוסף"',         type: 'text',     default: 'נוסף' },
            { key: 'eco_remove',     label: 'תווית "הסר"',          type: 'text',     default: 'הסר מהעגלה' },
            { key: 'eco_add',        label: 'תווית "הוסף"',         type: 'text',     default: 'הוסף' },
            { key: 'eco_more_info',  label: 'לינק "פרטים נוספים"',  type: 'text',     default: 'פרטים נוספים ←' },
        ],
    },
    {
        id: 'homepage_vp',
        label: 'יתרונות (Value Props)',
        icon: '⭐',
        accent: '#34C759',
        fields: [
            { key: 'vp_title',       label: 'כותרת הקטע',      type: 'text',     default: 'סטנדרט חדש של שירות למוסדות חינוך' },
            { key: 'vp_label',       label: 'תווית עליונה',    type: 'text',     default: 'מה שמייחד אותנו' },
            { key: 'vp_prop1_title', label: 'יתרון 1: כותרת',  type: 'text',     default: 'ייעוץ אישי ומקצועי' },
            { key: 'vp_prop1_desc',  label: 'יתרון 1: תיאור',  type: 'textarea', default: 'יועץ טכנולוגי מקצועי מלווה אתכם מהשלב הראשון' },
            { key: 'vp_prop2_title', label: 'יתרון 2: כותרת',  type: 'text',     default: 'אחריות ותמיכה מלאה' },
            { key: 'vp_prop2_desc',  label: 'יתרון 2: תיאור',  type: 'textarea', default: 'תמיכה טכנית 24/7 ואחריות מלאה על כל המוצרים' },
            { key: 'vp_prop3_title', label: 'יתרון 3: כותרת',  type: 'text',     default: 'מחירים מוסדיים' },
            { key: 'vp_prop3_desc',  label: 'יתרון 3: תיאור',  type: 'textarea', default: 'מחירים מיוחדים למוסדות חינוך עם אפשרויות מימון' },
        ],
    },
    {
        id: 'feature_tiles',
        label: 'כרטיסי תכונות',
        icon: '🟦',
        accent: '#007AFF',
        fields: [
            { key: 'feat1_title', label: 'כרטיס 1: כותרת', type: 'text',     default: 'מסכים אינטראקטיביים' },
            { key: 'feat1_desc',  label: 'כרטיס 1: תיאור', type: 'textarea', default: 'מסכי מגע חכמים לכל גודל כיתה' },
            { key: 'feat1_img',   label: 'כרטיס 1: תמונה', type: 'image',    default: '' },
            { key: 'feat2_title', label: 'כרטיס 2: כותרת', type: 'text',     default: 'מחשוב לחינוך' },
            { key: 'feat2_desc',  label: 'כרטיס 2: תיאור', type: 'textarea', default: 'מחשבים וטאבלטים לצוות ותלמידים' },
            { key: 'feat2_img',   label: 'כרטיס 2: תמונה', type: 'image',    default: '' },
            { key: 'feat3_title', label: 'כרטיס 3: כותרת', type: 'text',     default: 'מעבדות STEM' },
            { key: 'feat3_desc',  label: 'כרטיס 3: תיאור', type: 'textarea', default: 'ציוד מחקר וחדשנות לתלמידים' },
            { key: 'feat3_img',   label: 'כרטיס 3: תמונה', type: 'image',    default: '' },
            { key: 'feat4_title', label: 'כרטיס 4: כותרת', type: 'text',     default: 'אודיו ווידאו' },
            { key: 'feat4_desc',  label: 'כרטיס 4: תיאור', type: 'textarea', default: 'מערכות שמע ומצלמות למרחבי למידה' },
            { key: 'feat4_img',   label: 'כרטיס 4: תמונה', type: 'image',    default: '' },
        ],
    },
    {
        id: 'shoppable_image',
        label: 'תמונה עם קניה (Shoppable)',
        icon: '🖼️',
        accent: '#FF9500',
        fields: [
            { key: 'shop_eyebrow',  label: 'תווית עליונה',     type: 'text',     default: 'האקוסיסטם שלנו' },
            { key: 'shop_title',    label: 'כותרת',             type: 'text',     default: 'לחץ על נקודה לגלות מוצר' },
            { key: 'shop_desc',     label: 'תיאור',             type: 'textarea', default: 'כל פתרון במרחב הלמידה שלך — ניתן לרכישה מיידית.' },
            { key: 'shop_bg_image', label: 'תמונת רקע',        type: 'image',    default: 'https://images.unsplash.com/photo-1588702545911-5f940bb36109?q=80&w=2000&auto=format&fit=crop' },
        ],
    },
    {
        id: 'quote_wizard',
        label: 'אשף הצעת מחיר',
        icon: '💬',
        accent: '#5856D6',
        fields: [
            { key: 'quote_eyebrow',        label: 'תווית עליונה',      type: 'text',     default: 'כלי חינמי' },
            { key: 'quote_title',          label: 'כותרת',             type: 'text',     default: 'בונים לכם הצעת מחיר בדקה' },
            { key: 'quote_desc',           label: 'תיאור',             type: 'textarea', default: 'שתי שאלות — ונתאים לכם פתרון מדויק עם הצעת מחיר ראשונית.' },
            { key: 'quote_step1_title',    label: 'כותרת שלב 1',      type: 'text',     default: 'מה המוסד שלכם?' },
            { key: 'quote_step2_title',    label: 'כותרת שלב 2',      type: 'text',     default: 'כמה כיתות תרצו לצייד?' },
            { key: 'quote_thinking_msg',   label: 'הודעת עיבוד',      type: 'text',     default: 'מחשבים את החבילה המתאימה...' },
            { key: 'quote_includes_label', label: 'תווית "מה כלול"',  type: 'text',     default: 'מה כלול בחבילה:' },
            { key: 'quote_price_label',    label: 'תווית מחיר',       type: 'text',     default: 'החל מ' },
            { key: 'quote_price_note',     label: 'הערת מחיר',        type: 'text',     default: '*לפני מע״מ, כולל התקנה, הדרכה ואחריות' },
            { key: 'quote_timeline_label', label: 'תווית זמן פריסה',  type: 'text',     default: 'זמן פריסה משוער' },
            { key: 'biz_phone',            label: 'טלפון עסקי',       type: 'text',     default: '058-5856356' },
            { key: 'biz_whatsapp',         label: 'וואטסאפ עסקי',     type: 'text',     default: '972585856356' },
        ],
    },
    {
        id: 'expert_consultation',
        label: 'ייעוץ מומחה',
        icon: '🎓',
        accent: '#34C759',
        fields: [
            { key: 'expert_title',      label: 'כותרת',              type: 'text',     default: 'בואו נרכיב יחד את הפתרון המושלם למוסד שלכם.' },
            { key: 'expert_desc',       label: 'תיאור',              type: 'textarea', default: 'יועץ טכנולוגי מנוסה יאפיין את הצרכים שלכם ויבנה עבורכם פתרון מדויק.' },
            { key: 'expert_cta',        label: 'כפתור פעולה',        type: 'text',     default: 'קבל ייעוץ חינמי' },
            { key: 'expert_form_title', label: 'כותרת הטופס',        type: 'text',     default: 'השאירו פרטים ונחזור אליכם' },
            { key: 'expert_image',      label: 'תמונה',              type: 'image',    default: '' },
        ],
    },
    {
        id: 'home_discover_products',
        label: 'דף הבית — גילוי ומוצרים',
        icon: '🔭',
        accent: '#FF9500',
        fields: [
            { key: 'home_products_eyebrow', label: 'מוצרים: תווית',  type: 'text',     default: 'המוצרים שלנו' },
            { key: 'home_products_title',   label: 'מוצרים: כותרת',  type: 'text',     default: 'פתרונות טכנולוגיים מובילים' },
            { key: 'home_products_sub',     label: 'מוצרים: תיאור',  type: 'textarea', default: 'הכלים המתקדמים ביותר לסביבת הלמידה החדשה.' },
            { key: 'home_products_cta1',    label: 'מוצרים: כפתור 1',type: 'text',     default: 'לכל הקטלוג' },
            { key: 'home_products_cta2',    label: 'מוצרים: כפתור 2',type: 'text',     default: 'השוואת דגמים' },
            { key: 'home_discover_eyebrow', label: 'גילוי: תווית',   type: 'text',     default: 'חדש' },
            { key: 'home_discover_title',   label: 'גילוי: כותרת',   type: 'text',     default: 'גלו מה חדש' },
            { key: 'home_discover_sub',     label: 'גילוי: תיאור',   type: 'textarea', default: 'מוצרים חדשים, מבצעים ועוד.' },
            { key: 'home_discover_cta1',    label: 'גילוי: כפתור 1', type: 'text',     default: 'גלה עוד' },
            { key: 'home_discover_cta2',    label: 'גילוי: כפתור 2', type: 'text',     default: 'כל המבצעים' },
        ],
    },
    {
        id: 'search_section',
        label: 'חיפוש',
        icon: '🔍',
        accent: '#007AFF',
        fields: [
            { key: 'search_placeholder',   label: 'placeholder חיפוש',      type: 'text',     default: 'חפש מוצר, קטגוריה, מפרט...' },
            { key: 'search_popular_label', label: 'תווית "חיפושים נפוצים"', type: 'text',     default: 'חיפושים נפוצים' },
            { key: 'search_popular_terms', label: 'מונחים נפוצים (פסיק)',   type: 'textarea', default: 'מסך מגע, STEM, מצלמה, מחשב נייד, רמקול' },
            { key: 'search_no_results',    label: 'הודעת אין תוצאות',       type: 'text',     default: 'לא נמצאו תוצאות. נסה חיפוש אחר.' },
        ],
    },
    {
        id: 'catalog_full',
        label: 'קטלוג וסינון',
        icon: '🛍️',
        accent: '#5856D6',
        fields: [
            { key: 'catalog_title',            label: 'כותרת הקטלוג',       type: 'text',     default: 'הכלים שמעצבים את המחר.' },
            { key: 'catalog_subtitle',         label: 'תיאור הקטלוג',       type: 'textarea', default: 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.' },
            { key: 'catalog_hero_eyebrow',     label: 'תווית עליונה',       type: 'text',     default: 'הקטלוג שלנו' },
            { key: 'catalog_hero_title',       label: 'כותרת Hero',         type: 'text',     default: 'פתרונות טכנולוגיים' },
            { key: 'catalog_hero_subtitle',    label: 'תיאור Hero',         type: 'textarea', default: 'כל מה שצריך לכיתה חכמה' },
            { key: 'catalog_badge',            label: 'תג על מוצר בסל',    type: 'text',     default: 'בסל' },
            { key: 'catalog_filter_btn',       label: 'כפתור סינון',        type: 'text',     default: 'סינון מתקדם' },
            { key: 'catalog_filter_sub',       label: 'תיאור חלונית סינון', type: 'text',     default: 'התאימו את הקטלוג לצרכים שלכם' },
            { key: 'catalog_apply_btn',        label: 'כפתור "החל"',        type: 'text',     default: 'החל סינון' },
            { key: 'catalog_reset_btn',        label: 'כפתור "איפוס"',      type: 'text',     default: 'איפוס' },
            { key: 'catalog_sort_label',       label: 'תווית מיון',         type: 'text',     default: 'מיון לפי' },
            { key: 'catalog_sort_rel',         label: 'מיון: רלוונטיות',    type: 'text',     default: 'רלוונטיות' },
            { key: 'catalog_sort_pasc',        label: 'מיון: מחיר עולה',    type: 'text',     default: 'מחיר: מהנמוך לגבוה' },
            { key: 'catalog_sort_pdesc',       label: 'מיון: מחיר יורד',    type: 'text',     default: 'מחיר: מהגבוה לנמוך' },
            { key: 'catalog_sort_name',        label: 'מיון: שם',           type: 'text',     default: 'שם המוצר (א-ת)' },
            { key: 'catalog_view_grid',        label: 'תווית תצוגת רשת',   type: 'text',     default: 'רשת' },
            { key: 'catalog_view_list',        label: 'תווית תצוגת רשימה', type: 'text',     default: 'רשימה' },
            { key: 'catalog_price_label',      label: 'תווית טווח מחירים', type: 'text',     default: 'טווח מחיר (₪)' },
            { key: 'catalog_price_max',        label: 'מחיר מקסימום',      type: 'text',     default: '50000' },
            { key: 'catalog_tags_label',       label: 'תווית תגיות',       type: 'text',     default: 'תגיות' },
            { key: 'catalog_empty_msg',        label: 'הודעת אין תוצאות',  type: 'text',     default: 'לא נמצאו מוצרים' },
            { key: 'catalog_empty_hint',       label: 'רמז "נסה שנית"',    type: 'text',     default: 'נסה קטגוריה אחרת' },
            { key: 'catalog_all_cat',          label: 'שם קטגוריית "הכל"', type: 'text',     default: 'הכל' },
            { key: 'catalog_search_hint',      label: 'רמז חיפוש',         type: 'text',     default: 'חפש בין מאות פתרונות...' },
            { key: 'catalog_inst_price',       label: 'תווית מחיר מוסדי',  type: 'text',     default: 'מחיר מוסדי' },
            { key: 'catalog_add_to_cart',      label: 'כפתור הוסף לסל',    type: 'text',     default: 'הוסף לסל' },
            { key: 'catalog_request_quote',    label: 'כפתור הצעת מחיר',   type: 'text',     default: 'בקש הצעה' },
            { key: 'catalog_added_msg',        label: 'הודעת "נוסף לסל"',  type: 'text',     default: 'נוסף לסל בהצלחה' },
            { key: 'catalog_remove_msg',       label: 'הודעת "הוסר מהסל"', type: 'text',     default: 'הוסר מהסל' },
            { key: 'catalog_inst_price_label', label: 'תווית מחיר מוסדי (ארוכה)', type: 'text', default: 'מחיר מוסדי מאושר' },
            { key: 'catalog_filter_drawer_title', label: 'כותרת מגירת סינון', type: 'text',  default: 'סינון מתקדם' },
            { key: 'catalog_filter_drawer_sub',   label: 'תיאור מגירת סינון', type: 'text',  default: 'התאם את הקטלוג לצרכי המוסד שלך' },
            { key: 'catalog_categories',       label: 'קטגוריות (פסיק)',   type: 'textarea', default: 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה' },
        ],
    },
    {
        id: 'product_detail',
        label: 'דף מוצר',
        icon: '📦',
        accent: '#FF9500',
        fields: [
            { key: 'pd_home',                label: 'לחם פירורים: בית',    type: 'text', default: 'ראשי' },
            { key: 'pd_catalog',             label: 'לחם פירורים: קטלוג',  type: 'text', default: 'קטלוג' },
            { key: 'pd_buy_now',             label: 'כפתור קנה עכשיו',     type: 'text', default: 'קנה עכשיו' },
            { key: 'pd_add_cart',            label: 'כפתור הוסף לסל',      type: 'text', default: 'הוסף לעגלה' },
            { key: 'pd_request_quote',       label: 'כפתור הצעת מחיר',    type: 'text', default: 'שלח פנייה וקבל הצעה' },
            { key: 'pd_request_quote_inst',  label: 'הצעת מחיר מוסדית',   type: 'text', default: 'בקש הצעת מחיר מוסדית' },
            { key: 'pd_quick_inquiry',       label: 'כפתור פנייה מהירה',  type: 'text', default: 'שלח פנייה מהירה' },
            { key: 'pd_live_demo',           label: 'כפתור הדגמה חיה',    type: 'text', default: 'הדגמה חיה' },
            { key: 'pd_more_info',           label: 'כפתור פרטים נוספים', type: 'text', default: 'פרטים נוספים' },
            { key: 'pd_specs_title',         label: 'כותרת מפרט',         type: 'text', default: 'מפרט טכני' },
            { key: 'pd_specs_desc',          label: 'תיאור מפרט',         type: 'textarea', default: 'הפרטים המדויקים שהופכים את המערכת הזו למובילה מסוגה.' },
            { key: 'pd_acc_title',           label: 'כותרת אביזרים',      type: 'text', default: 'השלם את המערכת שלך' },
            { key: 'pd_acc_optional',        label: 'תווית אופציונלי',    type: 'text', default: 'אופציונלי' },
            { key: 'pd_success_msg',         label: 'הודעת הוספה לסל',    type: 'text', default: 'נוסף לסל בהצלחה' },
            { key: 'pd_added',               label: 'תווית "נוסף"',       type: 'text', default: 'נוסף' },
            { key: 'pd_remove',              label: 'תווית "הסר"',        type: 'text', default: 'הסר' },
            { key: 'pd_remove_from_cart',    label: 'הודעת הסרה מהסל',    type: 'text', default: 'הסר מהעגלה' },
            { key: 'pd_not_found',           label: 'הודעת מוצר לא נמצא', type: 'text', default: 'המוצר לא נמצא.' },
            { key: 'pd_contact_for_price',   label: 'צור קשר למחיר',     type: 'text', default: 'צור קשר להצעת מחיר' },
            { key: 'pd_color_label',         label: 'בחירת צבע',         type: 'text', default: 'בחירת צבע' },
            { key: 'pd_compare_btn',         label: 'כפתור השוואה',      type: 'text', default: 'השווה דגם' },
            { key: 'pd_compare_selected',    label: 'נבחר להשוואה',      type: 'text', default: 'נבחר להשוואה' },
        ],
    },
    {
        id: 'sidebar_sections',
        label: 'סרגל ניווט מוצר',
        icon: '📋',
        accent: '#5856D6',
    },
    {
        id: 'pd_dims_section',
        label: 'מידות המוצר',
        icon: '📏',
        accent: '#5856D6',
        fields: [
            { key: 'pd_dims_title',  label: 'כותרת קטע מידות',         type: 'text', default: 'מידות המוצר' },
            { key: 'pd_dims_label1', label: 'שדה 1: תווית',             type: 'text', default: 'רוחב' },
            { key: 'pd_dims_value1', label: 'שדה 1: ערך',               type: 'text', default: '' },
            { key: 'pd_dims_label2', label: 'שדה 2: תווית',             type: 'text', default: 'גובה' },
            { key: 'pd_dims_value2', label: 'שדה 2: ערך',               type: 'text', default: '' },
            { key: 'pd_dims_label3', label: 'שדה 3: תווית',             type: 'text', default: 'עומק' },
            { key: 'pd_dims_value3', label: 'שדה 3: ערך',               type: 'text', default: '' },
            { key: 'pd_dims_label4', label: 'שדה 4: תווית',             type: 'text', default: 'משקל' },
            { key: 'pd_dims_value4', label: 'שדה 4: ערך',               type: 'text', default: '' },
            { key: 'pd_dims_label5', label: 'שדה 5: תווית (אופציונלי)', type: 'text', default: '' },
            { key: 'pd_dims_value5', label: 'שדה 5: ערך (אופציונלי)',   type: 'text', default: '' },
        ],
    },
    {
        id: 'pd_warranty_section',
        label: 'אחריות ורכישה (מוצר)',
        icon: '🛡️',
        accent: '#007AFF',
        fields: [
            { key: 'pd_warranty_title',      label: 'כותרת קטע אחריות',  type: 'text',     default: 'תנאי רכישה ואחריות' },
            { key: 'pd_warranty_text',       label: 'טקסט תנאים',        type: 'textarea', default: 'המוצרים שלנו נבחרים בקפידה ועוברים בדיקת איכות לפני המשלוח. כל רכישה מלווה בתנאי אחריות יצרן בהתאם לדגם הספציפי. יש שאלה לגבי תנאי הרכישה? פנו אלינו ישירות ונשמח לעזור.' },
            { key: 'pd_warranty_badge1',     label: 'תג 1: כותרת',       type: 'text',     default: 'אחריות יצרן' },
            { key: 'pd_warranty_badge1_sub', label: 'תג 1: פרט',         type: 'text',     default: 'בהתאם למוצר' },
            { key: 'pd_warranty_badge2',     label: 'תג 2: כותרת',       type: 'text',     default: 'איכות פרימיום' },
            { key: 'pd_warranty_badge2_sub', label: 'תג 2: פרט',         type: 'text',     default: 'מובטחת' },
            { key: 'pd_warranty_badge3',     label: 'תג 3: כותרת',       type: 'text',     default: 'החלפת מוצר' },
            { key: 'pd_warranty_badge3_sub', label: 'תג 3: פרט',         type: 'text',     default: 'תוך 30 יום' },
        ],
    },
    {
        id: 'pd_support_section',
        label: 'שירות ותמיכה (מוצר)',
        icon: '🎧',
        accent: '#34C759',
        fields: [
            { key: 'pd_support_title',       label: 'כותרת קטע תמיכה',  type: 'text', default: 'שירות ותמיכה' },
            { key: 'pd_support_phone_label', label: 'תווית כפתור טלפון', type: 'text', default: 'תמיכה טלפונית' },
            { key: 'pd_support_email_label', label: 'תווית כפתור מייל',  type: 'text', default: 'שלח מייל' },
            { key: 'pd_support_wa_label',    label: 'תווית כפתור וואטסאפ',type: 'text', default: 'וואטסאפ' },
            { key: 'pd_support_wa_value',    label: 'שעות זמינות',       type: 'text', default: 'זמינים 9:00–21:00' },
        ],
    },
    {
        id: 'pd_faq_section',
        label: 'שאלות נפוצות (מוצר)',
        icon: '❓',
        accent: '#5856D6',
        fields: [
            { key: 'pd_faq_title', label: 'כותרת קטע שאלות',    type: 'text',     default: 'שאלות נפוצות' },
            { key: 'pd_faq_q1',   label: 'שאלה 1',              type: 'text',     default: 'מהו זמן האספקה הצפוי?' },
            { key: 'pd_faq_a1',   label: 'תשובה 1',             type: 'textarea', default: 'אספקה תוך 3–7 ימי עסקים לרוב האזורים בישראל.' },
            { key: 'pd_faq_q2',   label: 'שאלה 2',              type: 'text',     default: 'האם ניתן לקבל הצעת מחיר מוסדית?' },
            { key: 'pd_faq_a2',   label: 'תשובה 2',             type: 'textarea', default: 'כן! מלאו את טופס יצירת הקשר לקבלת הצעת מחיר מותאמת.' },
            { key: 'pd_faq_q3',   label: 'שאלה 3',              type: 'text',     default: 'מה כולל שירות ההתקנה?' },
            { key: 'pd_faq_a3',   label: 'תשובה 3',             type: 'textarea', default: 'הרכבה מלאה, הגדרת רשת, הדרכת צוות ופתרון בעיות ראשוני.' },
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
            { key: 'pd_reviews_title', label: 'כותרת קטע ביקורות',    type: 'text',     default: 'חוות דעת' },
            { key: 'pd_reviews_avg',   label: 'ממוצע דירוג (1–5)',     type: 'text',     default: '4.8' },
            { key: 'pd_reviews_count', label: 'מספר ביקורות',          type: 'text',     default: '24' },
            { key: 'pd_review1_name',  label: 'ביקורת 1 — שם',         type: 'text',     default: 'שרה כ.' },
            { key: 'pd_review1_role',  label: 'ביקורת 1 — תפקיד',      type: 'text',     default: 'מורה, חט"ב גבעתיים' },
            { key: 'pd_review1_stars', label: 'ביקורת 1 — כוכבים',     type: 'text',     default: '5' },
            { key: 'pd_review1_text',  label: 'ביקורת 1 — טקסט',       type: 'textarea', default: 'ממש שדרגנו את הכיתה! הנוחות והמהירות מדהימים.' },
            { key: 'pd_review2_name',  label: 'ביקורת 2 — שם',         type: 'text',     default: 'דוד מ.' },
            { key: 'pd_review2_role',  label: 'ביקורת 2 — תפקיד',      type: 'text',     default: 'רכז טכנולוגיה, יסודי הרצליה' },
            { key: 'pd_review2_stars', label: 'ביקורת 2 — כוכבים',     type: 'text',     default: '5' },
            { key: 'pd_review2_text',  label: 'ביקורת 2 — טקסט',       type: 'textarea', default: 'התמיכה של NextClass מעולה. התקנה מהירה, ממשק ידידותי.' },
            { key: 'pd_review3_name',  label: 'ביקורת 3 — שם',         type: 'text',     default: 'מיכל ל.' },
            { key: 'pd_review3_role',  label: 'ביקורת 3 — תפקיד',      type: 'text',     default: 'מנהלת בית ספר' },
            { key: 'pd_review3_stars', label: 'ביקורת 3 — כוכבים',     type: 'text',     default: '4' },
            { key: 'pd_review3_text',  label: 'ביקורת 3 — טקסט',       type: 'textarea', default: 'השקענו בכמה מוצרים של NextClass השנה — כולם ממליצים.' },
        ],
    },
    {
        id: 'accessories_section',
        label: 'אביזרים (דף מוצר)',
        icon: '🔌',
        accent: '#FF9500',
        fields: [
            { key: 'acc_hdmi_title',  label: 'אביזר 1: שם',    type: 'text',     default: 'כבל HDMI 4K Premium' },
            { key: 'acc_hdmi_desc',   label: 'אביזר 1: תיאור', type: 'textarea', default: 'כבל HDMI 2.1 איכותי לחיבור מושלם.' },
            { key: 'acc_hdmi_price',  label: 'אביזר 1: מחיר',  type: 'text',     default: '89' },
            { key: 'acc_mount_title', label: 'אביזר 2: שם',    type: 'text',     default: 'ברגת קיר אוניברסלית' },
            { key: 'acc_mount_desc',  label: 'אביזר 2: תיאור', type: 'textarea', default: 'התקנה מקצועית על כל קיר.' },
            { key: 'acc_mount_price', label: 'אביזר 2: מחיר',  type: 'text',     default: '290' },
        ],
    },
    {
        id: 'cart_checkout',
        label: 'עגלה וקופה',
        icon: '🛒',
        accent: '#FF3B30',
        fields: [
            { key: 'cart_title',          label: 'כותרת העגלה',      type: 'text',     default: 'עגלת הרכש שלך' },
            { key: 'cart_empty_title',    label: 'עגלה ריקה — כותרת',type: 'text',     default: 'העגלה שלך ריקה' },
            { key: 'cart_empty_desc',     label: 'עגלה ריקה — תיאור',type: 'textarea', default: 'נראה שעוד לא בחרת ציוד. הקטלוג שלנו מחכה לך.' },
            { key: 'cart_back_catalog',   label: 'כפתור חזרה לקטלוג',type: 'text',     default: 'חזרה לקטלוג' },
            { key: 'cart_remove_aria',    label: 'aria הסר פריט',    type: 'text',     default: 'הסר פריט' },
            { key: 'cart_sku_label',      label: 'תווית מק"ט',       type: 'text',     default: 'מק"ט: ' },
            { key: 'cart_summary_title',  label: 'כותרת סיכום',     type: 'text',     default: 'סיכום הזמנה' },
            { key: 'cart_subtotal_label', label: 'סיכום ביניים',     type: 'text',     default: 'סיכום ביניים' },
            { key: 'cart_vat_label',      label: 'תווית מע"מ',       type: 'text',     default: 'מע"מ (17%)' },
            { key: 'cart_total_label',    label: 'סה"כ לתשלום',      type: 'text',     default: 'סה"כ לתשלום' },
            { key: 'cart_tax_note',       label: 'הערת מיסים',       type: 'text',     default: 'כולל מיסים, לא כולל משלוח' },
            { key: 'cart_checkout_btn',   label: 'כפתור לקופה',     type: 'text',     default: 'המשך לקופה / הפק טופס רכש' },
            { key: 'cart_warranty_note',  label: 'הערת אחריות',      type: 'text',     default: 'אחריות מוסדית מלאה מובטחת' },
            { key: 'check_title',         label: 'כותרת קופה',       type: 'text',     default: 'סיום קנייה' },
            { key: 'check_subtitle',      label: 'תיאור קופה',       type: 'textarea', default: 'בוא נסיים את ההזמנה שלך ונתחיל לעבוד.' },
            { key: 'check_pay_now',       label: 'כפתור שלח פנייה', type: 'text',     default: 'שלח פנייה ושלם' },
        ],
    },
    {
        id: 'ai_assistant',
        label: 'העוזר החכם (AI)',
        icon: '🤖',
        accent: '#007AFF',
        fields: [
            { key: 'ai_fab_label',     label: 'תווית כפתור צף',    type: 'text',     default: 'העוזר החכם' },
            { key: 'ai_title',         label: 'כותרת חלון',        type: 'text',     default: 'NextClass AI' },
            { key: 'ai_role',          label: 'תפקיד העוזר',       type: 'text',     default: 'Institutional Concierge' },
            { key: 'ai_greeting',      label: 'הודעת פתיחה (ברירת מחדל)', type: 'textarea', default: 'שלום! אני כאן כדי לעזור לך לאפיין את הכיתה החכמה המושלמת. מה תרצה לדעת?' },
            { key: 'ai_greeting_home', label: 'הודעת פתיחה (בית)', type: 'textarea', default: 'שלום! אני הקונסיירז׳ של NextClass. איך אוכל לעזור לכם היום?' },
            { key: 'ai_greeting_pd',   label: 'הודעת פתיחה (מוצר)',type: 'textarea', default: 'שלום! האם תרצו לקבל מפרט טכני מלא או הצעת מחיר?' },
            { key: 'ai_placeholder',   label: 'טקסט שורת הקלדה',  type: 'text',     default: 'מה תרצו לבדוק?' },
            { key: 'ai_wa_label',      label: 'מענה אנושי (כותרת)',type: 'text',     default: 'מענה אנושי בוואטסאפ' },
            { key: 'ai_wa_status',     label: 'סטטוס וואטסאפ',     type: 'text',     default: 'יועץ טכנולוגי זמין כעת ✅' },
            { key: 'ai_chip1',         label: 'צ׳יפ מהיר 1',       type: 'text',     default: 'הצעת מחיר' },
            { key: 'ai_chip2',         label: 'צ׳יפ מהיר 2',       type: 'text',     default: 'מפרט טכני' },
            { key: 'ai_chip3',         label: 'צ׳יפ מהיר 3',       type: 'text',     default: 'ייעוץ' },
            { key: 'ai_suggestion_1',  label: 'הצעת שיחה 1',       type: 'text',     default: 'אני מחפש מסך לכיתה של 30 תלמידים' },
            { key: 'ai_suggestion_2',  label: 'הצעת שיחה 2',       type: 'text',     default: 'מה מחיר ל-20 מחשבים?' },
            { key: 'ai_thinking',      label: 'הודעת "חושב..."',   type: 'text',     default: 'חושב...' },
        ],
    },
    {
        id: 'contact_page',
        label: 'צור קשר',
        icon: '📞',
        accent: '#34C759',
        fields: [
            { key: 'contact_hero_title',      label: 'כותרת ראשית',       type: 'text',     default: 'הכיתה שלכם מחכה. בואו נתחיל.' },
            { key: 'contact_hero_subtitle',   label: 'תיאור עליון',       type: 'textarea', default: 'אנחנו כאן בשבילכם — שירות ישיר, מהיר ומקצועי מהרגע הראשון.' },
            { key: 'contact_concierge_title', label: 'כותרת ייעוץ אישי',  type: 'text',     default: 'ייעוץ אישי ומיידי' },
            { key: 'contact_concierge_desc',  label: 'תיאור ייעוץ אישי',  type: 'textarea', default: 'נציג מקצועי מחכה לכם עכשיו.' },
            { key: 'contact_form_title',      label: 'כותרת טופס',        type: 'text',     default: 'בואו נצא לדרך.' },
            { key: 'contact_form_desc',       label: 'תיאור טופס',        type: 'textarea', default: 'מלאו את הפרטים ונחזור אליכם תוך יום עסקים.' },
            { key: 'contact_form_btn',        label: 'כפתור שליחה',       type: 'text',     default: 'שלח פנייה' },
            { key: 'contact_success_title',   label: 'כותרת הצלחה',      type: 'text',     default: 'הפנייה התקבלה' },
            { key: 'contact_success_msg',     label: 'הודעת הצלחה',       type: 'textarea', default: 'הצוות שלנו כבר מעבד את הבקשה שלך. נחזור אליך תוך פחות מ-24 שעות.' },
            { key: 'contact_label_name',      label: 'תווית: שם',         type: 'text',     default: 'שם מלא' },
            { key: 'contact_label_inst',      label: 'תווית: מוסד',       type: 'text',     default: 'מוסד / חברה' },
            { key: 'contact_label_msg',       label: 'תווית: הודעה',      type: 'text',     default: 'איך נוכל לעזור?' },
            { key: 'contact_trust_title',     label: 'כותרת שותפות',      type: 'text',     default: 'שותפות ארוכת טווח' },
            { key: 'contact_trust_desc',      label: 'תיאור שותפות',      type: 'textarea', default: 'אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך.' },
            { key: 'contact_phone',           label: 'טלפון',             type: 'text',     default: '058-5856356' },
            { key: 'contact_email',           label: 'מייל',              type: 'text',     default: 'efraimemergui25@gmail.com' },
            { key: 'whatsapp_number',         label: 'מספר וואטסאפ',      type: 'text',     default: '972585856356' },
            { key: 'contact_address',         label: 'כתובת',             type: 'text',     default: 'בראלי 10, תל אביב' },
            { key: 'contact_hours',           label: 'שעות פעילות',       type: 'text',     default: 'ראשון–חמישי 08:00–18:00' },
            { key: 'contact_wa_label',        label: 'תווית וואטסאפ',     type: 'text',     default: 'זמינים ב-WhatsApp' },
            { key: 'contact_wa_btn',          label: 'כפתור וואטסאפ',     type: 'text',     default: 'התחל שיחה עכשיו' },
            { key: 'contact_time_hint',       label: 'הערת זמן נוכחי',    type: 'text',     default: 'זמן נוכחי במטה בתל אביב: ' },
        ],
    },
    {
        id: 'about_page',
        label: 'אודות',
        icon: '📖',
        accent: '#AF52DE',
        fields: [
            { key: 'about_hero_label',    label: 'תווית עליונה',         type: 'text',     default: '' },
            { key: 'about_hero_title',    label: 'כותרת ראשית',         type: 'text',     default: 'הטכנולוגיה\nשחינוך ראוי לה.' },
            { key: 'about_hero_sub',      label: 'תיאור גיבור',         type: 'textarea', default: 'מקצועי. מהיר. אישי. ישיר.\nהסטנדרט הגבוה ביותר שחינוך יכול לקבל.' },
            { key: 'about_hero_img',      label: 'תמונת כותרת',         type: 'image',    default: '' },
            { key: 'about_story_title',   label: 'כותרת הסיפור',        type: 'text',     default: 'הכל התחיל ב-2012. עם מסך אחד והרבה תסכול.' },
            { key: 'about_story_section_title', label: 'כותרת קטע הסיפור',   type: 'text',     default: 'הסיפור שלנו.' },
            { key: 'about_story_body',    label: 'גוף הסיפור',          type: 'textarea', default: 'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם, ציוד שמגיע שבועות מאוחר, ושירות שנגמר ברגע שהחשבונית נחתמה. החלטתי לשנות את המשוואה. NextClass הוא לא פלטפורמה ולא קטלוג — הוא מודל עסקי אחר לגמרי: שירות ישיר, אנושי ומקצועי שמוריד את כל הביניים, ומביא לחינוך הישראלי את הרמה שהוא ראוי לה.' },
            { key: 'about_check_1',       label: 'צ׳קמארק 1',           type: 'text',     default: 'ייעוץ מקצועי ומהיר — ללא עלות' },
            { key: 'about_check_2',       label: 'צ׳קמארק 2',           type: 'text',     default: 'שירות אישי וישיר, ללא ביניים' },
            { key: 'about_check_3',       label: 'צ׳קמארק 3',           type: 'text',     default: 'פתרונות מהדרגה הראשונה לחינוך' },
            { key: 'about_stat1_val',     label: 'נתון 1: ערך',         type: 'text',     default: '1200' },
            { key: 'about_stat1_label',   label: 'נתון 1: תווית',       type: 'text',     default: 'מוסדות חינוך' },
            { key: 'about_stat2_val',     label: 'נתון 2: ערך',         type: 'text',     default: '14' },
            { key: 'about_stat2_label',   label: 'נתון 2: תווית',       type: 'text',     default: 'שנות ניסיון' },
            { key: 'about_stat3_val',     label: 'נתון 3: ערך',         type: 'text',     default: '98' },
            { key: 'about_stat3_label',   label: 'נתון 3: תווית',       type: 'text',     default: '% שביעות רצון' },
            { key: 'about_founder_title', label: 'כותרת המייסד',        type: 'text',     default: 'מקצועיות\nללא פשרות.' },
            { key: 'about_founder_message',label: 'הודעת המייסד',       type: 'textarea', default: 'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו: ישירות, מהירות, ורמה שלא מתפשרת. כל שיחה, כל הצעת מחיר, כל אספקה — כולם עוברים דרכי. לא כי אין לי ברירה. כי זו ההבטחה שלי לכל לקוח.' },
            { key: 'about_founder_name',  label: 'שם המייסד',           type: 'text',     default: 'אפרים אמרגי' },
            { key: 'about_founder_role',  label: 'תפקיד המייסד',        type: 'text',     default: 'מייסד ומנכ"ל NextClass' },
            { key: 'about_founder_img',   label: 'תמונת מייסד',         type: 'image',    default: '' },
            { key: 'about_cta_title',     label: 'כותרת CTA',           type: 'text',     default: 'שאלו אותנו.\nנגיע עם תשובות.' },
            { key: 'about_cta_desc',      label: 'תיאור CTA',           type: 'textarea', default: 'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.' },
            { key: 'about_v1_title',      label: 'ערך 1: כותרת',        type: 'text',     default: 'מחיר שקוף' },
            { key: 'about_v1_desc',       label: 'ערך 1: תיאור',        type: 'textarea', default: 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — נקודה. שקיפות מלאה מהשקל הראשון ועד האחרון.' },
            { key: 'about_v2_title',      label: 'ערך 2: כותרת',        type: 'text',     default: 'שירות מהיר' },
            { key: 'about_v2_desc',       label: 'ערך 2: תיאור',        type: 'textarea', default: 'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות. מהירות היא לא בונוס אצלנו. היא חלק בלתי נפרד מהרמה.' },
            { key: 'about_v3_title',      label: 'ערך 3: כותרת',        type: 'text',     default: 'רמה מקצועית' },
            { key: 'about_v3_desc',       label: 'ערך 3: תיאור',        type: 'textarea', default: 'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה ממה שהלקוח היה מבקש — כי זה הרף שאנחנו מסרבים לרדת ממנו.' },
            { key: 'about_journey_hint',  label: 'רמז תחילת מסע',       type: 'text',     default: 'גלה את הסיפור שלנו' },
            { key: 'about_edu_badge',     label: 'תג משרד החינוך',      type: 'text',     default: 'מאושרת משרד החינוך' },
            { key: 'about_way_title',     label: 'כותרת "הדרך שעשינו"', type: 'text',     default: 'הדרך שעשינו' },
            { key: 'about_way_desc',      label: 'תיאור "הדרך שעשינו"', type: 'text',     default: 'עשור של פריצות דרך בחינוך הישראלי.' },
            { key: 'about_founder_label', label: 'תווית מסר מייסד',     type: 'text',     default: 'מילה אישית מהמייסד' },
            { key: 'about_values_title',  label: 'כותרת ערכים',         type: 'text',     default: 'שלושה כללים' },
            { key: 'about_values_desc',   label: 'תיאור ערכים',         type: 'text',     default: 'מה שאמרנו — עמדנו בו. תמיד.' },
        ],
    },
    {
        id: 'about_timeline',
        label: 'ציר זמן אודות',
        icon: '📅',
        accent: '#AF52DE',
        fields: [
            { key: 'about_tm1_year',  label: 'עמדה 1: שנה',    type: 'text',     default: '2012' },
            { key: 'about_tm1_title', label: 'עמדה 1: כותרת',  type: 'text',     default: 'ההתחלה' },
            { key: 'about_tm1_desc',  label: 'עמדה 1: תיאור',  type: 'textarea', default: 'הקמנו את NextClass עם חזון אחד ברור.' },
            { key: 'about_tm2_year',  label: 'עמדה 2: שנה',    type: 'text',     default: '2016' },
            { key: 'about_tm2_title', label: 'עמדה 2: כותרת',  type: 'text',     default: 'צמיחה' },
            { key: 'about_tm2_desc',  label: 'עמדה 2: תיאור',  type: 'textarea', default: 'הגענו ל-200 מוסדות חינוך ברחבי ישראל.' },
            { key: 'about_tm3_year',  label: 'עמדה 3: שנה',    type: 'text',     default: '2020' },
            { key: 'about_tm3_title', label: 'עמדה 3: כותרת',  type: 'text',     default: 'חדשנות' },
            { key: 'about_tm3_desc',  label: 'עמדה 3: תיאור',  type: 'textarea', default: 'השקנו את פלטפורמת הניהול החכמה שלנו.' },
            { key: 'about_tm4_year',  label: 'עמדה 4: שנה',    type: 'text',     default: '2024' },
            { key: 'about_tm4_title', label: 'עמדה 4: כותרת',  type: 'text',     default: 'מנהיגות' },
            { key: 'about_tm4_desc',  label: 'עמדה 4: תיאור',  type: 'textarea', default: '1,200 מוסדות חינוך בחרו בנו.' },
        ],
    },
    {
        id: 'discover_section',
        label: 'עמוד גילוי',
        icon: '🔭',
        accent: '#007AFF',
        fields: [
            { key: 'discover_eyebrow',       label: 'תווית עליונה',   type: 'text',     default: 'מה חדש' },
            { key: 'discover_title',         label: 'כותרת',          type: 'text',     default: 'גילויים חדשים' },
            { key: 'discover_desc',          label: 'תיאור',          type: 'textarea', default: 'מוצרים חדשים, מבצעים ועוד.' },
            { key: 'discover_hero_badge',    label: 'תג כותרת ראשית', type: 'text',     default: 'מה חדש' },
            { key: 'discover_hero_cta',      label: 'כפתור כותרת',   type: 'text',     default: 'גלה עוד' },
            { key: 'discover_new_label',     label: 'תווית "חדש"',    type: 'text',     default: 'חדש' },
            { key: 'discover_best_label',    label: 'תווית "פופולרי"',type: 'text',     default: 'פופולרי' },
            { key: 'discover_deals_label',   label: 'תווית "מבצע"',   type: 'text',     default: 'מבצע' },
            { key: 'discover_callout_title', label: 'כותרת קריאה',    type: 'text',     default: 'פתרון מותאם לכם' },
            { key: 'discover_callout_desc',  label: 'תיאור קריאה',    type: 'textarea', default: 'פנו אלינו לקבלת הצעה מותאמת.' },
        ],
    },
    {
        id: 'wishlist_section',
        label: 'עמוד מועדפים',
        icon: '❤️',
        accent: '#FF2D55',
        fields: [
            { key: 'wishlist_badge',       label: 'תווית עליונה',      type: 'text',     default: 'המוצרים שלי' },
            { key: 'wishlist_title',       label: 'כותרת העמוד',       type: 'text',     default: 'המוצרים שאהבתי' },
            { key: 'wishlist_count_label', label: 'תווית מונה פריטים', type: 'text',     default: 'פריטים שמורים' },
            { key: 'wishlist_empty_title', label: 'כותרת מצב ריק',    type: 'text',     default: 'הרשימה שלך ריקה' },
            { key: 'wishlist_empty_desc',  label: 'תיאור מצב ריק',    type: 'textarea', default: 'לחץ על הלב על כרטיס המוצר כדי לשמור אותו כאן' },
            { key: 'wishlist_browse_btn',  label: 'כפתור "עיין בקטלוג"',type: 'text',    default: 'עיין בקטלוג' },
        ],
    },
    {
        id: 'accessibility_section',
        label: 'ווידג׳ט נגישות',
        icon: '♿',
        accent: '#34C759',
        fields: [
            { key: 'a11y_widget_title',    label: 'כותרת הפאנל',          type: 'text', default: 'מרכז נגישות' },
            { key: 'a11y_widget_subtitle', label: 'כותרת משנה',           type: 'text', default: 'התאם את חוויית הגלישה שלך' },
            { key: 'a11y_font_label',      label: 'תווית גודל גופן',      type: 'text', default: 'גודל גופן' },
            { key: 'a11y_contrast_label',  label: 'תווית ניגוד גבוה',     type: 'text', default: 'ניגוד גבוה' },
            { key: 'a11y_motion_label',    label: 'תווית ביטול אנימציות', type: 'text', default: 'ביטול אנימציות' },
            { key: 'a11y_links_label',     label: 'תווית הדגשת קישורים',  type: 'text', default: 'הדגשת קישורים' },
            { key: 'a11y_grayscale_label', label: 'תווית גווני אפור',     type: 'text', default: 'גווני אפור' },
            { key: 'a11y_reset_label',     label: 'כפתור איפוס',          type: 'text', default: 'איפוס הגדרות נגישות' },
        ],
    },
    {
        id: 'qa_section',
        label: 'שאלות גולשים (Q&A)',
        icon: '❓',
        accent: '#007AFF',
        fields: [
            { key: 'pd_qa_title',             label: 'כותרת הסקציה',    type: 'text',     default: 'שאלות ותשובות מהקהילה' },
            { key: 'qa_form_title',           label: 'כותרת הטופס',     type: 'text',     default: 'יש לך שאלה?' },
            { key: 'qa_form_desc',            label: 'תיאור הטופס',     type: 'textarea', default: 'שאל את הקהילה ואת המומחים שלנו.' },
            { key: 'qa_name_placeholder',     label: 'placeholder שם',  type: 'text',     default: 'השם שלך (אופציונלי)' },
            { key: 'qa_question_placeholder', label: 'placeholder שאלה',type: 'text',     default: 'מה תרצה לדעת על המוצר?' },
            { key: 'qa_submit_label',         label: 'כפתור שליחה',     type: 'text',     default: 'פרסם שאלה' },
            { key: 'qa_submitted_msg',        label: 'הודעת הצלחה',     type: 'textarea', default: 'תודה! השאלה שלך פורסמה.' },
            { key: 'qa_empty_msg',            label: 'הודעת ריק',       type: 'text',     default: 'עדיין אין שאלות על המוצר הזה. היה הראשון לשאול!' },
            { key: 'qa_team_label',           label: 'תווית "צוות"',    type: 'text',     default: 'תשובת צוות NextClass' },
        ],
    },
    {
        id: 'footer_config',
        label: 'פוטר (Footer)',
        icon: '🦶',
        accent: '#8E8E93',
        fields: [
            { key: 'footer_copyright',  label: 'זכויות יוצרים',      type: 'text',     default: '© 2026 NextClass. כל הזכויות שמורות.' },
            { key: 'footer_love_msg',   label: 'הודעת סיום',         type: 'text',     default: 'נבנה באהבה לחינוך' },
            { key: 'footer_tagline',    label: 'סלוגן מתחת ללוגו',   type: 'text',     default: 'ציוד חינוך ממחסן ישיר. שירות אמיתי. מחיר שקוף.' },
            { key: 'footer_col1_title', label: 'כותרת עמודה 1',     type: 'text',     default: 'פתרונות' },
            { key: 'footer_col1_items', label: 'פריטי עמודה 1 (פסיק)',type: 'textarea', default: 'מסכים חכמים, מחשוב וטאבלטים, מעבדות STEM, תשתיות למידה' },
            { key: 'footer_col2_title', label: 'כותרת עמודה 2',     type: 'text',     default: 'האקדמיה' },
            { key: 'footer_col2_items', label: 'פריטי עמודה 2 (פסיק)',type: 'textarea', default: 'מרכז עזרה, מדריכי וידאו, בלוג חדשנות, תמיכה טכנית' },
            { key: 'footer_col3_title', label: 'כותרת עמודה 3',     type: 'text',     default: 'קשר' },
            { key: 'footer_privacy',    label: 'לינק פרטיות',       type: 'text',     default: 'פרטיות' },
            { key: 'footer_terms',      label: 'לינק תנאים',        type: 'text',     default: 'תנאי שימוש' },
            { key: 'footer_location',   label: 'תווית מיקום/שפה',   type: 'text',     default: 'ISRAEL | HEBREW' },
        ],
    },
    {
        id: 'legal',
        label: 'עמודים משפטיים',
        icon: '⚖️',
        accent: '#5856D6',
        fields: [
            { key: 'legal_privacy_updated', label: 'תאריך עדכון — מדיניות פרטיות', type: 'text',     default: '14 במאי 2026' },
            { key: 'legal_terms_updated',   label: 'תאריך עדכון — תנאי שימוש',     type: 'text',     default: '14 במאי 2026' },
            { key: 'legal_dpo_name',        label: 'אחראי הגנת מידע — שם',         type: 'text',     default: 'אפרים אמרגי' },
            { key: 'cookie_consent_title',  label: 'בנר עוגיות — כותרת',           type: 'text',     default: 'אנו משתמשים בעוגיות' },
            { key: 'cookie_consent_body',   label: 'בנר עוגיות — טקסט',            type: 'text',     default: 'כדי לשפר את חוויית השימוש ולנתח תנועה באתר.' },
        ],
    },
];

// ─── Section Groups for sidebar ───────────────────────────────────────────────
const SECTION_GROUPS = [
    {
        label: 'כללי',
        icon: '⚙️',
        sections: ['visibility', 'branding'],
    },
    {
        label: 'ניווט',
        icon: '🧭',
        sections: ['menu_reorder', 'header'],
    },
    {
        label: 'דף הבית',
        icon: '🏠',
        sections: ['hero', 'homepage_sections', 'homepage_vp', 'feature_tiles', 'shoppable_image', 'quote_wizard', 'expert_consultation', 'home_discover_products'],
    },
    {
        label: 'קטלוג וחיפוש',
        icon: '🛍️',
        sections: ['catalog_full', 'search_section'],
    },
    {
        label: 'דף מוצר',
        icon: '📦',
        sections: ['product_detail', 'sidebar_sections', 'pd_dims_section', 'pd_warranty_section', 'pd_support_section', 'pd_faq_section', 'pd_reviews_section', 'accessories_section'],
    },
    {
        label: 'תקשורת',
        icon: '📞',
        sections: ['contact_page', 'ai_assistant', 'qa_section'],
    },
    {
        label: 'עמודים',
        icon: '📖',
        sections: ['about_page', 'about_timeline', 'wishlist_section', 'discover_section'],
    },
    {
        label: 'מערכת',
        icon: '🔧',
        sections: ['cart_checkout', 'accessibility_section', 'videos'],
    },
    {
        label: 'מגזין',
        icon: '📰',
        sections: ['magazine'],
    },
    {
        label: 'משפטי',
        icon: '⚖️',
        sections: ['legal', 'footer_config'],
    },
];

// ─── All Sections flat list ───────────────────────────────────────────────────
const ALL_SECTIONS = [
    { id: 'visibility',   label: 'נראות רכיבים',            icon: '👁️', accent: '#FF2D55', type: 'visibility' },
    { id: 'menu_reorder', label: 'ניווט ראשי — סדר וגרירה', icon: '☰',  accent: '#007AFF', type: 'menu_reorder' },
    ...FIELD_SECTIONS,
    { id: 'videos',    label: 'ספריית VOD',   icon: '🎬', accent: '#FF3B30', type: 'videos' },
    { id: 'magazine',  label: 'כתבות מגזין',  icon: '📰', accent: '#007AFF', type: 'magazine' },
];

// ─── Nav Items ────────────────────────────────────────────────────────────────
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

// ─── Image Field with preview ─────────────────────────────────────────────────
function ImageField({ field, value, onChange }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = React.useRef();

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => onChange(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => onChange(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-2.5">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right block">{field.label}</label>
            {/* URL Input */}
            <input
                type="text"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder="https://... או גרור קובץ למטה"
                dir="ltr"
                className="w-full px-4 py-3 bg-[#F5F5F7] border border-gray-100 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all"
            />
            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden"
                style={{
                    borderColor: isDragOver ? '#007AFF' : '#D1D1D6',
                    background: isDragOver ? 'rgba(0,122,255,0.04)' : 'transparent',
                }}
            >
                {value ? (
                    <div className="relative h-32 bg-gray-100">
                        <img
                            src={value}
                            alt="תצוגה מקדימה"
                            className="w-full h-full object-cover"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">החלף תמונה</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 flex flex-col items-center gap-2">
                        <ImageIcon size={20} className="text-[#AEAEB2]" />
                        <span className="text-[11px] font-bold text-[#AEAEB2]">גרור תמונה לכאן או לחץ לבחירה</span>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            </div>
        </div>
    );
}

// ─── Field Input router ────────────────────────────────────────────────────────
const FieldInput = ({ field, value, onChange }) => {
    if (field.type === 'image') return <ImageField field={field} value={value} onChange={onChange} />;
    if (field.type === 'textarea') return <AdminTextArea label={field.label} value={value} onChange={onChange} rows={3} />;
    if (field.type === 'boolean') return <AdminToggle label={field.label} value={value} onChange={onChange} />;
    return <AdminInput label={field.label} value={value} onChange={onChange} />;
};

// ─── Visibility Section ───────────────────────────────────────────────────────
const VisibilitySection = ({ content, onChange }) => (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {VISIBILITY_ITEMS.map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{ background: 'rgba(255,255,255,0.70)', borderColor: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-[#1D1D1F]">{item.label}</p>
                        <p className="text-[11px] text-[#AEAEB2]">{item.desc}</p>
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

// ─── Nav Menu Manager ─────────────────────────────────────────────────────────
const NavMenuManager = ({ showToast }) => {
    const { getSetting, updateGlobalSettings } = useSettings();
    const [items, setItems] = useState(() => {
        const saved = getSetting('nav_items', null);
        return Array.isArray(saved) ? saved : DEFAULT_NAV_ITEMS;
    });
    const itemsRef = React.useRef(items);

    useEffect(() => {
        const fromFirestore = getSetting('nav_items', null);
        if (Array.isArray(fromFirestore)) { setItems(fromFirestore); itemsRef.current = fromFirestore; }
    }, [getSetting]);

    const persist = async (newItems) => {
        try { await updateGlobalSettings({ nav_items: newItems }); showToast('תפריט הניווט עודכן', 'success'); }
        catch { showToast('שגיאה בשמירת התפריט', 'error'); }
    };
    const handleReorder = (newItems) => { setItems(newItems); itemsRef.current = newItems; };
    const handleDragEnd = () => persist(itemsRef.current);
    const toggleVisibility = async (id) => {
        const newItems = items.map(item => item.id === id ? { ...item, visible: !item.visible } : item);
        setItems(newItems); itemsRef.current = newItems; await persist(newItems);
    };
    const handleReset = async () => {
        const reset = DEFAULT_NAV_ITEMS.map(d => ({ ...d, visible: true }));
        setItems(reset); itemsRef.current = reset; await persist(reset);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleReset} className="text-[11px] text-[#AEAEB2] hover:text-[#007AFF] transition-colors font-bold">איפוס לברירת מחדל</button>
                <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right">גרור לשינוי סדר • מתג להסתרה / הצגה</p>
            </div>
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item) => (
                    <Reorder.Item key={item.id} value={item} onDragEnd={handleDragEnd}
                        style={{ opacity: item.visible === false ? 0.45 : 1, listStyle: 'none' }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing group hover:border-[#007AFF]/30 transition-colors select-none">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#AEAEB2" className="shrink-0 group-hover:fill-[#007AFF] transition-colors">
                            <rect x="3" y="3.5" width="10" height="1.5" rx="0.75" /><rect x="3" y="7.25" width="10" height="1.5" rx="0.75" /><rect x="3" y="11" width="10" height="1.5" rx="0.75" />
                        </svg>
                        <span className="text-xl shrink-0">{NAV_ICONS[item.id] || '🔗'}</span>
                        <div className="flex-1 text-right">
                            <p className="text-sm font-bold text-[#1D1D1F]">{item.defaultLabel}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.path}</p>
                        </div>
                        <AdminToggle value={item.visible !== false} onChange={() => toggleVisibility(item.id)} />
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
};

// ─── Sidebar Section Manager ──────────────────────────────────────────────────
const DEFAULT_SIDEBAR_SECTIONS = [
    { id: 'pd-features', labelKey: 'sidebar_label_features', defaultLabel: 'תכונות בולטות',      emoji: '⚡', visKey: 'sidebar_vis_features' },
    { id: 'pd-dims',     labelKey: 'sidebar_label_dims',     defaultLabel: 'מידות המוצר',         emoji: '📏', visKey: 'sidebar_vis_dims' },
    { id: 'pd-specs',    labelKey: 'sidebar_label_specs',    defaultLabel: 'מפרט טכני',           emoji: '🔧', visKey: 'sidebar_vis_specs' },
    { id: 'pd-warranty', labelKey: 'sidebar_label_warranty', defaultLabel: 'תנאי רכישה ואחריות', emoji: '📋', visKey: 'sidebar_vis_warranty' },
    { id: 'pd-support',  labelKey: 'sidebar_label_support',  defaultLabel: 'שירות ותמיכה',        emoji: '🎧', visKey: 'sidebar_vis_support' },
    { id: 'pd-qa',       labelKey: 'sidebar_label_qa',       defaultLabel: 'שאלות גולשים',        emoji: '❓', visKey: 'sidebar_vis_qa' },
    { id: 'pd-reviews',  labelKey: 'sidebar_label_reviews',  defaultLabel: 'חוות דעת',            emoji: '⭐', visKey: 'sidebar_vis_reviews' },
];

const SidebarSectionManager = ({ showToast }) => {
    const { getSetting, updateGlobalSettings } = useSettings();
    const buildItems = () => {
        const order = getSetting('sidebar_sections_order', null);
        const base = Array.isArray(order) ? order.map(id => DEFAULT_SIDEBAR_SECTIONS.find(s => s.id === id)).filter(Boolean) : DEFAULT_SIDEBAR_SECTIONS;
        return base.map(s => ({ ...s, visible: getSetting(s.visKey, true), label: getSetting(s.labelKey, s.defaultLabel) }));
    };
    const [items, setItems] = useState(buildItems);
    const itemsRef = React.useRef(items);

    useEffect(() => { const u = buildItems(); setItems(u); itemsRef.current = u; }, [getSetting]);

    const persist = async (newItems) => {
        const updates = { sidebar_sections_order: newItems.map(s => s.id) };
        newItems.forEach(s => { updates[s.visKey] = s.visible; updates[s.labelKey] = s.label; });
        try { await updateGlobalSettings(updates); showToast('סרגל הניווט עודכן', 'success'); }
        catch { showToast('שגיאה בשמירה', 'error'); }
    };
    const handleReorder = (n) => { setItems(n); itemsRef.current = n; };
    const handleDragEnd = () => persist(itemsRef.current);
    const toggleVisibility = async (id) => {
        const n = items.map(s => s.id === id ? { ...s, visible: !s.visible } : s);
        setItems(n); itemsRef.current = n; await persist(n);
    };
    const updateLabel = (id, label) => {
        const n = items.map(s => s.id === id ? { ...s, label } : s);
        setItems(n); itemsRef.current = n;
    };
    const handleReset = async () => {
        const r = DEFAULT_SIDEBAR_SECTIONS.map(s => ({ ...s, visible: true, label: s.defaultLabel }));
        setItems(r); itemsRef.current = r; await persist(r);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <button onClick={handleReset} className="text-[11px] text-[#AEAEB2] hover:text-[#5856D6] transition-colors font-bold">איפוס לברירת מחדל</button>
                <p className="text-[11px] font-black text-[#86868B] uppercase tracking-widest text-right">גרור לשינוי סדר • מתג להסתרה / הצגה</p>
            </div>
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item) => (
                    <Reorder.Item key={item.id} value={item} onDragEnd={handleDragEnd}
                        style={{ opacity: item.visible === false ? 0.45 : 1, listStyle: 'none' }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing group hover:border-[#5856D6]/30 transition-colors select-none">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#AEAEB2" className="shrink-0 group-hover:fill-[#5856D6] transition-colors">
                            <rect x="3" y="3.5" width="10" height="1.5" rx="0.75" /><rect x="3" y="7.25" width="10" height="1.5" rx="0.75" /><rect x="3" y="11" width="10" height="1.5" rx="0.75" />
                        </svg>
                        <span className="text-xl shrink-0">{item.emoji}</span>
                        <div className="flex-1 text-right">
                            <input type="text" value={item.label} onChange={e => updateLabel(item.id, e.target.value)} onBlur={() => persist(itemsRef.current)}
                                className="w-full text-sm font-bold text-[#1D1D1F] bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-[#5856D6] focus:outline-none transition-colors text-right px-0"
                                placeholder={item.defaultLabel} />
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.id}</p>
                        </div>
                        <AdminToggle value={item.visible !== false} onChange={() => toggleVisibility(item.id)} />
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </div>
    );
};

// ─── Videos Section ───────────────────────────────────────────────────────────
const VideosSection = ({ showToast }) => {
    const INITIAL_VIDEOS = [
        { id: 1, title: 'הדרכת מסכי CleverTouch', category: 'מסכים אינטראקטיביים', duration: '12:45', visible: true, thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=300' },
        { id: 2, title: 'הקמת מעבדת STEM מאפס', category: 'מעבדות', duration: '24:20', visible: true, thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=300' },
    ];
    const [videos, setVideos] = useState(INITIAL_VIDEOS);
    const toggleVideo = (id) => { setVideos(prev => prev.map(v => v.id === id ? { ...v, visible: !v.visible } : v)); showToast('סטטוס סרטון עודכן', 'success'); };
    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
                {videos.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-4">
                            <img src={v.thumbnail} className="w-16 h-10 object-cover rounded-lg" alt="" />
                            <div className="text-right"><p className="text-sm font-bold">{v.title}</p><p className="text-[10px] text-gray-400">{v.category} • {v.duration}</p></div>
                        </div>
                        <AdminToggle value={v.visible} onChange={() => toggleVideo(v.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Magazine Section ─────────────────────────────────────────────────────────
const EMPTY_ARTICLE = { title: '', category: '', excerpt: '', date: '', readTime: '', image: '', url: '', source: '' };

const MagazineSection = ({ showToast }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // article being edited (or 'new')
    const [form, setForm] = useState(EMPTY_ARTICLE);

    useEffect(() => {
        const q = query(collection(db, 'magazine_articles'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return unsub;
    }, []);

    const openNew = () => { setForm(EMPTY_ARTICLE); setEditing('new'); };
    const openEdit = (a) => { setForm({ title: a.title || '', category: a.category || '', excerpt: a.excerpt || '', date: a.date || '', readTime: a.readTime || '', image: a.image || '', url: a.url || '', source: a.source || '' }); setEditing(a.id); };
    const closeEdit = () => { setEditing(null); setForm(EMPTY_ARTICLE); };

    const handleSave = async () => {
        if (!form.title || !form.url) { showToast('כותרת וקישור הם שדות חובה', 'error'); return; }
        try {
            if (editing === 'new') {
                await addDoc(collection(db, 'magazine_articles'), { ...form, createdAt: serverTimestamp() });
                showToast('כתבה נוספה', 'success');
            } else {
                await updateDoc(doc(db, 'magazine_articles', editing), form);
                showToast('כתבה עודכנה', 'success');
            }
            closeEdit();
        } catch { showToast('שגיאה בשמירה', 'error'); }
    };

    const handleDelete = async (id) => {
        try { await deleteDoc(doc(db, 'magazine_articles', id)); showToast('כתבה נמחקה', 'success'); }
        catch { showToast('שגיאה במחיקה', 'error'); }
    };

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const inputCls = 'w-full px-3 py-2 rounded-xl text-sm text-[#1D1D1F] outline-none bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#007AFF]/30 transition-all';

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={openNew}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black text-white bg-[#007AFF] hover:bg-[#0066CC] transition-colors">
                    <Plus size={13} /> כתבה חדשה
                </button>
                <p className="text-[11px] text-[#86868B] font-bold">
                    {articles.length} כתבות · מוצגות בסדר כרונולוגי הפוך
                </p>
            </div>

            {loading && <p className="text-[#AEAEB2] text-sm text-center py-8">טוען...</p>}

            {!loading && articles.length === 0 && !editing && (
                <div className="py-12 text-center text-[#AEAEB2]">
                    <p className="font-bold mb-1">אין כתבות עדיין</p>
                    <p className="text-sm">לחץ על "כתבה חדשה" להוספה</p>
                </div>
            )}

            <AnimatePresence>
                {articles.map(a => (
                    <motion.div key={a.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white hover:border-[#007AFF]/20 transition-colors group">
                        {a.image && (
                            <img src={a.image} alt="" className="w-14 h-10 object-cover rounded-lg shrink-0 bg-gray-100" onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div className="flex-1 min-w-0 text-right">
                            <p className="text-sm font-black text-[#1D1D1F] truncate">{a.title}</p>
                            <p className="text-[10px] text-[#AEAEB2] truncate">{a.category} · {a.source}</p>
                        </div>
                        <a href={a.url} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 p-1.5 rounded-lg hover:bg-[#007AFF]/08 text-[#AEAEB2] hover:text-[#007AFF] transition-colors">
                            <ExternalLink size={13} />
                        </a>
                        <button onClick={() => openEdit(a)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-[#007AFF]/08 text-[#AEAEB2] hover:text-[#007AFF] transition-colors">
                            <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(a.id)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-[#FF3B30]/08 text-[#AEAEB2] hover:text-[#FF3B30] transition-colors">
                            <Trash2 size={13} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Edit / New form */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="rounded-2xl border border-[#007AFF]/20 bg-[#F5F9FF] p-5 space-y-3 mt-2"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <button onClick={closeEdit} className="text-[#AEAEB2] hover:text-[#FF3B30] transition-colors"><X size={16} /></button>
                            <p className="text-sm font-black text-[#1D1D1F]">{editing === 'new' ? 'כתבה חדשה' : 'עריכת כתבה'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">כותרת *</label><input className={inputCls} dir="rtl" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="כותרת הכתבה" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">קטגוריה</label><input className={inputCls} dir="rtl" value={form.category} onChange={e => setField('category', e.target.value)} placeholder="חדשנות פדגוגית" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">תקציר</label><textarea className={`${inputCls} resize-none`} dir="rtl" rows={2} value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} placeholder="תיאור קצר..." /></div>
                        <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">קישור לכתבה *</label><input className={inputCls} dir="ltr" value={form.url} onChange={e => setField('url', e.target.value)} placeholder="https://..." /></div>
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">מקור</label><input className={inputCls} dir="rtl" value={form.source} onChange={e => setField('source', e.target.value)} placeholder="eSchool News" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">תאריך</label><input className={inputCls} dir="rtl" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="ינואר 2026" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">זמן קריאה</label><input className={inputCls} dir="rtl" value={form.readTime} onChange={e => setField('readTime', e.target.value)} placeholder="5 דקות קריאה" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1 text-right">תמונה (URL)</label><input className={inputCls} dir="ltr" value={form.image} onChange={e => setField('image', e.target.value)} placeholder="https://images.unsplash.com/..." /></div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={closeEdit} className="flex-1 py-2 rounded-xl text-[12px] font-black text-[#86868B] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors">ביטול</button>
                            <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-[12px] font-black text-white bg-[#007AFF] hover:bg-[#0066CC] transition-colors">שמור כתבה</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Grouped Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ activeSection, setActiveSection }) {
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(() => Object.fromEntries(SECTION_GROUPS.map(g => [g.label, true])));

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return SECTION_GROUPS;
        const q = search.toLowerCase();
        return SECTION_GROUPS.map(g => ({
            ...g,
            sections: g.sections.filter(id => {
                const sec = ALL_SECTIONS.find(s => s.id === id);
                return sec && sec.label.toLowerCase().includes(q);
            }),
        })).filter(g => g.sections.length > 0);
    }, [search]);

    const toggleGroup = (label) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

    return (
        <div className="w-56 shrink-0 flex flex-col gap-2.5">
            {/* Search */}
            <div className="relative">
                <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="חפש קטע..."
                    dir="rtl"
                    className="w-full pr-9 pl-4 py-2.5 bg-white rounded-2xl border border-gray-100 text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                    style={CARD_STYLE}
                />
            </div>

            {/* Groups */}
            <div className="flex-1 overflow-y-auto rounded-[20px] bg-white" style={CARD_STYLE}>
                {filteredGroups.map((group, gi) => (
                    <div key={group.label} className={gi > 0 ? 'border-t border-black/[0.04]' : ''}>
                        {/* Group header */}
                        <button
                            onClick={() => toggleGroup(group.label)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-right hover:bg-black/[0.02] transition-colors"
                        >
                            <motion.span
                                animate={{ rotate: collapsed[group.label] ? -90 : 0 }}
                                transition={{ duration: 0.18 }}
                                className="shrink-0"
                            >
                                <ChevronDown size={11} className="text-[#AEAEB2]" />
                            </motion.span>
                            <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-[0.15em] flex-1 text-right">{group.label}</span>
                        </button>

                        {/* Sections */}
                        <AnimatePresence initial={false}>
                            {!collapsed[group.label] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                    className="overflow-hidden"
                                >
                                    {group.sections.map(id => {
                                        const sec = ALL_SECTIONS.find(s => s.id === id);
                                        if (!sec) return null;
                                        const isActive = activeSection === id;
                                        return (
                                            <button
                                                key={id}
                                                onClick={() => setActiveSection(id)}
                                                className="w-full flex items-center gap-2.5 pr-3 pl-4 py-2.5 text-right transition-all border-r-[3px]"
                                                style={{
                                                    background: isActive ? `${sec.accent}10` : 'transparent',
                                                    borderRightColor: isActive ? sec.accent : 'transparent',
                                                }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isActive ? sec.accent : '#AEAEB2' }} />
                                                <span
                                                    className="text-[12px] font-semibold flex-1 text-right leading-snug"
                                                    style={{ color: isActive ? sec.accent : '#6E6E73' }}
                                                >
                                                    {sec.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Collect all field defaults from FIELD_SECTIONS (used for auto-seed) ──────
const ALL_FIELD_DEFAULTS = (() => {
    const defaults = {};
    FIELD_SECTIONS.forEach(s => (s.fields || []).forEach(f => {
        if (f.default !== undefined) defaults[f.key] = f.default;
    }));
    return defaults;
})();

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminContent({ showToast }) {
    const [activeSection, setActiveSection] = useState('visibility');
    const [content, setContent] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const { updateGlobalSettings, seedMissingDefaults, firestoreLoaded } = useSettings();

    // Auto-seed any FIELD_SECTIONS defaults that are missing from Firestore.
    // Runs once after Firestore has loaded — only writes keys that don't exist yet.
    // This means adding a new field + default in FIELD_SECTIONS is the ONLY step needed;
    // Firestore is updated automatically on next admin panel load.
    useEffect(() => {
        if (firestoreLoaded) seedMissingDefaults(ALL_FIELD_DEFAULTS);
    }, [firestoreLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LS_KEY);
            if (savedData) setContent(JSON.parse(savedData));
            else {
                setContent(ALL_FIELD_DEFAULTS);
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
            await updateGlobalSettings(content);
            localStorage.setItem(LS_KEY, JSON.stringify(content));
            window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY, newValue: JSON.stringify(content) }));
            setSaved(true);
            setHasChanges(false);
            showToast('כל השינויים נשמרו בסנכרון ענן מלא', 'success');
            setTimeout(() => setSaved(false), 2000);
        } catch {
            showToast('שגיאה בסנכרון הנתונים', 'error');
        }
    };

    const handleReset = (section) => {
        const updates = {};
        (section.fields || []).forEach(f => { updates[f.key] = f.default; });
        setContent(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
        setSaved(false);
    };

    const currentDef = ALL_SECTIONS.find(s => s.id === activeSection);

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ניהול תוכן האתר"
                subtitle="ערוך טקסטים, תמונות, והגדרות — הכל מסונכרן לענן בזמן אמת"
                action={
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-[#FF9500] text-xs font-bold">
                                יש שינויים שטרם נשמרו
                            </motion.span>
                        )}
                        <AdminButton onClick={handleSave}>
                            {saved ? '✓ נשמר!' : 'שמור שינויים'}
                        </AdminButton>
                    </div>
                }
            />

            <div className="flex gap-5 items-start">
                {/* Grouped Sidebar */}
                <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-[20px] overflow-hidden" style={CARD_STYLE}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.18 }}
                        >
                            {activeSection === 'visibility' && (
                                <VisibilitySection content={content} onChange={handleChange} />
                            )}
                            {activeSection === 'menu_reorder' && (
                                <NavMenuManager showToast={showToast} />
                            )}
                            {activeSection === 'sidebar_sections' && (
                                <SidebarSectionManager showToast={showToast} />
                            )}
                            {activeSection === 'videos' && (
                                <VideosSection showToast={showToast} />
                            )}
                            {activeSection === 'magazine' && (
                                <MagazineSection showToast={showToast} />
                            )}
                            {currentDef && currentDef.fields && activeSection !== 'sidebar_sections' && (
                                <div className="p-8">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between mb-8 pb-5 border-b border-black/[0.05]">
                                        <AdminButton variant="outline" size="sm" onClick={() => handleReset(currentDef)}>
                                            איפוס לברירת מחדל
                                        </AdminButton>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end mb-1">
                                                <div className="w-2 h-6 rounded-full shrink-0" style={{ background: currentDef.accent }} />
                                                <h3 className="text-xl font-black text-[#1D1D1F]">{currentDef.label}</h3>
                                            </div>
                                            <p className="text-[#AEAEB2] text-xs">
                                                {currentDef.fields.length} שדות
                                            </p>
                                        </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="space-y-5">
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
