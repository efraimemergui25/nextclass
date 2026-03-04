import React from 'react';

const ProductDetail = () => {
    return (
        <div className="bg-white min-h-screen text-[#1D1D1F] font-sans antialiased">

            {/* 1. The Product Showcase (Top Area) */}
            <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left: Huge pristine image placeholder */}
                    <div className="bg-[#F5F5F7] rounded-3xl aspect-square flex items-center justify-center p-12 transition-transform duration-500 hover:scale-[1.02]">
                        {/* Minimalist Tech Outline SVG */}
                        <svg className="w-48 h-48 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                    </div>

                    {/* Right: Product Info */}
                    <div className="flex flex-col">
                        <h1 className="text-hero mb-4">
                            NexusBlade Enterprise Server 2U
                        </h1>
                        <p className="text-sm text-gray-400 mb-8 font-medium tracking-wide">
                            SKU: NX-8842-A
                        </p>

                        <div className="text-body mb-10 space-y-4">
                            <p>
                                High-performance 2U rack server optimized for demanding virtualization and database workloads.
                            </p>
                            <p>
                                Engineered for government compliance with zero-trust architecture features baked directly into the firmware.
                            </p>
                            <p>
                                Delivers uncompromising scalability with up to 4TB of DDR4 ECC memory and 24 NVMe storage bays.
                            </p>
                        </div>

                        <div>
                            <button className="bg-[#007AFF] text-white px-8 py-4 rounded-md font-medium text-lg hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2">
                                Add to Institutional Quote
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. The Specs Table (Minimalist Approach) */}
            <section className="bg-[#F5F5F7] py-24">
                <div className="max-w-4xl mx-auto px-6 lg:px-12">
                    <h2 className="text-section mb-12 text-center md:text-left">Technical Specifications</h2>

                    <div className="flex flex-col gap-4">
                        {/* Row 1 */}
                        <div className="flex flex-col sm:flex-row sm:items-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="sm:w-1/3 flex items-center text-gray-500 font-medium mb-2 sm:mb-0">
                                <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                                Processor
                            </div>
                            <div className="sm:w-2/3 text-[#1D1D1F] font-semibold pl-8 sm:pl-0 flex items-center">
                                Dual Intel Xeon Scalable (3rd Gen)

                                {/* Tooltip Wrapper */}
                                <div className="ml-3 relative group flex items-center cursor-help">
                                    <svg className="w-4 h-4 text-gray-400 hover:text-[#007AFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#1D1D1F]/90 backdrop-blur-md text-white text-xs leading-relaxed p-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10 text-center">
                                        Supports up to 40 cores per processor for high-density computing.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="flex flex-col sm:flex-row sm:items-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="sm:w-1/3 flex items-center text-gray-500 font-medium mb-2 sm:mb-0">
                                <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Memory
                            </div>
                            <div className="sm:w-2/3 text-[#1D1D1F] font-semibold pl-8 sm:pl-0">
                                32 DIMM slots, max 4TB RDIMM
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="flex flex-col sm:flex-row sm:items-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="sm:w-1/3 flex items-center text-gray-500 font-medium mb-2 sm:mb-0">
                                <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Power Supply
                            </div>
                            <div className="sm:w-2/3 text-[#1D1D1F] font-semibold pl-8 sm:pl-0">
                                Dual Redundant 1400W Platinum
                            </div>
                        </div>

                        {/* Row 4 */}
                        <div className="flex flex-col sm:flex-row sm:items-center p-6 bg-white rounded-2xl shadow-sm">
                            <div className="sm:w-1/3 flex items-center text-gray-500 font-medium mb-2 sm:mb-0">
                                <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Security
                            </div>
                            <div className="sm:w-2/3 text-[#1D1D1F] font-semibold pl-8 sm:pl-0">
                                FIPS 140-2 Level 3 Validated, TPM 2.0
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Smart Compatibility Row (Cross-Sell) */}
            <section className="bg-white py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <h2 className="text-section mb-16 text-center md:text-left">
                        Fully Compatible Hardware
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Card 1 */}
                        <div className="card-premium flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-[#F5F5F7] rounded-2xl mb-8 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#1D1D1F]">64GB DDR4 ECC RAM</h3>
                            <p className="text-body mb-8">Certified expansion module.</p>
                            <button className="mt-auto w-full py-4 px-4 bg-brand-light text-brand-dark rounded-xl font-bold hover:bg-gray-200 transition-colors focus:outline-none">
                                Add Bundle
                            </button>
                        </div>

                        {/* Card 2 */}
                        <div className="card-premium flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-[#F5F5F7] rounded-2xl mb-8 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#1D1D1F]">3.84TB NVMe SSD</h3>
                            <p className="text-body mb-8">Enterprise mixed-use storage.</p>
                            <button className="mt-auto w-full py-4 px-4 bg-brand-light text-brand-dark rounded-xl font-bold hover:bg-gray-200 transition-colors focus:outline-none">
                                Add Bundle
                            </button>
                        </div>

                        {/* Card 3 */}
                        <div className="card-premium flex flex-col items-center text-center">
                            <div className="w-32 h-32 bg-[#F5F5F7] rounded-2xl mb-8 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#1D1D1F]">25GbE Network Card</h3>
                            <p className="text-body mb-8">Dual-port SFP28 adapter.</p>
                            <button className="mt-auto w-full py-4 px-4 bg-brand-light text-brand-dark rounded-xl font-bold hover:bg-gray-200 transition-colors focus:outline-none">
                                Add Bundle
                            </button>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    );
};

export default ProductDetail;
