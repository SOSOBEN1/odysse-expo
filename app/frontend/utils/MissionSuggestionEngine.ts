

// ─────────────────────────────────────────────────────────────
//  MissionSuggestionEngine.ts
//  Moteur de suggestion de missions basé sur les stats joueur
// ─────────────────────────────────────────────────────────────

import { COLORS } from "../styles/theme";

export type PlayerStats = {
  energie:      number; // 0–100
  stress:       number; // 0–100 (haut = mauvais)
  connaissance: number; // 0–100
  organisation: number; // 0–100
};

export type MissionSuggestion = {
  id:          string;
  title:       string;
  description: string;
  emoji:       string;
  category:    "energie" | "stress" | "connaissance" | "organisation" | "boost";
  priority:    "critical" | "high" | "medium" | "low";
  xpReward:    number;
  coinReward:  number;
  duration:    string;
  impact:      string;
  color:       string;
  reason:      string;
};

// ─── Seuils ──────────────────────────────────────────────────
const THRESHOLDS = {
  critical:  25,
  low:       40,
  good:      70,
  excellent: 85,
};

// ─── Pool de missions par catégorie ──────────────────────────
// 6 missions par catégorie × 5 catégories = 30 missions total

const ENERGIE_MISSIONS: Omit<MissionSuggestion, "priority" | "reason">[] = [
  {
    id: "energie_sleep",
    title: "Cycle de sommeil",
    description: "Dors 7–8h ce soir et note ton heure de coucher",
    emoji: "😴",
    category: "energie",
    xpReward: 40,
    coinReward: 20,
    duration: "8h",
    impact: "+25 Énergie",
    color: COLORS.statEnergie,
  },
  {
    id: "energie_walk",
    title: "Marche énergisante",
    description: "Fais une marche rapide de 20 min à l'extérieur",
    emoji: "🚶",
    category: "energie",
    xpReward: 25,
    coinReward: 10,
    duration: "20 min",
    impact: "+15 Énergie",
    color: COLORS.statEnergie,
  },
  {
    id: "energie_hydration",
    title: "Hydratation x8",
    description: "Bois 8 verres d'eau aujourd'hui, note chaque verre",
    emoji: "💧",
    category: "energie",
    xpReward: 20,
    coinReward: 8,
    duration: "Toute la journée",
    impact: "+10 Énergie",
    color: COLORS.statEnergie,
  },
  {
    id: "energie_nap",
    title: "Power nap",
    description: "Sieste de 20 min (pas plus!) entre 13h et 15h",
    emoji: "⚡",
    category: "energie",
    xpReward: 15,
    coinReward: 6,
    duration: "20 min",
    impact: "+12 Énergie",
    color: COLORS.statEnergie,
  },
  {
    id: "energie_stretch",
    title: "Étirements matinaux",
    description: "10 min d'étirements dès le réveil pour activer le corps",
    emoji: "🧎",
    category: "energie",
    xpReward: 20,
    coinReward: 8,
    duration: "10 min",
    impact: "+10 Énergie",
    color: COLORS.statEnergie,
  },
  {
    id: "energie_nutrition",
    title: "Repas énergétique",
    description: "Prépare un repas équilibré avec protéines, glucides et légumes",
    emoji: "🥗",
    category: "energie",
    xpReward: 30,
    coinReward: 14,
    duration: "30 min",
    impact: "+18 Énergie",
    color: COLORS.statEnergie,
  },
];

