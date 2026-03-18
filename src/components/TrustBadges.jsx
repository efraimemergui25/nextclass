import React, { memo } from 'react';
import { ShieldCheck, RotateCcw, Lock } from 'lucide-react';

const PILLARS = [
    {
        icon: <ShieldCheck size={20} className="text-[#007AFF]" />,
        title: 'אחריות יבואן רשמי',
        sub: 'שירות מורשה מלא',
    },
    {
        icon: <RotateCcw size={20} className="text-[#1D1D1F]" />,
        title: '14 ימי ניסיון והחזרה',
        sub: 'ללא שאלות',
    },
    {
        icon: <Lock size={20} className="text-[#34C759]" />,
        title: 'תשלום מאובטח ומוצפן',
        sub: 'SSL & PCI DSS',
    },
];

const TrustBadges = () => (
    <div className="mt-4 w-full flex justify-between items-center bg-[#F5F5F7]/50 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-4">
        {PILLARS.map(({ icon, title, sub }, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
                {icon}
                <span className="text-xs font-semibold text-[#1D1D1F] text-center leading-tight">{title}</span>
                <span className="text-[10px] text-[#86868B] text-center">{sub}</span>
            </div>
        ))}
    </div>
);

export default memo(TrustBadges);
