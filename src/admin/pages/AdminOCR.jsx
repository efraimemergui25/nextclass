/* eslint-disable */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';

const glass = {
    background: 'rgba(255,255,255,0.88)',
    border: '1.5px solid rgba(255,255,255,0.95)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1.5px 0 rgba(255,255,255,1)',
};

function Field({ label, value, onChange, type = 'text', placeholder }) {
    return (
        <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</label>
            <input
                type={type}
                value={value || ''}
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

    const [step, setStep] = useState('upload'); // upload | scanning | review | saved
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [mimeType, setMimeType] = useState('image/jpeg');
    const [ocrData, setOcrData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = useCallback((file) => {
        if (!file || !file.type.startsWith('image/')) {
            showToast('יש לבחור קובץ תמונה', 'error');
            return;
        }
        setMimeType(file.type);
        const reader = new FileReader();
        reader.onload = e => {
            const dataUrl = e.target.result;
            setImagePreview(dataUrl);
            // Strip "data:image/...;base64," prefix
            const b64 = dataUrl.split(',')[1];
            setImageBase64(b64);
            setStep('ready');
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const runOCR = async () => {
        if (!imageBase64) return;
        setStep('scanning');
        try {
            const res = await fetch('/api/ocr-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64, mimeType }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'OCR failed');
            setOcrData(json.data);
            setStep('review');
        } catch (err) {
            showToast(`שגיאה בסריקה: ${err.message}`, 'error');
            setStep('ready');
        }
    };

    const updateItem = (idx, key, val) => {
        setOcrData(prev => ({
            ...prev,
            items: prev.items.map((it, i) => i === idx ? { ...it, [key]: val } : it),
        }));
    };

    const removeItem = (idx) => {
        setOcrData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
    };

    const addItem = () => {
        setOcrData(prev => ({
            ...prev,
            items: [...(prev.items || []), { title: '', qty: 1, salePrice: 0 }],
        }));
    };

    const saveAsQuote = async () => {
        if (!ocrData) return;
        setSaving(true);
        try {
            const id = `OCR-${Date.now()}`;
            const subtotal = (ocrData.items || []).reduce(
                (s, it) => s + (Number(it.salePrice) || 0) * (Number(it.qty) || 1), 0
            );
            await setDoc(doc(db, 'quotes', id), {
                id,
                contactName:   ocrData.contactName || '',
                institution:   ocrData.institution || '',
                phone:         ocrData.phone || '',
                email:         ocrData.email || '',
                items:         ocrData.items || [],
                subtotal,
                notes:         ocrData.notes || '',
                status:        'חדש',
                source:        'ocr',
                ocrConfidence: ocrData.confidence || null,
                dateTs:        Date.now(),
                date:          new Date().toLocaleDateString('he-IL'),
            });
            setStep('saved');
            showToast('הצעת מחיר נוצרה מהתמונה ✓', 'success');
            setTimeout(() => navigate('/admin/orders'), 1800);
        } catch (err) {
            showToast(`שגיאה בשמירה: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const reset = () => {
        setStep('upload'); setImagePreview(null);
        setImageBase64(null); setOcrData(null);
    };

    return (
        <div dir="rtl" style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 60px' }}>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#007AFF,#5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,122,255,0.35)', fontSize: 22 }}>🔍</div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1F', margin: 0, letterSpacing: '-0.02em' }}>סריקת הזמנה — OCR AI</h1>
                        <p style={{ fontSize: 12, color: '#86868B', margin: '2px 0 0', fontWeight: 600 }}>העלה תמונת הזמנה ו-Gemini יחלץ את כל הפרטים אוטומטית</p>
                    </div>
                </div>
            </motion.div>

            {/* Step: Upload */}
            <AnimatePresence mode="wait">
                {(step === 'upload' || step === 'ready') && (
                    <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>

                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                            onClick={() => fileRef.current?.click()}
                            style={{
                                borderRadius: 22, border: `2px dashed ${dragOver ? '#007AFF' : 'rgba(0,122,255,0.25)'}`,
                                background: dragOver ? 'rgba(0,122,255,0.05)' : 'rgba(255,255,255,0.7)',
                                padding: imagePreview ? 0 : '56px 24px',
                                cursor: 'pointer', textAlign: 'center', overflow: 'hidden',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                marginBottom: 20,
                            }}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', borderRadius: 20 }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1F', margin: '0 0 6px' }}>גרור תמונת הזמנה לכאן</p>
                                    <p style={{ fontSize: 12, color: '#86868B', margin: 0 }}>או לחץ לבחירת קובץ · JPG, PNG, PDF (as image)</p>
                                </>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                        {imagePreview && (
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
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ width: 52, height: 52, borderRadius: '50%', border: '4px solid rgba(0,122,255,0.15)', borderTopColor: '#007AFF', margin: '0 auto 20px' }}
                        />
                        <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', margin: '0 0 6px' }}>Gemini AI סורק את ההזמנה</p>
                        <p style={{ fontSize: 12, color: '#86868B', margin: 0 }}>מחלץ פרטי לקוח, מוצרים ומחירים...</p>
                    </motion.div>
                )}

                {/* Step: Review */}
                {step === 'review' && ocrData && (
                    <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                        {/* Confidence badge */}
                        {ocrData.confidence != null && (
                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '5px 14px', borderRadius: 99,
                                    background: ocrData.confidence >= 80 ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)',
                                    border: `1px solid ${ocrData.confidence >= 80 ? 'rgba(52,199,89,0.3)' : 'rgba(255,149,0,0.3)'}`,
                                }}>
                                    <span style={{ fontSize: 12 }}>{ocrData.confidence >= 80 ? '✅' : '⚠️'}</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: ocrData.confidence >= 80 ? '#34C759' : '#FF9500' }}>
                                        ביטחון Gemini: {ocrData.confidence}%
                                    </span>
                                </div>
                                <span style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>בדוק את הפרטים ותקן לפי הצורך</span>
                            </div>
                        )}

                        {/* Contact Info */}
                        <div style={{ ...glass, borderRadius: 20, padding: 20, marginBottom: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', margin: '0 0 14px' }}>👤 פרטי לקוח</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Field label="שם איש קשר" value={ocrData.contactName} onChange={v => setOcrData(p => ({ ...p, contactName: v }))} />
                                <Field label="מוסד / חברה" value={ocrData.institution} onChange={v => setOcrData(p => ({ ...p, institution: v }))} />
                                <Field label="טלפון" value={ocrData.phone} onChange={v => setOcrData(p => ({ ...p, phone: v }))} />
                                <Field label="מייל" value={ocrData.email} onChange={v => setOcrData(p => ({ ...p, email: v }))} type="email" />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Field label="כתובת" value={ocrData.address} onChange={v => setOcrData(p => ({ ...p, address: v }))} />
                                </div>
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
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 32px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <input value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)}
                                            placeholder="שם מוצר" dir="rtl"
                                            style={{ padding: '7px 10px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none' }} />
                                        <input type="number" value={item.qty} min="1" onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                                            style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#1D1D1F', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <input type="number" value={item.salePrice} onChange={e => updateItem(idx, 'salePrice', Number(e.target.value))}
                                            placeholder="מחיר ₪"
                                            style={{ padding: '7px 8px', borderRadius: 9, border: '1.5px solid rgba(0,0,0,0.09)', background: '#fff', fontSize: 12, fontWeight: 700, color: '#007AFF', fontFamily: 'Heebo,sans-serif', outline: 'none', textAlign: 'center' }} />
                                        <button onClick={() => removeItem(idx)}
                                            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,59,48,0.09)', color: '#FF3B30', cursor: 'pointer', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            {(ocrData.items?.length > 0) && (
                                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.14)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#007AFF' }}>
                                        ₪{(ocrData.items || []).reduce((s, it) => s + (Number(it.salePrice) || 0) * (Number(it.qty) || 1), 0).toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6E6E73' }}>סה"כ להצעה</span>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {ocrData.notes && (
                            <div style={{ ...glass, borderRadius: 20, padding: 16, marginBottom: 16 }}>
                                <p style={{ fontSize: 11, fontWeight: 800, color: '#AEAEB2', letterSpacing: '0.06em', margin: '0 0 8px' }}>📝 הערות מהסריקה</p>
                                <textarea value={ocrData.notes} onChange={e => setOcrData(p => ({ ...p, notes: e.target.value }))}
                                    dir="rtl" rows={2}
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)', background: '#F5F5F7', fontSize: 12, fontFamily: 'Heebo,sans-serif', outline: 'none', resize: 'none', boxSizing: 'border-box', color: '#1D1D1F' }} />
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={saveAsQuote} disabled={saving}
                                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: saving ? '#AEAEB2' : 'linear-gradient(135deg,#34C759,#30D158)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Heebo,sans-serif', boxShadow: saving ? 'none' : '0 6px 20px rgba(52,199,89,0.35)' }}>
                                {saving ? 'שומר...' : '✓ שמור כהצעת מחיר חדשה'}
                            </motion.button>
                            <button onClick={reset}
                                style={{ padding: '14px 20px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.04)', fontSize: 13, fontWeight: 700, color: '#86868B', cursor: 'pointer', fontFamily: 'Heebo,sans-serif' }}>
                                סרוק מחדש
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step: Saved */}
                {step === 'saved' && (
                    <motion.div key="saved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ ...glass, borderRadius: 24, padding: '60px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                        <p style={{ fontSize: 18, fontWeight: 900, color: '#34C759', margin: '0 0 8px' }}>הצעת מחיר נוצרה!</p>
                        <p style={{ fontSize: 13, color: '#86868B', margin: 0 }}>מועבר לדף ניהול הצעות...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
