import { useCallback, useEffect, useState } from "react";
import { checkAndUnlockBadges } from "../services/badgeEngine";
import {
  Badge,
  getBadgesForUser,
} from "../models/badgeRepository";

// ── State interne ─────────────────────────────────────────────
interface BadgesState {
  unlocked: Badge[];
  locked: Badge[];
  total: number;
  newlyUnlocked: Badge[]; // badges débloqués pendant cette session → modale
}

const INITIAL_STATE: BadgesState = {
  unlocked: [],
  locked: [],
  total: 0,
  newlyUnlocked: [],
};

// ── Hook ──────────────────────────────────────────────────────
export function useBadgesViewModel(userId: number) {
  const [badges, setBadges] = useState<BadgesState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Chargement des badges ─────────────────────────────────
  const loadBadges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBadgesForUser(userId);
      setBadges((prev) => ({ ...prev, ...result, newlyUnlocked: [] }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Vérification & attribution automatique des badges ─────
  const checkBadges = useCallback(async () => {
    try {
      // checkAndUnlockBadges retourne les NOMS des badges débloqués
      const unlockedNames = await checkAndUnlockBadges(userId);
      if (unlockedNames.length > 0) {
        const result = await getBadgesForUser(userId);
        const newlyUnlocked = result.unlocked.filter((b) =>
          unlockedNames.includes(b.label)
        );
        setBadges({ ...result, newlyUnlocked });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
    }
  }, [userId]);

  // ── Ferme la modale "nouveau badge" ──────────────────────
  const clearNewlyUnlocked = useCallback(() => {
    setBadges((prev) => ({ ...prev, newlyUnlocked: [] }));
  }, []);

  // ── Chargement initial ────────────────────────────────────
  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  return {
    // ─ State ─
    unlocked: badges.unlocked,
    locked: badges.locked,
    total: badges.total,
    newlyUnlocked: badges.newlyUnlocked,
    loading,
    error,
    // ─ Actions ─
    loadBadges,
    checkBadges,
    clearNewlyUnlocked,
  };
}