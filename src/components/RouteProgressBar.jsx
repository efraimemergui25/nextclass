import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export default function RouteProgressBar() {
 const location = useLocation();
 const [progress, setProgress] = useState(0);
 const [visible, setVisible] = useState(false);
 const timerRef = useRef(null);
 const prevPath = useRef(location.pathname);

 useEffect(() => {
  if (location.pathname === prevPath.current) return;
  prevPath.current = location.pathname;

  clearTimeout(timerRef.current);
  setProgress(0);
  setVisible(true);

  // Fast jump to 70%, then crawl
  const t1 = setTimeout(() => setProgress(15), 20);
  const t2 = setTimeout(() => setProgress(45), 100);
  const t3 = setTimeout(() => setProgress(72), 300);
  const t4 = setTimeout(() => setProgress(88), 600);

  // Complete after 800ms, hide
  const t5 = setTimeout(() => {
   setProgress(100);
   timerRef.current = setTimeout(() => setVisible(false), 250);
  }, 800);

  return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); clearTimeout(timerRef.current); };
 }, [location.pathname]);

 return (
  <AnimatePresence>
   {visible && (
    <motion.div
     initial={{ opacity: 0 }}
     animate={{ opacity: 1 }}
     exit={{ opacity: 0 }}
     transition={{ duration: 0.15 }}
     style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 2.5,
      zIndex: 9999,
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.04)',
     }}
    >
     <motion.div
      animate={{ width: `${progress}%` }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: progress === 100 ? 0.2 : 0.4 }}
      style={{
       height: '100%',
       background: 'linear-gradient(90deg, #007AFF 0%, #5856D6 60%, #007AFF 100%)',
       backgroundSize: '200% 100%',
       animation: 'shimmer-progress 1.5s linear infinite',
       boxShadow: '0 0 8px rgba(0,122,255,0.6)',
       borderRadius: '0 2px 2px 0',
      }}
     />
     <style>{`@keyframes shimmer-progress { 0% { background-position: -100% 0; } 100% { background-position: 200% 0; } }`}</style>
    </motion.div>
   )}
  </AnimatePresence>
 );
}
