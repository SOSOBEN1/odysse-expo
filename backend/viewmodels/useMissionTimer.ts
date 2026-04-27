// ============================================================
//  useMissionTimer.ts
//  Hook React Native gérant le cycle de vie du timer.
//  Utilise mission.service.ts pour toutes les ops Supabase.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  failMissionSession,
  finishMissionSession,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
} from "../models/mission.service";
import type { Mission, MissionTimer, TimerState } from "../models/mission.types";
import { formatDateLimite, isDeadlinePassed } from "../models/mission.utils";

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

export interface StatusModalState {
  visible:      boolean;
  type:         "success" | "fail";
  missionTitle: string;
  dateLimit?:   string;
}

interface UseMissionTimerOptions {
  userId: string;
  missions: Mission[];
  onStatusModal: (s: StatusModalState) => void;
}

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────

export function useMissionTimer({
  userId,
  missions,
  onStatusModal,
}: UseMissionTimerOptions) {
  const [timers, setTimers] = useState<Record<number, MissionTimer>>({});
  const intervalRefs        = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const missionsRef         = useRef<Mission[]>([]);

  // Garder une ref à jour des missions pour les callbacks du setInterval
  useEffect(() => { missionsRef.current = missions; }, [missions]);

  // ── Helpers ──────────────────────────────────────────────
  const getTimer = useCallback(
    (id: number): MissionTimer =>
      timers[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null },
    [timers]
  );

  const setTimer = useCallback(
    (id: number, update: Partial<MissionTimer>) =>
      setTimers(prev => ({
        ...prev,
        [id]: { ...(prev[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null }), ...update },
      })),
    []
  );

  // ── Init timers depuis fetchMissions ─────────────────────
  const initTimers = useCallback((initialTimers: Record<number, MissionTimer>) => {
    setTimers(prev => {
      const merged = { ...initialTimers };
      // Conserver les timers actifs déjà en cours
      Object.entries(prev).forEach(([id, t]) => {
        if (t.state === "running" || t.state === "paused") {
          merged[Number(id)] = t;
        }
      });
      return merged;
    });
  }, []);

  // ── Finish (succès) ───────────────────────────────────────
  const handleFinish = useCallback(async (missionId: number) => {
    const t = timers[missionId] ?? { elapsed: 0, validationId: null };
    clearInterval(intervalRefs.current[missionId]);

    try {
      await finishMissionSession(missionId, t.validationId, t.elapsed);
    } catch (err: any) {
      console.error("❌ finishMission:", err.message);
      return;
    }

    setTimer(missionId, { state: "done" });

    const mission = missionsRef.current.find(m => m.id === missionId);
    onStatusModal({ visible: true, type: "success", missionTitle: mission?.title ?? "" });
  }, [timers, setTimer, onStatusModal]);

  // ── Start / Resume ────────────────────────────────────────
  const handleStart = useCallback(async (missionId: number) => {
    const t = getTimer(missionId);

    try {
      if (t.state === "idle") {
        const validationId = await startMissionSession(userId, missionId);
        setTimer(missionId, { state: "running", elapsed: 0, validationId, startedAt: new Date() });
      } else {
        await resumeMissionSession(missionId);
        setTimer(missionId, { state: "running" });
      }
    } catch (err: any) {
      console.error("❌ startMission:", err.message);
      return;
    }

    if (intervalRefs.current[missionId]) clearInterval(intervalRefs.current[missionId]);

    intervalRefs.current[missionId] = setInterval(() => {
      setTimers(prev => {
        const cur = prev[missionId];
        if (!cur || cur.state !== "running") return prev;

        const newElapsed  = cur.elapsed + 1;
        const mission     = missionsRef.current.find(m => m.id === missionId);

        // Durée estimée atteinte → terminer automatiquement
        const parseDurationToMinutes = (d: string) => {
          const match = d?.match(/(\d+)h(\d*)/);
          if (!match) return 30;
          return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
        };
        const estimatedSec = (parseDurationToMinutes(mission?.duration ?? "0h30")) * 60;

        if (newElapsed >= estimatedSec) {
          clearInterval(intervalRefs.current[missionId]);
          setTimeout(() => handleFinish(missionId), 0);
        }

        return { ...prev, [missionId]: { ...cur, elapsed: newElapsed } };
      });
    }, 1000);
  }, [getTimer, userId, setTimer, handleFinish]);

  // ── Pause ─────────────────────────────────────────────────
  const handlePause = useCallback(async (missionId: number) => {
    clearInterval(intervalRefs.current[missionId]);
    await pauseMissionSession(missionId);
    setTimer(missionId, { state: "paused" });
  }, [setTimer]);

  // ── Vérification deadline (toutes les 60s) ────────────────
  useEffect(() => {
    const deadlineInterval = setInterval(() => {
      setTimers(prev => {
        const now     = Date.now();
        const updated = { ...prev };
        let changed   = false;

        missionsRef.current.forEach(mission => {
          if (!mission.dateLimite) return;
          const t = prev[mission.id];
          if (
            mission.dateLimite.getTime() < now &&
            (!t || (t.state !== "done" && t.state !== "fail"))
          ) {
            if (intervalRefs.current[mission.id]) clearInterval(intervalRefs.current[mission.id]);
            updated[mission.id] = {
              ...(t ?? { elapsed: 0, validationId: null, startedAt: null }),
              state: "fail",
            };
            changed = true;
            failMissionSession(mission.id);
            onStatusModal({
              visible:      true,
              type:         "fail",
              missionTitle: mission.title,
              dateLimit:    formatDateLimite(mission.dateLimite),
            });
          }
        });

        return changed ? updated : prev;
      });
    }, 60_000);

    return () => clearInterval(deadlineInterval);
  }, [onStatusModal]);

  // ── Cleanup à l'unmount ────────────────────────────────────
  useEffect(() => {
    return () => { Object.values(intervalRefs.current).forEach(clearInterval); };
  }, []);

  return {
    timers,
    getTimer,
    setTimer,
    initTimers,
    handleStart,
    handlePause,
    handleFinish,
  };
}