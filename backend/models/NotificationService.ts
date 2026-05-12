import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
// ── Helpers canal et son ─────────────────────────────────────────────────────
async function getChannelId(): Promise<string> {
  const reminders = await AsyncStorage.getItem('pref_reminders')
  return reminders !== 'false' ? 'odyssee_v2' : 'odyssee_silent'
}

async function getSound(): Promise<string | false> {
  const reminders = await AsyncStorage.getItem('pref_reminders')
  return reminders !== 'false' ? 'notification.wav' : false
}
// async function getChannelId(): Promise<string> {
//   return 'odyssee_v2'
// }

// async function getSound(): Promise<string> {
//   return 'notification.wav'
// }
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    const sound = await AsyncStorage.getItem('pref_sound')
    const reminders = await AsyncStorage.getItem('pref_reminders')

    return {
      shouldShowAlert: true,
      shouldPlaySound: sound !== 'false' && reminders !== 'false',
      shouldSetBadge: true,
    } as Notifications.NotificationBehavior
  },
})
export async function annulerNotification(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {})
}
export async function demanderPermission(): Promise<boolean> {
  if (!Device.isDevice) return false

  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (Platform.OS === 'android') {
  // Supprimer l'ancien canal d'abord
  // Dans demanderPermission
await Notifications.deleteNotificationChannelAsync('odyssee').catch(() => {})
await Notifications.setNotificationChannelAsync('odyssee_v2', {
  name: 'Odyssée',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#6C3FC8',
  sound: 'notification.wav',
})
}

  return finalStatus === 'granted'
}

const MESSAGES_INACTIVITE = [
  { titre: '🌟 Tu nous manques, aventurier !', body: 'Ton odyssée t\'attend... Reviens écrire ton histoire !' },
  { titre: '⚡ Le monde a besoin de toi !',    body: 'Des défis inexplorés t\'attendent. Es-tu prêt à les relever ?' },
  { titre: '🔥 La flamme ne doit pas s\'éteindre !', body: 'Chaque jour sans défi est une occasion manquée. Reviens !' },
  { titre: '💫 Ton aventure continue...',      body: 'Les meilleurs héros n\'abandonnent jamais. On croit en toi !' },
  { titre: '🎯 Objectif en attente !',         body: 'Tes défis te réclament. Reprends ta progression !' },
]

export async function planifierRappelInactivite(joursAvantRappel = 3) {
  await Notifications.cancelScheduledNotificationAsync('rappel-inactivite').catch(() => {})
  const msg = MESSAGES_INACTIVITE[Math.floor(Math.random() * MESSAGES_INACTIVITE.length)]
  await Notifications.scheduleNotificationAsync({
    identifier: 'rappel-inactivite',
    content: {
      title: msg.titre,
      body: msg.body,
      sound: 'notification.wav',
      data: { type: 'inactivite' },
      ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: joursAvantRappel * 24 * 60 * 60,
      repeats: false,
    },
  })
}

const MOTIVATIONS = [
  { titre: '🔥 Tu es en feu !',       body: 'Continue sur ta lancée, chaque défi compte !' },
  { titre: '💪 Force et courage !',    body: 'Tu avances chaque jour. Ne lâche rien !' },
  { titre: '🏆 Champion en devenir !', body: 'Les meilleurs ne lâchent jamais. Prouve-le !' },
  { titre: '⚡ Boost du jour',         body: 'Une journée de plus pour devenir la meilleure version de toi !' },
  { titre: '🌟 Objectif en vue !',     body: 'Tu es plus proche que tu ne le penses. Fonce !' },
]

export async function envoyerMotivation() {
  const msg = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)]
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.titre,
      body: msg.body,
      sound: 'notification.wav',
      data: { type: 'motivation' },
      ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
    },
    trigger: null,
  })
}

const RAPPELS_QUOTIDIENS = [
  { title: '🌅 Une nouvelle journée, une nouvelle victoire !', body: 'Approche-toi de ton objectif, chaque effort compte !' },
  { title: '💪 Fais une journée productive !', body: 'Les grands résultats viennent des petites actions quotidiennes.' },
  { title: '🎯 Tu es plus proche que hier !', body: 'Continue sur ta lancée, ton objectif est à portée de main !' },
  { title: '🔥 C\'est parti pour aujourd\'hui !', body: 'Une journée de plus pour devenir la meilleure version de toi !' },
  { title: '⚡ Ta progression t\'attend !', body: 'Ouvre Odyssée et avance vers tes objectifs !' },
  { title: '🌟 Chaque jour compte !', body: 'Les héros se forgent dans la régularité. À toi de jouer !' },
]

