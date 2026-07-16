/**
 * Canonical pending-email queue writer — the ONE place outbound email is enqueued.
 *
 * EVERY outbound email (customer / supplier / internal) is written here as a
 * `status: 'pending'` document in the Firestore `pending_emails` collection.
 * NOTHING is sent from this module. The ONLY sender is api/dispatch-email.js,
 * and it is reachable ONLY from the admin approve-AND-edit gate in
 * src/admin/pages/AdminCommunications.jsx.
 *
 * This guarantees the launch invariant: no email can ever auto-send — a human
 * must review (and may edit) every message before it goes out.
 */

const FIRESTORE_PENDING_URL =
    'https://firestore.googleapis.com/v1/projects/nextclass-d2364/databases/(default)/documents/pending_emails';

/**
 * Queue an email for manual admin approval.
 *
 * @param {Object}  args
 * @param {string}  args.to             Recipient email (required)
 * @param {string}  args.subject        Email subject
 * @param {string}  args.html           Rendered HTML body
 * @param {string} [args.recipientName] Display name for the inbox row
 * @param {'customer'|'supplier'|'internal'} [args.kind='customer']  Audience — drives the inbox badge/grouping
 * @param {string} [args.refId]         Related record id (e.g. quote id) — used to link back to a lead card
 * @param {string} [args.refType]       Related record type (e.g. 'quote')
 * @param {string} [args.source]        Originating endpoint/flow, for auditing
 * @returns {Promise<Object>} Firestore REST response
 */
export async function queuePendingEmail({
    to,
    subject = '',
    html = '',
    recipientName = '',
    kind = 'customer',
    refId = '',
    refType = '',
    source = '',
}) {
    if (!to) throw new Error('queuePendingEmail: missing recipient ("to")');

    const body = {
        fields: {
            to:            { stringValue: String(to) },
            subject:       { stringValue: String(subject || '') },
            html:          { stringValue: String(html || '') },
            recipientName: { stringValue: String(recipientName || '') },
            kind:          { stringValue: String(kind || 'customer') },
            refId:         { stringValue: String(refId || '') },
            refType:       { stringValue: String(refType || '') },
            source:        { stringValue: String(source || '') },
            status:        { stringValue: 'pending' },
            createdAt:     { doubleValue: Date.now() },
        },
    };

    const res = await fetch(FIRESTORE_PENDING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore REST API Error: ${text}`);
    }
    return res.json();
}
