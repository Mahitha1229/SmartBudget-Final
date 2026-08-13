// smartbudget/app/_layout.tsx
import "../global.css";
import React, { useEffect } from 'react'; 
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Text, Dimensions } from 'react-native'; 
import { SafeAreaProvider } from 'react-native-safe-area-context'; 
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';

import { useAuthStore } from './_lib/useAuthStore'; 
import { useThemeStore } from './_lib/useThemeStore'; 
import { Colors } from '../constants/theme'; 

const { width, height } = Dimensions.get('window');

// ✨ VIBRANT LIQUID BACKGROUND COMPONENT
function BackgroundGlow() {
  const { isDarkMode } = useThemeStore();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? '#020617' : '#F8FAFC', zIndex: -1 }]}>
      <View style={[styles.blob, { backgroundColor: '#3B82F6', top: -100, left: -100, opacity: isDarkMode ? 0.15 : 0.1 }]} />
      <View style={[styles.blob, { backgroundColor: '#8B5CF6', bottom: -100, right: -100, opacity: isDarkMode ? 0.12 : 0.08 }]} />
    </View>
  );
}
function RootLayoutContent() {
    const { user, isLoading, initializeAuth } = useAuthStore(); 
    const { isDarkMode } = useThemeStore();
    const theme = isDarkMode ? Colors.dark : Colors.light;
    const segments = useSegments(); 
    const router = useRouter();
    
    useEffect(() => {
        const unsubscribe = initializeAuth();
        return () => unsubscribe();
    }, []); 

    useEffect(() => {
        if (isLoading) return;
        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            router.replace("/(tabs)");
        }
    }, [user, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <BackgroundGlow />
                <ActivityIndicator size="large" color={theme.tint} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>SmartBudget is waking up...</Text> 
            </View>
        );
    }

    return (
      <>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <BackgroundGlow />
        <Stack screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' }, // Important: Let the Glow show through
            animation: 'fade_from_bottom' 
        }}>
            <Stack.Screen name="(auth)" /> 
            <Stack.Screen name="(tabs)" /> 
            <Stack.Screen name="modal" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} /> 
            <Stack.Screen name="edit-transaction" options={{ presentation: 'modal' }} /> 
            <Stack.Screen name="import-screen" options={{ presentation: 'card' }} /> 
        </Stack>
      </>
    );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontWeight: '600', letterSpacing: 0.5 },
    blob: {
      position: 'absolute',
      width: width * 1.2,
      height: width * 1.2,
      borderRadius: width,
      opacity: 0.1,
      // On real devices, BlurView is better, but this works universally
    }
});