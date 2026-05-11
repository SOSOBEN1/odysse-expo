import { useCallback, useEffect, useState } from 'react'
import { getNotifications } from '../../../backend/InvitationService'
import { useUser } from './UserContext'

export function useNotifCount() {
  const { userId } = useUser()
  const [count, setCount] = useState(0)

  const charger = useCallback(async () => {
    if (!userId) return
    const { data } = await getNotifications(userId)
    const nonLues = (data ?? []).filter((n: any) => !n.lu)
    setCount(nonLues.length)
  }, [userId])

  useEffect(() => {
    charger()
  }, [userId])

  return { count, refresh: charger }
}