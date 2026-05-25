export default async function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const SOURCES = [
        { url: 'https://open.er-api.com/v6/latest/USD',          get: d => d?.rates?.ILS },
        { url: 'https://api.exchangerate-api.com/v4/latest/USD',  get: d => d?.rates?.ILS },
        {
            url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
            get: d => d?.usd?.ils,
        },
    ];

    for (const src of SOURCES) {
        try {
            const response = await fetch(src.url, {
                headers: { 'User-Agent': 'NextClass/1.0' },
                signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) continue;
            const data = await response.json();
            const rate = src.get(data);
            if (rate && Number.isFinite(rate) && rate > 0.5) {
                return res.status(200).json({ usdToIls: rate });
            }
        } catch {}
    }

    res.status(503).json({ error: 'unavailable' });
}
