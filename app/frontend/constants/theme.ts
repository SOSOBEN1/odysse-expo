// constants/theme.ts
import { Platform } from "react-native";

// ─── Base palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Brand – violet
  primary:     "#6949A8",
  secondary:   "#9574E0",
  primaryLight:"#B39DDB",
  primaryPale: "#EDE8F8",

  // UI
  background:  "#E8DFFA",   // fond violet pastel (page mission)
  card:        "#F3EFFE",
  white:       "#FFFFFF",
  text:        "#2D1F5E",
  textLight:   "#7B6BA8",
  subtitle:    "#6949A8",
  border:      "#D1C4E9",

  // Game states
  success:     "#4CAF50",
  successLight:"#A5D6A7",
  locked:      "#B39DDB",
  lockedBg:    "#D1C4E9",
  gold:        "#FFD54F",
  goldDark:    "#F9A825",
  coinYellow:  "#FFC107",

  // Progress bar
  progressBg:  "#D1C4E9",
  progressFill:"#6949A8",
};

export const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  medium: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  purple: {
    shadowColor: "#6949A8",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
};

export const SIZES = {
  padding:      20,
  paddingSm:    12,
  radius:       16,
  radiusSm:     10,
  radiusLg:     24,
  radiusFull:   999,
};

export const Fonts = Platform.select({
  ios: {
    sans:    "system-ui",
    serif:   "ui-serif",
    rounded: "ui-rounded",
    mono:    "ui-monospace",
  },
  default: {
    sans:    "normal",
    serif:   "serif",
    rounded: "normal",
    mono:    "monospace",
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Legacy Colors export (compatible avec expo default)
const tintColorLight = COLORS.primary;
const tintColorDark  = "#fff";

const Colors = {
  light: {
    text:           "#11181C",
    background:     COLORS.background,
    tint:           tintColorLight,
    icon:           COLORS.textLight,
    tabIconDefault: COLORS.textLight,
    tabIconSelected:tintColorLight,
  },
  dark: {
    text:           "#ECEDEE",
    background:     "#151718",
    tint:           tintColorDark,
    icon:           "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected:tintColorDark,
  },
};

export default Colors;
