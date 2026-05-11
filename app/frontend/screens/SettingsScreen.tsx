import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import {
  demanderPermission
} from "../../../backend/models/NotificationService";
import ChangePasswordModal from "../components/ChangePasswordModal";
import WaveBackground from "../components/waveBackground";
import styles from "../styles/LoginStyle";

const { width } = Dimensions.get("window");

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(false);
  const [sound, setSound] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [music, setMusic] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Charger les préférences sauvegardées ──
  useEffect(() => {
    const charger = async () => {
      const n = await AsyncStorage.getItem('pref_notifications')
      const s = await AsyncStorage.getItem('pref_sound')
      const r = await AsyncStorage.getItem('pref_reminders')
      if (n !== null) setNotifications(n === 'true')
      if (s !== null) setSound(s === 'true')
      if (r !== null) setReminders(r === 'true')
    }
    charger()
  }, [])

  // ── Activer/désactiver les notifications ──
  const handleNotifications = async (value: boolean) => {
    setNotifications(value)
    await AsyncStorage.setItem('pref_notifications', String(value))

    if (value) {
      const ok = await demanderPermission()
      if (!ok) {
        setNotifications(false)
        await AsyncStorage.setItem('pref_notifications', 'false')
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync()
    }
  }

  // ── Activer/désactiver le son ──
  const handleSound = async (value: boolean) => {
    setSound(value)
    await AsyncStorage.setItem('pref_sound', String(value))
    // Le son est géré via le canal — rebuild nécessaire pour changer
    // On sauvegarde juste la préférence ici
  }

  // ── Activer/désactiver les rappels ──
  const handleReminders = async (value: boolean) => {
  setReminders(value)
  await AsyncStorage.setItem('pref_reminders', String(value))
  // juste sauvegarder la préférence son — pas d'annulation
}

  const stars = [
    { top: 50, left: 30, size: 20, opacity: 0.6 },
    { top: 150, right: 40, size: 22, opacity: 0.7 },
    { bottom: 100, left: 20, size: 18, opacity: 0.5 },
  ];

  const SettingItem = ({ icon, label, sublabel, value, onValueChange, isSwitch = true, onPress = null }: any) => (
    <View style={localStyles.settingRow}>
      <View style={localStyles.iconContainer}>
        <Ionicons name={icon} size={22} color="#6949a8" />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={localStyles.settingLabel}>{label}</Text>
        {sublabel && <Text style={localStyles.settingSublabel}>{sublabel}</Text>}
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#D1D1D1", true: "#6949a8" }}
          thumbColor={"#fff"}
        />
      ) : (
        <TouchableOpacity onPress={onPress}>
          <Ionicons name="chevron-forward" size={20} color="#6949a8" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      <View style={localStyles.headerWrapper}>
        <View style={localStyles.titleAbsoluteContainer}>
          <Text style={localStyles.mainTitleCentered}>Paramètres</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#6949a8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>

        <Text style={localStyles.sectionTitle}>Notifications :</Text>
        <SettingItem
          icon="notifications-outline"
          label="Activer les notifications"
          value={notifications}
          onValueChange={handleNotifications}
        />

        <Text style={localStyles.sectionTitle}>Notifications sonores :</Text>
        <View style={localStyles.cardSettings}>
          <SettingItem
            icon="volume-high-outline"
            label="Activer le son et vibrations"
            sublabel="Effets sonores généraux"
            value={sound}
            onValueChange={handleSound}
          />
          <SettingItem
            icon="musical-notes-outline"
            label="Musique de fond"
            sublabel="Ambiances pendant les missions"
            value={music}
            onValueChange={setMusic}
          />
          <SettingItem
            icon="alarm-outline"
            label="Alertes de rappel"
            sublabel="Sons lors des notifications"
            value={reminders}
            onValueChange={handleReminders}
          />
        </View>

        <Text style={localStyles.sectionTitle}>
          <Ionicons name="shield-checkmark-outline" size={18} /> Confidentialité :
        </Text>
        <TouchableOpacity
          style={localStyles.privacyBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#6949a8" />
          <Text style={localStyles.privacyBtnText}>Changer le mot de passe</Text>
          <Ionicons name="chevron-forward" size={20} color="#6949a8" />
        </TouchableOpacity>


// Bouton test
<TouchableOpacity onPress={async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 Une nouvelle journée, une nouvelle victoire !',
      body: 'Approche-toi de ton objectif, chaque effort compte !',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  })
}}>
  <Text>Test notif 10s</Text>
</TouchableOpacity>
        <TouchableOpacity
          style={localStyles.logoutBtn}
          onPress={() => router.replace('/frontend/screens/Login')}
        >
          <LinearGradient
            colors={["#FF9AA2", "#FF6B6B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={localStyles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={localStyles.logoutText}>Se Déconnecter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {stars.map((star, i) => (
        <MaterialIcons
          key={i}
          name="auto-awesome"
          size={star.size}
          color="#fff"
          style={{ position: "absolute", top: star.top, left: star.left, right: (star as any).right, bottom: (star as any).bottom, opacity: star.opacity }}
        />
      ))}

      <ChangePasswordModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  headerWrapper: { width: '100%', height: 60, marginTop: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
  titleAbsoluteContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: -1 },
  mainTitleCentered: { fontSize: 24, fontWeight: "bold", color: "#5A4C91" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#5A4C91", marginTop: 20, marginBottom: 10 },
  cardSettings: { backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 20, padding: 10 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  iconContainer: { width: 40, height: 40, backgroundColor: "#F0E6FF", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#5A4C91" },
  settingSublabel: { fontSize: 11, color: "#9E9E9E" },
  privacyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.7)", padding: 15, borderRadius: 20, marginTop: 5 },
  privacyBtnText: { flex: 1, marginLeft: 10, fontWeight: "bold", color: "#5A4C91" },
  logoutBtn: { marginTop: 40, alignSelf: "center", width: "60%" },
  logoutGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 12, borderRadius: 15 },
  logoutText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
});