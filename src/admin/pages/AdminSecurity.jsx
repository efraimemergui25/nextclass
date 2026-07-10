/* eslint-disable */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    PALETTE, GLASS, RADIUS, SHADOW, SPRING, hexA, glow, accentSurface,
} from '../theme/tokens';
import {
    AdminSectionHeader, AdminButton, AdminEmpty, AdminSkeleton, AdminFilterPills,
} from '../components/AdminComponents';

// ─── Security domain accent (restrained azure brand) ───────────────────────────
const SEAFOAM = '#007AFF';

const EVENT_LABELS = {
    rate_limited:      { label: 'Rate Limited',      color: '#FF3B30' },
    payload_too_large: { label: 'Payload Too Large', color: '#FF9500' },
    crm_error:         { label: 'CRM Error',         color: '#5856D6' },
    auth_failed:       { label: 'Auth Failed',       color: '#FF3B30' },
};

// ─── Token-driven glass surface ────────────────────────────────────────────────
const CARD = { ...GLASS.base, borderRadius: RADIUS.panel };

function EventBadge({ event }) {
    const meta = EVENT_LABELS[event] || { label: event, color: '#6E6E73' };
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap"
            style={{ background: hexA(meta.color, 0.1), color: meta.color, border: `1px solid ${hexA(meta.color, 0.22)}` }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
            {meta.label}
        </span>
    );
}

function formatTs(ts) {
    if (!ts) return '—';
    const d = new Date(Number(ts));
    if (isNaN(d)) return String(ts);
    return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Stat tile — white glass, ink number, small colored severity dot ───────────
function StatTile({ label, value, color, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay, ...SPRING.soft }}
            whileHover={{ y: -3, boxShadow: `${SHADOW.lg}, ${SHADOW.specular}` }}
            className="relative overflow-hidden p-5 flex flex-col justify-between min-h-[120px] transition-shadow"
            style={{ ...GLASS.base, borderRadius: RADIUS.kpi }}
        >
            <p className="text-[42px] font-black tracking-tighter leading-none" style={{ color: '#1D1D1F' }}>
                {value}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-[12px] text-[#6E6E73] font-bold">{label}</p>
            </div>
        </motion.div>
    );
}

