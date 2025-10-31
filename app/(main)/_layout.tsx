// Tab layout for the signed-in experience: browse rooms, check bookings, manage profile.
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

function TabIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  // All tabs share the same icon component so the size stays consistent.
  return <Ionicons name={name} size={20} color={color} />;
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      {/* Primary browse tab shows the searchable room catalog. */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      {/* Bookings tab surfaces upcoming and past reservations for the user. */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      {/* Profile tab handles auth actions and exposes the admin manager. */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />
      {/* Hidden stack for room details + admin manager; accessed via navigation only. */}
      <Tabs.Screen
        name="(rooms)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}