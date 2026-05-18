/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../firebase';
import {
    collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import {
    Upload, Link2, Trash2, Copy, Check, Image, Film,
    FolderOpen, X, Search, Grid, List, ExternalLink, Plus
} from 'lucide-react';

const CARD = {
    background: 'rgba(255,255,255,0.88)',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
};

const GLASS = {
    background: 'rgba(255,255,255,0.75)',
    border: '1px solid rgba(255,255,255,0.72)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
};

function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaCard({ item, onDelete, onCopy, copied }) {
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
                                whileTap={{ scale: 0.88 }}
                                onClick={() => onCopy(item.url)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black transition-all"
                            >
                                {copied === item.url ? <Check size={12} /> : <Copy size={12} />}
                                {copied === item.url ? 'הועתק' : 'העתק URL'}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => window.open(item.url, '_blank')}
                                className="p-2 rounded-xl text-white"
                            >
                                <ExternalLink size={12} />
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.88 }}
                                onClick={() => onDelete(item)}
                                className="p-2 rounded-xl text-white"
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
                borderColor: isDragActive ? '#007AFF' : '#D1D1D6',
                background: isDragActive ? 'rgba(0,122,255,0.04)' : 'rgba(0,0,0,0.012)',
            }}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
                    <p className="text-sm font-bold text-[#007AFF]">מעלה...</p>
                </div>
            ) : (
                <>
                    <motion.div
                        animate={{ y: isDragActive ? -6 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'rgba(0,122,255,0.1)' }}
                    >
                        <Upload size={24} className="text-[#007AFF]" />
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
                            style={{ background: '#007AFF' }}
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
function ProductImagesTab({ onCopy, copied }) {
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
                    className="w-full pr-9 pl-4 py-2.5 bg-white rounded-xl text-[13px] font-medium text-[#1D1D1F] outline-none"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }} />
            </div>
            <p className="text-[11px] text-[#AEAEB2] font-bold">{items.length} מוצרים עם תמונות</p>
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {items.map(p => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden group cursor-pointer" style={CARD}>
                        <div className="aspect-video bg-[#F5F5F7] relative overflow-hidden">
                            <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={e => { e.target.style.display = 'none'; }} />
                            <AnimatePresence>
                                <motion.div initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <button onClick={() => onCopy(p.image)}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black"
                                        style={{ background: copied === p.image ? '#34C759' : 'rgba(255,255,255,0.2)' }}>
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
function VodTab({ onCopy, copied }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'vod_courses'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
    }, []);

    const items = videos.filter(v =>
        !search || (v.title || v.name || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#FF3B30]/30 border-t-[#FF3B30] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#AEAEB2] font-bold text-sm">טוען VOD...</p>
        </div>
    );

    if (items.length === 0 && !loading) return (
        <div className="py-20 text-center rounded-[24px]" style={CARD}>
            <Film size={40} className="mx-auto text-[#D1D1D6] mb-3" />
            <p className="text-[#AEAEB2] font-bold">{search ? 'לא נמצאו סרטונים' : 'אין סרטוני VOD עדיין'}</p>
            <p className="text-[#C7C7CC] text-sm mt-1">הוסף קורסים דרך עמוד ניהול ה-VOD</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש קורס..."
                    className="w-full pr-9 pl-4 py-2.5 bg-white rounded-xl text-[13px] font-medium text-[#1D1D1F] outline-none"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }} />
            </div>
            <p className="text-[11px] text-[#AEAEB2] font-bold">{items.length} קורסי VOD</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(v => (
                    <motion.div key={v.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl overflow-hidden" style={CARD}>
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
                                <button onClick={() => onCopy(v.videoUrl)}
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
    const [tab, setTab] = useState('library');
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all | images | videos | urls
    const [viewMode, setViewMode] = useState('grid');
    const [copied, setCopied] = useState('');
    const [showUrlDialog, setShowUrlDialog] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    // Load media from Firestore
    useEffect(() => {
        const q = query(collection(db, 'media_library'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return unsub;
    }, []);

    const handleFiles = async (files) => {
        setUploading(true);
        const progress = {};
        files.forEach(f => { progress[f.name] = 0; });
        setUploadProgress(progress);

        try {
            await Promise.all(files.map(async (file) => {
                const path = `media/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                const sRef = storageRef(storage, path);
                const task = uploadBytesResumable(sRef, file);

                await new Promise((resolve, reject) => {
                    task.on('state_changed',
                        snap => {
                            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                            setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
                        },
                        reject,
                        async () => {
                            const url = await getDownloadURL(task.snapshot.ref);
                            await addDoc(collection(db, 'media_library'), {
                                url,
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                path,
                                source: 'upload',
                                createdAt: serverTimestamp(),
                            });
                            resolve();
                        }
                    );
                });
            }));
            showToast(`${files.length} קבצים הועלו בהצלחה`, 'success');
        } catch (err) {
            showToast('שגיאה בהעלאת קבצים', 'error');
        }
        setUploading(false);
        setUploadProgress({});
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
        if (!window.confirm('למחוק פריט זה מהספרייה?')) return;
        try {
            await deleteDoc(doc(db, 'media_library', item.id));
            if (item.path) {
                try { await deleteObject(storageRef(storage, item.path)); } catch {}
            }
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

    const filtered = media.filter(item => {
        if (search && !item.name?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filter === 'images') return !item.type?.startsWith('video');
        if (filter === 'videos') return item.type?.startsWith('video');
        if (filter === 'urls') return item.source === 'url';
        return true;
    });

    const stats = {
        total: media.length,
        images: media.filter(m => !m.type?.startsWith('video') && m.source !== 'url').length,
        videos: media.filter(m => m.type?.startsWith('video')).length,
        urls: media.filter(m => m.source === 'url').length,
    };

    return (
        <div dir="rtl" className="space-y-6">
            <AdminSectionHeader
                title="ספריית מדיה"
                subtitle="תמונות, סרטונים ומדיה מוצרים — הכל במקום אחד"
                action={
                    tab === 'library' ? (
                        <button
                            onClick={() => setShowUrlDialog(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                            style={{ background: 'rgba(0,122,255,0.09)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.18)' }}
                        >
                            <Link2 size={13} />
                            הוסף קישור
                        </button>
                    ) : null
                }
            />

            {/* Tab switcher */}
            <div className="flex items-center gap-2">
                {[
                    { id: 'library',  label: 'ספרייה', Icon: FolderOpen },
                    { id: 'products', label: 'תמונות מוצרים', Icon: Image },
                    { id: 'vod',      label: 'סרטוני VOD', Icon: Film },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                        style={{
                            background: tab === t.id ? '#007AFF' : 'rgba(255,255,255,0.88)',
                            color: tab === t.id ? 'white' : '#6E6E73',
                            border: `1px solid ${tab === t.id ? '#007AFF' : 'rgba(0,0,0,0.07)'}`,
                            boxShadow: tab === t.id ? '0 2px 12px rgba(0,122,255,0.25)' : 'none',
                        }}>
                        <t.Icon size={13} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* VOD and Product tabs render their own content */}
            {tab === 'products' && <ProductImagesTab onCopy={handleCopy} copied={copied} />}
            {tab === 'vod' && <VodTab onCopy={handleCopy} copied={copied} />}

            {tab !== 'library' && null}
            {tab === 'library' && (<>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'סה"כ פריטים', value: stats.total, color: '#007AFF', icon: FolderOpen },
                    { label: 'תמונות', value: stats.images, color: '#34C759', icon: Image },
                    { label: 'סרטונים', value: stats.videos, color: '#FF3B30', icon: Film },
                    { label: 'קישורים חיצוניים', value: stats.urls, color: '#FF9500', icon: Link2 },
                ].map(s => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-[20px] text-right" style={GLASS}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                                <s.icon size={14} style={{ color: s.color }} />
                            </div>
                            <span className="text-2xl font-black text-[#1D1D1F] tracking-tighter">{s.value}</span>
                        </div>
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest">{s.label}</p>
                    </motion.div>
                ))}
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
                            <motion.div animate={{ width: `${pct}%` }} className="h-full rounded-full bg-[#007AFF]" />
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

                {/* Filter pills */}
                <div className="flex items-center gap-1.5">
                    {[
                        { id: 'all', label: 'הכל' },
                        { id: 'images', label: 'תמונות' },
                        { id: 'videos', label: 'סרטונים' },
                        { id: 'urls', label: 'קישורים' },
                    ].map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                            style={{
                                background: filter === f.id ? '#007AFF' : 'rgba(255,255,255,0.88)',
                                color: filter === f.id ? 'white' : '#6E6E73',
                                border: '1px solid rgba(0,0,0,0.06)',
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    {[
                        { id: 'grid', Icon: Grid },
                        { id: 'list', Icon: List },
                    ].map(v => (
                        <button key={v.id} onClick={() => setViewMode(v.id)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ background: viewMode === v.id ? 'white' : 'transparent', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                            <v.Icon size={14} className={viewMode === v.id ? 'text-[#007AFF]' : 'text-[#AEAEB2]'} />
                        </button>
                    ))}
                </div>

                <p className="text-[11px] text-[#AEAEB2] font-bold">{filtered.length} פריטים</p>
            </div>

            {/* Grid / List */}
            {loading ? (
                <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[#AEAEB2] font-bold text-sm">טוען ספרייה...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center rounded-[24px]" style={CARD}>
                    <Image size={40} className="mx-auto text-[#D1D1D6] mb-3" />
                    <p className="text-[#AEAEB2] font-bold">{search ? 'לא נמצאו פריטים' : 'הספרייה ריקה'}</p>
                    <p className="text-[#C7C7CC] text-sm mt-1">{!search && 'גרור קבצים לאזור למעלה או הוסף קישור'}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <AnimatePresence>
                        {filtered.map(item => (
                            <MediaCard key={item.id} item={item} onDelete={handleDelete} onCopy={handleCopy} copied={copied} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="rounded-[22px] overflow-hidden" style={CARD}>
                    <div className="divide-y divide-black/[0.04]">
                        {filtered.map(item => (
                            <motion.div key={item.id} layout
                                className="flex items-center gap-4 px-5 py-3 hover:bg-black/[0.02] transition-colors group"
                                dir="rtl">
                                <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#F5F5F7] shrink-0">
                                    <img src={item.url} alt={item.name} className="w-full h-full object-cover"
                                        onError={e => { e.target.style.display = 'none'; }} />
                                </div>
                                <div className="flex-1 min-w-0 text-right">
                                    <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{item.name}</p>
                                    <p className="text-[10px] text-[#AEAEB2]">{formatSize(item.size)} · {item.source === 'url' ? 'קישור חיצוני' : 'קובץ'}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleCopy(item.url)}
                                        className="p-1.5 rounded-lg hover:bg-[#007AFF]/10 text-[#007AFF] transition-colors">
                                        {copied === item.url ? <Check size={13} /> : <Copy size={13} />}
                                    </button>
                                    <button onClick={() => handleDelete(item)}
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
        </div>
    );
}
