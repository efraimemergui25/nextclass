import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronLeft, Trash2 } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { haptic } from '../utils/haptic';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileFavorites() {
    const navigate = useNavigate();
    const { wishlistItems, clearWishlist } = useWishlist();
    const { colors: c } = useTheme();

    if (!wishlistItems.length) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{ width: 84, height: 84, borderRadius: 26, background: 'rgba(255,45,85,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}
            >
                <Heart size={38} color="#FF2D55" strokeWidth={1.5} />
            </motion.div>
            <p style={{ fontSize: 20, fontWeight: 800, color: c.text, marginBottom: 8, letterSpacing: '-0.03em' }}>אין פריטים שמורים</p>
            <p style={{ fontSize: 14, color: c.text3, marginBottom: 28, lineHeight: 1.5 }}>לחץ על הלב על מוצר כדי לשמור אותו</p>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/catalog')} style={{
                background: 'linear-gradient(135deg, #007AFF, #0063CC)', color: '#fff', border: 'none',
                borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                WebkitTapHighlightColor: 'transparent',
            }}>
                לקטלוג המוצרים <ChevronLeft size={16} />
            </motion.button>
        </div>
    );

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '12px 16px 24px', background: c.bg, minHeight: '100dvh' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                {typeof clearWishlist === 'function' && (
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => { haptic('warning'); clearWishlist(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'none', border: 'none',
                            color: '#FF3B30', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Trash2 size={13} strokeWidth={2} />
                        נקה הכל
                    </motion.button>
                )}
                <p style={{ fontSize: 13, color: c.text3, fontWeight: 500 }}>
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'פריט שמור' : 'פריטים שמורים'}
                </p>
            </div>

            <AnimatePresence>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {wishlistItems.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ delay: i * 0.04, duration: 0.25 }}
                        >
                            <MobileProductCard product={p} size="md" />
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>
        </div>
    );
}
