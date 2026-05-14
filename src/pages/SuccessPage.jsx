import React from 'react';
import PageTransition from '../components/PageTransition';

const SuccessPage = () => {
    return (
        <PageTransition>
            <div className="bg-[#F5F5F7] min-h-[calc(100vh-73px)] font-sans text-[#1D1D1F] antialiased flex items-center justify-center p-6">
                <div className="max-w-xl w-full text-center">
                    {/* Visual Confirmation */}
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-4">Quote Request Submitted Successfully</h1>
                    <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
                        Your institutional procurement request has been routed for approval. A copy has been sent to your email.
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-10 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-xs text-gray-400 tracking-wider font-semibold mb-1">Quote Reference</p>
                                <p className="text-lg font-bold text-[#1D1D1F]">#QT-88492-X</p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700">
                                Pending Approval
                            </span>
                        </div>
                        <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-500">Total Amount</p>
                            <p className="text-xl font-bold text-[#1D1D1F]">$14,580.00</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto bg-[#007AFF] text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2">
                            Return to Catalog
                        </button>
                        <button className="w-full sm:w-auto bg-transparent text-[#007AFF] border-2 border-[#007AFF] px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2">
                            View Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default SuccessPage;
