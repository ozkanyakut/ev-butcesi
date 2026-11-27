import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQxsLhnpkjL8IQqelqoFrKe68Cpgqup2A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "home-budget-c9f7c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "home-budget-c9f7c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "home-budget-c9f7c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "226490342667",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:226490342667:web:e59e43a1f3d3fbdf73560e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-63X5HH4P3G"
};

let db = null;
let isFirebaseActive = true;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase bağlantısı kurulamadı:", error);
  isFirebaseActive = false;
}

export { db, isFirebaseActive };
