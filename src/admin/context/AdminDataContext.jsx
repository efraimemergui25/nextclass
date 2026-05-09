/* eslint-disable */

// Simulated data context for the admin panel.
// In a real production system, this would connect to a backend API / Firebase / Supabase.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import initialProducts, { productMeta } from '../../data/products';

const AdminDataContext = createContext(null);

// ─── Firebase Migration Helpers ──────────────────────────────────────────────
const loadLocalData = (key, fallback) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

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
    // ─── Firebase State ────────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
    const [loading, setLoading] = useState(true);

    const analytics = React.useMemo(() => computeRealAnalytics(orders), [orders]);
    const products = inventory;

    // ─── Live Listeners (Firebase) ──────────────────────────────────────────
    useEffect(() => {
        const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
            setOrders(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => b.dateTs - a.dateTs));
        });
        const unsubContacts = onSnapshot(collection(db, 'contacts'), (snap) => {
            setContacts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        const unsubInventory = onSnapshot(collection(db, 'products'), async (snap) => {
            if (snap.empty) {
                // Seed database if empty
                console.log("Seeding Firebase with initial products...");
                const localInv = loadLocalData('nextclass_inventory', null);
                const toSeed = localInv || initialProducts.map(p => {
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
                setInventory(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setLoading(false);
            }
        });
        const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
            setCoupons(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        const unsubActivity = onSnapshot(collection(db, 'activity'), (snap) => {
            setActivityLog(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).sort((a,b) => b.ts - a.ts));
        });

        return () => {
            unsubOrders(); unsubContacts(); unsubInventory(); unsubCoupons(); unsubActivity();
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

    // KPI calculations
    const kpis = React.useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'נמסר');
        const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0);
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
            thisMonthRevenue: thisMonth.filter(o => o.status === 'נמסר').reduce((s, o) => s + o.total, 0),
            lowStockCount: lowStock.length,
            contactsNew: contacts.filter(c => c.status === 'חדש').length,
            conversionRate: (analytics.sales.reduce((a, b) => a + b, 0) / Math.max(1, analytics.visits.reduce((a, b) => a + b, 0)) * 100).toFixed(1),
            avgOrderValue: completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0,
        };
    }, [orders, inventory, contacts, analytics]);

    return (
        <AdminDataContext.Provider value={{
            orders, contacts, inventory, analytics, coupons, kpis, products, activityLog,
            updateOrderStatus, updateStock, updateProductDetails, addProduct, deleteProduct, updateContactStatus,
            addCoupon, toggleCoupon, deleteCoupon, addActivity, setOrders, setContacts
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
