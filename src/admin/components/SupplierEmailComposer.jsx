/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS ADMIN — SUPPLIER EMAIL COMPOSER
   ───────────────────────────────────────────────────────────────────────────────
   Opens in the "forward to supplier" (dropship) flow. Every data point and every
   sentence arrives AUTO-FILLED from the order (buildSupplierEmailModel) and is
   fully EDITABLE here, with a live preview of the premium HTML the supplier will
   receive. On confirm it queues the rendered email to the approval gate — nothing
   auto-sends.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { buildSupplierEmailModel, renderSupplierEmailHtml } from '../lib/supplierEmail';

const HE = 'Heebo, sans-serif';
const CYAN = '#0891B2';

const inp = {
    width: '100%', padding: '9px 11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
    background: '#F7F8FA', fontFamily: HE, fontSize: 13, color: '#1D1D1F', outline: 'none',
    boxSizing: 'border-box', lineHeight: 1.6,
};
const lbl = { display: 'block', fontSize: 10.5, fontWeight: 800, color: '#AEAEB2', marginBottom: 5, letterSpacing: '0.02em' };

function Field({ label, value, onChange, rows, placeholder }) {
    return (
        <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={lbl}>{label}</span>
            {rows ? (
                <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} dir="rtl"
                    placeholder={placeholder} style={{ ...inp, resize: 'vertical' }} />
            ) : (
                <input value={value} onChange={e => onChange(e.target.value)} dir="rtl"
                    placeholder={placeholder} style={inp} />
            )}
        </label>
    );
}

