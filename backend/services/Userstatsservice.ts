import { supabase } from "../../app/frontend/constants/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStats {
  energie:       number;
  stress:        number;
  connaissance:  number;
  organisation:  number;
  serenite:      number;
  concentration: number;
  discipline:    number;
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

// ─── Derived Stats ────────────────────────────────────────────────────────────
/**
 * Calcule sérenité, concentration, discipline à partir des stats de base.
 * Ces valeurs sont maintenant PERSISTÉES en BDD.
 */
export function computeDerivedStats(base: PlayerStats) {
  return {
    concentration: clamp(base.energie * 0.5 + base.connaissance * 0.5),
    serenite:      clamp(100 - base.stress),
    discipline:    clamp(base.organisation * 0.7 + base.connaissance * 0.3),
  };
}

/**
 * Calcule la nouvelle sérenité après complétion d'une mission.
 * Sérénité_nouvelle = Sérénité_actuelle + (100 − Stress) × 0.1 + Bonus_pause
 * Bonus_pause = +5 si mission de type pause/détente
 */
function computeNewSerenite(current: number, newStress: number, mission: MissionData): number {
  const bonusPause = isRestMission(mission) ? 5 : 0;
  return clamp(current + (100 - newStress) * 0.1 + bonusPause);
}

/**
 * Calcule la nouvelle concentration après complétion d'une mission.
 * Concentration_nouvelle = Concentration_actuelle + Gain_apprentissage − (100 − Énergie) × 0.05
 */
function computeNewConcentration(current: number, newEnergie: number, mission: MissionData): number {
  const gainApprentissage = mission.connaissance_gain ?? 0;
  return clamp(current + gainApprentissage - (100 - newEnergie) * 0.05);
}

/**
 * Calcule la nouvelle discipline selon le ratio missions complétées.
 * Discipline += (réalisées / totales) × 10 − (oubliées / totales) × 5
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
  // 1. Fetch current stats — uniquement les colonnes qui existent dans player_stats
  const { data: statsData, error: statsError } = await supabase
    .from("player_stats")
    .select("energie, stress, connaissance, organisation")
    .eq("id_user", parseInt(userId, 10))
    .maybeSingle();

  if (statsError) {
    console.error("[missionStatsService] Failed to fetch player_stats:", statsError.message);
    return null;
  }

  // Si aucune ligne, on démarre depuis des valeurs par défaut (première mission)
  const current: PlayerStats = {
    energie:       statsData?.energie       ?? 50,
    stress:        statsData?.stress        ?? 50,
    connaissance:  statsData?.connaissance  ?? 50,
    organisation:  statsData?.organisation  ?? 50,
    serenite:      50,
    concentration: 70,
    discipline:    50,
  };

  // 2. Calculer les stats de base
  const newEnergie      = computeNewEnergie(current.energie, mission);
  const newStress       = computeNewStress(current.stress, mission);
  const newConnaissance = computeNewConnaissance(current.connaissance, mission);
  const newOrganisation = computeNewOrganisation(current.organisation, mission);

  // 3. Calculer les stats dérivées (maintenant persistées)
  const newSerenite      = computeNewSerenite(current.serenite, newStress, mission);
  const newConcentration = computeNewConcentration(current.concentration, newEnergie, mission);
  // Discipline : on passe 1 mission réalisée / 1 totale / 0 oubliée comme delta unitaire
  // (le ratio précis est calculé dans ProgressionService.ts pour les défis)
  const newDiscipline = computeDisciplineFromRatio(current.discipline, 1, 1, 0);

  const newStats: PlayerStats = {
    energie:       newEnergie,
    stress:        newStress,
    connaissance:  newConnaissance,
    organisation:  newOrganisation,
    serenite:      newSerenite,
    concentration: newConcentration,
    discipline:    newDiscipline,
  };

  // 4. Sauvegarder les stats en BDD — uniquement les colonnes qui existent dans player_stats
  //    (energie, stress, connaissance, organisation, date_maj)
  const upsertPayload: Record<string, any> = {
    id_user:      parseInt(userId, 10),   // int4 en base — on force le type
    energie:      newStats.energie,
    stress:       newStats.stress,
    connaissance: newStats.connaissance,
    organisation: newStats.organisation,
    date_maj:     new Date().toISOString(),
  };

  const { error: updateStatsError } = await supabase
    .from("player_stats")
    .upsert(upsertPayload, { onConflict: "id_user" });

  if (updateStatsError) {
    console.error("[missionStatsService] Failed to upsert player_stats:", updateStatsError.message);
    // Fallback : tentative update simple si upsert échoue
    const { error: updateErr } = await supabase
      .from("player_stats")
      .update({
        energie:      newStats.energie,
        stress:       newStats.stress,
        connaissance: newStats.connaissance,
        organisation: newStats.organisation,
        date_maj:     new Date().toISOString(),
      })
      .eq("id_user", parseInt(userId, 10));
    if (updateErr) {
      console.error("[missionStatsService] Fallback update also failed:", updateErr.message);
      return null;
    }
  }

  console.log(`✅ completeMission — stats sauvegardées: énergie=${newStats.energie}, stress=${newStats.stress}, connaissance=${newStats.connaissance}, organisation=${newStats.organisation}`);

  return {
    newStats,
    xpEarned:   0, // XP géré par missionRewardService.ts
    goldEarned: 0,
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

// ─── Fail Mission Stats ───────────────────────────────────────────────────────

/**
 * Call this when a user FAILS a mission (timer expired, deadline passed, or manual fail).
 *
 * Penalties applied:
 *   - Stress    += difficulte * 5   (échec = stress supplémentaire)
 *   - Energie   -= energie_cout / 2 (effort partiel gaspillé)
 *   - Organisation -= 5            (mission non accomplie = désorganisation)
 *   - Connaissance inchangée       (pas d'apprentissage complet)
 *
 * All values are clamped to [0, 100].
 */
