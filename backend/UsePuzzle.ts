/**
 * usePuzzle.ts
 * Hook principal pour la logique puzzle + missions
 *
 * Usage:
 *   const { puzzle, completeMission, loading } = usePuzzle(userId, zoneSlug);
 */

import { useCallback, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PuzzleState {
  idPuzzle: number;
  totalPieces: number;
  piecesEarned: number;
  isComplete: boolean;
  completedAt: string | null;
  zoneImage: string;
  accentColor: string;
}

export interface MissionResult {
  success: boolean;
  xpGained: number;
  piecesEarned: number;
  totalPieces: number;
  puzzleComplete: boolean;
  nextZoneId: number | null;
  zoneUnlocked: boolean;
  error?: string;
}

export interface Mission {
  id: number;
  titre: string;
  description: string;
  xpGain: number;
  energieCout: number;
  difficulte: number;
  statut: "en_attente" | "en_cours" | "done" | "fail";
  done: boolean;
}

// ─── Config API ───────────────────────────────────────────────────────────────

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://your-api.com";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePuzzle(userId: number, zoneSlug: string) {
  const [puzzle, setPuzzle]     = useState<PuzzleState | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Charger l'état initial ──────────────────────────────────────────────────
  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [puzzleRes, missionsRes] = await Promise.all([
        fetch(`${API_BASE}/puzzle/${userId}/${zoneSlug}`),
        fetch(`${API_BASE}/missions/${userId}/${zoneSlug}`),
      ]);

      if (!puzzleRes.ok || !missionsRes.ok) throw new Error("Erreur serveur");

      const puzzleData   = await puzzleRes.json();
      const missionsData = await missionsRes.json();

      setPuzzle(puzzleData);
      setMissions(missionsData);
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [userId, zoneSlug]);

  useEffect(() => { loadPuzzle(); }, [loadPuzzle]);

  // ── Compléter une mission ───────────────────────────────────────────────────
  const completeMission = useCallback(
    async (missionId: number): Promise<MissionResult> => {
      // Mise à jour optimiste
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, done: true, statut: "done" } : m))
      );
      setPuzzle((prev) => {
        if (!prev) return prev;
        const next = Math.min(prev.piecesEarned + 1, prev.totalPieces);
        return {
          ...prev,
          piecesEarned: next,
          isComplete: next >= prev.totalPieces,
        };
      });

      try {
        const res = await fetch(`${API_BASE}/missions/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, missionId }),
        });

        const result: MissionResult = await res.json();

        if (!result.success) {
          // Rollback si erreur serveur
          setMissions((prev) =>
            prev.map((m) => (m.id === missionId ? { ...m, done: false, statut: "en_attente" } : m))
          );
          setPuzzle((prev) => {
            if (!prev) return prev;
            return { ...prev, piecesEarned: Math.max(0, prev.piecesEarned - 1) };
          });
        } else {
          // Sync exacte avec la BDD
          setPuzzle((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              piecesEarned: result.piecesEarned,
              isComplete:   result.puzzleComplete,
            };
          });
        }

        return result;
      } catch {
        // Rollback réseau
        setMissions((prev) =>
          prev.map((m) => (m.id === missionId ? { ...m, done: false, statut: "en_attente" } : m))
        );
        return {
          success: false,
          xpGained: 0,
          piecesEarned: puzzle?.piecesEarned ?? 0,
          totalPieces:  puzzle?.totalPieces ?? 9,
          puzzleComplete: false,
          nextZoneId: null,
          zoneUnlocked: false,
          error: "network_error",
        };
      }
    },
    [userId, puzzle]
  );

  return { puzzle, missions, loading, error, completeMission, refresh: loadPuzzle };
}