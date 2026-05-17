import { useCallback, useRef } from 'react';

export default function useLongPress(callback, { delay = 480 } = {}) {
    const timerRef     = useRef(null);
    const triggered    = useRef(false);

    const start = useCallback((e) => {
        triggered.current = false;
        timerRef.current = setTimeout(() => {
            triggered.current = true;
            callback(e);
        }, delay);
    }, [callback, delay]);

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const onClick = useCallback((e) => {
        if (triggered.current) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, []);

    return {
        onPointerDown:  start,
        onPointerUp:    cancel,
        onPointerLeave: cancel,
        onClick,
    };
}