export default function AdminSecurity() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [filter, setFilter] = useState('הכל');
    const [error, setError] = useState(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'security_logs'),
                orderBy('ts', 'desc'),
                limit(100)
            );
            const snap = await getDocs(q);
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLogs(items);
            setLastRefresh(new Date());
            setError(null);
        } catch (e) {
            console.error('[AdminSecurity]', e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30_000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const counts = useMemo(() => logs.reduce((acc, l) => {
        acc[l.event] = (acc[l.event] || 0) + 1;
        return acc;
    }, {}), [logs]);

    // Filter pills — only for event types actually present (real data)
    const filterOptions = useMemo(() => {
        const present = Object.keys(counts).map(k => EVENT_LABELS[k]?.label || k);
        return ['הכל', ...present];
    }, [counts]);

    const filteredLogs = useMemo(() => {
        if (filter === 'הכל') return logs;
        return logs.filter(l => (EVENT_LABELS[l.event]?.label || l.event) === filter);
    }, [logs, filter]);

    const stats = [
        { key: 'total',             label: 'סך הכל אירועים',   value: logs.length,                                                              color: SEAFOAM },
        { key: 'rate_limited',      label: 'חסימות Rate Limit', value: counts.rate_limited || 0,                                                 color: '#FF3B30' },
        { key: 'payload_too_large', label: 'Payload גדול מדי',  value: counts.payload_too_large || 0,                                            color: '#FF9500' },
        { key: 'other',             label: 'אירועים אחרים',     value: logs.length - (counts.rate_limited || 0) - (counts.payload_too_large || 0), color: '#5856D6' },
    ];

    const showSkeleton = loading && logs.length === 0;

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="אבטחת מידע ומעקב אירועים"
                subtitle={lastRefresh
                    ? `עודכן לאחרונה: ${lastRefresh.toLocaleTimeString('he-IL')} · מתרענן אוטומטית כל 30 שניות`
                    : 'ניטור אירועי אבטחה בזמן-אמת מתוך Firestore'}
                icon={ShieldCheck}
                action={
                    <div className="flex items-center gap-2.5">
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                            style={{ background: hexA(SEAFOAM, 0.1), border: `1px solid ${hexA(SEAFOAM, 0.24)}` }}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: SEAFOAM }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: SEAFOAM }} />
                            </span>
                            <span className="text-[11px] font-black" style={{ color: SEAFOAM }}>ניטור פעיל</span>
                        </div>
                        <AdminButton onClick={fetchLogs} accent={SEAFOAM} loading={loading}>
                            <span className="flex items-center gap-1.5"><RefreshCw size={14} /> רענן</span>
                        </AdminButton>
                    </div>
                }
            />

            {/* Summary stat band — oversized colored numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <StatTile key={s.key} label={s.label} value={s.value} color={s.color} delay={i * 0.06} />
                ))}
            </div>

            {/* Filter pills — by event type (real, present-only) */}
            {filterOptions.length > 1 && (
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <AdminFilterPills options={filterOptions} active={filter} onChange={setFilter} id="security-filter" />
                    <span className="text-[11px] text-[#AEAEB2] font-medium">
                        מציג {filteredLogs.length} מתוך {logs.length} רשומות
                    </span>
                </div>
            )}

            {/* Log table */}
            {showSkeleton ? (
                <AdminSkeleton rows={6} />
            ) : (
                <div className="w-full overflow-hidden" style={CARD}>
                    <div className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: hexA(SEAFOAM, 0.04) }}>
                        <span className="text-[13px] font-black text-[#1D1D1F]">100 אירועים אחרונים</span>
                        {loading && (
                            <span className="flex items-center gap-1.5 text-[11px] text-[#AEAEB2] font-medium">
                                <RefreshCw size={12} className="animate-spin" /> מרענן...
                            </span>
                        )}
                    </div>

                    {error ? (
                        <div className="flex flex-col items-center justify-center text-center px-6 py-14 gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                style={{ background: hexA('#FF3B30', 0.1), border: `1px solid ${hexA('#FF3B30', 0.24)}` }}>
                                <ShieldCheck size={26} style={{ color: '#FF3B30' }} />
                            </div>
                            <div>
                                <p className="text-[15px] font-black text-[#1D1D1F]">שגיאה בטעינת יומני האבטחה</p>
                                <p className="text-[12px] text-[#86868B] font-medium mt-1 max-w-[420px]">
                                    לא ניתן לקרוא את הרשומות מ-Firestore. ייתכן שאין הרשאה או שהחיבור נכשל — זהו אינו מצב "נקי".
                                </p>
                            </div>
                            <AdminButton onClick={fetchLogs} accent="#FF3B30" loading={loading}>
                                <span className="flex items-center gap-1.5"><RefreshCw size={14} /> נסה שוב</span>
                            </AdminButton>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <AdminEmpty
                            title={filter === 'הכל' ? 'אין אירועי אבטחה' : 'אין אירועים מסוג זה'}
                            subtitle="הרשומות האחרונות נקיות — כל המערכות תקינות"
                        />
                    ) : (
                        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <table className="w-full text-right" style={{ fontSize: 13, minWidth: 640 }}>
                                <thead>
                                    <tr>
                                        {['זמן', 'אירוע', 'נקודת קצה', 'כתובת IP', 'פרטים'].map(h => (
                                            <th key={h} className="px-4 py-3 text-[11px] font-bold text-[#86868B] whitespace-nowrap"
                                                style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', letterSpacing: 0.5 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence initial={false}>
                                        {filteredLogs.map((log, i) => (
                                            <motion.tr key={log.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(i * 0.01, 0.3), type: 'spring', stiffness: 320, damping: 28 }}
                                                style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)' }}>
                                                <td className="px-4 py-2.5 whitespace-nowrap text-[#6B7280]" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    {formatTs(log.ts)}
                                                </td>
                                                <td className="px-4 py-2.5"><EventBadge event={log.event} /></td>
                                                <td className="px-4 py-2.5 text-[#374151]" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    {log.endpoint || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#374151] whitespace-nowrap" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                    {log.ip || '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-[#6B7280]" style={{ fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {Object.entries(log)
                                                        .filter(([k]) => !['id', 'event', 'ts', 'endpoint', 'ip'].includes(k))
                                                        .map(([k, v]) => `${k}: ${v}`)
                                                        .join(' · ') || '—'}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
