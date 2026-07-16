/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — EMAIL / WHATSAPP TEMPLATES LIBRARY
   ───────────────────────────────────────────────────────────────────────────────
   A glassy RTL manager where the operator authors their OWN reusable Hebrew
   messages (order confirmation, shipping, delivered, invoice, payment reminder,
   supplier note, review request) with {{merge_fields}}, per channel + per kind.

   Persists to Firestore collection `comm_templates`:
     { id, name, channel:'email'|'whatsapp', kind, subject, body, createdAt, updatedAt }

   Exports:
     • default  <TemplatesManager />   — full CRUD library UI (mount as a page/tab)
     • named    <TemplatePicker order channel onPick /> — drop a saved template,
                token-applied, into a compose flow.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
    collection, onSnapshot, setDoc, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
    GLASS, RADIUS, SHADOW, SPRING, PALETTE, GRADIENT, hexA, toneColor, toneBg, toneFg,
} from '../theme/tokens';
import {
    MERGE_FIELDS, STAGE_KINDS, KIND_LABEL, CHANNELS, applyTemplate, SAMPLE_ORDER,
} from '../lib/templates';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';

const AZURE = PALETTE.azure; // #007AFF
const FONT = { fontFamily: 'Heebo, sans-serif' };
const COLL = 'comm_templates';

/* ─── Shared token palette — click a chip to insert at the caret ───────────────── */
function TokenPalette({ onInsert }) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {MERGE_FIELDS.map((f) => (
                <motion.button
                    key={f.token}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onInsert(f.token)}
                    title={f.token}
                    className="px-2.5 py-1 rounded-lg text-[12px] font-bold transition-colors"
                    style={{
                        background: hexA(AZURE, 0.08),
                        color: '#005EC4',
                        border: `1px solid ${hexA(AZURE, 0.18)}`,
                    }}
                >
                    {f.label}
                </motion.button>
            ))}
        </div>
    );
}

