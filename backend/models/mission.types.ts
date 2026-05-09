// ============================================================
//  mission.types.ts
// ============================================================

export type Difficulty = "Difficile" | "Moyen" | "Facile";
export type DifficultyLevel = 1 | 2 | 3;
export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

// ── Mission (vue UI) ──────────────────────────────────────────
export interface Mission {
  id:          number;
  event:       string | null;
  title:       string;
  duration:    string;
  description: string;
  difficulty:  Difficulty;
  progress:    number;
  urgent:      boolean;
  today:       boolean;
  dateLimite:  Date | null;
  idDefi:      number | null; // ← ajouté
}

// ── Mission (raw Supabase row) ────────────────────────────────
export interface MissionRow {
  id_mission:  number;
  id_user?:    number | null;
  titre:       string | null;
  description: string | null;
  duree_min:   number | null;
  difficulte:  number | null;
  priorite:    number | null;
  id_boss:     number | null;
  id_defi:     number | null; // ← ajouté
  date_limite: string | null;
  boss_events?: { nom: any }[] | null;
}

// ── MissionValidation (raw Supabase row) ──────────────────────
export interface MissionValidationRow {
  id_validation: number;
  id_user:       string;
  id_mission:    number;
  date_debut:    string | null;
  date_fin:      string | null;
  xp_obtenu:     number | null;
  statut:        TimerState;
}

// ── Timer local (état UI) ─────────────────────────────────────
export interface MissionTimer {
  state:        TimerState;
  elapsed:      number;
  validationId: number | null;
  startedAt:    Date | null;
}

// ── Payload création / mise à jour ────────────────────────────
export interface MissionCreatePayload {
  id_user?:          number | null;
  titre:             string;
  description:       string | null;
  duree_min:         number | null;
  difficulte:        DifficultyLevel;
  priorite:          number;
  date_limite:       string | null;
  id_boss:           number | null;
  id_defi?:          number | null;
  xp_gain:           number;
  energie_cout:      number;
  stress_gain:       number;
  connaissance_gain: number;
  organisation_gain: number;
}

export type MissionUpdatePayload = Partial<MissionCreatePayload>;

export interface MissionGains {
  xp_gain:           number;
  energie_cout:      number;
  stress_gain:       number;
  connaissance_gain: number;
  organisation_gain: number;
}