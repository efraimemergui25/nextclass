import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Accessibility, 
    X, 
    Type, 
    Contrast, 
    Eye, 
    MousePointer2, 
    Link as LinkIcon, 
    ZoomIn, 
    RotateCcw,
    Check
} from 'lucide-react';

const AccessibilityWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('nextclass_accessibility');
        return saved ? JSON.parse(saved) : {
            fontSize: 100, // percentage
            highContrast: false,
            grayscale: false,
            invert: false,
            underlineLinks: false,
            readableFont: false,
            bigCursor: false,
            stopAnimations: false
        };
    });

    useEffect(() => {
        localStorage.setItem('nextclass_accessibility', JSON.stringify(settings));
        applySettings();
    }, [settings]);

    const applySettings = () => {
        const root = document.documentElement;
        
        // Font Size
        root.style.fontSize = `${(settings.fontSize / 100) * 16}px`;

        // Filters
        let filter = '';
        if (settings.grayscale) filter += 'grayscale(100%) ';
        if (settings.invert) filter += 'invert(100%) ';
        root.style.filter = filter.trim();

        // High Contrast
        if (settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Underline Links
        if (settings.underlineLinks) {
            root.classList.add('underline-links');
        } else {
            root.classList.remove('underline-links');
        }

        // Readable Font
        if (settings.readableFont) {
            root.classList.add('readable-font');
        } else {
            root.classList.remove('readable-font');
        }

        // Big Cursor
        if (settings.bigCursor) {
            root.classList.add('big-cursor');
        } else {
            root.classList.remove('big-cursor');
        }
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const updateFontSize = (delta) => {
        setSettings(prev => ({
            ...prev,
            fontSize: Math.min(Math.max(prev.fontSize + delta, 80), 150)
        }));
    };

    const resetSettings = () => {
        setSettings({
            fontSize: 100,
            highContrast: false,
            grayscale: false,
            invert: false,
            underlineLinks: false,
            readableFont: false,
            bigCursor: false,
            stopAnimations: false
        });
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <div className="fixed bottom-6 right-6 z-[9999]">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-2xl bg-[#007AFF] text-white shadow-2xl flex items-center justify-center border border-white/20"
                    aria-label="תפריט נגישות"
                >
                    <Accessibility size={28} />
                </motion.button>
            </div>

            {/* Accessibility Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000]"
                        />
                        <motion.div
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            className="fixed top-6 right-6 bottom-6 w-full max-w-[380px] bg-white rounded-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.2)] z-[10001] flex flex-col overflow-hidden border border-gray-100"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="p-6 bg-[#1D1D1F] text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Accessibility size={20} />
                                    </div>
                                    <h2 className="text-xl font-black tracking-tight">מרכז נגישות</h2>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* Font Size Control */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 tracking-widest flex items-center gap-2">
                                        <Type size={14} />
                                        גודל גופן: {settings.fontSize}%
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => updateFontSize(-10)}
                                            className="flex-1 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-colors"
                                        >
                                            <span className="text-lg font-bold">A-</span>
                                        </button>
                                        <button 
                                            onClick={() => updateFontSize(10)}
                                            className="flex-1 h-12 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-center transition-colors"
                                        >
                                            <span className="text-lg font-bold">A+</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Main Options Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <AccessibilityOption 
                                        active={settings.highContrast}
                                        onClick={() => toggleSetting('highContrast')}
                                        icon={<Contrast size={20} />}
                                        label="ניגודיות גבוהה"
                                    />
                                    <AccessibilityOption 
                                        active={settings.grayscale}
                                        onClick={() => toggleSetting('grayscale')}
                                        icon={<Eye size={20} />}
                                        label="גווני אפור"
                                    />
                                    <AccessibilityOption 
                                        active={settings.invert}
                                        onClick={() => toggleSetting('invert')}
                                        icon={<RotateCcw size={20} />}
                                        label="היפוך צבעים"
                                    />
                                    <AccessibilityOption 
                                        active={settings.underlineLinks}
                                        onClick={() => toggleSetting('underlineLinks')}
                                        icon={<LinkIcon size={20} />}
                                        label="הדגשת קישורים"
                                    />
                                    <AccessibilityOption 
                                        active={settings.readableFont}
                                        onClick={() => toggleSetting('readableFont')}
                                        icon={<Type size={20} />}
                                        label="גופן קריא"
                                    />
                                    <AccessibilityOption 
                                        active={settings.bigCursor}
                                        onClick={() => toggleSetting('bigCursor')}
                                        icon={<MousePointer2 size={20} />}
                                        label="סמן גדול"
                                    />
                                </div>

                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[11px] text-blue-600 font-bold leading-relaxed">
                                        ווידג׳ט זה מנגיש את האתר בהתאם לתקן WCAG 2.1 AA ולדרישות החוק הישראלי למוסדות חינוך.
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-gray-100">
                                <button 
                                    onClick={resetSettings}
                                    className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#1D1D1F] font-bold text-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    <span>איפוס כל ההגדרות</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style>{`
                .high-contrast {
                    --bg-opacity: 1 !important;
                    background-color: #000 !important;
                    color: #fff !important;
                }
                .high-contrast * {
                    border-color: #fff !important;
                    color: #fff !important;
                }
                .underline-links a {
                    text-decoration: underline !important;
                }
                .readable-font * {
                    font-family: Arial, sans-serif !important;
                }
                .big-cursor * {
                    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='black' stroke='white' stroke-width='2'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'/%3E%3C/svg%3E"), auto !important;
                }
            `}</style>
        </>
    );
};

const AccessibilityOption = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
            active 
                ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-gray-100'}`}>
            {active ? <Check size={18} /> : icon}
        </div>
        <span className="text-[11px] font-black tracking-tight">{label}</span>
    </button>
);

export default AccessibilityWidget;
