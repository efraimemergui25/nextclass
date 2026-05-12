import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCcnEihNUeJHzYxs-r5AB0MkUvU4o5GgtA",
    authDomain: "nextclass-d2364.firebaseapp.com",
    projectId: "nextclass-d2364",
    storageBucket: "nextclass-d2364.firebasestorage.app",
    messagingSenderId: "1031510594625",
    appId: "1:1031510594625:web:1109be9a4ad8ecbd6b62c0",
    measurementId: "G-F2C8KE9XE0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

export default app;
