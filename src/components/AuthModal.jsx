import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Building2, ChevronDown, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../context/AuthContext';

const ROLES = [
    { value: 'teacher',     label: 'מורה' },
    { value: 'admin',       label: 'מנהל בית ספר' },
    { value: 'procurement', label: 'רכז רכש' },
    { value: 'other',       label: 'אחר' },
];

// ─── Auto-detect institution from email domain ────────────────────────────────
const KNOWN_DOMAINS = {
    'tau.ac.il':       'אוניברסיטת תל אביב',
    'huji.ac.il':      'האוניברסיטה העברית',
    'technion.ac.il':  'הטכניון',
    'bgu.ac.il':       'אוניברסיטת בן גוריון',
    'biu.ac.il':       'אוניברסיטת בר אילן',
    'haifa.ac.il':     'אוניברסיטת חיפה',
    'weizmann.ac.il':  'מכון ויצמן',
    'openu.ac.il':     'האוניברסיטה הפתוחה',
    'hit.ac.il':       'מכון טכנולוגי חולון',
    'jct.ac.il':       'מכללת לב',
    'afeka.ac.il':     'אפקה - מכללה אקדמית להנדסה',
    'colman.ac.il':    'המכללה האקדמית נתניה',
    'sce.ac.il':       'המכללה האקדמית סמי שמעון',
};

