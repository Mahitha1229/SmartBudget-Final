// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0EA5E9", // Sky Blue 500
        tabBarInactiveTintColor: "#94A3B8", // Slate 400
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0", // Slate 200
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#FFFFFF",
          borderBottomColor: "#E2E8F0",
          borderBottomWidth: 1,
        },
        headerTintColor: "#1E293B", // Slate 800
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard", // Header Title for this screen
          tabBarLabel: "Home", // Label on the tab bar
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          headerTitle: "SmartBudget",
        }}
      />
      
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarLabel: "Activity",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💸</Text>,
          headerTitle: "Transactions",
        }}
      />
      
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarLabel: "Budget",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text>,
          headerTitle: "My Budgets",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarLabel: "Discover",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔍</Text>,
          headerTitle: "Explore Finances",
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
          headerTitle: "Profile",
        }}
      />
      
      {/* ⚠️ Hides the 'add-transaction' route from the bottom tab bar. 
           It must be hidden because it's meant to be a standalone modal/screen. */}
      <Tabs.Screen
        name="add-transaction"
        options={{
          href: null, // This hides the tab entry
        }}
      />
    </Tabs>
  );
}