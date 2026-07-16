/* eslint-disable */
import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download, FileText, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { buildInvoiceHtml, computeInvoiceTotals, suggestInvoiceNumber } from '../lib/invoice';
import { BUSINESS } from '../lib/businessProfile';
import { useAdminData } from '../context/AdminDataContext';

// Full invoice generator — live-preview a legally-structured חשבונית מס for an
// order, edit the issue fields, then print or download. Business identity + the
// running invoice number come from the shared business profile (config/business).
export default function InvoiceModal({ order, onClose, business }) {
    const { business: liveBiz, issueInvoice } = useAdminData();
    const biz = { ...BUSINESS, ...(liveBiz || {}), ...(business || {}) };
    const nextNumber = `${new Date().getFullYear()}-${String((Number(biz.invoiceSeq) || 1000) + 1).padStart(5, '0')}`;
    const issuedRef = useRef(false);
    const iframeRef = useRef(null);
    const [docType, setDocType] = useState('tax');
    // Storefront (e-commerce) prices are VAT-inclusive; B2B quotes are net.
    const vatInclusive = order?._kind === 'order';
    const [invoiceNumber, setInvoiceNumber] = useState(order?.invoiceNumber || nextNumber || suggestInvoiceNumber(order));
    const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('he-IL'));
    const [vatRate, setVatRate] = useState(biz.vatRate);
    const [allocationNumber, setAllocationNumber] = useState('');

    const opts = { docType, invoiceNumber, invoiceDate, vatRate, allocationNumber, vatInclusive, business: biz };
    const html = useMemo(() => buildInvoiceHtml(order || {}, opts),
        [order, docType, invoiceNumber, invoiceDate, vatRate, allocationNumber]);
    const totals = useMemo(() => computeInvoiceTotals(order || {}, vatRate, { vatInclusive }), [order, vatRate]);
    const needsAllocation = docType === 'tax' && totals.net > (biz.allocationThreshold || Infinity) && !allocationNumber;

    // Render the (already-perfect, Hebrew-correct) invoice iframe to a REAL PDF
    // blob, client-side — no external service, no extra serverless function.
    const genPdfBlob = async () => {
        const [{ default: html2canvas }, jspdfMod] = await Promise.all([import('html2canvas'), import('jspdf')]);
        const JsPDF = jspdfMod.jsPDF || jspdfMod.default;
        const el = iframeRef.current?.contentDocument?.body;
        if (!el) throw new Error('no-invoice');
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', windowWidth: el.scrollWidth || 820 });
        const pdf = new JsPDF({ unit: 'pt', format: 'a4' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const imgW = pw;
        const imgH = canvas.height * (pw / canvas.width);
        const img = canvas.toDataURL('image/jpeg', 0.95);
        if (imgH <= ph) {
            pdf.addImage(img, 'JPEG', 0, 0, imgW, imgH);
        } else {
            let position = 0, remaining = imgH;
            while (remaining > 0) {
                pdf.addImage(img, 'JPEG', 0, position, imgW, imgH);
                remaining -= ph;
                if (remaining > 0) { pdf.addPage(); position -= ph; }
            }
        }
        return pdf.output('blob');
    };
    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });

    // Persist the invoice to the register once (assigns the running number).
    const ensureIssued = async () => {
        if (issuedRef.current || docType !== 'tax') return;
        issuedRef.current = true;
        try {
            const r = await issueInvoice?.(order, { invoiceNumber, docType, vatRate, allocationNumber, total: totals.gross });
            if (r?.number && r.number !== invoiceNumber) setInvoiceNumber(r.number);
        }
        catch (e) { /* non-blocking — printing still works */ }
    };
    const doPrint = async () => {
        await ensureIssued();
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(html); w.document.close();
        w.focus(); setTimeout(() => w.print(), 350);
    };
    const [busyPdf, setBusyPdf] = useState(false);
    const doDownload = async () => {
        setBusyPdf(true);
        try {
            await ensureIssued();
            let blob, name;
            try { blob = await genPdfBlob(); name = `invoice-${invoiceNumber}.pdf`; }
            catch { blob = new Blob([html], { type: 'text/html;charset=utf-8' }); name = `invoice-${invoiceNumber}.html`; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = name; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } finally { setBusyPdf(false); }
    };

    // Email the invoice to the customer as an attached (print-ready) file.
    const [sending, setSending] = useState(false);
    const [sentMsg, setSentMsg] = useState('');
    const custEmail = order?.email || '';
    const sendToCustomer = async () => {
        if (!custEmail) { setSentMsg('אין מייל ללקוח'); return; }
        setSending(true); setSentMsg('');
        try {
            await ensureIssued();
            const first = (order.contactName || '').split(' ')[0] || 'לקוח יקר';
            const covering = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"/></head><body style="margin:0;background:#F5F5F7;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center"><table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.07);"><tr><td style="height:4px;background:linear-gradient(90deg,#007AFF,#5AC8FA);"></td></tr><tr><td style="padding:30px 34px;"><div style="font-size:18px;font-weight:900;color:#1D1D1F;margin-bottom:12px;">NextClass</div><p style="font-size:15px;color:#1D1D1F;line-height:1.7;margin:0 0 16px;">שלום ${first},<br/>מצורפת חשבונית מס מס׳ <strong>${invoiceNumber}</strong> עבור הזמנתך. תודה שבחרת ב-NextClass!</p><div style="background:#F0F7FF;border-radius:14px;padding:14px 16px;font-size:13px;color:#3D3D3D;">📎 החשבונית מצורפת — ניתן לפתוח, לשמור ולהדפיס.</div><div style="font-size:10.5px;color:#B8BCC4;margin-top:16px;border-top:1px solid #EBEBEB;padding-top:12px;">${biz.legalName} · ח.פ ${biz.taxId} · ${biz.address}</div></td></tr></table></td></tr></table></body></html>`;
            // Attach a REAL PDF when possible; fall back to print-ready HTML.
            let filename, content;
            try { content = await blobToBase64(await genPdfBlob()); filename = `invoice-${invoiceNumber}.pdf`; }
            catch { content = btoa(unescape(encodeURIComponent(html))); filename = `invoice-${invoiceNumber}.html`; }
            const res = await fetch('/api/dispatch-email', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: custEmail, subject: `חשבונית מס ${invoiceNumber} — NextClass`, html: covering, attachments: [{ filename, content }] }),
            });
            const d = await res.json().catch(() => ({}));
            if (d.skipped) setSentMsg('חבר RESEND_API_KEY כדי לשלוח');
            else if (d.error) setSentMsg('שליחה נכשלה');
            else {
                setSentMsg('✓ נשלח ללקוח');
                // record in the unified email history (visible in תקשורת)
                try { await addDoc(collection(db, 'pending_emails'), { to: custEmail, subject: `חשבונית מס ${invoiceNumber} — NextClass`, html: covering, status: 'sent', sentAt: Date.now(), createdAt: serverTimestamp(), source: 'invoice', orderId: order?.id || '' }); } catch { /* best-effort */ }
            }
        } catch { setSentMsg('שגיאת שליחה'); }
        finally { setSending(false); setTimeout(() => setSentMsg(''), 4000); }
    };

    const field = { width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#F5F5F7', fontSize: 13, fontWeight: 700, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none' };
    const lbl = { display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', marginBottom: 4 };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(12,18,32,0.55)', backdropFilter: 'blur(6px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                dir="rtl" style={{ position: 'relative', width: '100%', maxWidth: 1000, height: '88vh', background: '#fff', borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '320px 1fr', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 30px 90px rgba(20,40,80,0.30), inset 0 1px 0 rgba(255,255,255,1)' }}>
                {/* Controls */}
                <div style={{ borderInlineEnd: '1px solid rgba(0,0,0,0.07)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,122,255,0.32), inset 0 1px 0 rgba(255,255,255,0.45)' }}><FileText size={18} color="#fff" /></div>
                        <div><p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1D1D1F' }}>הפקת חשבונית</p><p style={{ margin: 0, fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>{biz.legalName} · ח.פ {biz.taxId}</p></div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: 3, borderRadius: 12, background: 'rgba(0,0,0,0.045)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: 'inset 0 1px 2px rgba(20,40,80,0.05)' }}>
                        {[{ id: 'tax', label: 'חשבונית מס' }, { id: 'proforma', label: 'חשבונית עסקה' }].map(t => (
                            <motion.button key={t.id} onClick={() => setDocType(t.id)} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Heebo,sans-serif', background: docType === t.id ? 'linear-gradient(135deg,#007AFF,#007AFFdb)' : 'transparent', color: docType === t.id ? '#fff' : '#86868B', boxShadow: docType === t.id ? '0 6px 16px rgba(0,122,255,0.32), inset 0 1px 0 rgba(255,255,255,0.4)' : 'none' }}>{t.label}</motion.button>
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
                        <motion.button onClick={sendToCustomer} disabled={sending || !custEmail} title={custEmail ? `שלח ל-${custEmail}` : 'אין מייל ללקוח'}
                            whileHover={custEmail ? { y: -2, boxShadow: '0 12px 28px rgba(52,199,89,0.38), inset 0 1px 0 rgba(255,255,255,0.4)' } : undefined} whileTap={custEmail ? { scale: 0.98 } : undefined} transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 13, border: 'none', background: custEmail ? 'linear-gradient(135deg,#34C759,#2DB84B)' : '#E5E5EA', color: custEmail ? '#fff' : '#AEAEB2', fontSize: 13.5, fontWeight: 800, cursor: custEmail ? 'pointer' : 'not-allowed', fontFamily: 'Heebo,sans-serif', boxShadow: custEmail ? '0 6px 18px rgba(52,199,89,0.28), inset 0 1px 0 rgba(255,255,255,0.35)' : 'none' }}>
                            <Send size={15} /> {sending ? 'שולח…' : sentMsg || 'שלח ללקוח במייל'}
                        </motion.button>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <motion.button onClick={doPrint} whileHover={{ y: -2, boxShadow: '0 12px 28px rgba(0,122,255,0.38), inset 0 1px 0 rgba(255,255,255,0.4)' }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 13, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 6px 18px rgba(0,122,255,0.30), inset 0 1px 0 rgba(255,255,255,0.35)' }}><Printer size={14} /> הדפס / PDF</motion.button>
                            <motion.button onClick={doDownload} disabled={busyPdf} title="הורד PDF" whileHover={{ y: -2, boxShadow: '0 10px 24px rgba(20,40,80,0.12), inset 0 1px 0 rgba(255,255,255,0.9)' }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 14px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.9)', background: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(255,255,255,0.66))', backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)', color: '#6E6E73', fontSize: 12.5, fontWeight: 800, cursor: busyPdf ? 'wait' : 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 3px 10px rgba(20,40,80,0.08), inset 0 1px 0 rgba(255,255,255,1)' }}><Download size={14} />{busyPdf ? '' : ' PDF'}</motion.button>
                        </div>
                    </div>
                </div>

                {/* Live preview */}
                <div style={{ position: 'relative', background: '#EEF1F6' }}>
                    <motion.button onClick={onClose} whileHover={{ scale: 1.08, background: 'rgba(12,18,32,0.7)' }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} style={{ position: 'absolute', top: 12, insetInlineStart: 12, zIndex: 2, width: 34, height: 34, borderRadius: 11, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(12,18,32,0.5)', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(20,40,80,0.22), inset 0 1px 0 rgba(255,255,255,0.2)' }}><X size={17} /></motion.button>
                    <iframe ref={iframeRef} title="invoice" srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' }} />
                </div>
            </motion.div>
        </div>
    );
}
