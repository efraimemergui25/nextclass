import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCcnEihNUeJHzYxs-r5AB0MkUvU4o5GgtA",
    authDomain: "nextclass-d2364.firebaseapp.com",
    projectId: "nextclass-d2364",
    storageBucket: "nextclass-d2364.firebasestorage.app",
    appId: "1:1031510594625:web:1109be9a4ad8ecbd6b62c0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sign in with admin credentials
const email = process.env.FB_EMAIL;
const password = process.env.FB_PASS;
if (!email || !password) { console.error('Set FB_EMAIL and FB_PASS env vars'); process.exit(1); }

await signInWithEmailAndPassword(auth, email, password);
console.log('Signed in as', email);

const ref = doc(db, 'cms_settings', 'global_config');
await updateDoc(ref, {
    nav_items: [
        { id: 'home',     path: '/',         labelKey: 'nav_home',     defaultLabel: 'דף הבית',       visible: true  },
        { id: 'catalog',  path: '/catalog',  labelKey: 'nav_catalog',  defaultLabel: 'המוצרים שלנו', visible: true, isMega: true },
        { id: 'compare',  path: '/compare',  labelKey: 'nav_compare',  defaultLabel: 'השוואת דגמים', visible: true  },
        { id: 'story',    path: '/story',    labelKey: 'nav_about',    defaultLabel: 'הסיפור שלנו',  visible: true  },
        { id: 'vod',      path: '/vod',      labelKey: 'nav_vod',      defaultLabel: 'מרכז הדרכה',   visible: true  },
        { id: 'magazine', path: '/magazine', labelKey: 'nav_magazine', defaultLabel: 'מגזין',         visible: true  },
        { id: 'contact',  path: '/contact',  labelKey: 'nav_contact',  defaultLabel: 'צור קשר',       visible: true  },
    ]
});
console.log('nav_items restored — all 7 items visible');
process.exit(0);
