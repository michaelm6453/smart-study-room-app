// Central palette + spacing tokens so the app stays on-brand and consistent.
export const colors = {
  bg: "#001B3A",
  card: "#0E2F56",
  text: "#F5F8FE",
  subtext: "#A7BCD8",
  primary: "#0054A4",
  accent: "#F47920",
  danger: "#FF6B6B",
  border: "rgba(255,255,255,0.14)",
  inputBg: "rgba(255,255,255,0.08)",
  inputBorder: "rgba(255,255,255,0.18)",
} as const;

// Spacing + radii keep paddings/rounded corners predictable.
export const spacing = { xs: 6, sm: 10, md: 16, lg: 20, xl: 28 } as const;
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

// Give fontWeight literal types so RN accepts them.
export const type = {
  h1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: 0.2 },
  h2: { fontSize: 20, fontWeight: "600" as const, letterSpacing: 0.2 },
  body: { fontSize: 16, fontWeight: "400" as const },
  small: { fontSize: 13, fontWeight: "400" as const },
} as const;