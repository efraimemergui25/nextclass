/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminKPICard, AdminTabs, AdminEmpty } from '../components/AdminComponents';
import { MessageSquare, Send, Trash2, CheckCircle, Clock, User, ExternalLink, HelpCircle, Percent } from 'lucide-react';
import { PALETTE, GLASS, RADIUS, SHADOW, SPRING, TAP, hexA, glow } from '../theme/tokens';

// ─── Q&A domain accent (Heaven, amber) ────────────────────────────────────────
const AMBER      = '#FFB340';
const AMBER_GRAD = 'linear-gradient(135deg, #FFCB66 0%, #FFB340 100%)';
const AMBER_SOFT = 'linear-gradient(135deg, rgba(255,179,64,0.16) 0%, rgba(255,203,102,0.08) 100%)';
const glass      = { ...GLASS.base };

export default function AdminQA() {
    const [activeTab, setActiveTab] = useState('pending');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useAdminToast();
    const [answerTexts, setAnswerTexts] = useState({});

    // Real-time listener on product_questions (same collection as public site)
    useEffect(() => {
        const q = query(collection(db, 'product_questions'), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsub;
    }, []);

    const pending   = questions.filter(q => !q.answers?.length);
    const answered  = questions.filter(q => q.answers?.length > 0);
    const displayed = activeTab === 'pending' ? pending : answered;
    const responseRate = questions.length ? Math.round((answered.length / questions.length) * 100) : 0;

    const handleAnswer = useCallback(async (id) => {
        const text = answerTexts[id]?.trim();
        if (!text) { showToast('יש להזין תשובה', 'error'); return; }
        try {
            await updateDoc(doc(db, 'product_questions', id), {
                answers: arrayUnion({ text, timestamp: new Date().toISOString() }),
                answeredAt: serverTimestamp(),
            });
            setAnswerTexts(p => ({ ...p, [id]: '' }));
            showToast('התשובה פורסמה בהצלחה', 'success');
        } catch { showToast('שגיאה בשמירה', 'error'); }
    }, [answerTexts, showToast]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('למחוק שאלה זו לצמיתות?')) return;
        try {
            await deleteDoc(doc(db, 'product_questions', id));
            showToast('השאלה נמחקה', 'success');
        } catch { showToast('שגיאה במחיקה', 'error'); }
    }, [showToast]);

    return (
        <div dir="rtl" className="space-y-6">
            {/* Page header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: AMBER_SOFT, border: `1px solid ${hexA(AMBER, 0.24)}`, boxShadow: `${glow(AMBER, 0.18, 20)}, ${SHADOW.specular}` }}>
                    <MessageSquare size={22} color={AMBER} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>שאלות ותשובות</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>שאלות שנשאלו על דפי מוצרים — ניהול ומתן תשובות</p>
                </div>
            </div>

            {/* KPI band — total · pending · answered · response rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                <AdminKPICard title="סך שאלות" value={questions.length} subtitle="על דפי מוצרים" accent={AMBER} delay={0}
                    icon={<MessageSquare size={20} color={AMBER} />} loading={loading} />
                <AdminKPICard title="ממתינות" value={pending.length} subtitle="דורשות מענה" accent={PALETTE.orange} delay={0.05}
                    icon={<HelpCircle size={20} color={PALETTE.orange} />} loading={loading} />
                <AdminKPICard title="נענו" value={answered.length} subtitle="קיבלו תשובה" accent={PALETTE.green} delay={0.1}
                    icon={<CheckCircle size={20} color={PALETTE.green} />} loading={loading} />
                <AdminKPICard title="שיעור מענה" value={`${responseRate}%`} subtitle="מכלל השאלות" accent={PALETTE.azure} delay={0.15}
                    icon={<Percent size={20} color={PALETTE.azure} />} loading={loading} />
            </div>

            {/* Tabs */}
            <AdminTabs
                tabs={[
                    { id: 'pending',  label: 'ממתינות לתשובה', count: pending.length },
                    { id: 'answered', label: 'נענו',             count: answered.length },
                ]}
                active={activeTab} onChange={setActiveTab} id="qa-tabs"
            />

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 rounded-full animate-spin"
                        style={{ border: `4px solid ${hexA(AMBER, 0.16)}`, borderTopColor: AMBER }} />
                </div>
            ) : displayed.length === 0 ? (
                <div className="rounded-[24px] overflow-hidden" style={glass}>
                    <AdminEmpty
                        icon="empty"
                        title={activeTab === 'pending' ? 'אין שאלות ממתינות' : 'אין שאלות שנענו עדיין'}
                        subtitle={activeTab === 'pending' ? 'כל השאלות קיבלו מענה — כל הכבוד' : 'תשובות שתפרסם יופיעו כאן'}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {displayed.map((item) => (
                            <motion.div key={item.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                whileHover={{ y: -2 }}
                                transition={SPRING.soft}
                                className="p-6"
                                style={{ ...glass, borderRadius: RADIUS.panel }}>
                                {/* Question header */}
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-xs text-[#86868B] font-medium shrink-0">
                                        <button onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-xl hover:bg-[#FF3B30]/10 text-[#FF3B30]/60 hover:text-[#FF3B30] transition-all cursor-pointer">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="flex items-center gap-2 justify-end mb-2">
                                            <span className="text-[11px] text-[#AEAEB2] font-medium flex items-center gap-1">
                                                <Clock size={10} />
                                                {item.timestamp?.toDate?.().toLocaleDateString('he-IL') ?? '—'}
                                            </span>
                                            <span className="text-[11px] text-[#86868B] font-medium flex items-center gap-1">
                                                <User size={10} />
                                                {item.author}
                                            </span>
                                            <a
                                                href={`/catalog/${item.productId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:opacity-70 cursor-pointer"
                                                style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF' }}>
                                                {item.productId}
                                                <ExternalLink size={9} />
                                            </a>
                                        </div>
                                        <p className="font-black text-[#1D1D1F] text-[17px] leading-snug">{item.question}</p>
                                    </div>
                                </div>

                                {/* Existing answers */}
                                {item.answers?.length > 0 && (
                                    <div className="space-y-3 mb-4">
                                        {item.answers.map((ans, i) => (
                                            <div key={i} className="p-4 rounded-2xl text-right"
                                                style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}>
                                                <div className="flex items-center gap-1 justify-end mb-1">
                                                    <span className="text-[10px] font-black text-[#34C759]">
                                                        תשובת NextClass
                                                    </span>
                                                    <CheckCircle size={11} className="text-[#34C759]" />
                                                </div>
                                                <p className="text-[#1D1D1F] text-sm font-medium leading-relaxed">{ans.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Answer input (always available) */}
                                <div className="flex gap-3 items-end" dir="rtl">
                                    <textarea
                                        value={answerTexts[item.id] ?? ''}
                                        onChange={e => setAnswerTexts(p => ({ ...p, [item.id]: e.target.value }))}
                                        placeholder={item.answers?.length ? 'הוסף תשובה נוספת...' : 'כתוב תשובה...'}
                                        rows={2}
                                        className="flex-1 px-4 py-3 rounded-2xl text-sm font-medium text-right resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                    />
                                    <motion.button
                                        whileHover={{ y: -1, boxShadow: `0 8px 22px ${hexA(AMBER, 0.42)}` }}
                                        whileTap={TAP}
                                        onClick={() => handleAnswer(item.id)}
                                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white cursor-pointer shrink-0"
                                        style={{ background: AMBER_GRAD, boxShadow: `0 4px 16px ${hexA(AMBER, 0.32)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                                        <Send size={15} />
                                        פרסם
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
