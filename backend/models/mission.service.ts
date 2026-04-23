// ============================================================
//  mission.service.ts
//  Toutes les opérations Supabase liées aux missions.
//  Importer supabase depuis votre constante existante.
// ============================================================

import { supabase } from "../../app/frontend/constants/supabase";
import type {
  Mission,
  MissionCreatePayload,
  MissionRow,
  MissionTimer,
  MissionUpdatePayload,
  TimerState,
} from "./mission.types";
import {
  computeMissionGains,
  computeSessionXP,
  formatDuration,
  getTodayBounds,
  isDeadlinePassed,
  mapDifficulty,
} from "./mission.utils";

// ─────────────────────────────────────────────────────────────
//  FETCH
// ─────────────────────────────────────────────────────────────

/**
 * Récupère toutes les missions + validations du user,
 * puis construit les objets Mission[] et Record<id, MissionTimer>.
 */
export const fetchMissions = async (
  userId: string
): Promise<{ missions: Mission[]; timers: Record<number, MissionTimer> }> => {
  // 1️⃣ Missions (templates)
  const { data: missionsData, error: errM } = await supabase
    .from("mission")
    .select(`
      id_mission,
      titre,
      description,
      duree_min,
      difficulte,
      priorite,
      id_boss,
      date_limite,
      statut,
      boss_events ( nom )
    `)
    .order("id_mission", { ascending: false });

  if (errM) throw errM;

  // 2️⃣ Validations du user
  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("*")
    .eq("id_user", userId);

  if (errV) throw errV;

  // 🔥 Index validations par id_mission
  const validationMap: Record<number, any> = {};
  (validations ?? []).forEach(v => { validationMap[v.id_mission] = v; });

  const { start: todayStart, end: todayEnd } = getTodayBounds();
  const now = Date.now();

  // 3️⃣ Mapping → Mission[]
  const missions: Mission[] = (missionsData ?? []).map((m: MissionRow) => {
    const validation = validationMap[m.id_mission];
    const isToday =
      validation?.date_debut &&
      new Date(validation.date_debut) >= todayStart &&
      new Date(validation.date_debut) <= todayEnd;

    return {
      id:          m.id_mission,
      event:       m.id_boss != null ? (m.boss_events?.nom ?? "Événement") : null,
      title:       m.titre ?? "Sans titre",
      duration:    formatDuration(m.duree_min),
      description: m.description ?? "",
      difficulty:  mapDifficulty(m.difficulte ?? 1),
      progress:    0,
      urgent:      (m.priorite ?? 1) >= 4,
      today:       !!isToday,
      dateLimite:  m.date_limite ? new Date(m.date_limite) : null,
    };
  });

  // 4️⃣ Construction des timers
  const timers: Record<number, MissionTimer> = {};

  (missionsData ?? []).forEach((m: MissionRow) => {
    const validation   = validationMap[m.id_mission];
    const dateLimite   = m.date_limite ? new Date(m.date_limite) : null;

    // Deadline dépassée non terminée → fail
    if (isDeadlinePassed(dateLimite) && m.statut !== "done" && m.statut !== "fail") {
      updateMissionStatut(m.id_mission, "fail"); // fire & forget
      timers[m.id_mission] = {
        state: "fail", elapsed: 0,
        validationId: validation?.id_validation ?? null,
        startedAt:    validation?.date_debut ? new Date(validation.date_debut) : null,
      };
      return;
    }

    if (validation) {
      timers[m.id_mission] = {
        state:       m.statut as TimerState,
        elapsed:     0,
        validationId: validation.id_validation,
        startedAt:   validation.date_debut ? new Date(validation.date_debut) : null,
      };
    } else {
      timers[m.id_mission] = {
        state: "idle", elapsed: 0, validationId: null, startedAt: null,
      };
    }
  });

  return { missions, timers };
};

// ─────────────────────────────────────────────────────────────
//  STATUT
// ─────────────────────────────────────────────────────────────

