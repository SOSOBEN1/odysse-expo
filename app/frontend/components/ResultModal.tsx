import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Image, Dimensions, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import BackButton from "./BackButton";
import CoinPrice from "./CoinPrice";

const owlSuccess = require("../assets/Hibou/success.png");
const owlFail = require("../assets/Hibou/confused.png");
const { width } = Dimensions.get("window");

interface ResultModalProps {
  visible: boolean;
  onClose: () => void;
  type: "success" | "error";
  avatarName?: string;
}

export default function ResultModal({ visible, onClose, type, avatarName }: ResultModalProps) {
  const isSuccess = type === "success";
  const [selectedTab, setSelectedTab] = useState<'view' | 'recharge'>('recharge');

  useEffect(() => {
    if (visible) { setSelectedTab('recharge'); }
  }, [visible, type]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        <LinearGradient colors={["#D4C5F2", "#C2B4DE", "#9075C4"]} style={styles.modalGradient}>
          <View style={styles.container}>
            <View style={styles.header}>
              <BackButton /> 
              <Text style={styles.headerTitle}>Ma boutique</Text>
              <CoinPrice price={isSuccess ? "1,250" : "20"} colors={["#5A4C91", "#5A4C91"]} iconSize={14} />
            </View>

            <View style={styles.statusFrame}>
              <Image source={isSuccess ? owlSuccess : owlFail} style={styles.owlImage} resizeMode="contain" />
              <View style={styles.statusBadge}>
                 <Ionicons name={isSuccess ? "checkmark-circle" : "close-circle"} size={35} color={isSuccess ? "#66BB6A" : "#EF5350"} />
              </View>
              <View style={styles.textContent}>
                <Text style={styles.mainTitle}>{isSuccess ? "Achat confirmé !" : "Pièces insuffisantes !"}</Text>
                <Text style={styles.subText}>
                  {isSuccess 
                    ? `Tu as bien acheté l’avatar "${avatarName}".\nTu peux le retrouver dans “Mes avatars”`
                    : `Il te manque 30 pieces pour acheter cet avatar !`}
                </Text>
              </View>
            </View>

            <View style={styles.infoOutsideArea}>
              {isSuccess ? (
                <View style={styles.successInfoBox}>
                  <CoinPrice price="50" isMinus colors={["#7A5CC0", "#7A5CC0"]} containerStyle={{height: '100%', borderRadius: 25}} />
                  <Text style={styles.newBalanceText}> Nouveau solde : 1,200</Text>
                </View>
              ) : (
                <View style={styles.errorInfoBox}>
                  <View style={styles.errorRow}>
                    <CoinPrice price="" colors={["#FFD700", "#FFD700"]} containerStyle={{width: 40, height: 40, borderRadius: 20}} iconSize={20} />
                    <View>
                      <Text style={styles.errorLabel}>Ton solde : <Text style={styles.errorValue}>20</Text></Text>
                      <Text style={styles.errorLabel}>Prix avatar : <Text style={styles.errorValue}>50</Text></Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footerButtonsOutside}>
              <View style={styles.actionPill}>
                {isSuccess ? (
                  <TouchableOpacity style={styles.fullWidth} onPress={onClose}>
                    <LinearGradient colors={["#BAAAE7", "#6949A8"]} style={styles.activeTabBtnGradient}>
                      <Text style={styles.activeTabText}>Voir mes avatars</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={styles.tabFlex} onPress={() => setSelectedTab('view')}>
                      {selectedTab === 'view' ? (
                        <LinearGradient colors={["#BAAAE7", "#6949A8"]} style={styles.activeTabBtnGradient}><Text style={styles.activeTabText}>Voir mes avatars</Text></LinearGradient>
                      ) : ( <Text style={styles.inactiveTabText}>Voir mes avatars</Text> )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabFlex} onPress={() => setSelectedTab('recharge')}>
                      {selectedTab === 'recharge' ? (
                        <View style={styles.whiteStrokeWrapper}><LinearGradient colors={["#765EFF", "#D4BAF9"]} style={styles.activeTabBtnGradient}><Text style={styles.activeTabText}>Recharger mes pieces</Text></LinearGradient></View>
                      ) : ( <Text style={styles.inactiveTabText}>Recharger mes pieces</Text> )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalGradient: { width: width * 0.92, borderRadius: 35, borderWidth: 2, borderColor: "#644979", padding: 2 },
  container: { padding: 20, alignItems: 'center' },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: '100%', marginBottom: 30 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#5A4C91" },
  statusFrame: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 30, borderWidth: 2, borderColor: "white", paddingTop: 40, paddingBottom: 20, paddingHorizontal: 15, position: 'relative', marginBottom: 20, width: '100%' },
  owlImage: { position: 'absolute', top: -35, left: 15, width: 65, height: 65, zIndex: 10 },
  statusBadge: { position: 'absolute', top: -18, alignSelf: 'center', backgroundColor: 'white', borderRadius: 20 },
  textContent: { alignItems: "center" },
  mainTitle: { fontSize: 22, fontWeight: "900", color: "#5A4C91", marginBottom: 5 },
  subText: { textAlign: "center", color: "#333", fontSize: 13, fontWeight: "bold", lineHeight: 18 },
  infoOutsideArea: { alignItems: 'center', marginBottom: 20, width: '100%' },
  successInfoBox: { flexDirection: 'row', backgroundColor: '#B5A5FF', borderRadius: 25, height: 45, alignItems: 'center', width: '100%' },
  newBalanceText: { color: '#5A4C91', fontWeight: 'bold', fontSize: 14 },
  errorInfoBox: { backgroundColor: '#FFF9F9', borderRadius: 20, padding: 15, width: '90%', elevation: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  errorLabel: { color: '#444', fontSize: 14, fontWeight: 'bold' },
  errorValue: { fontWeight: '900', fontSize: 16, color: '#000' },
  footerButtonsOutside: { alignItems: 'center', width: '100%' },
  actionPill: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 30, padding: 5, width: '100%', alignItems: 'center' },
  tabFlex: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  activeTabBtnGradient: { width: '100%', paddingVertical: 10, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  activeTabText: { color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center' },
  inactiveTabText: { color: '#5A4C91', fontWeight: 'bold', fontSize: 11, textAlign: 'center' },
  whiteStrokeWrapper: { width: '100%', borderRadius: 25, borderWidth: 1.5, borderColor: 'white' }
});