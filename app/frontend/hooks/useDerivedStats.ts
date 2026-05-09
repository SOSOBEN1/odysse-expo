// ─────────────────────────────────────────────────────────────
//  hooks/useDerivedStats.ts
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import {
  computeAllDerivedStats,
  computeSimpleDerivedStats,
  type BaseStats,
  type DerivedStats,
  type MissionRatio,
} from "../utils/computeDerivedStats";

const PAUSE_KEYWORDS = ["pause", "repos", "bien-être", "bienetre", "relaxation", "détente", "relax"];

function isPauseMission(titre: string, description: string): boolean {
  const text = (titre + " " + description).toLowerCase();
  return PAUSE_KEYWORDS.some((k) => text.includes(k));
}

export function useDerivedStats(): {
  derived: DerivedStats;
  base:    BaseStats;
  loading: boolean;
} {
  const { userId } = useUser();

  const [base, setBase] = useState<BaseStats>({
    energie: 50, stress: 50, connaissance: 50, organisation: 50,
  });
  const [derived, setDerived] = useState<DerivedStats>({
    concentration: 50, serenite: 50, discipline: 50,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);

      // ── 1. Fetch stats brutes depuis player_stats ──────────────
      const { data: statsData, error: statsError } = await supabase
        .from("player_stats")
        .select("energie, stress, connaissance, organisation")
        .eq("id_user", userId)
        .maybeSingle();

      if (statsError) {
        console.error("[useDerivedStats] Erreur player_stats:", statsError.message);
      }

      // baseStats local — utilisé partout dans ce useEffect
      const baseStats: BaseStats = {
        energie:      statsData?.energie      ?? 50,
        stress:       statsData?.stress       ?? 50,
        connaissance: statsData?.connaissance ?? 50,
        organisation: statsData?.organisation ?? 50,
      };
      setBase(baseStats);

      // ── 2. Fetch missions du jour ──────────────────────────────
      try {
        const today = new Date();
        const start = new Date(
          today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0
        ).toISOString();
        const end = new Date(
          today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59
        ).toISOString();

        const { data: validations, error: valError } = await supabase
          .from("mission_validation")
          .select(`statut, mission ( titre, description, connaissance_gain )`)
          .eq("id_user", userId)
          .gte("date_debut", start)
          .lte("date_debut", end);

        if (valError) {
          console.error("[useDerivedStats] Erreur mission_validation:", valError.message);
          // Fallback sur baseStats local (pas le state)
          setDerived(computeSimpleDerivedStats(baseStats));
          return;
        }

        const rows = validations ?? [];

        const ratio: MissionRatio = {
          total:  rows.length,
          done:   rows.filter((r: any) => r.statut === "done").length,
          missed: rows.filter((r: any) => r.statut === "fail").length,
        };

        const hasCompletedPause = rows.some((r: any) => {
          if (r.statut !== "done") return false;
          const m = r.mission;
          return m && isPauseMission(m.titre ?? "", m.description ?? "");
        });

        const connaissanceGainTotal = rows
          .filter((r: any) => r.statut === "done")
          .reduce((sum: number, r: any) => sum + (r.mission?.connaissance_gain ?? 0), 0);

        const computed = computeAllDerivedStats(
          baseStats,
          ratio,
          hasCompletedPause,
          connaissanceGainTotal
        );

        setDerived(computed);

      } catch (e) {
        console.error("[useDerivedStats] Exception:", e);
        // ✅ Fix : utilise baseStats local et non le state `base`
        setDerived(computeSimpleDerivedStats(baseStats));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { derived, base, loading };
}