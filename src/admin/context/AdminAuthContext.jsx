/* eslint-disable */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';

const AdminAuthContext = createContext(null);

const LOCAL_SESSION_KEY = 'nextclass_admin_local_session';
const LOCAL_PIN_KEY     = 'nextclass_admin_pin';
const DEFAULT_PIN       = '123456';

export function AdminAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setIsLoading(false);
            } else {
                // Fallback: check local session
                const local = localStorage.getItem(LOCAL_SESSION_KEY);
                setIsAuthenticated(local === '1');
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const login = useCallback(async (pin) => {
        // Try Firebase first
        try {
            await signInWithEmailAndPassword(auth, 'nextclass.en@gmail.com', pin);
            localStorage.removeItem(LOCAL_SESSION_KEY);
            return { success: true };
        } catch (_firebaseErr) {
            // Fallback: local PIN (default 123456, changeable from settings)
            const localPin = localStorage.getItem(LOCAL_PIN_KEY) || DEFAULT_PIN;
            if (pin === localPin) {
                localStorage.setItem(LOCAL_SESSION_KEY, '1');
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: 'קוד גישה שגוי — נסה שוב' };
        }
    }, []);

    const logout = useCallback(async () => {
        try { await signOut(auth); } catch {}
        localStorage.removeItem(LOCAL_SESSION_KEY);
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
