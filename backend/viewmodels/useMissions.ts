// backend/viewmodels/useMissions.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { supabase } from "../../app/frontend/constants/supabase";
import { useMissionStatus } from "../../app/frontend/constants/MissionStatusContext"; // ← AJOUT
import { useSounds } from "../../app/frontend/hooks/useSounds";
import {
  deleteMission,
  failMissionSession,
  fetchMissions,
  finishMissionSession,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
} from "../models/mission.service";
import type { Mission, MissionTimer } from "../models/mission.types";
import { failMission } from "../services/Userstatsservice";

interface ExitModal {
  visible: boolean;
  pendingAction: (() => void) | null;
}

const timerKey = (userId: string, missionId: number) =>
  `mission_timer:${userId}:${missionId}`;

async function saveTimerToStorage(userId: string, missionId: number, timer: MissionTimer) {
  try {
    await AsyncStorage.setItem(
      timerKey(userId, missionId),
      JSON.stringify({
        ...timer,
        startedAt:
          timer.startedAt instanceof Date
            ? timer.startedAt.toISOString()
            : (timer.startedAt ?? null),
      }),
    );
  } catch {}
}

async function loadTimerFromStorage(
  userId: string,
  missionId: number,
  durationStr: string | undefined,
): Promise<MissionTimer | null> {
  try {
    const raw = await AsyncStorage.getItem(timerKey(userId, missionId));
    if (!raw) return null;

    const saved = JSON.parse(raw) as any;

    if (saved.state === "running" && saved.startedAt) {
      const startedAt  = new Date(saved.startedAt);
      const now        = new Date();
      const passedSecs = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const newElapsed = (saved.elapsed ?? 0) + passedSecs;

      const totalSeconds = parseDurationToSeconds(durationStr);
      if (totalSeconds > 0 && newElapsed >= totalSeconds) {
        const failed: MissionTimer = {
          state: "fail", elapsed: totalSeconds,
          validationId: saved.validationId ?? null, startedAt: null,
        };
        await AsyncStorage.setItem(timerKey(userId, missionId), JSON.stringify(failed));
        return failed;
      }

      return {
        state: "running", elapsed: newElapsed,
        validationId: saved.validationId ?? null, startedAt: new Date(),
      };
    }

    return {
      state:        saved.state ?? "idle",
      elapsed:      saved.elapsed ?? 0,
      validationId: saved.validationId ?? null,
      startedAt:    saved.startedAt ? new Date(saved.startedAt) : null,
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

const pausedTimersStore = new Map<string, MissionTimer>();

function storePausedTimer(userId: string, missionId: number, timer: MissionTimer) {
  pausedTimersStore.set(`${userId}:${missionId}`, timer);
}

function getPausedTimer(userId: string, missionId: number): MissionTimer | null {
  return pausedTimersStore.get(`${userId}:${missionId}`) ?? null;
}

function clearPausedTimer(userId: string, missionId: number) {
  pausedTimersStore.delete(`${userId}:${missionId}`);
}

export function useMissions(userId: string | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [timers, setTimers]     = useState<Record<number, MissionTimer>>({});
  const [loading, setLoading]   = useState(true);

  const { playSound }                          = useSounds();
  const { showStatusModal }                    = useMissionStatus(); // ← AJOUT

  const [exitModal, setExitModal] = useState<ExitModal>({
    visible: false,
    pendingAction: null,
  });

  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const missionsRef     = useRef<Mission[]>([]);
  const timersRef       = useRef<Record<number, MissionTimer>>({});
  const handleFinishRef = useRef<(id: number) => Promise<void>>(async () => {});

  // ─── Chargement ───────────────────────────────────────────────
  const loadMissions = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { missions: fetchedMissions, timers: fetchedTimers } = await fetchMissions(userId);

      const restoredTimers: Record<number, MissionTimer> = {};
      for (const mission of fetchedMissions) {
        const memoryTimer = getPausedTimer(userId, mission.id);
        if (memoryTimer && memoryTimer.state !== "idle") {
          clearPausedTimer(userId, mission.id);
          restoredTimers[mission.id] = {
            ...memoryTimer,
            validationId: memoryTimer.validationId ?? fetchedTimers[mission.id]?.validationId ?? null,
          };
          continue;
        }

        const stored      = await loadTimerFromStorage(userId, mission.id, mission.duration);
        const backendTimer = fetchedTimers[mission.id] ?? {
          state: "idle", elapsed: 0, validationId: null, startedAt: null,
        };

        if (stored && stored.state !== "idle") {
          restoredTimers[mission.id] = {
            ...stored,
            validationId: stored.validationId ?? backendTimer.validationId,
          };
        } else {
          restoredTimers[mission.id] = backendTimer;
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
  useEffect(() => { timersRef.current   = timers;   }, [timers]);

  // ─── Cleanup au démontage ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!userId) return;
      const currentTimers = timersRef.current;
      Object.entries(currentTimers).forEach(([id, timer]) => {
        if (timer.state !== "running") return;
        const missionId     = Number(id);
        const timerWithStart = { ...timer, startedAt: timer.startedAt ?? new Date() };
        storePausedTimer(userId, missionId, timerWithStart);
        saveTimerToStorage(userId, missionId, timerWithStart).catch(() => {});
      });
    };
  }, [userId]);

  // ─── Ticker global + auto-finish ─────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let changed   = false;

        Object.entries(updated).forEach(([id, timer]) => {
          if (timer.state !== "running") return;

          const missionId  = Number(id);
          const newElapsed = timer.elapsed + 1;
          updated[missionId] = { ...timer, elapsed: newElapsed };
          changed = true;

          if (userId) {
            saveTimerToStorage(userId, missionId, updated[missionId]).catch(() => {});
          }

          const mission = missionsRef.current.find((m) => m.id === missionId);

          // Vérification deadline → fail
          if (mission?.dateLimite && mission.dateLimite.getTime() < Date.now()) {
            updated[missionId] = { ...timer, state: "fail", startedAt: null };
            if (timer.validationId) {
              failMissionSession(timer.validationId, userId ?? undefined, missionId).catch(() => {});
            }
            // ✅ Appliquer les malus de stats (fetch données complètes depuis DB)
            if (userId) {
              import("../../app/frontend/constants/supabase").then(({ supabase }) => {
                supabase
                  .from("mission")
                  .select("id_mission, titre, description, duree_min, difficulte, priorite, energie_cout, stress_gain, connaissance_gain, organisation_gain, xp_gain")
                  .eq("id_mission", missionId)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      failMission(userId, {
                        id_mission:        data.id_mission,
                        titre:             data.titre ?? "",
                        description:       data.description ?? "",
                        duree_min:         data.duree_min ?? 0,
                        difficulte:        data.difficulte ?? 1,
                        priorite:          data.priorite ?? 2,
                        energie_cout:      data.energie_cout ?? 8,
                        stress_gain:       data.stress_gain ?? null,
                        connaissance_gain: data.connaissance_gain ?? 0,
                        organisation_gain: data.organisation_gain ?? 0,
                        xp_gain:           data.xp_gain ?? 0,
                      }).catch(() => {});
                    }
                  });
              });
            }
            playSound("missionEchouee").catch(() => {});
            setTimeout(() => {
              showStatusModal({ // ← MODIFIÉ
                type: "fail",
                missionTitle: mission.title,
                dateLimit: mission.dateLimite!.toLocaleDateString("fr-FR"),
                xp: 0,
                coins: 0,
              });
            }, 0);
            return;
          }

          if (mission) {
            const match = mission.duration?.match(/(\d+)h(\d*)/);
            if (match) {
              const totalSeconds =
                (parseInt(match[1]) || 0) * 3600 +
                (parseInt(match[2]) || 0) * 60;
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

  // ─── Accesseur timer ──────────────────────────────────────────
  const getTimer = useCallback(
    (missionId: number): MissionTimer =>
      timers[missionId] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null },
    [timers],
  );

  // ─── Démarrer / Reprendre ─────────────────────────────────────
  const handleStart = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timers[missionId];

      try {
        const { data: ps } = await supabase
          .from("player_stats")
          .select("energie")
          .eq("id_user", parseInt(userId, 10))
          .maybeSingle();

        const energie = ps?.energie ?? 100;
        if (energie <= 0) {
          Alert.alert(
            "⚡ Énergie épuisée !",
            "Tu n'as plus d'énergie pour démarrer une mission.\n\nDors (1x/jour) ou utilise une potion ⚡ depuis le Dashboard pour récupérer.",
            [{ text: "OK", style: "default" }]
          );
          return;
        }
      } catch (e) {
        console.warn("⚠️ Energy check failed:", e);
      }

      try {
        if (timer?.state === "paused" && timer.validationId) {
          await resumeMissionSession(timer.validationId);
          const updated: MissionTimer = { ...timer, state: "running", startedAt: new Date() };
          setTimers((prev) => ({ ...prev, [missionId]: updated }));
          await saveTimerToStorage(userId, missionId, updated);
        } else {
          const validationId = await startMissionSession(userId, missionId);
          const newTimer: MissionTimer = {
            state: "running", elapsed: 0, validationId, startedAt: new Date(),
          };
          setTimers((prev) => ({ ...prev, [missionId]: newTimer }));
          await saveTimerToStorage(userId, missionId, newTimer);
        }
      } catch (err) {
        console.error("❌ handleStart error:", err);
      }
    },
    [userId, timers],
  );

  // ─── Pause ────────────────────────────────────────────────────
  const handlePause = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timers[missionId];
      if (!timer?.validationId) return;
      try {
        await pauseMissionSession(timer.validationId);
        const updated: MissionTimer = { ...timer, state: "paused", startedAt: null };
        setTimers((prev) => ({ ...prev, [missionId]: updated }));
        await saveTimerToStorage(userId, missionId, updated);
      } catch (err) {
        console.error("❌ handlePause error:", err);
      }
    },
    [userId, timers],
  );

  // ─── Terminer ─────────────────────────────────────────────────
  const handleFinish = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timers[missionId];
      if (!timer) return;
      if (timer.state === "done" || timer.state === "fail") return;
      try {
        const { xp, coins } = await finishMissionSession(
          missionId, timer.validationId, timer.elapsed, userId,
        );
        const done: MissionTimer = { ...timer, state: "done", startedAt: null };
        setTimers((prev) => ({ ...prev, [missionId]: done }));
        playSound("missionReussie");
        await clearTimerFromStorage(userId, missionId);

        const mission = missions.find((m) => m.id === missionId);
        showStatusModal({ // ← MODIFIÉ
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
    [userId, timers, missions],
  );

  useEffect(() => { handleFinishRef.current = handleFinish; }, [handleFinish]);

  // ─── Supprimer ────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (missionId: number) => {
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
    },
    [userId],
  );

  // ─── Exit modal ───────────────────────────────────────────────
  const hasRunningMission = useCallback(() => {
    return Object.values(timersRef.current).some((t) => t.state === "running");
  }, []);

  const requestExit = useCallback(
    (onConfirm: () => void) => {
      if (!hasRunningMission()) { onConfirm(); return; }
      setExitModal({ visible: true, pendingAction: onConfirm });
    },
    [hasRunningMission],
  );

  const handlePauseAndLeave = useCallback(async () => {
    if (!userId) return;

    const currentTimers  = timersRef.current;
    const runningEntries = Object.entries(currentTimers).filter(([, t]) => t.state === "running");

    for (const [id, timer] of runningEntries) {
      const missionId = Number(id);
      const paused: MissionTimer = { ...timer, state: "paused", startedAt: null };
      try {
        if (timer.validationId) await pauseMissionSession(timer.validationId);
        setTimers(prev => ({ ...prev, [missionId]: paused }));
        storePausedTimer(userId, missionId, paused);
        saveTimerToStorage(userId, missionId, paused).catch(() => {});
      } catch (err) {
        console.error("❌ handlePauseAndLeave error:", err);
      }
    }

    const pendingAction = exitModal.pendingAction;
    setExitModal({ visible: false, pendingAction: null });
    setTimeout(() => { pendingAction?.(); }, 0);
  }, [userId, exitModal]);

  const handleLeaveRunning = useCallback(async () => {
    if (userId) {
      const currentTimers  = timersRef.current;
      const runningEntries = Object.entries(currentTimers).filter(([, t]) => t.state === "running");

      for (const [id, timer] of runningEntries) {
        const timerWithStart = { ...timer, startedAt: timer.startedAt ?? new Date() };
        storePausedTimer(userId, Number(id), timerWithStart);
        await saveTimerToStorage(userId, Number(id), timerWithStart);
      }
    }

    await new Promise((r) => setTimeout(r, 100));

    const pendingAction = exitModal.pendingAction;
    setExitModal({ visible: false, pendingAction: null });
    setTimeout(() => { pendingAction?.(); }, 0);
  }, [userId, exitModal]);

  const handleCancelExit = useCallback(() => {
    setExitModal({ visible: false, pendingAction: null });
  }, []);

  // ─── Reload missions only ─────────────────────────────────────
  const reloadMissionsOnly = useCallback(async () => {
    if (!userId) return;
    try {
      const { missions: fetchedMissions } = await fetchMissions(userId);
      setMissions(fetchedMissions);
    } catch (err) {
      console.error("❌ reloadMissionsOnly error:", err);
    }
  }, [userId]);

  const buildEditPayload = useCallback(
    (mission: Mission) => ({
      id_mission:  mission.id,
      titre:       mission.title,
      description: mission.description,
      duration:    mission.duration,
      difficulty:  mission.difficulty,
      urgent:      mission.urgent,
      dateLimite:  mission.dateLimite,
      event:       mission.event,
    }),
    [],
  );

  return {
    missions,
    loading,
    exitModal,
    getTimer,
    handleStart,
    handlePause,
    handleFinish,
    handleDelete,
    buildEditPayload,
    loadMissions,
    reloadMissionsOnly,
    requestExit,
    handlePauseAndLeave,
    handleLeaveRunning,
    handleCancelExit,
  };
}