function detectInstitution(email) {
    if (!email || !email.includes('@')) return null;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    if (KNOWN_DOMAINS[domain]) return KNOWN_DOMAINS[domain];
    if (domain.endsWith('.ac.il') || domain.endsWith('.edu.il') || domain.endsWith('.school.il')) {
        const prefix = domain.split('.')[0];
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return null;
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

export default function AuthModal() {
    const { authOpen, closeAuthModal, signIn, signUp, signInGoogle, resetPassword, isMember, tierLabel, tierColor, user } = useAuth();
    const [tab,  setTab]  = useState('signin');
    const [step, setStep] = useState('form'); // form | forgot | success
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const firstRef = useRef(null);

    const [form, setForm] = useState({ email: '', password: '', name: '', institution: '', role: 'teacher' });
    const [institutionSuggestion, setInstitutionSuggestion] = useState('');
    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

    const handleEmailBlur = () => {
        if (tab !== 'signup') return;
        const suggestion = detectInstitution(form.email);
        if (suggestion && !form.institution) {
            setForm(f => ({ ...f, institution: suggestion }));
            setInstitutionSuggestion(suggestion);
        }
    };

    useEffect(() => {
        if (authOpen) {
            setError('');
            setStep('form');
            setTimeout(() => firstRef.current?.focus(), 80);
        }
    }, [authOpen, tab]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') closeAuthModal(); };
        if (authOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [authOpen, closeAuthModal]);

    const errMsg = (code) => ({
        'auth/user-not-found':      'משתמש לא נמצא — בדוק את האימייל',
        'auth/wrong-password':      'סיסמה שגויה',
        'auth/email-already-in-use': 'כתובת זו כבר רשומה — נסה להתחבר',
        'auth/weak-password':       'הסיסמה חייבת להכיל לפחות 6 תווים',
        'auth/invalid-email':       'כתובת אימייל לא תקינה',
        'auth/popup-closed-by-user':'החלון נסגר — נסה שנית',
    })[code] || 'אירעה שגיאה — נסה שנית';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'signin') {
                await signIn(form.email, form.password);
                closeAuthModal();
            } else {
                if (!form.name.trim()) { setError('שם מלא חובה'); setLoading(false); return; }
                await signUp({ email: form.email, password: form.password, displayName: form.name, institution: form.institution, role: form.role });
                closeAuthModal();
            }
        } catch (err) {
            setError(errMsg(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        setLoading(true);
        try {
            await signInGoogle();
            closeAuthModal();
        } catch (err) {
            setError(errMsg(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        if (!form.email) { setError('הזן אימייל לאיפוס'); return; }
        setLoading(true);
        try {
            await resetPassword(form.email);
            setStep('success');
        } catch (err) {
            setError(errMsg(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {authOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAuthModal}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 999,
                            background: 'rgba(0,0,0,0.38)',
                            backdropFilter: 'blur(6px)',
                            WebkitBackdropFilter: 'blur(6px)',
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        key="panel"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 38, mass: 0.9 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: 420, zIndex: 1000,
                            background: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(40px) saturate(2)',
                            WebkitBackdropFilter: 'blur(40px) saturate(2)',
                            boxShadow: '-24px 0 80px rgba(0,0,0,0.16)',
                            display: 'flex', flexDirection: 'column',
                            direction: 'rtl',
                            fontFamily: `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>N</span>
                                </div>
                                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1D1D1F', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                    {user ? 'הפרופיל שלי' : step === 'forgot' ? 'שכחתי סיסמה' : tab === 'signin' ? 'ברוך הבא' : 'הצטרף למועדון'}
                                </h2>
                                {!user && step === 'form' && (
                                    <p style={{ fontSize: 13, color: '#86868B', marginTop: 4, fontWeight: 500 }}>
                                        {tab === 'signin' ? 'התחבר לחשבון NextClass שלך' : 'הרשם ותקבל מחירי מוסד מיוחדים'}
                                    </p>
                                )}
                            </div>
                            <button onClick={closeAuthModal} style={{ width: 36, height: 36, borderRadius: 99, background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                <X size={16} color="#1D1D1F" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>

                            {/* Logged in — profile view */}
                            {user && (
                                <ProfileView />
                            )}

                            {/* Forgot password success */}
                            {!user && step === 'success' && (
                                <div style={{ textAlign: 'center', paddingTop: 40 }}>
                                    <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>נשלח מייל לאיפוס</p>
                                    <p style={{ fontSize: 14, color: '#86868B' }}>בדוק את תיבת הדואר שלך ולחץ על הקישור</p>
                                    <button onClick={() => { setStep('form'); setTab('signin'); }} style={btnStyle('#007AFF', true)}>חזור להתחברות</button>
                                </div>
                            )}

                            {/* Forgot password form */}
                            {!user && step === 'forgot' && (
                                <form onSubmit={handleForgot} style={{ paddingTop: 16 }}>
                                    <p style={{ fontSize: 14, color: '#86868B', marginBottom: 20 }}>הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה</p>
                                    <FloatingInput ref={firstRef} label="אימייל" type="email" value={form.email} onChange={set('email')} />
                                    {error && <ErrorMsg msg={error} />}
                                    <button type="submit" disabled={loading} style={btnStyle('#007AFF', true)}>{loading ? 'שולח...' : 'שלח קישור לאיפוס'}</button>
                                    <button type="button" onClick={() => { setStep('form'); setError(''); }} style={btnStyle('transparent', false)}>חזור</button>
                                </form>
                            )}

                            {/* Main auth form */}
                            {!user && step === 'form' && (
                                <>
                                    {/* Tabs */}
                                    <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 12, padding: 3, marginBottom: 24 }}>
                                        {['signin', 'signup'].map(t => (
                                            <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
                                                flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                                                background: tab === t ? '#fff' : 'transparent',
                                                boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
                                                color: tab === t ? '#1D1D1F' : '#86868B',
                                                fontSize: 14, fontWeight: tab === t ? 700 : 500,
                                                cursor: 'pointer', transition: 'all 0.18s',
                                                fontFamily: 'inherit',
                                            }}>
                                                {t === 'signin' ? 'התחברות' : 'הרשמה'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Google button */}
                                    <button onClick={handleGoogle} disabled={loading} style={{
                                        width: '100%', height: 48, borderRadius: 14,
                                        background: '#fff', border: '1.5px solid #E5E5EA',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        fontSize: 15, fontWeight: 600, color: '#1D1D1F',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        marginBottom: 16, fontFamily: 'inherit',
                                        transition: 'background 0.15s',
                                    }}>
                                        <GoogleIcon />
                                        המשך עם Google
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
                                        <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500 }}>או</span>
                                        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
                                    </div>

                                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        {tab === 'signup' && (
                                            <>
                                                <FloatingInput ref={firstRef} label="שם מלא" icon={<User size={15} color="#AEAEB2" />} value={form.name} onChange={set('name')} />
                                                <div>
                                                    <FloatingInput label="שם מוסד (בית ספר / עמותה)" icon={<Building2 size={15} color="#AEAEB2" />} value={form.institution} onChange={v => { set('institution')(v); if (v !== institutionSuggestion) setInstitutionSuggestion(''); }} />
                                                    {institutionSuggestion && form.institution === institutionSuggestion && (
                                                        <p style={{ fontSize: 11, color: '#007AFF', fontWeight: 600, marginTop: -8, marginBottom: 10, paddingRight: 4 }}>
                                                            זוהה אוטומטית: {institutionSuggestion} ✓
                                                        </p>
                                                    )}
                                                </div>
                                                <RoleSelect value={form.role} onChange={set('role')} />
                                            </>
                                        )}
                                        <FloatingInput ref={tab === 'signin' ? firstRef : undefined} label="אימייל" type="email" icon={<Mail size={15} color="#AEAEB2" />} value={form.email} onChange={set('email')} onBlur={handleEmailBlur} />
                                        <FloatingInput label="סיסמה" type={showPass ? 'text' : 'password'} icon={<Lock size={15} color="#AEAEB2" />} value={form.password} onChange={set('password')}
                                            suffix={<button type="button" onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
                                                {showPass ? <EyeOff size={15} color="#AEAEB2" /> : <Eye size={15} color="#AEAEB2" />}
                                            </button>}
                                        />

                                        {tab === 'signin' && (
                                            <button type="button" onClick={() => { setStep('forgot'); setError(''); }} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'right', marginBottom: 12, padding: 0, fontFamily: 'inherit' }}>
                                                שכחתי סיסמה
                                            </button>
                                        )}

                                        {error && <ErrorMsg msg={error} />}

                                        <button type="submit" disabled={loading} style={btnStyle('#007AFF', true)}>
                                            {loading ? 'אנא המתן...' : tab === 'signin' ? 'כניסה' : 'יצירת חשבון חינם'}
                                        </button>
                                    </form>

                                    {/* Benefits teaser for signup */}
                                    {tab === 'signup' && (
                                        <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(0,122,255,0.06)', borderRadius: 14, border: '1px solid rgba(0,122,255,0.12)' }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#007AFF', marginBottom: 8 }}>הצטרפות חינם — היתרונות שמחכים לך</p>
                                            {[['5%', 'הנחה מיידית על כל רכישה'], ['12%', 'הנחה מוסדית לאחר אימות'], ['גישה מוקדמת', 'למבצעים ומוצרים חדשים']].map(([tag, desc]) => (
                                                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#007AFF', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{tag}</span>
                                                    <span style={{ fontSize: 12, color: '#3C3C43' }}>{desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Profile View (when logged in) ───────────────────────────────────────────
function ProfileView() {
    const { user, userDoc, signOut, memberTier, discountPct, tierLabel, tierColor, closeAuthModal } = useAuth();
    const handleSignOut = async () => { await signOut(); closeAuthModal(); };
    return (
        <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#F2F2F7', borderRadius: 18, marginBottom: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 99, background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'משתמש'}</p>
                    <p style={{ fontSize: 12, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: tierColor, background: `${tierColor}18`, padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>{tierLabel}</span>
            </div>

            {userDoc?.institution && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#F2F2F7', borderRadius: 14, marginBottom: 12 }}>
                    <Building2 size={16} color="#86868B" />
                    <span style={{ fontSize: 14, color: '#3C3C43' }}>{userDoc.institution}</span>
                </div>
            )}

            <div style={{ padding: '14px 16px', background: memberTier === 'free' ? 'rgba(0,122,255,0.06)' : 'rgba(52,199,89,0.06)', borderRadius: 14, border: `1px solid ${memberTier === 'free' ? 'rgba(0,122,255,0.15)' : 'rgba(52,199,89,0.2)'}`, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: memberTier === 'free' ? '#007AFF' : '#34C759', marginBottom: 4 }}>
                    {memberTier === 'free' ? 'חשבון פרטי — הנחה 5%' : `✓ דרג ${tierLabel} — הנחה ${discountPct}%`}
                </p>
                <p style={{ fontSize: 12, color: '#86868B' }}>
                    {memberTier === 'free' ? 'אמת מספר מוסד לקבלת הנחת 12% מוסדית' : 'הנחה מופעלת אוטומטית על כל הרכישות שלך'}
                </p>
            </div>

            <button onClick={handleSignOut} style={{ width: '100%', height: 48, borderRadius: 14, background: '#F2F2F7', border: 'none', color: '#FF3B30', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                יציאה מהחשבון
            </button>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
import { forwardRef } from 'react';
const FloatingInput = forwardRef(function FloatingInput({ label, type = 'text', icon, suffix, value, onChange, onBlur: onBlurProp }, ref) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ position: 'relative', marginBottom: 12 }}>
            {icon && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>{icon}</span>}
            <input
                ref={ref}
                type={type}
                placeholder={label}
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => { setFocused(false); onBlurProp?.(); }}
                style={{
                    width: '100%', height: 52, borderRadius: 14,
                    background: focused ? '#fff' : '#F2F2F7',
                    border: `1.5px solid ${focused ? '#007AFF' : 'transparent'}`,
                    padding: icon ? '0 42px 0 suffix ? 42 : 16px' : `0 16px`,
                    paddingRight: icon ? 42 : 16,
                    paddingLeft: suffix ? 42 : 16,
                    fontSize: 15, color: '#1D1D1F', fontWeight: 500,
                    outline: 'none', textAlign: 'right', direction: 'rtl',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'background 0.15s, border-color 0.15s',
                }}
            />
            {suffix && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>{suffix}</span>}
        </div>
    );
});

function RoleSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = ROLES.find(r => r.value === value) || ROLES[0];
    return (
        <div style={{ position: 'relative', marginBottom: 12 }}>
            <button type="button" onClick={() => setOpen(v => !v)} style={{
                width: '100%', height: 52, borderRadius: 14, background: '#F2F2F7',
                border: open ? '1.5px solid #007AFF' : '1.5px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', fontSize: 15, color: '#1D1D1F', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
            }}>
                <ChevronDown size={16} color="#AEAEB2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }} />
                <span>{selected.label}</span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 10 }}>
                        {ROLES.map(r => (
                            <button key={r.value} type="button" onClick={() => { onChange(r.value); setOpen(false); }} style={{
                                width: '100%', padding: '13px 16px', background: value === r.value ? '#F2F2F7' : 'none', border: 'none',
                                textAlign: 'right', fontSize: 15, color: value === r.value ? '#007AFF' : '#1D1D1F',
                                fontWeight: value === r.value ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                            }}>
                                {r.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ErrorMsg({ msg }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,59,48,0.08)', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,59,48,0.16)' }}>
            <AlertCircle size={15} color="#FF3B30" strokeWidth={2} />
            <span style={{ fontSize: 13, color: '#FF3B30', fontWeight: 600 }}>{msg}</span>
        </div>
    );
}

function btnStyle(bg, filled) {
    return {
        width: '100%', height: 52, borderRadius: 16, border: 'none',
        background: filled ? bg : 'transparent',
        color: filled ? '#fff' : '#007AFF',
        fontSize: 16, fontWeight: 700, cursor: 'pointer',
        marginTop: 8, fontFamily: 'inherit',
        boxShadow: filled && bg !== 'transparent' ? `0 4px 18px ${bg}44` : 'none',
        transition: 'opacity 0.15s',
    };
}
