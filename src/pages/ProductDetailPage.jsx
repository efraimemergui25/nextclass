import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function ProductDetailPage() {
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);

    // Mock product data
    const product = {
        id: id || '101',
        sku: 'SRV-DL380-G10',
        name: 'Enterprise Server Pro',
        description: 'High-performance 2U rack server optimized for intensive enterprise workloads. Features dual processors, redundant power, and advanced remote management.',
        price: 4500,
        inventory: 'In Stock (42 units)',
        manufacturer: 'Hewlett Packard Enterprise',
        specs: [
            { label: 'Processor', value: '2x Intel Xeon Gold 6248R' },
            { label: 'Memory', value: '256GB DDR4 ECC' },
            { label: 'Storage', value: '4x 1.92TB NVMe SSD' },
            { label: 'Network', value: '4x 10GbE SFP+' },
            { label: 'Power', value: 'Dual 800W Platinum' }
        ]
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <nav className="mb-8 text-sm text-gray-500">
                        <Link to="/catalog" className="hover:text-[#007AFF] transition-colors">Catalog</Link>
                        <span className="mx-2">/</span>
                        <span>Servers</span>
                        <span className="mx-2">/</span>
                        <span className="text-[#1D1D1F] font-medium">{product.sku}</span>
                    </nav>

                    <div className="bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
                        {/* Image Section */}
                        <div className="lg:w-1/2 p-12 bg-white flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#F5F5F7]">
                            {/* Placeholder for Product Image */}
                            <div className="w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                                <svg className="w-32 h-32 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                                </svg>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col">
                            <div className="mb-2">
                                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">{product.manufacturer}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-[#1D1D1F] mb-2">{product.name}</h1>
                            <p className="text-sm text-gray-500 font-mono mb-6">SKU: {product.sku}</p>

                            <div className="mb-8">
                                <span className="text-3xl font-medium text-[#1D1D1F]">${product.price.toLocaleString()}</span>
                                <span className="text-sm text-gray-500 ml-2">/ unit (ex. VAT)</span>
                            </div>

                            <p className="text-gray-600 mb-8 leading-relaxed">
                                {product.description}
                            </p>

                            {/* Action Area */}
                            <div className="mt-auto border-t border-[#F5F5F7] pt-8">
                                <div className="flex items-center mb-6">
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mr-4">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-16 text-center py-3 border-x border-gray-200 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button className="flex-1 bg-[#007AFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors shadow-sm">
                                        Add to Procurement Cart
                                    </button>
                                </div>
                                <div className="flex items-center text-sm">
                                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                    <span className="text-gray-600">{product.inventory}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="mt-12 bg-[#FFFFFF] rounded-2xl shadow-sm overflow-hidden p-10">
                        <h2 className="text-2xl font-semibold text-[#1D1D1F] mb-6">Technical Specifications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                            {product.specs.map((spec, index) => (
                                <div key={index} className="flex justify-between py-3 border-b border-[#F5F5F7] last:border-0">
                                    <span className="text-gray-500">{spec.label}</span>
                                    <span className="font-medium text-[#1D1D1F] text-right">{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
