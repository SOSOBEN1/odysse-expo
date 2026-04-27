import {
    addUserBadge,
    countUserMissions,
    extractBadge,
    fetchAllBadges,
    fetchUserBadges,
    hasUserBadge,
} from "../../../backend/services/badgeService";

// ── Types exposés à la vue ────────────────────────────────────
export interface Badge {
  id: number;
  label: string;
  description: string;
  condition: string;
  dateObtention?: string; // présent uniquement si débloqué
}

export interface BadgesData {
  unlocked: Badge[];
  locked: Badge[];
  total: number;
}

// ── Règles badges ─────────────────────────────────────────────
// Structure : { badgeId, missionsRequises }
// Ajoute ici de nouvelles règles sans toucher au reste du code
const BADGE_RULES: { badgeId: number; missionsRequired: number }[] = [
  { badgeId: 1, missionsRequired: 1 },   // Premiers Pas
  { badgeId: 4, missionsRequired: 10 },  // Missionnaire
  { badgeId: 10, missionsRequired: 30 }, // Marathonien
];

// ── Fonctions ─────────────────────────────────────────────────

/**
 * Récupère tous les badges et les sépare en deux listes
 * (débloqués / verrouillés) pour la vue.
 */
export async function getBadgesForUser(userId: number): Promise<BadgesData> {
  const [allBadges, userBadgesRaw] = await Promise.all([
    fetchAllBadges(),
    fetchUserBadges(userId),
  ]);

  const unlockedMap = new Map<number, string>(
    userBadgesRaw.map((ub) => {
      const badge = extractBadge(ub);
      return [badge.id_badge, ub.date_obtention];
    })
  );

  const unlocked: Badge[] = allBadges
    .filter((b) => unlockedMap.has(b.id_badge))
    .map((b) => ({
      id: b.id_badge,
      label: b.nom,
      description: b.description,
      condition: b.condition,
      dateObtention: unlockedMap.get(b.id_badge),
    }));

  const locked: Badge[] = allBadges
    .filter((b) => !unlockedMap.has(b.id_badge))
    .map((b) => ({
      id: b.id_badge,
      label: b.nom,
      description: b.description,
      condition: b.condition,
    }));

  return { unlocked, locked, total: allBadges.length };
}

/**
 * Donne un badge à un user uniquement s'il ne l'a pas déjà.
 * Retourne true si le badge vient d'être attribué, false sinon.
 */
export async function grantBadgeSafe(
  userId: number,
  badgeId: number
): Promise<boolean> {
  const already = await hasUserBadge(userId, badgeId);
  if (already) return false;
  await addUserBadge(userId, badgeId);
  return true;
}

/**
 * Vérifie toutes les règles et attribue automatiquement
 * les badges mérités. Retourne les IDs des badges nouvellement obtenus.
 */
export async function checkAndGrantBadges(userId: number): Promise<number[]> {
  const missionCount = await countUserMissions(userId);
  const newlyGranted: number[] = [];

  for (const rule of BADGE_RULES) {
    if (missionCount >= rule.missionsRequired) {
      const granted = await grantBadgeSafe(userId, rule.badgeId);
      if (granted) newlyGranted.push(rule.badgeId);
    }
  }

  return newlyGranted;
}