const STRESS_MISSIONS: Omit<MissionSuggestion, "priority" | "reason">[] = [
  {
    id: "stress_breathing",
    title: "Respiration 4-7-8",
    description: "3 cycles de respiration : inspire 4s, retiens 7s, expire 8s",
    emoji: "🧘",
    category: "stress",
    xpReward: 30,
    coinReward: 15,
    duration: "10 min",
    impact: "-20 Stress",
    color: COLORS.statStress,
  },
  {
    id: "stress_journal",
    title: "Journal des pensées",
    description: "Écris 3 choses qui t'ont stressé et 3 solutions possibles",
    emoji: "📓",
    category: "stress",
    xpReward: 25,
    coinReward: 12,
    duration: "15 min",
    impact: "-15 Stress",
    color: COLORS.statStress,
  },
  {
    id: "stress_nature",
    title: "Pause nature",
    description: "Passe 15 min dehors sans écran, observe ton environnement",
    emoji: "🌿",
    category: "stress",
    xpReward: 20,
    coinReward: 10,
    duration: "15 min",
    impact: "-12 Stress",
    color: COLORS.statStress,
  },
  {
    id: "stress_music",
    title: "Thérapie musicale",
    description: "Écoute 20 min de musique calme (lo-fi, classique ou jazz)",
    emoji: "🎵",
    category: "stress",
    xpReward: 15,
    coinReward: 6,
    duration: "20 min",
    impact: "-10 Stress",
    color: COLORS.statStress,
  },
  {
    id: "stress_meditation",
    title: "Méditation guidée",
    description: "Fais une séance de méditation guidée de 10 min (app ou YouTube)",
    emoji: "🕯️",
    category: "stress",
    xpReward: 35,
    coinReward: 16,
    duration: "10 min",
    impact: "-18 Stress",
    color: COLORS.statStress,
  },
  {
    id: "stress_disconnect",
    title: "Détox numérique",
    description: "Coupe tous les écrans pendant 1h et fais une activité manuelle",
    emoji: "📵",
    category: "stress",
    xpReward: 40,
    coinReward: 20,
    duration: "1h",
    impact: "-22 Stress",
    color: COLORS.statStress,
  },
];

const CONNAISSANCE_MISSIONS: Omit<MissionSuggestion, "priority" | "reason">[] = [
  {
    id: "conn_pomodoro",
    title: "Session Pomodoro",
    description: "2 sessions de 25 min de révision avec pause de 5 min",
    emoji: "🍅",
    category: "connaissance",
    xpReward: 50,
    coinReward: 25,
    duration: "55 min",
    impact: "+20 Connaissance",
    color: COLORS.statConnaissance,
  },
  {
    id: "conn_flashcard",
    title: "Flashcards x20",
    description: "Revois 20 flashcards sur ton cours le plus récent",
    emoji: "🃏",
    category: "connaissance",
    xpReward: 30,
    coinReward: 15,
    duration: "20 min",
    impact: "+15 Connaissance",
    color: COLORS.statConnaissance,
  },
  {
    id: "conn_summary",
    title: "Résumé en 5 points",
    description: "Résume un chapitre en exactement 5 points clés",
    emoji: "📝",
    category: "connaissance",
    xpReward: 35,
    coinReward: 18,
    duration: "25 min",
    impact: "+18 Connaissance",
    color: COLORS.statConnaissance,
  },
  {
    id: "conn_teach",
    title: "Méthode Feynman",
    description: "Explique un concept à voix haute comme si tu l'enseignais",
    emoji: "🎓",
    category: "connaissance",
    xpReward: 40,
    coinReward: 20,
    duration: "15 min",
    impact: "+22 Connaissance",
    color: COLORS.statConnaissance,
  },
  {
    id: "conn_mindmap",
    title: "Mind map express",
    description: "Crée une carte mentale d'un chapitre entier en moins de 20 min",
    emoji: "🗺️",
    category: "connaissance",
    xpReward: 35,
    coinReward: 17,
    duration: "20 min",
    impact: "+17 Connaissance",
    color: COLORS.statConnaissance,
  },
  {
    id: "conn_quiz",
    title: "Quiz express",
    description: "Fais 10 questions de quiz sur la matière de ton choix",
    emoji: "❓",
    category: "connaissance",
    xpReward: 25,
    coinReward: 12,
    duration: "15 min",
    impact: "+13 Connaissance",
    color: COLORS.statConnaissance,
  },
];

