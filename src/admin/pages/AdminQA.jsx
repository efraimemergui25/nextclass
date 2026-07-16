/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, query, orderBy, onSnapshot,
    doc, addDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminKPICard, AdminTabs, AdminEmpty } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { MessageSquare, Send, Trash2, CheckCircle, Clock, User, ExternalLink, HelpCircle, Percent, ChevronLeft, Package, Pencil, Plus, X } from 'lucide-react';
import { PALETTE, GLASS, RADIUS, SHADOW, SPRING, TAP, hexA, glow } from '../theme/tokens';

// ─── Q&A domain accent (restrained azure brand) ────────────────────────────────
const AMBER      = '#007AFF';
const AMBER_GRAD = 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)';
const AMBER_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.16) 0%, rgba(90,200,250,0.08) 100%)';
const glass      = { ...GLASS.base };

// ─── Babushka drill helpers ────────────────────────────────────────────────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#007AFF';
                return (
                <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-[14px] p-3 text-center"
                    style={{ background: `linear-gradient(150deg, ${hexA(c, 0.11)}, ${hexA(c, 0.05)})`, border: `1px solid ${hexA(c, 0.16)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px ${hexA(c, 0.10)}` }}>
                    <p className="font-black text-[15px] tracking-tight leading-none" style={{ background: `linear-gradient(135deg, ${c}, ${c}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                    <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                </motion.div>
                );
            })}
        </div>
    );
}
function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.66), rgba(255,255,255,0.42))', backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(20,40,80,0.04)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && (
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: hexA(tone, 0.1), border: `1px solid ${hexA(tone, 0.16)}` }}>
                    <ChevronLeft size={13} strokeWidth={2.75} style={{ color: tone }} />
                </span>
            )}
        </motion.div>
    );
}
const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
        {Icon && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#F0F3F8] to-[#E6EBF3] shadow-[0_4px_16px_rgba(20,40,80,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Icon size={24} className="text-[#B4BCC9]" strokeWidth={2} />
            </div>
        )}
        <p className="text-[#9AA3B2] text-[13px] font-semibold">{text}</p>
    </div>
);
function StatusPill({ answered }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
            style={answered
                ? { background: 'rgba(52,199,89,0.12)', color: '#1A8C40', border: '1px solid rgba(52,199,89,0.24)' }
                : { background: 'rgba(255,149,0,0.12)', color: '#B86A00', border: '1px solid rgba(255,149,0,0.24)' }}>
            {answered ? <CheckCircle size={10} /> : <HelpCircle size={10} />}
            {answered ? 'נענתה' : 'ממתינה'}
        </span>
    );
}

export default function AdminQA() {
    const [activeTab, setActiveTab] = useState('pending');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const navigate = useNavigate();
    const [answerTexts, setAnswerTexts] = useState({});

    // ── Manual create / edit modal ────────────────────────────────────────────
    // modal: null | { mode: 'create' } | { mode: 'edit', id }
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({ author: '', question: '', productId: '', answerText: '' });
    const [saving, setSaving] = useState(false);

    // ── Babushka drill stack ──────────────────────────────────────────────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };

    // Real-time listener on product_questions (same collection as public site)
    useEffect(() => {
        const q = query(collection(db, 'product_questions'), orderBy('timestamp', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setError(null);
            setLoading(false);
        }, (err) => {
            // H1: never spin forever on a read failure — clear loading and surface an error.
            console.error('[AdminQA] snapshot error:', err);
            setError(err);
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
        if (!await confirm({ message: 'למחוק שאלה זו לצמיתות?', danger: true })) return;
        try {
            await deleteDoc(doc(db, 'product_questions', id));
            showToast('השאלה נמחקה', 'success');
        } catch { showToast('שגיאה במחיקה', 'error'); }
    }, [showToast, confirm]);

    // ── Modal openers ──────────────────────────────────────────────────────────
    const openCreate = useCallback(() => {
        setForm({ author: '', question: '', productId: '', answerText: '' });
        setModal({ mode: 'create' });
    }, []);
    const openEdit = useCallback((item) => {
        setForm({
            author: item.author || '',
            question: item.question || '',
            productId: item.productId || '',
            answerText: item.answers?.length ? (item.answers[item.answers.length - 1].text || '') : '',
        });
        setModal({ mode: 'edit', id: item.id });
    }, []);
    const closeModal = useCallback(() => { if (!saving) setModal(null); }, [saving]);

    // Create a brand-new question document (mirrors the shape the list reads).
    const handleCreate = useCallback(async () => {
        const question = form.question.trim();
        if (!question) { showToast('יש להזין טקסט שאלה', 'error'); return; }
        setSaving(true);
        try {
            await addDoc(collection(db, 'product_questions'), {
                author: form.author.trim() || 'אנונימי',
                question,
                productId: form.productId.trim(),
                answers: [],
                timestamp: serverTimestamp(),
            });
            showToast('השאלה נוספה בהצלחה', 'success');
            setModal(null);
        } catch { showToast('שגיאה בשמירה', 'error'); }
        finally { setSaving(false); }
    }, [form, showToast]);

    // Edit an existing question's text/author/product + optionally its latest answer.
    const handleEditSave = useCallback(async () => {
        if (!modal?.id) return;
        const question = form.question.trim();
        if (!question) { showToast('יש להזין טקסט שאלה', 'error'); return; }
        const item = questions.find(x => x.id === modal.id);
        setSaving(true);
        try {
            const patch = {
                question,
                author: form.author.trim() || 'אנונימי',
                productId: form.productId.trim(),
            };
            // If this question already has answers, let the admin edit the latest one.
            if (item?.answers?.length) {
                const next = item.answers.slice();
                next[next.length - 1] = { ...next[next.length - 1], text: form.answerText.trim() };
                patch.answers = next;
            }
            await updateDoc(doc(db, 'product_questions', modal.id), patch);
            showToast('השאלה עודכנה', 'success');
            setModal(null);
        } catch { showToast('שגיאה בשמירה', 'error'); }
        finally { setSaving(false); }
    }, [form, modal, questions, showToast]);

    return (
        <div dir="rtl" className="space-y-6">
            {/* Page header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(AMBER, 0.10), border: `1px solid ${hexA(AMBER, 0.18)}`, boxShadow: SHADOW.specular }}>
                    <MessageSquare size={22} color={AMBER} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>שאלות ותשובות</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>שאלות שנשאלו על דפי מוצרים — ניהול ומתן תשובות</p>
                </div>
                <motion.button
                    whileHover={{ y: -1, boxShadow: `0 8px 22px ${hexA(AMBER, 0.42)}` }}
                    whileTap={TAP}
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-2xl font-bold text-white cursor-pointer shrink-0"
                    style={{ padding: '12px 20px', fontSize: 14, background: AMBER_GRAD, boxShadow: `0 4px 16px ${hexA(AMBER, 0.32)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                    <Plus size={17} strokeWidth={2.6} />
                    שאלה חדשה
                </motion.button>
            </div>

            {/* KPI band — total · pending · answered · response rate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                <AdminKPICard title="סך שאלות" value={questions.length} subtitle="על דפי מוצרים" accent={AMBER} delay={0}
                    icon={<MessageSquare size={20} color={AMBER} />} loading={loading} onClick={() => openDrill({ type: 'kpi-total' })} />
                <AdminKPICard title="ממתינות" value={pending.length} subtitle="דורשות מענה" accent={PALETTE.orange} delay={0.05}
                    icon={<HelpCircle size={20} color={PALETTE.orange} />} loading={loading} onClick={() => openDrill({ type: 'kpi-pending' })} />
                <AdminKPICard title="נענו" value={answered.length} subtitle="קיבלו תשובה" accent={PALETTE.green} delay={0.1}
                    icon={<CheckCircle size={20} color={PALETTE.green} />} loading={loading} onClick={() => openDrill({ type: 'kpi-answered' })} />
                <AdminKPICard title="שיעור מענה" value={`${responseRate}%`} subtitle="מכלל השאלות" accent={PALETTE.azure} delay={0.15}
                    icon={<Percent size={20} color={PALETTE.azure} />} loading={loading} onClick={() => openDrill({ type: 'kpi-rate' })} />
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
            ) : error ? (
                <div className="rounded-[24px] overflow-hidden" style={glass}>
                    <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: hexA('#FF3B30', 0.1), border: `1px solid ${hexA('#FF3B30', 0.24)}` }}>
                            <MessageSquare size={26} style={{ color: '#FF3B30' }} />
                        </div>
                        <div>
                            <p className="text-[15px] font-black text-[#1D1D1F]">שגיאה בטעינת השאלות</p>
                            <p className="text-[12px] text-[#86868B] font-medium mt-1 max-w-[420px]">
                                לא ניתן לקרוא את השאלות מ-Firestore. בדוק את החיבור וההרשאות ונסה לרענן.
                            </p>
                        </div>
                    </div>
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
                                        <button onClick={() => openEdit(item)}
                                            title="ערוך שאלה"
                                            className="p-2 rounded-xl hover:bg-[#007AFF]/10 text-[#007AFF]/60 hover:text-[#007AFF] transition-all cursor-pointer">
                                            <Pencil size={15} />
                                        </button>
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
                                                style={{ background: `linear-gradient(135deg, ${hexA(AMBER, 0.16)}, ${hexA(AMBER, 0.07)})`, color: '#007AFF', border: `1px solid ${hexA(AMBER, 0.18)}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }}>
                                                {item.productId}
                                                <ExternalLink size={9} />
                                            </a>
                                        </div>
                                        <p role="button" tabIndex={0}
                                            onClick={() => openDrill({ type: 'question', id: item.id })}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'question', id: item.id }); } }}
                                            className="font-black text-[#1D1D1F] text-[17px] leading-snug cursor-pointer hover:text-[#007AFF] transition-colors focus:outline-none">{item.question}</p>
                                    </div>
                                </div>

                                {/* Existing answers */}
                                {item.answers?.length > 0 && (
                                    <div className="space-y-3 mb-4">
                                        {item.answers.map((ans, i) => (
                                            <div key={i} className="p-4 rounded-2xl text-right"
                                                style={{ background: 'linear-gradient(150deg, rgba(52,199,89,0.11), rgba(52,199,89,0.045))', border: '1px solid rgba(52,199,89,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 10px rgba(52,199,89,0.07)' }}>
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

            {/* ── Babushka Drill Drawer — nested glass detail ─────────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const qRow = (item, i) => {
                    const isAns = item.answers?.length > 0;
                    return (
                        <DrillRow key={item.id} delay={i * 0.03} tone={isAns ? '#34C759' : '#FF9500'}
                            onClick={() => pushDrill({ type: 'question', id: item.id })}
                            leading={(() => { const tc = isAns ? '#34C759' : '#FF9500'; return (
                            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                                style={{ background: `linear-gradient(140deg, ${hexA(tc, 0.22)}, ${hexA(tc, 0.09)})`, border: `1px solid ${hexA(tc, 0.2)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 9px ${hexA(tc, 0.16)}` }}>
                                {isAns ? <CheckCircle size={14} className="text-[#34C759]" /> : <HelpCircle size={14} className="text-[#FF9500]" />}</div>
                            ); })()}
                            title={item.question}
                            subtitle={`${item.author || 'אנונימי'} · ${item.productId || '—'}`}
                            trailing={<StatusPill answered={isAns} />}
                        />
                    );
                };
                const qList = (arr) => arr.length === 0
                    ? <DrillEmpty icon={MessageSquare} text="אין שאלות להצגה" />
                    : <div className="space-y-2">{arr.map(qRow)}</div>;

                let title = '', subtitle = '', icon = null, accent = AMBER, footer = null, body = null;

                if (shown.type === 'kpi-total') {
                    title = 'סך שאלות'; subtitle = `${questions.length} שאלות על דפי מוצרים`;
                    icon = <MessageSquare size={17} color={AMBER} />;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סך הכל', value: questions.length, color: AMBER },
                                { label: 'ממתינות', value: pending.length, color: PALETTE.orange },
                                { label: 'נענו', value: answered.length, color: PALETTE.green },
                            ]} />
                            {qList(questions)}
                        </div>
                    );
                } else if (shown.type === 'kpi-pending') {
                    title = 'שאלות ממתינות'; subtitle = `${pending.length} דורשות מענה`; accent = PALETTE.orange;
                    icon = <HelpCircle size={17} color={PALETTE.orange} />;
                    body = qList(pending);
                } else if (shown.type === 'kpi-answered') {
                    title = 'שאלות שנענו'; subtitle = `${answered.length} קיבלו תשובה`; accent = PALETTE.green;
                    icon = <CheckCircle size={17} color={PALETTE.green} />;
                    body = qList(answered);
                } else if (shown.type === 'kpi-rate') {
                    title = 'שיעור מענה'; subtitle = `${responseRate}% מכלל השאלות`; accent = PALETTE.azure;
                    icon = <Percent size={17} color={PALETTE.azure} />;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'שיעור מענה', value: `${responseRate}%`, color: PALETTE.azure },
                                { label: 'נענו', value: answered.length, color: PALETTE.green },
                                { label: 'ממתינות', value: pending.length, color: PALETTE.orange },
                            ]} />
                            {pending.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">ממתינות לתשובה — לחץ למענה</p>
                                    {qList(pending)}
                                </div>
                            )}
                        </div>
                    );
                } else if (shown.type === 'question') {
                    const q = questions.find(x => x.id === shown.id);
                    if (!q) {
                        title = 'שאלה'; icon = <MessageSquare size={17} color={AMBER} />;
                        body = <DrillEmpty icon={MessageSquare} text="השאלה נמחקה או אינה זמינה" />;
                    } else {
                        const isAns = q.answers?.length > 0;
                        accent = isAns ? '#34C759' : '#FF9500';
                        title = q.question; subtitle = 'שאלה על דף מוצר';
                        icon = <MessageSquare size={17} color={accent} />;
                        if (q.productId) footer = { label: `מעבר לדף המוצר ${q.productId}`, onClick: () => drillTo(`/catalog/${q.productId}`) };
                        body = (
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                    <StatusPill answered={isAns} />
                                    <span className="text-[11px] text-[#86868B] font-medium flex items-center gap-1"><User size={11} />{q.author || 'אנונימי'}</span>
                                    <span className="text-[11px] text-[#AEAEB2] font-medium flex items-center gap-1"><Clock size={11} />{q.timestamp?.toDate?.().toLocaleDateString('he-IL') ?? '—'}</span>
                                    {q.productId && (
                                        <span className="text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `linear-gradient(135deg, ${hexA(AMBER, 0.16)}, ${hexA(AMBER, 0.07)})`, color: '#007AFF', border: `1px solid ${hexA(AMBER, 0.18)}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)' }}>
                                            <Package size={11} />{q.productId}</span>
                                    )}
                                </div>
                                <div className="p-4 rounded-[16px] text-right" style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.7), rgba(255,255,255,0.44))', backdropFilter: 'blur(14px) saturate(1.4)', WebkitBackdropFilter: 'blur(14px) saturate(1.4)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 12px rgba(20,40,80,0.05)' }}>
                                    <p className="font-black text-[#1D1D1F] text-[16px] leading-snug">{q.question}</p>
                                </div>

                                {isAns && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">תשובות שפורסמו</p>
                                        {q.answers.map((ans, i) => (
                                            <div key={i} className="p-4 rounded-2xl text-right"
                                                style={{ background: 'linear-gradient(150deg, rgba(52,199,89,0.11), rgba(52,199,89,0.045))', border: '1px solid rgba(52,199,89,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 10px rgba(52,199,89,0.07)' }}>
                                                <div className="flex items-center gap-1 justify-end mb-1">
                                                    <span className="text-[10px] font-black text-[#34C759]">תשובת NextClass</span>
                                                    <CheckCircle size={11} className="text-[#34C759]" />
                                                </div>
                                                <p className="text-[#1D1D1F] text-sm font-medium leading-relaxed">{ans.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Answer input (same action as the page list) */}
                                <div className="space-y-2" dir="rtl">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">{isAns ? 'הוסף תשובה נוספת' : 'כתוב תשובה'}</p>
                                    <textarea
                                        value={answerTexts[q.id] ?? ''}
                                        onChange={e => setAnswerTexts(p => ({ ...p, [q.id]: e.target.value }))}
                                        placeholder={isAns ? 'הוסף תשובה נוספת...' : 'כתוב תשובה...'}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-right resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                        style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                    />
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={TAP}
                                            onClick={() => handleAnswer(q.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white cursor-pointer"
                                            style={{ background: AMBER_GRAD, boxShadow: `0 4px 16px ${hexA(AMBER, 0.32)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                                            <Send size={15} /> פרסם תשובה
                                        </motion.button>
                                        <button onClick={() => { handleDelete(q.id); closeDrill(); }}
                                            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm cursor-pointer"
                                            style={{ background: 'rgba(255,59,48,0.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.22)' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                }

                return (
                    <DashDrillView
                        open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={accent}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${shown.type}:${shown.id ?? ''}:${drillStack.length}`}
                    >{body}</DashDrillView>
                );
            })()}

            {/* ── Create / Edit modal — lightweight glass overlay ──────────────── */}
            <AnimatePresence>
                {modal && (() => {
                    const isEdit = modal.mode === 'edit';
                    const editItem = isEdit ? questions.find(x => x.id === modal.id) : null;
                    const hasAnswers = !!editItem?.answers?.length;
                    const onSubmit = isEdit ? handleEditSave : handleCreate;
                    return (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                            style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                            <motion.div dir="rtl"
                                initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={SPRING.soft}
                                onClick={e => e.stopPropagation()}
                                className="w-full max-w-[480px] p-6"
                                style={{ ...glass, borderRadius: RADIUS.panel }}>
                                {/* Modal header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{ background: hexA(AMBER, 0.10), border: `1px solid ${hexA(AMBER, 0.18)}` }}>
                                        {isEdit ? <Pencil size={19} color={AMBER} /> : <Plus size={20} color={AMBER} />}
                                    </div>
                                    <div className="flex-1 text-right">
                                        <h2 className="text-[19px] font-black text-[#1D1D1F] leading-tight">{isEdit ? 'עריכת שאלה' : 'שאלה חדשה'}</h2>
                                        <p className="text-[12px] text-[#86868B] font-medium mt-0.5">{isEdit ? 'עדכון פרטי השאלה והתשובה' : 'הוספת שאלה ידנית לדף מוצר'}</p>
                                    </div>
                                    <button onClick={closeModal}
                                        className="p-2 rounded-xl text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-black/5 transition-all cursor-pointer">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Fields */}
                                <div className="space-y-3.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-[#AEAEB2] uppercase tracking-widest">שם השואל</label>
                                        <input
                                            value={form.author}
                                            onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                                            placeholder="אנונימי"
                                            className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-right focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-[#AEAEB2] uppercase tracking-widest">מזהה מוצר</label>
                                        <input
                                            value={form.productId}
                                            onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                                            placeholder="לדוגמה: SKU-1234"
                                            className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-right focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-[#AEAEB2] uppercase tracking-widest">שאלה *</label>
                                        <textarea
                                            value={form.question}
                                            onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                                            placeholder="נוסח השאלה..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-right resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                                            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}
                                        />
                                    </div>
                                    {isEdit && hasAnswers && (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-[#AEAEB2] uppercase tracking-widest">תשובה אחרונה</label>
                                            <textarea
                                                value={form.answerText}
                                                onChange={e => setForm(p => ({ ...p, answerText: e.target.value }))}
                                                placeholder="עריכת התשובה האחרונה שפורסמה..."
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-right resize-none focus:outline-none focus:ring-2 focus:ring-[#34C759]/30"
                                                style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2.5 mt-6">
                                    <motion.button
                                        whileHover={{ y: -1, boxShadow: `0 8px 22px ${hexA(AMBER, 0.42)}` }}
                                        whileTap={TAP}
                                        onClick={onSubmit}
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white cursor-pointer"
                                        style={{ background: AMBER_GRAD, opacity: saving ? 0.6 : 1, boxShadow: `0 4px 16px ${hexA(AMBER, 0.32)}, inset 0 1px 0 rgba(255,255,255,0.3)` }}>
                                        {isEdit ? <CheckCircle size={15} /> : <Plus size={16} strokeWidth={2.6} />}
                                        {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף שאלה'}
                                    </motion.button>
                                    <button onClick={closeModal} disabled={saving}
                                        className="px-5 py-3 rounded-2xl font-bold text-sm cursor-pointer"
                                        style={{ background: 'rgba(0,0,0,0.05)', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.08)' }}>
                                        ביטול
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
