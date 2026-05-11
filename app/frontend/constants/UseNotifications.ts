import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import {
  demanderPermission,
  planifierRappelInactivite,
} from '../../../backend/models/NotificationService'

export function useNotifications() {
  const router = useRouter()

  useEffect(() => {
    demanderPermission()
    planifierRappelInactivite(3)

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
          router.push({
            pathname: '/frontend/screens/Missions',
          })
          break

        case 'inactivite':
        case 'motivation':
        case 'rappel':
          router.push({
            pathname: '/frontend/screens/Dashbord',
          })
          break

        default:
          break
      }
    })

    return () => sub.remove()
  }, [])
}