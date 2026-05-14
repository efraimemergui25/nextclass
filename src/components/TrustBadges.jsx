import React from 'react';
import { ShieldCheck, RotateCcw, BadgeCheck } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const TrustBadges = () => {
    const { getSetting } = useSettings();

    const pillars = [
        {
            icon: <ShieldCheck size={20} className="text-[#007AFF]" />,
            title: getSetting('trust_badge_1_title', 'שירות ישיר ומהיר'),
            sub:   getSetting('trust_badge_1_desc',  'מענה אישי בכל שלב'),
        },
        {
            icon: <RotateCcw size={20} className="text-[#1D1D1F]" />,
            title: getSetting('trust_badge_2_title', 'החלפה תוך 14 יום'),
            sub:   getSetting('trust_badge_2_desc',  'ללא שאלות'),
        },
        {
            icon: <BadgeCheck size={20} className="text-[#FF9500]" />,
            title: getSetting('trust_badge_3_title', 'מחיר שקוף'),
            sub:   getSetting('trust_badge_3_desc',  'מה שהוצע — מה שמשלמים'),
        },
    ];

    return (
        <div className="mt-4 w-full flex justify-between items-center bg-[#F5F5F7]/50 backdrop-blur-2xl border border-gray-200/50 rounded-2xl p-4">
            {pillars.map(({ icon, title, sub }, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    {icon}
                    <span className="text-xs font-semibold text-[#1D1D1F] text-center leading-tight">{title}</span>
                    <span className="text-[10px] text-[#86868B] text-center">{sub}</span>
                </div>
            ))}
        </div>
    );
};

export default TrustBadges;
