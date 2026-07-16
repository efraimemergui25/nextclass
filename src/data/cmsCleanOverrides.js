/**
 * CMS Clean Overrides — used by the admin "Launch Cleanup" action.
 *
 * The live Firestore `config/cms` doc overrides the code defaults key-by-key
 * (SettingsContext merges { ...DEFAULT_SETTINGS, ...liveDoc }). If the live doc
 * still holds fabricated marketing data entered earlier, writing THESE keys back
 * (merge) neutralises exactly the fabricated values — testimonials, invented
 * statistics, false partner networks, fake reviews and the bogus company timeline —
 * without touching any legitimate configuration (phones, toggles, real copy).
 *
 * Everything here matches the cleaned code defaults (src/data/cms-settings.json).
 */
const CMS_CLEAN_OVERRIDES = {
  // Trust / social proof — only עמל is a real partner
  hero_trust_pill_3: 'אחריות יצרן מלאה',
  sp_label: 'ספק ציוד תצוגה לרשת עמל',
  sp_clients: 'רשת עמל',
  auth_hero_stat: 'ציוד מקורי באחריות יצרן',
  auth_hero_subtitle: 'ציוד תצוגה מקורי למוסדות חינוך, ישירות מהיבואן',

  // About stats — honest to reality (3 models, original equipment, Amal partner)
  about_stat1_val: '3',    about_stat1_label: 'דגמים מובחרים',
  about_stat2_val: '100%', about_stat2_label: 'ציוד מקורי',
  about_stat3_val: 'עמל',  about_stat3_label: 'שותף עסקי',
  about_edu_badge: '',

  // Company timeline — honest business-model copy, no fabricated scale/partners
  about_tm1_title: 'ההתחלה — התמחות בציוד תצוגה',
  about_tm1_desc: 'בחרנו להתמקד בדבר אחד ולעשות אותו מצוין: אספקת מסכי מחשב מקוריים ואיכותיים למוסדות חינוך, עם ליווי אישי בכל שלב.',
  about_tm2_title: 'עבודה מול רשת עמל',
  about_tm2_desc: 'התחלנו לספק ציוד תצוגה למוסדות רשת עמל, עם התחייבות לאספקה מדויקת, בזמן ובהתאם למסגרות הרכש.',
  about_tm3_title: 'ציוד מקורי במחירי יבואן',
  about_tm3_desc: 'ביססנו עבודה ישירה מול היבואנים — ציוד מקורי באחריות יצרן מלאה, במחיר הוגן וללא מתווכים.',
  about_tm4_desc: 'השקנו פלטפורמה מקוונת לרכש, ניהול הזמנות ומעקב — מנהלי רכש מקבלים מחיר, מאשרים ועוקבים, בלי אימיילים ובלי "מה הסטטוס?".',

  // Product reviews — no fabricated reviews/ratings
  pd_reviews_avg: '', pd_reviews_count: '',
  pd_review1_name: '', pd_review1_role: '', pd_review1_stars: '', pd_review1_text: '',
  pd_review2_name: '', pd_review2_role: '', pd_review2_stars: '', pd_review2_text: '',
  pd_review3_name: '', pd_review3_role: '', pd_review3_stars: '', pd_review3_text: '',

  // Testimonials — hide the section and blank the fabricated people
  vis_testimonials: false,
  tst_header_title: 'לקוחות מספרים',
  tst_header_desc: 'ציוד תצוגה מקורי ואמין, במחיר הוגן ובליווי אישי.',
  tst_1_quote: '', tst_1_name: '', tst_1_role: '', tst_1_school: '',
  tst_2_quote: '', tst_2_name: '', tst_2_role: '', tst_2_school: '',
  tst_3_quote: '', tst_3_name: '', tst_3_role: '', tst_3_school: '',
  tst_4_quote: '', tst_4_name: '', tst_4_role: '', tst_4_school: '',

  // Hide the quote-wizard (built on a fabricated multi-product catalog)
  vis_quote_wizard: false,
};

export default CMS_CLEAN_OVERRIDES;
