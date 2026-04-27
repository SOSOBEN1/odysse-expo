import { supabase } from '../app/frontend/constants/supabase'

export interface ParticipantDB {
  id_user:          number
  nom:              string
  prenom?:          string
  email?:           string
  minutes_etudies?: number
  avatar_color?:    string
  avatar_emoji?:    string
  score?:           number
}

export interface MissionDB {
  id_mission:         number
  id_defi:            number
  titre:              string
  description?:       string
  duree_min?:         number
  progression?:       number
  id_user_accompli?:  number
  nom_user_accompli?: string
  xp_gain?:           number
  difficulte?:        number
  priorite?:          number
  type_mission?:      string
  // ❌ PAS de statut — il est dans mission_validation
}

export interface DefiDetailDB {
  id_defi:           number
  nom:               string
  description?:      string
  statut:            string
  xp?:               number
  date_debut?:       string
  date_fin?:         string
  objectif_minutes?: number
}

export interface ScoreDefi {
  id_user:         number
  nom:             string
  xp_total:        number
  difficulte_moy:  number
  bonus_rapidite:  number
  score_final:     number
  rang:            number
  missions_faites: number
}

export interface StatsUtilisateur {
  stress:        number
  energie:       number
  organisation:  number
  connaissances: number
  discipline:    number
  serenite:      number
  concentration: number
}

export type StatCibleKey = 'energie' | 'stress' | 'connaissance' | 'organisation'

const XP_MAX_DEFI  = 500
const NIVEAU_MAX   = 10
const BONUS_STAT_X = 1.5

const xpRequiseNiveau = (n: number) => 100 * n * n
const XP_TOTALE_MAX   = Array.from({ length: NIVEAU_MAX }, (_, i) => xpRequiseNiveau(i + 1))
  .reduce((a, b) => a + b, 0)

export const calculerXPMission = (xp_base: number, difficulte: number, priorite: number) =>
  Math.round(xp_base * difficulte * priorite)

export const calculerNiveau = (xp_total: number) => {
  let niveau = 1, xp_restant = xp_total
  for (let n = 1; n <= NIVEAU_MAX; n++) {
    const requis = xpRequiseNiveau(n)
    if (xp_restant >= requis) { xp_restant -= requis; niveau = n + 1 }
    else return {
      niveau,
      progression_niveau:  Math.round((xp_restant / requis) * 100),
      progression_globale: Math.min(Math.round((xp_total / XP_TOTALE_MAX) * 100), 100),
      xp_restant,
      xp_prochain: requis,
    }
  }
  return { niveau: NIVEAU_MAX, progression_niveau: 100, progression_globale: 100, xp_restant: 0, xp_prochain: 0 }
}

export const calculerScoreDefi = (params: {
  xp_missions:     number[]
  difficultes:     number[]
  date_debut:      string
  date_fin_defi:   string
  date_completion: string
}) => {
  const { xp_missions, difficultes, date_fin_defi, date_completion } = params
  const xp_total = Math.min(xp_missions.reduce((s, x) => s + x, 0), XP_MAX_DEFI)
  const difficulte_moy = difficultes.length > 0
    ? parseFloat((difficultes.reduce((s, d) => s + d, 0) / difficultes.length).toFixed(2))
    : 1
  const fin_defi         = new Date(date_fin_defi).getTime()
  const completion       = new Date(date_completion).getTime()
  const heures_restantes = Math.max(0, (fin_defi - completion) / (1000 * 60 * 60))
  const bonus_rapidite   = parseFloat((heures_restantes * 0.5).toFixed(1))
  const score_final      = Math.round(xp_total + (difficulte_moy * 10) + bonus_rapidite)
  return { xp_total, difficulte_moy, bonus_rapidite, score_final }
}

export const getStatsCiblesDuDefi = async (defiId: number): Promise<StatCibleKey[]> => {
  const { data } = await supabase
    .from('defis_statistique_cible')
    .select('statistique_cible ( type )')
    .eq('id_defi', defiId)
  if (!data || data.length === 0) return []
  return (data as any[]).map(r => r.statistique_cible?.type).filter(Boolean) as StatCibleKey[]
}

