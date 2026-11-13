// Zeeroz Academy Firebase client initialization
// Client-side Firebase config is intended to be public. Protect data with Firebase Security Rules.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVERRcF8RFRVsqUmPWta6dCTnkQ3RDwuk",
  authDomain: "zeeroz-academy.firebaseapp.com",
  projectId: "zeeroz-academy",
  storageBucket: "zeeroz-academy.firebasestorage.app",
  messagingSenderId: "329464360798",
  appId: "1:329464360798:web:75d5d4806fcf414d2fa9cf",
  measurementId: "G-DMXP87ZEJ6"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase Auth persistence setup failed:", error);
});

onAuthStateChanged(auth, (user) => {
  window.dispatchEvent(new CustomEvent("zeeroz-auth-state", {
    detail: { user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    } : null }
  }));
});

window.ZeerozFirebase = Object.freeze({ app, auth, db, storage });
window.dispatchEvent(new CustomEvent("zeeroz-firebase-ready"));
console.info("Zeeroz Academy Firebase initialized.");
