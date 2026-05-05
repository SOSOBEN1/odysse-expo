import { supabase } from '../app/frontend/constants/supabase'

export interface InvitationPayload {
  email: string
  invitedUserId?: number   // ← si on le connaît déjà, on évite le lookup email
  defiId: number
  defiNom?: string
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
// 2. NOTIFICATION IN-APP
// ─────────────────────────────────────────────
export const createInvitationNotification = async (payload: InvitationPayload) => {
  console.log("🔔 createInvitationNotification →", payload.email)

  // 🔍 1. Trouver l'id du destinataire (depuis payload direct ou lookup email)
  let destUserId: number | null = payload.invitedUserId ?? null

  console.log("🔔 payload reçu:", JSON.stringify(payload))

  if (!destUserId) {
    const { data: userFound, error: userError } = await supabase
      .from('users')
      .select('id_user')
      .eq('email', payload.email)
      .single()

    console.log("🔍 userFound by email =", userFound, "error =", userError)

    if (!userError && userFound) {
      destUserId = userFound.id_user
    }
  } else {
    console.log("✅ invitedUserId fourni directement:", destUserId)
  }

  console.log("🎯 destUserId final:", destUserId, "inviteurId:", payload.inviteurId)

  // 📦 2. Créer la notification avec inviteur_id
  const notifPayload: any = {
    id_defi:       payload.defiId,
    inviteur_id:   payload.inviteurId,
    type:          'invitation_defi',
    titre:         `🏆 ${payload.inviteurNom} t'invite à un défi !`,
    message:       `Rejoins le défi et gagne des XP !`,
    lu:            false,
  }

  // Ajoute id_user_cible seulement si on l'a trouvé
  if (destUserId) {
    notifPayload.id_user_cible = destUserId
  }

  console.log("📦 notifPayload final:", JSON.stringify(notifPayload))

  console.log("📦 notifPayload =", notifPayload)

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

  console.log(`🚀 END → email:${emailOk ? "✅" : "❌"} notif:${notifOk ? "✅" : "❌"}`)

  if (!emailOk) console.error("email error:", emailResult.error)
  if (!notifOk) console.error("notif error:", notifResult.error)

  return { emailOk, notifOk }
}

// ─────────────────────────────────────────────
// 4. GET NOTIFICATIONS
// ─────────────────────────────────────────────
export const getNotifications = async (userId: number) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id_user_cible', userId)
    .order('id_notification', { ascending: false })

  return { data, error }
}

// ─────────────────────────────────────────────
// 5. MARK AS READ
// ─────────────────────────────────────────────
export const marquerNotificationLue = async (notifId: number) => {
  return await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id_notification', notifId)
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

// ─────────────────────────────────────────────
// 7. ACCEPTER une invitation
// ─────────────────────────────────────────────
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
    .eq('id_notification', notifId)

  console.log("✅ participant ajouté defiId=", defiId, "userId=", userId, "err=", partError)

  return { error: partError }
}

// ─────────────────────────────────────────────
// 8. REFUSER une invitation
// ─────────────────────────────────────────────
export const refuserInvitation = async (notifId: number) => {
  const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id_notification', notifId)
  return { error }
}