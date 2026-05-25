import { useRef, useEffect, memo } from 'react';

// CSS keyframe animations run on the compositor thread — zero JS cost
const AURORA_CSS = `
@keyframes nc-orb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(55px,-35px) scale(1.1)}66%{transform:translate(-15px,18px) scale(0.95)}}
@keyframes nc-orb2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-45px,45px) scale(0.92)}66%{transform:translate(25px,-18px) scale(1.06)}}
@keyframes nc-orb3{0%,100%{transform:translate(0,0) scale(1);border-radius:60% 40% 30% 70%/60% 30% 70% 40%}33%{transform:translate(28px,-18px) scale(1.04);border-radius:30% 60% 70% 40%/50% 60% 30% 60%}66%{transform:translate(-28px,36px) scale(0.97);border-radius:40% 60% 60% 40%/40% 70% 30% 60%}}
@keyframes nc-orb4{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-35px,30px) scale(1.06)}66%{transform:translate(20px,-20px) scale(0.94)}}
`;

export default memo(function GlassCanvas({ mood }) {
    const glowRef  = useRef(null);
    const spotRef  = useRef(null);
    const rafRef   = useRef(null);
    const targetRef  = useRef({ x: 50, y: 50 });
    const currentRef = useRef({ x: 50, y: 50 });
    const spot2Ref   = useRef({ x: 50, y: 50 });

    useEffect(() => {
        const lerp = (a, b, t) => a + (b - a) * t;

        const tick = () => {
            const cur = currentRef.current;
            const tgt = targetRef.current;
            const sp  = spot2Ref.current;

            cur.x = lerp(cur.x, tgt.x, 0.055);
            cur.y = lerp(cur.y, tgt.y, 0.055);
            sp.x  = lerp(sp.x,  tgt.x, 0.18);
            sp.y  = lerp(sp.y,  tgt.y, 0.18);

            if (glowRef.current) {
                glowRef.current.style.transform = `translate(calc(${cur.x}vw - 50%), calc(${cur.y}vh - 50%))`;
            }
            if (spotRef.current) {
                spotRef.current.style.transform = `translate(calc(${sp.x}vw - 50%), calc(${sp.y}vh - 50%))`;
            }

            // Self-cancel when converged — no more 60fps idle burn
            const stillMoving =
                Math.abs(cur.x - tgt.x) > 0.02 || Math.abs(cur.y - tgt.y) > 0.02 ||
                Math.abs(sp.x  - tgt.x) > 0.02 || Math.abs(sp.y  - tgt.y) > 0.02;

            rafRef.current = stillMoving ? requestAnimationFrame(tick) : null;
        };

        const handleMove = (e) => {
            targetRef.current = {
                x: (e.clientX / window.innerWidth)  * 100,
                y: (e.clientY / window.innerHeight) * 100,
            };
            // Restart loop only when not already running
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        window.addEventListener('mousemove', handleMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const primary   = mood?.primary   ?? '#007AFF';
    const secondary = mood?.secondary ?? '#5856D6';

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -10 }} aria-hidden="true">
            <style>{AURORA_CSS}</style>

            {/* Base background */}
            <div className="absolute inset-0 bg-[#F2F2F5]" />

            {/* Aurora Orb 1 — primary, top-right — pure CSS animation */}
            <div style={{
                position: 'absolute', top: '-8%', right: '-4%',
                width: 850, height: 850, borderRadius: '50%',
                backgroundColor: primary, opacity: 0.065, filter: 'blur(110px)',
                animation: 'nc-orb1 20s ease-in-out infinite',
            }} />

            {/* Aurora Orb 2 — secondary, bottom-left */}
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-5%',
                width: 750, height: 750, borderRadius: '50%',
                backgroundColor: secondary, opacity: 0.05, filter: 'blur(130px)',
                animation: 'nc-orb2 25s ease-in-out infinite 4s',
            }} />

            {/* Aurora Orb 3 — morphing green blob, mid */}
            <div style={{
                position: 'absolute', top: '45%', left: '30%',
                width: 600, height: 600,
                backgroundColor: '#30D158', opacity: 0.035, filter: 'blur(150px)',
                animation: 'nc-orb3 18s ease-in-out infinite 8s',
            }} />

            {/* Aurora Orb 4 — warm accent, lower-right */}
            <div style={{
                position: 'absolute', bottom: '10%', right: '15%',
                width: 500, height: 500, borderRadius: '50%',
                backgroundColor: '#FF9500', opacity: 0.028, filter: 'blur(120px)',
                animation: 'nc-orb4 22s ease-in-out infinite 12s',
            }} />

            {/* Mouse-reactive glow — large, slow */}
            <div ref={glowRef} style={{
                position: 'fixed', width: 700, height: 700, borderRadius: '50%',
                background: `radial-gradient(circle, ${primary}16 0%, ${primary}06 40%, transparent 65%)`,
                filter: 'blur(45px)', top: 0, left: 0, pointerEvents: 'none', zIndex: -5,
                transform: 'translate(calc(50vw - 50%), calc(50vh - 50%))',
            }} />

            {/* Mouse-reactive spotlight — tight, fast */}
            <div ref={spotRef} style={{
                position: 'fixed', width: 280, height: 280, borderRadius: '50%',
                background: `radial-gradient(circle, ${primary}0E 0%, ${primary}05 50%, transparent 70%)`,
                filter: 'blur(12px)', top: 0, left: 0, pointerEvents: 'none', zIndex: -4,
                transform: 'translate(calc(50vw - 50%), calc(50vh - 50%))',
            }} />

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                backgroundSize: '28px 28px',
            }} />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(255,255,255,0.08) 100%)',
            }} />
        </div>
    );
});
