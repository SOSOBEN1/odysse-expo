// /**
//  * useZoneMissions.ts
//  *
//  * Single source of truth for zone missions, timers, puzzle progress, and suggestions.
//  * ZoneScreen should ONLY read from this hook — no local missions/puzzle state needed.
//  */

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useCallback, useEffect, useRef, useState } from "react";
// import { supabase } from "../../app/frontend/constants/supabase";
// import {
//   assignMissionToZone,
//   fetchSuggestions,
//   fetchZoneMissions,
// } from "../models/mission.service";

// // ─── Types ─────────────────────────────────────────────────────────────────────

// export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

// export interface TimerData {
//   state: TimerState;
//   elapsed: number;
//   startedAt: number | null;
// }

// export interface ZoneMission {
//   id_mission: number;
//   titre: string;
//   description: string;
//   xp_gain: number;
//   energie_cout: number;
//   difficulte: number;
//   duree_min: number;
//   priorite: number;
//   done: boolean;
// }

// export interface PuzzleInfo {
//   id_puzzle: number;
//   total_pieces: number;
//   pieces_earned: number;
//   is_complete: boolean;
// }

// // ─── Timer key ─────────────────────────────────────────────────────────────────

// const timerKey = (userId: string | number, zoneId: string | number, missionId: number) =>
//   `timer:${userId}:${zoneId}:${missionId}`;

// // ─── Hook ──────────────────────────────────────────────────────────────────────

// export function useZoneMissions(
//   userId: string | null,
//   zoneId: number,
//   totalPieces: number
// ) {
//   const [missions,    setMissions]    = useState<ZoneMission[]>([]);
//   const [suggestions, setSuggestions] = useState<any[]>([]);
//   const [timers,      setTimers]      = useState<Record<number, TimerData>>({});
//   const [puzzle,      setPuzzle]      = useState<PuzzleInfo | null>(null);
//   const [loading,     setLoading]     = useState(true);

//   const intervalsRef  = useRef<Record<number, ReturnType<typeof setInterval>>>({});
//   const startedAtRef  = useRef<Record<number, number>>({});

//   // ── Timer persistence ────────────────────────────────────────────────────────

//   const saveTimer = useCallback(
//     async (missionId: number, data: TimerData) => {
//       if (!userId) return;
//       try {
//         await AsyncStorage.setItem(
//           timerKey(userId, zoneId, missionId),
//           JSON.stringify(data)
//         );
//       } catch {}
//     },
//     [userId, zoneId]
//   );

//   const loadTimerFromStorage = useCallback(
//     async (missionId: number, dureeMin: number): Promise<TimerData> => {
//       if (!userId) return { state: "idle", elapsed: 0, startedAt: null };
//       try {
//         const raw = await AsyncStorage.getItem(timerKey(userId, zoneId, missionId));
//         if (!raw) return { state: "idle", elapsed: 0, startedAt: null };

//         const saved: TimerData = JSON.parse(raw);

//         if (saved.state === "running" && saved.startedAt) {
//           const passedSecs = Math.floor((Date.now() - saved.startedAt) / 1000);
//           const newElapsed = saved.elapsed + passedSecs;
//           const totalSecs  = dureeMin * 60;

//           if (newElapsed >= totalSecs) {
//             const failed: TimerData = { state: "fail", elapsed: totalSecs, startedAt: null };
//             await saveTimer(missionId, failed);
//             return failed;
//           }

//           const resumed: TimerData = { state: "running", elapsed: newElapsed, startedAt: Date.now() };
//           await saveTimer(missionId, resumed);
//           return resumed;
//         }

//         return saved;
//       } catch {
//         return { state: "idle", elapsed: 0, startedAt: null };
//       }
//     },
//     [userId, zoneId, saveTimer]
//   );

//   // ── Timer interval management ────────────────────────────────────────────────

//   const startInterval = useCallback(
//     (missionId: number, dureeMin: number) => {
//       // Clear any existing interval first
//       clearInterval(intervalsRef.current[missionId]);

//       const totalSecs = dureeMin * 60;
//       intervalsRef.current[missionId] = setInterval(() => {
//         setTimers(prev => {
//           const cur = prev[missionId];
//           if (!cur || cur.state !== "running") return prev;

//           const newElapsed = cur.elapsed + 1;
//           const next: TimerData =
//             newElapsed >= totalSecs
//               ? { state: "fail", elapsed: totalSecs, startedAt: null }
//               : { ...cur, elapsed: newElapsed };

//           if (next.state === "fail") {
//             clearInterval(intervalsRef.current[missionId]);
//             delete startedAtRef.current[missionId];
//           }
//           saveTimer(missionId, next);
//           return { ...prev, [missionId]: next };
//         });
//       }, 1000);
//     },
//     [saveTimer]
//   );

//   const stopInterval = useCallback((missionId: number) => {
//     clearInterval(intervalsRef.current[missionId]);
//     delete intervalsRef.current[missionId];
//     delete startedAtRef.current[missionId];
//   }, []);

