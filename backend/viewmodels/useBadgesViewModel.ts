import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  checkAndGrantBadges,
  getBadgesForUser,
} from "../../app/frontend/repositories/badgeRepository";

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
      const newIds = await checkAndGrantBadges(userId);
      if (newIds.length > 0) {
        // Rechargement pour avoir les dates d'obtention à jour
        const result = await getBadgesForUser(userId);
        const newlyUnlocked = result.unlocked.filter((b) =>
          newIds.includes(b.id)
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