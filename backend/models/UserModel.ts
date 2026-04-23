// ─────────────────────────────────────────────
// backend/models/UserModel.ts
//
// Structure des données des 3 tables principales.
// Pas de logique ici — juste les formes des objets
// et les valeurs par défaut.
// ─────────────────────────────────────────────

// ── Table : users ────────────────────────────

export interface User {
  nom:         string;
  prenom:      string;
  username:    string;
  email:       string;
  password:    string;
  avatar_url:  string;   // "avatar_1" ... "avatar_5"
  gold:        number;
  xp:          number;
  energie:     number;
  progression: number;
  id_level:    number | null;
}

export const UserModel = {
  defaultUser: {
    nom:         '',
    prenom:      '',
    username:    '',
    email:       '',
    password:    '',
    avatar_url:  'avatar_1',
    gold:        0,
    xp:          0,
    energie:     100,
    progression: 0,
    id_level:    null,
  } as User,

  // Champs autorisés à être modifiés par l'utilisateur
  editableFields: ['username', 'nom', 'prenom', 'avatar_url'] as const,
};

// ── Table : player_stats ─────────────────────

export interface PlayerStats {
  energie:      number;
  stress:       number;
  connaissance: number;
  organisation: number;
}

export const PlayerStatsModel = {
  defaultStats: {
    energie:      50,
    stress:       50,
    connaissance: 50,
    organisation: 50,
  } as PlayerStats,

  MIN: 0,
  MAX: 100,

  // Clamp une valeur entre MIN et MAX
  clamp(value: number): number {
    return Math.max(this.MIN, Math.min(this.MAX, value));
  },
};

// ── Table : user_skills ──────────────────────

export const UserSkillModel = {
  defaultValeur: 0,
  MAX_VALEUR:    100,

  // IDs fixes des skills (après seedSkills.ts)
  SKILL_IDS: {
    RESPIRATION:        1,
    MEDITATION:         2,
    GESTION_EMOTIONS:   3,
    DISCIPLINE_SOMMEIL: 4,
    SPORT:              5,
    NUTRITION:          6,
    LECTURE_ACTIVE:     7,
    REPETITION:         8,
    FEYNMAN:            9,
    MIND_MAPPING:       10,
    PLANNING:           11,
    POMODORO:           12,
    PRIORISATION:       13,
    ANTI_PROCRA:        14,
  } as const,
};

export type SkillId = typeof UserSkillModel.SKILL_IDS[keyof typeof UserSkillModel.SKILL_IDS];