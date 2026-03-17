import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-100 pt-20 pb-10 w-full mt-auto relative z-10">
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
                {/* Main 4-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* RTL Column 1: Brand */}
                    <div className="flex flex-col">
                        <Link to="/" className="text-2xl font-black tracking-tighter text-[#1D1D1F] mb-4 hover:opacity-80 active:scale-[0.97] transition-all w-fit">
                            next<span className="font-light text-[#007AFF]">class</span>
                        </Link>
                        <p className="text-gray-500 font-normal leading-relaxed">
                            הטכנולוגיה שמאחורי החינוך הטוב בישראל.
                        </p>
                    </div>

                    {/* RTL Column 2: Solutions — Route to catalog with category filter */}
                    <div className="flex flex-col">
                        <h4 className="font-black text-[#1D1D1F] mb-6 text-lg tracking-tighter">פתרונות</h4>
                        <nav className="flex flex-col space-y-3">
                            <Link to="/catalog?category=מסכים אינטראקטיביים והקרנה" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">מסכים חכמים</Link>
                            <Link to="/catalog?category=מחשוב לצוות ותלמידים" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">מחשוב וטאבלטים</Link>
                            <Link to="/catalog?category=מעבדות STEM ומרחבי חדשנות" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">מעבדות STEM</Link>
                        </nav>
                    </div>

                    {/* RTL Column 3: Support */}
                    <div className="flex flex-col">
                        <h4 className="font-black text-[#1D1D1F] mb-6 text-lg tracking-tighter">שירות ותמיכה</h4>
                        <nav className="flex flex-col space-y-3">
                            <Link to="/help" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">מרכז עזרה</Link>
                            <Link to="/help" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">תקנון אחריות</Link>
                            <Link to="/contact" className="text-gray-500 hover:text-[#007AFF] hover:translate-x-[-4px] active:scale-[0.97] transition-all w-fit">צור קשר</Link>
                        </nav>
                    </div>

                    {/* RTL Column 4: Contact */}
                    <div className="flex flex-col">
                        <h4 className="font-black text-[#1D1D1F] mb-6 text-lg tracking-tighter">דברו איתנו</h4>
                        <div className="flex flex-col space-y-3 text-gray-500">
                            <a href="mailto:hello@nextclass.co.il" className="hover:text-[#007AFF] active:scale-[0.97] transition-all w-fit">hello@nextclass.co.il</a>
                            <a href="tel:0546398257" className="hover:text-[#007AFF] active:scale-[0.97] transition-all w-fit" dir="ltr">054-6398257</a>
                            <span>פארק המדע, נס ציונה</span>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                    <div>© 2026 nextclass. כל הזכויות שמורות.</div>
                    <div className="mt-4 md:mt-0 flex gap-6">
                        <Link to="/" className="hover:text-[#007AFF] active:scale-[0.97] transition-all">מדיניות פרטיות</Link>
                        <Link to="/" className="hover:text-[#007AFF] active:scale-[0.97] transition-all">תנאי שימוש</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
