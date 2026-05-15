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
    Eye, Layout, Type, Image as ImageIcon, Search, Menu,
    ShoppingCart, ShoppingBag, Plus, Trash2, Save, RotateCcw,
    ChevronDown, ArrowRightLeft, ChevronRight, ExternalLink, Edit2, X,
    Palette, Navigation, Award, Layers, LayoutGrid, UserCircle, Package,
    Ruler, Shield, Headphones, HelpCircle, Info, Clock, Phone, Compass,
    Heart, BookOpen, Bot, MessageSquare, Video, Wrench, Settings, Home,
    FileText, Star, List, Play, Newspaper, Link2, PanelBottom,
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { STATIC_ARTICLES, CATEGORY_COLORS } from '../../utils/magazineArticles';

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
    { key: 'vis_whatsapp',          label: 'כפתור וואטסאפ (צף)',    desc: 'הצגת כפתור וואטסאפ בווידג׳ט הצף', icon: '💬' },
    { key: 'vis_phone',             label: 'כפתור טלפון (צף)',      desc: 'הצגת כפתור טלפון בווידג׳ט הצף', icon: '📞' },
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
            { key: 'maintenance_title',  label: 'כותרת עמוד התחזוקה',   type: 'text',     default: 'האתר בתחזוקה' },
            { key: 'maintenance_msg',    label: 'הודעה בעמוד התחזוקה',  type: 'textarea', default: 'אנחנו משפרים את החוויה עבורכם. נחזור בקרוב.' },
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
            { key: 'hero_eyebrow',     label: 'תווית Badge עליונה', type: 'text',     default: 'הדור הבא של טכנולוגיה לחינוך' },
            { key: 'hero_headline',    label: 'כותרת ראשית',    type: 'text',     default: 'חדשנות חסרת פשרות.' },
            { key: 'hero_subline',     label: 'כותרת משנה',     type: 'text',     default: 'מקצוענות בכל מרחב למידה.' },
            { key: 'hero_description', label: 'תיאור',          type: 'textarea', default: 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.' },
            { key: 'hero_cta',         label: 'טקסט כפתור הגלילה', type: 'text',     default: 'גלו את הפתרונות שלנו' },
            { key: 'hero_bg_image',    label: 'תמונת רקע',     type: 'image',    default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80' },
            { key: 'hero_trust_pill_1',label: 'תג אמון 1',     type: 'text',     default: 'שירות ישיר ומהיר' },
            { key: 'hero_trust_pill_2',label: 'תג אמון 2',     type: 'text',     default: 'ייעוץ ללא עלות' },
            { key: 'hero_trust_pill_3',label: 'תג אמון 3',     type: 'text',     default: '+500 מוסדות חינוך' },
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
        label: 'אמון ומוסדות',
        icon: '🧱',
        accent: '#FF9500',
        fields: [
            { key: 'sp_label',       label: 'כותרת שורת המוסדות',         type: 'text',     default: 'נבחר על ידי מעל 500 מוסדות חינוך ועיריות מובילות' },
            { key: 'sp_clients',     label: 'שמות מוסדות (מופרדים בפסיק)',  type: 'textarea', default: 'משרד החינוך, רשת אורט, עיריית תל אביב, אוניברסיטת אריאל, רשת עמל' },
            { key: 'eco_title',      label: 'מרחב הלמידה: כותרת',          type: 'text',     default: 'למידה שיוצאת מהמסגרת' },
            { key: 'eco_desc',       label: 'מרחב הלמידה: תיאור',          type: 'textarea', default: 'חקור את אקו-סיסטם הלמידה השלם שלנו. פתרונות שמשתלבים אחד בשני ליצירת חוויה פדגוגית חלקה.' },
            { key: 'eco_eyebrow',    label: 'מרחב הלמידה: תווית Badge',    type: 'text',     default: 'האקוסיסטם שלנו' },
            { key: 'eco_hint',       label: 'מרחב הלמידה: כפתור מוצרים',  type: 'text',     default: 'לחץ על הנקודות הכחולות' },
            { key: 'eco_bg_image',   label: 'מרחב הלמידה: תמונת רקע',     type: 'image',    default: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=85&w=1600' },
            { key: 'eco_added',      label: 'הודעת "נוסף לעגלה"',          type: 'text',     default: 'נוסף' },
            { key: 'eco_remove',     label: 'כפתור "הסר מהעגלה"',          type: 'text',     default: 'הסר מהעגלה' },
            { key: 'eco_add',        label: 'כפתור "הוסף לעגלה"',          type: 'text',     default: 'הוסף' },
            { key: 'eco_more_info',  label: 'כפתור "פרטים נוספים"',        type: 'text',     default: 'פרטים נוספים ←' },
        ],
    },
    {
        id: 'homepage_vp',
        label: 'יתרונות (Value Props)',
        icon: '⭐',
        accent: '#34C759',
        fields: [
            { key: 'vp_title',       label: 'כותרת הסקציה',    type: 'text',     default: 'סטנדרט חדש של שירות למוסדות חינוך' },
            { key: 'vp_label',       label: 'תווית-על הסקציה', type: 'text',     default: 'מה שמייחד אותנו' },
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
        label: 'כרטיסי מוצרים',
        icon: '🟦',
        accent: '#007AFF',
        fields: [
            { key: 'feat1_title', label: 'כרטיס 1: כותרת', type: 'text',     default: 'מסכים אינטראקטיביים' },
            { key: 'feat1_desc',  label: 'כרטיס 1: תיאור', type: 'textarea', default: 'מסכי מגע חכמים לכל גודל כיתה' },
            { key: 'feat1_img',   label: 'כרטיס 1: תמונה', type: 'image',    default: 'https://images.pexels.com/photos/5082567/pexels-photo-5082567.jpeg?auto=compress&cs=tinysrgb&w=1200' },
            { key: 'feat2_title', label: 'כרטיס 2: כותרת', type: 'text',     default: 'מחשוב לחינוך' },
            { key: 'feat2_desc',  label: 'כרטיס 2: תיאור', type: 'textarea', default: 'מחשבים וטאבלטים לצוות ותלמידים' },
            { key: 'feat2_img',   label: 'כרטיס 2: תמונה', type: 'image',    default: 'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=1200' },
            { key: 'feat3_title', label: 'כרטיס 3: כותרת', type: 'text',     default: 'מעבדות STEM' },
            { key: 'feat3_desc',  label: 'כרטיס 3: תיאור', type: 'textarea', default: 'ציוד מחקר וחדשנות לתלמידים' },
            { key: 'feat3_img',   label: 'כרטיס 3: תמונה', type: 'image',    default: 'https://images.pexels.com/photos/4144096/pexels-photo-4144096.jpeg?auto=compress&cs=tinysrgb&w=1200' },
            { key: 'feat4_title', label: 'כרטיס 4: כותרת', type: 'text',     default: 'אודיו ווידאו' },
            { key: 'feat4_desc',  label: 'כרטיס 4: תיאור', type: 'textarea', default: 'מערכות שמע ומצלמות למרחבי למידה' },
            { key: 'feat4_img',   label: 'כרטיס 4: תמונה', type: 'image',    default: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=1200' },
        ],
    },
    {
        id: 'shoppable_image',
        label: 'תמונה אינטראקטיבית עם Hotspots',
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
            { key: 'contact_phone',        label: 'טלפון ליצירת קשר',  type: 'text',     default: '058-5856356' },
            { key: 'whatsapp_number',      label: 'מספר וואטסאפ',      type: 'text',     default: '972585856356' },
        ],
    },
    {
        id: 'expert_consultation',
        label: 'ייעוץ מומחה',
        icon: '🎓',
        accent: '#34C759',
        fields: [
            { key: 'expert_title',      label: 'כותרת ייעוץ מומחה', type: 'text',     default: 'בואו נרכיב יחד את הפתרון המושלם למוסד שלכם.' },
            { key: 'expert_desc',       label: 'תיאור הייעוץ',       type: 'textarea', default: 'יועץ טכנולוגי מנוסה יאפיין את הצרכים שלכם ויבנה עבורכם פתרון מדויק.' },
            { key: 'expert_cta',        label: 'טקסט כפתור הזמנה',   type: 'text',     default: 'קבל ייעוץ חינמי' },
            { key: 'expert_form_title', label: 'כותרת טופס ההרשמה',  type: 'text',     default: 'השאירו פרטים ונחזור אליכם' },
            { key: 'expert_image',      label: 'תמונה',              type: 'image',    default: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop' },
        ],
    },
    {
        id: 'home_discover_products',
        label: 'סקציות מוצרים וגילוי',
        icon: '🔭',
        accent: '#FF9500',
        fields: [
            { key: 'home_products_eyebrow', label: 'מוצרים: תווית Badge',  type: 'text',     default: 'המוצרים שלנו' },
            { key: 'home_products_title',   label: 'מוצרים: כותרת',        type: 'text',     default: 'פתרונות טכנולוגיים מובילים' },
            { key: 'home_products_sub',     label: 'מוצרים: תיאור',        type: 'textarea', default: 'הכלים המתקדמים ביותר לסביבת הלמידה החדשה.' },
            { key: 'home_products_cta1',    label: 'מוצרים: כפתור ראשי',   type: 'text',     default: 'לכל הקטלוג' },
            { key: 'home_products_cta2',    label: 'מוצרים: כפתור משני',   type: 'text',     default: 'השוואת דגמים' },
            { key: 'home_discover_eyebrow', label: 'גילוי: תווית Badge',   type: 'text',     default: 'חדש' },
            { key: 'home_discover_title',   label: 'גילוי: כותרת',         type: 'text',     default: 'גלו מה חדש' },
            { key: 'home_discover_sub',     label: 'גילוי: תיאור',         type: 'textarea', default: 'מוצרים חדשים, מבצעים ועוד.' },
            { key: 'home_discover_cta1',    label: 'גילוי: כפתור ראשי',    type: 'text',     default: 'גלה עוד' },
            { key: 'home_discover_cta2',    label: 'גילוי: כפתור משני',    type: 'text',     default: 'כל המבצעים' },
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
            { key: 'catalog_title',            label: 'כותרת ראשית',         type: 'text',     default: 'הכלים שמעצבים את המחר.' },
            { key: 'catalog_subtitle',         label: 'כותרת משנה',          type: 'textarea', default: 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.' },
            { key: 'catalog_hero_eyebrow',     label: 'תווית עליונה',       type: 'text',     default: 'הקטלוג שלנו' },
            { key: 'catalog_hero_title',       label: 'כותרת Hero',         type: 'text',     default: 'פתרונות טכנולוגיים' },
            { key: 'catalog_hero_subtitle',    label: 'תיאור Hero',         type: 'textarea', default: 'כל מה שצריך לכיתה חכמה' },
            { key: 'catalog_badge',            label: 'תג בסל הקניות (ברירת מחדל: "בסל")', type: 'text',     default: 'בסל' },
            { key: 'catalog_filter_btn',       label: 'כפתור "סינון מתקדם"', type: 'text',     default: 'סינון מתקדם' },
            { key: 'catalog_filter_sub',       label: 'תיאור מתחת לכפתור סינון', type: 'text',     default: 'התאימו את הקטלוג לצרכים שלכם' },
            { key: 'catalog_apply_btn',        label: 'כפתור "החל סינון"',   type: 'text',     default: 'החל סינון' },
            { key: 'catalog_reset_btn',        label: 'כפתור "נקה סינון"',   type: 'text',     default: 'איפוס' },
            { key: 'catalog_sort_label',       label: 'תווית מיון',         type: 'text',     default: 'מיון לפי' },
            { key: 'catalog_sort_rel',         label: 'מיון: רלוונטיות',    type: 'text',     default: 'רלוונטיות' },
            { key: 'catalog_sort_pasc',        label: 'מיון: מחיר עולה',    type: 'text',     default: 'מחיר: מהנמוך לגבוה' },
            { key: 'catalog_sort_pdesc',       label: 'מיון: מחיר יורד',    type: 'text',     default: 'מחיר: מהגבוה לנמוך' },
            { key: 'catalog_sort_name',        label: 'מיון: שם',           type: 'text',     default: 'שם המוצר (א-ת)' },
            { key: 'catalog_view_grid',        label: 'תצוגה: רשת (Grid)',   type: 'text',     default: 'רשת' },
            { key: 'catalog_view_list',        label: 'תצוגה: רשימה (List)', type: 'text',     default: 'רשימה' },
            { key: 'catalog_price_label',      label: 'תווית "טווח מחיר"',  type: 'text',     default: 'טווח מחיר (₪)' },
            { key: 'catalog_price_max',        label: 'מחיר מקסימלי (Slider)', type: 'text',     default: '50000' },
            { key: 'catalog_tags_label',       label: 'תווית תגיות',       type: 'text',     default: 'תגיות' },
            { key: 'catalog_empty_msg',        label: 'הודעת "לא נמצאו מוצרים"', type: 'text',     default: 'לא נמצאו מוצרים' },
            { key: 'catalog_empty_hint',       label: 'רמז לשינוי הסינון',      type: 'text',     default: 'נסה קטגוריה אחרת' },
            { key: 'catalog_all_cat',          label: 'תווית "הכל" (קטגוריות)', type: 'text',     default: 'הכל' },
            { key: 'catalog_search_hint',      label: 'רמז חיפוש',         type: 'text',     default: 'חפש בין מאות פתרונות...' },
            { key: 'catalog_inst_price',       label: 'תווית "מחיר מוסדי"',         type: 'text',     default: 'מחיר מוסדי' },
            { key: 'catalog_add_to_cart',      label: 'כפתור "הוסף לעגלה"',         type: 'text',     default: 'הוסף לסל' },
            { key: 'catalog_request_quote',    label: 'כפתור "בקש הצעת מחיר"',      type: 'text',     default: 'בקש הצעה' },
            { key: 'catalog_added_msg',        label: 'הודעת הצלחה "נוסף!"',         type: 'text',     default: 'נוסף לסל בהצלחה' },
            { key: 'catalog_remove_msg',       label: 'הודעת הסרה מהעגלה',          type: 'text',     default: 'הוסר מהסל' },
            { key: 'catalog_inst_price_label', label: 'תווית מחיר מוסדי בכרטיס מוצר', type: 'text', default: 'מחיר מוסדי מאושר' },
            { key: 'catalog_filter_drawer_title', label: 'כותרת מגירת סינון', type: 'text',  default: 'סינון מתקדם' },
            { key: 'catalog_filter_drawer_sub',   label: 'תיאור מגירת סינון', type: 'text',  default: 'התאם את הקטלוג לצרכי המוסד שלך' },
            { key: 'catalog_categories',       label: 'קטגוריות המוצרים (מופרדות בפסיק)', type: 'textarea', default: 'מסכים אינטראקטיביים והקרנה, מחשוב לצוות ותלמידים, מעבדות STEM ומרחבי חדשנות, אודיו ווידאו למרחבי למידה, תשתיות ועגלות טעינה' },
        ],
    },
    {
        id: 'product_detail',
        label: 'דף מוצר',
        icon: '📦',
        accent: '#FF9500',
        fields: [
            { key: 'pd_home',                label: 'Breadcrumb: בית',      type: 'text', default: 'ראשי' },
            { key: 'pd_catalog',             label: 'Breadcrumb: קטלוג',    type: 'text', default: 'קטלוג' },
            { key: 'pd_buy_now',             label: 'כפתור קנה עכשיו',     type: 'text', default: 'קנה עכשיו' },
            { key: 'pd_add_cart',            label: 'כפתור הוסף לסל',      type: 'text', default: 'הוסף לעגלה' },
            { key: 'pd_request_quote',       label: 'כפתור הצעת מחיר',    type: 'text', default: 'שלח פנייה וקבל הצעה' },
            { key: 'pd_request_quote_inst',  label: 'כפתור "בקשה מוסדית"', type: 'text', default: 'בקש הצעת מחיר מוסדית' },
            { key: 'pd_quick_inquiry',       label: 'כפתור פנייה מהירה',  type: 'text', default: 'שלח פנייה מהירה' },
            { key: 'pd_live_demo',           label: 'כפתור הדגמה חיה',    type: 'text', default: 'הדגמה חיה' },
            { key: 'pd_more_info',           label: 'כפתור פרטים נוספים', type: 'text', default: 'פרטים נוספים' },
            { key: 'pd_specs_title',         label: 'כותרת "מפרט טכני"',  type: 'text', default: 'מפרט טכני' },
            { key: 'pd_specs_desc',          label: 'תיאור מתחת ל"מפרט"', type: 'textarea', default: 'הפרטים המדויקים שהופכים את המערכת הזו למובילה מסוגה.' },
            { key: 'pd_acc_title',           label: 'כותרת "אביזרים נוספים"', type: 'text', default: 'השלם את המערכת שלך' },
            { key: 'pd_acc_optional',        label: 'תווית אופציונלי',    type: 'text', default: 'אופציונלי' },
            { key: 'pd_success_msg',         label: 'הודעת "נוסף לעגלה בהצלחה"', type: 'text', default: 'נוסף לסל בהצלחה' },
            { key: 'pd_added',               label: 'טקסט כפתור לאחר הוספה', type: 'text', default: 'נוסף' },
            { key: 'pd_remove',              label: 'כפתור "הסר"',           type: 'text', default: 'הסר' },
            { key: 'pd_remove_from_cart',    label: 'הודעת הסרה מהעגלה',     type: 'text', default: 'הסר מהעגלה' },
            { key: 'pd_not_found',           label: 'הודעת מוצר לא נמצא', type: 'text', default: 'המוצר לא נמצא.' },
            { key: 'pd_contact_for_price',   label: 'טקסט "צור קשר למחיר"', type: 'text', default: 'צור קשר להצעת מחיר' },
            { key: 'pd_color_label',         label: 'תווית "בחר צבע"',      type: 'text', default: 'בחירת צבע' },
            { key: 'pd_compare_btn',         label: 'כפתור "הוסף להשוואה"', type: 'text', default: 'השווה דגם' },
            { key: 'pd_compare_selected',    label: 'טקסט "נבחר להשוואה"',  type: 'text', default: 'נבחר להשוואה' },
        ],
    },
    {
        id: 'sidebar_sections',
        label: 'ניווט פנימי בדף מוצר',
        icon: '📋',
        accent: '#5856D6',
    },
    {
        id: 'pd_dims_section',
        label: 'ממדים ומידות',
        icon: '📏',
        accent: '#5856D6',
        fields: [
            { key: 'pd_dims_title',  label: 'כותרת קטע מידות',         type: 'text', default: 'מידות המוצר' },
            { key: 'pd_dims_label1', label: 'ממד 1: שם',              type: 'text', default: 'רוחב' },
            { key: 'pd_dims_value1', label: 'ממד 1: ערך',             type: 'text', default: '' },
            { key: 'pd_dims_label2', label: 'ממד 2: שם',              type: 'text', default: 'גובה' },
            { key: 'pd_dims_value2', label: 'ממד 2: ערך',             type: 'text', default: '' },
            { key: 'pd_dims_label3', label: 'ממד 3: שם',              type: 'text', default: 'עומק' },
            { key: 'pd_dims_value3', label: 'ממד 3: ערך',             type: 'text', default: '' },
            { key: 'pd_dims_label4', label: 'ממד 4: שם',              type: 'text', default: 'משקל' },
            { key: 'pd_dims_value4', label: 'ממד 4: ערך',             type: 'text', default: '' },
            { key: 'pd_dims_label5', label: 'ממד 5: שם (אופציונלי)', type: 'text', default: '' },
            { key: 'pd_dims_value5', label: 'ממד 5: ערך (אופציונלי)',type: 'text', default: '' },
        ],
    },
    {
        id: 'pd_warranty_section',
        label: 'אחריות ותנאי רכישה',
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
        label: 'תמיכה ושירות לקוחות',
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
        label: 'שאלות נפוצות (FAQ)',
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
        label: 'ביקורות וסקירות לקוחות',
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
        label: 'אביזרים ומוצרים נלווים',
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
            { key: 'ai_fab_label',     label: 'תווית כפתור הצף',           type: 'text',     default: 'העוזר החכם' },
            { key: 'ai_title',         label: 'שם העוזר',                  type: 'text',     default: 'NextClass AI' },
            { key: 'ai_role',          label: 'תפקיד (מוצג מתחת לשם)',     type: 'text',     default: 'Institutional Concierge' },
            { key: 'ai_greeting',      label: 'ברכה ראשונית (כללי)',       type: 'textarea', default: 'שלום! אני כאן כדי לעזור לך לאפיין את הכיתה החכמה המושלמת. מה תרצה לדעת?' },
            { key: 'ai_greeting_home', label: 'ברכה בדף הבית',            type: 'textarea', default: 'שלום! אני הקונסיירז׳ של NextClass. איך אוכל לעזור לכם היום?' },
            { key: 'ai_greeting_pd',   label: 'ברכה בדף מוצר',            type: 'textarea', default: 'שלום! האם תרצו לקבל מפרט טכני מלא או הצעת מחיר?' },
            { key: 'ai_placeholder',   label: 'Placeholder בשדה ההקלדה', type: 'text',     default: 'מה תרצו לבדוק?' },
            { key: 'ai_wa_label',      label: 'כותרת כרטיס וואטסאפ',      type: 'text',     default: 'מענה אנושי בוואטסאפ' },
            { key: 'ai_wa_status',     label: 'סטטוס וואטסאפ',             type: 'text',     default: 'יועץ טכנולוגי זמין כעת' },
            { key: 'ai_chip1',         label: 'צ׳יפ מהיר 1',               type: 'text',     default: 'הצעת מחיר' },
            { key: 'ai_chip2',         label: 'צ׳יפ מהיר 2',               type: 'text',     default: 'מפרט טכני' },
            { key: 'ai_chip3',         label: 'צ׳יפ מהיר 3',               type: 'text',     default: 'ייעוץ' },
            { key: 'ai_suggestion_1',  label: 'הצעת שיחה 1',               type: 'text',     default: 'אני מחפש מסך לכיתה של 30 תלמידים' },
            { key: 'ai_suggestion_2',  label: 'הצעת שיחה 2',               type: 'text',     default: 'מה מחיר ל-20 מחשבים?' },
            { key: 'ai_thinking',      label: 'הודעת "חושב..."',           type: 'text',     default: 'חושב...' },
        ],
    },
    {
        id: 'contact_page',
        label: 'צור קשר',
        icon: '📞',
        accent: '#34C759',
        fields: [
            { key: 'contact_hero_title',      label: 'כותרת עמוד הקשר',   type: 'text',     default: 'הכיתה שלכם מחכה. בואו נתחיל.' },
            { key: 'contact_hero_subtitle',   label: 'תיאור עמוד הקשר',   type: 'textarea', default: 'אנחנו כאן בשבילכם — שירות ישיר, מהיר ומקצועי מהרגע הראשון.' },
            { key: 'contact_concierge_title', label: 'כותרת "דבר איתנו"', type: 'text',     default: 'ייעוץ אישי ומיידי' },
            { key: 'contact_concierge_desc',  label: 'תיאור "דבר איתנו"', type: 'textarea', default: 'נציג מקצועי מחכה לכם עכשיו כדי לאפיין את הפתרון המדויק למוסד שלכם.' },
            { key: 'contact_form_title',      label: 'כותרת טופס הפנייה', type: 'text',     default: 'בואו נצא לדרך.' },
            { key: 'contact_form_desc',       label: 'תיאור טופס הפנייה', type: 'textarea', default: 'השאירו פרטים ונחזור אליכם עם חבילה מותאמת אישית.' },
            { key: 'contact_form_btn',        label: 'כפתור שליחת הפנייה',type: 'text',     default: 'שלח פנייה' },
            { key: 'contact_success_title',   label: 'הצלחה: כותרת',      type: 'text',     default: 'הפנייה התקבלה' },
            { key: 'contact_success_msg',     label: 'הצלחה: הודעה',       type: 'textarea', default: 'הצוות שלנו כבר מעבד את הבקשה שלך. נחזור אליך תוך פחות מ-24 שעות.' },
            { key: 'contact_label_name',      label: 'תווית שדה: שם מלא',  type: 'text',     default: 'שם מלא' },
            { key: 'contact_label_inst',      label: 'תווית שדה: מוסד / חברה', type: 'text', default: 'מוסד / חברה' },
            { key: 'contact_label_msg',       label: 'תווית שדה: הודעה',   type: 'text',     default: 'איך נוכל לעזור?' },
            { key: 'contact_trust_title',     label: 'כותרת "שותפות"',     type: 'text',     default: 'שותפות ארוכת טווח' },
            { key: 'contact_trust_desc',      label: 'תיאור "שותפות"',     type: 'textarea', default: 'אנחנו לא רק ספקים. אנחנו השותפים שלכם לכל אורך הדרך – מאפיון הצרכים ועד לשירות טכני מלא בכיתה.' },
            { key: 'contact_phone',           label: 'טלפון',                        type: 'text',     default: '058-5856356' },
            { key: 'contact_email',           label: 'מייל',                         type: 'text',     default: 'nextclass.en@gmail.com' },
            { key: 'whatsapp_number',         label: 'מספר וואטסאפ (ספרות בלבד)',   type: 'text',     default: '972585856356' },
            { key: 'contact_address',         label: 'כתובת',             type: 'text',     default: 'בראלי 10, תל אביב' },
            { key: 'contact_hours',           label: 'שעות פעילות',       type: 'text',     default: 'ראשון–חמישי 08:00–18:00' },
            { key: 'contact_wa_label',        label: 'תווית כרטיס וואטסאפ', type: 'text',     default: 'זמינים ב-WhatsApp' },
            { key: 'contact_wa_btn',          label: 'כפתור "התחל שיחה"',   type: 'text',     default: 'התחל שיחה עכשיו' },
            { key: 'contact_time_hint',       label: 'תווית שעון (תל אביב)',type: 'text',     default: 'זמן נוכחי במטה בתל אביב: ' },
            { key: 'contact_support_label',   label: 'תווית "אנחנו כאן בשבילך"', type: 'text', default: 'אנחנו כאן בשבילך' },
        ],
    },
    {
        id: 'floating_concierge',
        label: 'ווידג׳ט קשר צף (Concierge)',
        icon: '💬',
        accent: '#34C759',
        fields: [
            { key: 'concierge_label',  label: 'תווית כפתור הצף',         type: 'text', default: 'צריכים התייעצות?' },
            { key: 'concierge_header', label: 'כותרת הפאנל',             type: 'text', default: 'דברו איתנו' },
            { key: 'whatsapp_label',   label: 'כרטיס וואטסאפ: תווית',   type: 'text', default: 'וואטסאפ' },
            { key: 'whatsapp_sub',     label: 'כרטיס וואטסאפ: תת-תווית',type: 'text', default: 'מענה מהיר עד שעה' },
            { key: 'phone_label',      label: 'כרטיס טלפון: תווית',      type: 'text', default: 'שיחה עם מומחה' },
            { key: 'phone_sub',        label: 'כרטיס טלפון: תת-תווית',   type: 'text', default: "זמין א'–ה', 9:00–18:00" },
        ],
    },
    {
        id: 'about_page',
        label: 'אודות',
        icon: '📖',
        accent: '#AF52DE',
        fields: [
            { key: 'about_hero_label',    label: 'תווית Badge עליונה',    type: 'text',     default: '' },
            { key: 'about_hero_title',    label: 'כותרת Hero',            type: 'text',     default: 'הטכנולוגיה\nשחינוך ראוי לה.' },
            { key: 'about_hero_sub',      label: 'תיאור Hero',            type: 'textarea', default: 'מקצועי. מהיר. אישי. ישיר.\nהסטנדרט הגבוה ביותר שחינוך יכול לקבל.' },
            { key: 'about_hero_img',      label: 'תמונת Hero',            type: 'image',    default: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=85&w=2400' },
            { key: 'about_story_title',   label: 'כותרת סיפור הייסוד',   type: 'text',     default: 'הכל התחיל ב-2012. עם מסך אחד והרבה תסכול.' },
            { key: 'about_story_section_title', label: 'תווית קטע הסיפור', type: 'text',   default: 'הסיפור שלנו.' },
            { key: 'about_story_body',    label: 'גוף הסיפור',          type: 'textarea', default: 'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם, ציוד שמגיע שבועות מאוחר, ושירות שנגמר ברגע שהחשבונית נחתמה. החלטתי לשנות את המשוואה. NextClass הוא לא פלטפורמה ולא קטלוג — הוא מודל עסקי אחר לגמרי: שירות ישיר, אנושי ומקצועי שמוריד את כל הביניים, ומביא לחינוך הישראלי את הרמה שהוא ראוי לה.' },
            { key: 'about_check_1',       label: '✓ נקודת ערך 1',        type: 'text',     default: 'ייעוץ מקצועי ומהיר — ללא עלות' },
            { key: 'about_check_2',       label: '✓ נקודת ערך 2',        type: 'text',     default: 'שירות אישי וישיר, ללא ביניים' },
            { key: 'about_check_3',       label: '✓ נקודת ערך 3',        type: 'text',     default: 'פתרונות מהדרגה הראשונה לחינוך' },
            { key: 'about_stat1_val',     label: 'נתון 1: מספר',         type: 'text',     default: '1200' },
            { key: 'about_stat1_label',   label: 'נתון 1: תווית',       type: 'text',     default: 'מוסדות חינוך' },
            { key: 'about_stat2_val',     label: 'נתון 2: מספר',         type: 'text',     default: '14' },
            { key: 'about_stat2_label',   label: 'נתון 2: תווית',       type: 'text',     default: 'שנות ניסיון' },
            { key: 'about_stat3_val',     label: 'נתון 3: מספר',         type: 'text',     default: '98' },
            { key: 'about_stat3_label',   label: 'נתון 3: תווית',       type: 'text',     default: '% שביעות רצון' },
            { key: 'about_founder_title', label: 'כותרת מסר המייסד',    type: 'text',     default: 'מקצועיות\nללא פשרות.' },
            { key: 'about_founder_message',label: 'הודעת/ציטוט המייסד', type: 'textarea', default: 'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו: ישירות, מהירות, ורמה שלא מתפשרת. כל שיחה, כל הצעת מחיר, כל אספקה — כולם עוברים דרכי. לא כי אין לי ברירה. כי זו ההבטחה שלי לכל לקוח.' },
            { key: 'about_founder_name',  label: 'שם המייסד',           type: 'text',     default: 'אפרים אמרגי' },
            { key: 'about_founder_role',  label: 'תפקיד המייסד',        type: 'text',     default: 'מייסד ומנכ"ל NextClass' },
            { key: 'about_founder_img',   label: 'תמונת המייסד',        type: 'image',    default: '' },
            { key: 'about_cta_title',     label: 'כותרת קריאה לפעולה', type: 'text',     default: 'שאלו אותנו.\nנגיע עם תשובות.' },
            { key: 'about_cta_desc',      label: 'תיאור קריאה לפעולה', type: 'textarea', default: 'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.' },
            { key: 'about_v1_title',      label: 'ערך 1: כותרת',        type: 'text',     default: 'מחיר שקוף' },
            { key: 'about_v1_desc',       label: 'ערך 1: תיאור',        type: 'textarea', default: 'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — נקודה. שקיפות מלאה מהשקל הראשון ועד האחרון.' },
            { key: 'about_v2_title',      label: 'ערך 2: כותרת',        type: 'text',     default: 'שירות מהיר' },
            { key: 'about_v2_desc',       label: 'ערך 2: תיאור',        type: 'textarea', default: 'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות. מהירות היא לא בונוס אצלנו. היא חלק בלתי נפרד מהרמה.' },
            { key: 'about_v3_title',      label: 'ערך 3: כותרת',        type: 'text',     default: 'רמה מקצועית' },
            { key: 'about_v3_desc',       label: 'ערך 3: תיאור',        type: 'textarea', default: 'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה ממה שהלקוח היה מבקש — כי זה הרף שאנחנו מסרבים לרדת ממנו.' },
            { key: 'about_journey_hint',  label: 'כפתור "גלה הסיפור שלנו"', type: 'text',  default: 'גלה את הסיפור שלנו' },
            { key: 'about_edu_badge',     label: 'תג "מאושר משרד החינוך"', type: 'text',  default: 'מאושרת משרד החינוך' },
            { key: 'about_way_title',     label: 'כותרת "הדרך שעשינו"', type: 'text',     default: 'הדרך שעשינו' },
            { key: 'about_way_desc',      label: 'תיאור "הדרך שעשינו"', type: 'text',     default: 'עשור של פריצות דרך בחינוך הישראלי.' },
            { key: 'about_founder_label', label: 'תווית "מילה מהמייסד"', type: 'text',     default: 'מילה אישית מהמייסד' },
            { key: 'about_values_title',  label: 'כותרת "הערכים שלנו"', type: 'text',     default: 'שלושה כללים' },
            { key: 'about_values_desc',   label: 'תיאור "הערכים שלנו"', type: 'text',     default: 'מה שאמרנו — עמדנו בו. תמיד.' },
        ],
    },
    {
        id: 'about_timeline',
        label: 'ציר זמן אודות',
        icon: '📅',
        accent: '#AF52DE',
        fields: [
            { key: 'about_tm1_year',  label: 'אירוע 1: שנה',    type: 'text',     default: '2012' },
            { key: 'about_tm1_title', label: 'אירוע 1: כותרת',  type: 'text',     default: 'ההתחלה' },
            { key: 'about_tm1_desc',  label: 'אירוע 1: תיאור',  type: 'textarea', default: 'הקמנו את NextClass עם חזון אחד ברור.' },
            { key: 'about_tm2_year',  label: 'אירוע 2: שנה',    type: 'text',     default: '2016' },
            { key: 'about_tm2_title', label: 'אירוע 2: כותרת',  type: 'text',     default: 'צמיחה' },
            { key: 'about_tm2_desc',  label: 'אירוע 2: תיאור',  type: 'textarea', default: 'הגענו ל-200 מוסדות חינוך ברחבי ישראל.' },
            { key: 'about_tm3_year',  label: 'אירוע 3: שנה',    type: 'text',     default: '2020' },
            { key: 'about_tm3_title', label: 'אירוע 3: כותרת',  type: 'text',     default: 'חדשנות' },
            { key: 'about_tm3_desc',  label: 'אירוע 3: תיאור',  type: 'textarea', default: 'השקנו את פלטפורמת הניהול החכמה שלנו.' },
            { key: 'about_tm4_year',  label: 'אירוע 4: שנה',    type: 'text',     default: '2024' },
            { key: 'about_tm4_title', label: 'אירוע 4: כותרת',  type: 'text',     default: 'מנהיגות' },
            { key: 'about_tm4_desc',  label: 'אירוע 4: תיאור',  type: 'textarea', default: '1,200 מוסדות חינוך בחרו בנו.' },
        ],
    },
    {
        id: 'discover_section',
        label: 'עמוד "גלה את NextClass"',
        icon: '🔭',
        accent: '#007AFF',
        fields: [
            { key: 'discover_eyebrow',       label: 'תווית Badge עליונה', type: 'text',     default: 'מה חדש' },
            { key: 'discover_title',         label: 'כותרת הדף',          type: 'text',     default: 'גילויים חדשים' },
            { key: 'discover_desc',          label: 'תיאור הדף',          type: 'textarea', default: 'מוצרים חדשים, מבצעים ועוד.' },
            { key: 'discover_hero_badge',    label: 'תג Hero',             type: 'text',     default: 'מה חדש' },
            { key: 'discover_hero_cta',      label: 'כפתור Hero',          type: 'text',     default: 'גלה עוד' },
            { key: 'discover_new_label',     label: 'תג "חדש"',            type: 'text',     default: 'חדש' },
            { key: 'discover_best_label',    label: 'תג "נמכר ביותר"',     type: 'text',     default: 'פופולרי' },
            { key: 'discover_deals_label',   label: 'תג "מבצע"',           type: 'text',     default: 'מבצע' },
            { key: 'discover_callout_title', label: 'כותרת Callout',       type: 'text',     default: 'פתרון מותאם לכם' },
            { key: 'discover_callout_desc',  label: 'תיאור Callout',       type: 'textarea', default: 'פנו אלינו לקבלת הצעה מותאמת.' },
        ],
    },
    {
        id: 'wishlist_section',
        label: 'עמוד מועדפים',
        icon: '❤️',
        accent: '#FF2D55',
        fields: [
            { key: 'wishlist_badge',       label: 'תג עמוד המועדפים',    type: 'text',     default: 'המוצרים שלי' },
            { key: 'wishlist_title',       label: 'כותרת עמוד המועדפים', type: 'text',     default: 'המוצרים שאהבתי' },
            { key: 'wishlist_count_label', label: 'תווית מספר הפריטים',  type: 'text',     default: 'פריטים שמורים' },
            { key: 'wishlist_empty_title', label: 'כותרת "רשימה ריקה"',  type: 'text',     default: 'הרשימה שלך ריקה' },
            { key: 'wishlist_empty_desc',  label: 'תיאור "רשימה ריקה"',  type: 'textarea', default: 'לחץ על הלב על כרטיס המוצר כדי לשמור אותו כאן' },
            { key: 'wishlist_browse_btn',  label: 'כפתור "עיין בקטלוג"', type: 'text',     default: 'עיין בקטלוג' },
        ],
    },
    {
        id: 'accessibility_section',
        label: 'ווידג׳ט נגישות',
        icon: '♿',
        accent: '#34C759',
        fields: [
            { key: 'a11y_widget_title',    label: 'כותרת ווידג׳ט הנגישות', type: 'text', default: 'מרכז נגישות' },
            { key: 'a11y_widget_subtitle', label: 'תיאור הווידג׳ט',        type: 'text', default: 'התאם את חוויית הגלישה שלך' },
            { key: 'a11y_font_label',      label: 'אפשרות: גופן גדול',    type: 'text', default: 'גודל גופן' },
            { key: 'a11y_contrast_label',  label: 'אפשרות: ניגודיות גבוהה', type: 'text', default: 'ניגוד גבוה' },
            { key: 'a11y_motion_label',    label: 'אפשרות: הפחתת אנימציות', type: 'text', default: 'ביטול אנימציות' },
            { key: 'a11y_links_label',     label: 'אפשרות: הדגשת קישורים', type: 'text', default: 'הדגשת קישורים' },
            { key: 'a11y_grayscale_label', label: 'אפשרות: גווני אפור',   type: 'text', default: 'גווני אפור' },
            { key: 'a11y_reset_label',     label: 'כפתור "איפוס הגדרות"', type: 'text', default: 'איפוס הגדרות נגישות' },
        ],
    },
    {
        id: 'qa_section',
        label: 'מדור שאלות ותשובות',
        icon: '❓',
        accent: '#007AFF',
        fields: [
            { key: 'pd_qa_title',             label: 'כותרת "שאלות גולשים"', type: 'text',     default: 'שאלות ותשובות מהקהילה' },
            { key: 'qa_form_title',           label: 'כותרת טופס השאלה',    type: 'text',     default: 'יש לך שאלה?' },
            { key: 'qa_form_desc',            label: 'תיאור הטופס',          type: 'textarea', default: 'שאל את הקהילה ואת המומחים שלנו.' },
            { key: 'qa_name_placeholder',     label: 'Placeholder: שם',      type: 'text',     default: 'השם שלך (אופציונלי)' },
            { key: 'qa_question_placeholder', label: 'Placeholder: שאלה',    type: 'text',     default: 'מה תרצה לדעת על המוצר?' },
            { key: 'qa_submit_label',         label: 'כפתור "שלח שאלה"',    type: 'text',     default: 'פרסם שאלה' },
            { key: 'qa_submitted_msg',        label: 'הודעת "שאלה התקבלה"', type: 'textarea', default: 'תודה! השאלה שלך פורסמה.' },
            { key: 'qa_empty_msg',            label: 'הודעת "אין שאלות עדיין"', type: 'text', default: 'עדיין אין שאלות על המוצר הזה. היה הראשון לשאול!' },
            { key: 'qa_team_label',           label: 'תווית "צוות NextClass"', type: 'text',  default: 'תשובת צוות NextClass' },
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

// ─── Top-Level Nav Groups (5 clean sections) ──────────────────────────────────
const SECTION_GROUPS = [
    {
        id: 'homepage',
        label: 'דף הבית',
        icon: '🏠',
        accent: '#007AFF',
        subGroups: [
            { label: 'מסך ראשי (מעל הקפל)', sections: ['hero'] },
            { label: 'אמון ושותפות', sections: ['homepage_sections', 'homepage_vp'] },
            { label: 'ויטרינת מוצרים', sections: ['feature_tiles', 'shoppable_image', 'home_discover_products'] },
            { label: 'המרה וייעוץ', sections: ['quote_wizard', 'expert_consultation'] },
        ],
    },
    {
        id: 'pages',
        label: 'עמודים',
        icon: '📄',
        accent: '#5856D6',
        subGroups: [
            { label: 'קטלוג ומנוע חיפוש', sections: ['catalog_full', 'search_section'] },
            { label: 'דף מוצר — פעולות וטקסטים', sections: ['product_detail', 'trust_badges'] },
            { label: 'דף מוצר — תוכן נוסף', sections: ['sidebar_sections', 'pd_dims_section', 'pd_warranty_section', 'pd_support_section', 'pd_faq_section', 'pd_reviews_section', 'accessories_section'] },
            { label: 'עמוד אודות', sections: ['about_page', 'about_timeline'] },
            { label: 'עמוד צור קשר', sections: ['contact_page'] },
            { label: 'עמודים נוספים', sections: ['discover_section', 'wishlist_section', 'magazine'] },
        ],
    },
    {
        id: 'brand',
        label: 'מיתוג וניווט',
        icon: '🎨',
        accent: '#FF9500',
        subGroups: [
            { label: 'זהות האתר ומצב מערכת', sections: ['branding'] },
            { label: 'תפריט ניווט', sections: ['header', 'menu_reorder'] },
            { label: 'כותרת תחתונה (Footer)', sections: ['footer_config'] },
        ],
    },
    {
        id: 'tools',
        label: 'כלים ווידג׳טים',
        icon: '🤖',
        accent: '#34C759',
        subGroups: [
            { label: 'עוזר AI ושאלות גולשים', sections: ['ai_assistant', 'qa_section'] },
            { label: 'ווידג׳טים צפים', sections: ['floating_concierge'] },
            { label: 'עגלת קניות וצ׳ק-אאוט', sections: ['cart_checkout'] },
            { label: 'מדיה ונגישות', sections: ['videos', 'accessibility_section'] },
        ],
    },
    {
        id: 'system',
        label: 'מערכת',
        icon: '⚙️',
        accent: '#FF2D55',
        subGroups: [
            { label: null, sections: ['visibility', 'legal'] },
        ],
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
// SVG icon components — replace all emoji icons in the admin UI
const GROUP_ICON_COMPONENTS = {
    homepage: <Home size={16} />,
    pages:    <FileText size={16} />,
    brand:    <Palette size={16} />,
    tools:    <Wrench size={16} />,
    system:   <Settings size={16} />,
};

const SECTION_ICON_COMPONENTS = {
    branding:               <Palette size={13} />,
    header:                 <Navigation size={13} />,
    hero:                   <Home size={13} />,
    trust_badges:           <Award size={13} />,
    homepage_sections:      <Layers size={13} />,
    homepage_vp:            <Star size={13} />,
    feature_tiles:          <LayoutGrid size={13} />,
    shoppable_image:        <ImageIcon size={13} />,
    quote_wizard:           <FileText size={13} />,
    expert_consultation:    <UserCircle size={13} />,
    home_discover_products: <Search size={13} />,
    catalog_full:           <List size={13} />,
    search_section:         <Search size={13} />,
    product_detail:         <Package size={13} />,
    sidebar_sections:       <Layout size={13} />,
    pd_dims_section:        <Ruler size={13} />,
    pd_warranty_section:    <Shield size={13} />,
    pd_support_section:     <Headphones size={13} />,
    pd_faq_section:         <HelpCircle size={13} />,
    pd_reviews_section:     <Star size={13} />,
    accessories_section:    <Link2 size={13} />,
    about_page:             <Info size={13} />,
    about_timeline:         <Clock size={13} />,
    contact_page:           <Phone size={13} />,
    floating_concierge:     <MessageSquare size={13} />,
    discover_section:       <Compass size={13} />,
    wishlist_section:       <Heart size={13} />,
    magazine:               <Newspaper size={13} />,
    footer_config:          <PanelBottom size={13} />,
    ai_assistant:           <Bot size={13} />,
    qa_section:             <MessageSquare size={13} />,
    cart_checkout:          <ShoppingCart size={13} />,
    videos:                 <Video size={13} />,
    accessibility_section:  <Eye size={13} />,
    visibility:             <Eye size={13} />,
    menu_reorder:           <Menu size={13} />,
    legal:                  <FileText size={13} />,
};

// ─── Section Page Locations ───────────────────────────────────────────────────
const SECTION_LOCATIONS = {
    hero:                   'דף הבית',
    homepage_sections:      'דף הבית',
    homepage_vp:            'דף הבית',
    feature_tiles:          'דף הבית',
    shoppable_image:        'דף הבית',
    quote_wizard:           'דף הבית',
    expert_consultation:    'דף הבית',
    home_discover_products: 'דף הבית',
    catalog_full:           'קטלוג',
    search_section:         'קטלוג',
    product_detail:         'דף מוצר',
    trust_badges:           'דף מוצר',
    sidebar_sections:       'דף מוצר',
    pd_dims_section:        'דף מוצר',
    pd_warranty_section:    'דף מוצר',
    pd_support_section:     'דף מוצר',
    pd_faq_section:         'דף מוצר',
    pd_reviews_section:     'דף מוצר',
    accessories_section:    'דף מוצר',
    about_page:             'עמוד אודות',
    about_timeline:         'עמוד אודות',
    contact_page:           'צור קשר',
    floating_concierge:     'ווידג׳ט צף',
    discover_section:       'גלה NextClass',
    wishlist_section:       'מועדפים',
    magazine:               'מגזין',
    branding:               'כל האתר',
    header:                 'ניווט',
    menu_reorder:           'ניווט',
    footer_config:          'Footer',
    ai_assistant:           'ווידג׳ט AI',
    qa_section:             'דף מוצר',
    cart_checkout:          'עגלה',
    videos:                 'מרכז הדרכה',
    accessibility_section:  'נגישות',
    visibility:             'כל האתר',
    legal:                  'משפטי',
};

const NAV_ICON_COMPONENTS = {
    home:     <Home size={15} />,
    catalog:  <ShoppingBag size={15} />,
    compare:  <ArrowRightLeft size={15} />,
    story:    <BookOpen size={15} />,
    vod:      <Play size={15} />,
    magazine: <Newspaper size={15} />,
    contact:  <Phone size={15} />,
};

const SIDEBAR_SECTION_ICONS = {
    'pd-features': <Star size={14} />,
    'pd-dims':     <Ruler size={14} />,
    'pd-specs':    <List size={14} />,
    'pd-warranty': <FileText size={14} />,
    'pd-support':  <Headphones size={14} />,
    'pd-qa':       <HelpCircle size={14} />,
    'pd-reviews':  <Star size={14} />,
};

// ─── Color Picker Field ───────────────────────────────────────────────────────
function ColorField({ field, value, onChange }) {
    const colorRef = React.useRef();
    const displayColor = value && /^#[0-9A-Fa-f]{3,6}$/.test(value) ? value : '#1D1D1F';
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#86868B] block text-right">{field.label}</label>
            <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => colorRef.current?.click()}
                    className="w-9 h-9 rounded-xl border-2 border-white shrink-0 transition-transform hover:scale-110 active:scale-95"
                    style={{ background: displayColor, boxShadow: `0 2px 8px ${displayColor}50, 0 0 0 1px rgba(0,0,0,0.08)` }}
                    title="בחר צבע" />
                <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                    placeholder="#1D1D1F" dir="ltr"
                    className="flex-1 px-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-[13px] font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all" />
                <input ref={colorRef} type="color" value={displayColor} onChange={e => onChange(e.target.value)} className="sr-only" />
            </div>
        </div>
    );
}

// ─── Text Field with character count ─────────────────────────────────────────
function TextField({ field, value, onChange }) {
    const len = (value || '').length;
    const isDefault = value === field.default || (!value && !field.default);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold tabular-nums ${len > 80 ? 'text-[#FF9500]' : 'text-[#C7C7CC]'}`}>{len}</span>
                <label className="text-[11px] font-black text-[#86868B] text-right flex items-center gap-1.5">
                    {!isDefault && <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] inline-block shrink-0" />}
                    {field.label}
                </label>
            </div>
            <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                placeholder={String(field.default || '')} dir="rtl"
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all placeholder-[#C7C7CC]" />
        </div>
    );
}

// ─── Textarea Field with character count ─────────────────────────────────────
function TextareaField({ field, value, onChange }) {
    const len = (value || '').length;
    const isDefault = value === field.default || (!value && !field.default);
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold tabular-nums ${len > 200 ? 'text-[#FF9500]' : 'text-[#C7C7CC]'}`}>{len} תו</span>
                <label className="text-[11px] font-black text-[#86868B] text-right flex items-center gap-1.5">
                    {!isDefault && <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] inline-block shrink-0" />}
                    {field.label}
                </label>
            </div>
            <textarea value={value || ''} onChange={e => onChange(e.target.value)}
                placeholder={String(field.default || '')} dir="rtl" rows={3}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-[13px] text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all resize-none placeholder-[#C7C7CC]" />
        </div>
    );
}

// ─── Image Field with preview ─────────────────────────────────────────────────
function ImageField({ field, value, onChange }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = React.useRef();
    const handleDrop = (e) => {
        e.preventDefault(); setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => onChange(ev.target.result);
            reader.readAsDataURL(file);
        }
    };
    const handleFileInput = (e) => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (ev) => onChange(ev.target.result); reader.readAsDataURL(file); }
    };
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] block text-right">{field.label}</label>
            <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
                placeholder="https://... או גרור קובץ למטה" dir="ltr"
                className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-transparent rounded-xl text-[13px] font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all" />
            <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop} onClick={() => inputRef.current?.click()}
                className="relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden"
                style={{ borderColor: isDragOver ? '#007AFF' : '#D1D1D6', background: isDragOver ? 'rgba(0,122,255,0.04)' : 'transparent' }}>
                {value ? (
                    <div className="relative h-28 bg-gray-100">
                        <img src={value} alt="תצוגה מקדימה" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">החלף תמונה</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-5 flex flex-col items-center gap-1.5">
                        <ImageIcon size={18} className="text-[#AEAEB2]" />
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
    if (field.type === 'textarea') return <TextareaField field={field} value={value} onChange={onChange} />;
    if (field.type === 'boolean') return <AdminToggle label={field.label} value={value} onChange={onChange} />;
    if (field.key && field.key.toLowerCase().includes('color')) return <ColorField field={field} value={value} onChange={onChange} />;
    return <TextField field={field} value={value} onChange={onChange} />;
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

    // Each item's visibility is stored as an individual boolean key: vis_nav_<id>
    // Never as a complex array — this prevents all sync/serialization bugs
    const buildItems = () => DEFAULT_NAV_ITEMS.map(item => ({
        ...item,
        visible: getSetting(`vis_nav_${item.id}`, true),
    }));

    const [items, setItems] = useState(buildItems);

    useEffect(() => {
        setItems(buildItems());
    }, [getSetting]);

    const toggleVisibility = async (id) => {
        const current = items.find(i => i.id === id);
        const newVal = current ? !current.visible : false;
        setItems(prev => prev.map(i => i.id === id ? { ...i, visible: newVal } : i));
        try {
            await updateGlobalSettings({ [`vis_nav_${id}`]: newVal });
            showToast('תפריט עודכן', 'success');
        } catch { showToast('שגיאה בשמירה', 'error'); }
    };

    const handleReset = async () => {
        const updates = {};
        DEFAULT_NAV_ITEMS.forEach(item => { updates[`vis_nav_${item.id}`] = true; });
        setItems(DEFAULT_NAV_ITEMS.map(i => ({ ...i, visible: true })));
        try { await updateGlobalSettings(updates); showToast('תפריט אופס', 'success'); }
        catch { showToast('שגיאה בשמירה', 'error'); }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handleReset} className="text-[11px] text-[#AEAEB2] hover:text-[#007AFF] transition-colors font-bold">הצג הכל</button>
                <p className="text-[11px] font-black text-[#86868B] text-right">מתג להסתרה / הצגה בתפריט</p>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.id}
                        style={{ opacity: item.visible === false ? 0.45 : 1 }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-[#007AFF]/30 transition-colors">
                        <span className="text-[#6E6E73] shrink-0">{NAV_ICON_COMPONENTS[item.id] || <Link2 size={15} />}</span>
                        <div className="flex-1 text-right">
                            <p className="text-sm font-bold text-[#1D1D1F]">{item.defaultLabel}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{item.path}</p>
                        </div>
                        <AdminToggle value={item.visible !== false} onChange={() => toggleVisibility(item.id)} />
                    </div>
                ))}
            </div>
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
                <p className="text-[11px] font-black text-[#86868B] tracking-widest text-right">גרור לשינוי סדר • מתג להסתרה / הצגה</p>
            </div>
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item) => (
                    <Reorder.Item key={item.id} value={item} onDragEnd={handleDragEnd}
                        style={{ opacity: item.visible === false ? 0.45 : 1, listStyle: 'none' }}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing group hover:border-[#5856D6]/30 transition-colors select-none">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="#AEAEB2" className="shrink-0 group-hover:fill-[#5856D6] transition-colors">
                            <rect x="3" y="3.5" width="10" height="1.5" rx="0.75" /><rect x="3" y="7.25" width="10" height="1.5" rx="0.75" /><rect x="3" y="11" width="10" height="1.5" rx="0.75" />
                        </svg>
                        <span className="text-[#6E6E73] shrink-0">{SIDEBAR_SECTION_ICONS[item.id] || <List size={14} />}</span>
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

// ─── Static Articles Sub-Section ─────────────────────────────────────────────
function getCatColor(cat) { return CATEGORY_COLORS[cat] ?? { bg: 'bg-blue-50', text: 'text-[#007AFF]', dot: 'bg-[#007AFF]' }; }

const StaticArticlesSection = ({ firestoreArticles, showToast }) => {
    const [importing, setImporting] = useState(null);

    const unimported = STATIC_ARTICLES.filter(
        a => !firestoreArticles.some(f => f.title === a.title)
    );

    const handleImport = async (article) => {
        setImporting(article.id);
        try {
            await addDoc(collection(db, 'magazine_articles'), {
                title: article.title,
                excerpt: article.excerpt,
                category: article.category,
                date: article.date,
                readTime: article.readTime,
                image: article.image,
                url: article.url,
                source: article.source,
                createdAt: serverTimestamp(),
            });
            showToast('כתבה נוספה לאדמין', 'success');
        } catch {
            showToast('שגיאה בייבוא הכתבה', 'error');
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-[#86868B] font-bold">{unimported.length} כתבות לא מנוהלות</p>
                <p className="text-[12px] font-black text-[#1D1D1F]">כתבות סטטיות</p>
            </div>

            {unimported.length === 0 ? (
                <div className="py-8 text-center text-[#AEAEB2] text-[13px] font-bold bg-gray-50 rounded-2xl">
                    כל הכתבות הסטטיות כבר מנוהלות באדמין
                </div>
            ) : (
                <div className="space-y-2">
                    {unimported.map(article => {
                        const c = getCatColor(article.category);
                        return (
                            <div key={article.id}
                                className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-[#FAFAFA] text-right">
                                <button
                                    onClick={() => handleImport(article)}
                                    disabled={importing === article.id}
                                    className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black text-white bg-[#34C759] hover:bg-[#2DB84D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                                    {importing === article.id ? '...' : 'הוסף לאדמין'}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-black text-[#1D1D1F] truncate">
                                        {article.title.length > 60 ? article.title.slice(0, 60) + '…' : article.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5 justify-end">
                                        <span className="text-[9px] text-[#AEAEB2]">{article.source}</span>
                                        <span className="text-[9px] text-[#AEAEB2]">·</span>
                                        <span className="text-[9px] text-[#AEAEB2]">{article.date}</span>
                                    </div>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 ${c.bg} ${c.text} text-[9px] font-black px-2.5 py-1 rounded-full`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                    {article.category}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
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
                            <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">כותרת *</label><input className={inputCls} dir="rtl" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="כותרת הכתבה" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">קטגוריה</label><input className={inputCls} dir="rtl" value={form.category} onChange={e => setField('category', e.target.value)} placeholder="חדשנות פדגוגית" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">תקציר</label><textarea className={`${inputCls} resize-none`} dir="rtl" rows={2} value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} placeholder="תיאור קצר..." /></div>
                        <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">קישור לכתבה *</label><input className={inputCls} dir="ltr" value={form.url} onChange={e => setField('url', e.target.value)} placeholder="https://..." /></div>
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">מקור</label><input className={inputCls} dir="rtl" value={form.source} onChange={e => setField('source', e.target.value)} placeholder="eSchool News" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">תאריך</label><input className={inputCls} dir="rtl" value={form.date} onChange={e => setField('date', e.target.value)} placeholder="ינואר 2026" /></div>
                            <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">זמן קריאה</label><input className={inputCls} dir="rtl" value={form.readTime} onChange={e => setField('readTime', e.target.value)} placeholder="5 דקות קריאה" /></div>
                        </div>
                        <div><label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1 text-right">תמונה (URL)</label><input className={inputCls} dir="ltr" value={form.image} onChange={e => setField('image', e.target.value)} placeholder="https://images.unsplash.com/..." /></div>
                        <div className="flex gap-2 pt-1">
                            <button onClick={closeEdit} className="flex-1 py-2 rounded-xl text-[12px] font-black text-[#86868B] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition-colors">ביטול</button>
                            <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-[12px] font-black text-white bg-[#007AFF] hover:bg-[#0066CC] transition-colors">שמור כתבה</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Static Articles Section */}
            <StaticArticlesSection firestoreArticles={articles} showToast={showToast} />
        </div>
    );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeGroup, setActiveGroup }) {
    const groupStats = React.useMemo(() => {
        const stats = {};
        SECTION_GROUPS.forEach(group => {
            const allSectionIds = group.subGroups.flatMap(sg => sg.sections);
            let fieldCount = 0;
            allSectionIds.forEach(id => {
                const sec = ALL_SECTIONS.find(s => s.id === id);
                if (sec?.fields) fieldCount += sec.fields.length;
            });
            stats[group.id] = { sections: allSectionIds.length, fields: fieldCount };
        });
        return stats;
    }, []);

    return (
        <div className="w-52 shrink-0 flex flex-col gap-2" style={{ minWidth: 200 }}>
            {/* Logo row */}
            <div className="px-4 py-3 mb-1">
                <p className="text-[10px] font-black text-[#AEAEB2] tracking-tight">תוכן האתר</p>
            </div>

            {SECTION_GROUPS.map(group => {
                const isActive = activeGroup === group.id;
                return (
                    <motion.button
                        key={group.id}
                        onClick={() => setActiveGroup(group.id)}
                        whileHover={{ x: isActive ? 0 : -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-right transition-all relative overflow-hidden"
                        style={{
                            background: isActive
                                ? `linear-gradient(135deg, ${group.accent} 0%, ${group.accent}CC 100%)`
                                : 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: isActive
                                ? `0 8px 24px ${group.accent}35, 0 0 0 1px ${group.accent}20`
                                : '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                        }}
                    >
                        {isActive && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -mr-8 -mt-8" />
                            </div>
                        )}
                        <span className={`shrink-0 relative z-10 ${isActive ? 'text-white' : 'text-[#6E6E73]'}`}>{GROUP_ICON_COMPONENTS[group.id] || <Settings size={16} />}</span>
                        <div className="flex-1 text-right relative z-10 min-w-0">
                            <span className={`text-[13px] font-bold block ${isActive ? 'text-white' : 'text-[#1D1D1F]'}`}>
                                {group.label}
                            </span>
                            {groupStats[group.id] && (
                                <span className={`text-[9px] font-bold block mt-0.5 truncate ${isActive ? 'text-white/60' : 'text-[#AEAEB2]'}`}>
                                    {groupStats[group.id].sections} קטעים · {groupStats[group.id].fields} שדות
                                </span>
                            )}
                        </div>
                        {isActive && (
                            <ChevronRight size={14} className="text-white/60 shrink-0 relative z-10" />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

// ─── Section Accordion ────────────────────────────────────────────────────────
function SectionAccordion({ sec, isOpen, onToggle, content, onChange, onReset, showToast }) {
    const isSpecial = sec.type === 'visibility' || sec.type === 'menu_reorder' || sec.id === 'sidebar_sections' || sec.type === 'videos' || sec.type === 'magazine';
    const fieldCount = sec.fields ? sec.fields.length : null;
    const location = SECTION_LOCATIONS[sec.id];
    const firstTextField = sec.fields ? sec.fields.find(f => f.type === 'text' || f.type === 'textarea') : null;
    const peekValue = firstTextField ? (content[firstTextField.key] !== undefined ? content[firstTextField.key] : (firstTextField.default || '')) : '';
    const peekText = peekValue ? String(peekValue).slice(0, 40) + (String(peekValue).length > 40 ? '…' : '') : '';

    const specialBadge = () => {
        if (sec.type === 'visibility') return `${VISIBILITY_ITEMS.length} פריטים`;
        if (sec.type === 'menu_reorder') return '↕ גרירה';
        if (sec.id === 'sidebar_sections') return '↕ גרירה';
        if (sec.type === 'videos') return 'VOD';
        if (sec.type === 'magazine') return 'Firestore';
        return null;
    };

    const badge = fieldCount !== null ? `${fieldCount} שדות` : specialBadge();

    return (
        <div
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
                background: isOpen ? '#ffffff' : 'rgba(255,255,255,0.72)',
                border: `1px solid ${isOpen ? sec.accent + '28' : 'rgba(0,0,0,0.06)'}`,
                boxShadow: isOpen
                    ? `0 4px 24px rgba(0,0,0,0.07), 0 0 0 1px ${sec.accent}12`
                    : '0 1px 3px rgba(0,0,0,0.04)',
            }}
        >
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3.5 px-5 py-4 text-right transition-colors hover:bg-black/[0.025] group"
            >
                <div
                    className="w-1 h-7 rounded-full shrink-0 transition-all duration-300"
                    style={{ background: isOpen ? sec.accent : '#E5E5EA' }}
                />
                <span className="text-[#6E6E73] shrink-0" style={{ color: isOpen ? sec.accent : undefined }}>{SECTION_ICON_COMPONENTS[sec.id] || <Settings size={13} />}</span>
                <div className="flex-1 text-right">
                    <p className={`text-[13px] font-bold leading-snug transition-colors ${isOpen ? 'text-[#1D1D1F]' : 'text-[#3C3C43]'}`}>
                        {sec.label}
                    </p>
                    {!isOpen && peekText && (
                        <p className="text-[11px] text-[#AEAEB2] truncate mt-0.5 font-normal">{peekText}</p>
                    )}
                </div>
                {location && (
                    <span className="hidden sm:inline-flex text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                        style={{ background: `${sec.accent}10`, color: sec.accent, border: `1px solid ${sec.accent}20` }}>
                        {location}
                    </span>
                )}
                {badge && (
                    <span
                        className="text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                        style={{ background: `${sec.accent}12`, color: sec.accent }}
                    >
                        {badge}
                    </span>
                )}
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: [0.32,0.72,0,1] }}>
                    <ChevronDown size={15} className="text-[#C7C7CC] shrink-0 group-hover:text-[#AEAEB2] transition-colors" />
                </motion.div>
            </button>

            {/* Body */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t" style={{ borderColor: `${sec.accent}15` }}>
                            {/* Special sections */}
                            {sec.type === 'visibility' && <VisibilitySection content={content} onChange={onChange} />}
                            {sec.type === 'menu_reorder' && <NavMenuManager showToast={showToast} />}
                            {sec.id === 'sidebar_sections' && <SidebarSectionManager showToast={showToast} />}
                            {sec.type === 'videos' && <VideosSection showToast={showToast} />}
                            {sec.type === 'magazine' && <MagazineSection showToast={showToast} />}

                            {/* Regular field sections */}
                            {sec.fields && sec.id !== 'sidebar_sections' && (
                                <div className="p-5">
                                    <div className="flex justify-end mb-4">
                                        <button
                                            onClick={() => onReset(sec)}
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-[#C7C7CC] hover:text-[#007AFF] transition-colors"
                                        >
                                            <RotateCcw size={11} />
                                            איפוס לברירת מחדל
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {sec.fields.map(field => (
                                            <FieldInput
                                                key={field.key}
                                                field={field}
                                                value={content[field.key] !== undefined ? content[field.key] : field.default}
                                                onChange={v => onChange(field.key, v)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
    const [activeGroup, setActiveGroup] = useState('homepage');
    const [openSections, setOpenSections] = useState(new Set(['hero']));
    const [globalSearch, setGlobalSearch] = useState('');
    const [content, setContent] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const { updateGlobalSettings, seedMissingDefaults, firestoreLoaded } = useSettings();

    useEffect(() => {
        if (firestoreLoaded) seedMissingDefaults(ALL_FIELD_DEFAULTS);
    }, [firestoreLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LS_KEY);
            if (savedData) setContent(JSON.parse(savedData));
            else setContent(ALL_FIELD_DEFAULTS);
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

    const toggleSection = (id) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Search: filter across ALL sections
    const searchResults = useMemo(() => {
        if (!globalSearch.trim()) return null;
        const q = globalSearch.toLowerCase();
        return ALL_SECTIONS.filter(sec => {
            if (sec.label.toLowerCase().includes(q)) return true;
            if (sec.fields) return sec.fields.some(f => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
            return false;
        });
    }, [globalSearch]);

    const currentGroupDef = SECTION_GROUPS.find(g => g.id === activeGroup);

    const renderAccordion = (id) => {
        const sec = ALL_SECTIONS.find(s => s.id === id);
        if (!sec) return null;
        return (
            <SectionAccordion
                key={id}
                sec={sec}
                isOpen={openSections.has(id)}
                onToggle={() => toggleSection(id)}
                content={content}
                onChange={handleChange}
                onReset={handleReset}
                showToast={showToast}
            />
        );
    };

    return (
        <div dir="rtl" className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-black text-[#1D1D1F] tracking-tight">ניהול תוכן האתר</h1>
                    <p className="text-[13px] text-[#AEAEB2] mt-0.5">ערוך טקסטים, תמונות והגדרות — מסונכרן לענן בזמן אמת</p>
                </div>
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                                className="text-[#FF9500] text-[12px] font-bold">
                                שינויים לא נשמרו
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <motion.button
                        onClick={handleSave}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-[13px] transition-all"
                        style={{
                            background: saved ? '#34C759' : '#007AFF',
                            color: 'white',
                            boxShadow: saved ? '0 4px 14px rgba(52,199,89,0.35)' : '0 4px 14px rgba(0,122,255,0.35)',
                        }}
                    >
                        <Save size={14} />
                        {saved ? '✓ נשמר!' : 'שמור הכל'}
                    </motion.button>
                </div>
            </div>

            {/* Global Search */}
            <div className="relative">
                <Search size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C7C7CC]" />
                <input
                    type="text"
                    value={globalSearch}
                    onChange={e => setGlobalSearch(e.target.value)}
                    placeholder="חפש בכל תכני האתר — שדות, קטעים, עמודים..."
                    dir="rtl"
                    className="w-full pr-11 pl-10 py-3.5 rounded-2xl border text-[14px] placeholder-[#C7C7CC] focus:outline-none transition-all"
                    style={{
                        background: 'rgba(255,255,255,0.9)',
                        borderColor: globalSearch ? '#007AFF40' : 'rgba(0,0,0,0.07)',
                        boxShadow: globalSearch ? '0 0 0 3px rgba(0,122,255,0.08), 0 1px 4px rgba(0,0,0,0.05)' : '0 1px 4px rgba(0,0,0,0.05)',
                    }}
                />
                {globalSearch && (
                    <button onClick={() => setGlobalSearch('')}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C7C7CC] hover:text-[#8E8E93] transition-colors">
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Search results */}
            {searchResults ? (
                <div className="flex flex-col gap-2.5">
                    <p className="text-[11px] font-black text-[#AEAEB2] tracking-[0.2em]">
                        {searchResults.length} קטעים נמצאו עבור &quot;{globalSearch}&quot;
                    </p>
                    {searchResults.length === 0
                        ? <div className="text-center py-20 text-[#C7C7CC] text-[15px]">לא נמצאו קטעים</div>
                        : searchResults.map(sec => (
                            <SectionAccordion
                                key={sec.id}
                                sec={sec}
                                isOpen={openSections.has(sec.id)}
                                onToggle={() => toggleSection(sec.id)}
                                content={content}
                                onChange={handleChange}
                                onReset={handleReset}
                                showToast={showToast}
                            />
                        ))
                    }
                </div>
            ) : (
                <div className="flex gap-5 items-start">
                    {/* Sidebar */}
                    <Sidebar activeGroup={activeGroup} setActiveGroup={(id) => {
                        setActiveGroup(id);
                        setOpenSections(new Set()); // collapse all when switching group
                    }} />

                    {/* Content — accordion per section */}
                    <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeGroup}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                                className="flex flex-col gap-2.5"
                            >
                                {/* Group title pill */}
                                {currentGroupDef && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#6E6E73] shrink-0">{GROUP_ICON_COMPONENTS[currentGroupDef.id] || <Settings size={16} />}</span>
                                        <h2 className="text-[15px] font-black text-[#1D1D1F]">{currentGroupDef.label}</h2>
                                        <div className="flex-1 h-px bg-black/[0.05]" />
                                        <button
                                            onClick={() => {
                                                const allIds = currentGroupDef.subGroups.flatMap(sg => sg.sections);
                                                const allOpen = allIds.every(id => openSections.has(id));
                                                setOpenSections(allOpen ? new Set() : new Set(allIds));
                                            }}
                                            className="text-[11px] font-bold text-[#AEAEB2] hover:text-[#007AFF] transition-colors whitespace-nowrap"
                                        >
                                            {currentGroupDef.subGroups.flatMap(sg => sg.sections).every(id => openSections.has(id))
                                                ? 'סגור הכל'
                                                : 'פתח הכל'
                                            }
                                        </button>
                                    </div>
                                )}

                                {currentGroupDef && currentGroupDef.subGroups.map((sub, si) => (
                                    <div key={si} className="flex flex-col gap-2.5">
                                        {sub.label && (
                                            <div className="flex items-center gap-2 mt-3 mb-0.5 px-1">
                                                <div className="h-px flex-1 bg-black/[0.06]" />
                                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full whitespace-nowrap"
                                                    style={{
                                                        background: `${currentGroupDef?.accent}12`,
                                                        color: currentGroupDef?.accent || '#86868B',
                                                    }}>
                                                    {sub.label}
                                                </span>
                                                <div className="h-px flex-1 bg-black/[0.06]" />
                                            </div>
                                        )}
                                        {sub.sections.map(id => renderAccordion(id))}
                                    </div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Floating unsaved-changes banner */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
                        style={{
                            background: 'rgba(29,29,31,0.92)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.12)',
                        }}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#FF9500] shrink-0" />
                        <span className="text-white text-[13px] font-bold">יש שינויים שלא נשמרו</span>
                        <button onClick={handleSave}
                            className="px-4 py-1.5 rounded-xl text-[12px] font-black text-white bg-[#007AFF] hover:bg-[#0066CC] transition-colors">
                            שמור עכשיו
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
