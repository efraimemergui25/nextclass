/* eslint-disable */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, BarChart2, Percent, Check, Megaphone, Plus, ChevronLeft, Calendar, Power, Tag, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminButton, AdminModal, AdminInput, AdminToggle, AdminKPICard, AdminEmpty, AdminSearchBar, AdminFilterPills } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { useSettings } from '../../context/SettingsContext';
import { PALETTE, GLASS, RADIUS, SHADOW, GRADIENT, TAP, hexA, glow } from '../theme/tokens';

// ─── Babushka drill helpers (shared with the glass detail drawer) ─────────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#1D1D1F';
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-[14px] p-3 text-center"
                        style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                        <p className="font-black text-[16px] tracking-tight leading-none" style={{ color: c }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                    </motion.div>
                );
            })}
        </div>
    );
}

function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}

const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

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
function BannerManager({ onOpenDetail }) {
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
                <div className={`text-right ${onOpenDetail ? 'cursor-pointer group' : ''}`}
                    onClick={onOpenDetail}
                    role={onOpenDetail ? 'button' : undefined}
                    tabIndex={onOpenDetail ? 0 : undefined}
                    onKeyDown={onOpenDetail ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenDetail(); } } : undefined}>
                    <h3 className="text-[#1D1D1F] font-black text-base flex items-center justify-end gap-1">פס הכרזה לאתר{onOpenDetail && <ChevronLeft size={13} className="opacity-0 group-hover:opacity-50 transition-opacity text-[#AEAEB2]" />}</h3>
                    <p className="text-[#AEAEB2] text-xs mt-0.5">{banner.visible ? 'פעיל' : 'מושבת'}{onOpenDetail ? ' · לחץ לפרטים' : ''}</p>
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
function CouponCard({ coupon, onToggle, onDelete, onOpen, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay, type: 'spring', stiffness: 300, damping: 28 }}
            onClick={onOpen}
            role={onOpen ? 'button' : undefined}
            tabIndex={onOpen ? 0 : undefined}
            onKeyDown={onOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } } : undefined}
            className="flex items-center gap-4 px-5 py-4 border-b border-black/04 last:border-0 transition-colors hover:bg-[#007AFF]/03 cursor-pointer group focus:outline-none"
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
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onToggle(coupon.id); }}
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
                onClick={(e) => { e.stopPropagation(); onDelete(coupon.id); }}
                className="text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                מחק
            </motion.button>

            {/* Drill affordance */}
            <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
        </motion.div>
    );
}

const EMPTY = { code: '', discount: '', type: 'percent', expiry: '', active: true };

