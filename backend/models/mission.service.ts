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
  formatDuration,
  getTodayBounds,
  isDeadlinePassed,
  mapDifficulty,
} from "./mission.utils";

// ─────────────────────────────────────────────────────────────
//  fetchMissions
// ─────────────────────────────────────────────────────────────

export const fetchMissions = async (
  userId: string
): Promise<{ missions: Mission[]; timers: Record<number, MissionTimer> }> => {

  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("id_validation, id_mission, date_debut, date_fin, xp_obtenu, statut")
    .eq("id_user", userId);

  if (errV) throw errV;

  const validationMap: Record<number, any> = {};
  (validations ?? []).forEach(v => { validationMap[v.id_mission] = v; });

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
      boss_events ( nom )
    `)
    .order("id_mission", { ascending: false });

  if (errM) throw errM;

  const { start: todayStart, end: todayEnd } = getTodayBounds();

  const missions: Mission[] = (missionsData ?? []).map((m: MissionRow) => {
    const validation = validationMap[m.id_mission];
    const isToday =
      validation?.date_debut &&
      new Date(validation.date_debut) >= todayStart &&
      new Date(validation.date_debut) <= todayEnd;

    return {
      id:          m.id_mission,
      event:       m.id_boss != null ? (m.boss_events?.[0]?.nom ?? "Événement") : null,
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

  const timers: Record<number, MissionTimer> = {};

  (missionsData ?? []).forEach((m: MissionRow) => {
    const validation = validationMap[m.id_mission];
    const dateLimite = m.date_limite ? new Date(m.date_limite) : null;

    if (
      isDeadlinePassed(dateLimite) &&
      validation?.statut !== "done" &&
      validation?.statut !== "fail"
    ) {
      if (validation?.id_validation) {
        updateValidationStatut(validation.id_validation, "fail");
      }
      timers[m.id_mission] = {
        state:        "fail",
        elapsed:      0,
        validationId: validation?.id_validation ?? null,
        startedAt:    validation?.date_debut ? new Date(validation.date_debut) : null,
      };
      return;
    }

    if (validation) {
      timers[m.id_mission] = {
        state:        (validation.statut ?? "idle") as TimerState,
        elapsed:      0,
        validationId: validation.id_validation,
        startedAt:    validation.date_debut ? new Date(validation.date_debut) : null,
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
//  updateValidationStatut
// ─────────────────────────────────────────────────────────────

export const updateValidationStatut = async (
  validationId: number,
  statut: TimerState
): Promise<void> => {
  const { error } = await supabase
    .from("mission_validation")
    .update({ statut })
    .eq("id_validation", validationId);

  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────
//  startMissionSession
// ─────────────────────────────────────────────────────────────

export const startMissionSession = async (
  userId: string,
  missionId: number
): Promise<number> => {
  // Chercher une validation existante (pas encore terminée)
  const { data: existing } = await supabase
    .from("mission_validation")
    .select("id_validation, statut")
    .eq("id_user", userId)
    .eq("id_mission", missionId)
    .not("statut", "in", '("done","fail")')
    .maybeSingle();

  if (existing) {
    await updateValidationStatut(existing.id_validation, "running");
    return existing.id_validation;
  }

  const now = new Date();
  const { data, error } = await supabase
    .from("mission_validation")
    .insert({
      id_user:    userId,
      id_mission: missionId,
      date_debut: now.toISOString(),
      statut:     "running",
    })
    .select("id_validation")
    .single();

  if (error) throw error;
  return data.id_validation;
};

// ─────────────────────────────────────────────────────────────
//  resumeMissionSession
// ─────────────────────────────────────────────────────────────

export const resumeMissionSession = async (validationId: number): Promise<void> => {
  await updateValidationStatut(validationId, "running");
};

// ─────────────────────────────────────────────────────────────
//  pauseMissionSession
// ─────────────────────────────────────────────────────────────

export const pauseMissionSession = async (validationId: number): Promise<void> => {
  await updateValidationStatut(validationId, "paused");
};

// ─────────────────────────────────────────────────────────────
//  ✅ FIX — finishMissionSession
//  - Crée la validation si elle n'existe pas (validationId null)
//  - Met à jour date_fin + statut + xp_obtenu dans tous les cas
// ─────────────────────────────────────────────────────────────

export const finishMissionSession = async (
  missionId: number,
  validationId: number | null,
  elapsedSeconds: number,
  userId: string,
): Promise<{ xp: number; coins: number }> => {
  const now = new Date();
  const userIdInt = parseInt(userId, 10);

  // 1️⃣ Récupérer les données de la mission
  const { data: missionData, error: errM } = await supabase
    .from("mission")
    .select("xp_gain, difficulte, priorite")
    .eq("id_mission", missionId)
    .single();

  if (errM) throw errM;

  // 2️⃣ Calcul XP et coins
  const timeXp  = Math.max(10, Math.round(elapsedSeconds / 60) * 2);
  const xpGain  = (missionData?.xp_gain ?? 0) + timeXp;
  const coins   = (missionData?.difficulte ?? 1) * 10 + (missionData?.priorite ?? 1) * 5;

  // 3️⃣ ✅ Si pas de validationId → créer la validation d'abord
  let finalValidationId = validationId;

  if (!finalValidationId) {
    console.warn("⚠️ finishMissionSession — pas de validationId, création d'une nouvelle validation");

    const { data: newValidation, error: errInsert } = await supabase
      .from("mission_validation")
      .insert({
        id_user:    userId,
        id_mission: missionId,
        date_debut: now.toISOString(),
        statut:     "done",
        date_fin:   now.toISOString(),
        xp_obtenu:  xpGain,
      })
      .select("id_validation")
      .single();

    if (errInsert) throw errInsert;
    finalValidationId = newValidation.id_validation;

  } else {
    // 4️⃣ ✅ Mettre à jour date_fin + statut + xp_obtenu
    const { error: errUpdate } = await supabase
      .from("mission_validation")
      .update({
        date_fin:  now.toISOString(),
        xp_obtenu: xpGain,
        statut:    "done",
      })
      .eq("id_validation", finalValidationId);

    if (errUpdate) {
      console.error("❌ Erreur update mission_validation:", errUpdate.message);
      throw errUpdate;
    }

    console.log("✅ mission_validation mis à jour — id:", finalValidationId);
  }

  // 5️⃣ Mettre à jour XP et gold du user
  const { error: errRpc } = await supabase.rpc("increment_user_rewards", {
    p_user_id: userIdInt,
    p_xp:      xpGain,
    p_gold:    coins,
  });

  if (errRpc) {
    console.error("❌ RPC error:", errRpc.message);

    // Fallback manuel
    const { data: userData, error: errRead } = await supabase
      .from("users")
      .select("xp, gold")
      .eq("id_user", userIdInt)
      .single();

    if (errRead) throw errRead;

    const { error: errWrite } = await supabase
      .from("users")
      .update({
        xp:   (userData?.xp   ?? 0) + xpGain,
        gold: (userData?.gold ?? 0) + coins,
      })
      .eq("id_user", userIdInt);

    if (errWrite) throw errWrite;
  }

  console.log(`✅ finishMissionSession — xp: ${xpGain}, coins: ${coins}`);
  return { xp: xpGain, coins };
};

// ─────────────────────────────────────────────────────────────
//  failMissionSession
// ─────────────────────────────────────────────────────────────

export const failMissionSession = async (validationId: number): Promise<void> => {
  await updateValidationStatut(validationId, "fail");
};

// ─────────────────────────────────────────────────────────────
//  createMission
// ─────────────────────────────────────────────────────────────

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
//  updateMission
// ─────────────────────────────────────────────────────────────

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
//  deleteMission
// ─────────────────────────────────────────────────────────────

export const deleteMission = async (missionId: number): Promise<void> => {
  const { error } = await supabase
    .from("mission")
    .delete()
    .eq("id_mission", missionId);

  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────
//  fetchMissionStats
// ─────────────────────────────────────────────────────────────

export interface MissionStats {
  terminated:  number;
  inProgress:  number;
  late:        number;
  streak:      number;
  weekTime:    string;
  successRate: number;
}

export const fetchMissionStats = async (userId: string): Promise<MissionStats> => {
  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("id_mission, date_debut, date_fin, xp_obtenu, statut")
    .eq("id_user", userId);

  if (errV) throw errV;

  const userValidations = validations ?? [];
  const userMissionIds  = [...new Set(userValidations.map(v => v.id_mission))];

  if (userMissionIds.length === 0) {
    return { terminated: 0, inProgress: 0, late: 0, streak: 0, weekTime: "0h 00", successRate: 0 };
  }

  const { data: allMissions, error: errM } = await supabase
    .from("mission")
    .select("id_mission, duree_min, date_limite")
    .in("id_mission", userMissionIds);

  if (errM) throw errM;

  const { mapValidationStatus, computeStreak, computeWeekTime, computeSuccessRate, getStartOfWeek } =
    await import("./mission.utils");

  const missionMap = Object.fromEntries((allMissions ?? []).map(m => [m.id_mission, m]));

  const statuts = userValidations.map(v => {
    const m = missionMap[v.id_mission];
    return mapValidationStatus(v.statut, m?.date_limite);
  });

  const terminated  = statuts.filter(s => s === "Terminée").length;
  const inProgress  = statuts.filter(s => s === "En cours").length;
  const late        = statuts.filter(s => s === "En retard").length;
  const total       = terminated + inProgress + late;
  const successRate = computeSuccessRate(terminated, total);

  const startOfWeek     = getStartOfWeek();
  const weekValidations = userValidations.filter(
    v => v.date_debut && new Date(v.date_debut) >= startOfWeek
  );
  const weekMissionIds  = new Set(weekValidations.map(v => v.id_mission));
  const weekMissions    = (allMissions ?? []).filter(m => weekMissionIds.has(m.id_mission));
  const totalMinutes    = weekMissions.reduce((acc, m) => acc + (m.duree_min ?? 0), 0);
  const weekTime        = computeWeekTime(totalMinutes);

  const sortedValidations = [...userValidations]
    .filter(v => v.date_debut)
    .sort((a, b) => new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime());

  const streak = computeStreak(sortedValidations);

  return { terminated, inProgress, late, streak, weekTime, successRate };
};

// ─────────────────────────────────────────────────────────────
//  fetchRecentMissions
// ─────────────────────────────────────────────────────────────

export interface RecentMission {
  id:       string;
  title:    string;
  tag:      string;
  duration: string;
  status:   "Terminée" | "En cours" | "En retard";
  date:     string;
}

export const fetchRecentMissions = async (
  userId: string,
  limit = 5
): Promise<RecentMission[]> => {
  const { data: validations, error: errV } = await supabase
    .from("mission_validation")
    .select("id_mission, statut")
    .eq("id_user", userId);

  if (errV) throw errV;

  const ids = [...new Set((validations ?? []).map(v => v.id_mission))];
  if (!ids.length) return [];

  const validationMap = Object.fromEntries(
    (validations ?? []).map(v => [v.id_mission, v.statut])
  );

  const { data, error } = await supabase
    .from("mission")
    .select("id_mission, titre, duree_min, date_limite")
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
    status:   mapValidationStatus(validationMap[m.id_mission], m.date_limite),
    date:     m.date_limite
      ? new Date(m.date_limite).toLocaleDateString("fr-FR")
      : "-",
  }));
};