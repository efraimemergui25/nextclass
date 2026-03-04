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
                        <div className="text-2xl font-black tracking-tighter text-brand-dark mb-4">
                            next<span className="font-light">class</span>
                        </div>
                        <p className="text-gray-500 font-normal leading-relaxed">
                            הטכנולוגיה שמאחורי החינוך הטוב בישראל.
                        </p>
                    </div>

                    {/* RTL Column 2: Solutions */}
                    <div className="flex flex-col">
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">פתרונות</h4>
                        <nav className="flex flex-col space-y-3">
                            <Link to="/catalog" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">מסכי מגע</Link>
                            <Link to="/stem" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">מעבדות STEM</Link>
                            <Link to="/digital-signage" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">שילוט דיגיטלי</Link>
                        </nav>
                    </div>

                    {/* RTL Column 3: Support */}
                    <div className="flex flex-col">
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">שירות ותמיכה</h4>
                        <nav className="flex flex-col space-y-3">
                            <Link to="/help" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">מרכז עזרה</Link>
                            <Link to="/warranty" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">תקנון אחריות</Link>
                            <Link to="/contact" className="text-gray-500 hover:text-brand-blue transition-colors w-fit">צור קשר</Link>
                        </nav>
                    </div>

                    {/* RTL Column 4: Contact */}
                    <div className="flex flex-col">
                        <h4 className="font-bold text-brand-dark mb-6 text-lg">דברו איתנו</h4>
                        <div className="flex flex-col space-y-3 text-gray-500">
                            <a href="mailto:hello@nextclass.co.il" className="hover:text-brand-blue transition-colors w-fit">hello@nextclass.co.il</a>
                            <a href="tel:0546398257" className="hover:text-brand-blue transition-colors w-fit" dir="ltr">054-6398257</a>
                            <span>פארק המדע, נס ציונה</span>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar Content */}
                <div className="border-t border-gray-100 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                    <div>© 2026 nextclass. כל הזכויות שמורות.</div>
                    <div className="mt-4 md:mt-0 flex gap-6">
                        <Link to="/privacy" className="hover:text-brand-blue transition-colors">מדיניות פרטיות</Link>
                        <Link to="/terms" className="hover:text-brand-blue transition-colors">תנאי שימוש</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
