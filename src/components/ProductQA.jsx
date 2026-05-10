import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSettings } from '../context/SettingsContext';

function StarRow({ count = 5 }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: count }).map((_, i) => (
                <svg key={i} className="w-3.5 h-3.5 text-[#FF9500]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
            ))}
        </div>
    );
}

export default function ProductQA({ productId }) {
    const { getSetting, isVisible } = useSettings();
    const visible = isVisible('vis_product_qa', true);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIdx, setOpenIdx] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ name: '', question: '' });
    const [error, setError] = useState('');

    // Load answered Q&As for this product
    useEffect(() => {
        if (!visible || !productId) return;
        let cancelled = false;
        (async () => {
            try {
                const q = query(
                    collection(db, 'product_qa'),
                    where('productId', '==', productId),
                    where('status', '==', 'answered'),
                    orderBy('createdAt', 'desc')
                );
                const snap = await getDocs(q);
                if (!cancelled) {
                    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (e) {
                console.warn('ProductQA load error', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [productId, visible]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.question.trim()) {
            setError(getSetting('qa_error_required', 'יש למלא שם ושאלה'));
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await addDoc(collection(db, 'product_qa'), {
                productId,
                question: form.question.trim(),
                askerName: form.name.trim(),
                status: 'pending',
                answer: null,
                answeredAt: null,
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            setForm({ name: '', question: '' });
        } catch (err) {
            setError(getSetting('qa_error_submit', 'שגיאה בשליחה, נסה שנית'));
        } finally {
            setSubmitting(false);
        }
    }, [form, productId, getSetting]);

    if (!visible) return null;

    const sectionTitle = getSetting('pd_qa_title', 'שאלות ותשובות');
    const submitTitle = getSetting('qa_form_title', 'יש לך שאלה?');
    const submitDesc = getSetting('qa_form_desc', 'שלח לנו שאלה ונענה בהקדם האפשרי');
    const namePlaceholder = getSetting('qa_name_placeholder', 'שמך');
    const questionPlaceholder = getSetting('qa_question_placeholder', 'מה תרצה לדעת על המוצר?');
    const submitLabel = getSetting('qa_submit_label', 'שלח שאלה');
    const submittedMsg = getSetting('qa_submitted_msg', 'תודה! השאלה שלך התקבלה ונענה בהקדם.');
    const emptyMsg = getSetting('qa_empty_msg', 'עדיין אין שאלות על מוצר זה. היה הראשון לשאול!');

    return (
        <section id="pd-qa" className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">

            {/* Section Header */}
            <div className="text-right mb-10">
                <div className="flex items-center gap-3 justify-end mb-4">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">{sectionTitle}</h3>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(0,122,255,0.10)', border: '1px solid rgba(0,122,255,0.18)' }}>
                        <svg className="w-6 h-6 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div className="h-1 w-12 bg-[#007AFF] rounded-full mr-0 ml-auto" />
            </div>

            {/* Q&A List */}
            {loading ? (
                <div className="space-y-3 mb-10">
                    {[1, 2].map(i => (
                        <div key={i} className="h-16 rounded-2xl animate-pulse"
                            style={{ background: 'rgba(0,0,0,0.04)' }} />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-10 mb-10">
                    <p className="text-[#86868B] font-medium">{emptyMsg}</p>
                </div>
            ) : (
                <div className="space-y-3 mb-12">
                    {items.map((item, i) => (
                        <motion.div key={item.id} className="rounded-2xl overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                            {/* Question row */}
                            <button
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="w-full flex items-start justify-between gap-4 p-5 text-right cursor-pointer"
                            >
                                <motion.svg className="w-5 h-5 text-[#007AFF] shrink-0 mt-0.5"
                                    animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.22 }}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </motion.svg>
                                <div className="flex-1 text-right">
                                    <p className="font-black text-[#1D1D1F] text-base leading-snug">{item.question}</p>
                                    <p className="text-[11px] text-[#AEAEB2] font-medium mt-1">{getSetting('qa_asked_by', 'נשאל על ידי')} {item.askerName}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                                    style={{ background: 'rgba(0,122,255,0.08)' }}>
                                    <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
                                    </svg>
                                </div>
                            </button>
                            {/* Answer */}
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
                                        <div className="px-5 pb-5 pt-1 text-right border-t border-black/[0.04]">
                                            <div className="flex items-center gap-2 mb-2 justify-end">
                                                <span className="text-[11px] font-black text-[#34C759] uppercase tracking-widest">
                                                    {getSetting('qa_team_label', 'צוות NextClass')}
                                                </span>
                                                <div className="w-5 h-5 rounded-full bg-[#34C759] flex items-center justify-center shrink-0">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="text-[#1D1D1F] text-[15px] leading-relaxed">{item.answer}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Submit Form */}
            <div className="rounded-[2.5rem] p-8 md:p-10"
                style={{
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(32px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
                    border: '1px solid rgba(255,255,255,0.82)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}>
                <div className="text-right mb-6">
                    <h4 className="text-xl font-black text-[#1D1D1F] mb-1">{submitTitle}</h4>
                    <p className="text-[#86868B] text-sm font-medium">{submitDesc}</p>
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div key="success"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 p-5 rounded-2xl justify-center"
                            style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)' }}>
                            <svg className="w-6 h-6 text-[#34C759] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="font-bold text-[#34C759] text-right">{submittedMsg}</p>
                        </motion.div>
                    ) : (
                        <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                            <input
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder={namePlaceholder}
                                className="w-full px-5 py-3.5 rounded-2xl text-right text-sm font-medium text-[#1D1D1F] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                            />
                            <textarea
                                value={form.question}
                                onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                                placeholder={questionPlaceholder}
                                rows={3}
                                className="w-full px-5 py-3.5 rounded-2xl text-right text-sm font-medium text-[#1D1D1F] placeholder-[#AEAEB2] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all resize-none"
                                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                            />
                            {error && <p className="text-[#FF3B30] text-sm font-bold text-right">{error}</p>}
                            <motion.button
                                type="submit"
                                disabled={submitting}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full py-4 rounded-full font-bold text-[15px] text-white flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0063CC 100%)', boxShadow: '0 8px 24px rgba(0,122,255,0.28)' }}
                            >
                                {submitting ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                                {submitting ? '...' : submitLabel}
                            </motion.button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
