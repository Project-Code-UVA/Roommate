/**
 * App-wide constants for Room.
 */

export const APP_NAME = "Room";
export const APP_VERSION = "1.0.0";

/**
 * Tab names in display order.
 * Discovery is the center/primary tab (index 2).
 */
export const TAB_NAMES = [
  "Explore",
  "Likes",
  "Discovery",
  "Messages",
  "Profile",
] as const;

export type TabName = (typeof TAB_NAMES)[number];

/**
 * Color palette matching tailwind.config.js primary theme.
 * Purple/violet gradient - bold and youthful for Gen Z appeal.
 */
export const COLORS = {
  primary: {
    50: "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
  },
  white: "#ffffff",
  black: "#000000",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
} as const;

/**
 * Brand color shorthand.
 */
export const BRAND_COLOR = COLORS.primary[600];
