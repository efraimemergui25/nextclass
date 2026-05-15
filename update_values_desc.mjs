import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBqLMCrFfmyfKYAJkFcLH9WPkWp3zHJqYI",
  authDomain: "nextclass-19e71.firebaseapp.com",
  projectId: "nextclass-19e71",
  storageBucket: "nextclass-19e71.firebasestorage.app",
  messagingSenderId: "1090782678058",
  appId: "1:1090782678058:web:e26a68c21de6a53ccf17f5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ref = doc(db, 'cms_settings', 'global_config');
await setDoc(ref, { about_values_desc: 'מה שאמרנו — עמדנו בו. תמיד.' }, { merge: true });
console.log('Updated about_values_desc');
process.exit(0);
