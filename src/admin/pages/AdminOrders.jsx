/* eslint-disable */

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Phone, FileText, CheckCircle2, AlertCircle, Package, Send, Trash2, Truck } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSearchBar, AdminSectionHeader, AdminButton, AdminModal, AdminFilterPills, AdminDateFilter, filterByDate, InfoTooltip } from '../components/AdminComponents';
import initialProducts from '../../data/products';
import { db } from '../../firebase';
import { doc, updateDoc, setDoc, arrayUnion, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminKanbanBoard from '../components/AdminKanbanBoard';

// ─── AI reply templates & intent detection ────────────────────────────────────
const EMOJI_RXNS = ['👍','✅','❓','⏰','😊'];

const AI_TEMPLATES = {
    pricing: [
        { label: 'אישור בקשה', text: 'קיבלנו את בקשת הצעת המחיר שלך. הצוות שלנו מכין עבורך הצעה מותאמת ויחזור אליך בהקדם.' },
        { label: 'פרטים נוספים', text: 'תודה על פנייתך! כדי להכין הצעה מדויקת, נשמח לקבל פרטים נוספים על הכמויות הנדרשות.' },
    ],
    urgent: [
        { label: 'טיפול דחוף', text: 'קיבלנו את הבקשה הדחופה ומטפלים בה בעדיפות גבוהה. נחזור אליך היום עם מענה.' },
        { label: 'אישור דחיפות', text: 'הבנו שמדובר בבקשה דחופה. נעשה כמיטב יכולתנו להגיב בהקדם האפשרי.' },
    ],
    thanks: [
        { label: 'תודה חזרה', text: 'תודה רבה! שמחנו לסייע ונשמח לעמוד לשירותך גם בעתיד.' },
        { label: 'המשך שירות', text: 'תודה על האמון. אנחנו כאן לכל שאלה או צורך נוסף.' },
    ],
    delivery: [
        { label: 'עדכון משלוח', text: 'ההזמנה שלך בטיפול ותישלח בתוך 3-5 ימי עסקים. תעדכן בדוא״ל עם קוד מעקב.' },
        { label: 'אישור שילוח', text: 'קיבלנו את ההזמנה והיא תישלח בהקדם. ניצור קשר עם פרטי מעקב.' },
    ],
    general: [
        { label: 'מענה כללי', text: 'תודה על פנייתך! קיבלנו את הבקשה ונחזור אליך בתוך שעות ספורות.' },
        { label: 'בבירור', text: 'תודה על הפנייה. אנחנו בוחנים את הבקשה ונחזור אליך בהקדם עם מענה מפורט.' },
    ],
};

function detectIntent(msgs) {
    const last = [...msgs].reverse().find(m => m.from === 'customer')?.text || '';
    if (/מחיר|עלות|תמחיר|הצעה|כמה עולה|תמחור/.test(last)) return 'pricing';
    if (/דחוף|מיד|מהר|מחר|היום/.test(last)) return 'urgent';
    if (/תודה|תנקיו|תנקס|מעולה|מצוין|יפה/.test(last)) return 'thanks';
    if (/משלוח|שילוח|מתי מגיע|מעקב|נמסר|קבלה/.test(last)) return 'delivery';
    return 'general';
}

function getNextStepHint(quote) {
    const { status, dateTs, quoteSentAt, shippingDetails, trackingInfo } = quote;
    const daysSince = (ts) => ts ? Math.floor((Date.now() - ts) / 86400000) : null;
    const age = daysSince(dateTs);

    if (status === 'חדש' && age > 0) return { icon: '⚡', text: `בקשה המתינה ${age} ימים — צור קשר עכשיו`, color: '#FF3B30' };
    if (status === 'ביצירת קשר') return { icon: '📦', text: 'בדוק מלאי אצל הספקים ובנה הצעה', color: '#FF9500' };
    if (status === 'בדיקת מלאי') return { icon: '💰', text: 'השלם את מחירי ההצעה ושלח ללקוח', color: '#F59E0B' };
    if (status === 'הוצע מחיר') {
        const d = daysSince(quoteSentAt);
        if (d > 5) return { icon: '🔔', text: `הצעה ממתינה ${d} ימים — שלח תזכורת`, color: '#FF3B30' };
        if (d > 2) return { icon: '📱', text: `נשלח לפני ${d} ימים — בדוק אם יש שאלות`, color: '#FF9500' };
        return { icon: '⏳', text: 'ממתין לתשובת הלקוח', color: '#007AFF' };
    }
    if (status === 'ממתין לאישור' && !shippingDetails?.address) return { icon: '📍', text: 'הזן פרטי משלוח לסיום האישור', color: '#5856D6' };
    if (status === 'נסגר') return { icon: '🏭', text: 'בחר ספק והעבר את ההזמנה', color: '#34C759' };
    if (status === 'הועבר לספק' && !trackingInfo?.trackingNumber) return { icon: '🚚', text: 'הוסף מספר מעקב ממשלוח הספק', color: '#0891B2' };
    if (status === 'בדרך') return { icon: '📅', text: 'עקוב אחר המשלוח ועדכן עם הגעה', color: '#7C3AED' };
    return null;
}

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";

// ─── Copy-to-clipboard button ─────────────────────────────────────────────────
function CopyBtn({ text, label }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }); }}
            title={`העתק ${label || ''}`}
            style={{ padding: '2px 7px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.09)', background: copied ? 'rgba(52,199,89,0.12)' : 'rgba(0,0,0,0.04)', fontSize: 10, fontWeight: 800, color: copied ? '#34C759' : '#86868B', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', transition: 'all 0.2s', letterSpacing: 0 }}>
            {copied ? '✓' : '⎘'}
        </button>
    );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportQuotesToCsv(quotes) {
    const headers = ['מזהה', 'תאריך', 'שם לקוח', 'מוסד', 'תפקיד', 'טלפון', 'מייל', 'סטטוס', 'שווי הצעה', 'ספק', 'מספר מעקב'];
    const rows = quotes.map(q => [
        q.id, q.date, q.contactName || '', q.institution || '', q.contactRole || '',
        q.phone || '', q.email || '', q.status || '',
        q.subtotal || 0, q.supplierOrder?.supplierName || '', q.trackingInfo?.trackingNumber || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nextclass-quotes-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.csv`; a.click();
    URL.revokeObjectURL(url);
}

// ─── Email preview modal ─────────────────────────────────────────────────────
function EmailPreviewModal({ type, quote, html, subject, loading, sending, onClose, onSend }) {
    const [editSubject, setEditSubject] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [noteOpen, setNoteOpen] = useState(false);
    useEffect(() => { if (subject) setEditSubject(subject); }, [subject]);

    const hasNote = customNote.trim().length > 0;
    const subjectChanged = editSubject !== subject;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ width: '100%', maxWidth: 660, background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}
            >
                {/* Header */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(135deg,#F0F7FF,#FAFCFF)' }} dir="rtl">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>תצוגה מקדימה</span>
                            {(hasNote || subjectChanged) && <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.1)', padding: '2px 8px', borderRadius: 99 }}>מותאם אישית</span>}
                        </div>
                        <button onClick={onClose} style={{ border: 'none', background: 'rgba(0,0,0,0.07)', borderRadius: 99, width: 28, height: 28, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                    </div>
                    {/* Subject — editable */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#86868B', whiteSpace: 'nowrap' }}>נושא:</span>
                        <input value={editSubject} onChange={e => setEditSubject(e.target.value)}
                            style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#5856D6', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Heebo,sans-serif', direction: 'rtl' }} />
                    </div>
                    {quote?.email && <p style={{ fontSize: 10, color: '#AEAEB2', margin: '2px 0 0', fontWeight: 600 }}>אל: {quote.email}</p>}
                </div>

                {/* Email preview */}
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340, flexDirection: 'column', gap: 14, background: '#F5F5F7' }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid #007AFF', borderTopColor: 'transparent', animation: 'emailSpin 0.75s linear infinite' }} />
                            <p style={{ fontSize: 12, color: '#86868B', fontWeight: 600, margin: 0 }}>טוען תצוגה מקדימה...</p>
                        </div>
                    ) : (
                        <iframe srcDoc={html} style={{ width: '100%', height: 420, border: 'none', display: 'block', background: '#F5F5F7' }} sandbox="allow-same-origin" title="Email preview" />
                    )}
                </div>

                {/* Personal note section */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: noteOpen ? '#FFFBF0' : '#FAFAFA' }} dir="rtl">
                    <button onClick={() => setNoteOpen(v => !v)}
                        style={{ width: '100%', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: hasNote ? '#FF9500' : '#86868B' }}>✏️ הוסף הערה אישית ללקוח</span>
                        {hasNote && <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.12)', padding: '1px 7px', borderRadius: 99 }}>נוסף</span>}
                        <span style={{ marginRight: 'auto', fontSize: 11, color: '#AEAEB2', transform: noteOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
                    </button>
                    {noteOpen && (
                        <div style={{ padding: '0 18px 14px' }}>
                            <textarea
                                value={customNote}
                                onChange={e => setCustomNote(e.target.value)}
                                placeholder="כתבו כאן הערה שתופיע במייל בסגנון בולט, לפני החתימה..."
                                style={{ width: '100%', minHeight: 80, border: '1.5px solid rgba(255,149,0,0.3)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontFamily: 'Heebo,sans-serif', direction: 'rtl', background: '#fff', color: '#1D1D1F', outline: 'none', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
                            />
                            <p style={{ fontSize: 10, color: '#AEAEB2', margin: '4px 0 0', fontWeight: 600 }}>ההערה תופיע בתוך המייל בתיבה מודגשת לפני החתימה</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', background: '#fff' }} dir="rtl">
                    <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, fontWeight: 800, color: '#1D1D1F', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>ביטול</button>
                    <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => onSend(hasNote ? customNote : null, subjectChanged ? editSubject : null)}
                        disabled={loading || sending}
                        style={{ padding: '9px 24px', borderRadius: 12, border: 'none', background: loading || sending ? '#AEAEB2' : 'linear-gradient(135deg,#007AFF,#5856D6)', fontSize: 13, fontWeight: 800, color: '#fff', cursor: loading || sending ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: loading || sending ? 'none' : '0 4px 14px rgba(0,122,255,0.35)' }}>
                        {sending ? '⏳ שולח...' : hasNote ? '✉️ שלח עם הערה' : '✉️ שלח מייל'}
                    </motion.button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

// ─── Quick status bar (modal header inline control) ───────────────────────────
function QuickStatusBar({ currentStatus, onUpdateStatus, quoteId }) {
    return (
        <div style={{ overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }} dir="rtl">
            <div style={{ display: 'flex', gap: 5, minWidth: 'max-content', padding: '2px 0' }}>
                {QUOTE_STATUS_FLOW.map((s) => {
                    const isActive = s === currentStatus;
                    const isPast = QUOTE_STATUS_FLOW.indexOf(currentStatus) > QUOTE_STATUS_FLOW.indexOf(s);
                    const color = QUOTE_STATUS_COLORS[s] || '#007AFF';
                    return (
                        <motion.button key={s} whileTap={{ scale: 0.93 }}
                            animate={isActive ? { boxShadow: [`0 0 0 0px ${color}40`, `0 0 0 5px ${color}20`, `0 0 0 0px ${color}40`] } : {}}
                            transition={isActive ? { repeat: Infinity, duration: 2.2, ease: 'easeInOut' } : {}}
                            onClick={() => !isActive && onUpdateStatus(quoteId, s)}
                            style={{
                                padding: '5px 11px', borderRadius: 99, fontFamily: 'Heebo,sans-serif',
                                border: isActive ? `1.5px solid ${color}` : `1.5px solid ${isPast ? color + '40' : 'rgba(0,0,0,0.10)'}`,
                                background: isActive ? color : isPast ? `${color}14` : 'rgba(0,0,0,0.03)',
                                color: isActive ? '#fff' : isPast ? color : '#86868B',
                                fontSize: 10, fontWeight: 800, cursor: isActive ? 'default' : 'pointer',
                                transition: 'all 0.18s', whiteSpace: 'nowrap',
                            }}>
                            {s}
                        </motion.button>
                    );
                })}
                <motion.button whileTap={{ scale: 0.93 }}
                    onClick={() => currentStatus !== 'בוטל' && onUpdateStatus(quoteId, 'בוטל')}
                    style={{
                        padding: '5px 11px', borderRadius: 99, fontFamily: 'Heebo,sans-serif',
                        border: currentStatus === 'בוטל' ? '1.5px solid #AEAEB2' : '1.5px solid rgba(174,174,178,0.3)',
                        background: currentStatus === 'בוטל' ? '#AEAEB2' : 'rgba(0,0,0,0.03)',
                        color: currentStatus === 'בוטל' ? '#fff' : '#AEAEB2',
                        fontSize: 10, fontWeight: 800, cursor: currentStatus === 'בוטל' ? 'default' : 'pointer',
                        transition: 'all 0.18s', whiteSpace: 'nowrap',
                    }}>
                    בוטל
                </motion.button>
            </div>
        </div>
    );
}

// ─── Shared glass ─────────────────────────────────────────────────────────────
const glass = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
};

// ─── Orders constants ─────────────────────────────────────────────────────────
const ORDER_STATUS_COLORS = {
    'חדש': '#FF3B30', 'ממתין': '#FF9500', 'אושר': '#007AFF',
    'נשלח': '#5856D6', 'נמסר': '#34C759', 'בוטל': '#FF3B30',
};
const ORDER_STATUSES = ['הכל', 'חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר', 'בוטל'];
const ORDER_STATUS_FLOW = ['חדש', 'ממתין', 'אושר', 'נשלח', 'נמסר'];

// ─── Quote constants ──────────────────────────────────────────────────────────
const QUOTE_STATUS_COLORS = {
    'חדש':           '#FF3B30',
    'ביצירת קשר':    '#FF9500',
    'בדיקת מלאי':   '#F59E0B',
    'הוצע מחיר':     '#007AFF',
    'במשא ומתן':     '#5856D6', // kept for backward compat
    'ממתין לאישור':  '#5856D6',
    'נסגר':          '#34C759',
    'הועבר לספק':   '#0891B2',
    'בדרך':          '#7C3AED',
    'סופק':          '#1DB954',
    'בוטל':           '#AEAEB2',
};
const QUOTE_STATUSES = ['הכל', 'חדש', 'ביצירת קשר', 'הוצע מחיר', 'ממתין לאישור', 'נסגר', 'הועבר לספק', 'בדרך', 'סופק', 'בוטל'];
const QUOTE_STATUS_FLOW  = ['חדש', 'ביצירת קשר', 'הוצע מחיר', 'ממתין לאישור', 'נסגר', 'הועבר לספק', 'בדרך', 'סופק'];

// ─── Mini KPI stat ────────────────────────────────────────────────────────────
function Stat({ label, value, color, Icon, tooltip }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[20px] p-4 text-right relative overflow-hidden"
            style={{
                background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.94) 50%, rgba(255,255,255,0.88) 100%)`,
                border: `1px solid ${color}22`,
                boxShadow: `0 4px 20px ${color}10, 0 1px 0 rgba(255,255,255,0.95) inset`,
            }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: `${color}16`, border: `1px solid ${color}22` }}>
                    {Icon && <Icon size={15} style={{ color }} />}
                </div>
                <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: color }} />
            </div>
            <p className="text-[26px] font-black tracking-tighter leading-none" style={{ color }}>{value}</p>
            <p className="text-[#86868B] text-[10px] font-bold tracking-widest mt-1.5 flex items-center gap-0.5">
                {label}{tooltip && <InfoTooltip text={tooltip} />}
            </p>
        </motion.div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }) {
    const colors = ['#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
    const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
    return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}>
            {name?.[0] || '?'}
        </div>
    );
}

