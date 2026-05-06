import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (mission: any) => void;
  initialData?: any; // Pour la modification
};

const DIFFICULTIES: { label: string; value: number }[] = [
  { label: "Facile",    value: 1 },
  { label: "Moyen",     value: 2 },
  { label: "Difficile", value: 3 },
];
const PRIORITIES: { label: string; value: number }[] = [
  { label: "Basse",   value: 1 },
  { label: "Normale", value: 2 },
  { label: "Haute",   value: 3 },
  { label: "Urgente", value: 4 },
];

function Dropdown({ label, value, options, onSelect }: {
  label: string;
  value: any;
  options: { label: string; value: any }[] | string[];
  onSelect: (v: any) => void;
}) {
  const [open, setOpen] = useState(false);

  const getLabel = (v: any) => {
    if (typeof options[0] === "string") return v;
    return (options as { label: string; value: any }[]).find(o => o.value === v)?.label ?? "";
  };

  const opts = typeof options[0] === "string"
    ? (options as string[]).map(o => ({ label: o, value: o }))
    : (options as { label: string; value: any }[]);

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={dd.trigger} onPress={() => setOpen(!open)}>
        <Text style={[dd.value, (value === "" || value === null || value === undefined) && dd.placeholder]}>
          {value !== "" && value !== null && value !== undefined ? getLabel(value) : "Sélectionner"}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={COLORS.primary} />
      </TouchableOpacity>
      {open && (
        <View style={dd.dropdown}>
          {opts.map((opt) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[dd.option, value === opt.value && dd.optionActive]}
              onPress={() => { onSelect(opt.value); setOpen(false); }}
            >
              <Text style={[dd.optionText, value === opt.value && dd.optionTextActive]}>
                {opt.label}
              </Text>
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
  const [dureeMin,    setDureeMin]    = useState("");
  const [difficulty,  setDifficulty]  = useState<number | "">("");
  const [priority,    setPriority]    = useState<number | "">("");
  const [saving,      setSaving]      = useState(false);

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

<<<<<<< HEAD
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
=======
  const computeGains = (diff: number, prio: number) => {
    const base      = diff * 10;
    const prioBonus = prio * 5;
    return {
      xp_gain:            base + prioBonus,
      energie_cout:       diff * 8,
      stress_gain:        diff * 5,
      connaissance_gain:  base,
      organisation_gain:  prioBonus,
    };
  };

  // ── Gestion du DateTimePicker ──
  const handleDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    if (!selected) return;

    if (pickerMode === "date") {
      // On garde l'heure actuelle ou celle déjà choisie
      const base = dateLimite ?? new Date();
      const merged = new Date(selected);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setDateLimite(merged);

      // Sur Android on enchaîne avec l'heure
      if (Platform.OS === "android") {
        setPickerMode("time");
        setShowTimePicker(true);
      }
    } else {
      // Fusion heure dans la date déjà choisie
      const merged = dateLimite ? new Date(dateLimite) : new Date();
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setDateLimite(merged);
    }
  };

  const openDatePicker = () => {
    setPickerMode("date");
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setPickerMode("time");
    setShowTimePicker(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Erreur", "Le titre est obligatoire"); return; }
    if (difficulty === "") { Alert.alert("Erreur", "La difficulté est obligatoire"); return; }
    if (priority === "") { Alert.alert("Erreur", "La priorité est obligatoire"); return; }

    setSaving(true);
    try {
      const gains = computeGains(difficulty as number, priority as number);
const missionData = {
  titre:       title.trim(),
  description: description.trim() || null,
  duree_min:   dureeMin ? parseInt(dureeMin) : null,
  difficulte:  difficulty,
  priorite:    priority,
  date_limite: dateLimite ? dateLimite.toISOString() : null,
  ...gains,
  id_boss: initialData?.id_boss ?? null,
};

let result;

if (initialData?.id_mission) {
  const { data, error } = await supabase
    .from("mission")
    .update(missionData)
    .eq("id_mission", initialData.id_mission)
    .select()
    .single();
  if (error) throw error;
  result = data;
} else {
  const { data, error } = await supabase
    .from("mission")
    .insert({
      ...missionData,
      id_user: userId, 
      id_defi: initialData?.id_defi ?? null, // ✅ ajouter ici
    })
    .select()
    .single();
  if (error) throw error;
  result = data;
}

      onSave(result);
      onClose();
    } catch (err: any) {
      Alert.alert("Erreur", `Impossible d'enregistrer : ${err.message}`);
    } finally {
      setSaving(false);
    }
>>>>>>> sonia
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
