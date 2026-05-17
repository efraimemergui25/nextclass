import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

export default function MobileFavorites() {
    const navigate = useNavigate();
    const { wishlistItems } = useWishlist();

    if (!wishlistItems.length) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,45,85,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Heart size={36} color="#FF2D55" strokeWidth={1.6} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#1D1D1F', marginBottom: 8, letterSpacing: '-0.03em' }}>אין פריטים שמורים</p>
            <p style={{ fontSize: 14, color: '#86868B', marginBottom: 28 }}>לחץ על הלב על מוצר כדי לשמור אותו</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,122,255,0.3)',
            }}>
                לקטלוג המוצרים
            </button>
        </div>
    );

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', padding: '12px 16px 24px' }}>
            <p style={{ fontSize: 13, color: '#86868B', marginBottom: 14 }}>
                {wishlistItems.length} פריטים שמורים
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {wishlistItems.map(p => (
                    <MobileProductCard key={p.id} product={p} size="md" />
                ))}
            </div>
        </div>
    );
}
