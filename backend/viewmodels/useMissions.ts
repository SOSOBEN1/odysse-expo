import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchMissions,
  finishMissionSession,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
  deleteMission,
} from "../models/mission.service";
import type { Mission, MissionTimer } from "../models/mission.types";

interface StatusModal {
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string | undefined;
  dateLimit: string | undefined;
  xp: number;
  coins: number;
}

interface ExitModal {
  visible: boolean;
  pendingAction: (() => void) | null;
}

export function useMissions(userId: string | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [timers, setTimers]     = useState<Record<number, MissionTimer>>({});
  const [loading, setLoading]   = useState(true);

  const [statusModal, setStatusModal] = useState<StatusModal>({
    visible: false,
    type: "success",
    missionTitle: undefined,
    dateLimit: undefined,
    xp: 0,
    coins: 0,
  });

  const [exitModal, setExitModal] = useState<ExitModal>({
    visible: false,
    pendingAction: null,
  });

  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const missionsRef     = useRef<Mission[]>([]);
  const handleFinishRef = useRef<(id: number) => Promise<void>>(async () => {});

  // ─────────────────────────────────────────────────────────
  //  Chargement
  // ─────────────────────────────────────────────────────────

  const loadMissions = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { missions: fetchedMissions, timers: fetchedTimers } =
        await fetchMissions(userId);
      setMissions(fetchedMissions);
      setTimers(fetchedTimers);
    } catch (err) {
      console.error("❌ loadMissions error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  useEffect(() => { missionsRef.current = missions; }, [missions]);

  // ─────────────────────────────────────────────────────────
  //  Ticker global + auto-finish
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let changed = false;

        Object.entries(updated).forEach(([id, timer]) => {
          if (timer.state !== "running") return;

          const missionId  = Number(id);
          const newElapsed = timer.elapsed + 1;
          updated[missionId] = { ...timer, elapsed: newElapsed };
          changed = true;

          const mission = missionsRef.current.find((m) => m.id === missionId);
          if (mission) {
            const match = mission.duration?.match(/(\d+)h(\d*)/);
            if (match) {
              const totalSeconds =
                (parseInt(match[1]) || 0) * 3600 +
                (parseInt(match[2]) || 0) * 60;
              // ✅ Guard : déclencher UNE SEULE FOIS quand on atteint exactement le temps
              if (totalSeconds > 0 && newElapsed === totalSeconds) {
                setTimeout(() => handleFinishRef.current(missionId), 0);
              }
            }
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Accesseur timer
  // ─────────────────────────────────────────────────────────

  const getTimer = useCallback(
    (missionId: number): MissionTimer =>
      timers[missionId] ?? {
        state: "idle",
        elapsed: 0,
        validationId: null,
        startedAt: null,
      },
    [timers]
  );

  // ─────────────────────────────────────────────────────────
  //  Démarrer / Reprendre
  // ─────────────────────────────────────────────────────────

  const handleStart = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timers[missionId];
      try {
        if (timer?.state === "paused" && timer.validationId) {
          await resumeMissionSession(timer.validationId);
          setTimers((prev) => ({
            ...prev,
            [missionId]: { ...prev[missionId], state: "running" },
          }));
        } else {
          const validationId = await startMissionSession(userId, missionId);
          setTimers((prev) => ({
            ...prev,
            [missionId]: {
              state: "running",
              elapsed: 0,
              validationId,
              startedAt: new Date(),
            },
          }));
        }
      } catch (err) {
        console.error("❌ handleStart error:", err);
      }
    },
    [userId, timers]
  );

  // ─────────────────────────────────────────────────────────
  //  Pause
  // ─────────────────────────────────────────────────────────

  const handlePause = useCallback(
    async (missionId: number) => {
      const timer = timers[missionId];
      if (!timer?.validationId) return;
      try {
        await pauseMissionSession(timer.validationId);
        setTimers((prev) => ({
          ...prev,
          [missionId]: { ...prev[missionId], state: "paused" },
        }));
      } catch (err) {
        console.error("❌ handlePause error:", err);
      }
    },
    [timers]
  );

  // ─────────────────────────────────────────────────────────
  //  Terminer
  // ─────────────────────────────────────────────────────────

  const handleFinish = useCallback(
    async (missionId: number) => {
      const timer = timers[missionId];
      if (!timer || !userId) return;
      // ✅ Double guard : ne jamais appeler deux fois pour la même mission
      if (timer.state === "done" || timer.state === "fail") return;
      try {
        const { xp, coins } = await finishMissionSession(
          missionId,
          timer.validationId,
          timer.elapsed,
          userId
        );
        setTimers((prev) => ({
          ...prev,
          [missionId]: { ...prev[missionId], state: "done" },
        }));
        const mission = missions.find((m) => m.id === missionId);
        setStatusModal({
          visible: true,
          type: "success",
          missionTitle: mission?.title,
          dateLimit: mission?.dateLimite?.toLocaleDateString("fr-FR") ?? undefined,
          xp,
          coins,
        });
      } catch (err) {
        console.error("❌ handleFinish error:", err);
      }
    },
    [timers, missions, userId]
  );

  useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);

  // ─────────────────────────────────────────────────────────
  //  Supprimer
  // ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (missionId: number) => {
    try {
      await deleteMission(missionId);
      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      setTimers((prev) => {
        const copy = { ...prev };
        delete copy[missionId];
        return copy;
      });
    } catch (err) {
      console.error("❌ handleDelete error:", err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Status modal
  // ─────────────────────────────────────────────────────────

  const closeStatusModal = useCallback(() => {
    setStatusModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Exit modal
  // ─────────────────────────────────────────────────────────

  const hasRunningMission = useCallback(() => {
    return Object.values(timers).some((t) => t.state === "running");
  }, [timers]);

  const pauseAllRunning = useCallback(async () => {
    const runningIds = Object.entries(timers)
      .filter(([, t]) => t.state === "running")
      .map(([id]) => Number(id));
    for (const id of runningIds) {
      await handlePause(id);
    }
  }, [timers, handlePause]);

  const requestExit = useCallback((onConfirm: () => void) => {
    if (!hasRunningMission()) {
      onConfirm();
      return;
    }
    setExitModal({ visible: true, pendingAction: onConfirm });
  }, [hasRunningMission]);

  const handlePauseAndLeave = useCallback(async () => {
    await pauseAllRunning();
    setExitModal((prev) => {
      prev.pendingAction?.();
      return { visible: false, pendingAction: null };
    });
  }, [pauseAllRunning]);

  const handleLeaveRunning = useCallback(() => {
    setExitModal((prev) => {
      prev.pendingAction?.();
      return { visible: false, pendingAction: null };
    });
  }, []);

  const handleCancelExit = useCallback(() => {
    setExitModal({ visible: false, pendingAction: null });
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Edit payload
  // ─────────────────────────────────────────────────────────

  const buildEditPayload = useCallback((mission: Mission) => ({
     id_mission:  mission.id, 
    titre:       mission.title,
    description: mission.description,
    duration:    mission.duration,
    difficulty:  mission.difficulty,
    urgent:      mission.urgent,
    dateLimite:  mission.dateLimite,
    event:       mission.event,
  }), []);

  // ─────────────────────────────────────────────────────────
  //  Return
  // ─────────────────────────────────────────────────────────

  return {
    missions,
    loading,
    statusModal,
    exitModal,
    getTimer,
    handleStart,
    handlePause,
    handleFinish,
    handleDelete,
    buildEditPayload,
    loadMissions,
    closeStatusModal,
    requestExit,
    handlePauseAndLeave,
    handleLeaveRunning,
    handleCancelExit,
  };
}