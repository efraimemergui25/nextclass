import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, where, getDocs, writeBatch, increment, arrayUnion, serverTimestamp, limit } from 'firebase/firestore';
import { db, storage } from '../../firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import initialProducts from '../../data/products';
import CMS_CLEAN_OVERRIDES from '../../data/cmsCleanOverrides';
import { buildAmalPO, amalPoHtml } from '../../data/amalPO';
import { useAdminToast } from './AdminToastContext';

const AdminDataContext = createContext(null);

// ─── Analytics Engine (Real-Time Computation) ──────────────────────────────
const CLOSED_QUOTE_STATUSES = ['נסגר', 'סופק'];

function computeRealAnalytics(orders, firestoreVisits = {}, quotes = []) {
    const days = 30;
    const labels = [];
    const visits = [];
    const sales = [];
    const revenue = [];

    const quoteTotal = q => (q.items || []).reduce((s, item) => {
        return s + ((Number(item.salePrice) || Number(item.price) || 0) * (Number(item.qty) || Number(item.quantity) || 1));
    }, 0) || Number(q.subtotal) || 0;

    const now = new Date();

    // Pre-index by date to avoid O(n²) filtering
    const ordersByDate = {};
    orders.forEach(o => {
        if (!o.dateTs) return;
        const iso = new Date(o.dateTs).toISOString().split('T')[0];
        if (!ordersByDate[iso]) ordersByDate[iso] = [];
        ordersByDate[iso].push(o);
    });
    const quotesByDate = {};
    quotes.forEach(q => {
        if (!q.dateTs) return;
        const iso = new Date(q.dateTs).toISOString().split('T')[0];
        if (!quotesByDate[iso]) quotesByDate[iso] = [];
        quotesByDate[iso].push(q);
    });

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const iso = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;

        labels.push(label);
        visits.push(firestoreVisits[iso] || 0);

        // Sales = non-cancelled e-commerce orders + closed pipeline quotes
        const dayOrders = (ordersByDate[iso] || []).filter(o => o.status !== 'בוטל' && o.source !== 'quote');
        const dayClosedQuotes = (quotesByDate[iso] || []).filter(q => CLOSED_QUOTE_STATUSES.includes(q.status));

        // Revenue = completed e-commerce orders + closed quotes
        const dayCompletedOrders = (ordersByDate[iso] || []).filter(o => o.status === 'נמסר' && o.source !== 'quote');

        sales.push(dayOrders.length + dayClosedQuotes.length);
        revenue.push(
            dayCompletedOrders.reduce((sum, o) => sum + (o.total || 0), 0) +
            dayClosedQuotes.reduce((sum, q) => sum + quoteTotal(q), 0)
        );
    }

    return { labels, visits, sales, revenue };
}

