import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const app = initializeApp({
    apiKey: "AIzaSyCcnEihNUeJHzYxs-r5AB0MkUvU4o5GgtA",
    authDomain: "nextclass-d2364.firebaseapp.com",
    projectId: "nextclass-d2364",
});
const db = getFirestore(app);
await updateDoc(doc(db, 'cms_settings', 'global_config'), {
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
console.log('nav_items restored — all 7 visible');
process.exit(0);
