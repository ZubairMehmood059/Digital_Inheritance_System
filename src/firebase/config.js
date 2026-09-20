import { initializeApp } from "firebase/app";
import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredConfigKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingConfigKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

export const firebaseConfigError = missingConfigKeys.length
  ? `Missing Firebase environment variables: ${missingConfigKeys.map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`).join(", ")}`
  : null;

export const app = firebaseConfigError
  ? null
  : (getApps()[0] || initializeApp(firebaseConfig));

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
