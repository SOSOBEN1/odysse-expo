/**
 * ═══════════════════════════════════════════════════════════════
 *  levelService.ts  —  GESTION DES NIVEAUX
 * ═══════════════════════════════════════════════════════════════
 *
 *  RÈGLE SIMPLE : 500 XP = 1 niveau
 *
 *  La table `level` contient les paliers :
 *    niveau 1  → xp_min: 0,    xp_max: 499
 *    niveau 2  → xp_min: 500,  xp_max: 999
 *    niveau 3  → xp_min: 1000, xp_max: 1499
 *    ...etc
 *
 *  users.id_level → FK vers level.id_level
 *  users.xp       → XP TOTAL cumulé (jamais réinitialisé)
 *
 *  On appelle `checkAndUpdateLevel(userId)` après chaque gain d'XP.
 */

import { supabase } from "../../app/frontend/constants/supabase";

// ─── Constante ────────────────────────────────────────────────────────────────

export const XP_PAR_NIVEAU = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LevelInfo {
  niveau: number;
  id_level: number;
  xp_min: number;
  xp_max: number;
  xp_dans_niveau: number;   // XP dans le niveau actuel (0..499)
  progression_pct: number;  // % de progression vers le prochain niveau (0..100)
  xp_total: number;         // XP total du joueur
  gold_reward: number;      // gold de la récompense du niveau
}

