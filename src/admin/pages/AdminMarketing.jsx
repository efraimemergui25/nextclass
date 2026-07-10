/* eslint-disable */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, BarChart2, Percent, Check, Megaphone, Plus } from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminButton, AdminModal, AdminInput, AdminToggle, AdminKPICard, AdminEmpty, AdminSearchBar, AdminFilterPills } from '../components/AdminComponents';
import { useSettings } from '../../context/SettingsContext';
import { PALETTE, GLASS, RADIUS, SHADOW, GRADIENT, TAP, hexA, glow } from '../theme/tokens';

// ─── Unified brand accent (restrained azure — no per-domain rainbow) ───────────
const BRAND      = '#007AFF';
const BRAND_GRAD = GRADIENT.signature;
const BRAND_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.14) 0%, rgba(0,122,255,0.08) 100%)';

// ─── Shared liquid-glass surface (token-driven — one system everywhere) ────────
const glass = { ...GLASS.base };

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
                    {saved ? <span className="flex items-center gap-1 justify-center"><Check size={14} /> נשמר ופורסם!</span> : 'שמור ופרסם'}
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
    const [couponFilter, setCouponFilter] = useState('הכל');
    const [couponSearch, setCouponSearch] = useState('');

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

    const displayedCoupons = useMemo(() => {
        let list = coupons;
        if (couponFilter === 'פעילים') list = list.filter(c => c.active);
        else if (couponFilter === 'כבויים') list = list.filter(c => !c.active);
        const term = couponSearch.trim().toLowerCase();
        if (term) list = list.filter(c => (c.code || '').toLowerCase().includes(term));
        return list;
    }, [coupons, couponFilter, couponSearch]);

    return (
        <div dir="rtl" className="space-y-5">
            {/* Page header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(BRAND, 0.10), border: `1px solid ${hexA(BRAND, 0.18)}`, boxShadow: SHADOW.specular }}>
                    <Megaphone size={22} color={BRAND} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>שיווק וקידום מכירות</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>{coupons.length} קופונים · {activeCoupons} פעילים · פס הכרזה: {bannerActive ? 'פעיל' : 'כבוי'}</p>
                </div>
                <motion.button onClick={() => setShowNew(true)} whileHover={{ y: -2, boxShadow: `0 8px 26px ${hexA(BRAND, 0.5)}` }} whileTap={TAP}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: RADIUS.button, border: '1px solid rgba(255,255,255,0.25)', background: BRAND_GRAD, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 18px ${hexA(BRAND, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    <Plus size={15} />קופון חדש
                </motion.button>
            </div>

            {/* KPI band — coupons · active · uses · avg discount */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                <AdminKPICard title="קופונים" value={coupons.length} subtitle="סך הכל במערכת" accent={BRAND} delay={0}
                    icon={<Ticket size={20} color={BRAND} />} />
                <AdminKPICard title="פעילים" value={activeCoupons} subtitle="קופונים פעילים כעת" accent={PALETTE.green} delay={0.05}
                    icon={<Check size={20} color={PALETTE.green} />} />
                <AdminKPICard title="שימושים" value={totalUses} subtitle="סך מימושים" accent={PALETTE.azure} delay={0.1}
                    icon={<BarChart2 size={20} color={PALETTE.azure} />} />
                <AdminKPICard title="ממוצע הנחה" value={`${avgDiscount}%`} subtitle="קופוני אחוז" accent={PALETTE.azure} delay={0.15}
                    icon={<Percent size={20} color={PALETTE.azure} />} />
            </div>

            {/* Coupon list */}
            <div className="rounded-[22px] overflow-hidden" style={glass}>
                <div className="px-5 py-4 border-b border-black/06 flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: 'rgba(248,248,250,0.85)' }}>
                    <div className="flex items-center gap-3 flex-wrap">
                        <AdminFilterPills options={['הכל', 'פעילים', 'כבויים']} active={couponFilter} onChange={setCouponFilter} id="coupon-filter" />
                        <div className="w-[200px] max-w-full"><AdminSearchBar value={couponSearch} onChange={setCouponSearch} placeholder="חיפוש לפי קוד..." /></div>
                    </div>
                    <h3 className="text-[#1D1D1F] font-black text-base">קופוני הנחה</h3>
                </div>

                <AnimatePresence>
                    {displayedCoupons.map((c, i) => (
                        <CouponCard key={c.id} coupon={c} onToggle={toggleCoupon} onDelete={deleteCoupon} delay={i * 0.025} />
                    ))}
                </AnimatePresence>

                {displayedCoupons.length === 0 && (
                    <AdminEmpty
                        icon="empty"
                        title={coupons.length === 0 ? 'אין קופונים עדיין' : 'לא נמצאו קופונים תואמים'}
                        subtitle={coupons.length === 0 ? 'צור קופון חדש כדי להתחיל לקדם מכירות' : 'נסה לשנות את הסינון או החיפוש'}
                        action={coupons.length === 0 ? { label: 'קופון חדש', onClick: () => setShowNew(true) } : undefined}
                    />
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
                            {saved ? <span className="flex items-center gap-1 justify-center"><Check size={14} /> נוסף!</span> : 'הוסף קופון'}
                        </AdminButton>
                    </div>
                </div>
            </AdminModal>

            {/* Banner Manager */}
            <BannerManager />
        </div>
    );
}
