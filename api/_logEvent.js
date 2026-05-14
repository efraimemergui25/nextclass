// Fire-and-forget security event logger → Firestore security_logs collection
const PROJECT_ID = 'nextclass-d2364';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/security_logs`;

/**
 * @param {string} event  e.g. 'rate_limited', 'payload_too_large', 'crm_error'
 * @param {object} details
 */
export function logSecurityEvent(event, details = {}) {
    const doc = {
        fields: {
            event:     { stringValue: String(event) },
            ts:        { integerValue: String(Date.now()) },
            ...Object.fromEntries(
                Object.entries(details).map(([k, v]) => [k, { stringValue: String(v ?? '') }])
            ),
        },
    };
    // Best-effort — never await, never throw
    fetch(FIRESTORE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
    }).catch(() => {});
}
