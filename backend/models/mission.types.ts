// ============================================================
//  mission.types.ts
//  Types partagés pour les missions (frontend ↔ backend)
// ============================================================

// ── Difficulté ────────────────────────────────────────────────
export type Difficulty = "Difficile" | "Moyen" | "Facile";
export type DifficultyLevel = 1 | 2 | 3; // 1=Facile, 2=Moyen, 3=Difficile

// ── Timer / Statut ────────────────────────────────────────────
export type TimerState = "idle" | "running" | "paused" | "done" | "fail";

// ── Mission (vue UI) ──────────────────────────────────────────
export interface Mission {
  id: number;
  event: string | null;       // nom du boss_event lié, null si aucun
  title: string;
  duration: string;           // ex: "1h30"
  description: string;
  difficulty: Difficulty;
  progress: number;           // 0-100
  urgent: boolean;            // priorite >= 4
  today: boolean;             // validation démarrée aujourd'hui
  dateLimite: Date | null;
}

// ── Mission (raw Supabase row) ────────────────────────────────
export interface MissionRow {
  id_mission: number;
  titre: string;
  description: string | null;
  duree_min: number | null;
  difficulte: number;
  priorite: number;
  id_boss: number | null;
  date_limite: string | null;
  statut: TimerState;
  boss_events?: any;   // ← any, Supabase retourne des formes variables
}

// ── MissionValidation (raw Supabase row) ──────────────────────
export interface MissionValidationRow {
  id_validation: number;
  id_user: string;
  id_mission: number;
  date_debut: string | null;
  date_fin: string | null;
  xp_obtenu: number | null;
}

// ── Timer local (état UI) ─────────────────────────────────────
export interface MissionTimer {
  state: TimerState;
  elapsed: number;            // secondes écoulées
  validationId: number | null;
  startedAt: Date | null;
}

// ── Payload création / mise à jour ───────────────────────────
export interface MissionCreatePayload {
  titre: string;
  description: string | null;
  duree_min: number | null;
  difficulte: DifficultyLevel;
  priorite: number;
  date_limite: string | null;
  id_boss: number | null;
  // gains calculés automatiquement
  xp_gain: number;
  energie_cout: number;
  stress_gain: number;
  connaissance_gain: number;
  organisation_gain: number;
}

export type MissionUpdatePayload = Partial<MissionCreatePayload>;

// ── Gains calculés ────────────────────────────────────────────
export interface MissionGains {
  xp_gain: number;
  energie_cout: number;
  stress_gain: number;
  connaissance_gain: number;
  organisation_gain: number;
}