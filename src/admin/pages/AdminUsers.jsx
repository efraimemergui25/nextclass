/* eslint-disable */
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, limit, getDocs } from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminKPICard, AdminEmpty, AdminSkeleton } from '../components/AdminComponents';
import { PALETTE, GLASS, RADIUS, TAP, hexA } from '../theme/tokens';
import DashDrillView from '../components/DashDrillView';
import {
    Users, Search, Download, Mail, Building2,
    Chrome, Lock, Star, ShieldCheck, Clock, RefreshCw, X, FileText, Trash2, ChevronLeft
} from 'lucide-react';

// ── Users accent — unified brand azure (de-rainbowed) ─────────────────────────
const ACCENT      = '#007AFF';
const ACCENT_DARK = '#005EC4';

// ── Liquid-glass surface (token-driven — one system everywhere) ────────────────
const glass = { ...GLASS.base };

// ── Accent segmented control (per-page accent pill group) ──────────────────────
function Segmented({ options, value, onChange, accent = ACCENT }) {
    return (
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: RADIUS.chip + 4, background: 'rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
            {options.map(o => {
                const active = value === o.value;
                return (
                    <motion.button key={o.value} type="button" onClick={() => onChange(o.value)} whileTap={{ scale: 0.96 }}
                        style={{
                            position: 'relative', padding: '6px 13px', borderRadius: RADIUS.chip, border: 'none',
                            background: active ? hexA(accent, 0.12) : 'transparent',
                            color: active ? accent : '#86868B', fontSize: 12, fontWeight: active ? 800 : 600,
                            cursor: 'pointer', fontFamily: 'Heebo, sans-serif', whiteSpace: 'nowrap',
                            boxShadow: active ? `0 2px 8px ${hexA(accent, 0.18)}, inset 0 0 0 1px ${hexA(accent, 0.22)}` : 'none',
                            transition: 'color 0.15s, background 0.15s',
                        }}>
                        {o.label}
                    </motion.button>
                );
            })}
        </div>
    );
}

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
    const colors = ['#007AFF', '#5AC8FA', '#34C759', '#FF9500', '#FF3B30', '#0A84FF'];
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
            background: 'linear-gradient(135deg, #007AFF, #5AC8FA)',
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

