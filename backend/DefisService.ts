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
  // Défis créés par l'user
  const { data: mesDefis } = await supabase
    .from('defis')
    .select('*')
    .eq('id_user', userId)
    .eq('statut', statut)

  // Défis où l'user est participant (invité)
  const { data: participations } = await supabase
    .from('defi_participants')
    .select('id_defi')
    .eq('id_user', userId)

  const participantIds = (participations ?? []).map((p: any) => p.id_defi)

  let defisParticipant: any[] = []
  if (participantIds.length > 0) {
    const { data } = await supabase
      .from('defis')
      .select('*')
      .in('id_defi', participantIds)
      .eq('statut', statut)
      .neq('id_user', userId) // éviter les doublons
    defisParticipant = data ?? []
  }

  // Fusionner sans doublons
  const tous = [...(mesDefis ?? []), ...defisParticipant]
  return { data: tous, error: null }
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
// ─── Ajouts à DefisService.ts ─────────────────────────────────────────────────
// Colle ces fonctions dans ton fichier backend/DefisService.ts existant


// ── 1. Charger les infos complètes d'un défi ──────────────────────────────────
export const getDefiById = async (id_defi: number) => {
  const { data, error } = await supabase
    .from("defis")
    .select("*")
    .eq("id_defi", id_defi)
    .single();
  return { data, error };
};

// ── 2. Charger les missions d'un défi avec leur validateur ────────────────────
export const getMissionsDefi = async (id_defi: number) => {
  const { data, error } = await supabase
    .from("mission")
    .select(`
      id_mission,
      titre,
      description,
      statut,
      duree_min,
      difficulte,
      xp_gain,
      progression,
      date_limite,
      id_user_accompli,
      users!mission_id_user_accompli_fkey(prenom, nom, username)
    `)
    .eq("id_defi", id_defi)
    .order("id_mission");
  return { data, error };
};

// ── 3. Charger participants + leur temps étudié via mission_validation ─────────
export const getParticipantsDefi = async (id_defi: number) => {
  // Récupère toutes les validations de missions liées à ce défi
  const { data, error } = await supabase
    .from("mission_validation")
    .select(`
      id_user,
      xp_obtenu,
      date_debut,
      date_fin,
      users!inner(prenom, nom, username, avatar_url),
      mission!inner(duree_min, difficulte, xp_gain, id_defi)
    `)
    .eq("mission.id_defi", id_defi);
  return { data, error };
};

// ── 4. Ajouter du temps à une mission (validation partielle) ──────────────────
export const ajouterTempsEtude = async (
  id_user: number,
  id_mission: number,
  minutes: number,
  xp_obtenu: number
) => {
  const { data, error } = await supabase
    .from("mission_validation")
    .upsert({
      id_user,
      id_mission,
      date_debut: new Date().toISOString(),
      date_fin:   new Date(Date.now() + minutes * 60000).toISOString(),
      xp_obtenu,
    }, { onConflict: "id_user,id_mission" });
  return { data, error };
};

// ── 5. Marquer une mission comme terminée ─────────────────────────────────────
export const terminerMission = async (id_mission: number, id_user: number) => {
  const { data, error } = await supabase
    .from("mission")
    .update({ statut: "termine", id_user_accompli: id_user })
    .eq("id_mission", id_mission);
  return { data, error };
};

// ── 6. Calcul du score défi et sauvegarde dans resultat_defi ──────────────────
export const calculerEtSauvegarderScore = async (
  id_defi: number,
  id_user: number,
  validations: any[],
  date_debut_defi: string,
  date_fin_defi: string
): Promise<number> => {
  // XP total gagné par cet user
  const xp_total = validations.reduce((sum, mv) => sum + (mv.xp_obtenu ?? 0), 0);

  // Difficulté moyenne des missions faites
  const diffs = validations.map(mv => mv.mission?.difficulte).filter(Boolean);
  const diff_moyenne = diffs.length > 0
    ? diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length
    : 1;

  // Bonus rapidité
  const debut    = new Date(date_debut_defi);
  const fin      = new Date(date_fin_defi);
  const duree_jours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));

  const dates_fin = validations
    .map(mv => mv.date_fin ? new Date(mv.date_fin) : null)
    .filter(Boolean) as Date[];

  const derniere = dates_fin.sort((a, b) => b.getTime() - a.getTime())[0];
  const jours_pris = derniere
    ? Math.ceil((derniere.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
    : duree_jours;

  const bonus_rapidite = Math.max(0, (duree_jours - jours_pris) * 10);

  // Score final plafonné à 500
  const score = Math.min(500, Math.round(xp_total + (diff_moyenne * 10) + bonus_rapidite));

  // Créer d'abord un classement si nécessaire
  const { data: classement } = await supabase
    .from("classement")
    .insert({ id_defi })
    .select("id_classement")
    .single();

  if (classement) {
    await supabase.from("resultat_defi").upsert({
      id_defi,
      id_user,
      id_classement: classement.id_classement,
      score,
      rang: 0, // sera mis à jour après tri de tous les participants
    });
  }

  return score;
};

// ── 7. Récupérer le classement final d'un défi ────────────────────────────────
export const getClassementDefi = async (id_defi: number) => {
  const { data, error } = await supabase
    .from("resultat_defi")
    .select(`
      score,
      rang,
      users!inner(id_user, prenom, nom, username, avatar_url)
    `)
    .eq("id_defi", id_defi)
    .order("score", { ascending: false });
  return { data, error };
};