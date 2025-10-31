// Hidden stack for room details and admin tools; accessed from tabs via navigation only.
import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../../lib/theme";

export default function RoomsLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      {/* Detail screen for a single room, pushed from Browse/Bookings. */}
      <Stack.Screen
        name="[roomId]"
        options={{
          title: "Room Details",
        }}
      />
      {/* Admin CRUD screen lives in the same stack for easy routing. */}
      <Stack.Screen
        name="manage"
        options={{
          title: "Manage Rooms",
        }}
      />
    </Stack>
  );
}