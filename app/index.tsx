// Entry point used by Expo Router before the auth-aware stack decides where to go.
import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { View, Text } from "react-native";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Track auth state here so we can redirect without flashing the wrong screen.
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setReady(true); });
    return unsub;
  }, []);

  if (!ready) return <View style={{flex:1,justifyContent:"center",alignItems:"center"}}><Text>Loading…</Text></View>;
  return <Redirect href={user ? "/(main)/home" : "/(auth)/login"} />;
}