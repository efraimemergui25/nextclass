import React from 'react';
import PageTransition from '../components/PageTransition';

const CatalogPage = () => {
    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] min-h-full font-sans text-[#1D1D1F] antialiased flex">

                {/* 2. Left Sidebar (Smart Filters) */}
                <aside className="hidden lg:block w-72 bg-white border-r border-gray-100 min-h-[calc(100vh-73px)] p-8">
                    <h2 className="text-xl font-bold tracking-tight mb-8">Filters</h2>

                    {/* Filter Category 1 */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4 cursor-pointer">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Manufacturer</h3>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" defaultChecked />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">Nexus Systems</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">AeroTech</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">Quantum Compute</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Category 2 */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4 cursor-pointer">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Compatibility</h3>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" defaultChecked />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">2U Rackmount</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">4U Expansion</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Category 3 */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4 cursor-pointer">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Stock Status</h3>
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" defaultChecked />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">In Stock (Domestic)</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input type="checkbox" className="form-checkbox h-4 w-4 text-[#007AFF] border-gray-300 rounded focus:ring-[#007AFF]" />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1D1D1F] transition-colors">Available on Backorder</span>
                            </label>
                        </div>
                    </div>

                </aside>

                <main className="flex-1 w-full px-6 py-8 md:px-10 lg:px-12">

                    {/* 1. Header Area */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3">Server Components & Hardware</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4">
                            <p className="text-sm font-medium text-gray-500 mb-4 sm:mb-0">Showing 42 results for <span className="text-[#1D1D1F] font-semibold">Contract #9982</span></p>

                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Sort by:</span>
                                <select className="text-sm font-semibold text-[#1D1D1F] bg-transparent border-none focus:ring-0 cursor-pointer pr-8 outline-none appearance-none">
                                    <option>Relevance</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 gap-6">

                        {/* Card 1 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                            <div className="w-full aspect-square bg-[#F5F5F7] rounded-xl mb-6 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-widest mb-1.5">SKU: NX-8842-A</h3>
                            <p className="text-base font-medium text-gray-600 leading-snug mb-4 flex-1">NexusBlade Enterprise Server 2U Base Array</p>

                            <div className="mb-6">
                                <p className="text-xs text-gray-400 mb-0.5">Contract Price</p>
                                <p className="text-xl font-semibold text-[#1D1D1F]">$13,450.00</p>
                            </div>

                            <button className="w-full py-2.5 px-4 bg-transparent border-2 border-[#007AFF] text-[#007AFF] rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1">
                                View Specs
                            </button>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                            <div className="w-full aspect-square bg-[#F5F5F7] rounded-xl mb-6 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-widest mb-1.5">SKU: MEM-D4-64E</h3>
                            <p className="text-base font-medium text-gray-600 leading-snug mb-4 flex-1">64GB DDR4 ECC RAM Module (Certified)</p>

                            <div className="mb-6">
                                <p className="text-xs text-gray-400 mb-0.5">Contract Price</p>
                                <p className="text-xl font-semibold text-[#1D1D1F]">$320.00</p>
                            </div>

                            <button className="w-full py-2.5 px-4 bg-transparent border-2 border-[#007AFF] text-[#007AFF] rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1">
                                View Specs
                            </button>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                            <div className="w-full aspect-square bg-[#F5F5F7] rounded-xl mb-6 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-widest mb-1.5">SKU: NET-25G-SFP</h3>
                            <p className="text-base font-medium text-gray-600 leading-snug mb-4 flex-1">Dual-port 25GbE SFP28 Network Adapter</p>

                            <div className="mb-6">
                                <p className="text-xs text-gray-400 mb-0.5">Contract Price</p>
                                <p className="text-xl font-semibold text-[#1D1D1F]">$685.00</p>
                            </div>

                            <button className="w-full py-2.5 px-4 bg-transparent border-2 border-[#007AFF] text-[#007AFF] rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1">
                                View Specs
                            </button>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col border border-gray-100">
                            <div className="w-full aspect-square bg-[#F5F5F7] rounded-xl mb-6 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-widest mb-1.5">SKU: SSD-384-NVM</h3>
                            <p className="text-base font-medium text-gray-600 leading-snug mb-4 flex-1">3.84TB NVMe Enterprise Mixed-Use SSD</p>

                            <div className="mb-6">
                                <p className="text-xs text-gray-400 mb-0.5">Contract Price</p>
                                <p className="text-xl font-semibold text-[#1D1D1F]">$890.00</p>
                            </div>

                            <button className="w-full py-2.5 px-4 bg-transparent border-2 border-[#007AFF] text-[#007AFF] rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1">
                                View Specs
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </PageTransition>
    );
};

export default CatalogPage;
