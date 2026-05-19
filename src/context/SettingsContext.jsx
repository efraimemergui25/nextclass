import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import DEFAULT_SETTINGS from '../data/cms-settings.json';

const SettingsContext = createContext();

// Secret read from env at build time — not a hardcoded string in source
const CMS_SECRET = import.meta.env.VITE_CMS_SECRET || '';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    // Serialize concurrent saves: wait for in-flight request before starting next
    const saveQueue = useRef(Promise.resolve());

    const getSetting = useCallback((key, defaultValue) => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]);

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    const updateGlobalSettings = useCallback(async (newSettings) => {
        // Optimistic update — capture previous for rollback
        const previous = settings;
        setSettings(prev => ({ ...prev, ...newSettings }));

        // Queue saves so concurrent calls don't race on GitHub's SHA
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
                // Rollback optimistic update on failure
                setSettings(previous);
                console.error('[CMS] Save failed, rolled back:', err.message);
                throw err;
            }
        });

        return saveQueue.current;
    }, [settings]);

    const seedMissingDefaults = useCallback(() => {}, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            getSetting,
            isVisible,
            updateGlobalSettings,
            seedMissingDefaults,
            firestoreLoaded: true,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error('useSettings must be used within a SettingsProvider');
    return context;
};
