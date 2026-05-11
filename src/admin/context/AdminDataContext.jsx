import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import initialProducts, { productMeta } from '../../data/products';
import { useAdminToast } from './AdminToastContext';

const AdminDataContext = createContext(null);

// ─── Analytics Engine (Real-Time Computation) ──────────────────────────────
function computeRealAnalytics(orders) {
    const days = 30;
    const labels = [];
    const visits = [];
    const sales = [];
    const revenue = [];
    
    // Load real visits
    let rawVisits = {};
    try { rawVisits = JSON.parse(localStorage.getItem('nextclass_visits') || '{}'); } catch {}

    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const iso = d.toISOString().split('T')[0];
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        
        labels.push(label);
        visits.push(rawVisits[iso] || 0);
        
        // Compute real sales and revenue for this day
        const dayOrders = orders.filter(o => {
            const od = new Date(o.dateTs || o.id);
            return od.toISOString().split('T')[0] === iso && o.status !== 'בוטל';
        });
        
        sales.push(dayOrders.length);
        revenue.push(dayOrders.reduce((sum, o) => sum + (o.total || 0), 0));
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
    const [loading, setLoading] = useState(true);

    const isInitialized = useRef({ orders: false, quotes: false, contacts: false, inventory: false });

    const analytics = React.useMemo(() => computeRealAnalytics(orders), [orders]);
    const products = inventory;

    // ─── Live Listeners (Firebase) ──────────────────────────────────────────
    useEffect(() => {
        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
            const newOrders = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => b.dateTs - a.dateTs);
            
            // Notification logic
            if (isInitialized.current.orders) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const order = change.doc.data();
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifOrders !== false) {
                            showToast(`הזמנה חדשה מ${order.customer || 'לקוח'}`, 'info');
                        }
                    }
                });
            }
            
            setOrders(newOrders);
            isInitialized.current.orders = true;
        });

        const unsubContacts = onSnapshot(collection(db, 'contacts'), (snap) => {
            const newContacts = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            
            if (isInitialized.current.contacts) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const contact = change.doc.data();
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifContacts === true) {
                            showToast(`פנייה חדשה מ${contact.name || 'לקוח'}`, 'warning');
                        }
                    }
                });
            }

            setContacts(newContacts);
            isInitialized.current.contacts = true;
        });

        const unsubInventory = onSnapshot(collection(db, 'products'), async (snap) => {
            if (snap.empty) {
                // Seed database if empty
                console.log("Seeding Firebase with initial products...");
                const toSeed = initialProducts.map(p => {
                    const meta = productMeta[p.id] || {};
                    return {
                        ...p,
                        ...meta,
                        stock: Math.floor(Math.random() * 50) + 10,
                        threshold: 5,
                        sold: meta.sold || Math.floor(Math.random() * 30),
                        isActive: true,
                        sku: p.sku || `SKU-${p.id || Math.floor(Math.random() * 9000 + 1000)}`,
                    };
                });
                toSeed.forEach(async (prod) => {
                    await setDoc(doc(db, 'products', prod.id.toString()), prod);
                });
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
            const newQuotes = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a, b) => b.dateTs - a.dateTs);
            if (isInitialized.current.quotes) {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const q = change.doc.data();
                        const settings = JSON.parse(localStorage.getItem('nextclass_settings') || '{}');
                        if (settings.notifOrders !== false) {
                            showToast(`בקשת הצעת מחיר חדשה מ${q.contactName || q.institution || 'לקוח'}`, 'info');
                        }
                    }
                });
            }
            setQuotes(newQuotes);
            isInitialized.current.quotes = true;
        });

        const unsubActivity = onSnapshot(collection(db, 'activity'), (snap) => {
            setActivityLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => b.ts - a.ts));
        });

        return () => {
            unsubOrders(); unsubQuotes(); unsubContacts(); unsubInventory(); unsubCoupons(); unsubActivity();
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
        await setDoc(doc(db, 'products', productId.toString()), { stock: newStock }, { merge: true });
        addActivity(`מלאי מוצר עודכן ל-${newStock} יח׳`, 'inventory');
    };

    const updateProductDetails = async (productId, updates) => {
        await setDoc(doc(db, 'products', productId.toString()), updates, { merge: true });
        if (updates.isActive !== undefined) {
            addActivity(`מוצר ${updates.isActive ? 'הופעל' : 'הושבת'}`, 'product');
        } else {
            addActivity(`פרטי מוצר עודכנו`, 'product');
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
    };

    const updateQuoteStatus = async (quoteId, newStatus) => {
        const now = new Date();
        const date = now.toLocaleDateString('he-IL');
        const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const quote = quotes.find(q => q.id === quoteId);
        const historyEntry = { status: newStatus, date, time };
        const history = [...(quote?.history || []), historyEntry];
        await setDoc(doc(db, 'quotes', quoteId), { status: newStatus, history }, { merge: true });
        addActivity(`הצעת מחיר ${quoteId} עודכנה ל"${newStatus}"`, 'order');
    };

    const addQuoteNote = async (quoteId, note) => {
        const quote = quotes.find(q => q.id === quoteId);
        const adminNotes = [...(quote?.adminNotes || []), { note, ts: Date.now(), date: new Date().toLocaleDateString('he-IL') }];
        await setDoc(doc(db, 'quotes', quoteId), { adminNotes }, { merge: true });
    };

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
            const meta = productMeta[p.id] || {};
            const data = {
                ...p,
                ...meta,
                stock: existing ? existing.stock : (Math.floor(Math.random() * 50) + 10),
                sold: existing ? existing.sold : (meta.sold || 0),
                threshold: existing ? existing.threshold : 5,
                isActive: existing ? (existing.isActive !== false) : true,
                sku: existing?.sku || p.sku || `SKU-${p.id}`,
            };
            batch.set(doc(db, 'products', p.id.toString()), data);
        });
        await batch.commit();
        addActivity(`בוצע סנכרון מחדש של בסיס הנתונים`, 'info');
    };

    // KPI calculations
    const kpis = React.useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'נמסר');
        const totalRevenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
        const thisMonth = orders.filter(o => {
            const d = new Date(o.dateTs);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const lowStock = inventory.filter(p => p.stock <= p.threshold);

        return {
            totalOrders: orders.length,
            totalRevenue,
            completedOrders: completedOrders.length,
            pendingOrders: orders.filter(o => o.status === 'ממתין' || o.status === 'חדש').length,
            thisMonthOrders: thisMonth.length,
            thisMonthRevenue: thisMonth.filter(o => o.status === 'נמסר').reduce((s, o) => s + (o.total || 0), 0),
            lowStockCount: lowStock.length,
            contactsNew: contacts.filter(c => c.status === 'חדש').length,
            conversionRate: (analytics.sales.reduce((a, b) => a + b, 0) / Math.max(1, analytics.visits.reduce((a, b) => a + b, 0)) * 100).toFixed(1),
            avgOrderValue: completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0,
        };
    }, [orders, inventory, contacts, analytics]);

    return (
        <AdminDataContext.Provider value={{
            orders, quotes, contacts, inventory, analytics, coupons, kpis, products, activityLog,
            updateOrderStatus, updateQuoteStatus, addQuoteNote, updateStock, updateProductDetails,
            addProduct, deleteProduct, updateContactStatus,
            addCoupon, toggleCoupon, deleteCoupon, addActivity, setOrders, setContacts,
            repairProductImages, reseedDatabase
        }}>
            {children}
        </AdminDataContext.Provider>
    );
}

export function useAdminData() {
    const ctx = useContext(AdminDataContext);
    if (!ctx) throw new Error('useAdminData must be inside AdminDataProvider');
    return ctx;
}

