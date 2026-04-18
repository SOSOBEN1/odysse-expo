// styles/theme.ts

export const COLORS = {
  primary:           "#6949a8",
  secondary:         "#9574e0",
  background:        "#ffffff",
  card:              "#fdfdff",
  text:              "#000",
  subtitle:          "#6949a8",
  border:            "#eaeaea",

  // Text
  textPurple:        "#5A4C91",
  textMuted:         "#9E9E9E",

  // Cards / overlays
  cardOverlay:       "rgba(255,255,255,0.5)",
  cardOverlayStrong: "rgba(255,255,255,0.7)",
  divider:           "rgba(0,0,0,0.05)",

  // UI Controls
  switchTrackOff:    "#D1D1D1",
  iconBg:            "#F0E6FF",

  // Logout button
  logoutStart:       "#FF9AA2",
  logoutEnd:         "#FF6B6B",

  // ── MissionsScreen ──────────────────────────
  missionBg:         "#f5f3ff",        // container background
  missionHeading:    "#2d1a5e",        // greeting, sectionTitle, missionTitle
  missionSub:        "#7a5bbf",        // subGreeting
  missionTabBorder:  "#c0a8f0",        // tab border color
  missionTabActive:  "#6c3fcb",        // active tab + countBadge + iconBox difficile
  missionProgress:   "rgba(180,160,220,0.25)", // progress track bg
  missionDesc:       "#5a5080",        // description text
  missionDuration:   "#9b8bbf",        // duration + empty state text
  missionCreateBtn:  "#4b2fa0",        // create button bg
  missionUrgentBg:   "#fff0f7",        // urgent banner bg
  missionUrgentText: "#e84393",        // urgent text + delete icon

  // Difficulty badges
  diffHard:          "#e84393",        // Difficile badge + progress
  diffHardEvent:     "#6c3fcb",        // Difficile event badge (same as missionTabActive)
  diffMedium:        "#f5a623",        // Moyen badge + progress + event
  diffEasy:          "#5ab4e5",        // Facile badge + progress
  diffEasyEvent:     "#7ab8d9",        // Facile event badge + btn

  // Cards
  cardActionBg:      "rgba(120,90,180,0.05)",  // action icon btn bg
  cardDivider:       "rgba(0,0,0,0.04)",        // card bottom border
};

export const SIZES = {
  padding: 20,
  radius: 20,
  radiusLarge: 25,
};

export const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  medium: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 7,
  },
};