/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — NO-CODE AUTOMATION RULES  (client-side, alerts only)
   ───────────────────────────────────────────────────────────────────────────────
   A glassy RTL manager where the solo operator defines order rules WITHOUT code —
   "stuck at supplier > 3 days → flag", "total < X → review", "payment overdue →
   surface". There are NO Cloud Functions (owner declined Blaze), so rules are
   evaluated CLIENT-SIDE and only ever produce ALERTS/SUGGESTIONS: the operator
   sees matches and clicks to act. Nothing here sends email or mutates order data.

   Persists to Firestore collection `automation_rules`:
     { id, name, active:true, field, op, value, severity:'info'|'warning'|'danger', createdAt }

   Exports:
     • default  <RulesManager />                          — full CRUD builder UI
     • named    <RuleAlerts rules orders onOpenOrder />    — grouped rule-matches
     • named    subscribeRules(cb) → unsubscribe           — shared live query
     • named    useRules()          → { rules, loading }   — hook over the same query
   ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection, onSnapshot, addDoc, setDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
    GLASS, RADIUS, SPRING, PALETTE, GRADIENT, hexA, toneColor, toneBg, toneFg,
} from '../theme/tokens';
import {
    RULE_FIELDS, RULE_FIELD_BY_ID, operatorsForField, ruleSummary, matchingOrders,
} from '../lib/rulesEngine';
import { orderTitle, orderTotal } from '../lib/orderModel';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';

const AZURE = PALETTE.azure; // #007AFF
const FONT = { fontFamily: 'Heebo, sans-serif' };
const COLL = 'automation_rules';

const SEVERITIES = [
    { id: 'info', label: 'מידע', tone: 'info' },
    { id: 'warning', label: 'אזהרה', tone: 'warning' },
    { id: 'danger', label: 'דחוף', tone: 'danger' },
];
const severityTone = (sev) => (SEVERITIES.find((s) => s.id === sev) || SEVERITIES[0]).tone;

const inputStyle = {
    background: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(14px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.85)',
    borderRadius: RADIUS.input,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(20,40,80,0.05)',
    ...FONT,
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED LIVE QUERY — one subscription source of truth for the whole cockpit.
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Subscribe to all automation rules. cb receives the array; returns unsubscribe. */
export function subscribeRules(cb) {
    return onSnapshot(
        collection(db, COLL),
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => { console.error('automation_rules subscription failed:', err); cb([]); },
    );
}

/** Hook form — returns { rules, loading }. Cockpit reads active rules from here. */
export function useRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsub = subscribeRules((arr) => { setRules(arr); setLoading(false); });
        return () => unsub();
    }, []);
    return { rules, loading };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   RuleAlerts — surfaces active-rule matches in the cockpit, grouped by rule.
   Renders NOTHING when no active rule matches anything.
   ═══════════════════════════════════════════════════════════════════════════════ */
