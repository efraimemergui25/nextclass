import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Scale, ChevronLeft } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { useTheme } from '../context/ThemeContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileCompare() {
    const navigate = useNavigate();
    const { colors: c } = useTheme();
    const { selectedForCompare, removeFromCompare, clearCompare } = useCompare();

    if (selectedForCompare.length === 0) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(88,86,214,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}
            >
                <Scale size={36} color="#5856D6" strokeWidth={1.6} />
            </motion.div>
            <p style={{ fontSize: 20, fontWeight: 800, color: c.text, marginBottom: 8, letterSpacing: '-0.03em' }}>אין מוצרים להשוואה</p>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 28, lineHeight: 1.5 }}>הוסף מוצרים מהקטלוג ולחץ "השווה"</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/catalog')} style={{
                background: 'linear-gradient(135deg, #5856D6, #007AFF)', color: '#fff', border: 'none', borderRadius: 14,
                padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(88,86,214,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                WebkitTapHighlightColor: 'transparent',
            }}>
                לקטלוג המוצרים <ChevronLeft size={16} />
            </motion.button>
        </div>
    );

    const allSpecLabels = [...new Set(
        selectedForCompare.flatMap(p => (p.specs || []).map(s => s.label))
    )];

    const getSpec = (product, label) =>
        product.specs?.find(s => s.label === label)?.value || '—';

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '12px 0 32px', background: c.bg, minHeight: '100dvh' }}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 16 }}>
                <motion.button whileTap={{ scale: 0.92 }} onClick={clearCompare} style={{
                    background: 'none', border: 'none', color: '#FF3B30', fontSize: 13,
                    fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                    נקה הכל
                </motion.button>
                <p style={{ fontSize: 14, color: c.text3, fontWeight: 500 }}>
                    {selectedForCompare.length} מוצרים
                </p>
            </div>

            {/* ── Grid ─────────────────────────────────────────────────── */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `110px repeat(${selectedForCompare.length}, 1fr)`,
                    minWidth: `${110 + selectedForCompare.length * 140}px`,
                }}>

                    {/* ── Image row ── */}
                    <div />
                    {selectedForCompare.map(p => (
                        <div key={p.id} style={{ padding: '0 8px 14px', textAlign: 'center', position: 'relative' }}>
                            <div style={{
                                width: '100%', aspectRatio: '1',
                                background: c.surface2,
                                borderRadius: 14, overflow: 'hidden', marginBottom: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {p.image
                                    ? <img src={p.image} alt={p.title} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                                    : <span style={{ fontSize: 28, opacity: 0.3 }}>🖥️</span>
                                }
                            </div>
                            <p style={{
                                fontSize: 11, fontWeight: 700, color: c.text, lineHeight: 1.3, marginBottom: 4,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                                {p.title}
                            </p>
                            <p style={{ fontSize: 14, fontWeight: 900, color: p.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.02em' }}>
                                ₪{(p.salePrice || p.price)?.toLocaleString()}
                            </p>
                            <motion.button
                                aria-label={`הסר ${p.title} מהשוואה`}
                                whileTap={{ scale: 0.78 }}
                                onClick={() => removeFromCompare(p.id)}
                                style={{
                                    position: 'absolute', top: 0, right: 8,
                                    width: 22, height: 22, borderRadius: 99,
                                    background: '#FF3B30', color: '#fff', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <X size={11} strokeWidth={3} />
                            </motion.button>
                        </div>
                    ))}

                    {/* ── View product row ── */}
                    <div style={{ padding: '0 0 14px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: c.text3, padding: '0 12px' }}>פרטים</span>
                    </div>
                    {selectedForCompare.map(p => (
                        <div key={p.id} style={{ padding: '0 8px 14px' }}>
                            <button
                                onClick={() => navigate(`/catalog/${p.id}`)}
                                style={{
                                    width: '100%', height: 34, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                                    color: '#fff', border: 'none', fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                צפה במוצר
                            </button>
                        </div>
                    ))}

                    {/* ── Spec rows ── */}
                    {allSpecLabels.map((label, rowI) => (
                        <Fragment key={label}>
                            <div style={{
                                padding: '11px 12px',
                                background: rowI % 2 === 0 ? c.subtleBg2 : 'transparent',
                                display: 'flex', alignItems: 'center',
                                borderTop: `0.5px solid ${c.divider}`,
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: c.text3, whiteSpace: 'nowrap' }}>{label}</span>
                            </div>
                            {selectedForCompare.map(p => {
                                const val = getSpec(p, label);
                                const isMissing = val === '—';
                                return (
                                    <div key={`${p.id}-${label}`} style={{
                                        padding: '11px 8px',
                                        background: rowI % 2 === 0 ? c.subtleBg2 : 'transparent',
                                        borderTop: `0.5px solid ${c.divider}`,
                                        textAlign: 'center',
                                    }}>
                                        <span style={{
                                            fontSize: 12,
                                            color: isMissing ? c.text4 : c.text,
                                            fontWeight: isMissing ? 400 : 600,
                                        }}>
                                            {val}
                                        </span>
                                    </div>
                                );
                            })}
                        </Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
