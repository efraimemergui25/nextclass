/**
 * useCartPop
 *
 * Drives the satisfying Add-to-Cart button pop sequence:
 *   idle → loading (shrink) → success (green + checkmark) → idle
 *
 * Usage:
 *   const { state, trigger } = useCartPop();
 *
 *   <motion.button animate={cartButtonVariants[state]} onClick={trigger(() => addToCart(p))}>
 *     {state === 'success' ? <Check /> : 'הוסף לעגלה'}
 *   </motion.button>
 */
import { useState, useCallback, useRef } from 'react';

const SEQUENCE_MS = {
    loading: 150,   // shrink phase
    success: 1400,  // green phase (enough to feel satisfying)
};

const useCartPop = () => {
    const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'success'
    const timerRef = useRef(null);

    const trigger = useCallback((addFn) => () => {
        // Clear any running sequence
        clearTimeout(timerRef.current);

        setState('loading');

        timerRef.current = setTimeout(() => {
            // Execute the actual cart mutation AFTER the shrink animation
            if (typeof addFn === 'function') addFn();
            setState('success');

            timerRef.current = setTimeout(() => {
                setState('idle');
            }, SEQUENCE_MS.success);
        }, SEQUENCE_MS.loading);
    }, []);

    return { state, trigger };
};

export default useCartPop;
