import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

// ─── SVG icon paths keyed by name ────────────────────────────────────────────
const ICON_PATHS = {
    lightning:  "M13 10V3L4 14h7v7l9-11h-7z",
    clipboard:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    ruler:      "M3 6l3 1m0 0l-3 9a5 5 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    wrench:     "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    headset:    "M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
    chat:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    question:   "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    star:       "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

function SidebarIcon({ name, active }) {
    return (
        <svg
            className="w-[17px] h-[17px] shrink-0 transition-colors duration-200"
            style={{ color: active ? '#007AFF' : '#AEAEB2' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
            strokeWidth={active ? 2.2 : 1.5}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name] || ICON_PATHS.clipboard} />
        </svg>
    );
}

// 7 sections matching hye.co.il structure — first item anchors to scrollytelling
const DEFAULT_SECTIONS = [
    { id: 'pd-features', labelKey: 'sidebar_label_features', defaultLabel: 'תכונות בולטות',       icon: 'lightning', visKey: 'sidebar_vis_features' },
    { id: 'pd-dims',     labelKey: 'sidebar_label_dims',     defaultLabel: 'מידות המוצר',          icon: 'ruler',     visKey: 'sidebar_vis_dims'    },
    { id: 'pd-specs',    labelKey: 'sidebar_label_specs',    defaultLabel: 'מפרט טכני',            icon: 'wrench',    visKey: 'sidebar_vis_specs'   },
    { id: 'pd-warranty', labelKey: 'sidebar_label_warranty', defaultLabel: 'תנאי רכישה ואחריות', icon: 'clipboard', visKey: 'sidebar_vis_warranty' },
    { id: 'pd-support',  labelKey: 'sidebar_label_support',  defaultLabel: 'שירות ותמיכה',         icon: 'headset',   visKey: 'sidebar_vis_support' },
    { id: 'pd-qa',       labelKey: 'sidebar_label_qa',       defaultLabel: 'שאלות גולשים',         icon: 'question',  visKey: 'sidebar_vis_qa'      },
    { id: 'pd-reviews',  labelKey: 'sidebar_label_reviews',  defaultLabel: 'חוות דעת',             icon: 'star',      visKey: 'sidebar_vis_reviews' },
];

const ProductPageSidebar = ({ visible = true }) => {
    const { getSetting, isVisible } = useSettings();
    const [activeId, setActiveId] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);

    const sidebarEnabled = isVisible('sidebar_visible', true);

    const sections = DEFAULT_SECTIONS
        .filter(s => isVisible(s.visKey, true))
        .map(s => ({ ...s, label: getSetting(s.labelKey, s.defaultLabel) }));

    // Show after hero scrolls away
    useEffect(() => {
        const handle = () => setShowSidebar(window.scrollY > 380);
        window.addEventListener('scroll', handle, { passive: true });
        handle();
        return () => window.removeEventListener('scroll', handle);
    }, []);

    // Active section via IntersectionObserver
    useEffect(() => {
        if (!sections.length) return;
        const observers = [];
        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveId(s.id); },
                { rootMargin: '-15% 0px -60% 0px', threshold: 0 }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [sections.length]);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
    };

    if (!sidebarEnabled || !visible) return null;

    return createPortal(
        <AnimatePresence>
            {showSidebar && (
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="fixed right-5 top-1/2 -translate-y-1/2 z-[55] hidden xl:block"
                    dir="rtl"
                >
                    <div
                        className="rounded-[20px] overflow-hidden"
                        style={{
                            width: 200,
                            background: 'rgba(255,255,255,0.92)',
                            backdropFilter: 'blur(56px) saturate(2.2)',
                            WebkitBackdropFilter: 'blur(56px) saturate(2.2)',
                            border: '1px solid rgba(255,255,255,0.88)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
                        }}
                    >
                        {sections.map((s, i) => {
                            const active = activeId === s.id;
                            return (
                                <motion.button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    whileHover={{ backgroundColor: 'rgba(0,122,255,0.06)' }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center gap-4 transition-all cursor-pointer py-4 px-5"
                                    style={{
                                        borderRight: active ? '4px solid #007AFF' : '4px solid transparent',
                                        borderBottom: i < sections.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none',
                                    }}
                                >
                                    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
                                        <SidebarIcon name={s.icon} active={active} />
                                    </div>
                                    <span
                                        className={`flex-1 text-[12.5px] transition-colors duration-200 text-right leading-tight ${
                                            active
                                                ? 'text-[#007AFF] font-bold'
                                                : 'text-[#6E6E73] font-medium'
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProductPageSidebar;
