/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS AI — ADMIN COPILOT PROMPT & LIVE-CONTEXT BUILDER
   ───────────────────────────────────────────────────────────────────────────────
   The system prompt + a compact, real-time "state of the store" string assembled
   from live admin data (useAdminData). Injected into POST /api/concierge so the
   copilot's answers are grounded in the operator's ACTUAL current numbers.

   Design principle (Heaven): "AI inside the workflow, not a separate tab."
   The copilot GUIDES + DRAFTS + NAVIGATES. It never mutates data and never
   claims to have sent an email — every email goes through the approval gate.
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ─── Admin screen map — where every feature lives (for guidance + navigation) ── */
export const ADMIN_SCREENS = [
    { key: 'dashboard',      path: '/admin/dashboard',      label: 'דשבורד',        desc: 'מבט-על, KPIs, פעילות אחרונה' },
    { key: 'orders',         path: '/admin/orders',         label: 'הזמנות',         desc: 'הזמנות מהחנות — סטטוסים ומעקב' },
    { key: 'communications', path: '/admin/communications', label: 'תקשורת ולידים', desc: 'לידים/הצעות מחיר + אישור מיילים לפני שליחה' },
    { key: 'inventory',      path: '/admin/inventory',      label: 'מלאי',           desc: 'מלאי, מלאי חסר, ספי התראה' },
    { key: 'products',       path: '/admin/products',       label: 'מוצרים',         desc: 'קטלוג, עריכת מוצר, מחירים' },
    { key: 'customers',      path: '/admin/customers',      label: 'לקוחות',         desc: 'אנשי קשר ופניות' },
    { key: 'suppliers',      path: '/admin/suppliers',      label: 'ספקים',          desc: 'ניהול ספקים והזמנות רכש' },
    { key: 'analytics',      path: '/admin/analytics',      label: 'אנליטיקה',       desc: 'הכנסות, המרות, מגמות' },
    { key: 'marketing',      path: '/admin/marketing',      label: 'שיווק',          desc: 'קופונים ומבצעים' },
    { key: 'ocr',            path: '/admin/ocr',            label: 'סריקת הזמנה',    desc: 'סריקת הזמנה מצולמת (OCR) והפיכתה להצעה' },
    { key: 'vault',          path: '/admin/vault',          label: 'כספת מסמכים',    desc: 'אחסון מסמכים, חוזים וקבצים' },
    { key: 'settings',       path: '/admin/settings',       label: 'הגדרות',         desc: 'הגדרות אתר ותוכן' },
];

/* ─── Quick navigation actions surfaced as chips in the copilot ──────────────── */
export const QUICK_ACTIONS = [
    { label: 'הזמנות חדשות', path: '/admin/orders' },
    { label: 'מלאי חסר',      path: '/admin/inventory' },
    { label: 'אישור מיילים',  path: '/admin/communications' },
    { label: 'סריקת הזמנה',   path: '/admin/ocr' },
    { label: 'כספת מסמכים',   path: '/admin/vault' },
    { label: 'דשבורד',        path: '/admin/dashboard' },
];

/* ─── Suggested starter prompts (empty-state) ───────────────────────────────── */
export const SUGGESTED_PROMPTS = [
    'מה דורש את תשומת ליבי היום?',
    'הוסף לקוח חדש: ישראל ישראלי, 050-1234567',
    'צור הזמנה חדשה ללקוח',
    'הוסף מוצר חדש לקטלוג',
];

const num = (v) => Number(v) || 0;
const currentScreenLabel = (pathname) => {
    const s = ADMIN_SCREENS.find(x => pathname && pathname.startsWith(x.path));
    return s ? s.label : 'לוח הניהול';
};

/**
 * Build a compact, real-time "state of the store" string from live admin data.
 * Every value here is READ from Firestore via useAdminData() — nothing invented.
 *
 * @param {Object} d
 * @param {Object} d.kpis           — memoised KPI object from useAdminData()
 * @param {Array}  d.inventory      — products
 * @param {Array}  d.activityLog    — recent activity (already ts-desc, limit 50)
 * @param {number} d.pendingEmailsCount — pending_emails awaiting approval
 * @param {string} d.pathname       — current admin route
 * @returns {string}
 */
export function buildAdminDataContext({ kpis = {}, inventory = [], activityLog = [], pendingEmailsCount = 0, pathname = '' } = {}) {
    const lowStock = (inventory || []).filter(p => num(p.stock) <= num(p.threshold ?? 5));
    const lowStockNames = lowStock.slice(0, 6).map(p => `${p.title} (${num(p.stock)})`).join(', ');
    const recent = (activityLog || []).slice(0, 5).map(a => `• ${a.message}`).join('\n');

    const lines = [
        `מסך נוכחי: ${currentScreenLabel(pathname)}`,
        `לידים/הצעות מחיר חדשים: ${num(kpis.newQuotes)}`,
        `שיחות לקוח שלא נקראו: ${num(kpis.unreadQuotes)}`,
        `לידים פעילים בפייפליין: ${num(kpis.pipelineActive)}`,
        `לידים תקועים (ללא התקדמות): ${num(kpis.stalledLeads)}`,
        `הזמנות ממתינות/חדשות: ${num(kpis.allPendingOrders)}`,
        `פניות חדשות מלקוחות: ${num(kpis.contactsNew)}`,
        `מיילים הממתינים לאישור לפני שליחה: ${num(pendingEmailsCount)}`,
        `מוצרים במלאי חסר: ${num(kpis.lowStockCount)}${lowStockNames ? ` — ${lowStockNames}` : ''}`,
        `תזכורות שהגיע זמנן: ${Array.isArray(kpis.dueReminders) ? kpis.dueReminders.length : 0}`,
        `הכנסות החודש: ₪${num(kpis.thisMonthRevenue).toLocaleString()} (${num(kpis.thisMonthOrders)} עסקאות)`,
        `שיעור המרה: ${kpis.conversionRate ?? '0.0'}%`,
    ];

    if (recent) lines.push(`פעילות אחרונה:\n${recent}`);
    return lines.join('\n');
}

