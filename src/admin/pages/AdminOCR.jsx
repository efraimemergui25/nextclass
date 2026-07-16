/* eslint-disable */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ExternalLink, ZoomIn, ZoomOut, Maximize2, X, ChevronLeft, ChevronRight, RotateCw, AlertTriangle, ClipboardList, User, Package, Archive, Truck } from 'lucide-react';
import Combobox from '../components/Combobox';
import { cityOptions } from '../lib/israelCities';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { fileToDataUrl, uploadFileToFirestore, extractPdf, renderPdfPages } from '../utils/fileStore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';

// Vault system folders (mirror of AdminVault) — used by the embed "save original" target
const VAULT_FOLDERS = [
    { id: 'quotes', name: 'הצעות מחיר' },
    { id: 'agreements', name: 'הסכמי לקוחות' },
    { id: 'receipts', name: 'חשבוניות וקבלות' },
    { id: 'suppliers', name: 'הצעות ספקים' },
    { id: 'product_docs', name: 'מסמכי מוצרים' },
];

const glass = {
    background: 'rgba(255,255,255,0.88)',
    border: '1.5px solid rgba(255,255,255,0.95)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1.5px 0 rgba(255,255,255,1)',
};

// Accepted formats ----------------------------------------------------------
const ACCEPT = 'image/*,.pdf,.csv,.docx,.xlsx,.xls,.heic,.heif,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function detectKind(file) {
    const name = (file.name || '').toLowerCase();
    const type = file.type || '';
    if (type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/.test(name)) return 'image';
    if (/\.(heic|heif)$/.test(name) || type === 'image/heic' || type === 'image/heif') return 'heic';
    if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (type === 'text/csv' || name.endsWith('.csv')) return 'csv';
    if (name.endsWith('.docx') || type.includes('wordprocessingml')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || type.includes('spreadsheetml') || type === 'application/vnd.ms-excel') return 'xlsx';
    return null;
}

const NUM_OR_NULL = v => (v === '' || v == null ? null : Number(v));

function Field({ label, value, onChange, type = 'text', placeholder, span }) {
    return (
        <div style={{ textAlign: 'right', gridColumn: span ? `span ${span}` : undefined }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</label>
            <input
                type={type}
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                dir="rtl"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 13, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,122,255,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.09)'}
            />
        </div>
    );
}

// Label + Combobox (searchable dropdown with free-text) — same look as Field.
function ComboField({ label, value, onChange, onPick, options, placeholder, span }) {
    return (
        <div style={{ textAlign: 'right', gridColumn: span ? `span ${span}` : undefined }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</label>
            <Combobox value={value} onChange={onChange} onPick={onPick} options={options} placeholder={placeholder}
                inputStyle={{ padding: '9px 32px 9px 12px', fontSize: 13, background: '#F5F5F7' }} />
        </div>
    );
}

// Premium section header — colored icon chip + title + hairline rule
function SectionHead({ Icon, title, color = '#007AFF', extra }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px', paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${color}2b, ${color}12)`, border: `1px solid ${color}26`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${color}22` }}>{Icon && <Icon size={16} color={color} strokeWidth={2.3} />}</div>
            <p style={{ fontSize: 13.5, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.01em', margin: 0, flex: 1 }}>{title}</p>
            {extra}
        </div>
    );
}

// Grouped embed-target row: a glassy toggle card for one destination
function EmbedTarget({ Icon, color, title, subtitle, active, onToggle, disabled, children }) {
    return (
        <div
            onClick={disabled ? undefined : onToggle}
            style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 16,
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                background: active ? `linear-gradient(120deg, ${color}14, ${color}06)` : 'rgba(0,0,0,0.02)',
                border: `1.5px solid ${active ? `${color}55` : 'rgba(0,0,0,0.07)'}`,
                transition: 'all 0.18s', boxShadow: active ? `0 4px 16px ${color}18` : 'none',
            }}
        >
            {/* checkbox */}
            <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? color : 'transparent', border: `2px solid ${active ? color : 'rgba(0,0,0,0.18)'}`, transition: 'all 0.18s' }}>
                {active && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(140deg, ${color}2b, ${color}12)`, border: `1px solid ${color}26`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${color}22` }}>{Icon && <Icon size={17} color={color} strokeWidth={2.3} />}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <p style={{ fontSize: 13.5, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>{title}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#86868B', margin: '1px 0 0' }}>{subtitle}</p>
            </div>
            {children && <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>{children}</div>}
        </div>
    );
}

