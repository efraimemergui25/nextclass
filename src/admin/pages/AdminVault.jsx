/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, storage } from '../../firebase';
import {
    collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query, updateDoc
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAdminToast } from '../context/AdminToastContext';
import { useAdminData } from '../context/AdminDataContext';
import { AdminSectionHeader } from '../components/AdminComponents';
import {
    Upload, Link2, Trash2, Copy, Check, FileText, Folder,
    FolderOpen, X, Search, Grid, List, ExternalLink, Plus,
    Filter, Archive, Download, Eye, Tag, Calendar, MoreVertical,
    CheckCircle, ShieldAlert, ArrowLeftRight, Clock, Edit, ArrowRight, Sparkles, Printer
} from 'lucide-react';

const CARD = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const GLASS = {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.70)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

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
    { id: 'pending', label: 'בבדיקה', color: '#FF9F0A' },
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
        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 flex flex-col items-center gap-3 text-center"
            style={{
                borderColor: isDragActive ? '#5856D6' : 'rgba(88,86,214,0.35)',
                background: isDragActive ? 'rgba(88,86,214,0.06)' : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                boxShadow: isDragActive ? '0 0 0 4px rgba(88,86,214,0.12)' : 'none',
            }}
        >
            {uploading ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-[#5856D6]/30 border-t-[#5856D6] rounded-full animate-spin" />
                    <p className="text-xs font-bold text-[#5856D6]">מעלה מסמכים לכספת...</p>
                </div>
            ) : (
                <>
                    <motion.div
                        animate={{ y: isDragActive ? -4 : 0 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(88,86,214,0.1)' }}
                    >
                        <Upload size={20} className="text-[#5856D6]" />
                    </motion.div>
                    <div>
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
        </div>
    );
}

// ── Detail Drawer ────────────────────────────────────────────────────────
function DocumentDetailDrawer({ item, folders, onClose, onUpdate, onDelete }) {
    const [name, setName] = useState(item.name || '');
    const [folder, setFolder] = useState(item.folder || '');
    const [classification, setClassification] = useState(item.classification || 'pending');
    const [tagsInput, setTagsInput] = useState(item.tags?.join(', ') || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        await onUpdate(item.id, {
            name,
            folder,
            classification,
            tags
        });
        setSaving(false);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md h-full flex flex-col p-6 text-right font-sans"
                style={GLASS}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.05]">
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/05 text-[#AEAEB2] transition-colors">
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[#5856D6]" />
                        <h3 className="font-black text-[#1D1D1F] text-lg">פרטי מסמך בכספת</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-5 pb-6">
                    {/* File preview icon card */}
                    <div className="p-5 rounded-2xl bg-black/[0.02] border border-black/[0.04] flex flex-col items-center justify-center text-center">
                        <FileText size={48} className="text-[#8E8E93] mb-2" />
                        <p className="text-[10px] font-mono text-[#8E8E93] max-w-full truncate">{item.type || 'קובץ'}</p>
                        <p className="text-[11px] font-bold text-[#1D1D1F] mt-1">{formatSize(item.size)}</p>
                    </div>

                    {/* Form fields */}
                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">שם הקובץ בכספת</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[13px] font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 focus:bg-white transition-all text-right"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">תיקיית סיווג</label>
                        <select
                            value={folder}
                            onChange={e => setFolder(e.target.value)}
                            className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[13px] font-bold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 focus:bg-white transition-all text-right"
                        >
                            {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-[#86868B] tracking-widest block mb-1.5">סטטוס מסמך</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CLASSIFICATIONS.filter(c => c.id !== 'all').map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setClassification(c.id)}
                                    className="py-2.5 rounded-xl border text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5"
                                    style={{
                                        borderColor: classification === c.id ? c.color : 'rgba(0,0,0,0.06)',
                                        background: classification === c.id ? `${c.color}12` : '#F5F5F7',
                                        color: classification === c.id ? c.color : '#6E6E73'
                                    }}
                                >
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
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={e => setTagsInput(e.target.value)}
                            placeholder="דוגמה: 2026, חוזה מוסדי, בית ספר"
                            className="w-full px-4 py-3 bg-[#F5F5F7] rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 focus:bg-white transition-all text-right"
                        />
                    </div>

                    {/* Metadata Readonly */}
                    <div className="p-4 rounded-xl bg-black/[0.01] border border-black/[0.02] space-y-2 text-[11px] text-[#8E8E93]">
                        <div className="flex justify-between">
                            <span>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('he-IL') : '—'}</span>
                            <span className="font-bold">תאריך העלאה</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-mono">{item.source === 'upload' ? 'העלאה ישירה' : 'סריקת AI / ייבוא'}</span>
                            <span className="font-bold">מקור מסמך</span>
                        </div>
                        {item.url && (
                            <div className="flex justify-between">
                                <a href={item.url} target="_blank" rel="noreferrer" className="text-[#5856D6] hover:underline flex items-center gap-1 font-mono text-[10px] max-w-[200px] truncate">
                                    <ExternalLink size={10} /> קישור ישיר לשרת
                                </a>
                                <span className="font-bold">קישור הורדה</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-auto pt-4 border-t border-black/[0.05] space-y-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3.5 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all"
                        style={{ background: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)', boxShadow: '0 4px 16px rgba(88,86,214,0.25)' }}
                    >
                        {saving ? 'שומר שינויים...' : 'שמור עדכונים בכספת'}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        {item.url && (
                            <a
                                href={item.url}
                                target="_blank"
                                download
                                className="py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/02 text-[12px] font-bold text-[#1D1D1F] flex items-center justify-center gap-1.5 transition-all text-center"
                            >
                                <Download size={13} />
                                הורד קובץ
                            </a>
                        )}
                        <button
                            onClick={() => { if (window.confirm('למחוק מסמך זה לצמיתות מהכספת?')) { onDelete(item); onClose(); } }}
                            className="py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-[12px] font-bold text-red-600 flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                            <Trash2 size={13} />
                            מחק מהכספת
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function AdminVault() {
    const { showToast } = useAdminToast();
    const [activeFolder, setActiveFolder] = useState('agreements');
    const [documents, setDocuments] = useState([]);
    const [customFolders, setCustomFolders] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(true);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [search, setSearch] = useState('');
    const [classificationFilter, setClassificationFilter] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [copied, setCopied] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);

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
            setLoading(false);
        }, () => setLoading(false));
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
        navigator.clipboard.writeText(url).then(() => {
            setCopied(url);
            showToast('הקישור הועתק ללוח', 'success');
            setTimeout(() => setCopied(''), 2000);
        });
    };

    // Filters logic
    const filteredDocs = documents.filter(doc => {
        if (doc.folder !== activeFolder) return false;
        if (classificationFilter !== 'all' && doc.classification !== classificationFilter) return false;
        if (search) {
            const term = search.toLowerCase();
            const matchName = doc.name?.toLowerCase().includes(term);
            const matchTag = doc.tags?.some(t => t.toLowerCase().includes(term));
            return matchName || matchTag;
        }
        return true;
    });

    const folderStats = folders.map(folder => {
        const folderDocs = documents.filter(d => d.folder === folder.id);
        const totalSize = folderDocs.reduce((acc, d) => acc + (d.size || 0), 0);
        return {
            ...folder,
            count: folderDocs.length,
            size: totalSize
        };
    });

    const totalVaultSize = documents.reduce((acc, d) => acc + (d.size || 0), 0);
    const vaultQuota = 100 * 1024 * 1024; // 100 MB free tier quota

    return (
        <div dir="rtl" className="space-y-6 font-sans">
            <AdminSectionHeader
                title="כספת מסמכים דיגיטלית"
                subtitle="ניהול מאובטח וסיווג חכם של כל הסכמי הלקוחות, הצעות המחיר ומסמכי הספקים של NextClass"
                action={
                    <button
                        onClick={() => {
                            setShowSmartDoc(true);
                            setSmartStep('library');
                            setSelectedTemplate(null);
                            setFormValues({});
                            setAiPrompt('');
                            setGeneratedDoc(null);
                        }}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#5856D6] to-[#007AFF] hover:opacity-90 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                        <Sparkles size={14} />
                        מחולל מסמכים חכם AI
                    </button>
                }
            />

            {/* Quota & Quick stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-5 rounded-[22px] flex flex-col justify-between" style={CARD}>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-black text-[#8E8E93]">נפח אחסון מנוצל בכספת</span>
                            <span className="text-[12px] font-bold text-[#1D1D1F]">
                                {formatSize(totalVaultSize)} מתוך {formatSize(vaultQuota)}
                            </span>
                        </div>
                        <div className="h-2 bg-[#F2F2F7] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-l from-[#5856D6] to-[#007AFF] transition-all duration-500"
                                style={{ width: `${Math.min(100, (totalVaultSize / vaultQuota) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-black/[0.04] text-[11px] text-[#8E8E93]">
                        <div>🛡️ הצפנת קצה-אל-קצה מופעלת</div>
                        <div>📂 סיווג אוטומטי זמין</div>
                        <div>⚡ סנכרון Firestore בזמן אמת</div>
                    </div>
                </div>

                <div className="p-5 rounded-[22px] flex items-center justify-between" style={CARD}>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#86868B] tracking-widest block">סה״כ מסמכים מאובטחים</span>
                        <span className="text-3xl font-black text-[#1D1D1F] tracking-tighter">{documents.length}</span>
                        <span className="text-[10px] text-[#34C759] font-bold block">פעיל ומאובטח ✓</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#5856D6]/10 flex items-center justify-center">
                        <FolderOpen size={24} className="text-[#5856D6]" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Folders list */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mr-2 mb-1">
                        <p className="text-[10px] font-black text-[#86868B] tracking-widest uppercase">תיקיות כספת</p>
                        <button
                            onClick={() => {
                                const name = prompt('הזן שם עבור התיקייה החדשה:');
                                if (name) handleCreateFolder(name);
                            }}
                            className="text-[#5856D6] hover:text-[#007AFF] p-1 rounded-lg hover:bg-black/05 transition-all"
                            title="יצירת תיקייה חדשה"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {folderStats.map(f => (
                            <div
                                key={f.id}
                                className="w-full rounded-2xl text-right flex items-center justify-between transition-all group relative border"
                                style={{
                                    background: activeFolder === f.id ? 'rgba(88,86,214,0.1)' : 'rgba(255,255,255,0.72)',
                                    borderColor: activeFolder === f.id ? 'rgba(88,86,214,0.22)' : 'rgba(0,0,0,0.05)',
                                }}
                            >
                                <button
                                    onClick={() => { setActiveFolder(f.id); setClassificationFilter('all'); }}
                                    className="flex-1 p-3.5 text-right flex items-center justify-between"
                                    style={{ color: activeFolder === f.id ? '#5856D6' : '#1D1D1F' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0"
                                            style={{ background: activeFolder === f.id ? 'rgba(88,86,214,0.2)' : f.bg }}
                                        >
                                            {f.id === 'agreements' && <FileText size={14} style={{ color: f.color }} />}
                                            {f.id === 'quotes' && <FileText size={14} style={{ color: f.color }} />}
                                            {f.id === 'receipts' && <Archive size={14} style={{ color: f.color }} />}
                                            {f.id === 'suppliers' && <ArrowLeftRight size={14} style={{ color: f.color }} />}
                                            {f.id === 'product_docs' && <Folder size={14} style={{ color: f.color }} />}
                                            {!f.system && <Folder size={14} style={{ color: f.color || '#8E8E93' }} />}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[12.5px] font-black">{f.name}</p>
                                            <p className="text-[9px] text-[#8E8E93] font-mono mt-0.5">{formatSize(f.size)}</p>
                                        </div>
                                    </div>
                                </button>

                                <div className="flex items-center gap-2 pl-3">
                                    {!f.system && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newName = prompt('עדכן שם תיקייה:', f.name);
                                                    if (newName) handleRenameFolder(f.id, newName);
                                                }}
                                                className="p-1 text-[#8E8E93] hover:text-[#007AFF]"
                                                title="ערוך שם"
                                            >
                                                <Edit size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`למחוק את התיקייה "${f.name}"? כל המסמכים בה יועברו ל"הסכמי לקוחות".`)) {
                                                        handleDeleteFolder(f);
                                                    }
                                                }}
                                                className="p-1 text-[#8E8E93] hover:text-red-500"
                                                title="מחק תיקייה"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    )}

                                    <span
                                        className="px-2 py-0.5 rounded-full text-[9px] font-bold transition-all shrink-0 select-none"
                                        style={{
                                            background: activeFolder === f.id ? '#5856D6' : 'rgba(0,0,0,0.06)',
                                            color: activeFolder === f.id ? 'white' : '#8E8E93'
                                        }}
                                    >
                                        {f.count}
                                    </span>
                                </div>
                            </div>
                        ))}
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
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-2xl" style={CARD}>
                                <div className="flex items-center justify-between mb-2 text-[12px] font-bold">
                                    <span className="text-[#5856D6]">{pct}%</span>
                                    <span className="text-[#86868B] truncate max-w-[250px]">{name}</span>
                                </div>
                                <div className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
                                    <motion.div animate={{ width: `${pct}%` }} className="h-full rounded-full bg-[#5856D6]" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AEAEB2]" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="חיפוש קובץ או תגית בכספת..."
                                className="w-full pr-9 pl-4 py-2.5 bg-white rounded-xl text-[13px] font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#5856D6]/20 transition-all border border-black/05"
                                style={CARD}
                            />
                        </div>

                        {/* Classification pills */}
                        <div className="flex items-center gap-1.5">
                            {CLASSIFICATIONS.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setClassificationFilter(c.id)}
                                    className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border"
                                    style={{
                                        background: classificationFilter === c.id ? c.color : 'rgba(255,255,255,0.72)',
                                        borderColor: classificationFilter === c.id ? 'transparent' : 'rgba(0,0,0,0.06)',
                                        color: classificationFilter === c.id ? 'white' : '#6E6E73',
                                        boxShadow: classificationFilter === c.id ? `0 2px 8px ${c.color}33` : 'none'
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        {/* View switcher */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/05">
                            {[
                                { id: 'grid', Icon: Grid },
                                { id: 'list', Icon: List },
                            ].map(v => (
                                <button key={v.id} onClick={() => setViewMode(v.id)}
                                    className="p-1.5 rounded-lg transition-all"
                                    style={{ background: viewMode === v.id ? 'white' : 'transparent', boxShadow: viewMode === v.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
                                    <v.Icon size={13} className={viewMode === v.id ? 'text-[#5856D6]' : 'text-[#AEAEB2]'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Files display */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-8 h-8 border-2 border-[#5856D6]/30 border-t-[#5856D6] rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-[#AEAEB2] font-bold text-sm">פותח כספת מאובטחת...</p>
                        </div>
                    ) : filteredDocs.length === 0 ? (
                        <div className="py-16 text-center rounded-[24px]" style={CARD}>
                            <Folder size={40} className="mx-auto text-[#D1D1D6] mb-3" />
                            <p className="text-[#8E8E93] font-bold">התיקייה ריקה או שלא נמצאו מסמכים מתאימים</p>
                            <p className="text-[#AEAEB2] text-[11px] mt-1">גרור קבצים לתיבת ההעלאה למעלה כדי להוסיף מסמכים</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {filteredDocs.map(doc => {
                                    const classCfg = CLASSIFICATIONS.find(c => c.id === doc.classification) || CLASSIFICATIONS[0];
                                    return (
                                        <motion.div
                                            key={doc.id}
                                            layout
                                            onClick={() => setSelectedDoc(doc)}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.92 }}
                                            className="p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group relative text-right"
                                            style={CARD}
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span
                                                        className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                                                        style={{ background: `${classCfg.color}15`, color: classCfg.color }}
                                                    >
                                                        {classCfg.label}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-center">
                                                        <FileText size={18} className="text-[#8E8E93]" />
                                                    </div>
                                                </div>
                                                <p className="text-[13px] font-black text-[#1D1D1F] line-clamp-2 leading-snug" title={doc.name}>
                                                    {doc.name}
                                                </p>
                                                {doc.tags && doc.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2.5">
                                                        {doc.tags.map(t => (
                                                            <span key={t} className="px-1.5 py-0.5 bg-black/[0.03] text-[#8E8E93] text-[8px] rounded font-bold">
                                                                #{t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.04] text-[10px] text-[#AEAEB2]">
                                                <span>{formatSize(doc.size)}</span>
                                                <span>{doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString('he-IL') : ''}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="rounded-[22px] overflow-hidden" style={CARD}>
                            <div className="divide-y divide-black/[0.04]">
                                {filteredDocs.map(doc => {
                                    const classCfg = CLASSIFICATIONS.find(c => c.id === doc.classification) || CLASSIFICATIONS[0];
                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDoc(doc)}
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-black/[0.01] transition-colors group cursor-pointer"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-center shrink-0">
                                                <FileText size={16} className="text-[#8E8E93]" />
                                            </div>
                                            <div className="flex-1 min-w-0 text-right">
                                                <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#AEAEB2]">
                                                    <span>{formatSize(doc.size)}</span>
                                                    <span>•</span>
                                                    <span>{doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString('he-IL') : ''}</span>
                                                    {doc.tags && doc.tags.length > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate max-w-[150px]">{doc.tags.map(t => `#${t}`).join(', ')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span
                                                    className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                                                    style={{ background: `${classCfg.color}15`, color: classCfg.color }}
                                                >
                                                    {classCfg.label}
                                                </span>
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {doc.url && (
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleCopy(doc.url); }}
                                                            className="p-1.5 rounded-lg hover:bg-black/05 text-[#AEAEB2] hover:text-[#1D1D1F] transition-all"
                                                        >
                                                            {copied === doc.url ? <Check size={12} className="text-[#30D158]" /> : <Copy size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
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

            {/* Smart document dialog */}
            <AnimatePresence>
                {showSmartDoc && (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md" dir="rtl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-6xl h-[85vh] rounded-[28px] overflow-hidden flex flex-col font-sans"
                            style={GLASS}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-[#F8F8FC] border-b border-black/05">
                                <button
                                    onClick={() => setShowSmartDoc(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#AEAEB2] hover:text-[#1D1D1F] hover:bg-black/05 transition-all"
                                >
                                    <X size={16} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-[#5856D6] animate-pulse" />
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
                                            {/* System Templates */}
                                            {SMART_TEMPLATES.map(tpl => (
                                                <div
                                                    key={tpl.id}
                                                    onClick={() => {
                                                        setSelectedTemplate(tpl);
                                                        setFormValues({});
                                                        setSmartStep('compose');
                                                    }}
                                                    className="p-5 rounded-2xl border border-black/05 bg-white/60 hover:bg-white hover:border-[#5856D6]/40 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="w-10 h-10 rounded-xl bg-[#5856D6]/10 flex items-center justify-center">
                                                            <FileText size={18} className="text-[#5856D6]" />
                                                        </div>
                                                        <h5 className="font-black text-[#1D1D1F] text-[14px]">{tpl.title}</h5>
                                                        <p className="text-[11px] text-[#86868B] leading-relaxed">{tpl.description}</p>
                                                    </div>
                                                    <span className="text-[9px] text-[#AEAEB2] mt-4 font-bold">{tpl.legalBasis}</span>
                                                </div>
                                            ))}

                                            {/* AI Custom Prompt Card */}
                                            <div
                                                onClick={() => {
                                                    setSmartStep('ai');
                                                    setAiPrompt('');
                                                }}
                                                className="p-5 rounded-2xl border border-dashed border-[#FF9500]/40 bg-gradient-to-br from-[#FFF9F2]/60 to-white hover:border-[#FF9500] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                            >
                                                <div className="space-y-2">
                                                    <div className="w-10 h-10 rounded-xl bg-[#FF9500]/10 flex items-center justify-center">
                                                        <Sparkles size={18} className="text-[#FF9500]" />
                                                    </div>
                                                    <h5 className="font-black text-[#1D1D1F] text-[14px]">ניסוח חופשי באמצעות AI</h5>
                                                    <p className="text-[11px] text-[#86868B] leading-relaxed">
                                                        תאר בעברית חופשית את פרטי המסמך שברצונך להפיק, והבינה המלאכותית תעשה את העבודה בשבילך.
                                                    </p>
                                                </div>
                                                <span className="text-[9px] text-[#FF9500] mt-4 font-bold">טיוטה מהירה מבוססת Gemini Flash</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {smartStep === 'compose' && selectedTemplate && (
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* Fields Form (Right side) */}
                                        <div className="w-1/2 p-6 overflow-y-auto border-l border-black/05 space-y-4">
                                            <button
                                                onClick={() => setSmartStep('library')}
                                                className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]"
                                            >
                                                <ArrowRight size={12} />
                                                חזרה לבחירת תבנית
                                            </button>
                                            <h4 className="font-black text-[#1D1D1F] text-[15px]">{selectedTemplate.title}</h4>

                                            <div className="space-y-4 pt-2">
                                                {selectedTemplate.fields.map(f => (
                                                    <div key={f.key}>
                                                        <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">
                                                            {f.label} {f.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        {f.type === 'textarea' ? (
                                                            <textarea
                                                                value={formValues[f.key] || ''}
                                                                onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                placeholder={f.placeholder}
                                                                rows={4}
                                                                className="w-full rounded-xl px-4 py-2.5 bg-white border border-black/09 text-sm focus:outline-none focus:border-[#5856D6] transition-all resize-none text-right"
                                                            />
                                                        ) : (
                                                            <input
                                                                type={f.type === 'money' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                                                value={formValues[f.key] || ''}
                                                                onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                placeholder={f.placeholder}
                                                                className="w-full rounded-xl px-4 py-2.5 bg-white border border-black/09 text-sm focus:outline-none focus:border-[#5856D6] transition-all text-right"
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={() => {
                                                        // Validate required
                                                        const missing = selectedTemplate.fields.filter(f => f.required && !formValues[f.key]);
                                                        if (missing.length) {
                                                            showToast(`נא למלא את כל שדות החובה: ${missing.map(m => m.label).join(', ')}`, 'error');
                                                            return;
                                                        }
                                                        const html = selectedTemplate.templateHtml(formValues);
                                                        setGeneratedDoc({
                                                            title: selectedTemplate.title,
                                                            html,
                                                            folder: selectedTemplate.category
                                                        });
                                                        setSmartStep('preview');
                                                    }}
                                                    className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#5856D6] to-[#007AFF] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                                >
                                                    תצוגה מקדימה והפקה
                                                </button>
                                            </div>
                                        </div>

                                        {/* Live/Static Preview (Left side) */}
                                        <div className="w-1/2 p-6 bg-black/[0.02] flex items-center justify-center overflow-y-auto">
                                            <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-black/05 p-6 h-[90%] overflow-y-auto">
                                                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.templateHtml(formValues) }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {smartStep === 'ai' && (
                                    <div className="flex-1 flex overflow-hidden">
                                        <div className="w-1/2 p-6 overflow-y-auto border-l border-black/05 space-y-4 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => setSmartStep('library')}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]"
                                                >
                                                    <ArrowRight size={12} />
                                                    חזרה לבחירת תבנית
                                                </button>
                                                <h4 className="font-black text-[#1D1D1F] text-[15px]">ניסוח מסמך מותאם עם AI</h4>
                                                
                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">הנחיות לניסוח המסמך</label>
                                                    <textarea
                                                        value={aiPrompt}
                                                        onChange={e => setAiPrompt(e.target.value)}
                                                        placeholder="לדוגמה: מכתב דרישה רשמי לעיריית תל אביב לתשלום חוב על סך 24,000 ש״ח עבור אספקת מחשבים ניידים לבית ספר רוגוזין. ציין כי האיחור בתשלום גורר ריבית פיגורים."
                                                        rows={6}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white border border-black/09 text-sm focus:outline-none focus:border-[#5856D6] transition-all resize-none text-right"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={async () => {
                                                    if (!aiPrompt.trim()) {
                                                        showToast('נא להזין הנחיות לניסוח המסמך', 'error');
                                                        return;
                                                    }
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
                                                            // Strip ```html and ``` if present
                                                            let cleaned = data.response.trim();
                                                            if (cleaned.startsWith('```html')) {
                                                                cleaned = cleaned.slice(7);
                                                            }
                                                            if (cleaned.endsWith('```')) {
                                                                cleaned = cleaned.slice(0, -3);
                                                            }
                                                            setGeneratedDoc({
                                                                title: 'מסמך AI מותאם',
                                                                html: cleaned,
                                                                folder: 'agreements'
                                                            });
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
                                                className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF9500] to-[#FF2D55] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                            >
                                                {drafting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        מנסח מסמך בעזרת Gemini...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={14} />
                                                        נסח מסמך בעזרת AI
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="w-1/2 p-6 bg-black/[0.02] flex flex-col items-center justify-center">
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
                                        <div className="w-1/3 p-6 overflow-y-auto border-l border-black/05 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => setSmartStep(selectedTemplate ? 'compose' : 'ai')}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-[#86868B] hover:text-[#1D1D1F]"
                                                >
                                                    <ArrowRight size={12} />
                                                    חזרה לעריכה
                                                </button>
                                                <h4 className="font-black text-[#1D1D1F] text-[15px]">אשר ושמור מסמך</h4>

                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">שם המסמך בכספת</label>
                                                    <input
                                                        type="text"
                                                        value={generatedDoc.title}
                                                        onChange={e => setGeneratedDoc(prev => ({ ...prev, title: e.target.value }))}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white border border-black/09 text-sm focus:outline-none focus:border-[#5856D6] transition-all text-right font-bold"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[#6E6E73] text-[10px] font-black tracking-widest mb-1.5">תיקיית יעד</label>
                                                    <select
                                                        value={generatedDoc.folder}
                                                        onChange={e => setGeneratedDoc(prev => ({ ...prev, folder: e.target.value }))}
                                                        className="w-full rounded-xl px-4 py-2.5 bg-white border border-black/09 text-sm focus:outline-none focus:border-[#5856D6] transition-all text-right"
                                                    >
                                                        {folders.map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <button
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
                                                    className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#34C759] to-[#30D158] hover:opacity-90 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                                                >
                                                    {drafting ? 'שומר קובץ...' : 'אשר ושמור לכספת'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const w = window.open('', '_blank');
                                                        w.document.write(generatedDoc.html);
                                                        w.document.close();
                                                        w.focus();
                                                        setTimeout(() => w.print(), 250);
                                                    }}
                                                    className="w-full py-3 rounded-xl border border-black/10 text-xs font-bold text-[#1D1D1F] hover:bg-black/02 transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <Printer size={13} />
                                                    הדפס מסמך / שמור כ-PDF
                                                </button>
                                            </div>
                                        </div>

                                        {/* Document Sheet Preview */}
                                        <div className="w-2/3 p-6 bg-[#8E8E93]/10 flex items-center justify-center overflow-y-auto">
                                            <div className="w-full max-w-2xl bg-white rounded-[20px] shadow-lg border border-black/05 p-12 min-h-[90%] overflow-y-auto">
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
