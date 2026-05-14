import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — Ultra-Fast "Pop" Resolve
 * Optimized for popLayout to eliminate white flashes and ensure instant response.
 */
const pageVariants = {
 initial: {
 opacity: 0,
 scale: 0.96,
 y: 10,
 filter: 'blur(12px)',
 },
 animate: {
 opacity: 1,
 scale: 1,
 y: 0,
 filter: 'blur(0px)',
 transition: {
 type: 'spring',
 stiffness: 240,
 damping: 30,
 mass: 1,
 staggerChildren: 0.05,
 }
 },
 exit: {
 opacity: 0,
 scale: 1.02,
 y: -10,
 filter: 'blur(8px)',
 transition: {
 duration: 0.2,
 ease: "easeIn"
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
 onAnimationStart={() => {
 // Immediate scroll to top during popLayout switch
 window.scrollTo({ top: 0, behavior: 'instant' });
 }}
 className="w-full flex-1 flex flex-col origin-center will-change-[transform,opacity,filter]"
 >
 {children}
 </motion.div>
 );
};

export default PageTransition;
