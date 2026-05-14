/* eslint-disable */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, BarChart2, Percent } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader, AdminButton, AdminModal, AdminInput, AdminToggle } from '../components/AdminComponents';
import { useSettings } from '../../context/SettingsContext';

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const BANNER_COLORS = [
    { label: 'כחול',  value: '#007AFF' },
    { label: 'ירוק',  value: '#34C759' },
    { label: 'כתום',  value: '#FF9500' },
    { label: 'אדום',  value: '#FF3B30' },
    { label: 'סגול',  value: '#5856D6' },
    { label: 'שחור',  value: '#1D1D1F' },
];

// ─── Banner Manager ───────────────────────────────────────────────────────────
function BannerManager() {
    const { showToast } = useAdminToast();
    const { getSetting, isVisible, updateGlobalSettings } = useSettings();
    const [banner, setBanner] = useState({
        text:    getSetting('announcement_text',  ''),
        color:   getSetting('announcement_color', '#007AFF'),
        visible: isVisible('vis_announcement_bar', false),
    });
    const [saved, setSaved] = useState(false);

    // Stay in sync with Firestore updates
    useEffect(() => {
        setBanner({
            text:    getSetting('announcement_text',  ''),
            color:   getSetting('announcement_color', '#007AFF'),
            visible: isVisible('vis_announcement_bar', false),
        });
    }, [getSetting, isVisible]);

    const saveBanner = async () => {
        await updateGlobalSettings({
            announcement_text:  banner.text,
            announcement_color: banner.color,
            vis_announcement_bar: banner.visible,
        });
        setSaved(true);
        showToast('פס הכרזה עודכן', 'success');
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="rounded-[22px] overflow-hidden" style={glass}>
            <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${banner.color}, ${banner.color}30)` }} />
            <div className="px-6 py-4 border-b border-black/06 flex items-center justify-between"
                style={{ background: 'rgba(248,248,250,0.85)' }}>
                <AdminToggle label="" value={banner.visible} onChange={v => setBanner(b => ({ ...b, visible: v }))} />
                <div className="text-right">
                    <h3 className="text-[#1D1D1F] font-black text-base">פס הכרזה לאתר</h3>
                    <p className="text-[#AEAEB2] text-xs mt-0.5">{banner.visible ? 'פעיל' : 'מושבת'}</p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <AdminInput label="טקסט ההכרזה" value={banner.text}
                    onChange={v => setBanner(b => ({ ...b, text: v }))}
                    placeholder="מבצע מיוחד! משלוח חינם על כל הזמנה מעל ₪500" />
                <div>
                    <p className="text-[#86868B] text-[10px] font-black tracking-[0.18em] mb-2">צבע רקע</p>
                    <div className="flex gap-2.5 flex-wrap">
                        {BANNER_COLORS.map(({ label, value }) => (
                            <motion.button key={value} type="button"
                                whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setBanner(b => ({ ...b, color: value }))}
                                className="w-8 h-8 rounded-full relative"
                                style={{ background: value }}
                                title={label}>
                                {banner.color === value && (
                                    <motion.div
                                        layoutId="banner-color-ring"
                                        className="absolute inset-[-3px] rounded-full border-2 border-[#1D1D1F]"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
                {banner.visible && banner.text && (
                    <div className="rounded-xl px-4 py-3 text-white text-sm font-bold text-center"
                        style={{ background: banner.color }}>
                        {banner.text}
                    </div>
                )}
                <AdminButton onClick={saveBanner}>
                    {saved ? '✓ נשמר ופורסם!' : 'שמור ופרסם'}
                </AdminButton>
            </div>
        </div>
    );
}

// ─── Coupon Card ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, onToggle, onDelete, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
            className="flex items-center gap-4 px-5 py-4 border-b border-black/04 last:border-0 transition-colors hover:bg-[#007AFF]/03"
        >
            {/* Code chip */}
            <div className="shrink-0">
                <div className="px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-widest"
                    style={{
                        background: coupon.active ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.05)',
                        color: coupon.active ? '#007AFF' : '#AEAEB2',
                        border: `1px dashed ${coupon.active ? 'rgba(0,122,255,0.25)' : 'rgba(0,0,0,0.10)'}`,
                    }}>
                    {coupon.code}
                </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-2 mb-0.5">
                    <span className="text-[#1D1D1F] font-black text-base">
                        {coupon.type === 'percent' ? `${coupon.discount}% הנחה` : `₪${coupon.discount} הנחה`}
                    </span>
                </div>
                <div className="flex items-center justify-end gap-3">
                    {coupon.expiry && (
                        <span className="text-[#AEAEB2] text-[10px]">תוקף: {coupon.expiry}</span>
                    )}
                    <span className="text-[#86868B] text-[10px]">{coupon.uses || 0} שימושים</span>
                </div>
            </div>

            {/* Toggle */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onToggle(coupon.id)}
                className="w-10 h-6 rounded-full relative shrink-0"
                style={{ background: coupon.active ? '#34C759' : 'rgba(0,0,0,0.12)' }}>
                <motion.div
                    animate={{ x: coupon.active ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="absolute top-[3px] left-0 rounded-full bg-white shadow-sm"
                    style={{ width: 18, height: 18 }}
                />
            </motion.button>

            {/* Delete */}
            <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(coupon.id)}
                className="text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                מחק
            </motion.button>
        </motion.div>
    );
}

const EMPTY = { code: '', discount: '', type: 'percent', expiry: '', active: true };

export default function AdminMarketing() {
    const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useAdminData();
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saved, setSaved] = useState(false);

    const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleAdd = () => {
        if (!form.code || !form.discount) return;
        addCoupon({ ...form, discount: Number(form.discount) });
        setSaved(true);
        setTimeout(() => { setSaved(false); setForm(EMPTY); setShowNew(false); }, 700);
    };

    const { getSetting: getS, isVisible: isVis } = useSettings();
    const bannerActive = isVis('vis_announcement_bar', false) && !!getS('announcement_text', '');

    const activeCoupons = coupons.filter(c => c.active).length;
    const totalUses = coupons.reduce((s, c) => s + (c.uses || 0), 0);
    const avgDiscount = coupons.filter(c => c.type === 'percent').length
        ? Math.round(coupons.filter(c => c.type === 'percent').reduce((s, c) => s + c.discount, 0) / coupons.filter(c => c.type === 'percent').length)
        : 0;

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader
                title="שיווק וקידום מכירות"
                subtitle={`${coupons.length} קופונים · ${activeCoupons} פעילים · פס הכרזה: ${bannerActive ? 'פעיל' : 'כבוי'}`}
                action={<AdminButton onClick={() => setShowNew(true)}>+ קופון חדש</AdminButton>}
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'קופונים פעילים', value: activeCoupons, color: '#34C759', Icon: Ticket },
                    { label: 'שימושים כולל', value: totalUses, color: '#007AFF', Icon: BarChart2 },
                    { label: 'ממוצע הנחה', value: `${avgDiscount}%`, color: '#FF9500', Icon: Percent },
                ].map(({ label, value, color, Icon }) => (
                    <div key={label} className="rounded-[20px] p-4 text-right relative overflow-hidden"
                        style={{
                            background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.94) 50%, rgba(255,255,255,0.88) 100%)`,
                            backdropFilter: 'blur(40px) saturate(200%)',
                            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                            border: `1px solid ${color}22`,
                            boxShadow: `0 4px 20px ${color}10, 0 1px 0 rgba(255,255,255,0.95) inset`,
                        }}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                                style={{ background: `${color}16`, border: `1px solid ${color}20` }}>
                                <Icon size={15} style={{ color }} />
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        </div>
                        <p className="text-[26px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
                        <p className="text-[#86868B] text-[10px] font-bold mt-1.5 tracking-widest">{label}</p>
                    </div>
                ))}
            </div>

            {/* Coupon list */}
            <div className="rounded-[22px] overflow-hidden" style={glass}>
                <div className="px-5 py-4 border-b border-black/06 flex items-center justify-between"
                    style={{ background: 'rgba(248,248,250,0.85)' }}>
                    <span className="text-[#AEAEB2] text-[10px] font-black tracking-[0.18em]">{coupons.length} קופונים</span>
                    <h3 className="text-[#1D1D1F] font-black text-base">קופוני הנחה</h3>
                </div>

                <AnimatePresence>
                    {coupons.map((c, i) => (
                        <CouponCard key={c.id} coupon={c} onToggle={toggleCoupon} onDelete={deleteCoupon} delay={i * 0.025} />
                    ))}
                </AnimatePresence>

                {coupons.length === 0 && (
                    <div className="py-16 flex flex-col items-center gap-3 text-[#AEAEB2]">
                        <Ticket size={36} className="opacity-30" />
                        <p className="text-sm font-medium">אין קופונים. צור קופון חדש.</p>
                    </div>
                )}
            </div>

            {/* New coupon modal */}
            <AdminModal open={showNew} onClose={() => setShowNew(false)} title="קופון חדש" size="sm">
                <div className="space-y-4" dir="rtl">
                    <AdminInput label="קוד קופון" value={form.code} onChange={v => setField('code', v.toUpperCase())} placeholder="SCHOOL10" dir="ltr" />
                    <div className="grid grid-cols-2 gap-3">
                        <AdminInput label="סכום הנחה" type="number" value={String(form.discount)} onChange={v => setField('discount', v)} placeholder="10" />
                        <div>
                            <label className="block text-[#86868B] text-[10px] font-black tracking-[0.18em] mb-1.5">סוג</label>
                            <select value={form.type} onChange={e => setField('type', e.target.value)}
                                className="w-full rounded-xl px-3 py-2.5 text-[#1D1D1F] text-sm outline-none"
                                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.10)' }}>
                                <option value="percent">אחוז (%)</option>
                                <option value="fixed">סכום קבוע (₪)</option>
                            </select>
                        </div>
                    </div>
                    <AdminInput label="תאריך תפוגה" type="date" value={form.expiry} onChange={v => setField('expiry', v)} dir="ltr" />
                    <AdminToggle label="קופון פעיל" value={form.active} onChange={v => setField('active', v)} />
                    <div className="flex gap-2 pt-1">
                        <AdminButton variant="ghost" onClick={() => setShowNew(false)}>ביטול</AdminButton>
                        <AdminButton onClick={handleAdd} disabled={!form.code || !form.discount}>
                            {saved ? '✓ נוסף!' : 'הוסף קופון'}
                        </AdminButton>
                    </div>
                </div>
            </AdminModal>

            {/* Banner Manager */}
            <BannerManager />
        </div>
    );
}
