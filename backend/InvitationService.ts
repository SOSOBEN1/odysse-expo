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
  console.log("🔔 createInvitationNotification → email:", payload.email)

  const { data: userFound, error: userError } = await supabase
    .from('users')
    .select('id_user')
    .eq('email', payload.email)
    .maybeSingle()

  if (userError) {
    console.warn("🔔 ⚠️ Recherche user échouée:", JSON.stringify(userError))
  } else {
    console.log("🔔 User trouvé:", userFound ? `id=${userFound.id_user}` : "aucun (email externe)")
  }

  const notifPayload = {
    id_user_cible: userFound?.id_user ?? null,
    email_cible:   userFound ? null : payload.email,
    id_defi:       payload.defiId > 0 ? payload.defiId : null,
    type:          'invitation_defi',
    titre:         `🏆 ${payload.inviteurNom} t'invite à un défi !`,
    message:       `Rejoins le défi « ${payload.defiNom} » et gagne des XP !`,
    lu:            false,
  }

  console.log("🔔 Insert notification:", JSON.stringify(notifPayload))

  const { error } = await supabase
    .from('notifications')
    .insert(notifPayload)

  if (error) {
    console.error("🔔 ❌ Insert notification échoué:", JSON.stringify(error))
  } else {
    console.log("🔔 ✅ Notification créée avec succès")
  }

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