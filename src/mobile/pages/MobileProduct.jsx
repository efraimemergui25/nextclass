import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ShoppingBag, ChevronDown, Check, Send, Scale, Share2, Truck, Lock, Star, MessageCircle, Home, Monitor, X } from 'lucide-react';
import { useProducts } from '../../context/ProductsContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { haptic } from '../utils/haptic';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import MobileProductCard from '../components/MobileProductCard';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

const ICON_PATHS = {
    lightning: "M13 10V3L4 14h7v7l9-11h-7z",
    clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    ruler: "M3 6l3 1m0 0l-3 9a5 5 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
    wrench: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    headset: "M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
    question: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
};

function SidebarIcon({ name, active }) {
    return (
        <svg width="17" height="17" style={{ color: active ? '#007AFF' : undefined, flexShrink: 0 }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name] || ICON_PATHS.clipboard} />
        </svg>
    );
}

const DEFAULT_SIDEBAR_SECTIONS = [
    { id: 'pd-features', labelKey: 'sidebar_label_features', defaultLabel: 'תכונות בולטות', icon: 'lightning', visKey: 'sidebar_vis_features' },
    { id: 'pd-dims',     labelKey: 'sidebar_label_dims',     defaultLabel: 'מידות המוצר',   icon: 'ruler',     visKey: 'sidebar_vis_dims'     },
    { id: 'pd-specs',    labelKey: 'sidebar_label_specs',    defaultLabel: 'מפרט טכני',      icon: 'wrench',    visKey: 'sidebar_vis_specs'    },
    { id: 'pd-warranty', labelKey: 'sidebar_label_warranty', defaultLabel: 'תנאי אחריות',    icon: 'clipboard', visKey: 'sidebar_vis_warranty'  },
    { id: 'pd-support',  labelKey: 'sidebar_label_support',  defaultLabel: 'שירות ותמיכה',   icon: 'headset',   visKey: 'sidebar_vis_support'   },
    { id: 'pd-qa',       labelKey: 'sidebar_label_qa',       defaultLabel: 'שאלות גולשים',   icon: 'question',  visKey: 'sidebar_vis_qa'        },
    { id: 'pd-reviews',  labelKey: 'sidebar_label_reviews',  defaultLabel: 'חוות דעת',       icon: 'star',      visKey: 'sidebar_vis_reviews'   },
];

function trackRecentlyViewed(id) {
    try {
        const key  = 'nc_recently_viewed';
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const next = [id, ...prev.filter(x => x !== id)].slice(0, 8);
        localStorage.setItem(key, JSON.stringify(next));
    } catch {}
}

