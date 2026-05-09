/* eslint-disable */
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdminData } from '../context/AdminDataContext';

function Clock() {
    const [time, setTime] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="text-[#6E6E73] text-xs font-bold tabular-nums">
            {time.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
    );
}

function SearchModal({ onClose }) {
    const navigate = useNavigate();
    const { products, orders, contacts } = useAdminData();
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const r = [];

        products.filter(p => p.title?.toLowerCase().includes(q) || p.category?.includes(q))
            .slice(0, 4).forEach(p => r.push({ type: 'product', label: p.title, sub: p.category, icon: '🛍️', action: () => { navigate('/admin/products'); onClose(); } }));

        orders.filter(o => o.customer?.includes(q) || o.id?.includes(q) || o.product?.includes(q))
            .slice(0, 3).forEach(o => r.push({ type: 'order', label: o.customer, sub: `${o.id} · ₪${o.total?.toLocaleString()}`, icon: '📦', action: () => { navigate('/admin/orders'); onClose(); } }));

        contacts.filter(c => c.name?.includes(q) || c.email?.includes(q) || c.subject?.includes(q))
            .slice(0, 2).forEach(c => r.push({ type: 'contact', label: c.name, sub: c.subject, icon: '✉️', action: () => { navigate('/admin/customers'); onClose(); } }));

        return r;
    }, [query, products, orders, contacts, navigate, onClose]);

    return (
        <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[300]" />
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className="fixed top-16 right-4 left-4 max-w-xl mx-auto z-[301] rounded-[24px] overflow-hidden bg-white"
                style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 1px 0 rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-black/06">
                    <svg className="w-5 h-5 text-[#AEAEB2] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="חפש מוצרים, הזמנות, לקוחות..."
                        dir="rtl"
                        className="flex-1 text-[#1D1D1F] text-sm font-medium outline-none placeholder-[#AEAEB2]"
                    />
                    <kbd className="text-[10px] text-[#AEAEB2] font-bold px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-black/08">ESC</kbd>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {results.length === 0 && query.trim() && (
                        <div className="py-10 text-center text-[#AEAEB2] text-sm">אין תוצאות עבור "{query}"</div>
                    )}
                    {results.length === 0 && !query.trim() && (
                        <div className="py-8 text-center text-[#AEAEB2] text-xs">הקלד לחיפוש מוצרים, הזמנות ולקוחות</div>
                    )}
                    {results.map((r, i) => (
                        <motion.button key={i} onClick={r.action}
                            whileHover={{ background: '#F5F5F7' }}
                            className="w-full flex items-center gap-4 px-5 py-3.5 text-right border-b border-black/04 last:border-0 transition-colors">
                            <span className="text-lg shrink-0">{r.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[#1D1D1F] text-sm font-bold line-clamp-1">{r.label}</p>
                                <p className="text-[#AEAEB2] text-xs line-clamp-1">{r.sub}</p>
                            </div>
                            <span className="text-[10px] text-[#AEAEB2] font-bold px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-black/06 shrink-0">
                                {r.type === 'product' ? 'מוצר' : r.type === 'order' ? 'הזמנה' : 'פנייה'}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </>
    );
}

export default function AdminTopBar({ collapsed }) {
    const navigate = useNavigate();
    const { kpis, orders } = useAdminData();
    const [searchOpen, setSearchOpen] = useState(false);

    // Keyboard shortcut: ⌘K
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(s => !s); }
            if (e.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const urgentCount = kpis.pendingOrders + kpis.contactsNew + kpis.lowStockCount;
    const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

    // Revenue today (orders placed today)
    const todayRevenue = useMemo(() => {
        const now = new Date();
        return orders.filter(o => {
            const d = new Date(o.dateTs);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((s, o) => s + (o.total || 0), 0);
    }, [orders]);

    return (
        <>
            <div
                className="h-14 shrink-0 flex items-center gap-4 px-6 border-b border-black/06 bg-white/80 backdrop-blur-xl"
                style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
                dir="rtl"
            >
                {/* Date + Clock */}
                <div className="text-right hidden sm:block">
                    <p className="text-[#1D1D1F] text-xs font-bold leading-none">{today}</p>
                    <Clock />
                </div>

                <div className="w-px h-6 bg-black/08 shrink-0 hidden sm:block" />

                {/* Search button */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSearchOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#EBEBEB] transition-colors text-[#6E6E73] text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden md:inline text-xs">חיפוש מהיר</span>
                    <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 bg-white rounded-md border border-black/10 text-[#AEAEB2]">⌘K</kbd>
                </motion.button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Today revenue */}
                {todayRevenue > 0 && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#34C759]/08 border border-[#34C759]/20">
                        <span className="text-[#1A8C40] text-xs font-black">₪{todayRevenue.toLocaleString()}</span>
                        <span className="text-[#34C759] text-[10px] font-bold">היום</span>
                    </div>
                )}

                {/* Notifications */}
                <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => navigate('/admin/orders')}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {urgentCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-[#FF3B30] text-white"
                        >
                            {urgentCount > 9 ? '9+' : urgentCount}
                        </motion.span>
                    )}
                </motion.button>

                {/* Admin avatar */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                    style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)' }}>
                    N
                </div>
            </div>

            <AnimatePresence>
                {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
            </AnimatePresence>
        </>
    );
}
