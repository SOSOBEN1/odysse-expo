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

// ── Helper : récupérer le niveau d'un skill user ──────────────────────────────
async function getSkillValue(userId: number, skillId: number): Promise<number> {
  const { data } = await supabase
    .from("user_skills")
    .select("valeur")
    .eq("id_user", userId)
    .eq("id_skill", skillId)
    .maybeSingle();
  return data?.valeur ?? 0;
}

// ── Helper : vérifier que plusieurs skills sont >= threshold ──────────────────
async function checkSkillsAbove(userId: number, skillIds: number[], threshold: number): Promise<boolean> {
  const { data } = await supabase
    .from("user_skills")
    .select("id_skill, valeur")
    .eq("id_user", userId)
    .in("id_skill", skillIds);

  if (!data || data.length < skillIds.length) return false;
  return data.every((s: any) => (s.valeur ?? 0) >= threshold);
}

// ── Snapshot étendu ───────────────────────────────────────────────────────────

interface ExtendedSnapshot extends UserSnapshot {
  // Skills bien-être
  skillRespiration:   number;
  skillMeditation:    number;
  skillEmotions:      number;
  skillSommeil:       number;
  skillSport:         number;
  skillNutrition:     number;
  skillsBienEtre80:   boolean;
  // Skills apprentissage
  skillLecture:       number;
  skillRepetition:    number;
  skillFeynman:       number;
  skillMindMap:       number;
  skillsApprentissage80: boolean;
  // Skills organisation
  skillPlanning:      number;
  skillPomodoro:      number;    // on utilise focusSessions pour les sessions pomodoro
  skillPriorisation:  number;
  skillAntiProcra:    number;
  skillsOrganisation80: boolean;
  // XP total
  xpTotal: number;
}

async function getExtendedSnapshot(userId: number): Promise<ExtendedSnapshot> {
  const base = await getUserSnapshot(userId);

  const [
    skillRespiration, skillMeditation, skillEmotions, skillSommeil, skillSport, skillNutrition,
    skillLecture, skillRepetition, skillFeynman, skillMindMap,
    skillPlanning, skillPomodoro, skillPriorisation, skillAntiProcra,
    skillsBienEtre80, skillsApprentissage80, skillsOrganisation80,
  ] = await Promise.all([
    // Bien-être (IDs 1-6)
    getSkillValue(userId, 1),
    getSkillValue(userId, 2),
    getSkillValue(userId, 3),
    getSkillValue(userId, 4),
    getSkillValue(userId, 5),
    getSkillValue(userId, 6),
    // Apprentissage (IDs 7-10)
    getSkillValue(userId, 7),
    getSkillValue(userId, 8),
    getSkillValue(userId, 9),
    getSkillValue(userId, 10),
    // Organisation (IDs 11-14)
    getSkillValue(userId, 11),
    getSkillValue(userId, 12),
    getSkillValue(userId, 13),
    getSkillValue(userId, 14),
    // Groupes >= 80
    checkSkillsAbove(userId, [1, 2, 3, 4, 5, 6], 80),
    checkSkillsAbove(userId, [7, 8, 9, 10], 80),
    checkSkillsAbove(userId, [11, 12, 13, 14], 80),
  ]);

  // XP total
  const { data: user } = await supabase.from("users").select("xp").eq("id_user", userId).single();
  const xpTotal = user?.xp ?? 0;

  return {
    ...base,
    skillRespiration, skillMeditation, skillEmotions, skillSommeil, skillSport, skillNutrition,
    skillsBienEtre80,
    skillLecture, skillRepetition, skillFeynman, skillMindMap,
    skillsApprentissage80,
    skillPlanning, skillPomodoro, skillPriorisation, skillAntiProcra,
    skillsOrganisation80,
    xpTotal,
  };
}

