import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('nextclass_wishlist');
        if (saved) {
            try {
                setWishlistItems(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading wishlist:', e);
            }
        }
    }, []);

    // Save to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('nextclass_wishlist', JSON.stringify(wishlistItems));
    }, [wishlistItems]);

    const toggleWishlist = (product) => {
        setWishlistItems(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev.filter(item => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearWishlist = () => setWishlistItems([]);

    return (
        <WishlistContext.Provider value={{ 
            wishlistItems, 
            toggleWishlist, 
            isInWishlist, 
            removeFromWishlist,
            clearWishlist,
            wishlistCount: wishlistItems.length 
        }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
