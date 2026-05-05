// ─────────────────────────────────────────────────────────────
//  hooks/useTodayMissions.ts
//  Fetch les missions du jour depuis mission_validation
//  où date_debut = aujourd'hui et id_user = user connecté
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

export interface TodayMission {
  id_validation: number;       // PK de mission_validation
  id_mission:    number;
  title:         string;
  subtitle:      string;
  emoji:         string;
  status:        "continue" | "start" | "done" | "fail";
  xp_gain:       number;
  statut:        string;       // raw statut depuis DB
}

// ─── Helpers ─────────────────────────────────────────────────

function getEmoji(titre: string): string {
  const t = titre.toLowerCase();
  if (t.includes("sport") || t.includes("exercice")) return "🏋️";
  if (t.includes("révision") || t.includes("etude"))  return "📚";
  if (t.includes("repos") || t.includes("pause"))     return "😴";
  if (t.includes("plan") || t.includes("organis"))    return "🗂️";
  if (t.includes("stress") || t.includes("relax"))    return "🌿";
  return "📦";
}

function mapStatut(statut: string): TodayMission["status"] {
  if (statut === "done")       return "done";
  if (statut === "fail")       return "fail";
  if (statut === "in_progress") return "continue";
  return "start";
}

// ─── Hook ────────────────────────────────────────────────────

export function useTodayMissions() {
  const { userId } = useUser();

  const [missions, setMissions] = useState<TodayMission[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Plage du jour : 00:00:00 → 23:59:59
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
      const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      // Jointure mission_validation ↔ mission
      const { data, error: dbError } = await supabase
        .from("mission_validation")
        .select(`
          id_validation,
          id_mission,
          statut,
          xp_obtenu,
          mission (
            titre,
            description,
            xp_gain
          )
        `)
        .eq("id_user", userId)
        .gte("date_debut", start)
        .lte("date_debut", end)
        .order("id_validation", { ascending: true });

      if (dbError) {
        setError(dbError.message);
        return;
      }

      const mapped: TodayMission[] = (data ?? []).map((row: any) => {
        const m = row.mission;
        return {
          id_validation: row.id_validation,
          id_mission:    row.id_mission,
          title:         m?.titre       ?? "Mission",
          subtitle:      m?.description ?? "",
          emoji:         getEmoji(m?.titre ?? ""),
          status:        mapStatut(row.statut),
          xp_gain:       row.xp_obtenu ?? m?.xp_gain ?? 0,
          statut:        row.statut,
        };
      });

      setMissions(mapped);
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { missions, loading, error, refresh: load };
}