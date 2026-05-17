import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

// ─── Time-of-day greeting (Hebrew) ───────────────────────────────────────────
export function getTimeGreeting() {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return { word: 'בוקר טוב',   emoji: '☀️' };
    if (h >= 12 && h < 17) return { word: 'צהרים טובים', emoji: '🌤️' };
    if (h >= 17 && h < 21) return { word: 'ערב טוב',    emoji: '🌅' };
    return { word: 'לילה טוב', emoji: '🌙' };
}

// ─── Recently viewed (localStorage) ──────────────────────────────────────────
export function getRecentlyViewed() {
    try { return JSON.parse(localStorage.getItem('nc_recently_viewed') || '[]'); }
    catch { return []; }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user,        setUser]        = useState(null);
    const [userDoc,     setUserDoc]     = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [authOpen,    setAuthOpen]    = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);   // cinematic welcome toast
    const [firstLogin,  setFirstLogin]  = useState(false);   // first-ever login celebration
    const [prevUser,    setPrevUser]    = useState(undefined); // track login transitions

    // ─── Track auth state ─────────────────────────────────────────────────────
    useEffect(() => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            setPrevUser(prev => {
                // Detect login transition: was null, now has user
                if (!prev && firebaseUser) {
                    setShowWelcome(true);
                    const firstLoginKey = `nc_first_login_${firebaseUser.uid}`;
                    if (!localStorage.getItem(firstLoginKey)) {
                        setFirstLogin(true);
                        localStorage.setItem(firstLoginKey, '1');
                    }
                }
                return firebaseUser;
            });

            if (firebaseUser) {
                setUser(firebaseUser);
                const ref = doc(db, 'users', firebaseUser.uid);
                const snap = await getDoc(ref);
                if (snap.exists()) {
                    setUserDoc(snap.data());
                    updateDoc(ref, { lastLogin: serverTimestamp() }).catch(() => {});
                } else {
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

    // firstName — first word of displayName, fallback to email prefix
    const firstName = useMemo(() => {
        const name = user?.displayName || userDoc?.displayName || '';
        if (name) return name.split(/\s+/)[0];
        const email = user?.email || '';
        return email.split('@')[0] || '';
    }, [user, userDoc]);

    // institution display
    const institution = userDoc?.institution || '';

    // time greeting
    const timeGreeting = useMemo(() => getTimeGreeting(), []);

    // personalized greeting string: "ברוך הבא, אפרים! ☀️ צהרים טובים"
    const personalGreeting = useMemo(() => {
        if (!firstName) return '';
        const { word, emoji } = timeGreeting;
        return `${word}, ${firstName}! ${emoji}`;
    }, [firstName, timeGreeting]);

    // short greeting: "צהרים טובים, אפרים"
    const shortGreeting = useMemo(() => {
        if (!firstName) return '';
        return `${timeGreeting.word}, ${firstName}`;
    }, [firstName, timeGreeting]);

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
    const dismissWelcome = useCallback(() => setShowWelcome(false), []);
    const dismissFirstLogin = useCallback(() => setFirstLogin(false), []);

    // ─── Admin ────────────────────────────────────────────────────────────────
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
            firstName, institution, timeGreeting, personalGreeting, shortGreeting,
            getMemberPrice,
            showWelcome, dismissWelcome,
            firstLogin, dismissFirstLogin,
            signUp, signIn, signInGoogle, signOut, resetPassword,
            authOpen, openAuthModal, closeAuthModal,
            fetchAllUsers, updateUserTier,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
