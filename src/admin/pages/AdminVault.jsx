/* eslint-disable */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../firebase';
import {
    collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query, updateDoc
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminConfirm } from '../context/AdminConfirmContext';
import { AdminSectionHeader, AdminKPICard, AdminEmpty, AdminTabs } from '../components/AdminComponents';
import DashDrillView from '../components/DashDrillView';
import {
    GLASS, RADIUS, SHADOW, SPRING, TAP, TAP_SOFT, hexA, glow, accentSurface, DOMAIN_ACCENTS
} from '../theme/tokens';
import {
    Upload, Link2, Trash2, Copy, Check, FileText, Folder,
    FolderOpen, FolderPlus, X, Search, Grid, List, ExternalLink, Plus,
    Archive, Download, Eye, Tag, CheckCircle, ShieldAlert, ArrowLeftRight,
    Clock, Edit, ArrowRight, Sparkles, Printer, ChevronDown, HardDrive,
    Image as ImageIcon, FileSpreadsheet, ShieldCheck, Zap, ChevronLeft
} from 'lucide-react';

// ─── Vault accent (restrained brand — azure, de-rainbowed) + liquid-glass surfaces ─
const VAULT  = DOMAIN_ACCENTS.vault; // azure #007AFF
const VGRAD  = 'linear-gradient(135deg,#007AFF,#5856D6)'; // azure → indigo signature
const CARD   = { ...GLASS.base, borderRadius: RADIUS.card };
const PANEL  = { ...GLASS.elevated, borderRadius: RADIUS.panel };

const SYSTEM_FOLDERS = [
    { id: 'agreements', name: 'הסכמי לקוחות', icon: 'file-text', color: '#007AFF', bg: 'rgba(0,122,255,0.08)', system: true },
    { id: 'quotes', name: 'הצעות מחיר', icon: 'file-text', color: '#FF9500', bg: 'rgba(255,149,0,0.08)', system: true },
    { id: 'receipts', name: 'חשבוניות וקבלות', icon: 'archive', color: '#34C759', bg: 'rgba(52,199,89,0.08)', system: true },
    { id: 'suppliers', name: 'הצעות ספקים', icon: 'arrow-left-right', color: '#5856D6', bg: 'rgba(88,86,214,0.08)', system: true },
    { id: 'product_docs', name: 'מסמכי מוצרים', icon: 'folder', color: '#FF2D55', bg: 'rgba(255,45,85,0.08)', system: true },
];

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
                <div style="text-align: center; border-bottom: 2px solid #5856D6; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #5856D6; margin: 0;">NextClass - הסכם אספקה מוסדי</h1>
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
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: #5856D6;">נקסט קלאס בע"מ</p>
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
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function folderIcon(f, size = 14) {
    const color = f.color || '#8E8E93';
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
function VaultDocRow({ item, folders, expanded, onToggle, onUpdate, onDelete, onCopy, copied, onOpenDetail, index }) {
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
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), ...SPRING.soft }}
            style={{
                borderRadius: RADIUS.md,
                background: expanded ? hexA(VAULT, 0.04) : 'rgba(255,255,255,0.55)',
                border: `1px solid ${expanded ? hexA(VAULT, 0.22) : 'rgba(0,0,0,0.05)'}`,
                boxShadow: expanded ? SHADOW.sm : 'none',
            }}
            className="overflow-hidden"
        >
            {/* Header row */}
            <div onClick={() => onToggle(item.id)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer group transition-colors"
                style={{ background: expanded ? 'transparent' : undefined }}>
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
                                <QuickAction icon={Eye} label="תצוגה" color={VAULT} href={item.url} disabled={!item.url} />
                                <QuickAction icon={Download} label="הורדה" color="#007AFF" href={item.url} download disabled={!item.url} />
                                <QuickAction icon={copied === item.url ? Check : Copy} label={copied === item.url ? 'הועתק' : 'העתק קישור'} color="#34C759" onClick={() => onCopy(item.url)} disabled={!item.url} />
                                <QuickAction icon={Edit} label="פרטים מלאים" color="#5856D6" onClick={() => onOpenDetail(item)} />
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
function VaultDocCard({ item, onOpen, onCopy, copied, index }) {
    const kind = fileKind(item);
    const classCfg = CLASSIFICATIONS.find(c => c.id === item.classification) || CLASSIFICATIONS[0];
    return (
        <motion.div
            layout
            onClick={() => onOpen(item)}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: Math.min(index * 0.02, 0.25), ...SPRING.soft }}
            whileHover={{ y: -3, boxShadow: SHADOW.lg }}
            className="p-4 flex flex-col justify-between cursor-pointer group relative text-right overflow-hidden"
            style={{ ...CARD }}
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black"
                        style={{ background: hexA(classCfg.color, 0.14), color: classCfg.color }}>
                        {classCfg.label}
                    </span>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: hexA(kind.color, 0.1), border: `1px solid ${hexA(kind.color, 0.2)}` }}>
                        <kind.Icon size={19} style={{ color: kind.color }} />
                    </div>
                </div>
                <p className="text-[13px] font-black text-[#1D1D1F] line-clamp-2 leading-snug" title={item.name}>{item.name}</p>
                {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                        {item.tags.slice(0, 4).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded font-bold text-[8px]"
                                style={{ background: hexA(VAULT, 0.08), color: hexA(VAULT, 0.9) }}>#{t}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Hover quick actions */}
            <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={item.url || undefined} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: item.url ? hexA(VAULT, 0.1) : 'rgba(0,0,0,0.03)', color: item.url ? VAULT : '#C7C7CC', pointerEvents: item.url ? 'auto' : 'none' }}
                    title="תצוגה"><Eye size={13} /></a>
                <a href={item.url || undefined} download target="_blank" onClick={e => e.stopPropagation()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: item.url ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.03)', color: item.url ? '#007AFF' : '#C7C7CC', pointerEvents: item.url ? 'auto' : 'none' }}
                    title="הורדה"><Download size={13} /></a>
                <button onClick={e => { e.stopPropagation(); if (item.url) onCopy(item.url); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: item.url ? 'rgba(52,199,89,0.1)' : 'rgba(0,0,0,0.03)', color: item.url ? '#34C759' : '#C7C7CC' }}
                    title="העתק קישור">{copied === item.url ? <Check size={13} /> : <Copy size={13} />}</button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 text-[10px] text-[#AEAEB2]" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <span>{formatSize(item.size)}</span>
                <span>{formatDate(item.createdAt)}</span>
            </div>
        </motion.div>
    );
}

