import { createContext, useContext, useEffect, useState } from 'react';

export const LIGHT = {
    bg:         '#F2F2F7',
    surface:    '#FFFFFF',
    surface2:   '#F9F9FB',
    text:       '#1D1D1F',
    text2:      '#3C3C43',
    text3:      '#86868B',
    text4:      '#AEAEB2',
    divider:    'rgba(0,0,0,0.07)',
    border:     'rgba(0,0,0,0.10)',
    input:      'rgba(118,118,128,0.08)',
    navBg:      'rgba(255,255,255,0.92)',
    navBorder:  'rgba(0,0,0,0.10)',
    shimmerA:   '#F2F2F7',
    shimmerB:   '#E5E5EA',
    subtleBg:   'rgba(0,0,0,0.04)',
    subtleBg2:  'rgba(0,0,0,0.025)',
    cardShadow: '0 1px 4px rgba(0,0,0,0.06)',
    wishlistBg: 'rgba(255,255,255,0.88)',
};

export const DARK = {
    bg:         '#000000',
    surface:    '#1C1C1E',
    surface2:   '#2C2C2E',
    text:       '#FFFFFF',
    text2:      '#EBEBF5',
    text3:      '#8E8E93',
    text4:      '#636366',
    divider:    'rgba(255,255,255,0.07)',
    border:     'rgba(255,255,255,0.12)',
    input:      'rgba(255,255,255,0.08)',
    navBg:      'rgba(28,28,30,0.92)',
    navBorder:  'rgba(255,255,255,0.10)',
    shimmerA:   '#2C2C2E',
    shimmerB:   '#3A3A3C',
    subtleBg:   'rgba(255,255,255,0.06)',
    subtleBg2:  'rgba(255,255,255,0.04)',
    cardShadow: '0 1px 4px rgba(0,0,0,0.28)',
    wishlistBg: 'rgba(44,44,46,0.92)',
};

const ThemeCtx = createContext({ isDark: false, colors: LIGHT, toggle: () => {} });

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        try {
            const stored = localStorage.getItem('nc_theme');
            if (stored) return stored === 'dark';
        } catch {}
        return typeof window !== 'undefined'
            && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            try {
                if (!localStorage.getItem('nc_theme')) setIsDark(e.matches);
            } catch { setIsDark(e.matches); }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const toggle = () => setIsDark(d => {
        const next = !d;
        try { localStorage.setItem('nc_theme', next ? 'dark' : 'light'); } catch {}
        return next;
    });

    return (
        <ThemeCtx.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggle }}>
            {children}
        </ThemeCtx.Provider>
    );
}

export const useTheme = () => useContext(ThemeCtx);
