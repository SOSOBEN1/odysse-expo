import { supabase } from "../../app/frontend/constants/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserEconomy {
  coins: number;   // mapped from gold column
  xp: number;
  level: number;
  xpInLevel: number;  // XP inside the current level (after modulo)
  maxXp: number;      // XP required to finish current level
  xpPercent: number;  // 0–100 for progress bar
}

// ─── Formulas ─────────────────────────────────────────────────────────────────

/**
 * Returns the XP threshold for a given level.
 *   maxXp = level × 500
 */
export function getMaxXp(level: number): number {
  return Math.max(1, level) * 500;
}

/**
 * Extracts XP earned inside the current level.
 *
 *   Formula: xpInLevel = xpTotal % (level × 500)
 *
 * Example: xpTotal = 1200, level = 2
 *   maxXp     = 2 × 500 = 1000
 *   xpInLevel = 1200 % 1000 = 200   →   progress = 200/1000 = 20 %
 */
export function computeXpInLevel(xpTotal: number, level: number): number {
  const maxXp = getMaxXp(level);
  return xpTotal % maxXp;
}

/**
 * Returns a 0–100 percentage for the XP progress bar.
 */
export function computeXpPercent(xpTotal: number, level: number): number {
  const maxXp    = getMaxXp(level);
  const xpInLevel = computeXpInLevel(xpTotal, level);
  return Math.round((xpInLevel / maxXp) * 100);
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

/**
 * Fetches coins (gold) and XP for a given user from the `users` table.
 *
 * Column mapping:
 *   DB column  →  returned field
 *   gold       →  coins
 *   xp         →  xp
 *   id_level   →  level
 *
 * @param userId  The user's primary key (id_user)
 * @returns       UserEconomy object, or null on error / user not found
 */
export async function fetchUserEconomy(userId: string | number): Promise<UserEconomy | null> {
  const { data, error } = await supabase
    .from("users")
    .select("gold, xp, id_level")
    .eq("id_user", userId)
    .single();

  if (error || !data) {
    console.error("[userStatsService] fetchUserEconomy error:", error?.message);
    return null;
  }

  const level      = data.id_level ?? 1;
  const xp         = data.xp      ?? 0;
  const maxXp      = getMaxXp(level);
  const xpInLevel  = computeXpInLevel(xp, level);
  const xpPercent  = computeXpPercent(xp, level);

  return {
    coins:      data.gold ?? 0,
    xp,
    level,
    xpInLevel,
    maxXp,
    xpPercent,
  };
}

// ─── React Hook ───────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

/**
 * Hook — fetches and returns UserEconomy for the given userId.
 * Re-fetches automatically when userId changes.
 *
 * Usage:
 *   const { coins, xp, xpPercent, level } = useUserEconomy(userId);
 */
export function useUserEconomy(userId: string | number | undefined) {
  const [economy, setEconomy] = useState<UserEconomy>({
    coins: 0,
    xp: 0,
    level: 1,
    xpInLevel: 0,
    maxXp: 500,
    xpPercent: 0,
  });

  useEffect(() => {
    if (!userId) return;
    fetchUserEconomy(userId).then((data) => {
      if (data) setEconomy(data);
    });
  }, [userId]);

  return economy;
}