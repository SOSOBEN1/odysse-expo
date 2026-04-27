import { supabase } from '../app/frontend/constants/supabase'

export interface MissionDB {
  id_mission?:          number
  id_defi:              number
  titre:                string
  description?:         string | null
  duree_min?:           number | null   // en minutes (nombre)
  difficulte?:          number | null   // 1=Facile 2=Moyen 3=Difficile
  priorite?:            number | null   // 1=Faible 2=Normale 3=Haute
  energie_cout?:        number | null
  stress_gain?:         number | null
  connaissance_gain?:   number | null
  organisation_gain?:   number | null
  xp_gain?:             number | null
  date_limite?:         string | null   // ISO string
  progression?:         number
  id_user_accompli?:  number | null
}

export const addMissions = async (missions: MissionDB[]) => {
  const { data, error } = await supabase
    .from('mission')
    .insert(missions)
    .select()
  return { data, error }
}

export const getMissionsByDefi = async (defiId: number) => {
  const { data, error } = await supabase
    .from('mission')
    .select('*')
    .eq('id_defi', defiId)
    .order('id_mission', { ascending: true })
  return { data, error }
}

export const updateMission = async (id: number, updates: Partial<MissionDB>) => {
  const { data, error } = await supabase
    .from('mission')
    .update(updates)
    .eq('id_mission', id)
    .select()
    .single()
  return { data, error }
}

export const deleteMission = async (id: number) => {
  const { error } = await supabase
    .from('mission')
    .delete()
    .eq('id_mission', id)
  return { error }
}