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
 transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
 className="relative z-[110] w-full overflow-hidden"
 style={{
 background: `linear-gradient(90deg, ${ann.color}ee 0%, ${ann.color} 50%, ${ann.color}ee 100%)`,
 boxShadow: `0 2px 16px ${ann.color}40`,
 }}
 >
 {/* Shimmer sweep */}
 <div className="absolute inset-0 pointer-events-none overflow-hidden">
 <div style={{
 position: 'absolute', inset: 0,
 background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)',
 animation: 'shimmer 3.5s ease-in-out infinite',
 backgroundSize: '300% 100%',
 }} />
 </div>
 <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4 relative">
 <div className="flex-1" />
 <p className="text-white text-[13px] font-bold text-center flex-1 drop-shadow-sm">{ann.text}</p>
 <div className="flex-1 flex justify-end">
 <motion.button
 onClick={() => setDismissed(true)}
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/15"
 aria-label="סגור"
 >
 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </motion.button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 );
};

export default AnnouncementBar;
