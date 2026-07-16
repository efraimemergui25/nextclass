/* eslint-disable */
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';
import { GLASS, RADIUS, SHADOW, SPRING, hexA, glow, PALETTE } from '../theme/tokens';

// ─── Page meta ───────────────────────────────────────────────────────────────
const PAGE_META = {
  '/admin/dashboard':       { label: 'לוח בקרה',     icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  '/admin/orders':          { label: 'מרכז ההזמנות', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  '/admin/order-hub':       { label: 'מרכז ההזמנות', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  '/admin/products':        { label: 'מוצרים',        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  '/admin/inventory':       { label: 'מלאי',           icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8' },
  '/admin/customers':       { label: 'פניות לקוחות',  icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z' },
  '/admin/users':           { label: 'משתמשים',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0' },
  '/admin/analytics':       { label: 'אנליטיקס',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  '/admin/marketing':       { label: 'שיווק',          icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  '/admin/content':         { label: 'תוכן',           icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  '/admin/suppliers':       { label: 'ספקים',          icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  '/admin/fulfillment':     { label: 'משלוחים',       icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
  '/admin/settings':        { label: 'הגדרות',         icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  '/admin/security':        { label: 'אבטחה',          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
};

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = time.getHours().toString().padStart(2,'0');
  const m = time.getMinutes().toString().padStart(2,'0');
  const s = time.getSeconds().toString().padStart(2,'0');
  return (
    <span className="tabular-nums font-black text-[13px]" style={{ color: '#1D1D1F', letterSpacing: '-0.02em' }}>
      {h}<span style={{ opacity: 0.35, animation: 'topbar-blink 1s step-start infinite' }}>:</span>{m}
      <span className="text-[10px] font-bold ml-0.5" style={{ color: '#AEAEB2' }}>:{s}</span>
    </span>
  );
}

// ─── Command Palette (Search + Action Mode) ───────────────────────────────────
function SearchModal({ onClose }) {
  const navigate = useNavigate();
  const { products, orders, contacts, quotes, updateQuoteStatus } = useAdminData();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Detect action mode: query starts with ">"
  const isActionMode = query.startsWith('>');
  const actionQuery = isActionMode ? query.slice(1).trim().toLowerCase() : '';

  // ── Action commands ────────────────────────────────────────────────────
  const ACTIONS = useMemo(() => [
    {
      label: 'עבור לדשבורד', sub: 'ניווט', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      color: '#007AFF', tags: ['dashboard','לוח','ניווט'],
      action: () => { navigate('/admin/dashboard'); onClose(); },
    },
    {
      label: 'עבור להצעות מחיר', sub: 'ניווט', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: '#FF9500', tags: ['orders','הצעות','quotes','ניווט'],
      action: () => { navigate('/admin/orders'); onClose(); },
    },
    {
      label: 'עבור לאנליטיקס', sub: 'ניווט', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: '#5AC8FA', tags: ['analytics','אנליטיקס','דוחות','ניווט'],
      action: () => { navigate('/admin/analytics'); onClose(); },
    },
    {
      label: 'עבור למלאי', sub: 'ניווט', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8',
      color: '#34C759', tags: ['inventory','מלאי','ניווט'],
      action: () => { navigate('/admin/inventory'); onClose(); },
    },
    {
      label: 'עבור לספקים', sub: 'ניווט', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      color: '#0A84FF', tags: ['suppliers','ספקים','ניווט'],
      action: () => { navigate('/admin/suppliers'); onClose(); },
    },
    {
      label: 'ייצא הצעות CSV', sub: 'פעולה', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      color: '#34C759', tags: ['export','ייצא','csv','הורד'],
      action: () => {
        const rows = [['ID','לקוח','סטטוס','סכום','תאריך']];
        quotes.forEach(q => {
          const total = (q.items || []).reduce((s, i) => s + ((Number(i.salePrice)||Number(i.price)||0) * (Number(i.qty)||1)), 0) || q.subtotal || 0;
          rows.push([q.id, q.contactName||q.institution||'', q.status||'', total, new Date(q.dateTs||0).toLocaleDateString('he-IL')]);
        });
        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
        a.download = `quotes_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        onClose();
      },
    },
    {
      label: 'סמן הצעות חדשות כ"ביצירת קשר"', sub: 'פעולה קבוצתית', icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      color: '#FF9500', tags: ['bulk','קבוצתי','status','סטטוס','ביצירת קשר'],
      action: async () => {
        const newQuotes = quotes.filter(q => q.status === 'חדש');
        await Promise.all(newQuotes.map(q => updateQuoteStatus(q.id, 'ביצירת קשר')));
        onClose();
      },
    },
    {
      label: 'פתח הגדרות', sub: 'ניווט', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      color: '#AEAEB2', tags: ['settings','הגדרות','ניווט'],
      action: () => { navigate('/admin/settings'); onClose(); },
    },
  ], [navigate, quotes, updateQuoteStatus, onClose]);

  const actionResults = useMemo(() => {
    if (!isActionMode) return ACTIONS;
    if (!actionQuery) return ACTIONS;
    return ACTIONS.filter(a =>
      a.label.toLowerCase().includes(actionQuery) ||
      a.tags.some(t => t.includes(actionQuery))
    );
  }, [isActionMode, actionQuery, ACTIONS]);

  // ── Search results ─────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!query.trim() || isActionMode) return [];
    const q = query.toLowerCase();
    const r = [];
    products.filter(p => p.title?.toLowerCase().includes(q) || p.category?.includes(q))
      .slice(0, 4).forEach(p => r.push({ type: 'product', label: p.title, sub: p.category, action: () => { navigate('/admin/products'); onClose(); } }));
    orders.filter(o => o.customer?.includes(q) || o.id?.includes(q) || o.product?.includes(q))
      .slice(0, 3).forEach(o => r.push({ type: 'order', label: o.customer, sub: `${o.id} · ₪${o.total?.toLocaleString()}`, action: () => { navigate('/admin/orders'); onClose(); } }));
    contacts.filter(c => c.name?.includes(q) || c.email?.includes(q) || c.subject?.includes(q))
      .slice(0, 2).forEach(c => r.push({ type: 'contact', label: c.name, sub: c.subject, action: () => { navigate('/admin/customers'); onClose(); } }));
    return r;
  }, [query, isActionMode, products, orders, contacts, navigate, onClose]);

  const displayList = isActionMode ? actionResults : results;
  useEffect(() => { setActive(0); }, [displayList.length, isActionMode]);

  const onKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, displayList.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && displayList[active]) displayList[active].action();
  };

  const typeColor = { product: '#007AFF', order: '#FF9500', contact: '#5AC8FA' };
  const typeLabel = { product: 'מוצר', order: 'הזמנה', contact: 'פנייה' };

  const QUICK = [
    { label: 'הצעת מחיר חדשה', icon: 'M12 4v16m8-8H4', action: () => { navigate('/admin/orders'); onClose(); } },
    { label: 'הוסף מוצר',       icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', action: () => { navigate('/admin/products'); onClose(); } },
    { label: 'בדוק מלאי',       icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8', action: () => { navigate('/admin/inventory'); onClose(); } },
    { label: 'אנליטיקס',        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', action: () => { navigate('/admin/analytics'); onClose(); } },
  ];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300]"
        style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} />
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
        className="fixed top-[72px] right-2 left-2 sm:right-4 sm:left-4 max-w-2xl mx-auto z-[301] rounded-[24px] overflow-hidden"
        style={{ background: isActionMode ? 'rgba(29,29,31,0.97)' : 'rgba(255,255,255,0.94)', backdropFilter: 'blur(60px) saturate(220%)', WebkitBackdropFilter: 'blur(60px) saturate(220%)', boxShadow: '0 48px 120px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(0,0,0,0.10)', border: isActionMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.8)' }}
        onKeyDown={onKey}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${isActionMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
          <motion.div
            animate={{ background: isActionMode ? 'linear-gradient(135deg,#FF9500,#FF3B30)' : 'linear-gradient(135deg,#007AFF,#5AC8FA)' }}
            transition={{ duration: 0.3 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ boxShadow: isActionMode ? '0 4px 12px rgba(255,149,0,0.35)' : '0 4px 12px rgba(0,122,255,0.30)' }}
          >
            {isActionMode ? (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </motion.div>
          <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={isActionMode ? 'הקלד פקודה... (ניווט, ייצוא, פעולות)' : 'חפש מוצרים, הזמנות, לקוחות... או > לפקודות'}
            dir="rtl"
            className="flex-1 text-[15px] font-semibold outline-none placeholder-[#86868B] bg-transparent"
            style={{ color: isActionMode ? '#F5F5F7' : '#1D1D1F' }} />
          {isActionMode && (
            <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ background: 'rgba(255,149,0,0.2)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.3)' }}>
              מצב פקודה
            </span>
          )}
          <kbd className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${isActionMode ? 'border-white/10 bg-white/08 text-[#86868B]' : 'border-black/08 bg-[#F5F5F7] text-[#AEAEB2]'}`}>ESC</kbd>
        </div>

        {/* Action mode — command list */}
        {isActionMode && (
          <div className="max-h-80 overflow-y-auto py-2">
            {actionResults.length === 0 && (
              <div className="py-10 text-center text-[#86868B] text-sm">אין פקודות מתאימות</div>
            )}
            {actionResults.map((a, i) => (
              <motion.button key={i} onClick={a.action}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-right transition-colors"
                style={{ background: active === i ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: `${a.color}22` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={a.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={a.icon} />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F5F5F7] text-sm font-bold line-clamp-1">{a.label}</p>
                  <p style={{ color: '#86868B' }} className="text-xs">{a.sub}</p>
                </div>
                {active === i && (
                  <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-white/08 text-[#86868B] font-black">↵</kbd>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Search mode — quick actions when empty */}
        {!isActionMode && !query.trim() && (
          <div className="p-4">
            <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-3 px-1">פעולות מהירות</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((q, i) => (
                <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={q.action}
                  className="flex items-center gap-3 px-4 py-3 rounded-[14px] text-right transition-colors"
                  style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,rgba(0,122,255,0.12),rgba(90,200,250,0.10))' }}>
                    <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={q.icon} /></svg>
                  </span>
                  <span className="text-[#1D1D1F] text-xs font-bold">{q.label}</span>
                </motion.button>
              ))}
            </div>
            {/* Action mode hint */}
            <div className="mt-3 flex items-center gap-2 px-1">
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-[#F0F0F5] border border-black/08 text-[#AEAEB2] font-black">&gt;</kbd>
              <span className="text-[10px] text-[#C7C7CC] font-medium">הקלד &gt; לפתיחת מצב פקודות — ייצוא, ניווט, פעולות קבוצתיות</span>
            </div>
          </div>
        )}

        {/* Search results */}
        {!isActionMode && query.trim() && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results.length === 0 && (
              <div className="py-10 text-center text-[#AEAEB2] text-sm">אין תוצאות עבור &ldquo;{query}&rdquo;</div>
            )}
            {results.map((r, i) => (
              <motion.button key={i} onClick={r.action}
                className="w-full flex items-center gap-4 px-5 py-3 text-right transition-colors"
                style={{ background: active === i ? 'rgba(0,122,255,0.06)' : 'transparent' }}
                onMouseEnter={() => setActive(i)}>
                <span className="shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: `${typeColor[r.type]}18` }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={typeColor[r.type]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {r.type === 'product' && <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>}
                    {r.type === 'order'   && <><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4a1 1 0 011 1v9a1 1 0 01-1 1H8a1 1 0 01-1-1v-4"/></>}
                    {r.type === 'contact' && <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l8 8 8-8"/>}
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1D1D1F] text-sm font-bold line-clamp-1">{r.label}</p>
                  <p className="text-[#AEAEB2] text-xs line-clamp-1">{r.sub}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0" style={{ background: `${typeColor[r.type]}14`, color: typeColor[r.type] }}>
                  {typeLabel[r.type]}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        <div className="px-5 py-3 flex items-center gap-4" style={{ borderTop: `1px solid ${isActionMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`, background: isActionMode ? 'rgba(255,255,255,0.03)' : 'rgba(248,248,252,0.6)' }}>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${isActionMode ? 'text-[#86868B]' : 'text-[#C7C7CC]'}`}>
            <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-black ${isActionMode ? 'bg-white/08 border-white/10 text-[#86868B]' : 'bg-[#F0F0F5] border-black/08'}`}>↑↓</kbd> ניווט
          </span>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${isActionMode ? 'text-[#86868B]' : 'text-[#C7C7CC]'}`}>
            <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-black ${isActionMode ? 'bg-white/08 border-white/10 text-[#86868B]' : 'bg-[#F0F0F5] border-black/08'}`}>↵</kbd> הפעל
          </span>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${isActionMode ? 'text-[#86868B]' : 'text-[#C7C7CC]'}`}>
            <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-black ${isActionMode ? 'bg-white/08 border-white/10 text-[#86868B]' : 'bg-[#F0F0F5] border-black/08'}`}>&gt;</kbd> פקודות
          </span>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${isActionMode ? 'text-[#86868B]' : 'text-[#C7C7CC]'}`}>
            <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-black ${isActionMode ? 'bg-white/08 border-white/10 text-[#86868B]' : 'bg-[#F0F0F5] border-black/08'}`}>ESC</kbd> סגור
          </span>
        </div>
      </motion.div>
    </>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
function NotificationsPanel({ kpis, orders, onClose, onNavigate }) {
  const items = useMemo(() => {
    const out = [];
    if (kpis.pendingOrders > 0) out.push({ color: '#FF9500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: `${kpis.pendingOrders} הצעות ממתינות`, sub: 'דורשות טיפול', path: '/admin/orders' });
    if (kpis.contactsNew > 0) out.push({ color: '#5AC8FA', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z', label: `${kpis.contactsNew} פניות חדשות`, sub: 'ממתינות למענה', path: '/admin/customers' });
    if (kpis.lowStockCount > 0) out.push({ color: '#FF3B30', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', label: `${kpis.lowStockCount} מוצרים במלאי נמוך`, sub: 'זקוקים להזמנה', path: '/admin/inventory' });
    if (out.length === 0) out.push({ color: '#34C759', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'הכל תקין', sub: 'אין התראות פעילות', path: null });
    return out;
  }, [kpis]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      className="absolute top-full mt-2 left-0 w-80 rounded-[20px] overflow-hidden z-[400]"
      style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.09)', border: '1px solid rgba(255,255,255,0.8)' }}
    >
      <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[#1D1D1F] text-sm font-black">התראות</p>
        <p className="text-[#AEAEB2] text-[10px] font-medium mt-0.5">{items.filter(i=>i.path).length} פעילות</p>
      </div>
      <div className="py-1.5">
        {items.map((item, i) => (
          <motion.button key={i} whileHover={{ background: 'rgba(0,0,0,0.03)' }}
            onClick={() => { if (item.path) { onNavigate(item.path); onClose(); } }}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-right transition-colors">
            <span className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: `${item.color}16` }}>
              <svg className="w-4.5 h-4.5" width={18} height={18} fill="none" viewBox="0 0 24 24" stroke={item.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[#1D1D1F] text-[13px] font-bold">{item.label}</p>
              <p className="text-[#AEAEB2] text-[11px]">{item.sub}</p>
            </div>
            {item.path && <svg className="w-3 h-3 text-[#C7C7CC] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Quick-Actions Launcher ───────────────────────────────────────────────────
function QuickLaunchPanel({ onClose, onNavigate }) {
  const ACTIONS = [
    { label: 'מרכז ההזמנות', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', path: '/admin/order-hub',    color: '#FF9500' },
    { label: 'מוצרים',    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',           path: '/admin/products',  color: '#007AFF' },
    { label: 'מלאי',      icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8', path: '/admin/inventory', color: '#34C759' },
    { label: 'לקוחות',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', path: '/admin/users',     color: '#5AC8FA' },
    { label: 'אנליטיקס',  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: '/admin/analytics', color: '#FF2D55' },
    { label: 'ספקים',     icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',                          path: '/admin/suppliers', color: '#0A84FF' },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      className="absolute top-full mt-2 left-0 w-64 rounded-[20px] overflow-hidden z-[400] p-3"
      style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(50px) saturate(200%)', WebkitBackdropFilter: 'blur(50px) saturate(200%)', boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.09)', border: '1px solid rgba(255,255,255,0.8)' }}
    >
      <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-2.5 px-1">ניווט מהיר</p>
      <div className="grid grid-cols-3 gap-1.5">
        {ACTIONS.map((a, i) => (
          <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => { onNavigate(a.path); onClose(); }}
            className="flex flex-col items-center gap-2 py-3 px-1 rounded-[14px] transition-colors"
            style={{ background: `${a.color}0D` }}>
            <span className="w-9 h-9 rounded-[11px] flex items-center justify-center" style={{ background: `${a.color}1A` }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={a.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={a.icon}/></svg>
            </span>
            <span className="text-[11px] font-bold text-[#1D1D1F]">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── System Status Dot ─────────────────────────────────────────────────────────
function SystemStatus() {
  const [status] = useState('ok'); // could check firebase, etc.
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.22)' }} title="כל המערכות פעילות">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#34C759' }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#34C759' }} />
      </span>
      <span className="text-[10px] font-black hidden lg:inline" style={{ color: '#1A8C40' }}>מערכת פעילה</span>
    </div>
  );
}

// ─── Main TopBar ──────────────────────────────────────────────────────────────
export default function AdminTopBar({ collapsed, onMobileMenuToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { kpis, orders } = useAdminData();

  const [searchOpen, setSearchOpen]       = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [launchOpen, setLaunchOpen]       = useState(false);
  const notifRef  = useRef(null);
  const launchRef = useRef(null);

  // ⌘K shortcut
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s); }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setLaunchOpen(false); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = e => {
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
      if (launchRef.current && !launchRef.current.contains(e.target)) setLaunchOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const urgentCount   = kpis.pendingOrders + kpis.contactsNew + kpis.lowStockCount;
  const today         = new Date().toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
  const pageMeta      = PAGE_META[location.pathname] || { label: 'ניהול', icon: 'M4 6h16M4 12h16M4 18h16' };
  const greeting      = (() => {
    const h = new Date().getHours();
    if (h < 5)  return 'לילה טוב';
    if (h < 12) return 'בוקר טוב';
    if (h < 17) return 'צהריים טובים';
    if (h < 21) return 'ערב טוב';
    return 'לילה טוב';
  })();

  const todayRevenue = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.dateTs);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, o) => s + (o.total || 0), 0);
  }, [orders]);

  return (
    <>
      <style>{`@keyframes topbar-blink { 0%,100%{opacity:0.35}50%{opacity:0.15} }`}</style>

      <div className="h-[60px] shrink-0 flex items-center gap-2 px-4 lg:px-5 relative"
        style={{
          background: 'rgba(252,252,255,0.72)',
          backdropFilter: 'blur(64px) saturate(240%)',
          WebkitBackdropFilter: 'blur(64px) saturate(240%)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          boxShadow: `0 4px 32px rgba(0,0,0,0.06), ${SHADOW.specular}`,
        }}
        dir="rtl"
      >
        {/* Specular top edge — glass chrome highlight */}
        <div className="absolute top-0 left-[6%] right-[6%] h-px pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)' }} />

        {/* ── Mobile hamburger ── */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onMobileMenuToggle}
          className="flex lg:hidden w-10 h-10 rounded-[12px] items-center justify-center shrink-0 transition-colors"
          style={{ color: '#6E6E73' }}
          aria-label="פתח תפריט">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>

        {/* ── Back button ── */}
        <motion.button
          whileHover={{ x: 2 }} whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-[12px] shrink-0 transition-all"
          style={{ background: 'rgba(0,0,0,0.05)', color: '#3C3C43', border: '0.5px solid rgba(0,0,0,0.08)' }}
          title="אחורה"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>

        {/* ── Page title (context-aware) ── */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="flex items-center gap-2.5 mr-1"
        >
          <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg,${hexA(PALETTE.azure, 0.14)},${hexA(PALETTE.indigo, 0.10)})`,
              border: `1px solid ${hexA(PALETTE.azure, 0.16)}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7)`,
            }}>
            <svg className="w-3.5 h-3.5 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d={pageMeta.icon} />
            </svg>
          </span>
          <h1 className="text-[#1D1D1F] text-[15px] font-black hidden sm:block tracking-tight" style={{ letterSpacing: '-0.02em' }}>
            {pageMeta.label}
          </h1>
        </motion.div>

        {/* ── Divider ── */}
        <div className="w-px h-5 bg-black/08 shrink-0 mr-1 hidden sm:block" />

        {/* ── Quick Launch Grid ── */}
        <div className="relative hidden md:block" ref={launchRef}>
          <motion.button whileTap={{ scale: 0.93 }}
            onClick={() => { setLaunchOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-[#6E6E73] text-[11px] font-bold transition-all"
            style={{ background: launchOpen ? 'rgba(0,122,255,0.08)' : 'rgba(0,0,0,0.04)', border: '0.5px solid rgba(0,0,0,0.07)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden lg:inline">ניווט</span>
          </motion.button>
          <AnimatePresence>{launchOpen && <QuickLaunchPanel onClose={() => setLaunchOpen(false)} onNavigate={navigate} />}</AnimatePresence>
        </div>

        {/* ── Search ── */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-[12px] text-[#6E6E73] text-[11px] font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden md:inline">חיפוש</span>
          <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 bg-[#F0F0F5] rounded-md border border-black/08 text-[#C7C7CC] font-black">⌘K</kbd>
        </motion.button>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── System status ── */}
        <SystemStatus />

        {/* ── Today revenue ── */}
        {todayRevenue > 0 && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[12px] hidden sm:flex"
            style={{ background: 'linear-gradient(135deg,rgba(52,199,89,0.12),rgba(48,209,88,0.07))', border: '0.5px solid rgba(52,199,89,0.28)' }}>
            <span className="text-[#1A8C40] text-[12px] font-black">₪{todayRevenue.toLocaleString()}</span>
            <span className="text-[#34C759] text-[9px] font-bold hidden lg:inline">היום</span>
          </motion.div>
        )}

        {/* ── Clock + Date ── */}
        <div className="flex-col items-end hidden md:flex gap-0 leading-none">
          <Clock />
          <span className="text-[9px] font-bold text-[#AEAEB2]">{today}</span>
        </div>

        {/* ── Notifications ── */}
        <div className="relative" ref={notifRef}>
          <motion.button whileTap={{ scale: 0.90 }} whileHover={{ y: -1 }} transition={SPRING.snappy}
            onClick={() => { setNotifOpen(o => !o); setLaunchOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center transition-all"
            style={{ borderRadius: RADIUS.button, background: notifOpen ? hexA(PALETTE.azure, 0.10) : 'rgba(0,0,0,0.045)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: notifOpen ? glow(PALETTE.azure, 0.14, 14) : SHADOW.specular, color: '#3C3C43' }}
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <AnimatePresence>
              {urgentCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg,#FF3B30,#FF6B30)', boxShadow: '0 2px 6px rgba(255,59,48,0.50)' }}>
                  {urgentCount > 9 ? '9+' : urgentCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <AnimatePresence>{notifOpen && <NotificationsPanel kpis={kpis} orders={orders} onClose={() => setNotifOpen(false)} onNavigate={navigate} />}</AnimatePresence>
        </div>

        {/* ── Back to site ── */}
        <motion.a href="/" whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.94 }} transition={SPRING.snappy}
          className="flex items-center justify-center w-9 h-9 shrink-0 transition-all"
          style={{ borderRadius: RADIUS.button, background: 'linear-gradient(135deg,#5AC8FA,#007AFF)', boxShadow: `${glow(PALETTE.indigo, 0.34, 12)}, inset 0 1px 0 rgba(255,255,255,0.22)`, color: 'white' }}
          title="חזרה לאתר"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </motion.a>

        {/* ── Greeting + Admin avatar ── */}
        <div className="hidden xl:flex flex-col items-end leading-none mr-0.5">
          <span className="text-[11px] font-black text-[#1D1D1F] tracking-tight">{greeting}</span>
          <span className="text-[9px] font-bold text-[#AEAEB2] mt-0.5">מנהל NextClass</span>
        </div>
        <motion.div
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={SPRING.snappy}
          className="w-8 h-8 flex items-center justify-center text-white text-[11px] font-black shrink-0"
          style={{ borderRadius: RADIUS.button, background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', boxShadow: `${glow(PALETTE.azure, 0.3, 10)}, 0 0 0 2px rgba(255,255,255,0.9)`, cursor: 'default' }}>
          N
        </motion.div>
      </div>

      <AnimatePresence>
        {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
