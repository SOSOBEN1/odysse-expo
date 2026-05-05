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
    const { data, error } = await supabase
      .from("player_stats")
      .select("energie, stress, connaissance, organisation")
      .eq("id_user", userId)
      .maybeSingle();

    if (!error && data) {
      setStats({
        energie:      data.energie      ?? 50,
        stress:       data.stress       ?? 50,
        connaissance: data.connaissance ?? 50,
        organisation: data.organisation ?? 50,
      });
    }
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