//   const stopAllIntervals = useCallback(() => {
//     Object.values(intervalsRef.current).forEach(clearInterval);
//     intervalsRef.current = {};
//     startedAtRef.current = {};
//   }, []);

//   // ── Load puzzle ──────────────────────────────────────────────────────────────

//   const loadPuzzle = useCallback(async () => {
//     if (!userId) return;
//     const { data: config } = await supabase
//       .from("puzzle_config")
//       .select("id_puzzle, total_pieces")
//       .eq("id_zone", zoneId)
//       .single();

//     if (!config) return;

//     const { data: prog } = await supabase
//       .from("puzzle_progress")
//       .select("pieces_earned, is_complete")
//       .eq("id_user", userId)
//       .eq("id_puzzle", config.id_puzzle)
//       .maybeSingle();

//     setPuzzle({
//       id_puzzle:     config.id_puzzle,
//       total_pieces:  config.total_pieces,
//       pieces_earned: prog?.pieces_earned ?? 0,
//       is_complete:   prog?.is_complete   ?? false,
//     });
//   }, [userId, zoneId]);

//   // ── Main load ────────────────────────────────────────────────────────────────

//   const load = useCallback(async () => {
//     if (!userId) return;

//     // Stop any running intervals before reload to prevent duplicates
//     stopAllIntervals();
//     setLoading(true);

//     try {
//       const [zoneMissions, sugg] = await Promise.all([
//         fetchZoneMissions(userId, zoneId),
//         fetchSuggestions(userId),
//         loadPuzzle(),
//       ]);

//       // Fetch validation statuses to populate `done`
//       const missionIds = (zoneMissions ?? []).map((m: any) => m.id_mission);
//       let doneSet = new Set<number>();

//       if (missionIds.length > 0) {
//         const { data: validations } = await supabase
//           .from("mission_validation")
//           .select("id_mission")
//           .eq("id_user", userId)
//           .in("id_mission", missionIds);
//         doneSet = new Set((validations ?? []).map((v: any) => v.id_mission));
//       }

//       const loaded: ZoneMission[] = (zoneMissions ?? []).map((m: any) => ({
//         ...m,
//         done: doneSet.has(m.id_mission),
//       }));

//       setMissions(loaded);
//       setSuggestions(sugg ?? []);

//       // Load timers and restart running intervals
//       const initTimers: Record<number, TimerData> = {};
//       for (const m of loaded) {
//         if (m.done) {
//           initTimers[m.id_mission] = { state: "done", elapsed: 0, startedAt: null };
//         } else {
//           initTimers[m.id_mission] = await loadTimerFromStorage(m.id_mission, m.duree_min ?? 30);
//         }
//       }
//       setTimers(initTimers);

//       // Restart intervals for running timers (e.g. after background return)
//       for (const m of loaded) {
//         const t = initTimers[m.id_mission];
//         if (t?.state === "running") {
//           startedAtRef.current[m.id_mission] = t.startedAt ?? Date.now();
//           startInterval(m.id_mission, m.duree_min ?? 30);
//         }
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [userId, zoneId, loadPuzzle, loadTimerFromStorage, startInterval, stopAllIntervals]);

//   // Initial load
//   useEffect(() => {
//     load();
//     return stopAllIntervals; // cleanup on unmount
//   }, [load]);

//   // ── Timer actions (called by ZoneScreen) ─────────────────────────────────────

//   const startTimer = useCallback(
//     (missionId: number) => {
//       const mission = missions.find(m => m.id_mission === missionId);
//       if (!mission) return;

//       const now = Date.now();
//       startedAtRef.current[missionId] = now;

//       const next: TimerData = { state: "running", elapsed: 0, startedAt: now };
//       setTimers(prev => {
//         // Preserve elapsed if resuming from paused
//         const cur = prev[missionId];
//         const updated: TimerData = {
//           state:     "running",
//           elapsed:   cur?.elapsed ?? 0,
//           startedAt: now,
//         };
//         saveTimer(missionId, updated);
//         return { ...prev, [missionId]: updated };
//       });

//       startInterval(missionId, mission.duree_min ?? 30);
//     },
//     [missions, saveTimer, startInterval]
//   );

//   const pauseTimer = useCallback(
//     (missionId: number) => {
//       stopInterval(missionId);
//       setTimers(prev => {
//         const updated: TimerData = { ...prev[missionId], state: "paused", startedAt: null };
//         saveTimer(missionId, updated);
//         return { ...prev, [missionId]: updated };
//       });
//     },
//     [stopInterval, saveTimer]
//   );

//   const finishTimer = useCallback(
//     async (missionId: number) => {
//       stopInterval(missionId);
//       setTimers(prev => {
//         const updated: TimerData = { ...prev[missionId], state: "done", startedAt: null };
//         saveTimer(missionId, updated);
//         return { ...prev, [missionId]: updated };
//       });
//       if (userId) {
//         await AsyncStorage.removeItem(timerKey(userId, zoneId, missionId));
//       }
//     },
//     [stopInterval, saveTimer, userId, zoneId]
//   );

