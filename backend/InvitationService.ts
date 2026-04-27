import { supabase } from '../app/frontend/constants/supabase'

export interface InvitationPayload {
  email: string
  defiId: number
  defiDescription?: string
  inviteurNom: string
  inviteurId: number
}

// ─────────────────────────────────────────────
// 1. EMAIL (Edge Function)
// ─────────────────────────────────────────────
export const sendInvitationEmail = async (payload: InvitationPayload) => {
  console.log("📧 sendInvitationEmail →", payload.email)

  try {
    const { data, error } = await supabase.functions.invoke('send-invitation', {
      body: {
        to: payload.email,
        defiDescription: payload.defiDescription ?? '',
        inviteurNom: payload.inviteurNom,
        defiId: payload.defiId,
        appLink: `myapp://defis/rejoindre/${payload.defiId}`,
      },
    })

    if (error) {
      console.error("📧 Edge Function error:", error)
      return { data: null, error }
    }

    console.log("📧 Email OK")
    return { data, error: null }

  } catch (err) {
    console.error("📧 Exception:", err)
    return { data: null, error: err }
  }
}

// ─────────────────────────────────────────────
// 2. NOTIFICATION IN-APP (FIXED)
// ─────────────────────────────────────────────
export const createInvitationNotification = async (payload: InvitationPayload) => {

  console.log("🔔 createInvitationNotification →", payload.email)

  // 🔍 1. Find user
  const { data: userFound, error: userError } = await supabase
    .from('users')
    .select('id_user')
    .eq('email', payload.email)
    .single()

  console.log("🔍 userFound =", userFound)

  if (userError || !userFound) {
    console.log("❌ User introuvable → notif annulée")
    return { error: "User not found" }
  }

  // 📦 2. Create notif
  const notifPayload = {
  id_user_cible: userFound.id_user,  // ✅ doit être rempli
  id_defi: payload.defiId,
  type: 'invitation_defi',
  titre: `🏆 ${payload.inviteurNom} t'invite à un défi !`,
  message: `Rejoins le défi et gagne des XP !`,
  lu: false,
}

  console.log("📦 notifPayload =", notifPayload)

  // 💾 3. Insert
  const { error } = await supabase
    .from('notifications')
    .insert(notifPayload)

  if (error) {
    console.error("❌ insert notif error:", error)
  } else {
    console.log("✅ notification créée")
  }

  return { error }
}

// ─────────────────────────────────────────────
// 3. COMBO EMAIL + NOTIF
// ─────────────────────────────────────────────
export const inviterAmi = async (payload: InvitationPayload) => {

  console.log("🚀 inviterAmi START →", payload.email)

  const [emailResult, notifResult] = await Promise.all([
    sendInvitationEmail(payload),
    createInvitationNotification(payload),
  ])

  const emailOk = !emailResult.error
  const notifOk = !notifResult.error

  console.log(
    `🚀 END → email:${emailOk ? "✅" : "❌"} notif:${notifOk ? "✅" : "❌"}`
  )

  if (!emailOk) console.error("email error:", emailResult.error)
  if (!notifOk) console.error("notif error:", notifResult.error)

  return { emailOk, notifOk }
}

// ─────────────────────────────────────────────
// 4. GET NOTIFICATIONS (FIXED)
// ─────────────────────────────────────────────
export const getNotifications = async (userId: number) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id_user_cible', userId)
    .order('id_notification', { ascending: false })  // ✅ vrai nom

  return { data, error }
}

// ─────────────────────────────────────────────
// 5. MARK AS READ
// ─────────────────────────────────────────────
export const marquerNotificationLue = async (notifId: number) => {
  return await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id_notification', notifId)  // ✅
}

// ─────────────────────────────────────────────
// 6. COUNT UNREAD
// ─────────────────────────────────────────────
export const countNotifsNonLues = async (userId: number) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('id_user_cible', userId)
    .eq('lu', false)

  return { count: count ?? 0, error }
}
// ─── 7. Accepter une invitation ───────────────────────────────────────────────
// InvitationService.ts - accepterInvitation
// La ligne upsert doit utiliser id_notification, pas id
export const accepterInvitation = async (notifId: number, defiId: number, userId: number) => {
  if (!notifId || !defiId || !userId) return { error: "Paramètres invalides" }

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

  await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id_notification', notifId)  // ✅ bon nom de colonne

  // Log pour debug
  console.log("✅ participant ajouté defiId=", defiId, "userId=", userId, "err=", partError)

  return { error: partError }
}

// ─── 8. Refuser une invitation ────────────────────────────────────────────────
export const refuserInvitation = async (notifId: number) => {
  const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id_notification', notifId)  // ✅
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
