/* eslint-disable */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import {
    collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query, updateDoc,
    getDocs, setDoc
} from 'firebase/firestore';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminSectionHeader, AdminKPICard, AdminEmpty, AdminTabs } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import { uploadFileToFirestore, fetchFirestoreBlobUrl, fetchChunksBlobUrl, replaceDocFile, snapshotDocChunks, FILE_MAX_BYTES, imageToThumb, extractPdf } from '../utils/fileStore';
import { buildFolderTree, getFolderPath, getDescendantIds, getChildFolders, isInvalidMove } from '../utils/vaultTree';
import {
    GLASS, RADIUS, SHADOW, SPRING, TAP, TAP_SOFT, hexA, glow, accentSurface, DOMAIN_ACCENTS
} from '../theme/tokens';
import {
    Upload, Link2, Trash2, Copy, Check, FileText, Folder,
    FolderOpen, FolderPlus, X, Search, Grid, List, ExternalLink, Plus,
    Archive, Download, Eye, Tag, CheckCircle, ShieldAlert, ArrowLeftRight,
    Clock, Edit, ArrowRight, Sparkles, Printer, ChevronDown, HardDrive,
    Image as ImageIcon, FileSpreadsheet, ShieldCheck, Zap, ChevronLeft,
    ChevronRight, Star, Move, ArrowUpDown, Columns3, Command, CornerDownRight,
    Wand2, History, Files, Filter, MousePointerClick, ArrowUpAZ, CheckSquare, Square,
    Trash, RotateCcw, FolderInput, PenLine, MoreVertical, GripVertical, Layers, UploadCloud, ChevronUp, ScanLine
} from 'lucide-react';

// ─── Vault accent (restrained brand — azure, de-rainbowed) + liquid-glass surfaces ─
const VAULT  = DOMAIN_ACCENTS.vault; // azure #007AFF
const VGRAD  = 'linear-gradient(135deg,#007AFF,#5AC8FA)'; // azure → indigo signature
const CARD   = { ...GLASS.base, borderRadius: RADIUS.card };
const PANEL  = { ...GLASS.elevated, borderRadius: RADIUS.panel };
// Frosted "ghost" action button (header secondary actions) + spring hover lift
const GHOST_BTN   = {
    background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.9)',
    backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
    boxShadow: '0 4px 14px rgba(20,40,80,0.06), inset 0 1px 0 rgba(255,255,255,1)',
};
const GHOST_HOVER = { y: -2, boxShadow: '0 10px 26px rgba(20,40,80,0.12), inset 0 1px 0 rgba(255,255,255,1)' };

const SYSTEM_FOLDERS = [
    { id: 'agreements', name: 'הסכמי לקוחות', icon: 'file-text', color: '#007AFF', bg: 'rgba(0,122,255,0.08)', system: true, parentId: null, order: 0 },
    { id: 'quotes', name: 'הצעות מחיר', icon: 'file-text', color: '#FF9500', bg: 'rgba(255,149,0,0.08)', system: true, parentId: null, order: 1 },
    { id: 'receipts', name: 'חשבוניות וקבלות', icon: 'archive', color: '#34C759', bg: 'rgba(52,199,89,0.08)', system: true, parentId: null, order: 2 },
    { id: 'suppliers', name: 'הצעות ספקים', icon: 'arrow-left-right', color: '#5AC8FA', bg: 'rgba(90,200,250,0.08)', system: true, parentId: null, order: 3 },
    { id: 'product_docs', name: 'מסמכי מוצרים', icon: 'folder', color: '#FF2D55', bg: 'rgba(255,45,85,0.08)', system: true, parentId: null, order: 4 },
];

// Palette for custom folder colors + emoji picker (folder personalization)
const FOLDER_COLORS = ['#007AFF', '#FF9500', '#34C759', '#5AC8FA', '#FF2D55', '#FF3B30', '#5AC8FA', '#0A84FF', '#FF9F0A', '#8E8E93'];
const FOLDER_EMOJIS = ['📁', '📄', '🧾', '📊', '🏫', '💼', '⭐', '🔒', '📦', '🖥️', '🎓', '💰', '📅', '⚖️', '🛠️', '📝'];

const CLASSIFICATIONS = [
    { id: 'all', label: 'הכל', color: '#8E8E93' },
    { id: 'approved', label: 'מאושר', color: '#30D158' },
    { id: 'pending', label: 'בבדיקה', color: '#FF9500' },
    { id: 'archived', label: 'בארכיון', color: '#FF3B30' },
];

const SMART_TEMPLATES = [
    {
        id: 'supply_agreement',
        title: 'הסכם אספקה מוסדי',
        description: 'הסכם אספקת ציוד קצה וכלי כתיבה לבתי ספר ומוסדות חינוך',
        legalBasis: 'חוזה התקשרות סטנדרטי NextClass',
        category: 'agreements',
        fields: [
            { key: 'school_name', label: 'שם בית הספר / המוסד', type: 'text', placeholder: 'לדוגמה: מקיף ג׳ אשדוד', required: true, group: 'פרטי המוסד' },
            { key: 'school_id', label: 'ח״פ / סמל מוסד', type: 'text', placeholder: 'לדוגמה: 123456', required: true, group: 'פרטי המוסד' },
            { key: 'contact_name', label: 'שם איש קשר מורשה', type: 'text', placeholder: 'לדוגמה: ישראל ישראלי', required: true, group: 'פרטי המוסד' },
            { key: 'items_summary', label: 'תיאור הציוד לאספקה', type: 'textarea', placeholder: 'לדוגמה: 200 מארזי כתיבה, 50 לוחות מחיקים...', required: true, group: 'פרטי ההתקשרות' },
            { key: 'total_price', label: 'סך הכל לתשלום (ש״ח)', type: 'money', placeholder: 'לדוגמה: 15000', required: true, group: 'פרטי ההתקשרות' },
            { key: 'delivery_date', label: 'תאריך אספקה מבוקש', type: 'date', placeholder: '', required: true, group: 'פרטי ההתקשרות' },
        ],
        templateHtml: (v) => `
            <div style="font-family: sans-serif; line-height: 1.6; color: #1D1D1F; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
                <div style="text-align: center; border-bottom: 2px solid #5AC8FA; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #5AC8FA; margin: 0;">NextClass - הסכם אספקה מוסדי</h1>
                    <p style="font-size: 12px; color: #86868B; margin: 5px 0 0 0;">מספר הסכם: NC-AG-${Date.now().toString().slice(-6)}</p>
                </div>
                <p>נערך ונחתם בתאריך: ${new Date().toLocaleDateString('he-IL')}</p>

                <h3 style="color: #1D1D1F; border-bottom: 1px solid #E5E5EA; padding-bottom: 5px;">1. הצדדים להסכם</h3>
                <p><b>הספק:</b> נקסט קלאס בע"מ (ח.פ. 51654321)</p>
                <p><b>הלקוח:</b> ${v.school_name || '___________'} (סמל מוסד/ח.פ: ${v.school_id || '___________'}) באמצעות מורשה החתימה ${v.contact_name || '___________'}</p>

                <h3 style="color: #1D1D1F; border-bottom: 1px solid #E5E5EA; padding-bottom: 5px;">2. תיאור הציוד והאספקה</h3>
                <p>הספק יספק ללקוח את הציוד המפורט להלן:</p>
                <div style="background: #F5F5F7; padding: 12px; border-radius: 10px; font-size: 13px; margin: 10px 0;">
                    ${(v.items_summary || 'טרם הוזן תיאור ציוד').replace(/\n/g, '<br/>')}
                </div>
                <p>תאריך אספקה מבוקש וסופי: <b>${v.delivery_date ? new Date(v.delivery_date).toLocaleDateString('he-IL') : 'לא צוין'}</b></p>

                <h3 style="color: #1D1D1F; border-bottom: 1px solid #E5E5EA; padding-bottom: 5px;">3. תמורה ותנאי תשלום</h3>
                <p>עבור הציוד המפורט לעיל, ישלם הלקוח לספק סך כולל של <b>₪${Number(v.total_price || 0).toLocaleString('he-IL')}</b> כולל מע"מ כדין.</p>
                <p>התשלום יבוצע בתנאי שוטף + 30 מיום קבלת הציוד והגשת חשבונית מס ממוחשבת.</p>

                <div style="margin-top: 40px; border-top: 1px solid #E5E5EA; padding-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <p style="margin: 0; font-size: 12px; color: #86868B;">חתימת הספק:</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: #5AC8FA;">נקסט קלאס בע"מ</p>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: 12px; color: #86868B;">חתימת מורשה הלקוח:</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold;">${v.contact_name || '___________'}</p>
                    </div>
                </div>
            </div>
        `
    },
    {
        id: 'official_quote',
        title: 'הצעת מחיר רשמית',
        description: 'הצעת מחיר מפורטת למוצרים ופרויקטים חינוכיים בהתאמה אישית',
        legalBasis: 'תוקף ההצעה למשך 30 יום',
        category: 'quotes',
        fields: [
            { key: 'client_name', label: 'שם הלקוח / מוסד', type: 'text', placeholder: 'לדוגמה: עיריית רמת גן - אגף חינוך', required: true, group: 'פרטי הלקוח' },
            { key: 'quote_title', label: 'נושא הצעת המחיר', type: 'text', placeholder: 'לדוגמה: חידוש מעבדת מדעים', required: true, group: 'פרטי ההצעה' },
            { key: 'items_details', label: 'פירוט מוצרים ומחירים', type: 'textarea', placeholder: "לדוגמה:\n10 יחידות מיקרוסקופ דיגיטלי - 1,200 ש\"ח ליח'\n1 יח' מקרן אינטראקטיבי - 4,500 ש\"ח", required: true, group: 'פרטי ההצעה' },
            { key: 'subtotal', label: 'סכום לפני מע״מ (ש״ח)', type: 'money', placeholder: 'לדוגמה: 16500', required: true, group: 'פרטי ההצעה' },
        ],
        templateHtml: (v) => `
            <div style="font-family: sans-serif; line-height: 1.6; color: #1D1D1F; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
                <div style="text-align: center; border-bottom: 2px solid #FF9500; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #FF9500; margin: 0;">NextClass - הצעת מחיר רשמית</h1>
                    <p style="font-size: 12px; color: #86868B; margin: 5px 0 0 0;">מספר הצעה: NC-QT-${Date.now().toString().slice(-6)}</p>
                </div>
                <p>תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}</p>
                <p>לכבוד: <b>${v.client_name || '___________'}</b></p>

                <h3 style="color: #1D1D1F; border-bottom: 1px solid #E5E5EA; padding-bottom: 5px;">נושא: ${v.quote_title || '___________'}</h3>
                <p>אנו שמחים להגיש לך את הצעת המחיר הבאה עבור מוצרי NextClass:</p>

                <div style="background: #F5F5F7; padding: 15px; border-radius: 12px; font-size: 13px; margin: 15px 0;">
                    ${(v.items_details || 'טרם הוזן פירוט מוצרים ומחירים').replace(/\n/g, '<br/>')}
                </div>

                <div style="border-top: 1px solid #E5E5EA; padding-top: 10px; margin-top: 15px; text-align: left; direction: ltr;">
                    <p style="margin: 3px 0;">סכום ביניים לפני מע"מ: ₪${Number(v.subtotal || 0).toLocaleString('he-IL')}</p>
                    <p style="margin: 3px 0;">מע"מ (17%): ₪${(Number(v.subtotal || 0) * 0.17).toLocaleString('he-IL')}</p>
                    <h3 style="margin: 5px 0; color: #FF9500;">סה"כ כולל מע"מ: ₪${(Number(v.subtotal || 0) * 1.17).toLocaleString('he-IL')}</h3>
                </div>

                <div style="margin-top: 30px; font-size: 11px; color: #86868B; background: #FFF9F2; border: 1px solid #FFE5CC; padding: 10px; border-radius: 8px;">
                    <p style="margin: 0; font-weight: bold;">הערות ותנאים:</p>
                    <ul style="margin: 5px 0 0 0; padding-right: 15px; direction: rtl; text-align: right;">
                        <li>הצעה זו בתוקף ל-30 יום ממועד הפקתה.</li>
                        <li>זמני אספקה: עד 14 ימי עסקים ממועד קבלת הזמנת רכש חתומה.</li>
                    </ul>
                </div>
            </div>
        `
    }
];

function formatSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(ts) {
    return ts?.toDate ? ts.toDate().toLocaleDateString('he-IL') : '';
}

// ── Derive a friendly "kind" (icon + label + color) from mime/name ──────────
function fileKind(item) {
    const t = `${item?.type || ''} ${item?.name || ''}`.toLowerCase();
    if (t.includes('pdf')) return { key: 'pdf', label: 'PDF', color: '#FF3B30', Icon: FileText };
    if (/(png|jpe?g|gif|webp|svg|image)/.test(t)) return { key: 'image', label: 'תמונה', color: '#34C759', Icon: ImageIcon };
    if (/(sheet|excel|xlsx|xls|csv)/.test(t)) return { key: 'sheet', label: 'גיליון', color: '#30D158', Icon: FileSpreadsheet };
    if (/(html|docx?|word|txt|document)/.test(t)) return { key: 'doc', label: 'מסמך', color: '#007AFF', Icon: FileText };
    return { key: 'other', label: 'קובץ', color: '#8E8E93', Icon: FileText };
}

const KIND_LABELS = { all: 'כל הסוגים', pdf: 'PDF', image: 'תמונות', sheet: 'גיליונות', doc: 'מסמכים', other: 'אחר' };

// Return a short snippet of `text` around the first match of `term`.
function snippetFor(text, term) {
    if (!text || !term) return '';
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    if (i < 0) return '';
    const start = Math.max(0, i - 40), end = Math.min(text.length, i + term.length + 70);
    return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '…' : '');
}
// Render `text` with all case-insensitive occurrences of `term` highlighted.
function HighlightText({ text, term }) {
    if (!term || !text) return text || null;
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = String(text).split(new RegExp(`(${esc})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === term.toLowerCase()
        ? <mark key={i} style={{ background: hexA(VAULT, 0.28), color: '#1D1D1F', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
        : <span key={i}>{p}</span>);
}

function folderIcon(f, size = 14) {
    const color = f.color || '#8E8E93';
    if (f?.emoji) return <span style={{ fontSize: size + 2, lineHeight: 1 }}>{f.emoji}</span>;
    if (f.id === 'receipts') return <Archive size={size} style={{ color }} />;
    if (f.id === 'suppliers') return <ArrowLeftRight size={size} style={{ color }} />;
    if (f.id === 'product_docs' || !f.system) return <Folder size={size} style={{ color }} />;
    return <FileText size={size} style={{ color }} />;
}

// ── Drop zone ───────────────────────────────────────────────────────────
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
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
    }, [onFiles]);

    return (
        <motion.div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            animate={{ scale: isDragActive ? 1.01 : 1 }}
            transition={SPRING.snappy}
            className="relative cursor-pointer flex flex-col items-center gap-3 text-center overflow-hidden"
            style={{
                borderRadius: RADIUS.panel,
                border: `2px dashed ${isDragActive ? VAULT : hexA(VAULT, 0.35)}`,
                background: isDragActive ? hexA(VAULT, 0.07) : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(18px) saturate(180%)',
                WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                boxShadow: isDragActive ? `0 0 0 4px ${hexA(VAULT, 0.12)}` : SHADOW.sm,
                padding: 28,
            }}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3 relative z-10">
                    <div className="w-11 h-11 rounded-full animate-spin" style={{ border: `2px solid ${hexA(VAULT, 0.25)}`, borderTopColor: VAULT }} />
                    <p className="text-xs font-black" style={{ color: VAULT }}>מעלה מסמכים לכספת...</p>
                </div>
            ) : (
                <>
                    <motion.div
                        animate={{ y: isDragActive ? -4 : 0 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
                        style={{ background: hexA(VAULT, 0.12), border: `1px solid ${hexA(VAULT, 0.2)}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}
                    >
                        <Upload size={22} style={{ color: VAULT }} />
                    </motion.div>
                    <div className="relative z-10">
                        <p className="text-[14px] font-black text-[#1D1D1F]">
                            {isDragActive ? 'שחרר מסמכים להעלאה לכספת' : 'גרור מסמכים לכאן'}
                        </p>
                        <p className="text-[11px] text-[#86868B] mt-1">או לחץ לבחירת קבצים מהמחשב</p>
                        <p className="text-[9px] text-[#AEAEB2] mt-1.5">PDF, DOCX, XLSX, PNG, JPG — עד 15MB</p>
                    </div>
                </>
            )}
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={e => onFiles(Array.from(e.target.files))}
                className="hidden"
            />
        </motion.div>
    );
}

// ── Quick action pill (used inside expandable rows / cards) ──────────────
function QuickAction({ icon: Icon, label, color = '#1D1D1F', onClick, href, download, disabled }) {
    const base = {
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
        borderRadius: RADIUS.pill, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
        border: `1px solid ${disabled ? 'rgba(0,0,0,0.06)' : hexA(color, 0.24)}`,
        background: disabled ? 'rgba(0,0,0,0.03)' : hexA(color, 0.09),
        color: disabled ? '#C7C7CC' : color,
        cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none', transition: 'all .15s',
    };
    if (href && !disabled) {
        return (
            <a href={href} target="_blank" rel="noreferrer" download={download}
                onClick={e => e.stopPropagation()} style={base}>
                <Icon size={13} />{label}
            </a>
        );
    }
    return (
        <button type="button" disabled={disabled}
            onClick={e => { e.stopPropagation(); if (!disabled) onClick?.(); }} style={base}>
            <Icon size={13} />{label}
        </button>
    );
}