export async function planifierRappelQuotidien(heure = 9, minute = 0) {
  await Notifications.cancelScheduledNotificationAsync('rappel-quotidien').catch(() => {})

  const msg = RAPPELS_QUOTIDIENS[Math.floor(Math.random() * RAPPELS_QUOTIDIENS.length)]

  await Notifications.scheduleNotificationAsync({
    identifier: 'rappel-quotidien',
    content: {
      title: msg.title,
      body: msg.body,
      sound: 'notification.wav',
      data: { type: 'rappel' },
      ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: heure,
      minute: minute,
    },
  })
}

export async function planifierRappelDefi(defiId: number, defiNom: string, dansMinutes = 60) {
  await Notifications.scheduleNotificationAsync({
    identifier: `defi-${defiId}`,
    content: {
      title: '⏰ N\'oublie pas ton défi !',
      body: `"${defiNom}" t\'attend toujours. Un peu de courage !`,
      sound: 'notification.wav',
      data: { type: 'rappel_defi', defiId, defiNom },
      ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: dansMinutes * 60,
      repeats: false,
    },
  })
}

export async function planifierRappelsMission(missionId: number, missionNom: string, dateLimit: Date) {
  const maintenant = new Date()
  const msRestants = dateLimit.getTime() - maintenant.getTime()
  const joursRestants = Math.floor(msRestants / (1000 * 60 * 60 * 24))
  const heuresRestantes = Math.floor(msRestants / (1000 * 60 * 60))

  // J-3
  if (joursRestants > 3) {
    const dateJ3 = new Date(dateLimit)
    dateJ3.setDate(dateJ3.getDate() - 3)
    if (dateJ3 > maintenant) {
      await Notifications.scheduleNotificationAsync({
        identifier: `mission-j3-${missionId}`,
        content: {
          title: '📅 Mission : J-3 !',
          body: `"${missionNom}" se termine dans 3 jours. Ne laisse pas passer ta chance !`,
          sound: 'notification.wav',
          data: { type: 'mission_reminder', missionId, jours: 3 },
          ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dateJ3,
        },
      })
    }
  }

  // J-1
  if (joursRestants > 1) {
    const dateJ1 = new Date(dateLimit)
    dateJ1.setDate(dateJ1.getDate() - 1)
    if (dateJ1 > maintenant) {
      await Notifications.scheduleNotificationAsync({
        identifier: `mission-j1-${missionId}`,
        content: {
          title: '⚠️ Dernière chance ! J-1',
          body: `"${missionNom}" se termine demain ! Dépêche-toi !`,
          sound: 'notification.wav',
          data: { type: 'mission_reminder', missionId, jours: 1 },
          ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dateJ1,
        },
      })
    }
  }

  // H-6
  if (heuresRestantes <= 24 && heuresRestantes > 0) {
    const dateH6 = new Date(dateLimit.getTime() - 6 * 60 * 60 * 1000)
    if (dateH6 > maintenant) {
      await Notifications.scheduleNotificationAsync({
        identifier: `mission-h6-${missionId}`,
        content: {
          title: '🚨 Plus que 6 heures !',
          body: `"${missionNom}" expire dans 6h. C'est maintenant ou jamais !`,
          sound: 'notification.wav',
          data: { type: 'mission_reminder', missionId, heures: 6 },
          ...(Platform.OS === 'android' && { channelId: 'odyssee_v2' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dateH6,
        },
      })
    }
  }
}

export async function annulerRappelsMission(missionId: number) {
  await Notifications.cancelScheduledNotificationAsync(`mission-j3-${missionId}`).catch(() => {})
  await Notifications.cancelScheduledNotificationAsync(`mission-j1-${missionId}`).catch(() => {})
  await Notifications.cancelScheduledNotificationAsync(`mission-h6-${missionId}`).catch(() => {})
}

export async function annulerRappelDefi(defiId: number) {
  await Notifications.cancelScheduledNotificationAsync(`defi-${defiId}`).catch(() => {})
}
export async function envoyerNotifLevelUp(nouveauNiveau: number, goldGagne: number) {
  const channelId = await getChannelId()
  const sound = await getSound()

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 Niveau ${nouveauNiveau} atteint !`,
      body: `Félicitations ! Tu passes au niveau ${nouveauNiveau} et gagnes ${goldGagne} 🪙 gold !`,
      sound,
      data: { type: 'level_up', niveau: nouveauNiveau },
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null,
  })
}