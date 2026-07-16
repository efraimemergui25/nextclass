/* eslint-disable */
// ── NextClass invoice generator — legally-structured Israeli tax invoice ──────
// Produces a branded, print-ready HTML חשבונית מס with every field the law
// requires: business legal name + ח.פ + address, invoice no. + date, customer
// name + ID, line items (desc/qty/unit/total), net subtotal, VAT rate + amount,
// total incl. VAT, and a מספר הקצאה (allocation number) slot for large invoices.
import { BUSINESS } from './businessProfile';

const ils = (n) => `₪${(Math.round((Number(n) || 0) * 100) / 100).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Compute net / VAT / gross treating item sell prices as NET (pre-VAT, B2B standard).
export function computeInvoiceTotals(order, vatRate = BUSINESS.vatRate) {
    const items = (order?.items || []).map(it => {
        const qty = Number(it.qty ?? it.quantity) || 1;
        const unit = Number(it.salePrice ?? it.price) || 0;
        return {
            desc: it.title || it.name || 'פריט',
            sku: it.catalogNumber || it.sku || '',
            qty, unit, total: qty * unit,
        };
    });
    const net = items.reduce((s, i) => s + i.total, 0);
    const vatAmount = Math.round(net * (Number(vatRate) || 0)) / 100;
    const gross = Math.round((net + vatAmount) * 100) / 100;
    return { items, net, vatAmount, gross, vatRate: Number(vatRate) || 0 };
}

// Auto invoice number from the order id + year (editable in the UI before issuing).
export function suggestInvoiceNumber(order) {
    const yr = new Date().getFullYear();
    const seq = String(order?.id || '').replace(/\D/g, '').slice(-5) || '00001';
    return `${yr}-${seq}`;
}

export function buildInvoiceHtml(order = {}, opts = {}) {
    const biz = { ...BUSINESS, ...(opts.business || {}) };
    const vatRate = opts.vatRate != null ? Number(opts.vatRate) : biz.vatRate;
    const { items, net, vatAmount, gross } = computeInvoiceTotals(order, vatRate);
    const docType = opts.docType || 'tax'; // 'tax' | 'proforma'
    const title = docType === 'tax' ? 'חשבונית מס' : 'חשבונית עסקה / דרישת תשלום';
    const invoiceNumber = opts.invoiceNumber || suggestInvoiceNumber(order);
    const invoiceDate = opts.invoiceDate || new Date().toLocaleDateString('he-IL');
    const allocationNumber = opts.allocationNumber || '';
    const needsAllocation = docType === 'tax' && net > (biz.allocationThreshold || Infinity);

    const custName = order.contactName || order.customer || order.institution || 'לקוח';
    const custOrg = order.institution && order.institution !== custName ? order.institution : '';
    const custId = order.companyId || order.taxId || '';
    const custAddr = [order.address, order.city, order.zip].filter(Boolean).join(', ');
    const custPhone = order.phone || '';
    const custEmail = order.email || '';

    const rows = items.map((it, i) => `
        <tr>
          <td style="text-align:center;color:#8A94A6;">${i + 1}</td>
          <td>
            <div style="font-weight:700;color:#1D1D1F;">${it.desc}</div>
            ${it.sku ? `<div style="font-size:11px;color:#8A94A6;">מק״ט: ${it.sku}</div>` : ''}
          </td>
          <td style="text-align:center;">${it.qty}</td>
          <td style="text-align:left;white-space:nowrap;">${ils(it.unit)}</td>
          <td style="text-align:left;white-space:nowrap;font-weight:800;">${ils(it.total)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} ${invoiceNumber} — ${biz.legalName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Heebo','Segoe UI',Arial,sans-serif;color:#1D1D1F;background:#EEF1F6;padding:24px;}
  .page{max-width:820px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 48px rgba(20,40,80,0.12);}
  .head{display:flex;justify-content:space-between;align-items:flex-start;padding:28px 32px;background:linear-gradient(135deg,#007AFF,#5AC8FA);color:#fff;}
  .brand{font-size:26px;font-weight:900;letter-spacing:-0.5px;}
  .brand small{display:block;font-size:12px;font-weight:600;opacity:0.9;margin-top:2px;}
  .doctype{text-align:left;}
  .doctype .t{font-size:20px;font-weight:900;}
  .doctype .n{font-size:13px;opacity:0.95;margin-top:4px;}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:24px 32px;border-bottom:1px solid #EEF1F6;}
  .box{background:#F7F9FC;border:1px solid #EEF1F6;border-radius:14px;padding:16px 18px;}
  .box h4{font-size:11px;font-weight:900;color:#8A94A6;letter-spacing:0.06em;margin-bottom:8px;}
  .box .row{font-size:13.5px;color:#3A3A3C;margin-top:3px;}
  .box .row b{color:#1D1D1F;}
  table{width:100%;border-collapse:collapse;margin:8px 0;}
  thead th{font-size:11px;font-weight:900;color:#8A94A6;letter-spacing:0.04em;text-align:right;padding:10px 32px;background:#F7F9FC;border-bottom:2px solid #EEF1F6;}
  thead th:nth-child(4),thead th:nth-child(5){text-align:left;}
  thead th:nth-child(1),thead th:nth-child(3){text-align:center;}
  tbody td{padding:12px 32px;border-bottom:1px solid #F2F4F8;font-size:13.5px;}
  .totals{display:flex;justify-content:flex-start;padding:8px 32px 24px;}
  .totals .card{min-width:280px;background:#F7F9FC;border:1px solid #EEF1F6;border-radius:14px;padding:16px 20px;}
  .totals .line{display:flex;justify-content:space-between;font-size:13.5px;color:#3A3A3C;padding:5px 0;}
  .totals .grand{display:flex;justify-content:space-between;font-size:19px;font-weight:900;color:#007AFF;padding-top:10px;margin-top:6px;border-top:2px solid #E3E8F0;}
  .foot{padding:18px 32px 28px;border-top:1px solid #EEF1F6;font-size:12px;color:#8A94A6;line-height:1.7;}
  .alloc{margin:0 32px 16px;padding:12px 16px;border-radius:12px;font-size:12.5px;font-weight:700;}
  .alloc.req{background:rgba(255,149,0,0.10);border:1px solid rgba(255,149,0,0.28);color:#B25E00;}
  .alloc.ok{background:rgba(52,199,89,0.10);border:1px solid rgba(52,199,89,0.28);color:#1E8E3E;}
  @media print{body{background:#fff;padding:0;}.page{box-shadow:none;border-radius:0;}}
</style></head>
<body><div class="page">
  <div class="head">
    <div class="brand">${biz.tradeName}<small>${biz.legalName} · ${biz.entityLabel}</small></div>
    <div class="doctype"><div class="t">${title}</div><div class="n">מס׳ ${invoiceNumber} · ${invoiceDate}</div></div>
  </div>

  <div class="meta">
    <div class="box">
      <h4>מאת (העוסק)</h4>
      <div class="row"><b>${biz.legalName}</b></div>
      <div class="row">ח.פ ${biz.taxId}</div>
      <div class="row">${biz.address}</div>
      <div class="row">${biz.phone} · ${biz.email}</div>
    </div>
    <div class="box">
      <h4>לכבוד (הלקוח)</h4>
      <div class="row"><b>${custName}</b></div>
      ${custOrg ? `<div class="row">${custOrg}</div>` : ''}
      ${custId ? `<div class="row">ח.פ / ע.מ ${custId}</div>` : ''}
      ${custAddr ? `<div class="row">${custAddr}</div>` : ''}
      ${custPhone ? `<div class="row">${custPhone}</div>` : ''}
      ${custEmail ? `<div class="row">${custEmail}</div>` : ''}
    </div>
  </div>

  ${allocationNumber
      ? `<div class="alloc ok">✔ מספר הקצאה (רשות המסים): <b>${allocationNumber}</b></div>`
      : (needsAllocation ? `<div class="alloc req">⚠️ עסקה מעל ₪${(biz.allocationThreshold).toLocaleString()} (לפני מע״מ) — נדרש מספר הקצאה מרשות המסים כדי שהלקוח יוכל לקזז מע״מ. הזן/י מספר הקצאה לפני ההנפקה.</div>` : '')}

  <table>
    <thead><tr><th>#</th><th>תיאור</th><th>כמות</th><th>מחיר יח׳</th><th>סה״כ</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:24px;color:#8A94A6;">אין פריטים</td></tr>'}</tbody>
  </table>

  <div class="totals"><div class="card">
    <div class="line"><span>סכום לפני מע״מ</span><b>${ils(net)}</b></div>
    <div class="line"><span>מע״מ ${vatRate}%</span><b>${ils(vatAmount)}</b></div>
    <div class="grand"><span>סה״כ לתשלום</span><span>${ils(gross)}</span></div>
  </div></div>

  <div class="foot">
    ${docType === 'tax'
        ? 'חשבונית מס זו הופקה על ידי ' + biz.legalName + ' (ח.פ ' + biz.taxId + ').'
        : 'מסמך זה הוא חשבונית עסקה / דרישת תשלום ואינו מהווה חשבונית מס לצורכי קיזוז מע״מ.'}
    <br/>תודה שרכשתם ב-${biz.tradeName} · ${biz.website} · ${biz.phone}
  </div>
</div></body></html>`;
}
