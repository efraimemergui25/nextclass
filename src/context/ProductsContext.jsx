/* eslint-disable */

/**
 * ProductsContext — Single Source of Truth for the entire site.
 *
 * Reads the real `products` collection from Firebase in real-time, with the local
 * seed (the 3 real monitors) as an offline fallback. No fabricated metadata.
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
import defaultProducts from '../data/products';

const ProductsContext = createContext(null);

// Module-level map: id → seed image URL (real manufacturer image, offline fallback)
const seedImageById = Object.fromEntries(defaultProducts.map(p => [p.id, p.image || '']));

// Neutral monitor placeholder (data-URI, always loads) — used when a product has no
// image at all (e.g. the HP model before a real photo is uploaded), so nothing renders
// as a broken/blank <img> anywhere on the site. `<img src="">` never fires onError.
const GENERIC_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23F5F5F7'/%3E%3Crect x='96' y='72' width='208' height='134' rx='10' fill='%23fff' stroke='%23C7C7CC' stroke-width='6'/%3E%3Crect x='170' y='214' width='60' height='16' rx='4' fill='%23C7C7CC'/%3E%3C/svg%3E";

// Normalise Firebase data. Firebase wins on all fields EXCEPT image: if Firebase
// returns an empty/missing image we restore the seed image, and if that's also empty
// we fall back to a neutral placeholder so a product is NEVER imageless anywhere.
function mergeWithMeta(rawProducts) {
    return rawProducts.map(p => {
        const seedImage = seedImageById[p.id] || '';
        const resolvedImage = (p.image && p.image.trim()) ? p.image : (seedImage || GENERIC_FALLBACK);
        return {
            ...p,
            image: resolvedImage,
            _seedImage: seedImage || GENERIC_FALLBACK,
        };
    });
}

export function ProductsProvider({ children }) {
    const [rawProducts, setRawProducts] = useState(defaultProducts);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'products'),
            (snap) => {
                if (!snap.empty) {
                    setRawProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                }
            },
            (err) => {
                // Firestore unavailable — keep using local seed data silently
                console.warn('ProductsContext: Firestore unavailable, using local data', err.code);
            }
        );
        return () => unsub();
    }, []);

    // Merge meta into every product
    const products = useMemo(() => mergeWithMeta(rawProducts), [rawProducts]);

    // Active products only
    const activeProducts = useMemo(
        () => products.filter((p) => p.isActive !== false),
        [products]
    );

    // Main (non-complementary) products power the hero/rank lists; complementary
    // accessories are surfaced only as add-ons on product pages + their own category.
    const mainProducts = useMemo(() => activeProducts.filter(p => !p.complementary), [activeProducts]);
    const complementaryProducts = useMemo(() => activeProducts.filter(p => p.complementary), [activeProducts]);

    // Computed ranked lists (exclude complementary accessories)
    const bestSellers = useMemo(
        () => [...mainProducts].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4),
        [mainProducts]
    );

    const newArrivals = useMemo(
        () => mainProducts.filter(p => p.isNew).slice(0, 4),
        [mainProducts]
    );

    const dealProducts = useMemo(
        () => mainProducts.filter(p => p.salePrice).slice(0, 4),
        [mainProducts]
    );

    const featuredProduct = useMemo(
        () => mainProducts.find(p => p.isFeatured) || mainProducts[0] || null,
        [mainProducts]
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

    const value = useMemo(() => ({
        products: productsWithBadges,
        activeProducts: activeProductsWithBadges,
        complementaryProducts,
        bestSellers,
        newArrivals,
        dealProducts,
        featuredProduct,
        getProductById,
        getActiveProductById,
    }), [productsWithBadges, activeProductsWithBadges, complementaryProducts, bestSellers, newArrivals, dealProducts, featuredProduct, getProductById, getActiveProductById]);

    return (
        <ProductsContext.Provider value={value}>
            {children}
        </ProductsContext.Provider>
    );
}

export function useProducts() {
    const ctx = useContext(ProductsContext);
    if (!ctx) throw new Error('useProducts must be used inside <ProductsProvider>');
    return ctx;
}
