// Lightweight text input wrapper so fields share styling.
import React from "react";
import { TextInput, StyleSheet, View, TextInputProps, ViewStyle } from "react-native";
import { colors, radius, spacing } from "../lib/theme";

type Props = TextInputProps & {
  containerStyle?: ViewStyle;
};

export default function Input({ containerStyle, style, ...props }: Props) {
  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        // Soft placeholder color keeps things legible against the dark theme.
        placeholderTextColor={colors.subtext}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  input: {
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
  },
});