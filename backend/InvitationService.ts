// backend/InvitationService.ts
import { supabase } from '../app/frontend/constants/supabase'

export interface InvitationPayload {
  email:            string
  defiId:           number
  defiNom:          string
  defiDescription?: string
  inviteurNom:      string
  inviteurId:       number
}

// ─── 1. Email via Edge Function ───────────────────────────────────────────────
export const sendInvitationEmail = async (payload: InvitationPayload) => {
  console.log("📧 sendInvitationEmail → envoi vers:", payload.email)

  try {
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        to:              payload.email,
        defiNom:         payload.defiNom,
        defiDescription: payload.defiDescription ?? '',
        inviteurNom:     payload.inviteurNom,
        defiId:          payload.defiId,
        appLink:         `myapp://defis/rejoindre/${payload.defiId}`,
      },
    })

    if (error) {
      console.error("📧 ❌ Edge Function error:", JSON.stringify(error))
      return { data: null, error }
    }

    console.log("📧 ✅ Edge Function response:", JSON.stringify(data))
    return { data, error: null }

  } catch (err) {
    console.error("📧 ❌ Exception:", String(err))
    return { data: null, error: err }
  }
}

// ─── 2. Notification in-app ───────────────────────────────────────────────────
export const createInvitationNotification = async (payload: InvitationPayload) => {
  const { data: userFound } = await supabase
    .from('users')
    .select('id_user')
    .eq('email', payload.email)
    .maybeSingle()

  const notifPayload = {
    id_user_cible: userFound?.id_user ?? null,
    email_cible:   userFound ? null : payload.email,
    id_defi:       payload.defiId > 0 ? payload.defiId : null,
    type:          'invitation_defi',
    titre:         `🏆 ${payload.inviteurNom} t'invite à un défi !`,
    message:       `Rejoins le défi « ${payload.defiNom} » et gagne des XP !`,
    defi_nom:      payload.defiNom, // ✅ AJOUT IMPORTANT
    lu:            false,
  }

  const { error } = await supabase
    .from('notifications')
    .insert(notifPayload)

  return { error }
}

// ─── 3. Combo email + notification ───────────────────────────────────────────
export const inviterAmi = async (payload: InvitationPayload) => {
  console.log("🚀 inviterAmi START →", payload.email, "| défi:", payload.defiNom)

  const [emailResult, notifResult] = await Promise.all([
    sendInvitationEmail(payload),
    createInvitationNotification(payload),
  ])

  const emailOk = !emailResult.error
  const notifOk = !notifResult.error

  console.log(`🚀 inviterAmi END → email:${emailOk ? "✅" : "❌"} notif:${notifOk ? "✅" : "❌"}`)
  if (!emailOk) console.error("🚀 emailErr:", JSON.stringify(emailResult.error))
  if (!notifOk) console.error("🚀 notifErr:", JSON.stringify(notifResult.error))

  return { emailOk, notifOk, emailErr: emailResult.error, notifErr: notifResult.error }
}

// ─── 4. Lire les notifications d'un user ─────────────────────────────────────
export const getNotifications = async (userId: number) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id_user_cible', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

// ─── 5. Marquer une notification comme lue ───────────────────────────────────
export const marquerNotificationLue = async (notifId: number) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id', notifId)
    .select()
    .single()
  return { data, error }
}

// ─── 6. Compter les notifications non lues ───────────────────────────────────
export const countNotifsNonLues = async (userId: number) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('id_user_cible', userId)
    .eq('lu', false)
  return { count: count ?? 0, error }
}
// ─── 7. Accepter une invitation ───────────────────────────────────────────────
export const accepterInvitation = async (notifId: number, defiId: number, userId: number) => {
  if (!notifId || !defiId || !userId) {
    return { error: "Paramètres invalides" }
  }

  // ✅ Ajout participant SEULEMENT ici
  const { error: partError } = await supabase
    .from('defi_participants')
    .upsert({
      id_defi:         defiId,
      id_user:         userId,
      minutes_etudies: 0,
      xp_total:        0,
      score:           0,
      joined_at:       new Date().toISOString(),
    }, { onConflict: 'id_defi,id_user' })

  // ✅ Marquer notif comme lue
  await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id', notifId)

  return { error: partError }
}

// ─── 8. Refuser une invitation ────────────────────────────────────────────────
export const refuserInvitation = async (notifId: number) => {
  const { error } = await supabase
    .from('notifications')
    .update({ lu: true }) // tu peux ajouter status: 'refused'
    .eq('id', notifId)

  return { error }
}
// // // ─── Ajouts à DefisService.ts ─────────────────────────────────────────────────
// // // Colle ces fonctions dans ton fichier backend/DefisService.ts existant

// // import { supabase } from '../frontend/constants/supabase';

