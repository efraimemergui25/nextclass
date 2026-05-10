/* eslint-disable */

/**
 * ProductsContext — Single Source of Truth for the entire site.
 *
 * Reads from Firebase in real-time. productMeta overlays seed data
 * (sold counts, isNew, isFeatured, salePrice) — Firebase admin edits win.
 *
 * Exports:
 *  products         — all products (with _isBestSeller computed)
 *  activeProducts   — isActive !== false
 *  bestSellers      — top 4 by sold count
 *  newArrivals      — isNew === true, up to 4
 *  dealProducts     — has salePrice, up to 4
 *  featuredProduct  — isFeatured === true, or first active product
 *  getProductById / getActiveProductById
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import defaultProducts, { productMeta } from '../data/products';

const ProductsContext = createContext(null);

// Merge productMeta defaults with Firebase data (Firebase wins on conflict)
function mergeWithMeta(rawProducts) {
    return rawProducts.map(p => ({
        ...(productMeta[p.id] || {}),  // seed defaults
        ...p,                           // Firebase data overrides
    }));
}

export function ProductsProvider({ children }) {
    const [rawProducts, setRawProducts] = useState(defaultProducts);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'products'), (snap) => {
            if (!snap.empty) {
                setRawProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            }
        });
        return () => unsub();
    }, []);

    // Merge meta into every product
    const products = useMemo(() => mergeWithMeta(rawProducts), [rawProducts]);

    // Active products only
    const activeProducts = useMemo(
        () => products.filter((p) => p.isActive !== false),
        [products]
    );

    // Computed ranked lists
    const bestSellers = useMemo(
        () => [...activeProducts].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4),
        [activeProducts]
    );

    const newArrivals = useMemo(
        () => activeProducts.filter(p => p.isNew).slice(0, 4),
        [activeProducts]
    );

    const dealProducts = useMemo(
        () => activeProducts.filter(p => p.salePrice).slice(0, 4),
        [activeProducts]
    );

    const featuredProduct = useMemo(
        () => activeProducts.find(p => p.isFeatured) || activeProducts[0] || null,
        [activeProducts]
    );

    // Add _isBestSeller flag for ProductCard badges
    const topSellerIds = useMemo(() => new Set(bestSellers.map(p => p.id)), [bestSellers]);

    const productsWithBadges = useMemo(
        () => products.map(p => ({ ...p, _isBestSeller: topSellerIds.has(p.id) })),
        [products, topSellerIds]
    );

    const activeProductsWithBadges = useMemo(
        () => productsWithBadges.filter(p => p.isActive !== false),
        [productsWithBadges]
    );

    const getProductById = useCallback(
        (id) => productsWithBadges.find((p) => p.id === id) ?? null,
        [productsWithBadges]
    );

    const getActiveProductById = useCallback(
        (id) => activeProductsWithBadges.find((p) => p.id === id) ?? null,
        [activeProductsWithBadges]
    );

    return (
        <ProductsContext.Provider value={{
            products: productsWithBadges,
            activeProducts: activeProductsWithBadges,
            bestSellers,
            newArrivals,
            dealProducts,
            featuredProduct,
            getProductById,
            getActiveProductById,
        }}>
            {children}
        </ProductsContext.Provider>
    );
}

export function useProducts() {
    const ctx = useContext(ProductsContext);
    if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>');
    return ctx;
}
