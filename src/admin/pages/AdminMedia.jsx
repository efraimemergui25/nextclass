/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query
} from 'firebase/firestore';
import { imageToDataUrl } from '../utils/fileStore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminKPICard, AdminEmpty, AdminTabs } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import {
    Upload, Link2, Trash2, Copy, Check, Image, Film,
    FolderOpen, X, Search, Grid, List, ExternalLink, Plus,
    ChevronLeft, Download, HardDrive, Calendar, Package
} from 'lucide-react';
import { GLASS as GLASS_TOKENS, RADIUS, SHADOW, GRADIENT, TAP, hexA, glow, toneColor, toneBg } from '../theme/tokens';

// ─── Babushka drill helpers ────────────────────────────────────────────────────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => (
                <motion.div key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="rounded-[14px] p-3 text-center"
                    style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                    <p className="font-black text-[15px] tracking-tight leading-none" style={{ color: s.color || '#1D1D1F' }}>{s.value}</p>
                    <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                </motion.div>
            ))}
        </div>
    );
}
function DrillRow({ onClick, leading, title, subtitle, trailing, tone = '#007AFF', delay = 0 }) {
    const clickable = !!onClick;
    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
            onClick={onClick}
            tabIndex={clickable ? 0 : undefined}
            role={clickable ? 'button' : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            whileHover={clickable ? { backgroundColor: hexA(tone, 0.06), x: -3 } : undefined}
            className={`flex items-center gap-3 p-3 rounded-[14px] transition-colors focus:outline-none ${clickable ? 'cursor-pointer focus:ring-2' : ''}`}
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}
        >
            {leading}
            <div className="flex-1 min-w-0 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{title}</p>
                {subtitle && <p className="text-[10px] text-[#AEAEB2] truncate mt-0.5">{subtitle}</p>}
            </div>
            {trailing}
            {clickable && <ChevronLeft size={14} className="text-[#C7C7CC] shrink-0" strokeWidth={2.5} />}
        </motion.div>
    );
}
const DrillEmpty = ({ icon: Icon, text }) => (
    <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
        {Icon && (
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#F0F3F8] to-[#E6EBF3] shadow-[0_4px_16px_rgba(20,40,80,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Icon size={24} className="text-[#B4BCC9]" strokeWidth={2} />
            </div>
        )}
        <p className="text-[#9AA3B2] text-[13px] font-semibold">{text}</p>
    </div>
);

// ─── Unified brand accent (restrained azure — no per-domain rainbow) ───────────
const BRAND      = '#007AFF';
const BRAND_GRAD = GRADIENT.signature;
const BRAND_SOFT = 'linear-gradient(135deg, rgba(0,122,255,0.16) 0%, rgba(0,122,255,0.08) 100%)';

// ─── Liquid-glass surfaces (token-driven — one system everywhere) ──────────────
const CARD  = { ...GLASS_TOKENS.base };
const GLASS = { ...GLASS_TOKENS.base };

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCard({ item, onDelete, onCopy, copied, onOpen }) {
    const isVideo = item.type?.startsWith('video') || item.url?.match(/\.(mp4|webm|mov)$/i);
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onOpen?.(item, 'library')}
            className="relative rounded-2xl overflow-hidden group cursor-pointer"
            style={CARD}
        >
            {/* Preview */}
            <div className="aspect-video bg-[#F5F5F7] relative overflow-hidden">
                {isVideo ? (
                    <video src={item.url} className="w-full h-full object-cover" muted />
                ) : (
                    <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={e => { e.target.src = ''; e.target.style.display = 'none'; }}
                    />
                )}
                {/* Overlay */}
                <AnimatePresence>
                    {hovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.88 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                onClick={(e) => { e.stopPropagation(); onCopy(item.url); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black"
                                style={{
                                    background: copied === item.url ? `linear-gradient(135deg, ${toneColor('success')}, ${toneColor('success')}db)` : 'rgba(255,255,255,0.22)',
                                    backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    boxShadow: '0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.5)',
                                }}
                            >
                                {copied === item.url ? <Check size={12} /> : <Copy size={12} />}
                                {copied === item.url ? 'הועתק' : 'העתק URL'}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.88 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                                className="p-2 rounded-xl text-white"
                                style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                                    border: '1px solid rgba(255,255,255,0.34)',
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.42)',
                                }}
                            >
                                <ExternalLink size={12} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.08, backgroundColor: hexA(toneColor('danger'), 0.9) }}
                                whileTap={{ scale: 0.88 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                className="p-2 rounded-xl text-white"
                                style={{
                                    background: 'rgba(255,255,255,0.18)',
                                    backdropFilter: 'blur(12px) saturate(1.4)', WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
                                    border: '1px solid rgba(255,255,255,0.34)',
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.42)',
                                }}
                            >
                                <Trash2 size={12} />
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Type badge */}
                <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-black/50 text-white backdrop-blur-sm">
                        {isVideo ? <Film size={9} className="mr-1" /> : <Image size={9} className="mr-1" />}
                        {item.source === 'url' ? 'URL' : 'Upload'}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="px-3 py-2.5 text-right">
                <p className="text-[12px] font-bold text-[#1D1D1F] truncate" title={item.name}>{item.name || 'ללא שם'}</p>
                <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] text-[#AEAEB2] font-mono">{formatSize(item.size)}</span>
                    <span className="text-[9px] text-[#AEAEB2]">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('he-IL') : ''}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// Drop zone component
