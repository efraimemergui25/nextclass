/* eslint-disable */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Smartphone, Lock, Bell, Settings, PenLine, Wrench, Check, X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminSectionHeader, AdminButton, AdminInput, AdminToggle, AdminTabs } from '../components/AdminComponents';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { useSettings } from '../../context/SettingsContext';
import { GLASS, RADIUS, SHADOW, SPRING, hexA, glow } from '../theme/tokens';

// ─── Unified brand accent (restrained azure — no per-card rainbow) ─────────────
const BRAND = '#007AFF';

function SettingCard({ title, Icon, accent = BRAND, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, ...SPRING.soft }}
            whileHover={{ boxShadow: `${SHADOW.lg}, ${SHADOW.specular}` }}
            className="overflow-hidden relative transition-shadow"
            style={{ ...GLASS.base, borderRadius: RADIUS.cardLg }}
        >
            {/* Specular top edge */}
            <div className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none z-10"
                style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)' }} />
            <div className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(248,248,250,0.6)' }}>
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: hexA(accent, 0.12), border: `1px solid ${hexA(accent, 0.20)}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
                    {Icon && <Icon size={15} style={{ color: accent }} />}
                </div>
                <h3 className="text-[#1D1D1F] font-black text-base tracking-tight">{title}</h3>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </motion.div>
    );
}

const SETTINGS_TABS = [
    { id: 'business',      label: 'עסק' },
    { id: 'site',          label: 'אתר' },
    { id: 'notifications', label: 'התראות' },
    { id: 'security',      label: 'אבטחה' },
    { id: 'maintenance',   label: 'תחזוקה' },
];

export default function AdminSettings() {
    const { changePin, logout } = useAdminAuth();
    const { repairProductImages, reseedDatabase, resetMarketingContent, wipeAndReseedCatalog, purgeDemoData, createAmalFirstOrder } = useAdminData();
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const { getSetting, updateGlobalSettings } = useSettings();

    // ─── Active tab ───────────────────────────────────────────────────────────────
    const [tab, setTab] = useState('business');

    // ─── PIN ────────────────────────────────────────────────────────────────────
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStatus, setPinStatus] = useState(null);

    // ─── Notifications (localStorage) ──────────────────────────────────────────
    const [notifOrders, setNotifOrders] = useState(() => {
        try { const v = JSON.parse(localStorage.getItem('nextclass_settings') || '{}').notifOrders; return v !== false; } catch { return true; }
    });
    const [notifLowStock, setNotifLowStock] = useState(() => {
        try { const v = JSON.parse(localStorage.getItem('nextclass_settings') || '{}').notifLowStock; return v !== false; } catch { return true; }
    });
    const [notifContacts, setNotifContacts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nextclass_settings') || '{}').notifContacts === true; } catch { return false; }
    });

    // ─── Site toggles (Firestore via SettingsContext) ──────────────────────────
    const maintenanceMode = getSetting('maintenance_mode', false);
    const showPrices      = getSetting('show_prices', true);
    const allowOrders     = getSetting('allow_orders', true);
    const setSiteSetting  = (key, value) => updateGlobalSettings({ [key]: value });

    // ─── Monthly revenue target ─────────────────────────────────────────────────
    const [revenueTarget, setRevenueTarget] = useState(() => getSetting('monthly_revenue_target', 0));

    // ─── Business info (Firestore) ──────────────────────────────────────────────
    const [bizName,      setBizName]      = useState(getSetting('biz_name',        'NextClass'));
    const [bizPhone,     setBizPhone]     = useState(getSetting('contact_phone',    '058-5856356'));
    const [bizWhatsapp,  setBizWhatsapp]  = useState(getSetting('whatsapp_number',  '972585856356'));
    const [bizEmail,     setBizEmail]     = useState(getSetting('contact_email',    'nextclass.en@gmail.com'));
    const [bizAddress,   setBizAddress]   = useState(getSetting('contact_address',  'בראלי 10, תל אביב'));
    const [bizHours,     setBizHours]     = useState(getSetting('contact_hours',    'ראשון–חמישי 08:00–18:00'));
    const [bizInstagram, setBizInstagram] = useState(getSetting('biz_instagram',    ''));
    const [bizFacebook,  setBizFacebook]  = useState(getSetting('biz_facebook',     ''));
    const [bizYoutube,   setBizYoutube]   = useState(getSetting('biz_youtube',      ''));
    const [bizSaved,     setBizSaved]     = useState(false);

    // Re-sync form fields whenever Firestore data arrives (getSetting ref changes on each snapshot)
    useEffect(() => {
        setBizName(getSetting('biz_name',        'NextClass'));
        setBizPhone(getSetting('contact_phone',    '058-5856356'));
        setBizWhatsapp(getSetting('whatsapp_number',  '972585856356'));
        setBizEmail(getSetting('contact_email',    'nextclass.en@gmail.com'));
        setBizAddress(getSetting('contact_address','בראלי 10, תל אביב'));
        setBizHours(getSetting('contact_hours',    'ראשון–חמישי 08:00–18:00'));
        setBizInstagram(getSetting('biz_instagram',''));
        setBizFacebook(getSetting('biz_facebook',  ''));
        setBizYoutube(getSetting('biz_youtube',    ''));
    }, [getSetting]);

    const saveBiz = async () => {
        await updateGlobalSettings({
            biz_name:        bizName,
            contact_phone:   bizPhone,
            whatsapp_number: bizWhatsapp,
            contact_email:   bizEmail,
            contact_address: bizAddress,
            contact_hours:   bizHours,
            biz_instagram:   bizInstagram,
            biz_facebook:    bizFacebook,
            biz_youtube:     bizYoutube,
        });
        showToast('פרטי העסק נשמרו בהצלחה', 'success');
        setBizSaved(true);
        setTimeout(() => setBizSaved(false), 2500);
    };

    // ─── Catalog & Content settings (Firestore) ─────────────────────────────────
    const [catTitle,    setCatTitle]    = useState(getSetting('catalog_title',    'הכלים שמעצבים את המחר.'));
    const [catSubtitle, setCatSubtitle] = useState(getSetting('catalog_subtitle', 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.'));
    const [catBadge,    setCatBadge]    = useState(getSetting('catalog_hero_eyebrow', 'הקטלוג שלנו'));
    const [catAllCat,   setCatAllCat]   = useState(getSetting('catalog_all_cat',  'הכל'));
    const [announcText, setAnnouncText] = useState(getSetting('announcement_text', ''));
    const [contentSaved, setContentSaved] = useState(false);

    useEffect(() => {
        setCatTitle(getSetting('catalog_title',    'הכלים שמעצבים את המחר.'));
        setCatSubtitle(getSetting('catalog_subtitle', 'פתרונות טכנולוגיים חכמים המותאמים לסביבת הלמידה הישראלית.'));
        setCatBadge(getSetting('catalog_hero_eyebrow', 'הקטלוג שלנו'));
        setCatAllCat(getSetting('catalog_all_cat',  'הכל'));
        setAnnouncText(getSetting('announcement_text', ''));
    }, [getSetting]);

    const saveContent = async () => {
        await updateGlobalSettings({
            catalog_title:    catTitle,
            catalog_subtitle: catSubtitle,
            catalog_hero_eyebrow: catBadge,
            catalog_all_cat:  catAllCat,
            announcement_text: announcText,
        });
        showToast('תוכן האתר עודכן בהצלחה', 'success');
        setContentSaved(true);
        setTimeout(() => setContentSaved(false), 2500);
    };

    // ─── Notifications persist ──────────────────────────────────────────────────
    const persistFlag = (key, value) => {
        try {
            const ex = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
            localStorage.setItem('nextclass_settings', JSON.stringify({ ...ex, [key]: value }));
        } catch {}
    };
    useEffect(() => { persistFlag('notifOrders',  notifOrders);  }, [notifOrders]);
    useEffect(() => { persistFlag('notifLowStock', notifLowStock); }, [notifLowStock]);
    useEffect(() => { persistFlag('notifContacts', notifContacts); }, [notifContacts]);

    // ─── PIN change ─────────────────────────────────────────────────────────────
    const handlePinChange = async () => {
        if (!currentPin || !newPin || newPin !== confirmPin) { setPinStatus('error'); setTimeout(() => setPinStatus(null), 2000); return; }
        if (newPin.length < 4) { setPinStatus('short'); setTimeout(() => setPinStatus(null), 2000); return; }
        const ok = await changePin(currentPin, newPin);
        setPinStatus(ok ? 'success' : 'wrong');
        if (ok) { setCurrentPin(''); setNewPin(''); setConfirmPin(''); }
        setTimeout(() => setPinStatus(null), 2500);
    };

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader title="הגדרות" subtitle="ניהול עסק, תוכן, אבטחה ומערכת — כל שינוי מסתנכרן עם השרתים בזמן-אמת" icon={Settings} />

            {/* In-page sectors — no more endless scroll */}
            <AdminTabs tabs={SETTINGS_TABS} active={tab} onChange={setTab} id="settings-tabs" />

            {/* ══ עסק — פרטי עסק + רשתות חברתיות ══════════════════════════════ */}
            {tab === 'business' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SettingCard title="פרטי עסק ויצירת קשר" Icon={Building2} accent={BRAND}>
                        <AdminInput label="שם העסק" value={bizName} onChange={setBizName} />
                        <AdminInput label="טלפון (מוצג בפוטר ובדף צור קשר)" value={bizPhone} onChange={setBizPhone} dir="ltr" placeholder="058-5856356" />
                        <AdminInput label="WhatsApp (מספר בינלאומי, ללא +)" value={bizWhatsapp} onChange={setBizWhatsapp} dir="ltr" placeholder="972585856356" />
                        <AdminInput label="מייל" value={bizEmail} onChange={setBizEmail} dir="ltr" placeholder="nextclass.en@gmail.com" />
                        <AdminInput label="כתובת" value={bizAddress} onChange={setBizAddress} placeholder="בראלי 10, תל אביב" />
                        <AdminInput label="שעות פעילות" value={bizHours} onChange={setBizHours} placeholder="ראשון–חמישי 08:00–18:00" />
                        <AdminButton onClick={saveBiz}>
                            {bizSaved ? <span className="flex items-center gap-1 justify-center"><Check size={14} /> נשמר!</span> : 'שמור פרטי עסק'}
                        </AdminButton>
                        <p className="text-[#AEAEB2] text-xs">נשמר ב-Firestore · מתעדכן בפוטר, דף צור קשר ו-SmartConcierge</p>
                    </SettingCard>

                    <SettingCard title="רשתות חברתיות" Icon={Smartphone} accent={BRAND}>
                        <AdminInput label="Instagram (שם משתמש בלבד)" value={bizInstagram} onChange={setBizInstagram} dir="ltr" placeholder="nextclass.il" />
                        <AdminInput label="Facebook (URL מלא או שם)" value={bizFacebook} onChange={setBizFacebook} dir="ltr" placeholder="nextclassil" />
                        <AdminInput label="YouTube (URL ערוץ)" value={bizYoutube} onChange={setBizYoutube} dir="ltr" placeholder="@nextclass" />
                        <AdminButton onClick={saveBiz}>
                            {bizSaved ? <span className="flex items-center gap-1 justify-center"><Check size={14} /> נשמר!</span> : 'שמור קישורים'}
                        </AdminButton>
                        <p className="text-[#AEAEB2] text-xs">מוצג בפוטר ובדף "הסיפור שלנו"</p>
                    </SettingCard>
                </div>
            )}

            {/* ══ אתר — הגדרות אתר + תוכן קטלוג ═══════════════════════════════ */}
            {tab === 'site' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SettingCard title="הגדרות אתר" Icon={Settings} accent={BRAND}>
                        <div className="space-y-4">
                            <AdminToggle
                                label="מצב תחזוקה"
                                sub="הצג עמוד 'בקרוב' לכל המבקרים"
                                value={maintenanceMode}
                                onChange={v => setSiteSetting('maintenance_mode', v)}
                            />
                            <AdminToggle
                                label="הצג מחירים"
                                sub="הצג מחירי מוצרים בקטלוג"
                                value={showPrices}
                                onChange={v => setSiteSetting('show_prices', v)}
                            />
                            <AdminToggle
                                label="אפשר הזמנות"
                                sub="לקוחות יכולים להשלים רכישות"
                                value={allowOrders}
                                onChange={v => setSiteSetting('allow_orders', v)}
                            />
                        </div>
                        {/* Monthly revenue target */}
                        <div className="pt-4 border-t border-black/06">
                            <p className="text-[13px] font-black text-[#1D1D1F] mb-1">יעד הכנסות חודשי</p>
                            <p className="text-[11px] text-[#86868B] mb-3 font-medium">משמש ב-GoalRing בדשבורד. ריק = חישוב אוטומטי (×1.5 מהחודש הקודם).</p>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-black text-[#86868B]">₪</span>
                                    <input
                                        type="number"
                                        value={revenueTarget || ''}
                                        onChange={e => setRevenueTarget(Number(e.target.value) || 0)}
                                        placeholder="ריק = אוטומטי"
                                        min="0"
                                        dir="ltr"
                                        className="w-full rounded-xl pr-8 pl-4 py-2.5 text-sm font-bold text-[#1D1D1F] outline-none transition-all"
                                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.10)', fontFamily: 'Heebo, sans-serif' }}
                                        onFocus={e => { e.target.style.border = '1px solid rgba(0,122,255,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.09)'; }}
                                        onBlur={e => { e.target.style.border = '1px solid rgba(0,0,0,0.10)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                                <AdminButton onClick={() => {
                                    setSiteSetting('monthly_revenue_target', revenueTarget);
                                    showToast(revenueTarget > 0 ? `יעד עודכן: ₪${revenueTarget.toLocaleString()}` : 'יעד אוטומטי הופעל', 'success');
                                }} size="sm">שמור יעד</AdminButton>
                            </div>
                        </div>
                        <p className="text-[#AEAEB2] text-xs">שינויים נכנסים לתוקף מיידי דרך Firestore</p>
                    </SettingCard>

                    <SettingCard title="תוכן קטלוג ואתר" Icon={PenLine} accent={BRAND}>
                        <AdminInput label="כותרת ראשית (עמוד קטלוג)" value={catTitle} onChange={setCatTitle} />
                        <AdminInput label="תת-כותרת" value={catSubtitle} onChange={setCatSubtitle} rows={2} />
                        <AdminInput label="תווית Badge" value={catBadge} onChange={setCatBadge} placeholder="הקטלוג המוסדי" />
                        <AdminInput label="שם קטגוריה 'הכל'" value={catAllCat} onChange={setCatAllCat} placeholder="הכל" />
                        <AdminInput label="טקסט פס הכרזה (ריק = ללא)" value={announcText} onChange={setAnnouncText} placeholder="משלוח חינם מעל ₪500..." />
                        <AdminButton onClick={saveContent}>
                            {contentSaved ? <span className="flex items-center gap-1 justify-center"><Check size={14} /> נשמר!</span> : 'שמור תוכן'}
                        </AdminButton>
                        <p className="text-[#AEAEB2] text-xs">מסתנכרן עם Firestore · תוצאות נראות מיידית</p>
                    </SettingCard>
                </div>
            )}

            {/* ══ התראות — התראות מערכת ══════════════════════════════════════ */}
            {tab === 'notifications' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SettingCard title="התראות מערכת" Icon={Bell} accent={BRAND}>
                        <div className="space-y-4">
                            <AdminToggle label="הזמנות חדשות" sub="קבל התראה על כל הזמנה נכנסת" value={notifOrders} onChange={setNotifOrders} />
                            <AdminToggle label="מלאי נמוך" sub="התראה כאשר מוצר מתחת לסף" value={notifLowStock} onChange={setNotifLowStock} />
                            <AdminToggle label="פניות לקוחות" sub="התראה על פנייה חדשה מהאתר" value={notifContacts} onChange={setNotifContacts} />
                        </div>
                    </SettingCard>
                </div>
            )}

            {/* ══ אבטחה — שינוי PIN + סיום Session ═══════════════════════════ */}
            {tab === 'security' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SettingCard title="אבטחה — שינוי PIN" Icon={Lock} accent={BRAND}>
                            <AdminInput label="PIN נוכחי" type="password" value={currentPin} onChange={setCurrentPin} placeholder="••••" dir="ltr" />
                            <AdminInput label="PIN חדש (מינימום 4 ספרות)" type="password" value={newPin} onChange={setNewPin} placeholder="••••" dir="ltr" />
                            <AdminInput label="אישור PIN חדש" type="password" value={confirmPin} onChange={setConfirmPin} placeholder="••••" dir="ltr" />
                            {pinStatus && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="text-sm font-bold text-right"
                                    style={{ color: pinStatus === 'success' ? '#34C759' : '#FF3B30' }}>
                                    {pinStatus === 'success' && <span className="flex items-center gap-1 justify-end"><Check size={13} /> קוד הגישה עודכן בהצלחה</span>}
                                    {pinStatus === 'wrong'   && <span className="flex items-center gap-1 justify-end"><X size={13} /> קוד הגישה הנוכחי שגוי</span>}
                                    {pinStatus === 'error'   && <span className="flex items-center gap-1 justify-end"><X size={13} /> הקודים החדשים אינם תואמים</span>}
                                    {pinStatus === 'short'   && <span className="flex items-center gap-1 justify-end"><X size={13} /> קוד חדש קצר מדי (מינימום 4)</span>}
                                </motion.p>
                            )}
                            <AdminButton onClick={handlePinChange} variant="outline">עדכן קוד גישה</AdminButton>
                        </SettingCard>
                    </div>

                    {/* Session / Logout — danger tone kept (semantic) */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={SPRING.soft}
                        className="p-6 flex items-center justify-between relative overflow-hidden"
                        style={{
                            ...GLASS.base,
                            borderRadius: RADIUS.card,
                            border: `1px solid ${hexA('#FF3B30', 0.18)}`,
                            boxShadow: `${SHADOW.md}, ${SHADOW.specular}`,
                        }}>
                        <AdminButton variant="danger" onClick={logout}>יציאה מהמערכת</AdminButton>
                        <div className="text-right">
                            <p className="text-[#1D1D1F] font-black text-sm">סיום Session</p>
                            <p className="text-[#AEAEB2] text-xs">Session בת 8 שעות · כל פעולה מתועדת · נתונים ב-Firestore</p>
                        </div>
                    </motion.div>
                </>
            )}

            {/* ══ תחזוקה — תחזוקת מערכת + ניקוי להשקה ═══════════════════════ */}
            {tab === 'maintenance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SettingCard title="תחזוקת מערכת" Icon={Wrench} accent={BRAND}>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <AdminButton variant="outline" onClick={async () => {
                                    const count = await repairProductImages();
                                    showToast(count > 0 ? `תוקנו ${count} תמונות מוצרים` : 'כל התמונות תקינות', count > 0 ? 'success' : 'info');
                                }}>תיקון תמונות שבורות</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">משווה תמונות ב-Firebase לקובץ המקור ומתקן שוני.</p>
                            </div>
                            <div className="border-t border-black/06 pt-4 flex flex-col gap-2">
                                <AdminButton variant="ghost" onClick={async () => {
                                    if (await confirm({ title: 'סנכרון מלא מחדש?', message: 'פעולה זו תעדכן את כל שדות המוצרים (למעט מלאי ומכירות) לפי קובץ המקור.', confirmLabel: 'סנכרן', danger: true })) {
                                        await reseedDatabase();
                                        showToast('בסיס הנתונים סונכרן מחדש בהצלחה', 'success');
                                    }
                                }}>סנכרון מלא מחדש (Reseed)</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">עדכון מקיף מהמקור. שומר על מלאי ומכירות קיימים.</p>
                            </div>
                        </div>
                    </SettingCard>

                    <SettingCard title="ניקוי להשקה (Launch Cleanup)" Icon={Wrench} accent={BRAND}>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <AdminButton variant="outline" onClick={async () => {
                                    if (await confirm({ title: 'לאפס את התוכן השיווקי לברירת מחדל נקייה?', message: 'הפעולה מסירה נתונים פקטיביים שהוזנו בעבר (המלצות, סטטיסטיקות, שותפים, ביקורות, טיימליין). הגדרות אמיתיות (טלפונים, מתגים) לא ייפגעו.', confirmLabel: 'אפס', danger: true })) {
                                        try {
                                            const n = await resetMarketingContent();
                                            showToast(`תוכן שיווקי נוקה — ${n} שדות אופסו לברירת מחדל נקייה`, 'success');
                                        } catch (e) { showToast('שגיאה בניקוי התוכן', 'error'); }
                                    }
                                }}>אפס תוכן שיווקי לברירת מחדל נקייה</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">מסיר מה-Firestore החי המלצות, סטטיסטיקות ושותפים פקטיביים. בטוח — לא נוגע בהגדרות אמיתיות.</p>
                            </div>
                            <div className="border-t border-black/06 pt-4 flex flex-col gap-2">
                                <AdminButton variant="danger" onClick={async () => {
                                    if (await confirm({ title: 'אזהרה: לאפס את הקטלוג ל-3 המסכים בלבד?', message: 'פעולה זו תמחק את כל המוצרים בבסיס הנתונים ותטען מחדש רק את 3 המסכים האמיתיים.\n\nמוצרים שהוספת (כולל תמונות שהעלית) יוחלפו בנתוני המקור. השתמש רק אם יש מוצרי דמו ישנים לנקות.', confirmLabel: 'אפס קטלוג', danger: true })) {
                                        try {
                                            const r = await wipeAndReseedCatalog();
                                            showToast(`הקטלוג אופס: נמחקו ${r.removed}, נטענו ${r.seeded} מסכים אמיתיים`, 'success');
                                        } catch (e) { showToast('שגיאה באיפוס הקטלוג', 'error'); }
                                    }
                                }}>אפס קטלוג ל-3 המסכים בלבד</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">מוחק את כל המוצרים וטוען מחדש 3 מסכים אמיתיים. לאחר מכן אפשר לערוך פרטים ולהעלות תמונות אמיתיות ב"מוצרים".</p>
                            </div>
                            <div className="border-t border-black/06 pt-4 flex flex-col gap-2">
                                <AdminButton variant="danger" onClick={async () => {
                                    if (await confirm({ title: 'למחוק את כל נתוני הדמו מהדשבורד?', message: 'נמחק: הזמנות, הצעות מחיר, לידים, אנשי קשר, לקוחות, שאלות, ניוזלטר, יומן פעילות, צפיות, מיילים ממתינים, קופונים, לוגים.\nלא ייגע: מלאי, ספקים, הצעות ספקים.\n\nפעולה בלתי הפיכה.', confirmLabel: 'מחק', danger: true })) {
                                        try { const n = await purgeDemoData(); showToast(`נמחקו ${n} רשומות דמו מהדשבורד`, 'success'); }
                                        catch (err) { showToast('שגיאה במחיקת נתוני הדמו', 'error'); }
                                    }
                                }}>מחק נתוני דמו מהדשבורד</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">מנקה הזמנות/לקוחות/אנליטיקות דמו. שומר על מלאי, ספקים והצעות ספקים.</p>
                            </div>
                            <div className="border-t border-black/06 pt-4 flex flex-col gap-2">
                                <AdminButton variant="outline" onClick={async () => {
                                    if (await confirm({ title: 'ליצור את ההזמנה הראשונה מ-PO של עמל (#80363169) ולשמור אותה בכספת?', message: '2× מסך ASUS VA279QG-J 27", סה"כ ₪885 כולל מע"מ.', confirmLabel: 'צור הזמנה', danger: true })) {
                                        try { await createAmalFirstOrder(); showToast('ההזמנה הראשונה (PO עמל 80363169) נוצרה ונשמרה בכספת ✓', 'success'); }
                                        catch (err) { showToast('שגיאה ביצירת ההזמנה: ' + err.message, 'error'); }
                                    }
                                }}>צור הזמנה ראשונה מ-PO עמל (#80363169)</AdminButton>
                                <p className="text-[10px] text-[#AEAEB2]">יוצר את ההזמנה הראשונה בפייפליין (הצעות מחיר) עם כל פרטי ה-PO, ושומר מסמך בכספת. פעולה חד-פעמית.</p>
                            </div>
                        </div>
                    </SettingCard>
                </div>
            )}

            <div className="text-center">
                <p className="text-[#AEAEB2] text-xs">NextClass Admin v2.0 · React + Vite + Firebase · 2026</p>
            </div>
        </div>
    );
}
