import React from 'react';

const QuotePreviewModal = () => {
 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8 overflow-y-auto">

 {/* Inner Modal Container */}
 <div className="bg-white w-full max-w-[850px] rounded-2xl shadow-2xl relative my-auto animate-fade-in-up border border-white/20 transform-gpu will-change-transform">

 {/* 1. Header Array */}
 <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
 <h2 className="text-xl md:text-3xl font-black text-[#1D1D1F] tracking-tighter">
 Official Quote Preview
 </h2>

 {/* Close Icon */}
 <button className="text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>

 {/* 2. Document Body (The PDF Look) */}
 <div className="p-8 md:p-12">

 <div className="bg-white border border-gray-200 shadow-sm p-6 sm:p-10 min-h-[500px] flex flex-col relative mx-auto rounded-sm">

 {/* Top Branding & Meta */}
 <div className="flex flex-col sm:flex-row justify-between items-start mb-16 gap-6 sm:gap-0">

 {/* Top left text logo */}
 <div className="text-3xl tracking-tighter text-[#1D1D1F] leading-none shrink-0 border-b-2 border-[#1D1D1F] pb-1 inline-block">
 <span className="font-black">next</span>
 <span className="font-light">class</span>
 </div>

 {/* Top right meta details */}
 <div className="text-left sm:text-right text-sm">
 <p className="font-semibold text-[#1D1D1F] mb-1">Quote #<span className="font-mono">QT-88902</span></p>
 <p className="text-gray-500 mb-0.5">Date: Oct 24, 2026</p>
 <p className="text-red-500/80 font-medium">Valid Until: Nov 24, 2026</p>
 </div>
 </div>

 {/* Customer Details */}
 <div className="mb-12">
 <h3 className="text-xs font-bold text-gray-400 mb-2">Prepared For:</h3>
 <p className="text-lg font-semibold text-[#1D1D1F]">State University</p>
 <p className="text-sm text-gray-500">ID: GVT-993-EDU</p>
 </div>

 {/* Minimalist itemized table */}
 <div className="mb-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b-2 border-gray-800 text-xs font-bold text-gray-400 pb-2">
 <th className="font-bold pb-3 pl-2 w-1/5">SKU</th>
 <th className="font-bold pb-3 w-2/5">Description</th>
 <th className="font-bold pb-3 text-center w-1/12">Qty</th>
 <th className="font-bold pb-3 text-right w-[15%]">Unit Price</th>
 <th className="font-bold pb-3 text-right pr-2 w-[15%]">Total</th>
 </tr>
 </thead>
 <tbody className="text-sm text-[#1D1D1F]">

 <tr className="border-b border-gray-100">
 <td className="py-4 pl-2 font-mono text-xs font-semibold text-gray-600">NX-8842-A</td>
 <td className="py-4 font-medium pr-4">NexusBlade Enterprise Server 2U</td>
 <td className="py-4 text-center">12</td>
 <td className="py-4 text-right tabular-nums">$13,450.00</td>
 <td className="py-4 pr-2 text-right font-semibold tabular-nums">$161,400.00</td>
 </tr>

 <tr className="border-b border-gray-100">
 <td className="py-4 pl-2 font-mono text-xs font-semibold text-gray-600">MEM-D4-64E</td>
 <td className="py-4 font-medium pr-4">64GB DDR4 ECC RAM Module</td>
 <td className="py-4 text-center">48</td>
 <td className="py-4 text-right tabular-nums">$320.00</td>
 <td className="py-4 pr-2 text-right font-semibold tabular-nums">$15,360.00</td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Footer Order summary */}
 <div className="mt-16 w-full sm:w-1/2 ml-auto">
 <div className="flex justify-between items-center py-2 text-sm">
 <span className="text-gray-500 font-medium">Subtotal</span>
 <span className="font-semibold text-[#1D1D1F] tabular-nums">$176,760.00</span>
 </div>
 <div className="flex justify-between items-center py-2 text-sm border-b border-gray-200">
 <span className="text-gray-500 font-medium">Tax/VAT (Exempt)</span>
 <span className="font-semibold text-[#1D1D1F] tabular-nums">$0.00</span>
 </div>
 <div className="flex justify-between items-center pt-4">
 <span className="text-lg font-bold text-[#1D1D1F]">Grand Total</span>
 <span className="text-2xl font-black text-[#1D1D1F] tracking-tighter tabular-nums">$176,760.00</span>
 </div>
 </div>

 </div>

 </div>

 {/* 3. Action Footer */}
 <div className="bg-[#FAFAFA] border-t border-gray-100 py-6 px-8 flex items-center justify-end rounded-b-2xl space-x-4">
 <button className="px-6 py-2.5 bg-transparent text-[#007AFF] hover:bg-blue-50 transition-colors font-medium text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-[#007AFF]">
 Edit Cart
 </button>
 <button className="px-6 py-2.5 bg-[#007AFF] text-white hover:bg-blue-600 transition-colors font-medium text-sm rounded-md shadow-sm flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007AFF]">
 <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
 </svg>
 Download PDF
 </button>
 </div>

 </div>
 </div>
 );
};

export default QuotePreviewModal;
