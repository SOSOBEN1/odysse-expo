// ─────────────────────────────────────────────
// backend/viewmodels/StatsSkillsViewModel.js
//
// Logique métier pour :
//   - Le questionnaire d'onboarding (5 questions)
//   - Le calcul des stats initiales (energie, stress…)
//   - L'initialisation des skills selon les réponses
//
// Appelé depuis OnboardingScreen.tsx.
// ─────────────────────────────────────────────

const UserService               = require('../services/UserService');
const { PlayerStatsModel, UserSkillModel } = require('../models/UserModel');

const StatsSkillsViewModel = {

  // ════════════════════════════════════════════
  // ONBOARDING : charger les questions
  // ════════════════════════════════════════════

  async getOnboardingQuestions() {
    try {
      const questions = await UserService.getOnboardingQuestions();
      return { success: true, data: questions };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Vérifie si le user a déjà fait l'onboarding
  async checkOnboardingStatus(userId) {
    const done = await UserService.hasCompletedOnboarding(userId);
    return { alreadyDone: done };
  },


  // ════════════════════════════════════════════
  // ONBOARDING : calculer et sauvegarder les stats
  // ════════════════════════════════════════════

  //  answers = [
  //    { question_id: '11111111-...', option_id: 'uuid-option' },
  //    ...
  //  ]
  //  questions = tableau retourné par getOnboardingQuestions()
  //
  async submitOnboarding(userId, questions, answers) {

    // ── 1. Vérifier que toutes les questions ont une réponse ──
    if (answers.length < questions.length) {
      return {
        success: false,
        error: `Il manque ${questions.length - answers.length} réponse(s)`,
      };
    }

    try {
      // ── 2. Sauvegarder les réponses ───────────────────────────
      await UserService.saveResponses(userId, answers);

      // ── 3. Calculer les stats initiales ──────────────────────
      const stats = this._computeStats(questions, answers);

      // ── 4. Créer ou mettre à jour player_stats ───────────────
      const existing = await UserService.getPlayerStats(userId);
      if (existing) {
        await UserService.updatePlayerStats(userId, stats);
      } else {
        await UserService.createPlayerStats(userId, stats);
      }

      // ── 5. Enregistrer dans l'historique ─────────────────────
      await UserService.addStatHistory(
        userId,
        stats,
        "Initialisation — questionnaire d'inscription"
      );

      // ── 6. Initialiser les skills selon les réponses ─────────
      const initialSkills = this._computeInitialSkills(questions, answers, stats);
      if (initialSkills.length > 0) {
        await UserService.bulkUpsertSkills(userId, initialSkills);
      }

      return {
        success: true,
        data: { stats, skills: initialSkills },
        message: 'Profil initialisé avec succès !',
      };

    } catch (err) {
      return { success: false, error: err.message };
    }
  },


  // ════════════════════════════════════════════
  // STATS : lire et afficher
  // ════════════════════════════════════════════

  async getPlayerStats(userId) {
    try {
      const stats = await UserService.getPlayerStats(userId);
      if (!stats) return { success: true, data: PlayerStatsModel.defaultStats };
      return { success: true, data: stats };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },


  // ════════════════════════════════════════════
  // SKILLS : lire et afficher
  // ════════════════════════════════════════════

  async getUserSkills(userId) {
    try {
      const skills = await UserService.getUserSkills(userId);
      return { success: true, data: skills };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },


  // ════════════════════════════════════════════
  // MÉTHODES PRIVÉES (calculs internes)
  // ════════════════════════════════════════════

  // Calcule les stats à partir des réponses
  // Chaque option a un champ `impact` en BDD
  _computeStats(questions, answers) {
    const stats = { ...PlayerStatsModel.defaultStats };

    // Créer un index rapide : question_id → option choisie
    const answerMap = {};
    answers.forEach(a => { answerMap[a.question_id] = a.option_id; });

    questions.forEach(q => {
      const chosenOptionId = answerMap[q.id];
      if (!chosenOptionId) return;

      const option = q.options.find(o => o.id === chosenOptionId);
      if (!option) return;

      // Appliquer l'impact selon la catégorie
      if (q.category === 'stress') {
        // Pour le stress : impact positif = MOINS de stress (le stat représente le calme)
        stats.stress = PlayerStatsModel.clamp(stats.stress - option.impact);
      } else if (q.category === 'energie') {
        stats.energie = PlayerStatsModel.clamp(stats.energie + option.impact);
      } else if (q.category === 'connaissance') {
        stats.connaissance = PlayerStatsModel.clamp(stats.connaissance + option.impact);
      } else if (q.category === 'organisation') {
        stats.organisation = PlayerStatsModel.clamp(stats.organisation + option.impact);
      }
    });

    return stats;
  },

  // Détermine les skills initiaux selon les stats calculées
  // Logique : si une stat est faible → on recommande les skills qui l'améliorent
  _computeInitialSkills(questions, answers, stats) {
    const { SKILL_IDS } = UserSkillModel;
    const skills = [];

    // ── Stress faible → skills de gestion du stress ──────────
    if (stats.stress < 45) {
      skills.push({ id_skill: SKILL_IDS.RESPIRATION,      valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.MEDITATION,       valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.GESTION_EMOTIONS, valeur: 10 });
    }

    // ── Énergie faible → skills d'hygiène de vie ─────────────
    if (stats.energie < 45) {
      skills.push({ id_skill: SKILL_IDS.DISCIPLINE_SOMMEIL, valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.SPORT,              valeur: 10 });
    }

    // ── Connaissance faible → skills d'apprentissage ─────────
    if (stats.connaissance < 45) {
      skills.push({ id_skill: SKILL_IDS.LECTURE_ACTIVE, valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.REPETITION,     valeur: 10 });
    }

    // ── Organisation faible → skills de productivité ─────────
    if (stats.organisation < 45) {
      skills.push({ id_skill: SKILL_IDS.PLANNING,       valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.ANTI_PROCRA,    valeur: 10 });
      skills.push({ id_skill: SKILL_IDS.POMODORO,       valeur: 10 });
    }

    // Si toutes les stats sont correctes → skills de base quand même
    if (skills.length === 0) {
      skills.push({ id_skill: SKILL_IDS.PLANNING,   valeur: 20 });
      skills.push({ id_skill: SKILL_IDS.REPETITION, valeur: 20 });
    }

    return skills;
  },
};

module.exports = StatsSkillsViewModel;