/**
 * GET /api/hubspot-stats
 * Returns contacts count, recent contacts, and open deals from HubSpot.
 */

const BASE = 'https://api.hubapi.com';

async function hs(key, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`HubSpot ${res.status}`);
    return res.json();
}

export default async function handler(req, res) {
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

        res.status(200).json({
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
        res.status(200).json({ configured: true, error: err.message });
    }
}