export interface LevelUpResult {
  leveled_up: boolean;
  old_niveau: number;
  new_niveau: number;
  gold_earned: number;      // gold bonus du level-up (0 si pas de level-up)
  level_info: LevelInfo;
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/**
 * Calcule le numéro de niveau à partir du XP total.
 * niveau 1 = 0..499 XP
 * niveau 2 = 500..999 XP
 * etc.
 */
export function calcNiveauFromXP(xpTotal: number): number {
  return Math.floor(xpTotal / XP_PAR_NIVEAU) + 1;
}

/**
 * Retourne les infos détaillées de niveau pour un XP donné.
 */
export function calcLevelInfo(xpTotal: number, id_level: number, gold_reward: number): Omit<LevelInfo, "id_level" | "gold_reward"> {
  const niveau        = calcNiveauFromXP(xpTotal);
  const xp_min        = (niveau - 1) * XP_PAR_NIVEAU;
  const xp_max        = niveau * XP_PAR_NIVEAU - 1;
  const xp_dans_niveau = xpTotal - xp_min;
  const progression_pct = Math.round((xp_dans_niveau / XP_PAR_NIVEAU) * 100);

  return { niveau, xp_min, xp_max, xp_dans_niveau, progression_pct, xp_total: xpTotal };
}

// ─── Seed des niveaux (à appeler une fois en setup) ───────────────────────────

/**
 * Insère les niveaux dans la table `level` si elle est vide.
 * Appelle cette fonction une seule fois depuis ton script de seed.
 *
 * SQL équivalent :
 *   INSERT INTO level (niveau, xp_min, xp_max, gold_reward) VALUES
 *     (1,  0,    499,  0),
 *     (2,  500,  999,  50),
 *     (3,  1000, 1499, 75),
 *     ...
 */
export async function seedLevels(maxNiveau: number = 50): Promise<void> {
  const { count } = await supabase
    .from("level")
    .select("*", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    console.log("[levelService] Niveaux déjà seedés, skip.");
    return;
  }

  const rows = Array.from({ length: maxNiveau }, (_, i) => {
    const n = i + 1;
    return {
      niveau:      n,
      xp_min:      (n - 1) * XP_PAR_NIVEAU,
      xp_max:      n * XP_PAR_NIVEAU - 1,
      // Récompense gold : 0 pour niveau 1, sinon 50 + 25 par niveau supplémentaire
      gold_reward: n === 1 ? 0 : 50 + (n - 2) * 25,
    };
  });

  const { error } = await supabase.from("level").insert(rows);
  if (error) throw new Error("[levelService] seedLevels échoué : " + error.message);

  console.log(`[levelService] ${maxNiveau} niveaux insérés.`);
}

// ─── Récupérer les infos de niveau d'un user ──────────────────────────────────

/**
 * Retourne les infos de niveau complètes pour un user.
 */
export async function getLevelInfo(userId: number): Promise<LevelInfo> {
  // 1. XP total du joueur
  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("xp, id_level")
    .eq("id_user", userId)
    .single();

  if (uErr || !user) throw new Error("[levelService] User introuvable : " + uErr?.message);

  const xpTotal = user.xp ?? 0;
  const niveau  = calcNiveauFromXP(xpTotal);

  // 2. Récupérer la row level correspondante
  const { data: lvl } = await supabase
    .from("level")
    .select("id_level, gold_reward")
    .eq("niveau", niveau)
    .maybeSingle();

  const id_level   = lvl?.id_level   ?? user.id_level ?? 1;
  const gold_reward = lvl?.gold_reward ?? 0;

  const base = calcLevelInfo(xpTotal, id_level, gold_reward);

  return { ...base, id_level, gold_reward };
}

// ─── Vérifier et mettre à jour le niveau après un gain d'XP ──────────────────

/**
 * À appeler APRÈS avoir mis à jour users.xp.
 * Compare le niveau actuel (calculé depuis l'XP) avec users.id_level.
 * Si le joueur a changé de niveau, met à jour users.id_level et donne le gold.
 *
 * @returns LevelUpResult avec leveled_up=true si level-up, false sinon.
 */
export async function checkAndUpdateLevel(userId: number): Promise<LevelUpResult> {
  // 1. Lire l'état actuel du joueur
  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("xp, id_level, gold")
    .eq("id_user", userId)
    .single();

  if (uErr || !user) throw new Error("[levelService] User introuvable : " + uErr?.message);

  const xpTotal       = user.xp    ?? 0;
  const currentGold   = user.gold  ?? 0;
  const currentIdLevel = user.id_level;

  // 2. Calculer le niveau actuel depuis l'XP
  const nouveauNiveau = calcNiveauFromXP(xpTotal);

  // 3. Trouver l'ancienne row level (pour connaître old_niveau)
  let oldNiveau = 1;
  if (currentIdLevel) {
    const { data: oldLvl } = await supabase
      .from("level")
      .select("niveau")
      .eq("id_level", currentIdLevel)
      .maybeSingle();
    oldNiveau = oldLvl?.niveau ?? 1;
  }

  // 4. Trouver la nouvelle row level
  const { data: newLvl } = await supabase
    .from("level")
    .select("id_level, gold_reward")
    .eq("niveau", nouveauNiveau)
    .maybeSingle();

  // Si la row n'existe pas encore dans la table, on la crée à la volée
  let newIdLevel   = newLvl?.id_level   ?? currentIdLevel ?? 1;
  let goldReward   = newLvl?.gold_reward ?? 0;

  if (!newLvl) {
    // Créer la row manquante
    const xp_min = (nouveauNiveau - 1) * XP_PAR_NIVEAU;
    const xp_max = nouveauNiveau * XP_PAR_NIVEAU - 1;
    const gold_r  = nouveauNiveau === 1 ? 0 : 50 + (nouveauNiveau - 2) * 25;

    const { data: inserted } = await supabase
      .from("level")
      .insert({ niveau: nouveauNiveau, xp_min, xp_max, gold_reward: gold_r })
      .select("id_level, gold_reward")
      .single();

    if (inserted) {
      newIdLevel  = inserted.id_level;
      goldReward  = inserted.gold_reward;
    }
  }

  // 5. Pas de changement ?
  if (nouveauNiveau === oldNiveau) {
    const levelInfo = await getLevelInfo(userId);
    return {
      leveled_up: false,
      old_niveau: oldNiveau,
      new_niveau: nouveauNiveau,
      gold_earned: 0,
      level_info: levelInfo,
    };
  }

  // 6. Level-up ! Mettre à jour users.id_level + gold
  await supabase
    .from("users")
    .update({
      id_level: newIdLevel,
      gold:     currentGold + goldReward,
    })
    .eq("id_user", userId);

  console.log(
    `[levelService] 🎉 Level-up user ${userId} : niveau ${oldNiveau} → ${nouveauNiveau} (+${goldReward} gold)`
  );

  const levelInfo = await getLevelInfo(userId);

  return {
    leveled_up:  true,
    old_niveau:  oldNiveau,
    new_niveau:  nouveauNiveau,
    gold_earned: goldReward,
    level_info:  levelInfo,
  };
}