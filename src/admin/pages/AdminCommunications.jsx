/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, query, orderBy, onSnapshot, arrayUnion,
    doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useSettings } from '../../context/SettingsContext';
import { useAdminData } from '../context/AdminDataContext';
import {
    MessageSquare, Mail, Phone, Edit2, Trash2, Plus, Send, X,
    ChevronDown, AlertCircle, MessageCircle, Zap, Clock,
    AtSign, Star, TrendingUp, Users, Hash, AlertTriangle, Check,
} from 'lucide-react';
import { GLASS, RADIUS, SPRING, hexA, accentSurface } from '../theme/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const SF = `-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',Heebo,Arial,sans-serif`;

// ─── Communications domain accent (Heaven, coral ★) ────────────────────────────
const CORAL = '#FF453A';

const PIPELINE_STATUSES = {
    'חדש':           { color: '#007AFF', bg: 'rgba(0,122,255,0.07)',    dot: '#007AFF' },
    'ביצירת קשר':    { color: '#007AFF', bg: 'rgba(0,122,255,0.07)',    dot: '#007AFF' },
    'הוצע מחיר':     { color: '#5856D6', bg: 'rgba(88,86,214,0.07)',    dot: '#5856D6' },
    'במשא ומתן':     { color: '#FF9500', bg: 'rgba(255,149,0,0.07)',    dot: '#FF9500' },
    'ממתין לאישור':  { color: '#FF9500', bg: 'rgba(255,149,0,0.07)',    dot: '#FF9500' },
    'נסגר':          { color: '#34C759', bg: 'rgba(52,199,89,0.07)',    dot: '#34C759' },
    'בוטל':           { color: '#FF3B30', bg: 'rgba(255,59,48,0.07)',    dot: '#FF3B30' },
};

const CHANNELS = [
    { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', Icon: MessageSquare },
    { id: 'email',    label: 'מייל',     color: '#2563EB', Icon: Mail },
    { id: 'chat',     label: 'צ׳אט',     color: '#007AFF', Icon: MessageCircle },
];

const DEFAULT_TEMPLATES = [
    {
        id: 'tpl_first_contact', name: 'מגע ראשון', channel: 'whatsapp', status: 'חדש',
        body: 'שלום {{שם}},\nכאן אפרים מ-NextClass. קיבלנו את הבקשה שלך עבור {{מוסד}} ואשמח לסייע.\nמה הזמן הנוח ביותר לשיחה של 10 דקות?',
        subject: '',
    },
    {
        id: 'tpl_followup', name: 'מעקב', channel: 'whatsapp', status: 'ביצירת קשר',
        body: 'שלום {{שם}},\nאני ממשיך לטפל בהצעה עבור {{מוסד}}.\nהאם קיבלת את הפרטים? אשמח לתאם שיחה קצרה לוודא שהכל מתאים.',
        subject: '',
    },
    {
        id: 'tpl_send_quote', name: 'שליחת הצעה', channel: 'email', status: 'הוצע מחיר',
        subject: 'הצעת מחיר עבור {{מוסד}} | NextClass',
        body: 'שלום {{שם}},\n\nתודה על פנייתך. מצורפת הצעת המחיר שהכנו עבור {{מוסד}}:\n\nסכום כולל: {{סכום}}\n\nההצעה תקפה ל-14 יום.\n\nבברכה,\nאפרים אמרגי · {{טלפון}}',
    },
    {
        id: 'tpl_negotiation', name: 'משא ומתן', channel: 'whatsapp', status: 'במשא ומתן',
        body: 'שלום {{שם}},\nשלחתי הצעה עבור {{מוסד}} לפני מספר ימים.\nכדי לשמור על המחירים, ההצעה תקפה עד סוף השבוע.\nמתי נוח לשיחה קצרה לסיכום?',
        subject: '',
    },
    {
        id: 'tpl_won', name: 'סגירת עסקה', channel: 'whatsapp', status: 'נסגר',
        body: 'שלום {{שם}},\nתודה רבה! שמחים לשתף פעולה עם {{מוסד}}.\nנציג יצור איתך קשר תוך 48 שעות לתיאום לוח זמנים.',
        subject: '',
    },
    {
        id: 'tpl_needs', name: 'גילוי צרכים', channel: 'email', status: 'ביצירת קשר',
        subject: 'שיחת גילוי צרכים — {{מוסד}} | NextClass',
        body: 'שלום {{שם}},\n\nכדי להכין עבורכם הצעה מדויקת, אשמח לענות על כמה שאלות:\n1. כמה כיתות/חללים מיועדים?\n2. לוח זמנים רצוי לאספקה?\n3. האם יש תקציב מאושר?\n\nנשמח לתאם שיחה — מה הזמן הנוח?\n\nבברכה,\nאפרים · {{טלפון}}',
    },
];

// ─── Liquid-glass surface (token-driven — one system everywhere) ────────────────
const CARD = { ...GLASS.base, borderRadius: RADIUS.card };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fillTemplate(text, lead, bizPhone) {
    const firstName = (lead?.contactName || '').split(' ')[0] || '—';
    const total = lead?.subtotal
        ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}`
        : '—';
    return (text || '')
        .replace(/\{\{שם\}\}/g,    firstName)
        .replace(/\{\{מוסד\}\}/g,  lead?.institution || '—')
        .replace(/\{\{הזמנה\}\}/g, lead?.id || '—')
        .replace(/\{\{סכום\}\}/g,  total)
        .replace(/\{\{טלפון\}\}/g, bizPhone || '058-5856356');
}

function getLeadScore(lead) {
    if (!lead) return 1;
    let pts = 0;
    const val = Number(String(lead?.subtotal || 0).replace(/[^0-9.]/g, ''));
    if (val >= 100000) pts += 5; else if (val >= 50000) pts += 4;
    else if (val >= 20000) pts += 3; else if (val >= 5000) pts += 2; else pts += 1;
    if (lead?.urgency === 'urgent') pts += 3; else if (lead?.urgency === 'month') pts += 1;
    const inst = (lead?.institutionType || '').toLowerCase();
    if (inst.includes('עירייה') || inst.includes('אוניברסיטה') || inst.includes('מכללה')) pts += 2;
    else if (inst.includes('תיכון') || inst.includes('חטיבה')) pts += 1;
    if ((lead?.items || []).length >= 5) pts += 2;
    else if ((lead?.items || []).length >= 2) pts += 1;
    return Math.min(5, Math.max(1, Math.round(pts / 2.6)));
}
function scoreColor(s) { return s >= 4 ? '#FF3B30' : s >= 3 ? '#FF9500' : '#34C759'; }

function ScoreDots({ score }) {
    const c = scoreColor(score);
    return (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: 99, background: i <= score ? c : '#E5E5EA', transition: 'background 0.2s' }} />
            ))}
        </div>
    );
}

function getRecommendedTpl(lead, templates) {
    if (!lead || !templates.length) return null;
    return templates.find(t => t.status === (lead.status || 'חדש')) || null;
}

function StatusPill({ status }) {
    const s = PIPELINE_STATUSES[status] || PIPELINE_STATUSES['חדש'];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
            borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: SF,
            color: s.color, background: s.bg, border: `1px solid ${s.color}22`,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: s.dot, flexShrink: 0 }} />
            {status}
        </span>
    );
}

// ─── Pending-email helpers (unified inbox for every kind) ──────────────────────
// One approve-AND-edit inbox holds customer, supplier AND internal emails.
// Docs are heterogeneous: newer ones carry `kind`/`refId`/`refType`; legacy ones
// only have `leadId` or `quoteId`/`type`. These helpers normalise them.

const EMAIL_KIND_META = {
    customer: { label: 'לקוח',  color: '#007AFF', bg: 'rgba(0,122,255,0.10)' },
    supplier: { label: 'ספק',   color: '#0891B2', bg: 'rgba(8,145,178,0.10)' },
    internal: { label: 'פנימי', color: '#5856D6', bg: 'rgba(88,86,214,0.10)' },
};
const KIND_ORDER = ['customer', 'supplier', 'internal'];

function emailKind(email) {
    const k = email?.kind;
    if (k === 'supplier' || k === 'internal' || k === 'customer') return k;
    // Legacy fallback — infer from source/type for docs written before `kind` existed
    const hint = `${email?.source || ''} ${email?.type || ''}`.toLowerCase();
    if (hint.includes('supplier')) return 'supplier';
    if (hint.includes('team') || hint.includes('internal')) return 'internal';
    return 'customer';
}

