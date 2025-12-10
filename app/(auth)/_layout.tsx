// app/(auth)/_layout.tsx

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      {/* Set the Login screen as the initial screen for the Auth Stack */}
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false, // Hides the header bar for the login screen
          title: 'Sign In' 
        }} 
      />
      {/* The Signup screen is also part of this stack */}
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false, 
          title: 'Create Account' 
        }} 
      />
    </Stack>
  );
}