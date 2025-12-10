// app/(auth)/login.tsx

"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { 
  // Standard Email/Password Sign-in
  signInWithEmailAndPassword,
  
  // CORRECTED: Google Provider and Popup Sign-in
  GoogleAuthProvider,     
  signInWithPopup,        
  AuthError, 
} from "firebase/auth" 

import { auth } from "../lib/firebase" 
import { router } from "expo-router"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleLogin = async () => {
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // ⭐️ FIX: Navigating to the root ('/') triggers the authenticated redirect
      router.replace("/") 
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Function to handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("")
    setLoading(true)
    const provider = new GoogleAuthProvider()

    try {
      await signInWithPopup(auth, provider)
      // ⭐️ FIX: Navigating to the root ('/') triggers the authenticated redirect
      router.replace("/") 
    } catch (err: unknown) {
      const authError = err as AuthError 
      
      console.error("Google Sign-In Error:", authError)

      let errorMessage = "Google Sign-In failed."
      
      if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in window closed. Please try again.';
      } else if (authError.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in request was interrupted. Please try again.';
      } else if (authError.message) {
        errorMessage = authError.message
      }
      
      Alert.alert('Sign-In Error', errorMessage);
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>💰</Text>
          </View>
          <Text style={styles.title}>SmartBudget</Text>
          <Text style={styles.subtitle}>Manage your finances with ease</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused, error && styles.inputError]}
              placeholder="name@example.com"
              placeholderTextColor="#A0AEC0"
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused, error && styles.inputError]}
              placeholder="••••••••"
              placeholderTextColor="#A0AEC0"
              secureTextEntry
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              editable={!loading}
            />
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Login Button (Email/Password) */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>
          
          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.btnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#1E293B" size="small" />
            ) : (
              <View style={styles.googleBtnContent}>
                <Text style={styles.googleLogo}>G</Text>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>New to SmartBudget?</Text>
            <View style={styles.divider} />
          </View>

          {/* Signup Link */}
          {/* ⭐️ FIX: Use the correct path for signup, which is relative to the root '/' now */}
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} disabled={loading} activeOpacity={0.7}> 
            <Text style={styles.signupLink}>Create a new account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "400",
  },
  // Form Styles
  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    fontWeight: "500",
  },
  inputFocused: {
    borderColor: "#0EA5E9",
    backgroundColor: "#F0F9FF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 16,
    fontWeight: "500",
    paddingLeft: 4,
  },
  btn: {
    backgroundColor: "#0EA5E9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 12, // Added space below primary button
  },
  // ⭐️ NEW: Google Button Styles
  googleBtn: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // Light grey border
    marginTop: 12,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    fontSize: 18,
    marginRight: 10,
    color: '#4285F4', // Google Blue/G color (simplified)
    fontWeight: '700',
  },
  googleBtnText: {
    color: "#1E293B",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  // END NEW: Google Button Styles
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  signupLink: {
    textAlign: "center",
    color: "#0EA5E9",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 12,
  },
})