const BADGE_CONDITIONS: Record<string, (s: ExtendedSnapshot) => boolean> = {
  // ── Badges existants ─────────────────────────────────────────────────────────
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

  // ── MODULE BIEN-ÊTRE ────────────────────────────────────────────────────────
  "Skill Respiration x5":     (s) => s.skillRespiration >= 5,
  "Skill Méditation 50":      (s) => s.skillMeditation >= 50,
  "Skill Emotions 75":        (s) => s.skillEmotions >= 75,
  "Skill Sommeil 50":         (s) => s.skillSommeil >= 50,
  "Skill Sport 50":           (s) => s.skillSport >= 50,
  "Skill Nutrition 50":       (s) => s.skillNutrition >= 50,
  "Skills Bien-Être 80":      (s) => s.skillsBienEtre80,

  // ── MODULE APPRENTISSAGE ────────────────────────────────────────────────────
  "Skill Lecture 30":         (s) => s.skillLecture >= 30,
  "Skill Repetition 50":      (s) => s.skillRepetition >= 50,
  "Skill Feynman 50":         (s) => s.skillFeynman >= 50,
  "Skill MindMap 75":         (s) => s.skillMindMap >= 75,
  "Skills Apprentissage 80":  (s) => s.skillsApprentissage80,

  // ── MODULE ORGANISATION ─────────────────────────────────────────────────────
  "Skill Planning 30":        (s) => s.skillPlanning >= 30,
  "Skill Pomodoro 10 sessions":(s) => s.focusSessions >= 10,
  "Skill Priorisation 75":    (s) => s.skillPriorisation >= 75,
  "Skill AntiProcra 50":      (s) => s.skillAntiProcra >= 50,
  "Skills Organisation 80":   (s) => s.skillsOrganisation80,

  // ── NIVEAUX ─────────────────────────────────────────────────────────────────
  "Niveau 5":   (s) => s.niveau >= 5,
  "Niveau 20":  (s) => s.niveau >= 20,
  "Niveau 30":  (s) => s.niveau >= 30,
  "Niveau 50":  (s) => s.niveau >= 50,

  // ── XP TOTAL ────────────────────────────────────────────────────────────────
  "XP Total 1000":  (s) => s.xpTotal >= 1000,
  "XP Total 5000":  (s) => s.xpTotal >= 5000,
  "XP Total 10000": (s) => s.xpTotal >= 10000,
};

// ─── Fonction principale ──────────────────────────────────────────────────────

/**
 * Vérifie tous les badges non encore obtenus et débloque ceux
 * dont la condition est remplie.
 *
 * @param userId  - id_user (number)
 * @returns noms des badges nouvellement débloqués (pour afficher une notif)
 */
// ─── Récompense gold par badge (rareté) ──────────────────────────────────────
// Commun : 25 🪙 | Rare : 50 🪙 | Épique : 100 🪙 | Légendaire : 200 🪙
const BADGE_GOLD_REWARD: Record<number, number> = {
  // Communs — premiers accomplissements
  1:  25,   // Premiers Pas
  3:  25,   // Vision Master
  5:  25,   // Organisé(e)
  6:  25,   // Concentration Pro
  8:  25,   // Stressed? Non!
  20: 25,   // Lecteur assidu
  25: 25,   // Planificateur
  // Rares — effort soutenu
  2:  50,   // Série de 7 jours
  4:  50,   // Missionnaire (10 missions)
  7:  50,   // Discipline (7j orga 90%)
  12: 50,   // Zen Attitude (7j stress<20%)
  13: 50,   // Respirateur
  14: 50,   // Méditation
  17: 50,   // Sportif
  21: 50,   // Érudit
  26: 50,   // Pomodoro Master
  // Épiques — haut niveau
  9:  100,  // Expert (niveau 10)
  10: 100,  // Marathonien (30 missions)
  15: 100,  // Santé parfaite
  16: 100,  // Dormeur d'or
  22: 100,  // Génie
  23: 100,  // Explorateur
  27: 100,  // Stratège
  28: 100,  // Fusée
  // Légendaires — excellence totale
  11: 200,  // Légende (100% compétences)
  19: 150,  // Équilibre parfait
  24: 150,  // Académicien
  29: 150,  // Architecte
  30: 200,  // Superstar
  33: 200,  // Royauté
  34: 200,  // Prédateur
  37: 200,  // Diamant
};

const DEFAULT_BADGE_GOLD = 30; // fallback pour tout badge non listé

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
    const snapshot = await getExtendedSnapshot(userId);

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

          // ── Attribuer le gold de récompense ──────────────────────────────
          const goldReward = BADGE_GOLD_REWARD[badge.id_badge] ?? DEFAULT_BADGE_GOLD;
          const { data: userData } = await supabase
            .from("users")
            .select("gold")
            .eq("id_user", userId)
            .maybeSingle();

          const newGold = (userData?.gold ?? 0) + goldReward;
          await supabase
            .from("users")
            .update({ gold: newGold })
            .eq("id_user", userId);

          console.log(`🪙 +${goldReward} gold pour badge "${badge.nom}" → total: ${newGold}`);
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