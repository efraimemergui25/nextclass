import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const SettingsContext = createContext();

const LS_KEY = 'nextclass_cms_settings';
const FIREBASE_DOC_ID = 'global_config';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // True once the first Firestore snapshot has arrived — prevents false seeding on empty state
    const [firestoreLoaded, setFirestoreLoaded] = useState(false);
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    // ─── Live Firestore Sync ────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'cms_settings', FIREBASE_DOC_ID),
            (snap) => {
                if (snap.exists()) {
                    const cloudData = snap.data();
                    setSettings(cloudData);
                    localStorage.setItem(LS_KEY, JSON.stringify(cloudData));
                }
                setFirestoreLoaded(true);
            },
            (err) => {
                console.warn('SettingsContext: Firestore unavailable, using local cache', err.code);
                setFirestoreLoaded(true); // still mark loaded so admin can seed
            }
        );

        const handleStorageChange = (e) => {
            if (e.key === LS_KEY) {
                try { setSettings(JSON.parse(e.newValue || '{}')); } catch {}
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            unsub();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getSetting = useCallback((key, defaultValue) => {
        const val = settingsRef.current[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]); // settings in deps → new reference on every Firestore update → useMemo/useEffect consumers re-run

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    const updateGlobalSettings = useCallback(async (newSettings) => {
        try {
            await setDoc(doc(db, 'cms_settings', FIREBASE_DOC_ID), newSettings, { merge: true });
        } catch (err) {
            console.error('Failed to update global settings', err);
        }
    }, []);

    /**
     * Called by AdminContent on mount (admin is authenticated).
     * Writes only the keys that don't yet exist in Firestore — never overwrites existing values.
     * This eliminates the need for manual push scripts when adding new CMS fields.
     */
    const seedMissingDefaults = useCallback(async (defaults) => {
        if (!firestoreLoaded) return;
        const current = settingsRef.current;
        const missing = Object.fromEntries(
            Object.entries(defaults).filter(([k]) => current[k] === undefined || current[k] === null)
        );
        if (Object.keys(missing).length === 0) return;
        try {
            await setDoc(doc(db, 'cms_settings', FIREBASE_DOC_ID), missing, { merge: true });
            if (import.meta.env.DEV) console.log('[CMS] Seeded missing defaults:', Object.keys(missing));
        } catch (err) {
            // Admin may not be authenticated yet — silently skip, next load will retry
            if (import.meta.env.DEV) console.warn('[CMS] Seed skipped (auth?):', err.code);
        }
    }, [firestoreLoaded]);

    return (
        <SettingsContext.Provider value={{ settings, getSetting, isVisible, updateGlobalSettings, seedMissingDefaults, firestoreLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
