import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
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

    // ─── Handle Google redirect result on load ────────────────────────────────
    // When the user returns after signInWithRedirect, this processes the result.
    // onAuthStateChanged will fire automatically — no manual handling needed.
    useEffect(() => {
        getRedirectResult(auth)
            .then(result => {
                // result?.user is set — onAuthStateChanged handles state update
            })
            .catch(() => {});
    }, []);

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
                const googleFields = {
                    photoURL:      firebaseUser.photoURL      || '',
                    provider:      firebaseUser.providerData?.[0]?.providerId || 'password',
                    emailVerified: firebaseUser.emailVerified,
                    displayName:   firebaseUser.displayName   || '',
                };
                if (snap.exists()) {
                    setUserDoc(snap.data());
                    updateDoc(ref, { lastLogin: serverTimestamp(), ...googleFields }).catch(() => {});
                } else {
                    const newDoc = {
                        ...googleFields,
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
        // updateProfile and Firestore write are best-effort — auth is what matters
        try { await updateProfile(cred.user, { displayName }); } catch {}
        const newDoc = {
            displayName,
            email,
            institution: institution || '',
            role: role || 'teacher',
            memberTier: 'free',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
        };
        // Fire-and-forget: onAuthStateChanged will create the doc if this fails
        setDoc(doc(db, 'users', cred.user.uid), newDoc).catch(() => {});
        setUserDoc(newDoc);
        return cred.user;
    }, []);

    const signIn = useCallback((email, password) =>
        signInWithEmailAndPassword(auth, email, password), []);

    // Popup first (works in all modern browsers). If popup is blocked, fall back to redirect.
    const signInGoogle = useCallback(async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            return await signInWithPopup(auth, provider);
        } catch (err) {
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-cancelled') {
                return signInWithRedirect(auth, provider);
            }
            throw err;
        }
    }, []);

    // Keep alias for mobile components that import this name
    const signInGoogleRedirect = signInGoogle;

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
            signUp, signIn, signInGoogle, signInGoogleRedirect, signOut, resetPassword,
            authOpen, openAuthModal, closeAuthModal,
            fetchAllUsers, updateUserTier,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