/* ─── Small labelled field wrapper ────────────────────────────────────────────── */
function Field({ label, children }) {
    return (
        <label className="block">
            <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputStyle = {
    background: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(255,255,255,0.7))',
    backdropFilter: 'blur(16px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.9)',
    borderRadius: RADIUS.input,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,1), 0 1px 3px ${hexA('#142850', 0.05)}`,
    ...FONT,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   EDITOR — create / edit a single template
   ═══════════════════════════════════════════════════════════════════════════════ */
function TemplateEditor({ value, onChange, activeCaretTarget, setActiveCaretTarget }) {
    const bodyRef = useRef(null);
    const subjectRef = useRef(null);
    const isEmail = value.channel === 'email';

    // Insert a token at the caret of whichever field was last focused (default: body).
    const insertToken = useCallback((token) => {
        const target = activeCaretTarget === 'subject' && isEmail ? 'subject' : 'body';
        const ref = target === 'subject' ? subjectRef : bodyRef;
        const el = ref.current;
        const current = value[target] || '';
        if (!el) {
            onChange({ ...value, [target]: current + token });
            return;
        }
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        const next = current.slice(0, start) + token + current.slice(end);
        onChange({ ...value, [target]: next });
        // Restore caret just after the inserted token.
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + token.length;
            try { el.setSelectionRange(pos, pos); } catch { /* noop */ }
        });
    }, [activeCaretTarget, isEmail, value, onChange]);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <Field label="שם התבנית">
                    <input
                        type="text"
                        value={value.name}
                        onChange={(e) => onChange({ ...value, name: e.target.value })}
                        placeholder="לדוגמה: אישור הזמנה סטנדרטי"
                        className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                        style={inputStyle}
                        dir="rtl"
                    />
                </Field>
                <Field label="סוג ההודעה">
                    <select
                        value={value.kind}
                        onChange={(e) => onChange({ ...value, kind: e.target.value })}
                        className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                        style={inputStyle}
                        dir="rtl"
                    >
                        {STAGE_KINDS.map((k) => (
                            <option key={k.id} value={k.id}>{k.label}</option>
                        ))}
                    </select>
                </Field>
            </div>

            {/* Channel toggle */}
            <Field label="ערוץ">
                <div className="inline-flex p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    {CHANNELS.map((c) => {
                        const on = value.channel === c.id;
                        return (
                            <motion.button
                                key={c.id}
                                type="button"
                                whileTap={{ scale: 0.96 }}
                                onClick={() => onChange({ ...value, channel: c.id })}
                                className="relative px-5 py-1.5 rounded-full text-[13px] font-bold transition-colors"
                                style={{ color: on ? '#fff' : '#6E6E73' }}
                            >
                                {on && (
                                    <motion.span
                                        layoutId="tmpl-channel-pill"
                                        className="absolute inset-0 rounded-full -z-10"
                                        style={{ background: GRADIENT.signature, boxShadow: `0 4px 14px ${hexA(AZURE, 0.35)}` }}
                                        transition={SPRING.pill}
                                    />
                                )}
                                {c.label}
                            </motion.button>
                        );
                    })}
                </div>
            </Field>

            {/* Subject — email only */}
            <AnimatePresence initial={false}>
                {isEmail && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Field label="נושא (אימייל)">
                            <input
                                ref={subjectRef}
                                type="text"
                                value={value.subject}
                                onFocus={() => setActiveCaretTarget('subject')}
                                onChange={(e) => onChange({ ...value, subject: e.target.value })}
                                placeholder="הזמנה {{orderNumber}} התקבלה — נקסט קלאס"
                                className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                                style={inputStyle}
                                dir="rtl"
                            />
                        </Field>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Body */}
            <Field label={isEmail ? 'גוף ההודעה' : 'תוכן ההודעה'}>
                <textarea
                    ref={bodyRef}
                    value={value.body}
                    onFocus={() => setActiveCaretTarget('body')}
                    onChange={(e) => onChange({ ...value, body: e.target.value })}
                    rows={7}
                    placeholder={'שלום {{customer}},\nתודה על הזמנתך מספר {{orderNumber}}.'}
                    className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none resize-y leading-relaxed"
                    style={inputStyle}
                    dir="rtl"
                />
            </Field>

            {/* Token palette */}
            <div>
                <span className="block text-[12px] font-bold text-[#6E6E73] mb-2">
                    שדות למיזוג — לחצו להוספה במיקום הסמן
                </span>
                <TokenPalette onInsert={insertToken} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LIVE PREVIEW — the template resolved against the sample order
   ═══════════════════════════════════════════════════════════════════════════════ */
function LivePreview({ value }) {
    const isEmail = value.channel === 'email';
    const subject = applyTemplate(value.subject, SAMPLE_ORDER);
    const body = applyTemplate(value.body, SAMPLE_ORDER);

    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
                background: 'linear-gradient(150deg, rgba(250,251,253,0.94), rgba(244,246,250,0.8))',
                backdropFilter: 'blur(18px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
                border: '1px solid rgba(255,255,255,0.85)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,1), 0 8px 24px ${hexA('#142850', 0.06)}`,
            }}
            dir="rtl"
        >
            <div className="flex items-center gap-2">
                <span
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                    style={{ background: hexA(AZURE, 0.10), color: '#005EC4' }}
                >
                    {isEmail ? 'תצוגת אימייל' : 'תצוגת וואטסאפ'}
                </span>
                <span className="text-[11px] text-[#AEAEB2]">על בסיס הזמנה לדוגמה</span>
            </div>
            {isEmail && (
                <div className="pb-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <span className="text-[11px] text-[#AEAEB2]">נושא</span>
                    <div className="text-[14px] font-bold text-[#1D1D1F]">{subject || '—'}</div>
                </div>
            )}
            <div
                className="text-[13.5px] text-[#3C3C43] leading-relaxed whitespace-pre-wrap min-h-[60px]"
            >
                {body || <span className="text-[#AEAEB2]">התוכן יופיע כאן…</span>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN — TemplatesManager (default export)
   ═══════════════════════════════════════════════════════════════════════════════ */
const blankTemplate = () => ({
    name: '', channel: 'email', kind: 'confirmed', subject: '', body: '',
});

export default function TemplatesManager() {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);   // { id?, ...fields } or null
    const [saving, setSaving] = useState(false);
    const [caretTarget, setCaretTarget] = useState('body');

    // Live Firestore subscription.
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, COLL),
            (snap) => {
                setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            (err) => {
                console.error('comm_templates subscription failed:', err);
                setLoading(false);
                showToast('טעינת התבניות נכשלה', 'error');
            },
        );
        return () => unsub();
    }, [showToast]);

    // Group templates by kind (in STAGE_KINDS order).
    const grouped = useMemo(() => {
        const by = {};
        for (const t of templates) (by[t.kind] ||= []).push(t);
        Object.values(by).forEach((arr) => arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')));
        return by;
    }, [templates]);

    const startCreate = () => { setCaretTarget('body'); setEditing(blankTemplate()); };
    const startEdit = (t) => { setCaretTarget('body'); setEditing({ ...t }); };

    const save = async () => {
        if (!editing) return;
        if (!editing.name.trim()) { showToast('יש להזין שם לתבנית', 'warning'); return; }
        if (!editing.body.trim()) { showToast('גוף ההודעה ריק', 'warning'); return; }
        setSaving(true);
        try {
            const payload = {
                name: editing.name.trim(),
                channel: editing.channel,
                kind: editing.kind,
                subject: editing.channel === 'email' ? (editing.subject || '') : '',
                body: editing.body,
                updatedAt: serverTimestamp(),
            };
            if (editing.id) {
                await setDoc(doc(db, COLL, editing.id), payload, { merge: true });
            } else {
                await addDoc(collection(db, COLL), { ...payload, createdAt: serverTimestamp() });
            }
            showToast('התבנית נשמרה', 'success');
            setEditing(null);
        } catch (err) {
            console.error('save template failed:', err);
            showToast('שמירת התבנית נכשלה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (t) => {
        const ok = await confirm({
            title: 'למחוק תבנית?',
            message: `"${t.name}" תימחק לצמיתות.`,
            confirmLabel: 'מחק',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteDoc(doc(db, COLL, t.id));
            showToast('התבנית נמחקה', 'success');
            if (editing?.id === t.id) setEditing(null);
        } catch (err) {
            console.error('delete template failed:', err);
            showToast('מחיקה נכשלה', 'error');
        }
    };

    return (
        <div dir="rtl" style={FONT} className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-[24px] font-black text-[#1D1D1F] tracking-tight">ספריית תבניות</h1>
                    <p className="text-[13px] text-[#6E6E73] mt-0.5">
                        הודעות אימייל ווואטסאפ לשלבי ההזמנה — עם שדות למיזוג אוטומטי
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={startCreate}
                    className="px-4 py-2.5 rounded-full text-[14px] font-black text-white"
                    style={{ background: GRADIENT.signature, boxShadow: `0 8px 22px ${hexA(AZURE, 0.35)}` }}
                >
                    + תבנית חדשה
                </motion.button>
            </div>

            {/* List grouped by kind */}
            {loading ? (
                <div className="text-center py-16 text-[#AEAEB2] text-[14px]">טוען תבניות…</div>
            ) : templates.length === 0 ? (
                <div
                    className="text-center py-16 rounded-2xl"
                    style={{ ...GLASS.frosted, borderRadius: RADIUS.card }}
                >
                    <p className="text-[15px] font-bold text-[#6E6E73]">אין עדיין תבניות</p>
                    <p className="text-[13px] text-[#AEAEB2] mt-1">צרו את התבנית הראשונה כדי לחסוך זמן בכל הזמנה</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {STAGE_KINDS.filter((k) => grouped[k.id]?.length).map((k) => (
                        <div key={k.id}>
                            <h2 className="text-[13px] font-black text-[#86868B] mb-2.5 tracking-wide">
                                {k.label} <span className="text-[#C7C7CC]">· {grouped[k.id].length}</span>
                            </h2>
                            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {grouped[k.id].map((t) => (
                                    <TemplateCard key={t.id} t={t} onEdit={() => startEdit(t)} onDelete={() => remove(t)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor sheet */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        className="fixed inset-0 z-[1000] flex items-stretch justify-end"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        dir="rtl" style={FONT}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{ background: 'rgba(20,22,40,0.32)', backdropFilter: 'blur(6px)' }}
                            onClick={() => setEditing(null)}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="relative h-full w-full max-w-[560px] overflow-y-auto p-6"
                            style={{ ...GLASS.sheet, borderRadius: 0 }}
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={SPRING.soft}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[19px] font-black text-[#1D1D1F]">
                                    {editing.id ? 'עריכת תבנית' : 'תבנית חדשה'}
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={SPRING.snappy}
                                    onClick={() => setEditing(null)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#6E6E73]"
                                    style={{
                                        background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.62))',
                                        border: '1px solid rgba(255,255,255,0.9)',
                                        boxShadow: `inset 0 1px 0 rgba(255,255,255,1), 0 4px 12px ${hexA('#142850', 0.08)}`,
                                    }}
                                    aria-label="סגור"
                                ><X size={17} strokeWidth={2.4} /></motion.button>
                            </div>

                            <TemplateEditor
                                value={editing}
                                onChange={setEditing}
                                activeCaretTarget={caretTarget}
                                setActiveCaretTarget={setCaretTarget}
                            />

                            <div className="mt-5">
                                <span className="block text-[12px] font-bold text-[#6E6E73] mb-2">תצוגה מקדימה חיה</span>
                                <LivePreview value={editing} />
                            </div>

                            <div className="flex gap-3 mt-6 sticky bottom-0 pt-3" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95), transparent)' }}>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setEditing(null)}
                                    className="flex-1 h-12 rounded-full font-bold text-[14px] text-[#1D1D1F]"
                                    style={{
                                        background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(255,255,255,0.62))',
                                        backdropFilter: 'blur(16px) saturate(1.6)',
                                        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                                        border: '1px solid rgba(255,255,255,0.9)',
                                        boxShadow: `inset 0 1px 0 rgba(255,255,255,1), 0 2px 8px ${hexA('#142850', 0.05)}`,
                                    }}
                                >ביטול</motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={save}
                                    disabled={saving}
                                    className="flex-1 h-12 rounded-full font-black text-[14px] text-white disabled:opacity-60"
                                    style={{ background: GRADIENT.signature, boxShadow: `0 8px 22px ${hexA(AZURE, 0.38)}` }}
                                >{saving ? 'שומר…' : 'שמור תבנית'}</motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── A single template card in the library grid ──────────────────────────────── */
function TemplateCard({ t, onEdit, onDelete }) {
    const isEmail = t.channel === 'email';
    return (
        <motion.div
            whileHover={{ y: -3, boxShadow: `0 16px 40px ${hexA(AZURE, 0.15)}, ${SHADOW.specular}` }}
            transition={SPRING.gentle}
            className="p-4 rounded-2xl flex flex-col gap-2"
            style={{ ...GLASS.base, borderRadius: RADIUS.card }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="text-[15px] font-black text-[#1D1D1F] truncate">{t.name}</div>
                    {isEmail && t.subject && (
                        <div className="text-[12px] text-[#86868B] truncate mt-0.5">{t.subject}</div>
                    )}
                </div>
                <span
                    className="shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold"
                    style={{
                        background: isEmail ? hexA(AZURE, 0.10) : toneBg('success'),
                        color: isEmail ? '#005EC4' : toneFg('success'),
                    }}
                >
                    {isEmail ? 'אימייל' : 'וואטסאפ'}
                </span>
            </div>
            <p className="text-[12.5px] text-[#6E6E73] leading-snug line-clamp-3 whitespace-pre-wrap">
                {t.body}
            </p>
            <div className="flex gap-2 mt-1">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snappy}
                    onClick={onEdit}
                    className="flex-1 py-1.5 rounded-lg text-[12px] font-bold text-[#005EC4] transition-colors"
                    style={{ background: hexA(AZURE, 0.08), border: `1px solid ${hexA(AZURE, 0.14)}` }}
                >עריכה</motion.button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snappy}
                    onClick={onDelete}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
                    style={{ background: toneBg('danger'), color: toneFg('danger') }}
                >מחק</motion.button>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TemplatePicker — drop a saved template (token-applied) into a compose flow.
   ───────────────────────────────────────────────────────────────────────────────
     <TemplatePicker
        order={order}
        channel="email"                       // or "whatsapp"
        onPick={(subject, body, tmpl) => { … }} // subject '' for whatsapp
     />
   Lists saved templates matching the channel; on click resolves the tokens against
   `order` and hands (subject, body) back to the caller.
   ═══════════════════════════════════════════════════════════════════════════════ */
export function TemplatePicker({ order, channel = 'email', kind, onPick, className = '' }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, COLL),
            (snap) => {
                setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            () => setLoading(false),
        );
        return () => unsub();
    }, []);

    const matches = useMemo(
        () => templates
            .filter((t) => t.channel === channel && (!kind || t.kind === kind))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he')),
        [templates, channel, kind],
    );

    const pick = (t) => {
        const subject = channel === 'email' ? applyTemplate(t.subject, order) : '';
        const body = applyTemplate(t.body, order);
        onPick?.(subject, body, t);
    };

    if (loading) {
        return <div className={className} style={FONT}><span className="text-[12px] text-[#AEAEB2]">טוען תבניות…</span></div>;
    }
    if (!matches.length) {
        return (
            <div className={className} style={FONT} dir="rtl">
                <span className="text-[12px] text-[#AEAEB2]">אין תבניות שמורות לערוץ זה</span>
            </div>
        );
    }

    return (
        <div className={className} dir="rtl" style={FONT}>
            <div className="flex flex-wrap gap-1.5">
                {matches.map((t) => (
                    <motion.button
                        key={t.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => pick(t)}
                        title={KIND_LABEL[t.kind] || t.kind}
                        className="px-3 py-1.5 rounded-full text-[12.5px] font-bold transition-colors"
                        style={{
                            background: hexA(AZURE, 0.08),
                            color: '#005EC4',
                            border: `1px solid ${hexA(AZURE, 0.18)}`,
                        }}
                    >
                        {t.name}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
