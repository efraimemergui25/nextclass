import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';

export default function AdminQA() {
    const [activeTab, setActiveTab] = useState('pending');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useAdminToast();
    const [answerTexts, setAnswerTexts] = useState({});

    useEffect(() => {
        const q = query(collection(db, 'product_qa'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snap) => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleAnswer = useCallback(async (id) => {
        const answer = answerTexts[id];
        if (!answer?.trim()) {
            showToast('יש להזין תשובה', 'error');
            return;
        }

        try {
            await updateDoc(doc(db, 'product_qa', id), {
                answer: answer.trim(),
                status: 'answered',
                answeredAt: serverTimestamp()
            });
            showToast('התשובה פורסמה בהצלחה', 'success');
            setAnswerTexts(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        } catch (e) {
            showToast('שגיאה בעדכון התשובה', 'error');
        }
    }, [answerTexts, showToast]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק שאלה זו?')) return;
        try {
            await deleteDoc(doc(db, 'product_qa', id));
            showToast('השאלה נמחקה', 'success');
        } catch (e) {
            showToast('שגיאה במחיקה', 'error');
        }
    }, [showToast]);

    const filtered = questions.filter(q => q.status === activeTab);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#86868B]">ניהול תוכן</span>
                    </div>
                    <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tight">שאלות ותשובות</h1>
                    <p className="text-[#86868B] font-medium mt-1">נהל את השאלות של הלקוחות על המוצרים</p>
                </div>

                <div className="flex p-1 rounded-2xl bg-black/04 backdrop-blur-md border border-black/04">
                    {['pending', 'answered'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === tab ? 'text-[#007AFF]' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}
                        >
                            {activeTab === tab && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-black/04" />
                            )}
                            <span className="relative z-10">
                                {tab === 'pending' ? 'ממתינות' : 'נענו'}
                                {tab === 'pending' && questions.filter(q => q.status === 'pending').length > 0 && (
                                    <span className="mr-2 px-1.5 py-0.5 rounded-md bg-[#FF3B30] text-white text-[10px] font-black">
                                        {questions.filter(q => q.status === 'pending').length}
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 rounded-3xl animate-pulse bg-white/50 border border-black/04" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center rounded-[2.5rem] bg-white/40 border border-dashed border-black/10">
                    <p className="text-[#86868B] font-medium">אין שאלות {activeTab === 'pending' ? 'ממתינות' : 'שנענו'} כרגע</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((q) => (
                            <motion.div
                                key={q.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group p-6 rounded-[2.5rem] bg-white/70 backdrop-blur-md border border-white/80 shadow-sm hover:shadow-xl hover:shadow-black/03 transition-all"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-2xl bg-[#007AFF]/08 flex items-center justify-center shrink-0 border border-[#007AFF]/10">
                                                <svg className="w-5 h-5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[#1D1D1F] text-lg leading-tight">{q.question}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-bold text-[#86868B]">{q.askerName}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#AEAEB2]" />
                                                    <span className="text-[11px] font-bold text-[#AEAEB2] uppercase">{q.productId}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#AEAEB2]" />
                                                    <span className="text-[11px] font-bold text-[#AEAEB2]">{q.createdAt?.toDate().toLocaleDateString('he-IL')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTab === 'pending' ? (
                                            <div className="mt-4 space-y-3">
                                                <textarea
                                                    value={answerTexts[q.id] || ''}
                                                    onChange={(e) => setAnswerTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                    placeholder="הזן תשובה..."
                                                    className="w-full p-4 rounded-2xl bg-black/04 border border-black/05 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all resize-none text-[15px] font-medium"
                                                    rows={3}
                                                />
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleDelete(q.id)}
                                                        className="px-5 py-2 rounded-xl text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/08 transition-all"
                                                    >
                                                        מחיקה
                                                    </button>
                                                    <button
                                                        onClick={() => handleAnswer(q.id)}
                                                        className="px-6 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] font-bold shadow-lg shadow-[#007AFF]/20 hover:scale-[1.02] transition-all"
                                                    >
                                                        פרסם תשובה
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 p-5 rounded-2xl bg-[#34C759]/05 border border-[#34C759]/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <svg className="w-4 h-4 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span className="text-[11px] font-black text-[#34C759] uppercase tracking-wider">תשובה שפורסמה</span>
                                                </div>
                                                <p className="text-[#1D1D1F] text-[15px] leading-relaxed font-medium">{q.answer}</p>
                                                <div className="mt-4 flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleDelete(q.id)}
                                                        className="px-5 py-2 rounded-xl text-[13px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/08 transition-all"
                                                    >
                                                        מחיקה
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setAnswerTexts(prev => ({ ...prev, [q.id]: q.answer }));
                                                            setActiveTab('pending');
                                                        }}
                                                        className="px-5 py-2 rounded-xl text-[13px] font-bold text-[#007AFF] hover:bg-[#007AFF]/08 transition-all"
                                                    >
                                                        עריכה
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
