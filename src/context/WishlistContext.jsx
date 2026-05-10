import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nextclass_wishlist') || '[]'); }
        catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('nextclass_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggle = useCallback((productId) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    }, []);

    const isWishlisted = useCallback((productId) => wishlist.includes(productId), [wishlist]);

    return (
        <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, count: wishlist.length }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