/** Met à jour le champ `statut` dans la table `mission`. */
export const updateMissionStatut = async (
  missionId: number,
  statut: TimerState
): Promise<void> => {
  await supabase
    .from("mission")
    .update({ statut })
    .eq("id_mission", missionId);
};

// ─────────────────────────────────────────────────────────────
//  TIMER : START
// ─────────────────────────────────────────────────────────────

/**
 * Démarre une nouvelle session (INSERT mission_validation).
 * Retourne l'id_validation créé.
 */
export const startMissionSession = async (
  userId: string,
  missionId: number
): Promise<number> => {
  const now = new Date();
  const { data, error } = await supabase
    .from("mission_validation")
    .insert({ id_user: userId, id_mission: missionId, date_debut: now.toISOString() })
    .select("id_validation")
    .single();

  if (error) throw error;
  await updateMissionStatut(missionId, "running");
  return data.id_validation;
};

/** Reprend une session déjà existante (juste le statut). */
export const resumeMissionSession = async (missionId: number): Promise<void> => {
  await updateMissionStatut(missionId, "running");
};

// ─────────────────────────────────────────────────────────────
//  TIMER : PAUSE
// ─────────────────────────────────────────────────────────────

export const pauseMissionSession = async (missionId: number): Promise<void> => {
  await updateMissionStatut(missionId, "paused");
};

// ─────────────────────────────────────────────────────────────
//  TIMER : FINISH (succès)
// ─────────────────────────────────────────────────────────────

/**
 * Termine une mission avec succès.
 * Met à jour mission_validation (date_fin, xp_obtenu) + statut.
 */
export const finishMissionSession = async (
  missionId: number,
  validationId: number | null,
  elapsedSeconds: number
): Promise<void> => {
  const now = new Date();
  const xp  = computeSessionXP(elapsedSeconds);

  if (validationId) {
    const { error } = await supabase
      .from("mission_validation")
      .update({ date_fin: now.toISOString(), xp_obtenu: xp })
      .eq("id_validation", validationId);

    if (error) throw error;
  }

  await updateMissionStatut(missionId, "done");
};

// ─────────────────────────────────────────────────────────────
//  TIMER : FAIL (deadline dépassée)
// ─────────────────────────────────────────────────────────────

export const failMissionSession = async (missionId: number): Promise<void> => {
  await updateMissionStatut(missionId, "fail");
};

// ─────────────────────────────────────────────────────────────
//  CRUD : CRÉER
// ─────────────────────────────────────────────────────────────

/**
 * Crée une nouvelle mission dans Supabase.
 * Calcule automatiquement les gains depuis difficulte + priorite.
 */
