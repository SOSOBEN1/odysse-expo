import React from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
} from "react-native";
import { BlurView } from "expo-blur";

interface Props {
  visible: boolean;
  onPauseAndLeave: () => void;
  onLeaveRunning: () => void;
  onCancel: () => void;
}

export default function ExitMissionModal({
  visible, onPauseAndLeave, onLeaveRunning, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
        <View style={styles.card}>
          <Text style={styles.icon}>⏱</Text>
          <Text style={styles.title}>Mission en cours</Text>
          <Text style={styles.subtitle}>
            Une mission est en cours. Que veux-tu faire ?
          </Text>

          <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={onPauseAndLeave}>
            <Text style={styles.btnText}>⏸  Mettre en pause et quitter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnOrange]} onPress={onLeaveRunning}>
            <Text style={styles.btnText}>▶  Laisser tourner et quitter</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancel}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: "center", alignItems: "center" },
  card:      {
    backgroundColor: "#fff", borderRadius: 24, padding: 28,
    width: "85%", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  icon:      { fontSize: 32, marginBottom: 12 },
  title:     { fontSize: 17, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  subtitle:  { fontSize: 13, color: "#666", textAlign: "center", marginBottom: 22, lineHeight: 18 },
  btn:       {
    width: "100%", paddingVertical: 14, borderRadius: 14,
    alignItems: "center", marginBottom: 10,
  },
  btnGreen:  { backgroundColor: "#4CAF50" },
  btnOrange: { backgroundColor: "#f0a500" },
  btnText:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancel:    { color: "#999", fontSize: 13, marginTop: 6 },
});