export default function AdminMarketing() {
    const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useAdminData();
    const navigate = useNavigate();
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saved, setSaved] = useState(false);
    const [couponFilter, setCouponFilter] = useState('הכל');
    const [couponSearch, setCouponSearch] = useState('');

    // ── Babushka drill stack ──────────────────────────────────────────────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };

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
                    onClick={() => openDrill({ type: 'coupons', kind: 'all' })}
                    icon={<Ticket size={20} color={BRAND} />} />
                <AdminKPICard title="פעילים" value={activeCoupons} subtitle="קופונים פעילים כעת" accent={PALETTE.green} delay={0.05}
                    onClick={() => openDrill({ type: 'coupons', kind: 'active' })}
                    icon={<Check size={20} color={PALETTE.green} />} />
                <AdminKPICard title="שימושים" value={totalUses} subtitle="סך מימושים" accent={PALETTE.azure} delay={0.1}
                    onClick={() => openDrill({ type: 'uses' })}
                    icon={<BarChart2 size={20} color={PALETTE.azure} />} />
                <AdminKPICard title="ממוצע הנחה" value={`${avgDiscount}%`} subtitle="קופוני אחוז" accent={PALETTE.azure} delay={0.15}
                    onClick={() => openDrill({ type: 'avg' })}
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
                        <CouponCard key={c.id} coupon={c} onToggle={toggleCoupon} onDelete={deleteCoupon} onOpen={() => openDrill({ type: 'coupon', id: c.id })} delay={i * 0.025} />
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
            <BannerManager onOpenDetail={() => openDrill({ type: 'announcement' })} />

            {/* ── Babushka Drill Drawer — nested glass detail view ─────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;

                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const couponVal = (c) => c.type === 'percent' ? `${c.discount}% הנחה` : `₪${c.discount} הנחה`;
                let title = '', subtitle = '', icon = null, accent = BRAND, footer = null, body = null;

                if (shown.type === 'coupons') {
                    const list = shown.kind === 'active' ? coupons.filter(c => c.active) : coupons;
                    const uses = list.reduce((s, c) => s + (c.uses || 0), 0);
                    title = shown.kind === 'active' ? 'קופונים פעילים' : 'כל הקופונים';
                    subtitle = `${list.length} קופונים`; accent = shown.kind === 'active' ? PALETTE.green : BRAND;
                    icon = <Ticket size={17} color={accent} />;
                    footer = { label: 'מעבר לניהול שיווק', onClick: () => drillTo('/admin/marketing') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'קופונים', value: list.length, color: accent },
                                { label: 'פעילים', value: list.filter(c => c.active).length, color: PALETTE.green },
                                { label: 'שימושים', value: uses, color: PALETTE.azure },
                            ]} />
                            {list.length === 0 ? <DrillEmpty icon={Ticket} text="אין קופונים להצגה" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">קופונים — לחץ לפרטים</p>
                                    {list.map((c, i) => (
                                        <DrillRow key={c.id} delay={i * 0.03} tone={accent}
                                            onClick={() => pushDrill({ type: 'coupon', id: c.id })}
                                            leading={<span className="px-2 py-1 rounded-md font-mono font-black text-[11px] tracking-widest shrink-0" style={{ background: hexA(c.active ? BRAND : '#8E8E93', 0.1), color: c.active ? BRAND : '#AEAEB2' }}>{c.code}</span>}
                                            title={couponVal(c)}
                                            subtitle={`${c.uses || 0} שימושים${c.expiry ? ` · תוקף ${c.expiry}` : ''}`}
                                            trailing={<span className="text-[10px] font-black rounded-full px-2 py-0.5 shrink-0" style={{ background: hexA(c.active ? PALETTE.green : '#8E8E93', 0.12), color: c.active ? '#1A8C40' : '#8E8E93' }}>{c.active ? 'פעיל' : 'כבוי'}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'uses') {
                    const ranked = [...coupons].sort((a, b) => (b.uses || 0) - (a.uses || 0));
                    const totalUsesLocal = coupons.reduce((s, c) => s + (c.uses || 0), 0);
                    title = 'שימושים בקופונים'; subtitle = `${totalUsesLocal} מימושים סה״כ`; accent = PALETTE.azure;
                    icon = <BarChart2 size={17} color={PALETTE.azure} />;
                    footer = { label: 'מעבר לניהול שיווק', onClick: () => drillTo('/admin/marketing') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ שימושים', value: totalUsesLocal, color: PALETTE.azure },
                                { label: 'קופונים', value: coupons.length, color: BRAND },
                                { label: 'עם שימוש', value: coupons.filter(c => (c.uses || 0) > 0).length, color: PALETTE.green },
                            ]} />
                            {ranked.length === 0 ? <DrillEmpty icon={BarChart2} text="אין קופונים עדיין" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">דירוג לפי שימוש — לחץ לפרטים</p>
                                    {ranked.map((c, i) => (
                                        <DrillRow key={c.id} delay={i * 0.03} tone={PALETTE.azure}
                                            onClick={() => pushDrill({ type: 'coupon', id: c.id })}
                                            leading={<span className="text-[#AEAEB2] text-[11px] font-black w-4 text-center shrink-0">{i + 1}</span>}
                                            title={c.code} subtitle={couponVal(c)}
                                            trailing={<span className="text-[12px] font-black shrink-0" style={{ color: PALETTE.azure }}>{c.uses || 0}</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'avg') {
                    const pctList = coupons.filter(c => c.type === 'percent');
                    const fixedList = coupons.filter(c => c.type !== 'percent');
                    title = 'ממוצע הנחה'; subtitle = 'קופוני אחוז'; accent = PALETTE.azure;
                    icon = <Percent size={17} color={PALETTE.azure} />;
                    footer = { label: 'מעבר לניהול שיווק', onClick: () => drillTo('/admin/marketing') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'ממוצע %', value: `${avgDiscount}%`, color: PALETTE.azure },
                                { label: 'קופוני אחוז', value: pctList.length, color: BRAND },
                                { label: 'קופוני סכום', value: fixedList.length, color: '#8E8E93' },
                            ]} />
                            {pctList.length === 0 ? <DrillEmpty icon={Percent} text="אין קופוני אחוז" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">קופוני אחוז — לחץ לפרטים</p>
                                    {[...pctList].sort((a, b) => b.discount - a.discount).map((c, i) => (
                                        <DrillRow key={c.id} delay={i * 0.03} tone={PALETTE.azure}
                                            onClick={() => pushDrill({ type: 'coupon', id: c.id })}
                                            leading={<span className="px-2 py-1 rounded-md font-mono font-black text-[11px] tracking-widest shrink-0" style={{ background: hexA(BRAND, 0.1), color: BRAND }}>{c.code}</span>}
                                            title={`${c.discount}% הנחה`} subtitle={`${c.uses || 0} שימושים`}
                                            trailing={<span className="text-[12px] font-black shrink-0" style={{ color: PALETTE.azure }}>{c.discount}%</span>} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'coupon') {
                    const c = coupons.find(x => String(x.id) === String(shown.id));
                    title = c ? c.code : 'קופון'; subtitle = c ? couponVal(c) : String(shown.id);
                    accent = c?.active ? PALETTE.green : '#8E8E93';
                    icon = <Ticket size={17} color={accent} />;
                    footer = c ? {
                        label: c.active ? 'כבה קופון' : 'הפעל קופון',
                        onClick: () => { toggleCoupon(c.id); closeDrill(); },
                    } : { label: 'מעבר לניהול שיווק', onClick: () => drillTo('/admin/marketing') };
                    body = c ? (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black rounded-full px-2.5 py-1" style={{ background: hexA(accent, 0.12), color: c.active ? '#1A8C40' : '#8E8E93' }}>{c.active ? 'פעיל' : 'כבוי'}</span>
                                <span className="px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-widest" style={{ background: hexA(BRAND, 0.08), color: BRAND, border: `1px dashed ${hexA(BRAND, 0.25)}` }}>{c.code}</span>
                            </div>
                            <DrillStat items={[
                                { label: 'הנחה', value: c.type === 'percent' ? `${c.discount}%` : `₪${c.discount}`, color: BRAND },
                                { label: 'שימושים', value: c.uses || 0, color: PALETTE.azure },
                                { label: 'סוג', value: c.type === 'percent' ? 'אחוז' : 'סכום', color: '#5856D6' },
                            ]} />
                            <div className="space-y-2">
                                <DrillRow tone={accent}
                                    leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(accent, 0.12) }}><Power size={13} color={accent} /></span>}
                                    title="סטטוס" subtitle={c.active ? 'הקופון פעיל וניתן למימוש' : 'הקופון כבוי'}
                                    trailing={<span className="text-[11px] font-black shrink-0" style={{ color: c.active ? '#1A8C40' : '#8E8E93' }}>{c.active ? 'פעיל' : 'כבוי'}</span>} />
                                <DrillRow tone={BRAND}
                                    leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(BRAND, 0.12) }}><Calendar size={13} color={BRAND} /></span>}
                                    title="תוקף" subtitle={c.expiry ? `בתוקף עד ${c.expiry}` : 'ללא תאריך תפוגה'}
                                    trailing={<span className="text-[11px] font-bold text-[#6E6E73] shrink-0">{c.expiry || '∞'}</span>} />
                                <DrillRow tone={PALETTE.azure}
                                    leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(PALETTE.azure, 0.12) }}><Tag size={13} color={PALETTE.azure} /></span>}
                                    title="מימושים" subtitle="כמות הפעמים שהקופון מומש"
                                    trailing={<span className="text-[12px] font-black shrink-0" style={{ color: PALETTE.azure }}>{c.uses || 0}</span>} />
                            </div>
                        </div>
                    ) : <DrillEmpty icon={Ticket} text="הקופון לא נמצא" />;
                } else if (shown.type === 'announcement') {
                    const aText = getS('announcement_text', '');
                    const aColor = getS('announcement_color', '#007AFF');
                    const aVisible = isVis('vis_announcement_bar', false);
                    title = 'פס הכרזה'; subtitle = aVisible && aText ? 'פעיל באתר' : 'מושבת'; accent = aColor;
                    icon = <Megaphone size={17} color={aColor} />;
                    footer = { label: 'מעבר לדף הבית', onClick: () => drillTo('/') };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סטטוס', value: aVisible ? 'פעיל' : 'כבוי', color: aVisible ? PALETTE.green : '#8E8E93' },
                                { label: 'תוכן', value: aText ? 'הוגדר' : 'ריק', color: aText ? BRAND : '#8E8E93' },
                            ]} />
                            {aText ? (
                                <div>
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2">תצוגה מקדימה</p>
                                    <div className="rounded-xl px-4 py-3 text-white text-sm font-bold text-center" style={{ background: aColor }}>{aText}</div>
                                </div>
                            ) : <DrillEmpty icon={Eye} text="טרם הוגדר טקסט הכרזה" />}
                        </div>
                    );
                } else {
                    title = 'פרטים'; icon = <Ticket size={17} color={BRAND} />;
                    body = <DrillEmpty icon={Ticket} text="אין נתונים להצגה" />;
                }

                return (
                    <DashDrillView
                        open={isOpen}
                        title={title}
                        subtitle={subtitle}
                        icon={icon}
                        accent={accent}
                        canBack={canBack}
                        onBack={popDrill}
                        onClose={closeDrill}
                        footer={footer}
                        levelKey={`${shown.type}:${shown.id ?? shown.kind ?? ''}:${drillStack.length}`}
                    >
                        {body}
                    </DashDrillView>
                );
            })()}
        </div>
    );
}
