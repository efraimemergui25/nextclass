/* eslint-disable */
/**
 * /api/integrations-status.js — the HubSpot/integrations hub.
 *  • GET  (default)             → which integrations are CONNECTED (booleans only)
 *  • GET  ?action=hubspot-stats → HubSpot contacts/deals summary
 *  • POST { quote }             → create a HubSpot contact + deal (from checkout)
 * (hubspot-stats + crm were merged in here to stay under Vercel Hobby's 12-function limit.)
 */
import { isRateLimited } from './_rateLimit.js';
import { logSecurityEvent } from './_logEvent.js';

const HS_BASE = 'https://api.hubapi.com';
async function hs(key, path, body) {
    const res = await fetch(`${HS_BASE}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`HubSpot ${res.status}`);
    return res.json();
}

async function hubspotStats(res) {
    const key = process.env.HUBSPOT_API_KEY;
    if (!key) return res.status(200).json({ configured: false });
    try {
        const [contacts, deals] = await Promise.all([
            hs(key, '/crm/v3/objects/contacts/search', {
                filterGroups: [],
                sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
                properties: ['firstname', 'lastname', 'email', 'company'],
                limit: 5,
            }),
            hs(key, '/crm/v3/objects/deals/search', {
                filterGroups: [{
                    filters: [{ propertyName: 'dealstage', operator: 'NEQ', value: 'closedwon' },
                               { propertyName: 'dealstage', operator: 'NEQ', value: 'closedlost' }]
                }],
                sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
                properties: ['dealname', 'amount', 'dealstage'],
                limit: 5,
            }),
        ]);
        const pipelineValue = deals.results.reduce((sum, d) => sum + Number(d.properties.amount || 0), 0);
        return res.status(200).json({
            configured: true,
            contacts: { total: contacts.total, recent: contacts.results.map(c => ({
                name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim() || c.properties.email || 'ללא שם',
                company: c.properties.company || '',
                email: c.properties.email || '',
            }))},
            deals: { total: deals.total, open: deals.results.length, pipelineValue, recent: deals.results.map(d => ({
                name: d.properties.dealname || 'עסקה',
                amount: Number(d.properties.amount || 0),
                stage: d.properties.dealstage || '',
            }))},
        });
    } catch (err) {
        console.error('[HubSpot Stats]', err.message);
        return res.status(200).json({ configured: true, error: err.message });
    }
}

// POST { quote } → create a HubSpot contact + deal (moved here from /api/crm)
async function crmCreate(req, res) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 5, windowMs: 60_000 })) { logSecurityEvent('rate_limited', { endpoint: 'crm', ip }); return res.status(429).json({ error: 'Too many requests' }); }
    if (JSON.stringify(req.body ?? {}).length > 16_000) { logSecurityEvent('payload_too_large', { endpoint: 'crm', ip }); return res.status(413).json({ error: 'Payload too large' }); }
    const key = process.env.HUBSPOT_API_KEY;
    if (!key) return res.status(200).json({ skipped: true, reason: 'HUBSPOT_API_KEY not set' });
    const { quote } = req.body ?? {};
    if (!quote || typeof quote !== 'object') return res.status(400).json({ error: 'Missing quote payload' });
    const sanitize = (s, m = 200) => String(s ?? '').replace(/[<>"']/g, '').trim().slice(0, m);
    try {
        const nameParts = sanitize(quote.contactName, 120).split(' ');
        const contact = await hs(key, '/crm/v3/objects/contacts', { properties: {
            firstname: nameParts[0] || 'לא ידוע', lastname: nameParts.slice(1).join(' ') || '',
            email: sanitize(quote.email, 254), phone: sanitize(quote.phone, 30),
            company: sanitize(quote.institution, 150), jobtitle: sanitize(quote.contactRole, 100),
        } }).catch(() => null);
        const itemsSummary = (quote.items || []).map(i => `${i.title} ×${i.qty ?? 1}`).join(', ');
        await hs(key, '/crm/v3/objects/deals', {
            properties: { dealname: `[NextClass] ${quote.institution || 'פנייה'} — ${quote.id}`, amount: String(quote.subtotal ?? 0), dealstage: 'appointmentscheduled', pipeline: 'default', description: itemsSummary, closedate: String(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            associations: contact?.id ? [{ to: { id: contact.id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }] : [],
        });
        return res.status(200).json({ ok: true });
    } catch (err) { console.error('[CRM]', err.message); return res.status(500).json({ error: err.message }); }
}

export default function handler(req, res) {
    if (req.method === 'POST') return crmCreate(req, res);
    res.setHeader('Cache-Control', 'no-store');
    const action = (req.query && req.query.action) || (String(req.url || '').match(/[?&]action=([^&]+)/) || [])[1] || '';
    if (action === 'hubspot-stats') return hubspotStats(res);

    const has = (v) => !!(v && String(v).trim());
    return res.status(200).json({
        checkedAt: Date.now(),
        services: {
            resend:   { connected: has(process.env.RESEND_API_KEY), from: has(process.env.RESEND_FROM) ? process.env.RESEND_FROM : 'onboarding@resend.dev (ברירת מחדל)', label: 'שליחת מיילים (Resend)' },
            gemini:   { connected: has(process.env.GEMINI_API_KEY) || has(process.env.VITE_GEMINI_API_KEY), label: 'AI — סריקה וייבוא מוצר (Gemini)' },
            groq:     { connected: has(process.env.GROQ_API_KEY), label: 'AI גיבוי (Groq)' },
            anthropic:{ connected: has(process.env.ANTHROPIC_API_KEY), label: 'קונסיירז\' (Anthropic)' },
            hubspot:  { connected: has(process.env.HUBSPOT_API_KEY), label: 'HubSpot CRM' },
            firebaseAdmin: { connected: has(process.env.FIREBASE_SERVICE_ACCOUNT), label: 'Firebase Admin (מייל נכנס)' },
        },
        aiReady: has(process.env.GEMINI_API_KEY) || has(process.env.VITE_GEMINI_API_KEY) || has(process.env.GROQ_API_KEY),
        emailReady: has(process.env.RESEND_API_KEY),
    });
}