// ── Detail Drawer ────────────────────────────────────────────────────────
function DocumentDetailDrawer({ item, folders, onClose, onUpdate, onDelete }) {
    const confirm = useAdminConfirm();
    const [name, setName] = useState(item.name || '');
    const [folder, setFolder] = useState(item.folder || '');
    const [classification, setClassification] = useState(item.classification || 'pending');
    const [tagsInput, setTagsInput] = useState(item.tags?.join(', ') || '');
    const [saving, setSaving] = useState(false);
    const kind = fileKind(item);

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
                        {item.url && (
                            <div className="flex justify-between">
                                <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 font-mono text-[10px] max-w-[200px] truncate" style={{ color: VAULT }}>
                                    <ExternalLink size={10} /> קישור ישיר לשרת
                                </a>
                                <span className="font-bold">קישור הורדה</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-4 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <button onClick={handleSave} disabled={saving}
                        className="w-full py-3.5 rounded-xl font-black text-[13px] text-white flex items-center justify-center gap-2 transition-all"
                        style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.28)}` }}>
                        {saving ? 'שומר שינויים...' : 'שמור עדכונים בכספת'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        {item.url ? (
                            <a href={item.url} target="_blank" download
                                className="py-2.5 rounded-xl border text-[12px] font-bold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-all text-center"
                                style={{ borderColor: 'rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.7)' }}>
                                <Download size={13} /> הורד קובץ
                            </a>
                        ) : (
                            <div className="py-2.5 rounded-xl border text-[12px] font-bold text-[#C7C7CC] flex items-center justify-center gap-1.5 text-center cursor-not-allowed"
                                style={{ borderColor: 'rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)' }}>
                                <Download size={13} /> אין קובץ
                            </div>
                        )}
                        <button onClick={async () => { if (await confirm({ message: 'למחוק מסמך זה לצמיתות מהכספת?', danger: true })) { onDelete(item); onClose(); } }}
                            className="py-2.5 rounded-xl border text-[12px] font-bold text-[#FF3B30] flex items-center justify-center gap-1.5 transition-all text-center"
                            style={{ borderColor: 'rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.05)' }}>
                            <Trash2 size={13} /> מחק מהכספת
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
                        style={{ background: hexA(s.color || '#007AFF', 0.07), border: `1px solid ${hexA(s.color || '#007AFF', 0.16)}` }}>
                        <p className="font-black text-[15px] tracking-tight leading-none truncate" style={{ color: c }}>{s.value}</p>
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

export default function AdminVault() {
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
    const [viewMode, setViewMode] = useState('grid');
    const [copied, setCopied] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

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

    const handleCreateFolder = async (name) => {
        if (!name.trim()) return;
        try {
            await addDoc(collection(db, 'vault_folders'), {
                name: name.trim(),
                color: '#8E8E93',
                bg: 'rgba(142,142,147,0.08)',
                createdAt: serverTimestamp(),
            });
            showToast(`התיקייה "${name}" נוצרה בהצלחה`, 'success');
        } catch {
            showToast('שגיאה ביצירת התיקייה', 'error');
        }
    };

    const handleRenameFolder = async (id, newName) => {
        if (!newName.trim()) return;
        try {
            await updateDoc(doc(db, 'vault_folders', id), { name: newName.trim() });
            showToast('שם התיקייה עודכן', 'success');
        } catch {
            showToast('שגיאה בעדכון שם התיקייה', 'error');
        }
    };

    const handleDeleteFolder = async (folder) => {
        if (folder.system) return;
        try {
            // Find docs inside this folder and move them to 'agreements'
            const docsToMove = documents.filter(d => d.folder === folder.id);
            await Promise.all(docsToMove.map(d =>
                updateDoc(doc(db, 'vault_documents', d.id), { folder: 'agreements' })
            ));
            await deleteDoc(doc(db, 'vault_folders', folder.id));
            if (activeFolder === folder.id) {
                setActiveFolder('agreements');
            }
            showToast(`התיקייה "${folder.name}" נמחקה · המסמכים הועברו להסכמי לקוחות`, 'success');
        } catch {
            showToast('שגיאה במחיקת התיקייה', 'error');
        }
    };

    const handleFiles = async (files) => {
        setUploading(true);
        const progress = {};
        files.forEach(f => { progress[f.name] = 0; });
        setUploadProgress(progress);

        try {
            await Promise.all(files.map(async (file) => {
                const path = `vault/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
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
                            await addDoc(collection(db, 'vault_documents'), {
                                url,
                                name: file.name,
                                type: file.type || 'application/octet-stream',
                                size: file.size,
                                path,
                                folder: activeFolder,
                                classification: 'pending',
                                tags: [],
                                source: 'upload',
                                createdAt: serverTimestamp(),
                            });
                            resolve();
                        }
                    );
                });
            }));
            showToast(`${files.length} מסמכים הועלו בהצלחה לכספת`, 'success');
        } catch (err) {
            showToast('שגיאה בהעלאת מסמכים', 'error');
        }
        setUploading(false);
        setUploadProgress({});
    };

    const handleUpdateDoc = async (id, data) => {
        try {
            await updateDoc(doc(db, 'vault_documents', id), data);
            showToast('המסמך עודכן בהצלחה', 'success');
        } catch {
            showToast('שגיאה בעדכון המסמך', 'error');
        }
    };

    const handleDeleteDoc = async (item) => {
        try {
            await deleteDoc(doc(db, 'vault_documents', item.id));
            if (item.path) {
                try { await deleteObject(storageRef(storage, item.path)); } catch {}
            }
            showToast('המסמך נמחק מהכספת', 'success');
        } catch {
            showToast('שגיאה במחיקת המסמך', 'error');
        }
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

    // Docs in the active folder (before classification/type/search) — feeds type pills
    const folderDocs = documents.filter(d => d.folder === activeFolder);
    const availableKinds = Array.from(new Set(folderDocs.map(d => fileKind(d).key)));

    // Filters logic
    const filteredDocs = folderDocs.filter(docItem => {
        if (classificationFilter !== 'all' && docItem.classification !== classificationFilter) return false;
        if (typeFilter !== 'all' && fileKind(docItem).key !== typeFilter) return false;
        if (search) {
            const term = search.toLowerCase();
            const matchName = docItem.name?.toLowerCase().includes(term);
            const matchTag = docItem.tags?.some(t => t.toLowerCase().includes(term));
            return matchName || matchTag;
        }
        return true;
    });

    const folderStats = folders.map(folder => {
        const fDocs = documents.filter(d => d.folder === folder.id);
        return { ...folder, count: fDocs.length, size: fDocs.reduce((acc, d) => acc + (d.size || 0), 0) };
    });

    // KPI aggregates
    const totalVaultSize = documents.reduce((acc, d) => acc + (d.size || 0), 0);
    const vaultQuota = 100 * 1024 * 1024; // 100 MB free tier quota
    const quotaPct = Math.min(100, (totalVaultSize / vaultQuota) * 100);
    const approvedCount = documents.filter(d => d.classification === 'approved').length;
    const pendingCount = documents.filter(d => d.classification === 'pending').length;
    const archivedCount = documents.filter(d => d.classification === 'archived').length;
    const recentCount = documents.filter(d => {
        const t = d.createdAt?.toDate ? d.createdAt.toDate().getTime() : 0;
        return t && (Date.now() - t) < 7 * 86400000;
    }).length;

    const activeFolderObj = folders.find(f => f.id === activeFolder);

    // Folder-state tabs — filter the document grid by review state (reuses classificationFilter)
    const vaultStateTabs = [
        { id: 'all',      label: 'הכל',          count: folderDocs.length },
        { id: 'pending',  label: 'ממתין לבדיקה', count: folderDocs.filter(d => d.classification === 'pending').length },
        { id: 'approved', label: 'מאושר',        count: folderDocs.filter(d => d.classification === 'approved').length },
        { id: 'archived', label: 'דורש סיווג',   count: folderDocs.filter(d => d.classification === 'archived').length },
    ];

    return (
        <div dir="rtl" className="space-y-6 font-sans">
            <AdminSectionHeader
                title="כספת מסמכים דיגיטלית"
                subtitle="ניהול מאובטח וסיווג חכם של כל הסכמי הלקוחות, הצעות המחיר ומסמכי הספקים של NextClass"
                action={
                    <motion.button
                        onClick={openSmartDoc}
                        whileHover={{ y: -1, boxShadow: `0 8px 26px ${hexA(VAULT, 0.45)}` }}
                        whileTap={TAP}
                        className="px-4 py-2.5 rounded-xl font-black text-xs text-white flex items-center gap-1.5"
                        style={{ background: VGRAD, boxShadow: `0 4px 16px ${hexA(VAULT, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.25)` }}
                    >
                        <Sparkles size={14} />
                        מחולל מסמכים חכם AI
                    </motion.button>
                }
            />

            {/* KPI band */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <AdminKPICard title="סה״כ מסמכים" value={documents.length}
                    subtitle={recentCount > 0 ? `${recentCount} הועלו השבוע` : 'כספת מאובטחת'}
                    icon={<FolderOpen size={20} color={VAULT} />} accent={VAULT} loading={loading} error={error} delay={0}
                    onClick={documents.length ? () => openDrill({ type: 'docs', scope: 'all' }) : undefined} />
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
                                    <p className="text-[26px] font-black tracking-tighter leading-none text-[#1D1D1F]">{formatSize(totalVaultSize)}</p>
                                </div>
                                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.2)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
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

            {/* Security assurances strip */}
            <div className="flex items-center gap-4 flex-wrap px-5 py-3 rounded-[18px]" style={{ ...GLASS.frosted, borderRadius: RADIUS.md }}>
                {[
                    { Icon: ShieldCheck, label: 'הצפנת קצה-אל-קצה מופעלת', color: '#34C759' },
                    { Icon: FolderOpen, label: 'סיווג אוטומטי זמין', color: VAULT },
                    { Icon: Zap, label: 'סנכרון Firestore בזמן אמת', color: VAULT },
                ].map(({ Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 text-[11px] font-bold text-[#6E6E73]">
                        <Icon size={13} style={{ color }} />{label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Folders list */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mr-1 mb-2">
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest uppercase">תיקיות כספת</p>
                        <motion.button whileTap={TAP}
                            onClick={() => { const name = prompt('הזן שם עבור התיקייה החדשה:'); if (name) handleCreateFolder(name); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: hexA(VAULT, 0.1), color: VAULT }}
                            title="יצירת תיקייה חדשה">
                            <FolderPlus size={14} />
                        </motion.button>
                    </div>
                    <div className="space-y-1.5">
                        {folderStats.map(f => {
                            const active = activeFolder === f.id;
                            return (
                                <motion.div key={f.id} layout
                                    className="w-full text-right flex items-center justify-between transition-all group relative overflow-hidden"
                                    style={{
                                        borderRadius: RADIUS.md,
                                        background: active ? hexA(VAULT, 0.1) : 'rgba(255,255,255,0.6)',
                                        border: `1px solid ${active ? hexA(VAULT, 0.24) : 'rgba(0,0,0,0.05)'}`,
                                        boxShadow: active ? SHADOW.sm : 'none',
                                    }}>
                                    <button onClick={() => { setActiveFolder(f.id); setClassificationFilter('all'); setTypeFilter('all'); setExpandedId(null); }}
                                        className="flex-1 p-3 text-right flex items-center gap-3"
                                        style={{ color: active ? VAULT : '#1D1D1F' }}>
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: active ? hexA(VAULT, 0.18) : (f.bg || 'rgba(0,0,0,0.03)') }}>
                                            {folderIcon(active ? { ...f, color: VAULT } : f)}
                                        </div>
                                        <div className="text-right min-w-0">
                                            <p className="text-[12.5px] font-black truncate">{f.name}</p>
                                            <p className="text-[9px] text-[#8E8E93] font-mono mt-0.5">{formatSize(f.size)}</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-2 pl-3">
                                        {!f.system && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); const newName = prompt('עדכן שם תיקייה:', f.name); if (newName) handleRenameFolder(f.id, newName); }}
                                                    className="p-1 text-[#8E8E93] hover:text-[#007AFF]" title="ערוך שם"><Edit size={12} /></button>
                                                <button onClick={async (e) => { e.stopPropagation(); if (await confirm({ title: `למחוק את התיקייה "${f.name}"?`, message: 'כל המסמכים בה יועברו ל"הסכמי לקוחות".', danger: true })) handleDeleteFolder(f); }}
                                                    className="p-1 text-[#8E8E93] hover:text-red-500" title="מחק תיקייה"><Trash2 size={12} /></button>
                                            </div>
                                        )}
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 select-none"
                                            style={{ background: active ? VAULT : 'rgba(0,0,0,0.06)', color: active ? 'white' : '#8E8E93' }}>
                                            {f.count}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Vault Explorer */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Upload drop zone */}
                    <DropZone onFiles={handleFiles} uploading={uploading} />

                    {/* Upload progress bars */}
                    <AnimatePresence>
                        {Object.entries(uploadProgress).map(([name, pct]) => (
                            <motion.div key={name}
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="p-4" style={{ ...CARD }}>
                                <div className="flex items-center justify-between mb-2 text-[12px] font-black">
                                    <span style={{ color: VAULT }}>{pct}%</span>
                                    <span className="text-[#86868B] truncate max-w-[250px]">{name}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                                    <motion.div animate={{ width: `${pct}%` }} className="h-full rounded-full" style={{ background: VGRAD }} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2] pointer-events-none" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="חיפוש קובץ או תגית בכספת..."
                                className="w-full pr-10 pl-4 py-2.5 rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderRadius: 13 }}
                                onFocus={e => { e.target.style.border = `1px solid ${hexA(VAULT, 0.5)}`; e.target.style.boxShadow = `0 0 0 4px ${hexA(VAULT, 0.1)}`; }}
                                onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.7)'; e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }} />
                        </div>

                        {/* View switcher */}
                        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.05)' }}>
                            {[{ id: 'grid', Icon: Grid }, { id: 'list', Icon: List }].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id)} className="p-1.5 rounded-lg transition-all"
                                    style={{ background: viewMode === v.id ? 'white' : 'transparent', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                    <v.Icon size={14} style={{ color: viewMode === v.id ? VAULT : '#AEAEB2' }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type filter pills (only when multiple kinds present) */}
                    {availableKinds.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {['all', ...availableKinds].map(k => {
                                const active = typeFilter === k;
                                return (
                                    <motion.button key={k} onClick={() => setTypeFilter(k)} whileTap={TAP_SOFT}
                                        className="px-3 py-1.5 rounded-full text-[10.5px] font-black transition-all"
                                        style={{
                                            background: active ? hexA(VAULT, 0.12) : 'rgba(255,255,255,0.6)',
                                            border: `1px solid ${active ? hexA(VAULT, 0.3) : 'rgba(0,0,0,0.06)'}`,
                                            color: active ? VAULT : '#86868B',
                                        }}>
                                        {KIND_LABELS[k] || k}
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}

                    {/* Folder-state tabs — filter grid so it isn't one long scroll */}
                    <div className="flex items-center justify-end">
                        <AdminTabs tabs={vaultStateTabs} active={classificationFilter} onChange={setClassificationFilter} id="vault-state-tabs" />
                    </div>

                    {/* Files display */}
                    {loading ? (
                        <div className="py-20 text-center rounded-[24px]" style={{ ...CARD }}>
                            <div className="w-9 h-9 rounded-full animate-spin mx-auto mb-3" style={{ border: `2px solid ${hexA(VAULT, 0.25)}`, borderTopColor: VAULT }} />
                            <p className="text-[#AEAEB2] font-bold text-sm">פותח כספת מאובטחת...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-[24px] overflow-hidden" style={{ ...CARD }}>
                            <AdminEmpty icon="alert" title={error} subtitle="נסה לרענן את הדף או לנסות שוב מאוחר יותר" />
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="rounded-[24px] overflow-hidden" style={{ ...CARD }}>
                            <AdminEmpty
                                icon={<Folder size={30} style={{ color: VAULT }} />}
                                title={search || classificationFilter !== 'all' || typeFilter !== 'all' ? 'לא נמצאו מסמכים תואמים' : `התיקייה "${activeFolderObj?.name || ''}" ריקה`}
                                subtitle="גרור קבצים לתיבת ההעלאה למעלה, או הפק מסמך חדש עם המחולל החכם"
                                action={{ label: 'מחולל מסמכים חכם AI', onClick: openSmartDoc }}
                            />
                        </div>
                    ) : viewMode === 'grid' ? (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredDocs.map((docItem, i) => (
                                    <VaultDocCard key={docItem.id} item={docItem} index={i}
                                        onOpen={setSelectedDoc} onCopy={handleCopy} copied={copied} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <motion.div layout className="space-y-2">
                            <AnimatePresence>
                                {filteredDocs.map((docItem, i) => (
                                    <VaultDocRow key={docItem.id} item={docItem} index={i} folders={folders}
                                        expanded={expandedId === docItem.id}
                                        onToggle={id => setExpandedId(prev => prev === id ? null : id)}
                                        onUpdate={handleUpdateDoc} onDelete={handleDeleteDoc}
                                        onCopy={handleCopy} copied={copied} onOpenDetail={setSelectedDoc} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
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
                    />
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
                                { label: 'תיקיות', value: folderStats.filter(f => f.count > 0).length, color: '#5856D6' },
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
                                    { label: 'תיקייה', value: folderName(d.folder), color: '#5856D6' },
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
                                                            const path = `vault/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                                                            const sRef = storageRef(storage, path);
                                                            const task = uploadBytesResumable(sRef, file);

                                                            await new Promise((resolve, reject) => {
                                                                task.on('state_changed', null, reject, async () => {
                                                                    const url = await getDownloadURL(task.snapshot.ref);
                                                                    await addDoc(collection(db, 'vault_documents'), {
                                                                        url,
                                                                        name: file.name,
                                                                        type: 'text/html',
                                                                        size: file.size,
                                                                        path,
                                                                        folder: generatedDoc.folder,
                                                                        classification: 'approved',
                                                                        tags: ['מחולל AI'],
                                                                        source: 'ai_generator',
                                                                        createdAt: serverTimestamp(),
                                                                    });
                                                                    resolve();
                                                                });
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
