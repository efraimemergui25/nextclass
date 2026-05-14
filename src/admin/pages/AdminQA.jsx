import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, updateDoc, deleteDoc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import { MessageSquare, Send, Trash2, CheckCircle, Clock, User } from 'lucide-react';

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
        <div className="space-y-8">
            <AdminSectionHeader
                title="שאלות ותשובות"
                subtitle="שאלות שנשאלו על דפי מוצרים — ניהול ומתן תשובות"
                action={
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 rounded-full text-sm font-bold"
                            style={{ background: 'rgba(255,149,0,0.10)', color: '#FF9500' }}>
                            {pending.length} ממתינות
                        </div>
                        <div className="px-4 py-2 rounded-full text-sm font-bold"
                            style={{ background: 'rgba(52,199,89,0.10)', color: '#34C759' }}>
                            {answered.length} נענו
                        </div>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl w-fit"
                style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.06)' }}>
                {[
                    { id: 'pending',  label: 'ממתינות לתשובה', count: pending.length },
                    { id: 'answered', label: 'נענו',             count: answered.length },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === tab.id
                                ? 'bg-white text-[#1D1D1F] shadow-sm'
                                : 'text-[#86868B] hover:text-[#1D1D1F]'
                        }`}>
                        {tab.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            activeTab === tab.id ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-gray-100 text-gray-400'
                        }`}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-4 border-gray-100 border-t-[#007AFF] rounded-full animate-spin" />
                </div>
            ) : displayed.length === 0 ? (
                <div className="text-center py-24 rounded-[2rem]"
                    style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <MessageSquare size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-[#86868B] font-bold">
                        {activeTab === 'pending' ? 'אין שאלות ממתינות' : 'אין שאלות שנענו עדיין'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {displayed.map((item) => (
                            <motion.div key={item.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="rounded-[1.5rem] p-6"
                                style={{
                                    background: 'rgba(255,255,255,0.88)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                                }}>
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
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                                style={{ background: 'rgba(0,122,255,0.08)', color: '#007AFF' }}>
                                                {item.productId}
                                            </span>
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
                                                    <span className="text-[10px] font-black text-[#34C759] uppercase tracking-widest">
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
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAnswer(item.id)}
                                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white cursor-pointer shrink-0"
                                        style={{ background: 'linear-gradient(135deg,#007AFF,#0063CC)', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>
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
