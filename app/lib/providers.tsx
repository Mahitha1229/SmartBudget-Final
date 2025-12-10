// lib/providers.tsx

"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "./firebase" 
import { ActivityIndicator, View, StyleSheet } from 'react-native'; 

// --- 1. DEFINE THE CONTEXT TYPE ---
interface AuthContextType {
  user: User | null;
  loading: boolean; 
}

// --- 2. INITIALIZE CONTEXT ---
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// --- 3. NEW: CUSTOM HOOK for easier access ---
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth object is undefined during useEffect initialization.")
      setLoading(false); // Stop loading if auth object is missing
      return; 
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, []) 

  // --- CRUCIAL: RENDER A LOADING SCREEN ---
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  // --- EXPOSE BOTH PROPERTIES IN THE VALUE ---
  return (
    <AuthContext.Provider value={{ user, loading }}> 
        {children}
    </AuthContext.Provider>
  );
}

// Basic styles for the loading screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});