export const calculerNouvellesStats = (
  stats: StatsUtilisateur,
  mission: {
    type_mission:      string
    difficulte:        number
    missions_total:    number
    missions_faites:   number
    missions_oubliees: number
  },
  statsCibles: StatCibleKey[] = []
): StatsUtilisateur => {
  const { type_mission, difficulte, missions_total, missions_faites, missions_oubliees } = mission
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  const bonus = (val: number, key: StatCibleKey) => statsCibles.includes(key) ? val * BONUS_STAT_X : val

  const reductionStressBase =
    type_mission === 'pause'         ? 10 :
    type_mission === 'revision'      ? 5  :
    type_mission === 'devoir'        ? 4  :
    type_mission === 'planification' ? 6  : 3

  const depenseEnergieBase      = difficulte <= 2 ? 5 : difficulte <= 4 ? 10 : 15
  const bonusReposBase          = type_mission === 'pause' ? 15 : 0
  const impactOrgaBase          = type_mission === 'planification' ? 10 : 0
  const impactConnaissancesBase =
    type_mission === 'revision'      ? 10 :
    type_mission === 'devoir'        ? 15 :
    type_mission === 'apprentissage' ? 12 : 3

  const reductionStress     = bonus(reductionStressBase,    'stress')
  const bonusRepos          = bonus(bonusReposBase,          'energie')
  const impactOrga          = bonus(impactOrgaBase,          'organisation')
  const impactConnaissances = bonus(impactConnaissancesBase, 'connaissance')

  const stress        = clamp(stats.stress - reductionStress)
  const energie       = clamp(stats.energie - depenseEnergieBase + bonusRepos)
  const organisation  = clamp(stats.organisation + impactOrga)
  const connaissances = clamp(stats.connaissances + impactConnaissances)
  const discipline    = missions_total > 0
    ? clamp(stats.discipline + (missions_faites / missions_total) * 10 - (missions_oubliees / missions_total) * 5)
    : stats.discipline
  const bonusPause    = type_mission === 'pause' ? 5 : 0
  const serenite      = clamp(stats.serenite + (100 - stress) * 0.1 + bonusPause)
  const concentration = clamp(stats.concentration + impactConnaissances - (100 - energie) * 0.05)

  return { stress, energie, organisation, connaissances, discipline, serenite, concentration }
}

export const sauvegarderStatsCibles = async (
  defiId:       number,
  statCibleIds: number[],
  variation:    number = 10
) => {
  if (statCibleIds.length === 0) return { error: null }
  const { error } = await supabase
    .from('defis_statistique_cible')
    .insert(statCibleIds.map(id => ({ id_defi: defiId, id_stat_cible: id, variation })))
  return { error }
}

export const getDefiDetail = async (defiId: number) => {
  const { data, error } = await supabase
    .from('defis').select('*').eq('id_defi', defiId).single()
  return { data, error }
}

export const getParticipants = async (defiId: number) => {
  const { data, error } = await supabase
    .from('defi_participants')
    .select('id_user, minutes_etudies, score, xp_total, users ( nom, prenom, email, avatar_emoji, avatar_color )')
    .eq('id_defi', defiId)

  if (error) return { data: null, error }

  const mapped: ParticipantDB[] = (data ?? []).map((row: any) => ({
    id_user:         row.id_user,
    nom:             row.users?.nom          ?? 'Inconnu',
    prenom:          row.users?.prenom       ?? '',
    email:           row.users?.email,
    minutes_etudies: row.minutes_etudies     ?? 0,
    avatar_color:    row.users?.avatar_color ?? '#CE93D8',
    avatar_emoji:    row.users?.avatar_emoji ?? '',
    score:           row.score               ?? 0,
  }))

  return { data: mapped, error: null }
}

export const getMissions = async (defiId: number) => {
  const { data, error } = await supabase
    .from('mission')
    // ✅ statut retiré du select
    .select('id_mission, id_defi, titre, description, duree_min, difficulte, priorite, progression, id_user_accompli, xp_gain, users ( nom )')
    .eq('id_defi', defiId)
    .order('id_mission', { ascending: true })

  if (error) return { data: null, error }

  const mapped: MissionDB[] = (data ?? []).map((row: any) => ({
    id_mission:        row.id_mission,
    id_defi:           row.id_defi,
    titre:             row.titre       ?? '',
    description:       row.description ?? '',
    duree_min:         row.duree_min   ?? 0,
    progression:       row.progression ?? 0,
    id_user_accompli:  row.id_user_accompli,
    nom_user_accompli: row.users?.nom  ?? '',
    xp_gain:           row.xp_gain     ?? 10,
    difficulte:        row.difficulte  ?? 1,
    priorite:          row.priorite    ?? 1,
    type_mission:      'revision',
  }))

  return { data: mapped, error: null }
}

