import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// @ts-ignore
import localConfig from '../../firebase-applet-config.json';

// Support both environment variables (for Netlify/Vercel) and the config file (for local/preview)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig?.apiKey || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig?.authDomain || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig?.projectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig?.storageBucket || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig?.messagingSenderId || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig?.appId || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig?.measurementId || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localConfig?.firestoreDatabaseId || ""
};

// Initialize Firebase safely
let app = null;
const isConfigValid = !!firebaseConfig.apiKey;

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase configuration is incomplete. Authentication will be disabled.");
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined) : null;
export const googleProvider = new GoogleAuthProvider();
export const loginWithGoogle = () => (auth && !auth.currentUser) ? signInWithPopup(auth, googleProvider) : Promise.resolve();
export const logout = () => auth ? signOut(auth) : Promise.resolve();
export const hasConfig = isConfigValid;