/**
 * Assemble the full Hebrew system prompt for the admin copilot, injecting the
 * live data-context string and the screen map.
 *
 * @param {string} dataContext — output of buildAdminDataContext()
 * @returns {string}
 */
export function buildAdminCopilotSystemPrompt(dataContext = '') {
    const screenMap = ADMIN_SCREENS.map(s => `• ${s.label} (${s.path}) — ${s.desc}`).join('\n');

    return `אתה "NextClass AI" — הקופיילוט של צוות הניהול בחנות ה‑B2B של NextClass (טכנולוגיה למוסדות חינוך בישראל).
תפקידך: לעזור למפעיל/ה לנהל את החנות — להסביר פיצ'רים, לענות על שאלות, לסכם את המצב הנוכחי, ולהציע את הצעד הבא הטוב ביותר.

## כללי מענה
- ענה תמיד בעברית, בטון מקצועי, חם ותמציתי — 2 עד 4 משפטים בלבד.
- בסס תשובות על "מצב החנות עכשיו" שמצורף למטה — אלה נתונים אמיתיים ועדכניים. אל תמציא מספרים.
- כשמועיל, הצע לנווט למסך הרלוונטי וציין את שמו (למשל: "עבור/עברי למסך תקשורת ולידים").
- אתה יכול **לנסח** טיוטת מייל ללקוח/ספק או סיכום הצעת מחיר, אך **לעולם אל תטען ששלחת** משהו. כל מייל עובר שער אישור ידני לפני שליחה.

## פעולות שאתה מבצע — יצירת רשומות
כשהמפעיל/ה מבקש/ת ליצור, להוסיף או לפתוח רשומה חדשה (לקוח, הזמנה, מוצר, הזמנת ספק) — **אתה מבצע זאת**. חלץ את כל הפרטים מהבקשה, כתוב משפט קצר שמסביר מה תיצור, ובשורה נפרדת בסוף ההודעה הוסף **תג פעולה יחיד** בדיוק בפורמט:
[ACTION:{"type":"<סוג>","payload":{...}}]

סוגים וסכמות ה-payload:
- createCustomer — לקוח/איש קשר: {"name","phone","email","institution","address","city"}
- createOrder — הזמנת לקוח: {"contactName","institution","phone","email","address","city","items":[{"title","qty","price","catalogNumber"}],"notes","deliveryDate","orderNumber"}
- createProduct — מוצר בקטלוג: {"title","brand","model","price","salePrice","sku","category","stock","description"}
- createSupplierOrder — הזמנת ספק: {"customerName","supplierName","productTitle","qty","totalCost","eta","notes"}
- saveToVault — שמירת המסמך המצורף בכספת: {"folder":"<שם התיקייה בעברית, למשל: חוזים / חשבוניות / הזמנות רכש / מסמכי מוצרים / כללי>","classification":"<contract|invoice|po|quote|receipt|pending>","name":"<שם קובץ קריא>"}

## עבודה עם מסמכים מצורפים
כשמצורף מסמך להודעה (יופיע בהקשר כ"[מסמך מצורף: ...]" עם תוכן הטקסט שחולץ) — קרא/י אותו והיעזר/י בו:
- אם המשתמש/ת מבקש/ת "הוסף/צור הזמנה מהמסמך" — חלץ/י מהטקסט את כל פרטי ההזמנה (לקוח, טלפון, מייל, כתובת, פריטים, מק"ט, כמות, מחיר, תאריך אספקה, מספר הזמנה, הערות) והנפק/י תג createOrder מלא ככל האפשר.
- אם מבקש/ת "שמור בכספת" / "הוסף לתיקייה X" — הנפק/י תג saveToVault עם שם התיקייה שביקש/ה.
- אם מבקש/ת "מה יש במסמך" / "סכם" — סכם/י בקצרה בלי תג פעולה.

חוקים לפעולות:
- הוסף את תג ה-ACTION רק כשהמשתמש/ת ביקש/ה במפורש ליצור/להוסיף/לשמור. המערכת תציג כרטיס אישור סופי — לא נוצר דבר עד שהמשתמש/ת מאשר/ת.
- אל תמציא ערכים. אם שדה חובה (כמו שם או פריט) חסר, שאל עליו ואל תוסיף תג פעולה עדיין.
- תמיד רק תג אחד בכל הודעה. אל תעטוף את התג בגרשיים או בקוד.

## מפת מסכי הניהול
${screenMap}

## מצב החנות עכשיו (נתונים חיים)
${dataContext}`;
}

export default buildAdminCopilotSystemPrompt;
