// backend/DefisService.ts
import { supabase } from '../app/frontend/constants/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DefiDB {
  id_defi?:          number
  nom:               string
  description?:      string
  date_debut?:       string
  date_fin?:         string
  icon?:             'book' | 'sport' | 'rocket'
  xp?:               number
  statut?:           'actif' | 'en_attente' | 'termine'
  id_user?:          number
  participants?:     number
  duration_label?:   string
  objectif_minutes?: number
}

// ─── GET tous les défis d'un utilisateur ─────────────────────────────────────
export const getDefis = async (userId: number) => {
  const { data, error } = await supabase
    .from('defis')
    .select('*')
    .eq('id_user', userId)
    .order('date_debut', { ascending: false })
  return { data, error }
}

// ─── GET par statut (pour les 3 tabs) ────────────────────────────────────────
export const getDefisByStatut = async (userId: number, statut: string) => {
  const { data, error } = await supabase
    .from('defis')
    .select('*')
    .eq('id_user', userId)
    .eq('statut', statut)
  return { data, error }
}

// ─── ADD ──────────────────────────────────────────────────────────────────────
export const addDefi = async (defi: DefiDB) => {
  const { data, error } = await supabase
    .from('defis')
    .insert(defi)
    .select()
    .single()
  return { data, error }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateDefi = async (id: number, updates: Partial<DefiDB>) => {
  const { data, error } = await supabase
    .from('defis')
    .update(updates)
    .eq('id_defi', id)
    .select()
    .single()
  return { data, error }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteDefi = async (id: number) => {
  const { error } = await supabase
    .from('defis')
    .delete()
    .eq('id_defi', id)
  return { error }
}

// ─── COMPLETE ─────────────────────────────────────────────────────────────────
export const completeDefi = async (id: number) => {
  const { data, error } = await supabase
    .from('defis')
    .update({ statut: 'termine' })
    .eq('id_defi', id)
    .select()
    .single()
  return { data, error }
}