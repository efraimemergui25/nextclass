import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
    // Load from localStorage if present
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cartItems');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Add to Cart
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + (product.qty || 1) } : item
                );
            }
            return [...prevItems, { ...product, qty: product.qty || 1 }];
        });
    };

    // Remove from Cart
    const removeFromCart = (productId) => {
        setCartItems((prevItems) => prevItems.filter(item => item.id !== productId));
    };

    // Increase Quantity
    const increaseQuantity = (productId) => {
        setCartItems((prevItems) =>
            prevItems.map(item =>
                item.id === productId ? { ...item, qty: item.qty + 1 } : item
            )
        );
    };

    // Decrease Quantity
    const decreaseQuantity = (productId) => {
        setCartItems((prevItems) =>
            prevItems.map(item =>
                item.id === productId && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
            )
        );
    };

    // Clear Cart
    const clearCart = () => setCartItems([]);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            increaseQuantity,
            decreaseQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
