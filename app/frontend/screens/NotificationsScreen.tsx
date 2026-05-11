import { Audio } from 'expo-av'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native'
import {
  accepterInvitation,
  getNotifications,
  refuserInvitation
} from '../../../backend/InvitationService'
import {
  envoyerMotivation,
  planifierRappelDefi
} from '../../../backend/models/NotificationService'
import { useUser } from '../constants/UserContext'
import { COLORS, SHADOWS, SIZES } from '../constants/theme'

export default function NotificationsScreen() {
  const { userId } = useUser()
  const router = useRouter()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => {
    if (userId) charger()
  }, [userId])

  // ── Son quand une notif arrive pendant que l'écran est ouvert ──
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(async () => {
      charger()
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

    return () => sub.remove()
  }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await getNotifications(userId ?? 0)
    setNotifs(data ?? [])
    setLoading(false)
  }

  const handleAccepter = async (notif: any) => {
    setActionId(notif.id_notification)
    await accepterInvitation(notif.id_notification, notif.id_defi, userId ?? 0)
    await planifierRappelDefi(notif.id_defi, notif.titre, 60)
    await envoyerMotivation()
    await charger()
    setActionId(null)
    router.push({
      pathname: '/frontend/screens/ProgressionDefis',
      params: { defiId: notif.id_defi, defiNom: notif.titre },
    })
  }

  const handleRefuser = async (notif: any) => {
    setActionId(notif.id_notification)
    await refuserInvitation(notif.id_notification)
    await charger()
    setActionId(null)
  }

  const renderNotif = ({ item }: { item: any }) => {
    const isInvitation = item.type === 'invitation_defi'
    const isLoading = actionId === item.id_notification

    // Icône selon le type de notif
    const getIcon = () => {
      if (item.type === 'invitation_defi') return '⚔️'
      if (item.type === 'mission_reminder') return '📅'
      if (item.type === 'motivation') return '🔥'
      if (item.type === 'inactivite') return '👋'
      return '🔔'
    }

    return (
      <View style={[styles.card, item.lu && styles.cardLue]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>{getIcon()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titre}>{item.titre}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </View>
          {!item.lu && <View style={styles.dot} />}
        </View>

        {isInvitation && !item.lu && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btnAccepter, isLoading && { opacity: 0.5 }]}
              onPress={() => handleAccepter(item)}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnTexte}>✅ Accepter</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnRefuser, isLoading && { opacity: 0.5 }]}
              onPress={() => handleRefuser(item)}
              disabled={isLoading}
            >
              <Text style={styles.btnRefuseTexte}>❌ Refuser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  )

  return (
    <FlatList
      data={notifs}
      keyExtractor={item => String(item.id_notification)}
      renderItem={renderNotif}
      contentContainerStyle={{ padding: SIZES.padding, gap: 12, paddingTop: 60 }}
      ListHeaderComponent={
        <Text style={styles.header}>🔔 Notifications</Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔕</Text>
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:            { fontSize: 22, fontWeight: '800', color: '#17063B', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: `${COLORS.primary}20`, ...SHADOWS.light,
  },
  cardLue:       { opacity: 0.55 },
  cardHeader:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox:       { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0ecff', justifyContent: 'center', alignItems: 'center' },
  iconText:      { fontSize: 20 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
  titre:         { fontSize: 15, fontWeight: '800', color: '#17063B', marginBottom: 4 },
  message:       { fontSize: 13, color: 'rgba(100,70,160,0.7)', lineHeight: 19, marginBottom: 12 },
  actions:       { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnAccepter:   { flex: 1, backgroundColor: COLORS.primary, borderRadius: 24, paddingVertical: 10, alignItems: 'center' },
  btnRefuser:    { flex: 1, borderWidth: 1.5, borderColor: 'rgba(180,160,220,0.4)', borderRadius: 24, paddingVertical: 10, alignItems: 'center' },
  btnTexte:      { color: '#fff', fontWeight: '800', fontSize: 13 },
  btnRefuseTexte:{ color: 'rgba(100,70,160,0.6)', fontWeight: '700', fontSize: 13 },
  emptyContainer:{ alignItems: 'center', marginTop: 80 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { color: COLORS.textLight, fontSize: 16, fontWeight: '600' },
})