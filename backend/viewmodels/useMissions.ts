// NOTE: install @react-native-async-storage/async-storage si pas déjà fait
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteMission,
  fetchMissions,
  finishMissionSession,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
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

// ─── Clé AsyncStorage par mission ─────────────────────────────────────────────
const timerKey = (userId: string, missionId: number) =>
  `mission_timer:${userId}:${missionId}`;

// ─── Sauvegarder / charger un timer ───────────────────────────────────────────
async function saveTimerToStorage(userId: string, missionId: number, timer: MissionTimer) {
  try {
    await AsyncStorage.setItem(timerKey(userId, missionId), JSON.stringify({
      ...timer,
      startedAt: timer.startedAt instanceof Date
        ? timer.startedAt.toISOString()
        : timer.startedAt ?? null,
    }));
  } catch {}
}

async function loadTimerFromStorage(userId: string, missionId: number, durationStr: string | undefined): Promise<MissionTimer | null> {
  try {
    const raw = await AsyncStorage.getItem(timerKey(userId, missionId));
    if (!raw) return null;

    const saved = JSON.parse(raw) as any;

    // Recalculer elapsed si le timer était en cours quand on a quitté
    if (saved.state === "running" && saved.startedAt) {
      const startedAt = new Date(saved.startedAt);
      const now = new Date();
      const passedSecs = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const newElapsed = (saved.elapsed ?? 0) + passedSecs;

      // Vérifier si la mission a expiré
      const totalSeconds = parseDurationToSeconds(durationStr);
      if (totalSeconds > 0 && newElapsed >= totalSeconds) {
        // Mission échouée pendant l'absence
        const failed: MissionTimer = {
          state: "fail",
          elapsed: totalSeconds,
          validationId: saved.validationId ?? null,
          startedAt: null,
        };
        await AsyncStorage.setItem(timerKey(userId, missionId), JSON.stringify(failed));
        return failed;
      }

      // Timer toujours en cours : reprendre avec elapsed recalculé
      return {
        state: "running",
        elapsed: newElapsed,
        validationId: saved.validationId ?? null,
        startedAt: new Date(), // nouveau startedAt = maintenant
      };
    }

    return {
      state: saved.state ?? "idle",
      elapsed: saved.elapsed ?? 0,
      validationId: saved.validationId ?? null,
      startedAt: saved.startedAt ? new Date(saved.startedAt) : null,
    };
  } catch {
    return null;
  }
}

async function clearTimerFromStorage(userId: string, missionId: number) {
  try {
    await AsyncStorage.removeItem(timerKey(userId, missionId));
  } catch {}
}

function parseDurationToSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/(\d+)h(\d*)/);
  if (match) {
    return (parseInt(match[1]) || 0) * 3600 + (parseInt(match[2]) || 0) * 60;
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  //  Chargement (avec restauration des timers depuis AsyncStorage)
  // ─────────────────────────────────────────────────────────

  const loadMissions = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { missions: fetchedMissions, timers: fetchedTimers } =
        await fetchMissions(userId);

      // Pour chaque mission, essayer de restaurer un timer persisté
      const restoredTimers: Record<number, MissionTimer> = {};
      for (const mission of fetchedMissions) {
        const stored = await loadTimerFromStorage(userId, mission.id, mission.duration);
        if (stored && stored.state !== "idle") {
          restoredTimers[mission.id] = stored;
        } else {
          // Utiliser le timer venant du backend (peut être "idle" ou autre)
          restoredTimers[mission.id] = fetchedTimers[mission.id] ?? {
            state: "idle",
            elapsed: 0,
            validationId: null,
            startedAt: null,
          };
        }
      }

      setMissions(fetchedMissions);
      setTimers(restoredTimers);
    } catch (err) {
      console.error("❌ loadMissions error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadMissions(); }, [loadMissions]);
  useEffect(() => { missionsRef.current = missions; }, [missions]);

  // ─────────────────────────────────────────────────────────
  //  Ticker global + auto-finish (inchangé)
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

          // Persistance du elapsed à chaque tick
          if (userId) {
            saveTimerToStorage(userId, missionId, updated[missionId]).catch(() => {});
          }

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
  }, [userId]);

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
          const updated: MissionTimer = {
            ...timer,
            state: "running",
            startedAt: new Date(),
          };
          setTimers((prev) => ({ ...prev, [missionId]: updated }));
          await saveTimerToStorage(userId, missionId, updated);
        } else {
          const validationId = await startMissionSession(userId, missionId);
          const newTimer: MissionTimer = {
            state: "running",
            elapsed: 0,
            validationId,
            startedAt: new Date(),
          };
          setTimers((prev) => ({ ...prev, [missionId]: newTimer }));
          await saveTimerToStorage(userId, missionId, newTimer);
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
      if (!userId) return;
      const timer = timers[missionId];
      if (!timer?.validationId) return;
      try {
        await pauseMissionSession(timer.validationId);
        const updated: MissionTimer = {
          ...timer,
          state: "paused",
          startedAt: null,
        };
        setTimers((prev) => ({ ...prev, [missionId]: updated }));
        await saveTimerToStorage(userId, missionId, updated);
      } catch (err) {
        console.error("❌ handlePause error:", err);
      }
    },
    [userId, timers]
  );

  // ─────────────────────────────────────────────────────────
  //  Terminer
  // ─────────────────────────────────────────────────────────

  const handleFinish = useCallback(
    async (missionId: number) => {
      if (!userId) return;
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
        const done: MissionTimer = { ...timer, state: "done", startedAt: null };
        setTimers((prev) => ({ ...prev, [missionId]: done }));
        // Supprimer le timer persisté une fois terminé
        await clearTimerFromStorage(userId, missionId);

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
    [userId, timers, missions]
  );

  useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);

  // ─────────────────────────────────────────────────────────
  //  Supprimer
  // ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (missionId: number) => {
    try {
      await deleteMission(missionId);
      if (userId) await clearTimerFromStorage(userId, missionId);
      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      setTimers((prev) => {
        const copy = { ...prev };
        delete copy[missionId];
        return copy;
      });
    } catch (err) {
      console.error("❌ handleDelete error:", err);
    }
  }, [userId]);

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

  const handleLeaveRunning = useCallback(async () => {
    // Persister le startedAt actuel pour recalculer à la reprise
    if (userId) {
      const runningEntries = Object.entries(timers).filter(([, t]) => t.state === "running");
      for (const [id, timer] of runningEntries) {
        await saveTimerToStorage(userId, Number(id), {
          ...timer,
          startedAt: timer.startedAt ?? new Date(),
        });
      }
    }
    setExitModal((prev) => {
      prev.pendingAction?.();
      return { visible: false, pendingAction: null };
    });
  }, [userId, timers]);

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