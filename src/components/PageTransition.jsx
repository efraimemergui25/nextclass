import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="w-full flex-1 flex flex-col"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;
