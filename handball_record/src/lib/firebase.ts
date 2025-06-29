// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBV9fqVp7dyxFx6IzAhZspjOqRZfjo0GmY",
  authDomain: "handballrecord.firebaseapp.com",
  projectId: "handballrecord",
  storageBucket: "handballrecord.firebasestorage.app",
  messagingSenderId: "128935331002",
  appId: "1:128935331002:web:2670dd07cfdae72c782e83",
  measurementId: "G-W4K0XTDYWB"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Offline persistence error:", err);
});

export { db, auth };
