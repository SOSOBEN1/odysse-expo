import { supabase } from "../../app/frontend/constants/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStats {
  energie: number;
  stress: number;
  connaissance: number;
  organisation: number;
}

export interface MissionData {
  id_mission: number;
  titre: string;
  description: string;
  duree_min: number;
  difficulte: number;      // 1 = facile, 2 = moyenne, 3 = difficile
  priorite: number;
  energie_cout: number;
  stress_gain: number | null;
  connaissance_gain: number;
  organisation_gain: number;
  xp_gain: number;
}

export type MissionCompletionResult = {
  newStats: PlayerStats;
  xpEarned: number;
  goldEarned: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Detects if a mission is a "rest/pause" type based on title/description keywords.
 */
function isRestMission(mission: MissionData): boolean {
  const keywords = ["pause", "repos", "bien-être", "bienetre", "relaxation", "détente"];
  const text = (mission.titre + " " + mission.description).toLowerCase();
  return keywords.some((k) => text.includes(k));
}

/**
 * Detects if a mission is a "planning" type.
 */
function isPlanningMission(mission: MissionData): boolean {
  const keywords = ["planifier", "planning", "organisation", "semaine", "agenda"];
  const text = (mission.titre + " " + mission.description).toLowerCase();
  return keywords.some((k) => text.includes(k));
}

// ─── Formula: STRESS ─────────────────────────────────────────────────────────
/**
 * Stress_nouveau = Stress_actuel - Réduction_mission
 *
 * Réduction_mission is derived from the mission's stress_gain column
 * (stored as a positive int = how much stress it reduces).
 * Fallback logic when stress_gain is NULL:
 *   - Rest mission      → -10
 *   - Revision/study    → -5
 *   - Default           → -3
 *
 * Augmentation_inactivité is NOT applied here — it should be called
 * separately via `applyInactivityPenalty()` on a daily cron/scheduler.
 */
function computeNewStress(current: number, mission: MissionData): number {
  let reduction: number;

  if (mission.stress_gain !== null) {
    reduction = mission.stress_gain; // already defined in DB
  } else if (isRestMission(mission)) {
    reduction = 10;
  } else if (mission.connaissance_gain >= 10) {
    reduction = 5; // study/revision mission
  } else {
    reduction = 3;
  }

  return clamp(current - reduction);
}

// ─── Formula: ENERGIE ────────────────────────────────────────────────────────
/**
 * Énergie_nouvelle = Énergie_actuelle - Dépense_mission + Bonus_repos
 *
 * Dépense_mission uses energie_cout from the DB (already set per mission).
 * Bonus_repos = +15 if it's a rest mission (overrides the cost).
 */
function computeNewEnergie(current: number, mission: MissionData): number {
  const isRest = isRestMission(mission);

  if (isRest) {
    // Rest mission restores energy
    return clamp(current + 15);
  }

  // energie_cout is always positive in DB (8, 16, 24…)
  // Difficulty multiplier to fine-tune if needed:
  //   difficulte 1 → cost as-is (facile)
  //   difficulte 2 → cost as-is (moyenne)
  //   difficulte 3 → cost as-is (difficile) — already encoded in DB
  return clamp(current - mission.energie_cout);
}

// ─── Formula: CONNAISSANCE ───────────────────────────────────────────────────
/**
 * Connaissances_nouvelles = Connaissances_actuelles + Impact_mission_apprentissage
 *
 * Uses connaissance_gain from DB directly.
 * Extra boost for high-priority missions (priorite === 1).
 */
function computeNewConnaissance(current: number, mission: MissionData): number {
  let impact = mission.connaissance_gain;

  // High priority mission = more motivating = +5 bonus
  if (mission.priorite === 1 && impact > 0) {
    impact += 5;
  }

  return clamp(current + impact);
}

// ─── Formula: ORGANISATION ───────────────────────────────────────────────────
/**
 * Organisation_nouvelle = Organisation_actuelle + Impact_mission_planification
 *
 * Uses organisation_gain from DB.
 * Planning missions get an extra +10 boost.
 * Non-completed missions should call `applyMissedMissionPenalty()` instead.
 */
function computeNewOrganisation(current: number, mission: MissionData): number {
  let impact = mission.organisation_gain;

  if (isPlanningMission(mission)) {
    impact += 10;
  }

  return clamp(current + impact);
}

// ─── Derived Stats (read-only, not stored) ───────────────────────────────────
/**
 * These are computed live from base stats (same as in DashboardScreen).
 * NOT stored in DB — always derived.
 *
 *   Concentration = Énergie × 0.5 + Connaissance × 0.5
 *   Sérénité      = 100 - Stress
 *   Discipline    = Organisation × 0.7 + Connaissance × 0.3
 */
export function computeDerivedStats(base: PlayerStats) {
  return {
    concentration: clamp(base.energie * 0.5 + base.connaissance * 0.5),
    serenite:      clamp(100 - base.stress),
    discipline:    clamp(base.organisation * 0.7 + base.connaissance * 0.3),
  };
}

/**
 * Full discipline formula using mission completion ratio:
 *   Discipline += (completed / total) × 10 - (missed / total) × 5
 */
export function computeDisciplineFromRatio(
  current: number,
  completedMissions: number,
  totalMissions: number,
  missedMissions: number
): number {
  if (totalMissions === 0) return current;
  const bonus   = (completedMissions / totalMissions) * 10;
  const penalty = (missedMissions    / totalMissions) * 5;
  return clamp(current + bonus - penalty);
}

// ─── Inactivity Penalty (call daily via scheduler) ───────────────────────────
/**
 * If the user completes NO mission for a day, stress increases by +2.
 * Call this from your daily cron / background task — NOT on mission completion.
 */
export async function applyInactivityPenalty(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("stress")
    .eq("id_user", userId)
    .maybeSingle();

  if (error || !data) return;

  const newStress = clamp(data.stress + 2);
  await supabase
    .from("player_stats")
    .update({ stress: newStress })
    .eq("id_user", userId);
}

/**
 * Penalty when a mission is NOT completed (skipped/forgotten).
 *   Organisation -= 5
 */
export async function applyMissedMissionPenalty(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("organisation")
    .eq("id_user", userId)
    .maybeSingle();

  if (error || !data) return;

  const newOrga = clamp(data.organisation - 5);
  await supabase
    .from("player_stats")
    .update({ organisation: newOrga })
    .eq("id_user", userId);
}

// ─── XP & Gold Rewards ───────────────────────────────────────────────────────

/**
 * XP earned = mission.xp_gain
 * Gold bonus based on difficulty:
 *   difficulte 1 → +5 gold
 *   difficulte 2 → +10 gold
 *   difficulte 3 → +20 gold
 */
function computeRewards(mission: MissionData): { xp: number; gold: number } {
  const goldMap: Record<number, number> = { 1: 5, 2: 10, 3: 20 };
  return {
    xp:   mission.xp_gain,
    gold: goldMap[mission.difficulte] ?? 5,
  };
}

// ─── Main Service Function ────────────────────────────────────────────────────

/**
 * Call this when a user COMPLETES a mission.
 *
 * Flow:
 *   1. Fetch current player_stats from DB
 *   2. Apply all stat formulas
 *   3. Update player_stats in DB
 *   4. Add XP + gold to users table
 *   5. Return new stats + rewards earned
 *
 * ⚠️  The questionnaire-based stats are preserved — we only apply deltas.
 *      The questionnaire answers remain as the baseline; missions adjust on top.
 */
export async function completeMission(
  userId: string,
  mission: MissionData
): Promise<MissionCompletionResult | null> {
  // 1. Fetch current stats
  const { data: statsData, error: statsError } = await supabase
    .from("player_stats")
    .select("energie, stress, connaissance, organisation")
    .eq("id_user", userId)
    .maybeSingle();

  if (statsError || !statsData) {
    console.error("[missionStatsService] Failed to fetch player_stats:", statsError?.message);
    return null;
  }

  const current: PlayerStats = {
    energie:      statsData.energie      ?? 50,
    stress:       statsData.stress       ?? 50,
    connaissance: statsData.connaissance ?? 50,
    organisation: statsData.organisation ?? 50,
  };

  // 2. Apply formulas
  const newStats: PlayerStats = {
    energie:      computeNewEnergie(current.energie, mission),
    stress:       computeNewStress(current.stress, mission),
    connaissance: computeNewConnaissance(current.connaissance, mission),
    organisation: computeNewOrganisation(current.organisation, mission),
  };

  // 3. Update player_stats
  const { error: updateStatsError } = await supabase
    .from("player_stats")
    .update({
      energie:      newStats.energie,
      stress:       newStats.stress,
      connaissance: newStats.connaissance,
      organisation: newStats.organisation,
    })
    .eq("id_user", userId);

  if (updateStatsError) {
    console.error("[missionStatsService] Failed to update player_stats:", updateStatsError.message);
    return null;
  }

  // 4. Compute and apply XP + gold rewards
  const { xp: xpEarned, gold: goldEarned } = computeRewards(mission);

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("xp, gold")
    .eq("id_user", userId)
    .single();

  if (!userError && userData) {
    await supabase
      .from("users")
      .update({
        xp:   (userData.xp   ?? 0) + xpEarned,
        gold: (userData.gold ?? 0) + goldEarned,
      })
      .eq("id_user", userId);
  }

  return {
    newStats,
    xpEarned,
    goldEarned,
  };
}

// ─── Fetch mission from DB ────────────────────────────────────────────────────

/**
 * Helper to fetch a single mission by ID from the `mission` table.
 */
export async function fetchMission(missionId: number): Promise<MissionData | null> {
  const { data, error } = await supabase
    .from("mission")
    .select(
      "id_mission, titre, description, duree_min, difficulte, priorite, energie_cout, stress_gain, connaissance_gain, organisation_gain, xp_gain"
    )
    .eq("id_mission", missionId)
    .single();

  if (error || !data) {
    console.error("[missionStatsService] fetchMission error:", error?.message);
    return null;
  }

  return data as MissionData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

import { useState } from "react";

export interface UseMissionCompletion {
  completing: boolean;
  result: MissionCompletionResult | null;
  complete: (userId: string, missionId: number) => Promise<MissionCompletionResult | null>;
}

/**
 * Hook — wraps completeMission() with loading state.
 *
 * Usage:
 *   const { completing, result, complete } = useMissionCompletion();
 *   await complete(userId, missionId);
 */
export function useMissionCompletion(): UseMissionCompletion {
  const [completing, setCompleting] = useState(false);
  const [result, setResult]         = useState<MissionCompletionResult | null>(null);

  const complete = async (userId: string, missionId: number) => {
    setCompleting(true);
    try {
      const mission = await fetchMission(missionId);
      if (!mission) return null;

      const res = await completeMission(userId, mission);
      setResult(res);
      return res;
    } finally {
      setCompleting(false);
    }
  };

  return { completing, result, complete };
}