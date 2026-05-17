import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Scale } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileCompare() {
    const navigate = useNavigate();
    const { selectedForCompare, removeFromCompare, clearCompare } = useCompare();

    if (selectedForCompare.length === 0) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(88,86,214,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Scale size={36} color="#5856D6" strokeWidth={1.6} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', marginBottom: 8, letterSpacing: '-0.03em' }}>אין מוצרים להשוואה</p>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 28 }}>הוסף מוצרים מהקטלוג להשוואה</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#5856D6', color: '#fff', border: 'none', borderRadius: 14,
                padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}>
                לקטלוג המוצרים
            </button>
        </div>
    );

    // Collect all unique spec labels across selected products
    const allSpecLabels = [...new Set(
        selectedForCompare.flatMap(p => (p.specs || []).map(s => s.label))
    )];

    const getSpec = (product, label) =>
        product.specs?.find(s => s.label === label)?.value || '—';

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '12px 0 32px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 16 }}>
                <button onClick={clearCompare} style={{
                    background: 'none', border: 'none', color: '#FF3B30', fontSize: 13,
                    fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                    נקה הכל
                </button>
                <p style={{ fontSize: 14, color: '#86868B', fontWeight: 500 }}>
                    {selectedForCompare.length} מוצרים
                </p>
            </div>

            {/* Product columns (horizontal scroll for many products) */}
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${selectedForCompare.length}, 1fr)`, minWidth: `${120 + selectedForCompare.length * 140}px`, gap: 0 }}>

                    {/* ── Image row ── */}
                    <div /> {/* empty corner */}
                    {selectedForCompare.map(p => (
                        <div key={p.id} style={{ padding: '0 8px 12px', textAlign: 'center', position: 'relative' }}>
                            <div style={{ width: '100%', aspectRatio: '1', background: '#F2F2F7', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
                                {p.image && <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.3, marginBottom: 4,
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.title}
                            </p>
                            <p style={{ fontSize: 14, fontWeight: 900, color: p.salePrice ? '#FF3B30' : '#1D1D1F' }}>
                                ₪{(p.salePrice || p.price)?.toLocaleString()}
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => removeFromCompare(p.id)}
                                style={{
                                    position: 'absolute', top: 0, right: 8,
                                    width: 22, height: 22, borderRadius: 99,
                                    background: '#FF3B30', color: '#fff', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <X size={12} strokeWidth={3} />
                            </motion.button>
                        </div>
                    ))}

                    {/* ── Add to cart row ── */}
                    <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#86868B', padding: '0 16px' }}>עגלה</span>
                    </div>
                    {selectedForCompare.map(p => (
                        <div key={p.id} style={{ padding: '0 8px 16px' }}>
                            <button onClick={() => navigate(`/catalog/${p.id}`)} style={{
                                width: '100%', height: 36, borderRadius: 10,
                                background: 'linear-gradient(135deg, #007AFF, #0063CC)',
                                color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                            }}>
                                פרטים
                            </button>
                        </div>
                    ))}

                    {/* ── Spec rows ── */}
                    {allSpecLabels.map((label, rowI) => (
                        <>
                            <div key={`label-${rowI}`} style={{
                                padding: '12px 16px',
                                background: rowI % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                                display: 'flex', alignItems: 'center',
                                borderTop: '0.5px solid rgba(0,0,0,0.06)',
                            }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#86868B', whiteSpace: 'nowrap' }}>{label}</span>
                            </div>
                            {selectedForCompare.map(p => {
                                const val = getSpec(p, label);
                                return (
                                    <div key={`${p.id}-${rowI}`} style={{
                                        padding: '12px 8px',
                                        background: rowI % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                                        borderTop: '0.5px solid rgba(0,0,0,0.06)',
                                        textAlign: 'center',
                                    }}>
                                        <span style={{ fontSize: 12, color: val === '—' ? '#C7C7CC' : '#1D1D1F', fontWeight: val === '—' ? 400 : 600 }}>
                                            {val}
                                        </span>
                                    </div>
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>
        </div>
    );
}