export default function AdminOCR({ embedded = false }) {
    const navigate = useNavigate();
    const { showToast } = useAdminToast();
    const { createQuote, upsertContact, createSupplierOrder, linkSupplierOrder } = useAdminData();
    const fileRef = useRef(null);

    const [step, setStep] = useState('upload'); // upload | ready | scanning | review | saved
    const [fileObject, setFileObject] = useState(null);
    const [fileName, setFileName] = useState('');
    const [fileKind, setFileKind] = useState(null);      // image | heic | pdf | csv | docx | xlsx
    const [mimeType, setMimeType] = useState('image/jpeg');
    const [filePreview, setFilePreview] = useState(null); // dataURL (image/pdf)
    const [previewUrl, setPreviewUrl] = useState(null);   // blob object-URL (reliable PDF/image render)
    const [pdfPages, setPdfPages] = useState([]);         // canvas-rendered PDF page images (bulletproof preview)
    const [pdfRendering, setPdfRendering] = useState(false);
    const previewUrlRef = useRef(null);
    const [fileBase64, setFileBase64] = useState(null);   // base64 for inline (image/pdf)
    const [fileText, setFileText] = useState(null);       // extracted text (csv/docx/xlsx)
    const [extracting, setExtracting] = useState(false);

    const [ocrData, setOcrData] = useState(null);
    const [rawText, setRawText] = useState('');
    const [warnings, setWarnings] = useState([]);
    const [intakeId, setIntakeId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // ── Embed targets (grouped mapping) — where the extracted data lands ──────
    const [targets, setTargets] = useState({ customer: true, order: true, vault: true, supplier: false });
    const [vaultFolder, setVaultFolder] = useState('quotes');
    const toggleTarget = (k) => setTargets(t => ({ ...t, [k]: !t[k] }));

    // Lightbox (fullscreen document viewer with zoom / pan / rotate) ----------
    const [lightbox, setLightbox] = useState(null); // { i: number } | null
    const [zoom, setZoom] = useState(1);
    const [rotate, setRotate] = useState(0);
    const openLightbox = (i = 0) => { setZoom(1); setRotate(0); setLightbox({ i }); };
    const lbGo = (delta, len) => setLightbox(lb => lb ? { i: (lb.i + delta + len) % len } : lb);

    const makePreviewUrl = (file) => {
        if (previewUrlRef.current) { try { URL.revokeObjectURL(previewUrlRef.current); } catch { /* noop */ } }
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setPreviewUrl(url);
    };

    const reset = () => {
        if (previewUrlRef.current) { try { URL.revokeObjectURL(previewUrlRef.current); } catch { /* noop */ } previewUrlRef.current = null; }
        setStep('upload'); setFileObject(null); setFileName(''); setFileKind(null);
        setFilePreview(null); setPreviewUrl(null); setPdfPages([]); setPdfRendering(false); setFileBase64(null); setFileText(null); setExtracting(false);
        setOcrData(null); setRawText(''); setWarnings([]); setIntakeId(null);
    };

    // ── File handling ──────────────────────────────────────────────────────
    const extractDocText = useCallback(async (file, kind) => {
        setExtracting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            let text = '';
            if (kind === 'docx') {
                // Guarded dynamic import — mammoth is installed centrally by the orchestrator.
                const m = await import('mammoth/mammoth.browser.js').catch(() => import('mammoth'));
                const mod = m.default || m;
                const result = await mod.extractRawText({ arrayBuffer });
                text = (result && result.value) || '';
            } else { // xlsx
                const x = await import('xlsx');
                const XLSX = x.default || x;
                const wb = XLSX.read(arrayBuffer, { type: 'array' });
                text = wb.SheetNames.map(n => `# גיליון: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join('\n\n');
            }
            if (!text.trim()) throw new Error('empty extraction');
            setFileText(text);
            setStep('ready');
        } catch (err) {
            console.error('[OCR] doc extraction failed:', err);
            showToast('לא ניתן לקרוא קובץ זה בדפדפן. המר ל-PDF ונסה שוב 🔄', 'error');
            reset();
        } finally {
            setExtracting(false);
        }
    }, [showToast]);

    const handleFile = useCallback((file) => {
        if (!file) return;
        const kind = detectKind(file);
        if (!kind) {
            showToast('סוג קובץ לא נתמך — השתמש ב-PDF, תמונה, CSV, DOCX או XLSX', 'error');
            return;
        }
        // reset previous extraction
        setFileObject(file);
        setFileName(file.name || 'order');
        setFileKind(kind);
        setMimeType(file.type || (kind === 'pdf' ? 'application/pdf' : 'application/octet-stream'));
        setFilePreview(null); setFileBase64(null); setFileText(null); setOcrData(null);
        setRawText(''); setWarnings([]);

        if (kind === 'image' || kind === 'pdf') makePreviewUrl(file);

        if (kind === 'image' || kind === 'heic') {
            const reader = new FileReader();
            reader.onload = e => {
                const dataUrl = e.target.result;
                setFilePreview(dataUrl);
                setFileBase64(String(dataUrl).split(',')[1]);
                setStep('ready');
            };
            reader.readAsDataURL(file);
        } else if (kind === 'pdf') {
            // Keep base64 (preview + native-vision path) AND extract text via pdf.js
            // so the scan works through ANY provider (Gemini vision OR Groq text).
            const reader = new FileReader();
            reader.onload = async e => {
                const dataUrl = e.target.result;
                setFilePreview(dataUrl);
                setFileBase64(String(dataUrl).split(',')[1]);
                try { const r = await extractPdf(file, { maxPages: 12 }); if (r.text && r.text.trim()) setFileText(r.text); } catch {}
                setStep('ready');
            };
            reader.readAsDataURL(file);
            // Canvas-render pages for a bulletproof, always-visible preview (no iframe).
            setPdfRendering(true);
            renderPdfPages(file, { maxPages: 10 }).then(pages => setPdfPages(pages)).finally(() => setPdfRendering(false));
        } else if (kind === 'csv') {
            // Plain-JS text read — no library needed.
            const reader = new FileReader();
            reader.onload = e => { setFileText(String(e.target.result || '')); setStep('ready'); };
            reader.readAsText(file);
        } else { // docx / xlsx
            extractDocText(file, kind);
        }
    }, [showToast, extractDocText]);

    // ── Run OCR through Gemini ─────────────────────────────────────────────
    const runOCR = async () => {
        if (!fileBase64 && !fileText) return;
        setStep('scanning');
        try {
            const body = { fileName };
            if (fileText != null) body.text = fileText;
            if (fileBase64) { body.fileBase64 = fileBase64; body.mimeType = mimeType; }
            const res = await fetch('/api/ocr-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!json.success) {
                setRawText(json.rawText || '');
                setWarnings(json.warnings || []);
                throw new Error(json.error || 'OCR failed');
            }
            const data = json.data;
            setOcrData(data);
            setRawText(json.rawText || '');
            setWarnings(json.warnings || []);
            setStep('review');

            // Auto-persist the scan immediately so nothing is ever dropped.
            // Low-confidence scans land as 'לבדיקה ידנית'; the rest as 'pending'
            // (awaiting the owner's explicit approval). File upload is deferred
            // to the approve / manual-save action.
            try {
                const now = Date.now();
                const id = `OCR-${now}`;
                setIntakeId(id);
                const subtotal = computeSubtotal(data.items);
                const status = (data.confidence == null || data.confidence < 60) ? 'לבדיקה ידנית' : 'pending';
                await setDoc(doc(db, 'ocr_intakes', id), {
                    id,
                    status,
                    kind: 'purchase_order',
                    fileUrl: null,
                    filePath: null,
                    fileName,
                    rawText: json.rawText || '',
                    warnings: json.warnings || [],
                    ...buildFields(data, subtotal),
                    createdAt: serverTimestamp(),
                    createdTs: now,
                });
            } catch (persistErr) {
                console.error('[OCR] intake auto-persist failed:', persistErr);
            }
        } catch (err) {
            showToast(`שגיאה בסריקה: ${err.message}`, 'error');
            setStep('ready');
        }
    };

    // ── Item helpers ───────────────────────────────────────────────────────
    const updateItem = (idx, key, val) => {
        setOcrData(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }));
    };
    const removeItem = (idx) => setOcrData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    const addItem = () => setOcrData(prev => ({ ...prev, items: [...(prev.items || []), { catalogNumber: '', title: '', qty: 1, unit: 'יח׳', salePrice: 0 }] }));

    const computeSubtotal = (items) => (items || []).reduce((s, it) => s + (Number(it.salePrice) || 0) * (Number(it.qty) || 1), 0);

    // ── Retain the original file (billing-free, no Cloud Storage bucket) ────
    // Small originals are inlined as a data URL so the "view original" link in
    // orders keeps working; larger ones are kept (chunked) in the document vault.
    const uploadOriginal = async () => {
        if (!fileObject) return { url: null, path: null };
        try {
            if (fileObject.size <= 900000) {
                const url = await fileToDataUrl(fileObject);
                return { url, path: null };
            }
            await uploadFileToFirestore(db, 'vault_documents', fileObject, {
                name: fileName || 'הזמנת רכש (OCR)',
                type: fileObject.type || 'application/octet-stream',
                size: fileObject.size,
                folder: 'quotes',
                classification: 'approved',
                tags: ['OCR', 'הזמנת רכש'],
                source: 'ocr',
            });
            return { url: null, path: null };
        } catch {
            return { url: null, path: null };
        }
    };

    // Build the canonical extracted-field object (shared by intake + quote).
    const buildFields = (data, subtotal) => ({
        // contact
        contactName:  data.contactName || '',
        institution:  data.institution || '',
        phone:        data.phone || '',
        email:        data.email || '',
        address:      data.address || '',
        city:         data.city || '',
        zip:          data.zip || '',
        // purchase-order (Amal) fields
        orderNumber:  data.orderNumber || null,
        poDate:       data.poDate || null,
        deliveryDate: data.deliveryDate || null,
        budgetCode:   data.budgetCode || null,
        supplierRef:  data.supplierRef || null,
        companyId:    data.companyId || null,
        paymentTerms: data.paymentTerms || null,
        authorizedBy: data.authorizedBy || null,
        currency:     data.currency || 'ILS',
        vatAmount:    NUM_OR_NULL(data.vatAmount),
        totalIncVat:  NUM_OR_NULL(data.totalIncVat),
        // lines + totals
        items:        (data.items || []).map(it => ({
            catalogNumber: it.catalogNumber || '',
            title:         it.title || '',
            qty:           Math.max(1, Number(it.qty) || 1),
            unit:          it.unit || 'יח׳',
            price:         Number(it.price) || Number(it.salePrice) || 0,
            salePrice:     Number(it.salePrice) || Number(it.price) || 0,
        })),
        subtotal,
        notes:        data.notes || '',
        confidence:   data.confidence ?? null,
    });

    // ── APPROVE: write intake (approved) + promote to quotes ───────────────
    const approveAndCreateOrder = async () => {
        if (!ocrData) return;
        setSaving(true);
        try {
            const { url: fileUrl, path: filePath } = await uploadOriginal();
            const now = Date.now();
            const id = intakeId || `OCR-${now}`;
            const subtotal = computeSubtotal(ocrData.items);
            const fields = buildFields(ocrData, subtotal);

            // 1) update the canonical intake record → approved (merge over the
            //    'pending' record written at scan time)
            await setDoc(doc(db, 'ocr_intakes', id), {
                id,
                status: 'approved',
                kind: 'purchase_order',
                fileUrl, filePath, fileName,
                rawText: rawText || '',
                warnings: warnings || [],
                ...fields,
                approvedAt: serverTimestamp(),
            }, { merge: true });

            // 2) promote into the orders/quotes pipeline (additive PO fields)
            await setDoc(doc(db, 'quotes', id), {
                id,
                contactName:  fields.contactName,
                institution:  fields.institution,
                phone:        fields.phone,
                email:        fields.email,
                address:      fields.address,
                city:         fields.city,
                zip:          fields.zip,
                items:        fields.items,
                subtotal,
                notes:        fields.notes,
                status:       'חדש',
                source:       'ocr',
                ocrConfidence: fields.confidence,
                ocrIntakeId:  id,
                fileUrl,
                // ── additive purchase-order fields ──
                orderNumber:  fields.orderNumber,
                poDate:       fields.poDate,
                deliveryDate: fields.deliveryDate,
                budgetCode:   fields.budgetCode,
                supplierRef:  fields.supplierRef,
                companyId:    fields.companyId,
                paymentTerms: fields.paymentTerms,
                authorizedBy: fields.authorizedBy,
                currency:     fields.currency,
                vatAmount:    fields.vatAmount,
                totalIncVat:  fields.totalIncVat,
                dateTs:       now,
                date:         new Date().toLocaleDateString('he-IL'),
            });

            setStep('saved');
            showToast('ההזמנה אושרה ונוצרה הצעת מחיר ✓', 'success');
            setTimeout(() => navigate('/admin/orders'), 1800);
        } catch (err) {
            console.error('[OCR] approve failed:', err);
            showToast(`שגיאה בשמירה: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Keep low-confidence / unclear scans for manual entry (never dropped) ─
    const saveForManualReview = async () => {
        if (!ocrData) return;
        setSaving(true);
        try {
            const { url: fileUrl, path: filePath } = await uploadOriginal();
            const now = Date.now();
            const id = intakeId || `OCR-${now}`;
            const subtotal = computeSubtotal(ocrData.items);
            const fields = buildFields(ocrData, subtotal);
            await setDoc(doc(db, 'ocr_intakes', id), {
                id,
                status: 'לבדיקה ידנית',
                kind: 'purchase_order',
                fileUrl, filePath, fileName,
                rawText: rawText || '',
                warnings: warnings || [],
                ...fields,
                updatedAt: serverTimestamp(),
            }, { merge: true });
            setStep('saved');
            showToast('נשמר לבדיקה ידנית — זמין בארכיון הסריקות', 'success');
            setTimeout(() => reset(), 1800);
        } catch (err) {
            console.error('[OCR] manual save failed:', err);
            showToast(`שגיאה בשמירה: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── EMBED: route the extracted data to the selected destinations at once ──
    const embedSelected = async () => {
        if (!ocrData) return;
        if (!targets.customer && !targets.order && !targets.vault && !targets.supplier) {
            showToast('בחר לפחות יעד אחד להטמעה', 'error');
            return;
        }
        setSaving(true);
        try {
            const now = Date.now();
            const id = intakeId || `OCR-${now}`;
            const subtotal = computeSubtotal(ocrData.items);
            const fields = buildFields(ocrData, subtotal);
            const done = [];

            // 1) Order → quotes pipeline (createQuote auto-links the buyer as customer/contact)
            if (targets.order) {
                await createQuote({
                    id,
                    contactName: fields.contactName, institution: fields.institution,
                    phone: fields.phone, email: fields.email, address: fields.address, city: fields.city, zip: fields.zip,
                    items: fields.items, subtotal,
                    vatAmount: fields.vatAmount, totalIncVat: fields.totalIncVat, notes: fields.notes,
                    orderNumber: fields.orderNumber, poDate: fields.poDate, deliveryDate: fields.deliveryDate,
                    budgetCode: fields.budgetCode, paymentTerms: fields.paymentTerms, authorizedBy: fields.authorizedBy,
                    companyId: fields.companyId, supplierRef: fields.supplierRef, currency: fields.currency,
                    status: 'חדש', source: 'ocr',
                    extra: { ocrConfidence: fields.confidence, ocrIntakeId: id },
                });
                done.push('הזמנה');
                if (targets.customer) done.push('לקוח');
            } else if (targets.customer) {
                // Customer only (no order)
                await upsertContact({ name: fields.contactName, institution: fields.institution, phone: fields.phone, email: fields.email, address: fields.address, city: fields.city, source: 'ocr' });
                done.push('לקוח');
            }

            // 2) Supplier order (optional)
            if (targets.supplier) {
                const poId = await createSupplierOrder({
                    customerName: fields.contactName || fields.institution,
                    supplierName: '', productTitle: fields.items[0]?.title || '',
                    qty: fields.items.reduce((s, it) => s + (Number(it.qty) || 1), 0),
                    totalCost: fields.totalIncVat || subtotal, notes: fields.notes, eta: fields.deliveryDate || '',
                    customerOrderId: targets.order ? id : null,
                });
                // two-way link the PO to its order (only when an order was also created)
                if (poId && targets.order) await linkSupplierOrder(id, poId);
                done.push('הזמנת ספק');
            }

            // 3) Original document → vault (chosen folder)
            if (targets.vault && fileObject) {
                try {
                    await uploadFileToFirestore(db, 'vault_documents', fileObject, {
                        name: fileName || 'הזמנת רכש (OCR)',
                        type: fileObject.type || 'application/octet-stream',
                        size: fileObject.size,
                        folder: vaultFolder,
                        classification: 'approved',
                        tags: ['OCR', 'הזמנת רכש', fields.orderNumber].filter(Boolean),
                        source: 'ocr',
                        contentText: fileText || rawText || '',
                    });
                    done.push('כספת');
                } catch (vErr) { console.error('[OCR] vault save failed:', vErr); }
            }

            // 4) Always persist the canonical intake as approved (audit trail)
            await setDoc(doc(db, 'ocr_intakes', id), {
                id, status: 'approved', kind: 'purchase_order',
                fileName, rawText: rawText || '', warnings: warnings || [],
                ...fields, embeddedTo: done, approvedAt: serverTimestamp(),
            }, { merge: true });

            setStep('saved');
            showToast(`הוטמע אוטומטית: ${done.join(' · ') || 'ארכיון בלבד'} ✓`, 'success');
            const dest = targets.order ? '/admin/orders' : targets.vault ? '/admin/vault' : targets.customer ? '/admin/customers' : null;
            if (dest) setTimeout(() => navigate(dest), 1900);
        } catch (err) {
            console.error('[OCR] embed failed:', err);
            showToast(`שגיאה בהטמעה: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const conf = ocrData?.confidence;
    const lowConfidence = conf == null || conf < 60;
    const canPreviewImg = fileKind === 'image';

    // Field counts per destination (for the mapping card summary)
    const custCount = ocrData ? [ocrData.contactName, ocrData.institution, ocrData.phone, ocrData.email, ocrData.address, ocrData.city, ocrData.zip].filter(Boolean).length : 0;
    const orderCount = ocrData ? [ocrData.orderNumber, ocrData.poDate, ocrData.deliveryDate, ocrData.budgetCode, ocrData.supplierRef, ocrData.companyId, ocrData.paymentTerms, ocrData.authorizedBy, ocrData.vatAmount, ocrData.totalIncVat].filter(v => v != null && v !== '').length : 0;
    const itemCount = ocrData?.items?.length || 0;

    // Preview images available for the lightbox (single image, HEIC, or PDF pages)
    const previewImgs = (fileKind === 'image' || fileKind === 'heic')
        ? [previewUrl || filePreview].filter(Boolean)
        : fileKind === 'pdf' ? pdfPages : [];

    // Keyboard controls while the lightbox is open
    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setLightbox(null);
            else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(6, +(z + 0.25).toFixed(2)));
            else if (e.key === '-' || e.key === '_') setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)));
            else if (e.key === 'ArrowLeft') lbGo(1, previewImgs.length);
            else if (e.key === 'ArrowRight') lbGo(-1, previewImgs.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightbox, previewImgs.length]);

    return (
        <div dir="rtl" style={{
            maxWidth: step === 'review' ? 1440 : 760,
            margin: '0 auto',
            padding: embedded ? 0 : '0 0 60px',
            transition: 'max-width 0.3s ease',
        }}>

            {/* Header — hidden when embedded inside the Fulfillment tab (that page owns the chrome) */}
            {!embedded && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1)' }}><FileText size={22} color="#007AFF" strokeWidth={2.2} /></div>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>קליטת הזמנות — OCR AI</h1>
                            <p style={{ fontSize: 12, color: '#86868B', margin: '2px 0 0', fontWeight: 600 }}>העלה הזמנת רכש יחלץ ב-AI, ואתה מאשר ופותח הזמנה</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {/* Step: Upload / Ready */}
                {(step === 'upload' || step === 'ready') && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>

                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onClick={() => fileRef.current?.click()}
                            style={{
                                borderRadius: 22, border: `2px dashed ${dragOver ? '#007AFF' : 'rgba(0,122,255,0.25)'}`,
                                background: dragOver ? 'rgba(0,122,255,0.05)' : 'rgba(255,255,255,0.7)',
                                padding: (canPreviewImg && filePreview) ? 0 : '48px 24px',
                                cursor: 'pointer', textAlign: 'center', overflow: 'hidden',
                                transition: 'all 0.2s', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: 20,
                            }}
                        >
                            {extracting ? (
                                <div style={{ padding: '8px 0' }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(0,122,255,0.15)', borderTopColor: '#007AFF', margin: '0 auto 14px' }} />
                                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', margin: 0 }}>מחלץ טקסט מהמסמך...</p>
                                </div>
                            ) : (canPreviewImg && (previewUrl || filePreview)) ? (
                                <img src={previewUrl || filePreview} alt="preview" onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', borderRadius: 20 }} />
                            ) : (step === 'ready' && fileKind === 'pdf' && pdfPages.length > 0) ? (
                                <img src={pdfPages[0]} alt="preview" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', borderRadius: 18, boxShadow: '0 8px 24px rgba(20,40,80,0.14)' }} />
                            ) : (step === 'ready' && fileKind === 'pdf' && (previewUrl || filePreview)) ? (
                                <iframe src={previewUrl || filePreview} title="preview" style={{ width: '100%', height: 420, borderRadius: 18, border: 'none' }} />
                            ) : (step === 'ready' && fileObject) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                    <div style={{ fontSize: 46 }}>{fileKind === 'csv' ? '📑' : fileKind === 'xlsx' ? '📊' : fileKind === 'docx' ? '📝' : fileKind === 'heic' ? '🖼️' : '📄'}</div>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: 0, wordBreak: 'break-all' }}>{fileName}</p>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#007AFF', background: 'rgba(0,122,255,0.10)', padding: '4px 12px', borderRadius: 99 }}>
                                        {fileText != null ? `מוכן לסריקה · ${fileText.length.toLocaleString()} תווים חולצו` : 'מוכן לסריקה'}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: '0 0 6px' }}>גרור הזמנה לכאן</p>
                                    <p style={{ fontSize: 12, color: '#86868B', margin: 0 }}>או לחץ לבחירת קובץ · PDF · תמונה (JPG/PNG/WEBP/HEIC) · CSV · DOCX · XLSX</p>
                                </>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept={ACCEPT} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                        {step === 'ready' && (fileBase64 || fileText != null) && (
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                                <motion.button whileHover={{ y: -2, boxShadow: '0 14px 34px rgba(0,122,255,0.42)' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} onClick={runOCR}
                                    style={{ padding: '13px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 6px 20px rgba(0,122,255,0.35)' }}>
                                    ✨ סרוק עם AI
                                </motion.button>
                                <button onClick={reset}
                                    style={{ padding: '13px 22px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.04)', fontSize: 13, fontWeight: 700, color: '#86868B', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                    בטל
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Step: Scanning */}
                {step === 'scanning' && (
                    <motion.div key="scanning" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ ...glass, borderRadius: 24, padding: '60px 24px', textAlign: 'center' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ width: 52, height: 52, borderRadius: '50%', border: '4px solid rgba(0,122,255,0.15)', borderTopColor: '#007AFF', margin: '0 auto 20px' }} />
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', margin: '0 0 6px' }}>ה-AI קורא את ההזמנה</p>
                        <p style={{ fontSize: 12, color: '#86868B', margin: 0 }}>מחלץ מספר הזמנה, סעיף תקציבי, פריטים, מק"ט ומחירים...</p>
                    </motion.div>
                )}

                {/* Step: Review */}
                {step === 'review' && ocrData && (
                    <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                        {/* Confidence + warnings */}
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {conf != null && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99,
                                    background: conf >= 80 ? 'rgba(52,199,89,0.12)' : conf >= 60 ? 'rgba(255,149,0,0.12)' : 'rgba(255,59,48,0.12)',
                                    border: `1px solid ${conf >= 80 ? 'rgba(52,199,89,0.3)' : conf >= 60 ? 'rgba(255,149,0,0.3)' : 'rgba(255,59,48,0.3)'}`,
                                }}>
                                    <span style={{ fontSize: 12 }}>{conf >= 80 ? '✅' : conf >= 60 ? '⚠️' : '🛑'}</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: conf >= 80 ? '#34C759' : conf >= 60 ? '#FF9500' : '#FF3B30' }}>
                                        ביטחון הסריקה: {conf}%
                                    </span>
                                </div>
                            )}
                            <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>בדוק ותקן את הפרטים לפני אישור</span>
                        </div>

                        {warnings.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, padding: '13px 15px', borderRadius: 16, background: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(255,248,240,0.72))', backdropFilter: 'blur(22px) saturate(1.6)', WebkitBackdropFilter: 'blur(22px) saturate(1.6)', border: '1px solid rgba(255,149,0,0.28)', boxShadow: '0 10px 30px rgba(255,149,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(140deg, rgba(255,149,0,0.26), rgba(255,149,0,0.10))', border: '1px solid rgba(255,149,0,0.24)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(255,149,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <AlertTriangle size={17} color="#FF9500" strokeWidth={2.3} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 11, fontWeight: 900, color: '#B25E00', letterSpacing: '0.04em', margin: '3px 0 6px' }}>שים לב לפני אישור</p>
                                    {warnings.map((w, i) => (
                                        <p key={i} style={{ fontSize: 12, fontWeight: 600, color: '#5A6472', margin: i ? '4px 0 0' : 0 }}>• {w}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Side-by-side: source document ⟷ extracted fields ── */}
                        <div className="ocr-splitview">
            {/* LEFT — original document (sticky, premium viewer) */}
                            <div style={{ position: 'sticky', top: 8, alignSelf: 'start' }}>
                                <div style={{
                                    borderRadius: 24, padding: 14, overflow: 'hidden', position: 'relative',
                                    background: 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(244,247,252,0.92))',
                                    border: '1px solid rgba(255,255,255,0.9)',
                                    boxShadow: '0 20px 60px rgba(20,40,80,0.14), 0 2px 8px rgba(20,40,80,0.06), inset 0 1.5px 0 rgba(255,255,255,1)',
                                    backdropFilter: 'blur(30px) saturate(1.7)', WebkitBackdropFilter: 'blur(30px) saturate(1.7)',
                                }}>
                                    {/* header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '2px 4px' }}>
                                        <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(0,122,255,0.32)', flexShrink: 0 }}>
                                            <FileText size={17} color="#fff" strokeWidth={2.3} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                                            <p style={{ fontSize: 9.5, fontWeight: 900, color: '#007AFF', letterSpacing: '0.1em', margin: 0 }}>מסמך המקור</p>
                                            <p style={{ fontSize: 12.5, fontWeight: 800, color: '#1D1D1F', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }} title={fileName}>{fileName || 'ללא שם'}</p>
                                        </div>
                                        {previewImgs.length > 0 && (
                                            <button onClick={() => openLightbox(0)} title="הגדל תצוגה (מסך מלא)"
                                                style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
                                                <Maximize2 size={14} color="#007AFF" strokeWidth={2.4} />
                                            </button>
                                        )}
                                        {(previewUrl || filePreview) && (
                                            <a href={previewUrl || filePreview} target="_blank" rel="noreferrer" title="פתח מקור בכרטיסייה חדשה"
                                                style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,122,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}>
                                                <ExternalLink size={14} color="#007AFF" strokeWidth={2.4} />
                                            </a>
                                        )}
                                        {fileKind === 'pdf' && pdfPages.length > 0 && (
                                            <span style={{ fontSize: 10, fontWeight: 800, color: '#8A94A6', background: 'rgba(0,0,0,0.05)', padding: '3px 9px', borderRadius: 99, flexShrink: 0 }}>{pdfPages.length} עמ׳</span>
                                        )}
                                    </div>
                                    {/* body */}
                                    <div className="ocr-doc-body" style={{ borderRadius: 16, overflow: 'hidden', overflowY: 'auto', background: '#EEF1F6', maxHeight: 'calc(100vh - 190px)', minHeight: 420, boxShadow: 'inset 0 2px 8px rgba(20,40,80,0.08)' }}>
                                        {(fileKind === 'image' || fileKind === 'heic') && (previewUrl || filePreview) ? (
                                            <div className="ocr-zoomable" onClick={() => openLightbox(0)} style={{ position: 'relative', cursor: 'zoom-in' }}>
                                                <img src={previewUrl || filePreview} alt="doc" style={{ width: '100%', display: 'block' }} />
                                                <span className="ocr-zoom-hint"><ZoomIn size={13} strokeWidth={2.6} /> לחץ להגדלה</span>
                                            </div>
                                        ) : fileKind === 'pdf' && pdfPages.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
                                                {pdfPages.map((src, i) => (
                                                    <div key={i} className="ocr-zoomable" onClick={() => openLightbox(i)} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 20px rgba(20,40,80,0.16)', border: '1px solid rgba(0,0,0,0.05)', cursor: 'zoom-in' }}>
                                                        <img src={src} alt={`עמוד ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                                                        <span className="ocr-zoom-hint"><ZoomIn size={13} strokeWidth={2.6} /> לחץ להגדלה</span>
                                                        {pdfPages.length > 1 && (
                                                            <span style={{ position: 'absolute', bottom: 6, insetInlineEnd: 6, fontSize: 9.5, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 99, backdropFilter: 'blur(6px)' }}>{i + 1} / {pdfPages.length}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : fileKind === 'pdf' && pdfRendering ? (
                                            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {[0, 1].map(i => (
                                                    <motion.div key={i} animate={{ opacity: [0.5, 0.85, 0.5] }} transition={{ repeat: Infinity, duration: 1.3, delay: i * 0.2 }}
                                                        style={{ width: '100%', aspectRatio: '1 / 1.414', borderRadius: 10, background: 'linear-gradient(110deg,#E3E8F0,#F0F3F8,#E3E8F0)' }} />
                                                ))}
                                            </div>
                                        ) : (fileText || rawText) ? (
                                            <pre dir="rtl" style={{ margin: 0, padding: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11.5, lineHeight: 1.75, color: '#3A3A3C', fontFamily: 'Heebo,sans-serif', background: '#fff' }}>{fileText || rawText}</pre>
                                        ) : (fileKind === 'pdf' && (previewUrl || filePreview)) ? (
                                            <iframe src={previewUrl || filePreview} title="doc" style={{ width: '100%', height: 'calc(100vh - 250px)', minHeight: 420, border: 'none', display: 'block' }} />
                                        ) : (
                                            <div style={{ padding: 48, textAlign: 'center' }}>
                                                <FileText size={32} color="#C7CDD8" style={{ margin: '0 auto 10px' }} />
                                                <p style={{ color: '#AEAEB2', fontSize: 12, fontWeight: 700, margin: 0 }}>אין תצוגה מקדימה זמינה</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT — extracted fields (editable) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        {/* Purchase-order details */}
                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead Icon={ClipboardList} title="פרטי הזמנת רכש" color="#007AFF" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                                <Field label='מספר הזמנה' value={ocrData.orderNumber} onChange={v => setOcrData(p => ({ ...p, orderNumber: v }))} />
                                <Field label='סעיף תקציבי' value={ocrData.budgetCode} onChange={v => setOcrData(p => ({ ...p, budgetCode: v }))} />
                                <ComboField label='תנאי תשלום' value={ocrData.paymentTerms} onChange={v => setOcrData(p => ({ ...p, paymentTerms: v }))} options={['שוטף+30', 'שוטף+60', 'שוטף+90', 'מזומן', 'העברה בנקאית', 'אשראי'].map(o => ({ label: o }))} placeholder='בחר/י או הקלד/י' />
                                <Field label='תאריך הזמנה' value={ocrData.poDate} onChange={v => setOcrData(p => ({ ...p, poDate: v }))} />
                                <Field label='תאריך אספקה' value={ocrData.deliveryDate} onChange={v => setOcrData(p => ({ ...p, deliveryDate: v }))} />
                                <Field label='מאשר / מורשה חתימה' value={ocrData.authorizedBy} onChange={v => setOcrData(p => ({ ...p, authorizedBy: v }))} />
                                <Field label='מס׳ ספק' value={ocrData.supplierRef} onChange={v => setOcrData(p => ({ ...p, supplierRef: v }))} />
                                <Field label='ח.פ. / ע.מ.' value={ocrData.companyId} onChange={v => setOcrData(p => ({ ...p, companyId: v }))} />
                                <Field label='מטבע' value={ocrData.currency} onChange={v => setOcrData(p => ({ ...p, currency: v }))} placeholder='ILS' />
                            </div>
                        </div>

                        {/* Contact info */}
                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead Icon={User} title="פרטי לקוח / מוסד" color="#007AFF" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                                <Field label="שם איש קשר" value={ocrData.contactName} onChange={v => setOcrData(p => ({ ...p, contactName: v }))} />
                                <Field label="מוסד / חברה" value={ocrData.institution} onChange={v => setOcrData(p => ({ ...p, institution: v }))} />
                                <Field label="טלפון" value={ocrData.phone} onChange={v => setOcrData(p => ({ ...p, phone: v }))} />
                                <Field label="מייל" value={ocrData.email} onChange={v => setOcrData(p => ({ ...p, email: v }))} type="email" />
                                <Field label="כתובת" value={ocrData.address} onChange={v => setOcrData(p => ({ ...p, address: v }))} span={2} />
                                <ComboField label="עיר" value={ocrData.city} onChange={v => setOcrData(p => ({ ...p, city: v }))} options={cityOptions} placeholder="בחר/י עיר או הקלד/י" />
                                <Field label="מיקוד" value={ocrData.zip} onChange={v => setOcrData(p => ({ ...p, zip: v }))} />
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ ...glass, borderRadius: 20, padding: 22 }}>
                            <SectionHead Icon={Package} title={`פריטים (${ocrData.items?.length || 0})`} color="#5856D6"
                                extra={
                                    <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} onClick={addItem}
                                        style={{ padding: '6px 14px', borderRadius: 10, border: '1px solid rgba(0,122,255,0.2)', background: 'linear-gradient(135deg, rgba(0,122,255,0.14), rgba(0,122,255,0.06))', color: '#007AFF', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0,122,255,0.14)' }}>
                                        + הוסף שורה
                                    </motion.button>
                                } />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(ocrData.items || []).map((item, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 52px 58px 84px 30px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <input value={item.catalogNumber || ''} onChange={e => updateItem(idx, 'catalogNumber', e.target.value)} placeholder='מק"ט' dir="rtl"
                                            style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 11, fontWeight: 700, color: '#6E6E73', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <input value={item.title || ''} onChange={e => updateItem(idx, 'title', e.target.value)} placeholder="שם מוצר" dir="rtl"
                                            style={{ padding: '7px 10px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none' }} />
                                        <input type="number" value={item.qty} min="1" onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                            style={{ padding: '7px 6px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <input value={item.unit || ''} onChange={e => updateItem(idx, 'unit', e.target.value)} placeholder="יח׳" dir="rtl"
                                            style={{ padding: '7px 6px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 11, fontWeight: 700, color: '#6E6E73', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <input type="number" value={item.salePrice} onChange={e => updateItem(idx, 'salePrice', Number(e.target.value))} placeholder="מחיר ₪"
                                            style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#007AFF', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <button onClick={() => removeItem(idx)}
                                            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            {(ocrData.items?.length > 0) && (
                                <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: 'linear-gradient(150deg, rgba(0,122,255,0.10), rgba(0,122,255,0.04))', border: '1px solid rgba(0,122,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 4px 14px rgba(0,122,255,0.08)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>₪{computeSubtotal(ocrData.items).toLocaleString()}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73' }}>סכום ביניים (לפני מע"מ)</span>
                                    </div>
                                    {ocrData.vatAmount != null && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1F' }}>₪{Number(ocrData.vatAmount).toLocaleString()}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6E6E73' }}>מע"מ</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(0,122,255,0.15)' }}>
                                        <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #007AFF, #007AFFc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                            ₪{Number(ocrData.totalIncVat ?? computeSubtotal(ocrData.items)).toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF' }}>סה"כ {ocrData.totalIncVat != null ? 'כולל מע"מ' : 'להזמנה'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div style={{ ...glass, borderRadius: 20, padding: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', margin: '0 0 8px' }}>📝 הערות</p>
                            <textarea value={ocrData.notes || ''} onChange={e => setOcrData(p => ({ ...p, notes: e.target.value }))} dir="rtl" rows={2}
                                placeholder="הערות מיוחדות, הנחיות אספקה..."
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 12, fontFamily: 'Heebo,sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#1D1D1F' }} />
                        </div>

                        {/* Raw text (shown for low-confidence / manual entry) */}
                        {(lowConfidence && rawText) && (
                            <details open style={{ ...glass, borderRadius: 20, padding: 16 }}>
                                <summary style={{ fontSize: 11, fontWeight: 800, color: '#FF3B30', letterSpacing: '0.06em', cursor: 'pointer' }}>🛑 טקסט גולמי מהסריקה (להזנה ידנית)</summary>
                                <pre dir="rtl" style={{ marginTop: 10, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.6, color: '#3A3A3C', background: '#F5F5F7', borderRadius: 12, padding: 12, fontFamily: 'Heebo,sans-serif' }}>{rawText}</pre>
                            </details>
                        )}

                        {/* ── MAPPING & EMBED — where each group of data lands ── */}
                        <div style={{ borderRadius: 24, padding: 18, position: 'relative', overflow: 'hidden',
                            background: 'linear-gradient(160deg, rgba(255,255,255,0.97), rgba(244,248,253,0.94))',
                            border: '1px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 20px 60px rgba(20,40,80,0.13), inset 0 1.5px 0 rgba(255,255,255,1)',
                            backdropFilter: 'blur(30px) saturate(1.7)', WebkitBackdropFilter: 'blur(30px) saturate(1.7)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 17 }}>🎯</span>
                                <p style={{ fontSize: 14, fontWeight: 900, color: '#1D1D1F', margin: 0 }}>מיפוי והטמעה חכמה</p>
                            </div>
                            <p style={{ fontSize: 11.5, color: '#86868B', margin: '0 0 14px', fontWeight: 600 }}>סמן לאן כל קבוצת נתונים תוטמע — ולחיצה אחת מבצעת הכל אוטומטית.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 16 }}>
                                <EmbedTarget Icon={User} color="#007AFF" title="לקוח / איש קשר"
                                    subtitle={`${custCount} שדות — שם, טלפון, מייל, כתובת, מוסד`}
                                    active={targets.customer} onToggle={() => toggleTarget('customer')} />

                                <EmbedTarget Icon={Package} color="#5856D6" title="הזמנה בפייפליין"
                                    subtitle={`${orderCount} שדות רכש · ${itemCount} פריטים · ₪${Number(ocrData.totalIncVat ?? computeSubtotal(ocrData.items)).toLocaleString()}`}
                                    active={targets.order} onToggle={() => toggleTarget('order')} />

                                <EmbedTarget Icon={Archive} color="#34C759" title="שמור מקור בכספת"
                                    subtitle="המסמך המקורי יישמר לתיקייה שנבחרה"
                                    active={targets.vault} onToggle={() => toggleTarget('vault')} disabled={!fileObject}>
                                    <select value={vaultFolder} onChange={e => setVaultFolder(e.target.value)} disabled={!targets.vault}
                                        style={{ padding: '7px 10px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.10)', background: '#fff', fontSize: 11.5, fontWeight: 700, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', cursor: targets.vault ? 'pointer' : 'not-allowed' }}>
                                        {VAULT_FOLDERS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </EmbedTarget>

                                <EmbedTarget Icon={Truck} color="#FF9500" title="הזמנת ספק (רשות)"
                                    subtitle="צור הזמנת רכש לספק להשלמת הפריטים"
                                    active={targets.supplier} onToggle={() => toggleTarget('supplier')} />
                            </div>

                            <motion.button whileHover={saving ? undefined : { y: -2, boxShadow: '0 16px 40px rgba(0,122,255,0.44)' }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} onClick={embedSelected} disabled={saving}
                                style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', marginBottom: 10,
                                    background: saving ? 'rgba(0,122,255,0.5)' : 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#fff', fontSize: 15.5, fontWeight: 900,
                                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif',
                                    boxShadow: saving ? 'none' : '0 8px 26px rgba(0,122,255,0.38)' }}>
                                {saving ? 'מטמיע...' : 'הטמע אוטומטית'}
                            </motion.button>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <motion.button whileHover={saving ? undefined : { y: -1 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} onClick={saveForManualReview} disabled={saving}
                                    style={{ flex: 1, padding: '11px', borderRadius: 13, border: `1.5px solid ${lowConfidence ? 'rgba(255,149,0,0.5)' : 'rgba(0,0,0,0.10)'}`, background: lowConfidence ? 'linear-gradient(135deg, rgba(255,149,0,0.14), rgba(255,149,0,0.06))' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', fontSize: 12.5, fontWeight: 800, color: lowConfidence ? '#FF9500' : '#86868B', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                                    🗂️ שמור לבדיקה ידנית
                                </motion.button>
                                <button onClick={reset} disabled={saving}
                                    style={{ padding: '11px 18px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.04)', fontSize: 12.5, fontWeight: 700, color: '#86868B', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                    סרוק מחדש
                                </button>
                            </div>
                        </div>
                            </div>{/* /right column */}
                        </div>{/* /side-by-side grid */}
                    </motion.div>
                )}

                {/* Step: Saved */}
                {step === 'saved' && (
                    <motion.div key="saved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ ...glass, borderRadius: 24, padding: '60px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#34C759', margin: '0 0 8px' }}>נשמר בהצלחה!</p>
                        <p style={{ fontSize: 13, color: '#86868B', margin: 0 }}>מעבד את הבקשה...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Fullscreen lightbox — view / zoom / rotate the source document ── */}
            <AnimatePresence>
                {lightbox && previewImgs.length > 0 && (
                    <motion.div key="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column',
                            background: 'rgba(12,18,32,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>

                        {/* toolbar */}
                        <div onClick={e => e.stopPropagation()}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FileText size={16} color="#fff" strokeWidth={2.4} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', direction: 'ltr', textAlign: 'right' }}>{fileName || 'מסמך המקור'}</p>
                                    {previewImgs.length > 1 && <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '1px 0 0' }}>עמוד {lightbox.i + 1} מתוך {previewImgs.length}</p>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="הקטן" style={lbBtn}><ZoomOut size={17} color="#fff" strokeWidth={2.3} /></button>
                                <button onClick={() => { setZoom(1); setRotate(0); }} title="איפוס" style={{ ...lbBtn, width: 'auto', padding: '0 12px', fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'Heebo,sans-serif' }}>{Math.round(zoom * 100)}%</button>
                                <button onClick={() => setZoom(z => Math.min(6, +(z + 0.25).toFixed(2)))} title="הגדל" style={lbBtn}><ZoomIn size={17} color="#fff" strokeWidth={2.3} /></button>
                                <button onClick={() => setRotate(r => (r + 90) % 360)} title="סובב" style={lbBtn}><RotateCw size={16} color="#fff" strokeWidth={2.3} /></button>
                                <a href={previewImgs[lightbox.i]} target="_blank" rel="noreferrer" title="פתח בכרטיסייה חדשה" style={{ ...lbBtn, textDecoration: 'none' }}><ExternalLink size={16} color="#fff" strokeWidth={2.3} /></a>
                                <button onClick={() => setLightbox(null)} title="סגור (Esc)" style={{ ...lbBtn, background: 'rgba(255,59,48,0.85)' }}><X size={18} color="#fff" strokeWidth={2.6} /></button>
                            </div>
                        </div>

                        {/* stage */}
                        <div style={{ flex: 1, position: 'relative', overflow: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24 }}>
                            {previewImgs.length > 1 && (
                                <>
                                    <button onClick={e => { e.stopPropagation(); lbGo(-1, previewImgs.length); }} style={{ ...lbNav, insetInlineEnd: 16 }} title="הקודם"><ChevronRight size={26} color="#fff" strokeWidth={2.4} /></button>
                                    <button onClick={e => { e.stopPropagation(); lbGo(1, previewImgs.length); }} style={{ ...lbNav, insetInlineStart: 16 }} title="הבא"><ChevronLeft size={26} color="#fff" strokeWidth={2.4} /></button>
                                </>
                            )}
                            <motion.img
                                key={lightbox.i}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onClick={e => { e.stopPropagation(); setZoom(z => z >= 2 ? 1 : +(z + 1).toFixed(2)); }}
                                src={previewImgs[lightbox.i]} alt="מסמך מוגדל"
                                style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transformOrigin: 'center top',
                                    maxWidth: zoom <= 1 ? '100%' : 'none', maxHeight: zoom <= 1 ? '100%' : 'none',
                                    borderRadius: 10, boxShadow: '0 30px 90px rgba(0,0,0,0.5)', cursor: zoom >= 2 ? 'zoom-out' : 'zoom-in',
                                    transition: 'transform 0.18s ease', background: '#fff' }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Lightbox toolbar button + nav-arrow styles
const lbBtn = { width: 36, height: 36, borderRadius: 11, border: 'none', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 };
const lbNav = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 46, height: 46, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, backdropFilter: 'blur(8px)' };
