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

  // ── SuggestedMissions ───────────────────────
  // Couleurs des stats joueur (cercles, barres, mission colors)
  statEnergie:           "#F5A623",   // énergie / jaune-orange
  statStress:            "#E84040",   // stress / rouge
  statConnaissance:      "#4A90E2",   // connaissance / bleu
  statOrganisation:      "#4CAF50",   // organisation / vert
  statBoost:             "#8A5AD8",   // missions boost / violet foncé

  // Priorités de suggestion
  suggPriorityCritical:  "#E84040",   // = statStress, urgent
  suggPriorityHigh:      "#F5A623",   // = statEnergie, recommandé
  suggPriorityMedium:    "#8A5AD8",   // = statBoost, suggéré
  suggPriorityLow:       "#4CAF50",   // = statOrganisation, bonus

  // Card critique
  suggCardCriticalBg:    "#FFF5F5",   // fond carte mission urgente
  suggUrgentBadgeBg:     "#FEE2E2",   // fond badge "X urgent(s)"

  // Chips / métadonnées
  suggMetaChipBg:        "#f0ecfb",   // fond chip durée / XP
  suggStatTrackBg:       "#f0ecfb",   // fond barre stat dans la section
  suggCoinChipBg:        "#fffbeb",   // fond chip pièces
  suggCoinText:          "#d97706",   // texte pièces (ambre)

  // Résumé
  suggSummaryBg:         "#faf5ff",   // fond bloc résumé
  suggSummaryText:       "#7c3aed",   // texte résumé (violet vif)

  // Bouton dismiss
  suggDismissBg:         "#f3f4f6",   // fond bouton ✕
  suggDismissText:       "#9ca3af",   // couleur ✕ et icône collapse

  // Textes secondaires
  suggDescText:          "#6b7280",   // description mission, label stat, metaText
  suggReasonText:        "#9b87c9",   // raison italique (= badgeMuted)
  suggMutedText:         "#9ca3af",   // sous-titre section, loading, empty

  // ── Dashboard / Home shared ──────────────────
  // Backgrounds
  screenBg:              "#f5f3ff",   // fond général des screens
  xpBarBg:               "#ddd6fe",   // fond barre XP
  xpBarTrack:            "#EEE8F8",   // fond barre XP circulaire (CircularProgress)
  coinsBadgeBg:          "#ede9fe",   // fond badge pièces + avatar
  levelBadgeBg:          "#6949a8",   // = primary, fond badge niveau (alias explicite)

  // Textes
  greetingColor:         "#6b7280",   // texte "Bonjour,"
  xpTextColor:           "#9ca3af",   // "X XP / Y XP"
  streakColor:           "#F59E0B",   // texte streak 🔥
  levelTitleColor:       "#9b87c9",   // sous-titre titre de niveau
  statSubColor:          "#AAA",      // "Niveau actuel" sous les cercles

  // Mission cards
  missionCardBg:         "#F8F4FF",   // fond carte mission normale
  missionSuggestedBg:    "#F0EBF9",   // fond carte mission suggérée
  missionSuggestedBorder:"#DDD5F5",   // bordure carte mission suggérée
  missionIconBg:         "#EDE8F8",   // fond icône mission
  missionBtnStart:       "#DDD5F5",   // fond bouton "Démarrer"
  missionTagColor:       "#9574e0",   // = secondary, tag "Suggérée"
  missionSubColor:       "#888",      // sous-titre mission

  // Tabs (HomeScreen)
  tabBarBg:              "#ede9fe",   // fond barre onglets

  // Boss Event Banner
  bossOuter:             "#8A5AD8",   // fond externe banner boss
  bossTopBanner:         "#7B4FC8",   // fond bande supérieure
  bossSubText:           "#EDD9FF",   // texte secondaire boss
  bossXpChipBg:          "#5A2EA0",   // fond chip XP (foncé)
  bossXpText:            "#FFD700",   // texte XP doré
  bossVoirBg:            "#FF6B9D",   // bouton "Voir"
  bossProgressBg:        "#9B6DE0",   // fond bande progression
  bossProgressTrack:     "rgba(255,255,255,0.3)", // fond barre progress boss
  bossProgressFill:      "#FFD700",   // remplissage barre boss (= bossXpText)
  bossBottomCard:        "#6A3DB8",   // fond carte basse boss
  bossCircleBg:          "#5A2EA0",   // fond cercle gauge
  bossCircleBorder:      "#FFD700",   // bordure cercle gauge (= bossXpText)
  bossXpChipSmallBg:     "#FF6B9D",   // = bossVoirBg

  // Global Progress Section
  masterFill:            "#FFD700",   // barre maître progression (dorée)
  masterTrackBg:         "#DDD5F5",   // fond barre maître
  progressTrackBg:       "#EEE8F8",   // fond barres stats individuelles
  chipBonusBg:           "#E8F5E9",   // fond chip bonus XP
  chipBonusText:         "#4CAF50",   // texte chip bonus XP (= statOrganisation)

  // Circular progress (StatsCard)
  circleTrack:           "#EEE8F8",   // fond anneau SVG
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