export const getMissionsCompleteesPar = async (userId: number, defiId: number) => {
  // D'abord récupère les ids des missions du défi
  const { data: missionIds } = await supabase
    .from('mission')
    .select('id_mission')
    .eq('id_defi', defiId)

  if (!missionIds || missionIds.length === 0) return { data: [], error: null }

  const ids = missionIds.map((m: any) => m.id_mission)

  // ✅ filtre direct par id_mission, sélectionne statut
  const { data, error } = await supabase
    .from('mission_validation')
    .select('id_mission, xp_obtenu, date_fin, statut')
    .eq('id_user', userId)
    .in('id_mission', ids)

  if (error) return { data: [], error }
  return { data: data ?? [], error: null }
}

export const cocherMission = async (params: {
  missionId:        number
  userId:           number
  defiId:           number
  mission:          MissionDB
  statsActuelles:   StatsUtilisateur
  missionsFaites:   number
  missionsTotal:    number
  missionsOubliees: number
}) => {
  const { missionId, userId, defiId, mission, statsActuelles, missionsFaites, missionsTotal, missionsOubliees } = params

  // 1. Déjà cochée ?
  const { data: existing } = await supabase
    .from('mission_validation')
    .select('id_validation')
    .eq('id_user', userId)
    .eq('id_mission', missionId)
    .maybeSingle()

  if (existing) return { error: { message: 'Mission déjà cochée' }, alreadyDone: true }

  // 2. Stats cibles du défi
  const statsCibles = await getStatsCiblesDuDefi(defiId)

  // 3. Calculer XP
  const xp_gagne = calculerXPMission(mission.xp_gain ?? 10, mission.difficulte ?? 1, mission.priorite ?? 1)
  const now      = new Date().toISOString()

  // 4. Insérer dans mission_validation avec statut 'done'
  const { error: insertErr } = await supabase
    .from('mission_validation')
    .insert({
      id_user:    userId,
      id_mission: missionId,
      date_debut: now,
      date_fin:   now,
      xp_obtenu:  xp_gagne,
      statut:     'done',  // ✅ statut dans mission_validation
    })

  if (insertErr) return { error: insertErr }

  // 5. Marquer id_user_accompli dans mission (PAS de statut)
  await supabase
    .from('mission')
    .update({ id_user_accompli: userId })
    .eq('id_mission', missionId)

  // 6. Mettre à jour defi_participants
  const { data: current } = await supabase
    .from('defi_participants')
    .select('minutes_etudies, xp_total')
    .eq('id_defi', defiId)
    .eq('id_user', userId)
    .maybeSingle()

  if (current) {
    await supabase
      .from('defi_participants')
      .update({
        minutes_etudies: (current.minutes_etudies ?? 0) + (mission.duree_min ?? 0),
        xp_total:        (current.xp_total        ?? 0) + xp_gagne,
      })
      .eq('id_defi', defiId)
      .eq('id_user', userId)
  } else {
    await supabase
      .from('defi_participants')
      .insert({
        id_defi:         defiId,
        id_user:         userId,
        minutes_etudies: mission.duree_min ?? 0,
        xp_total:        xp_gagne,
        score:           0,
      })
  }

  // 7. Calculer nouvelles stats
  const nouvellesStats = calculerNouvellesStats(
    statsActuelles,
    {
      type_mission:      mission.type_mission ?? 'revision',
      difficulte:        mission.difficulte   ?? 1,
      missions_total:    missionsTotal,
      missions_faites:   missionsFaites + 1,
      missions_oubliees: missionsOubliees,
    },
    statsCibles
  )

  // 8. Sauvegarder stats user
  await supabase.from('users').update({ energie: nouvellesStats.energie }).eq('id_user', userId)

  const { data: psExist } = await supabase
    .from('player_stats').select('id_stats').eq('id_user', userId).maybeSingle()

  if (psExist) {
    await supabase
      .from('player_stats')
      .update({
        stress:       nouvellesStats.stress,
        connaissance: nouvellesStats.connaissances,
        organisation: nouvellesStats.organisation,
        energie:      nouvellesStats.energie,
        date_maj:     now,
      })
      .eq('id_user', userId)
  } else {
    await supabase
      .from('player_stats')
      .insert({
        id_user:      userId,
        stress:       nouvellesStats.stress,
        connaissance: nouvellesStats.connaissances,
        organisation: nouvellesStats.organisation,
        energie:      nouvellesStats.energie,
      })
  }

  // 9. Historiser
  const bonusLabel = statsCibles.length > 0 ? ` [Bonus ×1.5 : ${statsCibles.join(', ')}]` : ''
  await supabase
    .from('stat_history')
    .insert({
      id_user:      userId,
      stress:       nouvellesStats.stress,
      energie:      nouvellesStats.energie,
      connaissance: nouvellesStats.connaissances,
      organisation: nouvellesStats.organisation,
      cause:        `Mission cochée : ${mission.titre}${bonusLabel}`,
    })

  return { xp_gagne, nouvellesStats, statsCibles, error: null }
}