const QUOTE_STATUS = {
    'חדש':            { color: '#FF9F0A', bg: 'rgba(255,159,10,0.12)' },
    'בטיפול':         { color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
    'ביצירת קשר':    { color: '#FF9500', bg: 'rgba(255,149,0,0.12)'  },
    'הוצע מחיר':     { color: '#5AC8FA', bg: 'rgba(90,200,250,0.12)'  },
    'במשא ומתן':     { color: '#007AFF', bg: 'rgba(0,122,255,0.12)'  },
    'נסגר':           { color: '#30D158', bg: 'rgba(48,209,88,0.12)'  },
    'בוטל':           { color: '#FF453A', bg: 'rgba(255,69,58,0.12)'  },
};

// ── User detail modal ─────────────────────────────────────────────────────────
function UserModal({ user, onClose, onTierChange, onDeleteUser }) {
    const { showToast } = useAdminToast();
    const [saving, setSaving]         = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [userQuotes, setUserQuotes] = useState([]);
    const [loadingQ, setLoadingQ]     = useState(true);
    const [form, setForm] = useState({
        displayName: user.displayName || '',
        email:       user.email || '',
        institution: user.institution || '',
        role:        user.role || '',
    });
    const tier = TIER_CONFIG[user.memberTier] || TIER_CONFIG.free;
    const dirty = form.displayName !== (user.displayName || '')
        || form.institution !== (user.institution || '')
        || form.role        !== (user.role || '');

    useEffect(() => {
        if (!user.email) { setLoadingQ(false); return; }
        // No orderBy — avoids composite-index requirement; sort client-side instead
        getDocs(query(
            collection(db, 'quotes'),
            where('email', '==', user.email),
            limit(20)
        ))
            .then(snap => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                docs.sort((a, b) => (b.dateTs || 0) - (a.dateTs || 0));
                setUserQuotes(docs.slice(0, 8));
            })
            .catch(() => {})
            .finally(() => setLoadingQ(false));
    }, [user.email]);

    const changeTier = async (newTier) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { memberTier: newTier });
            onTierChange(user.uid, newTier);
            showToast('דרגת המשתמש עודכנה', 'success');
        } catch { showToast('שגיאה בעדכון הדרגה', 'error'); }
        finally { setSaving(false); }
    };

    const saveProfile = async () => {
        if (!dirty) return;
        setSavingProfile(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                displayName: form.displayName.trim(),
                institution: form.institution.trim(),
                role:        form.role,
            });
            showToast('פרטי המשתמש נשמרו', 'success');
        } catch { showToast('שגיאה בשמירת הפרטים', 'error'); }
        finally { setSavingProfile(false); }
    };

    const fieldInput = {
        width: '100%', padding: '9px 12px', borderRadius: 12, boxSizing: 'border-box',
        border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)',
        fontFamily: 'Heebo, sans-serif', fontSize: 13, fontWeight: 700, color: '#1D1D1F',
        outline: 'none', direction: 'rtl', transition: 'border 0.15s, box-shadow 0.15s',
    };
    const onFieldFocus = e => { e.target.style.border = `1.5px solid ${hexA(ACCENT, 0.5)}`; e.target.style.boxShadow = `0 0 0 4px ${hexA(ACCENT, 0.12)}`; };
    const onFieldBlur  = e => { e.target.style.border = '1px solid rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none'; };

    return (
        // Single flex overlay — Framer Motion cannot override flex centering the way
        // it overrides CSS transform, so this is the only reliable approach.
        <motion.div key="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9900, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
            <motion.div key="modal"
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: 'min(580px, 100%)', maxHeight: '90vh', overflowY: 'auto',
                    background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.72)', borderRadius: 28, padding: 32,
                    fontFamily: 'Heebo, sans-serif', direction: 'rtl',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
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

                {/* Editable profile */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>עריכת פרטים</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Users size={12} color="#8E8E93" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>שם מלא</span>
                            </div>
                            <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                                dir="rtl" placeholder="(ללא שם)" style={fieldInput} onFocus={onFieldFocus} onBlur={onFieldBlur} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Mail size={12} color="#8E8E93" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>מייל (זהות כניסה — לקריאה בלבד)</span>
                            </div>
                            <input value={form.email} readOnly disabled title="המייל הוא זהות הכניסה ואינו ניתן לעריכה מכאן"
                                dir="ltr" type="email" placeholder="—" style={{ ...fieldInput, direction: 'ltr', textAlign: 'right', opacity: 0.6, cursor: 'not-allowed' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Building2 size={12} color="#8E8E93" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>מוסד</span>
                            </div>
                            <input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                                dir="rtl" placeholder="—" style={fieldInput} onFocus={onFieldFocus} onBlur={onFieldBlur} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                                <Star size={12} color="#8E8E93" />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' }}>תפקיד</span>
                            </div>
                            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                dir="rtl" style={{ ...fieldInput, cursor: 'pointer', appearance: 'none' }} onFocus={onFieldFocus} onBlur={onFieldBlur}>
                                <option value="">—</option>
                                {Object.entries(ROLE_HE).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button onClick={saveProfile} disabled={!dirty || savingProfile}
                        style={{
                            width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 12, border: 'none',
                            cursor: (!dirty || savingProfile) ? 'default' : 'pointer',
                            fontFamily: 'Heebo, sans-serif', fontWeight: 800, fontSize: 13,
                            background: (!dirty || savingProfile) ? '#F5F5F7' : hexA(ACCENT, 0.12),
                            color: (!dirty || savingProfile) ? '#C7C7CC' : ACCENT,
                            boxShadow: (!dirty || savingProfile) ? 'none' : `inset 0 0 0 1.5px ${hexA(ACCENT, 0.28)}`,
                            transition: 'all 0.15s',
                        }}>
                        {savingProfile ? 'שומר…' : 'שמור שינויים'}
                    </button>
                </div>

                {/* Read-only meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'ספק כניסה',      value: user.provider === 'google.com' ? 'Google' : 'מייל/סיסמה', icon: Chrome },
                        { label: 'הצטרף',          value: fmtDate(user.createdAt),          icon: Clock },
                        { label: 'כניסה אחרונה',  value: relTime(user.lastLogin),          icon: RefreshCw },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 14, padding: '12px 14px' }}>
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
                            {[1, 2].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.7)', animation: 'pulse 1.4s ease-in-out infinite' }} />)}
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
                                                flex: 1, background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.7)', borderRadius: 12,
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

                {/* Delete user */}
                <div style={{ borderTop: '1px solid rgba(255,59,48,0.12)', paddingTop: 16, marginTop: 8 }}>
                    <button
                        onClick={async () => { if (await onDeleteUser(user)) onClose(); }}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,59,48,0.25)',
                            background: 'rgba(255,59,48,0.06)', color: '#FF3B30', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            fontFamily: 'Heebo, sans-serif', fontWeight: 800, fontSize: 13, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.06)'; }}
                    >
                        <Trash2 size={13} /> מחק משתמש לצמיתות
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── User row ──────────────────────────────────────────────────────────────────
// ── RFM Segment Badge ─────────────────────────────────────────────────────────
const RFM_SEGMENTS = {
    champion: { label: 'VIP',      color: '#FF9500', bg: 'rgba(255,149,0,0.12)',    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg> },
    loyal:    { label: 'נאמן',     color: '#007AFF', bg: 'rgba(0,122,255,0.11)',    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> },
    active:   { label: 'פעיל',     color: '#34C759', bg: 'rgba(52,199,89,0.11)',    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg> },
    at_risk:  { label: 'בסיכון',   color: '#FF3B30', bg: 'rgba(255,59,48,0.11)',    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> },
    churned:  { label: 'לא פעיל',  color: '#8E8E93', bg: 'rgba(142,142,147,0.10)', icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
    new_user: { label: 'חדש',      color: '#5AC8FA', bg: 'rgba(90,200,250,0.11)',    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
};

function getRFMSegment(email, orders, quotes) {
    if (!email) return null;
    const emailLow = email.toLowerCase();
    const userOrders = orders.filter(o => (o.email || o.customerEmail || '').toLowerCase() === emailLow);
    const userQuotes = quotes.filter(q => (q.email || '').toLowerCase() === emailLow);
    const allActivity = [...userOrders, ...userQuotes];
    if (allActivity.length === 0) return null;

    const now = Date.now();
    const lastActivity = Math.max(...allActivity.map(a => a.dateTs || 0));
    const daysSinceLast = (now - lastActivity) / 86400000;
    const frequency = allActivity.length;
    const monetary = userOrders.reduce((s, o) => s + (o.total || 0), 0)
                   + userQuotes.filter(q => ['נסגר','סופק'].includes(q.status))
                               .reduce((s, q) => s + (Number(q.subtotal) || 0), 0);

    if (frequency >= 5 && daysSinceLast < 60 && monetary > 5000) return 'champion';
    if (frequency >= 3 && daysSinceLast < 90) return 'loyal';
    if (frequency >= 1 && daysSinceLast < 30) return 'active';
    if (daysSinceLast < 7) return 'new_user';
    if (daysSinceLast > 180) return 'churned';
    if (frequency >= 2 && daysSinceLast > 90) return 'at_risk';
    return 'active';
}

function RFMBadge({ segment }) {
    if (!segment) return null;
    const cfg = RFM_SEGMENTS[segment];
    if (!cfg) return null;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

// ─── Babushka drill primitives (shared visual grammar with the dashboard) ─────
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
                        <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ color: c }}>{s.value}</p>
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

function UserRow({ user, index, onClick, onDelete, rfmSegment }) {
    const tier = TIER_CONFIG[user.memberTier] || TIER_CONFIG.free;
    return (
        <motion.tr
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={onClick}
            tabIndex={0} role="button"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
            style={{ cursor: 'pointer' }}
            className="group border-t border-black/[0.05] hover:bg-[#007AFF]/[0.035] focus:outline-none focus-visible:bg-[#007AFF]/[0.05] transition-colors"
        >
            <td className="relative" style={{ padding: '14px 16px' }}>
                {/* hover accent rail (right edge in RTL) */}
                <span className="absolute right-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-gradient-to-b from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <UserAvatar user={user} size={40} />
                    <div style={{ minWidth: 0 }}>
                        <p className="group-hover:text-[#007AFF] transition-colors" style={{ fontSize: 14.5, fontWeight: 800, color: '#1D1D1F', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.displayName || '(ללא שם)'}
                        </p>
                        <p dir="ltr" style={{ fontSize: 12, color: '#8E8E93', fontWeight: 500, margin: 0, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.email || '—'}
                        </p>
                    </div>
                </div>
            </td>
            <td style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: '#1D1D1F', margin: '0 0 2px' }}>
                    {user.institution || <span style={{ color: '#C7C7CC' }}>—</span>}
                </p>
                <p style={{ fontSize: 11.5, color: '#8E8E93', margin: 0 }}>
                    {ROLE_HE[user.role] || user.role || ''}
                </p>
            </td>
            <td style={{ padding: '14px 16px' }}>
                <ProviderBadge provider={user.provider} />
            </td>
            <td style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: tier.bg, color: tier.color, width: 'fit-content' }}>
                        {tier.label}
                    </span>
                    <RFMBadge segment={rfmSegment} />
                </div>
            </td>
            <td className="tabular-nums" style={{ padding: '14px 16px', fontSize: 12.5, color: '#6E6E73', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {fmtDate(user.createdAt)}
            </td>
            <td className="tabular-nums" style={{ padding: '14px 16px', fontSize: 12.5, color: '#6E6E73', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span>{relTime(user.lastLogin)}</span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete?.(user); }}
                        aria-label="מחק משתמש"
                        title="מחק משתמש"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            width: 30, height: 30, borderRadius: 9, cursor: 'pointer',
                            border: '1px solid rgba(255,59,48,0.22)', background: 'rgba(255,59,48,0.08)', color: '#FF3B30',
                            transition: 'background 0.15s, opacity 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.16)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.08)'; }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </motion.tr>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const { orders, quotes } = useAdminData();
    const [users, setUsers]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [filterTier, setFilterTier] = useState('all');
    const [filterProv, setFilterProv] = useState('all');
    const [selected, setSelected] = useState(null);
    const [searchParams] = useSearchParams();

    // ── Babushka drill stack — each entry is one nested detail level ──────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const openUser   = (u) => { closeDrill(); setSelected(u); };

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setUsers(list);
            setLoading(false);
            setSelected(prev => {
                if (!prev) return prev;
                const fresh = list.find(u => u.uid === prev.uid);
                return fresh ? fresh : prev;
            });
        }, () => setLoading(false));
        return unsub;
    }, []);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (!emailParam || !users.length) return;
        const match = users.find(u => (u.email || '').toLowerCase() === emailParam.toLowerCase());
        if (match) setSelected(match);
    }, [searchParams, users]);

    const handleTierChange = (uid, newTier) => {
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, memberTier: newTier } : u));
        if (selected?.uid === uid) setSelected(prev => ({ ...prev, memberTier: newTier }));
    };
    // Shared hard-delete — used by both the per-row trash button and the modal.
    // Returns true on a completed delete so callers (e.g. the modal) can close.
    const deleteUser = async (user) => {
        if (!await confirm({ message: `למחוק את המשתמש "${user.displayName || user.email}" לצמיתות? פעולה זו אינה הפיכה.`, danger: true })) return false;
        try {
            await deleteDoc(doc(db, 'users', user.uid));
            setUsers(prev => prev.filter(u => u.uid !== user.uid));
            showToast('המשתמש נמחק', 'warning');
            return true;
        } catch { showToast('שגיאה במחיקת המשתמש', 'error'); return false; }
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

    // ── Pre-compute RFM segments for all users ────────────────────────────────
    const rfmMap = useMemo(() => {
        const map = {};
        users.forEach(u => {
            if (u.email) map[u.email.toLowerCase()] = getRFMSegment(u.email, orders, quotes);
        });
        return map;
    }, [users, orders, quotes]);

    const googleCount  = users.filter(u => u.provider === 'google.com').length;
    const memberCount  = users.filter(u => u.memberTier !== 'free').length;
    const todayCount   = users.filter(u => {
        const d = u.createdAt?.toDate ? u.createdAt.toDate() : null;
        return d && (Date.now() - d.getTime()) < 86400000;
    }).length;

    return (
        <div className="p-6 space-y-6 font-heebo" dir="rtl">
            {/* ── Header — azure icon circle (only color) + ink title, no glow ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(ACCENT, 0.12), border: `1px solid ${hexA(ACCENT, 0.20)}` }}>
                    <Users size={22} color={ACCENT} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>משתמשים רשומים</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>{users.length} משתמשים רשומים באתר · ניהול דרגות מנוי</p>
                </div>
                <motion.button onClick={() => exportCSV(filtered)} whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }} whileTap={TAP}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: RADIUS.button, border: `1.5px solid ${hexA(ACCENT, 0.32)}`, background: hexA(ACCENT, 0.08), color: ACCENT_DARK, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                    <Download size={15} /> ייצוא CSV
                </motion.button>
            </div>

            {/* ── KPI band — cyan primary + semantic accents ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminKPICard title="סה״כ משתמשים" value={users.length} subtitle="רשומים באתר" accent={ACCENT} delay={0}
                    icon={<Users size={20} color={ACCENT} />} loading={loading} onClick={() => openDrill({ type: 'usersKpi' })} />
                <AdminKPICard title="דרך Google" value={googleCount} subtitle={`${Math.round(googleCount / (users.length || 1) * 100)}% מהסך הכל`} accent="#4285F4" delay={0.05}
                    icon={<Chrome size={20} color="#4285F4" />} loading={loading} onClick={() => openDrill({ type: 'providerKpi' })} />
                <AdminKPICard title="מנויים פעילים" value={memberCount} subtitle="חבר / Premium" accent={PALETTE.orange} delay={0.1}
                    icon={<Star size={20} color={PALETTE.orange} />} loading={loading} onClick={() => openDrill({ type: 'tierKpi' })} />
                <AdminKPICard title="נרשמו היום" value={todayCount} subtitle="24 שעות אחרונות" accent={PALETTE.emerald} delay={0.15}
                    icon={<Clock size={20} color={PALETTE.emerald} />} loading={loading} onClick={() => openDrill({ type: 'todayKpi' })} />
            </div>

            {/* ── Filters — search + accent segmented pills ── */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
                    <Search size={14} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="חיפוש לפי שם, מייל, מוסד..." dir="rtl"
                        style={{
                            ...GLASS.frosted, width: '100%', height: 40, paddingRight: 36, paddingLeft: 14,
                            borderRadius: RADIUS.input, fontFamily: 'Heebo, sans-serif',
                            fontSize: 13, fontWeight: 600, color: '#1D1D1F', outline: 'none', boxSizing: 'border-box',
                            transition: 'border 0.15s, box-shadow 0.15s',
                        }}
                        onFocus={e => { e.target.style.border = `1.5px solid ${hexA(ACCENT, 0.5)}`; e.target.style.boxShadow = `0 0 0 4px ${hexA(ACCENT, 0.12)}`; }}
                        onBlur={e => { e.target.style.border = GLASS.frosted.border; e.target.style.boxShadow = GLASS.frosted.boxShadow; }} />
                </div>
                <div style={{ flex: 1 }} />
                <Segmented value={filterTier} onChange={setFilterTier}
                    options={[{ value: 'all', label: 'הכל' }, { value: 'free', label: 'פרטי' }, { value: 'member', label: 'חבר' }, { value: 'premium', label: 'Premium' }]} />
                <Segmented value={filterProv} onChange={setFilterProv}
                    options={[{ value: 'all', label: 'כל הספקים' }, { value: 'google', label: 'Google' }, { value: 'email', label: 'מייל' }]} />
            </div>

            {/* ── Table — loading skeleton · guiding empty · glass surface ── */}
            {loading ? (
                <AdminSkeleton rows={6} />
            ) : filtered.length === 0 ? (
                <div style={{ ...glass, borderRadius: RADIUS.card, overflow: 'hidden' }}>
                    <AdminEmpty
                        title={users.length === 0 ? 'אין משתמשים רשומים עדיין' : 'לא נמצאו משתמשים'}
                        subtitle={users.length === 0 ? 'משתמשים חדשים יופיעו כאן מיד עם ההרשמה לאתר' : 'נסה לשנות את מונחי החיפוש או הסינון'}
                    />
                </div>
            ) : (
                <div className="rounded-[22px] overflow-hidden bg-white/70 border border-black/[0.05] shadow-[0_10px_44px_rgba(20,40,80,0.07)]" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }} dir="rtl">
                            <thead>
                                <tr className="bg-gradient-to-l from-black/[0.02] to-transparent">
                                    {['משתמש', 'מוסד / תפקיד', 'ספק', 'דרגה', 'הצטרף', 'כניסה אחרונה'].map(h => (
                                        <th key={h} className="text-[10px] font-black tracking-[0.14em] text-[#AEAEB2] uppercase" style={{ padding: '13px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <UserRow key={u.uid} user={u} index={i} onClick={() => setSelected(u)} onDelete={deleteUser} rfmSegment={u.email ? rfmMap[u.email.toLowerCase()] : null} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {createPortal(
                <AnimatePresence>
                    {selected && (
                        <UserModal key={selected.uid} user={selected} onClose={() => setSelected(null)} onTierChange={handleTierChange} onDeleteUser={deleteUser} />
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ── Babushka Drill Drawer — nested glass detail view ───────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;

                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const usersOfTier = (t) => users.filter(u => (u.memberTier || 'free') === t);
                const usersOfProvider = (p) => users.filter(u => (u.provider === 'google.com') === (p === 'google'));
                const todayUsers = users.filter(u => { const d = u.createdAt?.toDate ? u.createdAt.toDate() : null; return d && (Date.now() - d.getTime()) < 86400000; });
                const pct = (n) => users.length ? Math.round(n / users.length * 100) : 0;

                // A user record rendered as a clickable drill row → opens the full modal.
                const userRow = (u, i) => {
                    const tier = TIER_CONFIG[u.memberTier] || TIER_CONFIG.free;
                    return (
                        <DrillRow key={u.uid} delay={i * 0.03}
                            onClick={() => openUser(u)}
                            leading={<UserAvatar user={u} size={32} />}
                            title={u.displayName || '(ללא שם)'}
                            subtitle={u.email || u.institution || '—'}
                            trailing={<span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" style={{ background: tier.bg, color: tier.color }}>{tier.label}</span>}
                        />
                    );
                };

                let title = '', subtitle = '', icon = null, accent = '#007AFF', footer = null, body = null;

                if (shown.type === 'usersKpi') {
                    title = 'משתמשים רשומים'; subtitle = `${users.length} סה״כ`; accent = ACCENT;
                    icon = <Users size={17} color={ACCENT} />;
                    footer = { label: 'ייצוא CSV מלא', onClick: () => { exportCSV(users); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ', value: users.length, color: ACCENT },
                                { label: 'Google', value: googleCount, color: '#4285F4' },
                                { label: 'מנויים', value: memberCount, color: PALETTE.orange },
                                { label: 'היום', value: todayCount, color: PALETTE.emerald },
                            ]} />
                            {users.length === 0 ? (
                                <DrillEmpty icon={Users} text="אין משתמשים רשומים עדיין" />
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">לפי דרגת מנוי — לחץ לצלילה</p>
                                        {Object.entries(TIER_CONFIG).map(([key, cfg], i) => {
                                            const n = usersOfTier(key).length;
                                            return (
                                                <DrillRow key={key} delay={i * 0.03} tone={cfg.color}
                                                    onClick={n > 0 ? () => pushDrill({ type: 'tierGroup', tier: key }) : undefined}
                                                    leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-black" style={{ background: cfg.bg, color: cfg.color }}>{n}</span>}
                                                    title={cfg.label}
                                                    subtitle={`${pct(n)}% מהמשתמשים`}
                                                    trailing={<span className="text-[11px] font-black shrink-0" style={{ color: cfg.color }}>{n}</span>}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">לפי ספק כניסה — לחץ לצלילה</p>
                                        {[{ p: 'google', label: 'Google', color: '#4285F4', n: googleCount }, { p: 'email', label: 'מייל / סיסמה', color: '#8E8E93', n: users.length - googleCount }].map((r, i) => (
                                            <DrillRow key={r.p} delay={i * 0.03} tone={r.color}
                                                onClick={r.n > 0 ? () => pushDrill({ type: 'providerGroup', provider: r.p }) : undefined}
                                                leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(r.color, 0.12) }}>{r.p === 'google' ? <Chrome size={14} color={r.color} /> : <Lock size={14} color={r.color} />}</span>}
                                                title={r.label}
                                                subtitle={`${pct(r.n)}% מהמשתמשים`}
                                                trailing={<span className="text-[11px] font-black shrink-0" style={{ color: r.color }}>{r.n}</span>}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                } else if (shown.type === 'providerKpi') {
                    const emailCount = users.length - googleCount;
                    title = 'ספקי כניסה'; subtitle = `${googleCount} Google · ${emailCount} מייל`; accent = '#4285F4';
                    icon = <Chrome size={17} color="#4285F4" />;
                    footer = { label: 'ייצוא CSV מלא', onClick: () => { exportCSV(users); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'Google', value: googleCount, color: '#4285F4' },
                                { label: 'מייל / סיסמה', value: emailCount, color: '#8E8E93' },
                                { label: 'אחוז Google', value: `${pct(googleCount)}%`, color: ACCENT },
                            ]} />
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">בחר ספק — לחץ לצלילה</p>
                                {[{ p: 'google', label: 'Google', color: '#4285F4', n: googleCount }, { p: 'email', label: 'מייל / סיסמה', color: '#8E8E93', n: emailCount }].map((r, i) => (
                                    <DrillRow key={r.p} delay={i * 0.03} tone={r.color}
                                        onClick={r.n > 0 ? () => pushDrill({ type: 'providerGroup', provider: r.p }) : undefined}
                                        leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(r.color, 0.12) }}>{r.p === 'google' ? <Chrome size={14} color={r.color} /> : <Lock size={14} color={r.color} />}</span>}
                                        title={r.label}
                                        subtitle={`${r.n} משתמשים`}
                                        trailing={<span className="text-[11px] font-black shrink-0" style={{ color: r.color }}>{r.n}</span>}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                } else if (shown.type === 'tierKpi') {
                    const freeCount = usersOfTier('free').length;
                    const memCount = usersOfTier('member').length;
                    const premCount = usersOfTier('premium').length;
                    title = 'דרגות מנוי'; subtitle = `${memberCount} מנויים פעילים`; accent = PALETTE.orange;
                    icon = <Star size={17} color={PALETTE.orange} />;
                    footer = { label: 'ייצוא CSV מלא', onClick: () => { exportCSV(users); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'Premium', value: premCount, color: TIER_CONFIG.premium.color },
                                { label: 'חבר', value: memCount, color: TIER_CONFIG.member.color },
                                { label: 'פרטי', value: freeCount, color: TIER_CONFIG.free.color },
                            ]} />
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">בחר דרגה — לחץ לצלילה</p>
                                {['premium', 'member', 'free'].map((key, i) => {
                                    const cfg = TIER_CONFIG[key];
                                    const n = usersOfTier(key).length;
                                    return (
                                        <DrillRow key={key} delay={i * 0.03} tone={cfg.color}
                                            onClick={n > 0 ? () => pushDrill({ type: 'tierGroup', tier: key }) : undefined}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[12px] font-black" style={{ background: cfg.bg, color: cfg.color }}>{n}</span>}
                                            title={cfg.label}
                                            subtitle={`${pct(n)}% מהמשתמשים`}
                                            trailing={<span className="text-[11px] font-black shrink-0" style={{ color: cfg.color }}>{n}</span>}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                } else if (shown.type === 'todayKpi') {
                    title = 'נרשמו היום'; subtitle = '24 שעות אחרונות'; accent = PALETTE.emerald;
                    icon = <Clock size={17} color={PALETTE.emerald} />;
                    footer = { label: 'ייצוא רשימה', onClick: () => { exportCSV(todayUsers.length ? todayUsers : users); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'נרשמו היום', value: todayCount, color: PALETTE.emerald },
                                { label: 'סה״כ', value: users.length, color: ACCENT },
                                { label: 'אחוז', value: `${pct(todayCount)}%`, color: '#5AC8FA' },
                            ]} />
                            {todayUsers.length === 0 ? (
                                <DrillEmpty icon={Clock} text="לא נרשמו משתמשים חדשים היום" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">משתמשים חדשים — לחץ לפרטים</p>
                                    {todayUsers.map((u, i) => userRow(u, i))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'tierGroup') {
                    const cfg = TIER_CONFIG[shown.tier] || TIER_CONFIG.free;
                    const list = usersOfTier(shown.tier);
                    const googleIn = list.filter(u => u.provider === 'google.com').length;
                    const verifiedIn = list.filter(u => u.emailVerified).length;
                    title = `דרגה: ${cfg.label}`; subtitle = `${list.length} משתמשים`; accent = cfg.color;
                    icon = <Star size={17} color={cfg.color} />;
                    footer = { label: 'ייצוא רשימה', onClick: () => { exportCSV(list); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'משתמשים', value: list.length, color: cfg.color },
                                { label: 'דרך Google', value: googleIn, color: '#4285F4' },
                                { label: 'מאומתים', value: verifiedIn, color: '#34C759' },
                            ]} />
                            {list.length === 0 ? (
                                <DrillEmpty icon={Users} text="אין משתמשים בדרגה זו" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">משתמשים — לחץ לפרטים</p>
                                    {list.slice(0, 20).map((u, i) => userRow(u, i))}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'providerGroup') {
                    const isGoogle = shown.provider === 'google';
                    const list = usersOfProvider(shown.provider);
                    const membersIn = list.filter(u => (u.memberTier || 'free') !== 'free').length;
                    title = isGoogle ? 'ספק: Google' : 'ספק: מייל / סיסמה'; subtitle = `${list.length} משתמשים`; accent = isGoogle ? '#4285F4' : '#8E8E93';
                    icon = isGoogle ? <Chrome size={17} color="#4285F4" /> : <Lock size={17} color="#8E8E93" />;
                    footer = { label: 'ייצוא רשימה', onClick: () => { exportCSV(list); closeDrill(); } };
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'משתמשים', value: list.length, color: isGoogle ? '#4285F4' : '#8E8E93' },
                                { label: 'מנויים', value: membersIn, color: PALETTE.orange },
                                { label: 'אחוז מהסך', value: `${pct(list.length)}%`, color: ACCENT },
                            ]} />
                            {list.length === 0 ? (
                                <DrillEmpty icon={Users} text="אין משתמשים לספק זה" />
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">משתמשים — לחץ לפרטים</p>
                                    {list.slice(0, 20).map((u, i) => userRow(u, i))}
                                </div>
                            )}
                        </div>
                    );
                } else {
                    title = 'פרטים'; icon = <Users size={17} color={ACCENT} />;
                    body = <DrillEmpty icon={Users} text="אין נתונים להצגה" />;
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
                        levelKey={`${shown.type}:${shown.tier ?? shown.provider ?? ''}:${drillStack.length}`}
                    >
                        {body}
                    </DashDrillView>
                );
            })()}
        </div>
    );
}
