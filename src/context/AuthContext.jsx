import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../firebase';

// ─── Tier config ──────────────────────────────────────────────────────────────
export const TIER_CONFIG = {
    free:     { label: 'פרטי',    discount: 5,  color: '#8E8E93' },
    member:   { label: 'מוסדי',   discount: 12, color: '#007AFF' },
    premium:  { label: 'פרימיום', discount: 18, color: '#FF9F0A' },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,    setUser]    = useState(null);
    const [userDoc, setUserDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authOpen, setAuthOpen] = useState(false);

    // ─── Track auth state ─────────────────────────────────────────────────────
    useEffect(() => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const ref = doc(db, 'users', firebaseUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setUserDoc(snap.data());
                    updateDoc(ref, { lastLogin: serverTimestamp() }).catch(() => {});
                } else {
                    // First login via Google — create doc
                    const newDoc = {
                        displayName: firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        institution: '',
                        role: 'teacher',
                        memberTier: 'free',
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                    };
                    await setDoc(ref, newDoc);
                    setUserDoc(newDoc);
                }
            } else {
                setUser(null);
                setUserDoc(null);
            }
            setLoading(false);
        });
    }, []);

    // ─── Computed values ──────────────────────────────────────────────────────
    const memberTier   = userDoc?.memberTier || 'free';
    const isMember     = memberTier !== 'free';
    const discountPct  = TIER_CONFIG[memberTier]?.discount ?? 5;
    const tierLabel    = TIER_CONFIG[memberTier]?.label ?? 'פרטי';
    const tierColor    = TIER_CONFIG[memberTier]?.color ?? '#8E8E93';

    const getMemberPrice = useCallback((price) => {
        if (!price || !isMember) return null;
        return Math.round(price * (1 - discountPct / 100));
    }, [isMember, discountPct]);

    // ─── Auth actions ─────────────────────────────────────────────────────────
    const signUp = useCallback(async ({ email, password, displayName, institution, role }) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const newDoc = {
            displayName,
            email,
            institution: institution || '',
            role: role || 'teacher',
            memberTier: 'free',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), newDoc);
        setUserDoc(newDoc);
        return cred.user;
    }, []);

    const signIn = useCallback((email, password) =>
        signInWithEmailAndPassword(auth, email, password), []);

    const signInGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        return signInWithPopup(auth, provider);
    }, []);

    const signOut = useCallback(() => firebaseSignOut(auth), []);

    const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

    const openAuthModal  = useCallback(() => setAuthOpen(true),  []);
    const closeAuthModal = useCallback(() => setAuthOpen(false), []);

    // ─── Admin: fetch all users ───────────────────────────────────────────────
    const fetchAllUsers = useCallback(async () => {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    }, []);

    const updateUserTier = useCallback(async (uid, tier) => {
        await updateDoc(doc(db, 'users', uid), { memberTier: tier });
    }, []);

    return (
        <AuthContext.Provider value={{
            user, userDoc, loading,
            memberTier, isMember, discountPct, tierLabel, tierColor,
            getMemberPrice,
            signUp, signIn, signInGoogle, signOut, resetPassword,
            authOpen, openAuthModal, closeAuthModal,
            fetchAllUsers, updateUserTier,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
