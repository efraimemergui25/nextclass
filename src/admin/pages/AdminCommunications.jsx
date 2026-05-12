import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, query, orderBy, onSnapshot,
    doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

// ── Constants ─────────────────────────────────────────────────────────────────

const BIZ_PHONE = '058-585-6356';

const STATUSES = {
    'חדש':         { color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    'בטיפול':      { color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
    'הוצעה מחיר':  { color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
    'ממתין לאישור':{ color: '#0891B2', bg: '#ECFEFF', dot: '#06B6D4' },
    'סגור - זכה':  { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
    'סגור - הפסיד':{ color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

const CHANNELS = [
    { id: 'whatsapp', label: 'WhatsApp', emoji: '💬', color: '#25D366', bg: '#F0FFF4' },
    { id: 'email',    label: 'מייל',     emoji: '✉️', color: '#2563EB', bg: '#EFF6FF' },
];

const DEFAULT_TEMPLATES = [
    {
        id: 'tpl_first_contact',
        name: 'מגע ראשון',
        channel: 'whatsapp',
        status: 'חדש',
        body: 'שלום {{שם}}! 👋\nכאן אפרים מ-NextClass.\nראיתי את הבקשה שלך עבור {{מוסד}} ({{הזמנה}}) ואשמח לעזור!\nמתי נוח לך לשיחה קצרה?',
        subject: '',
    },
    {
        id: 'tpl_followup',
        name: 'מעקב',
        channel: 'whatsapp',
        status: 'בטיפול',
        body: 'שלום {{שם}},\nרציתי לוודא שקיבלת את המידע שלנו ולשאול אם יש שאלות.\nאנחנו כאן בשבילך 🙂',
        subject: '',
    },
    {
        id: 'tpl_send_quote',
        name: 'שליחת הצעה',
        channel: 'email',
        status: 'הוצעה מחיר',
        subject: 'הצעת מחיר עבור {{מוסד}} — {{הזמנה}} | NextClass',
        body: 'שלום {{שם}},\n\nמצורפת הצעת המחיר שהכנו עבורכם ב-{{מוסד}}.\nסכום כולל: {{סכום}}.\n\nנשמח לענות על כל שאלה.\n\nבברכה,\nאפרים אמרגי\nNextClass · {{טלפון}}',
    },
    {
        id: 'tpl_awaiting',
        name: 'ממתין לאישור',
        channel: 'whatsapp',
        status: 'ממתין לאישור',
        body: 'שלום {{שם}} 😊\nרציתי לבדוק אם הצעת המחיר שלנו ({{הזמנה}}) מתאימה לצרכי {{מוסד}}.\nאשמח לתאם שיחה ולסגור את הפרטים!',
        subject: '',
    },
    {
        id: 'tpl_won',
        name: 'סגירת עסקה — תודה',
        channel: 'whatsapp',
        status: 'סגור - זכה',
        body: '🎉 {{שם}}, תודה רבה!\nשמחים שתלמידי {{מוסד}} ייהנו מהציוד החדש.\nנהיה איתכם בכל שלב. תמיד כאן 🙏\nצוות NextClass',
        subject: '',
    },
];

// ── Variable substitution ─────────────────────────────────────────────────────

function fillTemplate(text, lead) {
    const firstName = (lead?.contactName || '').split(' ')[0] || '—';
    const total = lead?.subtotal
        ? `₪${Number(String(lead.subtotal).replace(/[^0-9.]/g,'')).toLocaleString()}`
        : '—';
    return (text || '')
        .replace(/\{\{שם\}\}/g,      firstName)
        .replace(/\{\{מוסד\}\}/g,    lead?.institution || '—')
        .replace(/\{\{הזמנה\}\}/g,   lead?.id || '—')
        .replace(/\{\{סכום\}\}/g,    total)
        .replace(/\{\{טלפון\}\}/g,   BIZ_PHONE);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }) {
    const s = STATUSES[status] || STATUSES['חדש'];
    return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:s.dot, flexShrink:0 }} />;
}

function StatusBadge({ status }) {
    const s = STATUSES[status] || STATUSES['חדש'];
    return (
        <span style={{ fontSize:11, fontWeight:700, color:s.color, background:s.bg,
            padding:'2px 8px', borderRadius:50, whiteSpace:'nowrap' }}>
            {status}
        </span>
    );
}

function TemplateEditor({ template, onSave, onCancel }) {
    const [form, setForm] = useState({ ...template });
    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    return (
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:12 }}>עריכת תבנית</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                    <label style={{ fontSize:11, color:'#6B7280', fontWeight:600 }}>שם התבנית</label>
                    <input value={form.name} onChange={set('name')}
                        style={{ width:'100%', marginTop:4, padding:'8px 10px', border:'1px solid #D1D5DB',
                            borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                    <label style={{ fontSize:11, color:'#6B7280', fontWeight:600 }}>ערוץ</label>
                    <select value={form.channel} onChange={set('channel')}
                        style={{ width:'100%', marginTop:4, padding:'8px 10px', border:'1px solid #D1D5DB',
                            borderRadius:8, fontSize:13, background:'#fff', boxSizing:'border-box' }}>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">מייל</option>
                    </select>
                </div>
            </div>
            {form.channel === 'email' && (
                <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, color:'#6B7280', fontWeight:600 }}>נושא המייל</label>
                    <input value={form.subject} onChange={set('subject')}
                        style={{ width:'100%', marginTop:4, padding:'8px 10px', border:'1px solid #D1D5DB',
                            borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
            )}
            <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:11, color:'#6B7280', fontWeight:600 }}>
                    הודעה&nbsp;
                    <span style={{ fontWeight:400, color:'#9CA3AF' }}>
                        (משתנים: {'{{שם}} {{מוסד}} {{הזמנה}} {{סכום}} {{טלפון}}'})
                    </span>
                </label>
                <textarea value={form.body} onChange={set('body')} rows={5}
                    style={{ width:'100%', marginTop:4, padding:'8px 10px', border:'1px solid #D1D5DB',
                        borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={onCancel}
                    style={{ padding:'8px 16px', borderRadius:8, border:'1px solid #D1D5DB',
                        background:'#fff', fontSize:13, cursor:'pointer', color:'#374151' }}>
                    ביטול
                </button>
                <button onClick={() => onSave(form)}
                    style={{ padding:'8px 16px', borderRadius:8, border:'none',
                        background:'#111827', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                    שמור
                </button>
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminCommunications() {
    const [leads, setLeads]               = useState([]);
    const [templates, setTemplates]       = useState([]);
    const [selected, setSelected]         = useState(null);
    const [search, setSearch]             = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [activeChannel, setActiveChannel] = useState('whatsapp');
    const [activeTpl, setActiveTpl]       = useState(null);
    const [editingTpl, setEditingTpl]     = useState(null);
    const [customMsg, setCustomMsg]       = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [addingTpl, setAddingTpl]       = useState(false);
    const [toast, setToast]               = useState(null);

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

    // Sync template body → custom message when selection changes
    useEffect(() => {
        if (!activeTpl || !selected) { setCustomMsg(''); setCustomSubject(''); return; }
        setCustomMsg(fillTemplate(activeTpl.body, selected));
        setCustomSubject(fillTemplate(activeTpl.subject || '', selected));
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

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#F9FAFB', direction:'rtl', fontFamily:"'Helvetica Neue',Arial,sans-serif", position:'relative' }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        style={{ position:'fixed', top:20, right:'50%', transform:'translateX(50%)',
                            background: toast.ok ? '#111827' : '#DC2626', color:'#fff',
                            padding:'10px 22px', borderRadius:50, fontSize:13, fontWeight:700,
                            zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid #E5E7EB', background:'#fff' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#111827', marginBottom:2 }}>תקשורת עם לקוחות</div>
                <div style={{ fontSize:13, color:'#6B7280' }}>שלח הודעות WhatsApp ומייל עם תבניות חכמות מותאמות לכל הזמנה</div>
            </div>

            <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

                {/* ── LEFT: Lead list ───────────────────────────────────────── */}
                <div style={{ width:300, flexShrink:0, borderLeft:'1px solid #E5E7EB', background:'#fff',
                    display:'flex', flexDirection:'column', overflow:'hidden' }}>

                    {/* Search + filter */}
                    <div style={{ padding:'12px 14px', borderBottom:'1px solid #F3F4F6' }}>
                        <input
                            placeholder="חיפוש לקוח, מוסד, ID..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB',
                                borderRadius:8, fontSize:13, boxSizing:'border-box', marginBottom:8, outline:'none' }} />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            style={{ width:'100%', padding:'7px 10px', border:'1px solid #E5E7EB',
                                borderRadius:8, fontSize:12, background:'#fff', boxSizing:'border-box', color:'#374151' }}>
                            <option value="">כל הסטטוסים</option>
                            {Object.keys(STATUSES).map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* List */}
                    <div style={{ flex:1, overflowY:'auto' }}>
                        {filtered.length === 0 && (
                            <div style={{ padding:32, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>
                                לא נמצאו הזמנות
                            </div>
                        )}
                        {filtered.map(lead => {
                            const isActive = selected?._docId === lead._docId;
                            return (
                                <div key={lead._docId}
                                    onClick={() => { setSelected(lead); setActiveTpl(null); setCustomMsg(''); }}
                                    style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid #F9FAFB',
                                        background: isActive ? '#EFF6FF' : 'transparent',
                                        borderRight: isActive ? '3px solid #2563EB' : '3px solid transparent',
                                        transition:'all 0.15s' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                        <StatusDot status={lead.status} />
                                        <span style={{ fontSize:13, fontWeight:700, color:'#111827', flex:1 }}>{lead.contactName || '—'}</span>
                                        <span style={{ fontSize:10, color:'#9CA3AF', whiteSpace:'nowrap' }}>{lead.date}</span>
                                    </div>
                                    <div style={{ fontSize:12, color:'#6B7280', marginBottom:4, paddingRight:16 }}>{lead.institution || '—'}</div>
                                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingRight:16 }}>
                                        <StatusBadge status={lead.status || 'חדש'} />
                                        <span style={{ fontSize:11, color:'#9CA3AF' }}>{lead.id}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── RIGHT: Communication panel ───────────────────────────── */}
                <div style={{ flex:1, overflowY:'auto', padding:24 }}>
                    {!selected ? (
                        <div style={{ height:'100%', display:'flex', flexDirection:'column',
                            alignItems:'center', justifyContent:'center', color:'#9CA3AF', gap:12 }}>
                            <div style={{ fontSize:40 }}>💬</div>
                            <div style={{ fontSize:15, fontWeight:600, color:'#374151' }}>בחר לקוח כדי להתחיל</div>
                            <div style={{ fontSize:13 }}>בחר הזמנה מהרשימה כדי לשלוח הודעה</div>
                        </div>
                    ) : (
                        <div style={{ maxWidth:700, margin:'0 auto' }}>

                            {/* Lead card */}
                            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E5E7EB',
                                padding:20, marginBottom:20 }}>
                                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                                    <div>
                                        <div style={{ fontSize:18, fontWeight:800, color:'#111827', marginBottom:2 }}>
                                            {selected.contactName}
                                        </div>
                                        <div style={{ fontSize:13, color:'#6B7280' }}>
                                            {selected.contactRole && `${selected.contactRole} · `}{selected.institution}
                                        </div>
                                    </div>
                                    <StatusBadge status={selected.status || 'חדש'} />
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                                    {[
                                        ['📱', 'טלפון', selected.phone || '—'],
                                        ['✉️', 'מייל',  selected.email || '—'],
                                        ['🆔', 'הזמנה', selected.id || '—'],
                                    ].map(([icon, label, val]) => (
                                        <div key={label} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 14px' }}>
                                            <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, marginBottom:3 }}>{icon} {label}</div>
                                            <div style={{ fontSize:13, fontWeight:700, color:'#111827', wordBreak:'break-all' }}>{val}</div>
                                        </div>
                                    ))}
                                </div>
                                {selected.notes && (
                                    <div style={{ marginTop:12, background:'#FFFBEB', borderRadius:10,
                                        padding:'10px 14px', borderRight:'3px solid #F59E0B' }}>
                                        <div style={{ fontSize:11, color:'#92400E', fontWeight:700, marginBottom:3 }}>📝 הערות</div>
                                        <div style={{ fontSize:13, color:'#374151' }}>{selected.notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Channel tabs */}
                            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                                {CHANNELS.map(ch => (
                                    <button key={ch.id} onClick={() => { setActiveChannel(ch.id); setActiveTpl(null); setCustomMsg(''); }}
                                        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
                                            borderRadius:50, border:'2px solid', cursor:'pointer', fontSize:13, fontWeight:700,
                                            transition:'all 0.15s',
                                            borderColor: activeChannel === ch.id ? ch.color : '#E5E7EB',
                                            background: activeChannel === ch.id ? ch.bg : '#fff',
                                            color: activeChannel === ch.id ? ch.color : '#6B7280' }}>
                                        {ch.emoji} {ch.label}
                                    </button>
                                ))}
                            </div>

                            {/* Templates */}
                            <div style={{ marginBottom:16 }}>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                                    <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>תבניות מהירות</div>
                                    <button onClick={() => { setAddingTpl(true); setEditingTpl(null); }}
                                        style={{ fontSize:12, color:'#2563EB', fontWeight:700, background:'none',
                                            border:'none', cursor:'pointer', padding:0 }}>
                                        + תבנית חדשה
                                    </button>
                                </div>

                                {/* Add new template form */}
                                <AnimatePresence>
                                {addingTpl && (
                                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                                        <TemplateEditor
                                            template={{ id:`tpl_${Date.now()}`, name:'', channel:activeChannel, status:'', body:'', subject:'' }}
                                            onSave={saveTpl}
                                            onCancel={() => setAddingTpl(false)} />
                                    </motion.div>
                                )}
                                </AnimatePresence>

                                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                    {channelTpls.map(tpl => (
                                        <div key={tpl.id} style={{ display:'flex', alignItems:'center', gap:0 }}>
                                            <button onClick={() => { setActiveTpl(tpl); setEditingTpl(null); setAddingTpl(false); }}
                                                style={{ padding:'7px 14px', borderRadius:'50px 0 0 50px', border:'1px solid',
                                                    cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.15s',
                                                    borderColor: activeTpl?.id === tpl.id ? '#2563EB' : '#E5E7EB',
                                                    background: activeTpl?.id === tpl.id ? '#EFF6FF' : '#fff',
                                                    color: activeTpl?.id === tpl.id ? '#2563EB' : '#374151' }}>
                                                {tpl.name}
                                                {tpl.status && <span style={{ fontSize:10, color:'#9CA3AF', marginRight:6 }}>· {tpl.status}</span>}
                                            </button>
                                            <button onClick={() => { setEditingTpl(tpl); setAddingTpl(false); }}
                                                style={{ padding:'7px 9px', borderRadius:'0', borderTop:'1px solid',
                                                    borderBottom:'1px solid', borderRight:'none', borderLeft:'none',
                                                    cursor:'pointer', fontSize:11, background:'#fff',
                                                    borderColor: activeTpl?.id === tpl.id ? '#2563EB' : '#E5E7EB',
                                                    color:'#9CA3AF', transition:'all 0.15s' }}
                                                title="ערוך">✏️</button>
                                            <button onClick={() => deleteTpl(tpl.id)}
                                                style={{ padding:'7px 9px', borderRadius:'0 50px 50px 0', border:'1px solid',
                                                    borderRight:'1px solid',
                                                    cursor:'pointer', fontSize:11, background:'#fff',
                                                    borderColor: activeTpl?.id === tpl.id ? '#2563EB' : '#E5E7EB',
                                                    color:'#9CA3AF', transition:'all 0.15s' }}
                                                title="מחק">🗑️</button>
                                        </div>
                                    ))}
                                    {channelTpls.length === 0 && (
                                        <div style={{ fontSize:12, color:'#9CA3AF', padding:'8px 0' }}>
                                            אין תבניות לערוץ זה — לחץ "+ תבנית חדשה"
                                        </div>
                                    )}
                                </div>

                                {/* Template editor */}
                                <AnimatePresence>
                                {editingTpl && (
                                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ marginTop:12 }}>
                                        <TemplateEditor
                                            template={editingTpl}
                                            onSave={saveTpl}
                                            onCancel={() => setEditingTpl(null)} />
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </div>

                            {/* Message composer */}
                            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E5E7EB', overflow:'hidden' }}>
                                <div style={{ padding:'14px 18px', borderBottom:'1px solid #F3F4F6', background:'#F9FAFB',
                                    fontSize:12, fontWeight:700, color:'#374151' }}>
                                    {activeChannel === 'whatsapp' ? '💬 הודעת WhatsApp' : '✉️ הודעת מייל'}
                                    {activeTpl && <span style={{ color:'#9CA3AF', fontWeight:400, marginRight:8 }}>— {activeTpl.name}</span>}
                                </div>

                                {activeChannel === 'email' && (
                                    <div style={{ padding:'12px 18px 0' }}>
                                        <input
                                            placeholder="נושא המייל..."
                                            value={customSubject}
                                            onChange={e => setCustomSubject(e.target.value)}
                                            style={{ width:'100%', padding:'8px 12px', border:'1px solid #E5E7EB',
                                                borderRadius:8, fontSize:13, boxSizing:'border-box', outline:'none' }} />
                                    </div>
                                )}

                                <div style={{ padding:18 }}>
                                    <textarea
                                        placeholder={activeChannel === 'whatsapp'
                                            ? 'כתוב הודעת WhatsApp או בחר תבנית למעלה...'
                                            : 'כתוב גוף המייל או בחר תבנית למעלה...'}
                                        value={customMsg}
                                        onChange={e => setCustomMsg(e.target.value)}
                                        rows={7}
                                        style={{ width:'100%', border:'1px solid #E5E7EB', borderRadius:10,
                                            padding:'12px 14px', fontSize:14, resize:'vertical',
                                            fontFamily:'inherit', lineHeight:1.7, outline:'none',
                                            boxSizing:'border-box', color:'#374151' }} />

                                    {/* Variables hint */}
                                    <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
                                        {['{{שם}}','{{מוסד}}','{{הזמנה}}','{{סכום}}','{{טלפון}}'].map(v => (
                                            <button key={v} onClick={() => setCustomMsg(m => m + v)}
                                                style={{ fontSize:11, color:'#2563EB', background:'#EFF6FF',
                                                    border:'1px solid #BFDBFE', borderRadius:50, padding:'2px 10px',
                                                    cursor:'pointer', fontFamily:'monospace' }}>
                                                {v}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Send button */}
                                    <div style={{ marginTop:16, display:'flex', gap:10, justifyContent:'flex-start' }}>
                                        {activeChannel === 'whatsapp' ? (
                                            <button onClick={sendWhatsApp} disabled={!customMsg || !selected?.phone}
                                                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px',
                                                    background: (!customMsg || !selected?.phone) ? '#D1D5DB' : '#25D366',
                                                    color:'#fff', border:'none', borderRadius:50, fontSize:14,
                                                    fontWeight:700, cursor: (!customMsg || !selected?.phone) ? 'not-allowed' : 'pointer',
                                                    transition:'all 0.15s' }}>
                                                💬 פתח WhatsApp
                                            </button>
                                        ) : (
                                            <button onClick={sendEmail} disabled={!customMsg || !selected?.email}
                                                style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px',
                                                    background: (!customMsg || !selected?.email) ? '#D1D5DB' : '#2563EB',
                                                    color:'#fff', border:'none', borderRadius:50, fontSize:14,
                                                    fontWeight:700, cursor: (!customMsg || !selected?.email) ? 'not-allowed' : 'pointer',
                                                    transition:'all 0.15s' }}>
                                                ✉️ שלח מייל
                                            </button>
                                        )}
                                        <button onClick={() => { setCustomMsg(''); setCustomSubject(''); setActiveTpl(null); }}
                                            style={{ padding:'12px 20px', background:'none', border:'1px solid #E5E7EB',
                                                borderRadius:50, fontSize:13, color:'#6B7280', cursor:'pointer' }}>
                                            נקה
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
