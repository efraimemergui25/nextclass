import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
    return ctx;
};

// Safe localStorage reader — prevents crashes on corrupted/missing data
const readCart = () => {
    try {
        const raw = localStorage.getItem('nextclass_cartItems');
        return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(readCart);

    // ─── Dynamic Island state ─────────────────────────────────────────────────
    const [islandProduct, setIslandProduct] = useState(null);

    // Expose a stable clearIsland so DynamicIsland can call it
    const clearIsland = useCallback(() => setIslandProduct(null), []);

    // Persist to localStorage on every change
    useEffect(() => {
        try {
            localStorage.setItem('nextclass_cartItems', JSON.stringify(cartItems));
        } catch {
            // Storage quota exceeded — fail silently
        }
    }, [cartItems]);

    // ─── Derived values (memoised — run only when cartItems changes) ───────
    const cartCount = useMemo(
        () => (cartItems ?? []).reduce((acc, item) => acc + (item?.qty ?? 1), 0),
        [cartItems]
    );

    const cartTotal = useMemo(
        () => (cartItems ?? []).reduce((acc, item) => acc + (item?.salePrice ?? item?.price ?? 0) * (item?.qty ?? 1), 0),
        [cartItems]
    );

    // ─── Stable handler references ──────────────────────────────────────────
    const addToCart = useCallback((product) => {
        if (!product?.id) return;
        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, qty: (item.qty ?? 1) + (product.qty ?? 1) }
                        : item
                );
            }
            return [...prev, { ...product, qty: product.qty ?? 1 }];
        });
        // Trigger the Dynamic Island
        setIslandProduct(product);
    }, []);

    const removeFromCart = useCallback((productId) => {
        if (!productId) return;
        setCartItems(prev => prev.filter(item => item.id !== productId));
    }, []);

    const increaseQuantity = useCallback((productId) => {
        if (!productId) return;
        setCartItems(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, qty: (item.qty ?? 1) + 1 } : item
            )
        );
    }, []);

    const decreaseQuantity = useCallback((productId) => {
        if (!productId) return;
        setCartItems(prev =>
            prev.map(item =>
                item.id === productId && (item.qty ?? 1) > 1
                    ? { ...item, qty: item.qty - 1 }
                    : item
            )
        );
    }, []);

    const clearCart = useCallback(() => setCartItems([]), []);

    // ─── Stable context value ────────────────────────────────────────────────
    const value = useMemo(() => ({
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        // Dynamic Island API
        islandProduct,
        clearIsland,
    }), [cartItems, cartCount, cartTotal, addToCart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart, islandProduct, clearIsland]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
