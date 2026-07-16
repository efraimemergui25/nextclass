/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════════
   COMBOBOX — searchable dropdown with an ALWAYS-available free-text ("other") option.
   ───────────────────────────────────────────────────────────────────────────────
   Reusable everywhere a field has known values but must also accept anything typed:
   product picker (from inventory), address, supplier, city… Pick from the list OR
   just keep typing — whatever is in the box is the value. Premium glass dropdown,
   optional per-row image + price badge, click-outside to close.
   ═══════════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Pencil } from 'lucide-react';

const HE = 'Heebo, sans-serif';

export default function Combobox({ value = '', onChange, onPick, options = [], placeholder = '', style = {}, inputStyle = {} }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState(value);
    const boxRef = useRef(null);
    useEffect(() => { setQ(value); }, [value]);
    useEffect(() => {
        const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const ql = String(q || '').trim().toLowerCase();
    const filtered = (ql ? options.filter(o => String(o.label || '').toLowerCase().includes(ql)) : options).slice(0, 8);
    const exact = options.some(o => String(o.label || '') === String(q || '').trim());
    const pick = (o) => { setQ(o.label); onChange && onChange(o.label); onPick && onPick(o); setOpen(false); };

    return (
        <div ref={boxRef} style={{ position: 'relative', ...style }}>
            <div style={{ position: 'relative' }}>
                <input value={q} onChange={e => { setQ(e.target.value); onChange && onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} dir="rtl"
                    style={{ width: '100%', padding: '7px 30px 7px 9px', borderRadius: 10, border: `1.5px solid ${open ? 'rgba(0,122,255,0.4)' : 'rgba(0,0,0,0.1)'}`, background: '#fff', fontSize: 12, fontWeight: 600, color: '#1D1D1F', fontFamily: HE, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s', ...inputStyle }} />
                <ChevronDown size={14} color="#AEAEB2" style={{ position: 'absolute', insetInlineStart: 9, top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, transition: 'transform .18s', pointerEvents: 'none' }} />
            </div>
            <AnimatePresence>
                {open && (filtered.length > 0 || (ql && !exact)) && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}
                        style={{ position: 'absolute', top: 'calc(100% + 4px)', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 60, background: '#fff', borderRadius: 12, boxShadow: '0 14px 44px rgba(20,40,80,0.2)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', maxHeight: 264, overflowY: 'auto' }}>
                        {filtered.map((o, i) => (
                            <button key={i} onMouseDown={e => { e.preventDefault(); pick(o); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)', background: String(q) === String(o.label) ? 'rgba(0,122,255,0.06)' : '#fff', cursor: 'pointer', textAlign: 'right', fontFamily: HE }}>
                                {o.image
                                    ? <img src={o.image} alt="" onError={e => { e.target.style.display = 'none'; }} style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                                    : <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#EEF2FF,#F0F7FF)', flexShrink: 0 }} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</p>
                                    {o.sub && <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: '#AEAEB2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.sub}</p>}
                                </div>
                                {o.price != null && <span style={{ fontSize: 11.5, fontWeight: 900, color: '#007AFF', flexShrink: 0 }}>₪{Number(o.price).toLocaleString()}</span>}
                            </button>
                        ))}
                        {ql && !exact && (
                            <button onMouseDown={e => { e.preventDefault(); onChange && onChange(q); setOpen(false); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 11px', border: 'none', background: 'rgba(0,122,255,0.05)', cursor: 'pointer', textAlign: 'right', fontFamily: HE }}>
                                <Pencil size={12} color="#007AFF" strokeWidth={2.5} />
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#007AFF' }}>השתמש בטקסט חופשי: "{q}"</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
