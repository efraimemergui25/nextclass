import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import DEFAULT_SETTINGS from '../data/cms-settings.json';

const SettingsContext = createContext();

const CMS_SECRET = import.meta.env.VITE_CMS_SECRET || '';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const saveQueue = useRef(Promise.resolve());

    // Real-time Firestore sync — any admin save is visible site-wide in <100ms
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'config', 'cms'),
            (snap) => {
                if (snap.exists()) {
                    setSettings(() => ({ ...DEFAULT_SETTINGS, ...snap.data() }));
                }
            },
            (err) => console.warn('[CMS] Firestore listener error:', err.message)
        );
        return () => unsub();
    }, []);

    const getSetting = useCallback((key, defaultValue) => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]);

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    const updateGlobalSettings = useCallback(async (newSettings) => {
        const previous = settings;
        // Optimistic update
        setSettings(prev => ({ ...prev, ...newSettings }));

        // Write to Firestore immediately — all clients see change in <100ms
        setDoc(doc(db, 'config', 'cms'), newSettings, { merge: true }).catch(err =>
            console.warn('[CMS] Firestore write error:', err.message)
        );

        // Also persist to GitHub JSON (for SSR/CDN cold starts) — queued to avoid SHA conflicts
        saveQueue.current = saveQueue.current.then(async () => {
            try {
                const res = await fetch('/api/cms-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-cms-secret': CMS_SECRET,
                    },
                    body: JSON.stringify(newSettings),
                });
                if (!res.ok) throw new Error(await res.text());
            } catch (err) {
                setSettings(previous);
                console.error('[CMS] GitHub save failed, rolled back:', err.message);
                throw err;
            }
        });

        return saveQueue.current;
    }, [settings]);

    const seedMissingDefaults = useCallback(() => {}, []);

    // Only [settings] as dependency — all functions change only when settings changes anyway
    const value = useMemo(() => ({
        settings,
        getSetting,
        isVisible,
        updateGlobalSettings,
        seedMissingDefaults,
        firestoreLoaded: true,
    }), [settings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