function Section({ title, emoji, children }) {
    return (
        <div style={{ marginBottom: 18, paddingBottom: 4, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1D1D1F', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{emoji}</span>{title}
            </div>
            {children}
        </div>
    );
}

export default function SupplierEmailComposer({ order, supplier, note, busy, onClose, onQueue }) {
    const [model, setModel] = useState(() => buildSupplierEmailModel(order, supplier, { note }));
    const [showPreview, setShowPreview] = useState(true);
    const set = (k) => (v) => setModel(m => ({ ...m, [k]: v }));
    const setItem = (i, k, v) => setModel(m => ({ ...m, items: m.items.map((it, j) => j === i ? { ...it, [k]: v } : it) }));

    const html = useMemo(() => renderSupplierEmailHtml(model), [model]);
    const to = model._to || supplier?.email || '';

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 6000, backdropFilter: 'blur(4px)' }} />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                dir="rtl" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(1040px, 97vw)', height: 'min(90vh, 880px)', background: '#fff', borderRadius: 24, zIndex: 6001, fontFamily: HE, boxShadow: '0 30px 90px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'linear-gradient(180deg,#F0FBFF,#FFFFFF)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📮</span>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1D1D1F' }}>מייל לספק — {model._supplierName}</h2>
                            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: '#86868B' }}>
                                מולא אוטומטית מההזמנה · כל שדה ומשפט ניתן לעריכה {to ? `· אל: ${to}` : '· ⚠ אין מייל לספק'}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setShowPreview(p => !p)}
                            style={{ padding: '7px 12px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 12 }}>
                            {showPreview ? 'הסתר תצוגה' : 'הצג תצוגה'}
                        </button>
                        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 16, color: '#6E6E73' }}>✕</button>
                    </div>
                </div>

                {/* body: editor + preview */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                    {/* editor */}
                    <div style={{ width: showPreview ? '50%' : '100%', overflowY: 'auto', padding: '18px 22px', borderLeft: showPreview ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
                        <Field label="נושא המייל" value={model.subject} onChange={set('subject')} />

                        <Section title="פתיח" emoji="👋">
                            <Field label="פתיחה" value={model.greeting} onChange={set('greeting')} />
                            <Field label="משפט פתיחה" value={model.intro} onChange={set('intro')} rows={3} />
                        </Section>

                        <Section title="פרטי ההזמנה" emoji="🧾">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Field label="מספר הזמנה" value={model.orderNumber} onChange={set('orderNumber')} />
                                <Field label="תאריך הזמנה" value={model.orderDate} onChange={set('orderDate')} />
                                <Field label="תווית אספקה" value={model.deliveryLabel} onChange={set('deliveryLabel')} />
                                <Field label="נדרש עד (רשות)" value={model.deliveryDate} onChange={set('deliveryDate')} placeholder="—" />
                            </div>
                        </Section>

                        <Section title="פריטים (דגם + כמות)" emoji="📦">
                            {(model.items || []).map((it, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 52px', gap: 7, marginBottom: 7 }}>
                                    <input value={it.title} onChange={e => setItem(i, 'title', e.target.value)} placeholder="שם הפריט" dir="rtl" style={{ ...inp, fontSize: 12 }} />
                                    <input value={it.catalogNumber} onChange={e => setItem(i, 'catalogNumber', e.target.value)} placeholder="דגם/מק״ט" dir="rtl" style={{ ...inp, fontSize: 12 }} />
                                    <input type="number" value={it.qty} onChange={e => setItem(i, 'qty', Number(e.target.value) || 1)} style={{ ...inp, fontSize: 12, textAlign: 'center' }} />
                                </div>
                            ))}
                            {!(model.items || []).length && <p style={{ fontSize: 11.5, color: '#FF9500', fontWeight: 700, margin: 0 }}>⚠ אין פריטים בהזמנה</p>}
                        </Section>

                        <Section title="כתובת אספקה ואיש קשר" emoji="📍">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Field label="שם הלקוח" value={model.shipName} onChange={set('shipName')} />
                                <Field label="מוסד" value={model.shipInstitution} onChange={set('shipInstitution')} placeholder="—" />
                            </div>
                            <Field label="כתובת מדויקת" value={model.shipAddress} onChange={set('shipAddress')} rows={2} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Field label="איש קשר" value={model.shipContact} onChange={set('shipContact')} />
                                <Field label="טלפון" value={model.shipPhone} onChange={set('shipPhone')} />
                            </div>
                            <Field label="מייל ליצירת קשר" value={model.shipEmail} onChange={set('shipEmail')} placeholder="—" />
                        </Section>

                        <Section title="הערות מיוחדות" emoji="⚠️">
                            <Field label="משפט קבוע (מופיע תמיד)" value={model.callFirstNote} onChange={set('callFirstNote')} rows={2} />
                            <Field label="הערה נוספת (רשות)" value={model.specialNote} onChange={set('specialNote')} rows={2} placeholder="הערה חופשית לספק…" />
                        </Section>

                        <Section title="בקשת עדכונים" emoji="📩">
                            <Field label="כותרת" value={model.updatesTitle} onChange={set('updatesTitle')} />
                            <Field label="1 · מועד אספקה משוער" value={model.update1} onChange={set('update1')} rows={2} />
                            <Field label="2 · יציאה לאספקה + מעקב" value={model.update2} onChange={set('update2')} rows={2} />
                            <Field label="3 · אישור אספקה בפועל" value={model.update3} onChange={set('update3')} rows={2} />
                        </Section>

                        <Section title="תודה וסיום" emoji="🙏">
                            <Field label="משפט תודה" value={model.thankYou} onChange={set('thankYou')} rows={3} />
                        </Section>
                    </div>

                    {/* preview */}
                    {showPreview && (
                        <div style={{ width: '50%', overflowY: 'auto', background: '#F0F4FF' }}>
                            <iframe title="תצוגה מקדימה" srcDoc={html}
                                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
                        </div>
                    )}
                </div>

                {/* footer actions */}
                <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
                    <button disabled={busy || !to} onClick={() => onQueue({ html, subject: model.subject, to, model })}
                        style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', cursor: to && !busy ? 'pointer' : 'not-allowed', background: to && !busy ? 'linear-gradient(135deg,#0891B2,#22B8CF)' : '#D1D1D6', color: '#fff', fontFamily: HE, fontWeight: 800, fontSize: 14 }}>
                        {busy ? 'שומר…' : to ? '📮 שמור בתור אישור שליחה' : 'אין מייל לספק'}
                    </button>
                    <button onClick={onClose} style={{ padding: '13px 22px', borderRadius: 13, border: '1.5px solid rgba(0,0,0,0.1)', background: '#fff', color: '#6E6E73', cursor: 'pointer', fontFamily: HE, fontWeight: 700, fontSize: 13 }}>ביטול</button>
                </div>
            </motion.div>
        </>
    );
}
