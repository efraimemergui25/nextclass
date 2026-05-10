import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // ─── Live Firestore Sync ────────────────────────────────────────────────
    useEffect(() => {
        // Listen to global settings in Firestore
        const unsub = onSnapshot(doc(db, 'cms_settings', FIREBASE_DOC_ID), (snap) => {
            if (snap.exists()) {
                const cloudData = snap.data();
                setSettings(cloudData);
                // Keep localStorage as a fast fallback/cache
                localStorage.setItem(LS_KEY, JSON.stringify(cloudData));
            }
        });

        // Still listen to storage events for cross-tab sync if local changes happen
        const handleStorageChange = (e) => {
            if (e.key === LS_KEY) {
                try {
                    setSettings(JSON.parse(e.newValue || '{}'));
                } catch {}
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            unsub();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const getSetting = useCallback((key, defaultValue) => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]);

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    const updateGlobalSettings = async (newSettings) => {
        try {
            await setDoc(doc(db, 'cms_settings', FIREBASE_DOC_ID), newSettings);
        } catch (err) {
            console.error('Failed to update global settings', err);
        }
    };

    const value = {
        settings,
        getSetting,
        isVisible,
        updateGlobalSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
