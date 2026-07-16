/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   ORDER REVIEW — SOURCE-DOCUMENT ⟷ EXTRACTED-DATA COMPARISON  (full-screen)
   ───────────────────────────────────────────────────────────────────────────────
   The review experience for an incoming order (email → OCR draft, overallStage
   'needs_review'): the ORIGINAL document on one side, the AI-extracted fields —
   editable — on the other. The operator eyeballs, corrects, adds missing items,
   then APPROVES (promotes the draft into the live pipeline). Nothing auto-confirms.

   Self-contained on purpose (new file) so it never collides with AdminOCR.jsx. It
   reuses the same `.ocr-splitview` layout + the billing-free fileStore document
   loader (order_documents/<id>/chunks) written by api/inbound-email.js.
   ═══════════════════════════════════════════════════════════════════════════════ */
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FileText, ExternalLink, X } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { renderPdfPages } from '../utils/fileStore';
import Combobox from './Combobox';
import { cityOptions } from '../lib/israelCities';

const HE = 'Heebo, sans-serif';
const glass = { background: 'rgba(255,255,255,0.9)', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 8px 40px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1)' };

const SectionHead = ({ emoji, title, color, extra }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15 }}>{emoji}</span>
            <p style={{ fontSize: 11, fontWeight: 900, color: color || '#86868B', letterSpacing: '0.06em', margin: 0 }}>{title}</p>
        </div>
        {extra}
    </div>
);

function ComboField({ label, value, onChange, onPick, options, placeholder, span = 1 }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span === 2 ? 'span 2' : 'auto', minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.04em' }}>{label}</span>
            <Combobox value={value} onChange={onChange} onPick={onPick} options={options} placeholder={placeholder || ''} inputStyle={{ padding: '9px 30px 9px 11px', fontSize: 12.5 }} />
        </label>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text', span = 1 }) {
    return (
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span === 2 ? 'span 2' : 'auto', minWidth: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.04em' }}>{label}</span>
            <input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} type={type} dir="rtl"
                style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12.5, fontWeight: 600, color: '#1D1D1F', fontFamily: HE, outline: 'none', boxSizing: 'border-box' }} />
        </label>
    );
}

const computeSubtotal = (items) => (items || []).reduce((s, it) => s + (Number(it.salePrice ?? it.price) || 0) * (Number(it.qty) || 1), 0);