export const createMission = async (
  payload: Omit<MissionCreatePayload, "xp_gain" | "energie_cout" | "stress_gain" | "connaissance_gain" | "organisation_gain">
): Promise<MissionRow> => {
  const gains = computeMissionGains(payload.difficulte, payload.priorite);
  const { data, error } = await supabase
    .from("mission")
    .insert({ ...payload, ...gains })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────
//  CRUD : METTRE À JOUR
// ─────────────────────────────────────────────────────────────

/**
 * Met à jour une mission existante.
 * Si difficulte ou priorite changent, recalcule les gains.
 */
export const updateMission = async (
  missionId: number,
  payload: MissionUpdatePayload
): Promise<MissionRow> => {
  let extra = {};
  if (payload.difficulte !== undefined && payload.priorite !== undefined) {
    extra = computeMissionGains(payload.difficulte, payload.priorite);
  }

  const { data, error } = await supabase
    .from("mission")
    .update({ ...payload, ...extra })
    .eq("id_mission", missionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────
//  CRUD : SUPPRIMER
// ─────────────────────────────────────────────────────────────

export const deleteMission = async (missionId: number): Promise<void> => {
  const { error } = await supabase
    .from("mission")
    .delete()
    .eq("id_mission", missionId);

  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────
//  STATS (pour HomeScreen)
// ─────────────────────────────────────────────────────────────

export interface MissionStats {
  terminated:  number;
  inProgress:  number;
  late:        number;
  streak:      number;
  weekTime:    string;
  successRate: number;
}

/**
 * Calcule les statistiques globales d'un user.
 * Utilisé dans HomeScreen (StatsBar, MissionProgress).
 */
export const fetchMissionStats = async (userId: string): Promise<MissionStats> => {
  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("id_mission, date_debut, date_fin, xp_obtenu")
    .eq("id_user", userId);

  if (errV) throw errV;

  const userValidations  = validations ?? [];
  const userMissionIds   = [...new Set(userValidations.map(v => v.id_mission))];

  if (userMissionIds.length === 0) {
    return { terminated: 0, inProgress: 0, late: 0, streak: 0, weekTime: "0h 00", successRate: 0 };
  }

  const { data: allMissions, error: errM } = await supabase
    .from("mission")
    .select("id_mission, duree_min, statut, date_limite")
    .in("id_mission", userMissionIds);

  if (errM) throw errM;

  // Statuts
  const { mapValidationStatus, computeStreak, computeWeekTime, computeSuccessRate, getStartOfWeek } =
    await import("./mission.utils");

  const statuts    = (allMissions ?? []).map(m => mapValidationStatus(m.statut, m.date_limite));
  const terminated = statuts.filter(s => s === "Terminée").length;
  const inProgress = statuts.filter(s => s === "En cours").length;
  const late       = statuts.filter(s => s === "En retard").length;
  const total      = terminated + inProgress + late;
  const successRate = computeSuccessRate(terminated, total);

  // Temps semaine
  const startOfWeek    = getStartOfWeek();
  const weekValidations = userValidations.filter(
    v => v.date_debut && new Date(v.date_debut) >= startOfWeek
  );
  const weekMissionIds  = new Set(weekValidations.map(v => v.id_mission));
  const weekMissions    = (allMissions ?? []).filter(m => weekMissionIds.has(m.id_mission));
  const totalMinutes    = weekMissions.reduce((acc, m) => acc + (m.duree_min ?? 0), 0);
  const weekTime        = computeWeekTime(totalMinutes);

  // Streak
  const { data: allValidationsRaw } = await supabase
    .from("mission_validation")
    .select("date_debut")
    .eq("id_user", userId)
    .not("date_debut", "is", null)
    .order("date_debut", { ascending: false });

  const streak = computeStreak(allValidationsRaw ?? []);

  return { terminated, inProgress, late, streak, weekTime, successRate };
};

// ─────────────────────────────────────────────────────────────
//  MISSIONS RÉCENTES (pour HomeScreen MissionsList)
// ─────────────────────────────────────────────────────────────

export interface RecentMission {
  id: string;
  title: string;
  tag: string;
  duration: string;
  status: "Terminée" | "En cours" | "En retard";
  date: string;
}

export const fetchRecentMissions = async (
  userId: string,
  limit = 5
): Promise<RecentMission[]> => {
  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("id_mission")
    .eq("id_user", userId);

  if (errV) throw errV;

  const ids = [...new Set((validations ?? []).map(v => v.id_mission))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("mission")
    .select("id_mission, titre, duree_min, statut, date_limite")
    .in("id_mission", ids)
    .order("id_mission", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const { mapValidationStatus, formatDuration } = await import("./mission.utils");

  return (data ?? []).map(m => ({
    id:       String(m.id_mission),
    title:    m.titre ?? "Sans titre",
    tag:      "",
    duration: formatDuration(m.duree_min),
    status:   mapValidationStatus(m.statut, m.date_limite),
    date:     m.date_limite
      ? new Date(m.date_limite).toLocaleDateString("fr-FR")
      : "-",
  }));
};