/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS — SUPPLIER PRICE BOOK  (pre-negotiated cost lookup + margin)
   ───────────────────────────────────────────────────────────────────────────────
   SAP "purchasing info record" idea, minimal: a per-supplier agreed cost per
   product (by catalog number or title), with optional validity + lead time. Used
   to auto-fill supplier cost + compute margin in the drop-ship forward flow.

   Collection: `supplier_prices`
     { supplierId, supplierName, catalogNumber, productTitle, cost, currency,
       leadDays, validFrom, validTo }

   Pure helpers — no data writes here (callers use the data layer / setDoc).
   ═══════════════════════════════════════════════════════════════════════════════ */

const norm = (s) => (s || '').toString().trim().toLowerCase();

// Does a price-book row apply to a given order item? Match by catalog number
// first (strongest), else by normalized title.
export function priceMatchesItem(price, item) {
    if (!price || !item) return false;
    const pc = norm(price.catalogNumber), ic = norm(item.catalogNumber);
    if (pc && ic) return pc === ic;
    const pt = norm(price.productTitle), it = norm(item.title || item.name);
    return !!pt && !!it && (pt === it || pt.includes(it) || it.includes(pt));
}

// Is a price row currently valid (validFrom/validTo optional, ms timestamps)?
export function priceIsValid(price, at = Date.now()) {
    if (!price) return false;
    if (price.validFrom && at < Number(price.validFrom)) return false;
    if (price.validTo && at > Number(price.validTo)) return false;
    return true;
}

// Look up an item's product in the catalog (by catalog number, then title).
function productForItem(item, catalog = []) {
    if (!item || !catalog.length) return null;
    const ic = norm(item.catalogNumber);
    return catalog.find(p => ic && (norm(p.sku) === ic || norm(p.catalogNumber) === ic || norm(p.id) === ic))
        || catalog.find(p => { const t = norm(item.title || item.name); const pt = norm(p.title); return !!t && !!pt && (pt === t || pt.includes(t) || t.includes(pt)); })
        || null;
}

// Best agreed unit cost for an item. Price-book row first (strongest); if none, fall
// back to the product's OWN recorded supplier cost — this reconciles the two cost books
// (`supplier_prices` ↔ `product.supplierCost`) so an order almost always has a cost.
export function bestCostFor(item, prices = [], catalog = []) {
    const hit = prices.filter(p => priceMatchesItem(p, item) && priceIsValid(p))
        .sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0))[0];
    if (hit) return Number(hit.cost) || 0;
    const prod = productForItem(item, catalog);
    return prod ? (Number(prod.supplierCost) || Number(prod.cost) || 0) : 0;
}

// Total pre-negotiated supplier cost for an order's items (for a chosen supplier).
export function supplierCostForOrder(order, prices = [], catalog = []) {
    let total = 0, matched = 0;
    for (const it of (order?.items || [])) {
        const c = bestCostFor(it, prices, catalog);
        if (c > 0) { matched++; total += c * (Number(it.qty) || 1); }
    }
    return { total, matched, itemCount: (order?.items || []).length };
}

// Margin from customer total vs supplier cost.
export function marginOf(customerTotal, supplierCost) {
    const rev = Number(customerTotal) || 0, cost = Number(supplierCost) || 0;
    const profit = rev - cost;
    const pct = rev > 0 ? Math.round((profit / rev) * 100) : 0;
    return { profit, pct };
}

// Filter a full price list to one supplier's rows.
export function pricesForSupplier(allPrices = [], supplierId) {
    return allPrices.filter(p => p.supplierId === supplierId);
}

export default { priceMatchesItem, priceIsValid, bestCostFor, supplierCostForOrder, marginOf, pricesForSupplier };
