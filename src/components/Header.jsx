import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MenuOverlay from './MenuOverlay';
import CartDrawer from './CartDrawer';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Prevent scrolling when menu/cart is open
    useEffect(() => {
        if (isMenuOpen || isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isMenuOpen, isCartOpen]);

    return (
        <>
            {/* Dynamic Island Persistent Pill */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[50] w-[90%] md:w-[85%] lg:w-[70%] max-w-5xl">
                <div className="bg-white/70 backdrop-blur-3xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-6 md:px-8 py-3 w-full flex justify-between items-center transition-all duration-300">

                    {/* Visual Start (RTL Right) - Premium Logo */}
                    <Link to="/" className="flex items-center gap-2.5 text-[#1D1D1F] hover:opacity-80 transition-opacity duration-300 group">
                        {/* Geometric Gestalt Icon */}
                        <svg className="w-7 h-7 md:w-8 md:h-8 shrink-0" viewBox="0 0 32 32" fill="none">
                            <circle cx="12" cy="16" r="9" stroke="#1D1D1F" strokeWidth="2" className="transition-all duration-300" />
                            <circle cx="20" cy="16" r="9" stroke="#007AFF" strokeWidth="2" fill="#007AFF" fillOpacity="0.1" />
                        </svg>
                        <div className="text-xl md:text-2xl tracking-tighter hidden sm:block">
                            <span className="font-black">next</span><span className="font-light text-[#007AFF]">class</span>
                        </div>
                    </Link>

                    {/* Quick Desktop Links (Law of Proximity) */}
                    <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-sm font-bold text-[#1D1D1F]">
                        <Link to="/catalog" className="hover:text-[#007AFF] transition-colors">מסכים</Link>
                        <Link to="/compare" className="hover:text-[#007AFF] transition-colors">השוואת דגמים</Link>
                        <Link to="/checkout" className="hover:text-[#007AFF] transition-colors">קופה</Link>
                    </div>

                    {/* Visual End (RTL Left) - Actions */}
                    <div className="flex items-center gap-4 md:gap-5">
                        {/* Shopping Cart Icon */}
                        <motion.button
                            onClick={() => setIsCartOpen(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative focus:outline-none p-1 text-[#1D1D1F] hover:text-[#007AFF] transition-colors duration-300"
                            aria-label="עגלת קניות"
                        >
                            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            {/* Dummy Cart Badge */}
                            <span className="absolute top-0 right-0 bg-[#007AFF] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center translate-x-1/4 -translate-y-1/4 shadow-sm">
                                3
                            </span>
                        </motion.button>

                        {/* Hamburger Menu - Elegant 2 lines */}
                        <motion.button
                            onClick={() => setIsMenuOpen(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="focus:outline-none p-1 text-[#1D1D1F] hover:text-[#007AFF] transition-colors duration-300"
                            aria-label="תפריט"
                        >
                            <svg className="w-7 h-7 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
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