//   const retryTimer = useCallback(
//     async (missionId: number) => {
//       stopInterval(missionId);
//       const reset: TimerData = { state: "idle", elapsed: 0, startedAt: null };
//       setTimers(prev => ({ ...prev, [missionId]: reset }));
//       if (userId) {
//         await AsyncStorage.removeItem(timerKey(userId, zoneId, missionId));
//       }
//     },
//     [stopInterval, userId, zoneId]
//   );

//   /** Call before navigating away while a timer is running */
//   const pauseAllRunning = useCallback(() => {
//     setTimers(prev => {
//       const next = { ...prev };
//       Object.keys(next).forEach(idStr => {
//         const id = Number(idStr);
//         if (next[id]?.state === "running") {
//           stopInterval(id);
//           next[id] = { ...next[id], state: "paused", startedAt: null };
//           saveTimer(id, next[id]);
//         }
//       });
//       return next;
//     });
//   }, [stopInterval, saveTimer]);

//   /** Save startedAt so elapsed can be recovered after returning */
//   const saveAllRunningForBackground = useCallback(async () => {
//     const saves: Promise<void>[] = [];
//     Object.keys(timers).forEach(idStr => {
//       const id = Number(idStr);
//       const t  = timers[id];
//       if (t?.state === "running") {
//         const toSave: TimerData = {
//           ...t,
//           startedAt: startedAtRef.current[id] ?? t.startedAt ?? Date.now(),
//         };
//         saves.push(saveTimer(id, toSave));
//       }
//     });
//     await Promise.all(saves);
//   }, [timers, saveTimer]);

//   const hasRunningTimer = useCallback(
//     () => Object.values(timers).some(t => t.state === "running"),
//     [timers]
//   );

//   // ── Mission mutations ────────────────────────────────────────────────────────

//   const markDone = useCallback((missionId: number) => {
//     setMissions(prev =>
//       prev.map(m => (m.id_mission === missionId ? { ...m, done: true } : m))
//     );
//   }, []);

//   const updateMissionLocal = useCallback(
//     (missionId: number, patch: Partial<ZoneMission>) => {
//       setMissions(prev =>
//         prev.map(m => (m.id_mission === missionId ? { ...m, ...patch } : m))
//       );
//     },
//     []
//   );

//   const acceptSuggestion = useCallback(
//     async (mission: any) => {
//       if (missions.length >= totalPieces) return;
//       const updated = await assignMissionToZone(mission.id_mission, zoneId);
//       if (updated) {
//         setMissions(prev => [...prev, { ...updated, done: false }]);
//         setSuggestions(prev =>
//           prev.filter(s => s.id_mission !== mission.id_mission)
//         );
//         // Init timer for the new mission
//         setTimers(prev => ({
//           ...prev,
//           [mission.id_mission]: { state: "idle", elapsed: 0, startedAt: null },
//         }));
//       }
//     },
//     [missions.length, totalPieces, zoneId]
//   );

//   const addMission = useCallback((mission: any) => {
//     setMissions(prev => [...prev, { ...mission, done: false }]);
//     setTimers(prev => ({
//       ...prev,
//       [mission.id_mission]: { state: "idle", elapsed: 0, startedAt: null },
//     }));
//   }, []);

//   // ── Puzzle mutations ─────────────────────────────────────────────────────────

//   const updatePuzzle = useCallback((patch: Partial<PuzzleInfo>) => {
//     setPuzzle(prev => (prev ? { ...prev, ...patch } : prev));
//   }, []);

//   // ── Derived values ───────────────────────────────────────────────────────────

//   const slots       = Array.from({ length: totalPieces }, (_, i) => missions[i] ?? null);
//   const doneMissions = missions.filter(m => m.done).length;
//   const totalXp     = missions.reduce((sum, m) => sum + (m.xp_gain ?? 0), 0);
//   const isComplete  = missions.length === totalPieces && doneMissions === totalPieces;

//   const getTimer = useCallback(
//     (id: number): TimerData =>
//       timers[id] ?? { state: "idle", elapsed: 0, startedAt: null },
//     [timers]
//   );

//   return {
//     // Data
//     missions,
//     slots,
//     suggestions,
//     timers,
//     puzzle,
//     loading,
//     // Derived
//     doneMissions,
//     totalXp,
//     isComplete,
//     // Timer actions
//     getTimer,
//     startTimer,
//     pauseTimer,
//     finishTimer,
//     retryTimer,
//     hasRunningTimer,
//     pauseAllRunning,
//     saveAllRunningForBackground,
//     // Mission actions
//     markDone,
//     updateMissionLocal,
//     acceptSuggestion,
//     addMission,
//     // Puzzle
//     updatePuzzle,
//     // Reload (for useFocusEffect)
//     reload: load,
//   };
// }