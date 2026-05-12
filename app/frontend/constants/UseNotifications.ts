import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
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
      const notifs = await AsyncStorage.getItem('pref_notifications')

      if (notifs !== 'false') {
        await demanderPermission()
        await planifierRappelInactivite(3)
        await planifierRappelQuotidien(9, 20)
      }
    }

    init()

    // ── Son quand notif arrive (app ouverte) ──
    const subReceived = Notifications.addNotificationReceivedListener(async () => {
      const reminders = await AsyncStorage.getItem('pref_reminders')
      if (reminders === 'false') return

      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/notification.wav')
        )
        await sound.playAsync()
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync()
          }
        })
      } catch (e) {
        console.log('Son notif:', e)
      }
    })

    // ── Navigation quand tap sur notif ──
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

    return () => {
      sub.remove()
      subReceived.remove()
    }
  }, [])
}