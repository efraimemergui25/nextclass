import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function MemberBar() {
    const { isMember, firstName, tierLabel, tierColor } = useAuth();
    const { isVisible } = useSettings();
    if (!isMember || !isVisible('vis_member_pricing', false)) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                width: '100%',
                background: `${tierColor}0D`,
                borderBottom: `1px solid ${tierColor}22`,
                padding: '6px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'Heebo, sans-serif', direction: 'rtl',
            }}
        >
            <CheckCircle size={13} color={tierColor} strokeWidth={2.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: tierColor }}>
                {firstName && `${firstName}, `}מחירי {tierLabel} פעילים ✓
            </span>
        </motion.div>
    );
}
