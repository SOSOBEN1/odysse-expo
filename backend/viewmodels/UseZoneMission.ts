/**
 * useZoneMissions.ts
 *
 * - Approche B : bouton 🏁 manuel, pause/reprise multi-jours
 * - finishTimer → RPC complete_mission uniquement (fait XP + pièce puzzle)
 * - Suggestions = missions user sans id_zone ET sans timer running/paused en BDD
 * - AsyncStorage pour persister les timers entre navigations
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../app/frontend/constants/supabase";
import {
  fetchZoneMissions,
  pauseMissionSession,
  resumeMissionSession,
  startMissionSession,
} from "../models/mission.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

export interface ZoneTimer {
  state: TimerState;
  elapsed: number;
  validationId: number | null;
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

export interface ZoneStatusModal {
  visible: boolean;
  type: "success" | "fail";
  missionTitle: string | undefined;
  xp: number;
  coins: number;
}

export interface PuzzleModal {
  visible: boolean;
  xp: number;
  piecesEarned: number;
  totalPieces: number;
}

// ─── AsyncStorage helpers ─────────────────────────────────────────────────────

const timerKey = (userId: string, zoneId: number, missionId: number) =>
  `zone_timer:${userId}:${zoneId}:${missionId}`;

async function saveTimerToStorage(
  userId: string, zoneId: number, missionId: number, timer: ZoneTimer,
) {
  try {
    await AsyncStorage.setItem(timerKey(userId, zoneId, missionId), JSON.stringify(timer));
  } catch {}
}

async function loadTimerFromStorage(
  userId: string, zoneId: number, missionId: number,
): Promise<ZoneTimer | null> {
  try {
    const raw = await AsyncStorage.getItem(timerKey(userId, zoneId, missionId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as ZoneTimer;

    if (saved.state === "running" && saved.startedAt) {
      const passedSecs = Math.floor((Date.now() - saved.startedAt) / 1000);
      return { ...saved, elapsed: saved.elapsed + passedSecs, startedAt: Date.now() };
    }
    return saved;
  } catch {
    return null;
  }
}

async function clearTimerFromStorage(userId: string, zoneId: number, missionId: number) {
  try {
    await AsyncStorage.removeItem(timerKey(userId, zoneId, missionId));
  } catch {}
}

// ─── Module-level store ───────────────────────────────────────────────────────

const pausedStore = new Map<string, ZoneTimer>();

function storeKey(userId: string, zoneId: number, missionId: number) {
  return `${userId}:${zoneId}:${missionId}`;
}

// ─── Puzzle cache ─────────────────────────────────────────────────────────────

const puzzleCache: Record<string, PuzzleInfo> = {};

// ─── Fetch suggestions ────────────────────────────────────────────────────────

async function fetchIdleSuggestions(userId: string): Promise<ZoneMission[]> {
  const { data: rawMissions, error } = await supabase
    .from("mission")
    .select("*")
    .eq("id_user", userId)
    .is("id_zone", null)
    .order("priorite", { ascending: false })
    .limit(20);

  if (error || !rawMissions) return [];

  const ids = rawMissions.map((m: any) => m.id_mission);
  if (ids.length === 0) return [];

  const { data: activeValidations } = await supabase
    .from("mission_validation")
    .select("id_mission")
    .eq("id_user", userId)
    .in("id_mission", ids)
    .in("statut", ["running", "paused"]);

  const activeIds = new Set((activeValidations ?? []).map((v: any) => v.id_mission));

  return rawMissions
    .filter((m: any) => !activeIds.has(m.id_mission))
    .map((m: any) => ({
      id_mission:   m.id_mission,
      titre:        m.titre        ?? "Sans titre",
      description:  m.description  ?? "",
      xp_gain:      m.xp_gain      ?? 0,
      energie_cout: m.energie_cout ?? 0,
      difficulte:   m.difficulte   ?? 1,
      duree_min:    m.duree_min    ?? 30,
      priorite:     m.priorite     ?? 1,
      done:         false,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useZoneMissions(
  userId: string | null,
  zoneId: number,
) {
  const [missions,     setMissions]     = useState<ZoneMission[]>([]);
  const [suggestions,  setSuggestions]  = useState<ZoneMission[]>([]);
  const [timers,       setTimers]       = useState<Record<number, ZoneTimer>>({});
  const [puzzle,       setPuzzle]       = useState<PuzzleInfo | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [statusModal,  setStatusModal]  = useState<ZoneStatusModal>({
    visible: false, type: "success", missionTitle: undefined, xp: 0, coins: 0,
  });
  const [puzzleModal,  setPuzzleModal]  = useState<PuzzleModal>({
    visible: false, xp: 0, piecesEarned: 0, totalPieces: 0,
  });
  const [zoneUnlocked, setZoneUnlocked] = useState(false);
  const [nextZoneId,   setNextZoneId]   = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missionsRef = useRef<ZoneMission[]>([]);
  const timersRef   = useRef<Record<number, ZoneTimer>>({});

  useEffect(() => { missionsRef.current = missions; }, [missions]);
  useEffect(() => { timersRef.current   = timers;   }, [timers]);

  // ── Load puzzle ──────────────────────────────────────────────────────────────

  const loadPuzzle = useCallback(async () => {
    if (!userId) return;
    const cacheKey = `${userId}:${zoneId}`;
    if (puzzleCache[cacheKey]) {
      setPuzzle(puzzleCache[cacheKey]);
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

      const info: PuzzleInfo = {
        id_puzzle:     config.id_puzzle,
        total_pieces:  config.total_pieces,
        pieces_earned: prog?.pieces_earned ?? 0,
        is_complete:   prog?.is_complete   ?? false,
      };
      setPuzzle(info);
      puzzleCache[cacheKey] = info;
    } catch (e) {
      console.error("❌ loadPuzzle:", e);
    }
  }, [userId, zoneId]);

  // ── Main load ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    delete puzzleCache[`${userId}:${zoneId}`];
    try {
      const [rawMissions, suggMissions] = await Promise.all([
        fetchZoneMissions(userId, zoneId),
        fetchIdleSuggestions(userId),
        loadPuzzle(),
      ]);

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

      const loaded: ZoneMission[] = (rawMissions ?? [])
        .filter((m: any, idx: number, arr: any[]) =>
          arr.findIndex(x => x.id_mission === m.id_mission) === idx
        )
        .map((m: any) => ({
          id_mission:   m.id_mission,
          titre:        m.titre        ?? "Sans titre",
          description:  m.description  ?? "",
          xp_gain:      m.xp_gain      ?? 0,
          energie_cout: m.energie_cout ?? 0,
          difficulte:   m.difficulte   ?? 1,
          duree_min:    m.duree_min    ?? 30,
          priorite:     m.priorite     ?? 1,
          done:         doneSet.has(m.id_mission),
        }));

      setMissions(loaded);
      setSuggestions(suggMissions);

      const initTimers: Record<number, ZoneTimer> = {};
      for (const m of loaded) {
        if (m.done) {
          initTimers[m.id_mission] = { state: "done", elapsed: 0, validationId: null, startedAt: null };
          continue;
        }

        const memKey   = storeKey(userId, zoneId, m.id_mission);
        const memTimer = pausedStore.get(memKey);
        if (memTimer && memTimer.state !== "idle") {
          pausedStore.delete(memKey);
          initTimers[m.id_mission] = memTimer;
          continue;
        }

        const stored = await loadTimerFromStorage(userId, zoneId, m.id_mission);
        if (stored && stored.state !== "idle") {
          initTimers[m.id_mission] = stored;
          continue;
        }

        const { data: val } = await supabase
          .from("mission_validation")
          .select("id_validation, statut")
          .eq("id_user", userId)
          .eq("id_mission", m.id_mission)
          .in("statut", ["running", "paused"])
          .maybeSingle();

        if (val) {
          initTimers[m.id_mission] = {
            state:        val.statut as TimerState,
            elapsed:      0,
            validationId: val.id_validation,
            startedAt:    null,
          };
        } else {
          initTimers[m.id_mission] = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
        }
      }

      setTimers(initTimers);
      timersRef.current = initTimers;
    } catch (e) {
      console.error("❌ load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, zoneId, loadPuzzle]);

  useEffect(() => { load(); }, [load]);

  // ── Cleanup au démontage ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (!userId) return;
      Object.entries(timersRef.current).forEach(([id, timer]) => {
        if (timer.state !== "running") return;
        const missionId = Number(id);
        const t = { ...timer, startedAt: timer.startedAt ?? Date.now() };
        pausedStore.set(storeKey(userId, zoneId, missionId), t);
        saveTimerToStorage(userId, zoneId, missionId, t).catch(() => {});
      });
    };
  }, [userId, zoneId]);

  // ── Ticker global ─────────────────────────────────────────────────────────────

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.entries(updated).forEach(([id, timer]) => {
          if (timer.state !== "running") return;
          const missionId = Number(id);
          updated[missionId] = { ...timer, elapsed: timer.elapsed + 1 };
          changed = true;
          if (updated[missionId].elapsed % 10 === 0 && userId) {
            saveTimerToStorage(userId, zoneId, missionId, updated[missionId]).catch(() => {});
          }
        });
        return changed ? updated : prev;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [userId, zoneId]);

  // ── getTimer ──────────────────────────────────────────────────────────────────

  const getTimer = useCallback(
    (id: number): ZoneTimer =>
      timers[id] ?? { state: "idle", elapsed: 0, validationId: null, startedAt: null },
    [timers],
  );

  // ── startTimer ────────────────────────────────────────────────────────────────

  const startTimer = useCallback(async (missionId: number) => {
    if (!userId) return;
    const timer = timersRef.current[missionId];
    try {
      let updated: ZoneTimer;
      if (timer?.state === "paused" && timer.validationId) {
        await resumeMissionSession(timer.validationId);
        updated = { ...timer, state: "running", startedAt: Date.now() };
      } else {
        const validationId = await startMissionSession(userId, missionId);
        updated = { state: "running", elapsed: timer?.elapsed ?? 0, validationId, startedAt: Date.now() };
      }
      setTimers(prev => ({ ...prev, [missionId]: updated }));
      timersRef.current = { ...timersRef.current, [missionId]: updated };
      await saveTimerToStorage(userId, zoneId, missionId, updated);
    } catch (e) {
      console.error("❌ startTimer:", e);
    }
  }, [userId, zoneId]);

  // ── pauseTimer ────────────────────────────────────────────────────────────────

  const pauseTimer = useCallback(async (missionId: number) => {
    if (!userId) return;
    const timer = timersRef.current[missionId];
    if (!timer?.validationId) return;
    try {
      await pauseMissionSession(timer.validationId);
      const updated: ZoneTimer = { ...timer, state: "paused", startedAt: null };
      setTimers(prev => ({ ...prev, [missionId]: updated }));
      timersRef.current = { ...timersRef.current, [missionId]: updated };
      await saveTimerToStorage(userId, zoneId, missionId, updated);
    } catch (e) {
      console.error("❌ pauseTimer:", e);
    }
  }, [userId, zoneId]);

  // ── finishTimer ───────────────────────────────────────────────────────────────

  const finishTimer = useCallback(async (missionId: number) => {
    if (!userId) return;
    const timer = timersRef.current[missionId];
    if (!timer || timer.state === "done" || timer.state === "fail") return;

    try {
      const { data, error } = await supabase.rpc("complete_mission", {
        p_user_id:    parseInt(userId, 10),
        p_mission_id: missionId,
      });

      console.log("✅ complete_mission:", JSON.stringify(data), "error:", error);

      if (error) {
        console.error("❌ RPC error:", error);
        return;
      }

      if (data?.error) {
        console.error("❌ RPC logic error:", data.error);
        return;
      }

      // Timer → done
      const done: ZoneTimer = { ...timer, state: "done", startedAt: null };
      setTimers(prev => ({ ...prev, [missionId]: done }));
      timersRef.current = { ...timersRef.current, [missionId]: done };
      await clearTimerFromStorage(userId, zoneId, missionId);

      // Mission → done
      setMissions(prev =>
        prev.map(m => m.id_mission === missionId ? { ...m, done: true } : m),
      );

      // Mettre à jour le puzzle
      if (data?.pieces_earned !== undefined) {
        setPuzzle(prev => {
          const newPuzzle: PuzzleInfo = {
            id_puzzle:     prev?.id_puzzle    ?? 0,
            total_pieces:  prev?.total_pieces ?? 0,
            pieces_earned: data.pieces_earned,
            is_complete:   data.puzzle_complete ?? false,
          };
          puzzleCache[`${userId}:${zoneId}`] = newPuzzle;
          return newPuzzle;
        });
      }

      // Modal pièce puzzle
      const mission = missionsRef.current.find(m => m.id_mission === missionId);
      setPuzzleModal({
        visible:      true,
        xp:           data?.xp_gained    ?? mission?.xp_gain ?? 0,
        piecesEarned: data?.pieces_earned ?? 0,
        totalPieces:  data?.total_pieces  ?? 0,
      });

      // Zone débloquée
      if (data?.zone_unlocked && data?.next_zone_id) {
        setNextZoneId(data.next_zone_id);
        setTimeout(() => setZoneUnlocked(true), 1500);
      }
    } catch (e) {
      console.error("❌ finishTimer:", e);
    }
  }, [userId, zoneId]);

  // ── retryTimer ────────────────────────────────────────────────────────────────

  const retryTimer = useCallback(async (missionId: number) => {
    if (!userId) return;
    const reset: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
    setTimers(prev => ({ ...prev, [missionId]: reset }));
    timersRef.current = { ...timersRef.current, [missionId]: reset };
    await clearTimerFromStorage(userId, zoneId, missionId);
  }, [userId, zoneId]);

  // ── pauseAllRunning ───────────────────────────────────────────────────────────

  const pauseAllRunning = useCallback(async () => {
    if (!userId) return;
    const current = { ...timersRef.current };
    for (const [id, timer] of Object.entries(current)) {
      if (timer.state !== "running") continue;
      const missionId = Number(id);
      try {
        if (timer.validationId) await pauseMissionSession(timer.validationId);
        const paused: ZoneTimer = { ...timer, state: "paused", startedAt: null };
        current[missionId] = paused;
        await saveTimerToStorage(userId, zoneId, missionId, paused);
      } catch {}
    }
    setTimers(current);
    timersRef.current = current;
  }, [userId, zoneId]);

  // ── saveAllRunningForBackground ───────────────────────────────────────────────

  const saveAllRunningForBackground = useCallback(async () => {
    if (!userId) return;
    for (const [id, timer] of Object.entries(timersRef.current)) {
      if (timer.state !== "running") continue;
      const missionId = Number(id);
      const t = { ...timer, startedAt: timer.startedAt ?? Date.now() };
      pausedStore.set(storeKey(userId, zoneId, missionId), t);
      await saveTimerToStorage(userId, zoneId, missionId, t);
    }
  }, [userId, zoneId]);

  const hasRunningTimer = useCallback(
    () => Object.values(timersRef.current).some(t => t.state === "running"),
    [],
  );

  // ── acceptSuggestion ──────────────────────────────────────────────────────────

  const acceptSuggestion = useCallback(async (mission: ZoneMission) => {
    if (!userId || missions.length >= (puzzle?.total_pieces ?? 0)) return;
    try {
      const { error } = await supabase
        .from("mission")
        .update({ id_zone: zoneId })
        .eq("id_mission", mission.id_mission);
      if (error) throw error;

      setMissions(prev => {
        if (prev.some(m => m.id_mission === mission.id_mission)) return prev;
        return [...prev, { ...mission, done: false }];
      });
      setSuggestions(prev => prev.filter(s => s.id_mission !== mission.id_mission));
      const newTimer: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
      setTimers(prev => ({ ...prev, [mission.id_mission]: newTimer }));
      timersRef.current = { ...timersRef.current, [mission.id_mission]: newTimer };
    } catch (e) {
      console.error("❌ acceptSuggestion:", e);
    }
  }, [userId, zoneId, missions.length, puzzle]);

  // ── addMission ────────────────────────────────────────────────────────────────

  const addMission = useCallback((raw: any) => {
    const m: ZoneMission = {
      id_mission:   raw.id_mission,
      titre:        raw.titre        ?? "Sans titre",
      description:  raw.description  ?? "",
      xp_gain:      raw.xp_gain      ?? 0,
      energie_cout: raw.energie_cout ?? 0,
      difficulte:   raw.difficulte   ?? 1,
      duree_min:    raw.duree_min    ?? 30,
      priorite:     raw.priorite     ?? 1,
      done:         false,
    };
    setMissions(prev => {
      if (prev.some(x => x.id_mission === raw.id_mission)) return prev;
      return [...prev, m];
    });
    const newTimer: ZoneTimer = { state: "idle", elapsed: 0, validationId: null, startedAt: null };
    setTimers(prev => ({ ...prev, [m.id_mission]: newTimer }));
    timersRef.current = { ...timersRef.current, [m.id_mission]: newTimer };
  }, []);

  // ── closeStatusModal ──────────────────────────────────────────────────────────

  const closeStatusModal = useCallback(() => {
    setStatusModal(prev => ({ ...prev, visible: false }));
  }, []);

  const closePuzzleModal = useCallback(() => {
    setPuzzleModal(prev => ({ ...prev, visible: false }));
  }, []);

  const closeZoneUnlocked = useCallback(() => setZoneUnlocked(false), []);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const slots        = Array.from({ length: puzzle?.total_pieces ?? 0 }, (_, i) => missions[i] ?? null);
  const doneMissions = missions.filter(m => m.done).length;

  return {
    missions,
    slots,
    suggestions,
    timers,
    puzzle,
    loading,
    statusModal,
    puzzleModal,
    zoneUnlocked,
    nextZoneId,
    doneMissions,
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
    closePuzzleModal,
    closeZoneUnlocked,
    reload: load,
  };
}