export async function failMission(
  userId: string,
  mission: MissionData
): Promise<void> {
  const { data: statsData, error: statsError } = await supabase
    .from("player_stats")
    .select("energie, stress, connaissance, organisation")
    .eq("id_user", parseInt(userId, 10))
    .maybeSingle();

  if (statsError) {
    console.error("[failMission] Failed to fetch player_stats:", statsError.message);
    return;
  }

  const current: PlayerStats = {
    energie:       statsData?.energie       ?? 50,
    stress:        statsData?.stress        ?? 50,
    connaissance:  statsData?.connaissance  ?? 50,
    organisation:  statsData?.organisation  ?? 50,
    serenite:      50,
    concentration: 70,
    discipline:    50,
  };

  // Pénalités pour échec
  const stressPenalty      = mission.difficulte * 5;
  const energiePenalty     = Math.round(mission.energie_cout / 2);
  const organisationPenalty = 5;

  const newStress       = clamp(current.stress       + stressPenalty);
  const newEnergie      = clamp(current.energie      - energiePenalty);
  const newOrganisation = clamp(current.organisation - organisationPenalty);
  // Discipline pénalisée : 0 mission réalisée sur 1 totale
  const newDiscipline   = computeDisciplineFromRatio(current.discipline, 0, 1, 1);
  // Stats dérivées recalculées
  const newSerenite      = clamp(current.serenite + (100 - newStress) * 0.05 - 3);
  const newConcentration = clamp(current.concentration - (100 - newEnergie) * 0.05);

  const { error: updateError } = await supabase
    .from("player_stats")
    .upsert({
      id_user:      parseInt(userId, 10),
      energie:      newEnergie,
      stress:       newStress,
      connaissance: current.connaissance, // inchangée
      organisation: newOrganisation,
      date_maj:     new Date().toISOString(),
    }, { onConflict: "id_user" });

  if (updateError) {
    console.error("[failMission] Failed to upsert player_stats:", updateError.message);
    // Fallback update
    await supabase
      .from("player_stats")
      .update({
        energie:      newEnergie,
        stress:       newStress,
        organisation: newOrganisation,
        date_maj:     new Date().toISOString(),
      })
      .eq("id_user", parseInt(userId, 10));
  } else {
    console.log(`✅ failMission — stress: +${stressPenalty}, énergie: -${energiePenalty}, organisation: -${organisationPenalty}`);
  }
}

