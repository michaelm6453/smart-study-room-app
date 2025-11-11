import React, { useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { router } from "expo-router";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { colors, spacing, radius, type } from "../../lib/theme";

const heroImage = require("../../assets/ontariotechu-og-image.jpg");

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  async function onSignIn() {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pw);
      router.replace("/(main)/home");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function onSignUp() {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pw);
      router.replace("/(main)/home");
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <Screen>
      <Image source={heroImage} style={styles.hero} resizeMode="cover" />
      <View style={{ height: spacing.md }} />
      <View style={styles.card}>
        <Text style={[type.h1, styles.title]}>Smart Study Room</Text>
        <Text style={[type.small, styles.subtitle]}>Sign in or create an account</Text>

        <View style={{ height: spacing.md }} />
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={{ height: spacing.sm }} />
        <Input
          placeholder="Password"
          secureTextEntry={true}
          value={pw}
          onChangeText={setPw}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.md }} />
        <Button title="Sign In" onPress={onSignIn} />
        <View style={{ height: spacing.sm }} />
        <Button title="Create Account" onPress={onSignUp} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 180,
    borderRadius: radius.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    shadowColor: "#102A43",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { color: colors.text, textAlign: "center" },
  subtitle: { color: colors.subtext, textAlign: "center", marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.sm },
});
