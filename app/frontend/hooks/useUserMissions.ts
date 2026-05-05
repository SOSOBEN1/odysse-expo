import { useCallback, useEffect, useState } from "react";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MissionStatus = "continue" | "start" | "completed" | "suggested";

export interface UserMission {
  id: string;               // id_validation (PK de mission_validation)
  id_mission: number;
  title: string;
  subtitle: string;
  status: MissionStatus;
  emoji: string;
  difficulte: number;
  priorite: number;
  energie_cout: number;
  stress_gain: number | null;
  connaissance_gain: number;
  organisation_gain: number;
  xp_gain: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickEmoji(titre: string, difficulte: number): string {
  const t = titre.toLowerCase();
  if (t.includes("révis") || t.includes("cours"))  return "📚";
  if (t.includes("pause") || t.includes("repos"))   return "🌿";
  if (t.includes("plan")  || t.includes("agenda"))  return "📅";
  if (t.includes("devoir") || t.includes("tp"))     return "📝";
  if (t.includes("sport") || t.includes("courir"))  return "🏃";
  if (difficulte === 3) return "🔥";
  if (difficulte === 2) return "📦";
  return "⭐";
}

// Convertit le statut DB → statut UI
function toUiStatus(statut: string): MissionStatus {
  if (statut === "done")                            return "completed";
  if (statut === "running" || statut === "paused")  return "continue";
  return "start"; // idle, fail → à démarrer
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Charge les missions de l'utilisateur depuis mission_validation + mission.
 *
 * Statuts dans mission_validation.statut :
 *   'idle'    → pas encore commencée  → bouton "Démarrer"
 *   'running' → en cours              → bouton "Continuer"
 *   'paused'  → en pause              → bouton "Continuer"
 *   'done'    → terminée              → chip "✓ Fait"
 *   'fail'    → échouée               → bouton "Démarrer" (réessayer)
 */
export function useUserMissions() {
  const { userId } = useUser();
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("mission_validation")
        .select(`
          id_validation,
          statut,
          xp_obtenu,
          date_debut,
          date_fin,
          mission (
            id_mission,
            titre,
            description,
            difficulte,
            priorite,
            energie_cout,
            stress_gain,
            connaissance_gain,
            organisation_gain,
            xp_gain
          )
        `)
        .eq("id_user", userId)
        .order("id_validation", { ascending: true });

      if (fetchError) throw fetchError;
      if (!data) { setMissions([]); return; }

      const mapped: UserMission[] = data
        .filter((row: any) => row.mission)
        .map((row: any) => {
          const m = row.mission;
          return {
            id:                String(row.id_validation),
            id_mission:        m.id_mission,
            title:             m.titre,
            subtitle:          m.description,
            status:            toUiStatus(row.statut ?? "idle"),
            emoji:             pickEmoji(m.titre, m.difficulte),
            difficulte:        m.difficulte        ?? 1,
            priorite:          m.priorite          ?? 2,
            energie_cout:      m.energie_cout      ?? 8,
            stress_gain:       m.stress_gain       ?? null,
            connaissance_gain: m.connaissance_gain ?? 0,
            organisation_gain: m.organisation_gain ?? 0,
            xp_gain:           m.xp_gain           ?? 10,
          };
        });

      // Tri : en cours → à démarrer → suggérées → terminées
      const order: Record<MissionStatus, number> = {
        continue: 0, start: 1, suggested: 2, completed: 3,
      };
      mapped.sort((a, b) => order[a.status] - order[b.status]);

      setMissions(mapped);
    } catch (e: any) {
      console.error("[useUserMissions]", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  return { missions, loading, error, refreshMissions: fetchMissions };
}