const ORGANISATION_MISSIONS: Omit<MissionSuggestion, "priority" | "reason">[] = [
  {
    id: "org_planning",
    title: "Plan de la semaine",
    description: "Planifie tes 3 priorités pour chacun des 5 prochains jours",
    emoji: "📅",
    category: "organisation",
    xpReward: 45,
    coinReward: 22,
    duration: "20 min",
    impact: "+25 Organisation",
    color: COLORS.statOrganisation,
  },
  {
    id: "org_todo",
    title: "Liste MIT du jour",
    description: "Identifie tes 3 tâches Most Important Tasks et accomplis-les",
    emoji: "✅",
    category: "organisation",
    xpReward: 35,
    coinReward: 18,
    duration: "Variable",
    impact: "+18 Organisation",
    color: COLORS.statOrganisation,
  },
  {
    id: "org_cleanup",
    title: "Espace de travail zen",
    description: "Nettoie et organise ton bureau physique ET digital (bureau PC)",
    emoji: "🧹",
    category: "organisation",
    xpReward: 20,
    coinReward: 10,
    duration: "15 min",
    impact: "+12 Organisation",
    color: COLORS.statOrganisation,
  },
  {
    id: "org_routine",
    title: "Routine matinale",
    description: "Définis et applique une routine du matin en 5 étapes",
    emoji: "🌅",
    category: "organisation",
    xpReward: 30,
    coinReward: 15,
    duration: "30 min",
    impact: "+20 Organisation",
    color: COLORS.statOrganisation,
  },
  {
    id: "org_timeblock",
    title: "Time blocking",
    description: "Divise ta journée en blocs de temps dédiés à chaque tâche",
    emoji: "🕐",
    category: "organisation",
    xpReward: 40,
    coinReward: 20,
    duration: "15 min",
    impact: "+22 Organisation",
    color: COLORS.statOrganisation,
  },
  {
    id: "org_review",
    title: "Bilan hebdomadaire",
    description: "Fais le point sur tes objectifs de la semaine : atteints ou non ?",
    emoji: "📊",
    category: "organisation",
    xpReward: 35,
    coinReward: 17,
    duration: "20 min",
    impact: "+19 Organisation",
    color: COLORS.statOrganisation,
  },
];

const BOOST_MISSIONS: Omit<MissionSuggestion, "priority" | "reason">[] = [
  {
    id: "boost_challenge",
    title: "Challenge du jour",
    description: "Accomplis quelque chose que tu remets à plus tard depuis 3 jours",
    emoji: "🏆",
    category: "boost",
    xpReward: 60,
    coinReward: 30,
    duration: "Variable",
    impact: "Boost général",
    color: COLORS.statBoost,
  },
  {
    id: "boost_gratitude",
    title: "Journal de gratitude",
    description: "Note 5 choses positives d'aujourd'hui, si petites soient-elles",
    emoji: "🙏",
    category: "boost",
    xpReward: 20,
    coinReward: 10,
    duration: "10 min",
    impact: "+Moral & Énergie",
    color: COLORS.statBoost,
  },
  {
    id: "boost_cold_shower",
    title: "Douche froide",
    description: "Termine ta douche par 30s d'eau froide pour booster ta vitalité",
    emoji: "🚿",
    category: "boost",
    xpReward: 35,
    coinReward: 18,
    duration: "5 min",
    impact: "+Vitalité & Focus",
    color: COLORS.statBoost,
  },
  {
    id: "boost_social",
    title: "Connexion sociale",
    description: "Appelle ou message un ami ou un proche que tu n'as pas contacté récemment",
    emoji: "🤝",
    category: "boost",
    xpReward: 25,
    coinReward: 12,
    duration: "15 min",
    impact: "+Moral & Motivation",
    color: COLORS.statBoost,
  },
  {
    id: "boost_creative",
    title: "Moment créatif",
    description: "Passe 20 min sur une activité créative libre (dessin, musique, écriture…)",
    emoji: "🎨",
    category: "boost",
    xpReward: 30,
    coinReward: 15,
    duration: "20 min",
    impact: "+Bien-être & Créativité",
    color: COLORS.statBoost,
  },
  {
    id: "boost_reading",
    title: "Lecture plaisir",
    description: "Lis 20 pages d'un livre que tu aimes, sans objectif d'apprentissage",
    emoji: "📖",
    category: "boost",
    xpReward: 20,
    coinReward: 10,
    duration: "20 min",
    impact: "+Détente & Curiosité",
    color: COLORS.statBoost,
  },
];

