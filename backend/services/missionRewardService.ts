/**
 * ═══════════════════════════════════════════════════════════════
 *  missionRewardService.ts  —  SOURCE UNIQUE DE VÉRITÉ
 * ═══════════════════════════════════════════════════════════════
 *
 *  RÈGLE FONDAMENTALE :
 *    • users.xp          → XP global du joueur (missions + défis + events)
 *    • player_stats      → stats gameplay (énergie, stress, connaissance, organisation)
 *    • defi_participants.xp_total → XP gagné UNIQUEMENT dans le contexte d'un défi
 *
 *  Les deux compteurs sont INDÉPENDANTS :
 *    - Finir une mission hors-défi → users.xp uniquement
 *    - Finir une mission dans un défi → users.xp ET defi_participants.xp_total
 *    - Terminer un event (boss) → users.xp via boss_results.xp_boss
 */

import { supabase } from "../../app/frontend/constants/supabase";
import { completeMission as applyStatDeltas } from "./Userstatsservice";
import { checkAndUnlockBadges } from "./badgeEngine";
import { checkAndUpdateLevel, LevelUpResult } from "./levelService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MissionRewardResult {
  xp: number;
  gold: number;
  statsDelta: {
    energie: number;
    stress: number;
    connaissance: number;
    organisation: number;
  } | null;
  badgesUnlocked: string[];
  levelUp: LevelUpResult;
}

// ─── Calculs ──────────────────────────────────────────────────────────────────

function calcXP(missionXpGain: number, elapsedSeconds: number): number {
  const timeBonus = Math.max(5, Math.round(elapsedSeconds / 60) * 2);
  return (missionXpGain ?? 0) + timeBonus;
}

function calcGold(difficulte: number, priorite: number): number {
  return (difficulte ?? 1) * 10 + (priorite ?? 1) * 5;
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export async function finishMission(
  userId: number,
  missionId: number,
  elapsedSeconds: number,
  validationId: number | null = null
): Promise<MissionRewardResult> {

  // 1. Charger la mission complète
  const { data: mission, error: mErr } = await supabase
    .from("mission")
    .select("xp_gain, difficulte, priorite, energie_cout, stress_gain, connaissance_gain, organisation_gain, titre, description, id_defi, id_boss")
    .eq("id_mission", missionId)
    .single();

  if (mErr || !mission) throw new Error("Mission introuvable: " + mErr?.message);

  const xp   = calcXP(mission.xp_gain, elapsedSeconds);
  const gold = calcGold(mission.difficulte, mission.priorite);
  const now  = new Date().toISOString();

  // 2. Validation
  if (validationId) {
    await supabase
      .from("mission_validation")
      .update({ date_fin: now, xp_obtenu: xp, statut: "done" })
      .eq("id_validation", validationId);
  } else {
    await supabase
      .from("mission_validation")
      .insert({ id_user: userId, id_mission: missionId, date_debut: now, date_fin: now, xp_obtenu: xp, statut: "done" });
  }

  // 3. Statut mission
  await supabase.from("mission").update({ statut: "done" }).eq("id_mission", missionId);

  // 4. XP + gold global (users.xp)
  const { data: user } = await supabase.from("users").select("xp, gold").eq("id_user", userId).single();
  await supabase.from("users").update({ xp: (user?.xp ?? 0) + xp, gold: (user?.gold ?? 0) + gold }).eq("id_user", userId);

  // 5. Deltas stats gameplay
  const statsResult = await applyStatDeltas(String(userId), {
    id_mission: missionId,
    titre: mission.titre,
    description: mission.description ?? "",
    duree_min: Math.round(elapsedSeconds / 60),
    difficulte: mission.difficulte,
    priorite: mission.priorite,
    energie_cout: mission.energie_cout,
    stress_gain: mission.stress_gain,
    connaissance_gain: mission.connaissance_gain,
    organisation_gain: mission.organisation_gain,
    xp_gain: mission.xp_gain,
  });

  // 5b. Vérifier et mettre à jour le niveau (500 XP = 1 niveau)
  const levelUp = await checkAndUpdateLevel(userId);

  // 6. Si mission liée à un défi → incrémenter xp_total du participant (COMPTEUR SÉPARÉ)
  if (mission.id_defi) {
    const { data: dp } = await supabase
      .from("defi_participants")
      .select("xp_total, minutes_etudies")
      .eq("id_defi", mission.id_defi)
      .eq("id_user", userId)
      .maybeSingle();

    const prevXp      = dp?.xp_total       ?? 0;
    const prevMinutes = dp?.minutes_etudies ?? 0;
    const newMinutes  = prevMinutes + Math.round(elapsedSeconds / 60);

    await supabase.from("defi_participants").upsert({
      id_defi:         mission.id_defi,
      id_user:         userId,
      xp_total:        prevXp + xp,
      minutes_etudies: newMinutes,
      score:           (prevXp + xp) + newMinutes * 2,
    }, { onConflict: "id_defi,id_user" });
  }

  // 7. Badges
  const badgesUnlocked = await checkAndUnlockBadges(userId);

  return {
    xp,
    gold,
    statsDelta: statsResult
      ? { energie: statsResult.newStats.energie, stress: statsResult.newStats.stress, connaissance: statsResult.newStats.connaissance, organisation: statsResult.newStats.organisation }
      : null,
    badgesUnlocked,
    levelUp,
  };
}

// ─── XP Événement (boss) ─────────────────────────────────────────────────────

export async function finishBossEvent(
  userId: number,
  bossId: number,
  xpBoss: number
): Promise<{ badgesUnlocked: string[] }> {
  // Enregistrer dans boss_results
  await supabase.from("boss_results").insert({
    id_user:    userId,
    id_boss:    bossId,
    xp_boss:    xpBoss,
    date_event: new Date().toISOString(),
  });

  // Ajouter au XP global du joueur
  const { data: user } = await supabase.from("users").select("xp").eq("id_user", userId).single();
  await supabase.from("users").update({ xp: (user?.xp ?? 0) + xpBoss }).eq("id_user", userId);

  // Vérifier badges
  const badgesUnlocked = await checkAndUnlockBadges(userId);
  return { badgesUnlocked };
}