// ─── Pinchable Image ──────────────────────────────────────────────────────────
function PinchableImage({ src, alt, loaded, onLoad, onZoomChange, shimmerA, shimmerB }) {
    const ref      = useRef(null);
    const state    = useRef({ scale: 1, panX: 0, panY: 0, startDist: 0, startScale: 1, startPanX: 0, startPanY: 0, midX: 0, midY: 0, lastTap: 0 });
    const [zoomed, setZoomed] = useState(false);

    const applyTransform = (scale, px, py) => {
        if (ref.current) {
            ref.current.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
        }
    };

    const setZoom = useCallback((val) => {
        setZoomed(val);
        onZoomChange?.(val);
    }, [onZoomChange]);

    const resetZoom = useCallback(() => {
        const s = state.current;
        s.scale = 1; s.panX = 0; s.panY = 0;
        applyTransform(1, 0, 0);
        setZoom(false);
    }, [setZoom]);

    const clampPan = (scale, px, py, rect) => {
        const maxPanX = Math.max(0, (rect.width * scale - rect.width) / 2);
        const maxPanY = Math.max(0, (rect.height * scale - rect.height) / 2);
        return [
            Math.min(maxPanX, Math.max(-maxPanX, px)),
            Math.min(maxPanY, Math.max(-maxPanY, py)),
        ];
    };

    useEffect(() => {
        const el = ref.current?.parentElement;
        if (!el) return;

        const onTouchStart = (e) => {
            const s = state.current;
            if (e.touches.length === 2) {
                e.preventDefault();
                const [t1, t2] = e.touches;
                s.startDist  = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                s.startScale = s.scale;
                s.midX = (t1.clientX + t2.clientX) / 2;
                s.midY = (t1.clientY + t2.clientY) / 2;
                s.startPanX = s.panX;
                s.startPanY = s.panY;
            } else if (e.touches.length === 1) {
                const now = Date.now();
                if (now - s.lastTap < 300) {
                    // double-tap: toggle zoom
                    if (s.scale > 1) { resetZoom(); }
                    else {
                        s.scale = 2.5; s.panX = 0; s.panY = 0;
                        applyTransform(2.5, 0, 0);
                        setZoom(true);
                    }
                }
                s.lastTap = now;
                if (s.scale > 1) {
                    s.startPanX = s.panX;
                    s.startPanY = s.panY;
                    s.midX = e.touches[0].clientX;
                    s.midY = e.touches[0].clientY;
                }
            }
        };

        const onTouchMove = (e) => {
            const s = state.current;
            if (e.touches.length === 2) {
                e.preventDefault();
                const [t1, t2] = e.touches;
                const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                s.scale = Math.min(4, Math.max(1, s.startScale * (dist / s.startDist)));
                const rect = ref.current?.getBoundingClientRect() || { width: 300, height: 300 };
                const [cx, cy] = clampPan(s.scale, s.startPanX, s.startPanY, rect);
                s.panX = cx; s.panY = cy;
                applyTransform(s.scale, s.panX, s.panY);
                setZoom(s.scale > 1.05);
            } else if (e.touches.length === 1 && s.scale > 1) {
                e.preventDefault();
                const dx = e.touches[0].clientX - s.midX;
                const dy = e.touches[0].clientY - s.midY;
                const rect = ref.current?.getBoundingClientRect() || { width: 300, height: 300 };
                const [cx, cy] = clampPan(s.scale, s.startPanX + dx, s.startPanY + dy, rect);
                s.panX = cx; s.panY = cy;
                applyTransform(s.scale, s.panX, s.panY);
            }
        };

        const onTouchEnd = (e) => {
            const s = state.current;
            if (s.scale < 1.05) resetZoom();
        };

        el.addEventListener('touchstart', onTouchStart, { passive: false });
        el.addEventListener('touchmove',  onTouchMove,  { passive: false });
        el.addEventListener('touchend',   onTouchEnd,   { passive: true });
        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove',  onTouchMove);
            el.removeEventListener('touchend',   onTouchEnd);
        };
    }, [resetZoom, setZoom]);

    return (
        <>
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, ${shimmerA} 25%, ${shimmerB} 50%, ${shimmerA} 75%)`,
                    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', willChange: 'background-position',
                }} />
            )}
            <img
                ref={ref}
                src={src}
                alt={alt}
                onLoad={onLoad}
                style={{
                    width: '85%', height: '85%', objectFit: 'contain',
                    opacity: loaded ? 1 : 0, transition: 'opacity 0.3s',
                    userSelect: 'none', WebkitUserSelect: 'none',
                    transformOrigin: 'center center',
                    willChange: 'transform',
                    cursor: zoomed ? 'grab' : 'zoom-in',
                }}
                draggable={false}
            />
            {zoomed && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={resetZoom}
                    style={{
                        position: 'absolute', top: 10, left: 10, zIndex: 5,
                        background: 'rgba(0,0,0,0.72)',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 99,
                        cursor: 'pointer', fontFamily: SF,
                    }}
                >
                    לחץ לאיפוס
                </motion.div>
            )}
        </>
    );
}

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images, alt }) {
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded]   = useState({});
    const [isZoomed, setIsZoomed] = useState(false);
    const dragX = useMotionValue(0);
    const count = images.length;
    const { colors: c } = useTheme();

    const goTo = (i) => setCurrent(Math.max(0, Math.min(count - 1, i)));

    const handleDragEnd = (_, { offset, velocity }) => {
        if (isZoomed) return;
        if (offset.x < -40 || velocity.x < -200) goTo(current + 1);
        else if (offset.x > 40 || velocity.x > 200) goTo(current - 1);
        dragX.set(0);
    };

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: `linear-gradient(145deg, ${c.shimmerA}, ${c.shimmerB})` }}>
            <motion.div
                drag={count > 1 && !isZoomed ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                style={{ x: dragX, display: 'flex', width: `${count * 100}%` }}
                animate={{ x: `-${(current / count) * 100}%` }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
                {images.map((src, i) => (
                    <div key={i} style={{
                        width: `${100 / count}%`, flexShrink: 0,
                        aspectRatio: '4/3', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                    }}>
                        <PinchableImage
                            src={src}
                            alt={`${alt} ${i + 1}`}
                            loaded={!!loaded[i]}
                            onLoad={() => setLoaded(l => ({ ...l, [i]: true }))}
                            onZoomChange={setIsZoomed}
                            shimmerA={c.shimmerA}
                            shimmerB={c.shimmerB}
                        />
                    </div>
                ))}
            </motion.div>

            {/* Dots */}
            {count > 1 && (
                <div style={{
                    position: 'absolute', bottom: 10, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: 5, pointerEvents: 'none',
                }}>
                    {images.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ width: i === current ? 18 : 6, background: i === current ? '#007AFF' : 'rgba(0,0,0,0.25)' }}
                            style={{ height: 6, borderRadius: 99 }}
                        />
                    ))}
                </div>
            )}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
    );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, children, defaultOpen = false, c }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div style={{ borderBottom: `0.5px solid ${c.divider}` }}>
            <button
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', background: 'none', border: 'none',
                    cursor: 'pointer', direction: 'rtl', fontFamily: SF,
                    WebkitTapHighlightColor: 'transparent', minHeight: 52,
                }}
            >
                <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{title}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={17} color={c.text4} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingBottom: 16 }}>{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Q&A Section ──────────────────────────────────────────────────────────────
function QASection({ productId, c }) {
    const [questions, setQuestions] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [form,      setForm]      = useState({ author: '', question: '' });
    const [sending,   setSending]   = useState(false);
    const [sent,      setSent]      = useState(false);

    useEffect(() => {
        getDocs(query(
            collection(db, 'product_questions'),
            where('productId', '==', productId),
            orderBy('timestamp', 'desc')
        )).then(snap => {
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [productId]);

    const handleSubmit = useCallback(async () => {
        if (!form.author.trim() || !form.question.trim()) return;
        setSending(true);
        try {
            await addDoc(collection(db, 'product_questions'), {
                productId, author: form.author, question: form.question,
                timestamp: serverTimestamp(), status: 'pending', answers: [],
            });
            haptic('success');
            setSent(true);
            setForm({ author: '', question: '' });
            setTimeout(() => setSent(false), 3500);
        } catch {}
        setSending(false);
    }, [form, productId]);

    const inputBase = {
        padding: '11px 14px', borderRadius: 10,
        border: `1.5px solid ${c.divider}`,
        background: c.input, fontSize: 16,
        direction: 'rtl', fontFamily: SF, outline: 'none', color: c.text,
        width: '100%', boxSizing: 'border-box', transition: 'border-color 0.15s',
    };

    return (
        <div>
            {loading ? (
                <div style={{ padding: '4px 0 12px' }}>
                    {[1, 2].map(i => <div key={i} style={{ height: 56, background: c.surface2, borderRadius: 10, marginBottom: 8 }} />)}
                </div>
            ) : questions.length === 0 ? (
                <p style={{ fontSize: 13, color: c.text3, padding: '4px 0 12px', lineHeight: 1.5 }}>
                    אין שאלות עדיין — שאל את הראשון!
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {questions.map(q => (
                        <div key={q.id} style={{ background: c.surface2, borderRadius: 12, padding: '12px 14px' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 3, lineHeight: 1.4 }}>{q.question}</p>
                            <p style={{ fontSize: 11, color: c.text3, marginBottom: q.answers?.length ? 10 : 0 }}>{q.author}</p>
                            {q.answers?.map((a, i) => (
                                <div key={i} style={{ background: 'rgba(52,199,89,0.07)', border: '0.5px solid rgba(52,199,89,0.18)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                                    <p style={{ fontSize: 10, color: '#34C759', fontWeight: 800, marginBottom: 3 }}>תשובת NextClass</p>
                                    <p style={{ fontSize: 13, color: c.text, lineHeight: 1.5 }}>{a.text}</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {sent ? (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(52,199,89,0.08)', borderRadius: 10, color: '#34C759', fontSize: 14, fontWeight: 700 }}
                >
                    <Check size={15} strokeWidth={3} /> השאלה נשלחה — נענה בהקדם
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                        value={form.author}
                        onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                        placeholder="השם שלך"
                        style={inputBase}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <textarea
                            value={form.question}
                            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                            placeholder="כתוב שאלה..."
                            rows={2}
                            style={{ ...inputBase, flex: 1, resize: 'none' }}
                        />
                        <motion.button
                            whileTap={{ scale: 0.86 }}
                            onClick={handleSubmit}
                            disabled={sending || !form.author || !form.question}
                            aria-label="שלח שאלה"
                            style={{
                                width: 46, borderRadius: 10, flexShrink: 0, alignSelf: 'stretch',
                                background: (!form.author || !form.question) ? c.surface2 : '#007AFF',
                                color: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                WebkitTapHighlightColor: 'transparent', transition: 'background 0.15s',
                            }}
                        >
                            <Send size={16} />
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Product Nav FAB — always-visible circle, flush to right wall ─────────────
function ProductNavFAB() {
    const { getSetting, isVisible } = useSettings();
    const { colors: c } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeId, setActiveId] = useState(null);

    const sidebarEnabled = isVisible('sidebar_visible', true);
    const savedOrder = getSetting('sidebar_sections_order', null);
    const orderedSections = Array.isArray(savedOrder)
        ? savedOrder.map(id => DEFAULT_SIDEBAR_SECTIONS.find(s => s.id === id)).filter(Boolean)
        : DEFAULT_SIDEBAR_SECTIONS;
    const sections = orderedSections
        .filter(s => isVisible(s.visKey, true))
        .map(s => ({ ...s, label: getSetting(s.labelKey, s.defaultLabel) }));

    // Track which section is most visible in viewport
    useEffect(() => {
        if (!sections.length) return;
        const ratioMap = {};
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => { ratioMap[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
                let bestId = null, bestRatio = 0;
                sections.forEach(s => {
                    if ((ratioMap[s.id] || 0) > bestRatio) { bestRatio = ratioMap[s.id]; bestId = s.id; }
                });
                setActiveId(bestRatio > 0 ? bestId : null);
            },
            { threshold: [0, 0.15, 0.4], rootMargin: '-60px 0px -20% 0px' }
        );
        sections.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
        return () => obs.disconnect();
    }, [sections.map(s => s.id).join()]);

    const scrollTo = (id) => {
        haptic('light');
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' });
        setMenuOpen(false);
    };

    if (!sidebarEnabled || !sections.length) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        key="nav-fab-bd"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setMenuOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 148 }}
                    />
                )}
            </AnimatePresence>

            {/* Container — flush to right wall */}
            <div style={{
                position: 'fixed',
                right: 0,
                bottom: 'calc(138px + env(safe-area-inset-bottom, 0px))',
                zIndex: 149,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
                pointerEvents: 'none',
            }}>
                {/* Floating section menu — slides in from right */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            key="nav-fab-menu"
                            initial={{ opacity: 0, x: 20, scale: 0.94 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 12, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                            dir="rtl"
                            style={{
                                marginRight: 8,
                                background: c.surface,
                                backdropFilter: 'blur(16px) saturate(1.8)',
                                WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
                                borderRadius: 18,
                                border: `1px solid ${c.border}`,
                                boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                minWidth: 176,
                                pointerEvents: 'all',
                            }}
                        >
                            {/* Header: X on right (RTL), title on left */}
                            <div style={{
                                padding: '9px 10px 9px 14px',
                                borderBottom: `0.5px solid ${c.divider}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <motion.button
                                    whileTap={{ scale: 0.84 }}
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                                        background: c.input, border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    <X size={12} color={c.text3} strokeWidth={2.5} />
                                </motion.button>
                                <p style={{ fontSize: 10, fontWeight: 800, color: '#007AFF', letterSpacing: '0.06em', margin: 0 }}>ניווט מהיר</p>
                            </div>

                            {/* Section rows with active highlight */}
                            {sections.map((s, i) => {
                                const isActive = s.id === activeId;
                                return (
                                    <motion.button
                                        key={s.id}
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => scrollTo(s.id)}
                                        style={{
                                            position: 'relative',
                                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '11px 14px',
                                            background: isActive ? 'rgba(0,122,255,0.07)' : 'transparent',
                                            border: 'none',
                                            borderBottom: i < sections.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                            cursor: 'pointer', fontFamily: SF,
                                            WebkitTapHighlightColor: 'transparent',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-nav-bar"
                                                style={{
                                                    position: 'absolute', right: 0, top: 5, bottom: 5,
                                                    width: 3, borderRadius: '2px 0 0 2px',
                                                    background: '#007AFF',
                                                }}
                                            />
                                        )}
                                        <SidebarIcon name={s.icon} active={isActive} />
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: isActive ? 700 : 600,
                                            color: isActive ? '#007AFF' : c.text,
                                            flex: 1, textAlign: 'right',
                                        }}>
                                            {s.label}
                                        </span>
                                        {isActive && (
                                            <motion.div
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                style={{ width: 7, height: 7, borderRadius: 3.5, background: '#007AFF', flexShrink: 0 }}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Circle FAB — compass / X toggle, flush to right wall */}
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => { haptic('select'); setMenuOpen(o => !o); }}
                    style={{
                        pointerEvents: 'all',
                        position: 'relative',
                        width: 52, height: 52, borderRadius: 26,
                        marginRight: 6,
                        background: menuOpen
                            ? 'linear-gradient(135deg, #1D1D1F, #2C2C2E)'
                            : c.surface,
                        border: `1px solid ${menuOpen ? 'rgba(255,255,255,0.10)' : c.border}`,
                        boxShadow: menuOpen
                            ? '0 4px 20px rgba(0,0,0,0.32)'
                            : '0 4px 20px rgba(0,0,0,0.12)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 3, cursor: 'pointer', fontFamily: SF,
                        WebkitTapHighlightColor: 'transparent',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {menuOpen ? (
                            <motion.div key="close"
                                initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.15 }}>
                                <X size={18} color="#fff" strokeWidth={2.5} />
                            </motion.div>
                        ) : (
                            <motion.div key="compass"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.15 }}>
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress pills — show position in document */}
                    {!menuOpen && (
                        <div style={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                            {sections.map(s => (
                                <motion.div
                                    key={s.id}
                                    animate={{
                                        width: s.id === activeId ? 7 : 4,
                                        background: s.id === activeId ? '#007AFF' : 'rgba(0,122,255,0.28)',
                                    }}
                                    transition={{ duration: 0.25 }}
                                    style={{ height: 4, borderRadius: 2 }}
                                />
                            ))}
                        </div>
                    )}
                </motion.button>
            </div>
        </>,
        document.body
    );
}