// // ── 1. Charger les infos complètes d'un défi ──────────────────────────────────
// export const getDefiById = async (id_defi: number) => {
//   const { data, error } = await supabase
//     .from("defis")
//     .select("*")
//     .eq("id_defi", id_defi)
//     .single();
//   return { data, error };
// };

// // ── 2. Charger les missions d'un défi avec leur validateur ────────────────────
// export const getMissionsDefi = async (id_defi: number) => {
//   const { data, error } = await supabase
//     .from("mission")
//     .select(`
//       id_mission,
//       titre,
//       description,
//       statut,
//       duree_min,
//       difficulte,
//       xp_gain,
//       progression,
//       date_limite,
//       id_user_accompli,
//       users!mission_id_user_accompli_fkey(prenom, nom, username)
//     `)
//     .eq("id_defi", id_defi)
//     .order("id_mission");
//   return { data, error };
// };

// // ── 3. Charger participants + leur temps étudié via mission_validation ─────────
// export const getParticipantsDefi = async (id_defi: number) => {
//   // Récupère toutes les validations de missions liées à ce défi
//   const { data, error } = await supabase
//     .from("mission_validation")
//     .select(`
//       id_user,
//       xp_obtenu,
//       date_debut,
//       date_fin,
//       users!inner(prenom, nom, username, avatar_url),
//       mission!inner(duree_min, difficulte, xp_gain, id_defi)
//     `)
//     .eq("mission.id_defi", id_defi);
//   return { data, error };
// };

// // ── 4. Ajouter du temps à une mission (validation partielle) ──────────────────
// export const ajouterTempsEtude = async (
//   id_user: number,
//   id_mission: number,
//   minutes: number,
//   xp_obtenu: number
// ) => {
//   const { data, error } = await supabase
//     .from("mission_validation")
//     .upsert({
//       id_user,
//       id_mission,
//       date_debut: new Date().toISOString(),
//       date_fin:   new Date(Date.now() + minutes * 60000).toISOString(),
//       xp_obtenu,
//     }, { onConflict: "id_user,id_mission" });
//   return { data, error };
// };

// // ── 5. Marquer une mission comme terminée ─────────────────────────────────────
// export const terminerMission = async (id_mission: number, id_user: number) => {
//   const { data, error } = await supabase
//     .from("mission")
//     .update({ statut: "termine", id_user_accompli: id_user })
//     .eq("id_mission", id_mission);
//   return { data, error };
// };

// // ── 6. Calcul du score défi et sauvegarde dans resultat_defi ──────────────────
// export const calculerEtSauvegarderScore = async (
//   id_defi: number,
//   id_user: number,
//   validations: any[],
//   date_debut_defi: string,
//   date_fin_defi: string
// ): Promise<number> => {
//   // XP total gagné par cet user
//   const xp_total = validations.reduce((sum, mv) => sum + (mv.xp_obtenu ?? 0), 0);

//   // Difficulté moyenne des missions faites
//   const diffs = validations.map(mv => mv.mission?.difficulte).filter(Boolean);
//   const diff_moyenne = diffs.length > 0
//     ? diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length
//     : 1;

//   // Bonus rapidité
//   const debut    = new Date(date_debut_defi);
//   const fin      = new Date(date_fin_defi);
//   const duree_jours = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));

//   const dates_fin = validations
//     .map(mv => mv.date_fin ? new Date(mv.date_fin) : null)
//     .filter(Boolean) as Date[];

//   const derniere = dates_fin.sort((a, b) => b.getTime() - a.getTime())[0];
//   const jours_pris = derniere
//     ? Math.ceil((derniere.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24))
//     : duree_jours;

//   const bonus_rapidite = Math.max(0, (duree_jours - jours_pris) * 10);

//   // Score final plafonné à 500
//   const score = Math.min(500, Math.round(xp_total + (diff_moyenne * 10) + bonus_rapidite));

//   // Créer d'abord un classement si nécessaire
//   const { data: classement } = await supabase
//     .from("classement")
//     .insert({ id_defi })
//     .select("id_classement")
//     .single();

//   if (classement) {
//     await supabase.from("resultat_defi").upsert({
//       id_defi,
//       id_user,
//       id_classement: classement.id_classement,
//       score,
//       rang: 0, // sera mis à jour après tri de tous les participants
//     });
//   }

//   return score;
// };

// // ── 7. Récupérer le classement final d'un défi ────────────────────────────────
// export const getClassementDefi = async (id_defi: number) => {
//   const { data, error } = await supabase
//     .from("resultat_defi")
//     .select(`
//       score,
//       rang,
//       users!inner(id_user, prenom, nom, username, avatar_url)
//     `)
//     .eq("id_defi", id_defi)
//     .order("score", { ascending: false });
//   return { data, error };
// };