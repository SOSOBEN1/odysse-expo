import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (mission: any) => void;
  initialData?: any; // Pour la modification
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

export default function CreateMissionModal({ visible, onClose, onSave, initialData }: Props) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");

  // Synchroniser les champs avec initialData lors de l'ouverture
  useEffect(() => {
    if (visible) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setDuration(initialData?.duration || "");
      setDifficulty(initialData?.difficulty || "");
      setType(initialData?.event || ""); // Utilise 'event' comme type ici
      // ... ajouter les autres champs si nécessaire
    }
  }, [visible, initialData]);

  const handleSave = () => {
    onSave({
      ...initialData,
      title,
      description,
      duration,
      difficulty,
      event: type, 
      urgent: priority === "Urgente",
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          <View style={modalStyles.header}>
            <Image source={require("../assets/Hibou/happy.png")} style={modalStyles.hibou} resizeMode="contain" />
            <View style={modalStyles.headerBubble}>
              <Text style={modalStyles.headerText}>
                {initialData ? "Modifions notre\nmission..." : "Créons notre\nmission..."}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.form}>
            <Text style={modalStyles.label}>Titre</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Saisir le titre"
              placeholderTextColor="#c4b5fd"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={modalStyles.label}>Type:</Text>
            <Dropdown label="Type" value={type} options={TYPES} onSelect={setType} />

            <Text style={[modalStyles.label, { marginTop: 14 }]}>Description:</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              placeholder="Décrivez la mission..."
              placeholderTextColor="#c4b5fd"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <View style={modalStyles.row}>
              <View style={modalStyles.half}>
                <Text style={modalStyles.label}>Durée:</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="1h30"
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
              <View style={modalStyles.half}>
                <Text style={modalStyles.label}>Difficulté:</Text>
                <Dropdown label="Difficulté" value={difficulty} options={DIFFICULTIES} onSelect={setDifficulty} />
              </View>
            </View>

            <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
              <Text style={modalStyles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Styles du Modal (styles renommés pour éviter les conflits)
const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container: { backgroundColor: "#f5f3ff", borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: "90%", paddingTop: 16 },
  closeBtn: { position: "absolute", top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.light },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  hibou: { width: 70, height: 70 },
  headerBubble: { backgroundColor: "#e9d5ff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, flex: 1 },
  headerText: { fontSize: 16, fontWeight: "800", color: "#4c1d95", lineHeight: 22 },
  form: { paddingHorizontal: 20, paddingBottom: 30 },
  label: { fontSize: 13, fontWeight: "700", color: "#4c1d95", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1e1b4b" },
  textarea: { height: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12, marginTop: 14 },
  half: { flex: 1 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 24, ...SHADOWS.medium },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

const dd = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 10 },
  trigger: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 14, paddingVertical: 12 },
  value: { fontSize: 14, color: "#1e1b4b", fontWeight: "500" },
  placeholder: { color: "#c4b5fd" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", marginTop: 4, zIndex: 100, ...SHADOWS.medium },
  option: { paddingHorizontal: 14, paddingVertical: 10 },
  optionActive: { backgroundColor: "#f5f3ff" },
  optionText: { fontSize: 14, color: "#4b5563" },
  optionTextActive: { color: COLORS.primary, fontWeight: "700" },
});