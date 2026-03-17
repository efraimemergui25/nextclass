import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistantWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const scrollBottomRef = useRef(null);

    // Initial mock messages
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: 'שלום! אני כאן לעזור לך להתאים את הטכנולוגיה המושלמת לכיתה. מה הצרכים שלכם השנה?'
        }
    ]);

    // Show only after scrolling past 50% of the viewport (Synchronized with WhatsApp)
    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > window.innerHeight * 0.5);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollBottomRef.current) {
            scrollBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add User Message
        const newMessages = [...messages, { role: 'user', text: inputValue }];
        setMessages(newMessages);
        setInputValue('');

        // Simulate AI Response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'הבנתי, אני בודק את הקטלוג שלנו עבור הפתרון המתאים ביותר...'
            }]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`fixed bottom-8 right-8 z-[50] w-14 h-14 bg-[#007AFF] text-white rounded-full shadow-2xl flex items-center justify-center focus:outline-none transition-apple-fluid ${isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-10 scale-50 pointer-events-none'
                    }`}
                aria-label="פתח יועץ פדגוגי"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 100, x: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 100, x: -50 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        style={{ transformOrigin: 'bottom right' }}
                        className="fixed bottom-24 right-8 w-[350px] h-[500px] glass-light shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden flex flex-col z-[150] transition-apple-fluid"
                    >
                        {/* Header */}
                        <div className="bg-white/50 border-b border-gray-100 p-4 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[#1D1D1F] font-bold tracking-tight">nextclass AI</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-3 -m-1 hover:bg-gray-200/50 rounded-full transition-apple-fluid active:scale-95 flex items-center justify-center min-w-[44px] min-h-[44px]"
                            >
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto bg-[#F5F5F7]/30 flex flex-col gap-4">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] text-sm leading-relaxed px-4 py-2 shadow-sm ${msg.role === 'user'
                                            ? 'bg-[#007AFF] text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-white border border-gray-100 text-[#1D1D1F] rounded-2xl rounded-tl-sm'
                                            }`}
                                        dir={msg.role === 'user' ? 'rtl' : 'rtl'} // Keeping RTL consistent for Hebrew
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={scrollBottomRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white/50 border-t border-gray-100 shrink-0">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="כתוב הודעה... "
                                    className="w-full bg-[#F5F5F7] border-2 border-transparent focus:border-[#007AFF]/20 focus:ring-2 focus:ring-[#007AFF]/10 rounded-full px-4 py-3 text-sm transition-all outline-none pr-12 text-right"
                                    dir="rtl"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleSend}
                                    className="absolute left-2 w-10 h-10 bg-[#007AFF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-apple-fluid"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistantWidget;

