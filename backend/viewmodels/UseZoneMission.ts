/**
 * useZoneMissions.ts
 *
 * ✅ Stockage mémoire global
 * ✅ Les timers persistent entre navigations et déconnexions
 * ✅ Le puzzle garde son état
 * ✅ Pause automatique à la déconnexion
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../app/frontend/constants/supabase";
import {
  assignMissionToZone,
  fetchSuggestions,
  fetchZoneMissions,
} from "../models/mission.service";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

export interface TimerData {
  state: TimerState;
  elapsed: number;
  startedAt: number | null;
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

// ─── Stockage mémoire GLOBAL (survit aux déconnexions si l'app n'est pas tuée) ─

const globalTimerStore: Record<string, TimerData> = {};
const globalPuzzleStore: Record<string, PuzzleInfo> = {};

const memoryStore = {
  get: (key: string): TimerData | null => globalTimerStore[key] ?? null,
  set: (key: string, data: TimerData): void => { globalTimerStore[key] = data; },
  remove: (key: string): void => { delete globalTimerStore[key]; },
};

const puzzleStore = {
  get: (key: string): PuzzleInfo | null => globalPuzzleStore[key] ?? null,
  set: (key: string, data: PuzzleInfo): void => { globalPuzzleStore[key] = data; },
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useZoneMissions(
  userId: string | null,
  zoneId: number,
  totalPieces: number
) {
  const [missions,    setMissions]    = useState<ZoneMission[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [timers,      setTimers]      = useState<Record<number, TimerData>>({});
  const [puzzle,      setPuzzle]      = useState<PuzzleInfo | null>(null);
  const [loading,     setLoading]     = useState(true);

  const intervalsRef  = useRef<Record<number, ReturnType<typeof setInterval>>>({});
  const startedAtRef  = useRef<Record<number, number>>({});
  const timersRef     = useRef<Record<number, TimerData>>({});

  // ✅ Savoir si l'utilisateur est connecté
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  // ── Clés ─────────────────────────────────────────────────────────────────────

  const getKey = useCallback(
    (missionId: number) => `timer:${userId}:${zoneId}:${missionId}`,
    [userId, zoneId]
  );

  const getPuzzleKey = useCallback(
    () => `puzzle:${userId}:${zoneId}`,
    [userId, zoneId]
  );

  // ── Persistence ──────────────────────────────────────────────────────────────

  const saveTimer = useCallback(
    (missionId: number, data: TimerData) => {
      if (!userId) return;
      memoryStore.set(getKey(missionId), data);
    },
    [userId, getKey]
  );

  const loadTimer = useCallback(
    (missionId: number, dureeMin: number): TimerData => {
      if (!userId) return { state: "idle", elapsed: 0, startedAt: null };

      const saved = memoryStore.get(getKey(missionId));
      if (!saved) return { state: "idle", elapsed: 0, startedAt: null };

      if (saved.state === "running" && saved.startedAt) {
        const passedSecs = Math.floor((Date.now() - saved.startedAt) / 1000);
        const newElapsed = saved.elapsed + passedSecs;
        const totalSecs  = dureeMin * 60;

        if (newElapsed >= totalSecs) {
          const failed: TimerData = { state: "fail", elapsed: totalSecs, startedAt: null };
          saveTimer(missionId, failed);
          return failed;
        }

        const resumed: TimerData = { 
          state: "running", 
          elapsed: newElapsed, 
          startedAt: Date.now() 
        };
        saveTimer(missionId, resumed);
        return resumed;
      }

      if (saved.state === "running" && !saved.startedAt) {
        const resumed: TimerData = { 
          state: "running", 
          elapsed: saved.elapsed, 
          startedAt: Date.now() 
        };
        saveTimer(missionId, resumed);
        return resumed;
      }

      return saved;
    },
    [userId, getKey, saveTimer]
  );

  const removeTimer = useCallback(
    (missionId: number) => {
      if (!userId) return;
      memoryStore.remove(getKey(missionId));
    },
    [userId, getKey]
  );

  // ── Interval management ──────────────────────────────────────────────────────

  const startInterval = useCallback(
    (missionId: number, dureeMin: number) => {
      if (intervalsRef.current[missionId]) {
        clearInterval(intervalsRef.current[missionId]);
      }

      const totalSecs = dureeMin * 60;

      intervalsRef.current[missionId] = setInterval(() => {
        const cur = timersRef.current[missionId];
        if (!cur || cur.state !== "running") {
          clearInterval(intervalsRef.current[missionId]);
          delete intervalsRef.current[missionId];
          return;
        }

        const newElapsed = cur.elapsed + 1;
        const isFail = newElapsed >= totalSecs;
        const next: TimerData = isFail
          ? { state: "fail", elapsed: totalSecs, startedAt: null }
          : { ...cur, elapsed: newElapsed };

        if (isFail) {
          clearInterval(intervalsRef.current[missionId]);
          delete intervalsRef.current[missionId];
          delete startedAtRef.current[missionId];
        }

        saveTimer(missionId, { ...next, startedAt: null });
        setTimers(prev => ({ ...prev, [missionId]: next }));
        timersRef.current = { ...timersRef.current, [missionId]: next };
      }, 1000);
    },
    [saveTimer]
  );

  const stopInterval = useCallback((missionId: number) => {
    if (intervalsRef.current[missionId]) {
      clearInterval(intervalsRef.current[missionId]);
      delete intervalsRef.current[missionId];
    }
    delete startedAtRef.current[missionId];
  }, []);

  const stopAllIntervals = useCallback(() => {
    Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
    startedAtRef.current = {};
  }, []);

  // ✅ PAUSER TOUS LES TIMERS (pour déconnexion)
  const pauseAllForDisconnect = useCallback(() => {
    const currentTimers = timersRef.current;
    const next = { ...currentTimers };

    Object.keys(next).forEach(idStr => {
      const id = Number(idStr);
      if (next[id]?.state === "running") {
        stopInterval(id);
        next[id] = { ...next[id], state: "paused", startedAt: null };
        saveTimer(id, next[id]);
      }
    });

    setTimers(next);
    timersRef.current = next;
  }, [stopInterval, saveTimer]);

  // ── Load puzzle ──────────────────────────────────────────────────────────────

  const loadPuzzle = useCallback(async () => {
    if (!userId) return;

    // ✅ D'abord vérifier le cache mémoire
    const cached = puzzleStore.get(getPuzzleKey());
    if (cached) {
      setPuzzle(cached);
      return;
    }

    try {
      const { data: config } = await supabase
        .from("puzzle_config")
        .select("id_puzzle, total_pieces")
        .eq("id_zone", zoneId)
        .single();

      if (!config) return;

      const { data: prog } = await supabase
        .from("puzzle_progress")
        .select("pieces_earned, is_complete")
        .eq("id_user", userId)
        .eq("id_puzzle", config.id_puzzle)
        .maybeSingle();

      const puzzleData: PuzzleInfo = {
        id_puzzle:     config.id_puzzle,
        total_pieces:  config.total_pieces,
        pieces_earned: prog?.pieces_earned ?? 0,
        is_complete:   prog?.is_complete ?? false,
      };

      setPuzzle(puzzleData);
      puzzleStore.set(getPuzzleKey(), puzzleData); // ✅ Mettre en cache
    } catch (e) {
      console.error("❌ loadPuzzle error:", e);
    }
  }, [userId, zoneId, getPuzzleKey]);

  // ── Main load ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) return;

    stopAllIntervals();
    setLoading(true);

    try {
      const [zoneMissions, sugg] = await Promise.all([
        fetchZoneMissions(userId, zoneId),
        fetchSuggestions(userId),
        loadPuzzle(),
      ]);

      const missionIds = (zoneMissions ?? []).map((m: any) => m.id_mission);
      let doneSet = new Set<number>();

      if (missionIds.length > 0) {
        const { data: validations } = await supabase
          .from("mission_validation")
          .select("id_mission")
          .eq("id_user", userId)
          .in("id_mission", missionIds);
        doneSet = new Set((validations ?? []).map((v: any) => v.id_mission));
      }

      const loaded: ZoneMission[] = (zoneMissions ?? []).map((m: any) => ({
        ...m,
        done: doneSet.has(m.id_mission),
      }));

      setMissions(loaded);
      setSuggestions(sugg ?? []);

      const initTimers: Record<number, TimerData> = {};
      for (const m of loaded) {
        if (m.done) {
          initTimers[m.id_mission] = { state: "done", elapsed: 0, startedAt: null };
        } else {
          initTimers[m.id_mission] = loadTimer(m.id_mission, m.duree_min ?? 30);
        }
      }
      setTimers(initTimers);
      timersRef.current = initTimers;

      for (const m of loaded) {
        const t = initTimers[m.id_mission];
        if (t?.state === "running") {
          startedAtRef.current[m.id_mission] = t.startedAt ?? Date.now();
          startInterval(m.id_mission, m.duree_min ?? 30);
        }
      }
    } catch (e) {
      console.error("❌ load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, zoneId, loadPuzzle, loadTimer, startInterval, stopAllIntervals]);

  // ✅ GESTION CONNEXION/DÉCONNEXION
  useEffect(() => {
    if (userId && userId !== prevUserId.current) {
      // Connexion : charger les données
      prevUserId.current = userId;
      load();
    } else if (!userId && prevUserId.current) {
      // Déconnexion : mettre en pause tous les timers
      pauseAllForDisconnect();
      prevUserId.current = null;
      setLoading(true);
    }
  }, [userId, load, pauseAllForDisconnect]);

  useEffect(() => {
    return stopAllIntervals;
  }, [stopAllIntervals]);

  // ── Timer actions ────────────────────────────────────────────────────────────

  const startTimer = useCallback(
    (missionId: number) => {
      const mission = missions.find(m => m.id_mission === missionId);
      if (!mission) return;

      const now = Date.now();
      startedAtRef.current[missionId] = now;

      const updated: TimerData = {
        state:     "running",
        elapsed:   timersRef.current[missionId]?.elapsed ?? 0,
        startedAt: now,
      };

      setTimers(prev => ({ ...prev, [missionId]: updated }));
      timersRef.current = { ...timersRef.current, [missionId]: updated };
      saveTimer(missionId, updated);
      startInterval(missionId, mission.duree_min ?? 30);
    },
    [missions, saveTimer, startInterval]
  );

  const pauseTimer = useCallback(
    (missionId: number) => {
      stopInterval(missionId);
      const updated: TimerData = {
        ...timersRef.current[missionId],
        state: "paused",
        startedAt: null,
      };
      setTimers(prev => ({ ...prev, [missionId]: updated }));
      timersRef.current = { ...timersRef.current, [missionId]: updated };
      saveTimer(missionId, updated);
    },
    [stopInterval, saveTimer]
  );

  const finishTimer = useCallback(
    (missionId: number) => {
      stopInterval(missionId);
      const updated: TimerData = { state: "done", elapsed: 0, startedAt: null };
      setTimers(prev => ({ ...prev, [missionId]: updated }));
      timersRef.current = { ...timersRef.current, [missionId]: updated };
      removeTimer(missionId);
    },
    [stopInterval, removeTimer]
  );

  const retryTimer = useCallback(
    (missionId: number) => {
      stopInterval(missionId);
      const reset: TimerData = { state: "idle", elapsed: 0, startedAt: null };
      setTimers(prev => ({ ...prev, [missionId]: reset }));
      timersRef.current = { ...timersRef.current, [missionId]: reset };
      removeTimer(missionId);
    },
    [stopInterval, removeTimer]
  );

  const pauseAllRunning = useCallback(() => {
    const currentTimers = timersRef.current;
    const next = { ...currentTimers };
    Object.keys(next).forEach(idStr => {
      const id = Number(idStr);
      if (next[id]?.state === "running") {
        stopInterval(id);
        next[id] = { ...next[id], state: "paused", startedAt: null };
        saveTimer(id, next[id]);
      }
    });
    setTimers(next);
    timersRef.current = next;
  }, [stopInterval, saveTimer]);

  const saveAllRunningForBackground = useCallback(() => {
    const currentTimers = timersRef.current;
    const now = Date.now();
    Object.keys(currentTimers).forEach(idStr => {
      const id = Number(idStr);
      const t = currentTimers[id];
      if (t?.state === "running") {
        saveTimer(id, { state: "running", elapsed: t.elapsed, startedAt: now });
      }
    });
  }, [saveTimer]);

  const hasRunningTimer = useCallback(
    () => Object.values(timers).some(t => t.state === "running"),
    [timers]
  );

  // ── Mission mutations ────────────────────────────────────────────────────────

  const markDone = useCallback((missionId: number) => {
    setMissions(prev =>
      prev.map(m => (m.id_mission === missionId ? { ...m, done: true } : m))
    );
  }, []);

  const acceptSuggestion = useCallback(
    async (mission: any) => {
      if (missions.length >= totalPieces) return;
      const updated = await assignMissionToZone(mission.id_mission, zoneId);
      if (updated) {
        setMissions(prev => [...prev, { ...updated, done: false }]);
        setSuggestions(prev => prev.filter(s => s.id_mission !== mission.id_mission));
        const newTimer: TimerData = { state: "idle", elapsed: 0, startedAt: null };
        setTimers(prev => ({ ...prev, [mission.id_mission]: newTimer }));
        timersRef.current = { ...timersRef.current, [mission.id_mission]: newTimer };
      }
    },
    [missions.length, totalPieces, zoneId]
  );

  const addMission = useCallback((mission: any) => {
    setMissions(prev => [...prev, { ...mission, done: false }]);
    const newTimer: TimerData = { state: "idle", elapsed: 0, startedAt: null };
    setTimers(prev => ({ ...prev, [mission.id_mission]: newTimer }));
    timersRef.current = { ...timersRef.current, [mission.id_mission]: newTimer };
  }, []);

  const updatePuzzle = useCallback((patch: Partial<PuzzleInfo>) => {
    setPuzzle(prev => {
      const updated = prev ? { ...prev, ...patch } : (patch as PuzzleInfo);
      // ✅ Mettre à jour le cache
      if (userId) puzzleStore.set(getPuzzleKey(), updated);
      return updated;
    });
  }, [userId, getPuzzleKey]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const slots        = Array.from({ length: totalPieces }, (_, i) => missions[i] ?? null);
  const doneMissions = missions.filter(m => m.done).length;
  const totalXp      = missions.reduce((sum, m) => sum + (m.xp_gain ?? 0), 0);
  const isComplete   = missions.length === totalPieces && doneMissions === totalPieces;

  const getTimer = useCallback(
    (id: number): TimerData => timers[id] ?? { state: "idle", elapsed: 0, startedAt: null },
    [timers]
  );

  return {
    missions,
    slots,
    suggestions,
    timers,
    puzzle,
    loading,
    doneMissions,
    totalXp,
    isComplete,
    getTimer,
    startTimer,
    pauseTimer,
    finishTimer,
    retryTimer,
    hasRunningTimer,
    pauseAllRunning,
    saveAllRunningForBackground,
    markDone,
    acceptSuggestion,
    addMission,
    updatePuzzle,
    reload: load,
  };
}