// ─── Status flow timeline — compact, handles up to 9 stages ─────────────────
function StatusTimeline({ status, flow, colors }) {
    const idx = flow.indexOf(status);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4, gap: 0 }}>
            {flow.map((s, i) => {
                const done = i <= idx, active = i === idx;
                return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <motion.div
                                animate={{ scale: active ? [1, 1.18, 1] : 1 }}
                                transition={{ repeat: active ? Infinity : 0, duration: 1.6 }}
                                style={{
                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 9, fontWeight: 900,
                                    background: done ? (colors[s] || '#007AFF') : 'rgba(0,0,0,0.06)',
                                    color: done ? 'white' : '#AEAEB2',
                                    boxShadow: active ? `0 0 0 3px ${(colors[s] || '#007AFF')}28` : 'none',
                                }}>
                                {done ? '✓' : i + 1}
                            </motion.div>
                            <p style={{ fontSize: 8, fontWeight: 800, color: done ? (colors[s] || '#007AFF') : '#AEAEB2', whiteSpace: 'nowrap', maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', margin: 0 }}>{s}</p>
                        </div>
                        {i < flow.length - 1 && (
                            <div style={{ width: 14, height: 2, background: i < idx ? (colors[flow[i + 1]] || '#007AFF') : 'rgba(0,0,0,0.08)', borderRadius: 2, margin: '0 3px', marginBottom: 14, flexShrink: 0 }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Quick status dropdown ────────────────────────────────────────────────────
function QuickDropdown({ item, statuses, colors, onUpdate }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const color = colors[item.status] || '#AEAEB2';
    return (
        <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(o => !o)}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black"
                style={{ background: `${color}18`, color }}>
                {item.status}
                <motion.span animate={{ rotate: open ? 180 : 0 }} className="opacity-60 text-[9px]">▾</motion.span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute top-full mt-1 right-0 z-50 rounded-2xl overflow-hidden py-1"
                        style={{ ...glass, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', minWidth: 130 }}
                        dir="rtl"
                    >
                        {statuses.slice(1).map(s => (
                            <button key={s} type="button"
                                onClick={() => { onUpdate(item.id, s); setOpen(false); }}
                                className="w-full text-right px-4 py-2 text-xs font-bold transition-colors hover:bg-black/04"
                                style={{ color: s === item.status ? (colors[s] || '#007AFF') : '#1D1D1F' }}>
                                {s === item.status ? '✓ ' : ''}{s}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PIPELINE STAGE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function StagePanel({ color, icon, title, desc, children, onSwitchTab, items }) {
    const navigate = useNavigate();
    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ borderRadius: 18, padding: 16, background: `linear-gradient(135deg,${color}0F,${color}07)`, border: `1.5px solid ${color}2E`, boxShadow: `0 4px 20px ${color}12` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg,${color},${color}BB)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 10px ${color}40`, fontSize: 18 }}>
                    {icon}
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#6E6E73' }}>{desc}</div>
                </div>
            </div>

            {/* ── Order items summary ── */}
            {items?.length > 0 && (
                <div style={{ marginTop: 12, borderRadius: 12, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                    <div style={{ padding: '6px 12px', background: `${color}0D`, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: '0.08em' }}>{items.length} פריטים בהזמנה</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#6E6E73' }}>
                            ₪{items.reduce((s, it) => s + ((Number(it.salePrice ?? it.price ?? 0)) * (Number(it.qty ?? it.quantity ?? 1))), 0).toLocaleString()}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: idx < items.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                                {item.image
                                    ? <img src={item.image} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.07)' }} onError={e => e.target.style.display='none'} />
                                    : <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📦</div>
                                }
                                <button onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(item.title || item.name || '')}`)}
                                    style={{ flex: 1, textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', padding: 0, overflow: 'hidden' }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.15)' }}>{item.title || item.name || '—'}</p>
                                    {item.category && <p style={{ fontSize: 10, color: '#86868B', margin: '1px 0 0' }}>{item.category}</p>}
                                </button>
                                <span style={{ fontSize: 11, fontWeight: 800, color, flexShrink: 0 }}>×{item.qty ?? item.quantity ?? 1}</span>
                                {(item.salePrice || item.price) && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73', flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                                        ₪{((Number(item.salePrice ?? item.price ?? 0)) * (Number(item.qty ?? item.quantity ?? 1))).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {children && <div style={{ marginTop: 14 }}>{children}</div>}
            {onSwitchTab && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => onSwitchTab('chat')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, fontSize: 10, fontWeight: 800, cursor: 'pointer', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#6E6E73', fontFamily: 'Heebo,sans-serif' }}>
                        💬 עבור לשיחה
                    </button>
                </div>
            )}
        </motion.div>
    );
}

function StageBtn({ color, label, onClick, secondary, href, target }) {
    const style = {
        padding: '10px 18px', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13, fontWeight: 800,
        ...(secondary
            ? { background: 'transparent', border: `1.5px solid ${color}50`, color, boxShadow: 'none' }
            : { background: `linear-gradient(135deg,${color},${color}CC)`, border: 'none', color: '#fff', boxShadow: `0 4px 14px ${color}35` }),
    };
    if (href) return <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} href={href} target={target} rel="noopener noreferrer" style={style}>{label}</motion.a>;
    return <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={onClick} style={{ ...style, fontFamily: 'Heebo,sans-serif' }}>{label}</motion.button>;
}

function PipelineField({ label, value, onChange, type = 'text', placeholder, options }) {
    const base = { width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box', direction: 'rtl' };
    const fo = e => e.target.style.borderColor = 'rgba(0,122,255,0.40)';
    const bl = e => e.target.style.borderColor = 'rgba(0,0,0,0.10)';
    return (
        <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</label>
            {options
                ? <select value={value} onChange={e => onChange(e.target.value)} dir="rtl" style={{ ...base, cursor: 'pointer' }}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select>
                : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={fo} onBlur={bl} />
            }
        </div>
    );
}

// ── Quote Builder ─────────────────────────────────────────────────────────────
function QuoteBuilderPanel({ quote, updateQuoteFields, onUpdateStatus, showToast, onSwitchTab, openEmailPreview }) {
    const navigate = useNavigate();
    const [items, setItems] = useState(
        (quote.items || []).map(item => ({ ...item, salePrice: item.salePrice ?? item.price ?? 0 }))
    );
    const [message, setMessage] = useState(quote.quoteMessage || '');
    const [shippingFee, setShippingFee] = useState(Number(quote.shippingFee) || 0);
    const [shippingIncluded, setShippingIncluded] = useState(quote.shippingIncluded ?? false);
    const [busy, setBusy] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    const itemsTotal = items.reduce((s, it) => s + (Number(it.salePrice) || 0) * (Number(it.qty ?? it.quantity) || 1), 0);
    const total = itemsTotal + (shippingIncluded && shippingFee > 0 ? 0 : (shippingFee > 0 ? shippingFee : 0));

    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
    const updateQty = (idx, qty) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it));

    const pickerProducts = useMemo(() => {
        const q = pickerSearch.trim();
        const all = initialProducts.filter(p => p.isActive !== false);
        if (!q) return all.slice(0, 8);
        return all.filter(p => (p.title || p.name || '').includes(q) || (p.category || '').includes(q)).slice(0, 8);
    }, [pickerSearch]);

    const addProduct = (p) => {
        const exists = items.findIndex(it => String(it.id) === String(p.id));
        if (exists >= 0) {
            setItems(prev => prev.map((it, i) => i === exists ? { ...it, qty: (Number(it.qty) || 1) + 1 } : it));
        } else {
            setItems(prev => [...prev, {
                id: p.id, title: p.title || p.name, image: p.image,
                category: p.category, qty: 1, price: p.price || 0, salePrice: p.price || 0,
            }]);
        }
        setPickerSearch('');
        setShowPicker(false);
        showToast('מוצר נוסף להצעה', 'success');
    };

    const quoteText = [
        `✨ הצעת מחיר מ-NextClass`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `הצעה מספר: ${quote.id}`,
        `ל: ${quote.contactName || 'לקוח'}${quote.institution ? ` | ${quote.institution}` : ''}`,
        ``,
        `📦 פרטי ההצעה:`,
        ...items.map(it => `• ${it.title}\n  ${it.qty ?? it.quantity ?? 1} יח׳ × ₪${Number(it.salePrice).toLocaleString()} = ₪${(Number(it.salePrice) * (Number(it.qty ?? it.quantity) || 1)).toLocaleString()}`),
        ``,
        `💰 סה"כ: ₪${total.toLocaleString()}`,
        message ? `\n📝 ${message}` : '',
        ``,
        `⏳ תוקף ההצעה: 14 יום`,
        `📞 NextClass | 058-585-6356`,
    ].join('\n');

    const handleSend = async (method) => {
        if (method === 'email' && quote.email) {
            const updatedQuote = { ...quote, items: items.map(it => ({ ...it, salePrice: Number(it.salePrice) || 0 })), subtotal: total };
            const preAction = async () => {
                await updateQuoteFields(quote.id, {
                    items: items.map(it => ({ ...it, salePrice: Number(it.salePrice) || 0 })),
                    subtotal: total, quoteMessage: message, quoteSentAt: Date.now(),
                    shippingFee: Number(shippingFee) || 0, shippingIncluded,
                });
                await onUpdateStatus(quote.id, 'הוצע מחיר');
                showToast('הצעת מחיר נשלחה ✓', 'success');
                setTimeout(() => onSwitchTab?.('chat'), 400);
            };
            openEmailPreview?.('quote_sent', updatedQuote, preAction);
            return;
        }
        setBusy(true);
        try {
            await updateQuoteFields(quote.id, {
                items: items.map(it => ({ ...it, salePrice: Number(it.salePrice) || 0 })),
                subtotal: total, quoteMessage: message, quoteSentAt: Date.now(),
                shippingFee: Number(shippingFee) || 0, shippingIncluded,
            });
            await onUpdateStatus(quote.id, 'הוצע מחיר');
            showToast('הצעת מחיר נשלחה ✓', 'success');
            if (method === 'wa' && quote.phone) {
                window.open(`https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(quoteText)}`, '_blank');
                setTimeout(() => onSwitchTab?.('chat'), 400);
            } else {
                onSwitchTab?.('chat');
            }
        } finally { setBusy(false); }
    };

    const inputCss = { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' };

    return (
        <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPicker(p => !p)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: 'rgba(0,122,255,0.10)', color: '#007AFF' }}>
                    + הוסף מוצר
                </motion.button>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', margin: 0 }}>ערוך מחירים</p>
            </div>

            {/* Product picker */}
            <AnimatePresence>
                {showPicker && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ marginBottom: 12, borderRadius: 14, border: '1.5px solid rgba(0,122,255,0.22)', background: 'rgba(240,247,255,0.95)', padding: 12, boxShadow: '0 8px 28px rgba(0,122,255,0.10)' }}>
                        <input value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                            placeholder="חיפוש מוצר לפי שם..." dir="rtl" autoFocus
                            style={{ ...inputCss, marginBottom: 8, borderColor: 'rgba(0,122,255,0.25)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
                            {pickerProducts.map(p => (
                                <motion.button key={p.id} whileHover={{ background: 'rgba(0,122,255,0.08)' }} whileTap={{ scale: 0.98 }}
                                    onClick={() => addProduct(p)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'white', fontFamily: 'Heebo,sans-serif', transition: 'background 0.15s' }}>
                                    {p.image
                                        ? <img src={p.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                                        : <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0F7FF', flexShrink: 0 }} />}
                                    <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || p.name}</p>
                                        <p style={{ fontSize: 10, color: '#86868B', margin: '1px 0 0' }}>{p.category} · ₪{(p.price || 0).toLocaleString()}</p>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>+ הוסף</span>
                                </motion.button>
                            ))}
                            {pickerProducts.length === 0 && <p style={{ fontSize: 12, color: '#AEAEB2', textAlign: 'center', padding: '8px 0' }}>לא נמצאו מוצרים</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        {item.image && <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.07)' }} onError={e => e.target.style.display = 'none'} />}
                        <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                            <button onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(item.title || item.name || '')}`)} style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'right', width: '100%', fontFamily: 'Heebo,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.15)' }}>{item.title}</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 10, color: '#AEAEB2' }}>כמות:</span>
                                <input type="number" min="1" value={item.qty ?? item.quantity ?? 1}
                                    onChange={e => updateQty(idx, e.target.value)}
                                    style={{ width: 44, padding: '2px 6px', borderRadius: 7, border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#1D1D1F', textAlign: 'center', fontFamily: 'Heebo,sans-serif', outline: 'none' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.4)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.10)'} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: '#6E6E73' }}>₪</span>
                            <input type="number" value={item.salePrice}
                                onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, salePrice: e.target.value } : it))}
                                style={{ width: 85, padding: '6px 10px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 700, color: '#1D1D1F', textAlign: 'center', fontFamily: 'Heebo,sans-serif', outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.10)'} />
                            <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700, minWidth: 60 }}>= ₪{(Number(item.salePrice || 0) * (Number(item.qty ?? item.quantity) || 1)).toLocaleString()}</span>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem(idx)}
                            style={{ width: 26, height: 26, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 900, lineHeight: 1 }}>
                            ×
                        </motion.button>
                    </div>
                ))}
                {items.length === 0 && (
                    <div style={{ padding: '16px', borderRadius: 12, border: '1.5px dashed rgba(0,122,255,0.2)', textAlign: 'center', color: '#AEAEB2', fontSize: 12 }}>
                        אין מוצרים — לחץ "+ הוסף מוצר" למעלה
                    </div>
                )}
                {items.length > 0 && (
                    <div style={{ borderRadius: 12, background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.14)', overflow: 'hidden' }}>
                        {/* Shipping row */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,122,255,0.1)', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                                <input type="checkbox" checked={shippingFee > 0} onChange={e => { if (!e.target.checked) setShippingFee(0); else if (!shippingFee) setShippingFee(''); }}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#007AFF' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#007AFF' }}>🚚 עלות משלוח</span>
                            </label>
                            {shippingFee > 0 || shippingFee === '' ? (
                                <>
                                    <div style={{ position: 'relative', flex: 1, maxWidth: 100 }}>
                                        <input type="number" value={shippingFee} onChange={e => setShippingFee(Number(e.target.value) || '')} placeholder="0"
                                            style={{ width: '100%', padding: '5px 20px 5px 8px', borderRadius: 8, border: '1.5px solid rgba(0,122,255,0.3)', fontSize: 13, fontWeight: 700, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box', textAlign: 'left' }} />
                                        <span style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#86868B' }}>₪</span>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={shippingIncluded} onChange={e => setShippingIncluded(e.target.checked)}
                                            style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#34C759' }} />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#34C759' }}>כלול במחיר</span>
                                    </label>
                                </>
                            ) : <span style={{ fontSize: 11, color: '#86868B' }}>ללא משלוח</span>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
                            <span style={{ fontSize: 17, fontWeight: 900, color: '#007AFF' }}>₪{(itemsTotal + (shippingFee > 0 && !shippingIncluded ? Number(shippingFee) : 0)).toLocaleString()}</span>
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#6E6E73', display: 'block' }}>סה"כ הצעה</span>
                                {shippingFee > 0 && <span style={{ fontSize: 10, color: shippingIncluded ? '#34C759' : '#FF9500', fontWeight: 700 }}>{shippingIncluded ? `משלוח כלול (₪${Number(shippingFee).toLocaleString()})` : `+ ₪${Number(shippingFee).toLocaleString()} משלוח`}</span>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="הערה ללקוח — תנאי תשלום, זמן אספקה, תוקף..." dir="rtl" rows={2}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 500, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5, direction: 'rtl', marginBottom: 12 }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.10)'} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {quote.phone && <StageBtn color="#25D366" label="📱 שלח WhatsApp" onClick={() => handleSend('wa')} />}
                {quote.email && <StageBtn color="#007AFF" label="✉️ שלח מייל" onClick={() => handleSend('email')} />}
                <StageBtn color="#34C759" label="✓ שמור כהצעה שנשלחה" onClick={() => handleSend('save')} secondary />
            </div>
        </div>
    );
}

// ── Shipping details form ─────────────────────────────────────────────────────
function ShippingForm({ quote, updateQuoteFields, onUpdateStatus, showToast }) {
    const sd = quote.shippingDetails || {};
    const [form, setForm] = useState({
        deliveryName:  sd.deliveryName  || quote.contactName || '',
        deliveryPhone: sd.deliveryPhone || quote.phone || '',
        address:       sd.address  || '',
        city:          sd.city     || '',
        zip:           sd.zip      || '',
        paymentMethod: sd.paymentMethod || 'העברה בנקאית',
        notes:         sd.notes    || '',
    });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        await updateQuoteFields(quote.id, { shippingDetails: { ...form, savedAt: Date.now() } });
        await onUpdateStatus(quote.id, 'נסגר');
        showToast('פרטי לקוח נשמרו — עסקה נסגרה ✓', 'success');
    };

    return (
        <div>
            {sd.address && (
                <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 12, color: '#34C759', fontWeight: 700, textAlign: 'right' }}>
                    ✓ נשמר: {sd.address}, {sd.city}
                </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <PipelineField label="שם נמען" value={form.deliveryName} onChange={v => set('deliveryName', v)} placeholder="שם לקבלת המשלוח" />
                <PipelineField label="טלפון נמען" value={form.deliveryPhone} onChange={v => set('deliveryPhone', v)} placeholder="05X-XXXXXXX" />
                <div style={{ gridColumn: 'span 2' }}>
                    <PipelineField label="כתובת למשלוח" value={form.address} onChange={v => set('address', v)} placeholder="רחוב + מספר" />
                </div>
                <PipelineField label="עיר" value={form.city} onChange={v => set('city', v)} placeholder="ירושלים" />
                <PipelineField label="מיקוד" value={form.zip} onChange={v => set('zip', v)} placeholder="1234567" />
                <div style={{ gridColumn: 'span 2' }}>
                    <PipelineField label="אמצעי תשלום" value={form.paymentMethod} onChange={v => set('paymentMethod', v)} options={['העברה בנקאית', 'כרטיס אשראי', 'שיק', 'מזומן', 'ניכוי מקור']} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <PipelineField label="הערות לאספקה" value={form.notes} onChange={v => set('notes', v)} placeholder="מועד אספקה, קומה, הנחיות..." />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <StageBtn color="#34C759" label="✓ שמור ואשר עסקה" onClick={handleSave} />
                </div>
            </div>
        </div>
    );
}

// ── Profit Calculator ─────────────────────────────────────────────────────────
function ProfitCalculatorPanel({ quote, onBack, onContinue }) {
    const items = quote.items || [];
    const [costs, setCosts] = useState(() =>
        Object.fromEntries(items.map(it => [it.id ?? it.title, '']))
    );
    const [shipping, setShipping] = useState('');
    const [otherLabel, setOtherLabel] = useState('');
    const [otherAmount, setOtherAmount] = useState('');

    const totalRevenue = Number(quote.subtotal) || 0;
    const totalSupplierCost = items.reduce((s, it) => {
        const qty = it.qty ?? it.quantity ?? 1;
        return s + (Number(costs[it.id ?? it.title]) || 0) * qty;
    }, 0);
    const totalAdditional = (Number(shipping) || 0) + (Number(otherAmount) || 0);
    const netProfit = totalRevenue - totalSupplierCost - totalAdditional;
    const profitPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const allFilled = items.every(it => Number(costs[it.id ?? it.title]) > 0);

    const profitColor = netProfit >= 0 ? '#34C759' : '#FF3B30';

    return (
        <div style={{ padding: '16px 20px 20px', direction: 'rtl', overflowY: 'auto', maxHeight: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <button onClick={onBack} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#86868B', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>← חזור</button>
                <p style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>💰 חישוב רווחיות</p>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {items.map(it => {
                    const key = it.id ?? it.title;
                    const qty = it.qty ?? it.quantity ?? 1;
                    const custPrice = Number(it.salePrice || it.price || 0);
                    const suppPrice = Number(costs[key]) || 0;
                    const itemProfit = (custPrice - suppPrice) * qty;
                    const itemPct = custPrice > 0 ? ((custPrice - suppPrice) / custPrice * 100) : 0;
                    const hasInput = suppPrice > 0;
                    return (
                        <div key={key} style={{ borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: '#FAFAFA', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: hasInput ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                                {it.image && <img src={it.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</p>
                                    <p style={{ fontSize: 10, color: '#86868B', margin: '2px 0 0' }}>×{qty} · מחיר ללקוח: <strong style={{ color: '#007AFF' }}>₪{custPrice.toLocaleString()}</strong> ליח׳</p>
                                </div>
                                <div style={{ flexShrink: 0, textAlign: 'left', width: 120 }}>
                                    <p style={{ fontSize: 9, fontWeight: 700, color: '#86868B', margin: '0 0 3px' }}>מחיר ספק ליח׳</p>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={costs[key]} onChange={e => setCosts(p => ({ ...p, [key]: e.target.value }))}
                                            placeholder="0"
                                            style={{ width: '100%', padding: '6px 22px 6px 8px', borderRadius: 8, border: `1.5px solid ${hasInput ? 'rgba(52,199,89,0.4)' : 'rgba(0,0,0,0.15)'}`, fontSize: 12, fontWeight: 700, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box', textAlign: 'left', background: hasInput ? 'rgba(52,199,89,0.04)' : '#fff' }} />
                                        <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#86868B', fontWeight: 700 }}>₪</span>
                                    </div>
                                </div>
                            </div>
                            {hasInput && (
                                <div style={{ padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, color: '#86868B' }}>רווח מפריט זה</span>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: itemProfit >= 0 ? '#34C759' : '#FF3B30' }}>₪{itemProfit.toLocaleString()}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 50, background: itemProfit >= 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)', color: itemProfit >= 0 ? '#34C759' : '#FF3B30' }}>{itemPct.toFixed(1)}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Additional costs */}
            <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: '#F5F5F7', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#86868B', margin: '0 0 10px', letterSpacing: '0.04em' }}>עלויות נוספות</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#86868B', margin: '0 0 4px' }}>משלוח</p>
                        <div style={{ position: 'relative' }}>
                            <input type="number" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="0"
                                style={{ width: '100%', padding: '7px 22px 7px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box', textAlign: 'left' }} />
                            <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#86868B' }}>₪</span>
                        </div>
                    </div>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#86868B', margin: '0 0 4px' }}>אחר (תיאור)</p>
                        <input value={otherLabel} onChange={e => setOtherLabel(e.target.value)} placeholder="עמלה, אריזה..." dir="rtl"
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ gridColumn: '2', marginTop: -4 }}>
                        <div style={{ position: 'relative' }}>
                            <input type="number" value={otherAmount} onChange={e => setOtherAmount(e.target.value)} placeholder="0"
                                style={{ width: '100%', padding: '7px 22px 7px 8px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box', textAlign: 'left' }} />
                            <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#86868B' }}>₪</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '14px 16px', borderRadius: 16, border: `2px solid ${profitColor}30`, background: `${profitColor}08`, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#86868B', margin: '0 0 10px', letterSpacing: '0.04em' }}>📊 סיכום רווחיות</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[['הכנסה מהלקוח', totalRevenue, '#1D1D1F'], ['עלות ספק', -totalSupplierCost, '#FF3B30'], ['עלויות נוספות', -totalAdditional, '#FF9500']].map(([label, val, color]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6E6E73', fontWeight: 600 }}>{label}</span>
                            <span style={{ fontWeight: 800, color }}>{val >= 0 ? '' : '−'}₪{Math.abs(val).toLocaleString()}</span>
                        </div>
                    ))}
                    <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>רווח נקי</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: profitColor }}>{netProfit >= 0 ? '' : '−'}₪{Math.abs(netProfit).toLocaleString()}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 50, background: `${profitColor}18`, color: profitColor }}>{Math.abs(profitPct).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => onContinue({ costs, shipping: Number(shipping) || 0, otherLabel, otherAmount: Number(otherAmount) || 0 })} disabled={!allFilled}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: allFilled ? 'linear-gradient(135deg,#5856D6,#007AFF)' : '#AEAEB2', color: '#fff', fontSize: 14, fontWeight: 800, cursor: allFilled ? 'pointer' : 'not-allowed', fontFamily: 'Heebo,sans-serif', boxShadow: allFilled ? '0 4px 16px rgba(88,86,214,0.35)' : 'none' }}>
                ✅ המשך לאישור הזמנה לספק
            </motion.button>
            {!allFilled && <p style={{ fontSize: 11, color: '#FF9500', textAlign: 'center', margin: '8px 0 0', fontWeight: 700 }}>יש להזין מחיר ספק לכל הפריטים</p>}
        </div>
    );
}

// ── Supplier Contact Modal ────────────────────────────────────────────────────
function SupplierContactModal({ quote, supplier, onClose }) {
    const { showToast } = useAdminToast();
    const [tab, setTab] = useState('whatsapp');
    const [showPricing, setShowPricing] = useState(false);
    const [supplierPreview, setSupplierPreview]     = useState(null);
    const [supplierPreviewHtml, setSupplierPreviewHtml]       = useState('');
    const [supplierPreviewSubject, setSupplierPreviewSubject] = useState('');
    const [supplierPreviewLoading, setSupplierPreviewLoading] = useState(false);
    const [supplierPreviewSending, setSupplierPreviewSending] = useState(false);

    const openSupplierEmailPreview = async (pricingData = null) => {
        const emailTo = supplier?.agentEmail || supplier?.email;
        if (!emailTo) { showToast?.('אין כתובת מייל לספק', 'error'); return; }
        setSupplierPreview({ emailTo, pricingData });
        setSupplierPreviewHtml(''); setSupplierPreviewSubject(''); setSupplierPreviewLoading(true);
        try {
            const res = await fetch('/api/send-supplier-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote, supplier, type: 'order_confirmation', pricingData, preview: true }),
            });
            if (res.ok) { const d = await res.json(); setSupplierPreviewHtml(d.html || ''); setSupplierPreviewSubject(d.subject || ''); }
            else { showToast?.('שגיאה בטעינת תצוגה', 'error'); setSupplierPreview(null); }
        } catch { showToast?.('שגיאה', 'error'); setSupplierPreview(null); }
        finally { setSupplierPreviewLoading(false); }
    };

    const handleSupplierSend = async () => {
        setSupplierPreviewSending(true);
        try {
            const res = await fetch('/api/send-supplier-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote, supplier, type: 'order_confirmation', pricingData: supplierPreview?.pricingData }),
            });
            if (res.ok) { showToast?.('מייל נשלח לספק ✓', 'success'); setSupplierPreview(null); onClose(); }
            else showToast?.('שגיאה בשליחת מייל', 'error');
        } catch { showToast?.('שגיאה', 'error'); }
        finally { setSupplierPreviewSending(false); }
    };

    const itemsText = (quote.items || []).map(i => `• ${i.title} × ${i.qty ?? i.quantity ?? 1}`).join('\n');
    const phone = (supplier?.agentPhone || supplier?.phone || '').replace(/\D/g, '').replace(/^0/, '972');
    const email = supplier?.agentEmail || supplier?.email || '';
    const supplierName = supplier?.name || quote.supplierOrder?.supplierName || 'ספק';

    const waMsg = [
        `📦 *הזמנה ${quote.id} מ-NextClass*`,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        `שלום ${supplier?.contactPerson || supplierName},`,
        ``,
        `אנחנו מבקשים להזמין את הפריטים הבאים עבור לקוחנו:`,
        ``,
        itemsText,
        ``,
        `📍 *פרטי המשלוח:*`,
        quote.shippingDetails?.address ? `כתובת: ${quote.shippingDetails.address}, ${quote.shippingDetails.city || ''}` : '',
        quote.shippingDetails?.deliveryName ? `נמען: ${quote.shippingDetails.deliveryName}` : '',
        quote.supplierOrder?.estimatedDelivery ? `אספקה נדרשת: ${quote.supplierOrder.estimatedDelivery}` : '',
        quote.supplierOrder?.notes ? `הערות: ${quote.supplierOrder.notes}` : '',
        ``,
        `סה"כ הצעה: ₪${(quote.subtotal || 0).toLocaleString()}`,
        ``,
        `תודה רבה,`,
        `צוות NextClass | 058-585-6356`,
    ].filter(l => l !== null && l !== undefined && !(l === '' && false)).join('\n');

    const emailSubject = `הזמנה ${quote.id} — NextClass`;
    const emailBody = [
        `שלום ${supplier?.contactPerson || supplierName},`,
        ``,
        `אנו שמחים לפנות אליכם בהזמנה הבאה:`,
        ``,
        `מספר הזמנה: ${quote.id}`,
        `לקוח: ${quote.contactName || '—'} | ${quote.institution || '—'}`,
        ``,
        `פרטי ההזמנה:`,
        itemsText,
        ``,
        `סה"כ: ₪${(quote.subtotal || 0).toLocaleString()}`,
        ``,
        ...(quote.shippingDetails?.address ? [
            `פרטי משלוח:`,
            `נמען: ${quote.shippingDetails.deliveryName || '—'}`,
            `כתובת: ${quote.shippingDetails.address}, ${quote.shippingDetails.city || ''}`,
        ] : []),
        ``,
        `נשמח לאישורכם,`,
        `צוות NextClass`,
        `טל׳: 058-585-6356`,
        `מייל: nextclass.en@gmail.com`,
    ].join('\n');

    const waLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}` : '';
    const emailLink = email ? `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : '';
    const callLink = phone ? `tel:+${phone}` : '';

    const tabs = [
        { id: 'whatsapp', label: '📱 WhatsApp', color: '#25D366' },
        { id: 'email',    label: '✉️ מייל',     color: '#007AFF' },
        { id: 'phone',    label: '📞 שיחה',     color: '#34C759' },
    ];

    return (
        <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 500, borderRadius: 24, background: '#fff', boxShadow: '0 32px 80px rgba(0,0,0,0.22)', overflow: 'hidden' }}
                dir="rtl">

                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)', padding: '24px 24px 20px', position: 'relative' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, left: 14, width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏭</div>
                        <div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '0 0 3px', fontWeight: 700 }}>יצירת קשר עם ספק</p>
                            <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>{supplierName}</p>
                            {supplier?.contactPerson && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>{supplier.contactPerson}</p>}
                        </div>
                    </div>
                    {/* Order summary pill */}
                    <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 50, padding: '6px 14px' }}>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>הזמנה {quote.id}</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{(quote.items || []).length} פריטים</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>₪{(quote.subtotal || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', padding: '12px 16px 0', gap: 6 }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Heebo,sans-serif', transition: 'all 0.18s',
                                background: tab === t.id ? t.color : 'rgba(0,0,0,0.05)',
                                color: tab === t.id ? '#fff' : '#6E6E73',
                                boxShadow: tab === t.id ? `0 4px 14px ${t.color}40` : 'none',
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '16px 20px 20px' }}>
                    {tab === 'whatsapp' && (
                        <div>
                            <div style={{ borderRadius: 16, background: '#F0FBF4', border: '1px solid rgba(37,211,102,0.2)', padding: 14, marginBottom: 12, maxHeight: 220, overflowY: 'auto' }}>
                                <pre style={{ fontSize: 12, lineHeight: 1.65, color: '#1D1D1F', fontFamily: 'Heebo, sans-serif', margin: 0, whiteSpace: 'pre-wrap', direction: 'rtl', textAlign: 'right' }}>{waMsg}</pre>
                            </div>
                            {!phone && <p style={{ fontSize: 11, color: '#FF3B30', textAlign: 'right', margin: '0 0 10px', fontWeight: 700 }}>⚠️ אין מספר טלפון לספק — עדכן בניהול ספקים</p>}
                            <a href={waLink || '#'} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, background: phone ? 'linear-gradient(135deg,#25D366,#128C7E)' : '#AEAEB2', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxSizing: 'border-box', boxShadow: phone ? '0 4px 16px rgba(37,211,102,0.35)' : 'none', pointerEvents: phone ? 'auto' : 'none' }}>
                                📱 פתח ב-WhatsApp
                            </a>
                        </div>
                    )}
                    {tab === 'email' && !showPricing && (
                        <div>
                            <div style={{ borderRadius: 16, background: 'linear-gradient(135deg,#E0F7FF,#F0FBFF)', border: '1.5px solid rgba(8,145,178,0.2)', padding: 16, marginBottom: 14, textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0891B2,#0E7490)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✉️</div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>מייל הזמנה רשמי לספק</p>
                                        <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>לפני השליחה — הזן מחירי ספק וחשב רווחיות</p>
                                    </div>
                                </div>
                                {email
                                    ? <p style={{ fontSize: 11, fontWeight: 700, color: '#0891B2', margin: 0 }}>📧 אל: {email}</p>
                                    : <p style={{ fontSize: 11, color: '#FF3B30', margin: 0, fontWeight: 700 }}>⚠️ אין כתובת מייל לספק — עדכן בניהול ספקים</p>
                                }
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowPricing(true)} disabled={!email}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: email ? 'linear-gradient(135deg,#5856D6,#007AFF)' : '#AEAEB2', color: '#fff', fontSize: 14, fontWeight: 800, boxSizing: 'border-box', boxShadow: email ? '0 4px 16px rgba(88,86,214,0.35)' : 'none', cursor: email ? 'pointer' : 'not-allowed', fontFamily: 'Heebo,sans-serif' }}>
                                💰 חשב רווחיות ושלח הזמנה
                            </motion.button>
                        </div>
                    )}
                    {tab === 'email' && showPricing && (
                        <ProfitCalculatorPanel
                            quote={quote}
                            onBack={() => setShowPricing(false)}
                            onContinue={(pricingData) => { setShowPricing(false); openSupplierEmailPreview(pricingData); }}
                        />
                    )}
                    {tab === 'phone' && (
                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#34C759,#30D158)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 8px 28px rgba(52,199,89,0.35)' }}>📞</div>
                            <p style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', margin: '0 0 4px' }}>{supplier?.agentPhone || supplier?.phone || '—'}</p>
                            <p style={{ fontSize: 13, color: '#6E6E73', margin: '0 0 20px' }}>{supplier?.contactPerson || supplierName}</p>
                            <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', marginBottom: 16, textAlign: 'right' }}>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', margin: '0 0 6px' }}>זכור להזכיר בשיחה:</p>
                                <p style={{ fontSize: 12, color: '#1D1D1F', margin: 0, lineHeight: 1.6 }}>• הזמנה מספר {quote.id}<br />• {(quote.items || []).length} פריטים · ₪{(quote.subtotal || 0).toLocaleString()}<br />• לקוח: {quote.contactName || '—'}, {quote.institution || '—'}</p>
                            </div>
                            {!phone && <p style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700, marginBottom: 10 }}>⚠️ אין מספר טלפון לספק</p>}
                            <a href={callLink || '#'}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 14, background: phone ? 'linear-gradient(135deg,#34C759,#30D158)' : '#AEAEB2', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 800, boxSizing: 'border-box', boxShadow: phone ? '0 4px 16px rgba(52,199,89,0.35)' : 'none', pointerEvents: phone ? 'auto' : 'none' }}>
                                📞 התקשר עכשיו
                            </a>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>

        {/* Supplier email preview overlay */}
        <AnimatePresence>
            {supplierPreview && (
                <EmailPreviewModal
                    quote={{ ...quote, email: supplier?.agentEmail || supplier?.email }}
                    html={supplierPreviewHtml}
                    subject={supplierPreviewSubject}
                    loading={supplierPreviewLoading}
                    sending={supplierPreviewSending}
                    onClose={() => setSupplierPreview(null)}
                    onSend={handleSupplierSend}
                />
            )}
        </AnimatePresence>
        </>
    );
}

