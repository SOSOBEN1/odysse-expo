import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (mission: any) => void;
};

const TYPES = ["Examen", "Projet", "Soutenance", "Devoir", "Révision"];
const DIFFICULTIES = ["Facile", "Moyen", "Difficile"];
const PRIORITIES = ["Basse", "Normale", "Haute", "Urgente"];
const CATEGORIES = ["Études", "Bien-être", "Sport", "Personnel"];

function Dropdown({ label, value, options, onSelect }: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={dd.trigger} onPress={() => setOpen(!open)}>
        <Text style={[dd.value, !value && dd.placeholder]}>{value || `Sélectionner`}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={COLORS.primary} />
      </TouchableOpacity>
      {open && (
        <View style={dd.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[dd.option, value === opt && dd.optionActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[dd.optionText, value === opt && dd.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const dd = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 10 },
  trigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: { fontSize: 14, color: "#1e1b4b", fontWeight: "500" },
  placeholder: { color: "#c4b5fd" },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    marginTop: 4,
    zIndex: 100,
    ...SHADOWS.medium,
  },
  option: { paddingHorizontal: 14, paddingVertical: 10 },
  optionActive: { backgroundColor: "#f5f3ff" },
  optionText: { fontSize: 14, color: "#4b5563" },
  optionTextActive: { color: COLORS.primary, fontWeight: "700" },
});

export default function CreateMissionModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  const handleSave = () => {
    onSave({ title, type, description, duration, difficulty, priority, category });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Header hibou */}
          <View style={styles.header}>
            <Image source={require("../assets/Hibou/happy.png")} style={styles.hibou} resizeMode="contain" />
            <View style={styles.headerBubble}>
              <Text style={styles.headerText}>Créons notre{"\n"}mission...</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
            {/* Titre */}
            <Text style={styles.label}>Titre</Text>
            <TextInput
              style={styles.input}
              placeholder="Saisir le titre de la mission"
              placeholderTextColor="#c4b5fd"
              value={title}
              onChangeText={setTitle}
            />

            {/* Type */}
            <Text style={styles.label}>Type:</Text>
            <Dropdown label="Type" value={type} options={TYPES} onSelect={setType} />

            {/* Description */}
            <Text style={[styles.label, { marginTop: 14 }]}>Description:</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Décrivez la mission à accomplir ici ..."
              placeholderTextColor="#c4b5fd"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* Durée + Difficulté */}
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Durée:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1h:30min:20s"
                  placeholderTextColor="#c4b5fd"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Difficulté:</Text>
                <Dropdown label="Difficulté" value={difficulty} options={DIFFICULTIES} onSelect={setDifficulty} />
              </View>
            </View>

            {/* Priorité + Catégorie */}
            <View style={[styles.row, { marginTop: 14 }]}>
              <View style={styles.half}>
                <Text style={styles.label}>Priorité:</Text>
                <Dropdown label="Priorité" value={priority} options={PRIORITIES} onSelect={setPriority} />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Catégorie:</Text>
                <Dropdown label="Catégorie" value={category} options={CATEGORIES} onSelect={setCategory} />
              </View>
            </View>

            {/* Bouton */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>

            {/* Stars déco */}
            <View style={styles.starsRow}>
              {["✦", "✧", "✦", "✧", "✦"].map((s, i) => (
                <Text key={i} style={styles.star}>{s}</Text>
              ))}
            </View>
          </ScrollView>
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
    maxHeight: "90%",
    paddingTop: 16,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  hibou: { width: 70, height: 70 },
  headerBubble: {
    backgroundColor: "#e9d5ff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  headerText: { fontSize: 16, fontWeight: "800", color: "#4c1d95", lineHeight: 22 },
  form: { paddingHorizontal: 20, paddingBottom: 30 },
  label: { fontSize: 13, fontWeight: "700", color: "#4c1d95", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1e1b4b",
  },
  textarea: { height: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12 },
  star: { color: "#c4b5fd", fontSize: 14 },
});