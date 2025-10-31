// Root layout decides whether we show the authenticated tab navigator or the auth stack.
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Keep a live reference to auth state so the router swaps screens automatically.
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* When we have a logged-in user, drop them into the main tab experience. */}
      {user ? (
        <Stack.Screen name="(main)" />
      ) : (
        // Otherwise go to the login stack.
        <Stack.Screen name="(auth)/login" />
      )}
    </Stack>
  );
}