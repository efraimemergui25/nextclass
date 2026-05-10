import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// Removed readFooterContent helper

const Footer = () => {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const logoClickRef = useRef({ count: 0, timer: null });
    
    const content = useMemo(() => ({
        siteName:  getSetting('site_name', 'NextClass'),
        phone:     getSetting('contact_phone', '03-9999999'),
        email:     getSetting('contact_email', 'info@nextclass.co.il'),
        address:   getSetting('contact_address', 'תל אביב, ישראל'),
        copyright: getSetting('footer_copyright', '© 2026 NextClass. כל הזכויות שמורות.'),
        tagline:   getSetting('footer_tagline', 'אנחנו מעצבים את הכלים שמעצימים את דור המחר. חדשנות, איכות וחזון בכל כיתה.'),
        loveMsg:   getSetting('footer_love_msg', 'נבנה באהבה לחינוך'),
        col1:      getSetting('footer_col1_title', 'פתרונות'),
        col1Items: getSetting('footer_col1_items', 'מסכים חכמים, מחשוב וטאבלטים, מעבדות STEM, תשתיות למידה').split(',').map(s => s.trim()),
        col2:      getSetting('footer_col2_title', 'האקדמיה'),
        col2Items: getSetting('footer_col2_items', 'מרכז עזרה, מדריכי וידאו, בלוג חדשנות, תמיכה טכנית').split(',').map(s => s.trim()),
        col3:      getSetting('footer_col3_title', 'קשר'),
        privacy:   getSetting('footer_privacy', 'Privacy'),
        terms:     getSetting('footer_terms', 'Terms'),
        location:  getSetting('footer_location', 'ISRAEL | HEBREW'),
    }), [getSetting]);

    const handleLogoClick = useCallback((e) => {
        e.preventDefault();
        logoClickRef.current.count += 1;
        clearTimeout(logoClickRef.current.timer);
        logoClickRef.current.timer = setTimeout(() => {
            if (logoClickRef.current.count === 1) navigate('/');
            logoClickRef.current.count = 0;
        }, 500);
        if (logoClickRef.current.count >= 3) {
            clearTimeout(logoClickRef.current.timer);
            logoClickRef.current.count = 0;
            navigate('/admin');
        }
    }, [navigate]);

    // Removed storage listener (handled by SettingsContext)
    return (
        <footer className="relative bg-[#F5F5F7] pt-12 sm:pt-20 pb-8 sm:pb-12 w-full mt-auto overflow-hidden border-t border-gray-200/50">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-[100px] -ml-32 -mb-32" />

            <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-20 mb-12 sm:mb-20">

                    {/* Brand & Narrative */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <Link to="/" onClick={handleLogoClick} className="text-2xl md:text-3xl font-apple-display text-[#1D1D1F] tracking-tighter hover:opacity-80 transition-all w-fit uppercase font-black">
                            {content.siteName}
                        </Link>
                        <p className="text-xl text-gray-400 font-medium leading-[1.2] max-w-sm">
                            {content.tagline}
                        </p>
                        <div className="flex items-center gap-4 text-gray-300">
                             <Sparkles size={16} className="text-[#007AFF] animate-glow-pulse" />
                            <div className="w-px h-6 bg-gray-200" />
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">{content.loveMsg}</p>
                        </div>
                    </div>

                    {/* Solutions Grid */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10">
                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-[#1D1D1F] mb-6 uppercase tracking-[0.2em]">{content.col1}</h4>
                            <nav className="flex flex-col space-y-3">
                                {content.col1Items.map(item => (
                                    <Link key={item} to="/catalog" className="text-gray-500 font-bold text-sm hover:text-[#007AFF] transition-all w-fit">{item}</Link>
                                ))}
                            </nav>
                        </div>

                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-[#1D1D1F] mb-6 uppercase tracking-[0.2em]">{content.col2}</h4>
                            <nav className="flex flex-col space-y-3">
                                {content.col2Items.map(item => (
                                    <Link key={item} to="/help" className="text-gray-500 font-bold text-sm hover:text-[#007AFF] transition-all w-fit">{item}</Link>
                                ))}
                            </nav>
                        </div>

                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-[#1D1D1F] mb-6 uppercase tracking-[0.2em]">{content.col3}</h4>
                            <div className="flex flex-col space-y-5">
                                <a href={`tel:${content.phone}`} className="flex items-center gap-3 text-gray-500 font-bold text-sm hover:text-[#007AFF] transition-all" dir="ltr">
                                    <Phone size={14} />
                                    <span>{content.phone}</span>
                                </a>
                                <a href={`mailto:${content.email}`} className="flex items-center gap-3 text-gray-500 font-bold text-sm hover:text-[#007AFF] transition-all">
                                    <Mail size={14} />
                                    <span>{content.email}</span>
                                </a>
                                <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                                    <MapPin size={14} />
                                    <span>{content.address}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-gray-200/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        <span>{content.copyright}</span>
                    </div>
                    
                    <div className="flex gap-6 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        <Link to="/" className="hover:text-[#007AFF] transition-colors">{content.privacy}</Link>
                        <Link to="/" className="hover:text-[#007AFF] transition-colors">{content.terms}</Link>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full glass-apple border border-gray-200/50 shadow-sm bg-white/50">
                        <Globe size={12} className="text-[#007AFF]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1D1D1F]">{content.location}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
