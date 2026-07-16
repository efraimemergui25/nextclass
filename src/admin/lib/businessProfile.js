/* eslint-disable */
// ── NextClass legal business identity — single source of truth ────────────────
// Used by invoices, emails and any document that must carry the legal entity.
// Editable later via a Settings → Business Profile screen (config/business).

export const BUSINESS = {
    legalName: 'נקסט קלאס בע״מ',      // שם משפטי כפי שרשום ברשות המסים
    tradeName: 'NextClass',
    entityType: 'company',            // חברה בע״מ
    entityLabel: 'חברה בע״מ',
    taxId: '510942360',               // ח.פ / מספר חברה
    address: 'אזור התעשייה 100, רמלה',
    phone: '058-585-6356',
    email: 'nextclass.en@gmail.com',
    website: 'getnextclass.com',
    vatRate: 18,                      // מע״מ נוכחי בישראל (18% מ-2025)
    // Israel "allocation number" (מספר הקצאה) is required for a buyer to deduct VAT
    // on a tax invoice above this pre-VAT threshold. 2025: ₪20,000 · 2026-01: ₪10,000.
    allocationThreshold: 20000,
    accent: '#007AFF',
};

// Merge live overrides from Firestore config/business over the defaults above.
export function resolveBusiness(overrides) {
    return { ...BUSINESS, ...(overrides || {}) };
}
