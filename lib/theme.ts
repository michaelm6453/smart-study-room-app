// Central palette + spacing tokens so the app stays on-brand and consistent.
export const colors = {
  bg: "#E9F2FD",
  card: "#FFFFFF",
  text: "#102A43",
  subtext: "#4F6C8D",
  primary: "#1876D1",
  accent: "#FF8A3C",
  danger: "#FF6B6B",
  border: "rgba(16,42,67,0.08)",
  inputBg: "rgba(24,118,209,0.08)",
  inputBorder: "rgba(16,42,67,0.18)",
} as const;

// Spacing + radii keep paddings/rounded corners predictable.
export const spacing = { xs: 6, sm: 12, md: 18, lg: 26, xl: 34 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

// Give fontWeight literal types so RN accepts them.
export const type = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: 0.2 },
  h2: { fontSize: 20, fontWeight: "600" as const, letterSpacing: 0.2 },
  body: { fontSize: 16, fontWeight: "400" as const },
  small: { fontSize: 13, fontWeight: "400" as const },
} as const;
