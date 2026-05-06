/**
 * ═══════════════════════════════════════════════════════════════
 *  badgeEngine.ts  —  MOTEUR DE BADGES
 * ═══════════════════════════════════════════════════════════════
 *
 *  Badges existants dans la BDD (ne pas re-insérer) :
 *
 *  id | nom               | condition (text en BDD)
 *  ---+-------------------+---------------------------
 *   1 | Premiers Pas      | Valider 1 mission
 *   2 | Série de 7 jours  | 7 jours consécutifs
 *   3 | Vision Master     | Voir les stats 10 fois
 *   4 | Missionnaire      | Valider 10 missions
 *   5 | Organisé(e)       | 90% Organisation
 *   6 | Concentration Pro | 5 sessions focus
 *   7 | Discipline        | 90% Organisation sur 7j
 *   8 | Stressed? Non!    | Stress < 30%
 *   9 | Expert            | Niveau 10
 *  10 | Marathonien       | Valider 30 missions
 *  11 | Légende           | 100% compétences
 *  12 | Zen Attitude      | 7 jours stress < 20%
 *
 *  IMPORTANT : les clés du BADGE_CONDITIONS doivent correspondre
 *  EXACTEMENT au champ `condition` stocké dans la table `badges`.
 */

import { supabase } from "../../app/frontend/constants/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Snapshot du joueur ───────────────────────────────────────────────────────

interface UserSnapshot {
  missionsDone:       number;   // total validations statut=done
  streak7:            boolean;  // 7 jours de connexion consécutifs
  statsViewCount:     number;   // nombre de fois que l'user a ouvert ses stats
  organisation:       number;   // player_stats.organisation (0-100)
  organisationHigh7:  boolean;  // organisation >= 90 pendant 7 jours consécutifs
  focusSessions:      number;   // sessions de missions complétées sans interruption
  stress:             number;   // player_stats.stress (0-100)
  stressLow7:         boolean;  // stress < 20 pendant 7 jours consécutifs
  niveau:             number;   // level.niveau du user
  skillsMax:          boolean;  // toutes les compétences (user_skills) à leur max
}

async function getUserSnapshot(userId: number): Promise<UserSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── 1. Missions terminées ─────────────────────────────────────────────────
  const { count: missionsDone } = await supabase
    .from("mission_validation")
    .select("*", { count: "exact", head: true })
    .eq("id_user", userId)
    .eq("statut", "done");

  // ── 2. Streak 7 jours (connexions consécutives via dernier_login) ─────────
  //    On regarde stat_history : s'il y a des entrées chaque jour les 7 derniers jours
  const streak7 = await checkStreak(userId, 7);

  // ── 3. Stats views (stockées en AsyncStorage côté client) ─────────────────
  //    Le compteur est incrémenté dans le Dashboard à chaque ouverture.
  //    Ici on lit la valeur stockée en BDD dans user_feedback ou via clé dédiée.
  const statsViewCount = await getStatsViewCount(userId);

  // ── 4. Stats gameplay ─────────────────────────────────────────────────────
  const { data: ps } = await supabase
    .from("player_stats")
    .select("stress, organisation")
    .eq("id_user", userId)
    .maybeSingle();

  const organisation = ps?.organisation ?? 0;
  const stress       = ps?.stress       ?? 100;

  // ── 5. Organisation >= 90 depuis 7 jours (stat_history) ──────────────────
  const organisationHigh7 = await checkStatHighForDays(userId, "organisation", 90, 7);

  // ── 6. Sessions focus (missions done sans statut "paused" intermédiaire) ──
  const focusSessions = await countFocusSessions(userId);

  // ── 7. Stress < 20 depuis 7 jours ─────────────────────────────────────────
  const stressLow7 = await checkStatLowForDays(userId, "stress", 20, 7);

  // ── 8. Niveau ─────────────────────────────────────────────────────────────
  const { data: user } = await supabase
    .from("users")
    .select("id_level")
    .eq("id_user", userId)
    .single();

  let niveau = 1;
  if (user?.id_level) {
    const { data: lvl } = await supabase
      .from("level")
      .select("niveau")
      .eq("id_level", user.id_level)
      .single();
    niveau = lvl?.niveau ?? 1;
  }

  // ── 9. Toutes les compétences au max ──────────────────────────────────────
  const skillsMax = await checkAllSkillsMax(userId);

  return {
    missionsDone:      missionsDone ?? 0,
    streak7,
    statsViewCount,
    organisation,
    organisationHigh7,
    focusSessions,
    stress,
    stressLow7,
    niveau,
    skillsMax,
  };
}

