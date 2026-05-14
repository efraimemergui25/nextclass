import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const STORAGE_KEY = 'nextclass_exit_shown';

export default function ExitIntentPopup() {
    const { getSetting } = useSettings();
    const waNumber = getSetting('whatsapp_number', '972585856356');
    const [visible, setVisible] = useState(false);

    const dismiss = useCallback(() => {
        setVisible(false);
        sessionStorage.setItem(STORAGE_KEY, '1');
    }, []);

    useEffect(() => {
        // Don't show on admin, and only once per session
        if (
            window.location.pathname.startsWith('/admin') ||
            sessionStorage.getItem(STORAGE_KEY)
        ) return;

        let armed = false;
        // Arm after 8 seconds so it doesn't fire immediately
        const armTimer = setTimeout(() => { armed = true; }, 8000);

        const handleMouseLeave = (e) => {
            if (!armed || e.clientY > 20) return;
            setVisible(true);
            sessionStorage.setItem(STORAGE_KEY, '1');
            document.removeEventListener('mouseleave', handleMouseLeave);
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            clearTimeout(armTimer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={dismiss}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[900]"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="fixed inset-0 flex items-center justify-center z-[901] pointer-events-none px-4"
                    >
                        <div
                            className="pointer-events-auto relative w-full max-w-md rounded-[2.5rem] overflow-hidden text-right"
                            style={{
                                background: 'rgba(255,255,255,0.97)',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.12)',
                                border: '1px solid rgba(255,255,255,0.6)',
                            }}
                        >
                            {/* Gradient header strip */}
                            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to left, #007AFF, #5856D6)' }} />

                            <div className="p-8 sm:p-10">
                                {/* Close */}
                                <button
                                    onClick={dismiss}
                                    className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X size={16} className="text-[#1D1D1F]" />
                                </button>

                                {/* Emoji + heading */}
                                <div className="text-4xl mb-4">⏳</div>
                                <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight leading-snug mb-3">
                                    רגע לפני שעוזב/ת —
                                    <br />
                                    <span style={{ background: 'linear-gradient(135deg,#007AFF,#5856D6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                        קבל הצעת מחיר מיידית
                                    </span>
                                </h2>
                                <p className="text-[#86868B] font-medium leading-relaxed mb-8">
                                    מלא 3 שדות בלבד — נחזור אליך עם הצעה מותאמת תוך פחות מ-24 שעות.
                                    ללא התחייבות.
                                </p>

                                {/* CTAs */}
                                <div className="flex flex-col gap-3">
                                    <Link
                                        to="/checkout"
                                        onClick={dismiss}
                                        className="flex items-center justify-between gap-3 px-6 py-4 rounded-2xl text-white font-black text-[15px] transition-all hover:scale-[1.02] active:scale-95"
                                        style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}
                                    >
                                        <ArrowLeft size={18} />
                                        קבל הצעת מחיר עכשיו
                                    </Link>
                                    <a
                                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent('היי, אשמח לקבל הצעת מחיר ממוקדת.')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={dismiss}
                                        className="flex items-center justify-between gap-3 px-6 py-4 rounded-2xl bg-[#25D366] text-white font-bold text-[14px] transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        <MessageCircle size={18} />
                                        שאל שאלה מהירה בוואטסאפ
                                    </a>
                                    <button
                                        onClick={dismiss}
                                        className="text-[#86868B] font-medium text-sm text-center py-2 hover:text-[#1D1D1F] transition-colors cursor-pointer"
                                    >
                                        אמשיך לעיין
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
