import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

const AnnouncementBar = () => {
    const { getSetting, isVisible } = useSettings();
    const [dismissed, setDismissed] = useState(false);

    const ann = {
        text: getSetting('announcement_text', ''),
        color: getSetting('announcement_color', '#007AFF'),
        visible: isVisible('vis_announcement_bar', true) && !!getSetting('announcement_text', ''),
    };

    const show = ann.visible && ann.text && !dismissed;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-[110] w-full overflow-hidden"
                    style={{ background: ann.color }}
                >
                    <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                        <div className="flex-1" />
                        <p className="text-white text-[13px] font-bold text-center flex-1">{ann.text}</p>
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={() => setDismissed(true)}
                                className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                                aria-label="סגור"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AnnouncementBar;
