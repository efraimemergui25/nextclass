import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCcnEihNUeJHzYxs-r5AB0MkUvU4o5GgtA",
    authDomain: "nextclass-d2364.firebaseapp.com",
    projectId: "nextclass-d2364",
    storageBucket: "nextclass-d2364.firebasestorage.app",
    messagingSenderId: "1031510594625",
    appId: "1:1031510594625:web:1109be9a4ad8ecbd6b62c0",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const ref = doc(db, 'cms_settings', 'global_config');

const updates = {
    // ── עמודים משפטיים ───────────────────────────────────────────
    legal_privacy_updated: '14 במאי 2026',
    legal_terms_updated:   '14 במאי 2026',
    legal_dpo_name:        'אפרים אמרגי',

    // ── בנר עוגיות ──────────────────────────────────────────────
    cookie_consent_title: 'אנו משתמשים בעוגיות',
    cookie_consent_body:  'כדי לשפר את חוויית השימוש ולנתח תנועה באתר.',

    // ── Footer — תוויות קישורים משפטיים ─────────────────────────
    footer_privacy: 'פרטיות',
    footer_terms:   'תנאי שימוש',
};

await setDoc(ref, updates, { merge: true });
console.log('✅ Legal settings pushed to Firestore:', Object.keys(updates).join(', '));
process.exit(0);
