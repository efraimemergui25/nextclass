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

// Best agreed unit cost for an item from a supplier's price rows (0 if unknown).
export function bestCostFor(item, prices = []) {
    const hit = prices.filter(p => priceMatchesItem(p, item) && priceIsValid(p))
        .sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0))[0];
    return hit ? Number(hit.cost) || 0 : 0;
}

// Total pre-negotiated supplier cost for an order's items (for a chosen supplier).
export function supplierCostForOrder(order, prices = []) {
    let total = 0, matched = 0;
    for (const it of (order?.items || [])) {
        const c = bestCostFor(it, prices);
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
