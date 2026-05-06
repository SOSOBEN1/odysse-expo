// ─────────────────────────────────────────────────────────────
//  hooks/useDerivedStats.ts
//  Calcule les stats dérivées en combinant :
//    - les stats brutes (player_stats)
//    - les missions du jour (mission_validation)
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

// Mots-clés pour détecter une mission "pause/détente"
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
    concentration: 50,
    serenite:      50,
    discipline:    50,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        // ── 1. Fetch stats brutes ──────────────────────────────
        const { data: statsData } = await supabase
          .from("player_stats")
          .select("energie, stress, connaissance, organisation")
          .eq("id_user", userId)
          .maybeSingle();

        const baseStats: BaseStats = {
          energie:      statsData?.energie      ?? 50,
          stress:       statsData?.stress       ?? 50,
          connaissance: statsData?.connaissance ?? 50,
          organisation: statsData?.organisation ?? 50,
        };
        setBase(baseStats);

        // ── 2. Fetch missions du jour ──────────────────────────
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
        const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        const { data: validations } = await supabase
          .from("mission_validation")
          .select(`
            statut,
            mission (
              titre,
              description,
              connaissance_gain
            )
          `)
          .eq("id_user", userId)
          .gte("date_debut", start)
          .lte("date_debut", end);

        const rows = validations ?? [];

        // ── 3. Calcul du ratio missions ────────────────────────
        const ratio: MissionRatio = {
          total:  rows.length,
          done:   rows.filter((r: any) => r.statut === "done").length,
          missed: rows.filter((r: any) => r.statut === "fail").length,
        };

        // ── 4. Détection mission pause complétée ───────────────
        const hasCompletedPause = rows.some((r: any) => {
          if (r.statut !== "done") return false;
          const m = r.mission;
          return m && isPauseMission(m.titre ?? "", m.description ?? "");
        });

        // ── 5. Somme des gains connaissance (missions "done") ──
        const connaissanceGainTotal = rows
          .filter((r: any) => r.statut === "done")
          .reduce((sum: number, r: any) => sum + (r.mission?.connaissance_gain ?? 0), 0);

        // ── 6. Calcul des stats dérivées ───────────────────────
        const computed = computeAllDerivedStats(
          baseStats,
          ratio,
          hasCompletedPause,
          connaissanceGainTotal
        );

        setDerived(computed);
      } catch (e) {
        console.error("[useDerivedStats]", e);
        // Fallback : formule simple
        setDerived(computeSimpleDerivedStats(base));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { derived, base, loading };
}