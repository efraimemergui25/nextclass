import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Apple-tier page transition with:
 *  • Vertical drift + subtle scale (feels like lifting a card)  
 *  • Spring physics instead of linear duration
 *  • Brightness flash on enter (mimics iOS page reveal)
 */
const pageVariants = {
    initial: {
        opacity: 0,
        y: 16,
        scale: 0.995,
        filter: 'blur(4px)',
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
            opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
            y: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 },
            scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            filter: { duration: 0.3, ease: 'easeOut' },
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 1.003,
        filter: 'blur(3px)',
        transition: {
            duration: 0.22,
            ease: [0.32, 0, 0.67, 0],
        }
    }
};

const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <motion.div
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            className="w-full flex-1 flex flex-col"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