function DropZone({ onFiles, uploading }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const inputRef = useRef();

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (files.length) onFiles(files);
    }, [onFiles]);

    return (
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 flex flex-col items-center gap-4"
            style={{
                borderColor: isDragActive ? BRAND : hexA(BRAND, 0.35),
                background: isDragActive ? hexA(BRAND, 0.06) : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: isDragActive ? `0 0 0 4px ${hexA(BRAND, 0.12)}` : 'none',
            }}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full animate-spin" style={{ border: `2px solid ${hexA(BRAND, 0.3)}`, borderTopColor: BRAND }} />
                    <p className="text-sm font-bold" style={{ color: BRAND }}>מעלה...</p>
                </div>
            ) : (
                <>
                    <motion.div
                        animate={{ y: isDragActive ? -6 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(140deg, ${hexA(BRAND, 0.22)}, ${hexA(BRAND, 0.08)})`,
                            border: `1px solid ${hexA(BRAND, 0.2)}`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 16px ${hexA(BRAND, 0.18)}`,
                        }}
                    >
                        <Upload size={24} color={BRAND} />
                    </motion.div>
                    <div className="text-center">
                        <p className="text-[15px] font-black text-[#1D1D1F]">
                            {isDragActive ? 'שחרר כאן לעלות' : 'גרור קבצים לכאן'}
                        </p>
                        <p className="text-[12px] text-[#86868B] mt-1">או לחץ לבחירת קבצים</p>
                        <p className="text-[10px] text-[#AEAEB2] mt-2">PNG, JPG, WEBP, MP4, WEBM — עד 10MB</p>
                    </div>
                </>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={e => onFiles(Array.from(e.target.files))}
                className="hidden"
            />
        </div>
    );
}

