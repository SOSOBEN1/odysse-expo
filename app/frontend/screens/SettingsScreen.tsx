import React, { useState } from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import WaveBackground from "../components/waveBackground";
import ChangePasswordModal from "../components/ChangePasswordModal";
import styles from "../styles/LoginStyle"; 
import BackButton from "../components/BackButton";

import { COLORS } from "../constants/theme";

const { width } = Dimensions.get("window");

export default function SettingsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState(false);
    const [sound, setSound] = useState(true);
    const [music, setMusic] = useState(false);
    const [reminders, setReminders] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

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

            {/* HEADER : Titre centré et coloré comme les autres */}
         {/* HEADER */}
<View style={localStyles.headerWrapper}>
    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
    </TouchableOpacity>
    <Text style={localStyles.mainTitleCentered}>Paramètres</Text>
</View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                <Text style={localStyles.sectionTitle}>Notifications :</Text>
                <SettingItem 
                    icon="notifications-outline" 
                    label="Activer les notifications" 
                    value={notifications} 
                    onValueChange={setNotifications} 
                />

                <Text style={localStyles.sectionTitle}>Notifications sonores :</Text>
                <View style={localStyles.cardSettings}>
                    <SettingItem 
                        icon="volume-high-outline" 
                        label="Activer le son et vibrations" 
                        sublabel="Effets sonores généraux"
                        value={sound} 
                        onValueChange={setSound} 
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
                        onValueChange={setReminders} 
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

                <TouchableOpacity style={localStyles.logoutBtn}>
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
                    style={{ position: "absolute", top: star.top, left: star.left, right: star.right, bottom: star.bottom, opacity: star.opacity }}
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
  headerWrapper: {
    width: '100%',
    height: 60,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    gap: 10,
    zIndex: 10,
  },
  mainTitleCentered: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.subtitle,           // ✅ existe déjà (#6949a8)
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.subtitle,           // ✅
    marginTop: 20,
    marginBottom: 10
  },
  cardSettings: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 20,
    padding: 10
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryPale, // ✅ existe déjà
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.subtitle,            // ✅
  },
  settingSublabel: {
    fontSize: 11,
    color: "#9E9E9E",                  // valeur directe
  },
  privacyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 15,
    borderRadius: 20,
    marginTop: 5
  },
  privacyBtnText: {
    flex: 1,
    marginLeft: 10,
    fontWeight: "bold",
    color: COLORS.subtitle,            // ✅
  },
  logoutBtn: { marginTop: 40, alignSelf: "center", width: "60%" },
  logoutGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 15
  },
  logoutText: { color: COLORS.white, fontWeight: "bold", marginLeft: 8 }
});