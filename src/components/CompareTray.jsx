import React from 'react';

const IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 800 600'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f9fafb'/%3E%3Cstop offset='100%25' stop-color='%23e5e7eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Ccircle cx='400' cy='280' r='40' stroke='%231D1D1F' stroke-width='3' fill='none'/%3E%3Ccircle cx='415' cy='280' r='40' stroke='%23007AFF' stroke-width='3' fill='%23007AFF' fill-opacity='0.1'/%3E%3Ctext x='400' y='360' font-family='sans-serif' font-size='24' font-weight='bold' letter-spacing='4' fill='%239ca3af' text-anchor='middle'%3ENEXTCLASS%3C/text%3E%3C/svg%3E";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../context/CompareContext';

const CompareTray = () => {
    const { selectedForCompare, removeFromCompare, clearCompare } = useCompare();
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {selectedForCompare.length > 0 && (
                <motion.div
                    initial={{ y: 120, opacity: 0, x: '-50%', scale: 0.92 }}
                    animate={{ y: 0, opacity: 1, x: '-50%', scale: 1 }}
                    exit={{ y: 120, opacity: 0, x: '-50%', scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.9 }}
                    style={{
                        left: '50%',
                        background: 'rgba(255,255,255,0.75)',
                        backdropFilter: 'blur(48px) saturate(2.0)',
                        WebkitBackdropFilter: 'blur(48px) saturate(2.0)',
                        border: '1px solid rgba(255,255,255,0.75)',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.10), 0 8px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                    }}
                    className="fixed bottom-8 z-[60] rounded-full px-4 py-3 flex items-center justify-between gap-6 md:gap-12 min-w-[320px] md:min-w-[450px] transform-gpu will-change-transform"
                >
                    {/* RTL Right: avatars and count */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3 space-x-reverse">
                            {selectedForCompare.map((item) => (
                                <div key={item.id} className="relative group rounded-full">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-[#F5F5F7]">
                                        <img
                                            src={item.imageUrl || item.image}
                                            alt={item.title || item.name}
                                            className="w-full h-full object-cover mix-blend-multiply"
                                            onError={(e) => { e.target.onerror = null; e.target.src = IMG_FALLBACK; }}
                                        />
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFromCompare(item.id); }}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center transition-all text-xs hover:scale-110 active:scale-90 shadow-md"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-[#1D1D1F] text-sm md:text-base leading-tight">
                                {selectedForCompare.length} {selectedForCompare.length === 1 ? 'דגם נבחר' : 'דגמים נבחרו'}
                            </span>
                            <button
                                onClick={clearCompare}
                                className="text-[11px] text-gray-400 font-medium hover:text-red-500 active:scale-[0.97] transition-all text-right"
                            >
                                נקה הכל
                            </button>
                        </div>
                    </div>

                    {/* RTL Left: CTA — Full Innovation Blue with glow */}
                    <motion.button
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/compare')}
                        className="bg-[#007AFF] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_8px_16px_rgb(0_122_255/0.25)] hover:shadow-[0_12px_24px_rgb(0_122_255/0.4)] transition-all duration-300 whitespace-nowrap"
                    >
                        השווה עכשיו
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CompareTray;
