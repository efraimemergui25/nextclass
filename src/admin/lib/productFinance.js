/* eslint-disable */
// Single source of truth for product profitability math.
// Cost + sell price live on the product doc, so every screen that reads the
// `products` collection (Inventory, Mapping, Analytics…) stays in sync.
//
// Product financial fields:
//   price           — sell price to the customer (ILS)
//   supplierCost    — cost from supplier in ILS
//   supplierCostUSD — cost from supplier in USD (optional)
//   costCurrency    — 'ILS' | 'USD' (which cost field is authoritative)

export const DEFAULT_USD_ILS = 3.7;

// Resolve the cost in ILS given the chosen currency + live FX rate.
export function costInILS(product = {}, fxRate = DEFAULT_USD_ILS) {
    const cur = product.costCurrency || 'ILS';
    if (cur === 'USD') {
        const usd = Number(product.supplierCostUSD) || 0;
        return usd * (Number(fxRate) || DEFAULT_USD_ILS);
    }
    return Number(product.supplierCost) || 0;
}

// Compute the full profitability picture for one product.
// Returns nulls-safe numbers plus a headline margin metric ("אחוז רווחיות").
export function computeMargins(product = {}, fxRate = DEFAULT_USD_ILS) {
    const sell = Number(product.price) || 0;
    const cost = costInILS(product, fxRate);
    const profit = sell - cost;                       // ₪ profit per unit
    const marginPct = sell > 0 ? (profit / sell) * 100 : null;   // gross margin % (of revenue)
    const markupPct = cost > 0 ? (profit / cost) * 100 : null;   // markup % (over cost)
    const hasData = sell > 0 && cost > 0;
    return { sell, cost, profit, marginPct, markupPct, hasData };
}

// Semantic color for a margin % (health at a glance).
export function marginColor(marginPct) {
    if (marginPct == null) return '#AEAEB2';
    if (marginPct >= 30) return '#34C759';   // healthy
    if (marginPct >= 15) return '#FF9500';   // thin
    if (marginPct >= 0)  return '#FF9F0A';   // very thin
    return '#FF3B30';                        // loss
}

export const fmtILS = (n) => `₪${Math.round(Number(n) || 0).toLocaleString()}`;
export const fmtPct = (n) => (n == null ? '—' : `${n >= 0 ? '' : ''}${n.toFixed(1)}%`);

// USD→ILS rate via our OWN serverless endpoint (/api/fx) — it aggregates 3
// upstream sources server-side, so it isn't blocked by browser CORS/CSP the way
// a direct client-side call to an external FX API is.
export async function fetchUsdIlsRate() {
    const res = await fetch('/api/fx', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
    const data = await res.json();
    const rate = data?.usdToIls ?? data?.rates?.ILS;
    if (!rate || !isFinite(rate)) throw new Error('FX rate missing');
    return Number(rate);
}
