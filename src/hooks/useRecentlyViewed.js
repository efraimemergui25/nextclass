import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'nextclass_recently_viewed';
const MAX_ITEMS = 4;

const readFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * useRecentlyViewed
 *
 * Returns:
 *  - recentIds: string[]          — array of product IDs, newest first, max 4
 *  - trackView(id): void          — call on ProductDetailPage mount to record a view
 *  - clearHistory(): void         — optional utility to wipe history
 */
const useRecentlyViewed = () => {
    const [recentIds, setRecentIds] = useState(readFromStorage);

    // Persist to localStorage whenever the list changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentIds));
        } catch {
            // Quota exceeded — fail silently
        }
    }, [recentIds]);

    const trackView = useCallback((id) => {
        if (!id) return;
        setRecentIds(prev => {
            // Remove existing occurrence, prepend, cap at MAX_ITEMS
            const filtered = prev.filter(existingId => existingId !== id);
            return [id, ...filtered].slice(0, MAX_ITEMS);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setRecentIds([]);
    }, []);

    return { recentIds, trackView, clearHistory };
};

export default useRecentlyViewed;
