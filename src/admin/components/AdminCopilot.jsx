/* ═══════════════════════════════════════════════════════════════════════════════
   NEXTCLASS AI — ADMIN COPILOT  (floating in-workflow assistant)
   ───────────────────────────────────────────────────────────────────────────────
   A self-contained chat panel embedded INSIDE the admin portal, styled to match
   the storefront concierge (SmartConcierge): dark hover-reveal pill, frosted glass
   panel, gradient sparkle avatar, dark send button. Chat-only — no accessibility
   or contact tabs. It guides the operator, answers questions in Hebrew, summarises
   the live state of the store, drafts emails/quotes (never sends), and navigates to
   the right screen. Grounded in REAL admin data via useAdminData() — no mock data.

   Streams from POST /api/concierge (SSE) with a non-streaming JSON fallback.
   Mount: render <AdminCopilot/> inside <AdminDataProvider> in AdminApp.jsx.
   ═══════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Sparkles, X, ArrowUp, LayoutDashboard, Package, AlertTriangle,
    Mail, ScanLine, FolderLock, Compass, Paperclip, FileText, Loader2,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

import { useAdminData } from '../context/AdminDataContext';
import { useAdminToast } from '../context/AdminToastContext';
import { uploadFileToFirestore, extractPdf, imageToThumb } from '../utils/fileStore';
import {
    buildAdminDataContext,
    buildAdminCopilotSystemPrompt,
    QUICK_ACTIONS,
    SUGGESTED_PROMPTS,
} from '../lib/adminCopilotPrompt';

/* ─── Accent (matches storefront concierge: azure → indigo) ───────────────────── */
const ACCENT = 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)';

/* ─── Apple-glass surface tokens (frosted, inset-lit — reused across primitives) ─ */
const GLASS_BUBBLE = {
    background: 'linear-gradient(150deg, rgba(255,255,255,0.94), rgba(255,255,255,0.72))',
    backdropFilter: 'blur(24px) saturate(1.7)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.7)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 10px 30px rgba(20,40,80,0.09), inset 0 1px 0 rgba(255,255,255,1)',
};
const GLASS_CHIP = {
    background: 'linear-gradient(150deg, rgba(255,255,255,0.92), rgba(255,255,255,0.7))',
    backdropFilter: 'blur(18px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 4px 14px rgba(20,40,80,0.06), inset 0 1px 0 rgba(255,255,255,1)',
    color: '#1D1D1F',
};

/* ─── Icon for each quick-action route ───────────────────────────────────────── */
const ACTION_ICON = {
    '/admin/dashboard':      LayoutDashboard,
    '/admin/orders':         Package,
    '/admin/inventory':      AlertTriangle,
    '/admin/communications': Mail,
    '/admin/ocr':            ScanLine,
    '/admin/vault':          FolderLock,
};

/* ─── Rich text — **bold** + line breaks ─────────────────────────────────────── */
const RichText = memo(({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <p key={i} className="leading-[1.65]">
                        {parts.map((part, j) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j} className="font-black text-[#1D1D1F]">{part.slice(2, -2)}</strong>
                                : <span key={j}>{part}</span>
                        )}
                    </p>
                );
            })}
        </div>
    );
});