// URL Add Dialog
function AddUrlDialog({ onAdd, onClose }) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [preview, setPreview] = useState('');

    const handleUrlChange = (v) => {
        setUrl(v);
        setPreview(v);
        if (!name && v) {
            const parts = v.split('/');
            setName(parts[parts.length - 1]?.split('?')[0] || 'תמונה');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 16 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md mx-4 rounded-[24px] overflow-hidden"
                style={GLASS}
            >
                <div className="p-6" dir="rtl">
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/06 text-[#AEAEB2] transition-colors">
                            <X size={14} />
                        </button>
                        <h3 className="font-black text-[#1D1D1F]">הוסף קישור לתמונה</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">URL תמונה</label>
                            <input
                                type="text"
                                value={url}
                                onChange={e => handleUrlChange(e.target.value)}
                                placeholder="https://..."
                                dir="ltr"
                                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">שם (אופציונלי)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="שם התמונה"
                                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:bg-white transition-all"
                            />
                        </div>
                        {preview && (
                            <div className="h-32 rounded-xl overflow-hidden bg-[#F5F5F7]">
                                <img src={preview} alt="preview" className="w-full h-full object-cover"
                                    onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                        )}
                        <button
                            onClick={() => { if (url) { onAdd({ url, name: name || url, source: 'url' }); onClose(); } }}
                            disabled={!url}
                            className="w-full py-3 rounded-xl font-black text-[13px] text-white transition-all disabled:opacity-40"
                            style={{ background: BRAND_GRAD, boxShadow: `0 4px 16px ${hexA(BRAND, 0.28)}` }}
                        >
                            הוסף לספרייה
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── ProductImages tab ─────────────────────────────────────────────────────────
function ProductImagesTab({ onCopy, copied, onOpen }) {
    const { inventory } = useAdminData();
    const [search, setSearch] = useState('');
    const items = inventory.filter(p => p.image).filter(p =>
        !search || (p.title || p.name || '').toLowerCase().includes(search.toLowerCase())
    );
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש מוצר..."
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#007AFF]/25 transition-all"
                    style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
            </div>
            <p className="text-[11px] text-[#AEAEB2] font-bold">{items.length} מוצרים עם תמונות</p>
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {items.map(p => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onOpen?.({ url: p.image, name: p.title || p.name, type: 'image', source: 'product', id: p.id }, 'product')}
                        className="relative rounded-2xl overflow-hidden group cursor-pointer" style={CARD}>
                        <div className="aspect-video bg-[#F5F5F7] relative overflow-hidden">
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={e => { e.target.style.display = 'none'; }} />
                            <AnimatePresence>
                                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <button onClick={(e) => { e.stopPropagation(); onCopy(p.image); }}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black"
                                        style={{ background: copied === p.image ? toneColor('success') : 'rgba(255,255,255,0.2)' }}>
                                        {copied === p.image ? <Check size={12} /> : <Copy size={12} />}
                                        {copied === p.image ? 'הועתק' : 'העתק URL'}
                                    </button>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="px-3 py-2.5 text-right">
                            <p className="text-[12px] font-bold text-[#1D1D1F] truncate">{p.title || p.name}</p>
                            <p className="text-[10px] text-[#AEAEB2]">מ.ק. {p.id}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

// ── VodTab ────────────────────────────────────────────────────────────────────
function VodTab({ onCopy, copied, onOpen }) {
    const { showToast } = useAdminToast();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'vod_courses'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setError(false);
            setLoading(false);
        }, (err) => {
            console.error('VOD load failed:', err);
            setError(true);
            setLoading(false);
            showToast('שגיאה בטעינת סרטוני VOD', 'error');
        });
    }, []);

    const items = videos.filter(v =>
        !search || (v.title || v.name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#AEAEB2] font-bold text-sm">טוען VOD...</p>
        </div>
    );

    if (error && !loading) return (
        <div className="rounded-[24px] overflow-hidden" style={CARD}>
            <AdminEmpty
                icon="empty"
                title="שגיאה בטעינת VOD"
                subtitle="לא ניתן לטעון את סרטוני ה-VOD כרגע. רענן את הדף ונסה שוב."
            />
        </div>
    );

    if (items.length === 0 && !loading) return (
        <div className="rounded-[24px] overflow-hidden" style={CARD}>
            <AdminEmpty
                icon="empty"
                title={search ? 'לא נמצאו סרטונים' : 'אין סרטוני VOD עדיין'}
                subtitle={search ? 'נסה חיפוש אחר' : 'הוסף קורסים דרך עמוד ניהול ה-VOD'}
            />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש קורס..."
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1D1D1F] outline-none focus:ring-2 focus:ring-[#007AFF]/25 transition-all"
                    style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
            </div>
            <p className="text-[11px] text-[#AEAEB2] font-bold">{items.length} קורסי VOD</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(v => (
                    <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onOpen?.({ url: v.videoUrl || v.thumbnail, name: v.title || v.name, type: 'video', source: 'vod', id: v.id, thumbnail: v.thumbnail, lessonsCount: v.lessonsCount || v.lessons?.length || 0 }, 'vod')}
                        className="rounded-2xl overflow-hidden cursor-pointer" style={CARD}>
                        {v.thumbnail && (
                            <div className="aspect-video bg-[#F5F5F7] relative overflow-hidden">
                                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Film className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="px-4 py-3 text-right">
                            <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{v.title || v.name}</p>
                            <p className="text-[11px] text-[#86868B] mt-0.5">{v.lessonsCount || v.lessons?.length || 0} שיעורים</p>
                            {v.videoUrl && (
                                <button onClick={(e) => { e.stopPropagation(); onCopy(v.videoUrl); }}
                                    className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#007AFF] hover:underline">
                                    {copied === v.videoUrl ? <Check size={10} /> : <Copy size={10} />}
                                    העתק URL
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default function AdminMedia() {
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const navigate = useNavigate();

    // ── Babushka drill stack ──────────────────────────────────────────────────
    const [drillStack, setDrillStack] = useState([]);
    const lastDrillRef = useRef(null);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);
    const drillTo    = (path) => { closeDrill(); navigate(path); };
    const openMedia  = (item, kind = 'library') => openDrill({ type: 'media', item, kind });

    const [tab, setTab] = useState('images'); // images | videos | links | products | vod
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [copied, setCopied] = useState('');
    const [showUrlDialog, setShowUrlDialog] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [loadError, setLoadError] = useState(false);

    // Load media from Firestore
    useEffect(() => {
        const q = query(collection(db, 'media_library'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoadError(false);
            setLoading(false);
        }, (err) => {
            console.error('Media library load failed:', err);
            setLoadError(true);
            setLoading(false);
            showToast('שגיאה בטעינת ספריית המדיה', 'error');
        });
        return unsub;
    }, []);

    const handleFiles = async (files) => {
        setUploading(true);
        const progress = {};
        files.forEach(f => { progress[f.name] = 0; });
        setUploadProgress(progress);

        let ok = 0;
        await Promise.all(files.map(async (file) => {
            try {
                if (!file.type?.startsWith('image/')) throw new Error('not an image');
                const url = await imageToDataUrl(file); // compressed to < ~900KB, stored inline
                setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                await addDoc(collection(db, 'media_library'), {
                    url,
                    name: file.name,
                    type: 'image/jpeg',
                    size: url.length,
                    source: 'upload',
                    createdAt: serverTimestamp(),
                });
                ok++;
            } catch {
                setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
            }
        }));
        setUploading(false);
        if (ok) showToast(`${ok} קבצים הועלו בהצלחה`, 'success');
        if (ok < files.length) showToast(`${files.length - ok} קבצים נכשלו (רק תמונות נתמכות)`, 'error');
        setTimeout(() => setUploadProgress({}), 1400);
    };

    const handleAddUrl = async ({ url, name, source }) => {
        try {
            await addDoc(collection(db, 'media_library'), {
                url, name, source, type: 'image/external',
                createdAt: serverTimestamp(),
            });
            showToast('קישור נוסף לספרייה', 'success');
        } catch {
            showToast('שגיאה בהוספת קישור', 'error');
        }
    };

    const handleDelete = async (item) => {
        if (!await confirm({ message: 'למחוק פריט זה מהספרייה?', danger: true })) return;
        try {
            await deleteDoc(doc(db, 'media_library', item.id));
            showToast('פריט נמחק', 'success');
        } catch {
            showToast('שגיאה במחיקה', 'error');
        }
    };

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(url);
            showToast('URL הועתק ללוח', 'success');
            setTimeout(() => setCopied(''), 2000);
        });
    };

    // Active library sector → filter of the shared media_library
    const libFilter = tab === 'videos' ? 'videos' : tab === 'links' ? 'urls' : 'images';
    const filtered = media.filter(item => {
        if (search && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
        if (libFilter === 'videos') return item.type?.startsWith('video');
        if (libFilter === 'urls') return item.source === 'url';
        // images: uploaded image files (not video, not an external link)
        return !item.type?.startsWith('video') && item.source !== 'url';
    });

    const stats = {
        total: media.length,
        images: media.filter(m => !m.type?.startsWith('video') && m.source !== 'url').length,
        videos: media.filter(m => m.type?.startsWith('video')).length,
        urls: media.filter(m => m.source === 'url').length,
    };

    return (
        <div dir="rtl" className="space-y-6">
            {/* Page header — accent-tinted, one system with Suppliers/Orders */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 46, height: 46, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: hexA(BRAND, 0.10), border: `1px solid ${hexA(BRAND, 0.18)}`, boxShadow: SHADOW.specular }}>
                    <FolderOpen size={22} color={BRAND} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1, margin: 0, background: 'linear-gradient(135deg,#1D1D1F 0%,#3C3C43 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ספריית מדיה</h1>
                    <p style={{ fontSize: 13.5, color: '#86868B', margin: '5px 0 0', fontWeight: 600 }}>תמונות, סרטונים ומדיה מוצרים — הכל במקום אחד</p>
                </div>
                {tab === 'links' && (
                    <motion.button
                        onClick={() => setShowUrlDialog(true)}
                        whileHover={{ y: -2, boxShadow: `0 8px 24px ${hexA(BRAND, 0.3)}` }} whileTap={TAP}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
                        style={{ background: hexA(BRAND, 0.1), color: '#005EC4', border: `1px solid ${hexA(BRAND, 0.28)}` }}
                    >
                        <Link2 size={13} />
                        הוסף קישור
                    </motion.button>
                )}
            </div>

            {/* In-page sectors — filtered views of the same library, plus product/VOD browsers */}
            <AdminTabs
                tabs={[
                    { id: 'images',   label: 'תמונות' },
                    { id: 'videos',   label: 'וידאו' },
                    { id: 'links',    label: 'קישורים חיצוניים' },
                    { id: 'products', label: 'תמונות מוצרים' },
                    { id: 'vod',      label: 'סרטוני VOD' },
                ]}
                active={tab} onChange={setTab} id="media-tabs"
            />

            {/* VOD and Product tabs render their own content */}
            {tab === 'products' && <ProductImagesTab onCopy={handleCopy} copied={copied} onOpen={openMedia} />}
            {tab === 'vod' && <VodTab onCopy={handleCopy} copied={copied} onOpen={openMedia} />}

            {(tab === 'images' || tab === 'videos' || tab === 'links') && (<>

            {/* KPI band — total · images · videos · external links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                <AdminKPICard title="סך פריטים" value={stats.total} subtitle="בספרייה" accent={BRAND} delay={0}
                    icon={<FolderOpen size={20} color={BRAND} />} loading={loading} onClick={() => openDrill({ type: 'kpi-total' })} />
                <AdminKPICard title="תמונות" value={stats.images} subtitle="קבצי תמונה" accent={BRAND} delay={0.05}
                    icon={<Image size={20} color={BRAND} />} loading={loading} onClick={() => openDrill({ type: 'kpi-images' })} />
                <AdminKPICard title="סרטונים" value={stats.videos} subtitle="קבצי וידאו" accent={BRAND} delay={0.1}
                    icon={<Film size={20} color={BRAND} />} loading={loading} onClick={() => openDrill({ type: 'kpi-videos' })} />
                <AdminKPICard title="קישורים" value={stats.urls} subtitle="קישורים חיצוניים" accent={BRAND} delay={0.15}
                    icon={<Link2 size={20} color={BRAND} />} loading={loading} onClick={() => openDrill({ type: 'kpi-urls' })} />
            </div>

            {/* Upload progress */}
            <AnimatePresence>
                {Object.entries(uploadProgress).map(([name, pct]) => (
                    <motion.div key={name}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-2xl" style={CARD}>
                        <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-[#007AFF] font-bold">{pct}%</span>
                            <span className="text-[#86868B] truncate max-w-[200px]">{name}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
                            <motion.div animate={{ width: `${pct}%` }} className="h-full rounded-full"
                                style={{ background: BRAND_GRAD, boxShadow: `0 0 8px ${hexA(BRAND, 0.4)}` }} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Drop zone */}
            <DropZone onFiles={handleFiles} uploading={uploading} />

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                    <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="חיפוש לפי שם..."
                        className="w-full pr-9 pl-4 py-2.5 bg-white rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                        style={CARD}
                    />
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(118,118,128,0.1)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: 'inset 0 1px 2px rgba(20,40,80,0.06)' }}>
                    {[
                        { id: 'grid', Icon: Grid },
                        { id: 'list', Icon: List },
                    ].map(v => (
                        <motion.button key={v.id} onClick={() => setViewMode(v.id)}
                            whileTap={TAP}
                            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{
                                background: viewMode === v.id ? 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.75))' : 'transparent',
                                backdropFilter: viewMode === v.id ? 'blur(12px) saturate(1.6)' : 'none',
                                WebkitBackdropFilter: viewMode === v.id ? 'blur(12px) saturate(1.6)' : 'none',
                                boxShadow: viewMode === v.id ? '0 4px 12px rgba(20,40,80,0.12), inset 0 1px 0 rgba(255,255,255,1)' : 'none',
                            }}>
                            <v.Icon size={14} className={viewMode === v.id ? 'text-[#007AFF]' : 'text-[#AEAEB2]'} />
                        </motion.button>
                    ))}
                </div>

                <p className="text-[11px] text-[#AEAEB2] font-bold">{filtered.length} פריטים</p>
            </div>

            {/* Grid / List */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
                        style={{ border: `2px solid ${hexA(BRAND, 0.3)}`, borderTopColor: BRAND }} />
                    <p className="text-[#AEAEB2] font-bold text-sm">טוען ספרייה...</p>
                </div>
            ) : loadError ? (
                <div className="rounded-[24px] overflow-hidden" style={CARD}>
                    <AdminEmpty
                        icon="empty"
                        title="שגיאה בטעינת הספרייה"
                        subtitle="לא ניתן לטעון את ספריית המדיה כרגע. רענן את הדף ונסה שוב."
                    />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-[24px] overflow-hidden" style={CARD}>
                    <AdminEmpty
                        icon="empty"
                        title={search ? 'לא נמצאו פריטים' : 'הספרייה ריקה'}
                        subtitle={search ? 'נסה חיפוש אחר' : 'גרור קבצים לאזור למעלה או הוסף קישור חיצוני'}
                    />
                </div>
            ) : viewMode === 'grid' ? (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {filtered.map(item => (
                            <MediaCard key={item.id} item={item} onDelete={handleDelete} onCopy={handleCopy} copied={copied} onOpen={openMedia} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="rounded-[22px] overflow-hidden" style={CARD}>
                    <div className="divide-y divide-black/[0.04]">
                        {filtered.map(item => (
                            <motion.div key={item.id} layout
                                onClick={() => openMedia(item, 'library')}
                                className="flex items-center gap-4 px-5 py-3 hover:bg-black/[0.02] transition-colors group cursor-pointer"
                                dir="rtl">
                                <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0">
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover"
                                        onError={e => { e.target.style.display = 'none'; }} />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[13px] font-bold text-[#1D1D1F] truncate group-hover:text-[#007AFF] transition-colors">{item.name}</p>
                                    <p className="text-[10px] text-[#AEAEB2]">{formatSize(item.size)} · {item.source === 'url' ? 'קישור חיצוני' : 'קובץ'}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(item.url); }}
                                        className="p-1.5 rounded-lg hover:bg-[#007AFF]/10 text-[#007AFF] transition-colors">
                                        {copied === item.url ? <Check size={13} /> : <Copy size={13} />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                        className="p-1.5 rounded-lg hover:bg-[#FF3B30]/10 text-[#FF3B30] transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* URL Dialog */}
            <AnimatePresence>
                {showUrlDialog && <AddUrlDialog onAdd={handleAddUrl} onClose={() => setShowUrlDialog(false)} />}
            </AnimatePresence>
            </>)}

            {/* ── Babushka Drill Drawer — nested glass detail ─────────────────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                if (current) lastDrillRef.current = current;
                const shown = current || lastDrillRef.current;
                const isOpen = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!shown) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const isVid = (m) => m.type?.startsWith('video') || m.url?.match(/\.(mp4|webm|mov)$/i);
                const mediaRow = (m, i) => (
                    <DrillRow key={m.id} delay={i * 0.03}
                        onClick={() => pushDrill({ type: 'media', item: m, kind: 'library' })}
                        leading={<div className="w-11 h-8 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0 flex items-center justify-center">
                            {m.url && !isVid(m)
                                ? <img src={m.url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                                : <Film size={13} className="text-[#AEAEB2]" />}</div>}
                        title={m.name || 'ללא שם'}
                        subtitle={`${formatSize(m.size) || (m.source === 'url' ? 'קישור חיצוני' : '—')}`}
                        trailing={<span className="text-[10px] font-black text-[#AEAEB2] shrink-0">{isVid(m) ? 'וידאו' : m.source === 'url' ? 'קישור' : 'תמונה'}</span>}
                    />
                );
                const mediaList = (arr) => arr.length === 0
                    ? <DrillEmpty icon={FolderOpen} text="אין פריטים להצגה" />
                    : <div className="space-y-2">{arr.map(mediaRow)}</div>;

                let title = '', subtitle = '', icon = null, footer = null, body = null;

                if (shown.type === 'kpi-total') {
                    title = 'סך פריטים'; subtitle = `${stats.total} פריטים בספרייה`;
                    icon = <FolderOpen size={17} color={BRAND} />;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סך הכל', value: stats.total, color: BRAND },
                                { label: 'תמונות', value: stats.images },
                                { label: 'סרטונים', value: stats.videos },
                                { label: 'קישורים', value: stats.urls },
                            ]} />
                            {mediaList(media)}
                        </div>
                    );
                } else if (shown.type === 'kpi-images') {
                    const arr = media.filter(m => !m.type?.startsWith('video') && m.source !== 'url');
                    title = 'תמונות'; subtitle = `${arr.length} קבצי תמונה`;
                    icon = <Image size={17} color={BRAND} />;
                    body = mediaList(arr);
                } else if (shown.type === 'kpi-videos') {
                    const arr = media.filter(m => m.type?.startsWith('video'));
                    title = 'סרטונים'; subtitle = `${arr.length} קבצי וידאו`;
                    icon = <Film size={17} color={BRAND} />;
                    body = mediaList(arr);
                } else if (shown.type === 'kpi-urls') {
                    const arr = media.filter(m => m.source === 'url');
                    title = 'קישורים חיצוניים'; subtitle = `${arr.length} קישורים`;
                    icon = <Link2 size={17} color={BRAND} />;
                    body = mediaList(arr);
                } else if (shown.type === 'media') {
                    const m = shown.item;
                    const vid = isVid(m);
                    const kindLabel = shown.kind === 'product' ? 'תמונת מוצר' : shown.kind === 'vod' ? 'סרטון VOD' : m.source === 'url' ? 'קישור חיצוני' : vid ? 'וידאו' : 'תמונה';
                    title = m.name || 'ללא שם'; subtitle = kindLabel;
                    icon = vid ? <Film size={17} color={BRAND} /> : <Image size={17} color={BRAND} />;
                    if (shown.kind === 'product') footer = { label: 'מעבר לניהול מוצרים', onClick: () => drillTo('/admin/products') };
                    else if (shown.kind === 'vod') footer = { label: 'מעבר למרכז ה-VOD', onClick: () => drillTo('/vod') };
                    body = (
                        <div className="space-y-5">
                            {/* Preview */}
                            <div className="rounded-[16px] overflow-hidden bg-[#F5F5F7] aspect-video flex items-center justify-center">
                                {m.url && vid
                                    ? <video src={m.url} className="w-full h-full object-contain" controls />
                                    : m.url
                                        ? <img src={m.thumbnail || m.url} alt={m.name} className="w-full h-full object-contain" onError={e => { e.target.style.display = 'none'; }} />
                                        : <FolderOpen size={30} className="text-[#AEAEB2] opacity-40" />}
                            </div>
                            <DrillStat items={[
                                ...(m.size ? [{ label: 'גודל', value: formatSize(m.size) }] : []),
                                ...(shown.kind === 'vod' ? [{ label: 'שיעורים', value: m.lessonsCount ?? 0 }] : []),
                                { label: 'סוג', value: kindLabel },
                                { label: 'נוסף', value: m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('he-IL') : '—' },
                            ]} />
                            {/* URL */}
                            <div className="p-3 rounded-[14px] text-right" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest mb-1">כתובת</p>
                                <p className="text-[11px] font-mono text-[#3C3C43] break-all" dir="ltr">{m.url || '—'}</p>
                            </div>
                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleCopy(m.url)}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer"
                                    style={{ background: hexA(BRAND, 0.1), color: '#005EC4', border: `1px solid ${hexA(BRAND, 0.24)}` }}>
                                    {copied === m.url ? <Check size={14} /> : <Copy size={14} />} {copied === m.url ? 'הועתק' : 'העתק URL'}
                                </button>
                                <button onClick={() => { const a = document.createElement('a'); a.href = m.url; a.download = m.name || 'media'; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer"
                                    style={{ background: hexA(BRAND, 0.1), color: '#005EC4', border: `1px solid ${hexA(BRAND, 0.24)}` }}>
                                    <Download size={14} /> הורדה
                                </button>
                            </div>
                            {shown.kind === 'library' && (
                                <button onClick={() => { handleDelete(m); closeDrill(); }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-[13px] font-black cursor-pointer"
                                    style={{ background: toneBg('danger'), color: toneColor('danger'), border: `1px solid ${hexA(toneColor('danger'), 0.22)}` }}>
                                    <Trash2 size={14} /> מחק מהספרייה
                                </button>
                            )}
                        </div>
                    );
                }

                return (
                    <DashDrillView
                        open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={BRAND}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${shown.type}:${shown.item?.id ?? ''}:${drillStack.length}`}
                    >{body}</DashDrillView>
                );
            })()}
        </div>
    );
}
