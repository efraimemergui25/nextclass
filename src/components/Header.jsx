import React from 'react';

const Header = () => {
  return (
    <header className="w-full bg-white text-[#1D1D1F] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-5 md:px-12 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex-shrink-0">
          <a href="/" className="text-2xl tracking-tight focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded" aria-label="nextclass home">
            <span className="font-bold">next</span>
            <span className="font-light">class</span>
          </a>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
          <a href="#products" className="text-sm font-medium hover:text-[#007AFF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1 py-0.5">
            Products
          </a>
          <a href="#education" className="text-sm font-medium hover:text-[#007AFF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1 py-0.5">
            Education Solutions
          </a>
          <a href="#government" className="text-sm font-medium hover:text-[#007AFF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded px-1 py-0.5">
            Government Contracts
          </a>
        </nav>

        {/* Right: Utilities */}
        <div className="flex items-center space-x-6">
          <button aria-label="Shopping Cart" className="hover:text-[#007AFF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] rounded p-1">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
          <button className="bg-[#007AFF] text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF] shadow-sm">
            Institutional Login
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
