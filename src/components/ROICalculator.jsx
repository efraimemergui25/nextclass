import React, { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedNumber = ({ value }) => {
    const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) =>
        `₪${Math.round(current).toLocaleString()}`
    );

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
};

const ROICalculator = () => {
    const [classrooms, setClassrooms] = useState(10);
    const [years, setYears] = useState(5);

    // Old projector maintenance: ~₪1500 per year per class (bulbs, filters, tech time, lost lessons)
    const oldCost = classrooms * years * 1500;

    // NextClass Zero Maintenance: ~₪0 parts, maybe ₪150 electricity/checking
    const nextCost = classrooms * years * 150;

    const savings = oldCost - nextCost;

    return (
        <section className="py-16 md:py-24 lg:py-32 px-6 relative bg-white" dir="rtl">
            <div className="max-w-[1400px] mx-auto bg-[#1D1D1F] rounded-[3rem] p-8 md:p-16 lg:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative border border-white/10">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row gap-16 items-center">

                    {/* Sliders Area */}
                    <div className="w-full md:w-1/2 text-white flex flex-col gap-6">
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">מחשבון החזר השקעה (ROI)</h3>
                        <p className="text-gray-400 font-medium text-lg md:text-xl leading-relaxed">
                            בדקו כמה כסף וזמן תוכלו לחסוך באמצעות המעבר למסכים האינטראקטיביים שלנו לעומת תחזוקת מקרנים מיושנים לאורך שנים.
                        </p>

                        <div className="space-y-12">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xl font-bold">מספר כיתות פוטנציאליות</span>
                                    <span className="text-[#007AFF] font-black text-3xl bg-[#007AFF]/10 px-4 py-1.5 rounded-xl border border-[#007AFF]/20">{classrooms}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="50"
                                    value={classrooms}
                                    onChange={(e) => setClassrooms(Number(e.target.value))}
                                    className="w-full h-3 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#007AFF]"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xl font-bold">שנות שימוש צפויות</span>
                                    <span className="text-[#007AFF] font-black text-3xl bg-[#007AFF]/10 px-4 py-1.5 rounded-xl border border-[#007AFF]/20">{years}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="7"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                    className="w-full h-3 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#007AFF]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Area */}
                    <div className="w-full md:w-1/2 bg-black/60 backdrop-blur-3xl border border-white/5 shadow-2xl rounded-[2.5rem] p-10 flex flex-col justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-[50%] bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />

                        <div className="mb-10 relative z-10">
                            <span className="text-gray-400 font-bold block mb-3 uppercase tracking-widest text-sm">עלות תחזוקת מקרנים מיושנת</span>
                            <div className="text-4xl md:text-5xl font-black text-red-400/80 tracking-tighter line-through decoration-red-500/40 opacity-75">
                                <AnimatedNumber value={oldCost} />
                            </div>
                        </div>

                        <div className="w-[80%] mx-auto h-px bg-white/10 mb-10 relative z-10" />

                        <div className="relative z-10">
                            <span className="text-white font-bold block mb-4 uppercase tracking-widest text-lg">חיסכון משוער עם NextClass</span>
                            <div className="text-6xl md:text-8xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                                <AnimatedNumber value={savings} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ROICalculator;
