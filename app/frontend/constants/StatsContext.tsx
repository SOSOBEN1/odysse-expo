import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerStats {
  energie: number;
  stress: number;
  connaissance: number;
  organisation: number;
}

interface StatsContextValue {
  stats: PlayerStats;
  refreshStats: () => Promise<void>;
  loading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StatsContext = createContext<StatsContextValue>({
  stats:        { energie: 50, stress: 50, connaissance: 50, organisation: 50 },
  refreshStats: async () => {},
  loading:      true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  const [stats, setStats] = useState<PlayerStats>({
    energie: 50, stress: 50, connaissance: 50, organisation: 50,
  });
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // Lire les deux tables en parallèle:
    // - player_stats : source principale pour toutes les stats
    // - users.energie : fallback car certaines fonctions (sleepRestore, useEnergyPotion)
    //   ne mettent à jour que player_stats, mais on garde la compatibilité
    const [psResult, userResult] = await Promise.all([
      supabase
        .from("player_stats")
        .select("energie, stress, connaissance, organisation")
        .eq("id_user", userId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("energie")
        .eq("id_user", userId)
        .maybeSingle(),
    ]);

    const ps   = psResult.data;
    const user = userResult.data;

    // player_stats.energie est prioritaire (source des fonctions sleep/potion)
    // users.energie sert de fallback si player_stats n'existe pas encore
    const energieVal =
      ps?.energie   != null ? ps.energie :
      user?.energie != null ? user.energie :
      50;

    setStats({
      energie:      energieVal,
      stress:       ps?.stress       ?? 50,
      connaissance: ps?.connaissance ?? 50,
      organisation: ps?.organisation ?? 50,
    });

    setLoading(false);
  }, [userId]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  return (
    <StatsContext.Provider value={{ stats, refreshStats, loading }}>
      {children}
    </StatsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStats() {
  return useContext(StatsContext);
}
