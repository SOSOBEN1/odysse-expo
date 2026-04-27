// ============================================================
//  mission.utils.ts
//  Fonctions pures réutilisables (aucune dépendance Supabase)
// ============================================================

import type { Difficulty, DifficultyLevel, MissionGains, TimerState } from "./mission.types";

// ── Mapping difficulty number → label ────────────────────────
export const mapDifficulty = (d: number): Difficulty => {
  if (d === 3) return "Difficile";
  if (d === 2) return "Moyen";
  return "Facile";
};

export const mapDifficultyToNumber = (d: Difficulty): DifficultyLevel => {
  if (d === "Difficile") return 3;
  if (d === "Moyen")     return 2;
  return 1;
};

// ── Durée (minutes) → string lisible "1h30" ──────────────────
export const formatDuration = (dureeMin: number | null): string => {
  if (!dureeMin) return "-";
  return `${Math.floor(dureeMin / 60)}h${String(dureeMin % 60).padStart(2, "0")}`;
};

// ── Durée string "1h30" → minutes (number | null) ────────────
export const parseDurationToMinutes = (duration: string): number | null => {
  if (!duration || duration === "-") return null;
  const match = duration.match(/(\d+)h(\d*)/);
  if (!match) return null;
  return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
};

// ── Secondes écoulées → format lisible "02m30s" ──────────────
export const formatElapsed = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
};

// ── Date → label "fr-FR" avec heure ─────────────────────────
export const formatDateLimite = (date: Date): string =>
  date.toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// ── Couleur selon la deadline ─────────────────────────────────
export const getDeadlineColor = (dateLimite: Date | null): string => {
  if (!dateLimite) return "#6b7280";
  const diff = dateLimite.getTime() - Date.now();
  if (diff < 0)                 return "#e53e3e"; // dépassée  → rouge
  if (diff < 3600 * 1000)       return "#f97316"; // < 1h      → orange
  if (diff < 24 * 3600 * 1000)  return "#eab308"; // < 24h     → jaune
  return "#16a34a";                                // ok        → vert
};

// ── Statut mission_validation → statut UI ────────────────────
export const mapValidationStatus = (
  statut: string,
  dateLimite: string | null
): "Terminée" | "En cours" | "En retard" => {
  if (statut === "done") return "Terminée";
  if (statut === "fail") return "En retard";
  if (dateLimite && new Date(dateLimite) < new Date() && statut !== "done")
    return "En retard";
  return "En cours";
};

// ── Calcul des gains mission ──────────────────────────────────
export const computeMissionGains = (
  difficulty: DifficultyLevel,
  priority: number
): MissionGains => {
  const base      = difficulty * 10;
  const prioBonus = priority * 5;
  return {
    xp_gain:            base + prioBonus,
    energie_cout:       difficulty * 8,
    stress_gain:        difficulty * 5,
    connaissance_gain:  base,
    organisation_gain:  prioBonus,
  };
};

// ── XP gagnée à la fin d'une session ─────────────────────────
export const computeSessionXP = (elapsedSeconds: number): number =>
  Math.max(10, Math.round(elapsedSeconds / 60) * 2);

// ── Vérifier si une deadline est dépassée ────────────────────
export const isDeadlinePassed = (dateLimite: Date | null): boolean => {
  if (!dateLimite) return false;
  return dateLimite.getTime() < Date.now();
};

// ── Calculer le % de progression du timer ────────────────────
export const computeProgressPercent = (
  elapsed: number,
  durationStr: string,
  state: TimerState
): number => {
  if (state === "done" || state === "fail") return 100;
  const estimatedSec = (parseDurationToMinutes(durationStr) ?? 30) * 60;
  return Math.min(Math.round((elapsed / estimatedSec) * 100), 99);
};

// ── Début de journée (minuit) ─────────────────────────────────
export const getTodayBounds = (): { start: Date; end: Date } => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── Début de la semaine (lundi) ──────────────────────────────
export const getStartOfWeek = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── Calcul streak (jours consécutifs) ────────────────────────
export const computeStreak = (
  validations: Array<{ date_debut: string | null }>
): number => {
  if (!validations.length) return 0;
  const days = new Set(
    validations
      .filter(v => v.date_debut)
      .map(v => new Date(v.date_debut!).toLocaleDateString("fr-FR"))
  );
  let streak    = 0;
  let checkDate = new Date();
  while (days.has(checkDate.toLocaleDateString("fr-FR"))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
};

// ── Calcul du temps de la semaine (string "2h 30") ───────────
export const computeWeekTime = (totalMinutes: number): string =>
  `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}`;

// ── Taux de réussite ─────────────────────────────────────────
export const computeSuccessRate = (terminated: number, total: number): number =>
  total > 0 ? Math.round((terminated / total) * 100) : 0;