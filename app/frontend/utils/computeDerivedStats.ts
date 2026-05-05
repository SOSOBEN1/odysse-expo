// ─────────────────────────────────────────────────────────────
//  utils/computeDerivedStats.ts
//  Calcul des stats dérivées : Concentration, Sérénité, Discipline
//  Ces stats ne sont PAS stockées en DB — calculées à la volée
// ─────────────────────────────────────────────────────────────

const clamp = (v: number) => Math.min(100, Math.max(0, v));

// ─── Types ────────────────────────────────────────────────────

export interface BaseStats {
  energie:      number;
  stress:       number;
  connaissance: number;
  organisation: number;
}

export interface MissionRatio {
  total:    number;  // total missions du jour
  done:     number;  // missions complétées (statut "done")
  missed:   number;  // missions ratées/oubliées (statut "fail")
}

export interface DerivedStats {
  concentration: number;
  serenite:      number;
  discipline:    number;
}

// ─── Discipline ───────────────────────────────────────────────
//
//  Si total > 0 :
//    Discipline = orga_base
//               + (done / total) × 10
//               - (missed / total) × 5
//  Sinon :
//    Discipline = orga_base × 0.7 + connaissance × 0.3  (formule neutre)
//
export function computeDiscipline(
  base: BaseStats,
  ratio: MissionRatio
): number {
  if (ratio.total > 0) {
    const bonus   = (ratio.done   / ratio.total) * 10;
    const penalty = (ratio.missed / ratio.total) * 5;
    const orga    = base.organisation * 0.7 + base.connaissance * 0.3;
    return clamp(orga + bonus - penalty);
  }
  // Pas de missions aujourd'hui → formule de base
  return clamp(base.organisation * 0.7 + base.connaissance * 0.3);
}

// ─── Sérénité ─────────────────────────────────────────────────
//
//  Sérénité = (100 - stress) × 0.1   ← contribution stress
//           + bonus_pause              ← +5 si mission pause/détente complétée
//  Note : on retourne une valeur absolue basée sur le stress actuel
//         pour être cohérent avec l'affichage (0-100)
//
//  Formule complète :
//    serenite_base = 100 - stress
//    serenite_ajustée = serenite_base + (100 - stress) × 0.1 + bonus_pause
//    → clampé entre 0 et 100
//
export function computeSerenite(
  base: BaseStats,
  hasCompletedPauseMission: boolean = false
): number {
  const sereniteBase  = 100 - base.stress;
  const stressBonus   = (100 - base.stress) * 0.1;
  const bonusPause    = hasCompletedPauseMission ? 5 : 0;

  return clamp(sereniteBase + stressBonus + bonusPause);
}

// ─── Concentration ────────────────────────────────────────────
//
//  Concentration = connaissance_base
//               + gain_apprentissage   ← XP de connaissance des missions faites
//               - (100 - énergie) × 0.05  ← pénalité fatigue
//
//  gain_apprentissage = somme des connaissance_gain des missions "done"
//
export function computeConcentration(
  base: BaseStats,
  connaissanceGainTotal: number = 0
): number {
  const connaissanceBase = base.energie * 0.5 + base.connaissance * 0.5;
  const gainApprentissage = connaissanceGainTotal;
  const penaliteFatigue   = (100 - base.energie) * 0.05;

  return clamp(connaissanceBase + gainApprentissage - penaliteFatigue);
}

// ─── Fonction principale ──────────────────────────────────────
//
//  Calcule les 3 stats dérivées d'un coup.
//
//  Paramètres :
//    base                    : stats brutes (energie, stress, connaissance, organisation)
//    ratio                   : { total, done, missed } missions du jour
//    hasCompletedPauseMission: true si une mission pause/détente a été faite aujourd'hui
//    connaissanceGainTotal   : somme des connaissance_gain des missions complétées
//
export function computeAllDerivedStats(
  base: BaseStats,
  ratio: MissionRatio = { total: 0, done: 0, missed: 0 },
  hasCompletedPauseMission: boolean = false,
  connaissanceGainTotal: number = 0
): DerivedStats {
  return {
    concentration: computeConcentration(base, connaissanceGainTotal),
    serenite:      computeSerenite(base, hasCompletedPauseMission),
    discipline:    computeDiscipline(base, ratio),
  };
}

// ─── Formule simple (sans données missions) ───────────────────
//  Utilisée quand on n'a pas encore les missions chargées
//  (ex: au premier render du dashboard)
//
export function computeSimpleDerivedStats(base: BaseStats): DerivedStats {
  return {
    concentration: clamp(base.energie * 0.5 + base.connaissance * 0.5),
    serenite:      clamp(100 - base.stress),
    discipline:    clamp(base.organisation * 0.7 + base.connaissance * 0.3),
  };
}