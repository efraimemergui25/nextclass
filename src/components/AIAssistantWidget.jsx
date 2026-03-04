import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistantWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'שלום! אני כאן לעזור לך להתאים את הציוד המושלם לכיתה או למעבדה שלך. מה התקציב או הצורך שלך היום?' }
    ]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Add user message
        const newMsg = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');

        // Simulate AI thinking and replying
        setTimeout(() => {
            const aiReply = { id: Date.now() + 1, sender: 'ai', text: 'הבנתי. בהתבסס על מה שציינת, הייתי מציע להסתכל על סדרת מסכי המגע מדגם Pro 75. להציג לך את המפרט המלא?' };
            setMessages(prev => [...prev, aiReply]);
        }, 1500);
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="absolute bottom-20 left-0 w-80 md:w-96 bg-white/95 backdrop-blur-2xl border border-gray-100/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform-gpu origin-bottom-left"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#007AFF] to-blue-500 p-6 text-white flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm">
                                    <span className="text-2xl pt-1">✨</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl leading-tight mb-0.5">nextclass AI</h3>
                                    <p className="text-blue-100 text-sm font-medium">היועץ הפדגוגי החכם שלך</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full focus:outline-none">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="h-80 overflow-y-auto p-6 bg-gray-50/50 spac-y-4 flex flex-col gap-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'ai'
                                        ? 'bg-white border border-gray-100 text-[#1D1D1F] self-start rounded-tr-none shadow-sm'
                                        : 'bg-[#007AFF] text-white self-end rounded-tl-none shadow-md'
                                        }`}
                                >
                                    {msg.text}
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="שאל אותי משהו..."
                                className="flex-1 bg-[#F5F5F7] text-[#1D1D1F] placeholder-gray-400 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 transition-all font-medium"
                            />
                            <button
                                onClick={handleSend}
                                className="w-10 h-10 bg-[#007AFF] text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm focus:outline-none cursor-pointer"
                            >
                                <svg className="w-4 h-4 rtl:-scale-x-100 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gradient-to-tr from-[#007AFF] to-blue-400 text-white w-16 h-16 rounded-full shadow-[0_8px_25px_rgba(0,122,255,0.4)] hover:shadow-[0_12px_30px_rgba(0,122,255,0.5)] transition-shadow duration-300 focus:outline-none flex items-center justify-center group relative cursor-pointer"
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <span className="text-3xl leading-none pt-1">✨</span>
            </motion.button>
        </div>
    );
};

export default AIAssistantWidget;
