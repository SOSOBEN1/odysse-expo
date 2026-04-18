import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AvatarCrd from "./AvatarCrd";
import BackButton from "./BackButton";

interface ChangeAvatarModalProps {
  visible: boolean;
  onClose: () => void;
  avatar: any;
  onConfirm: () => void;
}

const { width } = Dimensions.get("window");

export default function ChangeAvatarModal({ visible, onClose, avatar, onConfirm }: ChangeAvatarModalProps) {
  if (!avatar) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} tint="dark" />
        
        <LinearGradient
          colors={["#D4C5F2", "#C2B4DE", "#9075C4"]}
          locations={[0.53, 0.73, 1]}
          style={styles.modalGradient}
        >
          <View style={styles.container}>
            <View style={styles.backBtnWrapper}>
               <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#5A4C91" /></TouchableOpacity>
            </View>

            <Text style={styles.mainTitle}>Changer D’avatar</Text>

            <View style={styles.avatarCircle}>
              <AvatarCrd model={avatar.model} bgColor="#ffffff" />
            </View>

            <Text style={styles.avatarName}>{avatar.name}</Text>
            <Text style={styles.avatarDescription}>Voulez-vous utiliser ce nouveau look ?</Text>

            {/* BOUTON CONFIRMER */}
            <TouchableOpacity style={styles.fullWidth} onPress={onConfirm} activeOpacity={0.8}>
              <LinearGradient colors={["#BAAAE7", "#6949A8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmPill}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color="#6949A8" />
                </View>
                <Text style={styles.confirmText}>Utiliser cet avatar</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* BOUTON ANNULER */}
            <TouchableOpacity style={styles.fullWidth} onPress={onClose} activeOpacity={0.7}>
              <LinearGradient colors={["#765EFF", "#D4BAF9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cancelPillBorder}>
                <View style={styles.cancelPillInner}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalGradient: { width: width * 0.90, borderRadius: 35, borderWidth: 2, borderColor: "#644979", padding: 2, overflow: 'hidden' },
  container: { width: '100%', padding: 20, alignItems: "center", paddingTop: 45 },
  backBtnWrapper: { position: 'absolute', top: 20, right: 20 },
  mainTitle: { fontSize: 24, fontWeight: "bold", color: "#5A4C91", marginBottom: 20 },
  avatarCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "white", overflow: "hidden", borderWidth: 4, borderColor: "rgba(255,255,255,0.4)", marginBottom: 15 },
  avatarName: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 4 },
  avatarDescription: { fontSize: 14, color: "#444", marginBottom: 30, textAlign: 'center' },
  fullWidth: { width: "100%", marginBottom: 15 },
  confirmPill: { flexDirection: "row", height: 55, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  checkCircle: { width: 24, height: 24, backgroundColor: "white", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  confirmText: { color: "white", fontWeight: "bold", fontSize: 18 },
  cancelPillBorder: { height: 55, borderRadius: 28, padding: 2 },
  cancelPillInner: { flex: 1, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: "white", fontWeight: "bold", fontSize: 18 }
});