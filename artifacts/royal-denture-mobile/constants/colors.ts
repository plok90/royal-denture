/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: "#1a0a05",
    tint: "#c9a84c",

    background: "#f4f0ea",
    foreground: "#1a0a05",

    card: "#ffffff",
    cardForeground: "#1a0a05",

    primary: "#c9a84c",
    primaryForeground: "#1a0a05",

    secondary: "#faf7f4",
    secondaryForeground: "#1a0a05",

    muted: "#faf7f4",
    mutedForeground: "#9a8878",

    accent: "#f4f0ea",
    accentForeground: "#1a0a05",

    destructive: "#e57373",
    destructiveForeground: "#ffffff",

    border: "#ddd5c8",
    input: "#ddd5c8",
  },

  dark: {
    text: "#f5efe6",
    tint: "#c9a84c",

    background: "#0d0502",
    foreground: "#f5efe6",

    card: "#1a0a05",
    cardForeground: "#f5efe6",

    primary: "#c9a84c",
    primaryForeground: "#1a0a05",

    secondary: "#251208",
    secondaryForeground: "#f5efe6",

    muted: "#251208",
    mutedForeground: "#8a7060",

    accent: "#251208",
    accentForeground: "#f5efe6",

    destructive: "#e57373",
    destructiveForeground: "#ffffff",

    border: "#3a1f10",
    input: "#3a1f10",
  },

  radius: 12,
};

export default colors;
