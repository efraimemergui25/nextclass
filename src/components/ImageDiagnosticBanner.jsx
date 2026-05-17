import { useState, useEffect } from 'react';

const TEST_URL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1&q=1';

export default function ImageDiagnosticBanner() {
    const [status, setStatus] = useState(null); // null | 'ok' | { error, code, type }

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            try {
                const res = await fetch(TEST_URL, { method: 'HEAD', cache: 'no-store' });
                if (!cancelled) {
                    if (res.ok) {
                        setStatus('ok');
                    } else {
                        setStatus({ type: 'HTTP', code: res.status, error: `שגיאת שרת ${res.status} (${res.statusText})` });
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    const isCors = err.message?.toLowerCase().includes('cors') || err.message?.toLowerCase().includes('cross');
                    const isNetwork = err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('failed to fetch');
                    setStatus({
                        type: isCors ? 'CORS' : isNetwork ? 'NETWORK' : 'UNKNOWN',
                        error: err.message || 'שגיאה לא ידועה',
                    });
                }
            }
        };
        run();
        return () => { cancelled = true; };
    }, []);

    if (!status || status === 'ok') return null;

    const labels = {
        CORS: 'שגיאת CORS — הדפדפן חוסם את images.unsplash.com',
        NETWORK: 'שגיאת רשת — אין גישה ל-images.unsplash.com',
        HTTP: `שגיאת HTTP`,
        UNKNOWN: 'שגיאה לא ידועה',
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 80,
                left: 16,
                right: 16,
                zIndex: 9999,
                background: '#1D1D1F',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 13,
                fontFamily: 'monospace',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                direction: 'rtl',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
            }}
        >
            <span style={{ color: '#FF3B30', fontSize: 16 }}>⚠</span>
            <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    {labels[status.type] || labels.UNKNOWN}
                </div>
                <div style={{ color: '#AEAEB2', fontSize: 12 }}>
                    URL: {TEST_URL}
                </div>
                <div style={{ color: '#FF9500', fontSize: 12, marginTop: 2 }}>
                    שגיאה: {status.error}
                </div>
                {status.type === 'NETWORK' && (
                    <div style={{ color: '#34C759', fontSize: 12, marginTop: 4 }}>
                        פתרון: בדוק חיבור לאינטרנט, כבה Ad Blocker, או נסה דפדפן אחר
                    </div>
                )}
                {status.type === 'CORS' && (
                    <div style={{ color: '#34C759', fontSize: 12, marginTop: 4 }}>
                        פתרון: כבה תוספים לדפדפן (Privacy Badger / uBlock) ורענן
                    </div>
                )}
            </div>
        </div>
    );
}
