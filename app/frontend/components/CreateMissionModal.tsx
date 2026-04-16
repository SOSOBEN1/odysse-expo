import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Image, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Alert,
} from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (mission: any) => void;
  initialData?: any;
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
  const { userId } = useUser();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [dureeMin,    setDureeMin]    = useState("");
  const [difficulty,  setDifficulty]  = useState<number | "">("");
  const [priority,    setPriority]    = useState<number | "">("");
  const [saving,      setSaving]      = useState(false);

  // ✅ Reset complet à chaque ouverture/fermeture + pré-remplissage si édition
  useEffect(() => {
    if (visible) {
      // initialData contient les clés Supabase : titre, description, duree_min, difficulte, priorite
      setTitle(initialData?.titre ?? "");
      setDescription(initialData?.description ?? "");
      setDureeMin(initialData?.duree_min ? String(initialData.duree_min) : "");
      setDifficulty(initialData?.difficulte ?? "");
      setPriority(initialData?.priorite ?? "");
    } else {
      // ✅ Reset à la fermeture pour ne pas garder les anciennes valeurs
      setTitle("");
      setDescription("");
      setDureeMin("");
      setDifficulty("");
      setPriority("");
    }
  }, [visible, initialData]);

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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire");
      return;
    }
    if (difficulty === "") {
      Alert.alert("Erreur", "La difficulté est obligatoire");
      return;
    }
    if (priority === "") {
      Alert.alert("Erreur", "La priorité est obligatoire");
      return;
    }

    setSaving(true);

    try {
      const gains = computeGains(difficulty as number, priority as number);

      const missionData = {
        titre:       title.trim(),
        description: description.trim() || null,
        duree_min:   dureeMin ? parseInt(dureeMin) : null,
        difficulte:  difficulty,
        priorite:    priority,
        ...gains,
        id_boss:     initialData?.id_boss ?? null,
      };

      let result;

      if (initialData?.id_mission) {
        // ── Modification ──────────────────────────────────────────────
        const { data, error } = await supabase
          .from("mission")
          .update(missionData)
          .eq("id_mission", initialData.id_mission)
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log("✅ Mission modifiée:", result);
      } else {
        // ── Création ──────────────────────────────────────────────────
        const { data, error } = await supabase
          .from("mission")
          .insert(missionData)
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log("✅ Mission créée:", result);
      }

      onSave(result);  // notifie le parent
      onClose();       // ferme la modal

    } catch (err: any) {
      console.error("❌ Erreur save mission:", err.message);
      Alert.alert("Erreur", `Impossible d'enregistrer : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6b7280" />
          </TouchableOpacity>

          <View style={modalStyles.header}>
            <Image
              source={require("../assets/Hibou/happy.png")}
              style={modalStyles.hibou}
              resizeMode="contain"
            />
            <View style={modalStyles.headerBubble}>
              <Text style={modalStyles.headerText}>
                {initialData?.id_mission ? "Modifions notre\nmission..." : "Créons notre\nmission..."}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.form}>

            {/* TITRE */}
            <Text style={modalStyles.label}>Titre *</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="Saisir le titre"
              placeholderTextColor="#c4b5fd"
              value={title}
              onChangeText={setTitle}
            />

            {/* DESCRIPTION */}
            <Text style={[modalStyles.label, { marginTop: 14 }]}>Description</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              placeholder="Décrivez la mission..."
              placeholderTextColor="#c4b5fd"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* DURÉE + DIFFICULTÉ */}
            <View style={modalStyles.row}>
              <View style={modalStyles.half}>
                <Text style={modalStyles.label}>Durée (min)</Text>
                <TextInput
                  style={modalStyles.input}
                  placeholder="ex: 90"
                  placeholderTextColor="#c4b5fd"
                  value={dureeMin}
                  onChangeText={(v) => setDureeMin(v.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                />
              </View>
              <View style={modalStyles.half}>
                <Text style={modalStyles.label}>Difficulté *</Text>
                <Dropdown
                  label="Difficulté"
                  value={difficulty}
                  options={DIFFICULTIES}
                  onSelect={setDifficulty}
                />
              </View>
            </View>

            {/* PRIORITÉ */}
            <Text style={[modalStyles.label, { marginTop: 14 }]}>Priorité *</Text>
            <Dropdown
              label="Priorité"
              value={priority}
              options={PRIORITIES}
              onSelect={setPriority}
            />

            {/* APERÇU DES GAINS */}
            {difficulty !== "" && priority !== "" && (
              <View style={modalStyles.gainsBox}>
                <Text style={modalStyles.gainsTitle}>✨ Gains estimés</Text>
                {(() => {
                  const g = computeGains(difficulty as number, priority as number);
                  return (
                    <View style={modalStyles.gainsRow}>
                      <Text style={modalStyles.gainItem}>⚡ -{g.energie_cout} Énergie</Text>
                      <Text style={modalStyles.gainItem}>🏆 +{g.xp_gain} XP</Text>
                      <Text style={modalStyles.gainItem}>📚 +{g.connaissance_gain} Connaissance</Text>
                      <Text style={modalStyles.gainItem}>📋 +{g.organisation_gain} Organisation</Text>
                    </View>
                  );
                })()}
              </View>
            )}

            {/* BOUTON SAVE */}
            <TouchableOpacity
              style={[modalStyles.saveBtn, { opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={modalStyles.saveBtnText}>
                {saving ? "Enregistrement..." : initialData?.id_mission ? "Modifier" : "Créer la mission"}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  container:    { backgroundColor: "#f5f3ff", borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: "90%", paddingTop: 16 },
  closeBtn:     { position: "absolute", top: 16, right: 16, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.light },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  hibou:        { width: 70, height: 70 },
  headerBubble: { backgroundColor: "#e9d5ff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, flex: 1 },
  headerText:   { fontSize: 16, fontWeight: "800", color: "#4c1d95", lineHeight: 22 },
  form:         { paddingHorizontal: 20, paddingBottom: 30 },
  label:        { fontSize: 13, fontWeight: "700", color: "#4c1d95", marginBottom: 6 },
  input:        { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1e1b4b" },
  textarea:     { height: 90, textAlignVertical: "top" },
  row:          { flexDirection: "row", gap: 12, marginTop: 14 },
  half:         { flex: 1 },
  gainsBox:     { backgroundColor: "#ede9fe", borderRadius: 16, padding: 14, marginTop: 16 },
  gainsTitle:   { fontWeight: "800", color: "#4c1d95", marginBottom: 8, fontSize: 13 },
  gainsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gainItem:     { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: "#4c1d95", fontWeight: "600" },
  saveBtn:      { backgroundColor: COLORS.primary, borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 24, ...SHADOWS.medium },
  saveBtnText:  { color: "#fff", fontWeight: "800", fontSize: 16 },
});

const dd = StyleSheet.create({
  wrapper:         { position: "relative", zIndex: 10 },
  trigger:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", paddingHorizontal: 14, paddingVertical: 12 },
  value:           { fontSize: 14, color: "#1e1b4b", fontWeight: "500" },
  placeholder:     { color: "#c4b5fd" },
  dropdown:        { position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#e9d5ff", marginTop: 4, zIndex: 100, ...SHADOWS.medium },
  option:          { paddingHorizontal: 14, paddingVertical: 10 },
  optionActive:    { backgroundColor: "#f5f3ff" },
  optionText:      { fontSize: 14, color: "#4b5563" },
  optionTextActive:{ color: COLORS.primary, fontWeight: "700" },
});
