/* eslint-disable */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminSectionHeader, AdminButton, AdminInput, AdminToggle } from '../components/AdminComponents';

const card = { border: '1px solid rgba(0,0,0,0.07)', shadow: '0 2px 12px rgba(0,0,0,0.06)' };

function SettingCard({ title, icon, accent = '#007AFF', children }) {
    return (
        <div className="bg-white rounded-[20px] overflow-hidden" style={{ border: card.border, boxShadow: card.shadow }}>
            <div className="h-0.5" style={{ background: accent }} />
            <div className="px-6 py-4 border-b border-black/06 bg-[#FAFAFA] flex items-center justify-between">
                <span className="text-xl">{icon}</span>
                <h3 className="text-[#1D1D1F] font-black text-base">{title}</h3>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </div>
    );
}

export default function AdminSettings() {
    const { changePin, logout } = useAdminAuth();

    // PIN change
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStatus, setPinStatus] = useState(null);

    // Notifications
    const [notifOrders, setNotifOrders] = useState(true);
    const [notifLowStock, setNotifLowStock] = useState(true);
    const [notifContacts, setNotifContacts] = useState(false);

    // Site settings
    const [maintenanceMode, setMaintenanceMode] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nextclass_content') || '{}').maintenance_mode === true; } catch { return false; }
    });
    const [showPrices, setShowPrices] = useState(() => {
        try { const v = JSON.parse(localStorage.getItem('nextclass_content') || '{}').show_prices; return v !== false; } catch { return true; }
    });
    const [allowOrders, setAllowOrders] = useState(() => {
        try { const v = JSON.parse(localStorage.getItem('nextclass_content') || '{}').allow_orders; return v !== false; } catch { return true; }
    });

    const persistSiteFlag = (key, value) => {
        try {
            const existing = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
            localStorage.setItem('nextclass_content', JSON.stringify({ ...existing, [key]: value }));
            window.dispatchEvent(new StorageEvent('storage', { key: 'nextclass_content' }));
        } catch {}
    };

    useEffect(() => { persistSiteFlag('maintenance_mode', maintenanceMode); }, [maintenanceMode]);
    useEffect(() => { persistSiteFlag('show_prices', showPrices); }, [showPrices]);
    useEffect(() => { persistSiteFlag('allow_orders', allowOrders); }, [allowOrders]);

    // Business info
    const [bizName, setBizName] = useState('NextClass');
    const [bizPhone, setBizPhone] = useState('03-9999999');
    const [bizEmail, setBizEmail] = useState('info@nextclass.co.il');
    const [bizAddress, setBizAddress] = useState('תל אביב, ישראל');
    const [bizSaved, setBizSaved] = useState(false);

    const saveBiz = () => {
        try {
            const existing = JSON.parse(localStorage.getItem('nextclass_content') || '{}');
            localStorage.setItem('nextclass_content', JSON.stringify({
                ...existing,
                contact_phone: bizPhone,
                contact_email: bizEmail,
                contact_address: bizAddress,
            }));
        } catch {}
        setBizSaved(true);
        setTimeout(() => setBizSaved(false), 2000);
    };

    const handlePinChange = async () => {
        if (!currentPin || !newPin || newPin !== confirmPin) {
            setPinStatus('error');
            setTimeout(() => setPinStatus(null), 2000);
            return;
        }
        if (newPin.length < 4) {
            setPinStatus('short');
            setTimeout(() => setPinStatus(null), 2000);
            return;
        }
        const ok = await changePin(currentPin, newPin);
        setPinStatus(ok ? 'success' : 'wrong');
        if (ok) { setCurrentPin(''); setNewPin(''); setConfirmPin(''); }
        setTimeout(() => setPinStatus(null), 2500);
    };

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader title="הגדרות" subtitle="ניהול חשבון, אבטחה והגדרות מערכת" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Info */}
                <SettingCard title="פרטי עסק" icon="🏢" accent="#007AFF">
                    <AdminInput label="שם העסק" value={bizName} onChange={setBizName} />
                    <AdminInput label="טלפון" value={bizPhone} onChange={setBizPhone} dir="ltr" />
                    <AdminInput label="מייל" value={bizEmail} onChange={setBizEmail} dir="ltr" />
                    <AdminInput label="כתובת" value={bizAddress} onChange={setBizAddress} />
                    <AdminButton onClick={saveBiz}>
                        {bizSaved ? '✓ נשמר!' : 'שמור פרטי עסק'}
                    </AdminButton>
                    <p className="text-[#AEAEB2] text-xs">פרטים אלה מתעדכנים גם ב-Footer ובדף צור קשר</p>
                </SettingCard>

                {/* Security / PIN */}
                <SettingCard title="אבטחה — שינוי PIN" icon="🔐" accent="#5856D6">
                    <AdminInput label="PIN נוכחי" type="password" value={currentPin} onChange={setCurrentPin} placeholder="••••" dir="ltr" />
                    <AdminInput label="PIN חדש (מינימום 4 ספרות)" type="password" value={newPin} onChange={setNewPin} placeholder="••••" dir="ltr" />
                    <AdminInput label="אישור PIN חדש" type="password" value={confirmPin} onChange={setConfirmPin} placeholder="••••" dir="ltr" />

                    {pinStatus && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-sm font-bold text-right"
                            style={{ color: pinStatus === 'success' ? '#34C759' : '#FF3B30' }}>
                            {pinStatus === 'success' && '✓ קוד הגישה עודכן בהצלחה'}
                            {pinStatus === 'wrong' && '✕ קוד הגישה הנוכחי שגוי'}
                            {pinStatus === 'error' && '✕ הקודים החדשים אינם תואמים'}
                            {pinStatus === 'short' && '✕ קוד חדש קצר מדי (מינימום 4)'}
                        </motion.p>
                    )}

                    <AdminButton onClick={handlePinChange} variant="outline">עדכן קוד גישה</AdminButton>
                </SettingCard>

                {/* Notifications */}
                <SettingCard title="התראות" icon="🔔" accent="#FF9500">
                    <div className="space-y-4">
                        <AdminToggle label="הזמנות חדשות" sub="קבל התראה על כל הזמנה נכנסת" value={notifOrders} onChange={setNotifOrders} />
                        <AdminToggle label="מלאי נמוך" sub="התראה כאשר מוצר מתחת לסף" value={notifLowStock} onChange={setNotifLowStock} />
                        <AdminToggle label="פניות לקוחות" sub="התראה על פנייה חדשה מהאתר" value={notifContacts} onChange={setNotifContacts} />
                    </div>
                </SettingCard>

                {/* Site settings */}
                <SettingCard title="הגדרות אתר" icon="⚙️" accent="#34C759">
                    <div className="space-y-4">
                        <AdminToggle
                            label="מצב תחזוקה"
                            sub="הצג עמוד 'בקרוב' לכל המבקרים"
                            value={maintenanceMode}
                            onChange={setMaintenanceMode}
                        />
                        <AdminToggle
                            label="הצג מחירים"
                            sub="הצג מחירי מוצרים בקטלוג"
                            value={showPrices}
                            onChange={setShowPrices}
                        />
                        <AdminToggle
                            label="אפשר הזמנות"
                            sub="לקוחות יכולים להשלים רכישות"
                            value={allowOrders}
                            onChange={setAllowOrders}
                        />
                    </div>
                </SettingCard>
            </div>

            {/* Session / Logout */}
            <div className="bg-white rounded-[20px] p-6 flex items-center justify-between"
                style={{ border: '1px solid rgba(255,59,48,0.15)', boxShadow: '0 2px 12px rgba(255,59,48,0.06)' }}>
                <AdminButton variant="danger" onClick={logout}>יציאה מהמערכת</AdminButton>
                <div className="text-right">
                    <p className="text-[#1D1D1F] font-black text-sm">סיום Session</p>
                    <p className="text-[#AEAEB2] text-xs">Session בת 8 שעות · כל פעולה מתועדת</p>
                </div>
            </div>

            {/* Version info */}
            <div className="text-center">
                <p className="text-[#AEAEB2] text-xs">NextClass Admin v2.0 · Built with React + Vite · 2026</p>
            </div>
        </div>
    );
}