// ─── Récupération d'énergie : Dormir (1x/jour) ───────────────────────────────

/**
 * Bouton "Dormir" — remet l'énergie à 100, réduit le stress de 20.
 * Utilisable 1 seule fois par jour (vérifié via AsyncStorage).
 */
export async function sleepRestore(userId: string): Promise<{ success: boolean; message: string }> {
  const userIdInt = parseInt(userId, 10);
  const storageKey = `last_sleep:${userIdInt}`;

  // Vérifier le last_sleep en local
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;

    const lastSleepStr = await AsyncStorage.getItem(storageKey);
    if (lastSleepStr) {
      const lastSleep = new Date(lastSleepStr);
      const now       = new Date();
      const sameDay   =
        lastSleep.getDate()     === now.getDate()     &&
        lastSleep.getMonth()    === now.getMonth()    &&
        lastSleep.getFullYear() === now.getFullYear();

      if (sameDay) {
        return { success: false, message: "Tu as déjà dormi aujourd'hui ! Reviens demain. 😴" };
      }
    }

    // Récupérer stats actuelles
    const { data: ps, error } = await supabase
      .from("player_stats")
      .select("stress")
      .eq("id_user", userIdInt)
      .maybeSingle();

    if (error) {
      console.error("[sleepRestore] fetch error:", error.message);
      return { success: false, message: "Erreur lors de la récupération des stats." };
    }

    const newStress = clamp((ps?.stress ?? 50) - 20);

    // Mettre à jour player_stats (source principale)
    const { error: updateErr } = await supabase
      .from("player_stats")
      .upsert({
        id_user:  userIdInt,
        energie:  100,
        stress:   newStress,
        date_maj: new Date().toISOString(),
      }, { onConflict: "id_user" });

    if (updateErr) {
      console.error("[sleepRestore] update error:", updateErr.message);
      return { success: false, message: "Erreur lors de la sauvegarde." };
    }

    // Synchroniser aussi users.energie pour les écrans qui lisent cette colonne
    await supabase
      .from("users")
      .update({ energie: 100 })
      .eq("id_user", userIdInt);

    // Sauvegarder la date en local
    await AsyncStorage.setItem(storageKey, new Date().toISOString());

    console.log("✅ sleepRestore — énergie → 100, stress -20");
    return { success: true, message: "Bonne nuit ! ⚡ Énergie restaurée à 100%" };

  } catch (e) {
    console.error("[sleepRestore] error:", e);
    return { success: false, message: "Erreur inattendue." };
  }
}

// ─── Récupération d'énergie : Potion (boutique) ───────────────────────────────

export const ENERGY_POTION = {
  itemId:      99,          // ID unique dans user_items
  name:        "Potion d'énergie",
  emoji:       "⚡",
  description: "Restaure +40 d'énergie instantanément",
  price:       50,          // gold
  energyGain:  40,
};

/**
 * Acheter une potion d'énergie depuis la boutique.
 * Déduit le gold, ajoute la potion dans user_items.
 */
