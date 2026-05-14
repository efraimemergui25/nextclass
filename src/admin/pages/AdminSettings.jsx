/* eslint-disable */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Smartphone, Lock, Bell, Settings, PenLine, Wrench } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminSectionHeader, AdminButton, AdminInput, AdminToggle } from '../components/AdminComponents';
import { useAdminToast } from '../context/AdminToastContext';
import { useSettings } from '../../context/SettingsContext';

function SettingCard({ title, Icon, accent = '#007AFF', children }) {
    return (
        <div className="rounded-[22px] overflow-hidden" style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}>
            <div className="h-[3px]" style={{ background: accent }} />
            <div className="px-6 py-4 border-b border-black/06 flex items-center justify-between"
                style={{ background: 'rgba(248,248,250,0.85)' }}>
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${accent}14`, border: `1px solid ${accent}20` }}>
                    {Icon && <Icon size={15} style={{ color: accent }} />}
                </div>
                <h3 className="text-[#1D1D1F] font-black text-base">{title}</h3>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </div>
    );
}

export default function AdminSettings() {
    const { changePin, logout } = useAdminAuth();
    const { repairProductImages, reseedDatabase } = useAdminData();
    const { showToast } = useAdminToast();
    const { getSetting, updateGlobalSettings } = useSettings();

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

    // Keep form in sync if Firestore updates after mount
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
    }, []); // runs once; Firestore listener in SettingsContext handles live updates

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
    const [catBadge,    setCatBadge]    = useState(getSetting('catalog_badge',    'הקטלוג המוסדי'));
    const [catAllCat,   setCatAllCat]   = useState(getSetting('catalog_all_cat',  'הכל'));
    const [announcText, setAnnouncText] = useState(getSetting('announcement_text', ''));
    const [contentSaved, setContentSaved] = useState(false);

    const saveContent = async () => {
        await updateGlobalSettings({
            catalog_title:    catTitle,
            catalog_subtitle: catSubtitle,
            catalog_badge:    catBadge,
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
            <AdminSectionHeader title="הגדרות" subtitle="ניהול עסק, תוכן, אבטחה ומערכת — כל שינוי מסתנכרן עם השרתים בזמן-אמת" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Business Info ──────────────────────────────────────────── */}
                <SettingCard title="פרטי עסק ויצירת קשר" Icon={Building2} accent="#007AFF">
                    <AdminInput label="שם העסק" value={bizName} onChange={setBizName} />
                    <AdminInput label="טלפון (מוצג בפוטר ובדף צור קשר)" value={bizPhone} onChange={setBizPhone} dir="ltr" placeholder="058-5856356" />
                    <AdminInput label="WhatsApp (מספר בינלאומי, ללא +)" value={bizWhatsapp} onChange={setBizWhatsapp} dir="ltr" placeholder="972585856356" />
                    <AdminInput label="מייל" value={bizEmail} onChange={setBizEmail} dir="ltr" placeholder="nextclass.en@gmail.com" />
                    <AdminInput label="כתובת" value={bizAddress} onChange={setBizAddress} placeholder="בראלי 10, תל אביב" />
                    <AdminInput label="שעות פעילות" value={bizHours} onChange={setBizHours} placeholder="ראשון–חמישי 08:00–18:00" />
                    <AdminButton onClick={saveBiz}>
                        {bizSaved ? '✓ נשמר!' : 'שמור פרטי עסק'}
                    </AdminButton>
                    <p className="text-[#AEAEB2] text-xs">נשמר ב-Firestore · מתעדכן בפוטר, דף צור קשר ו-SmartConcierge</p>
                </SettingCard>

                {/* ── Social Media ───────────────────────────────────────────── */}
                <SettingCard title="רשתות חברתיות" Icon={Smartphone} accent="#AF52DE">
                    <AdminInput label="Instagram (שם משתמש בלבד)" value={bizInstagram} onChange={setBizInstagram} dir="ltr" placeholder="nextclass.il" />
                    <AdminInput label="Facebook (URL מלא או שם)" value={bizFacebook} onChange={setBizFacebook} dir="ltr" placeholder="nextclassil" />
                    <AdminInput label="YouTube (URL ערוץ)" value={bizYoutube} onChange={setBizYoutube} dir="ltr" placeholder="@nextclass" />
                    <AdminButton onClick={saveBiz}>
                        {bizSaved ? '✓ נשמר!' : 'שמור קישורים'}
                    </AdminButton>
                    <p className="text-[#AEAEB2] text-xs">מוצג בפוטר ובדף "הסיפור שלנו"</p>
                </SettingCard>

                {/* ── Security / PIN ────────────────────────────────────────── */}
                <SettingCard title="אבטחה — שינוי PIN" Icon={Lock} accent="#5856D6">
                    <AdminInput label="PIN נוכחי" type="password" value={currentPin} onChange={setCurrentPin} placeholder="••••" dir="ltr" />
                    <AdminInput label="PIN חדש (מינימום 4 ספרות)" type="password" value={newPin} onChange={setNewPin} placeholder="••••" dir="ltr" />
                    <AdminInput label="אישור PIN חדש" type="password" value={confirmPin} onChange={setConfirmPin} placeholder="••••" dir="ltr" />
                    {pinStatus && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-sm font-bold text-right"
                            style={{ color: pinStatus === 'success' ? '#34C759' : '#FF3B30' }}>
                            {pinStatus === 'success' && '✓ קוד הגישה עודכן בהצלחה'}
                            {pinStatus === 'wrong'   && '✕ קוד הגישה הנוכחי שגוי'}
                            {pinStatus === 'error'   && '✕ הקודים החדשים אינם תואמים'}
                            {pinStatus === 'short'   && '✕ קוד חדש קצר מדי (מינימום 4)'}
                        </motion.p>
                    )}
                    <AdminButton onClick={handlePinChange} variant="outline">עדכן קוד גישה</AdminButton>
                </SettingCard>

                {/* ── Notifications ─────────────────────────────────────────── */}
                <SettingCard title="התראות מערכת" Icon={Bell} accent="#FF9500">
                    <div className="space-y-4">
                        <AdminToggle label="הזמנות חדשות" sub="קבל התראה על כל הזמנה נכנסת" value={notifOrders} onChange={setNotifOrders} />
                        <AdminToggle label="מלאי נמוך" sub="התראה כאשר מוצר מתחת לסף" value={notifLowStock} onChange={setNotifLowStock} />
                        <AdminToggle label="פניות לקוחות" sub="התראה על פנייה חדשה מהאתר" value={notifContacts} onChange={setNotifContacts} />
                    </div>
                </SettingCard>

                {/* ── Site Toggles ──────────────────────────────────────────── */}
                <SettingCard title="הגדרות אתר" Icon={Settings} accent="#34C759">
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
                    <p className="text-[#AEAEB2] text-xs">שינויים נכנסים לתוקף מיידי דרך Firestore</p>
                </SettingCard>

                {/* ── Catalog & Content ─────────────────────────────────────── */}
                <SettingCard title="תוכן קטלוג ואתר" Icon={PenLine} accent="#FF9500">
                    <AdminInput label="כותרת ראשית (עמוד קטלוג)" value={catTitle} onChange={setCatTitle} />
                    <AdminInput label="תת-כותרת" value={catSubtitle} onChange={setCatSubtitle} rows={2} />
                    <AdminInput label="תווית Badge" value={catBadge} onChange={setCatBadge} placeholder="הקטלוג המוסדי" />
                    <AdminInput label="שם קטגוריה 'הכל'" value={catAllCat} onChange={setCatAllCat} placeholder="הכל" />
                    <AdminInput label="טקסט פס הכרזה (ריק = ללא)" value={announcText} onChange={setAnnouncText} placeholder="משלוח חינם מעל ₪500..." />
                    <AdminButton onClick={saveContent}>
                        {contentSaved ? '✓ נשמר!' : 'שמור תוכן'}
                    </AdminButton>
                    <p className="text-[#AEAEB2] text-xs">מסתנכרן עם Firestore · תוצאות נראות מיידית</p>
                </SettingCard>

                {/* ── System Maintenance ────────────────────────────────────── */}
                <SettingCard title="תחזוקת מערכת" Icon={Wrench} accent="#8E8E93">
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
                                if (confirm('האם אתה בטוח? פעולה זו תעדכן את כל שדות המוצרים (למעט מלאי ומכירות) לפי קובץ המקור.')) {
                                    await reseedDatabase();
                                    showToast('בסיס הנתונים סונכרן מחדש בהצלחה', 'success');
                                }
                            }}>סנכרון מלא מחדש (Reseed)</AdminButton>
                            <p className="text-[10px] text-[#AEAEB2]">עדכון מקיף מהמקור. שומר על מלאי ומכירות קיימים.</p>
                        </div>
                    </div>
                </SettingCard>
            </div>

            {/* Session / Logout */}
            <div className="bg-white rounded-[20px] p-6 flex items-center justify-between"
                style={{ border: '1px solid rgba(255,59,48,0.15)', boxShadow: '0 2px 12px rgba(255,59,48,0.06)' }}>
                <AdminButton variant="danger" onClick={logout}>יציאה מהמערכת</AdminButton>
                <div className="text-right">
                    <p className="text-[#1D1D1F] font-black text-sm">סיום Session</p>
                    <p className="text-[#AEAEB2] text-xs">Session בת 8 שעות · כל פעולה מתועדת · נתונים ב-Firestore</p>
                </div>
            </div>

            <div className="text-center">
                <p className="text-[#AEAEB2] text-xs">NextClass Admin v2.0 · React + Vite + Firebase · 2026</p>
            </div>
        </div>
    );
}
