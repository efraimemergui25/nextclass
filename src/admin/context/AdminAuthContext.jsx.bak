/* eslint-disable */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'firebase/auth';
import { auth } from '../../firebase';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = useCallback(async (pin) => {
        try {
            await signInWithEmailAndPassword(auth, 'nextclass.en@gmail.com', pin);
            return { success: true };
        } catch (error) {
            console.error('Firebase Auth Error:', error.code, error.message);
            return { success: false, message: error.message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, []);

    const changePin = useCallback(async (currentPin, newPin) => {
        try {
            const user = auth.currentUser;
            if (!user) return false;
            // First re-authenticate
            await signInWithEmailAndPassword(auth, 'nextclass.en@gmail.com', currentPin);
            // Then update password
            await updatePassword(user, newPin);
            return true;
        } catch (error) {
            console.error('Change PIN error:', error);
            return false;
        }
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
