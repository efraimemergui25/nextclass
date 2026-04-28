import React, { useState } from 'react';
import { Phone, Video, Users, Calendar, Clock, ChevronDown } from 'lucide-react';
import GlassRippleButton from './GlassRippleButton';

const TYPES = [
    { id: 'phone', label: 'ייעוץ טלפוני', icon: Phone },
    { id: 'zoom', label: 'פגישת זום', icon: Video },
    { id: 'inperson', label: 'פגישה פרונטלית', icon: Users }
];

const glassField = {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const ExpertConsultation = () => {
    const [selectedType, setSelectedType] = useState('phone');
    const [date] = useState('היום');
    const [time] = useState('14:00');

    return (
        <section
            className="py-24 px-6 relative"
            dir="rtl"
            style={{ background: 'linear-gradient(160deg, #F0F0F5 0%, #E8E8EF 100%)' }}
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row rounded-[2.5rem] overflow-hidden"
                style={{
                    background: 'rgba(255,255,255,0.55)',
                    backdropFilter: 'blur(40px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
            >
                {/* Left Side: Visual / Trust */}
                <div className="md:w-5/12 relative min-h-[300px] md:min-h-full">
                    <img
                        src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1000&auto=format&fit=crop"
                        alt="Consultant"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-10 flex flex-col justify-end">
                        <h3 className="text-3xl font-black text-white tracking-tighter leading-tight">
                            בואו נרכיב יחד את הפתרון המושלם למוסד שלכם.
                        </h3>
                        <p className="text-white/80 font-medium mt-3 text-lg leading-relaxed">צוות המומחים שלנו זמין לייעוץ תכנוני ללא התחייבות.</p>
                    </div>
                </div>

                {/* Right Side: The Flow */}
                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center"
                    style={{ background: 'rgba(255,255,255,0.3)' }}>
                    <h4 className="text-3xl font-black text-[#1D1D1F] tracking-tight mb-10">תיאום פגישת אפיון</h4>

                    {/* Meeting type chips */}
                    <div className="mb-10">
                        <label className="text-xs font-bold text-gray-400 mb-4 block tracking-widest uppercase">איך תרצו להיפגש?</label>
                        <div className="flex flex-wrap gap-3">
                            {TYPES.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200"
                                        style={isSelected ? {
                                            background: 'linear-gradient(135deg, #1D1D1F 0%, #2d2d30 100%)',
                                            color: 'white',
                                            transform: 'scale(1.02)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                                        } : {
                                            ...glassField,
                                            color: '#6B7280',
                                        }}
                                    >
                                        <Icon size={18} style={{ color: isSelected ? 'white' : '#9CA3AF' }} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date/Time Selectors */}
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-4 block tracking-widest uppercase">תאריך מועדף</label>
                            <div className="relative rounded-2xl p-4 flex items-center justify-between cursor-pointer" style={glassField}>
                                <div className="flex items-center gap-3 text-[#1D1D1F] font-bold text-lg">
                                    <Calendar size={20} className="text-[#007AFF]" />
                                    <span>{date}</span>
                                </div>
                                <ChevronDown size={18} className="text-gray-400" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 mb-4 block tracking-widest uppercase">שעה</label>
                            <div className="relative rounded-2xl p-4 flex items-center justify-between cursor-pointer" style={glassField}>
                                <div className="flex items-center gap-3 text-[#1D1D1F] font-bold text-lg">
                                    <Clock size={20} className="text-[#007AFF]" />
                                    <span>{time}</span>
                                </div>
                                <ChevronDown size={18} className="text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <GlassRippleButton className="w-full bg-[#007AFF] text-white hover:bg-blue-600 font-bold text-xl py-5 shadow-[0_8px_32px_rgba(0,122,255,0.3)]">
                        <span className="block mt-0.5">קבע פגישה עם מומחה</span>
                    </GlassRippleButton>
                </div>
            </div>
        </section>
    );
};

export default ExpertConsultation;
