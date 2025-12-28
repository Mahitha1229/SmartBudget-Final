// SmartBudget/app/(tabs)/_layout-premium.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../_lib/useThemeStore';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// 🌟 PREMIUM FLOATING TAB BAR
const TabBarIcon = ({ name, color, focused }: any) => (
  <View style={{ position: 'relative' }}>
    {focused && (
      <View style={[styles.activeIndicator, { backgroundColor: color + '20' }]}>
        <LinearGradient
          colors={[color + '40', color + '00']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    )}
    <Ionicons 
      name={name} 
      size={focused ? 28 : 24} 
      color={color}
      style={{ zIndex: 1 }}
    />
  </View>
);

// 💫 FAB (Floating Action Button)
const FloatingActionButton = ({ theme }: any) => (
  <TouchableOpacity
    style={styles.fab}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      router.push('/modal');
    }}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={theme.primaryGradient}
      style={styles.fabGradient}
    >
      <Ionicons name="add" size={32} color="white" />
    </LinearGradient>
    
    {/* Pulse animation ring */}
    <View style={styles.fabPulse} />
  </TouchableOpacity>
);

export default function PremiumTabLayout() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.subtext,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 4,
            letterSpacing: 0.3,
          },
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            bottom: Platform.OS === 'ios' ? 35 : 25,
            left: 20,
            right: 20,
            height: 68,
            borderRadius: 24,
            paddingBottom: 12,
            paddingTop: 12,
            paddingHorizontal: 8,
            ...theme.shadow.large,
            overflow: 'hidden',
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint={isDarkMode ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : null
          ),
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? "home" : "home-outline"} color={color} focused={focused} />
            )
          }} 
        />
        
        <Tabs.Screen 
          name="activity" 
          options={{ 
            title: 'Activity',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? "flash" : "flash-outline"} color={color} focused={focused} />
            )
          }} 
        />
        
        {/* CENTER SPACER FOR FAB - FIXED: Removed href, kept only tabBarButton */}
        <Tabs.Screen 
          name="placeholder" 
          options={{ 
            title: '',
            tabBarButton: () => <View style={{ width: 60 }} />,
          }} 
        />
        
        <Tabs.Screen 
          name="budget" 
          options={{ 
            title: 'Budget',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? "pie-chart" : "pie-chart-outline"} color={color} focused={focused} />
            )
          }} 
        />
        
        <Tabs.Screen 
          name="reports" 
          options={{ 
            title: 'Insights',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? "bulb" : "bulb-outline"} color={color} focused={focused} />
            )
          }} 
        />

        {/* HIDDEN SCREENS */}
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="transactions" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
      
      {/* FLOATING ACTION BUTTON */}
      <FloatingActionButton theme={theme} />
    </>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -11,
    left: -11,
  },
  
  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 105 : 95, // Raised higher to clear the tab bar
    left: '50%',
    marginLeft: -32, // Slightly adjusted for better centering
    width: 64,
    height: 64,
    borderRadius: 32,
    zIndex: 1000,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  fabPulse: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    opacity: 0.2,
  },
});