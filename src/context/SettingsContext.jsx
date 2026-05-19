import React, { createContext, useContext, useState, useCallback } from 'react';
import DEFAULT_SETTINGS from '../data/cms-settings.json';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const getSetting = useCallback((key, defaultValue) => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]);

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    // Called by admin panel to persist a change — optimistic UI + GitHub commit via API
    const updateGlobalSettings = useCallback(async (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));

        try {
            const res = await fetch('/api/cms-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cms-secret': 'nextclass-cms-2025',
                },
                body: JSON.stringify(newSettings),
            });
            if (!res.ok) throw new Error(await res.text());
        } catch (err) {
            console.error('[CMS] Failed to persist settings:', err);
            throw err;
        }
    }, []);

    // No-op kept for backwards compatibility with AdminContent
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
