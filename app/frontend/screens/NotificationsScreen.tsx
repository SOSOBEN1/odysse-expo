import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
    accepterInvitation,
    getNotifications,
    refuserInvitation
} from '../../../backend/InvitationService'
import { useUser } from '../constants/UserContext'
import { COLORS, SHADOWS, SIZES } from '../constants/theme'

export default function NotificationsScreen() {
  const { userId } = useUser()
  const router = useRouter()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)

  useEffect(() => { charger() }, [])

  const charger = async () => {
    setLoading(true)
    const { data } = await getNotifications(userId ?? 0)
    setNotifs(data ?? [])
    setLoading(false)
  }

  const handleAccepter = async (notif: any) => {
    setActionId(notif.id)
    await accepterInvitation(notif.id, notif.id_defi, userId ?? 0)
    await charger()
    setActionId(null)
    // Naviguer vers la page de progression du défi
    router.push({
      pathname: '/frontend/screens/ProgressionDefis',
      params: { defiId: notif.id_defi, defiNom: notif.defi_nom }
    })
  }

  const handleRefuser = async (notif: any) => {
    setActionId(notif.id)
    await refuserInvitation(notif.id)
    await charger()
    setActionId(null)
  }

  const renderNotif = ({ item }: { item: any }) => {
    const isInvitation = item.type === 'invitation_defi'
    const isLoading    = actionId === item.id

    return (
      <View style={[styles.card, item.lu && styles.cardLue]}>
        <Text style={styles.titre}>{item.titre}</Text>
        <Text style={styles.message}>{item.message}</Text>

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

  if (loading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />

  return (
    <FlatList
      data={notifs}
      keyExtractor={item => String(item.id)}
      renderItem={renderNotif}
      contentContainerStyle={{ padding: SIZES.padding, gap: 12 }}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', color: COLORS.textLight, marginTop: 40 }}>
          Aucune notification
        </Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: `${COLORS.primary}20`, ...SHADOWS.light,
  },
  cardLue:       { opacity: 0.55 },
  titre:         { fontSize: 15, fontWeight: '800', color: '#17063B', marginBottom: 4 },
  message:       { fontSize: 13, color: 'rgba(100,70,160,0.7)', lineHeight: 19, marginBottom: 12 },
  actions:       { flexDirection: 'row', gap: 10 },
  btnAccepter:   {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 24,
    paddingVertical: 10, alignItems: 'center',
  },
  btnRefuser:    {
    flex: 1, borderWidth: 1.5, borderColor: 'rgba(180,160,220,0.4)',
    borderRadius: 24, paddingVertical: 10, alignItems: 'center',
  },
  btnTexte:      { color: '#fff', fontWeight: '800', fontSize: 13 },
  btnRefuseTexte:{ color: 'rgba(100,70,160,0.6)', fontWeight: '700', fontSize: 13 },
})