export async function buyEnergyPotion(
  userId: number,
  currentGold: number,
): Promise<{ success: boolean; message: string; newGold?: number }> {
  if (currentGold < ENERGY_POTION.price) {
    return { success: false, message: `Pas assez de gold ! Il te faut ${ENERGY_POTION.price} 🪙` };
  }

  const newGold = currentGold - ENERGY_POTION.price;

  const { error: goldErr } = await supabase
    .from("users")
    .update({ gold: newGold })
    .eq("id_user", userId);

  if (goldErr) return { success: false, message: "Erreur lors du paiement." };

  // Ajouter ou incrémenter la potion dans user_items
  const { data: existing } = await supabase
    .from("user_items")
    .select("quantite")
    .eq("id_user", userId)
    .eq("id_item", ENERGY_POTION.itemId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_items")
      .update({ quantite: (existing.quantite ?? 0) + 1 })
      .eq("id_user", userId)
      .eq("id_item", ENERGY_POTION.itemId);
  } else {
    await supabase
      .from("user_items")
      .insert({ id_user: userId, id_item: ENERGY_POTION.itemId, quantite: 1 });
  }

  return { success: true, message: "Potion achetée ! 🧪", newGold };
}

/**
 * Utiliser une potion d'énergie depuis l'inventaire.
 * Consomme 1 potion, ajoute +40 énergie (max 100).
 */
export async function useEnergyPotion(
  userId: number,
): Promise<{ success: boolean; message: string; newEnergie?: number }> {
  // Vérifier quantité
  const { data: item } = await supabase
    .from("user_items")
    .select("quantite")
    .eq("id_user", userId)
    .eq("id_item", ENERGY_POTION.itemId)
    .maybeSingle();

  if (!item || (item.quantite ?? 0) < 1) {
    return { success: false, message: "Tu n'as pas de potion ! Achète-en une à la boutique. 🏪" };
  }

  // Récupérer énergie actuelle
  const { data: ps } = await supabase
    .from("player_stats")
    .select("energie")
    .eq("id_user", userId)
    .maybeSingle();

  const newEnergie = clamp((ps?.energie ?? 50) + ENERGY_POTION.energyGain);

  // Mettre à jour player_stats (source principale)
  await supabase
    .from("player_stats")
    .upsert({
      id_user:  userId,
      energie:  newEnergie,
      date_maj: new Date().toISOString(),
    }, { onConflict: "id_user" });

  // Synchroniser aussi users.energie
  await supabase
    .from("users")
    .update({ energie: newEnergie })
    .eq("id_user", userId);

  // Décrémenter quantité
  const newQty = (item.quantite ?? 1) - 1;
  if (newQty <= 0) {
    await supabase.from("user_items").delete()
      .eq("id_user", userId).eq("id_item", ENERGY_POTION.itemId);
  } else {
    await supabase.from("user_items").update({ quantite: newQty })
      .eq("id_user", userId).eq("id_item", ENERGY_POTION.itemId);
  }

  console.log(`✅ useEnergyPotion — énergie: ${ps?.energie ?? 50} → ${newEnergie}`);
  return { success: true, message: `⚡ +${ENERGY_POTION.energyGain} énergie !`, newEnergie };
}

// ─── Récupération passive (appelée au chargement du dashboard) ────────────────

/**
 * Récupération passive : +2 énergie par heure d'inactivité (max +20 à la fois).
 * À appeler à chaque ouverture du dashboard.
 */
export async function applyPassiveEnergyRecovery(userId: number): Promise<number> {
  const { data: ps } = await supabase
    .from("player_stats")
    .select("energie, date_maj")
    .eq("id_user", userId)
    .maybeSingle();

  if (!ps?.date_maj) return ps?.energie ?? 50;

  const lastUpdate  = new Date(ps.date_maj);
  const now         = new Date();
  const heuresEcoulees = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

  if (heuresEcoulees < 1) return ps.energie ?? 50; // Pas encore 1h

  const gainEnergie = Math.min(heuresEcoulees * 2, 20); // +2/h, max +20
  const newEnergie  = clamp((ps.energie ?? 50) + gainEnergie);

  await supabase
    .from("player_stats")
    .update({ energie: newEnergie, date_maj: now.toISOString() })
    .eq("id_user", userId);

  console.log(`✅ Récupération passive — +${gainEnergie} énergie (${heuresEcoulees}h), total: ${newEnergie}`);
  return newEnergie;
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