export default function OrderReviewSplit({ order, onClose, onSave, onApprove, catalog = [], directory = [] }) {
    const productOptions = (catalog || []).map(p => ({ label: p.title || '', price: Number(p.price) || 0, image: p.image || '', sub: p.sku || p.model || '' })).filter(o => o.label);
    const instOptions = (() => { const s = new Set(); return (directory || []).filter(x => { const k = (x.institution || '').trim(); if (!k || s.has(k)) return false; s.add(k); return true; }).map(x => ({ label: x.institution, sub: x.city || x.address })); })();
    // ── editable buffer, seeded from the order ──
    const [d, setD] = useState(() => ({
        orderNumber: order.orderNumber || '', deliveryDate: order.deliveryDate || '', poDate: order.poDate || order.date || '',
        budgetCode: order.budgetCode || '', paymentTerms: order.paymentTerms || '',
        contactName: order.contactName || '', institution: order.institution || '', phone: order.phone || '',
        email: order.email || '', address: order.shipTo?.address || order.address || '', city: order.city || '', zip: order.zip || '',
        notes: order.notes || '', vatAmount: order.vatAmount, totalIncVat: order.totalIncVat,
        items: (order.items || []).map(it => ({ catalogNumber: it.catalogNumber || '', title: it.title || it.name || '', qty: Number(it.qty) || 1, unit: it.unit || 'יח׳', salePrice: Number(it.salePrice ?? it.price) || 0 })),
    }));
    const set = (k, v) => setD(p => ({ ...p, [k]: v }));
    const setItem = (i, k, v) => setD(p => ({ ...p, items: p.items.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
    const addItem = () => setD(p => ({ ...p, items: [...p.items, { catalogNumber: '', title: '', qty: 1, unit: 'יח׳', salePrice: 0 }] }));
    const removeItem = (i) => setD(p => ({ ...p, items: p.items.filter((_, j) => j !== i) }));

    // ── source-document loading (order_documents chunks → blob → pages) ──
    const [pdfPages, setPdfPages] = useState([]);
    const [blobUrl, setBlobUrl] = useState('');
    const [docState, setDocState] = useState(order.documentId ? 'loading' : 'none');  // loading | image | pdf | text | error | none
    const urlRef = useRef('');
    const isImage = (order.documentType || '').startsWith('image/');

    useEffect(() => {
        let dead = false;
        if (!order.documentId) { setDocState('none'); return; }
        setDocState('loading');
        (async () => {
            try {
                // Reassemble the file bytes DIRECTLY from the Firestore chunks. We must NOT
                // fetch() a blob: URL — the site CSP blocks blob: in connect-src/frame-src,
                // which is what silently broke the previous approach. Passing the raw Blob
                // straight to renderPdfPages mirrors how the OCR screen renders an uploaded
                // File (canvas → data-URL page images, which CSP never blocks).
                const snap = await getDocs(query(collection(db, 'order_documents', order.documentId, 'chunks'), orderBy('i')));
                const b64 = snap.docs.map(x => x.data().b64 || '').join('');
                if (!b64) { if (!dead) setDocState('error'); return; }
                const bin = atob(b64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                const mime = order.documentType || 'application/pdf';
                const blob = new Blob([bytes], { type: mime });
                const url = URL.createObjectURL(blob);
                if (dead) { URL.revokeObjectURL(url); return; }
                urlRef.current = url; setBlobUrl(url);
                if (mime.startsWith('image/')) { setDocState('image'); return; }
                const pages = await renderPdfPages(blob, { maxPages: 10 });
                if (dead) return;
                if (pages.length) { setPdfPages(pages); setDocState('pdf'); }
                else setDocState('pdfraw');   // last resort — an "open in new tab" link still works
            } catch { if (!dead) setDocState('error'); }
        })();
        return () => { dead = true; if (urlRef.current) URL.revokeObjectURL(urlRef.current); };
    }, [order.documentId]); // eslint-disable-line

    const subtotal = useMemo(() => computeSubtotal(d.items), [d.items]);
    const [saving, setSaving] = useState(false);

    const mappedFields = () => ({
        orderNumber: d.orderNumber, deliveryDate: d.deliveryDate, poDate: d.poDate, budgetCode: d.budgetCode, paymentTerms: d.paymentTerms,
        contactName: d.contactName, institution: d.institution, phone: d.phone, email: d.email,
        address: d.address, city: d.city, zip: d.zip, notes: d.notes,
        items: d.items, subtotal, vatAmount: d.vatAmount, totalIncVat: d.totalIncVat,
    });
    const doSave = async () => { setSaving(true); try { await onSave(order.id, mappedFields()); } finally { setSaving(false); } };
    const doApprove = async () => { setSaving(true); try { await onSave(order.id, mappedFields()); await onApprove(order); onClose(); } finally { setSaving(false); } };

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="rtl"
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(20,28,44,0.55)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', fontFamily: HE }}>
            {/* top bar */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 22px', background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 900, color: '#007AFF', letterSpacing: '0.1em', background: 'rgba(0,122,255,0.1)', padding: '3px 9px', borderRadius: 99 }}>בדיקת הזמנה נכנסת</span>
                        {order.source === 'email' && <span style={{ fontSize: 10, fontWeight: 800, color: '#8A94A6' }}>📧 {order.emailFrom || ''}</span>}
                    </div>
                    <h2 style={{ margin: '5px 0 0', fontSize: 17, fontWeight: 900, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.institution || order.contactName || order.emailSubject || 'הזמנה חדשה'}</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={doSave} disabled={saving}
                        style={{ height: 40, padding: '0 18px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#1D1D1F', cursor: saving ? 'default' : 'pointer', fontFamily: HE, fontWeight: 800, fontSize: 13 }}>
                        💾 שמור שינויים
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={doApprove} disabled={saving}
                        style={{ height: 40, padding: '0 22px', borderRadius: 12, border: 'none', background: saving ? '#AEAEB2' : 'linear-gradient(135deg,#34C759,#30D158)', color: '#fff', cursor: saving ? 'default' : 'pointer', fontFamily: HE, fontWeight: 900, fontSize: 13.5, boxShadow: '0 8px 22px rgba(52,199,89,0.34)' }}>
                        {saving ? 'שומר…' : '✓ אשר הזמנה'}
                    </motion.button>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} color="#6E6E73" strokeWidth={2.4} />
                    </button>
                </div>
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                <div className="ocr-splitview">
                    {/* LEFT — source document */}
                    <div style={{ position: 'sticky', top: 8, alignSelf: 'start' }}>
                        <div style={{ borderRadius: 24, padding: 14, background: 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(244,247,252,0.92))', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 20px 60px rgba(20,40,80,0.14), inset 0 1.5px 0 rgba(255,255,255,1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '2px 4px' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,122,255,0.32)', flexShrink: 0 }}>
                                    <FileText size={17} color="#fff" strokeWidth={2.3} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                    <p style={{ fontSize: 9.5, fontWeight: 900, color: '#007AFF', letterSpacing: '0.1em', margin: 0 }}>מסמך המקור</p>
                                    <p style={{ fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }} title={order.documentName || order.attachmentName}>{order.documentName || order.attachmentName || (order.source === 'email' ? 'גוף המייל' : 'ללא מסמך')}</p>
                                </div>
                                {blobUrl && <a href={blobUrl} target="_blank" rel="noreferrer" title="פתח מקור בכרטיסייה חדשה" style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}><ExternalLink size={14} color="#007AFF" strokeWidth={2.4} /></a>}
                                {docState === 'pdf' && pdfPages.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: '#8A94A6', background: 'rgba(0,0,0,0.05)', padding: '3px 9px', borderRadius: 99, flexShrink: 0 }}>{pdfPages.length} עמ׳</span>}
                            </div>
                            <div style={{ borderRadius: 16, overflow: 'hidden', overflowY: 'auto', background: '#EEF1F6', maxHeight: 'calc(100vh - 190px)', minHeight: 420, boxShadow: 'inset 0 2px 8px rgba(20,40,80,0.08)' }}>
                                {docState === 'loading' && (
                                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[0, 1].map(i => (
                                            <motion.div key={i} animate={{ opacity: [0.5, 0.85, 0.5] }} transition={{ repeat: Infinity, duration: 1.3, delay: i * 0.2 }}
                                                style={{ width: '100%', aspectRatio: '1 / 1.414', borderRadius: 10, background: 'linear-gradient(110deg,#E3E8F0,#F0F3F8,#E3E8F0)' }} />
                                        ))}
                                    </div>
                                )}
                                {docState === 'image' && blobUrl && <img src={blobUrl} alt="doc" style={{ width: '100%', display: 'block' }} />}
                                {docState === 'pdf' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
                                        {pdfPages.map((src, i) => (
                                            <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 20px rgba(20,40,80,0.16)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <img src={src} alt={`עמוד ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                                                {pdfPages.length > 1 && <span style={{ position: 'absolute', bottom: 6, insetInlineEnd: 6, fontSize: 9.5, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 99 }}>{i + 1} / {pdfPages.length}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {docState === 'pdfraw' && blobUrl && (
                                    <div style={{ padding: 48, textAlign: 'center', background: '#fff', minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                        <FileText size={34} color="#C7CDD8" strokeWidth={1.8} />
                                        <p style={{ color: '#86868B', fontSize: 12.5, fontWeight: 700, margin: 0 }}>לא ניתן להציג את ה‑PDF כאן בתוך המסך</p>
                                        <a href={blobUrl} target="_blank" rel="noreferrer"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                                            <ExternalLink size={15} strokeWidth={2.4} /> פתח את המסמך בכרטיסייה חדשה
                                        </a>
                                    </div>
                                )}
                                {docState === 'none' && (
                                    <div style={{ background: '#fff', minHeight: 420 }}>
                                        {order.documentStoreFailed && (
                                            <div style={{ margin: 16, padding: '11px 13px', borderRadius: 12, background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.25)' }}>
                                                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: '#B25E00' }}>הגיע קובץ מצורף ({order.attachmentName || 'מסמך'}) אך לא ניתן היה לשמור אותו (גדול מדי או שגיאת שמירה) — הנתונים חולצו, אך המסמך המקורי אינו זמין לתצוגה.</p>
                                            </div>
                                        )}
                                        <pre dir="rtl" style={{ margin: 0, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11.5, lineHeight: 1.75, color: '#3A3A3C', fontFamily: HE }}>{order.rawEmail || order.emailSubject || 'אין תצוגה מקדימה — הנתונים חולצו מגוף המייל.'}</pre>
                                    </div>
                                )}
                                {docState === 'error' && (
                                    <div style={{ padding: 48, textAlign: 'center' }}>
                                        <FileText size={32} color="#C7CDD8" style={{ margin: '0 auto 10px' }} />
                                        <p style={{ color: '#AEAEB2', fontSize: 12, fontWeight: 700, margin: '0 0 12px' }}>לא ניתן להציג את המסמך כאן</p>
                                        {blobUrl && <a href={blobUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 800, color: '#007AFF', textDecoration: 'none' }}>פתח את המסמך בכרטיסייה חדשה ↗</a>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT — extracted fields (editable) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead emoji="📋" title="פרטי הזמנת רכש" color="#86868B" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                                <Field label="מספר הזמנה" value={d.orderNumber} onChange={v => set('orderNumber', v)} />
                                <Field label="סעיף תקציבי" value={d.budgetCode} onChange={v => set('budgetCode', v)} />
                                <ComboField label="תנאי תשלום" value={d.paymentTerms} onChange={v => set('paymentTerms', v)} options={['שוטף+30', 'שוטף+60', 'שוטף+90', 'מזומן', 'העברה בנקאית', 'אשראי'].map(o => ({ label: o }))} placeholder="בחר/י או הקלד/י" />
                                <Field label="תאריך הזמנה" value={d.poDate} onChange={v => set('poDate', v)} />
                                <Field label="תאריך אספקה" value={d.deliveryDate} onChange={v => set('deliveryDate', v)} />
                                <Field label="מטבע" value={'ILS'} onChange={() => {}} placeholder="ILS" />
                            </div>
                        </div>

                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead emoji="👤" title="פרטי לקוח / מוסד" color="#007AFF" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                                <Field label="שם איש קשר" value={d.contactName} onChange={v => set('contactName', v)} />
                                <ComboField label="מוסד / חברה" value={d.institution} onChange={v => set('institution', v)} options={instOptions} placeholder="בחר/י או הקלד/י" />
                                <Field label="טלפון" value={d.phone} onChange={v => set('phone', v)} />
                                <Field label="מייל" value={d.email} onChange={v => set('email', v)} type="email" />
                                <Field label="כתובת" value={d.address} onChange={v => set('address', v)} span={2} />
                                <ComboField label="עיר" value={d.city} onChange={v => set('city', v)} options={cityOptions} placeholder="בחר/י עיר או הקלד/י" />
                                <Field label="מיקוד" value={d.zip} onChange={v => set('zip', v)} />
                            </div>
                        </div>

                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead emoji="📦" title={`פריטים (${d.items.length})`} color="#5856D6"
                                extra={<motion.button whileTap={{ scale: 0.95 }} onClick={addItem} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: HE }}>+ הוסף שורה</motion.button>} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {d.items.map((item, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 52px 58px 84px 30px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <input value={item.catalogNumber} onChange={e => setItem(i, 'catalogNumber', e.target.value)} placeholder='מק"ט' dir="rtl" style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 11, fontWeight: 700, color: '#6E6E73', fontFamily: HE, outline: 'none', textAlign: 'center' }} />
                                        <Combobox value={item.title} options={productOptions} placeholder="בחר/י מהמלאי או הקלד/י"
                                            onChange={v => setItem(i, 'title', v)}
                                            onPick={o => { setItem(i, 'title', o.label); if (o.price) setItem(i, 'salePrice', o.price); if (o.sub) setItem(i, 'catalogNumber', o.sub); }} />
                                        <input type="number" value={item.qty} min="1" onChange={e => setItem(i, 'qty', Number(e.target.value))} style={{ padding: '7px 6px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#1D1D1F', fontFamily: HE, outline: 'none', textAlign: 'center' }} />
                                        <input value={item.unit} onChange={e => setItem(i, 'unit', e.target.value)} placeholder="יח׳" dir="rtl" style={{ padding: '7px 6px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 11, fontWeight: 700, color: '#6E6E73', fontFamily: HE, outline: 'none', textAlign: 'center' }} />
                                        <input type="number" value={item.salePrice} onChange={e => setItem(i, 'salePrice', Number(e.target.value))} placeholder="מחיר ₪" style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#007AFF', fontFamily: HE, outline: 'none', textAlign: 'center' }} />
                                        <button onClick={() => removeItem(i)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900 }}>×</button>
                                    </div>
                                ))}
                                {d.items.length === 0 && <p style={{ textAlign: 'center', color: '#AEAEB2', fontSize: 12, fontWeight: 700, padding: '18px 0', margin: 0 }}>לא זוהו פריטים — הוסף/י ידנית מהמסמך משמאל</p>}
                            </div>
                            <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 900, color: '#007AFF' }}>₪{Number(d.totalIncVat ?? subtotal).toLocaleString()}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF' }}>סה"כ {d.totalIncVat != null ? 'כולל מע"מ' : 'להזמנה'}</span>
                            </div>
                        </div>

                        <div style={{ ...glass, borderRadius: 20, padding: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', margin: '0 0 8px' }}>📝 הערות</p>
                            <textarea value={d.notes} onChange={e => set('notes', e.target.value)} dir="rtl" rows={2} placeholder="הערות מיוחדות, הנחיות אספקה…"
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 12, fontFamily: HE, outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#1D1D1F' }} />
                        </div>

                        <motion.button whileTap={{ scale: 0.98 }} onClick={doApprove} disabled={saving}
                            style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: saving ? '#AEAEB2' : 'linear-gradient(135deg,#34C759,#30D158)', color: '#fff', fontSize: 15.5, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: HE, boxShadow: saving ? 'none' : '0 8px 26px rgba(52,199,89,0.36)' }}>
                            {saving ? 'שומר…' : '✓ אשר את ההזמנה — העבר לפייפליין'}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>,
        document.body
    );
}
