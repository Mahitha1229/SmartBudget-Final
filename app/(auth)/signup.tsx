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
} from "react-native"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "../lib/firebase" 
import { router } from "expo-router"

export default function SignupScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSignup = async () => {
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.replace("/login") // redirect to login after signup
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SmartBudget and manage your finances</Text>
        </View>

        <View style={styles.formContainer}>
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="white" size="small" /> : <Text style={styles.btnText}>Sign Up</Text>}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity onPress={() => router.push("/login")} disabled={loading} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
  header: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#1E293B", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "400" },
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
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, padding: 14, fontSize: 16, color: "#1E293B", backgroundColor: "#F8FAFC", fontWeight: "500" },
  inputFocused: { borderColor: "#0EA5E9", backgroundColor: "#F0F9FF" },
  inputError: { borderColor: "#EF4444" },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 16, fontWeight: "500", paddingLeft: 4 },
  btn: { backgroundColor: "#0EA5E9", padding: 14, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 8, shadowColor: "#0EA5E9", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: "#94A3B8", fontWeight: "500" },
  loginLink: { textAlign: "center", color: "#0EA5E9", fontSize: 14, fontWeight: "600", paddingVertical: 12 },
})
