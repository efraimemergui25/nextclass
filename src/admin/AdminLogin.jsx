/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from './context/AdminAuthContext';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
const PIN_LENGTH = 6;

function AmbientOrb({ x, y, size, color, delay }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                left: x, top: y, width: size, height: size,
                background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                filter: 'blur(60px)',
            }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        />
    );
}

function PinDot({ filled, active, error }) {
    return (
        <motion.div
            animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="relative"
        >
            <motion.div
                animate={{
                    scale: active ? [1, 1.35, 1] : 1,
                    backgroundColor: filled
                        ? error ? '#FF3B30' : '#007AFF'
                        : 'rgba(255,255,255,0.12)',
                }}
                transition={{ duration: 0.2 }}
                className="w-3.5 h-3.5 rounded-full"
                style={{
                    boxShadow: filled && !error ? '0 0 12px rgba(0,122,255,0.7)' : filled && error ? '0 0 12px rgba(255,59,48,0.7)' : 'none',
                }}
            />
        </motion.div>
    );
}

function KeyPadButton({ value, onPress }) {
    if (value === '') return <div />;
    const isDelete = value === '⌫';

    return (
        <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => onPress(value)}
            className="relative flex items-center justify-center select-none focus:outline-none"
            style={{
                height: 72,
                borderRadius: 22,
                background: isDelete
                    ? 'transparent'
                    : 'linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)',
                border: isDelete ? 'none' : '1px solid rgba(255,255,255,0.10)',
                boxShadow: isDelete ? 'none' : '0 2px 12px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.08) inset',
            }}
        >
            {isDelete ? (
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                    <path d="M8 1L1 8L8 15" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 8H21M14 4L18 8L14 12" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M9.5 0.5H21.5C21.7761 0.5 22 0.723858 22 1V15C22 15.2761 21.7761 15.5 21.5 15.5H9.5L2 8L9.5 0.5Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth="0"/>
                </svg>
            ) : (
                <span className="text-white font-semibold text-[26px] leading-none tracking-tight">{value}</span>
            )}
        </motion.button>
    );
}

export default function AdminLogin() {
    const { login } = useAdminAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleKey = (k) => {
        if (loading || success) return;
        if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
        if (pin.length >= PIN_LENGTH) return;
        const next = pin + k;
        setPin(next);
        if (next.length >= 4) {
            // auto-submit when PIN_LENGTH reached (or allow manual submit)
        }
    };

    useEffect(() => {
        if (pin.length === PIN_LENGTH) handleSubmit();
    }, [pin]);

    const handleSubmit = async () => {
        if (loading || pin.length < 4) return;
        setLoading(true);
        const result = await login(pin);
        if (result && result.success) {
            setSuccess(true);
        } else {
            setError(result ? result.message : 'שגיאה לא ידועה');
            setTimeout(() => { setError(null); setPin(''); }, 2000);
        }
        setLoading(false);
    };

    // Keyboard support
    useEffect(() => {
        const onKey = (e) => {
            if (e.key >= '0' && e.key <= '9') handleKey(e.key);
            else if (e.key === 'Backspace') handleKey('⌫');
            else if (e.key === 'Enter') handleSubmit();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [pin, loading]);

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 70% 10%, rgba(0,122,255,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(88,86,214,0.15) 0%, transparent 50%), #050510' }}>

            {/* Ambient orbs */}
            <AmbientOrb x="65%" y="-5%" size={600} color="rgba(0,122,255,0.25)" delay={0} />
            <AmbientOrb x="-5%" y="60%" size={500} color="rgba(88,86,214,0.2)" delay={2} />
            <AmbientOrb x="50%" y="80%" size={400} color="rgba(0,122,255,0.12)" delay={4} />

            {/* Grain overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '256px' }} />

            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.1 }}
                className="relative z-10 w-full max-w-[360px] mx-4"
            >
                <div style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 36,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08) inset',
                    padding: '40px 32px 36px',
                }}>

                    {/* Logo */}
                    <motion.div className="flex flex-col items-center mb-8"
                        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <motion.div
                            animate={success ? { scale: [1, 1.15, 1], background: ['linear-gradient(135deg,#007AFF,#5856D6)', 'linear-gradient(135deg,#34C759,#30D158)'] } : {}}
                            className="w-[68px] h-[68px] rounded-[20px] flex items-center justify-center mb-5 relative"
                            style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', boxShadow: '0 12px 40px rgba(0,122,255,0.45), 0 0 0 1px rgba(255,255,255,0.15) inset' }}
                        >
                            <AnimatePresence mode="wait">
                                {success ? (
                                    <motion.svg key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </motion.svg>
                                ) : (
                                    <motion.svg key="shield" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </motion.svg>
                                )}
                            </AnimatePresence>
                            {/* Glow ring */}
                            <div className="absolute inset-0 rounded-[20px]" style={{ boxShadow: '0 0 0 8px rgba(0,122,255,0.12)' }} />
                        </motion.div>

                        <h1 className="text-white text-[22px] font-black tracking-tighter leading-none mb-1">NextClass Admin</h1>
                        <p className="text-white/35 text-[13px] font-medium">
                            {success ? 'ברוך הבא! מעביר...' : 'הזן קוד גישה להמשך'}
                        </p>
                    </motion.div>

                    {/* PIN dots */}
                    <div className="flex justify-center gap-3 mb-8">
                        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                            <PinDot
                                key={i}
                                filled={i < pin.length}
                                active={i === pin.length - 1}
                                error={!!error}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                        {KEYS.map((k, i) => (
                            <KeyPadButton key={i} value={k} onPress={handleKey} />
                        ))}
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center text-[#FF3B30] text-[11px] font-semibold mb-3 px-2"
                            >
                                {error === 'Firebase: Error (auth/invalid-credential).' ? 'סיסמה שגויה או משתמש לא קיים' : error}
                            </motion.p>
                        )}
                    </AnimatePresence>



                    {/* Trust line */}
                    <div className="flex items-center justify-center gap-2 mt-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
                        <span className="text-white/20 text-[10px] font-bold tracking-[0.18em]">גישה מורשית · כל פעולה מתועדת</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
