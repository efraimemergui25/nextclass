/* eslint-disable */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, FileText } from 'lucide-react';
import { buildInvoiceHtml, computeInvoiceTotals, suggestInvoiceNumber } from '../lib/invoice';
import { BUSINESS } from '../lib/businessProfile';

// Full invoice generator — live-preview a legally-structured חשבונית מס for an
// order, edit the issue fields, then print or download. Business identity comes
// from businessProfile.js (embedded everywhere).
export default function InvoiceModal({ order, onClose, business }) {
    const biz = { ...BUSINESS, ...(business || {}) };
    const [docType, setDocType] = useState('tax');
    const [invoiceNumber, setInvoiceNumber] = useState(suggestInvoiceNumber(order));
    const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('he-IL'));
    const [vatRate, setVatRate] = useState(biz.vatRate);
    const [allocationNumber, setAllocationNumber] = useState('');

    const opts = { docType, invoiceNumber, invoiceDate, vatRate, allocationNumber, business: biz };
    const html = useMemo(() => buildInvoiceHtml(order || {}, opts),
        [order, docType, invoiceNumber, invoiceDate, vatRate, allocationNumber]);
    const totals = useMemo(() => computeInvoiceTotals(order || {}, vatRate), [order, vatRate]);
    const needsAllocation = docType === 'tax' && totals.net > (biz.allocationThreshold || Infinity) && !allocationNumber;

    const doPrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(html); w.document.close();
        w.focus(); setTimeout(() => w.print(), 350);
    };
    const doDownload = () => {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `invoice-${invoiceNumber}.html`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const field = { width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 700, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none' };
    const lbl = { display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', marginBottom: 4 };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(12,18,32,0.55)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                dir="rtl" style={{ position: 'relative', width: '100%', maxWidth: 1000, height: '88vh', background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '320px 1fr', boxShadow: '0 30px 90px rgba(0,0,0,0.4)' }}>
                {/* Controls */}
                <div style={{ borderInlineEnd: '1px solid rgba(0,0,0,0.07)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color="#fff" /></div>
                        <div><p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1D1D1F' }}>הפקת חשבונית</p><p style={{ margin: 0, fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>{biz.legalName} · ח.פ {biz.taxId}</p></div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: 3, borderRadius: 12, background: 'rgba(0,0,0,0.04)' }}>
                        {[{ id: 'tax', label: 'חשבונית מס' }, { id: 'proforma', label: 'חשבונית עסקה' }].map(t => (
                            <button key={t.id} onClick={() => setDocType(t.id)}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: docType === t.id ? '#007AFF' : 'transparent', color: docType === t.id ? '#fff' : '#86868B' }}>{t.label}</button>
                        ))}
                    </div>

                    <div><label style={lbl}>מספר חשבונית</label><input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={field} /></div>
                    <div><label style={lbl}>תאריך</label><input value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={field} /></div>
                    <div><label style={lbl}>מע״מ %</label><input type="number" value={vatRate} onChange={e => setVatRate(Number(e.target.value))} style={field} /></div>
                    <div>
                        <label style={lbl}>מספר הקצאה (רשות המסים){needsAllocation ? ' — נדרש' : ''}</label>
                        <input value={allocationNumber} onChange={e => setAllocationNumber(e.target.value)} placeholder="לעסקאות גדולות" style={{ ...field, borderColor: needsAllocation ? 'rgba(255,149,0,0.5)' : 'rgba(0,0,0,0.10)' }} />
                    </div>
                    {needsAllocation && (
                        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#B25E00', margin: 0, lineHeight: 1.5 }}>עסקה מעל ₪{(biz.allocationThreshold).toLocaleString()} (לפני מע״מ) — לפי מודל "חשבוניות ישראל" נדרש מספר הקצאה כדי שהלקוח יקזז מע״מ.</p>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={doPrint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 6px 18px rgba(0,122,255,0.30)' }}><Printer size={15} /> הדפס / שמור PDF</button>
                        <button onClick={doDownload} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.03)', color: '#6E6E73', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}><Download size={14} /> הורד HTML</button>
                    </div>
                </div>

                {/* Live preview */}
                <div style={{ position: 'relative', background: '#EEF1F6' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 12, insetInlineStart: 12, zIndex: 2, width: 34, height: 34, borderRadius: 11, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={17} /></button>
                    <iframe title="invoice" srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} />
                </div>
            </motion.div>
        </div>
    );
}
