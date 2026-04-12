import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (event: any) => void;
  initialData?: any; // Ajout pour la modification
};

const EVENT_TYPES = [
  { id: "examen", label: "Examen", icon: "🎓", image: require("../assets/images/examen.png") },
  { id: "soutenance", label: "Soutenance", icon: "🎓", image: require("../assets/images/soutenance.png") },
  { id: "projet", label: "Projet", icon: "⚙️", image: require("../assets/images/projet.png") },
];

export default function CreateEventModal({ visible, onClose, onCreate, initialData }: Props) {
  const [selectedType, setSelectedType] = useState("soutenance");
  const [eventName, setEventName] = useState("");
  const [deadline, setDeadline] = useState("");

  // Remplir les champs si on modifie
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setSelectedType(initialData.type || "soutenance");
        setEventName(initialData.name || "");
        setDeadline(initialData.deadline || "");
      } else {
        // Reset si c'veut créer un nouveau
        setSelectedType("soutenance");
        setEventName("");
        setDeadline("");
      }
    }
  }, [visible, initialData]);

  const handleCreate = () => {
    onCreate({ 
      ...initialData, // Garde l'ID si on modifie
      type: selectedType, 
      name: eventName, 
      deadline 
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Type:</Text>
          <View style={styles.typeRow}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeCard, selectedType === t.id && styles.typeCardActive]}
                onPress={() => setSelectedType(t.id)}
                activeOpacity={0.85}
              >
                <Image source={t.image} style={styles.typeImage} resizeMode="cover" />
                {selectedType === t.id && (
                  <View style={styles.typeCheck}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
                <View style={styles.typeLabelRow}>
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, selectedType === t.id && styles.typeLabelActive]}>
                    {t.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Nom de l'événement:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingénieur IA - Présentation"
            placeholderTextColor="#c4b5fd"
            value={eventName}
            onChangeText={setEventName}
          />

          <Text style={styles.sectionLabel}>Date limite:</Text>
          <View style={styles.dateWrapper}>
            <TextInput
              style={styles.dateInput}
              placeholder="01/12/2026"
              placeholderTextColor="#c4b5fd"
              value={deadline}
              onChangeText={setDeadline}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.calendarBtn}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
            <Text style={styles.createBtnText}>
              {initialData ? "✨ Modifier l'événement" : "✨ Créer l'événement"}
            </Text>
          </TouchableOpacity>

          <View style={styles.starsRow}>
            {["✦", "✧", "✦", "✧", "✦"].map((s, i) => (
              <Text key={i} style={styles.star}>{s}</Text>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#f5f3ff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4c1d95",
    marginBottom: 10,
    marginTop: 4,
  },

  // Type cards
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOWS.light,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
  },
  typeImage: {
    width: "100%",
    height: 90,
  },
  typeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingVertical: 6,
  },
  typeIcon: { fontSize: 12 },
  typeLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  typeLabelActive: { color: COLORS.primary },

  // Inputs
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e1b4b",
    marginBottom: 16,
  },
  dateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: "#1e1b4b",
  },
  calendarBtn: {
    padding: 6,
  },

  // Create button
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  star: { color: "#c4b5fd", fontSize: 14 },
});