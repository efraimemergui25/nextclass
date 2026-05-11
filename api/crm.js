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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const key = process.env.HUBSPOT_API_KEY;
    if (!key) return res.status(200).json({ skipped: true, reason: 'HUBSPOT_API_KEY not set' });

    const { quote } = req.body ?? {};
    if (!quote) return res.status(400).json({ error: 'Missing quote payload' });

    try {
        // 1. Create / update Contact
        const contact = await hubspotRequest('/crm/v3/objects/contacts', {
            properties: {
                firstname: (quote.contactName || '').split(' ')[0] || 'לא ידוע',
                lastname:  (quote.contactName || '').split(' ').slice(1).join(' ') || '',
                email:     quote.email || '',
                phone:     quote.phone || '',
                company:   quote.institution || '',
                jobtitle:  quote.contactRole || '',
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
