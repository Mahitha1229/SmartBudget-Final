// app/_layout.tsx

import React, { useContext } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthContext, AuthProvider } from './lib/providers'; 
import './lib/firebase'; // Ensure Firebase initialization runs once

function RootLayoutContent() {
    const { user, loading } = useContext(AuthContext); 
    const segments = useSegments(); // Get the current route segments

    // Check if the current route is within the (auth) group
    const inAuthGroup = segments[0] === '(auth)';

    // 1. Loading State Check
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
        );
    }

    // 2. CORE LOGIC: Handle Redirects
    
    // CASE A: User is NOT logged in AND they are NOT currently in the (auth) group.
    // --> Force them to login.
    if (!user && !inAuthGroup) {
        return <Redirect href="/(auth)/login" />; 
    }

    // CASE B: User IS logged in AND they ARE currently in the (auth) group.
    // --> Force them into the main app.
    if (user && inAuthGroup) {
        return <Redirect href="/(tabs)" />; 
    }
    
    // 3. Render the Stack (The Stack only includes the screens the user is allowed to navigate between)
    return (
      <Stack>
        {/* Auth Group: Only accessible when logged out, but must be defined */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} /> 
        
        {/* Tabs Group: Main app content */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
        
        {/* Isolated modal/full-screen routes */}
        <Stack.Screen name="add-transaction" options={{ title: 'New Transaction' }} />
      </Stack>
    );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F8FAFC'
    }
});