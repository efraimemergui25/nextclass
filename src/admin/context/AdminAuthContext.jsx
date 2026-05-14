/* eslint-disable */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';

const AdminAuthContext = createContext(null);

const LOCAL_SESSION_KEY = 'nextclass_admin_local_session';
const LOCAL_PIN_KEY     = 'nextclass_admin_pin';
const EXPIRY_KEY        = 'nextclass_admin_expiry';
const SESSION_TTL_MS    = 12 * 60 * 60 * 1000; // 12 hours

function isSessionExpired() {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!expiry) return false; // Firebase-auth sessions manage their own expiry
    return Date.now() > Number(expiry);
}

export function AdminAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setIsLoading(false);
            } else {
                // Fallback: check local session + expiry
                const local = localStorage.getItem(LOCAL_SESSION_KEY);
                const expired = isSessionExpired();
                if (expired) {
                    localStorage.removeItem(LOCAL_SESSION_KEY);
                    localStorage.removeItem(EXPIRY_KEY);
                }
                setIsAuthenticated(local === '1' && !expired);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Auto-logout when local session expires (checked every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            if (isSessionExpired()) {
                localStorage.removeItem(LOCAL_SESSION_KEY);
                localStorage.removeItem(EXPIRY_KEY);
                setIsAuthenticated(false);
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const login = useCallback(async (pin) => {
        // Try Firebase first
        try {
            await signInWithEmailAndPassword(auth, 'nextclass.en@gmail.com', pin);
            localStorage.removeItem(LOCAL_SESSION_KEY);
            return { success: true };
        } catch (_firebaseErr) {
            // Fallback: local PIN — only works if explicitly set; no hardcoded default
            const localPin = localStorage.getItem(LOCAL_PIN_KEY);
            if (localPin && pin === localPin) {
                localStorage.setItem(LOCAL_SESSION_KEY, '1');
                localStorage.setItem(EXPIRY_KEY, String(Date.now() + SESSION_TTL_MS));
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: 'קוד גישה שגוי — נסה שוב' };
        }
    }, []);

    const logout = useCallback(async () => {
        try { await signOut(auth); } catch {}
        localStorage.removeItem(LOCAL_SESSION_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        setIsAuthenticated(false);
    }, []);

    const changePin = useCallback(async (currentPin, newPin) => {
        // Try Firebase change first
        try {
            const user = auth.currentUser;
            if (user) {
                await signInWithEmailAndPassword(auth, 'nextclass.en@gmail.com', currentPin);
                await updatePassword(user, newPin);
                return true;
            }
        } catch {}
        // Fallback: change local PIN
        const localPin = localStorage.getItem(LOCAL_PIN_KEY) || DEFAULT_PIN;
        if (currentPin === localPin) {
            localStorage.setItem(LOCAL_PIN_KEY, newPin);
            return true;
        }
        return false;
    }, []);

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, changePin }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
    return ctx;
}
