import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, Image, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import BackButton from "./BackButton";
import CoinPrice from "./CoinPrice";

const { width } = Dimensions.get("window");

const owlHappy = require("../assets/Hibou/success.png");
const owlSad   = require("../assets/Hibou/confused.png");

interface MissionProps {
  visible:       boolean;
  onClose:       () => void;
  type:          "success" | "fail";
  missionTitle?: string;
  dateLimit?:    string;
  xp?:           number;    // ✅ XP réel gagné
  coins?:        number;    // ✅ Coins réels gagnés
}

export default function MissionStatusModal({
  visible, onClose, type, missionTitle, dateLimit, xp, coins,
}: MissionProps) {
  const isSuccess = type === "success";
  const [activeBtn, setActiveBtn] = useState<"secondary" | "primary">("primary");

  const theme = {
    bg:          (isSuccess ? ["#f0fff4", "#dcfce7", "#bbf7d0"] : ["#fff5f5", "#fee2e2", "#fecaca"]) as [string, string, string],
    border:      isSuccess ? "#4A7C59" : "#E53E3E",
    title:       isSuccess ? "#2E7D32" : "#C62828",
    btnGradient: (isSuccess ? ["#4CAF50", "#2E7D32"] : ["#FF8A8A", "#E53E3E"]) as [string, string],
    pillBg:      "rgba(0,0,0,0.08)",
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />

        <View style={styles.modalWrapper}>
          <LinearGradient colors={theme.bg} style={[styles.modalGradient, { borderColor: theme.border }]}>
            <View style={styles.container}>

              {/* HEADER */}
              <View style={styles.header}>
                <BackButton onPress={onClose} />
                <Text style={[styles.headerTitle, { color: theme.title }]}>
                  {isSuccess ? "Mission accomplie !" : "Mission échouée"}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.contentArea}>

                {/* HIBOU */}
                <View style={styles.owlInsideContainer}>
                  <Image
                    source={isSuccess ? owlHappy : owlSad}
                    style={isSuccess ? styles.owlImageSuccess : styles.owlImageSad}
                    resizeMode="contain"
                  />
                </View>

                {/* TEXTE PRINCIPAL */}
                <View style={styles.statusInfoBox}>
                  <Text style={[styles.mainText, { color: theme.title }]}>
                    {isSuccess ? "Félicitations !" : "Dommage..."}
                  </Text>
                  <Text style={styles.subText}>
                    {isSuccess
                      ? "Tu as réussi à accomplir ta mission avec succès. Continue comme ça !"
                      : "Tu n'as pas réussi à accomplir ta mission.\nNe t'inquiète pas, réessaie et continue de progresser !"}
                  </Text>
                </View>

                {isSuccess ? (
                  <View style={styles.dataContainer}>
                    <Text style={[styles.sectionLabel, { color: theme.title }]}>Récompenses obtenues</Text>
                    <View style={styles.rewardRow}>

                      {/* ✅ Coins réels */}
                      <View style={styles.rewardCard}>
                        <CoinPrice price={`+${coins ?? 0}`} colors={["#FFD700", "#FFA500"]} iconSize={22} />
                        <Text style={styles.rewardLabel}>Coins</Text>
                      </View>

                      {/* ✅ XP réel */}
                      <RewardItem icon="flash" val={`+${xp ?? 0}`} label="XP" color="#4A90E2" />

                      <RewardItem icon="trophy" val="+1" label="Badge" color="#9B51E0" />
                    </View>
                  </View>
                ) : (
                  <View style={styles.dataContainer}>
                    <Text style={[styles.sectionLabel, { color: theme.title }]}>Récapitulatif</Text>
                    <View style={styles.recapInner}>
                      <RecapRow label="Mission :"    value={missionTitle || "—"} />
                      <RecapRow label="Date limite :" value={dateLimit    || "—"} />
                      <View style={styles.recapRowStyle}>
                        <Text style={styles.recapLabel}>Statut :</Text>
                        <View style={styles.statusBadge}>
                          <Ionicons name="close-circle" size={18} color="#E53E3E" />
                          <Text style={styles.statusTextRed}>Non terminée</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* BOUTONS PILLULE */}
              <View style={[styles.pillBar, { backgroundColor: theme.pillBg }]}>
                <TouchableOpacity style={styles.pillFlex} onPress={() => setActiveBtn("secondary")}>
                  {activeBtn === "secondary" ? (
                    <View style={styles.activeWrapper}>
                      <LinearGradient colors={theme.btnGradient} style={styles.pillGradient}>
                        <Text style={styles.activeText}>{isSuccess ? "Voir mes récompenses" : "Voir mes missions"}</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <Text style={[styles.inactiveText, { color: theme.title }]}>{isSuccess ? "Voir mes récompenses" : "Voir mes missions"}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.pillFlex} onPress={() => { setActiveBtn("primary"); onClose(); }}>
                  {activeBtn === "primary" ? (
                    <View style={styles.activeWrapper}>
                      <LinearGradient colors={theme.btnGradient} style={styles.pillGradient}>
                        <Text style={styles.activeText}>{isSuccess ? "Continuer" : "Réessayer"}</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <Text style={[styles.inactiveText, { color: theme.title }]}>{isSuccess ? "Continuer" : "Réessayer"}</Text>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const RewardItem = ({ icon, val, label, color }: any) => (
  <View style={styles.rewardCard}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={styles.rewardVal}>{val}</Text>
    <Text style={styles.rewardLabel}>{label}</Text>
  </View>
);

const RecapRow = ({ label, value }: any) => (
  <View style={styles.recapRowStyle}>
    <Text style={styles.recapLabel}>{label}</Text>
    <Text style={styles.recapValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay:            { flex: 1, justifyContent: "center", alignItems: "center" },
  modalWrapper:       { width: width * 0.94 },
  owlInsideContainer: { width: "100%", alignItems: "center", justifyContent: "center", height: 140, marginBottom: 10 },
  owlImageSuccess:    { width: 160, height: 160 },
  owlImageSad:        { width: 140, height: 140 },
  modalGradient:      { borderRadius: 35, borderWidth: 2, padding: 2 },
  container:          { padding: 15, alignItems: "center" },
  header:             { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 5 },
  headerTitle:        { fontSize: 22, fontWeight: "900" },
  contentArea:        { width: "100%", alignItems: "center" },
  statusInfoBox:      { width: "100%", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 25, padding: 15, alignItems: "center", marginBottom: 12 },
  mainText:           { fontSize: 20, fontWeight: "900" },
  subText:            { fontSize: 13, color: "#444", textAlign: "center", marginTop: 5, fontWeight: "600", lineHeight: 18 },
  dataContainer:      { width: "100%", backgroundColor: "rgba(255,255,255,0.4)", borderRadius: 25, padding: 15 },
  recapInner:         { backgroundColor: "#FFF", borderRadius: 15, padding: 15 },
  sectionLabel:       { textAlign: "center", fontWeight: "bold", marginBottom: 10, fontSize: 13, textTransform: "uppercase" },
  rewardRow:          { flexDirection: "row", justifyContent: "space-between" },
  rewardCard:         { backgroundColor: "#FFF", borderRadius: 15, padding: 10, width: "31%", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  rewardVal:          { fontWeight: "900", fontSize: 14, color: "#333", marginTop: 3 },
  rewardLabel:        { fontSize: 10, color: "#888", fontWeight: "bold" },
  recapRowStyle:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  recapLabel:         { fontSize: 13, color: "#666", fontWeight: "bold" },
  recapValue:         { fontSize: 13, fontWeight: "700", color: "#333" },
  statusBadge:        { flexDirection: "row", alignItems: "center" },
  statusTextRed:      { color: "#E53E3E", fontWeight: "800", marginLeft: 5, fontSize: 13 },
  pillBar:            { flexDirection: "row", width: "100%", height: 55, borderRadius: 30, marginTop: 20, padding: 4, alignItems: "center" },
  pillFlex:           { flex: 1, height: "100%", justifyContent: "center", alignItems: "center" },
  activeWrapper:      { width: "98%", height: "100%", borderRadius: 25, borderWidth: 1.5, borderColor: "#FFF", overflow: "hidden" },
  pillGradient:       { flex: 1, justifyContent: "center", alignItems: "center" },
  activeText:         { color: "#FFF", fontWeight: "bold", fontSize: 11, textAlign: "center" },
  inactiveText:       { fontWeight: "bold", fontSize: 11, textAlign: "center", opacity: 0.6 },
});
