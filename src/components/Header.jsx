import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent scrolling when menu/cart is open
    useEffect(() => {
        if (isMenuOpen || isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isMenuOpen, isCartOpen]);

    const headerClasses = isScrolled
        ? "bg-white/80 backdrop-blur-xl shadow-sm"
        : "bg-transparent";

    const textColors = isScrolled ? "text-[#1D1D1F]" : "text-[#FFFFFF]";

    return (
        <>
            <header className={`fixed w-full top-0 z-50 transition-all duration-300 ease-in-out ${headerClasses}`}>
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">

                    {/* Visual Start (RTL Right) - Logo */}
                    <div className={`text-2xl font-black tracking-tighter ${textColors} transition-colors duration-300`}>
                        next<span className="font-light">class</span>
                    </div>

                    {/* Visual End (RTL Left) - Actions */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Shopping Cart Icon */}
                        <motion.button
                            onClick={() => setIsCartOpen(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative focus:outline-none p-2 -m-2 ${textColors} hover:text-[#007AFF] transition-colors duration-300`}
                            aria-label="עגלת קניות"
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {/* Dummy Cart Badge */}
                            <span className="absolute top-0 right-0 bg-brand-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 shadow-sm">
                                3
                            </span>
                        </motion.button>

                        {/* Hamburger Menu */}
                        <motion.button
                            onClick={() => setIsMenuOpen(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`focus:outline-none p-2 -m-2 ${textColors} hover:text-[#007AFF] transition-colors duration-300`}
                            aria-label="תפריט"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </motion.button>
                    </div>

                </div>
            </header>

            <MenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
};

export default Header;
