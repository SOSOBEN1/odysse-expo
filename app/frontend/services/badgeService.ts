import { supabase } from "../constants/supabase";

// ── Types ─────────────────────────────────────────────────────
export interface BadgeRow {
  id_badge: number;
  nom: string;
  description: string;
  condition: string;
}

// Supabase retourne badges comme un tableau sur les joins
export interface UserBadgeRow {
  date_obtention: string;
  badges: BadgeRow | BadgeRow[];
}

// Helper : extrait toujours un BadgeRow unique
export function extractBadge(ub: UserBadgeRow): BadgeRow {
  return Array.isArray(ub.badges) ? ub.badges[0] : ub.badges;
}

// ── Fonctions ─────────────────────────────────────────────────

/** Récupère tous les badges existants dans la BDD */
export async function fetchAllBadges(): Promise<BadgeRow[]> {
  const { data, error } = await supabase
    .from("badges")
    .select("*");
  if (error) throw new Error(error.message);
  return data as BadgeRow[];
}

/** Récupère les badges débloqués d'un user avec les infos du badge */
export async function fetchUserBadges(userId: number): Promise<UserBadgeRow[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select(`
      date_obtention,
      badges (
        id_badge,
        nom,
        description,
        condition
      )
    `)
    .eq("id_user", userId);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as UserBadgeRow[];
}

/** Vérifie si un user possède déjà un badge spécifique */
export async function hasUserBadge(
  userId: number,
  badgeId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("id_user")
    .eq("id_user", userId)
    .eq("id_badge", badgeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

/** Attribue un badge à un user */
export async function addUserBadge(
  userId: number,
  badgeId: number
): Promise<void> {
  const { error } = await supabase
    .from("user_badges")
    .insert({ id_user: userId, id_badge: badgeId });
  if (error) throw new Error(error.message);
}

/** Compte le nombre de missions validées par un user */
export async function countUserMissions(userId: number): Promise<number> {
  const { count, error } = await supabase
    .from("mission_validation")
    .select("*", { count: "exact", head: true })
    .eq("id_user", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}