function emailRefId(email) {
    return email?.refId || email?.leadId || email?.quoteId || '';
}

function fmtEmailDate(ts) {
    if (ts == null) return '';
    let ms = 0;
    if (typeof ts === 'number') ms = ts;
    else if (typeof ts === 'object' && ts.seconds) ms = ts.seconds * 1000;
    else if (typeof ts === 'string') ms = Date.parse(ts) || 0;
    if (!ms) return '';
    try { return new Date(ms).toLocaleDateString('he-IL'); } catch { return ''; }
}

function KindBadge({ kind }) {
    const m = EMAIL_KIND_META[kind] || EMAIL_KIND_META.customer;
    return (
        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: m.bg, color: m.color, fontFamily: SF, flexShrink: 0 }}>
            {m.label}
        </span>
    );
}

// ─── Lead avatar ──────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, score }) {
    const initial = (name || '?')[0].toUpperCase();
    const s = score || 1;
    const bg = s >= 4
        ? 'linear-gradient(135deg,#FF3B30,#FF2D55)'
        : s >= 3
            ? 'linear-gradient(135deg,#FF9500,#FF6B00)'
            : 'linear-gradient(135deg,#007AFF,#5856D6)';
    return (
        <div style={{
            width: size, height: size, borderRadius: size / 3.2, flexShrink: 0,
            background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}>
            <span style={{ fontSize: size * 0.42, fontWeight: 900, color: '#fff', fontFamily: SF }}>{initial}</span>
        </div>
    );
}

// ─── Contact action buttons ───────────────────────────────────────────────────
function ContactActions({ lead, size = 28, showLabels = false }) {
    const waNum = (lead?.phone || '').replace(/\D/g,'').replace(/^0/,'');
    const actions = [
        lead?.phone && { icon: Phone,        label: 'חייג',     color: '#007AFF', bg: 'rgba(0,122,255,0.09)',  action: () => window.open(`tel:${lead.phone}`) },
        lead?.phone && { icon: MessageSquare, label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.09)', action: () => window.open(`https://wa.me/972${waNum}`, '_blank') },
        lead?.email && { icon: Mail,          label: 'מייל',     color: '#2563EB', bg: 'rgba(37,99,235,0.09)',  action: () => window.open(`mailto:${lead.email}`) },
    ].filter(Boolean);

    if (!actions.length) return null;
    return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {actions.map(({ icon: Icon, label, color, bg, action }, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); action(); }}
                    title={label}
                    style={{
                        width: size, height: size, borderRadius: size / 3,
                        border: 'none', background: bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
                        fontFamily: SF,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 3px 10px ${color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <Icon size={size * 0.44} color={color} strokeWidth={2.2} />
                </button>
            ))}
        </div>
    );
}

// ─── Template editor ──────────────────────────────────────────────────────────
function TemplateEditor({ template, onSave, onCancel }) {
    const [form, setForm] = useState({ ...template });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const inputStyle = { width: '100%', padding: '9px 12px', fontSize: 12, fontFamily: SF, borderRadius: 10, outline: 'none', border: '1px solid rgba(255,255,255,0.72)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px) saturate(200%)', WebkitBackdropFilter: 'blur(24px) saturate(200%)', color: '#1D1D1F', boxSizing: 'border-box' };
    return (
        <div style={{ borderRadius: 16, padding: 16, marginBottom: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.07)' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#86868B', marginBottom: 12, fontFamily: SF }}>עריכת תבנית</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#86868B', display: 'block', marginBottom: 4, fontFamily: SF }}>שם</label>
                    <input value={form.name} onChange={set('name')} style={inputStyle} />
                </div>
                <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#86868B', display: 'block', marginBottom: 4, fontFamily: SF }}>ערוץ</label>
                    <select value={form.channel} onChange={set('channel')} style={inputStyle}>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">מייל</option>
                    </select>
                </div>
            </div>
            {form.channel === 'email' && (
                <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#86868B', display: 'block', marginBottom: 4, fontFamily: SF }}>נושא</label>
                    <input value={form.subject || ''} onChange={set('subject')} style={inputStyle} />
                </div>
            )}
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#86868B', display: 'block', marginBottom: 4, fontFamily: SF }}>
                    גוף ·{' '}
                    <span style={{ fontWeight: 400, color: '#AEAEB2' }}>{'{{שם}} {{מוסד}} {{סכום}} {{טלפון}}'}</span>
                </label>
                <textarea value={form.body} onChange={set('body')} rows={4}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                <button onClick={onCancel}
                    style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: SF, border: '1px solid rgba(0,0,0,0.10)', background: 'transparent', color: '#6E6E73', cursor: 'pointer' }}>
                    ביטול
                </button>
                <button onClick={() => onSave(form)}
                    style={{ padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 800, fontFamily: SF, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,122,255,0.28)' }}>
                    שמור
                </button>
            </div>
        </div>
    );
}

// ─── Outreach history ─────────────────────────────────────────────────────────
function OutreachHistory({ commLog }) {
    const [open, setOpen] = useState(false);
    if (!commLog?.length) return null;
    const fmtTs = ts => { try { return new Date(ts).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ts || ''; } };
    return (
        <div style={{ marginTop: 8 }}>
            <button onClick={() => setOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.02)', cursor: 'pointer', fontFamily: SF }}>
                <Clock size={12} color="#AEAEB2" />
                <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: '#86868B', textAlign: 'right' }}>היסטוריית תקשורת</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2' }}>{commLog.length}</span>
                <ChevronDown size={12} color="#AEAEB2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                        <div style={{ paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {[...commLog].reverse().map((entry, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.preview || '—'}</p>
                                        <p style={{ fontSize: 10, color: '#AEAEB2', marginTop: 1, fontFamily: SF }}>{entry.tpl} · {fmtTs(entry.ts)}</p>
                                    </div>
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                                        background: entry.type === 'whatsapp' ? 'rgba(52,199,89,0.10)' : 'rgba(0,122,255,0.10)',
                                        color: entry.type === 'whatsapp' ? '#34C759' : '#007AFF',
                                        fontFamily: SF,
                                    }}>
                                        {entry.type === 'whatsapp' ? 'WA' : 'מייל'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Lead detail hero ─────────────────────────────────────────────────────────
function LeadHero({ lead, onStatusChange }) {
    const [statusOpen, setStatusOpen] = useState(false);
    const [saving,     setSaving]     = useState(false);
    const score = getLeadScore(lead);
    const total = lead?.subtotal ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}` : null;

    const handleStatusChange = async (newStatus) => {
        setStatusOpen(false); setSaving(true);
        try {
            await updateDoc(doc(db, 'quotes', lead._docId), { status: newStatus, updatedAt: serverTimestamp() });
            onStatusChange({ ...lead, status: newStatus });
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ ...CARD, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            {/* Accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${scoreColor(score)},${score >= 4 ? '#FF2D55' : '#5856D6'})`, borderRadius: '20px 20px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 4 }}>
                {/* Avatar */}
                <Avatar name={lead.contactName} size={52} score={score} />

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: 19, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', fontFamily: SF, margin: 0 }}>
                            {lead.contactName || '—'}
                        </h2>
                        <ScoreDots score={score} />
                        {score >= 4 && (
                            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: `${scoreColor(score)}15`, color: scoreColor(score), fontFamily: SF }}>
                                עדיפות גבוהה
                            </span>
                        )}
                    </div>
                    {(lead.contactRole || lead.institution) && (
                        <p style={{ fontSize: 12, color: '#86868B', fontWeight: 500, fontFamily: SF, marginBottom: 8 }}>
                            {[lead.contactRole, lead.institution].filter(Boolean).join(' · ')}
                        </p>
                    )}

                    {/* Contact row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <ContactActions lead={lead} size={30} />
                        {lead.email && (
                            <span style={{ fontSize: 11, color: '#86868B', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{lead.email}</span>
                        )}
                    </div>
                </div>

                {/* Status + value */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setStatusOpen(v => !v)} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <StatusPill status={lead.status || 'חדש'} />
                            <ChevronDown size={12} color="#86868B" />
                        </button>
                        <AnimatePresence>
                            {statusOpen && (
                                <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.14 }}
                                    style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, zIndex: 50, minWidth: 160, borderRadius: 16, padding: 6, background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', padding: '4px 8px', fontFamily: SF }}>שנה סטטוס</p>
                                    {Object.entries(PIPELINE_STATUSES).map(([s, meta]) => (
                                        <button key={s} onClick={() => handleStatusChange(s)}
                                            style={{ width: '100%', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: SF, fontSize: 12, fontWeight: 700, color: meta.color }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ width: 7, height: 7, borderRadius: 99, background: meta.dot, flexShrink: 0 }} />
                                            {s}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {total && (
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#007AFF', fontFamily: SF }}>{total}</span>
                    )}
                    {lead.date && (
                        <span style={{ fontSize: 10, color: '#AEAEB2', fontFamily: SF }}>{lead.date}</span>
                    )}
                </div>
            </div>

            {/* Items */}
            {(lead.items || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)', justifyContent: 'flex-end' }}>
                    {lead.items.slice(0, 5).map((item, i) => (
                        <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: 'rgba(0,122,255,0.07)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.14)', fontFamily: SF }}>
                            {typeof item === 'string' ? item : (item.name || item.title || '')}
                        </span>
                    ))}
                    {(lead.items || []).length > 5 && (
                        <span style={{ fontSize: 11, color: '#AEAEB2', fontFamily: SF, alignSelf: 'center' }}>+{lead.items.length - 5}</span>
                    )}
                </div>
            )}

            {lead.notes && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)', borderRight: '3px solid #F59E0B' }}>
                    <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, textAlign: 'right', fontFamily: SF }}>{lead.notes}</p>
                </div>
            )}

            <OutreachHistory commLog={lead.commLog} />
        </div>
    );
}

