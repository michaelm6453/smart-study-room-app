// Firebase bootstrap: wires up the Expo-configured project for auth + Firestore usage.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string | undefined>;

const app = initializeApp({
  apiKey: extra.FIREBASE_API_KEY,
  authDomain: extra.FIREBASE_AUTH_DOMAIN,
  projectId: extra.FIREBASE_PROJECT_ID,
  storageBucket: extra.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.FIREBASE_APP_ID,
  measurementId: extra.FIREBASE_MEASUREMENT_ID,
});

// Export typed singletons so the rest of the app can import them safely.
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };