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

const firebaseConfig = {
  apiKey: "AIzaSyDf1fHXBe6Tw3hEXPh3dYuNbcin6k2h0xY",
  authDomain: "smartbudget-53476.firebaseapp.com",
  projectId: "smartbudget-53476",
  storageBucket: "smartbudget-53476.firebasestorage.app",
  messagingSenderId: "613170777672",
  appId: "1:613170777672:web:840734dd75858de924527d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = (() => {
  if (Platform.OS === 'web') {
    return getAuth(app);
  } else {
    try {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch (e) {
      return getAuth(app); 
    }
  }
})();

export const db = getFirestore(app);