/* ─── Chat bubble (storefront-matched) ───────────────────────────────────────── */
const Bubble = memo(({ msg, reduce }) => {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`flex items-end gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shrink-0 shadow-lg border border-white/20 self-start mt-1">
                    <Sparkles size={14} className="text-white" />
                </div>
            )}
            <div className={`max-w-[85%] px-5 py-3 text-[14px] font-medium leading-[1.6] ${
                isUser
                    ? 'bg-[#007AFF] text-white rounded-[1.25rem] rounded-br-none shadow-md'
                    : 'text-[#1D1D1F] rounded-[1.25rem] rounded-bl-none'
            }`}
                style={!isUser ? GLASS_BUBBLE : {}}
            >
                {isUser && msg.attachmentName && (
                    <div className="flex items-center gap-1.5 mb-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                        <FileText size={13} className="text-white/90 shrink-0" />
                        <span className="text-[11px] font-bold text-white/95 truncate" style={{ direction: 'ltr' }}>{msg.attachmentName}</span>
                    </div>
                )}
                {isUser ? msg.text : <RichText text={msg.text} />}
            </div>
        </motion.div>
    );
});

/* ─── Typing indicator (storefront-matched) ──────────────────────────────────── */
const TypingDots = () => (
    <div className="flex items-end gap-3 justify-end">
        <div className="px-5 py-4 rounded-[1.25rem] rounded-bl-none flex gap-1.5 items-center"
            style={GLASS_BUBBLE}>
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[#007AFF]"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
            ))}
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-white" />
        </div>
    </div>
);

/* ─── Action-tag parsing — the copilot can create records via [ACTION:{...}] ──── */
const ACTION_META = {
    createCustomer:      { label: 'צור לקוח',       path: '/admin/customers',   fields: ['name', 'phone', 'email', 'institution', 'city'] },
    createOrder:         { label: 'צור הזמנה',      path: '/admin/orders',      fields: ['contactName', 'institution', 'phone', 'email', 'deliveryDate'] },
    createProduct:       { label: 'הוסף מוצר',      path: '/admin/products',    fields: ['title', 'brand', 'model', 'price', 'category', 'stock'] },
    createSupplierOrder: { label: 'צור הזמנת ספק',  path: '/admin/fulfillment', fields: ['productTitle', 'supplierName', 'qty', 'totalCost', 'eta'] },
    saveToVault:         { label: 'שמור בכספת',     path: '/admin/vault',       fields: ['name', 'folder', 'classification'] },
};
const F_LABEL = { name: 'שם', phone: 'טלפון', email: 'אימייל', institution: 'מוסד', city: 'עיר', contactName: 'לקוח', deliveryDate: 'אספקה', title: 'שם', brand: 'מותג', model: 'דגם', price: 'מחיר', category: 'קטגוריה', stock: 'מלאי', productTitle: 'מוצר', supplierName: 'ספק', qty: 'כמות', totalCost: 'עלות', eta: 'ETA', folder: 'תיקייה', classification: 'סיווג' };

/* ─── Vault folder resolution (Hebrew name / synonym → folder id) ─────────────── */
const SYSTEM_FOLDERS = [
    { id: 'agreements', name: 'הסכמי לקוחות', syn: ['חוזה', 'חוזים', 'הסכם', 'הסכמים', 'לקוח'] },
    { id: 'quotes', name: 'הצעות מחיר', syn: ['הצעה', 'הצעות', 'הצעת מחיר'] },
    { id: 'receipts', name: 'חשבוניות וקבלות', syn: ['חשבונית', 'חשבוניות', 'קבלה', 'קבלות'] },
    { id: 'suppliers', name: 'הצעות ספקים', syn: ['ספק', 'ספקים'] },
    { id: 'product_docs', name: 'מסמכי מוצרים', syn: ['מוצר', 'מוצרים', 'מפרט'] },
];
function resolveFolderId(nameOrId, customFolders = []) {
    if (!nameOrId) return 'agreements';
    const q = String(nameOrId).trim().toLowerCase();
    const all = [...SYSTEM_FOLDERS, ...customFolders.map(f => ({ id: f.id, name: f.name || '', syn: [] }))];
    let hit = all.find(f => f.id === q || (f.name || '').toLowerCase() === q);
    if (hit) return hit.id;
    hit = all.find(f => (f.name || '').toLowerCase().includes(q) || q.includes((f.name || '').toLowerCase()));
    if (hit) return hit.id;
    hit = SYSTEM_FOLDERS.find(f => f.syn.some(s => q.includes(s)));
    return hit ? hit.id : 'agreements';
}
const CLASS_MAP = { contract: 'contract', invoice: 'invoice', po: 'po', quote: 'quote', receipt: 'receipt', pending: 'pending' };

/* ─── Client-side text extraction for an attached document ───────────────────── */
async function prepareAttachment(file, ocrEndpoint = '/api/ocr-order') {
    const name = file.name || 'מסמך';
    const lower = name.toLowerCase();
    const type = file.type || '';
    let kind = 'other', docText = '', base64 = null, mimeType = type;
    const toB64 = (f) => new Promise((res) => { const r = new FileReader(); r.onload = e => res(String(e.target.result).split(',')[1]); r.onerror = () => res(null); r.readAsDataURL(f); });
    const toText = (f) => new Promise((res) => { const r = new FileReader(); r.onload = e => res(String(e.target.result || '')); r.onerror = () => res(''); r.readAsText(f); });
    try {
        if (type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/.test(lower)) {
            kind = 'image'; base64 = await toB64(file); mimeType = type || 'image/jpeg';
        } else if (type === 'application/pdf' || lower.endsWith('.pdf')) {
            kind = 'pdf'; base64 = await toB64(file); mimeType = 'application/pdf';
            try { const r = await extractPdf(file, { maxPages: 12 }); if (r.text?.trim()) docText = r.text; } catch { /* noop */ }
        } else if (lower.endsWith('.csv') || type === 'text/csv') {
            kind = 'csv'; docText = await toText(file);
        } else if (lower.endsWith('.txt') || type.startsWith('text/')) {
            kind = 'text'; docText = await toText(file);
        } else if (lower.endsWith('.docx')) {
            kind = 'docx';
            try { const m = await import('mammoth/mammoth.browser.js').catch(() => import('mammoth')); const mod = m.default || m; const r = await mod.extractRawText({ arrayBuffer: await file.arrayBuffer() }); docText = (r && r.value) || ''; } catch { /* noop */ }
        } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
            kind = 'xlsx';
            try { const x = await import('xlsx'); const XLSX = x.default || x; const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' }); docText = wb.SheetNames.map(n => `# ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join('\n\n'); } catch { /* noop */ }
        }
        // For images (or text-less PDFs), pull text via the OCR endpoint so the AI can read the doc.
        if (!docText.trim() && base64) {
            try {
                const res = await fetch(ocrEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: name, fileBase64: base64, mimeType }) });
                const j = await res.json();
                if (j?.rawText) docText = j.rawText;
                else if (j?.data) docText = JSON.stringify(j.data);
            } catch { /* noop */ }
        }
    } catch { /* noop */ }
    return { file, name, kind, docText: (docText || '').slice(0, 8000), base64, mimeType };
}
const stripAction = (text) => (text || '').replace(/\[ACTION:[\s\S]*$/i, '').trimEnd();
function parseAction(text) {
    const m = (text || '').match(/\[ACTION:\s*(\{[\s\S]*?\})\s*\]/i);
    if (!m) return null;
    try { const obj = JSON.parse(m[1]); if (obj && ACTION_META[obj.type]) return obj; } catch {}
    return null;
}

/* ─── Navigation quick-action chip ───────────────────────────────────────────── */
const NavChip = memo(({ label, path, onGo }) => {
    const Icon = ACTION_ICON[path] || Compass;
    return (
        <motion.button
            whileHover={{ y: -2, boxShadow: '0 8px 18px rgba(0,122,255,0.20), inset 0 1px 0 rgba(255,255,255,0.7)' }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            onClick={() => onGo(path, label)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold cursor-pointer"
            style={{
                background: 'linear-gradient(140deg, rgba(0,122,255,0.14), rgba(90,200,250,0.06))',
                border: '1px solid rgba(0,122,255,0.22)', color: '#007AFF',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 10px rgba(0,122,255,0.10)',
            }}
        >
            <Icon size={13} strokeWidth={2.4} />
            {label}
        </motion.button>
    );
});

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AdminCopilot() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useAdminToast();
    const { kpis, inventory, activityLog, createQuote, upsertContact, createSupplierOrder, addProduct } = useAdminData();

    const reduce = useReducedMotion();

    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [messages, setMessages] = useState([]); // {id, role:'user'|'ai', text}
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [pendingEmailsCount, setPendingEmailsCount] = useState(0);
    const [attachment, setAttachment] = useState(null); // {file,name,kind,docText,base64,mimeType}
    const [preparingDoc, setPreparingDoc] = useState(false);
    const [vaultFolders, setVaultFolders] = useState([]);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    /* ── Live pending-email approval count (read-only) ───────────────────────── */
    useEffect(() => {
        const qy = query(collection(db, 'pending_emails'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(
            qy,
            snap => setPendingEmailsCount(snap.docs.filter(d => d.data().status === 'pending').length),
            () => {} // silent — count simply stays 0 if unavailable
        );
        return unsub;
    }, []);

    /* ── Live custom vault folders (for "save to folder X" resolution) ───────── */
    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'vault_folders'),
            snap => setVaultFolders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => {}
        );
        return unsub;
    }, []);

    /* ── Attach a document to the chat (extract text so the AI can act on it) ── */
    const onPickFile = useCallback(async (file) => {
        if (!file) return;
        setPreparingDoc(true);
        setAttachment({ file, name: file.name || 'מסמך', kind: 'other', docText: '', base64: null, mimeType: file.type || '' });
        try {
            const prepared = await prepareAttachment(file);
            setAttachment(prepared);
            if (!prepared.docText) showToast('צירפתי את המסמך. לא הצלחתי לחלץ טקסט — עדיין אפשר לשמור בכספת.', 'info');
        } catch {
            showToast('לא הצלחתי לקרוא את המסמך', 'error');
        } finally {
            setPreparingDoc(false);
        }
    }, [showToast]);

    /* ── Autoscroll + focus ──────────────────────────────────────────────────── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }, [messages, isTyping, reduce]);
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 350);
    }, [isOpen]);

    /* ── Escape closes ───────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    /* ── Guided navigation (safe — no mutation) ──────────────────────────────── */
    const goTo = useCallback((path, label) => {
        navigate(path);
        setIsOpen(false);
        showToast(`פתחתי עבורך: ${label}`, 'info');
    }, [navigate, showToast]);

    /* ── Send → stream from /api/concierge (SSE) with JSON fallback ──────────── */
    const send = useCallback(async (text) => {
        const doc = attachment; // capture the document being sent (if any)
        let t = (text ?? input).trim();
        if ((!t && !doc) || isTyping || preparingDoc) return;
        if (!t && doc) t = 'צירפתי מסמך — נתח אותו ואמור מה אפשר לעשות איתו (להוסיף הזמנה / לשמור בכספת / לחלץ נתונים).';

        const outgoing = [...messages, { id: Date.now(), role: 'user', text: t, attachmentName: doc?.name }];
        setMessages(outgoing);
        setInput('');
        setAttachment(null);
        setIsTyping(true);

        // Fresh live context on every send — grounded in the ACTUAL current state.
        const dataContext = buildAdminDataContext({
            kpis, inventory, activityLog,
            pendingEmailsCount,
            pathname: location.pathname,
        });
        const systemPrompt = buildAdminCopilotSystemPrompt(dataContext);

        const history = outgoing
            .slice(-8)
            .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
        // Inject the attached document's extracted text into the final user turn so
        // the AI can read + act on it (create order / save to vault / summarise).
        if (doc && history.length) {
            const last = history[history.length - 1];
            const body = doc.docText ? doc.docText : '(לא חולץ טקסט — קובץ תמונה/בינארי; אפשר עדיין לשמור בכספת)';
            last.content = `${last.content}\n\n---\n[מסמך מצורף: ${doc.name}]\n${body}\n---`;
        }

        const streamId = Date.now() + 1;
        let acc = '';
        let started = false;

        const pushDisplay = () => {
            const disp = stripAction(acc); // hide the [ACTION:…] tag while streaming
            if (!started) {
                started = true;
                setIsTyping(false);
                setMessages(prev => [...prev, { id: streamId, role: 'ai', text: disp }]);
            } else {
                setMessages(prev => prev.map(m => (m.id === streamId ? { ...m, text: disp } : m)));
            }
        };

        const finalize = (rawText) => {
            const action = parseAction(rawText);
            const safe = stripAction(rawText).trim() || (action ? 'הנה מה שאני עומד ליצור:' : 'מצטער, לא הצלחתי לעבד את הבקשה. נסה/י שוב.');
            // carry the attached file so a saveToVault action can upload the actual doc
            const docRef = doc ? { docFile: doc.file, docName: doc.name } : {};
            setMessages(prev =>
                prev.some(m => m.id === streamId)
                    ? prev.map(m => (m.id === streamId ? { ...m, text: safe, action, ...docRef } : m))
                    : [...prev, { id: streamId, role: 'ai', text: safe, action, ...docRef }]
            );
        };

        try {
            // ── Primary: SSE stream ──────────────────────────────────────────
            const res = await fetch('/api/concierge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history, systemPrompt, stream: true }),
            });
            if (!res.ok || !res.body) throw new Error('stream unavailable');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let ended = false;

            while (!ended) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let sep;
                while ((sep = buffer.indexOf('\n\n')) !== -1) {
                    const frame = buffer.slice(0, sep);
                    buffer = buffer.slice(sep + 2);
                    for (const line of frame.split('\n')) {
                        const l = line.trim();
                        if (!l.startsWith('data:')) continue; // ignore comment pings (": open")
                        const payload = l.slice(5).trim();
                        if (payload === '[DONE]') { ended = true; continue; }
                        try {
                            const obj = JSON.parse(payload);
                            if (obj.type === 'delta' && obj.text) { acc += obj.text; pushDisplay(); }
                            else if (obj.type === 'done' && obj.text) { acc = obj.text; } // authoritative
                        } catch { /* ignore partial / non-JSON frame */ }
                    }
                }
            }

            setIsTyping(false);
            finalize(acc);
        } catch {
            // ── Fallback: non-streaming JSON ─────────────────────────────────
            try {
                const res = await fetch('/api/concierge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: history, systemPrompt }),
                });
                const data = await res.json();
                setIsTyping(false);
                finalize(data.text || data.response || '');
            } catch {
                setIsTyping(false);
                finalize('שגיאת רשת. נסה/י שוב בעוד רגע.');
            }
        }
    }, [input, isTyping, preparingDoc, attachment, messages, kpis, inventory, activityLog, pendingEmailsCount, location.pathname]);

    /* ── Execute a copilot-proposed create action (after confirm) ────────────── */
    const executeAction = useCallback(async (msg) => {
        const a = msg.action; if (!a) return;
        const meta = ACTION_META[a.type]; const p = a.payload || {};
        try {
            if (a.type === 'createCustomer') await upsertContact(p);
            else if (a.type === 'createOrder') await createQuote({ ...p, source: 'ai' });
            else if (a.type === 'createProduct') await addProduct({ ...p, isActive: true, price: Number(p.price) || 0 });
            else if (a.type === 'createSupplierOrder') await createSupplierOrder(p);
            else if (a.type === 'saveToVault') {
                if (!msg.docFile) { showToast('אין מסמך מצורף לשמירה', 'error'); return; }
                const folder = resolveFolderId(p.folder, vaultFolders);
                const classification = CLASS_MAP[p.classification] || 'pending';
                let thumb = ''; let contentText = '';
                try { thumb = await imageToThumb(msg.docFile); } catch { /* noop */ }
                try { if (/pdf/i.test(msg.docFile.type || msg.docFile.name)) { const r = await extractPdf(msg.docFile); if (r.text) contentText = r.text; if (r.thumb) thumb = r.thumb; } } catch { /* noop */ }
                await uploadFileToFirestore(db, 'vault_documents', msg.docFile, {
                    name: p.name || msg.docName || msg.docFile.name,
                    type: msg.docFile.type || 'application/octet-stream',
                    size: msg.docFile.size,
                    folder, classification, tags: [], source: 'ai-chat', favorite: false, trashed: false,
                    contentText, ...(thumb ? { thumb } : {}),
                });
            }
            else { showToast('פעולה לא נתמכת', 'error'); return; }
            setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, actionDone: true, actionPath: meta.path } : m)));
            showToast(`${meta.label} — בוצע ✓`, 'success');
        } catch { showToast('שגיאה בביצוע הפעולה', 'error'); }
    }, [upsertContact, createQuote, addProduct, createSupplierOrder, showToast, vaultFolders]);
    const dismissAction = (msg) => setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, action: null } : m)));

    /* ── Attention badge — count of items needing action ─────────────────────── */
    const attention =
        (Number(kpis?.newQuotes) || 0) +
        (Number(kpis?.allPendingOrders) || 0) +
        (Number(kpis?.lowStockCount) || 0) +
        (Number(pendingEmailsCount) || 0);

    const panelSpring = reduce ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 32 };

    return (
        <div
            className="fixed z-[940] flex flex-col items-end gap-5"
            style={{ bottom: '24px', insetInlineEnd: '24px', fontFamily: 'Heebo, sans-serif' }}
            dir="rtl"
        >
            {/* ── Chat panel ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
                        transition={panelSpring}
                        className="flex flex-col overflow-hidden rounded-[2.5rem] relative"
                        style={{
                            width: 'min(380px, calc(100vw - 32px))',
                            height: 'min(620px, calc(100vh - 132px))',
                            transformOrigin: 'bottom left',
                            background: 'rgba(248,249,252,0.98)',
                            backdropFilter: 'blur(60px) saturate(1.8)',
                            WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
                            border: '1px solid rgba(0,0,0,0.10)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
                        }}
                        role="dialog"
                        aria-label="NextClass AI — עוזר הניהול"
                    >
                        {/* top accent hairline */}
                        <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-[2.5rem] pointer-events-none" style={{ background: 'linear-gradient(90deg, #007AFF, #5AC8FA)' }} />

                        {/* ── Header ──────────────────────────────────────────── */}
                        <div className="relative z-20 px-6 pt-6 pb-4 flex items-center gap-3 shrink-0"
                            style={{ background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                            <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shadow-lg transform rotate-2">
                                    <Sparkles size={22} className="text-white" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                                <h3 className="text-[16px] font-black text-[#1D1D1F] tracking-tight leading-none">NextClass AI</h3>
                                <p className="text-[9px] font-black mt-1 opacity-70" style={{ color: '#007AFF' }}>עוזר הניהול החכם</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setIsOpen(false)}
                                className="w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all cursor-pointer shrink-0"
                                aria-label="סגור"
                            >
                                <X size={18} className="text-[#1D1D1F]" />
                            </motion.button>
                        </div>

                        {/* ── Messages ────────────────────────────────────────── */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 custom-scrollbar" style={{ background: '#F2F3F7' }}>
                            {messages.length === 0 ? (
                                /* Empty state — greeting + suggestions */
                                <div className="flex flex-col gap-4 pt-1">
                                    <div className="flex items-end gap-3 justify-end">
                                        <div className="max-w-[85%] px-5 py-3 text-[14px] font-medium text-[#1D1D1F] leading-[1.6] rounded-[1.25rem] rounded-bl-none"
                                            style={GLASS_BUBBLE}>
                                            שלום! אני <strong className="font-black">NextClass AI</strong>, עוזר הניהול שלך. אני יכול לסכם את מצב החנות, להסביר איך משתמשים במערכת, לנסח טיוטת מייל או הצעת מחיר, ולכוון אותך למסך הנכון. במה נתחיל?
                                        </div>
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center shrink-0 shadow-lg border border-white/20 self-start mt-1">
                                            <Sparkles size={14} className="text-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-[#86868B] mb-2 text-right">שאלות נפוצות</p>
                                        <div className="flex flex-col gap-2">
                                            {SUGGESTED_PROMPTS.map(p => (
                                                <motion.button
                                                    key={p}
                                                    whileHover={reduce ? undefined : { y: -2, boxShadow: '0 12px 28px rgba(20,40,80,0.12), inset 0 1px 0 rgba(255,255,255,1)' }}
                                                    whileTap={{ scale: 0.98 }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                                                    onClick={() => send(p)}
                                                    className="text-right px-4 py-2.5 rounded-2xl text-[12.5px] font-bold cursor-pointer"
                                                    style={GLASS_CHIP}
                                                >
                                                    {p}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-[#86868B] mb-2 text-right">מעבר מהיר</p>
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {QUICK_ACTIONS.map(a => (
                                                <NavChip key={a.path + a.label} label={a.label} path={a.path} onGo={goTo} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map(m => (
                                        <div key={m.id} className="flex flex-col gap-2">
                                            <Bubble msg={m} reduce={reduce} />
                                            {m.action && !m.actionDone && (() => {
                                                const meta = ACTION_META[m.action.type]; const p = m.action.payload || {};
                                                return (
                                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        className="self-start w-[90%] rounded-2xl p-3.5" style={{
                                                            background: 'linear-gradient(150deg, rgba(255,255,255,0.96), rgba(240,247,255,0.82))',
                                                            backdropFilter: 'blur(22px) saturate(1.7)', WebkitBackdropFilter: 'blur(22px) saturate(1.7)',
                                                            border: '1px solid rgba(0,122,255,0.28)',
                                                            boxShadow: '0 12px 32px rgba(0,122,255,0.14), inset 0 1px 0 rgba(255,255,255,1)',
                                                        }}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)' }}><Sparkles size={12} className="text-white" /></span>
                                                            <span className="text-[13px] font-black text-[#1D1D1F]">{meta?.label}</span>
                                                        </div>
                                                        <div className="space-y-1 mb-3">
                                                            {(meta?.fields || []).filter(f => p[f] != null && p[f] !== '').map(f => (
                                                                <div key={f} className="flex items-center gap-2 text-[11.5px]">
                                                                    <span className="font-bold text-[#86868B] min-w-[52px]">{F_LABEL[f] || f}</span>
                                                                    <span className="font-medium text-[#1D1D1F] truncate">{String(p[f])}</span>
                                                                </div>
                                                            ))}
                                                            {Array.isArray(p.items) && p.items.length > 0 && (
                                                                <div className="flex items-start gap-2 text-[11.5px]"><span className="font-bold text-[#86868B] min-w-[52px]">פריטים</span><span className="font-medium text-[#1D1D1F]">{p.items.map(it => `${it.title || ''} ×${it.qty || 1}`).join(', ')}</span></div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => executeAction(m)} className="flex-1 py-2 rounded-xl text-[12px] font-black text-white" style={{ background: 'linear-gradient(135deg,#007AFF,#5AC8FA)' }}>אשר וצור</button>
                                                            <button onClick={() => dismissAction(m)} className="px-3 py-2 rounded-xl text-[12px] font-bold text-[#86868B]" style={{ background: 'rgba(0,0,0,0.05)' }}>בטל</button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })()}
                                            {m.actionDone && (
                                                <button onClick={() => { navigate(m.actionPath); setIsOpen(false); }}
                                                    className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black" style={{ background: 'rgba(52,199,89,0.12)', color: '#1A8C40' }}>
                                                    <ArrowUp size={12} className="rotate-45" /> נוצר בהצלחה — פתח
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {isTyping && <TypingDots />}
                                </>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* ── Quick nav row (persistent, when in conversation) ── */}
                        {messages.length > 0 && (
                            <div className="relative z-20 px-6 pt-3 pb-2 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 justify-end"
                                style={{ background: 'rgba(255,255,255,0.98)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                {QUICK_ACTIONS.slice(0, 5).map(a => (
                                    <div key={a.path + a.label} className="shrink-0">
                                        <NavChip label={a.label} path={a.path} onGo={goTo} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── Input ───────────────────────────────────────────── */}
                        <div className="relative z-20 p-6 pt-2 shrink-0" style={{ background: 'rgba(255,255,255,0.98)', borderTop: messages.length > 0 ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>
                            {/* attachment chip */}
                            <AnimatePresence>
                                {(attachment || preparingDoc) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: 8, height: 0 }}
                                        className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl overflow-hidden"
                                        style={{ background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.20)' }}>
                                        {preparingDoc
                                            ? <Loader2 size={15} className="text-[#007AFF] shrink-0 animate-spin" />
                                            : <FileText size={15} className="text-[#007AFF] shrink-0" />}
                                        <span className="flex-1 min-w-0 text-[12px] font-bold text-[#1D1D1F] truncate" style={{ direction: 'ltr', textAlign: 'right' }}>
                                            {attachment?.name || 'מכין מסמך…'}
                                        </span>
                                        {preparingDoc
                                            ? <span className="text-[10px] font-bold text-[#86868B] shrink-0">מחלץ טקסט…</span>
                                            : attachment?.docText
                                                ? <span className="text-[10px] font-black text-[#34C759] shrink-0">✓ נקרא</span>
                                                : <span className="text-[10px] font-bold text-[#FF9500] shrink-0">בלי טקסט</span>}
                                        {!preparingDoc && (
                                            <button onClick={() => setAttachment(null)} className="w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center shrink-0" aria-label="הסר">
                                                <X size={12} className="text-[#86868B]" />
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="flex items-center gap-2 rounded-2xl px-2 py-1.5"
                                style={{
                                    background: 'linear-gradient(150deg, rgba(255,255,255,0.9), rgba(242,243,247,0.82))',
                                    backdropFilter: 'blur(18px) saturate(1.6)', WebkitBackdropFilter: 'blur(18px) saturate(1.6)',
                                    border: '1px solid rgba(255,255,255,0.9)',
                                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(0,0,0,0.04), 0 2px 8px rgba(20,40,80,0.05)',
                                }}>
                                <input ref={fileInputRef} type="file" className="hidden"
                                    accept="image/*,.pdf,.csv,.txt,.docx,.xlsx,.xls,.heic,.heif"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ''; }} />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isTyping || preparingDoc}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30 cursor-pointer"
                                    style={{ background: 'linear-gradient(140deg, rgba(0,122,255,0.16), rgba(90,200,250,0.08))', border: '1px solid rgba(0,122,255,0.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 8px rgba(0,122,255,0.12)' }}
                                    aria-label="צרף מסמך" title="צרף מסמך (PDF, תמונה, CSV, DOCX, XLSX)"
                                >
                                    <Paperclip size={17} className="text-[#007AFF]" strokeWidth={2.4} />
                                </motion.button>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !isTyping) send(); }}
                                    placeholder={attachment ? 'מה לעשות עם המסמך?' : 'שאל/י אותי כל דבר על החנות…'}
                                    dir="rtl"
                                    className="flex-1 bg-transparent border-none px-3 py-2 text-[14px] font-medium outline-none text-[#1D1D1F] placeholder:text-gray-400"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => send()}
                                    disabled={(!input.trim() && !attachment) || isTyping || preparingDoc}
                                    className="w-10 h-10 bg-[#1D1D1F] disabled:opacity-20 text-white rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer shrink-0"
                                    aria-label="שלח"
                                >
                                    <ArrowUp size={18} strokeWidth={3} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Trigger pill (storefront-matched: dark → gradient on hover) ──── */}
            <motion.button
                layout
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsOpen(o => !o)}
                whileHover={reduce ? undefined : { scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-16 rounded-[2rem] bg-[#1D1D1F] shadow-[0_15px_40px_rgba(0,0,0,0.18)] flex items-center px-4 overflow-hidden relative group transition-all duration-500 cursor-pointer"
                style={{ minWidth: '4.5rem' }}
                aria-label={isOpen ? 'סגור את NextClass AI' : 'פתח את NextClass AI'}
                aria-expanded={isOpen}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-3 w-full justify-center">
                    <AnimatePresence mode="wait" initial={false}>
                        {isOpen ? (
                            <motion.div key="x"
                                initial={reduce ? false : { rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={reduce ? { opacity: 0 } : { rotate: 90, opacity: 0 }}>
                                <X size={26} className="text-white" strokeWidth={2.6} />
                            </motion.div>
                        ) : (
                            <motion.div key="s"
                                initial={reduce ? false : { scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                                className="flex items-center gap-3">
                                <Sparkles size={24} className="text-white group-hover:scale-110 transition-transform duration-500" strokeWidth={2.4} />
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0, x: -8 }}
                                            animate={{ opacity: 1, width: 'auto', x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: -8 }}
                                            className="flex flex-col items-start overflow-hidden whitespace-nowrap">
                                            <span className="text-[12px] font-black text-white leading-none">NextClass AI</span>
                                            <span className="text-[8px] font-bold text-white/50 mt-1">עוזר ניהול חכם</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* attention badge */}
                {!isOpen && attention > 0 && (
                    <motion.span
                        initial={reduce ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className="absolute -top-1 -left-1 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black text-white z-20"
                        style={{ background: ACCENT, boxShadow: '0 3px 10px rgba(0,122,255,0.4)', border: '2px solid rgba(255,255,255,0.9)' }}
                    >
                        {attention > 99 ? '99+' : attention}
                    </motion.span>
                )}
            </motion.button>
        </div>
    );
}
