// ─────────────────────────────────────────────
// backend/models/UserModel.js
//
// Structure des données des 3 tables principales.
// Pas de logique ici — juste les formes des objets
// et les valeurs par défaut.
// ─────────────────────────────────────────────

// ── Table : users ────────────────────────────
const UserModel = {
  defaultUser: {
    nom:        '',
    prenom:     '',
    username:   '',
    email:      '',
    password:   '',
    avatar_url: 'avatar_1',   // "avatar_1" … "avatar_5"
    gold:       0,
    xp:         0,
    energie:    100,
    progression: 0,
    id_level:   null,
  },

  // Champs autorisés à être modifiés par l'utilisateur
  editableFields: ['username', 'nom', 'prenom', 'avatar_url'],
};

// ── Table : player_stats ─────────────────────
const PlayerStatsModel = {
  defaultStats: {
    energie:      50,
    stress:       50,
    connaissance: 50,
    organisation: 50,
  },
  MIN: 0,
  MAX: 100,

  // Clamp une valeur entre MIN et MAX
  clamp(value) {
    return Math.max(this.MIN, Math.min(this.MAX, value));
  },
};

// ── Table : user_skills ──────────────────────
const UserSkillModel = {
  defaultValeur: 0,
  MAX_VALEUR:    100,

  // IDs fixes des skills (après seedSkills.js)
  SKILL_IDS: {
    RESPIRATION:       1,
    MEDITATION:        2,
    GESTION_EMOTIONS:  3,
    DISCIPLINE_SOMMEIL:4,
    SPORT:             5,
    NUTRITION:         6,
    LECTURE_ACTIVE:    7,
    REPETITION:        8,
    FEYNMAN:           9,
    MIND_MAPPING:      10,
    PLANNING:          11,
    POMODORO:          12,
    PRIORISATION:      13,
    ANTI_PROCRA:       14,
  },
};

module.exports = { UserModel, PlayerStatsModel, UserSkillModel };