// ─── Chat thread panel ────────────────────────────────────────────────────────
function ChatThreadPanel({ lead, sendMessage, markRead }) {
    const [msg,     setMsg]     = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const thread = useMemo(() =>
        (lead?.thread || []).slice().sort((a, b) => (a.tsNum || 0) - (b.tsNum || 0)),
        [lead?.thread]
    );
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length]);
    useEffect(() => { if (lead?._docId && lead?.unreadAdmin) markRead(lead._docId); }, [lead?._docId]);

    const handleSend = async () => {
        if (!msg.trim() || sending) return;
        setSending(true);
        try { await sendMessage(lead._docId, msg.trim()); setMsg(''); }
        finally { setSending(false); }
    };
    const fmtTime = ts => { try { return new Date(ts).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

    return (
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', height: 420, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={15} color="#007AFF" strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, flex: 1 }}>שיחה עם {lead?.contactName?.split(' ')[0] || 'הלקוח'}</span>
                {thread.length > 0 && <span style={{ fontSize: 11, color: '#AEAEB2', fontFamily: SF }}>{thread.length} הודעות</span>}
                {lead?.unreadAdmin && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', padding: '2px 8px', borderRadius: 99, background: 'linear-gradient(135deg,#FF3B30,#FF2D55)', fontFamily: SF }}>חדש</span>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thread.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={22} color="#007AFF" strokeWidth={1.5} />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, margin: 0 }}>אין הודעות עדיין</p>
                        <p style={{ fontSize: 12, color: '#AEAEB2', fontFamily: SF, margin: 0 }}>שלח הודעה ראשונה ל{lead?.contactName || 'הלקוח'}</p>
                    </div>
                ) : thread.map((m, i) => {
                    const isAdmin = m.from === 'admin';
                    return (
                        <div key={m.id || i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', gap: 8 }}>
                            {!isAdmin && (
                                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#86868B,#636366)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', marginTop: 2, fontFamily: SF }}>
                                    {(lead?.contactName || '?')[0]}
                                </div>
                            )}
                            <div style={{ maxWidth: '72%', padding: '9px 14px', background: isAdmin ? 'linear-gradient(135deg,#007AFF,#5856D6)' : '#F2F2F7', borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px', boxShadow: isAdmin ? '0 2px 12px rgba(0,122,255,0.25)' : 'none' }}>
                                <p style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: isAdmin ? '#fff' : '#1D1D1F', fontFamily: SF, margin: 0 }}>{m.text}</p>
                                <p style={{ fontSize: 10, marginTop: 4, color: isAdmin ? 'rgba(255,255,255,0.5)' : '#AEAEB2', textAlign: isAdmin ? 'left' : 'right', fontFamily: SF, margin: '4px 0 0' }}>{fmtTime(m.tsNum)}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="כתוב הודעה... (Enter לשליחה)" rows={2}
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, fontFamily: SF, borderRadius: 16, outline: 'none', resize: 'none', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', color: '#1D1D1F', lineHeight: 1.5 }} />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!msg.trim() || sending}
                    style={{ width: 38, height: 38, borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: msg.trim() ? 'pointer' : 'default', background: msg.trim() ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'rgba(0,0,0,0.07)', boxShadow: msg.trim() ? '0 3px 12px rgba(0,122,255,0.35)' : 'none', transition: 'all 0.2s' }}>
                    <Send size={15} color={msg.trim() ? '#fff' : '#C7C7CC'} strokeWidth={2} style={{ transform: 'scaleX(-1)' }} />
                </motion.button>
            </div>
        </div>
    );
}

// ─── Smart insert chips ───────────────────────────────────────────────────────
function SmartInserts({ lead, bizPhone, onInsert }) {
    if (!lead) return null;
    const firstName = (lead.contactName || '').split(' ')[0];
    const total     = lead.subtotal ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}` : null;

    const chips = [
        firstName   && { label: firstName,         hint: 'שם',         color: '#5856D6' },
        lead.institution && { label: lead.institution, hint: 'מוסד',     color: '#007AFF' },
        total       && { label: total,              hint: 'סכום',       color: '#34C759' },
        lead.phone  && { label: lead.phone,         hint: 'טל׳ לקוח',  color: '#FF9500' },
        lead.email  && { label: lead.email,         hint: 'מייל',       color: '#2563EB' },
        bizPhone    && { label: bizPhone,            hint: 'טל׳ עסקי',  color: '#86868B' },
        lead.id     && { label: lead.id,             hint: 'מזהה',      color: '#AEAEB2' },
    ].filter(Boolean);

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2', fontFamily: SF, flexShrink: 0 }}>הכנס:</span>
            {chips.map((chip, i) => (
                <button key={i} onClick={() => onInsert(chip.label)}
                    title={chip.hint}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                        borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: SF,
                        border: `1px solid ${chip.color}28`,
                        background: `${chip.color}0E`,
                        color: chip.color,
                        cursor: 'pointer', transition: 'all 0.12s', maxWidth: 140,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${chip.color}1A`; e.currentTarget.style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${chip.color}0E`; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <span style={{ fontSize: 9, opacity: 0.55 }}>{chip.hint}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chip.label}</span>
                </button>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCommunications() {
    const { getSetting }                           = useSettings();
    const { sendThreadMessage, markAdminThreadRead } = useAdminData();
    const bizPhone = getSetting('contact_phone', '058-5856356');

    const [leads,          setLeads]          = useState([]);
    const [templates,      setTemplates]      = useState([]);
    const [selected,       setSelected]       = useState(null);
    const [search,         setSearch]         = useState('');
    const [filterStatus,   setFilterStatus]   = useState('');
    const [activeChannel,  setActiveChannel]  = useState('whatsapp');
    const [activeTpl,      setActiveTpl]      = useState(null);
    const [editingTpl,     setEditingTpl]     = useState(null);
    const [customMsg,      setCustomMsg]      = useState('');
    const [customSubject,  setCustomSubject]  = useState('');
    const [addingTpl,      setAddingTpl]      = useState(false);
    const [toast,          setToast]          = useState(null);
    const textareaRef = useRef(null);

    const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

    const [deletedLeads, setDeletedLeads] = useState([]);
    const [showTrash,    setShowTrash]    = useState(false);

    // Approval Queue State
    const [activeTab,          setActiveTab]          = useState('leads'); // 'leads' | 'emails'
    const [pendingEmails,      setPendingEmails]      = useState([]);
    const [emailLog,           setEmailLog]           = useState([]);
    const [selectedEmail,      setSelectedEmail]      = useState(null);
    const [emailEditSubject,   setEmailEditSubject]   = useState('');
    const [emailEditHtml,      setEmailEditHtml]      = useState('');
    const [isEditingEmail,     setIsEditingEmail]     = useState(false);
    const [emailSendStatus,    setEmailSendStatus]    = useState('idle');
    const [activeEmailFilter,  setActiveEmailFilter]  = useState('pending'); // 'pending' | 'log'

    // Load pending emails & logs
    useEffect(() => {
        const q = query(collection(db, 'pending_emails'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            const all = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            const pending = all.filter(e => e.status === 'pending');
            const log = all.filter(e => e.status === 'sent' || e.status === 'declined');
            setPendingEmails(pending);
            setEmailLog(log);
        });
    }, []);

    const handleApproveEmail = async (emailItem) => {
        if (!emailItem) return;
        setEmailSendStatus('sending');
        try {
            // dispatch-email is the ONLY endpoint that actually sends via Resend,
            // and it is reachable only from this manual approve-AND-edit action.
            const finalSubject = emailEditSubject || emailItem.subject;
            const finalHtml    = emailEditHtml || emailItem.html;
            const res = await fetch('/api/dispatch-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: emailItem.id,
                    to: emailItem.to,
                    subject: finalSubject,
                    html: finalHtml,
                }),
            });
            if (res.ok) {
                await setDoc(doc(db, 'pending_emails', emailItem.id), {
                    status: 'sent',
                    sentAt: Date.now(),
                    subject: finalSubject,
                    html: finalHtml,
                }, { merge: true });
                showToast('המייל נשלח בהצלחה! ✓', true);
                setSelectedEmail(null);
                setIsEditingEmail(false);
            } else {
                const errText = await res.text();
                showToast(`שגיאה בשליחה: ${errText}`, false);
            }
        } catch (err) {
            showToast(`שגיאת רשת: ${err.message}`, false);
        } finally {
            setEmailSendStatus('idle');
        }
    };

    const handleDeclineEmail = async (emailItem) => {
        if (!window.confirm('האם אתה בטוח שברצונך לדחות ולבטל מייל זה?')) return;
        try {
            await setDoc(doc(db, 'pending_emails', emailItem.id), {
                status: 'declined',
                declinedAt: Date.now(),
            }, { merge: true });
            showToast('המייל בוטל ונדחה', true);
            setSelectedEmail(null);
            setIsEditingEmail(false);
        } catch (err) {
            showToast(`שגיאה בעדכון: ${err.message}`, false);
        }
    };

    const handleSaveEmailEdit = async (emailItem) => {
        try {
            await setDoc(doc(db, 'pending_emails', emailItem.id), {
                subject: emailEditSubject,
                html: emailEditHtml,
            }, { merge: true });
            showToast('השינויים נשמרו בהצלחה', true);
            setIsEditingEmail(false);
            setSelectedEmail(prev => ({
                ...prev,
                subject: emailEditSubject,
                html: emailEditHtml,
            }));
        } catch (err) {
            showToast(`שגיאה בשמירה: ${err.message}`, false);
        }
    };

    useEffect(() => {
        if (selectedEmail) {
            setEmailEditSubject(selectedEmail.subject || '');
            setEmailEditHtml(selectedEmail.html || '');
        } else {
            setEmailEditSubject('');
            setEmailEditHtml('');
        }
    }, [selectedEmail]);

    // Load quotes
    useEffect(() => {
        const q = query(collection(db, 'quotes'), orderBy('dateTs', 'desc'));
        return onSnapshot(q, snap => {
            const all = snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
            setLeads(all.filter(l => !l.deleted));
            setDeletedLeads(all.filter(l => l.deleted).sort((a,b) => (b.deletedAt||0) - (a.deletedAt||0)));
        });
    }, []);

    const handleDeleteLead = async (lead) => {
        if (!window.confirm('להעביר ליד זה לסל המחזור?')) return;
        await setDoc(doc(db, 'quotes', lead._docId), { deleted: true, deletedAt: Date.now() }, { merge: true });
        setSelected(null);
        showToast('הועבר לסל המחזור');
    };

    const handleRestoreLead = async (lead) => {
        await setDoc(doc(db, 'quotes', lead._docId), { deleted: false, deletedAt: null }, { merge: true });
        showToast('הליד שוחזר');
    };

    const handleHardDeleteLead = async (lead) => {
        if (!window.confirm('למחוק לצמיתות? לא ניתן לשחזר.')) return;
        await deleteDoc(doc(db, 'quotes', lead._docId));
        showToast('נמחק לצמיתות');
    };

    // Load templates
    useEffect(() => {
        const col = collection(db, 'comm_templates');
        return onSnapshot(col, async snap => {
            if (snap.empty) {
                for (const tpl of DEFAULT_TEMPLATES)
                    await setDoc(doc(db, 'comm_templates', tpl.id), { ...tpl, createdAt: serverTimestamp() });
            } else {
                setTemplates(snap.docs.map(d => ({ ...d.data(), id: d.id })));
            }
        });
    }, []);

    // Sync selected with live data
    useEffect(() => {
        if (!selected) return;
        const fresh = leads.find(l => l._docId === selected._docId);
        if (fresh) setSelected(fresh);
    }, [leads]);

    // Fill template on selection change
    useEffect(() => {
        if (!activeTpl || !selected) { setCustomMsg(''); setCustomSubject(''); return; }
        setCustomMsg(fillTemplate(activeTpl.body, selected, bizPhone));
        setCustomSubject(fillTemplate(activeTpl.subject || '', selected, bizPhone));
    }, [activeTpl, selected]);

    // Auto-suggest template
    useEffect(() => {
        if (!selected || activeChannel === 'chat') return;
        const rec = getRecommendedTpl(selected, templates.filter(t => t.channel === activeChannel));
        if (rec) setActiveTpl(rec);
    }, [selected?._docId, activeChannel]);

    const saveTpl = useCallback(async form => {
        await setDoc(doc(db, 'comm_templates', form.id), { ...form, updatedAt: serverTimestamp() }, { merge: true });
        setEditingTpl(null); setAddingTpl(false); showToast('תבנית נשמרה');
    }, []);

    const deleteTpl = useCallback(async id => {
        if (!confirm('למחוק את התבנית?')) return;
        await deleteDoc(doc(db, 'comm_templates', id));
        if (activeTpl?.id === id) setActiveTpl(null);
        showToast('תבנית נמחקה');
    }, [activeTpl]);

    const logOutreach = useCallback(async (type, tplName, preview) => {
        if (!selected?._docId) return;
        try {
            await updateDoc(doc(db, 'quotes', selected._docId), {
                commLog: arrayUnion({ type, tpl: tplName || 'custom', preview: (preview || '').slice(0, 80), ts: new Date().toISOString() }),
            });
        } catch {}
    }, [selected]);

    // Cursor-aware smart insert
    const insertAtCursor = useCallback((text) => {
        const el = textareaRef.current;
        if (!el) { setCustomMsg(m => m + text); return; }
        const start = el.selectionStart ?? customMsg.length;
        const end   = el.selectionEnd   ?? customMsg.length;
        const newMsg = customMsg.slice(0, start) + text + customMsg.slice(end);
        setCustomMsg(newMsg);
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = start + text.length;
            el.focus();
        });
    }, [customMsg]);

    // Stale lead helpers — must be defined before useMemo that uses them
    const now = Date.now();
    const STALE_DAYS = 3;
    const getLeadAgeDays = (lead) => {
        const ts = lead.updatedAt || lead.dateTs;
        if (!ts) return 0;
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.floor((now - (typeof ts === 'number' ? ts : ts?.seconds ? ts.seconds * 1000 : Date.parse(ts) || 0)) / msPerDay);
    };
    const isStale = (lead) => {
        const staleStatuses = ['חדש', 'ביצירת קשר'];
        return staleStatuses.includes(lead.status || 'חדש') && getLeadAgeDays(lead) > STALE_DAYS;
    };
    const [showStaleOnly, setShowStaleOnly] = useState(false);

    const sendWhatsApp = async () => {
        if (!selected?.phone || !customMsg) return;
        const num = selected.phone.replace(/\D/g,'').replace(/^0/,'');
        window.open(`https://wa.me/972${num}?text=${encodeURIComponent(customMsg)}`, '_blank');
        await logOutreach('whatsapp', activeTpl?.name, customMsg);
        showToast('WhatsApp נפתח');
    };

    const sendEmail = async () => {
        if (!selected?.email || !customMsg) return;
        const subject = encodeURIComponent(customSubject || `הודעה מ-NextClass`);
        window.open(`mailto:${selected.email}?subject=${subject}&body=${encodeURIComponent(customMsg)}`, '_blank');
        await logOutreach('email', activeTpl?.name, customMsg);
        showToast('מייל נפתח');
    };

    const filtered = useMemo(() => leads.filter(l => {
        const q = search.toLowerCase();
        const matchesSearch = !q || (l.contactName||'').toLowerCase().includes(q) || (l.institution||'').toLowerCase().includes(q) || (l.phone||'').includes(q);
        const matchesStatus = !filterStatus || l.status === filterStatus;
        const matchesStale  = !showStaleOnly || isStale(l);
        return matchesSearch && matchesStatus && matchesStale;
    }), [leads, search, filterStatus, showStaleOnly]);

    const sortedFiltered = useMemo(() =>
        [...filtered].sort((a, b) => getLeadScore(b) - getLeadScore(a)),
        [filtered]
    );

    // Group the pending inbox by kind (customer / supplier / internal)
    const groupedPending = useMemo(() => {
        const groups = { customer: [], supplier: [], internal: [] };
        pendingEmails.forEach(e => { (groups[emailKind(e)] || groups.customer).push(e); });
        return groups;
    }, [pendingEmails]);

    const channelTpls    = templates.filter(t => t.channel === activeChannel || t.channel === 'both');
    const activeChDef    = CHANNELS.find(c => c.id === activeChannel);
    const recommendedTpl = selected ? getRecommendedTpl(selected, channelTpls) : null;
    const newCount       = leads.filter(l => (l.status || 'חדש') === 'חדש').length;
    const unreadCount    = leads.filter(l => l.unreadAdmin).length;
    const staleLeads     = leads.filter(isStale);
    const staleCount     = staleLeads.length;

    return (
        <div style={{ display: 'flex', height: '100%', direction: 'rtl', fontFamily: SF, position: 'relative' }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: SF, background: toast.ok ? 'linear-gradient(135deg,#007AFF,#5856D6)' : 'linear-gradient(135deg,#FF3B30,#FF2D55)', boxShadow: toast.ok ? '0 8px 30px rgba(0,122,255,0.30)' : '0 8px 30px rgba(255,59,48,0.30)', whiteSpace: 'nowrap' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(248,248,250,0.92)', borderLeft: '1px solid rgba(0,0,0,0.07)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)' }}>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', padding: 3, borderRadius: 12, margin: '14px 14px 6px' }}>
                    <button onClick={() => { setActiveTab('leads'); setSelectedEmail(null); }}
                        style={{ flex: 1, padding: '7px 0', border: 'none', background: activeTab === 'leads' ? '#fff' : 'transparent', borderRadius: 9, fontSize: 12, fontWeight: activeTab === 'leads' ? 800 : 600, color: activeTab === 'leads' ? '#1D1D1F' : '#86868B', cursor: 'pointer', boxShadow: activeTab === 'leads' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: SF }}>
                        מרכז לידים
                    </button>
                    <button onClick={() => { setActiveTab('emails'); setSelected(null); }}
                        style={{ flex: 1, padding: '7px 0', border: 'none', background: activeTab === 'emails' ? '#fff' : 'transparent', borderRadius: 9, fontSize: 12, fontWeight: activeTab === 'emails' ? 800 : 600, color: activeTab === 'emails' ? '#1D1D1F' : '#86868B', cursor: 'pointer', boxShadow: activeTab === 'emails' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        אישור מיילים
                        {pendingEmails.length > 0 && (
                            <span style={{ fontSize: 9, fontWeight: 900, background: CORAL, color: '#fff', padding: '1px 5px', borderRadius: 99 }}>
                                {pendingEmails.length}
                            </span>
                        )}
                    </button>
                </div>

                {activeTab === 'leads' ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '12px 14px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {newCount > 0 && (
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: 'rgba(255,59,48,0.10)', color: '#FF3B30', fontFamily: SF }}>
                                            {newCount} חדש
                                        </span>
                                    )}
                                    {unreadCount > 0 && (
                                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontFamily: SF }}>
                                            {unreadCount} הודעה
                                        </span>
                                    )}
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1F', fontFamily: SF, margin: 0 }}>לידים</p>
                            </div>

                            {/* Search */}
                            <div style={{ position: 'relative', marginBottom: 7 }}>
                                <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#AEAEB2', pointerEvents: 'none' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input placeholder="שם, מוסד..." value={search} onChange={e => setSearch(e.target.value)}
                                    style={{ width: '100%', paddingRight: 28, paddingLeft: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, fontFamily: SF, borderRadius: 10, outline: 'none', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.8)', color: '#1D1D1F', boxSizing: 'border-box' }} />
                            </div>

                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', fontSize: 11, fontFamily: SF, borderRadius: 10, outline: 'none', border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.8)', color: '#1D1D1F', boxSizing: 'border-box' }}>
                                <option value="">כל הסטטוסים</option>
                                {Object.keys(PIPELINE_STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {sortedFiltered.length === 0 && (
                        <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 12, color: '#AEAEB2', fontFamily: SF }}>לא נמצאו לידים</div>
                    )}
                    {sortedFiltered.map(lead => {
                        const isActive  = selected?._docId === lead._docId;
                        const score     = getLeadScore(lead);
                        const sColor    = scoreColor(score);
                        const status    = PIPELINE_STATUSES[lead.status] || PIPELINE_STATUSES['חדש'];
                        const leadStale = isStale(lead);
                        const ageDays   = getLeadAgeDays(lead);
                        return (
                            <motion.div key={lead._docId}
                                onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); setCustomSubject(''); }}
                                whileHover={{ x: isActive ? 0 : -2 }}
                                className="group"
                                style={{
                                    padding: '10px 14px', cursor: 'pointer', position: 'relative',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    background: isActive ? 'rgba(0,122,255,0.06)' : leadStale ? 'rgba(255,149,0,0.03)' : 'transparent',
                                    borderRight: isActive ? `3px solid #007AFF` : leadStale ? '3px solid #FF9500' : '3px solid transparent',
                                    transition: 'background 0.15s',
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar name={lead.contactName} size={34} score={score} />
                                    <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                            <span style={{ fontSize: 10, color: '#AEAEB2', fontFamily: SF, flexShrink: 0 }}>{lead.date || ''}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                {leadStale && (
                                                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: 'rgba(255,149,0,0.12)', color: '#FF9500', fontFamily: SF, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                        <AlertTriangle size={8} />{ageDays} ימים
                                                    </span>
                                                )}
                                                <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contactName || '—'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <ScoreDots score={score} />
                                            <span style={{ fontSize: 11, color: '#86868B', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{lead.institution || '—'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                            {/* Quick actions — shown on hover */}
                                            <div style={{ opacity: 0, transition: 'opacity 0.15s' }} className="group-hover:opacity-100">
                                                <ContactActions lead={lead} size={22} />
                                            </div>
                                            <StatusPill status={lead.status || 'חדש'} />
                                        </div>
                                    </div>
                                </div>
                                {lead.unreadAdmin && (
                                    <div style={{ position: 'absolute', top: 10, left: 10, width: 8, height: 8, borderRadius: 99, background: 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: '0 0 0 2px rgba(248,248,250,0.9)' }} />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                        <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button onClick={() => setShowTrash(v => !v)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, border: 'none', background: showTrash ? 'rgba(255,59,48,0.09)' : 'rgba(0,0,0,0.04)', color: showTrash ? '#FF3B30' : '#AEAEB2', cursor: 'pointer', fontSize: 10, fontWeight: 800, fontFamily: SF }}>
                                <Trash2 size={10} />סל{deletedLeads.length > 0 ? ` (${deletedLeads.length})` : ''}
                            </button>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#AEAEB2', fontFamily: SF }}>
                                {sortedFiltered.length} לידים · ממוינים לפי עדיפות
                            </span>
                        </div>

                        {/* Trash panel */}
                        {showTrash && (
                            <div style={{ borderTop: '1px solid rgba(255,59,48,0.12)', background: 'rgba(255,59,48,0.02)' }}>
                                {deletedLeads.length === 0 ? (
                                    <div style={{ padding: '14px', textAlign: 'center', fontSize: 11, color: '#AEAEB2', fontFamily: SF }}>הסל ריק</div>
                                ) : deletedLeads.map(lead => (
                                    <div key={lead._docId} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 8 }} dir="rtl">
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', fontFamily: SF }}>{lead.contactName || '—'}</div>
                                            <div style={{ fontSize: 10, color: '#AEAEB2', fontFamily: SF }}>{lead.institution || ''}</div>
                                        </div>
                                        <button onClick={() => handleRestoreLead(lead)}
                                            style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(52,199,89,0.1)', color: '#34C759', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SF }}>שחזר</button>
                                        <button onClick={() => handleHardDeleteLead(lead)}
                                            style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,59,48,0.08)', color: '#FF3B30', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SF }}>מחק</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Email Filter Tabs */}
                        <div style={{ display: 'flex', gap: 8, padding: '10px 14px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <button onClick={() => { setActiveEmailFilter('pending'); setSelectedEmail(null); }}
                                style={{ flex: 1, padding: '5px 0', border: 'none', background: activeEmailFilter === 'pending' ? hexA(CORAL, 0.10) : 'transparent', color: activeEmailFilter === 'pending' ? CORAL : '#86868B', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SF, transition: 'all 0.2s' }}>
                                ממתינים ({pendingEmails.length})
                            </button>
                            <button onClick={() => { setActiveEmailFilter('log'); setSelectedEmail(null); }}
                                style={{ flex: 1, padding: '5px 0', border: 'none', background: activeEmailFilter === 'log' ? hexA(CORAL, 0.10) : 'transparent', color: activeEmailFilter === 'log' ? CORAL : '#86868B', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SF, transition: 'all 0.2s' }}>
                                יומן שליחה ({emailLog.length})
                            </button>
                        </div>

                        {/* Emails List */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {activeEmailFilter === 'pending' ? (
                                pendingEmails.length === 0 ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 12, color: '#AEAEB2', fontFamily: SF }}>אין מיילים הממתינים לאישור</div>
                                ) : (
                                    KIND_ORDER.filter(k => groupedPending[k].length > 0).map(kind => {
                                        const meta = EMAIL_KIND_META[kind];
                                        return (
                                            <div key={kind}>
                                                {/* Group header */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, padding: '8px 14px 6px', background: 'rgba(0,0,0,0.015)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: meta.color, fontFamily: SF }}>{meta.label} · {groupedPending[kind].length}</span>
                                                    <span style={{ width: 6, height: 6, borderRadius: 99, background: meta.color }} />
                                                </div>
                                                {groupedPending[kind].map(email => {
                                                    const isActive = selectedEmail?.id === email.id;
                                                    const dateStr = fmtEmailDate(email.createdAt);
                                                    return (
                                                        <div key={email.id} onClick={() => { setSelectedEmail(email); setIsEditingEmail(false); }}
                                                            style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', background: isActive ? 'rgba(0,122,255,0.06)' : 'transparent', borderRight: isActive ? `3px solid ${meta.color}` : '3px solid transparent', transition: 'all 0.15s' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                                <span style={{ fontSize: 10, color: '#AEAEB2' }}>{dateStr}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>{email.recipientName || meta.label}</span>
                                                                    <KindBadge kind={kind} />
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginBottom: 2, textAlign: 'right' }}>{email.to}</div>
                                                            <div style={{ fontSize: 11, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{email.subject}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                emailLog.length === 0 ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 12, color: '#AEAEB2', fontFamily: SF }}>יומן השליחה ריק</div>
                                ) : (
                                    emailLog.map(email => {
                                        const isActive = selectedEmail?.id === email.id;
                                        const dateStr = fmtEmailDate(email.sentAt) || fmtEmailDate(email.declinedAt);
                                        const isSent = email.status === 'sent';
                                        const kind = emailKind(email);
                                        return (
                                            <div key={email.id} onClick={() => { setSelectedEmail(email); setIsEditingEmail(false); }}
                                                style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.04)', background: isActive ? 'rgba(0,122,255,0.06)' : 'transparent', borderRight: isActive ? '3px solid #007AFF' : '3px solid transparent', transition: 'all 0.15s' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                                    <span style={{ fontSize: 10, color: '#AEAEB2' }}>{dateStr}</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>{email.recipientName || EMAIL_KIND_META[kind].label}</span>
                                                        <KindBadge kind={kind} />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 11, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{email.subject}</span>
                                                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 99, background: isSent ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', color: isSent ? '#34C759' : '#FF3B30' }}>
                                                        {isSent ? 'נשלח' : 'נדחה'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ── RIGHT PANEL ──────────────────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'rgba(245,245,247,0.6)' }}>
                {activeTab === 'leads' ? (
                    !selected ? (

                        /* ── Dashboard ── */
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', fontFamily: SF, margin: '0 0 4px' }}>מרכז תקשורת</h2>
                            <p style={{ fontSize: 13, color: '#6E6E73', fontFamily: SF, margin: 0 }}>
                                {newCount} לידים חדשים · {unreadCount} הודעות שלא נקראו · סה״כ {leads.length} לידים
                            </p>
                        </div>

                        {/* #6 Stale leads banner */}
                        {staleCount > 0 && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', borderRadius: 16, marginBottom: 20, background: 'rgba(255,149,0,0.08)', border: '1.5px solid rgba(255,149,0,0.22)', fontFamily: SF }}>
                                <button onClick={() => setShowStaleOnly(v => !v)}
                                    style={{ padding: '7px 16px', borderRadius: 99, border: 'none', background: showStaleOnly ? '#FF9500' : 'rgba(255,149,0,0.15)', color: showStaleOnly ? '#fff' : '#FF9500', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: SF, flexShrink: 0, transition: 'all 0.15s' }}>
                                    {showStaleOnly ? 'הצג הכל' : 'צפה בהם'}
                                </button>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 14, fontWeight: 800, color: '#FF9500', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={15} style={{ flexShrink: 0 }} />{staleCount} לידים ממתינים לטיפול מעל {STALE_DAYS} ימים</p>
                                    <p style={{ fontSize: 12, color: '#86868B', margin: '2px 0 0', fontFamily: SF }}>לידים בסטטוס "חדש" או "ביצירת קשר" שלא עודכנו</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Pipeline */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 24 }}>
                            {Object.entries(PIPELINE_STATUSES).map(([status, meta]) => {
                                const count = leads.filter(l => (l.status || 'חדש') === status).length;
                                if (!count) return null;
                                return (
                                    <motion.button key={status} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setFilterStatus(status)}
                                        style={{ ...CARD, padding: '14px 14px', textAlign: 'right', border: 'none', cursor: 'pointer' }}>
                                        <p style={{ fontSize: 28, fontWeight: 900, color: meta.color, fontFamily: SF, margin: '0 0 2px', lineHeight: 1 }}>{count}</p>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: meta.color, fontFamily: SF, margin: 0, opacity: 0.8 }}>{status}</p>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Top priority */}
                        {(() => {
                            const top = [...leads].sort((a,b) => getLeadScore(b)-getLeadScore(a)).filter(l => !['נסגר','בוטל'].includes(l.status)).slice(0,5);
                            if (!top.length) return null;
                            return (
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <Zap size={14} color="#FF9500" strokeWidth={2} />
                                        <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, margin: 0 }}>לידים בעדיפות גבוהה</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {top.map(lead => {
                                            const score = getLeadScore(lead);
                                            return (
                                                <motion.button key={lead._docId} whileHover={{ x: -3 }}
                                                    onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); }}
                                                    style={{ ...CARD, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', textAlign: 'right', borderRight: `3px solid ${scoreColor(score)}` }}>
                                                    <Avatar name={lead.contactName} size={36} score={score} />
                                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contactName || '—'}</span>
                                                    <span style={{ fontSize: 11, color: '#86868B', fontFamily: SF, flexShrink: 0, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.institution || '—'}</span>
                                                    <ScoreDots score={score} />
                                                    <StatusPill status={lead.status || 'חדש'} />
                                                    {lead.unreadAdmin && <span style={{ width: 8, height: 8, borderRadius: 99, background: '#007AFF', flexShrink: 0 }} />}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Needs response */}
                        {(() => {
                            const urgent = leads.filter(l => !l.status || l.status === 'חדש').slice(0,3);
                            if (!urgent.length) return null;
                            return (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                        <AlertCircle size={14} color="#FF3B30" strokeWidth={2} />
                                        <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, margin: 0 }}>דורשים מענה מיידי</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {urgent.map(lead => (
                                            <motion.button key={lead._docId} whileHover={{ x: -3 }}
                                                onClick={() => setSelected(lead)}
                                                style={{ ...CARD, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', cursor: 'pointer', textAlign: 'right', borderRight: '3px solid #3B82F6' }}>
                                                <Avatar name={lead.contactName} size={34} />
                                                <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contactName || '—'}</span>
                                                <span style={{ fontSize: 11, color: '#86868B', fontFamily: SF, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.institution || '—'}</span>
                                                <span style={{ fontSize: 10, color: '#AEAEB2', fontFamily: SF, flexShrink: 0 }}>{lead.date || ''}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                ) : (

                    /* ── Lead detail ── */
                    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

                        {/* Back + Delete */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => handleDeleteLead(selected)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 10, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.06)', color: '#FF3B30', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: SF }}>
                                <Trash2 size={13} />מחק
                            </button>
                            <button onClick={() => setSelected(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 700, fontFamily: SF, cursor: 'pointer', padding: 0 }}>
                                כל הלידים
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        <LeadHero lead={selected} onStatusChange={updated => setSelected(updated)} />

                        {/* Channel tabs */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {CHANNELS.map(ch => {
                                const isActive = activeChannel === ch.id;
                                const hasUnread = ch.id === 'chat' && selected?.unreadAdmin;
                                return (
                                    <button key={ch.id}
                                        onClick={() => {
                                            setActiveChannel(ch.id);
                                            if (ch.id !== 'chat') { setActiveTpl(null); setCustomMsg(''); setCustomSubject(''); }
                                            if (ch.id === 'chat' && selected?.unreadAdmin) markAdminThreadRead(selected._docId);
                                        }}
                                        style={{
                                            position: 'relative', display: 'flex', alignItems: 'center', gap: 7,
                                            padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 800, fontFamily: SF,
                                            cursor: 'pointer', transition: 'all 0.18s',
                                            background: isActive ? ch.color + '12' : 'rgba(255,255,255,0.8)',
                                            border: `2px solid ${isActive ? ch.color : 'rgba(0,0,0,0.08)'}`,
                                            color: isActive ? ch.color : '#86868B',
                                            boxShadow: isActive ? `0 2px 14px ${ch.color}22` : 'none',
                                        }}>
                                        <ch.Icon size={14} strokeWidth={2} />
                                        {ch.label}
                                        {hasUnread && (
                                            <span style={{ position: 'absolute', top: -3, left: -3, width: 10, height: 10, borderRadius: 99, background: 'linear-gradient(135deg,#FF3B30,#FF2D55)', boxShadow: '0 0 0 2px rgba(245,245,247,0.8)' }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <style>{`@keyframes nc-ping{0%{transform:scale(1);opacity:.7}70%,100%{transform:scale(2.1);opacity:0}}`}</style>

                        {/* Chat */}
                        {activeChannel === 'chat' ? (
                            <ChatThreadPanel lead={selected} sendMessage={sendThreadMessage} markRead={markAdminThreadRead} />
                        ) : (
                            <>
                                {/* Templates */}
                                <div style={{ ...CARD, padding: '16px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <button onClick={() => { setAddingTpl(true); setEditingTpl(null); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SF }}>
                                            <Plus size={13} strokeWidth={2.5} />
                                            תבנית חדשה
                                        </button>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', fontFamily: SF, margin: 0 }}>תבניות מהירות</p>
                                    </div>

                                    {/* Smart recommendation banner */}
                                    {recommendedTpl && activeTpl?.id !== recommendedTpl.id && (
                                        <motion.button initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setActiveTpl(recommendedTpl)}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, marginBottom: 10, border: '1.5px solid rgba(0,122,255,0.22)', background: 'linear-gradient(135deg,rgba(0,122,255,0.05),rgba(88,86,214,0.04))', cursor: 'pointer', textAlign: 'right', transition: 'all 0.15s', fontFamily: SF }}>
                                            <Zap size={14} color="#007AFF" strokeWidth={2} style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', margin: 0 }}>מומלץ לשלב "{selected?.status || 'חדש'}"</p>
                                                <p style={{ fontSize: 11, color: '#6E6E73', margin: 0 }}>{recommendedTpl.name}</p>
                                            </div>
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', padding: '3px 10px', borderRadius: 99, background: 'linear-gradient(135deg,#007AFF,#5856D6)', flexShrink: 0, fontFamily: SF }}>בחר</span>
                                        </motion.button>
                                    )}

                                    <AnimatePresence>
                                        {addingTpl && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <TemplateEditor template={{ id: `tpl_${Date.now()}`, name: '', channel: activeChannel, status: '', body: '', subject: '' }} onSave={saveTpl} onCancel={() => setAddingTpl(false)} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Template pills */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {channelTpls.map(tpl => {
                                            const isActiveTpl = activeTpl?.id === tpl.id;
                                            const isRec = recommendedTpl?.id === tpl.id;
                                            return (
                                                <div key={tpl.id} style={{ display: 'flex', alignItems: 'center' }}>
                                                    <button onClick={() => { setActiveTpl(tpl); setEditingTpl(null); setAddingTpl(false); }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: 12, fontWeight: 700, fontFamily: SF, cursor: 'pointer', transition: 'all 0.15s', borderRadius: '99px 0 0 99px', border: `1.5px solid ${isActiveTpl ? '#007AFF' : isRec ? 'rgba(0,122,255,0.3)' : 'rgba(0,0,0,0.10)'}`, borderLeft: 'none', background: isActiveTpl ? 'rgba(0,122,255,0.08)' : 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: isActiveTpl ? '#007AFF' : '#374151' }}>
                                                        {isRec && <Zap size={11} color="#007AFF" strokeWidth={2.5} />}
                                                        {tpl.name}
                                                    </button>
                                                    <button onClick={() => { setEditingTpl(tpl); setAddingTpl(false); }} title="ערוך"
                                                        style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${isActiveTpl ? '#007AFF' : 'rgba(0,0,0,0.10)'}`, borderLeft: 'none', borderRight: 'none', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer' }}>
                                                        <Edit2 size={11} color="#AEAEB2" strokeWidth={2} />
                                                    </button>
                                                    <button onClick={() => deleteTpl(tpl.id)} title="מחק"
                                                        style={{ width: 28, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 99px 99px 0', border: `1.5px solid ${isActiveTpl ? '#007AFF' : 'rgba(0,0,0,0.10)'}`, background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer', color: '#AEAEB2' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.06)'; e.currentTarget.style.color = '#FF3B30'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.78)'; e.currentTarget.style.color = '#AEAEB2'; }}>
                                                        <Trash2 size={11} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {channelTpls.length === 0 && (
                                            <p style={{ fontSize: 12, color: '#AEAEB2', fontFamily: SF }}>אין תבניות — לחץ "תבנית חדשה"</p>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {editingTpl && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: 12 }}>
                                                <TemplateEditor template={editingTpl} onSave={saveTpl} onCancel={() => setEditingTpl(null)} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Composer */}
                                <div style={{ ...CARD, overflow: 'hidden' }}>
                                    {/* Header */}
                                    <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.012)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {activeChDef && <activeChDef.Icon size={14} color={activeChDef.color} strokeWidth={2} />}
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', fontFamily: SF }}>
                                                {activeChannel === 'whatsapp' ? 'הודעת WhatsApp' : 'הודעת מייל'}
                                            </span>
                                            {activeTpl && <span style={{ fontSize: 11, color: '#AEAEB2', fontFamily: SF }}>— {activeTpl.name}</span>}
                                        </div>
                                        {(customMsg || customSubject) && (
                                            <button onClick={() => { setCustomMsg(''); setCustomSubject(''); setActiveTpl(null); }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer', fontFamily: SF }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#FF3B30'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#AEAEB2'}>
                                                <X size={13} strokeWidth={2} />
                                                נקה
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {/* Email subject */}
                                        {activeChannel === 'email' && (
                                            <input placeholder="נושא המייל..." value={customSubject} onChange={e => setCustomSubject(e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: SF, borderRadius: 12, outline: 'none', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.02)', color: '#1D1D1F', boxSizing: 'border-box' }} />
                                        )}

                                        {/* Message textarea */}
                                        <textarea ref={textareaRef}
                                            placeholder={activeChannel === 'whatsapp' ? 'כתוב הודעת WhatsApp או בחר תבנית למעלה...' : 'כתוב גוף המייל...'}
                                            value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={7}
                                            style={{ width: '100%', padding: '12px 14px', fontSize: 13, fontFamily: SF, borderRadius: 14, outline: 'none', resize: 'vertical', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.015)', color: '#1D1D1F', lineHeight: 1.7, boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.35)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.09)'} />

                                        {/* ── Smart insert chips ── */}
                                        <SmartInserts lead={selected} bizPhone={bizPhone} onInsert={insertAtCursor} />

                                        {/* Send button + warning */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
                                            {activeChannel === 'whatsapp' ? (
                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={sendWhatsApp}
                                                    disabled={!customMsg || !selected?.phone}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 99, fontSize: 14, fontWeight: 800, fontFamily: SF, color: '#fff', border: 'none', cursor: (!customMsg || !selected?.phone) ? 'not-allowed' : 'pointer', opacity: (!customMsg || !selected?.phone) ? 0.5 : 1, background: (!customMsg || !selected?.phone) ? '#C7C7CC' : 'linear-gradient(135deg,#25D366,#1DA851)', boxShadow: (!customMsg || !selected?.phone) ? 'none' : '0 4px 16px rgba(37,211,102,0.38)', transition: 'all 0.2s' }}>
                                                    <MessageSquare size={15} strokeWidth={2} />
                                                    שלח WhatsApp
                                                </motion.button>
                                            ) : (
                                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={sendEmail}
                                                    disabled={!customMsg || !selected?.email}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 99, fontSize: 14, fontWeight: 800, fontFamily: SF, color: '#fff', border: 'none', cursor: (!customMsg || !selected?.email) ? 'not-allowed' : 'pointer', opacity: (!customMsg || !selected?.email) ? 0.5 : 1, background: (!customMsg || !selected?.email) ? '#C7C7CC' : 'linear-gradient(135deg,#007AFF,#5856D6)', boxShadow: (!customMsg || !selected?.email) ? 'none' : '0 4px 16px rgba(0,122,255,0.38)', transition: 'all 0.2s' }}>
                                                    <Mail size={15} strokeWidth={2} />
                                                    שלח מייל
                                                </motion.button>
                                            )}
                                            {activeChannel === 'whatsapp' && !selected?.phone && (
                                                <span style={{ fontSize: 11, color: '#FF9500', display: 'flex', alignItems: 'center', gap: 5, fontFamily: SF }}>
                                                    <AlertCircle size={13} strokeWidth={2} />
                                                    אין מספר טלפון
                                                </span>
                                            )}
                                            {activeChannel === 'email' && !selected?.email && (
                                                <span style={{ fontSize: 11, color: '#FF9500', display: 'flex', alignItems: 'center', gap: 5, fontFamily: SF }}>
                                                    <AlertCircle size={13} strokeWidth={2} />
                                                    אין כתובת מייל
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    )
                ) : (
                    /* ── Emails Queue Tab ── */
                    !selectedEmail ? (
                        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', paddingTop: 60, fontFamily: SF }}>
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING.soft}
                                style={{ width: 80, height: 80, borderRadius: 24, background: hexA(CORAL, 0.12), border: `1px solid ${hexA(CORAL, 0.24)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: CORAL, boxShadow: `0 8px 24px ${hexA(CORAL, 0.18)}` }}>
                                <Mail size={40} />
                            </motion.div>
                            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', margin: '0 0 8px' }}>תור אישור מיילים</h2>
                            <p style={{ fontSize: 14, color: '#6E6E73', maxWidth: 470, margin: '0 auto 24px', lineHeight: 1.5 }}>
                                כל מייל יוצא — ללקוחות, לספקים ופנימי לצוות — נעצר כאן לאישור ידני (וניתן לעריכה) לפני השליחה. שום מייל לא נשלח אוטומטית.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                                <div style={{ ...accentSurface(CORAL, { radius: RADIUS.smCard }), padding: '16px 26px', minWidth: 120 }}>
                                    <p style={{ fontSize: 34, fontWeight: 900, color: CORAL, margin: '0 0 2px', letterSpacing: '-1px', lineHeight: 1 }}>{pendingEmails.length}</p>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#86868B', margin: 0 }}>ממתינים לאישור</p>
                                </div>
                                <div style={{ ...accentSurface('#34C759', { radius: RADIUS.smCard }), padding: '16px 26px', minWidth: 120 }}>
                                    <p style={{ fontSize: 34, fontWeight: 900, color: '#248A3D', margin: '0 0 2px', letterSpacing: '-1px', lineHeight: 1 }}>{emailLog.filter(e => e.status === 'sent').length}</p>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#86868B', margin: 0 }}>נשלחו בהצלחה</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: SF }} dir="rtl">
                            {/* Top header actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {selectedEmail.status === 'pending' && (
                                        <>
                                            <button onClick={() => {
                                                if (isEditingEmail) {
                                                    handleSaveEmailEdit(selectedEmail);
                                                } else {
                                                    setIsEditingEmail(true);
                                                    setEmailEditSubject(selectedEmail.subject);
                                                    setEmailEditHtml(selectedEmail.html);
                                                }
                                            }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 10, border: '1px solid rgba(0,122,255,0.18)', background: 'rgba(0,122,255,0.06)', color: '#007AFF', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                                {isEditingEmail ? <Check size={13} /> : <Edit2 size={13} />}
                                                {isEditingEmail ? 'שמור שינויים' : 'ערוך מייל'}
                                            </button>
                                            {isEditingEmail && (
                                                <button onClick={() => setIsEditingEmail(false)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 10, border: '1px solid rgba(142,142,147,0.18)', background: 'rgba(142,142,147,0.06)', color: '#86868B', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                                    <X size={13} />
                                                    ביטול
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                                <button onClick={() => setSelectedEmail(null)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                                    כל המיילים
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>

                            {/* Email Details Card */}
                            <div style={{ ...CARD, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 14 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>
                                                אל: {selectedEmail.recipientName || EMAIL_KIND_META[emailKind(selectedEmail)].label}
                                            </h3>
                                            <KindBadge kind={emailKind(selectedEmail)} />
                                        </div>
                                        <p style={{ fontSize: 13, color: '#007AFF', fontWeight: 600, margin: 0 }}>
                                            {selectedEmail.to}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                                            background: selectedEmail.status === 'pending' ? 'rgba(255,149,0,0.1)' : selectedEmail.status === 'sent' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                                            color: selectedEmail.status === 'pending' ? '#FF9500' : selectedEmail.status === 'sent' ? '#34C759' : '#FF3B30'
                                        }}>
                                            {selectedEmail.status === 'pending' ? 'ממתין לאישור' : selectedEmail.status === 'sent' ? 'נשלח' : 'נדחה'}
                                        </span>
                                        {emailRefId(selectedEmail) && leads.some(l => l._docId === emailRefId(selectedEmail)) && (
                                            <button onClick={() => {
                                                const lead = leads.find(l => l._docId === emailRefId(selectedEmail));
                                                if (lead) {
                                                    setSelected(lead);
                                                    setActiveTab('leads');
                                                    setSelectedEmail(null);
                                                }
                                            }}
                                                style={{ border: 'none', background: 'none', color: '#007AFF', fontSize: 11, fontWeight: 700, padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>
                                                צפה בכרטיס ליד
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textAlign: 'right' }}>נושא המייל</span>
                                    {isEditingEmail ? (
                                        <input value={emailEditSubject} onChange={e => setEmailEditSubject(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 10, outline: 'none', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.015)', color: '#1D1D1F', boxSizing: 'border-box', textAlign: 'right' }} />
                                    ) : (
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.015)', textAlign: 'right' }}>
                                            {selectedEmail.subject}
                                        </div>
                                    )}
                                </div>

                                {/* Body Content */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B', textAlign: 'right' }}>תוכן המייל</span>
                                    {isEditingEmail ? (
                                        <textarea value={emailEditHtml} onChange={e => setEmailEditHtml(e.target.value)} rows={12}
                                            style={{ width: '100%', padding: '12px 14px', fontSize: 13, borderRadius: 12, outline: 'none', resize: 'vertical', border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.015)', color: '#1D1D1F', lineHeight: 1.6, boxSizing: 'border-box', textAlign: 'right' }} />
                                    ) : (
                                        <div style={{
                                            fontSize: 13, color: '#1D1D1F', padding: 18, borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: '#fff',
                                            lineHeight: 1.6, textAlign: 'right', minHeight: 180
                                        }} dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                                    )}
                                </div>

                                {/* Pending specific actions */}
                                {selectedEmail.status === 'pending' && !isEditingEmail && (
                                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => handleApproveEmail(selectedEmail)}
                                            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 99, fontSize: 14, fontWeight: 800, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#34C759,#30B0C7)', boxShadow: '0 4px 16px rgba(52,199,89,0.3)' }}>
                                            <Check size={16} strokeWidth={2.5} />
                                            אשר ושלח מייל זה
                                        </motion.button>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                            onClick={() => handleDeclineEmail(selectedEmail)}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderRadius: 99, fontSize: 14, fontWeight: 800, color: '#FF3B30', border: '1px solid rgba(255,59,48,0.25)', background: 'rgba(255,59,48,0.06)', cursor: 'pointer' }}>
                                            <X size={15} strokeWidth={2.5} />
                                            דחה/מחק
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