// ─── Génération des raisons contextuelles ────────────────────
function buildReason(category: MissionSuggestion["category"], statValue: number, priority: MissionSuggestion["priority"]): string {
  if (category === "energie") {
    if (priority === "critical") return `⚠️ Ton énergie est très basse (${statValue}%) — priorité absolue !`;
    if (priority === "high")    return `📉 Énergie en baisse (${statValue}%) — recharge-toi !`;
    return `⚡ Maintiens ton énergie actuelle (${statValue}%)`;
  }
  if (category === "stress") {
    if (priority === "critical") return `🚨 Stress critique (${statValue}%) — agis maintenant !`;
    if (priority === "high")    return `😰 Stress élevé détecté (${statValue}%) — décompresse !`;
    return `🧘 Préviens la montée de stress (${statValue}%)`;
  }
  if (category === "connaissance") {
    if (priority === "critical") return `📚 Tes connaissances sont faibles (${statValue}%) — révise !`;
    if (priority === "high")    return `🎯 Tu peux améliorer tes connaissances (${statValue}%)`;
    return `💡 Continue à apprendre (${statValue}%)`;
  }
  if (category === "organisation") {
    if (priority === "critical") return `📋 Organisation critique (${statValue}%) — structure-toi !`;
    if (priority === "high")    return `🗂️ Organisation à améliorer (${statValue}%)`;
    return `✨ Optimise ton organisation (${statValue}%)`;
  }
  return "🚀 Mission bonus pour progresser !";
}

// ─── Détermine la priorité selon la valeur de la stat ────────
function getPriority(value: number, isStress = false): MissionSuggestion["priority"] {
  const v = isStress ? 100 - value : value;
  if (v <= THRESHOLDS.critical) return "critical";
  if (v <= THRESHOLDS.low)      return "high";
  if (v <= THRESHOLDS.good)     return "medium";
  return "low";
}

// ─── Sélection aléatoire dans un pool ────────────────────────
function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ─── Moteur principal ─────────────────────────────────────────
export function generateMissionSuggestions(
  stats: PlayerStats,
  maxSuggestions = 5
): MissionSuggestion[] {
  const suggestions: MissionSuggestion[] = [];

  const analyse: { category: MissionSuggestion["category"]; value: number; pool: Omit<MissionSuggestion, "priority" | "reason">[]; isStress?: boolean }[] = [
    { category: "stress",       value: stats.stress,       pool: STRESS_MISSIONS,       isStress: true },
    { category: "energie",      value: stats.energie,      pool: ENERGIE_MISSIONS },
    { category: "organisation", value: stats.organisation, pool: ORGANISATION_MISSIONS },
    { category: "connaissance", value: stats.connaissance, pool: CONNAISSANCE_MISSIONS },
  ];

  const sorted = analyse.sort((a, b) => {
    const urgA = a.isStress ? a.value : 100 - a.value;
    const urgB = b.isStress ? b.value : 100 - b.value;
    return urgB - urgA;
  });

  const budgets: Record<MissionSuggestion["priority"], number> = {
    critical: 2,
    high:     2,
    medium:   1,
    low:      0,
  };

  for (const item of sorted) {
    if (suggestions.length >= maxSuggestions) break;
    const priority = getPriority(item.value, item.isStress);
    const budget   = budgets[priority];
    if (budget === 0) continue;
    const picked = pickRandom(item.pool, budget);
    for (const m of picked) {
      if (suggestions.length >= maxSuggestions) break;
      suggestions.push({
        ...m,
        priority,
        reason: buildReason(item.category, Math.round(item.value), priority),
      });
    }
  }

  if (suggestions.length < maxSuggestions) {
    const remaining = maxSuggestions - suggestions.length;
    const boosts = pickRandom(BOOST_MISSIONS, remaining);
    for (const b of boosts) {
      suggestions.push({
        ...b,
        priority: "low",
        reason: "🌟 Profite de ta forme pour te dépasser !",
      });
    }
  }

  return suggestions;
}

// ─── Labels de priorité ───────────────────────────────────────
export function getPriorityLabel(priority: MissionSuggestion["priority"]): string {
  switch (priority) {
    case "critical": return "URGENT";
    case "high":     return "Recommandé";
    case "medium":   return "Suggéré";
    case "low":      return "Bonus";
  }
}

export function getPriorityColor(priority: MissionSuggestion["priority"]): string {
  switch (priority) {
    case "critical": return COLORS.suggPriorityCritical;
    case "high":     return COLORS.suggPriorityHigh;
    case "medium":   return COLORS.suggPriorityMedium;
    case "low":      return COLORS.suggPriorityLow;
  }
}