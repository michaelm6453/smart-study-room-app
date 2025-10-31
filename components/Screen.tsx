import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../lib/theme";

// Simple wrapper so every screen shares background + padding.
export default function Screen({
  children,
  padded = true,
}: { children: React.ReactNode; padded?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top","right","left","bottom"]}>
      <View style={[styles.inner, padded && { padding: spacing.lg }]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
});