export const calculerEtSauvegarderScoreDefi = async (params: { userId: number; defiId: number; defiInfo: DefiDetailDB }) => {
  const { userId, defiId, defiInfo } = params

  const { data: validations } = await supabase
    .from('mission_validation')
    .select('xp_obtenu, date_fin, mission!inner ( difficulte, id_defi )')
    .eq('id_user', userId)
    .eq('mission.id_defi', defiId)
    .order('date_fin', { ascending: false })

  if (!validations || validations.length === 0)
    return { score: 0, xp_total: 0, difficulte_moy: 0, bonus_rapidite: 0, error: null }

  const { xp_total, difficulte_moy, bonus_rapidite, score_final } = calculerScoreDefi({
    xp_missions:     validations.map((v: any) => v.xp_obtenu          ?? 0),
    difficultes:     validations.map((v: any) => v.mission?.difficulte ?? 1),
    date_debut:      defiInfo.date_debut ?? new Date().toISOString(),
    date_fin_defi:   defiInfo.date_fin   ?? new Date().toISOString(),
    date_completion: validations[0].date_fin,
  })

  const { error } = await supabase
    .from('defi_participants')
    .update({ score: score_final })
    .eq('id_defi', defiId)
    .eq('id_user', userId)

  return { score: score_final, xp_total, difficulte_moy, bonus_rapidite, error }
}

export const getClassementDefi = async (defiId: number): Promise<{ data: ScoreDefi[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('defi_participants')
    .select('id_user, score, xp_total, minutes_etudies, users ( nom, prenom )')
    .eq('id_defi', defiId)
    .order('score', { ascending: false })

  if (error) return { data: null, error }

  return {
    data: (data ?? []).map((row: any, i: number) => ({
      id_user:         row.id_user,
      nom:             `${row.users?.prenom ?? ''} ${row.users?.nom ?? ''}`.trim() || 'Inconnu',
      xp_total:        row.xp_total ?? 0,
      difficulte_moy:  0,
      bonus_rapidite:  0,
      score_final:     row.score    ?? 0,
      rang:            i + 1,
      missions_faites: 0,
    })),
    error: null,
  }
}

export const verifierVictoireDefi = async (defiId: number, objectif_minutes: number) => {
  const { data } = await supabase
    .from('defi_participants')
    .select('minutes_etudies')
    .eq('id_defi', defiId)
  const totalMinutes = (data ?? []).reduce((s: number, r: any) => s + (r.minutes_etudies ?? 0), 0)
  return { gagne: totalMinutes >= objectif_minutes, totalMinutes, objectif_minutes }
}

export const addTempsEtudie = async (defiId: number, userId: number, minutesAjoutees: number) => {
  const { data: current } = await supabase
    .from('defi_participants')
    .select('minutes_etudies')
    .eq('id_defi', defiId)
    .eq('id_user', userId)
    .maybeSingle()

  if (!current) {
    return supabase
      .from('defi_participants')
      .insert({ id_defi: defiId, id_user: userId, minutes_etudies: minutesAjoutees, score: 0, xp_total: 0 })
      .select().single()
  }

  return supabase
    .from('defi_participants')
    .update({ minutes_etudies: (current.minutes_etudies ?? 0) + minutesAjoutees })
    .eq('id_defi', defiId)
    .eq('id_user', userId)
    .select().single()
}

export const getStatsUtilisateur = async (userId: number): Promise<{ data: StatsUtilisateur | null; error: any }> => {
  const [{ data: userData }, { data: psData }] = await Promise.all([
    supabase.from('users').select('energie').eq('id_user', userId).single(),
    supabase.from('player_stats').select('stress, connaissance, organisation').eq('id_user', userId).maybeSingle(),
  ])

  return {
    data: {
      stress:        psData?.stress        ?? 50,
      energie:       userData?.energie     ?? 80,
      organisation:  psData?.organisation  ?? 50,
      connaissances: psData?.connaissance  ?? 0,
      discipline:    50,
      serenite:      50,
      concentration: 70,
    },
    error: null,
  }
}

export const formatRelativeTime = (isoDate: string): string => {
  const diff  = Date.now() - new Date(isoDate).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins  < 1)  return 'À l\'instant'
  if (mins  < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}