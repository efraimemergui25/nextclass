import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

const LS_KEY = 'nextclass_content';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === LS_KEY) {
                try {
                    setSettings(JSON.parse(e.newValue || '{}'));
                } catch (err) {
                    console.error('Failed to parse settings from localStorage', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getSetting = useCallback((key, defaultValue) => {
        const val = settings[key];
        if (val === undefined || val === null) return defaultValue;
        return val;
    }, [settings]);

    const isVisible = useCallback((key, defaultVal = true) => {
        return getSetting(key, defaultVal) !== false;
    }, [getSetting]);

    const value = {
        settings,
        getSetting,
        isVisible,
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
