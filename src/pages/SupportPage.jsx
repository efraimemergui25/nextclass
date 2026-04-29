import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Download, Search, Sparkles, HelpCircle, BookOpen, Clock, ChevronLeft, Layout, Zap, Users, GraduationCap, ArrowRight } from 'lucide-react';
import PageTransition from '../components/PageTransition';

const AcademyCard = ({ title, duration, category, image, level }) => (
    <motion.div
        whileHover={{ y: -10, scale: 1.01 }}
        className="glass-apple gestalt-card overflow-hidden group cursor-pointer border border-white/50 shadow-sm bg-white/40"
    >
        <div className="aspect-[16/10] relative overflow-hidden">
            <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" alt={title} />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[1px]">
                <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#007AFF] shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500">
                    <Play fill="currentColor" size={20} className="ml-1" />
                </div>
            </div>
            <div className="absolute top-4 left-4 glass-apple px-3 py-1 rounded-full text-[9px] font-black text-white bg-black/40 backdrop-blur-xl border border-white/20">
                {level}
            </div>
        </div>
        <div className="p-8 text-right">
            <div className="flex items-center justify-end gap-2 mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#007AFF]">{category}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]" />
            </div>
            <h3 className="text-2xl font-apple-display text-[#1D1D1F] mb-6 leading-tight tracking-tight">{title}</h3>
            <div className="flex items-center justify-end gap-4 text-[10px] font-black text-gray-400">
                <div className="flex items-center gap-1.5">
                    <span>{duration}</span>
                    <Clock size={12} />
                </div>
                <div className="flex items-center gap-1.5">
                    <span>2.4k צפיות</span>
                    <Users size={12} />
                </div>
            </div>
        </div>
    </motion.div>
);

const PathCard = ({ title, count, icon: Icon, color }) => (
    <motion.div
        whileHover={{ x: -8, backgroundColor: 'rgba(255,255,255,0.95)' }}
        className="glass-apple gestalt-card p-6 flex items-center gap-6 cursor-pointer border border-white/60 bg-white/60"
    >
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-md`}>
            <Icon size={20} />
        </div>
        <div className="flex-1 text-right">
            <h4 className="text-lg font-bold text-[#1D1D1F] tracking-tight">{title}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{count} מדריכים זמינים</p>
        </div>
        <ChevronLeft className="text-gray-300 group-hover:text-[#007AFF] transition-colors" size={18} />
    </motion.div>
);

const SupportPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const tutorials = [
        { title: 'חיבור ראשוני והגדרות רשת מתקדמות', duration: '4:20', category: 'התקנה', level: 'מתחיל', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800' },
        { title: 'עבודה עם לוח EduEdit Studio', duration: '12:15', category: 'פדגוגיה', level: 'בינוני', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800' },
        { title: 'שיתוף מסך אלחוטי מכל מכשיר', duration: '3:45', category: 'קישוריות', level: 'מתחיל', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800' },
        { title: 'ניהול כיתה חכמה בזמן אמת', duration: '8:30', category: 'ניהול', level: 'מתקדם', image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800' },
    ];

    const learningPaths = [
        { title: '100 הימים הראשונים', count: 12, icon: BookOpen, color: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
        { title: 'מומחה EduEdit Studio', count: 24, icon: GraduationCap, color: 'bg-gradient-to-br from-purple-500 to-pink-600' },
    ];

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] pt-24 pb-20 w-full overflow-x-hidden">
                
                {/* ── Academy Hero ─────────────────────────── */}
                <section className="max-w-5xl mx-auto px-6 text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-[#007AFF] font-bold text-[9px] uppercase tracking-[0.25em] mb-10 border border-blue-100"
                    >
                        <Sparkles size={10} className="animate-glow-pulse" />
                        <span>NextClass Institute • המרכז לחדשנות פדגוגית</span>
                    </motion.div>
                    
                    <h1 className="text-5xl md:text-8xl font-apple-display text-[#1D1D1F] tracking-tighter mb-10 leading-[0.95]">
                        הכוח להוביל<br />
                        <span className="text-[#007AFF]">את הלמידה.</span>
                    </h1>

                    <div className="relative max-w-2xl mx-auto group">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="מה תרצו ללמוד היום?"
                            className="w-full bg-white/80 backdrop-blur-3xl border border-white/60 rounded-full px-16 py-6 text-lg outline-none focus:ring-[6px] focus:ring-[#007AFF]/5 focus:bg-white transition-all text-right shadow-sm"
                        />
                    </div>
                </section>

                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        
                        {/* ── Main Content Area ── */}
                        <div className="lg:col-span-8 flex flex-col gap-12">
                            
                            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                    {['הכל', 'התקנה', 'פדגוגיה', 'ניהול'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-6 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${activeTab === (tab === 'הכל' ? 'all' : tab) ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-500 hover:text-black border border-gray-100'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-apple-display text-[#1D1D1F] tracking-tight">מדריכי וידאו</h2>
                                    <p className="text-sm text-gray-400 font-medium">הדרכות שלב-אחר-שלב לכל שלבי ההטמעה.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {tutorials.map((t, i) => (
                                    <AcademyCard key={i} {...t} />
                                ))}
                            </div>

                            <button className="w-full py-4 border border-dashed border-gray-300 rounded-3xl text-gray-400 font-bold text-sm hover:border-[#007AFF] hover:text-[#007AFF] transition-all flex items-center justify-center gap-2">
                                <span>הצג הדרכות נוספות</span>
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        {/* ── Sidebar: Paths & Resources ── */}
                        <div className="lg:col-span-4 flex flex-col gap-8 sticky top-28">
                            
                            {/* Live Training Callout */}
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="glass-apple p-10 bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white shadow-2xl rounded-[2.5rem] relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-apple-display tracking-tight mb-4 leading-tight text-right">זקוקים להדרכה<br />בבית הספר?</h3>
                                <p className="text-white/80 font-medium mb-10 text-right leading-relaxed">צוות המדריכים שלנו יגיע אליכם להדרכה חיה ומותאמת אישית לצוות המורים.</p>
                                <a href="/contact" className="flex w-full py-4 bg-white text-[#007AFF] rounded-2xl items-center justify-center font-bold text-base shadow-xl hover:shadow-2xl transition-all">
                                    תאמו הדרכה עכשיו
                                </a>
                            </motion.div>

                            {/* Learning Paths */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest text-right px-4 mb-4">מסלולי למידה</h3>
                                {learningPaths.map((path, i) => (
                                    <PathCard key={i} {...path} />
                                ))}
                            </div>

                            {/* Resources Mini-Grid */}
                            <div className="glass-apple p-8 rounded-[2rem] border border-white/60 bg-white/40">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] text-right mb-8">משאבים נוספים</h4>
                                <div className="space-y-6">
                                    {[
                                        { icon: <Download />, label: 'מרכז הדרייברים', sub: 'v13.4' },
                                        { icon: <BookOpen />, label: 'מדריכי PDF', sub: '24 קבצים' },
                                        { icon: <Layout />, label: 'תבניות שיעור', sub: 'מעל 500' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-end gap-4 group cursor-pointer">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">{item.label}</p>
                                                <p className="text-[10px] font-black text-gray-400 uppercase opacity-60">{item.sub}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-[#007AFF] group-hover:text-white transition-all">
                                                {React.cloneElement(item.icon, { size: 16 })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default SupportPage;