// ─── Helpers de vérification ──────────────────────────────────────────────────

/**
 * Vérifie si l'user a une entrée dans stat_history chaque jour
 * des N derniers jours (= activité quotidienne = "streak").
 */
async function checkStreak(userId: number, days: number): Promise<boolean> {
  const results: boolean[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const { count } = await supabase
      .from("stat_history")
      .select("*", { count: "exact", head: true })
      .eq("id_user", userId)
      .gte("date", d.toISOString())
      .lt("date", nextD.toISOString());

    results.push((count ?? 0) > 0);
  }

  return results.every(Boolean);
}

/**
 * Vérifie si la stat `statName` est >= `threshold` chaque jour
 * des N derniers jours dans stat_history.
 */
async function checkStatHighForDays(
  userId: number,
  statName: "organisation" | "stress" | "energie" | "connaissance",
  threshold: number,
  days: number
): Promise<boolean> {
  const { data } = await supabase
    .from("stat_history")
    .select(`date, ${statName}`)
    .eq("id_user", userId)
    .gte("date", new Date(Date.now() - days * 86400000).toISOString())
    .order("date", { ascending: false });

  if (!data || data.length < days) return false;

  // Grouper par jour et vérifier que chaque jour a la stat >= threshold
  const byDay = new Map<string, number[]>();
  data.forEach((row: any) => {
    const day = new Date(row.date).toDateString();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(row[statName] ?? 0);
  });

  if (byDay.size < days) return false;

  for (const vals of byDay.values()) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < threshold) return false;
  }

  return true;
}

/**
 * Vérifie si la stat `statName` est < `threshold` chaque jour
 * des N derniers jours (pour stress).
 */
async function checkStatLowForDays(
  userId: number,
  statName: "stress",
  threshold: number,
  days: number
): Promise<boolean> {
  const { data } = await supabase
    .from("stat_history")
    .select(`date, ${statName}`)
    .eq("id_user", userId)
    .gte("date", new Date(Date.now() - days * 86400000).toISOString())
    .order("date", { ascending: false });

  if (!data || data.length < days) return false;

  const byDay = new Map<string, number[]>();
  data.forEach((row: any) => {
    const day = new Date(row.date).toDateString();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(row[statName] ?? 100);
  });

  if (byDay.size < days) return false;

  for (const vals of byDay.values()) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg >= threshold) return false;
  }

  return true;
}

/**
 * Compte les sessions "focus" = missions validées sans avoir jamais été
 * passées en "paused" pendant cette session.
 * Approche : compter les validations où date_debut → date_fin sans coupure.
 */
async function countFocusSessions(userId: number): Promise<number> {
  const { data } = await supabase
    .from("mission_validation")
    .select("id_validation, date_debut, date_fin, statut")
    .eq("id_user", userId)
    .eq("statut", "done");

  // Une session "focus" = une validation avec date_debut et date_fin
  // sans interruption (on ne peut pas détecter pause côté BDD sans plus de données)
  // On compte simplement les missions terminées comme proxy de "sessions focus"
  return (data ?? []).filter((v: any) => v.date_debut && v.date_fin).length;
}

/**
 * Lit le compteur de vues des stats.
 * Ce compteur est stocké dans user_feedback comme proxy,
 * ou dans une colonne dédiée.
 * Pour l'instant, on utilise la clé AsyncStorage côté client
 * et on la stocke aussi dans user_feedback.ressent_stress comme compteur.
 *
 * ⚠️  Implémentation simple : compter le nombre de user_feedback de l'user
 *     (chaque fois qu'il remplit le questionnaire = il a vu ses stats).
 */
async function getStatsViewCount(userId: number): Promise<number> {
  const { count } = await supabase
    .from("user_feedback")
    .select("*", { count: "exact", head: true })
    .eq("id_user", userId);

  return count ?? 0;
}