export function RuleAlerts({ rules, orders, onOpenOrder }) {
    const groups = useMemo(() => {
        const active = (rules || []).filter((r) => r.active !== false && r.field);
        return active
            .map((r) => ({ rule: r, matches: matchingOrders(r, orders || []) }))
            .filter((g) => g.matches.length > 0);
    }, [rules, orders]);

    if (!groups.length) return null;

    return (
        <div dir="rtl" style={FONT} className="flex flex-col gap-3">
            {groups.map(({ rule, matches }) => {
                const tone = severityTone(rule.severity);
                return (
                    <div
                        key={rule.id}
                        className="rounded-2xl overflow-hidden"
                        style={{ ...GLASS.base, borderRadius: RADIUS.card, borderRight: `3px solid ${toneColor(tone)}` }}
                    >
                        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2.5">
                            <div className="min-w-0 flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: toneColor(tone), boxShadow: `0 0 0 3px ${hexA(toneColor(tone), 0.16)}, 0 1px 3px ${hexA(toneColor(tone), 0.4)}` }}
                                />
                                <div className="min-w-0">
                                    <div className="text-[14px] font-black text-[#1D1D1F] truncate">{rule.name || ruleSummary(rule)}</div>
                                    <div className="text-[11.5px] text-[#86868B] truncate">{ruleSummary(rule)}</div>
                                </div>
                            </div>
                            <span
                                className="shrink-0 px-2.5 py-1 rounded-full text-[12px] font-black"
                                style={{ background: toneBg(tone), color: toneFg(tone) }}
                            >
                                {matches.length}
                            </span>
                        </div>
                        <div className="flex flex-col" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                            {matches.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => onOpenOrder?.(o.id)}
                                    className="flex items-center justify-between gap-2 px-4 py-2.5 text-right transition-colors hover:bg-black/[0.03]"
                                    style={{ borderTop: '1px solid rgba(0,0,0,0.035)' }}
                                >
                                    <span className="text-[13px] font-bold text-[#1D1D1F] truncate">{orderTitle(o)}</span>
                                    <span className="shrink-0 text-[12px] font-bold text-[#86868B]">
                                        ₪{orderTotal(o).toLocaleString('he-IL')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Value input — adapts to the selected field's type.
   ═══════════════════════════════════════════════════════════════════════════════ */
function ValueInput({ field, value, onChange }) {
    if (!field || field.type === 'boolean') return null;

    if (field.type === 'number') {
        return (
            <input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                style={inputStyle}
                dir="rtl"
            />
        );
    }
    // stage / enum / risk — a select over the field's options
    return (
        <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
            style={inputStyle}
            dir="rtl"
        >
            <option value="" disabled>בחר/י ערך…</option>
            {(field.options || []).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN — RulesManager (default export)
   ═══════════════════════════════════════════════════════════════════════════════ */
const blankRule = () => {
    const field = RULE_FIELDS[0];
    const ops = OPERATORS_FOR(field.id);
    return {
        name: '',
        field: field.id,
        op: ops[0],
        value: field.options ? '' : (field.type === 'number' ? '' : true),
        severity: 'warning',
    };
};
// tiny local wrapper so blankRule can read ops without importing OPERATORS map directly
function OPERATORS_FOR(fieldId) { return operatorsForField(fieldId); }

export default function RulesManager() {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();

    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState(blankRule);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = subscribeRules((arr) => { setRules(arr); setLoading(false); });
        return () => unsub();
    }, []);

    const field = RULE_FIELD_BY_ID[draft.field];
    const ops = operatorsForField(draft.field);

    // Switching field resets op + value to sensible defaults for the new type.
    const onFieldChange = useCallback((fieldId) => {
        const f = RULE_FIELD_BY_ID[fieldId];
        const nextOps = operatorsForField(fieldId);
        setDraft((d) => ({
            ...d,
            field: fieldId,
            op: nextOps[0],
            value: f?.options ? '' : (f?.type === 'number' ? '' : true),
        }));
    }, []);

    const valid = useMemo(() => {
        if (!draft.name.trim()) return false;
        if (!field) return false;
        if (field.type === 'boolean') return true;
        if (field.type === 'number') return draft.value !== '' && draft.value != null && !Number.isNaN(Number(draft.value));
        return !!draft.value; // stage/enum/risk need a chosen option
    }, [draft, field]);

    const save = async () => {
        if (!valid) { showToast('יש להשלים שם ותנאי לחוק', 'warning'); return; }
        setSaving(true);
        try {
            await addDoc(collection(db, COLL), {
                name: draft.name.trim(),
                active: true,
                field: draft.field,
                op: draft.op,
                value: field.type === 'boolean' ? true : draft.value,
                severity: draft.severity,
                createdAt: serverTimestamp(),
            });
            showToast('החוק נשמר', 'success');
            setDraft(blankRule());
        } catch (err) {
            console.error('save rule failed:', err);
            showToast('שמירת החוק נכשלה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (r) => {
        try {
            await setDoc(doc(db, COLL, r.id), { active: r.active === false }, { merge: true });
        } catch (err) {
            console.error('toggle rule failed:', err);
            showToast('העדכון נכשל', 'error');
        }
    };

    const remove = async (r) => {
        const ok = await confirm({
            title: 'למחוק חוק?',
            message: `"${r.name || ruleSummary(r)}" יימחק לצמיתות.`,
            confirmLabel: 'מחק',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteDoc(doc(db, COLL, r.id));
            showToast('החוק נמחק', 'success');
        } catch (err) {
            console.error('delete rule failed:', err);
            showToast('מחיקה נכשלה', 'error');
        }
    };

    return (
        <div dir="rtl" style={FONT} className="w-full flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-[24px] font-black text-[#1D1D1F] tracking-tight">חוקי אוטומציה</h1>
                <p className="text-[13px] text-[#6E6E73] mt-0.5">
                    הגדירו תנאים והמערכת תסמן הזמנות שדורשות טיפול — התראות בלבד, ללא שליחה או שינוי אוטומטי.
                </p>
            </div>

            {/* Builder */}
            <div className="rounded-2xl p-5" style={{ ...GLASS.base, borderRadius: RADIUS.card }}>
                <h2 className="text-[15px] font-black text-[#1D1D1F] mb-4">חוק חדש</h2>
                <div className="flex flex-col gap-4">
                    <label className="block">
                        <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">שם החוק</span>
                        <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            placeholder='לדוגמה: תקוע אצל הספק'
                            className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                            style={inputStyle}
                            dir="rtl"
                        />
                    </label>

                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                        {/* Field */}
                        <label className="block">
                            <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">שדה</span>
                            <select
                                value={draft.field}
                                onChange={(e) => onFieldChange(e.target.value)}
                                className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                                style={inputStyle}
                                dir="rtl"
                            >
                                {RULE_FIELDS.map((f) => (
                                    <option key={f.id} value={f.id}>{f.label}</option>
                                ))}
                            </select>
                        </label>

                        {/* Operator */}
                        <label className="block">
                            <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">תנאי</span>
                            <select
                                value={draft.op}
                                onChange={(e) => setDraft({ ...draft, op: e.target.value })}
                                className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                                style={inputStyle}
                                dir="rtl"
                                disabled={ops.length <= 1}
                            >
                                {ops.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </label>

                        {/* Value */}
                        {field?.type !== 'boolean' && (
                            <label className="block">
                                <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">ערך</span>
                                <ValueInput
                                    field={field}
                                    value={draft.value}
                                    onChange={(v) => setDraft({ ...draft, value: v })}
                                />
                            </label>
                        )}

                        {/* Severity */}
                        <label className="block">
                            <span className="block text-[12px] font-bold text-[#6E6E73] mb-1.5">חומרה</span>
                            <select
                                value={draft.severity}
                                onChange={(e) => setDraft({ ...draft, severity: e.target.value })}
                                className="w-full px-3 py-2.5 text-[14px] text-[#1D1D1F] outline-none"
                                style={inputStyle}
                                dir="rtl"
                            >
                                {SEVERITIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </label>
                    </div>

                    {/* Live summary + save */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div
                            className="px-3 py-2 rounded-xl text-[13px] font-bold"
                            style={{ background: hexA(AZURE, 0.07), color: '#005EC4' }}
                        >
                            {ruleSummary(draft) || 'בנו תנאי…'}
                        </div>
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            transition={SPRING.snappy}
                            onClick={save}
                            disabled={saving || !valid}
                            className="px-5 py-2.5 rounded-full text-[14px] font-black text-white disabled:opacity-50"
                            style={{ background: GRADIENT.signature, boxShadow: `0 8px 22px ${hexA(AZURE, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.4)` }}
                        >
                            {saving ? 'שומר…' : '+ הוסף חוק'}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Existing rules */}
            <div>
                <h2 className="text-[13px] font-black text-[#86868B] mb-2.5 tracking-wide">
                    חוקים פעילים {rules.length ? <span className="text-[#C7C7CC]">· {rules.length}</span> : null}
                </h2>
                {loading ? (
                    <div className="text-center py-12 text-[#AEAEB2] text-[14px]">טוען חוקים…</div>
                ) : rules.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl" style={{ ...GLASS.frosted, borderRadius: RADIUS.card }}>
                        <p className="text-[15px] font-bold text-[#6E6E73]">אין עדיין חוקים</p>
                        <p className="text-[13px] text-[#AEAEB2] mt-1">הגדירו את החוק הראשון כדי שהמערכת תסמן הזמנות עבורכם</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <AnimatePresence initial={false}>
                            {rules.map((r) => {
                                const tone = severityTone(r.severity);
                                const on = r.active !== false;
                                return (
                                    <motion.div
                                        key={r.id}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={SPRING.soft}
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
                                        style={{
                                            ...GLASS.base,
                                            borderRadius: RADIUS.card,
                                            borderRight: `3px solid ${toneColor(tone)}`,
                                            opacity: on ? 1 : 0.55,
                                        }}
                                    >
                                        <div className="min-w-0 flex items-center gap-2.5">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ background: toneColor(tone), boxShadow: `0 0 0 3px ${hexA(toneColor(tone), 0.16)}, 0 1px 3px ${hexA(toneColor(tone), 0.4)}` }}
                                            />
                                            <div className="min-w-0">
                                                <div className="text-[14px] font-black text-[#1D1D1F] truncate">{r.name || ruleSummary(r)}</div>
                                                <div className="text-[12px] text-[#86868B] truncate">{ruleSummary(r)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(r)}
                                                title={on ? 'השבת' : 'הפעל'}
                                                className="relative w-11 h-6 rounded-full transition-colors"
                                                style={{
                                                    background: on
                                                        ? `linear-gradient(135deg, ${AZURE}, ${hexA(AZURE, 0.82)})`
                                                        : 'rgba(0,0,0,0.14)',
                                                    boxShadow: on
                                                        ? `inset 0 1px 2px ${hexA(AZURE, 0.5)}, 0 4px 12px ${hexA(AZURE, 0.32)}`
                                                        : 'inset 0 1px 2px rgba(0,0,0,0.12)',
                                                }}
                                            >
                                                <motion.span
                                                    layout
                                                    transition={SPRING.snappy}
                                                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
                                                    style={{ [on ? 'left' : 'right']: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                                                />
                                            </button>
                                            <motion.button
                                                type="button"
                                                onClick={() => remove(r)}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.95 }}
                                                transition={SPRING.snappy}
                                                className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
                                                style={{
                                                    background: toneBg('danger'),
                                                    color: toneFg('danger'),
                                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px ${hexA(toneColor('danger'), 0.18)}`,
                                                }}
                                            >
                                                מחק
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