// ─── Accessories Section ─────────────────────────────────────────────────────
function AccessoriesSection({ getSetting, navigate, product, c }) {
    const [selected, setSelected] = useState({});
    const accessories = [
        { id: 'hdmi',  title: getSetting('acc_hdmi_title',  'כבל HDMI פרימיים 2.1'),   desc: getSetting('acc_hdmi_desc',  '8K 60Hz עם מגן אלקטרומגנטי'),        price: parseInt(getSetting('acc_hdmi_price',  '150'))  },
        { id: 'mount', title: getSetting('acc_mount_title', 'מתקן תלייה מגנטי'),        desc: getSetting('acc_mount_desc', 'התקנה בתוך דקות, זרוע מתכוונן'),     price: parseInt(getSetting('acc_mount_price', '300'))  },
        { id: 'ext1',  title: getSetting('acc_ext1_title',  ''),                         desc: getSetting('acc_ext1_desc',  ''),                                    price: parseInt(getSetting('acc_ext1_price',  '0'))    },
        { id: 'ext2',  title: getSetting('acc_ext2_title',  ''),                         desc: getSetting('acc_ext2_desc',  ''),                                    price: parseInt(getSetting('acc_ext2_price',  '0'))    },
    ].filter(a => a.title);

    const toggleAcc = (id) => { haptic('select'); setSelected(s => ({ ...s, [id]: !s[id] })); };
    const selectedList = accessories.filter(a => selected[a.id]);
    const totalExtra = selectedList.reduce((sum, a) => sum + (a.price || 0), 0);

    const handleOrder = () => {
        haptic('medium');
        const names = selectedList.map(a => a.title).join(', ');
        navigate(`/contact?subject=${encodeURIComponent(`הזמנת אביזרים: ${names} (עם ${product.title})`)}`);
    };

    return (
        <div id="section-accessories" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
            <Accordion title="השלם את המערכת שלך" c={c}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {accessories.map((acc, i) => {
                        const isSelected = !!selected[acc.id];
                        return (
                            <motion.div
                                key={acc.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleAcc(acc.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                                    background: isSelected ? 'rgba(0,122,255,0.06)' : c.bg,
                                    border: `1.5px solid ${isSelected ? 'rgba(0,122,255,0.30)' : c.border}`,
                                    marginBottom: 6, transition: 'all 0.16s',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <div style={{
                                    width: 22, height: 22, borderRadius: 99, flexShrink: 0,
                                    background: isSelected ? '#007AFF' : c.input,
                                    border: `1.5px solid ${isSelected ? '#007AFF' : c.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.16s',
                                }}>
                                    {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 2 }}>{acc.title}</p>
                                    <p style={{ fontSize: 12, color: c.text3 }}>{acc.desc}</p>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#007AFF' : c.text3, flexShrink: 0 }}>
                                    {acc.price ? `+₪${acc.price.toLocaleString()}` : 'לפי הצעה'}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {selectedList.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: 12 }}
                    >
                        {totalExtra > 0 && (
                            <p style={{ fontSize: 12, color: c.text3, textAlign: 'left', marginBottom: 8 }}>
                                תוספת: <span style={{ color: c.text, fontWeight: 700 }}>+₪{totalExtra.toLocaleString()}</span>
                            </p>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={handleOrder}
                            style={{
                                width: '100%', padding: '13px 0', borderRadius: 14,
                                background: '#007AFF', color: '#fff', border: 'none',
                                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                fontFamily: SF, WebkitTapHighlightColor: 'transparent',
                                boxShadow: '0 4px 14px rgba(0,122,255,0.25)',
                            }}
                        >
                            הזמן אביזרים נבחרים ({selectedList.length})
                        </motion.button>
                    </motion.div>
                )}
                {selectedList.length === 0 && (
                    <p style={{ fontSize: 12, color: c.text4, marginTop: 8 }}>בחר אביזר להוספת לפנייה</p>
                )}
            </Accordion>
        </div>
    );
}

// ─── Color Selector ───────────────────────────────────────────────────────────
function ColorSelector({ colors, c }) {
    const [selected, setSelected] = useState(colors[0]);
    return (
        <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: c.text3, marginBottom: 8 }}>
                צבע: <span style={{ color: c.text, fontWeight: 700 }}>{selected?.name || selected}</span>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {colors.map(color => {
                    const name  = typeof color === 'object' ? color.name  : color;
                    const hex   = typeof color === 'object' ? color.hex   : null;
                    const isSelected = (typeof color === 'object' ? color.name : color) === (typeof selected === 'object' ? selected.name : selected);
                    return (
                        <motion.button
                            key={name}
                            whileTap={{ scale: 0.88 }}
                            onClick={() => { haptic('select'); setSelected(color); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 12px', borderRadius: 99,
                                background: isSelected ? 'rgba(0,122,255,0.08)' : c.input,
                                border: isSelected ? '1.5px solid #007AFF' : `1px solid ${c.border}`,
                                cursor: 'pointer', fontFamily: SF, WebkitTapHighlightColor: 'transparent',
                                transition: 'all 0.16s',
                            }}
                        >
                            {hex && (
                                <div style={{
                                    width: 14, height: 14, borderRadius: 99,
                                    background: hex, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
                                }} />
                            )}
                            <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? '#007AFF' : c.text }}>{name}</span>
                            {isSelected && <Check size={12} color="#007AFF" strokeWidth={3} />}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MobileProduct() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const { getActiveProductById, activeProducts } = useProducts();
    const { addToCart }                            = useCart();
    const { toggleWishlist, isInWishlist }         = useWishlist();
    const { addToCompare, isSelected }             = useCompare();
    const { colors: c }                            = useTheme();
    const { getSetting, isVisible }                = useSettings();

    const product    = getActiveProductById(id);
    const wishlisted = isInWishlist(id);
    const inCompare  = isSelected(id);
    const [added, setAdded] = useState(false);
    const [qty, setQty] = useState(1);
    const addedTimer = useRef(null);

    useEffect(() => {
        if (id) trackRecentlyViewed(id);
        window.scrollTo(0, 0);
    }, [id]);

    const related = activeProducts
        .filter(p => p.category === product?.category && String(p.id) !== String(id))
        .slice(0, 6);


    if (!product) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(142,142,147,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Monitor size={36} color="#8E8E93" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: c.text, marginBottom: 8 }}>מוצר לא נמצא</p>
            <button onClick={() => navigate('/catalog')} style={{
                background: '#007AFF', color: '#fff', border: 'none', borderRadius: 14,
                padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
                לקטלוג
            </button>
        </div>
    );

    const handleAdd = () => {
        haptic('success');
        for (let i = 0; i < qty; i++) addToCart(product);
        setAdded(true);
        clearTimeout(addedTimer.current);
        addedTimer.current = setTimeout(() => setAdded(false), 2200);
    };

    useEffect(() => () => clearTimeout(addedTimer.current), []);

    const handleWishlist = () => {
        haptic(wishlisted ? 'light' : 'medium');
        toggleWishlist(product);
    };

    const handleCompare = () => {
        haptic('light');
        addToCompare(product);
    };

    const handleShare = async () => {
        haptic('light');
        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.title,
                    text: `${product.title} — ₪${displayPrice?.toLocaleString()} | NextClass`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch {}
    };

    const displayPrice = product.salePrice || product.price;
    const discount = product.salePrice && product.price
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : 0;

    const images = product.images?.length ? product.images : (product.image ? [product.image] : []);

    return (
        <div style={{ fontFamily: SF, direction: 'rtl', background: c.bg, minHeight: '100dvh', paddingBottom: 110 }}>

            {/* ── Hero Image / Carousel ──────────────────────────────── */}
            <div style={{ position: 'relative' }}>
                {images.length > 0 ? (
                    <ImageCarousel images={images} alt={product.title} />
                ) : (
                    <div style={{ width: '100%', aspectRatio: '4/3', background: `linear-gradient(145deg, ${c.shimmerA}, ${c.shimmerB})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Monitor size={64} color={c.text4} strokeWidth={1} style={{ opacity: 0.25 }} />
                    </div>
                )}

                {/* Badges overlay */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 5 }}>
                    {product.isNew && <span style={{ background: '#007AFF', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>חדש</span>}
                    {product._isBestSeller && <span style={{ background: '#FF9500', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>מובחר</span>}
                    {discount > 0 && <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99 }}>-{discount}%</span>}
                </div>

                {/* Action buttons (share + wishlist) */}
                <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 8 }}>
                    <motion.button
                        whileTap={{ scale: 0.78 }}
                        onClick={handleShare}
                        aria-label="שתף מוצר"
                        style={{
                            width: 44, height: 44, borderRadius: 99,
                            background: c.surface,
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <Share2 size={18} color={c.text2} strokeWidth={2} />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.78 }}
                        onClick={handleWishlist}
                        aria-label={wishlisted ? `הסר ${product.title} מהמועדפים` : `הוסף ${product.title} למועדפים`}
                        style={{
                            width: 44, height: 44, borderRadius: 99,
                            background: wishlisted ? 'rgba(255,45,85,0.12)' : c.surface,
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
                            WebkitTapHighlightColor: 'transparent', transition: 'background 0.18s',
                        }}
                    >
                        <Heart size={20} fill={wishlisted ? '#FF2D55' : 'none'} color={wishlisted ? '#FF2D55' : c.text2} strokeWidth={2} />
                    </motion.button>
                </div>
            </div>

            {/* ── Breadcrumb ────────────────────────────────────────────── */}
            <div style={{ padding: '10px 18px 0', background: c.surface, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    <Home size={12} color={c.text4} strokeWidth={2} />
                </button>
                <span style={{ fontSize: 11, color: c.text4 }}>/</span>
                {product.category && (
                    <>
                        <button onClick={() => navigate(`/catalog?category=${encodeURIComponent(product.category)}`)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, color: c.text3, fontFamily: SF, fontWeight: 500, WebkitTapHighlightColor: 'transparent' }}>
                            {product.category}
                        </button>
                        <span style={{ fontSize: 11, color: c.text4 }}>/</span>
                    </>
                )}
                <span style={{ fontSize: 11, color: c.text2, fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</span>
            </div>

            {/* ── Info Card ─────────────────────────────────────────────── */}
            <div style={{ background: c.surface, marginBottom: 10, padding: '12px 18px 20px' }}>
                {product.category && (
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        marginBottom: 10,
                    }}>
                        {product.category}
                    </span>
                )}
                <h1 style={{ fontSize: 21, fontWeight: 900, color: c.text, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 10 }}>
                    {product.title}
                </h1>
                {product.sku && (
                    <p style={{ fontSize: 11, color: c.text4, fontFamily: 'monospace', marginBottom: 10 }}>SKU: {product.sku}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: product.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.03em' }}>
                        ₪{displayPrice?.toLocaleString()}
                    </span>
                    {product.salePrice && (
                        <span style={{ fontSize: 16, color: c.text4, textDecoration: 'line-through' }}>
                            ₪{product.price?.toLocaleString()}
                        </span>
                    )}
                </div>
                {product.description && (
                    <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65, marginBottom: product.colors?.length ? 16 : 0 }}>
                        {product.description}
                    </p>
                )}

                {/* Color selector — shown only when product has color variants */}
                {product.colors?.length > 0 && <ColorSelector colors={product.colors} c={c} />}
            </div>

            {/* ── Key Features Showcase (cinematic, matches desktop scrollytelling) ── */}
            {(() => {
                // Priority: CMS per-feature image → product images → product main image → null (icon fallback)
                const prodImgs = product.images?.length ? product.images : (product.image ? [product.image] : []);
                const fi = (key, idx) => getSetting(key, '') || prodImgs[idx] || prodImgs[0] || null;
                const features = [
                    { title: getSetting('feat1_title', 'חוויית 4K קולנועית'),       desc: getSetting('feat1_desc', 'פאנל ה-OLED מעניק חדות בלתי מתפשרת וצבעים מדויקים.'),               img: fi('feat1_img', 0) },
                    { title: getSetting('feat2_title', 'חיבור מיידי, ללא כבלים'),   desc: getSetting('feat2_desc', 'שתף מהסמארטפון ישירות למסך הגדול עם AirPlay ו-Miracast.'),           img: fi('feat2_img', 1) },
                    { title: getSetting('feat3_title', 'אינטראקציה חכמה'),          desc: getSetting('feat3_desc', 'ניהול אפליקציות וכלי למידה בלחיצה אחת, זרימה חופשית.'),             img: fi('feat3_img', 2) },
                    { title: getSetting('feat4_title', 'עוצמה שדוחפת קדימה'),       desc: getSetting('feat4_desc', 'מעבד M2 Pro — ללא השהיות, ללא פשרות, הכל רץ מהר.'),                 img: fi('feat4_img', 3) },
                ];
                return (
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ padding: '14px 18px 10px', background: c.surface }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 4 }}>תכונות בולטות</p>
                            <h3 style={{ fontSize: 17, fontWeight: 900, color: '#007AFF', letterSpacing: '-0.03em' }}>מה הופך את המוצר הזה למוביל</h3>
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', background: c.surface }}>
                            {features.map((f, i) => (
                                <div key={i} style={{ flexShrink: 0, width: 200, borderRadius: 16, overflow: 'hidden', background: c.bg, border: `0.5px solid ${c.border}` }}>
                                    <div style={{ width: '100%', height: 120, overflow: 'hidden', background: c.shimmerA, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {f.img
                                            ? <img src={f.img} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                            : <Monitor size={32} color={c.text4} strokeWidth={1} style={{ opacity: 0.3 }} />
                                        }
                                    </div>
                                    <div style={{ padding: '12px 14px 14px' }}>
                                        <p style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 4, lineHeight: 1.3 }}>{f.title}</p>
                                        <p style={{ fontSize: 11, color: c.text3, lineHeight: 1.5 }}>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* ── Trust badges strip — matches desktop TrustBadges component ── */}
            <div style={{ background: c.surface, marginBottom: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', gap: 8 }}>
                    {[
                        { Icon: Truck,         color: '#007AFF', label: getSetting('trust_delivery', 'משלוח מהיר') },
                        { Icon: Lock,          color: '#30D158', label: getSetting('trust_secure', 'תשלום מאובטח') },
                        { Icon: Star,          color: '#FF9500', label: getSetting('trust_warranty', 'אחריות מלאה') },
                        { Icon: MessageCircle, color: '#5856D6', label: getSetting('trust_support', 'תמיכה ישירה') },
                    ].map(({ Icon, color, label }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={18} color={color} strokeWidth={1.8} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 600, color: c.text3, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Accordion Sections ────────────────────────────────────── */}
            {product.features?.length > 0 && (
                <div id="pd-features" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="תכונות בולטות" c={c}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {product.features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                                        <Check size={10} color="#34C759" strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: 14, color: c.text2, lineHeight: 1.45 }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                </div>
            )}

            {/* ── Dimensions ───────────────────────────────────────────── */}
            <div id="pd-dims" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="מידות המוצר" c={c}>
                    {[
                        { label: getSetting('pd_dims_w_label', 'רוחב'),  value: getSetting('pd_dims_w_value',  '') },
                        { label: getSetting('pd_dims_h_label', 'גובה'),  value: getSetting('pd_dims_h_value',  '') },
                        { label: getSetting('pd_dims_d_label', 'עומק'),  value: getSetting('pd_dims_d_value',  '') },
                        { label: getSetting('pd_dims_wt_label', 'משקל'), value: getSetting('pd_dims_wt_value', '') },
                    ].filter(d => d.value).map((d, i, arr) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                            borderBottom: i < arr.length - 1 ? `0.5px solid ${c.divider}` : 'none', gap: 12,
                        }}>
                            <span style={{ fontSize: 14, color: c.text, fontWeight: 500 }}>{d.value}</span>
                            <span style={{ fontSize: 12, color: c.text3 }}>{d.label}</span>
                        </div>
                    ))}
                    {!getSetting('pd_dims_w_value', '') && !getSetting('pd_dims_h_value', '') && (
                        <p style={{ fontSize: 13, color: c.text3, lineHeight: 1.55 }}>
                            {getSetting('pd_dims_note', 'לפרטי מידות ומשקל פנה אלינו ישירות.')}
                        </p>
                    )}
                </Accordion>
            </div>

            {product.specs?.length > 0 && (
                <div id="pd-specs" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="מפרט טכני" defaultOpen c={c}>
                        {product.specs.map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                padding: '10px 0',
                                borderBottom: i < product.specs.length - 1 ? `0.5px solid ${c.divider}` : 'none',
                                gap: 12,
                            }}>
                                <span style={{ fontSize: 14, color: c.text, fontWeight: 500 }}>{s.value}</span>
                                <span style={{ fontSize: 12, color: c.text3, flexShrink: 0 }}>{s.label}</span>
                            </div>
                        ))}
                    </Accordion>
                </div>
            )}

            {product.warranty && (
                <div id="pd-warranty" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                    <Accordion title="אחריות ותנאים" c={c}>
                        <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65 }}>{product.warranty}</p>
                    </Accordion>
                </div>
            )}

            {/* ── Accessories ("השלם את המערכת") — matches desktop ─────── */}
            <AccessoriesSection getSetting={getSetting} navigate={navigate} product={product} c={c} />

            {/* ── Support ──────────────────────────────────────────────── */}
            <div id="pd-support" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="שירות ותמיכה" c={c}>
                    <p style={{ fontSize: 14, color: c.text2, lineHeight: 1.65, marginBottom: 14 }}>
                        {getSetting('pd_support_text', 'צוות NextClass זמין לתמיכה מלאה לפני ואחרי הרכישה — טלפון, וואטסאפ ומייל.')}
                    </p>
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate('/contact')}
                        style={{
                            width: '100%', padding: '12px 0', borderRadius: 12,
                            background: 'rgba(0,122,255,0.08)', color: '#007AFF',
                            border: '1.5px solid rgba(0,122,255,0.20)',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            fontFamily: SF, WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {getSetting('pd_support_cta', 'צור קשר עם התמיכה')}
                    </motion.button>
                </Accordion>
            </div>

            {/* ── FAQ — matches desktop "שאלות נפוצות" CMS section ──────── */}
            <div id="pd-faq" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="שאלות נפוצות" c={c}>
                    {[
                        { q: getSetting('pd_faq_q1', 'מהו זמן האספקה הצפוי?'),              a: getSetting('pd_faq_a1', 'אספקה תוך 3–7 ימי עסקים. הזמנות גדולות עשויות לקחת עד 14 יום.') },
                        { q: getSetting('pd_faq_q2', 'האם ניתן לקבל הצעת מחיר מוסדית?'),  a: getSetting('pd_faq_a2', 'כן! מלאו טופס יצירת קשר לקבלת הצעת מחיר מותאמת.') },
                        { q: getSetting('pd_faq_q3', 'כיצד מתנהל השירות לאחר הרכישה?'),   a: getSetting('pd_faq_a3', 'שירות ישיר — טלפון, וואטסאפ או מייל — מענה מהיר ומקצועי.') },
                        { q: getSetting('pd_faq_q4', 'האם ניתן להתאים לתקציב ספציפי?'),   a: getSetting('pd_faq_a4', 'בהחלט. נציג מקצועי ייעץ ויתאים פתרון מדויק לצרכים ולתקציב.') },
                        { q: getSetting('pd_faq_q5', 'כיצד ניתן להחזיר מוצר?'),            a: getSetting('pd_faq_a5', 'פנה אלינו בכל ערוץ — נלווה אותך בתהליך בצורה מהירה ומקצועית.') },
                    ].filter(item => item.q && item.a).map((item, i) => (
                        <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `0.5px solid ${c.divider}` }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 6 }}>{item.q}</p>
                            <p style={{ fontSize: 13, color: c.text2, lineHeight: 1.6 }}>{item.a}</p>
                        </div>
                    ))}
                </Accordion>
            </div>

            {/* ── Q&A ──────────────────────────────────────────────────── */}
            <div id="pd-qa" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                <Accordion title="שאלות ותשובות" c={c}>
                    <QASection productId={id} c={c} />
                </Accordion>
            </div>

            {/* ── Reviews ──────────────────────────────────────────────── */}
            {isVisible('vis_reviews', true) && (() => {
                const avg = getSetting('pd_reviews_avg', '4.8');
                const count = getSetting('pd_reviews_count', '24');
                const reviews = [
                    {
                        name:  getSetting('pd_review1_name',  'שרה כ.'),
                        role:  getSetting('pd_review1_role',  'מורה, חט"ב גבעתיים'),
                        text:  getSetting('pd_review1_text',  'ממש שדרגנו את הכיתה! הנוחות והמהירות מדהימים.'),
                        stars: Number(getSetting('pd_review1_stars', 5)),
                    },
                    {
                        name:  getSetting('pd_review2_name',  'דוד מ.'),
                        role:  getSetting('pd_review2_role',  'רכז טכנולוגיה'),
                        text:  getSetting('pd_review2_text',  'התמיכה של NextClass מעולה. התקנה מהירה.'),
                        stars: Number(getSetting('pd_review2_stars', 5)),
                    },
                    {
                        name:  getSetting('pd_review3_name',  'מיכל ל.'),
                        role:  getSetting('pd_review3_role',  'מנהלת בית ספר'),
                        text:  getSetting('pd_review3_text',  'השקענו בכמה מוצרים — כולם ממליצים.'),
                        stars: Number(getSetting('pd_review3_stars', 4)),
                    },
                ];
                return (
                    <div id="pd-reviews" style={{ background: c.surface, marginBottom: 10, padding: '0 18px' }}>
                        <Accordion title="חוות דעת" c={c}>
                            {/* Average rating header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 40, fontWeight: 900, color: c.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{avg}</span>
                                <div>
                                    <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                                        {[1,2,3,4,5].map(s => (
                                            <span key={s} style={{ color: s <= Math.round(Number(avg)) ? '#FF9500' : '#E5E5EA', fontSize: 16 }}>★</span>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: 12, color: c.text3 }}>{count} חוות דעת</span>
                                </div>
                            </div>
                            {/* Review cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {reviews.map((r, idx) => (
                                    <div key={idx} style={{ background: c.surface2, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 99, flexShrink: 0,
                                            background: 'rgba(0,122,255,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 800, color: '#007AFF',
                                        }}>
                                            {r.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{r.name}</span>
                                                <div style={{ display: 'flex', gap: 1 }}>
                                                    {[1,2,3,4,5].map(s => (
                                                        <span key={s} style={{ color: s <= r.stars ? '#FF9500' : '#E5E5EA', fontSize: 14 }}>★</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 11, color: c.text3, marginBottom: 6 }}>{r.role}</p>
                                            <p style={{ fontSize: 13, color: c.text2, lineHeight: 1.5 }}>{r.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Accordion>
                    </div>
                );
            })()}

            {/* ── Related Products ─────────────────────────────────────── */}
            {related.length > 0 && (
                <section id="section-related" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#007AFF', letterSpacing: '-0.03em' }}>מוצרים דומים</h2>
                        <button onClick={() => navigate(`/catalog?category=${encodeURIComponent(product.category)}`)}
                            style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            ראה הכל
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, padding: '4px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                        {related.map(p => (
                            <MobileProductCard key={p.id} product={p} size="sm" />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Nav FAB (compass circle, above AI concierge) ──────────── */}
            <ProductNavFAB />

            {/* ── Sticky Buy Bar ────────────────────────────────────────── */}
            <div style={{
                position: 'fixed',
                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                left: 0, right: 0, zIndex: 150,
                background: c.surface,
                borderTop: `0.5px solid ${c.border}`,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: c.text3, fontWeight: 500, marginBottom: 1 }}>מחיר</div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: product.salePrice ? '#FF3B30' : c.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                        ₪{displayPrice?.toLocaleString()}
                    </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:4, background: c.input, borderRadius:10, padding:'4px 6px' }}>
                  <motion.button whileTap={{scale:0.8}} onClick={() => setQty(q => Math.max(1,q-1))}
                    style={{width:28,height:28,borderRadius:8,background:'none',border:'none',color:c.text,fontSize:18,fontWeight:300,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    −
                  </motion.button>
                  <span style={{minWidth:22,textAlign:'center',fontSize:15,fontWeight:700,color:c.text}}>{qty}</span>
                  <motion.button whileTap={{scale:0.8}} onClick={() => setQty(q => Math.min(99,q+1))}
                    style={{width:28,height:28,borderRadius:8,background:'none',border:'none',color:'#007AFF',fontSize:18,fontWeight:300,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    +
                  </motion.button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={handleCompare}
                    aria-label={inCompare ? `הסר ${product.title} מהשוואה` : `הוסף ${product.title} להשוואה`}
                    style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: inCompare ? 'rgba(88,86,214,0.10)' : c.subtleBg,
                        border: inCompare ? '1.5px solid rgba(88,86,214,0.25)' : '1.5px solid transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'all 0.18s',
                    }}
                >
                    <Scale size={18} color={inCompare ? '#5856D6' : c.text3} strokeWidth={1.8} />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAdd}
                    style={{
                        flex: 1, height: 48, borderRadius: 14,
                        background: added
                            ? 'linear-gradient(135deg, #34C759, #28A745)'
                            : 'linear-gradient(135deg, #007AFF, #0063CC)',
                        color: '#fff', border: 'none',
                        fontSize: 16, fontWeight: 700,
                        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        letterSpacing: '-0.02em',
                        boxShadow: added ? '0 4px 20px rgba(52,199,89,0.35)' : '0 4px 18px rgba(0,122,255,0.30)',
                        transition: 'background 0.22s, box-shadow 0.22s',
                    }}
                >
                    <AnimatePresence mode="wait">
                        {added ? (
                            <motion.span key="done" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={17} strokeWidth={3} /> נוסף לעגלה!
                            </motion.span>
                        ) : (
                            <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ShoppingBag size={17} strokeWidth={2} /> הוסף לעגלה
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
}
