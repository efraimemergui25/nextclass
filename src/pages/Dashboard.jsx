import React from 'react';
import PageTransition from '../components/PageTransition';

const Dashboard = () => {
 return (
 <PageTransition>
 <div className="bg-[#F5F5F7] min-h-[calc(100vh-73px)] font-sans text-[#1D1D1F] antialiased flex">
 {/* Sidebar Navigation */}
 <aside className="w-64 bg-white border-r border-gray-100 p-8 hidden md:block">
 <nav className="space-y-2">
 <a href="#overview" className="flex items-center space-x-3 px-4 py-2.5 bg-blue-50 text-[#007AFF] font-medium rounded-lg border-l-4 border-[#007AFF]">
 <span>Overview</span>
 </a>
 <a href="#quotes" className="flex items-center space-x-3 px-4 py-2.5 text-gray-500 hover:text-[#1D1D1F] hover:bg-gray-50 font-medium rounded-lg transition-colors">
 <span>Active Quotes</span>
 </a>
 <a href="#tenders" className="flex items-center space-x-3 px-4 py-2.5 text-gray-500 hover:text-[#1D1D1F] hover:bg-gray-50 font-medium rounded-lg transition-colors">
 <span>Tenders & Contracts</span>
 </a>
 <a href="#orders" className="flex items-center space-x-3 px-4 py-2.5 text-gray-500 hover:text-[#1D1D1F] hover:bg-gray-50 font-medium rounded-lg transition-colors">
 <span>Order History</span>
 </a>
 </nav>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 p-8 md:p-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
 <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 md:mb-0 text-[#1D1D1F]">Welcome back, Institution</h1>
 <button className="bg-[#007AFF] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-[0_8px_20px_rgb(0_122_255/0.2)] focus:outline-none">
 New Procurement Request
 </button>
 </div>

 {/* Quick Stats Row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
 <p className="text-sm font-bold text-gray-400 mb-1">Pending Approvals</p>
 <p className="text-4xl font-black text-[#1D1D1F] tracking-tighter">3</p>
 </div>
 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
 <p className="text-sm font-bold text-gray-400 mb-1">Active Tenders</p>
 <p className="text-4xl font-black text-[#1D1D1F] tracking-tighter">2</p>
 </div>
 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
 <p className="text-sm font-bold text-gray-400 mb-1">Recent Orders</p>
 <p className="text-4xl font-black text-[#1D1D1F] tracking-tighter">12</p>
 </div>
 </div>

 {/* Recent Activity Table */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="px-6 py-5 border-b border-gray-100">
 <h2 className="text-lg font-semibold">Recent Activity</h2>
 </div>
 <div className="p-6 text-center text-gray-500">
 <p>No recent activity across the procurement pipeline.</p>
 </div>
 </div>
 </main>
 </div>
 </PageTransition>
 );
};

export default Dashboard;
