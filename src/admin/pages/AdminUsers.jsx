/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, limit, getDocs } from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import {
    Users, Search, Download, Mail, Building2,
    Chrome, Lock, Star, ShieldCheck, Clock, RefreshCw, X, FileText
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const TIER_CONFIG = {
    free:    { label: 'פרטי',   color: '#8E8E93', bg: 'rgba(142,142,147,0.12)' },
    member:  { label: 'חבר',    color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
    premium: { label: 'Premium', color: '#FF9500', bg: 'rgba(255,149,0,0.12)'  },
};
const ROLE_HE = { teacher: 'מורה', principal: 'מנהל', it: 'רכז טכנולוגיה', admin: 'מנהל מוסד', other: 'אחר' };

function fmtDate(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: 'short', year: 'numeric' });
}
function relTime(ts) {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1)  return 'עכשיו';
    if (diff < 60) return `לפני ${diff} דק׳`;
    const h = Math.floor(diff / 60);
    if (h < 24)    return `לפני ${h} שעות`;
    const days = Math.floor(h / 24);
    if (days < 7)  return `לפני ${days} ימים`;
    return fmtDate(ts);
}
function exportCSV(users) {
    const headers = ['שם', 'מייל', 'מוסד', 'תפקיד', 'ספק', 'דרגה', 'תאריך הצטרפות', 'כניסה אחרונה'];
    const rows = users.map(u => [
        u.displayName, u.email, u.institution, ROLE_HE[u.role] || u.role,
        u.provider === 'google.com' ? 'Google' : 'מייל',
        TIER_CONFIG[u.memberTier]?.label || u.memberTier,
        fmtDate(u.createdAt), fmtDate(u.lastLogin),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'nextclass-users.csv'; a.click();
    URL.revokeObjectURL(url);
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 40 }) {
    const [imgErr, setImgErr] = useState(false);
    const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
    const color  = colors[((user.displayName || user.email || '').charCodeAt(0) || 0) % colors.length];
    if (user.photoURL && !imgErr) {
        return (
            <img src={user.photoURL} alt={user.displayName}
                onError={() => setImgErr(true)}
                style={{ width: size, height: size, borderRadius: size / 2.5, objectFit: 'cover', flexShrink: 0 }} />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 2.5, flexShrink: 0,
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <span style={{ fontSize: size * 0.38, fontWeight: 900, color: '#fff' }}>
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </span>
        </div>
    );
}

// ── Provider badge ────────────────────────────────────────────────────────────
function ProviderBadge({ provider }) {
    const isGoogle = provider === 'google.com';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
            background: isGoogle ? 'rgba(66,133,244,0.1)' : 'rgba(142,142,147,0.1)',
            color: isGoogle ? '#4285F4' : '#8E8E93',
        }}>
            {isGoogle ? <Chrome size={10} /> : <Lock size={10} />}
            {isGoogle ? 'Google' : 'מייל'}
        </span>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, sub, index }) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
            className="relative overflow-hidden rounded-[20px] p-5" style={glass}>
            <div className="absolute inset-0 pointer-events-none rounded-[20px]"
                style={{ background: `radial-gradient(ellipse at top right, ${color}0D, transparent 65%)` }} />
            <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}15` }}>
                    <Icon size={18} color={color} strokeWidth={2} />
                </div>
            </div>
            <p className="text-2xl font-black tracking-tighter" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[11px] font-bold mt-0.5">{label}</p>
            {sub && <p className="text-[#AEAEB2] text-[10px] font-medium mt-0.5">{sub}</p>}
        </motion.div>
    );
}

const QUOTE_STATUS = {
    'חדש':            { color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' },
    'בטיפול':         { color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
    'ביצירת קשר':    { color: '#FF9500', bg: 'rgba(255,149,0,0.12)'  },
    'הוצע מחיר':     { color: '#5856D6', bg: 'rgba(88,86,214,0.12)'  },
    'במשא ומתן':     { color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
    'נסגר':           { color: '#30D158', bg: 'rgba(48,209,88,0.12)'  },
    'אבד':            { color: '#AEAEB2', bg: 'rgba(174,174,178,0.12)'},
    'בוטל':           { color: '#FF453A', bg: 'rgba(255,69,58,0.12)'  },
};

// ── User detail modal ─────────────────────────────────────────────────────────
function UserModal({ user, onClose, onTierChange }) {
    const { addToast } = useAdminToast();
    const [saving, setSaving]         = useState(false);
    const [userQuotes, setUserQuotes] = useState([]);
    const [loadingQ, setLoadingQ]     = useState(true);
    const tier = TIER_CONFIG[user.memberTier] || TIER_CONFIG.free;

    useEffect(() => {
        if (!user.email) { setLoadingQ(false); return; }
        getDocs(query(
            collection(db, 'quotes'),
            where('email', '==', user.email),
            orderBy('dateTs', 'desc'),
            limit(8)
        ))
            .then(snap => setUserQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
            .catch(() => {})
            .finally(() => setLoadingQ(false));
    }, [user.email]);

    const changeTier = async (newTier) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { memberTier: newTier });
            onTierChange(user.uid, newTier);
            addToast('דרגת המשתמש עודכנה', 'success');
        } catch { addToast('שגיאה בעדכון הדרגה', 'error'); }
        finally { setSaving(false); }
    };

    return (
        <AnimatePresence>
            <motion.div key="modal-bd"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, zIndex: 9900, background: 'rgba(0,0,0,0.5)' }} />
            <motion.div key="modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                    zIndex: 9901, width: 'min(580px, 95vw)',
                    background: '#fff', borderRadius: 28, padding: 32,
                    fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
                    maxHeight: '90vh', overflowY: 'auto',
                }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6E6E73' }}>
                    <X size={15} />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <UserAvatar user={user} size={64} />
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1D1D1F', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
                            {user.displayName || '(ללא שם)'}
                        </h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <ProviderBadge provider={user.provider} />
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: tier.bg, color: tier.color }}>
                                {tier.label}
                            </span>
                            {user.emailVerified && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#30D158' }}>
                                    <ShieldCheck size={11} /> מאומת
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'מייל',           value: user.email,                      icon: Mail },
                        { label: 'מוסד',           value: user.institution || '—',         icon: Building2 },
                        { label: 'תפקיד',          value: ROLE_HE[user.role] || user.role || '—', icon: Star },
                        { label: 'ספק כניסה',      value: user.provider === 'google.com' ? 'Google' : 'מייל/סיסמה', icon: Chrome },
                        { label: 'הצטרף',          value: fmtDate(user.createdAt),          icon: Clock },
                        { label: 'כניסה אחרונה',  value: relTime(user.lastLogin),          icon: RefreshCw },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} style={{ background: '#F5F5F7', borderRadius: 14, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Icon size={12} color="#8E8E93" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', margin: 0, wordBreak: 'break-all' }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Tier editor */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>שינוי דרגת מנוי</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
                            <button key={key} onClick={() => changeTier(key)} disabled={saving || user.memberTier === key}
                                style={{
                                    flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: user.memberTier === key ? 'default' : 'pointer',
                                    fontFamily: 'Heebo, sans-serif', fontWeight: 800, fontSize: 13,
                                    background: user.memberTier === key ? cfg.bg : '#F5F5F7',
                                    color: user.memberTier === key ? cfg.color : '#8E8E93',
                                    transition: 'all 0.15s',
                                    boxShadow: user.memberTier === key ? `0 0 0 1.5px ${cfg.color}40` : 'none',
                                }}>
                                {cfg.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quote timeline */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <FileText size={14} color="#8E8E93" />
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                            היסטוריית בקשות מחיר
                        </p>
                        {!loadingQ && userQuotes.length > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}>
                                {userQuotes.length}
                            </span>
                        )}
                    </div>

                    {loadingQ ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: '#F5F5F7', animation: 'pulse 1.4s ease-in-out infinite' }} />)}
                        </div>
                    ) : userQuotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: '#AEAEB2', fontSize: 13 }}>
                            לא נמצאו בקשות מחיר
                        </div>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {/* Timeline line */}
                            <div style={{ position: 'absolute', right: 11, top: 6, bottom: 6, width: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 1 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {userQuotes.map((q, i) => {
                                    const st = QUOTE_STATUS[q.status] || QUOTE_STATUS['חדש'];
                                    return (
                                        <motion.div key={q.id}
                                            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            {/* Dot */}
                                            <div style={{
                                                width: 24, height: 24, borderRadius: 99, flexShrink: 0, zIndex: 1,
                                                background: st.bg, border: `2px solid ${st.color}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <div style={{ width: 7, height: 7, borderRadius: 99, background: st.color }} />
                                            </div>
                                            {/* Content */}
                                            <div style={{
                                                flex: 1, background: '#F5F5F7', borderRadius: 12,
                                                padding: '10px 14px', display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between', gap: 8,
                                            }}>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', margin: '0 0 2px' }}>
                                                        {q.id}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500, margin: 0 }}>
                                                        {relTime(q.dateTs)} · {q.items?.length || 0} פריטים
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                    {q.subtotal > 0 && (
                                                        <p style={{ fontSize: 13, fontWeight: 900, color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>
                                                            ₪{Number(q.subtotal).toLocaleString()}
                                                        </p>
                                                    )}
                                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                                                        {q.status || 'חדש'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user, index, onClick }) {
    const tier = TIER_CONFIG[user.memberTier] || TIER_CONFIG.free;
    return (
        <motion.tr
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            style={{ cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)' }}
            className="hover:bg-[#F5F5F7] transition-colors"
        >
            <td style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserAvatar user={user} size={38} />
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', margin: '0 0 2px' }}>
                            {user.displayName || '(ללא שם)'}
                        </p>
                        <p style={{ fontSize: 11, color: '#8E8E93', fontWeight: 500, margin: 0 }}>
                            {user.email}
                        </p>
                    </div>
                </div>
            </td>
            <td style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', margin: '0 0 2px' }}>
                    {user.institution || <span style={{ color: '#C7C7CC' }}>—</span>}
                </p>
                <p style={{ fontSize: 11, color: '#8E8E93', margin: 0 }}>
                    {ROLE_HE[user.role] || user.role || ''}
                </p>
            </td>
            <td style={{ padding: '12px 16px' }}>
                <ProviderBadge provider={user.provider} />
            </td>
            <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: tier.bg, color: tier.color }}>
                    {tier.label}
                </span>
            </td>
            <td style={{ padding: '12px 16px', fontSize: 12, color: '#6E6E73', fontWeight: 500 }}>
                {fmtDate(user.createdAt)}
            </td>
            <td style={{ padding: '12px 16px', fontSize: 12, color: '#6E6E73', fontWeight: 500 }}>
                {relTime(user.lastLogin)}
            </td>
        </motion.tr>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
    const { addToast } = useAdminToast();
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [filterTier, setFilterTier] = useState('all');
    const [filterProv, setFilterProv] = useState('all');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return unsub;
    }, []);

    const handleTierChange = (uid, newTier) => {
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, memberTier: newTier } : u));
        if (selected?.uid === uid) setSelected(prev => ({ ...prev, memberTier: newTier }));
    };

    const filtered = useMemo(() => {
        let list = [...users];
        if (filterTier !== 'all') list = list.filter(u => u.memberTier === filterTier);
        if (filterProv !== 'all') list = list.filter(u => (filterProv === 'google') === (u.provider === 'google.com'));
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(u =>
                (u.displayName || '').toLowerCase().includes(q) ||
                (u.email       || '').toLowerCase().includes(q) ||
                (u.institution || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [users, search, filterTier, filterProv]);

    const googleCount  = users.filter(u => u.provider === 'google.com').length;
    const memberCount  = users.filter(u => u.memberTier !== 'free').length;
    const todayCount   = users.filter(u => {
        const d = u.createdAt?.toDate ? u.createdAt.toDate() : null;
        return d && (Date.now() - d.getTime()) < 86400000;
    }).length;

    return (
        <div className="p-6 space-y-6 font-heebo" dir="rtl">
            <AdminSectionHeader
                title="משתמשים רשומים"
                subtitle={`${users.length} משתמשים רשומים באתר`}
                icon={Users}
                actions={
                    <button onClick={() => exportCSV(filtered)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#007AFF] hover:bg-[#007AFF]/10 transition-colors">
                        <Download size={15} /> ייצוא CSV
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard index={0} icon={Users}      color="#007AFF" label="סה״כ משתמשים"  value={users.length} />
                <StatCard index={1} icon={Chrome}     color="#4285F4" label="נרשמו דרך Google" value={googleCount} sub={`${Math.round(googleCount / (users.length || 1) * 100)}% מהסך הכל`} />
                <StatCard index={2} icon={Star}       color="#FF9500" label="מנויים פעילים" value={memberCount} />
                <StatCard index={3} icon={Clock}      color="#30D158" label="נרשמו היום"    value={todayCount} />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                    <Search size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#8E8E93', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="חיפוש לפי שם, מייל, מוסד..."
                        style={{
                            width: '100%', height: 38, paddingRight: 34, paddingLeft: 12,
                            borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)',
                            background: '#fff', fontFamily: 'Heebo, sans-serif',
                            fontSize: 13, color: '#1D1D1F', outline: 'none', direction: 'rtl',
                        }} />
                </div>
                {[
                    { key: 'filterTier', value: filterTier, set: setFilterTier,
                      opts: [['all','כל הדרגות'], ['free','פרטי'], ['member','חבר'], ['premium','Premium']] },
                    { key: 'filterProv', value: filterProv, set: setFilterProv,
                      opts: [['all','כל הספקים'], ['google','Google'], ['email','מייל/סיסמה']] },
                ].map(({ key, value, set, opts }) => (
                    <select key={key} value={value} onChange={e => set(e.target.value)}
                        style={{
                            height: 38, padding: '0 12px', borderRadius: 12,
                            border: '1px solid rgba(0,0,0,0.1)', background: '#fff',
                            fontFamily: 'Heebo, sans-serif', fontSize: 13,
                            color: '#1D1D1F', cursor: 'pointer', outline: 'none',
                        }}>
                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                ))}
            </div>

            {/* Table */}
            <div style={{ ...glass, borderRadius: 20, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#8E8E93', fontSize: 14 }}>טוען...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#8E8E93', fontSize: 14 }}>לא נמצאו משתמשים</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                    {['משתמש', 'מוסד / תפקיד', 'ספק', 'דרגה', 'הצטרף', 'כניסה אחרונה'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <UserRow key={u.uid} user={u} index={i} onClick={() => setSelected(u)} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && (
                <UserModal user={selected} onClose={() => setSelected(null)} onTierChange={handleTierChange} />
            )}
        </div>
    );
}
