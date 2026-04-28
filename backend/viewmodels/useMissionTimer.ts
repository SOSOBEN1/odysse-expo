// ============================================================
//  useMissionTimer.ts
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
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string;
  dateLimit?: string;
  xp?: number;    // ✅ XP gagné
  coins?: number;    // ✅ Coins gagnés
}
export interface StatusModalState {
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string;
  dateLimit?: string;
  xp?: number;
  coins?: number;
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
  const intervalRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const missionsRef = useRef<Mission[]>([]);

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
      Object.entries(prev).forEach(([id, t]) => {
        if (t.state === "running" || t.state === "paused") {
          merged[Number(id)] = t;
        }
      });
      return merged;
    });
  }, []);

  // ── Finish (succès) ✅ récupère xp + coins depuis le service
 // ✅ Après — lire le timer frais depuis le state via setTimers
const handleFinish = useCallback(async (missionId: number) => {
  clearInterval(intervalRefs.current[missionId]);

  // Lire la valeur fraîche du timer AVANT l'appel async
  let currentElapsed = 0;
  let currentValidationId: number | null = null;

  setTimers(prev => {
    currentElapsed = prev[missionId]?.elapsed ?? 0;
    currentValidationId = prev[missionId]?.validationId ?? null;
    return prev; // pas de mutation
  });

  let xp = 0;
  let coins = 0;

  try {
    const result = await finishMissionSession(
      missionId,
      currentValidationId,
      currentElapsed,   // ✅ valeur fraîche
      userId
    );
    xp = result.xp;
    coins = result.coins;
  } catch (err: any) {
    console.error("❌ finishMission:", err.message);
    return;
  }

  setTimer(missionId, { state: "done" });

  const mission = missionsRef.current.find(m => m.id === missionId);
  onStatusModal({
    visible: true,
    type: "success",
    missionTitle: mission?.title ?? "",
    xp,
    coins,
  });
}, [userId, setTimer, onStatusModal]); // ← timers retiré des deps
  // ── Start / Resume ────────────────────────────────────────
  const handleStart = useCallback(async (missionId: number) => {
    const t = getTimer(missionId);

    try {
      if (t.state === "idle") {
        const validationId = await startMissionSession(userId, missionId);
        setTimer(missionId, { state: "running", elapsed: 0, validationId, startedAt: new Date() });
      } else {
        if (t.validationId) {
          await resumeMissionSession(t.validationId);  // ← validationId, pas missionId
        }
        setTimer(missionId, { state: "running" });
        //await resumeMissionSession(missionId);
        //setTimer(missionId, { state: "running" });
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

        const newElapsed = cur.elapsed + 1;
        const mission = missionsRef.current.find(m => m.id === missionId);

        const parseDurationToMinutes = (d: string) => {
          const match = d?.match(/(\d+)h(\d*)/);
          if (!match) return 30;
          return (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
        };
        const estimatedSec = parseDurationToMinutes(mission?.duration ?? "0h30") * 60;

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
    const t = getTimer(missionId);
    // ← utilise validationId, pas missionId
    if (t.validationId) {
      await pauseMissionSession(t.validationId);
    }
    setTimer(missionId, { state: "paused" });
  }, [getTimer, setTimer]);

  // ── Vérification deadline (toutes les 60s) ────────────────
  useEffect(() => {
    const deadlineInterval = setInterval(() => {
      setTimers(prev => {
        const now = Date.now();
        const updated = { ...prev };
        let changed = false;

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
              visible: true,
              type: "fail",
              missionTitle: mission.title,
              dateLimit: formatDateLimite(mission.dateLimite),
            });
          }
        });

        return changed ? updated : prev;
      });
    }, 60_000);

    return () => clearInterval(deadlineInterval);
  }, [onStatusModal]);

  // ── Cleanup ────────────────────────────────────────────────
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