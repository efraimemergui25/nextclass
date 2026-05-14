/**
 * Vercel Serverless Function — HubSpot CRM integration
 * POST /api/crm
 *
 * Creates a HubSpot Contact + Deal when a quote is submitted.
 * Requires HUBSPOT_API_KEY in Vercel environment variables.
 *
 * Setup:
 *  1. Create a free HubSpot account at hubspot.com
 *  2. Settings → Integrations → Private Apps → Create App
 *  3. Scopes: crm.objects.contacts.write, crm.objects.deals.write
 *  4. Copy the token → add as HUBSPOT_API_KEY in Vercel dashboard
 */

import { isRateLimited } from './_rateLimit.js';
import { logSecurityEvent } from './_logEvent.js';

const HUBSPOT_BASE = 'https://api.hubapi.com';

async function hubspotRequest(path, body) {
    const res = await fetch(`${HUBSPOT_BASE}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HubSpot ${path} → ${res.status}: ${text}`);
    }
    return res.json();
}

function sanitize(str, maxLen = 200) {
    return String(str ?? '').replace(/[<>"']/g, '').trim().slice(0, maxLen);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(ip, { max: 5, windowMs: 60_000 })) {
        logSecurityEvent('rate_limited', { endpoint: 'crm', ip });
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (JSON.stringify(req.body ?? {}).length > 16_000) {
        logSecurityEvent('payload_too_large', { endpoint: 'crm', ip });
        return res.status(413).json({ error: 'Payload too large' });
    }

    const key = process.env.HUBSPOT_API_KEY;
    if (!key) return res.status(200).json({ skipped: true, reason: 'HUBSPOT_API_KEY not set' });

    const { quote } = req.body ?? {};
    if (!quote || typeof quote !== 'object') return res.status(400).json({ error: 'Missing quote payload' });

    try {
        // 1. Create / update Contact
        const nameParts = sanitize(quote.contactName, 120).split(' ');
        const contact = await hubspotRequest('/crm/v3/objects/contacts', {
            properties: {
                firstname: nameParts[0] || 'לא ידוע',
                lastname:  nameParts.slice(1).join(' ') || '',
                email:     sanitize(quote.email, 254),
                phone:     sanitize(quote.phone, 30),
                company:   sanitize(quote.institution, 150),
                jobtitle:  sanitize(quote.contactRole, 100),
            },
        }).catch(() => null); // ignore duplicate contact error

        // 2. Create Deal
        const itemsSummary = (quote.items || [])
            .map(i => `${i.title} ×${i.qty ?? 1}`)
            .join(', ');

        await hubspotRequest('/crm/v3/objects/deals', {
            properties: {
                dealname:   `[NextClass] ${quote.institution || 'פנייה'} — ${quote.id}`,
                amount:     String(quote.subtotal ?? 0),
                dealstage:  'appointmentscheduled',
                pipeline:   'default',
                description: itemsSummary,
                closedate:  String(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            associations: contact?.id ? [{
                to: { id: contact.id },
                types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
            }] : [],
        });

        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('[CRM]', err.message);
        res.status(500).json({ error: err.message });
    }
}
