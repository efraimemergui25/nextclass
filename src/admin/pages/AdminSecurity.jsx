/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const EVENT_LABELS = {
    rate_limited:      { label: 'Rate Limited',    color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
    payload_too_large: { label: 'Payload Too Large', color: '#FF9500', bg: 'rgba(255,149,0,0.08)' },
    crm_error:         { label: 'CRM Error',        color: '#5856D6', bg: 'rgba(88,86,214,0.08)' },
    auth_failed:       { label: 'Auth Failed',      color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
};

function EventBadge({ event }) {
    const meta = EVENT_LABELS[event] || { label: event, color: '#374151', bg: '#F3F4F6' };
    return (
        <span style={{
            display: 'inline-block',
            background: meta.bg,
            color: meta.color,
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 50,
            border: `1px solid ${meta.color}22`,
        }}>
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

export default function AdminSecurity() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);

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
        } catch (e) {
            console.error('[AdminSecurity]', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 30_000);
        return () => clearInterval(interval);
    }, [fetchLogs]);

    const counts = logs.reduce((acc, l) => {
        acc[l.event] = (acc[l.event] || 0) + 1;
        return acc;
    }, {});

    const glassCard = {
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.72)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
    };

    return (
        <div dir="rtl">
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: -0.5 }}>
                        אבטחת מידע
                        <span style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginRight: 8 }}>ומעקב אירועים</span>
                    </h1>
                    <button
                        onClick={fetchLogs}
                        style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,122,255,0.25)' }}
                    >
                        רענן
                    </button>
                </div>
                {lastRefresh && (
                    <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>
                        עודכן לאחרונה: {lastRefresh.toLocaleTimeString('he-IL')} · מתרענן אוטומטית כל 30 שניות
                    </p>
                )}
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                    { key: 'total', label: 'סך הכל אירועים', value: logs.length, color: '#007AFF' },
                    { key: 'rate_limited', label: 'חסימות Rate Limit', value: counts.rate_limited || 0, color: '#FF3B30' },
                    { key: 'payload_too_large', label: 'Payload גדול מדי', value: counts.payload_too_large || 0, color: '#FF9500' },
                    { key: 'other', label: 'אירועים אחרים', value: logs.length - (counts.rate_limited || 0) - (counts.payload_too_large || 0), color: '#5856D6' },
                ].map(card => (
                    <div key={card.key} style={{ ...glassCard, borderRadius: 16, padding: '16px 20px' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 600 }}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Log table */}
            <div style={{ ...glassCard, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>100 אירועים אחרונים</span>
                    {loading && <span style={{ fontSize: 12, color: '#9CA3AF' }}>טוען...</span>}
                </div>

                {logs.length === 0 && !loading ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center', color: '#34C759', fontSize: 14, fontWeight: 600 }}>
                        אין אירועי אבטחה ב-100 הרשומות האחרונות — הכל תקין
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.025)' }}>
                                    {['זמן', 'אירוע', 'נקודת קצה', 'כתובת IP', 'פרטים'].map(h => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id} style={{ borderTop: '1px solid rgba(0,0,0,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)' }}>
                                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', color: '#6B7280', fontFamily: 'monospace', fontSize: 12 }}>
                                            {formatTs(log.ts)}
                                        </td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <EventBadge event={log.event} />
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#374151', fontFamily: 'monospace', fontSize: 12 }}>
                                            {log.endpoint || '—'}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#374151', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
                                            {log.ip || '—'}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#6B7280', fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {Object.entries(log)
                                                .filter(([k]) => !['id', 'event', 'ts', 'endpoint', 'ip'].includes(k))
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(' · ') || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
