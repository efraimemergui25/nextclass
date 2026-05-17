import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

export const CompareProvider = ({ children }) => {
    const [selectedForCompare, setSelectedForCompare] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);

    const showToast = useCallback((message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    }, []);

    const addToCompare = useCallback((product) => {
        setSelectedForCompare(prev => {
            if (prev.find(p => p.id === product.id)) return prev;
            if (prev.length >= 3) {
                showToast('ניתן להשוות עד 3 דגמים בו-זמנית.');
                return prev;
            }
            return [...prev, product];
        });
    }, [showToast]);

    const removeFromCompare = useCallback((productId) => {
        setSelectedForCompare(prev => prev.filter(p => p.id !== productId));
    }, []);

    const clearCompare = useCallback(() => {
        setSelectedForCompare([]);
    }, []);

    const isSelected = useCallback((productId) => {
        return selectedForCompare.some(p => p.id === productId);
    }, [selectedForCompare]);

    const value = useMemo(() => ({
        selectedForCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isSelected,
        toastMessage,
    }), [selectedForCompare, addToCompare, removeFromCompare, clearCompare, isSelected, toastMessage]);

    return (
        <CompareContext.Provider value={value}>
            {children}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        key="compare-toast"
                        initial={{ opacity: 0, y: -16, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        style={{
                            position: 'fixed',
                            top: 96,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 9999,
                            background: '#1D1D1F',
                            color: '#fff',
                            padding: '10px 22px',
                            borderRadius: 99,
                            fontSize: 13,
                            fontWeight: 600,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                        }}
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </CompareContext.Provider>
    );
};
