// ─────────────────────────────────────────────────────────────────────────────
// Billing-free file storage on Firestore — no Cloud Storage bucket required.
//
// Large files are stored as base64 split across a `chunks` subcollection so each
// Firestore document stays under the 1 MiB limit; the metadata doc stays light
// (no bytes) so live list listeners are fast. Bytes are fetched on demand and
// reassembled into an in-browser blob URL.
//
// Small images can instead be inlined as a compressed data URL (imageToDataUrl)
// so they render directly via <img src> on the public site and persist reloads.
// ─────────────────────────────────────────────────────────────────────────────
import {
    collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

export const CHUNK_CHARS = 700000;               // base64 chars per chunk (~700KB, < 1 MiB doc limit)
export const FILE_MAX_BYTES = 15 * 1024 * 1024;  // 15MB per file

export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('read failed'));
        reader.readAsDataURL(file);
    });
}

export async function fileToBase64(file) {
    const res = await fileToDataUrl(file);
    const comma = res.indexOf(',');
    return comma >= 0 ? res.slice(comma + 1) : res;
}

export function base64ToBlobUrl(b64, mime) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mime || 'application/octet-stream' }));
}

// Store a file as base64 chunks under <collectionName>/<id>/chunks. Chunk docs
// are written first, the metadata doc LAST — so a live listener never shows a
// document whose bytes aren't ready yet. Returns the new document id.
export async function uploadFileToFirestore(db, collectionName, file, meta, onProgress) {
    const b64 = await fileToBase64(file);
    const chunks = [];
    for (let i = 0; i < b64.length; i += CHUNK_CHARS) chunks.push(b64.slice(i, i + CHUNK_CHARS));
    if (!chunks.length) chunks.push('');
    const chunkCount = chunks.length;
    const docRef = doc(collection(db, collectionName)); // pre-generate id
    for (let i = 0; i < chunkCount; i++) {
        await setDoc(doc(db, collectionName, docRef.id, 'chunks', String(i)), { i, b64: chunks[i] });
        onProgress?.(Math.round(((i + 1) / chunkCount) * 100));
    }
    await setDoc(docRef, {
        ...meta,
        type: meta.type || 'application/octet-stream',
        storage: 'firestore',
        chunkCount,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

// Reassemble a Firestore-stored file into an in-browser blob URL.
export async function fetchFirestoreBlobUrl(db, collectionName, item) {
    return fetchChunksBlobUrl(db, [collectionName, item.id, 'chunks'], item.type);
}

// Reassemble chunks at ANY nested path (e.g. a version subcollection) into a blob URL.
export async function fetchChunksBlobUrl(db, segments, mime) {
    const snap = await getDocs(query(collection(db, ...segments), orderBy('i')));
    const full = snap.docs.map(x => x.data().b64 || '').join('');
    if (!full) throw new Error('no bytes');
    return base64ToBlobUrl(full, mime);
}

// Overwrite a document's chunks with a new file's bytes. Returns {chunkCount,size,type}.
export async function replaceDocFile(db, collectionName, docId, file, onProgress) {
    const existing = await getDocs(collection(db, collectionName, docId, 'chunks'));
    await Promise.all(existing.docs.map(c => deleteDoc(c.ref)));
    const b64 = await fileToBase64(file);
    const chunks = [];
    for (let i = 0; i < b64.length; i += CHUNK_CHARS) chunks.push(b64.slice(i, i + CHUNK_CHARS));
    if (!chunks.length) chunks.push('');
    for (let i = 0; i < chunks.length; i++) {
        await setDoc(doc(db, collectionName, docId, 'chunks', String(i)), { i, b64: chunks[i] });
        onProgress?.(Math.round(((i + 1) / chunks.length) * 100));
    }
    return { chunkCount: chunks.length, size: file.size, type: file.type || 'application/octet-stream' };
}

// Copy a document's current chunks into a version snapshot subcollection.
export async function snapshotDocChunks(db, collectionName, docId, versionId) {
    const src = await getDocs(collection(db, collectionName, docId, 'chunks'));
    await Promise.all(src.docs.map(c => setDoc(doc(db, collectionName, docId, 'versions', versionId, 'chunks', c.id), c.data())));
}

const approxBytes = (dataUrl) => {
    const comma = dataUrl.indexOf(',');
    return Math.floor((dataUrl.length - (comma + 1)) * 0.75);
};

// ── PDF text + first-page thumbnail (pdf.js, lazily imported) ─────────────────
let _pdfjs = null;
async function getPdfjs() {
    if (_pdfjs) return _pdfjs;
    const pdfjs = await import('pdfjs-dist');
    try { pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default; } catch {}
    _pdfjs = pdfjs;
    return pdfjs;
}

// Extract searchable text (first pages) + a first-page thumbnail from a PDF.
// Fails soft: returns {text:'',thumb:''} if pdf.js can't parse it.
export async function extractPdf(file, { maxPages = 8, thumbDim = 320 } = {}) {
    try {
        const pdfjs = await getPdfjs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        let text = '';
        const pages = Math.min(pdf.numPages, maxPages);
        for (let i = 1; i <= pages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(it => it.str).join(' ') + '\n';
            if (text.length > 20000) break;
        }
        let thumb = '';
        try {
            const page1 = await pdf.getPage(1);
            const base = page1.getViewport({ scale: 1 });
            const viewport = page1.getViewport({ scale: thumbDim / Math.max(base.width, base.height) });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page1.render({ canvasContext: ctx, viewport }).promise;
            thumb = canvas.toDataURL('image/jpeg', 0.7);
        } catch {}
        return { text: text.slice(0, 20000), thumb };
    } catch { return { text: '', thumb: '' }; }
}

// Render a PDF's pages to high-res image data-URLs. This is the most reliable way
// to *show* a PDF in-app: browsers frequently refuse to render data:/blob PDFs in
// <embed>/<iframe> (CSP, sandboxing), but a canvas-rendered PNG always displays.
// Returns [] on failure so callers can fall back to text.
export async function renderPdfPages(file, { maxPages = 10, targetWidth = 1000 } = {}) {
    try {
        const pdfjs = await getPdfjs();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const pages = Math.min(pdf.numPages, maxPages);
        const out = [];
        for (let i = 1; i <= pages; i++) {
            const page = await pdf.getPage(i);
            const base = page.getViewport({ scale: 1 });
            const scale = Math.min(2.5, targetWidth / base.width);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
            out.push(canvas.toDataURL('image/jpeg', 0.82));
        }
        return out;
    } catch { return []; }
}

// Generate a small thumbnail data URL for an image file (~220px, JPEG). Returns
// '' for non-images or on failure. Cheap to store inline on the doc metadata.
export async function imageToThumb(file, maxDim = 220) {
    if (!file.type?.startsWith('image/')) return '';
    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let w = img.width, h = img.height;
                if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('thumb failed')); };
            img.src = url;
        });
    } catch { return ''; }
}

// Compress an image file to a data URL that stays under maxBytes. Keeps the
// original format (and transparency) when it's already small enough; otherwise
// downscales and re-encodes to JPEG until it fits. Non-images pass through.
export async function imageToDataUrl(file, maxBytes = 900000) {
    const original = await fileToDataUrl(file);
    if (!file.type?.startsWith('image/') || approxBytes(original) <= maxBytes) return original;
    return await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let w = img.width, h = img.height;
            const MAXDIM = 1600;
            if (Math.max(w, h) > MAXDIM) { const s = MAXDIM / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
            const canvas = document.createElement('canvas');
            const draw = (cw, ch) => { canvas.width = cw; canvas.height = ch; canvas.getContext('2d').drawImage(img, 0, 0, cw, ch); };
            draw(w, h);
            let q = 0.9, out = canvas.toDataURL('image/jpeg', q);
            while (approxBytes(out) > maxBytes && q > 0.4) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q); }
            while (approxBytes(out) > maxBytes && Math.max(canvas.width, canvas.height) > 400) {
                draw(Math.round(canvas.width * 0.8), Math.round(canvas.height * 0.8));
                out = canvas.toDataURL('image/jpeg', 0.8);
            }
            resolve(out);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
        img.src = url;
    });
}