// ── Expandable 360° document row (list view) ─────────────────────────────
function VaultDocRow({ item, folders, expanded, onToggle, onUpdate, onDelete, onCopy, copied, onOpenDetail, onView, onDownload, index, selected, onSelect, onFavorite, onContext }) {
    const confirm = useAdminConfirm();
    const kind = fileKind(item);
    const classCfg = CLASSIFICATIONS.find(c => c.id === item.classification) || CLASSIFICATIONS[0];
    const [tagDraft, setTagDraft] = useState(item.tags?.join(', ') || '');
    useEffect(() => { setTagDraft(item.tags?.join(', ') || ''); }, [item.tags]);

    const saveTags = () => {
        const tags = tagDraft.split(',').map(t => t.trim()).filter(Boolean);
        onUpdate(item.id, { tags });
    };

    return (
        <motion.div layout
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'doc', id: item.id })); e.dataTransfer.effectAllowed = 'move'; }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), ...SPRING.soft }}
            style={{
                borderRadius: RADIUS.md,
                background: selected ? hexA(VAULT, 0.06) : expanded ? hexA(VAULT, 0.04) : 'rgba(255,255,255,0.55)',
                border: `1px solid ${selected ? VAULT : expanded ? hexA(VAULT, 0.22) : 'rgba(0,0,0,0.05)'}`,
                boxShadow: expanded ? SHADOW.sm : 'none',
            }}
            className="overflow-hidden"
        >
            {/* Header row */}
            <div onClick={() => onToggle(item.id)} onContextMenu={onContext}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer group transition-colors"
                style={{ background: expanded ? 'transparent' : undefined }}>
                <button onClick={e => { e.stopPropagation(); onSelect?.(item.id); }}
                    className={`shrink-0 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title="בחר">
                    {selected ? <CheckSquare size={16} style={{ color: VAULT }} /> : <Square size={16} className="text-[#C7C7CC]" />}
                </button>
                <button onClick={e => { e.stopPropagation(); onFavorite?.(item); }} className="shrink-0" title="מועדף">
                    <Star size={15} style={{ color: item.favorite ? '#FF9500' : '#D1D1D6', fill: item.favorite ? '#FF9500' : 'none' }} />
                </button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: hexA(kind.color, 0.1), border: `1px solid ${hexA(kind.color, 0.2)}` }}>
                    <kind.Icon size={17} style={{ color: kind.color }} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-[13px] font-black text-[#1D1D1F] truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#AEAEB2] flex-wrap">
                        <span>{formatSize(item.size)}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt) || '—'}</span>
                        {item.tags?.length > 0 && (
                            <>
                                <span>•</span>
                                <span className="truncate max-w-[160px]">{item.tags.map(t => `#${t}`).join(' ')}</span>
                            </>
                        )}
                    </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black shrink-0"
                    style={{ background: hexA(classCfg.color, 0.14), color: classCfg.color }}>
                    {classCfg.label}
                </span>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={SPRING.soft}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <ChevronDown size={14} className="text-[#86868B]" />
                </motion.div>
            </div>

            {/* Expanded 360° panel */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ ...SPRING.soft }} style={{ overflow: 'hidden' }}>
                        <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }} onClick={e => e.stopPropagation()}>
                            {/* Quick actions */}
                            <div className="flex flex-wrap gap-2 pt-3">
                                <QuickAction icon={Eye} label="תצוגה" color={VAULT} onClick={() => onView(item)} />
                                <QuickAction icon={Download} label="הורדה" color="#007AFF" onClick={() => onDownload(item)} />
                                <QuickAction icon={Edit} label="פרטים מלאים" color="#5AC8FA" onClick={() => onOpenDetail(item)} />
                                <QuickAction icon={Trash2} label="מחק" color="#FF3B30" onClick={async () => { if (await confirm({ message: 'למחוק מסמך זה לצמיתות מהכספת?', danger: true })) onDelete(item); }} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Classify */}
                                <div>
                                    <label className="text-[9px] font-black text-[#AEAEB2] tracking-widest block mb-1.5 text-right">סיווג מהיר</label>
                                    <div className="flex gap-1.5">
                                        {CLASSIFICATIONS.filter(c => c.id !== 'all').map(c => {
                                            const active = item.classification === c.id;
                                            return (
                                                <button key={c.id} onClick={() => onUpdate(item.id, { classification: c.id })}
                                                    className="flex-1 py-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1"
                                                    style={{
                                                        border: `1px solid ${active ? c.color : 'rgba(0,0,0,0.07)'}`,
                                                        background: active ? hexA(c.color, 0.12) : 'rgba(255,255,255,0.7)',
                                                        color: active ? c.color : '#6E6E73',
                                                    }}>
                                                    {c.id === 'approved' && <CheckCircle size={10} />}
                                                    {c.id === 'pending' && <Clock size={10} />}
                                                    {c.id === 'archived' && <ShieldAlert size={10} />}
                                                    {c.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Move folder */}
                                <div>
                                    <label className="text-[9px] font-black text-[#AEAEB2] tracking-widest block mb-1.5 text-right">העבר לתיקייה</label>
                                    <select value={item.folder || ''} onChange={e => onUpdate(item.id, { folder: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl text-[12px] font-bold text-[#1D1D1F] focus:outline-none transition-all text-right"
                                        style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.08)' }}>
                                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Tags editor */}
                            <div>
                                <label className="text-[9px] font-black text-[#AEAEB2] tracking-widest block mb-1.5 text-right">תגיות (מופרדות בפסיקים)</label>
                                <div className="flex gap-2">
                                    <input value={tagDraft} onChange={e => setTagDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveTags(); }}
                                        placeholder="2026, חוזה מוסדי, בית ספר"
                                        className="flex-1 px-3 py-2 rounded-xl text-[12px] font-medium text-[#1D1D1F] focus:outline-none text-right"
                                        style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.08)' }} />
                                    <button onClick={saveTags}
                                        className="px-3.5 rounded-xl text-[11px] font-black text-white shrink-0"
                                        style={{ background: VGRAD, boxShadow: `0 3px 12px ${hexA(VAULT, 0.3)}` }}>
                                        <Tag size={13} className="inline -mt-0.5 ml-1" />שמור
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Document card (grid view) ────────────────────────────────────────────
function VaultDocCard({ item, onOpen, onCopy, copied, onView, onDownload, index, selected, onSelect, onFavorite, folderName, onContext, renaming, onRename, onCancelRename, onTag, search }) {
    const kind = fileKind(item);
    const classCfg = CLASSIFICATIONS.find(c => c.id === item.classification) || CLASSIFICATIONS[0];
    const nameMatch = search && item.name?.toLowerCase().includes(search.toLowerCase());
    const snippet = search && !nameMatch ? snippetFor(item.contentText, search) : '';
    const [nameDraft, setNameDraft] = useState(item.name || '');
    useEffect(() => { if (renaming) setNameDraft(item.name || ''); }, [renaming, item.name]);
    return (
        <motion.div
            layout
            draggable={!renaming}
            onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'doc', id: item.id })); e.dataTransfer.effectAllowed = 'move'; }}
            onClick={() => !renaming && onOpen(item)}
            onContextMenu={onContext}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: Math.min(index * 0.02, 0.25), ...SPRING.soft }}
            whileHover={{ y: -3, boxShadow: SHADOW.lg }}
            className="p-4 flex flex-col justify-between cursor-pointer group relative text-right overflow-hidden"
            style={{ ...CARD, border: selected ? `1.5px solid ${VAULT}` : CARD.border, background: selected ? hexA(VAULT, 0.04) : CARD.background }}
        >
            {/* select checkbox */}
            <button onClick={e => { e.stopPropagation(); onSelect?.(item.id); }}
                className={`absolute top-3 left-3 z-10 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} title="בחר">
                {selected ? <CheckSquare size={17} style={{ color: VAULT }} /> : <Square size={17} className="text-[#C7C7CC]" />}
            </button>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                        <button onClick={e => { e.stopPropagation(); onFavorite?.(item); }} title="מועדף">
                            <Star size={14} style={{ color: item.favorite ? '#FF9500' : '#D1D1D6', fill: item.favorite ? '#FF9500' : 'none' }} />
                        </button>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black"
                            style={{ background: hexA(classCfg.color, 0.14), color: classCfg.color }}>
                            {classCfg.label}
                        </span>
                    </div>
                    {item.thumb ? (
                        <img src={item.thumb} alt="" className="w-11 h-11 rounded-xl object-cover" style={{ border: '1px solid rgba(0,0,0,0.08)' }} />
                    ) : (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: hexA(kind.color, 0.1), border: `1px solid ${hexA(kind.color, 0.2)}` }}>
                            <kind.Icon size={19} style={{ color: kind.color }} />
                        </div>
                    )}
                </div>
                {renaming ? (
                    <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onBlur={() => onRename(nameDraft)}
                        onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') onRename(nameDraft); if (e.key === 'Escape') onCancelRename(); }}
                        className="w-full px-2 py-1 rounded-lg text-[13px] font-black text-[#1D1D1F] focus:outline-none text-right"
                        style={{ background: '#fff', border: `1px solid ${VAULT}` }} />
                ) : (
                    <p className="text-[13px] font-black text-[#1D1D1F] line-clamp-2 leading-snug" title={item.name}><HighlightText text={item.name} term={search} /></p>
                )}
                {(item.docType || folderName) && (
                    <p className="text-[9px] font-bold text-[#AEAEB2] mt-1">{[item.docType, folderName].filter(Boolean).join(' · ')}</p>
                )}
                {snippet && (
                    <p className="text-[10px] text-[#6E6E73] mt-2 line-clamp-2 leading-snug" style={{ background: hexA(VAULT, 0.05), padding: '4px 7px', borderRadius: 7 }}>
                        <HighlightText text={snippet} term={search} />
                    </p>
                )}
                {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        {item.tags.slice(0, 4).map(t => (
                            <button key={t} onClick={e => { e.stopPropagation(); onTag?.(t); }}
                                className="px-1.5 py-0.5 rounded font-bold text-[8px] transition-colors hover:brightness-95"
                                style={{ background: hexA(VAULT, 0.08), color: hexA(VAULT, 0.9) }}>#{t}</button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hover quick actions */}
            <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); onView(item); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: hexA(VAULT, 0.1), color: VAULT }}
                    title="תצוגה"><Eye size={13} /></button>
                <button onClick={e => { e.stopPropagation(); onDownload(item); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'rgba(0,122,255,0.1)', color: '#007AFF' }}
                    title="הורדה"><Download size={13} /></button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 text-[10px] text-[#AEAEB2]" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <span>{formatSize(item.size)}</span>
                <span>{formatDate(item.createdAt)}</span>
            </div>
        </motion.div>
    );
}

// ── Detail Drawer ────────────────────────────────────────────────────────
function DocumentDetailDrawer({ item, folders, onClose, onUpdate, onDelete, onView, onDownload, onVersions }) {
    const confirm = useAdminConfirm();
    const [name, setName] = useState(item.name || '');
    const [folder, setFolder] = useState(item.folder || '');
    const [classification, setClassification] = useState(item.classification || 'pending');
    const [tagsInput, setTagsInput] = useState(item.tags?.join(', ') || '');
    const [saving, setSaving] = useState(false);
    const [activity, setActivity] = useState([]);
    const kind = fileKind(item);

    // live activity trail
    useEffect(() => {
        const un = onSnapshot(query(collection(db, 'vault_documents', item.id, 'activity'), orderBy('at', 'desc')),
            s => setActivity(s.docs.slice(0, 10).map(d => d.data())), () => {});
        return un;
    }, [item.id]);
    const ACT_LABEL = { upload: 'הועלה', move: 'הועבר', update: 'עודכן', classify: 'סווג' };

    const handleSave = async () => {
        setSaving(true);
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        await onUpdate(item.id, { name, folder, classification, tags });
        setSaving(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end" onClick={onClose}
        >
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ ...SPRING.gentle }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md h-full flex flex-col p-6 text-right font-sans"
                style={PANEL}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/05 text-[#AEAEB2] transition-colors">
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText size={18} style={{ color: VAULT }} />
                        <h3 className="font-black text-[#1D1D1F] text-lg">פרטי מסמך בכספת</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-6">
                    {/* File preview icon card */}
                    <div className="p-5 rounded-2xl flex flex-col items-center justify-center text-center"
                        style={{ background: hexA(kind.color, 0.06), border: `1px solid ${hexA(kind.color, 0.16)}` }}>
                        <kind.Icon size={46} style={{ color: kind.color }} />
                        <p className="text-[10px] font-mono text-[#8E8E93] max-w-full truncate mt-2">{item.type || 'קובץ'}</p>
                        <p className="text-[11px] font-black text-[#1D1D1F] mt-1">{formatSize(item.size)} · {kind.label}</p>
                    </div>

                    {/* Form fields */}
                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">שם הקובץ בכספת</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-[13px] font-bold text-[#1D1D1F] focus:outline-none transition-all text-right"
                            style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }} />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">תיקיית סיווג</label>
                        <select value={folder} onChange={e => setFolder(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-[13px] font-bold text-[#1D1D1F] focus:outline-none transition-all text-right"
                            style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }}>
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">סטטוס מסמך</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CLASSIFICATIONS.filter(c => c.id !== 'all').map(c => (
                                <button key={c.id} type="button" onClick={() => setClassification(c.id)}
                                    className="py-2.5 rounded-xl border text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5"
                                    style={{
                                        borderColor: classification === c.id ? c.color : 'rgba(0,0,0,0.06)',
                                        background: classification === c.id ? hexA(c.color, 0.12) : '#F5F5F7',
                                        color: classification === c.id ? c.color : '#6E6E73'
                                    }}>
                                    {c.id === 'approved' && <CheckCircle size={10} />}
                                    {c.id === 'pending' && <Clock size={10} />}
                                    {c.id === 'archived' && <ShieldAlert size={10} />}
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">תגיות חיפוש (מופרדות בפסיקים)</label>
                        <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                            placeholder="דוגמה: 2026, חוזה מוסדי, בית ספר"
                            className="w-full px-4 py-3 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none transition-all text-right"
                            style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)' }} />
                    </div>

                    {/* Metadata Readonly */}
                    <div className="p-4 rounded-xl space-y-2 text-[11px] text-[#8E8E93]" style={{ background: 'rgba(0,0,0,0.015)', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div className="flex justify-between">
                            <span>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('he-IL') : '—'}</span>
                            <span className="font-bold">תאריך העלאה</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-mono">{item.source === 'upload' ? 'העלאה ישירה' : item.source === 'ai_generator' ? 'מחולל AI' : 'סריקת AI / ייבוא'}</span>
                            <span className="font-bold">מקור מסמך</span>
                        </div>
                        {item.docType && (
                            <div className="flex justify-between">
                                <span className="font-mono">{item.docType}{item.aiClassified && ' · AI'}</span>
                                <span className="font-bold">סוג מסמך</span>
                            </div>
                        )}
                    </div>

                    {/* Activity trail (audit) */}
                    {activity.length > 0 && (
                        <div>
                            <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-2 flex items-center gap-1.5"><History size={12} /> יומן פעילות</label>
                            <div className="space-y-2 pr-1">
                                {activity.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-[11px]">
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: VAULT }} />
                                        <span className="font-bold text-[#1D1D1F]">{ACT_LABEL[a.action] || a.action}</span>
                                        {a.detail && <span className="text-[#AEAEB2] truncate">{a.detail}</span>}
                                        <span className="text-[#C7C7CC] mr-auto shrink-0">{a.at?.toDate ? a.at.toDate().toLocaleDateString('he-IL') : ''}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-4 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleSave} disabled={saving}
                            className="py-3 rounded-xl font-black text-[13px] text-white flex items-center justify-center gap-2 transition-all"
                            style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.28)}` }}>
                            {saving ? 'שומר...' : 'שמור'}
                        </button>
                        <button onClick={() => onVersions?.(item)}
                            className="py-3 rounded-xl border text-[12px] font-bold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-all"
                            style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)' }}>
                            <History size={13} style={{ color: VAULT }} /> גרסאות
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onDownload(item)}
                            className="py-2.5 rounded-xl border text-[12px] font-bold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-all text-center"
                            style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)' }}>
                            <Download size={13} /> הורד קובץ
                        </button>
                        <button onClick={async () => { if (await confirm({ message: 'להעביר מסמך זה לסל המיחזור?', danger: true })) { onDelete(item); onClose(); } }}
                            className="py-2.5 rounded-xl border text-[12px] font-bold text-[#FF3B30] flex items-center justify-center gap-1.5 transition-all text-center"
                            style={{ borderColor: 'rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.05)' }}>
                            <Trash2 size={13} /> העבר לסל
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Babushka drill primitives (shared visual grammar with the dashboard) ─────
function DrillStat({ items }) {
    const cols = items.length === 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4';
    return (
        <div className={`grid ${cols} gap-2.5`}>
            {items.map((s, i) => {
                const c = s.color || '#1D1D1F';
                return (
                    <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="rounded-[14px] p-3 text-center"
                        style={{ background: `linear-gradient(150deg, ${hexA(s.color || '#007AFF', 0.11)}, ${hexA(s.color || '#007AFF', 0.04)})`, border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.55), 0 3px 10px ${hexA(s.color || '#007AFF', 0.1)}` }}>
                        <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ background: `linear-gradient(135deg, ${c}, ${c}c4)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.value}</p>
                        <p className="text-[10px] font-bold text-[#AEAEB2] mt-1.5">{s.label}</p>
                    </motion.div>
                );
            })}
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
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-center">
        {Icon && <Icon size={26} className="text-[#AEAEB2] opacity-40" />}
        <p className="text-[#AEAEB2] text-sm font-medium">{text}</p>
    </div>
);

// ─── Recursive folder-tree node (unlimited nesting + drag-and-drop) ───────────
function FolderTreeNode({ node, depth, activeFolder, expandedSet, onToggle, onExpand, onSelect, statsMap, onMoveDoc, onMoveFolder, onEdit, onDelete, onUploadFiles, onReorder, arrangeMode, dragOver, setDragOver }) {
    const hasChildren = node.children && node.children.length > 0;
    const isOpen = expandedSet.has(node.id);
    const active = activeFolder === node.id;
    const st = statsMap[node.id] || { count: 0 };
    const isDropTarget = dragOver === node.id;

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragOver(null);
        if (e.dataTransfer.files?.length) { onUploadFiles(Array.from(e.dataTransfer.files), node.id); return; }
        let payload; try { payload = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; }
        if (payload.kind === 'doc') onMoveDoc(payload.id, node.id);
        else if (payload.kind === 'folder') onMoveFolder(payload.id, node.id);
    };

    return (
        <div>
            <div
                draggable={!node.system}
                onDragStart={(e) => { if (node.system) { e.preventDefault(); return; } e.stopPropagation(); e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'folder', id: node.id })); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== node.id) { setDragOver(node.id); if (hasChildren && !isOpen) onExpand?.(node.id); } }}
                onDragLeave={(e) => { e.stopPropagation(); if (dragOver === node.id) setDragOver(null); }}
                onDrop={handleDrop}
                className="group flex items-center gap-0.5 rounded-[12px] transition-colors"
                style={{
                    paddingInlineStart: 4 + depth * 14,
                    background: active ? hexA(VAULT, 0.1) : isDropTarget ? hexA(VAULT, 0.16) : 'transparent',
                    border: `1px solid ${active ? hexA(VAULT, 0.24) : isDropTarget ? VAULT : 'transparent'}`,
                }}
            >
                <button onClick={() => hasChildren && onToggle(node.id)} className="w-5 h-7 flex items-center justify-center shrink-0" style={{ visibility: hasChildren ? 'visible' : 'hidden' }} tabIndex={-1}>
                    <ChevronDown size={13} className="text-[#AEAEB2]" style={{ transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
                </button>
                <button onClick={() => onSelect(node.id)} className="flex-1 min-w-0 flex items-center gap-2 py-1.5 text-right" style={{ color: active ? VAULT : '#1D1D1F' }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: active ? hexA(VAULT, 0.18) : (node.bg || 'rgba(0,0,0,0.03)') }}>
                        {folderIcon(active && !node.emoji ? { ...node, color: VAULT } : node, 13)}
                    </span>
                    <span className="text-[12.5px] font-bold truncate flex-1">{node.name}</span>
                </button>
                {/* fixed-width trailing slot — keeps every count badge on one straight column */}
                <div className="shrink-0 w-16 flex items-center justify-end pl-1.5">
                    {arrangeMode ? (
                        <div className="flex flex-col">
                            <button onClick={(e) => { e.stopPropagation(); onReorder(node.id, -1); }} className="text-[#AEAEB2] hover:text-[#007AFF]" title="הזז למעלה"><ChevronUp size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); onReorder(node.id, 1); }} className="text-[#AEAEB2] hover:text-[#007AFF]" title="הזז למטה"><ChevronDown size={12} /></button>
                        </div>
                    ) : (<>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full select-none group-hover:hidden" style={{ background: active ? VAULT : 'rgba(0,0,0,0.06)', color: active ? 'white' : '#8E8E93' }}>{st.count}</span>
                        <div className="hidden group-hover:flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); onEdit({ mode: 'create', parentId: node.id }); }} className="p-0.5 text-[#AEAEB2] hover:text-[#007AFF]" title="תיקיית משנה"><FolderPlus size={12} /></button>
                            {!node.system && <>
                                <button onClick={(e) => { e.stopPropagation(); onEdit({ mode: 'edit', folder: node }); }} className="p-0.5 text-[#AEAEB2] hover:text-[#007AFF]" title="ערוך"><Edit size={12} /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(node); }} className="p-0.5 text-[#AEAEB2] hover:text-red-500" title="מחק"><Trash2 size={12} /></button>
                            </>}
                        </div>
                    </>)}
                </div>
            </div>
            {isOpen && hasChildren && (
                <div>
                    {node.children.map(c => (
                        <FolderTreeNode key={c.id} node={c} depth={depth + 1}
                            {...{ activeFolder, expandedSet, onToggle, onExpand, onSelect, statsMap, onMoveDoc, onMoveFolder, onEdit, onDelete, onUploadFiles, onReorder, arrangeMode, dragOver, setDragOver }} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Breadcrumb trail ─────────────────────────────────────────────────────────
function Breadcrumbs({ path, onNavigate }) {
    return (
        <div className="flex items-center gap-1 flex-wrap text-[12px] font-bold">
            <button onClick={() => onNavigate(null)} className="px-2 py-1 rounded-lg text-[#86868B] hover:bg-black/5 transition-colors flex items-center gap-1">
                <HardDrive size={12} /> כספת
            </button>
            {path.map((f, i) => (
                <div key={f.id} className="flex items-center gap-1">
                    <ChevronLeft size={12} className="text-[#C7C7CC]" />
                    <button onClick={() => onNavigate(f.id)}
                        className={`px-2 py-1 rounded-lg transition-colors ${i === path.length - 1 ? 'text-[#1D1D1F]' : 'text-[#86868B] hover:bg-black/5'}`}>
                        {f.name}
                    </button>
                </div>
            ))}
        </div>
    );
}

// ─── Folder create/edit dialog (parent + color + emoji) ───────────────────────
function FolderDialog({ state, folders, onSave, onClose }) {
    const editing = state.mode === 'edit';
    const [name, setName] = useState(editing ? state.folder.name : '');
    const [parentId, setParentId] = useState(editing ? (state.folder.parentId || '') : (state.parentId || ''));
    const [color, setColor] = useState(editing ? (state.folder.color || FOLDER_COLORS[0]) : FOLDER_COLORS[0]);
    const [emoji, setEmoji] = useState(editing ? (state.folder.emoji || '') : '');

    // options: every folder except self + its descendants (no cycles)
    const invalid = editing ? new Set([state.folder.id, ...getDescendantIds(folders, state.folder.id)]) : new Set();
    const options = folders.filter(f => !invalid.has(f.id));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] flex items-center justify-center p-4" dir="rtl"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            onClick={onClose}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 font-sans" style={{ ...PANEL, borderRadius: RADIUS.panel }}>
                <div className="flex items-center justify-between mb-5">
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:bg-black/5"><X size={16} /></button>
                    <h3 className="font-black text-[#1D1D1F] text-lg flex items-center gap-2">{editing ? 'עריכת תיקייה' : 'תיקייה חדשה'} <FolderPlus size={18} style={{ color: VAULT }} /></h3>
                </div>

                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5 text-right">שם התיקייה</label>
                <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: מכרזים 2026"
                    onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave({ name, parentId: parentId || null, color, emoji }); }}
                    className="w-full px-4 py-3 rounded-xl text-[14px] font-bold text-[#1D1D1F] focus:outline-none text-right mb-4"
                    style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)' }} />

                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5 text-right">תיקיית אב (אופציונלי)</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-[13px] font-bold text-[#1D1D1F] focus:outline-none text-right mb-4"
                    style={{ background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <option value="">— רמת שורש —</option>
                    {options.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>

                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5 text-right">צבע</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {FOLDER_COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-full transition-transform"
                            style={{ background: c, transform: color === c ? 'scale(1.15)' : 'scale(1)', boxShadow: color === c ? `0 0 0 3px ${hexA(c, 0.3)}` : 'none' }} />
                    ))}
                </div>

                <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5 text-right">אייקון (אופציונלי)</label>
                <div className="flex flex-wrap gap-1.5 mb-6">
                    <button onClick={() => setEmoji('')} className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black"
                        style={{ background: emoji === '' ? hexA(VAULT, 0.14) : 'rgba(0,0,0,0.04)', border: `1px solid ${emoji === '' ? VAULT : 'transparent'}`, color: '#86868B' }}>ללא</button>
                    {FOLDER_EMOJIS.map(em => (
                        <button key={em} onClick={() => setEmoji(em)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px]"
                            style={{ background: emoji === em ? hexA(VAULT, 0.14) : 'rgba(0,0,0,0.04)', border: `1px solid ${emoji === em ? VAULT : 'transparent'}` }}>{em}</button>
                    ))}
                </div>

                <button onClick={() => name.trim() && onSave({ name, parentId: parentId || null, color, emoji })} disabled={!name.trim()}
                    className="w-full py-3.5 rounded-xl font-black text-[14px] text-white disabled:opacity-40"
                    style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.3)}` }}>
                    {editing ? 'שמור שינויים' : 'צור תיקייה'}
                </button>
            </motion.div>
        </motion.div>
    );
}

// ─── Floating bulk-action bar (multi-select) ──────────────────────────────────
function BulkBar({ count, inTrash, onMovePicker, onClassify, onFavorite, onDownload, onDelete, onRestore, onClear }) {
    return (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[240] flex items-center gap-1 px-3 py-2.5 rounded-2xl flex-wrap justify-center max-w-[95vw]"
            style={{ ...GLASS.sheet, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }} dir="rtl">
            <span className="px-3 py-1.5 rounded-xl text-[12px] font-black text-white" style={{ background: VGRAD }}>{count} נבחרו</span>
            <div className="w-px h-6 bg-black/10 mx-1" />
            {inTrash ? (<>
                <button onClick={onRestore} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#30D158] hover:bg-[#30D158]/10 flex items-center gap-1.5"><RotateCcw size={14} /> שחזר</button>
                <button onClick={onDelete} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-1.5"><Trash2 size={14} /> מחק לצמיתות</button>
            </>) : (<>
                <button onClick={onMovePicker} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#1D1D1F] hover:bg-black/5 flex items-center gap-1.5"><FolderInput size={14} /> העבר</button>
                <button onClick={() => onClassify('approved')} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#30D158] hover:bg-[#30D158]/10 flex items-center gap-1.5"><CheckCircle size={14} /> אשר</button>
                <button onClick={onFavorite} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#FF9500] hover:bg-[#FF9500]/10 flex items-center gap-1.5"><Star size={14} /> מועדף</button>
                <button onClick={onDownload} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#007AFF] hover:bg-[#007AFF]/10 flex items-center gap-1.5"><Download size={14} /> הורדה</button>
                <button onClick={onDelete} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-1.5"><Trash2 size={14} /> מחק</button>
            </>)}
            <div className="w-px h-6 bg-black/10 mx-1" />
            <button onClick={onClear} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#86868B] hover:bg-black/5"><X size={15} /></button>
        </motion.div>
    );
}

// ─── Skeleton loading grid (no bare spinner) ─────────────────────────────────
const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse" style={{ ...CARD }}>
                <div className="flex justify-between items-start mb-3">
                    <div className="h-4 w-14 rounded" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    <div className="w-11 h-11 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }} />
                </div>
                <div className="h-4 w-3/4 rounded mb-2" style={{ background: 'rgba(0,0,0,0.06)' }} />
                <div className="h-3 w-1/2 rounded" style={{ background: 'rgba(0,0,0,0.05)' }} />
                <div className="h-8 mt-5 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }} />
            </div>
        ))}
    </div>
);

// ─── Right-click context menu ─────────────────────────────────────────────────
function ContextMenu({ menu, inTrash, onClose, on }) {
    useEffect(() => {
        const h = () => onClose();
        const k = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('click', h);
        window.addEventListener('scroll', h, true);
        window.addEventListener('keydown', k);
        return () => { window.removeEventListener('click', h); window.removeEventListener('scroll', h, true); window.removeEventListener('keydown', k); };
    }, [onClose]);
    const item = menu.item;
    const MI = ({ icon: Icon, label, onClick, danger }) => (
        <button onClick={(e) => { e.stopPropagation(); onClose(); onClick(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-right hover:bg-black/5 text-[12.5px] font-bold transition-colors"
            style={{ color: danger ? '#FF3B30' : '#1D1D1F' }}>
            <Icon size={14} style={{ color: danger ? '#FF3B30' : '#86868B' }} />{label}
        </button>
    );
    const style = { top: Math.min(menu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 340), left: Math.min(menu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 220) };
    return (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="fixed z-[300] w-52 p-1.5" style={{ ...PANEL, borderRadius: 14, ...style }} onClick={e => e.stopPropagation()} dir="rtl">
            {inTrash ? (<>
                <MI icon={RotateCcw} label="שחזר מהסל" onClick={() => on.restore(item)} />
                <MI icon={Trash2} label="מחק לצמיתות" danger onClick={() => on.permaDelete(item)} />
            </>) : (<>
                <MI icon={Eye} label="תצוגה מקדימה" onClick={() => on.preview(item)} />
                <MI icon={Download} label="הורדה" onClick={() => on.download(item)} />
                <MI icon={PenLine} label="שנה שם" onClick={() => on.rename(item)} />
                <MI icon={Star} label={item.favorite ? 'הסר ממועדפים' : 'הוסף למועדפים'} onClick={() => on.favorite(item)} />
                <MI icon={FolderInput} label="העבר לתיקייה" onClick={() => on.move(item)} />
                <MI icon={History} label="היסטוריית גרסאות" onClick={() => on.versions(item)} />
                <MI icon={Edit} label="פרטים מלאים" onClick={() => on.details(item)} />
                <div className="my-1 border-t border-black/5" />
                <MI icon={Trash2} label="העבר לסל" danger onClick={() => on.trash(item)} />
            </>)}
        </motion.div>
    );
}

// ─── Nested "move to" folder picker ───────────────────────────────────────────
function FolderPickerNode({ node, depth, onPick }) {
    return (
        <div>
            <button onClick={() => onPick(node.id)} style={{ paddingInlineStart: 10 + depth * 16 }}
                className="w-full flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-black/5 text-right transition-colors">
                <span className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: node.bg || 'rgba(0,0,0,0.04)' }}>{folderIcon(node, 11)}</span>
                <span className="text-[12.5px] font-bold text-[#1D1D1F] truncate">{node.name}</span>
            </button>
            {node.children?.map(c => <FolderPickerNode key={c.id} node={c} depth={depth + 1} onPick={onPick} />)}
        </div>
    );
}
function MovePicker({ count, folders, onMove, onClose }) {
    const tree = buildFolderTree(folders);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] flex items-center justify-center p-4" dir="rtl"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} onClick={onClose}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-sm p-5 font-sans" style={{ ...PANEL, borderRadius: RADIUS.panel }}>
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:bg-black/5"><X size={16} /></button>
                    <h3 className="font-black text-[#1D1D1F] text-[15px] flex items-center gap-2">העבר {count > 1 ? `${count} מסמכים` : 'מסמך'} ל… <FolderInput size={17} style={{ color: VAULT }} /></h3>
                </div>
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-0.5">
                    {tree.map(n => <FolderPickerNode key={n.id} node={n} depth={0} onPick={onMove} />)}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Version history panel ────────────────────────────────────────────────────
function VersionsPanel({ item, onClose, onDownloadVersion, onUploadVersion }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const fileRef = useRef(null);
    useEffect(() => {
        const un = onSnapshot(query(collection(db, 'vault_documents', item.id, 'versions'), orderBy('savedAt', 'desc')),
            s => { setVersions(s.docs.map(x => ({ id: x.id, ...x.data() }))); setLoading(false); }, () => setLoading(false));
        return un;
    }, [item.id]);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] flex items-center justify-center p-4" dir="rtl"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} onClick={onClose}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 font-sans" style={{ ...PANEL, borderRadius: RADIUS.panel }}>
                <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadVersion(item, f); e.target.value = ''; }} />
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:bg-black/5"><X size={16} /></button>
                    <h3 className="font-black text-[#1D1D1F] text-[15px] flex items-center gap-2">היסטוריית גרסאות <History size={17} style={{ color: VAULT }} /></h3>
                </div>
                <p className="text-[12px] font-bold text-[#86868B] mb-4 truncate text-right">{item.name}</p>
                <button onClick={() => fileRef.current?.click()} className="w-full py-3 rounded-xl font-black text-[13px] text-white flex items-center justify-center gap-2 mb-4" style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.3)}` }}>
                    <UploadCloud size={15} /> העלה גרסה חדשה
                </button>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: hexA(VAULT, 0.06), border: `1px solid ${hexA(VAULT, 0.18)}` }}>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black text-white" style={{ background: VAULT }}>נוכחית</span>
                        <span className="text-[12px] font-bold text-[#1D1D1F] truncate flex-1">{item.name}</span>
                        <span className="text-[10px] text-[#AEAEB2]">{formatSize(item.size)}</span>
                    </div>
                    {loading ? <p className="text-center text-[#AEAEB2] text-[12px] py-4">טוען…</p>
                        : versions.length === 0 ? <p className="text-center text-[#AEAEB2] text-[12px] py-4">אין גרסאות קודמות עדיין</p>
                            : versions.map((v, i) => (
                                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black text-[#86868B]" style={{ background: 'rgba(0,0,0,0.06)' }}>v{versions.length - i}</span>
                                    <span className="text-[12px] font-bold text-[#1D1D1F] truncate flex-1">{v.name}</span>
                                    <span className="text-[10px] text-[#AEAEB2]">{v.savedAt?.toDate ? v.savedAt.toDate().toLocaleDateString('he-IL') : ''}</span>
                                    <button onClick={() => onDownloadVersion(item.id, v)} className="p-1.5 rounded-lg hover:bg-black/5" title="הורד גרסה"><Download size={13} style={{ color: VAULT }} /></button>
                                </div>
                            ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Tags manager (dedicated area to browse / rename / delete all tags) ───────
function TagsManager({ tags, tagCounts, activeTag, onFilter, onRename, onDelete, onClose }) {
    const [renaming, setRenaming] = useState(null);
    const [draft, setDraft] = useState('');
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] flex items-center justify-center p-4" dir="rtl"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} onClick={onClose}>
            <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-md p-6 font-sans" style={{ ...PANEL, borderRadius: RADIUS.panel }}>
                <div className="flex items-center justify-between mb-1">
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:bg-black/5"><X size={16} /></button>
                    <h3 className="font-black text-[#1D1D1F] text-[15px] flex items-center gap-2">ניהול תגיות <Tag size={17} style={{ color: '#0A84FF' }} /></h3>
                </div>
                <p className="text-[11px] text-[#AEAEB2] mb-4 text-right">{tags.length} תגיות · לחץ לסינון, רחף לעריכה</p>
                {tags.length === 0 ? (
                    <div className="py-10 text-center text-[#AEAEB2]"><Tag size={26} className="mx-auto mb-2 opacity-40" /><p className="text-sm font-bold">אין תגיות עדיין</p><p className="text-[11px] mt-1">תגיות נוצרות אוטומטית ב-״סדר ב-AI״ או ידנית במסמך</p></div>
                ) : (
                    <div className="max-h-[55vh] overflow-y-auto custom-scrollbar space-y-1.5">
                        {tags.map(t => (
                            <div key={t} className="group flex items-center gap-2 p-2 rounded-xl transition-colors"
                                style={{ background: activeTag === t ? hexA(VAULT, 0.08) : 'rgba(0,0,0,0.02)', border: `1px solid ${activeTag === t ? hexA(VAULT, 0.2) : 'rgba(0,0,0,0.05)'}` }}>
                                {renaming === t ? (
                                    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { onRename(t, draft); setRenaming(null); } if (e.key === 'Escape') setRenaming(null); }}
                                        onBlur={() => setRenaming(null)}
                                        className="flex-1 px-2 py-1 rounded-lg text-[13px] font-bold text-[#1D1D1F] focus:outline-none text-right" style={{ background: '#fff', border: `1px solid ${VAULT}` }} />
                                ) : (
                                    <button onClick={() => { onFilter(t); onClose(); }} className="flex-1 flex items-center gap-2 text-right min-w-0">
                                        <Tag size={13} style={{ color: '#0A84FF' }} className="shrink-0" />
                                        <span className="text-[13px] font-bold text-[#1D1D1F] truncate">#{t}</span>
                                        <span className="text-[10px] font-black text-[#AEAEB2] shrink-0">{tagCounts[t]}</span>
                                    </button>
                                )}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => { setRenaming(t); setDraft(t); }} className="p-1.5 rounded-lg hover:bg-black/5 text-[#AEAEB2] hover:text-[#007AFF]" title="שנה שם"><PenLine size={12} /></button>
                                    <button onClick={() => onDelete(t)} className="p-1.5 rounded-lg hover:bg-black/5 text-[#AEAEB2] hover:text-red-500" title="מחק תגית"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ─── Command palette (⌘K) ─────────────────────────────────────────────────────
function CommandPalette({ folders, documents, onClose, onGoFolder, onOpenDoc, onNewFolder, onNewDoc }) {
    const [q, setQ] = useState('');
    const inputRef = useRef(null);
    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
    const term = q.trim().toLowerCase();
    const folderHits = folders.filter(f => f.name.toLowerCase().includes(term)).slice(0, 6);
    const docHits = documents.filter(d => d.name?.toLowerCase().includes(term) || d.tags?.some(t => t.toLowerCase().includes(term)) || d.contentText?.toLowerCase().includes(term)).slice(0, 8);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[270] flex items-start justify-center pt-[12vh] p-4" dir="rtl"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} onClick={onClose}>
            <motion.div initial={{ scale: 0.96, y: -12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97 }} onClick={e => e.stopPropagation()}
                className="w-full max-w-lg overflow-hidden" style={{ ...GLASS.sheet, borderRadius: 22 }}>
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Command size={17} className="text-[#86868B]" />
                    <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="חפש תיקייה, מסמך או פעולה…"
                        className="flex-1 bg-transparent text-[15px] font-bold text-[#1D1D1F] outline-none placeholder:text-[#AEAEB2]" />
                    <kbd className="text-[10px] font-black text-[#AEAEB2] px-1.5 py-0.5 rounded bg-black/5">ESC</kbd>
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
                    <p className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest px-3 pt-2 pb-1">פעולות</p>
                    <button onClick={onNewFolder} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-right">
                        <FolderPlus size={15} style={{ color: VAULT }} /><span className="text-[13px] font-bold text-[#1D1D1F]">תיקייה חדשה</span></button>
                    <button onClick={onNewDoc} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-right">
                        <Sparkles size={15} style={{ color: VAULT }} /><span className="text-[13px] font-bold text-[#1D1D1F]">מחולל מסמכים חכם</span></button>
                    {folderHits.length > 0 && <p className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest px-3 pt-3 pb-1">תיקיות</p>}
                    {folderHits.map(f => (
                        <button key={f.id} onClick={() => onGoFolder(f.id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-right">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: f.bg || 'rgba(0,0,0,0.04)' }}>{folderIcon(f, 12)}</span>
                            <span className="text-[13px] font-bold text-[#1D1D1F] truncate">{f.name}</span></button>
                    ))}
                    {docHits.length > 0 && <p className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-widest px-3 pt-3 pb-1">מסמכים</p>}
                    {docHits.map(d => { const K = fileKind(d); return (
                        <button key={d.id} onClick={() => onOpenDoc(d)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/5 text-right">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: hexA(K.color, 0.1) }}><K.Icon size={12} style={{ color: K.color }} /></span>
                            <span className="text-[13px] font-bold text-[#1D1D1F] truncate">{d.name}</span></button>
                    ); })}
                    {term && folderHits.length === 0 && docHits.length === 0 && (
                        <p className="text-center text-[#AEAEB2] text-[13px] font-medium py-8">לא נמצאו תוצאות</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Table view (sortable metadata columns) ──────────────────────────────────
function VaultTable({ docs, folders, selectedIds, onSelect, onOpenDetail, onView, onDownload, onFavorite, onContext, sortBy, sortDir, onSort }) {
    const fname = (id) => folders.find(f => f.id === id)?.name || '—';
    const Th = ({ label, k }) => (
        <th onClick={() => k && onSort(k)} className={`px-3 py-2.5 text-right text-[10px] font-black text-[#86868B] uppercase tracking-wider whitespace-nowrap ${k ? 'cursor-pointer select-none hover:text-[#1D1D1F]' : ''}`}>
            <span className="inline-flex items-center gap-1">{label}{k === sortBy && <ChevronDown size={11} style={{ transform: sortDir === 'asc' ? 'scaleY(-1)' : 'none' }} />}</span>
        </th>
    );
    return (
        <div className="rounded-[20px] overflow-hidden" style={{ ...CARD }}>
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[720px]">
                    <thead><tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <th className="w-9"></th>
                        <Th label="שם" k="name" /><Th label="סוג" k="type" /><Th label="תיקייה" /><Th label="סטטוס" /><Th label="גודל" k="size" /><Th label="תאריך" k="date" /><th className="w-28"></th>
                    </tr></thead>
                    <tbody>
                        {docs.map(d => {
                            const k = fileKind(d);
                            const c = CLASSIFICATIONS.find(x => x.id === d.classification) || CLASSIFICATIONS[0];
                            const sel = selectedIds.has(d.id);
                            return (
                                <tr key={d.id} className="group transition-colors hover:bg-black/[0.015]"
                                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', background: sel ? hexA(VAULT, 0.05) : 'transparent' }}
                                    onContextMenu={(e) => onContext(d, e)}
                                    draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ kind: 'doc', id: d.id })); e.dataTransfer.effectAllowed = 'move'; }}>
                                    <td className="px-2 text-center"><button onClick={() => onSelect(d.id)}>{sel ? <CheckSquare size={15} style={{ color: VAULT }} /> : <Square size={15} className="text-[#C7C7CC]" />}</button></td>
                                    <td className="px-3 py-2.5"><button onClick={() => onOpenDetail(d)} className="flex items-center gap-2 min-w-0 text-right w-full">
                                        {d.thumb ? <img src={d.thumb} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" style={{ border: '1px solid rgba(0,0,0,0.08)' }} /> : <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(k.color, 0.1) }}><k.Icon size={13} style={{ color: k.color }} /></span>}
                                        <span className="text-[12.5px] font-bold text-[#1D1D1F] truncate">{d.favorite && <Star size={10} className="inline -mt-0.5 ml-1" style={{ color: '#FF9500', fill: '#FF9500' }} />}{d.name}</span></button></td>
                                    <td className="px-3 text-[11px] font-bold text-[#86868B] whitespace-nowrap">{d.docType || k.label}</td>
                                    <td className="px-3 text-[11px] font-medium text-[#86868B] truncate max-w-[140px]">{fname(d.folder)}</td>
                                    <td className="px-3"><span className="px-2 py-0.5 rounded-md text-[9px] font-black whitespace-nowrap" style={{ background: hexA(c.color, 0.14), color: c.color }}>{c.label}</span></td>
                                    <td className="px-3 text-[11px] font-mono text-[#AEAEB2] whitespace-nowrap">{formatSize(d.size)}</td>
                                    <td className="px-3 text-[11px] text-[#AEAEB2] whitespace-nowrap">{formatDate(d.createdAt) || '—'}</td>
                                    <td className="px-3"><div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onView(d)} className="p-1.5 rounded-lg hover:bg-black/5" title="תצוגה"><Eye size={13} style={{ color: VAULT }} /></button>
                                        <button onClick={() => onDownload(d)} className="p-1.5 rounded-lg hover:bg-black/5" title="הורדה"><Download size={13} style={{ color: '#007AFF' }} /></button>
                                        <button onClick={() => onFavorite(d)} className="p-1.5 rounded-lg hover:bg-black/5" title="מועדף"><Star size={13} style={{ color: d.favorite ? '#FF9500' : '#C7C7CC', fill: d.favorite ? '#FF9500' : 'none' }} /></button>
                                    </div></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AdminVault() {
    const navigate = useNavigate();
    const { showToast } = useAdminToast();
    const confirm = useAdminConfirm();
    const [activeFolder, setActiveFolder] = useState('agreements');
    const [documents, setDocuments] = useState([]);
    const [customFolders, setCustomFolders] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [search, setSearch] = useState('');
    const [classificationFilter, setClassificationFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState(() => { try { return localStorage.getItem('vault_view') || 'grid'; } catch { return 'grid'; } });
    const [copied, setCopied] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    // ── advanced organisation state ──
    const [expandedFolders, setExpandedFolders] = useState(() => new Set(SYSTEM_FOLDERS.map(f => f.id)));
    const [includeSub, setIncludeSub] = useState(true);
    const [sortBy, setSortBy] = useState(() => { try { return localStorage.getItem('vault_sortBy') || 'date'; } catch { return 'date'; } });     // date | name | size | type
    const [sortDir, setSortDir] = useState(() => { try { return localStorage.getItem('vault_sortDir') || 'desc'; } catch { return 'desc'; } });
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const [folderDialog, setFolderDialog] = useState(null); // { mode, parentId?, folder? }
    const [quickLook, setQuickLook] = useState(null);       // { item, url }
    const [smartViews, setSmartViews] = useState([]);
    const [activeView, setActiveView] = useState(null);     // saved-view id (overrides folder)
    const [tagFilter, setTagFilter] = useState(null);       // active #tag filter
    const [tagsManagerOpen, setTagsManagerOpen] = useState(false);
    const [arrangeMode, setArrangeMode] = useState(false);  // sidebar reorder mode
    const [quickOrder, setQuickOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('vault_quickOrder')) || ['all', 'fav', 'recent', 'week', 'trash']; } catch { return ['all', 'fav', 'recent', 'week', 'trash']; } });
    const [folderOrder, setFolderOrder] = useState(() => { try { return JSON.parse(localStorage.getItem('vault_folderOrder')) || {}; } catch { return {}; } });
    const [contextMenu, setContextMenu] = useState(null);   // { x, y, item }
    const [renamingId, setRenamingId] = useState(null);     // inline rename target
    const [movePicker, setMovePicker] = useState(null);     // { ids } → nested folder move dialog
    const [versionsFor, setVersionsFor] = useState(null);   // doc → version history panel
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [organizing, setOrganizing] = useState(false);   // AI batch-organize in progress
    const [dragActive, setDragActive] = useState(false); // workspace-wide file drop overlay
    const urlCacheRef = useRef({}); // docId -> in-browser object URL (lazy, cached)
    const headerUploadRef = useRef(null); // hidden input for the top "upload" button
    const searchRef = useRef(null);
    const filteredIdsRef = useRef([]); // current visible doc ids (for keyboard select-all)

    // Revoke all object URLs on unmount
    useEffect(() => () => {
        Object.values(urlCacheRef.current).forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
    }, []);

    // ⌘K / Ctrl+K → command palette
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Persist view + sort preferences
    useEffect(() => {
        try { localStorage.setItem('vault_view', viewMode); localStorage.setItem('vault_sortBy', sortBy); localStorage.setItem('vault_sortDir', sortDir); } catch {}
    }, [viewMode, sortBy, sortDir]);
    // Persist sidebar ordering
    useEffect(() => { try { localStorage.setItem('vault_quickOrder', JSON.stringify(quickOrder)); } catch {} }, [quickOrder]);
    useEffect(() => { try { localStorage.setItem('vault_folderOrder', JSON.stringify(folderOrder)); } catch {} }, [folderOrder]);

    // Keyboard shortcuts: Esc clears selection · ⌘A select all · Del → trash · "/" focus search
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            if (e.key === 'Escape') { if (selectedIds.size) clearSelection(); }
            else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); setSelectedIds(new Set(filteredIdsRef.current)); }
            else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size) { e.preventDefault(); bulkDelete(); }
            else if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedIds, activeView]);

    // ── Babushka drill stack (KPI → breakdown → doc detail) ──
    const [drillStack, setDrillStack] = useState([]);
    const openDrill  = (level) => setDrillStack([level]);
    const pushDrill  = (level) => setDrillStack(s => [...s, level]);
    const popDrill   = () => setDrillStack(s => s.slice(0, -1));
    const closeDrill = () => setDrillStack([]);

    // Smart document state
    const [showSmartDoc, setShowSmartDoc] = useState(false);
    const [smartStep, setSmartStep] = useState('library'); // 'library', 'compose', 'ai', 'preview'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [aiPrompt, setAiPrompt] = useState('');
    const [drafting, setDrafting] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState(null); // { title: '', html: '', folder: '' }

    // Fetch custom folders from Firestore
    useEffect(() => {
        const q = query(collection(db, 'vault_folders'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => {
            setCustomFolders(snap.docs.map(d => ({ id: d.id, ...d.data(), system: false })));
            setLoadingFolders(false);
        }, () => setLoadingFolders(false));
        return unsub;
    }, []);

    // Combine system folders and custom folders
    const folders = [...SYSTEM_FOLDERS, ...customFolders];

    // Fetch documents from Firestore
    useEffect(() => {
        const q = query(collection(db, 'vault_documents'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setError(null);
            setLoading(false);
        }, () => { setError('שגיאה בטעינת המסמכים מהכספת'); setLoading(false); });
        return unsub;
    }, []);

    // Fetch smart views (saved filters)
    useEffect(() => {
        const q = query(collection(db, 'vault_views'), orderBy('createdAt', 'asc'));
        const unsub = onSnapshot(q, snap => setSmartViews(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
        return unsub;
    }, []);

    const rgbaFromHex = (hex, a = 0.08) => hexA(hex || '#8E8E93', a);

    // Per-document activity trail (audit)
    const logActivity = (docId, action, detail = '') => {
        addDoc(collection(db, 'vault_documents', docId, 'activity'), { action, detail, at: serverTimestamp() }).catch(() => {});
    };

    // Create OR edit a folder (nesting-aware)
    const handleSaveFolder = async ({ name, parentId, color, emoji }) => {
        const dlg = folderDialog;
        try {
            if (dlg?.mode === 'edit') {
                await updateDoc(doc(db, 'vault_folders', dlg.folder.id), {
                    name: name.trim(), parentId: parentId || null, color, emoji: emoji || '', bg: rgbaFromHex(color),
                });
                showToast('התיקייה עודכנה', 'success');
            } else {
                const ref = await addDoc(collection(db, 'vault_folders'), {
                    name: name.trim(), parentId: parentId || null, color, emoji: emoji || '',
                    bg: rgbaFromHex(color), order: Date.now(), createdAt: serverTimestamp(),
                });
                if (parentId) setExpandedFolders(prev => new Set(prev).add(parentId));
                showToast(`התיקייה "${name}" נוצרה`, 'success');
            }
        } catch {
            showToast('שגיאה בשמירת התיקייה', 'error');
        }
        setFolderDialog(null);
    };

    // Delete a folder → re-parent its subfolders + move its docs up to the parent
    const handleDeleteFolder = async (folder) => {
        if (folder.system) return;
        if (!await confirm({ title: `למחוק את "${folder.name}"?`, message: 'תיקיות המשנה והמסמכים יועברו לתיקיית האב.', danger: true })) return;
        const dest = folder.parentId || 'agreements';
        try {
            await Promise.all(customFolders.filter(f => f.parentId === folder.id).map(f =>
                updateDoc(doc(db, 'vault_folders', f.id), { parentId: folder.parentId || null })));
            await Promise.all(documents.filter(d => d.folder === folder.id).map(d =>
                updateDoc(doc(db, 'vault_documents', d.id), { folder: dest })));
            await deleteDoc(doc(db, 'vault_folders', folder.id));
            if (activeFolder === folder.id) setActiveFolder(dest);
            showToast(`התיקייה "${folder.name}" נמחקה`, 'success');
        } catch {
            showToast('שגיאה במחיקת התיקייה', 'error');
        }
    };

    // Re-parent a folder (drag folder onto folder) — cycle-safe
    const handleMoveFolder = async (folderId, targetId) => {
        if (isInvalidMove(folders, folderId, targetId)) return;
        try {
            await updateDoc(doc(db, 'vault_folders', folderId), { parentId: targetId || null });
            if (targetId) setExpandedFolders(prev => new Set(prev).add(targetId));
        } catch { showToast('שגיאה בהעברת התיקייה', 'error'); }
    };

    // Move a document (drag doc onto folder). If the dragged doc is part of a
    // multi-selection, move the whole selection together.
    const handleMoveDoc = async (docId, targetFolderId) => {
        const ids = (selectedIds.has(docId) && selectedIds.size > 1) ? [...selectedIds] : [docId];
        try {
            await Promise.all(ids.map(id => updateDoc(doc(db, 'vault_documents', id), { folder: targetFolderId })));
            const fname = folders.find(f => f.id === targetFolderId)?.name || '';
            ids.forEach(id => logActivity(id, 'move', fname));
            showToast(ids.length > 1 ? `${ids.length} מסמכים הועברו` : 'המסמך הועבר', 'success');
            if (ids.length > 1) clearSelection();
        } catch { showToast('שגיאה בהעברת המסמך', 'error'); }
    };

    const toggleExpand = (id) => setExpandedFolders(prev => {
        const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
    const expandFolder = (id) => setExpandedFolders(prev => prev.has(id) ? prev : new Set(prev).add(id));

    // ── Sidebar ordering (persisted to localStorage) ──
    const moveQuick = (key, dir) => setQuickOrder(prev => {
        const arr = [...prev]; const i = arr.indexOf(key); const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) return prev;
        [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
    });
    const moveFolderOrder = (id, dir) => {
        const node = folders.find(f => f.id === id); if (!node) return;
        const pid = node.parentId || null;
        const eff = (f) => (folderOrder[f.id] ?? (f.order ?? 0));
        const siblings = folders.filter(f => (f.parentId || null) === pid)
            .sort((a, b) => eff(a) - eff(b) || String(a.name).localeCompare(String(b.name), 'he'));
        const i = siblings.findIndex(f => f.id === id); const j = i + dir;
        if (j < 0 || j >= siblings.length) return;
        const next = { ...folderOrder };
        siblings.forEach((f, idx) => { next[f.id] = idx; });
        [next[siblings[i].id], next[siblings[j].id]] = [next[siblings[j].id], next[siblings[i].id]];
        setFolderOrder(next);
    };

    // ── Multi-select ──
    const toggleSelect = (id) => setSelectedIds(prev => {
        const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
    const clearSelection = () => setSelectedIds(new Set());
    const bulkMove = async (folderId) => {
        await Promise.all([...selectedIds].map(id => updateDoc(doc(db, 'vault_documents', id), { folder: folderId })));
        showToast(`${selectedIds.size} מסמכים הועברו`, 'success'); clearSelection();
    };
    const bulkClassify = async (cls) => {
        await Promise.all([...selectedIds].map(id => updateDoc(doc(db, 'vault_documents', id), { classification: cls })));
        showToast(`${selectedIds.size} מסמכים סווגו`, 'success'); clearSelection();
    };
    const bulkFavorite = async () => {
        await Promise.all([...selectedIds].map(id => updateDoc(doc(db, 'vault_documents', id), { favorite: true })));
        showToast(`${selectedIds.size} סומנו כמועדפים`, 'success'); clearSelection();
    };
    const bulkDelete = async () => {
        const ids = [...selectedIds];
        if (activeView === 'trash') {
            if (!await confirm({ title: `למחוק ${ids.length} לצמיתות?`, message: 'הפעולה בלתי הפיכה.', danger: true })) return;
            await Promise.all(ids.map(id => { const it = documents.find(d => d.id === id); return it ? permanentDeleteDoc(it) : null; }));
            showToast(`${ids.length} נמחקו לצמיתות`, 'success');
        } else {
            await Promise.all(ids.map(id => updateDoc(doc(db, 'vault_documents', id), { trashed: true, trashedAt: serverTimestamp() })));
            showToast(`${ids.length} הועברו לסל`, 'success');
        }
        clearSelection();
    };

    const toggleFavorite = async (item) => {
        try { await updateDoc(doc(db, 'vault_documents', item.id), { favorite: !item.favorite }); } catch {}
    };

    // ── Smart views (saved filters) ──
    const handleSaveView = async () => {
        const name = window.prompt('שם לתצוגה החכמה (מסנן שמור):');
        if (!name?.trim()) return;
        const rules = {};
        if (classificationFilter !== 'all') rules.classification = classificationFilter;
        if (typeFilter !== 'all') rules.type = typeFilter;
        if (activeView === 'fav') rules.favorite = true;
        if (search.trim()) rules.query = search.trim();
        if (activeFolder && activeFolder !== '__all__' && !activeView) rules.folderId = activeFolder;
        try {
            await addDoc(collection(db, 'vault_views'), { name: name.trim(), rules, color: VAULT, createdAt: serverTimestamp() });
            showToast('התצוגה החכמה נשמרה', 'success');
        } catch { showToast('שגיאה בשמירת התצוגה', 'error'); }
    };
    const handleDeleteView = async (id) => {
        try { await deleteDoc(doc(db, 'vault_views', id)); if (activeView === id) setActiveView(null); } catch {}
    };

    // ── Tag management ──
    const renameTag = async (oldTag, newTag) => {
        const t = newTag.trim(); if (!t || t === oldTag) return;
        const affected = documents.filter(d => (d.tags || []).includes(oldTag));
        await Promise.all(affected.map(d => updateDoc(doc(db, 'vault_documents', d.id),
            { tags: Array.from(new Set((d.tags || []).map(x => x === oldTag ? t : x))) })));
        if (tagFilter === oldTag) setTagFilter(t);
        showToast(`התגית שונתה ל־#${t}`, 'success');
    };
    const deleteTag = async (tag) => {
        if (!await confirm({ title: `למחוק את התגית #${tag}?`, message: 'התגית תוסר מכל המסמכים.', danger: true })) return;
        const affected = documents.filter(d => (d.tags || []).includes(tag));
        await Promise.all(affected.map(d => updateDoc(doc(db, 'vault_documents', d.id),
            { tags: (d.tags || []).filter(x => x !== tag) })));
        if (tagFilter === tag) setTagFilter(null);
        showToast(`התגית #${tag} נמחקה`, 'success');
    };

    const handleFiles = async (files, targetFolder) => {
        if (!files?.length) return;
        const dest = targetFolder || (activeFolder && activeFolder !== '__all__' ? activeFolder : 'agreements');
        const tooBig = files.filter(f => f.size > FILE_MAX_BYTES);
        if (tooBig.length) showToast(`קבצים מעל 15MB אינם נתמכים: ${tooBig.map(f => f.name).join(', ')}`, 'error');
        const valid = files.filter(f => f.size <= FILE_MAX_BYTES);
        if (!valid.length) return;

        setUploading(true);
        const progress = {};
        valid.forEach(f => { progress[f.name] = 0; });
        setUploadProgress(progress);

        let ok = 0;
        const newIds = [];
        await Promise.all(valid.map(async (file) => {
            try {
                // duplicate detection (same name + size already in vault)
                const dup = documents.find(d => d.name === file.name && d.size === file.size);
                let contentText = await extractTextForSearch(file);
                let thumb = await imageToThumb(file);
                // PDFs → extract text (for full-text search) + first-page thumbnail
                if (/pdf/.test((file.type || '') + ' ' + file.name.toLowerCase())) {
                    const r = await extractPdf(file);
                    if (r.text) contentText = r.text;
                    if (r.thumb) thumb = r.thumb;
                }
                const id = await uploadFileToFirestore(db, 'vault_documents', file, {
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    folder: dest,
                    classification: 'pending',
                    tags: [],
                    source: 'upload',
                    favorite: false,
                    trashed: false,
                    contentText,
                    ...(thumb ? { thumb } : {}),
                    ...(dup ? { duplicateOf: dup.id } : {}),
                }, pct => setUploadProgress(prev => ({ ...prev, [file.name]: pct })));
                logActivity(id, 'upload', file.name);
                newIds.push({ id, file, contentText });
                if (dup) showToast(`שים לב: "${file.name}" כבר קיים בכספת`, 'info');
                ok++;
            } catch (err) {
                setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
            }
        }));

        setUploading(false);
        if (ok) showToast(`${ok} מסמכים נשמרו בכספת בהצלחה`, 'success');
        if (ok < valid.length) showToast(`${valid.length - ok} מסמכים נכשלו בשמירה`, 'error');
        setTimeout(() => setUploadProgress({}), 1400);

        // AI auto-classification (non-blocking) — suggests folder + tags + type
        newIds.forEach(({ id, file, contentText }) => autoClassify(id, file, contentText, dest));
    };

    // Extract searchable text from text-like files (best-effort, capped)
    const extractTextForSearch = async (file) => {
        const t = (file.type || '') + ' ' + file.name.toLowerCase();
        if (!/text|json|csv|html|xml|markdown|\.txt|\.csv|\.md|\.json|\.html?/.test(t)) return '';
        try { return (await file.text()).slice(0, 20000); } catch { return ''; }
    };

    // AI classify + tag a document from its metadata (best-effort, silent on failure).
    // applyFolder=true only during a fresh upload into the general inbox.
    const classifyByMeta = async ({ id, name, type, contentText }, { applyFolder = false, dest = null } = {}) => {
        try {
            const sample = (contentText || '').slice(0, 3000);
            const folderList = folders.map(f => `${f.id}|${f.name}`).join('\n');
            const prompt = `סווג את המסמך הבא לכספת מסמכים B2B. שם קובץ: "${name}". סוג: ${type || 'לא ידוע'}.\nתוכן (אם קיים):\n${sample || '(אין טקסט קריא)'}\n\nרשימת תיקיות (id|שם):\n${folderList}\n\nהחזר JSON בלבד בפורמט: {"folderId":"<id מהרשימה>","docType":"<חוזה|הצעת מחיר|חשבונית|הזמנת רכש|מסמך מוצר|אחר>","tags":["תג1","תג2"]}. עד 4 תגיות קצרות בעברית.`;
            const res = await fetch('/api/concierge', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], systemPrompt: 'אתה מנוע סיווג מסמכים. החזר JSON תקין בלבד, ללא טקסט נוסף.' }),
            });
            const data = await res.json();
            let raw = (data.text || data.response || '').trim().replace(/```json|```/g, '');
            const match = raw.match(/\{[\s\S]*\}/); if (!match) return false;
            const out = JSON.parse(match[0]);
            const patch = {};
            if (applyFolder && dest === 'agreements' && out.folderId && out.folderId !== dest && folders.some(f => f.id === out.folderId)) patch.folder = out.folderId;
            if (Array.isArray(out.tags) && out.tags.length) patch.tags = out.tags.slice(0, 4).map(String);
            if (out.docType) patch.docType = String(out.docType);
            patch.aiClassified = true;
            if (Object.keys(patch).length) { await updateDoc(doc(db, 'vault_documents', id), patch); return true; }
        } catch { /* silent — classification is a bonus */ }
        return false;
    };
    const autoClassify = (id, file, contentText, dest) =>
        classifyByMeta({ id, name: file.name, type: file.type, contentText }, { applyFolder: true, dest });

    // "Organize with AI" — backfill searchable text + thumbnails for existing
    // PDFs/images, then classify + tag every doc that still needs it.
    const handleAiOrganize = async () => {
        const isMedia = (d) => /pdf|image|png|jpe?g|webp|gif/.test((d.type || '') + ' ' + (d.name || '').toLowerCase());
        const needsWork = (d) => !(d.tags?.length) || !d.docType || (isMedia(d) && !d.thumb) || (isMedia(d) && !d.contentText);
        const targets = liveDocs.filter(needsWork);
        if (!targets.length) { showToast('הכל כבר מסודר ✨', 'info'); return; }
        setOrganizing(true);
        showToast(`מסדר ${targets.length} מסמכים בעזרת AI…`, 'info');
        let done = 0;
        for (const d of targets) {
            let contentText = d.contentText;
            // backfill text + thumbnail from the stored bytes when missing
            try {
                const isPdf = /pdf/.test((d.type || '') + ' ' + (d.name || '').toLowerCase());
                const isImg = /image|png|jpe?g|webp|gif/.test((d.type || '') + ' ' + (d.name || '').toLowerCase());
                if (d.storage === 'firestore' && ((isPdf && (!d.thumb || !d.contentText)) || (isImg && !d.thumb))) {
                    const url = await resolveObjectUrl(d);
                    const blob = await (await fetch(url)).blob();
                    const file = new File([blob], d.name || 'file', { type: d.type || blob.type });
                    const patch = {};
                    if (isPdf) { const r = await extractPdf(file); if (r.text) { patch.contentText = r.text; contentText = r.text; } if (r.thumb) patch.thumb = r.thumb; }
                    else if (isImg) { const th = await imageToThumb(file); if (th) patch.thumb = th; }
                    if (Object.keys(patch).length) await updateDoc(doc(db, 'vault_documents', d.id), patch);
                }
            } catch {}
            if (!(d.tags?.length) || !d.docType) { if (await classifyByMeta({ id: d.id, name: d.name, type: d.type, contentText })) done++; }
            await new Promise(r => setTimeout(r, 180));
        }
        setOrganizing(false);
        showToast(`הכספת סודרה — ${targets.length} מסמכים עובדו`, 'success');
    };

    // Resolve a document's bytes into an in-browser URL (lazy + cached)
    const resolveObjectUrl = async (item) => {
        if (item.url) return item.url;                       // legacy Storage docs
        if (urlCacheRef.current[item.id]) return urlCacheRef.current[item.id];
        const url = await fetchFirestoreBlobUrl(db, 'vault_documents', item);
        urlCacheRef.current[item.id] = url;
        return url;
    };

    const handleView = async (item) => {
        try {
            const url = await resolveObjectUrl(item);
            setQuickLook({ item, url });
            updateDoc(doc(db, 'vault_documents', item.id), { lastViewedAt: serverTimestamp() }).catch(() => {});
        }
        catch { showToast('שגיאה בפתיחת המסמך', 'error'); }
    };

    const handleDownload = async (item) => {
        try {
            const url = await resolveObjectUrl(item);
            const a = document.createElement('a');
            a.href = url; a.download = item.name || 'document';
            document.body.appendChild(a); a.click(); a.remove();
        } catch { showToast('שגיאה בהורדת המסמך', 'error'); }
    };

    const handleUpdateDoc = async (id, data) => {
        try {
            await updateDoc(doc(db, 'vault_documents', id), data);
            logActivity(id, 'update', Object.keys(data).join(', '));
            showToast('המסמך עודכן בהצלחה', 'success');
        } catch {
            showToast('שגיאה בעדכון המסמך', 'error');
        }
    };

    // Hard delete (chunks + doc) — used by the trash "delete permanently"
    const permanentDeleteDoc = async (item) => {
        if (item.storage === 'firestore') {
            const snap = await getDocs(collection(db, 'vault_documents', item.id, 'chunks'));
            await Promise.all(snap.docs.map(c => deleteDoc(c.ref)));
        }
        await deleteDoc(doc(db, 'vault_documents', item.id));
        const cached = urlCacheRef.current[item.id];
        if (cached) { try { URL.revokeObjectURL(cached); } catch {} delete urlCacheRef.current[item.id]; }
    };

    // Soft delete → move to trash (restorable)
    const handleDeleteDoc = async (item) => {
        try {
            await updateDoc(doc(db, 'vault_documents', item.id), { trashed: true, trashedAt: serverTimestamp() });
            logActivity(item.id, 'trash');
            showToast('הועבר לסל · ניתן לשחזר', 'info');
        } catch { showToast('שגיאה במחיקת המסמך', 'error'); }
    };
    const handleRestoreDoc = async (item) => {
        try { await updateDoc(doc(db, 'vault_documents', item.id), { trashed: false }); showToast('המסמך שוחזר', 'success'); }
        catch { showToast('שגיאה בשחזור', 'error'); }
    };
    const handlePermanentDelete = async (item) => {
        if (!await confirm({ title: 'למחוק לצמיתות?', message: 'לא ניתן לשחזר לאחר מכן.', danger: true })) return;
        try { await permanentDeleteDoc(item); showToast('נמחק לצמיתות', 'success'); }
        catch { showToast('שגיאה במחיקה', 'error'); }
    };
    const handleEmptyTrash = async () => {
        const trashedDocs = documents.filter(d => d.trashed);
        if (!trashedDocs.length) return;
        if (!await confirm({ title: `לרוקן את הסל (${trashedDocs.length})?`, message: 'כל המסמכים בסל יימחקו לצמיתות.', danger: true })) return;
        await Promise.all(trashedDocs.map(permanentDeleteDoc));
        showToast('הסל רוקן', 'success');
    };

    // Bulk download (sequential — no external zip dependency)
    const bulkDownload = async () => {
        const ids = [...selectedIds];
        showToast(`מוריד ${ids.length} מסמכים…`, 'info');
        for (const id of ids) { const it = documents.find(d => d.id === id); if (it) { await handleDownload(it); await new Promise(r => setTimeout(r, 350)); } }
        clearSelection();
    };

    // Version history — snapshot the current file, then replace with a new upload
    const handleUploadVersion = async (item, file) => {
        if (file.size > FILE_MAX_BYTES) { showToast('הקובץ גדול מ-15MB', 'error'); return; }
        try {
            showToast('שומר גרסה חדשה…', 'info');
            const vRef = await addDoc(collection(db, 'vault_documents', item.id, 'versions'), {
                name: item.name, size: item.size || 0, type: item.type || '', chunkCount: item.chunkCount || 0, savedAt: serverTimestamp(),
            });
            await snapshotDocChunks(db, 'vault_documents', item.id, vRef.id);
            const meta = await replaceDocFile(db, 'vault_documents', item.id, file);
            let thumb = await imageToThumb(file);
            let contentText = await extractTextForSearch(file);
            if (/pdf/.test((file.type || '') + ' ' + file.name.toLowerCase())) {
                const r = await extractPdf(file); if (r.text) contentText = r.text; if (r.thumb) thumb = r.thumb;
            }
            await updateDoc(doc(db, 'vault_documents', item.id), {
                ...meta, name: file.name, contentText, thumb: thumb || item.thumb || '', version: (item.version || 1) + 1, updatedAt: serverTimestamp(),
            });
            const cached = urlCacheRef.current[item.id]; if (cached) { try { URL.revokeObjectURL(cached); } catch {} delete urlCacheRef.current[item.id]; }
            logActivity(item.id, 'version', file.name);
            showToast('גרסה חדשה נשמרה · הקודמת נשמרה בהיסטוריה', 'success');
        } catch { showToast('שגיאה בשמירת הגרסה', 'error'); }
    };
    const downloadVersion = async (docId, v) => {
        try {
            const url = await fetchChunksBlobUrl(db, ['vault_documents', docId, 'versions', v.id, 'chunks'], v.type);
            const a = document.createElement('a'); a.href = url; a.download = v.name || 'version'; document.body.appendChild(a); a.click(); a.remove();
        } catch { showToast('שגיאה בהורדת הגרסה', 'error'); }
    };

    const handleCopy = (url) => {
        if (!url) return;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(url);
            showToast('הקישור הועתק ללוח', 'success');
            setTimeout(() => setCopied(''), 2000);
        });
    };

    const openSmartDoc = () => {
        setShowSmartDoc(true);
        setSmartStep('library');
        setSelectedTemplate(null);
        setFormValues({});
        setAiPrompt('');
        setGeneratedDoc(null);
    };

    // ── Scope: smart view (built-in or saved) OR folder (+ descendants) ──
    const isRecent = (d) => { const t = d.createdAt?.toDate ? d.createdAt.toDate().getTime() : 0; return t && (Date.now() - t) < 7 * 86400000; };
    const matchesView = (d, v) => {
        const r = v?.rules || {};
        if (r.classification && r.classification !== 'all' && d.classification !== r.classification) return false;
        if (r.type && r.type !== 'all' && fileKind(d).key !== r.type) return false;
        if (r.favorite && !d.favorite) return false;
        if (r.folderId && d.folder !== r.folderId) return false;
        if (r.tags?.length && !r.tags.every(t => (d.tags || []).includes(t))) return false;
        if (r.query) { const q = r.query.toLowerCase(); if (!(d.name?.toLowerCase().includes(q) || d.contentText?.toLowerCase().includes(q) || d.tags?.some(t => t.toLowerCase().includes(q)))) return false; }
        return true;
    };
    const savedView = activeView && !['fav', 'recent', 'week'].includes(activeView) ? smartViews.find(v => v.id === activeView) : null;
    const descIds = activeFolder ? getDescendantIds(folders, activeFolder) : [];
    const inScope = (d) => {
        if (activeView === 'trash') return !!d.trashed;
        if (d.trashed) return false; // trashed docs are hidden everywhere except the trash view
        if (activeView === 'fav') return !!d.favorite;
        if (activeView === 'recent') return !!d.lastViewedAt;
        if (activeView === 'week') return isRecent(d);
        if (tagFilter) return (d.tags || []).includes(tagFilter);
        if (savedView) return matchesView(d, savedView);
        if (!activeFolder || activeFolder === '__all__') return true;
        if (d.folder === activeFolder) return true;
        return includeSub && descIds.includes(d.folder);
    };
    const scopeDocs = documents.filter(inScope);
    const availableKinds = Array.from(new Set(scopeDocs.map(d => fileKind(d).key)));

    // Filters (classification tabs, type pills, full-text search incl. content)
    const matchedDocs = scopeDocs.filter(docItem => {
        if (classificationFilter !== 'all' && docItem.classification !== classificationFilter) return false;
        if (typeFilter !== 'all' && fileKind(docItem).key !== typeFilter) return false;
        if (search) {
            const term = search.toLowerCase();
            return docItem.name?.toLowerCase().includes(term)
                || docItem.tags?.some(t => t.toLowerCase().includes(term))
                || docItem.docType?.toLowerCase().includes(term)
                || docItem.contentText?.toLowerCase().includes(term);
        }
        return true;
    });

    // Sorting
    const tsOf = (d, field = 'createdAt') => (d[field]?.toDate ? d[field].toDate().getTime() : 0);
    const filteredDocs = [...matchedDocs].sort((a, b) => {
        let r = 0;
        if (activeView === 'recent') r = tsOf(a, 'lastViewedAt') - tsOf(b, 'lastViewedAt');
        else if (sortBy === 'name') r = String(a.name || '').localeCompare(String(b.name || ''), 'he');
        else if (sortBy === 'size') r = (a.size || 0) - (b.size || 0);
        else if (sortBy === 'type') r = fileKind(a).label.localeCompare(fileKind(b).label, 'he');
        else r = tsOf(a) - tsOf(b);
        return (activeView === 'recent' ? -1 : (sortDir === 'asc' ? 1 : -1)) * r;
    });
    filteredIdsRef.current = filteredDocs.map(d => d.id); // for ⌘A select-all

    // Live docs (exclude trashed) drive all counts/stats
    const liveDocs = documents.filter(d => !d.trashed);

    // Direct per-folder counts (tree badges)
    const statsMap = {};
    folders.forEach(f => { statsMap[f.id] = { count: liveDocs.filter(d => d.folder === f.id).length }; });

    const folderStats = folders.map(folder => {
        const fDocs = liveDocs.filter(d => d.folder === folder.id);
        return { ...folder, count: fDocs.length, size: fDocs.reduce((acc, d) => acc + (d.size || 0), 0) };
    });

    const folderTree = buildFolderTree(folders, folderOrder);
    const breadcrumbPath = activeFolder && activeFolder !== '__all__' ? getFolderPath(folders, activeFolder) : [];
    const childFolders = getChildFolders(folders, activeFolder === '__all__' ? null : activeFolder);
    const favCount = documents.filter(d => d.favorite).length;

    // KPI aggregates (live docs only)
    const totalVaultSize = liveDocs.reduce((acc, d) => acc + (d.size || 0), 0);
    const vaultQuota = 1024 * 1024 * 1024; // 1 GB — Firestore Spark free-tier storage
    const quotaPct = Math.min(100, (totalVaultSize / vaultQuota) * 100);
    const approvedCount = liveDocs.filter(d => d.classification === 'approved').length;
    const pendingCount = liveDocs.filter(d => d.classification === 'pending').length;
    const archivedCount = liveDocs.filter(d => d.classification === 'archived').length;
    const recentCount = liveDocs.filter(d => isRecent(d)).length;

    const activeFolderObj = folders.find(f => f.id === activeFolder);

    // Folder-state tabs — filter the document grid by review state (reuses classificationFilter)
    const vaultStateTabs = [
        { id: 'all',      label: 'הכל',          count: scopeDocs.length },
        { id: 'pending',  label: 'ממתין לבדיקה', count: scopeDocs.filter(d => d.classification === 'pending').length },
        { id: 'approved', label: 'מאושר',        count: scopeDocs.filter(d => d.classification === 'approved').length },
        { id: 'archived', label: 'דורש סיווג',   count: scopeDocs.filter(d => d.classification === 'archived').length },
    ];

    const selectFolder = (id) => { setActiveFolder(id); setActiveView(null); setTagFilter(null); setClassificationFilter('all'); setTypeFilter('all'); setExpandedId(null); clearSelection(); };
    const selectView = (id) => { setActiveView(id); setTagFilter(null); setClassificationFilter('all'); setTypeFilter('all'); clearSelection(); };
    const selectTag = (t) => { setTagFilter(t); setActiveView(null); setActiveFolder('__all__'); setClassificationFilter('all'); setTypeFilter('all'); clearSelection(); };
    const inTrash = activeView === 'trash';
    const trashCount = documents.filter(d => d.trashed).length;
    const tagCounts = {};
    liveDocs.forEach(d => (d.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b, 'he'));
    const BUILTIN_VIEWS = [
        { id: 'fav', label: 'מועדפים', Icon: Star, color: '#FF9500', count: favCount },
        { id: 'recent', label: 'נצפו לאחרונה', Icon: Clock, color: '#5AC8FA', count: documents.filter(d => d.lastViewedAt && !d.trashed).length },
        { id: 'week', label: 'הועלו השבוע', Icon: Zap, color: VAULT, count: documents.filter(d => isRecent(d) && !d.trashed).length },
    ];
    // Unified, reorderable quick-access rail
    const QUICK_ITEMS = [
        { key: 'all', label: 'כל המסמכים', Icon: Files, color: VAULT, count: liveDocs.length, active: activeFolder === '__all__' && !activeView && !tagFilter, onClick: () => selectFolder('__all__') },
        { key: 'fav', label: 'מועדפים', Icon: Star, color: '#FF9500', count: favCount, active: activeView === 'fav', onClick: () => selectView('fav') },
        { key: 'recent', label: 'נצפו לאחרונה', Icon: Clock, color: '#5AC8FA', count: documents.filter(d => d.lastViewedAt && !d.trashed).length, active: activeView === 'recent', onClick: () => selectView('recent') },
        { key: 'week', label: 'הועלו השבוע', Icon: Zap, color: VAULT, count: recentCount, active: activeView === 'week', onClick: () => selectView('week') },
        { key: 'trash', label: 'סל מיחזור', Icon: Trash, color: '#FF3B30', count: trashCount, active: inTrash, onClick: () => selectView('trash') },
    ];
    const orderedQuick = quickOrder.map(k => QUICK_ITEMS.find(i => i.key === k)).filter(Boolean).concat(QUICK_ITEMS.filter(i => !quickOrder.includes(i.key)));

    return (
        <div dir="rtl" className="space-y-6 font-sans">
            <input ref={headerUploadRef} type="file" multiple className="hidden"
                onChange={e => { const fs = Array.from(e.target.files || []); if (fs.length) handleFiles(fs); e.target.value = ''; }} />
            <AdminSectionHeader
                title="כספת מסמכים דיגיטלית"
                subtitle="ניהול מאובטח וסיווג חכם של מסמכי NextClass"
                action={
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <motion.button onClick={handleAiOrganize} disabled={organizing} whileHover={GHOST_HOVER} whileTap={TAP}
                            className="px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 text-[#1D1D1F] disabled:opacity-60"
                            style={GHOST_BTN}
                            title="סיווג ותיוג אוטומטי לכל המסמכים">
                            {organizing ? <div className="w-3.5 h-3.5 rounded-full animate-spin" style={{ border: `2px solid ${hexA(VAULT, 0.3)}`, borderTopColor: VAULT }} /> : <Wand2 size={14} style={{ color: VAULT }} />}
                            {organizing ? 'מסדר…' : 'סדר ב-AI'}
                        </motion.button>
                        <motion.button onClick={() => navigate('/admin/ocr')} whileHover={GHOST_HOVER} whileTap={TAP}
                            className="px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 text-[#1D1D1F]"
                            style={GHOST_BTN}
                            title="סרוק הזמנה/מסמך ב-AI">
                            <ScanLine size={14} style={{ color: VAULT }} /> סרוק AI
                        </motion.button>
                        <motion.button onClick={() => setFolderDialog({ mode: 'create' })} whileHover={GHOST_HOVER} whileTap={TAP}
                            className="px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 text-[#1D1D1F]"
                            style={GHOST_BTN}>
                            <FolderPlus size={14} style={{ color: VAULT }} /> תיקייה
                        </motion.button>
                        <motion.button onClick={() => headerUploadRef.current?.click()} whileHover={GHOST_HOVER} whileTap={TAP}
                            className="px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 text-[#1D1D1F]"
                            style={GHOST_BTN}>
                            <Upload size={14} style={{ color: VAULT }} /> העלאה
                        </motion.button>
                        <motion.button onClick={openSmartDoc}
                            whileHover={{ y: -1, boxShadow: `0 8px 26px ${hexA(VAULT, 0.45)}` }} whileTap={TAP}
                            className="px-4 py-2.5 rounded-xl font-black text-xs text-white flex items-center gap-1.5"
                            style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.25)` }}>
                            <Sparkles size={14} /> מחולל AI
                        </motion.button>
                    </div>
                }
            />

            {/* KPI band */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <AdminKPICard title="סה״כ מסמכים" value={liveDocs.length}
                    subtitle={recentCount > 0 ? `${recentCount} הועלו השבוע` : 'כספת מאובטחת'}
                    icon={<FolderOpen size={20} color={VAULT} />} accent={VAULT} loading={loading} error={error} delay={0}
                    onClick={liveDocs.length ? () => openDrill({ type: 'docs', scope: 'all' }) : undefined} />
                <AdminKPICard title="מאושרים" value={approvedCount}
                    subtitle={archivedCount > 0 ? `${archivedCount} בארכיון` : 'מוכנים לשליחה'}
                    icon={<CheckCircle size={20} color="#30D158" />} accent="#30D158" loading={loading} error={error} delay={0.05}
                    onClick={() => openDrill({ type: 'docs', scope: 'approved' })} />
                <AdminKPICard title="ממתינים לבדיקה" value={pendingCount}
                    subtitle="דורשים סיווג" icon={<Clock size={20} color="#FF9500" />} accent="#FF9500" loading={loading} error={error} delay={0.1}
                    onClick={() => openDrill({ type: 'docs', scope: 'pending' })} />

                {/* Storage tile (KPI-styled with quota bar) */}
                {loading ? (
                    <div className="relative overflow-hidden flex flex-col min-h-[140px]" style={{ ...GLASS.base, borderRadius: RADIUS.kpi }}>
                        <div className="p-5 flex-1 flex items-center justify-center">
                            <motion.div className="h-8 w-24 rounded-lg" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ background: 'rgba(0,122,255,0.14)' }} />
                        </div>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ...SPRING.soft }}
                        onClick={() => openDrill({ type: 'storage' })}
                        whileHover={{ y: -3, boxShadow: `${SHADOW.lg}, ${SHADOW.specular}` }} whileTap={TAP}
                        role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill({ type: 'storage' }); } }}
                        className="relative overflow-hidden flex flex-col min-h-[140px] cursor-pointer transition-shadow focus:outline-none" style={{ ...GLASS.base, borderRadius: RADIUS.kpi }}>
                        <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-[#86868B] text-[11px] font-bold tracking-[0.18em] mb-1.5">נפח אחסון</p>
                                    <p className="text-[26px] font-black tracking-tighter leading-none"
                                        style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatSize(totalVaultSize)}</p>
                                </div>
                                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(140deg, rgba(0,122,255,0.22), rgba(0,122,255,0.08))', border: '1px solid rgba(0,122,255,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 3px 10px rgba(0,122,255,0.16)' }}>
                                    <HardDrive size={20} color="#007AFF" />
                                </div>
                            </div>
                            <div className="flex-1" />
                            <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                <motion.div className="h-full rounded-full" style={{ background: quotaPct > 85 ? 'linear-gradient(90deg,#FF9500,#FF3B30)' : 'linear-gradient(90deg,#007AFF,#5AC8FA)' }}
                                    initial={{ width: 0 }} animate={{ width: `${quotaPct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
                            </div>
                            <p className="text-[10px] text-[#86868B] font-medium">{quotaPct.toFixed(0)}% מתוך {formatSize(vaultQuota)}</p>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Sidebar: quick views + smart views + folder tree */}
                <div className="space-y-4 p-3 rounded-[20px] lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar" style={{ ...GLASS.base, borderRadius: RADIUS.panel }}>
                    {/* Quick access (reorderable) + tags entry */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1.5 mr-1">
                            <p className="text-[10px] font-black text-[#86868B] tracking-widest uppercase">גישה מהירה</p>
                            <button onClick={() => setArrangeMode(a => !a)} title={arrangeMode ? 'סיום סידור' : 'סדר מחדש את התפריט'}
                                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: arrangeMode ? hexA(VAULT, 0.14) : 'transparent', color: arrangeMode ? VAULT : '#AEAEB2' }}>
                                {arrangeMode ? <Check size={13} /> : <ArrowUpDown size={13} />}
                            </button>
                        </div>
                        {orderedQuick.map((it, i) => (
                            <div key={it.key} className="group flex items-center rounded-xl transition-colors"
                                style={{ background: it.active ? hexA(it.color, 0.1) : 'transparent', border: `1px solid ${it.active ? hexA(it.color, 0.22) : 'transparent'}` }}>
                                <button onClick={it.onClick} className="flex-1 flex items-center gap-2.5 p-2 text-right min-w-0">
                                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(it.color, 0.12) }}><it.Icon size={14} style={{ color: it.color }} /></span>
                                    <span className="text-[12.5px] font-bold text-[#1D1D1F] flex-1 truncate">{it.label}</span>
                                    {(it.count > 0 || it.key === 'all') && <span className="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded-full select-none" style={{ background: it.active ? it.color : 'rgba(0,0,0,0.06)', color: it.active ? '#fff' : '#8E8E93' }}>{it.count}</span>}
                                </button>
                                {arrangeMode && (
                                    <div className="flex flex-col pl-1.5 shrink-0">
                                        <button onClick={() => moveQuick(it.key, -1)} disabled={i === 0} className="text-[#AEAEB2] hover:text-[#007AFF] disabled:opacity-20"><ChevronUp size={13} /></button>
                                        <button onClick={() => moveQuick(it.key, 1)} disabled={i === orderedQuick.length - 1} className="text-[#AEAEB2] hover:text-[#007AFF] disabled:opacity-20"><ChevronDown size={13} /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setTagsManagerOpen(true)} className="w-full flex items-center gap-2.5 p-2 rounded-xl text-right transition-colors"
                            style={{ background: tagFilter ? hexA(VAULT, 0.1) : 'transparent', border: `1px solid ${tagFilter ? hexA(VAULT, 0.22) : 'transparent'}` }}>
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA('#0A84FF', 0.12) }}><Tag size={14} style={{ color: '#0A84FF' }} /></span>
                            <span className="text-[12.5px] font-bold text-[#1D1D1F] flex-1 truncate">{tagFilter ? `תגית: #${tagFilter}` : 'תגיות'}</span>
                            <span className="text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded-full select-none" style={{ background: 'rgba(0,0,0,0.06)', color: '#8E8E93' }}>{allTags.length}</span>
                        </button>
                    </div>

                    {/* Saved smart views */}
                    {smartViews.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#86868B] tracking-widest uppercase mb-1.5 mr-1">תצוגות שמורות</p>
                            {smartViews.map(v => (
                                <div key={v.id} className="group flex items-center rounded-xl" style={{ background: activeView === v.id ? hexA(v.color || VAULT, 0.1) : 'transparent', border: `1px solid ${activeView === v.id ? hexA(v.color || VAULT, 0.22) : 'transparent'}` }}>
                                    <button onClick={() => selectView(v.id)} className="flex-1 flex items-center gap-2.5 p-2 text-right min-w-0">
                                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(v.color || VAULT, 0.12) }}><Filter size={13} style={{ color: v.color || VAULT }} /></span>
                                        <span className="text-[12px] font-bold text-[#1D1D1F] truncate flex-1">{v.name}</span>
                                    </button>
                                    <button onClick={() => handleDeleteView(v.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-[#AEAEB2] hover:text-red-500 transition-opacity"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Folder tree (unlimited nesting + drag-and-drop) */}
                    <div>
                        <div className="flex items-center justify-between mr-1 mb-1.5">
                            <p className="text-[10px] font-black text-[#86868B] tracking-widest uppercase">תיקיות</p>
                            <motion.button whileTap={TAP} onClick={() => setFolderDialog({ mode: 'create' })}
                                className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hexA(VAULT, 0.1), color: VAULT }} title="תיקייה חדשה"><FolderPlus size={14} /></motion.button>
                        </div>
                        <div
                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolder('__root__'); }}
                            onDragLeave={() => setDragOverFolder(v => v === '__root__' ? null : v)}
                            onDrop={(e) => { e.preventDefault(); setDragOverFolder(null); let p; try { p = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; } if (p.kind === 'folder') handleMoveFolder(p.id, null); }}
                            className="space-y-0.5 rounded-xl p-1 transition-colors" style={{ border: `1px dashed ${dragOverFolder === '__root__' ? VAULT : 'transparent'}` }}>
                            {folderTree.map(node => (
                                <FolderTreeNode key={node.id} node={node} depth={0}
                                    activeFolder={activeView ? null : activeFolder} expandedSet={expandedFolders} onToggle={toggleExpand} onExpand={expandFolder}
                                    onSelect={selectFolder} statsMap={statsMap} onMoveDoc={handleMoveDoc} onMoveFolder={handleMoveFolder}
                                    onEdit={setFolderDialog} onDelete={handleDeleteFolder} onUploadFiles={handleFiles}
                                    onReorder={moveFolderOrder} arrangeMode={arrangeMode} dragOver={dragOverFolder} setDragOver={setDragOverFolder} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Vault Explorer — the whole workspace is a drop target */}
                <div className="lg:col-span-3 space-y-3 relative"
                    onDragOver={(e) => { if (Array.from(e.dataTransfer.types || []).includes('Files')) { e.preventDefault(); setDragActive(true); } }}
                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false); }}
                    onDrop={(e) => { setDragActive(false); if (e.dataTransfer.files?.length) { e.preventDefault(); handleFiles(Array.from(e.dataTransfer.files)); } }}>

                    {/* Drag-to-upload overlay */}
                    <AnimatePresence>
                        {dragActive && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 rounded-[24px] flex flex-col items-center justify-center gap-3 pointer-events-none"
                                style={{ background: hexA(VAULT, 0.09), border: `2px dashed ${VAULT}`, backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: hexA(VAULT, 0.16) }}><Upload size={26} style={{ color: VAULT }} /></div>
                                <p className="text-[15px] font-black" style={{ color: VAULT }}>שחרר כאן להעלאה{!activeView && activeFolder !== '__all__' && activeFolderObj ? ` · ${activeFolderObj.name}` : ''}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Upload progress bars */}
                    <AnimatePresence>
                        {Object.entries(uploadProgress).map(([name, pct]) => (
                            <motion.div key={name}
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="p-4" style={{ ...CARD }}>
                                <div className="flex items-center justify-between mb-2 text-[12px] font-black">
                                    <span style={{ color: pct < 0 ? '#FF3B30' : VAULT }}>{pct < 0 ? 'שגיאה' : `${pct}%`}</span>
                                    <span className="text-[#86868B] truncate max-w-[250px]">{name}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                    <motion.div animate={{ width: `${Math.max(0, pct)}%` }} className="h-full rounded-full" style={{ background: pct < 0 ? '#FF3B30' : VGRAD }} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Toolbar — breadcrumb + search + sort + view + save-view (one clean row) */}
                    <div className="flex items-center gap-2 flex-wrap p-2 rounded-[16px]" style={{ ...GLASS.base, borderRadius: RADIUS.md }}>
                        <div className="min-w-0 shrink-0">
                            {tagFilter ? (
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#1D1D1F] px-2 py-1"><Tag size={13} style={{ color: VAULT }} /> #{tagFilter}</div>
                            ) : !activeView ? (
                                <Breadcrumbs path={breadcrumbPath} onNavigate={(id) => selectFolder(id || '__all__')} />
                            ) : (
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#1D1D1F] px-2 py-1">
                                    {activeView === 'trash' ? <Trash size={13} style={{ color: '#FF3B30' }} /> : <Filter size={13} style={{ color: VAULT }} />}
                                    {activeView === 'trash' ? 'סל מיחזור' : (BUILTIN_VIEWS.find(v => v.id === activeView)?.label || smartViews.find(v => v.id === activeView)?.name || 'תצוגה')}
                                </div>
                            )}
                        </div>
                        <div className="relative flex-1 min-w-[160px]">
                            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] pointer-events-none" />
                            <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="חיפוש בשם, תגית או תוכן…  ( / )"
                                className="w-full pr-10 pl-4 py-2 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12 }}
                                onFocus={e => { e.target.style.border = `1px solid ${hexA(VAULT, 0.5)}`; e.target.style.boxShadow = `0 0 0 3px ${hexA(VAULT, 0.1)}`; }}
                                onBlur={e => { e.target.style.border = '1px solid rgba(0,0,0,0.08)'; e.target.style.boxShadow = 'none'; }} />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0" style={{ background: 'rgba(0,0,0,0.05)' }}>
                            <ArrowUpDown size={13} className="text-[#86868B]" />
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-transparent text-[12px] font-bold text-[#1D1D1F] focus:outline-none cursor-pointer">
                                <option value="date">תאריך</option><option value="name">שם</option><option value="size">גודל</option><option value="type">סוג</option>
                            </select>
                            <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="text-[#86868B] hover:text-[#1D1D1F]" title="כיוון מיון"><ArrowUpAZ size={14} style={{ transform: sortDir === 'desc' ? 'scaleY(-1)' : 'none' }} /></button>
                        </div>
                        <button onClick={handleSaveView} title="שמור כתצוגה חכמה" className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,0,0,0.05)', color: '#86868B' }}><Filter size={14} /></button>
                        <div className="flex items-center gap-1 p-1 rounded-xl shrink-0" style={{ background: 'rgba(0,0,0,0.05)' }}>
                            {[{ id: 'grid', Icon: Grid }, { id: 'list', Icon: List }, { id: 'table', Icon: Columns3 }].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id)} className="p-1.5 rounded-lg transition-all" style={{ background: viewMode === v.id ? 'white' : 'transparent', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                    <v.Icon size={14} style={{ color: viewMode === v.id ? VAULT : '#AEAEB2' }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters row: state tabs + type pills + include-sub + select-all */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <AdminTabs tabs={vaultStateTabs} active={classificationFilter} onChange={setClassificationFilter} id="vault-state-tabs" />
                        <div className="flex items-center gap-2 flex-wrap">
                            {availableKinds.length > 1 && ['all', ...availableKinds].map(k => {
                                const active = typeFilter === k;
                                return (
                                    <button key={k} onClick={() => setTypeFilter(k)} className="px-2.5 py-1 rounded-full text-[10.5px] font-black transition-all"
                                        style={{ background: active ? hexA(VAULT, 0.12) : 'rgba(255,255,255,0.6)', border: `1px solid ${active ? hexA(VAULT, 0.3) : 'rgba(0,0,0,0.06)'}`, color: active ? VAULT : '#86868B' }}>
                                        {KIND_LABELS[k] || k}
                                    </button>
                                );
                            })}
                            {!activeView && activeFolder !== '__all__' && (
                                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#86868B] cursor-pointer select-none">
                                    <input type="checkbox" checked={includeSub} onChange={e => setIncludeSub(e.target.checked)} className="accent-[#007AFF]" />כולל תת-תיקיות
                                </label>
                            )}
                            {filteredDocs.length > 0 && (
                                <button onClick={() => setSelectedIds(prev => prev.size === filteredDocs.length ? new Set() : new Set(filteredDocs.map(d => d.id)))} className="flex items-center gap-1.5 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">
                                    {selectedIds.size === filteredDocs.length ? <CheckSquare size={14} style={{ color: VAULT }} /> : <Square size={14} />}בחר הכל
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Result count + trash controls */}
                    {!loading && !error && (
                        <div className="flex items-center justify-between gap-2 px-1">
                            <p className="text-[11px] font-bold text-[#AEAEB2]">
                                {filteredDocs.length} {filteredDocs.length === 1 ? 'מסמך' : 'מסמכים'}
                                {tagFilter && <button onClick={() => setTagFilter(null)} className="mr-2 text-[#007AFF] hover:underline">· #{tagFilter} ✕</button>}
                            </p>
                            {inTrash && trashCount > 0 && (
                                <button onClick={handleEmptyTrash} className="flex items-center gap-1.5 text-[11px] font-black text-[#FF3B30] hover:bg-[#FF3B30]/10 px-2.5 py-1.5 rounded-lg transition-colors">
                                    <Trash size={13} /> רוקן סל
                                </button>
                            )}
                        </div>
                    )}

                    {/* Files display */}
                    {loading ? (
                        <SkeletonGrid />
                    ) : error ? (
                        <div className="rounded-[24px] overflow-hidden" style={{ ...CARD }}>
                            <AdminEmpty icon="alert" title={error} subtitle="נסה לרענן את הדף או לנסות שוב מאוחר יותר" />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="rounded-[24px] overflow-hidden" style={{ ...CARD }}>
                            <AdminEmpty
                                icon={<Folder size={30} style={{ color: VAULT }} />}
                                title={
                                    (search || classificationFilter !== 'all' || typeFilter !== 'all') ? 'לא נמצאו מסמכים תואמים'
                                        : activeView ? `אין מסמכים ב״${BUILTIN_VIEWS.find(v => v.id === activeView)?.label || smartViews.find(v => v.id === activeView)?.name || 'תצוגה'}״`
                                            : (!activeFolder || activeFolder === '__all__') ? 'הכספת ריקה — עדיין לא הועלו מסמכים'
                                                : `התיקייה ״${activeFolderObj?.name || ''}״ ריקה`
                                }
                                subtitle="גרור קבצים לכל מקום כאן, לחץ על ״העלאה״ למעלה, או הפק מסמך עם המחולל החכם"
                                action={{ label: 'מחולל מסמכים חכם AI', onClick: openSmartDoc }}
                            />
                        </div>
                    ) : viewMode === 'grid' ? (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredDocs.map((docItem, i) => (
                                    <VaultDocCard key={docItem.id} item={docItem} index={i}
                                        onOpen={setSelectedDoc} onCopy={handleCopy} copied={copied}
                                        onView={handleView} onDownload={handleDownload}
                                        selected={selectedIds.has(docItem.id)} onSelect={toggleSelect}
                                        onFavorite={toggleFavorite} folderName={folders.find(f => f.id === docItem.folder)?.name}
                                        onContext={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: docItem }); }}
                                        renaming={renamingId === docItem.id} onRename={(name) => { if (name?.trim() && name !== docItem.name) handleUpdateDoc(docItem.id, { name: name.trim() }); setRenamingId(null); }} onCancelRename={() => setRenamingId(null)}
                                        onTag={selectTag} search={search} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : viewMode === 'list' ? (
                        <motion.div layout className="space-y-2">
                            <AnimatePresence>
                                {filteredDocs.map((docItem, i) => (
                                    <VaultDocRow key={docItem.id} item={docItem} index={i} folders={folders}
                                        expanded={expandedId === docItem.id}
                                        onToggle={id => setExpandedId(prev => prev === id ? null : id)}
                                        onUpdate={handleUpdateDoc} onDelete={handleDeleteDoc}
                                        onCopy={handleCopy} copied={copied} onOpenDetail={setSelectedDoc}
                                        onView={handleView} onDownload={handleDownload}
                                        selected={selectedIds.has(docItem.id)} onSelect={toggleSelect} onFavorite={toggleFavorite}
                                        onContext={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: docItem }); }} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <VaultTable docs={filteredDocs} folders={folders} selectedIds={selectedIds} onSelect={toggleSelect}
                            onOpenDetail={setSelectedDoc} onView={handleView} onDownload={handleDownload} onFavorite={toggleFavorite}
                            onContext={(item, e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item }); }}
                            sortBy={sortBy} sortDir={sortDir} onSort={(k) => { if (sortBy === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortBy(k); setSortDir('asc'); } }} />
                    )}
                </div>
            </div>

            {/* Document details drawer */}
            <AnimatePresence>
                {selectedDoc && (
                    <DocumentDetailDrawer
                        item={selectedDoc}
                        folders={folders}
                        onClose={() => setSelectedDoc(null)}
                        onUpdate={handleUpdateDoc}
                        onDelete={handleDeleteDoc}
                        onView={handleView}
                        onDownload={handleDownload}
                        onVersions={(it) => { setSelectedDoc(null); setVersionsFor(it); }}
                    />
                )}
            </AnimatePresence>

            {/* Floating bulk-action bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <BulkBar count={selectedIds.size} inTrash={inTrash}
                        onMovePicker={() => setMovePicker({ ids: [...selectedIds] })}
                        onClassify={bulkClassify} onFavorite={bulkFavorite} onDownload={bulkDownload}
                        onDelete={bulkDelete}
                        onRestore={async () => { await Promise.all([...selectedIds].map(id => updateDoc(doc(db, 'vault_documents', id), { trashed: false }))); showToast(`${selectedIds.size} שוחזרו`, 'success'); clearSelection(); }}
                        onClear={clearSelection} />
                )}
            </AnimatePresence>

            {/* Folder create/edit dialog */}
            <AnimatePresence>
                {folderDialog && (
                    <FolderDialog state={folderDialog} folders={folders} onSave={handleSaveFolder} onClose={() => setFolderDialog(null)} />
                )}
            </AnimatePresence>

            {/* Quick-look preview */}
            <AnimatePresence>
                {quickLook && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[255] flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setQuickLook(null)}>
                        <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }} onClick={e => e.stopPropagation()}
                            className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden" style={{ ...GLASS.sheet, borderRadius: RADIUS.sheetLg }} dir="rtl">
                            <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'rgba(248,248,252,0.95)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(fileKind(quickLook.item).color, 0.12) }}>
                                        {(() => { const K = fileKind(quickLook.item).Icon; return <K size={15} style={{ color: fileKind(quickLook.item).color }} />; })()}
                                    </span>
                                    <p className="font-black text-[#1D1D1F] text-sm truncate">{quickLook.item.name}</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => handleDownload(quickLook.item)} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white flex items-center gap-1.5" style={{ background: VGRAD }}><Download size={13} /> הורדה</button>
                                    <button onClick={() => setQuickLook(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:bg-black/5"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto flex items-center justify-center p-4" style={{ background: '#F2F3F7' }}>
                                {(() => {
                                    const t = (quickLook.item.type || '') + ' ' + quickLook.item.name.toLowerCase();
                                    if (/image|png|jpe?g|gif|webp|svg/.test(t)) return <img src={quickLook.url} alt={quickLook.item.name} className="max-w-full max-h-full object-contain rounded-xl" />;
                                    if (/pdf|html|text/.test(t)) return <iframe src={quickLook.url} title="preview" className="w-full h-full rounded-xl bg-white" style={{ border: 'none' }} />;
                                    return <div className="text-center text-[#86868B]"><FileText size={40} className="mx-auto mb-3 opacity-40" /><p className="font-bold text-sm">אין תצוגה מקדימה לסוג קובץ זה</p><button onClick={() => handleDownload(quickLook.item)} className="mt-3 px-4 py-2 rounded-xl text-white text-[12px] font-bold" style={{ background: VGRAD }}>הורד קובץ</button></div>;
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Command palette (⌘K) */}
            <AnimatePresence>
                {paletteOpen && (
                    <CommandPalette folders={folders} documents={liveDocs} onClose={() => setPaletteOpen(false)}
                        onGoFolder={(id) => { selectFolder(id); setPaletteOpen(false); }}
                        onOpenDoc={(d) => { setSelectedDoc(d); setPaletteOpen(false); }}
                        onNewFolder={() => { setPaletteOpen(false); setFolderDialog({ mode: 'create' }); }}
                        onNewDoc={() => { setPaletteOpen(false); openSmartDoc(); }} />
                )}
            </AnimatePresence>

            {/* Right-click context menu */}
            <AnimatePresence>
                {contextMenu && (
                    <ContextMenu menu={contextMenu} inTrash={inTrash} onClose={() => setContextMenu(null)}
                        on={{
                            preview: handleView, download: handleDownload,
                            rename: (it) => setRenamingId(it.id), favorite: toggleFavorite,
                            move: (it) => setMovePicker({ ids: [it.id] }), versions: setVersionsFor,
                            details: setSelectedDoc, trash: handleDeleteDoc,
                            restore: handleRestoreDoc, permaDelete: handlePermanentDelete,
                        }} />
                )}
            </AnimatePresence>

            {/* Move-to nested folder picker */}
            <AnimatePresence>
                {movePicker && (
                    <MovePicker count={movePicker.ids.length} folders={folders}
                        onMove={async (fid) => { await Promise.all(movePicker.ids.map(id => updateDoc(doc(db, 'vault_documents', id), { folder: fid }))); showToast(`הועבר ל״${folders.find(f => f.id === fid)?.name || ''}״`, 'success'); setMovePicker(null); clearSelection(); }}
                        onClose={() => setMovePicker(null)} />
                )}
            </AnimatePresence>

            {/* Version history */}
            <AnimatePresence>
                {versionsFor && (
                    <VersionsPanel item={documents.find(d => d.id === versionsFor.id) || versionsFor} onClose={() => setVersionsFor(null)}
                        onDownloadVersion={downloadVersion} onUploadVersion={handleUploadVersion} />
                )}
            </AnimatePresence>

            {/* Tags manager */}
            <AnimatePresence>
                {tagsManagerOpen && (
                    <TagsManager tags={allTags} tagCounts={tagCounts} activeTag={tagFilter}
                        onFilter={selectTag} onRename={renameTag} onDelete={deleteTag} onClose={() => setTagsManagerOpen(false)} />
                )}
            </AnimatePresence>

            {/* ── Babushka Drill Drawer — KPI → breakdown → doc detail ───────── */}
            {(() => {
                const current = drillStack[drillStack.length - 1] || null;
                const isOpen  = drillStack.length > 0;
                const canBack = drillStack.length > 1;
                if (!current) return <DashDrillView open={false} onClose={closeDrill} levelKey="none" />;

                const folderName = (id) => folders.find(f => f.id === id)?.name || id || 'ללא תיקייה';
                const classColor = (id) => (CLASSIFICATIONS.find(c => c.id === id) || CLASSIFICATIONS[0]).color;
                const classLabel = (id) => (CLASSIFICATIONS.find(c => c.id === id) || CLASSIFICATIONS[0]).label;
                const docLeading = (d) => {
                    const k = fileKind(d);
                    return <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(k.color, 0.12) }}><k.Icon size={14} style={{ color: k.color }} /></span>;
                };
                const DocList = ({ docs }) => (
                    docs.length === 0 ? <DrillEmpty icon={FolderOpen} text="אין מסמכים להצגה" /> : (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">רשימת מסמכים — לחץ לפרטים</p>
                            {docs.slice(0, 40).map((d, i) => (
                                <DrillRow key={d.id} delay={i * 0.02} tone={classColor(d.classification)}
                                    onClick={() => pushDrill({ type: 'doc', id: d.id })}
                                    leading={docLeading(d)}
                                    title={d.name || 'מסמך'}
                                    subtitle={`${folderName(d.folder)} · ${classLabel(d.classification)}`}
                                    trailing={<span className="text-[11px] font-black text-[#AEAEB2] shrink-0">{formatSize(d.size)}</span>}
                                />
                            ))}
                        </div>
                    )
                );

                let title = '', subtitle = '', icon = null, accent = VAULT, footer = null, body = null;

                if (current.type === 'docs') {
                    const scopeMap = {
                        all:      { label: 'כל המסמכים', color: VAULT,      Icon: FolderOpen, filter: () => true },
                        approved: { label: 'מסמכים מאושרים', color: '#30D158', Icon: CheckCircle, filter: (d) => d.classification === 'approved' },
                        pending:  { label: 'ממתינים לבדיקה', color: '#FF9500', Icon: Clock, filter: (d) => d.classification === 'pending' },
                    };
                    const sc = scopeMap[current.scope] || scopeMap.all;
                    const list = documents.filter(sc.filter);
                    accent = sc.color; icon = <sc.Icon size={17} color={sc.color} />;
                    title = sc.label; subtitle = `${list.length} מסמכים`;
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'סה״כ', value: documents.length, color: VAULT },
                                { label: 'מאושרים', value: approvedCount, color: '#30D158' },
                                { label: 'ממתינים', value: pendingCount, color: '#FF9500' },
                                { label: 'בארכיון', value: archivedCount, color: '#FF3B30' },
                            ]} />
                            <DocList docs={list} />
                        </div>
                    );
                } else if (current.type === 'storage') {
                    accent = VAULT; icon = <HardDrive size={17} color={VAULT} />;
                    title = 'נפח אחסון'; subtitle = `${formatSize(totalVaultSize)} · ${quotaPct.toFixed(0)}% מהמכסה`;
                    const nonEmpty = folderStats.filter(f => f.count > 0).sort((a, b) => b.size - a.size);
                    body = (
                        <div className="space-y-5">
                            <DrillStat items={[
                                { label: 'בשימוש', value: formatSize(totalVaultSize), color: VAULT },
                                { label: 'מכסה', value: formatSize(vaultQuota), color: '#8E8E93' },
                                { label: 'תיקיות', value: folderStats.filter(f => f.count > 0).length, color: '#5AC8FA' },
                            ]} />
                            {nonEmpty.length === 0 ? <DrillEmpty icon={HardDrive} text="הכספת ריקה — טרם הועלו מסמכים" /> : (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">נפח לפי תיקייה — לחץ לצלילה</p>
                                    {nonEmpty.map((f, i) => (
                                        <DrillRow key={f.id} delay={i * 0.03} tone={f.color || VAULT}
                                            onClick={() => pushDrill({ type: 'folder', id: f.id })}
                                            leading={<span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hexA(f.color || VAULT, 0.12) }}>{folderIcon(f, 14)}</span>}
                                            title={f.name}
                                            subtitle={`${f.count} מסמכים`}
                                            trailing={<span className="text-[11px] font-black shrink-0" style={{ color: f.color || VAULT }}>{formatSize(f.size)}</span>}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                } else if (current.type === 'folder') {
                    const f = folders.find(x => x.id === current.id);
                    const list = documents.filter(d => d.folder === current.id);
                    accent = f?.color || VAULT; icon = <span>{folderIcon(f || { color: VAULT }, 17)}</span>;
                    title = f?.name || folderName(current.id); subtitle = `${list.length} מסמכים · ${formatSize(list.reduce((s, d) => s + (d.size || 0), 0))}`;
                    body = <div className="space-y-5"><DocList docs={list} /></div>;
                } else if (current.type === 'doc') {
                    const d = documents.find(x => x.id === current.id);
                    if (!d) {
                        title = 'מסמך'; icon = <FileText size={17} color={VAULT} />;
                        body = <DrillEmpty icon={FileText} text="המסמך נמחק או אינו זמין" />;
                    } else {
                        const k = fileKind(d);
                        accent = classColor(d.classification); icon = <k.Icon size={17} style={{ color: k.color }} />;
                        title = d.name || 'מסמך'; subtitle = `${k.label} · ${folderName(d.folder)}`;
                        footer = { label: 'פתח מסמך מלא', onClick: () => { closeDrill(); setSelectedDoc(d); } };
                        body = (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black" style={{ background: hexA(classColor(d.classification), 0.12), color: classColor(d.classification) }}>
                                        {classLabel(d.classification)}
                                    </span>
                                    <p className="text-[15px] font-black tracking-tight text-[#1D1D1F]">{formatSize(d.size)}</p>
                                </div>
                                <DrillStat items={[
                                    { label: 'סוג', value: k.label, color: k.color },
                                    { label: 'תיקייה', value: folderName(d.folder), color: '#5AC8FA' },
                                    { label: 'הועלה', value: formatDate(d.createdAt) || '—', color: '#8E8E93' },
                                ]} />
                                {(d.tags || []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {d.tags.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#6E6E73]" style={{ background: 'rgba(0,0,0,0.05)' }}>
                                                <Tag size={9} />{t}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                }

                return (
                    <DashDrillView open={isOpen} title={title} subtitle={subtitle} icon={icon} accent={accent}
                        canBack={canBack} onBack={popDrill} onClose={closeDrill} footer={footer}
                        levelKey={`${current.type}:${current.id ?? current.scope ?? ''}:${drillStack.length}`}>
                        {body}
                    </DashDrillView>
                );
            })()}

            {/* Smart document dialog */}
            <AnimatePresence>
                {showSmartDoc && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6" dir="rtl"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ ...SPRING.pill }}
                            className="w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col font-sans"
                            style={{ ...GLASS.sheet, borderRadius: RADIUS.sheetLg }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4"
                                style={{ background: 'rgba(248,248,252,0.92)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowSmartDoc(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-black/05 transition-all">
                                    <X size={16} />
                                </motion.button>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} style={{ color: VAULT }} className="animate-pulse" />
                                    <h3 className="font-black text-[#1D1D1F] text-base">מחולל מסמכים חכם NextClass AI</h3>
                                </div>
                            </div>

                            {/* Content area */}
                            <div className="flex-1 flex overflow-hidden">
                                {smartStep === 'library' && (
                                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                                        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
                                            <h4 className="text-lg font-black text-[#1D1D1F]">בחר תבנית או בקש ניסוח מבוסס בינה מלאכותית</h4>
                                            <p className="text-xs text-[#86868B]">
                                                מחולל המסמכים החכם מאפשר לייצר הסכמים והצעות מחיר רשמיות תוך שניות, עם מילוי שדות אוטומטי ואינטגרציה ל-Gemini Flash 2.5
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                            {SMART_TEMPLATES.map(tpl => (
                                                <motion.div key={tpl.id} whileHover={{ y: -3 }} whileTap={TAP_SOFT}
                                                    onClick={() => { setSelectedTemplate(tpl); setFormValues({}); setSmartStep('compose'); }}
                                                    className="p-5 cursor-pointer transition-all flex flex-col justify-between"
                                                    style={{ ...CARD, borderRadius: RADIUS.card }}>
                                                    <div className="space-y-2">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: hexA(VAULT, 0.1), border: `1px solid ${hexA(VAULT, 0.2)}` }}>
                                                            <FileText size={18} style={{ color: VAULT }} />
                                                        </div>
                                                        <h5 className="font-black text-[#1D1D1F] text-[14px]">{tpl.title}</h5>
                                                        <p className="text-[11px] text-[#86868B] leading-relaxed">{tpl.description}</p>
                                                    </div>
                                                    <span className="text-[9px] text-[#AEAEB2] mt-4 font-bold">{tpl.legalBasis}</span>
                                                </motion.div>
                                            ))}

                                            {/* AI Custom Prompt Card */}
                                            <motion.div whileHover={{ y: -3 }} whileTap={TAP_SOFT}
                                                onClick={() => { setSmartStep('ai'); setAiPrompt(''); }}
                                                className="p-5 cursor-pointer transition-all flex flex-col justify-between"
                                                style={{ borderRadius: RADIUS.card, border: '1px dashed rgba(255,149,0,0.4)', background: 'linear-gradient(160deg, rgba(255,249,242,0.7), #fff)', boxShadow: SHADOW.sm }}>
                                                <div className="space-y-2">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,149,0,0.1)' }}>
                                                        <Sparkles size={18} className="text-[#FF9500]" />
                                                    </div>
                                                    <h5 className="font-black text-[#1D1D1F] text-[14px]">ניסוח חופשי באמצעות AI</h5>
                                                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                                                        תאר בעברית חופשית את פרטי המסמך שברצונך להפיק, והבינה המלאכותית תעשה את העבודה בשבילך.
                                                    </p>
                                                </div>
                                                <span className="text-[9px] text-[#FF9500] mt-4 font-bold">טיוטה מהירה מבוססת Gemini Flash</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                )}

                                {smartStep === 'compose' && selectedTemplate && (
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Fields Form (Right side) */}
                                        <div className="w-1/2 p-6 overflow-y-auto space-y-4" style={{ borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
                                            <button onClick={() => setSmartStep('library')} className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">
                                                <ArrowRight size={12} /> חזרה לבחירת תבנית
                                            </button>
                                            <h4 className="font-black text-[#1D1D1F] text-[15px]">{selectedTemplate.title}</h4>

                                            <div className="space-y-4 pt-2">
                                                {selectedTemplate.fields.map(f => (
                                                    <div key={f.key}>
                                                        <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">
                                                            {f.label} {f.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        {f.type === 'textarea' ? (
                                                            <textarea value={formValues[f.key] || ''}
                                                                onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                placeholder={f.placeholder} rows={4}
                                                                className="w-full rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none transition-all resize-none text-right"
                                                                style={{ border: '1px solid rgba(0,0,0,0.09)' }}
                                                                onFocus={e => e.target.style.border = `1px solid ${VAULT}`}
                                                                onBlur={e => e.target.style.border = '1px solid rgba(0,0,0,0.09)'} />
                                                        ) : (
                                                            <input type={f.type === 'money' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                                                value={formValues[f.key] || ''}
                                                                onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                placeholder={f.placeholder}
                                                                className="w-full rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none transition-all text-right"
                                                                style={{ border: '1px solid rgba(0,0,0,0.09)' }}
                                                                onFocus={e => e.target.style.border = `1px solid ${VAULT}`}
                                                                onBlur={e => e.target.style.border = '1px solid rgba(0,0,0,0.09)'} />
                                                        )}
                                                    </div>
                                                ))}

                                                <motion.button whileTap={TAP}
                                                    onClick={() => {
                                                        const missing = selectedTemplate.fields.filter(f => f.required && !formValues[f.key]);
                                                        if (missing.length) {
                                                            showToast(`נא למלא את כל שדות החובה: ${missing.map(m => m.label).join(', ')}`, 'error');
                                                            return;
                                                        }
                                                        const html = selectedTemplate.templateHtml(formValues);
                                                        setGeneratedDoc({ title: selectedTemplate.title, html, folder: selectedTemplate.category });
                                                        setSmartStep('preview');
                                                    }}
                                                    className="w-full py-3 rounded-xl font-black text-xs text-white transition-all flex items-center justify-center gap-1.5"
                                                    style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.3)}` }}>
                                                    <Eye size={14} /> תצוגה מקדימה והפקה
                                                </motion.button>
                                            </div>
                                        </div>

                                        {/* Live/Static Preview (Left side) */}
                                        <div className="w-1/2 p-6 flex items-center justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.02)' }}>
                                            <div className="w-full max-w-lg bg-white rounded-2xl p-6 h-[90%] overflow-y-auto" style={{ boxShadow: SHADOW.md, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.templateHtml(formValues) }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {smartStep === 'ai' && (
                                    <div className="flex-1 flex overflow-hidden">
                                        <div className="w-1/2 p-6 overflow-y-auto space-y-4 flex flex-col justify-between" style={{ borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div className="space-y-4">
                                                <button onClick={() => setSmartStep('library')} className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">
                                                    <ArrowRight size={12} /> חזרה לבחירת תבנית
                                                </button>
                                                <h4 className="font-black text-[#1D1D1F] text-[15px]">ניסוח מסמך מותאם עם AI</h4>
                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">הנחיות לניסוח המסמך</label>
                                                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                                        placeholder="לדוגמה: מכתב דרישה רשמי לעיריית תל אביב לתשלום חוב על סך 24,000 ש״ח עבור אספקת מחשבים ניידים לבית ספר רוגוזין. ציין כי האיחור בתשלום גורר ריבית פיגורים."
                                                        rows={6}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none transition-all resize-none text-right"
                                                        style={{ border: '1px solid rgba(0,0,0,0.09)' }}
                                                        onFocus={e => e.target.style.border = `1px solid ${VAULT}`}
                                                        onBlur={e => e.target.style.border = '1px solid rgba(0,0,0,0.09)'} />
                                                </div>
                                            </div>

                                            <motion.button whileTap={TAP}
                                                onClick={async () => {
                                                    if (!aiPrompt.trim()) { showToast('נא להזין הנחיות לניסוח המסמך', 'error'); return; }
                                                    setDrafting(true);
                                                    try {
                                                        const res = await fetch('/api/concierge', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                messages: [{ role: 'user', content: aiPrompt }],
                                                                systemPrompt: "אתה עוזר ניסוח מומחה עבור NextClass (פלטפורמת B2B למכירת ציוד ופתרונות למוסדות חינוך). תפקידך לנסח את המסמך המבוקש בעברית רהוטה ורשמית ביותר. החזר אך ורק קוד HTML נקי, תקני ומעוצב יפה (כולל CSS פנימי בסגנון מודרני, נקי ויוקרתי בגווני כחול/סגול, פונט ללא סריף, שוליים, מרווח שורות, כיוון כתיבה RTL ויישור ימין). אל תכתוב שום מלל לפני או אחרי קוד ה-HTML. החזר רק את ה-HTML עצמו."
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        if (data.response) {
                                                            let cleaned = data.response.trim();
                                                            if (cleaned.startsWith('```html')) cleaned = cleaned.slice(7);
                                                            if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
                                                            setGeneratedDoc({ title: 'מסמך AI מותאם', html: cleaned, folder: 'agreements' });
                                                            setSmartStep('preview');
                                                        } else {
                                                            showToast('שגיאה בהפקת המסמך מה-AI', 'error');
                                                        }
                                                    } catch {
                                                        showToast('שגיאה בחיבור לשרת ה-AI', 'error');
                                                    } finally {
                                                        setDrafting(false);
                                                    }
                                                }}
                                                disabled={drafting}
                                                className="w-full py-3.5 rounded-xl font-black text-xs text-white transition-all flex items-center justify-center gap-1.5"
                                                style={{ background: 'linear-gradient(135deg,#FF9500,#FF2D55)', boxShadow: '0 4px 16px rgba(255,149,0,0.3)' }}>
                                                {drafting ? (
                                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> מנסח מסמך בעזרת Gemini...</>
                                                ) : (
                                                    <><Sparkles size={14} /> נסח מסמך בעזרת AI</>
                                                )}
                                            </motion.button>
                                        </div>

                                        <div className="w-1/2 p-6 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
                                            <div className="text-center space-y-2 text-[#AEAEB2]">
                                                <Sparkles size={32} className="mx-auto animate-pulse text-[#FF9500]" />
                                                <p className="font-bold text-sm">הבינה המלאכותית מוכנה לנסח עבורך</p>
                                                <p className="text-[10px] max-w-xs mx-auto">
                                                    הזן תיאור מפורט בימין ולחץ על הכפתור כדי לראות את התצוגה המקדימה של המסמך המיוצר
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {smartStep === 'preview' && generatedDoc && (
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Editor/Saver (Right side) */}
                                        <div className="w-1/3 p-6 overflow-y-auto flex flex-col justify-between" style={{ borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div className="space-y-4">
                                                <button onClick={() => setSmartStep(selectedTemplate ? 'compose' : 'ai')} className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]">
                                                    <ArrowRight size={12} /> חזרה לעריכה
                                                </button>
                                                <h4 className="font-black text-[#1D1D1F] text-[15px]">אשר ושמור מסמך</h4>
                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">שם המסמך בכספת</label>
                                                    <input type="text" value={generatedDoc.title} onChange={e => setGeneratedDoc(prev => ({ ...prev, title: e.target.value }))}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none transition-all text-right font-bold" style={{ border: '1px solid rgba(0,0,0,0.09)' }} />
                                                </div>
                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">תיקיית יעד</label>
                                                    <select value={generatedDoc.folder} onChange={e => setGeneratedDoc(prev => ({ ...prev, folder: e.target.value }))}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white text-sm focus:outline-none transition-all text-right" style={{ border: '1px solid rgba(0,0,0,0.09)' }}>
                                                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <motion.button whileTap={TAP}
                                                    onClick={async () => {
                                                        setDrafting(true);
                                                        try {
                                                            const blob = new Blob([generatedDoc.html], { type: 'text/html' });
                                                            const file = new File([blob], `${generatedDoc.title}.html`, { type: 'text/html' });
                                                            await uploadFileToFirestore(db, 'vault_documents', file, {
                                                                name: file.name,
                                                                type: 'text/html',
                                                                size: file.size,
                                                                folder: generatedDoc.folder,
                                                                classification: 'approved',
                                                                tags: ['מחולל AI'],
                                                                source: 'ai_generator',
                                                            });
                                                            showToast('המסמך הופק ונשמר בכספת בהצלחה', 'success');
                                                            setShowSmartDoc(false);
                                                        } catch {
                                                            showToast('שגיאה בשמירת המסמך בכספת', 'error');
                                                        } finally {
                                                            setDrafting(false);
                                                        }
                                                    }}
                                                    disabled={drafting}
                                                    className="w-full py-3.5 rounded-xl font-black text-xs text-white transition-all flex items-center justify-center gap-1.5"
                                                    style={{ background: 'linear-gradient(135deg,#34C759,#30D158)', boxShadow: '0 4px 16px rgba(52,199,89,0.3)' }}>
                                                    {drafting ? 'שומר קובץ...' : <><CheckCircle size={14} /> אשר ושמור לכספת</>}
                                                </motion.button>
                                                <button onClick={() => {
                                                    const w = window.open('', '_blank');
                                                    w.document.write(generatedDoc.html);
                                                    w.document.close();
                                                    w.focus();
                                                    setTimeout(() => w.print(), 250);
                                                }}
                                                    className="w-full py-3 rounded-xl border text-xs font-bold text-[#1D1D1F] hover:bg-black/02 transition-all flex items-center justify-center gap-1.5"
                                                    style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                                                    <Printer size={13} /> הדפס מסמך / שמור כ-PDF
                                                </button>
                                            </div>
                                        </div>

                                        {/* Document Sheet Preview */}
                                        <div className="w-2/3 p-6 flex items-center justify-center overflow-y-auto" style={{ background: 'rgba(142,142,147,0.1)' }}>
                                            <div className="w-full max-w-2xl bg-white rounded-[20px] p-12 min-h-[90%] overflow-y-auto" style={{ boxShadow: SHADOW.lg, border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <div dangerouslySetInnerHTML={{ __html: generatedDoc.html }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
