/**
 * INBOUND EMAIL → ORDER  (Email-to-Order intake, à la Salesforce Email-to-Case)
 * ─────────────────────────────────────────────────────────────────────────────
 * A webhook for a dedicated order inbox (e.g. orders@getnextclass.com). Point your
 * mail provider's inbound-parse / email-worker at:  POST /api/inbound-email
 *
 * EMAIL INTELLIGENCE
 * ------------------
 * Every inbound message is first CLASSIFIED (heuristic-first) into:
 *   • 'order' — a fresh purchase order → create a needs_review order (legacy path)
 *   • 'reply' — a reply about an EXISTING order (supplier confirmation, customer
 *               question, shipping update) → thread it onto that order instead of
 *               opening a duplicate.
 *   • 'other' — anything else → still parsed into a review order (fail-safe).
 *
 * When a reply is matched to an order it is appended to that order's `activity`
 * subcollection and the order is flagged `unreadAdmin:true`, plus a
 * `supplierReplyHint` (confirmed / shipped) when the body signals it — so the
 * operator sees a suggestion in מרכז ההזמנות.
 *
 * It AI-parses new orders (via /api/ocr-order) and writes a REVIEW-STATE order
 * into the `quotes` pipeline (source:'email', overallStage:'needs_review'). Nothing
 * is sent and nothing is auto-confirmed — the operator reviews and promotes it.
 * This NEVER sends email (respects the no-auto-send invariant).
 *
 * Accepts JSON or urlencoded bodies with { from, subject, text }. A Cloudflare
 * Email Worker (or SendGrid Inbound Parse configured to POST JSON) is the simplest
 * router. Multipart form-data is best-effort (raw text field only).
 */

import crypto from 'node:crypto';

const PROJECT = 'nextclass-d2364';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

/* ─── Firestore auth ──────────────────────────────────────────────────────────
   The `quotes` collection requires an authenticated writer. Set a Google service-
   account key JSON in the FIREBASE_SERVICE_ACCOUNT env var (Vercel) and every REST
   call below is signed with a short-lived OAuth token. Without it the calls run
   unauthenticated (and Firestore rules will deny them) — so this webhook only
   goes live once the SA key is configured. */
