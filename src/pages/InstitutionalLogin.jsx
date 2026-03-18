import React from 'react';

const InstitutionalLogin = () => {
    return (
        <div className="flex min-h-screen bg-white font-sans antialiased text-[#1D1D1F]">

            {/* 1. Left Panel (Value/Branding) - Hidden on smaller screens */}
            <div className="hidden lg:flex w-1/2 bg-[#F5F5F7] flex-col items-center justify-center p-12 relative overflow-hidden">

                {/* Abstract Minimalist Tech Pattern / Background Element */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none flex items-center justify-center">
                    {/* Extremely subtle, Apple-esque geometric background */}
                    <svg className="w-[800px] h-[800px] text-gray-200 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.2}>
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
                    </svg>
                </div>

                {/* Content Container */}
                <div className="relative z-10 max-w-md text-center">
                    {/* Logo Element */}
                    <div className="mb-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                        <span className="text-2xl tracking-tight">
                            <span className="font-bold">n</span>
                            <span className="font-light">c</span>
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-[#1D1D1F] leading-tight">
                        nextclass Enterprise Portal
                    </h1>
                    <p className="text-lg text-gray-500 font-normal">
                        Secure access to institutional pricing, tenders, and procurement management.
                    </p>
                </div>
            </div>

            {/* 2. Right Panel (The Form) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white">

                <div className="w-full max-w-md">
                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden mb-12 text-center">
                        <a href="/" className="text-3xl tracking-tight" aria-label="nextclass home">
                            <span className="font-bold">next</span>
                            <span className="font-light">class</span>
                        </a>
                    </div>

                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-[#1D1D1F]">Institutional Login</h2>
                        <p className="text-gray-500 font-normal">Enter your credentials to access the secure portal.</p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>

                        {/* Input 1: Institutional Email / Contractor ID */}
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                                Institutional Email / Contractor ID
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all sm:text-sm"
                                placeholder="enter your ID or email"
                            />
                        </div>

                        {/* Input 2: Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Helper Link */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a href="#reset" className="font-medium text-sm text-gray-500 hover:text-[#007AFF] transition-colors focus:outline-none focus:underline">
                                    Forgot password or need procurement access?
                                </a>
                            </div>
                        </div>

                        {/* Primary Action Button */}
                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-[0_10px_20px_rgb(0_122_255/0.2)] text-base font-bold text-white bg-[#007AFF] hover:bg-blue-600 hover:-translate-y-1 focus:outline-none transition-all duration-300"
                            >
                                Secure Login
                            </button>
                        </div>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Secondary Action: Ghost Button */}
                        <div>
                            <button
                                type="button"
                                className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-md shadow-sm text-base font-medium text-[#1D1D1F] bg-transparent hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                            >
                                {/* Subtle generic building icon for "Government SSO" representation */}
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Login with Government SSO
                            </button>
                        </div>

                    </form>
                </div>
            </div>

        </div>
    );
};

export default InstitutionalLogin;
