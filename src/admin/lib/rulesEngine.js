/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS — NO-CODE AUTOMATION RULES ENGINE  (client-side, alerts only)
   ───────────────────────────────────────────────────────────────────────────────
   Pure, dependency-light helpers that let the solo operator define order rules
   WITHOUT code — e.g. "stuck at supplier > 3 days", "margin/total < X", "payment
   overdue". There are NO Cloud Functions (owner declined Blaze), so every rule is
   evaluated CLIENT-SIDE in the browser and only ever produces ALERTS/SUGGESTIONS.
   Nothing here sends email or mutates data — it filters orders and describes matches.

   A rule is the shape:  { field, op, value }
     field  — one of RULE_FIELDS[].id
     op     — one of OPERATORS[type]
     value  — the comparison value (a stage id, number, enum key; ignored for boolean)

   Reads order facts THROUGH src/admin/lib/orderModel.js so this engine speaks the
   exact same lifecycle language as the rest of the cockpit.
   ═══════════════════════════════════════════════════════════════════════════════ */

import {
    STAGES_DROPSHIP, deriveStage, daysInStage, orderTotal, riskAssess,
} from './orderModel';

/* ─── The fields an operator can build a rule on ─────────────────────────────────
   Each: { id, label(Hebrew), type:'stage'|'number'|'enum'|'boolean'|'risk', options? }
   options (enum/stage/risk) are { value, label } for the value picker + summaries. */
export const RULE_FIELDS = [
    {
        id: 'stage',
        label: 'שלב',
        type: 'stage',
        options: STAGES_DROPSHIP.map((s) => ({ value: s.id, label: s.label })),
    },
    { id: 'daysInStage', label: 'ימים בשלב', type: 'number' },
    { id: 'total', label: 'סה"כ', type: 'number' },
    {
        id: 'paymentStatus',
        label: 'תשלום',
        type: 'enum',
        options: [
            { value: 'paid', label: 'שולם' },
            { value: 'partial', label: 'שולם חלקית' },
            { value: 'unpaid', label: 'ממתין לתשלום' },
        ],
    },
    { id: 'paymentOverdue', label: 'תשלום באיחור', type: 'boolean' },
    {
        id: 'risk',
        label: 'רמת סיכון',
        type: 'risk',
        options: [
            { value: 'high', label: 'גבוהה' },
            { value: 'med', label: 'בינונית' },
            { value: 'none', label: 'ללא' },
        ],
    },
];

/** Fast id → field-meta lookup. */
export const RULE_FIELD_BY_ID = RULE_FIELDS.reduce((m, f) => { m[f.id] = f; return m; }, {});

/* ─── Operators available per field type ─────────────────────────────────────────
   number → arithmetic comparisons; enum/stage/risk → equals / not-equals;
   boolean → the single "is" operator (the field is inherently true/false).       */
export const OPERATORS = {
    number: ['>', '<', '=', '>=', '<='],
    stage: ['=', '≠'],
    enum: ['=', '≠'],
    risk: ['=', '≠'],
    boolean: ['הוא'],
};

/** The operator list for a given field id (empty array if unknown). */
export function operatorsForField(fieldId) {
    const f = RULE_FIELD_BY_ID[fieldId];
    return f ? (OPERATORS[f.type] || []) : [];
}

/* ─── Resolve the order's actual value for a field ───────────────────────────────
   Robust to missing data — never throws, returns a sensible default. */
export function resolveFieldValue(fieldId, order) {
    if (!order) return null;
    switch (fieldId) {
        case 'stage':
            return deriveStage(order);
        case 'daysInStage':
            return daysInStage(order);
        case 'total':
            return orderTotal(order);
        case 'paymentStatus':
            return order.paymentStatus || 'unpaid';
        case 'paymentOverdue':
            return !!(
                order.paymentStatus !== 'paid'
                && order.paymentDueTs
                && Number(order.paymentDueTs) < Date.now()
            );
        case 'risk':
            return (riskAssess(order) || {}).level || 'none';
        default:
            return null;
    }
}

/* ─── Compare a resolved value against the rule's target per operator ─────────── */
function compare(type, op, actual, target) {
    if (type === 'number') {
        const a = Number(actual);
        const b = Number(target);
        if (Number.isNaN(a) || Number.isNaN(b)) return false;
        switch (op) {
            case '>':  return a > b;
            case '<':  return a < b;
            case '=':  return a === b;
            case '>=': return a >= b;
            case '<=': return a <= b;
            default:   return false;
        }
    }
    if (type === 'boolean') {
        // Single operator 'הוא' → the field is true (value defaults to true).
        return actual === (target === undefined ? true : !!target);
    }
    // stage / enum / risk — string equality
    switch (op) {
        case '=': return String(actual) === String(target);
        case '≠': return String(actual) !== String(target);
        default:  return false;
    }
}

/** Evaluate a single rule against a single order → boolean. Never throws. */
export function evaluateRule(rule, order) {
    if (!rule || !rule.field) return false;
    const field = RULE_FIELD_BY_ID[rule.field];
    if (!field) return false;
    const actual = resolveFieldValue(rule.field, order);
    return compare(field.type, rule.op, actual, rule.value);
}

/** All orders that match the rule. */
export function matchingOrders(rule, orders) {
    if (!Array.isArray(orders)) return [];
    return orders.filter((o) => evaluateRule(rule, o));
}

/* ─── Human-readable helpers ─────────────────────────────────────────────────── */

/** The Hebrew label for a rule's target value (maps ids → labels for enum/stage). */
export function valueLabel(rule) {
    if (!rule) return '';
    const field = RULE_FIELD_BY_ID[rule.field];
    if (!field) return String(rule.value ?? '');
    if (field.type === 'boolean') return '';
    if (field.options) {
        const opt = field.options.find((o) => o.value === rule.value);
        return opt ? opt.label : String(rule.value ?? '');
    }
    return String(rule.value ?? '');
}

/** A one-line Hebrew description of a rule, e.g. `שלב = הועבר לספק`. */
export function ruleSummary(rule) {
    if (!rule || !rule.field) return '';
    const field = RULE_FIELD_BY_ID[rule.field];
    if (!field) return '';
    if (field.type === 'boolean') return field.label; // e.g. "תשלום באיחור"
    return `${field.label} ${rule.op} ${valueLabel(rule)}`.trim();
}

export default {
    RULE_FIELDS,
    RULE_FIELD_BY_ID,
    OPERATORS,
    operatorsForField,
    resolveFieldValue,
    evaluateRule,
    matchingOrders,
    valueLabel,
    ruleSummary,
};
