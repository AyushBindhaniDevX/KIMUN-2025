import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { SymbolView } from 'expo-symbols';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1e3a8a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <SymbolView name="house.fill" size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <SymbolView name="calendar" size={24} tintColor={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <SymbolView name="person.fill" size={24} tintColor={color} />,
        }}
      />
    </Tabs>
  );
}
