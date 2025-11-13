// Profile tab: shows user info, sign-out, and entry point to admin tools.
import React from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import VideoHighlight from "../../components/VideoHighlight";
import { colors, spacing, radius, type } from "../../lib/theme";
import { auth } from "../../lib/firebase";

export default function ProfileScreen() {
  const user = auth.currentUser;
  const tourVideo = { uri: "https://youtu.be/Y_YLo5kfD-Y" };

  const onSignOut = () => {
    // Friendly confirm so users don't accidentally boot themselves.
    Alert.alert("Sign out?", "You will need to log back in to continue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const goToManageRooms = () => {
    // Route into the hidden admin stack for room CRUD.
    router.push("/(main)/(rooms)/manage");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={[type.h1, styles.title]}>Profile</Text>
          <Text style={[type.small, styles.subtitle]}>
            Signed in as <Text style={styles.bold}>{user?.email}</Text>
          </Text>
        </View>

        <VideoHighlight
          title="Smart Study Room tour"
          description="Take a quick walkthrough of the app before you start booking spaces."
          source={tourVideo}
        />

        <View style={styles.section}>
          <Text style={[type.h2, styles.sectionTitle]}>Your Account</Text>
          <Button title="Sign Out" variant="danger" onPress={onSignOut} />
        </View>

        <View style={styles.section}>
          <Text style={[type.h2, styles.sectionTitle]}>Admin Tools</Text>
          <Text style={[type.small, styles.sectionSubtitle]}>
            Manage room inventory and stay tuned for role-based access controls.
          </Text>
          <Button
            title="Open Room Manager (Admin mode)"
            variant="accent"
            onPress={goToManageRooms}
            style={styles.manageBtn}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { color: colors.text },
  subtitle: { color: colors.subtext },
  bold: { color: colors.text, fontWeight: "600" },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text },
  sectionSubtitle: { color: colors.subtext },
  manageBtn: { marginTop: spacing.sm },
});
