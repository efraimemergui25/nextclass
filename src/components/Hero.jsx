import React from 'react';

const Hero = () => {
    return (
        <section
            className="bg-[#F5F5F7] min-h-[60vh] flex flex-col items-center justify-center py-20 px-6 sm:px-8 text-center"
            aria-labelledby="hero-heading"
        >
            <div className="max-w-4xl mx-auto flex flex-col items-center w-full">
                {/* Headline */}
                <h1
                    id="hero-heading"
                    className="text-hero mb-6"
                >
                    Smarter IT Procurement <br className="hidden sm:block" /> for Institutions.
                </h1>

                {/* Sub-headline */}
                <p className="text-hero-sub mb-12">
                    Access contracts, bulk pricing, and enterprise-grade hardware.
                </p>

                {/* Smart Search */}
                <div className="w-full max-w-2xl">
                    <form
                        className="flex items-stretch bg-white rounded-xl shadow-md overflow-hidden ring-1 ring-gray-100 transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#007AFF] focus-within:ring-opacity-50"
                        role="search"
                        aria-label="Sitewide product search"
                    >
                        {/* Search Icon */}
                        <div className="flex items-center pl-4 pr-2 bg-transparent">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>

                        {/* Input Field */}
                        <input
                            type="search"
                            className="flex-1 py-4 text-base md:text-lg text-[#1D1D1F] placeholder-gray-400 outline-none w-full"
                            placeholder="Search by part number (SKU), model, or contract ID..."
                            aria-label="Search by part number, model, or contract ID"
                            required
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="bg-[#007AFF] text-white px-8 font-bold tracking-wide text-base md:text-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-700 transition-colors shrink-0"
                            aria-label="Submit search"
                        >
                            Search
                        </button>
                    </form>
                </div>

            </div>
        </section>
    );
};

export default Hero;
