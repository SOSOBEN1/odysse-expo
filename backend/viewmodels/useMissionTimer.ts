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

// ─────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────

interface StatusModal {
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string | undefined;
  dateLimit: string | undefined;
  xp: number;
  coins: number;
}

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────

export function useMissions(userId: string | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [timers, setTimers] = useState<Record<number, MissionTimer>>({});
  const [loading, setLoading] = useState(true);

  // ✅ statusModal inclut xp et coins (initialisés à 0)
  const [statusModal, setStatusModal] = useState<StatusModal>({
    visible: false,
    type: "success",
    missionTitle: undefined,
    dateLimit: undefined,
    xp: 0,
    coins: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─────────────────────────────────────────────────────────
  //  Chargement des missions
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

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // ─────────────────────────────────────────────────────────
  //  Ticker global (toutes les secondes)
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let changed = false;

        Object.entries(updated).forEach(([id, timer]) => {
          if (timer.state === "running") {
            updated[Number(id)] = { ...timer, elapsed: timer.elapsed + 1 };
            changed = true;
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
          // Reprise
          await resumeMissionSession(timer.validationId);
          setTimers((prev) => ({
            ...prev,
            [missionId]: { ...prev[missionId], state: "running" },
          }));
        } else {
          // Nouveau démarrage
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
  //  ✅ FIX — Terminer (récupère et transmet xp + coins)
  // ─────────────────────────────────────────────────────────

  const handleFinish = useCallback(
    async (missionId: number) => {
      const timer = timers[missionId];
      if (!timer || !userId) return;

      try {
        // ✅ Capturer le retour { xp, coins }
        const { xp, coins } = await finishMissionSession(
          missionId,
          timer.validationId,
          timer.elapsed,
          userId
        );

        // Mettre à jour le timer local
        setTimers((prev) => ({
          ...prev,
          [missionId]: { ...prev[missionId], state: "done" },
        }));

        const mission = missions.find((m) => m.id === missionId);

        // ✅ Passer xp et coins réels à la modal
        setStatusModal({
          visible: true,
          type: "success",
          missionTitle: mission?.title,
          dateLimit:
            mission?.dateLimite?.toLocaleDateString("fr-FR") ?? undefined,
          xp,
          coins,
        });
      } catch (err) {
        console.error("❌ handleFinish error:", err);
      }
    },
    [timers, missions, userId]
  );

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
  //  Fermer la modal
  // ─────────────────────────────────────────────────────────

  const closeStatusModal = useCallback(() => {
    setStatusModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Payload pour l'édition
  // ─────────────────────────────────────────────────────────

  const buildEditPayload = useCallback((mission: Mission) => {
    return {
      id: mission.id,
      titre: mission.title,
      description: mission.description,
      duration: mission.duration,
      difficulty: mission.difficulty,
      urgent: mission.urgent,
      dateLimite: mission.dateLimite,
      event: mission.event,
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  //  Retour du hook
  // ─────────────────────────────────────────────────────────

  return {
    missions,
    loading,
    statusModal,
    getTimer,
    handleStart,
    handlePause,
    handleFinish,
    handleDelete,
    buildEditPayload,
    loadMissions,
    closeStatusModal,
  };
}
