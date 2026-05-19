import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCcnEihNUeJHzYxs-r5AB0MkUvU4o5GgtA",
    authDomain: "nextclass-d2364.firebaseapp.com",
    projectId: "nextclass-d2364",
    storageBucket: "nextclass-d2364.firebasestorage.app",
    messagingSenderId: "1031510594625",
    appId: "1:1031510594625:web:1109be9a4ad8ecbd6b62c0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const ref = doc(db, 'cms_settings', 'global_config');

const updates = {
    // ── Hero (דף הבית) ──────────────────────────────────────────
    hero_eyebrow:     'הדור הבא של טכנולוגיה לחינוך',
    hero_headline:    'חדשנות חסרת פשרות.',
    hero_subline:     'מקצוענות בכל מרחב למידה.',
    hero_description: 'הסטנדרט הטכנולוגי החדש של מוסדות החינוך המובילים בישראל.',
    hero_cta:         'גלו את הפתרונות שלנו',
    hero_trust_pill_1: 'שירות ישיר ומהיר',
    hero_trust_pill_2: 'ייעוץ ללא עלות',
    hero_trust_pill_3: '+500 מוסדות חינוך',

    // ── Trust Badges (דף מוצר) ──────────────────────────────────
    trust_badge_1_title: 'שירות ישיר ומהיר',
    trust_badge_1_desc:  'מענה אישי בכל שלב',
    trust_badge_2_title: 'החלפה תוך 14 יום',
    trust_badge_2_desc:  'ללא שאלות',
    trust_badge_3_title: 'מחיר שקוף',
    trust_badge_3_desc:  'מה שהוצע — מה שמשלמים',

    // ── About Page ──────────────────────────────────────────────
    about_hero_label:         '',
    about_hero_title:         'הטכנולוגיה\nשחינוך ראוי לה.',
    about_hero_sub:           'מקצועי. מהיר. אישי. ישיר.\nהסטנדרט הגבוה ביותר שחינוך יכול לקבל.',
    about_story_section_title: 'הסיפור שלנו.',
    about_story_body:         'ראיתי בתי ספר שנאבקים עם ספקים שלא מכירים את שמם, ציוד שמגיע שבועות מאוחר, ושירות שנגמר ברגע שהחשבונית נחתמה. החלטתי לשנות את המשוואה. NextClass הוא לא פלטפורמה ולא קטלוג — הוא מודל עסקי אחר לגמרי: שירות ישיר, אנושי ומקצועי שמוריד את כל הביניים, ומביא לחינוך הישראלי את הרמה שהוא ראוי לה.',
    about_check_1:            'ייעוץ מקצועי ומהיר — ללא עלות',
    about_check_2:            'שירות אישי וישיר, ללא ביניים',
    about_check_3:            'פתרונות מהדרגה הראשונה לחינוך',
    about_founder_title:      'מקצועיות\nללא פשרות.',
    about_founder_message:    'אני מנהל את NextClass כמו שהייתי רוצה שינהלו ספק שאני עובד איתו: ישירות, מהירות, ורמה שלא מתפשרת. כל שיחה, כל הצעת מחיר, כל אספקה — כולם עוברים דרכי. לא כי אין לי ברירה. כי זו ההבטחה שלי לכל לקוח.',
    about_v1_title:           'מחיר שקוף',
    about_v1_desc:            'הצעת מחיר = חשבונית. מה שהוצע הוא מה שמשלמים — נקודה. שקיפות מלאה מהשקל הראשון ועד האחרון.',
    about_v2_title:           'שירות מהיר',
    about_v2_desc:            'בעולם שממתינים בו שבועות לתגובה — אנחנו עונים תוך שעות. מהירות היא לא בונוס אצלנו. היא חלק בלתי נפרד מהרמה.',
    about_v3_title:           'רמה מקצועית',
    about_v3_desc:            'כל פרט נבחן. כל בחירה מבוססת. הסטנדרט שאנחנו מציבים לעצמנו גבוה ממה שהלקוח היה מבקש — כי זה הרף שאנחנו מסרבים לרדת ממנו.',
    about_cta_title:          'שאלו אותנו.\nנגיע עם תשובות.',
    about_cta_desc:           'שיחה קצרה מספיקה. נשאל מה הכיתה צריכה ונחזור עם הצעה מדויקת.',
    about_journey_hint:       'גלה את הסיפור שלנו',
    about_values_title:       'שלושה כללים',
    about_values_desc:        'לאמינות אין קיצורי דרך.',

    // ── Contact Page ─────────────────────────────────────────────
    contact_hero_subtitle: 'אנחנו כאן בשבילכם — שירות ישיר, מהיר ומקצועי מהרגע הראשון.',

    // ── Value Props (דף הבית) ───────────────────────────────────
    vp_prop1_title: 'שירות ישיר ואישי',
    vp_prop1_desc:  'מענה אישי, ישיר ומהיר — לא תורים, לא טיקטים.',
    vp_prop2_title: 'מהיר. תמיד.',
    vp_prop2_desc:  'מהירות היא לא בונוס. היא חלק מהמקצוענות.',
};

console.log(`Updating ${Object.keys(updates).length} keys in Firestore...`);
await setDoc(ref, updates, { merge: true });
console.log('✅ Done. All CMS values updated successfully.');
process.exit(0);
