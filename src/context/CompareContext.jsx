import React, { createContext, useContext, useState } from 'react';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const addToCompare = (product) => {
        setSelectedForCompare(prev => {
            if (prev.find(p => p.id === product.id)) {
                return prev; // Already selected
            }
            if (prev.length >= 3) {
                showToast('ניתן להשוות עד 3 דגמים בו-זמנית.');
                return prev;
            }
            return [...prev, product];
        });
    };

    const removeFromCompare = (productId) => {
        setSelectedForCompare(prev => prev.filter(p => p.id !== productId));
    };

    const clearCompare = () => {
        setSelectedForCompare([]);
    };

    const isSelected = (productId) => {
        return selectedForCompare.some(p => p.id === productId);
    };

    return (
        <CompareContext.Provider value={{
            selectedForCompare,
            addToCompare,
            removeFromCompare,
            clearCompare,
            isSelected,
            toastMessage
        }}>
            {children}
            {/* Simple Floating Toast for Compare Limits */}
            {toastMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] bg-[#1D1D1F] text-white px-6 py-3 rounded-full shadow-2xl text-sm font-medium animate-fade-in-down">
                    {toastMessage}
                </div>
            )}
        </CompareContext.Provider>
    );
};