// ── Supplier transfer form ────────────────────────────────────────────────────
function SupplierTransferForm({ quote, updateQuoteFields, onUpdateStatus, showToast }) {
    const so = quote.supplierOrder || {};
    const [form, setForm] = useState({
        supplierName:      so.supplierName      || '',
        orderNumber:       so.orderNumber       || '',
        estimatedDelivery: so.estimatedDelivery || '',
        notes:             so.notes             || '',
    });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'suppliers'), orderBy('name'));
        const unsub = onSnapshot(q, snap => {
            setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});
        return unsub;
    }, []);

    useEffect(() => {
        if (so.supplierName && suppliers.length > 0) {
            const match = suppliers.find(s => s.name === so.supplierName);
            if (match) setSelectedSupplier(match);
        }
    }, [suppliers, so.supplierName]); // eslint-disable-line

    const handleSupplierSelect = (name) => {
        set('supplierName', name);
        const s = suppliers.find(sup => sup.name === name);
        setSelectedSupplier(s || null);
    };

    const handleSave = async () => {
        await updateQuoteFields(quote.id, { supplierOrder: { ...form, orderedAt: Date.now() } });
        await onUpdateStatus(quote.id, 'הועבר לספק');
        showToast('הועבר לספק בהצלחה ✓', 'success');
    };

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {so.supplierName && (
                    <div style={{ gridColumn: 'span 2', padding: '8px 12px', borderRadius: 10, background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.2)', fontSize: 12, color: '#0891B2', fontWeight: 700, textAlign: 'right' }}>
                        ✓ ספק: {so.supplierName} · הזמנה: {so.orderNumber || '—'}
                    </div>
                )}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 4, textAlign: 'right' }}>בחר ספק מהמערכת</label>
                    {suppliers.length > 0 ? (
                        <select value={form.supplierName} onChange={e => handleSupplierSelect(e.target.value)} dir="rtl"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}>
                            <option value="">— בחר ספק —</option>
                            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={form.supplierName} onChange={e => set('supplierName', e.target.value)} placeholder="שם הספק / חברת הפצה" dir="rtl"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                    )}
                </div>

                {/* Supplier contact card */}
                {selectedSupplier && (
                    <div style={{ gridColumn: 'span 2', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(8,145,178,0.2)', boxShadow: '0 4px 18px rgba(8,145,178,0.10)' }}>
                        {/* Header */}
                        <div style={{ background: 'linear-gradient(135deg,#0891B2 0%,#0E7490 100%)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏭</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>{selectedSupplier.name}</p>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '2px 0 0', fontWeight: 600 }}>
                                {selectedSupplier.contactPerson || selectedSupplier.agentName || selectedSupplier.contact || '—'}
                            </p>
                            </div>
                        </div>
                        {/* Contact fields grid */}
                        <div style={{ padding: '12px 14px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#fff' }}>
                            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.13)', gridColumn: 'span 2' }}>
                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>שם איש קשר</p>
                                <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: 0, textAlign: 'right' }}>
                                    {selectedSupplier.contactPerson || selectedSupplier.agentName || selectedSupplier.contact || '—'}
                                </p>
                            </div>
                            {(selectedSupplier.agentPhone || selectedSupplier.phone) && (
                                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>טלפון</p>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: 0, textAlign: 'right' }}>{selectedSupplier.agentPhone || selectedSupplier.phone}</p>
                                </div>
                            )}
                            {(selectedSupplier.agentEmail || selectedSupplier.email) && (
                                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.12)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>מייל</p>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', margin: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedSupplier.agentEmail || selectedSupplier.email}</p>
                                </div>
                            )}
                            {selectedSupplier.website && (
                                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(88,86,214,0.06)', border: '1px solid rgba(88,86,214,0.12)' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>אתר</p>
                                    <a href={selectedSupplier.website.startsWith('http') ? selectedSupplier.website : `https://${selectedSupplier.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 700, color: '#5856D6', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{selectedSupplier.website}</a>
                                </div>
                            )}
                            {selectedSupplier.notes && (
                                <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', gridColumn: selectedSupplier.website ? '1' : 'span 2' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>הערות</p>
                                    <p style={{ fontSize: 11, color: '#6E6E73', margin: 0, textAlign: 'right', lineHeight: 1.45 }}>{selectedSupplier.notes}</p>
                                </div>
                            )}
                        </div>
                        {/* Action buttons */}
                        <div style={{ padding: '10px 14px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#fff' }}>
                            {(selectedSupplier.agentPhone || selectedSupplier.phone) && (
                                <a href={`https://wa.me/${(selectedSupplier.agentPhone || selectedSupplier.phone || '').replace(/\D/g,'').replace(/^0/,'972')}`} target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, minWidth: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', borderRadius: 10, background: 'rgba(37,211,102,0.10)', color: '#128C7E', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                    📱 WA
                                </a>
                            )}
                            {(selectedSupplier.agentPhone || selectedSupplier.phone) && (
                                <a href={`tel:${selectedSupplier.agentPhone || selectedSupplier.phone}`}
                                    style={{ flex: 1, minWidth: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', borderRadius: 10, background: 'rgba(52,199,89,0.09)', color: '#34C759', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                    📞 שיחה
                                </a>
                            )}
                            {(selectedSupplier.agentEmail || selectedSupplier.email) && (
                                <a href={`mailto:${selectedSupplier.agentEmail || selectedSupplier.email}`}
                                    style={{ flex: 1, minWidth: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px', borderRadius: 10, background: 'rgba(0,122,255,0.09)', color: '#007AFF', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                    ✉️ מייל
                                </a>
                            )}
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowContactModal(true)}
                                style={{ flex: 2, minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: 'linear-gradient(135deg,#0891B2,#0E7490)', color: '#fff', boxShadow: '0 3px 10px rgba(8,145,178,0.25)' }}>
                                📋 תבניות הודעה
                            </motion.button>
                        </div>
                    </div>
                )}

                <PipelineField label="מספר הזמנה אצל ספק" value={form.orderNumber} onChange={v => set('orderNumber', v)} placeholder="PO-12345" />
                <PipelineField label="אספקה משוערת" type="date" value={form.estimatedDelivery} onChange={v => set('estimatedDelivery', v)} />
                <div style={{ gridColumn: 'span 2' }}>
                    <PipelineField label="הערות לספק" value={form.notes} onChange={v => set('notes', v)} placeholder="הנחיות מיוחדות..." />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StageBtn color="#0891B2" label="✓ אשר העברה לספק" onClick={handleSave} />
                    {!selectedSupplier && (
                        <StageBtn color="#25D366" label="📱 WhatsApp לספק" href={`https://wa.me/?text=${encodeURIComponent(`הזמנה ${quote.id} מ-NextClass`)}`} target="_blank" secondary />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showContactModal && (
                    <SupplierContactModal
                        quote={quote}
                        supplier={selectedSupplier}
                        onClose={() => setShowContactModal(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ── Tracking / in-transit form ────────────────────────────────────────────────
function TrackingForm({ quote, updateQuoteFields, onUpdateStatus, showToast, openEmailPreview }) {
    const ti = quote.trackingInfo || {};
    const [form, setForm] = useState({
        carrier:           ti.carrier           || '',
        trackingNumber:    ti.trackingNumber    || '',
        estimatedDelivery: ti.estimatedDelivery || quote.supplierOrder?.estimatedDelivery || '',
    });
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
    const [emailNudge, setEmailNudge] = useState(false);

    const handleSave = async () => {
        await updateQuoteFields(quote.id, { trackingInfo: { ...form, updatedAt: Date.now() } });
        await onUpdateStatus(quote.id, 'בדרך');
        showToast('מעקב עודכן, ההזמנה בדרך ✓', 'success');
        setEmailNudge(true);
    };

    const waCustomer = quote.phone ? `https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(`שלום ${quote.contactName || 'לקוח'}, ההזמנה שלך (${quote.id}) יצאה לדרך! ${form.trackingNumber ? `מספר מעקב: ${form.trackingNumber}` : ''}`)}` : '';

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PipelineField label="חברת שילוח" value={form.carrier} onChange={v => set('carrier', v)} placeholder="DHL, UPS, ישרה..." />
            <PipelineField label="מספר מעקב" value={form.trackingNumber} onChange={v => set('trackingNumber', v)} placeholder="1Z999AA..." />
            <div style={{ gridColumn: 'span 2' }}>
                <PipelineField label="תאריך אספקה צפויה" type="date" value={form.estimatedDelivery} onChange={v => set('estimatedDelivery', v)} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StageBtn color="#7C3AED" label="✓ עדכן ועבור לבדרך" onClick={handleSave} />
                {waCustomer && <StageBtn color="#25D366" label="📱 WA ללקוח" href={waCustomer} target="_blank" />}
                {quote.email && <StageBtn color="#007AFF" label="✉️ מייל עדכון ללקוח" onClick={() => openEmailPreview?.('in_transit', { ...quote, trackingInfo: form })} />}
            </div>
            {emailNudge && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ gridColumn: 'span 2', borderRadius: 12, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#5856D6' }}>🚚 שלח מייל עדכון ללקוח?</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <StageBtn color="#007AFF" label="שלח מייל ✉️" onClick={() => { openEmailPreview?.('in_transit', { ...quote, trackingInfo: form }); setEmailNudge(false); }} />
                        <StageBtn color="#AEAEB2" label="לא עכשיו" onClick={() => setEmailNudge(false)} secondary />
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ── Inline contact chips (phone + email) ─────────────────────────────────────
function ContactChips({ quote, onSwitchTab, waText }) {
    const waHref = quote.phone
        ? `https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(waText || `שלום ${quote.contactName || 'לקוח'},`)}`
        : '';
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {quote.phone && (
                <a href={waHref} target="_blank" rel="noopener noreferrer"
                    onClick={() => onSwitchTab?.('chat')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 10, background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.2)', color: '#15803D', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                    📱 {quote.phone}
                </a>
            )}
            {quote.email && (
                <a href={`mailto:${quote.email}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 10, background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.15)', color: '#007AFF', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    ✉️ {quote.email}
                </a>
            )}
        </div>
    );
}

function InventoryCheckPanel({ quote, onUpdateStatus, updateQuoteFields, showToast, onSwitchTab, openEmailPreview }) {
    const { inventory: liveProducts } = useAdminData();
    const [path, setPath] = useState(null); // null | 'instock' | 'supplier'
    const [suppliers, setSuppliers] = useState([]);
    const [selSupplierName, setSelSupplierName] = useState('');
    const [selSupplier, setSelSupplier] = useState(null);
    const [suppNote, setSuppNote] = useState('');
    const [suppDelivery, setSuppDelivery] = useState('');
    const [prevOpen, setPrevOpen] = useState(false);
    const [prevHtml, setPrevHtml] = useState('');
    const [prevSubject, setPrevSubject] = useState('');
    const [prevEditSubject, setPrevEditSubject] = useState('');
    const [prevCustomNote, setPrevCustomNote] = useState('');
    const [prevNoteOpen, setPrevNoteOpen] = useState(false);
    const [prevLoading, setPrevLoading] = useState(false);
    const [prevSending, setPrevSending] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'suppliers'), orderBy('name'));
        return onSnapshot(q, snap => setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    useEffect(() => {
        setSelSupplier(selSupplierName ? (suppliers.find(s => s.name === selSupplierName) || null) : null);
    }, [selSupplierName, suppliers]);

    const items = quote.items || [];
    const findInList = (list, item) => {
        const iTitle = (item.title || item.name || '').toLowerCase();
        return list.find(p => {
            if (String(p.id) === String(item.id)) return true;
            const pTitle = (p.title || p.name || '').toLowerCase();
            if (pTitle.includes(iTitle) || iTitle.includes(pTitle)) return true;
            if (iTitle.includes(pTitle.slice(0, 8))) return true;
            const pWords = pTitle.split(/\s+/).filter(w => w.length > 2);
            const iWords = iTitle.split(/\s+/).filter(w => w.length > 2);
            return pWords.filter(w => iWords.includes(w)).length >= 2;
        });
    };
    const itemsWithStock = items.map(item => {
        const live = liveProducts?.length ? findInList(liveProducts, item) : null;
        const fallback = live ?? findInList(initialProducts, item);
        const product = live ?? fallback;
        return { ...item, stock: product?.stock ?? -1, threshold: product?.threshold ?? 5 };
    });

    const stockStatus = (stock, qty) => {
        if (stock === -1) return { color: '#86868B', label: 'לא ידוע', bg: 'rgba(142,142,147,0.10)' };
        if (stock === 0)  return { color: '#FF3B30', label: 'אזל',    bg: 'rgba(255,59,48,0.10)' };
        if (stock < qty)  return { color: '#FF9500', label: `${stock} יח׳`, bg: 'rgba(255,149,0,0.10)' };
        return { color: '#34C759', label: `${stock} יח׳`, bg: 'rgba(52,199,89,0.10)' };
    };

    const openSupplierPreview = async () => {
        const emailTo = selSupplier?.agentEmail || selSupplier?.email;
        if (!emailTo) { showToast('אין כתובת מייל לספק', 'error'); return; }
        setPrevOpen(true); setPrevHtml(''); setPrevSubject(''); setPrevEditSubject(''); setPrevCustomNote(''); setPrevNoteOpen(false); setPrevLoading(true);
        try {
            const res = await fetch('/api/send-supplier-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote: { ...quote, supplierOrder: { ...(quote.supplierOrder || {}), notes: suppNote, estimatedDelivery: suppDelivery, supplierName: selSupplierName } }, supplier: selSupplier, preview: true }),
            });
            if (res.ok) { const d = await res.json(); setPrevHtml(d.html || ''); setPrevSubject(d.subject || ''); setPrevEditSubject(d.subject || ''); }
            else { showToast('שגיאה בטעינת תצוגה', 'error'); setPrevOpen(false); }
        } catch { showToast('שגיאה', 'error'); setPrevOpen(false); }
        finally { setPrevLoading(false); }
    };

    const handleSupplierSend = async () => {
        setPrevSending(true);
        try {
            const res = await fetch('/api/send-supplier-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote: { ...quote, supplierOrder: { ...(quote.supplierOrder || {}), notes: suppNote, estimatedDelivery: suppDelivery, supplierName: selSupplierName } }, supplier: selSupplier, customNote: prevCustomNote || null, subject: prevEditSubject !== prevSubject ? prevEditSubject : null }),
            });
            if (res.ok) {
                showToast('מייל נשלח לספק ✓', 'success');
                setPrevOpen(false);
                await updateQuoteFields(quote.id, { supplierOrder: { supplierName: selSupplierName, notes: suppNote, estimatedDelivery: suppDelivery, orderedAt: Date.now() } });
                onUpdateStatus(quote.id, 'הועבר לספק');
                showToast('עבר ל"הועבר לספק"', 'success');
            } else showToast('שגיאה בשליחת מייל', 'error');
        } catch { showToast('שגיאה', 'error'); }
        finally { setPrevSending(false); }
    };

    if (path === 'instock') return (
        <StagePanel color="#34C759" icon={<Package size={18} color="#fff" />} title="מלאי זמין — בנה הצעת מחיר" desc="ערוך מחירים ושלח הצעה מותאמת ללקוח" onSwitchTab={onSwitchTab} items={quote.items}>
            <QuoteBuilderPanel quote={quote} updateQuoteFields={updateQuoteFields} onUpdateStatus={onUpdateStatus} showToast={showToast} onSwitchTab={onSwitchTab} openEmailPreview={openEmailPreview} />
            <button type="button" onClick={() => setPath(null)} style={{ fontSize: 10, color: '#86868B', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'Heebo,sans-serif' }}>← חזור לבדיקת מלאי</button>
        </StagePanel>
    );

    return (
        <>
        <StagePanel color="#F59E0B" icon={<Package size={18} color="#fff" />} title="בדיקת מלאי" desc="בדוק זמינות מוצרים לפני המשך הטיפול" onSwitchTab={onSwitchTab} items={quote.items}>
            {itemsWithStock.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {itemsWithStock.map((item, idx) => {
                        const qty = item.qty ?? item.quantity ?? 1;
                        const st = stockStatus(item.stock, qty);
                        const barPct = item.stock === -1 ? 0 : Math.min(100, (item.stock / Math.max(item.stock, qty, 1)) * 100);
                        return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.85)', border: `1px solid ${st.bg}`, direction: 'rtl' }}>
                                {item.image && <img src={item.image} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.07)' }} onError={e => e.target.style.display='none'} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.name || '—'}</p>
                                    <p style={{ fontSize: 10, color: '#86868B', margin: '2px 0 0' }}>נדרש: {qty} יח׳</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {item.stock !== -1 && (
                                        <div style={{ height: 4, width: 44, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: 2, background: st.color, width: `${barPct}%`, transition: 'width 0.6s ease' }} />
                                        </div>
                                    )}
                                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {path === null && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StageBtn color="#34C759" label="✅ יש במלאי — בנה הצעה" onClick={() => setPath('instock')} />
                    <StageBtn color="#F59E0B" label="📦 אין במלאי — פנה לספק" onClick={() => setPath('supplier')} secondary />
                </div>
            )}

            {path === 'supplier' && (
                <div style={{ marginTop: 8, padding: '14px', borderRadius: 14, background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.15)', direction: 'rtl' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#0891B2', margin: '0 0 12px', letterSpacing: '0.06em' }}>📦 פנייה לספק</p>
                    <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: '#86868B', display: 'block', marginBottom: 4 }}>בחר ספק</label>
                        <select value={selSupplierName} onChange={e => setSelSupplierName(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', direction: 'rtl', background: '#fff', cursor: 'pointer' }}>
                            <option value="">— בחר ספק —</option>
                            {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    {selSupplier && (
                        <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.15)', direction: 'rtl' }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: '#0891B2', margin: '0 0 8px', letterSpacing: '0.05em' }}>👤 איש קשר</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                {selSupplier.contactPerson && <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', gridColumn: '1/-1' }}>{selSupplier.contactPerson}</div>}
                                {selSupplier.agentName && selSupplier.agentName !== selSupplier.contactPerson && <div style={{ fontSize: 11, color: '#6E6E73' }}>סוכן: {selSupplier.agentName}</div>}
                                {(selSupplier.agentEmail || selSupplier.email) && <a href={`mailto:${selSupplier.agentEmail || selSupplier.email}`} style={{ fontSize: 11, color: '#0891B2', textDecoration: 'none', fontWeight: 600 }}>✉️ {selSupplier.agentEmail || selSupplier.email}</a>}
                                {(selSupplier.agentPhone || selSupplier.phone) && <a href={`tel:${selSupplier.agentPhone || selSupplier.phone}`} style={{ fontSize: 11, color: '#0891B2', textDecoration: 'none', fontWeight: 600 }}>📞 {selSupplier.agentPhone || selSupplier.phone}</a>}
                                {selSupplier.website && <a href={selSupplier.website} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#5856D6', textDecoration: 'none', fontWeight: 600, gridColumn: '1/-1' }}>🌐 {selSupplier.website}</a>}
                                {selSupplier.address && <div style={{ fontSize: 11, color: '#6E6E73', gridColumn: '1/-1' }}>📍 {selSupplier.address}{selSupplier.city ? `, ${selSupplier.city}` : ''}</div>}
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: '#86868B', display: 'block', marginBottom: 4 }}>תאריך אספקה נדרש</label>
                            <input type="date" value={suppDelivery} onChange={e => setSuppDelivery(e.target.value)}
                                dir="ltr" style={{ width: '100%', padding: '7px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: '#86868B', display: 'block', marginBottom: 4 }}>הערות לספק</label>
                            <input value={suppNote} onChange={e => setSuppNote(e.target.value)}
                                style={{ width: '100%', padding: '7px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'Heebo,sans-serif', direction: 'rtl', boxSizing: 'border-box' }} placeholder="הערה..." />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <StageBtn color="#0891B2" label="✉️ תצוגה ושליחה לספק" onClick={openSupplierPreview} disabled={!selSupplierName} />
                        <button type="button" onClick={() => setPath(null)} style={{ fontSize: 11, fontWeight: 700, color: '#86868B', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>← חזור</button>
                    </div>
                </div>
            )}
        </StagePanel>

        {prevOpen && createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                onClick={e => e.target === e.currentTarget && setPrevOpen(false)}>
                <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(135deg,#E8F8FF,#F0FAFF)' }} dir="rtl">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <p style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>✉️ תצוגה מקדימה — מייל לספק</p>
                            <button onClick={() => setPrevOpen(false)} style={{ border: 'none', background: 'rgba(0,0,0,0.07)', borderRadius: 99, width: 30, height: 30, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>✕</button>
                        </div>
                        {selSupplier && <p style={{ fontSize: 10, color: '#AEAEB2', margin: '0 0 8px' }}>אל: {selSupplier.agentEmail || selSupplier.email}</p>}
                        <input value={prevEditSubject} onChange={e => setPrevEditSubject(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid rgba(8,145,178,0.3)', fontSize: 12, fontFamily: 'Heebo,sans-serif', direction: 'rtl', boxSizing: 'border-box', fontWeight: 600, background: 'rgba(255,255,255,0.8)' }} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, background: '#F5F5F7' }}>
                        {prevLoading
                            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 340 }}><div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #0891B2', borderTopColor: 'transparent', animation: 'emailSpin 0.75s linear infinite' }} /></div>
                            : <iframe srcDoc={prevHtml} style={{ width: '100%', height: 380, border: 'none', display: 'block' }} sandbox="allow-same-origin" />
                        }
                    </div>
                    <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', background: '#FAFAFA' }} dir="rtl">
                        <button type="button" onClick={() => setPrevNoteOpen(o => !o)}
                            style={{ fontSize: 11, fontWeight: 700, color: '#FF9500', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'Heebo,sans-serif' }}>
                            ✏️ {prevNoteOpen ? 'הסתר הערה' : 'הוסף הערה אישית לספק'}
                        </button>
                        {prevNoteOpen && (
                            <textarea value={prevCustomNote} onChange={e => setPrevCustomNote(e.target.value)} rows={3} dir="rtl"
                                placeholder="הערה שתופיע בגוף המייל לספק..."
                                style={{ width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(255,149,0,0.35)', fontSize: 12, fontFamily: 'Heebo,sans-serif', resize: 'vertical', boxSizing: 'border-box', background: '#FFFAF5' }} />
                        )}
                    </div>
                    <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#fff' }} dir="rtl">
                        <button onClick={() => setPrevOpen(false)} style={{ padding: '10px 22px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, fontWeight: 800, color: '#1D1D1F', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>ביטול</button>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSupplierSend} disabled={prevLoading || prevSending}
                            style={{ padding: '10px 26px', borderRadius: 12, border: 'none', background: prevLoading || prevSending ? '#AEAEB2' : 'linear-gradient(135deg,#0891B2,#0284C7)', fontSize: 13, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 4px 14px rgba(8,145,178,0.35)' }}>
                            {prevSending ? '⏳ שולח...' : '✉️ שלח לספק'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>,
            document.body
        )}
        </>
    );
}

// ── Main stage action panel ───────────────────────────────────────────────────
function StageActionPanel({ quote, onUpdateStatus, updateQuoteFields, showToast, navigate, onSwitchTab, openEmailPreview }) {
    const { status } = quote;
    const emailBtn = (type, label) => quote.email
        ? <StageBtn color="#007AFF" label={`✉️ ${label}`} onClick={() => openEmailPreview(type, quote)} secondary />
        : null;

    if (status === 'חדש') return (
        <StagePanel color="#FF3B30" icon={<Bell size={18} color="#fff" />} title="בקשה חדשה הגיעה!" desc="מייל אוטומטי נשלח ללקוח — צור קשר ישיר להתחיל" onSwitchTab={onSwitchTab} items={quote.items}>
            <ContactChips quote={quote} onSwitchTab={onSwitchTab}
                waText={`שלום ${quote.contactName || 'לקוח'}, קיבלנו את בקשת הצעת המחיר שלך (${quote.id}). אנחנו בודקים ונחזור אליך בהקדם.`} />
            <StageBtn color="#FF3B30" label="📞 יצרתי קשר — המשך לבדיקת מלאי" onClick={() => { onUpdateStatus(quote.id, 'ביצירת קשר'); showToast('עבר לבדיקת מלאי', 'success'); }} />
        </StagePanel>
    );

    if (status === 'ביצירת קשר') return (
        <div>
            <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }} dir="rtl">
                <p style={{ fontSize: 11, fontWeight: 800, color: '#FF9500', margin: '0 0 8px' }}>📞 צור קשר + בדוק מלאי</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ margin: 0 }}>
                        <ContactChips quote={quote} onSwitchTab={onSwitchTab}
                            waText={`שלום ${quote.contactName || 'לקוח'}, אני בודק את הבקשה שלך (${quote.id}) ואחזור אליך בקרוב עם הצעת מחיר.`} />
                    </div>
                    {emailBtn('initial_contact', 'מייל — בטיפול')}
                </div>
            </div>
            <InventoryCheckPanel quote={quote} onUpdateStatus={onUpdateStatus} updateQuoteFields={updateQuoteFields} showToast={showToast} onSwitchTab={onSwitchTab} openEmailPreview={openEmailPreview} />
        </div>
    );

    if (status === 'בדיקת מלאי') return (
        <InventoryCheckPanel quote={quote} onUpdateStatus={onUpdateStatus} updateQuoteFields={updateQuoteFields} showToast={showToast} onSwitchTab={onSwitchTab} openEmailPreview={openEmailPreview} />
    );

    if (status === 'הוצע מחיר' || status === 'במשא ומתן') {
        const daysSinceSent = quote.quoteSentAt ? Math.floor((Date.now() - quote.quoteSentAt) / 86400000) : null;
        return (
            <StagePanel color="#007AFF" icon={<Send size={18} color="#fff" />}
                title="הצעה נשלחה — ממתין לאישור הלקוח"
                desc={`נשלחה ${quote.quoteSentAt ? new Date(quote.quoteSentAt).toLocaleDateString('he-IL') : (quote.date || '')} · הצעה פתוחה`}
                onSwitchTab={onSwitchTab} items={quote.items}>
                {daysSinceSent >= 3 && (
                    <div style={{ marginBottom: 10, padding: '7px 12px', borderRadius: 10, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', fontSize: 12, fontWeight: 700, color: '#FF3B30', textAlign: 'right' }}>
                        ⚠️ לא נשמע מהלקוח כבר {daysSinceSent} ימים — שלח תזכורת!
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StageBtn color="#007AFF" label="✅ הלקוח אישר — קדימה" onClick={() => { onUpdateStatus(quote.id, 'ממתין לאישור'); showToast('עבר ל"ממתין לאישור"', 'success'); }} />
                    {quote.phone && <StageBtn color="#25D366" label="📱 תזכורת WhatsApp"
                        href={`https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(`שלום ${quote.contactName || ''}, רציתי לבדוק שקיבלת את הצעת המחיר שלנו (${quote.id}). האם יש שאלות?`)}`}
                        target="_blank" secondary />}
                    {emailBtn('reminder', 'תזכורת — מחיר ממתין')}
                    {emailBtn('quote_sent', 'שלח הצעה מחדש')}
                </div>
            </StagePanel>
        );
    }

    if (status === 'ממתין לאישור') return (
        <StagePanel color="#5856D6" icon={<FileText size={18} color="#fff" />} title="הלקוח אישר — הזן פרטי משלוח" desc="מלא פרטי אספקה ואשר כדי לסגור את העסקה" onSwitchTab={onSwitchTab} items={quote.items}>
            <ShippingForm quote={quote} updateQuoteFields={updateQuoteFields} onUpdateStatus={onUpdateStatus} showToast={showToast} />
            <div style={{ marginTop: 8 }}>{emailBtn('pending_approval', 'בקשת פרטי משלוח מהלקוח')}</div>
        </StagePanel>
    );

    if (status === 'נסגר') return (
        <StagePanel color="#34C759" icon={<CheckCircle2 size={18} color="#fff" />} title="עסקה סגורה — שלח אישור רשמי + העבר לספק" desc="הזן פרטי ספק ושלח ללקוח אישור כתוב" onSwitchTab={onSwitchTab} items={quote.items}>
            <SupplierTransferForm quote={quote} updateQuoteFields={updateQuoteFields} onUpdateStatus={onUpdateStatus} showToast={showToast} />
            <div style={{ marginTop: 8 }}>{emailBtn('confirmed', 'אישור הזמנה רשמי ללקוח')}</div>
        </StagePanel>
    );

    if (status === 'הועבר לספק') return (
        <StagePanel color="#0891B2" icon={<Truck size={18} color="#fff" />} title="אצל הספק — עדכן מספר מעקב" desc="הזן פרטי מעקב ושלח ללקוח עדכון ETA" onSwitchTab={onSwitchTab} items={quote.items}>
            <TrackingForm quote={quote} updateQuoteFields={updateQuoteFields} onUpdateStatus={onUpdateStatus} showToast={showToast} openEmailPreview={openEmailPreview} />
            <div style={{ marginTop: 8 }}>{emailBtn('processing', 'עדכון ללקוח — ההזמנה אצל הספק')}</div>
        </StagePanel>
    );

    if (status === 'בדרך') {
        const info = quote.trackingInfo || {};
        const daysUntilDelivery = info.estimatedDelivery
            ? Math.ceil((new Date(info.estimatedDelivery) - Date.now()) / 86400000)
            : null;
        const deliveryLabel = daysUntilDelivery === null ? null
            : daysUntilDelivery > 0 ? `אספקה עוד ${daysUntilDelivery} יום`
            : daysUntilDelivery === 0 ? '📦 מגיע היום!'
            : `⚠️ עיכוב של ${Math.abs(daysUntilDelivery)} ימים`;
        const itemsList2 = (quote.items || []).map(it => `• ${it.title} ×${it.qty ?? it.quantity ?? 1}`).join('\n');
        const msg = [
            `🚚 עדכון משלוח — הזמנה ${quote.id}`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            `שלום ${quote.contactName || 'לקוח'},`,
            ``,
            `ההזמנה שלך בדרך אליך:`,
            itemsList2,
            ``,
            info.trackingNumber ? `🔍 מספר מעקב: ${info.trackingNumber}` : '',
            info.carrier        ? `🚚 חברת שילוח: ${info.carrier}` : '',
            info.estimatedDelivery ? `📅 אספקה צפויה: ${info.estimatedDelivery}` : '',
            ``,
            `לשאלות: 058-585-6356 | צוות NextClass`,
        ].filter(l => l !== '').join('\n');
        const waC = quote.phone ? `https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(msg)}` : '';
        return (
            <StagePanel color="#7C3AED" icon="🚚" title="ההזמנה בדרך!" desc={info.trackingNumber ? `מעקב: ${info.trackingNumber}${info.carrier ? ` · ${info.carrier}` : ''}` : 'המוצרים בדרך ללקוח'} onSwitchTab={onSwitchTab} items={quote.items}>
                {deliveryLabel && (
                    <div style={{ padding: '7px 12px', borderRadius: 10, background: daysUntilDelivery < 0 ? 'rgba(255,59,48,0.08)' : 'rgba(124,58,237,0.09)', border: `1px solid ${daysUntilDelivery < 0 ? 'rgba(255,59,48,0.2)' : 'rgba(124,58,237,0.18)'}`, fontSize: 12, fontWeight: 700, color: daysUntilDelivery < 0 ? '#FF3B30' : '#7C3AED', textAlign: 'right', marginBottom: 10 }}>
                        📅 {deliveryLabel}
                    </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StageBtn color="#1DB954" label="🎉 סמן כסופק" onClick={() => { onUpdateStatus(quote.id, 'סופק'); showToast('סופק! ✓', 'success'); }} />
                    {waC && <StageBtn color="#25D366" label="📱 עדכן לקוח WA" href={waC} target="_blank" secondary />}
                    {emailBtn('in_transit', 'עדכון משלוח + מעקב ללקוח')}
                </div>
            </StagePanel>
        );
    }

    if (status === 'סופק') return (
        <StagePanel color="#1DB954" icon="🎉" title="סופק בהצלחה!" desc="מלאי, מכירות ורווח עודכנו אוטומטית" items={quote.items}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#6E6E73', textAlign: 'right', flex: 1 }}>
                    סה"כ עסקה: ₪{(quote.subtotal || 0).toLocaleString()}
                    {quote.supplierOrder?.supplierName ? ` · ספק: ${quote.supplierOrder.supplierName}` : ''}
                </div>
                {emailBtn('delivered', 'הגיע — שלח תודה + בקש משוב')}
            </div>
        </StagePanel>
    );

    return null;
}

// ─── Kanban View ─────────────────────────────────────────────────────────────
// ─── Customer 360 Panel ───────────────────────────────────────────────────────
function Customer360Panel({ quote, allQuotes, onOpen, navigate }) {
    const email = quote.email || '';
    const phone = quote.phone || '';
    const related = useMemo(() => allQuotes.filter(q =>
        q.id !== quote.id &&
        ((email && (q.email === email || q.contactEmail === email)) ||
         (phone && (q.phone === phone)))
    ).sort((a, b) => b.dateTs - a.dateTs), [allQuotes, quote, email, phone]);

    const ltv = useMemo(() => related.reduce((s, q) => {
        const total = q.subtotal || (q.items || []).reduce((t, i) => t + ((Number(i.salePrice) || Number(i.price) || 0) * (Number(i.qty) || 1)), 0);
        return s + total;
    }, 0), [related]);

    const firstTs = useMemo(() => {
        const all = [quote, ...related];
        return all.reduce((min, q) => Math.min(min, q.dateTs || Date.now()), Date.now());
    }, [quote, related]);

    const daysSinceFirst = Math.floor((Date.now() - firstTs) / 86400000);
    const closedDeals    = related.filter(q => ['נסגר', 'סופק'].includes(q.status)).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} dir="rtl">
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[
                    { label: 'LTV ₪', value: ltv > 0 ? `₪${ltv.toLocaleString()}` : '—', color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
                    { label: 'ימים לקוח', value: daysSinceFirst, color: '#007AFF', bg: 'rgba(0,122,255,0.08)' },
                    { label: 'עסקאות', value: closedDeals, color: '#5856D6', bg: 'rgba(88,86,214,0.08)' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '12px 10px', borderRadius: 14, background: s.bg, textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
                        <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '3px 0 0', letterSpacing: '0.08em' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Contact info */}
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.07)' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', margin: '0 0 8px' }}>פרטי לקוח</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                        ['שם', quote.contactName],
                        ['מייל', quote.email],
                        ['טלפון', quote.phone],
                        ['מוסד', quote.institution],
                        ['תפקיד', quote.contactRole],
                    ].filter(([,v]) => v).map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F' }}>{v}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em' }}>{l}</span>
                        </div>
                    ))}
                </div>
                {quote.email && (
                    <motion.button whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/admin/users?email=${encodeURIComponent(quote.email)}`)}
                        style={{ marginTop: 10, width: '100%', padding: '8px', borderRadius: 10, border: '1px solid rgba(0,122,255,0.22)', background: 'rgba(0,122,255,0.06)', color: '#007AFF', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                        פתח פרופיל משתמש →
                    </motion.button>
                )}
            </div>

            {/* Historical quotes */}
            <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', margin: '0 0 8px' }}>
                    היסטוריית הצעות ({related.length})
                </p>
                {related.length === 0 ? (
                    <div style={{ padding: '16px', borderRadius: 14, border: '1.5px dashed rgba(0,0,0,0.08)', textAlign: 'center', color: '#AEAEB2', fontSize: 12, fontWeight: 700 }}>
                        אין הצעות קודמות
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {related.map(q => {
                            const color = QUOTE_STATUS_COLORS[q.status] || '#007AFF';
                            const total = q.subtotal || (q.items || []).reduce((t, i) => t + ((Number(i.salePrice) || Number(i.price) || 0) * (Number(i.qty) || 1)), 0);
                            return (
                                <motion.div key={q.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                    onClick={() => onOpen(q)}
                                    style={{ padding: '10px 12px', borderRadius: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {q.items?.map(i => i.title).join(', ') || q.id}
                                        </p>
                                        <p style={{ fontSize: 10, color: '#86868B', margin: '2px 0 0' }}>{q.date} · {q.id}</p>
                                    </div>
                                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                                        {total > 0 && <p style={{ fontSize: 12, fontWeight: 800, color, margin: 0 }}>₪{total.toLocaleString()}</p>}
                                        <p style={{ fontSize: 9, fontWeight: 700, color, margin: '2px 0 0', background: `${color}12`, padding: '1px 6px', borderRadius: 99 }}>{q.status}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Quote Versions Panel ─────────────────────────────────────────────────────
function QuoteVersionsPanel({ quote, updateQuoteFields, showToast }) {
    const versions = quote.versions || [];
    const [diffIdx, setDiffIdx] = useState(null);

    const currentSnapshot = {
        savedAt: Date.now(),
        savedAtStr: 'נוכחי',
        versionLabel: 'גרסה נוכחית',
        items: quote.items || [],
        subtotal: quote.subtotal || 0,
        notes: quote.notes || '',
        status: quote.status,
    };

    const allVersions = [...versions, currentSnapshot];

    const saveManualVersion = async () => {
        const snapshot = {
            savedAt: Date.now(),
            savedAtStr: new Date().toLocaleString('he-IL'),
            status: quote.status,
            items: quote.items || [],
            subtotal: quote.subtotal || 0,
            notes: quote.notes || '',
            versionLabel: `גרסה ${versions.length + 1} (ידנית)`,
        };
        await updateQuoteFields(quote.id, { versions: [...versions, snapshot] });
        showToast('גרסה נשמרה', 'success');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', margin: 0 }}>
                    {allVersions.length} גרסאות
                </p>
                <motion.button whileTap={{ scale: 0.96 }} onClick={saveManualVersion}
                    style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(88,86,214,0.3)', background: 'rgba(88,86,214,0.07)', color: '#5856D6', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                    + שמור גרסה עכשיו
                </motion.button>
            </div>

            {allVersions.length === 1 ? (
                <div style={{ padding: '20px', borderRadius: 14, border: '1.5px dashed rgba(0,0,0,0.08)', textAlign: 'center', color: '#AEAEB2', fontSize: 12, fontWeight: 700 }}>
                    <p style={{ margin: '0 0 6px' }}>אין גרסאות שמורות עדיין</p>
                    <p style={{ margin: 0, fontSize: 10 }}>גרסה נשמרת אוטומטית בכל שליחת הצעת מחיר</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allVersions.map((v, i) => {
                        const isCurrent = i === allVersions.length - 1;
                        const prevV = i > 0 ? allVersions[i - 1] : null;
                        // Compute diff: items added/removed/changed
                        const diffItems = prevV ? (() => {
                            const changes = [];
                            const pMap = Object.fromEntries((prevV.items || []).map(it => [it.id, it]));
                            const cMap = Object.fromEntries((v.items || []).map(it => [it.id, it]));
                            Object.keys(cMap).forEach(id => {
                                if (!pMap[id]) changes.push({ type: 'added', item: cMap[id] });
                                else if (cMap[id].qty !== pMap[id].qty || cMap[id].salePrice !== pMap[id].salePrice) changes.push({ type: 'changed', item: cMap[id], prev: pMap[id] });
                            });
                            Object.keys(pMap).forEach(id => { if (!cMap[id]) changes.push({ type: 'removed', item: pMap[id] }); });
                            return changes;
                        })() : [];

                        const deltaPrice = prevV ? (v.subtotal || 0) - (prevV.subtotal || 0) : 0;

                        return (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                    borderRadius: 14, overflow: 'hidden',
                                    border: isCurrent ? '1.5px solid rgba(0,122,255,0.3)' : '1px solid rgba(0,0,0,0.07)',
                                    background: isCurrent ? 'rgba(0,122,255,0.04)' : '#fff',
                                }}>
                                {/* Version header */}
                                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: diffIdx === i ? 'default' : 'pointer' }}
                                    onClick={() => setDiffIdx(diffIdx === i ? null : i)}>
                                    <div style={{ display: 'flex', items: 'center', gap: 8 }}>
                                        {deltaPrice !== 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: deltaPrice > 0 ? '#34C759' : '#FF3B30', background: deltaPrice > 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)', padding: '1px 7px', borderRadius: 99, marginLeft: 6 }}>
                                                {deltaPrice > 0 ? '+' : ''}₪{deltaPrice.toLocaleString()}
                                            </span>
                                        )}
                                        {diffItems.length > 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#FF9500', background: 'rgba(255,149,0,0.1)', padding: '1px 7px', borderRadius: 99 }}>
                                                {diffItems.length} שינויים
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: isCurrent ? '#007AFF' : '#1D1D1F', margin: 0 }}>{v.versionLabel}</p>
                                        <p style={{ fontSize: 10, color: '#AEAEB2', margin: '2px 0 0' }}>{v.savedAtStr} · ₪{(v.subtotal || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Diff expansion */}
                                <AnimatePresence>
                                    {diffIdx === i && diffItems.length > 0 && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                {diffItems.map((d, di) => (
                                                    <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10, background: d.type === 'added' ? 'rgba(52,199,89,0.07)' : d.type === 'removed' ? 'rgba(255,59,48,0.07)' : 'rgba(255,149,0,0.07)' }}>
                                                        <span style={{ fontSize: 13 }}>{d.type === 'added' ? '✚' : d.type === 'removed' ? '✕' : '↻'}</span>
                                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                                            <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>{d.item.title}</p>
                                                            {d.type === 'changed' && <p style={{ fontSize: 10, color: '#86868B', margin: '2px 0 0' }}>
                                                                כמות: {d.prev.qty}→{d.item.qty} · מחיר: {d.prev.salePrice}→{d.item.salePrice}
                                                            </p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function KanbanView({ quotes, onUpdateStatus, onOpen, showToast }) {
    const KANBAN_STAGES = ['חדש', 'ביצירת קשר', 'הוצע מחיר', 'ממתין לאישור', 'נסגר', 'הועבר לספק', 'בדרך', 'סופק'];

    return (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12, minHeight: 400 }} dir="rtl">
            {KANBAN_STAGES.map(stage => {
                const stageQuotes = quotes.filter(q => q.status === stage);
                const color = QUOTE_STATUS_COLORS[stage] || '#007AFF';
                return (
                    <div key={stage} style={{ minWidth: 200, maxWidth: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ padding: '8px 12px', borderRadius: 12, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: color, letterSpacing: '0.04em' }}>{stage}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 99, background: `${color}20`, color: color }}>{stageQuotes.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <AnimatePresence>
                            {stageQuotes.map((q, i) => (
                                <motion.div key={q.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.03 }}
                                    onClick={() => onOpen(q)}
                                    style={{ borderRadius: 14, background: '#fff', border: `1px solid rgba(0,0,0,0.06)`, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '10px 12px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}80)` }} />
                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#1D1D1F', margin: '4px 0 2px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.contactName || q.institution || '—'}</p>
                                    {q.institution && <p style={{ fontSize: 10, color: '#86868B', margin: '0 0 6px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.institution}</p>}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 10, color: '#86868B', fontWeight: 600 }}>{q.id}</span>
                                        {q.subtotal > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: color }}>₪{q.subtotal.toLocaleString()}</span>}
                                    </div>
                                    {q.unreadAdmin && (
                                        <div style={{ position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: '50%', background: '#34C759', border: '1.5px solid #fff' }} />
                                    )}
                                    {QUOTE_STATUS_FLOW.indexOf(stage) < QUOTE_STATUS_FLOW.length - 1 && (
                                        <motion.button whileTap={{ scale: 0.9 }}
                                            onClick={e => { e.stopPropagation(); const next = QUOTE_STATUS_FLOW[QUOTE_STATUS_FLOW.indexOf(stage) + 1]; onUpdateStatus(q.id, next); showToast(`עבר ל"${next}"`, 'success'); }}
                                            style={{ width: '100%', marginTop: 8, padding: '5px', borderRadius: 8, border: `1px solid ${color}30`, background: `${color}08`, color: color, fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                            → {QUOTE_STATUS_FLOW[QUOTE_STATUS_FLOW.indexOf(stage) + 1]}
                                        </motion.button>
                                    )}
                                </motion.div>
                            ))}
                            </AnimatePresence>
                            {stageQuotes.length === 0 && (
                                <div style={{ padding: '16px 12px', borderRadius: 12, border: '1.5px dashed rgba(0,0,0,0.08)', textAlign: 'center', color: '#AEAEB2', fontSize: 11 }}>ריק</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ quotes }) {
    const navigate = useNavigate();
    const events = useMemo(() => {
        const items = [];
        quotes.forEach(q => {
            if (q.history) {
                q.history.forEach(h => {
                    if (h.ts) items.push({ ts: h.ts, quoteId: q.id, contact: q.contactName || q.institution, text: h.action || h.status, emoji: h.emoji || '📌' });
                });
            }
            if (q.dateTs) items.push({ ts: q.dateTs, quoteId: q.id, contact: q.contactName || q.institution, text: 'הצעה חדשה התקבלה', emoji: '🆕' });
        });
        return items.sort((a, b) => b.ts - a.ts).slice(0, 12);
    }, [quotes]);

    if (events.length === 0) return null;

    const fmtTime = (ts) => {
        const d = Math.floor((Date.now() - ts) / 60000);
        if (d < 60) return `לפני ${d} דק׳`;
        if (d < 1440) return `לפני ${Math.floor(d/60)} ש׳`;
        return `לפני ${Math.floor(d/1440)} י׳`;
    };

    return (
        <div style={{ borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', background: '#fff', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} dir="rtl">
                <span style={{ fontSize: 11, fontWeight: 800, color: '#86868B', letterSpacing: '0.08em' }}>פעילות אחרונה</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', animation: 'ppulse 2s infinite' }} />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {events.map((ev, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px', borderBottom: i < events.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', cursor: 'pointer' }}
                        dir="rtl" onClick={() => navigate(`/admin/orders?quoteId=${ev.quoteId}`)}>
                        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{ev.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.text}</p>
                            <p style={{ fontSize: 10, color: '#86868B', margin: '1px 0 0' }}>{ev.contact} · {ev.quoteId}</p>
                        </div>
                        <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>{fmtTime(ev.ts)}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Reminder Modal ───────────────────────────────────────────────────────────
function ReminderModal({ quote, onClose, onSave }) {
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');
    const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    const handleSave = () => {
        if (!date) return;
        onSave(quote.id, { reminderAt: new Date(date).getTime(), reminderNote: note });
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose} dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(135deg,rgba(255,149,0,0.08),rgba(255,255,255,0.95))' }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1F', margin: '0 0 2px' }}>⏰ קבע תזכורת</p>
                    <p style={{ fontSize: 11, color: '#86868B', margin: 0 }}>{quote.contactName} · {quote.id}</p>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 5 }}>תאריך תזכורת</label>
                        <input type="date" value={date} min={minDateStr} onChange={e => setDate(e.target.value)} dir="ltr"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 5 }}>הערה לתזכורת</label>
                        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="לדוגמה: לבדוק אם אישר הצעה" dir="rtl"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.11)', background: '#fff', fontSize: 13, fontWeight: 800, color: '#1D1D1F', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>ביטול</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!date}
                        style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: date ? 'linear-gradient(135deg,#FF9500,#FF6B00)' : '#AEAEB2', fontSize: 13, fontWeight: 800, color: '#fff', cursor: date ? 'pointer' : 'not-allowed', fontFamily: 'Heebo,sans-serif' }}>
                        ⏰ שמור תזכורת
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Global search (Cmd+K) ────────────────────────────────────────────────────
function CmdKSearch({ quotes, orders, onSelectQuote, onClose }) {
    const [q, setQ] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = useMemo(() => {
        if (!q.trim()) return [];
        const term = q.trim().toLowerCase();
        const qResults = quotes.filter(item =>
            (item.contactName || '').toLowerCase().includes(term) ||
            (item.institution || '').toLowerCase().includes(term) ||
            (item.id || '').toLowerCase().includes(term) ||
            (item.email || '').toLowerCase().includes(term) ||
            (item.phone || '').includes(term)
        ).slice(0, 5).map(item => ({ ...item, _type: 'quote' }));
        const oResults = orders.filter(item =>
            (item.customer || '').toLowerCase().includes(term) ||
            (item.id || '').toLowerCase().includes(term) ||
            (item.product || '').toLowerCase().includes(term)
        ).slice(0, 3).map(item => ({ ...item, _type: 'order' }));
        return [...qResults, ...oResults];
    }, [q, quotes, orders]);

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999998, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }} onClick={onClose} dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.96, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.28)', border: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: 16 }}>🔍</span>
                    <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש הצעות, לקוחות, הזמנות..." dir="rtl"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', background: 'transparent' }}
                        onKeyDown={e => e.key === 'Escape' && onClose()} />
                    <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: 'rgba(0,0,0,0.06)', color: '#86868B', fontWeight: 700 }}>ESC</kbd>
                </div>
                {results.length > 0 ? (
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {results.map((item, i) => (
                            <motion.button key={item.id} whileHover={{ background: 'rgba(0,122,255,0.04)' }}
                                onClick={() => { if (item._type === 'quote') { onSelectQuote(item); } else { navigate(`/admin/orders?orderId=${item.id}`); } onClose(); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', borderBottom: i < results.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', transition: 'background 0.15s' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: item._type === 'quote' ? `${QUOTE_STATUS_COLORS[item.status] || '#007AFF'}18` : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                                    {item._type === 'quote' ? '📋' : '📦'}
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>{item._type === 'quote' ? (item.contactName || item.institution) : item.customer}</p>
                                    <p style={{ fontSize: 11, color: '#86868B', margin: '1px 0 0' }}>{item.id} · {item._type === 'quote' ? item.status : item.product}</p>
                                </div>
                                {item._type === 'quote' && item.subtotal > 0 && (
                                    <span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', flexShrink: 0 }}>₪{item.subtotal.toLocaleString()}</span>
                                )}
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: item._type === 'quote' ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.05)', color: item._type === 'quote' ? '#007AFF' : '#6E6E73', flexShrink: 0 }}>
                                    {item._type === 'quote' ? 'הצעה' : 'הזמנה'}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                ) : q.trim() ? (
                    <div style={{ padding: '32px 18px', textAlign: 'center', color: '#AEAEB2', fontSize: 13, fontWeight: 600 }}>לא נמצאו תוצאות עבור "{q}"</div>
                ) : (
                    <div style={{ padding: '20px 18px', textAlign: 'center', color: '#AEAEB2', fontSize: 13 }}>הקלד לחיפוש בכל ההצעות וההזמנות...</div>
                )}
                <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>⌘K לפתיחה</span>
                    <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 600 }}>ESC לסגירה</span>
                </div>
            </motion.div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// QUOTES PIPELINE
// ════════════════════════════════════════════════════════════════════════════
function QuotesPipeline() {
    const { quotes, updateQuoteStatus, updateQuoteFields, addQuoteNote, setQuoteCustomerMessage, sendThreadMessage, markAdminThreadRead, markOrdersSeen, deleteQuote } = useAdminData();
    const { showToast } = useAdminToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => { markOrdersSeen?.(); }, []);

    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('הכל');
    const [dateFilter, setDateFilter]   = useState('all');
    const [selected, setSelected]       = useState(null);
    const [newStatus, setNewStatus]     = useState('');
    const [noteText, setNoteText]       = useState('');
    const [saved, setSaved]             = useState(false);
    const [activeTab, setActiveTab]     = useState('pipeline');
    const [threadMsg, setThreadMsg]         = useState('');
    const [threadSending, setThreadSending] = useState(false);
    const [hoveredMsg, setHoveredMsg]       = useState(null);
    const [flashId, setFlashId]             = useState(null);
    const [splitView, setSplitView]         = useState(false);
    const [reminderQuote, setReminderQuote] = useState(null);
    const [bulkMode, setBulkMode]           = useState(false);
    const [selectedIds, setSelectedIds]     = useState(new Set());
    const [histOpen, setHistOpen]           = useState(false);
    const [viewMode, setViewMode]           = useState('list');
    const threadEndRef   = useRef(null);
    const typingTimerRef = useRef(null);
    const prevSelectedId = useRef(null);

    // Auto-open quote from URL param ?quoteId=xxx
    useEffect(() => {
        const id = searchParams.get('quoteId');
        if (!id || !quotes.length) return;
        const q = quotes.find(q => q.id === id);
        if (q) setSelected(q);
    }, [searchParams, quotes]); // eslint-disable-line react-hooks/exhaustive-deps

    // Real-time sync: keep selected in sync with live quotes data
    useEffect(() => {
        setSelected(prev => {
            if (!prev) return prev;
            const fresh = quotes.find(q => q.id === prev.id);
            return fresh ?? prev;
        });
    }, [quotes]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync when modal opens/switches
    useEffect(() => {
        // Clear typing on previous quote when switching
        if (prevSelectedId.current && prevSelectedId.current !== selected?.id) {
            clearTimeout(typingTimerRef.current);
            updateDoc(doc(db, 'quotes', prevSelectedId.current), { typingAdmin: false }).catch(() => {});
        }
        prevSelectedId.current = selected?.id || null;

        if (selected) {
            setActiveTab(selected.unreadAdmin ? 'chat' : 'pipeline');
            setThreadMsg('');
            const upd = { lastReadAdmin: Date.now() };
            if (selected.unreadAdmin) upd.unreadAdmin = false;
            updateDoc(doc(db, 'quotes', selected.id), upd).catch(() => {});
        }
    }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selected?.thread?.length]);

    // ESC key closes modal
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setSelected(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Reset history open state when switching quotes
    useEffect(() => { setHistOpen(false); }, [selected?.id]);

    const handleDeleteHistoryEntry = (index) => {
        const newHistory = (selected.history || []).filter((_, i) => i !== index);
        setSelected(prev => ({ ...prev, history: newHistory }));
        updateQuoteFields(selected.id, { history: newHistory });
    };

    const [emailPreview, setEmailPreview]   = useState(null);
    const [previewHtml, setPreviewHtml]     = useState('');
    const [previewSubject, setPreviewSubject] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewSending, setPreviewSending] = useState(false);

    const openEmailPreview = async (type, quote, preAction = null) => {
        if (!quote?.email) { showToast('אין כתובת מייל ללקוח', 'error'); return; }
        setEmailPreview({ type, quote, preAction });
        setPreviewHtml('');
        setPreviewSubject('');
        setPreviewLoading(true);
        try {
            const res = await fetch('/api/send-stage-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quote, preview: true }),
            });
            if (res.ok) {
                const data = await res.json();
                setPreviewHtml(data.html || '');
                setPreviewSubject(data.subject || '');
            } else {
                const errText = await res.text().catch(() => '');
                setPreviewHtml(`<div style="padding:24px;font-family:Heebo,sans-serif;direction:rtl;color:#FF3B30;font-size:13px;line-height:1.6;"><strong>שגיאה בטעינת תצוגה מקדימה</strong><br/>${res.status} — ${errText}</div>`);
                setPreviewSubject('(שגיאה)');
            }
        } catch (err) {
            setPreviewHtml(`<div style="padding:24px;font-family:Heebo,sans-serif;direction:rtl;color:#FF3B30;font-size:13px;line-height:1.6;"><strong>שגיאת רשת</strong><br/>${err?.message || 'בדוק חיבור אינטרנט'}</div>`);
            setPreviewSubject('(שגיאת רשת)');
        }
        finally { setPreviewLoading(false); }
    };

    const handlePreviewSend = async (customNote = null, customSubject = null) => {
        if (!emailPreview) return;
        setPreviewSending(true);
        try {
            if (emailPreview.preAction) await emailPreview.preAction();
            const body = { type: emailPreview.type, quote: emailPreview.quote };
            if (customNote) body.customNote = customNote;
            if (customSubject) body.customSubject = customSubject;
            const res = await fetch('/api/send-stage-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) { showToast('מייל נשלח ✓', 'success'); setEmailPreview(null); }
            else showToast('שגיאה בשליחת מייל', 'error');
        } catch { showToast('שגיאה בשליחת מייל', 'error'); }
        finally { setPreviewSending(false); }
    };

    const handleQuickStatus = (id, status) => {
        updateQuoteStatus(id, status);
        showToast(`הצעה עודכנה ל"${status}"`, 'success');
        setFlashId(id);
        setTimeout(() => setFlashId(null), 600);
    };

    const handleStatusSave = async () => {
        if (!newStatus || !selected) return;
        // Save a version snapshot when sending a quote
        if (newStatus === 'הוצע מחיר') {
            const snapshot = {
                savedAt: Date.now(),
                savedAtStr: new Date().toLocaleString('he-IL'),
                status: newStatus,
                items: selected.items || [],
                subtotal: selected.subtotal || 0,
                notes: selected.notes || '',
                versionLabel: `גרסה ${((selected.versions || []).length + 1)}`,
            };
            const prev = selected.versions || [];
            await updateQuoteFields(selected.id, { versions: [...prev, snapshot] });
        }
        updateQuoteStatus(selected.id, newStatus);
        setSelected(prev => ({ ...prev, status: newStatus }));
        setSaved(true);
        setTimeout(() => { setSaved(false); setNewStatus(''); }, 1200);
    };

    const handleAdminTyping = () => {
        if (!selected) return;
        updateDoc(doc(db, 'quotes', selected.id), { typingAdmin: true }).catch(() => {});
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            updateDoc(doc(db, 'quotes', selected.id), { typingAdmin: false }).catch(() => {});
        }, 2000);
    };

    const handleReaction = (msgId, emoji) => {
        if (!selected) return;
        updateDoc(doc(db, 'quotes', selected.id), {
            [`reactions.${msgId}`]: arrayUnion({ from: 'admin', emoji, tsNum: Date.now() })
        }).catch(() => {});
        setHoveredMsg(null);
    };

    const handleSendThread = async () => {
        if (!threadMsg.trim() || !selected) return;
        setThreadSending(true);
        clearTimeout(typingTimerRef.current);
        updateDoc(doc(db, 'quotes', selected.id), { typingAdmin: false }).catch(() => {});
        try {
            await sendThreadMessage(selected.id, threadMsg);
            setThreadMsg('');
            showToast('הודעה נשלחה ללקוח ✓', 'success');
        } finally { setThreadSending(false); }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !selected) return;
        await addQuoteNote(selected.id, noteText.trim());
        setNoteText('');
        showToast('הערה נשמרה', 'success');
    };

    const handleSaveReminder = async (quoteId, data) => {
        await updateQuoteFields(quoteId, data);
        showToast('תזכורת נשמרה ✓', 'success');
    };

    const filtered = useMemo(() => {
        let list = filterByDate([...quotes], 'dateTs', dateFilter);
        if (statusFilter !== 'הכל') list = list.filter(q => q.status === statusFilter);
        if (search) list = list.filter(q =>
            (q.contactName || '').includes(search) ||
            (q.institution || '').includes(search) ||
            (q.email || '').includes(search) ||
            (q.id || '').includes(search) ||
            (q.phone || '').includes(search)
        );
        return list;
    }, [quotes, search, statusFilter, dateFilter]);

    const stats = useMemo(() => ({
        new:         quotes.filter(q => q.status === 'חדש').length,
        contacting:  quotes.filter(q => q.status === 'ביצירת קשר').length,
        quoted:      quotes.filter(q => ['בדיקת מלאי','הוצע מחיר','במשא ומתן','ממתין לאישור'].includes(q.status)).length,
        closed:      quotes.filter(q => q.status === 'נסגר').length,
        transit:     quotes.filter(q => ['הועבר לספק','בדרך'].includes(q.status)).length,
        delivered:   quotes.filter(q => q.status === 'סופק').length,
    }), [quotes]);

    const totalValue = useMemo(() => filtered.reduce((s, q) => s + (q.subtotal || 0), 0), [filtered]);

    const hint = selected ? getNextStepHint(selected) : null;

    const todayReminders = useMemo(() => quotes.filter(q => q.reminderAt && q.reminderAt <= Date.now() + 86400000 && q.reminderAt > Date.now() - 86400000).length, [quotes]);

    const staleQuotes = useMemo(() => {
        const staleMap = { 'חדש': 1, 'ביצירת קשר': 3, 'בדיקת מלאי': 5, 'הוצע מחיר': 7, 'ממתין לאישור': 5 };
        return quotes.filter(q => {
            const threshold = staleMap[q.status];
            if (!threshold) return false;
            const age = q.dateTs ? Math.floor((Date.now() - q.dateTs) / 86400000) : 0;
            return age > threshold;
        }).length;
    }, [quotes]);

    useEffect(() => {
        if (todayReminders > 0) {
            setTimeout(() => showToast(`⏰ ${todayReminders} תזכורות להיום`, 'success'), 1200);
        }
    }, []); // eslint-disable-line

    const suggestions = useMemo(() => {
        if (!selected) return [];
        const msgs = [...(selected.thread || [])].sort((a,b) => a.tsNum - b.tsNum);
        if (!msgs.length && selected.customerNote) return AI_TEMPLATES.general;
        if (!msgs.length) return [];
        return AI_TEMPLATES[detectIntent(msgs)] || AI_TEMPLATES.general;
    }, [selected?.id, selected?.thread?.length]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
        <style>{`@keyframes ppulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.4)}}@keyframes ppDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}@keyframes emailSpin{to{transform:rotate(360deg)}}`}</style>
        <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <Stat label="חדשות" value={stats.new} color="#FF3B30" Icon={Bell}
                    tooltip="בקשות הצעת מחיר שנקלטו ועדיין לא טופלו." />
                <Stat label="בטיפול" value={stats.contacting} color="#FF9500" Icon={Phone}
                    tooltip="בשלב יצירת קשר ובדיקת מלאי מספק." />
                <Stat label="הוצאת מחיר" value={stats.quoted} color="#007AFF" Icon={FileText}
                    tooltip="הצעות בשלב בנאי המחיר, שליחה וממתין לאישור לקוח." />
                <Stat label="נסגרו" value={stats.closed} color="#34C759" Icon={CheckCircle2}
                    tooltip="עסקאות שנסגרו — ממתינות להעברה לספק." />
                <Stat label="בדרך" value={stats.transit} color="#0891B2" Icon={Truck}
                    tooltip="הזמנות שהועברו לספק ובדרך ללקוח." />
                <Stat label="סופקו" value={stats.delivered} color="#1DB954" Icon={Package}
                    tooltip="עסקאות שסופקו בהצלחה — הכנסה נרשמה." />
                {staleQuotes > 0 && (
                    <Stat label="דורשות טיפול" value={staleQuotes} color="#FF3B30" Icon={AlertCircle} tooltip="הצעות שלא התקדמו מעבר לזמן הצפוי לשלב." />
                )}
            </div>

            {/* Activity Feed */}
            {quotes.some(q => q.history?.length > 0) && (
                <details style={{ borderRadius: 18 }}>
                    <summary style={{ padding: '10px 14px', borderRadius: 18, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#86868B', textAlign: 'right', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759', display: 'inline-block', marginLeft: 6 }} />
                        פעילות אחרונה
                        <span style={{ opacity: 0.4 }}>▸</span>
                    </summary>
                    <div style={{ marginTop: 8 }}>
                        <ActivityFeed quotes={quotes} />
                    </div>
                </details>
            )}

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי שם, מוסד, מייל, מספר..." />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <AdminFilterPills options={QUOTE_STATUSES} active={statusFilter} onChange={setStatusFilter} />
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                    <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, background: 'rgba(0,0,0,0.05)' }}>
                        {[{ id: 'list', icon: '☰' }, { id: 'kanban', icon: '⬜' }].map(v => (
                            <motion.button key={v.id} whileTap={{ scale: 0.92 }} onClick={() => setViewMode(v.id)}
                                style={{ width: 30, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                                    background: viewMode === v.id ? '#fff' : 'transparent',
                                    boxShadow: viewMode === v.id ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
                                }}>
                                {v.icon}
                            </motion.button>
                        ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setBulkMode(m => !m); setSelectedIds(new Set()); }}
                        style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${bulkMode ? 'rgba(0,122,255,0.3)' : 'rgba(0,0,0,0.09)'}`, background: bulkMode ? 'rgba(0,122,255,0.09)' : 'rgba(0,0,0,0.03)', fontSize: 11, fontWeight: 800, color: bulkMode ? '#007AFF' : '#6E6E73', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                        {bulkMode ? `✓ ${selectedIds.size} נבחרו` : '☑ בחירה מרובה'}
                    </motion.button>
                </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'kanban' && (
                <AdminKanbanBoard
                    quotes={filtered}
                    onUpdateStatus={handleQuickStatus}
                    onOpen={(quote) => { setSelected(quote); setNewStatus(''); setSaved(false); setNoteText(''); }}
                    showToast={showToast}
                />
            )}

            {/* List */}
            <div className="space-y-3 mt-4" style={{ display: viewMode === 'kanban' ? 'none' : undefined }}>
                {/* Floating Bulk Bar — portal-rendered at body level */}
                <AnimatePresence>
                    {bulkMode && selectedIds.size > 0 && createPortal(
                        <motion.div
                            initial={{ opacity: 0, y: 80, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 60, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            dir="rtl"
                            style={{
                                position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
                                zIndex: 99999, display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 22,
                                background: 'rgba(29,29,31,0.94)',
                                backdropFilter: 'blur(40px) saturate(200%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                minWidth: 320, flexWrap: 'wrap',
                            }}
                        >
                            {/* Count badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff' }}>
                                    {selectedIds.size}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>נבחרו</span>
                            </div>

                            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.14)', margin: '0 2px' }} />

                            {/* Select all */}
                            <motion.button whileTap={{ scale: 0.93 }}
                                onClick={() => setSelectedIds(new Set(filtered.map(q => q.id)))}
                                style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', whiteSpace: 'nowrap' }}>
                                בחר הכל
                            </motion.button>

                            {/* Status actions */}
                            {[
                                { label: 'ביצירת קשר', status: 'ביצירת קשר', color: '#FF9500' },
                                { label: 'הוצע מחיר',  status: 'הוצע מחיר',  color: '#007AFF' },
                                { label: 'נסגר',        status: 'נסגר',        color: '#34C759' },
                                { label: 'בוטל',        status: 'בוטל',        color: '#FF3B30' },
                            ].map(a => (
                                <motion.button key={a.status} whileTap={{ scale: 0.93 }}
                                    onClick={() => {
                                        selectedIds.forEach(id => updateQuoteStatus(id, a.status));
                                        showToast(`${selectedIds.size} הצעות → "${a.status}"`, 'success');
                                        setSelectedIds(new Set()); setBulkMode(false);
                                    }}
                                    style={{ padding: '6px 13px', borderRadius: 10, border: 'none', background: `${a.color}22`, color: a.color, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', whiteSpace: 'nowrap' }}>
                                    → {a.label}
                                </motion.button>
                            ))}

                            {/* Export CSV */}
                            <motion.button whileTap={{ scale: 0.93 }}
                                onClick={() => {
                                    exportQuotesToCsv(filtered.filter(q => selectedIds.has(q.id)));
                                    showToast('CSV יוצא', 'success');
                                }}
                                style={{ padding: '6px 13px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', whiteSpace: 'nowrap' }}>
                                ↓ CSV
                            </motion.button>

                            {/* Close */}
                            <motion.button whileTap={{ scale: 0.90 }}
                                onClick={() => { setSelectedIds(new Set()); setBulkMode(false); }}
                                style={{ width: 28, height: 28, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 2 }}>
                                ✕
                            </motion.button>
                        </motion.div>,
                        document.body
                    )}
                </AnimatePresence>

                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-2 text-right" dir="rtl">
                        {['', 'מספר / תאריך', 'פרטי קשר', 'שווי הצעה', 'סטטוס', ''].map((h, i) => (
                            <p key={i} className="text-[10px] font-black tracking-[0.18em] text-[#AEAEB2]">{h}</p>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {filtered.map((quote, i) => (
                        <motion.div
                            key={quote.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => {
                                if (bulkMode) {
                                    setSelectedIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(quote.id)) next.delete(quote.id);
                                        else next.add(quote.id);
                                        return next;
                                    });
                                } else {
                                    setSelected(quote); setNewStatus(''); setSaved(false); setNoteText('');
                                }
                            }}
                            className="grid grid-cols-[auto_1fr_2fr_1fr_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group" dir="rtl"
                            style={{
                                borderColor: bulkMode && selectedIds.has(quote.id) ? 'rgba(0,122,255,0.4)' : (quote.unreadAdmin ? 'rgba(52,199,89,0.35)' : undefined),
                                transition: 'box-shadow 0.3s, background 0.3s',
                                boxShadow: flashId === quote.id ? `0 0 0 3px ${QUOTE_STATUS_COLORS[quote.status] || '#007AFF'}60, 0 12px 40px rgba(0,122,255,0.12)` : undefined,
                                background: bulkMode && selectedIds.has(quote.id) ? 'rgba(0,122,255,0.05)' : (flashId === quote.id ? `${QUOTE_STATUS_COLORS[quote.status] || '#007AFF'}08` : (quote.unreadAdmin ? 'rgba(52,199,89,0.03)' : undefined)),
                            }}
                        >
                            {bulkMode && (
                                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selectedIds.has(quote.id) ? '#007AFF' : 'rgba(0,0,0,0.18)'}`, background: selectedIds.has(quote.id) ? '#007AFF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                    {selectedIds.has(quote.id) && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                                </div>
                            )}
                            <div style={{ position: 'relative' }}>
                                <Avatar name={quote.contactName} />
                                {quote.unreadAdmin && (
                                    <span style={{
                                        position: 'absolute', top: -3, right: -3,
                                        width: 11, height: 11, borderRadius: '50%',
                                        background: '#34C759', border: '2px solid #fff',
                                        animation: 'ppulse 1.4s infinite',
                                    }} />
                                )}
                            </div>
                            <div className="text-right">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <p className="text-[#007AFF] font-black text-xs group-hover:text-[#5856D6] transition-colors">{quote.id}</p>
                                    <CopyBtn text={quote.id} />
                                </div>
                                    {(() => {
                                        const d = quote.dateTs ? Math.floor((Date.now() - quote.dateTs) / 86400000) : null;
                                        const staleMap = { 'חדש': 1, 'ביצירת קשר': 3, 'בדיקת מלאי': 5, 'הוצע מחיר': 7, 'ממתין לאישור': 5 };
                                        const staleThreshold = staleMap[quote.status];
                                        const stageAge = quote.lastStatusChange ? Math.floor((Date.now() - quote.lastStatusChange) / 86400000) : d;
                                        const isStale = staleThreshold && stageAge > staleThreshold;
                                        return d !== null && d > 0 ? (
                                            <span title={isStale ? `⚠️ לא התקדם ${stageAge} ימים` : `גיל: ${d} ימים`}
                                                style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 5, background: isStale ? 'rgba(255,59,48,0.12)' : d > 7 ? 'rgba(255,59,48,0.10)' : 'rgba(255,149,0,0.09)', color: isStale ? '#FF3B30' : d > 7 ? '#FF3B30' : '#FF9500' }}>
                                                {isStale ? `⚠️ ${stageAge}י׳` : `${d}י׳`}
                                            </span>
                                        ) : null;
                                    })()}
                                    {quote.reminderAt && quote.reminderAt > Date.now() && (
                                        <span title={`תזכורת: ${new Date(quote.reminderAt).toLocaleDateString('he-IL')}`} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 5, background: 'rgba(255,149,0,0.12)', color: '#FF9500', fontWeight: 800 }}>⏰</span>
                                    )}
                                </div>
                                <p className="text-[#AEAEB2] text-[10px] mt-0.5">{quote.date}</p>
                                {/* Mini pipeline progress bar */}
                                {(() => {
                                    const ci = QUOTE_STATUS_FLOW.indexOf(quote.status);
                                    const pct = Math.round(((ci + 1) / QUOTE_STATUS_FLOW.length) * 100);
                                    const col = QUOTE_STATUS_COLORS[quote.status] || '#007AFF';
                                    return (
                                        <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', width: '100%' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${col}, ${col}CC)` }}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="text-right min-w-0">
                                <p className="text-[#1D1D1F] font-bold text-sm truncate hover:text-[#007AFF] hover:underline cursor-pointer transition-colors"
                                    onClick={e => { e.stopPropagation(); navigate(`/admin/users?email=${encodeURIComponent(quote.email || quote.contactName || '')}`); }}>{quote.contactName}</p>
                                <p className="text-[#AEAEB2] text-[10px] truncate">{quote.institution} · {quote.contactRole}</p>
                            </div>
                            <p className="text-[#1D1D1F] font-black text-sm">
                                {quote.subtotal ? `₪${quote.subtotal.toLocaleString()}` : '—'}
                            </p>
                            <QuickDropdown item={quote} statuses={QUOTE_STATUSES} colors={QUOTE_STATUS_COLORS} onUpdate={handleQuickStatus} />
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                {quote.phone && (
                                    <a
                                        href={`https://wa.me/972${quote.phone.replace(/^0/, '').replace(/-/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 2px 8px rgba(37,211,102,0.35)' }}
                                    >
                                        WA
                                    </a>
                                )}
                                {(() => {
                                    const nextStage = QUOTE_STATUS_FLOW[QUOTE_STATUS_FLOW.indexOf(quote.status) + 1];
                                    if (!nextStage) return null;
                                    const col = QUOTE_STATUS_COLORS[nextStage] || '#007AFF';
                                    return (
                                        <motion.button whileTap={{ scale: 0.88 }}
                                            onClick={(e) => { e.stopPropagation(); handleQuickStatus(quote.id, nextStage); }}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all whitespace-nowrap"
                                            style={{ background: `linear-gradient(135deg,${col},${col}CC)`, boxShadow: `0 2px 8px ${col}35`, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            → {nextStage}
                                        </motion.button>
                                    );
                                })()}
                                <motion.button whileTap={{ scale: 0.88 }}
                                    onClick={(e) => { e.stopPropagation(); setReminderQuote(quote); }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-black transition-all"
                                    style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500' }}>
                                    ⏰
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-16 flex flex-col items-center gap-4" dir="rtl">
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,rgba(0,122,255,0.10),rgba(88,86,214,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                            {search || statusFilter !== 'הכל' ? '🔍' : '📋'}
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#1D1D1F', margin: 0, textAlign: 'center' }}>
                            {search || statusFilter !== 'הכל' ? 'לא נמצאו תוצאות' : 'אין הצעות מחיר עדיין'}
                        </p>
                        <p style={{ fontSize: 13, color: '#86868B', margin: 0, textAlign: 'center', maxWidth: 280 }}>
                            {search ? `אין תוצאות עבור "${search}"` : statusFilter !== 'הכל' ? `אין הצעות בסטטוס "${statusFilter}"` : 'כאשר לקוחות ישלחו בקשה, היא תופיע כאן'}
                        </p>
                        {(search || statusFilter !== 'הכל') && (
                            <button onClick={() => { setSearch(''); setStatusFilter('הכל'); }} style={{ padding: '9px 20px', borderRadius: 12, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                נקה פילטרים
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {filtered.length > 0 && (
                <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[#1D1D1F] font-black text-base">₪{totalValue.toLocaleString()}</span>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => exportQuotesToCsv(filtered)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.03)', fontSize: 11, fontWeight: 800, color: '#6E6E73', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                            ⬇️ ייצא CSV
                        </motion.button>
                    </div>
                    <span className="text-[#86868B] text-sm">{filtered.length} הצעות מוצגות</span>
                </div>
            )}

            {/* Quote Detail Modal */}
            <AdminModal open={!!selected} onClose={() => setSelected(null)} title="" size={splitView ? 'split' : 'lg'}>
                {selected && (
                    <div dir="rtl">
                        {/* ── Header: name + contact chips + delete | avatar ── */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 9px', borderRadius: 99, background: `${QUOTE_STATUS_COLORS[selected.status] || '#007AFF'}18`, color: QUOTE_STATUS_COLORS[selected.status] || '#007AFF' }}>{selected.status}</span>
                                    {selected.institution && <span style={{ fontSize: 11, fontWeight: 700, color: '#86868B' }}>{selected.institution}</span>}
                                    <p style={{ fontSize: 16, fontWeight: 900, color: '#1D1D1F', margin: 0, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.18)' }} onClick={() => navigate(`/admin/users?email=${encodeURIComponent(selected.email || selected.contactName || '')}`)}>{selected.contactName}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center' }}>
                                    <span style={{ fontSize: 10, color: '#AEAEB2', fontWeight: 700 }}>{selected.id}</span>
                                    <CopyBtn text={selected.id} label="מספר הזמנה" />
                                    {selected.phone && (
                                        <a href={`https://wa.me/972${selected.phone.replace(/^0/, '').replace(/-/g, '')}?text=${encodeURIComponent(`${String.fromCharCode(0x05E9)}${String.fromCharCode(0x05DC)}${String.fromCharCode(0x05D5)}${String.fromCharCode(0x05DD)} ${selected.contactName}`)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(37,211,102,0.12)', color: '#128C7E', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                            WhatsApp
                                        </a>
                                    )}
                                    {selected.email && (
                                        <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`${String.fromCharCode(0x05D4)}${String.fromCharCode(0x05E6)}${String.fromCharCode(0x05E2)}${String.fromCharCode(0x05EA)} ${String.fromCharCode(0x05DE)}${String.fromCharCode(0x05D7)}${String.fromCharCode(0x05D9)}${String.fromCharCode(0x05E8)} ${selected.id} — NextClass`)}`}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                            מייל
                                        </a>
                                    )}
                                    <motion.button whileTap={{ scale: 0.95 }}
                                        onClick={() => { if (window.confirm('למחוק את ההצעה לצמיתות?')) { deleteQuote(selected.id); setSelected(null); showToast('ההצעה נמחקה', 'success'); } }}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.06)', color: '#FF3B30', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                                        <Trash2 size={11} /> מחק
                                    </motion.button>
                                </div>
                            </div>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div style={{ width: 46, height: 46, borderRadius: 14, background: `linear-gradient(135deg,${QUOTE_STATUS_COLORS[selected.status] || '#007AFF'},${QUOTE_STATUS_COLORS[selected.status] || '#007AFF'}70)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                                    {selected.contactName?.[0] || '?'}
                                </div>
                                {selected.unreadAdmin && (
                                    <span style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: '#34C759', border: '2.5px solid #fff', animation: 'ppulse 1.4s infinite' }} />
                                )}
                            </div>
                        </div>

                        {/* ―― Quick status bar ―― */}
                        <QuickStatusBar
                            currentStatus={selected.status}
                            quoteId={selected.id}
                            onUpdateStatus={(id, st) => { updateQuoteStatus(id, st); setSelected(s => ({ ...s, status: st })); showToast(`עודכן ל"${st}"`, 'success'); }}
                        />

                        {/* ―― Split view toggle — desktop only ―― */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }} className="hidden lg:flex">
                            <button onClick={() => setSplitView(v => !v)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(0,0,0,0.09)', background: splitView ? 'rgba(0,122,255,0.09)' : 'rgba(0,0,0,0.03)', color: splitView ? '#007AFF' : '#86868B', fontSize: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', transition: 'all 0.18s' }}>
                                {splitView ? '⬛ תצוגה יחידה' : '⬜⬜ פצל מסך'}
                            </button>
                        </div>

                        {/* ―― Tab bar ―― */}
                        <div style={{ display: 'flex', gap: 3, marginBottom: 20, padding: 4, borderRadius: 16, background: 'rgba(0,0,0,0.04)' }}>
                            {[
                                { key: 'pipeline', label: 'תהליך' },
                                { key: 'chat',     label: 'שיחה', badge: selected.unreadAdmin },
                                { key: 'details',  label: 'פרטים' },
                                { key: 'c360',     label: 'לקוח 360' },
                                { key: 'versions', label: 'גרסאות' },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    style={{ flex: 1, padding: '9px 0', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo, sans-serif', transition: 'all 0.18s', position: 'relative',
                                        background: activeTab === tab.key ? '#fff' : 'transparent',
                                        color: activeTab === tab.key ? '#1D1D1F' : '#86868B',
                                        boxShadow: activeTab === tab.key ? '0 1px 8px rgba(0,0,0,0.09)' : 'none',
                                    }}>
                                    {tab.label}
                                    {tab.badge && <span style={{ position: 'absolute', top: 5, right: '50%', transform: 'translateX(20px)', width: 7, height: 7, borderRadius: '50%', background: '#34C759', border: '1.5px solid #F5F5F7' }} />}
                                </button>
                            ))}
                        </div>

                        {/* ══ PIPELINE TAB ══ */}
                        <div style={{ display: splitView ? 'grid' : 'contents', gridTemplateColumns: splitView ? '1fr 1fr' : undefined, gap: splitView ? 16 : undefined }}>
                        {(activeTab === 'pipeline' || splitView) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {selected.status !== 'בוטל' ? (
                                    <div style={{ borderRadius: 18, padding: '12px 16px', background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', marginBottom: 8, textAlign: 'right' }}>מצב הצעה</p>
                                        <StatusTimeline status={selected.status} flow={QUOTE_STATUS_FLOW} colors={QUOTE_STATUS_COLORS} />
                                    </div>
                                ) : (
                                    <div style={{ borderRadius: 18, padding: 16, background: 'rgba(255,59,48,0.05)', border: '1.5px solid rgba(255,59,48,0.15)', textAlign: 'right' }} dir="rtl">
                                        <p style={{ fontSize: 14, fontWeight: 800, color: '#FF3B30', margin: '0 0 4px' }}>🚫 הזמנה בוטלה</p>
                                        <p style={{ fontSize: 12, color: '#AEAEB2', margin: '0 0 14px' }}>ניתן להחזיר אותה לתהליך הרגיל, או לשלוח ללקוח מייל ביטול מנומס</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {selected.email && (
                                                <StageBtn color="#FF3B30" label="✉️ מייל ביטול ללקוח" onClick={() => openEmailPreview('cancelled', selected)} />
                                            )}
                                            <StageBtn color="#FF9500" label="↩️ החזר לביצירת קשר" onClick={() => { updateQuoteStatus(selected.id, 'ביצירת קשר'); setSelected(s => ({ ...s, status: 'ביצירת קשר' })); showToast('הוחזר לתהליך', 'success'); }} secondary />
                                            <StageBtn color="#AEAEB2" label="↩️ החזר לחדש" onClick={() => { updateQuoteStatus(selected.id, 'חדש'); setSelected(s => ({ ...s, status: 'חדש' })); showToast('הוחזר לחדש', 'success'); }} secondary />
                                        </div>
                                    </div>
                                )}

                                {hint && (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12, background: `${hint.color}0D`, border: `1px solid ${hint.color}22`, marginBottom: 4 }} dir="rtl">
                                        <span style={{ fontSize: 15 }}>{hint.icon}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: hint.color, flex: 1, textAlign: 'right' }}>{hint.text}</span>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: `${hint.color}99`, letterSpacing: '0.06em', padding: '2px 7px', background: `${hint.color}12`, borderRadius: 5 }}>הצעד הבא</span>
                                    </motion.div>
                                )}

                                {selected.status !== 'בוטל' && (
                                    <StageActionPanel
                                        quote={selected}
                                        onUpdateStatus={(id, st) => { updateQuoteStatus(id, st); setSelected(s => ({ ...s, status: st })); }}
                                        updateQuoteFields={updateQuoteFields}
                                        showToast={showToast}
                                        navigate={navigate}
                                        onSwitchTab={setActiveTab}
                                        openEmailPreview={openEmailPreview}
                                    />
                                )}

                                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {selected.subtotal > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99, background: 'rgba(0,122,255,0.09)', color: '#007AFF' }}>₪{selected.subtotal.toLocaleString()}</span>
                                    )}
                                    {selected.urgency && (
                                        <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 99,
                                            background: ['גבוהה','דחוף'].includes(selected.urgency) ? 'rgba(255,59,48,0.10)' : 'rgba(255,149,0,0.10)',
                                            color: ['גבוהה','דחוף'].includes(selected.urgency) ? '#FF3B30' : '#FF9500' }}>
                                            {['גבוהה','דחוף'].includes(selected.urgency) ? '🔴' : '🟠'} {selected.urgency}
                                        </span>
                                    )}
                                    {selected.dateTs > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#86868B' }}>
                                            {Math.floor((Date.now() - selected.dateTs) / 86400000)} ימים פתוחה
                                        </span>
                                    )}
                                </div>

                                {/* Completion checkmark chips */}
                                {(() => {
                                    const chips = [];
                                    if (selected.quoteSentAt) chips.push({ label: 'הצעה נשלחה', color: '#34C759' });
                                    if (selected.supplierOrder?.orderId) chips.push({ label: 'הועבר לספק', color: '#007AFF' });
                                    if (selected.trackingInfo?.trackingNumber) chips.push({ label: 'מספר מעקב', color: '#5856D6' });
                                    if (selected.shippingDetails?.address) chips.push({ label: 'פרטי משלוח', color: '#FF9500' });
                                    if (selected.invoiceUrl) chips.push({ label: 'חשבונית', color: '#30D158' });
                                    if (chips.length === 0) return null;
                                    return (
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {chips.map(c => (
                                                <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: `${c.color}12`, color: c.color, border: `1px solid ${c.color}25` }}>
                                                    ✓ {c.label}
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()}

                                {selected.history?.length > 0 && (
                                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setHistOpen(p => !p)}
                                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: histOpen ? 'rgba(0,0,0,0.035)' : 'rgba(0,0,0,0.02)', border: 'none', cursor: 'pointer', fontFamily: 'Heebo, sans-serif', transition: 'background 0.15s' }}
                                        >
                                            <span style={{ fontSize: 11, color: '#86868B', transition: 'transform 0.2s', display: 'inline-block', transform: histOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▸</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em' }}>היסטוריה</span>
                                                <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(0,0,0,0.07)', color: '#6E6E73', borderRadius: 99, padding: '1px 7px' }}>{selected.history.length}</span>
                                            </div>
                                        </button>
                                        {histOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.6)' }}>
                                                {[...selected.history].reverse().map((h, ri) => {
                                                    const origIdx = selected.history.length - 1 - ri;
                                                    return (
                                                        <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                                                            <button type="button" onClick={() => handleDeleteHistoryEntry(origIdx)}
                                                                style={{ width: 18, height: 18, borderRadius: 5, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'system-ui', lineHeight: 1, paddingBottom: 1 }}
                                                                title="מחק רשומה">×</button>
                                                            <div style={{ flex: 1, textAlign: 'right' }}>
                                                                <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>{h.action || h.status || h.text}</p>
                                                                {h.ts && <p style={{ fontSize: 9, color: '#AEAEB2', margin: '1px 0 0' }}>{new Date(h.ts).toLocaleString('he-IL')}</p>}
                                                            </div>
                                                            <span style={{ fontSize: 12, flexShrink: 0 }}>{h.emoji || '📌'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <details style={{ borderRadius: 14 }}>
                                    <summary style={{ padding: '9px 14px', background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, fontSize: 11, fontWeight: 800, color: '#86868B', cursor: 'pointer', textAlign: 'right', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ opacity: 0.5 }}>▸</span>
                                        <span>עדכון סטאטוס ידני</span>
                                    </summary>
                                    <div style={{ padding: '12px 14px', borderRadius: '0 0 14px 14px', background: 'rgba(0,0,0,0.015)', border: '1px solid rgba(0,0,0,0.07)', borderTop: 'none' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, justifyContent: 'flex-end' }}>
                                            {QUOTE_STATUSES.slice(1).map(s => (
                                                <button key={s} type="button" onClick={() => setNewStatus(s)}
                                                    style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'Heebo, sans-serif',
                                                        background: newStatus === s ? (QUOTE_STATUS_COLORS[s] || '#007AFF') : 'rgba(0,0,0,0.06)',
                                                        color: newStatus === s ? '#fff' : '#6E6E73',
                                                        boxShadow: newStatus === s ? `0 3px 10px ${(QUOTE_STATUS_COLORS[s] || '#007AFF')}40` : 'none',
                                                    }}>{s}</button>
                                            ))}
                                        </div>
                                        <AdminButton onClick={handleStatusSave} disabled={!newStatus}>
                                            {saved ? '✓ עודכן!' : 'עדכן סטאטוס'}
                                        </AdminButton>
                                    </div>
                                </details>
                            </div>
                        )}

                        {/* ══ CHAT TAB ══ */}
                        {(activeTab === 'chat' || splitView) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                {/* Customer + Order context card */}
                                <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                                    <div style={{ background: `linear-gradient(135deg,${QUOTE_STATUS_COLORS[selected.status] || '#007AFF'}18,${QUOTE_STATUS_COLORS[selected.status] || '#007AFF'}08)`, padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <button onClick={() => setActiveTab('pipeline')} style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '3px 9px', cursor: 'pointer' }}>← תהליך</button>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: QUOTE_STATUS_COLORS[selected.status] || '#007AFF' }}>{selected.status}</span>
                                    </div>
                                    <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div>
                                            <p style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 800, margin: '0 0 2px', textAlign: 'right' }}>לקוח</p>
                                            <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: 0, textAlign: 'right', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.18)' }} onClick={() => navigate(`/admin/users?email=${encodeURIComponent(selected.email || selected.contactName || '')}`)}>{selected.contactName || '—'}</p>
                                            {selected.institution && <p style={{ fontSize: 11, color: '#6E6E73', margin: '1px 0 0', textAlign: 'right' }}>{selected.institution}</p>}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 800, margin: '0 0 2px', textAlign: 'right' }}>הזמנה</p>
                                            <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', margin: 0, textAlign: 'right' }}>{selected.id}</p>
                                            {selected.subtotal > 0 && <p style={{ fontSize: 11, color: '#34C759', fontWeight: 800, margin: '1px 0 0', textAlign: 'right' }}>₪{selected.subtotal.toLocaleString()}</p>}
                                        </div>
                                    </div>
                                    {/* Items in this order */}
                                    {(selected.items || []).length > 0 && (
                                        <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                            <p style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 800, margin: '0 0 6px', textAlign: 'right', letterSpacing: '0.08em' }}>פריטים ({selected.items.length})</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {(selected.items || []).map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: 11, color: '#34C759', fontWeight: 800, flexShrink: 0 }}>×{item.qty || item.quantity || 1}</span>
                                                        <button onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(item.title || item.name || '')}`)}
                                                            style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'right', flex: 1, fontFamily: 'Heebo,sans-serif', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.18)' }}>
                                                            {item.title || item.name || 'מוצר'}
                                                        </button>
                                                        {(item.salePrice || item.price) && <span style={{ fontSize: 11, color: '#007AFF', fontWeight: 800, flexShrink: 0 }}>₪{((item.salePrice || item.price) * (item.qty || item.quantity || 1)).toLocaleString()}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Quick contact actions */}
                                    <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {selected.phone && (
                                            <a href={`https://wa.me/972${selected.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 9, background: 'rgba(37,211,102,0.11)', color: '#128C7E', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                                📱 {selected.phone}
                                            </a>
                                        )}
                                        {selected.email && (
                                            <a href={`mailto:${selected.email}`}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 9, background: 'rgba(0,122,255,0.08)', color: '#007AFF', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                                ✉️ מייל
                                            </a>
                                        )}
                                        {selected.phone && (
                                            <a href={`tel:${selected.phone}`}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 9, background: 'rgba(52,199,89,0.09)', color: '#34C759', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                                📞 התקשר
                                            </a>
                                        )}
                                        <button onClick={() => navigate('/admin/communications')}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 9, background: 'rgba(88,86,214,0.09)', color: '#5856D6', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                            💬 מרכז תקשורת
                                        </button>
                                    </div>
                                </div>
                                {(() => {
                                    const hasThread = (selected.thread || []).length > 0;
                                    const msgs = [...(selected.thread || [])].sort((a,b) => a.tsNum - b.tsNum);
                                    if (!hasThread && selected.customerMessage) msgs.push({ id: 'lg-a', from: 'admin', text: selected.customerMessage, tsNum: 0 });
                                    if (!hasThread && selected.customerNote) msgs.push({ id: 'lg-c', from: 'customer', text: selected.customerNote, tsNum: 1 });
                                    const rxns = selected.reactions || {};
                                    const lastReadMsgId = (() => {
                                        if (!selected.lastReadCustomer) return null;
                                        const read = msgs.filter(m => m.from === 'admin' && m.tsNum > 0 && selected.lastReadCustomer >= m.tsNum);
                                        return read.length ? read[read.length - 1].id : null;
                                    })();
                                    if (msgs.length === 0) return (
                                        <p style={{ textAlign: 'center', color: '#AEAEB2', fontSize: 13, padding: '32px 0', fontWeight: 600 }}>אין הודעות — שלח הודעה ראשונה</p>
                                    );
                                    return (
                                        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7, padding: '4px 2px' }}>
                                            {msgs.map(m => {
                                                const isMine = m.from === 'admin';
                                                const msgRxns = rxns[m.id] || [];
                                                const rxnCounts = msgRxns.reduce((acc, r) => { acc[r.emoji] = (acc[r.emoji]||0)+1; return acc; }, {});
                                                return (
                                                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }} dir="rtl">
                                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMine ? 'row-reverse' : 'row' }}>
                                                            <AnimatePresence>
                                                            {hoveredMsg === m.id && (
                                                                <motion.div initial={{ opacity: 0, scale: 0.85, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 4 }}
                                                                    transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                                                                    style={{ position: 'absolute', top: -40, [isMine ? 'left' : 'right']: 0, display: 'flex', gap: 2, background: '#fff', borderRadius: 99, boxShadow: '0 4px 18px rgba(0,0,0,0.14)', padding: '5px 10px', zIndex: 20, border: '1px solid rgba(0,0,0,0.07)' }}>
                                                                    {EMOJI_RXNS.map(emoji => (
                                                                        <motion.button key={emoji} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleReaction(m.id, emoji)}
                                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }}>
                                                                            {emoji}
                                                                        </motion.button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                            </AnimatePresence>
                                                            <div onMouseEnter={() => setHoveredMsg(m.id)} onMouseLeave={() => setHoveredMsg(null)}
                                                                style={{ maxWidth: '74%', padding: '9px 13px 8px',
                                                                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                                    background: isMine ? 'linear-gradient(135deg,#007AFF,#5856D6)' : '#F5F5F7',
                                                                    color: isMine ? '#fff' : '#1D1D1F',
                                                                    boxShadow: isMine ? '0 2px 12px rgba(0,122,255,0.22)' : '0 1px 3px rgba(0,0,0,0.07)',
                                                                    cursor: 'default' }}>
                                                                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</p>
                                                                <p style={{ fontSize: 9, margin: '4px 0 0', opacity: isMine ? 0.7 : 0.5, textAlign: isMine ? 'left' : 'right' }}>
                                                                    {isMine ? 'NextClass' : (selected.contactName || 'לקוח')}
                                                                    {m.tsNum > 10 ? ` · ${new Date(m.tsNum).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {Object.keys(rxnCounts).length > 0 && (
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                                                                {Object.entries(rxnCounts).map(([emoji, count]) => (
                                                                    <motion.button key={emoji} whileTap={{ scale: 0.9 }} onClick={() => handleReaction(m.id, emoji)}
                                                                        style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                        {emoji}{count > 1 && <span style={{ fontSize: 9, fontWeight: 800, color: '#6E6E73' }}>{count}</span>}
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {isMine && m.id === lastReadMsgId && (
                                                            <p style={{ fontSize: 9, color: '#34C759', fontWeight: 700, margin: '2px 0 0' }}>✓✓ נקרא</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <AnimatePresence>
                                            {selected.typingCustomer && (
                                                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                                    style={{ display: 'flex', justifyContent: 'flex-start' }} dir="rtl">
                                                    <div style={{ padding: '9px 14px', borderRadius: '18px 18px 18px 4px', background: '#F5F5F7', display: 'flex', gap: 4, alignItems: 'center' }}>
                                                        {[0,1,2].map(i => (
                                                            <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#AEAEB2', display: 'inline-block', animationName: 'ppDot', animationDuration: '1.4s', animationDelay: `${i*0.2}s`, animationIterationCount: 'infinite' }} />
                                                        ))}
                                                        <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 600, marginRight: 4 }}>{selected.contactName || 'לקוח'} מקליד</span>
                                                    </div>
                                                </motion.div>
                                            )}
                                            </AnimatePresence>
                                            <div ref={threadEndRef} />
                                        </div>
                                    );
                                })()}

                                {/* Message templates panel */}
                                <div style={{ borderRadius: 14, background: 'rgba(0,122,255,0.04)', border: '1px solid rgba(0,122,255,0.12)', padding: '10px 12px' }}>
                                    <p style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 800, letterSpacing: '0.08em', margin: '0 0 8px', textAlign: 'right' }}>תבניות הודעה מהירות</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                        {[
                                            { label: '👋 פתיחה', text: `שלום ${selected.contactName || 'לקוח'}, כאן אפרים מ-NextClass. קיבלנו את הבקשה שלך (${selected.id}) ואנחנו בטיפול. ניצור קשר בהקדם!` },
                                            { label: '💰 הצעת מחיר', text: `שלום ${selected.contactName || 'לקוח'}, הכנתי עבורך הצעת מחיר מותאמת עבור ${selected.institution || 'המוסד'}. שלח לי "אישור" כדי להמשיך.` },
                                            { label: '🔄 תזכורת', text: `שלום ${selected.contactName || 'לקוח'}, רציתי לעדכן לגבי ההצעה (${selected.id}) — האם יש שאלות נוספות? ננחמד לסגור 😊` },
                                            { label: '✅ אישור', text: `תודה רבה ${selected.contactName || ''}! ההזמנה (${selected.id}) אושרה ואנחנו בתהליך. נעדכן אותך בכל שלב.` },
                                            { label: '🚚 משלוח', text: `שלום ${selected.contactName || 'לקוח'}, ההזמנה שלך (${selected.id}) יצאה לדרך! ${selected.trackingInfo?.trackingNumber ? `מספר מעקב: ${selected.trackingInfo.trackingNumber}` : 'נשלח פרטי מעקב בקרוב.'}` },
                                            { label: '❓ פרטים', text: `שלום ${selected.contactName || 'לקוח'}, כדי להשלים את ההצעה עבור ${selected.institution || 'המוסד'} נשמח לקבל פרטים נוספים — כמות, תאריך דרוש?` },
                                        ].map((t, i) => (
                                            <motion.button key={i} whileTap={{ scale: 0.96 }} onClick={() => setThreadMsg(t.text)}
                                                style={{ padding: '8px 10px', borderRadius: 11, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,122,255,0.15)', cursor: 'pointer', fontFamily: 'Heebo,sans-serif', textAlign: 'right', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', display: 'block', marginBottom: 1 }}>{t.label}</span>
                                                <span style={{ fontSize: 10, color: '#86868B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t.text.slice(0, 45)}…</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                    {/* AI-detected suggestions */}
                                    {suggestions.length > 0 && (
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,122,255,0.10)' }}>
                                            <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 800, letterSpacing: '0.07em', alignSelf: 'center' }}>🤖 מותאם:</span>
                                            {suggestions.map((s, i) => (
                                                <motion.button key={i} whileTap={{ scale: 0.95 }} onClick={() => setThreadMsg(s.text)}
                                                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(88,86,214,0.09)', border: '1px solid rgba(88,86,214,0.18)', color: '#5856D6', fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}>
                                                    {s.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <textarea
                                        value={threadMsg}
                                        onChange={e => { setThreadMsg(e.target.value); if (e.target.value) handleAdminTyping(); }}
                                        placeholder="כתוב הודעה... (Enter לשליחה)"
                                        dir="rtl" rows={2}
                                        onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); if(threadMsg.trim()) handleSendThread(); } }}
                                        style={{ flex: 1, padding: '10px 14px', borderRadius: 18, fontSize: 13, fontWeight: 500, fontFamily: 'Heebo, sans-serif', outline: 'none', resize: 'none', lineHeight: 1.5, background: '#F5F5F7', border: '1.5px solid rgba(0,0,0,0.08)', direction: 'rtl', transition: 'border-color 0.15s' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.35)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'}
                                    />
                                    <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.05 }} onClick={handleSendThread}
                                        disabled={!threadMsg.trim() || threadSending}
                                        style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                            cursor: threadMsg.trim() ? 'pointer' : 'default',
                                            background: threadMsg.trim() ? 'linear-gradient(135deg,#007AFF,#5856D6)' : '#F0F0F5',
                                            boxShadow: threadMsg.trim() ? '0 2px 12px rgba(0,122,255,0.35)' : 'none',
                                        }}>
                                        <Send size={15} color={threadMsg.trim() ? '#fff' : '#C7C7CC'} />
                                    </motion.button>
                                </div>

                                <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                    <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', marginBottom: 8, textAlign: 'right' }}>הערה פנימית</p>
                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
                                        {['📞 דיברתי עם הלקוח', '💰 מחיר מוסכם', '📦 ממתין לאישור ספק', '⚠️ בעיה עם מלאי', '✅ הלקוח אישר'].map(t => (
                                            <motion.button key={t} whileTap={{ scale: 0.94 }}
                                                onClick={() => setNoteText(prev => prev ? `${prev} | ${t}` : t)}
                                                style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'rgba(88,86,214,0.07)', border: '1px solid rgba(88,86,214,0.14)', color: '#5856D6', fontWeight: 700, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                                {t}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input value={noteText} onChange={e => setNoteText(e.target.value)}
                                            placeholder="הערה לצוות..." dir="rtl"
                                            style={{ flex: 1, padding: '9px 14px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: 'rgba(88,86,214,0.04)', fontSize: 13, fontWeight: 500, color: '#1D1D1F', fontFamily: 'Heebo, sans-serif', outline: 'none' }}
                                            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                            onFocus={e => e.target.style.borderColor = 'rgba(88,86,214,0.35)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.09)'} />
                                        <AdminButton onClick={handleAddNote} disabled={!noteText.trim()}>שמור</AdminButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        </div>{/* end split view wrapper */}

                        {/* ══ DETAILS TAB ══ */}
                        {activeTab === 'details' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', marginBottom: 8, textAlign: 'right' }}>פרטי קשר</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[
                                            ['שם איש קשר', selected.contactName, () => navigate(`/admin/users?email=${encodeURIComponent(selected.email || selected.contactName || '')}`)],
                                            ['תפקיד', selected.contactRole, null],
                                            ['מוסד', selected.institution, null],
                                            ['סוג מוסד', selected.institutionType, null],
                                            ['טלפון', selected.phone, selected.phone ? () => window.open(`tel:${selected.phone}`) : null],
                                            ['מייל', selected.email, selected.email ? () => openEmailPreview('contact', selected) : null],
                                            ['אמצעי קשר מועדף', selected.preferredContact, null],
                                            ['זמן מועדף', selected.bestTime, null],
                                            ['טווח תקציב', selected.budgetRange, null],
                                            ['דחיפות', selected.urgency, null],
                                        ].filter(([, v]) => v).map(([l, v, onClick]) => (
                                            <div key={l} onClick={onClick || undefined}
                                                style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'right', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s' }}
                                                onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = 'rgba(0,122,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,122,255,0.2)'; } }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.025)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', margin: '0 0 3px' }}>{l}</p>
                                                <p style={{ fontSize: 13, fontWeight: 700, color: onClick ? '#007AFF' : '#1D1D1F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selected.items?.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', marginBottom: 8, textAlign: 'right' }}>פריטים בהצעה</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {selected.items.map((item, idx) => (
                                                <div key={idx} onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(item.title || item.name || '')}`)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'all 0.15s' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,122,255,0.18)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.025)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                                                    <img src={item.image || item.imageUrl} alt={item.title}
                                                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', background: '#F5F5F7', flexShrink: 0 }}
                                                        onError={(e) => {
                                                            if (!e.target.dataset.tried1) {
                                                                e.target.dataset.tried1 = 'true';
                                                                const orig = initialProducts.find(ip => String(ip.id) === String(item.id));
                                                                if (orig?.image) { e.target.src = orig.image; return; }
                                                            }
                                                            e.target.onerror = null;
                                                            e.target.src = IMG_FALLBACK;
                                                        }} />
                                                    <div style={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#007AFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                                                        <p style={{ fontSize: 11, color: '#86868B', margin: '2px 0 0' }}>כמות: {item.qty ?? item.quantity ?? 1} · ₪{(item.salePrice ?? item.price)?.toLocaleString()}</p>
                                                    </div>
                                                    <p style={{ fontSize: 13, fontWeight: 900, color: '#1D1D1F', flexShrink: 0 }}>₪{((item.salePrice ?? item.price) * (item.qty ?? item.quantity ?? 1)).toLocaleString()}</p>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px' }}>
                                                <span style={{ fontSize: 15, fontWeight: 900, color: '#007AFF' }}>₪{(selected.subtotal || 0).toLocaleString()}</span>
                                                <span style={{ fontSize: 12, color: '#86868B', fontWeight: 700 }}>סה"כ הצעה</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(selected.notes || selected.customerNote) && (
                                    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.18)', textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#34C759', letterSpacing: '0.09em', margin: '0 0 6px' }}>💬 הערות לקוח</p>
                                        {selected.notes && <p style={{ fontSize: 13, color: '#1D1D1F', margin: '0 0 4px', lineHeight: 1.6 }}>{selected.notes}</p>}
                                        {selected.customerNote && <p style={{ fontSize: 13, color: '#1D1D1F', margin: 0, lineHeight: 1.6 }}>{selected.customerNote}</p>}
                                    </div>
                                )}

                                {selected.shippingDetails?.address && (
                                    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(52,199,89,0.05)', border: '1px solid rgba(52,199,89,0.18)', textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#34C759', letterSpacing: '0.09em', margin: '0 0 8px' }}>📦 פרטי משלוח</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {[['נמען', selected.shippingDetails.deliveryName], ['טלפון', selected.shippingDetails.deliveryPhone], ['כתובת', selected.shippingDetails.address], ['עיר', selected.shippingDetails.city], ['אמצעי תשלום', selected.shippingDetails.paymentMethod], ['הערות', selected.shippingDetails.notes]].filter(([, v]) => v).map(([l, v]) => (
                                                <div key={l}>
                                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>{l}</p>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, textAlign: 'right' }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selected.supplierOrder?.supplierName && (
                                    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.18)', textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#0891B2', letterSpacing: '0.09em', margin: '0 0 8px' }}>🏭 הזמנה לספק</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {[['ספק', selected.supplierOrder.supplierName], ['מספר הזמנה', selected.supplierOrder.orderNumber], ['אספקה משוערת', selected.supplierOrder.estimatedDelivery], ['הערות', selected.supplierOrder.notes]].filter(([, v]) => v).map(([l, v]) => (
                                                <div key={l}>
                                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>{l}</p>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, textAlign: 'right' }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selected.trackingInfo?.trackingNumber && (
                                    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)', textAlign: 'right' }}>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', letterSpacing: '0.09em', margin: '0 0 8px' }}>🚚 מעקב משלוח</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {[['חברת שילוח', selected.trackingInfo.carrier], ['מספר מעקב', selected.trackingInfo.trackingNumber], ['אספקה צפויה', selected.trackingInfo.estimatedDelivery]].filter(([, v]) => v).map(([l, v]) => (
                                                <div key={l}>
                                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 2px', textAlign: 'right' }}>{l}</p>
                                                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0, textAlign: 'right' }}>{v}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selected.adminNotes?.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.09em', marginBottom: 8, textAlign: 'right' }}>הערות פנימיות</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {selected.adminNotes.map((n, i) => (
                                                <div key={i} style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(88,86,214,0.05)', border: '1px solid rgba(88,86,214,0.12)', textAlign: 'right' }}>
                                                    <p style={{ fontSize: 9, fontWeight: 800, color: '#5856D6', margin: '0 0 4px' }}>{n.date}</p>
                                                    <p style={{ fontSize: 12, color: '#1D1D1F', margin: 0, lineHeight: 1.55 }}>{n.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══ CUSTOMER 360 TAB ══ */}
                        {activeTab === 'c360' && (
                            <Customer360Panel quote={selected} allQuotes={quotes} onOpen={(q) => { setSelected(q); setNewStatus(''); setSaved(false); setNoteText(''); setActiveTab('pipeline'); }} navigate={navigate} />
                        )}

                        {/* ══ VERSIONS TAB ══ */}
                        {activeTab === 'versions' && (
                            <QuoteVersionsPanel quote={selected} updateQuoteFields={updateQuoteFields} showToast={showToast} />
                        )}

                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
                            <AdminButton variant="ghost" onClick={() => setSelected(null)}>סגור</AdminButton>
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* Email Preview Modal */}
            <AnimatePresence>
                {emailPreview && (
                    <EmailPreviewModal
                        type={emailPreview.type}
                        quote={emailPreview.quote}
                        html={previewHtml}
                        subject={previewSubject}
                        loading={previewLoading}
                        sending={previewSending}
                        onClose={() => setEmailPreview(null)}
                        onSend={handlePreviewSend}
                    />
                )}
            </AnimatePresence>

            {/* Reminder Modal */}
            <AnimatePresence>
                {reminderQuote && (
                    <ReminderModal
                        quote={reminderQuote}
                        onClose={() => setReminderQuote(null)}
                        onSave={handleSaveReminder}
                    />
                )}
            </AnimatePresence>
        </div>
        </>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// ORDERS (legacy / future paid orders)
// ════════════════════════════════════════════════════════════════════════════
function OrdersList() {
    const { orders, updateOrderStatus, inventory, deleteOrder } = useAdminData();
    const { showToast } = useAdminToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const savedFilters = (() => { try { return JSON.parse(sessionStorage.getItem('admin_orders_filters') || '{}'); } catch { return {}; } })();
    const [search, setSearch]             = useState(savedFilters.search || '');
    const [statusFilter, setStatusFilter] = useState(savedFilters.statusFilter || 'הכל');
    const [dateFilter, setDateFilter]     = useState(savedFilters.dateFilter || 'all');
    const [selected, setSelected]         = useState(null);
    const [newStatus, setNewStatus]       = useState('');
    const [saved, setSaved]               = useState(false);

    useEffect(() => {
        sessionStorage.setItem('admin_orders_filters', JSON.stringify({ search, statusFilter, dateFilter }));
    }, [search, statusFilter, dateFilter]);

    // Auto-open order from URL param ?orderId=xxx
    useEffect(() => {
        const id = searchParams.get('orderId');
        if (!id || !orders.length) return;
        const o = orders.find(o => o.id === id);
        if (o) setSelected(o);
    }, [searchParams, orders]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleQuickStatus = (orderId, status) => {
        updateOrderStatus(orderId, status);
        showToast(`סטטוס עודכן ל"${status}"`, 'success');
    };

    const filtered = useMemo(() => {
        let list = filterByDate([...orders], 'dateTs', dateFilter).sort((a, b) => b.dateTs - a.dateTs);
        if (statusFilter !== 'הכל') list = list.filter(o => o.status === statusFilter);
        if (search) list = list.filter(o =>
            (o.customer || '').includes(search) ||
            (o.id || '').includes(search) ||
            (o.product || '').includes(search) ||
            (o.city || '').includes(search)
        );
        return list;
    }, [orders, search, statusFilter, dateFilter]);

    const totalRevenue = useMemo(() => filtered.reduce((s, o) => s + (o.total || 0), 0), [filtered]);

    const stats = useMemo(() => ({
        new:       orders.filter(o => o.status === 'חדש').length,
        pending:   orders.filter(o => o.status === 'ממתין').length,
        shipped:   orders.filter(o => o.status === 'נשלח').length,
        delivered: orders.filter(o => o.status === 'נמסר').length,
    }), [orders]);

    const handleStatusChange = () => {
        if (!newStatus || !selected) return;
        updateOrderStatus(selected.id, newStatus);
        setSelected(prev => ({ ...prev, status: newStatus }));
        setSaved(true);
        setTimeout(() => { setSaved(false); setNewStatus(''); }, 1200);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="חדשות" value={stats.new} color="#FF3B30" Icon={AlertCircle}
                    tooltip="הזמנות חדשות שנקלטו ועדיין לא טופלו." />
                <Stat label="ממתינות" value={stats.pending} color="#FF9500" Icon={Bell}
                    tooltip="הזמנות באישור — ממתינות לאישור פנימי לפני שילוח." />
                <Stat label="נשלחו" value={stats.shipped} color="#5856D6" Icon={Package}
                    tooltip="הזמנות שיצאו לשילוח — בדרך ללקוח." />
                <Stat label="נמסרו" value={stats.delivered} color="#34C759" Icon={CheckCircle2}
                    tooltip="הזמנות שנמסרו בהצלחה ללקוח." />
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1">
                    <AdminSearchBar value={search} onChange={setSearch} placeholder="חיפוש לפי לקוח, מספר הזמנה, מוצר, עיר..." />
                </div>
                <div className="flex flex-wrap gap-3">
                    <AdminFilterPills options={ORDER_STATUSES} active={statusFilter} onChange={setStatusFilter} />
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />
                </div>
            </div>

            <div className="space-y-3 mt-4">
                {filtered.length > 0 && (
                    <div className="hidden lg:grid grid-cols-[auto_1fr_2fr_1fr_auto_auto_auto] gap-4 px-6 py-2 text-right">
                        {['', 'מס׳ / תאריך', 'לקוח / מוצר', 'סה״כ', 'סטטוס', '', ''].map((h, i) => (
                            <p key={i} className="text-[10px] font-black tracking-[0.18em] text-[#AEAEB2]">{h}</p>
                        ))}
                    </div>
                )}

                <AnimatePresence>
                    {filtered.map((order, i) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.02, type: 'spring', stiffness: 320, damping: 28 }}
                            onClick={() => { setSelected(order); setNewStatus(''); setSaved(false); }}
                            className="grid grid-cols-[auto_1fr_2fr_1fr_auto_auto_auto] gap-4 px-6 py-4 rounded-[20px] cursor-pointer transition-all items-center bg-white/60 hover:bg-white border border-black/04 hover:border-[#007AFF]/20 hover:shadow-[0_12px_40px_rgba(0,122,255,0.08)] group"
                        >
                            <Avatar name={order.customer} />
                            <div className="text-right">
                                <p className="text-[#007AFF] font-black text-xs group-hover:text-[#5856D6] transition-colors">{order.id}</p>
                                <p className="text-[#AEAEB2] text-[10px] mt-0.5">{order.date}</p>
                            </div>
                            <div className="text-right min-w-0">
                                <p className="text-[#007AFF] font-bold text-sm truncate hover:underline"
                                    onClick={e => { e.stopPropagation(); navigate(`/admin/customers?search=${encodeURIComponent(order.customer)}`); }}>
                                    {order.customer}
                                </p>
                                <p className="text-[#AEAEB2] text-[10px] truncate hover:text-[#007AFF] transition-colors cursor-pointer"
                                    onClick={e => { e.stopPropagation(); navigate(`/admin/inventory?open=${encodeURIComponent(order.product)}`); }}>
                                    {order.product} · {order.qty} יח׳
                                </p>
                            </div>
                            <p className="text-[#1D1D1F] font-black text-sm">₪{(order.total || 0).toLocaleString()}</p>
                            <QuickDropdown item={order} statuses={ORDER_STATUSES} colors={ORDER_STATUS_COLORS} onUpdate={handleQuickStatus} />
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                {order.status !== 'אושר' && order.status !== 'נמסר' && order.status !== 'בוטל' && (
                                    <motion.button whileTap={{ scale: 0.88 }}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, 'אושר'); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#34C759,#30D158)', boxShadow: '0 2px 8px rgba(52,199,89,0.35)' }}>
                                        אשר
                                    </motion.button>
                                )}
                                {order.status !== 'בוטל' && (
                                    <motion.button whileTap={{ scale: 0.88 }}
                                        onClick={(e) => { e.stopPropagation(); handleQuickStatus(order.id, 'בוטל'); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white transition-all"
                                        style={{ background: 'linear-gradient(135deg,#FF3B30,#FF453A)', boxShadow: '0 2px 8px rgba(255,59,48,0.30)' }}>
                                        בטל
                                    </motion.button>
                                )}
                            </div>
                            <motion.span whileHover={{ x: -3 }} className="text-[#AEAEB2] group-hover:text-[#007AFF] text-xs font-bold shrink-0 transition-colors">←</motion.span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-3 text-[#AEAEB2]">
                        <Package size={40} className="opacity-30" />
                        <p className="text-sm font-bold text-[#6E6E73]">אין הזמנות תואמות לחיפוש</p>
                    </div>
                )}
            </div>

            {filtered.length > 0 && (
                <div className="flex justify-between items-center px-1">
                    <span className="text-[#1D1D1F] font-black text-base">₪{totalRevenue.toLocaleString()}</span>
                    <span className="text-[#86868B] text-sm">{filtered.length} הזמנות מוצגות</span>
                </div>
            )}

            <AdminModal open={!!selected} onClose={() => setSelected(null)} title={`הזמנה ${selected?.id || ''}`} size="md">
                {selected && (
                    <div className="space-y-5" dir="rtl">
                        {selected.status !== 'בוטל' && (
                            <div className="rounded-2xl p-4"
                                style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.10)' }}>
                                <p className="text-[#86868B] text-[10px] font-black tracking-widest mb-2 text-right">מצב הזמנה</p>
                                <StatusTimeline status={selected.status} flow={ORDER_STATUS_FLOW} colors={ORDER_STATUS_COLORS} />
                            </div>
                        )}
                        <div className="flex gap-4">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[#F5F5F7] shrink-0 border border-black/04 flex items-center justify-center">
                                {(() => {
                                    const inv = inventory.find(p => String(p.id) === String(selected.productId));
                                    const backup = initialProducts.find(p => String(p.id) === String(selected.productId));
                                    const img = selected.productImage || inv?.image || backup?.image;
                                    return img ? <img src={img} alt={selected.product} className="w-full h-full object-cover" /> : <Box size={32} className="text-[#AEAEB2] opacity-40" />;
                                })()}
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                {[
                                    ['לקוח', selected.customer], ['עיר', selected.city],
                                    ['טלפון', selected.phone], ['מייל', selected.email],
                                    ['מוצר', selected.product], ['כמות', selected.qty],
                                    ['תאריך', selected.date], ['סה״כ', `₪${(selected.total || 0).toLocaleString()}`],
                                ].map(([l, v]) => (
                                    <div key={l} className="text-right p-3 rounded-xl"
                                        style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <p className="text-[#AEAEB2] text-[10px] font-black tracking-widest">{l}</p>
                                        <p className="text-[#1D1D1F] font-bold text-sm mt-0.5 truncate">{v || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-black/06 pt-4">
                            <p className="text-[#86868B] text-[10px] font-black tracking-widest mb-3 text-right">עדכן סטטוס</p>
                            <div className="flex flex-wrap gap-2 mb-3 justify-end">
                                {ORDER_STATUSES.slice(1).map(s => (
                                    <button key={s} type="button" onClick={() => setNewStatus(s)}
                                        className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                                        style={{
                                            background: newStatus === s ? ORDER_STATUS_COLORS[s] : 'rgba(0,0,0,0.06)',
                                            color: newStatus === s ? 'white' : '#6E6E73',
                                            boxShadow: newStatus === s ? `0 4px 12px ${ORDER_STATUS_COLORS[s]}40` : 'none',
                                        }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-between">
                                <motion.button whileTap={{ scale: 0.95 }}
                                    onClick={() => { if (window.confirm('למחוק את ההזמנה לצמיתות?')) { deleteOrder(selected.id); setSelected(null); showToast('ההזמנה נמחקה', 'success'); } }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,59,48,0.18)', background: 'rgba(255,59,48,0.06)', color: '#FF3B30', cursor: 'pointer', fontSize: 12, fontWeight: 800 }}>
                                    <Trash2 size={13} />מחק הזמנה
                                </motion.button>
                                <div className="flex gap-2">
                                    <AdminButton variant="ghost" onClick={() => setSelected(null)}>סגור</AdminButton>
                                    <AdminButton onClick={handleStatusChange} disabled={!newStatus}>
                                        {saved ? '✓ עודכן!' : 'עדכן סטטוס'}
                                    </AdminButton>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — tab toggle between quotes and orders
// ════════════════════════════════════════════════════════════════════════════
// ─── Trash Tab ────────────────────────────────────────────────────────────────
function TrashTab() {
    const { deletedItems, restoreOrder, hardDeleteOrder, restoreQuote, hardDeleteQuote } = useAdminData();
    const { showToast } = useAdminToast();
    const [section, setSection] = useState('quotes');

    const items = section === 'quotes' ? deletedItems.quotes : deletedItems.orders;
    const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

    const handleRestore = async (id) => {
        if (section === 'quotes') { await restoreQuote(id); showToast('ההצעה שוחזרה', 'success'); }
        else { await restoreOrder(id); showToast('ההזמנה שוחזרה', 'success'); }
    };
    const handleHardDelete = async (id) => {
        if (!window.confirm('למחוק לצמיתות? לא ניתן לשחזר.')) return;
        if (section === 'quotes') { await hardDeleteQuote(id); showToast('נמחק לצמיתות', 'success'); }
        else { await hardDeleteOrder(id); showToast('נמחק לצמיתות', 'success'); }
    };

    return (
        <div className="space-y-4" dir="rtl">
            <div className="flex gap-2">
                {[{ id: 'quotes', label: 'הצעות מחיר' }, { id: 'orders', label: 'הזמנות' }].map(s => (
                    <button key={s.id} onClick={() => setSection(s.id)}
                        className="px-4 py-2 rounded-xl text-sm font-black transition-all cursor-pointer"
                        style={section === s.id ? { background: '#1D1D1F', color: '#fff' } : { background: 'rgba(0,0,0,0.05)', color: '#6E6E73' }}>
                        {s.label} {section === s.id ? `(${items.length})` : `(${s.id === 'quotes' ? deletedItems.quotes.length : deletedItems.orders.length})`}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 text-[#AEAEB2] text-sm font-semibold">סל המחזור ריק</div>
            ) : items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F' }}>
                            {section === 'quotes' ? (item.contactName || item.institution || item.name || item.id) : (item.customer || item.id)}
                        </div>
                        <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 2 }}>
                            {section === 'quotes' ? item.status : item.status} · נמחק {fmtDate(item.deletedAt)}
                        </div>
                    </div>
                    {(item.total || item.estimatedValue) > 0 && (
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1F' }}>
                            ₪{Number(item.total || item.estimatedValue || 0).toLocaleString()}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleRestore(item.id)}
                            style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(52,199,89,0.1)', color: '#34C759', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                            שחזר
                        </button>
                        <button onClick={() => handleHardDelete(item.id)}
                            style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,59,48,0.08)', color: '#FF3B30', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                            מחק לצמיתות
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// FULFILLMENT TAB — הספקה
// ════════════════════════════════════════════════════════════════════════════
function FulfillmentTab() {
    const { quotes, updateQuoteStatus, updateQuoteFields } = useAdminData();
    const { showToast } = useAdminToast();
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [ftEmailPreview, setFtEmailPreview]     = useState(null);
    const [ftPreviewHtml, setFtPreviewHtml]       = useState('');
    const [ftPreviewSubject, setFtPreviewSubject] = useState('');
    const [ftPreviewLoading, setFtPreviewLoading] = useState(false);
    const [ftPreviewSending, setFtPreviewSending] = useState(false);

    const openFtEmailPreview = async (type, quote) => {
        if (!quote?.email) { showToast('אין כתובת מייל ללקוח', 'error'); return; }
        setFtEmailPreview({ type, quote });
        setFtPreviewHtml(''); setFtPreviewSubject(''); setFtPreviewLoading(true);
        try {
            const res = await fetch('/api/send-stage-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, quote, preview: true }),
            });
            if (res.ok) { const d = await res.json(); setFtPreviewHtml(d.html || ''); setFtPreviewSubject(d.subject || ''); }
            else { showToast('שגיאה בטעינת תצוגה', 'error'); setFtEmailPreview(null); }
        } catch { showToast('שגיאה בטעינת תצוגה', 'error'); setFtEmailPreview(null); }
        finally { setFtPreviewLoading(false); }
    };

    const handleFtPreviewSend = async () => {
        if (!ftEmailPreview) return;
        setFtPreviewSending(true);
        try {
            const res = await fetch('/api/send-stage-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: ftEmailPreview.type, quote: ftEmailPreview.quote }),
            });
            if (res.ok) { showToast('מייל נשלח ✓', 'success'); setFtEmailPreview(null); }
            else showToast('שגיאה בשליחת מייל', 'error');
        } catch { showToast('שגיאה בשליחת מייל', 'error'); }
        finally { setFtPreviewSending(false); }
    };

    const activeItems = useMemo(() => {
        let list = quotes.filter(q => ['הועבר לספק', 'בדרך', 'סופק'].includes(q.status))
              .sort((a, b) => b.dateTs - a.dateTs);
        if (search) list = list.filter(q =>
            (q.contactName || '').includes(search) ||
            (q.institution || '').includes(search) ||
            (q.id || '').includes(search) ||
            (q.supplierOrder?.supplierName || '').includes(search)
        );
        return list;
    }, [quotes, search]);

    const statusColor = { 'הועבר לספק': '#0891B2', 'בדרך': '#7C3AED', 'סופק': '#1DB954' };
    const statusIcon  = { 'הועבר לספק': '📦', 'בדרך': '🚚', 'סופק': '✅' };

    const handleMarkDelivered = async (q) => {
        await updateQuoteStatus(q.id, 'סופק');
        showToast('סומן כסופק ✓', 'success');
    };

    const copyTrackingInfo = (q) => {
        const ti = q.trackingInfo || {};
        const sd = q.shippingDetails || {};
        const text = [
            `📦 פרטי משלוח — הזמנה ${q.id}`,
            `לקוח: ${q.contactName || '—'} | ${q.institution || '—'}`,
            `כתובת: ${sd.address || '—'}, ${sd.city || ''}${sd.zip ? ` ${sd.zip}` : ''}`,
            `טלפון: ${sd.deliveryPhone || q.phone || '—'}`,
            ti.trackingNumber ? `מעקב: ${ti.trackingNumber}` : '',
            ti.carrier ? `חברת שילוח: ${ti.carrier}` : '',
            ti.estimatedDelivery ? `אספקה צפויה: ${ti.estimatedDelivery}` : '',
        ].filter(Boolean).join('\n');
        navigator.clipboard?.writeText(text).then(() => showToast('הועתק ✓', 'success'));
    };

    return (
        <>
        <div className="space-y-5" dir="rtl">
            {/* Search */}
            <div style={{ position: 'relative' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי לקוח, מוסד, מספר הזמנה, ספק..." dir="rtl"
                    style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 13, fontWeight: 500, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.35)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.09)'} />
                {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#AEAEB2' }}>×</button>}
            </div>
            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                    { label: 'הועבר לספק', color: '#0891B2', count: activeItems.filter(q => q.status === 'הועבר לספק').length },
                    { label: 'בדרך',        color: '#7C3AED', count: activeItems.filter(q => q.status === 'בדרך').length },
                    { label: 'סופקו',       color: '#1DB954', count: activeItems.filter(q => q.status === 'סופק').length },
                ].map(s => (
                    <div key={s.label} style={{ borderRadius: 18, padding: '14px 16px', background: `linear-gradient(145deg,${s.color}10,rgba(255,255,255,0.94))`, border: `1px solid ${s.color}22`, boxShadow: `0 4px 20px ${s.color}10`, textAlign: 'right' }}>
                        <p style={{ fontSize: 26, fontWeight: 900, color: s.color, margin: '0 0 4px', lineHeight: 1 }}>{s.count}</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#86868B', margin: 0 }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {activeItems.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-16 flex flex-col items-center gap-4" dir="rtl">
                    <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg,rgba(124,58,237,0.10),rgba(8,145,178,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                        {search ? '🔍' : '🚚'}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>{search ? 'לא נמצאו תוצאות' : 'אין הזמנות בהספקה'}</p>
                    <p style={{ fontSize: 13, color: '#86868B', margin: 0, textAlign: 'center', maxWidth: 280 }}>
                        {search ? `נסה חיפוש אחר` : 'הזמנות שהועברו לספק יופיעו כאן'}
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {activeItems.map((q, i) => {
                            const ti = q.trackingInfo || {};
                            const sd = q.shippingDetails || {};
                            const so = q.supplierOrder || {};
                            const daysLeft = ti.estimatedDelivery
                                ? Math.ceil((new Date(ti.estimatedDelivery) - Date.now()) / 86400000)
                                : null;
                            const col = statusColor[q.status] || '#007AFF';
                            return (
                                <motion.div key={q.id}
                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    style={{ borderRadius: 20, background: '#fff', border: `1px solid ${col}25`, boxShadow: `0 4px 20px ${col}08`, overflow: 'hidden' }}>

                                    {/* Top accent */}
                                    <div style={{ height: 3, background: `linear-gradient(90deg,${col},${col}80)` }} />

                                    <div style={{ padding: '16px 20px' }}>
                                        {/* Row 1: ID + status + action */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                {q.status !== 'סופק' && (
                                                    <motion.button whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleMarkDelivered(q)}
                                                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: 'rgba(29,185,84,0.10)', color: '#1DB954' }}>
                                                        🎉 סופק
                                                    </motion.button>
                                                )}
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => copyTrackingInfo(q)}
                                                    style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: 'rgba(0,0,0,0.03)', color: '#6E6E73' }}>
                                                    📋 העתק
                                                </motion.button>
                                                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelected(selected?.id === q.id ? null : q)}
                                                    style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', fontSize: 11, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: 'rgba(0,0,0,0.03)', color: '#007AFF' }}>
                                                    {selected?.id === q.id ? 'סגור ▲' : 'פרטים ▼'}
                                                </motion.button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: `${col}15`, color: col }}>{statusIcon[q.status]} {q.status}</span>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: '#007AFF', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,122,255,0.3)' }} onClick={() => navigate(`/admin/orders?quoteId=${q.id}`)}>{q.id}</span>
                                                <CopyBtn text={q.id} />
                                            </div>
                                        </div>

                                        {/* Row 2: customer + address + tracking */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'right' }}>
                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 4px', letterSpacing: '0.08em' }}>לקוח</p>
                                                <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F', margin: 0, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.18)' }} onClick={() => navigate(`/admin/users?email=${encodeURIComponent(q.email || q.contactName || '')}`)}>{q.contactName || '—'}</p>
                                                <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>{q.institution || ''}</p>
                                                {q.phone && <p style={{ fontSize: 11, color: '#007AFF', margin: '3px 0 0', fontWeight: 700 }}>{q.phone}</p>}
                                            </div>
                                            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'right' }}>
                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 4px', letterSpacing: '0.08em' }}>כתובת למשלוח</p>
                                                {sd.address ? (
                                                    <>
                                                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', margin: 0 }}>{sd.address}</p>
                                                        <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>{sd.city}{sd.zip ? ` ${sd.zip}` : ''}</p>
                                                        {sd.deliveryName && <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>נמען: {sd.deliveryName}</p>}
                                                    </>
                                                ) : <p style={{ fontSize: 12, color: '#AEAEB2', margin: 0 }}>לא הוזן</p>}
                                            </div>
                                            <div style={{ padding: '10px 12px', borderRadius: 12, background: ti.trackingNumber ? `rgba(124,58,237,0.06)` : 'rgba(0,0,0,0.025)', border: `1px solid ${ti.trackingNumber ? 'rgba(124,58,237,0.18)' : 'rgba(0,0,0,0.06)'}`, textAlign: 'right' }}>
                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 4px', letterSpacing: '0.08em' }}>מעקב משלוח</p>
                                                {ti.trackingNumber ? (
                                                    <>
                                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', margin: 0 }}>{ti.trackingNumber}</p>
                                                        {ti.carrier && <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>{ti.carrier}</p>}
                                                        {daysLeft !== null && (
                                                            <p style={{ fontSize: 11, fontWeight: 800, margin: '3px 0 0', color: daysLeft < 0 ? '#FF3B30' : daysLeft === 0 ? '#34C759' : '#7C3AED' }}>
                                                                {daysLeft < 0 ? `⚠️ עיכוב ${Math.abs(daysLeft)}י׳` : daysLeft === 0 ? '📦 מגיע היום!' : `📅 עוד ${daysLeft} י׳`}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : <p style={{ fontSize: 12, color: '#AEAEB2', margin: 0 }}>לא הוזן</p>}
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        <AnimatePresence>
                                            {selected?.id === q.id && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        {/* Supplier info */}
                                                        {so.supplierName && (
                                                            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.15)', textAlign: 'right' }}>
                                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#0891B2', margin: '0 0 4px', letterSpacing: '0.08em' }}>🏭 ספק</p>
                                                                <p style={{ fontSize: 13, fontWeight: 800, color: '#0891B2', margin: 0, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(8,145,178,0.3)' }} onClick={() => navigate(`/admin/suppliers?search=${encodeURIComponent(so.supplierName)}`)}>{so.supplierName}</p>
                                                                {so.orderNumber && <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>הזמנה: {so.orderNumber}</p>}
                                                                {so.estimatedDelivery && <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>אספקה: {so.estimatedDelivery}</p>}
                                                            </div>
                                                        )}
                                                        {/* Items */}
                                                        {(q.items || []).length > 0 && (
                                                            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'right' }}>
                                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#AEAEB2', margin: '0 0 6px', letterSpacing: '0.08em' }}>פריטים ({q.items.length})</p>
                                                                {q.items.map((it, ii) => (
                                                                    <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                                        {it.image && <img src={it.image} alt="" style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />}
                                                                        <button onClick={() => navigate(`/admin/inventory?open=${encodeURIComponent(it.title || it.name || '')}`)}
                                                                            style={{ fontSize: 11, color: '#1D1D1F', margin: 0, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Heebo,sans-serif', textDecoration: 'underline', textDecorationColor: 'rgba(0,0,0,0.18)' }}>
                                                                            {it.title || it.name} ×{it.qty ?? it.quantity ?? 1}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <p style={{ fontSize: 13, fontWeight: 900, color: '#007AFF', margin: '6px 0 0' }}>₪{(q.subtotal || 0).toLocaleString()}</p>
                                                            </div>
                                                        )}
                                                        {/* Company info */}
                                                        <div style={{ gridColumn: 'span 2', padding: '10px 12px', borderRadius: 12, background: 'rgba(0,122,255,0.04)', border: '1px solid rgba(0,122,255,0.12)', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                {q.phone && (
                                                                    <a href={`https://wa.me/972${q.phone.replace(/^0/,'').replace(/-/g,'')}`} target="_blank" rel="noopener noreferrer"
                                                                        style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(37,211,102,0.12)', color: '#128C7E', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                                                                        📱 WA
                                                                    </a>
                                                                )}
                                                                {q.email && (
                                                                    <>
                                                                        <button onClick={() => openFtEmailPreview('in_transit', q)}
                                                                            style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                                                            ✉️ מייל משלוח
                                                                        </button>
                                                                        {q.status === 'סופק' && (
                                                                            <button onClick={() => openFtEmailPreview('delivered', q)}
                                                                                style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(29,185,84,0.10)', color: '#1DB954', fontSize: 11, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                                                                🎉 מייל אספקה
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: 9, fontWeight: 800, color: '#007AFF', margin: '0 0 2px', letterSpacing: '0.08em' }}>NextClass</p>
                                                                <p style={{ fontSize: 11, color: '#6E6E73', margin: 0 }}>058-585-6356 · nextclass.en@gmail.com</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>

        {/* FulfillmentTab Email Preview Modal */}
        <AnimatePresence>
            {ftEmailPreview && (
                <EmailPreviewModal
                    type={ftEmailPreview.type}
                    quote={ftEmailPreview.quote}
                    html={ftPreviewHtml}
                    subject={ftPreviewSubject}
                    loading={ftPreviewLoading}
                    sending={ftPreviewSending}
                    onClose={() => setFtEmailPreview(null)}
                    onSend={handleFtPreviewSend}
                />
            )}
        </AnimatePresence>
        </>
    );
}

const TABS = [
    { id: 'quotes',      label: 'הצעות מחיר', Icon: FileText },
    { id: 'orders',      label: 'הזמנות',     Icon: Package },
    { id: 'fulfillment', label: 'הספקה',       Icon: Truck },
    { id: 'trash',       label: 'סל מחזור',   Icon: Trash2 },
];

export default function AdminOrders() {
    const { quotes, orders, deletedItems } = useAdminData();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState('quotes');
    const [showCmdK, setShowCmdK] = useState(false);
    const trashCount = (deletedItems.orders?.length || 0) + (deletedItems.quotes?.length || 0);

    useEffect(() => {
        if (searchParams.get('quoteId') || searchParams.get('orderId')) {
            setTab(searchParams.get('quoteId') ? 'quotes' : 'orders');
        }
    }, [searchParams]);

    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCmdK(s => !s); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const fulfillmentCount = quotes.filter(q => ['הועבר לספק', 'בדרך'].includes(q.status)).length;

    const subtitles = {
        quotes:      `${quotes.length} בקשות · ${quotes.filter(q => q.status === 'חדש').length} חדשות`,
        orders:      `${orders.length} הזמנות · ₪${orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString()} הכנסה כוללת`,
        fulfillment: fulfillmentCount > 0 ? `${fulfillmentCount} הזמנות בדרך ללקוח` : 'כל ההזמנות סופקו',
        trash:       trashCount > 0 ? `${trashCount} פריטים בסל` : 'הסל ריק',
    };

    const titleMap = { quotes: 'הצעות מחיר', orders: 'הזמנות', fulfillment: 'הספקה', trash: 'סל מחזור' };

    return (
        <div dir="rtl" className="space-y-5">
            <AdminSectionHeader title={titleMap[tab] || 'הזמנות'} subtitle={subtitles[tab]} />

            {/* Tab toggle + Cmd+K search */}
            <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex p-1 rounded-2xl gap-1 w-fit" style={glass}>
                {TABS.map(t => {
                    const isActive = tab === t.id;
                    const bgColor = t.id === 'trash' ? '#FF3B30' : t.id === 'fulfillment' ? '#7C3AED' : '#007AFF';
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 cursor-pointer"
                            style={isActive
                                ? { background: bgColor, color: 'white', boxShadow: `0 4px 14px ${bgColor}55` }
                                : { color: '#86868B' }}>
                            <t.Icon size={14} />
                            {t.label}
                            {(t.id === 'quotes' || t.id === 'orders') && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)' }}>
                                    {t.id === 'quotes' ? quotes.length : orders.length}
                                </span>
                            )}
                            {t.id === 'fulfillment' && fulfillmentCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(124,58,237,0.12)', color: isActive ? 'inherit' : '#7C3AED' }}>
                                    {fulfillmentCount}
                                </span>
                            )}
                            {t.id === 'trash' && trashCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                                    style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,59,48,0.12)', color: isActive ? 'inherit' : '#FF3B30' }}>
                                    {trashCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCmdK(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.09)', background: 'rgba(0,0,0,0.03)', fontSize: 12, fontWeight: 700, color: '#6E6E73', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                🔍 חיפוש
                <kbd style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,0,0,0.06)', color: '#86868B', fontWeight: 700 }}>⌘K</kbd>
            </motion.button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}>
                    {tab === 'quotes' ? <QuotesPipeline /> : tab === 'orders' ? <OrdersList /> : tab === 'fulfillment' ? <FulfillmentTab /> : <TrashTab />}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {showCmdK && (
                    <CmdKSearch
                        quotes={quotes}
                        orders={orders}
                        onSelectQuote={() => { setShowCmdK(false); setTab('quotes'); }}
                        onClose={() => setShowCmdK(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
