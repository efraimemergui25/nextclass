import React, { useState } from 'react';

const ProcurementCart = () => {
    // Basic state to manage quantities dynamically (client side mockup logic)
    const [cart, setCart] = useState([
        { id: 'NX-8842-A', name: 'NexusBlade Enterprise Server 2U', sku: 'NX-8842-A', price: 13450.00, qty: 12 },
        { id: 'MEM-D4-64E', name: '64GB DDR4 ECC RAM Module', sku: 'MEM-D4-64E', price: 320.00, qty: 48 },
    ]);

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                return { ...item, qty: newQty > 0 ? newQty : 1 }; // Prevent 0 or negative
            }
            return item;
        }));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
        <div className="bg-white min-h-screen font-sans text-[#1D1D1F] antialiased">
            <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">

                {/* 1. Cart Table (Main Area) */}
                <div className="flex-1 w-full">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-[#1D1D1F]">Procurement Cart</h1>

                    <div className="flex flex-col">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-gray-100 text-xs font-semibold text-gray-400 tracking-wider uppercase mb-6">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Tender Unit Price</div>
                            <div className="col-span-2 text-right">Total Price</div>
                        </div>

                        {/* Cart Item Rows */}
                        {cart.map((item) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center py-6 border-b border-gray-100 last:border-0">
                                <div className="col-span-12 md:col-span-6 flex items-center gap-6">
                                    <div className="w-24 h-24 bg-[#F5F5F7] rounded-xl flex items-center justify-center shrink-0 border border-gray-100">
                                        {/* Abstract Product Icon Placeholder */}
                                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-lg md:text-xl font-black text-[#1D1D1F] tracking-tighter leading-snug mb-1">{item.name}</h3>
                                        <p className="text-sm font-bold text-gray-400 tracking-tight">SKU: {item.sku}</p>
                                    </div>
                                </div>

                                <div className="col-span-12 md:col-span-2 flex justify-start md:justify-center items-center mt-4 md:mt-0">
                                    <div className="flex items-center space-x-3 bg-[#F5F5F7] p-1.5 rounded-md">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-7 h-7 flex items-center justify-center rounded bg-white text-gray-500 hover:text-[#007AFF] hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                                            aria-label={`Decrease quantity of ${item.name}`}
                                        >-</button>
                                        <span className="text-sm font-semibold w-6 text-center">{item.qty}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded bg-white text-gray-500 hover:text-[#007AFF] hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                                            aria-label={`Increase quantity of ${item.name}`}
                                        >+</button>
                                    </div>
                                </div>

                                <div className="col-span-6 md:col-span-2 text-left md:text-right mt-4 md:mt-0 flex flex-col md:block">
                                    <span className="md:hidden text-xs text-gray-400 mb-1">Unit Price</span>
                                    <span className="font-medium text-[#1D1D1F]">
                                        ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="col-span-6 md:col-span-2 text-right mt-4 md:mt-0 flex flex-col md:block">
                                    <span className="md:hidden text-xs text-gray-400 mb-1">Total</span>
                                    <span className="font-bold text-[#1D1D1F]">
                                        ${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>

                {/* 2. Order Summary Panel */}
                <div className="w-full lg:w-[380px] bg-[#F5F5F7] rounded-2xl p-8 sticky top-12">
                    <h2 className="text-xl font-bold tracking-tight mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-[#1D1D1F]">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Estimated VAT / Tax (Exempt)</span>
                            <span className="text-[#1D1D1F]">$0.00</span>
                        </div>
                        <div className="w-full border-t border-gray-200 my-4"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-500">Grand Total</span>
                            <span className="text-3xl font-black tracking-tighter text-[#1D1D1F]">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full py-3.5 px-4 bg-[#007AFF] hover:bg-blue-600 text-white rounded-md font-medium text-[15px] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2">
                            Submit for Management Approval
                        </button>

                        <button className="w-full py-3.5 px-4 bg-transparent border-2 border-[#007AFF] text-[#007AFF] rounded-md font-medium text-[15px] hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-1">
                            Generate PDF Quote
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
                        Prices reflect active institutional contracts. Submission is subject to internal procurement review workflows.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ProcurementCart;
