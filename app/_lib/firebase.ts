// _lib/firebase.ts
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  // @ts-expect-error - getReactNativePersistence exists in the RN build that
  // Metro resolves at runtime, but tsc's Node module resolution only sees the
  // web build's types. This is a known gap in firebase-js-sdk + Expo tooling.
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Reads from .env / .env.local via Expo's built-in EXPO_PUBLIC_ env support.
// No extra package needed — Expo inlines these at build time automatically.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail loudly in dev if someone forgets to set up .env — better than a silent
// blank-screen Firebase init failure that's a nightmare to debug.
if (__DEV__ && !firebaseConfig.apiKey) {
  console.warn(
    '⚠️ Firebase config is missing. Did you create a .env file? See .env.example.'
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = (() => {
  if (Platform.OS === 'web') {
    return getAuth(app);
  } else {
    try {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch {
      return getAuth(app);
    }
  }
})();

export const db = getFirestore(app);