import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";

function TabBarBackground() {
  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={80}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0f1e" }]} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#475569",
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          borderTopColor: "transparent",
          backgroundColor: "transparent",
          elevation: 0,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="committee"
        options={{
          title: "Committee",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
