/**
 * Amal purchase order #80363169 (extracted from the PO the owner provided).
 * Used by the admin "create first order" one-time action — seeds the first real
 * order into the pipeline and saves a faithful document to the vault.
 * The 27" ASUS monitor on the PO maps to the real catalog product `asus-va279qg-j`.
 */
export function buildAmalPO() {
  const now = Date.now();
  return {
    id: 'PO-80363169', type: 'quote', source: 'po', status: 'חדש',
    orderNumber: '80363169', poDate: '08/07/2026', deliveryDate: '18/07/2026',
    institution: 'צפת עמל טכנ׳ מעיינות', contactName: 'איילת רחמים',
    contactRole: 'הנהלת חשבונות', email: 'ayeletr@amalnet.k12.il', phone: '050-5990370',
    address: 'פרומצנקו 5', city: 'צפת', zip: '',
    budgetCode: '81019021', supplierRef: '30000679', companyId: '510942360',
    paymentTerms: 'שוטף + 80', authorizedBy: 'איילת רחמים', currency: 'ILS',
    schoolRef: '3266', costCenter: '7550 צפת טכנולוגי', invoiceTo: 'עמל מעיינות צפת',
    network: 'עמל', schoolNumber: '755',
    items: [
      { catalogNumber: 'asus-va279qg-j', title: 'מסך מחשב ASUS VA279QG-J 27"', qty: 2, unit: 'יחידה', price: 375, salePrice: 375 },
    ],
    subtotal: 750, vatAmount: 135, totalIncVat: 885,
    notes: 'הזמנת רכש מרשת עמל — בי"ס 755 צפת עמל טכנ׳ מעיינות. אספקה בתיאום מראש עם איילת רחמים (נייד 050-5990370). חשבונית עבור: עמל מעיינות צפת.',
    dateTs: now, date: '08/07/2026', createdTs: now,
  };
}

export function amalPoHtml(p) {
  const rows = p.items.map(it =>
    `<tr><td style="padding:8px;border:1px solid #ddd">${it.title}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${it.qty}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">₪${it.price}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">₪${it.price * it.qty}</td></tr>`
  ).join('');
  return `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>הזמנת רכש ${p.orderNumber}</title></head>
<body style="font-family:Heebo,Arial,sans-serif;color:#1D1D1F;max-width:760px;margin:0 auto;padding:32px;direction:rtl">
<h1 style="color:#007AFF;margin:0 0 4px">הזמנת רכש מס' ${p.orderNumber}</h1>
<p style="color:#86868B;margin:0 0 20px">רשת עמל · בי"ס ${p.schoolNumber} ${p.institution} · תאריך: ${p.poDate}</p>
<div style="background:#F5F5F7;border-radius:16px;padding:18px;margin-bottom:16px;line-height:1.9">
<b>מוסד:</b> ${p.institution}<br><b>איש קשר:</b> ${p.contactName} · ${p.phone} · ${p.email}<br>
<b>כתובת אספקה:</b> ${p.address}, ${p.city}<br><b>תאריך אספקה:</b> ${p.deliveryDate}<br>
<b>סעיף תקציבי:</b> ${p.budgetCode} · <b>מרכז/תמחיר:</b> ${p.costCenter}<br>
<b>תנאי תשלום:</b> ${p.paymentTerms} · <b>מס' ספק:</b> ${p.supplierRef} · <b>ח.פ.:</b> ${p.companyId}<br>
<b>חשבונית עבור:</b> ${p.invoiceTo} · <b>מס' רץ בית ספרי:</b> ${p.schoolRef}
</div>
<table style="width:100%;border-collapse:collapse">
<thead style="background:#007AFF;color:#fff"><tr><th style="padding:8px">פריט</th><th style="padding:8px">כמות</th><th style="padding:8px">מחיר יח'</th><th style="padding:8px">סה"כ</th></tr></thead>
<tbody>${rows}</tbody></table>
<div style="text-align:left;margin-top:16px;line-height:1.9">
סכום ביניים: ₪${p.subtotal}<br>מע"מ 18%: ₪${p.vatAmount}<br><b style="font-size:18px">סה"כ כולל מע"מ: ₪${p.totalIncVat}</b></div>
<p style="color:#86868B;font-size:12px;margin-top:20px">${p.notes}</p>
</body></html>`;
}