/**
 * Vérifie si toutes les compétences du joueur sont au max (valeur 100).
 */
async function checkAllSkillsMax(userId: number): Promise<boolean> {
  // Récupérer toutes les compétences existantes
  const { data: allSkills } = await supabase.from("skills").select("id_skill");
  if (!allSkills?.length) return false;

  // Récupérer les compétences du joueur
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select("id_skill, valeur")
    .eq("id_user", userId);

  if (!userSkills || userSkills.length < allSkills.length) return false;

  return userSkills.every((s: any) => s.valeur >= 100);
}

// ─── Table de conditions ──────────────────────────────────────────────────────
// Les clés correspondent EXACTEMENT au champ `condition` dans la table `badges`

const BADGE_CONDITIONS: Record<string, (s: UserSnapshot) => boolean> = {
  "Valider 1 mission":        (s) => s.missionsDone >= 1,
  "7 jours consécutifs":      (s) => s.streak7,
  "Voir les stats 10 fois":   (s) => s.statsViewCount >= 10,
  "Valider 10 missions":      (s) => s.missionsDone >= 10,
  "90% Organisation":         (s) => s.organisation >= 90,
  "5 sessions focus":         (s) => s.focusSessions >= 5,
  "90% Organisation sur 7j":  (s) => s.organisationHigh7,
  "Stress < 30%":             (s) => s.stress < 30,
  "Niveau 10":                (s) => s.niveau >= 10,
  "Valider 30 missions":      (s) => s.missionsDone >= 30,
  "100% compétences":         (s) => s.skillsMax,
  "7 jours stress < 20%":     (s) => s.stressLow7,
};

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Vérifie tous les badges non encore obtenus et débloque ceux
 * dont la condition est remplie.
 *
 * @param userId  - id_user (number)
 * @returns noms des badges nouvellement débloqués (pour afficher une notif)
 */
export async function checkAndUnlockBadges(userId: number): Promise<string[]> {
  try {
    // 1. Badges déjà obtenus par ce joueur
    const { data: owned } = await supabase
      .from("user_badges")
      .select("id_badge")
      .eq("id_user", userId);

    const ownedIds = new Set((owned ?? []).map((b: any) => b.id_badge));

    // 2. Tous les badges de la BDD
    const { data: allBadges } = await supabase
      .from("badges")
      .select("id_badge, nom, condition");

    if (!allBadges?.length) return [];

    // 3. Filtrer : pas encore obtenu + condition connue dans le moteur
    const candidates = allBadges.filter(
      (b: any) => !ownedIds.has(b.id_badge) && b.condition && BADGE_CONDITIONS[b.condition]
    );

    if (!candidates.length) return [];

    // 4. Construire le snapshot du joueur (un seul appel pour tous les badges)
    const snapshot = await getUserSnapshot(userId);

    // 5. Tester chaque condition
    const unlocked: string[] = [];

    for (const badge of candidates) {
      const check = BADGE_CONDITIONS[badge.condition];
      if (check && check(snapshot)) {
        const { error } = await supabase
          .from("user_badges")
          .insert({ id_user: userId, id_badge: badge.id_badge });

        if (!error) {
          unlocked.push(badge.nom);
          console.log(`🏅 Badge débloqué pour user ${userId}: ${badge.nom}`);
        }
      }
    }

    return unlocked;
  } catch (err) {
    console.error("[badgeEngine] Erreur:", err);
    return [];
  }
}

// ─── Utilitaire : incrémenter le compteur de vues stats ──────────────────────

/**
 * À appeler depuis le Dashboard quand l'user ouvre l'écran de stats.
 * Stocke un enregistrement dans user_feedback pour pouvoir compter côté BDD.
 */
export async function incrementStatsView(userId: number): Promise<void> {
  try {
    await supabase.from("user_feedback").insert({
      id_user:      userId,
      ressent_stress: 0,
      note_stress:    0,
      commentaire:   "__stats_view__", // marqueur pour distinguer des vrais feedbacks
    });
  } catch {
    // Silencieux — pas critique
  }
}