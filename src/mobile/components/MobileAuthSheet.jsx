import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth, TIER_CONFIG } from '../../context/AuthContext';
import { haptic } from '../utils/haptic';

const SF = `-apple-system,BlinkMacSystemFont,'SF Pro Display',Heebo,'Helvetica Neue',Arial,sans-serif`;

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.09 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}

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

// ─── Input ────────────────────────────────────────────────────────────────────
const MInput = forwardRef(function MInput({ label, type = 'text', value, onChange, icon, suffix, onBlur: onBlurProp }, ref) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ position: 'relative', marginBottom: 12 }}>
            {icon && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1, display: 'flex' }}>{icon}</span>}
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
                    paddingRight: icon ? 44 : 16,
                    paddingLeft: suffix ? 44 : 16,
                    fontSize: 16, color: '#1D1D1F', fontWeight: 500,
                    outline: 'none', textAlign: 'right', direction: 'rtl',
                    fontFamily: SF, boxSizing: 'border-box',
                    transition: 'background 0.15s, border-color 0.15s',
                    WebkitAppearance: 'none',
                }}
            />
            {suffix && <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 1, display: 'flex' }}>{suffix}</span>}
        </div>
    );
});

export default function MobileAuthSheet() {
    const { authOpen, closeAuthModal, signIn, signUp, signInGoogleRedirect, resetPassword, user } = useAuth();
    const [tab,      setTab]      = useState('signin');
    const [step,     setStep]     = useState('form');
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [form,     setForm]     = useState({ email: '', password: '', name: '', institution: '', role: 'teacher' });
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
        if (authOpen) { setError(''); setStep('form'); }
    }, [authOpen, tab]);

    const errMsg = (code) => ({
        'auth/user-not-found':       'משתמש לא נמצא',
        'auth/wrong-password':       'סיסמה שגויה',
        'auth/email-already-in-use': 'אימייל כבר רשום — נסה להתחבר',
        'auth/weak-password':        'סיסמה חייבת להכיל לפחות 6 תווים',
        'auth/invalid-email':        'אימייל לא תקין',
        'auth/popup-closed-by-user': 'החלון נסגר — נסה שנית',
    })[code] || 'אירעה שגיאה — נסה שנית';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        haptic('medium');
        setLoading(true);
        try {
            if (tab === 'signin') {
                await signIn(form.email, form.password);
            } else {
                if (!form.name.trim()) { setError('שם מלא חובה'); setLoading(false); return; }
                await signUp({ email: form.email, password: form.password, displayName: form.name, institution: form.institution, role: form.role });
            }
            haptic('success');
            closeAuthModal();
        } catch (err) {
            haptic('error');
            setError(errMsg(err.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        haptic('medium');
        setLoading(true);
        try {
            // Use redirect (not popup) — mobile browsers block popups for async auth flows
            await signInGoogleRedirect();
            // If redirect happens, code below won't execute until the user returns
        } catch (err) {
            haptic('error');
            setError(errMsg(err.code));
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        if (!form.email) { setError('הזן אימייל'); return; }
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
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { haptic('light'); closeAuthModal(); }}
                        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.55)' }}
                    />

                    <motion.div
                        key="sheet"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.85 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 901,
                            background: '#fff',
                            borderRadius: '24px 24px 0 0',
                            maxHeight: '92dvh',
                            overflowY: 'auto',
                            fontFamily: SF,
                            direction: 'rtl',
                            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                        }}
                    >
                        {/* Grab handle */}
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
                            <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E5E5EA' }} />
                        </div>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 8px' }}>
                            <button onClick={() => { haptic('light'); closeAuthModal(); }} style={{ width: 34, height: 34, borderRadius: 99, background: '#F2F2F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <X size={16} color="#1D1D1F" strokeWidth={2.5} />
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1D1D1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>N</span>
                                    </div>
                                    <span style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F' }}>
                                        {user ? 'הפרופיל שלי' : tab === 'signin' ? 'ברוך הבא' : 'הצטרף למועדון'}
                                    </span>
                                </div>
                                {!user && <p style={{ fontSize: 12, color: '#86868B', fontWeight: 500 }}>
                                    {tab === 'signin' ? 'כניסה לחשבון NextClass' : 'הנחה מיידית על כל הרכישות'}
                                </p>}
                            </div>
                            <div style={{ width: 34 }} />
                        </div>

                        <div style={{ padding: '8px 20px' }}>
                            {/* Logged in */}
                            {user && <MobileProfileView />}

                            {/* Forgot success */}
                            {!user && step === 'success' && (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
                                    <p style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>נשלח מייל לאיפוס</p>
                                    <p style={{ fontSize: 14, color: '#86868B', marginBottom: 24 }}>בדוק את תיבת הדואר ולחץ על הקישור</p>
                                    <button onClick={() => { setStep('form'); setTab('signin'); }} style={mBtn('#007AFF')}>חזור להתחברות</button>
                                </div>
                            )}

                            {/* Forgot form */}
                            {!user && step === 'forgot' && (
                                <form onSubmit={handleForgot}>
                                    <p style={{ fontSize: 14, color: '#86868B', marginBottom: 16 }}>הזן את כתובת האימייל לאיפוס הסיסמה</p>
                                    <MInput label="אימייל" type="email" value={form.email} onChange={set('email')} icon={<Mail size={16} color="#AEAEB2" />} />
                                    {error && <ErrBanner msg={error} />}
                                    <button type="submit" disabled={loading} style={mBtn('#007AFF')}>{loading ? 'שולח...' : 'שלח קישור'}</button>
                                    <button type="button" onClick={() => { setStep('form'); setError(''); }} style={{ ...mBtn('transparent'), color: '#007AFF', marginTop: 4 }}>חזור</button>
                                </form>
                            )}

                            {/* Main form */}
                            {!user && step === 'form' && (
                                <>
                                    {/* Tabs */}
                                    <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 13, padding: 3, marginBottom: 20 }}>
                                        {['signin', 'signup'].map(t => (
                                            <button key={t} onClick={() => { haptic('light'); setTab(t); setError(''); }} style={{
                                                flex: 1, padding: '10px 0', borderRadius: 11, border: 'none',
                                                background: tab === t ? '#fff' : 'transparent',
                                                boxShadow: tab === t ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
                                                color: tab === t ? '#1D1D1F' : '#86868B',
                                                fontSize: 15, fontWeight: tab === t ? 700 : 500,
                                                cursor: 'pointer', fontFamily: SF,
                                            }}>
                                                {t === 'signin' ? 'כניסה' : 'הרשמה'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Google */}
                                    <button onClick={handleGoogle} disabled={loading} style={{
                                        width: '100%', height: 52, borderRadius: 16, background: '#F2F2F7', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        fontSize: 16, fontWeight: 600, color: '#1D1D1F', cursor: 'pointer', fontFamily: SF, marginBottom: 14,
                                        WebkitTapHighlightColor: 'transparent',
                                    }}>
                                        <GoogleIcon />
                                        המשך עם Google
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
                                        <span style={{ fontSize: 12, color: '#AEAEB2', fontWeight: 500 }}>או</span>
                                        <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        {tab === 'signup' && (
                                            <>
                                                <MInput label="שם מלא" value={form.name} onChange={set('name')} icon={<User size={16} color="#AEAEB2" />} />
                                                <div>
                                                    <MInput label="שם מוסד (בית ספר)" value={form.institution} onChange={v => { set('institution')(v); if (v !== institutionSuggestion) setInstitutionSuggestion(''); }} icon={<Building2 size={16} color="#AEAEB2" />} />
                                                    {institutionSuggestion && form.institution === institutionSuggestion && (
                                                        <p style={{ fontSize: 11, color: '#007AFF', fontWeight: 600, marginTop: -8, marginBottom: 10, paddingRight: 4 }}>
                                                            זוהה אוטומטית: {institutionSuggestion} ✓
                                                        </p>
                                                    )}
                                                </div>
                                                <MRoleSelect value={form.role} onChange={set('role')} />
                                            </>
                                        )}
                                        <MInput label="אימייל" type="email" value={form.email} onChange={set('email')} icon={<Mail size={16} color="#AEAEB2" />} onBlur={handleEmailBlur} />
                                        <MInput label="סיסמה" type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                                            icon={<Lock size={16} color="#AEAEB2" />}
                                            suffix={
                                                <button type="button" onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
                                                    {showPass ? <EyeOff size={16} color="#AEAEB2" /> : <Eye size={16} color="#AEAEB2" />}
                                                </button>
                                            }
                                        />

                                        {tab === 'signin' && (
                                            <button type="button" onClick={() => { setStep('forgot'); setError(''); }} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '0 0 12px', fontFamily: SF, WebkitTapHighlightColor: 'transparent' }}>
                                                שכחתי סיסמה
                                            </button>
                                        )}

                                        {error && <ErrBanner msg={error} />}
                                        <button type="submit" disabled={loading} style={mBtn('#007AFF')}>
                                            {loading ? 'אנא המתן...' : tab === 'signin' ? 'כניסה' : 'יצירת חשבון חינם'}
                                        </button>
                                    </form>

                                    {tab === 'signup' && (
                                        <div style={{ marginTop: 16, padding: '14px', background: 'rgba(0,122,255,0.07)', borderRadius: 14, border: '1px solid rgba(0,122,255,0.14)' }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: '#007AFF', marginBottom: 8 }}>היתרונות שמחכים לך</p>
                                            {[['חינמי', 'גישה לקטלוג המלא'], ['מוסדי', 'מחירים מיוחדים לאחר אימות'], ['גישה מוקדמת', 'למבצעים ודגמים חדשים']].map(([t, d]) => (
                                                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: '#007AFF', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{t}</span>
                                                    <span style={{ fontSize: 13, color: '#3C3C43' }}>{d}</span>
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

function MobileProfileView() {
    const { user, userDoc, signOut, memberTier, discountPct, tierLabel, tierColor, closeAuthModal } = useAuth();
    const handleOut = async () => { haptic('medium'); await signOut(); closeAuthModal(); };
    return (
        <div style={{ paddingTop: 4, paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#F2F2F7', borderRadius: 20, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 99, background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#1D1D1F', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'משתמש'}</p>
                    <p style={{ fontSize: 12, color: '#86868B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: tierColor, background: `${tierColor}18`, padding: '4px 10px', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>{tierLabel}</span>
            </div>
            {userDoc?.institution && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#F2F2F7', borderRadius: 14, marginBottom: 12 }}>
                    <Building2 size={16} color="#86868B" />
                    <span style={{ fontSize: 14, color: '#3C3C43' }}>{userDoc.institution}</span>
                </div>
            )}
            <div style={{ padding: '14px', background: memberTier === 'free' ? 'rgba(0,122,255,0.07)' : 'rgba(52,199,89,0.07)', borderRadius: 14, border: `1px solid ${memberTier === 'free' ? 'rgba(0,122,255,0.15)' : 'rgba(52,199,89,0.2)'}`, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: memberTier === 'free' ? '#007AFF' : '#34C759' }}>
                    {memberTier === 'free' ? 'חשבון פרטי' : `✓ דרג ${tierLabel} — חבר מועדון`}
                </p>
                <p style={{ fontSize: 12, color: '#86868B', marginTop: 4 }}>
                    {memberTier === 'free' ? 'אמת מספר מוסד לקבלת מחירים מוסדיים' : 'הטבות החברות מופעלות אוטומטית על כל הרכישות'}
                </p>
            </div>
            <button onClick={handleOut} style={{ ...mBtn('transparent'), color: '#FF3B30', background: 'rgba(255,59,48,0.07)', marginTop: 0 }}>
                יציאה מהחשבון
            </button>
        </div>
    );
}

function MRoleSelect({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const sel = ROLES.find(r => r.value === value) || ROLES[0];
    return (
        <div style={{ position: 'relative', marginBottom: 12 }}>
            <button type="button" onClick={() => { haptic('light'); setOpen(v => !v); }} style={{
                width: '100%', height: 52, borderRadius: 14, background: '#F2F2F7',
                border: open ? '1.5px solid #007AFF' : '1.5px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', fontSize: 16, color: '#1D1D1F', fontWeight: 500,
                cursor: 'pointer', fontFamily: SF, WebkitTapHighlightColor: 'transparent',
            }}>
                <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', display: 'flex' }}>▾</span>
                <span>{sel.label}</span>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', borderRadius: 16, boxShadow: '0 8px 36px rgba(0,0,0,0.14)', overflow: 'hidden', zIndex: 20 }}>
                        {ROLES.map(r => (
                            <button key={r.value} type="button" onClick={() => { haptic('light'); onChange(r.value); setOpen(false); }} style={{
                                width: '100%', padding: '15px 16px', background: value === r.value ? '#F2F2F7' : 'none',
                                border: 'none', textAlign: 'right', fontSize: 16,
                                color: value === r.value ? '#007AFF' : '#1D1D1F',
                                fontWeight: value === r.value ? 700 : 500,
                                cursor: 'pointer', fontFamily: SF, WebkitTapHighlightColor: 'transparent',
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

function ErrBanner({ msg }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,59,48,0.08)', borderRadius: 12, marginBottom: 12, border: '1px solid rgba(255,59,48,0.16)' }}>
            <AlertCircle size={15} color="#FF3B30" />
            <span style={{ fontSize: 14, color: '#FF3B30', fontWeight: 600 }}>{msg}</span>
        </div>
    );
}

function mBtn(bg) {
    return {
        width: '100%', height: 54, borderRadius: 16, border: 'none',
        background: bg === 'transparent' ? 'transparent' : bg,
        color: bg === 'transparent' ? '#007AFF' : '#fff',
        fontSize: 17, fontWeight: 700, cursor: 'pointer',
        marginTop: 8, fontFamily: SF,
        boxShadow: bg !== 'transparent' ? `0 4px 20px ${bg}44` : 'none',
        WebkitTapHighlightColor: 'transparent',
    };
}
