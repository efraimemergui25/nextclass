import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, query, orderBy, onSnapshot,
    doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useSettings } from '../../context/SettingsContext';
import {
    MessageSquare, Mail, Phone, User, Building2, Hash,
    FileText, Edit2, Trash2, Plus, Send, X, ChevronDown,
    Package, DollarSign, Scale, Wallet, StickyNote,
    CheckCircle2, Clock, AlertCircle
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────


const STATUSES = {
    'חדש':          { color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    'בטיפול':       { color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
    'הוצעה מחיר':   { color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    'ממתין לאישור': { color: '#0891B2', bg: '#ECFEFF', dot: '#06B6D4' },
    'סגור - זכה':   { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
    'סגור - הפסיד': { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

const CHANNELS = [
    { id: 'whatsapp', label: 'WhatsApp', color: '#25D366', bg: '#F0FFF4', Icon: MessageSquare },
    { id: 'email',    label: 'מייל',     color: '#2563EB', bg: '#EFF6FF', Icon: Mail },
];

const DEFAULT_TEMPLATES = [
    {
        id: 'tpl_first_contact',
        name: 'מגע ראשון',
        channel: 'whatsapp',
        status: 'חדש',
        body: 'שלום {{שם}},\nכאן אפרים מ-NextClass. קיבלתי את הבקשה שלך עבור {{מוסד}} (מספר הזמנה: {{הזמנה}}) ואשמח לסייע.\nמה הזמן הנוח ביותר לשיחה קצרה של 10 דקות?',
        subject: '',
    },
    {
        id: 'tpl_followup',
        name: 'מעקב',
        channel: 'whatsapp',
        status: 'בטיפול',
        body: 'שלום {{שם}},\nאני ממשיך לטפל בהצעה עבור {{מוסד}}.\nהאם קיבלת את הפרטים ששלחתי? אשמח לתאם שיחה קצרה ולוודא שהכל מתאים לצרכים שלכם.\nנוח לך מחר בין 10:00–12:00?',
        subject: '',
    },
    {
        id: 'tpl_send_quote',
        name: 'שליחת הצעת מחיר',
        channel: 'email',
        status: 'הוצעה מחיר',
        subject: 'הצעת מחיר עבור {{מוסד}} — הזמנה {{הזמנה}} | NextClass',
        body: 'שלום {{שם}},\n\nתודה על פנייתך. מצורפת הצעת המחיר שהכנו עבור {{מוסד}}:\n\n[פירוט פריטים ייוסף כאן]\n\nסכום כולל: {{סכום}}\n\nההצעה תקפה ל-14 יום. נשמח לענות על כל שאלה ולהתאים את ההצעה לדרישות הספציפיות שלכם.\n\nבברכה,\nאפרים אמרגי\nNextClass · {{טלפון}}',
    },
    {
        id: 'tpl_awaiting',
        name: 'ממתין לאישור',
        channel: 'whatsapp',
        status: 'ממתין לאישור',
        body: 'שלום {{שם}},\nשלחתי לך הצעת מחיר עבור {{מוסד}} ({{הזמנה}}) לפני מספר ימים.\nכדי לשמור על המחירים ועל הזמינות, ההצעה תקפה עד סוף השבוע.\nנשמח לסגור ולתחיל בתכנון ההתקנה — מתי נוח לשיחה קצרה לסיכום?',
        subject: '',
    },
    {
        id: 'tpl_won',
        name: 'סגירת עסקה — תודה',
        channel: 'whatsapp',
        status: 'סגור - זכה',
        body: 'שלום {{שם}},\nתודה רבה על האמון! שמחים מאד לשתף פעולה עם {{מוסד}}.\nנציג שלנו יצור איתך קשר תוך 48 שעות לתיאום לוח זמנים לאספקה והתקנה.\nצוות NextClass תמיד כאן לכל שאלה.',
        subject: '',
    },
    {
        id: 'tpl_needs_assessment',
        name: 'גילוי צרכים',
        channel: 'email',
        status: 'בטיפול',
        subject: 'שיחת גילוי צרכים — {{מוסד}} | NextClass',
        body: 'שלום {{שם}},\n\nנעים מאד, אפרים מ-NextClass.\n\nכדי שנוכל להכין עבורכם הצעה מדויקת ומותאמת לצרכי {{מוסד}}, אשמח אם תוכל/י לענות על מספר שאלות קצרות:\n\n1. כמה כיתות / חללים מיועדים לציוד?\n2. מהו לוח הזמנים הרצוי לאספקה?\n3. האם קיים תקציב מאושר כבר, או שנדרש תהליך הגשה?\n4. האם יש ספקים אחרים שאיתם השוויתם?\n\nנשמח לתאם שיחה קצרה לפגישת גילוי צרכים — מה הזמן הנוח?\n\nבברכה,\nאפרים אמרגי\nNextClass · {{טלפון}}',
    },
    {
        id: 'tpl_pilot_offer',
        name: 'הצעת פיילוט',
        channel: 'email',
        status: 'בטיפול',
        subject: 'הצעת פיילוט ללא התחייבות — {{מוסד}} | NextClass',
        body: 'שלום {{שם}},\n\nאנחנו מבינים שהחלטה על ציוד לימודי היא משמעותית, ולכן אנחנו מציעים ל-{{מוסד}} להתחיל בפיילוט:\n\n— התקנה בכיתה אחת ללא עלות לחודש ניסיון\n— ליווי מלא של צוות NextClass\n— אפשרות להרחבה בתנאים מועדפים לאחר הניסיון\n\nאין מחויבות — רק הזדמנות לראות את המוצר בפעולה.\n\nאשמח לשמוע אם זה מסלול שמתאים לכם.\n\nבברכה,\nאפרים אמרגי\nNextClass · {{טלפון}}',
    },
];

// ── Glass style ───────────────────────────────────────────────────────────────

const GLASS = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(255,255,255,0.75)',
    boxShadow: '0 4px 28px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
    borderRadius: 22,
};

// ── Variable substitution ─────────────────────────────────────────────────────

function fillTemplate(text, lead, bizPhone) {
    const firstName = (lead?.contactName || '').split(' ')[0] || '—';
    const total = lead?.subtotal
        ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}`
        : '—';
    return (text || '')
        .replace(/\{\{שם\}\}/g,      firstName)
        .replace(/\{\{מוסד\}\}/g,    lead?.institution || '—')
        .replace(/\{\{הזמנה\}\}/g,   lead?.id || '—')
        .replace(/\{\{סכום\}\}/g,    total)
        .replace(/\{\{טלפון\}\}/g,   bizPhone || '058-5856356');
}

// ── StatusDot ─────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
    const s = STATUSES[status] || STATUSES['חדש'];
    return (
        <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: s.dot }}
        />
    );
}

// ── StatusBadgePill ───────────────────────────────────────────────────────────

function StatusBadgePill({ status }) {
    const s = STATUSES[status] || STATUSES['חדש'];
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
            style={{ color: s.color, background: s.bg }}
        >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
            {status}
        </span>
    );
}

// ── Template Editor ───────────────────────────────────────────────────────────

function TemplateEditor({ template, onSave, onCancel }) {
    const [form, setForm] = useState({ ...template });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

    return (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <p className="text-[12px] font-black text-[#1D1D1F] mb-4">עריכת תבנית</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="text-[11px] font-bold text-[#86868B] block mb-1.5">שם התבנית</label>
                    <input
                        value={form.name} onChange={set('name')}
                        className="w-full px-3 py-2 text-[13px] text-[#1D1D1F] rounded-xl outline-none"
                        style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}
                    />
                </div>
                <div>
                    <label className="text-[11px] font-bold text-[#86868B] block mb-1.5">ערוץ</label>
                    <select
                        value={form.channel} onChange={set('channel')}
                        className="w-full px-3 py-2 text-[13px] text-[#1D1D1F] rounded-xl outline-none"
                        style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}
                    >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">מייל</option>
                    </select>
                </div>
            </div>
            {form.channel === 'email' && (
                <div className="mb-3">
                    <label className="text-[11px] font-bold text-[#86868B] block mb-1.5">נושא המייל</label>
                    <input
                        value={form.subject || ''} onChange={set('subject')}
                        className="w-full px-3 py-2 text-[13px] text-[#1D1D1F] rounded-xl outline-none"
                        style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}
                    />
                </div>
            )}
            <div className="mb-4">
                <label className="text-[11px] font-bold text-[#86868B] block mb-1.5">
                    גוף ההודעה
                    <span className="font-normal text-[#AEAEB2] mr-2">{'{{שם}} {{מוסד}} {{הזמנה}} {{סכום}} {{טלפון}}'}</span>
                </label>
                <textarea
                    value={form.body} onChange={set('body')} rows={5}
                    className="w-full px-3 py-2 text-[13px] text-[#1D1D1F] rounded-xl outline-none resize-y"
                    style={{ border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontFamily: 'inherit', lineHeight: 1.65 }}
                />
            </div>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-xl text-[13px] font-medium text-[#6E6E73] hover:bg-black/06 transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.10)' }}
                >
                    ביטול
                </button>
                <button
                    onClick={() => onSave(form)}
                    className="px-4 py-2 rounded-xl text-[13px] font-black text-white"
                    style={{ background: 'linear-gradient(180deg,#2A2A2C,#1D1D1F)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    שמור תבנית
                </button>
            </div>
        </div>
    );
}

// ── CustomerCard (תיק לקוח) ───────────────────────────────────────────────────

function CustomerCard({ lead, onStatusChange }) {
    const [statusOpen, setStatusOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const total = lead?.subtotal
        ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}`
        : null;

    const equipment = lead?.equipment || lead?.items || [];

    const handleStatusChange = async (newStatus) => {
        setStatusOpen(false);
        setSaving(true);
        try {
            await updateDoc(doc(db, 'quotes', lead._docId), {
                status: newStatus,
                updatedAt: serverTimestamp(),
            });
            onStatusChange({ ...lead, status: newStatus });
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={GLASS} className="p-5 mb-4">
            {/* Accent bar */}
            <div className="h-[3px] rounded-full mb-4 -mx-5 -mt-5 rounded-t-[22px]"
                style={{ background: 'linear-gradient(90deg,#007AFF,#5856D6)' }} />

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0 text-right">
                    <h2 className="text-[20px] font-black text-[#1D1D1F] tracking-tight leading-none truncate">
                        {lead.contactName || '—'}
                    </h2>
                    {(lead.contactRole || lead.institution) && (
                        <p className="text-[13px] text-[#86868B] mt-1 font-medium">
                            {[lead.contactRole, lead.institution].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>

                {/* Status change dropdown */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setStatusOpen(v => !v)}
                        className="flex items-center gap-1.5 pl-2"
                        disabled={saving}
                    >
                        <StatusBadgePill status={lead.status || 'חדש'} />
                        <ChevronDown className="w-3.5 h-3.5 text-[#86868B]" />
                    </button>
                    <AnimatePresence>
                        {statusOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 top-full mt-1 z-50 min-w-[180px] rounded-2xl p-1.5 shadow-xl"
                                style={{
                                    background: 'rgba(255,255,255,0.97)',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                }}
                            >
                                <p className="text-[10px] font-black text-[#AEAEB2] px-2 py-1 mb-1">שנה סטטוס</p>
                                {Object.entries(STATUSES).map(([s, meta]) => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className="w-full text-right flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-black/05 transition-colors"
                                    >
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.dot }} />
                                        <span className="text-[12px] font-bold" style={{ color: meta.color }}>{s}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[
                    { Icon: Phone,      label: 'טלפון',   value: lead.phone || '—' },
                    { Icon: Mail,       label: 'מייל',    value: lead.email || '—' },
                    { Icon: Hash,       label: 'הזמנה',   value: lead.id || '—' },
                    { Icon: FileText,   label: 'תאריך',   value: lead.date || '—' },
                ].map(({ Icon, label, value }) => (
                    <div
                        key={label}
                        className="rounded-xl p-3 text-right"
                        style={{ background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className="text-[10px] font-black text-[#86868B]">{label}</span>
                            <Icon className="w-3 h-3 text-[#AEAEB2]" strokeWidth={2} />
                        </div>
                        <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{value}</p>
                    </div>
                ))}
            </div>

            {/* Quote details row */}
            {(total || lead.scale || lead.budget || equipment.length > 0) && (
                <div className="rounded-xl p-4 mb-3 text-right"
                    style={{ background: 'rgba(0,122,255,0.04)', border: '1px solid rgba(0,122,255,0.12)' }}>
                    <p className="text-[10px] font-black text-[#007AFF] mb-3">פרטי הצעה</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        {total && (
                            <div>
                                <div className="flex items-center justify-end gap-1 mb-1">
                                    <span className="text-[10px] font-bold text-[#86868B]">סכום כולל</span>
                                    <DollarSign className="w-3 h-3 text-[#AEAEB2]" strokeWidth={2} />
                                </div>
                                <p className="text-[13px] font-black text-[#007AFF]">{total}</p>
                            </div>
                        )}
                        {lead.scale && (
                            <div>
                                <div className="flex items-center justify-end gap-1 mb-1">
                                    <span className="text-[10px] font-bold text-[#86868B]">היקף</span>
                                    <Scale className="w-3 h-3 text-[#AEAEB2]" strokeWidth={2} />
                                </div>
                                <p className="text-[13px] font-bold text-[#1D1D1F]">{lead.scale}</p>
                            </div>
                        )}
                        {lead.budget && (
                            <div>
                                <div className="flex items-center justify-end gap-1 mb-1">
                                    <span className="text-[10px] font-bold text-[#86868B]">סוג תקציב</span>
                                    <Wallet className="w-3 h-3 text-[#AEAEB2]" strokeWidth={2} />
                                </div>
                                <p className="text-[13px] font-bold text-[#1D1D1F]">{lead.budget}</p>
                            </div>
                        )}
                    </div>
                    {equipment.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-[#86868B] mb-2 flex items-center justify-end gap-1">
                                <Package className="w-3 h-3" strokeWidth={2} />
                                פריטים מבוקשים
                            </p>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                                {equipment.map((item, i) => (
                                    <span
                                        key={i}
                                        className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.15)' }}
                                    >
                                        {typeof item === 'string' ? item : (item.name || item.title || JSON.stringify(item))}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notes */}
            {lead.notes && (
                <div className="rounded-xl p-3 text-right"
                    style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRight: '3px solid #F59E0B' }}>
                    <div className="flex items-center justify-end gap-1.5 mb-1.5">
                        <span className="text-[10px] font-black text-[#D97706]">הערות</span>
                        <StickyNote className="w-3 h-3 text-[#D97706]" strokeWidth={2} />
                    </div>
                    <p className="text-[12px] text-[#374151] leading-relaxed">{lead.notes}</p>
                </div>
            )}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminCommunications() {
    const { getSetting } = useSettings();
    const bizPhone = getSetting('contact_phone', '058-5856356');
    const [leads, setLeads]                 = useState([]);
    const [templates, setTemplates]         = useState([]);
    const [selected, setSelected]           = useState(null);
    const [search, setSearch]               = useState('');
    const [filterStatus, setFilterStatus]   = useState('');
    const [activeChannel, setActiveChannel] = useState('whatsapp');
    const [activeTpl, setActiveTpl]         = useState(null);
    const [editingTpl, setEditingTpl]       = useState(null);
    const [customMsg, setCustomMsg]         = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [addingTpl, setAddingTpl]         = useState(false);
    const [toast, setToast]                 = useState(null);

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    // Load quotes from Firestore
    useEffect(() => {
        const q = query(collection(db, 'quotes'), orderBy('dateTs', 'desc'));
        return onSnapshot(q, snap => {
            setLeads(snap.docs.map(d => ({ ...d.data(), _docId: d.id })));
        });
    }, []);

    // Load templates from Firestore (seed defaults if empty)
    useEffect(() => {
        const col = collection(db, 'comm_templates');
        const unsub = onSnapshot(col, async snap => {
            if (snap.empty) {
                for (const tpl of DEFAULT_TEMPLATES) {
                    await setDoc(doc(db, 'comm_templates', tpl.id), { ...tpl, createdAt: serverTimestamp() });
                }
            } else {
                setTemplates(snap.docs.map(d => ({ ...d.data(), id: d.id })));
            }
        });
        return unsub;
    }, []);

    // Sync template body when selection changes
    useEffect(() => {
        if (!activeTpl || !selected) { setCustomMsg(''); setCustomSubject(''); return; }
        setCustomMsg(fillTemplate(activeTpl.body, selected, bizPhone));
        setCustomSubject(fillTemplate(activeTpl.subject || '', selected, bizPhone));
    }, [activeTpl, selected]);

    const saveTpl = useCallback(async form => {
        await setDoc(doc(db, 'comm_templates', form.id), { ...form, updatedAt: serverTimestamp() }, { merge: true });
        setEditingTpl(null);
        setAddingTpl(false);
        showToast('תבנית נשמרה');
    }, []);

    const deleteTpl = useCallback(async id => {
        if (!confirm('למחוק את התבנית?')) return;
        await deleteDoc(doc(db, 'comm_templates', id));
        if (activeTpl?.id === id) setActiveTpl(null);
        showToast('תבנית נמחקה');
    }, [activeTpl]);

    const sendWhatsApp = () => {
        if (!selected?.phone || !customMsg) return;
        const num = selected.phone.replace(/\D/g,'').replace(/^0/,'');
        const url = `https://wa.me/972${num}?text=${encodeURIComponent(customMsg)}`;
        window.open(url, '_blank');
    };

    const sendEmail = () => {
        if (!selected?.email || !customMsg) return;
        const subject = encodeURIComponent(customSubject || `הודעה מ-NextClass — ${selected.id}`);
        const body = encodeURIComponent(customMsg);
        window.open(`mailto:${selected.email}?subject=${subject}&body=${body}`, '_blank');
    };

    const filtered = leads.filter(l => {
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (l.contactName || '').toLowerCase().includes(q) ||
            (l.institution || '').toLowerCase().includes(q) ||
            (l.id || '').toLowerCase().includes(q) ||
            (l.phone || '').includes(q);
        const matchStatus = !filterStatus || l.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const channelTpls = templates.filter(t => t.channel === activeChannel || t.channel === 'both');
    const activeChDef = CHANNELS.find(c => c.id === activeChannel);

    return (
        <div
            className="flex h-full relative"
            style={{ direction: 'rtl', fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif" }}
        >

            {/* ── Toast ─────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full text-[13px] font-black text-white shadow-xl"
                        style={{ background: toast.ok ? '#1D1D1F' : '#DC2626' }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── LEFT PANEL: Lead list ──────────────────────────────────────── */}
            <div
                className="flex flex-col shrink-0 overflow-hidden"
                style={{
                    width: 296,
                    background: 'rgba(255,255,255,0.82)',
                    borderLeft: '1px solid rgba(0,0,0,0.08)',
                }}
            >
                {/* Panel header */}
                <div className="px-4 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="text-[16px] font-black text-[#1D1D1F] mb-3">לקוחות</p>

                    {/* Search */}
                    <div className="relative mb-2.5">
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AEAEB2] pointer-events-none"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            placeholder="שם, מוסד, מזהה..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pr-9 pl-3 py-2 text-[12px] rounded-xl outline-none text-[#1D1D1F] placeholder-[#AEAEB2]"
                            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 text-[11px] text-[#1D1D1F] rounded-xl outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                        <option value="">כל הסטטוסים</option>
                        {Object.keys(STATUSES).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                {/* Lead items */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 && (
                        <div className="py-12 text-center text-[#AEAEB2] text-[12px]">
                            לא נמצאו הזמנות
                        </div>
                    )}
                    {filtered.map(lead => {
                        const isActive = selected?._docId === lead._docId;
                        const s = STATUSES[lead.status] || STATUSES['חדש'];
                        return (
                            <motion.div
                                key={lead._docId}
                                onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); }}
                                whileHover={{ x: isActive ? 0 : -2 }}
                                className="px-4 py-3 cursor-pointer relative"
                                style={{
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    background: isActive ? 'rgba(0,122,255,0.06)' : 'transparent',
                                    borderRight: isActive ? '3px solid #007AFF' : '3px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <StatusDot status={lead.status} />
                                    <span className="text-[13px] font-black text-[#1D1D1F] flex-1 truncate">{lead.contactName || '—'}</span>
                                    <span className="text-[10px] text-[#AEAEB2] shrink-0">{lead.date || ''}</span>
                                </div>
                                <p className="text-[11px] text-[#86868B] mb-1.5 pr-4 truncate">{lead.institution || '—'}</p>
                                <div className="flex items-center gap-2 pr-4">
                                    <StatusBadgePill status={lead.status || 'חדש'} />
                                    <span className="text-[10px] text-[#AEAEB2] font-mono truncate">{lead.id}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Count footer */}
                <div className="px-4 py-2.5 text-[10px] text-[#AEAEB2] font-bold"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    {filtered.length} הזמנות
                </div>
            </div>

            {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6">
                {!selected ? (
                    <div className="max-w-[740px] mx-auto space-y-5">
                        {/* ── Overview header ───────────────────────────────── */}
                        <div>
                            <h2 className="text-[20px] font-black text-[#1D1D1F] mb-1">סקירה כללית</h2>
                            <p className="text-[13px] text-[#6E6E73]">
                                {leads.filter(l => l.date === new Date().toLocaleDateString('he-IL')).length} הזמנות חדשות היום
                                {' · '}סה״כ {leads.length} לידים
                            </p>
                        </div>

                        {/* ── Pipeline stats grid ───────────────────────────── */}
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(STATUSES).map(([status, meta]) => {
                                const count = leads.filter(l => (l.status || 'חדש') === status).length;
                                if (count === 0) return null;
                                return (
                                    <motion.button
                                        key={status}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setFilterStatus(status)}
                                        className="text-right p-4 rounded-2xl transition-all"
                                        style={{
                                            background: meta.bg,
                                            border: `1px solid ${meta.color}22`,
                                        }}
                                    >
                                        <p
                                            className="text-[32px] font-black leading-none mb-1"
                                            style={{ color: meta.color }}
                                        >
                                            {count}
                                        </p>
                                        <p className="text-[12px] font-bold" style={{ color: meta.color }}>
                                            {status}
                                        </p>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* ── דורשים מענה מיידי ─────────────────────────────── */}
                        {(() => {
                            const urgent = leads
                                .filter(l => !l.status || l.status === 'חדש')
                                .slice(0, 5);
                            if (urgent.length === 0) return null;
                            return (
                                <div>
                                    <p className="text-[13px] font-black text-[#1D1D1F] mb-3">דורשים מענה מיידי</p>
                                    <div className="space-y-1.5">
                                        {urgent.map(lead => {
                                            const s = STATUSES[lead.status] || STATUSES['חדש'];
                                            return (
                                                <motion.div
                                                    key={lead._docId}
                                                    whileHover={{ x: -2 }}
                                                    onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); }}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.88)',
                                                        border: '1px solid rgba(0,0,0,0.06)',
                                                        borderRight: `3px solid ${s.dot}`,
                                                    }}
                                                >
                                                    <StatusDot status={lead.status} />
                                                    <span className="text-[13px] font-black text-[#1D1D1F] flex-1 truncate">
                                                        {lead.contactName || '—'}
                                                    </span>
                                                    <span className="text-[11px] text-[#86868B] truncate max-w-[140px]">
                                                        {lead.institution || '—'}
                                                    </span>
                                                    <span className="text-[10px] text-[#AEAEB2] shrink-0">
                                                        {lead.date || ''}
                                                    </span>
                                                    {lead.phone && (
                                                        <span className="text-[11px] font-mono text-[#6E6E73] shrink-0">
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── פעילות אחרונה ─────────────────────────────────── */}
                        {(() => {
                            const recent = leads.slice(0, 5);
                            if (recent.length === 0) return null;
                            return (
                                <div>
                                    <p className="text-[13px] font-black text-[#1D1D1F] mb-3">פעילות אחרונה</p>
                                    <div className="space-y-1.5">
                                        {recent.map(lead => {
                                            const s = STATUSES[lead.status] || STATUSES['חדש'];
                                            return (
                                                <motion.div
                                                    key={lead._docId}
                                                    whileHover={{ x: -2 }}
                                                    onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); }}
                                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.88)',
                                                        border: '1px solid rgba(0,0,0,0.06)',
                                                        borderRight: `3px solid ${s.dot}`,
                                                    }}
                                                >
                                                    <StatusDot status={lead.status} />
                                                    <span className="text-[13px] font-black text-[#1D1D1F] flex-1 truncate">
                                                        {lead.contactName || '—'}
                                                    </span>
                                                    <span className="text-[11px] text-[#86868B] truncate max-w-[140px]">
                                                        {lead.institution || '—'}
                                                    </span>
                                                    <StatusBadgePill status={lead.status || 'חדש'} />
                                                    <span className="text-[10px] text-[#AEAEB2] shrink-0">
                                                        {lead.date || ''}
                                                    </span>
                                                    {lead.phone && (
                                                        <span className="text-[11px] font-mono text-[#6E6E73] shrink-0">
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="max-w-[740px] mx-auto space-y-4">

                        {/* ── Customer Card (תיק לקוח) ──────────────────────── */}
                        <CustomerCard
                            lead={selected}
                            onStatusChange={updated => setSelected(updated)}
                        />

                        {/* ── Channel Tabs ───────────────────────────────────── */}
                        <div className="flex gap-2">
                            {CHANNELS.map(ch => {
                                const isActive = activeChannel === ch.id;
                                return (
                                    <button
                                        key={ch.id}
                                        onClick={() => { setActiveChannel(ch.id); setActiveTpl(null); setCustomMsg(''); setCustomSubject(''); }}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-black transition-all"
                                        style={{
                                            background: isActive ? ch.bg : 'rgba(255,255,255,0.88)',
                                            border: `2px solid ${isActive ? ch.color : 'rgba(0,0,0,0.08)'}`,
                                            color: isActive ? ch.color : '#86868B',
                                            boxShadow: isActive ? `0 2px 12px ${ch.color}25` : 'none',
                                        }}
                                    >
                                        <ch.Icon className="w-4 h-4" strokeWidth={2} />
                                        {ch.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Templates ──────────────────────────────────────── */}
                        <div
                            className="rounded-[22px] p-5"
                            style={{
                                background: 'rgba(255,255,255,0.88)',
                                border: '1px solid rgba(255,255,255,0.75)',
                                boxShadow: '0 4px 28px rgba(0,0,0,0.07)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[12px] font-black text-[#1D1D1F]">תבניות מהירות</p>
                                <button
                                    onClick={() => { setAddingTpl(true); setEditingTpl(null); }}
                                    className="flex items-center gap-1 text-[12px] font-black text-[#007AFF] hover:text-[#0055D4] transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    תבנית חדשה
                                </button>
                            </div>

                            <AnimatePresence>
                                {addingTpl && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <TemplateEditor
                                            template={{ id: `tpl_${Date.now()}`, name: '', channel: activeChannel, status: '', body: '', subject: '' }}
                                            onSave={saveTpl}
                                            onCancel={() => setAddingTpl(false)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-wrap gap-2">
                                {channelTpls.map(tpl => {
                                    const isActiveTpl = activeTpl?.id === tpl.id;
                                    return (
                                        <div key={tpl.id} className="flex items-center">
                                            <button
                                                onClick={() => { setActiveTpl(tpl); setEditingTpl(null); setAddingTpl(false); }}
                                                className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold transition-all"
                                                style={{
                                                    borderRadius: '50px 0 0 50px',
                                                    border: `1px solid ${isActiveTpl ? '#007AFF' : 'rgba(0,0,0,0.10)'}`,
                                                    background: isActiveTpl ? 'rgba(0,122,255,0.08)' : 'rgba(255,255,255,0.9)',
                                                    color: isActiveTpl ? '#007AFF' : '#374151',
                                                    borderLeft: 'none',
                                                }}
                                            >
                                                {tpl.name}
                                                {tpl.status && (
                                                    <span className="text-[10px] text-[#AEAEB2] font-normal">{tpl.status}</span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setEditingTpl(tpl); setAddingTpl(false); }}
                                                title="ערוך"
                                                className="flex items-center justify-center w-8 h-[34px] transition-colors hover:bg-black/05"
                                                style={{
                                                    border: `1px solid ${isActiveTpl ? '#007AFF' : 'rgba(0,0,0,0.10)'}`,
                                                    borderLeft: 'none',
                                                    borderRight: 'none',
                                                    background: 'rgba(255,255,255,0.9)',
                                                }}
                                            >
                                                <Edit2 className="w-3 h-3 text-[#AEAEB2]" strokeWidth={2} />
                                            </button>
                                            <button
                                                onClick={() => deleteTpl(tpl.id)}
                                                title="מחק"
                                                className="flex items-center justify-center w-8 h-[34px] transition-colors hover:bg-red-50 hover:text-red-500"
                                                style={{
                                                    borderRadius: '0 50px 50px 0',
                                                    border: `1px solid ${isActiveTpl ? '#007AFF' : 'rgba(0,0,0,0.10)'}`,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    color: '#AEAEB2',
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" strokeWidth={2} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {channelTpls.length === 0 && (
                                    <p className="text-[12px] text-[#AEAEB2] py-1">
                                        אין תבניות לערוץ זה — לחץ "תבנית חדשה"
                                    </p>
                                )}
                            </div>

                            <AnimatePresence>
                                {editingTpl && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
                                        <TemplateEditor
                                            template={editingTpl}
                                            onSave={saveTpl}
                                            onCancel={() => setEditingTpl(null)}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* ── Message Composer ───────────────────────────────── */}
                        <div style={{ ...GLASS, borderRadius: 22, overflow: 'hidden' }}>

                            {/* Composer header */}
                            <div
                                className="flex items-center justify-between px-5 py-3.5"
                                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.015)' }}
                            >
                                <div className="flex items-center gap-2 text-[12px] font-black text-[#1D1D1F]">
                                    {activeChDef && <activeChDef.Icon className="w-4 h-4" style={{ color: activeChDef.color }} strokeWidth={2} />}
                                    {activeChannel === 'whatsapp' ? 'הודעת WhatsApp' : 'הודעת מייל'}
                                    {activeTpl && (
                                        <span className="font-normal text-[#AEAEB2]">— {activeTpl.name}</span>
                                    )}
                                </div>
                                {(customMsg || customSubject) && (
                                    <button
                                        onClick={() => { setCustomMsg(''); setCustomSubject(''); setActiveTpl(null); }}
                                        className="flex items-center gap-1 text-[11px] text-[#AEAEB2] hover:text-[#FF3B30] transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                                        נקה
                                    </button>
                                )}
                            </div>

                            <div className="p-5 space-y-3">
                                {/* Email subject */}
                                {activeChannel === 'email' && (
                                    <input
                                        placeholder="נושא המייל..."
                                        value={customSubject}
                                        onChange={e => setCustomSubject(e.target.value)}
                                        className="w-full px-4 py-2.5 text-[13px] text-[#1D1D1F] rounded-xl outline-none placeholder-[#AEAEB2]"
                                        style={{ border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.02)' }}
                                    />
                                )}

                                {/* Message body */}
                                <textarea
                                    placeholder={activeChannel === 'whatsapp'
                                        ? 'כתוב הודעת WhatsApp או בחר תבנית למעלה...'
                                        : 'כתוב גוף המייל או בחר תבנית למעלה...'}
                                    value={customMsg}
                                    onChange={e => setCustomMsg(e.target.value)}
                                    rows={7}
                                    className="w-full px-4 py-3 text-[14px] text-[#1D1D1F] rounded-xl outline-none resize-y placeholder-[#AEAEB2]"
                                    style={{
                                        border: '1px solid rgba(0,0,0,0.10)',
                                        background: 'rgba(0,0,0,0.02)',
                                        fontFamily: 'inherit',
                                        lineHeight: 1.7,
                                    }}
                                />

                                {/* Variable pills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {['{{שם}}','{{מוסד}}','{{הזמנה}}','{{סכום}}','{{טלפון}}'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setCustomMsg(m => m + v)}
                                            className="text-[11px] font-mono px-2.5 py-1 rounded-full transition-colors hover:bg-[#007AFF]/15"
                                            style={{
                                                color: '#007AFF',
                                                background: 'rgba(0,122,255,0.07)',
                                                border: '1px solid rgba(0,122,255,0.18)',
                                            }}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                {/* Send button */}
                                <div className="flex gap-2.5 pt-1">
                                    {activeChannel === 'whatsapp' ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={sendWhatsApp}
                                            disabled={!customMsg || !selected?.phone}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                background: (!customMsg || !selected?.phone)
                                                    ? '#C7C7CC'
                                                    : 'linear-gradient(135deg,#25D366,#1DA851)',
                                                boxShadow: (!customMsg || !selected?.phone) ? 'none' : '0 4px 16px rgba(37,211,102,0.35)',
                                            }}
                                        >
                                            <MessageSquare className="w-4 h-4" strokeWidth={2} />
                                            פתח WhatsApp
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={sendEmail}
                                            disabled={!customMsg || !selected?.email}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                background: (!customMsg || !selected?.email)
                                                    ? '#C7C7CC'
                                                    : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                                                boxShadow: (!customMsg || !selected?.email) ? 'none' : '0 4px 16px rgba(37,99,235,0.35)',
                                            }}
                                        >
                                            <Mail className="w-4 h-4" strokeWidth={2} />
                                            שלח מייל
                                        </motion.button>
                                    )}
                                </div>

                                {/* Warning if missing contact info */}
                                {activeChannel === 'whatsapp' && !selected?.phone && (
                                    <div className="flex items-center gap-2 text-[11px] text-[#FF9500] font-medium">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                        ללקוח זה אין מספר טלפון שמור
                                    </div>
                                )}
                                {activeChannel === 'email' && !selected?.email && (
                                    <div className="flex items-center gap-2 text-[11px] text-[#FF9500] font-medium">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                        ללקוח זה אין כתובת מייל שמורה
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
