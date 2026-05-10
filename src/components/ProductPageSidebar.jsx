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
    headset:    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    chat:       "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    question:   "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
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
    { id: 'pd-features', labelKey: 'sidebar_label_features', defaultLabel: 'תכונות בולטות',       icon: 'file-text', visKey: 'sidebar_vis_features' },
    { id: 'pd-dims',     labelKey: 'sidebar_label_dims',     defaultLabel: 'מידות המוצר',          icon: 'ruler',     visKey: 'sidebar_vis_dims'    },
    { id: 'pd-specs',    labelKey: 'sidebar_label_specs',    defaultLabel: 'מפרט טכני',            icon: 'wrench',    visKey: 'sidebar_vis_specs'   },
    { id: 'pd-support',  labelKey: 'sidebar_label_support',  defaultLabel: 'שירות ותמיכה',         icon: 'headphones',visKey: 'sidebar_vis_support' },
    { id: 'pd-faq',      labelKey: 'sidebar_label_faq',      defaultLabel: 'שאלות נפוצות',         icon: 'message-square', visKey: 'sidebar_vis_faq' },
    { id: 'pd-qa',       labelKey: 'sidebar_label_qa',       defaultLabel: 'שאלות גולשים',         icon: 'messages-square', visKey: 'sidebar_vis_qa' },
    { id: 'pd-reviews',  labelKey: 'sidebar_label_reviews',  defaultLabel: 'חוות דעת',            icon: 'star',      visKey: 'sidebar_vis_reviews' },
];

const SidebarItem = memo(({ item, active, onClick, getSetting }) => {
    const label = getSetting(item.labelKey, item.defaultLabel);
    
    const Icon = () => {
        switch(item.icon) {
            case 'file-text': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
            );
            case 'ruler': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m-10.5 0h3.375m-3.375-1.5h1.5m3.75 0h1.5m3.75 0h1.5m-10.5-1.5h1.5m3.75 0h1.5m3.75 0h1.5m-10.5-1.5h1.5m3.75 0h1.5m3.75 0h1.5m-10.5-1.5h1.5m3.75 0h1.5m3.75 0h1.5m-10.5-1.5h1.5m3.75 0h1.5m3.75 0h1.5" />
                </svg>
            );
            case 'wrench': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.423 20.25a9 9 0 10-11.423-11.423 9 9 0 0011.423 11.423z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75l-4.5 4.5m0 0l-4.5-4.5m4.5 4.5V21" />
                </svg>
            );
            case 'headphones': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            );
            case 'message-square': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-4.5 5.25a8.997 8.997 0 0115.75-6.75 9 9 0 01-15.75 6.75z" />
                </svg>
            );
            case 'messages-square': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.303.025-.607.047-.912.066a2.109 2.109 0 00-1.679 1.114l-1.018 2.037a.3.3 0 01-.537 0l-1.018-2.037a2.109 2.109 0 00-1.679-1.114 36.888 36.888 0 01-.912-.066c-1.133-.094-1.98-1.057-1.98-2.193v-4.286c0-.969.616-1.813 1.5-2.097a35.19 35.19 0 004.544-1.841 3.528 3.528 0 013.012 0c1.554.707 3.078 1.326 4.544 1.841z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.226 7.347a10.5 10.5 0 018.276-5.6c.41-.045.823-.07 1.237-.076a.3.3 0 01.33.418 10.463 10.463 0 01-2.11 3.23.3.3 0 01-.42.032 10.5 10.5 0 00-7.313 2.016 10.5 10.5 0 01-7.313-2.016.3.3 0 01-.42-.032 10.463 10.463 0 01-2.11-3.23.3.3 0 01.33-.418c.414.006.827.031 1.237.076a10.5 10.5 0 018.276 5.6z" />
                </svg>
            );
            case 'star': return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.562 0 01.321-.988l5.518-.442a.563.562 0 00.475-.345L11.48 3.5z" />
                </svg>
            );
            default: return null;
        }
    };

    return (
        <motion.button
            onClick={() => onClick(item.id)}
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-end gap-4 px-6 py-5 text-right transition-all duration-300 relative group"
            style={{
                backgroundColor: active ? 'rgba(0, 122, 255, 0.05)' : 'transparent',
            }}
        >
            <span className={`text-[15px] font-bold tracking-tight transition-colors duration-300 ${active ? 'text-[#1D1D1F]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {label}
            </span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-white shadow-lg text-[#007AFF]' : 'bg-transparent text-gray-300 group-hover:text-gray-400'}`}>
                <Icon />
            </div>
            
            {/* Active Indicator Bar */}
            {active && (
                <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#007AFF]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </motion.button>
    );
});

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
                                    whileHover={{ backgroundColor: 'rgba(0,122,255,0.045)' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full flex items-center gap-2.5 transition-all cursor-pointer py-3 px-3.5"
                                    style={{
                                        borderRight: active ? '3px solid #007AFF' : '3px solid transparent',
                                        borderBottom: i < sections.length - 1 ? '1px solid rgba(0,0,0,0.045)' : 'none',
                                    }}
                                >
                                    {/* Icon first in DOM = visually on the RIGHT in RTL */}
                                    <SidebarIcon name={s.icon} active={active} />
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
