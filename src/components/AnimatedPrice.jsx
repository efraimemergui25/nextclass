import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedPrice = ({ value, className }) => {
    // Spring physics for the rolling numbers
    const springValue = useSpring(value, { stiffness: 150, damping: 25, mass: 0.8 });

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    // Format the animated number as currency
    const displayValue = useTransform(springValue, (current) => `₪${Math.round(current).toLocaleString()}`);

    return <motion.span className={className}>{displayValue}</motion.span>;
};

export default AnimatedPrice;
