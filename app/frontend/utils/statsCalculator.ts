// utils/statsCalculator.ts
import type { PlayerStats } from '../../../backend/models/UserModel';
import { PlayerStatsModel } from '../../../backend/models/UserModel';

export interface Question {
  id: string;
  category: 'stress' | 'energie' | 'connaissance' | 'organisation';
  type: 'multiple' | 'boolean' | 'star' | 'scale';
  min_value?: number | null;
  max_value?: number | null;
  question_option?: Array<{
    id: string;
    value: number;
    impact: number;
  }>;
}

export interface Answer {
  option_id?: string | null;
  value: number | null;
}

export function computeStatsFromAnswers(
  questions: Question[],
  answers: Record<string, Answer>
): PlayerStats {
  // Copie des stats par défaut depuis ton PlayerStatsModel
  const stats: PlayerStats = { ...PlayerStatsModel.defaultStats };

  questions.forEach((question) => {
    const answer = answers[question.id];
    if (!answer || answer.value === null) return;

    let impact = 0;

    // Calcul de l'impact selon le type de question
    if (question.type === 'star') {
      // Note étoilée : normalisation entre -4 et +4
      const note = answer.value;
      const min = question.min_value ?? 1;
      const max = question.max_value ?? 5;
      impact = ((note - min) / (max - min)) * 8 - 4;
    } 
    else if (question.type === 'boolean') {
      // Booléen : impact défini dans les options
      const option = question.question_option?.find((o) => o.value === answer.value);
      impact = option?.impact ?? 0;
    }
    else {
      // Multiple / Scale
      const option = question.question_option?.find((o) => o.value === answer.value);
      impact = option?.impact ?? 0;
    }

    // Application de l'impact selon la catégorie (en utilisant PlayerStatsModel.clamp)
    switch (question.category) {
      case 'stress':
        stats.stress = PlayerStatsModel.clamp(stats.stress - impact);
        break;
      case 'energie':
        stats.energie = PlayerStatsModel.clamp(stats.energie + impact);
        break;
      case 'connaissance':
        stats.connaissance = PlayerStatsModel.clamp(stats.connaissance + impact);
        break;
      case 'organisation':
        stats.organisation = PlayerStatsModel.clamp(stats.organisation + impact);
        break;
    }
  });

  return stats;
}