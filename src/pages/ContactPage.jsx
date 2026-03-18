import { Phone, Mail, MapPin } from 'lucide-react';

const ContactPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <PageTransition>
            <div className="min-h-screen bg-brand-light pt-32 pb-24 px-6 w-full">
                <div className="max-w-[1400px] mx-auto">

                    {/* Page Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-brand-dark tracking-tighter mb-4 leading-[1.1]">
                            צור קשר
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 font-normal leading-relaxed max-w-2xl mx-auto">
                            נשמח לשמוע מכם ולהתאים את הפתרון המושלם למוסד שלכם.
                        </p>
                    </motion.div>

                    {/* Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

                        {/* Right Column (Form - RTL Start) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-7"
                        >
                            <div className="bg-white/60 backdrop-blur-3xl backdrop-saturate-[1.5] border border-white/60 p-8 md:p-12 rounded-[2rem] shadow-[0_20px_40px_rgb(0_0_0/0.04)]">
                                <h2 className="text-3xl md:text-4xl font-black text-brand-dark mb-8 tracking-tighter">שלחו לנו הודעה</h2>

                                <div className="flex flex-col gap-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FloatingInput label="שם מלא" id="fullName" />
                                        <FloatingInput label="שם המוסד / בית הספר" id="school" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FloatingInput label="תפקיד" id="role" />
                                        <FloatingInput label="טלפון" id="phone" type="tel" />
                                    </div>
                                    <FloatingInput label="מה נוכל לעזור?" id="message" isTextArea />

                                    <motion.button
                                        whileHover={{ scale: 1.01, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
                                        className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold tracking-wide text-xl hover:bg-blue-600 shadow-[0_10px_30px_rgb(0_122_255/0.2)] hover:shadow-[0_15px_40px_rgb(0_122_255/0.4)] transition-all mt-2 focus:outline-none"
                                    >
                                        שלח פנייה ליועץ פדגוגי
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Left Column (Glass Contact Card - RTL End) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-5 flex flex-col gap-8"
                        >
                            <div className="p-10 bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/30 shadow-[0_20px_40px_rgb(0_0_0/0.06)]">
                                <div className="space-y-10">
                                    {/* Address */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <MapPin className="w-5 h-5 text-[#007AFF]" />
                                            <h3 className="text-[#007AFF] text-sm font-black uppercase tracking-widest">הכתובת שלנו</h3>
                                        </div>
                                        <p className="text-[#1D1D1F] text-2xl font-black tracking-tight mb-1">
                                            עורק החדשנות, פארק המדע
                                        </p>
                                        <p className="text-[#1D1D1F] text-lg font-bold opacity-60">
                                            נס ציונה, ישראל
                                        </p>
                                    </div>

                                    {/* Direct Contact */}
                                    <div>
                                        <h3 className="text-[#007AFF] text-sm font-black uppercase tracking-widest mb-4">דברו איתנו</h3>

                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center gap-5 group">
                                                <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center text-[#1D1D1F]/50 group-hover:text-[#007AFF] transition-colors">
                                                    <Phone className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <a href="tel:077-999-1234" className="text-[#1D1D1F] text-2xl font-black tracking-tighter hover:text-[#007AFF] transition-colors">
                                                        077-999-1234
                                                    </a>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">זמינים עכשיו בוואטסאפ</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <motion.a
                                                href="https://wa.me/972779991234"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#007AFF] text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.98] transition-all"
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" alt="WhatsApp" className="w-6 h-6 brightness-0 invert" />
                                                שלח הודעה מהירה
                                            </motion.a>

                                            <div className="flex items-center gap-5 pt-4 border-t border-white/20 group">
                                                <div className="w-12 h-12 bg-white/50 rounded-2xl flex items-center justify-center text-[#1D1D1F]/50 group-hover:text-[#007AFF] transition-colors">
                                                    <Mail className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">דוא״ל רשמי</span>
                                                    <a href="mailto:hello@nextclass.co.il" className="text-[#1D1D1F] text-lg font-bold hover:text-[#007AFF] transition-colors">
                                                        hello@nextclass.co.il
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Map Area */}
                            <div className="w-full aspect-video bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/30 overflow-hidden shadow-lg relative group">
                                <img
                                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200"
                                    alt="Map Area - Nes Ziona Science Park"
                                    className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl scale-100 group-hover:scale-110 transition-transform duration-500">
                                        <MapPin className="w-8 h-8 text-[#007AFF] mx-auto mb-2" />
                                        <span className="font-black text-[#1D1D1F] block text-lg">פארק המדע, נס ציונה</span>
                                        <span className="text-sm font-bold text-[#007AFF]">לחצו לניווט ב-Waze</span>
                                    </div>
                                </div>
                                <a
                                    href="https://www.google.com/maps/dir/?api=1&destination=31.9388,34.7892"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 z-10"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ContactPage;
