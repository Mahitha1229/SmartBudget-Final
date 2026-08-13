import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '../_lib/useThemeStore';
import { Colors } from '../../constants/theme';
import { router } from 'expo-router';

export default function TabLayout() {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? Colors.dark : Colors.light;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.subtext,
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderTopWidth: 0,
            height: 68,
            paddingBottom: 12,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'flash' : 'flash-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/modal')}
        activeOpacity={0.8}
      >
        <View style={[styles.fabInner, { backgroundColor: theme.tint }]}>
          <Ionicons name="add" size={32} color="white" />
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    alignSelf: 'center',
    zIndex: 1000,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});