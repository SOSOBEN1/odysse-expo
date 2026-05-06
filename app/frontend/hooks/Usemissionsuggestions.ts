// ─────────────────────────────────────────────────────────────
//  hooks/useMissionSuggestions.ts
//  Hook React qui charge les stats et génère des suggestions
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import {
  generateMissionSuggestions,
  type MissionSuggestion,
  type PlayerStats,
} from "../utils/MissionSuggestionEngine";

type UseMissionSuggestionsResult = {
  suggestions:  MissionSuggestion[];
  stats:        PlayerStats | null;
  isLoading:    boolean;
  error:        string | null;
  refresh:      () => void;
  /** Marque une suggestion comme complétée (la retire de la liste) */
  completeMission: (missionId: string) => void;
  /** Rejette une suggestion (ne plus la montrer dans cette session) */
  dismissMission:  (missionId: string) => void;
};

export function useMissionSuggestions(
  maxSuggestions = 5
): UseMissionSuggestionsResult {
  const { userId, isLoading: userLoading } = useUser();

  const [suggestions, setSuggestions] = useState<MissionSuggestion[]>([]);
  const [stats,       setStats]       = useState<PlayerStats | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // IDs rejetés dans la session courante
  const dismissedRef = useRef<Set<string>>(new Set());

  const loadAndGenerate = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbErr } = await supabase
        .from("player_stats")
        .select("energie, stress, connaissance, organisation")
        .eq("id_user", userId)
        .maybeSingle();

      if (dbErr) throw new Error(dbErr.message);

      const playerStats: PlayerStats = {
        energie:      data?.energie      ?? 50,
        stress:       data?.stress       ?? 50,
        connaissance: data?.connaissance ?? 50,
        organisation: data?.organisation ?? 50,
      };

      setStats(playerStats);

      const generated = generateMissionSuggestions(playerStats, maxSuggestions + dismissedRef.current.size);
const filtered  = generated.filter((m: MissionSuggestion) => !dismissedRef.current.has(m.id));
      setSuggestions(filtered.slice(0, maxSuggestions));
    } catch (err: any) {
      setError(err.message ?? "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, [userId, maxSuggestions]);

  // Chargement initial — attend que userId soit prêt
  useEffect(() => {
    if (userLoading || !userId) return;
    loadAndGenerate();
  }, [userId, userLoading, loadAndGenerate]);

  const completeMission = useCallback((missionId: string) => {
    setSuggestions((prev) => prev.filter((m) => m.id !== missionId));
  }, []);

  const dismissMission = useCallback((missionId: string) => {
    dismissedRef.current.add(missionId);
    setSuggestions((prev) => prev.filter((m) => m.id !== missionId));
  }, []);

  return {
    suggestions,
    stats,
    isLoading,
    error,
    refresh: loadAndGenerate,
    completeMission,
    dismissMission,
  };
}