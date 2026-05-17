import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const THRESHOLD = 60;

export default function PullToRefresh({ onRefresh, children }) {
    const [refreshing, setRefreshing] = useState(false);
    const startY  = useRef(null);
    const pullY   = useMotionValue(0);
    const opacity = useTransform(pullY, [0, THRESHOLD], [0, 1]);
    const scale   = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
    const rotate  = useTransform(pullY, [0, THRESHOLD * 1.5], [0, 360]);

    const onTouchStart = useCallback((e) => {
        if (window.scrollY > 2) return;
        startY.current = e.touches[0].clientY;
    }, []);

    const onTouchMove = useCallback((e) => {
        if (startY.current === null) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0 && window.scrollY === 0) {
            pullY.set(Math.min(delta * 0.45, THRESHOLD * 1.5));
        }
    }, [pullY]);

    const onTouchEnd = useCallback(async () => {
        if (startY.current === null) return;
        startY.current = null;
        const pulled = pullY.get();
        if (pulled >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            pullY.set(THRESHOLD * 0.65);
            await onRefresh?.();
            setRefreshing(false);
        }
        pullY.set(0);
    }, [pullY, onRefresh, refreshing]);

    return (
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ position: 'relative' }}>
            <motion.div style={{
                position: 'absolute', top: -48, left: 0, right: 0,
                height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity, pointerEvents: 'none', zIndex: 10,
                y: pullY,
            }}>
                <motion.div style={{
                    width: 34, height: 34, borderRadius: 99,
                    background: '#007AFF', scale,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(0,122,255,0.35)',
                }}>
                    <motion.svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ rotate }}>
                        <path d="M4 4v5h5M20 20v-5h-5M4 9A8 8 0 0 1 19.3 7M20 15a8 8 0 0 1-15.3 2" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                </motion.div>
            </motion.div>
            <motion.div style={{ y: pullY }}>
                {children}
            </motion.div>
        </div>
    );
}
