/**
 * useZoneMissions.ts
 * Logique identique à useMissions :
 * - AsyncStorage pour persister les timers
 * - startMissionSession / pauseMissionSession / finishMissionSession / failMissionSession
 * - Suggestions = missions user sans id_zone (idle)
 * - Terminer = finishMissionSession + updatePuzzle (+1 pièce)
 * - Toutes terminées = zone débloquée
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../app/frontend/constants/supabase";
import {
  failMissionSession,
  fetchSuggestions,
  fetchZoneMissions,
  finishMissionSession,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
} from "../models/mission.service";

// ─── Types ──────────────────────────────────────────────────────────────────

export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

export interface ZoneTimer {
  state: TimerState;
  elapsed: number;
  validationId: number | null;
  startedAt: Date | null;
}

export interface ZoneMission {
  id_mission: number;
  titre: string;
  description: string;
  xp_gain: number;
  energie_cout: number;
  difficulte: number;
  duree_min: number;
  priorite: number;
  done: boolean;
}

export interface PuzzleInfo {
  id_puzzle: number;
  total_pieces: number;
  pieces_earned: number;
  is_complete: boolean;
}

export interface StatusModal {
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string | undefined;
  xp: number;
  coins: number;
}

// ─── AsyncStorage helpers ────────────────────────────────────────────────────

const timerKey = (userId: string, zoneId: number, missionId: number) =>
  `zone_timer:${userId}:${zoneId}:${missionId}`;

async function saveTimer(userId: string, zoneId: number, missionId: number, timer: ZoneTimer) {
  try {
    await AsyncStorage.setItem(
      timerKey(userId, zoneId, missionId),
      JSON.stringify({
        ...timer,
        startedAt: timer.startedAt instanceof Date ? timer.startedAt.toISOString() : null,
      }),
    );
  } catch {}
}

async function loadTimer(
  userId: string,
  zoneId: number,
  missionId: number,
  dureeMin: number,
): Promise<ZoneTimer | null> {
  try {
    const raw = await AsyncStorage.getItem(timerKey(userId, zoneId, missionId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as any;

    if (saved.state === "running" && saved.startedAt) {
      const startedAt = new Date(saved.startedAt);
      const passedSecs = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      const newElapsed = (saved.elapsed ?? 0) + passedSecs;
      const totalSecs = dureeMin * 60;

      if (totalSecs > 0 && newElapsed >= totalSecs) {
        const failed: ZoneTimer = {
          state: "fail", elapsed: totalSecs,
          validationId: saved.validationId ?? null, startedAt: null,
        };
        await AsyncStorage.setItem(timerKey(userId, zoneId, missionId), JSON.stringify(failed));
        return failed;
      }
      return {
        state: "running", elapsed: newElapsed,
        validationId: saved.validationId ?? null, startedAt: new Date(),
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

async function clearTimer(userId: string, zoneId: number, missionId: number) {
  try {
    await AsyncStorage.removeItem(timerKey(userId, zoneId, missionId));
  } catch {}
}

// ─── Module-level store (survit au démontage) ────────────────────────────────

const pausedStore = new Map<string, ZoneTimer>();
const storeKey = (userId: string, zoneId: number, missionId: number) =>
  `${userId}:${zoneId}:${missionId}`;

// ─── Puzzle cache ─────────────────────────────────────────────────────────────

const puzzleCache: Record<string, PuzzleInfo> = {};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useZoneMissions(
  userId: string | null,
  zoneId: number,
  totalPieces: number,
) {
  const [missions, setMissions] = useState<ZoneMission[]>([]);
  const [suggestions, setSuggestions] = useState<ZoneMission[]>([]);
  const [timers, setTimers] = useState<Record<number, ZoneTimer>>({});
  const [puzzle, setPuzzle] = useState<PuzzleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<StatusModal>({
    visible: false, type: "success", missionTitle: undefined, xp: 0, coins: 0,
  });
  const [zoneUnlocked, setZoneUnlocked] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missionsRef = useRef<ZoneMission[]>([]);
  const timersRef = useRef<Record<number, ZoneTimer>>({});
  const handleFinishRef = useRef<(id: number) => Promise<void>>(async () => {});

  useEffect(() => { missionsRef.current = missions; }, [missions]);
  useEffect(() => { timersRef.current = timers; }, [timers]);

  // ── Load puzzle ────────────────────────────────────────────────────────────

  const loadPuzzle = useCallback(async () => {
    if (!userId) return null;
    const cacheKey = `${userId}:${zoneId}`;
    if (puzzleCache[cacheKey]) {
      setPuzzle(puzzleCache[cacheKey]);
      return puzzleCache[cacheKey];
    }
    try {
      const { data: config } = await supabase
        .from("puzzle_config")
        .select("id_puzzle, total_pieces")
        .eq("id_zone", zoneId)
        .single();
      if (!config) return null;

      const { data: prog } = await supabase
        .from("puzzle_progress")
        .select("pieces_earned, is_complete")
        .eq("id_user", userId)
        .eq("id_puzzle", config.id_puzzle)
        .maybeSingle();

      const info: PuzzleInfo = {
        id_puzzle: config.id_puzzle,
        total_pieces: config.total_pieces,
        pieces_earned: prog?.pieces_earned ?? 0,
        is_complete: prog?.is_complete ?? false,
      };
      setPuzzle(info);
      puzzleCache[cacheKey] = info;
      return info;
    } catch (e) {
      console.error("❌ loadPuzzle:", e);
      return null;
    }
  }, [userId, zoneId]);

  // ── Load missions ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [rawMissions, rawSugg] = await Promise.all([
        fetchZoneMissions(userId, zoneId),
        fetchSuggestions(userId),
        loadPuzzle(),
      ]);

      // Missions déjà validées (done)
      const missionIds = (rawMissions ?? []).map((m: any) => m.id_mission);
      let doneSet = new Set<number>();
      if (missionIds.length > 0) {
        const { data: validations } = await supabase
          .from("mission_validation")
          .select("id_mission")
          .eq("id_user", userId)
          .eq("statut", "done")
          .in("id_mission", missionIds);
        doneSet = new Set((validations ?? []).map((v: any) => v.id_mission));
      }

      const loaded: ZoneMission[] = (rawMissions ?? []).map((m: any) => ({
        id_mission: m.id_mission,
        titre: m.titre ?? "Sans titre",
        description: m.description ?? "",
        xp_gain: m.xp_gain ?? 0,
        energie_cout: m.energie_cout ?? 0,
        difficulte: m.difficulte ?? 1,
        duree_min: m.duree_min ?? 30,
        priorite: m.priorite ?? 1,
        done: doneSet.has(m.id_mission),
      }));

      // Suggestions = missions sans id_zone, idle (pas dans mission_validation running/paused)
      const suggMapped: ZoneMission[] = (rawSugg ?? []).map((m: any) => ({
        id_mission: m.id_mission,
        titre: m.titre ?? "Sans titre",
        description: m.description ?? "",
        xp_gain: m.xp_gain ?? 0,
        energie_cout: m.energie_cout ?? 0,
        difficulte: m.difficulte ?? 1,
        duree_min: m.duree_min ?? 30,
        priorite: m.priorite ?? 1,
        done: false,
      }));

      setMissions(loaded);
      setSuggestions(suggMapped);

      // Restaurer les timers
      const initTimers: Record<number, ZoneTimer> = {};
      for (const m of loaded) {
        if (m.done) {
          initTimers[m.id_mission] = { state: "done", elapsed: 0, validationId: null, startedAt: null };
          continue;
        }
        // Module-level store
        const memKey = storeKey(userId, zoneId, m.id_mission);
        const memTimer = pausedStore.get(memKey);
        if (memTimer && memTimer.state !== "idle") {
          pausedStore.delete(memKey);
          initTimers[m.id_mission] = memTimer;
          continue;
        }
        // AsyncStorage
        const stored = await loadTimer(userId, zoneId, m.id_mission, m.duree_min);
        if (stored && stored.state !== "idle") {
          initTimers[m.id_mission] = stored;
        } else {
          // Backend validation
          const { data: val } = await supabase
            .from("mission_validation")
            .select("id_validation, statut, date_debut")
            .eq("id_user", userId)
            .eq("id_mission", m.id_mission)
            .not("statut", "in", '("done","fail")')
            .maybeSingle();

          if (val) {
            initTimers[m.id_mission] = {
              state: val.statut as TimerState,
              elapsed: 0,
              validationId: val.id_validation,
              startedAt: val.date_debut ? new Date(val.date_debut) : null,
            };
          } else {
            initTimers[m.id_mission] = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
          }
        }
      }

      setTimers(initTimers);
    } catch (e) {
      console.error("❌ load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, zoneId, loadPuzzle]);

  useEffect(() => { load(); }, [load]);

  // ── Cleanup au démontage ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (!userId) return;
      Object.entries(timersRef.current).forEach(([id, timer]) => {
        if (timer.state !== "running") return;
        const missionId = Number(id);
        const t = { ...timer, startedAt: timer.startedAt ?? new Date() };
        pausedStore.set(storeKey(userId, zoneId, missionId), t);
        saveTimer(userId, zoneId, missionId, t).catch(() => {});
      });
    };
  }, [userId, zoneId]);

  // ── Ticker global + auto-fail ──────────────────────────────────────────────

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let changed = false;

        Object.entries(updated).forEach(([id, timer]) => {
          if (timer.state !== "running") return;
          const missionId = Number(id);
          const newElapsed = timer.elapsed + 1;
          updated[missionId] = { ...timer, elapsed: newElapsed };
          changed = true;

          if (userId) {
            saveTimer(userId, zoneId, missionId, updated[missionId]).catch(() => {});
          }

          const mission = missionsRef.current.find((m) => m.id_mission === missionId);
          if (mission) {
            const totalSecs = mission.duree_min * 60;
            if (totalSecs > 0 && newElapsed >= totalSecs) {
              // Auto-fail quand le temps est écoulé
              updated[missionId] = { ...timer, state: "fail", elapsed: totalSecs, startedAt: null };
              if (timer.validationId) {
                failMissionSession(timer.validationId).catch(() => {});
              }
              setTimeout(() => {
                setStatusModal({
                  visible: true, type: "fail",
                  missionTitle: mission.titre, xp: 0, coins: 0,
                });
              }, 0);
            }
          }
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userId, zoneId]);

  // ── getTimer ───────────────────────────────────────────────────────────────

  const getTimer = useCallback(
    (id: number): ZoneTimer =>
      timers[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null },
    [timers],
  );

  // ── startTimer ─────────────────────────────────────────────────────────────

  const startTimer = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timersRef.current[missionId];
      try {
        if (timer?.state === "paused" && timer.validationId) {
          await resumeMissionSession(timer.validationId);
          const updated: ZoneTimer = { ...timer, state: "running", startedAt: new Date() };
          setTimers((prev) => ({ ...prev, [missionId]: updated }));
          timersRef.current = { ...timersRef.current, [missionId]: updated };
          await saveTimer(userId, zoneId, missionId, updated);
        } else {
          const validationId = await startMissionSession(userId, missionId);
          const newTimer: ZoneTimer = { state: "running", elapsed: 0, validationId, startedAt: new Date() };
          setTimers((prev) => ({ ...prev, [missionId]: newTimer }));
          timersRef.current = { ...timersRef.current, [missionId]: newTimer };
          await saveTimer(userId, zoneId, missionId, newTimer);
        }
      } catch (e) {
        console.error("❌ startTimer:", e);
      }
    },
    [userId, zoneId],
  );

  // ── pauseTimer ─────────────────────────────────────────────────────────────

  const pauseTimer = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timersRef.current[missionId];
      if (!timer?.validationId) return;
      try {
        await pauseMissionSession(timer.validationId);
        const updated: ZoneTimer = { ...timer, state: "paused", startedAt: null };
        setTimers((prev) => ({ ...prev, [missionId]: updated }));
        timersRef.current = { ...timersRef.current, [missionId]: updated };
        await saveTimer(userId, zoneId, missionId, updated);
      } catch (e) {
        console.error("❌ pauseTimer:", e);
      }
    },
    [userId, zoneId],
  );

  // ── finishTimer ────────────────────────────────────────────────────────────

  const finishTimer = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const timer = timersRef.current[missionId];
      if (!timer || timer.state === "done" || timer.state === "fail") return;

      try {
        const { xp, coins } = await finishMissionSession(
          missionId, timer.validationId, timer.elapsed, userId,
        );

        const done: ZoneTimer = { ...timer, state: "done", startedAt: null };
        setTimers((prev) => ({ ...prev, [missionId]: done }));
        timersRef.current = { ...timersRef.current, [missionId]: done };
        await clearTimer(userId, zoneId, missionId);

        // Marquer la mission comme done
        setMissions((prev) =>
          prev.map((m) => m.id_mission === missionId ? { ...m, done: true } : m),
        );

        // Débloquer pièce puzzle via RPC Supabase
        let newPiecesEarned = (puzzle?.pieces_earned ?? 0) + 1;
        let puzzleComplete = false;
        try {
          const { data: rpcData } = await supabase.rpc("complete_mission", {
            p_user_id: userId,
            p_mission_id: missionId,
          });
          console.log("✅ complete_mission RPC:", JSON.stringify(rpcData));
          if (rpcData?.pieces_earned !== undefined) {
            newPiecesEarned = rpcData.pieces_earned;
            puzzleComplete = rpcData.puzzle_complete ?? false;
          }
        } catch (rpcErr) {
          console.warn("⚠️ RPC complete_mission failed, fallback local:", rpcErr);
        }

        // Mettre à jour puzzle localement
        setPuzzle((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, pieces_earned: newPiecesEarned, is_complete: puzzleComplete };
          const cacheKey = `${userId}:${zoneId}`;
          puzzleCache[cacheKey] = updated;
          return updated;
        });

        // Modal succès
        const mission = missionsRef.current.find((m) => m.id_mission === missionId);
        setStatusModal({
          visible: true, type: "success",
          missionTitle: mission?.titre, xp, coins,
        });

        // Vérifier si toutes les missions sont terminées → zone débloquée
        const updatedMissions = missionsRef.current.map((m) =>
          m.id_mission === missionId ? { ...m, done: true } : m,
        );
        if (
          updatedMissions.length === totalPieces &&
          updatedMissions.every((m) => m.done)
        ) {
          setTimeout(() => setZoneUnlocked(true), 1500);
        }
      } catch (e) {
        console.error("❌ finishTimer:", e);
      }
    },
    [userId, zoneId, totalPieces, puzzle],
  );

  useEffect(() => { handleFinishRef.current = finishTimer; }, [finishTimer]);

  // ── retryTimer ─────────────────────────────────────────────────────────────

  const retryTimer = useCallback(
    async (missionId: number) => {
      if (!userId) return;
      const reset: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
      setTimers((prev) => ({ ...prev, [missionId]: reset }));
      timersRef.current = { ...timersRef.current, [missionId]: reset };
      await clearTimer(userId, zoneId, missionId);
    },
    [userId, zoneId],
  );

  // ── pauseAllRunning ────────────────────────────────────────────────────────

  const pauseAllRunning = useCallback(async () => {
    if (!userId) return;
    const current = timersRef.current;
    const updates: Record<number, ZoneTimer> = { ...current };
    for (const [id, timer] of Object.entries(current)) {
      if (timer.state !== "running") continue;
      const missionId = Number(id);
      if (timer.validationId) {
        await pauseMissionSession(timer.validationId).catch(() => {});
      }
      updates[missionId] = { ...timer, state: "paused", startedAt: null };
      await saveTimer(userId, zoneId, missionId, updates[missionId]);
    }
    setTimers(updates);
    timersRef.current = updates;
  }, [userId, zoneId]);

  // ── saveAllRunningForBackground ────────────────────────────────────────────

  const saveAllRunningForBackground = useCallback(async () => {
    if (!userId) return;
    const current = timersRef.current;
    for (const [id, timer] of Object.entries(current)) {
      if (timer.state !== "running") continue;
      const missionId = Number(id);
      const t = { ...timer, startedAt: timer.startedAt ?? new Date() };
      pausedStore.set(storeKey(userId, zoneId, missionId), t);
      await saveTimer(userId, zoneId, missionId, t);
    }
  }, [userId, zoneId]);

  const hasRunningTimer = useCallback(
    () => Object.values(timersRef.current).some((t) => t.state === "running"),
    [],
  );

  // ── acceptSuggestion ───────────────────────────────────────────────────────

  const acceptSuggestion = useCallback(
    async (mission: ZoneMission) => {
      if (!userId) return;
      if (missions.length >= totalPieces) return;
      try {
        const { data, error } = await supabase
          .from("mission")
          .update({ id_zone: zoneId })
          .eq("id_mission", mission.id_mission)
          .select()
          .single();
        if (error) throw error;

        const newMission: ZoneMission = { ...mission, done: false };
        setMissions((prev) => [...prev, newMission]);
        setSuggestions((prev) => prev.filter((s) => s.id_mission !== mission.id_mission));
        const newTimer: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
        setTimers((prev) => ({ ...prev, [mission.id_mission]: newTimer }));
        timersRef.current = { ...timersRef.current, [mission.id_mission]: newTimer };
      } catch (e) {
        console.error("❌ acceptSuggestion:", e);
      }
    },
    [userId, zoneId, missions.length, totalPieces],
  );

  // ── addMission (créée depuis modal) ───────────────────────────────────────

  const addMission = useCallback((raw: any) => {
    const m: ZoneMission = {
      id_mission: raw.id_mission,
      titre: raw.titre ?? "Sans titre",
      description: raw.description ?? "",
      xp_gain: raw.xp_gain ?? 0,
      energie_cout: raw.energie_cout ?? 0,
      difficulte: raw.difficulte ?? 1,
      duree_min: raw.duree_min ?? 30,
      priorite: raw.priorite ?? 1,
      done: false,
    };
    setMissions((prev) => [...prev, m]);
    const newTimer: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
    setTimers((prev) => ({ ...prev, [m.id_mission]: newTimer }));
    timersRef.current = { ...timersRef.current, [m.id_mission]: newTimer };
  }, []);

  // ── closeStatusModal ──────────────────────────────────────────────────────

  const closeStatusModal = useCallback(() => {
    setStatusModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const closeZoneUnlocked = useCallback(() => setZoneUnlocked(false), []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const slots = Array.from({ length: totalPieces }, (_, i) => missions[i] ?? null);
  const doneMissions = missions.filter((m) => m.done).length;
  const totalXp = missions.reduce((sum, m) => sum + (m.xp_gain ?? 0), 0);

  return {
    missions,
    slots,
    suggestions,
    timers,
    puzzle,
    loading,
    statusModal,
    zoneUnlocked,
    doneMissions,
    totalXp,
    getTimer,
    startTimer,
    pauseTimer,
    finishTimer,
    retryTimer,
    hasRunningTimer,
    pauseAllRunning,
    saveAllRunningForBackground,
    acceptSuggestion,
    addMission,
    closeStatusModal,
    closeZoneUnlocked,
    reload: load,
  };
}