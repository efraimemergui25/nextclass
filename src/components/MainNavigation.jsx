import React from 'react';

const MainNavigation = () => {
    return (
        <nav className="w-full bg-white text-[#1D1D1F] border-b border-gray-100 font-sans antialiased relative z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 md:px-12 flex items-center justify-between">

                {/* Left: Brand */}
                <div className="flex-shrink-0 mr-8">
                    <a href="/" className="text-2xl tracking-tight focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded" aria-label="nextclass home">
                        <span className="font-bold">next</span>
                        <span className="font-light">class</span>
                    </a>
                </div>

                {/* Center: Desktop Navigation architecture */}
                <div className="hidden lg:flex items-center space-x-8 flex-1">

                    {/* Dropdown 1: Hardware & Systems */}
                    <div className="group relative">
                        <button className="flex items-center text-sm lg:text-base font-medium hover:text-[#007AFF] transition-colors duration-150 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1">
                            Hardware & Systems
                            <svg className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-[#007AFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Mega-Menu Panel (Zero-delay hover) */}
                        <div className="absolute left-0 top-full pt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-0">
                            <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-6 w-64 ring-1 ring-black ring-opacity-5">
                                <ul className="space-y-4">
                                    <li>
                                        <a href="#network" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Network Infrastructure
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#euc" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            End-User Computing
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#servers" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Server Components
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Dropdown 2: Sectors */}
                    <div className="group relative">
                        <button className="flex items-center text-sm lg:text-base font-medium hover:text-[#007AFF] transition-colors duration-150 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1">
                            Sectors
                            <svg className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-[#007AFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Mega-Menu Panel */}
                        <div className="absolute left-0 top-full pt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-0">
                            <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-6 w-64 ring-1 ring-black ring-opacity-5">
                                <ul className="space-y-4">
                                    <li>
                                        <a href="#defense" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Defense & Government
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#education" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Education / Classroom Tech
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#local" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Local Municipalities
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Dropdown 3: Compliance & Capabilities */}
                    <div className="group relative">
                        <button className="flex items-center text-sm lg:text-base font-medium hover:text-[#007AFF] transition-colors duration-150 py-2 focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1">
                            Compliance & Capabilities
                            <svg className="w-3.5 h-3.5 ml-1.5 text-gray-400 group-hover:text-[#007AFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Mega-Menu Panel */}
                        <div className="absolute left-0 top-full pt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-0">
                            <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-6 w-[280px] ring-1 ring-black ring-opacity-5">
                                <ul className="space-y-4">
                                    <li>
                                        <a href="#security" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Security Standards
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#logistics" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Supply Chain Logistics
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#vendor" className="block text-sm text-[#1D1D1F] hover:text-[#007AFF] font-medium transition-colors">
                                            Vendor Certifications
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Simple Link */}
                    <div>
                        <a href="#support" className="text-sm lg:text-base font-medium hover:text-[#007AFF] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1 py-2">
                            Procurement & Support
                        </a>
                    </div>

                </div>

                {/* Right: Primary CTA */}
                <div className="flex items-center ml-4">
                    <button className="hidden sm:block bg-[#007AFF] text-white px-6 py-2.5 rounded-md text-sm lg:text-base font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] shadow-sm whitespace-nowrap">
                        Enterprise Portal Login
                    </button>

                    {/* Mobile menu button (Hamburger placeholder for responsiveness) */}
                    <button className="lg:hidden ml-4 text-[#1D1D1F] hover:text-[#007AFF] focus:outline-none p-1">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default MainNavigation;
