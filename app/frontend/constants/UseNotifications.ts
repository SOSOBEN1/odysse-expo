import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import {
  demanderPermission,
  planifierRappelInactivite,
  planifierRappelQuotidien,
} from '../../../backend/models/NotificationService'

export function useNotifications() {
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Vérifier les préférences
      const notifs = await AsyncStorage.getItem('pref_notifications')
      const reminders = await AsyncStorage.getItem('pref_reminders')

      // Demander permission seulement si activé (ou première fois)
      if (notifs !== 'false') {
        await demanderPermission()
      }

      // Planifier inactivité seulement si rappels activés
      if (notifs !== 'false') {
        await planifierRappelInactivite(3)
        await planifierRappelQuotidien(9, 0)
      }
    }

    init()

    // Navigation quand l'user tape sur une notif
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any

      switch (data?.type) {
        case 'rappel_defi':
          router.push({
            pathname: '/frontend/screens/ProgressionDefis',
            params: { defiId: data.defiId, defiNom: data.defiNom },
          })
          break
        case 'mission_reminder':
          router.push({ pathname: '/frontend/screens/Missions' })
          break
        case 'inactivite':
        case 'motivation':
        case 'rappel':
          router.push({ pathname: '/frontend/screens/Dashbord' })
          break
        case 'level_up':
  router.push({ pathname: '/frontend/screens/Dashbord' })
  break
        default:
          break
      }
    })

    return () => sub.remove()
  }, [])
}