import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const FloatingInput = ({ label, type = "text", id, isTextArea = false }) => {
    const baseClasses = "peer w-full bg-white border-2 border-gray-200 rounded-2xl px-5 pt-6 pb-2 text-brand-dark font-medium text-base outline-none focus:border-brand-blue transition-colors placeholder-transparent";
    const labelClasses = "absolute right-5 top-2 text-xs font-bold text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-brand-blue";

    return (
        <div className="relative w-full">
            {isTextArea ? (
                <textarea
                    id={id}
                    placeholder=" "
                    rows={5}
                    className={`${baseClasses} resize-none`}
                />
            ) : (
                <input type={type} id={id} placeholder=" " className={baseClasses} />
            )}
            <label htmlFor={id} className={labelClasses}>
                {label}
            </label>
        </div>
    );
};

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
                        <h1 className="text-4xl md:text-6xl font-black text-brand-dark tracking-tight mb-4">
                            צור קשר
                        </h1>
                        <p className="text-lg md:text-xl text-gray-500 font-light">
                            נשמח לשמוע מכם ולהתאים את הפתרון המושלם למוסד שלכם.
                        </p>
                    </motion.div>

                    {/* Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">

                        {/* Right Column (Form - RTL Start) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm">
                                <h2 className="text-3xl font-black text-brand-dark mb-8">שלחו לנו הודעה</h2>

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
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full bg-brand-blue text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-600 hover:shadow-lg transition-all mt-2 focus:outline-none focus:ring-4 focus:ring-brand-blue/30"
                                    >
                                        שלח פנייה ליועץ פדגוגי
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Left Column (Direct Info - RTL End) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-10"
                        >
                            {/* Address */}
                            <div>
                                <h3 className="text-sm font-bold text-brand-blue tracking-[0.15em] uppercase mb-3">הכתובת שלנו</h3>
                                <p className="text-xl font-bold text-brand-dark mb-1">עורק החדשנות, פארק המדע</p>
                                <p className="text-lg text-gray-500">נס ציונה, ישראל</p>
                            </div>

                            {/* Contact Details */}
                            <div>
                                <h3 className="text-sm font-bold text-brand-blue tracking-[0.15em] uppercase mb-3">דברו איתנו</h3>
                                <a href="tel:0779991234" className="text-xl font-bold text-brand-dark hover:text-brand-blue transition-colors block mb-2" dir="ltr">
                                    077-999-1234
                                </a>
                                <a href="mailto:hello@nextclass.co.il" className="text-lg text-gray-500 hover:text-brand-blue transition-colors block">
                                    hello@nextclass.co.il
                                </a>
                            </div>

                            {/* Social */}
                            <div>
                                <h3 className="text-sm font-bold text-brand-blue tracking-[0.15em] uppercase mb-4">עקבו אחרינו</h3>
                                <div className="flex flex-col gap-4">
                                    <a href="#" className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
                                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-brand-dark block group-hover:text-brand-blue transition-colors">WhatsApp</span>
                                            <span className="text-sm text-gray-400">זמינים בוואטסאפ לכל שאלה</span>
                                        </div>
                                    </a>

                                    <a href="#" className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center text-white shrink-0">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-bold text-brand-dark block group-hover:text-brand-blue transition-colors">Instagram</span>
                                            <span className="text-sm text-gray-400">עדכונים, השראה וצצים מהשטח</span>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="w-full aspect-video bg-gray-200 rounded-3xl overflow-hidden shadow-sm relative">
                                <img
                                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"
                                    alt="Map Area - Nes Ziona Science Park"
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg text-center">
                                        <span className="font-bold text-brand-dark block">פארק המדע, נס ציונה</span>
                                        <span className="text-sm text-gray-500">לחצו לניווט ב-Google Maps</span>
                                    </div>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default ContactPage;