export function AdminDataProvider({ children }) {
    const { showToast } = useAdminToast();
    
    // ─── Firebase State ────────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [pageViewsByDate, setPageViewsByDate] = useState({});
    const [loading, setLoading] = useState(true);
    const [ordersSeenAt, setOrdersSeenAt] = useState(() => Number(localStorage.getItem('nc-orders-seen-at') || 0));
    const [deletedItems, setDeletedItems] = useState({ orders: [], quotes: [], contacts: [] });

    const isInitialized = useRef({ orders: false, quotes: false, contacts: false, inventory: false });

    const analytics = React.useMemo(() => computeRealAnalytics(orders, pageViewsByDate, quotes), [orders, pageViewsByDate, quotes]);
    const products = inventory;

    // ─── Live Listeners (Firebase) ──────────────────────────────────────────
    useEffect(() => {
        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
            const all = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => b.dateTs - a.dateTs);

            // Notification logic
            if (isInitialized.current.orders) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const order = change.doc.data();
                        if (order.deleted) return;
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifOrders !== false) {
                            showToast(`הזמנה חדשה מ${order.customer || 'לקוח'}`, 'info');
                        }
                    }
                });
            }

            setOrders(all.filter(o => !o.deleted));
            setDeletedItems(prev => ({
                ...prev,
                orders: all.filter(o => o.deleted).sort((a,b) => (b.deletedAt||0) - (a.deletedAt||0)),
            }));
            isInitialized.current.orders = true;
        });

        const unsubContacts = onSnapshot(collection(db, 'contacts'), (snap) => {
            const all = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            if (isInitialized.current.contacts) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const contact = change.doc.data();
                        if (contact.deleted) return;
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifContacts === true) {
                            showToast(`פנייה חדשה מ${contact.name || 'לקוח'}`, 'warning');
                        }
                    }
                });
            }

            setContacts(all.filter(c => !c.deleted));
            setDeletedItems(prev => ({
                ...prev,
                contacts: all.filter(c => c.deleted).sort((a,b) => (b.deletedAt||0) - (a.deletedAt||0)),
            }));
            isInitialized.current.contacts = true;
        });

        const unsubInventory = onSnapshot(collection(db, 'products'), async (snap) => {
            if (snap.empty) {
                // Seed database if empty
                console.log("Seeding Firebase with initial products...");
                const toSeed = initialProducts.map(p => ({
                    ...p,
                    stock: p.stock ?? 0,
                    threshold: p.threshold ?? 5,
                    sold: 0,
                    isActive: p.isActive !== false,
                    sku: p.sku || `NC-${p.id}`,
                }));
                const seedBatch = writeBatch(db);
                toSeed.forEach(prod => {
                    seedBatch.set(doc(db, 'products', prod.id.toString()), prod);
                });
                seedBatch.commit().catch(err => console.warn('Seed batch failed', err));
            } else {
                const newInv = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                
                // Low stock notification
                if (isInitialized.current.inventory) {
                    snap.docChanges().forEach(change => {
                        if (change.type === 'modified') {
                            const p = change.doc.data();
                            if (p.stock <= p.threshold && p.stock > 0) {
                                const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                                if (settings.notifLowStock !== false) {
                                    showToast(`מלאי נמוך: ${p.title}`, 'warning');
                                }
                            }
                        }
                    });
                }

                setInventory(newInv);
                setLoading(false);
                isInitialized.current.inventory = true;
            }
        });

        const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
            setCoupons(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });

        const unsubQuotes = onSnapshot(collection(db, 'quotes'), (snap) => {
            const all = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => b.dateTs - a.dateTs);
            if (isInitialized.current.quotes) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const q = change.doc.data();
                        if (q.deleted) return;
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifOrders !== false) {
                            showToast(`בקשת הצעת מחיר חדשה מ${q.contactName || q.institution || 'לקוח'}`, 'info');
                        }
                    }
                });
            }
            setQuotes(all.filter(q => !q.deleted));
            setDeletedItems(prev => ({
                ...prev,
                quotes: all.filter(q => q.deleted).sort((a,b) => (b.deletedAt||0) - (a.deletedAt||0)),
                orders: prev.orders, // keep orders as-is; updated in orders listener
            }));
            isInitialized.current.quotes = true;
        });

        const unsubActivity = onSnapshot(query(collection(db, 'activity'), orderBy('ts', 'desc'), limit(50)), (snap) => {
            setActivityLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });

        // Real page view tracking from Firestore (last 90 days)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffStr = cutoff.toISOString().split('T')[0];
        const pvQuery = query(
            collection(db, 'page_views'),
            where('date', '>=', cutoffStr),
            orderBy('date', 'desc'),
            limit(500)
        );
        const unsubPageViews = onSnapshot(pvQuery, (snap) => {
            const byDate = {};
            snap.docs.forEach(d => {
                const { date } = d.data();
                if (date) byDate[date] = (byDate[date] || 0) + 1;
            });
            setPageViewsByDate(byDate);
        }, () => {});

        return () => {
            unsubOrders(); unsubQuotes(); unsubContacts(); unsubInventory(); unsubCoupons(); unsubActivity(); unsubPageViews();
        };
    }, []);

    // ─── Actions (Writing to Firebase) ──────────────────────────────────────
    const addActivity = async (message, type = 'info') => {
        const id = Date.now().toString();
        await setDoc(doc(db, 'activity', id), {
            id, message, type, ts: Date.now(),
            date: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        });
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        await setDoc(doc(db, 'orders', orderId.toString()), { status: newStatus }, { merge: true });
        addActivity(`הזמנה ${orderId} עודכנה ל"${newStatus}"`, 'order');
    };

    const updateStock = async (productId, newStock) => {
        try {
            await setDoc(doc(db, 'products', productId.toString()), { stock: newStock }, { merge: true });
            addActivity(`מלאי מוצר עודכן ל-${newStock} יח׳`, 'inventory');
            return true;
        } catch (err) {
            console.error('[updateStock]', err);
            return false;
        }
    };

    const updateProductDetails = async (productId, updates) => {
        try {
            await setDoc(doc(db, 'products', productId.toString()), updates, { merge: true });
            if (updates.isActive !== undefined) {
                addActivity(`מוצר ${updates.isActive ? 'הופעל' : 'הושבת'}`, 'product');
            } else {
                addActivity(`פרטי מוצר עודכנו`, 'product');
            }
            return true;
        } catch (err) {
            console.error('[updateProductDetails]', err);
            return false;
        }
    };

    const addProduct = async (newProduct) => {
        const id = `PROD-${Date.now()}`;
        await setDoc(doc(db, 'products', id), {
            ...newProduct,
            id,
            stock: Number(newProduct.stock) || 0,
            threshold: 5,
            sold: 0,
        });
        addActivity(`מוצר חדש נוסף: ${newProduct.title}`, 'product');
        return id;
    };

    const updateQuoteStatus = async (quoteId, newStatus) => {
        const now  = new Date();
        const date = now.toLocaleDateString('he-IL');
        const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const quote = quotes.find(q => q.id === quoteId);
        const history = [...(quote?.history || []), { status: newStatus, date, time, ts: now.getTime() }];

        const batch = writeBatch(db);

        // 1. Update quote status + history
        batch.set(doc(db, 'quotes', quoteId), { status: newStatus, history }, { merge: true });

        // 2. Inventory + sales sync
        if (quote?.items?.length) {
            if (newStatus === 'נסגר' && !quote.inventorySettled) {
                // Deal closed → decrement stock & reserved, increment sold
                quote.items.forEach(item => {
                    const qty = Number(item.qty) || 1;
                    batch.update(doc(db, 'products', String(item.id)), {
                        stock:    increment(-qty),
                        reserved: increment(-qty),
                        sold:     increment(qty),
                    });
                });
                batch.set(doc(db, 'quotes', quoteId), { inventorySettled: 'closed' }, { merge: true });
                addActivity(`מלאי עודכן אוטומטית — עסקה נסגרה (${quoteId})`, 'inventory');
            } else if (newStatus === 'סופק') {
                // Supplied → only settle inventory if it hasn't been settled by a previous נסגר/סופק
                // Guard: 'closed' and 'supplied' are both settled states — never double-decrement
                const alreadySettled = quote.inventorySettled === 'closed' || quote.inventorySettled === 'supplied';
                if (!alreadySettled) {
                    quote.items.forEach(item => {
                        const qty = Number(item.qty) || 1;
                        batch.update(doc(db, 'products', String(item.id)), {
                            stock:    increment(-qty),
                            reserved: increment(-qty),
                            sold:     increment(qty),
                        });
                    });
                }
                batch.set(doc(db, 'quotes', quoteId), { inventorySettled: 'supplied' }, { merge: true });
                // Record sale in orders collection for analytics
                const saleTotal = quote.items.reduce((s, item) => s + ((Number(item.salePrice) || Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
                const saleRecord = {
                    source: 'quote', quoteId, status: 'נמסר',
                    createdAt: serverTimestamp(),
                    dateTs: Date.now(),
                    total: saleTotal, items: quote.items,
                    contactName: quote.contactName || '',
                    institution: quote.institution || '',
                };
                batch.set(doc(db, 'orders', `sale_${quoteId}`), saleRecord, { merge: true });
                addActivity(`עסקה סופקה — הכנסה ₪${saleTotal.toLocaleString()} נרשמה (${quoteId})`, 'order');
            } else if (newStatus === 'אבד' && !quote.inventorySettled) {
                // Deal lost → release reservation only, no stock change
                quote.items.forEach(item => {
                    const qty = Number(item.qty) || 1;
                    batch.update(doc(db, 'products', String(item.id)), {
                        reserved: increment(-qty),
                    });
                });
                batch.set(doc(db, 'quotes', quoteId), { inventorySettled: 'lost' }, { merge: true });
                addActivity(`שמירת מלאי שוחררה — עסקה אבדה (${quoteId})`, 'inventory');
            }
        }

        await batch.commit();
        addActivity(`הצעת מחיר ${quoteId} עודכנה ל"${newStatus}"`, 'order');
    };

    const updateQuoteFields = async (quoteId, fields) => {
        await setDoc(doc(db, 'quotes', quoteId), fields, { merge: true });
    };

    const addQuoteNote = async (quoteId, note) => {
        const quote = quotes.find(q => q.id === quoteId);
        const adminNotes = [...(quote?.adminNotes || []), { note, ts: Date.now(), date: new Date().toLocaleDateString('he-IL') }];
        await setDoc(doc(db, 'quotes', quoteId), { adminNotes }, { merge: true });
    };

    const setQuoteCustomerMessage = async (quoteId, message) => {
        await setDoc(doc(db, 'quotes', quoteId), { customerMessage: message || null }, { merge: true });
    };

    const sendThreadMessage = useCallback(async (quoteId, text) => {
        const msg = { id: `${Date.now()}_${Math.random().toString(36).slice(2,6)}`, from: 'admin', text: text.trim(), tsNum: Date.now() };
        await setDoc(doc(db, 'quotes', quoteId), { thread: arrayUnion(msg), unreadCustomer: true, unreadAdmin: false }, { merge: true });
    }, []);

    const markAdminThreadRead = useCallback(async (quoteId) => {
        await setDoc(doc(db, 'quotes', quoteId), { unreadAdmin: false }, { merge: true });
    }, []);

    const updateContactStatus = async (id, status) => {
        await setDoc(doc(db, 'contacts', id.toString()), { status }, { merge: true });
        addActivity(`פנייה עודכנה לסטטוס "${status}"`, 'info');
    };

    const addCoupon = async (coupon) => {
        const id = Date.now().toString();
        await setDoc(doc(db, 'coupons', id), { ...coupon, id, uses: 0 });
        addActivity(`קופון חדש נוסף: ${coupon.code}`, 'coupon');
    };
    const toggleCoupon = async (id) => {
        const coupon = coupons.find(c => c.id === id);
        if (coupon) {
            await setDoc(doc(db, 'coupons', id.toString()), { active: !coupon.active }, { merge: true });
            addActivity(`קופון ${coupon.code} ${coupon.active ? 'הושבת' : 'הופעל'}`, 'coupon');
        }
    };
    const deleteCoupon = async (id) => {
        const coupon = coupons.find(c => c.id === id);
        await deleteDoc(doc(db, 'coupons', id.toString()));
        if (coupon) addActivity(`קופון ${coupon.code} נמחק`, 'coupon');
    };

    const deleteOrder = async (id) => {
        const order = orders.find(o => o.id === id);
        await setDoc(doc(db, 'orders', id), { deleted: true, deletedAt: Date.now() }, { merge: true });
        addActivity(`הזמנה הועברה לסל${order ? ` — ${order.customer || ''}` : ''}`, 'order');
    };

    const restoreOrder = async (id) => {
        await setDoc(doc(db, 'orders', id), { deleted: false, deletedAt: null }, { merge: true });
        addActivity('הזמנה שוחזרה מהסל', 'order');
    };

    const hardDeleteOrder = async (id) => {
        await deleteDoc(doc(db, 'orders', id));
        addActivity('הזמנה נמחקה לצמיתות', 'order');
    };

    const deleteQuote = async (id) => {
        const quote = quotes.find(q => q.id === id);
        await setDoc(doc(db, 'quotes', id), { deleted: true, deletedAt: Date.now() }, { merge: true });
        addActivity(`הצעה הועברה לסל${quote ? ` — ${quote.name || ''}` : ''}`, 'quote');
    };

    const restoreQuote = async (id) => {
        await setDoc(doc(db, 'quotes', id), { deleted: false, deletedAt: null }, { merge: true });
        addActivity('הצעה שוחזרה מהסל', 'quote');
    };

    const hardDeleteQuote = async (id) => {
        await deleteDoc(doc(db, 'quotes', id));
        addActivity('הצעה נמחקה לצמיתות', 'quote');
    };

    const deleteContact = async (id) => {
        await setDoc(doc(db, 'contacts', id), { deleted: true, deletedAt: Date.now() }, { merge: true });
        addActivity('פנייה הועברה לסל', 'contact');
    };

    const restoreContact = async (id) => {
        await setDoc(doc(db, 'contacts', id), { deleted: false, deletedAt: null }, { merge: true });
        addActivity('פנייה שוחזרה מהסל', 'contact');
    };

    const hardDeleteContact = async (id) => {
        await deleteDoc(doc(db, 'contacts', id));
        addActivity('פנייה נמחקה לצמיתות', 'contact');
    };

    const deleteProduct = async (productId) => {
        const product = inventory.find(p => String(p.id) === String(productId));
        await deleteDoc(doc(db, 'products', productId.toString()));
        addActivity(`מוצר נמחק${product ? `: ${product.title}` : ''}`, 'product');
    };

    // ─── Database Maintenance ───────────────────────────────────────────────
    const repairProductImages = async () => {
        const batch = writeBatch(db);
        let count = 0;
        inventory.forEach(p => {
            const original = initialProducts.find(op => op.id === p.id);
            if (original && original.image !== p.image) {
                batch.update(doc(db, 'products', p.id.toString()), { image: original.image });
                count++;
            }
        });
        if (count > 0) {
            await batch.commit();
            addActivity(`בוצע תיקון של ${count} תמונות מוצרים`, 'info');
        }
        return count;
    };

    const reseedDatabase = async () => {
        // This updates everything from initialProducts but keeps stock and sold
        const batch = writeBatch(db);
        initialProducts.forEach(p => {
            const existing = inventory.find(ep => ep.id === p.id);
            const data = {
                ...p,
                stock: existing ? existing.stock : (p.stock ?? 0),
                sold: existing ? existing.sold : 0,
                threshold: existing ? existing.threshold : (p.threshold ?? 5),
                isActive: existing ? (existing.isActive !== false) : true,
                sku: existing?.sku || p.sku || `NC-${p.id}`,
            };
            batch.set(doc(db, 'products', p.id.toString()), data);
        });
        await batch.commit();
        addActivity(`בוצע סנכרון מחדש של בסיס הנתונים`, 'info');
    };

    // ─── Launch Cleanup ─────────────────────────────────────────────────────
    // Overwrite ONLY the known fabricated CMS keys with clean values (merge),
    // neutralising fake testimonials/stats/partners/reviews/timeline in the LIVE db
    // without touching any legitimate configuration.
    const resetMarketingContent = async () => {
        await setDoc(doc(db, 'config', 'cms'), CMS_CLEAN_OVERRIDES, { merge: true });
        addActivity('תוכן שיווקי אופס לברירות מחדל נקיות (הוסרו נתונים פקטיביים)', 'info');
        return Object.keys(CMS_CLEAN_OVERRIDES).length;
    };

    // Delete EVERY product, then seed exactly the 3 real monitors. Destructive —
    // guarded by a confirmation in the UI. Guarantees a clean launch catalog.
    const wipeAndReseedCatalog = async () => {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        let removed = 0;
        snap.forEach(d => { batch.delete(d.ref); removed++; });
        initialProducts.forEach(p => {
            batch.set(doc(db, 'products', p.id.toString()), {
                ...p,
                stock: p.stock ?? 0,
                threshold: p.threshold ?? 5,
                sold: 0,
                isActive: true,
                sku: p.sku || `NC-${p.id}`,
            });
        });
        await batch.commit();
        addActivity(`קטלוג אופס: נמחקו ${removed} מוצרים, נטענו ${initialProducts.length} מסכים אמיתיים`, 'product');
        return { removed, seeded: initialProducts.length };
    };

    // Purge demo dashboard data. Keeps products/suppliers/supplier_quotes/supplier_orders.
    const purgeDemoData = async () => {
        const CLEAR = ['orders','quotes','leads','contacts','customers','newsletter_subs','product_questions','activity','page_views','pending_emails','coupons','comm_templates','security_logs'];
        let total = 0;
        for (const name of CLEAR) {
            const snap = await getDocs(collection(db, name));
            const docs = snap.docs;
            for (let i = 0; i < docs.length; i += 400) {
                const b = writeBatch(db);
                docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
                await b.commit();
            }
            total += docs.length;
        }
        addActivity(`נמחקו ${total} רשומות דמו מהדשבורד`, 'info');
        return total;
    };

    // One-time: create the first real order from the Amal PO + save a document to the vault.
    const createAmalFirstOrder = async () => {
        const PO = buildAmalPO();
        await setDoc(doc(db, 'quotes', PO.id), PO);
        await setDoc(doc(db, 'ocr_intakes', PO.id), { ...PO, kind: 'purchase_order', status: 'approved', approvedAt: PO.createdTs, confidence: 100, createdAt: serverTimestamp() });
        const html = amalPoHtml(PO);
        const path = 'vault/PO-80363169_amal.html';
        const r = storageRef(storage, path);
        await uploadString(r, html, 'raw', { contentType: 'text/html' });
        const url = await getDownloadURL(r);
        await setDoc(doc(db, 'vault_documents', PO.id), {
            id: PO.id, name: 'הזמנת רכש 80363169 — עמל (צפת מעיינות)', type: 'text/html', url, path,
            folder: 'quotes', classification: 'approved', tags: ['עמל', 'הזמנת רכש'],
            source: 'po', relatedOrderId: PO.id, size: html.length, createdAt: serverTimestamp(),
        });
        addActivity('נוצרה הזמנה ראשונה מ-PO עמל 80363169 ונשמרה בכספת', 'order');
        return PO.id;
    };

    // KPI calculations — includes both orders (e-commerce) and quotes (pipeline)
    const kpis = React.useMemo(() => {
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear  = now.getFullYear();

        // Helper: revenue from a quote's items
        const quoteTotal = q => (q.items || []).reduce((s, item) => {
            const price = Number(item.salePrice) || Number(item.price) || 0;
            const qty   = Number(item.qty) || Number(item.quantity) || 1;
            return s + price * qty;
        }, 0) || Number(q.subtotal) || 0;

        // Closed pipeline deals (status = נסגר or סופק)
        const closedQuotes   = quotes.filter(q => CLOSED_QUOTE_STATUSES.includes(q.status));
        const quoteRevenue   = closedQuotes.reduce((s, q) => s + quoteTotal(q), 0);

        // E-commerce orders
        const completedOrders = orders.filter(o => o.status === 'נמסר' && o.source !== 'quote');
        const orderRevenue    = completedOrders.reduce((s, o) => s + (o.total || 0), 0);

        const totalRevenue   = quoteRevenue + orderRevenue;
        const totalDeals     = closedQuotes.length + completedOrders.length;

        // This-month slices
        const inThisMonth = ts => { const d = new Date(ts); return d.getMonth() === curMonth && d.getFullYear() === curYear; };
        const thisMonthClosedQuotes = closedQuotes.filter(q => inThisMonth(q.dateTs || 0));
        const thisMonthOrders       = orders.filter(o => inThisMonth(o.dateTs));
        const thisMonthRevenue =
            thisMonthClosedQuotes.reduce((s, q) => s + quoteTotal(q), 0) +
            thisMonthOrders.filter(o => o.status === 'נמסר' && o.source !== 'quote').reduce((s, o) => s + (o.total || 0), 0);

        // Conversion: closed deals / total quotes entered pipeline
        // Never fall back to web-visitor analytics — those are completely different metrics
        const totalPipelineQuotes = quotes.filter(q => q.status !== undefined).length;
        const conversionRate = totalPipelineQuotes > 0
            ? (closedQuotes.length / totalPipelineQuotes * 100).toFixed(1)
            : '0.0';

        const lowStock = inventory.filter(p => p.stock <= p.threshold);

        return {
            totalOrders:      orders.filter(o => o.source !== 'quote').length,
            totalRevenue,
            completedOrders:  totalDeals,
            allPendingOrders: orders.filter(o => o.status === 'ממתין' || o.status === 'חדש').length,
            thisMonthOrders:  thisMonthOrders.length,
            thisMonthRevenue,
            lowStockCount:    lowStock.length,
            contactsNew:      contacts.filter(c => c.status === 'חדש').length,
            conversionRate,
            avgOrderValue:    totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0,
            // Quote alerts
            newQuotes:    quotes.filter(q => q.status === 'חדש' && (q.dateTs || 0) > ordersSeenAt).length,
            unreadQuotes: quotes.filter(q => q.unreadAdmin === true && (q.dateTs || 0) > ordersSeenAt).length,
            pendingOrders: orders.filter(o => (o.status === 'ממתין' || o.status === 'חדש') && (o.dateTs || 0) > ordersSeenAt).length,
            stalledLeads: quotes.filter(q => ['ביצירת קשר', 'הוצע מחיר', 'במשא ומתן'].includes(q.status)).length,
            // Pipeline-specific
            pipelineActive:  quotes.filter(q => !CLOSED_QUOTE_STATUSES.includes(q.status) && q.status !== 'אבד').length,
            pipelineRevenue: quoteRevenue,
            // Due reminders (single reminderAt per quote, matches ReminderModal schema)
            dueReminders: quotes
                .filter(q => q.reminderAt && !q.reminderCleared && q.reminderAt <= Date.now())
                .map(q => ({ quoteId: q.id, dueAt: q.reminderAt, note: q.reminderNote || '', quote: q }))
                .sort((a, b) => a.dueAt - b.dueAt),
        };
    }, [orders, inventory, contacts, analytics, quotes, ordersSeenAt]);

    const markOrdersSeen = useCallback(() => {
        const now = Date.now();
        localStorage.setItem('nc-orders-seen-at', String(now));
        setOrdersSeenAt(now);
    }, []);

    const clearReminder = useCallback(async (quoteId) => {
        await setDoc(doc(db, 'quotes', quoteId), { reminderAt: null, reminderNote: null, reminderCleared: true }, { merge: true });
    }, []);

    const ctxValue = useMemo(() => ({
        orders, quotes, contacts, inventory, analytics, coupons, kpis, products, activityLog,
        updateOrderStatus, updateQuoteStatus, updateQuoteFields, addQuoteNote, setQuoteCustomerMessage,
        sendThreadMessage, markAdminThreadRead,
        updateStock, updateProductDetails,
        addProduct, deleteProduct, updateContactStatus,
        addCoupon, toggleCoupon, deleteCoupon, addActivity, setOrders, setContacts,
        repairProductImages, reseedDatabase, resetMarketingContent, wipeAndReseedCatalog, purgeDemoData, createAmalFirstOrder, markOrdersSeen, clearReminder,
        deleteOrder, restoreOrder, hardDeleteOrder,
        deleteQuote, restoreQuote, hardDeleteQuote,
        deleteContact, restoreContact, hardDeleteContact,
        deletedItems,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [orders, quotes, contacts, inventory, analytics, coupons, kpis, products, activityLog, deletedItems]);

    return (
        <AdminDataContext.Provider value={ctxValue}>
            {children}
        </AdminDataContext.Provider>
    );
}

export function useAdminData() {
    const ctx = useContext(AdminDataContext);
    if (!ctx) throw new Error('useAdminData must be inside AdminDataProvider');
    return ctx;
}

