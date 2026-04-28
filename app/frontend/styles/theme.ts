

// styles/theme.ts

export const COLORS = {
  primary:           "#6949a8",
  secondary:         "#9574e0",
  tertiary:          "#baaae7",
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
  iconBg:            "#e8e0ff",

  // Checkbox
  checkboxBorder:    "#aaa",
  checkboxActive:    "#0043a7",

  // Social icons
  googleRed:         "#EA4335",

  // Logout button
  logoutStart:       "#FF9AA2",
  logoutEnd:         "#FF6B6B",

  // ── MissionsScreen ──────────────────────────
  missionBg:         "#f5f3ff",
  missionHeading:    "#2d1a5e",
  missionSub:        "#7a5bbf",
  missionTabBorder:  "#c0a8f0",
  missionTabActive:  "#6c3fcb",
  missionProgress:   "rgba(180,160,220,0.25)",
  missionDesc:       "#5a5080",
  missionDuration:   "#9b8bbf",
  missionCreateBtn:  "#4b2fa0",
  missionUrgentBg:   "#fff0f7",
  missionUrgentText: "#e84393",

  // Difficulty badges
  diffHard:          "#e84393",
  diffHardEvent:     "#6c3fcb",
  diffMedium:        "#f5a623",
  diffEasy:          "#5ab4e5",
  diffEasyEvent:     "#7ab8d9",

  // Cards
  cardActionBg:      "rgba(120,90,180,0.05)",
  cardDivider:       "rgba(0,0,0,0.04)",

  // ── BadgesScreen ────────────────────────────
  // Titres & textes
  badgeHeading:      "#2d1a6e",        // titre principal "Mes Badges", sectionTitle, label badge
  badgeSubHeading:   "#5c3ca8",        // date obtention
  badgeMuted:        "#9b87c9",        // "Obtenu le", xpLabel, emptyText, conditionText
  badgeCondition:    "#555555",        // texte condition badge verrouillé

  // Backgrounds
  badgeCardBg:       "#f0ecff",        // card badge verrouillé
  badgeHelpBtnBg:    "#f0ecff",        // bouton refresh header
  badgeXpTrack:      "#e0d9ff",        // fond barre XP
  badgeGradStart:    "#dcd2f9",        // gradient background fin

  // Badge locked SVG
  badgeLockedBase:   "#b8a9e8",        // couleur de base badge verrouillé
  badgeLockedDark:   "#7a6cb8",        // rebord sombre badge verrouillé
  badgeLockedRing:   "#d4c9ff",        // anneau intérieur badge verrouillé
  badgeLockedPin:    "#7f5af0",        // pastille cadenas (= primary secondaire)

  // Gradient XP bar
  badgeXpGradStart:  "#7f5af0",        // début dégradé barre XP
  badgeXpGradEnd:    "#bbaaff",        // fin dégradé barre XP

  // Error
  badgeErrorBg:      "#fff0f0",        // fond message erreur
  badgeErrorText:    "#e53935",        // texte erreur

  // Modal (BadgeUnlockedModal)
  modalBg:           "rgba(15,5,50,0.75)",   // fond backdrop sombre
  modalCard:         "#120730",              // fond card modale
  modalBorder:       "#7f5af0",             // bordure card modale
  modalTitle:        "#ffffff",             // texte "Félicitations"
  modalSubtitle:     "#7f5af0",             // texte "BADGE DÉBLOQUÉ"
  modalBadgeName:    "#f9c74f",             // nom du badge en or
  modalGlow:         "#7f5af0",             // glow cercle derrière badge
  modalCoinBg:       "#120730",             // fond pastille pièce
  modalCoinBorder:   "#f9c74f",             // bordure pastille pièce
  modalCoinText:     "#f9c74f",             // texte pièce
  modalBtn:          "#7f5af0",             // fond bouton "Super!"
  modalBtnBorder:    "#a78bfa",             // bordure bouton

  // ── Badge colors (BADGE_META) ────────────────
  badgeGold:         "#f9c74f",        // badges 1, 4, 7
  badgeGoldBg:       "#fff8e1",
  badgeOrange:       "#f8961e",        // badge 2 feu
  badgeOrangeBg:     "#fff3e0",
  badgeCyan:         "#4cc9f0",        // badge 3 oeil
  badgeCyanBg:       "#e0f7fa",
  badgeGreen:        "#90be6d",        // badge 5 calendrier
  badgeGreenBg:      "#f1f8e9",
  badgePurple:       "#7c50f0",        // badge 6 éclair
  badgePurpleBg:     "#ede7f6",
  badgePink:         "#f472b6",        // badge 8 coeur
  badgePinkBg:       "#fce7f3",
  badgeIndigo:       "#818cf8",        // badge 9 diplôme
  badgeIndigoBg:     "#e0e7ff",
  badgeSky:          "#38bdf8",        // badge 10 coureur
  badgeSkyBg:        "#e0f2fe",
  badgeAmber:        "#f59e0b",        // badge 11 trophée
  badgeAmberBg:      "#fef3c7",
  badgeRose:         "#f9a8d4",        // badge 12 fleur
  badgeRoseBg:       "#fce7f3",
  badgeDefault:      "#7f5af0",        // badge inconnu
  badgeDefaultBg:    "#ede7f6",
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