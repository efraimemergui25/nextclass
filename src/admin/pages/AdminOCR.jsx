/* eslint-disable */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAdminToast } from '../context/AdminToastContext';

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

export default function AdminOCR() {
    const navigate = useNavigate();
    const { showToast } = useAdminToast();
    const fileRef = useRef(null);

    const [step, setStep] = useState('upload'); // upload | ready | scanning | review | saved
    const [fileObject, setFileObject] = useState(null);
    const [fileName, setFileName] = useState('');
    const [fileKind, setFileKind] = useState(null);      // image | heic | pdf | csv | docx | xlsx
    const [mimeType, setMimeType] = useState('image/jpeg');
    const [filePreview, setFilePreview] = useState(null); // dataURL (image/pdf)
    const [fileBase64, setFileBase64] = useState(null);   // base64 for inline (image/pdf)
    const [fileText, setFileText] = useState(null);       // extracted text (csv/docx/xlsx)
    const [extracting, setExtracting] = useState(false);

    const [ocrData, setOcrData] = useState(null);
    const [rawText, setRawText] = useState('');
    const [warnings, setWarnings] = useState([]);
    const [intakeId, setIntakeId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const reset = () => {
        setStep('upload'); setFileObject(null); setFileName(''); setFileKind(null);
        setFilePreview(null); setFileBase64(null); setFileText(null); setExtracting(false);
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

        if (kind === 'image' || kind === 'heic' || kind === 'pdf') {
            const reader = new FileReader();
            reader.onload = e => {
                const dataUrl = e.target.result;
                setFilePreview(dataUrl);
                setFileBase64(String(dataUrl).split(',')[1]);
                setStep('ready');
            };
            reader.readAsDataURL(file);
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
            const body = fileText != null
                ? { text: fileText, fileName }
                : { fileBase64, mimeType, fileName };
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

    // ── Upload original file to Firebase Storage ───────────────────────────
    const uploadOriginal = async () => {
        if (!fileObject) return { url: null, path: null };
        const safe = (fileName || 'order').replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `ocr-intakes/${Date.now()}_${safe}`;
        const sRef = storageRef(storage, path);
        const task = uploadBytesResumable(sRef, fileObject);
        await new Promise((resolve, reject) => {
            task.on('state_changed', null, reject, () => resolve());
        });
        const url = await getDownloadURL(task.snapshot.ref);
        return { url, path };
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

    const conf = ocrData?.confidence;
    const lowConfidence = conf == null || conf < 60;
    const canPreviewImg = fileKind === 'image';

    return (
        <div dir="rtl" style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 60px' }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,1)', fontSize: 22 }}>🔍</div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>קליטת הזמנות — OCR AI</h1>
                        <p style={{ fontSize: 12, color: '#86868B', margin: '2px 0 0', fontWeight: 600 }}>העלה הזמנת רכש (עמל / ספק) ו-Gemini יחלץ, ואתה מאשר ופותח הזמנה</p>
                    </div>
                </div>
            </motion.div>

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
                            ) : (canPreviewImg && filePreview) ? (
                                <img src={filePreview} alt="preview" onError={e => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', borderRadius: 20 }} />
                            ) : (step === 'ready' && fileKind === 'pdf' && filePreview) ? (
                                <embed src={filePreview} type="application/pdf" style={{ width: '100%', height: 420, borderRadius: 18, border: 'none' }} />
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
                                <motion.button whileTap={{ scale: 0.97 }} onClick={runOCR}
                                    style={{ padding: '13px 36px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#007AFF,#5856D6)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: '0 6px 20px rgba(0,122,255,0.35)' }}>
                                    ✨ סרוק עם Gemini AI
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
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', margin: '0 0 6px' }}>Gemini AI קורא את ההזמנה</p>
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
                                        ביטחון Gemini: {conf}%
                                    </span>
                                </div>
                            )}
                            <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>בדוק ותקן את הפרטים לפני אישור</span>
                        </div>

                        {warnings.length > 0 && (
                            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.22)' }}>
                                {warnings.map((w, i) => (
                                    <p key={i} style={{ fontSize: 11.5, fontWeight: 700, color: '#B25E00', margin: i ? '4px 0 0' : 0 }}>⚠️ {w}</p>
                                ))}
                            </div>
                        )}

                        {/* Purchase-order details */}
                        <div style={{ ...glass, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#86868B', letterSpacing: '0.06em', margin: '0 0 14px' }}>📋 פרטי הזמנת רכש</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <Field label='מספר הזמנה' value={ocrData.orderNumber} onChange={v => setOcrData(p => ({ ...p, orderNumber: v }))} />
                                <Field label='סעיף תקציבי' value={ocrData.budgetCode} onChange={v => setOcrData(p => ({ ...p, budgetCode: v }))} />
                                <Field label='תנאי תשלום' value={ocrData.paymentTerms} onChange={v => setOcrData(p => ({ ...p, paymentTerms: v }))} placeholder='שוטף+30' />
                                <Field label='תאריך הזמנה' value={ocrData.poDate} onChange={v => setOcrData(p => ({ ...p, poDate: v }))} />
                                <Field label='תאריך אספקה' value={ocrData.deliveryDate} onChange={v => setOcrData(p => ({ ...p, deliveryDate: v }))} />
                                <Field label='מאשר / מורשה חתימה' value={ocrData.authorizedBy} onChange={v => setOcrData(p => ({ ...p, authorizedBy: v }))} />
                                <Field label='מס׳ ספק' value={ocrData.supplierRef} onChange={v => setOcrData(p => ({ ...p, supplierRef: v }))} />
                                <Field label='ח.פ. / ע.מ.' value={ocrData.companyId} onChange={v => setOcrData(p => ({ ...p, companyId: v }))} />
                                <Field label='מטבע' value={ocrData.currency} onChange={v => setOcrData(p => ({ ...p, currency: v }))} placeholder='ILS' />
                            </div>
                        </div>

                        {/* Contact info */}
                        <div style={{ ...glass, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', margin: '0 0 14px' }}>👤 פרטי לקוח / מוסד</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="שם איש קשר" value={ocrData.contactName} onChange={v => setOcrData(p => ({ ...p, contactName: v }))} />
                                <Field label="מוסד / חברה" value={ocrData.institution} onChange={v => setOcrData(p => ({ ...p, institution: v }))} />
                                <Field label="טלפון" value={ocrData.phone} onChange={v => setOcrData(p => ({ ...p, phone: v }))} />
                                <Field label="מייל" value={ocrData.email} onChange={v => setOcrData(p => ({ ...p, email: v }))} type="email" />
                                <Field label="כתובת" value={ocrData.address} onChange={v => setOcrData(p => ({ ...p, address: v }))} span={2} />
                                <Field label="עיר" value={ocrData.city} onChange={v => setOcrData(p => ({ ...p, city: v }))} />
                                <Field label="מיקוד" value={ocrData.zip} onChange={v => setOcrData(p => ({ ...p, zip: v }))} />
                            </div>
                        </div>

                        {/* Items */}
                        <div style={{ ...glass, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <motion.button whileTap={{ scale: 0.95 }} onClick={addItem}
                                    style={{ padding: '5px 14px', borderRadius: 10, border: 'none', background: 'rgba(0,122,255,0.10)', color: '#007AFF', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                    + הוסף שורה
                                </motion.button>
                                <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', margin: 0 }}>📦 פריטים ({ocrData.items?.length || 0})</p>
                            </div>

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
                                <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.14)' }}>
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
                                        <span style={{ fontSize: 18, fontWeight: 900, color: '#007AFF' }}>
                                            ₪{Number(ocrData.totalIncVat ?? computeSubtotal(ocrData.items)).toLocaleString()}
                                        </span>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#007AFF' }}>סה"כ {ocrData.totalIncVat != null ? 'כולל מע"מ' : 'להזמנה'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div style={{ ...glass, borderRadius: 20, padding: 16, marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', margin: '0 0 8px' }}>📝 הערות</p>
                            <textarea value={ocrData.notes || ''} onChange={e => setOcrData(p => ({ ...p, notes: e.target.value }))} dir="rtl" rows={2}
                                placeholder="הערות מיוחדות, הנחיות אספקה..."
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 12, fontFamily: 'Heebo,sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#1D1D1F' }} />
                        </div>

                        {/* Raw text (shown for low-confidence / manual entry) */}
                        {(lowConfidence && rawText) && (
                            <details open style={{ ...glass, borderRadius: 20, padding: 16, marginBottom: 16 }}>
                                <summary style={{ fontSize: 11, fontWeight: 800, color: '#FF3B30', letterSpacing: '0.06em', cursor: 'pointer' }}>🛑 טקסט גולמי מהסריקה (להזנה ידנית)</summary>
                                <pre dir="rtl" style={{ marginTop: 10, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, lineHeight: 1.6, color: '#3A3A3C', background: '#F5F5F7', borderRadius: 12, padding: 12, fontFamily: 'Heebo,sans-serif' }}>{rawText}</pre>
                            </details>
                        )}

                        {/* APPROVE step — distinct from editing */}
                        <div style={{ ...glass, borderRadius: 20, padding: 18 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#34C759', letterSpacing: '0.06em', margin: '0 0 4px' }}>✔️ שלב אישור</p>
                            <p style={{ fontSize: 11, color: '#86868B', margin: '0 0 14px', fontWeight: 600 }}>לאחר בדיקת הפרטים, אשר כדי לפתוח הזמנה במערכת (ההזמנה המקורית תישמר בכספת הסריקות).</p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={approveAndCreateOrder} disabled={saving}
                                    style={{ flex: '1 1 240px', padding: '14px', borderRadius: 14, border: 'none', background: saving ? '#AEAEB2' : 'linear-gradient(135deg,#34C759,#30D158)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: saving ? 'none' : '0 6px 20px rgba(52,199,89,0.35)' }}>
                                    {saving ? 'שומר...' : '✓ אשר וצור הזמנה'}
                                </motion.button>
                                <motion.button whileTap={{ scale: 0.97 }} onClick={saveForManualReview} disabled={saving}
                                    style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${lowConfidence ? 'rgba(255,149,0,0.5)' : 'rgba(0,0,0,0.10)'}`, background: lowConfidence ? 'rgba(255,149,0,0.10)' : 'rgba(0,0,0,0.04)', fontSize: 13, fontWeight: 800, color: lowConfidence ? '#FF9500' : '#86868B', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                    🗂️ שמור לבדיקה ידנית
                                </motion.button>
                                <button onClick={reset} disabled={saving}
                                    style={{ padding: '14px 18px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.04)', fontSize: 13, fontWeight: 700, color: '#86868B', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                    סרוק מחדש
                                </button>
                            </div>
                        </div>
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
        </div>
    );
}