let _tok = null, _tokExp = 0, _accessToken = null;
async function getAccessToken() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) return null;
    if (_tok && Date.now() < _tokExp - 60000) return _tok;
    try {
        const sa = JSON.parse(raw);
        const now = Math.floor(Date.now() / 1000);
        const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
        const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
        const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
        const r = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${sig}`,
        });
        const j = await r.json();
        if (!j.access_token) return null;
        _tok = j.access_token; _tokExp = Date.now() + (j.expires_in || 3600) * 1000;
        return _tok;
    } catch { return null; }
}
// Firestore REST headers (adds Authorization when a token was obtained this run).
function fsHeaders() {
    return _accessToken ? { 'Content-Type': 'application/json', Authorization: `Bearer ${_accessToken}` } : { 'Content-Type': 'application/json' };
}

/* Firestore REST typed-value serializer (recursive — handles items[] maps). */
function fsVal(v) {
    if (v == null) return { nullValue: null };
    if (typeof v === 'string') return { stringValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(fsVal) } };
    if (typeof v === 'object') return { mapValue: { fields: fsFields(v) } };
    return { stringValue: String(v) };
}
function fsFields(obj) {
    const f = {};
    for (const [k, val] of Object.entries(obj)) if (val !== undefined) f[k] = fsVal(val);
    return f;
}

/**
 * Pick the best attachment to OCR — the real order DOCUMENT (a PDF or image),
 * not an inline signature/logo. CloudMailin's JSON-Normalized shape puts each
 * attachment as { content:<base64>, content_type, file_name, size, disposition }.
 * We prefer a non-inline pdf/image; fall back to any pdf/image. Returns
 * { content, mime, name } or null when there's nothing scannable.
 */
function pickAttachment(body) {
    const list = Array.isArray(body.attachments) ? body.attachments
        : Array.isArray(body.Attachments) ? body.Attachments : [];
    const norm = list.map(a => ({
        content: a.content || a.Content || a.data || '',                 // base64
        mime: String(a.content_type || a.contentType || a.type || '').toLowerCase(),
        name: a.file_name || a.fileName || a.name || 'attachment',
        disposition: String(a.disposition || '').toLowerCase(),
    })).filter(a => a.content);
    if (!norm.length) return null;
    const isDoc = (a) => a.mime === 'application/pdf' || a.mime.startsWith('image/');
    // A real PO is almost never disposition:inline (those are embedded logos/sigs).
    return norm.find(a => isDoc(a) && a.disposition !== 'inline') || norm.find(isDoc) || null;
}

/* Pull a display name + address out of a "Name <addr@x>" From header. */
function parseFrom(from) {
    const s = String(from || '');
    const m = s.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>/);
    if (m) return { name: m[1].trim(), email: m[2].trim() };
    const em = s.match(/[\w.+-]+@[\w.-]+\.\w+/);
    return { name: (s.split('@')[0] || '').trim(), email: em ? em[0] : '' };
}

async function readBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    let raw = '';
    try { for await (const c of req) raw += c; } catch { /* noop */ }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { /* not json */ }
    const params = new URLSearchParams(raw);              // urlencoded fallback
    const o = {}; for (const [k, v] of params) o[k] = v; return o;
}

/* ─── EMAIL INTELLIGENCE ──────────────────────────────────────────────────── */

/**
 * Extract an order-reference token from subject+body. Prefers explicit prefixed
 * ids (PO-/OCR-/EM-/Q-) over a bare 6–9 digit number. Returns '' when none.
 */
function extractOrderToken(subject, text) {
    const hay = `${subject || ''}\n${text || ''}`;
    const prefixed = hay.match(/\b(?:PO|OCR|EM|Q)-\d+/i);
    if (prefixed) return prefixed[0].toUpperCase();
    const bare = hay.match(/\b\d{6,9}\b/);
    return bare ? bare[0] : '';
}

/**
 * Heuristic classifier (works standalone — no network needed). Returns one of
 * 'order' | 'reply' | 'other'. Reply signals: RE:/reply markers, Hebrew reply
 * words, an order token present, or an explicit body reference to an order.
 */
function classifyEmail(subject, text, token) {
    const subj = String(subject || '');
    const body = String(text || '');
    const hay = `${subj}\n${body}`;

    // Strong reply markers in the SUBJECT line (mail clients prepend these).
    const replySubject = /\b(re|fw|fwd)\s*:/i.test(subj) ||
        /(תשובה|אישור|מענה|בהמשך ל)/.test(subj);

    // Body references an existing order explicitly.
    const bodyRefsOrder = /(מספר הזמנה|הזמנה מספר|order\s*(no|number|#)|בהמשך להזמנה|לגבי הזמנה)/i.test(hay);

    // Supplier/customer reply vocabulary.
    const replyVocab = /(אישרנו|מאשר|מאשרים|אישור הזמנה|confirmed|נשלח|בדרך|tracking|מספר מעקב|במלאי|אזל|זמינות|מתי יגיע|סטטוס)/i.test(body);

    if (replySubject || bodyRefsOrder || (token && (replyVocab || replySubject))) return 'reply';
    if (token && replyVocab) return 'reply';

    // New-order signals: quote/PO language, item lists, price/qty tables.
    const orderVocab = /(הצעת מחיר|הזמנת רכש|purchase order|quote|קטלוג|כמות|מחיר|סה"?כ|לצרף|נא לספק|אבקש הזמנה)/i.test(hay);
    if (orderVocab && !replySubject) return 'order';

    return 'other';
}

/** Detect a supplier-reply hint (confirmed / shipped) from the body. */
function detectReplyHint(text) {
    const body = String(text || '');
    if (/(נשלח|בדרך|tracking|מספר מעקב|יצא למשלוח|shipped)/i.test(body)) return 'shipped';
    if (/(אישרנו|מאשר|מאשרים|אישור הזמנה|confirmed|approved)/i.test(body)) return 'confirmed';
    return '';
}

/** Deserialize a Firestore REST doc's `fields` map into a shallow plain object. */
function fsUnwrap(fields) {
    const out = {};
    for (const [k, v] of Object.entries(fields || {})) {
        if (v.stringValue != null) out[k] = v.stringValue;
        else if (v.integerValue != null) out[k] = Number(v.integerValue);
        else if (v.doubleValue != null) out[k] = v.doubleValue;
        else if (v.booleanValue != null) out[k] = v.booleanValue;
        else out[k] = v; // maps/arrays/null — not needed for matching
    }
    return out;
}

/** GET a single quote by doc id. Returns { id, ...fields } or null. */
async function getQuoteById(id) {
    if (!id) return null;
    try {
        const r = await fetch(`${FS_BASE}/quotes/${encodeURIComponent(id)}`, { headers: fsHeaders() });
        if (!r.ok) return null;
        const j = await r.json();
        if (!j || !j.fields) return null;
        const name = String(j.name || '');
        return { _docId: name.split('/').pop(), ...fsUnwrap(j.fields) };
    } catch { return null; }
}

/**
 * Firestore REST :runQuery — find a quote by a single equality fieldFilter.
 * The endpoint is POST ${FS_BASE}:runQuery and the response is an ARRAY of
 * entries; each entry is either { document: {...}, readTime } (a hit) or a
 * bookkeeping entry { readTime } with NO `document` key (skipped). We read
 * `entry.document.name` for the doc id and `.fields` for the data.
 */
async function queryQuoteByField(field, value) {
    if (!value) return null;
    const structuredQuery = {
        from: [{ collectionId: 'quotes' }],
        where: {
            fieldFilter: {
                field: { fieldPath: field },
                op: 'EQUAL',
                value: fsVal(value),
            },
        },
        limit: 3,
    };
    try {
        const r = await fetch(`${FS_BASE}:runQuery`, {
            method: 'POST', headers: fsHeaders(),
            body: JSON.stringify({ structuredQuery }),
        });
        if (!r.ok) return null;
        const rows = await r.json();
        if (!Array.isArray(rows)) return null;
        for (const entry of rows) {
            if (entry && entry.document && entry.document.fields) {
                const nm = String(entry.document.name || '');
                return { _docId: nm.split('/').pop(), ...fsUnwrap(entry.document.fields) };
            }
        }
        return null;
    } catch { return null; }
}

/**
 * Find the order an inbound email belongs to. Order of attempts:
 *   1. Exact doc GET on the extracted token (ids like EM-…, PO-…).
 *   2. runQuery where orderNumber == token.
 *   3. runQuery where email == sender address.
 * Returns the matched quote ({ _docId, ... }) or null.
 */
async function findMatchingOrder(token, senderEmail) {
    if (token) {
        const byId = await getQuoteById(token);
        if (byId) return byId;
        const byNum = await queryQuoteByField('orderNumber', token);
        if (byNum) return byNum;
    }
    if (senderEmail) {
        const byEmail = await queryQuoteByField('email', senderEmail);
        if (byEmail) return byEmail;
    }
    return null;
}

/** Append an activity entry to a quote's `activity` subcollection (auto id). */
async function appendActivity(matchId, entry) {
    const url = `${FS_BASE}/quotes/${encodeURIComponent(matchId)}/activity`;
    const r = await fetch(url, {
        method: 'POST', headers: fsHeaders(),
        body: JSON.stringify({ fields: fsFields(entry) }),
    });
    return r.ok;
}

/**
 * Store an inbound attachment (PDF/image bytes) as base64 CHUNKS in Firestore,
 * mirroring src/admin/utils/fileStore.js EXACTLY so the admin UI can reassemble it
 * with the existing `fetchFirestoreBlobUrl(db,'order_documents',{id,type})`:
 *   • chunk docs  order_documents/<id>/chunks/<i> = { i, b64 }   (written FIRST)
 *   • metadata    order_documents/<id>           = { type, name, storage:'firestore', chunkCount }  (LAST)
 * This is the billing-free storage path (no Cloud Storage bucket). Returns the new
 * document id, or null if there's nothing to store / a write failed (fail-soft:
 * the order is still created, just without a viewable source document).
 */
const DOC_CHUNK_CHARS = 700000;              // ~700KB base64, < 1 MiB Firestore doc limit
async function storeDocument(base64, mime, name) {
    const clean = String(base64 || '').replace(/\s/g, '');
    if (!clean) return null;
    if (clean.length > 8_000_000) return null;   // ~6MB file — too large to keep, skip (still extracted)
    const docId = `DOC-${Date.now()}`;
    const chunks = [];
    for (let i = 0; i < clean.length; i += DOC_CHUNK_CHARS) chunks.push(clean.slice(i, i + DOC_CHUNK_CHARS));
    if (!chunks.length) chunks.push('');
    try {
        for (let i = 0; i < chunks.length; i++) {
            const r = await fetch(`${FS_BASE}/order_documents/${docId}/chunks?documentId=${i}`, {
                method: 'POST', headers: fsHeaders(),
                body: JSON.stringify({ fields: { i: { integerValue: String(i) }, b64: { stringValue: chunks[i] } } }),
            });
            if (!r.ok) return null;
        }
        const r = await fetch(`${FS_BASE}/order_documents?documentId=${encodeURIComponent(docId)}`, {
            method: 'POST', headers: fsHeaders(),
            body: JSON.stringify({ fields: fsFields({
                type: mime || 'application/octet-stream',
                name: name || 'document',
                storage: 'firestore',
                chunkCount: chunks.length,
                createdTs: Date.now(),
            }) }),
        });
        return r.ok ? docId : null;
    } catch { return null; }
}

/** Merge-patch a set of fields onto a quote (updateMask so we don't clobber). */
async function mergeQuote(matchId, patch) {
    const keys = Object.keys(patch);
    if (!keys.length) return false;
    const mask = keys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    const url = `${FS_BASE}/quotes/${encodeURIComponent(matchId)}?${mask}`;
    const r = await fetch(url, {
        method: 'PATCH', headers: fsHeaders(),
        body: JSON.stringify({ fields: fsFields(patch) }),
    });
    return r.ok;
}

/* ─── HANDLER ─────────────────────────────────────────────────────────────── */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    _accessToken = await getAccessToken();   // sign Firestore REST calls when SA key is present
    try {
        const body = await readBody(req);
        // Support flat webhooks AND CloudMailin's JSON-Normalized shape
        // ({ envelope:{from}, headers:{from,subject}, plain, reply_plain, html }).
        const H = body.headers || {};
        const env = body.envelope || {};
        const from = body.from || body.From || body.sender || H.from || H.From || env.from || '';
        const subject = body.subject || body.Subject || H.subject || H.Subject || '';
        const text = body.text || body.plain || body.reply_plain || body['body-plain'] || body.html || '';
        const hasAtt = !!pickAttachment(body);
        if (!text && !subject && !hasAtt) return res.status(400).json({ error: 'empty email' });

        const { name, email } = parseFrom(from);

        // 1) CLASSIFY (heuristic-first, no network required).
        const token = extractOrderToken(subject, text);
        const emailKind = classifyEmail(subject, text, token);

        // 2) THREAD-MATCH — only chase a match for replies (fail-safe throughout).
        // A scannable PDF/image attachment means a real PURCHASE ORDER — always create
        // a fresh order, never thread it onto an existing one (guards against a returning
        // customer's new PO being mis-classified as a 'reply' and silently swallowed).
        if (emailKind === 'reply' && !hasAtt) {
            try {
                const match = await findMatchingOrder(token, email);
                if (match && match._docId) {
                    const now = Date.now();
                    const stamp = new Date();
                    const snippet = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
                    await appendActivity(match._docId, {
                        type: 'email',
                        message: `תשובה נכנסה: ${subject || '(ללא נושא)'} — ${snippet}`,
                        from: email || from || '',
                        emailKind,
                        ts: now,
                        at: stamp.toISOString(),
                    });

                    const hint = detectReplyHint(text);
                    const patch = { unreadAdmin: true, lastInboundTs: now };
                    if (hint) patch.supplierReplyHint = hint;
                    await mergeQuote(match._docId, patch);

                    return res.status(200).json({
                        ok: true, threaded: true, matchId: match._docId,
                        emailKind, supplierReplyHint: hint || null,
                    });
                }
                // No match found → fall through to create-order path below.
            } catch { /* matching failed — fall through to legacy create path */ }
        }

        // 3) CREATE ORDER (legacy behaviour) — for 'order', 'other', or an
        //    unmatched 'reply'. AI extraction is best-effort via /api/ocr-order.
        //    REAL orders arrive as a PDF/image ATTACHMENT — send the FILE through
        //    the same "royal AI" scan the operator uses in the portal (Gemini reads
        //    PDF/images natively). Only fall back to the email BODY text when there's
        //    no scannable attachment. Either way the result is a needs_review draft
        //    the operator eyeballs, corrects and approves — nothing auto-confirms.
        const att = pickAttachment(body);
        let d = {};
        try {
            const host = req.headers['x-forwarded-host'] || req.headers.host;
            const proto = req.headers['x-forwarded-proto'] || 'https';
            const ocrPayload = att
                ? { fileBase64: att.content, mimeType: att.mime || 'application/pdf', fileName: att.name }
                : { text: `${subject}\n\n${text}`, fileName: subject || 'email order' };
            const r = await fetch(`${proto}://${host}/api/ocr-order`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ocrPayload),
            });
            const j = await r.json();
            if (j && j.data) d = j.data;
        } catch { /* extraction is optional — the raw email is always kept */ }

        // Persist the ORIGINAL document (PDF/image) so the operator sees it beside
        // the extracted fields in מרכז ההזמנות — the "מסמך המקור" split-view. Fail-soft.
        let documentId = null;
        if (att) documentId = await storeDocument(att.content, att.mime, att.name);

        const now = Date.now();
        const id = `EM-${now}`;
        const stamp = new Date();
        const fields = fsFields({
            id,
            contactName: d.contactName || name || '',
            institution: d.institution || '',
            phone: d.phone || '',
            email: d.email || email || '',
            address: d.address || '',
            city: d.city || '',
            items: Array.isArray(d.items) ? d.items.map(it => ({
                catalogNumber: it.catalogNumber || '', title: it.title || '',
                qty: Number(it.qty) || 1, unit: it.unit || 'יח׳',
                price: Number(it.price) || Number(it.salePrice) || 0,
                salePrice: Number(it.salePrice) || Number(it.price) || 0,
            })) : [],
            subtotal: Number(d.subtotal) || 0,
            vatAmount: d.vatAmount != null ? Number(d.vatAmount) : null,
            totalIncVat: d.totalIncVat != null ? Number(d.totalIncVat) : null,
            notes: d.notes || '',
            orderNumber: d.orderNumber || token || '',
            deliveryDate: d.deliveryDate || '',
            source: 'email',
            emailKind,
            overallStage: 'needs_review',
            status: 'לבדיקה ידנית',
            fulfillmentMode: 'dropship',
            stageEnteredTs: now,
            rawEmail: String(text).slice(0, 12000),
            emailSubject: subject || '',
            emailFrom: from || '',
            hasAttachment: !!att,
            attachmentName: att ? att.name : '',
            intakeSource: att ? 'attachment' : 'body',   // was the data scanned from a FILE or the email body?
            documentId: documentId || null,              // → order_documents/<id> (viewable source doc)
            documentType: att ? (att.mime || 'application/pdf') : null,
            documentName: att ? att.name : null,
            unreadAdmin: true,                            // light up the bell — a NEW order needs review
            ocrConfidence: d.confidence != null ? Number(d.confidence) : null,
            history: [{ status: 'לבדיקה ידנית', ts: now }],
            dateTs: now,
            date: stamp.toLocaleDateString('he-IL'),
        });

        const url = `${FS_BASE}/quotes?documentId=${encodeURIComponent(id)}`;
        const fsRes = await fetch(url, {
            method: 'POST', headers: fsHeaders(),
            body: JSON.stringify({ fields }),
        });
        if (!fsRes.ok) {
            const t = await fsRes.text();
            return res.status(500).json({ error: `Firestore write failed: ${t}` });
        }
        return res.status(200).json({ ok: true, threaded: false, id, emailKind, parsed: !!d.contactName });
    } catch (err) {
        return res.status(500).json({ error: String(err) });
    }
}
