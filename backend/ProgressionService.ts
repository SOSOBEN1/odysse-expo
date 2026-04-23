// backend/ProgressionService.ts
import { supabase } from '../app/frontend/constants/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParticipantDB {
  id_user:          number
  nom:              string
  email?:           string
  minutes_etudies?: number
  avatar_color?:    string
  avatar_emoji?:    string
}

export interface MissionDB {
  id_mission:         number
  id_defi:            number
  titre:              string
  description?:       string
  duree?:             string
  statut:             'en_attente' | 'en_cours' | 'termine'
  progression?:       number
  id_user_accompli?:  number
  nom_user_accompli?: string
}

export interface ActiviteDB {
  id:            number
  id_defi:       number
  id_user:       number
  nom_user:      string
  avatar_emoji?: string
  action:        string
  created_at:    string
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

// ─── GET détail d'un défi ────────────────────────────────────────────────────
export const getDefiDetail = async (defiId: number) => {
  const { data, error } = await supabase
    .from('defis')
    .select('*')
    .eq('id_defi', defiId)
    .single()
  return { data, error }
}

// ─── GET participants d'un défi ───────────────────────────────────────────────
export const getParticipants = async (defiId: number) => {
  const { data, error } = await supabase
    .from('defi_participants')
    .select(`
      id_user,
      minutes_etudies,
      users ( nom, email, avatar_emoji, avatar_color )
    `)
    .eq('id_defi', defiId)

  if (error) return { data: null, error }

  const mapped: ParticipantDB[] = (data ?? []).map((row: any) => ({
    id_user:         row.id_user,
    nom:             row.users?.nom       ?? 'Inconnu',
    email:           row.users?.email,
    minutes_etudies: row.minutes_etudies  ?? 0,
    avatar_color:    row.users?.avatar_color ?? '#CE93D8',
    avatar_emoji:    row.users?.avatar_emoji ?? '👤',
  }))

  return { data: mapped, error: null }
}

// ─── Ajouter du temps pour un participant ─────────────────────────────────────
export const addTempsEtudie = async (defiId: number, userId: number, minutesAjoutees: number) => {
  // Vérifier si le participant existe déjà
  const { data: current, error: fetchErr } = await supabase
    .from('defi_participants')
    .select('minutes_etudies')
    .eq('id_defi', defiId)
    .eq('id_user', userId)
    .maybeSingle()

  if (!current) {
    // Insérer si pas encore participant
    const { data, error } = await supabase
      .from('defi_participants')
      .insert({ id_defi: defiId, id_user: userId, minutes_etudies: minutesAjoutees })
      .select()
      .single()
    if (!error) await logActivite(defiId, userId, `a ajouté ${minutesAjoutees} min d'étude`)
    return { data, error }
  }

  const newTotal = (current.minutes_etudies ?? 0) + minutesAjoutees

  const { data, error } = await supabase
    .from('defi_participants')
    .update({ minutes_etudies: newTotal })
    .eq('id_defi', defiId)
    .eq('id_user', userId)
    .select()
    .single()

  if (!error) await logActivite(defiId, userId, `a ajouté ${minutesAjoutees} min d'étude`)

  return { data, error }
}

// ─── GET missions d'un défi ──────────────────────────────────────────────────
// ⚠️  Table = 'mission' (singulier dans ton schéma Supabase)
export const getMissions = async (defiId: number) => {
  const { data, error } = await supabase
    .from('mission')
    .select(`
      id_mission,
      id_defi,
      titre,
      description,
      duree,
      statut,
      progression,
      id_user_accompli,
      users ( nom )
    `)
    .eq('id_defi', defiId)
    .order('id_mission', { ascending: true })

  if (error) return { data: null, error }

  const mapped: MissionDB[] = (data ?? []).map((row: any) => ({
    id_mission:        row.id_mission,
    id_defi:           row.id_defi,
    titre:             row.titre       ?? '',
    description:       row.description ?? '',
    duree:             row.duree       ?? '',
    statut:            row.statut      ?? 'en_attente',
    progression:       row.progression ?? 0,
    id_user_accompli:  row.id_user_accompli,
    nom_user_accompli: row.users?.nom  ?? '',
  }))

  return { data: mapped, error: null }
}

// ─── Marquer une mission comme terminée ──────────────────────────────────────
export const completerMission = async (missionId: number, userId: number, defiId: number) => {
  const { data, error } = await supabase
    .from('mission')
    .update({ statut: 'termine', progression: 100, id_user_accompli: userId })
    .eq('id_mission', missionId)
    .select()
    .single()

  if (!error) await logActivite(defiId, userId, `a complété la mission #${missionId}`)

  return { data, error }
}

// ─── Mettre à jour la progression d'une mission ──────────────────────────────
export const updateProgression = async (missionId: number, progression: number) => {
  const statut = progression >= 100 ? 'termine' : 'en_cours'
  const { data, error } = await supabase
    .from('mission')
    .update({ progression, statut })
    .eq('id_mission', missionId)
    .select()
    .single()
  return { data, error }
}

// ─── GET fil d'activité d'un défi ─────────────────────────────────────────────
export const getActivite = async (defiId: number, limit = 20) => {
  const { data, error } = await supabase
    .from('defi_activite')
    .select(`
      id,
      id_defi,
      id_user,
      action,
      created_at,
      users ( nom, avatar_emoji )
    `)
    .eq('id_defi', defiId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }

  const mapped: ActiviteDB[] = (data ?? []).map((row: any) => ({
    id:           row.id,
    id_defi:      row.id_defi,
    id_user:      row.id_user,
    nom_user:     row.users?.nom          ?? 'Quelqu\'un',
    avatar_emoji: row.users?.avatar_emoji ?? '👤',
    action:       row.action              ?? '',
    created_at:   row.created_at,
  }))

  return { data: mapped, error: null }
}

// ─── Logger une activité ──────────────────────────────────────────────────────
export const logActivite = async (defiId: number, userId: number, action: string) => {
  const { error } = await supabase
    .from('defi_activite')
    .insert({ id_defi: defiId, id_user: userId, action })
  return { error }
}

// ─── Formatter le temps relatif ───────────────────────────────────────────────
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