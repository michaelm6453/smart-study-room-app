// Shared button component that keeps visual language consistent across screens.
import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, spacing, type } from "../lib/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "accent";

export default function Button({
  title,
  onPress,
  variant = "primary",
  style,
  disabled,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  // Map the variant to the right background color.
  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
      ? colors.danger
      : variant === "accent"
      ? colors.accent
      : colors.card;

  const textColor = variant === "secondary" ? colors.text : "#FFFFFF";
  const borderColor = variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor,
          opacity: disabled ? 0.6 : pressed ? 0.88 : 1,
          borderColor,
          borderWidth: variant === "secondary" ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[type.body, styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontWeight: "600" },
});